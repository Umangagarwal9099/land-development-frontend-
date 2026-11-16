import { BufferGeometry, CatmullRomCurve3, CylinderGeometry, DoubleSide, Float32BufferAttribute, InstancedMesh, Matrix4, Mesh, Quaternion, SphereGeometry, TubeGeometry, Vector3, type Material, type MeshStandardMaterial, type Object3D } from 'three'
import type { FloorCtx } from './shell'
import { LEVELS, ROOF, VZ0, VZ1 } from './units'

/*
 * The mall's statement pieces, each made for its place and hung as it would be:
 *
 *   atrium   two ribbons of brushed champagne metal spiralling down through four storeys of the
 *            atrium, twisting as they fall, a line of light along each outer edge, hung on fine
 *            stainless cables from the skylight's frame
 *   lobby    a tiered crystal chandelier over the arrival lobby: three elliptical brass rings, each
 *            hung with a fringe of crystal rods, the inner rings dropping lower
 *   1        a molecular chandelier of brass branches and opal globes over the first floor lounge
 *   2        a linear chandelier of smoked glass blades on a brass spine over the second floor's
 *   4        clusters of hand-blown amber and smoke glass globes over the food court's tables
 */

const PI = Math.PI

function rod(p: Object3D, a: Vector3, b: Vector3, r: number, m: Material, cast = false) {
  const o = new Mesh(new CylinderGeometry(r, r, a.distanceTo(b), 6), m)
  o.position.copy(a).add(b).multiplyScalar(0.5)
  o.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize())
  o.castShadow = cast
  p.add(o)
  return o
}

/** A ribbon surface between two edge curves, both faces. */
function ribbonGeometry(a: Vector3[], b: Vector3[]) {
  const pos: number[] = []
  const uv: number[] = []
  for (let i = 0; i + 1 < a.length; i++) {
    const t0 = i / (a.length - 1)
    const t1 = (i + 1) / (a.length - 1)
    const quad = [a[i], a[i + 1], b[i + 1], a[i], b[i + 1], b[i]]
    const uvs = [[t0 * 12, 0], [t1 * 12, 0], [t1 * 12, 1], [t0 * 12, 0], [t1 * 12, 1], [t0 * 12, 1]]
    for (let k = 0; k < 6; k++) {
      pos.push(quad[k].x, quad[k].y, quad[k].z)
      uv.push(uvs[k][0], uvs[k][1])
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

export function atriumRibbons(e: FloorCtx, parent: Object3D) {
  const { lux } = e
  const metal = (lux.brass as MeshStandardMaterial).clone()
  metal.side = DoubleSide
  metal.userData.interior = true
  const cx = 2.0
  const cz = (VZ0 + VZ1) / 2
  const yTop = ROOF - 0.9
  const yBot = LEVELS[2] + 1.6
  const N = 260
  for (const phase of [0, PI]) {
    const edgeA: Vector3[] = []
    const edgeB: Vector3[] = []
    const centre: Vector3[] = []
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      const th = phase + t * PI * 2.6
      const shrink = 1 - 0.18 * t
      const c = new Vector3(cx + Math.cos(th) * 1.4 * shrink, yTop - t * (yTop - yBot), cz + Math.sin(th) * 2.5 * shrink)
      const radial = new Vector3(Math.cos(th), 0, Math.sin(th))
      const tw = 0.5 + 0.9 * Math.sin(t * PI * 3 + phase)
      const side = radial.clone().multiplyScalar(Math.cos(tw)).add(new Vector3(0, Math.sin(tw), 0)).normalize()
      const w = 0.22 + 0.32 * Math.sin(PI * Math.min(1, t * 1.1 + 0.05))
      edgeA.push(c.clone().addScaledVector(side, -w))
      edgeB.push(c.clone().addScaledVector(side, w))
      centre.push(c)
    }
    const ribbon = new Mesh(ribbonGeometry(edgeA, edgeB), metal)
    ribbon.name = 'live_atrium_ribbon'
    ribbon.castShadow = false
    parent.add(ribbon)
    // A line of light along the outer edge.
    const led = new Mesh(new TubeGeometry(new CatmullRomCurve3(edgeB), 400, 0.01, 6, false), lux.led)
    led.name = 'live_atrium_ribbon_led'
    parent.add(led)
    // Hung from the skylight's frame on stainless cables.
    for (let k = 0; k < 12; k++) {
      const p = centre[Math.round((k / 11) * (N - 1))]
      rod(parent, new Vector3(p.x, ROOF - 0.38, p.z), p, 0.003, lux.steel)
    }
  }
}

/** A tiered crystal chandelier, its crown at y, centred at (x, z). */
export function crystalChandelier(e: FloorCtx, parent: Object3D, x: number, z: number, y: number, scale = 1) {
  const { lux } = e
  const tiers = [
    { rx: 1.5, rz: 0.95, dy: 0, drop: 0.55 },
    { rx: 1.1, rz: 0.7, dy: -0.22, drop: 0.8 },
    { rx: 0.7, rz: 0.44, dy: -0.44, drop: 1.05 },
  ]
  const rods: [number, number, number, number][] = []
  for (const t of tiers) {
    const rx = t.rx * scale
    const rz = t.rz * scale
    const ring = new Mesh(new TubeGeometry(new CatmullRomCurve3(Array.from({ length: 48 }, (_, i) => new Vector3(x + Math.cos((i / 48) * PI * 2) * rx, y + t.dy, z + Math.sin((i / 48) * PI * 2) * rz)), true), 96, 0.018, 8, true), lux.brass)
    parent.add(ring)
    const per = Math.round((PI * (rx + rz)) / 0.055)
    for (let i = 0; i < per; i++) {
      const a = (i / per) * PI * 2
      const len = t.drop * (0.82 + ((i * 37) % 10) / 40)
      rods.push([x + Math.cos(a) * rx, y + t.dy - 0.02, z + Math.sin(a) * rz, len])
    }
    // Hangers from the ceiling to each ring.
    for (const a of [0, PI / 2, PI, 1.5 * PI]) rod(parent, new Vector3(x + Math.cos(a) * rx, y + 0.5, z + Math.sin(a) * rz), new Vector3(x + Math.cos(a) * rx, y + t.dy, z + Math.sin(a) * rz), 0.004, lux.brass)
  }
  const im = new InstancedMesh(new CylinderGeometry(0.008, 0.008, 1, 6), lux.crystal, rods.length)
  im.name = 'live_chandelier_rods'
  const m = new Matrix4()
  const q = new Quaternion()
  rods.forEach(([rx, ry, rz, len], i) => im.setMatrixAt(i, m.compose(new Vector3(rx, ry - len / 2, rz), q, new Vector3(1, len, 1))))
  // A cut-crystal drop at each rod's end.
  const drops = new InstancedMesh(new SphereGeometry(0.018, 8, 6), lux.crystal, rods.length)
  drops.name = 'live_chandelier_drops'
  rods.forEach(([rx, ry, rz, len], i) => drops.setMatrixAt(i, m.compose(new Vector3(rx, ry - len, rz), q, new Vector3(1, 1.6, 1))))
  parent.add(im, drops)
}

/** A molecular chandelier: brass branches from a central stem, an opal globe at each tip. */
export function molecular(e: FloorCtx, parent: Object3D, x: number, z: number, top: number) {
  const { lux, k } = e
  const hub = new Vector3(x, top - 0.75, z)
  rod(parent, new Vector3(x, top, z), hub, 0.008, lux.brass)
  k.cyl(parent, 0.07, 0.07, 0.02, lux.brass, x, top - 0.01, z, 24)
  k.sphere(parent, 0.035, lux.brass, hub.x, hub.y, hub.z)
  for (let i = 0; i < 14; i++) {
    const a = i * 2.39996
    const el = ((i % 5) - 2) * 0.22
    const len = 0.35 + ((i * 7) % 5) * 0.09
    const dir = new Vector3(Math.cos(a) * Math.cos(el), Math.sin(el) * 0.6, Math.sin(a) * Math.cos(el))
    const mid = hub.clone().addScaledVector(dir, len * 0.5)
    const tip = hub.clone().addScaledVector(dir, len).add(new Vector3(0, 0.05, 0))
    rod(parent, hub, mid, 0.006, lux.brass)
    rod(parent, mid, tip, 0.006, lux.brass)
    k.sphere(parent, 0.065, lux.opal, tip.x, tip.y + 0.06, tip.z)
  }
}

/** A linear chandelier of smoked glass blades hung from a brass spine. */
export function blades(e: FloorCtx, parent: Object3D, x: number, z: number, top: number, len: number, alongX = true) {
  const { lux, k } = e
  const y = top - 0.85
  const spine = alongX ? k.box(parent, len, 0.03, 0.05, lux.brass, x, y, z) : k.box(parent, 0.05, 0.03, len, lux.brass, x, y, z)
  spine.castShadow = false
  for (const s of [-0.4, 0.4]) rod(parent, new Vector3(x + (alongX ? s * len : 0), top, z + (alongX ? 0 : s * len)), new Vector3(x + (alongX ? s * len : 0), y, z + (alongX ? 0 : s * len)), 0.004, lux.brass)
  k.box(parent, alongX ? len - 0.04 : 0.012, 0.008, alongX ? 0.012 : len - 0.04, lux.led, x, y - 0.018, z, false)
  const n = Math.round(len / 0.14)
  for (let i = 0; i < n; i++) {
    const u = -len / 2 + ((i + 0.5) * len) / n
    const h = 0.3 + 0.25 * Math.abs(Math.sin(i * 0.9))
    const b = alongX ? k.box(parent, 0.012, h, 0.22, lux.smokeGlass, x + u, y - 0.02 - h / 2, z, false) : k.box(parent, 0.22, h, 0.012, lux.smokeGlass, x, y - 0.02 - h / 2, z + u, false)
    b.rotation.y = (i % 2 ? 1 : -1) * 0.25
  }
}

/** A cluster of blown-glass globes at varied drops from one brass canopy. */
export function globeCluster(e: FloorCtx, parent: Object3D, x: number, z: number, top: number, seed: number) {
  const { lux, k } = e
  k.cyl(parent, 0.22, 0.22, 0.03, lux.brass, x, top - 0.015, z, 32)
  for (let i = 0; i < 11; i++) {
    const a = i * 2.39996 + seed
    const r = 0.12 + ((i * 13) % 7) * 0.06
    const gx = x + Math.cos(a) * r
    const gz = z + Math.sin(a) * r
    const drop = 1.2 + ((i * 29 + seed * 7) % 11) * 0.12
    const size = 0.1 + ((i * 17) % 5) * 0.02
    rod(parent, new Vector3(gx, top, gz), new Vector3(gx, top - drop, gz), 0.003, lux.blackSteel)
    k.cyl(parent, 0.02, 0.026, 0.05, lux.brass, gx, top - drop - 0.02, gz, 12)
    const globe = k.sphere(parent, size, i % 3 === 0 ? lux.smokeGlass : lux.amberGlass, gx, top - drop - 0.04 - size, gz)
    globe.castShadow = false
    k.sphere(parent, 0.018, lux.led, gx, top - drop - 0.04 - size, gz).castShadow = false
  }
}

/** Points round a rounded rectangle [x0, x1] × [z0, z1] with corner radius r, at height y. */
function stadium(x0: number, x1: number, z0: number, z1: number, r: number, y: number, n = 160) {
  const w = x1 - x0 - 2 * r
  const d = z1 - z0 - 2 * r
  const per = 2 * (w + d) + 2 * PI * r
  // Eight pieces round it: a straight, a quarter circle, and so on, anticlockwise from the near side.
  const pieces: { len: number; at: (t: number) => [number, number] }[] = []
  const arc = (cx: number, cz: number, a0: number) => ({ len: (PI / 2) * r, at: (t: number): [number, number] => [cx + Math.cos(a0 + (t * PI) / 2) * r, cz + Math.sin(a0 + (t * PI) / 2) * r] })
  const line = (ax: number, az: number, bx: number, bz: number) => ({ len: Math.hypot(bx - ax, bz - az), at: (t: number): [number, number] => [ax + (bx - ax) * t, az + (bz - az) * t] })
  pieces.push(line(x0 + r, z0, x1 - r, z0), arc(x1 - r, z0 + r, -PI / 2), line(x1, z0 + r, x1, z1 - r), arc(x1 - r, z1 - r, 0))
  pieces.push(line(x1 - r, z1, x0 + r, z1), arc(x0 + r, z1 - r, PI / 2), line(x0, z1 - r, x0, z0 + r), arc(x0 + r, z0 + r, PI))
  const pts: Vector3[] = []
  for (let i = 0; i < n; i++) {
    let s = (i / n) * per
    let k = 0
    while (k < pieces.length - 1 && s > pieces[k].len) s -= pieces[k++].len
    const [px, pz] = pieces[k].at(Math.min(1, s / Math.max(1e-6, pieces[k].len)))
    pts.push(new Vector3(px, y, pz))
  }
  return { pts, per }
}

/**
 * The atrium's crown: a two-tier chandelier the size of the void, hung under the skylight above
 * the escalators' reach. Each tier is a brushed brass stadium ring with an LED channel, fringed
 * with crystal rods that lengthen towards the middle of each side so the fringe dips in a soft
 * catenary; the inner tier hangs lower and longer. Twelve stainless cables to the skylight frame.
 */
export function crownChandelier(e: FloorCtx, parent: Object3D, x0: number, x1: number, z0: number, z1: number) {
  const { lux } = e
  const tiers = [
    { inset: 0.0, y: ROOF - 1.35, drop: 0.9 },
    { inset: 0.42, y: ROOF - 1.75, drop: 1.45 },
  ]
  const rods: [number, number, number, number][] = []
  for (const t of tiers) {
    const { pts, per } = stadium(x0 + t.inset, x1 - t.inset, z0 + t.inset, z1 - t.inset, 1.4, t.y, 240)
    const ring = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts, true), 480, 0.03, 10, true), lux.brass)
    ring.name = 'live_crown_ring'
    parent.add(ring)
    const led = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts.map((p) => p.clone().add(new Vector3(0, -0.032, 0))), true), 480, 0.008, 6, true), lux.led)
    led.name = 'live_crown_led'
    parent.add(led)
    const count = Math.round(per / 0.05)
    const curve = new CatmullRomCurve3(pts, true)
    for (let i = 0; i < count; i++) {
      const u = i / count
      const p = curve.getPointAt(u)
      // Longer at the middle of each straight, shorter at the corners: a soft swag all round.
      const swag = 0.5 + 0.5 * Math.abs(Math.sin(u * PI * 4))
      const len = t.drop * (0.55 + 0.45 * swag) * (0.92 + ((i * 37) % 9) / 50)
      rods.push([p.x, p.y - 0.035, p.z, len])
    }
    for (let k = 0; k < 6; k++) {
      const p = curve.getPointAt(k / 6 + 0.04)
      rod(parent, new Vector3(p.x, ROOF - 0.38, p.z), p, 0.004, lux.steel)
    }
  }
  const m = new Matrix4()
  const q = new Quaternion()
  const im = new InstancedMesh(new CylinderGeometry(0.007, 0.007, 1, 6), lux.crystal, rods.length)
  im.name = 'live_crown_rods'
  rods.forEach(([x, y, z, len], i) => im.setMatrixAt(i, m.compose(new Vector3(x, y - len / 2, z), q, new Vector3(1, len, 1))))
  const drops = new InstancedMesh(new SphereGeometry(0.02, 8, 6), lux.crystal, rods.length)
  drops.name = 'live_crown_drops'
  rods.forEach(([x, y, z, len], i) => drops.setMatrixAt(i, m.compose(new Vector3(x, y - len - 0.01, z), q, new Vector3(1, 1.7, 1))))
  parent.add(im, drops)
}
