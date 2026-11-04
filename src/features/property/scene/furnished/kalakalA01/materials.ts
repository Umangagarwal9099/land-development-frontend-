import { MeshStandardMaterial, Vector2, type MeshStandardMaterialParameters } from 'three'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import { rng, type Paint } from '../textures'
import { hotelMaterials } from '../kalakalHotel/materials'

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/* ---------- painted surfaces ---------- */

/**
 * Half a metre across by two up of thermally modified pine, the screen's slats: tight straight
 * grain running the length, the odd knot and darker latewood streaks. Each slat is tinted on its
 * own (vertex colour), so no two read alike.
 */
const thermowood: Paint = (g, w, h) => {
  const r = rng(907)
  g.fillStyle = '#b07a48'
  g.fillRect(0, 0, w, h)
  for (let x = 0; x < w; x += 1 + r() * 2) {
    const dark = r() < 0.45
    g.fillStyle = dark ? `rgba(110,66,34,${0.12 + r() * 0.22})` : `rgba(214,160,110,${0.08 + r() * 0.16})`
    // Grain lines wander a little along the board.
    let gx = x
    for (let y = 0; y < h; y += 8) {
      gx += (r() - 0.5) * 0.6
      g.fillRect(gx, y, dark ? 1.4 : 1, 8)
    }
  }
  for (let k = 0; k < 3; k++) {
    const x = r() * w
    const y = r() * h
    const gr = g.createRadialGradient(x, y, 0, x, y, 7)
    gr.addColorStop(0, 'rgba(70,40,20,.75)')
    gr.addColorStop(1, 'rgba(70,40,20,0)')
    g.fillStyle = gr
    g.beginPath()
    g.ellipse(x, y, 6, 14, 0, 0, 7)
    g.fill()
  }
  // Weathering: a slightly greyer, drier tone in patches.
  for (let k = 0; k < 20; k++) {
    g.fillStyle = `rgba(150,130,110,${0.04 + r() * 0.05})`
    g.fillRect(r() * w, r() * h, 8 + r() * 30, 40 + r() * 160)
  }
}

/**
 * One 7.5 m bay of a parking deck seen through the screen, one storey high: the soffit with its
 * battens of light, a column at each end, three cars nose-in along the far side, the floor's painted
 * bay lines, all falling into shadow towards the back.
 */
const deck: Paint = (g, w, h) => {
  const r = rng(913)
  const bg = g.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#5d5e5f')
  bg.addColorStop(0.18, '#3a3b3c')
  bg.addColorStop(0.75, '#2a2b2c')
  bg.addColorStop(1, '#4a4a49')
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  const m = w / 7.5
  // Battens of light along the soffit, the beams' shadows between them.
  for (let x = 0; x < w; x += m * 2.5) {
    g.fillStyle = 'rgba(20,20,22,.5)'
    g.fillRect(x, 0, m * 0.35, h * 0.14)
  }
  for (let x = m * 0.6; x < w; x += m * 1.25) {
    g.fillStyle = '#f3f6f4'
    g.fillRect(x, h * 0.07, m * 0.55, h * 0.025)
    const gl = g.createRadialGradient(x + m * 0.27, h * 0.09, 2, x + m * 0.27, h * 0.09, h * 0.3)
    gl.addColorStop(0, 'rgba(230,240,236,.35)')
    gl.addColorStop(1, 'rgba(230,240,236,0)')
    g.fillStyle = gl
    g.fillRect(x - h * 0.3, 0, m * 0.55 + h * 0.6, h * 0.45)
  }
  // Cars nose-in in 2.5 m bays at the far side, seen from behind and a little smaller with
  // distance: the body, the glasshouse over it, tail lamps, plate and tyres. One metre up is mH.
  const hues = ['#d8d9da', '#1e2023', '#8b9096', '#6d1f1f', '#e9e8e4', '#30435c', '#9a9a92']
  const mH = (h / 2.9) * 0.85
  const floor = h * 0.86
  for (let bay = 0; bay < 3; bay++) {
    if (r() < 0.25) continue
    const cw = m * 1.75 * 0.85
    const x = bay * m * 2.5 + m * 0.2 + (m * 2.5 - cw) / 2 + (r() - 0.5) * m * 0.2
    g.fillStyle = 'rgba(8,8,8,.9)'
    for (const tx of [x + cw * 0.08, x + cw * 0.76]) g.fillRect(tx, floor - mH * 0.32, cw * 0.16, mH * 0.32)
    g.fillStyle = hues[Math.floor(r() * hues.length)]
    g.beginPath()
    g.roundRect(x, floor - mH * 0.95, cw, mH * 0.68, cw * 0.06)
    g.fill()
    g.beginPath()
    g.roundRect(x + cw * 0.1, floor - mH * 1.45, cw * 0.8, mH * 0.55, [cw * 0.12, cw * 0.12, 4, 4])
    g.fill()
    g.fillStyle = 'rgba(25,30,36,.92)'
    g.beginPath()
    g.roundRect(x + cw * 0.15, floor - mH * 1.38, cw * 0.7, mH * 0.4, cw * 0.08)
    g.fill()
    g.fillStyle = 'rgba(190,24,24,.95)'
    g.fillRect(x + cw * 0.03, floor - mH * 0.86, cw * 0.2, mH * 0.12)
    g.fillRect(x + cw * 0.77, floor - mH * 0.86, cw * 0.2, mH * 0.12)
    g.fillStyle = '#e9e7df'
    g.fillRect(x + cw * 0.4, floor - mH * 0.6, cw * 0.2, mH * 0.1)
    g.fillStyle = 'rgba(0,0,0,.35)'
    g.fillRect(x, floor - mH * 0.38, cw, mH * 0.08)
  }
  // Columns in front of them at 7.5 m, three bays apart, lit on one side.
  for (let x = m * 0.0; x < w; x += m * 7.5) {
    const cg = g.createLinearGradient(x, 0, x + m * 0.45, 0)
    cg.addColorStop(0, '#8d8d8a')
    cg.addColorStop(0.6, '#6c6c69')
    cg.addColorStop(1, '#3f3f3e')
    g.fillStyle = cg
    g.fillRect(x, h * 0.12, m * 0.45, h * 0.88)
    g.fillStyle = '#d6b23a'
    g.fillRect(x, h * 0.84, m * 0.45, h * 0.04)
  }
  // The floor: worn concrete, white bay lines receding.
  g.fillStyle = 'rgba(120,120,116,.6)'
  g.fillRect(0, h * 0.84, w, h * 0.16)
  g.fillStyle = 'rgba(235,235,230,.55)'
  for (let x = m * 0.2; x < w; x += m * 2.5) g.fillRect(x, h * 0.86, 3, h * 0.14)
}

/** Shop fascia lightboxes: white names on charcoal, one shop per sixth of the canvas. */
export const SHOP_NAMES = ['CAFÉ BREW', 'PHARMACY', 'BANK · ATM', 'OPTICALS', 'BAKERY', 'SALON'] as const
const fascia: Paint = (g, w, h) => {
  g.fillStyle = '#1d1f22'
  g.fillRect(0, 0, w, h)
  const cw = w / SHOP_NAMES.length
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `700 ${Math.round(h * 0.5)}px Manrope Variable, Helvetica, Arial, sans-serif`
  SHOP_NAMES.forEach((n, i) => g.fillText(n, cw * (i + 0.5), h * 0.54, cw * 0.86))
}

/** The lobby's directory board: levels and what is on them. */
const directory: Paint = (g, w, h) => {
  g.fillStyle = '#16181b'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#ffffff'
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  const rows = [['R', 'ROOF'], ['P3', 'PARKING'], ['P2', 'PARKING'], ['P1', 'PARKING'], ['G', 'SHOPS · LOBBY']]
  rows.forEach(([lv, what], i) => {
    const y = h * (0.14 + i * 0.18)
    g.font = `800 ${Math.round(h * 0.11)}px Helvetica, Arial, sans-serif`
    g.fillStyle = '#e1b12c'
    g.fillText(lv, w * 0.1, y)
    g.font = `600 ${Math.round(h * 0.08)}px Helvetica, Arial, sans-serif`
    g.fillStyle = '#ffffff'
    g.fillText(what, w * 0.32, y)
  })
}

/* ---------- materials ---------- */

/**
 * Plot A-01's finishes: the hotel's palette (itself the mall's: glass, aluminium, paving,
 * asphalt, planting, lamps, signage), plus the timber screen, the panels, the black of the drum
 * and the parking decks seen behind the slats.
 */
export function a01Materials(k: Kit, lighting: Lighting) {
  const base = hotelMaterials(k, lighting)
  const tex = (w: number, h: number, paint: Paint) => k.tex.painted(w, h, paint)

  const wood = tex(256, 1024, thermowood)
  // UVs are in metres; the painted board is half a metre across and two long.
  wood.repeat.set(2, 0.5)
  const deckMap = tex(2048, 512, deck)
  deckMap.repeat.set(1 / 7.5, 1)
  const render = base.grc.clone()
  render.color.set('#e8d9bd')

  return {
    ...base,
    /** The screen's slats: thermowood, oiled, each slat tinted on its own. */
    slat: std({ map: wood, normalMap: k.tex.normalPainted('a01_wood', 256, 1024, thermowood, 2, 0.5), normalScale: new Vector2(0.35, 0.35), vertexColors: true, roughness: 0.72 }),
    /** Charcoal aluminium composite: the ground floor's fascia and piers, rails and corner fins. */
    charcoal: std({ color: '#2d2f32', metalness: 0.35, roughness: 0.42 }),
    /** Mid-grey composite infill panels among the slats, and the lift core. */
    greyPanel: std({ color: '#7f8387', metalness: 0.3, roughness: 0.45 }),
    /** The drum's crown and returns: deep black composite with a satin sheen. */
    black: std({ color: '#121315', metalness: 0.3, roughness: 0.36 }),
    /** Exposed concrete slab edges, a little weathered. */
    slabEdge: std({ color: '#a9a7a2', roughness: 0.88 }),
    /** Cream render on the stair tower. */
    render,
    /** The parking decks behind the screen; their lights glow at night. */
    deck: lighting.glow(std({ map: deckMap, emissive: '#ffffff', emissiveMap: deckMap, emissiveIntensity: 0.55, roughness: 0.95 }), 0.15),
    /** The ramp's LED strip and the lobby's backlit boards. */
    fascia: lighting.glow(std({ map: tex(2048, 128, fascia), emissive: '#ffffff', emissiveMap: tex(2048, 128, fascia), emissiveIntensity: 0.9, roughness: 0.4 }), 0.15),
    directory: lighting.glow(std({ map: tex(256, 512, directory), emissive: '#ffffff', emissiveMap: tex(256, 512, directory), emissiveIntensity: 0.8, roughness: 0.4 }), 0.3),
    /** Lobby floor: honed light terrazzo. */
    terrazzo: std({ color: '#d7d3cb', roughness: 0.3, metalness: 0.03 }),
    /** The ramp's deck: power-floated concrete with a green-grey sealer. */
    rampDeck: std({ color: '#8e958f', roughness: 0.7 }),
  }
}

export type A01Materials = ReturnType<typeof a01Materials>
