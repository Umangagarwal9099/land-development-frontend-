import { DoubleSide, FrontSide, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Path, PlaneGeometry, PointLight, Shape, ShapeGeometry, SphereGeometry, TorusGeometry, Vector2, type Material, type MeshStandardMaterialParameters, type Object3D } from 'three'
import type { Paint } from '../textures'
import { PI } from '../kit'
import { BEDROOM3, FFL, type Ctx } from './house'
import { cabinet, type Unit } from './cabinets'
import { drape, pillow } from './cloth'
import { stationery } from './desk'
import { ceilingFan, circuit, switchPlate, type Circuit } from './fixtures'
import { cloth, folded, hangGarment } from './garments'
import { abstractArt, upholstery } from './paints'

/*
 * Bedroom 3, the front first-floor room, from the client's presentation board (elevation, render and
 * material palette): a bed wall of walnut panels either side of a honed grey stone feature with a
 * lit shelf niche, a beige padded headboard, floating bedside tables under glass globe pendants, a
 * wardrobe of walnut lofts over fluted glass sliders on the right-hand wall, dark stone floor, a
 * grey rug, and a lit round ceiling recess with a fan.
 *
 * The plan puts the bed on the house's left wall, the wardrobe on the wall to its right and the
 * entrance further along that wall, as the board's render does. The attached bathroom's interior is
 * a later stage: only its doorway and door are here.
 *
 * Room frame: X along the bed wall from the façade (0) towards the back of the house, Z out from the
 * bed wall (0) to the bathroom's wall, h above the floor.
 */

const { l: L, w: W, door: DOOR, bathDoor: BATH, notch: NOTCH } = BEDROOM3
const H = 2.6
const WALL = { x0: 0.2, a: 0.85, b: 3.3, x1: 3.95 }
const BED = { x0: 1.175, x1: 2.975, z0: 0.12, z1: 2.17 }
const CX = (BED.x0 + BED.x1) / 2
const WR = { x0: L - 0.62, z1: 2.7, loft: 2.0 }
type R = [number, number]

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

const blot: Paint = (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  gr.addColorStop(0, 'rgba(255,255,255,0.85)')
  gr.addColorStop(0.6, 'rgba(255,255,255,0.4)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
}

/** The board's honed grey stone: soft cloud with pale veining. */
const greyStone = (seed: number): Paint => (g, w, h) => {
  g.fillStyle = '#74736f'
  g.fillRect(0, 0, w, h)
  let r = seed
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < 26; i++) {
    const x = rnd() * w
    const y = rnd() * h
    const R0 = (0.1 + rnd() * 0.3) * w
    const gr = g.createRadialGradient(x, y, 0, x, y, R0)
    const tone = rnd() > 0.5 ? '150,148,142' : '84,83,80'
    gr.addColorStop(0, `rgba(${tone},0.26)`)
    gr.addColorStop(1, `rgba(${tone},0)`)
    g.fillStyle = gr
    g.fillRect(0, 0, w, h)
  }
  g.lineCap = 'round'
  for (let i = 0; i < 7; i++) {
    g.strokeStyle = `rgba(205,202,195,${0.1 + rnd() * 0.22})`
    g.lineWidth = 0.6 + rnd() * 1.6
    let x = rnd() * w
    let y = 0
    g.beginPath()
    g.moveTo(x, y)
    while (y < h) {
      x += (rnd() - 0.42) * w * 0.09
      y += h * (0.04 + rnd() * 0.07)
      g.lineTo(x, y)
    }
    g.stroke()
  }
}

/** A slab of that stone, darkened for the floor, with its joint round the edge. */
const stoneTile: Paint = (g, w, h) => {
  greyStone(211)(g, w, h)
  g.fillStyle = 'rgba(34,34,36,0.62)'
  g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(16,16,17,0.9)'
  g.fillRect(0, 0, w, 2)
  g.fillRect(0, 0, 2, h)
}

/** Reeded glass: fine upright flutes, catching the light behind them. */
const reeded: Paint = (g, w, h) => {
  for (let x = 0; x < w; x += 8) {
    const gr = g.createLinearGradient(x, 0, x + 8, 0)
    gr.addColorStop(0, '#6e6459')
    gr.addColorStop(0.5, '#d2c7b8')
    gr.addColorStop(1, '#6e6459')
    g.fillStyle = gr
    g.fillRect(x, 0, 8, h)
  }
}

function materials(ctx: Ctx) {
  const { k, lighting, c } = ctx
  const glow = (color: string, intensity: number) => lighting.glow(std({ color: '#fff3df', emissive: color, emissiveIntensity: intensity, roughness: 0.5 }), 1)
  const fabric = (tone: number[], seed: number, repeat: number, sheen = 0.45, double = false) => {
    const paint = upholstery(tone, seed)
    const map = k.tex.painted(256, 256, paint)
    map.repeat.set(repeat, repeat)
    return new MeshPhysicalMaterial({ map, normalMap: k.tex.normalPainted(`bed3_fabric_${seed}`, 256, 256, paint, repeat, repeat), normalScale: new Vector2(0.3, 0.3), roughness: 0.95, sheen, sheenRoughness: 0.6, sheenColor: '#f3ece2', side: double ? DoubleSide : FrontSide })
  }
  const garment = (tone: string, kind: 'plain' | 'stripe' | 'twill' | 'herringbone', seed: number) => std({ map: k.tex.painted(128, 128, cloth(tone, kind, seed)), roughness: 0.95, side: DoubleSide })
  // The board's dark stone, in 900 mm slabs with fine joints.
  const floorMap = k.tex.painted(512, 512, stoneTile)
  floorMap.repeat.set(L / 0.9, W / 0.9)
  const floor = std({ map: floorMap, roughness: 0.34 })
  const rugMap = k.tex.painted(256, 256, upholstery([132, 130, 126], 379))
  rugMap.repeat.set(10, 8)
  const rug = std({ map: rugMap, roughness: 1 })
  // The board's walnut is browner and less red than the laminate's raw colour.
  const walnut = (w: number, h: number) => {
    const m = c.surface('walnut', w, h)
    m.color.set('#c4b9a8')
    return m
  }
  const flutes = k.tex.painted(256, 64, reeded)
  flutes.repeat.set(6, 1)
  return {
    floor, rug,
    walnut,
    walnutPlain: walnut(0.6, 0.6),
    stone: (seed: number) => std({ map: k.tex.painted(512, 512, greyStone(seed)), roughness: 0.42 }),
    paint: std({ color: '#efe9df', roughness: 0.92 }),
    satin: std({ color: '#b9b7b1', roughness: 0.42, metalness: 0.15 }),
    satinDark: std({ color: '#a3a19b', roughness: 0.45, metalness: 0.15 }),
    skirting: std({ color: '#e6dfd4', roughness: 0.6 }),
    white: std({ color: '#f1ece3', roughness: 0.5 }),
    interior: std({ color: '#d9cdbc', roughness: 0.7 }),
    dark: std({ color: '#2a2622', roughness: 0.8 }),
    black: std({ color: '#151516', roughness: 0.45, metalness: 0.4 }),
    brass: std({ color: '#b08d57', roughness: 0.3, metalness: 0.9 }),
    fluted: new MeshPhysicalMaterial({ map: flutes, color: '#e9dfcf', roughness: 0.22, metalness: 0.05, transparent: true, opacity: 0.46, depthWrite: false, side: DoubleSide }),
    headboard: fabric([214, 202, 184], 371, 6),
    welt: std({ color: '#a99d8d', roughness: 0.9 }),
    mattress: fabric([238, 235, 228], 372, 8, 0.3),
    duvet: fabric([214, 150, 128], 373, 1, 0.55, true),
    sheet: fabric([240, 236, 228], 374, 1, 0.35, true),
    throwWool: fabric([222, 208, 186], 375, 1, 0.4, true),
    pillowWhite: fabric([242, 239, 232], 376, 3, 0.35),
    pillowCoral: fabric([206, 130, 110], 377, 3),
    pillowSand: fabric([206, 192, 172], 378, 3),
    curtain: std({ color: '#c6b9a5', roughness: 0.95, side: DoubleSide }),
    art: std({ map: k.tex.painted(256, 340, abstractArt), roughness: 0.9 }),
    ceiling: new MeshStandardMaterial({ color: '#f4f0e8', roughness: 0.95, side: DoubleSide, emissive: '#c9c0b2', emissiveIntensity: 0.4 }),
    globe: lighting.glow(new MeshPhysicalMaterial({ color: '#fff4e0', roughness: 0.15, emissive: '#ffd9a8', emissiveIntensity: 1.7 }), 0.4),
    spot: glow('#fff0dc', 2.6),
    cove: glow('#ffc98a', 2.4),
    niche: glow('#ffc98a', 2.2),
    wardrobeLed: glow('#ffd6a0', 2.2),
    locator: glow('#ff9a3a', 1.4),
    plate: std({ color: '#d4cdc1', roughness: 0.45 }),
    rocker: std({ color: '#ece8e1', roughness: 0.35 }),
    fan: std({ color: '#f0ebe2', roughness: 0.5 }),
    contact: new MeshBasicMaterial({ map: k.tex.painted(128, 128, blot), color: '#000000', transparent: true, depthWrite: false }),
    book: [std({ color: '#3d4a52', roughness: 0.7 }), std({ color: '#c9bba3', roughness: 0.7 }), std({ color: '#7a5a45', roughness: 0.7 }), std({ color: '#e5ddcf', roughness: 0.7 })],
    ceramic: new MeshPhysicalMaterial({ color: '#f1ede6', roughness: 0.3, clearcoat: 0.6 }),
    stoneware: std({ color: '#8f8a83', roughness: 0.6 }),
    pampas: std({ color: '#d8c6a4', roughness: 1 }),
    stem: std({ color: '#a8916b', roughness: 0.9 }),
    shirtWhite: garment('#eeebe6', 'plain', 21),
    shirtBlue: garment('#a9bccf', 'plain', 22),
    shirtStripe: garment('#e9edf2', 'stripe', 23),
    jacket: garment('#44464a', 'herringbone', 24),
    blazer: garment('#6b5a4c', 'twill', 25),
    trousers: garment('#c3b293', 'twill', 26),
    trousersGrey: garment('#7d7f82', 'twill', 27),
    dress: garment('#b08a78', 'plain', 28),
    hanger: std({ color: '#7a5236', roughness: 0.5 }),
    rail: std({ color: '#c7cbd0', roughness: 0.25, metalness: 0.9 }),
  }
}

type M = ReturnType<typeof materials>
type Circuits = { room: Circuit; bed: Circuit; wardrobe: Circuit }
type C = { ctx: Ctx; m: M; g: Group; c: Circuits; bx: (x: R, h: R, z: R, mat: Material, cast?: boolean, p?: Object3D) => Mesh }

export function buildBedroom3(ctx: Ctx) {
  const { k } = ctx
  const g = new Group()
  g.name = 'bedroom_3'
  // Local X runs along the bed wall towards the back of the house (house −z), local Z out of it (+x).
  g.position.set(BEDROOM3.x0, FFL, BEDROOM3.z1)
  g.rotation.y = PI / 2
  k.root.add(g)
  const m = materials(ctx)
  const bx = ([x0, x1]: R, [h0, h1]: R, [z0, z1]: R, mat: Material, cast = true, p: Object3D = g) =>
    k.box(p, x1 - x0, h1 - h0, z1 - z0, mat, (x0 + x1) / 2, (h0 + h1) / 2, (z0 + z1) / 2, cast)
  const c: Circuits = { room: circuit(), bed: circuit(), wardrobe: circuit() }
  c.room.glows.push(m.spot, m.cove, m.niche)
  c.bed.glows.push(m.globe)
  c.wardrobe.glows.push(m.wardrobeLed)
  const B: C = { ctx, m, g, c, bx }
  shell(B)
  bedWall(B)
  bed(B)
  bedsides(B)
  pendants(B)
  wardrobe(B)
  drapes(B)
  fittings(B)
  lights(B)
}

function contact({ g, m }: C, x: number, z: number, w: number, d: number, opacity: number) {
  const mat = m.contact.clone()
  mat.opacity = opacity
  const s = new Mesh(new PlaneGeometry(w, d), mat)
  s.rotation.x = -PI / 2
  s.position.set(x, 0.024, z)
  s.renderOrder = 1
  g.add(s)
}

/** Stone floor, the walls' skirting, the door and bathroom doorway, the ceiling with its lit round recess. */
function shell(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  bx([0, L], [0, 0.012], [0, NOTCH.z], m.floor, false)
  bx([0, NOTCH.x], [0, 0.012], [NOTCH.z, W], m.floor, false)
  // The wall to the bathroom side above the floor line, the back wall and the skirting.
  bx([0.02, BATH[0]], [0, 0.08], [W - 0.012, W], m.skirting, false)
  bx([BATH[1], NOTCH.x], [0, 0.08], [W - 0.012, W], m.skirting, false)
  bx([L - 0.012, L], [0, 0.08], [WR.z1, DOOR[0] - 0.065], m.skirting, false)
  bx([NOTCH.x, L], [0, 0.08], [NOTCH.z - 0.012, NOTCH.z], m.skirting, false)

  // The entrance: a walnut door on the back wall, swinging into the room against the short return.
  const dw = DOOR[1] - DOOR[0] - 0.008
  const door = new Group()
  door.name = 'door_bed3_entry'
  door.position.set(L + 0.04, 0, DOOR[1] - 0.004)
  door.userData.openAngle = 1.5
  g.add(door)
  bx([0, 0.04], [0.006, 2.094], [-dw, 0], m.walnut(0.9, 2.1), true, door).userData.front = true
  for (const [rx, lx] of [[-0.006, -0.016], [0.046, 0.056]] as const) {
    k.cyl(door, 0.026, 0.026, 0.012, m.black, rx, 1.0, -dw + 0.065, 20).rotation.z = PI / 2
    bx([lx - 0.008, lx + 0.008], [0.992, 1.008], [-dw + 0.06, -dw + 0.19], m.black, true, door)
  }
  for (const x of [[L - 0.014, L], [L + 0.12, L + 0.134]] as R[]) {
    bx(x, [0, 2.17], [DOOR[0] - 0.065, DOOR[0]], m.skirting)
    bx(x, [0, 2.17], [DOOR[1], DOOR[1] + 0.05], m.skirting)
    bx(x, [2.1, 2.17], DOOR, m.skirting)
  }

  // The attached bathroom's doorway and door, opening away from the bedroom. Nothing beyond it yet.
  const bw = BATH[1] - BATH[0] - 0.008
  const bathDoor = new Group()
  bathDoor.name = 'door_bed3_bath'
  bathDoor.position.set(BATH[0] + 0.004, 0, W + 0.04)
  bathDoor.userData.openAngle = -1.5
  g.add(bathDoor)
  bx([0, bw], [0.006, 2.094], [0, 0.04], m.white, true, bathDoor).userData.front = true
  for (const [rz, lz] of [[-0.006, -0.016], [0.046, 0.056]] as const) {
    k.cyl(bathDoor, 0.026, 0.026, 0.012, m.black, bw - 0.065, 1.0, rz, 20).rotation.x = PI / 2
    bx([bw - 0.19, bw - 0.06], [0.992, 1.008], [lz - 0.008, lz + 0.008], m.black, true, bathDoor)
  }
  bx([BATH[0] - 0.065, BATH[0]], [0, 2.17], [W - 0.014, W], m.skirting)
  bx([BATH[1], BATH[1] + 0.065], [0, 2.17], [W - 0.014, W], m.skirting)
  bx(BATH, [2.1, 2.17], [W - 0.014, W], m.skirting)

  // Ceiling: a flat plane with the round recess cut out, lit from a concealed ring.
  const R0 = 0.95
  const rc = { x: CX, z: 2.9 }
  const s = new Shape()
  s.moveTo(0, 0)
  s.lineTo(L, 0)
  s.lineTo(L, W)
  s.lineTo(0, W)
  s.closePath()
  const hole = new Path()
  hole.absarc(rc.x, rc.z, R0, 0, PI * 2, true)
  s.holes.push(hole)
  const ceiling = new Mesh(new ShapeGeometry(s, 48), m.ceiling)
  ceiling.rotation.x = PI / 2
  ceiling.position.y = H
  ceiling.receiveShadow = true
  g.add(ceiling)
  const top = new Mesh(new PlaneGeometry(2.2, 2.2), m.ceiling)
  top.rotation.x = PI / 2
  top.position.set(rc.x, H + 0.03, rc.z)
  g.add(top)
  const ring = new Mesh(new TorusGeometry(R0 - 0.005, 0.012, 8, 96), m.cove)
  ring.rotation.x = PI / 2
  ring.position.set(rc.x, H + 0.012, rc.z)
  g.add(ring)
  ceilingFan(k, g, rc.x, H + 0.03, rc.z, { body: m.fan, blade: m.fan, iron: m.satin })
  // The black linear track across the ceiling, and downlights round the room.
  bx([0.5, WR.x0 - 0.2], [H - 0.03, H], [3.92, 3.96], m.black, false)
  for (const x of [0.9, 1.7, 2.5]) {
    k.cyl(g, 0.025, 0.025, 0.09, m.black, x, H - 0.075, 3.94, 14)
    k.cyl(g, 0.018, 0.018, 0.004, m.spot, x, H - 0.122, 3.94, 12).castShadow = false
  }
  for (const [x, z] of [[0.6, 1.4], [3.4, 2.95], [0.5, 2.9], [1.2, 0.5]]) k.cyl(g, 0.045, 0.045, 0.01, m.spot, x, H - 0.004, z, 16).castShadow = false

  bx([CX - 1.75, CX + 1.65], [0.012, 0.03], [1.25, 3.75], m.rug, false)
}

/** The board's elevation: walnut each side of the stone, a lit niche of shelves, a cove along the top. */
function bedWall(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const lower = 1.2
  const top = 1.62
  bx([WALL.x0, WALL.a], [0, H], [0, 0.03], m.walnut(0.65, H))
  bx([WALL.b, WALL.x1], [0, H], [0, 0.03], m.walnut(0.65, H))
  for (const x of [WALL.x0 + 0.33, WALL.b + 0.33]) bx([x - 0.002, x + 0.002], [0, H - 0.1], [0.03, 0.032], m.dark, false)
  // Honed stone below and above the niche, in book-matched slabs, set a little proud.
  const slabs = [0, 1, 2]
  slabs.forEach((i) => {
    const w = (WALL.b - WALL.a) / 3
    const mat = m.stone(101 + i * 37)
    bx([WALL.a + i * w + 0.002, WALL.a + (i + 1) * w - 0.002], [top, H - 0.1], [0, 0.04], mat)
    bx([WALL.a + i * w + 0.002, WALL.a + (i + 1) * w - 0.002], [0, lower], [0, 0.04], mat)
  })
  // The niche: walnut-lined, three bays, LED under its head, books and a few objects.
  const NX: R = [WALL.a, WALL.b]
  bx(NX, [lower, top], [0, 0.012], m.walnut(2.45, 0.4))
  bx(NX, [lower - 0.02, lower], [0, 0.26], m.walnut(2.45, 0.26))
  bx(NX, [top, top + 0.025], [0, 0.26], m.walnut(2.45, 0.26))
  for (const x of [WALL.a + 0.62, WALL.b - 0.62]) bx([x - 0.012, x + 0.012], [lower, top], [0.012, 0.25], m.walnutPlain)
  bx([NX[0] + 0.02, NX[1] - 0.02], [top - 0.008, top], [0.2, 0.22], m.niche, false)
  const row = (x0: number, n: number) => {
    for (let i = 0; i < n; i++) k.box(g, 0.028 + (i % 3) * 0.008, 0.2 + (i % 3) * 0.035, 0.15, m.book[i % 4], x0 + i * 0.04, lower + 0.1 + (i % 3) * 0.018, 0.12)
  }
  row(WALL.a + 0.1, 9)
  row(WALL.b - 0.5, 9)
  // A small framed print and a pair of vessels in the middle bay.
  bx([CX - 0.42, CX - 0.16], [lower, lower + 0.3], [0.05, 0.065], m.brass)
  bx([CX - 0.4, CX - 0.18], [lower + 0.02, lower + 0.28], [0.065, 0.068], m.art, false)
  k.cyl(g, 0.05, 0.075, 0.13, m.ceramic, CX + 0.06, lower + 0.065, 0.14, 24)
  k.cyl(g, 0.04, 0.05, 0.09, m.stoneware, CX + 0.24, lower + 0.045, 0.14, 24)
  k.cyl(g, 0.07, 0.04, 0.05, m.stoneware, CX + 0.42, lower + 0.025, 0.14, 24)
  // The cove: a shallow bulkhead along the whole wall, a warm line of light washing down it.
  bx([0, WR.x0 - 0.002], [H - 0.1, H], [0, 0.16], m.paint, false)
  bx([WALL.x0, WALL.x1], [H - 0.105, H - 0.098], [0.1, 0.13], m.cove, false)
  // A framed print on the walnut, as the render has beside the bed.
  bx([WALL.b + 0.14, WALL.b + 0.5], [1.5, 1.98], [0.03, 0.05], m.black)
  bx([WALL.b + 0.16, WALL.b + 0.48], [1.52, 1.96], [0.05, 0.052], m.art, false)
}

/** The bed: padded beige headboard in two panels, base, mattress, coral duvet, wool throw and pillows. */
function bed(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const bw = BED.x1 - BED.x0
  const soft = (geo: ConstructorParameters<typeof Mesh>[0], mat: Material, x: number, y: number, z: number) => {
    const mesh = new Mesh(geo, mat)
    mesh.position.set(x, y, z)
    mesh.castShadow = mesh.receiveShadow = true
    g.add(mesh)
    return mesh
  }
  for (const s of [-1, 1]) {
    k.soft(g, bw / 2 + 0.09, 0.84, 0.09, 0.035, m.headboard, CX + (s * (bw / 2 + 0.09)) / 2, 0.68, 0.09)
    k.soft(g, 0.06, 0.84, 0.09, 0.03, m.welt, CX + s * (bw / 2 + 0.11), 0.68, 0.08)
  }
  bx([BED.x0 + 0.05, BED.x1 - 0.05], [0, 0.08], [BED.z0 + 0.06, BED.z1 - 0.06], m.dark, false)
  k.soft(g, bw + 0.04, 0.28, BED.z1 - BED.z0, 0.03, m.headboard, CX, 0.22, (BED.z0 + BED.z1) / 2)
  k.soft(g, bw - 0.04, 0.24, BED.z1 - BED.z0 - 0.04, 0.06, m.mattress, CX, 0.47, (BED.z0 + BED.z1) / 2)
  const top = 0.59
  soft(drape({ hw: bw / 2 - 0.02, len: 1.5, drop: 0.3, edge: 0.07, puff: 0.06, crease: 1.2, seed: 61 }), m.duvet, CX, top, 0.72)
  soft(drape({ hw: bw / 2 - 0.01, len: 0.26, drop: 0.28, edge: 0.07, puff: 0.03, crease: 0.7, foot: false, seed: 62, segments: [72, 12] }), m.sheet, CX, top + 0.05, 0.54)
  // The wool throw across the foot, a little off square, its ends falling over the sides.
  const t = soft(drape({ hw: bw / 2 + 0.03, len: 0.74, drop: 0.46, edge: 0.05, puff: 0.012, crease: 0.9, seed: 63, segments: [72, 34] }), m.throwWool, CX + 0.06, top + 0.078, 1.32)
  t.rotation.y = 0.07
  const P = (w: number, h: number, th: number, seed: number, mat: Material, x: number, y: number, z: number, tilt: number, yaw = 0) => {
    soft(pillow(w, h, th, seed), mat, x, y, z).rotation.set(-tilt, yaw, ((seed % 3) - 1) * 0.02)
  }
  P(0.76, 0.5, 0.18, 64, m.pillowWhite, CX - 0.42, top + 0.26, 0.28, 0.34, 0.03)
  P(0.76, 0.5, 0.17, 65, m.pillowWhite, CX + 0.42, top + 0.255, 0.29, 0.36, -0.02)
  P(0.56, 0.42, 0.16, 66, m.pillowCoral, CX - 0.4, top + 0.21, 0.44, 0.3, 0.05)
  P(0.56, 0.42, 0.16, 67, m.pillowCoral, CX + 0.41, top + 0.205, 0.45, 0.32, -0.05)
  P(0.44, 0.34, 0.13, 68, m.pillowSand, CX, top + 0.17, 0.58, 0.28, 0.02)
  contact(B, CX, 1.15, 2.5, 2.7, 0.5)
}

/** Floating bedside tables with a drawer each, off the walnut: a mug and books on one, pampas on the other. */
function bedsides(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const tables: R[] = [[0.5, 1.08], [3.08, 3.66]]
  tables.forEach(([x0, x1], i) => {
    const f = new Group()
    f.position.set(x0, 0.42, 0.45)
    g.add(f)
    const u: Unit = { kind: 'drawers', id: `bed3_table_${i}`, rows: [], fill: [stationery(k, i + 1)] }
    cabinet(k, f, x1 - x0, 0.16, 0.42, u, { front: m.satinDark, interior: m.interior, drawer: m.walnutPlain })
    bx([x0 - 0.005, x1 + 0.005], [0.58, 0.6], [0.03, 0.46], m.white)
    for (const o of f.children.filter((c) => c.name.startsWith('drawer_'))) ctx.k.box(o, x1 - x0 - 0.4, 0.01, 0.012, m.brass, (x1 - x0) / 2, 0.08, 0.006)
    contact(B, (x0 + x1) / 2, 0.28, 0.75, 0.6, 0.22)
  })
  for (let i = 0; i < 3; i++) bx([0.6 + i * 0.01, 0.84 - i * 0.012], [0.6 + i * 0.026, 0.626 + i * 0.026], [0.14 + i * 0.01, 0.32 - i * 0.008], m.book[i])
  k.cyl(g, 0.038, 0.034, 0.09, m.ceramic, 0.96, 0.645, 0.28, 20)
  k.cyl(g, 0.055, 0.075, 0.2, m.ceramic, 3.32, 0.7, 0.24, 24)
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4
    const lean = 0.1 + (i % 3) * 0.1
    const len = 0.34 + (i % 4) * 0.05
    const stem = new Group()
    stem.position.set(3.32, 0.8, 0.24)
    stem.rotation.set(Math.cos(a) * lean, 0, Math.sin(a) * lean)
    g.add(stem)
    k.cyl(stem, 0.0025, 0.0025, len, m.stem, 0, len / 2, 0, 5)
    k.blob(stem, 0.02, m.pampas, 0, len + 0.05, 0, 3).castShadow = false
  }
}

/** Glass globes on fine black cords, two each side of the bed at staggered heights, as the board draws them. */
function pendants({ m, g, ctx }: C) {
  const { k } = ctx
  for (const [x, h, z] of [[0.62, 1.15, 0.26], [0.92, 1.42, 0.3], [3.22, 1.42, 0.3], [3.52, 1.15, 0.26]]) {
    k.cyl(g, 0.003, 0.003, H - 0.1 - h - 0.07, m.black, x, (H - 0.1 + h + 0.07) / 2, z, 6)
    k.cyl(g, 0.012, 0.012, 0.03, m.brass, x, h + 0.075, z, 12)
    const globe = new Mesh(new SphereGeometry(0.075, 28, 20), m.globe)
    globe.position.set(x, h, z)
    g.add(globe)
  }
}

/** The wardrobe: grey satin frame, walnut lofts on hinges, two fluted glass sliders with brass pulls. */
function wardrobe(B: C) {
  const { bx, m, ctx, g } = B
  const { k } = ctx
  const X: R = [WR.x0, L]
  const Z0 = 0.03
  const Z = WR.z1
  const { loft: LOFT } = WR
  const wear = { wood: m.hanger, steel: m.rail }
  bx([L - 0.02, L], [0, H], [Z0, Z], m.walnut(Z, H))
  bx(X, [0, 0.08], [Z0, Z], m.dark, false)
  bx(X, [LOFT - 0.02, LOFT], [Z0, Z], m.satin)
  bx(X, [H - 0.02, H], [Z0, Z], m.satin)
  bx(X, [0, H], [Z, Z + 0.03], m.satin)
  bx(X, [0, H], [Z0 - 0.02, Z0], m.satin)
  const N = 4
  const LW = (Z - Z0) / N
  for (let i = 0; i < N; i++) {
    const left = i % 2 === 0
    const pivot = new Group()
    pivot.name = `door_bed3_loft_${i + 1}`
    pivot.position.set(X[0], 0, Z0 + (left ? i * LW + 0.002 : (i + 1) * LW - 0.002))
    pivot.userData.openAngle = left ? -1.45 : 1.45
    g.add(pivot)
    bx([-0.02, 0], [LOFT + 0.004, H - 0.024], left ? [0, LW - 0.006] : [-(LW - 0.006), 0], m.walnut(LW, 0.6), true, pivot).userData.front = true
  }
  for (let i = 0; i < 3; i++) folded(k, g, L - 0.3, LOFT, Z0 + 0.45 + i * 0.8, 0.42, 0.5, 0.16, m.jacket, (i - 1) * 0.04)

  const mid = (Z0 + Z) / 2
  bx([X[0] + 0.07, L - 0.02], [0.08, LOFT - 0.02], [mid - 0.009, mid + 0.009], m.satin)
  // Hanging behind the near slider, over shoes.
  const hang = (r: R, y: number, items: [Parameters<typeof hangGarment>[2], Material][], seed: number) => {
    const rail = k.cyl(g, 0.011, 0.011, r[1] - r[0] - 0.05, m.rail, L - 0.3, y, (r[0] + r[1]) / 2, 14)
    rail.rotation.x = PI / 2
    items.forEach(([kind, mat], i) => hangGarment(k, g, kind, mat, { x: L - 0.3, y, z: r[0] + 0.1 + (i * (r[1] - r[0] - 0.2)) / Math.max(1, items.length - 1) }, seed + i, wear))
  }
  const a: R = [Z0 + 0.01, mid - 0.01]
  const b: R = [mid + 0.01, Z - 0.01]
  hang(a, 1.82, [['shirt', m.shirtWhite], ['shirt', m.shirtStripe], ['jacket', m.blazer], ['dress', m.dress], ['jacket', m.jacket], ['shirt', m.shirtBlue]], 91)
  for (let i = 0; i < 3; i++) bx([L - 0.5, L - 0.12], [0.08, 0.2], [a[0] + 0.05 + i * 0.4, a[0] + 0.41 + i * 0.4], m.satinDark)
  // Behind the far slider: drawers, a shelf of folded clothes, a short rail above, as the render shows.
  const f = new Group()
  f.position.set(X[0] + 0.07, 0.08, b[0] + 0.01)
  f.rotation.y = -PI / 2
  g.add(f)
  const knits = [m.shirtWhite, m.trousersGrey, m.blazer, m.trousers, m.shirtBlue] as MeshStandardMaterial[]
  cabinet(k, f, b[1] - b[0] - 0.02, 0.72, 0.5, { kind: 'drawers', id: 'bed3_wardrobe_chest', rows: [0.24, 0.48], fill: [
    (p, q) => { for (let i = 0; i < 3; i++) folded(k, p, q.x0 + 0.18 + i * 0.36, q.floors[0], (q.z0 + q.z1) / 2, 0.3, 0.3, 0.08, knits[i]) },
    (p, q) => { for (let i = 0; i < 3; i++) folded(k, p, q.x0 + 0.18 + i * 0.36, q.floors[0], (q.z0 + q.z1) / 2, 0.3, 0.3, 0.08, knits[i + 2]) },
    stationery(k, 2),
  ] }, { front: m.walnut(1.2, 0.3), interior: m.interior, drawer: m.walnutPlain })
  bx([X[0] + 0.07, L - 0.02], [1.1, 1.122], b, m.walnutPlain)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) folded(k, g, L - 0.3, 0.8 + j * 0.06, b[0] + 0.2 + i * 0.4, 0.32, 0.26, 0.06, knits[(i + j) % 5], (j - 1) * 0.02)
  hang(b, 1.86, [['shirt', m.shirtBlue], ['shirt', m.shirtWhite], ['trousers', m.trousers], ['trousers', m.trousersGrey]], 101)
  for (const r of [a, b]) bx([X[0] + 0.06, L - 0.04], [LOFT - 0.05, LOFT - 0.04], [r[0] + 0.03, r[1] - 0.03], m.wardrobeLed, false)
  bx([X[0] - 0.06, X[0]], [LOFT - 0.045, LOFT - 0.01], [Z0, Z], m.satin)
  bx([X[0] - 0.06, X[0]], [0.08, 0.095], [Z0, Z], m.satin)
  // Two sliders on their own tracks; each runs over the other's half.
  const P = (Z - Z0) / 2
  ;[1, -1].forEach((dir, i) => {
    const face = i ? X[0] - 0.045 : X[0] - 0.02
    const zs: R = i ? [mid - 0.015, Z] : [Z0, mid + 0.015]
    const panel = new Group()
    panel.name = `drawer_bed3_wardrobe_${i + 1}`
    panel.userData.slide = [0, 0, dir * (P - 0.05)]
    g.add(panel)
    bx([face + 0.006, face + 0.012], [0.12, LOFT - 0.07], [zs[0] + 0.02, zs[1] - 0.02], m.fluted, false, panel).userData.front = true
    for (const z of [zs[0] + 0.012, zs[1] - 0.012]) bx([face, face + 0.022], [0.1, LOFT - 0.05], [z - 0.012, z + 0.012], m.satin, true, panel)
    for (const h of [0.112, LOFT - 0.062]) bx([face, face + 0.022], [h - 0.012, h + 0.012], zs, m.satin, true, panel)
    const pull = i ? zs[0] + 0.06 : zs[1] - 0.06
    bx([face - 0.012, face], [0.75, 1.4], [pull - 0.008, pull + 0.008], m.brass, true, panel)
  })
  contact(B, X[0] - 0.05, Z / 2, 0.5, Z + 0.1, 0.32)
}

/** One taupe curtain on a single rod, parted either side of the tall window and clear of the balcony door. */
function drapes({ m, g, ctx }: C) {
  const { k } = ctx
  const pleats = ([a0, a1]: R) => {
    const w = a1 - a0
    const h = H - 0.14
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
    s.position.set(0.2, h / 2 + 0.02, (a0 + a1) / 2)
    s.castShadow = true
    g.add(s)
  }
  BEDROOM3.curtain.forEach(pleats)
  const [first, last] = [BEDROOM3.curtain[0][0], BEDROOM3.curtain[1][1]]
  k.cyl(g, 0.012, 0.012, last - first, m.black, 0.2, H - 0.09, (first + last) / 2, 10).rotation.x = PI / 2
}

/** Switches: by the door, each side of the bed on the walnut, and by the wardrobe. */
function fittings({ m, g, ctx, c }: C) {
  const { k } = ctx
  const mats = { plate: m.plate, rocker: m.rocker, dark: m.dark, locator: m.locator }
  const entry = switchPlate(k, g, 'bed3_entry', ['switch', 'switch', 'switch'], mats, [c.room, c.bed, c.wardrobe])
  entry.position.set(L - 0.0005, 1.2, DOOR[0] - 0.24)
  entry.rotation.y = -PI / 2
  for (const [name, x] of [['bed3_left', 0.72], ['bed3_right', 3.5]] as const) switchPlate(k, g, name, ['switch', 'switch', 'socket'], mats, [c.bed, c.room]).position.set(x, 0.86, 0.0305)
}

function lights({ g, ctx, c }: C) {
  const add = (x: number, h: number, z: number, intensity: number, distance: number, color = '#fff0dc') => {
    const l = new PointLight(color, intensity, distance, 2)
    l.position.set(x, h, z)
    g.add(l)
    ctx.lighting.light(l, 1)
    return l
  }
  c.room.lights.push(add(CX, 2.4, 2.9, 8, 7), add(0.9, 2.3, 3.6, 3, 4.5), add(CX, 2.35, 0.25, 3.4, 3.6, '#ffc98a'), add(3.3, 2.35, 3.2, 3, 4))
  c.bed.lights.push(add(0.78, 1.25, 0.4, 2, 2.6, '#ffd6a8'), add(3.38, 1.25, 0.4, 2, 2.6, '#ffd6a8'))
  c.wardrobe.lights.push(add(L - 0.8, 1.7, WR.z1 / 2, 2, 2.6, '#ffd6a0'))
}
