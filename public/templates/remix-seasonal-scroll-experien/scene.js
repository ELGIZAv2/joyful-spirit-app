import * as THREE from 'three/webgpu'
import {
  color,
  positionWorld,
  positionLocal,
  normalLocal,
  tangentLocal,
  bitangentLocal,
  modelNormalMatrix,
  time,
  Fn,
  sin,
  cos,
  mix,
  uv,
  mx_fractal_noise_float,
  uniform,
  float,
  vec2,
} from 'three/tsl'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import Stats from 'stats-gl'


// ─── Params ──────────────────────────────────────────────────────────────────
const params = {
  interactionMultiplier: 0.2,
  lerpSpeed: 4,

  fov: 30,
  cameraZ: 7.5,
  debug: false,
}

// ─── Scene Setup ──────────────────────────────────────────────────────────────
const scene = new THREE.Scene()
scene.background = null // transparent — CSS section backgrounds show through

const camera = new THREE.PerspectiveCamera(params.fov, innerWidth / innerHeight, 1, 2000)
camera.position.set(0, 0, params.cameraZ)

const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.toneMapping = THREE.AgXToneMapping
renderer.setSize(innerWidth, innerHeight)
renderer.autoClear = false

document.body.appendChild(renderer.domElement)
renderer.domElement.style.position = 'fixed'
renderer.domElement.style.top = '0'
renderer.domElement.style.left = '0'
renderer.domElement.style.zIndex = '10'
renderer.domElement.style.pointerEvents = 'none'
await renderer.init()



// ─── Geometry ─────────────────────────────────────────────────────────────────
const geoParams = { radius: 1, tube: 0.5, radialSegments: 64, tubularSegments: 128 }
let geometry = new THREE.TorusGeometry(
  geoParams.radius,
  geoParams.tube,
  geoParams.radialSegments,
  geoParams.tubularSegments,
)
geometry.computeTangents()

function rebuildGeometry() {
  geometry.dispose()
  geometry = new THREE.TorusGeometry(
    geoParams.radius,
    geoParams.tube,
    geoParams.radialSegments,
    geoParams.tubularSegments,
  )
  geometry.computeTangents()
  for (const mesh of meshes) mesh.geometry = geometry
}

// ─── Spiral Displacement ─────────────────────────────────────────────────
const spiralParams = {
  frequency: 5,
  twist: 5,
  amplitude: 0.02,
  speed: -0.5,
}

const uSpiralFrequency = uniform(spiralParams.frequency)
const uSpiralTwist = uniform(spiralParams.twist)
const uSpiralAmplitude = uniform(spiralParams.amplitude)
const uSpiralSpeed = uniform(spiralParams.speed)

const spiralDisplacement = Fn(() => {
  const u = uv().x.mul(float(Math.PI * 2)) // tubular angle
  const v = uv().y.mul(float(Math.PI * 2)) // radial angle
  const t = time.mul(uSpiralSpeed)

  // Spiral wave: bands that twist around the tube and flow over time
  const wave = sin(u.mul(uSpiralFrequency).add(v.mul(uSpiralTwist)).sub(t))

  // Displace along the normal
  return positionLocal.add(normalLocal.mul(wave.mul(uSpiralAmplitude)))
})()

// Analytical normal: perturb using the gradient of the displacement field
const spiralNormal = Fn(() => {
  const u = uv().x.mul(float(Math.PI * 2))
  const v = uv().y.mul(float(Math.PI * 2))
  const t = time.mul(uSpiralSpeed)

  const phase = u.mul(uSpiralFrequency).add(v.mul(uSpiralTwist)).sub(t)
  const grad = cos(phase).mul(uSpiralAmplitude)

  // Partial derivatives of displacement w.r.t. u and v
  const ddu = grad.mul(uSpiralFrequency).mul(float(Math.PI * 2))
  const ddv = grad.mul(uSpiralTwist).mul(float(Math.PI * 2))

  // Perturb normal using tangent-space gradient
  const perturbedLocal = normalLocal.sub(tangentLocal.mul(ddu)).sub(bitangentLocal.mul(ddv)).normalize()

  // Transform to view space (normalNode expects view-space normals)
  return modelNormalMatrix.mul(perturbedLocal).normalize()
})()

// ─── Materials (one per season) ───────────────────────────────────────────────
const springColors = { colorA: new THREE.Color(0x6a8a5a), colorB: new THREE.Color(0xa8d48a) }
const springColorA = uniform(color(springColors.colorA))
const springColorB = uniform(color(springColors.colorB))
const springMaterial = new THREE.MeshPhysicalNodeMaterial()
springMaterial.colorNode = Fn(() => {
  const t = time.mul(0.5)
  const p = positionWorld
  const wave = sin(p.x.mul(3).add(t)).mul(0.5).add(0.5)
  return mix(springColorA, springColorB, wave)
})()
springMaterial.roughness = 0.3
springMaterial.metalness = 0.1

const summerColors = { colorA: new THREE.Color(0xd4920a), colorB: new THREE.Color(0xf5d862) }
const summerColorA = uniform(color(summerColors.colorA))
const summerColorB = uniform(color(summerColors.colorB))
const summerMaterial = new THREE.MeshPhysicalNodeMaterial()
summerMaterial.colorNode = Fn(() => {
  const t = time.mul(0.3)
  const p = positionWorld
  const heat = sin(p.y.mul(4).add(t)).mul(0.5).add(0.5)
  return mix(summerColorA, summerColorB, heat)
})()
summerMaterial.roughness = 0.18
summerMaterial.metalness = 0.9
summerMaterial.specularIntensity = 1.5
summerMaterial.specularColor.set(0xffeebb)

const autumnColors = { colorA: new THREE.Color(0xc45e2c), colorB: new THREE.Color(0xe8945a) }
const autumnColorA = uniform(color(autumnColors.colorA))
const autumnColorB = uniform(color(autumnColors.colorB))
const autumnMaterial = new THREE.MeshPhysicalNodeMaterial()
autumnMaterial.colorNode = Fn(() => {
  const t = time.mul(0.25)
  const p = positionWorld
  const blend = sin(p.x.mul(1.5).add(p.y.mul(2)).add(t))
    .mul(0.5)
    .add(0.5)
  return mix(autumnColorA, autumnColorB, blend)
})()
autumnMaterial.roughness = 0.9
autumnMaterial.metalness = 0.0
autumnMaterial.clearcoat = 0.15
autumnMaterial.clearcoatRoughness = 0.85

const winterMaterial = new THREE.MeshPhysicalNodeMaterial()
// winterMaterial.side = THREE.DoubleSide
winterMaterial.color.set(0x8cadca)
winterMaterial.roughness = 0.25
winterMaterial.metalness = 0
winterMaterial.transmission = 0.9
winterMaterial.ior = 1.37
winterMaterial.reflectivity = 0.58
winterMaterial.thickness = 0.6
winterMaterial.envMapIntensity = 1.7
// winterMaterial.clearcoat = 1
// winterMaterial.clearcoatRoughness = 0.27
// winterMaterial.iridescence = 0.5
// winterMaterial.iridescenceIOR = 1.01
winterMaterial.specularIntensity = 1.51
winterMaterial.specularColor.set(0x9cb1d3)
// Procedural FBM frost on roughness
const frostFrequency = uniform(20)
const frostLacunarity = uniform(3.7)
const frostDiminish = uniform(0.65)
const frostAmplitude = uniform(0.9)
const frostSpeed = uniform(-0.015)
const frostUv = uv().sub(vec2(float(0), time.mul(frostSpeed)))
const fbmNoise = mx_fractal_noise_float(frostUv.mul(frostFrequency), 3, frostLacunarity, frostDiminish)
  .mul(0.5)
  .add(0.5)
winterMaterial.roughnessNode = fbmNoise.mul(frostAmplitude)

const materials = [springMaterial, summerMaterial, autumnMaterial, winterMaterial]

// Apply spiral displacement and corrected normals to all materials
for (const mat of materials) {
  mat.positionNode = spiralDisplacement
  mat.normalNode = spiralNormal
}

// ─── Meshes (one per material, same geometry & transform) ─────────────────────
const meshes = materials.map((mat) => {
  const mesh = new THREE.Mesh(geometry, mat)
  scene.add(mesh)
  return mesh
})

// ─── Environment (RoomEnvironment IBL) ────────────────────────────────────────
const pmremGenerator = new THREE.PMREMGenerator(renderer)
scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture

// ─── Three-point lighting (Key / Fill / Rim) ─────────────────────────────────
// Key light — warm, strongest, front-right
const keyLight = new THREE.SpotLight(0xfff0e0, 8, 30, Math.PI / 4, 0.5, 1)
keyLight.position.set(4, 3, 5)
scene.add(keyLight)

// Fill light — cool, softer, front-left
const fillLight = new THREE.SpotLight(0xd0e0ff, 3, 30, Math.PI / 3, 0.7, 1)
fillLight.position.set(-5, 1, 3)
scene.add(fillLight)

// Rim light — bright edge highlight from behind
const rimLight = new THREE.SpotLight(0xffffff, 6, 30, Math.PI / 4, 0.4, 1)
rimLight.position.set(0, 4, -5)
scene.add(rimLight)

// Precompile all materials
meshes.forEach((m) => (m.visible = true))
await renderer.compileAsync(scene, camera)
meshes.forEach((m) => (m.visible = false))



// ─── Mouse Interaction ────────────────────────────────────────────────────────
const mouse = new THREE.Vector2(0, 0)
const targetRotation = new THREE.Vector2(0, 0)
const currentRotation = new THREE.Vector2(0, 0)

addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1
  mouse.y = -(e.clientY / innerHeight) * 2 + 1
})

// ─── Animation Loop ──────────────────────────────────────────────────────────
let last = performance.now()
renderer.setAnimationLoop(async () => {
  const now = performance.now()
  const delta = Math.min((now - last) / 1000, 0.1)
  last = now

  // Mouse-follow rotation
  targetRotation.x = -mouse.y * params.interactionMultiplier
  targetRotation.y = mouse.x * params.interactionMultiplier

  const lerpAlpha = 1 - Math.exp(-params.lerpSpeed * delta)
  currentRotation.x += (targetRotation.x - currentRotation.x) * lerpAlpha
  currentRotation.y += (targetRotation.y - currentRotation.y) * lerpAlpha

  for (const mesh of meshes) {
    mesh.rotation.set(currentRotation.x, currentRotation.y, 0)
  }

  // ── Scissor math ──
  const S = window.scrollY
  const vh = window.innerHeight
  const vw = window.innerWidth
  const topSection = Math.min(Math.floor(S / vh), 3)
  const frac = Math.min(S / vh - topSection, 1)

  renderer.setScissorTest(false)
  renderer.clear(true, true, true)

  renderer.setScissorTest(true)

  for (const mesh of meshes) mesh.visible = false

  if (frac < 0.001 || topSection >= 3) {
    renderer.setScissor(0, 0, vw, vh)
    renderer.setViewport(0, 0, vw, vh)
    meshes[topSection].visible = true
    renderer.render(scene, camera)
  } else {
    const boundaryFromTop = vh * (1 - frac)

    const topH = Math.ceil(boundaryFromTop)
    renderer.setScissor(0, 0, vw, topH)
    renderer.setViewport(0, 0, vw, vh)
    meshes[topSection].visible = true
    renderer.render(scene, camera)
    meshes[topSection].visible = false

    const bottomH = Math.ceil(vh * frac)
    renderer.setScissor(0, vh - bottomH, vw, bottomH)
    renderer.setViewport(0, 0, vw, vh)
    meshes[topSection + 1].visible = true
    renderer.render(scene, camera)
    meshes[topSection + 1].visible = false
  }

  renderer.setScissorTest(false)

  await renderer.resolveTimestampsAsync('render')
})

// ─── Fixed UI ─────────────────────────────────────────────────────────────────
const indicatorsEl = document.getElementById('indicators')

// Generate indicator dots
for (let i = 0; i < 4; i++) {
  const dot = document.createElement('div')
  dot.className = 'indicator-dot' + (i === 0 ? ' active' : '')
  dot.addEventListener('click', () => {
    window.scrollTo({ top: i * innerHeight, behavior: 'smooth' })
  })
  indicatorsEl.appendChild(dot)
}
const dots = indicatorsEl.querySelectorAll('.indicator-dot')

let prevUiSection = -1
addEventListener(
  'scroll',
  () => {
    const S = window.scrollY
    const vh = window.innerHeight

    // Active dot
    const activeSection = Math.min(Math.round(S / vh), 3)
    if (activeSection !== prevUiSection) {
      prevUiSection = activeSection
      dots.forEach((d, i) => d.classList.toggle('active', i === activeSection))
    }
  },
  { passive: true },
)

// ─── Resize ──────────────────────────────────────────────────────────────────
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
