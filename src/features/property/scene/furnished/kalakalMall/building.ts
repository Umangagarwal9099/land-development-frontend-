import { CylinderGeometry, ExtrudeGeometry, Group, Mesh, PointLight, Shape, Vector3, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import type { Contact } from './contact'
import type { Planting } from './foliage'
import type { MallMaterials } from './materials'
import {
  aroundLobby, BX0, BX1, ENTRY_X, facadePoint, FRONT_Z, GL, L1, lean, LINK, LOBBY, LOBBY_ROOF, lobbyOf, LOOP, PLAZA_Z, REAR_Z, ROOF, SHOPFRONT, skinBottom,
} from './plan'
import { BACKING, plumb, ribbon, Tris } from './skin'
import { frontAt, rect, sheet, slab } from './solids'

export interface MallCtx {
  k: Kit
  c: MallMaterials
  lighting: Lighting
  /** Planting gathered across the site, built as a few meshes at the end. */
  plant: Planting
  /** Contact shadows and occlusion, likewise. */
  shade: Contact
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
  slab(parent, podiumOutline(), 0, GL, [c.surface('travertine', 1, 1), c.granite], [], true, 'podium')
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
  const glazed = (s: number) => !isRear(s) && !inDoor(s)
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
  for (const [s0, s1] of LOOP.runs(isRear)) ribbon(wall, s0, s1, (s) => plumb(s, 0.1, SHOPFRONT), (s) => plumb(s, bot(s), SHOPFRONT))
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

/** What shows through the glass: shop floors, lit ceilings, shop interiors, the double-height lobby. */
function buildInterior(ctx: MallCtx, parent: Object3D) {
  const { c, k } = ctx
  const inner = LOOP.polygon(SHOPFRONT - 0.02, 0.4)
  // First-floor slab over the shops, its ceiling lit; the lobby stays open through two floors.
  for (const piece of aroundLobby(inner)) {
    slab(parent, piece, L1 - 0.3, L1, c.backing, [], false)
    sheet(parent, piece, L1 - 0.31, c.ceiling, true)
  }
  // The shops' back walls: a lit core standing behind the shop units.
  const core = { x0: -11.6, x1: 11.6, z0: -19, z1: LOBBY.z0 }
  k.box(parent, core.x1 - core.x0, L1 - 0.3 - GL, core.z1 - core.z0, c.shops, (core.x0 + core.x1) / 2, (GL + L1 - 0.3) / 2, (core.z0 + core.z1) / 2, false)
  // Shop partitions at 9 m, square to the glass.
  for (const [s0, s1] of LOOP.runs((s) => LOOP.normal(s)[1] > -0.7, 0.5)) {
    const n = Math.max(1, Math.round((s1 - s0) / 9))
    for (let i = 1; i < n; i++) {
      const s = s0 + ((s1 - s0) * i) / n
      const [x] = LOOP.at(s)
      if (x > LOBBY.x0 - 0.5 && x < LOBBY.x1 + 0.5 && LOOP.at(s)[1] > LOBBY.z0) continue
      alongLoop(ctx, parent, s, SHOPFRONT - 3.2, 0.15, L1 - 0.3 - GL, 6, (GL + L1 - 0.3) / 2, c.white, false)
    }
  }

  // The lobby: the core's lit face rising to the lobby roof, the first-floor gallery across it,
  // and first-floor shopfronts down either side.
  const lobby = lobbyOf(inner)
  const top = LOBBY_ROOF - 0.05
  k.box(parent, LOBBY.x1 - LOBBY.x0, top - L1, 0.3, c.shops, (LOBBY.x0 + LOBBY.x1) / 2, (L1 + top) / 2, LOBBY.z0 - 0.15, false)
  for (const x of [LOBBY.x0, LOBBY.x1]) {
    const z1 = frontAt(inner, x) - 0.1
    k.box(parent, 0.25, top - L1, z1 - LOBBY.z0, c.shops, x + (x === LOBBY.x0 ? -0.12 : 0.12), (L1 + top) / 2, (LOBBY.z0 + z1) / 2, false)
  }
  const gallery = { z0: LOBBY.z0, z1: LOBBY.z0 + 2.4 }
  k.box(parent, LOBBY.x1 - LOBBY.x0, 0.3, gallery.z1 - gallery.z0, c.backing, (LOBBY.x0 + LOBBY.x1) / 2, L1 - 0.15, (gallery.z0 + gallery.z1) / 2)
  sheet(parent, rect(LOBBY.x0, LOBBY.x1, gallery.z0, gallery.z1), L1 - 0.31, c.ceiling, true)
  k.box(parent, LOBBY.x1 - LOBBY.x0, 1.05, 0.02, c.tintGlass, (LOBBY.x0 + LOBBY.x1) / 2, L1 + 0.53, gallery.z1 - 0.05, false)
  k.box(parent, LOBBY.x1 - LOBBY.x0, 0.05, 0.08, c.mullion, (LOBBY.x0 + LOBBY.x1) / 2, L1 + 1.08, gallery.z1 - 0.05)
  // Lobby ceiling, under the lower roof.
  sheet(parent, lobby, top, c.ceiling, true)
  // A pendant cluster of lit rings in the double-height lobby.
  for (const [r, y] of [[2.2, 9.4], [1.5, 8.8], [0.9, 8.3]] as const) {
    const ring = new Mesh(new CylinderGeometry(r, r, 0.08, 48, 1, true), c.letter)
    ring.position.set(ENTRY_X, y, (LOBBY.z0 + LINK.z) / 2 + 0.6)
    parent.add(ring)
  }
}

/* ---------- entrance ---------- */

function buildEntrance(ctx: MallCtx, parent: Object3D) {
  const { c, k, lighting } = ctx
  const zg = LINK.z + SHOPFRONT
  // Automatic sliding doors: two fixed side lights and two sliding leaves under a head box with its sensor.
  const doors = { x0: ENTRY_X - 2.2, x1: ENTRY_X + 2.2, h: 2.9 }
  const leaf = (doors.x1 - doors.x0) / 4
  for (let i = 0; i <= 4; i++) k.box(parent, 0.09, doors.h, 0.14, c.mullion, doors.x0 + i * leaf, GL + doors.h / 2, zg + 0.08)
  for (let i = 0; i < 4; i++) {
    const x = doors.x0 + (i + 0.5) * leaf
    const slide = i === 1 || i === 2 ? 0.1 : 0
    k.box(parent, leaf - 0.1, doors.h - 0.1, 0.03, c.tintGlass, x, GL + doors.h / 2, zg + 0.1 + slide, false)
    if (slide) k.box(parent, 0.03, 1.1, 0.05, c.mullion, x + (i === 1 ? leaf / 2 - 0.12 : -leaf / 2 + 0.12), GL + 1.1, zg + 0.16 + slide)
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
  const lobbyLight = lighting.light(new PointLight('#ffe2bb', 14, 16, 2), 0.2)
  lobbyLight.position.set(ENTRY_X, 7.5, (LOBBY.z0 + LINK.z) / 2)
  parent.add(lobbyLight)
}

/* ---------- roof ---------- */

const ATRIUM: Point2[] = [
  [ENTRY_X + 6, -9],
  [ENTRY_X, -3],
  [ENTRY_X - 6, -9],
  [ENTRY_X, -15],
]

function buildRoof(ctx: MallCtx, parent: Object3D) {
  const { c, k } = ctx
  const outline = LOOP.polygon(BACKING - 0.02, 0.4)
  const pieces = aroundLobby(outline)
  pieces.forEach((piece, i) => slab(parent, piece, ROOF - 0.35, ROOF, [c.roof, c.backing], i === 0 ? [ATRIUM] : [], true, 'roof_slab'))
  const lobby = lobbyOf(outline)
  slab(parent, lobby, LOBBY_ROOF, LOBBY_ROOF + 0.3, [c.roof, c.backing])

  // The step up from the lobby roof: clerestory glazing facing east, solid cheeks either side.
  const stepH = ROOF - LOBBY_ROOF - 0.3
  const stepY = LOBBY_ROOF + 0.3 + stepH / 2
  k.box(parent, LOBBY.x1 - LOBBY.x0, stepH, 0.04, c.tintGlass, (LOBBY.x0 + LOBBY.x1) / 2, stepY, LOBBY.z0 + 0.1, false)
  for (let x = LOBBY.x0; x <= LOBBY.x1 + 0.01; x += (LOBBY.x1 - LOBBY.x0) / 7) k.box(parent, 0.08, stepH, 0.14, c.mullion, x, stepY, LOBBY.z0 + 0.1)
  for (const x of [LOBBY.x0, LOBBY.x1]) {
    const z1 = frontAt(outline, x)
    k.box(parent, 0.25, stepH, z1 - LOBBY.z0, c.backing, x, stepY, (LOBBY.z0 + z1) / 2)
  }

  // Atrium skylight: a glazed pyramid on an upstand, over the lit atrium well.
  const apex = new Vector3(ENTRY_X, ROOF + 2.6, -9)
  const kerb = ROOF + 0.45
  const corners = ATRIUM.map(([x, z]) => new Vector3(x, kerb, z))
  const glass = new Tris()
  for (let i = 0; i < 4; i++) {
    const a = corners[i]
    const b = corners[(i + 1) % 4]
    glass.tri(b, a, apex, [0, 0], [1, 0], [0.5, 1])
    strut(parent, a, apex, 0.06, c.mullion)
    // Glazing bars at 1.4 m up each face.
    for (let t = 0.2; t < 0.99; t += 0.2) strut(parent, a.clone().lerp(b, t), apex, 0.025, c.mullion)
    const mid = a.clone().lerp(b, 0.5)
    const len = a.distanceTo(b)
    const up = k.box(parent, len, 0.45, 0.25, c.backing, mid.x, ROOF + 0.225, mid.z)
    up.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x)
  }
  glass.mesh(c.tintGlass, parent, 'atrium_skylight', false)
  // The well beneath: lit shop walls down to the second floor's atrium floor.
  sheet(parent, ATRIUM, L1 + 4.8, c.floor)
  for (let i = 0; i < 4; i++) {
    const [ax, az] = ATRIUM[i]
    const [bx, bz] = ATRIUM[(i + 1) % 4]
    const w = k.box(parent, Math.hypot(bx - ax, bz - az), ROOF - 0.35 - (L1 + 4.8), 0.1, c.shops, (ax + bx) / 2, (ROOF - 0.35 + L1 + 4.8) / 2, (az + bz) / 2, false)
    w.rotation.y = -Math.atan2(bz - az, bx - ax)
  }

  buildRooftopPlant(ctx, parent)
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
  // Stair headrooms and lift machine rooms over the cores, in the taller south half.
  room(-13.2, -19.5, 4.2, 6.2, 2.6)
  room(-13.2, 4.5, 4.2, 6.2, 2.6)
  room(-8.4, -19.8, 3.2, 3.0, 2.8)

  // Air-cooled chillers: a casing with a row of fan discs on top.
  for (const [x, z] of [[4, -21.5], [4, -17.5], [11, -21.5]] as const) {
    ctx.shade.rect(x, ROOF + 0.005, z, 6.6, 2.9, 0, 0.6)
    k.box(parent, 6, 1.2, 2.3, c.plant, x, ROOF + 0.3 + 0.6, z)
    k.box(parent, 6.2, 0.3, 2.5, c.plantDark, x, ROOF + 0.15, z)
    for (let i = 0; i < 3; i++) {
      k.cyl(parent, 0.82, 0.82, 0.16, c.plantDark, x - 2 + i * 2, ROOF + 1.58, z, 28)
      k.cyl(parent, 0.68, 0.68, 0.02, c.frame, x - 2 + i * 2, ROOF + 1.67, z, 28)
    }
  }
  // Air handling units along the north block, with duct risers into the roof.
  for (const z of [-8, -1.5, 5]) {
    k.box(parent, 2.2, 1.2, 4.2, c.plant, 9.4, ROOF + 0.6, z)
    k.box(parent, 0.9, 0.8, 0.9, c.soffit, 7.6, ROOF + 0.4, z + 1.2)
  }
  // Water tanks on plinths.
  for (const z of [-11.5, -8.3]) {
    k.box(parent, 2.9, 0.3, 2.9, c.concrete, -14, ROOF + 0.15, z)
    k.cyl(parent, 1.3, 1.3, 1.9, c.surface('white', 1, 1), -14, ROOF + 1.25, z, 32)
  }
  // Cable tray and service walkway between the plant.
  k.box(parent, 0.6, 0.06, 26, c.frame, 8.8, ROOF + 0.25, -8)
  k.box(parent, 18, 0.06, 0.8, c.frame, 0, ROOF + 0.25, -24.2)
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
}
const TRACK = 0.13
const SPACE = 0.38

export const MALL_NAME = 'PRIME MALL'

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
  // The name across the south block's crown, as in the reference, standing off the facets.
  const cap = 0.95
  const y = 13.75
  const letters = channelLetters(c, MALL_NAME, cap, 0.16)
  letters.position.set(-10.5, y, FRONT_Z + lean(y + cap / 2) + 0.42)
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

/** Loading bay shutters and service doors on the rear wall. */
function buildService(ctx: MallCtx, parent: Object3D) {
  const { c, k } = ctx
  const z = REAR_Z - SHOPFRONT
  for (const x of [-12.5, -7]) {
    k.box(parent, 4.0, 4.2, 0.08, c.shutter, x, 0.1 + 2.1, z - 0.05)
    k.box(parent, 4.3, 0.45, 0.5, c.mullion, x, 4.45, z - 0.25)
    for (const dx of [-2.08, 2.08]) k.box(parent, 0.14, 4.2, 0.14, c.hazard, x + dx, 2.2, z - 0.08)
    // Dock bumpers.
    for (const dx of [-1.4, 1.4]) k.box(parent, 0.25, 0.4, 0.12, c.plantDark, x + dx, 1.0, z - 0.1)
  }
  for (const x of [-2.5, 8.5]) {
    k.box(parent, 1.2, 2.2, 0.06, c.surface('greige', 1, 1), x, 1.2, z - 0.04)
    k.box(parent, 1.36, 0.08, 0.1, c.mullion, x, 2.34, z - 0.05)
    k.box(parent, 0.5, 0.25, 0.06, c.lamp, x, 2.7, z - 0.05, false)
  }
}

export function buildBuilding(ctx: MallCtx, parent: Object3D) {
  buildPodium(ctx, parent)
  buildShopfronts(ctx, parent)
  buildInterior(ctx, parent)
  buildEntrance(ctx, parent)
  buildRoof(ctx, parent)
  buildSignage(ctx, parent)
  buildMediaScreen(ctx, parent)
  buildService(ctx, parent)
}
