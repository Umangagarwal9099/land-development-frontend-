import { AdditiveBlending, ExtrudeGeometry, Group, Matrix4, Mesh, MeshBasicMaterial, PlaneGeometry, PointLight, Shape, Vector2, Vector3, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import type { Paint } from '../textures'
import type { Contact } from '../kalakalMall/contact'
import type { Planting } from '../kalakalMall/foliage'
import { rect, sheet, slab } from '../kalakalMall/solids'
import type { ClubMaterials } from './materials'
import { A, B, C, CEIL, D, FFL, P, plate } from './plan'
import { buildRoofs } from './roof'

/*
 * The clubhouse's walls, glass, floors and ceilings under the roofs of roof.ts.
 *
 * Outside walls are laterite block, cut to meet the underside of the roof slab above them, so the
 * gable ends rise in laterite to the white rakes. The bar's wings are glazed full height front and
 * back between slim black mullions; B and D are glazed to the courtyard, and C behind its
 * verandah of teak posts. The portal is the reference's: a laterite gable wall on two piers,
 * pierced by a segmental arch, with box sconces on the piers and one high on the gable; through the
 * arch, the white soffit of the gable and the lobby's glass wall with its double doors.
 */

export interface ClubCtx {
  k: Kit
  c: ClubMaterials
  lighting: Lighting
  plant: Planting
  shade: Contact
}

type UY = [number, number]

/**
 * A wall from plan point a to b, its outline drawn in (u along a → b, y) and extruded `thick`
 * away from the outside: the side `inside` lies on.
 */
function wall(ctx: ClubCtx, p: Object3D, a: Point2, b: Point2, outline: UY[], thick: number, inside: Point2, mat: Material = ctx.c.laterite) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const len = Math.hypot(dx, dz)
  const X = new Vector3(dx / len, 0, dz / len)
  const Y = new Vector3(0, 1, 0)
  const Z = new Vector3().crossVectors(X, Y)
  const toIn = (inside[0] - a[0]) * Z.x + (inside[1] - a[1]) * Z.z
  const shape = new Shape(outline.map(([u, y]) => new Vector2(u, y)))
  const geo = new ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 1 })
  const m = new Matrix4().makeBasis(X, Y, Z)
  // Extruded towards +Z: start at the wall line if inside is that way, else a thickness back.
  const start = toIn >= 0 ? 0 : -thick
  m.setPosition(a[0] + Z.x * start, 0, a[1] + Z.z * start)
  geo.applyMatrix4(m)
  const mesh = new Mesh(geo, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  p.add(mesh)
  return mesh
}

/** A gable wall's outline over u ∈ [0, len] from y0 to the roof's underside `top(u)`, with its apex at uApex. */
const gableOutline = (len: number, y0: number, top: (u: number) => number, uApex?: number): UY[] => {
  const pts: UY[] = [[0, y0], [len, y0], [len, top(len)]]
  if (uApex !== undefined && uApex > 0 && uApex < len) pts.push([uApex, top(uApex)])
  pts.push([0, top(0)])
  return pts
}

/* ---------- glazing ---------- */

interface GlazeOpts {
  /** Mullion spacing aimed for; the run is divided evenly. */
  module?: number
  /** Double doors centred at u, `w` wide overall. */
  doors?: { u: number; w: number }[]
}

/** A run of full-height glass from a to b, y0 to y1: black frame head, sill and mullions, double doors. */
function glazing(ctx: ClubCtx, p: Object3D, a: Point2, b: Point2, y0: number, y1: number, opts: GlazeOpts = {}) {
  const { k, c } = ctx
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const g = new Group()
  g.position.set(a[0], 0, a[1])
  g.rotation.y = Math.atan2(-(b[1] - a[1]), b[0] - a[0])
  p.add(g)
  const h = y1 - y0
  k.box(g, len, h - 0.1, 0.024, c.glass, len / 2, y0 + h / 2, 0, false).renderOrder = 3
  k.box(g, len, 0.09, 0.14, c.frame, len / 2, y1 - 0.045, 0)
  k.box(g, len, 0.06, 0.14, c.frame, len / 2, y0 + 0.03, 0)
  const doors = opts.doors ?? []
  const inDoor = (u: number) => doors.some((d) => Math.abs(u - d.u) < d.w / 2 + 0.05)
  const n = Math.max(1, Math.round(len / (opts.module ?? 1.7)))
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * len
    if (inDoor(u)) continue
    k.box(g, i === 0 || i === n ? 0.08 : 0.055, h, 0.13, c.frame, Math.min(len - 0.04, Math.max(0.04, u)), y0 + h / 2, 0)
  }
  for (const d of doors) {
    const head = y0 + 2.7
    // Door frame, transom and the two leaves' stiles and rails, with long steel pulls.
    for (const s of [-1, 1]) k.box(g, 0.08, h, 0.15, c.frame, d.u + (s * d.w) / 2, y0 + h / 2, 0)
    k.box(g, d.w, 0.08, 0.15, c.frame, d.u, head, 0)
    k.box(g, 0.05, head - y0, 0.13, c.frame, d.u, y0 + (head - y0) / 2, 0)
    for (const s of [-1, 1]) {
      const cx = d.u + (s * d.w) / 4
      k.box(g, d.w / 2 - 0.06, 0.1, 0.06, c.frame, cx, y0 + 0.05, 0)
      for (const side of [-1, 1]) k.cyl(g, 0.016, 0.016, 1.3, c.chromeRail, d.u + s * 0.12, y0 + 1.15, side * 0.07, 10)
    }
  }
  return g
}

/* ---------- lights ---------- */

/** Warm light washed on a wall round a sconce, after dark. */
const wash: Paint = (g, w, h) => {
  const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  grad.addColorStop(0, 'rgba(255,255,255,.75)')
  grad.addColorStop(0.3, 'rgba(255,255,255,.28)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
}

/** A box lantern on a wall facing +z at (x, y, z): bronze caps and corner posts round frosted glass. */
function sconce(ctx: ClubCtx, p: Object3D, x: number, y: number, z: number, glowMat: MeshBasicMaterial) {
  const { k, c } = ctx
  const g = new Group()
  g.position.set(x, y, z)
  p.add(g)
  k.box(g, 0.17, 0.4, 0.02, c.bronze, 0, 0, 0.01)
  k.box(g, 0.22, 0.035, 0.17, c.bronze, 0, 0.165, 0.095)
  k.box(g, 0.22, 0.035, 0.17, c.bronze, 0, -0.165, 0.095)
  k.box(g, 0.19, 0.29, 0.14, c.sconceGlass, 0, 0, 0.095, false)
  for (const sx of [-1, 1]) for (const sz of [0.025, 0.165]) k.box(g, 0.014, 0.3, 0.014, c.bronze, sx * 0.095, 0, sz)
  const m = new Mesh(new PlaneGeometry(2.6, 3.2), glowMat)
  m.position.set(0, 0, 0.02)
  m.renderOrder = 2
  m.raycast = () => {}
  g.add(m)
}

/* ---------- the building ---------- */

/** Underside of the bar's roof at the gable walls, at z. */
const barTop = (z: number) => plate(A.roof, Math.abs(z - A.roof.at))
/** Underside of the entrance gable at x. */
const gableTop = (x: number) => plate(P.roof, Math.abs(x))

export interface Building {
  setDaylight(day: boolean): void
}

export function buildBuilding(ctx: ClubCtx, p: Object3D): Building {
  const { k, c, shade } = ctx
  const T = 0.3
  const ceil = CEIL.wings

  /* Floors: the plinth in honed granite, stone inside, granite under the portal. */
  const floor = (x0: number, x1: number, z0: number, z1: number, top: Material = c.interiorFloor) => slab(p, rect(x0, x1, z0, z1), 0, FFL, [top, c.granite], [], false)
  floor(A.x0, A.x1, A.z0, A.z1)
  floor(B.x0, B.x1, B.z0, B.z1)
  floor(D.x0, D.x1, D.z0, D.z1)
  floor(C.x0, C.x1, C.z0, C.z1)

  /* A: the bar's gable ends, the portal, and the glass. */
  // The wings' ends, as the side views show: solid laterite, no openings on the east and west
  // faces. From the front corner back to the ridge line it rises to the rake; behind, it stops at
  // the ceiling, under a white infill that reads with the prow's deep soffit above.
  const ZA = A.roof.at
  for (const x of [A.x0, A.x1]) {
    wall(ctx, p, [x, ZA], [x, A.z1], [[0, 0], [A.z1 - ZA, 0], [A.z1 - ZA, barTop(A.z1)], [0, barTop(ZA)]], T, [0, ZA])
    wall(ctx, p, [x, A.z0], [x, ZA], [[0, 0], [ZA - A.z0, 0], [ZA - A.z0, ceil], [0, ceil]], T, [0, ZA])
    wall(ctx, p, [x, A.z0], [x, ZA], [[0, ceil], [ZA - A.z0, ceil], [ZA - A.z0, barTop(ZA)], [0, barTop(A.z0)]], 0.12, [0, ZA], c.soffit)
  }
  // The portal's front: laterite on two piers round the segmental arch.
  const { half, spring, crown } = P.arch
  const rise = crown - spring
  const R = (half * half + rise * rise) / (2 * rise)
  const cy = crown - R
  const arc: UY[] = []
  const a0 = Math.asin(half / R)
  for (let i = 0; i <= 24; i++) {
    const t = -a0 + (2 * a0 * i) / 24
    arc.push([P.hw + R * Math.sin(t), cy + R * Math.cos(t)])
  }
  const portal: UY[] = [[0, 0], [P.hw - half, 0], ...arc, [P.hw + half, 0], [2 * P.hw, 0], [2 * P.hw, gableTop(P.hw)], [P.hw, gableTop(0)], [0, gableTop(P.hw)]]
  wall(ctx, p, [-P.hw, P.front], [P.hw, P.front], portal, 0.4, [0, A.z1])
  // Open at the sides, a drive-through for dropping off: the front piers run back 0.9 m, and a
  // laterite post stands at each back corner, as in the aerial. Behind, the lobby's glass under a laterite gable.
  const pierW = P.hw - P.arch.half
  for (const s of [-1, 1]) {
    k.box(p, pierW, gableTop(P.hw), 0.5, c.laterite, s * (P.hw - pierW / 2), gableTop(P.hw) / 2, P.front - 0.65)
    k.box(p, 0.9, gableTop(P.hw), 0.9, c.laterite, s * (P.hw - 0.45), gableTop(P.hw) / 2, A.z1 + 0.45)
    shade.rect(s * (P.hw - pierW / 2), 0.155, P.front - 0.45, pierW + 0.3, 1.2, 0, 0.5)
    shade.rect(s * (P.hw - 0.45), 0.155, A.z1 + 0.45, 1.2, 1.2, 0, 0.5)
  }
  wall(ctx, p, [-P.hw, A.z1], [P.hw, A.z1], [[0, ceil], [2 * P.hw, ceil], [2 * P.hw, gableTop(P.hw)], [P.hw, gableTop(0)], [0, gableTop(P.hw)]], T, [0, 0], c.lateriteShade)
  glazing(ctx, p, [-P.hw + 0.35, A.z1], [P.hw - 0.35, A.z1], FFL, ceil, { module: 1.6, doors: [{ u: P.hw - 0.35, w: 2.4 }] })
  // The wings, front and back, glass from the plinth to the soffit.
  glazing(ctx, p, [A.x0 + T, A.z1], [-P.hw, A.z1], FFL, ceil)
  glazing(ctx, p, [P.hw, A.z1], [A.x1 - T, A.z1], FFL, ceil)
  // The back, glazed its full length, with the doors out to the courtyard on the entrance's axis.
  glazing(ctx, p, [A.x0 + T, A.z0], [A.x1 - T, A.z0], FFL, ceil, { doors: [{ u: -A.x0 - T, w: 2.4 }] })
  // The entrance gable's north end over the courtyard glass, under its overhang.
  wall(ctx, p, [-P.hw, A.z0], [P.hw, A.z0], [[0, ceil], [2 * P.hw, ceil], [2 * P.hw, gableTop(P.hw)], [P.hw, gableTop(0)], [0, gableTop(P.hw)]], T, [0, 0])
  const bTop = (x: number) => plate(B.roof, Math.abs(x - B.roof.at))
  const dTop = (x: number) => plate(D.roof, Math.abs(x - D.roof.at))
  // The pavilions' south gable ends, facing the bar across the lawn.
  wall(ctx, p, [B.x0, B.z1], [B.x1, B.z1], gableOutline(B.x1 - B.x0, 0, (u) => bTop(B.x0 + u), B.roof.at - B.x0), T, [B.roof.at, B.z1 - 5])
  wall(ctx, p, [D.x0, D.z1], [D.x1, D.z1], gableOutline(D.x1 - D.x0, 0, (u) => dTop(D.x0 + u), D.roof.at - D.x0), T, [D.roof.at, D.z1 - 5])

  /* B: laterite outside, glass to the courtyard. */
  wall(ctx, p, [B.x0, B.z0], [B.x0, B.z1], [[0, 0], [B.z1 - B.z0, 0], [B.z1 - B.z0, CEIL.b], [0, CEIL.b]], T, [B.roof.at, -8])
  wall(ctx, p, [B.x0, B.z0], [B.x1, B.z0], gableOutline(B.x1 - B.x0, 0, (u) => bTop(B.x0 + u), B.roof.at - B.x0), T, [B.roof.at, -8])
  glazing(ctx, p, [B.x1, B.z0 + T], [B.x1, B.z1 - T], FFL, CEIL.b, { module: 1.8, doors: [{ u: -8.3 - B.z0 - T, w: 2.4 }] })

  /* D: likewise, mirrored. */
  wall(ctx, p, [D.x1, D.z0], [D.x1, D.z1], [[0, 0], [D.z1 - D.z0, 0], [D.z1 - D.z0, CEIL.d], [0, CEIL.d]], T, [D.roof.at, -8])
  wall(ctx, p, [D.x0, D.z0], [D.x1, D.z0], gableOutline(D.x1 - D.x0, 0, (u) => dTop(D.x0 + u), D.roof.at - D.x0), T, [D.roof.at, -8])
  glazing(ctx, p, [D.x0, D.z0 + T], [D.x0, D.z1 - T], FFL, CEIL.d, { doors: [{ u: -7.1 - D.z0 - T, w: 2.4 }] })

  /* C: the north block, its verandah of teak posts facing the courtyard. */
  const cTop = (z: number) => plate(C.roof, Math.abs(z - C.roof.at))
  wall(ctx, p, [C.x0, C.z0], [C.x1, C.z0], [[0, 0], [C.x1 - C.x0, 0], [C.x1 - C.x0, CEIL.c], [0, CEIL.c]], T, [5, -22])
  for (const x of [C.x0, C.x1]) wall(ctx, p, [x, C.z0], [x, C.z1], gableOutline(C.z1 - C.z0, 0, (u) => cTop(C.z0 + u), C.roof.at - C.z0), T, [5, -22])
  glazing(ctx, p, [C.x0 + T, C.glass], [C.x1 - T, C.glass], FFL, CEIL.c, { module: 1.8, doors: [{ u: 4.5 - T, w: 2.4 }, { u: 15.5, w: 2.4 }] })
  const bays = 8
  for (let i = 1; i < bays; i++) {
    const x = C.x0 + ((C.x1 - C.x0) * i) / bays
    k.box(p, 0.25, CEIL.c - FFL, 0.25, c.teak, x, (FFL + CEIL.c) / 2, C.z1 - 0.2)
    k.box(p, 0.42, 0.06, 0.42, c.granite, x, FFL + 0.03, C.z1 - 0.2)
    shade.pool(x, FFL + 0.003, C.z1 - 0.2, 0.3, 0.3, 0.45)
  }
  k.box(p, C.x1 - C.x0 - 2 * T, 0.38, 0.3, c.teak, (C.x0 + C.x1) / 2, CEIL.c - 0.19, C.z1 - 0.2)
  sheet(p, rect(C.x0 + T, C.x1 - T, C.glass, C.z1), CEIL.c - 0.01, c.teak, true)

  /* Inside, the outer walls are plastered white. */
  const lining = (x0: number, x1: number, z0: number, z1: number, top: number) => k.box(p, Math.max(0.01, x1 - x0), top - FFL, Math.max(0.01, z1 - z0), c.plaster, (x0 + x1) / 2, (FFL + top) / 2, (z0 + z1) / 2, false)
  const L = T + 0.006
  for (const s of [-1, 1]) lining(s * (A.x1 - L), s * (A.x1 - L), A.z0, A.z1, ceil)
  lining(B.x0 + L, B.x0 + L, B.z0, B.z1, CEIL.b)
  lining(B.x0, B.x1, B.z1 - L, B.z1 - L, CEIL.b)
  lining(B.x0, B.x1, B.z0 + L, B.z0 + L, CEIL.b)
  lining(D.x1 - L, D.x1 - L, D.z0, D.z1, CEIL.d)
  lining(D.x0, D.x1, D.z1 - L, D.z1 - L, CEIL.d)
  lining(D.x0, D.x1, D.z0 + L, D.z0 + L, CEIL.d)
  lining(C.x0, C.x1, C.z0 + L, C.z0 + L, CEIL.c)
  for (const x of [C.x0 + L, C.x1 - L]) lining(x, x, C.z0, C.glass, CEIL.c)

  /* Ceilings inside, white with downlights, lit softly after dark. */
  const ceiling = (x0: number, x1: number, z0: number, z1: number, y: number) => {
    sheet(p, rect(x0, x1, z0, z1), y, c.ceilingWhite, true)
    for (let x = x0 + 1.4; x < x1 - 0.8; x += 2.4) for (let z = z0 + 1.4; z < z1 - 0.8; z += 2.4) k.cyl(p, 0.075, 0.075, 0.02, c.downlight, x, y - 0.01, z, 14).castShadow = false
  }
  ceiling(A.x0, A.x1, A.z0, A.z1, ceil)
  ceiling(B.x0, B.x1, B.z0, B.z1, CEIL.b)
  ceiling(D.x0, D.x1, D.z0, D.z1, CEIL.d)
  ceiling(C.x0, C.x1, C.z0, C.glass, CEIL.c)

  buildRoofs(ctx, p)

  /* Sconces: one on each pier and one high on the gable, as in the reference. */
  const glowMat = new MeshBasicMaterial({ color: '#ffbf7a', map: k.tex.painted(128, 128, wash), transparent: true, opacity: 0.55, depthWrite: false, blending: AdditiveBlending })
  const pier = (P.hw + P.arch.half) / 2
  for (const s of [-1, 1]) sconce(ctx, p, s * pier, 3.95, P.front + 0.001, glowMat)
  sconce(ctx, p, 0, 6.05, P.front + 0.001, glowMat)
  for (const [x, y, z] of [[0, 3.2, P.front + 1.2], [0, 3.6, A.z1 + 2.5]] as const) {
    const l = ctx.lighting.light(new PointLight('#ffcf96', 6, 11, 2), 0)
    l.position.set(x, y, z)
    p.add(l)
  }

  // Shade where the building meets the ground.
  const box = (x0: number, x1: number, z0: number, z1: number): Point2[] => [[x0, z0], [x0, z1], [x1, z1], [x1, z0]]
  for (const f of [box(A.x0, A.x1, A.z0, A.z1), box(B.x0, B.x1, B.z0, B.z1), box(D.x0, D.x1, D.z0, D.z1)]) shade.edge(f, 0.155, 0.45, 1, 0.4, true)
  shade.edge([[C.x0, C.z1], [C.x0, C.z0], [C.x1, C.z0], [C.x1, C.z1]], 0.155, 0.45, -1, 0.4)

  return {
    setDaylight(day) {
      glowMat.visible = !day
    },
  }
}
