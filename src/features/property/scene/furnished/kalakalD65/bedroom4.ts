import { CatmullRomCurve3, DoubleSide, FrontSide, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, PointLight, Shape, ShapeGeometry, TubeGeometry, Vector2, Vector3, type Material, type MeshStandardMaterialParameters, type Object3D } from 'three'
import type { Paint } from '../textures'
import { PI } from '../kit'
import { BEDROOM4, FFL, type Ctx } from './house'
import { cabinet, type Bay } from './cabinets'
import { drape, pillow } from './cloth'
import { stationery } from './desk'
import { ceilingFan, circuit, switchPlate, type Circuit } from './fixtures'
import { cloth, folded, hangGarment } from './garments'
import { upholstery } from './paints'
import { fiddleLeafFig } from './plant'

/*
 * Bedroom 4, the first-floor rear room beside Bedroom 2, from the client's Driftwood board (render and
 * dimensioned elevation): a bed wall with an arched wallpaper panel of sweeping gold and bronze
 * blades between two arched POP mouldings, a walnut bed with a padded "gaddi" headboard, floating
 * walnut bedside drawers with copper patti inlays, a white fluted wardrobe with long brass pulls on
 * the side wall, full grey curtains at the window, a lit cove ceiling with a fan, a white marble
 * floor and a white rug with a grid of dark squares.
 *
 * The elevation's 12′-6″ is laid out on the room's 3.55 m. Mirrored as the plans are, so the window
 * falls on the house's outer wall and the wardrobe on the wall shared with Bedroom 2.
 *
 * Room frame (the board's, looking at the bed wall): X from the wardrobe wall (0) to the window
 * wall, Z from the bed wall (0) to the door wall, h above the floor.
 */

const { w: W, d: D, door: DOOR, window: WIN } = BEDROOM4
const H = 2.62
const WR = { x1: 0.6, z0: 0.02, z1: 2.42, loft: 2.12 }
const PANEL = { a: [0.68, 1.22] as [number, number], wall: [1.22, 2.84] as [number, number], b: [2.84, 3.45] as [number, number] }
const BED = { x0: 1.2, x1: 2.86, z0: 0.1, z1: 2.18 }
const CX = (BED.x0 + BED.x1) / 2
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

/** The board's wallpaper: tall sweeping blades in bronze, gold and grey on warm white. */
const blades: Paint = (g, w, h) => {
  g.fillStyle = '#f3efe8'
  g.fillRect(0, 0, w, h)
  let r = 33
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647
  const blade = (x0: number, x1: number, bend: number, width: number, fill: string, edge: string) => {
    g.beginPath()
    g.moveTo(x0 * w, h)
    g.bezierCurveTo((x0 + bend) * w, h * 0.62, (x1 - bend * 0.4) * w, h * 0.32, x1 * w, 0)
    g.bezierCurveTo((x1 - bend * 0.4 + width) * w, h * 0.32, (x0 + bend + width) * w, h * 0.62, (x0 + width * 1.6) * w, h)
    g.closePath()
    g.fillStyle = fill
    g.fill()
    g.strokeStyle = edge
    g.lineWidth = 2
    g.stroke()
  }
  // Soft grey sweeps behind, the strong bronze and gold blades over them.
  // Broad pale grey leaves behind, the bronze and gold blades sweeping through them.
  for (let i = 0; i < 7; i++) blade(0.02 + rnd() * 0.8, 0.02 + rnd() * 0.85, (rnd() - 0.5) * 0.35, 0.07 + rnd() * 0.07, 'rgba(206,202,196,0.5)', 'rgba(176,170,162,0.6)')
  blade(0.12, 0.04, 0.2, 0.045, '#6f4a2c', '#5c3d25')
  blade(0.32, 0.5, -0.12, 0.022, '#b98a3e', '#a8782e')
  blade(0.58, 0.36, 0.16, 0.05, '#7b5634', '#664527')
  blade(0.76, 0.88, -0.08, 0.02, '#c79b4b', '#b48537')
  blade(0.48, 0.7, 0.06, 0.016, '#d2ab5c', '#c09544')
  blade(0.9, 0.97, -0.14, 0.035, '#8a6440', '#76522f')
}

/** White wool rug with the board's grid of small dark squares. */
const gridRug: Paint = (g, w, h) => {
  g.fillStyle = '#f2efe9'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#e5e1d9'
  g.fillRect(0, 0, w, h * 0.04)
  g.fillRect(0, h * 0.96, w, h * 0.04)
  g.fillRect(0, 0, w * 0.04, h)
  g.fillRect(w * 0.96, 0, w * 0.04, h)
  g.fillStyle = '#2b2623'
  const nx = 12
  const ny = 9
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      if ((i + j) % 2) continue
      const x = (w * (i + 0.5)) / nx
      const y = (h * (j + 0.5)) / ny
      g.fillRect(x - w * 0.012, y - h * 0.016, w * 0.024, h * 0.032)
    }
}

/** A rounded-top panel outline, `w` wide and `h` tall from its foot. */
function arch(w: number, h: number, r: number) {
  const s = new Shape()
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(w / 2, h - r)
  s.quadraticCurveTo(w / 2, h, w / 2 - r, h)
  s.lineTo(-w / 2 + r, h)
  s.quadraticCurveTo(-w / 2, h, -w / 2, h - r)
  s.closePath()
  return s
}

/** The same outline as a path of points, for a moulding to run round. */
function archPath(w: number, h: number, r: number, x: number, z: number) {
  const pts: Vector3[] = []
  pts.push(new Vector3(x - w / 2, 0.1, z), new Vector3(x - w / 2, h - r, z))
  for (let i = 1; i < 8; i++) {
    const t = i / 8
    pts.push(new Vector3(x - w / 2 + r - r * Math.cos((t * PI) / 2), h - r + r * Math.sin((t * PI) / 2), z))
  }
  pts.push(new Vector3(x + w / 2 - r, h, z))
  for (let i = 1; i < 8; i++) {
    const t = i / 8
    pts.push(new Vector3(x + w / 2 - r + r * Math.sin((t * PI) / 2), h - r + r * Math.cos((t * PI) / 2), z))
  }
  pts.push(new Vector3(x + w / 2, h - r, z), new Vector3(x + w / 2, 0.1, z))
  return new CatmullRomCurve3(pts, false, 'catmullrom', 0.02)
}

function materials(ctx: Ctx) {
  const { k, lighting, c } = ctx
  const glow = (color: string, intensity: number) => lighting.glow(std({ color: '#fff3df', emissive: color, emissiveIntensity: intensity, roughness: 0.5 }), 1)
  const fabric = (tone: number[], seed: number, repeat: number, sheen = 0.45, double = false) => {
    const paint = upholstery(tone, seed)
    const map = k.tex.painted(256, 256, paint)
    map.repeat.set(repeat, repeat)
    return new MeshPhysicalMaterial({ map, normalMap: k.tex.normalPainted(`bed4_fabric_${seed}`, 256, 256, paint, repeat, repeat), normalScale: new Vector2(0.3, 0.3), roughness: 0.95, sheen, sheenRoughness: 0.6, sheenColor: '#f3ece2', side: double ? DoubleSide : FrontSide })
  }
  const garment = (tone: string, kind: 'plain' | 'stripe' | 'twill' | 'herringbone', seed: number) => std({ map: k.tex.painted(128, 128, cloth(tone, kind, seed)), roughness: 0.95, side: DoubleSide })
  const floor = c.surface('marbleWhite', W, D)
  floor.color.set('#f1eee9')
  floor.roughness = 0.25
  const walnut = (w: number, h: number) => {
    const m = c.surface('walnut', w, h)
    m.color.set('#e2c7a8')
    return m
  }
  // White lacquered fluting, as the board's wardrobe: shading in the paint, every flute catching light.
  const flutes = k.tex.painted(128, 64, (g2, w2, h2) => {
    for (let x = 0; x < w2; x += 16) {
      const gr = g2.createLinearGradient(x, 0, x + 16, 0)
      gr.addColorStop(0, '#d9d4cc')
      gr.addColorStop(0.35, '#f7f5f1')
      gr.addColorStop(0.7, '#efebe5')
      gr.addColorStop(1, '#cfc9c0')
      g2.fillStyle = gr
      g2.fillRect(x, 0, 16, h2)
    }
  })
  const slats = (w: number, h: number) => {
    const map = flutes.clone()
    map.repeat.set(w / 0.2, 1)
    map.needsUpdate = true
    void h
    return std({ map, roughness: 0.4 })
  }
  const wallpaper = std({ map: k.tex.painted(512, 1024, blades), roughness: 0.7 })
  return {
    floor, walnut, slats, wallpaper,
    walnutPlain: walnut(0.6, 0.6),
    rug: std({ map: k.tex.painted(512, 384, gridRug), roughness: 1 }),
    paint: std({ color: '#f1ece4', roughness: 0.92 }),
    moulding: std({ color: '#f6f2eb', roughness: 0.6 }),
    lacquer: std({ color: '#f4f1ec', roughness: 0.4 }),
    interior: std({ color: '#ece7df', roughness: 0.7 }),
    skirting: std({ color: '#e9e3d9', roughness: 0.6 }),
    dark: std({ color: '#2a2622', roughness: 0.8 }),
    black: std({ color: '#151516', roughness: 0.45, metalness: 0.4 }),
    brass: std({ color: '#c9a366', roughness: 0.32, metalness: 0.5 }),
    copper: std({ color: '#c07a4f', roughness: 0.32, metalness: 0.55 }),
    steel: std({ color: '#c9c6c0', roughness: 0.35, metalness: 0.6 }),
    white: std({ color: '#f5f3ef', roughness: 0.45 }),
    headboard: fabric([226, 214, 196], 471, 6),
    mattress: fabric([238, 235, 228], 472, 8, 0.3),
    sheet: fabric([242, 240, 235], 473, 1, 0.35, true),
    quilt: fabric([30, 36, 54], 474, 1, 0.5, true),
    pillowWhite: fabric([244, 241, 235], 475, 3, 0.35),
    pillowBrown: fabric([128, 92, 66], 476, 3),
    sheer: new MeshPhysicalMaterial({ color: '#f4f1ec', roughness: 1, transparent: true, opacity: 0.55, side: DoubleSide, depthWrite: false }),
    drape: std({ color: '#7d7c7a', roughness: 0.95, side: DoubleSide }),
    pot: std({ color: '#e6e1d8', roughness: 0.7 }),
    tulip: std({ color: '#c8302b', roughness: 0.7 }),
    leaf: std({ color: '#4f6b37', roughness: 0.8 }),
    vaseGlass: new MeshPhysicalMaterial({ color: '#dfe9e4', roughness: 0.05, transparent: true, opacity: 0.35, clearcoat: 1 }),
    ceiling: new MeshStandardMaterial({ color: '#f4f1ec', roughness: 0.95, side: FrontSide, shadowSide: DoubleSide, emissive: '#c9c0b2', emissiveIntensity: 0.42 }),
    spot: glow('#fff0dc', 2.6),
    cove: glow('#ffc98a', 2.4),
    wash: glow('#ffc98a', 2.2),
    locator: glow('#ff9a3a', 1.4),
    plate: std({ color: '#d4cdc1', roughness: 0.45 }),
    rocker: std({ color: '#ece8e1', roughness: 0.35 }),
    fan: std({ color: '#f1ede6', roughness: 0.5 }),
    fanWood: c.surface('walnut', 0.6, 0.12),
    contact: new MeshBasicMaterial({ map: k.tex.painted(128, 128, blot), color: '#000000', transparent: true, depthWrite: false }),
    book: [std({ color: '#3d4a52', roughness: 0.7 }), std({ color: '#c9bba3', roughness: 0.7 }), std({ color: '#7a5a45', roughness: 0.7 })],
    shirtWhite: garment('#eeebe6', 'plain', 41),
    shirtBlue: garment('#a9bccf', 'plain', 42),
    shirtStripe: garment('#e9edf2', 'stripe', 43),
    jacket: garment('#3d4046', 'herringbone', 44),
    blazer: garment('#6b5a4c', 'twill', 45),
    trousers: garment('#c3b293', 'twill', 46),
    trousersGrey: garment('#7d7f82', 'twill', 47),
    dress: garment('#8f6f62', 'plain', 48),
    hanger: std({ color: '#7a5236', roughness: 0.5 }),
    rail: std({ color: '#c7cbd0', roughness: 0.25, metalness: 0.9 }),
  }
}

type M = ReturnType<typeof materials>
type Circuits = { room: Circuit; feature: Circuit }
type C = { ctx: Ctx; m: M; g: Group; c: Circuits; bx: (x: R, h: R, z: R, mat: Material, cast?: boolean, p?: Object3D) => Mesh }

export function buildBedroom4(ctx: Ctx) {
  const { k } = ctx
  const g = new Group()
  g.name = 'bedroom_4'
  g.position.set(BEDROOM4.x1, FFL, BEDROOM4.z0)
  // Mirrored: the board's X runs from the wall shared with Bedroom 2 out to the house's left wall.
  g.scale.x = -1
  k.root.add(g)
  const m = materials(ctx)
  const bx = ([x0, x1]: R, [h0, h1]: R, [z0, z1]: R, mat: Material, cast = true, p: Object3D = g) =>
    k.box(p, x1 - x0, h1 - h0, z1 - z0, mat, (x0 + x1) / 2, (h0 + h1) / 2, (z0 + z1) / 2, cast)
  const c: Circuits = { room: circuit(), feature: circuit() }
  c.room.glows.push(m.spot, m.cove)
  c.feature.glows.push(m.wash)
  const B: C = { ctx, m, g, c, bx }
  shell(B)
  bedWall(B)
  bed(B)
  bedsides(B)
  wardrobe(B)
  window(B)
  fittings(B)
  lights(B)
}

function contact({ g, m }: C, x: number, z: number, w: number, d: number, opacity: number) {
  const mat = m.contact.clone()
  mat.opacity = opacity
  const s = new Mesh(new PlaneGeometry(w, d), mat)
  s.rotation.x = -PI / 2
  s.position.set(x, 0.026, z)
  s.renderOrder = 1
  g.add(s)
}

/** Marble floor, paint, skirting, the door, the lit cove ceiling with its fan, and the rug. */
function shell(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  bx([0, W], [0, 0.012], [0, D], m.floor, false)
  bx([0, W], [0, H], [-0.004, 0], m.paint, false)
  bx([W, W + 0.004], [0, H], [0, WIN.z[0]], m.paint, false)
  bx([W, W + 0.004], [0, H], [WIN.z[1], D], m.paint, false)
  bx([W, W + 0.004], [0, WIN.h[0]], WIN.z, m.paint, false)
  bx([W, W + 0.004], [WIN.h[1], H], WIN.z, m.paint, false)
  bx([-0.004, 0], [0, H], [WR.z1, D], m.paint, false)
  bx([0, DOOR[0]], [0, H], [D, D + 0.004], m.paint, false)
  bx(DOOR, [2.1, H], [D, D + 0.004], m.paint, false)
  bx([DOOR[1], W], [0, H], [D, D + 0.004], m.paint, false)
  bx([WR.x1, W], [0, 0.08], [0, 0.012], m.skirting, false)
  bx([W - 0.012, W], [0, 0.08], [0, D], m.skirting, false)
  bx([0, 0.012], [0, 0.08], [WR.z1 + 0.02, D], m.skirting, false)
  bx([DOOR[1] + 0.065, W], [0, 0.08], [D - 0.012, D], m.skirting, false)

  // A flush white door with a brass lever, swinging in against the wardrobe wall.
  const dw = DOOR[1] - DOOR[0] - 0.008
  const door = new Group()
  door.name = 'door_bed4_entry'
  door.position.set(DOOR[0] + 0.004, 0, D + 0.02)
  door.userData.openAngle = 1.5
  g.add(door)
  bx([0, dw], [0.006, 2.094], [0, 0.04], m.white, true, door).userData.front = true
  for (const z of [-0.012, 0.052]) {
    k.cyl(door, 0.024, 0.024, 0.012, m.brass, dw - 0.065, 1.0, z, 20).rotation.x = PI / 2
    bx([dw - 0.19, dw - 0.06], [0.992, 1.008], [z - 0.008, z + 0.008], m.brass, true, door)
  }
  for (const z of [[D - 0.014, D], [D + 0.12, D + 0.134]] as R[]) {
    bx([DOOR[0] - 0.065, DOOR[0]], [0, 2.17], z, m.skirting)
    bx([DOOR[1], DOOR[1] + 0.065], [0, 2.17], z, m.skirting)
    bx(DOOR, [2.1, 2.17], z, m.skirting)
  }

  // The ceiling: a lowered border all round with a concealed warm cove, the flat field above it.
  const drop = 0.12
  const lip = 0.42
  for (const [x, z] of [[[0, W], [0, lip]], [[0, W], [D - lip, D]], [[0, lip], [lip, D - lip]], [[W - lip, W], [lip, D - lip]]] as [R, R][]) {
    bx(x, [H - drop, H - drop + 0.012], z, m.paint, false)
  }
  bx([lip, W - lip], [H - drop + 0.012, H - drop + 0.05], [lip - 0.012, lip], m.paint, false)
  bx([lip, W - lip], [H - drop + 0.012, H - drop + 0.05], [D - lip, D - lip + 0.012], m.paint, false)
  bx([lip - 0.012, lip], [H - drop + 0.012, H - drop + 0.05], [lip, D - lip], m.paint, false)
  bx([W - lip, W - lip + 0.012], [H - drop + 0.012, H - drop + 0.05], [lip, D - lip], m.paint, false)
  for (const [x, z] of [[[lip + 0.02, W - lip - 0.02], [lip + 0.01, lip + 0.03]], [[lip + 0.02, W - lip - 0.02], [D - lip - 0.03, D - lip - 0.01]], [[lip + 0.01, lip + 0.03], [lip + 0.02, D - lip - 0.02]], [[W - lip - 0.03, W - lip - 0.01], [lip + 0.02, D - lip - 0.02]]] as [R, R][])
    bx(x, [H - drop + 0.012, H - drop + 0.02], z, m.cove, false)
  const field = new Mesh(new PlaneGeometry(W - 2 * lip, D - 2 * lip), m.ceiling)
  field.rotation.x = PI / 2
  field.position.set(W / 2, H, D / 2)
  g.add(field)
  for (const [x, z] of [[0.2, 0.2], [0.2, D - 0.2], [W - 0.2, 0.2], [W - 0.2, D - 0.2], [CX, 0.2]]) k.cyl(g, 0.045, 0.045, 0.01, m.spot, x, H - drop - 0.004, z, 16).castShadow = false
  ceilingFan(k, g, CX, H, 2.05, { body: m.fan, blade: m.fanWood, iron: m.brass })

  bx([CX - 1.25, CX + 1.25], [0.012, 0.026], [1.35, 3.25], m.rug, false)
}

/** The arched wallpaper panel with its moulded frame, flanked by two arched POP mouldings, and its wash of light. */
function bedWall(B: C) {
  const { bx, m, g } = B
  const top = H - 0.24
  const w = PANEL.wall[1] - PANEL.wall[0]
  const cx = (PANEL.wall[0] + PANEL.wall[1]) / 2
  const paper = new Mesh(new ShapeGeometry(arch(w, top, 0.32), 24), m.wallpaper)
  const uv = paper.geometry.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w + 0.5, uv.getY(i) / top)
  paper.position.set(cx, 0, 0.004)
  g.add(paper)
  const frame = (x: number, pw: number, ph: number, z: number, r: number) => {
    const tube = new Mesh(new TubeGeometry(archPath(pw, ph, r, x, z), 120, 0.014, 8, false), m.moulding)
    tube.castShadow = true
    g.add(tube)
  }
  frame(cx, w + 0.03, top + 0.015, 0.012, 0.33)
  frame((PANEL.a[0] + PANEL.a[1]) / 2, PANEL.a[1] - PANEL.a[0] - 0.08, top, 0.012, 0.2)
  frame((PANEL.b[0] + PANEL.b[1]) / 2, PANEL.b[1] - PANEL.b[0] - 0.08, top, 0.012, 0.2)
  // A concealed wash over the wallpaper.
  bx([PANEL.wall[0], PANEL.wall[1]], [H - 0.12, H - 0.11], [0.05, 0.08], m.wash, false)
}

/** The walnut bed: padded gaddi headboard in two panels in a walnut frame, base, mattress and bedding. */
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
  // Headboard: a walnut frame, two padded cushions across it.
  bx([BED.x0 - 0.04, BED.x1 + 0.04], [0.2, 1.12], [0.02, 0.07], m.walnut(1.74, 0.92))
  bx([BED.x0 - 0.06, BED.x0 - 0.02], [0, 1.14], [0.02, 0.09], m.walnutPlain)
  bx([BED.x1 + 0.02, BED.x1 + 0.06], [0, 1.14], [0.02, 0.09], m.walnutPlain)
  bx([BED.x0 - 0.06, BED.x1 + 0.06], [1.1, 1.14], [0.02, 0.09], m.walnutPlain)
  for (const s of [-1, 1]) k.soft(g, bw / 2 - 0.06, 0.5, 0.08, 0.035, m.headboard, CX + (s * (bw / 2 - 0.02)) / 2, 0.8, 0.1)
  // Walnut box base on a shadow plinth.
  bx([BED.x0 + 0.05, BED.x1 - 0.05], [0, 0.06], [BED.z0 + 0.05, BED.z1 - 0.05], m.dark, false)
  bx([BED.x0, BED.x1], [0.06, 0.36], [BED.z0 + 0.06, BED.z1], m.walnut(bw, 0.3))
  k.soft(g, bw - 0.06, 0.22, BED.z1 - BED.z0 - 0.08, 0.06, m.mattress, CX, 0.47, (BED.z0 + BED.z1) / 2 + 0.02)
  const top = 0.585
  soft(drape({ hw: bw / 2 - 0.03, len: 0.95, drop: 0.2, edge: 0.06, puff: 0.03, foot: false, seed: 81 }), m.sheet, CX, top, 0.3)
  // The navy quilt over the lower half, falling over the foot and sides.
  soft(drape({ hw: bw / 2 - 0.02, len: 1.0, drop: 0.3, edge: 0.06, puff: 0.04, crease: 1.1, seed: 82 }), m.quilt, CX, top + 0.02, 1.15)
  const P = (w: number, h: number, th: number, seed: number, mat: Material, x: number, y: number, z: number, tilt: number, yaw = 0) => {
    soft(pillow(w, h, th, seed), mat, x, y, z).rotation.set(-tilt, yaw, ((seed % 3) - 1) * 0.02)
  }
  P(0.62, 0.42, 0.17, 83, m.pillowWhite, CX - 0.46, top + 0.22, 0.3, 0.32, 0.04)
  P(0.62, 0.42, 0.17, 84, m.pillowWhite, CX, top + 0.22, 0.3, 0.34)
  P(0.62, 0.42, 0.17, 85, m.pillowWhite, CX + 0.46, top + 0.22, 0.3, 0.32, -0.04)
  P(0.36, 0.3, 0.12, 86, m.pillowBrown, CX - 0.36, top + 0.15, 0.48, 0.28, 0.1)
  P(0.36, 0.3, 0.12, 87, m.pillowBrown, CX + 0.36, top + 0.15, 0.48, 0.28, -0.1)
  contact(B, CX, 1.15, 2.1, 2.5, 0.45)
}

/** Floating walnut bedside units, a drawer each, with copper patti inlays; tulips on one, books on the other. */
function bedsides(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const units: R[] = [[0.7, 1.15], [2.91, 3.38]]
  units.forEach(([x0, x1], i) => {
    const f = new Group()
    f.position.set(x0, 0.36, 0.42)
    g.add(f)
    cabinet(k, f, x1 - x0, 0.18, 0.4, { kind: 'drawers', id: `bed4_side_${i}`, rows: [], fill: [stationery(k, i)] }, { front: m.walnut(0.45, 0.18), interior: m.interior, drawer: m.walnutPlain })
    // The copper patti: two thin strips across each front, and round the top.
    for (const o of f.children.filter((ch) => ch.name.startsWith('drawer_')))
      for (const h of [0.05, 0.13]) k.box(o, x1 - x0 - 0.02, 0.006, 0.006, m.copper, (x1 - x0) / 2, h, 0.003)
    bx([x0 - 0.006, x1 + 0.006], [0.54, 0.565], [0.02, 0.43], m.walnutPlain)
    bx([x0 - 0.006, x1 + 0.006], [0.565, 0.57], [0.4, 0.43], m.copper, false)
    contact(B, (x0 + x1) / 2, 0.24, 0.6, 0.5, 0.18)
  })
  // Red tulips in a glass vase on the window side.
  const vx = 3.18
  k.cyl(g, 0.045, 0.06, 0.2, m.vaseGlass, vx, 0.67, 0.22, 24)
  for (let i = 0; i < 9; i++) {
    const a = i * 2.39
    const lean = 0.05 + (i % 3) * 0.06
    const len = 0.28 + (i % 4) * 0.04
    const stem = new Group()
    stem.position.set(vx, 0.62, 0.22)
    stem.rotation.set(Math.cos(a) * lean, 0, Math.sin(a) * lean)
    g.add(stem)
    k.cyl(stem, 0.003, 0.003, len, m.leaf, 0, len / 2, 0, 5)
    k.blob(stem, 0.024, m.tulip, 0, len + 0.02, 0, 1.4)
  }
  for (let i = 0; i < 3; i++) bx([0.78 + i * 0.01, 1.02 - i * 0.012], [0.57 + i * 0.026, 0.596 + i * 0.026], [0.14 + i * 0.01, 0.32 - i * 0.008], m.book[i])
}

/** The wardrobe: white fluted hinged doors with long brass pulls, lofts above, hanging and shelving inside. */
function wardrobe(B: C) {
  const { bx, m, ctx, g } = B
  const { k } = ctx
  const depth = WR.x1 - 0.02
  const len = WR.z1 - WR.z0
  const bay = len / 4
  const wear = { wood: m.hanger, steel: m.rail }
  bx([0, 0.02], [0, H - 0.12], [WR.z0, WR.z1], m.interior)
  bx([0, WR.x1], [0, H - 0.12], [WR.z1, WR.z1 + 0.02], m.lacquer)
  bx([0, WR.x1], [H - 0.14, H - 0.12], [WR.z0, WR.z1], m.lacquer)
  bx([0.02, WR.x1 - 0.02], [0, 0.08], [WR.z0, WR.z1], m.dark, false)
  const knits = [m.shirtWhite, m.trousersGrey, m.blazer, m.trousers, m.shirtBlue] as MeshStandardMaterial[]
  // Hanging, seen from the frame: a rail across the bay with garments side by side.
  const hang = (p: Group, b: Bay, y: number, items: [Parameters<typeof hangGarment>[2], Material][], seed: number) => {
    const r = new Group()
    r.position.set(0, 0, (b.z0 + b.z1) / 2)
    r.rotation.y = PI / 2
    p.add(r)
    const rail = k.cyl(r, 0.011, 0.011, b.x1 - b.x0 - 0.02, m.rail, 0, y, -(b.x0 + b.x1) / 2, 14)
    rail.rotation.x = PI / 2
    items.forEach(([kind, mat], i) => hangGarment(k, r, kind, mat, { x: 0, y, z: -(b.x0 + 0.06 + (i * (b.x1 - b.x0 - 0.12)) / Math.max(1, items.length - 1)) }, seed + i, wear))
  }
  const fills = [
    (p: Group, b: Bay) => hang(p, b, b.floors[0] + 1.86, [['jacket', m.jacket], ['jacket', m.blazer], ['dress', m.dress]], 111),
    (p: Group, b: Bay) => hang(p, b, b.floors[0] + 1.86, [['shirt', m.shirtWhite], ['shirt', m.shirtStripe], ['shirt', m.shirtBlue]], 121),
    (p: Group, b: Bay) => {
      hang(p, b, b.floors[0] + 1.86, [['trousers', m.trousers], ['trousers', m.trousersGrey]], 131)
      for (let j = 0; j < 3; j++) folded(k, p, (b.x0 + b.x1) / 2, b.floors[0] + j * 0.06, (b.z0 + b.z1) / 2, 0.36, 0.3, 0.06, knits[j])
    },
    (p: Group, b: Bay) => {
      b.floors.forEach((y, i) => {
        for (let j = 0; j < 2 + (i % 2); j++) folded(k, p, (b.x0 + b.x1) / 2, y + j * 0.055, (b.z0 + b.z1) / 2, 0.36, 0.3, 0.055, knits[(i + j) % 5], (j - 1) * 0.02)
      })
    },
  ]
  for (let i = 0; i < 4; i++) {
    const f = new Group()
    // Each bay faces into the room: its x runs along the wall (house z), its front at the wardrobe's face.
    f.position.set(WR.x1, 0.08, WR.z0 + (i + 1) * bay)
    f.rotation.y = PI / 2
    g.add(f)
    cabinet(k, f, bay, WR.loft - 0.08, depth, { kind: 'door', id: `bed4_wardrobe_${i + 1}`, hinge: i % 2 ? 'left' : 'right', shelves: i === 3 ? [0.35, 0.7, 1.05, 1.4] : i === 2 ? [0.32] : [], fill: fills[i] }, { front: m.slats(bay, WR.loft), interior: m.interior, drawer: m.walnutPlain })
    // A long brass pull on each door's free edge.
    for (const o of f.children.filter((ch) => ch.name.startsWith('door_'))) {
      const free = i % 2 ? bay - 0.06 : -bay + 0.06
      k.box(o, 0.016, 1.3, 0.02, m.brass, free, 0.95, 0.032)
    }
    // Loft door above, on its own hinge.
    const lf = new Group()
    lf.position.set(WR.x1, WR.loft, WR.z0 + (i + 1) * bay)
    lf.rotation.y = PI / 2
    g.add(lf)
    cabinet(k, lf, bay, H - 0.14 - WR.loft, depth, { kind: 'door', id: `bed4_loft_${i + 1}`, hinge: i % 2 ? 'left' : 'right', fill: (p, b) => folded(k, p, (b.x0 + b.x1) / 2, b.floors[0], (b.z0 + b.z1) / 2, 0.4, 0.4, 0.16, m.shirtWhite) }, { front: m.lacquer, interior: m.interior, drawer: m.walnutPlain })
  }
  contact(B, WR.x1 + 0.05, (WR.z0 + WR.z1) / 2, 0.4, len, 0.3)
}

/** Sheers across the window and full grey curtains drawn either side, on a black rod; the plant in the corner. */
function window({ m, g, ctx }: C) {
  const { k } = ctx
  const [z0, z1] = WIN.z
  const pleat = (a0: number, a1: number, mat: Material, x: number, depth: number, pitch: number) => {
    const w = a1 - a0
    const h = H - 0.2
    const geo = new PlaneGeometry(w, h, Math.round(w / 0.012), 10)
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const px = p.getX(i)
      const y = p.getY(i)
      p.setZ(i, (depth + 0.012 * (0.5 - y / h)) * Math.sin((px / pitch) * PI * 2) + 0.004 * Math.sin(px * 47 + y * 2))
    }
    geo.computeVertexNormals()
    const s = new Mesh(geo, mat)
    s.rotation.y = PI / 2
    s.position.set(x, h / 2 + 0.03, (a0 + a1) / 2)
    s.castShadow = mat === m.drape
    if (mat === m.sheer) s.renderOrder = 1
    g.add(s)
  }
  pleat(z0 + 0.3, z1 - 0.3, m.sheer, W - 0.08, 0.018, 0.07)
  pleat(z0 - 0.3, z0 + 0.3, m.drape, W - 0.16, 0.035, 0.1)
  pleat(z1 - 0.3, z1 + 0.3, m.drape, W - 0.16, 0.035, 0.1)
  for (const x of [W - 0.08, W - 0.16]) k.cyl(g, 0.01, 0.01, z1 - z0 + 0.8, m.black, x, H - 0.17, (z0 + z1) / 2, 10).rotation.x = PI / 2
  // The split air conditioner over the window, as the board's render has it.
  k.soft(g, 0.22, 0.28, 0.9, 0.03, m.white as MeshStandardMaterial, W - 0.12, H - 0.33, (z0 + z1) / 2)
  k.box(g, 0.01, 0.02, 0.8, m.steel, W - 0.235, H - 0.45, (z0 + z1) / 2)
  fiddleLeafFig(k, g, W - 0.42, 0, D - 0.42, 1.05, m.pot, 7)
}

/** Switches: by the door, and above each bedside unit as the elevation draws them. */
function fittings({ m, g, ctx, c }: C) {
  const { k } = ctx
  const mats = { plate: m.plate, rocker: m.rocker, dark: m.dark, locator: m.locator }
  const entry = switchPlate(k, g, 'bed4_entry', ['switch', 'switch', 'socket'], mats, [c.room, c.feature])
  entry.position.set(DOOR[1] + 0.24, 1.2, D - 0.0005)
  entry.rotation.y = PI
  for (const [name, x] of [['bed4_left', 0.92], ['bed4_right', 3.14]] as const) switchPlate(k, g, name, ['switch', 'switch', 'socket'], mats, [c.feature, c.room]).position.set(x, 0.82, 0.0005)
}

function lights({ g, ctx, c }: C) {
  const add = (x: number, h: number, z: number, intensity: number, distance: number, color = '#fff0dc') => {
    const l = new PointLight(color, intensity, distance, 2)
    l.position.set(x, h, z)
    g.add(l)
    ctx.lighting.light(l, 1)
    return l
  }
  c.room.lights.push(add(CX, 2.35, 1.8, 7, 6.5), add(0.5, 2.3, 3.0, 3, 4), add(3.0, 2.3, 3.0, 3, 4), add(CX, 2.35, 0.6, 2.4, 3.5, '#ffc98a'))
  c.feature.lights.push(add(CX, 2.3, 0.55, 1.8, 3.2, '#ffcf96'), add(0.92, 0.75, 0.32, 1, 1.4, '#ffcf96'), add(3.14, 0.75, 0.32, 1, 1.4, '#ffcf96'))
}
