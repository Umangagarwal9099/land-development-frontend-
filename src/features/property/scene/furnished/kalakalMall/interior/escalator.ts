import { BoxGeometry, BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Object3D, Quaternion, TubeGeometry, Vector3, type Material } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { InteriorMaterials } from './materials'
import type { Lux } from './luxury'
import { ESC, LEVELS, VZ0, VZ1, type EscalatorSpec } from './units'

/*
 * A commercial escalator as built: 1000 mm steps at 30°, two flat steps at each end and a 1 m
 * transition into the incline, stainless skirts and decking, frameless glass balustrades under a
 * black rubber handrail that loops round a newel at each end, the truss clad in white metal
 * beneath, and chequered landing plates with yellow combs at the top and bottom.
 *
 * It runs: the steps travel the visible track continuously (one instanced mesh, two draw calls
 * for every step on it), each riser opening and closing as it goes through the transitions; the
 * handrails travel with them; and a walker standing on the steps is carried up or down.
 *
 * Plan frame: `u` runs along the escalator from its bottom comb (0) to its top comb (`length`),
 * `a` across it from its centre line.
 */

/** Step travel speed, m/s (the usual 0.5 m/s). */
export const SPEED = 0.5
const PITCH = 0.4
const STEP_W = 1.0
const TREAD = 0.385
const RISER = 0.205

export class Escalator {
  readonly spec: EscalatorSpec
  readonly group = new Group()
  readonly length: number
  readonly rise: number
  /** z of the bottom comb, and the sense along z the escalator rises in. */
  readonly z0: number
  readonly y0: number
  private readonly k = ESC.slope
  private readonly straight: number
  private steps: InstancedMesh
  private marks: InstancedMesh
  private table: { s: number; u: number }[] = []
  private pathLength = 0
  private count = 0
  private phase = 0
  private readonly m4 = new Matrix4()
  private readonly q = new Quaternion()
  private readonly v = new Vector3()
  private readonly one = new Vector3(1, 1, 1)

  constructor(m: InteriorMaterials, spec: EscalatorSpec, railMaterial: Material, lux: Lux) {
    this.spec = spec
    this.rise = LEVELS[spec.to] - LEVELS[spec.from]
    const { flat: F, ease: T } = ESC
    this.straight = this.rise / this.k - T
    this.length = 2 * F + 2 * T + this.straight
    this.y0 = LEVELS[spec.from]
    // The straight run ends at the upper floor's edge of the void.
    const topEdge = spec.rises > 0 ? VZ1 : VZ0
    this.z0 = topEdge - spec.rises * (this.length - F - T)
    this.group.name = `escalator_${spec.id}`

    this.buildTable()
    this.buildBody(m, railMaterial, lux)
    // The steps: tread and riser in one instanced mesh, the yellow demarcation in another.
    const stepGeo = mergeGeometries([
      boxAt(STEP_W, 0.03, TREAD, 0, -0.015, TREAD / 2),
      boxAt(STEP_W, RISER, 0.02, 0, -RISER / 2, 0.01),
    ])!
    const markGeo = mergeGeometries([
      boxAt(STEP_W, 0.004, 0.045, 0, 0.002, TREAD - 0.0225),
      boxAt(0.04, 0.004, TREAD - 0.05, -STEP_W / 2 + 0.02, 0.002, TREAD / 2 - 0.02),
      boxAt(0.04, 0.004, TREAD - 0.05, STEP_W / 2 - 0.02, 0.002, TREAD / 2 - 0.02),
    ])!
    this.steps = new InstancedMesh(stepGeo, m.step, this.count)
    this.marks = new InstancedMesh(markGeo, m.combYellow, this.count)
    for (const im of [this.steps, this.marks]) {
      im.name = `live_esc_${im === this.steps ? 'steps' : 'marks'}_${spec.id}`
      im.castShadow = false
      im.receiveShadow = true
      im.frustumCulled = false
      this.group.add(im)
    }
    this.place()
  }

  /* ---------- the track ---------- */

  /** Height of the step line above the bottom floor at u. */
  y(u: number) {
    const { flat: F, ease: T } = ESC
    const k = this.k
    const L = this.length
    if (u <= F) return 0
    if (u < F + T) return (k * (u - F) ** 2) / (2 * T)
    if (u <= L - F - T) return (k * T) / 2 + k * (u - F - T)
    if (u < L - F) return this.rise - (k * (L - F - u) ** 2) / (2 * T)
    return this.rise
  }

  /** Slope of the step line at u. */
  private dy(u: number) {
    const { flat: F, ease: T } = ESC
    const L = this.length
    if (u <= F || u >= L - F) return 0
    if (u < F + T) return (this.k * (u - F)) / T
    if (u > L - F - T) return (this.k * (L - F - u)) / T
    return this.k
  }

  /** Plan z of a point u along the escalator. */
  zAt(u: number) {
    return this.z0 + this.spec.rises * u
  }

  /** The steps' track by arc length, from just under the bottom landing plate to just under the top one. */
  private buildTable() {
    const ext = 0.42
    const n = 900
    let s = 0
    let pu = -ext
    let py = this.trackY(pu)
    this.table.push({ s: 0, u: pu })
    for (let i = 1; i <= n; i++) {
      const u = -ext + ((this.length + 2 * ext) * i) / n
      const y = this.trackY(u)
      s += Math.hypot(u - pu, y - py)
      this.table.push({ s, u })
      pu = u
      py = y
    }
    this.pathLength = s
    // A whole number of steps round the track, so the loop closes without a seam.
    this.count = Math.round(s / PITCH)
  }

  /** The track dips under the landing plates beyond each comb, where the steps go round. */
  private trackY(u: number) {
    if (u < 0) return -0.035 * Math.min(1, -u / 0.15)
    if (u > this.length) return this.rise - 0.035 * Math.min(1, (u - this.length) / 0.15)
    return this.y(u)
  }

  private uAt(s: number) {
    const t = this.table
    let lo = 0
    let hi = t.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (t[mid].s < s) lo = mid
      else hi = mid
    }
    const a = t[lo]
    const b = t[hi]
    return a.u + ((b.u - a.u) * (s - a.s)) / Math.max(1e-9, b.s - a.s)
  }

  /** Places every step for the current phase. */
  private place() {
    const pitch = this.pathLength / this.count
    this.q.setFromAxisAngle(new Vector3(0, 1, 0), this.spec.rises > 0 ? 0 : Math.PI)
    for (let i = 0; i < this.count; i++) {
      const s = (((this.phase + i * pitch) % this.pathLength) + this.pathLength) % this.pathLength
      const u = this.uAt(s)
      this.v.set(this.spec.x, this.y0 + this.trackY(u) + 0.004, this.zAt(u))
      this.m4.compose(this.v, this.q, this.one)
      this.steps.setMatrixAt(i, this.m4)
      this.marks.setMatrixAt(i, this.m4)
    }
    this.steps.instanceMatrix.needsUpdate = true
    this.marks.instanceMatrix.needsUpdate = true
  }

  /** Runs the steps on by dt. */
  tick(dt: number) {
    const pitch = this.pathLength / this.count
    this.phase = (this.phase + (this.spec.up ? 1 : -1) * SPEED * dt + pitch * 1000) % pitch
    this.place()
  }

  /**
   * Carries a walker standing on the steps (their feet at `p`) for dt: along the track, up or down
   * with it. Returns whether they are aboard.
   */
  carry(p: Vector3, dt: number) {
    const a = p.x - this.spec.x
    if (Math.abs(a) > STEP_W / 2 + 0.05) return false
    const u = (p.z - this.z0) * this.spec.rises
    if (u < 0.05 || u > this.length - 0.05) return false
    if (Math.abs(p.y - (this.y0 + this.y(u))) > 0.45) return false
    const du = ((this.spec.up ? 1 : -1) * SPEED * dt) / Math.sqrt(1 + this.dy(u) ** 2)
    const next = Math.max(-0.3, Math.min(this.length + 0.3, u + du))
    p.z = this.zAt(next)
    p.y = this.y0 + this.trackY(next)
    return true
  }

  /* ---------- the body ---------- */

  private buildBody(m: InteriorMaterials, rail: Material, lux: Lux) {
    const g = this.group
    const L = this.length
    const y = (u: number) => this.y0 + this.y(u)
    // Below the truss: never lower than inside the bottom floor's slab.
    const under = (u: number) => Math.max(this.y0 - 0.28, y(u) - 0.95)
    const ribbon = (mat: Material, u0: number, u1: number, a0: number, a1: number, lo: (u: number) => number, hi: (u: number) => number, name = '', cast = true) => {
      const mesh = new Mesh(this.strip(u0, u1, a0, a1, lo, hi), mat)
      mesh.name = name
      mesh.castShadow = cast
      mesh.receiveShadow = true
      g.add(mesh)
      return mesh
    }
    for (const side of [-1, 1]) {
      const sa = (v: number) => side * v
      // Skirt beside the steps, inner decking, glass, outer decking, cladding.
      ribbon(m.stainless, -0.25, L + 0.25, sa(0.515), sa(0.515), (u) => y(u) - 0.06, (u) => y(u) + 0.27, '', false)
      ribbon(m.stainless, -0.9, L + 0.9, sa(0.515), sa(0.6), (u) => y(u) + 0.27, (u) => y(u) + 0.31)
      ribbon(m.railGlass, -0.75, L + 0.75, sa(0.6), sa(0.6), (u) => y(u) + 0.31, (u) => y(u) + 0.93, '', false)
      ribbon(m.stainless, -0.9, L + 0.9, sa(0.6), sa(0.82), (u) => y(u) + 0.31, (u) => y(u) + 0.31)
      ribbon(lux.steel, -0.9, L + 0.9, sa(0.82), sa(0.82), under, (u) => y(u) + 0.31)
      // Brass trims along the decking's edge and the cladding's foot, the skirt's brush deflector.
      ribbon(lux.brass, -0.9, L + 0.9, sa(0.82), sa(0.826), (u) => y(u) + 0.27, (u) => y(u) + 0.315, '', false)
      ribbon(lux.brass, -0.9, L + 0.9, sa(0.826), sa(0.826), (u) => under(u), (u) => under(u) + 0.03, '', false)
      ribbon(lux.rubber, -0.25, L + 0.25, sa(0.5), sa(0.512), (u) => y(u) + 0.08, (u) => y(u) + 0.08, '', false)
      // A line of light under the handrail, along the inside of the glass.
      ribbon(lux.led, -0.4, L + 0.4, sa(0.588), sa(0.596), (u) => y(u) + 0.9, (u) => y(u) + 0.9, '', false)
      // The handrail: along the glass top, round a newel at each end.
      this.handrail(sa(0.6), rail)
    }
    // The truss's underside, and its ends where they stand clear of a floor.
    ribbon(lux.steel, -0.9, L + 0.9, -0.82, 0.82, under, under)
    // (Only below the floor: at the landings the way on and off stays open between the newels.)
    for (const [u, sgn] of [[-0.9, -1], [L + 0.9, 1]] as const) {
      const yy = y(u)
      if (yy - under(u) < 0.05) continue
      const box = new Mesh(new BoxGeometry(1.64, yy - 0.01 - under(u), 0.02), lux.steel)
      box.position.set(this.spec.x, (yy - 0.01 + under(u)) / 2, this.zAt(u) + sgn * this.spec.rises * 0.01)
      g.add(box)
    }
    // Landing plates beyond each comb, with the yellow comb itself.
    for (const [u0, u1, yy] of [[-1.25, 0, this.y0], [L, L + 1.25, this.y0 + this.rise]] as const) {
      const plate = new Mesh(new BoxGeometry(1.03, 0.012, u1 - u0), m.combPlate)
      plate.position.set(this.spec.x, yy + 0.006, this.zAt((u0 + u1) / 2))
      plate.receiveShadow = true
      g.add(plate)
      const comb = new Mesh(new BoxGeometry(1.0, 0.016, 0.06), m.combYellow)
      comb.position.set(this.spec.x, yy + 0.008, this.zAt(u0 === -1.25 ? -0.03 : L + 0.03))
      g.add(comb)
      // Comb lights in the skirts either side, marking the step band.
      for (const s of [-0.49, 0.49]) {
        const light = new Mesh(new BoxGeometry(0.02, 0.03, 0.4), lux.ledCool)
        light.position.set(this.spec.x + s, yy + 0.05, this.zAt(u0 === -1.25 ? 0.25 : L - 0.25))
        g.add(light)
      }
    }
    // What the walker stands on: the step line as one smooth surface, unseen.
    const walk = ribbon(new MeshStandardMaterial(), -0.3, L + 0.3, -0.5, 0.5, (u) => this.y0 + this.trackY(u) + 0.004, (u) => this.y0 + this.trackY(u) + 0.004, `esc_walk_${this.spec.id}`)
    walk.visible = false
  }

  /**
   * A strip following the track from u0 to u1: between a0 and a1 across, from lo(u) to hi(u) up.
   * Vertical when a0 = a1 (a skirt or a glass panel), level across when lo = hi.
   */
  private strip(u0: number, u1: number, a0: number, a1: number, lo: (u: number) => number, hi: (u: number) => number) {
    const pos: number[] = []
    const uv: number[] = []
    const n = Math.max(8, Math.ceil((u1 - u0) / 0.2))
    const vertical = a0 === a1
    const pts = (u: number): [Vector3, Vector3] => {
      const z = this.zAt(u)
      return vertical
        ? [new Vector3(this.spec.x + a0, lo(u), z), new Vector3(this.spec.x + a0, hi(u), z)]
        : [new Vector3(this.spec.x + a0, lo(u), z), new Vector3(this.spec.x + a1, hi(u), z)]
    }
    for (let i = 0; i < n; i++) {
      const ua = u0 + ((u1 - u0) * i) / n
      const ub = u0 + ((u1 - u0) * (i + 1)) / n
      const [a, b] = pts(ua)
      const [c, d] = pts(ub)
      pos.push(a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z, a.x, a.y, a.z, d.x, d.y, d.z, b.x, b.y, b.z)
      const h0 = a.distanceTo(b)
      const h1 = c.distanceTo(d)
      uv.push(ua, 0, ub, 0, ub, h1, ua, 0, ub, h1, ua, h0)
    }
    const g = new BufferGeometry()
    // Both faces are seen (the glass, the skirts from the steps and from outside): double the triangles.
    const back = pos.slice()
    for (let i = 0; i < back.length; i += 9)
      for (let c = 0; c < 3; c++) {
        const t = back[i + 3 + c]
        back[i + 3 + c] = back[i + 6 + c]
        back[i + 6 + c] = t
      }
    const backUv = uv.slice()
    for (let i = 0; i < backUv.length; i += 6)
      for (let c = 0; c < 2; c++) {
        const t = backUv[i + 2 + c]
        backUv[i + 2 + c] = backUv[i + 4 + c]
        backUv[i + 4 + c] = t
      }
    g.setAttribute('position', new Float32BufferAttribute([...pos, ...back], 3))
    g.setAttribute('uv', new Float32BufferAttribute([...uv, ...backUv], 2))
    g.computeVertexNormals()
    return g
  }

  /** The handrail at `a` across: up the glass, over the top, round the newels. */
  private handrail(a: number, mat: Material) {
    const L = this.length
    const top = (u: number) => this.y0 + this.y(Math.max(0, Math.min(L, u))) + 0.975
    // The loop at each end comes down to the decking, where the rail returns inside the newel.
    const R = (0.975 - 0.31) / 2
    const pts: Vector3[] = []
    const at = (u: number, yy: number) => new Vector3(this.spec.x + a, yy, this.zAt(u))
    // Bottom newel: from the decking, out round the end (towards −u), and onto the top run.
    const ub = -0.55
    for (let i = 0; i <= 12; i++) {
      const t = 1.5 * Math.PI - (i / 12) * Math.PI
      pts.push(at(ub + R * Math.cos(t), top(ub) - R + R * Math.sin(t)))
    }
    for (let u = ub + 0.12; u < L + 0.55 - 0.06; u += 0.15) pts.push(at(u, top(u)))
    // Top newel: off the run, out round the end (towards +u), down to the decking.
    const ut = L + 0.55
    for (let i = 0; i <= 12; i++) {
      const t = Math.PI / 2 - (i / 12) * Math.PI
      pts.push(at(ut + R * Math.cos(t), top(ut) - R + R * Math.sin(t)))
    }
    const curve = new CatmullRomCurve3(pts, false, 'centripetal')
    const length = curve.getLength()
    const geo = new TubeGeometry(curve, Math.ceil(length / 0.08), 0.038, 8, false)
    // UVs in metres along the rail, so its texture travels at the steps' speed.
    const uv = geo.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * length)
    const mesh = new Mesh(geo, mat)
    mesh.castShadow = false
    mesh.receiveShadow = true
    this.group.add(mesh)
  }
}

function boxAt(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new BoxGeometry(w, h, d)
  g.translate(x, y, z)
  return g
}

/** Whether an object and everything above it is shown. */
export function shown(o: Object3D | null): boolean {
  for (let p = o; p; p = p.parent) if (!p.visible) return false
  return true
}
