import { CanvasTexture, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, type Material, type Texture } from 'three'
import type { Kit } from '../../kit'
import type { Lighting } from '../../shared'
import { rng, type Paint } from '../../textures'
import { herringboneMaterial, stoneMaterial } from './stone'

/*
 * The mall's luxury palette: the stones, the woods, the metals and the upholstery its public
 * spaces are finished in, and each floor's scheme, so that every floor speaks the same language
 * (warm ivory stone, champagne and bronze metal, dark walnut) in its own accent:
 *
 *   G   arrival: Calacatta Oro, Nero Marquina borders, a coffered ceiling, polished brass
 *   1   Statuario, Emperador borders, brass-edged light slots in the ceiling
 *   2   cream limestone, charcoal borders, oak fins under the ceiling, bronze
 *   3   charcoal Grigio, black borders, a black ceiling drawn with light (the gaming floor)
 *   4   Calacatta Viola, walnut herringbone in the dining hall, a slatted walnut ceiling
 */

export type CeilingStyle = 'coffer' | 'slots' | 'fins' | 'neon' | 'slats'

export interface Scheme {
  field: Material
  border: Material
  /** The metal of the inlay lines, trims and fittings. */
  metal: Material
  /** The stone of feature walls and pilasters. */
  wall: Material
  ceiling: CeilingStyle
}

/** Upholstery weaves and leather grain, painted at true scale. */
const weave = (base: string, fleck: string, seed: number, fine = 1): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 9000 * fine; i++) {
    g.fillStyle = fleck
    g.globalAlpha = 0.05 + r() * 0.12
    g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5)
  }
  g.globalAlpha = 1
}

const grain: Paint = (g, w, h) => {
  const r = rng(5)
  g.fillStyle = '#808080'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'
    g.beginPath()
    g.arc(r() * w, r() * h, 1 + r() * 3, 0, 7)
    g.fill()
  }
}

/** Long-grain timber, 2 m a repeat along the board. */
const timber = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 260; i++) {
    const t = r()
    g.strokeStyle = t < 0.5 ? `rgba(${cr * 0.55},${cg * 0.55},${cb * 0.55},${0.12 + r() * 0.2})` : `rgba(255,235,210,${0.04 + r() * 0.06})`
    g.lineWidth = 0.6 + r() * 2.4
    const y = r() * h
    g.beginPath()
    g.moveTo(0, y)
    for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 90 + i) * 5 + (r() - 0.5) * 2)
    g.stroke()
  }
}

/** Brushed metal: fine lines along one direction. */
const brushed: Paint = (g, w, h) => {
  const r = rng(9)
  g.fillStyle = '#c8c8c8'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.12)'
    g.fillRect(0, r() * h, w, 0.6 + r())
  }
}

/** Leaves, fronds and pebbles for the planting, on one atlas with alpha (see plants.ts). */
export function leafAtlas(): Texture {
  const c = document.createElement('canvas')
  c.width = c.height = 1024
  const g = c.getContext('2d')!
  const r = rng(404)
  const cell = 512
  // Cell 0 (top left): a glossy ficus / olive leaf, drawn many times so each card is a little sprig.
  const leaf = (x: number, y: number, len: number, wid: number, a: number, light: number) => {
    g.save()
    g.translate(x, y)
    g.rotate(a)
    const grad = g.createLinearGradient(0, -wid, 0, wid)
    grad.addColorStop(0, `hsl(${100 + r() * 14},${38 + r() * 12}%,${18 + light}%)`)
    grad.addColorStop(0.5, `hsl(${96 + r() * 10},${42 + r() * 10}%,${28 + light}%)`)
    grad.addColorStop(1, `hsl(${104 + r() * 12},${36 + r() * 10}%,${16 + light}%)`)
    g.fillStyle = grad
    g.beginPath()
    g.moveTo(0, 0)
    g.bezierCurveTo(len * 0.3, -wid, len * 0.75, -wid * 0.8, len, 0)
    g.bezierCurveTo(len * 0.75, wid * 0.8, len * 0.3, wid, 0, 0)
    g.fill()
    g.strokeStyle = `rgba(210,230,170,${0.25 + r() * 0.2})`
    g.lineWidth = 1.2
    g.beginPath()
    g.moveTo(2, 0)
    g.lineTo(len * 0.95, 0)
    g.stroke()
    g.restore()
  }
  // A sprig: a twig with leaves along it.
  g.strokeStyle = '#5a4630'
  g.lineWidth = 4
  g.beginPath()
  g.moveTo(256, 500)
  g.quadraticCurveTo(240, 260, 262, 30)
  g.stroke()
  for (let i = 0; i < 22; i++) {
    const t = i / 22
    const y = 480 - t * 440
    const x = 256 + (t - 0.5) * -20
    const side = i % 2 ? 1 : -1
    leaf(x, y, 120 + r() * 60 - t * 40, 28 + r() * 10, -Math.PI / 2 + side * (0.55 + r() * 0.45), r() * 14)
  }
  // Cell 1 (top right): a palm frond's leaflets, for a strip whose u runs along the frond.
  g.save()
  g.translate(cell, 0)
  g.strokeStyle = '#7d8a4a'
  g.lineWidth = 6
  g.beginPath()
  g.moveTo(0, 256)
  g.lineTo(cell, 256)
  g.stroke()
  // Leaflets, narrow and spaced so the frond reads as a feather with light between the pinnae.
  for (let i = 0; i < 40; i++) {
    const x = 8 + i * 12.6
    const len = 200 * Math.sin(Math.PI * Math.min(1, (x / cell) * 1.15 + 0.08)) + 20
    for (const s of [-1, 1]) {
      g.strokeStyle = `hsl(${92 + r() * 16},${40 + r() * 15}%,${24 + r() * 12}%)`
      g.lineWidth = 3 + r() * 1.5
      g.beginPath()
      g.moveTo(x, 256)
      g.quadraticCurveTo(x + len * 0.35, 256 + s * len * 0.5, x + len * 0.55, 256 + s * len * 0.95)
      g.stroke()
    }
  }
  g.restore()
  // Cell 2 (bottom left): a monstera leaf, split and holed.
  g.save()
  g.translate(256, cell + 256)
  const mg = g.createRadialGradient(0, 0, 10, 0, 0, 240)
  mg.addColorStop(0, '#3f6e33')
  mg.addColorStop(1, '#1f4422')
  g.fillStyle = mg
  g.beginPath()
  g.moveTo(0, 240)
  g.bezierCurveTo(-260, 160, -250, -200, 0, -230)
  g.bezierCurveTo(250, -200, 260, 160, 0, 240)
  g.fill()
  g.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 7; i++) {
    for (const s of [-1, 1]) {
      const y = -170 + i * 52
      g.beginPath()
      g.moveTo(s * 40, y)
      g.lineTo(s * 260, y - 40 + i * 6)
      g.lineTo(s * 260, y - 10 + i * 6)
      g.lineTo(s * 60, y + 16)
      g.fill()
      g.beginPath()
      g.ellipse(s * 25, y + 20, 7, 16, 0, 0, 7)
      g.fill()
    }
  }
  g.globalCompositeOperation = 'source-over'
  g.strokeStyle = 'rgba(190,220,150,.55)'
  g.lineWidth = 4
  g.beginPath()
  g.moveTo(0, 240)
  g.lineTo(0, -225)
  g.stroke()
  g.restore()
  // Cell 3 (bottom right): white river pebbles on dark soil, the planters' top dressing.
  g.save()
  g.translate(cell, cell)
  g.fillStyle = '#2b241d'
  g.fillRect(0, 0, cell, cell)
  for (let i = 0; i < 520; i++) {
    const x = r() * cell
    const y = r() * cell
    const s = 6 + r() * 12
    const pg = g.createRadialGradient(x - s * 0.3, y - s * 0.3, 1, x, y, s)
    const t = 205 + r() * 40
    pg.addColorStop(0, `rgb(${t + 10},${t + 8},${t + 4})`)
    pg.addColorStop(1, `rgb(${t - 70},${t - 72},${t - 76})`)
    g.fillStyle = pg
    g.beginPath()
    g.ellipse(x, y, s, s * (0.6 + r() * 0.3), r() * 3, 0, 7)
    g.fill()
  }
  g.restore()
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

export function luxuryMaterials(k: Kit, lighting: Lighting, env: Texture) {
  const mark = <T extends Material>(m: T) => ((m.userData.interior = true), m)
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.6) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const tex = (w: number, h: number, paint: Paint, metres: number) => {
    const t = k.tex.painted(w, h, paint)
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1 / metres, 1 / metres)
    return t
  }
  const velvet = (colour: string, seed: number) =>
    mark(new MeshPhysicalMaterial({ color: colour, map: tex(256, 256, weave('#ffffff', '#000000', seed, 0.6), 0.3), roughness: 0.9, sheen: 1, sheenRoughness: 0.45, sheenColor: colour, envMap: env, envMapIntensity: 0.1 }))
  const leather = (colour: string) => {
    const m = std({ color: colour, roughness: 0.48, bumpMap: tex(256, 256, grain, 0.25), bumpScale: 0.6 }, 0.35)
    return m
  }
  const brushedMap = tex(256, 256, brushed, 0.5)
  const metal = (colour: string, roughness: number) => std({ color: colour, metalness: 1, roughness, roughnessMap: brushedMap }, 1.1)
  const leaves = leafAtlas()

  const s = {
    calacattaOro: stoneMaterial(k, 'calacattaOro', env),
    statuario: stoneMaterial(k, 'statuario', env),
    crema: stoneMaterial(k, 'crema', env, { roughness: 0.16 }),
    grigio: stoneMaterial(k, 'grigio', env, { roughness: 0.08 }),
    viola: stoneMaterial(k, 'viola', env),
    nero: stoneMaterial(k, 'nero', env, { size: 1024, repeat: 1.2 }),
    emperador: stoneMaterial(k, 'emperador', env, { size: 1024, repeat: 1.2 }),
    bianco: stoneMaterial(k, 'bianco', env, { size: 1024, repeat: 1.2, roughness: 0.12 }),
    /** Wall cladding: the same stones, a little less glossy than a floor. */
    wallOro: stoneMaterial(k, 'calacattaOro', env, { roughness: 0.14, reflect: 0.6 }),
    wallStatuario: stoneMaterial(k, 'statuario', env, { roughness: 0.14, reflect: 0.6 }),
    wallCrema: stoneMaterial(k, 'crema', env, { roughness: 0.25, reflect: 0.4 }),
    wallNero: stoneMaterial(k, 'nero', env, { size: 1024, repeat: 1.2, roughness: 0.12 }),
    wallViola: stoneMaterial(k, 'viola', env, { roughness: 0.14, reflect: 0.6 }),
    /** Honey onyx with light behind it. */
    onyx: lighting.glow(stoneMaterial(k, 'onyx', env, { size: 1024, repeat: 1.6, emissive: true, roughness: 0.1 }), 0.7),
  }
  // Brass, bronze and steel, brushed.
  const brass = metal('#c9a86a', 0.26)
  const bronze = metal('#6a5442', 0.34)
  const steel = metal('#cfd2d5', 0.22)
  const chrome = std({ color: '#e8eaec', metalness: 1, roughness: 0.06 }, 1.4)
  const walnut = std({ map: tex(512, 512, timber([92, 62, 42], 3), 2), roughness: 0.42 }, 0.4)
  // Book-matched walnut veneer for whole panels (doors, cubicles, cabinets): straight vertical grain
  // painted once to a panel, since box faces carry 0–1 UVs.
  const veneer: Paint = (g, w, h) => {
    const r = rng(17)
    g.fillStyle = '#4e3322'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 180; i++) {
      const x = r() * w
      g.strokeStyle = r() < 0.6 ? `rgba(30,18,10,${0.12 + r() * 0.2})` : `rgba(140,100,70,${0.06 + r() * 0.08})`
      g.lineWidth = 0.6 + r() * 2.2
      g.beginPath()
      g.moveTo(x, 0)
      for (let y = 0; y <= h; y += 64) g.lineTo(x + Math.sin(y / 220 + i) * 3, y)
      g.stroke()
    }
    // Mirrored about the middle, as a book-matched leaf is.
    g.save()
    g.translate(w, 0)
    g.scale(-1, 1)
    g.drawImage(g.canvas, 0, 0, w / 2, h, 0, 0, w / 2, h)
    g.restore()
  }
  const walnutPanel = std({ map: k.tex.painted(256, 1024, veneer), roughness: 0.38 }, 0.45)
  const oak = std({ map: tex(512, 512, timber([176, 138, 96], 4), 2), roughness: 0.5 }, 0.3)

  const schemes: Scheme[] = [
    { field: s.calacattaOro, border: s.nero, metal: brass, wall: s.wallOro, ceiling: 'coffer' },
    { field: s.statuario, border: s.emperador, metal: brass, wall: s.wallStatuario, ceiling: 'slots' },
    { field: s.crema, border: s.nero, metal: bronze, wall: s.wallCrema, ceiling: 'fins' },
    { field: s.grigio, border: s.nero, metal: brass, wall: s.wallNero, ceiling: 'neon' },
    { field: s.viola, border: s.nero, metal: brass, wall: s.wallViola, ceiling: 'slats' },
  ]

  return {
    ...s,
    schemes,
    herringbone: herringboneMaterial(k, env),
    brass,
    bronze,
    steel,
    chrome,
    walnut,
    walnutPanel,
    oak,
    blackSteel: std({ color: '#1c1c1e', metalness: 0.7, roughness: 0.35 }, 0.6),
    velvetEmerald: velvet('#1f4a42', 11),
    velvetOchre: velvet('#a77a3a', 12),
    velvetBlush: velvet('#c9a294', 13),
    velvetNavy: velvet('#22304a', 14),
    boucle: mark(new MeshPhysicalMaterial({ color: '#ece6db', map: tex(256, 256, weave('#ffffff', '#8a8072', 15, 2), 0.2), roughness: 0.95, sheen: 0.6, sheenColor: '#ffffff', envMap: env, envMapIntensity: 0.05 })),
    leatherCognac: leather('#8a4f2a'),
    leatherTaupe: leather('#8c7765'),
    leatherBlack: leather('#232020'),
    linen: std({ color: '#e9e3d8', map: tex(256, 256, weave('#ffffff', '#776d60', 16, 1.5), 0.15), roughness: 0.92 }, 0.05),
    /** Glass with real thickness reads: a clear pane, a faint green edge. */
    glassClear: mark(new MeshPhysicalMaterial({ color: '#e8f1ef', roughness: 0.02, transparent: true, opacity: 0.18, depthWrite: false, side: DoubleSide, envMap: env, envMapIntensity: 1.2 })),
    glassEdge: std({ color: '#7fa59b', roughness: 0.1 }, 0.6),
    opal: lighting.glow(std({ color: '#fff7ea', emissive: '#ffe8c4', emissiveIntensity: 1.1, roughness: 0.3 }, 0.2), 0.6),
    amberGlass: lighting.glow(mark(new MeshPhysicalMaterial({ color: '#d9963f', emissive: '#ffb45a', emissiveIntensity: 0.55, roughness: 0.05, transparent: true, opacity: 0.75, envMap: env, envMapIntensity: 1 })), 0.6),
    smokeGlass: mark(new MeshPhysicalMaterial({ color: '#5a5550', roughness: 0.05, transparent: true, opacity: 0.55, envMap: env, envMapIntensity: 1.2 })),
    crystal: lighting.glow(mark(new MeshPhysicalMaterial({ color: '#ffffff', emissive: '#fff3dd', emissiveIntensity: 0.6, roughness: 0.02, metalness: 0.1, envMap: env, envMapIntensity: 2 })), 0.5),
    led: lighting.glow(std({ color: '#fff4e0', emissive: '#ffe2b0', emissiveIntensity: 2.0, roughness: 0.5 }, 0.2), 0.7),
    ledCool: lighting.glow(std({ color: '#eef4ff', emissive: '#dfe8ff', emissiveIntensity: 1.6, roughness: 0.5 }, 0.2), 0.7),
    neonCyan: lighting.glow(std({ color: '#7ff0ff', emissive: '#2fe0ff', emissiveIntensity: 1.8, roughness: 0.5 }, 0.2), 1),
    neonMagenta: lighting.glow(std({ color: '#ff8fd0', emissive: '#ff3fa4', emissiveIntensity: 1.8, roughness: 0.5 }, 0.2), 1),
    plaster: std({ color: '#f1ece3', roughness: 0.9 }, 0.05),
    leaves: mark(new MeshStandardMaterial({ map: leaves, alphaTest: 0.45, side: DoubleSide, roughness: 0.55, envMap: env, envMapIntensity: 0.25 })),
    leafMap: leaves,
    bark: std({ color: '#6b5a45', roughness: 0.9, bumpMap: tex(128, 128, grain, 0.2), bumpScale: 1 }, 0.05),
    travertine: stoneMaterial(k, 'crema', env, { size: 1024, repeat: 1.2, roughness: 0.55, reflect: 0.2 }),
    porcelain: std({ color: '#fbfbf9', roughness: 0.12 }, 0.9),
    mirror: std({ color: '#e6eaec', metalness: 1, roughness: 0.02 }, 1.6),
    rubber: std({ color: '#141414', roughness: 0.55 }, 0.2),
  }
}

export type Lux = ReturnType<typeof luxuryMaterials>
