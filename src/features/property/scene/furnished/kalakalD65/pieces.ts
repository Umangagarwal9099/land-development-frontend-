import { Group, IcosahedronGeometry, type Material, type Object3D } from 'three'
import { parkedCar } from '../car'
import { PI, type Kit } from '../kit'
import type { D65Materials } from './materials'
import { pottedPothos } from './plant'

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

/** A small potted pothos for counters and shelves (see plant.ts); each placement grows its own way. */
export function herbPot(p: P, parent: Object3D, x: number, y: number, z: number, s = 1, pot: Material = p.c.pot) {
  pottedPothos(p.k, parent, x, y, z, s, pot, Math.round(Math.abs(x * 131 + z * 71 + y * 17)) + 1)
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

/** The family's car in the carport: a white compact SUV (see ../car.ts). */
export function car({ k }: P, x: number, z: number, y: number) {
  parkedCar(k.root, 'crossover', '#f1f2f2', x, z, 0, y)
}
