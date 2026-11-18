import { CircleGeometry, Group, Mesh, PlaneGeometry, PointLight, TorusGeometry, Vector3, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import { Tris } from '../kalakalMall/skin'
import { lettersAlong, type HotelCtx, type LetterTone } from './ctx'
import { CUP, CUP_BANDS, CUP_FLOOR, cupR, GL, LV } from './plan'
import { notchHole, outline, within } from './podium'
import { cap, facing } from './shell'

/*
 * Starbucks, from reference 2: the giant coffee cup at the north end of the front, standing in a
 * notch in the main block, which wraps round behind it as the tower does in the reference. From
 * the ground: the glazed café on bronze mullions with its doors on the axis; the sleeve band in
 * board-formed concrete; the tall glazed upper café with the siren on its right; the top band with
 * STARBUCKS COFFEE in raised letters; the white lid's rim and its domed top. Inside, two floors of
 * café: the counter and merchandise wall below, tables round a lantern pendant above, both under
 * round coves of light. Its back, inside the hotel, is the café's back wall.
 */

const PI = Math.PI
const { x: CX, z: CZ } = CUP

/** A point at angle a (0 = +z, the road; π/2 = +x, north) and radius r round the cup's axis. */
const at = (a: number, r: number): Point2 => [CX + r * Math.sin(a), CZ + r * Math.cos(a)]

/**
 * A conical band of the cup from angle a0 to a1, y0 to y1, radius r0 at the bottom and r1 at the
 * top, facing out (or in). UVs: metres round and up, scaled by `su`, `sv`.
 */
function cone(t: Tris, a0: number, a1: number, y0: number, y1: number, r0: number, r1: number, inward = false, su = 1, sv = 1, v0 = y0) {
  const rm = (r0 + r1) / 2
  const n = Math.max(3, Math.ceil((Math.abs(a1 - a0) * rm) / 0.25))
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    const b = a0 + ((a1 - a0) * (i + 1)) / n
    const v = (ang: number, r: number, y: number) => new Vector3(CX + r * Math.sin(ang), y, CZ + r * Math.cos(ang))
    const m = (a + b) / 2
    const want = new Vector3(Math.sin(m), (r0 - r1) / Math.max(0.01, y1 - y0), Math.cos(m)).multiplyScalar(inward ? -1 : 1)
    const sa = (a - a0) * rm * su
    const sb = (b - a0) * rm * su
    facing(t, v(a, r0, y0), v(b, r0, y0), v(b, r1, y1), v(a, r1, y1), [sa, (y0 - v0) * sv], [sb, (y0 - v0) * sv], [sb, (y1 - v0) * sv], [sa, (y1 - v0) * sv], want)
  }
}

/** A level ring of the cup between radii, at y, facing up or down. */
function annulus(t: Tris, a0: number, a1: number, y: number, rIn: number, rOut: number, up: boolean) {
  const n = Math.max(3, Math.ceil((Math.abs(a1 - a0) * rOut) / 0.25))
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    const b = a0 + ((a1 - a0) * (i + 1)) / n
    const p = [at(a, rIn), at(b, rIn), at(b, rOut), at(a, rOut)]
    const v = p.map(([x, z]) => new Vector3(x, y, z))
    facing(t, v[0], v[1], v[2], v[3], p[0], p[1], p[2], p[3], new Vector3(0, up ? 1 : -1, 0))
  }
}

/** The angles either side of the front at radius r where the cup passes inside the main block. */
function visible(r: number): [number, number] {
  const base = outline(0)
  const outside = (a: number) => !within(at(a, r), base)
  let a0 = 0
  while (a0 > -PI && outside(a0 - 0.01)) a0 -= 0.01
  let a1 = 0
  while (a1 < PI && outside(a1 + 0.01)) a1 += 0.01
  // Into the building a little, so the glass meets the main block's front with no gap.
  return [a0 - 0.03, a1 + 0.03]
}

/** Radial mullions round a glazed band, about `pitch` apart. */
function mullions(ctx: HotelCtx, a0: number, a1: number, y0: number, y1: number, r0: number, r1: number, pitch: number, mat: Material) {
  const n = Math.max(1, Math.round(((a1 - a0) * (r0 + r1)) / 2 / pitch))
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    const g = ctx.k.at(...at(a, (r0 + r1) / 2 + 0.03), a, (y0 + y1) / 2)
    const m = ctx.k.box(g, 0.06, y1 - y0, 0.12, mat, 0, 0, 0)
    // Lean out with the cup's taper.
    m.rotation.x = Math.atan2(r1 - r0, y1 - y0)
  }
}

const RAISED: LetterTone = { face: '#efe9de', emissive: '#000000', intensity: 0, side: '#cfc6b5', weight: 600 }

export function buildStarbucks(ctx: HotelCtx, parent: Object3D) {
  const { c, k, lighting } = ctx
  const g = new Group()
  g.name = 'starbucks'
  parent.add(g)
  const glass = new Tris()
  const concrete = new Tris()
  const white = new Tris()
  const frames = new Tris()
  const B = CUP_BANDS
  const full: [number, number] = [-PI, PI]

  // Ground floor glass, with the doors on the axis.
  const [g0, g1] = visible(B.glass[2])
  const door = 0.235
  const [y0, y1, r0, r1] = B.glass
  const doorHead = 2.75
  for (const [a, b] of [[g0, -door], [door, g1]] as [number, number][]) {
    cone(glass, a, b, y0, y1, r0, r1)
    mullions(ctx, a, b, y0, y1, r0, r1, 1.2, c.bronze)
  }
  const rAt = (y: number) => r0 + ((r1 - r0) * (y - y0)) / (y1 - y0)
  cone(glass, -door, door, doorHead, y1, rAt(doorHead), r1)
  cone(frames, g0, g1, y0, y0 + 0.08, r0 + 0.02, r0 + 0.02)
  cone(frames, -door, door, doorHead - 0.08, doorHead, rAt(doorHead) + 0.02, rAt(doorHead) + 0.02)
  // The doors: a pair of glass leaves on the chord, which slide apart for a walker in the property view.
  const chordZ = CZ + r0 * Math.cos(door)
  const half = r0 * Math.sin(door)
  const leafW = half
  for (const s of [-1, 1]) {
    const p = ctx.openings ? new Group() : g
    if (p !== g) {
      p.name = `autoleaf_sbux_${s}`
      p.userData.slide = [s * (leafW - 0.06), 0, 0]
      g.add(p)
    }
    const lx = CX + s * (leafW / 2 + (ctx.openings ? 0 : leafW - 0.1))
    k.box(p, leafW - 0.02, doorHead - GL - 0.05, 0.012, c.glass, lx, (doorHead + GL) / 2, chordZ, false)
    for (const e of [-1, 1]) k.box(p, 0.05, doorHead - GL - 0.05, 0.05, c.bronze, lx + (e * (leafW - 0.04)) / 2, (doorHead + GL) / 2, chordZ)
    k.box(p, 0.03, 1.2, 0.06, c.bronze, lx - s * (leafW / 2 - 0.15), GL + 1.1, chordZ + 0.06)
  }
  k.box(g, half * 2 + 0.1, 0.12, 0.25, c.bronze, CX, doorHead + 0.02, chordZ - 0.05)
  k.box(g, half * 2, 0.008, 1.6, c.plantDark, CX, GL + 0.004, chordZ + 0.85, false)

  // The sleeve band, stepping out over the ground floor glass and back to the upper glass.
  const [sy0, sy1, sr0, sr1] = B.sleeve
  cone(concrete, ...full, sy0, sy1, sr0, sr1)
  annulus(concrete, ...full, sy0, r1 - 0.02, sr0, false)
  annulus(concrete, ...full, sy1, B.upper[2] - 0.02, sr1, true)

  // The upper café's glass on bronze mullions.
  const [u0, u1] = visible(B.upper[2])
  const [uy0, uy1, ur0, ur1] = B.upper
  cone(glass, u0, u1, uy0, uy1, ur0, ur1)
  mullions(ctx, u0, u1, uy0, uy1, ur0, ur1, 1.25, c.bronze)
  cone(frames, u0, u1, uy0, uy0 + 0.1, ur0 + 0.02, ur0 + 0.025)

  // The top band, its soffit over the glass, and the lid.
  const [by0, by1, br0, br1] = B.band
  cone(concrete, ...full, by0, by1, br0, br1)
  annulus(concrete, ...full, by0, ur1 - 0.02, br0, false)
  const [ry0, ry1, rr0, rr1] = B.rim
  // The rim: a white bead with rounded edges.
  annulus(white, ...full, ry0, br1 - 0.02, rr0 - 0.06, false)
  cone(white, ...full, ry0, ry0 + 0.08, rr0 - 0.06, rr0)
  cone(white, ...full, ry0 + 0.08, ry1 - 0.08, rr0, rr1)
  cone(white, ...full, ry1 - 0.08, ry1, rr1, rr1 - 0.05)
  // The lid's shoulder, a quarter ellipse up to its top.
  const [, ly1, lr0, lr1] = B.lid
  let [py, pr]: [number, number] = [ry1, rr1 - 0.05]
  for (let i = 1; i <= 10; i++) {
    const t = (i / 10) * (PI / 2)
    const y = ry1 + (ly1 - ry1) * Math.sin(t)
    const r = lr1 + (lr0 - lr1) * Math.cos(t)
    cone(white, ...full, py, y, pr, r)
    ;[py, pr] = [y, r]
  }
  cap(white, Array.from({ length: 96 }, (_, i) => at((i / 96) * 2 * PI, lr1)), ly1, true)
  // A raised ring on the lid's top, as on the cup's own lid.
  cone(white, ...full, ly1, ly1 + 0.14, lr1 - 0.6, lr1 - 0.65)
  cone(white, ...full, ly1, ly1 + 0.14, lr1 - 1.0, lr1 - 0.95, true)
  annulus(white, ...full, ly1 + 0.14, lr1 - 1.0, lr1 - 0.62, true)

  glass.mesh(c.glass, g, 'cup_glass', false)
  concrete.mesh(c.cupConcrete, g, 'cup_concrete')
  white.mesh(c.lid, g, 'cup_lid')
  frames.mesh(c.bronze, g, 'cup_frames')

  // STARBUCKS COFFEE across the top band, in raised letters centred on the front.
  const ly = 14.25
  const lr = cupR(ly) + 0.012
  const { letters, total } = lettersAlong(ctx, 'STARBUCKS COFFEE', 0.78, 0.1, RAISED)
  for (const l of letters) {
    const a = (l.at - total / 2) / lr
    const [x, z] = at(a, lr)
    l.group.position.set(x, ly, z)
    l.group.rotation.y = a
    l.group.rotation.x = Math.atan2(br1 - br0, by1 - by0)
    g.add(l.group)
  }

  // The siren, on the upper glass to the right of the front.
  const sa = 0.66
  const sy = 10.55
  const sr = cupR(sy) + 0.28
  const [sx, sz] = at(sa, sr)
  const disc = new Mesh(new CircleGeometry(1.72, 72), c.sirenBack)
  disc.position.set(sx - Math.sin(sa) * 0.06, sy, sz - Math.cos(sa) * 0.06)
  disc.rotation.y = sa
  disc.castShadow = true
  g.add(disc)
  const face = new Mesh(new PlaneGeometry(3.44, 3.44), c.siren)
  face.position.set(sx, sy, sz)
  face.rotation.y = sa
  g.add(face)
  const rim = new Mesh(new TorusGeometry(1.72, 0.05, 8, 72), c.bronze)
  rim.position.copy(disc.position)
  rim.rotation.y = sa
  g.add(rim)
  for (const dy of [-0.9, 0.9]) {
    const b = k.at(...at(sa, sr - 0.17), sa, sy + dy)
    k.box(b, 0.08, 0.08, 0.34, c.bronze, 0, 0, 0)
  }

  buildInterior(ctx, g)
  buildNotch(ctx, g)

  ctx.shade.pool(CX, GL + 0.004, CZ, 5.2, 5.2, 0.35)
  const l = lighting.light(new PointLight('#ffd49c', 8, 9, 2), 0.1)
  l.position.set(CX, 2.9, CZ + 1.5)
  g.add(l)
  const l2 = lighting.light(new PointLight('#ffd49c', 8, 10, 2), 0.1)
  l2.position.set(CX, 9.5, CZ + 1.2)
  g.add(l2)
}

/**
 * Two floors of café behind the glass: stone floor, the counter in a curve before the merchandise
 * wall, high tables at the glass, a round cove of light; upstairs, café tables round a lantern
 * pendant under a deep round coffer.
 */
function buildInterior(ctx: HotelCtx, g: Group) {
  const { c, k } = ctx
  const disc = (r: number, y: number, mat: Material, up: boolean, name: string) => {
    const t = new Tris()
    cap(t, Array.from({ length: 96 }, (_, i) => at((i / 96) * 2 * PI, r)), y, up)
    t.mesh(mat, g, name, false)
  }
  const { glass, sleeve, upper } = CUP_BANDS
  disc(glass[3], GL + 0.012, c.lobbyFloor, true, 'cup_floor')
  disc(sleeve[2] - 0.05, sleeve[0] - 0.05, c.cafeCeiling, false, 'cup_ceiling_g')
  disc(upper[2] - 0.02, CUP_FLOOR, c.oak, true, 'cup_floor_1')
  disc(upper[3] - 0.02, upper[1] - 0.2, c.cafeCeiling, false, 'cup_ceiling_1')
  for (const [r, y] of [[3.0, sleeve[0] - 0.12], [3.6, upper[1] - 0.3], [2.4, upper[1] - 0.3]] as const) {
    const ring = new Mesh(new TorusGeometry(r, 0.05, 8, 96), c.cove)
    ring.rotation.x = PI / 2
    ring.position.set(CX, y, CZ)
    g.add(ring)
  }
  // The counter, curving round the back of the ground floor.
  for (let a = PI - 0.95; a <= PI + 0.95; a += 0.2) {
    const b = k.at(...at(a, 2.7), a, GL)
    k.box(b, 0.58, 1.02, 0.7, c.darkTimber, 0, 0.51, 0)
    k.box(b, 0.6, 0.05, 0.78, c.poolCoping, 0, 1.045, 0.03)
    k.box(b, 0.58, 0.03, 0.02, c.led, 0, 0.06, 0.36, false)
  }
  // High tables by the glass, clear of the doors, with stools.
  for (const a of [-1.05, -0.55, 0.55, 1.05]) {
    const [x, z] = at(a, 3.6)
    k.cyl(g, 0.32, 0.32, 0.04, c.oak, x, GL + 1.06, z, 24)
    k.cyl(g, 0.04, 0.04, 1.02, c.stool, x, GL + 0.53, z, 8)
    for (const d of [-0.55, 0.55]) {
      const [sx, sz] = at(a + d / 3.6, 3.6)
      k.cyl(g, 0.19, 0.19, 0.05, c.darkTimber, sx, GL + 0.76, sz, 16)
      k.cyl(g, 0.025, 0.025, 0.74, c.stool, sx, GL + 0.38, sz, 6)
    }
  }
  // Upstairs: round tables with chairs round the front, the lantern over the middle.
  for (let a = -1.5; a <= 1.51; a += 0.5) {
    const [x, z] = at(a, 3.5)
    k.cyl(g, 0.42, 0.42, 0.04, c.oak, x, CUP_FLOOR + 0.74, z, 24)
    k.cyl(g, 0.05, 0.05, 0.72, c.stool, x, CUP_FLOOR + 0.36, z, 8)
    for (const d of [-0.75, 0.75]) {
      const [sx, sz] = at(a + d / 3.5, 3.5)
      k.box(g, 0.42, 0.45, 0.42, c.darkTimber, sx, CUP_FLOOR + 0.225, sz)
    }
  }
  k.box(g, 3.2, 0.05, 0.9, c.oak, CX, CUP_FLOOR + 0.74, CZ - 0.6)
  for (const s of [-1, 1]) k.box(g, 3.0, 0.45, 0.4, c.darkTimber, CX, CUP_FLOOR + 0.225, CZ - 0.6 + s * 0.75)
  const top = upper[1] - 0.2
  k.cyl(g, 0.78, 0.78, 1.9, c.cove, CX, top - 2.6, CZ, 40)
  k.cyl(g, 0.8, 0.8, 0.06, c.bronze, CX, top - 1.62, CZ, 40)
  k.cyl(g, 0.8, 0.8, 0.06, c.bronze, CX, top - 3.58, CZ, 40)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2
    k.cyl(g, 0.008, 0.008, 1.6, c.bronze, CX + Math.cos(a) * 0.7, top - 0.8, CZ + Math.sin(a) * 0.7, 4).castShadow = false
  }
}

/**
 * Where the cup stands in the main block: its back, inside the hotel, is the café's back wall on
 * both floors (the merchandise wall below, shelves and a green wall above) and concrete elsewhere;
 * over the lid, the notch is roofed.
 */
function buildNotch(ctx: HotelCtx, g: Group) {
  const { c } = ctx
  const cafe = new Tris()
  const green = new Tris()
  const rest = new Tris()
  const base = outline(0)
  const top = CUP_BANDS.lid[1]
  const levels = [GL, ...LV.filter((y) => y > GL && y < top), top]
  const zones: [number, number, Tris, number][] = [
    [GL, CUP_BANDS.sleeve[0] - 0.05, cafe, GL],
    [CUP_FLOOR, CUP_FLOOR + 4.0, cafe, CUP_FLOOR],
    [CUP_FLOOR + 4.0, CUP_BANDS.upper[1] - 0.2, green, CUP_FLOOR + 4.0],
  ]
  for (let i = 0; i < levels.length - 1; i++) {
    const [ya, yb] = [levels[i], levels[i + 1]]
    const r = Math.max(cupR(ya + 1e-3), cupR(yb - 1e-3)) + 0.04
    // Round the back, between where the bow crosses this radius on either side.
    let a0 = 0
    while (a0 > -PI && !within(at(a0, r), base)) a0 -= 0.01
    let a1 = 0
    while (a1 < PI && !within(at(a1, r), base)) a1 += 0.01
    const from = a1
    const to = a0 + 2 * PI
    // Split the height into the café's zones and the rest.
    const cuts = new Set([ya, yb])
    for (const [z0, z1] of zones) for (const y of [z0, z1]) if (y > ya && y < yb) cuts.add(y)
    const ys = [...cuts].sort((p, q) => p - q)
    for (let j = 0; j < ys.length - 1; j++) {
      const [p, q] = [ys[j], ys[j + 1]]
      const zone = zones.find(([z0, z1]) => p >= z0 - 1e-6 && q <= z1 + 1e-6)
      if (zone) cone(zone[2], from, to, p, q, r, r, true, zone[2] === cafe ? 1 / 10 : 1, zone[2] === cafe ? 1 / 4 : 1, zone[3])
      else cone(rest, from, to, p, q, r, r, true)
    }
  }
  cafe.mesh(c.cafeWall, g, 'cup_back_cafe', false)
  green.mesh(c.greenPanel, g, 'cup_back_upper', false)
  rest.mesh(c.cupConcrete, g, 'cup_back')
  // The roof over the notch, round the lid's top.
  const r = Math.max(cupR(LV[4] + 1e-3), cupR(top - 1e-3)) + 0.04
  const roof = new Tris()
  const hole = notchHole(r)
  cap(roof, hole, top - 0.01, true)
  roof.mesh(c.roof, g, 'cup_notch_roof', false)
}
