import { DoubleSide, FrontSide, Mesh, MeshStandardMaterial, PlaneGeometry, type Material } from 'three'
import { FLOOR_Y, PI, type Kit } from '../kit'
import { buildWalls, type Wall } from '../walls'
import type { ClubMaterials, Lighting } from './materials'

export interface Ctx {
  /** Builds inside the clubhouse (the floor group). */
  k: Kit
  /** Builds on the grounds (the outdoor group). */
  out: Kit
  c: ClubMaterials
  lighting: Lighting
}

/*
 * Plan in metres on the 47.7 × 65.4 m social-infrastructure site (150′ × 214′9″ on the layout),
 * +z towards the 60 ft main avenue. The clubhouse (44 × 28 m) stands mid-site: arrival court and
 * porte-cochère in front, a 25 m six-lane training pool and garden terrace behind.
 *
 *   z 18 … 35   arrival court, drop-off, parking, fountain
 *   z  5 … 18   billiards · table tennis · grand lobby · video gaming lounge
 *   z −10 … 5   fitness centre · carrom & darts + changing · board games / recreation
 *   z −35 … −10 training pool, deck, stands · garden terrace (x > 14.5)
 */

/** The model stands on a raised ground podium so the pool basin has its full depth below the deck. */
export const LIFT = 2.2
export const DECK_Y = 0.12
export const WATER_Y = 0.09
export const EXT_H = 4.5
export const INT_H = 3.4
export const POOL = { x0: -12.5, x1: 12.5, z0: -28.75, z1: -13.25, depth: 2.0 }
/** Lane centres, lane 1 nearest the clubhouse. */
export const LANES = [0, 1, 2, 3, 4, 5].map((i) => -14.75 - i * 2.5)

const T_EXT = 0.3
const T_INT = 0.15

function faces(c: ClubMaterials, k: Kit, outside: 'px' | 'nx' | 'pz' | 'nz'): Material[] {
  const { wallCap } = k.m
  const f: Material[] = [c.paint, c.paint, wallCap, c.paint, c.paint, c.paint]
  const i = { px: 0, nx: 1, pz: 4, nz: 5 }[outside]
  f[i] = c.stone
  // The wall's own ends are exterior corners.
  if (outside === 'pz' || outside === 'nz') f[0] = f[1] = c.stone
  else f[4] = f[5] = c.stone
  return f
}

function walls(c: ClubMaterials, k: Kit): Wall[] {
  const ext = (o: 'px' | 'nx' | 'pz' | 'nz') => ({ t: T_EXT, h: EXT_H, faces: faces(c, k, o) })
  return [
    // Exterior: a stone box opened up with full-height glazing toward the avenue, the park and the pool.
    { a: [-22, 18], b: [22, 18], ...ext('pz'), o: [[-21.2, -15.4, 'window', 0.6], [-13.8, -7.8, 'window', 0.6], [-6.6, -3.4, 'glass'], [-3, 3, 'glass'], [3.4, 6.6, 'glass'], [7.6, 21.4, 'glass']] },
    { a: [-22, -10], b: [22, -10], ...ext('nz'), o: [[-21.4, -7.6, 'glass'], [-6.4, -5.4, 'door'], [5.4, 6.4, 'door'], [7.8, 21.4, 'glass']] },
    { a: [22, -10], b: [22, 18], ...ext('px'), o: [[-9.2, -3.8, 'glass'], [-2.2, 4.2, 'glass'], [5.8, 17.2, 'glass']] },
    { a: [-22, -10], b: [-22, 18], ...ext('nx'), o: [[-8.8, 3.8, 'window', 0.9]] },
    // Front rooms: glass between the games rooms and the lobby, so the arrival looks through them.
    { a: [-14.5, 5], b: [-14.5, 18], t: T_INT, o: [[5.4, 10.6, 'glass'], [10.6, 12.6, 'open'], [12.6, 17.6, 'glass']] },
    { a: [-7, 5], b: [-7, 18], t: T_INT, o: [[5.4, 14.6, 'glass'], [15, 17.4, 'open']] },
    { a: [7, 5], b: [7, 18], t: T_INT, o: [[15, 17.4, 'open']] },
    { a: [-22, 5], b: [-7, 5], t: T_INT },
    { a: [-7, 5], b: [7, 5], t: T_INT, o: [[-6.4, -4.2, 'open'], [4.2, 6.4, 'open']] },
    { a: [7, 5], b: [22, 5], t: T_INT, o: [[10, 13, 'open']] },
    // Back rooms: gym, the gallery to the changing rooms, board games and recreation.
    { a: [-7, -10], b: [-7, 5], t: T_INT, o: [[0.2, 1.8, 'door'], [2.2, 4.6, 'glass']] },
    { a: [7, -10], b: [7, 5], t: T_INT, o: [[0.6, 3.6, 'open']] },
    { a: [-7, -1], b: [7, -1], t: T_INT, o: [[-4.8, -3.6, 'door'], [3.6, 4.8, 'door']] },
    { a: [0, -10], b: [0, -1], t: T_INT },
    { a: [7, -3], b: [22, -3], t: T_INT, o: [[7.6, 9.8, 'open'], [10.4, 21.4, 'glass']] },
  ]
}

/** Grass-topped podium with the pool pit cut into it, tiled shell and floor. */
export function buildPodium({ out, c }: Ctx) {
  const r = out.root
  const side = c.earth
  const block = (x0: number, x1: number, z0: number, z1: number) => {
    const w = x1 - x0
    const d = z1 - z0
    const top = out.finish('grass', w / 3, d / 3, 1)
    out.box(r, w, LIFT, d, [side, side, top, side, side, side], (x0 + x1) / 2, -LIFT / 2, (z0 + z1) / 2, false)
  }
  const { x0, x1, z0, z1, depth } = POOL
  const s = 0.3
  block(-26, 26, -35, z0 - s)
  block(-26, 26, z1 + s, 35)
  block(-26, x0 - s, z0 - s, z1 + s)
  block(x1 + s, 26, z0 - s, z1 + s)
  // Basin: floor, tiled walls, lane markings on the floor and targets on the end walls.
  const pw = x1 - x0
  const pd = z1 - z0
  out.box(r, pw + 2 * s, LIFT - depth, pd + 2 * s, [side, side, out.finish('poolFloor', pw / 2, pd / 2, 0.3), side, side, side], 0, -LIFT + (LIFT - depth) / 2, (z0 + z1) / 2, false)
  const lining = out.finish('poolTile', 1, 1, 0.25)
  const wallTile = (w: number, d: number, x: number, z: number) => out.box(r, w, depth, d, lining, x, -depth / 2, z, false)
  wallTile(s, pd + 2 * s, x0 - s / 2, (z0 + z1) / 2)
  wallTile(s, pd + 2 * s, x1 + s / 2, (z0 + z1) / 2)
  wallTile(pw, s, 0, z0 - s / 2)
  wallTile(pw, s, 0, z1 + s / 2)
  for (const lz of LANES) {
    out.box(r, pw - 4, 0.01, 0.25, c.laneBlue, 0, -depth + 0.006, lz, false)
    for (const e of [-1, 1]) {
      out.box(r, 0.25, 0.01, 1.0, c.laneBlue, e * (pw / 2 - 2), -depth + 0.006, lz, false)
      // End-wall target: a vertical line with a 0.5 m cross-bar 0.3 m under the surface.
      out.box(r, 0.01, depth - 0.4, 0.25, c.laneBlue, e * (pw / 2 - 0.006), -depth / 2 - 0.1, lz, false)
      out.box(r, 0.01, 0.25, 0.5, c.laneBlue, e * (pw / 2 - 0.006), -0.45, lz, false)
    }
  }
  for (const dx of [-3, 3]) out.box(r, 0.6, 0.012, 0.6, c.grating, dx, -depth + 0.008, (z0 + z1) / 2, false)
}

export function buildShell(ctx: Ctx) {
  const { k, c } = ctx
  const { m } = k
  const r = k.root
  k.box(r, 44.6, FLOOR_Y - 0.02, 28.6, m.travertine, 0, (FLOOR_Y - 0.02) / 2, 4, false)

  const floor = (x0: number, x1: number, z0: number, z1: number, mat: Material, lift = 0) =>
    k.box(r, x1 - x0, 0.02, z1 - z0, mat, (x0 + x1) / 2, FLOOR_Y - 0.01 + lift, (z0 + z1) / 2, false)
  const fin = (name: Parameters<Kit['finish']>[0], x0: number, x1: number, z0: number, z1: number, tw: number, td: number, rough: number, lift = 0) =>
    floor(x0, x1, z0, z1, k.finish(name, (x1 - x0) / tw, (z1 - z0) / td, rough), lift)
  fin('statuarioTile', -7, 7, -1, 18, 1.2, 1.2, 0.22)
  fin('oak', 7, 22, -10, 18, 0.88, 2.4, 0.5)
  fin('walnut', -22, -14.5, 5, 18, 0.88, 2.4, 0.45)
  fin('sportsFloor', -14.5, -7, 5, 18, 1.5, 1.5, 0.6)
  fin('rubber', -22, -7, -10, 5, 1, 1, 0.95)
  fin('oak', -13.6, -7.4, 0.6, 4.6, 0.88, 2.4, 0.5, 0.004)
  fin('travertineTile', -7, 7, -10, -1, 1.6, 0.8, 0.45)
  k.box(r, 5.2, 0.006, 1.0, m.basalt, 0, FLOOR_Y + 0.003, 17.3, false)

  buildWalls(k, walls(c, k), { height: INT_H, faces: [c.paint, c.paint, m.wallCap, c.paint, c.paint, c.paint], sill: c.stone, glass: m.glass, frame: m.frame })

  // False ceilings: a perimeter bulkhead with cove light on its inner edge and recessed downlights.
  const warm = k.glow
  cove(k, c.paint, -7, 7, 5, 18, warm, 1.0)
  cove(k, c.paint, -7, 7, -1, 5, warm)
  cove(k, c.paint, 7, 22, 5, 18, warm, 0.9)
  cove(k, c.paint, -22, -14.5, 5, 18, warm)
  cove(k, c.paint, -14.5, -7, 5, 18, c.ledCool)
  cove(k, c.paint, -22, -7, -10, 5, c.ledCool)
  cove(k, c.paint, -7, 0, -10, -1, warm, 0.5)
  cove(k, c.paint, 0, 7, -10, -1, warm, 0.5)
  cove(k, c.paint, 7, 22, -3, 5, warm)
  cove(k, c.paint, 7, 22, -10, -3, warm)
}

const ceilings = new WeakMap<Kit, MeshStandardMaterial>()

/**
 * Perimeter false-ceiling band for a room whose walls run along x0..x1, z0..z1, and a ceiling
 * that faces down only: seen from inside the room, invisible from above, so the section model
 * still looks straight into every room.
 */
function cove(k: Kit, paint: Material, x0: number, x1: number, z0: number, z1: number, strip: Material, band = 0.7) {
  const r = k.root
  const inset = 0.16
  const [a0, a1, b0, b1] = [x0 + inset, x1 - inset, z0 + inset, z1 - inset]
  const th = 0.2
  const y = FLOOR_Y + INT_H - 0.05 - th / 2
  const plaster = paint
  let ceilingMat = ceilings.get(k)
  // A faint self-glow stands in for light bounced off the floor, as a real white ceiling shows.
  if (!ceilingMat)
    ceilings.set(k, (ceilingMat = new MeshStandardMaterial({ color: '#ece7de', roughness: 0.95, side: FrontSide, shadowSide: DoubleSide, emissive: '#b8afa2', emissiveIntensity: 0.35 })))
  const ceiling = new Mesh(new PlaneGeometry(a1 - a0 - 2 * band, b1 - b0 - 2 * band), ceilingMat)
  ceiling.rotation.x = PI / 2
  ceiling.position.set((a0 + a1) / 2, y + th / 2 + 0.04, (b0 + b1) / 2)
  ceiling.receiveShadow = true
  // It also keeps the scene's sun out of the roofless section model: rooms are lit by their own fittings.
  ceiling.castShadow = true
  r.add(ceiling)
  k.box(r, a1 - a0, th, band, plaster, (a0 + a1) / 2, y, b0 + band / 2, false)
  k.box(r, a1 - a0, th, band, plaster, (a0 + a1) / 2, y, b1 - band / 2, false)
  k.box(r, band, th, b1 - b0 - 2 * band, plaster, a0 + band / 2, y, (b0 + b1) / 2, false)
  k.box(r, band, th, b1 - b0 - 2 * band, plaster, a1 - band / 2, y, (b0 + b1) / 2, false)
  // Cove: a lit reveal along the inner edge.
  const ly = y - th / 2 + 0.03
  k.box(r, a1 - a0 - 2 * band, 0.03, 0.03, strip, (a0 + a1) / 2, ly, b0 + band, false)
  k.box(r, a1 - a0 - 2 * band, 0.03, 0.03, strip, (a0 + a1) / 2, ly, b1 - band, false)
  k.box(r, 0.03, 0.03, b1 - b0 - 2 * band, strip, a0 + band, ly, (b0 + b1) / 2, false)
  k.box(r, 0.03, 0.03, b1 - b0 - 2 * band, strip, a1 - band, ly, (b0 + b1) / 2, false)
  const dy = y - th / 2 - 0.004
  const lights = (from: number, to: number, place: (t: number) => [number, number]) => {
    const n = Math.max(1, Math.round((to - from) / 1.8))
    for (let i = 0; i < n; i++) {
      const [x, z] = place(from + ((to - from) * (i + 0.5)) / n)
      k.cyl(r, 0.05, 0.05, 0.008, k.glow, x, dy, z, 12).castShadow = false
    }
  }
  lights(a0 + band, a1 - band, (t) => [t, b0 + band / 2])
  lights(a0 + band, a1 - band, (t) => [t, b1 - band / 2])
  lights(b0, b1, (t) => [a0 + band / 2, t])
  lights(b0, b1, (t) => [a1 - band / 2, t])
}

/** Stone portal, timber fins, the lit fascia and the cantilevered porte-cochère. */
export function buildFacade(ctx: Ctx) {
  const { k, out, c } = ctx
  const { m } = k
  const r = out.root
  const top = FLOOR_Y + EXT_H
  // Entrance portal: stone piers and lintel framing the pivot doors, with LED reveals.
  for (const s of [-1, 1]) {
    out.box(r, 0.6, top + 0.7, 0.8, c.stone, s * 3.35, (top + 0.7) / 2, 18.45)
    out.box(r, 0.03, top, 0.03, c.facade, s * 3.02, top / 2, 18.84, false)
    // Bronze pulls on the glass doors, inside and out.
    for (const dz of [-0.22, 0.22]) out.box(r, 0.04, 1.8, 0.04, m.bronze, s * 0.18, FLOOR_Y + 1.1, 18 + dz)
  }
  out.box(r, 7.3, 0.7, 0.8, c.stone, 0, top + 0.35, 18.45)
  // A bronze fascia crowning the front, lit along its underside.
  out.box(r, 45, 0.45, 0.7, m.bronze, 0, top + 0.22, 18.2)
  out.box(r, 44.6, 0.03, 0.03, c.facade, 0, top - 0.02, 18.5, false)
  // Vertical teak fins shading the gaming lounge's glass to the avenue and to the park.
  for (let x = 7.9; x <= 21.2; x += 0.55) out.box(r, 0.07, EXT_H - 0.2, 0.32, m.teak, x, FLOOR_Y + EXT_H / 2, 18.36)
  for (let z = 6.1; z <= 17; z += 0.55) out.box(r, 0.32, EXT_H - 0.2, 0.07, m.teak, 22.36, FLOOR_Y + EXT_H / 2, z)
  // Grazing uplights at the foot of every stone pier on the front.
  for (const x of [-21.6, -14.6, -7.3, 7.3, 21.6]) out.box(r, 0.3, 0.05, 0.12, c.facade, x, DECK_Y + 0.03, 18.55, false)

  // Porte-cochère: a 7 m cantilevered canopy over the drop-off lane, fluted walnut soffit and downlights.
  const soffit = k.fluted('flutedWalnut', 18)
  const cz = 22.1
  out.box(r, 18, 0.36, 7.0, [m.bronze, m.bronze, c.stone, soffit, m.bronze, m.bronze], 0, 5.15, cz)
  out.box(r, 18.1, 0.03, 0.03, c.facade, 0, 4.96, cz + 3.5, false)
  for (const s of [-1, 1]) {
    out.cyl(r, 0.22, 0.22, 5.0, m.bronze, s * 8.4, 2.5, 25.1, 24)
    out.box(r, 0.3, 0.05, 0.3, c.facade, s * 8.4, DECK_Y + 0.02, 25.1, false)
  }
  for (const x of [-6, -2, 2, 6]) for (const z of [20, 22.2, 24.4]) out.cyl(r, 0.08, 0.08, 0.01, c.path, x, 4.965, z, 16)
}
