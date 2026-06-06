import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three/webgpu'
import {
  Fn,
  storage,
  instanceIndex,
  time,
  normalize,
  cross,
  select,
  smoothstep,
  uniform,
  vec4,
  vec3,
  attribute,
  mx_fractal_noise_float,
} from 'three/tsl'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import Stats from 'stats-gl'
import { SphereAO } from './SphereAONode.js'

// ─── Rapier physics ─────────────────────────────────────────────────────────
await RAPIER.init()
const gravity = new RAPIER.Vector3(0, 0, 0)
const world = new RAPIER.World(gravity)

// ─── Scene setup ─────────────────────────────────────────────────────────────

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.toneMapping = THREE.AgXToneMapping
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setPixelRatio(window.devicePixelRatio)
renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;'
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
await renderer.init()

const stats = new Stats({ trackGPU: true, trackCPT: true })
document.body.appendChild(stats.dom)
stats.dom.style.display = 'none'
stats.init(renderer)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100)
camera.position.set(0, 0, 5)

// Invisible overlay to capture pointer events for OrbitControls in debug mode
const debugOverlay = document.createElement('div')
debugOverlay.style.cssText = 'position:fixed;inset:0;z-index:1;display:none;'
document.body.appendChild(debugOverlay)

const controls = new OrbitControls(camera, debugOverlay)
controls.target.set(0, 0, 0)
controls.enabled = false
controls.update()

// ─── Lights ──────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight('#ffffff', 0.4)
scene.add(ambientLight)

const spotLight = new THREE.SpotLight('#ffffff', 1, 0, 0.15, 1)
spotLight.position.set(10, 10, 10)
spotLight.castShadow = true
spotLight.shadow.mapSize.width = 1024
spotLight.shadow.mapSize.height = 1024
spotLight.shadow.camera.near = 5
spotLight.shadow.camera.far = 25
scene.add(spotLight)

// ─── 3D text behind sphere (refracted through transmission) ─────────────────
const textCanvas = document.createElement('canvas')
const textDpr = Math.min(window.devicePixelRatio, 2)
textCanvas.width = window.innerWidth * textDpr
textCanvas.height = window.innerHeight * textDpr
const textCtx = textCanvas.getContext('2d')
const textTexture = new THREE.CanvasTexture(textCanvas)
textTexture.colorSpace = THREE.SRGBColorSpace

function updateTextPlane(color = params.accentColor) {
  textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height)
  const fontSize = Math.round(textCanvas.height * params.textSize)
  textCtx.font = `700 ${fontSize}px "Rajdhani"`
  textCtx.textAlign = 'center'
  textCtx.textBaseline = 'middle'
  textCtx.letterSpacing = `${params.textLetterSpacing}px`
  textCtx.fillStyle = color
  textCtx.fillText(
    'GENESIS',
    textCanvas.width / 2 - 10 * textDpr,
    textCanvas.height / 2 + params.textVerticalOffset * textDpr,
  )
  textTexture.needsUpdate = true
}
const textPlaneZ = -3
const textPlaneDistance = camera.position.z - textPlaneZ
const textPlaneHeight = 2 * textPlaneDistance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
const textPlaneAspect = window.innerWidth / window.innerHeight
const textPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(textPlaneHeight * textPlaneAspect, textPlaneHeight),
  new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, depthWrite: false }),
)
textPlane.position.set(0, 0, textPlaneZ)
scene.add(textPlane)

// ─── Procedural environment ─────
function createLightformerEnvMap() {
  const envScene = new THREE.Scene()

  // Group with rotation [-PI/3, 0, 1]
  const group = new THREE.Group()
  group.rotation.set(-Math.PI / 3, 0, 1)
  envScene.add(group)

  const circleMaterial = (intensity) =>
    new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide })

  const circleGeo = new THREE.CircleGeometry(1, 64)

  // Lightformer 1: circle, intensity=4, rotation-x=PI/2, position=[0,5,-9], scale=2
  const lf1 = new THREE.Mesh(circleGeo, circleMaterial(4))
  lf1.rotation.x = Math.PI / 2
  lf1.position.set(0, 5, -9)
  lf1.scale.setScalar(2)
  group.add(lf1)

  // Lightformer 2: circle, intensity=2, rotation-y=PI/2, position=[-5,1,-1], scale=2
  const lf2 = new THREE.Mesh(circleGeo, circleMaterial(2))
  lf2.rotation.y = Math.PI / 2
  lf2.position.set(-5, 1, -1)
  lf2.scale.setScalar(2)
  group.add(lf2)

  // Lightformer 3: circle, intensity=2, rotation-y=PI/2, position=[-5,-1,-1], scale=2
  const lf3 = new THREE.Mesh(circleGeo, circleMaterial(2))
  lf3.rotation.y = Math.PI / 2
  lf3.position.set(-5, -1, -1)
  lf3.scale.setScalar(2)
  group.add(lf3)

  // Lightformer 4: circle, intensity=2, rotation-y=-PI/2, position=[10,1,0], scale=8
  const lf4 = new THREE.Mesh(circleGeo, circleMaterial(2))
  lf4.rotation.y = -Math.PI / 2
  lf4.position.set(10, 1, 0)
  lf4.scale.setScalar(8)
  group.add(lf4)

  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  const envMap = pmremGenerator.fromScene(envScene, 0, 0.1, 100).texture
  pmremGenerator.dispose()
  envScene.clear()

  return envMap
}

scene.environment = createLightformerEnvMap()

// ─── Params ──────────────────────────────────────────────────────────────────

const params = {
  debug: false,
  backgroundTop: '#0e0e0e',
  backgroundBottom: '#1a1a1a',
  ambientColor: '#ffffff',
  ambientIntensity: 0.4,
  spotColor: '#ffffff',
  spotIntensity: 300,
  stiffness: 0.165,
  viscosity: 0.85,
  brushSize: 0.5,
  brushStrength: 1.4,
  brushDamping: 0.001,
  noiseAmplitude: 0.3,
  noiseFrequency: 0.3,
  noiseSpeed: 0.6,
  flatShading: false,
  noiseOpacity: 0.05,
  accentColor: '#10a37f',
  textVerticalOffset: 34,
  textLetterSpacing: -42,
  textSize: 0.5,
  // Transmission material
  color: '#ffffff',
  transmission: 1,
  thickness: 0.5,
  roughness: 0.13,
  ior: 1.5,
  dispersion: 8,
  attenuationColor: '#ffffff',
  attenuationDistance: 0.5,
  envMapIntensity: 1,
  iridescence: 2,
  iridescenceIOR: 1.3,
  iridescenceThicknessMin: 100,
  iridescenceThicknessMax: 400,
  clearcoat: 0,
  clearcoatRoughness: 0,
  sheen: 0,
  sheenRoughness: 0.5,
  sheenColor: '#ffffff',
  specularIntensity: 1,
  specularColor: '#ffffff',
  emissive: '#000000',
  emissiveIntensity: 0,
  anisotropy: 0,
  innerSpheresColor: '#10a37f',
  innerSpheresColor2: '#ffffff',
  innerSpheresRoughness: 0.5,
  innerSpheresMetalness: 0,
  innerSpheresRoughness2: 0.5,
  innerSpheresMetalness2: 0.48,
  innerSpheresClearcoat: 0,
  innerSpheresClearcoatRoughness: 0,
  innerSpheresSheen: 0,
  innerSpheresSheenColor: '#ffffff',
  innerSpheresIridescence: 0,
  innerSpheresAOIntensity: 1,
  innerSpheresAORadius: 3,
  // Physics
  mouseBallRadius: 0.5,
  mouseBallStrength: 12,
  wanderStrength: 0.3,
  wanderSpeed: 0.3,
  attractionStrength: 3,
  linearDamping: 0.75,
  angularDamping: 0.15,
  friction: 0.2,
  restitution: 0.3,
}

function createGradientTexture(topColor, bottomColor, noiseOpacity = params.noiseOpacity) {
  const dpr = 1 // Math.min(window.devicePixelRatio, 2)
  const w = window.innerWidth * dpr
  const h = window.innerHeight * dpr
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, topColor)
  gradient.addColorStop(1, bottomColor)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // Static pixel noise
  if (noiseOpacity > 0) {
    const imageData = ctx.getImageData(0, 0, w, h)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 2 * noiseOpacity * 255
      data[i] = Math.min(255, Math.max(0, data[i] + noise))
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise))
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise))
    }
    ctx.putImageData(imageData, 0, 0)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

await document.fonts.ready
updateTextPlane()
scene.background = createGradientTexture(params.backgroundTop, params.backgroundBottom)
ambientLight.color.set(params.ambientColor)
ambientLight.intensity = params.ambientIntensity
spotLight.color.set(params.spotColor)
spotLight.intensity = params.spotIntensity

// ─── Raycaster ───────────────────────────────────────────────────────────────

const raycaster = new THREE.Raycaster()

// ─── Uniforms ────────────────────────────────────────────────────────────────

const pointerPosition = uniform(vec4(0))
const pointerSpeed = uniform(0)
const damping = uniform(params.stiffness)
const viscosity = uniform(params.viscosity)
const brushSize = uniform(params.brushSize)
const brushStrength = uniform(params.brushStrength)
const brushDamping = uniform(params.brushDamping)
const noiseAmplitude = uniform(params.noiseAmplitude)
const noiseFrequency = uniform(params.noiseFrequency)
const noiseSpeed = uniform(params.noiseSpeed)

// ─── Icosphere with GPU deformation ─────────────────────────────────────────

const geometry = new THREE.IcosahedronGeometry(1.8, 60)
const count = geometry.attributes.position.count

const positionBaseAttribute = geometry.attributes.position
const positionStorageBuffer = new THREE.StorageBufferAttribute(count, 3)
const normalStorageBuffer = new THREE.StorageBufferAttribute(count, 3)
const speedBuffer = new THREE.StorageBufferAttribute(count, 3)
const normalSpeedBuffer = new THREE.StorageBufferAttribute(count, 3)
geometry.setAttribute('storagePosition', positionStorageBuffer)
geometry.setAttribute('storageNormal', normalStorageBuffer)

const positionBase = storage(positionBaseAttribute, 'vec3', count)
const positionStorage = storage(positionStorageBuffer, 'vec3', count)
const normalStorage = storage(normalStorageBuffer, 'vec3', count)
const speedStorage = storage(speedBuffer, 'vec3', count)
const normalSpeedStorage = storage(normalSpeedBuffer, 'vec3', count)

// Init: copy base positions and normals into storage
const computeInit = Fn(() => {
  const base = positionBase.element(instanceIndex)
  positionStorage.element(instanceIndex).assign(base)
  normalStorage.element(instanceIndex).assign(normalize(base))
})().compute(count)

// Update: jelly deformation with pointer interaction + sine wave
const computeUpdate = Fn(() => {
  const base = positionBase.element(instanceIndex)
  const current = positionStorage.element(instanceIndex)
  const speed = speedStorage.element(instanceIndex)

  // Pointer push (smooth gradient falloff)
  const dist = current.distance(pointerPosition.xyz)
  const falloff = smoothstep(brushSize.mul(0.5), brushSize, dist).oneMinus().mul(pointerSpeed)
  const direction = normalize(current).negate() // push inward along surface normal
  speed.addAssign(direction.mul(falloff.mul(brushStrength).mul(brushDamping)))

  // Noise deformation using 3D position to avoid UV seam artifacts
  const dir = normalize(base)
  const noiseDir = vec3(-1, 1, -1).normalize()
  const samplePos = base.add(noiseDir.mul(time.mul(noiseSpeed))).mul(noiseFrequency)
  const offset = mx_fractal_noise_float(samplePos, 3, 2, 0.5)
  const target = base.add(dir.mul(offset.mul(noiseAmplitude)))

  // Elasticity: pull current position toward the animated target
  const displacement = target.distance(current)
  const force = damping.mul(displacement).mul(target.sub(current))

  speed.addAssign(force)
  speed.mulAssign(viscosity)
  current.addAssign(speed)

  // Compute noise gradient normal on the tangent plane
  const n = dir
  const ref = select(n.y.abs().greaterThan(0.99), vec3(1, 0, 0), vec3(0, 1, 0))
  const t1 = normalize(cross(n, ref))
  const t2 = cross(n, t1)

  const eps = 0.01
  const sp1 = base
    .add(t1.mul(eps))
    .add(noiseDir.mul(time.mul(noiseSpeed)))
    .mul(noiseFrequency)
  const h_t1 = mx_fractal_noise_float(sp1, 3, 2, 0.5)
  const sp2 = base
    .add(t2.mul(eps))
    .add(noiseDir.mul(time.mul(noiseSpeed)))
    .mul(noiseFrequency)
  const h_t2 = mx_fractal_noise_float(sp2, 3, 2, 0.5)

  const dh_dt1 = h_t1.sub(offset).div(eps)
  const dh_dt2 = h_t2.sub(offset).div(eps)

  const targetNormal = normalize(n.sub(t1.mul(dh_dt1.mul(noiseAmplitude))).sub(t2.mul(dh_dt2.mul(noiseAmplitude))))

  // Normal spring system (mirrors position spring dynamics)
  const currentNormal = normalStorage.element(instanceIndex)
  const normalVelocity = normalSpeedStorage.element(instanceIndex)

  // Pointer tilts the normal with smooth gradient falloff
  const normalDist = current.distance(pointerPosition.xyz)
  const normalFalloff = smoothstep(brushSize.mul(0.5), brushSize, normalDist).oneMinus().mul(pointerSpeed)
  const toPointer = normalize(pointerPosition.xyz.sub(current))
  const tangentTilt = toPointer.sub(currentNormal.mul(currentNormal.dot(toPointer)))
  currentNormal.addAssign(tangentTilt.mul(brushStrength).mul(normalFalloff))

  // Spring toward noise target normal (same formula as position spring)
  const normalDisplacement = targetNormal.distance(currentNormal)
  const normalForce = damping.mul(normalDisplacement).mul(targetNormal.sub(currentNormal))
  normalVelocity.addAssign(normalForce)
  normalVelocity.mulAssign(viscosity)
  currentNormal.addAssign(normalVelocity)
  currentNormal.assign(normalize(currentNormal))
})().compute(count)

computeUpdate.onInit(() => renderer.compute(computeInit))

// ─── Material & Mesh ─────────────────────────────────────────────────────────

const material = new THREE.MeshPhysicalNodeMaterial()
material.color.set(params.color)
material.transmission = params.transmission
material.thickness = params.thickness
material.roughness = params.roughness
material.ior = params.ior
material.dispersion = params.dispersion
material.attenuationColor.set(params.attenuationColor)
material.attenuationDistance = params.attenuationDistance
material.envMapIntensity = params.envMapIntensity
material.iridescence = params.iridescence
material.iridescenceIOR = params.iridescenceIOR
material.iridescenceThicknessRange = [params.iridescenceThicknessMin, params.iridescenceThicknessMax]
material.clearcoat = params.clearcoat
material.clearcoatRoughness = params.clearcoatRoughness
material.sheen = params.sheen
material.sheenRoughness = params.sheenRoughness
material.sheenColor.set(params.sheenColor)
material.specularIntensity = params.specularIntensity
material.specularColor.set(params.specularColor)
material.emissive.set(params.emissive)
material.emissiveIntensity = params.emissiveIntensity
material.anisotropy = params.anisotropy
material.flatShading = params.flatShading
material.positionNode = attribute('storagePosition')
if (!params.flatShading) {
  material.normalNode = attribute('storageNormal')
}

const mesh = new THREE.Mesh(geometry, material)
mesh.castShadow = false
mesh.receiveShadow = false
scene.add(mesh)

// Inner spheres visible through the transmission (with Rapier physics)
const innerSphereMaterial = new THREE.MeshPhysicalNodeMaterial({
  color: new THREE.Color(params.innerSpheresColor),
  roughness: params.innerSpheresRoughness,
  metalness: params.innerSpheresMetalness,
  clearcoat: params.innerSpheresClearcoat,
  clearcoatRoughness: params.innerSpheresClearcoatRoughness,
  sheen: params.innerSpheresSheen,
  sheenColor: new THREE.Color(params.innerSpheresSheenColor),
  iridescence: params.innerSpheresIridescence,
})
const innerSphereMaterial2 = new THREE.MeshPhysicalNodeMaterial({
  color: new THREE.Color(params.innerSpheresColor2),
  roughness: params.innerSpheresRoughness2,
  metalness: params.innerSpheresMetalness2,
  clearcoat: params.innerSpheresClearcoat,
  clearcoatRoughness: params.innerSpheresClearcoatRoughness,
  sheen: params.innerSpheresSheen,
  sheenColor: new THREE.Color(params.innerSpheresSheenColor),
  iridescence: params.innerSpheresIridescence,
})
const innerSphereRadius = 0.3
const innerSphereGeo = new THREE.SphereGeometry(innerSphereRadius, 24, 24)
const innerSpherePositions = [
  [0, 0, 0],
  [0.55, 0.4, -0.2],
  [-0.5, -0.3, 0.4],
  [0.3, -0.5, -0.45],
  [-0.4, 0.5, 0.3],
  [0.2, 0.55, 0.3],
  [-0.25, -0.55, -0.25],
  [0.5, 0.0, 0.4],
  [-0.5, 0.25, -0.4],
  [0.0, -0.25, 0.55],
  [-0.35, 0.1, -0.55],
  [0.45, -0.3, 0.3],
  [-0.15, 0.45, -0.35],
  [0.3, 0.25, 0.5],
  [-0.4, -0.45, 0.15],
]

// Randomly assign ~40% of spheres to color2
const color2Indices = new Set()
for (let i = 0; i < innerSpherePositions.length; i++) {
  if (Math.random() < 0.4) color2Indices.add(i)
}

const colliderDesc = RAPIER.ColliderDesc.ball(innerSphereRadius)
  .setRestitution(params.restitution)
  .setFriction(params.friction)
const innerSphereBodies = innerSpherePositions.map((pos, i) => {
  const mat = color2Indices.has(i) ? innerSphereMaterial2 : innerSphereMaterial
  const m = new THREE.Mesh(innerSphereGeo, mat)
  m.castShadow = true
  m.receiveShadow = true
  m.position.set(...pos)
  scene.add(m)

  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(...pos)
    .setLinearDamping(params.linearDamping)
    .setAngularDamping(params.angularDamping)
  const rigidBody = world.createRigidBody(rigidBodyDesc)
  world.createCollider(colliderDesc, rigidBody)

  return { mesh: m, rigidBody }
})

// ─── Analytical sphere AO (Quilez) ──────────────────────────────────────────
// https://iquilezles.org/articles/sphereao/
const sphereAO = new SphereAO(innerSpherePositions, innerSphereRadius, {
  intensity: params.innerSpheresAOIntensity,
  radius: params.innerSpheresAORadius,
})
innerSphereMaterial.aoNode = sphereAO.node
innerSphereMaterial2.aoNode = sphereAO.node

// Invisible helper sphere for raycasting (simple geometry, stable against GPU deformation)
const raycastSphere = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.8, 4),
  new THREE.MeshBasicMaterial({ visible: false }),
)
scene.add(raycastSphere)

// ─── Mouse physics ball (kinematic – pushes inner spheres) ──────────────────
const mouseBallDebugMesh = new THREE.Mesh(
  new THREE.SphereGeometry(params.mouseBallRadius, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }),
)
mouseBallDebugMesh.visible = false
scene.add(mouseBallDebugMesh)

let mouseBallActive = false

// ─── Pointer interaction ─────────────────────────────────────────────────────

const mouseNDC = new THREE.Vector2(-Infinity, -Infinity)

window.addEventListener('pointermove', (event) => {
  mouseNDC.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1)
})

// ─── GUI ─────────────────────────────────────────────────────────────────────

const gui = new GUI({ closeFolders: true }).close()
function setDebug(v) {
  stats.dom.style.display = v ? '' : 'none'
  debugOverlay.style.display = v ? '' : 'none'
  controls.enabled = v
  for (const arrow of debugArrows) arrow.visible = v
  mouseBallDebugMesh.visible = v
  document.querySelectorAll('.top-bar, .panel-left, .panel-right, .bottom-bar').forEach((el) => {
    el.style.pointerEvents = v ? 'none' : ''
    el.style.opacity = v ? '0.2' : ''
  })
}
gui.add(params, 'debug').name('Debug (P)').onChange(setDebug)
const envFolder = gui.addFolder('Environment')
envFolder
  .addColor(params, 'backgroundTop')
  .name('BG Top')
  .onChange((v) => {
    scene.background = createGradientTexture(v, params.backgroundBottom)
  })
envFolder
  .addColor(params, 'backgroundBottom')
  .name('BG Bottom')
  .onChange((v) => {
    scene.background = createGradientTexture(params.backgroundTop, v)
  })
envFolder
  .addColor(params, 'ambientColor')
  .name('Ambient Color')
  .onChange((v) => ambientLight.color.set(v))
envFolder
  .add(params, 'ambientIntensity', 0, 5)
  .name('Ambient Intensity')
  .onChange((v) => (ambientLight.intensity = v))
envFolder
  .addColor(params, 'spotColor')
  .name('Spot Color')
  .onChange((v) => spotLight.color.set(v))
envFolder
  .add(params, 'spotIntensity', 0, 1000)
  .name('Spot Intensity')
  .onChange((v) => (spotLight.intensity = v))
envFolder
  .add(params, 'noiseOpacity', 0, 0.3, 0.005)
  .name('Noise Opacity')
  .onChange((v) => {
    scene.background = createGradientTexture(params.backgroundTop, params.backgroundBottom, v)
  })
const uiFolder = gui.addFolder('UI')
uiFolder
  .addColor(params, 'accentColor')
  .name('Accent Color')
  .onChange((v) => {
    document.documentElement.style.setProperty('--accent', v)
    // Update --accent-dim with 0.35 opacity
    const r = parseInt(v.slice(1, 3), 16)
    const g = parseInt(v.slice(3, 5), 16)
    const b = parseInt(v.slice(5, 7), 16)
    document.documentElement.style.setProperty('--accent-dim', `rgba(${r}, ${g}, ${b}, 0.35)`)
    updateTextPlane(v)
  })
uiFolder
  .add(params, 'textVerticalOffset', -100, 100, 1)
  .name('Text V. Offset')
  .onChange(() => updateTextPlane())
uiFolder
  .add(params, 'textLetterSpacing', -120, 20, 1)
  .name('Letter Spacing')
  .onChange(() => updateTextPlane())
uiFolder
  .add(params, 'textSize', 0.1, 1, 0.01)
  .name('Text Size')
  .onChange(() => updateTextPlane())

const blobFolder = gui.addFolder('Blob')
blobFolder
  .add(params, 'noiseAmplitude', 0, 0.5)
  .name('Noise Amplitude')
  .onChange((v) => (noiseAmplitude.value = v))
blobFolder
  .add(params, 'noiseFrequency', 0, 2)
  .name('Noise Frequency')
  .onChange((v) => (noiseFrequency.value = v))
blobFolder
  .add(params, 'noiseSpeed', 0, 1)
  .name('Noise Speed')
  .onChange((v) => (noiseSpeed.value = v))
blobFolder
  .add(params, 'flatShading')
  .name('Flat Shading')
  .onChange((v) => {
    material.flatShading = v
    material.normalNode = v ? null : attribute('storageNormal')
    material.needsUpdate = true
  })

const innerSpheresFolder = gui.addFolder('Inner Spheres')
innerSpheresFolder
  .addColor(params, 'innerSpheresColor')
  .name('Color')
  .onChange((v) => innerSphereMaterial.color.set(v))
innerSpheresFolder
  .addColor(params, 'innerSpheresColor2')
  .name('Color 2')
  .onChange((v) => innerSphereMaterial2.color.set(v))
innerSpheresFolder
  .add(params, 'innerSpheresRoughness', 0, 1, 0.01)
  .name('Roughness')
  .onChange((v) => (innerSphereMaterial.roughness = v))
innerSpheresFolder
  .add(params, 'innerSpheresMetalness', 0, 1, 0.01)
  .name('Metalness')
  .onChange((v) => (innerSphereMaterial.metalness = v))
innerSpheresFolder
  .add(params, 'innerSpheresRoughness2', 0, 1, 0.01)
  .name('Roughness 2')
  .onChange((v) => (innerSphereMaterial2.roughness = v))
innerSpheresFolder
  .add(params, 'innerSpheresMetalness2', 0, 1, 0.01)
  .name('Metalness 2')
  .onChange((v) => (innerSphereMaterial2.metalness = v))
innerSpheresFolder
  .add(params, 'innerSpheresClearcoat', 0, 1, 0.01)
  .name('Clearcoat')
  .onChange((v) => (innerSphereMaterial.clearcoat = innerSphereMaterial2.clearcoat = v))
innerSpheresFolder
  .add(params, 'innerSpheresClearcoatRoughness', 0, 1)
  .name('Clearcoat Roughness')
  .onChange((v) => (innerSphereMaterial.clearcoatRoughness = innerSphereMaterial2.clearcoatRoughness = v))
innerSpheresFolder
  .add(params, 'innerSpheresSheen', 0, 1)
  .name('Sheen')
  .onChange((v) => (innerSphereMaterial.sheen = innerSphereMaterial2.sheen = v))
innerSpheresFolder
  .addColor(params, 'innerSpheresSheenColor')
  .name('Sheen Color')
  .onChange((v) => {
    innerSphereMaterial.sheenColor.set(v)
    innerSphereMaterial2.sheenColor.set(v)
  })
innerSpheresFolder
  .add(params, 'innerSpheresIridescence', 0, 1)
  .name('Iridescence')
  .onChange((v) => (innerSphereMaterial.iridescence = innerSphereMaterial2.iridescence = v))
innerSpheresFolder
  .add(params, 'innerSpheresAOIntensity', 0, 1.2, 0.01)
  .name('AO Intensity')
  .onChange((v) => (sphereAO.intensity.value = v))
innerSpheresFolder
  .add(params, 'innerSpheresAORadius', 0.1, 5, 0.01)
  .name('AO Radius')
  .onChange((v) => (sphereAO.radius.value = v))
const physicsFolder = gui.addFolder('Physics')
physicsFolder.add(params, 'wanderStrength', 0, 3, 0.01).name('Wander Strength')
physicsFolder.add(params, 'wanderSpeed', 0, 2, 0.01).name('Wander Speed')
physicsFolder.add(params, 'attractionStrength', 0, 10, 0.01).name('Attraction')
physicsFolder
  .add(params, 'linearDamping', 0, 10)
  .name('Linear Damping')
  .onChange((v) => {
    for (const { rigidBody } of innerSphereBodies) {
      rigidBody.setLinearDamping(v)
    }
  })
physicsFolder
  .add(params, 'angularDamping', 0, 10)
  .name('Angular Damping')
  .onChange((v) => {
    for (const { rigidBody } of innerSphereBodies) {
      rigidBody.setAngularDamping(v)
    }
  })
physicsFolder
  .add(params, 'restitution', 0, 1)
  .name('Bounciness')
  .onChange((v) => {
    for (const { rigidBody } of innerSphereBodies) {
      const numColliders = rigidBody.numColliders()
      for (let i = 0; i < numColliders; i++) {
        rigidBody.collider(i).setRestitution(v)
      }
    }
  })

const transmissionFolder = gui.addFolder('Transmission')
transmissionFolder
  .addColor(params, 'color')
  .name('Color')
  .onChange((v) => material.color.set(v))
transmissionFolder
  .add(params, 'transmission', 0, 1)
  .name('Transmission')
  .onChange((v) => (material.transmission = v))
transmissionFolder
  .add(params, 'thickness', 0, 5)
  .name('Thickness')
  .onChange((v) => (material.thickness = v))
transmissionFolder
  .add(params, 'roughness', 0, 1)
  .name('Roughness')
  .onChange((v) => (material.roughness = v))
transmissionFolder
  .add(params, 'ior', 1, 2.33)
  .name('IOR')
  .onChange((v) => (material.ior = v))
transmissionFolder
  .add(params, 'dispersion', 0, 15)
  .name('Dispersion')
  .onChange((v) => (material.dispersion = v))
transmissionFolder
  .addColor(params, 'attenuationColor')
  .name('Attenuation Color')
  .onChange((v) => material.attenuationColor.set(v))
transmissionFolder
  .add(params, 'attenuationDistance', 0, 10)
  .name('Attenuation Dist')
  .onChange((v) => (material.attenuationDistance = v))
transmissionFolder
  .add(params, 'envMapIntensity', 0, 3)
  .name('EnvMap Intensity')
  .onChange((v) => (material.envMapIntensity = v))
transmissionFolder
  .add(params, 'iridescence', 0, 8)
  .name('Iridescence')
  .onChange((v) => (material.iridescence = v))
transmissionFolder
  .add(params, 'iridescenceIOR', 1, 2.33)
  .name('Iridescence IOR')
  .onChange((v) => (material.iridescenceIOR = v))
transmissionFolder
  .add(params, 'iridescenceThicknessMin', 0, 800)
  .name('Irid. Thickness Min')
  .onChange((v) => (material.iridescenceThicknessRange = [v, params.iridescenceThicknessMax]))
transmissionFolder
  .add(params, 'iridescenceThicknessMax', 0, 800)
  .name('Irid. Thickness Max')
  .onChange((v) => (material.iridescenceThicknessRange = [params.iridescenceThicknessMin, v]))
transmissionFolder
  .add(params, 'clearcoat', 0, 1)
  .name('Clearcoat')
  .onChange((v) => (material.clearcoat = v))
transmissionFolder
  .add(params, 'clearcoatRoughness', 0, 1)
  .name('Clearcoat Roughness')
  .onChange((v) => (material.clearcoatRoughness = v))
transmissionFolder
  .add(params, 'sheen', 0, 1)
  .name('Sheen')
  .onChange((v) => (material.sheen = v))
transmissionFolder
  .add(params, 'sheenRoughness', 0, 1)
  .name('Sheen Roughness')
  .onChange((v) => (material.sheenRoughness = v))
transmissionFolder
  .addColor(params, 'sheenColor')
  .name('Sheen Color')
  .onChange((v) => material.sheenColor.set(v))
transmissionFolder
  .add(params, 'specularIntensity', 0, 2)
  .name('Specular Intensity')
  .onChange((v) => (material.specularIntensity = v))
transmissionFolder
  .addColor(params, 'specularColor')
  .name('Specular Color')
  .onChange((v) => material.specularColor.set(v))
transmissionFolder
  .addColor(params, 'emissive')
  .name('Emissive')
  .onChange((v) => material.emissive.set(v))
transmissionFolder
  .add(params, 'emissiveIntensity', 0, 5)
  .name('Emissive Intensity')
  .onChange((v) => (material.emissiveIntensity = v))
transmissionFolder
  .add(params, 'anisotropy', -1, 1)
  .name('Anisotropy')
  .onChange((v) => (material.anisotropy = v))

const interactionFolder = gui.addFolder('Interaction')
interactionFolder
  .add(params, 'stiffness', 0, 1, 0.005)
  .name('Stiffness')
  .onChange((v) => (damping.value = v))
interactionFolder.add(params, 'viscosity', 0.001, 0.999, 0.001).onChange((v) => (viscosity.value = v))
interactionFolder
  .add(params, 'brushSize', 0.1, 1.5)
  .name('Brush Size')
  .onChange((v) => (brushSize.value = v))
interactionFolder
  .add(params, 'brushStrength', 0.01, 3, 0.01)
  .name('Brush Strength')
  .onChange((v) => (brushStrength.value = v))
interactionFolder
  .add(params, 'brushDamping', 0.001, 0.5, 0.001)
  .name('Brush Damping')
  .onChange((v) => (brushDamping.value = v))
interactionFolder
  .add(params, 'mouseBallRadius', 0.1, 1.5, 0.01)
  .name('Mouse Ball Radius')
  .onChange((v) => {
    mouseBallDebugMesh.geometry.dispose()
    mouseBallDebugMesh.geometry = new THREE.SphereGeometry(v, 16, 16)
  })
interactionFolder.add(params, 'mouseBallStrength', 0, 20, 0.1).name('Mouse Ball Strength')

window.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P') {
    params.debug = !params.debug
    setDebug(params.debug)
    gui
      .controllersRecursive()
      .find((c) => c.property === 'debug')
      .updateDisplay()
  }
})

// ─── Resize ──────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  scene.background = createGradientTexture(params.backgroundTop, params.backgroundBottom)
  const dpr = Math.min(window.devicePixelRatio, 2)
  textCanvas.width = window.innerWidth * dpr
  textCanvas.height = window.innerHeight * dpr
  updateTextPlane()
  textPlane.geometry.dispose()
  const newAspect = window.innerWidth / window.innerHeight
  textPlane.geometry = new THREE.PlaneGeometry(textPlaneHeight * newAspect, textPlaneHeight)
})

// ─── Animation loop ──────────────────────────────────────────────────────────

const prevHitPoint = new THREE.Vector3()
const _mouseBallPos = new THREE.Vector3()

const _attractDir = new THREE.Vector3()
const _wanderDir = new THREE.Vector3()
// Each sphere gets a unique random phase offset for its wander noise
const wanderSeeds = innerSphereBodies.map(() => ({
  ox: Math.random() * 1000,
  oy: Math.random() * 1000,
  oz: Math.random() * 1000,
}))
const debugArrows = innerSphereBodies.map(() => {
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.5, 0xff00ff)
  arrow.visible = false
  scene.add(arrow)
  return arrow
})

renderer.setAnimationLoop(async (timestamp) => {
  raycaster.setFromCamera(mouseNDC, camera)
  const intersects = raycaster.intersectObject(raycastSphere)

  if (intersects.length > 0) {
    const hitPoint = intersects[0].point
    const velocity = hitPoint.distanceTo(prevHitPoint)
    prevHitPoint.copy(hitPoint)
    pointerPosition.value.copy(hitPoint)
    pointerSpeed.value = THREE.MathUtils.lerp(pointerSpeed.value, velocity, 0.3)
    // Project mouse ball to the point on the ray closest to the origin
    // so it reaches the inner spheres instead of staying on the surface
    const ray = raycaster.ray
    const t = -ray.origin.dot(ray.direction)
    _mouseBallPos.copy(ray.direction).multiplyScalar(t).add(ray.origin)
    mouseBallDebugMesh.position.copy(_mouseBallPos)
    mouseBallActive = true
  } else {
    pointerSpeed.value = THREE.MathUtils.lerp(pointerSpeed.value, 0, 0.1)
    mouseBallActive = false
    mouseBallDebugMesh.position.set(100, 100, 100)
  }

  const dt = 1 / 60
  const t = timestamp * 0.001
  for (let j = 0; j < innerSphereBodies.length; j++) {
    const { rigidBody } = innerSphereBodies[j]
    const pos = rigidBody.translation()
    const seed = wanderSeeds[j]
    // Attraction toward center
    _attractDir
      .set(-pos.x, -pos.y, -pos.z)
      .normalize()
      .multiplyScalar(params.attractionStrength * dt)
    // Slow per-body wander force using offset sine waves
    const s = params.wanderSpeed
    _wanderDir.set(
      Math.sin(t * s + seed.ox) + Math.sin(t * s * 0.57 + seed.ox * 2),
      Math.sin(t * s * 0.77 + seed.oy) + Math.sin(t * s * 0.43 + seed.oy * 2),
      Math.sin(t * s * 0.63 + seed.oz) + Math.sin(t * s * 0.37 + seed.oz * 2),
    )
    _wanderDir.normalize().multiplyScalar(params.wanderStrength * dt)
    _attractDir.add(_wanderDir)

    // Mouse ball repulsion
    if (mouseBallActive) {
      const dx = pos.x - _mouseBallPos.x
      const dy = pos.y - _mouseBallPos.y
      const dz = pos.z - _mouseBallPos.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const radius = params.mouseBallRadius + innerSphereRadius
      if (dist < radius && dist > 0.001) {
        const overlap = radius - dist
        const force = overlap * params.mouseBallStrength * dt
        const invDist = 1 / dist
        _attractDir.x += dx * invDist * force
        _attractDir.y += dy * invDist * force
        _attractDir.z += dz * invDist * force
      }
    }

    rigidBody.applyImpulse(_attractDir, true)
  }
  world.step()


  // Sync Three.js meshes with physics bodies
  for (let j = 0; j < innerSphereBodies.length; j++) {
    const { mesh: m, rigidBody } = innerSphereBodies[j]
    const pos = rigidBody.translation()
    const rot = rigidBody.rotation()
    m.position.set(pos.x, pos.y, pos.z)
    m.quaternion.set(rot.x, rot.y, rot.z, rot.w)

    // Update sphere AO data
    sphereAO.update(j, pos.x, pos.y, pos.z, innerSphereRadius)

    if (params.debug) {
      const seed = wanderSeeds[j]
      const s = params.wanderSpeed
      _wanderDir.set(
        Math.sin(t * s + seed.ox) + Math.sin(t * s * 0.57 + seed.ox * 2),
        Math.sin(t * s * 0.77 + seed.oy) + Math.sin(t * s * 0.43 + seed.oy * 2),
        Math.sin(t * s * 0.63 + seed.oz) + Math.sin(t * s * 0.37 + seed.oz * 2),
      )
      _wanderDir.normalize()
      debugArrows[j].position.copy(m.position)
      debugArrows[j].setDirection(_wanderDir)
    }
  }

  renderer.compute(computeUpdate)
  renderer.render(scene, camera)

  stats.update()
  await renderer.resolveTimestampsAsync('compute')
  await renderer.resolveTimestampsAsync('render')
})
