import { CylinderGeometry, DoubleSide, FrontSide, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, PointLight, Vector2, type Material, type MeshStandardMaterialParameters, type Object3D } from 'three'
import type { Paint } from '../textures'
import { PI } from '../kit'
import { BEDROOM2, FFL, type Ctx } from './house'
import { cabinet, type Unit } from './cabinets'
import { drape, pillow } from './cloth'
import { stationery } from './desk'
import { circuit, switchPlate, type Circuit } from './fixtures'
import { cloth, folded, hangGarment } from './garments'
import { knit, lightOak, oakFloor, upholstery } from './paints'
import { pottedPothos } from './plant'

/*
 * Bedroom 2, the rear first-floor room on the stair side, whose door faces the top of the stair.
 * From the client's top-down board: a storage bed on the wall opposite the door between two oak
 * bedside tables, a sliding wardrobe on one side, a curtained window on the other, and an L-shaped
 * corner study desk with a swivel chair beside the door, in pale oak, cream and warm taupe.
 *
 * The board's 10′ × 10′ gives the design; the plan's 3.50 × 3.60 m gives the room, the extra going to
 * the walkways. Mirrored as the plans are, so the window falls on the house's outer wall.
 *
 * Room frame (the board's, seen with the door at the bottom): X from the window wall (0) to the
 * wardrobe side, Z from the bed wall (0) to the door wall, h above the floor.
 */

const { w: W, d: D, door: DOOR } = BEDROOM2
const H = 2.62
const WIN = BEDROOM2.window
const BED = { x0: 0.86, x1: 2.36, z0: 0.12, z1: 2.02, top: 0.36 }
const WR = { x0: W - 0.6, z1: 2.45 }
const TABLE = 0.74
type R = [number, number]

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/** A soft-edged blot for contact shadows. */
const blot: Paint = (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  gr.addColorStop(0, 'rgba(255,255,255,0.85)')
  gr.addColorStop(0.6, 'rgba(255,255,255,0.4)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
}

/** A paint with its colours lifted towards the board's pale natural oak. */
const pale = (paint: Paint): Paint => (g, w, h) => {
  paint(g, w, h)
  g.save()
  g.globalCompositeOperation = 'screen'
  g.fillStyle = 'rgb(58,62,62)'
  g.fillRect(0, 0, w, h)
  g.restore()
}

function materials(ctx: Ctx) {
  const { k, lighting, c } = ctx
  const glow = (color: string, intensity: number) => lighting.glow(std({ color: '#fff3df', emissive: color, emissiveIntensity: intensity, roughness: 0.5 }), 1)
  const fabric = (tone: number[], seed: number, repeat: number, sheen = 0.45, double = false) => {
    const paint = upholstery(tone, seed)
    const map = k.tex.painted(256, 256, paint)
    map.repeat.set(repeat, repeat)
    return new MeshPhysicalMaterial({ map, normalMap: k.tex.normalPainted(`bed2_fabric_${seed}`, 256, 256, paint, repeat, repeat), normalScale: new Vector2(0.3, 0.3), roughness: 0.95, sheen, sheenRoughness: 0.6, sheenColor: '#f3ece2', side: double ? DoubleSide : FrontSide })
  }
  const garment = (tone: string, kind: 'plain' | 'stripe' | 'twill' | 'herringbone', seed: number) => std({ map: k.tex.painted(128, 128, cloth(tone, kind, seed)), roughness: 0.95, side: DoubleSide })
  // The board's oak is much paler than the hall's: the same grain, lifted at its source.
  const paleOak = k.tex.painted(512, 512, pale(lightOak))
  const oak = (w: number, h: number) => {
    const map = paleOak.clone()
    map.repeat.set(w / 0.6, h / 0.6)
    map.needsUpdate = true
    return std({ map, roughness: 0.48 })
  }
  const floorMap = k.tex.painted(512, 512, pale(oakFloor))
  floorMap.repeat.set(W / 2.4, D / 2.4)
  const floor = std({ map: floorMap, roughness: 0.42 })
  const rug = c.surface('woolRug', 2.3, 1.85)
  rug.color.set('#efe6d8')
  const throwMap = k.tex.painted(256, 256, pale(pale(knit)))
  return {
    oak, floor, rug,
    oakPlain: oak(0.6, 0.6),
    paint: std({ color: '#efe6d6', roughness: 0.92 }),
    white: std({ color: '#f4efe6', roughness: 0.55 }),
    lacquer: std({ color: '#ece4d6', roughness: 0.45 }),
    interior: std({ color: '#e8dfd0', roughness: 0.7 }),
    skirting: std({ color: '#e6dccb', roughness: 0.6 }),
    dark: std({ color: '#2a2622', roughness: 0.8 }),
    black: std({ color: '#17171a', roughness: 0.42, metalness: 0.45 }),
    steel: std({ color: '#b9b6b0', roughness: 0.3, metalness: 0.85 }),
    brass: std({ color: '#b08d57', roughness: 0.32, metalness: 0.9 }),
    screen: new MeshPhysicalMaterial({ color: '#0b0c0e', roughness: 0.2, clearcoat: 0.6 }),
    smoked: new MeshPhysicalMaterial({ color: '#8d7a66', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.42, depthWrite: false, side: DoubleSide }),
    headboard: fabric([214, 202, 184], 271, 6),
    mattress: fabric([238, 235, 228], 272, 8, 0.3),
    duvet: fabric([240, 236, 228], 273, 1, 0.35, true),
    runner: fabric([206, 192, 172], 274, 1, 0.5, true),
    throwKnit: std({ map: throwMap, roughness: 1, side: DoubleSide }),
    pillowWhite: fabric([240, 237, 230], 275, 3, 0.35),
    pillowSand: fabric([208, 196, 178], 276, 3),
    pillowTaupe: fabric([176, 160, 140], 277, 3),
    chair: fabric([226, 216, 200], 278, 6),
    curtain: std({ color: '#efe7da', roughness: 0.95, side: DoubleSide }),
    shade: lighting.glow(std({ color: '#f6efe2', emissive: '#ffd9a8', emissiveIntensity: 1.1, roughness: 0.8, side: DoubleSide }), 0.3),
    ceiling: new MeshStandardMaterial({ color: '#f4f0e8', roughness: 0.95, side: FrontSide, shadowSide: DoubleSide, emissive: '#c9c0b2', emissiveIntensity: 0.42 }),
    bulb: glow('#ffd8a0', 2.6),
    cove: glow('#ffc98a', 2.2),
    deskBulb: glow('#ffe0b0', 2.4),
    locator: glow('#ff9a3a', 1.4),
    plate: std({ color: '#d4cdc1', roughness: 0.45 }),
    rocker: std({ color: '#ece8e1', roughness: 0.35 }),
    contact: new MeshBasicMaterial({ map: k.tex.painted(128, 128, blot), color: '#000000', transparent: true, depthWrite: false }),
    book: [std({ color: '#3d4a52', roughness: 0.7 }), std({ color: '#c9bba3', roughness: 0.7 }), std({ color: '#7a5a45', roughness: 0.7 }), std({ color: '#e5ddcf', roughness: 0.7 })],
    pot: std({ color: '#d9d2c6', roughness: 0.7 }),
    shirtWhite: garment('#eeebe6', 'plain', 11),
    shirtBlue: garment('#a9bccf', 'plain', 12),
    shirtStripe: garment('#e9edf2', 'stripe', 13),
    jacket: garment('#44464a', 'herringbone', 14),
    blazer: garment('#6b5a4c', 'twill', 15),
    trousers: garment('#c3b293', 'twill', 16),
    trousersGrey: garment('#7d7f82', 'twill', 17),
    dress: garment('#9b7f6b', 'plain', 18),
    hanger: std({ color: '#7a5236', roughness: 0.5 }),
    rail: std({ color: '#c7cbd0', roughness: 0.25, metalness: 0.9 }),
  }
}

type M = ReturnType<typeof materials>
type Circuits = { room: Circuit; bed: Circuit; desk: Circuit }
type C = { ctx: Ctx; m: M; g: Group; c: Circuits; bx: (x: R, h: R, z: R, mat: Material, cast?: boolean, p?: Object3D) => Mesh }

export function buildBedroom2(ctx: Ctx) {
  const { k } = ctx
  const g = new Group()
  g.name = 'bedroom_2'
  g.position.set(BEDROOM2.x1, FFL, BEDROOM2.z0)
  // Mirrored: the board's X runs from the house's right wall in towards the middle.
  g.scale.x = -1
  k.root.add(g)
  const m = materials(ctx)
  const bx = ([x0, x1]: R, [h0, h1]: R, [z0, z1]: R, mat: Material, cast = true, p: Object3D = g) =>
    k.box(p, x1 - x0, h1 - h0, z1 - z0, mat, (x0 + x1) / 2, (h0 + h1) / 2, (z0 + z1) / 2, cast)
  const c: Circuits = { room: circuit(), bed: circuit(), desk: circuit() }
  c.room.glows.push(m.bulb, m.cove)
  c.bed.glows.push(m.shade)
  c.desk.glows.push(m.deskBulb)
  const B: C = { ctx, m, g, c, bx }
  shell(B)
  bed(B)
  bedsides(B)
  wardrobe(B)
  study(B)
  window(B)
  fittings(B)
  lights(B)
}

function contact({ g, m }: C, x: number, z: number, w: number, d: number, opacity: number) {
  const mat = m.contact.clone()
  mat.opacity = opacity
  const s = new Mesh(new PlaneGeometry(w, d), mat)
  s.rotation.x = -PI / 2
  s.position.set(x, 0.02, z)
  s.renderOrder = 1
  g.add(s)
}

/** A cabinet in the room's frame, its front facing `face`, spanning a0 … a1 along the wall it stands on. */
function unit(B: C, face: 'x-' | 'x+' | 'z+' | 'z-', at: number, a0: number, a1: number, h0: number, h: number, d: number, u: Unit, front: Material) {
  const f = new Group()
  const { ctx, m, g } = B
  const w = a1 - a0
  if (face === 'x-') {
    f.position.set(at, h0, a0)
    f.rotation.y = -PI / 2
  } else if (face === 'x+') {
    f.position.set(at, h0, a1)
    f.rotation.y = PI / 2
  } else if (face === 'z+') f.position.set(a0, h0, at)
  else {
    f.position.set(a1, h0, at)
    f.rotation.y = PI
  }
  g.add(f)
  cabinet(ctx.k, f, w, h, d, u, { front, interior: m.interior, drawer: m.oakPlain })
  return f
}

/** Floor, painted walls, the door, ceiling and rug. */
function shell(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  bx([0, W], [0, 0.012], [0, D], m.floor, false)
  // Bed wall and the wall beside the wardrobe; the door wall's paint is cut for the door, the window wall's for the window.
  bx([0, W], [0, H], [-0.004, 0], m.paint, false)
  bx([W, W + 0.004], [0, H], [0, D], m.paint, false)
  bx([0, DOOR[0]], [0, H], [D, D + 0.004], m.paint, false)
  bx(DOOR, [2.1, H], [D, D + 0.004], m.paint, false)
  bx([DOOR[1], W], [0, H], [D, D + 0.004], m.paint, false)
  const lo = WIN.h[0]
  const hi = WIN.h[1]
  bx([-0.004, 0], [0, H], [0, WIN.z[0]], m.paint, false)
  bx([-0.004, 0], [0, H], [WIN.z[1], D], m.paint, false)
  bx([-0.004, 0], [0, lo], WIN.z, m.paint, false)
  bx([-0.004, 0], [hi, H], WIN.z, m.paint, false)
  // Skirting round the room, broken at the door.
  bx([0, WR.x0], [0, 0.08], [0, 0.012], m.skirting, false)
  bx([0, 0.012], [0, 0.08], [0, D - 0.6], m.skirting, false)
  bx([W - 0.012, W], [0, 0.08], [WR.z1, D], m.skirting, false)
  bx([1.6, DOOR[0] - 0.065], [0, 0.08], [D - 0.012, D], m.skirting, false)
  bx([DOOR[1] + 0.065, W], [0, 0.08], [D - 0.012, D], m.skirting, false)

  // A flush white door with a brushed lever, swinging into the room against the wardrobe side.
  const dw = DOOR[1] - DOOR[0] - 0.008
  const door = new Group()
  door.name = 'door_bed2_entry'
  door.position.set(DOOR[1] - 0.004, 0, D + 0.02)
  door.userData.openAngle = -1.5
  g.add(door)
  bx([-dw, 0], [0.006, 2.094], [0, 0.04], m.white, true, door).userData.front = true
  for (const [rz, lz] of [[-0.006, -0.016], [0.046, 0.056]] as const) {
    k.cyl(door, 0.026, 0.026, 0.012, m.steel, -dw + 0.065, 1.0, rz, 20).rotation.x = PI / 2
    bx([-dw + 0.06, -dw + 0.19], [0.992, 1.008], [lz - 0.008, lz + 0.008], m.steel, true, door)
  }
  // Painted architrave on both faces of the wall.
  for (const z of [[D - 0.014, D], [D + 0.12, D + 0.134]] as R[]) {
    bx([DOOR[0] - 0.065, DOOR[0]], [0, 2.17], z, m.skirting)
    bx([DOOR[1], DOOR[1] + 0.065], [0, 2.17], z, m.skirting)
    bx(DOOR, [2.1, 2.17], z, m.skirting)
  }

  const ceiling = new Mesh(new PlaneGeometry(W, D), m.ceiling)
  ceiling.rotation.x = PI / 2
  ceiling.position.set(W / 2, H, D / 2)
  g.add(ceiling)
  for (const [x, z] of [[1.0, 2.75], [2.3, 2.75], [0.55, 0.8], [2.62, 1.5]]) k.cyl(g, 0.045, 0.045, 0.01, m.bulb, x, H - 0.004, z, 16).castShadow = false
  // Warm cove along the bed wall.
  bx([0.4, WR.x0 - 0.1], [H - 0.12, H], [0, 0.11], m.paint, false)
  bx([0.42, WR.x0 - 0.12], [H - 0.125, H - 0.118], [0.09, 0.105], m.cove, false)
  bx([BED.x0 - 0.3, BED.x1 + 0.34], [0.012, 0.024], [1.05, 2.72], m.rug, false)
}

/** The storage bed: oak frame and padded headboard, drawers on three sides, mattress and layered bedding. */
function bed(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const cx = (BED.x0 + BED.x1) / 2
  const bw = BED.x1 - BED.x0
  const soft = (geo: ConstructorParameters<typeof Mesh>[0], mat: Material, x: number, y: number, z: number) => {
    const mesh = new Mesh(geo, mat)
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    g.add(mesh)
    return mesh
  }
  // Headboard: a padded panel in an oak surround, wider than the bed.
  bx([BED.x0 - 0.16, BED.x1 + 0.16], [0, 1.08], [0, 0.03], m.oak(1.9, 1.08))
  bx([BED.x0 - 0.16, BED.x1 + 0.16], [1.03, 1.08], [0.03, 0.09], m.oak(1.9, 0.1))
  k.soft(g, bw + 0.2, 0.56, 0.07, 0.03, m.headboard, cx, 0.74, 0.065)
  // Oak carcass rails and platform on a recessed plinth.
  bx([BED.x0 + 0.04, BED.x1 - 0.04], [0, 0.06], [BED.z0 + 0.06, BED.z1 - 0.04], m.dark, false)
  bx([BED.x0, BED.x1], [0.325, 0.36], [BED.z0, BED.z1], m.oak(bw, 2))
  bx([BED.x0, BED.x1], [0.06, 0.325], [BED.z0, BED.z0 + 0.14], m.oakPlain)
  bx([BED.x0 + 0.55, BED.x1 - 0.55], [0.06, 0.325], [BED.z0 + 0.14, BED.z1 - 0.46], m.oakPlain)
  const fills = [
    (p: Group, b: { x0: number; x1: number; z0: number; z1: number; floors: number[] }) => folded(k, p, (b.x0 + b.x1) / 2, b.floors[0], (b.z0 + b.z1) / 2, b.x1 - b.x0 - 0.06, b.z1 - b.z0 - 0.06, 0.12, m.runner as unknown as MeshStandardMaterial),
    (p: Group, b: { x0: number; x1: number; z0: number; z1: number; floors: number[] }) => {
      folded(k, p, (b.x0 + b.x1) / 2 - 0.13, b.floors[0], (b.z0 + b.z1) / 2, 0.26, b.z1 - b.z0 - 0.08, 0.1, m.shirtWhite)
      folded(k, p, (b.x0 + b.x1) / 2 + 0.15, b.floors[0], (b.z0 + b.z1) / 2, 0.26, b.z1 - b.z0 - 0.08, 0.1, m.trousers)
    },
  ]
  const drawer = (id: string, i: number): Unit => ({ kind: 'drawers', id: `bed2_${id}`, rows: [], fill: [fills[i % 2]] })
  const front = m.oak(0.8, 0.26)
  const zs: R[] = [[BED.z0 + 0.16, BED.z0 + 0.8], [BED.z0 + 0.8, BED.z0 + 1.44]]
  zs.forEach(([a, b], i) => {
    unit(B, 'x-', BED.x0, a, b, 0.06, 0.26, 0.54, drawer(`side_a${i}`, i), front)
    unit(B, 'x+', BED.x1, a, b, 0.06, 0.26, 0.54, drawer(`side_b${i}`, i + 1), front)
  })
  unit(B, 'z+', BED.z1, BED.x0, cx, 0.06, 0.26, 0.44, drawer('foot_a', 0), front)
  unit(B, 'z+', BED.z1, cx, BED.x1, 0.06, 0.26, 0.44, drawer('foot_b', 1), front)

  k.soft(g, bw - 0.04, 0.23, 1.84, 0.06, m.mattress, cx, 0.475, 1.07)
  const top = 0.59
  soft(drape({ hw: bw / 2 - 0.02, len: 1.22, drop: 0.2, edge: 0.06, puff: 0.04, seed: 41 }), m.duvet, cx, top, 0.78)
  soft(drape({ hw: bw / 2 - 0.01, len: 0.22, drop: 0.18, edge: 0.07, puff: 0.03, crease: 0.6, foot: false, seed: 42, segments: [72, 12] }), m.duvet, cx, top + 0.035, 0.6)
  // Quilted runner across the foot, and a knit throw left loose over one corner, as on the board.
  soft(drape({ hw: bw / 2 + 0.012, len: 0.56, drop: 0.2, edge: 0.07, puff: 0.012, crease: 0.6, seed: 43, segments: [72, 30] }), m.runner, cx, top + 0.05, 1.4)
  const t = soft(drape({ hw: 0.26, len: 0.82, drop: 0.14, edge: 0.06, puff: 0.012, crease: 0.9, seed: 44, tile: 0.4, segments: [36, 28] }), m.throwKnit, cx + 0.3, top + 0.072, 1.22)
  t.rotation.y = -0.16
  const P = (w: number, h: number, th: number, seed: number, mat: Material, x: number, y: number, z: number, tilt: number, yaw = 0) => {
    soft(pillow(w, h, th, seed), mat, x, y, z).rotation.set(-tilt, yaw, ((seed % 3) - 1) * 0.02)
  }
  P(0.7, 0.48, 0.17, 45, m.pillowWhite, cx - 0.36, top + 0.22, 0.28, 0.34, 0.03)
  P(0.7, 0.48, 0.16, 46, m.pillowWhite, cx + 0.37, top + 0.215, 0.29, 0.36, -0.02)
  P(0.62, 0.44, 0.16, 47, m.pillowSand, cx - 0.35, top + 0.19, 0.44, 0.3, 0.04)
  P(0.62, 0.44, 0.15, 48, m.pillowSand, cx + 0.36, top + 0.185, 0.45, 0.32, -0.05)
  P(0.48, 0.3, 0.12, 49, m.pillowTaupe, cx + 0.01, top + 0.13, 0.62, 0.28, 0.02)
  contact(B, cx, 1.09, 2.1, 2.3, 0.42)
}

/** Oak bedside tables with drawers, each with a drum-shaded lamp on the bedside circuit. */
function bedsides(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const tables: R[] = [[0.26, 0.74], [2.42, 2.88]]
  tables.forEach(([x0, x1], i) => {
    bx([x0 + 0.03, x1 - 0.03], [0, 0.06], [0.05, 0.4], m.dark, false)
    unit(B, 'z+', 0.44, x0, x1, 0.06, 0.42, 0.42, { kind: 'drawers', id: `bed2_table_${i}`, rows: [0.21], fill: [stationery(k, i), (p, b) => {
      for (let j = 0; j < 2; j++) k.box(p, 0.15 - j * 0.01, 0.022, 0.21, m.book[j + i], (b.x0 + b.x1) / 2, b.floors[0] + 0.011 + j * 0.022, (b.z0 + b.z1) / 2)
    }] }, m.oak(0.48, 0.42))
    bx([x0 - 0.005, x1 + 0.005], [0.48, 0.505], [0.012, 0.455], m.oak(0.5, 0.45))
    const cx = (x0 + x1) / 2
    k.cyl(g, 0.055, 0.07, 0.02, m.brass, cx, 0.515, 0.2, 24)
    k.cyl(g, 0.012, 0.012, 0.2, m.brass, cx, 0.625, 0.2, 12)
    const shade = new Mesh(new CylinderGeometry(0.085, 0.11, 0.17, 32, 1, true), m.shade)
    shade.position.set(cx, 0.79, 0.2)
    g.add(shade)
    k.sphere(g, 0.028, m.bulb, cx, 0.77, 0.2)
    contact(B, cx, 0.25, 0.65, 0.65, 0.35)
  })
  // A phone left on the near table, as on the board.
  k.box(g, 0.075, 0.009, 0.15, m.screen, 0.62, 0.51, 0.34)
}

/** The sliding wardrobe: cream and smoked-glass panels on three tracks, with hinged lofts above. */
function wardrobe(B: C) {
  const { bx, m, ctx, g } = B
  const { k } = ctx
  const X: R = [WR.x0, W]
  const Z = WR.z1
  const LOFT = 2.2
  const wear = { wood: m.hanger, steel: m.rail }
  bx([W - 0.02, W], [0, H], [0, Z], m.oak(Z, H))
  bx(X, [0, 0.08], [0, Z], m.dark, false)
  bx(X, [LOFT - 0.02, LOFT], [0, Z], m.oakPlain)
  bx(X, [H - 0.02, H], [0, Z], m.oakPlain)
  bx(X, [0, H], [Z, Z + 0.03], m.oak(0.6, H))
  bx(X, [0, H], [0, 0.02], m.oakPlain)
  // Two hinged doors over each half of the loft, opening on their own.
  const LW = Z / 4
  for (let i = 0; i < 4; i++) {
    const left = i % 2 === 0
    const pivot = new Group()
    pivot.name = `door_bed2_loft_${i + 1}`
    pivot.position.set(X[0], 0, left ? i * LW + 0.002 : (i + 1) * LW - 0.002)
    pivot.userData.openAngle = left ? -1.45 : 1.45
    g.add(pivot)
    bx([-0.02, 0], [LOFT + 0.004, H - 0.024], left ? [0, LW - 0.006] : [-(LW - 0.006), 0], m.oak(LW, 0.4), true, pivot).userData.front = true
  }
  for (let i = 0; i < 3; i++) folded(k, g, W - 0.3, LOFT, 0.4 + i * 0.75, 0.42, 0.5, 0.16, m.pillowSand as unknown as MeshStandardMaterial, (i - 1) * 0.04)

  // Three bays behind the panels, split by oak partitions.
  const P = (Z - 0.02) / 3
  const bay = (i: number): R => [0.02 + i * P, 0.02 + (i + 1) * P]
  for (const i of [1, 2]) bx([X[0] + 0.07, W - 0.02], [0.08, LOFT - 0.02], [0.02 + i * P - 0.009, 0.02 + i * P + 0.009], m.oakPlain)
  const hang = (r: R, items: [Parameters<typeof hangGarment>[2], Material][], seed: number) => {
    const rail = k.cyl(g, 0.011, 0.011, r[1] - r[0] - 0.05, m.rail, W - 0.3, 1.97, (r[0] + r[1]) / 2, 14)
    rail.rotation.x = PI / 2
    items.forEach(([kind, mat], i) => hangGarment(k, g, kind, mat, { x: W - 0.3, y: 1.97, z: r[0] + 0.1 + (i * (r[1] - r[0] - 0.2)) / Math.max(1, items.length - 1) }, seed + i, wear))
  }
  // Long hanging; shirts and trousers over a shelf; shelves of folded clothes over two drawers.
  hang(bay(0), [['jacket', m.jacket], ['dress', m.dress], ['jacket', m.blazer], ['shirt', m.shirtWhite], ['dress', m.shirtBlue]], 71)
  const mid = bay(1)
  bx([X[0] + 0.07, W - 0.02], [0.72, 0.742], [mid[0] + 0.01, mid[1] - 0.01], m.oakPlain)
  hang(mid, [['shirt', m.shirtWhite], ['shirt', m.shirtStripe], ['shirt', m.shirtBlue], ['trousers', m.trousers], ['trousers', m.trousersGrey]], 81)
  const knits = [m.shirtWhite, m.trousersGrey, m.blazer, m.trousers, m.shirtBlue] as MeshStandardMaterial[]
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) folded(k, g, W - 0.3, 0.742 + j * 0.05, mid[0] + 0.2 + i * 0.36, 0.32, 0.26, 0.05, knits[(i + j) % 5], (j - 1) * 0.02)
  const end = bay(2)
  unit(B, 'x-', X[0] + 0.07, end[0] + 0.01, end[1] - 0.01, 0.08, 0.54, 0.5, { kind: 'drawers', id: 'bed2_wardrobe_chest', rows: [0.27], fill: [
    (p, b) => { for (let i = 0; i < 3; i++) folded(k, p, b.x0 + 0.12 + i * 0.22, b.floors[0], (b.z0 + b.z1) / 2, 0.19, 0.3, 0.07, knits[i]) },
    (p, b) => { for (let i = 0; i < 3; i++) folded(k, p, b.x0 + 0.12 + i * 0.22, b.floors[0], (b.z0 + b.z1) / 2, 0.19, 0.3, 0.07, knits[i + 2]) },
  ] }, m.lacquer)
  for (const h of [1.08, 1.48]) bx([X[0] + 0.07, W - 0.02], [h, h + 0.022], [end[0] + 0.01, end[1] - 0.01], m.oakPlain)
  for (const [h, n] of [[0.62, 3], [1.102, 2], [1.502, 3]] as const) for (let i = 0; i < 2; i++) for (let j = 0; j < n; j++) folded(k, g, W - 0.3, h + j * 0.055, end[0] + 0.2 + i * 0.36, 0.3, 0.26, 0.055, knits[(i * 2 + j + n) % 5], (j - 1) * 0.015)
  bx([X[0] - 0.08, X[0] + 0.02], [LOFT - 0.045, LOFT - 0.01], [0.02, Z], m.rail)
  bx([X[0] - 0.08, X[0] + 0.02], [0.08, 0.095], [0.02, Z], m.rail)
  // The panels: each on its own track, so none can meet another. A tap runs it along over its neighbour.
  const run = [P - 0.04, -(P - 0.04), -(P - 0.04)]
  for (let i = 0; i < 3; i++) {
    const r = bay(i)
    const face = X[0] - 0.012 - i * 0.022
    const panel = new Group()
    panel.name = `drawer_bed2_wardrobe_${i + 1}`
    panel.userData.slide = [0, 0, run[i]]
    g.add(panel)
    const zs: R = [r[0] - (i ? 0.012 : 0), r[1] + (i < 2 ? 0.012 : 0)]
    if (i === 1) {
      bx([face, face + 0.006], [0.11, LOFT - 0.06], zs, m.smoked, false, panel).userData.front = true
      for (const z of [zs[0] + 0.012, zs[1] - 0.012]) bx([face - 0.004, face + 0.012], [0.1, LOFT - 0.05], [z - 0.012, z + 0.012], m.black, true, panel)
      for (const h of [0.11, LOFT - 0.06]) bx([face - 0.004, face + 0.012], [h - 0.012, h + 0.012], zs, m.black, true, panel)
    } else {
      bx([face, face + 0.018], [0.1, LOFT - 0.05], zs, m.lacquer, true, panel).userData.front = true
      bx([face - 0.008, face], [0.9, 1.35], i ? [zs[0] + 0.04, zs[0] + 0.055] : [zs[1] - 0.055, zs[1] - 0.04], m.steel, true, panel)
    }
  }
  contact(B, X[0] - 0.05, Z / 2, 0.5, Z + 0.1, 0.32)
}

/** The corner study desk: an oak L on panel legs, with a drawer pedestal, an open shelf, and the working clutter. */
function study(B: C) {
  const { bx, m, g, ctx, c } = B
  const { k } = ctx
  const back = D - 0.012
  const LONG: R = [0.02, 1.58]
  const SHORT: R = [back - 1.2, back - 0.6]
  // The tops, one piece round the corner; an end panel carries the long run past the pedestal.
  bx(LONG, [TABLE - 0.035, TABLE], [back - 0.6, back], m.oak(1.56, 0.6))
  bx([0.02, 0.62], [TABLE - 0.035, TABLE], SHORT, m.oak(0.6, 0.6))
  bx([0.03, 0.6], [0, TABLE - 0.035], [SHORT[0], SHORT[0] + 0.03], m.oakPlain)
  bx([1.54, 1.57], [0, TABLE - 0.035], [back - 0.58, back - 0.01], m.oakPlain)
  // Drawer pedestal under the long run, for stationery and papers.
  unit(B, 'z-', back - 0.6, 1.18, 1.54, 0.07, TABLE - 0.11, 0.56, { kind: 'drawers', id: 'bed2_desk', rows: [0.19, 0.38], fill: [stationery(k, 0), stationery(k, 1), stationery(k, 2)] }, m.oak(0.36, 0.6))
  bx([1.19, 1.53], [0, 0.07], [back - 0.56, back - 0.03], m.dark, false)
  // An open shelf of box files and books under the short run, where a door couldn't clear the chair.
  bx([0.03, 0.56], [0.3, 0.32], [SHORT[0] + 0.03, SHORT[1]], m.oakPlain)
  for (let i = 0; i < 6; i++) k.box(g, 0.2, 0.23 - (i % 3) * 0.02, 0.05, m.book[i % 4], 0.3, 0.32 + 0.115 - (i % 3) * 0.01, SHORT[0] + 0.08 + i * 0.07)
  for (let i = 0; i < 3; i++) k.box(g, 0.22, 0.03, 0.3, m.book[(i + 1) % 4], 0.3, 0.1 + i * 0.03, SHORT[0] + 0.25)

  // On the short run: a laptop open towards the room.
  const lap = new Group()
  lap.position.set(0.3, TABLE, back - 0.86)
  lap.rotation.y = PI / 2
  g.add(lap)
  k.box(lap, 0.33, 0.012, 0.23, m.steel, 0, 0.006, 0.06)
  k.box(lap, 0.28, 0.002, 0.11, m.dark, 0, 0.0125, 0.03, false)
  const lid = new Group()
  lid.position.set(0, 0.012, -0.055)
  lid.rotation.x = -0.28
  lap.add(lid)
  k.box(lid, 0.33, 0.215, 0.008, m.steel, 0, 0.108, 0)
  k.box(lid, 0.31, 0.195, 0.002, m.screen, 0, 0.108, 0.005, false)
  // On the long run: monitor at the back, keyboard and mouse, the lamp in the corner, books at the end.
  const mx = 0.92
  k.box(g, 0.56, 0.32, 0.018, m.black, mx, TABLE + 0.29, back - 0.1)
  k.box(g, 0.54, 0.3, 0.002, m.screen, mx, TABLE + 0.29, back - 0.11, false)
  k.box(g, 0.05, 0.13, 0.02, m.black, mx, TABLE + 0.08, back - 0.085)
  k.box(g, 0.2, 0.012, 0.14, m.black, mx, TABLE + 0.006, back - 0.11)
  k.soft(g, 0.42, 0.018, 0.13, 0.006, m.white, mx - 0.02, TABLE + 0.009, back - 0.38)
  k.soft(g, 0.06, 0.03, 0.1, 0.015, m.white, mx + 0.3, TABLE + 0.015, back - 0.38)
  for (let i = 0; i < 7; i++) k.box(g, 0.028 + (i % 3) * 0.006, 0.2 + (i % 3) * 0.025, 0.15, m.book[i % 4], 1.28 + i * 0.036, TABLE + 0.1 + (i % 3) * 0.0125, back - 0.11)
  // Pen pot, and a small plant at the window end.
  k.cyl(g, 0.035, 0.035, 0.09, m.oakPlain, 1.18, TABLE + 0.045, back - 0.13, 16)
  for (let i = 0; i < 4; i++) k.cyl(g, 0.004, 0.004, 0.15, m.black, 1.17 + (i % 2) * 0.016, TABLE + 0.1, back - 0.14 + i * 0.008, 6).rotation.z = (i - 1.5) * 0.08
  pottedPothos(k, g, 0.14, TABLE, SHORT[0] + 0.09, 0.62, m.pot, 21)
  // Corner desk lamp on its own circuit.
  k.cyl(g, 0.07, 0.08, 0.02, m.brass, 0.17, TABLE + 0.01, back - 0.17, 24)
  k.cyl(g, 0.009, 0.009, 0.34, m.brass, 0.17, TABLE + 0.18, back - 0.17, 10)
  const head = new Mesh(new CylinderGeometry(0.05, 0.085, 0.1, 28, 1, true), m.steel)
  head.position.set(0.2, TABLE + 0.37, back - 0.2)
  g.add(head)
  k.sphere(g, 0.025, m.deskBulb, 0.2, TABLE + 0.35, back - 0.2)
  const lamp = new PointLight('#ffd9a8', 1.6, 2, 2)
  lamp.position.set(0.3, TABLE + 0.3, back - 0.3)
  g.add(lamp)
  ctx.lighting.light(lamp, 1)
  c.desk.lights.push(lamp)

  // The cream swivel chair, turned to the corner.
  const seat = new Group()
  // In the knee of the L, clear of every drawer and door at full swing.
  seat.position.set(0.86, 0, back - 0.72)
  seat.rotation.y = 0.65
  g.add(seat)
  for (let i = 0; i < 5; i++) {
    const arm = new Group()
    arm.rotation.y = (i / 5) * PI * 2
    seat.add(arm)
    k.box(arm, 0.03, 0.024, 0.28, m.steel, 0, 0.065, 0.14)
    k.sphere(arm, 0.024, m.dark, 0, 0.026, 0.27)
  }
  k.cyl(seat, 0.022, 0.03, 0.34, m.steel, 0, 0.22, 0, 14)
  k.soft(seat, 0.5, 0.09, 0.48, 0.04, m.chair, 0, 0.44, 0)
  k.soft(seat, 0.54, 0.46, 0.08, 0.04, m.chair, 0, 0.68, 0.24).rotation.x = 0.1
  for (const s of [-1, 1]) k.soft(seat, 0.07, 0.24, 0.38, 0.03, m.chair, s * 0.29, 0.56, 0.04)
  contact(B, 0.86, back - 0.72, 0.8, 0.8, 0.28)
  contact(B, 0.8, back - 0.32, 1.7, 0.7, 0.3)
  contact(B, 0.32, back - 0.9, 0.7, 0.7, 0.28)
}

/** Full pleated curtains drawn back to each side of the window, on a slim rod. */
function window({ bx, m, g, ctx }: C) {
  const { k } = ctx
  const [z0, z1] = WIN.z
  const pleats = (a0: number, a1: number) => {
    const w = a1 - a0
    const h = H - 0.2
    const geo = new PlaneGeometry(w, h, Math.round(w / 0.012), 10)
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const y = p.getY(i)
      p.setZ(i, (0.03 + 0.012 * (0.5 - y / h)) * Math.sin((x / 0.09) * PI * 2) + 0.005 * Math.sin(x * 47 + y * 2))
    }
    geo.computeVertexNormals()
    const s = new Mesh(geo, m.curtain)
    s.rotation.y = PI / 2
    s.position.set(0.12, h / 2 + 0.03, (a0 + a1) / 2)
    s.castShadow = true
    g.add(s)
  }
  pleats(z0 - 0.26, z0 + 0.2)
  pleats(z1 - 0.2, z1 + 0.26)
  const rod = k.cyl(g, 0.012, 0.012, z1 - z0 + 0.7, m.black, 0.12, H - 0.13, (z0 + z1) / 2, 10)
  rod.rotation.x = PI / 2
  bx([0, 0.04], [WIN.h[0] - 0.03, WIN.h[0]], [z0 - 0.04, z1 + 0.04], m.oakPlain)
}

/** Switch plates: by the door, at both sides of the bed, and over the desk. */
function fittings({ m, g, ctx, c }: C) {
  const { k } = ctx
  const mats = { plate: m.plate, rocker: m.rocker, dark: m.dark, locator: m.locator }
  const door = switchPlate(k, g, 'bed2_entry', ['switch', 'switch', 'switch'], mats, [c.room, c.bed, c.desk])
  door.position.set(DOOR[0] - 0.2, 1.2, D - 0.0005)
  door.rotation.y = PI
  for (const [name, x] of [['bed2_left', 0.5], ['bed2_right', 2.65]] as const) switchPlate(k, g, name, ['switch', 'switch', 'socket'], mats, [c.bed, c.room]).position.set(x, 0.72, 0.0005)
  const study = switchPlate(k, g, 'bed2_desk', ['switch', 'socket', 'socket'], mats, [c.desk])
  study.position.set(0.5, TABLE + 0.2, D - 0.0125)
  study.rotation.y = PI
}

function lights({ g, ctx, c }: C) {
  const add = (x: number, h: number, z: number, intensity: number, distance: number, color = '#fff0dc') => {
    const l = new PointLight(color, intensity, distance, 2)
    l.position.set(x, h, z)
    g.add(l)
    ctx.lighting.light(l, 1)
    return l
  }
  c.room.lights.push(add(1.75, 2.42, 1.7, 7, 6.5), add(1.0, 2.4, 2.8, 3, 4), add(2.4, 2.4, 0.7, 3, 4), add(1.6, 2.45, 0.2, 2.4, 3, '#ffc98a'))
  c.bed.lights.push(add(0.5, 0.82, 0.3, 1.5, 2.2, '#ffd6a8'), add(2.65, 0.82, 0.3, 1.5, 2.2, '#ffd6a8'))
}
