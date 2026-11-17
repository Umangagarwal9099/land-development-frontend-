import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, Vector2, type MeshStandardMaterialParameters } from 'three'
import type { Kit } from '../kit'
import { tiledMat, type Lighting } from '../shared'
import { rng, type Paint } from '../textures'
import { mallMaterials } from '../kalakalMall/materials'

/*
 * The clubhouse's finishes, matched to the references: terracotta Mangalore tiles, laterite block in
 * stretcher bond, white fascias and soffits, black-framed clear glass, grey circle-and-fan pavers,
 * a warm grey stone footpath and a charcoal planter. Every surface is painted at true scale (its
 * UVs are in metres) with a relief map from the same painting.
 */

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })
const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
const rgb = (r: number, g: number, b: number, a = 1) => `rgba(${clamp(r)},${clamp(g)},${clamp(b)},${a})`

/* ---------- roof ---------- */

/** Tiles per metre across the roof, and courses per metre up it (Mangalore pattern, 250 × 333 mm laid). */
const TILE_W = 4
const COURSES = 3

/**
 * One square metre of clay roof tiles, the canvas's top towards the ridge. Each tile fired a little
 * differently; its rounded hump shaded into the troughs either side; its lower lip catching the
 * light and throwing a shadow on the course below.
 */
const tiles: Paint = (g, w, h) => {
  const r = rng(4101)
  const tw = w / TILE_W
  const ch = h / COURSES
  g.fillStyle = '#a86650'
  g.fillRect(0, 0, w, h)
  for (let row = 0; row < COURSES; row++)
    for (let col = 0; col < TILE_W; col++) {
      const x = col * tw
      const y = row * ch
      // Fired colour, matched to the reference: a muted, rosy terracotta, some tiles a shade
      // redder or browner.
      const k = r()
      const base: [number, number, number] = k < 0.25 ? [172, 98, 80] : k < 0.5 ? [182, 106, 87] : k < 0.9 ? [177, 102, 83] : [164, 98, 82]
      const d = (r() - 0.5) * 8
      const grad = g.createLinearGradient(0, y, 0, y + ch)
      // Lighter towards the lip, where the face turns to the sun.
      grad.addColorStop(0, rgb(base[0] + d - 12, base[1] + d - 9, base[2] + d - 8))
      grad.addColorStop(0.85, rgb(base[0] + d + 6, base[1] + d + 4, base[2] + d + 4))
      grad.addColorStop(1, rgb(base[0] + d + 16, base[1] + d + 12, base[2] + d + 10))
      g.fillStyle = grad
      g.fillRect(x, y, tw, ch)
      // Each tile's rounded hump: shaded into the troughs either side, catching the light on its crown.
      const hump = g.createLinearGradient(x, 0, x + tw, 0)
      hump.addColorStop(0, 'rgba(55,18,10,.55)')
      hump.addColorStop(0.18, 'rgba(55,18,10,.12)')
      hump.addColorStop(0.42, 'rgba(255,224,212,.28)')
      hump.addColorStop(0.62, 'rgba(255,222,210,.06)')
      hump.addColorStop(0.86, 'rgba(55,18,10,.2)')
      hump.addColorStop(1, 'rgba(55,18,10,.6)')
      g.fillStyle = hump
      g.fillRect(x, y, tw, ch)
      // Firing speckle and a little weathering towards the lip.
      for (let i = 0; i < 240; i++) {
        g.fillStyle = r() < 0.6 ? `rgba(90,40,25,${0.06 + r() * 0.1})` : `rgba(250,200,170,${0.05 + r() * 0.08})`
        g.fillRect(x + r() * tw, y + r() * ch, 1 + r() * 2, 1 + r() * 2)
      }
      const dirt = g.createLinearGradient(0, y + ch * 0.6, 0, y + ch)
      dirt.addColorStop(0, 'rgba(70,45,35,0)')
      dirt.addColorStop(1, `rgba(70,45,35,${0.05 + r() * 0.1})`)
      g.fillStyle = dirt
      g.fillRect(x, y + ch * 0.6, tw, ch * 0.4)
    }
  // Each course's lip: a bright edge, then its shadow across the top of the course below.
  for (let row = 1; row <= COURSES; row++) {
    const y = (row * ch) % h
    g.fillStyle = 'rgba(255,226,214,.3)'
    g.fillRect(0, y - 4, w, 3)
    const sh = g.createLinearGradient(0, y, 0, y + ch * 0.16)
    sh.addColorStop(0, 'rgba(36,10,6,.92)')
    sh.addColorStop(0.35, 'rgba(36,10,6,.45)')
    sh.addColorStop(1, 'rgba(45,15,8,0)')
    g.fillStyle = sh
    g.fillRect(0, y, w, ch * 0.16)
  }
}

/* ---------- walls ---------- */

/** Laterite blocks, golden tan: 400 × 200 mm in stretcher bond, 12 mm joints; the canvas is 1.6 m square. */
export const LATERITE_TILE = 1.6
const laterite: Paint = (g, w, h) => {
  const r = rng(4211)
  const bw = w / 4
  const bh = h / 8
  const joint = Math.max(3, Math.round(w * 0.0075))
  g.fillStyle = '#62482f'
  g.fillRect(0, 0, w, h)
  for (let row = 0; row < 8; row++) {
    const off = row % 2 ? bw / 2 : 0
    for (let col = -1; col < 5; col++) {
      const x = col * bw + off
      const y = row * bh
      // Cut laterite, matched to the reference: a golden tan, some blocks a little browner or paler.
      const k = r()
      const base: [number, number, number] = k < 0.35 ? [173, 130, 89] : k < 0.7 ? [182, 138, 96] : k < 0.9 ? [163, 121, 83] : [189, 147, 104]
      const d = (r() - 0.5) * 9
      g.fillStyle = rgb(base[0] + d, base[1] + d * 0.8, base[2] + d * 0.6)
      g.fillRect(x + joint / 2, y + joint / 2, bw - joint, bh - joint)
      g.save()
      g.beginPath()
      g.rect(x + joint / 2, y + joint / 2, bw - joint, bh - joint)
      g.clip()
      // The vesicular face: dark pits, ochre and pale inclusions, mottled patches.
      for (let i = 0; i < 18; i++) {
        const px = x + r() * bw
        const py = y + r() * bh
        const rad = 6 + r() * 18
        const gr = g.createRadialGradient(px, py, 0, px, py, rad)
        gr.addColorStop(0, r() < 0.5 ? 'rgba(95,62,36,.2)' : 'rgba(225,180,128,.16)')
        gr.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = gr
        g.fillRect(px - rad, py - rad, rad * 2, rad * 2)
      }
      for (let i = 0; i < 260; i++) {
        const px = x + r() * bw
        const py = y + r() * bh
        const t = r()
        g.fillStyle = t < 0.55 ? `rgba(84,56,34,${0.3 + r() * 0.35})` : t < 0.85 ? `rgba(206,150,96,${0.3 + r() * 0.3})` : `rgba(238,214,178,${0.25 + r() * 0.3})`
        g.beginPath()
        g.ellipse(px, py, 0.8 + r() * 2.6, 0.6 + r() * 1.8, r() * 3, 0, Math.PI * 2)
        g.fill()
      }
      // Arrises catch the light along the top, shade along the bottom.
      g.fillStyle = 'rgba(255,200,160,.12)'
      g.fillRect(x, y + joint / 2, bw, 2)
      g.fillStyle = 'rgba(30,12,8,.25)'
      g.fillRect(x, y + bh - joint / 2 - 2, bw, 2)
      g.restore()
    }
  }
}

/* ---------- ground ---------- */

/** Circle-and-fan concrete pavers: one 2.4 m circle to a tile, square setts in the spandrels. */
export const FAN_TILE = 4
const fanPaving: Paint = (g, w) => {
  const r = rng(4307)
  const s = w / FAN_TILE
  const cx = w / 2
  const cy = w / 2
  const paver = (fill: () => void) => {
    const v = 122 + (r() - 0.5) * 30
    g.fillStyle = rgb(v + 2, v - 1, v - 2)
    fill()
  }
  g.fillStyle = '#4c4a4a'
  g.fillRect(0, 0, w, w)
  // Spandrels: 250 mm square setts on the grid, stopped by the circle.
  const sett = 0.3 * s
  for (let y = 0; y < w; y += sett)
    for (let x = 0; x < w; x += sett) paver(() => g.fillRect(x + 2.5, y + 2.5, sett - 5, sett - 5))
  // The circle: a centre stone and six rings of tapered pavers, each ring finer jointed than the last.
  const R = (FAN_TILE / 2) * s
  g.fillStyle = '#4c4a4a'
  g.beginPath()
  g.arc(cx, cy, R, 0, Math.PI * 2)
  g.fill()
  const rings = [0, 0.26, 0.56, 0.86, 1.16, 1.46, 1.74, 2.0]
  paver(() => {
    g.beginPath()
    g.arc(cx, cy, rings[1] * s - 2.5, 0, Math.PI * 2)
    g.fill()
  })
  for (let i = 1; i < rings.length - 1; i++) {
    const r0 = rings[i] * s + 2.5
    const r1 = rings[i + 1] * s - 2.5
    const mid = ((rings[i] + rings[i + 1]) / 2) * s
    const n = Math.max(8, Math.round((2 * Math.PI * mid) / (0.26 * s)))
    const off = r() * Math.PI
    for (let j = 0; j < n; j++) {
      const a0 = off + (j / n) * Math.PI * 2 + 2.5 / mid
      const a1 = off + ((j + 1) / n) * Math.PI * 2 - 2.5 / mid
      paver(() => {
        g.beginPath()
        g.arc(cx, cy, r1, a0, a1)
        g.arc(cx, cy, r0, a1, a0, true)
        g.closePath()
        g.fill()
      })
    }
  }
  // Every paver: aggregate speckle and a worn top.
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = r() < 0.55 ? `rgba(70,68,66,${0.12 + r() * 0.2})` : `rgba(215,212,206,${0.1 + r() * 0.2})`
    g.fillRect(r() * w, r() * w, 1 + r() * 1.6, 1 + r() * 1.6)
  }
}

/** Square concrete pavers, 600 mm, blue-grey, laid on the drive round the building. */
const squarePavers: Paint = (g, w) => {
  const r = rng(4351)
  g.fillStyle = '#5b5f66'
  g.fillRect(0, 0, w, w)
  const n = 4
  const s = w / n
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const v = (r() - 0.5) * 16
      g.fillStyle = rgb(146 + v, 151 + v, 160 + v)
      g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6)
      // A slight bevel: lit along the top edge, shaded along the bottom.
      g.fillStyle = 'rgba(255,255,255,.08)'
      g.fillRect(i * s + 3, j * s + 3, s - 6, 4)
      g.fillStyle = 'rgba(0,0,0,.1)'
      g.fillRect(i * s + 3, j * s + s - 7, s - 6, 4)
    }
  for (let i = 0; i < 16000; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(80,84,92,${0.1 + r() * 0.15})` : `rgba(220,222,228,${0.08 + r() * 0.14})`
    g.fillRect(r() * w, r() * w, 1 + r() * 1.4, 1 + r() * 1.4)
  }
}

/** The island's footpath: warm grey flamed stone, 600 × 300 mm. */
const footpath: Paint = (g, w) => {
  const r = rng(4409)
  g.fillStyle = '#7f7870'
  g.fillRect(0, 0, w, w)
  const sx = w / 2
  const sy = w / 4
  for (let row = 0; row < 4; row++)
    for (let col = -1; col < 3; col++) {
      const x = col * sx + (row % 2 ? sx / 2 : 0)
      const y = row * sy
      const v = 192 + (r() - 0.5) * 14
      g.fillStyle = rgb(v + 4, v - 6, v - 18)
      g.fillRect(x + 2, y + 2, sx - 4, sy - 4)
    }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(110,100,90,${0.15 + r() * 0.2})` : `rgba(240,232,220,${0.12 + r() * 0.2})`
    g.fillRect(r() * w, r() * w, 1 + r() * 1.5, 1 + r() * 1.5)
  }
}

/** Speckled finishes: red pavers for the garden path, white pebbles for the courtyard beds. */
const speckle = (base: string, dark: string, light: string, n: number, size: number, seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(${dark},${0.2 + r() * 0.35})` : `rgba(${light},${0.2 + r() * 0.35})`
    g.beginPath()
    g.ellipse(r() * w, r() * h, size * (0.4 + r()), size * (0.3 + r() * 0.7), r() * 3, 0, Math.PI * 2)
    g.fill()
  }
}

/** Red clay pavers, 200 × 100 mm in herringbone-free stretcher courses. */
const redPavers: Paint = (g, w) => {
  const r = rng(4511)
  g.fillStyle = '#5e2a22'
  g.fillRect(0, 0, w, w)
  const bw = w / 5
  const bh = w / 10
  for (let row = 0; row < 10; row++)
    for (let col = -1; col < 6; col++) {
      const x = col * bw + (row % 2 ? bw / 2 : 0)
      const v = (r() - 0.5) * 22
      g.fillStyle = rgb(176 + v, 74 + v * 0.6, 58 + v * 0.5)
      g.fillRect(x + 2, row * bh + 2, bw - 4, bh - 4)
    }
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '80,30,22' : '230,150,120'},${0.1 + r() * 0.15})`
    g.fillRect(r() * w, r() * w, 1.5, 1.5)
  }
}

/** Sandstone flags for the courtyard's stepping path: pale grey-buff, 900 × 600 mm. */
const flags: Paint = (g, w) => {
  const r = rng(4613)
  g.fillStyle = '#8c877e'
  g.fillRect(0, 0, w, w)
  const sx = w / 2
  const sy = w / 3
  for (let row = 0; row < 3; row++)
    for (let col = -1; col < 3; col++) {
      const x = col * sx + (row % 2 ? sx * 0.4 : 0)
      const v = 206 + (r() - 0.5) * 16
      g.fillStyle = rgb(v, v - 3, v - 10)
      g.fillRect(x + 3, row * sy + 3, sx - 6, sy - 6)
      for (let k = 0; k < 6; k++) {
        g.fillStyle = `rgba(170,160,145,${0.15 + r() * 0.2})`
        g.fillRect(x + 3, row * sy + 3 + r() * (sy - 8), sx - 6, 1 + r() * 3)
      }
    }
}

/** A slow, broad mottle across a surface, so a repeat never reads as one. */
const macro: Paint = (g, w, h) => {
  const r = rng(4701)
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 90; i++) {
    const x = r() * w
    const y = r() * h
    const rad = 30 + r() * 120
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(150,150,150,${0.15 + r() * 0.25})`)
    gr.addColorStop(1, 'rgba(150,150,150,0)')
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
}

/* ---------- materials ---------- */

export function clubMaterials(k: Kit, lighting: Lighting) {
  const base = mallMaterials(k, lighting)
  const variation = k.tex.painted(512, 512, macro)
  variation.channel = 0
  variation.repeat.set(1 / 24, 1 / 24)
  /** A true-scale surface: `tile` metres to one painting, relief from the painting itself. */
  const surface = (key: string, paint: Paint, tile: number, params: MeshStandardMaterialParameters, relief: number, size = 1024, macroAo = true) => {
    const repeat: [number, number] = [1 / tile, 1 / tile]
    const m = tiledMat(k, `club_${key}`, paint, repeat, params, size)
    m.normalMap = k.tex.normalPainted(`club_${key}`, size, size, paint, ...repeat)
    m.normalScale = new Vector2(relief, relief)
    if (macroAo) {
      m.aoMap = variation
      m.aoMapIntensity = 0.6
    }
    return m
  }

  return {
    ...base,
    /** Terracotta Mangalore tiles; the roof's UVs run along the ridge (u) and up the slope (v), in metres. */
    tiles: surface('tiles', tiles, 1, { roughness: 0.7 }, 0.9),
    /** Half-round ridge tiles. */
    ridgeTile: std({ color: '#a8655a', roughness: 0.65 }),
    laterite: surface('laterite', laterite, LATERITE_TILE, { roughness: 0.92 }, 1.4, 1024, false),
    /** The same laterite deep inside the portal, where the sky barely reaches. */
    lateriteShade: surface('laterite', laterite, LATERITE_TILE, { roughness: 0.95, color: '#7a7a7a' }, 1.4, 1024, false),
    /** Interior walls: white lime plaster. */
    plaster: std({ color: '#d9d3c8', roughness: 0.9 }),
    /** The fascias, bargeboards and soffits: white-painted, a soft satin. */
    fascia: std({ color: '#f5f5f2', roughness: 0.45 }),
    soffit: std({ color: '#ecebe7', roughness: 0.6, side: DoubleSide }),
    /** Black powder-coated aluminium glazing frames. */
    frame: std({ color: '#1c1d1f', metalness: 0.55, roughness: 0.38 }),
    /** Clear, low-iron glazing: dark and reflective seen from outside, and seen through. */
    glass: new MeshPhysicalMaterial({ color: '#27302e', metalness: 0.2, roughness: 0.03, ior: 1.52, specularIntensity: 1, transparent: true, opacity: 0.46, depthWrite: false, side: DoubleSide }),
    fan: surface('fan', fanPaving, FAN_TILE, { roughness: 0.88 }, 1.1),
    /** The drive round the building: square pavers, as the side views show. */
    squarePavers: surface('square', squarePavers, 2.4, { roughness: 0.86 }, 0.8),
    footpath: surface('footpath', footpath, 0.6, { roughness: 0.82 }, 0.6, 512),
    /** The island's bull-nosed kerb: precast concrete, a shade darker than the path. */
    islandKerb: std({ color: '#8a827b', roughness: 0.85 }),
    /** Charcoal planter: rendered and painted, smooth. */
    planter: std({ color: '#30353b', roughness: 0.7 }),
    redPath: surface('red', redPavers, 1, { roughness: 0.85 }, 0.7, 512),
    pebbles: surface('pebbles', speckle('#d8d4cc', '120,115,105', '250,248,242', 5000, 3, 4801), 0.8, { roughness: 0.9 }, 1.2, 512),
    flags: surface('flags', flags, 1.8, { roughness: 0.75 }, 0.5, 512),
    /** Soil in the beds, dark and damp. */
    soil: std({ color: '#3b2e24', roughness: 1 }),
    /** Interior: honed pale stone floors, white ceilings. */
    interiorFloor: std({ color: '#ddd6ca', roughness: 0.3, metalness: 0.02 }),
    ceilingWhite: lighting.glow(std({ color: '#f1efe9', emissive: '#fff0dc', emissiveIntensity: 0.12, roughness: 0.85 }), 0.4),
    /** Teak for the verandah's posts and boarded ceiling. */
    teak: std({ map: k.tex.finish('walnut', 1, 1), color: '#c08a58', roughness: 0.6 }),
    /** The wall sconces: dark bronze boxes round a frosted, warm-lit glass. */
    bronze: std({ color: '#2e2925', metalness: 0.7, roughness: 0.4 }),
    sconceGlass: lighting.glow(std({ color: '#f6efe2', emissive: '#ffd49a', emissiveIntensity: 2.2, roughness: 0.3 }), 0.25),
  }
}

export type ClubMaterials = ReturnType<typeof clubMaterials>
