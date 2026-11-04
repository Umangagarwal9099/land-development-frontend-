import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, type MeshStandardMaterialParameters } from 'three'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import { rng, type Paint } from '../textures'
import { hotelMaterials } from '../kalakalHotel/materials'

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })
const SANS = (px: number, weight = 700) => `${weight} ${Math.round(px)}px Helvetica, Arial, sans-serif`

/* ---------- interiors seen through the glass ---------- */

/**
 * One ward bay, 3.6 m wide and one storey high, seen from outside: pale sage walls, the bed's head
 * unit with its gas outlets and reading light, the bed in white linen with a pale blue blanket, a
 * monitor on its arm, the privacy curtain half drawn on its track, a recessed light panel above.
 */
const ward: Paint = (g, w, h) => {
  const r = rng(1201)
  const wall = g.createLinearGradient(0, 0, 0, h)
  wall.addColorStop(0, '#dfe6df')
  wall.addColorStop(1, '#ccd6cd')
  g.fillStyle = wall
  g.fillRect(0, 0, w, h)
  // Ceiling, its light panel, and the glow it throws down the wall.
  g.fillStyle = '#eef0ec'
  g.fillRect(0, 0, w, h * 0.1)
  g.fillStyle = '#ffffff'
  g.fillRect(w * 0.3, h * 0.035, w * 0.4, h * 0.035)
  const cove = g.createLinearGradient(0, h * 0.1, 0, h * 0.45)
  cove.addColorStop(0, 'rgba(255,250,236,.55)')
  cove.addColorStop(1, 'rgba(255,250,236,0)')
  g.fillStyle = cove
  g.fillRect(0, h * 0.1, w, h * 0.35)
  // The bed head unit: a long panel with outlets and a reading light over the bed.
  g.fillStyle = '#f3f3ef'
  g.fillRect(w * 0.18, h * 0.42, w * 0.64, h * 0.07)
  for (let i = 0; i < 6; i++) {
    g.fillStyle = ['#2f6fb5', '#e8e8e8', '#222', '#2f9b55', '#e8e8e8', '#c43'][i]
    g.fillRect(w * (0.24 + i * 0.09), h * 0.445, w * 0.025, h * 0.02)
  }
  const lamp = g.createRadialGradient(w * 0.5, h * 0.4, 2, w * 0.5, h * 0.4, h * 0.25)
  lamp.addColorStop(0, 'rgba(255,240,210,.8)')
  lamp.addColorStop(1, 'rgba(255,240,210,0)')
  g.fillStyle = lamp
  g.fillRect(w * 0.2, h * 0.2, w * 0.6, h * 0.4)
  // The monitor on its arm, screen glowing.
  g.fillStyle = '#3a3d40'
  g.fillRect(w * 0.73, h * 0.3, w * 0.012, h * 0.12)
  g.fillStyle = '#202326'
  g.fillRect(w * 0.68, h * 0.24, w * 0.12, h * 0.08)
  g.fillStyle = '#2fd07a'
  g.fillRect(w * 0.69, h * 0.27, w * 0.1, 2)
  g.fillStyle = '#ffd34d'
  g.fillRect(w * 0.69, h * 0.295, w * 0.06, 2)
  // The bed: grey frame and side rails, white sheet, pale blue blanket, pillow at the head.
  g.fillStyle = '#9aa1a6'
  g.fillRect(w * 0.26, h * 0.6, w * 0.48, h * 0.035)
  g.fillRect(w * 0.27, h * 0.635, w * 0.015, h * 0.16)
  g.fillRect(w * 0.715, h * 0.635, w * 0.015, h * 0.16)
  g.fillStyle = '#f7f7f4'
  g.fillRect(w * 0.27, h * 0.53, w * 0.46, h * 0.075)
  g.fillStyle = '#9cc0dd'
  g.fillRect(w * 0.27, h * 0.565, w * 0.46, h * 0.04)
  g.fillStyle = '#ffffff'
  g.fillRect(w * 0.42, h * 0.5, w * 0.16, h * 0.04)
  // The privacy curtain on its ceiling track, pleated, drawn across the left of the bay.
  g.fillStyle = '#b9b9b5'
  g.fillRect(0, h * 0.11, w, 3)
  const drawn = 0.12 + r() * 0.12
  for (let x = 0; x < w * drawn; x += 6) {
    g.fillStyle = (x / 6) % 2 ? '#a9cfd2' : '#9ec4c8'
    g.fillRect(x, h * 0.115, 6, h * 0.7)
  }
  // A visitor's chair and the floor's sheen.
  g.fillStyle = '#4f6d8c'
  g.fillRect(w * 0.82, h * 0.66, w * 0.1, h * 0.06)
  g.fillRect(w * 0.82, h * 0.58, w * 0.025, h * 0.1)
  g.fillStyle = '#b8c0b9'
  g.fillRect(0, h * 0.82, w, h * 0.18)
  // The partitions' shadow at each side of the bay.
  for (const [x0, dir] of [[0, 1], [w, -1]] as const) {
    const sh = g.createLinearGradient(x0, 0, x0 + dir * 30, 0)
    sh.addColorStop(0, 'rgba(60,70,62,.35)')
    sh.addColorStop(1, 'rgba(60,70,62,0)')
    g.fillStyle = sh
    g.fillRect(Math.min(x0, x0 + dir * 30), 0, 30, h)
  }
}

/**
 * Behind the main block's curtain wall, 8 m of a floor's lounge seen through tinted glass: pale
 * walls under a ceiling of light panels, a counter, a row of chairs and a planter, all muted, the
 * corridor's light falling away behind.
 */
const lounge: Paint = (g, w, h) => {
  const r = rng(1213)
  const wall = g.createLinearGradient(0, 0, 0, h)
  wall.addColorStop(0, '#c9cdca')
  wall.addColorStop(0.7, '#b9bdb9')
  wall.addColorStop(1, '#9fa39f')
  g.fillStyle = wall
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#dcdfdc'
  g.fillRect(0, 0, w, h * 0.1)
  for (let x = w * 0.04; x < w; x += w * 0.125) {
    g.fillStyle = '#f6f4ec'
    g.fillRect(x, h * 0.04, w * 0.06, h * 0.025)
    const glow = g.createRadialGradient(x + w * 0.03, h * 0.12, 2, x + w * 0.03, h * 0.12, h * 0.35)
    glow.addColorStop(0, 'rgba(255,248,232,.28)')
    glow.addColorStop(1, 'rgba(255,248,232,0)')
    g.fillStyle = glow
    g.fillRect(x - h * 0.3, 0, w * 0.06 + h * 0.6, h * 0.5)
  }
  // Doors and openings along the back, darker.
  for (let x = w * 0.02; x < w; x += w * (0.18 + r() * 0.1)) {
    g.fillStyle = `rgba(70,76,74,${0.25 + r() * 0.2})`
    g.fillRect(x, h * 0.28, w * 0.07, h * 0.5)
  }
  // A counter, chairs in a row and a planter, as quiet silhouettes.
  g.fillStyle = '#d8d5cc'
  g.fillRect(w * 0.12, h * 0.6, w * 0.3, h * 0.18)
  g.fillStyle = 'rgba(120,90,60,.45)'
  g.fillRect(w * 0.12, h * 0.6, w * 0.3, h * 0.03)
  for (let x = w * 0.55; x < w * 0.84; x += w * 0.045) {
    g.fillStyle = '#56687a'
    g.fillRect(x, h * 0.63, w * 0.034, h * 0.1)
  }
  g.fillStyle = '#4c5a43'
  g.beginPath()
  g.ellipse(w * 0.92, h * 0.6, w * 0.03, h * 0.1, 0, 0, 7)
  g.fill()
  g.fillStyle = '#8f938f'
  g.fillRect(0, h * 0.8, w, h * 0.2)
}

/**
 * About 20 m of the ground floor's back wall: the reception counter under its sign, the queue
 * screens and the pharmacy window, rows of waiting chairs, wayfinding hung from the ceiling.
 */
const hall: Paint = (g, w, h) => {
  const r = rng(1223)
  const wall = g.createLinearGradient(0, 0, 0, h)
  wall.addColorStop(0, '#e9e7e0')
  wall.addColorStop(1, '#d9d4c8')
  g.fillStyle = wall
  g.fillRect(0, 0, w, h)
  // Ceiling with its light panels, and their wash.
  g.fillStyle = '#f2f1ec'
  g.fillRect(0, 0, w, h * 0.12)
  for (let x = 20; x < w; x += 110) {
    g.fillStyle = '#ffffff'
    g.fillRect(x, h * 0.05, 60, h * 0.03)
  }
  // Timber-clad wall behind reception, its counter lit along the foot.
  g.fillStyle = '#a77b52'
  g.fillRect(w * 0.06, h * 0.22, w * 0.3, h * 0.5)
  for (let x = w * 0.06; x < w * 0.36; x += 14) {
    g.fillStyle = r() < 0.5 ? 'rgba(70,45,25,.25)' : 'rgba(255,230,200,.1)'
    g.fillRect(x, h * 0.22, 4, h * 0.5)
  }
  g.fillStyle = '#f7f6f2'
  g.fillRect(w * 0.08, h * 0.6, w * 0.26, h * 0.2)
  g.fillStyle = 'rgba(255,226,170,.9)'
  g.fillRect(w * 0.08, h * 0.8, w * 0.26, 4)
  g.fillStyle = '#ffffff'
  g.font = SANS(h * 0.065)
  g.textAlign = 'center'
  g.fillText('RECEPTION', w * 0.21, h * 0.34)
  // Queue display screens.
  for (const x of [0.39, 0.45]) {
    g.fillStyle = '#16191c'
    g.fillRect(w * x, h * 0.3, w * 0.05, h * 0.12)
    g.fillStyle = '#2b6fc2'
    g.fillRect(w * x + 4, h * 0.3 + 4, w * 0.05 - 8, h * 0.12 - 8)
  }
  // The pharmacy window.
  g.fillStyle = '#1f6f5c'
  g.fillRect(w * 0.55, h * 0.24, w * 0.18, h * 0.07)
  g.fillStyle = '#ffffff'
  g.font = SANS(h * 0.05)
  g.fillText('PHARMACY', w * 0.64, h * 0.29)
  g.fillStyle = '#dfe6e3'
  g.fillRect(w * 0.55, h * 0.33, w * 0.18, h * 0.26)
  g.fillStyle = '#eeeeea'
  g.fillRect(w * 0.55, h * 0.59, w * 0.18, h * 0.2)
  // Waiting chairs in rows, seen past each other.
  for (const [y, x0, x1] of [[0.66, 0.38, 0.54], [0.7, 0.76, 0.97]] as const)
    for (let x = w * x0; x < w * x1; x += w * 0.018) {
      g.fillStyle = '#2f5f8f'
      g.fillRect(x, h * y, w * 0.014, h * 0.05)
      g.fillRect(x, h * (y - 0.07), w * 0.014, h * 0.07)
    }
  // Wayfinding hung from the ceiling.
  g.fillStyle = '#1d3f6e'
  g.fillRect(w * 0.76, h * 0.15, w * 0.2, h * 0.07)
  g.fillStyle = '#ffffff'
  g.font = SANS(h * 0.04)
  g.fillText('OPD  ·  LAB  ·  RADIOLOGY  →', w * 0.86, h * 0.2)
  g.fillStyle = '#b7b1a5'
  g.fillRect(0, h * 0.82, w, h * 0.18)
}

/* ---------- signs and livery ---------- */

/** The wayfinding monolith at the gate: dark blue-grey, white rows, emergency in red, with arrows. */
const directory: Paint = (g, w, h) => {
  g.fillStyle = '#2a3440'
  g.fillRect(0, 0, w, h)
  const rows: [string, string, string][] = [
    ['MAIN ENTRANCE', '→', '#ffffff'],
    ['OUTPATIENT', '↑', '#ffffff'],
    ['EMERGENCY', '→', '#ff3b30'],
    ['PARKING', '←', '#ffffff'],
  ]
  rows.forEach(([text, arrow, colour], i) => {
    const y = h * (0.16 + i * 0.22)
    g.fillStyle = 'rgba(255,255,255,.18)'
    g.fillRect(w * 0.06, y + h * 0.08, w * 0.88, 2)
    g.fillStyle = colour
    g.font = SANS(h * 0.075)
    g.textAlign = 'left'
    g.textBaseline = 'middle'
    g.fillText(text, w * 0.08, y)
    g.font = SANS(h * 0.1)
    g.textAlign = 'right'
    g.fillText(arrow, w * 0.92, y)
  })
}

/** A red cross on white: the emergency entrance's lightbox. */
const redCross: Paint = (g, w, h) => {
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#d71920'
  g.fillRect(w * 0.38, h * 0.14, w * 0.24, h * 0.72)
  g.fillRect(w * 0.14, h * 0.38, w * 0.72, h * 0.24)
}

/** The basement ramp's sign: white on blue. */
const basementSign: Paint = (g, w, h) => {
  g.fillStyle = '#1d4f91'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = SANS(h * 0.5, 800)
  g.fillText('P', h * 0.5, h * 0.52)
  g.font = SANS(h * 0.28)
  g.textAlign = 'left'
  g.fillText('BASEMENT PARKING  ·  2.4 m', h * 1.0, h * 0.52)
}

/**
 * An ambulance's side, front to back along the canvas: white, a red band at the waist with blue
 * chevrons towards the rear, AMBULANCE in red above it and the blue star of life on the box.
 */
const livery: Paint = (g, w, h) => {
  g.fillStyle = '#f6f6f3'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#d0161e'
  g.fillRect(0, h * 0.58, w, h * 0.1)
  for (let x = w * 0.78; x < w; x += w * 0.06) {
    g.fillStyle = '#1b4fa0'
    g.beginPath()
    g.moveTo(x, h * 0.72)
    g.lineTo(x + w * 0.03, h * 0.72)
    g.lineTo(x + w * 0.06, h * 0.9)
    g.lineTo(x + w * 0.03, h * 0.9)
    g.fill()
  }
  g.fillStyle = '#d0161e'
  g.font = SANS(h * 0.13, 800)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('AMBULANCE', w * 0.58, h * 0.47)
  // The star of life on the box.
  const cx = w * 0.82
  const cy = h * 0.3
  g.fillStyle = '#1b4fa0'
  for (let i = 0; i < 3; i++) {
    g.save()
    g.translate(cx, cy)
    g.rotate((i * Math.PI) / 3)
    g.fillRect(-h * 0.035, -h * 0.13, h * 0.07, h * 0.26)
    g.restore()
  }
  g.fillStyle = '#ffffff'
  g.fillRect(cx - 1.5, cy - h * 0.09, 3, h * 0.18)
}

/** Tactile warning paving at the kerbs: yellow, a grid of domes. */
const tactile: Paint = (g, w, h) => {
  g.fillStyle = '#e1b324'
  g.fillRect(0, 0, w, h)
  const n = 6
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x = ((i + 0.5) / n) * w
      const y = ((j + 0.5) / n) * h
      const gr = g.createRadialGradient(x - 3, y - 3, 1, x, y, w / n / 3)
      gr.addColorStop(0, '#f6d86a')
      gr.addColorStop(1, '#b88d12')
      g.fillStyle = gr
      g.beginPath()
      g.arc(x, y, w / n / 3, 0, 7)
      g.fill()
    }
  g.fillStyle = 'rgba(0,0,0,.25)'
  g.fillRect(0, 0, w, 2)
  g.fillRect(0, 0, 2, h)
}

/* ---------- materials ---------- */

/**
 * The hospital's finishes: the hotel's palette (itself the mall's: paving, asphalt, planting,
 * lamps, the white GRC and composite) plus its blue curtain glass and ward windows, the rooms
 * behind them, the signs and the ambulance's livery.
 */
export function hospitalMaterials(k: Kit, lighting: Lighting) {
  const base = hotelMaterials(k, lighting)
  const tex = (w: number, h: number, paint: Paint) => k.tex.painted(w, h, paint)
  const glowing = (w: number, h: number, paint: Paint, intensity: number, dayFactor: number) => {
    const map = tex(w, h, paint)
    return lighting.glow(std({ map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: intensity, roughness: 0.9 }), dayFactor)
  }
  const wardMat = glowing(512, 512, ward, 0.5, 0.12)
  // One ward bay per repeat, each lit (or not) on its own.
  wardMat.vertexColors = true
  const tactileMap = tex(256, 256, tactile)
  tactileMap.repeat.set(1 / 0.3, 1 / 0.3)

  return {
    ...base,
    /** The cladding: white GRC panels, the frame round the main block and the tower's walls. */
    wall: base.grc,
    /**
     * The curtain walls: blue-grey solar-control glass, reflective by day, the lit floors showing
     * through at dusk. Each pane carries its own slight tint.
     */
    curtainGlass: new MeshPhysicalMaterial({ color: '#48657c', metalness: 0.2, roughness: 0.035, ior: 1.52, specularIntensity: 1, transparent: true, opacity: 0.72, depthWrite: false, vertexColors: true }),
    /** Spandrel glass at the floor lines: the same glass, opaque, backed dark. */
    spandrel: new MeshPhysicalMaterial({ color: '#33495b', metalness: 0.25, roughness: 0.06, ior: 1.52, specularIntensity: 1 }),
    /** The wards' and punched windows' glass: clearer, a cool reflection. */
    windowGlass: new MeshPhysicalMaterial({ color: '#5b7484', metalness: 0.1, roughness: 0.03, ior: 1.52, specularIntensity: 1, transparent: true, opacity: 0.55, depthWrite: false }),
    /** Silver anodised mullions, transoms and window frames. */
    silver: std({ color: '#b3b8bd', metalness: 0.7, roughness: 0.34 }),
    /** Interiors behind the glass: wards, the main block's lounges, the ground floor's halls. */
    ward: wardMat,
    lounge: glowing(1024, 512, lounge, 0.4, 0.12),
    hall: glowing(2048, 512, hall, 0.6, 0.2),
    /** The blue cross on the name band, lit from within. */
    crossBlue: lighting.glow(std({ color: '#1f5fbf', emissive: '#2a74ff', emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.35 }), 0.12),
    /** Emergency red: the ER's lightbox frame and the canopy's signal stripe. */
    redPanel: std({ color: '#c3161d', metalness: 0.25, roughness: 0.4 }),
    redCross: glowing(256, 256, redCross, 1.2, 0.3),
    directory: glowing(512, 768, directory, 0.7, 0.25),
    basementSign: glowing(1024, 128, basementSign, 0.8, 0.3),
    /** Louvres to the plant rooms and the generator enclosures. */
    louvre: std({ color: '#8d9297', metalness: 0.55, roughness: 0.45 }),
    tactile: std({ map: tactileMap, roughness: 0.7 }),
    /** Expanded vermiculite cool-roof coating over the membrane, a little dirtied. */
    roofDeck: std({ color: '#a4a39d', roughness: 0.95 }),
    /** The ambulance: its livery, body white, dark glass, light bar and tyres. */
    livery: std({ map: tex(1024, 256, livery), roughness: 0.35, metalness: 0.1 }),
    vanWhite: std({ color: '#f4f4f1', roughness: 0.32, metalness: 0.15 }),
    vanGlass: std({ color: '#1a2027', roughness: 0.08, metalness: 0.4 }),
    tyre: std({ color: '#1b1b1c', roughness: 0.85 }),
    beaconRed: lighting.glow(std({ color: '#d0161e', emissive: '#ff2020', emissiveIntensity: 1.4, roughness: 0.3 }), 0.25),
    beaconBlue: lighting.glow(std({ color: '#1b4fa0', emissive: '#2a6cff', emissiveIntensity: 1.4, roughness: 0.3 }), 0.25),
    /** The liquid oxygen tank: white, glossy; and its vaporiser fins. */
    tank: std({ color: '#f1f2f0', roughness: 0.3, metalness: 0.2 }),
    /** Glass balustrade on the podium garden's edge. */
    balustrade: new MeshPhysicalMaterial({ color: '#dfeeea', roughness: 0.02, transparent: true, opacity: 0.2, depthWrite: false, side: DoubleSide }),
  }
}

export type HospitalMaterials = ReturnType<typeof hospitalMaterials>
