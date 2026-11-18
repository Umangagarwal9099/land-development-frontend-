import { Color, Group, Mesh, PointLight, TorusGeometry, Vector3, type Material, type Object3D } from 'three'
import { rng } from '../textures'
import { Tris } from '../kalakalMall/skin'
import { rect, slab } from '../kalakalMall/solids'
import { shrub, SPECIES, tree, type Planting } from '../kalakalMall/foliage'
import { tropical } from '../kalakalClubhouse/plants'
import type { HotelCtx } from './ctx'
import { DECK, GL, POOL, SHELF } from './plan'
import { facing } from './shell'

/*
 * The pool deck behind the hotel: honed ivory travertine from the hotel's back to the stone
 * boundary walls, with raised travertine planters of coconut palms, paddle-leaved tropicals and
 * flowering shrubs along them. The 18 × 7.2 m pool lies parallel to the building in pale aqua
 * glass mosaic with a deep blue waterline band, under a limestone coping; a sun shelf with two
 * in-water loungers at its south end; a basalt water wall pouring three sheets of water into it
 * from the far side; a raised round spa beside its north end. Slatted teak loungers with thick
 * white cushions, in pairs under square canvas umbrellas with side tables; canopied daybeds in
 * the far corners; a lounge on a woven rug at each end by the hotel; small trees in round
 * planters; step lights, palm uplights and lanterns for the evening.
 */

const PI = Math.PI

/** The pool floor at x: shallow (1.2 m) at the south end, deep (1.6 m) at the north. */
const floorY = (x: number) => POOL.water - 1.2 - (0.4 * (x - POOL.x0)) / (POOL.x1 - POOL.x0)

function buildPool(ctx: HotelCtx, p: Object3D) {
  const { c, k } = ctx
  const { x0, x1, z0, z1, water } = POOL
  const tile = new Tris()
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z)
  // The walls, tiled from the coping down to the floor, facing into the pool.
  const n = 40
  for (let i = 0; i < n; i++) {
    const xa = x0 + ((x1 - x0) * i) / n
    const xb = x0 + ((x1 - x0) * (i + 1)) / n
    for (const [z, dir] of [[z0, 1], [z1, -1]] as const)
      facing(tile, v(xa, floorY(xa), z), v(xb, floorY(xb), z), v(xb, GL, z), v(xa, GL, z), [xa, floorY(xa)], [xb, floorY(xb)], [xb, GL], [xa, GL], v(0, 0, dir))
    facing(tile, v(xa, floorY(xa), z0), v(xb, floorY(xb), z0), v(xb, floorY(xb), z1), v(xa, floorY(xa), z1), [xa, z0], [xb, z0], [xb, z1], [xa, z1], v(0, 1, 0))
  }
  for (const [x, dir] of [[x0, 1], [x1, -1]] as const)
    facing(tile, v(x, floorY(x), z0), v(x, floorY(x), z1), v(x, GL, z1), v(x, GL, z0), [z0, floorY(x)], [z1, floorY(x)], [z1, GL], [z0, GL], v(dir, 0, 0))
  // The sun shelf: a ledge 0.3 m under the water across the south end, its step tiled.
  const sy = water - SHELF.depth
  facing(tile, v(SHELF.x0, sy, z0), v(SHELF.x1, sy, z0), v(SHELF.x1, sy, z1), v(SHELF.x0, sy, z1), [SHELF.x0, z0], [SHELF.x1, z0], [SHELF.x1, z1], [SHELF.x0, z1], v(0, 1, 0))
  facing(tile, v(SHELF.x1, floorY(SHELF.x1), z0), v(SHELF.x1, floorY(SHELF.x1), z1), v(SHELF.x1, sy, z1), v(SHELF.x1, sy, z0), [z0, 0], [z1, 0], [z1, 1], [z0, 1], v(1, 0, 0))
  tile.mesh(c.mosaic, p, 'pool_shell', false)
  // A band of deep blue glass tile at the waterline, round the walls.
  const band = new Tris()
  const b0 = water - 0.12
  const b1 = GL - 0.02
  for (const [z, dir] of [[z0 + 0.004, 1], [z1 - 0.004, -1]] as const)
    facing(band, v(x0, b0, z), v(x1, b0, z), v(x1, b1, z), v(x0, b1, z), [x0, b0], [x1, b0], [x1, b1], [x0, b1], v(0, 0, dir))
  for (const [x, dir] of [[x0 + 0.004, 1], [x1 - 0.004, -1]] as const)
    facing(band, v(x, b0, z0), v(x, b0, z1), v(x, b1, z1), v(x, b1, z0), [z0, b0], [z1, b0], [z1, b1], [z0, b1], v(dir, 0, 0))
  band.mesh(c.waterline, p, 'pool_waterline', false)
  // A dark lane line down the floor, and the water over it all.
  k.box(p, x1 - SHELF.x1 - 2, 0.01, 0.25, c.spandrel, (SHELF.x1 + x1) / 2, floorY((SHELF.x1 + x1) / 2) + 0.01, (z0 + z1) / 2, false).rotation.z = Math.atan(0.4 / (x1 - x0))
  const w = k.box(p, x1 - x0, 0.02, z1 - z0, c.water, (x0 + x1) / 2, water - 0.01, (z0 + z1) / 2, false)
  w.name = 'pool_water'
  w.receiveShadow = true
  // Lights in the long walls, 0.45 m under the water.
  for (let x = x0 + 2; x < x1 - 1; x += 3)
    for (const [z, dir] of [[z0, 1], [z1, -1]] as const) k.cyl(p, 0.14, 0.14, 0.03, c.poolLight, x, water - 0.45, z + dir * 0.016, 20).rotation.x = PI / 2
  // The coping: 450 mm limestone with a rounded nose, round the pool.
  const cp = 0.45
  slab(p, rect(x0 - cp, x1 + cp, z0 - cp, z1 + cp), GL - 0.05, GL + 0.035, [c.poolCoping, c.poolCoping], [rect(x0, x1, z0, z1)], false, 'pool_coping')
  // Steps into the pool at its north-west corner.
  for (let i = 0; i < 4; i++) {
    const y = water - 0.25 * (i + 1)
    k.box(p, 1.6, 0.04, 0.32, c.poolCoping, x1 - 1.0, y + 0.02, z1 - 0.16 - i * 0.3, false)
  }
  for (const dx of [-0.7, 0.7]) {
    const g = k.at(x1 - 1.0 + dx, z1 + 0.25, 0, GL)
    k.cyl(g, 0.025, 0.025, 1.0, c.stainless, 0, 0.5, 0, 10)
    k.box(g, 0.05, 0.05, 0.6, c.stainless, 0, 1.0, -0.28)
    k.cyl(g, 0.025, 0.025, 1.0, c.stainless, 0, 0.5, -0.56, 10)
  }
}

/* ---------- furniture ---------- */

/**
 * A teak sun lounger: a slatted bed on a frame with wheels at its head, its back raised, a thick
 * white cushion with rounded edges, a headrest pillow and a rolled towel at its foot.
 */
function lounger(ctx: HotelCtx, p: Object3D, x: number, z: number, yaw: number, towel = true) {
  const { c, k } = ctx
  const g = k.at(x, z, yaw, GL)
  p.add(g)
  for (const s of [-1, 1]) k.box(g, 0.055, 0.09, 2.0, c.teak, s * 0.335, 0.25, 0)
  for (const [lx, lz] of [[-0.33, 0.92], [0.33, 0.92]]) k.box(g, 0.055, 0.21, 0.055, c.teak, lx, 0.105, lz)
  for (const s of [-1, 1]) {
    const wheel = k.cyl(g, 0.07, 0.07, 0.035, c.darkTimber, s * 0.37, 0.07, -0.88, 20)
    wheel.rotation.z = PI / 2
  }
  for (let i = 0; i < 10; i++) k.box(g, 0.64, 0.022, 0.085, c.teak, 0, 0.29, -0.15 + i * 0.112)
  k.soft(g, 0.66, 0.09, 1.3, 0.035, c.cushion, 0, 0.345, 0.33)
  const back = new Group()
  back.position.set(0, 0.3, -0.22)
  back.rotation.x = -0.72
  g.add(back)
  for (let i = 0; i < 6; i++) k.box(back, 0.64, 0.022, 0.085, c.teak, 0, 0, -0.06 - i * 0.12)
  k.soft(back, 0.66, 0.09, 0.74, 0.035, c.cushion, 0, 0.055, -0.38)
  k.soft(back, 0.44, 0.1, 0.22, 0.045, c.cushion, 0, 0.14, -0.62)
  if (towel) {
    const t = k.cyl(g, 0.075, 0.075, 0.5, c.sage, 0, 0.47, 0.85, 20)
    t.rotation.z = PI / 2
  }
  ctx.shade.rect(x, GL + 0.004, z, 0.8, 2.0, -yaw, 0.18)
}

/** A round teak side table with a stone top, a carafe and two glasses on it. */
function sideTable(ctx: HotelCtx, p: Object3D, x: number, z: number) {
  const { c, k } = ctx
  k.cyl(p, 0.24, 0.24, 0.03, c.poolCoping, x, GL + 0.44, z, 28)
  k.cyl(p, 0.035, 0.05, 0.42, c.teak, x, GL + 0.21, z, 10)
  k.cyl(p, 0.18, 0.2, 0.02, c.teak, x, GL + 0.01, z, 24)
  k.cyl(p, 0.045, 0.055, 0.22, c.tintGlass, x - 0.06, GL + 0.57, z, 14)
  for (const d of [0.07, 0.12]) k.cyl(p, 0.03, 0.026, 0.1, c.tintGlass, x + d, GL + 0.505, z + (d - 0.1) * 2, 12)
}

/** A square umbrella, 3 m across: canvas on teak ribs and pole, a valance, a weighted stone base. */
function umbrella(ctx: HotelCtx, p: Object3D, x: number, z: number) {
  const { c, k } = ctx
  const H = 2.55
  const R = 1.5
  k.cyl(p, 0.035, 0.035, H + 0.38, c.teak, x, GL + (H + 0.38) / 2, z, 12)
  k.cyl(p, 0.3, 0.32, 0.1, c.basalt, x, GL + 0.05, z, 28)
  k.cyl(p, 0.05, 0.03, 0.12, c.teak, x, GL + H + 0.5, z, 10)
  const t = new Tris()
  const apex = new Vector3(x, GL + H + 0.42, z)
  const corner = (i: number) => new Vector3(x + R * (i === 0 || i === 3 ? -1 : 1), GL + H, z + R * (i < 2 ? -1 : 1))
  for (let i = 0; i < 4; i++) {
    const a = corner(i)
    const b = corner((i + 1) % 4)
    t.tri(apex, a, b, [0, 1], [0, 0], [1, 0])
    t.tri(apex, b, a, [0, 1], [1, 0], [0, 0])
    const da = a.clone().setY(a.y - 0.16)
    const db = b.clone().setY(b.y - 0.16)
    t.quad(a, b, db, da, [0, 1], [1, 1], [1, 0], [0, 0])
    t.quad(b, a, da, db, [0, 1], [1, 1], [1, 0], [0, 0])
    // A rib under each seam, from the runner to the corner.
    const rib = k.box(p, 0.025, 0.025, a.distanceTo(apex) - 0.1, c.teak, (a.x + apex.x) / 2, (a.y + apex.y) / 2 - 0.04, (a.z + apex.z) / 2)
    rib.lookAt(apex)
  }
  t.mesh(c.canvas, p, 'umbrella', true)
  ctx.shade.rect(x, GL + 0.004, z, 0.8, 0.8, 0, 0.12)
}

/**
 * An outdoor lounge on a woven rug: a deep teak sofa and two armchairs with rounded white
 * cushions and sage and taupe throw pillows, round a travertine table with a glowing lantern.
 */
function loungeSet(ctx: HotelCtx, p: Object3D, x: number, z: number, yaw: number) {
  const { c, k } = ctx
  const g = k.at(x, z, yaw, GL)
  p.add(g)
  k.box(g, 4.0, 0.012, 3.2, c.rug, 0, 0.006, 0, false)
  const seat = (w: number, sx: number, sz: number, ry: number, pillows: Material[]) => {
    const s = new Group()
    s.position.set(sx, 0, sz)
    s.rotation.y = ry
    g.add(s)
    k.box(s, w, 0.26, 0.9, c.teak, 0, 0.15, 0)
    for (const e of [-1, 1]) k.box(s, 0.1, 0.6, 0.9, c.teak, e * (w / 2 - 0.05), 0.32, 0)
    k.box(s, w, 0.46, 0.09, c.teak, 0, 0.4, -0.41)
    k.soft(s, w - 0.24, 0.16, 0.78, 0.06, c.cushion, 0, 0.36, 0.03)
    k.soft(s, w - 0.24, 0.42, 0.18, 0.07, c.cushion, 0, 0.62, -0.28)
    pillows.forEach((m, i) => {
      const px = (i - (pillows.length - 1) / 2) * 0.55
      const pl = k.soft(s, 0.42, 0.4, 0.12, 0.06, m, px, 0.62, -0.13)
      pl.rotation.x = -0.25
      pl.rotation.z = (i % 2 ? 1 : -1) * 0.08
    })
  }
  seat(2.4, 0, -1.05, 0, [c.sage, c.taupe, c.sage])
  seat(1.0, -1.7, 0.25, PI / 2, [c.taupe])
  seat(1.0, 1.7, 0.25, -PI / 2, [c.taupe])
  k.cyl(g, 0.55, 0.5, 0.36, c.poolCoping, 0, 0.18, 0.25, 40)
  k.cyl(g, 0.11, 0.11, 0.26, c.lantern, 0, 0.49, 0.25, 20)
  k.cyl(g, 0.12, 0.12, 0.03, c.bronze, 0, 0.635, 0.25, 20)
  ctx.shade.rect(x, GL + 0.004, z, 3.8, 3.0, -yaw, 0.12)
}

/**
 * A daybed under a teak canopy: four posts, a white canvas roof, sheer curtains gathered at the
 * posts, a deep mattress with a row of cushions and pillows, a lantern at its foot.
 */
function daybed(ctx: HotelCtx, p: Object3D, x: number, z: number, yaw: number) {
  const { c, k } = ctx
  const g = k.at(x, z, yaw, GL)
  p.add(g)
  const [w, d, h] = [2.8, 2.6, 2.75]
  k.box(g, w + 0.2, 0.12, d + 0.2, c.basalt, 0, 0.06, 0)
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    k.box(g, 0.12, h, 0.12, c.teak, (sx * w) / 2, h / 2 + 0.12, (sz * d) / 2)
    k.box(g, 0.34, h - 0.4, 0.14, c.curtain, sx * (w / 2 - 0.24), (h - 0.4) / 2 + 0.3, (sz * d) / 2)
  }
  for (const s of [-1, 1]) {
    k.box(g, w + 0.12, 0.16, 0.1, c.teak, 0, h + 0.04, (s * d) / 2)
    k.box(g, 0.1, 0.16, d + 0.12, c.teak, (s * w) / 2, h + 0.04, 0)
  }
  k.box(g, w + 0.3, 0.05, d + 0.3, c.canvas, 0, h + 0.15, 0)
  for (const s of [-1, 1]) k.box(g, w + 0.3, 0.22, 0.02, c.canvas, 0, h + 0.03, (s * (d + 0.3)) / 2)
  k.box(g, 2.2, 0.3, 2.0, c.teak, 0, 0.27, 0)
  k.soft(g, 2.1, 0.2, 1.9, 0.07, c.cushion, 0, 0.52, 0)
  for (const s of [-0.62, 0, 0.62]) k.soft(g, 0.6, 0.48, 0.18, 0.08, c.cushion, s, 0.84, -0.8)
  for (const [s, m] of [[-0.45, c.sage], [0.1, c.taupe], [0.55, c.sage]] as const) {
    const pl = k.soft(g, 0.4, 0.38, 0.12, 0.06, m, s, 0.8, -0.62)
    pl.rotation.x = -0.3
  }
  k.cyl(g, 0.12, 0.12, 0.3, c.lantern, 0.9, 0.27, 1.25, 20)
  ctx.shade.rect(x, GL + 0.004, z, w + 0.6, d + 0.6, -yaw, 0.2)
}

/* ---------- planting ---------- */

/** A coconut palm: a slender, slightly leaning trunk and a crown of arching pinnate fronds. */
function palm(plant: Planting, x: number, y: number, z: number, h: number, seed: number) {
  const r = rng(seed)
  const lean = new Vector3(r() - 0.5, 0, r() - 0.5).normalize().multiplyScalar(0.05 + r() * 0.07)
  let prev = new Vector3(x, y, z)
  const n = 10
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const next = new Vector3(x + lean.x * h * t * t, y + h * t, z + lean.z * h * t * t)
    plant.limb(prev, next, 0.16 - 0.04 * (t - 1 / n), 0.16 - 0.04 * t)
    prev = next
  }
  const top = prev
  const tint = new Color()
  const fronds = 16
  for (let f = 0; f < fronds; f++) {
    const az = (f / fronds) * PI * 2 + r() * 0.3
    const out = new Vector3(Math.cos(az), 0, Math.sin(az))
    const side = new Vector3(-out.z, 0, out.x)
    const rise = 0.35 + r() * 0.6
    const len = 2.5 + r() * 0.9
    let q = top.clone()
    const segs = 6
    for (let s = 0; s < segs; s++) {
      const u = (s + 1) / segs
      const dir = out.clone().add(new Vector3(0, rise - 1.7 * u, 0)).normalize()
      const shade = 0.85 + r() * 0.25
      tint.setRGB(0.95 * shade, 1.0 * shade, 0.82 * shade)
      // Laid flat along the frond: its width runs sideways, its face looks up (and out).
      const face = new Vector3().crossVectors(side, dir).normalize()
      plant.card('neem', q, dir, face, 1.1 - 0.55 * u, len / segs + 0.1, Math.floor(r() * 4), tint, out.clone().add(new Vector3(0, 1.4, 0)).normalize())
      q = q.clone().addScaledVector(dir, len / segs)
    }
  }
  plant.footprints.push({ x: top.x, y, z: top.z, r: 2.0, strength: 0.25 })
}

/**
 * A raised planter faced in travertine with a stone coping, filled: palms standing up out of it
 * at `palms`, paddle-leaved tropicals and flowering shrubs between, low shrubs along its front.
 */
function planterBed(ctx: HotelCtx, p: Object3D, x0: number, x1: number, z0: number, z1: number, palms: [number, number, number][], seed: number) {
  const { c, k, plant } = ctx
  const H = 0.6
  slab(p, rect(x0, x1, z0, z1), 0, GL + H, [c.mulch, c.travertine], [], true, 'pool_planter')
  const cp = 0.06
  for (const [a, b, e, f] of [[x0 - cp, x1 + cp, z0 - cp, z0 + 0.2], [x0 - cp, x1 + cp, z1 - 0.2, z1 + cp], [x0 - cp, x0 + 0.2, z0, z1], [x1 - 0.2, x1 + cp, z0, z1]])
    k.box(p, b - a, 0.05, f - e, c.poolCoping, (a + b) / 2, GL + H + 0.025, (e + f) / 2)
  const top = GL + H
  const r = rng(seed)
  palms.forEach(([px, pz, ph], i) => {
    palm(plant, px, top, pz, ph, seed + 10 + i)
    k.cyl(p, 0.08, 0.08, 0.05, c.poolLight, px + 0.45, top + 0.03, pz, 12).castShadow = false
  })
  const along = x1 - x0 > z1 - z0
  const L = along ? x1 - x0 : z1 - z0
  const W = along ? z1 - z0 : x1 - x0
  for (let s = 0.7; s < L - 0.5; s += 1.15) {
    const at = (u: number, v: number): [number, number] => (along ? [x0 + u, z0 + v] : [x0 + v, z0 + u])
    const [tx, tz] = at(s + (r() - 0.5) * 0.3, W * (0.3 + r() * 0.4))
    if (palms.some(([px, pz]) => Math.hypot(px - tx, pz - tz) < 0.9)) continue
    if (r() < 0.55) tropical(plant, tx, top, tz, 1.3 + r() * 0.6, seed + 100 + Math.round(s * 10))
    else shrub(plant, tx, top, tz, 0.5 + r() * 0.2, 0.9 + r() * 0.5, seed + 200 + Math.round(s * 10), r() < 0.5 ? 'bloom' : 'shrub')
    const [fx, fz] = at(s + 0.5, W * 0.15)
    shrub(plant, fx, top, fz, 0.32, 0.4, seed + 300 + Math.round(s * 10), 'hedge')
  }
}

/** A round travertine planter with a small tree, or (`low`) a mound of flowering shrubs. */
function treePlanter(ctx: HotelCtx, p: Object3D, x: number, z: number, seed: number, low = false) {
  const { c, k, plant } = ctx
  k.cyl(p, 0.8, 0.7, 0.75, c.poolCoping, x, GL + 0.375, z, 40)
  k.cyl(p, 0.74, 0.74, 0.02, c.mulch, x, GL + 0.73, z, 32).castShadow = false
  if (low) shrub(plant, x, GL + 0.74, z, 0.6, 1.2, seed, 'bloom')
  else tree(plant, SPECIES.neem, x, GL + 0.74, z, seed, 0.45)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * PI * 2
    shrub(plant, x + Math.cos(a) * 0.45, GL + 0.74, z + Math.sin(a) * 0.45, 0.22, 0.3, seed + i + 1, 'hedge')
  }
  k.cyl(p, 0.07, 0.07, 0.04, c.poolLight, x + 0.4, GL + 0.76, z + 0.3, 12).castShadow = false
}

/* ---------- the water wall and the spa ---------- */

/**
 * A wall of dark honed basalt along the pool's far edge, three stainless spouts in it pouring
 * sheets of water in shallow arcs into the pool, lit from below.
 */
function waterWall(ctx: HotelCtx, p: Object3D) {
  const { c, k } = ctx
  const { z0, water } = POOL
  const zw = z0 - 0.45 - 0.3
  k.box(p, 9, 1.45, 0.6, c.basalt, 0, GL + 0.725, zw)
  k.box(p, 9.12, 0.06, 0.7, c.poolCoping, 0, GL + 1.48, zw)
  const sheet = new Tris()
  for (const sx of [-3, 0, 3]) {
    const y0 = GL + 1.05
    const zs = zw + 0.3
    k.box(p, 0.9, 0.05, 0.22, c.stainless, sx, y0 + 0.03, zs + 0.08)
    const pt = (t: number) => new Vector3(0, y0 - (y0 - water) * t * t, zs + 0.18 + 1.1 * t)
    for (let i = 0; i < 10; i++) {
      const a = pt(i / 10)
      const b = pt((i + 1) / 10)
      const L = (q: Vector3) => q.clone().setX(sx - 0.4)
      const R = (q: Vector3) => q.clone().setX(sx + 0.4)
      sheet.quad(L(a), R(a), R(b), L(b), [0, i / 10], [1, i / 10], [1, (i + 1) / 10], [0, (i + 1) / 10])
    }
    k.box(p, 0.8, 0.01, 0.5, c.poolLight, sx, water - 0.02, zs + 1.35, false)
  }
  sheet.mesh(c.waterSheet, p, 'water_blades', false)
  ctx.shade.rect(0, GL + 0.004, zw - 0.5, 9.5, 0.8, 0, 0.3)
}

/** A raised round spa beside the pool: basalt rim, mosaic inside, warm-lit water. */
function spa(ctx: HotelCtx, p: Object3D, x: number, z: number) {
  const { c, k, lighting } = ctx
  const R = 1.7
  const top = GL + 0.45
  k.cyl(p, R + 0.3, R + 0.3, 0.45, c.travertine, x, GL + 0.225, z, 64)
  const rim = new Mesh(new TorusGeometry(R + 0.15, 0.15, 10, 72), c.basalt)
  rim.rotation.x = PI / 2
  rim.position.set(x, top + 0.02, z)
  rim.castShadow = true
  p.add(rim)
  k.cyl(p, R, R, 0.02, c.water, x, top - 0.1, z, 64).castShadow = false
  k.cyl(p, R - 0.02, R - 0.02, 0.9, c.mosaic, x, top - 0.56, z, 48).castShadow = false
  k.cyl(p, 0.12, 0.12, 0.02, c.poolLight, x, top - 0.98, z, 16).castShadow = false
  const l = lighting.light(new PointLight('#a8eeff', 2, 5, 2), 0)
  l.position.set(x, top - 0.4, z)
  p.add(l)
  ctx.shade.pool(x, GL + 0.004, z, R + 0.6, R + 0.6, 0.3)
}

/* ---------- the deck ---------- */

/**
 * The pool deck behind the hotel: honed travertine from the hotel's back to the boundary walls,
 * raised planters of palms and tropicals along the walls, the pool with its water wall, sun shelf
 * and spa; loungers in pairs under umbrellas on both sides, a canopied daybed in each far corner,
 * a lounge on a rug at each end by the hotel, small trees in round planters, low lights.
 */
export function buildPoolDeck(ctx: HotelCtx, p: Object3D) {
  const { c, k, lighting, plant, shade } = ctx
  const g = new Group()
  g.name = 'pool_deck'
  p.add(g)
  const { x0, x1, z0, z1 } = POOL
  const cp = 0.45
  slab(g, rect(DECK.x0, DECK.x1, DECK.z0, DECK.z1), 0, GL, [c.travertine, c.concrete], [rect(x0 - cp, x1 + cp, z0 - cp, z1 + cp)], false, 'pool_deck')
  buildPool(ctx, g)
  waterWall(ctx, g)
  spa(ctx, g, x1 + cp + 3.2, (z0 + z1) / 2)
  // Two in-water loungers on the sun shelf.
  for (const sz of [-1.1, 1.1]) {
    const lg = k.at(x0 + 1.5, (z0 + z1) / 2 + sz, PI / 2, POOL.water - SHELF.depth)
    g.add(lg)
    k.soft(lg, 0.66, 0.12, 1.2, 0.05, c.cushion, 0, 0.06, 0.25)
    const back = k.soft(lg, 0.66, 0.12, 0.7, 0.05, c.cushion, 0, 0.3, -0.55)
    back.rotation.x = -0.6
  }
  // Planters along the back and side walls.
  const W = 1.5
  planterBed(ctx, g, DECK.x0 + 0.05, DECK.x1 - 0.05, DECK.z0 + 0.05, DECK.z0 + W, [[-14.5, DECK.z0 + 0.8, 7.6], [-7.5, DECK.z0 + 0.8, 8.4], [0.5, DECK.z0 + 0.8, 7.2], [8, DECK.z0 + 0.8, 8.2], [14.8, DECK.z0 + 0.8, 7.4]], 5100)
  planterBed(ctx, g, DECK.x0 + 0.05, DECK.x0 + 1.3, DECK.z0 + W + 0.6, -29.5, [[DECK.x0 + 0.7, -40.5, 7.8], [DECK.x0 + 0.7, -33, 7.0]], 5200)
  planterBed(ctx, g, DECK.x1 - 1.3, DECK.x1 - 0.05, DECK.z0 + W + 0.6, -29.5, [[DECK.x1 - 0.7, -43.5, 7.4], [DECK.x1 - 0.7, -35, 8.0]], 5300)
  // Loungers in pairs, feet to the water, each pair under an umbrella with a side table: three
  // pairs on the hotel's side, one either side of the water wall.
  for (const px of [-6, 0, 6]) {
    for (const s of [-0.48, 0.48]) lounger(ctx, g, px + s, z1 + cp + 2.3, 0, s < 0)
    sideTable(ctx, g, px + 1.25, z1 + cp + 2.9)
    umbrella(ctx, g, px, z1 + cp + 3.1)
  }
  for (const px of [-7.6, 7.6]) {
    for (const s of [-0.48, 0.48]) lounger(ctx, g, px + s, z0 - cp - 2.3, PI, s > 0)
    sideTable(ctx, g, px + (px < 0 ? -1.25 : 1.25), z0 - cp - 2.9)
    umbrella(ctx, g, px, z0 - cp - 3.1)
  }
  // A daybed in each far corner, a lounge at each end by the hotel, trees in planters beside them.
  daybed(ctx, g, -12.8, -46.3, 0)
  daybed(ctx, g, 12.8, -46.3, 0)
  loungeSet(ctx, g, -13.0, -30.2, PI)
  loungeSet(ctx, g, 13.0, -30.2, PI)
  for (const [tx, tz, seed] of [[-16.0, -34.6, 5401], [16.0, -34.6, 5402]] as const) treePlanter(ctx, g, tx, tz, seed)
  for (const [tx, tz, seed] of [[-5.5, -44.6, 5403], [5.5, -44.6, 5404]] as const) treePlanter(ctx, g, tx, tz, seed, true)
  // Step lights round the coping.
  for (let x = x0; x <= x1 + 1e-6; x += 3)
    for (const z of [z0 - cp - 0.25, z1 + cp + 0.25]) k.box(g, 0.24, 0.012, 0.08, c.led, x, GL + 0.004, z, false)
  // The evening's light over the deck and from the water.
  for (const x of [-7, 7]) {
    const l = lighting.light(new PointLight('#ffd9ad', 5, 12, 2), 0)
    l.position.set(x, 3.0, (z0 + z1) / 2)
    g.add(l)
  }
  const pl = lighting.light(new PointLight('#9fe8ff', 4, 10, 2), 0)
  pl.position.set((x0 + x1) / 2, POOL.water - 0.6, (z0 + z1) / 2)
  g.add(pl)
  for (const f of plant.footprints) if (f.z < DECK.z1) shade.pool(f.x, f.y + 0.006, f.z, f.r, f.r, f.strength)
}
