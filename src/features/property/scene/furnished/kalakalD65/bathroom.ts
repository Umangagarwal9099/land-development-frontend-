import { CatmullRomCurve3, DoubleSide, ExtrudeGeometry, FrontSide, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, PointLight, Shape, TubeGeometry, Vector2, Vector3, type Material, type MeshStandardMaterialParameters } from 'three'
import { PI } from '../kit'
import { BATHROOM, GFL, type Ctx } from './house'
import { cabinet, type Bay } from './cabinets'
import { circuit, switchPlate, type Circuit } from './fixtures'
import { herbPot } from './pieces'
import { wallHungToilet } from './toilet'
import { mirrorReflection } from './paints'
import { bottle, foldedTowels, hungTowel, rolledTowel, soapDish, toiletRoll, toothbrushes } from './toiletries'

/*
 * Ground-floor bathroom, from the client's reference (dimensioned render): 2.50 m across the back
 * wall, as 80 cm vanity, 80 cm toilet zone and 90 cm shower, with a 2.30 m ceiling. A floating oak
 * vanity with a fluted drawer, stone top and vessel basin under a fluted oak panel, backlit pill
 * mirror and opal pendant; a wall-hung toilet on a tiled box with a lit 70 cm niche (sill at
 * 1.00 m) and a two-door cabinet above; and a walk-in shower behind a black-framed glass panel,
 * herringbone back wall, rain head, mixer and handheld, and a lit niche (at 2.20 m to the head).
 *
 * Bathroom frame: X along the back wall from the left (0 … 2.50), Z out from it to the door wall
 * (0 … 1.90), h above the floor. It sits between the bedroom and the hall, behind the kitchen.
 */

const { w: W, d: D } = BATHROOM
const H = 2.3
const T = 0.012
/** The toilet box and the shower, along the back wall. */
const BOX: [number, number] = [0.8, 1.6]
const SH: [number, number] = [1.6, W]
const GLASS_Z = 1.25
const DOOR: [number, number] = [0.15, 0.9]

type R = [number, number]
const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

function materials(ctx: Ctx) {
  const { lighting, c, k } = ctx
  const glow = (color: string, intensity: number) => lighting.glow(std({ color: '#fff3df', emissive: color, emissiveIntensity: intensity, roughness: 0.5 }), 1)
  return {
    wall: (w: number, h: number) => c.surface('bathWall', w, h),
    herring: (w: number, h: number) => c.surface('herringbone', w, h),
    floor: (w: number, d: number) => {
      const m = c.surface('porcelain', w, d)
      m.color.set('#e9ddcc')
      return m
    },
    oak: (w: number, h: number) => c.surface('oak', w, h),
    stone: std({ color: '#e8e3db', roughness: 0.35 }),
    laminate: std({ color: '#d4c8b8', roughness: 0.55 }),
    interior: std({ color: '#ece8e1', roughness: 0.7 }),
    drawer: std({ color: '#cfccc6', roughness: 0.55 }),
    black: std({ color: '#18181a', roughness: 0.42, metalness: 0.55 }),
    ceramic: new MeshPhysicalMaterial({ color: '#f4f2ee', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }),
    // Glass mirror with a painted, defocused reflection of the room; a touch of self-light keeps it
    // reading as a bright surface in a dim room, as a real mirror does.
    mirror: (() => {
      const map = k.tex.painted(256, 512, mirrorReflection)
      return new MeshStandardMaterial({ map, emissiveMap: map, emissive: '#ffffff', emissiveIntensity: 0.22, roughness: 0.06, metalness: 0.15 })
    })(),
    glass: new MeshPhysicalMaterial({ color: '#eef4f2', roughness: 0.02, transparent: true, opacity: 0.14, depthWrite: false, side: DoubleSide }),
    steel: std({ color: '#8c8f93', roughness: 0.35, metalness: 0.85 }),
    opal: lighting.glow(std({ color: '#fbf6ee', emissive: '#ffe2b8', emissiveIntensity: 1.6, roughness: 0.3 }), 0.3),
    bulb: glow('#ffd8a0', 2.6),
    led: glow('#ffc98a', 2.4),
    halo: glow('#ffd29a', 2.8),
    locator: glow('#ff9a3a', 1.4),
    plate: std({ color: '#d9d3c9', roughness: 0.45 }),
    rocker: std({ color: '#efebe4', roughness: 0.35 }),
    dark: std({ color: '#2a2622', roughness: 0.8 }),
    mat: std({ color: '#e7e1d6', roughness: 1 }),
    ceiling: new MeshStandardMaterial({ color: '#f4f1ec', roughness: 0.95, side: FrontSide, shadowSide: DoubleSide, emissive: '#c9c0b2', emissiveIntensity: 0.4 }),
    k,
  }
}
type BM = ReturnType<typeof materials>
type Circuits = { ceiling: Circuit; vanity: Circuit; pendant: Circuit }
type BC = { ctx: Ctx; m: BM; g: Group; c: Circuits; bx: (x: R, h: R, z: R, mat: Material, cast?: boolean, p?: Group) => Mesh }

export function buildBathroom(ctx: Ctx) {
  const { k } = ctx
  const g = new Group()
  g.name = 'bathroom_g'
  g.position.set(BATHROOM.x0, GFL, BATHROOM.z0)
  k.root.add(g)
  const m = materials(ctx)
  const bx = ([x0, x1]: R, [h0, h1]: R, [z0, z1]: R, mat: Material, cast = true, p: Group = g) =>
    k.box(p, x1 - x0, h1 - h0, z1 - z0, mat, (x0 + x1) / 2, (h0 + h1) / 2, (z0 + z1) / 2, cast)
  const c: Circuits = { ceiling: circuit(), vanity: circuit(), pendant: circuit() }
  c.ceiling.glows.push(m.bulb)
  c.vanity.glows.push(m.led, m.halo)
  c.pendant.glows.push(m.opal)
  const B: BC = { ctx, m, g, c, bx }
  shell(B)
  vanity(B)
  toiletZone(B)
  shower(B)
  essentials(B)
  lights(B)
}

/** Tiled floor and walls, the partitions with the door and the shower niche, ceiling and switches. */
function shell(B: BC) {
  const { bx, m, g, ctx, c } = B
  const { k } = ctx
  bx([0, W], [0, T], [0, D], m.floor(W, D), false)
  // Wall tiling: back (the shower's part is herringbone), left, right (round its niche), front.
  bx([0, SH[0]], [0, H], [0, T], m.wall(SH[0], H), false)
  bx([SH[0], W - T], [0, H], [0, T * 2], m.herring(SH[1] - SH[0], H), false)
  bx([0, T], [0, H], [T, D], m.wall(D, H), false)
  const N = { z0: 0.45, z1: 0.75, h0: 1.05, h1: 1.35 }
  for (const [z, h] of [[[T, N.z0], [0, H]], [[N.z1, D], [0, H]], [[N.z0, N.z1], [0, N.h0]], [[N.z0, N.z1], [N.h1, H]]] as [R, R][]) bx([W - T, W], h, z, m.wall(z[1] - z[0], h[1] - h[0]), false)
  // Right partition to the hall (with the shower niche let into it) and the front wall with the door.
  for (const [z, h] of [[[0, N.z0], [0, 3.11]], [[N.z1, D + 0.115], [0, 3.11]], [[N.z0, N.z1], [0, N.h0]], [[N.z0, N.z1], [N.h1, 3.11]]] as [R, R][]) bx([W, W + 0.115], h, z, m.wall(0.1, 1))
  bx([W + 0.1, W + 0.115], [N.h0, N.h1], [N.z0, N.z1], m.wall(0.3, 0.3))
  bx([W, W + 0.1], [N.h0 - 0.012, N.h0], [N.z0, N.z1], m.stone)
  bx([W + 0.006, W + 0.03], [N.h1 - 0.008, N.h1 - 0.002], [N.z0 + 0.02, N.z1 - 0.02], m.led, false)
  bx([0, DOOR[0]], [0, 3.11], [D, D + 0.115], m.wall(0.2, 3))
  bx(DOOR, [2.1, 3.11], [D, D + 0.115], m.wall(0.8, 1))
  bx([DOOR[1], W + 0.115], [0, 3.11], [D, D + 0.115], m.wall(1.7, 3))
  bx([DOOR[1], W - T], [0, H], [D - T, D], m.wall(W - DOOR[1], H), false)
  bx([T, DOOR[0]], [0, H], [D - T, D], m.wall(0.2, H), false)

  // Flush oak door on concealed hinges, opening into the room; lever handles on both faces.
  const door = new Group()
  door.name = 'door_bath_entry'
  door.position.set(DOOR[0] + 0.004, 0, D + 0.04)
  door.userData.openAngle = 1.5
  g.add(door)
  const dw = DOOR[1] - DOOR[0] - 0.008
  bx([0, dw], [0.006, 2.094], [-0.04, 0], m.oak(dw, 2.1), true, door).userData.front = true
  for (const z of [-0.048, 0.008]) {
    k.cyl(door, 0.024, 0.024, 0.01, m.black, dw - 0.07, 1.0, z, 20).rotation.x = PI / 2
    bx([dw - 0.2, dw - 0.07], [0.992, 1.008], [z - 0.008, z + 0.008], m.black, true, door)
  }

  // False ceiling with two recessed downlights.
  const ceiling = new Mesh(new PlaneGeometry(W, D), m.ceiling)
  ceiling.rotation.x = PI / 2
  ceiling.position.set(W / 2, H, D / 2)
  g.add(ceiling)
  for (const [x, z] of [[0.9, 0.95], [2.05, 0.7]]) k.cyl(g, 0.045, 0.045, 0.01, m.bulb, x, H - 0.004, z, 16).castShadow = false

  // Switchboard inside the door on the latch side at 1.2 m: ceiling lights, mirror and LEDs, pendant.
  const plate = switchPlate(k, g, 'bath', ['switch', 'switch', 'switch'], { plate: m.plate, rocker: m.rocker, dark: m.dark, locator: m.locator }, [c.ceiling, c.vanity, c.pendant])
  plate.position.set(1.08, 1.2, D - T - 0.0005)
  plate.rotation.y = PI
}

/** Shape of a pill (stadium) mirror, `w` wide and `h` tall, centred on its middle. */
function pill(w: number, h: number) {
  const r = w / 2
  const s = new Shape()
  s.moveTo(-r, -h / 2 + r)
  s.lineTo(-r, h / 2 - r)
  s.absarc(0, h / 2 - r, r, PI, 0, true)
  s.lineTo(r, -h / 2 + r)
  s.absarc(0, -h / 2 + r, r, 0, PI, true)
  return s
}

/** The floating oak vanity, its fluted wall panel, the basin and mixer, the mirror and pendant. */
function vanity(B: BC) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const X: R = [T, BOX[0]]
  const VD = 0.5
  // Fluted oak panel from the counter to the ceiling.
  bx(X, [0.84, H], [T, T + 0.012], m.dark)
  const batten = m.oak(0.03, H)
  for (let x = X[0] + 0.022; x < X[1] - 0.01; x += 0.044) bx([x - 0.014, x + 0.014], [0.84, H], [T + 0.012, T + 0.032], batten)

  // Carcass: oak sides, back and base shelf; stone top; the open towel shelf under the drawer.
  const oak = m.oak(0.8, 0.5)
  bx([X[0], X[0] + 0.018], [0.38, 0.82], [T, VD], oak)
  bx([X[1] - 0.018, X[1]], [0.38, 0.82], [T, VD], oak)
  bx(X, [0.38, 0.4], [T, VD], oak)
  bx(X, [0.38, 0.82], [T, T + 0.018], oak)
  bx(X, [0.6, 0.618], [T + 0.018, VD], oak)
  bx([X[0] - 0.004, X[1]], [0.82, 0.85], [T, VD + 0.01], m.stone)
  bx([X[0] + 0.03, X[1] - 0.03], [0.372, 0.378], [VD - 0.06, VD - 0.04], m.led, false)
  for (let i = 0; i < 3; i++) {
    const t = new Group()
    t.position.set(0.17 + i * 0.13 + (i === 2 ? -0.065 : 0), 0.4 + (i === 2 ? 0.1 : 0), 0.26)
    t.rotation.y = PI / 2
    g.add(t)
    rolledTowel(k, t, 0, 0, 0, 0.32, i === 1)
  }

  // The drawer: fluted oak front, grey box, toiletries inside; it runs out on its slides.
  const drawer = new Group()
  drawer.name = 'drawer_bath_vanity'
  drawer.userData.slide = [0, 0, 0.32]
  g.add(drawer)
  const d = (x: R, h: R, z: R, mat: Material) => bx(x, h, z, mat, true, drawer)
  d([X[0] + 0.02, X[1] - 0.02], [0.62, 0.816], [VD - 0.012, VD], m.dark).userData.front = true
  for (let x = X[0] + 0.03; x < X[1] - 0.025; x += 0.03) d([x - 0.011, x + 0.011], [0.622, 0.814], [VD, VD + 0.014], m.oak(0.02, 0.2))
  const box: R = [0.04, VD - 0.012]
  d([X[0] + 0.03, X[0] + 0.042], [0.63, 0.78], box, m.drawer)
  d([X[1] - 0.042, X[1] - 0.03], [0.63, 0.78], box, m.drawer)
  d([X[0] + 0.03, X[1] - 0.03], [0.63, 0.78], [box[0], box[0] + 0.012], m.drawer)
  d([X[0] + 0.042, X[1] - 0.042], [0.63, 0.642], box, m.drawer)
  fillVanityDrawer(B, drawer, { x0: X[0] + 0.05, x1: X[1] - 0.05, z0: box[0] + 0.02, z1: box[1] - 0.02, floors: [0.642], clear: [0.13] })

  // Vessel basin and the wall-mounted black mixer: spout and separate lever.
  const basin = new Mesh(
    new LatheGeometry([[0, 0], [0.09, 0], [0.12, 0.012], [0.185, 0.06], [0.205, 0.125], [0.205, 0.13], [0.196, 0.13], [0.195, 0.125], [0.176, 0.065], [0.11, 0.022], [0.025, 0.016], [0, 0.016]].map(([r, y]) => new Vector2(r, y)), 48),
    m.ceramic,
  )
  basin.position.set(0.4, 0.85, 0.27)
  basin.castShadow = basin.receiveShadow = true
  g.add(basin)
  k.cyl(g, 0.018, 0.018, 0.004, m.steel, 0.4, 0.868, 0.27, 16)
  for (const [x, len] of [[0.4, 0.17], [0.56, 0.05]] as const) {
    k.cyl(g, 0.028, 0.028, 0.01, m.black, x, 1.04, T + 0.037, 20).rotation.x = PI / 2
    k.cyl(g, 0.011, 0.011, len, m.black, x, 1.04, T + 0.04 + len / 2, 14).rotation.x = PI / 2
  }
  k.box(g, 0.008, 0.07, 0.012, m.black, 0.56, 1.075, T + 0.09)

  // Pill mirror on a black edge, with a warm LED halo washing the oak behind it.
  const mirror = (scale: number, mat: Material, z: number) => {
    const geo = new ExtrudeGeometry(pill(0.42 * scale, 0.95 + 0.42 * (scale - 1)), { depth: 0.006, bevelEnabled: false, curveSegments: 32 })
    // Shape UVs come out in metres about the centre; map them onto the whole reflection image.
    const uv = geo.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.46 + 0.5, uv.getY(i) / 1.0 + 0.5)
    const mesh = new Mesh(geo, mat)
    mesh.position.set(0.4, 1.6, z)
    g.add(mesh)
  }
  mirror(1.1, m.halo, T + 0.028)
  mirror(1.02, m.black, T + 0.038)
  mirror(1, m.mirror, T + 0.042)

  // Opal-glass pendant on a black cord, hanging by the mirror.
  k.cyl(g, 0.003, 0.003, H - 1.66, m.black, 0.13, (H + 1.66) / 2, 0.32, 6)
  k.cyl(g, 0.026, 0.03, 0.06, m.black, 0.13, 1.63, 0.32, 18)
  k.sphere(g, 0.072, m.opal, 0.13, 1.54, 0.32)
}

/** Skincare and grooming in the vanity drawer, in a shallow tray. */
function fillVanityDrawer({ ctx, m }: BC, p: Group, b: Bay) {
  const { k } = ctx
  const y = b.floors[0]
  const cx = (b.x0 + b.x1) / 2
  k.box(p, b.x1 - b.x0 - 0.02, 0.008, b.z1 - b.z0 - 0.02, m.interior, cx, y + 0.004, (b.z0 + b.z1) / 2)
  bottle(k, p, 'lotion', b.x0 + 0.06, y + 0.008, b.z0 + 0.08)
  bottle(k, p, 'bodywash', b.x0 + 0.06, y + 0.008, b.z0 + 0.2)
  foldedTowels(k, p, cx + 0.12, y + 0.008, b.z0 + 0.12, 0.26, 0.18, 2)
  toothbrushes(k, p, cx - 0.06, y + 0.008, b.z1 - 0.1)
  // A comb and a round jar of cotton pads.
  k.box(p, 0.16, 0.005, 0.025, m.black, cx + 0.1, y + 0.011, b.z1 - 0.06)
  k.cyl(p, 0.035, 0.035, 0.06, m.glass, cx + 0.16, y + 0.038, b.z1 - 0.14, 20)
  k.cyl(p, 0.03, 0.03, 0.05, m.mat, cx + 0.16, y + 0.034, b.z1 - 0.14, 20)
}

/** Tiled cistern box: wall-hung toilet, flush plate, the lit niche and the two-door cabinet above. */
function toiletZone(B: BC) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const F = 0.23
  const NI: R = [1.0, 1.33]
  bx(BOX, [0, NI[0]], [T, F], m.wall(0.8, 1))
  for (const x of [[BOX[0], BOX[0] + 0.05], [BOX[1] - 0.05, BOX[1]]] as R[]) bx(x, NI, [T, F], m.wall(0.05, 0.33))
  // The niche: oak-lined, lit from its head, with a bottle, a small plant and a dish.
  bx([BOX[0] + 0.05, BOX[1] - 0.05], NI, [T, 0.05], m.oak(0.7, 0.33))
  bx([BOX[0] + 0.05, BOX[1] - 0.05], [NI[0], NI[0] + 0.012], [0.05, F], m.oak(0.7, 0.2))
  bx([BOX[0] + 0.06, BOX[1] - 0.06], [NI[1] - 0.008, NI[1] - 0.002], [F - 0.04, F - 0.02], m.led, false)
  bottle(k, g, 'handwash', 0.97, NI[0] + 0.012, 0.13)
  herbPot({ k, c: ctx.c }, g, 1.38, NI[0] + 0.012, 0.13, 0.8, m.ceramic)
  k.cyl(g, 0.045, 0.03, 0.03, m.ceramic, 1.18, NI[0] + 0.027, 0.13, 20)

  // Cabinet over the niche: two doors on concealed hinges, shelves of spare towels and rolls.
  for (const [i, hinge] of (['left', 'right'] as const).entries()) {
    const f = new Group()
    f.position.set(BOX[0] + i * 0.4, NI[1], F + 0.012)
    g.add(f)
    cabinet(k, f, 0.4, H - NI[1], F, { kind: 'door', id: `bath_cabinet_${i + 1}`, hinge, shelves: [0.3, 0.62], fill: (p, b) => {
      if (i === 0) {
        for (let j = 0; j < 3; j++) toiletRoll(k, p, b.x0 + 0.07 + j * 0.12, b.floors[0], (b.z0 + b.z1) / 2)
        foldedTowels(k, p, (b.x0 + b.x1) / 2, b.floors[1], (b.z0 + b.z1) / 2, 0.3, 0.16, 4)
        bottle(k, p, 'shampoo', b.x0 + 0.06, b.floors[2], (b.z0 + b.z1) / 2)
        bottle(k, p, 'conditioner', b.x0 + 0.15, b.floors[2], (b.z0 + b.z1) / 2)
      } else {
        foldedTowels(k, p, (b.x0 + b.x1) / 2, b.floors[0], (b.z0 + b.z1) / 2, 0.3, 0.16, 5, true)
        for (let j = 0; j < 2; j++) toiletRoll(k, p, b.x0 + 0.08 + j * 0.12, b.floors[1], (b.z0 + b.z1) / 2)
        bottle(k, p, 'lotion', b.x1 - 0.08, b.floors[1], (b.z0 + b.z1) / 2)
        bottle(k, p, 'bodywash', b.x0 + 0.08, b.floors[2], (b.z0 + b.z1) / 2)
      }
    } }, { front: m.laminate, interior: m.interior, drawer: m.drawer })
  }

  // Matt black dual flush plate.
  bx([1.09, 1.31], [0.83, 0.98], [F, F + 0.006], m.black)
  bx([1.096, 1.198], [0.836, 0.974], [F + 0.006, F + 0.008], m.dark)
  bx([1.202, 1.304], [0.836, 0.974], [F + 0.006, F + 0.008], m.dark)

  // Wall-hung toilet: the china bowl off the box face, with its seat and soft-close lid on hinges.
  wallHungToilet(k, g, (BOX[0] + BOX[1]) / 2, F)

  // Toilet-roll holder on the box, and a brush in its holder on the floor.
  bx([1.47, 1.49], [0.66, 0.7], [F, F + 0.03], m.black)
  const arm = k.cyl(g, 0.006, 0.006, 0.14, m.black, 1.54, 0.68, F + 0.07, 10)
  arm.rotation.z = PI / 2
  toiletRoll(k, g, 1.59, 0.68, F + 0.07, true)
  k.cyl(g, 0.05, 0.046, 0.32, m.black, 1.5, 0.172, 0.33, 24)
  k.cyl(g, 0.007, 0.007, 0.2, m.black, 1.5, 0.42, 0.33, 10)
}

/** Shower: glass panel in a black frame, drain, rain head, mixer, handheld on its hose, niche and shelf. */
function shower(B: BC) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const x = SH[0]
  bx([x - 0.004, x + 0.004], [T, 2.0], [0.04, GLASS_Z], m.glass, false)
  bx([x - 0.009, x + 0.009], [0, 2.0], [T, 0.04], m.black)
  bx([x - 0.009, x + 0.009], [0, 2.0], [GLASS_Z - 0.012, GLASS_Z + 0.004], m.black)
  bx([x - 0.009, x + 0.009], [1.99, 2.01], [T, GLASS_Z + 0.004], m.black)
  // Linear drain in brushed steel along the back.
  bx([SH[0] + 0.12, SH[1] - 0.12], [T, T + 0.003], [0.06, 0.12], m.steel)
  for (let i = 0; i < 40; i++) bx([SH[0] + 0.14 + i * 0.0155, SH[0] + 0.147 + i * 0.0155], [T + 0.003, T + 0.0035], [0.07, 0.11], m.dark, false)

  // Rain head on a wall arm, at 2.20 m.
  const hx = (SH[0] + SH[1]) / 2
  const arm = k.cyl(g, 0.011, 0.011, 0.36, m.black, hx, 2.2, 0.2, 14)
  arm.rotation.x = PI / 2
  k.cyl(g, 0.028, 0.028, 0.01, m.black, hx, 2.2, 0.03, 20).rotation.x = PI / 2
  k.cyl(g, 0.011, 0.011, 0.06, m.black, hx, 2.17, 0.38, 12)
  k.cyl(g, 0.13, 0.125, 0.012, m.black, hx, 2.135, 0.38, 48)

  // Mixer, diverter outlet and the handheld on its holder, joined by a looping black hose.
  k.cyl(g, 0.065, 0.065, 0.008, m.black, hx - 0.05, 1.12, 0.03, 32).rotation.x = PI / 2
  const lever = k.cyl(g, 0.014, 0.014, 0.08, m.black, hx - 0.05, 1.12, 0.07, 14)
  lever.rotation.x = PI / 2
  k.box(g, 0.012, 0.06, 0.014, m.black, hx - 0.05, 1.15, 0.11)
  k.cyl(g, 0.02, 0.02, 0.04, m.black, hx + 0.1, 0.95, 0.045, 14).rotation.x = PI / 2
  k.box(g, 0.03, 0.05, 0.05, m.black, hx + 0.22, 1.2, 0.045)
  const hand = new Group()
  hand.position.set(hx + 0.22, 1.12, 0.08)
  hand.rotation.x = -0.2
  g.add(hand)
  k.cyl(hand, 0.013, 0.011, 0.17, m.black, 0, 0, 0, 14)
  k.cyl(hand, 0.034, 0.03, 0.045, m.black, 0, 0.1, 0.01, 20)
  const hose = new CatmullRomCurve3([
    new Vector3(hx + 0.1, 0.95, 0.065),
    new Vector3(hx + 0.12, 0.6, 0.09),
    new Vector3(hx + 0.18, 0.45, 0.11),
    new Vector3(hx + 0.24, 0.62, 0.1),
    new Vector3(hx + 0.22, 0.95, 0.085),
    new Vector3(hx + 0.22, 1.035, 0.085),
  ])
  const hoseMesh = new Mesh(new TubeGeometry(hose, 64, 0.007, 8, false), m.black)
  hoseMesh.castShadow = true
  g.add(hoseMesh)

  // In the niche: shampoo, conditioner and body wash. On a black wire shelf: soap.
  bottle(k, g, 'shampoo', W + 0.05, 1.05, 0.52, -PI / 2)
  bottle(k, g, 'conditioner', W + 0.05, 1.05, 0.6, -PI / 2)
  bottle(k, g, 'bodywash', W + 0.05, 1.05, 0.68, -PI / 2)
  bx([SH[1] - 0.32, SH[1] - 0.06], [0.9, 0.906], [0.03, 0.15], m.black)
  bx([SH[1] - 0.32, SH[1] - 0.06], [0.906, 0.93], [0.145, 0.15], m.black)
  soapDish(k, g, SH[1] - 0.24, 0.906, 0.09)
}

/** Towel bar and bath towel, hand towel ring, bath mat and a waste bin. */
function essentials(B: BC) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  // Bath towel on a black bar on the right wall, outside the shower.
  const rail = new Group()
  rail.position.set(W - T - 0.05, 1.25, (GLASS_Z + D) / 2)
  rail.rotation.y = PI / 2
  g.add(rail)
  k.cyl(rail, 0.009, 0.009, 0.5, m.black, 0, 0, 0, 12).rotation.z = PI / 2
  for (const s of [-1, 1]) bx([s * 0.25 - 0.012, s * 0.25 + 0.012], [-0.012, 0.012], [-0.05, 0.012], m.black, true, rail)
  hungTowel(k, rail, 0, 0, 0, 0.46, 0.55)
  // Hand towel on a ring on the left wall, beside the vanity.
  const ring = new Mesh(new LatheGeometry([new Vector2(0.075, -0.004), new Vector2(0.08, 0), new Vector2(0.075, 0.004)], 32), m.black)
  ring.rotation.z = PI / 2
  ring.position.set(T + 0.06, 1.12, 0.62)
  g.add(ring)
  bx([T, T + 0.06], [1.19, 1.21], [0.61, 0.63], m.black)
  const handTowel = new Group()
  handTowel.position.set(T + 0.06, 1.05, 0.62)
  handTowel.rotation.y = PI / 2
  g.add(handTowel)
  hungTowel(k, handTowel, 0, 0, 0, 0.22, 0.3, true)
  // Cotton bath mat in front of the shower, and a pedal bin under the vanity.
  k.soft(g, 0.7, 0.012, 0.45, 0.005, m.mat, (SH[0] + SH[1]) / 2, T + 0.006, (GLASS_Z + D) / 2 + 0.05)
  k.cyl(g, 0.1, 0.095, 0.27, m.black, 0.16, T + 0.135, 0.3, 28)
  k.cyl(g, 0.101, 0.101, 0.012, m.steel, 0.16, T + 0.276, 0.3, 28)
}

/** Lights on the three circuits: ceiling downlights, mirror and LED strips, pendant. */
function lights({ g, ctx, c }: BC) {
  const add = (x: number, h: number, z: number, intensity: number, distance: number, on: Circuit, color = '#ffdcb0') => {
    const l = new PointLight(color, intensity, distance, 2)
    l.position.set(x, h, z)
    g.add(l)
    ctx.lighting.light(l, 1)
    on.lights.push(l)
  }
  add(0.9, 2.2, 0.95, 3.2, 4, c.ceiling, '#fff1de')
  add(2.05, 2.2, 0.7, 3.2, 4, c.ceiling, '#fff1de')
  add(0.4, 1.6, 0.25, 1.2, 1.8, c.vanity)
  add(0.4, 0.25, 0.45, 0.7, 1.2, c.vanity)
  add(1.2, 1.25, 0.35, 0.6, 1.1, c.vanity)
  add(0.13, 1.45, 0.34, 0.9, 1.8, c.pendant)
}
