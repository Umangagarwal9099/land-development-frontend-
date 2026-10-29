import { DoubleSide, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector2, type BufferGeometry, type Material, type Object3D } from 'three'
import type { Kit } from '../kit'

/*
 * Kitchen tableware for the D-65 shelves: plates, bowls, tumblers, stemmed glasses, mugs, a
 * carafe and a cutlery crock. Each piece is turned (lathed) from a real cross-section in metres:
 * a plate has its foot, well and rim; glasses have a thick base and thin walls, so light and
 * reflections behave as they do on the real thing. Every piece stands on y = 0.
 */

const P = (pts: [number, number][]) => pts.map(([r, y]) => new Vector2(r, y))

const PROFILES = {
  // Dinner and side plates: foot ring, flat well, rising rim, and back along the top surface.
  dinner: P([[0, 0.004], [0.062, 0.0], [0.07, 0.0], [0.074, 0.004], [0.1, 0.008], [0.128, 0.018], [0.135, 0.022], [0.132, 0.024], [0.122, 0.021], [0.098, 0.012], [0.072, 0.009], [0, 0.009]]),
  side: P([[0, 0.003], [0.048, 0.0], [0.054, 0.0], [0.058, 0.003], [0.08, 0.007], [0.1, 0.016], [0.105, 0.019], [0.102, 0.021], [0.093, 0.018], [0.076, 0.01], [0.056, 0.008], [0, 0.008]]),
  bowl: P([[0, 0.0], [0.032, 0.0], [0.036, 0.005], [0.056, 0.022], [0.071, 0.045], [0.076, 0.062], [0.072, 0.063], [0.067, 0.047], [0.052, 0.025], [0.033, 0.011], [0, 0.01]]),
  tumbler: P([[0, 0.0], [0.031, 0.0], [0.034, 0.004], [0.036, 0.105], [0.0335, 0.105], [0.0315, 0.012], [0, 0.012]]),
  wine: P([[0, 0.0], [0.034, 0.0], [0.035, 0.003], [0.008, 0.006], [0.0045, 0.02], [0.004, 0.075], [0.008, 0.088], [0.03, 0.105], [0.041, 0.135], [0.039, 0.175], [0.0375, 0.175], [0.0395, 0.135], [0.029, 0.107], [0.0, 0.093]]),
  mug: P([[0, 0.0], [0.039, 0.0], [0.042, 0.004], [0.042, 0.096], [0.0385, 0.096], [0.0385, 0.009], [0, 0.009]]),
  carafe: P([[0, 0.0], [0.05, 0.0], [0.054, 0.006], [0.055, 0.09], [0.042, 0.15], [0.03, 0.2], [0.032, 0.235], [0.03, 0.235], [0.028, 0.2], [0.04, 0.15], [0.052, 0.09], [0.051, 0.01], [0, 0.01]]),
  crock: P([[0, 0.0], [0.048, 0.0], [0.052, 0.006], [0.054, 0.13], [0.049, 0.13], [0.048, 0.012], [0, 0.012]]),
}
type Piece = keyof typeof PROFILES

const store = new WeakMap<Kit, { geo: Map<string, BufferGeometry>; mats: ReturnType<typeof makeMaterials> }>()

function makeMaterials() {
  return {
    // Glazed porcelain: warm white with a glassy clearcoat.
    porcelain: new MeshPhysicalMaterial({ color: '#f4f1eb', roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.12 }),
    // Reactive-glaze stoneware in charcoal and in oatmeal, for the mugs and bowls.
    charcoal: new MeshPhysicalMaterial({ color: '#3b3b3c', roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
    oatmeal: new MeshPhysicalMaterial({ color: '#d8ccb9', roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
    glass: new MeshPhysicalMaterial({ color: '#e9f2f0', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.11, clearcoat: 0.6, side: DoubleSide, depthWrite: false }),
    // Brushed stainless: a touch rough, so it reads as steel rather than mirror in a dim room.
    steel: new MeshStandardMaterial({ color: '#d7dadd', roughness: 0.32, metalness: 0.85 }),
  }
}

function lib(k: Kit) {
  let s = store.get(k)
  if (!s) store.set(k, (s = { geo: new Map(), mats: makeMaterials() }))
  return s
}

function geometry(k: Kit, key: string, make: () => BufferGeometry) {
  const { geo } = lib(k)
  let g = geo.get(key)
  if (!g) geo.set(key, (g = make()))
  return g
}

export type Glaze = 'porcelain' | 'charcoal' | 'oatmeal'

function turned(k: Kit, parent: Object3D, piece: Piece, mat: Material, x: number, y: number, z: number) {
  const m = new Mesh(geometry(k, piece, () => new LatheGeometry(PROFILES[piece], 48)), mat)
  m.position.set(x, y, z)
  const glass = piece === 'tumbler' || piece === 'wine' || piece === 'carafe'
  m.castShadow = !glass
  m.receiveShadow = true
  parent.add(m)
  return m
}

/** A neat stack of `n` dinner or side plates. */
export function plates(k: Kit, parent: Object3D, x: number, y: number, z: number, n: number, size: 'dinner' | 'side' = 'dinner', glaze: Glaze = 'porcelain') {
  const step = size === 'dinner' ? 0.0125 : 0.011
  for (let i = 0; i < n; i++) turned(k, parent, size, lib(k).mats[glaze], x, y + i * step, z).rotation.y = i * 0.7
}

/** Nested bowls. */
export function bowls(k: Kit, parent: Object3D, x: number, y: number, z: number, n: number, glaze: Glaze = 'porcelain') {
  for (let i = 0; i < n; i++) turned(k, parent, 'bowl', lib(k).mats[glaze], x, y + i * 0.021, z)
}

/** A row of tumblers along `axis`, `gap` apart. */
export function tumblers(k: Kit, parent: Object3D, x: number, y: number, z: number, n: number, axis: 'x' | 'z', gap = 0.085) {
  for (let i = 0; i < n; i++) turned(k, parent, 'tumbler', lib(k).mats.glass, x + (axis === 'x' ? i * gap : 0), y, z + (axis === 'z' ? i * gap : 0))
}

/** A row of stemmed glasses along `axis`. */
export function wineGlasses(k: Kit, parent: Object3D, x: number, y: number, z: number, n: number, axis: 'x' | 'z', gap = 0.1) {
  for (let i = 0; i < n; i++) turned(k, parent, 'wine', lib(k).mats.glass, x + (axis === 'x' ? i * gap : 0), y, z + (axis === 'z' ? i * gap : 0))
}

/** A mug with a loop handle turned towards `handle` (radians about y). */
export function mug(k: Kit, parent: Object3D, x: number, y: number, z: number, handle: number, glaze: Glaze = 'charcoal') {
  const mat = lib(k).mats[glaze]
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = handle
  parent.add(g)
  turned(k, g, 'mug', mat, 0, 0, 0)
  const h = new Mesh(geometry(k, 'mugHandle', () => new TorusGeometry(0.026, 0.0065, 10, 20, Math.PI)), mat)
  h.position.set(0.042, 0.05, 0)
  h.rotation.z = -Math.PI / 2
  h.castShadow = true
  g.add(h)
}

export function carafe(k: Kit, parent: Object3D, x: number, y: number, z: number) {
  turned(k, parent, 'carafe', lib(k).mats.glass, x, y, z)
}

/** A stoneware crock of stainless cutlery: forks, spoons and knives, fanned a little. */
export function cutleryCrock(k: Kit, parent: Object3D, x: number, y: number, z: number) {
  const { mats } = lib(k)
  const g = new Group()
  g.position.set(x, y, z)
  parent.add(g)
  turned(k, g, 'crock', mats.oatmeal, 0, 0, 0)
  const head = geometry(k, 'spoonHead', () => new SphereGeometry(1, 16, 10))
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const t = new Group()
    t.position.set(Math.cos(a) * 0.022, 0.012, Math.sin(a) * 0.022)
    t.rotation.set(Math.sin(a) * 0.16, 0, -Math.cos(a) * 0.16)
    g.add(t)
    const len = 0.17 + (i % 3) * 0.012
    k.box(t, 0.009, len, 0.003, mats.steel, 0, len / 2, 0)
    const kind = i % 3
    if (kind === 0) {
      // Spoon bowl.
      const s = new Mesh(head, mats.steel)
      s.scale.set(0.017, 0.026, 0.006)
      s.position.y = len + 0.02
      t.add(s)
    } else if (kind === 1) {
      // Fork: four tines over a widened neck.
      k.box(t, 0.02, 0.012, 0.003, mats.steel, 0, len + 0.004, 0)
      for (let j = 0; j < 4; j++) k.box(t, 0.0028, 0.03, 0.0025, mats.steel, -0.0075 + j * 0.005, len + 0.024, 0)
    } else k.box(t, 0.016, 0.06, 0.0025, mats.steel, 0.002, len + 0.03, 0)
  }
}

/* ---------- Cupboard and drawer contents ---------- */

const PROFILES_2 = {
  pot: P([[0, 0.0], [0.092, 0.0], [0.1, 0.006], [0.1, 0.12], [0.104, 0.124], [0.096, 0.124], [0.094, 0.01], [0, 0.01]]),
  lid: P([[0, 0.018], [0.03, 0.016], [0.09, 0.006], [0.104, 0.0], [0.104, 0.004], [0.09, 0.01], [0.03, 0.02], [0, 0.022]]),
  pan: P([[0, 0.0], [0.105, 0.0], [0.12, 0.012], [0.135, 0.048], [0.13, 0.05], [0.115, 0.016], [0.1, 0.006], [0, 0.006]]),
  jar: P([[0, 0.0], [0.046, 0.0], [0.05, 0.006], [0.05, 0.15], [0.044, 0.158], [0.044, 0.165], [0.041, 0.165], [0.041, 0.158], [0.046, 0.15], [0.046, 0.008], [0, 0.008]]),
  bottle: P([[0, 0.0], [0.032, 0.0], [0.034, 0.006], [0.034, 0.16], [0.02, 0.2], [0.012, 0.215], [0.012, 0.245], [0, 0.245]]),
}

function turned2(k: Kit, parent: Object3D, piece: keyof typeof PROFILES_2, mat: Material, x: number, y: number, z: number, s = 1) {
  const m = new Mesh(geometry(k, piece, () => new LatheGeometry(PROFILES_2[piece], 40)), mat)
  m.position.set(x, y, z)
  m.scale.setScalar(s)
  m.castShadow = mat !== lib(k).mats.glass
  m.receiveShadow = true
  parent.add(m)
  return m
}

const extra = new WeakMap<Kit, Record<string, Material>>()
/** Further finishes for stored goods: cookware, wood, plastics, card and linen. */
function goods(k: Kit) {
  let e = extra.get(k)
  if (!e) {
    const std = (color: string, roughness: number, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
    extra.set(k, (e = {
      cookware: std('#b8bcc0', 0.28, 0.9),
      nonstick: std('#2a2b2e', 0.5, 0.2),
      handle: std('#18181a', 0.6),
      wood: std('#a87a50', 0.6),
      lidPlastic: std('#e4e2dd', 0.45),
      clear: new MeshPhysicalMaterial({ color: '#f4f8f7', roughness: 0.15, transparent: true, opacity: 0.35, depthWrite: false }),
      tray: std('#c9c3b8', 0.7),
      pasta: std('#e3c98f', 0.8),
      lentils: std('#b5642f', 0.8),
      rice: std('#f1ece2', 0.9),
      coffee: std('#3d2a1d', 0.85),
      oil: new MeshPhysicalMaterial({ color: '#c9a23a', roughness: 0.1, transparent: true, opacity: 0.75 }),
      sauce: std('#7a1f14', 0.35),
      cardA: std('#d9cdb6', 0.8),
      cardB: std('#6f7f6a', 0.8),
      cardC: std('#b9544a', 0.8),
      linenA: std('#e8e2d6', 1),
      linenB: std('#8d9483', 1),
      silicone: std('#2d2e30', 0.7),
    }))
  }
  return e
}

/** A stainless saucepan with a lid and two short handles. */
export function pot(k: Kit, parent: Object3D, x: number, y: number, z: number, s = 1) {
  const g = goods(k)
  turned2(k, parent, 'pot', g.cookware, x, y, z, s)
  turned2(k, parent, 'lid', g.cookware, x, y + 0.124 * s, z, s)
  k.cyl(parent, 0.012 * s, 0.012 * s, 0.02 * s, g.handle, x, y + 0.155 * s, z, 12)
  for (const d of [-1, 1]) k.box(parent, 0.04 * s, 0.012 * s, 0.025 * s, g.cookware, x + d * 0.118 * s, y + 0.1 * s, z)
}

/** A non-stick frying pan with its handle along `ry`. */
export function pan(k: Kit, parent: Object3D, x: number, y: number, z: number, ry: number, s = 1) {
  const g = goods(k)
  const p = new Group()
  p.position.set(x, y, z)
  p.rotation.y = ry
  parent.add(p)
  turned2(k, p, 'pan', g.nonstick, 0, 0, 0, s)
  k.box(p, 0.03 * s, 0.018 * s, 0.17 * s, g.handle, 0, 0.04 * s, 0.21 * s)
}

/** A glass storage jar with a wooden lid, two-thirds full of `fill`. */
export function storageJar(k: Kit, parent: Object3D, x: number, y: number, z: number, fill: 'pasta' | 'lentils' | 'rice' | 'coffee', s = 1) {
  const g = goods(k)
  k.cyl(parent, 0.043 * s, 0.043 * s, 0.1 * s, g[fill], x, y + 0.058 * s, z, 20)
  turned2(k, parent, 'jar', lib(k).mats.glass, x, y, z, s)
  k.cyl(parent, 0.049 * s, 0.049 * s, 0.022 * s, g.wood, x, y + 0.172 * s, z, 24)
}

/** A clear food container with a pale lid. */
export function foodContainer(k: Kit, parent: Object3D, x: number, y: number, z: number, w: number, d: number, h: number) {
  const g = goods(k)
  k.soft(parent, w, h, d, 0.012, g.clear as MeshStandardMaterial, x, y + h / 2, z)
  k.soft(parent, w + 0.006, 0.016, d + 0.006, 0.006, g.lidPlastic as MeshStandardMaterial, x, y + h + 0.008, z)
}

export function bottle(k: Kit, parent: Object3D, x: number, y: number, z: number, kind: 'oil' | 'sauce', s = 1) {
  const g = goods(k)
  turned2(k, parent, 'bottle', kind === 'oil' ? g.oil : g.sauce, x, y, z, s)
  k.cyl(parent, 0.014 * s, 0.014 * s, 0.02 * s, g.handle, x, y + 0.255 * s, z, 12)
}

/** A packet (cereal, crackers) with a darker band printed round it. */
export function packet(k: Kit, parent: Object3D, x: number, y: number, z: number, w: number, h: number, d: number, tone: 'A' | 'B' | 'C') {
  const g = goods(k)
  const card = tone === 'A' ? g.cardA : tone === 'B' ? g.cardB : g.cardC
  k.box(parent, w, h, d, card, x, y + h / 2, z)
  k.box(parent, w + 0.002, h * 0.18, d + 0.002, g.handle, x, y + h * 0.62, z)
}

/** A folded stack of tea towels. */
export function towels(k: Kit, parent: Object3D, x: number, y: number, z: number, w: number, d: number, n: number) {
  const g = goods(k)
  for (let i = 0; i < n; i++) k.soft(parent, w, 0.022, d, 0.009, (i % 2 ? g.linenB : g.linenA) as MeshStandardMaterial, x + (i % 2) * 0.004, y + 0.011 + i * 0.022, z)
}

export function bakingTray(k: Kit, parent: Object3D, x: number, y: number, z: number, w: number, d: number) {
  const g = goods(k)
  k.box(parent, w, 0.004, d, g.nonstick, x, y + 0.002, z)
  for (const s of [-1, 1]) {
    k.box(parent, w, 0.02, 0.006, g.nonstick, x, y + 0.01, z + (s * d) / 2)
    k.box(parent, 0.006, 0.02, d, g.nonstick, x + (s * w) / 2, y + 0.01, z)
  }
}

/** One piece of flatware lying flat, pointing along z. */
function flatware(k: Kit, parent: Object3D, x: number, y: number, z: number, kind: 'fork' | 'spoon' | 'knife') {
  const { mats } = lib(k)
  k.box(parent, 0.011, 0.003, 0.12, mats.steel, x, y + 0.0015, z + 0.03)
  if (kind === 'spoon') {
    const s = new Mesh(geometry(k, 'spoonHead', () => new SphereGeometry(1, 16, 10)), mats.steel)
    s.scale.set(0.02, 0.006, 0.03)
    s.position.set(x, y + 0.006, z - 0.055)
    parent.add(s)
  } else if (kind === 'fork') {
    k.box(parent, 0.022, 0.003, 0.014, mats.steel, x, y + 0.0015, z - 0.035)
    for (let j = 0; j < 4; j++) k.box(parent, 0.003, 0.003, 0.04, mats.steel, x - 0.009 + j * 0.006, y + 0.0015, z - 0.062)
  } else k.box(parent, 0.017, 0.002, 0.08, mats.steel, x + 0.002, y + 0.001, z - 0.07)
}

/**
 * A divided oak cutlery organiser filling a drawer from x0..x1, z0..z1 at height y: forks,
 * knives and spoons in their own compartments, with a wide bay for serving pieces.
 */
export function cutleryTray(k: Kit, parent: Object3D, x0: number, x1: number, y: number, z0: number, z1: number) {
  const g = goods(k)
  const w = x1 - x0
  const d = z1 - z0
  const h = 0.05
  k.box(parent, w, 0.006, d, g.wood, (x0 + x1) / 2, y + 0.003, (z0 + z1) / 2)
  for (const x of [x0, x1]) k.box(parent, 0.008, h, d, g.wood, x, y + h / 2, (z0 + z1) / 2)
  for (const z of [z0, z1]) k.box(parent, w, h, 0.008, g.wood, (x0 + x1) / 2, y + h / 2, z)
  const kinds = ['fork', 'knife', 'spoon', 'spoon'] as const
  const cw = w / 5
  for (let c = 1; c < 5; c++) k.box(parent, 0.006, h * 0.8, d * 0.62, g.wood, x0 + cw * c, y + h * 0.4, z1 - d * 0.31)
  for (let c = 0; c < 4; c++)
    for (let i = 0; i < 3; i++) flatware(k, parent, x0 + cw * (c + 0.5) + (i - 1) * 0.004, y + 0.006 + i * 0.0035, z1 - d * 0.31, kinds[c])
  // The wide bay at the back: serving spoon, ladle and a cake slice.
  k.box(parent, w - 0.01, h * 0.8, 0.006, g.wood, (x0 + x1) / 2, y + h * 0.4, z1 - d * 0.62)
  for (let i = 0; i < 3; i++) {
    const u = utensilLying(k, parent, x0 + cw * (1 + i * 1.4), y + 0.008, z0 + d * 0.19, i === 0 ? 'spatula' : i === 1 ? 'ladle' : 'whisk')
    u.rotation.y = Math.PI / 2
    u.scale.setScalar(0.7)
  }
}

/** A cooking utensil lying flat, handle along +z. */
export function utensilLying(k: Kit, parent: Object3D, x: number, y: number, z: number, kind: 'spatula' | 'ladle' | 'whisk') {
  const g = goods(k)
  const { mats } = lib(k)
  const u = new Group()
  u.position.set(x, y, z)
  parent.add(u)
  k.box(u, 0.018, 0.01, 0.17, kind === 'spatula' ? g.wood : g.handle, 0, 0.005, 0.1)
  if (kind === 'spatula') k.box(u, 0.06, 0.006, 0.08, g.silicone, 0, 0.003, -0.03)
  else if (kind === 'ladle') {
    k.box(u, 0.008, 0.006, 0.08, mats.steel, 0, 0.004, -0.02)
    const b = new Mesh(geometry(k, 'spoonHead', () => new SphereGeometry(1, 16, 10)), mats.steel)
    b.scale.set(0.04, 0.02, 0.04)
    b.position.set(0, 0.02, -0.09)
    u.add(b)
  } else
    // Wire loops: each stands in a plane through the handle's axis, fanned round it.
    for (let i = 0; i < 4; i++) {
      const fan = new Group()
      fan.position.set(0, 0.03, -0.06)
      fan.rotation.z = (i * Math.PI) / 4
      u.add(fan)
      const loop = new Mesh(geometry(k, 'whiskLoop', () => new TorusGeometry(0.03, 0.0015, 4, 20)), mats.steel)
      loop.rotation.y = Math.PI / 2
      loop.scale.set(2.2, 1, 1)
      fan.add(loop)
    }
  return u
}
