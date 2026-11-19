import { BufferGeometry, CanvasTexture, CatmullRomCurve3, CylinderGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, Shape, LatheGeometry, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SphereGeometry, SRGBColorSpace, TorusGeometry, TubeGeometry, Vector2, Vector3, type Material, type Object3D } from 'three'
import { rng, type Paint } from '../../../textures'
import type { FloorCtx } from '../shell'
import { mesh, PI } from './kit'

/*
 * Womenswear, cut as it is made. A garment is a closed shell of cloth round the body, described by
 * its cross-sections from the shoulders to the hem (half-width and half-depth at each height), its
 * folds (deepening towards the hem, knife-sharp for pleats), and its top edge round the body: the
 * neckline (V, square, scoop, halter), the armholes and the shoulder straps between. Sleeves are set
 * in at the armholes; a tie, a belt or a seam marks the waist. The same cut hangs on a hanger or
 * dresses a mannequin (whose body it then follows).
 *
 * Also the boutique's finishes from the reference: sage-green walls, warm cream niches, herringbone
 * oak, cream resin; and its furniture: green velvet armchairs, a round tufted ottoman, terracotta
 * and bouclé poufs, mustard shell chairs, white-and-gold nesting tables.
 */

/* ---------- painters ---------- */

/** Oak parquet in a chevron: columns of planks slanting alternately, meeting in a point. */
const herringbone: Paint = (g, w, h) => {
  const r = rng(7101)
  const cols = 6
  const cw = w / cols
  const ph = cw * 0.32
  for (let c = 0; c < cols; c++) {
    const x0 = c * cw
    const dir = c % 2 ? 1 : -1
    for (let row = -6; row < h / ph + 6; row++) {
      const y0 = row * ph
      const tone = 184 + Math.floor(r() * 32)
      g.fillStyle = `rgb(${tone},${Math.floor(tone * 0.8)},${Math.floor(tone * 0.6)})`
      g.beginPath()
      g.moveTo(x0, y0)
      g.lineTo(x0 + cw, y0 + dir * cw)
      g.lineTo(x0 + cw, y0 + dir * cw + ph)
      g.lineTo(x0, y0 + ph)
      g.closePath()
      g.fill()
      g.save()
      g.clip()
      for (let k = 0; k < 7; k++) {
        g.strokeStyle = `rgba(${r() < 0.5 ? '120,80,45' : '240,210,170'},${0.1 + r() * 0.16})`
        g.lineWidth = 0.8 + r()
        const off = r() * ph
        g.beginPath()
        g.moveTo(x0, y0 + off)
        g.lineTo(x0 + cw, y0 + dir * cw + off)
        g.stroke()
      }
      g.restore()
      g.strokeStyle = 'rgba(90,60,35,.5)'
      g.lineWidth = 1.2
      g.beginPath()
      g.moveTo(x0, y0)
      g.lineTo(x0 + cw, y0 + dir * cw)
      g.stroke()
    }
    g.fillStyle = 'rgba(90,60,35,.5)'
    g.fillRect(x0, 0, 1.2, h)
  }
}

const paint = (base: [number, number, number], seed: number, spread = 7): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = `rgb(${base.join(',')})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 240; i++) {
    const x = r() * w
    const y = r() * h
    const s = w * (0.05 + r() * 0.1)
    const gr = g.createRadialGradient(x, y, 0, x, y, s)
    const d = r() < 0.5 ? spread : -spread
    gr.addColorStop(0, `rgba(${base.map((c) => Math.max(0, Math.min(255, c + d))).join(',')},.35)`)
    gr.addColorStop(1, `rgba(${base.join(',')},0)`)
    g.fillStyle = gr
    g.fillRect(x - s, y - s, 2 * s, 2 * s)
  }
}

/** A woven cloth's relief: warp and weft, or a twill's diagonal, or a rib. */
const weave = (kind: 'plain' | 'twill' | 'rib' | 'slub'): Paint => (g, w, h) => {
  const r = rng(7110 + kind.length)
  g.fillStyle = '#808080'
  g.fillRect(0, 0, w, h)
  if (kind === 'twill') {
    g.strokeStyle = 'rgba(255,255,255,.35)'
    g.lineWidth = 2
    for (let i = -h; i < w; i += 5) {
      g.beginPath()
      g.moveTo(i, h)
      g.lineTo(i + h, 0)
      g.stroke()
    }
  } else if (kind === 'rib') {
    for (let x = 0; x < w; x += 6) {
      const gr = g.createLinearGradient(x, 0, x + 6, 0)
      gr.addColorStop(0, 'rgba(0,0,0,.35)')
      gr.addColorStop(0.5, 'rgba(255,255,255,.35)')
      gr.addColorStop(1, 'rgba(0,0,0,.35)')
      g.fillStyle = gr
      g.fillRect(x, 0, 6, h)
    }
  } else {
    for (let y = 0; y < h; y += 3) {
      g.fillStyle = `rgba(0,0,0,${0.06 + r() * 0.1})`
      g.fillRect(0, y, w, 1)
    }
    for (let x = 0; x < w; x += 3) {
      g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`
      g.fillRect(x, 0, 1, h)
    }
    if (kind === 'slub')
      for (let i = 0; i < 160; i++) {
        g.fillStyle = 'rgba(255,255,255,.3)'
        g.fillRect(r() * w, r() * h, 6 + r() * 14, 1.5)
      }
  }
}

/** A small print for a co-ord or a kurta: scattered sprigs. */
const sprig = (ground: string, ink: string, accent: string): Paint => (g, w, h) => {
  const r = rng(7120)
  g.fillStyle = ground
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 70; i++) {
    const x = r() * w
    const y = r() * h
    g.strokeStyle = ink
    g.lineWidth = 1.6
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(x + 6, y - 8, x + 2, y - 16)
    g.stroke()
    g.fillStyle = r() < 0.5 ? accent : ink
    for (let k = 0; k < 3; k++) {
      g.beginPath()
      g.ellipse(x + (r() - 0.5) * 12, y - 10 + (r() - 0.5) * 10, 3, 1.6, r() * 3, 0, 7)
      g.fill()
    }
  }
}

/* ---------- materials ---------- */

export type Cloth = 'crepe' | 'satin' | 'linen' | 'cotton' | 'denim' | 'wool' | 'knit' | 'velvet' | 'chiffon' | 'print'

export function womenswearMaterials(e: FloorCtx) {
  const { k, m, lux } = e
  const env = m.env
  const mark = <T extends Material>(x: T) => ((x.userData.interior = true), x)
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.5) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const phys = (p: ConstructorParameters<typeof MeshPhysicalMaterial>[0], reflect = 0.5) => mark(new MeshPhysicalMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const tex = (w: number, h: number, p: Paint, mx: number, my = mx) => {
    const t = k.tex.painted(w, h, p)
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1 / mx, 1 / my)
    t.anisotropy = 8
    return t
  }
  const canvas = (w: number, h: number, p: Paint) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    p(c.getContext('2d')!, w, h)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
    t.anisotropy = 8
    return t
  }
  const reliefs = { plain: tex(128, 128, weave('plain'), 0.01), twill: tex(128, 128, weave('twill'), 0.012), rib: tex(128, 128, weave('rib'), 0.02), slub: tex(256, 256, weave('slub'), 0.05) }
  const cloths = new Map<string, Material>()
  /** A cloth in a colour, shared by every garment cut from it; both faces drawn (the lining shows). */
  const cloth = (kind: Cloth, colour: string, accent = '#c9a35f') => {
    const key = `${kind}|${colour}|${accent}`
    let c = cloths.get(key)
    if (c) return c
    const side = DoubleSide
    switch (kind) {
      case 'crepe':
        c = phys({ color: colour, roughness: 0.82, sheen: 0.6, sheenRoughness: 0.5, sheenColor: '#ffffff', bumpMap: reliefs.plain, bumpScale: 0.2, side }, 0.08)
        break
      case 'satin':
        c = phys({ color: colour, roughness: 0.32, sheen: 1, sheenRoughness: 0.25, sheenColor: '#ffffff', anisotropy: 0.7, side }, 0.6)
        break
      case 'linen':
        c = phys({ color: colour, roughness: 0.9, sheen: 0.3, sheenColor: '#ffffff', bumpMap: reliefs.slub, bumpScale: 0.6, side }, 0.05)
        break
      case 'cotton':
        c = phys({ color: colour, roughness: 0.85, sheen: 0.3, sheenColor: '#ffffff', bumpMap: reliefs.plain, bumpScale: 0.3, side }, 0.06)
        break
      case 'denim':
        c = phys({ color: colour, roughness: 0.88, bumpMap: reliefs.twill, bumpScale: 0.9, side }, 0.05)
        break
      case 'wool':
        c = phys({ color: colour, roughness: 0.93, sheen: 0.6, sheenRoughness: 0.7, sheenColor: '#ffffff', bumpMap: reliefs.plain, bumpScale: 0.4, side }, 0.04)
        break
      case 'knit':
        c = phys({ color: colour, roughness: 0.95, sheen: 0.5, sheenColor: '#ffffff', bumpMap: reliefs.rib, bumpScale: 1.2, side }, 0.04)
        break
      case 'velvet':
        c = phys({ color: colour, roughness: 0.85, sheen: 1, sheenRoughness: 0.35, sheenColor: '#ffffff', side }, 0.05)
        break
      case 'chiffon':
        c = phys({ color: colour, roughness: 0.6, sheen: 0.8, sheenColor: '#ffffff', transparent: true, opacity: 0.88, side }, 0.15)
        break
      case 'print':
        c = phys({ map: canvas(256, 256, sprig(colour, '#3f5a3a', accent)), roughness: 0.8, sheen: 0.4, sheenColor: '#ffffff', side }, 0.06)
        ;(c as MeshPhysicalMaterial).map!.repeat.set(1 / 0.25, 1 / 0.25)
        break
    }
    cloths.set(key, c!)
    return c!
  }
  return {
    /* the room */
    green: std({ map: tex(1024, 1024, paint([58, 112, 86], 7131), 2.4), roughness: 0.9 }, 0.04),
    cream: std({ map: tex(1024, 1024, paint([239, 229, 212], 7132, 5), 1.8), roughness: 0.85 }, 0.06),
    creamLit: std({ color: '#f4ead9', emissive: '#fff0d8', emissiveIntensity: 0.18, roughness: 0.85 }, 0.05),
    herringbone: std({ map: tex(1024, 1024, herringbone, 1.4), roughness: 0.45 }, 0.3),
    resin: std({ color: '#eee6d8', roughness: 0.16 }, 0.7),
    ceilingWhite: std({ color: '#efebe4', roughness: 0.9 }, 0.04),
    duct: std({ color: '#e9e6e0', roughness: 0.55, metalness: 0.2 }, 0.2),
    black: std({ color: '#141414', roughness: 0.45, metalness: 0.5 }, 0.4),
    brass: std({ color: '#c9a35f', metalness: 1, roughness: 0.25 }, 1.1),
    white: std({ color: '#f4f1eb', roughness: 0.3 }, 0.4),
    glass: phys({ color: '#eef4f2', roughness: 0.02, transparent: true, opacity: 0.25, depthWrite: false }, 1.2),
    mannequin: phys({ color: '#efebe4', roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 }, 0.4),
    /* upholstery */
    greenVelvet: phys({ color: '#1f5b44', roughness: 0.82, sheen: 1, sheenRoughness: 0.35, sheenColor: '#7fcfa8' }, 0.06),
    mustard: phys({ color: '#d79a2b', roughness: 0.8, sheen: 1, sheenRoughness: 0.4, sheenColor: '#ffe0a0' }, 0.06),
    terracotta: phys({ color: '#c47a5e', roughness: 0.92, sheen: 0.8, sheenRoughness: 0.5, sheenColor: '#f3c2ad' }, 0.04),
    boucle: phys({ color: '#d9cfbf', roughness: 0.96, sheen: 0.7, sheenRoughness: 0.6, sheenColor: '#ffffff', bumpMap: reliefs.slub, bumpScale: 2 }, 0.03),
    cushionGreen: phys({ color: '#4e7d58', roughness: 0.85, sheen: 1, sheenRoughness: 0.4, sheenColor: '#b9e0be' }, 0.05),
    cushionIvory: phys({ color: '#efe8da', roughness: 0.92, sheen: 0.5, sheenColor: '#ffffff', bumpMap: reliefs.slub, bumpScale: 1 }, 0.04),
    cloth,
    canvas,
    std,
    lux,
  }
}

export type WomenswearMaterials = ReturnType<typeof womenswearMaterials>
type M = WomenswearMaterials

/* ---------- the cut ---------- */

export interface Cut {
  /** Shoulder line to hem, metres. */
  len: number
  /** Half-width and half-depth over v (0 shoulders … 1 hem). */
  a: (v: number) => number
  b: (v: number) => number
  /** How far the top edge drops below the shoulder line, round the body (θ: 0 the left side, π/2 the front). */
  top: (th: number) => number
  /** Folds: how many round the body, their depth over v; pleats are knife-sharp. */
  folds: number
  amp: (v: number) => number
  pleats?: boolean
  seed: number
}

const angDist = (a: number, b: number) => {
  const d = Math.abs(((a - b + PI * 3) % (PI * 2)) - PI)
  return d
}

/** A neckline and armholes as the top edge's drop round the body. */
export function neckline(kind: 'v' | 'square' | 'scoop' | 'halter' | 'boat' | 'crew' | 'strapless', arm: number): (th: number) => number {
  return (th) => {
    const front = angDist(th, PI / 2)
    const back = angDist(th, (3 * PI) / 2)
    const side = Math.min(angDist(th, 0), angDist(th, PI))
    let d = 0
    switch (kind) {
      case 'v':
        d = 0.24 * Math.max(0, 1 - front / 0.62) ** 0.9
        break
      case 'square':
        d = front < 0.5 ? 0.14 : 0.14 * Math.max(0, 1 - (front - 0.5) / 0.08)
        break
      case 'scoop':
        d = 0.15 * Math.max(0, Math.cos(Math.min(PI / 2, (front / 0.75) * (PI / 2))))
        break
      case 'halter':
        d = 0.16 * Math.min(1, side / 0.3) * (front < 1.2 && front > 0.25 ? 1 : 0.4)
        break
      case 'boat':
        d = 0.04 * Math.max(0, 1 - front / 1.1)
        break
      case 'crew':
        d = 0.07 * Math.max(0, 1 - front / 0.5) ** 0.6
        break
      case 'strapless':
        d = 0.12
        break
    }
    d = Math.max(d, 0.05 * Math.max(0, 1 - back / 0.55))
    // The armholes, at the sides.
    d = Math.max(d, arm * Math.max(0, 1 - side / 0.42) ** 0.7)
    return d
  }
}

/** The cloth shell of a cut: a grid round the body (u) and down it (v), each column starting at its own top. */
export function shell(c: Cut, nu = 64, nv = 30) {
  const r = rng(c.seed)
  const ph = [r() * 6, r() * 6, r() * 6]
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const th = (i / nu) * PI * 2
      const top = c.top(th)
      const vTop = top / c.len
      const v = vTop + (1 - vTop) * (j / nv)
      const a = c.a(v)
      const b = c.b(v)
      const amp = c.amp(v)
      const wave = c.pleats
        ? (2 / PI) * Math.asin(Math.sin(th * c.folds + ph[0])) * 0.9
        : Math.sin(th * c.folds + ph[0] + v * 1.2) * 0.65 + Math.sin(th * c.folds * 1.7 + ph[1] - v) * 0.35
      const rr = 1 + (amp * wave) / Math.max(a, b)
      // Hung cloth flattens front-to-back a little more at the hem, and swings very slightly.
      const x = Math.cos(th) * a * rr + Math.sin(ph[2] + v * 2) * 0.004 * v
      const z = Math.sin(th) * b * rr
      pos.push(x, -v * c.len, z)
      uv.push((th * (a + b)) / 2, -v * c.len)
    }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const p0 = j * (nu + 1) + i
      const p1 = p0 + 1
      const p2 = p0 + nu + 1
      const p3 = p2 + 1
      idx.push(p0, p1, p2, p1, p3, p2)
    }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

const smooth = (v: number) => {
  const c = Math.max(0, Math.min(1, v))
  return c * c * (3 - 2 * c)
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/* ---------- hangers ---------- */

/** A hanger hooked over a rail at local (0, 0, 0): a brass hook, a shaped shoulder of wood or velvet. */
export function hanger(m: M, p: Object3D, kind: 'wood' | 'velvet' | 'clip', w = 0.2) {
  mesh(p, new TorusGeometry(0.02, 0.0022, 6, 16, PI), m.brass, 0, 0, 0)
  mesh(p, new CylinderGeometry(0.0022, 0.0022, 0.035, 6), m.brass, 0.02, -0.0175, 0)
  if (kind === 'clip') {
    const bar = mesh(p, new CylinderGeometry(0.004, 0.004, w * 1.7, 8), m.brass, 0, -0.04, 0)
    bar.rotation.z = PI / 2
    for (const sx of [-1, 1]) mesh(p, new CylinderGeometry(0.008, 0.008, 0.035, 8), m.black, sx * w * 0.75, -0.055, 0)
    return
  }
  const pts = [new Vector3(-w, -0.075, 0), new Vector3(-w * 0.55, -0.046, 0), new Vector3(0, -0.035, 0), new Vector3(w * 0.55, -0.046, 0), new Vector3(w, -0.075, 0)]
  const body = mesh(p, new TubeGeometry(new CatmullRomCurve3(pts), 16, kind === 'wood' ? 0.008 : 0.006, 8, false), kind === 'wood' ? m.lux.walnut : m.greenVelvet)
  body.scale.z = kind === 'wood' ? 1.8 : 1.4
}

/* ---------- garments (on a hanger: the hook at local origin, the front towards +z) ---------- */

export type DressSkirt = 'aline' | 'flow' | 'pleated' | 'slip' | 'pencil'
export interface DressSpec {
  len: number
  neck: 'v' | 'square' | 'scoop' | 'halter' | 'boat' | 'crew' | 'strapless'
  sleeves: 'none' | 'cap' | 'flutter' | 'elbow' | 'long'
  skirt: DressSkirt
  waist: 'tie' | 'belt' | 'seam' | 'none'
  waistAt?: number
}

/** The body a cut follows on a hanger (a slender size 8) or on a mannequin (a touch fuller to clear her form). */
const BODY = {
  shoulder: 0.19,
  bust: [0.165, 0.11],
  waist: [0.135, 0.085],
  hip: [0.175, 0.105],
}

/** A dress, its top at local y = 0 (the shoulders), front to +z. Returns its group. */
export function dress(m: M, p: Object3D, s: DressSpec, cloth: Material, belt?: Material, onBody = false) {
  const g = new Group()
  p.add(g)
  const L = s.len
  const wv = (s.waistAt ?? 0.36) / L
  const fuller = onBody ? 1.13 : 1
  const hem = s.skirt === 'flow' ? 0.36 : s.skirt === 'aline' ? 0.3 : s.skirt === 'pleated' ? 0.32 : s.skirt === 'slip' ? 0.2 : 0.16
  const hemD = s.skirt === 'flow' ? 0.2 : s.skirt === 'aline' ? 0.17 : s.skirt === 'pleated' ? 0.18 : 0.12
  const a = (v: number) => {
    const z = v * L
    let w: number
    if (z < 0.12) w = lerp(BODY.shoulder, BODY.bust[0], smooth(z / 0.12))
    else if (v < wv) w = lerp(BODY.bust[0], BODY.waist[0], smooth((z - 0.12) / (wv * L - 0.12)))
    else if (z < wv * L + 0.18) w = lerp(BODY.waist[0], BODY.hip[0], smooth((z - wv * L) / 0.18))
    else w = lerp(BODY.hip[0], hem, smooth((z - wv * L - 0.18) / Math.max(0.1, L - wv * L - 0.18)) ** 0.8)
    return w * fuller
  }
  const b = (v: number) => {
    const z = v * L
    let d: number
    if (z < 0.12) d = lerp(0.07, BODY.bust[1], smooth(z / 0.12))
    else if (v < wv) d = lerp(BODY.bust[1], BODY.waist[1], smooth((z - 0.12) / (wv * L - 0.12)))
    else if (z < wv * L + 0.18) d = lerp(BODY.waist[1], BODY.hip[1], smooth((z - wv * L) / 0.18))
    else d = lerp(BODY.hip[1], hemD, smooth((z - wv * L - 0.18) / Math.max(0.1, L - wv * L - 0.18)))
    // On a hanger the cloth falls flatter than on a body.
    return d * (onBody ? 1.34 : 0.82)
  }
  const arm = s.sleeves === 'none' ? (s.neck === 'halter' ? 0.2 : 0.17) : 0.035
  const cut: Cut = {
    len: L,
    a,
    b,
    top: neckline(s.neck, arm),
    folds: s.skirt === 'pleated' ? 34 : s.skirt === 'flow' ? 11 : s.skirt === 'aline' ? 9 : 7,
    amp: (v) => (v < wv ? 0.002 : (s.skirt === 'pleated' ? 0.008 : s.skirt === 'flow' ? 0.028 : s.skirt === 'aline' ? 0.018 : 0.008) * smooth((v - wv) / (1 - wv)) ** 0.8),
    pleats: s.skirt === 'pleated',
    seed: Math.round(L * 1000 + s.neck.length * 37 + s.skirt.length * 11),
  }
  mesh(g, shell(cut, 72, 34), cloth)
  // The waist: a tie with its loose ends, a belt and buckle, or a seam.
  const wy = -wv * L
  const ring = (r1: number, mat: Material, lift = 0) => {
    const t = mesh(g, new TorusGeometry(1, r1, 6, 48), mat, 0, wy + lift, 0, false)
    t.rotation.x = PI / 2
    t.scale.set(a(wv) + r1 * 0.6, b(wv) + r1 * 0.6, 1)
  }
  if (s.waist === 'tie') {
    ring(0.012, cloth)
    for (const [sx, len, tilt] of [[-1, 0.34, 0.12], [1, 0.3, -0.18]] as const) {
      const end = mesh(g, new CylinderGeometry(0.018, 0.022, len, 8), cloth, a(wv) * 0.4 + sx * 0.02, wy - len / 2, b(wv) + 0.012, false)
      end.scale.z = 0.25
      end.rotation.z = tilt
    }
    mesh(g, new SphereGeometry(0.02, 12, 8), cloth, a(wv) * 0.4, wy, b(wv) + 0.012, false).scale.set(1.3, 0.8, 0.6)
  } else if (s.waist === 'belt' && belt) {
    ring(0.014, belt)
    mesh(g, new TorusGeometry(0.016, 0.004, 6, 4), m.brass, 0, wy, b(wv) + 0.016, false).rotation.z = PI / 4
  } else if (s.waist === 'seam') ring(0.003, cloth)
  // Sleeves at the armholes.
  if (s.sleeves !== 'none') {
    const sl = s.sleeves === 'cap' ? 0.08 : s.sleeves === 'flutter' ? 0.14 : s.sleeves === 'elbow' ? 0.3 : 0.56
    for (const sx of [-1, 1]) sleeve(g, sx * a(0.02) * 0.98, -0.03, sl, s.sleeves === 'flutter' ? [0.055, 0.1] : [0.05, s.sleeves === 'long' ? 0.034 : 0.045], sx, cloth, onBody)
  }
  // Straps over the shoulders for a sleeveless cut.
  if (s.sleeves === 'none' && s.neck !== 'strapless' && s.neck !== 'halter')
    for (const sx of [-1, 1]) {
      const st = mesh(g, new TorusGeometry(0.05, 0.012, 6, 12, PI), cloth, sx * a(0) * 0.55, -0.008, 0, false)
      st.rotation.y = PI / 2
      st.scale.set(1, 0.25, 1.4)
    }
  g.userData.len = L
  return g
}

/** A sleeve from the armhole: a tapering tube that falls and curves forward; a flutter flares. */
function sleeve(p: Object3D, x: number, y: number, len: number, r: [number, number], side: number, mat: Material, onBody: boolean) {
  const out = onBody ? 0.018 : 0.012
  const pts = [new Vector3(x, y, 0), new Vector3(x + side * (out + 0.01), y - len * 0.4, 0.01), new Vector3(x + side * (out * 1.4), y - len * 0.8, 0.03), new Vector3(x + side * out * 1.5, y - len, 0.045)]
  const curve = new CatmullRomCurve3(pts)
  const n = 14
  const ring = 14
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const c = curve.getPoint(t)
    const tan = curve.getTangent(t)
    const nrm = new Vector3(0, 0, 1).cross(tan).normalize()
    const bin = new Vector3().crossVectors(tan, nrm).normalize()
    const rr = lerp(r[0], r[1], t)
    for (let j = 0; j <= ring; j++) {
      const a = (j / ring) * PI * 2
      const v = c.clone().addScaledVector(nrm, Math.cos(a) * rr).addScaledVector(bin, Math.sin(a) * rr * 0.85)
      pos.push(v.x, v.y, v.z)
    }
  }
  for (let i = 0; i < n; i++)
    for (let j = 0; j < ring; j++) {
      const a0 = i * (ring + 1) + j
      const b0 = a0 + ring + 1
      idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1)
    }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return mesh(p, g, mat, 0, 0, 0, true)
}

/** A blouse or top, hip length, with sleeves; a shirt collar or a soft bow at the neck. */
export function blouse(_m: M, p: Object3D, cloth: Material, opts: { neck?: 'v' | 'crew' | 'boat' | 'scoop'; sleeves?: 'long' | 'elbow' | 'cap' | 'none'; len?: number; collar?: boolean; bow?: boolean; tuck?: boolean }, onBody = false) {
  const g = new Group()
  p.add(g)
  const L = opts.len ?? 0.64
  const f = onBody ? 1.13 : 1
  const a = (v: number) => f * (v < 0.2 ? lerp(0.2, 0.18, smooth(v / 0.2)) : lerp(0.18, opts.tuck ? 0.15 : 0.2, smooth((v - 0.2) / 0.8)))
  const b = (v: number) => (onBody ? 1.34 : 0.82) * (v < 0.2 ? lerp(0.08, 0.11, smooth(v / 0.2)) : lerp(0.11, 0.1, v))
  const cut: Cut = { len: L, a, b, top: neckline(opts.neck ?? 'crew', opts.sleeves === 'none' ? 0.16 : 0.03), folds: 8, amp: (v) => 0.004 + 0.008 * v, seed: Math.round(L * 997) }
  mesh(g, shell(cut, 56, 22), cloth)
  if ((opts.sleeves ?? 'long') !== 'none') {
    const sl = opts.sleeves === 'cap' ? 0.1 : opts.sleeves === 'elbow' ? 0.3 : 0.56
    for (const sx of [-1, 1]) sleeve(g, sx * a(0.02) * 0.98, -0.03, sl, [0.055, opts.sleeves === 'long' ? 0.038 : 0.05], sx, cloth, onBody)
  }
  if (opts.collar)
    for (const sx of [-1, 1]) {
      const c = mesh(g, new CylinderGeometry(0.0, 0.05, 0.08, 3), cloth, sx * 0.04, -0.03, b(0.02) + 0.006, false)
      c.rotation.set(PI / 2, 0, sx * 0.6)
      c.scale.z = 0.15
    }
  if (opts.bow) {
    for (const sx of [-1, 1]) mesh(g, new SphereGeometry(0.03, 12, 8), cloth, sx * 0.03, -0.09, b(0.1) + 0.015, false).scale.set(1.2, 0.6, 0.4)
    for (const sx of [-1, 1]) {
      const t = mesh(g, new CylinderGeometry(0.012, 0.016, 0.22, 6), cloth, sx * 0.02, -0.2, b(0.2) + 0.016, false)
      t.rotation.z = sx * 0.12
      t.scale.z = 0.3
    }
  }
  g.userData.len = L
  return g
}

/** A skirt on a clip hanger: waistband at local y = 0. */
export function skirt(_m: M, p: Object3D, cloth: Material, kind: 'pleated' | 'aline' | 'pencil' | 'slip', len: number) {
  const g = new Group()
  p.add(g)
  const hem = kind === 'pleated' ? 0.27 : kind === 'aline' ? 0.25 : kind === 'slip' ? 0.19 : 0.15
  const cut: Cut = {
    len,
    a: (v) => lerp(0.15, hem, smooth(v) ** 0.8),
    b: (v) => lerp(0.06, kind === 'pencil' ? 0.06 : 0.12, smooth(v)),
    top: () => 0,
    folds: kind === 'pleated' ? 30 : 8,
    amp: (v) => (kind === 'pleated' ? 0.007 : kind === 'pencil' ? 0.003 : 0.016) * v,
    pleats: kind === 'pleated',
    seed: Math.round(len * 777),
  }
  mesh(g, shell(cut, 64, 22), cloth)
  const wb = mesh(g, new TorusGeometry(1, 0.012, 6, 40), cloth, 0, -0.008, 0, false)
  wb.rotation.x = PI / 2
  wb.scale.set(0.152, 0.062, 1)
  g.userData.len = len
  return g
}

/** Wide-leg trousers or jeans on a clip hanger: the waistband at local y = 0, two legs falling. */
export function trousers(m: M, p: Object3D, cloth: Material, kind: 'wide' | 'straight' | 'jeans', len = 1.02) {
  const g = new Group()
  p.add(g)
  const hem = kind === 'wide' ? 0.13 : kind === 'jeans' ? 0.085 : 0.095
  for (const sx of [-1, 1]) {
    const cut: Cut = {
      len,
      a: (v) => lerp(0.085, hem, smooth(v)),
      b: (v) => lerp(0.055, kind === 'wide' ? 0.07 : 0.05, smooth(v)),
      top: () => 0,
      folds: 5,
      amp: (v) => (kind === 'wide' ? 0.012 : 0.004) * v,
      seed: Math.round(len * 100 + sx * 7),
    }
    const leg = mesh(g, shell(cut, 32, 18), cloth, sx * 0.075, 0, 0)
    leg.rotation.z = -sx * 0.025
  }
  const wb = mesh(g, new TorusGeometry(1, 0.016, 6, 40), cloth, 0, -0.01, 0, false)
  wb.rotation.x = PI / 2
  wb.scale.set(0.16, 0.06, 1)
  if (kind === 'jeans') {
    // The fly's top stitching and a copper button.
    mesh(g, new CylinderGeometry(0.008, 0.008, 0.004, 12), m.brass, 0, -0.012, 0.062, false).rotation.x = PI / 2
  }
  g.userData.len = len
  return g
}

/** A kurta and its dupatta: a long straight tunic with side slits, the dupatta draped over the hanger. */
export function kurta(_m: M, p: Object3D, cloth: Material, dupatta?: Material) {
  const g = new Group()
  p.add(g)
  const L = 1.05
  const cut: Cut = { len: L, a: (v) => (v < 0.2 ? lerp(0.2, 0.17, smooth(v / 0.2)) : lerp(0.17, 0.25, smooth((v - 0.3) / 0.7))), b: (v) => lerp(0.08, 0.12, v), top: neckline('v', 0.035), folds: 9, amp: (v) => 0.012 * v, seed: 551 }
  mesh(g, shell(cut, 64, 26), cloth)
  for (const sx of [-1, 1]) sleeve(g, sx * 0.195, -0.03, 0.42, [0.052, 0.04], sx, cloth, false)
  // The dupatta (a women's set has one): a long light scarf over the hanger's shoulders, falling both sides.
  if (!dupatta) {
    g.userData.len = L
    return g
  }
  const d = new Group()
  d.position.z = -0.03
  g.add(d)
  const sheetGeo = (len: number, w: number) => {
    const pos: number[] = []
    const idx: number[] = []
    const nu = 10
    const nv = 16
    for (let j = 0; j <= nv; j++)
      for (let i = 0; i <= nu; i++) {
        const u = i / nu - 0.5
        const v = j / nv
        pos.push(u * w, -v * len, Math.sin(u * PI * 3 + v * 2) * 0.012 * (0.3 + v))
      }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a0 = j * (nu + 1) + i
        idx.push(a0, a0 + nu + 1, a0 + 1, a0 + 1, a0 + nu + 1, a0 + nu + 2)
      }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
    geo.setIndex(idx)
    geo.computeVertexNormals()
    return geo
  }
  for (const [sx, len] of [[-1, 0.9], [1, 1.1]] as const) {
    const sh = mesh(d, sheetGeo(len, 0.22), dupatta, sx * 0.13, -0.04, -0.09, false)
    sh.rotation.z = sx * 0.06
  }
  g.userData.len = L
  return g
}

/* ---------- the mannequin ---------- */

/**
 * A display mannequin, 1.78 m: a slender female form on a brass rod and disc base, the head an
 * egg, standing in an easy contrapposto (weight on the right leg, the left knee eased, one hand at
 * the hip). Faces +z. Returns the group and the height of her shoulders (where her clothes hang).
 */
export function mannequin(m: M, p: Object3D) {
  const g = new Group()
  p.add(g)
  const skin = m.mannequin
  mesh(g, new CylinderGeometry(0.2, 0.2, 0.012, 40), m.brass, 0, 0.006, 0)
  mesh(g, new CylinderGeometry(0.008, 0.008, 0.36, 8), m.brass, 0, 0.18, -0.05)
  // Legs: thigh, knee, calf, an ankle and a pointed foot on tiptoe.
  for (const sx of [-1, 1]) {
    const ease = sx < 0 ? 1 : 0
    const leg = new Group()
    leg.position.set(sx * 0.075, 0.86, 0)
    leg.rotation.z = sx * 0.04
    leg.rotation.x = -0.04 * ease
    g.add(leg)
    lathe(leg, [[0, 0], [0.072, -0.02], [0.068, -0.2], [0.05, -0.38], [0.045, -0.43]], skin, 0, 0)
    const shin = new Group()
    shin.position.y = -0.43
    shin.rotation.x = 0.1 * ease
    leg.add(shin)
    lathe(shin, [[0.045, 0], [0.048, -0.1], [0.04, -0.25], [0.026, -0.38], [0.024, -0.4]], skin, 0, 0)
    const foot = mesh(shin, new SphereGeometry(1, 16, 10), skin, 0, -0.41, 0.04)
    foot.scale.set(0.03, 0.025, 0.09)
    foot.rotation.x = -0.6
  }
  // The torso, turned from a female profile: hips, waist, bust, shoulders.
  const torso = lathe(g, [[0.001, 0], [0.16, 0], [0.175, 0.08], [0.15, 0.2], [0.12, 0.3], [0.15, 0.42], [0.155, 0.47], [0.165, 0.53], [0.15, 0.58], [0.05, 0.6], [0.001, 0.6]], skin, 0.84, 0)
  torso.scale.z = 0.68
  // Arms: easy at the sides, the right hand at the hip.
  for (const sx of [-1, 1]) {
    const arm = new Group()
    arm.position.set(sx * 0.175, 1.4, 0)
    arm.rotation.z = sx * (sx > 0 ? 0.28 : 0.1)
    g.add(arm)
    lathe(arm, [[0, 0.02], [0.04, 0], [0.036, -0.27], [0.03, -0.29]], skin, 0, 0, 16)
    const fore = new Group()
    fore.position.y = -0.29
    fore.rotation.z = sx > 0 ? -1.0 : -0.05 * sx
    fore.rotation.x = sx > 0 ? -0.3 : -0.12
    arm.add(fore)
    lathe(fore, [[0.03, 0], [0.028, -0.12], [0.02, -0.25]], skin, 0, 0, 16)
    const hand = mesh(fore, new SphereGeometry(1, 12, 10), skin, 0, -0.3, 0.005)
    hand.scale.set(0.022, 0.06, 0.012)
  }
  mesh(g, new CylinderGeometry(0.035, 0.045, 0.1, 16), skin, 0, 1.47, 0)
  const head = mesh(g, new SphereGeometry(0.095, 28, 20), skin, 0, 1.62, 0.01)
  head.scale.set(0.85, 1.18, 0.95)
  return { g, shoulders: 1.44 }
}

function lathe(p: Object3D, pts: [number, number][], mat: Material, y: number, z: number, seg = 32) {
  return mesh(p, new LatheGeometry(pts.map(([r, h]) => new Vector2(r, h)), seg), mat, 0, y, z)
}

/* ---------- the furniture ---------- */

/**
 * A rounded lounge armchair in velvet on short brass feet, facing +z: a deep drum seat with a plump
 * cushion, wrapped by a thick upholstered shell, low and rolled at the arms, rising at the back.
 */
export function armchair(m: M, p: Object3D, mat: Material) {
  const g = new Group()
  p.add(g)
  for (const [x, z] of [[-0.3, -0.26], [0.3, -0.26], [-0.3, 0.28], [0.3, 0.28]]) mesh(g, new CylinderGeometry(0.018, 0.014, 0.07, 10), m.brass, x, 0.035, z)
  const base = mesh(g, new CylinderGeometry(0.42, 0.42, 0.26, 48), mat, 0, 0.2, 0.0)
  base.scale.z = 0.92
  const seat = mesh(g, new SphereGeometry(1, 40, 16, 0, PI * 2, 0, PI / 2), mat, 0, 0.32, 0.05)
  seat.scale.set(0.34, 0.09, 0.3)
  // The shell: an annular sector extruded up, its top rounded by a generous bevel; the arms are a
  // lower band of the same, so the line steps down from the back to the arms as a club chair's does.
  const band = (a0: number, a1: number, h: number) => {
    const sh = new Shape()
    const R = 0.42
    const r = 0.29
    const n = 32
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n
      const v = [Math.cos(a) * R, Math.sin(a) * R * 0.92] as const
      if (i === 0) sh.moveTo(v[0], v[1])
      else sh.lineTo(v[0], v[1])
    }
    for (let i = n; i >= 0; i--) {
      const a = a0 + ((a1 - a0) * i) / n
      sh.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.92)
    }
    sh.closePath()
    const geo = new ExtrudeGeometry(sh, { depth: h - 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.045, bevelSegments: 6, curveSegments: 8 })
    geo.rotateX(-PI / 2)
    const o = mesh(g, geo, mat, 0, 0.12, 0)
    o.position.y = 0.17
    return o
  }
  // Angles in plan with +z towards the front: the shell wraps from the front left round the back.
  band(PI * 0.12, PI * 0.88, 0.62)
  band(-PI * 0.2, PI * 1.2, 0.42)
  return g
}

/** A round tufted ottoman, a deep drum with a domed top and buttons. */
export function ottoman(_m: M, p: Object3D, r: number, mat: Material) {
  const g = new Group()
  p.add(g)
  mesh(g, new CylinderGeometry(r, r * 0.97, 0.34, 64), mat, 0, 0.17, 0)
  const top = mesh(g, new SphereGeometry(1, 64, 16, 0, PI * 2, 0, PI / 2), mat, 0, 0.33, 0)
  top.scale.set(r, 0.08, r)
  mesh(g, new TorusGeometry(r - 0.02, 0.035, 10, 64), mat, 0, 0.33, 0).rotation.x = PI / 2
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2
    mesh(g, new SphereGeometry(0.012, 8, 6), mat, Math.cos(a) * r * 0.5, 0.405, Math.sin(a) * r * 0.5, false)
  }
  mesh(g, new SphereGeometry(0.014, 8, 6), mat, 0, 0.412, 0, false)
  return g
}

/** A pouf: a drum with rounded edges, or a squashed bouclé ball. */
export function pouf(_m: M, p: Object3D, r: number, h: number, mat: Material, ball = false) {
  const g = new Group()
  p.add(g)
  if (ball) {
    const b = mesh(g, new SphereGeometry(1, 48, 24), mat, 0, h / 2, 0)
    b.scale.set(r, h / 2, r)
    return g
  }
  mesh(g, new CylinderGeometry(r - 0.03, r - 0.03, h, 48), mat, 0, h / 2, 0)
  for (const y of [0.03, h - 0.03]) mesh(g, new TorusGeometry(r - 0.03, 0.03, 10, 48), mat, 0, y, 0).rotation.x = PI / 2
  mesh(g, new CylinderGeometry(r - 0.03, r - 0.03, 0.06, 48), mat, 0, h - 0.0, 0)
  return g
}

/** A shell lounge chair in mustard velvet on slim brass legs, facing +z: a tub of a back with a rolled rim. */
export function shellChair(m: M, p: Object3D, mat: Material, seatH = 0.42, tall = false) {
  const g = new Group()
  p.add(g)
  const legH = tall ? 0.6 : seatH - 0.1
  for (const [x, z] of [[-0.2, -0.18], [0.2, -0.18], [-0.21, 0.2], [0.21, 0.2]]) {
    const l = mesh(g, new CylinderGeometry(0.011, 0.008, legH, 8), m.brass, x * 1.06, legH / 2, z * 1.06)
    l.rotation.set(z > 0 ? 0.06 : -0.06, 0, x > 0 ? -0.05 : 0.05)
  }
  if (tall) mesh(g, new TorusGeometry(0.22, 0.008, 6, 32), m.brass, 0, 0.24, 0).rotation.x = PI / 2
  const y0 = legH
  // The seat: a shallow shell pan and its cushion.
  mesh(g, new CylinderGeometry(0.27, 0.25, 0.06, 40), mat, 0, y0 + 0.03, 0)
  const cush = mesh(g, new SphereGeometry(1, 32, 12, 0, PI * 2, 0, PI / 2), mat, 0, y0 + 0.06, 0.02)
  cush.scale.set(0.25, 0.06, 0.24)
  // The back: a flared tub wrapping the seat, open to the front, its rim rolled.
  const a0 = PI - 1.75
  const span = 3.5
  const h = tall ? 0.3 : 0.38
  mesh(g, new CylinderGeometry(0.33, 0.27, h, 40, 1, true, a0, span), mat, 0, y0 + 0.03 + h / 2, 0)
  mesh(g, new CylinderGeometry(0.31, 0.25, h, 40, 1, true, a0, span), mat, 0, y0 + 0.03 + h / 2, 0)
  const rim = Array.from({ length: 28 }, (_, i) => {
    const a = a0 + (span * i) / 27
    return new Vector3(Math.sin(a) * 0.32, y0 + 0.03 + h, Math.cos(a) * 0.32)
  })
  mesh(g, new TubeGeometry(new CatmullRomCurve3(rim), 40, 0.022, 10, false), mat)
  for (const a of [a0, a0 + span]) {
    const v = new Vector3(Math.sin(a), 0, Math.cos(a))
    const edge = mesh(g, new CylinderGeometry(0.022, 0.022, h, 10), mat, v.x * 0.3, y0 + 0.03 + h / 2, v.z * 0.3)
    edge.rotation.z = -v.x * 0.15
  }
  return g
}

/** Nesting tables: a white lacquer top on a brass plinth, a lower one tucked under it at an offset. */
export function nestingTables(m: M, p: Object3D) {
  const g = new Group()
  p.add(g)
  const table = (w: number, d: number, h: number, x: number, z: number) => {
    const t = new Group()
    t.position.set(x, 0, z)
    g.add(t)
    const top = mesh(t, new CylinderGeometry(0.5, 0.5, 1, 4), m.white, 0, h - 0.04, 0)
    top.rotation.y = PI / 4
    top.scale.set(w * Math.SQRT2, 0.08, d * Math.SQRT2)
    const base = mesh(t, new CylinderGeometry(0.5, 0.5, 1, 4), m.brass, 0, (h - 0.08) / 2, 0)
    base.rotation.y = PI / 4
    base.scale.set((w - 0.16) * Math.SQRT2, h - 0.08, (d - 0.14) * Math.SQRT2)
    return t
  }
  table(1.1, 0.62, 0.42, 0, 0)
  table(0.85, 0.55, 0.3, 0.32, 0.5)
  return g
}
