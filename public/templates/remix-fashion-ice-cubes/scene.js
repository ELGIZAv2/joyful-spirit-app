import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import Stats from 'stats-gl'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { TransmissionMaterial } from './TransmissionMaterial.js'
import { FixedTimestep } from './FixedTimestep.js'

// ─── Rapier physics ─────────────────────────────────────────────────────────
await RAPIER.init()
const gravity = new RAPIER.Vector3(0, 0, 0)
const world = new RAPIER.World(gravity)

// ─── Scene setup ─────────────────────────────────────────────────────────────

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.toneMapping = THREE.AgXToneMapping
renderer.setPixelRatio(window.devicePixelRatio)
renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;'
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
await renderer.init()

const stats = new Stats({ trackGPU: true })
document.body.appendChild(stats.dom)
stats.init(renderer)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100)
camera.position.set(0, 0, 6)

// Debug overlay for OrbitControls
const debugOverlay = document.createElement('div')
debugOverlay.style.cssText = 'position:fixed;inset:0;z-index:1;display:none;'
document.body.appendChild(debugOverlay)

const controls = new OrbitControls(camera, debugOverlay)
controls.target.set(0, 0, 0)
controls.update()

// ─── Params ──────────────────────────────────────────────────────────────────

const params = {
  debug: false,
  background: '#ffffff',
  toneMapping: 'AgX',
  // Text
  textColor: '#000000',
  textSize: 0.38,
  // Material
  blurMode: 'blue', // 'mip' or 'blue'
  color: '#ffffff',
  transmission: 1,
  thickness: 1,
  roughness: 0.05,
  ior: 1.5,
  dispersion: 5,
  frostBlur: 0.07,
  frostNoiseAmplitude: 0.2,
  frostNoiseFrequency: 0.1,
  attenuationColor: '#ffffff',
  attenuationDistance: 2,
  envMapIntensity: 1,
  iridescence: 2,
  iridescenceIOR: 1,
  iridescenceThicknessMin: 100,
  iridescenceThicknessMax: 400,
  clearcoat: 0,
  clearcoatRoughness: 0,
  specularIntensity: 1,
  specularColor: '#ffffff',
  // Physics
  mouseBallRadius: 0.46,
  wanderStrength: 0.86,
  wanderSpeed: 0.3,
  attractionStrength: 10,
  linearDamping: 1.4,
  angularDamping: 5.08,
  friction: 0.2,
  restitution: 0.14,
  waterDrag: true,
  waterDragCoefficient: 1.19,
  // Lighting
  ambientIntensity: 0.6,
  spotIntensity: 200,
}

// ─── Background ──────────────────────────────────────────────────────────────

scene.background = new THREE.Color(params.background)

// ─── Lights ──────────────────────────────────────────────────────────────────

const ambientLight = new THREE.AmbientLight('#ffffff', params.ambientIntensity)
scene.add(ambientLight)

const spotLight = new THREE.SpotLight('#ffffff', params.spotIntensity, 0, 0.15, 1)
spotLight.position.set(10, 10, 10)
scene.add(spotLight)

// ─── Procedural environment ──────────────────────────────────────────────────

function createLightformerEnvMap() {
  const envScene = new THREE.Scene()
  const group = new THREE.Group()
  group.rotation.set(-Math.PI / 3, 0, 1)
  envScene.add(group)

  const circleMat = (intensity) =>
    new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide })
  const circleGeo = new THREE.CircleGeometry(1, 64)

  const lf1 = new THREE.Mesh(circleGeo, circleMat(4))
  lf1.rotation.x = Math.PI / 2
  lf1.position.set(0, 5, -9)
  lf1.scale.setScalar(2)
  group.add(lf1)

  const lf2 = new THREE.Mesh(circleGeo, circleMat(2))
  lf2.rotation.y = Math.PI / 2
  lf2.position.set(-5, 1, -1)
  lf2.scale.setScalar(2)
  group.add(lf2)

  const lf3 = new THREE.Mesh(circleGeo, circleMat(2))
  lf3.rotation.y = Math.PI / 2
  lf3.position.set(-5, -1, -1)
  lf3.scale.setScalar(2)
  group.add(lf3)

  const lf4 = new THREE.Mesh(circleGeo, circleMat(2))
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

// ─── Text plane behind cubes ─────────────────────────────────────────────────

const textCanvas = document.createElement('canvas')
const textDpr = Math.min(window.devicePixelRatio, 2)
textCanvas.width = window.innerWidth * textDpr
textCanvas.height = window.innerHeight * textDpr
const textCtx = textCanvas.getContext('2d')
let textTexture = new THREE.CanvasTexture(textCanvas)
textTexture.colorSpace = THREE.SRGBColorSpace

function updateTextPlane() {
  const w = textCanvas.width
  const h = textCanvas.height
  textCtx.clearRect(0, 0, w, h)
  textCtx.fillStyle = params.textColor
  textCtx.textBaseline = 'middle'

  const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif'

  // ── Decorative border lines ──
  textCtx.strokeStyle = params.textColor
  textCtx.lineWidth = 2
  textCtx.beginPath()
  textCtx.moveTo(w * 0.04, h * 0.085)
  textCtx.lineTo(w * 0.96, h * 0.085)
  textCtx.stroke()
  textCtx.beginPath()
  textCtx.moveTo(w * 0.04, h * 0.925)
  textCtx.lineTo(w * 0.96, h * 0.925)
  textCtx.stroke()

  // ── Top bar ──
  const topBarSize = Math.round(h * 0.022)
  textCtx.font = `700 ${topBarSize}px ${serif}`
  textCtx.letterSpacing = '12px'
  textCtx.textAlign = 'center'
  textCtx.fillText('COCKTAILS  \u00B7  CHAMPAGNE  \u00B7  SPIRITS', w / 2, h * 0.055)

  // ── Main title ──
  const mainSize = Math.round(h * params.textSize)
  textCtx.font = `italic 300 ${mainSize}px ${serif}`
  textCtx.textAlign = 'center'
  textCtx.letterSpacing = '0px'
  textCtx.fillText('Noir', w / 2, h * 0.2)
  textCtx.fillText('Lounge', w / 2, h * 0.2 + mainSize * 0.86)

  // Tagline
  const tagSize = Math.round(h * 0.035)
  textCtx.font = `italic 600 ${tagSize}px ${serif}`
  textCtx.letterSpacing = '4px'
  textCtx.fillText('Where the night begins', w / 2, h * 0.2 + mainSize * 1.5)

  // ── Cocktail menu ──
  const menuSize = Math.round(h * 0.028)
  textCtx.font = `700 ${menuSize}px ${serif}`
  textCtx.letterSpacing = '8px'
  textCtx.fillText('NEGRONI  \u00B7  MARTINI  \u00B7  MANHATTAN', w / 2, h * 0.62)
  const menuSize2 = Math.round(h * 0.022)
  textCtx.font = `600 ${menuSize2}px ${serif}`
  textCtx.letterSpacing = '6px'
  textCtx.fillText('OLD FASHIONED  \u00B7  ESPRESSO MARTINI', w / 2, h * 0.665)

  // ── Bottom feature text ──
  const bottomSize = Math.round(h * params.textSize * 0.52)
  textCtx.font = `italic 300 ${bottomSize}px ${serif}`
  textCtx.letterSpacing = '0px'
  textCtx.fillText('\u00C0 votre sant\u00E9', w / 2, h * 0.79)

  // ── Side columns (hidden on narrow screens) ──
  const leftX = w * 0.05
  const rightX = w * 0.95

  if (window.innerWidth >= 1200) {
    textCtx.textAlign = 'left'
    textCtx.letterSpacing = '0px'

    // Big italic phrase
    const leftHeroSize = Math.round(h * 0.055)
    textCtx.font = `italic 300 ${leftHeroSize}px ${serif}`
    textCtx.fillText('The art of', leftX, h * 0.16)
    textCtx.fillText('the perfect', leftX, h * 0.22)
    textCtx.fillText('pour', leftX, h * 0.28)

    // Label
    const labelSize = Math.round(h * 0.018)
    textCtx.font = `700 ${labelSize}px ${serif}`
    textCtx.letterSpacing = '8px'
    textCtx.fillText('ROOFTOP TERRACE', leftX, h * 0.36)
    textCtx.letterSpacing = '0px'

    // Smaller italic details
    const detailSize = Math.round(h * 0.028)
    textCtx.font = `italic 300 ${detailSize}px ${serif}`
    textCtx.fillText('Live jazz, every', leftX, h * 0.44)
    textCtx.fillText('Friday & Saturday', leftX, h * 0.475)

    // Hours block
    const hoursSize = Math.round(h * 0.042)
    textCtx.font = `italic 300 ${hoursSize}px ${serif}`
    textCtx.fillText('Tuesday', leftX, h * 0.57)
    textCtx.fillText('through', leftX, h * 0.62)
    textCtx.fillText('Saturday', leftX, h * 0.67)

    const timeSize = Math.round(h * 0.022)
    textCtx.font = `italic 300 ${timeSize}px ${serif}`
    textCtx.fillText('from eight in the evening', leftX, h * 0.73)

    // ── Right column ──
    textCtx.textAlign = 'right'

    // Big italic phrase
    textCtx.font = `italic 300 ${leftHeroSize}px ${serif}`
    textCtx.letterSpacing = '0px'
    textCtx.fillText('An evening', rightX, h * 0.16)
    textCtx.fillText('you won\u2019t', rightX, h * 0.22)
    textCtx.fillText('forget', rightX, h * 0.28)

    // Label
    textCtx.font = `700 ${labelSize}px ${serif}`
    textCtx.letterSpacing = '8px'
    textCtx.fillText('42 RUE DU FAUBOURG', rightX, h * 0.36)
    textCtx.letterSpacing = '0px'

    // Smaller italic details
    textCtx.font = `italic 300 ${detailSize}px ${serif}`
    textCtx.fillText('Sommelier curated', rightX, h * 0.44)
    textCtx.fillText('wines & rare spirits', rightX, h * 0.475)

    // Phrase block
    textCtx.font = `italic 300 ${hoursSize}px ${serif}`
    textCtx.fillText('Crafted', rightX, h * 0.57)
    textCtx.fillText('with', rightX, h * 0.62)
    textCtx.fillText('intention', rightX, h * 0.67)

    textCtx.font = `italic 300 ${timeSize}px ${serif}`
    textCtx.fillText('since two thousand and nineteen', rightX, h * 0.73)
  }

  // ── Bottom corners (above line) ──
  const botCornerSize = Math.round(h * 0.02)
  textCtx.font = `700 ${botCornerSize}px ${serif}`
  textCtx.letterSpacing = '6px'
  textCtx.textAlign = 'left'
  textCtx.fillText('NOIR.PARIS', leftX, h * 0.88)
  const botSmallSize = Math.round(h * 0.016)
  textCtx.font = `600 ${botSmallSize}px ${serif}`
  textCtx.letterSpacing = '4px'
  textCtx.fillText('+33 1 42 68 00 00', leftX, h * 0.91)

  textCtx.font = `700 ${botCornerSize}px ${serif}`
  textCtx.letterSpacing = '6px'
  textCtx.textAlign = 'right'
  textCtx.fillText('DRESS CODE', rightX, h * 0.88)
  textCtx.font = `600 ${botSmallSize}px ${serif}`
  textCtx.letterSpacing = '4px'
  textCtx.fillText('MEMBERS & GUESTS', rightX, h * 0.91)

  // ── Bottom bar (below line) ──
  const botBarSize = Math.round(h * 0.018)
  textCtx.font = `700 ${botBarSize}px ${serif}`
  textCtx.letterSpacing = '10px'
  textCtx.textAlign = 'center'
  textCtx.fillText('RESERVATIONS  \u00B7  PRIVATE EVENTS', w / 2, h * 0.96)

  textCtx.letterSpacing = '0px'

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

const font = new FontFace(
  'Cormorant Garamond',
  'url(https://fonts.gstatic.com/s/cormorantgaramond/v21/co3smX5slCNuHLi8bLeY9MK7whWMhyjYrGFEsdtdc62E6zd5rDDOjw.ttf)',
  { weight: '300', style: 'italic' },
)
const fontRegular = new FontFace(
  'Cormorant Garamond',
  'url(https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_v86GnM.ttf)',
  { weight: '400', style: 'normal' },
)
await Promise.all([font.load(), fontRegular.load()])
document.fonts.add(font)
document.fonts.add(fontRegular)
updateTextPlane()

// ─── Glass material ─────────────────────────────────────────────────────────

const glassMaterial = new TransmissionMaterial(params)

// ─── Cubes with physics ─────────────────────────────────────────────────────

const cubeSize = 1.4
const cubeHalf = cubeSize / 2
const geometry = new RoundedBoxGeometry(cubeSize, cubeSize, cubeSize, 5, 0.08)

const cubeStartPositions = [
  [0, 0, 1],
  [2, 1.5, -0.5],
  [-1.8, -1.2, 0.4],
  [1, -1.8, -0.8],
]

const colliderDesc = RAPIER.ColliderDesc.cuboid(cubeHalf, cubeHalf, cubeHalf)
  .setRestitution(params.restitution)
  .setFriction(params.friction)

const cubeBodies = cubeStartPositions.map((pos) => {
  const mesh = glassMaterial.createMesh(geometry)
  mesh.position.set(...pos)
  // Random initial rotation
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
  scene.add(mesh)

  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(...pos)
    .setLinearDamping(params.linearDamping)
    .setAngularDamping(params.angularDamping)
  const rigidBody = world.createRigidBody(rigidBodyDesc)
  // Set initial rotation to match the mesh
  const q = new THREE.Quaternion().setFromEuler(mesh.rotation)
  rigidBody.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true)
  world.createCollider(colliderDesc, rigidBody)

  return { mesh, rigidBody }
})

// Wander seeds for each cube
const wanderSeeds = cubeBodies.map(() => ({
  ox: Math.random() * 1000,
  oy: Math.random() * 1000,
  oz: Math.random() * 1000,
}))

// ─── Mouse sphere collider (kinematic) ──────────────────────────────────────

const raycaster = new THREE.Raycaster()
const mouseNDC = new THREE.Vector2(-Infinity, -Infinity)

// Invisible sphere for raycasting (covers the cluster area)
const raycastSphere = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), new THREE.MeshBasicMaterial({ visible: false }))
scene.add(raycastSphere)

// Kinematic rigid body with sphere collider for mouse
const mouseBallBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(100, 100, 100)
const mouseBallBody = world.createRigidBody(mouseBallBodyDesc)
let mouseBallCollider = world.createCollider(
  RAPIER.ColliderDesc.ball(params.mouseBallRadius).setRestitution(0.5).setFriction(0.1),
  mouseBallBody,
)

const mouseBallDebugMesh = new THREE.Mesh(
  new THREE.SphereGeometry(params.mouseBallRadius, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }),
)
mouseBallDebugMesh.visible = false
scene.add(mouseBallDebugMesh)

const _mouseBallPos = new THREE.Vector3()

window.addEventListener('pointermove', (event) => {
  mouseNDC.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1)
})

// ─── Wall colliders ─────────────────────────────────────────────────────────

const wallThickness = 0.5
const zExtent = 2 // how far cubes can go forward/back

function createWalls() {
  const vFov = THREE.MathUtils.degToRad(camera.fov / 2)
  const dist = camera.position.z
  const visibleH = 2 * dist * Math.tan(vFov)
  const visibleW = visibleH * camera.aspect
  const halfW = visibleW / 2
  const halfH = visibleH / 2
  const bigHalf = Math.max(halfW, halfH) + wallThickness

  const walls = [
    // Left
    { pos: [-halfW - wallThickness / 2, 0, 0], half: [wallThickness / 2, bigHalf, bigHalf] },
    // Right
    { pos: [halfW + wallThickness / 2, 0, 0], half: [wallThickness / 2, bigHalf, bigHalf] },
    // Top
    { pos: [0, halfH + wallThickness / 2, 0], half: [bigHalf, wallThickness / 2, bigHalf] },
    // Bottom
    { pos: [0, -halfH - wallThickness / 2, 0], half: [bigHalf, wallThickness / 2, bigHalf] },
    // Front (close to camera)
    { pos: [0, 0, zExtent + wallThickness / 2], half: [bigHalf, bigHalf, wallThickness / 2] },
    // Back
    { pos: [0, 0, -zExtent - wallThickness / 2], half: [bigHalf, bigHalf, wallThickness / 2] },
  ]

  return walls.map(({ pos, half }) => {
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(...pos)
    const body = world.createRigidBody(bodyDesc)
    const collider = RAPIER.ColliderDesc.cuboid(...half)
      .setRestitution(0.5)
      .setFriction(0.1)
    world.createCollider(collider, body)
    return body
  })
}

let wallBodies = createWalls()

// ─── GUI ─────────────────────────────────────────────────────────────────────

const gui = new GUI({ closeFolders: true })
gui.domElement.style.display = 'none'

function setDebug(v) {
  stats.dom.style.display = v ? '' : 'none'
  debugOverlay.style.display = v ? '' : 'none'
  controls.enabled = v
  mouseBallDebugMesh.visible = v
  if (v) gui.domElement.style.display = ''
}

setDebug(params.debug)
gui.add(params, 'debug').name('Debug (P)').onChange(setDebug)

const envFolder = gui.addFolder('Environment')
envFolder
  .addColor(params, 'background')
  .name('Background')
  .onChange((v) => {
    scene.background = new THREE.Color(v)
  })
envFolder
  .add(params, 'ambientIntensity', 0, 5)
  .name('Ambient')
  .onChange((v) => (ambientLight.intensity = v))
envFolder
  .add(params, 'spotIntensity', 0, 1000)
  .name('Spot')
  .onChange((v) => (spotLight.intensity = v))
const toneMappingOptions = {
  None: THREE.NoToneMapping,
  Linear: THREE.LinearToneMapping,
  Reinhard: THREE.ReinhardToneMapping,
  Cineon: THREE.CineonToneMapping,
  ACESFilmic: THREE.ACESFilmicToneMapping,
  AgX: THREE.AgXToneMapping,
  Neutral: THREE.NeutralToneMapping,
}
envFolder
  .add(params, 'toneMapping', Object.keys(toneMappingOptions))
  .name('Tone Mapping')
  .onChange((v) => {
    renderer.toneMapping = toneMappingOptions[v]
  })

const matFolder = gui.addFolder('Material')
matFolder
  .addColor(params, 'color')
  .name('Color')
  .onChange((v) => (glassMaterial.color = v))
matFolder
  .add(params, 'transmission', 0, 1)
  .name('Transmission')
  .onChange((v) => (glassMaterial.transmission = v))
matFolder
  .add(params, 'thickness', 0, 5)
  .name('Thickness')
  .onChange((v) => (glassMaterial.thickness = v))
matFolder
  .add(params, 'roughness', 0, 1)
  .name('Roughness')
  .onChange((v) => (glassMaterial.roughness = v))
matFolder
  .add(params, 'ior', 1, 2.33)
  .name('IOR')
  .onChange((v) => (glassMaterial.ior = v))
matFolder
  .add(params, 'dispersion', 0, 40)
  .name('Dispersion')
  .onChange((v) => (glassMaterial.dispersion = v))
matFolder
  .add(params, 'frostBlur', 0, 1)
  .name('Frost Blur')
  .onChange((v) => (glassMaterial.frostBlur = v))
matFolder
  .add(params, 'frostNoiseAmplitude', 0, 3)
  .name('Frost Noise Amp')
  .onChange((v) => (glassMaterial.frostNoiseAmplitude = v))
matFolder
  .add(params, 'frostNoiseFrequency', 0.01, 0.3, 0.01)
  .name('Frost Noise Freq')
  .onChange((v) => (glassMaterial.frostNoiseFrequency = v))
matFolder
  .addColor(params, 'attenuationColor')
  .name('Atten. Color')
  .onChange((v) => (glassMaterial.attenuationColor = v))
matFolder
  .add(params, 'attenuationDistance', 0, 10)
  .name('Atten. Dist')
  .onChange((v) => (glassMaterial.attenuationDistance = v))
matFolder
  .add(params, 'envMapIntensity', 0, 3)
  .name('EnvMap Int.')
  .onChange((v) => (glassMaterial.envMapIntensity = v))
matFolder
  .add(params, 'iridescence', 0, 8)
  .name('Iridescence')
  .onChange((v) => (glassMaterial.iridescence = v))
matFolder
  .add(params, 'iridescenceIOR', 1, 2.33)
  .name('Irid. IOR')
  .onChange((v) => (glassMaterial.iridescenceIOR = v))
matFolder
  .add(params, 'iridescenceThicknessMin', 0, 800)
  .name('Irid. Min')
  .onChange((v) => (glassMaterial.iridescenceThicknessRange = [v, params.iridescenceThicknessMax]))
matFolder
  .add(params, 'iridescenceThicknessMax', 0, 800)
  .name('Irid. Max')
  .onChange((v) => (glassMaterial.iridescenceThicknessRange = [params.iridescenceThicknessMin, v]))
matFolder
  .add(params, 'clearcoat', 0, 1)
  .name('Clearcoat')
  .onChange((v) => (glassMaterial.clearcoat = v))
matFolder
  .add(params, 'clearcoatRoughness', 0, 1)
  .name('CC Roughness')
  .onChange((v) => (glassMaterial.clearcoatRoughness = v))
matFolder
  .add(params, 'specularIntensity', 0, 2)
  .name('Specular Int.')
  .onChange((v) => (glassMaterial.specularIntensity = v))
matFolder
  .addColor(params, 'specularColor')
  .name('Specular Color')
  .onChange((v) => (glassMaterial.specularColor = v))

const physicsFolder = gui.addFolder('Physics')
physicsFolder.add(params, 'wanderStrength', 0, 3, 0.01).name('Wander Strength')
physicsFolder.add(params, 'wanderSpeed', 0, 2, 0.01).name('Wander Speed')
physicsFolder.add(params, 'attractionStrength', 0, 30, 0.01).name('Attraction')
physicsFolder
  .add(params, 'mouseBallRadius', 0.1, 2, 0.01)
  .name('Mouse Ball Radius')
  .onChange((v) => {
    mouseBallDebugMesh.geometry.dispose()
    mouseBallDebugMesh.geometry = new THREE.SphereGeometry(v, 16, 16)
    world.removeCollider(mouseBallCollider, false)
    mouseBallCollider = world.createCollider(
      RAPIER.ColliderDesc.ball(v).setRestitution(0.5).setFriction(0.1),
      mouseBallBody,
    )
  })
physicsFolder
  .add(params, 'linearDamping', 0, 10)
  .name('Linear Damping')
  .onChange((v) => {
    for (const { rigidBody } of cubeBodies) rigidBody.setLinearDamping(v)
  })
physicsFolder
  .add(params, 'angularDamping', 0, 10)
  .name('Angular Damping')
  .onChange((v) => {
    for (const { rigidBody } of cubeBodies) rigidBody.setAngularDamping(v)
  })
physicsFolder
  .add(params, 'restitution', 0, 1)
  .name('Restitution')
  .onChange((v) => {
    for (const { rigidBody } of cubeBodies) {
      for (let i = 0; i < rigidBody.numColliders(); i++) {
        rigidBody.collider(i).setRestitution(v)
      }
    }
  })
physicsFolder
  .add(params, 'friction', 0, 2)
  .name('Friction')
  .onChange((v) => {
    for (const { rigidBody } of cubeBodies) {
      for (let i = 0; i < rigidBody.numColliders(); i++) {
        rigidBody.collider(i).setFriction(v)
      }
    }
  })
physicsFolder.add(params, 'waterDrag').name('Water Drag')
physicsFolder.add(params, 'waterDragCoefficient', 0, 5, 0.01).name('Drag Coefficient')

window.addEventListener('keydown', (e) => {
  if (e.key === 'c' || e.key === 'C') {
    const hidden = gui.domElement.style.display === 'none'
    gui.domElement.style.display = hidden ? '' : 'none'
  }
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
  textCanvas.width = window.innerWidth * textDpr
  textCanvas.height = window.innerHeight * textDpr
  updateTextPlane()
  // Recreate texture — WebGPU GPUTexture has fixed dimensions, so needsUpdate alone
  // won't handle a canvas resize. We must dispose and create a new CanvasTexture.
  textTexture.dispose()
  textTexture = new THREE.CanvasTexture(textCanvas)
  textTexture.colorSpace = THREE.SRGBColorSpace
  textPlane.material.map = textTexture
  textPlane.geometry.dispose()
  const newAspect = window.innerWidth / window.innerHeight
  textPlane.geometry = new THREE.PlaneGeometry(textPlaneHeight * newAspect, textPlaneHeight)
  // Recreate wall colliders for new viewport size
  for (const body of wallBodies) world.removeRigidBody(body)
  wallBodies = createWalls()
})

// ─── Animation loop ──────────────────────────────────────────────────────────

const _attractDir = new THREE.Vector3()
const _wanderDir = new THREE.Vector3()
const physicsTimestep = new FixedTimestep()

renderer.setAnimationLoop(async (timestamp) => {
  // Raycast for mouse ball
  raycaster.setFromCamera(mouseNDC, camera)
  const intersects = raycaster.intersectObject(raycastSphere)

  if (intersects.length > 0) {
    const ray = raycaster.ray
    const t = -ray.origin.dot(ray.direction)
    _mouseBallPos.copy(ray.direction).multiplyScalar(t).add(ray.origin)
    mouseBallDebugMesh.position.copy(_mouseBallPos)
  } else {
    _mouseBallPos.set(100, 100, 100)
    mouseBallDebugMesh.position.set(100, 100, 100)
  }

  // Fixed-timestep physics
  const steps = physicsTimestep.update(timestamp)
  const dt = physicsTimestep.dt
  for (let i = 0; i < steps; i++) {
    try {
      mouseBallBody.setNextKinematicTranslation({ x: _mouseBallPos.x, y: _mouseBallPos.y, z: _mouseBallPos.z })

      const t = timestamp * 0.001
      for (let j = 0; j < cubeBodies.length; j++) {
        const { rigidBody } = cubeBodies[j]
        const pos = rigidBody.translation()
        const seed = wanderSeeds[j]

        // Attraction toward center
        _attractDir
          .set(-pos.x, -pos.y, -pos.z)
          .normalize()
          .multiplyScalar(params.attractionStrength * dt)

        // Slow per-body wander force
        const s = params.wanderSpeed
        _wanderDir.set(
          Math.sin(t * s + seed.ox) + Math.sin(t * s * 0.57 + seed.ox * 2),
          Math.sin(t * s * 0.77 + seed.oy) + Math.sin(t * s * 0.43 + seed.oy * 2),
          Math.sin(t * s * 0.63 + seed.oz) + Math.sin(t * s * 0.37 + seed.oz * 2),
        )
        _wanderDir.normalize().multiplyScalar(params.wanderStrength * dt)
        _attractDir.add(_wanderDir)

        // Water drag — quadratic resistance opposing velocity
        if (params.waterDrag) {
          const vel = rigidBody.linvel()
          const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
          if (speed > 0.001) {
            const dragForce = params.waterDragCoefficient * speed * speed * dt
            const invSpeed = 1 / speed
            _attractDir.x -= vel.x * invSpeed * dragForce
            _attractDir.y -= vel.y * invSpeed * dragForce
            _attractDir.z -= vel.z * invSpeed * dragForce
          }
        }

        rigidBody.applyImpulse(_attractDir, true)
      }
      world.step()
    } catch {}
  }

  // Sync Three.js meshes with physics bodies
  for (let j = 0; j < cubeBodies.length; j++) {
    const { mesh, rigidBody } = cubeBodies[j]
    try {
      const pos = rigidBody.translation()
      const rot = rigidBody.rotation()
      mesh.position.set(pos.x, pos.y, pos.z)
      mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w)
    } catch {}
  }

  renderer.render(scene, camera)

  stats.update()
  await renderer.resolveTimestampsAsync('render')
  await renderer.resolveTimestampsAsync('compute')
})
