import { Box3, BoxGeometry, Frustum, Group, Matrix4, Mesh, MeshBasicMaterial, Vector3, type Camera, type MeshStandardMaterial, type Object3D } from 'three'
import { GOLD } from '../../../../../../lib/palette'
import { Kit } from '../../kit'
import { mergeStatic } from '../../optimize'
import type { Lift } from '../../basement'
import type { Lighting, ModelView } from '../../shared'
import { buildCore } from './core'
import { Escalator, shown, SPEED } from './escalator'
import { fitFloor } from './fitout'
import { atriumRibbons, crownChandelier } from './installations'
import { luxuryMaterials } from './luxury'
import { interiorMaterials, scroll } from './materials'
import { buildFloor, clipped, floorCtx, type FloorCtx } from './shell'
import { flushing, washroomRects } from './washroom'
import { Signs } from './signs'
import { shopZones } from './shops'
import { ENV, ESCALATORS, FLOORS, isLettable, LEVELS, ROOF, VOID } from './units'

export { FLOORS } from './units'

/*
 * Terranova Mall's interior, G+4, built into the property view (the master plan keeps the shell's
 * painted interior): each floor a group of its own (floor_G … floor_4, for the level rail's
 * cut-away), its static parts merged into a mesh per material; the lifts riding through every
 * floor and down to the car park; the escalators running in the atrium.
 */

/** Kept whole when a floor merges: everything that moves, is operated, or is found by name. */
const LIVE = /^(door_|drawer_|button_|switch_|liftdoor_|liftcar_|live_|room_|esc_walk_|void_|autoleaf_|info_)/

export interface MallInterior {
  root: Group
  floors: Group[]
  highlights: Map<string, MeshBasicMaterial>
  /** The interior's own materials, which reflect the mall rather than the sky. */
  materials: MeshStandardMaterial[]
  tick: (dt: number, walker: Vector3 | null) => boolean
  liftNear: (p: Vector3) => Lift | null
  /** What the lifts bring down into the car park, by level. */
  basement: Map<-1 | -2, Group>
  setView: (v: ModelView) => void
  zone: (z: string) => string
  /** Each frame: whether the escalators are in view and running (so the stage keeps drawing). */
  frame: (camera: Camera) => boolean
  zoneAt: (x: number, y: number, z: number) => string | null
  /** Light zones of the fitted shops, each borrowing a couple of its gallery's lamps at its door. */
  links: { zone: string; other: string; at: Vector3 }[]
}

const label = (level: number) => (level === 0 ? 'g' : String(level))

export function buildMallInterior(k: Kit, lighting: Lighting, parent: Object3D): MallInterior {
  const root = new Group()
  root.name = 'mall_interior'
  parent.add(root)
  const m = interiorMaterials(k, lighting)
  const lux = luxuryMaterials(k, lighting, m.env)
  const signs = new Signs(lighting)
  const floors: Group[] = []
  const es: FloorCtx[] = []
  const highlights = new Map<string, MeshBasicMaterial>()
  const hotspots: Object3D[][] = []
  const washrooms: { zone: string; rect: [number, number, number, number] }[][] = []
  const shops: { zone: string; rects: [number, number, number, number][] }[][] = []
  const links: MallInterior['links'] = []

  for (const plan of FLOORS) {
    const g = new Group()
    g.name = plan.level === 0 ? 'floor_G' : `floor_${plan.level}`
    root.add(g)
    floors.push(g)
    const e = floorCtx(new Kit(g, k), m, signs, lux, lighting, plan, g)
    es.push(e)
    buildFloor(e)
    fitFloor(e)
    e.shade.build(e.k, g)
    hotspots.push(unitHotspots(e, highlights))
    washrooms.push(washroomRects(e))
    const zones = shopZones(e)
    shops.push(zones)
    for (const z of zones) links.push({ zone: z.zone, other: `mall_${label(plan.level)}`, at: new Vector3(...z.door) })
  }

  const core = buildCore(k, lighting, floors, es)
  root.add(core.cars)

  // The escalators, each in the floor it rises from; the handrails share a material per direction.
  const rails = { up: m.handrail(1), down: m.handrail(1) }
  const escalators = ESCALATORS.map((spec) => {
    const esc = new Escalator(m, spec, spec.up ? rails.up : rails.down, lux)
    floors[spec.from].add(esc.group)
    return esc
  })
  atriumRibbons(es[4], floors[4])
  crownChandelier(es[4], floors[4], VOID[0] + 0.3, VOID[1] - 0.3, VOID[2] + 0.3, VOID[3] - 0.3)

  // Glass panels never overlap much: they merge like the rest instead of a draw call each.
  for (const mat of [m.shopGlass, m.railGlass, lux.glassClear, lux.smokeGlass, lux.amberGlass]) mat.userData.mergeable = true
  for (const g of floors) mergeStatic(g, LIVE)

  let view: ModelView = { level: null, walking: false, room: null }
  let walkLevel: number | null = null
  const roomLevel = (mesh: string | null) => {
    const r = mesh ? /^room_mall_(g|\d)_/.exec(mesh) : null
    return r ? (r[1] === 'g' ? 0 : Number(r[1])) : null
  }
  const focus = () => (view.walking ? walkLevel : (roomLevel(view.room) ?? (view.level !== null && view.level >= 0 ? view.level : null)))
  const apply = () => {
    const f = focus()
    hotspots.forEach((list, level) => {
      for (const o of list) o.visible = !view.walking && level === f
    })
  }
  apply()

  // Where the escalators can be seen from: the atrium's box.
  const atrium = new Box3(new Vector3(VOID[0] - 1, LEVELS[0], VOID[2] - 3), new Vector3(VOID[1] + 1, ROOF, VOID[3] + 3))
  const frustum = new Frustum()
  const pm = new Matrix4()
  let running = false

  return {
    root,
    floors,
    highlights,
    materials: m.all,
    basement: core.basement,
    tick: (dt, walker) => {
      const step = Math.min(dt, 0.1)
      const busy = core.tick(step, walker)
      if (running || walker) {
        for (const esc of escalators) if (shown(esc.group)) esc.tick(step)
        // The handrails travel with the steps.
        scroll(rails.up.map, -SPEED * step)
        scroll(rails.down.map, SPEED * step)
      }
      if (walker) for (const esc of escalators) if (esc.carry(walker, step)) break
      // A flush under way keeps the frames coming until it has finished.
      return busy || flushing()
    },
    liftNear: core.liftNear,
    links,
    setView: (v) => {
      view = v
      if (!v.walking) {
        walkLevel = null
        for (const lift of core.lifts) lift.park(focus() ?? 0)
      }
      apply()
    },
    zone: (z) => {
      const r = /^mall_(g|\d)$/.exec(z)
      if (view.walking && r) {
        const level = r[1] === 'g' ? 0 : Number(r[1])
        if (level !== walkLevel) {
          walkLevel = level
          apply()
        }
      }
      const f = focus()
      // A washroom lights itself (its lamps are on its own switch), as does a fitted shop; any other room, its floor.
      if (/^room_mall_(?:g|\d)_wc_/.test(z)) return z
      if (shops.some((list) => list.some((sh) => sh.zone === z))) return z
      const room = roomLevel(z)
      if (room !== null) return `mall_${label(room)}`
      return z === 'exterior' && f !== null && !view.walking ? `mall_${label(f)}` : z
    },
    frame: (camera) => {
      camera.updateMatrixWorld()
      pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      frustum.setFromProjectionMatrix(pm)
      const p = camera.position
      const indoors = p.x > ENV.x0 - 1 && p.x < ENV.x1 + 1 && p.z > ENV.z0 - 1 && p.z < ENV.z1 + 1 && p.y < ROOF
      // Running while they can be seen: inside the building, or looking into a floor from above.
      running = frustum.intersectsBox(atrium) && (indoors || focus() !== null) && escalators.some((esc) => shown(esc.group))
      return running
    },
    zoneAt: (x, y, z) => {
      if (x < ENV.x0 - 1.2 || x > ENV.x1 + 1.2 || z < ENV.z0 - 1.2 || z > ENV.z1 + 1.2 || y < LEVELS[0] - 0.6 || y > ROOF) return null
      let level = 0
      for (let i = 0; i < LEVELS.length; i++) if (y > LEVELS[i] - 0.6) level = i
      for (const w of washrooms[level]) if (x > w.rect[0] && x < w.rect[1] && z > w.rect[2] && z < w.rect[3]) return w.zone
      for (const sh of shops[level]) if (sh.rects.some((r) => x > r[0] && x < r[1] && z > r[2] && z < r[3])) return sh.zone
      return `mall_${label(level)}`
    },
  }
}

/** Tappable floor areas for the floor's units, its big hall and its galleries: `room_mall_<floor>_<id>`. */
function unitHotspots(e: FloorCtx, highlights: Map<string, MeshBasicMaterial>): Object3D[] {
  const out: Object3D[] = []
  const add = (id: string, rects: [number, number, number, number][], height: number) => {
    const g = new Group()
    g.name = `room_mall_${label(e.level)}_${id.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
    g.userData.height = height
    const mat = new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false })
    for (const r of rects) {
      const poly = clipped(e, r)
      if (poly.length < 3) continue
      const xs = poly.map((p) => p[0])
      const zs = poly.map((p) => p[1])
      const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
      const s = new Mesh(new BoxGeometry(x1 - x0, 0.01, z1 - z0), mat)
      s.position.set((x0 + x1) / 2, e.y + 0.03, (z0 + z1) / 2)
      s.renderOrder = 2
      g.add(s)
    }
    e.g.add(g)
    highlights.set(g.name, mat)
    out.push(g)
  }
  for (const u of e.plan.units) if (isLettable(u) || u.kind === 'lounge') add(u.id, u.rects, e.ceiling)
    else if (u.kind === 'washroom') add(u.id, u.rects, 3.0)
  if (e.plan.hall) add(e.plan.hall.id, e.plan.hall.rects, e.soffit - e.y)
  return out
}
