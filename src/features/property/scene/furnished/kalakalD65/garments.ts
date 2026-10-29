import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, TorusGeometry, type Material, type Object3D } from 'three'
import type { Kit } from '../kit'
import { rng, type Paint } from '../textures'

/*
 * Clothes for the wardrobe: shirts, trousers folded over a bar, a dress and jackets on wooden
 * hangers, and folded stacks for the shelf. Each hanging garment is cut from its own silhouette
 * (shoulders, sleeves, hem), given a thickness that thins to the edges, and then hung: folds fall
 * from the shoulders and deepen towards the hem. Built facing ±z, width along x, hanging from y = 0.
 */

type Kind = 'shirt' | 'trousers' | 'dress' | 'jacket'

const OUTLINES: Record<Kind, [number, number][]> = {
  shirt: [[0.06, 0], [0.19, -0.045], [0.235, -0.09], [0.245, -0.6], [0.2, -0.62], [0.195, -0.25], [0.2, -0.76], [0.0, -0.775]],
  jacket: [[0.07, 0], [0.21, -0.05], [0.255, -0.1], [0.262, -0.66], [0.21, -0.68], [0.205, -0.28], [0.215, -0.8], [0.0, -0.815]],
  dress: [[0.05, 0], [0.13, -0.03], [0.15, -0.3], [0.13, -0.42], [0.25, -0.84], [0.0, -0.86]],
  trousers: [[0.0, 0.0], [0.19, 0.0], [0.19, -0.04], [0.185, -0.55], [0.03, -0.56], [0.0, -0.3]],
}

/** The full silhouette: points are given for the right half, from the neck round to the hem's centre. */
function polygon(kind: Kind): [number, number][] {
  const half = OUTLINES[kind]
  return [...half, ...[...half].reverse().map(([x, y]) => [-x, y] as [number, number])]
}

/** The nearest point on the silhouette's edge, to pull boundary vertices onto it. */
function nearestOnEdge(pts: [number, number][], x: number, y: number): [number, number] {
  let best: [number, number] = [x, y]
  let bd = Infinity
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ax, ay] = pts[j]
    const [bx, by] = pts[i]
    const dx = bx - ax
    const dy = by - ay
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)))
    const px = ax + t * dx
    const py = ay + t * dy
    const d = (px - x) ** 2 + (py - y) ** 2
    if (d < bd) [bd, best] = [d, [px, py]]
  }
  return best
}

function inside(pts: [number, number][], x: number, y: number) {
  let c = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

const THICK: Record<Kind, number> = { shirt: 0.012, jacket: 0.02, dress: 0.01, trousers: 0.022 }
const STEP = 0.01

const geoCache = new WeakMap<Kit, Map<string, BufferGeometry>>()

/**
 * A garment as a finely tessellated front and back cut to its silhouette, then hung: folds fall
 * from the shoulders and deepen towards the hem, and the body bellies out a little.
 */
function garmentGeometry(k: Kit, kind: Kind, seed: number) {
  let cache = geoCache.get(k)
  if (!cache) geoCache.set(k, (cache = new Map()))
  const key = `${kind}${seed}`
  const hit = cache.get(key)
  if (hit) return hit
  const pts = polygon(kind)
  const t = THICK[kind]
  const r = rng(seed)
  const ph = [r() * 6, r() * 6, r() * 6, r() * 6]
  const xs = pts.map((q) => q[0])
  const ys = pts.map((q) => q[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const nx = Math.ceil((x1 - x0) / STEP)
  const ny = Math.ceil((y1 - y0) / STEP)
  const surface = (x: number, y: number, side: number): [number, number, number] => {
    const fall = Math.min(1, (y1 - y) / 0.8)
    const fold = 0.016 * fall * (Math.sin(x * 26 + ph[0]) + 0.5 * Math.sin(x * 61 + ph[1]) + 0.3 * Math.sin(y * 9 + ph[3]))
    const belly = 0.01 * Math.sin(Math.min(1, (y1 - y) / 0.7) * Math.PI) * Math.cos(x * 3)
    // Thickness thins to the edges, so the hems and sleeves read as cloth, not board.
    const fullness = Math.min(1, Math.max(0, Math.min(x - x0, x1 - x, y - y0 + 0.02, y1 - y + 0.02) / 0.04) ** 0.5)
    return [x * (1 + 0.05 * fall * Math.sin(ph[2])), y, fold + belly + side * (t / 2) * fullness]
  }
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  // Grid points outside the silhouette but used by an edge cell are pulled onto the outline,
  // so hems, sleeves and shoulders have clean edges rather than a stepped grid.
  const used = new Set<number>()
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++)
      if (inside(pts, x0 + (i + 0.5) * STEP, y0 + (j + 0.5) * STEP)) for (const v of [j * (nx + 1) + i, j * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i, (j + 1) * (nx + 1) + i + 1]) used.add(v)
  const at = (i: number, j: number): [number, number] => {
    const x = x0 + i * STEP
    const y = y0 + j * STEP
    return used.has(j * (nx + 1) + i) && !inside(pts, x, y) ? nearestOnEdge(pts, x, y) : [x, y]
  }
  for (const side of [1, -1]) {
    const base = pos.length / 3
    for (let j = 0; j <= ny; j++)
      for (let i = 0; i <= nx; i++) {
        const [x, y] = at(i, j)
        pos.push(...surface(x, y, side))
        uv.push(x / 0.25, y / 0.25)
      }
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const cx = x0 + (i + 0.5) * STEP
        const cy = y0 + (j + 0.5) * STEP
        if (!inside(pts, cx, cy)) continue
        const a = base + j * (nx + 1) + i
        const b = a + 1
        const c = a + nx + 1
        const d = c + 1
        if (side > 0) idx.push(a, b, c, b, d, c)
        else idx.push(a, c, b, b, c, d)
      }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  cache.set(key, g)
  return g
}

/** Fabric with a visible weave: plain, stripe, twill (denim) or a fine herringbone, in a colour. */
export const cloth = (tone: string, kind: 'plain' | 'stripe' | 'twill' | 'herringbone', seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = tone
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.07})`
    g.fillRect(r() * w, r() * h, 1.5, 1.5)
  }
  if (kind === 'stripe') {
    g.fillStyle = 'rgba(40,60,90,.55)'
    for (let x = 0; x < w; x += w / 16) g.fillRect(x, 0, 2.5, h)
  } else if (kind === 'twill' || kind === 'herringbone') {
    g.strokeStyle = 'rgba(255,255,255,.08)'
    g.lineWidth = 1.5
    for (let i = -h; i < w; i += 5) {
      g.beginPath()
      const flip = kind === 'herringbone' && Math.floor(i / 20) % 2 === 0
      g.moveTo(i, flip ? h : 0)
      g.lineTo(i + h, flip ? 0 : h)
      g.stroke()
    }
  }
}

/** A wooden hanger on the rail at y = 0: hook, neck, sloping arms and a trouser bar. */
export function hanger(k: Kit, parent: Object3D, wood: Material, steel: Material) {
  const g = new Group()
  parent.add(g)
  const hook = new Mesh(new TorusGeometry(0.022, 0.0028, 6, 18, Math.PI * 1.3), steel)
  hook.position.set(0, 0.015, 0)
  hook.rotation.z = -0.3
  g.add(hook)
  k.cyl(g, 0.003, 0.003, 0.04, steel, 0, -0.012, 0, 6)
  for (const s of [-1, 1]) {
    const arm = k.box(g, 0.22, 0.016, 0.012, wood, s * 0.1, -0.06, 0)
    arm.rotation.z = s * -0.33
  }
  k.box(g, 0.36, 0.008, 0.008, wood, 0, -0.1, 0)
  return g
}

export interface Wardrobe {
  wood: Material
  steel: Material
}

/** One garment on its hanger, hung at `x` along the rail (rail along z, garment width along x). */
export function hangGarment(k: Kit, parent: Object3D, kind: Kind, mat: Material, at: { x: number; y: number; z: number }, seed: number, w: Wardrobe) {
  const g = new Group()
  g.position.set(at.x, at.y, at.z)
  // Garments face the doors, their width across the rail (the rail runs along z); each hangs a touch askew.
  g.rotation.y = (rng(seed)() - 0.5) * 0.12
  parent.add(g)
  hanger(k, g, w.wood, w.steel)
  const body = new Group()
  body.position.y = kind === 'trousers' ? -0.1 : -0.035
  g.add(body)
  const m = new Mesh(garmentGeometry(k, kind, seed), mat)
  m.castShadow = m.receiveShadow = true
  body.add(m)
  details(k, body, kind, mat)
}

const trims = new WeakMap<Kit, { button: Material; seam: Material }>()

/** Collars, plackets, buttons, cuffs, lapels, waistbands: the parts that make a garment read as one. */
function details(k: Kit, g: Group, kind: Kind, mat: Material) {
  let t = trims.get(k)
  if (!t) trims.set(k, (t = { button: new MeshStandardMaterial({ color: '#e8e2d6', roughness: 0.35 }), seam: new MeshStandardMaterial({ color: '#000000', transparent: true, opacity: 0.12, depthWrite: false }) }))
  const front = THICK[kind] / 2 + 0.004
  if (kind === 'shirt' || kind === 'jacket') {
    const r = kind === 'jacket' ? 0.072 : 0.062
    const collar = new Mesh(new TorusGeometry(r, kind === 'jacket' ? 0.016 : 0.011, 8, 24, Math.PI * 1.25), mat)
    collar.rotation.set(Math.PI / 2, 0, Math.PI * 1.375)
    collar.position.set(0, -0.012, 0)
    collar.castShadow = true
    g.add(collar)
    // Cuffs at the sleeve ends.
    for (const s of [-1, 1]) k.box(g, 0.05, 0.055, THICK[kind] + 0.01, mat, s * (kind === 'jacket' ? 0.236 : 0.22), kind === 'jacket' ? -0.64 : -0.585, 0)
  }
  if (kind === 'shirt') {
    k.box(g, 0.026, 0.7, 0.004, mat, 0, -0.41, front)
    for (let i = 0; i < 7; i++) k.cyl(g, 0.0055, 0.0055, 0.003, t.button, 0, -0.08 - i * 0.1, front + 0.003, 10).rotation.x = Math.PI / 2
  } else if (kind === 'jacket') {
    // Notched lapels rolling down to a two-button front, and flap pockets.
    for (const s of [-1, 1]) {
      const lapel = k.box(g, 0.065, 0.28, 0.006, mat, s * 0.05, -0.17, front + 0.002)
      lapel.rotation.z = s * 0.32
      k.box(g, 0.12, 0.035, 0.006, mat, s * 0.11, -0.56, front + 0.002)
    }
    for (const y of [-0.42, -0.52]) k.cyl(g, 0.009, 0.009, 0.004, t.button, 0, y, front + 0.004, 12).rotation.x = Math.PI / 2
  } else if (kind === 'trousers') {
    // The fold over the hanger bar, and the pressed creases down each leg.
    const fold = k.cyl(g, 0.016, 0.016, 0.39, mat, 0, 0.0, 0, 16)
    fold.rotation.z = Math.PI / 2
    for (const s of [-1, 1]) k.box(g, 0.003, 0.5, 0.002, t.seam, s * 0.095, -0.3, front, false)
  } else {
    // Shoulder straps up to the hanger, and a seam at the waist.
    for (const s of [-1, 1]) k.box(g, 0.018, 0.06, 0.006, mat, s * 0.09, 0.02, 0)
    k.box(g, 0.3, 0.008, THICK.dress + 0.006, mat, 0, -0.4, 0)
  }
}

/** A neatly folded garment for a shelf: a soft slab with a rolled front edge. */
export function folded(k: Kit, parent: Object3D, x: number, y: number, z: number, w: number, d: number, h: number, mat: MeshStandardMaterial, ry = 0) {
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = ry
  parent.add(g)
  k.soft(g, w, h, d, Math.min(0.012, h / 2 - 0.002), mat, 0, h / 2, 0)
  k.soft(g, w - 0.01, h * 0.55, 0.03, Math.min(0.01, h * 0.25), mat, 0, h * 0.5, d / 2 - 0.012)
}
