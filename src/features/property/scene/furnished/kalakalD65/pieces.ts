import { CylinderGeometry, Group, IcosahedronGeometry, MeshPhysicalMaterial, MeshStandardMaterial, type Material, type Object3D } from 'three'
import { PI, type Kit } from '../kit'
import type { D65Materials } from './materials'

/*
 * Planting and the car for the D-65 residence. Palm and areca fronds are chains of short
 * segments that droop as they run out, each carrying a V of leaflets, so they read as fronds
 * rather than paddles from street level.
 */

type P = { k: Kit; c: D65Materials }

const clump = new WeakMap<Kit, IcosahedronGeometry>()

/** A smooth-shaded foliage clump of radius `r`, squashed by `squash`. */
function foliageClump({ k, c }: P, parent: Object3D, r: number, x: number, y: number, z: number, squash = 0.85, tone = 0) {
  let geo = clump.get(k)
  if (!geo) clump.set(k, (geo = new IcosahedronGeometry(1, 2)))
  const m = k.mesh(geo, c.foliage[tone % c.foliage.length], parent, x, y, z)
  m.scale.set(r, r * squash, r)
  return m
}

export function shrub(p: P, x: number, z: number, s: number, y = 0) {
  const parts: [number, number, number, number][] = [[0, 0.32, 0, 0.3], [0.2, 0.26, 0.1, 0.22], [-0.18, 0.28, -0.06, 0.24], [0.04, 0.48, 0.04, 0.2]]
  parts.forEach(([a, b, cc, r], i) => foliageClump(p, p.k.root, r * s, x + a * s, y + b * s, z + cc * s, 0.85, i))
}

/** A clipped hedge from xa to xb along x, `h` tall. */
export function hedge(p: P, [xa, xb]: [number, number], z: number, h: number) {
  const n = Math.max(1, Math.round((xb - xa) / 0.3))
  for (let i = 0; i < n; i++) foliageClump(p, p.k.root, 0.24, xa + ((xb - xa) * (i + 0.5)) / n, h * 0.5, z + ((i * 37) % 5) * 0.012, (h / 0.24) * 0.55, i)
}

/**
 * A frond: `n` segments from the crown, starting at `pitch` above horizontal and drooping by
 * `droop` per segment, each segment carrying a V of leaflets `w` wide that taper to the tip.
 */
function frond(p: P, parent: Object3D, yaw: number, pitch: number, len: number, w: number, n: number, droop: number, mat: Material) {
  const { k, c } = p
  let seg: Object3D = new Group()
  seg.rotation.set(-pitch, yaw, 0, 'YXZ')
  parent.add(seg)
  const sl = len / n
  for (let i = 0; i < n; i++) {
    const t = 1 - i / n
    k.box(seg, 0.025, 0.025, sl, c.trunk, 0, 0, sl / 2, false)
    for (const s of [-1, 1]) {
      const leaf = k.box(seg, w * (0.45 + 0.55 * t), 0.006, sl * 1.05, mat, s * w * 0.22 * (0.45 + 0.55 * t), -0.02, sl / 2, false)
      leaf.rotation.z = s * 0.85
    }
    const next = new Group()
    next.position.z = sl
    next.rotation.x = droop
    seg.add(next)
    seg = next
  }
}

/** A coconut palm `h` metres tall with a slightly curved, ringed trunk. */
export function palm(p: P, x: number, z: number, h: number, lean = 0.06) {
  const { k, c } = p
  const g = new Group()
  g.position.set(x, 0, z)
  g.rotation.z = lean
  k.root.add(g)
  const rings = 8
  for (let i = 0; i < rings; i++) {
    const r0 = 0.17 - (i / rings) * 0.05
    k.cyl(g, r0 - 0.008, r0, h / rings, c.trunk, Math.sin(i * 0.4) * 0.04, (h / rings) * (i + 0.5), 0, 10)
  }
  const crown = new Group()
  crown.position.set(0, h, 0)
  g.add(crown)
  k.sphere(crown, 0.26, c.frondDark, 0, 0, 0)
  for (let i = 0; i < 15; i++) {
    const yaw = (i / 15) * PI * 2 + (i % 2) * 0.2
    frond(p, crown, yaw, 0.55 - (i % 3) * 0.25, 2.9 + (i % 4) * 0.25, 0.5, 8, 0.17, i % 2 ? c.frond : c.frondDark)
  }
}

/** An areca palm in a planter, as on the reference's balcony and porch. */
export function arecaPot(p: P, x: number, z: number, s: number, y: number, pot: Material = p.c.pot) {
  const { k, c } = p
  const g = new Group()
  g.position.set(x, y, z)
  k.root.add(g)
  const potH = 0.42 * s
  k.cyl(g, 0.2 * s, 0.15 * s, potH, pot, 0, potH / 2, 0, 24)
  k.cyl(g, 0.18 * s, 0.18 * s, 0.01, c.soil, 0, potH - 0.02, 0, 16)
  const crown = new Group()
  crown.position.y = potH
  g.add(crown)
  for (let i = 0; i < 9; i++) {
    const yaw = i * 2.4
    frond(p, crown, yaw, 1.15 - (i % 3) * 0.18, (0.75 + (i % 3) * 0.18) * s, 0.2 * s, 6, 0.25, i % 2 ? c.frond : c.frondDark)
  }
}

/** A frangipani: a short forked trunk under a spreading, flat-topped crown. */
export function frangipani(p: P, x: number, z: number, s: number) {
  const { k, c } = p
  const g = new Group()
  g.position.set(x, 0, z)
  k.root.add(g)
  k.cyl(g, 0.07 * s, 0.1 * s, 1.4 * s, c.trunk, 0, 0.7 * s, 0, 10)
  for (const [a, lean] of [[0.3, 0.45], [2.4, 0.5], [4.3, 0.4]]) {
    const b = k.cyl(g, 0.04 * s, 0.06 * s, 1.0 * s, c.trunk, Math.cos(a) * 0.22 * s, 1.75 * s, Math.sin(a) * 0.22 * s, 8)
    b.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean)
  }
  const crowns: [number, number, number, number][] = [[0, 2.35, 0, 0.75], [0.55, 2.2, 0.3, 0.6], [-0.55, 2.25, -0.25, 0.62], [0.1, 2.15, -0.6, 0.55], [-0.2, 2.2, 0.6, 0.55]]
  crowns.forEach(([a, b, cc, r], i) => foliageClump(p, g, r * s, a * s, b * s, cc * s, 0.6, i))
}

/** A white compact SUV, nose out, as parked in the reference. */
export function car({ k, c }: P, x: number, z: number, y: number) {
  const g = new Group()
  g.position.set(x, y, z)
  k.root.add(g)
  const paint = new MeshPhysicalMaterial({ color: '#f1f2f2', roughness: 0.28, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 })
  const glass = new MeshStandardMaterial({ color: '#16191d', roughness: 0.05, metalness: 0.6 })
  const trim = new MeshStandardMaterial({ color: '#17181b', roughness: 0.6 })
  const rim = new MeshStandardMaterial({ color: '#b9bcc0', roughness: 0.3, metalness: 0.85 })
  // Body, a dark glasshouse with white pillars and roof, and black cladding round the base.
  k.soft(g, 1.82, 0.6, 4.4, 0.14, paint, 0, 0.7, 0)
  // Glasshouse: side glass and backlight in a box, with a raked windscreen running down to the bonnet.
  k.soft(g, 1.62, 0.44, 2.1, 0.08, glass, 0, 1.2, -0.55)
  k.soft(g, 1.6, 0.08, 2.2, 0.04, paint, 0, 1.44, -0.5)
  const screen = k.box(g, 1.5, 0.02, 0.84, glass, 0, 1.2, 0.82, false)
  screen.rotation.x = 0.62
  for (const s of [-1, 1]) {
    k.box(g, 0.07, 0.02, 0.86, paint, s * 0.76, 1.2, 0.82).rotation.x = 0.62
    k.box(g, 0.06, 0.42, 0.14, paint, s * 0.79, 1.2, -1.58)
    k.box(g, 0.04, 0.03, 2.1, rim, s * 0.6, 1.5, -0.4)
    k.box(g, 0.42, 0.06, 0.04, c.head, s * 0.6, 0.86, 2.2, false)
    k.box(g, 0.36, 0.07, 0.04, c.tail, s * 0.64, 0.9, -2.2, false)
    k.box(g, 0.16, 0.1, 0.07, paint, s * 0.95, 1.08, 0.62)
  }
  k.box(g, 1.84, 0.18, 4.42, trim, 0, 0.42, 0)
  k.box(g, 1.0, 0.24, 0.04, trim, 0, 0.66, 2.2)
  k.box(g, 1.4, 0.03, 0.04, rim, 0, 0.8, 2.21)
  const tyre = new CylinderGeometry(0.36, 0.36, 0.24, 28)
  tyre.rotateZ(PI / 2)
  const hub = new CylinderGeometry(0.23, 0.23, 0.25, 20)
  hub.rotateZ(PI / 2)
  for (const s of [-1, 1])
    for (const w of [-1.36, 1.38]) {
      k.mesh(tyre, trim, g, s * 0.82, 0.36, w)
      k.mesh(hub, rim, g, s * 0.82, 0.36, w)
    }
}
