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
