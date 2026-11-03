import { BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, Mesh, MeshStandardMaterial, Quaternion, Vector2, Vector3, type Material, type Object3D } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Kit } from '../kit'
import { rng, type Paint } from '../textures'

/*
 * Vegetation grown in code rather than stamped: every tree is a branching structure of tapered,
 * bark-textured limbs, its crown made of individual leaf sprigs (painted with real leaf shapes and
 * veins) hung on the twigs, each sprig tinted a little differently and shaded darker deep inside
 * the crown, as real foliage self-shadows. Shrubs and clipped hedges are built the same way; lawns
 * are fields of individual blades. All of it is gathered into one mesh per material.
 *
 * The species are those of a Hyderabad commercial frontage: neem and rain tree for shade, mast
 * Ashoka for the slim columns along a boundary, with duranta hedging and ixora-like shrubs.
 */

export type LeafKind = 'neem' | 'rain' | 'ashoka' | 'shrub' | 'hedge'
const KINDS: LeafKind[] = ['neem', 'rain', 'ashoka', 'shrub', 'hedge']

/* ---------- painted leaves and bark ---------- */

type Rand = () => number

/** One leaf blade drawn from its base along `ang` (0 = up the canvas), with midrib and veins. */
function blade(g: CanvasRenderingContext2D, r: Rand, x: number, y: number, ang: number, len: number, wid: number, hue: number, light: number, wavy = 0) {
  g.save()
  g.translate(x, y)
  g.rotate(ang)
  const sat = 32 + r() * 18
  const l = light + r() * 8
  const grad = g.createLinearGradient(-wid, 0, wid, 0)
  grad.addColorStop(0, `hsl(${hue},${sat}%,${l - 5}%)`)
  grad.addColorStop(0.5, `hsl(${hue + 4},${sat + 6}%,${l + 6}%)`)
  grad.addColorStop(1, `hsl(${hue},${sat}%,${l - 3}%)`)
  g.fillStyle = grad
  g.beginPath()
  g.moveTo(0, 0)
  const steps = wavy ? 8 : 1
  if (steps === 1) {
    g.quadraticCurveTo(wid * 1.25, -len * 0.42, 0, -len)
    g.quadraticCurveTo(-wid * 1.25, -len * 0.42, 0, 0)
  } else {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const w = Math.sin(Math.PI * Math.min(1, t * 1.1)) * wid + Math.sin(t * 19) * wavy
      g.lineTo(w, -len * t)
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps
      const w = Math.sin(Math.PI * Math.min(1, t * 1.1)) * wid - Math.sin(t * 17) * wavy
      g.lineTo(-w, -len * t)
    }
  }
  g.fill()
  g.strokeStyle = `hsla(${hue},30%,${l - 12}%,.6)`
  g.lineWidth = 1
  g.stroke()
  // Midrib and a few pairs of veins.
  g.strokeStyle = `hsla(${hue + 10},35%,${l + 18}%,.55)`
  g.lineWidth = Math.max(1, wid * 0.08)
  g.beginPath()
  g.moveTo(0, 0)
  g.lineTo(0, -len * 0.96)
  g.stroke()
  g.lineWidth = 0.7
  for (let t = 0.2; t < 0.85; t += 0.13) {
    const w = Math.sin(Math.PI * t) * wid * 0.8
    g.beginPath()
    g.moveTo(0, -len * t)
    g.lineTo(w, -len * (t + 0.08))
    g.moveTo(0, -len * t)
    g.lineTo(-w, -len * (t + 0.08))
    g.stroke()
  }
  g.restore()
}

function stem(g: CanvasRenderingContext2D, pts: [number, number][], w: number) {
  g.strokeStyle = '#4e4636'
  g.lineWidth = w
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(...pts[0])
  for (const p of pts.slice(1)) g.lineTo(...p)
  g.stroke()
}

/** A sprig of each kind in one 512 px cell, its twig rising from the bottom centre. */
const SPRIGS: Record<LeafKind, (g: CanvasRenderingContext2D, r: Rand, s: number) => void> = {
  // Neem: a pinnate leaf of sickle-shaped, toothed leaflets in near-opposite pairs.
  neem: (g, r, s) => {
    for (let k = 0; k < 2; k++) {
      const bend = (r() - 0.5) * 0.5 + (k ? 0.45 : -0.45)
      const pts: [number, number][] = []
      for (let i = 0; i <= 10; i++) pts.push([s / 2 + Math.sin(bend) * s * 0.42 * (i / 10) + Math.sin(i / 3) * 6, s - 12 - (s - 40) * (i / 10)])
      stem(g, pts, 3)
      for (let i = 1; i < 10; i++) {
        const [x, y] = pts[i]
        const len = 105 - i * 4 + r() * 18
        for (const side of [-1, 1]) blade(g, r, x, y, bend + side * (1.0 + r() * 0.25), len, 15 + r() * 4, 92 + r() * 16, 26, 1.2)
      }
      blade(g, r, pts[10][0], pts[10][1], bend, 62, 11, 98, 28)
    }
  },
  // Rain tree: bipinnate, fans of small oblong leaflets.
  rain: (g, r, s) => {
    for (let k = 0; k < 4; k++) {
      const ang = -0.9 + k * 0.6 + (r() - 0.5) * 0.2
      const pts: [number, number][] = []
      for (let i = 0; i <= 8; i++) pts.push([s / 2 + Math.sin(ang) * (s * 0.46) * (i / 8), s - 10 - Math.cos(ang) * (s * 0.46) * (i / 8) - i * 4])
      stem(g, pts, 2.2)
      for (let i = 1; i <= 8; i++) {
        const [x, y] = pts[i]
        for (const side of [-1, 1]) blade(g, r, x, y, ang + side * (1.2 + r() * 0.2), 52 + r() * 12, 14, 84 + r() * 18, 30)
      }
    }
  },
  // Mast Ashoka: long, narrow, wavy-edged leaves hanging from a short twig.
  ashoka: (g, r, s) => {
    stem(g, [[s / 2, s - 8], [s / 2 + 6, s * 0.35], [s / 2 + 2, 30]], 3.5)
    for (let i = 0; i < 7; i++) {
      const y = 40 + i * (s * 0.11)
      const side = i % 2 ? 1 : -1
      blade(g, r, s / 2 + side * 4, y, Math.PI + side * (0.25 + r() * 0.25), s * 0.55 + r() * 40, 17 + r() * 4, 105 + r() * 12, 21, 2.2)
    }
  },
  // A flowering shrub's glossy, oval leaves crowding a twig.
  shrub: (g, r, s) => {
    stem(g, [[s / 2, s - 6], [s / 2 + 10, s * 0.5], [s / 2 - 4, 60]], 4)
    for (let i = 0; i < 40; i++) {
      const t = i / 26
      const x = s / 2 + Math.sin(t * 5) * 10
      const y = s - 30 - t * (s - 110)
      blade(g, r, x, y, (r() - 0.5) * 3.4, 80 + r() * 50, 30 + r() * 10, 100 + r() * 20, 22)
    }
  },
  // Clipped duranta: small leaves thick on every face.
  hedge: (g, r, s) => {
    for (let i = 0; i < 120; i++) blade(g, r, 30 + r() * (s - 60), 50 + r() * (s - 60), r() * 6.28, 52 + r() * 20, 19 + r() * 6, 88 + r() * 22, 26)
  },
}

/** Four variants of a kind's sprig in a 2 × 2 atlas, on a transparent ground. */
const leafAtlas = (kind: LeafKind, seed: number): Paint => (g, w) => {
  const s = w / 2
  for (let c = 0; c < 4; c++) {
    const r = rng(seed + c * 31)
    g.save()
    g.translate((c % 2) * s, Math.floor(c / 2) * s)
    g.beginPath()
    g.rect(0, 0, s, s)
    g.clip()
    SPRIGS[kind](g, r, s)
    g.restore()
  }
}

/** Bark: vertical fissures over grey-brown, with a lichen bloom here and there; one metre a tile. */
const bark: Paint = (g, w, h) => {
  const r = rng(77)
  g.fillStyle = '#6d6256'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 140; i++) {
    let x = r() * w
    g.strokeStyle = r() < 0.6 ? `rgba(40,33,27,${0.35 + r() * 0.4})` : `rgba(160,150,136,${0.2 + r() * 0.25})`
    g.lineWidth = 1 + r() * 4
    g.beginPath()
    g.moveTo(x, 0)
    for (let y = 0; y <= h; y += 16) {
      x += (r() - 0.5) * 6
      g.lineTo(x, y)
    }
    g.stroke()
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(${170 + r() * 30},${175 + r() * 30},${150 + r() * 20},${0.12 + r() * 0.18})`
    g.beginPath()
    g.ellipse(r() * w, r() * h, 4 + r() * 14, 3 + r() * 10, r() * 3, 0, 7)
    g.fill()
  }
}

export function foliageMaterials(k: Kit) {
  const leaves = Object.fromEntries(
    KINDS.map((kind, i) => {
      const map = k.tex.painted(1024, 1024, leafAtlas(kind, 500 + i * 97))
      // Alpha to coverage keeps leaf edges soft under multisampling and holds the crowns' density at a distance.
      return [kind, new MeshStandardMaterial({ map, alphaTest: 0.3, alphaToCoverage: true, side: DoubleSide, vertexColors: true, roughness: kind === 'shrub' || kind === 'ashoka' ? 0.55 : 0.72 })]
    }),
  ) as Record<LeafKind, MeshStandardMaterial>
  const barkMap = k.tex.painted(512, 512, bark)
  return {
    leaves,
    bark: new MeshStandardMaterial({ map: barkMap, normalMap: k.tex.normalPainted('mall_bark', 512, 512, bark), normalScale: new Vector2(1.2, 1.2), roughness: 0.95 }),
    /** The dense, shaded heart of a clipped hedge, seen between the leaves. */
    core: new MeshStandardMaterial({ color: '#1f2a17', roughness: 1 }),
    grass: new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.85 }),
  }
}

export type FoliageMaterials = ReturnType<typeof foliageMaterials>

/* ---------- geometry gatherers ---------- */

const UP = new Vector3(0, 1, 0)
const tmp = new Vector3()

/** Leaf sprigs as textured cards with per-vertex tint and crown-shaded normals. */
class Cards {
  pos: number[] = []
  nor: number[] = []
  uv: number[] = []
  col: number[] = []

  /**
   * A sprig at `p`, growing along `axis`, facing roughly `face`. `out` is the direction out of the
   * crown, which the normals lean towards so the crown shades as a volume rather than as cards.
   */
  add(p: Vector3, axis: Vector3, face: Vector3, w: number, h: number, cell: number, tint: Color, out: Vector3) {
    const right = new Vector3().crossVectors(axis, face)
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0)
    right.normalize()
    const f = new Vector3().crossVectors(right, axis).normalize()
    if (f.dot(out) < 0) f.negate()
    const n = out.clone().multiplyScalar(0.7).addScaledVector(f, 0.3).normalize()
    const a = p.clone().addScaledVector(right, -w / 2)
    const b = p.clone().addScaledVector(right, w / 2)
    const c = b.clone().addScaledVector(axis, h)
    const d = a.clone().addScaledVector(axis, h)
    const u0 = (cell % 2) * 0.5 + 0.004
    const v0 = (1 - Math.floor(cell / 2)) * 0.5 + 0.004
    const u1 = u0 + 0.492
    const v1 = v0 + 0.492
    const verts: [Vector3, number, number, number][] = [[a, u0, v0, 0.92], [b, u1, v0, 0.92], [c, u1, v1, 1.06], [a, u0, v0, 0.92], [c, u1, v1, 1.06], [d, u0, v1, 1.06]]
    for (const [v, u, vv, lift] of verts) {
      this.pos.push(v.x, v.y, v.z)
      this.nor.push(n.x, n.y, n.z)
      this.uv.push(u, vv)
      this.col.push(tint.r * lift, tint.g * lift, tint.b * lift)
    }
  }

  geometry() {
    if (!this.pos.length) return null
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3))
    g.setAttribute('normal', new Float32BufferAttribute(this.nor, 3))
    g.setAttribute('uv', new Float32BufferAttribute(this.uv, 2))
    g.setAttribute('color', new Float32BufferAttribute(this.col, 3))
    return g
  }
}

/** Everything green on a site, gathered and then built as a handful of meshes. */
export class Planting {
  private cards = new Map<LeafKind, Cards>(KINDS.map((k) => [k, new Cards()]))
  private wood: BufferGeometry[] = []
  private cores: BufferGeometry[] = []
  private blades = { pos: [] as number[], nor: [] as number[], col: [] as number[] }
  /** Bases of everything planted: for contact shadows. */
  readonly footprints: { x: number; y: number; z: number; r: number; strength: number }[] = []

  private readonly mats: FoliageMaterials

  constructor(mats: FoliageMaterials) {
    this.mats = mats
  }

  /** A tapered limb from a to b, its bark repeating once a metre. */
  limb(a: Vector3, b: Vector3, ra: number, rb: number) {
    const len = a.distanceTo(b)
    if (len < 1e-3) return
    const sides = ra > 0.12 ? 12 : ra > 0.04 ? 8 : 5
    const g = new CylinderGeometry(rb, ra, len, sides, 1, true)
    const uv = g.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(ra * 12)), uv.getY(i) * len)
    g.translate(0, len / 2, 0)
    g.applyQuaternion(new Quaternion().setFromUnitVectors(UP, tmp.subVectors(b, a).normalize()))
    g.translate(a.x, a.y, a.z)
    this.wood.push(g)
  }

  card(kind: LeafKind, p: Vector3, axis: Vector3, face: Vector3, w: number, h: number, cell: number, tint: Color, out: Vector3) {
    this.cards.get(kind)!.add(p, axis, face, w, h, cell, tint, out)
  }

  /** A grass blade rooted at (x, y, z): a narrow, slightly bent triangle, dark at the root. */
  blade(x: number, y: number, z: number, h: number, w: number, lean: number, yaw: number, tint: Color) {
    const { pos, nor, col } = this.blades
    const cx = Math.cos(yaw)
    const sz = Math.sin(yaw)
    const tipX = x + Math.sin(yaw) * lean
    const tipZ = z + Math.cos(yaw) * lean
    pos.push(x - cx * w, y, z + sz * w, x + cx * w, y, z - sz * w, tipX, y + h, tipZ)
    for (let i = 0; i < 3; i++) nor.push(0, 1, 0)
    const root = 0.45
    col.push(tint.r * root, tint.g * root, tint.b * root, tint.r * root, tint.g * root, tint.b * root, tint.r, tint.g, tint.b)
  }

  core(g: BufferGeometry) {
    this.cores.push(g)
  }

  build(parent: Object3D) {
    const add = (geo: BufferGeometry | null, mat: Material, name: string, cast: boolean) => {
      if (!geo) return
      const m = new Mesh(geo, mat)
      m.name = name
      m.castShadow = cast
      m.receiveShadow = true
      // Not solid to a walker (see walk/collider.ts): leaves and grass brush past.
      m.renderOrder = name === 'wood' || name === 'hedge_core' ? 0 : 1
      parent.add(m)
    }
    for (const kind of KINDS) add(this.cards.get(kind)!.geometry(), this.mats.leaves[kind], `leaves_${kind}`, true)
    add(this.wood.length ? mergeGeometries(this.wood, false) : null, this.mats.bark, 'wood', true)
    add(this.cores.length ? mergeGeometries(this.cores, false) : null, this.mats.core, 'hedge_core', true)
    if (this.blades.pos.length) {
      const g = new BufferGeometry()
      g.setAttribute('position', new Float32BufferAttribute(this.blades.pos, 3))
      g.setAttribute('normal', new Float32BufferAttribute(this.blades.nor, 3))
      g.setAttribute('color', new Float32BufferAttribute(this.blades.col, 3))
      add(g, this.mats.grass, 'grass', false)
    }
  }
}

/* ---------- trees ---------- */

interface Species {
  leaf: LeafKind
  /** Overall height, clear trunk height, trunk radius at breast height. */
  height: number
  clear: number
  trunkR: number
  /** Crown width and depth (an ellipsoid the twigs keep within). */
  spread: number
  crownH: number
  scaffolds: number
  children: number
  /** Branch angle from the parent, radians. */
  angle: number
  /** Upward pull on growing limbs (negative droops). */
  tropism: number
  sprig: number
  perTip: number
  /** Leaf tint, linear RGB-ish multipliers of the painted leaf. */
  tint: [number, number, number]
  /** A single leader to the top with short limbs all the way up (Ashoka). */
  columnar?: boolean
}

export const SPECIES: Record<'neem' | 'rain' | 'ashoka', Species> = {
  neem: { leaf: 'neem', height: 8.5, clear: 2.6, trunkR: 0.2, spread: 6.4, crownH: 5.6, scaffolds: 5, children: 3, angle: 0.62, tropism: 0.12, sprig: 0.55, perTip: 64, tint: [0.92, 0.98, 0.86] },
  rain: { leaf: 'rain', height: 9.5, clear: 3.0, trunkR: 0.26, spread: 9.5, crownH: 5.4, scaffolds: 6, children: 3, angle: 0.9, tropism: 0.02, sprig: 0.6, perTip: 64, tint: [0.95, 1, 0.84] },
  ashoka: { leaf: 'ashoka', height: 10.5, clear: 0.6, trunkR: 0.14, spread: 2.6, crownH: 10, scaffolds: 34, children: 2, angle: 1.9, tropism: -0.05, sprig: 0.6, perTip: 24, tint: [0.86, 0.95, 0.84], columnar: true },
}

const randUnit = (r: Rand) => new Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize()

/** A tree of `species` rooted at (x, y, z), scaled by `scale`; `seed` makes it an individual. */
export function tree(plant: Planting, sp: Species, x: number, y: number, z: number, seed: number, scale = 1) {
  const r = rng(seed)
  const s = scale * (0.9 + r() * 0.2)
  const base = new Vector3(x, y, z)
  const centre = new Vector3(x, y + (sp.height - sp.crownH / 2) * s, z)
  const rx = (sp.spread / 2) * s * (0.85 + r() * 0.3)
  const ry = (sp.crownH / 2) * s
  const shell = (p: Vector3) => Math.sqrt(((p.x - centre.x) / rx) ** 2 + ((p.y - centre.y) / ry) ** 2 + ((p.z - centre.z) / rx) ** 2)
  const tint = new Color()
  const hueShift = (r() - 0.5) * 0.08

  const leavesAt = (tip: Vector3, dir: Vector3, n: number) => {
    for (let i = 0; i < n; i++) {
      const p = tip.clone().addScaledVector(randUnit(r), sp.sprig * (0.3 + r() * 0.9)).addScaledVector(dir, r() * sp.sprig * 0.5)
      const out = p.clone().sub(centre)
      out.y *= rx / ry
      out.normalize()
      const axis = sp.columnar ? dir.clone().multiplyScalar(0.6).add(new Vector3(0, -0.8, 0)).add(randUnit(r).multiplyScalar(0.3)).normalize() : dir.clone().add(out).add(randUnit(r).multiplyScalar(0.8)).add(new Vector3(0, 0.3, 0)).normalize()
      // Deep in the crown and low down, leaves sit in their neighbours' shade.
      const depth = Math.min(1, shell(p))
      const low = Math.min(1, Math.max(0, (p.y - (centre.y - ry)) / (2 * ry)))
      const shade = (0.42 + 0.58 * depth ** 1.6) * (0.78 + 0.22 * low) * (0.86 + r() * 0.22)
      const yellow = r() < 0.06 ? 1.18 : 1
      tint.setRGB(sp.tint[0] * shade * yellow * (1 + hueShift), sp.tint[1] * shade, sp.tint[2] * shade * (1 - hueShift))
      const size = sp.sprig * s * (0.75 + r() * 0.5)
      plant.card(sp.leaf, p, axis, randUnit(r), size, size * (sp.columnar ? 1.3 : 1), Math.floor(r() * 4), tint, out)
    }
  }

  const grow = (start: Vector3, dir: Vector3, len: number, rad: number, level: number) => {
    const segs = level === 0 ? 4 : 3
    let p = start.clone()
    const d = dir.clone()
    const pts: Vector3[] = [p.clone()]
    for (let i = 0; i < segs; i++) {
      d.addScaledVector(randUnit(r), level === 0 ? 0.06 : 0.28).addScaledVector(UP, sp.tropism)
      const q = p.clone().addScaledVector(d.normalize(), len / segs)
      if (level > 0 && shell(q) > 1) d.addScaledVector(centre.clone().sub(q).normalize(), 0.7).normalize()
      const end = p.clone().addScaledVector(d, len / segs)
      const r0 = rad * (1 - (0.55 * i) / segs)
      const r1 = rad * (1 - (0.55 * (i + 1)) / segs)
      plant.limb(p, end, r0, r1)
      p = end
      pts.push(p.clone())
    }
    const last = level >= 2 || (sp.columnar && level >= 1)
    if (last) {
      leavesAt(p, d, sp.perTip)
      leavesAt(pts[Math.max(1, pts.length - 2)], d, Math.round(sp.perTip * 0.4))
      return
    }
    const n = level === 0 ? sp.scaffolds : sp.children
    for (let k = 0; k < n; k++) {
      const t = level === 0 && !sp.columnar ? 0.82 + 0.18 * (k / n) : 0.3 + 0.7 * ((k + r() * 0.8) / n)
      const at = pts[0].clone().lerp(pts[pts.length - 1], t)
      const az = k * 2.39996 + r() * 0.6
      const tilt = sp.angle * (0.8 + r() * 0.4)
      const radial = new Vector3(Math.cos(az), 0, Math.sin(az))
      const child = d.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(radial, Math.sin(tilt)).normalize()
      const rest = level === 0 ? (sp.columnar ? 0.9 + r() * 0.6 : Math.max(rx, ry) * 0.85) : len * (0.55 + r() * 0.2)
      const shorten = sp.columnar && level === 0 ? 1 - t * 0.55 : 1
      grow(at, child, rest * shorten, level === 0 ? (sp.columnar ? 0.035 : rad * 0.5) : rad * 0.55, level + 1)
    }
  }

  // Root flare, then the trunk to the crown (or to the top, for a columnar tree).
  const trunkTop = new Vector3(x, y + (sp.columnar ? sp.height * s : sp.clear * s + ry * 0.35), z)
  plant.limb(base.clone().setY(y - 0.05), base.clone().setY(y + 0.35), sp.trunkR * s * 1.7, sp.trunkR * s)
  const lean = randUnit(r).setY(0).multiplyScalar(0.05)
  grow(base.clone().setY(y + 0.35), UP.clone().add(lean).normalize(), trunkTop.y - y - 0.35, sp.trunkR * s, 0)
  if (sp.columnar) leavesAt(trunkTop, UP, sp.perTip * 3)
  plant.footprints.push({ x, y, z, r: rx * 0.9, strength: 0.45 })
}

/* ---------- shrubs, hedges, lawn ---------- */

/** A loose, rounded shrub of `kind` leaves, radius `rad`, height `h`. */
export function shrub(plant: Planting, x: number, y: number, z: number, rad: number, h: number, seed: number, kind: LeafKind = 'shrub') {
  const r = rng(seed)
  const centre = new Vector3(x, y + h * 0.45, z)
  const tint = new Color()
  for (let i = 0; i < 5; i++) {
    const a = r() * 6.28
    plant.limb(new Vector3(x, y, z), new Vector3(x + Math.cos(a) * rad * 0.5, y + h * 0.7, z + Math.sin(a) * rad * 0.5), 0.015, 0.006)
  }
  const n = Math.round(260 * rad * rad * 4 + 40)
  for (let i = 0; i < n; i++) {
    const out = randUnit(r)
    out.y = Math.abs(out.y) * 0.9 + 0.05
    out.normalize()
    const depth = 0.55 + r() * 0.45
    const p = new Vector3(x + out.x * rad * depth, y + Math.max(0.04, h * 0.45 + out.y * h * 0.6 * depth), z + out.z * rad * depth)
    const shade = (0.5 + 0.5 * depth ** 1.5) * (0.75 + 0.25 * ((p.y - y) / h)) * (0.85 + r() * 0.25)
    tint.setRGB(0.9 * shade, 0.97 * shade, 0.86 * shade)
    const axis = out.clone().add(new Vector3(0, 0.6, 0)).add(randUnit(r).multiplyScalar(0.6)).normalize()
    const size = 0.2 + r() * 0.1
    plant.card(kind, p, axis, randUnit(r), size, size, Math.floor(r() * 4), tint, p.clone().sub(centre).normalize())
  }
  plant.footprints.push({ x, y, z, r: rad * 1.15, strength: 0.55 })
}

/** A clipped hedge along x from x0 to x1, centred on z: a dense core faced with leaves. */
export function hedge(plant: Planting, x0: number, x1: number, y: number, z: number, h: number, depth: number, seed: number) {
  const r = rng(seed)
  const core = new CylinderGeometry(1, 1, 1, 4, 1)
  core.rotateY(Math.PI / 4)
  core.scale((x1 - x0 - 0.1) / Math.SQRT2, h - 0.08, (depth - 0.1) / Math.SQRT2)
  core.translate((x0 + x1) / 2, y + (h - 0.08) / 2, z)
  plant.core(core.toNonIndexed())
  const tint = new Color()
  const faces: { n: Vector3; area: number; at: () => Vector3 }[] = [
    { n: new Vector3(0, 1, 0), area: (x1 - x0) * depth, at: () => new Vector3(x0 + r() * (x1 - x0), y + h, z + (r() - 0.5) * depth) },
    { n: new Vector3(0, 0, 1), area: (x1 - x0) * h, at: () => new Vector3(x0 + r() * (x1 - x0), y + 0.05 + r() * (h - 0.05), z + depth / 2) },
    { n: new Vector3(0, 0, -1), area: (x1 - x0) * h, at: () => new Vector3(x0 + r() * (x1 - x0), y + 0.05 + r() * (h - 0.05), z - depth / 2) },
    { n: new Vector3(1, 0, 0), area: depth * h, at: () => new Vector3(x1, y + 0.05 + r() * (h - 0.05), z + (r() - 0.5) * depth) },
    { n: new Vector3(-1, 0, 0), area: depth * h, at: () => new Vector3(x0, y + 0.05 + r() * (h - 0.05), z + (r() - 0.5) * depth) },
  ]
  for (const f of faces) {
    const n = Math.round(f.area * 110)
    for (let i = 0; i < n; i++) {
      // Clipping leaves the surface a little uneven: some sprigs proud, some tucked in.
      const p = f.at().addScaledVector(f.n, (r() - 0.35) * 0.07)
      const low = (p.y - y) / h
      const shade = (0.62 + 0.38 * low) * (0.82 + r() * 0.3)
      tint.setRGB(0.88 * shade, 0.95 * shade, 0.8 * shade)
      const axis = randUnit(r).addScaledVector(f.n, 0.4).normalize()
      const size = 0.16 + r() * 0.08
      plant.card('hedge', p, axis, f.n, size, size, Math.floor(r() * 4), tint, f.n)
    }
  }
}

/** A mown lawn of blades over [x0, x1] × [z0, z1] at height y. */
export function lawn(plant: Planting, x0: number, x1: number, z0: number, z1: number, y: number, seed: number, perM2 = 260) {
  const r = rng(seed)
  const n = Math.round((x1 - x0) * (z1 - z0) * perM2)
  const tint = new Color()
  for (let i = 0; i < n; i++) {
    const dry = r() < 0.12
    const l = 0.75 + r() * 0.35
    tint.setRGB((dry ? 0.5 : 0.24) * l, (dry ? 0.5 : 0.4) * l, (dry ? 0.28 : 0.13) * l)
    plant.blade(x0 + r() * (x1 - x0), y, z0 + r() * (z1 - z0), 0.05 + r() * 0.07, 0.006 + r() * 0.005, (r() - 0.5) * 0.05, r() * 6.28, tint)
  }
}
