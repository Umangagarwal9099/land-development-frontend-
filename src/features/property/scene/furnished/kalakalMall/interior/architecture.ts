import { AdditiveBlending, CanvasTexture, CylinderGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry, RingGeometry, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../../api/types'
import { sheet } from '../solids'
import { place } from './signs'
import { bx, clipped, rectPoly, type FloorCtx } from './shell'
import { LIFTS, VZ0, VZ1, XV0, type Rect, type Unit } from './units'

/*
 * The architecture of the mall's public spaces, floor by floor in its scheme (see luxury.ts):
 *
 *   floors    the field stone, a border band in the contrasting stone in front of every shop with
 *             brass hairlines either side, a band round the void, inlaid rugs at the lift lobby and
 *             a medallion under the atrium.
 *   ceilings  a two-level gypsum ceiling over every gallery: a perimeter band at the ceiling line
 *             carrying the recessed downlights, and a raised raft over the middle washed by a
 *             concealed cove; in the raft each floor's own feature: coffers with brass edges (G),
 *             brass-edged light slots (1), oak fins (2), lines of light on black (3), walnut slats (4).
 *   walls     marble pilasters at the ends of every shopfront with a brass reveal and an uplight,
 *             a light line under every bulkhead; the lifts' wall in bookmatched marble with bronze
 *             portals and fluted walnut ends; a backlit onyx wall facing the atrium at the ground.
 */

const PI = Math.PI

/* ---------- floors ---------- */

/** Hairline brass inlay along a rectangle's long axis edges. */
function brassLines(e: FloorCtx, r: Rect, y: number, along: 'x' | 'z') {
  const t = 0.012
  const m = e.lux.schemes[e.level].metal
  const [x0, x1, z0, z1] = r
  const lines: Rect[] = along === 'x' ? [[x0, x1, z0 - t, z0], [x0, x1, z1, z1 + t]] : [[x0 - t, x0, z0, z1], [x1, x1 + t, z0, z1]]
  for (const l of lines) sheet(e.g, rectPoly(l), y, m, false, [], 'inlay_brass')
}

/** The border bands in front of the shops, and the floor's medallion or rugs. */
export function floorPattern(e: FloorCtx) {
  const sc = e.lux.schemes[e.level]
  const y = e.y + 0.0085
  const inCommons = (x: number, z: number) => e.plan.commons.some(([a, b, c, d]) => x > a && x < b && z > c && z < d)
  const lettable = e.plan.units.filter((u) => u.kind !== 'service' && u.kind !== 'washroom' && u.kind !== 'lounge')
  for (const u of lettable)
    for (const f of u.fronts) {
      const [ux, uz] = centre(u)
      const out = f.axis === 'x' ? Math.sign(f.at - ux) : Math.sign(f.at - uz)
      const a = f.at + out * 0.3
      const b = f.at + out * 0.75
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      const r: Rect = f.axis === 'x' ? [lo, hi, f.from + 0.05, f.to - 0.05] : [f.from + 0.05, f.to - 0.05, lo, hi]
      const [mx, mz] = [(r[0] + r[1]) / 2, (r[2] + r[3]) / 2]
      if (!inCommons(mx, mz)) continue
      sheet(e.g, rectPoly(r), y, sc.border, false, [], 'border')
      brassLines(e, r, y + 0.0005, f.axis === 'x' ? 'z' : 'x')
    }
  // The lift lobby's rug: the border stone framing a panel of the field, brass between.
  const rug: Rect = [LIFTS.x1 + 0.35, XV0 - 0.35, LIFTS.z0 + 0.2, LIFTS.z1 - 0.2]
  sheet(e.g, rectPoly(rug), y, sc.border, false, [], 'rug')
  sheet(e.g, rectPoly([rug[0] + 0.22, rug[1] - 0.22, rug[2] + 0.22, rug[3] - 0.22]), y + 0.0005, sc.metal, false, [], 'rug')
  sheet(e.g, rectPoly([rug[0] + 0.24, rug[1] - 0.24, rug[2] + 0.24, rug[3] - 0.24]), y + 0.001, e.level === 1 ? e.lux.calacattaOro : e.lux.emperador, false, [], 'rug')
  if (e.level === 0) medallion(e)
  // On the dining floor the dining hall is laid in walnut herringbone, edged in brass.
  if (e.level === 4) {
    const hall: Rect = [-13.8, -6.6, -7.2, 9.0]
    sheet(e.g, rectPoly([hall[0] + 0.5, hall[1] - 0.15, hall[2] + 0.15, hall[3] - 0.15]), y, e.lux.herringbone, false, [], 'parquet')
    brassLines(e, [hall[0] + 0.5, hall[1] - 0.15, hall[2] + 0.15, hall[3] - 0.15], y + 0.0005, 'x')
    brassLines(e, [hall[0] + 0.5, hall[1] - 0.15, hall[2] + 0.15, hall[3] - 0.15], y + 0.0005, 'z')
  }
}

function centre(u: Unit): [number, number] {
  const r = [...u.rects].sort((a, b) => (b[1] - b[0]) * (b[3] - b[2]) - (a[1] - a[0]) * (a[3] - a[2]))[0]
  return [(r[0] + r[1]) / 2, (r[2] + r[3]) / 2]
}

/** Under the atrium: a compass medallion of Nero, Emperador and Calacatta with brass rings. */
function medallion(e: FloorCtx) {
  const { lux, g } = e
  const cx = 2.0
  const cz = (VZ0 + VZ1) / 2
  const y = e.y + 0.009
  const ring = (r0: number, r1: number, m: Material, dy: number) => {
    const o = new Mesh(new RingGeometry(r0, r1, 96), m)
    o.rotation.x = -PI / 2
    o.position.set(cx, y + dy, cz)
    o.receiveShadow = true
    g.add(o)
  }
  ring(3.3, 3.32, lux.brass, 0.0006)
  ring(3.0, 3.3, lux.nero, 0)
  ring(2.98, 3.0, lux.brass, 0.0006)
  ring(2.7, 2.98, lux.emperador, 0)
  ring(2.68, 2.7, lux.brass, 0.0006)
  // A sixteen-point star between the rings and the pool, in alternating stones.
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * PI * 2
    const a1 = ((i + 1) / 16) * PI * 2
    const am = (a0 + a1) / 2
    const pts: Point2[] = [
      [cx + Math.cos(a0) * 1.2, cz + Math.sin(a0) * 1.2],
      [cx + Math.cos(am) * (i % 2 ? 2.25 : 2.65), cz + Math.sin(am) * (i % 2 ? 2.25 : 2.65)],
      [cx + Math.cos(a1) * 1.2, cz + Math.sin(a1) * 1.2],
    ]
    sheet(g, pts, y + 0.0003, i % 2 ? lux.emperador : lux.nero, false, [], 'medallion')
  }
}

/* ---------- ceilings ---------- */

let washTex: CanvasTexture | null = null
/** The soft light a concealed cove throws onto the raft above it. */
function coveWash(e: FloorCtx) {
  if (!washTex) {
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 128
    const g = c.getContext('2d')!
    const gr = g.createLinearGradient(0, 0, 0, 128)
    gr.addColorStop(0, 'rgba(255,255,255,1)')
    gr.addColorStop(0.35, 'rgba(255,255,255,.35)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 4, 128)
    washTex = new CanvasTexture(c)
  }
  const m = new MeshBasicMaterial({ color: e.level === 3 ? '#3d6b8a' : '#ffd9a8', alphaMap: washTex, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false, toneMapped: false })
  m.userData.mergeable = true
  m.userData.interior = true
  return m
}

/** A recessed downlight: a slim trim with the lamp set back in it. */
export function downlight(e: FloorCtx, p: Object3D, x: number, y: number, z: number, trim?: Material) {
  const { k, lux } = e
  k.cyl(p, 0.065, 0.065, 0.006, trim ?? lux.plaster, x, y - 0.003, z, 24).castShadow = false
  k.cyl(p, 0.05, 0.05, 0.004, lux.blackSteel, x, y - 0.0055, z, 24).castShadow = false
  k.cyl(p, 0.028, 0.028, 0.004, lux.led, x, y - 0.0045, z, 16).castShadow = false
}

/** The ceiling over one gallery rectangle. */
export function ceiling(e: FloorCtx, r: Rect) {
  const { g, lux } = e
  const style = lux.schemes[e.level].ceiling
  const hc = e.y + e.ceiling
  const plaster = style === 'neon' ? e.m.blackCeiling : e.m.gypsum
  const poly = clipped(e, r)
  if (poly.length < 3) return
  const [x0, x1, z0, z1] = r
  const w = x1 - x0
  const d = z1 - z0
  const inset = 0.6
  // Narrow corridors, and galleries the façade's curves cut into: one flat ceiling with a row of downlights.
  let area = 0
  for (let i = 0; i < poly.length; i++) {
    const [ax, az] = poly[i]
    const [bx2, bz] = poly[(i + 1) % poly.length]
    area += ax * bz - bx2 * az
  }
  if (Math.min(w, d) < 2.4 || Math.abs(area) / 2 < w * d * 0.98) {
    sheet(g, poly, hc, plaster, true, [], 'ceiling')
    const alongX = w > d
    const n = Math.max(1, Math.round((alongX ? w : d) / 1.8))
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n
      downlight(e, g, alongX ? x0 + t * w : (x0 + x1) / 2, hc, alongX ? (z0 + z1) / 2 : z0 + t * d)
    }
    return
  }
  const raft: Rect = [x0 + inset, x1 - inset, z0 + inset, z1 - inset]
  const lift = style === 'neon' ? 0.25 : 0.38
  // The perimeter band, open over the raft.
  sheet(g, poly, hc, plaster, true, [rectPoly(raft)], 'ceiling_band')
  // The raft, its upstands, and the cove's wash on it.
  sheet(g, rectPoly(raft), hc + lift, plaster, true, [], 'ceiling_raft')
  const [rx0, rx1, rz0, rz1] = raft
  for (const [a, b, c, dd] of [[rx0, rx1, rz0, rz0 + 0.02], [rx0, rx1, rz1 - 0.02, rz1], [rx0, rx0 + 0.02, rz0, rz1], [rx1 - 0.02, rx1, rz0, rz1]] as Rect[])
    bx(e, g, a, b, hc, hc + lift, c, dd, plaster, false)
  const wash = coveWash(e)
  // A face-down quad, brightest along the raft's edge where the cove's light falls.
  const strip = (cx: number, cz: number, len: number, spin: number) => {
    const m = new Mesh(new PlaneGeometry(len, 0.9), wash)
    m.rotation.set(PI / 2, 0, spin)
    m.position.set(cx, hc + lift - 0.004, cz)
    g.add(m)
  }
  strip((rx0 + rx1) / 2, rz0 + 0.45, rx1 - rx0, PI)
  strip((rx0 + rx1) / 2, rz1 - 0.45, rx1 - rx0, 0)
  strip(rx0 + 0.45, (rz0 + rz1) / 2, rz1 - rz0, PI / 2)
  strip(rx1 - 0.45, (rz0 + rz1) / 2, rz1 - rz0, -PI / 2)
  // Downlights round the band.
  const metal = lux.schemes[e.level].metal
  for (const [ax, az, bx2, bz] of [[x0, z0, x1, z0], [x0, z1, x1, z1], [x0, z0, x0, z1], [x1, z0, x1, z1]]) {
    const len = Math.hypot(bx2 - ax, bz - az)
    const n = Math.max(1, Math.round(len / 2.0))
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n
      const px = ax + (bx2 - ax) * t + (ax === bx2 ? (ax === x0 ? 0.3 : -0.3) : 0)
      const pz = az + (bz - az) * t + (az === bz ? (az === z0 ? 0.3 : -0.3) : 0)
      if (ax !== bx2 && (px < x0 + 0.4 || px > x1 - 0.4)) continue
      downlight(e, g, px, hc, pz, style === 'coffer' || style === 'slots' ? metal : undefined)
    }
  }
  const top = hc + lift
  switch (style) {
    case 'coffer': {
      // Deep coffers on a 2.4 m grid, their beams edged in brass, a downlight in each.
      const nx = Math.max(1, Math.round((rx1 - rx0) / 2.4))
      const nz = Math.max(1, Math.round((rz1 - rz0) / 2.4))
      for (let i = 1; i < nx; i++) {
        const x = rx0 + ((rx1 - rx0) * i) / nx
        bx(e, g, x - 0.12, x + 0.12, top - 0.22, top, rz0, rz1, plaster)
        for (const s of [-1, 1]) bx(e, g, x + s * 0.12 - 0.006, x + s * 0.12 + 0.006, top - 0.225, top - 0.205, rz0, rz1, metal, false)
      }
      for (let j = 1; j < nz; j++) {
        const z = rz0 + ((rz1 - rz0) * j) / nz
        bx(e, g, rx0, rx1, top - 0.22, top, z - 0.12, z + 0.12, plaster)
        for (const s of [-1, 1]) bx(e, g, rx0, rx1, top - 0.225, top - 0.205, z + s * 0.12 - 0.006, z + s * 0.12 + 0.006, metal, false)
      }
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < nz; j++) downlight(e, g, rx0 + ((rx1 - rx0) * (i + 0.5)) / nx, top, rz0 + ((rz1 - rz0) * (j + 0.5)) / nz, metal)
      break
    }
    case 'slots': {
      // Two linear light slots the length of the raft, edged in brass.
      const alongX = rx1 - rx0 > rz1 - rz0
      for (const t of [0.33, 0.67]) {
        if (alongX) {
          const z = rz0 + (rz1 - rz0) * t
          bx(e, g, rx0 + 0.3, rx1 - 0.3, top - 0.012, top - 0.002, z - 0.03, z + 0.03, lux.led, false)
          for (const s of [-1, 1]) bx(e, g, rx0 + 0.3, rx1 - 0.3, top - 0.02, top - 0.004, z + s * 0.04 - 0.008, z + s * 0.04 + 0.008, metal, false)
        } else {
          const x = rx0 + (rx1 - rx0) * t
          bx(e, g, x - 0.03, x + 0.03, top - 0.012, top - 0.002, rz0 + 0.3, rz1 - 0.3, lux.led, false)
          for (const s of [-1, 1]) bx(e, g, x + s * 0.04 - 0.008, x + s * 0.04 + 0.008, top - 0.02, top - 0.004, rz0 + 0.3, rz1 - 0.3, metal, false)
        }
      }
      break
    }
    case 'fins': {
      // Oak fins across the raft, 200 mm apart, 250 mm deep.
      const alongX = rx1 - rx0 > rz1 - rz0
      const len = alongX ? rx1 - rx0 : rz1 - rz0
      const n = Math.floor(len / 0.2)
      for (let i = 1; i < n; i++) {
        const v = (alongX ? rx0 : rz0) + i * 0.2
        if (alongX) bx(e, g, v - 0.02, v + 0.02, top - 0.27, top - 0.02, rz0 + 0.05, rz1 - 0.05, lux.oak, false)
        else bx(e, g, rx0 + 0.05, rx1 - 0.05, top - 0.27, top - 0.02, v - 0.02, v + 0.02, lux.oak, false)
      }
      break
    }
    case 'neon': {
      // Lines of light drawn across the black raft, cyan and magenta, on the diagonal.
      const n = Math.floor((rx1 - rx0 + rz1 - rz0) / 1.4)
      for (let i = 0; i < n; i++) {
        const along = rx1 - rx0 > rz1 - rz0
        const t = (i + 0.5) / n
        const len = Math.min(rx1 - rx0, rz1 - rz0) * 1.2
        const cx = along ? rx0 + (rx1 - rx0) * t : (rx0 + rx1) / 2
        const cz = along ? (rz0 + rz1) / 2 : rz0 + (rz1 - rz0) * t
        const m = new Mesh(new CylinderGeometry(0.012, 0.012, Math.min(len, 2.6), 6), i % 3 === 1 ? lux.neonMagenta : lux.neonCyan)
        m.rotation.set(PI / 2, 0, along ? PI / 4 : -PI / 4)
        m.position.set(cx, top - 0.03, cz)
        if (Math.abs(cx - (rx0 + rx1) / 2) < (rx1 - rx0) / 2 - 0.5 && Math.abs(cz - (rz0 + rz1) / 2) < (rz1 - rz0) / 2 - 0.5) g.add(m)
      }
      break
    }
    case 'slats': {
      // Walnut slats along the raft, 120 mm apart, with a dark gap between.
      const alongX = rx1 - rx0 > rz1 - rz0
      const len = alongX ? rz1 - rz0 : rx1 - rx0
      const n = Math.floor(len / 0.12)
      for (let i = 1; i < n; i++) {
        const v = (alongX ? rz0 : rx0) + i * 0.12
        if (alongX) bx(e, g, rx0 + 0.02, rx1 - 0.02, top - 0.07, top - 0.01, v - 0.035, v + 0.035, lux.walnut, false)
        else bx(e, g, v - 0.035, v + 0.035, top - 0.07, top - 0.01, rz0 + 0.02, rz1 - 0.02, lux.walnut, false)
      }
      break
    }
  }
}

/* ---------- walls ---------- */

/**
 * A shopfront's architecture: marble pilasters at its ends with a brass reveal and an uplight at
 * their foot, a light line under the bulkhead washing the glass.
 */
export function frontDetail(e: FloorCtx, axis: 'x' | 'z', at: number, from: number, to: number, out: number, glassTop: number) {
  const { g, lux } = e
  const sc = lux.schemes[e.level]
  const y = e.y
  const box = (a: number, b: number, y0: number, y1: number, o0: number, o1: number, m: Material, cast = true) => {
    const p = at + out * o0
    const q = at + out * o1
    return axis === 'x' ? bx(e, g, Math.min(p, q), Math.max(p, q), y0, y1, a, b, m, cast) : bx(e, g, a, b, y0, y1, Math.min(p, q), Math.max(p, q), m, cast)
  }
  for (const [a, b] of [[from, from + 0.32], [to - 0.32, to]]) {
    box(a, b, y, glassTop, -0.04, 0.08, sc.wall)
    // Brass reveal on its inner edge, and an uplight at its foot.
    const edge = a === from ? b : a
    box(edge - 0.008, edge + 0.008, y, glassTop, 0.08, 0.085, sc.metal, false)
    box((a + b) / 2 - 0.05, (a + b) / 2 + 0.05, y, y + 0.012, 0.085, 0.11, lux.led, false)
  }
  // A dark stone plinth along the front.
  box(from + 0.32, to - 0.32, y, y + 0.1, -0.02, 0.03, lux.wallNero)
  // The light line under the bulkhead.
  box(from + 0.32, to - 0.32, glassTop - 0.035, glassTop - 0.03, 0.06, 0.12, lux.led, false)
}

/** The lifts' wall: bookmatched marble, bronze portals round the doors, fluted walnut ends, a wall-washer above. */
export function liftWall(e: FloorCtx) {
  const { g, lux } = e
  const sc = lux.schemes[e.level]
  const x = LIFTS.x1
  const face = x + 0.007
  const top = e.y + e.ceiling
  const doors = LIFTS.cars.map((c) => c.z).sort((a, b) => a - b)
  const OPEN = 0.69
  let at = LIFTS.z0 + 0.6
  // Fluted walnut at both ends.
  for (const [a, b] of [[LIFTS.z0, LIFTS.z0 + 0.6], [LIFTS.z1 - 0.6, LIFTS.z1]]) {
    bx(e, g, x, face + 0.02, e.y, top, a, b, e.m.walnut)
    for (const z of [a, b]) bx(e, g, x, face + 0.03, e.y, top, z - 0.01, z + 0.01, sc.metal, false)
  }
  for (const c of doors) {
    bx(e, g, x, face, e.y, top, at, c - OPEN, sc.wall)
    bx(e, g, x, face, e.y + 2.29, top, c - OPEN, c + OPEN, sc.wall)
    // The bronze portal, standing proud round the architrave.
    bx(e, g, x, face + 0.05, e.y, e.y + 2.42, c - OPEN - 0.08, c - OPEN, lux.bronze)
    bx(e, g, x, face + 0.05, e.y, e.y + 2.42, c + OPEN, c + OPEN + 0.08, lux.bronze)
    bx(e, g, x, face + 0.05, e.y + 2.29, e.y + 2.42, c - OPEN - 0.08, c + OPEN + 0.08, lux.bronze)
    at = c + OPEN
  }
  bx(e, g, x, face, e.y, top, at, LIFTS.z1 - 0.6, sc.wall)
  // A wall-washer slot in the ceiling, its light falling down the marble.
  bx(e, g, x + 0.05, x + 0.12, top - 0.008, top - 0.002, LIFTS.z0 + 0.6, LIFTS.z1 - 0.6, lux.led, false)
  e.shade.foot(x + 0.008, LIFTS.z0, x + 0.008, LIFTS.z1, e.y + 0.01, 0.25, 0.35)
}

/**
 * The atrium's feature wall at the ground, facing the visitor from across the void: a field of
 * backlit honey onyx in a brass frame, set in Calacatta, on the end wall of the ramp enclosure.
 */
export function onyxWall(e: FloorCtx) {
  const { g, lux } = e
  const z = -4.2 + 0.075
  const y = e.y
  const top = y + e.ceiling
  bx(e, g, 0.0, 4.0, y, top, z, z + 0.04, lux.wallOro)
  bx(e, g, 0.4, 3.6, y + 0.5, top - 0.45, z + 0.04, z + 0.07, lux.onyx, false)
  for (const [a, b, c, d] of [[0.34, 3.66, y + 0.44, y + 0.5], [0.34, 3.66, top - 0.45, top - 0.39], [0.34, 0.4, y + 0.44, top - 0.39], [3.6, 3.66, y + 0.44, top - 0.39]])
    bx(e, g, a, b, c, d, z + 0.04, z + 0.09, lux.brass, false)
  // A marble plinth bench along its foot.
  bx(e, g, 0.3, 3.7, y, y + 0.44, z + 0.04, z + 0.5, lux.wallNero)
  bx(e, g, 0.32, 3.68, y + 0.44, y + 0.47, z + 0.06, z + 0.48, lux.leatherCognac)
  e.shade.rect(2.0, y + 0.012, z + 0.3, 3.5, 0.6, 0, 0.4)
}

/**
 * A drinking-water point built into the wall: a stone niche with a backlit onyx panel, a stainless
 * fountain with its bubbler and bottle filler, a brass frame, a drain grating at its foot.
 */
export function waterNiche(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number) {
  const { k, lux } = e
  const sc = lux.schemes[e.level]
  const g = new Group()
  g.position.set(x, e.y, z)
  g.rotation.y = yaw
  p.add(g)
  // Surround and the niche's back.
  k.box(g, 1.5, 2.6, 0.06, sc.wall, 0, 1.3, 0.03)
  k.box(g, 1.0, 1.25, 0.02, lux.onyx, 0, 1.55, 0.07)
  for (const [w, h, x0, y0] of [[1.06, 0.03, 0, 2.19], [1.06, 0.03, 0, 0.91], [0.03, 1.31, -0.515, 1.55], [0.03, 1.31, 0.515, 1.55]]) k.box(g, w, h, 0.03, lux.brass, x0, y0, 0.085)
  // The fountain: a stainless basin with a bubbler, and a bottle filler beside it.
  k.soft(g, 0.62, 0.16, 0.36, 0.04, lux.steel, -0.12, 0.9, 0.24)
  k.box(g, 0.5, 0.02, 0.26, lux.blackSteel, -0.12, 0.985, 0.24)
  k.cyl(g, 0.018, 0.022, 0.07, lux.chrome, -0.12, 1.02, 0.3, 16)
  k.soft(g, 0.24, 0.42, 0.14, 0.03, lux.steel, 0.36, 1.32, 0.14)
  k.box(g, 0.16, 0.2, 0.004, lux.blackSteel, 0.36, 1.3, 0.212)
  k.cyl(g, 0.012, 0.012, 0.004, lux.ledCool, 0.36, 1.46, 0.212, 12).rotation.x = PI / 2
  // The drain grating in the floor before it.
  k.box(g, 0.7, 0.004, 0.16, lux.steel, 0, 0.012, 0.42)
  const uv = e.s.wayfinding(['DRINKING WATER'], '#1e1a18', '#f3ead9', '#c9a86a')
  place(g, 0.9, 0.225, uv, e.s.lit, 0, 2.42, 0.064, 0)
  e.shade.rect(x, e.y + 0.012, z, 1.4, 0.5, yaw, 0.3)
}

/** Alabaster pendants: a pair over the lift lobby, each a glowing cylinder on a brass rod. */
export function alabasterPendants(e: FloorCtx) {
  const { k, lux, g } = e
  const top = e.y + e.ceiling
  for (const z of LIFTS.cars.map((c) => c.z)) {
    const x = LIFTS.x1 + 1.5
    k.cyl(g, 0.06, 0.06, 0.02, lux.brass, x, top - 0.01, z, 24)
    k.cyl(g, 0.006, 0.006, 0.7, lux.brass, x, top - 0.36, z, 8)
    k.cyl(g, 0.16, 0.16, 0.42, lux.opal, x, top - 0.92, z, 40)
    k.cyl(g, 0.165, 0.165, 0.02, lux.brass, x, top - 0.71, z, 40)
    k.cyl(g, 0.165, 0.165, 0.02, lux.brass, x, top - 1.13, z, 40)
  }
}

