import { CanvasTexture, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, type Material } from 'three'
import { rng, type Paint } from '../../../textures'
import type { FloorCtx } from '../shell'
import { Atlas } from '../signs'
import { PI } from './kit'

/*
 * The parfumerie's finishes and print, from the reference: blush limewashed plaster for the vault
 * and walls, deep burgundy lacquer for the counter and the niches' wall, burgundy velvet for the
 * padded portal, a white stone floor in small tiles, white solid surface for the counter's tops,
 * brass. And the house's print: every label and box front painted into one atlas, so the bottles
 * share a material; the blossom clusters of the tree.
 */

export const MAISON = 'MAISON SAKURA'
const SERIF = '"Cormorant Garamond", "Playfair Display", Georgia, serif'
const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif'

/** Limewash: a pale ground clouded with lighter and darker brush strokes. */
const limewash = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 480; i++) {
    const x = r() * w
    const y = r() * h
    const s = w * (0.04 + r() * 0.12)
    const gr = g.createRadialGradient(x, y, 0, x, y, s)
    const d = r() < 0.5 ? 10 : -8
    gr.addColorStop(0, `rgba(${cr + d},${cg + d},${cb + d},.16)`)
    gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
    g.fillStyle = gr
    g.fillRect(x - s, y - s, s * 2, s * 2)
  }
}

/**
 * 1.2 m of floor, as the reference's: honed white limestone in 300 × 150 mm tiles laid in a
 * staggered bond, each tile a shade different, a faint vein now and then, fine pale joints.
 */
const stoneTiles: Paint = (g, w, h) => {
  const r = rng(1607)
  g.fillStyle = '#d6d1c9'
  g.fillRect(0, 0, w, h)
  const tw = w / 4
  const th = h / 8
  const j = Math.max(1, w / 600)
  for (let row = 0; row < 8; row++)
    for (let col = -1; col < 5; col++) {
      const x = col * tw + (row % 2 ? tw / 2 : 0)
      const y = row * th
      const d = (r() - 0.5) * 8
      g.fillStyle = `rgb(${243 + d},${240 + d},${235 + d})`
      g.fillRect(x + j, y + j, tw - 2 * j, th - 2 * j)
      for (let k = 0; k < 3; k++) {
        g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '200,194,186'},${0.15 + r() * 0.15})`
        g.fillRect(x + j + r() * tw * 0.8, y + j + r() * th * 0.8, tw * (0.1 + r() * 0.2), 1 + r() * 2)
      }
    }
  for (let i = 0; i < 14; i++) {
    g.strokeStyle = `rgba(175,168,160,${0.07 + r() * 0.08})`
    g.lineWidth = 1
    g.beginPath()
    const x = r() * w
    const y = r() * h
    g.moveTo(x, y)
    g.bezierCurveTo(x + r() * 40, y + r() * 20, x + r() * 60, y - r() * 15, x + 30 + r() * 50, y + r() * 30)
    g.stroke()
  }
}

/**
 * A cluster of cherry blossom: forty-odd small five-petalled flowers and buds in a loose head, each
 * petal shaded from a deeper heart to a pale, slightly translucent edge, a tuft of stamens.
 */
const blossom = (petal: [number, number, number], heart: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.clearRect(0, 0, w, h)
  const flowers = 44
  for (let i = 0; i < flowers; i++) {
    const a = r() * PI * 2
    const d = Math.pow(r(), 0.7) * w * 0.4
    const cx = w / 2 + Math.cos(a) * d
    const cy = h / 2 + Math.sin(a) * d * 0.85
    const s = w * (0.035 + r() * 0.03) * (d > w * 0.3 ? 0.8 : 1)
    const bud = r() < 0.15
    const turn = r() * PI
    const shade = 0.82 + r() * 0.25
    const col = (c: [number, number, number], k: number, al: number) => `rgba(${Math.min(255, c[0] * k)},${Math.min(255, c[1] * k)},${Math.min(255, c[2] * k)},${al})`
    if (bud) {
      g.fillStyle = col(heart, shade, 0.95)
      g.beginPath()
      g.ellipse(cx, cy, s * 0.35, s * 0.5, turn, 0, PI * 2)
      g.fill()
      continue
    }
    for (let p = 0; p < 5; p++) {
      const pa = turn + (p / 5) * PI * 2
      const px = cx + Math.cos(pa) * s * 0.5
      const py = cy + Math.sin(pa) * s * 0.5
      const gr = g.createRadialGradient(cx, cy, 0, px, py, s * 0.6)
      gr.addColorStop(0, col(heart, shade, 1))
      gr.addColorStop(0.5, col(petal, shade, 0.98))
      gr.addColorStop(1, col(petal, shade * 1.06, 0.7))
      g.fillStyle = gr
      g.beginPath()
      g.ellipse(px, py, s * 0.46, s * 0.34, pa, 0, PI * 2)
      g.fill()
    }
    g.fillStyle = 'rgba(176,74,96,.9)'
    for (let k = 0; k < 7; k++) {
      const sa = r() * PI * 2
      g.fillRect(cx + Math.cos(sa) * s * 0.15, cy + Math.sin(sa) * s * 0.15, 1.2, 1.2)
    }
  }
}

/**
 * Bark, as a tube maps it (x along the limb, y round it): a grey-brown ground with long fissures
 * running along the limb and short pale lenticels across it, as on a cherry.
 */
const bark: Paint = (g, w, h) => {
  const r = rng(1631)
  g.fillStyle = '#5a463a'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 160; i++) {
    g.strokeStyle = `rgba(${r() < 0.5 ? '40,30,24' : '120,100,86'},${0.25 + r() * 0.35})`
    g.lineWidth = 1 + r() * 3
    const y = r() * h
    g.beginPath()
    g.moveTo(0, y)
    for (let x = 0; x <= w; x += w / 8) g.lineTo(x, y + (r() - 0.5) * 10)
    g.stroke()
  }
  for (let i = 0; i < 220; i++) {
    g.fillStyle = `rgba(${r() < 0.6 ? '150,128,110' : '50,38,30'},${0.3 + r() * 0.3})`
    g.fillRect(r() * w, r() * h, 1 + r() * 1.5, 4 + r() * 10)
  }
}

/* ---------- labels and boxes ---------- */

export interface Print {
  /** The fragrance's name, in the house serif. */
  name: string
  /** What it is and its size ("Eau de parfum · 100 ml"). */
  line: string
  ground: string
  ink: string
  /** Foil: a line of metallic colour round the edge and under the name. */
  foil?: string
  w?: number
  h?: number
  /** A box front: the house's mark large, the name under it. */
  box?: boolean
}

const printPaint = (l: Print) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = l.ground
  g.fillRect(0, 0, w, h)
  if (l.foil) {
    g.strokeStyle = l.foil
    g.lineWidth = Math.max(1, Math.min(w, h) * 0.02)
    g.strokeRect(w * 0.05, h * 0.06, w * 0.9, h * 0.88)
  }
  g.fillStyle = l.ink
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const unit = Math.min(w, h * 1.4)
  if (l.box) {
    // The blossom mark: five petals drawn in line.
    g.strokeStyle = l.foil ?? l.ink
    g.lineWidth = Math.max(1, unit * 0.012)
    const cx = w / 2
    const cy = h * 0.3
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * PI * 2 - PI / 2
      g.beginPath()
      g.ellipse(cx + Math.cos(a) * unit * 0.05, cy + Math.sin(a) * unit * 0.05, unit * 0.045, unit * 0.03, a, 0, PI * 2)
      g.stroke()
    }
  }
  g.font = `600 ${Math.round(unit * 0.07)}px ${SANS}`
  g.fillText(MAISON.split('').join(String.fromCharCode(8202)), w / 2, h * (l.box ? 0.5 : 0.2))
  let size = unit * 0.16
  for (;;) {
    g.font = `500 ${Math.round(size)}px ${SERIF}`
    if (g.measureText(l.name).width < w * 0.86 || size < 8) break
    size *= 0.92
  }
  g.fillText(l.name, w / 2, h * (l.box ? 0.66 : 0.48))
  g.fillStyle = l.foil ?? l.ink
  g.fillRect(w * 0.38, h * (l.box ? 0.76 : 0.63), w * 0.24, Math.max(1, h * 0.008))
  g.fillStyle = l.ink
  g.font = `500 ${Math.round(unit * 0.06)}px ${SANS}`
  g.fillText(l.line.toUpperCase(), w / 2, h * (l.box ? 0.84 : 0.77))
}

/* ---------- materials ---------- */

export function perfumeMaterials(e: FloorCtx) {
  const { k, m, lux } = e
  const env = m.env
  const mark = <T extends Material>(x: T) => ((x.userData.interior = true), x)
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.5) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const tex = (w: number, h: number, paint: Paint, mx: number, my = mx) => {
    const t = k.tex.painted(w, h, paint)
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1 / mx, 1 / my)
    t.anisotropy = 8
    return t
  }
  const canvas = (w: number, h: number, paint: Paint) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    paint(c.getContext('2d')!, w, h)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  /** Glass of real thickness: clear or tinted, reflecting the shop. */
  const glass = (color: string, opacity: number, rough = 0.02) =>
    mark(new MeshPhysicalMaterial({ color, roughness: rough, metalness: 0, ior: 1.5, specularIntensity: 1, transparent: true, opacity, depthWrite: false, envMap: env, envMapIntensity: 1.5 }))
  const metal = (color: string, rough = 0.18) => std({ color, metalness: 1, roughness: rough }, 1.1)
  const atlas = new Atlas(2048, 2048)
  const printMat = std({ map: atlas.texture, roughness: 0.5 }, 0.15)
  const cache = new Map<string, [number, number, number, number]>()
  const juices = new Map<string, MeshPhysicalMaterial>()
  const boards = new Map<string, MeshStandardMaterial>()
  /** Silk blossom: a little light passes through the petals, so no head goes dark in shadow. */
  const blossomMat = (petal: [number, number, number], heart: [number, number, number], seed: number) => {
    const map = canvas(256, 256, blossom(petal, heart, seed))
    return mark(new MeshStandardMaterial({ map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.16, alphaTest: 0.4, side: DoubleSide, roughness: 0.8, vertexColors: true, envMap: env, envMapIntensity: 0.1 }))
  }
  return {
    /* the room */
    blushPlaster: std({ map: tex(1024, 1024, limewash([236, 203, 196], 1611), 2.4), roughness: 0.93 }, 0.04),
    vaultPlaster: std({ map: tex(1024, 1024, limewash([240, 214, 206], 1612), 2.4), roughness: 0.94, side: DoubleSide }, 0.03),
    floor: std({ map: tex(1024, 1024, stoneTiles, 1.2), roughness: 0.3 }, 0.35),
    burgundy: std({ color: '#8a2232', roughness: 0.3 }, 0.5),
    burgundyWall: std({ map: tex(1024, 1024, limewash([140, 38, 52], 1613), 2.4), roughness: 0.55 }, 0.2),
    velvet: mark(new MeshPhysicalMaterial({ color: '#7e1f2e', roughness: 0.8, sheen: 1, sheenRoughness: 0.45, sheenColor: '#e08896', envMap: env, envMapIntensity: 0.1 })),
    solidWhite: std({ color: '#f4f0ea', roughness: 0.22 }, 0.6),
    creamLacquer: std({ color: '#f1e3d8', roughness: 0.3 }, 0.5),
    brass: lux.brass,
    shelfGlass: mark(new MeshPhysicalMaterial({ color: '#e3eeea', roughness: 0.02, transparent: true, opacity: 0.32, depthWrite: false, envMap: env, envMapIntensity: 1.2 })),
    cabinetGlass: mark(new MeshPhysicalMaterial({ color: '#eef4f2', roughness: 0.02, transparent: true, opacity: 0.12, depthWrite: false, side: DoubleSide, envMap: env, envMapIntensity: 1.3 })),
    /** Bark on the tree's limbs (UVs along and round each tube). */
    bark: std({ map: tex(512, 512, bark, 1 / 5, 1 / 2), normalMap: k.tex.normalPainted('parfum_bark', 512, 512, bark, 5, 2), roughness: 0.92 }, 0.05),
    barkLight: std({ map: tex(512, 512, bark, 1 / 3, 1), color: '#c7b2a2', roughness: 0.9 }, 0.05),
    blossomPink: blossomMat([242, 182, 200], [206, 98, 132], 1621),
    blossomPale: blossomMat([248, 218, 226], [222, 140, 164], 1622),
    blossomBlue: blossomMat([184, 200, 238], [112, 140, 206], 1623),
    soil: std({ color: '#3a2e26', roughness: 1 }, 0),
    paper: std({ color: '#f7f3ec', roughness: 0.85 }, 0.05),
    blackMatte: std({ color: '#1b1a1a', roughness: 0.6 }, 0.2),
    blackGloss: std({ color: '#121212', roughness: 0.12 }, 0.9),
    whiteGloss: std({ color: '#f7f5f1', roughness: 0.18 }, 0.6),
    ceramic: std({ color: '#f6f2ec', roughness: 0.28 }, 0.6),
    /* bottles: glass, metal, caps */
    clear: glass('#f6f8f7', 0.2),
    thick: glass('#eef3f1', 0.32, 0.01),
    smoke: glass('#4a4f55', 0.62),
    cobalt: glass('#2b4b8c', 0.6),
    rosy: glass('#f1c2cc', 0.45),
    frosted: mark(new MeshPhysicalMaterial({ color: '#f3f1ee', roughness: 0.48, transparent: true, opacity: 0.86, envMap: env, envMapIntensity: 0.6 })),
    frostedPink: mark(new MeshPhysicalMaterial({ color: '#f2d3d8', roughness: 0.5, transparent: true, opacity: 0.88, envMap: env, envMapIntensity: 0.5 })),
    amber: glass('#9c5a22', 0.78, 0.04),
    crystal: glass('#ffffff', 0.4, 0.0),
    gold: metal('#d8b878', 0.16),
    roseGold: metal('#d9a796', 0.18),
    silver: metal('#dfe2e6', 0.12),
    gunmetal: metal('#55585d', 0.25),
    capBlack: std({ color: '#151515', roughness: 0.2 }, 0.8),
    capWhite: std({ color: '#f3f0ea', roughness: 0.25 }, 0.5),
    capWood: std({ color: '#7a5236', roughness: 0.5 }, 0.2),
    dipTube: mark(new MeshStandardMaterial({ color: '#ffffff', roughness: 0.2, transparent: true, opacity: 0.55, envMap: env, envMapIntensity: 0.5 })),
    /** The juice: a colour, a little translucent. */
    juice: (color: string, opacity = 0.78) => {
      let j = juices.get(`${color}|${opacity}`)
      if (!j) {
        j = mark(new MeshPhysicalMaterial({ color, roughness: 0.08, transparent: true, opacity, envMap: env, envMapIntensity: 0.7 }))
        juices.set(`${color}|${opacity}`, j)
      }
      return j
    },
    /** Printed board for a box. */
    board: (color: string, rough = 0.45) => {
      let b = boards.get(color)
      if (!b) {
        b = std({ color, roughness: rough }, 0.3)
        boards.set(color, b)
      }
      return b
    },
    /** Paints a label or box front into the atlas once; its UVs. */
    print: (l: Print) => {
      const key = `${l.name}|${l.line}|${l.ground}|${l.ink}|${l.foil}|${l.w}|${l.h}|${l.box}`
      let uv = cache.get(key)
      if (!uv) {
        uv = atlas.cell(l.w ?? 192, l.h ?? 128, printPaint(l))
        cache.set(key, uv)
      }
      return uv
    },
    printMat,
    canvas,
    std,
  }
}

export type PerfumeMaterials = ReturnType<typeof perfumeMaterials>
