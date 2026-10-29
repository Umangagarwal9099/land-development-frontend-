import { CylinderGeometry, DoubleSide, ExtrudeGeometry, FrontSide, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, PointLight, Shape, Vector2, type BufferGeometry, type Material, type MeshStandardMaterialParameters } from 'three'
import { PI } from '../kit'
import { tiledMat } from '../shared'
import type { Paint } from '../textures'
import { BEDROOM, GFL, type Ctx } from './house'
import { diamondWeave, knit, oakFloor, upholstery } from './paints'
import { drape, pillow } from './cloth'
import { cloth, folded, hangGarment } from './garments'
import { desk, officeChair } from './desk'
import { ceilingFan, circuit, switchPlate, type Circuit } from './fixtures'

/*
 * Ground-floor Bedroom 1, from the client's "Urban Retreat" board (dimensioned elevation and
 * render): a 5.20 m bed wall, 2.80 m ceiling, with a fluted walnut panel, a textured white marble
 * feature panel with a cove light above, a built-out walnut unit with a lit decor niche, a
 * 1.80 m upholstered wingback bed between light-grey bedside tables under glass pendants, and a
 * wardrobe on the adjoining wall: walnut sliding doors, lit glass shutters and grey lofts.
 *
 * Room frame: X along the bed wall from the front (0) to the back wall (5.20), Z out from the bed
 * wall (0) to the opposite wall (2.845), h above the floor. The bed wall is the house's left wall;
 * the wardrobe and window are on the back wall, as the render has them on the bed's right.
 */

const { l: L, w: W } = BEDROOM
const H = 2.8
const BED: [number, number] = [1.305, 3.105]
const WR = { x0: L - 0.6, z1: 2.4 }
/** The room is longer than the reference's wall; the bed wall's design keeps its own 5.20 m, set back from the door. */
const OFF = L - 5.2
/** Where the desk starts along the back wall, past the wardrobe's end panel. */
const DESK_Z = 2.5

type R = [number, number]
const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/** A radial falloff in alpha for soft contact shadows (tinted black by the material). */
const blot: Paint = (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  gr.addColorStop(0, 'rgba(255,255,255,0.85)')
  gr.addColorStop(0.6, 'rgba(255,255,255,0.4)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
}

function materials(ctx: Ctx) {
  const { k, lighting, c } = ctx
  const glow = (color: string, intensity: number) => lighting.glow(std({ color: '#fff3df', emissive: color, emissiveIntensity: intensity, roughness: 0.5 }), 1)
  const fabric = (tone: number[], seed: number, repeat: number, sheen = 0.5, double = false) => {
    const paint = upholstery(tone, seed)
    const map = k.tex.painted(256, 256, paint)
    map.repeat.set(repeat, repeat)
    return new MeshPhysicalMaterial({
      map,
      normalMap: k.tex.normalPainted(`bed_fabric_${seed}`, 256, 256, paint, repeat, repeat),
      normalScale: new Vector2(0.3, 0.3),
      roughness: 0.95,
      sheen,
      sheenRoughness: 0.6,
      sheenColor: '#f3ece2',
      side: double ? DoubleSide : FrontSide,
    })
  }
  // Garment fabrics: weave and colour per piece.
  const garment = (tone: string, kind: 'plain' | 'stripe' | 'twill' | 'herringbone', seed: number) => {
    const t = k.tex.painted(128, 128, cloth(tone, kind, seed))
    return std({ map: t, roughness: 0.95, side: DoubleSide })
  }
  const painted = (paint: Paint, rx: number, ry: number, rough = 0.9) => {
    const t = k.tex.painted(256, 256, paint)
    t.repeat.set(rx, ry)
    return std({ map: t, roughness: rough })
  }
  return {
    walnut: (w: number, h: number) => c.surface('walnut', w, h),
    marble: (w: number, h: number) => c.surface('marbleWhite', w, h),
    // Boards run out from the bed wall, as in the render.
    floor: tiledMat(k, 'bed_oak', oakFloor, [L / 0.76, W / 2.4], { roughness: 0.38 }, 512),
    rug: (w: number, d: number) => c.surface('rug', w, d),
    paint: std({ color: '#f1eee9', roughness: 0.9 }),
    groove: std({ color: '#7c7873', roughness: 0.8 }),
    dark: std({ color: '#2a2622', roughness: 0.8 }),
    greyLam: std({ color: '#c9c7c2', roughness: 0.55 }),
    greyLamDark: std({ color: '#b5b3ae', roughness: 0.55 }),
    headboard: fabric([196, 186, 172], 171, 6),
    welt: std({ color: '#a99d8d', roughness: 0.9 }),
    mattress: fabric([238, 236, 231], 172, 8, 0.3),
    // Draped pieces carry UVs in metres, so their textures repeat once per tile.
    duvet: fabric([244, 242, 238], 176, 1, 0.35, true),
    blanket: fabric([214, 198, 176], 175, 1, 0.5, true),
    throw: (() => {
      const m = painted(knit, 1, 1, 1)
      m.side = DoubleSide
      return m
    })(),
    pillowWhite: fabric([243, 241, 237], 177, 3, 0.35),
    pillowGrey: fabric([168, 164, 158], 173, 3),
    pillowTaupe: fabric([150, 128, 110], 174, 3),
    cushion: painted(diamondWeave, 1, 1, 0.95),
    brass: std({ color: '#b08d57', roughness: 0.32, metalness: 0.9 }),
    black: std({ color: '#151516', roughness: 0.45, metalness: 0.4 }),
    bronze: std({ color: '#3b3028', roughness: 0.4, metalness: 0.7 }),
    glass: new MeshPhysicalMaterial({ color: '#e9f0ee', roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false }),
    smoked: new MeshPhysicalMaterial({ color: '#c9a77a', roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, side: DoubleSide }),
    amber: lighting.glow(new MeshPhysicalMaterial({ color: '#f3c98a', roughness: 0.15, transparent: true, opacity: 0.8, emissive: '#ffb055', emissiveIntensity: 1.6, side: DoubleSide }), 0.4),
    led: glow('#ffc98a', 2.2),
    bulb: glow('#ffd8a0', 2.6),
    // One glow per lighting circuit, so a switch can put out exactly its own fittings.
    bulbRoom: glow('#ffd8a0', 2.6),
    bulbBed: glow('#ffd8a0', 2.6),
    ledCove: glow('#ffc98a', 2.2),
    lampBulb: glow('#ffe0b0', 2.4),
    locator: glow('#ff9a3a', 1.4),
    plate: std({ color: '#cbc5bb', roughness: 0.45 }),
    rocker: std({ color: '#ece8e1', roughness: 0.35 }),
    casing: std({ color: '#ebe7e1', roughness: 0.6 }),
    fanBody: std({ color: '#2a2724', roughness: 0.5, metalness: 0.5 }),
    ceramic: new MeshPhysicalMaterial({ color: '#f1ede6', roughness: 0.3, clearcoat: 0.6 }),
    stoneware: std({ color: '#8f8a83', roughness: 0.6 }),
    pampas: std({ color: '#d8c6a4', roughness: 1 }),
    stem: std({ color: '#a8916b', roughness: 0.9 }),
    book: [std({ color: '#3d4a52', roughness: 0.7 }), std({ color: '#c9bba3', roughness: 0.7 }), std({ color: '#7a5a45', roughness: 0.7 })],
    clothes: ['#e9e5de', '#9aa0a6', '#3e4348', '#c7b49a', '#6b5a4c', '#d8d2c8'].map((color) => std({ color, roughness: 1 })),
    shirtWhite: garment('#eeebe6', 'plain', 1),
    shirtStripe: garment('#e9edf2', 'stripe', 2),
    shirtBlue: garment('#a9bccf', 'plain', 3),
    jacketCharcoal: garment('#3d3f43', 'herringbone', 4),
    jacketNavy: garment('#2b3446', 'twill', 5),
    trouserBeige: garment('#c3b293', 'twill', 6),
    trouserGrey: garment('#7d7f82', 'twill', 7),
    dress: garment('#9b7f6b', 'plain', 8),
    hangerWood: std({ color: '#7a5236', roughness: 0.5 }),
    rail: std({ color: '#c7cbd0', roughness: 0.25, metalness: 0.9 }),
    contact: new MeshBasicMaterial({ map: k.tex.painted(128, 128, blot), color: '#000000', transparent: true, depthWrite: false }),
    ceiling: new MeshStandardMaterial({ color: '#f4f1ec', roughness: 0.95, side: FrontSide, shadowSide: DoubleSide, emissive: '#c9c0b2', emissiveIntensity: 0.45 }),
  }
}

type BM = ReturnType<typeof materials>
type Circuits = { room: Circuit; bed: Circuit; desk: Circuit }
type BC = { ctx: Ctx; m: BM; g: Group; c: Circuits; bx: (x: R, h: R, z: R, mat: Material, cast?: boolean, p?: Group) => Mesh }

export function buildBedroom(ctx: Ctx) {
  const { k } = ctx
  const g = new Group()
  g.name = 'bedroom_g'
  // Room frame: local X runs along the bed wall towards the back (house −z), local Z out of it (+x).
  g.position.set(BEDROOM.x0, GFL, BEDROOM.z0)
  g.rotation.y = PI / 2
  k.root.add(g)
  const m = materials(ctx)
  const bx = ([x0, x1]: R, [h0, h1]: R, [z0, z1]: R, mat: Material, cast = true, p: Group = g) =>
    k.box(p, x1 - x0, h1 - h0, z1 - z0, mat, (x0 + x1) / 2, (h0 + h1) / 2, (z0 + z1) / 2, cast)
  const c: Circuits = { room: circuit(), bed: circuit(), desk: circuit() }
  c.room.glows.push(m.bulbRoom, m.ledCove)
  c.bed.glows.push(m.bulbBed, m.amber)
  c.desk.glows.push(m.lampBulb)
  const B: BC = { ctx, m, g, c, bx }
  // The bed wall, bed and bedside tables are laid out on the reference's 5.20 m, shifted along.
  const wall = new Group()
  wall.position.x = OFF
  g.add(wall)
  const BW: BC = { ctx, m, g: wall, c, bx: (x, h, z, mat, cast = true, p = wall) => bx(x, h, z, mat, cast, p) }
  shell(B)
  bedWall(BW)
  bed(BW)
  bedsides(BW)
  wardrobe(B)
  workspace(B)
  fittings(B, BW)
  lights(B)
}

function contact({ g, m }: BC, x: number, z: number, w: number, d: number, opacity: number) {
  const mat = m.contact.clone()
  mat.opacity = opacity
  const s = new Mesh(new PlaneGeometry(w, d), mat)
  s.rotation.x = -PI / 2
  s.position.set(x, 0.014, z)
  s.renderOrder = 1
  g.add(s)
}

/** Oak floor, the false ceiling, the dividing walls with the door, rug and ceiling fittings. */
function shell(B: BC) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  bx([0, L], [0, 0.012], [0, W], m.floor, false)
  // Front wall to the living room, with the door near the kitchen side; the side wall to the kitchen hall.
  const DOOR: R = [W - 1.1, W - 0.2]
  bx([-0.115, 0], [0, 3.11], [0, DOOR[0]], m.paint)
  bx([-0.115, 0], [2.1, 3.11], DOOR, m.paint)
  bx([-0.115, 0], [0, 3.11], [DOOR[1], W + 0.115], m.paint)
  bx([0, L - 3.815], [0, 3.11], [W, W + 0.115], m.paint)
  // Flush walnut door on three brass butt hinges, closed: a tap swings it open into the room.
  const dw = DOOR[1] - DOOR[0] - 0.008
  const door = new Group()
  door.name = 'door_bedroom_entry'
  door.position.set(0, 0, DOOR[1] - 0.004)
  door.userData.openAngle = -1.6
  g.add(door)
  bx([-0.084, -0.044], [0.006, 2.094], [-dw, 0], m.walnut(0.9, 2.1), true, door).userData.front = true
  // Lever handles on both faces, on round roses.
  for (const [rx, lx] of [[-0.09, -0.1], [-0.038, -0.028]] as const) {
    k.cyl(door, 0.026, 0.026, 0.012, m.brass, rx, 1.0, -dw + 0.065, 20).rotation.z = PI / 2
    bx([lx - 0.008, lx + 0.008], [0.992, 1.008], [-dw + 0.06, -dw + 0.19], m.brass, true, door)
  }
  for (const h of [0.22, 1.05, 1.88]) {
    k.cyl(g, 0.007, 0.007, 0.1, m.brass, -0.044, h, DOOR[1] - 0.006, 12)
    bx([-0.046, -0.042], [h - 0.05, h + 0.05], [DOOR[1] - 0.04, DOOR[1] - 0.006], m.brass, true, door)
  }
  // Painted architrave round the opening, on the room side.
  bx([0, 0.014], [0, 2.17], [DOOR[0] - 0.065, DOOR[0]], m.casing)
  bx([0, 0.014], [0, 2.17], [DOOR[1], DOOR[1] + 0.065], m.casing)
  bx([0, 0.014], [2.1, 2.17], DOOR, m.casing)

  const ceiling = new Mesh(new PlaneGeometry(L, W), m.ceiling)
  ceiling.rotation.x = PI / 2
  ceiling.position.set(L / 2, H, W / 2)
  g.add(ceiling)
  // Recessed downlights and the black linear track over the room.
  for (const [x, z] of [[0.7, 1.8], [OFF + 0.9, 2.6], [OFF + 3.6, 2.6], [L - 1.0, 1.4]]) k.cyl(g, 0.045, 0.045, 0.01, m.bulbRoom, x, H - 0.004, z, 16).castShadow = false
  bx([OFF + 1.6, L - 0.8], [H - 0.03, H], [1.48, 1.52], m.black, false)
  for (const x of [OFF + 2.1, OFF + 3.0, OFF + 3.9]) {
    k.cyl(g, 0.025, 0.025, 0.09, m.black, x, H - 0.075, 1.5, 14)
    k.cyl(g, 0.018, 0.018, 0.004, m.bulbRoom, x, H - 0.122, 1.5, 12).castShadow = false
  }

  // Trellis rug under the bed, running out past its foot.
  bx([OFF + 0.85, OFF + 3.55], [0.012, 0.022], [1.15, 3.0], m.rug(2.7, 1.85), false)
}

/** The bed wall: fluted walnut, the textured marble panel with its cove, and the walnut niche unit. */
function bedWall(B: BC) {
  const { bx, m, ctx, g } = B
  const { k } = ctx
  // Fluted walnut panel, floor to ceiling, 30 mm battens at 50 mm over a dark ground.
  const FW: R = [0.437, 1.217]
  bx(FW, [0, H], [0, 0.012], m.dark)
  const batten = m.walnut(0.03, H)
  for (let x = FW[0] + 0.025; x < FW[1] - 0.01; x += 0.05) bx([x - 0.015, x + 0.015], [0, H], [0.012, 0.04], batten)

  // Marble panel in four book-matched slabs with V-grooves; a recessed cove washes it from above.
  const MW: R = [1.217, 3.193]
  const slab = (MW[1] - MW[0]) / 4
  for (let i = 0; i < 4; i++) {
    // Each slab shows a different part of the stone.
    const mat = m.marble(slab, H)
    mat.map?.offset.set(i * 0.37, i * 0.21)
    bx([MW[0] + i * slab + 0.003, MW[0] + (i + 1) * slab - 0.003], [0, H - 0.12], [0, 0.03], mat)
  }
  for (let i = 1; i < 4; i++) bx([MW[0] + i * slab - 0.003, MW[0] + i * slab + 0.003], [0, H - 0.12], [0, 0.024], m.groove)
  bx(MW, [H - 0.12, H], [0, 0.02], m.dark, false)
  bx([MW[0] + 0.02, MW[1] - 0.02], [H - 0.115, H - 0.105], [0.03, 0.05], m.ledCove, false)

  // Built-out walnut unit with a lit decor niche: three shelves, a vase, a sculpture and a bowl.
  const RW: R = [3.193, 4.285]
  const D = 0.22
  const N = { x0: 3.9, x1: 4.26, h0: 0.64, h1: 1.87 }
  bx([RW[0], N.x0], [0, H], [0, D], m.walnut(RW[1] - RW[0], H))
  bx([N.x1, RW[1]], [0, H], [0, D], m.walnut(0.1, H))
  bx([N.x0, N.x1], [0, N.h0], [0, D], m.walnut(0.4, 0.7))
  bx([N.x0, N.x1], [N.h1, H], [0, D], m.walnut(0.4, 1))
  bx([N.x0, N.x1], [N.h0, N.h1], [0, 0.03], m.walnut(0.4, 1.3))
  for (const x of [RW[0] + 0.35, RW[0] + 0.7]) bx([x - 0.003, x + 0.003], [0, H], [D - 0.003, D + 0.001], m.groove, false)
  for (const h of [N.h0, 1.05, 1.46]) {
    bx([N.x0, N.x1], [h, h + 0.022], [0.03, D], m.walnut(0.4, 0.2))
    bx([N.x0 + 0.01, N.x1 - 0.01], [h + 0.38, h + 0.386], [D - 0.04, D - 0.02], m.led, false)
  }
  const vase = new Mesh(new CylinderGeometry(0.035, 0.05, 0.22, 24), m.ceramic)
  vase.position.set(4.08, N.h0 + 0.022 + 0.11, 0.12)
  g.add(vase)
  k.sphere(g, 0.05, m.brass, 4.08, 1.05 + 0.022 + 0.05, 0.12)
  k.cyl(g, 0.012, 0.03, 0.12, m.brass, 4.12, 1.05 + 0.022 + 0.06, 0.12, 12)
  k.cyl(g, 0.07, 0.04, 0.05, m.stoneware, 4.08, 1.46 + 0.022 + 0.025, 0.12, 20)

  // Brass reading sconces on the two walnut panels.
  for (const x of [0.83, 3.45]) {
    bx([x - 0.04, x + 0.04], [1.0, 1.1], [0.04, 0.055], m.brass)
    k.cyl(g, 0.025, 0.03, 0.09, m.brass, x, 1.05, 0.11, 16)
    k.cyl(g, 0.02, 0.02, 0.004, m.bulbBed, x, 1.05, 0.156, 12).castShadow = false
  }
}

/** A panel outline with rounded top corners, for the upholstered headboard. */
function rounded(w: number, h: number, top: number) {
  const s = new Shape()
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(w / 2, h - top)
  s.quadraticCurveTo(w / 2, h, w / 2 - top, h)
  s.lineTo(-w / 2 + top, h)
  s.quadraticCurveTo(-w / 2, h, -w / 2, h - top)
  s.closePath()
  return s
}

/** The wingback bed: upholstered headboard and base, mattress, draped duvet, blanket, knit throw and pillows. */
function bed(B: BC) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const cx = (BED[0] + BED[1]) / 2
  const bw = BED[1] - BED[0]
  const soft = (geo: BufferGeometry, mat: Material, x: number, y: number, z: number) => {
    const mesh = new Mesh(geo, mat)
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    g.add(mesh)
    return mesh
  }
  // Headboard: a padded panel with rounded shoulders, piped round its face; wings slightly proud.
  soft(new ExtrudeGeometry(rounded(1.92, 0.86, 0.14), { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 6, curveSegments: 12 }), m.headboard, cx, 0.18, 0.06)
  const welt = soft(new ExtrudeGeometry(rounded(1.985, 0.893, 0.17), { depth: 0.006, bevelEnabled: false, curveSegments: 12 }), m.welt, cx, 0.163, 0.122)
  welt.castShadow = false
  for (const s of [-1, 1]) k.soft(g, 0.08, 0.84, 0.22, 0.03, m.headboard, cx + s * 0.95, 0.6, 0.2)
  // Upholstered base on a recessed dark plinth, with a welt seam round its top edge.
  bx([BED[0] + 0.04, BED[1] - 0.04], [0, 0.06], [0.2, 2.1], m.dark, false)
  k.soft(g, bw + 0.04, 0.3, 2.0, 0.03, m.headboard, cx, 0.21, 1.17)
  for (const [w, d, x, z] of [[bw + 0.05, 0.008, cx, 0.17], [bw + 0.05, 0.008, cx, 2.17], [0.008, 2.0, BED[0] - 0.025, 1.17], [0.008, 2.0, BED[1] + 0.025, 1.17]] as const)
    k.box(g, w, 0.008, d, m.welt, x, 0.345, z, false)
  // Mattress: deep, softly rounded, with a piped top edge.
  k.soft(g, bw - 0.04, 0.24, 1.96, 0.06, m.mattress, cx, 0.48, 1.16)
  // Duvet: lies over the mattress from the turn-down, rolls over the edges and falls to a waving hem.
  const top = 0.6
  soft(drape({ hw: bw / 2 - 0.02, len: 1.36, drop: 0.28, edge: 0.06, puff: 0.045, seed: 7 }), m.duvet, cx, top, 0.78)
  // The turned-down top edge, folded back over the duvet towards the pillows.
  soft(drape({ hw: bw / 2 - 0.01, len: 0.24, drop: 0.25, edge: 0.07, puff: 0.03, crease: 0.6, foot: false, seed: 8, segments: [72, 12] }), m.duvet, cx, top + 0.035, 0.62)
  // Beige blanket folded across the foot, and the chunky knit throw over it, a little askew.
  soft(drape({ hw: bw / 2 + 0.015, len: 0.52, drop: 0.26, edge: 0.075, puff: 0.012, crease: 0.6, seed: 9, segments: [72, 30] }), m.blanket, cx, top + 0.052, 1.64)
  const t = soft(drape({ hw: bw / 2 + 0.035, len: 0.34, drop: 0.2, edge: 0.085, puff: 0.006, crease: 0.8, foot: false, seed: 10, tile: 0.4, segments: [72, 16] }), m.throw, cx + 0.04, top + 0.07, 1.5)
  t.rotation.y = 0.05
  // Pillows, each with its own shape: sleeping pillows, grey shams, taupe accents, a diamond cushion.
  const P = (w: number, h: number, th: number, seed: number, mat: Material, x: number, y: number, z: number, tilt: number, yaw = 0) => {
    const p = soft(pillow(w, h, th, seed), mat, x, y, z)
    p.rotation.set(-tilt, yaw, (seed % 3 - 1) * 0.02)
  }
  P(0.74, 0.5, 0.18, 21, m.pillowWhite, cx - 0.41, top + 0.24, 0.34, 0.34, 0.03)
  P(0.74, 0.5, 0.17, 22, m.pillowWhite, cx + 0.42, top + 0.235, 0.35, 0.36, -0.02)
  P(0.6, 0.5, 0.17, 23, m.pillowGrey, cx - 0.39, top + 0.215, 0.48, 0.3, 0.04)
  P(0.6, 0.5, 0.16, 24, m.pillowGrey, cx + 0.4, top + 0.21, 0.49, 0.32, -0.05)
  P(0.44, 0.4, 0.14, 25, m.pillowTaupe, cx - 0.63, top + 0.17, 0.6, 0.26, 0.2)
  P(0.44, 0.4, 0.14, 26, m.pillowTaupe, cx + 0.64, top + 0.17, 0.61, 0.28, -0.18)
  P(0.5, 0.34, 0.13, 27, m.cushion, cx + 0.02, top + 0.15, 0.64, 0.3, 0.02)
  contact(B, cx, 1.17, 2.3, 2.5, 0.5)
}

/** Light-grey two-drawer bedside tables, with pampas grass on one and books on the other. */
function bedsides(B: BC) {
  const { bx, m, ctx, g } = B
  const { k } = ctx
  for (const [x0, x1] of [[0.52, 1.11], [3.28, 3.87]] as R[]) {
    bx([x0 + 0.03, x1 - 0.03], [0, 0.06], [0.06, 0.44], m.dark, false)
    bx([x0, x1], [0.06, 0.5], [0.04, 0.48], m.greyLam)
    for (const [h0, h1] of [[0.064, 0.278], [0.282, 0.496]] as R[]) {
      bx([x0 + 0.004, x1 - 0.004], [h0, h1], [0.48, 0.5], m.greyLamDark)
      bx([x0 + 0.2, x1 - 0.2], [h1 - 0.035, h1 - 0.025], [0.5, 0.512], m.brass)
    }
    contact(B, (x0 + x1) / 2, 0.3, 0.8, 0.7, 0.45)
  }
  // Pampas grass in a ceramic vase, and a small brass candle holder.
  k.cyl(g, 0.06, 0.08, 0.26, m.ceramic, 0.72, 0.63, 0.25, 24)
  // Dried pampas: fine stems of differing length, each ending in a slender, feathery plume.
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4
    const lean = 0.12 + (i % 3) * 0.1
    const len = 0.5 + (i % 4) * 0.06
    const stem = new Group()
    stem.position.set(0.72, 0.74, 0.25)
    stem.rotation.set(Math.cos(a) * lean, 0, Math.sin(a) * lean)
    g.add(stem)
    k.cyl(stem, 0.0025, 0.0025, len, m.stem, 0, len / 2, 0, 5)
    for (let j = 0; j < 3; j++) {
      const plume = k.blob(stem, 0.022, m.pampas, (j - 1) * 0.008, len + 0.06 + j * 0.035, (j % 2) * 0.006, 3.2 - j * 0.6)
      plume.castShadow = false
    }
  }
  k.cyl(g, 0.03, 0.035, 0.08, m.brass, 0.95, 0.54, 0.3, 16)
  // Books stacked on the right table.
  for (let i = 0; i < 3; i++) bx([3.42 + i * 0.01, 3.66 - i * 0.012], [0.5 + i * 0.03, 0.53 + i * 0.03], [0.14 + i * 0.01, 0.31 - i * 0.008], m.book[i])
}

/** Wardrobe on the back wall: walnut sliders, lit glass shutters with clothes, grey lofts above. */
function wardrobe(B: BC) {
  const { bx, m, ctx, g } = B
  const { k } = ctx
  const X: R = [WR.x0, L]
  const Z1 = WR.z1
  const LOFT = 2.2
  // Carcass: walnut-lined interior, light-grey end panel and lofts, plinth.
  bx([L - 0.02, L], [0, H], [0, Z1], m.walnut(Z1, H))
  bx(X, [0, 0.08], [0, Z1], m.dark, false)
  bx(X, [LOFT - 0.02, LOFT], [0, Z1], m.greyLam)
  bx(X, [H - 0.02, H], [0, Z1], m.greyLam)
  bx(X, [0, H], [Z1, Z1 + 0.02], m.greyLam)
  bx(X, [0, H], [0, 0.02], m.greyLam)
  // Loft doors in pairs, hinged at their outer edges, each opening on its own.
  const loftW = Z1 / 4
  for (let i = 0; i < 4; i++) {
    const left = i % 2 === 0
    const pivot = new Group()
    pivot.name = `door_wardrobe_loft_${i + 1}`
    pivot.position.set(X[0], 0, left ? i * loftW + 0.002 : (i + 1) * loftW - 0.002)
    pivot.userData.openAngle = left ? -1.45 : 1.45
    g.add(pivot)
    const z: R = left ? [0, loftW - 0.006] : [-(loftW - 0.006), 0]
    bx([-0.02, 0], [LOFT + 0.004, H - 0.004], z, m.greyLam, true, pivot).userData.front = true
  }
  // The loft inside: spare bedding and storage boxes.
  for (let i = 0; i < 3; i++) folded(k, g, L - 0.3, LOFT, 0.35 + i * 0.75, 0.42, 0.5, 0.18, m.blanket, (i - 1) * 0.04)
  bx([L - 0.5, L - 0.1], [LOFT, LOFT + 0.3], [1.85, 2.25], m.greyLamDark)
  // Inside the glass half: a hanging rail of garments on wooden hangers, a shelf of folded
  // knitwear, and a two-drawer chest below with folded shirts on top.
  const G: R = [Z1 / 2, Z1]
  bx([X[0] + 0.05, L - 0.02], [0.08, 0.5], [G[0] + 0.02, G[1] - 0.02], m.greyLam)
  for (const h of [0.08, 0.29]) {
    bx([X[0] + 0.03, X[0] + 0.05], [h + 0.004, h + 0.206], [G[0] + 0.03, G[1] - 0.03], m.greyLamDark)
    bx([X[0] + 0.025, X[0] + 0.03], [h + 0.16, h + 0.17], [(G[0] + G[1]) / 2 - 0.08, (G[0] + G[1]) / 2 + 0.08], m.brass)
  }
  bx([X[0] + 0.05, L - 0.02], [1.0, 1.022], [G[0] + 0.02, G[1] - 0.02], m.walnut(0.5, 0.9))
  const knits = [m.shirtWhite, m.trouserGrey, m.jacketNavy, m.trouserBeige, m.shirtBlue] as MeshStandardMaterial[]
  const knits2 = [m.jacketNavy, m.trouserBeige, m.trouserGrey, m.shirtStripe] as MeshStandardMaterial[]
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3 + (i % 2); j++)
      folded(k, g, L - 0.3 + (j % 2) * 0.006, 1.022 + j * 0.05, G[0] + 0.19 + i * 0.36, 0.32, 0.26, 0.05, knits[(i * 2 + j) % knits.length], (j - 1) * 0.02)
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) folded(k, g, L - 0.3, 0.5 + j * 0.035, G[0] + 0.2 + i * 0.36, 0.3, 0.22, 0.035, knits[(i + j * 2) % knits.length], (i - 1) * 0.015)
  const rail = k.cyl(g, 0.011, 0.011, G[1] - G[0] - 0.05, m.rail, L - 0.3, 1.97, (G[0] + G[1]) / 2, 14)
  rail.rotation.x = PI / 2
  for (const z of [G[0] + 0.035, G[1] - 0.035]) bx([L - 0.32, L - 0.28], [1.95, 1.99], [z - 0.008, z + 0.008], m.rail)
  const hangers: [Parameters<typeof hangGarment>[2], Material][] = [
    ['shirt', m.shirtWhite], ['shirt', m.shirtStripe], ['shirt', m.shirtBlue], ['jacket', m.jacketCharcoal], ['trousers', m.trouserBeige],
    ['trousers', m.trouserGrey], ['dress', m.dress], ['shirt', m.shirtWhite], ['jacket', m.jacketNavy], ['shirt', m.shirtBlue],
  ]
  hangers.forEach(([kind, mat], i) =>
    hangGarment(k, g, kind, mat, { x: L - 0.3, y: 1.97, z: G[0] + 0.1 + i * ((G[1] - G[0] - 0.2) / (hangers.length - 1)) }, 31 + i, { wood: m.hangerWood, steel: m.rail }),
  )
  for (const z of [G[0] + 0.03, G[1] - 0.03]) bx([X[0] + 0.06, X[0] + 0.08], [1.05, 2.15], [z - 0.008, z + 0.008], m.led, false)
  bx([X[0] + 0.06, L - 0.04], [2.15, 2.16], [G[0] + 0.03, G[1] - 0.03], m.led, false)
  // Sliding gear: aluminium top and bottom tracks, and an edge-banded end panel.
  bx([X[0] - 0.06, X[0]], [LOFT - 0.045, LOFT - 0.01], [0, Z1], m.rail)
  bx([X[0] - 0.06, X[0]], [0.08, 0.095], [0, Z1], m.rail)
  bx([X[0] - 0.002, L], [0, H], [Z1 + 0.02, Z1 + 0.022], m.greyLamDark, false)
  // Two walnut sliders and two glass shutters on staggered tracks, in slim bronze frames. A tap
  // runs a panel along its track: back-track panels towards the far end, front-track ones towards
  // the near end, each over its neighbour on the other track, so no two can ever meet.
  const P = Z1 / 4
  const run = [P, -P, P, -P]
  for (let i = 0; i < 4; i++) {
    const front = i % 2 ? X[0] - 0.045 : X[0] - 0.02
    const zs: R = [i * P - (i ? 0.02 : 0), (i + 1) * P + (i < 3 ? 0.02 : 0)]
    const panel = new Group()
    panel.name = `drawer_wardrobe_slider_${i + 1}`
    panel.userData.slide = [0, 0, run[i] - Math.sign(run[i]) * 0.04]
    g.add(panel)
    const p = (x: R, h: R, z: R, mat: Material, cast = true) => bx(x, h, z, mat, cast, panel)
    if (i < 2) {
      p([front, front + 0.022], [0.1, LOFT - 0.05], zs, m.walnut(P, 2.1)).userData.front = true
      p([front - 0.003, front], [0.9, 1.4], i ? [zs[0] + 0.035, zs[0] + 0.05] : [zs[1] - 0.05, zs[1] - 0.035], m.bronze)
    } else {
      p([front + 0.006, front + 0.012], [0.12, LOFT - 0.07], [zs[0] + 0.02, zs[1] - 0.02], m.smoked, false).userData.front = true
      for (const z of [zs[0] + 0.01, zs[1] - 0.01]) p([front, front + 0.022], [0.1, LOFT - 0.05], [z - 0.01, z + 0.01], m.bronze)
      for (const h of [0.11, LOFT - 0.06]) p([front, front + 0.022], [h - 0.01, h + 0.01], zs, m.bronze)
    }
  }
  // Behind the walnut sliders: a centre partition, a hanging rail of longer pieces over a shelf
  // of folded jeans and knitwear, and shoe boxes on the base.
  const Wd: R = [0.02, Z1 / 2]
  bx([X[0] + 0.02, L - 0.02], [0.08, LOFT - 0.02], [Z1 / 2 - 0.009, Z1 / 2 + 0.009], m.greyLam)
  bx([X[0] + 0.05, L - 0.02], [0.5, 0.522], [Wd[0], Wd[1] - 0.01], m.walnut(0.5, 1.2))
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) folded(k, g, L - 0.3 + (j % 2) * 0.005, 0.522 + j * 0.045, Wd[0] + 0.2 + i * 0.37, 0.3, 0.27, 0.045, knits2[(i + j) % knits2.length], (j - 1.5) * 0.015)
  for (let i = 0; i < 3; i++) {
    bx([L - 0.48, L - 0.14], [0.08, 0.2], [Wd[0] + 0.05 + i * 0.38, Wd[0] + 0.39 + i * 0.38], m.greyLamDark)
    bx([L - 0.48, L - 0.14], [0.2, 0.22], [Wd[0] + 0.045 + i * 0.38, Wd[0] + 0.395 + i * 0.38], m.casing)
  }
  const rail2 = k.cyl(g, 0.011, 0.011, Wd[1] - Wd[0] - 0.05, m.rail, L - 0.3, 1.97, (Wd[0] + Wd[1]) / 2, 14)
  rail2.rotation.x = PI / 2
  const long: [Parameters<typeof hangGarment>[2], Material][] = [['jacket', m.jacketCharcoal], ['dress', m.dress], ['jacket', m.jacketNavy], ['shirt', m.shirtStripe], ['dress', m.shirtBlue], ['jacket', m.trouserBeige], ['shirt', m.shirtWhite]]
  long.forEach(([kind, mat], i) => hangGarment(k, g, kind, mat, { x: L - 0.3, y: 1.97, z: Wd[0] + 0.12 + i * ((Wd[1] - Wd[0] - 0.24) / (long.length - 1)) }, 51 + i, { wood: m.hangerWood, steel: m.rail }))
  for (const z of [Wd[0] + 0.03, Wd[1] - 0.03]) bx([X[0] + 0.06, X[0] + 0.08], [0.6, 2.15], [z - 0.008, z + 0.008], m.led, false)
  contact(B, (X[0] + L) / 2 - 0.1, Z1 / 2, 0.9, Z1 + 0.2, 0.35)
}

/** The workspace under the window: desk on the back wall, chair drawn up to it, the lamp on its own circuit. */
function workspace(B: BC) {
  const { m, g, ctx, c } = B
  const { k } = ctx
  const d = new Group()
  // Desk frame: its x runs along the back wall (+Z here), its z out from the wall (−X).
  d.position.set(L - 0.005, 0, DESK_Z)
  d.rotation.y = -PI / 2
  g.add(d)
  const { lampHead } = desk(k, d, { walnut: m.walnut, greyLam: m.greyLam, interior: m.casing, drawer: m.greyLamDark, brass: m.brass, black: m.black, lampBulb: m.lampBulb })
  const lamp = new PointLight('#ffd9a8', 1.4, 1.6, 2)
  lamp.position.set(0, 0.1, 0)
  lampHead.add(lamp)
  ctx.lighting.light(lamp, 1)
  c.desk.lights.push(lamp)
  officeChair(k, g, L - 0.7, DESK_Z + 0.6, PI / 2 + 0.25)
  contact(B, L - 0.3, DESK_Z + 0.52, 0.7, 1.15, 0.35)
  contact(B, L - 0.72, DESK_Z + 0.62, 0.75, 0.75, 0.3)
}

/** Switch plates (by both sides of the bed, at the door, over the desk) and the ceiling fan. */
function fittings(B: BC, BW: BC) {
  const { m, g, ctx, c } = B
  const { k } = ctx
  const mats = { plate: m.plate, rocker: m.rocker, dark: m.dark, locator: m.locator }
  // Bedside: bedside lights and the room lights, and a socket, just above each table.
  const left = switchPlate(k, BW.g, 'bed_left', ['switch', 'switch', 'socket'], mats, [c.bed, c.room])
  left.position.set(0.86, 0.8, 0.0405)
  const right = switchPlate(k, BW.g, 'bed_right', ['switch', 'switch', 'socket'], mats, [c.bed, c.room])
  right.position.set(3.6, 0.8, 0.2205)
  // At the door, on the latch side, at 1.2 m: room, bedside and desk circuits.
  const door = switchPlate(k, g, 'entry', ['switch', 'switch', 'switch'], mats, [c.room, c.bed, c.desk])
  door.position.set(0.0005, 1.2, BEDROOM.w - 1.38)
  door.rotation.y = PI / 2
  // Over the desk on the side wall: the desk lamp and two sockets for chargers.
  const deskPlate = switchPlate(k, g, 'desk', ['switch', 'socket', 'socket'], mats, [c.desk])
  deskPlate.position.set(L - 0.32, 0.92, W - 0.0005)
  deskPlate.rotation.y = PI
  // Ceiling fan over the room, clear of the track and downlights; tap it to start or stop.
  ceilingFan(k, g, OFF + 2.2, H, 2.35, { body: m.fanBody, blade: m.walnut(0.6, 0.12), iron: m.black })
}

/** Glass pendants by the bed, and the room's lights: cove wash, fill, pendants and wardrobe glow. */
function lights(B: BC) {
  const { m, g, ctx } = B
  const { k } = ctx
  for (const x of [OFF + 0.82, OFF + 3.58]) {
    k.cyl(g, 0.004, 0.004, H - 1.47, m.black, x, (H + 1.47) / 2, 0.3, 6)
    k.cyl(g, 0.04, 0.04, 0.02, m.brass, x, 1.46, 0.3, 16)
    const shade = new Mesh(new CylinderGeometry(0.055, 0.055, 0.2, 28, 1, true), m.amber)
    shade.position.set(x, 1.35, 0.3)
    g.add(shade)
    k.sphere(g, 0.03, m.bulbBed, x, 1.33, 0.3)
  }
  const add = (x: number, h: number, z: number, intensity: number, distance: number, color = '#ffd6a8') => {
    const l = new PointLight(color, intensity, distance, 2)
    l.position.set(x, h, z)
    g.add(l)
    ctx.lighting.light(l, 1)
    return l
  }
  B.c.room.lights.push(add(OFF + 2.2, 2.55, 0.45, 4, 3.5), add(OFF + 2.6, 2.6, 2.0, 6, 6.5, '#fff0dc'), add(1.2, 2.6, 2.0, 3, 4.5, '#fff0dc'))
  B.c.bed.lights.push(add(OFF + 0.82, 1.3, 0.35, 1.2, 1.8), add(OFF + 3.58, 1.3, 0.35, 1.2, 1.8))
  add(L - 0.35, 1.6, 1.8, 1.6, 1.8)
  // Soft, cooler light from the window, filling the room's far side.
  add(L - 0.4, 1.8, 2.9, 2.2, 4, '#e6edf5')
}
