import { BoxGeometry, CanvasTexture, CapsuleGeometry, CylinderGeometry, Group, LatheGeometry, Mesh, MeshStandardMaterial, SRGBColorSpace, TorusGeometry, Vector2, type BufferGeometry, type Material, type Object3D, type Texture } from 'three'
import type { FloorCtx } from './shell'

/*
 * Designer furniture for the public spaces, modelled the way such pieces are made: curved sofas
 * turned on their plan radius (seat, back and plinth as true curved sections with seams between
 * the cushions), low Italian sofas on recessed plinths with loose seat and back cushions and
 * bolster arms, barrel lounge chairs on brass swivel bases, marble-topped tables with eased edges
 * on fluted bronze drums, upholstered dining chairs on walnut legs, channel-tufted banquettes.
 * Every piece sits on the floor with a soft contact shadow under it.
 */

const PI = Math.PI

/** A rounded-rectangle section in (r, y), for lathing: from r0 to r1 across, y0 to y1 up, corner radius c. */
function section(r0: number, r1: number, y0: number, y1: number, c: number, steps = 5): Vector2[] {
  const pts: Vector2[] = []
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * (PI / 2)
      pts.push(new Vector2(cx + Math.cos(a) * c, cy + Math.sin(a) * c))
    }
  }
  corner(r1 - c, y0 + c, -PI / 2)
  corner(r1 - c, y1 - c, 0)
  corner(r0 + c, y1 - c, PI / 2)
  corner(r0 + c, y0 + c, PI)
  pts.push(pts[0].clone())
  return pts
}

function lathe(pts: Vector2[], phi0: number, len: number, segs: number) {
  return new LatheGeometry(pts, Math.max(3, segs), phi0, len)
}

function mesh(p: Object3D, g: BufferGeometry, m: Material, x = 0, y = 0, z = 0, cast = true) {
  const o = new Mesh(g, m)
  o.position.set(x, y, z)
  o.castShadow = cast
  o.receiveShadow = true
  p.add(o)
  return o
}

/**
 * Piping: the welted seam round a cushion's top edge, a thin cord in the same cloth a shade
 * darker, with the corners rounded as a cushion's are. `w` × `d` is the cushion's plan, at height y.
 */
export function piping(p: Object3D, w: number, d: number, y: number, x: number, z: number, fabric: Material, r = 0.05) {
  let cord = pipingMats.get(fabric)
  if (!cord) {
    cord = (fabric as MeshStandardMaterial).clone()
    cord.color.multiplyScalar(0.82)
    cord.userData.interior = true
    pipingMats.set(fabric, cord)
  }
  const t = 0.007
  const g = new Group()
  g.position.set(x, y, z)
  p.add(g)
  const hw = w / 2 - r
  const hd = d / 2 - r
  const runs: [number, number, number, number][] = [[-hw, hw, 0, d / 2], [-hw, hw, 0, -d / 2], [-w / 2, 0, -hd, hd], [w / 2, 0, -hd, hd]]
  for (const [a, b, c, dd] of runs) {
    const along = c === 0 && dd !== 0 && a !== b && Math.abs(dd) === d / 2
    const len = along ? b - a : dd - c
    const m = new Mesh(new CylinderGeometry(t, t, len, 6), cord)
    m.position.set(along ? (a + b) / 2 : a, 0, along ? dd : (c + dd) / 2)
    m.rotation[along ? 'z' : 'x'] = PI / 2
    g.add(m)
  }
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const c = new Mesh(new TorusGeometry(r, t, 6, 10, PI / 2), cord)
      c.position.set(sx * hw, 0, sz * hd)
      c.rotation.x = -PI / 2
      c.rotation.z = sx > 0 ? (sz > 0 ? 0 : -PI / 2) : sz > 0 ? PI / 2 : PI
      g.add(c)
    }
}
const pipingMats = new Map<Material, MeshStandardMaterial>()

/** A group on the floor at (x, z), turned so that its local +z faces `yaw`. */
function place(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number) {
  const g = new Group()
  g.position.set(x, e.y, z)
  g.rotation.y = yaw
  p.add(g)
  return g
}

/**
 * A curved sofa on a circle of radius R about (cx, cz), from angle a0 through `sweep` (radians,
 * measured as LatheGeometry does: 0 towards +z). `inward` faces the centre (a conversation ring);
 * otherwise it faces out.
 */
export function curvedSofa(e: FloorCtx, p: Object3D, cx: number, cz: number, R: number, a0: number, sweep: number, fabric: Material, inward = true, cushions = 3) {
  const { lux, k } = e
  const g = new Group()
  g.position.set(cx, e.y, cz)
  p.add(g)
  const d = 0.95
  const front = inward ? R - d / 2 : R + d / 2
  const back = inward ? R + d / 2 : R - d / 2
  const lo = Math.min(front, back)
  const hi = Math.max(front, back)
  const segs = Math.ceil((sweep * R) / 0.12)
  // Recessed plinth, upholstered base.
  mesh(g, lathe(section(lo + 0.06, hi - 0.06, 0, 0.07, 0.01), a0, sweep, segs), lux.bronze)
  mesh(g, lathe(section(lo, hi, 0.07, 0.36, 0.05), a0, sweep, segs), fabric)
  // Seat cushions with seams between them, and the back.
  const seatBack = inward ? back - 0.22 : back + 0.22
  const gap = 0.012 / R
  const each = (sweep - gap * (cushions - 1)) / cushions
  for (let i = 0; i < cushions; i++) {
    const a = a0 + i * (each + gap)
    mesh(g, lathe(section(Math.min(front, seatBack), Math.max(front, seatBack), 0.36, 0.5, 0.06), a, each, Math.ceil(segs / cushions)), fabric)
  }
  mesh(g, lathe(section(Math.min(back, seatBack), Math.max(back, seatBack), 0.36, 0.82, 0.08), a0, sweep, segs), fabric)
  // Arms closing the ends.
  for (const a of [a0, a0 + sweep]) {
    const r = (lo + hi) / 2
    const arm = k.soft(g, 0.16, 0.6, d + 0.02, 0.07, fabric, Math.sin(a) * r, 0.36, Math.cos(a) * r)
    arm.rotation.y = a
  }
  // Contact shadow along the arc.
  for (let i = 0; i <= 6; i++) {
    const a = a0 + (sweep * i) / 6
    e.shade.pool(cx + Math.sin(a) * (lo + hi) / 2, e.y + 0.012, cz + Math.cos(a) * (lo + hi) / 2, 0.75, 0.75, 0.32)
  }
  return g
}

/** A low Italian sofa, `len` long, facing local +z: recessed plinth, loose cushions, bolster arms, two throw cushions. */
export function sofa(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, len: number, fabric: Material, accent?: Material) {
  const { k, lux } = e
  const g = place(e, p, x, z, yaw)
  const d = 0.98
  k.box(g, len - 0.12, 0.06, d - 0.14, lux.blackSteel, 0, 0.03, 0)
  k.soft(g, len, 0.28, d, 0.05, fabric, 0, 0.2, 0)
  const n = len > 2.4 ? 3 : 2
  const arm = 0.2
  const cw = (len - 2 * arm) / n
  for (let i = 0; i < n; i++) {
    const cx = -len / 2 + arm + (i + 0.5) * cw
    k.soft(g, cw - 0.016, 0.16, d - 0.26, 0.07, fabric, cx, 0.42, 0.1)
    piping(g, cw - 0.03, d - 0.28, 0.5, cx, 0.1, fabric)
    const b = k.soft(g, cw - 0.03, 0.46, 0.22, 0.09, fabric, cx, 0.66, -d / 2 + 0.15)
    b.rotation.x = -0.14
  }
  for (const s of [-1, 1]) {
    k.soft(g, arm, 0.3, d, 0.06, fabric, s * (len / 2 - arm / 2), 0.48, 0)
    // A bolster along the arm's top.
    const bol = mesh(g, new CylinderGeometry(0.07, 0.07, d - 0.08, 20), fabric, s * (len / 2 - arm / 2), 0.66, 0)
    bol.rotation.x = PI / 2
  }
  if (accent)
    for (const s of [-1, 1]) {
      const c = k.soft(g, 0.46, 0.44, 0.13, 0.06, accent, s * (len / 2 - arm - 0.3), 0.7, -d / 2 + 0.33)
      c.rotation.set(-0.25, s * 0.25, s * 0.08)
    }
  e.shade.rect(x, e.y + 0.012, z, len * 0.95, d * 0.95, yaw, 0.38)
  return g
}

/** A barrel lounge chair: a curved upholstered shell on a brass swivel base. */
export function barrelChair(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, fabric: Material) {
  const { lux } = e
  const g = place(e, p, x, z, yaw)
  mesh(g, lathe([new Vector2(0, 0), new Vector2(0.24, 0), new Vector2(0.25, 0.012), new Vector2(0.06, 0.03), new Vector2(0.04, 0.2), new Vector2(0, 0.2)], 0, PI * 2, 40), lux.brass)
  mesh(g, lathe(section(0, 0.38, 0.2, 0.36, 0.06), 0, PI * 2, 48), fabric)
  mesh(g, lathe(section(0, 0.34, 0.36, 0.46, 0.05), 0, PI * 2, 48), fabric)
  // The shell wraps the back: 250 degrees, centred behind.
  const sweep = PI * 1.4
  mesh(g, lathe(section(0.3, 0.42, 0.2, 0.74, 0.05), PI - sweep / 2, sweep, 48), fabric)
  e.shade.pool(x, e.y + 0.012, z, 0.5, 0.5, 0.4)
}

/** A round (or, scaled, oval) coffee table: an eased marble top on a fluted bronze drum. */
export function coffeeTable(e: FloorCtx, p: Object3D, x: number, z: number, r: number, stretch = 1, top?: Material) {
  const { lux } = e
  const g = place(e, p, x, z, 0)
  g.scale.set(stretch, 1, 1)
  mesh(g, lathe([new Vector2(0, 0.36), new Vector2(r - 0.02, 0.36), new Vector2(r, 0.375), new Vector2(r, 0.39), new Vector2(r - 0.015, 0.4), new Vector2(0, 0.4)], 0, PI * 2, 64), top ?? lux.calacattaOro)
  const dr = r * 0.55
  mesh(g, new CylinderGeometry(dr, dr, 0.36, 48), lux.bronze, 0, 0.18, 0)
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * PI * 2
    mesh(g, new CylinderGeometry(0.018, 0.018, 0.34, 8), lux.bronze, Math.cos(a) * dr, 0.18, Math.sin(a) * dr, false)
  }
  e.shade.pool(x, e.y + 0.012, z, r * stretch * 1.1, r * 1.1, 0.35)
}

/** A travertine drum side table. */
export function sideTable(e: FloorCtx, p: Object3D, x: number, z: number) {
  const g = place(e, p, x, z, 0)
  mesh(g, lathe([new Vector2(0, 0), new Vector2(0.21, 0), new Vector2(0.22, 0.02), new Vector2(0.22, 0.5), new Vector2(0.21, 0.52), new Vector2(0, 0.52)], 0, PI * 2, 40), e.lux.travertine)
  e.shade.pool(x, e.y + 0.012, z, 0.3, 0.3, 0.35)
}

/** A stone bench: a marble block with a leather pad and a brass inlay along its face. */
export function bench(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, len: number, stone: Material) {
  const { k, lux } = e
  const g = place(e, p, x, z, yaw)
  k.soft(g, len, 0.4, 0.46, 0.015, stone, 0, 0.2, 0)
  k.soft(g, len - 0.06, 0.07, 0.42, 0.03, lux.leatherCognac, 0, 0.43, 0)
  k.box(g, len - 0.1, 0.012, 0.004, lux.brass, 0, 0.16, 0.232)
  e.shade.rect(x, e.y + 0.012, z, len, 0.5, yaw, 0.4)
}

/** An upholstered dining chair with a curved back, on splayed walnut legs. */
export function diningChair(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, fabric: Material) {
  const { k, lux } = e
  const g = place(e, p, x, z, yaw)
  for (const sx of [-0.19, 0.19])
    for (const sz of [-0.18, 0.2]) {
      const leg = mesh(g, new CylinderGeometry(0.016, 0.012, 0.46, 10), lux.walnut, sx * 1.02, 0.23, sz)
      leg.rotation.set(sz > 0 ? -0.06 : 0.06, 0, sx > 0 ? -0.05 : 0.05)
    }
  k.soft(g, 0.46, 0.08, 0.44, 0.03, fabric, 0, 0.5, 0.02)
  mesh(g, lathe(section(0.2, 0.25, 0.5, 0.86, 0.025), PI - 0.95, 1.9, 24), fabric, 0, 0, 0.06)
  e.shade.pool(x, e.y + 0.012, z, 0.3, 0.3, 0.3)
}

/** A round dining table: marble on a bronze trumpet base, with chairs round it. */
export function roundTable(e: FloorCtx, p: Object3D, x: number, z: number, r: number, chairs: number, fabric: Material) {
  const { lux } = e
  const g = place(e, p, x, z, 0)
  mesh(g, lathe([new Vector2(0, 0.72), new Vector2(r - 0.015, 0.72), new Vector2(r, 0.735), new Vector2(r, 0.75), new Vector2(r - 0.012, 0.76), new Vector2(0, 0.76)], 0, PI * 2, 56), lux.calacattaOro)
  mesh(g, lathe([new Vector2(0, 0), new Vector2(0.27, 0), new Vector2(0.27, 0.02), new Vector2(0.1, 0.08), new Vector2(0.05, 0.3), new Vector2(0.045, 0.7), new Vector2(0.12, 0.72), new Vector2(0, 0.72)], 0, PI * 2, 40), lux.brass)
  for (let i = 0; i < chairs; i++) {
    const a = (i / chairs) * PI * 2 + PI / chairs
    diningChair(e, p, x + Math.sin(a) * (r + 0.3), z + Math.cos(a) * (r + 0.3), a + PI, fabric)
  }
  e.shade.pool(x, e.y + 0.012, z, r * 1.1, r * 1.1, 0.35)
}

/** A long table, walnut on brass sled legs, `n` chairs a side. */
export function longTable(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, len: number, n: number, fabric: Material) {
  const { k, lux } = e
  const g = place(e, p, x, z, yaw)
  k.soft(g, len, 0.045, 0.9, 0.012, lux.walnut, 0, 0.74, 0)
  for (const s of [-1, 1]) {
    k.box(g, 0.03, 0.7, 0.03, lux.brass, s * (len / 2 - 0.25), 0.36, -0.38)
    k.box(g, 0.03, 0.7, 0.03, lux.brass, s * (len / 2 - 0.25), 0.36, 0.38)
    k.box(g, 0.03, 0.03, 0.79, lux.brass, s * (len / 2 - 0.25), 0.015, 0)
    k.box(g, 0.03, 0.03, 0.79, lux.brass, s * (len / 2 - 0.25), 0.7, 0)
  }
  for (let i = 0; i < n; i++) {
    const u = -len / 2 + ((i + 0.5) * len) / n
    for (const s of [-1, 1]) {
      const c = Math.cos(yaw)
      const sn = Math.sin(yaw)
      const lx = u
      const lz = s * 0.72
      diningChair(e, p, x + lx * c + lz * sn, z - lx * sn + lz * c, yaw + (s > 0 ? PI : 0), fabric)
    }
  }
  e.shade.rect(x, e.y + 0.012, z, len, 1.0, yaw, 0.35)
}

/** A channel-tufted banquette facing local +z, `len` long. */
export function banquette(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, len: number, fabric: Material) {
  const { k, lux } = e
  const g = place(e, p, x, z, yaw)
  k.box(g, len, 0.08, 0.56, lux.blackSteel, 0, 0.04, 0)
  k.soft(g, len, 0.38, 0.6, 0.04, fabric, 0, 0.27, 0)
  k.soft(g, len - 0.02, 0.1, 0.56, 0.04, fabric, 0, 0.49, 0.02)
  const n = Math.round(len / 0.16)
  const cap = new CapsuleGeometry(0.07, 0.42, 6, 12)
  for (let i = 0; i < n; i++) mesh(g, cap, fabric, -len / 2 + ((i + 0.5) * len) / n, 0.85, -0.24, false).rotation.x = -0.1
  k.box(g, len, 0.6, 0.1, lux.walnut, 0, 0.82, -0.33)
  e.shade.rect(x, e.y + 0.012, z, len, 0.7, yaw, 0.4)
}

/* ---------- the lounge collection ---------- */

/** An L-shaped sectional in leather: a long run, a return at its left end, deep seats, low back. */
export function sectional(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, run: number, ret: number, fabric: Material) {
  const { k, lux } = e
  const g = place(e, p, x, z, yaw)
  const d = 1.0
  // The run, along local x, its back at local −z; the return along local +z at the left end.
  k.box(g, run - 0.1, 0.05, d - 0.12, lux.brass, 0, 0.025, 0)
  k.soft(g, run, 0.3, d, 0.05, fabric, 0, 0.2, 0)
  const n = Math.max(2, Math.round((run - d) / 0.85))
  const cw = (run - d) / n
  for (let i = 0; i < n; i++) {
    const cx = -run / 2 + d + (i + 0.5) * cw
    k.soft(g, cw - 0.015, 0.16, d - 0.25, 0.07, fabric, cx, 0.43, 0.1)
    piping(g, cw - 0.03, d - 0.27, 0.51, cx, 0.1, fabric)
    const b = k.soft(g, cw - 0.03, 0.42, 0.22, 0.09, fabric, cx, 0.64, -d / 2 + 0.14)
    b.rotation.x = -0.12
  }
  // Corner seat and the return.
  k.soft(g, d - 0.25, 0.16, d - 0.25, 0.07, fabric, -run / 2 + d / 2 + 0.1, 0.43, 0.1)
  piping(g, d - 0.27, d - 0.27, 0.51, -run / 2 + d / 2 + 0.1, 0.1, fabric)
  const rg = new Group()
  rg.position.set(-run / 2 + d / 2, 0, d / 2 + ret / 2)
  g.add(rg)
  k.box(rg, d - 0.12, 0.05, ret - 0.1, lux.brass, 0, 0.025, 0)
  k.soft(rg, d, 0.3, ret, 0.05, fabric, 0, 0.2, 0)
  k.soft(rg, d - 0.25, 0.16, ret - 0.04, 0.07, fabric, 0.1, 0.43, 0)
  piping(rg, d - 0.27, ret - 0.06, 0.51, 0.1, 0, fabric)
  const back = k.soft(rg, 0.22, 0.42, ret + d - 0.1, 0.09, fabric, -d / 2 + 0.14, 0.64, -d / 2 + 0.05)
  back.rotation.z = 0.12
  const cb = k.soft(g, d - 0.15, 0.42, 0.22, 0.09, fabric, -run / 2 + d / 2 + 0.07, 0.64, -d / 2 + 0.14)
  cb.rotation.x = -0.12
  // A low arm at the run's free end.
  k.soft(g, 0.2, 0.26, d, 0.07, fabric, run / 2 - 0.1, 0.48, 0)
  // Two throw cushions.
  for (const [cx, rz] of [[-run / 2 + 0.55, 0.15], [run / 2 - 0.55, -0.15]] as const) {
    const c = k.soft(g, 0.5, 0.48, 0.14, 0.06, lux.velvetOchre, cx, 0.72, -d / 2 + 0.34)
    c.rotation.set(-0.25, rz, 0)
  }
  e.shade.rect(x, e.y + 0.012, z, run * 0.95, d * 0.95, yaw, 0.38)
}

/** A high-backed wing lounge chair in velvet on tapered walnut legs, facing local +z. */
export function wingChair(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, fabric: Material) {
  const { k, lux } = e
  const g = place(e, p, x, z, yaw)
  for (const sx of [-0.3, 0.3])
    for (const sz of [-0.28, 0.3]) {
      const leg = mesh(g, new CylinderGeometry(0.022, 0.014, 0.2, 10), lux.walnut, sx, 0.1, sz)
      leg.rotation.set(sz > 0 ? 0.12 : -0.12, 0, sx > 0 ? -0.12 : 0.12)
    }
  k.soft(g, 0.78, 0.18, 0.78, 0.05, fabric, 0, 0.29, 0.02)
  k.soft(g, 0.66, 0.12, 0.62, 0.05, fabric, 0, 0.44, 0.07)
  piping(g, 0.64, 0.6, 0.5, 0, 0.07, fabric)
  const back = k.soft(g, 0.78, 0.82, 0.16, 0.07, fabric, 0, 0.8, -0.33)
  back.rotation.x = -0.12
  for (const s of [-1, 1]) {
    const wing = k.soft(g, 0.13, 0.62, 0.5, 0.06, fabric, s * 0.36, 0.78, -0.12)
    wing.rotation.y = s * 0.28
    k.soft(g, 0.12, 0.22, 0.62, 0.05, fabric, s * 0.36, 0.5, 0.06)
  }
  e.shade.pool(x, e.y + 0.012, z, 0.55, 0.55, 0.4)
}

/** A rolled-arm club chair in leather on a recessed plinth, facing local +z. */
export function clubChair(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, fabric: Material) {
  const { k, lux } = e
  const g = place(e, p, x, z, yaw)
  k.box(g, 0.74, 0.06, 0.74, lux.blackSteel, 0, 0.03, 0)
  k.soft(g, 0.88, 0.3, 0.88, 0.06, fabric, 0, 0.21, 0)
  k.soft(g, 0.6, 0.14, 0.66, 0.06, fabric, 0, 0.42, 0.08)
  piping(g, 0.58, 0.64, 0.49, 0, 0.08, fabric)
  k.soft(g, 0.88, 0.38, 0.22, 0.08, fabric, 0, 0.55, -0.33)
  for (const s of [-1, 1]) {
    k.soft(g, 0.16, 0.24, 0.84, 0.06, fabric, s * 0.36, 0.46, 0.02)
    const roll = mesh(g, new CylinderGeometry(0.09, 0.09, 0.84, 24), fabric, s * 0.37, 0.6, 0.02)
    roll.rotation.x = PI / 2
  }
  e.shade.pool(x, e.y + 0.012, z, 0.6, 0.6, 0.4)
}

/** A channel-tufted three-seat sofa on brass legs, facing local +z. */
export function channelSofa(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, len: number, fabric: Material) {
  const { k, lux } = e
  const g = place(e, p, x, z, yaw)
  for (const sx of [-len / 2 + 0.12, len / 2 - 0.12])
    for (const sz of [-0.35, 0.35]) mesh(g, new CylinderGeometry(0.018, 0.012, 0.16, 12), lux.brass, sx, 0.08, sz)
  k.soft(g, len, 0.24, 0.92, 0.04, fabric, 0, 0.28, 0)
  k.soft(g, len - 0.34, 0.14, 0.7, 0.06, fabric, 0, 0.46, 0.08)
  const n = Math.round((len - 0.3) / 0.15)
  const cap = new CapsuleGeometry(0.07, 0.42, 6, 12)
  for (let i = 0; i < n; i++) mesh(g, cap, fabric, -len / 2 + 0.15 + ((i + 0.5) * (len - 0.3)) / n, 0.78, -0.36, false).rotation.x = -0.12
  for (const s of [-1, 1]) k.soft(g, 0.17, 0.4, 0.92, 0.06, fabric, s * (len / 2 - 0.085), 0.55, 0)
  e.shade.rect(x, e.y + 0.012, z, len, 0.95, yaw, 0.35)
}

/** A low plinth coffee table: a block of marble on a recessed brass base. */
export function plinthTable(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, w: number, d: number, stone: Material) {
  const { k, lux } = e
  const g = place(e, p, x, z, yaw)
  k.box(g, w - 0.16, 0.06, d - 0.16, lux.brass, 0, 0.03, 0)
  k.soft(g, w, 0.3, d, 0.012, stone, 0, 0.21, 0)
  e.shade.rect(x, e.y + 0.012, z, w, d, yaw, 0.45)
}

/** A travertine pill side table. */
export function pillTable(e: FloorCtx, p: Object3D, x: number, z: number) {
  const g = place(e, p, x, z, 0)
  const pill = mesh(g, new CapsuleGeometry(0.17, 0.2, 8, 24), e.lux.travertine, 0, 0.27, 0)
  pill.scale.set(1, 1, 1)
  e.shade.pool(x, e.y + 0.012, z, 0.28, 0.28, 0.35)
}

/** A brass arc floor lamp: a marble foot, the arc, an opal globe over the seat it lights. */
export function arcLamp(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number) {
  const { k, lux } = e
  const g = place(e, p, x, z, yaw)
  mesh(g, new CylinderGeometry(0.17, 0.18, 0.06, 32), lux.wallNero, 0, 0.03, 0)
  const pts: Vector2[] = []
  let prev = new Vector2(0, 0.06)
  for (let i = 1; i <= 16; i++) {
    const t = i / 16
    const a = t * PI * 0.62
    const pt = new Vector2(Math.sin(a) * 1.1, 0.06 + Math.sin(a * 0.9 + 0.35) * 1.75)
    const seg = mesh(g, new CylinderGeometry(0.012, 0.012, prev.distanceTo(pt), 8), lux.brass, 0, 0, 0, false)
    seg.position.set(0, (prev.y + pt.y) / 2, (prev.x + pt.x) / 2)
    seg.rotation.x = Math.atan2(pt.x - prev.x, pt.y - prev.y)
    prev = pt
    pts.push(pt)
  }
  k.sphere(g, 0.16, lux.opal, 0, prev.y - 0.18, prev.x)
  k.cyl(g, 0.03, 0.03, 0.04, lux.brass, 0, prev.y - 0.02, prev.x, 12)
}

const rugTex = new Map<string, Texture>()
/** A hand-knotted rug: an abstract stone-veined field inside a border, laid flat, w × d. */
export function rug(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, w: number, d: number, field: string, border: string, seed: number) {
  const key = `${field}|${border}|${seed}`
  let t = rugTex.get(key)
  if (!t) {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 640
    const g = c.getContext('2d')!
    g.fillStyle = border
    g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = field
    g.fillRect(36, 36, c.width - 72, c.height - 72)
    let s = seed
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    g.lineCap = 'round'
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = i % 3 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'
      g.lineWidth = 6 + r() * 26
      g.beginPath()
      let px = 36 + r() * (c.width - 72)
      let py = 36
      g.moveTo(px, py)
      while (py < c.height - 36) {
        px += (r() - 0.5) * 60
        py += 20 + r() * 30
        g.lineTo(Math.max(40, Math.min(c.width - 40, px)), Math.min(c.height - 36, py))
      }
      g.stroke()
    }
    g.strokeStyle = 'rgba(201,168,106,.6)'
    g.lineWidth = 4
    g.strokeRect(46, 46, c.width - 92, c.height - 92)
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.05)'
      g.fillRect(r() * c.width, r() * c.height, 2, 2)
    }
    t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 8
    rugTex.set(key, t)
  }
  const m = new MeshStandardMaterial({ map: t, roughness: 0.97 })
  m.userData.interior = true
  const g = place(e, p, x, z, yaw)
  const o = mesh(g, new BoxGeometry(w, 0.012, d), m, 0, 0.012, 0, false)
  o.receiveShadow = true
}
