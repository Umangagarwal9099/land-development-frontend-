import { DoubleSide, MeshStandardMaterial, Vector2, type MeshStandardMaterialParameters } from 'three'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import { rng, type Paint } from '../textures'
import { mallMaterials } from '../kalakalMall/materials'

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/* ---------- painted surfaces ---------- */

/**
 * Half a metre of the capsules' screen: black expanded-metal mesh, its diamond strands catching
 * the light along their upper edges. White is metal, black open (an alpha map).
 */
const expandedMetal: Paint = (g, w, h) => {
  g.fillStyle = '#000'
  g.fillRect(0, 0, w, h)
  const nx = 10
  const ny = 6
  const cw = w / nx
  const ch = h / ny
  g.strokeStyle = '#fff'
  g.lineWidth = cw * 0.24
  g.lineJoin = 'bevel'
  for (let j = -1; j <= ny; j++)
    for (let i = -1; i <= nx; i++) {
      const x = i * cw + (j % 2 ? cw / 2 : 0)
      const y = j * ch
      g.beginPath()
      g.moveTo(x, y + ch / 2)
      g.lineTo(x + cw / 2, y)
      g.lineTo(x + cw, y + ch / 2)
      g.lineTo(x + cw / 2, y + ch)
      g.closePath()
      g.stroke()
    }
}

/** White glass-reinforced concrete: smooth, with faint trowel clouding and board joints at 2.4 m. */
const grc: Paint = (g, w, h) => {
  const r = rng(811)
  g.fillStyle = '#efede8'
  g.fillRect(0, 0, w, h)
  for (let k = 0; k < 70; k++) {
    const x = r() * w
    const y = r() * h
    const rad = 20 + r() * 90
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, r() < 0.5 ? 'rgba(214,210,200,.25)' : 'rgba(255,255,255,.35)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '170,166,158' : '255,255,255'},${0.08 + r() * 0.12})`
    g.fillRect(r() * w, r() * h, 1.2, 1.2)
  }
  // Panel joints, sealed, a little darker with dust at their foot.
  g.fillStyle = 'rgba(150,146,138,.55)'
  g.fillRect(0, 0, w, 2)
  g.fillRect(0, 0, 2, h)
}

/** Polished stone for the plaza's rings: cream travertine or black granite, 1.2 m slabs with hairline joints. */
const polished = (dark: boolean): Paint => (g, w, h) => {
  const r = rng(dark ? 823 : 821)
  g.fillStyle = dark ? '#1a1b1d' : '#d9d2c4'
  g.fillRect(0, 0, w, h)
  const n = 2
  const s = w / n
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const base = dark ? 32 : 214
      const d = (r() - 0.5) * (dark ? 8 : 14)
      g.fillStyle = dark ? `rgb(${base + d},${base + d},${base + 2 + d})` : `rgb(${base + d},${base - 7 + d},${base - 20 + d})`
      g.fillRect(i * s + 1, j * s + 1, s - 2, s - 2)
      if (dark) {
        for (let k = 0; k < 2600; k++) {
          g.fillStyle = r() < 0.7 ? `rgba(90,92,96,${0.2 + r() * 0.3})` : `rgba(200,200,205,${0.15 + r() * 0.25})`
          g.fillRect(i * s + r() * s, j * s + r() * s, 1 + r() * 1.4, 1 + r() * 1.4)
        }
      } else {
        // Travertine's banding and its filled pores.
        for (let k = 0; k < 14; k++) {
          const y = j * s + r() * s
          g.fillStyle = `rgba(${r() < 0.5 ? '185,170,145' : '238,232,220'},${0.18 + r() * 0.2})`
          g.fillRect(i * s, y, s, 1 + r() * 3)
        }
        for (let k = 0; k < 160; k++) {
          g.fillStyle = 'rgba(160,145,120,.35)'
          g.fillRect(i * s + r() * s, j * s + r() * s, 1 + r() * 4, 1 + r() * 1.5)
        }
      }
    }
}

/**
 * One guest room seen through its window, on its back wall: a timber headboard panel with the
 * bed's white linen before it, a reading lamp either side, a framed print, warm walls. The
 * canvas is one room wide (3.9 m) and one storey high; it repeats room by room.
 */
const guestRoom: Paint = (g, w, h) => {
  const r = rng(871)
  const wall = g.createLinearGradient(0, 0, 0, h)
  wall.addColorStop(0, '#d9cbb4')
  wall.addColorStop(1, '#c7b497')
  g.fillStyle = wall
  g.fillRect(0, 0, w, h)
  // Ceiling cove light along the top.
  const cove = g.createLinearGradient(0, 0, 0, h * 0.18)
  cove.addColorStop(0, 'rgba(255,236,200,.85)')
  cove.addColorStop(1, 'rgba(255,236,200,0)')
  g.fillStyle = cove
  g.fillRect(0, 0, w, h * 0.18)
  // Headboard panel in walnut, with vertical grooves.
  const hx = w * 0.22
  const hw = w * 0.56
  g.fillStyle = '#6b4a31'
  g.fillRect(hx, h * 0.38, hw, h * 0.47)
  g.fillStyle = 'rgba(40,26,16,.45)'
  for (let x = hx + 18; x < hx + hw; x += 24) g.fillRect(x, h * 0.38, 2, h * 0.47)
  // The bed: white duvet with a grey throw, pillows.
  g.fillStyle = '#f4f1ea'
  g.fillRect(hx + 10, h * 0.72, hw - 20, h * 0.2)
  g.fillStyle = '#8a8580'
  g.fillRect(hx + 10, h * 0.84, hw - 20, h * 0.05)
  g.fillStyle = '#ffffff'
  for (const px of [0.3, 0.52]) g.fillRect(w * px, h * 0.66, w * 0.17, h * 0.08)
  // Bedside lamps glowing either side, and a framed print above.
  for (const lx of [0.15, 0.85]) {
    const x = lx * w
    const glow = g.createRadialGradient(x, h * 0.6, 4, x, h * 0.6, h * 0.22)
    glow.addColorStop(0, 'rgba(255,224,170,.95)')
    glow.addColorStop(1, 'rgba(255,224,170,0)')
    g.fillStyle = glow
    g.fillRect(x - h * 0.22, h * 0.38, h * 0.44, h * 0.44)
    g.fillStyle = '#fff1d6'
    g.fillRect(x - 16, h * 0.56, 32, 26)
    g.fillStyle = '#4a3a2c'
    g.fillRect(x - 30, h * 0.74, 60, h * 0.16)
  }
  g.fillStyle = '#2e2b28'
  g.fillRect(w * 0.38, h * 0.2, w * 0.24, h * 0.14)
  g.fillStyle = `hsl(${20 + r() * 30},35%,55%)`
  g.fillRect(w * 0.39, h * 0.21, w * 0.22, h * 0.12)
  // The partition's shadow at each side.
  for (const [x0, dir] of [[0, 1], [w, -1]] as const) {
    const sh = g.createLinearGradient(x0, 0, x0 + dir * 40, 0)
    sh.addColorStop(0, 'rgba(60,45,30,.35)')
    sh.addColorStop(1, 'rgba(60,45,30,0)')
    g.fillStyle = sh
    g.fillRect(Math.min(x0, x0 + dir * 40), 0, 40, h)
  }
}

/**
 * The ground floor's back wall, about 20 m of it: the lobby's timber-panelled reception with its
 * desk, then the all-day restaurant with tables, pendants and a back-lit bar.
 */
const lobby: Paint = (g, w, h) => {
  const r = rng(881)
  g.fillStyle = '#cdb99b'
  g.fillRect(0, 0, w, h)
  // Timber fins along the wall.
  for (let x = 0; x < w; x += 22) {
    g.fillStyle = r() < 0.5 ? '#7a5537' : '#6c4a30'
    g.fillRect(x, h * 0.08, 12, h * 0.8)
  }
  // Reception desk, back-lit.
  g.fillStyle = '#efe7da'
  g.fillRect(w * 0.08, h * 0.62, w * 0.22, h * 0.24)
  g.fillStyle = 'rgba(255,226,170,.9)'
  g.fillRect(w * 0.08, h * 0.86, w * 0.22, 4)
  g.fillStyle = '#2b2a28'
  g.font = `600 ${Math.round(h * 0.06)}px Helvetica, Arial, sans-serif`
  g.textAlign = 'center'
  g.fillText('RECEPTION', w * 0.19, h * 0.5)
  // Restaurant: tables and chairs, pendant lights, the bar.
  for (let x = w * 0.38; x < w * 0.82; x += w * 0.07) {
    g.fillStyle = '#5a4130'
    g.fillRect(x, h * 0.74, w * 0.04, 6)
    g.fillRect(x + w * 0.018, h * 0.74, 5, h * 0.14)
    g.fillStyle = '#8a8f86'
    g.fillRect(x - 10, h * 0.76, 10, h * 0.12)
    g.fillRect(x + w * 0.04, h * 0.76, 10, h * 0.12)
    const pg = g.createRadialGradient(x + w * 0.02, h * 0.4, 2, x + w * 0.02, h * 0.4, h * 0.14)
    pg.addColorStop(0, 'rgba(255,214,150,1)')
    pg.addColorStop(1, 'rgba(255,214,150,0)')
    g.fillStyle = pg
    g.fillRect(x - h * 0.12, h * 0.26, h * 0.3, h * 0.3)
    g.fillStyle = '#2a2622'
    g.fillRect(x + w * 0.02 - 1, 0, 2, h * 0.38)
  }
  g.fillStyle = '#3a2e25'
  g.fillRect(w * 0.86, h * 0.3, w * 0.12, h * 0.56)
  g.fillStyle = 'rgba(255,210,140,.8)'
  for (let y = h * 0.34; y < h * 0.6; y += h * 0.09) g.fillRect(w * 0.87, y, w * 0.1, 3)
}

/** Sheer curtain: soft vertical folds, one metre of fabric across. */
const sheer: Paint = (g, w, h) => {
  g.fillStyle = '#f3ede2'
  g.fillRect(0, 0, w, h)
  for (let x = 0; x < w; x++) {
    const v = 0.5 + 0.5 * Math.sin((x / w) * Math.PI * 2 * 6)
    g.fillStyle = `rgba(150,135,110,${0.05 + 0.18 * v})`
    g.fillRect(x, 0, 1, h)
  }
}

/* ---------- materials ---------- */

/**
 * Kallakal Hotel's finishes: the mall's palette (glass, aluminium, paving, asphalt, planting, lamps,
 * car parts, sky reflections), plus the white GRC, polished plaza stone and black mesh of
 * the reference design.
 */
export function hotelMaterials(k: Kit, lighting: Lighting) {
  const base = mallMaterials(k, lighting)
  const tex = (w: number, h: number, paint: Paint) => k.tex.painted(w, h, paint)

  const mesh = tex(256, 256, expandedMetal)
  // UVs on the capsules are in metres; the painted tile is half a metre.
  mesh.repeat.set(2, 2)
  const grcMap = tex(512, 512, grc)
  grcMap.repeat.set(1 / 2.4, 1 / 2.4)
  const stone = (dark: boolean) => {
    const map = tex(512, 512, polished(dark))
    map.repeat.set(1 / 1.2, 1 / 1.2)
    // Polished black granite and honed travertine.
    return std({ map, color: dark ? '#ffffff' : '#d6cfc3', roughness: dark ? 0.12 : 0.3, metalness: dark ? 0.15 : 0.05 })
  }

  return {
    ...base,
    /** White GRC: the sweeping wall, the rounded end walls and the cheeks of the wings. */
    grc: std({ map: grcMap, normalMap: k.tex.normalPainted('hotel_grc', 512, 512, grc, 1 / 2.4, 1 / 2.4), normalScale: new Vector2(0.15, 0.15), roughness: 0.62 }),
    /** The white slab edges: thick, round-nosed bands of white aluminium composite. */
    band: std({ color: '#f2f1ed', metalness: 0.15, roughness: 0.32 }),
    lightStone: stone(false),
    darkStone: stone(true),
    /** The capsules' mesh: black powder-coated expanded metal, seen through. */
    mesh: std({ color: '#1b1c1e', metalness: 0.55, roughness: 0.45, alphaMap: mesh, transparent: true, depthWrite: false, side: DoubleSide }),
    /** Their frames: black steel tube. */
    steel: std({ color: '#1e1f21', metalness: 0.6, roughness: 0.38 }),
    /** Painted finishes at true scale (UVs in metres), one material each so they merge. */
    whiteMetric: base.surface('white', 1, 1),
    greigeMetric: base.surface('greige', 1, 1),
    /** Guest rooms behind the upper floors' glass, lit warm at dusk; one texture repeat per room. */
    room: lighting.glow(std({ map: tex(512, 512, guestRoom), emissive: '#ffffff', emissiveMap: tex(512, 512, guestRoom), emissiveIntensity: 0.5, roughness: 0.9 }), 0.1),
    /** The lobby and restaurant behind the ground floor's glass. */
    lobby: lighting.glow(std({ map: tex(2048, 512, lobby), emissive: '#ffffff', emissiveMap: tex(2048, 512, lobby), emissiveIntensity: 0.55, roughness: 0.9 }), 0.15),
    /** Sheer curtains drawn part-way across the rooms' glass, glowing a little with the room lit behind. */
    curtain: lighting.glow(std({ map: tex(256, 64, sheer), color: '#ffffff', emissive: '#ffe9c8', emissiveIntensity: 0.35, roughness: 0.95, transparent: true, opacity: 0.88, side: DoubleSide }), 0.05),
    /** Interior stair: white treads, dark steel. */
    tread: std({ color: '#ece9e2', roughness: 0.4 }),
  }
}

export type HotelMaterials = ReturnType<typeof hotelMaterials>
