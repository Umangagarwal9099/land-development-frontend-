import { AdditiveBlending, BoxGeometry, CanvasTexture, CatmullRomCurve3, CircleGeometry, CylinderGeometry, DoubleSide, Group, LatheGeometry, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, OctahedronGeometry, RepeatWrapping, RingGeometry, SphereGeometry, SRGBColorSpace, TorusGeometry, Vector2, Vector3, type Material, type Object3D } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { rng, type Paint } from '../../../textures'
import type { FloorCtx } from '../shell'
import { ribbon } from './heels'
import { PI } from './kit'

/*
 * Wristwatches, made to their real dimensions (a 41 mm Oyster case is 0.041 m across), each part
 * modelled as a watchmaker would name it: the middle case turned with its bevels, the lugs, the
 * bezel (smooth, fluted, a ceramic dive or two-colour GMT insert, an engraved tachymeter, diamonds),
 * the dial with its applied indices and printed signature, the hour, minute and seconds hands (a
 * GMT hand, chronograph registers), the date under its Cyclops lens, the sapphire crystal, the
 * fluted crown with its guards, the case back; and the bracelet built link by link (Oyster's three
 * pieces, Jubilee's five, President's three rounded) to its clasp, or a leather strap or an
 * Oysterflex. The watch lies with its dial towards +z and 12 o'clock towards +y, its bracelet
 * looping back round a display cushion behind it, as watches are shown in a boutique.
 *
 * Also the boutique's finishes: the malachite-green wave panels, the olive ceiling, travertine,
 * walnut, bronze, cream lacquer, teal velvet, the tiles and the carpet.
 */

/* ---------- painters ---------- */

/** The wave panels: deep green, lighter flowing bands and fine lines, points of light along them. */
const waves: Paint = (g, w, h) => {
  const r = rng(9301)
  const gr = g.createLinearGradient(0, 0, w, h)
  gr.addColorStop(0, '#0a4a3c')
  gr.addColorStop(0.5, '#13735c')
  gr.addColorStop(1, '#0b5143')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 60; i++) {
    const y0 = (i / 60) * h * 1.4 - h * 0.2
    const amp = 18 + r() * 26
    const ph = r() * 6
    g.strokeStyle = r() < 0.3 ? 'rgba(160,255,220,.55)' : 'rgba(40,160,130,.45)'
    g.lineWidth = 0.8 + r() * 2.2
    g.beginPath()
    for (let x = 0; x <= w; x += 6) {
      const y = y0 + Math.sin(x / (w * 0.18) + ph) * amp + Math.sin(x / (w * 0.07) + ph * 2) * amp * 0.25
      if (x === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
  }
  // Soft broad swells of light.
  g.filter = 'blur(30px)'
  for (let i = 0; i < 10; i++) {
    g.fillStyle = 'rgba(90,220,180,.18)'
    g.beginPath()
    g.ellipse(r() * w, r() * h, w * 0.3, h * 0.05, -0.3 + r() * 0.6, 0, 7)
    g.fill()
  }
  g.filter = 'none'
  for (let i = 0; i < 240; i++) {
    g.fillStyle = `rgba(255,255,240,${0.4 + r() * 0.6})`
    g.beginPath()
    g.arc(r() * w, r() * h, 0.8 + r() * 1.6, 0, 7)
    g.fill()
  }
}
const noise = (base: [number, number, number], seed: number, amt = 10): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = `rgb(${base.join(',')})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 14000; i++) {
    const d = (r() - 0.5) * 2 * amt
    g.fillStyle = `rgba(${base.map((c) => Math.max(0, Math.min(255, c + d))).join(',')},.6)`
    g.fillRect(r() * w, r() * h, 2, 2)
  }
}
/** Travertine in blocks: warm cream, banded, its pores, the joints. */
const travertine: Paint = (g, w, h) => {
  const r = rng(9302)
  g.fillStyle = '#d9cfbe'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 120; i++) {
    g.strokeStyle = r() < 0.5 ? 'rgba(190,175,150,.35)' : 'rgba(240,232,220,.4)'
    g.lineWidth = 1 + r() * 4
    const y = r() * h
    g.beginPath()
    g.moveTo(0, y)
    g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 12, w * 0.7, y + (r() - 0.5) * 12, w, y + (r() - 0.5) * 8)
    g.stroke()
  }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = 'rgba(150,130,100,.3)'
    g.beginPath()
    g.ellipse(r() * w, r() * h, 1 + r() * 3, 0.5 + r(), 0, 0, 7)
    g.fill()
  }
  g.fillStyle = 'rgba(140,125,100,.6)'
  for (let i = 0; i <= 2; i++) g.fillRect(0, (i * h) / 2 - 1, w, 2)
  g.fillRect(w / 2 - 1, 0, 2, h / 2)
  g.fillRect(0, h / 2, 2, h / 2)
}
const walnut: Paint = (g, w, h) => {
  const r = rng(9303)
  g.fillStyle = '#4a3324'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 200; i++) {
    g.strokeStyle = `rgba(${r() < 0.5 ? '30,18,10' : '120,85,60'},${0.15 + r() * 0.25})`
    g.lineWidth = 0.6 + r() * 1.8
    const x = r() * w
    g.beginPath()
    g.moveTo(x, 0)
    g.bezierCurveTo(x + (r() - 0.5) * 20, h * 0.35, x + (r() - 0.5) * 20, h * 0.65, x + (r() - 0.5) * 10, h)
    g.stroke()
  }
}
/** Large cream porcelain tiles, 60 × 120. */
const tiles: Paint = (g, w, h) => {
  const r = rng(9304)
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const t = 228 + Math.floor(r() * 8)
      g.fillStyle = `rgb(${t},${t - 5},${t - 14})`
      g.fillRect((i * w) / 2, (j * h) / 2, w / 2, h / 2)
    }
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(150,130,110,.06)'
    g.fillRect(r() * w, r() * h, 2, 2)
  }
  g.fillStyle = 'rgba(160,145,125,.5)'
  for (const p of [0, w / 2]) g.fillRect(p, 0, 1.5, h)
  for (const p of [0, h / 2]) g.fillRect(0, p, w, 1.5)
}

/* ---------- materials ---------- */

export function watchMaterials(e: FloorCtx) {
  const { k, m } = e
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
    t.anisotropy = 8
    return t
  }
  const metal = (color: string, rough: number) => std({ color, metalness: 1, roughness: rough }, 1.4)
  const dials = new Map<string, Material>()
  const inserts = new Map<string, Material>()
  return {
    /* metals */
    steel: metal('#dfe2e5', 0.12),
    brushed: metal('#cfd2d6', 0.32),
    yellow: metal('#e8c072', 0.14),
    yellowBrushed: metal('#dcb465', 0.3),
    everose: metal('#e6ae94', 0.15),
    whiteGold: metal('#e4e5e8', 0.1),
    ceramicBlack: phys({ color: '#0d0d0f', roughness: 0.08, clearcoat: 1 }, 1.0),
    crystal: phys({ color: '#000000', roughness: 0.02, transparent: true, depthWrite: false, blending: AdditiveBlending }, 0.3),
    cyclops: phys({ color: '#000000', roughness: 0, transparent: true, depthWrite: false, blending: AdditiveBlending }, 0.5),
    diamond: phys({ color: '#ffffff', metalness: 0.1, roughness: 0, iridescence: 0.7, emissive: '#ffffff', emissiveIntensity: 0.15 }, 2.5),
    lume: std({ color: '#f2f6ea', emissive: '#bfffd0', emissiveIntensity: 0.1, roughness: 0.4 }, 0.2),
    rubber: phys({ color: '#141414', roughness: 0.65, sheen: 0.3 }, 0.2),
    leather: (colour: string) => phys({ color: colour, roughness: 0.5, clearcoat: 0.2, side: DoubleSide }, 0.3),
    red: std({ color: '#c41e2a', roughness: 0.4 }, 0.3),
    /* the dial: its colour, finish, track and signature, the date, painted once per look */
    dial: (key: string, colour: string, finish: 'sunburst' | 'matte' | 'mop', text: string[], date: boolean, numerals: '' | '369' | 'roman', day: boolean) => {
      const id = `${key}|${colour}|${finish}|${date}|${numerals}|${day}`
      let d = dials.get(id)
      if (d) return d
      const t = canvas(512, 512, (c, w, h) => {
        const cx = w / 2
        if (finish === 'sunburst') {
          for (let i = 0; i < 360; i++) {
            const a = (i / 360) * PI * 2
            c.strokeStyle = colour
            c.globalAlpha = 1
            c.beginPath()
            c.moveTo(cx, cx)
            c.lineTo(cx + Math.cos(a) * w, cx + Math.sin(a) * w)
            c.lineWidth = 6
            c.stroke()
            c.globalAlpha = 0.18 * Math.abs(Math.cos(a * 2))
            c.strokeStyle = '#ffffff'
            c.stroke()
          }
          c.globalAlpha = 1
        } else if (finish === 'mop') {
          const gr = c.createRadialGradient(cx * 0.8, cx * 0.7, 10, cx, cx, cx)
          gr.addColorStop(0, '#fff8fb')
          gr.addColorStop(0.5, colour)
          gr.addColorStop(1, '#e9dfe8')
          c.fillStyle = gr
          c.fillRect(0, 0, w, h)
        } else {
          c.fillStyle = colour
          c.fillRect(0, 0, w, h)
        }
        const light = parseInt(colour.slice(1, 3), 16) + parseInt(colour.slice(3, 5), 16) + parseInt(colour.slice(5, 7), 16) > 450
        const ink = light ? '#1d1d1f' : '#f2efe8'
        // The minute track.
        c.strokeStyle = ink
        for (let i = 0; i < 60; i++) {
          const a = (i / 60) * PI * 2
          const r1 = cx * 0.97
          const r0 = cx * (i % 5 ? 0.93 : 0.9)
          c.lineWidth = i % 5 ? 2 : 4
          c.beginPath()
          c.moveTo(cx + Math.sin(a) * r0, cx - Math.cos(a) * r0)
          c.lineTo(cx + Math.sin(a) * r1, cx - Math.cos(a) * r1)
          c.stroke()
        }
        // The signature above the centre, the line below.
        c.fillStyle = light ? '#1d1d1f' : '#f4f1ea'
        c.textAlign = 'center'
        c.font = `600 ${w * 0.055}px "Cormorant Garamond", Georgia, serif`
        c.fillText(text[0], cx, cx - w * 0.17)
        c.font = `500 ${w * 0.032}px "Inter", Arial, sans-serif`
        text.slice(1).forEach((l, i) => c.fillText(l, cx, cx + w * (0.2 + i * 0.045)))
        if (numerals === '369' || numerals === 'roman') {
          c.font = `600 ${w * 0.1}px ${numerals === 'roman' ? '"Cormorant Garamond", serif' : '"Inter", Arial, sans-serif'}`
          const labels = numerals === 'roman' ? [['XII', 0], ['III', 3], ['VI', 6], ['IX', 9]] : [['12', 0], ['3', 3], ['6', 6], ['9', 9]]
          for (const [s, hr] of labels as [string, number][]) {
            if (day && hr === 0) continue
            const a = (hr / 12) * PI * 2
            c.fillText(s, cx + Math.sin(a) * cx * 0.68, cx - Math.cos(a) * cx * 0.68 + w * 0.035)
          }
        }
        if (date) {
          c.fillStyle = '#ffffff'
          c.fillRect(cx + cx * 0.52, cx - w * 0.04, w * 0.11, w * 0.08)
          c.fillStyle = '#111111'
          c.font = `600 ${w * 0.06}px "Inter", Arial, sans-serif`
          c.fillText('18', cx + cx * 0.52 + w * 0.055, cx + w * 0.022)
        }
        if (day) {
          c.fillStyle = '#ffffff'
          c.fillRect(cx - w * 0.12, cx - cx * 0.6, w * 0.24, w * 0.07)
          c.fillStyle = '#111111'
          c.font = `600 ${w * 0.045}px "Inter", Arial, sans-serif`
          c.fillText('THURSDAY', cx, cx - cx * 0.6 + w * 0.052)
        }
      })
      d = phys({ map: t, roughness: finish === 'matte' ? 0.7 : 0.42, metalness: 0, clearcoat: finish === 'matte' ? 0 : 0.6, clearcoatRoughness: 0.15 }, 0.22)
      dials.set(id, d)
      return d
    },
    /** A bezel insert: dive minutes, a two-colour GMT 24-hour, a tachymeter. */
    insert: (kind: 'diver' | 'gmt' | 'tachy', a: string, b: string, ink: string) => {
      const id = `${kind}|${a}|${b}|${ink}`
      let d = inserts.get(id)
      if (d) return d
      const t = canvas(512, 512, (c, w) => {
        const cx = w / 2
        // The insert's colours (one or two halves).
        c.fillStyle = a
        c.beginPath()
        c.arc(cx, cx, cx, -PI / 2, kind === 'gmt' ? PI / 2 : PI * 1.5)
        c.lineTo(cx, cx)
        c.fill()
        if (kind === 'gmt') {
          c.fillStyle = b
          c.beginPath()
          c.arc(cx, cx, cx, PI / 2, PI * 1.5)
          c.lineTo(cx, cx)
          c.fill()
        }
        c.fillStyle = ink
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        const n = kind === 'diver' ? 12 : kind === 'gmt' ? 12 : 10
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * PI * 2
          const rr = cx * 0.86
          c.save()
          c.translate(cx + Math.sin(ang) * rr, cx - Math.cos(ang) * rr)
          c.rotate(ang)
          c.font = `700 ${w * 0.075}px "Inter", Arial, sans-serif`
          const label = kind === 'diver' ? (i === 0 ? '▼' : i % 2 ? '' : String(i * 5)) : kind === 'gmt' ? (i === 0 ? '▼' : String(i * 2)) : String(400 - i * 30)
          c.fillText(label, 0, 0)
          c.restore()
        }
        if (kind === 'diver')
          for (let i = 1; i < 15; i++) {
            const ang = (i / 60) * PI * 2
            c.fillRect(cx + Math.sin(ang) * cx * 0.86 - 2, cx - Math.cos(ang) * cx * 0.86 - 2, 4, 4)
          }
      })
      d = phys({ map: t, roughness: 0.1, clearcoat: 1 }, 1.0)
      inserts.set(id, d)
      return d
    },
    /* the room */
    wave: std({ map: canvas(1024, 768, waves), emissive: '#ffffff', emissiveMap: canvas(1024, 768, waves), emissiveIntensity: 0.55, roughness: 0.35 }, 0.3),
    olive: std({ map: tex(512, 512, noise([58, 58, 40], 9305, 8), 0.5), roughness: 0.9 }, 0.05),
    travertine: std({ map: tex(512, 512, travertine, 1.2, 0.6), roughness: 0.6 }, 0.15),
    walnut: std({ map: tex(512, 1024, walnut, 0.7, 1.4), roughness: 0.45 }, 0.3),
    bronze: std({ color: '#8b6b45', metalness: 1, roughness: 0.32 }, 1.0),
    cream: std({ color: '#f1ebdf', roughness: 0.3 }, 0.45),
    white: std({ color: '#f4f2ee', roughness: 0.85 }, 0.06),
    shagreen: std({ map: tex(256, 256, noise([215, 216, 208], 9306, 14), 0.08), roughness: 0.55 }, 0.2),
    teal: phys({ color: '#0f5a51', roughness: 0.82, sheen: 1, sheenRoughness: 0.4, sheenColor: '#6fd0bb', bumpMap: tex(128, 128, noise([128, 128, 128], 9307, 40), 0.01), bumpScale: 0.6 }, 0.06),
    tiles: std({ map: tex(512, 512, tiles, 1.2, 2.4), roughness: 0.22 }, 0.5),
    carpet: std({ map: tex(256, 256, noise([196, 182, 158], 9308, 12), 0.2), roughness: 0.98 }, 0.02),
    amber: phys({ color: '#8a4a12', roughness: 0.03, transparent: true, opacity: 0.5, depthWrite: false, emissive: '#e8781e', emissiveIntensity: 0.55, side: DoubleSide, clearcoat: 1 }, 1.4),
    glass: phys({ color: '#eef4f2', roughness: 0.02, transparent: true, opacity: 0.1, depthWrite: false, side: DoubleSide }, 1.4),
    suede: phys({ color: '#d8ccb8', roughness: 0.95, sheen: 1, sheenRoughness: 0.5, sheenColor: '#ffffff' }, 0.05),
    suedeGreen: phys({ color: '#14473d', roughness: 0.95, sheen: 1, sheenRoughness: 0.5, sheenColor: '#7fd6b8' }, 0.05),
    canvas,
    std,
  }
}

export type WatchMaterials = ReturnType<typeof watchMaterials>
type M = WatchMaterials

/* ---------- the watch ---------- */

export type Metal = 'steel' | 'yellow' | 'everose' | 'whiteGold' | 'rolesor'
export interface WatchSpec {
  line: string
  /** Case diameter in mm. */
  size: number
  metal: Metal
  dial: string
  finish?: 'sunburst' | 'matte' | 'mop'
  indices: 'baton' | 'dot' | '369' | 'roman' | 'diamond'
  bezel: 'smooth' | 'fluted' | 'diver' | 'gmt' | 'tachy' | 'diamond' | 'ring'
  insert?: [string, string, string]
  bracelet: 'oyster' | 'jubilee' | 'president' | 'leather' | 'rubber'
  strap?: string
  date?: boolean
  day?: boolean
  chrono?: boolean
  gmt?: boolean
  guards?: boolean
}

function metals(m: M, metal: Metal) {
  switch (metal) {
    case 'steel':
      return { case: m.steel, brushed: m.brushed, bezel: m.steel, centre: m.steel, index: m.whiteGold }
    case 'yellow':
      return { case: m.yellow, brushed: m.yellowBrushed, bezel: m.yellow, centre: m.yellow, index: m.yellow }
    case 'everose':
      return { case: m.everose, brushed: m.everose, bezel: m.everose, centre: m.everose, index: m.everose }
    case 'whiteGold':
      return { case: m.whiteGold, brushed: m.brushed, bezel: m.whiteGold, centre: m.whiteGold, index: m.whiteGold }
    case 'rolesor':
      return { case: m.steel, brushed: m.brushed, bezel: m.yellow, centre: m.yellow, index: m.yellow }
  }
}

const turn = (pts: [number, number][], seg = 64) => {
  const g = new LatheGeometry(pts.map(([r, h]) => new Vector2(r, h)), seg)
  g.rotateX(PI / 2)
  return g
}

function add(p: Object3D, geo: import('three').BufferGeometry, mat: Material, x = 0, y = 0, z = 0) {
  const o = new Mesh(geo, mat)
  o.position.set(x, y, z)
  o.castShadow = false
  o.receiveShadow = false
  p.add(o)
  return o
}

/** One watch on its display cushion. Returns the group (cushion included). */
export function watch(m: M, p: Object3D, s: WatchSpec, cushion: Material | null = m.suede) {
  const g = new Group()
  p.add(g)
  const R = s.size / 2000
  const mt = metals(m, s.metal)
  const H0 = -0.0062
  const H1 = 0.0055
  // The middle case, its bevels; the case back.
  add(g, turn([[0, H0], [R * 0.82, H0], [R * 0.95, H0 + 0.0016], [R, -0.002], [R, 0.0025], [R * 0.985, H1], [R * 0.81, H1], [R * 0.81, H1 - 0.0014], [0, H1 - 0.0014]], 72), mt.case)
  add(g, turn([[0, H0 - 0.0018], [R * 0.78, H0 - 0.0018], [R * 0.82, H0], [0, H0]], 48), mt.brushed)
  // The lugs, sloping to the bracelet.
  const lugW = R * 0.98
  const lugGeo = new RoundedBoxGeometry(0.0036, 0.0078, 0.0068, 2, 0.0012)
  for (const sy of [-1, 1])
    for (const sx of [-1, 1]) {
      const l = add(g, lugGeo, mt.case, sx * (lugW / 2 - 0.0018), sy * (R + 0.0012), -0.0012)
      l.rotation.x = sy * 0.22
    }
  // The bezel.
  const bz = R * 0.82
  const top = H1 + 0.0028
  if (s.bezel === 'fluted') {
    const geo = turn([[bz, H1], [R * 0.99, H1], [R * 0.97, H1 + 0.0018], [R * 0.86, top], [bz, top - 0.0004]], 240)
    // Cut the flutes: the outer slope pushed in and out round the ring.
    const pos = geo.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const rr = Math.hypot(x, y)
      if (rr > bz + 0.0003 && z > H1 + 0.0002) {
        const a = Math.atan2(y, x)
        const f = 1 - 0.035 * Math.max(0, Math.cos(a * 60)) ** 2
        pos.setXYZ(i, x * f, y * f, z)
      }
    }
    geo.computeVertexNormals()
    add(g, geo, mt.bezel)
  } else if (s.bezel === 'diver' || s.bezel === 'gmt' || s.bezel === 'tachy') {
    add(g, turn([[bz, H1], [R * 1.0, H1], [R * 1.0, H1 + 0.0016], [R * 0.97, top - 0.0008], [bz, top - 0.0008]], 120), s.bezel === 'tachy' ? m.ceramicBlack : mt.bezel)
    const [a, b, ink] = s.insert ?? ['#111111', '#111111', '#e9e3d0']
    const ins = add(g, new RingGeometry(bz + 0.0004, R * 0.955, 96), m.insert(s.bezel, a, b, ink), 0, 0, top - 0.0007)
    void ins
    // Its click: the edge knurled for grip (a dive or GMT bezel turns).
    if (s.bezel !== 'tachy') {
      const kn = add(g, new CylinderGeometry(R * 1.005, R * 1.005, 0.0016, 120, 1, true), mt.case, 0, 0, H1 + 0.0008)
      kn.rotation.x = PI / 2
    }
  } else if (s.bezel === 'diamond') {
    add(g, turn([[bz, H1], [R * 0.99, H1], [R * 0.97, top - 0.0006], [bz, top - 0.0006]], 96), mt.bezel)
    const st = new OctahedronGeometry(0.0011, 0)
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * PI * 2
      const d = add(g, st, m.diamond, Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9, top - 0.0002)
      d.scale.z = 0.6
    }
  } else if (s.bezel === 'ring') {
    const geo = turn([[bz, H1], [R * 0.99, H1], [R * 0.97, H1 + 0.0018], [R * 0.86, top], [bz, top - 0.0004]], 240)
    const pos = geo.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      if (Math.hypot(x, y) > bz + 0.0003 && z > H1 + 0.0002) {
        const f = 1 - 0.03 * Math.max(0, Math.cos(Math.atan2(y, x) * 40)) ** 6
        pos.setXYZ(i, x * f, y * f, z)
      }
    }
    geo.computeVertexNormals()
    add(g, geo, mt.bezel)
  } else add(g, turn([[bz, H1], [R * 0.99, H1], [R * 0.95, top - 0.0008], [bz, top - 0.0012]], 96), mt.bezel)
  // The dial, recessed under the bezel; its rehaut.
  const dz = H1 - 0.0012
  const numerals = s.indices === '369' ? '369' : s.indices === 'roman' ? 'roman' : ''
  const words = [s.line.includes('Daytona') ? 'ROLEX' : 'ROLEX', s.line.toUpperCase().includes('OYSTER') ? 'SUPERLATIVE CHRONOMETER' : 'OYSTER PERPETUAL', s.line.toUpperCase()]
  add(g, new CircleGeometry(bz * 0.995, 96), m.dial(s.line, s.dial, s.finish ?? 'sunburst', words, !!s.date, numerals, !!s.day), 0, 0, dz)
  const reh = add(g, new CylinderGeometry(bz, bz, 0.0012, 96, 1, true), mt.brushed, 0, 0, dz + 0.0006)
  reh.rotation.x = PI / 2
  // Applied indices: batons (a triangle at 12), dots, or set diamonds; skipped where numerals are printed.
  const lume = m.lume
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * PI * 2
    const skip = (numerals && i % 3 === 0) || (s.date && i === 3) || (s.chrono && (i === 3 || i === 6 || i === 9)) || (s.day && i === 0)
    if (skip) continue
    const r0 = bz * 0.78
    const x = Math.sin(a) * r0
    const y = Math.cos(a) * r0
    if (s.indices === 'diamond') {
      const d = add(g, new OctahedronGeometry(0.0009, 0), m.diamond, x, y, dz + 0.0005)
      d.scale.z = 0.6
      continue
    }
    if (s.indices === 'dot' && i % 3) {
      const c = add(g, new CylinderGeometry(0.0011, 0.0011, 0.0006, 16), mt.index, x, y, dz + 0.0003)
      c.rotation.x = PI / 2
      add(g, new CylinderGeometry(0.0008, 0.0008, 0.0002, 16), lume, x, y, dz + 0.0007).rotation.x = PI / 2
      continue
    }
    const len = i === 0 ? 0.0034 : 0.0028
    const w = i === 0 ? 0.0011 : 0.0009
    const b = add(g, new BoxGeometry(w, len, 0.0006), mt.index, x, y, dz + 0.0003)
    b.rotation.z = -a
    if (i === 0) {
      const b2 = add(g, new BoxGeometry(w, len, 0.0006), mt.index, x + Math.cos(a) * 0.0016, y - Math.sin(a) * 0.0016, dz + 0.0003)
      b2.rotation.z = -a
    }
  }
  // Chronograph registers, recessed, each with its hand; the pushers.
  if (s.chrono) {
    for (const [sx, sy] of [[-0.42, 0], [0.42, 0], [0, -0.42]] as const) {
      const sub = add(g, new CircleGeometry(bz * 0.23, 48), m.dial('sub', s.dial === '#f2efe8' || s.dial === '#ffffff' ? '#202022' : '#f2efe8', 'matte', ['', ''], false, '', false), sx * bz, sy * bz, dz + 0.0001)
      void sub
      const ring = add(g, new TorusGeometry(bz * 0.23, 0.00025, 6, 48), mt.index, sx * bz, sy * bz, dz + 0.0002)
      void ring
      const h = add(g, new BoxGeometry(0.0004, bz * 0.18, 0.0002), m.lume, sx * bz, sy * bz + bz * 0.07, dz + 0.0004)
      h.rotation.z = 0.6
    }
    for (const sy of [1, -1]) {
      const pu = add(g, new CylinderGeometry(0.0014, 0.0014, 0.004, 20), mt.case, (R + 0.002) * Math.cos(sy * 0.55), (R + 0.002) * Math.sin(sy * 0.55), 0)
      pu.rotation.z = PI / 2 + sy * 0.55
    }
  }
  // The hands at ten past ten: hour, minute (the GMT arrow), seconds with its lume dot.
  const hand = (len: number, w: number, a: number, mat: Material, z: number, tip?: Material) => {
    const hg = new Group()
    hg.rotation.z = -a
    hg.position.z = z
    g.add(hg)
    add(hg, new BoxGeometry(w, len, 0.0003), mat, 0, len / 2 - len * 0.12, 0)
    if (tip) add(hg, new CylinderGeometry(w * 1.05, w * 1.05, 0.0003, 16), tip, 0, len * 0.72, 0.0002).rotation.x = PI / 2
    return hg
  }
  hand(bz * 0.55, 0.0016, (10.17 / 12) * PI * 2, mt.index, dz + 0.0009, s.bezel === 'diver' || s.gmt ? lume : undefined)
  hand(bz * 0.85, 0.0012, (2 / 12) * PI * 2, mt.index, dz + 0.0012)
  if (s.gmt) hand(bz * 0.8, 0.0006, (7.5 / 12) * PI * 2, m.red, dz + 0.0015)
  hand(bz * 0.88, 0.00035, (6.5 / 12) * PI * 2, s.chrono ? m.red : mt.index, dz + 0.0018, lume)
  add(g, new CylinderGeometry(0.0009, 0.0009, 0.0008, 16), mt.index, 0, 0, dz + 0.0016).rotation.x = PI / 2
  // The crystal; the Cyclops over the date.
  const cry = add(g, new CylinderGeometry(bz * 1.01, bz * 1.01, 0.0011, 64), m.crystal, 0, 0, top - 0.0003)
  cry.rotation.x = PI / 2
  cry.renderOrder = 2
  if (s.date) {
    const cy = add(g, new SphereGeometry(1, 20, 10, 0, PI * 2, 0, PI / 2), m.cyclops, bz * 0.62, 0, top + 0.0002)
    cy.rotation.x = PI / 2
    cy.scale.set(0.0034, 0.0012, 0.0028)
    cy.renderOrder = 2
  }
  // The crown at three, fluted, and its guards on a sports case.
  const crown = add(g, new CylinderGeometry(0.0029, 0.0029, 0.0032, 24), mt.case, R + 0.0018, 0, -0.0004)
  crown.rotation.z = PI / 2
  add(g, new CylinderGeometry(0.0018, 0.0018, 0.0012, 16), mt.brushed, R + 0.0003, 0, -0.0004).rotation.z = PI / 2
  if (s.guards) for (const sy of [-1, 1]) add(g, new BoxGeometry(0.003, 0.0022, 0.006), mt.case, R + 0.0009, sy * 0.0042, -0.0004)

  // The bracelet or strap, looping back round the cushion to its clasp.
  const ry = 0.034
  const rz = 0.031
  const cz = -0.032
  const t0 = Math.asin(Math.min(0.99, (R + 0.006) / ry))
  const pts: Vector3[] = [new Vector3(0, R + 0.004, -0.001)]
  for (let i = 0; i <= 24; i++) {
    const t = t0 + ((2 * PI - 2 * t0) * i) / 24
    pts.push(new Vector3(0, ry * Math.sin(t), cz + rz * Math.cos(t)))
  }
  pts.push(new Vector3(0, -(R + 0.004), -0.001))
  const path = new CatmullRomCurve3(pts)
  const len = path.getLength()
  const W0 = lugW * 0.98
  const width = (t: number) => W0 * (1 - 0.18 * Math.sin(t * PI))
  const frame = (t: number) => {
    const c = path.getPointAt(t)
    const tan = path.getTangentAt(t)
    const side = new Vector3(1, 0, 0)
    const nrm = new Vector3().crossVectors(side, tan).normalize()
    return { c, tan, side, nrm }
  }
  if (s.bracelet === 'leather' || s.bracelet === 'rubber') {
    const n = 60
    const pp: Vector3[] = []
    const outs: Vector3[] = []
    for (let i = 0; i <= n; i++) {
      const f = frame(i / n)
      pp.push(f.c)
      outs.push(f.nrm.clone().negate())
    }
    const mat = s.bracelet === 'rubber' ? m.rubber : m.leather(s.strap ?? '#3a2516')
    add(g, ribbon(pp, outs, W0 * 0.92, s.bracelet === 'rubber' ? 0.0042 : 0.0034), mat)
    // The buckle at the back: a frame and its pin.
    const f = frame(0.5)
    const bk = new Group()
    bk.position.copy(f.c).addScaledVector(f.nrm, -0.0025)
    bk.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(f.side, f.tan, f.nrm))
    g.add(bk)
    for (const [bw, bh, x, y] of [[W0 * 1.05, 0.0016, 0, 0.007], [W0 * 1.05, 0.0016, 0, -0.007], [0.0016, 0.014, W0 * 0.52, 0], [0.0016, 0.014, -W0 * 0.52, 0]] as const) add(bk, new BoxGeometry(bw, bh, 0.0016), mt.brushed, x, y, 0)
  } else {
    // Links: Oyster (three pieces, the centre polished on gold-steel), Jubilee (five, smaller),
    // President (three rounded).
    const pitch = s.bracelet === 'jubilee' ? 0.0042 : s.bracelet === 'president' ? 0.0058 : 0.0066
    const rows = Math.floor(len / pitch)
    const linkGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.22)
    const capsule = new CylinderGeometry(0.5, 0.5, 1, 10)
    capsule.rotateZ(PI / 2)
    for (let i = 0; i < rows; i++) {
      const t = (i + 0.5) / rows
      if (Math.abs(t - 0.5) < 0.06) continue
      const f = frame(t)
      const W = width(t)
      const basis = new Matrix4().makeBasis(f.side, f.tan, f.nrm)
      const piece = (x: number, w: number, mat: Material, round = false, th = 0.0034) => {
        const o = new Mesh(round ? capsule : linkGeo, mat)
        o.quaternion.setFromRotationMatrix(basis)
        o.position.copy(f.c).addScaledVector(f.side, x)
        o.scale.set(w, pitch * 0.92, th)
        if (round) o.scale.set(w, pitch * 0.9, th * 1.1)
        g.add(o)
      }
      if (s.bracelet === 'oyster') {
        piece(0, W * 0.38, mt.centre === mt.case ? mt.brushed : mt.centre, false, 0.0036)
        for (const sx of [-1, 1]) piece(sx * W * 0.33, W * 0.28, mt.brushed, false, 0.0032)
      } else if (s.bracelet === 'jubilee') {
        for (const sx of [-1, 1]) piece(sx * W * 0.38, W * 0.24, mt.brushed)
        const off = i % 2 ? 0.25 : 0
        for (const x of [-0.17, 0, 0.17]) piece((x + off * 0.02) * W, W * 0.12, mt.centre, false, 0.0037)
      } else {
        for (const x of [-0.33, 0, 0.33]) piece(x * W, W * 0.3, mt.case, true, 0.0034)
      }
    }
    // The clasp at the back, its crown-cover polished.
    const f = frame(0.5)
    const cl = new Mesh(new BoxGeometry(width(0.5) * 0.95, 0.03, 0.0045), mt.brushed)
    cl.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(f.side, f.tan, f.nrm))
    cl.position.copy(f.c)
    g.add(cl)
    const cv = new Mesh(new BoxGeometry(width(0.5) * 0.55, 0.012, 0.0012), mt.case)
    cv.quaternion.copy(cl.quaternion)
    cv.position.copy(f.c).addScaledVector(f.nrm, -0.0028)
    g.add(cv)
  }
  // The cushion the watch is fastened round: an oval of suede.
  if (cushion) {
    // A pillow: an oval drum with softly rounded edges, its axis across the watch (x), filling
    // the bracelet's loop so the links lie on it.
    const hw = 0.0135
    const e = 0.09
    const prof: Vector2[] = [new Vector2(0, -hw)]
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * (PI / 2)
      prof.push(new Vector2(1 - e + e * Math.sin(a), -hw + 0.0028 - 0.0028 * Math.cos(a)))
    }
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * (PI / 2)
      prof.push(new Vector2(1 - e + e * Math.cos(a), hw - 0.0028 + 0.0028 * Math.sin(a)))
    }
    prof.push(new Vector2(0, hw))
    const geo = new LatheGeometry(prof, 48)
    geo.rotateZ(PI / 2)
    const cu = add(g, geo, cushion, 0, 0, cz)
    cu.scale.set(1, ry - 0.0021, rz - 0.0021)
  }
  g.userData.base = -ry - 0.004
  return g
}
