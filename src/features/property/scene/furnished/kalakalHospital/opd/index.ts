import { Group, MeshBasicMaterial, PointLight, type Camera, type Material, type Mesh, type Object3D } from 'three'
import { Kit } from '../../kit'
import { mergeStatic } from '../../optimize'
import type { LiftHost, ModelView } from '../../shared'
import type { HospitalCtx } from '../building'
import { buildCore } from './core'
import { makeOpdCtx, type OpdCtx, type Room } from './ctx'
import { CEILING, FLOORS, levelAt } from './plan'
import { FITTERS } from './rooms'
import { buildShell } from './shell'
import { buildWayfinding } from './wayfinding'

export { insideOpd } from './plan'

/*
 * The outpatient department, built into the hospital in the property view (the master plan shows
 * the building's painted interiors instead): four floors, each its own group (floor_G … floor_3,
 * for the level rail's cut-away), its rooms fitted out by their fitters (rooms/), its static parts
 * merged into a mesh per material; the core's lifts riding through them all.
 */

/** Parts kept whole when a floor merges: everything that moves, is operated, or is found by name. */
const LIVE = /^(door_|drawer_|switch_|spin_|room_|button_|liftdoor_|liftcar_|info_|goto_|autoleaf_|void_|live_)/
/** Of those, the ones shown only on the floor being looked at (they cost a draw call or two each). */
const LOCAL = /^(door_|drawer_|switch_|info_|goto_)/
/** Pieces smaller than this (radius, m) are a floor's fittings rather than its structure. */
const DETAIL = 0.5

export interface Opd {
  root: Group
  floors: Group[]
  rooms: Room[][]
  highlights: Map<string, MeshBasicMaterial>
  lifts: LiftHost
  /** What is looked at: the floor whose fittings are shown, whose rooms can be tapped. */
  setView: (view: ModelView) => void
  /** The light zone for a zone the viewer asks for (a chosen floor's overview for the open air). */
  zone: (z: string) => string
  /** Each frame with no floor chosen: shows the fittings of the floors the camera is near. */
  frame: (camera: Camera) => boolean
  /** The OPD room (or circulation) a walker at (x, y, z) is in, as a light zone; null outside it. */
  zoneAt: (x: number, y: number, z: number) => string | null
  /** What the main block's lifts bring down into the car park, by basement level. */
  basement: Map<-1 | -2, Group>
}

export function buildOpd(ctx: HospitalCtx, parent: Object3D): Opd {
  const root = new Group()
  root.name = 'outpatient_department'
  parent.add(root)
  const floors: Group[] = []
  const es: OpdCtx[] = []
  const rooms: Room[][] = []
  const highlights = new Map<string, MeshBasicMaterial>()
  for (const plan of FLOORS) {
    const g = new Group()
    g.name = `floor_${plan.label}`
    root.add(g)
    floors.push(g)
    const k = new Kit(g, ctx.k)
    const e = makeOpdCtx(k, ctx.lighting, g, plan, 5100 + plan.level * 97)
    es.push(e)
    const shell = buildShell(e)
    for (const [name, mat] of shell.highlights) highlights.set(name, mat)
    for (const room of shell.rooms) e.byId.set(room.spec.id, room)
    for (const room of shell.rooms) {
      const fit = FITTERS[room.spec.fit]
      if (!fit) continue
      try {
        fit(e, room)
      } catch (err) {
        // A fitter's fault leaves its room empty rather than the hospital unbuilt.
        console.error(`Hospital: fitting ${room.spec.id} on floor ${plan.label} failed`, err)
      }
    }
    rooms.push(shell.rooms)
    overviewLamps(e, g)
  }
  buildWayfinding(es, rooms)
  const core = buildCore(ctx.k, ctx.lighting, floors, es)
  root.add(core.cars)

  // Each floor's static parts into a mesh per material; what stays live, listed for showing.
  const local: Object3D[][] = []
  const hotspots: Object3D[][] = []
  const details: Object3D[][] = []
  for (const g of floors) {
    // Small see-through pieces (glassware, tubing, screens in frames) never overlap one another
    // much: they merge like the rest instead of costing a draw call each.
    g.traverse((o) => {
      const mat = (o as Mesh).material as Material | undefined
      if ((o as Mesh).isMesh && mat && !Array.isArray(mat) && mat.transparent) mat.userData.mergeable = true
    })
    // Fittings and equipment merge apart from the structure (as `detail`): seen from outside or
    // from another floor they are left undrawn.
    mergeStatic(g, LIVE, DETAIL)
    const d: Object3D[] = []
    // The floor's own merged group is the last child mergeStatic added (baked parts have their own).
    const statics = g.children[g.children.length - 1]
    if (statics?.name === 'static') statics.children.forEach((c) => c.userData.detail && d.push(c))
    details.push(d)
    const l: Object3D[] = []
    const h: Object3D[] = []
    const visit = (o: Object3D) => {
      if (LOCAL.test(o.name)) {
        l.push(o)
        return
      }
      if (o.name.startsWith('room_')) {
        h.push(o)
        return
      }
      for (const c of o.children) visit(c)
    }
    visit(g)
    local.push(l)
    hotspots.push(h)
  }

  let view: ModelView = { level: null, walking: false, room: null }
  let walkLevel: number | null = null
  const levelOfRoom = (mesh: string | null) => {
    const m = mesh ? /^room_(?:opd|main)_(g|\d)_/.exec(mesh) : null
    return m ? (m[1] === 'g' ? 0 : Number(m[1])) : null
  }
  const focus = () => (view.walking ? walkLevel : (levelOfRoom(view.room) ?? (view.level !== null && view.level >= 0 ? view.level : null)))
  /** With no floor chosen: the floors the camera is close to and level with, whose fittings show through the glass. */
  let near: boolean[] = [false, false, false, false]
  const apply = () => {
    const f = focus()
    local.forEach((list, level) => {
      for (const o of list) o.visible = level === f
    })
    details.forEach((list, level) => {
      for (const o of list) o.visible = f === null ? near[level] : level === f
    })
    hotspots.forEach((list, level) => {
      for (const o of list) o.visible = !view.walking && level === f
    })
  }
  apply()

  return {
    root,
    floors,
    rooms,
    highlights,
    lifts: core.host,
    basement: core.basement,
    setView: (v) => {
      view = v
      if (!v.walking) {
        walkLevel = null
        // Looking at a floor, the cars wait at it with their doors shut.
        for (const lift of core.lifts) lift.park(focus() ?? 0)
      }
      apply()
    },
    zone: (z) => {
      // Walking into a floor brings its fittings out.
      const m = /^(?:room_(?:opd|main)_|opd_)(g|\d)_/.exec(z)
      if (view.walking && m) {
        const level = m[1] === 'g' ? 0 : Number(m[1])
        if (level !== walkLevel) {
          walkLevel = level
          apply()
        }
      }
      const f = focus()
      return z === 'exterior' && f !== null && !view.walking ? `opd_${f === 0 ? 'g' : f}_overview` : z
    },
    frame: (camera) => {
      if (focus() !== null) return false
      const p = camera.position
      // Within 40 m of the building's middle and less than a storey above or two below a floor.
      const close = Math.hypot(p.x - 1, p.z + 6) < 40
      const next = FLOORS.map((fl) => close && p.y > fl.y - 3 && p.y < fl.y + 7)
      if (next.every((v, i) => v === near[i])) return false
      near = next
      apply()
      return true
    },
    zoneAt: (x, y, z) => {
      const level = levelAt(y)
      if (level < 0 || y > FLOORS[level].y + CEILING + 0.4) return null
      for (const r of rooms[level]) if (x >= r.spec.rect[0] && x <= r.spec.rect[1] && z >= r.spec.rect[2] && z <= r.spec.rect[3]) return r.zone
      return null
    },
  }
}

/**
 * Lamps that light a floor as a whole when it is chosen on the level rail (the rooms' own lamps
 * light them one at a time, as they are opened or walked into): over the hall, the corridors and
 * the lounge, in a zone of their own.
 */
function overviewLamps(e: OpdCtx, g: Group) {
  const spots: [number, number][] = e.level === 0
    ? [[-7, 7.5], [0.5, 3], [-6, -10], [0.3, -10], [0, -19.4], [-9.5, -12], [6, 11]]
    : [[-7, 7.5], [6, 8.5], [-6, -10], [9, -12], [4, -22.5], [12, -2], [1, -2.3]]
  for (const [x, z] of spots) {
    const l = e.lighting.light(new PointLight('#fff2e2', 7, 15, 1.6), 0.6)
    l.position.set(x, e.y + CEILING - 0.4, z)
    l.userData.zone = `opd_${e.level === 0 ? 'g' : e.level}_overview`
    g.add(l)
  }
}
