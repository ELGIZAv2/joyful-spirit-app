import * as THREE from 'three/webgpu'
import {
  Fn,
  If,
  Loop,
  Continue,
  float,
  uint,
  vec3,
  uniform,
  instancedArray,
  instanceIndex,
  cos,
  normalize,
  length,
  dot,
  select,
  attribute,
  positionLocal,
} from 'three/tsl'

export class Boids {
  // Private uniforms
  #separationU
  #alignmentU
  #cohesionU
  #dtU
  #rayOriginU
  #rayDirectionU
  #obstacleCenterU
  #obstacleRadiusU
  #colliderAttractionU
  #fishScaleU
  #tailSpeedU
  #fishColorU
  #speedMultiplierU

  // Private
  #renderer
  #count
  #speedLimit
  #positionStorage
  #velocityStorage
  #phaseStorage
  #computeVelocity
  #computePosition
  #colliderMesh

  // Public
  mesh
  material

  constructor(renderer, settings = {}) {
    this.#renderer = renderer
    this.#count = settings.count ?? 4096
    this.#speedLimit = settings.speedLimit ?? 9.0
    this.#colliderMesh = settings.colliderMesh ?? null

    // Determine spawn bounds from box mesh or fallback
    let spawnMin = new THREE.Vector3(-400, -400, -400)
    let spawnMax = new THREE.Vector3(400, 400, 400)

    if (settings.spawnBox) {
      const box = new THREE.Box3().setFromObject(settings.spawnBox)
      spawnMin = box.min
      spawnMax = box.max
    }

    const spawnSize = new THREE.Vector3().subVectors(spawnMax, spawnMin)

    // Storage buffers
    const positionArray = new Float32Array(this.#count * 3)
    const velocityArray = new Float32Array(this.#count * 3)
    const phaseArray = new Float32Array(this.#count)

    for (let i = 0; i < this.#count; i++) {
      positionArray[i * 3 + 0] = Math.random() * spawnSize.x + spawnMin.x
      positionArray[i * 3 + 1] = Math.random() * spawnSize.y + spawnMin.y
      positionArray[i * 3 + 2] = Math.random() * spawnSize.z + spawnMin.z

      velocityArray[i * 3 + 0] = (Math.random() - 0.5) * 10
      velocityArray[i * 3 + 1] = (Math.random() - 0.5) * 10
      velocityArray[i * 3 + 2] = (Math.random() - 0.5) * 10

      phaseArray[i] = 1
    }

    this.#positionStorage = instancedArray(positionArray, 'vec3')
    this.#velocityStorage = instancedArray(velocityArray, 'vec3')
    this.#phaseStorage = instancedArray(phaseArray, 'float')

    // Uniforms
    this.#separationU = uniform(settings.separation ?? 15.0)
    this.#alignmentU = uniform(settings.alignment ?? 20.0)
    this.#cohesionU = uniform(settings.cohesion ?? 20.0)
    this.#dtU = uniform(0.0)
    this.#rayOriginU = uniform(new THREE.Vector3())
    this.#rayDirectionU = uniform(new THREE.Vector3())
    this.#obstacleCenterU = uniform(new THREE.Vector3())
    this.#obstacleRadiusU = uniform(settings.obstacleRadius ?? 60.0)
    this.#colliderAttractionU = uniform(settings.colliderAttraction ?? 3.0)
    this.#fishScaleU = uniform(settings.fishScale ?? 1.2)
    this.#tailSpeedU = uniform(settings.tailSpeed ?? 7)
    this.#fishColorU = uniform(new THREE.Color(settings.fishColor ?? '#1a0f0a'))
    this.#speedMultiplierU = uniform(settings.speedMultiplier ?? 9.0)
  }

  // ─── Getters/Setters ────────────────────────────────────────────────────────

  get separation() {
    return this.#separationU.value
  }
  set separation(v) {
    this.#separationU.value = v
  }

  get alignment() {
    return this.#alignmentU.value
  }
  set alignment(v) {
    this.#alignmentU.value = v
  }

  get cohesion() {
    return this.#cohesionU.value
  }
  set cohesion(v) {
    this.#cohesionU.value = v
  }

  get colliderAttraction() {
    return this.#colliderAttractionU.value
  }
  set colliderAttraction(v) {
    this.#colliderAttractionU.value = v
  }

  get obstacleRadius() {
    return this.#obstacleRadiusU.value
  }
  set obstacleRadius(v) {
    this.#obstacleRadiusU.value = v
  }

  get fishScale() {
    return this.#fishScaleU.value
  }
  set fishScale(v) {
    this.#fishScaleU.value = v
  }

  get tailSpeed() {
    return this.#tailSpeedU.value
  }
  set tailSpeed(v) {
    this.#tailSpeedU.value = v
  }

  get fishColor() {
    return '#' + this.#fishColorU.value.getHexString()
  }
  set fishColor(v) {
    this.#fishColorU.value.set(v)
  }

  get speedMultiplier() {
    return this.#speedMultiplierU.value
  }
  set speedMultiplier(v) {
    this.#speedMultiplierU.value = v
  }

  get count() {
    return this.#count
  }

  get colliderMesh() {
    return this.#colliderMesh
  }
  set colliderMesh(v) {
    this.#colliderMesh = v
  }

  get rayOrigin() {
    return this.#rayOriginU.value
  }
  get rayDirection() {
    return this.#rayDirectionU.value
  }

  // ─── Initialization ─────────────────────────────────────────────────────────

  init() {
    this.#createComputeVelocity()
    this.#createComputePosition()
    this.#createMaterial()
    this.#createMesh()
    return this
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  update(delta) {
    if (delta > 1) delta = 1
    this.#dtU.value = delta

    // Sync collider mesh position/scale into uniforms
    if (this.#colliderMesh) {
      this.#colliderMesh.updateWorldMatrix(true, false)
      this.#obstacleCenterU.value.setFromMatrixPosition(this.#colliderMesh.matrixWorld)
      this.#obstacleRadiusU.value = this.#colliderMesh.matrixWorld.getMaxScaleOnAxis()
    }

    this.#renderer.compute(this.#computeVelocity)
    this.#renderer.compute(this.#computePosition)
  }

  // ─── Fish Geometry (Castagnola) ──────────────────────────────────────────────

  #createFishGeometry() {
    const geo = new THREE.BufferGeometry()

    // Castagnola: round laterally-compressed body + V-shaped forked tail
    // Fish swims along +Z, coordinates scaled by 0.2 at the end
    //
    // Body built from multiple elliptical cross-section rings for a
    // smooth rounded profile in both side and front views.

    const SEGMENTS = 8
    const CENTER_Y = 1

    // Cross-sections from front to back: [z, radiusX, radiusY]
    const sections = [
      [20, 0, 0], // nose (point)
      [14, 1.8, 5], // front
      [7, 2.8, 7.5], // front-mid
      [3, 3, 8], // widest
      [-2, 2.5, 6.5], // back-mid
      [-6, 1.2, 3.5], // back
      [-8, 0, 0], // tail base (point)
    ]

    // Build rings for each section
    const rings = sections.map(([z, rx, ry]) => {
      if (rx === 0 && ry === 0) return null // point, not a ring
      const ring = []
      for (let i = 0; i < SEGMENTS; i++) {
        const angle = (i / SEGMENTS) * Math.PI * 2
        ring.push([Math.sin(angle) * rx, Math.cos(angle) * ry + CENTER_Y, z])
      }
      return ring
    })

    const verts = []

    for (let s = 0; s < sections.length - 1; s++) {
      const ringA = rings[s]
      const ringB = rings[s + 1]

      if (!ringA && ringB) {
        // Point to ring (fan)
        const point = [0, CENTER_Y, sections[s][0]]
        for (let i = 0; i < SEGMENTS; i++) {
          const next = (i + 1) % SEGMENTS
          verts.push(...point, ...ringB[i], ...ringB[next])
        }
      } else if (ringA && !ringB) {
        // Ring to point (fan)
        const point = [0, CENTER_Y, sections[s + 1][0]]
        for (let i = 0; i < SEGMENTS; i++) {
          const next = (i + 1) % SEGMENTS
          verts.push(...ringA[i], ...point, ...ringA[next])
        }
      } else if (ringA && ringB) {
        // Ring to ring (quad strip → 2 tris per segment)
        for (let i = 0; i < SEGMENTS; i++) {
          const next = (i + 1) % SEGMENTS
          verts.push(...ringA[i], ...ringB[i], ...ringB[next])
          verts.push(...ringA[i], ...ringB[next], ...ringA[next])
        }
      }
    }

    const bodyVertCount = verts.length / 3

    // Tail V-fork (6 triangles for wide body connection)
    const tailBaseTop = [0, CENTER_Y + 2.5, -7]
    const tailBaseBot = [0, CENTER_Y - 2.5, -7]
    const tailTop = [0, 8, -28]
    const tailBot = [0, -5, -28]
    const tailNotch = [0, CENTER_Y, -13]
    const tailMidTop = [0, CENTER_Y + 2, -10]
    const tailMidBot = [0, CENTER_Y - 2, -10]
    // Upper fork
    verts.push(...tailMidTop, ...tailTop, ...tailNotch)
    // Lower fork
    verts.push(...tailMidBot, ...tailNotch, ...tailBot)
    // Connection upper: base top → midTop → notch
    verts.push(...tailBaseTop, ...tailMidTop, ...tailNotch)
    // Connection lower: base bot → notch → midBot
    verts.push(...tailBaseBot, ...tailNotch, ...tailMidBot)
    // Fill gap: base top → notch → base bot
    verts.push(...tailBaseTop, ...tailNotch, ...tailBaseBot)
    // Fill gap: base top → base bot → midBot (optional extra coverage)
    verts.push(...tailBaseTop, ...tailBaseBot, ...tailMidBot)

    const vertices = new Float32Array(verts)
    for (let i = 0; i < vertices.length; i++) {
      vertices[i] *= 0.2
    }

    // Tail wag flag: 0 for body, 1 for fork tips, 0.3 for base, 0.5 for mid, 0.7 for notch
    const tailVertCount = 18
    const tailFlag = new Float32Array(bodyVertCount + tailVertCount)
    const t = bodyVertCount
    // Upper fork: midTop=0.5, top=1, notch=0.7
    tailFlag[t + 0] = 0.5
    tailFlag[t + 1] = 1
    tailFlag[t + 2] = 0.7
    // Lower fork: midBot=0.5, notch=0.7, bot=1
    tailFlag[t + 3] = 0.5
    tailFlag[t + 4] = 0.7
    tailFlag[t + 5] = 1
    // Connection upper: baseTop=0.15, midTop=0.5, notch=0.7
    tailFlag[t + 6] = 0.15
    tailFlag[t + 7] = 0.5
    tailFlag[t + 8] = 0.7
    // Connection lower: baseBot=0.15, notch=0.7, midBot=0.5
    tailFlag[t + 9] = 0.15
    tailFlag[t + 10] = 0.7
    tailFlag[t + 11] = 0.5
    // Fill: baseTop=0.15, notch=0.7, baseBot=0.15
    tailFlag[t + 12] = 0.15
    tailFlag[t + 13] = 0.7
    tailFlag[t + 14] = 0.15
    // Fill: baseTop=0.15, baseBot=0.15, midBot=0.5
    tailFlag[t + 15] = 0.15
    tailFlag[t + 16] = 0.15
    tailFlag[t + 17] = 0.5

    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geo.setAttribute('tailFlag', new THREE.BufferAttribute(tailFlag, 1))

    return geo
  }

  // ─── Material ───────────────────────────────────────────────────────────────

  #createMaterial() {
    this.material = new THREE.MeshStandardNodeMaterial({
      side: THREE.DoubleSide,
    })

    const positionStorage = this.#positionStorage
    const velocityStorage = this.#velocityStorage
    const phaseStorage = this.#phaseStorage
    const fishScaleU = this.#fishScaleU
    const fishColorU = this.#fishColorU

    // Vertex shader: position + orient fish along velocity + wag tail
    this.material.positionNode = Fn(() => {
      const fishPos = positionStorage.element(instanceIndex)
      const fishVel = velocityStorage.element(instanceIndex)
      const phase = phaseStorage.element(instanceIndex)

      const pos = positionLocal.toVar()

      // Tail wag (side to side, rotate around Y axis)
      const tail = attribute('tailFlag', 'float')
      const wagAngle = phase.sin().mul(tail).mul(0.5)
      const cosA = cos(wagAngle)
      const sinA = wagAngle.sin()
      const newX = pos.x.mul(cosA).sub(pos.z.mul(sinA))
      const newZ = pos.x.mul(sinA).add(pos.z.mul(cosA))
      pos.x.assign(newX)
      pos.z.assign(newZ)

      // Scale fish
      pos.mulAssign(fishScaleU)

      // Orient fish along velocity direction
      const dir = normalize(fishVel)
      const right = normalize(dir.cross(vec3(0, 1, 0)))
      const up = normalize(right.cross(dir))

      // Transform: local to world (Z = forward = dir)
      const worldPos = vec3(right.mul(pos.x).add(up.mul(pos.y)).add(dir.mul(pos.z)))

      return worldPos.add(fishPos)
    })()

    this.material.colorNode = fishColorU
  }

  // ─── Mesh ───────────────────────────────────────────────────────────────────

  #createMesh() {
    const fishGeo = this.#createFishGeometry()
    this.mesh = new THREE.InstancedMesh(fishGeo, this.material, this.#count)
  }

  // ─── Compute Velocity ───────────────────────────────────────────────────────

  #createComputeVelocity() {
    const count = this.#count
    const speedLimit = this.#speedLimit
    const positionStorage = this.#positionStorage
    const velocityStorage = this.#velocityStorage
    const separationU = this.#separationU
    const alignmentU = this.#alignmentU
    const cohesionU = this.#cohesionU
    const dtU = this.#dtU
    const rayOriginU = this.#rayOriginU
    const rayDirectionU = this.#rayDirectionU
    const obstacleCenterU = this.#obstacleCenterU
    const obstacleRadiusU = this.#obstacleRadiusU
    const colliderAttractionU = this.#colliderAttractionU

    this.#computeVelocity = Fn(() => {
      const PI_2 = float(Math.PI * 2)
      const limit = float(speedLimit).toVar('limit')

      const zoneRadius = separationU.add(alignmentU).add(cohesionU).toConst()
      const separationThresh = separationU.div(zoneRadius).toConst()
      const alignmentThresh = separationU.add(alignmentU).div(zoneRadius).toConst()
      const zoneRadiusSq = zoneRadius.mul(zoneRadius).toConst()

      const birdIndex = instanceIndex.toConst('birdIndex')
      const position = positionStorage.element(birdIndex).toVar()
      const velocity = velocityStorage.element(birdIndex).toVar()

      // Mouse / ray influence
      const directionToRay = rayOriginU.sub(position).toConst()
      const projectionLength = dot(directionToRay, rayDirectionU).toConst()
      const closestPoint = rayOriginU.sub(rayDirectionU.mul(projectionLength)).toConst()
      const dirToClosest = closestPoint.sub(position).toConst()
      const distToClosestSq = dot(dirToClosest, dirToClosest).toConst()

      const rayRadius = float(150.0).toConst()
      const rayRadiusSq = rayRadius.mul(rayRadius).toConst()

      If(distToClosestSq.lessThan(rayRadiusSq), () => {
        const velocityAdjust = distToClosestSq.div(rayRadiusSq).sub(1.0).mul(dtU).mul(100.0)
        velocity.addAssign(normalize(dirToClosest).mul(velocityAdjust))
        limit.addAssign(5.0)
      })

      // Attract to center
      const dirToCenter = position.toVar()
      dirToCenter.y.mulAssign(2.5)
      velocity.subAssign(normalize(dirToCenter).mul(dtU).mul(5.0))

      // Attraction to obstacle
      const toObstacle = position.sub(obstacleCenterU)
      const distToObstacle = length(toObstacle)
      velocity.subAssign(normalize(toObstacle).mul(dtU).mul(colliderAttractionU))

      // Obstacle avoidance
      const avoidRadius = obstacleRadiusU.mul(1.8) // start avoiding before hitting
      If(distToObstacle.lessThan(avoidRadius), () => {
        const pushStrength = avoidRadius.div(distToObstacle.max(0.001)).sub(1.0).mul(dtU).mul(80.0)
        velocity.addAssign(normalize(toObstacle).mul(pushStrength))
      })

      // Boid rules: separation, alignment, cohesion
      Loop({ start: uint(0), end: uint(count), type: 'uint', condition: '<' }, ({ i }) => {
        If(i.equal(birdIndex), () => {
          Continue()
        })

        const birdPosition = positionStorage.element(i)
        const dirToBird = birdPosition.sub(position)
        const distToBird = length(dirToBird)

        If(distToBird.lessThan(0.0001), () => {
          Continue()
        })

        const distToBirdSq = distToBird.mul(distToBird)

        If(distToBirdSq.greaterThan(zoneRadiusSq), () => {
          Continue()
        })

        const percent = distToBirdSq.div(zoneRadiusSq)

        If(percent.lessThan(separationThresh), () => {
          // Separation: steer away from close neighbors
          const velocityAdjust = separationThresh.div(percent).sub(1.0).mul(dtU)
          velocity.subAssign(normalize(dirToBird).mul(velocityAdjust))
        })
          .ElseIf(percent.lessThan(alignmentThresh), () => {
            // Alignment: match velocity of nearby birds
            const threshDelta = alignmentThresh.sub(separationThresh)
            const adjustedPercent = percent.sub(separationThresh).div(threshDelta)
            const birdVelocity = velocityStorage.element(i)
            const cosRange = cos(adjustedPercent.mul(PI_2))
            const cosRangeAdjust = float(0.5).sub(cosRange.mul(0.5)).add(0.5)
            const velocityAdjust = cosRangeAdjust.mul(dtU)
            velocity.addAssign(normalize(birdVelocity).mul(velocityAdjust))
          })
          .Else(() => {
            // Cohesion: steer toward center of nearby flock
            const threshDelta = alignmentThresh.oneMinus()
            const adjustedPercent = select(
              threshDelta.equal(0.0),
              1.0,
              percent.sub(alignmentThresh).div(threshDelta),
            )
            const cosRange = cos(adjustedPercent.mul(PI_2))
            const velocityAdjust = float(0.5).sub(cosRange.mul(-0.5).add(0.5)).mul(dtU)
            velocity.addAssign(normalize(dirToBird).mul(velocityAdjust))
          })
      })

      // Speed limit
      If(length(velocity).greaterThan(limit), () => {
        velocity.assign(normalize(velocity).mul(limit))
      })

      velocityStorage.element(birdIndex).assign(velocity)
    })().compute(count)
  }

  // ─── Compute Position ───────────────────────────────────────────────────────

  #createComputePosition() {
    const count = this.#count
    const positionStorage = this.#positionStorage
    const velocityStorage = this.#velocityStorage
    const phaseStorage = this.#phaseStorage
    const dtU = this.#dtU
    const speedMultiplierU = this.#speedMultiplierU
    const tailSpeedU = this.#tailSpeedU

    this.#computePosition = Fn(() => {
      positionStorage
        .element(instanceIndex)
        .addAssign(velocityStorage.element(instanceIndex).mul(dtU).mul(speedMultiplierU))

      // Tail wag phase (based on speed)
      const velocity = velocityStorage.element(instanceIndex)
      const phase = phaseStorage.element(instanceIndex)

      const modValue = phase
        .add(dtU.mul(tailSpeedU))
        .add(length(velocity).mul(dtU).mul(tailSpeedU).mul(0.5))

      phaseStorage.element(instanceIndex).assign(modValue.mod(62.83))
    })().compute(count)
  }
}
