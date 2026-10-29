import { BufferGeometry, Float32BufferAttribute, SphereGeometry } from 'three'
import { rng } from '../textures'

/*
 * Soft furnishings as real surfaces rather than boxes: a cloth draped over a mattress (duvet,
 * blanket, throw), and a pillow with a squared outline, a full middle and pinched seams.
 * UVs are in metres / `tile`, so a fabric texture keeps its true scale.
 */

export interface DrapeOptions {
  /** Half the width of what it lies on, and the length it covers before falling at the foot. */
  hw: number
  len: number
  /** How far it hangs over the sides and the foot. */
  drop: number
  /** Radius of the edge it falls over (the mattress's rounded edge). */
  edge?: number
  /** Loft of the filling on top, and the scale of its creases. */
  puff?: number
  crease?: number
  /** Whether it also falls at the foot end (z = len). */
  foot?: boolean
  seed?: number
  tile?: number
  segments?: [number, number]
}

/**
 * A cloth lying on a flat top (y = 0, x ∈ [−hw, hw], z ∈ [0, len]) and falling over its sides
 * and foot: it rolls over the rounded edge, then hangs, with soft folds that deepen towards a
 * gently waving hem. Corners fall away diagonally, as a real duvet does.
 */
export function drape(o: DrapeOptions): BufferGeometry {
  const { hw, len, drop, edge = 0.05, puff = 0.035, crease = 1, foot = true, seed = 1, tile = 0.3, segments = [72, 64] } = o
  const r = rng(seed)
  const ph = Array.from({ length: 8 }, () => r() * Math.PI * 2)
  const arc = (Math.PI * edge) / 2
  const reach = arc + drop
  const [nx, nz] = segments
  const u0 = -(hw + reach)
  const u1 = hw + reach
  const v1 = len + (foot ? reach : 0)
  // Rolls a distance `e` past an edge: along the top, round the edge, then straight down.
  const fold = (e: number): [number, number] => {
    if (e <= 0) return [e, 0]
    if (e < arc) {
      const t = e / edge
      return [edge * Math.sin(t), -edge * (1 - Math.cos(t))]
    }
    return [edge, -edge - (e - arc)]
  }
  const pos: number[] = []
  const uv: number[] = []
  for (let j = 0; j <= nz; j++) {
    const v = (v1 * j) / nz
    for (let i = 0; i <= nx; i++) {
      const u = u0 + ((u1 - u0) * i) / nx
      const ex = Math.abs(u) - hw
      const ez = foot ? v - len : -1
      const [ax, dx] = fold(ex)
      const [az, dz] = fold(ez)
      let x = ex > 0 ? Math.sign(u) * (hw + ax) : u
      let z = ez > 0 ? len + az : v
      let y = ex > 0 && ez > 0 ? -Math.hypot(dx, dz) : dx + dz
      const hang = Math.max(0, -y - edge) / drop
      // Filling: a soft dome over the top that relaxes towards the edges.
      const inX = Math.max(0, 1 - Math.max(0, Math.abs(u) - hw * 0.6) / (hw * 0.4))
      const inZ = Math.max(0, 1 - Math.max(0, v - len * 0.85) / (len * 0.15)) * Math.min(1, v / 0.12)
      y += puff * Math.min(inX, inZ)
      // Creases on top: a few long, shallow ridges at random angles.
      y += crease * 0.004 * (Math.sin(u * 7 + v * 3 + ph[0]) + Math.sin(u * 3 - v * 9 + ph[1]) * 0.7 + Math.sin(u * 13 + v * 11 + ph[2]) * 0.3) * Math.min(inX, inZ)
      // Hanging folds: outward ripples that grow towards the hem.
      if (hang > 0) {
        const f = 0.022 * crease * Math.pow(Math.min(1, hang), 1.3)
        if (ex > 0 && !(ez > 0)) x += Math.sign(u) * f * (Math.sin(v * 9 + ph[3]) + 0.5 * Math.sin(v * 23 + ph[4]) + 0.6)
        if (ez > 0 && !(ex > 0)) z += f * (Math.sin(u * 9 + ph[5]) + 0.5 * Math.sin(u * 21 + ph[6]) + 0.6)
        y += 0.012 * Math.sin((ex > 0 ? v : u) * 6 + ph[7]) * Math.min(1, hang)
      }
      pos.push(x, y, z)
      uv.push(u / tile, v / tile)
    }
  }
  const idx: number[] = []
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i
      const b = a + 1
      const c = a + nx + 1
      const d = c + 1
      idx.push(a, c, b, b, c, d)
    }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

const spow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e)

/**
 * A pillow `w` wide, `h` tall and `t` thick, facing +z: a squared outline with rounded corners,
 * full in the middle and pinched to a seam at the edge, with a slight sag and a little
 * irregularity of its own (from `seed`), so no two are alike.
 */
export function pillow(w: number, h: number, t: number, seed: number): BufferGeometry {
  const r = rng(seed)
  const sag = 0.06 + r() * 0.08
  const lean = (r() - 0.5) * 0.06
  const g = new SphereGeometry(1, 48, 32)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    // Sphere with its poles on z: elevation towards the faces, azimuth round the outline.
    const sx = p.getX(i)
    const sy = p.getY(i)
    const sz = p.getZ(i)
    const th = Math.asin(Math.max(-1, Math.min(1, sz)))
    const phi = Math.atan2(sy, sx)
    const c = Math.cos(th)
    let x = spow(c, 0.55) * spow(Math.cos(phi), 0.28)
    let y = spow(c, 0.55) * spow(Math.sin(phi), 0.28)
    let z = spow(Math.sin(th), 0.75)
    // Pinch towards the seam, fuller in the middle; corners flatten into "ears".
    const edge = Math.max(Math.abs(x), Math.abs(y))
    z *= 1 - 0.6 * Math.pow(edge, 5)
    // The filling settles: a soft dip towards the top, and a slight asymmetric lean.
    z *= 1 - sag * Math.max(0, y) * (1 - x * x)
    x += lean * y
    y -= 0.03 * x * x
    p.setXYZ(i, (x * w) / 2, (y * h) / 2, (z * t) / 2)
  }
  g.computeVertexNormals()
  return g
}
