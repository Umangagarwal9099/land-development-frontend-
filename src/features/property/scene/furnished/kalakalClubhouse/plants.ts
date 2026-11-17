import { Color, Vector3 } from 'three'
import { rng } from '../textures'
import type { Planting, Species } from '../kalakalMall/foliage'

/*
 * The planting the references show that the shared library doesn't grow: the two tall, dense
 * cypresses that flank the entrance island, the broad-leaved tropical clumps behind its hedge, and
 * the jacaranda in flower.
 */

const unit = (r: () => number) => new Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize()

/**
 * A cypress: a straight leader and whorls of upswept branches, longest low down, so the crown is a
 * dense, slightly irregular cone with its skirt a metre off the ground; sprays of scale leaves
 * crowd every branch and the cone's skin, darker deep inside, fresher at the tips.
 */
export function cypress(plant: Planting, x: number, y: number, z: number, h: number, w: number, seed: number, clear = 0.9, fullness = 0.85) {
  const r = rng(seed)
  const top = y + h
  plant.limb(new Vector3(x, y - 0.05, z), new Vector3(x, y + 0.4, z), 0.24, 0.17)
  plant.limb(new Vector3(x, y + 0.4, z), new Vector3(x + (r() - 0.5) * 0.1, top - 0.4, z + (r() - 0.5) * 0.1), 0.17, 0.03)
  // The crown's profile: full and rounded low down (a short skirt curving in to the stem), tapering to the tip.
  const radius = (yy: number) => {
    const t = Math.max(0, Math.min(1, (yy - y - clear) / (h - clear)))
    const skirt = Math.min(1, 0.55 + t * 4.5)
    return (w / 2) * Math.pow(1 - t, fullness) * skirt * (0.92 + 0.16 * Math.sin(yy * 2.3 + seed))
  }
  const tint = new Color()
  const card = (p: Vector3, out: Vector3, depth: number, size: number) => {
    const shade = (0.42 + 0.58 * depth ** 1.4) * (0.82 + r() * 0.3) * (0.85 + 0.15 * ((p.y - y) / h))
    tint.setRGB(0.5 * shade, 0.72 * shade, 0.34 * shade)
    const axis = out.clone().multiplyScalar(0.7).add(new Vector3(0, 0.75, 0)).add(unit(r).multiplyScalar(0.35)).normalize()
    plant.card('conifer', p, axis, unit(r), size, size * 1.1, Math.floor(r() * 4), tint, out)
  }
  // Whorls of branches up the leader.
  let az = r() * 6.28
  for (let yy = y + clear; yy < top - 0.5; yy += 0.22 + r() * 0.08) {
    const R = radius(yy)
    const n = 5 + Math.floor(r() * 3)
    for (let i = 0; i < n; i++) {
      az += 2.39996
      const dir = new Vector3(Math.cos(az), 0.45 + r() * 0.3, Math.sin(az)).normalize()
      const len = R * (0.75 + r() * 0.3)
      const a = new Vector3(x, yy, z)
      const b = a.clone().addScaledVector(dir, len)
      plant.limb(a, b, 0.03, 0.008)
      for (let t = 0.35; t <= 1; t += 0.18) {
        const p = a.clone().lerp(b, t).add(unit(r).multiplyScalar(0.12))
        const out = new Vector3(p.x - x, 0.2, p.z - z).normalize()
        card(p, out, t, 0.32 + r() * 0.16)
      }
    }
  }
  // The cone's skin: sprays all over the surface, so its silhouette is dense and textured.
  const skin = Math.round(h * w * 135)
  for (let i = 0; i < skin; i++) {
    const yy = y + clear + Math.pow(r(), 0.8) * (h - clear - 0.15)
    const a = r() * 6.28
    const d = 0.7 + r() * 0.35
    const R = radius(yy) * d
    const p = new Vector3(x + Math.cos(a) * R, yy, z + Math.sin(a) * R)
    card(p, new Vector3(Math.cos(a), 0.35, Math.sin(a)).normalize(), Math.min(1, d), 0.3 + r() * 0.14)
  }
  // The leader's tip.
  for (let i = 0; i < 14; i++) card(new Vector3(x + (r() - 0.5) * 0.15, top - 0.5 + r() * 0.5, z + (r() - 0.5) * 0.15), new Vector3(0, 1, 0), 1, 0.26)
  plant.footprints.push({ x, y, z, r: w * 0.55, strength: 0.6 })
}

/** A clump of paddle-leaved tropicals: leaves on long stalks fanning up and out from the base. */
export function tropical(plant: Planting, x: number, y: number, z: number, h: number, seed: number) {
  const r = rng(seed)
  const tint = new Color()
  const n = 8 + Math.floor(r() * 4)
  for (let i = 0; i < n; i++) {
    const az = r() * 6.28
    const lean = 0.15 + r() * 0.4
    const out = new Vector3(Math.cos(az), 0, Math.sin(az))
    const axis = out.clone().multiplyScalar(Math.sin(lean)).add(new Vector3(0, Math.cos(lean), 0)).normalize()
    const len = h * (0.75 + r() * 0.3)
    const base = new Vector3(x + out.x * 0.08, y, z + out.z * 0.08)
    // The stalk, then the blade from a third of the way up.
    const stalk = base.clone().addScaledVector(axis, len * 0.32)
    plant.limb(base, stalk, 0.018, 0.012)
    const shade = 0.75 + r() * 0.35
    tint.setRGB(0.55 * shade, 0.68 * shade, 0.5 * shade)
    const face = new Vector3(-out.z, 0, out.x).applyAxisAngle(axis, (r() - 0.5) * 1.2)
    plant.card('tropical', stalk, axis, face, len * 0.62, len * 0.75, Math.floor(r() * 4), tint, out.clone().add(new Vector3(0, 0.6, 0)).normalize())
  }
  plant.footprints.push({ x, y, z, r: h * 0.45, strength: 0.4 })
}

/** Jacaranda in full flower: a broad, open umbrella of lilac over fine, fern-like leaves. */
export const JACARANDA: Species = {
  leaf: 'bloom', height: 8.5, clear: 2.4, trunkR: 0.2, spread: 8.5, crownH: 4.4, scaffolds: 5, children: 3, angle: 0.85, tropism: 0.06, sprig: 0.62, perTip: 70, tint: [1.05, 1.02, 1.08],
}
