import * as THREE from 'three/webgpu'
import {
  float,
  vec2,
  vec3,
  vec4,
  uniform,
  normalWorld,
  positionWorld,
  cameraPosition,
  cameraViewMatrix,
  cameraProjectionMatrix,
  refract,
  vertexStage,
  viewportTexture,
  viewportMipTexture,
  viewportSafeUV,
  cos,
  sin,
  fract,
  dot,
  screenCoordinate,
} from 'three/tsl'

// Multi-layer glass material using ordered transparency with per-object framebuffer capture.
// Backface meshes (renderOrder 1) sample the framebuffer → see the opaque scene.
// Frontface meshes (renderOrder 2) sample the framebuffer → see scene + backfaces.
// This gives multi-layer refraction that Three.js's single-layer transmission cannot.
export class TransmissionMaterial {
  #uIOR
  #uThickness
  #uDispersion
  #uTransmission
  #uAttenuationColor
  #uAttenuationDistance
  #uFrostBlur
  #uFrostNoiseAmplitude
  #uFrostNoiseFrequency
  #blurMode

  constructor(options = {}) {
    const p = {
      color: '#ffffff',
      transmission: 1,
      thickness: 1.5,
      roughness: 0.05,
      ior: 1.5,
      dispersion: 0,
      frostBlur: 0,
      frostNoiseAmplitude: 0.5,
      frostNoiseFrequency: 1,
      blurMode: 'mip', // 'mip' (4-sample rotated) or 'blue' (1-sample blue noise disk)
      attenuationColor: '#ffffff',
      attenuationDistance: 2,
      envMapIntensity: 1,
      iridescence: 0,
      iridescenceIOR: 1.3,
      iridescenceThicknessMin: 100,
      iridescenceThicknessMax: 400,
      clearcoat: 0,
      clearcoatRoughness: 0,
      specularIntensity: 1,
      specularColor: '#ffffff',
      ...options,
    }

    // TSL uniforms (shared across back/front materials)
    this.#uIOR = uniform(p.ior)
    this.#uThickness = uniform(p.thickness)
    this.#uDispersion = uniform(p.dispersion)
    this.#uTransmission = uniform(p.transmission)
    this.#uAttenuationColor = uniform(new THREE.Color(p.attenuationColor))
    this.#uAttenuationDistance = uniform(p.attenuationDistance)
    this.#uFrostBlur = uniform(p.frostBlur)
    this.#uFrostNoiseAmplitude = uniform(p.frostNoiseAmplitude)
    this.#uFrostNoiseFrequency = uniform(p.frostNoiseFrequency)
    this.#blurMode = p.blurMode

    this.backMaterial = this.#createMaterial(THREE.BackSide, p)
    this.frontMaterial = this.#createMaterial(THREE.FrontSide, p)
  }

  // Build a backdrop node that refracts the viewport texture with spectral dispersion,
  // chromatic aberration, and frosted glass blur (mip or blue noise mode).
  //
  // Spectral dispersion: physically-based wavelength-dependent IOR using Cauchy
  // approximation (Three.js approach). Each RGB channel refracts at a different IOR,
  // producing prismatic rainbow bands along edges.
  //
  // Chromatic aberration: artistic UV offset that shifts R/B channels along the
  // refraction direction for extra colour fringing.
  //
  // Traces refracted rays through the glass volume in world space, then projects
  // exit points back to screen UV. Each call creates a NEW viewportMipTexture
  // (own FramebufferTexture), so back/front materials capture the framebuffer independently.
  #createBackdrop() {
    // Compute refraction UV in vertex stage — the heavy math (refract + 2x mat4 multiply)
    // runs per-vertex and is interpolated to fragments via varyings. For flat box faces
    // the interpolation is exact (constant normal → linear variation across face).
    const v = cameraPosition.sub(positionWorld).normalize()
    const n = normalWorld.normalize()

    // ── Spectral dispersion: wavelength-dependent IOR (Cauchy approximation) ──
    // halfSpread = (ior - 1) * 0.025 * dispersion  (same formula as Three.js)
    const halfSpread = this.#uIOR.sub(1).mul(0.025).mul(this.#uDispersion)
    const iorR = this.#uIOR.sub(halfSpread) // red — longer wavelength, lower IOR
    const iorB = this.#uIOR.add(halfSpread) // blue — shorter wavelength, higher IOR

    // Project refracted exit point to screen UV for a given IOR
    const computeExitUV = (ior) => {
      const R = refract(v.negate(), n, float(1).div(ior))
      const ray = R.normalize().mul(this.#uThickness)
      const exit = positionWorld.add(ray)
      const clip = cameraProjectionMatrix.mul(cameraViewMatrix.mul(vec4(exit, 1)))
      const ndc = clip.xy.div(clip.w).mul(0.5).add(0.5)
      return vec2(ndc.x, ndc.y.oneMinus())
    }

    // 3 refraction UVs — one per wavelength band (vertex stage → varyings)
    const uvRraw = computeExitUV(iorR)
    const uvGraw = computeExitUV(this.#uIOR)
    const uvBraw = computeExitUV(iorB)

    // Move to vertex stage — GPU interpolates these as varyings to fragment shader
    const uvR_base = vertexStage(uvRraw)
    const uvCenter = vertexStage(uvGraw)
    const uvB_base = vertexStage(uvBraw)

    let backdrop

    if (this.#blurMode === 'blue') {
      // ── Blue noise single-sample blur ──────────────────────────────────────
      // Adapted from "Blue noise disk blur" https://www.shadertoy.com/view/XsVBDR
      // hash23 from "Hash without Sine" https://www.shadertoy.com/view/4djSRW
      //
      // Single-sample disk blur: one noise-directed offset per pixel. No mip
      // generation — the hash distributes offsets evenly across neighbouring
      // pixels, so the eye integrates a smooth blur. 3 texture reads (chromatic R/G/B).
      const coord = screenCoordinate.xy.mul(this.#uFrostNoiseFrequency)
      const p = fract(vec3(coord, 0).mul(vec3(443.897, 441.423, 0.0973)))
      const d = dot(p, vec3(p.y, p.z, p.x).add(19.19))
      const q = p.add(d)
      const r = fract(vec2(q.x, q.x).add(vec2(q.y, q.z)).mul(vec2(q.z, q.y)))

      // Uniform disk sampling: angle from r.x, radius from sqrt(r.y) for area-uniform
      const angle = r.x.mul(Math.PI * 2)
      const radius = r.y.sqrt()
      const cr = vec2(sin(angle), cos(angle)).mul(radius)
      const offset = cr.mul(this.#uFrostBlur.mul(this.#uFrostNoiseAmplitude).mul(0.06))

      // Single offset applied to all 3 chromatic channels (no mips — disk offset provides the blur)
      const vt = viewportTexture(viewportSafeUV(uvCenter.add(offset)))
      vt.updateBeforeType = 'object'

      const samp = (uv) => {
        const node = vt.sample(viewportSafeUV(uv.add(offset)))
        node.updateBeforeType = 'none'
        return node
      }

      const sR = samp(uvR_base)
      const sB = samp(uvB_base)
      backdrop = vec3(sR.r, vt.g, sB.b)
    } else {
      // ── Mip blur: 4 IGN-rotated samples ────────────────────────────────────
      const lod = this.#uFrostBlur.mul(6)
      const blurUV = this.#uFrostBlur.mul(0.04)

      // Interleaved Gradient Noise (Jimenez 2014) — per-pixel sample rotation
      const ign = fract(float(52.9829189).mul(fract(dot(screenCoordinate.xy, vec2(0.06711056, 0.00583715)))))
      const angle = ign.mul(Math.PI * 2)
      const ca = cos(angle)
      const sa = sin(angle)

      // 4 offset directions on unit circle, 90° apart
      const off0 = vec2(ca, sa).mul(blurUV)
      const off1 = vec2(sa.negate(), ca).mul(blurUV)
      const off2 = vec2(ca.negate(), sa.negate()).mul(blurUV)
      const off3 = vec2(sa, ca.negate()).mul(blurUV)

      // Per-pixel hash noise — simulates micro-surface scattering of frosted glass
      const noiseCoord = screenCoordinate.xy.mul(this.#uFrostNoiseFrequency)
      const noiseUV = fract(
        sin(vec2(dot(noiseCoord, vec2(127.1, 311.7)), dot(noiseCoord, vec2(269.5, 183.3)))).mul(43758.5453),
      )
      const noiseOffset = noiseUV.sub(0.5).mul(this.#uFrostNoiseAmplitude).mul(0.01)

      // Create ONE viewportMipTexture per material; .sample() reuses the same framebuffer mip chain
      const vt = viewportMipTexture(viewportSafeUV(uvCenter.add(off0).add(noiseOffset)), lod)
      vt.updateBeforeType = 'object' // copy framebuffer + generate mips before each mesh draw

      const samp = (uv) => {
        const node = vt.sample(viewportSafeUV(uv.add(noiseOffset)))
        node.levelNode = lod
        node.updateBeforeType = 'none'
        return node
      }

      // 4 chromatic blur samples — each reads R/G/B at dispersion-offset UVs
      const s0r = samp(uvR_base.add(off0))
      const s0b = samp(uvB_base.add(off0))
      const c0 = vec3(s0r.r, vt.g, s0b.b)

      const chromaticBlurSample = (off) =>
        vec3(samp(uvR_base.add(off)).r, samp(uvCenter.add(off)).g, samp(uvB_base.add(off)).b)
      const c1 = chromaticBlurSample(off1)
      const c2 = chromaticBlurSample(off2)
      const c3 = chromaticBlurSample(off3)

      backdrop = c0.add(c1).add(c2).add(c3).mul(0.25)
    }

    // Volume attenuation (Beer-Lambert): tint light passing through thick glass
    const absorbance = this.#uAttenuationColor.log().negate().mul(this.#uThickness).div(this.#uAttenuationDistance)
    const attenuation = absorbance.negate().exp()

    return backdrop.mul(attenuation)
  }

  #createMaterial(side, p) {
    const mat = new THREE.MeshPhysicalNodeMaterial()
    mat.side = side
    mat.transparent = true
    mat.depthWrite = false
    mat.color.set(p.color)
    mat.roughness = p.roughness
    mat.ior = p.ior
    mat.envMapIntensity = p.envMapIntensity
    mat.specularIntensity = p.specularIntensity
    mat.specularColor.set(p.specularColor)

    if (side === THREE.FrontSide) {
      // Full PBR on frontface — this is what the viewer sees directly
      mat.iridescence = p.iridescence
      mat.iridescenceIOR = p.iridescenceIOR
      mat.iridescenceThicknessRange = [p.iridescenceThicknessMin, p.iridescenceThicknessMax]
      mat.clearcoat = p.clearcoat
      mat.clearcoatRoughness = p.clearcoatRoughness
    }
    // Backface skips iridescence + clearcoat — the frontface covers it,
    // and dropping these features reduces the fragment shader cost.

    mat.backdropNode = this.#createBackdrop()
    mat.backdropAlphaNode = this.#uTransmission
    return mat
  }

  // ─── Property setters ───────────────────────────────────────────────────────

  set color(v) {
    this.backMaterial.color.set(v)
    this.frontMaterial.color.set(v)
  }

  set transmission(v) {
    this.#uTransmission.value = v
  }
  set thickness(v) {
    this.#uThickness.value = v
  }

  set roughness(v) {
    this.backMaterial.roughness = v
    this.frontMaterial.roughness = v
  }

  set ior(v) {
    this.#uIOR.value = v
    this.backMaterial.ior = v
    this.frontMaterial.ior = v
  }

  set dispersion(v) {
    this.#uDispersion.value = v
  }
  set frostBlur(v) {
    this.#uFrostBlur.value = v
  }
  set frostNoiseAmplitude(v) {
    this.#uFrostNoiseAmplitude.value = v
  }
  set frostNoiseFrequency(v) {
    this.#uFrostNoiseFrequency.value = v
  }

  set attenuationColor(v) {
    this.#uAttenuationColor.value.set(v)
  }
  set attenuationDistance(v) {
    this.#uAttenuationDistance.value = v
  }

  set envMapIntensity(v) {
    this.backMaterial.envMapIntensity = v
    this.frontMaterial.envMapIntensity = v
  }

  set iridescence(v) {
    this.frontMaterial.iridescence = v
  }
  set iridescenceIOR(v) {
    this.frontMaterial.iridescenceIOR = v
  }
  set iridescenceThicknessRange(v) {
    this.frontMaterial.iridescenceThicknessRange = v
  }

  set clearcoat(v) {
    this.frontMaterial.clearcoat = v
  }
  set clearcoatRoughness(v) {
    this.frontMaterial.clearcoatRoughness = v
  }

  set specularIntensity(v) {
    this.backMaterial.specularIntensity = v
    this.frontMaterial.specularIntensity = v
  }

  set specularColor(v) {
    this.backMaterial.specularColor.set(v)
    this.frontMaterial.specularColor.set(v)
  }

  // Convenience: create a double-sided glass mesh group from a geometry.
  // Back mesh gets renderOrder 1, front mesh gets renderOrder 2.
  createMesh(geometry) {
    const group = new THREE.Group()
    const back = new THREE.Mesh(geometry, this.backMaterial)
    back.renderOrder = 1
    const front = new THREE.Mesh(geometry, this.frontMaterial)
    front.renderOrder = 2
    group.add(back, front)
    return group
  }
}
