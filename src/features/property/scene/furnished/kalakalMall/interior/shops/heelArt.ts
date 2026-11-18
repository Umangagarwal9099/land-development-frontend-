import { CanvasTexture, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, type Material } from 'three'
import { rng, type Paint } from '../../../textures'
import type { FloorCtx } from '../shell'
import type { HeelKit } from './heels'
import { PI } from './kit'

/*
 * TR/BECA's finishes, from the reference: the floor of big polished hexagons, cream marble laid
 * with grey wood-veined ones; the domes' warm cream panels outside and their lit cream insides;
 * champagne metal ribs and frames; the rust-red lacquer of the slatted shoe sculptures; the open
 * ceiling painted mid-grey with its ducts; taupe upholstery. And the leathers of the collection.
 */

export const HOUSE = 'TR/BECA'
const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif'

/* ---------- painters ---------- */

/** Hexagon radius (centre to corner) of the floor, in metres; the repeat is 4 × 3 hexagons. */
export const HEX_R = 0.7
export const HEX_REPEAT: [number, number] = [6 * HEX_R, 3 * Math.sqrt(3) * HEX_R]

/** Strokes of veining across a clip: long, nearly parallel, as in a vein-cut stone. */
function veins(g: CanvasRenderingContext2D, r: () => number, cx: number, cy: number, size: number, angle: number, colours: string[], n: number, width: [number, number], wander: number) {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  for (let i = 0; i < n; i++) {
    const off = (r() - 0.5) * size * 2.2
    const ph = r() * 6
    g.strokeStyle = colours[Math.floor(r() * colours.length)]
    g.globalAlpha = 0.25 + r() * 0.55
    g.lineWidth = width[0] + r() * (width[1] - width[0])
    g.beginPath()
    for (let t = -size * 1.3; t <= size * 1.3; t += 6) {
      const w = Math.sin(t / (size * 0.35) + ph) * wander + Math.sin(t / (size * 0.11) + ph * 2) * wander * 0.25
      const x = cx + dx * t - dy * (off + w)
      const y = cy + dy * t + dx * (off + w)
      if (t === -size * 1.3) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
  }
  g.globalAlpha = 1
}

/**
 * The floor: flat-topped hexagons, most of them warm cream marble with soft cloud and fine gold
 * veins, some a grey stone streaked with white in parallel bands (each cut at its own angle),
 * with fine joints. Tiles seamlessly at HEX_REPEAT.
 */
const hexFloor: Paint = (g, w, h) => {
  const R = w / 6
  const rowH = h / 3
  const r = rng(4103)
  g.fillStyle = '#e8e0d2'
  g.fillRect(0, 0, w, h)
  // Which hexagons are grey: picked by hand so no two greys touch and the pattern reads as the reference's.
  const grey = new Set(['0,0', '2,1', '1,2', '3,2', '3,0'])
  const hex = (cx: number, cy: number) => {
    g.beginPath()
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * PI * 2
      const x = cx + Math.cos(a) * R
      const y = cy + Math.sin(a) * R
      if (k === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.closePath()
  }
  for (let col = -1; col <= 4; col++)
    for (let row = -1; row <= 3; row++) {
      const cx = col * 1.5 * R
      const cy = row * rowH + (((col % 2) + 2) % 2) * (rowH / 2)
      const key = `${((col % 4) + 4) % 4},${((row % 3) + 3) % 3}`
      const isGrey = grey.has(key)
      // The same tile at its wrapped copies: seed by its key.
      const rr = rng(5000 + (((col % 4) + 4) % 4) * 17 + (((row % 3) + 3) % 3) * 131)
      g.save()
      hex(cx, cy)
      g.clip()
      if (isGrey) {
        // Vein-cut grey stone: broad parallel bands of lighter and darker grey, then fine white
        // and charcoal veins along them, all at the slab's own angle.
        g.fillStyle = '#a4a29e'
        g.fillRect(cx - R, cy - R, 2 * R, 2 * R)
        const a = rr() * PI
        g.filter = 'blur(3px)'
        veins(g, rr, cx, cy, R, a, ['#c4c2bd', '#8e8c88', '#b3b1ac', '#7d7b77', '#d2d0cb'], 34, [8, 34], R * 0.025)
        g.filter = 'blur(0.8px)'
        veins(g, rr, cx, cy, R, a, ['#f1f0ec', '#e2e0db', '#5f5d59', '#ffffff'], 70, [0.8, 3.2], R * 0.02)
        g.filter = 'none'
      } else {
        const tone = rr()
        g.fillStyle = tone < 0.5 ? '#ebe3d5' : '#e5dccc'
        g.fillRect(cx - R, cy - R, 2 * R, 2 * R)
        g.filter = 'blur(22px)'
        for (let i = 0; i < 9; i++) {
          g.fillStyle = ['#f3ede2', '#dcd0bd', '#efe7da'][i % 3]
          g.globalAlpha = 0.25 + rr() * 0.3
          g.beginPath()
          g.ellipse(cx + (rr() - 0.5) * R * 1.6, cy + (rr() - 0.5) * R * 1.6, R * (0.3 + rr() * 0.6), R * (0.15 + rr() * 0.3), rr() * 3, 0, 7)
          g.fill()
        }
        g.filter = 'blur(0.8px)'
        veins(g, rr, cx, cy, R, rr() * PI, ['#c9b79b', '#b7a184', '#d8cab3'], 5, [0.6, 2], R * 0.18)
        g.filter = 'none'
      }
      g.restore()
    }
  // The joints, over everything: fine and a touch darker than the stone.
  g.strokeStyle = 'rgba(120,110,98,.55)'
  g.lineWidth = 1.6
  for (let col = -1; col <= 4; col++)
    for (let row = -1; row <= 3; row++) {
      hex(col * 1.5 * R, row * rowH + (((col % 2) + 2) % 2) * (rowH / 2))
      g.stroke()
    }
  // Polish: a fine speckle of grain.
  for (let i = 0; i < 16000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(60,50,40,.05)'
    g.fillRect(r() * w, r() * h, 1.5, 1.5)
  }
}

/** Plaster: a warm greige ground, softly mottled. */
const plaster = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = `rgb(${base.join(',')})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 380; i++) {
    const x = r() * w
    const y = r() * h
    const s = w * (0.03 + r() * 0.1)
    const gr = g.createRadialGradient(x, y, 0, x, y, s)
    const d = r() < 0.5 ? 8 : -7
    gr.addColorStop(0, `rgba(${base.map((c) => Math.max(0, Math.min(255, c + d))).join(',')},.35)`)
    gr.addColorStop(1, `rgba(${base.join(',')},0)`)
    g.fillStyle = gr
    g.fillRect(x - s, y - s, 2 * s, 2 * s)
  }
}

/**
 * The domes' panels: warm cream, a fine horizontal joint every sixth of the height (the panels'
 * courses), a faint satin grain.
 */
const domePanels: Paint = (g, w, h) => {
  const r = rng(4121)
  g.fillStyle = '#e4d8c6'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 3000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(80,60,40,.04)'
    g.fillRect(r() * w, r() * h, 3, 1)
  }
  g.fillStyle = 'rgba(120,100,78,.35)'
  for (let k = 0; k < 6; k++) g.fillRect(0, (k / 6) * h, w, 2)
}

/**
 * Inside a dome, one shelf's height to a repeat: brightest just under the shelf above (where its
 * light strip washes down) and falling to a warm cream at the next shelf. Used as an emissive map.
 */
const shelfWash: Paint = (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h)
  gr.addColorStop(0, '#fff4e2')
  gr.addColorStop(0.18, '#f6e6cc')
  gr.addColorStop(0.6, '#cbb79a')
  gr.addColorStop(1, '#b9a587')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
}

/** Painted MDF, its edges and faces: a faint orange-peel speckle in rust lacquer. */
const lacquer = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = `rgb(${base.join(',')})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.05)'
    g.fillRect(r() * w, r() * h, 2, 2)
  }
}

/** Brushed metal: fine streaks along one way. */
const brushed = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = `rgb(${base.join(',')})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'
    g.fillRect(0, r() * h, w, 0.7 + r())
  }
}

/** A low-pile weave for upholstery: fine crossing threads. */
const weave = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = `rgb(${base.join(',')})`
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 3) {
    g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`
    g.fillRect(0, y, w, 1)
  }
  for (let x = 0; x < w; x += 3) {
    g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.04})`
    g.fillRect(x, 0, 1, h)
  }
}

/** Grain for the leathers' relief: pebble (nappa), nap (suede), scales (croc). */
const pebble: Paint = (g, w, h) => {
  const r = rng(4131)
  g.fillStyle = '#808080'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 2600; i++) {
    const x = r() * w
    const y = r() * h
    const s = 2 + r() * 4
    const gr = g.createRadialGradient(x, y, 0, x, y, s)
    gr.addColorStop(0, 'rgba(255,255,255,.35)')
    gr.addColorStop(1, 'rgba(0,0,0,.0)')
    g.fillStyle = gr
    g.fillRect(x - s, y - s, 2 * s, 2 * s)
  }
}
const nap: Paint = (g, w, h) => {
  const r = rng(4132)
  g.fillStyle = '#808080'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)'
    g.fillRect(r() * w, r() * h, 1, 1)
  }
}
const scales: Paint = (g, w, h) => {
  const r = rng(4133)
  g.fillStyle = '#5a5a5a'
  g.fillRect(0, 0, w, h)
  // Rows of rounded rectangles, staggered, raised in the middle, the grooves between dark.
  const rows = 8
  const rh = h / rows
  for (let j = 0; j < rows; j++) {
    const n = 6 + Math.floor(r() * 2)
    const cw = w / n
    for (let i = -1; i <= n; i++) {
      const x = i * cw + (j % 2) * cw * 0.5 + (r() - 0.5) * cw * 0.15
      const gr = g.createRadialGradient(x + cw / 2, j * rh + rh / 2, 1, x + cw / 2, j * rh + rh / 2, cw * 0.6)
      gr.addColorStop(0, '#c8c8c8')
      gr.addColorStop(1, '#8a8a8a')
      g.fillStyle = gr
      g.beginPath()
      g.roundRect(x + 2, j * rh + 2, cw - 4, rh - 4, 6)
      g.fill()
    }
  }
}
/** Glitter: a dense scatter of bright specks for the emissive sparkle. */
const specks: Paint = (g, w, h) => {
  const r = rng(4134)
  g.fillStyle = '#000'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`
    g.fillRect(r() * w, r() * h, 1 + r(), 1 + r())
  }
}

/* ---------- materials ---------- */

export type Finish = 'nappa' | 'patent' | 'suede' | 'satin' | 'metallic' | 'glitter' | 'croc' | 'velvet' | 'vinyl'

export function heelMaterials(e: FloorCtx) {
  const { k, m, lux } = e
  const env = m.env
  const mark = <T extends Material>(x: T) => ((x.userData.interior = true), x)
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.5) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const phys = (p: ConstructorParameters<typeof MeshPhysicalMaterial>[0], reflect = 0.5) => mark(new MeshPhysicalMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
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
  // The leathers' relief maps, made once and shared by every colour.
  const bump = { pebble: tex(256, 256, pebble, 1), nap: tex(256, 256, nap, 1), scales: tex(256, 256, scales, 1), specks: tex(256, 256, specks, 1) }
  const finishes = new Map<string, Material>()
  /** One finish in one colour, shared by every shoe that wears it. */
  const leather = (finish: Finish, colour: string) => {
    const key = `${finish}|${colour}`
    let mat = finishes.get(key)
    if (mat) return mat
    const side = DoubleSide
    switch (finish) {
      case 'nappa':
        mat = phys({ color: colour, roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.35, bumpMap: bump.pebble, bumpScale: 0.25, side }, 0.45)
        break
      case 'patent':
        mat = phys({ color: colour, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.03, side }, 1.0)
        break
      case 'suede':
        mat = phys({ color: colour, roughness: 0.95, sheen: 1, sheenRoughness: 0.55, sheenColor: '#ffffff', bumpMap: bump.nap, bumpScale: 0.6, side }, 0.08)
        break
      case 'satin':
        mat = phys({ color: colour, roughness: 0.42, sheen: 1, sheenRoughness: 0.3, sheenColor: '#ffffff', anisotropy: 0.6, side }, 0.5)
        break
      case 'velvet':
        mat = phys({ color: colour, roughness: 0.9, sheen: 1, sheenRoughness: 0.4, sheenColor: '#ffd9e0', side }, 0.05)
        break
      case 'metallic':
        mat = phys({ color: colour, metalness: 0.85, roughness: 0.3, bumpMap: bump.pebble, bumpScale: 0.15, side }, 1.1)
        break
      case 'glitter':
        mat = phys({ color: colour, metalness: 0.7, roughness: 0.45, emissive: '#ffffff', emissiveMap: bump.specks, emissiveIntensity: 0.22, bumpMap: bump.specks, bumpScale: 0.6, side }, 0.9)
        break
      case 'croc':
        mat = phys({ color: colour, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.12, bumpMap: bump.scales, bumpScale: 1.4, side }, 0.6)
        break
      case 'vinyl':
        mat = phys({ color: colour, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false, side }, 1.2)
        break
    }
    finishes.set(key, mat!)
    return mat!
  }
  const soles = new Map<string, Material>()
  const sole = (colour: string) => {
    let s = soles.get(colour)
    if (!s) soles.set(colour, (s = phys({ color: colour, roughness: 0.48, clearcoat: 0.3, side: DoubleSide }, 0.3)))
    return s
  }
  const stampTex = canvas(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.fillStyle = '#c9a463'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `300 ${h * 0.42}px ${SANS}`
    g.fillText(HOUSE, w / 2, h * 0.42)
    g.font = `400 ${h * 0.16}px ${SANS}`
    g.fillText('MADE IN ITALY', w / 2, h * 0.8)
  })
  const kit: HeelKit = {
    lining: phys({ color: '#d7b897', roughness: 0.6, side: DoubleSide }, 0.2),
    sock: phys({ color: '#d2b08f', roughness: 0.55, side: DoubleSide }, 0.2),
    sole: sole('#2b211c'),
    toplift: std({ color: '#141414', roughness: 0.7 }, 0.1),
    gold: phys({ color: '#d9bc84', metalness: 1, roughness: 0.18, side: DoubleSide }, 1.2),
    crystal: phys({ color: '#ffffff', metalness: 0.1, roughness: 0, iridescence: 0.6, clearcoat: 1, emissive: '#ffffff', emissiveIntensity: 0.12 }, 2.2),
    pearl: phys({ color: '#f3ece0', roughness: 0.22, clearcoat: 0.8, iridescence: 0.35, sheen: 0.4 }, 0.8),
    stamp: std({ map: stampTex, transparent: true, roughness: 0.3, metalness: 0.6 }, 0.8),
  }
  const shoeBox = (ground: string, ink: string) =>
    std({
      map: canvas(256, 128, (g, w, h) => {
        g.fillStyle = ground
        g.fillRect(0, 0, w, h)
        g.fillStyle = ink
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.font = `300 ${h * 0.3}px ${SANS}`
        g.fillText(HOUSE, w / 2, h / 2)
      }),
      roughness: 0.6,
    }, 0.15)
  return {
    /* the room */
    floor: std({ map: tex(2048, Math.round((2048 * HEX_REPEAT[1]) / HEX_REPEAT[0]), hexFloor, HEX_REPEAT[0], HEX_REPEAT[1]), roughness: 0.1, metalness: 0 }, 0.85),
    wall: std({ map: tex(1024, 1024, plaster([206, 197, 184], 4141), 2.4), roughness: 0.9 }, 0.05),
    ceiling: std({ color: '#6b6c6d', roughness: 0.95 }, 0.03),
    duct: std({ color: '#7d7f80', roughness: 0.55, metalness: 0.3 }, 0.25),
    ductDark: std({ color: '#55575a', roughness: 0.6, metalness: 0.2 }, 0.2),
    cableTray: std({ color: '#8a8b8c', roughness: 0.5, metalness: 0.5 }, 0.3),
    blackTrack: std({ color: '#151515', roughness: 0.45, metalness: 0.4 }, 0.4),
    ring: std({ color: '#efece6', roughness: 0.5 }, 0.2),
    /* the domes */
    domeOut: std({ map: tex(1024, 512, domePanels, 1, 1), roughness: 0.55, side: DoubleSide }, 0.25),
    domeIn: std({ color: '#efe3cf', emissive: '#ffffff', emissiveMap: tex(16, 256, shelfWash, 1, 1), emissiveIntensity: 0.32, roughness: 0.75, side: DoubleSide }, 0.1),
    shelf: std({ color: '#f1e7d6', roughness: 0.5 }, 0.2),
    champagne: std({ map: tex(512, 512, brushed([214, 198, 168], 4151), 0.25), metalness: 0.85, roughness: 0.3 }, 1.0),
    champagneDark: std({ color: '#9d8562', metalness: 0.9, roughness: 0.35 }, 0.9),
    /* the sculptures and furniture */
    rust: std({ map: tex(512, 512, lacquer([186, 82, 52], 4161), 0.8), roughness: 0.55 }, 0.25),
    taupe: phys({ map: tex(256, 256, weave([150, 140, 127], 4171), 0.2), roughness: 0.92, sheen: 0.6, sheenRoughness: 0.5, sheenColor: '#d9cfc2' }, 0.05),
    taupeDark: phys({ map: tex(256, 256, weave([132, 122, 110], 4172), 0.2), roughness: 0.92, sheen: 0.6, sheenRoughness: 0.5, sheenColor: '#cbbfb1' }, 0.05),
    counterCream: std({ color: '#ece4d6', roughness: 0.35 }, 0.4),
    travertine: std({ map: tex(1024, 1024, plaster([214, 200, 178], 4181), 1.2), roughness: 0.4 }, 0.3),
    glass: phys({ color: '#eef4f2', roughness: 0.02, transparent: true, opacity: 0.12, depthWrite: false, side: DoubleSide }, 1.3),
    shelfGlass: phys({ color: '#e3eeea', roughness: 0.02, transparent: true, opacity: 0.3, depthWrite: false }, 1.2),
    acrylic: phys({ color: '#f2f6f7', roughness: 0.03, transparent: true, opacity: 0.4, depthWrite: false, clearcoat: 1, side: DoubleSide }, 1.4),
    mirror: std({ color: '#e9eef0', metalness: 1, roughness: 0.02 }, 1.6),
    blackGloss: std({ color: '#121212', roughness: 0.12 }, 0.9),
    blackMatte: std({ color: '#1b1a1a', roughness: 0.6 }, 0.2),
    tissue: std({ color: '#f5f1ea', roughness: 0.9 }, 0.05),
    boxLid: shoeBox('#ece5d8', '#3b342c'),
    boxBlack: shoeBox('#1d1c1b', '#d9c49a'),
    boxSide: std({ color: '#e6ddcf', roughness: 0.6 }, 0.15),
    boxSideDark: std({ color: '#222120', roughness: 0.6 }, 0.15),
    sizer: std({ color: '#3a3a3a', roughness: 0.4, metalness: 0.5 }, 0.4),
    leather,
    sole,
    kit,
    canvas,
    std,
    lux,
  }
}

export type HeelMaterials = ReturnType<typeof heelMaterials>
