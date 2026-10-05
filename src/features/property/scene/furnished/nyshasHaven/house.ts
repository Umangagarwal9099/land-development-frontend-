import { BackSide, BufferAttribute, BufferGeometry, CircleGeometry, CylinderGeometry, DoubleSide, Mesh, MeshStandardMaterial, TorusGeometry, type Material } from 'three'
import { PI, type Kit } from '../kit'
import { BAND, BAYS, EAVE, FF, GF, HOUSE, TERRACE, UPPER, type Ctx, type HavenMaterials } from './layout'

/**
 * A hip roof over a w × d footprint rising `rise` to a ridge along the longer side (a pyramid when
 * square), with UVs laid in plan so thatch courses run along the eaves.
 */
export function hipRoof(w: number, d: number, rise: number): BufferGeometry {
  const alongZ = d >= w
  const half = Math.abs(d - w) / 2
  const [hx, hz] = [w / 2, d / 2]
  const r0 = alongZ ? [0, rise, -half] : [-half, rise, 0]
  const r1 = alongZ ? [0, rise, half] : [half, rise, 0]
  const c = { nw: [-hx, 0, -hz], ne: [hx, 0, -hz], se: [hx, 0, hz], sw: [-hx, 0, hz] }
  const tris = alongZ
    ? [[c.nw, r0, c.ne], [c.ne, r0, r1], [c.ne, r1, c.se], [c.se, r1, c.sw], [c.sw, r1, r0], [c.sw, r0, c.nw]]
    : [[c.nw, r0, c.sw], [c.nw, r1, r0], [c.nw, c.ne, r1], [c.ne, c.se, r1], [c.se, r0, r1], [c.se, c.sw, r0]]
  const pos = tris.flat(2)
  const uv: number[] = []
  for (let i = 0; i < pos.length; i += 3) uv.push((pos[i] + hx) / 2, (pos[i + 2] + hz) / 2 + pos[i + 1])
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  g.computeVertexNormals()
  return g
}

/** A thatched hip roof with a thick fringe at the eaves, as alang-alang roofs have. */
export function thatchRoof(k: Kit, h: HavenMaterials, x: number, z: number, y: number, w: number, d: number, rise: number) {
  const mat = h.thatch(2, 2)
  const roof = new Mesh(hipRoof(w, d, rise), mat)
  roof.position.set(x, y, z)
  roof.castShadow = roof.receiveShadow = true
  k.root.add(roof)
  const t = 0.28
  const fringe = h.thatch(w, 0.3)
  k.box(k.root, w, t, 0.18, fringe, x, y - t / 2 + 0.05, z - d / 2)
  k.box(k.root, w, t, 0.18, fringe, x, y - t / 2 + 0.05, z + d / 2)
  k.box(k.root, 0.18, t, d, fringe, x - w / 2, y - t / 2 + 0.05, z)
  k.box(k.root, 0.18, t, d, fringe, x + w / 2, y - t / 2 + 0.05, z)
}

/**
 * A soft, rounded hip of alang-alang, as on the terrace bar: straight-ish slopes swelling slightly,
 * corners rounded in plan (a squircle), thatch streaks running down the slope, and a thick shaggy
 * fringe hanging at the eaves.
 */
export function roundedThatch(k: Kit, h: HavenMaterials, x: number, z: number, y: number, w: number, d: number, rise: number) {
  // Plan is a squircle whose half-extents shrink with height like a hip: the short side closes to a
  // straight ridge along the long side; slopes swell slightly (convex) as thick thatch does.
  const m = Math.min(w, d) / 2
  const shape = (geo: BufferGeometry, y0: number, ht: number, flat: boolean) => {
    const pos = geo.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      const [px, py, pz] = [pos.getX(i), pos.getY(i), pos.getZ(i)]
      const r = Math.hypot(px, pz)
      const t = flat ? 0 : Math.min(Math.max((py - y0) / ht, 0), 1)
      const shrink = m * 0.94 * Math.pow(t, 1.35)
      const [hx, hz] = [w / 2 - shrink, d / 2 - shrink]
      if (r < 1e-6) {
        pos.setXYZ(i, 0, py, 0)
        continue
      }
      const [c, s] = [px / r, pz / r]
      const f = 1 / Math.pow(Math.pow(Math.abs(c), 4) + Math.pow(Math.abs(s), 4), 0.25)
      pos.setXYZ(i, c * f * hx * r, py, s * f * hz * r)
    }
    geo.computeVertexNormals()
    return geo
  }
  const perimeter = 1.8 * (w + d)
  const mat = h.thatch(perimeter, Math.hypot(rise, m))
  const roof = new Mesh(shape(new CylinderGeometry(1, 1, rise, 80, 10, false), -rise / 2, rise, false), mat)
  roof.position.set(x, y + rise / 2, z)
  roof.castShadow = roof.receiveShadow = true
  k.root.add(roof)
  // The thick, shaggy fringe hanging at the eaves.
  const fringe = new Mesh(shape(new CylinderGeometry(1.0, 1.04, 0.5, 80, 1, true), -0.25, 0.5, true), h.thatch(perimeter, 0.5))
  fringe.position.set(x, y - 0.2, z)
  fringe.castShadow = true
  k.root.add(fringe)
}

/** A walled block: cream render on every face, brick on the faces listed, sized per face. */
function block(ctx: Ctx, x0: number, x1: number, z0: number, z1: number, y: number, ht: number, brickFaces: ('n' | 's' | 'e' | 'w')[] = []) {
  const { k, h } = ctx
  const w = x1 - x0
  const d = z1 - z0
  const face = (side: 'n' | 's' | 'e' | 'w', len: number) => (brickFaces.includes(side) ? h.brick(len, ht) : h.cream(len, ht))
  const mats: Material[] = [face('e', d), face('w', d), h.cream(w, d), h.cream(w, d), face('s', w), face('n', w)]
  k.box(k.root, w, ht, d, mats, (x0 + x1) / 2, y + ht / 2, (z0 + z1) / 2)
}

/**
 * A lit window or glazed door set into a facade: teak frame, mullions and warm glass.
 * `axis` is the wall's direction ('x' runs along x, facing ±z), `out` the side it faces.
 */
export function glazing(ctx: Ctx, axis: 'x' | 'z', fixed: number, out: 1 | -1, a: number, b: number, y0: number, y1: number, panes = 2, frame?: Material) {
  const { k, h } = ctx
  const fr = frame ?? k.m.teak
  const len = b - a
  const c = (a + b) / 2
  const ht = y1 - y0
  const p = fixed + out * 0.02
  const box = (w: number, hh: number, along: number, y: number, mat: Material, depth = 0.06) =>
    axis === 'x' ? k.box(k.root, w, hh, depth, mat, along, y, p, false) : k.box(k.root, depth, hh, w, mat, p, y, along, false)
  box(len, ht, c, y0 + ht / 2, h.window, 0.03)
  box(len + 0.16, 0.1, c, y1 + 0.05, fr)
  box(len + 0.16, 0.08, c, y0 - 0.04, fr)
  for (let i = 0; i <= panes; i++) box(0.08, ht, a + (len * i) / panes, y0 + ht / 2, fr)
}

type Rect4 = [number, number, number, number]

/**
 * The swept Balinese roof, as photographed: a hip whose top is cut flat for the terrace, its planes
 * curving from steep at the terrace edge to almost flat at the eaves, with the corners kicked up.
 * Built as one smooth grid over the eave rectangle (the terrace rectangle left open), plus the
 * thin fascia ribbon that runs round the curved eave line.
 */
function sweptRoof(outer: Rect4, inner: Rect4, yEave: number, yTop: number, flare = 0.16, curve = 1.7) {
  const [ox0, ox1, oz0, oz1] = outer
  const [ix0, ix1, iz0, iz1] = inner
  // Normalised distance out from the terrace edge (0) to the eave (1) along each axis.
  const along = (v: number, i0: number, i1: number, o0: number, o1: number) => (v < i0 ? (i0 - v) / (i0 - o0) : v > i1 ? (v - i1) / (o1 - i1) : 0)
  const height = (x: number, z: number) => {
    const sx = along(x, ix0, ix1, ox0, ox1)
    const sz = along(z, iz0, iz1, oz0, oz1)
    const s = Math.max(sx, sz)
    const sweep = Math.pow(1 - s, curve)
    const kick = flare * (Math.pow(sx * sz, 3) + 0.25 * Math.pow(s, 8))
    return yEave + (yTop - yEave) * sweep + kick
  }
  const nx = 64
  const nz = 64
  const xs = Array.from({ length: nx + 1 }, (_, i) => ox0 + ((ox1 - ox0) * i) / nx)
  const zs = Array.from({ length: nz + 1 }, (_, j) => oz0 + ((oz1 - oz0) * j) / nz)
  const pos: number[] = []
  const uv: number[] = []
  for (const z of zs)
    for (const x of xs) {
      // Snap vertices inside the terrace to its edge height, so the roof meets the terrace slab.
      pos.push(x, height(x, z), z)
      uv.push(x / 2, z / 2)
    }
  const inside = (x: number, z: number) => x > ix0 + 0.01 && x < ix1 - 0.01 && z > iz0 + 0.01 && z < iz1 - 0.01
  const index: number[] = []
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2
      const cz = (zs[j] + zs[j + 1]) / 2
      if (inside(cx, cz)) continue
      const a = j * (nx + 1) + i
      const b = a + 1
      const c = a + nx + 1
      const d = c + 1
      index.push(a, c, b, b, c, d)
    }
  const top = new BufferGeometry()
  top.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  top.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  top.setIndex(index)
  top.computeVertexNormals()

  // Fascia: a ribbon hanging 0.16 m below the eave line, all the way round.
  const ring: [number, number][] = [
    ...xs.map((x) => [x, oz0] as [number, number]),
    ...zs.slice(1).map((z) => [ox1, z] as [number, number]),
    ...xs.slice(0, -1).reverse().map((x) => [x, oz1] as [number, number]),
    ...zs.slice(1, -1).reverse().map((z) => [ox0, z] as [number, number]),
  ]
  const rp: number[] = []
  const ri: number[] = []
  ring.forEach(([x, z], n) => {
    const y = height(x, z)
    rp.push(x, y + 0.01, z, x, y - 0.16, z)
    const m = (n + 1) % ring.length
    ri.push(2 * n, 2 * n + 1, 2 * m, 2 * m, 2 * n + 1, 2 * m + 1)
  })
  const edge = new BufferGeometry()
  edge.setAttribute('position', new BufferAttribute(new Float32Array(rp), 3))
  edge.setIndex(ri)
  edge.computeVertexNormals()
  return { top, edge }
}

/** A square teak column on a carved stone base, between two heights, on the pool facade. */
function column(ctx: Ctx, x: number, z: number, y0: number, y1: number) {
  const { k, h } = ctx
  k.box(k.root, 0.7, 0.62, 0.7, h.baseStone, x, y0 + 0.31, z)
  k.box(k.root, 0.8, 0.06, 0.8, h.baseStone, x, y0 + 0.65, z)
  k.box(k.root, 0.46, y1 - y0 - 0.68, 0.46, h.column, x, (y0 + 0.68 + y1) / 2, z)
  k.box(k.root, 0.56, 0.14, 0.56, k.m.teak, x, y1 - 0.3, z)
}

/** A photographed glazed panel set into a wall along z (facing +x): teak or black outer frame. */
function photoGlazing(ctx: Ctx, x: number, z0: number, z1: number, y0: number, y1: number, floor: 'gf' | 'ff', frame: Material) {
  const { k, h } = ctx
  const len = z1 - z0
  const ht = y1 - y0
  const mat = floor === 'gf' ? h.glazingGF(len, ht) : h.glazingFF(len, ht)
  k.box(k.root, 0.03, ht, len, [mat, mat, mat, mat, mat, mat], x + 0.02, y0 + ht / 2, (z0 + z1) / 2, false)
  k.box(k.root, 0.08, 0.1, len + 0.16, frame, x + 0.04, y1 + 0.05, (z0 + z1) / 2)
  k.box(k.root, 0.08, 0.08, len + 0.16, frame, x + 0.04, y0 - 0.04, (z0 + z1) / 2)
  for (const z of [z0, z1]) k.box(k.root, 0.08, ht, 0.08, frame, x + 0.04, y0 + ht / 2, z)
}

export function buildHouse(ctx: Ctx) {
  const { k, h } = ctx
  const r = k.root
  const black = new MeshStandardMaterial({ color: '#1d1e20', roughness: 0.5, metalness: 0.3 })
  const { x0, x1, z0, z1 } = HOUSE

  // Basalt plinth carrying the pool-side verandah; the ground floor in the photographed red brick.
  k.box(r, x1 - x0 + 3.2, GF - UPPER, z1 - z0 + 1.2, k.m.basalt, (x0 + x1 + 2.6) / 2 - 0.3, (GF + UPPER) / 2, 0)
  block(ctx, x0, x1, z0, z1, GF, BAND - GF, ['e', 'w', 's'])

  // Pool facade, ground floor, bay by bay as in the photographs (south is on the left):
  // a black-framed window in the brick, the wide teak-grid glazing, the carved double door and
  // a narrow glazed panel beside it.
  glazing(ctx, 'z', x1, 1, 1.8, 6.1, GF + 1.15, GF + 2.55, 2, black)
  photoGlazing(ctx, x1, -5.9, 0.05, GF + 0.05, GF + 3.3, 'gf', k.m.teak)
  k.box(r, 0.1, 3.2, 2.7, [h.door, h.door, k.m.teak, k.m.teak, k.m.teak, k.m.teak], x1 + 0.05, GF + 1.6, -7.45, false)
  k.box(r, 0.12, 0.14, 2.9, k.m.teak, x1 + 0.06, GF + 3.27, -7.45)
  photoGlazing(ctx, x1, -9.9, -9.0, GF + 0.05, GF + 3.3, 'gf', k.m.teak)
  for (const z of BAYS) column(ctx, 2.0, z, GF, BAND)

  // Other ground-floor sides: the informal living room opens north onto its swing deck.
  glazing(ctx, 'x', z0, -1, -12, -5, GF + 0.1, GF + 3.0, 3)
  glazing(ctx, 'x', z0, -1, -16.5, -13.5, GF + 0.9, GF + 2.7, 2)
  glazing(ctx, 'x', z1, 1, -15.5, -12, GF + 0.9, GF + 2.7, 2)
  glazing(ctx, 'x', z1, 1, -8.5, -5, GF + 0.9, GF + 2.7, 2)
  glazing(ctx, 'z', x0, -1, -8.5, -4.5, GF + 0.9, GF + 2.7, 2)
  glazing(ctx, 'z', x0, -1, 4.5, 8.5, GF + 0.9, GF + 2.7, 2)

  // Arrival door on the west: the same carved teak, a river-stone surround and a teak canopy.
  k.box(r, 0.1, 3.0, 2.5, [h.door, h.door, k.m.teak, k.m.teak, k.m.teak, k.m.teak], x0 - 0.06, GF + 1.5, 0, false)
  k.box(r, 0.3, 3.4, 0.35, h.river(0.35, 3.4), x0 - 0.12, GF + 1.7, -1.45)
  k.box(r, 0.3, 3.4, 0.35, h.river(0.35, 3.4), x0 - 0.12, GF + 1.7, 1.45)
  k.box(r, 0.3, 0.4, 3.25, h.river(3.25, 0.4), x0 - 0.12, GF + 3.2, 0)
  for (const z of [-1.9, 1.9]) column(ctx, x0 - 2.4, z, UPPER, GF + 3.0)
  k.box(r, 2.9, 0.18, 4.6, h.teak(2.9, 4.6), x0 - 1.45, GF + 3.0, 0)

  // North swing deck off the informal living room: teak boards, a pergola and a hanging swing.
  const sz = z0 - 0.6
  k.box(r, 7, 0.06, 3.0, h.teak(7, 3), -8.5, GF + 0.03, sz - 1.5, false)
  for (const x of [-11.8, -5.2]) k.box(r, 0.16, 2.85, 0.16, k.m.teak, x, GF + 1.425, sz - 2.8)
  k.box(r, 6.9, 0.18, 0.12, k.m.teak, -8.5, GF + 2.85, sz - 2.8)
  for (let x = -11.6; x <= -5.3; x += 0.5) k.box(r, 0.06, 0.1, 2.6, k.m.teak, x, GF + 2.98, sz - 1.5)
  const swing = k.at(-8.5, sz - 1.6, 0, GF)
  k.box(swing, 1.8, 0.08, 0.6, k.m.teak, 0, 0.5, 0)
  k.soft(swing, 1.7, 0.1, 0.55, 0.04, k.m.outdoor, 0, 0.58, 0)
  k.box(swing, 1.8, 0.5, 0.06, k.m.teak, 0, 0.8, -0.27)
  for (const s of [-1, 1]) k.cyl(swing, 0.01, 0.01, 2.3, h.bamboo, s * 0.85, 1.7, 0, 4)

  // Verandah furniture as photographed: a café table and chairs, and potted palms by the columns.
  const white = new MeshStandardMaterial({ color: '#f1efe9', roughness: 0.4, metalness: 0.2 })
  k.cyl(r, 0.35, 0.35, 0.03, white, 1.0, GF + 0.73, 7.6, 24)
  k.cyl(r, 0.03, 0.03, 0.72, white, 1.0, GF + 0.36, 7.6, 8)
  for (const dz of [-0.6, 0.6]) {
    const c = k.at(1.0, 7.6 + dz, dz < 0 ? 0 : PI, GF)
    k.box(c, 0.46, 0.04, 0.44, white, 0, 0.45, 0)
    k.box(c, 0.46, 0.4, 0.03, white, 0, 0.7, -0.21)
    for (const [a, b] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) k.cyl(c, 0.012, 0.012, 0.45, white, a, 0.225, b, 6)
  }
  for (const z of [11.2, 4.4, -2.6]) {
    k.cyl(r, 0.28, 0.22, 0.55, k.m.basalt, 1.2, GF + 0.275, z, 16)
    for (let i = 0; i < 7; i++) {
      const leaf = k.box(r, 0.06, 0.02, 0.7, k.m.sage, 1.2 + Math.cos(i * 0.9) * 0.2, GF + 0.85, z + Math.sin(i * 0.9) * 0.2)
      leaf.rotation.set(0.9, i * 0.9, 0)
    }
  }

  // The deep cream floor band that carries the first-floor balcony right across the pool front.
  k.box(r, x1 - x0 + 3.6, FF - BAND, z1 - z0 + 0.8, [h.sandstone, h.sandstone, h.deckStone(22, 25), h.sandstone, h.sandstone, h.sandstone], (x0 + x1 + 2.8) / 2, (BAND + FF) / 2, 0)

  // First floor: red brick all round, as in the drone photograph, with black-framed curtained glazing to the lake.
  const fx = -1.2
  const ffh = EAVE - FF
  block(ctx, -17.5, fx, z0 + 0.4, z1 - 0.4, FF, ffh, ['n', 's', 'e', 'w'])
  photoGlazing(ctx, fx, -8.9, 5.4, FF + 0.05, FF + 3.0, 'ff', black)
  for (const z of [-4.0, 0.06]) k.box(r, 0.1, 2.95, 0.12, black, fx + 0.05, FF + 1.53, z)
  glazing(ctx, 'x', z0 + 0.4, -1, -15.5, -11.5, FF + 0.9, FF + 2.6, 2, black)
  glazing(ctx, 'x', z1 - 0.4, 1, -16, -11, FF + 0.1, FF + 2.6, 3, black)
  glazing(ctx, 'x', z1 - 0.4, 1, -8.5, -4.5, FF + 0.9, FF + 2.6, 2, black)
  glazing(ctx, 'z', -17.5, -1, -5, -1, FF + 0.9, FF + 2.6, 2, black)
  for (const z of BAYS) column(ctx, 2.0, z, FF, EAVE + 0.05)
  balustrade(ctx)

  // The roof, as in the drone photograph: a low, straight-sloped hip in charcoal shingles, its
  // eaves as wide as the floor band below, a charcoal fascia, a timber soffit underneath, and its
  // flat top the entertainment terrace. Dark timber soffit underneath, as photographed.
  const outer: Rect4 = [-20.6, 4.2, -12.9, 12.9]
  const inner: Rect4 = [-15.5, -3.5, -8.8, 8.8]
  const soffitMat = new MeshStandardMaterial({ color: '#5e4a3a', roughness: 0.9 })
  k.box(r, inner[1] - inner[0], TERRACE - EAVE, inner[3] - inner[2], soffitMat, (inner[0] + inner[1]) / 2, (EAVE + TERRACE) / 2 - 0.02, 0)
  const { top, edge } = sweptRoof(outer, inner, EAVE + 0.12, TERRACE, 0, 1)
  const roof = new Mesh(top, h.shingles(1, 1))
  roof.castShadow = roof.receiveShadow = true
  r.add(roof)
  const soffit = new Mesh(top, new MeshStandardMaterial({ color: '#5e4a3a', roughness: 0.9, side: BackSide }))
  soffit.position.y = -0.14
  soffit.receiveShadow = true
  r.add(soffit)
  const fascia = new Mesh(edge, new MeshStandardMaterial({ color: '#4a4b4e', roughness: 0.8, side: DoubleSide }))
  fascia.castShadow = true
  r.add(fascia)

  buildTerrace(ctx, inner)
  buildSteelStair(ctx, inner)
}

/** The sandstone balustrade of turned balusters right across the first-floor balcony. */
function balustrade(ctx: Ctx) {
  const { k } = ctx
  const r = k.root
  const x = 2.95
  const [z0, z1] = [HOUSE.z0 - 0.3, HOUSE.z1 + 0.3]
  // Turned teak balusters and square teak posts, as photographed.
  const stone = k.m.teak
  k.box(r, 0.24, 0.1, z1 - z0, stone, x, FF + 1.0, 0)
  k.box(r, 0.22, 0.12, z1 - z0, stone, x, FF + 0.08, 0)
  const geo = new CylinderGeometry(0.035, 0.055, 0.8, 8)
  for (let z = z0 + 0.12; z < z1; z += 0.19) {
    if (BAYS.some((b) => Math.abs(b - z) < 0.4)) continue
    const b = new Mesh(geo, stone)
    b.position.set(x, FF + 0.54, z)
    b.castShadow = true
    r.add(b)
  }
  for (const z of [z0, z1, ...BAYS.map((b) => b - 0.5), ...BAYS.map((b) => b + 0.5)]) k.box(r, 0.2, 1.0, 0.2, stone, x, FF + 0.5, z)
  for (const s of [-1, 1]) {
    k.box(r, 4.2, 0.1, 0.22, stone, 0.9, FF + 1.0, s * z1)
    k.box(r, 4.2, 0.9, 0.04, k.m.glass, 0.9, FF + 0.5, s * z1, false)
  }
}

/** Glass balustrade on a slim steel top rail, round a rectangle. */
function glassRail(ctx: Ctx, [x0, x1, z0, z1]: [number, number, number, number], y: number, gaps: [axis: 'x' | 'z', at: number, a: number, b: number][] = []) {
  const { k, h } = ctx
  const r = k.root
  const run = (axis: 'x' | 'z', fixed: number, a: number, b: number) => {
    const cut = gaps.find(([ax, at]) => ax === axis && Math.abs(at - fixed) < 0.01)
    const parts = cut ? [[a, cut[2]], [cut[3], b]] : [[a, b]]
    for (const [p, q] of parts) {
      const len = q - p
      const c = (p + q) / 2
      if (axis === 'x') {
        k.box(r, len, 1.0, 0.02, k.m.glass, c, y + 0.5, fixed, false)
        k.box(r, len, 0.04, 0.05, h.steel, c, y + 1.02, fixed)
      } else {
        k.box(r, 0.02, 1.0, len, k.m.glass, fixed, y + 0.5, c, false)
        k.box(r, 0.05, 0.04, len, h.steel, fixed, y + 1.02, c)
      }
    }
  }
  run('x', z0, x0, x1)
  run('x', z1, x0, x1)
  run('z', x0, z0, z1)
  run('z', x1, z0, z1)
}

/**
 * The entertainment terrace on the roof: the round alang-alang thatched bar over a river-stone
 * counter with a stone arch back-bar, sunken bonfire seating opposite, the glazed gaming and
 * home-theatre room, the stone-clad lift and stair core and the water-tank frame.
 */
function buildTerrace(ctx: Ctx, [x0, x1, z0, z1]: [number, number, number, number]) {
  const { k, h } = ctx
  const r = k.root
  const y = TERRACE
  k.box(r, x1 - x0, 0.04, z1 - z0, h.flagstone(x1 - x0, z1 - z0), (x0 + x1) / 2, y + 0.02, (z0 + z1) / 2, false)
  glassRail(ctx, [x0, x1, z0, z1], y, [['z', x0, 7.1, 8.65]])

  // The thatched bar, as photographed from above: a broad rectangular hip of shaggy alang-alang on
  // teak posts with stone bases, set toward the front of the terrace, a river-stone back-bar wall
  // rising through the back of the thatch as a chimney with a cream cap.
  const [bx, bz] = [-7.7, 1.4]
  const [thW, thD] = [6.6, 9.6]
  roundedThatch(k, h, bx, bz, y + 2.6, thW, thD, 1.5)
  for (const dx of [-thW / 2 + 0.7, thW / 2 - 0.7])
    for (const dz of [-thD / 2 + 0.8, 0, thD / 2 - 0.8]) {
      k.cyl(r, 0.11, 0.13, 2.45, k.m.teak, bx + dx, y + 1.35, bz + dz, 10)
      k.box(r, 0.34, 0.25, 0.34, h.paleStone, bx + dx, y + 0.125, bz + dz)
    }
  const backX = bx - thW / 2 + 1.1
  k.box(r, 0.7, 2.6, 3.4, h.river(3.4, 2.6), backX, y + 1.3, bz)
  k.box(r, 1.2, 1.9, 2.4, h.river(2.4, 1.9), backX, y + 3.55, bz)
  k.box(r, 1.6, 0.14, 2.8, h.cream(2.8, 1.6), backX + 0.2, y + 4.55, bz)
  k.box(r, 0.5, 0.14, 2.8, h.cream(2.8, 0.5), backX + 0.9, y + 4.3, bz)
  // Golden river-stone counter with a teak top in front of it, bar stools, and a live-edge teak
  // table to one side.
  const golden = new MeshStandardMaterial({ map: h.river(3, 1).map, color: '#e6c48e', roughness: 0.9 })
  const cX = backX + 1.6
  k.box(r, 0.75, 1.05, 3.2, golden, cX, y + 0.525, bz)
  k.box(r, 0.95, 0.08, 3.5, k.m.teak, cX, y + 1.09, bz)
  k.box(r, 0.02, 0.015, 3.0, h.lamp, cX + 0.4, y + 0.98, bz, false)
  for (const dz of [-1.1, -0.37, 0.37, 1.1]) {
    k.cyl(r, 0.17, 0.17, 0.05, k.m.teak, cX + 0.8, y + 0.78, bz + dz, 16)
    for (const [a2, b2] of [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) k.cyl(r, 0.018, 0.022, 0.76, k.m.teak, cX + 0.8 + a2, y + 0.38, bz + dz + b2, 6)
  }
  k.box(r, 1.0, 0.1, 1.8, k.m.teak, bx + 0.6, y + 0.78, bz + 3.4)
  for (const dz of [-0.6, 0.6]) k.box(r, 0.8, 0.72, 0.08, k.m.teak, bx + 0.6, y + 0.36, bz + 3.4 + dz)
  for (let i = 0; i < 9; i++) {
    const a2 = i * 2.4
    const ly = y + 1.9 - (i % 3) * 0.2
    k.sphere(r, 0.09, h.lamp, cX + Math.cos(a2) * 0.6, ly, bz + Math.sin(a2) * 1.2)
    k.cyl(r, 0.004, 0.004, y + 2.5 - ly, h.steel, cX + Math.cos(a2) * 0.6, (y + 2.5 + ly) / 2, bz + Math.sin(a2) * 1.2, 4)
  }
  // Dark glazed pots with plants along the glass rail.
  const pot = new MeshStandardMaterial({ color: '#3a3532', roughness: 0.5 })
  for (const [px, pz] of [[x1 - 0.5, 7.6], [x1 - 0.5, 4.0], [x0 + 3.6, 8.2], [x1 - 0.5, -7.8], [x0 + 6, -8.2], [-11.0, -8.2]] as const) {
    k.cyl(r, 0.28, 0.2, 0.6, pot, px, y + 0.3, pz, 16)
    k.blob(r, 0.32, k.m.leaf, px, y + 0.85, pz, 0.8)
  }

  // Sunken bonfire seating opposite the bar.
  const [fx, fz] = [-6.4, -6.2]
  const ring = new Mesh(new TorusGeometry(1.3, 0.3, 10, 40), h.river(3, 1))
  ring.rotation.x = PI / 2
  ring.scale.z = 0.7
  ring.position.set(fx, y + 0.2, fz)
  ring.castShadow = ring.receiveShadow = true
  r.add(ring)
  const cushion = new Mesh(new TorusGeometry(1.3, 0.2, 8, 40), k.m.outdoor)
  cushion.rotation.x = PI / 2
  cushion.scale.z = 0.35
  cushion.position.set(fx, y + 0.44, fz)
  r.add(cushion)
  k.cyl(r, 0.4, 0.3, 0.35, h.steel, fx, y + 0.175, fz, 24)
  k.cyl(r, 0.34, 0.34, 0.02, h.fire, fx, y + 0.36, fz, 24)

  // Gaming & home theatre across the back of the terrace: sliding glass doors with curtains between
  // brick piers, under a white scalloped awning, a taller cream wall above.
  const [gx0, gx1, gz0, gz1] = [-15.3, -11.6, -8.6, 1.4]
  const gd = gz1 - gz0
  const gh = 4.0
  k.box(r, gx1 - gx0, gh, gd, [h.cream(gd, gh), h.cream(4, gh), h.cream(4, gd), h.cream(4, gd), h.brick(4, gh), h.cream(4, gh)], (gx0 + gx1) / 2, y + gh / 2, (gz0 + gz1) / 2)
  photoGlazing(ctx, gx1 + 0.01, gz0 + 0.7, gz1 - 0.7, y + 0.02, y + 2.6, 'ff', k.m.basalt)
  for (const z of [gz0 + 0.35, gz0 + gd / 3, gz0 + (2 * gd) / 3, gz1 - 0.35]) k.box(r, 0.25, 2.8, 0.7, h.brick(0.7, 2.8), gx1 + 0.12, y + 1.4, z)
  k.box(r, 0.3, 0.2, gd + 0.2, h.cream(gd, 0.2), gx1 + 0.15, y + 2.85, (gz0 + gz1) / 2)
  const awning = k.box(r, 1.6, 0.04, gd + 0.2, h.canvas, gx1 + 0.75, y + 2.75, (gz0 + gz1) / 2)
  awning.rotation.z = -0.3
  // The scalloped valance along the awning's front edge.
  for (let z = gz0; z < gz1 - 0.1; z += 0.7) {
    const scallop = k.mesh(new CircleGeometry(0.35, 12, PI, PI), h.canvas, r, gx1 + 1.52, y + 2.52, z + 0.35, false)
    scallop.rotation.y = PI / 2
  }

  // The brick lift and stair tower behind the thatch, rising above the terrace under a small dark
  // gable roof, its front edge corbelled in steps.
  const [tx0, tx1, tz0, tz1] = [-16.8, -12.8, 1.8, 6.6]
  const tTop = y + 4.6
  k.box(r, tx1 - tx0, tTop - GF, tz1 - tz0, h.brick(4, tTop - GF), (tx0 + tx1) / 2, (tTop + GF) / 2, (tz0 + tz1) / 2)
  for (let i = 0; i < 6; i++) k.box(r, 0.25, 0.6, 0.6 + i * 0.25, h.brick(1, 0.6), tx1 + 0.12, tTop - 0.3 - i * 0.6, tz0 + 0.3 + i * 0.12)
  const tw = tx1 - tx0 + 1.0
  const tRise = 1.3
  const tSpan = (tz1 - tz0) / 2 + 0.5
  for (const s of [-1, 1]) {
    const plane = k.box(r, tw, 0.12, Math.hypot(tSpan, tRise), h.shingles(tw, tSpan), (tx0 + tx1) / 2, tTop + tRise / 2, (tz0 + tz1) / 2 + (s * tSpan) / 2)
    plane.rotation.x = s * Math.atan2(tRise, tSpan)
  }
}

/**
 * The signature staircase: folded steel plates on a sculptural spine, climbing outside the west
 * wall from a first-floor landing to the roof terrace, with a teak handrail and cluster lights.
 */
function buildSteelStair(ctx: Ctx, terrace: [number, number, number, number]) {
  const { k, h } = ctx
  const r = k.root
  const x = HOUSE.x0 - 3.8
  const za = -1.8
  // Landing off the first floor, over the arrival porch.
  k.box(r, 4.0, 0.3, 2.6, [h.cream(3, 0.3), h.cream(3, 0.3), h.deckStone(4, 2.6), h.cream(4, 2.6), h.cream(4, 0.3), h.cream(4, 0.3)], x + 1.4, FF - 0.15, za + 1.3)
  const steps = 24
  const rise = (TERRACE - FF) / steps
  const going = 0.27
  const z0 = za + 2.6
  for (let i = 0; i < steps; i++) {
    const z = z0 + (i + 0.5) * going
    const top = FF + (i + 1) * rise
    k.box(r, 1.2, 0.025, going + 0.02, h.steel, x, top - 0.0125, z)
    k.box(r, 1.2, rise, 0.02, h.steel, x, top - rise / 2, z - going / 2)
  }
  const run = steps * going
  const ang = Math.atan2(TERRACE - FF, run)
  const spine = k.box(r, 0.3, 0.4, Math.hypot(run, TERRACE - FF) + 0.4, h.steel, x, (FF + TERRACE) / 2 - 0.3, z0 + run / 2)
  spine.rotation.x = -ang
  const rail = k.cyl(r, 0.035, 0.035, Math.hypot(run, TERRACE - FF), k.m.teak, x - 0.62, (FF + TERRACE) / 2 + 0.95, z0 + run / 2, 10)
  rail.rotation.x = PI / 2 - ang
  for (let i = 0; i <= steps; i += 4) k.cyl(r, 0.012, 0.012, 0.95, h.steel, x - 0.62, FF + i * rise + 0.48, z0 + i * going, 6)
  // Bridge over the west eave onto the terrace.
  const zb = z0 + run + 0.6
  const len = terrace[0] - (x - 0.6)
  k.box(r, len, 0.08, 1.4, h.steel, x - 0.6 + len / 2, TERRACE + 0.02, zb)
  for (const s of [-1, 1]) k.box(r, len, 1.0, 0.04, k.m.glass, x - 0.6 + len / 2, TERRACE + 0.52, zb + s * 0.68, false)
  // Cluster lights hung from a steel arm over the stair.
  const arm = z0 + run / 2
  k.box(r, 0.08, TERRACE + 2.0 - FF, 0.08, h.steel, x - 1.2, (TERRACE + 2.0 + FF) / 2, arm)
  k.box(r, 1.3, 0.06, 0.06, h.steel, x - 0.6, TERRACE + 2.0, arm)
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4
    const ly = TERRACE + 0.9 - (i % 3) * 0.5
    k.sphere(r, 0.07, h.lamp, x + Math.cos(a) * 0.4, ly, arm + Math.sin(a) * 0.4)
    k.cyl(r, 0.003, 0.003, TERRACE + 2.0 - ly, h.steel, x + Math.cos(a) * 0.4, (TERRACE + 2.0 + ly) / 2, arm + Math.sin(a) * 0.4, 4)
  }
}
