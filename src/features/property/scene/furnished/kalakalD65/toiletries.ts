import { CylinderGeometry, DoubleSide, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, TorusGeometry, Vector2, type BufferGeometry, type Material, type Object3D } from 'three'
import type { Kit } from '../kit'
import { rng, type Paint } from '../textures'

/*
 * Bathroom products and textiles, at real sizes: pump dispensers in amber glass, shampoo,
 * conditioner and body-wash bottles with printed labels, toothbrushes, toothpaste, soap, toilet
 * rolls and towels. Bottles are turned from real profiles (shoulder, neck, base); labels are
 * wrapped bands with a quiet printed design, no brand names. Everything stands on y = 0.
 */

const P = (pts: [number, number][]) => pts.map(([r, y]) => new Vector2(r, y))

const PROFILES = {
  // 300 ml Boston round in amber glass.
  boston: P([[0, 0], [0.032, 0], [0.034, 0.004], [0.034, 0.12], [0.03, 0.135], [0.015, 0.148], [0.012, 0.16], [0, 0.16]]),
  // 400 ml shampoo: tall, gently tapered.
  shampoo: P([[0, 0], [0.034, 0], [0.036, 0.006], [0.035, 0.17], [0.03, 0.19], [0.016, 0.205], [0.014, 0.215], [0, 0.215]]),
  // Conditioner stands on its cap: a soft-shouldered tube.
  conditioner: P([[0, 0], [0.024, 0], [0.026, 0.004], [0.031, 0.04], [0.032, 0.17], [0.029, 0.185], [0, 0.19]]),
  body: P([[0, 0], [0.03, 0], [0.032, 0.006], [0.032, 0.15], [0.026, 0.168], [0.013, 0.178], [0, 0.18]]),
  cup: P([[0, 0], [0.032, 0], [0.034, 0.005], [0.036, 0.1], [0.033, 0.1], [0.031, 0.01], [0, 0.01]]),
  roll: P([[0.022, 0], [0.058, 0], [0.058, 0.1], [0.022, 0.1], [0.02, 0.1], [0.02, 0], [0.022, 0]]),
}
type Profile = keyof typeof PROFILES

/** A printed label: a pale band with a fine rule and blocks of "type", in the product's colour. */
const label = (ink: string, ground: string, seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = ground
  g.fillRect(0, 0, w, h)
  g.fillStyle = ink
  g.fillRect(w * 0.1, h * 0.2, w * 0.35, h * 0.08)
  g.fillRect(w * 0.1, h * 0.34, w * 0.22, h * 0.04)
  for (let i = 0; i < 6; i++) g.fillRect(w * 0.1, h * (0.55 + i * 0.06), w * (0.2 + r() * 0.2), h * 0.02)
  g.fillRect(w * 0.6, h * 0.2, w * 0.25, h * 0.02)
}

interface Lib {
  geo: Map<string, BufferGeometry>
  mats: Record<string, Material>
}
const libs = new WeakMap<Kit, Lib>()

function lib(k: Kit): Lib {
  let l = libs.get(k)
  if (l) return l
  const std = (color: string, roughness: number, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
  const labelMat = (ink: string, ground: string, seed: number) => new MeshStandardMaterial({ map: k.tex.painted(256, 128, label(ink, ground, seed)), roughness: 0.6 })
  l = {
    geo: new Map(),
    mats: {
      amber: new MeshPhysicalMaterial({ color: '#7a3d10', roughness: 0.08, transparent: true, opacity: 0.88, clearcoat: 1 }),
      blackPump: std('#151516', 0.4, 0.2),
      whitePlastic: std('#efece6', 0.35),
      sagePlastic: std('#a6ad98', 0.4),
      taupePlastic: std('#b9a690', 0.4),
      chrome: std('#d9dcdf', 0.15, 1),
      ceramic: new MeshPhysicalMaterial({ color: '#f1ede7', roughness: 0.25, clearcoat: 0.8 }),
      paper: std('#f5f3ee', 0.95),
      cardInside: new MeshStandardMaterial({ color: '#c9b9a0', roughness: 0.9, side: DoubleSide }),
      soap: new MeshPhysicalMaterial({ color: '#e7dccb', roughness: 0.5, clearcoat: 0.3 }),
      bristle: std('#e9edf0', 0.8),
      brushA: std('#9fb3a8', 0.35),
      brushB: std('#d8cbb8', 0.35),
      tube: std('#f2efe9', 0.3),
      labelAmber: labelMat('#2a2422', '#e9e0d1', 1),
      labelSage: labelMat('#3c4438', '#eef0ea', 2),
      labelTaupe: labelMat('#3d3128', '#f1ebe2', 3),
      labelWhite: labelMat('#4a5a64', '#ffffff', 4),
      towel: towelMat(k, '#f1ede6', 5),
      towelGrey: towelMat(k, '#bdb5aa', 6),
    },
  }
  libs.set(k, l)
  return l
}

/** Terry towelling: a dense loop texture with a soft sheen. */
function towelMat(k: Kit, tone: string, seed: number) {
  const paint: Paint = (g, w, h) => {
    const r = rng(seed)
    g.fillStyle = tone
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.12})`
      g.beginPath()
      g.arc(r() * w, r() * h, 0.8 + r() * 1.2, 0, 7)
      g.fill()
    }
  }
  const map = k.tex.painted(128, 128, paint)
  map.repeat.set(3, 3)
  return new MeshPhysicalMaterial({ map, normalMap: k.tex.normalPainted(`towel_${seed}`, 128, 128, paint, 3, 3), normalScale: new Vector2(0.6, 0.6), roughness: 1, sheen: 0.6, sheenRoughness: 0.8, sheenColor: '#ffffff' })
}

function turned(k: Kit, parent: Object3D, profile: Profile, mat: Material, x: number, y: number, z: number, s = 1) {
  const l = lib(k)
  let g = l.geo.get(profile)
  if (!g) l.geo.set(profile, (g = new LatheGeometry(PROFILES[profile], 32)))
  const m = new Mesh(g, mat)
  m.position.set(x, y, z)
  m.scale.setScalar(s)
  m.castShadow = true
  m.receiveShadow = true
  parent.add(m)
  return m
}

/** A label band wrapped round a bottle, from h0 to h1 at radius r. */
function band(parent: Object3D, mat: Material, x: number, z: number, r: number, h0: number, h1: number) {
  const m = new Mesh(new CylinderGeometry(r, r, h1 - h0, 32, 1, true, -Math.PI / 2, Math.PI), mat)
  m.position.set(x, (h0 + h1) / 2, z)
  parent.add(m)
}

/** A lotion pump: collar, stem and an angled head with its nozzle. */
function pump(k: Kit, parent: Object3D, mat: Material, x: number, y: number, z: number, yaw = 0) {
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = yaw
  parent.add(g)
  k.cyl(g, 0.014, 0.014, 0.016, mat, 0, 0.008, 0, 20)
  k.cyl(g, 0.004, 0.004, 0.03, mat, 0, 0.03, 0, 10)
  k.box(g, 0.018, 0.012, 0.03, mat, 0, 0.048, 0.006)
  const nozzle = k.cyl(g, 0.003, 0.003, 0.03, mat, 0, 0.05, 0.03, 8)
  nozzle.rotation.x = Math.PI / 2
}

export type Product = 'handwash' | 'lotion' | 'shampoo' | 'conditioner' | 'bodywash'

/** One bottle of a product, with its closure and label. */
export function bottle(k: Kit, parent: Object3D, kind: Product, x: number, y: number, z: number, yaw = 0) {
  const { mats } = lib(k)
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = yaw
  parent.add(g)
  if (kind === 'handwash' || kind === 'lotion') {
    turned(k, g, 'boston', mats.amber, 0, 0, 0, kind === 'lotion' ? 0.85 : 1)
    band(g, mats.labelAmber, 0, 0, (kind === 'lotion' ? 0.85 : 1) * 0.0345, 0.03, 0.09)
    pump(k, g, mats.blackPump, 0, (kind === 'lotion' ? 0.85 : 1) * 0.16, 0)
  } else if (kind === 'shampoo') {
    turned(k, g, 'shampoo', mats.sagePlastic, 0, 0, 0)
    band(g, mats.labelSage, 0, 0, 0.0355, 0.04, 0.14)
    pump(k, g, mats.whitePlastic, 0, 0.215, 0)
  } else if (kind === 'conditioner') {
    // Stands on its flip-top cap.
    k.cyl(g, 0.024, 0.024, 0.022, mats.whitePlastic, 0, 0.011, 0, 24)
    turned(k, g, 'conditioner', mats.taupePlastic, 0, 0.02, 0)
    band(g, mats.labelTaupe, 0, 0, 0.0322, 0.08, 0.18)
  } else {
    turned(k, g, 'body', mats.whitePlastic, 0, 0, 0)
    band(g, mats.labelWhite, 0, 0, 0.0325, 0.03, 0.12)
    k.cyl(g, 0.014, 0.016, 0.022, mats.blackPump, 0, 0.19, 0, 18)
  }
}

/** A ceramic cup with two toothbrushes, and a tube of toothpaste leaning beside it. */
export function toothbrushes(k: Kit, parent: Object3D, x: number, y: number, z: number) {
  const { mats } = lib(k)
  turned(k, parent, 'cup', mats.ceramic, x, y, z)
  for (const [i, m] of [mats.brushA, mats.brushB].entries()) {
    const b = new Group()
    b.position.set(x + (i ? 0.008 : -0.008), y + 0.015, z)
    b.rotation.set(i ? 0.12 : -0.1, 0, i ? -0.14 : 0.16)
    parent.add(b)
    k.cyl(b, 0.005, 0.0045, 0.16, m, 0, 0.08, 0, 10)
    k.box(b, 0.011, 0.025, 0.012, mats.bristle, 0, 0.175, 0.006)
  }
  // Toothpaste: a flattened tube, crimped end up, cap down.
  const t = new Group()
  t.position.set(x + 0.06, y, z + 0.02)
  t.rotation.z = -0.15
  parent.add(t)
  k.cyl(t, 0.012, 0.012, 0.016, mats.whitePlastic, 0, 0.008, 0, 16)
  const body = k.cyl(t, 0.017, 0.016, 0.15, mats.tube, 0, 0.09, 0, 20)
  body.scale.z = 0.6
  k.box(t, 0.036, 0.012, 0.005, mats.tube, 0, 0.17, 0)
}

/** A bar of soap on a ceramic dish. */
export function soapDish(k: Kit, parent: Object3D, x: number, y: number, z: number) {
  const { mats } = lib(k)
  k.soft(parent, 0.12, 0.012, 0.08, 0.005, mats.ceramic as MeshStandardMaterial, x, y + 0.006, z)
  k.soft(parent, 0.08, 0.022, 0.05, 0.009, mats.soap as MeshStandardMaterial, x, y + 0.023, z)
}

/** A toilet roll: a lathed tube of paper round a card core; `lying` turns it onto a holder's arm (along x). */
export function toiletRoll(k: Kit, parent: Object3D, x: number, y: number, z: number, lying = false) {
  const { mats } = lib(k)
  const g = new Group()
  g.position.set(x, y, z)
  if (lying) g.rotation.z = Math.PI / 2
  parent.add(g)
  turned(k, g, 'roll', mats.paper, 0, lying ? -0.05 : 0, 0)
  const core = new Mesh(new CylinderGeometry(0.0195, 0.0195, 0.1, 20, 1, true), mats.cardInside)
  core.position.y = lying ? 0 : 0.05
  g.add(core)
}

/** A rolled towel lying on its side along x: a thick cylinder with the spiral visible at each end. */
export function rolledTowel(k: Kit, parent: Object3D, x: number, y: number, z: number, len = 0.3, grey = false) {
  const { mats } = lib(k)
  const mat = grey ? mats.towelGrey : mats.towel
  const body = k.cyl(parent, 0.055, 0.055, len, mat, x, y + 0.055, z, 28)
  body.rotation.z = Math.PI / 2
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const ring = new Mesh(new TorusGeometry(0.015 + i * 0.015, 0.006, 6, 24), mat)
      ring.rotation.y = Math.PI / 2
      ring.position.set(x + (s * len) / 2, y + 0.055, z)
      parent.add(ring)
    }
}

/** A towel folded in thirds and hung over a bar (bar along x, at the given height). */
export function hungTowel(k: Kit, parent: Object3D, x: number, y: number, z: number, width: number, drop: number, grey = false) {
  const { mats } = lib(k)
  const mat = (grey ? mats.towelGrey : mats.towel) as MeshStandardMaterial
  k.soft(parent, width, drop, 0.018, 0.008, mat, x, y - drop / 2, z - 0.018)
  k.soft(parent, width, drop * 0.9, 0.018, 0.008, mat, x, y - drop * 0.45, z + 0.018)
  const top = k.cyl(parent, 0.022, 0.022, width, mat, x, y + 0.004, z, 20)
  top.rotation.z = Math.PI / 2
}

/** A neatly folded towel stack. */
export function foldedTowels(k: Kit, parent: Object3D, x: number, y: number, z: number, w: number, d: number, n: number, grey = false) {
  const { mats } = lib(k)
  for (let i = 0; i < n; i++) k.soft(parent, w, 0.04, d, 0.016, (grey && i % 2 ? mats.towelGrey : mats.towel) as MeshStandardMaterial, x + (i % 2) * 0.004, y + 0.02 + i * 0.04, z)
}
