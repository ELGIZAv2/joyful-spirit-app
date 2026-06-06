// Analytical sphere ambient occlusion (Quilez)
// https://iquilezles.org/articles/sphereao/
import { Fn, Loop, float, select, smoothstep, positionWorld, normalWorld, uniformArray, uniform } from 'three/tsl'
import * as THREE from 'three/webgpu'

export class SphereAO {
  constructor(positions, radius, { intensity = 1, radius: aoRadius = 1.5 } = {}) {
    this.dataArray = positions.map(([x, y, z]) => new THREE.Vector4(x, y, z, radius))
    this.intensity = uniform(intensity)
    this.radius = uniform(aoRadius)

    const dataUniform = uniformArray(this.dataArray, 'vec4')
    const intensityUniform = this.intensity
    const radiusUniform = this.radius

    this.node = Fn(() => {
      const ao = float(1.0).toVar()
      const pos = positionWorld
      const nor = normalWorld

      Loop(this.dataArray.length, ({ i }) => {
        const sph = dataUniform.element(i)
        const di = sph.xyz.sub(pos)
        const l = di.length()
        const nl = nor.dot(di.div(l))
        const h = l.div(sph.w)
        const h2 = h.mul(h)
        const k2 = float(1.0).sub(h2.mul(nl).mul(nl))

        // Above/below horizon: exact (Quilez)
        const simple = nl.max(0.0).div(h2)
        // Horizon-clipping approximation (Quilez)
        const approx = nl.mul(h).add(1.0).div(h2)
        const approxSq = approx.mul(approx).mul(0.33)

        const rawOcc = select(k2.greaterThan(0.001), approxSq, simple)

        // Distance-based falloff so only nearby spheres contribute
        const falloff = float(1.0).sub(smoothstep(float(0.0), radiusUniform, l))
        const occ = rawOcc.mul(falloff).mul(intensityUniform)

        ao.mulAssign(float(1.0).sub(occ.clamp(0.0, 1.0)))
      })

      return ao
    })()
  }

  update(index, x, y, z, radius) {
    this.dataArray[index].set(x, y, z, radius)
  }
}
