import * as THREE from 'three/webgpu'
import {
  Fn,
  If,
  Loop,
  float,
  int,
  uint,
  vec3,
  uniform,
  select,
  mix,
  uv,
  attribute,
  instancedArray,
  instanceIndex,
  vertexIndex,
  dot,
  length,
  sin,
  cos,
  floor,
  fract,
  normalize,
  cross,
  max,
  min,
  positionLocal,
  cameraViewMatrix,
  TWO_PI,
  smoothstep,
  deltaTime,
  Return,
} from 'three/tsl'
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js'
import { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'stats-gl'
import GUI from 'lil-gui'

// ── Params (single source of truth for configurable values) ─────────────────
const params = {
  debug: false,
  showPaths: false,

  noodleCount: 100,
  pathFraction: 0.08, // fraction of flight path each noodle occupies
  tubeRadius: 0.5,

  // Mouse interaction (boids repulsion)
  mouseAttract: false,
  mouseZ: -5,
  mouseRadius: 12,
  mouseForce: 80,
  returnSpring: 6,
  damping: 2,
  mouseBodyForce: 3,
  mouseBodyDecay: 2,
  separationRadius: 5,
  separationAmplitude: 2,

  // Camera
  cameraFov: 50,
  cameraDistance: 25,

  // Parallax
  parallaxAmountX: 2,
  parallaxAmountY: 1.5,
  parallaxSmoothing: 0.05,

  // Material
  roughness: 0.2,
  metalness: 0.0,
  clearcoat: 0.6,
  clearcoatRoughness: 0.1,
  colorGradientMix: 0.3,

  // Tonemapping
  toneMapping: 'ACES',

  // Text
  textColor: '#fff',

  // Background gradient
  bgColorCenter: '#212f78',
  bgColorEdge: '#0d122b',

  // Lighting
  ambientIntensity: 0.7,
  dirLight1Intensity: 1.5,
  dirLight1X: 10,
  dirLight1Y: 15,
  dirLight1Z: 10,
  dirLight2Intensity: 0.4,
  dirLight2X: -8,
  dirLight2Y: -5,
  dirLight2Z: 8,
  shadowLightIntensity: 1.2,
  shadowLightX: 5,
  shadowLightY: 20,
  shadowLightZ: 10,
}

const PALETTE = [
  0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xff6eb4, 0xffa726, 0xab47bc, 0x26c6da, 0x7e57c2, 0x66bb6a, 0xff7043,
  0x42a5f5, 0xec407a, 0xffca28, 0x26a69a,
]

const TUBE_SEGMENTS = 60
const RADIAL_SEGMENTS = 10
const PATH_SAMPLES = 256
const VERTS_PER_NOODLE = (TUBE_SEGMENTS + 1) * (RADIAL_SEGMENTS + 1)
const SPINE_POINTS = TUBE_SEGMENTS + 1
const TOTAL_VERTICES = params.noodleCount * VERTS_PER_NOODLE
const TOTAL_SPINE = params.noodleCount * SPINE_POINTS

// ── Curve generator ────────────────────────────────────────────────────────
function generateFlightPath() {
  const points = []
  const numPoints = 5 + Math.floor(Math.random() * 4)
  const radiusX = 10 + Math.random() * 12
  const radiusY = 7 + Math.random() * 8
  const centerX = (Math.random() - 0.5) * 6
  const centerY = (Math.random() - 0.5) * 4
  const centerZ = -5 + Math.random() * 8

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radiusX + centerX + (Math.random() - 0.5) * 5,
        Math.sin(angle) * radiusY + centerY + (Math.random() - 0.5) * 4,
        Math.sin(angle * 1.5) * 4 + centerZ,
      ),
    )
  }

  return new THREE.CatmullRomCurve3(points, true)
}

// ── Pre-sample flight paths into GPU storage buffers ────────────────────────
const flightPaths = Array.from({ length: params.noodleCount }, generateFlightPath)

const pathSamplesData = new Float32Array(params.noodleCount * PATH_SAMPLES * 3)
const _v = new THREE.Vector3()
for (let n = 0; n < params.noodleCount; n++) {
  for (let s = 0; s < PATH_SAMPLES; s++) {
    flightPaths[n].getPointAt(s / PATH_SAMPLES, _v)
    const base = (n * PATH_SAMPLES + s) * 3
    pathSamplesData[base] = _v.x
    pathSamplesData[base + 1] = _v.y
    pathSamplesData[base + 2] = _v.z
  }
}
const pathSamples = instancedArray(pathSamplesData, 'vec3')

// Per-noodle params: (speed, timeOffset, pathFractionScale, mouseInfluenceFactor)
const noodleParamsData = new Float32Array(params.noodleCount * 4)
for (let i = 0; i < params.noodleCount; i++) {
  const base = i * 4
  noodleParamsData[base] = 0.02 + Math.random() * 0.06
  noodleParamsData[base + 1] = Math.random()
  noodleParamsData[base + 2] = 0.8 + Math.random() * 0.4
  noodleParamsData[base + 3] = 0.3 + Math.random() * 1.0
}
const noodleParams = instancedArray(noodleParamsData, 'vec4')

// Per-noodle colors
const noodleColorsData = new Float32Array(params.noodleCount * 3)
const _c = new THREE.Color()
for (let i = 0; i < params.noodleCount; i++) {
  _c.set(PALETTE[i % PALETTE.length])
  const base = i * 3
  noodleColorsData[base] = _c.r
  noodleColorsData[base + 1] = _c.g
  noodleColorsData[base + 2] = _c.b
}
const noodleColors = instancedArray(noodleColorsData, 'vec3')

// Spine positions (compute pass 1 → pass 2/3 + cap materials)
const spinePositions = instancedArray(TOTAL_SPINE, 'vec3')

// Parallel-transport frames (compute pass 2 → pass 3)
const frameNormals = instancedArray(TOTAL_SPINE, 'vec3')
const frameBinormals = instancedArray(TOTAL_SPINE, 'vec3')

// Vertex positions and normals (compute pass 3 → tube material)
const vertexPositions = instancedArray(TOTAL_VERTICES, 'vec3')
const vertexNormals = instancedArray(TOTAL_VERTICES, 'vec3')

// Per-spine-point persistent path offsets (for gradual path bending + decay)
const spineOffsets = instancedArray(TOTAL_SPINE, 'vec3')

// Per-noodle boids state (persistent across frames)
const noodleOffsets = instancedArray(params.noodleCount, 'vec3')
const noodleVelocities = instancedArray(params.noodleCount, 'vec3')
const noodleCentroids = instancedArray(params.noodleCount, 'vec3')

// ── Shared uniforms ─────────────────────────────────────────────────────────
const elapsedU = uniform(0)
const mouseWorldPosU = uniform(new THREE.Vector3(0, 0, params.mouseZ))
const mouseSignU = uniform(params.mouseAttract ? -1 : 1)
const mouseRadiusU = uniform(params.mouseRadius)
const mouseForceU = uniform(params.mouseForce)
const mouseBodyForceU = uniform(params.mouseBodyForce)
const mouseBodyDecayU = uniform(params.mouseBodyDecay)
const returnSpringU = uniform(params.returnSpring)
const dampingU = uniform(params.damping)
const separationRadiusU = uniform(params.separationRadius)
const separationAmplitudeU = uniform(params.separationAmplitude)
const pathFractionU = uniform(params.pathFraction)
const tubeRadiusU = uniform(params.tubeRadius)
const roughnessU = uniform(params.roughness)
const metalnessU = uniform(params.metalness)
const clearcoatU = uniform(params.clearcoat)
const clearcoatRoughnessU = uniform(params.clearcoatRoughness)
const colorGradientMixU = uniform(params.colorGradientMix)

// ── Compute Pass 1: Spine positions (raw path sampling, no interaction) ─────
const computeSpine = Fn(() => {
  If(instanceIndex.greaterThanEqual(uint(TOTAL_SPINE)), () => { Return() })

  const idx = instanceIndex
  const noodleIdx = idx.div(uint(SPINE_POINTS))
  const segIdx = idx.mod(uint(SPINE_POINTS))

  const np = noodleParams.element(noodleIdx)
  const pathFrac = pathFractionU.mul(np.z)
  const tStart = fract(elapsedU.mul(np.x).add(np.y))
  const t = fract(tStart.add(segIdx.toFloat().div(float(TUBE_SEGMENTS)).mul(pathFrac)))

  // Linear interpolation between pre-sampled path points (wrapping)
  const sF = t.mul(float(PATH_SAMPLES))
  const sI = floor(sF).toUint()
  const sFrac = fract(sF)
  const base = noodleIdx.mul(uint(PATH_SAMPLES))
  const i0 = base.add(sI.mod(uint(PATH_SAMPLES)))
  const i1 = base.add(sI.add(uint(1)).mod(uint(PATH_SAMPLES)))

  spinePositions.element(idx).assign(mix(pathSamples.element(i0), pathSamples.element(i1), sFrac))
})().compute(TOTAL_SPINE)

// ── Compute Pass 1.5: Noodle centroids (1 thread/noodle) ──────────────────
const computeCentroids = Fn(() => {
  If(instanceIndex.greaterThanEqual(uint(params.noodleCount)), () => { Return() })

  const noodleIdx = instanceIndex
  const spineBase = noodleIdx.mul(uint(SPINE_POINTS))

  const centroid = vec3(0, 0, 0).toVar()
  Loop(int(SPINE_POINTS), ({ i }) => {
    centroid.addAssign(spinePositions.element(spineBase.add(uint(i))))
  })
  centroid.divAssign(float(SPINE_POINTS))
  centroid.addAssign(noodleOffsets.element(noodleIdx))

  noodleCentroids.element(noodleIdx).assign(centroid)
})().compute(params.noodleCount)

// ── Compute Pass 1.75: Boids-like repulsion (1 thread/noodle) ─────────────
const computeRepulsion = Fn(() => {
  If(instanceIndex.greaterThanEqual(uint(params.noodleCount)), () => { Return() })

  const noodleIdx = instanceIndex

  const offset = noodleOffsets.element(noodleIdx)
  const vel = noodleVelocities.element(noodleIdx)
  const dt = min(deltaTime, float(0.05))

  const centroid = noodleCentroids.element(noodleIdx)
  const force = vec3(0, 0, 0).toVar()

  // ── Mouse repulsion ──
  const toMouse = centroid.sub(mouseWorldPosU)
  const mouseDist = length(toMouse)
  If(mouseDist.greaterThan(0.001).and(mouseDist.lessThan(mouseRadiusU)), () => {
    const repelDir = toMouse.div(mouseDist)
    const falloff = smoothstep(mouseRadiusU, float(0), mouseDist)
    const np = noodleParams.element(noodleIdx)
    force.addAssign(repelDir.mul(mouseSignU).mul(mouseForceU.mul(np.w).mul(falloff)))
  })

  // ── Noodle-to-noodle separation ──
  Loop(int(params.noodleCount), ({ i }) => {
    If(i.notEqual(int(noodleIdx)), () => {
      const otherCentroid = noodleCentroids.element(uint(i))
      const away = centroid.sub(otherCentroid)
      const dist = length(away)
      If(dist.greaterThan(0.001).and(dist.lessThan(separationRadiusU)), () => {
        const sepDir = away.div(dist)
        const sepFalloff = smoothstep(separationRadiusU, float(0), dist)
        force.addAssign(sepDir.mul(separationAmplitudeU.mul(sepFalloff)))
      })
    })
  })

  // ── Return-to-origin spring ──
  force.subAssign(offset.mul(returnSpringU))

  // ── Velocity damping ──
  force.subAssign(vel.mul(dampingU))

  // ── Integrate (semi-implicit Euler) ──
  vel.addAssign(force.mul(dt))
  offset.addAssign(vel.mul(dt))
})().compute(params.noodleCount)

// ── Compute Pass 2: Apply offset + parallel-transport frames (1 thread/noodle)
const computeFrames = Fn(() => {
  If(instanceIndex.greaterThanEqual(uint(params.noodleCount)), () => { Return() })

  const noodleIdx = instanceIndex
  const spineBase = noodleIdx.mul(uint(SPINE_POINTS))

  // Apply boids offset + persistent path deflection with decay
  const offset = noodleOffsets.element(noodleIdx)
  const dt = min(deltaTime, float(0.05))
  const accumForce = vec3(0, 0, 0).toVar()

  Loop(int(SPINE_POINTS), ({ i }) => {
    const idx = spineBase.add(uint(i))
    const pos = spinePositions.element(idx)
    pos.addAssign(offset)

    // Accumulate deflection along spine for smooth path bending
    const toMouse = pos.sub(mouseWorldPosU)
    const dist = length(toMouse)
    If(dist.greaterThan(0.001).and(dist.lessThan(mouseRadiusU)), () => {
      const dir = toMouse.div(dist)
      const falloff = smoothstep(mouseRadiusU, float(0), dist)
      accumForce.addAssign(dir.mul(mouseSignU).mul(mouseBodyForceU.mul(falloff).div(float(TUBE_SEGMENTS))))
    })

    // Persistent offset: lerp toward deflection target (fast), decay to zero (slow)
    const stored = spineOffsets.element(idx)
    const hasTarget = smoothstep(float(0), float(0.001), length(accumForce))
    const rate = mix(mouseBodyDecayU, float(10), hasTarget).mul(dt).saturate()
    stored.assign(mix(stored, accumForce, rate))

    pos.addAssign(stored)
  })

  // ── Parallel-transport frames from displaced positions ──
  const p0 = spinePositions.element(spineBase)
  const p1 = spinePositions.element(spineBase.add(uint(1)))
  const diff0 = p1.sub(p0)
  const diff0Len = length(diff0)
  const T = select(diff0Len.greaterThan(0.0001), diff0.div(diff0Len), vec3(0, 0, 1)).toVar()

  // Initial frame via branchless ONB (Duff et al. 2017)
  const s = select(T.z.greaterThanEqual(0), float(1), float(-1))
  const a = float(-1).div(s.add(T.z))
  const bv = T.x.mul(T.y).mul(a)
  const N = vec3(float(1).add(s.mul(T.x).mul(T.x).mul(a)), s.mul(bv), s.negate().mul(T.x)).toVar()

  frameNormals.element(spineBase).assign(N)
  frameBinormals.element(spineBase).assign(normalize(cross(T, N)))

  // Propagate frames along spine via parallel transport
  Loop(int(TUBE_SEGMENTS), ({ i }) => {
    const segIdx = i.add(1).toUint()

    // Central-difference tangent (clamped at boundary)
    const prevSeg = max(int(segIdx).sub(1), int(0)).toUint()
    const nextSeg = min(segIdx.add(uint(1)), uint(TUBE_SEGMENTS))
    const pPrev = spinePositions.element(spineBase.add(prevSeg))
    const pNext = spinePositions.element(spineBase.add(nextSeg))
    const diff = pNext.sub(pPrev)
    const diffLen = length(diff)
    const T2 = select(diffLen.greaterThan(0.0001), diff.div(diffLen), T).toVar()

    // Project previous normal onto plane perpendicular to new tangent
    const projected = N.sub(T2.mul(dot(N, T2))).toVar()
    const projLen = length(projected)

    If(projLen.greaterThan(0.001), () => {
      N.assign(projected.div(projLen))
    })

    T.assign(T2)

    frameNormals.element(spineBase.add(segIdx)).assign(N)
    frameBinormals.element(spineBase.add(segIdx)).assign(normalize(cross(T2, N)))
  })
})().compute(params.noodleCount)

// ── Compute Pass 3: Tube vertices from frames ──────────────────────────────
const computeVertices = Fn(() => {
  If(instanceIndex.greaterThanEqual(uint(TOTAL_VERTICES)), () => { Return() })

  const idx = instanceIndex
  const noodleIdx = idx.div(uint(VERTS_PER_NOODLE))
  const localIdx = idx.mod(uint(VERTS_PER_NOODLE))
  const segIdx = localIdx.div(uint(RADIAL_SEGMENTS + 1))
  const radIdx = localIdx.mod(uint(RADIAL_SEGMENTS + 1))

  const frameIdx = noodleIdx.mul(uint(SPINE_POINTS)).add(segIdx)
  const P = spinePositions.element(frameIdx)
  const N = frameNormals.element(frameIdx)
  const B = frameBinormals.element(frameIdx)

  // Tube cross-section vertex
  const angle = radIdx.toFloat().div(float(RADIAL_SEGMENTS)).mul(TWO_PI)
  const cx = tubeRadiusU.negate().mul(cos(angle))
  const cy = tubeRadiusU.mul(sin(angle))

  vertexPositions.element(idx).assign(P.add(N.mul(cx)).add(B.mul(cy)))
  vertexNormals.element(idx).assign(normalize(N.mul(cx).add(B.mul(cy))))
})().compute(TOTAL_VERTICES)

// ── Renderer ────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.setClearColor(0x000000, 0)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)
await renderer.init()

// ── Camera ──────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(params.cameraFov, window.innerWidth / window.innerHeight, 0.1, 200)
camera.position.z = params.cameraDistance

// Invisible overlay to capture pointer events for dragging in debug mode
const debugOverlay = document.createElement('div')
debugOverlay.style.cssText = 'position:fixed;inset:0;z-index:100;display:none;'
document.body.appendChild(debugOverlay)

const controls = new OrbitControls(camera, debugOverlay)
controls.enableDamping = true
controls.enabled = params.debug

// ── Scene ───────────────────────────────────────────────────────────────────
const scene = new THREE.Scene()

const ambientLight = new THREE.AmbientLight(0xffffff, params.ambientIntensity)
scene.add(ambientLight)

const dir1 = new THREE.DirectionalLight(0xffffff, params.dirLight1Intensity)
dir1.position.set(params.dirLight1X, params.dirLight1Y, params.dirLight1Z)
scene.add(dir1)

const dir2 = new THREE.DirectionalLight(0xffffff, params.dirLight2Intensity)
dir2.position.set(params.dirLight2X, params.dirLight2Y, params.dirLight2Z)
scene.add(dir2)

const shadowLight = new THREE.DirectionalLight(0xffffff, params.shadowLightIntensity)
shadowLight.position.set(params.shadowLightX, params.shadowLightY, params.shadowLightZ)
shadowLight.castShadow = true
shadowLight.shadow.mapSize.set(2048, 2048)
shadowLight.shadow.camera.left = -30
shadowLight.shadow.camera.right = 30
shadowLight.shadow.camera.top = 20
shadowLight.shadow.camera.bottom = -20
shadowLight.shadow.camera.near = 0.1
shadowLight.shadow.camera.far = 60
shadowLight.shadow.bias = -0.001
scene.add(shadowLight)

// ── Debug mouse sphere ──────────────────────────────────────────────────────
const debugSphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 }),
)
debugSphere.visible = false
scene.add(debugSphere)

// ── Tube geometry (single merged mesh for all noodles) ──────────────────────
const tubeGeometry = new THREE.BufferGeometry()

// Dummy position attribute (actual positions come via positionNode from compute)
tubeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(TOTAL_VERTICES * 3), 3))

// Pre-computed UVs: x = along tube length, y = around tube
const uvArray = new Float32Array(TOTAL_VERTICES * 2)
for (let n = 0; n < params.noodleCount; n++) {
  for (let seg = 0; seg <= TUBE_SEGMENTS; seg++) {
    for (let rad = 0; rad <= RADIAL_SEGMENTS; rad++) {
      const vi = n * VERTS_PER_NOODLE + seg * (RADIAL_SEGMENTS + 1) + rad
      uvArray[vi * 2] = seg / TUBE_SEGMENTS
      uvArray[vi * 2 + 1] = rad / RADIAL_SEGMENTS
    }
  }
}
tubeGeometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2))

// Per-vertex noodle index (for color lookup in material)
const noodleIndexArray = new Float32Array(TOTAL_VERTICES)
for (let n = 0; n < params.noodleCount; n++) {
  for (let v = 0; v < VERTS_PER_NOODLE; v++) {
    noodleIndexArray[n * VERTS_PER_NOODLE + v] = n
  }
}
tubeGeometry.setAttribute('noodleIndex', new THREE.BufferAttribute(noodleIndexArray, 1))

// Index buffer (tube topology repeated for each noodle)
const tubeIndices = new Uint32Array(params.noodleCount * TUBE_SEGMENTS * RADIAL_SEGMENTS * 6)
let ti = 0
for (let n = 0; n < params.noodleCount; n++) {
  const vo = n * VERTS_PER_NOODLE
  for (let seg = 0; seg < TUBE_SEGMENTS; seg++) {
    for (let rad = 0; rad < RADIAL_SEGMENTS; rad++) {
      const a = vo + seg * (RADIAL_SEGMENTS + 1) + rad
      const b = vo + (seg + 1) * (RADIAL_SEGMENTS + 1) + rad
      const c = vo + (seg + 1) * (RADIAL_SEGMENTS + 1) + (rad + 1)
      const d = vo + seg * (RADIAL_SEGMENTS + 1) + (rad + 1)
      tubeIndices[ti++] = a
      tubeIndices[ti++] = b
      tubeIndices[ti++] = d
      tubeIndices[ti++] = b
      tubeIndices[ti++] = c
      tubeIndices[ti++] = d
    }
  }
}
tubeGeometry.setIndex(new THREE.BufferAttribute(tubeIndices, 1))

// ── Tube material ───────────────────────────────────────────────────────────
const tubeMaterial = new THREE.MeshPhysicalNodeMaterial()

tubeMaterial.positionNode = Fn(() => {
  return vertexPositions.element(vertexIndex)
})()

// Pass computed normals as varying, then transform to view space for lighting
const vNormal = vertexNormals.element(vertexIndex).toVarying('v_computedNormal')
const computedNormalView = Fn(() => {
  return cameraViewMatrix.transformDirection(vNormal).normalize()
})()
tubeMaterial.normalNode = computedNormalView
tubeMaterial.clearcoatNormalNode = computedNormalView

tubeMaterial.colorNode = Fn(() => {
  const nIdx = attribute('noodleIndex').toUint()
  const baseColor = noodleColors.element(nIdx)
  const lightCol = mix(baseColor, vec3(1, 1, 1), colorGradientMixU)
  return mix(baseColor, lightCol, uv().x)
})()

tubeMaterial.roughnessNode = roughnessU
tubeMaterial.metalnessNode = metalnessU
tubeMaterial.clearcoatNode = clearcoatU
tubeMaterial.clearcoatRoughnessNode = clearcoatRoughnessU

const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial)
tubeMesh.castShadow = true
tubeMesh.receiveShadow = true
tubeMesh.frustumCulled = false
scene.add(tubeMesh)

// ── Cap meshes (InstancedMesh: start and end caps) ──────────────────────────
const capGeometry = new THREE.SphereGeometry(1, 10, 8)

const startCapMaterial = new THREE.MeshPhysicalNodeMaterial()
startCapMaterial.positionNode = Fn(() => {
  const spineIdx = instanceIndex.mul(uint(SPINE_POINTS))
  return spinePositions.element(spineIdx).add(positionLocal.mul(tubeRadiusU))
})()
startCapMaterial.colorNode = Fn(() => {
  return noodleColors.element(instanceIndex)
})()
startCapMaterial.roughnessNode = roughnessU
startCapMaterial.metalnessNode = metalnessU
startCapMaterial.clearcoatNode = clearcoatU
startCapMaterial.clearcoatRoughnessNode = clearcoatRoughnessU

const startCaps = new THREE.InstancedMesh(capGeometry, startCapMaterial, params.noodleCount)
startCaps.castShadow = true
startCaps.receiveShadow = true
startCaps.frustumCulled = false
scene.add(startCaps)

const endCapMaterial = new THREE.MeshPhysicalNodeMaterial()
endCapMaterial.positionNode = Fn(() => {
  const spineIdx = instanceIndex.mul(uint(SPINE_POINTS)).add(uint(TUBE_SEGMENTS))
  return spinePositions.element(spineIdx).add(positionLocal.mul(tubeRadiusU))
})()
endCapMaterial.colorNode = Fn(() => {
  const baseColor = noodleColors.element(instanceIndex)
  return mix(baseColor, vec3(1, 1, 1), colorGradientMixU)
})()
endCapMaterial.roughnessNode = roughnessU
endCapMaterial.metalnessNode = metalnessU
endCapMaterial.clearcoatNode = clearcoatU
endCapMaterial.clearcoatRoughnessNode = clearcoatRoughnessU

const endCaps = new THREE.InstancedMesh(capGeometry, endCapMaterial, params.noodleCount)
endCaps.castShadow = true
endCaps.receiveShadow = true
endCaps.frustumCulled = false
scene.add(endCaps)

// ── 3D Text ────────────────────────────────────────────────────────────────
const h1Element = document.querySelector('.title-block h1')
const titleBlockElement = document.querySelector('.title-block')
const textColorU = uniform(new THREE.Color(params.textColor))
const textOpacityU = uniform(0)

const textMaterial = new THREE.MeshStandardNodeMaterial({ transparent: true })
textMaterial.colorNode = textColorU
textMaterial.opacityNode = textOpacityU
textMaterial.roughness = 1
textMaterial.metalness = 0

// Placeholder mesh so the text shader is compiled first
const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), textMaterial)
textMesh.visible = false
textMesh.receiveShadow = true
scene.add(textMesh)

let textGeometry = null
let textAnimStart = -Infinity

const TEXT_ANIM_DELAY = 0 // seconds
const TEXT_ANIM_DURATION = 1 // seconds
const TEXT_SLIDE_DISTANCE = 0.5 // world units upward

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

function updateTextScale() {
  if (!textGeometry) return

  const h1Width = h1Element.getBoundingClientRect().width

  const vFov = (camera.fov * Math.PI) / 180
  const visibleHeight = 2 * Math.tan(vFov / 2) * params.cameraDistance
  const pixelToWorld = visibleHeight / window.innerHeight

  const targetWidth = h1Width * pixelToWorld
  const bb = textGeometry.boundingBox
  const geoWidth = bb.max.x - bb.min.x
  textMesh.scale.setScalar(targetWidth / geoWidth)

  const h1CenterInBlock = h1Element.offsetTop + h1Element.offsetHeight / 2
  const blockCenter = titleBlockElement.offsetHeight / 2
  textMesh.position.x = 0
  textMesh.userData.baseY = -(h1CenterInBlock - blockCenter) * pixelToWorld
}

// Load font asynchronously — fade in 3D text when ready
new TTFLoader()
  .loadAsync('https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksj.ttf')
  .then((fontData) => {
    const font = new Font(fontData)

    textGeometry = new TextGeometry('OMMA', {
      font,
      size: 1,
      depth: 0,
      curveSegments: 12,
    })
    textGeometry.computeBoundingBox()
    const bbox = textGeometry.boundingBox
    textGeometry.translate(-(bbox.max.x + bbox.min.x) / 2, -(bbox.max.y + bbox.min.y) / 2, 0)
    textGeometry.computeBoundingBox()

    // Swap placeholder geometry for the real text
    textMesh.geometry.dispose()
    textMesh.geometry = textGeometry
    textMesh.visible = true

    updateTextScale()

    // Start both CSS and 3D text animations together
    titleBlockElement.style.animation = 'fadeInUp 1s ease-out both'
    textAnimStart = performance.now()
  })

// ── GUI & Stats ─────────────────────────────────────────────────────────────
const gui = new GUI({ closeFolders: true })

const toneMappingOptions = { AGX: THREE.AgXToneMapping, ACES: THREE.ACESFilmicToneMapping, None: THREE.NoToneMapping }

gui
  .add(params, 'toneMapping', Object.keys(toneMappingOptions))
  .name('Tone Mapping')
  .onChange((v) => {
    renderer.toneMapping = toneMappingOptions[v]
  })

gui
  .addColor(params, 'textColor')
  .name('Text Color')
  .onChange((v) => {
    textColorU.value.set(v)
  })

function updateBackground() {
  document.body.style.background = `radial-gradient(ellipse at center, ${params.bgColorCenter} 0%, ${params.bgColorEdge} 55%)`
}

updateBackground()

gui.addColor(params, 'bgColorCenter').name('BG Center').onChange(updateBackground)

gui.addColor(params, 'bgColorEdge').name('BG Edge').onChange(updateBackground)

const cameraFolder = gui.addFolder('Camera')
cameraFolder
  .add(params, 'cameraFov', 10, 120, 1)
  .name('FOV')
  .onChange((v) => {
    camera.fov = v
    camera.updateProjectionMatrix()
  })

gui
  .add(params, 'showPaths')
  .name('Show Paths')
  .onChange((v) => {
    for (const line of pathLines) line.visible = v
  })

const tubeFolder = gui.addFolder('Tube')
tubeFolder
  .add(params, 'tubeRadius', 0.02, 0.8, 0.01)
  .name('Radius')
  .onChange((v) => (tubeRadiusU.value = v))
tubeFolder
  .add(params, 'pathFraction', 0.01, 1, 0.001)
  .name('Length')
  .onChange((v) => (pathFractionU.value = v))
const mouseFolder = gui.addFolder('Mouse Interaction')
mouseFolder
  .add(params, 'mouseAttract')
  .name('Attract')
  .onChange((v) => (mouseSignU.value = v ? -1 : 1))
mouseFolder.add(params, 'mouseZ', -20, 10, 0.5).name('Z Plane')
mouseFolder
  .add(params, 'mouseRadius', 1, 30, 0.5)
  .name('Repulsion Radius')
  .onChange((v) => {
    mouseRadiusU.value = v
    debugSphere.scale.setScalar(v)
  })
mouseFolder
  .add(params, 'mouseForce', 0, 100, 0.5)
  .name('Repulsion Amplitude')
  .onChange((v) => (mouseForceU.value = v))
mouseFolder
  .add(params, 'returnSpring', 0, 10, 0.1)
  .name('Return Spring')
  .onChange((v) => (returnSpringU.value = v))
mouseFolder
  .add(params, 'damping', 0, 10, 0.1)
  .name('Damping')
  .onChange((v) => (dampingU.value = v))
mouseFolder
  .add(params, 'mouseBodyForce', 0, 15, 0.1)
  .name('Body Force')
  .onChange((v) => (mouseBodyForceU.value = v))
mouseFolder
  .add(params, 'mouseBodyDecay', 0.1, 10, 0.1)
  .name('Body Decay')
  .onChange((v) => (mouseBodyDecayU.value = v))
mouseFolder
  .add(params, 'separationRadius', 0, 15, 0.5)
  .name('Separation Radius')
  .onChange((v) => (separationRadiusU.value = v))
mouseFolder
  .add(params, 'separationAmplitude', 0, 10, 0.1)
  .name('Separation Amplitude')
  .onChange((v) => (separationAmplitudeU.value = v))

const lightingFolder = gui.addFolder('Lighting')
lightingFolder
  .add(params, 'ambientIntensity', 0, 3, 0.01)
  .name('Ambient')
  .onChange((v) => (ambientLight.intensity = v))

const dir1Folder = lightingFolder.addFolder('Dir Light 1')
dir1Folder
  .add(params, 'dirLight1Intensity', 0, 5, 0.01)
  .name('Intensity')
  .onChange((v) => (dir1.intensity = v))
dir1Folder
  .add(params, 'dirLight1X', -30, 30, 0.1)
  .name('X')
  .onChange((v) => (dir1.position.x = v))
dir1Folder
  .add(params, 'dirLight1Y', -30, 30, 0.1)
  .name('Y')
  .onChange((v) => (dir1.position.y = v))
dir1Folder
  .add(params, 'dirLight1Z', -30, 30, 0.1)
  .name('Z')
  .onChange((v) => (dir1.position.z = v))

const dir2Folder = lightingFolder.addFolder('Dir Light 2')
dir2Folder
  .add(params, 'dirLight2Intensity', 0, 5, 0.01)
  .name('Intensity')
  .onChange((v) => (dir2.intensity = v))
dir2Folder
  .add(params, 'dirLight2X', -30, 30, 0.1)
  .name('X')
  .onChange((v) => (dir2.position.x = v))
dir2Folder
  .add(params, 'dirLight2Y', -30, 30, 0.1)
  .name('Y')
  .onChange((v) => (dir2.position.y = v))
dir2Folder
  .add(params, 'dirLight2Z', -30, 30, 0.1)
  .name('Z')
  .onChange((v) => (dir2.position.z = v))

const shadowFolder = lightingFolder.addFolder('Shadow Light')
shadowFolder
  .add(params, 'shadowLightIntensity', 0, 5, 0.01)
  .name('Intensity')
  .onChange((v) => (shadowLight.intensity = v))
shadowFolder
  .add(params, 'shadowLightX', -30, 30, 0.1)
  .name('X')
  .onChange((v) => (shadowLight.position.x = v))
shadowFolder
  .add(params, 'shadowLightY', -30, 30, 0.1)
  .name('Y')
  .onChange((v) => (shadowLight.position.y = v))
shadowFolder
  .add(params, 'shadowLightZ', -30, 30, 0.1)
  .name('Z')
  .onChange((v) => (shadowLight.position.z = v))

const materialFolder = gui.addFolder('Noodle Material')
materialFolder
  .add(params, 'roughness', 0, 1, 0.01)
  .name('Roughness')
  .onChange((v) => (roughnessU.value = v))
materialFolder
  .add(params, 'metalness', 0, 1, 0.01)
  .name('Metalness')
  .onChange((v) => (metalnessU.value = v))
materialFolder
  .add(params, 'clearcoat', 0, 1, 0.01)
  .name('Clearcoat')
  .onChange((v) => (clearcoatU.value = v))
materialFolder
  .add(params, 'clearcoatRoughness', 0, 1, 0.01)
  .name('Clearcoat roughness')
  .onChange((v) => (clearcoatRoughnessU.value = v))
materialFolder
  .add(params, 'colorGradientMix', 0, 1, 0.01)
  .name('Color gradient mix')
  .onChange((v) => (colorGradientMixU.value = v))

const stats = new Stats({ trackGPU: true, trackCPT: true })
document.body.appendChild(stats.dom)
stats.init(renderer)

// Debug flight path lines
const pathLineMaterial = new THREE.LineBasicMaterial({ color: 0xbbbbbb })
const pathLines = flightPaths.map((path) => {
  const points = path.getPoints(100)
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), pathLineMaterial)
  line.visible = false
  scene.add(line)
  return line
})

function setDebugMode(enabled) {
  params.debug = enabled
  controls.enabled = enabled
  debugOverlay.style.display = enabled ? 'block' : 'none'
  debugSphere.visible = enabled
  stats.dom.style.display = enabled ? '' : 'none'
  gui.domElement.style.display = enabled ? '' : 'none'
}

setDebugMode(params.debug)

window.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P') {
    setDebugMode(!params.debug)
  }
})

// ── Events ──────────────────────────────────────────────────────────────────
let mouseNdcX = 0
let mouseNdcY = 0
const _mouseNdc = new THREE.Vector2()
const _raycaster = new THREE.Raycaster()
const _mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
const _mouseWorld = new THREE.Vector3()

document.addEventListener('mousemove', (e) => {
  mouseNdcX = (e.clientX / window.innerWidth) * 2 - 1
  mouseNdcY = -(e.clientY / window.innerHeight) * 2 + 1
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  updateTextScale()
})

// ── Animation ───────────────────────────────────────────────────────────────
renderer.setAnimationLoop(async () => {
  // Project mouse onto z = mouseZ plane in world space
  _mouseNdc.set(mouseNdcX, mouseNdcY)
  _raycaster.setFromCamera(_mouseNdc, camera)
  _mousePlane.constant = -params.mouseZ
  if (_raycaster.ray.intersectPlane(_mousePlane, _mouseWorld)) {
    mouseWorldPosU.value.copy(_mouseWorld)
    debugSphere.position.copy(_mouseWorld)
  }
  debugSphere.scale.setScalar(params.mouseRadius)

  // Update compute uniforms
  elapsedU.value = performance.now() / 1000

  // GPU compute: spine → centroids → boids repulsion → frames → tube vertices
  renderer.compute(computeSpine)
  renderer.compute(computeCentroids)
  renderer.compute(computeRepulsion)
  renderer.compute(computeFrames)
  renderer.compute(computeVertices)

  // Text fade-in + slide-up
  if (textGeometry) {
    const baseY = textMesh.userData.baseY || 0
    const textAnimElapsed = (performance.now() - textAnimStart) / 1000 - TEXT_ANIM_DELAY
    if (textAnimElapsed < 0) {
      textOpacityU.value = 0
      textMesh.position.y = baseY - TEXT_SLIDE_DISTANCE
    } else if (textAnimElapsed < TEXT_ANIM_DURATION) {
      const t = easeOutCubic(textAnimElapsed / TEXT_ANIM_DURATION)
      textOpacityU.value = t
      textMesh.position.y = baseY - TEXT_SLIDE_DISTANCE * (1 - t)
    } else {
      textOpacityU.value = 1
      textMesh.position.y = baseY
    }
  }

  // Camera follows mouse for depth parallax (skip when orbit controls are active)
  if (!params.debug) {
    camera.position.x += (mouseNdcX * params.parallaxAmountX - camera.position.x) * params.parallaxSmoothing
    camera.position.y += (mouseNdcY * params.parallaxAmountY - camera.position.y) * params.parallaxSmoothing
    camera.lookAt(0, 0, 0)
  }

  controls.update()

  renderer.render(scene, camera)

  stats.update()
  await renderer.resolveTimestampsAsync('render')
  await renderer.resolveTimestampsAsync('compute')
})
