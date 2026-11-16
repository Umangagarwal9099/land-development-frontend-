import { DoubleSide, MeshStandardMaterial, RepeatWrapping, type Texture } from 'three'
import type { Kit } from '../../kit'
import { rng, type Paint } from '../../textures'

/*
 * Natural stone for the mall's floors and walls, painted the way the stones are: a slab's ground
 * with its cloudy fields, a few long veins wandering across it (each a soft halo, a crisp core and
 * the capillaries branching off it), and fine grain. Slabs are bookmatched in fours, as they are
 * cut from the block and laid, so the veins meet mirrored at the joints instead of repeating.
 * A repeat covers 2.4 m: four 1.2 m slabs.
 */

interface Vein {
  colour: string
  /** Core width and halo width, pixels on a 1024 px slab. */
  width: [number, number]
  alpha: number
  count: number
  /** How much a vein wanders, and how many capillaries branch from it. */
  wander: number
  branches: number
}

export interface StoneSpec {
  ground: [number, number, number]
  clouds: string[]
  veins: Vein[]
  /** Specks of grain (fossil fragments in a limestone, mica in a granite). */
  grain?: { colour: string; count: number; size: number }
  /** Banding instead of veins (an onyx). */
  bands?: string[]
  /** Laid one slab to a repeat, not bookmatched. */
  single?: boolean
  seed: number
}

/** A wandering line across the slab: a sum of slow sines on a straight course. */
function course(r: () => number, size: number, wander: number) {
  const angle = (r() - 0.5) * 1.3 + (r() < 0.5 ? 0 : Math.PI / 2)
  const cx = r() * size
  const cy = r() * size
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const phases = [r() * 6, r() * 6, r() * 6]
  const pts: [number, number][] = []
  const L = size * 1.6
  for (let t = -L / 2; t <= L / 2; t += 6) {
    const off = wander * (Math.sin(t / 170 + phases[0]) * 0.6 + Math.sin(t / 61 + phases[1]) * 0.3 + Math.sin(t / 23 + phases[2]) * 0.1)
    pts.push([cx + dx * t - dy * off, cy + dy * t + dx * off])
  }
  return pts
}

function stroke(g: CanvasRenderingContext2D, pts: [number, number][], from = 0, to = pts.length) {
  g.beginPath()
  g.moveTo(pts[from][0], pts[from][1])
  for (let i = from + 1; i < to; i++) g.lineTo(pts[i][0], pts[i][1])
  g.stroke()
}

/** One 1.2 m slab of a stone, on a square canvas. */
function paintSlab(g: CanvasRenderingContext2D, size: number, s: StoneSpec, seed: number) {
  const r = rng(seed)
  const [cr, cg, cb] = s.ground
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, size, size)
  // Cloudy fields, blurred together.
  g.filter = 'blur(28px)'
  for (let i = 0; i < 26; i++) {
    g.fillStyle = s.clouds[i % s.clouds.length]
    g.globalAlpha = 0.18 + r() * 0.25
    g.beginPath()
    g.ellipse(r() * size, r() * size, 60 + r() * 260, 30 + r() * 140, r() * 3.14, 0, 7)
    g.fill()
  }
  g.globalAlpha = 1
  g.filter = 'none'
  if (s.bands) {
    // Onyx: soft flowing bands.
    g.filter = 'blur(6px)'
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = s.bands[i % s.bands.length]
      g.globalAlpha = 0.25 + r() * 0.35
      g.lineWidth = 4 + r() * 26
      stroke(g, course(r, size, 160))
    }
    g.filter = 'none'
    g.globalAlpha = 1
  }
  g.lineCap = 'round'
  g.lineJoin = 'round'
  for (const v of s.veins)
    for (let n = 0; n < v.count; n++) {
      const pts = course(r, size, v.wander)
      // A soft halo, then the crisp core, thinning along its length.
      g.strokeStyle = v.colour
      g.filter = 'blur(7px)'
      g.globalAlpha = v.alpha * 0.35
      g.lineWidth = v.width[1]
      stroke(g, pts)
      g.filter = 'blur(0.6px)'
      const seg = Math.max(4, Math.floor(pts.length / 6))
      for (let i = 0; i + 1 < pts.length; i += seg) {
        g.globalAlpha = v.alpha * (0.55 + r() * 0.45)
        g.lineWidth = Math.max(0.6, v.width[0] * (0.4 + r() * 0.9))
        stroke(g, pts, i, Math.min(pts.length, i + seg + 1))
      }
      // Capillaries off the vein.
      g.lineWidth = Math.max(0.4, v.width[0] * 0.22)
      for (let b = 0; b < v.branches; b++) {
        const i = Math.floor(r() * pts.length)
        const [x0, y0] = pts[i]
        const a = r() * Math.PI * 2
        let x = x0
        let y = y0
        g.globalAlpha = v.alpha * (0.12 + r() * 0.22)
        g.beginPath()
        g.moveTo(x, y)
        const len = 4 + Math.floor(r() * 9)
        for (let k = 0; k < len; k++) {
          x += Math.cos(a + (r() - 0.5) * 1.4) * 9
          y += Math.sin(a + (r() - 0.5) * 1.4) * 9
          g.lineTo(x, y)
        }
        g.stroke()
      }
    }
  g.filter = 'none'
  g.globalAlpha = 1
  if (s.grain)
    for (let i = 0; i < s.grain.count; i++) {
      g.fillStyle = s.grain.colour
      g.globalAlpha = 0.15 + r() * 0.35
      g.beginPath()
      g.ellipse(r() * size, r() * size, s.grain.size * (0.4 + r()), s.grain.size * (0.2 + r() * 0.5), r() * 3, 0, 7)
      g.fill()
    }
  g.globalAlpha = 1
}

/** Four slabs bookmatched about their joints, with hairline joints between them. */
export const bookmatched = (s: StoneSpec, joints = true): Paint => (g, w, h) => {
  // Small-format stones (borders, inlays, linings) are laid as cut, one slab per repeat: mirrored
  // four ways at that size they would read as a kaleidoscope.
  if (s.single) {
    paintSlab(g, w, s, s.seed)
    if (joints) {
      g.fillStyle = 'rgba(90,82,72,.45)'
      g.fillRect(0, 0, 1.2, h)
      g.fillRect(0, 0, w, 1.2)
    }
    return
  }
  const half = w / 2
  const slab = document.createElement('canvas')
  slab.width = slab.height = half
  paintSlab(slab.getContext('2d')!, half, s, s.seed)
  for (const [ix, iy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    g.save()
    g.translate(ix * half + (ix ? half : 0), iy * half + (iy ? half : 0))
    g.scale(ix ? -1 : 1, iy ? -1 : 1)
    g.drawImage(slab, 0, 0)
    g.restore()
  }
  if (joints) {
    g.fillStyle = 'rgba(90,82,72,.45)'
    for (const p of [0, half]) {
      g.fillRect(p, 0, 1.2, h)
      g.fillRect(0, p, w, 1.2)
    }
  }
}

/* ---------- the stones ---------- */

export const STONES = {
  /** Warm white with grey and gold veins: the ground floor. */
  calacattaOro: { ground: [243, 238, 229], clouds: ['#e6ddcf', '#f8f5ef', '#ddd2c0'], veins: [{ colour: '#7f7262', width: [3.2, 16], alpha: 0.75, count: 3, wander: 70, branches: 5 }, { colour: '#b39363', width: [1.6, 9], alpha: 0.6, count: 3, wander: 50, branches: 6 }], seed: 11 },
  /** Bright white with bold grey veins: the first floor. */
  statuario: { ground: [245, 245, 243], clouds: ['#e7e8e8', '#fafafa', '#dfe0e2'], veins: [{ colour: '#5f646b', width: [3.8, 20], alpha: 0.7, count: 3, wander: 90, branches: 5 }, { colour: '#8d9299', width: [1.2, 6], alpha: 0.55, count: 5, wander: 40, branches: 4 }], seed: 23 },
  /** A warm cream limestone with fossil grain: the second floor. */
  crema: { ground: [229, 214, 189], clouds: ['#dccaa9', '#efe3cc', '#d3bf9c'], veins: [{ colour: '#b4966b', width: [1.0, 7], alpha: 0.35, count: 4, wander: 30, branches: 3 }], grain: { colour: '#a88c62', count: 900, size: 2.2 }, single: true, seed: 31 },
  /** Charcoal with fine white veins: the gaming floor. */
  grigio: { ground: [58, 58, 60], clouds: ['#4a4a4d', '#6a6a6d', '#3c3c3f'], veins: [{ colour: '#e8e6e2', width: [1.4, 6], alpha: 0.55, count: 5, wander: 40, branches: 4 }, { colour: '#a7a6a3', width: [0.8, 4], alpha: 0.4, count: 6, wander: 25, branches: 4 }], seed: 37 },
  /** White with burgundy and grey veins: the dining floor. */
  viola: { ground: [242, 238, 234], clouds: ['#e9e1dc', '#f7f4f1', '#e2d8d3'], veins: [{ colour: '#6b3340', width: [3.4, 18], alpha: 0.65, count: 3, wander: 80, branches: 5 }, { colour: '#8c8789', width: [1.2, 7], alpha: 0.5, count: 3, wander: 40, branches: 5 }], seed: 43 },
  /** Nero Marquina: black with white veins, for borders and inlays. */
  nero: { ground: [27, 26, 25], clouds: ['#222120', '#323130', '#1a1918'], veins: [{ colour: '#ebe8e3', width: [1.5, 6], alpha: 0.7, count: 4, wander: 50, branches: 5 }], single: true, seed: 53 },
  /** Emperador Dark: brown with cream veins, for borders. */
  emperador: { ground: [83, 60, 44], clouds: ['#6c4c36', '#8e6a4f', '#5a3f2e'], veins: [{ colour: '#d6bb95', width: [1.4, 7], alpha: 0.6, count: 6, wander: 30, branches: 6 }], single: true, seed: 61 },
  /** Honey onyx, lit from behind. */
  onyx: { ground: [236, 188, 118], clouds: ['#f3cf92', '#d9a35c', '#fae3b8'], veins: [], bands: ['#c98a3e', '#f6dcaa', '#b7742d', '#fff1d2'], single: true, seed: 71 },
  /** Grey-white for the washrooms' walls. */
  bianco: { ground: [236, 236, 234], clouds: ['#e2e2e1', '#f3f3f2'], veins: [{ colour: '#9a9ca0', width: [1.2, 8], alpha: 0.45, count: 4, wander: 60, branches: 8 }], single: true, seed: 83 },
  /** Fior di Bosco: warm grey with white and dark veins, the Dior fascia. */
  fiorDiBosco: { ground: [138, 130, 122], clouds: ['#9a928a', '#7f7770', '#b3aba2'], veins: [{ colour: '#f1ede7', width: [2.2, 12], alpha: 0.7, count: 4, wander: 70, branches: 6 }, { colour: '#5e5651', width: [1.0, 6], alpha: 0.4, count: 3, wander: 40, branches: 4 }], seed: 91 },
  /** Nero Marquina in big slabs with bold white veining, the Prada floor. */
  marquina: { ground: [21, 21, 23], clouds: ['#1a1a1c', '#2c2c2f', '#151517'], veins: [{ colour: '#f2f0ec', width: [4.0, 22], alpha: 0.8, count: 3, wander: 110, branches: 8 }, { colour: '#cfcdc8', width: [1.2, 6], alpha: 0.5, count: 5, wander: 50, branches: 6 }], seed: 97 },
} satisfies Record<string, StoneSpec>

export type StoneName = keyof typeof STONES

/** Walnut herringbone parquet: 70 × 490 mm blocks, 1.4 m a repeat. */
const herringbone: Paint = (g, w, h) => {
  const r = rng(97)
  g.fillStyle = '#4a3020'
  g.fillRect(0, 0, w, h)
  const L = w / 2
  const W = L / 7
  for (let row = -2; row < 12; row++)
    for (let col = -2; col < 6; col++)
      for (const flip of [0, 1]) {
        const x = col * L + (flip ? L / 2 : 0)
        const y = row * W * 2 + (flip ? W : 0)
        g.save()
        g.translate(x + (flip ? L / 2 : 0), y)
        g.rotate(flip ? -Math.PI / 4 : Math.PI / 4)
        const t = 0.8 + r() * 0.35
        g.fillStyle = `rgb(${Math.round(112 * t)},${Math.round(76 * t)},${Math.round(50 * t)})`
        g.fillRect(0, 0, L * 0.7, W)
        for (let k = 0; k < 6; k++) {
          g.fillStyle = `rgba(40,24,14,${0.08 + r() * 0.12})`
          g.fillRect(0, r() * W, L * 0.7, 1)
        }
        g.strokeStyle = 'rgba(25,15,8,.6)'
        g.strokeRect(0, 0, L * 0.7, W)
        g.restore()
      }
}

/** Polished stone as a material: true scale (UVs in metres), with a whisper of relief. */
const painted = new WeakMap<Kit, Map<string, Texture>>()

export function stoneMaterial(k: Kit, name: StoneName, env: Texture, opts: { roughness?: number; reflect?: number; size?: number; emissive?: boolean; repeat?: number } = {}) {
  const size = opts.size ?? 2048
  let cache = painted.get(k)
  if (!cache) painted.set(k, (cache = new Map()))
  let base = cache.get(`${name}@${size}`)
  if (!base) cache.set(`${name}@${size}`, (base = k.tex.painted(size, size, bookmatched(STONES[name]))))
  // Each material its own repeat, on the one painting.
  const map = base.clone()
  map.wrapS = map.wrapT = RepeatWrapping
  const metres = opts.repeat ?? 2.4
  map.repeat.set(1 / metres, 1 / metres)
  map.anisotropy = 8
  const m = new MeshStandardMaterial({ map, roughness: opts.roughness ?? 0.09, metalness: 0, envMap: env, envMapIntensity: opts.reflect ?? 0.85 })
  if (opts.emissive) {
    m.emissiveMap = map
    m.emissive.set('#ffffff')
    m.emissiveIntensity = 0.75
  }
  m.userData.interior = true
  return m
}

export function herringboneMaterial(k: Kit, env: Texture) {
  const map = k.tex.painted(1024, 1024, herringbone)
  map.wrapS = map.wrapT = RepeatWrapping
  map.repeat.set(1 / 1.4, 1 / 1.4)
  const m = new MeshStandardMaterial({ map, roughness: 0.32, envMap: env, envMapIntensity: 0.5, side: DoubleSide })
  m.userData.interior = true
  return m
}
