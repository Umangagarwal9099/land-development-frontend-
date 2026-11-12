import {
  Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, PointLight, Vector3,
  type MeshStandardMaterialParameters,
} from 'three'
import type { EquipmentInfo } from '../../../../../../store/info'
import type { Kit } from '../../kit'
import { paintedMat, type Lighting } from '../../shared'
import type { Paint } from '../../textures'
import { circuit, type Circuit } from '../../kalakalD65/fixtures'
import { makeCtx, type Ctx as ErCtx } from '../erKit'
import type { EmergencyMaterials } from '../emergencyMaterials'
import { ashLaminate, ceramic, epoxy, hisScreen, NAVY, vitrified, wallTile, woodPlank } from './paints'
import { CEILING, type Dir, type DoorSpec, type FloorPlan, type RoomSpec } from './plan'

/*
 * How the OPD is built: the emergency department's workshop (its context, finishes, operated
 * drawers and doors, see ../erKit.ts), with the OPD's own finishes added, and a Room for every room
 * on the plan that its fitter furnishes through.
 */

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/** The OPD's own finishes, made once per model. */
export function opdMaterials(k: Kit, lighting: Lighting, m: EmergencyMaterials) {
  const ctx = { k }
  /** A finish painted at true scale: the canvas covers `size` metres of a surface with metre UVs. */
  const metric = (key: string, paint: Paint, size: number, px: number, params: MeshStandardMaterialParameters) => {
    const mat = paintedMat(ctx, `opd_${key}`, px, px, paint, { ...params } as Partial<MeshStandardMaterial>)
    mat.map!.repeat.set(1 / size, 1 / size)
    return mat
  }
  const glow = (mat: MeshStandardMaterial, day = 0.85) => lighting.glow(mat, day)

  return {
    floor: {
      vinyl: m.vinylLight,
      corridor: metric('corridorVinyl', (g, w, h) => {
        // A warm grey-taupe sheet vinyl, the corridors' and passages'.
        g.fillStyle = '#a49a8f'
        g.fillRect(0, 0, w, h)
        for (let i = 0; i < (w * h) / 12; i++) {
          g.globalAlpha = 0.15 + Math.random() * 0.35
          g.fillStyle = ['#c9c1b6', '#857b70', '#6e655c'][i % 3]
          g.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2)
        }
        g.globalAlpha = 1
      }, 2, 1024, { roughness: 0.32 }),
      vitrified: metric('vitrified', vitrified, 1.6, 1024, { roughness: 0.18, metalness: 0.02 }),
      tile: metric('ceramic', ceramic([168, 170, 168], '#6f716f', 5121), 1.2, 512, { roughness: 0.7 }),
      lab: metric('labVinyl', (g, w, h) => {
        // Pale blue-grey homogeneous vinyl, chemical resistant: the laboratories'.
        g.fillStyle = '#c4cdd2'
        g.fillRect(0, 0, w, h)
        for (let i = 0; i < (w * h) / 12; i++) {
          g.globalAlpha = 0.18 + Math.random() * 0.4
          g.fillStyle = ['#e6ecef', '#9aa7ae', '#7f8d95'][i % 3]
          g.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2)
        }
        g.globalAlpha = 1
      }, 2, 1024, { roughness: 0.3 }),
      conductive: metric('conductive', (g, w, h) => {
        // Homogeneous static-dissipative sheet vinyl, as theatres and imaging rooms are laid: a
        // pale grey-green with fine directional chips and the black carbon veins that carry
        // charge to earth, its 2 m sheets heat-welded with a matching rod.
        g.fillStyle = '#b4bfbc'
        g.fillRect(0, 0, w, h)
        for (let i = 0; i < (w * h) / 9; i++) {
          g.globalAlpha = 0.18 + Math.random() * 0.3
          g.fillStyle = ['#d6dedb', '#97a39f', '#c6cfcc'][i % 3]
          g.fillRect(Math.random() * w, Math.random() * h, 2.2, 0.8)
        }
        g.globalAlpha = 0.5
        g.strokeStyle = '#2c3331'
        g.lineWidth = 0.7
        for (let i = 0; i < 70; i++) {
          let x = Math.random() * w
          let y = Math.random() * h
          g.beginPath()
          g.moveTo(x, y)
          for (let j = 0; j < 4; j++) {
            x += (Math.random() - 0.3) * 26
            y += (Math.random() - 0.5) * 8
            g.lineTo(x, y)
          }
          g.stroke()
        }
        g.globalAlpha = 0.55
        g.fillStyle = '#8e9a96'
        g.fillRect(0, 0, w, 2)
        g.fillRect(0, 0, 2, h)
        g.globalAlpha = 1
      }, 2, 1024, { roughness: 0.22, metalness: 0.02 }),
      service: metric('epoxy', epoxy, 2, 512, { roughness: 0.55 }),
      wood: metric('woodVinyl', woodPlank, 1.2, 1024, { roughness: 0.42 }),
      none: m.vinylLight,
    },
    wallTile: metric('wallTile', wallTile, 1.2, 512, { roughness: 0.22 }),
    /** Pale ash laminate for room doors; the frames in white powder-coated steel. */
    door: std({ map: k.tex.painted(256, 512, ashLaminate), roughness: 0.48 }),
    doorWhite: std({ color: '#eceae5', roughness: 0.45 }),
    frame: std({ color: '#e6e7e5', roughness: 0.4, metalness: 0.2 }),
    /** A theatre's hermetic sliding door: seamless HPL in a pale clinical blue-grey. */
    otLeaf: std({ color: '#d5e0e3', roughness: 0.28, metalness: 0.05 }),
    /** Lead-lined doors: grey enamel. The MRI's RF door: its copper edge. */
    leadDoor: std({ color: '#b9bdc0', roughness: 0.4, metalness: 0.15 }),
    copper: std({ color: '#b87333', metalness: 0.9, roughness: 0.32 }),
    /** Corridor wall protection: a warm grey crash rail; the navy accent of the signage and counters. */
    rail: std({ color: '#b9ada0', roughness: 0.45 }),
    navy: std({ color: NAVY, roughness: 0.5 }),
    concrete: std({ color: '#8d8a85', roughness: 0.92 }),
    /** Counters: white solid surface over an oak-grain front, a navy plinth band. */
    oak: new MeshStandardMaterial({ map: k.tex.finish('oak', 1, 1), color: '#d6b893', roughness: 0.5 }),
    /** Window boards and sills inside. */
    sill: m.solidSurface,
    /** Switch plates: white modular plates, white rockers, an amber locator. */
    switches: {
      plate: std({ color: '#f4f4f1', roughness: 0.35 }),
      rocker: std({ color: '#fafaf8', roughness: 0.3 }),
      dark: std({ color: '#c9cac7', roughness: 0.5 }),
      locator: glow(std({ color: '#ffb347', emissive: '#ff9a1f', emissiveIntensity: 1.2 }), 0.6),
    },
    /** Lit reception and lounge features: a cove, a backlit logo. */
    cove: glow(std({ color: '#ffffff', emissive: '#fff1dc', emissiveIntensity: 1.4 }), 0.6),
    /** Glass that reads as glass from both sides, for internal screens. */
    screenGlass: new MeshPhysicalMaterial({ color: '#d9e6e8', roughness: 0.04, transparent: true, opacity: 0.18, depthWrite: false }),
    leadGlass: new MeshPhysicalMaterial({ color: '#c9d9c9', roughness: 0.05, transparent: true, opacity: 0.32, depthWrite: false }),
    rfGlass: new MeshPhysicalMaterial({ color: '#c8b49c', roughness: 0.2, transparent: true, opacity: 0.36, depthWrite: false }),
    /** A sign or notice painted once per model and shared. */
    sign: (key: string, w: number, h: number, paint: Paint, roughness = 0.45) => paintedMat(ctx, `opdsign_${key}`, w, h, paint, { roughness }),
    /** A lit screen (a display, a workstation), on by day and by night. */
    screen: (key: string, w: number, h: number, paint: Paint, intensity = 0.95) => {
      const mat = paintedMat(ctx, `opdscreen_${key}`, w, h, paint, { roughness: 0.25 })
      if (!mat.emissiveMap) {
        mat.emissiveMap = mat.map
        mat.emissive.set('#ffffff')
        mat.emissiveIntensity = intensity
        glow(mat, 0.9)
      }
      return mat
    },
    /** A workstation's screen in a hospital information system's style. */
    his: (key: string, title: string, kind: 'form' | 'table' | 'image' | 'graph') => {
      let seed = 0
      for (const c of key) seed = (seed * 31 + c.charCodeAt(0)) % 100000
      return hisPaint(ctx, lighting, key, title, kind, seed)
    },
  }
}

function hisPaint(ctx: { k: Kit }, lighting: Lighting, key: string, title: string, kind: 'form' | 'table' | 'image' | 'graph', seed: number) {
  const mat = paintedMat(ctx, `opdhis_${key}`, 512, 320, hisScreen(title, kind, seed), { roughness: 0.25 })
  if (!mat.emissiveMap) {
    mat.emissiveMap = mat.map
    mat.emissive.set('#ffffff')
    mat.emissiveIntensity = 0.85
    lighting.glow(mat, 0.9)
  }
  return mat
}

export type OpdMaterials = ReturnType<typeof opdMaterials>

const shared = new WeakMap<object, OpdMaterials>()

/** The OPD's build context for one floor: the emergency department's, with the OPD's finishes and the floor. */
export interface OpdCtx extends ErCtx {
  o: OpdMaterials
  plan: FloorPlan
  level: number
  /** Finished floor level. */
  y: number
  /** The floor's title, for the information cards ("Third Floor · MRI Scan Room"). */
  floorName: string
  /** Every room on the floor by id, once the shell is built (a fitter finds a room's parts here). */
  byId: Map<string, Room>
}

export function makeOpdCtx(k: Kit, lighting: Lighting, root: Group, plan: FloorPlan, seed: number): OpdCtx {
  const e = makeCtx(k, lighting, root, seed)
  let o = shared.get(k.m)
  if (!o) shared.set(k.m, (o = opdMaterials(k, lighting, e.m)))
  const floorName = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor'][plan.level]
  return { ...e, o, plan, level: plan.level, y: plan.y, floorName, byId: new Map() }
}

/* ---------- a room ---------- */

/** A door as built: where it stands in plan, which way the room is, how wide it is. */
export interface PlacedDoor {
  spec: DoorSpec
  /** Centre of the opening on the wall's centre line. */
  x: number
  z: number
  /** Into the room, and along the wall. */
  n: [number, number]
  u: [number, number]
  w: number
}

/** Unit normal into a room from its side `d`, and the axis the side runs along. */
export const inward = (d: Dir): [number, number] => (d === '-x' ? [1, 0] : d === '+x' ? [-1, 0] : d === '-z' ? [0, 1] : [0, -1])
/** The turn (about y) that points a group's local +z into the room from its side `d`. */
export const yawInto = (d: Dir) => (d === '-x' ? Math.PI / 2 : d === '+x' ? -Math.PI / 2 : d === '-z' ? 0 : Math.PI)

const HOT = new MeshBasicMaterial({ visible: false })
let infoCount = 0

/**
 * A room on the plan, for its fitter: its clear inside (walls' faces), its doors, a group to build
 * in, its lights' circuit and zone, and helpers to stand things on its floor and against its walls.
 * Everything a fitter builds is in floor coordinates (x, z in plan; y up from the floor).
 */
export class Room {
  readonly spec: RoomSpec
  readonly level: number
  /** Finished floor level. */
  readonly y: number
  readonly x0: number
  readonly x1: number
  readonly z0: number
  readonly z1: number
  readonly group = new Group()
  /** The hotspot's name, and the light zone of its lamps. */
  readonly mesh: string
  readonly zone: string
  readonly circuit: Circuit = circuit()
  readonly doors: PlacedDoor[] = []
  /** Sides that are the building's façade (windows, from 0.9 m up), not a wall of ours. */
  readonly exterior: Dir[]
  /** The ceiling's height above the floor. */
  readonly ceiling: number
  private e: OpdCtx

  constructor(e: OpdCtx, spec: RoomSpec, inset: Record<Dir, number>, exterior: Dir[], mesh: string, zone: string) {
    this.e = e
    this.spec = spec
    this.level = e.level
    this.y = e.y
    const [x0, x1, z0, z1] = spec.rect
    this.x0 = x0 + inset['-x']
    this.x1 = x1 - inset['+x']
    this.z0 = z0 + inset['-z']
    this.z1 = z1 - inset['+z']
    this.exterior = exterior
    this.ceiling = spec.height ?? CEILING
    this.mesh = mesh
    this.zone = zone
    this.group.name = `${spec.dept ?? 'opd'}_${spec.id}`
    e.root.add(this.group)
  }

  get cx() {
    return (this.x0 + this.x1) / 2
  }
  get cz() {
    return (this.z0 + this.z1) / 2
  }
  /** Clear width along x, and depth along z. */
  get w() {
    return this.x1 - this.x0
  }
  get d() {
    return this.z1 - this.z0
  }
  get name() {
    return this.spec.name
  }
  /** "First Floor · Cardiology", for the information cards. */
  get place() {
    return `${this.e.floorName} · ${this.spec.name}`
  }

  /** A group standing on the floor at (x, z), turned ry (its +z the way its front faces), `dy` up. */
  at(x: number, z: number, ry = 0, dy = 0) {
    const g = new Group()
    g.position.set(x, this.y + dy, z)
    g.rotation.y = ry
    this.group.add(g)
    return g
  }

  /**
   * A group on the inside face of side `d`, `along` it (z for the x sides, x for the z sides),
   * `dy` above the floor and `out` off the wall: its +z points into the room, its +x along the wall
   * to the right as one faces the wall... from the room (so things built facing +z face the room).
   */
  onWall(d: Dir, along: number, dy = 0, out = 0) {
    const [nx, nz] = inward(d)
    const base = d === '-x' ? this.x0 : d === '+x' ? this.x1 : d === '-z' ? this.z0 : this.z1
    const x = nx !== 0 ? base + nx * out : along
    const z = nz !== 0 ? base + nz * out : along
    return this.at(x, z, yawInto(d), dy)
  }

  /** The length of side `d` inside, and where it starts (its low end). */
  side(d: Dir): [number, number] {
    return d === '-x' || d === '+x' ? [this.z0, this.z1] : [this.x0, this.x1]
  }

  /** Whether (x, z) is clear of every door's swing and its approach (r: the thing's half size). */
  clear(x: number, z: number, r = 0.3) {
    for (const d of this.doors) {
      const reach = d.w + 0.35
      const dx = x - d.x
      const dz = z - d.z
      const a = dx * d.u[0] + dz * d.u[1]
      const o = dx * d.n[0] + dz * d.n[1]
      if (Math.abs(a) < d.w / 2 + 0.25 + r && o > -0.2 && o < reach + r) return false
    }
    return true
  }

  /**
   * A lamp of the room's own: a point light at the ceiling over (x, z), on the room's circuit and in
   * its light zone. A few per room model the light; the panels' glow carries the rest.
   */
  lamp(x: number, z: number, intensity = 4, distance = 8, colour = '#fff3e4') {
    const l = this.e.lighting.light(new PointLight(colour, intensity, distance, 2), 1)
    l.position.set(x, this.y + this.ceiling - 0.3, z)
    l.userData.zone = this.zone
    this.group.add(l)
    this.circuit.lights.push(l)
    return l
  }

  /**
   * Makes `target` (built already) explain itself when tapped: an invisible volume round it named
   * info_*, carrying the card's content. A walker reaches for it at `reach` (plan x, height above
   * the floor, z), by default its face towards the middle of the room.
   */
  info(target: Object3D, info: Omit<EquipmentInfo, 'place'> & { place?: string }, reach?: [number, number, number], pad = 0.04) {
    this.group.updateMatrixWorld(true)
    const box = new Box3().setFromObject(target)
    if (box.isEmpty()) return null
    box.expandByScalar(pad)
    const size = box.getSize(new Vector3())
    const c = box.getCenter(new Vector3())
    const hit = new Mesh(new BoxGeometry(size.x, size.y, size.z), HOT)
    hit.position.copy(c)
    hit.name = `info_${this.spec.dept ?? 'opd'}_${this.level}_${this.spec.id}_${infoCount++}`
    hit.userData.info = { ...info, place: info.place ?? this.place }
    hit.castShadow = false
    hit.receiveShadow = false
    const marker = new Object3D()
    if (reach) marker.position.set(reach[0] - c.x, this.y + reach[1] - c.y, reach[2] - c.z)
    else {
      // The face of the box nearest the room's middle, at waist height (or the top of a low thing).
      const dx = this.cx - c.x
      const dz = this.cz - c.z
      const along = Math.abs(dx) / Math.max(size.x, 0.01) > Math.abs(dz) / Math.max(size.z, 0.01)
      const px = along ? Math.sign(dx) * (size.x / 2 + 0.05) : 0
      const pz = along ? 0 : Math.sign(dz) * (size.z / 2 + 0.05)
      marker.position.set(px, Math.min(box.max.y, this.y + 1.1) - c.y, pz)
    }
    marker.userData.reach = true
    hit.add(marker)
    this.group.add(hit)
    return hit
  }
}
