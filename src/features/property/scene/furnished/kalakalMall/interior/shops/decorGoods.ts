import { BoxGeometry, CanvasTexture, CylinderGeometry, DoubleSide, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SphereGeometry, SRGBColorSpace, TorusGeometry, TorusKnotGeometry, Vector2, type Material, type Object3D } from 'three'
import { rng, type Paint } from '../../../textures'
import type { FloorCtx } from '../shell'
import { stoneMaterial } from '../stone'
import { mesh, PI } from './kit'

/*
 * The décor house's finishes and its goods. The room, from the reference: wide light-oak boards,
 * walnut slats, a deep green feature wall with brass lettering, a charcoal ceiling, black steel
 * shelving, white lacquer display tables. The goods, each made to its catalogue size: ceramic and
 * glass vases on lathe profiles (fluted, ribbed, lidded), brass and mercury-glass pieces, table
 * lamps with linen shades, lanterns and candlesticks, flowers, pampas, sculptures, a clock,
 * framed prints, cushions and boxes.
 */

/* ---------- painters ---------- */

/** Wide oak boards in random lengths: warm, light, with grain and the odd knot. */
const oak: Paint = (g, w, h) => {
  const r = rng(6101)
  const rows = 8
  const bh = h / rows
  for (let j = 0; j < rows; j++) {
    let x = -r() * w * 0.5
    while (x < w) {
      const len = w * (0.35 + r() * 0.45)
      const tone = 196 + Math.floor(r() * 22)
      g.fillStyle = `rgb(${tone},${Math.floor(tone * 0.8)},${Math.floor(tone * 0.58)})`
      g.fillRect(x, j * bh, len, bh)
      for (let k = 0; k < 26; k++) {
        g.strokeStyle = `rgba(${r() < 0.5 ? '120,80,45' : '235,205,165'},${0.12 + r() * 0.18})`
        g.lineWidth = 0.6 + r() * 1.4
        const y = j * bh + r() * bh
        g.beginPath()
        g.moveTo(x, y)
        g.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 6, x + len * 0.7, y + (r() - 0.5) * 6, x + len, y + (r() - 0.5) * 4)
        g.stroke()
      }
      if (r() < 0.25) {
        g.fillStyle = 'rgba(110,70,40,.35)'
        g.beginPath()
        g.ellipse(x + r() * len, j * bh + bh / 2, 6, 3, 0, 0, 7)
        g.fill()
      }
      g.fillStyle = 'rgba(90,60,35,.5)'
      g.fillRect(x, j * bh, 1.5, bh)
      x += len
    }
    g.fillStyle = 'rgba(90,60,35,.45)'
    g.fillRect(0, j * bh, w, 1.4)
  }
}

/** Walnut, straight-grained. */
const walnut: Paint = (g, w, h) => {
  const r = rng(6102)
  g.fillStyle = '#6a4630'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 220; i++) {
    g.strokeStyle = `rgba(${r() < 0.5 ? '40,24,14' : '150,105,72'},${0.12 + r() * 0.25})`
    g.lineWidth = 0.6 + r() * 2
    const x = r() * w
    g.beginPath()
    g.moveTo(x, 0)
    g.bezierCurveTo(x + (r() - 0.5) * 20, h * 0.3, x + (r() - 0.5) * 20, h * 0.7, x + (r() - 0.5) * 10, h)
    g.stroke()
  }
}

/** A trowelled plaster in a colour. */
const plaster = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = `rgb(${base.join(',')})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 260; i++) {
    const x = r() * w
    const y = r() * h
    const s = w * (0.04 + r() * 0.1)
    const gr = g.createRadialGradient(x, y, 0, x, y, s)
    const d = r() < 0.5 ? 9 : -9
    gr.addColorStop(0, `rgba(${base.map((c) => Math.max(0, Math.min(255, c + d))).join(',')},.4)`)
    gr.addColorStop(1, `rgba(${base.join(',')},0)`)
    g.fillStyle = gr
    g.fillRect(x - s, y - s, 2 * s, 2 * s)
  }
}

/** Speckled stoneware glaze. */
const speckle = (base: string): Paint => (g, w, h) => {
  const r = rng(6103 + base.length)
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(70,55,40,${0.15 + r() * 0.4})`
    const s = 0.6 + r() * 1.6
    g.fillRect(r() * w, r() * h, s, s)
  }
}

/** Hammered metal relief: overlapping shallow dimples. */
const hammered: Paint = (g, w, h) => {
  const r = rng(6104)
  g.fillStyle = '#808080'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 700; i++) {
    const x = r() * w
    const y = r() * h
    const s = 5 + r() * 9
    const gr = g.createRadialGradient(x, y, 0, x, y, s)
    gr.addColorStop(0, 'rgba(0,0,0,.35)')
    gr.addColorStop(0.7, 'rgba(255,255,255,.12)')
    gr.addColorStop(1, 'rgba(128,128,128,0)')
    g.fillStyle = gr
    g.fillRect(x - s, y - s, 2 * s, 2 * s)
  }
}

/** A cushion's woven damask: gold leaves on a ground. */
const damask = (ground: string, ink: string): Paint => (g, w, h) => {
  g.fillStyle = ground
  g.fillRect(0, 0, w, h)
  g.strokeStyle = ink
  g.fillStyle = ink
  g.lineWidth = w / 120
  const n = 4
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const cx = ((i + 0.5) * w) / n + (j % 2) * (w / n / 2)
      const cy = ((j + 0.5) * h) / n
      const s = w / n / 2.4
      g.globalAlpha = 0.85
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * PI * 2
        g.beginPath()
        g.ellipse(cx + Math.cos(a) * s * 0.5, cy + Math.sin(a) * s * 0.5, s * 0.5, s * 0.16, a, 0, 7)
        g.stroke()
      }
      g.beginPath()
      g.arc(cx, cy, s * 0.12, 0, 7)
      g.fill()
    }
  g.globalAlpha = 1
}

/** A leaf for the arrangements: a pointed oval with its midrib, on transparent ground. */
const leaf: Paint = (g, w, h) => {
  g.clearRect(0, 0, w, h)
  const gr = g.createLinearGradient(0, 0, w, 0)
  gr.addColorStop(0, '#2f5a2c')
  gr.addColorStop(0.5, '#4f7d3f')
  gr.addColorStop(1, '#2c5228')
  g.fillStyle = gr
  g.beginPath()
  g.moveTo(w / 2, h * 0.02)
  g.bezierCurveTo(w * 0.98, h * 0.3, w * 0.9, h * 0.75, w / 2, h * 0.98)
  g.bezierCurveTo(w * 0.1, h * 0.75, w * 0.02, h * 0.3, w / 2, h * 0.02)
  g.fill()
  g.strokeStyle = 'rgba(200,230,170,.5)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(w / 2, h * 0.04)
  g.lineTo(w / 2, h * 0.96)
  g.stroke()
}

/** Abstract prints for the frames: washes of colour, a horizon, gold leaf. */
const print = (seed: number, tones: string[]): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = tones[0]
  g.fillRect(0, 0, w, h)
  g.filter = 'blur(12px)'
  for (let i = 0; i < 9; i++) {
    g.fillStyle = tones[1 + (i % (tones.length - 1))]
    g.globalAlpha = 0.5
    g.beginPath()
    g.ellipse(r() * w, h * (0.3 + r() * 0.6), w * (0.2 + r() * 0.3), h * (0.05 + r() * 0.12), (r() - 0.5) * 0.4, 0, 7)
    g.fill()
  }
  g.filter = 'none'
  g.globalAlpha = 0.85
  g.fillStyle = '#c9a463'
  for (let i = 0; i < 3; i++) g.fillRect(r() * w * 0.8, r() * h * 0.8, w * 0.12, 2)
  g.globalAlpha = 1
}

/* ---------- materials ---------- */

export function decorMaterials(e: FloorCtx) {
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
  const hammerBump = tex(256, 256, hammered, 0.12)
  return {
    /* the room */
    oak: std({ map: tex(1024, 1024, oak, 1.8), roughness: 0.42 }, 0.35),
    walnut: std({ map: tex(512, 1024, walnut, 0.6, 1.2), roughness: 0.45 }, 0.3),
    green: std({ map: tex(1024, 1024, plaster([33, 66, 56], 6111), 1.6), roughness: 0.82 }, 0.06),
    charcoal: std({ color: '#2c2b29', roughness: 0.9 }, 0.04),
    warmWall: std({ map: tex(1024, 1024, plaster([226, 216, 200], 6112), 1.8), roughness: 0.88 }, 0.05),
    blackSteel: std({ color: '#171716', metalness: 0.65, roughness: 0.42 }, 0.5),
    whiteLacquer: std({ color: '#f1ede6', roughness: 0.26 }, 0.5),
    shelfWhite: std({ color: '#f5f2ec', roughness: 0.35 }, 0.3),
    shelfGlass: phys({ color: '#e7efec', roughness: 0.02, transparent: true, opacity: 0.3, depthWrite: false }, 1.2),
    nero: stoneMaterial(k, 'marquina', env, { roughness: 0.12, reflect: 0.9, repeat: 1.2 }),
    statuario: lux.statuario,
    brass: std({ color: '#c9a35f', metalness: 1, roughness: 0.26 }, 1.1),
    brassDark: std({ color: '#9c7a3e', metalness: 1, roughness: 0.34 }, 1.0),
    /* ceramics and glass */
    glossWhite: phys({ color: '#f6f3ee', roughness: 0.12, clearcoat: 0.8 }, 0.8),
    stoneware: std({ map: tex(256, 256, speckle('#ebe4d8'), 0.15), roughness: 0.78 }, 0.15),
    sand: std({ map: tex(256, 256, speckle('#cdb89a'), 0.15), roughness: 0.8 }, 0.12),
    blackGlaze: phys({ color: '#141414', roughness: 0.15, clearcoat: 1 }, 0.9),
    celadon: phys({ color: '#a8bfa6', roughness: 0.2, clearcoat: 0.7 }, 0.7),
    navyGlaze: phys({ color: '#1e2a45', roughness: 0.16, clearcoat: 0.9 }, 0.8),
    terracotta: std({ color: '#b46a45', roughness: 0.85 }, 0.08),
    hammeredBrass: std({ color: '#c8a05a', metalness: 1, roughness: 0.3, bumpMap: hammerBump, bumpScale: 1.4 }, 1.1),
    mercury: std({ color: '#c8c1b0', metalness: 1, roughness: 0.24, bumpMap: hammerBump, bumpScale: 0.6 }, 1.2),
    blackGold: std({ color: '#1a1714', metalness: 0.5, roughness: 0.3 }, 0.7),
    smoke: phys({ color: '#6d6a66', roughness: 0.04, transparent: true, opacity: 0.45, depthWrite: false }, 1.3),
    clearGlass: phys({ color: '#f2f6f5', roughness: 0.02, transparent: true, opacity: 0.18, depthWrite: false, side: DoubleSide }, 1.4),
    amberGlass: phys({ color: '#d08a3c', emissive: '#ff9a3c', emissiveIntensity: 0.5, roughness: 0.1, transparent: true, opacity: 0.85 }, 0.9),
    marbleWhite: lux.statuario,
    /* soft things */
    linen: phys({ color: '#ece4d6', roughness: 0.9, sheen: 0.6, sheenColor: '#ffffff' }, 0.05),
    shade: std({ color: '#f4ecdc', emissive: '#ffe2b0', emissiveIntensity: 0.9, roughness: 0.9, side: DoubleSide }, 0.05),
    velvetGreen: phys({ map: canvas(512, 512, damask('#1f4a3a', '#c9a35f')), roughness: 0.8, sheen: 1, sheenRoughness: 0.4, sheenColor: '#9ad3b5' }, 0.08),
    velvetNavy: phys({ color: '#1d2742', roughness: 0.85, sheen: 1, sheenRoughness: 0.4, sheenColor: '#7f93c9' }, 0.06),
    goldSatin: phys({ color: '#c8a15c', roughness: 0.45, sheen: 1, sheenRoughness: 0.3, sheenColor: '#fff0c8' }, 0.5),
    cream: phys({ color: '#efe7da', roughness: 0.92, sheen: 0.5, sheenColor: '#ffffff' }, 0.05),
    wax: phys({ color: '#f5efe4', roughness: 0.5, transmission: 0, sheen: 0.3 }, 0.2),
    flame: std({ color: '#ffd38a', emissive: '#ffb347', emissiveIntensity: 2.2 }, 0),
    petal: phys({ color: '#f7f3ea', roughness: 0.7, sheen: 0.8, sheenColor: '#ffffff', side: DoubleSide }, 0.06),
    floret: std({ map: canvas(128, 128, (c, w, h) => {
      c.clearRect(0, 0, w, h)
      for (let k = 0; k < 4; k++) {
        c.save()
        c.translate(w / 2, h / 2)
        c.rotate((k / 4) * PI * 2 + 0.3)
        const gr = c.createLinearGradient(0, 0, 0, -h * 0.46)
        gr.addColorStop(0, '#e9e4d2')
        gr.addColorStop(0.4, '#fbf8f0')
        gr.addColorStop(1, '#f3efe4')
        c.fillStyle = gr
        c.beginPath()
        c.ellipse(0, -h * 0.24, w * 0.17, h * 0.23, 0, 0, 7)
        c.fill()
        c.restore()
      }
      c.fillStyle = '#cfd6a8'
      c.beginPath()
      c.arc(w / 2, h / 2, w * 0.05, 0, 7)
      c.fill()
    }), alphaTest: 0.45, side: DoubleSide, roughness: 0.75, emissive: '#ffffff', emissiveIntensity: 0.06 }, 0.05),
    leaf: std({ map: canvas(128, 256, leaf), alphaTest: 0.4, side: DoubleSide, roughness: 0.6 }, 0.1),
    pampas: phys({ color: '#e3d2b4', roughness: 0.95, sheen: 1, sheenRoughness: 0.7, sheenColor: '#fff4dc' }, 0.03),
    stem: std({ color: '#4a5a32', roughness: 0.7 }, 0.05),
    soil: std({ color: '#3a2e26', roughness: 1 }, 0),
    mirror: std({ color: '#eef1f2', metalness: 1, roughness: 0.03 }, 1.6),
    clockFace: std({ map: canvas(512, 512, (g, w, h) => {
      g.fillStyle = '#f3ede2'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#2a241d'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.font = `400 ${w * 0.075}px "Cormorant Garamond", Georgia, serif`
      const nums = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']
      nums.forEach((n, i) => {
        const a = (i / 12) * PI * 2 - PI / 2
        g.fillText(n, w / 2 + Math.cos(a) * w * 0.38, h / 2 + Math.sin(a) * h * 0.38)
      })
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * PI * 2
        g.fillRect(w / 2 + Math.cos(a) * w * 0.455 - 1, h / 2 + Math.sin(a) * h * 0.455 - 1, i % 5 ? 2 : 4, i % 5 ? 2 : 4)
      }
    }), roughness: 0.5 }, 0.1),
    prints: [
      std({ map: canvas(512, 640, print(6201, ['#e9e1d3', '#a7b5a0', '#5f7a6c', '#d8c3a0'])), roughness: 0.9 }, 0.02),
      std({ map: canvas(512, 640, print(6202, ['#efe8dc', '#c9a27a', '#7a5a43', '#e6d4b8'])), roughness: 0.9 }, 0.02),
      std({ map: canvas(512, 640, print(6203, ['#e5e2db', '#9aa7b6', '#3f4c63', '#d9cfc0'])), roughness: 0.9 }, 0.02),
    ],
    canvas,
    std,
    lux,
  }
}

export type DecorMaterials = ReturnType<typeof decorMaterials>
type M = DecorMaterials

/* ---------- the goods: each stands on local y = 0 at its catalogue size ---------- */

function bx(p: Object3D, w: number, h: number, d: number, mat: Material, x: number, y: number, z: number, cast = true) {
  return mesh(p, new BoxGeometry(w, h, d), mat, x, y, z, cast)
}

function lathe(p: Object3D, pts: [number, number][], mat: Material, y = 0, seg = 48) {
  return mesh(p, new LatheGeometry(pts.map(([r, h]) => new Vector2(r, h)), seg), mat, 0, y, 0, true)
}

/** A smooth vase profile from (radius, height) control points, closed at the foot, open-lipped. */
function profile(ctrl: [number, number][], wall = 0.006) {
  const out: [number, number][] = [[0, 0]]
  const n = 40
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const f = t * (ctrl.length - 1)
    const j = Math.min(ctrl.length - 2, Math.floor(f))
    const k = f - j
    const s = k * k * (3 - 2 * k)
    out.push([ctrl[j][0] + (ctrl[j + 1][0] - ctrl[j][0]) * s, ctrl[j][1] + (ctrl[j + 1][1] - ctrl[j][1]) * k])
  }
  const top = out[out.length - 1]
  out.push([top[0] - wall, top[1]], [top[0] - wall, top[1] - 0.03])
  return out
}

export type VaseShape = 'amphora' | 'bottle' | 'ovoid' | 'cylinder' | 'bud' | 'urn' | 'moon' | 'gourd'
const SHAPES: Record<VaseShape, [number, number][]> = {
  amphora: [[0.05, 0], [0.11, 0.08], [0.14, 0.2], [0.11, 0.34], [0.06, 0.42], [0.065, 0.46]],
  bottle: [[0.045, 0], [0.09, 0.05], [0.1, 0.15], [0.07, 0.24], [0.025, 0.3], [0.022, 0.42], [0.03, 0.43]],
  ovoid: [[0.06, 0], [0.12, 0.08], [0.13, 0.17], [0.1, 0.27], [0.06, 0.31], [0.065, 0.32]],
  cylinder: [[0.07, 0], [0.072, 0.1], [0.072, 0.3], [0.07, 0.4], [0.072, 0.41]],
  bud: [[0.035, 0], [0.06, 0.04], [0.06, 0.09], [0.02, 0.15], [0.015, 0.22], [0.022, 0.23]],
  urn: [[0.06, 0], [0.05, 0.04], [0.13, 0.14], [0.15, 0.24], [0.12, 0.34], [0.1, 0.36], [0.11, 0.37]],
  moon: [[0.04, 0], [0.12, 0.06], [0.15, 0.16], [0.12, 0.26], [0.05, 0.31], [0.045, 0.34], [0.055, 0.35]],
  gourd: [[0.04, 0], [0.1, 0.06], [0.11, 0.12], [0.06, 0.2], [0.075, 0.26], [0.05, 0.32], [0.03, 0.36], [0.035, 0.37]],
}

/** A vase of a shape at a scale; `ribs` flutes it; `lid` crowns a ginger jar. */
export function vase(_m: M, p: Object3D, shape: VaseShape, mat: Material, scale = 1, ribs = 0, lid?: Material) {
  const g = new Group()
  p.add(g)
  const geo = new LatheGeometry(profile(SHAPES[shape].map(([r, h]) => [r * scale, h * scale]), 0.006 * scale).map(([r, h]) => new Vector2(r, h)), 64)
  if (ribs) {
    const pos = geo.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const a = Math.atan2(z, x)
      const k = 1 + 0.035 * Math.abs(Math.cos(a * ribs / 2))
      pos.setX(i, x * k)
      pos.setZ(i, z * k)
    }
    geo.computeVertexNormals()
  }
  const v = new Mesh(geo, mat)
  v.castShadow = true
  v.receiveShadow = true
  g.add(v)
  if (lid) {
    const top = SHAPES[shape][SHAPES[shape].length - 1]
    lathe(g, [[0, 0], [top[0] * scale * 1.25, 0], [top[0] * scale * 1.2, 0.03 * scale], [top[0] * scale * 0.6, 0.06 * scale], [0.012 * scale, 0.07 * scale], [0.02 * scale, 0.09 * scale], [0, 0.1 * scale]], lid, top[1] * scale - 0.01)
  }
  g.userData.h = SHAPES[shape][SHAPES[shape].length - 1][1] * scale
  return g
}

/** A table lamp: a base (ceramic gourd or brass column), a brass stem and harp, a linen drum shade. */
export function tableLamp(m: M, p: Object3D, base: 'gourd' | 'column' | 'orb', baseMat: Material, shadeMat: Material, scale = 1) {
  const g = new Group()
  g.scale.setScalar(scale)
  p.add(g)
  if (base === 'gourd') vase(m, g, 'gourd', baseMat, 1.0)
  else if (base === 'orb') {
    lathe(g, [[0, 0], [0.07, 0], [0.07, 0.015], [0, 0.015]], m.brass)
    mesh(g, new SphereGeometry(0.11, 40, 24), baseMat, 0, 0.125, 0)
  } else lathe(g, [[0, 0], [0.09, 0], [0.09, 0.02], [0.035, 0.04], [0.03, 0.3], [0.045, 0.33], [0, 0.34]], baseMat)
  const top = base === 'gourd' ? 0.37 : base === 'orb' ? 0.235 : 0.34
  mesh(g, new CylinderGeometry(0.008, 0.008, 0.17, 12), m.brass, 0, top + 0.085, 0)
  mesh(g, new CylinderGeometry(0.018, 0.018, 0.035, 16), m.brass, 0, top + 0.17, 0)
  const shade = mesh(g, new CylinderGeometry(0.15, 0.2, 0.26, 48, 1, true), shadeMat, 0, top + 0.27, 0, false)
  shade.name = 'shade'
  mesh(g, new TorusGeometry(0.2, 0.003, 4, 48), m.brass, 0, top + 0.14, 0, false).rotation.x = PI / 2
  mesh(g, new TorusGeometry(0.15, 0.003, 4, 48), m.brass, 0, top + 0.4, 0, false).rotation.x = PI / 2
  g.userData.h = top + 0.4
  return g
}

/** A brass lantern: square frame, glass sides, a pillar candle within, a ring handle. */
export function lantern(m: M, p: Object3D, h: number, w: number, frame: Material) {
  const g = new Group()
  p.add(g)
  const t = 0.012
  const box = (bw: number, bh: number, bd: number, mat: Material, x: number, y: number, z: number) => bx(g, bw, bh, bd, mat, x, y, z)
  box(w, 0.03, w, frame, 0, 0.015, 0)
  box(w * 1.04, 0.03, w * 1.04, frame, 0, h * 0.82, 0)
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(t, h * 0.8, t, frame, (sx * (w - t)) / 2, h * 0.41, (sz * (w - t)) / 2)
  for (const [x, z, ry] of [[0, w / 2 - 0.004, 0], [0, -w / 2 + 0.004, 0], [w / 2 - 0.004, 0, PI / 2], [-w / 2 + 0.004, 0, PI / 2]] as const) {
    const pane = mesh(g, new PlaneGeometry(w - 2 * t, h * 0.78), m.clearGlass, x, h * 0.42, z, false)
    pane.rotation.y = ry
  }
  lathe(g, [[0, 0], [w * 0.5, 0], [w * 0.15, h * 0.12], [0.012, h * 0.16], [0, h * 0.17]], frame, h * 0.83, 4).rotation.y = PI / 4
  mesh(g, new TorusGeometry(0.03, 0.004, 6, 20), frame, 0, h + 0.03, 0)
  mesh(g, new CylinderGeometry(w * 0.22, w * 0.22, h * 0.32, 24), m.wax, 0, 0.03 + h * 0.16, 0)
  const fl = mesh(g, new SphereGeometry(0.008, 10, 8), m.flame, 0, 0.04 + h * 0.32, 0, false)
  fl.scale.y = 2.2
  g.userData.h = h
  return g
}

/** A brass candlestick with its taper. */
export function candlestick(m: M, p: Object3D, h: number) {
  const g = new Group()
  p.add(g)
  lathe(g, [[0, 0], [0.055, 0], [0.055, 0.01], [0.03, 0.025], [0.012, 0.05], [0.016, h * 0.4], [0.01, h * 0.45], [0.012, h - 0.02], [0.025, h - 0.01], [0.022, h], [0, h]], m.brass, 0, 32)
  mesh(g, new CylinderGeometry(0.01, 0.011, 0.22, 16), m.wax, 0, h + 0.11, 0)
  const fl = mesh(g, new SphereGeometry(0.006, 10, 8), m.flame, 0, h + 0.232, 0, false)
  fl.scale.y = 2.2
  g.userData.h = h + 0.24
  return g
}

/** An arrangement of white blooms with leaves, standing `h` above the vase's mouth, `r` across. */
export function blooms(m: M, p: Object3D, y0: number, h: number, r: number, seed: number) {
  const g = new Group()
  g.position.y = y0
  p.add(g)
  const rr = rng(seed)
  // Each head a ball of four-petalled florets, as a hydrangea's: small petal cards facing out.
  const floret = new PlaneGeometry(1, 1)
  const n = Math.round(10 + r * 50)
  for (let i = 0; i < n; i++) {
    const a = rr() * PI * 2
    const d = Math.sqrt(rr()) * r
    const yy = h * (0.45 + 0.55 * (1 - (d / r) ** 2)) + (rr() - 0.5) * 0.04
    const s = 0.045 + rr() * 0.03
    const hd = new Group()
    hd.position.set(Math.cos(a) * d, yy, Math.sin(a) * d)
    g.add(hd)
    const core = mesh(hd, new SphereGeometry(s * 0.82, 12, 8), m.stem, 0, 0, 0, false)
    core.scale.y = 0.85
    const count = 34
    for (let f = 0; f < count; f++) {
      // Fibonacci-spread over the upper three-quarters of the ball.
      const t = (f + 0.5) / count
      const phi = Math.acos(1 - 1.6 * t)
      const th = f * 2.399963
      const dir = { x: Math.sin(phi) * Math.cos(th), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(th) }
      const fl = mesh(hd, floret, m.floret, dir.x * s, dir.y * s * 0.85, dir.z * s, false)
      fl.scale.setScalar(s * (0.75 + rr() * 0.3))
      fl.lookAt(fl.position.x * 4, fl.position.y * 4, fl.position.z * 4)
      fl.rotateZ(rr() * PI)
    }
    mesh(g, new CylinderGeometry(0.003, 0.003, yy, 4), m.stem, Math.cos(a) * d * 0.5, yy / 2, Math.sin(a) * d * 0.5, false).rotation.set(Math.sin(a) * (d / yy) * 0.9, 0, -Math.cos(a) * (d / yy) * 0.9)
  }
  for (let i = 0; i < n * 1.4; i++) {
    const a = rr() * PI * 2
    const d = (0.4 + rr() * 0.7) * r
    const l = mesh(g, new PlaneGeometry(0.06, 0.12), m.leaf, Math.cos(a) * d, h * (0.3 + rr() * 0.5), Math.sin(a) * d, false)
    l.rotation.set(-0.6 - rr() * 0.6, -a + PI / 2, (rr() - 0.5) * 0.6)
  }
  return g
}

/** Pampas plumes in a tall vase's mouth: feathery heads on fine stems, fanning out. */
export function pampas(m: M, p: Object3D, y0: number, h: number, n: number, seed: number) {
  n = Math.round(n * 1.6)
  const g = new Group()
  g.position.y = y0
  p.add(g)
  const rr = rng(seed)
  for (let i = 0; i < n; i++) {
    const a = rr() * PI * 2
    const lean = 0.12 + rr() * 0.3
    const len = h * (0.75 + rr() * 0.3)
    const stem = new Group()
    stem.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean)
    g.add(stem)
    mesh(stem, new CylinderGeometry(0.003, 0.004, len, 5), m.pampas, 0, len / 2, 0, false)
    // The plume: a soft spindle, fuller below its tip, with a few loose wisps.
    const ph = 0.22 + rr() * 0.08
    const plume = mesh(stem, new LatheGeometry([[0, 0], [0.012, 0.03], [0.02, ph * 0.35], [0.018, ph * 0.65], [0.009, ph * 0.9], [0, ph]].map(([r, y]) => new Vector2(r, y)), 10), m.pampas, 0, len - 0.02, 0)
    plume.rotation.z = (rr() - 0.5) * 0.25
    for (let w = 0; w < 3; w++) {
      const wisp = mesh(stem, new CylinderGeometry(0.0015, 0.004, ph * 0.5, 4), m.pampas, (rr() - 0.5) * 0.03, len + ph * (0.3 + rr() * 0.4), (rr() - 0.5) * 0.03, false)
      wisp.rotation.set((rr() - 0.5) * 0.9, 0, (rr() - 0.5) * 0.9)
    }
  }
  return g
}

/** A sculpture: an endless ribbon in matte white stoneware on a black plinth. */
export function ribbonSculpture(m: M, p: Object3D) {
  const g = new Group()
  p.add(g)
  lathe(g, [[0, 0], [0.07, 0], [0.07, 0.04], [0, 0.04]], m.blackGlaze, 0, 4).rotation.y = PI / 4
  const k = mesh(g, new TorusKnotGeometry(0.075, 0.018, 160, 20, 2, 3), m.stoneware, 0, 0.15, 0)
  k.rotation.x = 0.3
  g.userData.h = 0.25
  return g
}

/** A sculpture: two interlocked brass rings on a marble base. */
export function ringsSculpture(m: M, p: Object3D) {
  const g = new Group()
  p.add(g)
  mesh(g, new CylinderGeometry(0.08, 0.08, 0.035, 48), m.marbleWhite, 0, 0.0175, 0)
  const a = mesh(g, new TorusGeometry(0.1, 0.009, 16, 80), m.brass, -0.035, 0.14, 0)
  a.rotation.y = 0.5
  const b = mesh(g, new TorusGeometry(0.1, 0.009, 16, 80), m.brass, 0.035, 0.14, 0)
  b.rotation.y = -0.6
  b.rotation.x = 0.4
  g.userData.h = 0.25
  return g
}

/** A sculpture: an orb of black marble on a brass stand. */
export function orb(m: M, p: Object3D, r: number) {
  const g = new Group()
  p.add(g)
  lathe(g, [[0, 0], [r * 0.6, 0], [r * 0.6, 0.01], [r * 0.25, r * 0.35], [r * 0.45, r * 0.5], [0, r * 0.5]], m.brass, 0, 32)
  mesh(g, new SphereGeometry(r, 48, 32), m.nero, 0, r * 0.5 + r * 0.92, 0)
  g.userData.h = r * 2.5
  return g
}

/** A footed bowl in brass or stone. */
export function bowl(_m: M, p: Object3D, r: number, mat: Material, foot = true) {
  const g = new Group()
  p.add(g)
  const pts: [number, number][] = foot
    ? [[0, 0], [r * 0.35, 0], [r * 0.35, 0.012], [r * 0.25, 0.04], [r * 0.6, r * 0.42], [r, r * 0.62], [r - 0.004, r * 0.64], [r * 0.58, r * 0.46], [0, r * 0.4]]
    : [[0, 0], [r * 0.5, 0], [r, r * 0.4], [r - 0.004, r * 0.42], [r * 0.48, 0.006], [0, 0.006]]
  lathe(g, pts, mat)
  g.userData.h = foot ? r * 0.64 : r * 0.42
  return g
}

/** A round wall clock: brass bezel, roman dial, hands set to the hour it was hung. */
export function clock(m: M, p: Object3D, r: number) {
  const g = new Group()
  p.add(g)
  mesh(g, new CylinderGeometry(r, r, 0.04, 64), m.brass, 0, 0, 0).rotation.x = PI / 2
  const face = mesh(g, new CylinderGeometry(r * 0.9, r * 0.9, 0.002, 64), m.clockFace, 0, 0, 0.021)
  face.rotation.x = PI / 2
  face.rotation.y = PI
  const now = new Date()
  const hands = new Group()
  hands.name = 'hands'
  hands.position.z = 0.026
  g.add(hands)
  const hand = (len: number, w: number, a: number) => {
    const h = new Group()
    h.rotation.z = -a
    hands.add(h)
    mesh(h, new CylinderGeometry(w, w * 0.6, len, 6), m.blackGlaze, 0, len / 2 - 0.02, 0, false)
    return h
  }
  hand(r * 0.5, 0.006, ((now.getHours() % 12) + now.getMinutes() / 60) * (PI / 6))
  hand(r * 0.75, 0.004, now.getMinutes() * (PI / 30))
  mesh(hands, new SphereGeometry(0.01, 12, 8), m.brass, 0, 0, 0.003, false)
  mesh(g, new TorusGeometry(r * 0.9, 0.006, 8, 64), m.brass, 0, 0, 0.022, false)
  return g
}

/** A photo frame: brass moulding round a print, an easel back. */
export function frame(m: M, p: Object3D, w: number, h: number, art: Material, standing = true) {
  const g = new Group()
  p.add(g)
  const t = 0.018
  const body = new Group()
  body.position.y = standing ? h / 2 + 0.005 : 0
  body.rotation.x = standing ? -0.12 : 0
  g.add(body)
  for (const [bw, bh, x, y] of [[w, t, 0, (h - t) / 2], [w, t, 0, -(h - t) / 2], [t, h, -(w - t) / 2, 0], [t, h, (w - t) / 2, 0]] as const) bx(body, bw, bh, 0.016, m.brass, x, y, 0)
  mesh(body, new PlaneGeometry(w - 2 * t, h - 2 * t), art, 0, 0, 0.004, false)
  mesh(body, new PlaneGeometry(w - 0.01, h - 0.01), m.blackGlaze, 0, 0, -0.006, false).rotation.y = PI
  g.userData.h = h
  return g
}

/** A cushion: a plump square, pinched at its corners, with a piped edge. */
export function cushion(_m: M, p: Object3D, w: number, mat: Material) {
  const g = new Group()
  p.add(g)
  const geo = new SphereGeometry(1, 40, 24)
  const pos = geo.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    // Square it off in x–y, keep the z plump: a superellipsoid.
    const sx = Math.sign(x) * Math.abs(x) ** 0.45
    const sy = Math.sign(y) * Math.abs(y) ** 0.45
    const puff = 1 - 0.55 * Math.max(Math.abs(sx), Math.abs(sy)) ** 4
    pos.setXYZ(i, (sx * w) / 2, (sy * w) / 2, z * 0.075 * puff)
  }
  geo.computeVertexNormals()
  const c = new Mesh(geo, mat)
  c.castShadow = true
  c.position.y = w / 2
  g.add(c)
  g.userData.h = w
  return g
}

/** A lidded box: woven, leather or lacquer. */
export function lidBox(m: M, p: Object3D, w: number, d: number, h: number, body: Material, lid: Material) {
  const g = new Group()
  p.add(g)
  bx(g, w, h * 0.84, d, body, 0, h * 0.42, 0)
  bx(g, w + 0.01, h * 0.2, d + 0.01, lid, 0, h * 0.9, 0)
  mesh(g, new SphereGeometry(0.012, 12, 8), m.brass, 0, h + 0.008, 0, false)
  g.userData.h = h
  return g
}

/** A potted plant: a pot and a spray of leaf cards. */
export function pottedPlant(m: M, p: Object3D, pot: Material, r: number, h: number, seed: number) {
  const g = new Group()
  p.add(g)
  lathe(g, [[0, 0], [r * 0.75, 0], [r, h * 0.85], [r * 1.04, h], [r * 0.94, h], [0, h * 0.9]], pot)
  mesh(g, new CylinderGeometry(r * 0.92, r * 0.92, 0.01, 24), m.soil, 0, h * 0.92, 0, false)
  const rr = rng(seed)
  for (let i = 0; i < 26; i++) {
    const a = rr() * PI * 2
    const lean = 0.3 + rr() * 0.8
    const stem = new Group()
    stem.position.y = h * 0.92
    stem.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean)
    g.add(stem)
    const l = 0.12 + rr() * 0.16
    mesh(stem, new CylinderGeometry(0.002, 0.003, l, 4), m.stem, 0, l / 2, 0, false)
    const lf = mesh(stem, new PlaneGeometry(0.07, 0.15), m.leaf, 0, l + 0.06, 0, false)
    lf.rotation.y = rr() * PI
  }
  g.userData.h = h + 0.3
  return g
}
