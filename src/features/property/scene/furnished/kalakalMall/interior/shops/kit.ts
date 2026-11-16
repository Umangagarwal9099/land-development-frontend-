import {
  BufferGeometry, CapsuleGeometry, CircleGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, LatheGeometry, Mesh, MeshPhysicalMaterial,
  MeshStandardMaterial, PointLight, RepeatWrapping, Shape, ShapeGeometry, SphereGeometry, TorusGeometry, Vector2, type Material, type Object3D,
} from 'three'
import { circuit, setCircuit, switchPlate, type Circuit } from '../../../kalakalD65/fixtures'
import { rng, type Paint } from '../../../textures'
import { metricBox, sheet } from '../../solids'
import { downlight } from '../architecture'
import { bx, type FloorCtx } from '../shell'
import { place } from '../signs'
import { stoneMaterial } from '../stone'
import type { Unit } from '../units'

/*
 * What the boutiques share: their finishes painted at true scale (the Dior Oblique carpet, the
 * cannage lattice, pleated and fluted fabric and timber), pleated geometry for curtains and the
 * Prada ceiling, the merchandise (handbags, sneakers, caps, scent bottles, garments on hangers,
 * abstract mannequins), lit shelving and vitrines with doors that open, swing doors on real
 * hinges, a till with its drawer, and each shop's lighting on a circuit of its own with a switch
 * plate by the door. Every fitting is built facing local +z, then placed and turned.
 */

export const PI = Math.PI

/** One boutique under construction: its group, its light zone and circuit, its finishes. */
export interface Shop {
  e: FloorCtx
  g: Group
  u: Unit
  zone: string
  circuit: Circuit
  m: ShopMaterials
  /** The floor level, and the unit's plan box. */
  y: number
}

/* ---------- painters ---------- */

/** The Dior Oblique motif: the name repeated on the diagonal, tone on tone, 1.2 m a repeat. */
const oblique = (ground: string, ink: string): Paint => (g, w, h) => {
  g.fillStyle = ground
  g.fillRect(0, 0, w, h)
  const r = rng(301)
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'
    g.fillRect(r() * w, r() * h, 2, 2)
  }
  g.save()
  g.translate(w / 2, h / 2)
  g.rotate(-PI / 4)
  g.fillStyle = ink
  g.font = `italic 600 ${Math.round(w / 11)}px "Cormorant Garamond", Georgia, serif`
  g.textBaseline = 'middle'
  const step = w / 8
  for (let row = -8; row <= 8; row++) {
    const y = row * step
    const shift = (row % 2) * step * 0.9
    for (let col = -8; col <= 8; col++) g.fillText('Dior', col * step * 1.8 + shift, y)
  }
  g.restore()
}

/** Cannage: the lattice of Dior's Napoleon III chairs, in cream on cream, 0.6 m a repeat. */
const cannage = (ground: string, line: string): Paint => (g, w, h) => {
  g.fillStyle = ground
  g.fillRect(0, 0, w, h)
  const n = 6
  const s = w / n
  g.lineCap = 'round'
  for (const a of [0, 1]) {
    for (let i = -n; i <= 2 * n; i++) {
      for (const off of [-0.08, 0.08]) {
        g.strokeStyle = line
        g.lineWidth = w / 70
        g.globalAlpha = 0.85
        g.beginPath()
        const o = (i + off) * s
        if (a === 0) {
          g.moveTo(o - w, -w)
          g.lineTo(o + 2 * w, 2 * w)
        } else {
          g.moveTo(o - w, 2 * w)
          g.lineTo(o + 2 * w, -w)
        }
        g.stroke()
      }
    }
  }
  // The caned holes read as soft shadows between the crossings.
  g.globalAlpha = 0.07
  g.fillStyle = '#000'
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      g.beginPath()
      g.arc((i + 0.5) * s, (j + 0.5) * s, s * 0.11, 0, 7)
      g.fill()
    }
  g.globalAlpha = 1
}

/** Diamond quilting of a Lady Dior, 0.12 m a repeat. */
const quilt = (ground: string): Paint => (g, w, h) => {
  g.fillStyle = ground
  g.fillRect(0, 0, w, h)
  const n = 4
  g.lineWidth = w / 60
  for (let i = -n; i <= 2 * n; i++) {
    for (const dir of [1, -1]) {
      const o = (i * w) / n
      const gr = g.createLinearGradient(0, 0, w / n, 0)
      gr.addColorStop(0, 'rgba(255,255,255,.22)')
      gr.addColorStop(0.5, 'rgba(0,0,0,.28)')
      gr.addColorStop(1, 'rgba(255,255,255,.22)')
      g.strokeStyle = gr
      g.beginPath()
      g.moveTo(o - w, dir > 0 ? -w : 2 * w)
      g.lineTo(o + 2 * w, dir > 0 ? 2 * w : -w)
      g.stroke()
    }
  }
}

/** Vertical flutes (half-rounds), `n` across the repeat, in a base colour. */
const flutes = (base: [number, number, number], n: number, depth = 0.5): Paint => (g, w, h) => {
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  const fw = w / n
  for (let i = 0; i < n; i++) {
    const x = i * fw
    const gr = g.createLinearGradient(x, 0, x + fw, 0)
    gr.addColorStop(0, `rgba(0,0,0,${0.42 * depth})`)
    gr.addColorStop(0.3, `rgba(255,255,255,${0.16 * depth})`)
    gr.addColorStop(0.55, `rgba(255,255,255,${0.04 * depth})`)
    gr.addColorStop(1, `rgba(0,0,0,${0.5 * depth})`)
    g.fillStyle = gr
    g.fillRect(x, 0, fw, h)
  }
}

/** Knife pleats: a sharp light and shade per fold. */
const pleats = (base: [number, number, number], n: number): Paint => (g, w, h) => {
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  const fw = w / n
  for (let i = 0; i < n; i++) {
    const x = i * fw
    const gr = g.createLinearGradient(x, 0, x + fw, 0)
    gr.addColorStop(0, 'rgba(255,255,255,.2)')
    gr.addColorStop(0.5, 'rgba(255,255,255,.02)')
    gr.addColorStop(0.5, 'rgba(0,0,0,.3)')
    gr.addColorStop(1, 'rgba(0,0,0,.08)')
    g.fillStyle = gr
    g.fillRect(x, 0, fw, h)
  }
}

/** The Prada salon's round rug: a pastel patchwork with flowers, painted once for the whole rug. */
const floralRug: Paint = (g, w, h) => {
  const r = rng(707)
  const tones = ['#f1c9cf', '#bfe3d3', '#f7e6b0', '#c8d9f1', '#dccbe9', '#f6d5bc', '#cfe8e0']
  g.fillStyle = '#efe6dc'
  g.fillRect(0, 0, w, h)
  // Patches: soft-edged blocks laid in a loose grid.
  for (let i = 0; i < 48; i++) {
    g.fillStyle = tones[Math.floor(r() * tones.length)]
    g.globalAlpha = 0.85
    const x = r() * w
    const y = r() * h
    const s = w * (0.12 + r() * 0.2)
    g.beginPath()
    g.roundRect(x - s / 2, y - s / 2, s, s * (0.7 + r() * 0.6), s * 0.2)
    g.fill()
  }
  g.globalAlpha = 1
  // Flowers: five petals round a centre, in the stronger tones, and sprigs of leaves.
  const flower = (x: number, y: number, s: number, petal: string, centre: string) => {
    g.fillStyle = petal
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * PI * 2
      g.beginPath()
      g.ellipse(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.42, s * 0.28, a, 0, 7)
      g.fill()
    }
    g.fillStyle = centre
    g.beginPath()
    g.arc(x, y, s * 0.22, 0, 7)
    g.fill()
  }
  for (let i = 0; i < 26; i++) flower(r() * w, r() * h, w * (0.03 + r() * 0.04), ['#e98fa0', '#f2b53e', '#7ec4a8', '#6f9ad6', '#e8a46c'][Math.floor(r() * 5)], '#fff6e5')
  g.strokeStyle = 'rgba(80,120,90,.55)'
  g.lineWidth = w / 180
  for (let i = 0; i < 40; i++) {
    const x = r() * w
    const y = r() * h
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(x + (r() - 0.5) * 80, y + (r() - 0.5) * 80, x + (r() - 0.5) * 140, y + (r() - 0.5) * 140)
    g.stroke()
  }
  // The pile: fine noise over everything.
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'
    g.fillRect(r() * w, r() * h, 2, 2)
  }
}

/* ---------- materials ---------- */

export function shopMaterials(e: FloorCtx) {
  const { k, lux, m } = e
  const env = m.env
  const mark = <T extends Material>(x: T) => ((x.userData.interior = true), x)
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.5) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const tex = (w: number, h: number, paint: Paint, metres: number) => {
    const t = k.tex.painted(w, h, paint)
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1 / metres, 1 / metres)
    t.anisotropy = 8
    return t
  }
  const leather = (colour: string, roughness = 0.45) => std({ color: colour, roughness }, 0.4)
  const cloth = (colour: string) => mark(new MeshPhysicalMaterial({ color: colour, roughness: 0.92, sheen: 0.7, sheenRoughness: 0.5, sheenColor: '#ffffff', envMap: env, envMapIntensity: 0.08 }))
  return {
    /* Dior */
    obliqueCarpet: std({ map: tex(1024, 1024, oblique('#6a6663', '#8b8783'), 1.2), roughness: 0.97 }, 0.03),
    obliqueCanvas: std({ map: tex(512, 512, oblique('#8f8a84', '#b3aea7'), 0.18), roughness: 0.85 }, 0.1),
    cannage: std({ map: tex(512, 512, cannage('#efe9df', '#cfc5b6'), 0.6), roughness: 0.7 }, 0.15),
    quiltBlack: std({ map: tex(256, 256, quilt('#1d1b1a'), 0.12), roughness: 0.35 }, 0.6),
    quiltCream: std({ map: tex(256, 256, quilt('#e9e1d3'), 0.12), roughness: 0.4 }, 0.5),
    fiorDiBosco: stoneMaterial(k, 'fiorDiBosco', env, { roughness: 0.16, reflect: 0.6 }),
    botticino: stoneMaterial(k, 'crema', env, { roughness: 0.14, reflect: 0.7 }),
    creamLacquer: std({ color: '#f3eee6', roughness: 0.28 }, 0.6),
    /** Satin champagne for the shelving frames: warm, not a mirror. */
    satin: std({ color: '#c9b592', metalness: 0.55, roughness: 0.5 }, 0.5),
    oakLight: std({ map: tex(512, 512, flutes([205, 176, 138], 1, 0.15), 2), roughness: 0.5 }, 0.3),
    /* Prada */
    marquina: stoneMaterial(k, 'marquina', env, { roughness: 0.07, reflect: 1.0, repeat: 2.4 }),
    mint: cloth('#a7d6c6'),
    mintPleat: std({ color: '#9ccfbc', map: tex(512, 512, pleats([255, 255, 255], 16), 0.64), roughness: 0.9 }, 0.05),
    mintCeiling: std({ color: '#a9d6c4', roughness: 0.92, side: DoubleSide }, 0.05),
    greenVelvet: cloth('#2d6a55'),
    cream: std({ color: '#efe8dc', roughness: 0.8 }, 0.1),
    creamFlute: std({ map: tex(512, 512, flutes([238, 232, 222], 20, 0.6), 0.5), roughness: 0.65 }, 0.2),
    floralRug: std({ map: k.tex.painted(1024, 1024, floralRug), roughness: 0.98 }, 0.02),
    frameGrey: std({ color: '#55565a', metalness: 0.6, roughness: 0.4 }, 0.5),
    /* merchandise */
    leatherBlack: leather('#1c1a19', 0.38),
    leatherTan: leather('#b07a4a'),
    leatherCream: leather('#e6dccb'),
    leatherNavy: leather('#273252'),
    leatherGrey: leather('#8a8580'),
    leatherOrange: leather('#e27a2b'),
    leatherYellow: leather('#e6b53a'),
    leatherTeal: leather('#2d8f86'),
    leatherPink: leather('#e7b5bd'),
    saffiano: std({ color: '#111214', roughness: 0.55, bumpMap: tex(128, 128, flutes([128, 128, 128], 32, 0.4), 0.03), bumpScale: 0.3 }, 0.5),
    suit: cloth('#23242a'),
    shirt: std({ color: '#f4f2ee', roughness: 0.8 }, 0.1),
    mannequin: std({ color: '#d9d4cc', roughness: 0.55 }, 0.3),
    knitCream: cloth('#ece5d8'),
    knitGrey: cloth('#8e8a86'),
    sole: std({ color: '#f1efe9', roughness: 0.5 }, 0.3),
    ceramicWhite: std({ color: '#f6f4ef', roughness: 0.25 }, 0.6),
    branch: std({ color: '#efece6', roughness: 0.8 }, 0.1),
    scent: mark(new MeshPhysicalMaterial({ color: '#e9d7b8', roughness: 0.04, transmission: 0, transparent: true, opacity: 0.8, envMap: env, envMapIntensity: 1.2 })),
    /* glass and light */
    glass: lux.glassClear,
    vitrineGlass: mark(new MeshPhysicalMaterial({ color: '#eef4f2', roughness: 0.02, transparent: true, opacity: 0.14, depthWrite: false, side: DoubleSide, envMap: env, envMapIntensity: 1.2 })),
    shelfGlass: mark(new MeshPhysicalMaterial({ color: '#d7e6e0', roughness: 0.02, transparent: true, opacity: 0.35, depthWrite: false, envMap: env, envMapIntensity: 1.0 })),
    /** A lit backing panel (the soft wash behind lit shelving). */
    backlit: (colour: string, strength: number) => std({ color: colour, emissive: colour, emissiveIntensity: strength, roughness: 0.9 }, 0.05),
    tex,
  }
}

export type ShopMaterials = ReturnType<typeof shopMaterials>

/** Starts a boutique: its group under the floor, its circuit, its finishes. */
export function openShop(e: FloorCtx, u: Unit): Shop {
  const g = new Group()
  g.name = `shop_${u.id.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
  e.g.add(g)
  const zone = `room_mall_${e.level === 0 ? 'g' : e.level}_${u.id.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
  return { e, g, u, zone, circuit: circuit(), m: shopMaterials(e), y: e.y }
}

/** A glowing finish of the shop's own, on its circuit, so the switch fades it with the lamps. */
export function onCircuit(s: Shop, mat: MeshStandardMaterial) {
  const n = mat.clone()
  n.userData.interior = true
  s.circuit.glows.push(n)
  return n
}

/** A lamp of the shop's, in its zone and on its circuit. */
export function lamp(s: Shop, x: number, y: number, z: number, intensity: number, distance: number, colour = '#ffe9cf') {
  const l = s.e.lighting.light(new PointLight(colour, intensity, distance, 1.7), 0.6)
  l.position.set(x, y, z)
  l.userData.zone = s.zone
  s.g.add(l)
  s.circuit.lights.push(l)
  return l
}

/** The switch plate by the door that works the shop's display lighting, facing local +z from the wall. */
export function lightSwitch(s: Shop, x: number, z: number, yaw: number, name: string) {
  const g = new Group()
  g.position.set(x, s.y + 1.2, z)
  g.rotation.y = yaw
  s.g.add(g)
  const plate = switchPlate(s.e.k, g, `${name}_lights`, ['switch'], { plate: s.e.lux.brass, rocker: s.e.lux.brass, dark: s.e.lux.blackSteel, locator: s.e.lux.ledCool as MeshStandardMaterial }, [s.circuit])
  plate.traverse((o) => {
    if (o.name.startsWith('switch_')) o.userData.label = 'Display lights'
  })
  setCircuit(s.circuit, true)
}

/* ---------- small helpers ---------- */

export function mesh(p: Object3D, g: BufferGeometry, m: Material, x = 0, y = 0, z = 0, cast = true) {
  const o = new Mesh(g, m)
  o.position.set(x, y, z)
  o.castShadow = cast
  o.receiveShadow = true
  p.add(o)
  return o
}

/** A group at (x, y, z) whose local +z faces `yaw`. */
export function at(p: Object3D, x: number, y: number, z: number, yaw = 0) {
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = yaw
  p.add(g)
  return g
}

/** Points round an ellipse (a along x, b along z), anticlockwise seen from above. */
export function ellipse(cx: number, cz: number, a: number, b: number, n = 64): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * PI * 2
    return [cx + Math.cos(t) * a, cz + Math.sin(t) * b] as [number, number]
  })
}

/**
 * Pleated cloth: a zigzag of flat panels along a path, from y0 to y1. `path(t)` gives the fold
 * line's plan position and `normal(t)` the direction the pleats stand out in; `n` folds, `amp`
 * deep. Closed paths (an oval) join up. Lit flat, each panel catches the light its own way.
 */
export function pleated(path: (t: number) => [number, number], normal: (t: number) => [number, number], n: number, y0: number, y1: number, amp: number, closed: boolean, mat: Material, flip = false) {
  const cols: [number, number][] = []
  const count = closed ? n : n + 1
  for (let i = 0; i < count; i++) {
    const t = closed ? i / n : i / n
    const [x, z] = path(t)
    const [nx, nz] = normal(t)
    const d = (i % 2 ? amp : -amp) * (flip ? -1 : 1)
    cols.push([x + nx * d, z + nz * d])
  }
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const quads = closed ? n : n
  for (let i = 0; i < quads; i++) {
    const a = cols[i]
    const b = cols[(i + 1) % cols.length]
    // Face normal from the panel's direction, turned to the side the viewer stands on (both drawn).
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    const l = Math.hypot(dx, dz) || 1
    const fx = -dz / l
    const fz = dx / l
    const tri = (p: number[][]) => {
      for (const [x, y, z] of p) {
        pos.push(x, y, z)
        nor.push(fx, 0, fz)
      }
    }
    tri([[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]]])
    tri([[a[0], y0, a[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]])
    const u0 = i / quads
    const u1 = (i + 1) / quads
    uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  const m = new Mesh(g, mat)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** A pleated curtain hanging flat along a wall, from (x0, z0) to (x1, z1), standing `amp` off it. */
export function curtain(s: Shop, p: Object3D, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, mat: Material, fold = 0.07) {
  const len = Math.hypot(x1 - x0, z1 - z0)
  const n = Math.max(4, Math.round(len / fold))
  const nx = -(z1 - z0) / len
  const nz = (x1 - x0) / len
  const m = pleated((t) => [x0 + (x1 - x0) * t, z0 + (z1 - z0) * t], () => [nx, nz], n, y0, y1, 0.035, false, mat)
  ;(m.material as Material).side = DoubleSide
  p.add(m)
  // A slim track above it.
  const g = at(p, (x0 + x1) / 2, y1, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0))
  s.e.k.box(g, 0.04, 0.03, len, s.e.lux.blackSteel, 0, 0.015, 0, false)
  return m
}

/** A box whose faces carry UVs in metres, for a painted finish laid at true scale (cannage, flutes, stone). */
export function mbox(p: Object3D, w: number, h: number, d: number, mat: Material, x: number, y: number, z: number, cast = true) {
  return mesh(p, metricBox(w, h, d), mat, x, y, z, cast)
}

/** A plan polygon as a flat sheet at y (floor or ceiling), with holes. */
export function flat(p: Object3D, poly: [number, number][], y: number, mat: Material, down = false, holes: [number, number][][] = [], name = '') {
  return sheet(p, poly, y, mat, down, holes, name)
}

/** A polygon for a rectangle. */
export const rect = (x0: number, x1: number, z0: number, z1: number): [number, number][] => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
export const circle = (cx: number, cz: number, r: number, n = 48): [number, number][] => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * PI * 2) * r, cz + Math.sin((i / n) * PI * 2) * r])

/* ---------- lettering ---------- */

const SERIF = '"Cormorant Garamond", "Playfair Display", Georgia, "Times New Roman", serif'
const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif'

/** Cut-out brand letters on a transparent cell: a quad shows only the letters. */
export function letters(s: Shop, text: string, style: 'dior' | 'prada', ink: string, w = 512, h = 128) {
  return s.e.s.fascia.cell(w, h, (g, cw, ch) => {
    g.clearRect(0, 0, cw, ch)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = ink
    let size = style === 'dior' ? ch * 0.86 : ch * 0.72
    const spacing = style === 'dior' ? ch * 0.08 : ch * 0.12
    for (;;) {
      g.font = style === 'dior' ? `500 ${size}px ${SERIF}` : `700 ${size}px ${SANS}`
      if (g.measureText(text).width + spacing * (text.length - 1) <= cw - 16 || size < 10) break
      size *= 0.94
    }
    const total = g.measureText(text).width + spacing * (text.length - 1)
    let x = cw / 2 - total / 2
    g.textAlign = 'left'
    for (const ch2 of text) {
      g.fillText(ch2, x, ch / 2 + (style === 'dior' ? ch * 0.02 : ch * 0.04))
      x += g.measureText(ch2).width + spacing
    }
  })
}

/** Places a lettering quad of width w (height from the cell's aspect) centred at (x, y, z), facing yaw. */
export function brandSign(s: Shop, p: Object3D, uv: [number, number, number, number], w: number, h: number, x: number, y: number, z: number, yaw: number) {
  return place(p, w, h, uv, s.e.s.lit, x, y, z, yaw)
}

/* ---------- shopfront parts ---------- */

/**
 * A glazed swing door leaf, `w` wide and `h` high, hung on its hinge at local (0, 0, 0) and
 * extending along local +x with its face in the x–y plane: a slim metal frame round the glass, a
 * long pull on each face. `openAngle` is the swing (about y) a tap gives it; `standsOpen` leaves
 * it that way to begin with, as a boutique's doors are during trading.
 */
export function swingLeaf(s: Shop, p: Object3D, name: string, w: number, h: number, frame: Material, openAngle: number, standsOpen: boolean) {
  const { k } = s.e
  const leaf = new Group()
  leaf.name = `door_${name}`
  leaf.userData.label = 'Entrance door'
  leaf.userData.openAngle = openAngle
  if (standsOpen) {
    leaf.userData.closedY = 0
    leaf.userData.open = true
    leaf.rotation.y = openAngle
  }
  p.add(leaf)
  const t = 0.045
  const glass = k.box(leaf, w - 2 * t, h - 2 * t, 0.012, s.m.glass, w / 2, h / 2, 0, false)
  glass.userData.front = true
  k.box(leaf, t, h, 0.05, frame, t / 2, h / 2, 0)
  k.box(leaf, t, h, 0.05, frame, w - t / 2, h / 2, 0)
  k.box(leaf, w, t, 0.05, frame, w / 2, h - t / 2, 0)
  k.box(leaf, w, 0.12, 0.05, frame, w / 2, 0.06, 0)
  // The pull: a 1.2 m bar on standoffs, both faces, at the free edge.
  for (const side of [-1, 1]) {
    const px = w - 0.12
    mesh(leaf, new CylinderGeometry(0.014, 0.014, 1.2, 12), frame, px, 1.1, side * 0.055)
    for (const dy of [-0.5, 0.5]) mesh(leaf, new CylinderGeometry(0.01, 0.01, 0.05, 8), frame, px, 1.1 + dy, side * 0.03).rotation.x = PI / 2
  }
  return leaf
}

/** A frameless pane of the shop's glass between two plan points, from y0 to y1. */
export function pane(s: Shop, p: Object3D, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, mat: Material = s.m.glass) {
  const len = Math.hypot(x1 - x0, z1 - z0)
  const g = at(p, (x0 + x1) / 2, 0, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0))
  s.e.k.box(g, 0.012, y1 - y0, len, mat, 0, (y0 + y1) / 2, 0, false)
}

/* ---------- merchandise ---------- */

/** A structured handbag standing on its base at local (0, 0, 0), facing +z: body, flap, top handle, clasp. */
export function handbag(s: Shop, p: Object3D, x: number, y: number, z: number, yaw: number, body: Material, w = 0.3, h = 0.21, d = 0.12, handle: 'top' | 'strap' | 'none' = 'top', metal: Material = s.e.lux.brass) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.soft(g, w, h, d, 0.018, body, 0, h / 2, 0)
  k.soft(g, w - 0.02, h * 0.42, 0.012, 0.005, body, 0, h - h * 0.21 - 0.004, d / 2 + 0.004)
  k.box(g, 0.05, 0.016, 0.01, metal, 0, h * 0.58, d / 2 + 0.014)
  if (handle === 'top') {
    const r = w * 0.28
    const ring = mesh(g, new TorusGeometry(r, 0.0075, 8, 24, PI), body, 0, h, 0)
    ring.rotation.y = 0
    void ring
  } else if (handle === 'strap') {
    for (const sx of [-1, 1]) mesh(g, new CylinderGeometry(0.004, 0.004, 0.16, 6), metal, sx * (w / 2 - 0.03), h + 0.06, 0).rotation.z = sx * 0.35
    k.box(g, w * 0.75, 0.006, 0.008, body, 0, h + 0.135, 0)
  }
  return g
}

/** A sneaker on its sole, toe towards +z. */
export function sneaker(s: Shop, p: Object3D, x: number, y: number, z: number, yaw: number, upper: Material, sole: Material = s.m.sole) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.soft(g, 0.1, 0.03, 0.28, 0.012, sole, 0, 0.015, 0)
  k.soft(g, 0.09, 0.075, 0.26, 0.03, upper, 0, 0.06, -0.005)
  k.soft(g, 0.08, 0.05, 0.1, 0.02, upper, 0, 0.1, -0.08)
  return g
}

/** A baseball cap, peak towards +z. */
export function cap(_s: Shop, p: Object3D, x: number, y: number, z: number, yaw: number, mat: Material) {
  const g = at(p, x, y, z, yaw)
  mesh(g, new SphereGeometry(0.09, 20, 10, 0, PI * 2, 0, PI / 2), mat, 0, 0.0, 0)
  const peak = mesh(g, new CylinderGeometry(0.1, 0.1, 0.006, 20, 1, false, -PI / 2 - 0.9, 1.8), mat, 0, 0.004, 0.0)
  peak.rotation.x = 0.1
  return g
}

/** A scent bottle: a faceted glass block with a cap. */
export function scentBottle(s: Shop, p: Object3D, x: number, y: number, z: number, h = 0.12) {
  const { k } = s.e
  const g = at(p, x, y, z, 0)
  k.soft(g, h * 0.55, h * 0.8, h * 0.3, 0.006, s.m.scent as MeshStandardMaterial, 0, h * 0.4, 0)
  k.cyl(g, h * 0.12, h * 0.12, h * 0.2, s.e.lux.brass, 0, h * 0.9, 0, 16)
  return g
}

/** A garment on a hanger: a jacket's shoulders, body and sleeves hung from a rail at local y = 0. */
export function hungGarment(s: Shop, p: Object3D, x: number, y: number, z: number, yaw: number, cloth: Material, long = false) {
  const { k, lux } = s.e
  const g = at(p, x, y, z, yaw)
  mesh(g, new TorusGeometry(0.03, 0.004, 6, 12, PI), lux.brass, 0, -0.01, 0)
  k.box(g, 0.42, 0.012, 0.012, lux.walnut, 0, -0.06, 0)
  const len = long ? 1.1 : 0.72
  k.soft(g, 0.44, len, 0.08, 0.03, cloth, 0, -0.06 - len / 2, 0)
  for (const sx of [-1, 1]) {
    const arm = mesh(g, new CapsuleGeometry(0.045, 0.5, 4, 10), cloth, sx * 0.2, -0.36, 0.01)
    arm.rotation.z = sx * 0.12
  }
  return g
}

/**
 * An abstract display mannequin, 1.8 m, in a suit (or a knit) with a smooth egg head: torso, hips,
 * legs and arms as capsules on a round base, facing +z. Slightly turned at the waist, as they stand.
 */
export function mannequin(s: Shop, p: Object3D, x: number, y: number, z: number, yaw: number, outfit: Material, inner: Material = s.m.shirt) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  const skin = s.m.mannequin
  k.cyl(g, 0.2, 0.2, 0.015, s.e.lux.blackSteel, 0, 0.008, 0, 32)
  k.cyl(g, 0.01, 0.01, 0.4, s.e.lux.steel, 0, 0.2, 0, 8)
  // Legs, trousers.
  for (const sx of [-1, 1]) {
    const leg = mesh(g, new CapsuleGeometry(0.075, 0.72, 6, 14), outfit, sx * 0.09, 0.5, 0)
    leg.rotation.z = sx * 0.04
    mesh(g, new CapsuleGeometry(0.045, 0.15, 4, 10), skin, sx * 0.09, 0.05, 0.06).rotation.x = PI / 2
  }
  // Hips, shirt, jacket with lapels, shoulders.
  k.soft(g, 0.36, 0.2, 0.2, 0.06, outfit, 0, 0.92, 0)
  k.soft(g, 0.3, 0.46, 0.16, 0.05, inner, 0, 1.24, 0.02)
  const jacket = k.soft(g, 0.4, 0.5, 0.24, 0.06, outfit, 0, 1.24, -0.01)
  jacket.rotation.y = 0.08
  k.box(g, 0.012, 0.44, 0.02, inner, 0, 1.25, 0.12)
  for (const sx of [-1, 1]) {
    const arm = mesh(g, new CapsuleGeometry(0.055, 0.56, 6, 12), outfit, sx * 0.235, 1.2, 0.0)
    arm.rotation.z = sx * 0.1
    mesh(g, new CapsuleGeometry(0.035, 0.1, 4, 10), skin, sx * 0.26, 0.86, 0.02)
  }
  // Neck and head.
  k.cyl(g, 0.05, 0.055, 0.1, skin, 0, 1.52, 0.0, 16)
  const head = mesh(g, new SphereGeometry(0.1, 24, 16), skin, 0, 1.68, 0.0)
  head.scale.set(0.92, 1.12, 0.95)
  return g
}

/** A vase of pale branches with small blossoms, for a plinth or counter. */
export function branches(s: Shop, p: Object3D, x: number, y: number, z: number, height = 0.9, seed = 1) {
  const { k } = s.e
  const r = rng(seed)
  const g = at(p, x, y, z, r() * PI)
  mesh(g, new LatheGeometry([new Vector2(0.001, 0), new Vector2(0.07, 0), new Vector2(0.09, 0.08), new Vector2(0.07, 0.2), new Vector2(0.045, 0.28), new Vector2(0.05, 0.3)], 24), s.m.ceramicWhite, 0, 0, 0)
  const n = 6 + Math.floor(r() * 3)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2 + r() * 0.6
    const lean = 0.12 + r() * 0.22
    const h = height * (0.6 + r() * 0.4)
    const stem = mesh(g, new CylinderGeometry(0.003, 0.005, h, 5), s.m.branch, Math.cos(a) * lean * 0.5, 0.28 + h / 2, Math.sin(a) * lean * 0.5, false)
    stem.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean)
    for (let b = 0; b < 5; b++) {
      const t = 0.5 + r() * 0.5
      const bx2 = Math.cos(a) * lean * t * h * 0.5
      const bz = Math.sin(a) * lean * t * h * 0.5
      k.sphere(g, 0.012 + r() * 0.01, s.m.ceramicWhite, bx2 + (r() - 0.5) * 0.06, 0.28 + h * t, bz + (r() - 0.5) * 0.06)
    }
  }
  return g
}

/* ---------- fixtures ---------- */

/**
 * A run of lit wall shelving, `len` long along local x with its back on local z = 0 and shelves
 * towards +z: a lit backing panel, bronze or brass uprights every 1.2 m, glass shelves on metal
 * edges at the heights given, a closed cabinet base below the first, a light line under each shelf.
 */
export function shelfWall(s: Shop, p: Object3D, x: number, z: number, yaw: number, len: number, depth: number, heights: number[], top: number, metal: Material, base: Material, back: Material, led: Material, frame: Material = metal) {
  const { k } = s.e
  const g = at(p, x, s.y, z, yaw)
  const b = heights[0] - 0.02
  k.box(g, len, top, 0.02, back, 0, top / 2, 0.01, false)
  k.box(g, len, b, depth, base, 0, b / 2, depth / 2)
  k.box(g, len - 0.04, 0.012, depth - 0.04, metal, 0, b + 0.006, depth / 2)
  const bays = Math.max(1, Math.round(len / 1.2))
  for (let i = 0; i <= bays; i++) {
    const u = -len / 2 + (i * len) / bays
    k.box(g, 0.03, top - b, depth, frame, u, b + (top - b) / 2, depth / 2)
  }
  for (const h of heights.slice(1)) {
    k.box(g, len - 0.03, 0.012, depth - 0.03, s.m.shelfGlass, 0, h, depth / 2 - 0.01, false)
    k.box(g, len - 0.03, 0.02, 0.015, metal, 0, h, depth - 0.02, false)
    k.box(g, len - 0.1, 0.006, 0.01, led, 0, h - 0.012, depth - 0.05, false)
  }
  k.box(g, len, 0.06, depth, frame, 0, top - 0.03, depth / 2)
  k.box(g, len - 0.1, 0.006, 0.01, led, 0, top - 0.065, depth - 0.05, false)
  s.e.shade.rect(x, s.y + 0.012, z, len, depth * 1.2, yaw, 0.3)
  return { g, shelfY: (i: number) => (i === 0 ? b + 0.012 : heights[i] + 0.006), depth }
}

/**
 * A glazed vitrine, `w` × `d` × `h`, facing +z: a plinth, a metal-framed glass case with lit glass
 * shelves, and a hinged glass door at the front (door_) that swings open.
 */
export function vitrine(s: Shop, p: Object3D, name: string, x: number, z: number, yaw: number, w: number, d: number, h: number, shelves: number[], metal: Material, plinth: Material, led: Material, plinthH = 0.7) {
  const { k } = s.e
  const g = at(p, x, s.y, z, yaw)
  k.box(g, w, plinthH, d, plinth, 0, plinthH / 2, 0)
  k.box(g, w - 0.04, 0.012, d - 0.04, metal, 0, plinthH + 0.006, 0)
  const t = 0.025
  const top = plinthH + h
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) k.box(g, t, h, t, metal, sx * (w / 2 - t / 2), plinthH + h / 2, sz * (d / 2 - t / 2))
  k.box(g, w, 0.05, d, metal, 0, top - 0.025, 0)
  k.box(g, w - 0.1, 0.006, d - 0.1, led, 0, top - 0.053, 0, false)
  // Fixed glass: back and sides.
  k.box(g, w - 2 * t, h - 0.06, 0.008, s.m.vitrineGlass, 0, plinthH + h / 2 - 0.02, -d / 2 + t / 2, false)
  for (const sx of [-1, 1]) k.box(g, 0.008, h - 0.06, d - 2 * t, s.m.vitrineGlass, sx * (w / 2 - t / 2), plinthH + h / 2 - 0.02, 0, false)
  for (const sh of shelves) {
    k.box(g, w - 2 * t - 0.02, 0.01, d - 2 * t - 0.02, s.m.shelfGlass, 0, plinthH + sh, 0, false)
    k.box(g, w - 2 * t - 0.1, 0.005, 0.008, led, 0, plinthH + sh - 0.01, -d / 2 + t + 0.02, false)
  }
  // The door: hinged at its left edge, swinging out.
  const door = new Group()
  door.name = `door_${name}`
  door.userData.label = 'Vitrine door'
  door.userData.openAngle = PI / 2 - 0.3
  door.position.set(-w / 2 + t, plinthH + 0.02, d / 2 - t / 2)
  g.add(door)
  const dw = w - 2 * t
  const pane = k.box(door, dw - 0.01, h - 0.09, 0.008, s.m.vitrineGlass, dw / 2, (h - 0.09) / 2, 0, false)
  pane.userData.front = true
  k.box(door, 0.02, h - 0.09, 0.02, metal, 0.01, (h - 0.09) / 2, 0)
  k.box(door, 0.02, 0.1, 0.024, metal, dw - 0.03, (h - 0.09) / 2, 0.012)
  s.e.shade.rect(x, s.y + 0.012, z, w, d, yaw, 0.35)
  return { g, shelfY: (i: number) => plinthH + (i === 0 ? 0.012 : shelves[i - 1] + 0.005) }
}

/**
 * The cash desk: a stone-topped counter on a clad base, facing +z (the customer's side), with a
 * till drawer behind it (drawer_) that slides out towards the staff, a card terminal and a tablet.
 */
export function cashDesk(s: Shop, p: Object3D, name: string, x: number, z: number, yaw: number, len: number, body: Material, top: Material, metal: Material, led: Material) {
  const { k, lux } = s.e
  const g = at(p, x, s.y, z, yaw)
  const d = 0.65
  const h = 1.0
  k.box(g, len - 0.1, 0.08, d - 0.1, lux.blackSteel, 0, 0.04, 0)
  k.box(g, len, h - 0.08, d, body, 0, 0.08 + (h - 0.08) / 2, 0)
  k.box(g, len + 0.04, 0.04, d + 0.04, top, 0, h + 0.02, 0)
  k.box(g, len - 0.06, 0.012, 0.004, metal, 0, 0.92, d / 2 + 0.002, false)
  k.box(g, len - 0.2, 0.006, 0.01, led, 0, 0.078, d / 2 - 0.06, false)
  // The till drawer, in the staff side's face.
  const drawer = new Group()
  drawer.name = `drawer_${name}`
  drawer.userData.label = 'Till drawer'
  drawer.userData.slide = [0, 0, -0.34]
  drawer.position.set(-len / 2 + 0.5, 0.72, -d / 2)
  g.add(drawer)
  const front = k.box(drawer, 0.46, 0.12, 0.02, body, 0, 0, -0.01)
  front.userData.front = true
  k.box(drawer, 0.14, 0.012, 0.012, metal, 0, 0, -0.026)
  const contents = new Group()
  contents.name = 'contents'
  drawer.add(contents)
  k.box(contents, 0.44, 0.08, 0.34, lux.blackSteel, 0, -0.01, 0.18)
  for (let i = 0; i < 4; i++) k.box(contents, 0.09, 0.02, 0.3, i % 2 ? lux.steel : lux.chrome, -0.16 + i * 0.105, 0.03, 0.18, false)
  // Card terminal and tablet on the counter.
  k.soft(g, 0.08, 0.03, 0.14, 0.008, lux.blackSteel, len / 2 - 0.4, h + 0.055, 0.1)
  const tab = k.soft(g, 0.26, 0.012, 0.18, 0.004, lux.blackSteel, -len / 2 + 0.45, h + 0.12, -0.1)
  tab.rotation.x = -0.5
  k.box(g, 0.06, 0.08, 0.06, metal, -len / 2 + 0.45, h + 0.08, -0.06)
  s.e.shade.rect(x, s.y + 0.012, z, len, d, yaw, 0.4)
  return g
}

/** A low display plinth (a block) with its top at `h`, facing +z. */
export function plinth(s: Shop, p: Object3D, x: number, z: number, yaw: number, w: number, d: number, h: number, mat: Material, cast = true) {
  const g = at(p, x, s.y, z, yaw)
  s.e.k.box(g, w, h, d, mat, 0, h / 2, 0, cast)
  s.e.shade.rect(x, s.y + 0.012, z, w, d, yaw, 0.35)
  return g
}

/** A round pleated pouf (or, with a stone top, a round display table). */
export function pouf(s: Shop, p: Object3D, x: number, z: number, r: number, h: number, mat: Material, top?: Material) {
  const g = at(p, x, s.y, z, 0)
  const side = mesh(g, new CylinderGeometry(r, r, h - 0.03, 48, 1, true), mat, 0, (h - 0.03) / 2 + 0.015, 0)
  ;(side.material as MeshStandardMaterial).side = DoubleSide
  mesh(g, new CylinderGeometry(r - 0.01, r - 0.01, 0.015, 48), s.e.lux.blackSteel, 0, 0.008, 0)
  if (top) mesh(g, new CylinderGeometry(r + 0.005, r + 0.005, 0.03, 48), top, 0, h - 0.015, 0)
  else {
    const cushion = mesh(g, new SphereGeometry(r, 48, 12, 0, PI * 2, 0, PI / 2), mat, 0, h - 0.03, 0)
    cushion.scale.y = 0.14
  }
  s.e.shade.pool(x, s.y + 0.012, z, r * 1.25, r * 1.25, 0.4)
  return g
}

/** A round rug, `r` across, laid at the floor on a circle whose texture is the whole rug. */
export function roundRug(s: Shop, p: Object3D, x: number, z: number, r: number, mat: Material) {
  const m = mesh(p, new CircleGeometry(r, 64), mat, x, s.y + 0.0105, z, false)
  m.rotation.x = -PI / 2
  return m
}

/** A face-down lit disc or oval in the ceiling: an upstand ring and a glowing panel inside it. */
export function lightCove(_s: Shop, p: Object3D, poly: [number, number][], y: number, lift: number, wall: Material, glow: Material, trim: Material) {
  const shape = new Shape(poly.map(([x, z]) => new Vector2(x, z)))
  const panel = new Mesh(new ShapeGeometry(shape, 2), glow)
  panel.rotation.x = PI / 2
  panel.position.y = y + lift
  panel.receiveShadow = true
  p.add(panel)
  // The upstand: a ribbon of panels round the polygon.
  const pos: number[] = []
  const nor: number[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    const l = Math.hypot(dx, dz) || 1
    const nx = dz / l
    const nz = -dx / l
    for (const [x, yy, z] of [[a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + lift, b[1]], [a[0], y, a[1]], [b[0], y + lift, b[1]], [a[0], y + lift, a[1]]]) {
      pos.push(x, yy, z)
      nor.push(nx, 0, nz)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  const ring = new Mesh(g, wall)
  ;(ring.material as MeshStandardMaterial).side = DoubleSide
  p.add(ring)
  // A metal trim at the lip.
  const inner = poly.map(([x, z]) => [x, z] as [number, number])
  const cx = inner.reduce((a, q) => a + q[0], 0) / inner.length
  const cz = inner.reduce((a, q) => a + q[1], 0) / inner.length
  const outer = inner.map(([x, z]) => [cx + (x - cx) * 1.02, cz + (z - cz) * 1.02] as [number, number])
  flat(p, outer, y - 0.004, trim, true, [inner])
  return panel
}

/** A row of recessed downlights along a line. */
export function downlights(s: Shop, p: Object3D, x0: number, z0: number, x1: number, z1: number, n: number, y: number) {
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    downlight(s.e, p, x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t, s.e.lux.plaster)
  }
}

/** A skirting and a shadow gap along a wall face from (x0, z0) to (x1, z1), the face towards local +z. */
export function skirting(s: Shop, p: Object3D, x0: number, z0: number, x1: number, z1: number, mat: Material, h = 0.1) {
  const len = Math.hypot(x1 - x0, z1 - z0)
  const g = at(p, (x0 + x1) / 2, s.y, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0))
  s.e.k.box(g, 0.018, h, len, mat, 0.009, h / 2, 0, false)
  s.e.shade.foot(x0, z0, x1, z1, s.y + 0.01, 0.18, 0.28)
}

/** A box in plan coordinates (shorthand on the shell's). */
export const box = (s: Shop, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Material, cast = true) => bx(s.e, s.g, x0, x1, y0, y1, z0, z1, mat, cast)
