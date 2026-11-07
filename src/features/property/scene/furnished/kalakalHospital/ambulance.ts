import {
  CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, MeshPhysicalMaterial, MeshStandardMaterial, Path, PlaneGeometry, Shape, ShapeGeometry, type Material, type Object3D,
} from 'three'
import { PI } from '../kit'
import type { Paint } from '../textures'
import { carMaterials, drawPlate, rimGeometry, tyreGeometry } from '../car'
import type { HospitalCtx } from './building'
import { bake, bentTube, castor, drape, face, geo, group, lathe, makeCtx, panel, pillow, put, rod, type Ctx } from './erKit'
import { cylinder, infusionBag } from './erFurniture'
import { patientMonitor } from './erEquipment'

/*
 * A Type-B emergency ambulance, as the hospital's own runs them: a high-roof panel van conversion,
 * 5.9 m long, 2.0 m wide and 2.62 m to the roof on a 3.35 m wheelbase, on 215/75 R16 tyres. Front
 * towards +z at yaw 0, its wheels on y = 0 of the group.
 *
 * The body is cut from the van's side profile (bumper, bonnet, raked windscreen, cab roof and the
 * fibreglass high roof over the box, radiused arches) and rounded at its edges. The cab is closed;
 * the patient compartment behind it is built as a shell with its rear doors and the kerb-side
 * sliding door (both operated, see scene/openables.ts) so it can be looked into: the cot locked
 * on its floor mount, head to the front, the attendant's seat at its head and the bench along
 * the kerb side, cabinets and the oxygen cylinder in its bracket along the other, the monitor,
 * suction, IV hooks and the lights overhead.
 *
 * Livery: white, a red waist band, AMBULANCE in red on the sides and mirrored on the bonnet, the
 * star of life, the hospital's name and its emergency line, red and yellow chevrons on the back.
 */

const W = 2.0
const FRONT = 2.97
const BACK = -2.95
/** The B-pillar: the cab ahead of it, the patient compartment behind. */
const PILLAR = 0.75
const ROOF = 2.62
const SILL = 0.5
const AXLES = [1.9, -1.45]
const TYRE = 0.36
const ARCH = 0.46
const ARCH_Y = 0.36
/** The compartment's floor and its inside height. */
const FLOOR = 0.62
const SIDE_DOOR: [number, number] = [-0.4, 0.62]

const SANS = (px: number, weight = 800) => `${weight} ${Math.round(px)}px Helvetica, Arial, sans-serif`

/* ---------- livery ---------- */

/** The box's side, as a decal: AMBULANCE over the band, the star of life, the hospital and its number. */
const sideText: Paint = (g, w, h) => {
  g.clearRect(0, 0, w, h)
  g.fillStyle = '#d0161e'
  g.font = SANS(h * 0.26)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('AMBULANCE', w * 0.4, h * 0.24)
  g.fillStyle = '#1c3966'
  g.font = SANS(h * 0.11, 700)
  g.fillText('TERRANOVA HOSPITAL', w * 0.4, h * 0.73)
  g.font = SANS(h * 0.08, 600)
  g.fillStyle = '#2b2b2b'
  g.fillText('EMERGENCY  24 × 7   ·   040 2345 6789', w * 0.4, h * 0.88)
  // The star of life, to the side.
  const cx = w * 0.88
  const cy = h * 0.45
  const s = h * 0.36
  g.fillStyle = '#1b4fa0'
  for (let i = 0; i < 3; i++) {
    g.save()
    g.translate(cx, cy)
    g.rotate((i * PI) / 3)
    g.fillRect(-s * 0.17, -s, s * 0.34, s * 2)
    g.restore()
  }
  g.fillStyle = '#ffffff'
  g.fillRect(cx - s * 0.04, cy - s * 0.65, s * 0.08, s * 1.3)
  g.beginPath()
  g.ellipse(cx, cy - s * 0.3, s * 0.18, s * 0.08, 0.3, 0, 7)
  g.ellipse(cx, cy + s * 0.15, s * 0.18, s * 0.08, -0.3, 0, 7)
  g.strokeStyle = '#ffffff'
  g.lineWidth = s * 0.05
  g.stroke()
}

/** AMBULANCE reversed, for the bonnet, to read in a mirror ahead. */
const bonnetText: Paint = (g, w, h) => {
  g.clearRect(0, 0, w, h)
  g.translate(w, 0)
  g.scale(-1, 1)
  g.fillStyle = '#d0161e'
  g.font = SANS(h * 0.7)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('AMBULANCE', w / 2, h * 0.55)
}

/** Red and yellow retro-reflective chevrons for the rear doors, as an alpha decal. */
const chevrons: Paint = (g, w, h) => {
  g.clearRect(0, 0, w, h)
  const step = w / 5
  for (let i = -2; i < 8; i++) {
    g.fillStyle = i % 2 ? '#f2c200' : '#d0161e'
    g.beginPath()
    g.moveTo(i * step, h)
    g.lineTo(i * step + step, h)
    g.lineTo(i * step + step * 2, 0)
    g.lineTo(i * step + step, 0)
    g.fill()
  }
}

/** A registration plate, for the bumpers: white, an Indian high-security plate. */
const plate = (text: string): Paint => (g, w, h) => drawPlate(g, text, w, h)

/* ---------- shapes ---------- */

/** The van's side profile in (z, y), wheel arches cut into its foot, the region u0 … u1 of it. */
function profile(u0: number, u1: number) {
  const s = new Shape()
  const pts: [number, number][] = [
    [BACK + 0.06, SILL - 0.02], [BACK, SILL + 0.08], [BACK, ROOF - 0.12], [BACK + 0.12, ROOF], [PILLAR + 0.25, ROOF], [PILLAR + 0.6, ROOF - 0.1],
    [1.62, 2.1], [2.3, 1.24], [2.86, 1.12], [2.95, 1.02], [FRONT, 0.9], [FRONT, 0.56], [2.92, SILL - 0.05],
  ]
  // Clip to u0 … u1 along z, keeping the profile's top and bottom.
  const clipped = pts.map(([u, v]): [number, number] => [Math.min(u1, Math.max(u0, u)), v])
  s.moveTo(clipped[0][0], clipped[0][1])
  for (const [u, v] of clipped.slice(1)) s.lineTo(u, v)
  // Along the foot from the front back, round each arch in range.
  const a = Math.asin((SILL - ARCH_Y) / ARCH)
  for (const ax of AXLES) {
    if (ax + ARCH <= u0 || ax - ARCH >= u1) continue
    s.lineTo(Math.min(u1, ax + ARCH * Math.cos(a)), SILL)
    s.absarc(ax, ARCH_Y, ARCH, a, PI - a, false)
  }
  s.lineTo(clipped[0][0], SILL)
  s.closePath()
  return s
}

/** An extruded slab of `shape` across x from x0 to x1, its edges rounded by `bevel`. */
function across(shape: Shape, x0: number, x1: number, bevel: number) {
  // The bevel rounds the edges inside the outline (bevelOffset), so the profile keeps its size.
  const g = new ExtrudeGeometry(shape, { depth: Math.max(0.001, x1 - x0 - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 3, curveSegments: 18 })
  // Shape x is the van's z; its extrusion runs along the van's x.
  g.rotateY(-PI / 2)
  g.translate(x1 - bevel, 0, 0)
  return g
}

/** A flat polygon on the van's side at x, from (z, y) points, facing out (+x or −x). */
function sideFace(pts: [number, number][], x: number) {
  const s = new Shape()
  s.moveTo(pts[0][0], pts[0][1])
  for (const [u, v] of pts.slice(1)) s.lineTo(u, v)
  const g = new ShapeGeometry(s)
  g.rotateY(x > 0 ? -PI / 2 : PI / 2)
  if (x < 0) g.scale(1, 1, -1)
  g.translate(x, 0, 0)
  return g
}

/* ---------- the van ---------- */

interface Mats {
  paint: Material
  body: ReturnType<typeof carMaterials>
  livery: Material
  liner: Material
  bonnet: Material
  chevron: Material
  plate: Material
  lining: Material
  floor: Material
  beaconRed: Material
  beaconBlue: Material
  amber: Material
  lamp: Material
}

function mats(ctx: HospitalCtx, e: Ctx): Mats {
  const { k, c, lighting } = ctx
  const decal = (w: number, h: number, paint: Paint) => new MeshStandardMaterial({ map: k.tex.painted(w, h, paint), transparent: true, alphaTest: 0.5, roughness: 0.4, side: DoubleSide })
  return {
    paint: new MeshPhysicalMaterial({ color: '#f6f6f3', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, metalness: 0 }),
    body: carMaterials(),
    livery: decal(1024, 384, sideText),
    liner: new MeshStandardMaterial({ color: '#121314', roughness: 0.95, side: DoubleSide }),
    bonnet: decal(1024, 160, bonnetText),
    chevron: decal(512, 256, chevrons),
    plate: new MeshStandardMaterial({ map: k.tex.painted(512, 112, plate('TS 08 UA 1086')), roughness: 0.4 }),
    lining: new MeshStandardMaterial({ color: '#eef0ef', roughness: 0.5 }),
    floor: new MeshStandardMaterial({ color: '#6f7479', roughness: 0.8 }),
    beaconRed: c.beaconRed,
    beaconBlue: c.beaconBlue,
    amber: lighting.glow(new MeshStandardMaterial({ color: '#f0a020', emissive: '#ff9a10', emissiveIntensity: 0.3, roughness: 0.2 }), 0.2),
    lamp: e.m.ledPanel,
  }
}

/** A wheel: the tyre turned from its section, a steel rim with its hub cap and nuts; axis along x, `out` its outboard side. */
function wheel(e: Ctx, p: Object3D, mm: Mats, x: number, z: number, out: number) {
  const g = group(p, x, TYRE, z)
  g.rotation.z = (-out * PI) / 2
  put(g, geo(e, 'ambTyre', () => tyreGeometry(TYRE, 0.215)), mm.body.tyre)
  put(g, geo(e, 'ambRim', () => rimGeometry(TYRE * 0.58, 0.2)), mm.body.alloy)
  put(g, lathe(e, 'ambDisc', [[0, 0.07], [TYRE * 0.52, 0.07], [TYRE * 0.54, 0.05], [TYRE * 0.3, 0.06], [0, 0.065]], 32), mm.body.alloy)
  put(g, lathe(e, 'ambCap', [[0, 0.1], [0.07, 0.1], [0.09, 0.075], [0.09, 0.07], [0, 0.07]], 24), mm.body.chrome)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2
    e.k.cyl(g, 0.011, 0.011, 0.02, mm.body.chrome, Math.cos(a) * 0.1, 0.08, Math.sin(a) * 0.1, 8)
  }
  // The disc brake behind, dark.
  put(g, lathe(e, 'ambBrake', [[0, -0.02], [0.15, -0.02], [0.15, 0.02], [0, 0.02]], 24), mm.body.disc)
}

/**
 * The rear doors, a pair hinged at the body's sides and opening outwards (operated); and the kerb
 * side's sliding door (operated), running back along the body.
 */
function doors(e: Ctx, p: Object3D, mm: Mats) {
  const { k } = e
  const h = ROOF - 0.27 - (FLOOR - 0.02)
  const yc = FLOOR - 0.02 + h / 2
  const dw = W / 2 - 0.05
  for (const s of [-1, 1]) {
    const leaf = group(p, s * (W / 2 - 0.04), yc, BACK - 0.012, 0, `door_amb_rear_${s > 0 ? 'l' : 'r'}`)
    leaf.userData = { openAngle: -s * 1.95, label: 'Ambulance Rear Door' }
    const cx = -s * dw / 2
    const front = put(leaf, panel(e, dw - 0.006, h, 0.05, 0.04, [[dw - 0.2, 0.5, 0, h / 2 - 0.4, 0.04]]), mm.paint, cx, 0, 0)
    front.rotation.y = PI
    k.box(leaf, dw - 0.18, 0.48, 0.008, mm.body.glass, cx, h / 2 - 0.4, 0.0, false)
    face(e, leaf, dw - 0.006, 0.17, e.m.red, cx, 0.0, -0.026, PI)
    face(e, leaf, dw - 0.02, 0.5, mm.chevron, cx, -h / 2 + 0.3, -0.0265, PI)
    k.box(leaf, 0.12, 0.03, 0.03, mm.body.chrome, -s * (dw - 0.12), 0.05, -0.035)
    for (const y of [-h / 2 + 0.2, h / 2 - 0.2]) k.cyl(leaf, 0.018, 0.018, 0.1, mm.body.trim, 0, y, -0.02, 10)
    // The inside, lined, with its window.
    k.box(leaf, dw - 0.06, h - 0.06, 0.01, mm.lining, cx, 0, 0.03, false)
    front.userData.front = true
    bake(leaf, front)
  }
  // The sliding door on the kerb side (+x), its window frosted, the red band across it.
  const [z0, z1] = SIDE_DOOR
  const sh = ROOF - 0.32 - (SILL + 0.06)
  const sd = group(p, W / 2 + 0.012, SILL + 0.06 + sh / 2, (z0 + z1) / 2, 0, 'drawer_amb_side')
  sd.userData = { slide: [0.04, 0, -(z1 - z0) - 0.05], label: 'Ambulance Side Door' }
  const front = put(sd, panel(e, z1 - z0 - 0.01, sh, 0.045, 0.04, [[z1 - z0 - 0.25, 0.55, 0, sh / 2 - 0.42, 0.05]]), mm.paint, 0, 0, 0)
  front.rotation.y = PI / 2
  k.box(sd, 0.008, 0.53, z1 - z0 - 0.23, mm.body.glass, -0.004, sh / 2 - 0.42, 0, false)
  k.box(sd, 0.004, 0.16, z1 - z0 - 0.01, e.m.red, 0.024, 1.32 - (SILL + 0.06 + sh / 2), 0, false)
  k.box(sd, 0.03, 0.03, 0.14, mm.body.chrome, 0.035, 0.0, -(z1 - z0) / 2 + 0.12)
  k.box(sd, 0.012, sh - 0.06, z1 - z0 - 0.06, mm.lining, -0.03, 0, 0, false)
  front.userData.front = true
  bake(sd, front)
}

/** The patient compartment's fit-out, from the floor at FLOOR. */
function compartment(e: Ctx, p: Object3D, mm: Mats) {
  const { k, m } = e
  const y = FLOOR
  const z0 = BACK + 0.06
  const z1 = PILLAR - 0.04
  const iw = W - 0.12
  // Floor, lining, roof lining with its lights, the bulkhead with its window.
  k.box(p, iw, 0.03, z1 - z0, mm.floor, 0, y - 0.015, (z0 + z1) / 2)
  for (const s of [-1, 1]) k.box(p, 0.02, ROOF - 0.12 - y, z1 - z0, mm.lining, s * (iw / 2 + 0.01), (ROOF - 0.12 + y) / 2, (z0 + z1) / 2, false)
  k.box(p, iw, 0.02, z1 - z0, mm.lining, 0, ROOF - 0.13, (z0 + z1) / 2, false)
  for (const x of [-0.45, 0.45]) k.box(p, 0.14, 0.012, z1 - z0 - 0.6, mm.lamp, x, ROOF - 0.146, (z0 + z1) / 2, false)
  k.box(p, iw, ROOF - 0.12 - y, 0.03, mm.lining, 0, (ROOF - 0.12 + y) / 2, z1, false)
  // The cot, locked to its floor mount, head to the front: folded undercarriage, the litter, mattress, linen, belts.
  const cot = group(p, 0.12, y, -1.05)
  put(cot, bentTube(e, 'cotRail', [[-0.26, 0.04, -0.9], [-0.26, 0.04, 0.9]], 0.012), m.stainless)
  put(cot, bentTube(e, 'cotRail', [[-0.26, 0.04, -0.9], [-0.26, 0.04, 0.9]], 0.012), m.stainless, 0.52)
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) castor(e, cot, sx * 0.24, sz * 0.75, 0.05)
  k.box(cot, 0.6, 0.06, 1.5, m.darkPlastic, 0, 0.1, 0)
  put(cot, bentTube(e, 'cotFrame', [[0, 0.2, -0.96], [0.29, 0.2, -0.96], [0.29, 0.2, 0.96], [-0.29, 0.2, 0.96], [-0.29, 0.2, -0.96], [0.001, 0.2, -0.96]], 0.016, 0.06), m.bedFrame)
  for (const z of [-0.6, 0, 0.6]) put(cot, bentTube(e, 'cotX', [[-0.24, 0.09, z - 0.2], [-0.24, 0.19, z + 0.2]], 0.012), m.bedFrame, 0.0)
  k.soft(cot, 0.56, 0.08, 1.22, 0.03, m.mattress, 0, 0.26, 0.32)
  put(cot, drape(e, 'cotSheet', 0.57, 1.22, 0.06, 0, 5), m.sheet, 0, 0.303, 0.32)
  const back = group(cot, 0, 0.22, -0.29)
  back.rotation.x = 0.55
  k.soft(back, 0.56, 0.08, 0.62, 0.03, m.mattress, 0, 0.04, -0.31)
  put(back, drape(e, 'cotBackSheet', 0.57, 0.62, 0.06, 0, 6), m.sheet, 0, 0.083, -0.31)
  put(back, pillow(e, 0.44, 0.1, 0.3), m.sheet, 0, 0.13, -0.42)
  for (const z of [-0.05, 0.55]) k.box(cot, 0.6, 0.006, 0.05, m.vacuum, 0, 0.31, z, false)
  for (const s of [-1, 1]) put(cot, bentTube(e, 'cotSideRail', [[0, 0.22, -0.4], [0, 0.42, -0.36], [0, 0.42, 0.5], [0, 0.22, 0.54]], 0.012, 0.05), m.stainless, s * 0.31)
  k.box(p, 0.08, 0.08, 0.3, m.stainless, 0.12, y + 0.04, -0.05)
  // The attendant's seat at the cot's head, facing back; the bench along the kerb side, behind the door.
  const seat = group(p, 0.12, y, 0.36, PI)
  k.soft(seat, 0.48, 0.1, 0.44, 0.03, m.vinylSeat, 0, 0.45, 0)
  k.soft(seat, 0.46, 0.5, 0.08, 0.03, m.vinylSeat, 0, 0.78, -0.22)
  k.box(seat, 0.3, 0.4, 0.3, m.greyPlastic, 0, 0.2, 0)
  const bench = group(p, iw / 2 - 0.22, y, -2.0)
  k.box(bench, 0.42, 0.4, 1.25, m.greyPlastic, 0, 0.2, 0)
  k.soft(bench, 0.44, 0.08, 1.25, 0.03, m.vinylSeat, 0, 0.44, 0)
  k.soft(bench, 0.08, 0.45, 1.2, 0.03, m.vinylSeat, 0.2, 0.75, 0)
  for (const z of [-0.35, 0.35]) k.box(bench, 0.06, 0.006, 0.05, m.vacuum, -0.05, 0.485, z, false)
  // The street side (−x): cabinets with clear sliding doors over a counter and its drawers.
  const cab = group(p, -iw / 2 + 0.2, y, -1.2)
  k.box(cab, 0.4, 0.8, 1.9, m.hpl, 0, 0.4, 0)
  for (let i = 0; i < 4; i++) k.box(cab, 0.004, 0.004, 1.86, m.reveal, 0.201, 0.2 + i * 0.18, 0, false)
  k.box(cab, 0.42, 0.03, 1.94, m.solidSurface, 0, 0.815, 0)
  k.box(cab, 0.32, 0.65, 1.9, m.hpl, -0.04, 1.6, 0)
  for (const y2 of [1.4, 1.65]) {
    k.box(cab, 0.28, 0.012, 1.86, m.melamine, -0.02, y2, 0)
    for (let z = -0.85; z < 0.85; z += 0.17 + e.r() * 0.06) k.box(cab, 0.18, 0.08 + e.r() * 0.08, 0.13, [m.blue, m.whitePlastic, m.binBlue, m.green][(e.r() * 4) | 0], -0.05, y2 + 0.06, z)
  }
  k.box(cab, 0.006, 0.6, 1.88, m.clearPlastic, 0.125, 1.6, 0, false)
  // The monitor-defibrillator on its bracket at the head end, suction beside it, oxygen in its bracket.
  const mon = group(p, -iw / 2 + 0.25, y + 1.15, 0.2, PI / 2 - 0.3)
  patientMonitor(e, mon, m.monitors[0], 0.3)
  k.box(p, 0.3, 0.02, 0.3, m.stainless, -iw / 2 + 0.2, y + 0.99, 0.2)
  k.cyl(p, 0.06, 0.06, 0.2, m.clearPlastic, -iw / 2 + 0.08, y + 1.35, -0.25, 18)
  k.cyl(p, 0.065, 0.065, 0.02, m.blue, -iw / 2 + 0.08, y + 1.46, -0.25, 18)
  cylinder(e, group(p, -iw / 2 + 0.16, y + 0.0, 0.5), 0.1, 1.2, 'in use')
  for (const yy of [0.4, 0.9]) k.box(p, 0.24, 0.03, 0.03, m.stainless, -iw / 2 + 0.16, y + yy, 0.62)
  // Overhead: the IV rail with a bag on its hook, the grab rail.
  put(p, bentTube(e, 'ivRail', [[0.12, ROOF - 0.14, -2.4], [0.12, ROOF - 0.2, -2.35], [0.12, ROOF - 0.2, 0.2], [0.12, ROOF - 0.14, 0.25]], 0.012, 0.04), m.stainless)
  infusionBag(e, p, 0.12, ROOF - 0.38, -0.7, 0.5)
  put(p, bentTube(e, 'grab', [[-0.35, ROOF - 0.14, -2.6], [-0.35, ROOF - 0.22, -2.55], [-0.35, ROOF - 0.22, -0.4], [-0.35, ROOF - 0.14, -0.35]], 0.014, 0.04), m.stainless)
  // A rear step to climb in by.
  k.box(p, W - 0.3, 0.04, 0.22, m.black, 0, 0.42, BACK - 0.14)
}

export function ambulance(ctx: HospitalCtx, parent: Object3D, x: number, y: number, z: number, yaw: number) {
  const { k, shade, lighting } = ctx
  const g = new Group()
  g.name = 'ambulance'
  g.position.set(x, y, z)
  g.rotation.y = yaw
  parent.add(g)
  const e = makeCtx(k, lighting, g, 6611)
  const mm = mats(ctx, e)
  const { body } = mm

  // The cab, a solid of the profile ahead of the B-pillar, rounded at its edges.
  put(g, geo(e, 'ambCab', () => across(profile(PILLAR, FRONT + 0.1), -W / 2, W / 2, 0.06)), mm.paint)
  // The patient compartment's shell: its two sides (the kerb side with the sliding door's opening),
  // roof, the radiused edges along its top, the frame round the rear doors.
  const sideShape = (door: boolean) => {
    const s = profile(BACK, PILLAR + 0.02)
    if (door) {
      const h = new Path()
      h.moveTo(SIDE_DOOR[0], SILL + 0.06)
      h.lineTo(SIDE_DOOR[1], SILL + 0.06)
      h.lineTo(SIDE_DOOR[1], ROOF - 0.3)
      h.lineTo(SIDE_DOOR[0], ROOF - 0.3)
      h.closePath()
      s.holes.push(h)
    }
    return s
  }
  put(g, geo(e, 'ambSideL', () => across(sideShape(true), W / 2 - 0.045, W / 2, 0.01)), mm.paint)
  put(g, geo(e, 'ambSideR', () => across(sideShape(false), -W / 2, -W / 2 + 0.045, 0.01)), mm.paint)
  k.soft(g, W - 0.04, 0.08, PILLAR + 0.3 - BACK, 0.04, mm.paint, 0, ROOF - 0.04, (PILLAR + 0.3 + BACK) / 2)
  for (const s of [-1, 1]) put(g, geo(e, 'ambEdge', () => new CylinderGeometry(0.06, 0.06, PILLAR + 0.2 - BACK, 16, 1, false)), mm.paint, s * (W / 2 - 0.06), ROOF - 0.07, (PILLAR + 0.2 + BACK) / 2).rotation.x = PI / 2
  for (const s of [-1, 1]) k.soft(g, 0.08, ROOF - 0.12 - SILL, 0.06, 0.02, mm.paint, s * (W / 2 - 0.04), (ROOF - 0.12 + SILL) / 2, BACK + 0.03)
  k.soft(g, W - 0.04, 0.26, 0.06, 0.02, mm.paint, 0, ROOF - 0.15, BACK + 0.03)
  k.soft(g, W - 0.04, FLOOR - SILL, 0.08, 0.02, mm.paint, 0, (FLOOR + SILL) / 2 - 0.02, BACK + 0.04)

  // Glass: the windscreen; the cab's side windows; the compartment's frosted side windows.
  const ws = Math.hypot(2.3 - 1.62, 2.1 - 1.24)
  const rake = -Math.atan2(2.3 - 1.62, 2.1 - 1.24)
  for (const [mat, off] of [[body.cabin, 0.007], [body.glass, 0.014]] as const) {
    const screen = put(g, geo(e, 'ambScreen', () => new PlaneGeometry(W - 0.16, ws - 0.12)), mat, 0, (1.24 + 2.1) / 2 + off * 0.6, (2.3 + 1.62) / 2 + off, false)
    screen.rotation.x = rake
  }
  for (const s of [-1, 1]) {
    put(g, geo(e, `ambCabWin${s}`, () => sideFace([[0.86, 1.36], [2.16, 1.36], [1.68, 1.98], [0.86, 2.0]], s * (W / 2 + 0.003))), body.glass, 0, 0, 0, false)
    // Dark behind the cab's glass (its interior), and behind the compartment's privacy-tinted window.
    put(g, geo(e, `ambCabIn${s}`, () => sideFace([[0.86, 1.36], [2.16, 1.36], [1.68, 1.98], [0.86, 2.0]], s * (W / 2 + 0.001))), body.cabin, 0, 0, 0, false)
    if (s < 0) {
      put(g, geo(e, 'ambBoxIn', () => sideFace([[-0.45, 1.65], [0.55, 1.65], [0.55, 2.2], [-0.45, 2.2]], -(W / 2 + 0.001))), body.cabin, 0, 0, 0, false)
      put(g, geo(e, 'ambBoxWin', () => sideFace([[-0.45, 1.65], [0.55, 1.65], [0.55, 2.2], [-0.45, 2.2]], -(W / 2 + 0.003))), body.glass, 0, 0, 0, false)
    }
    // Cab door seams, its handle, the mirror on its arm, the indicator repeater.
    k.box(g, 0.006, 1.45, 0.006, body.seam, s * (W / 2 + 0.003), 1.25, 0.8, false)
    k.box(g, 0.006, 0.006, 1.45, body.seam, s * (W / 2 + 0.003), 0.56, 1.52, false)
    k.box(g, 0.03, 0.03, 0.16, body.trim, s * (W / 2 + 0.012), 1.3, 0.98)
    put(g, bentTube(e, `mirrorArm${s}`, [[s * (W / 2), 1.6, 2.05], [s * (W / 2 + 0.14), 1.62, 2.02], [s * (W / 2 + 0.2), 1.7, 2.0]], 0.012, 0.04), body.trim)
    k.soft(g, 0.06, 0.34, 0.18, 0.03, body.trim, s * (W / 2 + 0.22), 1.82, 1.98)
    k.box(g, 0.004, 0.3, 0.14, body.chrome, s * (W / 2 + 0.25), 1.82, 1.98, false)
    k.box(g, 0.01, 0.04, 0.1, mm.amber, s * (W / 2 + 0.004), 0.95, 2.45, false)
    // The waist band, the livery, the arch liners.
    k.box(g, 0.004, 0.16, PILLAR - BACK - 0.2, e.m.red, s * (W / 2 + 0.004), 1.32, (PILLAR + BACK) / 2 - 0.05, false)
    k.box(g, 0.004, 0.12, FRONT - PILLAR - 0.45, e.m.red, s * (W / 2 + 0.004), 1.32, (FRONT + PILLAR) / 2 - 0.15, false)
    face(e, g, 2.3, 0.86, mm.livery, s * (W / 2 + 0.006), 1.86, -1.62, (s * PI) / 2)
    for (const ax of AXLES) {
      const liner = put(g, geo(e, 'ambLiner', () => new CylinderGeometry(ARCH - 0.01, ARCH - 0.01, 0.3, 24, 1, true, -PI / 2 + 0.3, PI - 0.6)), mm.liner, s * (W / 2 - 0.16), ARCH_Y, ax, false)
      liner.rotation.z = PI / 2
      wheel(e, g, mm, s * (W / 2 - 0.13), ax, s)
    }
  }

  // The front: grille, headlamps, indicators, bumper and plate, fog lamps; AMBULANCE on the bonnet.
  face(e, g, 1.0, 0.24, body.grille, 0, 0.86, FRONT + 0.004)
  for (const s of [-1, 1]) {
    face(e, g, 0.34, 0.14, body.head, s * 0.7, 0.88, FRONT + 0.005)
    k.box(g, 0.1, 0.05, 0.01, mm.amber, s * 0.88, 0.78, FRONT + 0.003, false)
    k.cyl(g, 0.05, 0.05, 0.02, body.head, s * 0.62, 0.55, FRONT + 0.11, 18).rotation.x = PI / 2
  }
  k.soft(g, W + 0.04, 0.24, 0.2, 0.05, body.trim, 0, 0.55, FRONT + 0.02)
  face(e, g, 0.52, 0.11, mm.plate, 0, 0.6, FRONT + 0.124)
  const bt = face(e, g, 1.2, 0.19, mm.bonnet, 0, 1.18, 2.62)
  bt.rotation.x = -PI / 2 + 0.2
  // The light bar over the cab, its red and blue modules behind the clear lens; beacons at the box's rear corners; side flashers.
  const lb = group(g, 0, ROOF + 0.005, PILLAR + 0.18)
  k.soft(lb, 1.4, 0.06, 0.32, 0.02, body.trim, 0, 0.03, 0)
  for (const [s, mat] of [[-1, mm.beaconRed], [1, mm.beaconBlue]] as const) for (let i = 0; i < 3; i++) k.box(lb, 0.17, 0.06, 0.22, mat, s * (0.12 + i * 0.19), 0.09, 0, false)
  k.box(lb, 0.16, 0.06, 0.22, mm.lamp, 0, 0.09, 0, false)
  k.soft(lb, 1.36, 0.08, 0.28, 0.03, body.glass, 0, 0.1, 0)
  for (const s of [-1, 1]) {
    k.soft(g, 0.16, 0.12, 0.16, 0.03, s < 0 ? mm.beaconRed : mm.beaconBlue, s * (W / 2 - 0.12), ROOF + 0.06, BACK + 0.14)
    for (const zz of [-2.2, -0.2]) k.box(g, 0.01, 0.06, 0.16, s < 0 ? mm.beaconRed : mm.beaconBlue, s * (W / 2 + 0.004), ROOF - 0.2, zz, false)
    k.box(g, 0.01, 0.1, 0.24, mm.lamp, s * (W / 2 + 0.004), ROOF - 0.2, -1.2, false)
  }
  // The roof-mounted air conditioner.
  k.soft(g, 0.9, 0.2, 0.72, 0.06, mm.paint, 0, ROOF + 0.1, -1.4)
  face(e, g, 0.6, 0.12, body.grille, 0, ROOF + 0.1, -1.04)
  // The back: tail lamp clusters up the rear pillars, the bumper with its step, the plate.
  for (const s of [-1, 1]) {
    face(e, g, 0.09, 0.6, body.tail, s * (W / 2 - 0.04), 1.05, BACK - 0.002, PI)
    k.box(g, 0.08, 0.06, 0.01, mm.amber, s * (W / 2 - 0.04), 1.42, BACK - 0.004, false)
  }
  k.soft(g, W, 0.16, 0.14, 0.04, body.trim, 0, 0.44, BACK - 0.02)
  face(e, g, 0.52, 0.11, mm.plate, 0, 0.44, BACK - 0.093, PI)
  // Underbody between the wheels, the fuel tank and exhaust.
  k.box(g, W - 0.5, 0.18, AXLES[0] - AXLES[1] - 1.0, body.under, 0, 0.35, (AXLES[0] + AXLES[1]) / 2)
  rod(e, g, 0.03, 0.8, body.under, -0.45, 0.28, AXLES[1] - 0.8, 'z')

  // On the master plan the compartment can't be looked into; it is built only in the property view.
  if (!ctx.onPlan) compartment(e, g, mm)
  doors(e, g, mm)
  shade.rect(x, y + 0.015, z, W + 0.4, FRONT - BACK + 0.4, yaw, 0.7)
  return g
}
