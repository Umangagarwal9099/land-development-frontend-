import { CylinderGeometry, ExtrudeGeometry, Group, Mesh, PointLight, Shape, Vector3, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import { rectPoly, type Openings } from '../basement'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import type { Contact } from './contact'
import type { Planting } from './foliage'
import type { MallMaterials } from './materials'
import { LIFTS, STAIRS, VOID } from './interior/units'
import { BX0, BX1, ENTRY_X, facadePoint, FRONT_Z, GL, L1, L2, L3, L4, lean, LINK, LOBBY, LOOP, PLAZA_Z, REAR_Z, ROOF, SHOPFRONT, skinBottom } from './plan'
import { BACKING, plumb, ribbon, Tris } from './skin'
import { sheet, slab } from './solids'

export interface MallCtx {
  k: Kit
  c: MallMaterials
  lighting: Lighting
  /** Planting gathered across the site, built as a few meshes at the end. */
  plant: Planting
  /** Contact shadows and occlusion, likewise. */
  shade: Contact
  /** In the property view: what to leave open for the way down to the basements (see basement/). */
  openings?: Openings
}

const PI = Math.PI

/** A box turned to face along the loop's outward normal at s (its local +z out of the building). */
function alongLoop({ k }: MallCtx, parent: Object3D, s: number, d: number, w: number, h: number, depth: number, y: number, mat: Material, cast = true) {
  const [x, z] = LOOP.at(s, d)
  const [nx, nz] = LOOP.normal(s)
  const m = k.box(parent, w, h, depth, mat, x, y, z, cast)
  m.rotation.y = Math.atan2(nx, nz)
  return m
}

/** A cylinder strut between two points. */
function strut(parent: Object3D, a: Vector3, b: Vector3, r: number, mat: Material) {
  const len = a.distanceTo(b)
  const m = new Mesh(new CylinderGeometry(r, r, len, 10), mat)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize())
  m.castShadow = true
  parent.add(m)
  return m
}

/* ---------- the podium and the ground floor ---------- */

/** The building's plinth and the raised forecourt in front of it: one level surface at +0.45. */
export function podiumOutline(): Point2[] {
  const loop = LOOP.polygon(0, 0.4)
  // The loop behind the front corners' fillets, then the forecourt across the full building width.
  const start = loop.findIndex(([, z], i) => z <= 10 && loop[(i + loop.length - 1) % loop.length][1] > 10)
  const behind: Point2[] = []
  for (let i = 0; i < loop.length; i++) {
    const p = loop[(start + i) % loop.length]
    if (p[1] > 10) break
    behind.push(p)
  }
  // A notch at the north end holds the accessible ramp down to the apron (see site.ts).
  return [[BX1, 10], ...behind, [BX0, 10], [BX0, PLAZA_Z], [8, PLAZA_Z], [8, PLAZA_Z - 1.5], [15.8, PLAZA_Z - 1.5], [15.8, PLAZA_Z], [BX1, PLAZA_Z]]
}

function buildPodium(ctx: MallCtx, parent: Object3D) {
  const { c } = ctx
  const open = ctx.openings
  // In the property view the podium is open over the ramp tunnels and the stair well and lift
  // shaft; the wells are closed over until the basement is built (see basement/).
  // The mall's two lifts come down through it too, to the car park (see interior/core.ts).
  const shafts = open ? [{ x0: LIFTS.x0 + 0.2, x1: LIFTS.x1 - 0.2, z0: LIFTS.z0 + 0.2, z1: LIFTS.z1 - 0.2 }] : []
  const holes = open ? [...open.ramps, ...open.wells, ...shafts].map(rectPoly) : []
  slab(parent, podiumOutline(), 0, GL, [c.surface('travertine', 1, 1), c.granite], holes, true, 'podium')
  open?.wells.forEach((w, i) => slab(parent, rectPoly(w), GL - 0.02, GL, c.surface('travertine', 1, 1), [], false, `void_well_${i}`))
}

/** Shopfront glazing round the ground floor under the overhang; the rear is the service wall. */
function buildShopfronts(ctx: MallCtx, parent: Object3D) {
  const { c } = ctx
  const bot = skinBottom
  const isRear = (s: number) => LOOP.normal(s)[1] < -0.7
  // The entrance doors stand in their own frame (see buildEntrance).
  const inDoor = (s: number) => {
    const [x, z] = LOOP.at(s)
    return z > LINK.z - 0.5 && z < LINK.z + 0.5 && Math.abs(x - ENTRY_X) < 2.25
  }
  // Fire stairs 1 and 2 open straight out through the ground floor's glass (see interior/units.ts).
  const exits = STAIRS.filter((st) => st.exit.face === '-x' || st.exit.face === '+x').map((st) => LOOP.nearest(st.exit.face === '-x' ? BX0 : BX1, st.exit.at))
  const inExit = (s: number) => exits.some((e) => Math.abs(s - e) < 0.62)
  const glazed = (s: number) => !isRear(s) && !inDoor(s) && !inExit(s)
  const glass = new Tris()
  const wall = new Tris()
  const rails = new Tris()
  for (const [s0, s1] of LOOP.runs(glazed, 0.05)) {
    ribbon(glass, s0, s1, (s) => plumb(s, GL, SHOPFRONT), (s) => plumb(s, bot(s) - 0.05, SHOPFRONT))
    ribbon(rails, s0, s1, (s) => plumb(s, GL, SHOPFRONT + 0.03), (s) => plumb(s, GL + 0.12, SHOPFRONT + 0.03))
    // Mullions at 1.6 m.
    const n = Math.max(1, Math.round((s1 - s0) / 1.6))
    for (let i = 0; i <= n; i++) {
      const s = s0 + ((s1 - s0) * i) / n
      const h = bot(s) - 0.05 - GL
      alongLoop(ctx, parent, s, SHOPFRONT, 0.07, h, 0.16, GL + h / 2, c.mullion)
    }
  }
  // Door-head transom, and a spandrel at first-floor level where the glass runs double height.
  for (const [s0, s1] of LOOP.runs((s) => glazed(s) && bot(s) > 3.7, 0.05))
    ribbon(rails, s0, s1, (s) => plumb(s, 3.05, SHOPFRONT + 0.03), (s) => plumb(s, 3.15, SHOPFRONT + 0.03))
  for (const [s0, s1] of LOOP.runs((s) => !isRear(s) && bot(s) > 6.5, 0.05))
    ribbon(rails, s0, s1, (s) => plumb(s, L1 - 0.32, SHOPFRONT + 0.03), (s) => plumb(s, L1 + 0.05, SHOPFRONT + 0.03))
  // The rear wall, open at the basement portals in the property view (the ramps run in behind it).
  const inPortal = (s: number) => {
    if (!ctx.openings) return false
    const [x] = LOOP.at(s, SHOPFRONT)
    return [PORTALS.in, PORTALS.out].some((px) => Math.abs(x - px) < PORTALS.w / 2)
  }
  for (const [s0, s1] of LOOP.runs((s) => isRear(s) && !inPortal(s))) ribbon(wall, s0, s1, (s) => plumb(s, 0.1, SHOPFRONT), (s) => plumb(s, bot(s), SHOPFRONT))
  for (const [s0, s1] of LOOP.runs((s) => isRear(s) && inPortal(s))) ribbon(wall, s0, s1, (s) => plumb(s, GL + PORTALS.h, SHOPFRONT), (s) => plumb(s, bot(s), SHOPFRONT))
  // The exit doors: a steel leaf in a frame, a wall panel over it, the lit sign.
  for (const e of exits) {
    ribbon(wall, e - 0.62, e + 0.62, (s) => plumb(s, GL + 2.2, SHOPFRONT), (s) => plumb(s, bot(s), SHOPFRONT))
    alongLoop(ctx, parent, e, SHOPFRONT, 1.04, 2.15, 0.06, GL + 1.075, c.plantDark)
    for (const d of [-0.56, 0.56]) alongLoop(ctx, parent, e + d, SHOPFRONT, 0.08, 2.2, 0.16, GL + 1.1, c.mullion)
    alongLoop(ctx, parent, e, SHOPFRONT + 0.05, 0.5, 0.18, 0.04, GL + 2.45, c.exitSign, false)
  }
  glass.mesh(c.shopGlass, parent, 'shopfront_glass', false)
  wall.mesh(c.surface('greige', 1, 1), parent, 'service_wall')
  rails.mesh(c.mullion, parent, 'shopfront_rails')

  // Slim columns under the overhang along the main front, clear of the entrance.
  const front = LOOP.runs((s) => LOOP.normal(s)[1] > 0.6 && Math.abs(LOOP.at(s)[0] - ENTRY_X) > 6.2 && skinBottom(s) > 4.2, 0.1)
  for (const [s0, s1] of front) {
    const n = Math.max(1, Math.round((s1 - s0) / 7.2))
    for (let i = 0; i <= n; i++) {
      const s = s0 + 0.4 + ((s1 - s0 - 0.8) * i) / n
      const [x, z] = LOOP.at(s, -0.62)
      const h = skinBottom(s) - 0.05 - GL
      ctx.k.cyl(parent, 0.26, 0.26, h, c.soffit, x, GL + h / 2, z, 32)
      // A stainless shoe at the foot and a collar under the soffit, as the cladding is finished on site.
      ctx.k.cyl(parent, 0.285, 0.285, 0.22, c.chromeRail, x, GL + 0.11, z, 32)
      ctx.k.cyl(parent, 0.28, 0.28, 0.08, c.chromeRail, x, skinBottom(s) - 0.09, z, 32)
      ctx.shade.pool(x, GL + 0.005, z, 0.75, 0.75, 0.55)
    }
  }

  // Occlusion along the foot of the glass, inside and out, and over the arcade under the overhang.
  const line = LOOP.polygon(SHOPFRONT, 0.4)
  ctx.shade.edge(line, GL + 0.004, 1.4, 1, 0.55, true)
  ctx.shade.edge(line, GL + 0.004, 0.8, -1, 0.35, true)

  // Downlights in the soffit, every 2.4 m round the building.
  const n = Math.round(LOOP.length / 2.4)
  for (let i = 0; i < n; i++) {
    const s = (i * LOOP.length) / n
    const [x, z] = LOOP.at(s, -0.62)
    ctx.k.cyl(parent, 0.09, 0.09, 0.02, c.downlight, x, skinBottom(s) - 0.065, z, 12).castShadow = false
  }
}

/**
 * On the master plan, what shows through the glass: the floors' slabs with their lit ceilings and
 * a lit core of shops behind. (The property view builds the real interior instead: see interior/.)
 */
function buildPlanInterior(ctx: MallCtx, parent: Object3D) {
  const { c, k } = ctx
  const inner = LOOP.polygon(BACKING - 0.02, 0.4)
  const void_ = [rectPoly({ x0: VOID[0], x1: VOID[1], z0: VOID[2], z1: VOID[3] })]
  for (const [i, y] of [L1, L2, L3, L4].entries()) {
    slab(parent, inner, y - (i === 0 ? 0.25 : 0.3), y, c.backing, void_, false)
    sheet(parent, inner, y - (i === 0 ? 0.26 : 0.31), c.ceiling, true, void_)
  }
  sheet(parent, inner, ROOF - 0.36, c.ceiling, true, void_)
  for (const [y0, y1] of [[GL, L1 - 0.25], [L1, L2 - 0.3], [L2, L3 - 0.3], [L3, L4 - 0.3], [L4, ROOF - 0.35]])
    k.box(parent, 23.2, y1 - y0, 17, c.shops, 0, (y0 + y1) / 2, -14, false)
}

/* ---------- entrance ---------- */

function buildEntrance(ctx: MallCtx, parent: Object3D) {
  const { c, k, lighting } = ctx
  const zg = LINK.z + SHOPFRONT
  // Automatic sliding doors: two fixed side lights and two sliding leaves under a head box with its sensor.
  const doors = { x0: ENTRY_X - 2.2, x1: ENTRY_X + 2.2, h: 2.9 }
  const leaf = (doors.x1 - doors.x0) / 4
  // (The middle one is the leaves' meeting stile: walkable, the sliding leaves carry it away.)
  for (let i = 0; i <= 4; i++) if (!(i === 2 && ctx.openings)) k.box(parent, 0.09, doors.h, 0.14, c.mullion, doors.x0 + i * leaf, GL + doors.h / 2, zg + 0.08)
  for (let i = 0; i < 4; i++) {
    const x = doors.x0 + (i + 0.5) * leaf
    const slide = i === 1 || i === 2 ? 0.1 : 0
    // The middle two slide open for a walker in the property view (see walk/).
    const p = slide && ctx.openings ? new Group() : parent
    if (p !== parent) {
      p.name = `autoleaf_mall_${i}`
      p.userData.slide = [(i === 1 ? -1 : 1) * (leaf - 0.05), 0, 0]
      parent.add(p)
    }
    k.box(p, leaf - 0.1, doors.h - 0.1, 0.03, c.tintGlass, x, GL + doors.h / 2, zg + 0.1 + slide, false)
    if (slide) k.box(p, 0.03, 1.1, 0.05, c.mullion, x + (i === 1 ? leaf / 2 - 0.12 : -leaf / 2 + 0.12), GL + 1.1, zg + 0.16 + slide)
  }
  k.box(parent, doors.x1 - doors.x0 + 0.1, 0.32, 0.36, c.mullion, ENTRY_X, GL + doors.h + 0.16, zg + 0.18)
  k.box(parent, 0.3, 0.06, 0.08, c.plantDark, ENTRY_X, GL + doors.h - 0.02, zg + 0.38, false)
  // Entrance mat recessed in the paving.
  k.box(parent, doors.x1 - doors.x0, 0.01, 2.0, c.plantDark, ENTRY_X, GL + 0.003, zg + 1.15, false)

  // The canopy: a white blade cantilevered from the link, its front edge an ellipse, held by two tie rods.
  const back = zg + 0.12
  const half = 4.0
  const depth = 6.6
  const y0 = 4.95
  const y1 = 5.35
  const s = new Shape()
  s.moveTo(ENTRY_X - half, -back)
  s.lineTo(ENTRY_X + half, -back)
  for (let a = 0; a <= 32; a++) {
    const t = (a / 32) * PI
    s.lineTo(ENTRY_X + half * Math.cos(t), -(back + depth * Math.sin(t)))
  }
  const g = new ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 })
  g.rotateX(-PI / 2)
  g.translate(0, y0, 0)
  const canopy = new Mesh(g, c.acp)
  canopy.castShadow = true
  canopy.receiveShadow = true
  canopy.name = 'entrance_canopy'
  parent.add(canopy)
  for (let ix = -2; ix <= 2; ix++)
    for (let iz = 0; iz < 4; iz++) {
      const x = ENTRY_X + ix * 1.25
      const z = back + 0.9 + iz * 1.35
      const inside = ((x - ENTRY_X) / half) ** 2 + ((z - back) / depth) ** 2 < 0.78
      if (inside) k.cyl(parent, 0.1, 0.1, 0.02, c.downlight, x, y0 - 0.05, z, 14).castShadow = false
    }
  for (const dx of [-2.4, 2.4]) {
    const a = new Vector3(ENTRY_X + dx, y1, back + 4.6)
    const b = new Vector3(ENTRY_X + dx * 1.15, 8.0, LINK.z + 0.25)
    strut(parent, a, b, 0.045, c.frame)
  }
  ctx.shade.pool(ENTRY_X, GL + 0.006, back + depth * 0.45, half * 1.1, depth * 0.7, 0.16)
  for (const dx of [-1.6, 1.6]) {
    const l = lighting.light(new PointLight('#ffd7a3', 9, 12, 2), 0)
    l.position.set(ENTRY_X + dx, y0 - 0.4, back + 2.5)
    parent.add(l)
  }
  // The lobby's light on the master plan (the property view lights its own interior).
  if (!ctx.openings) {
    const lobbyLight = lighting.light(new PointLight('#ffe2bb', 14, 16, 2), 0.2)
    lobbyLight.position.set(ENTRY_X, 4.2, (LOBBY.z0 + LINK.z) / 2)
    parent.add(lobbyLight)
  }
}

/* ---------- roof ---------- */

/**
 * The roof: one slab over the whole building inside the skin's backing, open over the atrium for
 * its skylight, a ridged glass roof on a kerb whose light falls the full five floors.
 */
function buildRoof(ctx: MallCtx, parent: Object3D) {
  const { c, k } = ctx
  const roof = new Group()
  roof.name = 'roof'
  parent.add(roof)
  const outline = LOOP.polygon(BACKING - 0.02, 0.4)
  const [x0, x1, z0, z1] = VOID
  slab(roof, outline, ROOF - 0.35, ROOF, [c.roof, c.backing], [rectPoly({ x0, x1, z0, z1 })], true, 'roof_slab')
  // The kerb round the opening, white inside where it is seen from the floors below.
  const kerb = 0.6
  for (const [a, b, p, q] of [[x0 - 0.25, x1 + 0.25, z0 - 0.25, z0], [x0 - 0.25, x1 + 0.25, z1, z1 + 0.25], [x0 - 0.25, x0, z0, z1], [x1, x1 + 0.25, z0, z1]])
    k.box(roof, b - a, kerb + 0.35, q - p, c.acp, (a + b) / 2, ROOF - 0.35 + (kerb + 0.35) / 2, (p + q) / 2)
  // The glass: two slopes to a ridge along the atrium's length, glazing bars at 1.2 m.
  const base = ROOF + kerb
  const ridge = base + 1.6
  const xm = (x0 + x1) / 2
  const glass = new Tris()
  const P = (x: number, y: number, z: number) => new Vector3(x, y, z)
  for (const [a, b] of [[x0, xm], [xm, x1]]) {
    const ya = a === x0 ? base : ridge
    const yb = b === x1 ? base : ridge
    glass.quad(P(a, ya, z0), P(b, yb, z0), P(b, yb, z1), P(a, ya, z1), [a, z0], [b, z0], [b, z1], [a, z1])
    glass.quad(P(a, ya, z1), P(b, yb, z1), P(b, yb, z0), P(a, ya, z0), [a, z1], [b, z1], [b, z0], [a, z0])
  }
  // Gable ends.
  for (const z of [z0, z1]) {
    glass.tri(P(x0, base, z), P(x1, base, z), P(xm, ridge, z), [x0, 0], [x1, 0], [xm, 1])
    glass.tri(P(x1, base, z), P(x0, base, z), P(xm, ridge, z), [x1, 0], [x0, 0], [xm, 1])
  }
  glass.mesh(c.tintGlass, roof, 'atrium_skylight', false)
  strut(roof, P(xm, ridge, z0), P(xm, ridge, z1), 0.07, c.mullion)
  const n = Math.round((z1 - z0) / 1.2)
  for (let i = 0; i <= n; i++) {
    const z = z0 + ((z1 - z0) * i) / n
    strut(roof, P(x0, base, z), P(xm, ridge, z), 0.035, c.mullion)
    strut(roof, P(xm, ridge, z), P(x1, base, z), 0.035, c.mullion)
  }
  for (const x of [x0, x1]) strut(roof, P(x, base, z0), P(x, base, z1), 0.05, c.mullion)
  buildRooftopPlant(ctx, roof)
}

/** Lift machine rooms, stair headrooms, chillers, air handlers and tanks, kept below the skin's crown. */
function buildRooftopPlant(ctx: MallCtx, parent: Object3D) {
  const { c, k } = ctx
  const room = (x: number, z: number, w: number, d: number, h: number) => {
    ctx.shade.rect(x, ROOF + 0.005, z, w + 0.6, d + 0.6, 0, 0.55)
    k.box(parent, w, h, d, c.surface('greige', 1, 1), x, ROOF + h / 2, z)
    k.box(parent, w + 0.15, 0.12, d + 0.15, c.coping, x, ROOF + h + 0.06, z)
    k.box(parent, 0.9, 2.1, 0.06, c.plantDark, x, ROOF + 1.05, z + d / 2 + 0.03)
  }
  // Headrooms over the three fire stairs, and the lifts' machine room over their shafts.
  for (const st of STAIRS) {
    const [a, b, p, q] = st.zone
    room((a + b) / 2, (p + q) / 2, b - a + 0.4, q - p + 0.4, 2.6)
  }
  room((LIFTS.x0 + LIFTS.x1) / 2, (LIFTS.z0 + LIFTS.z1) / 2, LIFTS.x1 - LIFTS.x0 + 0.2, LIFTS.z1 - LIFTS.z0 + 0.2, 2.8)

  // Air-cooled chillers: a casing with a row of fan discs on top.
  for (const [x, z] of [[0.6, -22.4], [0.6, -18.6], [13.4, -21.6]] as const) {
    ctx.shade.rect(x, ROOF + 0.005, z, 6.6, 2.9, 0, 0.6)
    k.box(parent, 6, 1.2, 2.3, c.plant, x, ROOF + 0.3 + 0.6, z)
    k.box(parent, 6.2, 0.3, 2.5, c.plantDark, x, ROOF + 0.15, z)
    for (let i = 0; i < 3; i++) {
      k.cyl(parent, 0.82, 0.82, 0.16, c.plantDark, x - 2 + i * 2, ROOF + 1.58, z, 28)
      k.cyl(parent, 0.68, 0.68, 0.02, c.frame, x - 2 + i * 2, ROOF + 1.67, z, 28)
    }
  }
  // Air handling units along the north block, clear of the skylight, with duct risers into the roof.
  for (const z of [-12.5, -7.5, 8.0]) {
    k.box(parent, 2.2, 1.2, 4.2, c.plant, 11.6, ROOF + 0.6, z)
    k.box(parent, 0.9, 0.8, 0.9, c.soffit, 10.0, ROOF + 0.4, z + 1.2)
  }
  // Water tanks on plinths.
  for (const z of [-9.5, -6.3]) {
    k.box(parent, 2.9, 0.3, 2.9, c.concrete, -14, ROOF + 0.15, z)
    k.cyl(parent, 1.3, 1.3, 1.9, c.surface('white', 1, 1), -14, ROOF + 1.25, z, 32)
  }
  // Cable tray and service walkway between the plant.
  k.box(parent, 0.6, 0.06, 22, c.frame, 9.2, ROOF + 0.25, -10)
  k.box(parent, 18, 0.06, 0.8, c.frame, 0, ROOF + 0.25, -25.0)
}

/* ---------- signage and the media screen ---------- */

type Glyph = { width: number; shape: () => Shape }

const poly = (pts: number[][]) => {
  const s = new Shape()
  s.moveTo(pts[0][0], pts[0][1])
  for (const [x, y] of pts.slice(1)) s.lineTo(x, y)
  s.closePath()
  return s
}

/** The bowl of P and R: outer arc and counter, centred at (0.45, 0.69). */
function bowl(s: Shape, from: number) {
  s.absarc(0.45, 0.69, 0.31, from, PI / 2, false)
  s.lineTo(0, 1)
  s.closePath()
  const hole = new Shape()
  hole.moveTo(0.2, 0.55)
  hole.lineTo(0.45, 0.55)
  hole.absarc(0.45, 0.69, 0.14, -PI / 2, PI / 2, false)
  hole.lineTo(0.2, 0.83)
  hole.closePath()
  s.holes.push(hole)
  return s
}

/** A geometric grotesque cut on a unit cap height, for the mall's channel letters. */
const GLYPHS: Record<string, Glyph> = {
  P: {
    width: 0.76,
    shape: () => {
      const s = new Shape()
      s.moveTo(0, 0)
      s.lineTo(0.2, 0)
      s.lineTo(0.2, 0.38)
      s.lineTo(0.45, 0.38)
      return bowl(s, -PI / 2)
    },
  },
  R: {
    width: 0.79,
    shape: () => {
      const s = new Shape()
      s.moveTo(0, 0)
      s.lineTo(0.2, 0)
      s.lineTo(0.2, 0.38)
      s.lineTo(0.35, 0.38)
      s.lineTo(0.56, 0)
      s.lineTo(0.79, 0)
      s.lineTo(0.572, 0.405)
      return bowl(s, Math.atan2(0.405 - 0.69, 0.572 - 0.45))
    },
  },
  K: { width: 0.78, shape: () => poly([[0, 0], [0.2, 0], [0.2, 0.36], [0.3, 0.47], [0.55, 0], [0.78, 0], [0.44, 0.61], [0.76, 1], [0.52, 1], [0.2, 0.6], [0.2, 1], [0, 1]]) },
  I: { width: 0.2, shape: () => poly([[0, 0], [0.2, 0], [0.2, 1], [0, 1]]) },
  M: { width: 0.9, shape: () => poly([[0, 0], [0.19, 0], [0.19, 0.64], [0.4, 0.3], [0.5, 0.3], [0.71, 0.64], [0.71, 0], [0.9, 0], [0.9, 1], [0.72, 1], [0.45, 0.56], [0.18, 1], [0, 1]]) },
  E: { width: 0.64, shape: () => poly([[0, 0], [0.64, 0], [0.64, 0.19], [0.2, 0.19], [0.2, 0.41], [0.58, 0.41], [0.58, 0.59], [0.2, 0.59], [0.2, 0.81], [0.64, 0.81], [0.64, 1], [0, 1]]) },
  A: {
    width: 0.8,
    shape: () => {
      const s = poly([[0, 0], [0.21, 0], [0.27, 0.2], [0.53, 0.2], [0.59, 0], [0.8, 0], [0.5, 1], [0.3, 1]])
      s.holes.push(poly([[0.33, 0.36], [0.4, 0.6], [0.47, 0.36]]))
      return s
    },
  },
  L: { width: 0.62, shape: () => poly([[0, 0], [0.62, 0], [0.62, 0.2], [0.2, 0.2], [0.2, 1], [0, 1]]) },
  T: { width: 0.7, shape: () => poly([[0.25, 0], [0.45, 0], [0.45, 0.81], [0.7, 0.81], [0.7, 1], [0, 1], [0, 0.81], [0.25, 0.81]]) },
  N: { width: 0.78, shape: () => poly([[0, 0], [0.19, 0], [0.19, 0.62], [0.58, 0], [0.78, 0], [0.78, 1], [0.59, 1], [0.59, 0.38], [0.2, 1], [0, 1]]) },
  V: { width: 0.8, shape: () => poly([[0.3, 0], [0.5, 0], [0.8, 1], [0.59, 1], [0.4, 0.3], [0.21, 1], [0, 1]]) },
  O: {
    width: 0.9,
    shape: () => {
      const s = new Shape()
      s.absellipse(0.45, 0.5, 0.45, 0.5, 0, PI * 2, false, 0)
      const hole = new Shape()
      hole.absellipse(0.45, 0.5, 0.25, 0.31, 0, PI * 2, true, 0)
      s.holes.push(hole)
      return s
    },
  },
}
const TRACK = 0.13
const SPACE = 0.38

export const MALL_NAME = 'TERRANOVA MALL'

/** Width of a line of channel letters at cap height 1. */
export const textWidth = (text: string) =>
  [...text].reduce((w, ch, i) => w + (ch === ' ' ? SPACE : GLYPHS[ch].width) + (i ? TRACK : 0), 0)

/**
 * Channel letters: extruded faces lit from within, aluminium returns, centred on the group's origin
 * with their baseline at y = 0 and faces towards +z.
 */
export function channelLetters(c: MallMaterials, text: string, cap: number, depth: number) {
  const g = new Group()
  let x = -textWidth(text) / 2
  for (const ch of text) {
    if (ch === ' ') {
      x += SPACE + TRACK
      continue
    }
    const glyph = GLYPHS[ch]
    const geo = new ExtrudeGeometry(glyph.shape(), { depth: depth / cap, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.008, bevelSegments: 1, curveSegments: 14 })
    geo.scale(cap, cap, cap)
    const m = new Mesh(geo, [c.letter, c.letterReturn])
    m.position.x = x * cap
    m.castShadow = true
    g.add(m)
    x += glyph.width + TRACK
  }
  return g
}

function buildSignage(ctx: MallCtx, parent: Object3D) {
  const { c } = ctx
  // The name across the south block's crown, as in the reference, standing off the facets: centred
  // on the block, clear of where the crown dips towards the link.
  const x0 = BX0 + 0.8
  const x1 = LINK.x0 - 2.4
  const cap = Math.min(0.95, (x1 - x0) / textWidth(MALL_NAME))
  const y = ROOF - 1.7
  const letters = channelLetters(c, MALL_NAME, cap, 0.16)
  letters.position.set((x0 + x1) / 2, y, FRONT_Z + lean(y + cap / 2) + 0.42)
  letters.rotation.x = Math.atan(0.05)
  letters.name = 'sign_name'
  parent.add(letters)
}

/** The curved LED media wall on the north block, wrapping onto its north-east corner. */
function buildMediaScreen(ctx: MallCtx, parent: Object3D) {
  const { c, lighting } = ctx
  const s0 = LOOP.nearest(5.5, FRONT_Z)
  const s1 = s0 + 11.6
  const h0 = 7.0
  const h1 = 13.6
  const out = 0.5
  const screen = new Tris()
  const n = 48
  for (let i = 0; i < n; i++) {
    const sa = s0 + ((s1 - s0) * i) / n
    const sb = s0 + ((s1 - s0) * (i + 1)) / n
    const ua = i / n
    const ub = (i + 1) / n
    screen.quad(facadePoint(sa, h0, out), facadePoint(sb, h0, out), facadePoint(sb, h1, out), facadePoint(sa, h1, out), [ua, 0], [ub, 0], [ub, 1], [ua, 1])
  }
  screen.mesh(c.screen, parent, 'media_screen', false)
  // A dark frame round the screen, and its top and underside back to the skin.
  const frame = new Tris()
  ribbon(frame, s0 - 0.15, s1 + 0.15, (s) => facadePoint(s, h1, out + 0.01), (s) => facadePoint(s, h1 + 0.15, out + 0.01), 0.3)
  ribbon(frame, s0 - 0.15, s1 + 0.15, (s) => facadePoint(s, h0 - 0.15, out + 0.01), (s) => facadePoint(s, h0, out + 0.01), 0.3)
  ribbon(frame, s0 - 0.15, s1 + 0.15, (s) => facadePoint(s, h1 + 0.15, out + 0.01), (s) => facadePoint(s, h1 + 0.15, 0), 0.3)
  ribbon(frame, s0 - 0.15, s1 + 0.15, (s) => facadePoint(s, h0 - 0.15, 0), (s) => facadePoint(s, h0 - 0.15, out + 0.01), 0.3)
  for (const s of [s0 - 0.15, s1]) ribbon(frame, s, s + 0.15, (t) => facadePoint(t, h0, out + 0.01), (t) => facadePoint(t, h1, out + 0.01), 0.15)
  // Its two ends, closed back to the skin (both faces, since either may be in view).
  for (const s of [s0 - 0.15, s1 + 0.15]) {
    const [a, b, d, e] = [facadePoint(s, h0 - 0.15, 0), facadePoint(s, h0 - 0.15, out + 0.01), facadePoint(s, h1 + 0.15, out + 0.01), facadePoint(s, h1 + 0.15, 0)]
    frame.quad(a, b, d, e, [0, 0], [1, 0], [1, 1], [0, 1])
    frame.quad(a, e, d, b, [0, 0], [0, 1], [1, 1], [1, 0])
  }
  frame.mesh(c.plantDark, parent, 'media_frame')
  const spill = lighting.light(new PointLight('#c9d8ff', 6, 18, 2), 0)
  spill.position.copy(facadePoint((s0 + s1) / 2, 9, 5))
  parent.add(spill)
}

/* ---------- the rear ---------- */

/** The basement car park's portals in the rear wall: the way down at `in`, the way up at `out` (see site.ts). */
export const PORTALS = { in: 2.0, out: 13.5, w: 3.6, h: 2.6 }

/** Loading bay shutters, service doors and the basement portals on the rear wall. */
function buildService(ctx: MallCtx, parent: Object3D) {
  const { c, k } = ctx
  const z = REAR_Z - SHOPFRONT
  // Each portal: the dark of the ramp falling away behind a framed opening, a striped height bar
  // hung under the overhang, and the parking sign over the way in.
  for (const x of [PORTALS.in, PORTALS.out]) {
    const { w, h } = PORTALS
    k.box(parent, w, h, 0.04, c.void, x, GL + h / 2, z - 0.03, false).name = 'void_portal'
    k.box(parent, w + 0.3, 0.35, 0.3, c.mullion, x, GL + h + 0.175, z - 0.15)
    for (const dx of [-w / 2 - 0.08, w / 2 + 0.08]) k.box(parent, 0.16, h, 0.3, c.mullion, x + dx, GL + h / 2, z - 0.15)
    for (let i = 0; i < 6; i++) k.box(parent, w / 6, 0.15, 0.08, i % 2 ? c.plantDark : c.hazard, x - w / 2 + (i + 0.5) * (w / 6), GL + 2.45, REAR_Z - 0.9, false)
    for (const dx of [-w / 2 + 0.1, w / 2 - 0.1]) k.box(parent, 0.03, 5.6 - GL - 2.45, 0.03, c.mullion, x + dx, (5.6 + GL + 2.45) / 2, REAR_Z - 0.9, false)
  }
  k.box(parent, 0.9, 0.9, 0.04, c.pSign, PORTALS.in, GL + PORTALS.h + 0.9, z - 0.06, false)
  for (const x of [-10.2, -5.4]) {
    k.box(parent, 4.0, 4.2, 0.08, c.shutter, x, 0.1 + 2.1, z - 0.05)
    k.box(parent, 4.3, 0.45, 0.5, c.mullion, x, 4.45, z - 0.25)
    for (const dx of [-2.08, 2.08]) k.box(parent, 0.14, 4.2, 0.14, c.hazard, x + dx, 2.2, z - 0.08)
    // Dock bumpers.
    for (const dx of [-1.4, 1.4]) k.box(parent, 0.25, 0.4, 0.12, c.plantDark, x + dx, 1.0, z - 0.1)
  }
  for (const x of [-2.5, 10.55]) {
    k.box(parent, 1.2, 2.2, 0.06, c.surface('greige', 1, 1), x, 1.2, z - 0.04)
    k.box(parent, 1.36, 0.08, 0.1, c.mullion, x, 2.34, z - 0.05)
    k.box(parent, 0.5, 0.25, 0.06, c.lamp, x, 2.7, z - 0.05, false)
  }
}

export function buildBuilding(ctx: MallCtx, parent: Object3D) {
  buildPodium(ctx, parent)
  buildShopfronts(ctx, parent)
  if (!ctx.openings) buildPlanInterior(ctx, parent)
  buildEntrance(ctx, parent)
  buildRoof(ctx, parent)
  buildSignage(ctx, parent)
  buildMediaScreen(ctx, parent)
  buildService(ctx, parent)
}
