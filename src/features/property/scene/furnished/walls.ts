import { BoxGeometry, Mesh, type Material } from 'three'
import { FLOOR_Y, type Kit } from './kit'

export type Opening = [from: number, to: number, kind: 'door' | 'open' | 'window' | 'glass', sill?: number]

/** An axis-aligned wall from `a` to `b`; openings are ranges along the wall's own axis. */
export interface Wall {
  a: [number, number]
  b: [number, number]
  t: number
  o?: Opening[]
  /** Height of this wall, when it differs from the rest (e.g. taller exterior walls). */
  h?: number
  /** Box face materials (+x, −x, top, bottom, +z, −z), e.g. stone outside and plaster inside. */
  faces?: Material[]
}

interface WallStyle {
  height: number
  /** Default box face materials; the top face is the dark section cap. */
  faces: Material[]
  /** Material of the wall below a window. */
  sill: Material
  glass: Material
  frame: Material
}

/**
 * Builds section-cut walls: solid faces with a dark cap on the cut top, doors and openings left
 * as gaps, windows as a sill with glazing above, and full-height glazing in slim bronze frames.
 */
export function buildWalls(k: Kit, walls: Wall[], style: WallStyle) {
  const r = k.root
  walls.forEach((w, i) => {
    const alongX = w.a[1] === w.b[1]
    const fixed = alongX ? w.a[1] : w.a[0]
    const [p0, p1] = alongX ? [w.a[0], w.b[0]] : [w.a[1], w.b[1]]
    const start = Math.min(p0, p1) - w.t / 2
    const end = Math.max(p0, p1) + w.t / 2
    // A hair's difference per wall avoids z-fighting where section caps overlap at junctions.
    const top = (w.h ?? style.height) + i * 0.0008
    const faces = w.faces ?? style.faces

    const segment = (a: number, b: number, y0: number, y1: number, mat: Material | Material[]) => {
      if (b - a < 0.005 || y1 - y0 < 0.005) return
      const len = b - a
      const c = (a + b) / 2
      const mesh = new Mesh(new BoxGeometry(alongX ? len : w.t, y1 - y0, alongX ? w.t : len), mat)
      mesh.position.set(alongX ? c : fixed, FLOOR_Y + (y0 + y1) / 2, alongX ? fixed : c)
      mesh.castShadow = mesh.receiveShadow = true
      r.add(mesh)
    }
    const glazing = (a: number, b: number, y0: number) => {
      const len = b - a
      const c = (a + b) / 2
      const h = top - y0
      k.box(r, alongX ? len : 0.02, h, alongX ? 0.02 : len, style.glass, alongX ? c : fixed, FLOOR_Y + y0 + h / 2, alongX ? fixed : c, false)
      const n = Math.max(1, Math.round(len / 1.4))
      for (let j = 0; j <= n; j++) {
        const p = a + (len * j) / n
        k.box(r, alongX ? 0.045 : 0.07, h, alongX ? 0.07 : 0.045, style.frame, alongX ? p : fixed, FLOOR_Y + y0 + h / 2, alongX ? fixed : p)
      }
      k.box(r, alongX ? len : 0.08, 0.04, alongX ? 0.08 : len, style.frame, alongX ? c : fixed, FLOOR_Y + y0 + 0.02, alongX ? fixed : c)
    }

    let cursor = start
    const openings = (w.o ?? []).map(([s, e, kind, sill = 0]) => ({ s: Math.min(s, e), e: Math.max(s, e), kind, sill })).sort((a, b) => a.s - b.s)
    for (const o of openings) {
      segment(cursor, o.s, 0, top, faces)
      if (o.kind === 'window') {
        segment(o.s, o.e, 0, o.sill, style.sill)
        glazing(o.s, o.e, o.sill)
      } else if (o.kind === 'glass') glazing(o.s, o.e, 0)
      cursor = o.e
    }
    segment(cursor, end, 0, top, faces)
  })
}
