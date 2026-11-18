import { BufferAttribute, Group, Mesh, PlaneGeometry, PointLight, TorusGeometry, Vector3, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import { rectPoly } from '../basement'
import { Tris } from '../kalakalMall/skin'
import { rect, slab, sheet } from '../kalakalMall/solids'
import { lettersAlong, NAME, type HotelCtx } from './ctx'
import {
  canopyFrontZ, CANOPY, COLUMNS_X, CUP, CUP_BANDS, cupR, DRUM, frontZ, GL, LEFT, LOBBY, LV, MAIN, REAR, roofY, SLAB, SWOOSH_BASE, SWOOSH_H, swooshY, chaikin,
} from './plan'
import { arc, band, facing, fins, out, path, rail, slice, strip, type PP } from './shell'

/*
 * The podium of reference 1: the south block with its rounded corner, the main block whose roof
 * rises to the north behind the silver band, the drum and its blade, the canopy over the drop-off
 * and the double-height lobby under it. Its front bows out to the north end, where the cup stands
 * in a notch in it (starbucks.ts).
 */

const PI = Math.PI
/** The cup's lid top: below it the main block's front is notched round the cup. */
const CUP_TOP = CUP_BANDS.lid[1]

/* ---------- the outline ---------- */

/** Points every `step` metres along a straight run from a to b (a included, b not). */
function run(a: Point2, b: Point2, step = 0.4): Point2[] {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step))
  return Array.from({ length: n }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n] as Point2)
}

/**
 * The podium's plan at a height, as a closed outline: the south face, the rounded corner, the south
 * block's front, the step back to the lobby's front, the bowed front to the north end, the north
 * face and the back. Below the lid's top the bow is notched round the cup at radius `notch`.
 */
export function outline(notch = 0): Point2[] {
  const pts: Point2[] = []
  const cx = LEFT.x0 + LEFT.r
  const cz = LEFT.front - LEFT.r
  // The back, the step out beside the ramp's foot, the south block's south face.
  pts.push(...run([MAIN.x1, REAR.back], [REAR.x0, REAR.back], 0.5))
  pts.push(...run([REAR.x0, REAR.back], [REAR.x0, REAR.z1], 0.5))
  pts.push(...run([REAR.x0, REAR.z1], [LEFT.x0, REAR.z1]))
  pts.push(...run([LEFT.x0, REAR.z1], [LEFT.x0, cz]))
  pts.push(...arc(cx, cz, LEFT.r, -PI / 2, 0, 0.3).slice(0, -1))
  pts.push(...run([cx, LEFT.front], [LEFT.x1, LEFT.front]))
  pts.push(...run([LEFT.x1, LEFT.front], [LEFT.x1, MAIN.front], 0.3))
  pts.push(...run([LEFT.x1, MAIN.front], [MAIN.bowFrom, MAIN.front]))
  // The bow, and the notch round the cup's back where the bow passes inside the cup.
  const bow: Point2[] = []
  const n = Math.ceil((MAIN.x1 - MAIN.bowFrom) / 0.3)
  for (let i = 0; i <= n; i++) {
    const x = MAIN.bowFrom + ((MAIN.x1 - MAIN.bowFrom) * i) / n
    bow.push([x, frontZ(x)])
  }
  const inside = ([x, z]: Point2) => notch > 0 && Math.hypot(x - CUP.x, z - CUP.z) < notch
  const first = bow.findIndex(inside)
  if (first < 0) pts.push(...bow)
  else {
    let last = first
    while (last + 1 < bow.length && inside(bow[last + 1])) last++
    const ang = ([x, z]: Point2) => Math.atan2(x - CUP.x, z - CUP.z)
    const a0 = ang(bow[first])
    let a1 = ang(bow[last])
    // Round the back of the cup (through −z), from the south side to the north.
    if (a1 > a0) a1 -= 2 * PI
    pts.push(...bow.slice(0, first), ...arc(CUP.x, CUP.z, notch, a0, a1, 0.25), ...bow.slice(last + 1))
  }
  pts.push(...run([MAIN.x1, frontZ(MAIN.x1)], [MAIN.x1, REAR.back], 0.5).slice(1))
  return pts
}

/**
 * The notch's plan at radius `notch`: between the bow (where the front would have run) and the
 * cup's back, behind which the main block wraps round. What the cup must close over and roof.
 */
export function notchHole(notch: number): Point2[] {
  const bow: Point2[] = []
  for (let x = MAIN.bowFrom; x <= MAIN.x1; x += 0.2) bow.push([x, frontZ(x)])
  const inside = ([x, z]: Point2) => Math.hypot(x - CUP.x, z - CUP.z) < notch
  const first = bow.findIndex(inside)
  let last = first
  while (last + 1 < bow.length && inside(bow[last + 1])) last++
  const ang = ([x, z]: Point2) => Math.atan2(x - CUP.x, z - CUP.z)
  const a0 = ang(bow[first])
  let a1 = ang(bow[last])
  if (a1 > a0) a1 -= 2 * PI
  return [...bow.slice(first, last + 1), ...arc(CUP.x, CUP.z, notch, a0, a1, 0.25).reverse()]
}

/** Whether a plan point is inside a closed polygon. */
export function within([x, z]: Point2, poly: Point2[]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

/** Consecutive runs of a path that share a kind (each run keeps its neighbour's boundary point). */
function runs<T extends string>(p: PP[], kind: (q: PP, next: PP) => T): { kind: T; pts: PP[] }[] {
  const out: { kind: T; pts: PP[] }[] = []
  for (let i = 0; i < p.length - 1; i++) {
    const k = kind(p[i], p[i + 1])
    const last = out[out.length - 1]
    if (last && last.kind === k) last.pts.push(p[i + 1])
    else out.push({ kind: k, pts: [p[i], p[i + 1]] })
  }
  return out
}

/** The storeys of the podium, split at the lid's top (where the notch ends): [bottom, top, slab at bottom?]. */
const BANDS: [number, number, boolean][] = (() => {
  const out: [number, number, boolean][] = []
  for (let i = 0; i < LV.length; i++) {
    const a = LV[i]
    const b = i + 1 < LV.length ? LV[i + 1] : 32
    if (a < CUP_TOP && b > CUP_TOP) out.push([a, CUP_TOP, i > 0], [CUP_TOP, b, false])
    else out.push([a, b, i > 0])
  }
  return out
})()

const notchFor = (y0: number, y1: number) => (y0 >= CUP_TOP - 1e-6 ? 0 : Math.max(cupR(y0 + 1e-3), cupR(Math.min(y1, CUP_TOP) - 1e-3)) + 0.04)

/* ---------- curtain walls ---------- */

/** How deep the lit rooms are drawn behind the glass. */
const ROOM = 3.0

/**
 * Every storey round the outline: glass to the band's underside, a spandrel over each slab, silver
 * mullions at 1.5 m, and behind the glass a lit room (its back wall, ceiling and floor). The lobby's
 * front is left to the storefront (buildLobby); the notch to the cup.
 */
function buildCurtain(ctx: HotelCtx, parent: Object3D) {
  const { c, k } = ctx
  const glass = new Tris()
  const spandrel = new Tris()
  const nosing = new Tris()
  const wall = new Tris()
  const ceil = new Tris()
  const floor = new Tris()
  const mullions = new Group()
  mullions.name = 'mullions'
  parent.add(mullions)
  for (const [ya, yb, hasSlab] of BANDS) {
    const notch = notchFor(ya, yb)
    const p = path(outline(notch), 'closed')
    const top = (q: PP) => Math.max(ya, Math.min(yb, swooshY(q.x, q.z)))
    const lobbyFront = (q: PP) => Math.abs(q.z - MAIN.front) < 0.01 && q.x > LEFT.x1 - 0.01 && q.x < MAIN.bowFrom + 0.01
    const inNotch = (q: PP) => notch > 0 && Math.hypot(q.x - CUP.x, q.z - CUP.z) < notch + 0.02
    const parts = runs(p, (a, b) => (inNotch(a) && inNotch(b) ? 'notch' : lobbyFront(a) && lobbyFront(b) && ya < LV[2] ? 'lobby' : swooshY((a.x + b.x) / 2, (a.z + b.z) / 2) > ya + 0.6 ? 'wall' : 'none'))
    for (const { kind, pts } of parts) {
      if (kind === 'notch' || kind === 'none') continue
      if (kind === 'lobby') continue
      band(glass, pts, 0, ya, top)
      fins(k, mullions, pts, 0.07, ya, top, 1.5, 0.06, 0.16, c.fin)
      if (hasSlab) {
        rail(spandrel, pts, 0.01, 0.05, ya - 0.5, (q) => Math.min(ya + 0.1, top(q)))
        rail(nosing, pts, 0.0, 0.12, ya + 0.12, ya + 0.17)
      }
      // The room behind: its ceiling is the slab above, if there is one in this band.
      const ceilY = yb === CUP_TOP && ya < CUP_TOP ? null : yb - SLAB
      const wallTop = (q: PP) => Math.min(top(q), ceilY ?? top(q))
      band(wall, pts, -ROOM, ya, wallTop, false, ya)
      if (ceilY !== null) strip(ceil, pts, -ROOM, 0, (q) => Math.min(ceilY, top(q) - 0.02), false)
      if (hasSlab || ya === GL) strip(floor, pts, -ROOM, 0, ya + 0.01, true)
    }
  }
  glass.mesh(c.glass, parent, 'podium_glass', false)
  spandrel.mesh(c.spandrel, parent, 'podium_spandrel')
  nosing.mesh(c.fin, parent, 'podium_nosing')
  wall.mesh(c.floorWall, parent, 'podium_rooms', false)
  ceil.mesh(c.slotCeiling, parent, 'podium_ceilings', false)
  floor.mesh(c.lobbyFloor, parent, 'podium_floors', false)
  const foot = outline(notchFor(GL, LV[1]))
  ctx.shade.edge(foot, GL + 0.004, 0.8, -1, 0.45, true)
}

/* ---------- the silver band ---------- */

/** The nearest point to `q` on a closed outline, and how far it is. */
function nearest([x, z]: Point2, poly: Point2[]): { p: Point2; d: number } {
  let best: Point2 = poly[0]
  let bd = Infinity
  for (let i = 0; i < poly.length; i++) {
    const [ax, az] = poly[i]
    const [bx, bz] = poly[(i + 1) % poly.length]
    const dx = bx - ax
    const dz = bz - az
    const l2 = dx * dx + dz * dz || 1
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2))
    const px = ax + dx * t
    const pz = az + dz * t
    const d = Math.hypot(x - px, z - pz)
    if (d < bd) [bd, best] = [d, [px, pz]]
  }
  return { p: best, d: bd }
}

/** The band's line in plan: out from the front, bulging round the drum's foot, smoothed. */
export function swooshLine(): Point2[] {
  const base = outline(0)
  const p = path(base, 'closed')
  // Clear of the drum's set-back first floor by 1.3 m (the drum stands on the podium behind it).
  const drumR = DRUM.rIn + 1.3
  const pts: Point2[] = []
  for (const q of p.slice(0, -1)) {
    let [x, z] = out(q, SWOOSH_H)
    if (q.z > 25 && Math.abs(q.x - DRUM.x) < drumR) {
      const zd = DRUM.z + Math.sqrt(drumR * drumR - (q.x - DRUM.x) ** 2)
      if (zd > z) [x, z] = [q.x, zd]
    }
    // Offsets from inside corners (the step, the back) fold back over the facade: leave them out.
    if (nearest([x, z], base).d < SWOOSH_H - 0.1) continue
    pts.push([x, z])
  }
  // Drop the points crowded together, then round off the kinks.
  const thin: Point2[] = []
  for (const q of pts) if (!thin.length || Math.hypot(q[0] - thin[thin.length - 1][0], q[1] - thin[thin.length - 1][1]) > 0.45) thin.push(q)
  return chaikin(thin, 2)
}

/**
 * The silver band: a 1.15 m deep fascia round the whole podium, standing proud of the front and
 * hugging the drum's foot, level over the south block and rising with the main block's roof to the
 * north; its soffit over the glass, a warm LED line under its edge, and the name on it.
 */
function buildSwoosh(ctx: HotelCtx, parent: Object3D) {
  const { c } = ctx
  const line = swooshLine()
  const p = path(line, 'closed')
  const base = outline(0)
  const y0 = (q: PP) => swooshY(q.x, q.z)
  const y1 = (q: PP) => swooshY(q.x, q.z) + SWOOSH_H
  const body = new Tris()
  rail(body, p, -1.2, 0, y0, y1, false)
  body.mesh(c.silver, parent, 'swoosh')
  const led = new Tris()
  rail(led, p, -0.3, -0.04, (q) => y0(q) - 0.05, y0, false)
  led.mesh(c.led, parent, 'swoosh_led', false)
  // Soffit and roof over the overhang, from the band's inner face back to the nearest glass.
  const soffit = new Tris()
  const deck = new Tris()
  const span = p.map((q) => {
    const { p: f, d } = nearest([q.x, q.z], base)
    const k = Math.min(1, 1.2 / Math.max(d, 1e-3))
    return { inner: [q.x + (f[0] - q.x) * k, q.z + (f[1] - q.z) * k] as Point2, face: f, d }
  })
  for (let i = 0; i < p.length - 1; i++) {
    const [a, b] = [span[i], span[i + 1]]
    if (a.d < 1.3 && b.d < 1.3) continue
    for (const [t, ya, yb, up] of [[soffit, y0(p[i]), y0(p[i + 1]), false], [deck, y1(p[i]) - 0.2, y1(p[i + 1]) - 0.2, true]] as [Tris, number, number, boolean][]) {
      const v = (q: Point2, y: number) => new Vector3(q[0], y, q[1])
      facing(t, v(a.inner, ya), v(b.inner, yb), v(b.face, yb), v(a.face, ya), a.inner, b.inner, b.face, a.face, new Vector3(0, up ? 1 : -1, 0))
    }
  }
  soffit.mesh(c.soffitSilver, parent, 'swoosh_soffit', false)
  deck.mesh(c.roof, parent, 'swoosh_deck', false)

  // The name in lit letters on the band's face over the south block's front.
  const at = p.reduce((best, q) => (q.nz > 0.6 && Math.abs(q.x + 7.4) < Math.abs(best.x + 7.4) ? q : best), p[0])
  const { letters, total } = lettersAlong(ctx, NAME, 0.58, 0.06)
  for (const l of letters) {
    const s = at.s - total / 2 + l.at
    const seg = slice(p, Math.max(0, s - 0.01), s)
    const q = seg[seg.length - 1]
    const [x, z] = out(q, 0.02)
    l.group.position.set(x, swooshY(q.x, q.z) + (SWOOSH_H - 0.58) / 2, z)
    l.group.rotation.y = Math.atan2(q.nx, q.nz)
    parent.add(l.group)
  }
}

/* ---------- the roof ---------- */

/**
 * The roof behind the band: level over the south block and the back, rising with the band over
 * the main block's front half to the north, as a shell; laid on a grid so it follows the band.
 */
function buildRoof(ctx: HotelCtx, parent: Object3D) {
  const { c } = ctx
  const flat = new Tris()
  const sloped = new Tris()
  const zMax = (x: number) => (x < LEFT.x0 ? REAR.z1 : frontZ(x))
  const xs: number[] = []
  for (let x = REAR.x0; x < MAIN.x1; x += 0.4) xs.push(x)
  xs.push(LEFT.x0 - 1e-3, LEFT.x0 + 1e-3, MAIN.x1)
  xs.sort((a, b) => a - b)
  const NZ = 40
  const flatY = SWOOSH_BASE + SWOOSH_H - 0.2
  for (let i = 0; i < xs.length - 1; i++) {
    const [xa, xb] = [xs[i], xs[i + 1]]
    if (xb - xa < 1e-4) continue
    const [fa, fb] = [zMax(xa + 1e-4), zMax(xb - 1e-4)]
    for (let j = 0; j < NZ; j++) {
      const za0 = REAR.back + ((fa - REAR.back) * j) / NZ
      const za1 = REAR.back + ((fa - REAR.back) * (j + 1)) / NZ
      const zb0 = REAR.back + ((fb - REAR.back) * j) / NZ
      const zb1 = REAR.back + ((fb - REAR.back) * (j + 1)) / NZ
      const y = (x: number, z: number) => roofY(x, z) - 0.2
      const ys = [y(xa, za1), y(xb, zb1), y(xb, zb0), y(xa, za0)]
      const t = Math.max(...ys) > flatY + 0.05 ? sloped : flat
      t.quad(new Vector3(xa, ys[0], za1), new Vector3(xb, ys[1], zb1), new Vector3(xb, ys[2], zb0), new Vector3(xa, ys[3], za0), [xa, za1], [xb, zb1], [xb, zb0], [xa, za0])
    }
  }
  flat.mesh(c.roof, parent, 'roof_flat')
  sloped.mesh(c.silver, parent, 'roof_shell')
}

/* ---------- the drum ---------- */

/**
 * The drum over the south block: its first floor set back behind the band, then two floors bulging
 * out over a lit soffit, silver bands at the floors, and the roof whose blade sweeps down south.
 */
function buildDrum(ctx: HotelCtx, parent: Object3D) {
  const { c, k } = ctx
  const { x, z, r, rIn, y0, mid, top, roof } = DRUM
  const glass = new Tris()
  const bands = new Tris()
  const wall = new Tris()
  const ceil = new Tris()
  const floor = new Tris()
  const g = new Group()
  g.name = 'drum'
  parent.add(g)
  // Arcs run from −z through −x, +z and +x: out is to the right of travel.
  const inner = path(arc(x, z, rIn, -PI, PI, 0.3), 1)
  const outer = path(arc(x, z, r, -PI, PI, 0.3), 1)
  const soffitY = mid - 0.45
  band(glass, inner, 0, y0, soffitY)
  fins(k, g, inner, 0.06, y0, soffitY, 1.5, 0.06, 0.14, c.fin, false)
  band(wall, inner, -2.2, y0, soffitY - 0.3, false, y0)
  strip(ceil, inner, -2.2, 0, soffitY - 0.02, false)
  strip(floor, inner, -2.2, 0, y0 + 0.01, true)
  // The bulge's soffit, lit at its edge.
  const sof = new Tris()
  for (const q of [inner]) strip(sof, q, 0, r - rIn + 0.12, soffitY, false)
  sof.mesh(c.soffitSilver, g, 'drum_soffit', false)
  const led = new Tris()
  rail(led, outer, 0.02, 0.1, soffitY - 0.04, soffitY + 0.02, false)
  led.mesh(c.led, g, 'drum_led', false)
  // Two floors of glass, banded at the floors and at mid-height.
  band(glass, outer, 0, soffitY, top)
  fins(k, g, outer, 0.07, soffitY, top, 1.5, 0.07, 0.16, c.fin, false)
  const fl = DRUM.floor
  for (const y of [soffitY, mid + fl])
    rail(bands, outer, -0.05, 0.12, y - (y === soffitY ? 0 : 0.6), y + 0.35, false)
  for (const y of [mid + fl / 2, mid + fl * 1.5]) rail(bands, outer, 0.0, 0.06, y, y + 0.05, false)
  for (const [a, b] of [[mid, mid + fl], [mid + fl, top]]) {
    band(wall, outer, -2.4, a, b - 0.45, false, a)
    strip(ceil, outer, -2.4, 0, b - 0.47, false)
    strip(floor, outer, -2.4, 0, a + 0.36, true)
  }
  // Roof slab and its silver edge.
  rail(bands, outer, -0.05, 0.2, top - 0.05, roof + 0.25, false)
  const lid = new Tris()
  strip(lid, outer, -r + 0.01, 0.2, roof + 0.15, true)
  lid.mesh(c.roof, g, 'drum_roof', false)
  glass.mesh(c.glass, g, 'drum_glass', false)
  bands.mesh(c.silver, g, 'drum_bands')
  wall.mesh(c.floorWall, g, 'drum_rooms', false)
  ceil.mesh(c.slotCeiling, g, 'drum_ceilings', false)
  floor.mesh(c.lobbyFloor, g, 'drum_floors', false)
  buildBlade(ctx, g)
}

/**
 * The blade: the drum's roof carried out to the south and swept down, thinning to a rounded,
 * slightly upturned nose, like the leading edge of a wing.
 */
function buildBlade(ctx: HotelCtx, parent: Object3D) {
  const { x, z, r, roof } = DRUM
  const centre = -1.5
  const half = 0.62
  const reach = 3.4
  const drop = 3.6
  const NA = 28
  const NT = 14
  const top: Vector3[][] = []
  const bot: Vector3[][] = []
  for (let i = 0; i <= NA; i++) {
    const a = centre - half + (2 * half * i) / NA
    const u = (a - centre) / half
    const e = reach * Math.pow(Math.max(0, Math.cos((u * PI) / 2)), 1.3)
    const rowT: Vector3[] = []
    const rowB: Vector3[] = []
    for (let j = 0; j <= NT; j++) {
      const t = j / NT
      const rr = r - 0.6 + (e + 0.6) * t
      // Down as it goes out, the nose lifting a little at the very end.
      const yTop = roof + 0.3 - drop * t * t * (e / reach) + 0.55 * Math.pow(t, 8) * (e / reach)
      const th = (1.15 - 0.75 * t) * Math.sqrt(Math.max(0, 1 - Math.pow(t, 12))) + 0.05
      const px = x + Math.sin(a) * rr
      const pz = z + Math.cos(a) * rr
      rowT.push(new Vector3(px, yTop, pz))
      rowB.push(new Vector3(px, yTop - th, pz))
    }
    top.push(rowT)
    bot.push(rowB)
  }
  const t = new Tris()
  for (let i = 0; i < NA; i++)
    for (let j = 0; j < NT; j++) {
      const uv = (ii: number, jj: number) => [ii * 0.4, jj * 0.4]
      const [a, b, cc, d] = [top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1]]
      const n = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(d, a))
      if (n.y >= 0) t.quad(a, b, cc, d, uv(i, j), uv(i + 1, j), uv(i + 1, j + 1), uv(i, j + 1))
      else t.quad(a, d, cc, b, uv(i, j), uv(i, j + 1), uv(i + 1, j + 1), uv(i + 1, j))
      const [e, f, g, hh] = [bot[i][j], bot[i + 1][j], bot[i + 1][j + 1], bot[i][j + 1]]
      const m = new Vector3().subVectors(f, e).cross(new Vector3().subVectors(hh, e))
      if (m.y <= 0) t.quad(e, f, g, hh, uv(i, j), uv(i + 1, j), uv(i + 1, j + 1), uv(i, j + 1))
      else t.quad(e, hh, g, f, uv(i, j), uv(i, j + 1), uv(i + 1, j + 1), uv(i + 1, j))
    }
  // The nose: top to bottom round the outer edge.
  for (let i = 0; i < NA; i++) {
    const [a, b, cc, d] = [top[i][NT], top[i + 1][NT], bot[i + 1][NT], bot[i][NT]]
    const want = new Vector3(Math.sin(centre), 0, Math.cos(centre))
    const n = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(d, a))
    if (n.dot(want) >= 0) t.quad(a, b, cc, d, [i * 0.4, 0], [(i + 1) * 0.4, 0], [(i + 1) * 0.4, 1], [i * 0.4, 1])
    else t.quad(a, d, cc, b, [i * 0.4, 0], [i * 0.4, 1], [(i + 1) * 0.4, 1], [(i + 1) * 0.4, 0])
  }
  t.mesh(ctx.c.silver, parent, 'drum_blade')
}

/* ---------- the canopy ---------- */

/** The canopy's plan: its bowed front, its ends falling back to the facade, its back along the glass. */
function canopyOutline(inset = 0): Point2[] {
  const n = 80
  const front: Point2[] = []
  const back: Point2[] = []
  for (let i = 0; i <= n; i++) {
    const x = CANOPY.x0 + ((CANOPY.x1 - CANOPY.x0) * i) / n
    const f = frontZ(x)
    front.push([x, Math.max(f + 0.05, canopyFrontZ(x) - inset)])
    back.push([x, f - 0.02])
  }
  return [...front, ...back.reverse()]
}

/**
 * The canopy over the drop-off: a thick silver blade edged along its top in warm LED light, over a
 * set-back lower fascia with its own LED line, a soffit lit by a grid of linear lights, on three
 * brushed stainless columns.
 */
function buildCanopy(ctx: HotelCtx, parent: Object3D) {
  const { c, k, lighting } = ctx
  const g = new Group()
  g.name = 'canopy'
  parent.add(g)
  const upper = canopyOutline(0)
  const lower = canopyOutline(0.6)
  slab(g, upper, CANOPY.top - 1.05, CANOPY.top, [c.silver, c.silver], [], true, 'canopy_blade')
  slab(g, lower, CANOPY.soffit, CANOPY.top - 1.05, [c.soffitSilver, c.soffitSilver], [], true, 'canopy_fascia')
  // LED lines: along the blade's top front edge and the fascia's foot.
  const n = 80
  const edge = (inset: number): PP[] => {
    const pts: Point2[] = []
    for (let i = 0; i <= n; i++) {
      const x = CANOPY.x0 + 0.25 + ((CANOPY.x1 - CANOPY.x0 - 0.5) * i) / n
      pts.push([x, canopyFrontZ(x) - inset])
    }
    return path(pts, 1)
  }
  const led = new Tris()
  rail(led, edge(0), -0.02, 0.012, CANOPY.top - 0.16, CANOPY.top - 0.04, false)
  rail(led, edge(0.6), -0.02, 0.012, CANOPY.soffit + 0.02, CANOPY.soffit + 0.1, false)
  // The soffit's grid of linear lights, 1.5 m apart each way, inside the fascia.
  const inside = (x: number, z: number) => within([x, z], lower) && z < canopyFrontZ(x) - 1.0 && z > frontZ(x) + 0.5
  for (let zz = 33.6; zz < CANOPY.reach; zz += 1.5) {
    let start: number | null = null
    for (let x = CANOPY.x0; x <= CANOPY.x1 + 0.1; x += 0.1) {
      const ok = inside(x, zz)
      if (ok && start === null) start = x
      if ((!ok || x > CANOPY.x1) && start !== null) {
        if (x - start > 0.8) k.box(g, x - start, 0.04, 0.06, c.led, (x + start) / 2, CANOPY.soffit - 0.02, zz, false)
        start = null
      }
    }
  }
  for (let xx = CANOPY.x0 + 1; xx < CANOPY.x1; xx += 2.0) {
    const z0 = frontZ(xx) + 0.6
    const z1 = canopyFrontZ(xx) - 1.0
    if (z1 - z0 > 0.8) k.box(g, 0.06, 0.04, z1 - z0, c.led, xx, CANOPY.soffit - 0.02, (z0 + z1) / 2, false)
  }
  led.mesh(c.led, g, 'canopy_led', false)
  for (const x of COLUMNS_X) {
    const z = canopyFrontZ(x) - 1.8
    k.cyl(g, 0.42, 0.42, CANOPY.soffit - GL, c.stainless, x, (CANOPY.soffit + GL) / 2, z, 40)
    k.cyl(g, 0.5, 0.5, 0.06, c.stainless, x, GL + 0.03, z, 40)
    k.cyl(g, 0.5, 0.5, 0.1, c.stainless, x, CANOPY.soffit - 0.05, z, 40)
    ctx.shade.pool(x, GL + 0.005, z, 0.85, 0.85, 0.5)
  }
  for (const x of [-6, 0.5]) {
    const l = lighting.light(new PointLight('#ffd7a3', 9, 13, 2), 0)
    l.position.set(x, CANOPY.soffit - 0.6, canopyFrontZ(x) - 3)
    g.add(l)
  }
  ctx.shade.edge(upper.slice(0, n + 1), GL + 0.006, 3.0, -1, 0.12)
}

/* ---------- the lobby ---------- */

/** The lobby wall's painting is 24 m wide; a wall shows the stretch from `from` (0..1), at true scale. */
function paintedPlane(mat: Material, w: number, h: number, from: number, wide = 24) {
  const geo = new PlaneGeometry(w, h)
  const uv = geo.getAttribute('uv') as BufferAttribute
  for (let i = 0; i < uv.count; i++) uv.setX(i, from + (uv.getX(i) * w) / wide)
  return new Mesh(geo, mat)
}

/**
 * The double-height lobby behind the canopy: the storefront with its sliding doors, a stone floor,
 * a lit ceiling, the stone lift wall at the back (open where the lifts and stair down to the
 * basements stand, in the property view), the reception against the south wall, lounge seating, a
 * ring chandelier.
 */
function buildLobby(ctx: HotelCtx, parent: Object3D) {
  const { c, k, lighting } = ctx
  const g = new Group()
  g.name = 'lobby'
  parent.add(g)
  const { x0, x1, z1 } = LOBBY
  const W = 25.0
  const top = LV[2] - SLAB
  // The floor, open over the stair well and lift shafts once the basements are built.
  const wells = ctx.openings?.wells.map(rectPoly) ?? []
  slab(g, rect(x0, x1, 19.4, z1), GL - 0.1, GL + 0.012, [c.lobbyFloor, c.concrete], wells, false, 'lobby_floor')
  ctx.openings?.wells.forEach((w, i) => slab(g, rectPoly(w), GL - 0.1, GL + 0.012, [c.lobbyFloor, c.concrete], [], false, `void_lobby_well_${i}`))
  sheet(g, rect(x0, x1, W, z1), top, c.slotCeiling, true)
  // The back wall, its face on the lobby, open where the lifts and the stair door stand.
  const doors = (ctx.openings?.doors ?? []).slice().sort((a, b) => a.x - b.x)
  const H = 2.43
  const face = (a: number, b: number, y0: number, y1: number, name = '') => {
    const m = k.box(g, b - a, y1 - y0, 0.3, c.granite, (a + b) / 2, (y0 + y1) / 2, W - 0.15)
    if (name) m.name = name
    const p = paintedPlane(c.lobbyWall, b - a, y1 - y0, 0.02 + (a - x0) / 24)
    const uv = p.geometry.getAttribute('uv') as BufferAttribute
    for (let i = 0; i < uv.count; i++) uv.setY(i, (y0 - GL + uv.getY(i) * (y1 - y0)) / (top - GL))
    p.position.set((a + b) / 2, (y0 + y1) / 2, W + 0.006)
    if (!name) g.add(p)
  }
  let at = x0
  for (const d of doors) {
    const [a, b] = [d.x - d.w / 2, d.x + d.w / 2]
    face(at, a, GL, top)
    face(a, b, GL + H, top)
    face(a, b, GL, GL + H, `void_lobby_door_${d.x.toFixed(1)}`)
    at = b
  }
  face(at, x1, GL, top)
  if (!doors.length) {
    // On the master plan: the lift doors in brushed stainless, shut.
    for (const dx of [-2.6, 2.6]) {
      k.box(g, 1.5, 2.55, 0.04, c.chromeRail, dx, GL + 1.275, W + 0.03)
      k.box(g, 0.01, 2.3, 0.045, c.void, dx, GL + 1.15, W + 0.05, false)
    }
  }
  // The south wall with the reception's onyx, the north wall in stone.
  const south = paintedPlane(c.lobbyWall, z1 - W, top - GL, 0.33)
  south.position.set(x0 + 0.01, (GL + top) / 2, (W + z1) / 2)
  south.rotation.y = PI / 2
  g.add(south)
  const north = paintedPlane(c.lobbyWall, z1 - W, top - GL, 0.7)
  north.position.set(x1 - 0.01, (GL + top) / 2, (W + z1) / 2)
  north.rotation.y = -PI / 2
  g.add(north)
  // The reception desk before the onyx: dark timber, a stone top, a lit plinth.
  const dz = (W + z1) / 2
  k.box(g, 0.75, 1.05, 4.2, c.darkTimber, x0 + 1.6, GL + 0.525, dz)
  k.box(g, 0.85, 0.05, 4.3, c.poolCoping, x0 + 1.6, GL + 1.075, dz)
  k.box(g, 0.02, 0.04, 4.1, c.led, x0 + 1.99, GL + 0.08, dz, false)
  // Lounge seating on a rug, and the ring chandelier over it.
  const cx = 0.6
  const cz = 29.0
  k.box(g, 4.2, 0.01, 3.2, c.greigeMetric, cx, GL + 0.017, cz, false)
  for (const s of [-1, 1]) {
    k.box(g, 2.4, 0.42, 0.9, c.cushion, cx, GL + 0.21, cz + s * 1.15)
    k.box(g, 2.4, 0.4, 0.2, c.cushion, cx, GL + 0.62, cz + s * 1.5)
  }
  k.cyl(g, 0.55, 0.55, 0.4, c.bronze, cx, GL + 0.2, cz, 32)
  const ring = new Mesh(new TorusGeometry(1.7, 0.06, 10, 72), c.led)
  ring.rotation.x = PI / 2
  ring.position.set(cx, top - 2.2, cz)
  g.add(ring)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2
    k.cyl(g, 0.006, 0.006, 2.2, c.bronze, cx + Math.cos(a) * 1.7, top - 1.1, cz + Math.sin(a) * 1.7, 4).castShadow = false
  }
  const l = lighting.light(new PointLight('#ffe2bb', 14, 16, 2), 0.2)
  l.position.set(cx, 5.2, 29.5)
  g.add(l)
  buildStorefront(ctx, g)
}

/**
 * The lobby's front: floor-to-ceiling glass in stainless frames on a 1.5 m module, a transom at the
 * door head, and the automatic sliding doors on the axis (which slide apart for a walker in the
 * property view; on the master plan they stand open).
 */
function buildStorefront(ctx: HotelCtx, g: Group) {
  const { c, k } = ctx
  const z = MAIN.front
  const { x0, x1 } = LOBBY
  const top = LV[2] - 0.7
  const head = 3.2
  const door = { a: -1.45, b: 1.45 }
  const glass = new Tris()
  const pane = (a: number, b: number, y0: number, y1: number) =>
    glass.quad(new Vector3(a, y0, z), new Vector3(b, y0, z), new Vector3(b, y1, z), new Vector3(a, y1, z), [a, y0], [b, y0], [b, y1], [a, y1])
  pane(x0, door.a, GL, top)
  pane(door.b, x1, GL, top)
  pane(door.a, door.b, head, top)
  glass.mesh(c.glass, g, 'lobby_glass', false)
  for (const x of [x0, (x0 + door.a) / 2, (door.b + x1) / 2, x1]) k.box(g, 0.1, top - GL, 0.22, c.stainless, x, (GL + top) / 2, z)
  for (const x of [door.a, door.b]) k.box(g, 0.12, top - GL, 0.24, c.stainless, x, (GL + top) / 2, z)
  k.box(g, x1 - x0, 0.14, 0.24, c.stainless, (x0 + x1) / 2, head, z)
  k.box(g, x1 - x0, 0.2, 0.26, c.stainless, (x0 + x1) / 2, top, z)
  k.box(g, x1 - x0, 0.06, 0.24, c.stainless, (x0 + x1) / 2, GL + 0.03, z)
  // The operator's housing and the two leaves.
  k.box(g, door.b - door.a, 0.22, 0.3, c.stainless, 0, head - 0.18, z - 0.2)
  const leafW = (door.b - door.a) / 2
  for (const s of [-1, 1]) {
    const p = ctx.openings ? new Group() : g
    if (p !== g) {
      p.name = `autoleaf_hotel_${s}`
      p.userData.slide = [s * (leafW - 0.08), 0, 0]
      g.add(p)
    }
    const lx = s * (leafW / 2 + (ctx.openings ? 0 : leafW - 0.1))
    k.box(p, leafW - 0.02, head - GL - 0.3, 0.012, c.glass, lx, (head - 0.3 + GL) / 2, z - 0.08, false)
    for (const e of [-1, 1]) k.box(p, 0.045, head - GL - 0.3, 0.05, c.stainless, lx + (e * (leafW - 0.04)) / 2, (head - 0.3 + GL) / 2, z - 0.08)
    k.box(p, leafW, 0.045, 0.05, c.stainless, lx, head - 0.3, z - 0.08)
  }
  k.box(g, door.b - door.a, 0.008, 2.0, c.plantDark, 0, GL + 0.004, z + 1.0, false)
}

/* ---------- the podium ---------- */

export function buildPodium(ctx: HotelCtx, parent: Object3D) {
  const g = new Group()
  g.name = 'podium'
  parent.add(g)
  buildCurtain(ctx, g)
  buildSwoosh(ctx, g)
  buildRoof(ctx, g)
  buildDrum(ctx, g)
  buildCanopy(ctx, g)
  buildLobby(ctx, g)
}
