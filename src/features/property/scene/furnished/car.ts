import {
  BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, CatmullRomCurve3, Color, CylinderGeometry, ExtrudeGeometry, Group, LatheGeometry, Mesh, MeshPhysicalMaterial,
  MeshStandardMaterial, Shape, SphereGeometry, SRGBColorSpace, TorusGeometry, Vector2, Vector3, type Material, type Object3D,
} from 'three'

/*
 * Parked cars, modelled the way a car body is drawn: one continuous shell lofted through cross
 * sections along its length. Each section has the body's real shape (a tucked-in rocker, the
 * side's gentle bulge, the shoulder at the beltline, the glasshouse leaning in to a crowned roof)
 * and the sections run smoothly from a rounded nose to the tail, with the wheel arches cut by the
 * floor line and flared over the tyres. Glass, pillars, window seals, cladding and the underbody
 * are regions of that same shell, so nothing is a box stuck on a box. Lamps, grille and plates are
 * moulded to the nose and tail; wheels are turned tyres with tread and sidewall over multi-spoke
 * alloys, discs and calipers; behind the tinted glass there are seats, a dashboard and a wheel.
 *
 * Five generic Indian-market cars, at real sizes: a compact SUV, a sedan, a hatchback, a full-size
 * ladder-frame SUV and a seven-seat MPV. Front is +z, the origin on the ground under the middle of
 * the car, as for every piece here.
 */

export type Body = 'crossover' | 'sedan' | 'hatch' | 'suv' | 'mpv'

type Key = [z: number, y: number][]

interface Spec {
  length: number
  width: number
  /** Axle positions along z, tyre radius and section width. */
  axles: [rear: number, front: number]
  tyre: { r: number; w: number }
  /** Centreline of the top (tailgate, roof, windscreen, bonnet), the beltline and the underside. */
  top: Key
  belt: Key
  bottom: Key
  /** Glazing along z: windscreen and backlight (each its lower..upper extent), side glass, B-pillar. */
  screen: [number, number]
  back: [number, number]
  side: [number, number]
  bPillar: number
  /** Lamps and grille on the nose and tail: x and y ranges (half-width, so mirrored). */
  head: [x0: number, x1: number, y0: number, y1: number]
  tail: [x0: number, x1: number, y0: number, y1: number]
  grille: [half: number, y0: number, y1: number]
  plate: [front: number, rear: number]
  /** Black plastic cladding round the arches and sills (an SUV's), and roof rails. */
  cladding: boolean
  rails: boolean
  /** How far ahead of the rear glass's end the rear door's shut line falls. */
  rearDoor: number
}

const SPECS: Record<Body, Spec> = {
  crossover: {
    length: 4.32, width: 1.79, axles: [-1.31, 1.3], tyre: { r: 0.335, w: 0.215 },
    top: [[-2.16, 0.62], [-2.15, 0.98], [-2.11, 1.22], [-2.0, 1.4], [-1.82, 1.56], [-1.5, 1.615], [-0.6, 1.63], [0.0, 1.61], [0.22, 1.53], [0.68, 1.15], [1.4, 1.06], [1.95, 0.98], [2.1, 0.87], [2.16, 0.62]],
    belt: [[-2.16, 0.95], [-2.0, 1.18], [-1.7, 1.2], [-0.5, 1.15], [0.62, 1.1], [1.6, 1.0], [2.16, 0.82]],
    bottom: [[-2.16, 0.5], [-2.05, 0.4], [-1.85, 0.3], [-1.5, 0.24], [1.5, 0.24], [1.9, 0.3], [2.08, 0.38], [2.16, 0.48]],
    screen: [0.66, 0.08], back: [-2.1, -1.84], side: [-1.85, 0.6], bPillar: -0.25,
    head: [0.42, 0.84, 0.76, 0.88], tail: [0.5, 0.85, 0.98, 1.1], grille: [0.4, 0.5, 0.78], plate: [0.46, 0.62],
    cladding: true, rails: true, rearDoor: 0.48,
  },
  sedan: {
    length: 4.55, width: 1.75, axles: [-1.265, 1.355], tyre: { r: 0.31, w: 0.185 },
    top: [[-2.275, 0.62], [-2.27, 0.9], [-2.24, 1.02], [-2.0, 1.075], [-1.6, 1.1], [-1.25, 1.3], [-0.95, 1.43], [-0.4, 1.47], [0.1, 1.455], [0.35, 1.38], [0.85, 1.02], [1.6, 0.92], [2.1, 0.85], [2.24, 0.74], [2.275, 0.58]],
    belt: [[-2.275, 0.85], [-2.1, 1.01], [-1.4, 1.02], [0.8, 0.96], [1.7, 0.89], [2.275, 0.74]],
    bottom: [[-2.275, 0.45], [-2.15, 0.36], [-1.9, 0.26], [-1.5, 0.19], [1.6, 0.19], [2.0, 0.25], [2.2, 0.33], [2.275, 0.42]],
    screen: [0.82, 0.38], back: [-1.52, -1.0], side: [-1.33, 0.78], bPillar: -0.2,
    head: [0.4, 0.82, 0.68, 0.78], tail: [0.48, 0.84, 0.84, 0.95], grille: [0.38, 0.5, 0.68], plate: [0.42, 0.66],
    cladding: false, rails: false, rearDoor: 0.33,
  },
  hatch: {
    length: 3.85, width: 1.735, axles: [-1.275, 1.175], tyre: { r: 0.3, w: 0.185 },
    top: [[-1.925, 0.62], [-1.92, 0.85], [-1.89, 1.1], [-1.8, 1.36], [-1.65, 1.5], [-1.3, 1.525], [-0.3, 1.53], [0.15, 1.51], [0.35, 1.42], [0.8, 1.02], [1.45, 0.93], [1.82, 0.84], [1.9, 0.72], [1.925, 0.58]],
    belt: [[-1.925, 0.88], [-1.75, 1.05], [-1.3, 1.06], [0.8, 0.98], [1.5, 0.9], [1.925, 0.76]],
    bottom: [[-1.925, 0.45], [-1.8, 0.34], [-1.55, 0.22], [1.4, 0.2], [1.7, 0.27], [1.88, 0.36], [1.925, 0.44]],
    screen: [0.78, 0.38], back: [-1.88, -1.66], side: [-1.62, 0.76], bPillar: -0.15,
    head: [0.4, 0.8, 0.72, 0.84], tail: [0.62, 0.85, 0.82, 1.12], grille: [0.36, 0.5, 0.66], plate: [0.44, 0.64],
    cladding: false, rails: false, rearDoor: 0.33,
  },
  // A tall, upright body-on-frame SUV: square tail, near-flat roof, a long bonnet over big tyres.
  suv: {
    length: 4.75, width: 1.855, axles: [-1.35, 1.4], tyre: { r: 0.38, w: 0.265 },
    top: [[-2.375, 0.7], [-2.37, 1.12], [-2.355, 1.45], [-2.31, 1.68], [-2.18, 1.79], [-1.7, 1.83], [-0.4, 1.84], [0.3, 1.82], [0.5, 1.75], [0.98, 1.36], [1.65, 1.27], [2.18, 1.19], [2.33, 1.07], [2.375, 0.78]],
    belt: [[-2.375, 1.12], [-2.2, 1.3], [-1.0, 1.3], [0.95, 1.26], [1.8, 1.19], [2.375, 1.02]],
    bottom: [[-2.375, 0.62], [-2.27, 0.48], [-2.02, 0.38], [-1.65, 0.32], [1.65, 0.32], [2.02, 0.38], [2.27, 0.48], [2.375, 0.6]],
    screen: [0.95, 0.45], back: [-2.35, -2.2], side: [-2.12, 0.9], bPillar: -0.32,
    head: [0.46, 0.86, 0.88, 1.02], tail: [0.62, 0.9, 1.0, 1.32], grille: [0.44, 0.62, 0.98], plate: [0.52, 0.74],
    cladding: true, rails: true, rearDoor: 0.5,
  },
  // A seven-seat MPV: a long, high roof over three rows, a short sloping nose.
  mpv: {
    length: 4.4, width: 1.735, axles: [-1.3, 1.44], tyre: { r: 0.32, w: 0.185 },
    top: [[-2.2, 0.62], [-2.19, 0.96], [-2.16, 1.26], [-2.09, 1.5], [-1.94, 1.64], [-1.5, 1.69], [-0.2, 1.69], [0.25, 1.64], [0.45, 1.55], [1.02, 1.08], [1.62, 0.98], [2.06, 0.9], [2.17, 0.78], [2.2, 0.6]],
    belt: [[-2.2, 0.96], [-2.0, 1.1], [-1.0, 1.08], [0.92, 1.0], [1.7, 0.92], [2.2, 0.76]],
    bottom: [[-2.2, 0.48], [-2.08, 0.38], [-1.85, 0.27], [-1.55, 0.21], [1.6, 0.21], [1.95, 0.27], [2.12, 0.36], [2.2, 0.46]],
    screen: [0.98, 0.32], back: [-2.15, -1.97], side: [-2.0, 0.94], bPillar: -0.05,
    head: [0.42, 0.82, 0.74, 0.86], tail: [0.56, 0.84, 1.0, 1.3], grille: [0.38, 0.5, 0.7], plate: [0.46, 0.64],
    cladding: false, rails: true, rearDoor: 0.62,
  },
}

/* ---------- curves ---------- */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/** A smooth curve through key points (monotone cubic, so it never overshoots between them). */
function mono(pts: Key) {
  const n = pts.length
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const d = xs.slice(1).map((x, i) => (ys[i + 1] - ys[i]) / (x - xs[i]))
  const m = xs.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i])))
  return (x: number) => {
    if (x <= xs[0]) return ys[0]
    if (x >= xs[n - 1]) return ys[n - 1]
    let i = 0
    while (xs[i + 1] < x) i++
    const h = xs[i + 1] - xs[i]
    const t = (x - xs[i]) / h
    const t2 = t * t
    const t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]
  }
}

/* ---------- the body's sections ---------- */

/** Samples per section segment, bottom centre round to the top centre (see section()). */
const SEG = [2, 3, 3, 4, 4, 6, 7]
const NSEG = SEG.length
const HALF = SEG.reduce((a, b) => a + b, 0) + 1

interface Sample {
  x: number
  y: number
  seg: number
  f: number
}

class BodyShape {
  readonly s: Spec
  private top: (z: number) => number
  private belt: (z: number) => number
  private bottom: (z: number) => number
  /** A dense table of half sections, for finding the surface at a point. */
  private table: { z: number; pts: Sample[] }[] = []

  constructor(s: Spec) {
    this.s = s
    this.top = mono(s.top)
    this.belt = mono(s.belt)
    this.bottom = mono(s.bottom)
    for (let i = 0; i <= 600; i++) {
      const z = -s.length / 2 + (s.length * i) / 600
      this.table.push({ z, pts: this.section(z).pts })
    }
  }

  /** How far the arches and their flares reach at z: 0 clear of them, 1 over an axle. */
  arch(z: number) {
    const R = this.s.tyre.r + 0.05
    let lift = 0
    let flare = 0
    for (const a of this.s.axles) {
      const d = Math.abs(z - a)
      if (d < R) lift = Math.max(lift, this.s.tyre.r + Math.sqrt(R * R - d * d))
      flare = Math.max(flare, smooth(R + 0.3, R - 0.05, d))
    }
    return { lift, flare }
  }

  /** The glasshouse's share of the section at z: 0 over the bonnet and boot, 1 under the roof. */
  house(z: number) {
    const yT = this.top(z)
    return smooth(0.05, 0.42, yT - 0.03 - this.belt(z))
  }

  /** The right half section at z: control points from the bottom centre round to the top centre. */
  section(z: number) {
    const { length, width } = this.s
    const zn = Math.abs(z) / (length / 2)
    const { lift, flare } = this.arch(z)
    // Plan: a rounded rectangle (superellipse), a touch narrower at the nose and over the arches' flares.
    const w = Math.max(0.004, (width / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, zn), 3.2)), 1 / 3.2) * (1 - 0.035 * smooth(0.5, 1, z / (length / 2))) + 0.014 * flare)
    const yF = Math.max(this.bottom(z), lift)
    const yT = this.top(z)
    const g = this.house(z)
    const crown = 0.012 + 0.035 * g
    const yR = yT - crown
    const yB = Math.min(this.belt(z), yR - 0.025)
    const yS = Math.max(yF + 0.05, Math.min(0.42, yB - 0.3))
    const yM = yS + (yB - yS) * 0.42
    const wB = Math.max(0, w - 0.022)
    const wR = Math.max(0, wB - (0.045 + 0.19 * g))
    const ctrl: [number, number][] = [
      [0, yF], [Math.max(0, w - 0.15), yF], [Math.max(0, w - 0.035), yF + 0.035], [Math.max(0, w - 0.008), yS], [w, yM], [wB, yB], [wR, yR], [0, yT],
    ]
    const curve = new CatmullRomCurve3(ctrl.map(([x, y]) => new Vector3(x, y, 0)), false, 'catmullrom', 0.5)
    const pts: Sample[] = []
    SEG.forEach((n, k) => {
      for (let j = 0; j < n; j++) {
        const p = curve.getPoint((k + j / n) / NSEG)
        pts.push({ x: Math.max(0, p.x), y: p.y, seg: k, f: j / n })
      }
    })
    pts.push({ x: 0, y: yT, seg: NSEG - 1, f: 1 })
    return { pts, yF, yT, yB, g }
  }

  /** The body's half width at (z, y), or −1 above or below it. */
  halfWidth(z: number, y: number) {
    const t = this.table
    const f = clamp((z - t[0].z) / (t[t.length - 1].z - t[0].z), 0, 1) * (t.length - 1)
    const i = Math.min(t.length - 2, Math.floor(f))
    const at = (pts: Sample[]) => {
      let best = -1
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k]
        const b = pts[k + 1]
        if ((a.y - y) * (b.y - y) > 0 || a.y === b.y) continue
        best = Math.max(best, a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y))
      }
      return best
    }
    const a = at(t[i].pts)
    const b = at(t[i + 1].pts)
    if (a < 0 || b < 0) return Math.max(a, b)
    return a + (b - a) * (f - i)
  }

  /** The surface's foremost (dir 1) or rearmost (dir −1) z at (x, y), for moulding parts to the nose and tail. */
  endZ(x: number, y: number, dir: 1 | -1) {
    // Scan in from the very end: low down the body is broken over each axle by its wheel arch,
    // so the first surface met coming in is the bumper's, not the sill's beyond the wheel.
    const half = this.s.length / 2
    const ax = Math.abs(x)
    let out = half
    let found = -1
    for (let d = half; d >= 0; d -= 0.01) {
      if (this.halfWidth(dir * d, y) >= ax) {
        found = d
        break
      }
      out = d
    }
    if (found < 0) return null
    let lo = found
    let hi = out
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2
      if (this.halfWidth(dir * mid, y) >= ax) lo = mid
      else hi = mid
    }
    return dir * lo
  }
}

/* ---------- geometry ---------- */

type Region = 'paint' | 'glass' | 'trim' | 'under'

/** The body shell: one lofted surface, split by region into a geometry each (sharing its vertices). */
function bodyGeometry(b: BodyShape) {
  const s = b.s
  const N = 120
  const zs = Array.from({ length: N + 1 }, (_, i) => (s.length / 2) * Math.sin((Math.PI / 2) * (-1 + (2 * i) / N)))
  const loop = 2 * (HALF - 1)
  const pos: number[] = []
  const col: number[] = []
  const meta: { seg: number; f: number }[] = []
  const sections = zs.map((z) => b.section(z))
  sections.forEach(({ pts, yF }, i) => {
    const z = zs[i]
    for (let j = 0; j < loop; j++) {
      const h = j < HALF ? j : loop - j
      const p = pts[h]
      pos.push(j < HALF ? p.x : -p.x, p.y, z)
      // Road grime: the lower body a shade duller than the roof.
      const dirt = 0.82 + 0.18 * smooth(yF, yF + 0.45, p.y)
      col.push(dirt, dirt * 0.99, dirt * 0.97)
      if (i === 0) meta.push({ seg: p.seg, f: p.f })
    }
  })
  const idx: Record<Region, number[]> = { paint: [], glass: [], trim: [], under: [] }
  const region = (z: number, j: number): Region => {
    const h = j < HALF - 1 ? j : loop - j - 1
    const { seg, f } = meta[h]
    const g = b.house(z)
    if (seg <= 1) return 'under'
    if (seg <= 3) {
      // Cladding and the lower bumpers follow the body's own lines (its section rows), never a cut
      // across them: the rocker band all round, and on an SUV a band round each arch as well.
      const ends = Math.abs(z) > s.length / 2 - 0.22
      if (seg === 2 && (s.cladding || ends)) return 'trim'
      if (seg === 3 && s.cladding && f < 0.5 && b.arch(z).flare > 0.45) return 'trim'
      return 'paint'
    }
    if (seg === 5 && g > 0.5 && z > s.side[0] && z < s.side[1]) {
      if (f < 0.17 || f > 0.83) return 'trim'
      if (Math.abs(z - s.bPillar) < 0.065) return 'trim'
      return 'glass'
    }
    if (seg === 6) {
      const inScreen = z < s.screen[0] && z > s.screen[1]
      const inBack = z > s.back[0] && z < s.back[1]
      if ((inScreen || inBack) && f > 0.2) return 'glass'
      if ((inScreen || inBack) && f > 0.12) return 'trim'
    }
    return 'paint'
  }
  for (let i = 0; i < N; i++)
    for (let j = 0; j < loop; j++) {
      const a = i * loop + j
      const bb = i * loop + ((j + 1) % loop)
      const c = (i + 1) * loop + ((j + 1) % loop)
      const d = (i + 1) * loop + j
      const zc = (zs[i] + zs[i + 1]) / 2
      // The loop runs up the right side and down the left, so this winding faces outwards on both.
      idx[region(zc, j)].push(a, c, d, a, bb, c)
    }
  const all = new BufferGeometry()
  all.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  all.setAttribute('color', new BufferAttribute(new Float32Array(col), 3))
  all.setIndex([...idx.paint, ...idx.glass, ...idx.trim, ...idx.under])
  all.computeVertexNormals()
  const out = {} as Record<Region, BufferGeometry>
  for (const r of Object.keys(idx) as Region[]) {
    const g = new BufferGeometry()
    for (const name of ['position', 'normal', 'color']) g.setAttribute(name, all.getAttribute(name))
    g.setIndex(idx[r])
    g.computeBoundingSphere()
    out[r] = g
  }
  return out
}

/** A patch moulded to the nose (dir 1) or tail (−1) over x0..x1, y0..y1, standing `off` proud. */
function endPatch(b: BodyShape, dir: 1 | -1, x0: number, x1: number, y0: number, y1: number, off: number, nx = 16, ny = 6) {
  const pos: number[] = []
  const uv: number[] = []
  const at = (x: number, y: number) => {
    const z = b.endZ(x, y, dir)
    if (z === null) return null
    const e = 0.01
    const zx = (b.endZ(x + e, y, dir) ?? z) - (b.endZ(x - e, y, dir) ?? z)
    const zy = (b.endZ(x, y + e, dir) ?? z) - (b.endZ(x, y - e, dir) ?? z)
    const n = new Vector3(-zx / (2 * e), -zy / (2 * e), dir).normalize()
    if (n.z * dir < 0.05) n.set(Math.sign(x) || 1, 0, 0.3 * dir).normalize()
    return new Vector3(x, y, z).addScaledVector(n, off)
  }
  const grid: (Vector3 | null)[][] = []
  for (let i = 0; i <= nx; i++) {
    grid.push([])
    for (let j = 0; j <= ny; j++) grid[i].push(at(x0 + ((x1 - x0) * i) / nx, y0 + ((y1 - y0) * j) / ny))
  }
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const q = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]]
      if (q.some((p) => !p)) continue
      const u = [i / nx, (i + 1) / nx]
      const v = [j / ny, (j + 1) / ny]
      const quad = [[q[0]!, u[0], v[0]], [q[1]!, u[1], v[0]], [q[2]!, u[1], v[1]], [q[3]!, u[0], v[1]]] as const
      for (const k of [0, 1, 2, 0, 2, 3]) {
        const [p, uu, vv] = quad[k]
        pos.push(p.x, p.y, p.z)
        uv.push(uu, vv)
      }
    }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  g.computeVertexNormals()
  return g
}

/** A thin strip on the side at z, from y0 to y1: a door shut line or a window seal. */
function sideLine(b: BodyShape, z: number, y0: number, y1: number, width: number, side: 1 | -1) {
  const pos: number[] = []
  const n = 14
  let prev: Vector3[] | null = null
  for (let i = 0; i <= n; i++) {
    const y = y0 + ((y1 - y0) * i) / n
    const pts = [z - width / 2, z + width / 2].map((zz) => new Vector3(side * (b.halfWidth(zz, y) + 0.0015), y, zz))
    if (prev && pts.every((p) => p.x * side > 0.01) && prev.every((p) => p.x * side > 0.01)) {
      const [a, c] = prev
      const [d, e] = pts
      if (side > 0) pos.push(a.x, a.y, a.z, d.x, d.y, d.z, e.x, e.y, e.z, a.x, a.y, a.z, e.x, e.y, e.z, c.x, c.y, c.z)
      else pos.push(a.x, a.y, a.z, e.x, e.y, e.z, d.x, d.y, d.z, a.x, a.y, a.z, c.x, c.y, c.z, e.x, e.y, e.z)
    }
    prev = pts
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.computeVertexNormals()
  return g
}

/** A tyre turned from its section: bulging sidewalls, rounded shoulders, four tread ribs. Axis along y. */
function tyreGeometry(r: number, w: number) {
  const rim = r * 0.62
  const hw = w / 2
  const pts: [number, number][] = [
    [rim, -hw * 0.86], [rim + (r - rim) * 0.35, -hw * 0.98], [rim + (r - rim) * 0.75, -hw], [r - 0.012, -hw * 0.9], [r, -hw * 0.72],
  ]
  // Tread: ribs separated by three circumferential grooves.
  const grooves = [-0.45, 0, 0.45]
  for (const gx of grooves) {
    pts.push([r, gx * hw - 0.012], [r - 0.009, gx * hw - 0.008], [r - 0.009, gx * hw + 0.008], [r, gx * hw + 0.012])
  }
  pts.push([r, hw * 0.72], [r - 0.012, hw * 0.9], [rim + (r - rim) * 0.75, hw], [rim + (r - rim) * 0.35, hw * 0.98], [rim, hw * 0.86])
  return new LatheGeometry(pts.map(([a, y]) => new Vector2(a, y)), 56)
}

/** The rim's barrel and lip, turned; spokes are added separately. Axis along y, face towards +y. */
function rimGeometry(r: number, w: number) {
  const hw = w / 2
  const pts: [number, number][] = [
    [r * 0.9, -hw * 0.8], [r * 0.93, -hw * 0.82], [r * 0.93, hw * 0.55], [r * 0.99, hw * 0.72], [r * 1.02, hw * 0.78], [r * 0.99, hw * 0.84], [r * 0.9, hw * 0.8],
  ]
  return new LatheGeometry(pts.map(([a, y]) => new Vector2(a, y)), 48)
}

/** Ten spokes in five pairs, from the hub to the lip. Laid in the xz plane, their face towards +y. */
function spokeGeometry(r: number) {
  const hub = r * 0.3
  const p = (rad: number, ang: number) => new Vector2(Math.cos(ang) * rad, Math.sin(ang) * rad)
  const shapes: Shape[] = []
  for (let i = 0; i < 5; i++)
    for (const off of [-0.11, 0.11]) {
      const c = (i / 5) * Math.PI * 2 + off
      shapes.push(new Shape([p(hub, c - 0.12), p(r * 0.95, c - 0.035 + off * 0.35), p(r * 0.95, c + 0.035 + off * 0.35), p(hub, c + 0.12)]))
    }
  const g = new ExtrudeGeometry(shapes, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2, curveSegments: 4 })
  g.rotateX(-Math.PI / 2)
  return g
}

/* ---------- textures ---------- */

const paint = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!, w, h)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** A headlamp seen through its lens: a smoked chrome bowl, two projectors, an LED daytime strip. */
const headlampMap = (glow: boolean) =>
  paint(256, 96, (g, w, h) => {
    if (glow) {
      g.fillStyle = '#000'
      g.fillRect(0, 0, w, h)
    } else {
      const bg = g.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#3a3d42')
      bg.addColorStop(0.5, '#15171a')
      bg.addColorStop(1, '#2a2c30')
      g.fillStyle = bg
      g.fillRect(0, 0, w, h)
    }
    // The LED strip along the top edge, the lamp's signature.
    g.fillStyle = glow ? '#fff' : '#e8edf2'
    g.fillRect(w * 0.05, h * 0.1, w * 0.9, h * 0.1)
    for (const cx of [0.38, 0.68]) {
      const x = cx * w
      const y = h * 0.6
      if (!glow) {
        const r = g.createRadialGradient(x - 4, y - 4, 1, x, y, h * 0.26)
        r.addColorStop(0, '#ffffff')
        r.addColorStop(0.35, '#9aa3ab')
        r.addColorStop(0.7, '#2b2f34')
        r.addColorStop(1, '#5c6168')
        g.fillStyle = r
        g.beginPath()
        g.arc(x, y, h * 0.26, 0, 7)
        g.fill()
        g.strokeStyle = '#c9cdd2'
        g.lineWidth = 2
        g.stroke()
      }
    }
  })

/** A tail lamp: red lens over darker segments, with a lit LED line. */
const taillampMap = paint.bind(null, 256, 96, (g, w, h) => {
  g.fillStyle = '#4a0306'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? '#6d0a0e' : '#5a0609'
    g.fillRect((i * w) / 6, 0, w / 6 - 2, h)
  }
  g.fillStyle = '#d9242b'
  g.fillRect(w * 0.04, h * 0.2, w * 0.92, h * 0.12)
  g.fillStyle = '#e8e6e2'
  g.fillRect(w * 0.08, h * 0.62, w * 0.22, h * 0.2)
})

/** A grille: a dark honeycomb mesh in a gloss-black surround. */
const grilleMap = paint.bind(null, 256, 128, (g, w, h) => {
  g.fillStyle = '#060606'
  g.fillRect(0, 0, w, h)
  const s = 12
  for (let row = 0; row < h / (s * 0.85) + 1; row++)
    for (let col = 0; col < w / s + 1; col++) {
      const x = col * s + (row % 2) * (s / 2)
      const y = row * s * 0.85
      g.beginPath()
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + Math.PI / 6
        g.lineTo(x + Math.cos(a) * s * 0.42, y + Math.sin(a) * s * 0.42)
      }
      g.closePath()
      g.fillStyle = '#26282b'
      g.fill()
    }
  g.strokeStyle = '#1a1b1d'
  g.lineWidth = 10
  g.strokeRect(0, 0, w, h)
})

/** Draws an Indian high-security number plate, white with black letters, the IND strip and hologram, in a w × h cell. */
export function drawPlate(g: CanvasRenderingContext2D, text: string, w = 512, h = 112) {
  g.fillStyle = '#f4f3ee'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#111'
  g.lineWidth = 6
  g.strokeRect(5, 5, w - 10, h - 10)
  g.fillStyle = '#1d4fa3'
  g.fillRect(16, 16, 46, h - 32)
  g.fillStyle = '#fff'
  g.font = '700 17px Helvetica, Arial, sans-serif'
  g.textAlign = 'center'
  g.fillText('IND', 39, h - 26)
  g.strokeStyle = '#9fb7d8'
  g.lineWidth = 2
  g.beginPath()
  g.arc(39, 38, 11, 0, 7)
  g.stroke()
  g.fillStyle = '#111'
  g.font = '700 64px "Arial Narrow", Helvetica, Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, w / 2 + 26, h / 2 + 3)
  }

const plateMap = (text: string) => paint(512, 112, (g, w, h) => drawPlate(g, text, w, h))

/* ---------- materials ---------- */

const shared = new Map<string, Material>()
const mat = <M extends Material>(key: string, make: () => M) => {
  let m = shared.get(key)
  if (!m) shared.set(key, (m = make()))
  return m as M
}

function materials() {
  return {
    glass: mat('glass', () => new MeshPhysicalMaterial({ color: '#1a2126', metalness: 0, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.72, envMapIntensity: 1.4 })),
    trim: mat('trim', () => new MeshStandardMaterial({ color: '#141517', roughness: 0.55, metalness: 0.1 })),
    gloss: mat('gloss', () => new MeshPhysicalMaterial({ color: '#0b0c0d', roughness: 0.15, clearcoat: 1 })),
    under: mat('under', () => new MeshStandardMaterial({ color: '#0e0e0f', roughness: 0.95 })),
    chrome: mat('chrome', () => new MeshStandardMaterial({ color: '#d4d7da', metalness: 1, roughness: 0.12, side: DoubleSide })),
    alloy: mat('alloy', () => new MeshPhysicalMaterial({ color: '#b4b8bd', metalness: 0.95, roughness: 0.28, clearcoat: 0.6, side: DoubleSide })),
    tyre: mat('tyre', () => new MeshStandardMaterial({ color: '#19191a', roughness: 0.88 })),
    disc: mat('disc', () => new MeshStandardMaterial({ color: '#6b6761', metalness: 0.8, roughness: 0.45 })),
    caliper: mat('caliper', () => new MeshStandardMaterial({ color: '#2a2b2e', metalness: 0.4, roughness: 0.5 })),
    seam: mat('seam', () => new MeshStandardMaterial({ color: '#070707', roughness: 1, side: DoubleSide })),
    cabin: mat('cabin', () => new MeshStandardMaterial({ color: '#2b2a29', roughness: 0.9 })),
    seat: mat('seat', () => new MeshStandardMaterial({ color: '#3c3833', roughness: 0.85 })),
    head: mat('head', () => new MeshPhysicalMaterial({ map: headlampMap(false), emissiveMap: headlampMap(true), emissive: '#ffffff', emissiveIntensity: 0.25, roughness: 0.05, clearcoat: 1, metalness: 0.3, side: DoubleSide })),
    tail: mat('tail', () => new MeshPhysicalMaterial({ map: taillampMap(), roughness: 0.08, clearcoat: 1, emissive: '#5a0000', emissiveIntensity: 0.25, side: DoubleSide })),
    grille: mat('grille', () => new MeshStandardMaterial({ map: grilleMap(), roughness: 0.4, metalness: 0.3, side: DoubleSide })),
  }
}

/** Whites and blacks are solid pigment; every other colour is a metallic. */
export const isSolidPaint = (colour: string) => {
  const l = new Color(colour).getHSL({ h: 0, s: 0, l: 0 }).l
  return l > 0.85 || l < 0.12
}

/** Car paint: clearcoat over solid pigment (whites, blacks) or over metallic flake (the rest). */
function paintMaterial(colour: string) {
  return mat(`paint:${colour}`, () => {
    const solid = isSolidPaint(colour)
    const m = new MeshPhysicalMaterial({ color: colour, vertexColors: true, metalness: solid ? 0.0 : 0.55, roughness: solid ? 0.32 : 0.4, clearcoat: 1, clearcoatRoughness: 0.035 })
    m.userData.paint = 'body'
    return m
  })
}

/** The same paint for small parts (mirrors, handles), which carry no grime colours. */
function partPaint(colour: string) {
  return mat(`part:${colour}`, () => {
    const base = paintMaterial(colour)
    const m = base.clone()
    m.vertexColors = false
    m.userData.paint = 'part'
    return m
  })
}

/* ---------- assembly ---------- */

const shapes = new Map<Body, BodyShape>()
const geos = new Map<string, BufferGeometry | Record<Region, BufferGeometry>>()
const cached = <T>(key: string, make: () => T) => {
  let g = geos.get(key) as T | undefined
  if (!g) geos.set(key, (g = make()) as never)
  return g
}

const STATES = ['TS 08', 'TS 09', 'TS 07', 'TS 10', 'AP 39']
let plates = 0
export const plateNumber = () => {
  const n = plates++
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ'
  return `${STATES[n % STATES.length]} ${letters[(n * 7) % 23]}${letters[(n * 11 + 3) % 23]} ${String(1000 + ((n * 7919) % 9000)).padStart(4, '0')}`
}

/**
 * A parked car of `body` in `colour`, centred at (x, y, z) and turned by `yaw` (front towards +z
 * at yaw 0).
 */
export function parkedCar(parent: Object3D, body: Body, colour: string, x: number, z: number, yaw: number, y = 0) {
  const s = SPECS[body]
  let b = shapes.get(body)
  if (!b) shapes.set(body, (b = new BodyShape(s)))
  const shape = b
  const m = materials()
  const g = new Group()
  g.name = `car_${body}`
  g.position.set(x, y, z)
  g.rotation.y = yaw
  parent.add(g)
  const add = (geo: BufferGeometry, material: Material, cast = true) => {
    const mesh = new Mesh(geo, material)
    mesh.castShadow = cast
    mesh.receiveShadow = true
    g.add(mesh)
    return mesh
  }

  // The shell.
  const shell = cached(`${body}:shell`, () => bodyGeometry(shape))
  add(shell.paint, paintMaterial(colour))
  add(shell.trim, m.trim)
  add(shell.under, m.under, false)
  add(shell.glass, m.glass, false)

  // Lamps, grille and plates, moulded to the nose and tail.
  const [hx0, hx1, hy0, hy1] = s.head
  const [tx0, tx1, ty0, ty1] = s.tail
  for (const side of [-1, 1] as const) {
    add(cached(`${body}:head${side}`, () => endPatch(shape, 1, side * hx0, side * hx1, hy0, hy1, 0.004)), m.head, false)
    add(cached(`${body}:tail${side}`, () => endPatch(shape, -1, side * tx0, side * tx1, ty0, ty1, 0.004)), m.tail, false)
  }
  const [gh, gy0, gy1] = s.grille
  add(cached(`${body}:grille`, () => endPatch(shape, 1, -gh, gh, gy0, gy1, 0.003, 20, 6)), m.grille, false)
  add(cached(`${body}:chromebar`, () => endPatch(shape, 1, -gh * 0.95, gh * 0.95, gy1 + 0.005, gy1 + 0.022, 0.005, 20, 1)), m.chrome, false)
  if (!s.cladding) add(cached(`${body}:lowergrille`, () => endPatch(shape, 1, -gh * 0.9, gh * 0.9, 0.3, 0.42, 0.003, 18, 3)), m.grille, false)
  const number = plateNumber()
  const plate = mat(`plate:${number}`, () => new MeshStandardMaterial({ map: plateMap(number), roughness: 0.45, userData: { plate: number } }))
  const plateGeo = cached('plate', () => {
    // 520 × 112 mm, facing +z.
    const q = new BufferGeometry()
    q.setAttribute('position', new BufferAttribute(new Float32Array([-0.26, -0.056, 0, 0.26, -0.056, 0, 0.26, 0.056, 0, -0.26, -0.056, 0, 0.26, 0.056, 0, -0.26, 0.056, 0]), 3))
    q.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), 2))
    q.computeVertexNormals()
    return q
  })
  for (const [dir, py] of [[1, s.plate[0]], [-1, s.plate[1]]] as const) {
    const pz = shape.endZ(0, py, dir)
    if (pz === null) continue
    const plateMesh = add(plateGeo, plate, false)
    plateMesh.position.set(0, py, pz + dir * 0.012)
    if (dir < 0) plateMesh.rotation.y = Math.PI
    // Its black holder behind.
    add(cached('plateHolder', () => new BoxGeometry(0.545, 0.128, 0.012)), m.trim, false).position.set(0, py, pz + dir * 0.004)
  }

  // Shut lines: bonnet-to-wing is in the shell's shape; doors are drawn as fine dark lines.
  const doors = [s.side[1] + 0.12, s.bPillar - 0.04, s.side[0] + s.rearDoor]
  for (const side of [-1, 1] as const)
    for (const dz of doors) add(cached(`${body}:door${side}:${dz}`, () => sideLine(shape, dz, 0.42, shape.section(dz).yB - 0.01, 0.004, side)), m.seam, false)

  // Mirrors on the doors at the A-pillar's foot, door handles, wipers, aerial.
  const mz = s.side[1] - 0.12
  const my = shape.section(mz).yB + 0.07
  for (const side of [-1, 1]) {
    const mw = shape.halfWidth(mz, my - 0.07)
    const housing = add(cached('mirror', () => new SphereGeometry(0.1, 20, 12)), partPaint(colour))
    housing.scale.set(1.0, 0.62, 0.55)
    housing.position.set(side * (mw + 0.11), my, mz - 0.04)
    const face = add(cached('mirrorGlass', () => new SphereGeometry(0.095, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), m.chrome, false)
    face.scale.set(0.95, 0.56, 0.08)
    face.rotation.x = -Math.PI / 2
    face.position.set(side * (mw + 0.11), my, mz - 0.07)
    const arm = add(cached('mirrorArm', () => new CylinderGeometry(0.018, 0.022, 0.1, 8)), m.trim)
    arm.rotation.z = Math.PI / 2
    arm.position.set(side * (mw + 0.035), my - 0.02, mz)
    for (const hz of [s.side[1] - 0.6, s.bPillar - 0.5]) {
      const hy = shape.section(hz).yB - 0.09
      const handle = add(cached('handle', () => new CylinderGeometry(0.014, 0.014, 0.17, 10)), partPaint(colour), false)
      handle.rotation.x = Math.PI / 2
      handle.position.set(side * (shape.halfWidth(hz, hy) + 0.008), hy, hz)
    }
  }
  for (const wx of [-0.38, 0.12]) {
    const zc = s.screen[0] - 0.05
    const wiper = add(cached('wiper', () => new CylinderGeometry(0.008, 0.008, 0.62, 6)), m.trim, false)
    wiper.rotation.z = Math.PI / 2 - 0.12
    wiper.position.set(wx, shape.section(zc).yT + 0.018, zc)
  }
  const finZ = (s.back[1] + s.screen[1]) / 2 - 0.5
  const fin = add(cached('fin', () => new SphereGeometry(0.06, 12, 8)), partPaint(colour))
  fin.scale.set(0.45, 0.9, 1.6)
  fin.position.set(0, shape.section(finZ).yT + 0.01, s.back[1] + 0.25)
  if (s.rails)
    for (const side of [-1, 1]) {
      const zr = [s.back[1] + 0.12, s.screen[1] - 0.1]
      const rail = add(cached(`${body}:rail`, () => new CylinderGeometry(0.014, 0.014, zr[1] - zr[0], 8)), m.trim)
      rail.rotation.x = Math.PI / 2
      const zm = (zr[0] + zr[1]) / 2
      const sec = shape.section(zm)
      rail.position.set(side * (shape.halfWidth(zm, sec.yT - 0.06) - 0.04), sec.yT + 0.035, zm)
      for (const zz of zr) {
        const foot = add(cached('railFoot', () => new CylinderGeometry(0.02, 0.025, 0.05, 8)), m.trim)
        foot.position.set(side * (shape.halfWidth(zz, sec.yT - 0.06) - 0.04), shape.section(zz).yT + 0.015, zz)
      }
    }

  // The cabin behind the glass: dashboard, steering wheel on the right, seats front and rear.
  const dashZ = s.screen[0] - 0.25
  const belt = shape.section(0).yB
  const dash = add(cached(`${body}:dash`, () => new CylinderGeometry(0.09, 0.12, s.width - 0.32, 12)), m.cabin, false)
  dash.rotation.z = Math.PI / 2
  dash.position.set(0, belt - 0.04, dashZ)
  const wheel = add(cached('steering', () => new TorusGeometry(0.18, 0.02, 8, 28)), m.trim, false)
  wheel.position.set(-0.37, belt + 0.06, dashZ - 0.22)
  wheel.rotation.x = -0.35
  for (const [sx, sz] of [[-0.37, s.bPillar + 0.15], [0.37, s.bPillar + 0.15], [0, s.bPillar - 0.72]] as const) {
    const wide = sx === 0 ? s.width - 0.45 : 0.5
    add(cached(`cushion:${wide}`, () => new BoxGeometry(wide, 0.13, 0.5)), m.seat, false).position.set(sx, belt - 0.42, sz)
    const back = add(cached(`back:${wide}`, () => new BoxGeometry(wide, 0.62, 0.13)), m.seat, false)
    back.position.set(sx, belt - 0.08, sz - 0.27)
    back.rotation.x = -0.2
  }

  // Wheels: tyre, alloy barrel and spokes, centre cap and nuts, disc and caliper.
  const { r, w } = s.tyre
  const rimR = r * 0.62
  for (const az of s.axles)
    for (const side of [-1, 1]) {
      const wg = new Group()
      // Lathe axis is y: turn it to x, outer face outwards.
      wg.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2
      wg.position.set(side * (s.width / 2 - 0.05 - w / 2), r, az)
      g.add(wg)
      const part = (geo: BufferGeometry, material: Material, py = 0, cast = true) => {
        const mesh = new Mesh(geo, material)
        mesh.position.y = py
        mesh.castShadow = cast
        mesh.receiveShadow = true
        wg.add(mesh)
        return mesh
      }
      part(cached(`tyre:${r}:${w}`, () => tyreGeometry(r, w)), m.tyre)
      part(cached(`rim:${rimR}:${w}`, () => rimGeometry(rimR, w)), m.alloy, 0, false)
      part(cached(`spokes:${rimR}`, () => spokeGeometry(rimR)), m.alloy, w * 0.2, false)
      part(cached(`cap:${rimR}`, () => new CylinderGeometry(rimR * 0.26, rimR * 0.3, 0.03, 24)), m.alloy, w * 0.25, false)
      part(cached('capLogo', () => new CylinderGeometry(0.025, 0.025, 0.004, 16)), m.gloss, w * 0.25 + 0.017, false)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 5
        const nut = part(cached('nut', () => new CylinderGeometry(0.009, 0.009, 0.025, 6)), m.chrome, w * 0.24, false)
        nut.position.x = Math.cos(a) * rimR * 0.4
        nut.position.z = Math.sin(a) * rimR * 0.4
      }
      part(cached(`disc:${rimR}`, () => new CylinderGeometry(rimR * 0.82, rimR * 0.82, 0.024, 32)), m.disc, -w * 0.05, false)
      const cal = part(cached('caliper', () => new CylinderGeometry(0.05, 0.05, 0.06, 10)), m.caliper, -w * 0.02, false)
      cal.scale.set(1, 1, 2.2)
      cal.position.set(rimR * 0.6, -w * 0.02, -rimR * 0.2)
    }
  return g
}
