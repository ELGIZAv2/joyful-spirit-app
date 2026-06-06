import * as THREE from 'three/webgpu'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import Stats from 'stats-gl'
import { Boids } from './Boids.js'

// ─── Params ───────────────────────────────────────────────────────────────────
const params = {
  startColor: '#1565c0',
  endColor: '#0c2255',
  separation: 15.0,
  alignment: 20.0,
  cohesion: 20.0,
  colliderAttraction: 3.0,
  fishScale: 1.2,
  speedMultiplier: 7,
  tailSpeed: 7,
  fishColor: '#0d0a1a',
  fov: 45,
  ambientColor: '#404060',
  ambientIntensity: 2,
  dirColor: '#ffffff',
  dirIntensity: 3,
  fogNear: 200,
  fogFar: 1000,
  colliderRadius: 80,
  colliderLerpSpeed: 2,
  debug: false,
}

// ─── Scene Setup ──────────────────────────────────────────────────────────────
const scene = new THREE.Scene()
scene.background = new THREE.Color(params.startColor)
scene.fog = new THREE.Fog(params.startColor, params.fogNear, params.fogFar)

const camera = new THREE.PerspectiveCamera(params.fov, innerWidth / innerHeight, 1, 3000)
camera.position.set(0, 0, 350)

const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.toneMapping = THREE.AgXToneMapping
renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;'
renderer.setSize(innerWidth, innerHeight)
document.body.appendChild(renderer.domElement)
await renderer.init()

const stats = new Stats({ trackGPU: false, trackCPT: false, samplesLog: 10 })
stats.dom.style.display = 'none'
document.body.appendChild(stats.dom)
try { stats.init(renderer) } catch(e) { console.warn('Stats init skipped:', e.message) }

// ─── Spawn box & collider ─────────────────────────────────────────────────────
const spawnSize = 200
const spawnBox = new THREE.Mesh(new THREE.BoxGeometry(spawnSize, spawnSize, spawnSize))
spawnBox.visible = false
spawnBox.position.set(-120, 300, 0)

const spawnBoxHelper = new THREE.Box3Helper(new THREE.Box3().setFromObject(spawnBox), 0x44ff44)
spawnBoxHelper.visible = params.debug
scene.add(spawnBoxHelper)

const colliderSphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshStandardNodeMaterial({ color: 0x556677, roughness: 0.4, metalness: 0.6 }),
)
colliderSphere.scale.setScalar(params.colliderRadius)
colliderSphere.position.set(150, 0, 50)
colliderSphere.visible = false
scene.add(colliderSphere)

// ─── Boids ────────────────────────────────────────────────────────────────────
const boids = new Boids(renderer, {
  count: 4096,
  spawnBox,
  colliderMesh: colliderSphere,
  separation: params.separation,
  alignment: params.alignment,
  cohesion: params.cohesion,
  colliderAttraction: params.colliderAttraction,
  fishScale: params.fishScale,
  speedMultiplier: params.speedMultiplier,
  tailSpeed: params.tailSpeed,
  fishColor: params.fishColor,
}).init()

scene.add(boids.mesh)

// ─── Lighting ─────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(params.ambientColor, params.ambientIntensity)
scene.add(ambientLight)
const dirLight = new THREE.DirectionalLight(params.dirColor, params.dirIntensity)
dirLight.position.set(100, 300, 100)
scene.add(dirLight)

// ─── Background color scroll ─────────────────────────────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function updateBg() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  const t = Math.min(window.scrollY / docHeight, 1)
  const start = hexToRgb(params.startColor)
  const end = hexToRgb(params.endColor)
  const r = Math.round(start[0] + (end[0] - start[0]) * t)
  const g = Math.round(start[1] + (end[1] - start[1]) * t)
  const b = Math.round(start[2] + (end[2] - start[2]) * t)
  const color = `rgb(${r},${g},${b})`
  document.body.style.backgroundColor = color
  scene.background.setStyle(color)
  scene.fog.color.setStyle(color)
}

window.addEventListener('scroll', updateBg, { passive: true })
updateBg()

// ─── Custom GUI ───────────────────────────────────────────────────────────────
const guiControllers = []

function buildGUI() {
  const body = document.getElementById('gui-body')
  const toggle = document.getElementById('gui-toggle')
  const panel = document.getElementById('gui-panel')
  const close = document.getElementById('gui-close')

  toggle.addEventListener('click', () => panel.classList.remove('gui-hidden'))
  close.addEventListener('click', () => panel.classList.add('gui-hidden'))

  function addFolder(name, controls, collapsed = true) {
    const folder = document.createElement('div')
    folder.className = 'gui-folder' + (collapsed ? ' collapsed' : '')
    const title = document.createElement('div')
    title.className = 'gui-folder-title'
    title.innerHTML = `<span>${name}</span><span class="gui-arrow">▼</span>`
    title.addEventListener('click', () => folder.classList.toggle('collapsed'))
    folder.appendChild(title)

    const items = document.createElement('div')
    items.className = 'gui-folder-items'

    controls.forEach((ctrl) => {
      const row = document.createElement('div')
      row.className = 'gui-row'
      const label = document.createElement('div')
      label.className = 'gui-label'
      label.textContent = ctrl.name
      row.appendChild(label)

      const controlDiv = document.createElement('div')
      controlDiv.className = 'gui-control'

      if (ctrl.type === 'range') {
        const input = document.createElement('input')
        input.type = 'range'
        input.className = 'gui-range'
        input.min = ctrl.min
        input.max = ctrl.max
        input.step = ctrl.step
        input.value = params[ctrl.key]

        const val = document.createElement('div')
        val.className = 'gui-value'
        val.textContent = Number(params[ctrl.key]).toFixed(ctrl.step < 1 ? 1 : 0)

        input.addEventListener('input', () => {
          const v = parseFloat(input.value)
          params[ctrl.key] = v
          val.textContent = v.toFixed(ctrl.step < 1 ? 1 : 0)
          if (ctrl.onChange) ctrl.onChange(v)
        })

        controlDiv.appendChild(input)
        controlDiv.appendChild(val)

        guiControllers.push({
          key: ctrl.key,
          update: () => {
            input.value = params[ctrl.key]
            val.textContent = Number(params[ctrl.key]).toFixed(ctrl.step < 1 ? 1 : 0)
          },
        })
      } else if (ctrl.type === 'color') {
        const wrapper = document.createElement('div')
        wrapper.className = 'gui-color-wrapper'
        const input = document.createElement('input')
        input.type = 'color'
        input.className = 'gui-color-input'
        input.value = params[ctrl.key]
        wrapper.style.background = params[ctrl.key]

        input.addEventListener('input', () => {
          params[ctrl.key] = input.value
          wrapper.style.background = input.value
          if (ctrl.onChange) ctrl.onChange(input.value)
        })

        wrapper.appendChild(input)
        controlDiv.appendChild(wrapper)

        guiControllers.push({
          key: ctrl.key,
          update: () => {
            input.value = params[ctrl.key]
            wrapper.style.background = params[ctrl.key]
          },
        })
      } else if (ctrl.type === 'checkbox') {
        const input = document.createElement('input')
        input.type = 'checkbox'
        input.className = 'gui-checkbox'
        input.checked = params[ctrl.key]

        input.addEventListener('change', () => {
          params[ctrl.key] = input.checked
          if (ctrl.onChange) ctrl.onChange(input.checked)
        })

        controlDiv.appendChild(input)

        guiControllers.push({
          key: ctrl.key,
          update: () => {
            input.checked = params[ctrl.key]
          },
        })
      }

      row.appendChild(controlDiv)
      items.appendChild(row)
    })

    folder.appendChild(items)
    body.appendChild(folder)
  }

  addFolder('Background', [
    { name: 'Start Color', key: 'startColor', type: 'color', onChange: updateBg },
    { name: 'End Color', key: 'endColor', type: 'color', onChange: updateBg },
    { name: 'Fog Near', key: 'fogNear', type: 'range', min: 0, max: 2000, step: 10, onChange: (v) => { scene.fog.near = v } },
    { name: 'Fog Far', key: 'fogFar', type: 'range', min: 0, max: 3000, step: 10, onChange: (v) => { scene.fog.far = v } },
  ])

  addFolder('Boids Simulation', [
    { name: 'Separation', key: 'separation', type: 'range', min: 0, max: 50, step: 0.1, onChange: (v) => { boids.separation = v } },
    { name: 'Alignment', key: 'alignment', type: 'range', min: 0, max: 50, step: 0.1, onChange: (v) => { boids.alignment = v } },
    { name: 'Cohesion', key: 'cohesion', type: 'range', min: 0, max: 50, step: 0.1, onChange: (v) => { boids.cohesion = v } },
    { name: 'Collider Attraction', key: 'colliderAttraction', type: 'range', min: 0, max: 50, step: 0.1, onChange: (v) => { boids.colliderAttraction = v } },
    { name: 'Collider Radius', key: 'colliderRadius', type: 'range', min: 10, max: 200, step: 1, onChange: (v) => { colliderSphere.scale.setScalar(v) } },
    { name: 'Speed', key: 'speedMultiplier', type: 'range', min: 1, max: 20, step: 0.5, onChange: (v) => { boids.speedMultiplier = v } },
    { name: 'Collider Lerp', key: 'colliderLerpSpeed', type: 'range', min: 0.1, max: 10, step: 0.1 },
  ])

  addFolder('Fish', [
    { name: 'Size', key: 'fishScale', type: 'range', min: 0.1, max: 5, step: 0.1, onChange: (v) => { boids.fishScale = v } },
    { name: 'Tail Speed', key: 'tailSpeed', type: 'range', min: 0, max: 30, step: 0.5, onChange: (v) => { boids.tailSpeed = v } },
    { name: 'Color', key: 'fishColor', type: 'color', onChange: (v) => { boids.fishColor = v } },
  ])

  addFolder('Camera', [
    { name: 'FOV', key: 'fov', type: 'range', min: 20, max: 120, step: 1, onChange: (v) => { camera.fov = v; camera.updateProjectionMatrix() } },
  ])

  addFolder('Lighting', [
    { name: 'Ambient Color', key: 'ambientColor', type: 'color', onChange: (v) => { ambientLight.color.set(v) } },
    { name: 'Ambient Intensity', key: 'ambientIntensity', type: 'range', min: 0, max: 10, step: 0.1, onChange: (v) => { ambientLight.intensity = v } },
    { name: 'Dir Color', key: 'dirColor', type: 'color', onChange: (v) => { dirLight.color.set(v) } },
    { name: 'Dir Intensity', key: 'dirIntensity', type: 'range', min: 0, max: 10, step: 0.1, onChange: (v) => { dirLight.intensity = v } },
  ])

  addFolder('Debug', [
    { name: 'Debug Mode', key: 'debug', type: 'checkbox', onChange: setDebug },
  ])
}

function refreshGUIDisplays() {
  guiControllers.forEach((c) => c.update())
}

buildGUI()

// Invisible overlay to capture pointer events for dragging in debug mode
const debugOverlay = document.createElement('div')
debugOverlay.style.cssText = 'position:fixed;inset:0;z-index:1;display:none;'
document.body.appendChild(debugOverlay)

// ─── Transform controls for collider sphere ─────────────────────────────────
const transformControls = new TransformControls(camera, debugOverlay)
transformControls.attach(colliderSphere)
transformControls.enabled = false
transformControls.visible = false
const transformHelper = transformControls.getHelper()
transformControls.addEventListener('mouseUp', () => {
  const p = colliderSphere.position
  console.log(`colliderSphere position: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`)
})

function setDebug(v) {
  colliderSphere.visible = v
  spawnBoxHelper.visible = v
  stats.dom.style.display = v ? '' : 'none'
  debugOverlay.style.display = v ? '' : 'none'
  transformControls.enabled = v
  if (v) {
    scene.add(transformHelper)
  } else {
    scene.remove(transformHelper)
  }
  document.querySelectorAll('.splash, .sections, .finale').forEach((el) => {
    el.style.pointerEvents = v ? 'none' : ''
  })
}
setDebug(params.debug)



addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P') {
    params.debug = !params.debug
    setDebug(params.debug)
    refreshGUIDisplays()
  }
})

// ─── Mouse Interaction ────────────────────────────────────────────────────────
const pointer = new THREE.Vector2(0, 10)
const raycaster = new THREE.Raycaster()

addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1
  pointer.y = -(e.clientY / innerHeight) * 2 + 1
})

// ─── Scroll-driven param presets ─────────────────────────────────────────────
const defaultParams = {
  separation: params.separation,
  alignment: params.alignment,
  cohesion: params.cohesion,
  colliderAttraction: params.colliderAttraction,
  colliderRadius: params.colliderRadius,
  speedMultiplier: params.speedMultiplier,
  tailSpeed: params.tailSpeed,
}

const middleParams = {
  separation: 16.2,
  alignment: 4.5,
  cohesion: 14.4,
  colliderAttraction: 20.5,
  colliderRadius: 10,
  speedMultiplier: 7,
  tailSpeed: 7,
}

const finaleParams = {
  separation: 42,
  alignment: 5.7,
  cohesion: 8.8,
  colliderAttraction: 35.2,
  colliderRadius: 79,
  speedMultiplier: 4,
  tailSpeed: 3,
}

function applyParamPreset(preset) {
  for (const key of Object.keys(preset)) {
    if (params[key] === preset[key]) continue
    if (key === 'colliderRadius') {
      colliderRadiusTarget = preset[key]
    } else {
      params[key] = preset[key]
      boids[key] = preset[key]
    }
  }
  refreshGUIDisplays()
}

const colliderPositions = [
  new THREE.Vector3(150, 0, 50), // screen 1 (splash) - default
  new THREE.Vector3(180, 0, 0), // screen 2
  new THREE.Vector3(-180, 0, 0), // screen 3
  new THREE.Vector3(180, 0, 0), // screen 4
  new THREE.Vector3(-180, 0, 0), // screen 5
  new THREE.Vector3(0, 0, 0), // screen 6 (finale)
]

const colliderTarget = colliderSphere.position.clone()
let colliderRadiusTarget = params.colliderRadius

let currentPreset = 'default'
let currentScreenIndex = 0

function updateScrollPreset() {
  const screenIndex = Math.min(Math.floor((window.scrollY + window.innerHeight / 2) / window.innerHeight), 5)

  if (screenIndex !== currentScreenIndex) {
    currentScreenIndex = screenIndex
    colliderTarget.copy(colliderPositions[screenIndex])
  }

  let target
  if (screenIndex >= 5) {
    target = 'finale'
  } else if (screenIndex >= 1) {
    target = 'middle'
  } else {
    target = 'default'
  }
  if (target !== currentPreset) {
    currentPreset = target
    if (target === 'finale') applyParamPreset(finaleParams)
    else if (target === 'middle') applyParamPreset(middleParams)
    else applyParamPreset(defaultParams)
  }
}

// ─── Animation Loop ───────────────────────────────────────────────────────────
let last = performance.now()
renderer.setAnimationLoop(async () => {
  const now = performance.now()
  const delta = Math.min((now - last) / 1000, 1)
  last = now

  updateScrollPreset()

  const lerpAlpha = 1 - Math.exp(-params.colliderLerpSpeed * delta)
  colliderSphere.position.lerp(colliderTarget, lerpAlpha)

  const currentRadius = params.colliderRadius
  const newRadius = THREE.MathUtils.lerp(currentRadius, colliderRadiusTarget, lerpAlpha)
  if (Math.abs(newRadius - currentRadius) > 0.01) {
    params.colliderRadius = newRadius
    colliderSphere.scale.setScalar(newRadius)
  }

  raycaster.setFromCamera(pointer, camera)
  boids.rayOrigin.copy(raycaster.ray.origin)
  boids.rayDirection.copy(raycaster.ray.direction)

  boids.update(delta)

  renderer.render(scene, camera)

  stats.update()
  await renderer.resolveTimestampsAsync('render')
  await renderer.resolveTimestampsAsync('compute')
})

// ─── Resize ───────────────────────────────────────────────────────────────────
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
