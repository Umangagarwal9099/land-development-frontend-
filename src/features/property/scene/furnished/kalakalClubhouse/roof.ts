import { CylinderGeometry, ShapeUtils, Vector2, Vector3, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import { Tris } from '../kalakalMall/skin'
import type { ClubCtx } from './building'
import { A, B, C, D, GABLE_OUT, P, PROW, valleyX, type Gable } from './plan'

/*
 * The roofs. Every slope is a 300 mm slab laid from a plan polygon on its gable's plane: clay tiles
 * on top, white soffit beneath, and white fascia on each open edge (eaves, gable rakes and the flush
 * ends where a pavilion meets the bar). Where the entrance gable crosses the bar's wings their
 * planes meet along straight valleys from the bar's ridge to the eave corners; each slope is cut to
 * its side of the valley, so the tiles meet without overlap. Half-round ridge tiles cap every ridge,
 * and a white bargeboard lip stands just proud of the tiles along every rake.
 */

class RoofMesh {
  tiles = new Tris()
  under = new Tris()
  edge = new Tris()
}

const yAt = (g: Gable, x: number, z: number) => g.ridge - g.t * Math.abs(g.axis === 'x' ? z - g.at : x - g.at)
const SLOPE_UV = (g: Gable) => Math.hypot(1, g.t)

/** A triangle turned to face `want`. */
function tri(t: Tris, a: Vector3, b: Vector3, c: Vector3, ua: number[], ub: number[], uc: number[], want: Vector3) {
  const n = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a))
  if (n.dot(want) >= 0) t.tri(a, b, c, ua, ub, uc)
  else t.tri(a, c, b, ua, uc, ub)
}

/**
 * One slope: `poly` in plan, on gable `g`. `open[i]` says whether edge i → i+1 is an outside edge
 * (fascia) rather than a ridge, valley or a seam with the next piece.
 */
function piece(m: RoofMesh, g: Gable, input: Point2[], openIn: boolean[]) {
  // Coincident corners (a valley starting exactly at a ridge) are merged, each edge keeping its flag.
  const poly: Point2[] = []
  const open: boolean[] = []
  const same = (a: Point2, b: Point2) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6
  input.forEach((q, i) => {
    if (poly.length && same(poly[poly.length - 1], q)) {
      open[open.length - 1] = openIn[i]
      return
    }
    poly.push(q)
    open.push(openIn[i])
  })
  if (poly.length > 1 && same(poly[poly.length - 1], poly[0])) {
    poly.pop()
    open.pop()
  }
  if (poly.length < 3) return
  const top = poly.map(([x, z]) => new Vector3(x, yAt(g, x, z), z))
  const bot = top.map((v) => v.clone().setY(v.y - g.thick))
  const k = SLOPE_UV(g)
  // Tiles: u along the ridge, v up the slope, both in metres.
  const uv = ([x, z]: Point2) => [g.axis === 'x' ? x : z, (yAt(g, x, z) / g.t) * k]
  const plan = ([x, z]: Point2) => [x, z]
  const idx = ShapeUtils.triangulateShape(poly.map(([x, z]) => new Vector2(x, z)), [])
  const up = new Vector3(0, 1, 0)
  const down = new Vector3(0, -1, 0)
  for (const [a, b, c] of idx) {
    tri(m.tiles, top[a], top[b], top[c], uv(poly[a]), uv(poly[b]), uv(poly[c]), up)
    tri(m.under, bot[a], bot[b], bot[c], plan(poly[a]), plan(poly[b]), plan(poly[c]), down)
  }
  // Fascia on the open edges, facing out of the polygon.
  let area = 0
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i]
    const [x1, z1] = poly[(i + 1) % poly.length]
    area += x0 * z1 - x1 * z0
  }
  const sign = area > 0 ? 1 : -1
  for (let i = 0; i < poly.length; i++) {
    if (!open[i]) continue
    const j = (i + 1) % poly.length
    const [x0, z0] = poly[i]
    const [x1, z1] = poly[j]
    const len = Math.hypot(x1 - x0, z1 - z0)
    const out = new Vector3((z1 - z0) * sign, 0, -(x1 - x0) * sign).normalize()
    const ua = [0, top[i].y]
    const ub = [len, top[j].y]
    tri(m.edge, top[i], top[j], bot[j], ua, ub, [len, bot[j].y], out)
    tri(m.edge, top[i], bot[j], bot[i], ua, [len, bot[j].y], [0, bot[i].y], out)
    // A rake (not level): a bargeboard lip 120 mm wide standing 40 mm above the tiles.
    if (Math.abs(top[i].y - top[j].y) > 0.05) {
      const inward = out.clone().negate().multiplyScalar(0.12)
      const lift = new Vector3(0, 0.04, 0)
      const a0 = top[i].clone().add(lift)
      const b0 = top[j].clone().add(lift)
      const a1 = a0.clone().add(inward)
      const b1 = b0.clone().add(inward)
      tri(m.edge, a0, b0, b1, [0, 0], [len, 0], [len, 0.12], up)
      tri(m.edge, a0, b1, a1, [0, 0], [len, 0.12], [0, 0.12], up)
      const a2 = a1.clone().sub(lift)
      const b2 = b1.clone().sub(lift)
      tri(m.edge, a1, b1, b2, [0, 0.04], [len, 0.04], [len, 0], inward)
      tri(m.edge, a1, b2, a2, [0, 0.04], [len, 0], [0, 0], inward)
      tri(m.edge, top[i], top[j], b0, [0, 0], [len, 0], [len, 0.04], out)
      tri(m.edge, top[i], b0, a0, [0, 0], [len, 0.04], [0, 0.04], out)
    }
  }
}

/** Half-round ridge tiles from a to b along a ridge at height y. */
function ridgeCap(ctx: ClubCtx, p: Object3D, axis: 'x' | 'z', at: number, from0: number, to0: number, y: number) {
  // Stopped just short of the bargeboards, which close the ridge's ends.
  const from = from0 + 0.1
  const to = to0 - 0.1
  const len = to - from
  const geo = new CylinderGeometry(0.13, 0.13, len, 14, 1, false, 0, Math.PI)
  // The half-round turned to arch over the ridge, its axis along it.
  if (axis === 'x') geo.rotateZ(Math.PI / 2)
  else geo.rotateX(Math.PI / 2).rotateZ(Math.PI / 2)
  const mid = (from + to) / 2
  const m = axis === 'x' ? ctx.k.mesh(geo, ctx.c.ridgeTile, p, mid, y - 0.04, at) : ctx.k.mesh(geo, ctx.c.ridgeTile, p, at, y - 0.04, mid)
  // Collars at the joints of the ridge tiles, every 400 mm.
  for (let s = from + 0.4; s < to - 0.1; s += 0.4) {
    const c = new CylinderGeometry(0.142, 0.142, 0.05, 14, 1, false, 0, Math.PI)
    if (axis === 'x') c.rotateZ(Math.PI / 2)
    else c.rotateX(Math.PI / 2).rotateZ(Math.PI / 2)
    if (axis === 'x') ctx.k.mesh(c, ctx.c.ridgeTile, p, s, y - 0.04, at, false)
    else ctx.k.mesh(c, ctx.c.ridgeTile, p, at, y - 0.04, s, false)
  }
  return m
}

export function buildRoofs(ctx: ClubCtx, p: Object3D) {
  const m = new RoofMesh()
  const ZA = A.roof.at
  const FX = A.fx
  const eS = ZA + (P.fw)
  const eN = ZA - P.fw
  const vR = valleyX(0)
  const vE = valleyX(P.fw)
  const T = true
  const F = false

  // The bar: south slopes either side of the entrance gable, cut along the valleys; at each end the
  // gable leans out to its apex (FR), the prow.
  const FR = FX + PROW
  piece(m, A.roof, [[-FR, ZA], [-vR, ZA], [-vE, eS], [-FX, eS]], [F, F, T, T])
  piece(m, A.roof, [[vR, ZA], [FR, ZA], [FX, eS], [vE, eS]], [F, T, T, F])
  // The north slope runs unbroken from end to end: the entrance gable stops at the bar's ridge.
  piece(m, A.roof, [[-FX, eN], [FX, eN], [FR, ZA], [-FR, ZA]], [T, T, F, T])
  const bx0 = B.roof.at - B.eave
  const bx1 = B.roof.at + B.eave
  const dx0 = D.roof.at - D.eave
  const dx1 = D.roof.at + D.eave

  // The entrance gable, from a hipped back end that slopes down onto the bar's ridge (nothing
  // stands above it), to the portal's front, which leans out to its apex like the wings' ends.
  // Behind the ridge the bar's back slope is unbroken. The hip, at the gable's own pitch, starts
  // where its ridge is that pitch's rise above the bar's ridge.
  const front = P.ffront
  const apexF = front + PROW
  const zh = ZA + vR
  piece(m, P.roof, [[0, zh], [-vR, ZA], [-vE, eS], [-P.fw, front], [0, apexF]], [F, F, T, T, F])
  piece(m, P.roof, [[0, zh], [0, apexF], [P.fw, front], [vE, eS], [vR, ZA]], [F, T, T, F, F])
  if (vR > 0.01) piece(m, { axis: 'x', at: zh, ridge: P.roof.ridge, t: P.roof.t, thick: P.roof.thick }, [[0, zh], [vR, ZA], [-vR, ZA]], [F, F, F])

  // The pavilions, free-standing, an overhanging gable at each end.
  const pavilion = (g: Gable, x0: number, x1: number, z0: number, z1: number) => {
    piece(m, g, [[x0, z0], [g.at, z0], [g.at, z1], [x0, z1]], [T, F, T, T])
    piece(m, g, [[g.at, z0], [x1, z0], [x1, z1], [g.at, z1]], [T, T, T, F])
  }
  pavilion(B.roof, bx0, bx1, B.z0 - GABLE_OUT, B.z1 + GABLE_OUT)
  pavilion(D.roof, dx0, dx1, D.z0 - GABLE_OUT, D.z1 + GABLE_OUT)
  // The north block, ridge east–west.
  const cz0 = C.roof.at - C.eave
  const cz1 = C.roof.at + C.eave
  const cx0 = C.x0 - GABLE_OUT
  const cx1 = C.x1 + GABLE_OUT
  piece(m, C.roof, [[cx0, cz0], [cx1, cz0], [cx1, C.roof.at], [cx0, C.roof.at]], [T, T, F, T])
  piece(m, C.roof, [[cx0, C.roof.at], [cx1, C.roof.at], [cx1, cz1], [cx0, cz1]], [F, T, T, T])

  m.tiles.mesh(ctx.c.tiles, p, 'roof_tiles')
  m.under.mesh(ctx.c.soffit, p, 'roof_soffit', false)
  m.edge.mesh(ctx.c.fascia, p, 'roof_fascia')

  ridgeCap(ctx, p, 'x', ZA, -FR, FR, A.roof.ridge)
  ridgeCap(ctx, p, 'z', 0, zh, apexF, P.roof.ridge)
  ridgeCap(ctx, p, 'z', B.roof.at, B.z0 - GABLE_OUT, B.z1 + GABLE_OUT, B.roof.ridge)
  ridgeCap(ctx, p, 'z', D.roof.at, D.z0 - GABLE_OUT, D.z1 + GABLE_OUT, D.roof.ridge)
  ridgeCap(ctx, p, 'x', C.roof.at, cx0, cx1, C.roof.ridge)
}
