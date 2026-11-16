import { BufferGeometry, CircleGeometry, CylinderGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector3, type Material, type Object3D, type Texture } from 'three'
import { rng } from '../../../textures'
import type { CafeMaterials } from './cafeArt'
import { decal, lathe, tube } from './cafe'
import { at, mesh, PI, type Shop } from './kit'

/*
 * The café's furniture and dressing, from the reference: oak-topped high tables on black steel,
 * high stools with round oak seats on splayed black legs and a footring, the merchandise (mugs,
 * tumblers, cold cups and bags of whole beans) on oak and black-steel shelving, the condiment
 * station, and the autumn dressing: the canopy of red and orange maple leaves hung from the
 * ceiling over the entrance, leaves fallen on the floor, pumpkins, and chrysanthemums in pots
 * and wicker baskets. Each piece faces local +z.
 */

/* ---------- seating ---------- */

/** A high stool: a round oak seat, dished and eased at its edge, on four splayed black-steel legs with a footring. */
export function stool(s: Shop, c: CafeMaterials, p: Object3D, x: number, z: number, yaw = 0) {
  const { k } = s.e
  const g = at(p, x, s.y, z, yaw)
  const H = 0.75
  lathe(g, [[0.001, 0], [0.16, 0], [0.172, 0.008], [0.175, 0.02], [0.17, 0.034], [0.158, 0.038], [0.08, 0.032], [0.001, 0.03]], c.oak, 0, H - 0.038, 0, 40)
  k.cyl(g, 0.1, 0.1, 0.012, c.blackMatte, 0, H - 0.044, 0, 24)
  for (let i = 0; i < 4; i++) {
    const a = PI / 4 + (i * PI) / 2
    tube(g, [Math.cos(a) * 0.09, H - 0.045, Math.sin(a) * 0.09], [Math.cos(a) * 0.2, 0.0, Math.sin(a) * 0.2], 0.011, c.blackMatte, 10)
    k.cyl(g, 0.013, 0.013, 0.008, c.rubber, Math.cos(a) * 0.2, 0.004, Math.sin(a) * 0.2, 10)
  }
  const ring = mesh(g, new TorusGeometry(0.168, 0.008, 8, 40), c.blackMatte, 0, 0.3, 0)
  ring.rotation.x = PI / 2
  s.e.shade.pool(x, s.y + 0.012, z, 0.26, 0.26, 0.35)
  return g
}

/** A long high table: an oak top 40 mm thick at 1.05 m on two black-steel T-frames, a stretcher and a foot rail. */
export function highTable(s: Shop, c: CafeMaterials, p: Object3D, x: number, z: number, yaw: number, len: number, w: number) {
  const { k } = s.e
  const g = at(p, x, s.y, z, yaw)
  const H = 1.05
  k.soft(g, w, 0.04, len, 0.006, c.oak, 0, H - 0.02, 0)
  for (const sz of [-1, 1]) {
    const lz = sz * (len / 2 - 0.22)
    k.box(g, 0.05, H - 0.07, 0.05, c.blackMatte, 0, (H - 0.07) / 2 + 0.01, lz)
    k.box(g, w - 0.12, 0.03, 0.06, c.blackMatte, 0, 0.015, lz)
    k.box(g, w - 0.1, 0.03, 0.04, c.blackMatte, 0, H - 0.055, lz)
    for (const sx of [-1, 1]) k.box(g, 0.05, 0.008, 0.07, c.rubber, sx * (w / 2 - 0.08), 0.004, lz, false)
  }
  k.box(g, 0.04, 0.04, len - 0.44, c.blackMatte, 0, H - 0.09, 0)
  k.box(g, 0.03, 0.03, len - 0.44, c.blackMatte, 0, 0.27, 0)
  s.e.shade.rect(x, s.y + 0.012, z, w, len, yaw, 0.3)
  return g
}

/** A round high table: an oak disc on a black-steel column and a four-footed cross base. */
export function roundHighTable(s: Shop, c: CafeMaterials, p: Object3D, x: number, z: number, r: number) {
  const { k } = s.e
  const g = at(p, x, s.y, z, 0)
  const H = 1.05
  lathe(g, [[0.001, 0], [r - 0.006, 0], [r, 0.006], [r, 0.034], [r - 0.006, 0.04], [0.001, 0.04]], c.oak, 0, H - 0.04, 0, 48)
  k.cyl(g, 0.035, 0.035, H - 0.05, c.blackMatte, 0, (H - 0.05) / 2, 0, 20)
  k.cyl(g, 0.12, 0.12, 0.012, c.blackMatte, 0, H - 0.046, 0, 24)
  for (let i = 0; i < 4; i++) {
    const a = PI / 4 + (i * PI) / 2
    const f = k.box(g, 0.32, 0.03, 0.05, c.blackMatte, Math.cos(a) * 0.16, 0.015, Math.sin(a) * 0.16)
    f.rotation.y = -a
  }
  const ring = mesh(g, new TorusGeometry(0.16, 0.01, 8, 36), c.blackMatte, 0, 0.27, 0)
  ring.rotation.x = PI / 2
  for (let i = 0; i < 4; i++) {
    const a = PI / 4 + (i * PI) / 2
    tube(g, [Math.cos(a) * 0.03, 0.27, Math.sin(a) * 0.03], [Math.cos(a) * 0.16, 0.27, Math.sin(a) * 0.16], 0.008, c.blackMatte, 8)
  }
  s.e.shade.pool(x, s.y + 0.012, z, r * 1.1, r * 1.1, 0.35)
  return g
}

/* ---------- the autumn dressing ---------- */

let pumpkinGeo: BufferGeometry | null = null
/** A pumpkin's body: a squat sphere grooved into ten ribs, dimpled at the stalk. */
function pumpkinGeometry() {
  if (pumpkinGeo) return pumpkinGeo
  const geo = new SphereGeometry(1, 40, 20)
  const pos = geo.attributes.position
  const v = new Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const phi = Math.atan2(v.z, v.x)
    const groove = 1 - 0.1 * Math.exp(-(Math.sin(phi * 5) ** 2) / 0.04)
    const pole = 1 - 0.25 * Math.max(0, Math.abs(v.y) - 0.75) * 4
    v.x *= groove
    v.z *= groove
    v.y *= 0.66 * pole
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  pumpkinGeo = geo
  return geo
}

export function pumpkin(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, r: number, pale = false) {
  const g = at(p, x, y, z, r * 37)
  const body = mesh(g, pumpkinGeometry(), pale ? c.pumpkinPale : c.pumpkin, 0, r * 0.62, 0)
  body.scale.setScalar(r)
  const stalk = s.e.k.cyl(g, r * 0.08, r * 0.12, r * 0.35, c.stalk, 0, r * 1.25, 0, 8)
  stalk.rotation.z = 0.25
  return g
}

/** A mound of chrysanthemums: dark foliage and a dome of flower heads in the given tones. */
function mums(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, r: number, seed: number) {
  const { k } = s.e
  const rand = rng(seed)
  const g = at(p, x, y, z, 0)
  for (let i = 0; i < 5; i++) k.blob(g, r * 0.45, c.foliage, (rand() - 0.5) * r, r * 0.25, (rand() - 0.5) * r, 0.6)
  const tones = [c.mumOrange, c.mumGold, c.mumRust]
  const n = Math.round(26 * (r / 0.15) ** 2)
  for (let i = 0; i < n; i++) {
    const a = rand() * PI * 2
    const d = Math.sqrt(rand()) * r
    const h = Math.sqrt(Math.max(0, r * r - d * d)) * 0.6 + r * 0.25
    const head = k.sphere(g, 0.018 + rand() * 0.01, tones[(seed + i) % 3], Math.cos(a) * d, h, Math.sin(a) * d)
    head.scale.y = 0.6
  }
  return g
}

/** Chrysanthemums in a pot (terracotta) or a wicker basket on the floor or a table. */
export function flowerPot(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, r: number, kind: 'pot' | 'basket', seed: number) {
  const g = at(p, x, y, z, seed)
  const h = r * (kind === 'pot' ? 1.0 : 0.85)
  lathe(g, [[0.001, 0], [r * 0.75, 0], [r, h], [r * 1.04, h], [r * 1.04, h + r * 0.06], [r * 0.95, h + r * 0.06], [r * 0.9, h * 0.3], [0.001, h * 0.3]], kind === 'pot' ? c.terracotta : c.wicker, 0, 0, 0, 28)
  if (kind === 'basket') {
    for (let i = 1; i < 5; i++) {
      const t = i / 5
      const ring = mesh(g, new TorusGeometry(r * (0.75 + 0.25 * t) + 0.002, 0.004, 5, 28), c.wicker, 0, h * t, 0, false)
      ring.rotation.x = PI / 2
    }
    // A handle over the top.
    const handle = mesh(g, new TorusGeometry(r * 0.9, 0.008, 6, 24, PI), c.wicker, 0, h + 0.02, 0)
    handle.rotation.y = PI / 2
  }
  mums(s, c, g, 0, h, 0, r * 0.95, seed)
  s.e.shade.pool(x, s.y + 0.012, z, r * 1.3, r * 1.3, 0.35)
  return g
}

/** A small autumn arrangement for a table: a pumpkin or two, a pot of mums, a few fallen leaves. */
export function tableDressing(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, seed: number) {
  const rand = rng(seed)
  flowerPot(s, c, p, x, y, z, 0.075, rand() < 0.5 ? 'pot' : 'basket', seed)
  pumpkin(s, c, p, x + 0.13, y, z + 0.06, 0.05, rand() < 0.3)
  if (rand() < 0.6) pumpkin(s, c, p, x - 0.12, y, z - 0.05, 0.035, true)
}

/**
 * The canopy of autumn leaves: strands of maple leaves hung from the ceiling at `top`, thick at
 * the top and thinning as they fall, where `where(x, z)` says (and as long as `drop(x, z)` says
 * there). One mesh of alpha-cut quads, leaves from the painted atlas.
 */
export function leafCanopy(c: CafeMaterials, p: Object3D, box: [number, number, number, number], top: number, strands: number, where: (x: number, z: number) => boolean, drop: (x: number, z: number) => number, seed: number) {
  const rand = rng(seed)
  const pos: number[] = []
  const uv: number[] = []
  const nor: number[] = []
  const quad = (cx: number, cy: number, cz: number, size: number, yaw: number, tilt: number, cell: number) => {
    // A leaf hangs from its stalk: its plane turned by yaw, tipped by tilt.
    const ux = Math.cos(yaw)
    const uz = -Math.sin(yaw)
    const ct = Math.cos(tilt)
    const st = Math.sin(tilt)
    const vx = Math.sin(yaw) * st
    const vy = ct
    const vz = Math.cos(yaw) * st
    const h = size / 2
    const corners = [[-h, -h], [h, -h], [h, h], [-h, h]]
    const col = cell % 4
    const row = Math.floor(cell / 4)
    const u0 = col / 4
    const v0 = 1 - (row + 1) / 2
    const cuv = [[u0, v0], [u0 + 0.25, v0], [u0 + 0.25, v0 + 0.5], [u0, v0 + 0.5]]
    const nx = uz * vy - 0
    const ny = 0
    const nz = -ux * vy
    for (const i of [0, 1, 2, 0, 2, 3]) {
      const [a, b] = corners[i]
      pos.push(cx + ux * a + vx * b, cy + vy * b, cz + uz * a + vz * b)
      uv.push(cuv[i][0], cuv[i][1])
      nor.push(nx, ny + 0.4, nz)
    }
  }
  let made = 0
  let tries = 0
  while (made < strands && tries < strands * 20) {
    tries++
    const x = box[0] + rand() * (box[1] - box[0])
    const z = box[2] + rand() * (box[3] - box[2])
    if (!where(x, z)) continue
    made++
    const len = drop(x, z) * (0.35 + rand() * 0.65)
    const n = Math.max(3, Math.round(len / 0.045))
    let sx = x
    let sz = z
    for (let i = 0; i < n; i++) {
      const t = i / n
      sx += (rand() - 0.5) * 0.03
      sz += (rand() - 0.5) * 0.03
      const y = top - 0.03 - t * len
      const size = 0.12 + rand() * 0.09
      quad(sx + (rand() - 0.5) * 0.08, y, sz + (rand() - 0.5) * 0.08, size, rand() * PI * 2, (rand() - 0.5) * 1.2, Math.floor(rand() * 8))
      // The top is thick: a second leaf at every step there.
      if (t < 0.4) quad(sx + (rand() - 0.5) * 0.14, y + 0.02, sz + (rand() - 0.5) * 0.14, size, rand() * PI * 2, PI / 2 - rand() * 0.6, Math.floor(rand() * 8))
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  geo.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geo.computeVertexNormals()
  const m = new Mesh(geo, c.leaves)
  m.castShadow = false
  m.receiveShadow = true
  m.name = 'sbux_canopy'
  p.add(m)
  return m
}

/** Leaves fallen on the floor, lying flat, scattered where `where` says. */
export function fallenLeaves(c: CafeMaterials, p: Object3D, box: [number, number, number, number], y: number, n: number, where: (x: number, z: number) => boolean, seed: number) {
  const rand = rng(seed)
  const pos: number[] = []
  const uv: number[] = []
  let made = 0
  let tries = 0
  while (made < n && tries < n * 30) {
    tries++
    const x = box[0] + rand() * (box[1] - box[0])
    const z = box[2] + rand() * (box[3] - box[2])
    if (!where(x, z)) continue
    made++
    const s = 0.05 + rand() * 0.035
    const a = rand() * PI * 2
    const cell = Math.floor(rand() * 8)
    const col = cell % 4
    const row = Math.floor(cell / 4)
    const u0 = col / 4
    const v0 = 1 - (row + 1) / 2
    const corner = (dx: number, dz: number) => [x + Math.cos(a) * dx - Math.sin(a) * dz, y + rand() * 0.002, z + Math.sin(a) * dx + Math.cos(a) * dz]
    const q = [corner(-s, s), corner(s, s), corner(s, -s), corner(-s, -s)]
    const cuv = [[u0, v0], [u0 + 0.25, v0], [u0 + 0.25, v0 + 0.5], [u0, v0 + 0.5]]
    for (const i of [0, 1, 2, 0, 2, 3]) {
      pos.push(...q[i])
      uv.push(cuv[i][0], cuv[i][1])
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geo.computeVertexNormals()
  const m = new Mesh(geo, c.leaves)
  m.receiveShadow = true
  m.name = 'sbux_fallen'
  p.add(m)
  return m
}

/* ---------- signs ---------- */

/** A lit siren disc, `r` across its radius, double-faced or flat to a wall, with a black rim. */
export function sirenDisc(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, yaw: number, r: number, lit: Material, both: boolean) {
  const g = at(p, x, y, z, yaw)
  const depth = 0.06
  const rim = mesh(g, new CylinderGeometry(r + 0.012, r + 0.012, depth, 64, 1, true), c.blackGloss, 0, 0, 0)
  rim.rotation.x = PI / 2
  const face = mesh(g, new CircleGeometry(r, 64), lit, 0, 0, depth / 2 + 0.001, false)
  face.userData.front = true
  if (both) {
    const back = mesh(g, new CircleGeometry(r, 64), lit, 0, 0, -depth / 2 - 0.001, false)
    back.rotation.y = PI
  } else mesh(g, new CircleGeometry(r + 0.012, 64), c.blackMatte, 0, 0, -depth / 2, false).rotation.y = PI
  void s
  return g
}

/* ---------- merchandise ---------- */

/** A mug: a ceramic body with a foot, a looped handle, the siren on its face. */
export function mug(s: Shop, _c: CafeMaterials, p: Object3D, x: number, y: number, z: number, yaw: number, body: Material, siren: Material, scale = 1) {
  const g = at(p, x, y, z, yaw)
  g.scale.setScalar(scale)
  lathe(g, [[0.001, 0], [0.034, 0], [0.038, 0.006], [0.042, 0.09], [0.044, 0.1], [0.04, 0.1], [0.036, 0.012], [0.001, 0.012]], body, 0, 0, 0, 28)
  const h = mesh(g, new TorusGeometry(0.026, 0.0065, 8, 18, PI * 1.1), body, -0.045, 0.052, 0)
  h.rotation.z = PI / 2 + 0.05
  h.rotation.y = 0
  decal(g, siren, 0.04, 0.04, 0.0, 0.055, 0.0412, 0)
  void s
  return g
}

/** An insulated tumbler: a steel body, a black press lid, the green siren on it. */
export function tumbler(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, yaw: number, body: Material, siren: Material) {
  const g = at(p, x, y, z, yaw)
  lathe(g, [[0.001, 0], [0.032, 0], [0.035, 0.008], [0.04, 0.17], [0.001, 0.17]], body, 0, 0, 0, 28)
  lathe(g, [[0.001, 0.17], [0.041, 0.17], [0.041, 0.19], [0.036, 0.2], [0.001, 0.2]], c.blackGloss, 0, 0, 0, 28)
  s.e.k.box(g, 0.02, 0.006, 0.01, c.blackMatte, 0, 0.202, 0.02, false)
  decal(g, siren, 0.045, 0.045, 0, 0.1, 0.0385, 0)
  return g
}

/** A reusable cold cup: tinted plastic, the domed lid and a straw. */
export function reusableCup(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, tint: Material) {
  const g = at(p, x, y, z, 0)
  lathe(g, [[0.001, 0], [0.033, 0], [0.046, 0.17], [0.048, 0.17], [0.035, 0.003], [0.001, 0.003]], tint, 0, 0, 0, 24, false)
  const dome = mesh(g, new SphereGeometry(0.048, 20, 8, 0, PI * 2, 0, PI / 2), tint, 0, 0.17, 0, false)
  dome.scale.y = 0.4
  tube(g, [0.01, 0.05, 0], [0.016, 0.26, 0.004], 0.0035, c.greenBody, 6)
  void s
  return g
}

const bagMats = new WeakMap<Texture, MeshStandardMaterial[]>()
/** A bag of whole beans standing on its gusset: a soft foil body, its front label (one of four roasts), a valve and the fold. */
export function beanBag(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, yaw: number, roast: number) {
  let mats = bagMats.get(c.bags)
  if (!mats) {
    mats = [0, 1, 2, 3].map((i) => {
      const t = c.bags.clone()
      t.needsUpdate = true
      t.repeat.set(0.25, 1)
      t.offset.set(i * 0.25, 0)
      return c.std({ map: t, roughness: 0.45, metalness: 0.15 }, 0.4)
    })
    bagMats.set(c.bags, mats)
  }
  const tones = ['#8b5a2b', '#e9c88a', '#3b2418', '#b8501f']
  const body = c.std({ color: tones[roast % 4], roughness: 0.45, metalness: 0.15 }, 0.4)
  const g = at(p, x, y, z, yaw)
  s.e.k.soft(g, 0.12, 0.2, 0.07, 0.012, body, 0, 0.1, 0)
  s.e.k.box(g, 0.118, 0.03, 0.05, body, 0, 0.212, 0)
  decal(g, mats[roast % 4], 0.11, 0.18, 0, 0.1, 0.0362, 0)
  return g
}

/* ---------- fittings ---------- */

/**
 * Wall shelving of oak boards on black-steel ladders, `len` long, its back on local z = 0 and the
 * shelves towards +z at the heights given, with a closed oak base. Returns the shelf heights' tops.
 */
export function shelving(s: Shop, c: CafeMaterials, p: Object3D, x: number, z: number, yaw: number, len: number, depth: number, shelves: number[], base = 0.45) {
  const { k } = s.e
  const g = at(p, x, s.y, z, yaw)
  k.box(g, len, base, depth, c.walnutBoards, 0, base / 2, depth / 2)
  k.box(g, len + 0.02, 0.03, depth + 0.02, c.oak, 0, base + 0.015, depth / 2)
  const top = shelves[shelves.length - 1]
  const bays = Math.max(1, Math.round(len / 0.75))
  for (let i = 0; i <= bays; i++) {
    const u = -len / 2 + 0.02 + (i * (len - 0.04)) / bays
    k.box(g, 0.025, top - base + 0.04, 0.025, c.blackMatte, u, base + (top - base) / 2 + 0.02, 0.02)
    k.box(g, 0.025, top - base + 0.04, 0.025, c.blackMatte, u, base + (top - base) / 2 + 0.02, depth - 0.02)
  }
  for (const h of shelves) k.box(g, len, 0.03, depth, c.oak, 0, h - 0.015, depth / 2)
  s.e.shade.rect(x, s.y + 0.012, z, len, depth, yaw, 0.3)
  return { g, top: (i: number) => (i < 0 ? base + 0.03 : shelves[i]) }
}

/** A small wall-hung shelf of oak on black brackets, `len` long, its back on local z = 0. */
export function wallShelf(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, yaw: number, len: number, depth: number) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.box(g, len, 0.03, depth, c.oak, 0, -0.015, depth / 2)
  for (const u of [-len / 2 + 0.15, len / 2 - 0.15]) {
    k.box(g, 0.012, 0.12, 0.012, c.blackMatte, u, -0.09, 0.006)
    tube(g, [u, -0.14, 0.006], [u, -0.03, depth - 0.03], 0.005, c.blackMatte, 6)
  }
  return g
}

