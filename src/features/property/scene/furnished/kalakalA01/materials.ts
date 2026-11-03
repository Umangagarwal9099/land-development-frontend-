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

/* ---------- materials ---------- */

/**
 * Plot A-01's finishes: the mall's palette (glass, aluminium, paving, asphalt, planting, lamps,
 * car parts, sky reflections), plus the white GRC, polished plaza stone, black mesh and water of
 * the reference design.
 */
export function a01Materials(k: Kit, lighting: Lighting) {
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
    // Polished black granite and honed travertine; the fountain lays its own wet film over them.
    return std({ map, color: dark ? '#ffffff' : '#d6cfc3', roughness: dark ? 0.12 : 0.3, metalness: dark ? 0.15 : 0.05 })
  }

  return {
    ...base,
    /** White GRC: the sweeping wall, the rounded end walls and the cheeks of the wings. */
    grc: std({ map: grcMap, normalMap: k.tex.normalPainted('a01_grc', 512, 512, grc, 1 / 2.4, 1 / 2.4), normalScale: new Vector2(0.15, 0.15), roughness: 0.62 }),
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
    /** Interior stair: white treads, dark steel. */
    tread: std({ color: '#ece9e2', roughness: 0.4 }),
  }
}

export type A01Materials = ReturnType<typeof a01Materials>
