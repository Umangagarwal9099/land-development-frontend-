import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, Vector2, type MeshStandardMaterialParameters } from 'three'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import { rng, type Paint } from '../textures'
import { hotelMaterials } from './materials'
import { siren } from '../kalakalMall/interior/shops/cafeArt'

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/* ---------- interiors seen through the podium's glass ---------- */

/**
 * The lobby's back wall, about 24 m of it, 8 m high: bookmatched stone panels between bronze fins,
 * a back-lit onyx reception wall with the desk before it, warm coves, tall planters.
 */
const lobbyWall: Paint = (g, w, h) => {
  const r = rng(907)
  const base = g.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, '#d8c7ad')
  base.addColorStop(1, '#a88f70')
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  // Stone panels with soft veins, between bronze fins every metre.
  const m = w / 24
  for (let x = 0; x < w; x += m) {
    g.fillStyle = `rgba(${r() < 0.5 ? '245,236,222' : '210,196,176'},.35)`
    g.fillRect(x, 0, m, h)
    for (let k = 0; k < 3; k++) {
      g.strokeStyle = 'rgba(150,128,100,.25)'
      g.lineWidth = 1 + r() * 2
      g.beginPath()
      g.moveTo(x + r() * m, 0)
      g.bezierCurveTo(x + r() * m, h * 0.3, x + r() * m, h * 0.6, x + r() * m, h)
      g.stroke()
    }
    g.fillStyle = '#5b4026'
    g.fillRect(x, 0, m * 0.07, h)
  }
  // The onyx wall, lit from behind, and the desk.
  const ox = w * 0.38
  const ow = w * 0.24
  const on = g.createRadialGradient(ox + ow / 2, h * 0.55, 10, ox + ow / 2, h * 0.55, ow * 0.7)
  on.addColorStop(0, '#ffe7b8')
  on.addColorStop(1, '#d6a463')
  g.fillStyle = on
  g.fillRect(ox, h * 0.18, ow, h * 0.6)
  g.fillStyle = '#3a2a1c'
  g.fillRect(ox - 10, h * 0.78, ow + 20, h * 0.12)
  g.fillStyle = 'rgba(255,226,170,.9)'
  g.fillRect(ox - 10, h * 0.9, ow + 20, 3)
  // Warm cove along the top, and wall washers' scallops.
  const cove = g.createLinearGradient(0, 0, 0, h * 0.2)
  cove.addColorStop(0, 'rgba(255,232,190,.9)')
  cove.addColorStop(1, 'rgba(255,232,190,0)')
  g.fillStyle = cove
  g.fillRect(0, 0, w, h * 0.2)
  for (let x = m * 1.5; x < w; x += m * 3) {
    const sc = g.createRadialGradient(x, h * 0.1, 2, x, h * 0.25, h * 0.35)
    sc.addColorStop(0, 'rgba(255,236,200,.55)')
    sc.addColorStop(1, 'rgba(255,236,200,0)')
    g.fillStyle = sc
    g.fillRect(x - h * 0.35, 0, h * 0.7, h * 0.6)
  }
  // Tall planters with olive trees either side of the reception.
  for (const px of [0.3, 0.68]) {
    const x = w * px
    g.fillStyle = '#2c2a27'
    g.fillRect(x - 16, h * 0.82, 32, h * 0.18)
    g.fillStyle = 'rgba(70,84,52,.85)'
    for (let k = 0; k < 40; k++) {
      g.beginPath()
      g.ellipse(x + (r() - 0.5) * 70, h * (0.5 + r() * 0.28), 9, 5, r() * 3, 0, 7)
      g.fill()
    }
  }
}

/**
 * The podium's upper floors behind the glass, 12 m of them: restaurant, bar and pre-function
 * spaces in warm timber and stone, pendant lights, tables, a lit back bar here and there.
 */
const floorWall: Paint = (g, w, h) => {
  const r = rng(913)
  const base = g.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, '#cdb594')
  base.addColorStop(1, '#8c7254')
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  let x = 0
  while (x < w) {
    const bay = w * (0.12 + r() * 0.16)
    const kind = r()
    if (kind < 0.35) {
      // Timber slats.
      for (let s = x; s < x + bay; s += 9) {
        g.fillStyle = r() < 0.5 ? '#6f4c30' : '#7d5838'
        g.fillRect(s, 0, 6, h)
      }
    } else if (kind < 0.55) {
      // A back bar: lit shelves of bottles.
      g.fillStyle = '#2d241d'
      g.fillRect(x, h * 0.15, bay, h * 0.7)
      for (let y = h * 0.25; y < h * 0.75; y += h * 0.13) {
        g.fillStyle = 'rgba(255,214,150,.95)'
        g.fillRect(x + 4, y, bay - 8, 3)
        for (let b = x + 8; b < x + bay - 8; b += 7) {
          g.fillStyle = `hsla(${20 + r() * 40},50%,${30 + r() * 30}%,.9)`
          g.fillRect(b, y - 16, 4, 16)
        }
      }
    } else {
      // Stone with a framed piece of art.
      g.fillStyle = r() < 0.5 ? '#e1d5c3' : '#cfc0a8'
      g.fillRect(x, 0, bay, h)
      g.fillStyle = '#2e2924'
      g.fillRect(x + bay * 0.25, h * 0.25, bay * 0.5, h * 0.3)
      g.fillStyle = `hsl(${r() * 50 + 10},30%,${45 + r() * 15}%)`
      g.fillRect(x + bay * 0.25 + 4, h * 0.25 + 4, bay * 0.5 - 8, h * 0.3 - 8)
    }
    x += bay
  }
  // Pendants, and tables and chairs in silhouette along the floor.
  for (let px = w * 0.04; px < w; px += w * (0.05 + r() * 0.04)) {
    const pg = g.createRadialGradient(px, h * 0.3, 2, px, h * 0.3, h * 0.2)
    pg.addColorStop(0, 'rgba(255,220,160,1)')
    pg.addColorStop(1, 'rgba(255,220,160,0)')
    g.fillStyle = pg
    g.fillRect(px - h * 0.2, h * 0.1, h * 0.4, h * 0.4)
    g.fillStyle = 'rgba(40,30,22,.85)'
    g.fillRect(px - 1, 0, 2, h * 0.28)
    g.fillRect(px - 26, h * 0.72, 52, 5)
    g.fillRect(px - 3, h * 0.72, 6, h * 0.2)
    g.fillRect(px - 38, h * 0.76, 10, h * 0.16)
    g.fillRect(px + 28, h * 0.76, 10, h * 0.16)
  }
  const cove = g.createLinearGradient(0, 0, 0, h * 0.15)
  cove.addColorStop(0, 'rgba(255,236,204,.8)')
  cove.addColorStop(1, 'rgba(255,236,204,0)')
  g.fillStyle = cove
  g.fillRect(0, 0, w, h * 0.15)
}

/** A plasterboard ceiling, 3 m of it, with linear light slots on a 1.5 m grid and downlights between. */
const slotCeiling = (lit: boolean): Paint => (g, w, h) => {
  // Lit, the whole ceiling glows softly with the room's light, the slots bright.
  g.fillStyle = lit ? '#4a3d30' : '#e4e0d8'
  g.fillRect(0, 0, w, h)
  g.fillStyle = lit ? '#fff1d8' : '#fbf7ef'
  g.fillRect(0, h * 0.25 - 3, w, 6)
  g.fillRect(0, h * 0.75 - 3, w, 6)
  for (const [x, y] of [[0.25, 0.5], [0.75, 0.5], [0.25, 0], [0.75, 0]]) {
    g.beginPath()
    g.arc(x * w, y * h, 6, 0, 7)
    g.fill()
  }
}

/* ---------- the cup ---------- */

/**
 * 1.2 m of the cup's board-formed concrete in a warm taupe: 150 mm boards running round it, each a
 * little different in tone, tie holes in rows, a fine pour line.
 */
const cupConcrete: Paint = (g, w, h) => {
  const r = rng(941)
  g.fillStyle = '#a99a85'
  g.fillRect(0, 0, w, h)
  const n = 8
  const bh = h / n
  for (let i = 0; i < n; i++) {
    const d = (r() - 0.5) * 14
    g.fillStyle = `rgb(${172 + d},${157 + d},${136 + d})`
    g.fillRect(0, i * bh, w, bh)
    for (let k = 0; k < 900; k++) {
      g.fillStyle = `rgba(${r() < 0.5 ? '120,108,92' : '214,204,188'},${0.08 + r() * 0.12})`
      g.fillRect(r() * w, i * bh + r() * bh, 1 + r() * 2, 1)
    }
    g.fillStyle = 'rgba(96,84,70,.35)'
    g.fillRect(0, i * bh, w, 1.5)
  }
  g.fillStyle = 'rgba(80,70,60,.5)'
  for (let x = w * 0.25; x < w; x += w * 0.5)
    for (const y of [0.25, 0.75]) {
      g.beginPath()
      g.arc(x, y * h, 3, 0, 7)
      g.fill()
    }
}

/**
 * The café's back wall, 10 m by 4 m: shelving of mugs, tumblers and coffee bags in pale oak, lit
 * from above, between dark green panels, with the menu boards over the counter.
 */
const cafeWall: Paint = (g, w, h) => {
  const r = rng(953)
  g.fillStyle = '#d8b88c'
  g.fillRect(0, 0, w, h)
  const glow = g.createLinearGradient(0, 0, 0, h)
  glow.addColorStop(0, 'rgba(255,226,170,.7)')
  glow.addColorStop(0.5, 'rgba(255,226,170,0)')
  g.fillStyle = glow
  g.fillRect(0, 0, w, h)
  const bays = 6
  const bw = w / bays
  for (let b = 0; b < bays; b++) {
    const x = b * bw
    if (b === 2 || b === 3) {
      // The menu boards over the counter, on a dark green wall.
      g.fillStyle = '#1e3932'
      g.fillRect(x, 0, bw, h)
      g.fillStyle = '#26453c'
      g.fillRect(x + bw * 0.08, h * 0.12, bw * 0.84, h * 0.3)
      g.fillStyle = 'rgba(255,255,255,.75)'
      for (let l = 0; l < 6; l++) g.fillRect(x + bw * 0.14, h * (0.16 + l * 0.04), bw * (0.4 + r() * 0.3), 3)
      continue
    }
    g.fillStyle = '#c99d6b'
    g.fillRect(x + 4, 0, bw - 8, h)
    for (let y = h * 0.2; y < h * 0.9; y += h * 0.14) {
      g.fillStyle = '#e8cfa8'
      g.fillRect(x + 6, y, bw - 12, 5)
      g.fillStyle = 'rgba(255,230,180,.8)'
      g.fillRect(x + 6, y + 5, bw - 12, 2)
      for (let p = x + 10; p < x + bw - 16; p += 12 + r() * 8) {
        const kind = r()
        g.fillStyle = kind < 0.4 ? '#00704a' : kind < 0.6 ? '#f4f1ea' : kind < 0.8 ? '#2b2522' : '#b3301e'
        const ph = 18 + r() * 22
        g.fillRect(p, y - ph, 9 + r() * 6, ph)
      }
    }
  }
}

/* ---------- the pool ---------- */

/** 0.6 m of glass mosaic, 25 mm tiles in blended aquas and whites, grouted white. */
const mosaic: Paint = (g, w, h) => {
  const r = rng(961)
  g.fillStyle = '#f2f4f2'
  g.fillRect(0, 0, w, h)
  const n = 24
  const t = w / n
  const tones = ['#7fc6c9', '#8fd0d0', '#6db8be', '#a7dcdb', '#5aaab4', '#c6e8e6']
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      g.fillStyle = tones[Math.floor(r() * r() * tones.length)]
      g.fillRect(i * t + 1, j * t + 1, t - 2, t - 2)
    }
}

/** 2.4 m of the pool deck: honed ivory travertine pavers, 600 × 1200, laid in running bond. */
const travertine: Paint = (g, w, h) => {
  const r = rng(967)
  g.fillStyle = '#d9cdb8'
  g.fillRect(0, 0, w, h)
  const pw = w / 2
  const ph = h / 4
  for (let j = 0; j < 4; j++)
    for (let i = -1; i < 3; i++) {
      const x = i * pw + (j % 2 ? pw / 2 : 0)
      const d = (r() - 0.5) * 16
      g.fillStyle = `rgb(${226 + d},${216 + d},${197 + d})`
      g.fillRect(x + 1.5, j * ph + 1.5, pw - 3, ph - 3)
      for (let k = 0; k < 10; k++) {
        g.fillStyle = `rgba(${r() < 0.5 ? '190,172,146' : '242,236,224'},${0.2 + r() * 0.2})`
        g.fillRect(x, j * ph + r() * ph, pw, 1 + r() * 2)
      }
      for (let k = 0; k < 40; k++) {
        g.fillStyle = 'rgba(170,150,120,.4)'
        g.fillRect(x + r() * pw, j * ph + r() * ph, 1 + r() * 4, 1 + r())
      }
    }
}

/** Fine wind ripples on the water, as a height field for its normal map. */
const ripples: Paint = (g, w, h) => {
  const r = rng(971)
  g.fillStyle = '#808080'
  g.fillRect(0, 0, w, h)
  for (let k = 0; k < 260; k++) {
    const x = r() * w
    const y = r() * h
    const rad = 6 + r() * 26
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    const v = r() < 0.5 ? 255 : 0
    gr.addColorStop(0, `rgba(${v},${v},${v},.22)`)
    gr.addColorStop(1, `rgba(${v},${v},${v},0)`)
    g.fillStyle = gr
    // Wrapped, so the tile repeats without seams.
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2)
  }
}

/* ---------- materials ---------- */

/**
 * Terranova Hotel's finishes: the shared hotel palette (the mall's paving, asphalt, planting, lamps,
 * car parts and sky reflections, which Terranova Square and the hospital build on too), plus the
 * references' silver cladding, curtain walls and LED lines, the cup's concrete and white lid, and
 * the pool's water, mosaic and travertine.
 */
export function terranovaMaterials(k: Kit, lighting: Lighting) {
  const base = hotelMaterials(k, lighting)
  const tex = (w: number, h: number, paint: Paint) => k.tex.painted(w, h, paint)
  const glow = (p: MeshStandardMaterialParameters, day: number) => lighting.glow(std(p), day)

  const metric = (w: number, h: number, paint: Paint, mw: number, mh: number) => {
    const t = tex(w, h, paint)
    t.repeat.set(1 / mw, 1 / mh)
    return t
  }
  const concreteMap = metric(512, 512, cupConcrete, 1.2, 1.2)
  const water = new MeshPhysicalMaterial({ color: '#1f7d86', transparent: true, opacity: 0.8, roughness: 0.03, metalness: 0, ior: 1.33, clearcoat: 1, clearcoatRoughness: 0.04, emissive: '#0b4a55', emissiveIntensity: 0.12, depthWrite: false })
  water.normalMap = k.tex.normalPainted('hotel_ripples', 256, 256, ripples, 1 / 3.2, 1 / 3.2)
  water.normalScale = new Vector2(0.18, 0.18)
  const sirenMap = tex(512, 512, siren)

  return {
    ...base,
    /** The podium's vision glass: clear, cool, reflective; the lit floors show through at dusk (index.ts). */
    glass: new MeshPhysicalMaterial({ color: '#5f7480', metalness: 0.15, roughness: 0.03, ior: 1.52, specularIntensity: 1, transparent: true, opacity: 0.38, depthWrite: false }),
    /** Back-painted spandrel glass over the slab edges. */
    spandrel: std({ color: '#66737e', metalness: 0.45, roughness: 0.18 }),
    /** Silver aluminium composite: the swoosh band, the drum's blade, the canopy, the roofs. */
    silver: std({ color: '#dfe2e5', metalness: 0.5, roughness: 0.3 }),
    /** The canopy's soffit, a satin silver a shade darker. */
    soffitSilver: std({ color: '#c3c7cb', metalness: 0.45, roughness: 0.38, side: DoubleSide }),
    /** Mullions and fins: silver anodised aluminium. */
    fin: std({ color: '#b3bac0', metalness: 0.55, roughness: 0.32 }),
    /** Warm-white LED lines: the canopy's edges, its soffit grid, the drum's soffit. */
    led: glow({ color: '#fff5e4', emissive: '#ffd49a', emissiveIntensity: 2.4, roughness: 0.4 }, 0.3),
    /** Brushed stainless columns. */
    stainless: std({ color: '#e1e4e7', metalness: 0.8, roughness: 0.16 }),
    /** What shows through the glass: the lobby's wall, the floors above, their ceilings. */
    lobbyWall: glow({ map: tex(2048, 680, lobbyWall), emissive: '#ffffff', emissiveMap: tex(2048, 680, lobbyWall), emissiveIntensity: 0.6, roughness: 0.85 }, 0.18),
    /** UVs in metres: 12 m of wall per repeat, one podium storey (to the ceiling) high. */
    floorWall: glow({ map: metric(1024, 256, floorWall, 12, 3.55), emissive: '#ffffff', emissiveMap: metric(1024, 256, floorWall, 12, 3.55), emissiveIntensity: 0.55, roughness: 0.9 }, 0.15),
    slotCeiling: glow({ map: metric(256, 256, slotCeiling(false), 3, 3), emissive: '#ffffff', emissiveMap: metric(256, 256, slotCeiling(true), 3, 3), emissiveIntensity: 1.4, roughness: 0.85 }, 0.2),
    lobbyFloor: std({ color: '#d9d1c3', roughness: 0.16, metalness: 0.05 }),
    /** The cup: board-formed concrete, the white lid, bronze mullions, the siren, the café behind. */
    cupConcrete: std({ map: concreteMap, normalMap: k.tex.normalPainted('hotel_cup_concrete', 512, 512, cupConcrete, 1 / 1.2, 1 / 1.2), normalScale: new Vector2(0.35, 0.35), roughness: 0.82 }),
    lid: std({ color: '#f2f1ec', roughness: 0.34, metalness: 0.02 }),
    bronze: std({ color: '#4b3d2f', metalness: 0.65, roughness: 0.38 }),
    siren: glow({ map: sirenMap, emissive: '#ffffff', emissiveMap: sirenMap, emissiveIntensity: 0.55, roughness: 0.35, transparent: true, alphaTest: 0.4 }, 0.12),
    sirenBack: std({ color: '#1d2b26', roughness: 0.5, metalness: 0.3 }),
    cafeWall: glow({ map: tex(1024, 400, cafeWall), emissive: '#ffffff', emissiveMap: tex(1024, 400, cafeWall), emissiveIntensity: 0.6, roughness: 0.85 }, 0.2),
    cafeCeiling: glow({ color: '#e9dcc6', emissive: '#ffe1b0', emissiveIntensity: 0.25, roughness: 0.9, side: DoubleSide }, 0.3),
    cove: glow({ color: '#fff3dc', emissive: '#ffd08a', emissiveIntensity: 2.2, roughness: 0.5 }, 0.3),
    oak: std({ color: '#b98f5f', roughness: 0.6 }),
    darkTimber: std({ color: '#3a2c22', roughness: 0.55 }),
    greenPanel: std({ color: '#1e3932', roughness: 0.6 }),
    stool: std({ color: '#2a2724', metalness: 0.5, roughness: 0.45 }),
    /** The pool: water, its mosaic, the travertine deck, teak and cushions, umbrella canvas. */
    water,
    mosaic: std({ map: metric(512, 512, mosaic, 0.6, 0.6), roughness: 0.25 }),
    travertine: std({ map: metric(512, 512, travertine, 2.4, 2.4), normalMap: k.tex.normalPainted('hotel_travertine', 512, 512, travertine, 1 / 2.4, 1 / 2.4), normalScale: new Vector2(0.25, 0.25), roughness: 0.62 }),
    poolCoping: std({ color: '#ece4d4', roughness: 0.5 }),
    teak: base.surface('teak', 1, 1),
    cushion: std({ color: '#f1ede4', roughness: 0.95 }),
    canvas: std({ color: '#efe8da', roughness: 0.9, side: DoubleSide }),
    poolLight: glow({ color: '#e8fbff', emissive: '#bff3ff', emissiveIntensity: 2.2, roughness: 0.3 }, 0),
    /** The pool's waterline band of deep blue glass tile, and falling water from the blades. */
    waterline: std({ color: '#1d4a5c', roughness: 0.15, metalness: 0.1 }),
    waterSheet: lighting.glow(new MeshPhysicalMaterial({ color: '#cfeff2', transparent: true, opacity: 0.55, roughness: 0.05, ior: 1.33, emissive: '#7fd6e8', emissiveIntensity: 0.25, side: DoubleSide, depthWrite: false }), 0.2),
    /** Dark honed basalt for the water wall and the spa's rim. */
    basalt: std({ color: '#2f3133', roughness: 0.55 }),
    /** Cushion accents: sage and warm taupe outdoor fabric, and a woven outdoor rug. */
    sage: std({ color: '#8e9b84', roughness: 0.95 }),
    taupe: std({ color: '#a8927a', roughness: 0.95 }),
    rug: std({ color: '#d3c8b4', roughness: 1 }),
    /** A frosted glass lantern glowing warm. */
    lantern: glow({ color: '#fff4e2', emissive: '#ffcf8a', emissiveIntensity: 1.6, roughness: 0.4 }, 0.1),
  }
}

export type TerranovaMaterials = ReturnType<typeof terranovaMaterials>
