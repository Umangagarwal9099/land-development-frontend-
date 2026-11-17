import { ExtrudeGeometry, Mesh, Shape, Vector2, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import { parkedCar } from '../car'
import { hedge, lawn, shrub, SPECIES, tree } from '../kalakalMall/foliage'
import { rect, slab } from '../kalakalMall/solids'
import type { ClubCtx } from './building'
import { A, B, C, D, DRIVE, ISLAND, northZ, PATH, PLOT, PLOT_X, YARD, YARD_Y, Z_SOUTH } from './plan'
import { cypress, JACARANDA, tropical } from './plants'

/*
 * The grounds. The forecourt before the entrance is laid in grey circle-and-fan pavers from the
 * road to a kerbed island, and in square blue-grey pavers on the drive round the building. The
 * island carries a footpath in warm grey stone with a bull-nosed
 * kerb, and behind it a long charcoal planter with a clipped hedge, broad tropical leaves rising
 * behind the hedge's middle and a tall cypress at each end. A drive runs up the west side where
 * cars stand; a red-paved garden path runs up the east side through the lawns; the courtyard is
 * white pebble beds with shrubs either side of a sandstone path from the bar to the verandah.
 */

/** A level slab with softly rounded top edges (a bull-nosed kerb). */
function roundedSlab(p: Object3D, poly: Point2[], y0: number, y1: number, mats: Material[]) {
  const b = 0.035
  const shape = new Shape(poly.map(([x, z]) => new Vector2(x, -z)))
  const g = new ExtrudeGeometry(shape, { depth: y1 - y0 - b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 3, curveSegments: 6 })
  g.rotateX(-Math.PI / 2)
  g.translate(0, y0, 0)
  const m = new Mesh(g, mats)
  m.castShadow = true
  m.receiveShadow = true
  p.add(m)
  return m
}

/** A stadium: a rectangle with half-round ends, |x| ≤ hx, z0..z1. */
function stadium(hx: number, z0: number, z1: number, n = 14): Point2[] {
  const r = (z1 - z0) / 2
  const zc = (z0 + z1) / 2
  const pts: Point2[] = []
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / n
    pts.push([hx - r + r * Math.cos(a), zc + r * Math.sin(a)])
  }
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 + (Math.PI * i) / n
    pts.push([-hx + r + r * Math.cos(a), zc + r * Math.sin(a)])
  }
  return pts
}

const PAVE = 0.15

export function buildSite(ctx: ClubCtx, p: Object3D) {
  const { c, k, plant, shade } = ctx
  const x0 = PLOT_X.x0 + 0.3

  /* Ground: lawn over the plot, the forecourt and drive paved, the east path in red. */
  slab(p, PLOT, 0, 0.1, [c.lawnGround, c.concrete], [], false)
  // Circle-and-fan pavers from the road to the island; square pavers on the drive round the building.
  const split = ISLAND.planter.z0
  slab(p, [[x0, Z_SOUTH], [PATH.x0, Z_SOUTH], [PATH.x0, split], [x0, split]], 0, PAVE, [c.fan, c.concrete], [], false)
  slab(p, [[x0, split], [PATH.x0, split], [PATH.x0, A.z1], [DRIVE.x1, A.z1], [DRIVE.x1, -20], [x0, -20]], 0, PAVE, [c.squarePavers, c.concrete], [], false)
  slab(p, [[PATH.x0, Z_SOUTH], [PATH.x1, Z_SOUTH], [PATH.x1, northZ(PATH.x1) + 3], [PATH.x0, northZ(PATH.x0) + 3]], 0, 0.12, [c.redPath, c.concrete], [], false)
  // Kerbs where the paving meets the lawn.
  const kerbZ = (x: number, z0: number, z1: number) => k.box(p, 0.12, 0.2, z1 - z0, c.kerb(z1 - z0), x, 0.1, (z0 + z1) / 2)
  const kerbX = (x0: number, x1: number, z: number) => k.box(p, x1 - x0, 0.2, 0.12, c.kerb(x1 - x0), (x0 + x1) / 2, 0.1, z)
  kerbZ(DRIVE.x1 + 0.06, -20, A.z1)
  kerbX(x0, DRIVE.x1, -20.06)
  kerbZ(PATH.x0 - 0.06, A.z1, Z_SOUTH)
  kerbX(DRIVE.x1, A.x0, A.z1 + 0.06)
  kerbX(A.x1, PATH.x0, A.z1 + 0.06)
  for (const x of [PATH.x0, PATH.x1]) shade.edge([[x, A.z1], [x, Z_SOUTH]], 0.121, 0.12, x === PATH.x0 ? 1 : -1, 0.3)

  buildIsland(ctx, p)
  buildCourtyard(ctx, p)

  /* Two cars drawn up nose-in either side of the portal, as in the elevation. */
  for (const [x, paint, body] of [[-7.7, '#a51f24', 'sedan'], [-10.4, '#b3262a', 'crossover'], [7.7, '#5f6368', 'sedan'], [10.4, '#26282c', 'sedan']] as const) {
    parkedCar(p, body, paint, x, 9.6, Math.PI, PAVE)
    shade.rect(x, PAVE + 0.004, 9.6, 1.9, 4.5, 0, 0.75)
  }

  /* The west drive: two cars drawn up beside the building, as in the aerial. */
  const mid = (DRIVE.x0 + DRIVE.x1) / 2
  for (const [z, paint, body] of [[1.5, '#8e1b1d', 'sedan'], [-7.5, '#e9eaea', 'crossover']] as const) {
    parkedCar(p, body, paint, mid + 0.6, z, Math.PI, PAVE)
    shade.rect(mid + 0.6, PAVE + 0.004, z, 1.9, 4.5, 0, 0.75)
  }

  /* Trees round the building: broad shade trees east and north, a cypress and a jacaranda west. */
  const trees: [typeof SPECIES.neem, number, number, number, number][] = [
    [SPECIES.rain, 20.4, -9.5, 2101, 0.62],
    [SPECIES.neem, 21.2, -22, 2102, 0.7],
    [SPECIES.neem, 21.4, 2.5, 2103, 0.6],
    [SPECIES.rain, 10, northZ(10) + 3.4, 2104, 0.62],
    [SPECIES.neem, -1, northZ(-1) + 3.2, 2105, 0.7],
    [SPECIES.neem, -13, northZ(-13) + 3.5, 2106, 0.65],
    [JACARANDA, -18.8, -25, 2107, 0.8],
    [SPECIES.rain, 21.2, 14.5, 2108, 0.6],
    [SPECIES.neem, 16.8, -15.2, 2109, 0.55],
    [SPECIES.rain, 20.8, -31, 2111, 0.55],
    [SPECIES.neem, -20.6, -30.5, 2112, 0.6],
  ]
  for (const [sp, x, z, seed, s] of trees) tree(plant, sp, x, 0.1, z, seed, s)
  cypress(plant, -19.2, 0.1, -12.5, 7.2, 3.4, 2110)
  // The jacaranda on the forecourt, in a grate, its flowering crown over the view of the entrance.
  const [jx, jz] = [-12.5, Z_SOUTH - 2.4]
  tree(plant, JACARANDA, jx, PAVE, jz, 2120, 0.95)
  k.box(p, 1.4, 0.012, 1.4, c.soil, jx, PAVE + 0.006, jz, false)
  for (const [ax, az] of [[-0.7, 0], [0.7, 0], [0, -0.7], [0, 0.7]] as const) k.box(p, ax ? 0.06 : 1.46, 0.03, az ? 0.06 : 1.46, c.galvanised, jx + ax, PAVE + 0.015, jz + az)

  // Shrubs along the building's foot on the lawn sides.
  let seed = 2200
  for (let z = D.z0 + 1; z < D.z1; z += 2.2) shrub(plant, D.x1 + 1.1, 0.1, z, 0.55, 0.9, seed++)
  for (let x = C.x0 + 1.5; x < C.x1; x += 2.6) shrub(plant, x, 0.1, C.z0 - 1.0, 0.55, 0.9, seed++)
  for (let z = B.z0 + 1; z < B.z1 - 0.5; z += 2.4) shrub(plant, B.x0 - 1.0, 0.1, z, 0.5, 0.85, seed++)
  // Blades of grass on the lawns nearest the forecourt; further off the painted lawn reads alone.
  lawn(plant, PATH.x1 + 0.1, PLOT_X.x1 - 0.3, -6, Z_SOUTH - 0.3, 0.1, 2300, 120)
  lawn(plant, A.x1 + 0.4, PATH.x0 - 0.2, -6, A.z0 - 0.3, 0.1, 2301, 120)
  for (const f of plant.footprints) shade.pool(f.x, f.y + 0.006, f.z, f.r, f.r, f.strength)
}

/* ---------- the island before the entrance ---------- */

function buildIsland(ctx: ClubCtx, p: Object3D) {
  const { c, k, plant, shade } = ctx
  const I = ISLAND
  // The footpath on its bull-nosed kerb.
  roundedSlab(p, stadium(I.x, I.z0, I.z1), 0, PAVE + I.kerbH, [c.footpath, c.islandKerb])
  shade.edge(stadium(I.x, I.z0, I.z1), PAVE + 0.004, 0.22, 1, 0.45, true)
  // The planter: charcoal walls, its soil a little below the rim.
  const pl = I.planter
  const top = PAVE + pl.h
  const t = 0.1
  k.box(p, 2 * pl.x, pl.h, t, c.planter, 0, PAVE + pl.h / 2, pl.z1 - t / 2)
  k.box(p, 2 * pl.x, pl.h, t, c.planter, 0, PAVE + pl.h / 2, pl.z0 + t / 2)
  for (const s of [-1, 1]) k.box(p, t, pl.h, pl.z1 - pl.z0 - 2 * t, c.planter, s * (pl.x - t / 2), PAVE + pl.h / 2, (pl.z0 + pl.z1) / 2)
  k.box(p, 2 * pl.x - 2 * t, pl.h - 0.06, pl.z1 - pl.z0 - 2 * t, c.soil, 0, PAVE + (pl.h - 0.06) / 2, (pl.z0 + pl.z1) / 2, false)
  shade.edge([[-pl.x, pl.z0], [pl.x, pl.z0], [pl.x, pl.z1], [-pl.x, pl.z1]], PAVE + 0.004, 0.3, -1, 0.5, true)
  const soil = top - 0.06
  // The clipped hedge along its front, the cypresses at its ends, tropical leaves behind the middle.
  hedge(plant, -I.hedge, I.hedge, soil, pl.z1 - 0.5, 1.05, 0.78, 2401)
  for (const s of [-1, 1]) cypress(plant, s * I.trees, soil, (pl.z0 + pl.z1) / 2, 8.3, 5.3, 2410 + s, 1.25, 0.72)
  let seed = 2420
  for (let x = -4.6; x <= 4.65; x += 1.15) tropical(plant, x + ((seed * 0.37) % 0.2), soil, pl.z0 + 0.42, 2.2, seed++)
  for (let x = -7.2; x <= 7.2; x += 1.1) if (Math.abs(x) > 5.0) shrub(plant, x, soil, pl.z0 + 0.38, 0.35, 0.95, seed++)
}

/* ---------- the courtyard ---------- */

function buildCourtyard(ctx: ClubCtx, p: Object3D) {
  const { c, k, plant, shade } = ctx
  const { x0, x1, z0, z1 } = YARD
  // Planted beds of lawn and groundcover, edged along the glass by white pebble margins.
  slab(p, rect(x0, x1, z0, z1), 0, YARD_Y - 0.02, [c.lawnGround, c.concrete], [], false)
  const m = 0.6
  for (const [a, b, cc, d] of [[x0, x0 + m, z0, z1], [x1 - m, x1, z0, z1], [x0 + m, x1 - m, z1 - m, z1], [x0 + m, x1 - m, z0, z0 + m]] as const)
    slab(p, rect(a, b, cc, d), 0, YARD_Y, [c.pebbles, c.concrete], [], false)
  lawn(plant, x0 + m, -1, z0 + m, z1 - m, YARD_Y - 0.02, 2560, 140)
  lawn(plant, 1, x1 - m, z0 + m, z1 - m, YARD_Y - 0.02, 2561, 140)
  // The sandstone path from the bar's doors to the verandah, kerbed in granite.
  const pw = 0.95
  slab(p, rect(-pw, pw, z0, z1), 0, YARD_Y + 0.03, [c.flags, c.granite], [], false)
  shade.edge([[-pw, z0], [-pw, z1]], YARD_Y + 0.004, 0.15, 1, 0.3)
  shade.edge([[pw, z0], [pw, z1]], YARD_Y + 0.004, 0.15, -1, 0.3)
  // Clumps of shrubs and tropicals in the pebble beds, and two small trees.
  let seed = 2500
  const beds: [number, number, 's' | 't'][] = [
    [-2.1, -3.6, 's'], [-2.2, -6.4, 't'], [-1.9, -10.5, 's'], [-2.2, -14.2, 't'], [-1.8, -16.2, 's'],
    [2.4, -3.4, 't'], [4.4, -4.6, 's'], [5.4, -7.8, 's'], [2.6, -9.6, 't'], [4.6, -12.6, 's'], [2.4, -15.8, 's'], [5.3, -16.1, 't'],
  ]
  for (const [x, z, kind] of beds) {
    if (kind === 's') shrub(plant, x, YARD_Y, z, 0.55, 0.85, seed++)
    else tropical(plant, x, YARD_Y, z, 1.5, seed++)
  }
  tree(plant, SPECIES.neem, 4.3, YARD_Y, -8.6, 2550, 0.36)
  tree(plant, SPECIES.neem, -1.9, YARD_Y, -12.5, 2551, 0.33)
  // Stepping stones across the beds to B's and D's doors.
  for (let x = -2.6; x < -1; x += 0.7) k.box(p, 0.5, 0.03, 0.8, c.flags, x, YARD_Y + 0.015, -8.3, false)
  for (let x = 1.4; x < D.x0 - 0.3; x += 0.7) k.box(p, 0.5, 0.03, 0.8, c.flags, x, YARD_Y + 0.015, -7.1, false)
  // Shade under the verandah and at the foot of the glass.
  shade.edge([[x0, C.z1], [x1, C.z1]], YARD_Y + 0.004, 0.5, -1, 0.35)
}

/* ---------- surroundings ---------- */

/** The plot and what is shown round it: the entrance road in front, open ground either side and behind. */
export const SITE = { minX: PLOT_X.x0 - 9, maxX: PLOT_X.x1 + 9, minZ: northZ(PLOT_X.x1) - 9, maxZ: Z_SOUTH + 16 }

/** The road in front and the open ground round the plot, for the property's own view. */
export function buildContext(ctx: ClubCtx, p: Object3D) {
  const { c, k } = ctx
  const zf = Z_SOUTH
  slab(p, rect(SITE.minX, SITE.maxX, zf, zf + 2.2), 0, PAVE, [c.interlock, c.concrete], [], false)
  slab(p, rect(SITE.minX, SITE.maxX, zf + 2.2, SITE.maxZ), 0, 0.02, [c.asphalt, c.concrete], [], false)
  k.box(p, SITE.maxX - SITE.minX, PAVE + 0.03, 0.15, c.kerb(SITE.maxX - SITE.minX), (SITE.minX + SITE.maxX) / 2, (PAVE + 0.03) / 2, zf + 2.2)
  for (let x = SITE.minX + 1; x < SITE.maxX - 3; x += 9) k.box(p, 3, 0.004, 0.12, c.lane, x + 1.5, 0.022, zf + 9.5, false)
  // Lawns either side and behind, beyond the plot's kerb.
  const nz = northZ(PLOT_X.x1)
  slab(p, rect(SITE.minX, PLOT_X.x0, nz - 9, zf), 0, 0.06, [c.lawnGround, c.concrete], [], false)
  slab(p, rect(PLOT_X.x1, SITE.maxX, nz - 9, zf), 0, 0.06, [c.lawnGround, c.concrete], [], false)
  slab(p, [[PLOT_X.x0, northZ(PLOT_X.x0)], [PLOT_X.x1, nz], [PLOT_X.x1, nz - 9], [PLOT_X.x0, nz - 9]], 0, 0.06, [c.lawnGround, c.concrete], [], false)
  // The plot's boundary: a precast edging kerb on the three garden sides.
  const edge = (a: Point2, b: Point2) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const m = k.box(p, 0.15, 0.22, len, c.kerb(len), (a[0] + b[0]) / 2, 0.11, (a[1] + b[1]) / 2)
    m.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1])
  }
  edge(PLOT[1], PLOT[2])
  edge(PLOT[2], PLOT[3])
  edge(PLOT[3], PLOT[0])
}
