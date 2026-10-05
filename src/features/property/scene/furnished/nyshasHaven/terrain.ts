import { CylinderGeometry, DoubleSide, ExtrudeGeometry, Mesh, MeshStandardMaterial, PlaneGeometry, Shape, ShapeGeometry, TorusGeometry, type Material } from 'three'
import { PI, type Kit } from '../kit'
import { levelKit, paintedMat } from '../shared'
import { palmFrond } from './paints'
import {
  BASE, BOULDER_DECK, PEBBLE_T, ROAD, SERVICE, KIDS_POOL, LAKE_BED, SPA, LAKE_WATER, LAWN, PLOT, POOL, POOL_T, SHORE, SOUTH_SIDE, SUNKEN, UPPER, WALL_X, WATER_LEVEL, WEIR,
  type Ctx, type Rect,
} from './layout'

/**
 * A ground block from `bottom` up to `top` over `rect`, with rectangular holes left open (pools,
 * pits). The rectangle is cut into a grid along every hole edge and the filled cells are merged
 * row by row, so each terrace is a handful of boxes.
 */
export function solid(k: Kit, [x0, x1, z0, z1]: Rect, top: number, bottom: number, topMat: (w: number, d: number) => Material, side: Material, holes: Rect[] = []) {
  const xs = [...new Set([x0, x1, ...holes.flatMap(([a, b]) => [a, b]).filter((v) => v > x0 && v < x1)])].sort((a, b) => a - b)
  const zs = [...new Set([z0, z1, ...holes.flatMap(([, , a, b]) => [a, b]).filter((v) => v > z0 && v < z1)])].sort((a, b) => a - b)
  const open = (x: number, z: number) => holes.some(([a, b, c, d]) => x > a && x < b && z > c && z < d)
  const box = (a: number, b: number, c: number, d: number) =>
    k.box(k.root, b - a, top - bottom, d - c, [side, side, topMat(b - a, d - c), side, side, side], (a + b) / 2, (top + bottom) / 2, (c + d) / 2, false)
  for (let j = 0; j < zs.length - 1; j++) {
    let run: number | null = null
    for (let i = 0; i <= xs.length - 1; i++) {
      const filled = i < xs.length - 1 && !open((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2)
      if (filled && run === null) run = i
      if (!filled && run !== null) {
        box(xs[run], xs[i], zs[j], zs[j + 1])
        run = null
      }
    }
  }
}

/** A tiled pit: floor and four lined walls, from `floor` up to `rim`. */
function pit(ctx: Ctx, [x0, x1, z0, z1]: Rect, floor: number, rim: number, lining: (w: number, h: number) => Material, floorMat?: Material) {
  const { k, h } = ctx
  const w = x1 - x0
  const d = z1 - z0
  k.box(k.root, w, floor - BASE, d, [h.earth, h.earth, floorMat ?? lining(w, d), h.earth, h.earth, h.earth], (x0 + x1) / 2, (floor + BASE) / 2, (z0 + z1) / 2, false)
  const t = 0.04
  const ht = rim - floor
  k.box(k.root, t, ht, d, lining(d, ht), x0 + t / 2, floor + ht / 2, (z0 + z1) / 2, false)
  k.box(k.root, t, ht, d, lining(d, ht), x1 - t / 2, floor + ht / 2, (z0 + z1) / 2, false)
  k.box(k.root, w, ht, t, lining(w, ht), (x0 + x1) / 2, floor + ht / 2, z0 + t / 2, false)
  k.box(k.root, w, ht, t, lining(w, ht), (x0 + x1) / 2, floor + ht / 2, z1 - t / 2, false)
}

const waterSurface = (ctx: Ctx, [x0, x1, z0, z1]: Rect, y: number) =>
  ctx.k.box(ctx.k.root, x1 - x0, 0.02, z1 - z0, ctx.h.water, (x0 + x1) / 2, y - 0.01, (z0 + z1) / 2, false)

/**
 * The fan of steps from the pool terrace down to the lawn, as photographed: it starts at the corner
 * by the thatched hall's east end and fans out north-east across the lawn, the pebble garden
 * cutting into its upper side.
 */
const FAN = { x: WALL_X, z: 11.6, inner: 0.7, outer: 7.0, n: 10, span: 1.25 }

export function buildTerrain(ctx: Ctx) {
  const { k, h } = ctx
  const river = h.river(1, 1)
  const M = 40

  // Ground levels, as in the aerial photograph: the house, arcade and gate raised to the west; the
  // pool terrace in front of the house; the lawn, deck, court and service corner lower, to the east
  // and south; then the shore and the lake. Retaining walls in river stone where levels change.
  solid(k, [-M, 3, -M, M], UPPER, BASE, h.grass, river)
  const poolDeck: Rect = [3, WALL_X, -12, 10.4]
  // The terrace's front wall below the pool, clad in light grey split-stone tiles as photographed.
  const infinityWall = h.poolWall(14, 2)
  solid(k, [3, WALL_X, -M, SOUTH_SIDE], POOL_T, BASE, h.grass, infinityWall, [poolDeck])
  solid(k, poolDeck, POOL_T, BASE, h.deckStone, infinityWall, [POOL, KIDS_POOL, SUNKEN, WEIR])
  solid(k, [WALL_X, PLOT.x1, -M, SOUTH_SIDE], LAWN, BASE, h.grass, river)
  solid(k, [3, PLOT.x1, SOUTH_SIDE, M], LAWN, BASE, h.grass, river)
  // The dining strip, raised to the pool terrace level, its crackle-finish paving retained above
  // the lawn by a stone wall grown over with creepers.
  solid(k, BOULDER_DECK, POOL_T, LAWN - 0.01, h.crazy, river)
  solid(k, [PLOT.x1, ROAD[1], -M, M], LAWN - 0.2, BASE, h.grass, river)
  solid(k, [ROAD[1], 56.5, -M, M], SHORE, BASE, () => h.sand, h.earth)
  solid(k, [56.5, 82, -M, M], LAKE_BED, BASE, () => h.lakeBed, h.earth)
  k.box(k.root, 25.5, 0.02, 2 * M, h.lake, 69.25, LAKE_WATER, 0, false)

  // The pool in green Sukabumi stone with a pale grey stone coping; the children's pool beside it
  // behind a broad coping strip, and the sunken seating set down to water level.
  const P = POOL_T
  pit(ctx, POOL, P - 1.4, P, h.sukabumi)
  pit(ctx, KIDS_POOL, P - 0.5, P, h.sukabumi)
  pit(ctx, SUNKEN, P - 0.8, P, h.brick, h.deckStone(SUNKEN[1] - SUNKEN[0], SUNKEN[3] - SUNKEN[2]))
  const [wx0, wx1, wz0, wz1] = WEIR
  // The pool's front wall: grey stone tiles outside, a pale stone coping on top.
  const weirTop = h.paleStone
  k.box(k.root, wx1 - wx0, P - 0.08 - BASE, wz1 - wz0, [infinityWall, weirTop, weirTop, weirTop, infinityWall, infinityWall], (wx0 + wx1) / 2, (P - 0.08 + BASE) / 2, (wz0 + wz1) / 2, false)
  // Pale grey stone coping round both pools, and the broad coping strip between them.
  const coping = ([a, b, c, d]: Rect) => {
    const t = 0.34
    for (const ze of [c - t / 2, d + t / 2]) k.box(k.root, b - a + 2 * t, 0.06, t, h.paleStone, (a + b) / 2, P + 0.03, ze, false)
    for (const xe of [a - t / 2, b + t / 2]) k.box(k.root, t, 0.06, d - c, h.paleStone, xe, P + 0.03, (c + d) / 2, false)
  }
  coping(POOL)
  coping(KIDS_POOL)
  waterSurface(ctx, POOL, WATER_LEVEL)
  waterSurface(ctx, KIDS_POOL, WATER_LEVEL)
  // Underwater lights along the long walls.
  for (let x = POOL[0] + 1.5; x < POOL[1] - 1; x += 2.2)
    for (const [z, dir] of [[POOL[2] + 0.05, 1], [POOL[3] - 0.05, -1]] as const) {
      const d = k.cyl(k.root, 0.12, 0.12, 0.02, h.poolLight, x, P - 0.7, z + dir * 0.01, 16)
      d.rotation.x = PI / 2
    }
  // The brick-edged sunken lounge: a built-in seat with cushions at water level, and a planter.
  const [sx0, sx1, sz0, sz1] = SUNKEN
  k.box(k.root, sx1 - sx0 - 0.2, 0.45, 0.5, h.brick(4, 0.45), (sx0 + sx1) / 2, P - 0.8 + 0.225, sz1 - 0.35)
  k.soft(k.root, sx1 - sx0 - 0.3, 0.12, 0.45, 0.04, k.m.outdoor, (sx0 + sx1) / 2, P - 0.3, sz1 - 0.35)
  k.cyl(k.root, 0.35, 0.28, 0.5, k.m.basalt, (sx0 + sx1) / 2, P - 0.55, (sz0 + sz1) / 2 - 0.3, 20)
  k.blob(k.root, 0.4, k.m.leaf, (sx0 + sx1) / 2, P - 0.1, (sz0 + sz1) / 2 - 0.3, 0.7)
  // As photographed, a raised round spa sits on the pool's north-east corner, jutting out past the
  // stone wall: its drum clad in the same grey tiles, water brimming to a raised pale coping ring.
  const spa = k.at(SPA.x, SPA.z, 0, 0)
  const spaTop = P + 0.3
  k.mesh(new CylinderGeometry(SPA.r, SPA.r, spaTop - LAWN, 48), [h.poolWall(2 * PI * SPA.r, 2), h.sukabumi(3, 3), h.sukabumi(3, 3)], spa, 0, (spaTop + LAWN) / 2 - 0.06, 0, false)
  k.mesh(new CylinderGeometry(SPA.r - 0.15, SPA.r - 0.15, 0.02, 48), h.water, spa, 0, spaTop - 0.05, 0, false)
  const spaRim = k.mesh(new TorusGeometry(SPA.r - 0.08, 0.13, 8, 48), h.paleStone, spa, 0, spaTop, 0)
  spaRim.rotation.x = PI / 2
  spaRim.scale.z = 0.6

  buildPaths(ctx)
  buildBoundaries(ctx)
  buildShore(ctx)
  buildPlanting(ctx)
}

function buildPaths(ctx: Ctx) {
  const { k, h } = ctx
  const slab = (r: Rect, y: number, mat: (w: number, d: number) => Material, t = 0.05) =>
    k.box(k.root, r[1] - r[0], t, r[3] - r[2], mat(r[1] - r[0], r[3] - r[2]), (r[0] + r[1]) / 2, y + t / 2, (r[2] + r[3]) / 2, false)

  // The wide paved walk along the north side, in pale grey stone slabs: from the arched gate past
  // the house, across a round pebble-mosaic medallion, down broad curved steps beside the pool, then
  // winding east the length of the lawn between planted beds.
  slab([PLOT.x0, 3, -21.5, -16], UPPER, h.deckStone)
  slab([-20.6, -18.6, -16, 12.6], UPPER, h.paving)
  slab([3, WALL_X, -22, -12], POOL_T, h.flagstone)
  const medallion = k.at(11.2, -16.4, 0, POOL_T + 0.05)
  k.cyl(medallion, 2.5, 2.5, 0.03, h.baseStone, 0, 0, 0, 48)
  k.cyl(medallion, 2.2, 2.2, 0.04, h.pebbles(4.4, 4.4), 0, 0.01, 0, 48)
  k.cyl(medallion, 0.9, 0.9, 0.05, h.baseStone, 0, 0.01, 0, 32)
  // Concentric rings of dark stone set into the mosaic.
  for (const rr of [1.3, 1.75]) k.mesh(new TorusGeometry(rr, 0.05, 4, 48), h.baseStone, medallion, 0, 0.03, 0, false).rotation.x = PI / 2
  const centre = (x: number) => -16.4 + 2.2 * Math.sin(((x - WALL_X) / (PLOT.x1 - WALL_X)) * PI * 1.4)
  const half = (x: number) => 3.2 + 0.9 * Math.cos(x * 0.21) + Math.max(0, 22 - x) * 0.4
  const xs = Array.from({ length: 40 }, (_, i) => WALL_X + ((PLOT.x1 - WALL_X) * i) / 39)
  const walk = new Shape()
  walk.moveTo(xs[0], -(centre(xs[0]) - half(xs[0])))
  for (const x of xs) walk.lineTo(x, -(centre(x) - half(x)))
  for (const x of [...xs].reverse()) walk.lineTo(x, -(centre(x) + half(x)))
  const walkGeo = new ShapeGeometry(walk)
  walkGeo.rotateX(-PI / 2)
  k.mesh(walkGeo, h.flagstone(1, 1), k.root, 0, LAWN + 0.04, 0, false).receiveShadow = true
  // Dark joints across the slabs, and dark kerbs edging the planted beds either side.
  for (let x = 22; x < PLOT.x1 - 0.5; x += 3.2) {
    const joint = k.box(k.root, 0.06, 0.01, 2 * half(x), h.baseStone, x, LAWN + 0.05, centre(x), false)
    joint.rotation.y = -0.35
  }
  for (const side of [-1, 1])
    for (let i = 0; i < xs.length - 1; i++) {
      const [xa, xb] = [xs[i], xs[i + 1]]
      const [za, zb] = [centre(xa) + side * half(xa), centre(xb) + side * half(xb)]
      const kerb = k.box(k.root, Math.hypot(xb - xa, zb - za), 0.16, 0.14, k.m.basalt, (xa + xb) / 2, LAWN + 0.08, (za + zb) / 2)
      kerb.rotation.y = -Math.atan2(zb - za, xb - xa)
    }
  steps(ctx, 12.4, -17.6, 7.0, 7, 0, PI)
  // Between walk and lawn, as photographed: a curving planted border with a dark steel edging on the
  // lawn side, thick with palms, broad-leaved plants and shrubs, dark glazed urns, and small white
  // lantern posts along the walk's edge.
  const soil = new MeshStandardMaterial({ color: '#3b3127', roughness: 1 })
  const broad = new MeshStandardMaterial({ color: '#41612c', roughness: 0.85, flatShading: true })
  const urnDark = new MeshStandardMaterial({ color: '#3c3a37', roughness: 0.45 })
  const lanternWhite = new MeshStandardMaterial({ color: '#e9e6df', roughness: 0.6 })
  for (let i = 0; i < xs.length - 1; i++) {
    const [xa, xb] = [xs[i], xs[i + 1]]
    if (xa < 24) continue
    const [za, zb] = [centre(xa) + half(xa), centre(xb) + half(xb)]
    const len = Math.hypot(xb - xa, zb - za)
    const ang = -Math.atan2(zb - za, xb - xa)
    const strip = k.box(k.root, len + 0.05, 0.04, 1.8, soil, (xa + xb) / 2, LAWN + 0.02, (za + zb) / 2 + 0.9, false)
    strip.rotation.y = ang
    const edge = k.box(k.root, len + 0.05, 0.12, 0.04, h.steel, (xa + xb) / 2, LAWN + 0.06, (za + zb) / 2 + 1.8)
    edge.rotation.y = ang
    for (let j = 0; j < 3; j++) {
      const t = (j + 0.5) / 3
      const [x, z] = [xa + (xb - xa) * t, za + (zb - za) * t + 0.5 + ((i * 7 + j * 3) % 5) * 0.22]
      k.blob(k.root, 0.35 + ((i + j) % 3) * 0.12, (i + j) % 2 ? broad : k.m.leaf, x, LAWN + 0.35, z, 0.75)
    }
    if (i % 3 === 0) {
      k.cyl(k.root, 0.09, 0.09, 0.35, lanternWhite, xa, LAWN + 0.2, za + 0.15, 12)
      k.cyl(k.root, 0.07, 0.07, 0.06, h.lamp, xa, LAWN + 0.4, za + 0.15, 12)
    }
    if (i % 5 === 2) {
      const u = k.sphere(k.root, 0.28, urnDark, xa, LAWN + 0.38, za + 1.2)
      u.scale.y = 1.4
    }
  }
  // At the east end the walk opens into a paved forecourt behind the east wall, with benches, and a
  // round planted island bulges into the walk from the trees.
  slab([36.5, PLOT.x1 - 0.2, -25.6, -10.6], LAWN, h.flagstone, 0.04)
  for (const z of [-22, -18.5]) {
    k.box(k.root, 0.5, 0.45, 1.8, h.concrete, PLOT.x1 - 1.4, LAWN + 0.27, z)
    k.box(k.root, 0.08, 0.5, 1.8, h.concrete, PLOT.x1 - 1.1, LAWN + 0.7, z)
  }
  const island = k.at(31.5, -23.6, 0, LAWN)
  k.cyl(island, 3.0, 3.0, 0.22, k.m.basalt, 0, 0.11, 0, 40)
  k.cyl(island, 2.85, 2.85, 0.24, h.grass(6, 6), 0, 0.12, 0, 40)
  for (let i = 0; i < 9; i++) k.blob(island, 0.55, k.m.leaf, Math.cos(i * 0.7) * 1.8, 0.5, Math.sin(i * 0.7) * 1.8, 0.8)

  // Steps from the verandah down to the pool deck.
  for (const [x, top] of [[2.75, 3.25], [3.05, 3.05]] as const) k.box(k.root, 0.3, top - BASE, 25.2, k.m.basalt, x, (top + BASE) / 2, 0, false)
  fanSteps(ctx)

  // The pebble garden, as photographed: a low bed of grey river pebbles half a metre above the lawn,
  // from the top of the fan of steps along the foot of the pool wall, its front a gentle curve
  // bulging toward the lawn, edged in dark stone with a band of low planting. A pale grey ledge
  // runs along the wall, with stone lanterns and a cloud-pruned tree.
  const PT = PEBBLE_T
  const edgeOuter = { x: FAN.x + FAN.outer * Math.cos(FAN.span), z: FAN.z - FAN.outer * Math.sin(FAN.span) }
  const [pzN, pzS] = [-3.0, FAN.z - FAN.inner]
  const ctrl = { x: 25.0, z: 0.5 }
  const bed = new Shape()
  bed.moveTo(WALL_X, -pzN)
  bed.lineTo(WALL_X, -pzS)
  bed.lineTo(edgeOuter.x + 0.1, -edgeOuter.z)
  bed.quadraticCurveTo(ctrl.x, -ctrl.z, WALL_X, -pzN)
  const bedGeo = new ExtrudeGeometry(bed, { depth: PT - LAWN, bevelEnabled: false, curveSegments: 32 })
  bedGeo.rotateX(-PI / 2)
  const darkStone = new MeshStandardMaterial({ color: '#4d4b46', roughness: 0.9 })
  k.mesh(bedGeo, [h.riverPebbles(1, 1), darkStone], k.root, 0, LAWN, 0, false).receiveShadow = true
  k.box(k.root, 0.55, 0.28, pzS - pzN, h.paleStone, WALL_X + 0.28, PT + 0.14, (pzN + pzS) / 2)
  // Low planting and a dark edging along the curved front.
  for (let t = 0.04; t < 0.97; t += 0.045) {
    const u = 1 - t
    const x = u * u * (edgeOuter.x + 0.1) + 2 * u * t * ctrl.x + t * t * WALL_X
    const z = u * u * edgeOuter.z + 2 * u * t * ctrl.z + t * t * pzN
    k.blob(k.root, 0.32 + 0.12 * Math.abs(Math.sin(t * 40)), k.m.leaf, x - 0.25, PT + 0.18, z, 0.7)
  }
  const lantern = (x: number, z: number) => {
    k.box(k.root, 0.24, 0.45, 0.24, h.paleStone, x, PT + 0.27, z)
    k.box(k.root, 0.2, 0.1, 0.2, h.lamp, x, PT + 0.54, z, false)
    k.box(k.root, 0.3, 0.05, 0.3, h.paleStone, x, PT + 0.62, z)
  }
  for (const z of [-2.0, 1.2, 4.4, 7.6]) lantern(18.0, z)
  lantern(19.4, 9.4)
  const bonsai = (x: number, z: number, s: number) => {
    k.cyl(k.root, 0.08 * s, 0.14 * s, 2.2 * s, k.m.trunk, x, PT + 1.1 * s, z, 8)
    for (const [dx, dy, dz, r] of [[0, 2.4, 0, 0.5], [0.45, 1.7, 0.2, 0.42], [-0.4, 1.3, -0.15, 0.4], [0.2, 0.9, 0.35, 0.36], [-0.3, 2.05, 0.3, 0.34]])
      k.blob(k.root, r * s, k.m.leaf, x + dx * s, PT + dy * s, z + dz * s, 0.6)
  }
  bonsai(19.8, 1.4, 1.2)
  bonsai(18.6, 6.6, 0.8)
  // Big distressed white urns, as photographed beside the steps, the hall and on the lawn.
  for (const [x, z, y, s] of [[24.9, 11.0, LAWN, 1.0], [15.0, 10.4, POOL_T, 0.9], [30.5, 9.0, LAWN, 0.9], [23.4, 6.8, LAWN, 0.8], [26.6, -9.0, LAWN, 0.9]] as const) urn(ctx, x, y, z, s)

  // The dining strip between lawn and court: crackle-finish paving retained above the lawn by a
  // stone wall overgrown with creepers, a long row of rattan dining sets, and garden lights.
  const [dx0, dx1, dz0, dz1] = BOULDER_DECK
  const rattan = new MeshStandardMaterial({ color: '#c9a77a', roughness: 0.8 })
  const ivy = new MeshStandardMaterial({ color: '#4d6b34', roughness: 0.9, flatShading: true })
  for (let x = FAN.x + FAN.outer + 0.3; x < dx1; x += 0.9) {
    const y = LAWN + 0.5 + Math.abs(Math.sin(x * 1.7)) * 1.1
    k.blob(k.root, 0.45 + Math.abs(Math.sin(x * 2.3)) * 0.25, ivy, x, y, dz0 - 0.05, 0.5)
    k.blob(k.root, 0.4, k.m.leaf, x + 0.4, POOL_T + 0.25, dz0 + 0.35, 0.8)
  }
  for (let x = dx0 + 6; x < dx1; x += 3.2) {
    k.box(k.root, 0.16, 0.4, 0.16, h.paleStone, x, POOL_T + 0.2, dz0 + 0.7)
    k.box(k.root, 0.14, 0.08, 0.14, h.lamp, x, POOL_T + 0.36, dz0 + 0.7, false)
  }
  for (let i = 0; i < 8; i++) {
    const x = dx0 + 9.5 + i * 1.75
    const tz = (dz0 + dz1) / 2 + 0.6
    const Y = POOL_T
    k.box(k.root, 1.2, 0.05, 0.8, rattan, x, Y + 0.76, tz)
    for (const [lx, lz] of [[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]]) k.box(k.root, 0.05, 0.74, 0.05, rattan, x + lx, Y + 0.37, tz + lz)
    for (const [cx2, cz2] of [[-0.3, -0.75], [0.3, -0.75], [-0.3, 0.75], [0.3, 0.75]]) {
      k.box(k.root, 0.45, 0.06, 0.45, rattan, x + cx2, Y + 0.45, tz + cz2)
      k.box(k.root, 0.45, 0.5, 0.05, rattan, x + cx2, Y + 0.72, tz + cz2 + Math.sign(cz2) * 0.22)
      for (const lx of [-0.18, 0.18]) k.box(k.root, 0.04, 0.45, 0.04, rattan, x + cx2 + lx, Y + 0.22, tz + cz2)
    }
  }
}

/**
 * The broad fan of steps from the pool terrace down to the lawn, as photographed: ten curved treads
 * of pale grey granite with darker risers and a dark line at each nosing, each an arc round the
 * corner of the pebble garden, narrow at the top by the hall and widening to the lawn.
 */
function fanSteps(ctx: Ctx) {
  const { k, h } = ctx
  const { x: cx, z: cz, inner, outer, n, span } = FAN
  const rise = (POOL_T - LAWN) / n
  const nosing = new MeshStandardMaterial({ color: '#6c6b66', roughness: 0.8 })
  for (let i = 0; i < n; i++) {
    // Outermost lowest; the top tread is the innermost, at the corner by the hall.
    const r = outer - (i * (outer - inner - 0.4)) / n
    const top = LAWN + rise * (i + 1)
    // An annular sector from due east round toward the north (plan shape coordinates are x, −z).
    const shape = new Shape()
    shape.moveTo(cx + inner, -cz)
    shape.lineTo(cx + r, -cz)
    shape.absarc(cx, -cz, r, 0, span, false)
    shape.lineTo(cx + inner * Math.cos(span), -cz + inner * Math.sin(span))
    shape.absarc(cx, -cz, inner, span, 0, true)
    const geo = new ExtrudeGeometry(shape, { depth: top - LAWN, bevelEnabled: false, curveSegments: 40 })
    geo.rotateX(-PI / 2)
    const step = k.mesh(geo, [h.granite, h.graniteRiser], k.root, 0, LAWN, 0, false)
    step.receiveShadow = true
    step.castShadow = true
    const line = k.mesh(new TorusGeometry(r - 0.03, 0.018, 4, 48, span), nosing, k.root, cx, top + 0.005, cz, false)
    line.rotation.x = -PI / 2
  }
}

/** A big distressed white ceramic urn. */
function urn(ctx: Ctx, x: number, y: number, z: number, s: number) {
  const { k } = ctx
  const clay = new MeshStandardMaterial({ color: '#dcd8cf', roughness: 0.95 })
  const body = k.sphere(k.root, 0.36 * s, clay, x, y + 0.42 * s, z)
  body.scale.y = 1.25
  k.cyl(k.root, 0.17 * s, 0.22 * s, 0.22 * s, clay, x, y + 0.86 * s, z, 16)
  k.cyl(k.root, 0.2 * s, 0.2 * s, 0.05 * s, clay, x, y + 0.98 * s, z, 16)
}

/**
 * Curved stone steps down from the pool terrace to the lawn: concentric treads of pale grey stone
 * with darker risers, spanning `start`..`start + span` (radians from +z towards +x), outermost lowest.
 */
function steps(ctx: Ctx, cx: number, cz: number, outer: number, n: number, start: number, span: number) {
  const { k, h } = ctx
  const rise = (POOL_T - LAWN) / (n + 1)
  const inner = outer * 0.3
  for (let i = 0; i < n; i++) {
    const r = outer - (i * (outer - inner)) / n
    const top = LAWN + rise * (i + 1)
    const step = k.mesh(new CylinderGeometry(r, r, top - LAWN + 0.02, 48, 1, false, start, span), [h.baseStone, h.paleStone, h.paleStone], k.root, cx, (top + LAWN) / 2 - 0.01, cz, false)
    step.receiveShadow = true
  }
}

function buildBoundaries(ctx: Ctx) {
  const { k, h } = ctx
  const wall = (x0: number, x1: number, z0: number, z1: number, y: number, ht: number) => {
    const [w, d] = [Math.max(x1 - x0, 0.3), Math.max(z1 - z0, 0.3)]
    k.box(k.root, w, ht, d, h.cream(Math.max(w, d), ht), (x0 + x1) / 2, y + ht / 2, (z0 + z1) / 2)
    k.box(k.root, w + 0.08, 0.08, d + 0.08, h.paleStone, (x0 + x1) / 2, y + ht + 0.04, (z0 + z1) / 2)
  }
  // West: the white compound wall, with the arched gate at the north-west corner opening onto the walk.
  const [ga, gb] = [-20.6, -16.6]
  for (const [a, b] of [[PLOT.z0, ga], [gb, PLOT.z1]]) wall(PLOT.x0 - 0.15, PLOT.x0 + 0.15, a, b, UPPER, 2.8)
  const gz = (ga + gb) / 2
  for (const s of [-1, 1]) k.box(k.root, 0.9, 4.0, 0.9, h.cream(0.9, 4), PLOT.x0, UPPER + 2.0, gz + s * 2.45)
  const arch = k.mesh(new TorusGeometry(2.0, 0.45, 10, 32, PI), h.cream(2, 2), k.root, PLOT.x0, UPPER + 3.4, gz, true)
  arch.rotation.y = PI / 2
  k.box(k.root, 0.9, 1.4, 5.8, h.cream(5.8, 1.4), PLOT.x0, UPPER + 5.0, gz)
  for (const s of [-1, 1]) k.box(k.root, 0.12, 3.4, 1.95, h.teak(1.95, 3.4), PLOT.x0, UPPER + 1.7, gz + s * 0.99)

  // North and south: tall white walls, stepping down with the ground.
  for (const [a, b, y] of [[PLOT.x0, 3, UPPER], [3, WALL_X, POOL_T], [WALL_X, PLOT.x1, LAWN]] as const) wall(a, b, PLOT.z0 - 0.15, PLOT.z0 + 0.15, y, 3.0)
  for (const [a, b, y] of [[PLOT.x0, 3, UPPER], [3, PLOT.x1, LAWN]] as const) wall(a, b, PLOT.z1 - 0.15, PLOT.z1 + 0.15, y, 3.0)

  // East, on the road: a low white wall carrying a bronze lattice grille in front of the lawn and the
  // walk, with red cordylines planted along its foot; a tall white wall round the service corner.
  const x = PLOT.x1
  const [ga0, ga1] = [-26.4, SERVICE[2]]
  wall(x - 0.2, x + 0.2, PLOT.z0, PLOT.z1, LAWN, 0.7)
  wall(x - 0.2, x + 0.2, SERVICE[2], PLOT.z1, LAWN, 2.8)
  const bronze = new MeshStandardMaterial({ color: '#4a3a2c', metalness: 0.5, roughness: 0.5 })
  const panel = 2.4
  for (let z = ga0; z < ga1 - 0.1; z += panel) {
    const zc = z + panel / 2
    const y0 = LAWN + 0.7
    const H = 2.1
    k.box(k.root, 0.12, H, 0.12, bronze, x, y0 + H / 2, z)
    k.box(k.root, 0.08, 0.08, panel, bronze, x, y0 + H - 0.04, zc)
    k.box(k.root, 0.08, 0.08, panel, bronze, x, y0 + 0.04, zc)
    // The lattice: two diagonals and a mid rail in each panel.
    const diag = Math.hypot(panel, H)
    for (const s of [-1, 1]) {
      const bar = k.box(k.root, 0.04, diag, 0.04, bronze, x, y0 + H / 2, zc)
      bar.rotation.x = s * Math.atan2(panel, H)
    }
    k.box(k.root, 0.05, 0.05, panel, bronze, x, y0 + H / 2, zc)
  }
  const cordyline = new MeshStandardMaterial({ color: '#8c2335', roughness: 0.8, flatShading: true })
  for (let z = ga0 + 0.6; z < ga1; z += 0.9) {
    k.blob(k.root, 0.42, (Math.round(z * 10) % 3 === 0 ? k.m.leaf : cordyline), x - 0.9, LAWN + 0.45, z, 0.9)
  }

  // The road outside the east wall, with a kerb.
  const [rx0, rx1, rz0, rz1] = ROAD
  k.box(k.root, rx1 - rx0, 0.06, rz1 - rz0, h.concrete, (rx0 + rx1) / 2, LAWN - 0.17, (rz0 + rz1) / 2, false)
  k.box(k.root, 0.3, 0.2, rz1 - rz0, h.paleStone, rx0 + 0.45, LAWN - 0.1, (rz0 + rz1) / 2)
}

function buildShore(ctx: Ctx) {
  const { k } = ctx
  const shore = levelKit(k, SHORE)
  const stone = new MeshStandardMaterial({ color: '#8a8273', roughness: 0.95, flatShading: true })
  for (let i = 0; i < 29; i++) {
    const z = -36 + i * 2.6 + ((i * 7) % 5) * 0.2
    shore.blob(shore.root, 0.35 + (i % 4) * 0.12, stone, 55.6 + ((i * 3) % 4) * 0.3, 0.05, z, 0.55)
  }
  const reed = new MeshStandardMaterial({ color: '#6f7d4a', roughness: 0.9 })
  for (let i = 0; i < 44; i++) {
    const z = -38 + i * 1.75
    for (let j = 0; j < 4; j++) shore.cyl(shore.root, 0.015, 0.02, 1.1 + ((i + j) % 3) * 0.25, reed, 56.6 + j * 0.12, 0.5, z + j * 0.15, 5)
  }
}

/**
 * Planting from the aerial photograph: a dense line of flame-of-the-forest trees in orange bloom
 * and coconut palms along the whole north boundary, palms along the walk and round the pool.
 */
/**
 * A coconut palm: a slender ringed trunk leaning and curving a little, a crown of long arching
 * fronds with fine leaflets that droop at their tips, and a cluster of coconuts.
 */
function palm(ctx: Ctx, lk: Kit, x: number, z: number, ht: number) {
  const frondMat = paintedMat(ctx, 'palmFrond', 128, 512, palmFrond, { alphaTest: 0.4, side: DoubleSide, roughness: 0.8 })
  const g = lk.at(x, z, 0, 0)
  const lean = ((x * 13 + z * 7) % 6.28) - 3.14
  const [lx, lz] = [Math.cos(lean), Math.sin(lean)]
  const segs = 6
  let [px, py, pz] = [0, 0, 0]
  for (let i = 0; i < segs; i++) {
    const t = (i + 1) / segs
    const off = 0.06 * ht * t * t
    const [nx, ny, nz] = [lx * off, (ht * (i + 1)) / segs, lz * off]
    const len = Math.hypot(nx - px, ny - py, nz - pz)
    const seg = lk.cyl(g, 0.12 - 0.035 * t, 0.15 - 0.035 * t, len + 0.02, lk.m.trunk, (px + nx) / 2, (py + ny) / 2, (pz + nz) / 2, 10)
    seg.rotation.set(Math.atan2(nz - pz, ny - py), 0, -Math.atan2(nx - px, ny - py))
    ;[px, py, pz] = [nx, ny, nz]
  }
  const crown = lk.at(px, pz, 0, py)
  g.add(crown)
  crown.position.set(px, py, pz)
  for (let i = 0; i < 4; i++) lk.sphere(crown, 0.12, lk.m.trunk, Math.cos(i * 1.6) * 0.18, -0.25, Math.sin(i * 1.6) * 0.18)
  const n = 14
  for (let i = 0; i < n; i++) {
    const L = 2.6 + ((i * 7) % 5) * 0.15
    const geo = new PlaneGeometry(1.0, L, 2, 12)
    const pos = geo.getAttribute('position')
    const lift = i % 3 === 0 ? 1.1 : 0.7
    for (let v = 0; v < pos.count; v++) {
      const [vx, vy] = [pos.getX(v), pos.getY(v)]
      const t = (vy + L / 2) / L
      pos.setXYZ(v, vx * (1 - 0.3 * t), lift * t * L * 0.5 - 1.5 * t * t * L * 0.5 - Math.abs(vx) * 0.25, t * L)
    }
    geo.computeVertexNormals()
    const frond = new Mesh(geo, frondMat)
    frond.rotation.y = (i / n) * PI * 2 + (i % 2) * 0.2
    frond.castShadow = true
    crown.add(frond)
  }
}

function buildPlanting(ctx: Ctx) {
  const { k } = ctx
  const upper = levelKit(k, UPPER)
  const pool = levelKit(k, POOL_T)
  const lawn = levelKit(k, LAWN)
  const at = (x: number) => (x < 3 ? upper : x < WALL_X ? pool : lawn)
  const bloom = new MeshStandardMaterial({ color: '#d9432a', roughness: 0.8, flatShading: true })

  // As in the photographs, the flame trees along the north wall have grown into one continuous,
  // tall wall of dark green, speckled all over with clusters of red-orange flowers.
  const crown = new MeshStandardMaterial({ color: '#3a5628', roughness: 0.9, flatShading: true })
  const crownLight = new MeshStandardMaterial({ color: '#4c6a30', roughness: 0.9, flatShading: true })
  for (let x = -21; x <= 45; x += 1.7) {
    const lk = at(x)
    const tall = 7.2 + 1.2 * Math.sin(x * 0.37) + 0.6 * Math.sin(x * 1.3)
    for (const [z, r] of [[-29.0, 1.7], [-27.2, 1.5]] as const)
      for (let y = 1.2; y < tall; y += 1.5) {
        const rr = r * (1 - (y / tall) * 0.25)
        lk.blob(lk.root, rr, (Math.round(x * 3 + y) % 3 === 0 ? crownLight : crown), x + Math.sin(y * 3 + x) * 0.3, y, z + Math.cos(x * 2 + y) * 0.35, 0.85)
      }
    for (let i = 0; i < 10; i++) {
      const y = 1.4 + ((i * 1.37 + x) % 1) * (tall - 1.2)
      lk.blob(lk.root, 0.15, bloom, x + Math.sin(i * 2.3) * 0.8, y, -25.7 - Math.abs(Math.cos(i * 1.7 + x)) * 0.5, 0.8)
    }
  }
  for (let x = -14; x <= 44; x += 7.3) palm(ctx, at(x), x, -23.8 + ((x * 5) % 3) * 0.3, 6.5 + ((x * 3) % 3))
  // Palms and shrubs along the south edge of the walk, beside the lawn.
  for (const x of [26, 31.5, 37, 42.5]) palm(ctx, lawn, x, -12.2, 5.2)
  for (const [x, z] of [[4.2, 9.8], [16.4, -12.8], [12.6, 10.0]] as const) palm(ctx, pool, x, z, 4.8)
  for (const [x, z] of [[27.5, -4.4], [40, 6.8], [43.4, -3]] as const) palm(ctx, lawn, x, z, 4.0)
  // A row of palms between the court's jali wall and the gravel deck.
  for (let x = 25; x <= 38; x += 3.3) palm(ctx, pool, x, 14.6, 3.6 + (x % 2) * 0.6)
}
