import {
  AdditiveBlending, BoxGeometry, BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Path, PlaneGeometry,
  PointLight, Shape, ShapeGeometry, type Material, type Object3D, type Texture,
} from 'three'
import { GOLD } from '../../../../../lib/palette'
import type { Body } from '../car'
import type { Kit } from '../kit'
import { Contact } from '../kalakalMall/contact'
import type { Lighting } from '../shared'
import { parkFleet, type Parked } from './fleet'
import { LEVEL_COLOUR, type BasementMaterials } from './materials'
import {
  board, COLUMN_ATLAS, columnAtlas, exitSign, floorArrow, floorWord, levelMark, lightWash, NUMBER_ATLAS, numberAtlas, redLabel, roundSign, stain, tyreArc,
} from './paints'
import {
  aislesOn, axisOf, B1, bays, obstacles, centre, COLUMN, columns, inside, LEVEL_Y, overlaps, rampLength, rampPoint, rampRect, rampY, signOf, SLAB, WALL,
  type BasementSpec, type Bay, type Column, type Dir, type Level, type RampSpec, type Rect,
} from './spec'

type R = [number, number]
export interface Site {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

const PI = Math.PI
/** Yaw turning a piece's local +z to point along `d`. */
const yawOf = (d: Dir) => ({ '+z': 0, '-z': PI, '+x': PI / 2, '-x': -PI / 2 })[d]
const vec = (d: Dir): R => (axisOf(d) === 'x' ? [signOf(d), 0] : [0, signOf(d)])
const LENGTH: Record<Body, number> = { crossover: 4.32, sedan: 4.55, hatch: 3.85, suv: 4.75, mpv: 4.4 }

/** Soft decals on the floor, one mesh per kind: oil stains, tyre arcs and the wash of light under the battens. */
export class Decals {
  private sets = new Map<string, { pos: number[]; uv: number[] }>()
  add(kind: string, x: number, y: number, z: number, w: number, d: number, yaw: number) {
    let s = this.sets.get(kind)
    if (!s) this.sets.set(kind, (s = { pos: [], uv: [] }))
    const c = Math.cos(yaw)
    const sn = Math.sin(yaw)
    const at = (u: number, v: number) => [x + u * c + v * sn, y, z - u * sn + v * c]
    const q = [at(-w / 2, d / 2), at(w / 2, d / 2), at(w / 2, -d / 2), at(-w / 2, -d / 2)]
    const uv = [[0, 0], [1, 0], [1, 1], [0, 1]]
    for (const i of [0, 1, 2, 0, 2, 3]) {
      s.pos.push(...q[i])
      s.uv.push(...uv[i])
    }
  }
  build(parent: Object3D, kind: string, map: Texture, colour: string, opacity: number, additive = false) {
    const s = this.sets.get(kind)
    if (!s) return
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(s.pos, 3))
    g.setAttribute('uv', new Float32BufferAttribute(s.uv, 2))
    g.computeVertexNormals()
    const mat = new MeshBasicMaterial({
      color: colour, alphaMap: map, transparent: true, opacity, depthWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
      toneMapped: !additive,
    })
    if (additive) mat.blending = AdditiveBlending
    const m = new Mesh(g, mat)
    m.name = `decal_${kind}`
    m.renderOrder = 1
    m.raycast = () => {}
    parent.add(m)
  }
}

export interface Ctx {
  k: Kit
  m: BasementMaterials
  spec: BasementSpec
  lighting: Lighting
  shade: Contact
  decals: Decals
  r: () => number
}

function bx({ k }: Ctx, p: Object3D, [x0, x1]: R, [y0, y1]: R, [z0, z1]: R, mat: Material | Material[], cast = true) {
  if (x1 - x0 < 1e-3 || y1 - y0 < 1e-3 || z1 - z0 < 1e-3) return null
  return k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

const planes = new Map<string, PlaneGeometry>()
const planeGeo = (w: number, h: number) => {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}`
  let g = planes.get(key)
  if (!g) planes.set(key, (g = new PlaneGeometry(w, h)))
  return g
}

/** An upright sign w × h facing `yaw` (its front along local +z); `double` adds a back face. */
function sign(p: Object3D, w: number, h: number, mat: Material, x: number, y: number, z: number, yaw: number, back?: Material) {
  const front = new Mesh(planeGeo(w, h), mat)
  front.position.set(x + Math.sin(yaw) * 0.012, y, z + Math.cos(yaw) * 0.012)
  front.rotation.y = yaw
  front.receiveShadow = true
  p.add(front)
  if (back) {
    const b = new Mesh(planeGeo(w, h), back)
    b.position.set(x - Math.sin(yaw) * 0.012, y, z - Math.cos(yaw) * 0.012)
    b.rotation.y = yaw + PI
    p.add(b)
  }
}

/** A flat marking on the floor, w across × d along, its top (+v of the texture) pointing `yaw`. */
function floorMark(p: Object3D, geo: BufferGeometry, mat: Material, x: number, y: number, z: number, yaw: number) {
  const o = new Mesh(geo, mat)
  // Laid flat (local +z up), then turned so the texture's top points along yaw.
  o.rotation.set(-PI / 2, yaw + PI, 0, 'YXZ')
  o.position.set(x, y, z)
  o.receiveShadow = true
  p.add(o)
  return o
}

/** A plan rectangle with holes, as a horizontal surface at y facing up (or down for a ceiling). */
function slabSurface(box: Rect, holes: Rect[], y: number, mat: Material, down: boolean) {
  // Shape in (x, z) for a ceiling turned face-down, (x, −z) for a floor turned face-up.
  const f = down ? 1 : -1
  const ring = (r: Rect, s: Shape | Path) => {
    s.moveTo(r.x0, f * r.z0)
    s.lineTo(r.x1, f * r.z0)
    s.lineTo(r.x1, f * r.z1)
    s.lineTo(r.x0, f * r.z1)
    s.closePath()
  }
  const shape = new Shape()
  ring(box, shape)
  for (const h of holes) {
    const c = { x0: Math.max(h.x0, box.x0 + 0.01), x1: Math.min(h.x1, box.x1 - 0.01), z0: Math.max(h.z0, box.z0 + 0.01), z1: Math.min(h.z1, box.z1 - 0.01) }
    if (c.x1 <= c.x0 || c.z1 <= c.z0) continue
    const path = new Path()
    ring(c, path)
    shape.holes.push(path)
  }
  const g = new ShapeGeometry(shape)
  g.rotateX(down ? PI / 2 : -PI / 2)
  const m = new Mesh(g, mat)
  m.position.y = y
  m.receiveShadow = true
  m.castShadow = false
  return m
}

/** Spans of [a, b] left once `cuts` are taken out. */
function subtract([a, b]: R, cuts: R[]): R[] {
  let out: R[] = [[a, b]]
  for (const [c0, c1] of cuts) out = out.flatMap(([p, q]): R[] => (c1 <= p || c0 >= q ? [[p, q]] : ([[p, c0], [c1, q]] as R[]).filter(([s, t]) => t - s > 0.05)))
  return out
}

/** Columns: one atlas cell per column (hazard foot, level band, grid reference), merged into one mesh. */
function buildColumns(ctx: Ctx, p: Object3D, level: Level, cols: Column[], y: number, h: number) {
  const n = COLUMN_ATLAS.cols * COLUMN_ATLAS.rows
  const mat = ctx.m.painted(`cols${level}`, 2048, 2048, columnAtlas(cols.slice(0, n).map((c) => c.label), `B${-level}`, LEVEL_COLOUR[level]), { roughness: 0.75 })
  cols.forEach((c, i) => {
    const g = new BoxGeometry(COLUMN, h, COLUMN)
    const uv = g.getAttribute('uv')
    const cell = i % n
    const u0 = (cell % COLUMN_ATLAS.cols) / COLUMN_ATLAS.cols
    const v0 = 1 - (Math.floor(cell / COLUMN_ATLAS.cols) + 1) / COLUMN_ATLAS.rows
    // Faces in BoxGeometry order: +x, −x, +y, −y, +z, −z, four vertices each.
    for (let j = 0; j < uv.count; j++) {
      const face = Math.floor(j / 4)
      const top = face === 2 || face === 3
      uv.setXY(j, u0 + (top ? 0.5 : uv.getX(j)) / COLUMN_ATLAS.cols, v0 + (top ? 0.97 : uv.getY(j) * (h / 3)) / COLUMN_ATLAS.rows)
    }
    const o = new Mesh(g, mat)
    o.position.set(c.x, y + h / 2, c.z)
    o.castShadow = true
    o.receiveShadow = true
    p.add(o)
    const s = COLUMN / 2
    ctx.shade.edge([[c.x - s, c.z - s], [c.x + s, c.z - s], [c.x + s, c.z + s], [c.x - s, c.z + s]], y + 0.004, 0.32, -1, 0.5, true)
  })
}

/**
 * Walls round a plan rectangle (a core or a plant room) from y0 to y1, with an opening `open`
 * wide and `openH` high centred in the side facing `door`.
 */
function enclose(ctx: Ctx, p: Object3D, r: Rect, door: Dir, open: number, openH: number, y0: number, y1: number, mat: Material) {
  const T = 0.2
  const sides: { d: Dir; xs: R; zs: R }[] = [
    { d: '-z', xs: [r.x0, r.x1], zs: [r.z0, r.z0 + T] },
    { d: '+z', xs: [r.x0, r.x1], zs: [r.z1 - T, r.z1] },
    { d: '-x', xs: [r.x0, r.x0 + T], zs: [r.z0 + T, r.z1 - T] },
    { d: '+x', xs: [r.x1 - T, r.x1], zs: [r.z0 + T, r.z1 - T] },
  ]
  const [cx, cz] = centre(r)
  for (const s of sides) {
    if (s.d !== door) {
      bx(ctx, p, s.xs, [y0, y1], s.zs, mat)
      continue
    }
    if (axisOf(s.d) === 'z') {
      for (const xs of subtract(s.xs, [[cx - open / 2, cx + open / 2]])) bx(ctx, p, xs, [y0, y1], s.zs, mat)
      bx(ctx, p, [cx - open / 2, cx + open / 2], [y0 + openH, y1], s.zs, mat)
    } else {
      for (const zs of subtract(s.zs, [[cz - open / 2, cz + open / 2]])) bx(ctx, p, s.xs, [y0, y1], zs, mat)
      bx(ctx, p, s.xs, [y0 + openH, y1], [cz - open / 2, cz + open / 2], mat)
    }
  }
  ctx.shade.edge([[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]], y0 + 0.004, 0.45, -1, 0.5, true)
}

/** Where a door in side `door` of r is, and the outward direction. */
function doorAt(r: Rect, door: Dir): { x: number; z: number; out: R; yaw: number } {
  const [cx, cz] = centre(r)
  const out = vec(door)
  const x = axisOf(door) === 'x' ? (signOf(door) > 0 ? r.x1 : r.x0) : cx
  const z = axisOf(door) === 'z' ? (signOf(door) > 0 ? r.z1 : r.z0) : cz
  return { x, z, out, yaw: yawOf(door) }
}

/* ---------- a storey ---------- */

export interface Storey {
  group: Group
  hotspot: Group
  highlight: MeshBasicMaterial
}

export function buildStorey(ctx: Ctx, level: Level, site: Site): Storey {
  const { spec, m, k, shade, decals } = ctx
  const group = new Group()
  group.name = `storey_B${-level}`
  // What hangs from the soffit (beams, battens, ducts, pipes, hanging signs): shown only with the
  // camera inside the level, so the cut-away view from above reads as a clear plan.
  const overhead = new Group()
  overhead.name = 'overhead'
  group.add(overhead)
  const y = LEVEL_Y[level]
  const top = level === -1 ? 0 : B1
  const soffit = top - SLAB
  const H = soffit - y
  const box = spec.box
  const below = spec.ramps.filter((r) => r.from === level)
  const above = spec.ramps.filter((r) => r.from === level + 1)

  // The cut-away earth round the level, like the base of a section model, and the raft under it:
  // for the views from above only (it is neither shown nor solid to a walker).
  const earth = new Group()
  earth.name = 'earth'
  group.add(earth)
  const eb = y - 0.8
  const outer = { x0: box.x0 - WALL, x1: box.x1 + WALL, z0: box.z0 - WALL, z1: box.z1 + WALL }
  bx(ctx, earth, [site.minX, site.maxX], [eb, top], [site.minZ, outer.z0], m.earth, false)
  bx(ctx, earth, [site.minX, site.maxX], [eb, top], [outer.z1, site.maxZ], m.earth, false)
  bx(ctx, earth, [site.minX, outer.x0], [eb, top], [outer.z0, outer.z1], m.earth, false)
  bx(ctx, earth, [outer.x1, site.maxX], [eb, top], [outer.z0, outer.z1], m.earth, false)
  bx(ctx, earth, [outer.x0, outer.x1], [eb, y - SLAB], [outer.z0, outer.z1], m.earth, false)
  bx(ctx, earth, [outer.x0, outer.x1], [y - SLAB, y - 0.01], [outer.z0, outer.z1], m.cut, false)

  // Floor and soffit, open where ramps pass through and over the lift and stair core.
  const core = spec.access.rect
  group.add(slabSurface(box, [...below.map((r) => rampRect(r)), core], y, m.floor, false))
  const ceiling = slabSurface(box, [...above.map((r) => rampRect(r)), core], soffit, m.soffit, true)
  ceiling.name = 'ceiling'
  overhead.add(ceiling)

  // Retaining walls, painted to 2.4 m in the level's colour; the slab's cut edge above.
  const lenX = box.x1 - box.x0
  const lenZ = box.z1 - box.z0
  const wallMats = (face: number, len: number) => Array.from({ length: 6 }, (_, i) => (i === face ? m.wall(level, len) : m.cut))
  bx(ctx, group, [outer.x0, box.x0], [y, soffit], [box.z0, box.z1], wallMats(0, lenZ))
  bx(ctx, group, [box.x1, outer.x1], [y, soffit], [box.z0, box.z1], wallMats(1, lenZ))
  bx(ctx, group, [outer.x0, outer.x1], [y, soffit], [outer.z0, box.z0], wallMats(4, lenX))
  bx(ctx, group, [outer.x0, outer.x1], [y, soffit], [box.z1, outer.z1], wallMats(5, lenX))
  for (const [xs, zs] of [[[outer.x0, outer.x1], [outer.z0, box.z0]], [[outer.x0, outer.x1], [box.z1, outer.z1]], [[outer.x0, box.x0], [box.z0, box.z1]], [[box.x1, outer.x1], [box.z0, box.z1]]] as [R, R][])
    bx(ctx, group, xs, [soffit, top], zs, m.cut, false)
  shade.edge([[box.x0, box.z0], [box.x1, box.z0], [box.x1, box.z1], [box.x0, box.z1]], y + 0.004, 0.6, 1, 0.55, true)

  // Columns, beams on the grid lines under the slab.
  const cols = columns(spec, level)
  buildColumns(ctx, group, level, cols, y, H)
  const holes = [...above.map((r) => rampRect(r)), core]
  const BW = 0.4
  const BD = 0.6
  for (const z of spec.colZ) {
    if (z < box.z0 || z > box.z1) continue
    for (const xs of subtract([box.x0, box.x1], holes.filter((h) => z > h.z0 - BW && z < h.z1 + BW).map((h): R => [h.x0, h.x1])))
      bx(ctx, overhead, xs, [soffit - BD, soffit], [z - BW / 2, z + BW / 2], m.concrete, false)
  }
  for (const x of spec.colX) {
    if (x < box.x0 || x > box.x1) continue
    for (const zs of subtract([box.z0, box.z1], holes.filter((h) => x > h.x0 - BW && x < h.x1 + BW).map((h): R => [h.z0, h.z1])))
      bx(ctx, overhead, [x - BW / 2, x + BW / 2], [soffit - BD, soffit], zs, m.concrete, false)
  }
  const nearBeam = (x: number, z: number) => spec.colZ.some((c) => Math.abs(c - z) < 0.45) || spec.colX.some((c) => Math.abs(c - x) < 0.45)

  // Guard walls round the openings of the ramps going down from this level.
  for (const r of below) {
    const rr = rampRect(r)
    const L = rampLength(r)
    for (const t of [0, 1]) {
      const [ax, az] = rampPoint(r, 0, t)
      const [bx_, bz] = rampPoint(r, L, t)
      const off = t ? 0.1 : -0.1
      const xs: R = axisOf(r.down) === 'x' ? [Math.min(ax, bx_), Math.max(ax, bx_)] : [ax + off - 0.1, ax + off + 0.1]
      const zs: R = axisOf(r.down) === 'z' ? [Math.min(az, bz), Math.max(az, bz)] : [az + off - 0.1, az + off + 0.1]
      bx(ctx, group, xs, [y, y + 1.1], zs, m.blockwork)
      bx(ctx, group, xs, [y + 0.1, y + 0.5], axisOf(r.down) === 'x' ? [zs[0] - 0.005, zs[1] + 0.005] : zs, m.hazard, false)
    }
    // Across the far end.
    const end = r.s0 + signOf(r.down) * L
    if (axisOf(r.down) === 'x') bx(ctx, group, [end - 0.1, end + 0.1], [y, y + 1.1], [rr.z0, rr.z1], m.blockwork)
    else bx(ctx, group, [rr.x0, rr.x1], [y, y + 1.1], [end - 0.1, end + 0.1], m.blockwork)
  }

  // Cores and plant rooms.
  for (const core of spec.cores) buildCore(ctx, group, core, level, y, soffit)
  for (const room of spec.rooms.filter((rm) => rm.levels.includes(level))) {
    enclose(ctx, group, room.rect, room.door, 1.5, 2.1, y, soffit, m.blockwork)
    const d = doorAt(room.rect, room.door)
    bx(ctx, group, ...doorBox(d, 1.5, y, 2.1), m.fireDoor)
    sign(group, 1.6, 0.3, m.painted(`room_${room.label}`, 512, 96, redLabel(room.label)), d.x + d.out[0] * 0.11, y + 2.4, d.z + d.out[1] * 0.11, d.yaw)
  }

  // Parking: bays, markings, cars.
  const bayList = bays(spec, level, cols)
  buildBays(ctx, group, level, bayList, y)

  // Aisles: arrows, tyre polish at the turns, light washes and battens over them.
  const arrowGeo = new PlaneGeometry(1.0, 2.2)
  const arrowMat = m.painted('arrow', 128, 256, floorArrow, { alphaTest: 0.5, roughness: 0.7 })
  for (const a of aislesOn(spec, level)) {
    const { rect } = a
    const ax = rect.x1 - rect.x0 > rect.z1 - rect.z0 ? 'x' : 'z'
    const len = ax === 'x' ? rect.x1 - rect.x0 : rect.z1 - rect.z0
    const [cx, cz] = centre(rect)
    const at = (s: number, off = 0): R => (ax === 'x' ? [rect.x0 + s, cz + off] : [cx + off, rect.z0 + s])
    for (let s = 6; s < len - 4; s += 12) {
      if (a.flow) {
        const [x, z] = at(s)
        floorMark(group, arrowGeo, arrowMat, x, y + 0.004, z, yawOf(a.flow))
      } else {
        const p = ax === 'x' ? (['+x', '-x'] as Dir[]) : (['+z', '-z'] as Dir[])
        const [x1, z1] = at(s, -1.4)
        const [x2, z2] = at(s + 4, 1.4)
        floorMark(group, arrowGeo, arrowMat, x1, y + 0.004, z1, yawOf(ax === 'x' ? p[1] : p[0]))
        floorMark(group, arrowGeo, arrowMat, x2, y + 0.004, z2, yawOf(ax === 'x' ? p[0] : p[1]))
      }
    }
    if (!a.flow) {
      // Dashed yellow centre line.
      for (let s = 0.5; s < len - 0.5; s += 3) {
        const [x, z] = at(s + 0.75)
        if (ax === 'x') bx(ctx, group, [x - 0.75, x + 0.75], [y + 0.001, y + 0.005], [z - 0.05, z + 0.05], m.yellowLine, false)
        else bx(ctx, group, [x - 0.05, x + 0.05], [y + 0.001, y + 0.005], [z - 0.75, z + 0.75], m.yellowLine, false)
      }
    }
    // Tyre polish where cars swing round at each end.
    for (const [s, yaw] of [[2.5, 0], [len - 2.5, PI]] as const) {
      const [x, z] = at(s)
      if (ctx.r() < 0.6) decals.add('tyre', x, y + 0.003, z, 5, 5, yaw + (ax === 'x' ? 0 : PI / 2) + ctx.r() * 0.6)
    }
    // A row of LED battens down the aisle on drop rods, under the beams; jet fans every ~18 m.
    for (let s = 1.5; s < len - 1; s += 3) {
      const [x, z] = at(s)
      if (nearBeam(x, z)) continue
      batten(ctx, overhead, x, soffit, z, ax === 'x' ? PI / 2 : 0)
      decals.add('wash', x, y + 0.002, z, 3.2, 4.2, ax === 'x' ? PI / 2 : 0)
    }
    for (let s = 9; s < len - 4; s += 18) {
      const [x, z] = at(s, 1.2)
      jetFan(ctx, overhead, x, soffit, z, ax === 'x' ? PI / 2 : 0)
    }
    // Sprinkler main along the aisle, smoke detectors on the soffit.
    const [mx0, mz0] = at(0.3, -2.2)
    const [mx1, mz1] = at(len - 0.3, -2.2)
    pipe(ctx, overhead, mx0, soffit - 0.15, mz0, mx1, soffit - 0.15, mz1, 0.05, m.sprinklerRed)
    for (let s = 3; s < len - 2; s += 7) {
      const [x, z] = at(s, 2.2)
      k.cyl(overhead, 0.065, 0.065, 0.045, m.white, x, soffit - 0.03, z, 16)
    }
    // Hanging signs facing the traffic, a third and two thirds along (not over a short link).
    if (len > 12) hangingSigns(ctx, overhead, a.rect, ax, soffit)
  }

  // Over the rows: battens, sprinkler branches with pendant heads, kept out of the cores, plant
  // rooms and ramp wells (nothing may run through a lift shaft or over a stair).
  const keepOut = obstacles(spec, level)
  const clear = (...pts: R[]) => pts.every(([x, z]) => !keepOut.some((o) => inside(o, x, z, 0.35)))
  for (const row of spec.rows) {
    if (row.levels && !row.levels.includes(level)) continue
    if (obstacleHit(spec, level, row.rect)) continue
    const along = row.parallel ? axisOf(row.face) : axisOf(row.face) === 'x' ? 'z' : 'x'
    const [cx, cz] = centre(row.rect)
    const [a0, a1] = along === 'x' ? [row.rect.x0, row.rect.x1] : [row.rect.z0, row.rect.z1]
    for (let s = a0 + 2.5; s < a1 - 1; s += 5) {
      const [x, z] = along === 'x' ? [s, cz] : [cx, s]
      if (!nearBeam(x, z) && clear([x, z])) batten(ctx, overhead, x, soffit, z, along === 'x' ? PI / 2 : 0)
    }
    for (let s = a0 + 1.5; s < a1 - 0.5; s += 3) {
      const [x, z] = along === 'x' ? [s, cz] : [cx, s]
      const half = 2.2
      const [p0, p1]: [R, R] = along === 'x' ? [[x, z - half], [x, z + half]] : [[x - half, z], [x + half, z]]
      if (!clear(p0, p1, [x, z])) continue
      pipe(ctx, overhead, p0[0], soffit - 0.12, p0[1], p1[0], soffit - 0.12, p1[1], 0.022, m.sprinklerRed)
      for (const t of [0.25, 0.75]) {
        const hx = p0[0] + (p1[0] - p0[0]) * t
        const hz = p0[1] + (p1[1] - p0[1]) * t
        k.cyl(overhead, 0.012, 0.012, 0.09, m.brass, hx, soffit - 0.17, hz, 8)
        k.cyl(overhead, 0.03, 0.03, 0.004, m.brass, hx, soffit - 0.22, hz, 12)
      }
    }
  }

  // Ventilation: an exhaust duct along the long side wall with its grilles, into a louvred shaft.
  const longX = lenX >= lenZ
  const dz = longX ? box.z0 + 0.6 : 0
  const dx = longX ? 0 : box.x1 - 0.6
  const dY = soffit - BD - 0.2
  if (longX) {
    bx(ctx, overhead, [box.x0 + 1.2, box.x1 - 1.2], [dY - 0.18, dY + 0.18], [dz - 0.45, dz + 0.45], m.galvanised, false)
    for (let x = box.x0 + 3; x < box.x1 - 2; x += 6) sign(overhead, 0.6, 0.25, m.louvre, x, dY, dz + 0.452, 0)
  } else {
    bx(ctx, overhead, [dx - 0.45, dx + 0.45], [dY - 0.18, dY + 0.18], [box.z0 + 1.2, box.z1 - 1.2], m.galvanised, false)
    for (let z = box.z0 + 3; z < box.z1 - 2; z += 6) sign(overhead, 0.6, 0.25, m.louvre, dx - 0.452, dY, z, -PI / 2)
  }
  // The exhaust shaft's louvre in the wall at the duct's end, and a fresh-air louvre opposite.
  if (longX) {
    sign(overhead, 1.8, 1.2, m.louvre, box.x1 - 0.01, soffit - 1.0, box.z0 + 1.2, -PI / 2)
    sign(overhead, 1.8, 1.2, m.louvre, box.x0 + 0.01, soffit - 1.0, box.z1 - 1.5, PI / 2)
  } else {
    sign(overhead, 1.8, 1.2, m.louvre, box.x1 - 1.2, soffit - 1.0, box.z0 + 0.01, 0)
    sign(overhead, 1.8, 1.2, m.louvre, box.x0 + 1.5, soffit - 1.0, box.z1 - 0.01, PI)
  }
  // Cable tray on brackets along the opposite wall, its cables in it.
  const tY = soffit - BD - 0.15
  if (longX) {
    const tz = box.z1 - 0.35
    bx(ctx, overhead, [box.x0 + 0.8, box.x1 - 0.8], [tY - 0.01, tY], [tz - 0.15, tz + 0.15], m.galvanised, false)
    for (const s of [-0.15, 0.15]) bx(ctx, overhead, [box.x0 + 0.8, box.x1 - 0.8], [tY, tY + 0.06], [tz + s - 0.005, tz + s + 0.005], m.galvanised, false)
    for (const [i, c] of [m.cable, m.pvc, m.cable].entries()) pipe(ctx, overhead, box.x0 + 0.8, tY + 0.025, tz - 0.08 + i * 0.08, box.x1 - 0.8, tY + 0.025, tz - 0.08 + i * 0.08, 0.02, c)
    for (let x = box.x0 + 1; x < box.x1 - 0.5; x += 2) bx(ctx, overhead, [x - 0.02, x + 0.02], [tY - 0.04, soffit], [tz - 0.18, tz + 0.18 + 0.17], m.steel, false)
  } else {
    const tx = box.x0 + 0.35
    bx(ctx, overhead, [tx - 0.15, tx + 0.15], [tY - 0.01, tY], [box.z0 + 0.8, box.z1 - 0.8], m.galvanised, false)
    for (const s of [-0.15, 0.15]) bx(ctx, overhead, [tx + s - 0.005, tx + s + 0.005], [tY, tY + 0.06], [box.z0 + 0.8, box.z1 - 0.8], m.galvanised, false)
    for (const [i, c] of [m.cable, m.pvc, m.cable].entries()) pipe(ctx, overhead, tx - 0.08 + i * 0.08, tY + 0.025, box.z0 + 0.8, tx - 0.08 + i * 0.08, tY + 0.025, box.z1 - 0.8, 0.02, c)
    for (let z = box.z0 + 1; z < box.z1 - 0.5; z += 2) bx(ctx, overhead, [tx - 0.18 - 0.17, tx + 0.18], [tY - 0.04, soffit], [z - 0.02, z + 0.02], m.steel, false)
  }

  // On the columns: extinguishers on every third, drain pipes down every fourth, mirrors near ramps.
  cols.forEach((c, i) => {
    const face = nearestAisleFace(spec, c)
    const [ox, oz] = vec(face)
    const fx = c.x + ox * (COLUMN / 2)
    const fz = c.z + oz * (COLUMN / 2)
    if (i % 3 === 0) extinguisher(ctx, group, fx, y, fz, face, i % 6 === 0)
    if (i % 4 === 1) {
      const px = c.x - oz * (COLUMN / 2 + 0.07) + ox * 0.2
      const pz = c.z + ox * (COLUMN / 2 + 0.07) + oz * 0.2
      k.cyl(group, 0.055, 0.055, H, m.pvc, px, y + H / 2, pz, 12)
      k.cyl(group, 0.07, 0.07, 0.12, m.pvc, px, y + 0.5, pz, 12)
    }
  })

  // Lit level markers and CCTV at the ramps' feet and tops on this level.
  for (const r of ctx.spec.ramps.filter((rp) => rp.to === level || rp.from === level)) rampLanding(ctx, group, overhead, r, level, y, soffit)

  // Light: the logical lamps the pool picks from on this level (see LightPool).
  const lamp = (x: number, z: number, intensity: number) => {
    const l = new PointLight('#eef3ff', intensity, 18, 2)
    l.position.set(x, soffit - 0.7, z)
    ctx.lighting.light(l, 1)
    group.add(l)
  }
  for (const c of spec.cores) {
    const d = doorAt(c.rect, c.door)
    lamp(d.x + d.out[0] * 3, d.z + d.out[1] * 3, 8)
  }
  {
    const d = doorAt(core, spec.access.face)
    lamp(d.x + d.out[0] * 2.5, d.z + d.out[1] * 2.5, 10)
  }
  for (const r of spec.ramps.filter((rp) => rp.to === level)) {
    const [x, z] = rampPoint(r, rampLength(r) + 2.5, 0.5)
    lamp(x, z, 8)
  }
  for (const a of aislesOn(spec, level)) {
    const [x, z] = centre(a.rect)
    lamp(x, z, 6)
  }

  // Decals.
  decals.build(group, 'stain', k.tex.painted(128, 128, stain), '#16130f', 0.42)
  decals.build(group, 'tyre', k.tex.painted(256, 256, tyreArc), '#1a1a1a', 0.1)
  decals.build(group, 'wash', k.tex.painted(128, 128, lightWash), '#dce6ff', 0.025, true)

  // The level's hotspot: its parking floor.
  const hotspot = new Group()
  hotspot.name = `amenity_b${-level}`
  hotspot.userData.height = H
  const highlight = new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false })
  const s = new Mesh(new BoxGeometry(box.x1 - box.x0 - 1, 0.01, box.z1 - box.z0 - 1), highlight)
  s.position.set((box.x0 + box.x1) / 2, y + 0.05, (box.z0 + box.z1) / 2)
  s.renderOrder = 2
  hotspot.add(s)
  group.add(hotspot)
  return { group, hotspot, highlight }
}

const obstacleHit = (spec: BasementSpec, level: Level, r: Rect) =>
  spec.ramps.some((rp) => (rp.to === level || rp.from === level) && overlaps(rampRect(rp), r, -1) && inside(rampRect(rp), ...centre(r)))

function doorBox(d: { x: number; z: number; out: R }, w: number, y: number, h: number): [R, R, R] {
  if (d.out[0] !== 0) return [[d.x - 0.04, d.x + 0.04], [y, y + h], [d.z - w / 2, d.z + w / 2]]
  return [[d.x - w / 2, d.x + w / 2], [y, y + h], [d.z - 0.04, d.z + 0.04]]
}

/** The face of a column looking towards its nearest aisle. */
function nearestAisleFace(spec: BasementSpec, c: Column): Dir {
  let best: Dir = '+z'
  let dist = Infinity
  for (const a of spec.aisles) {
    const [ax, az] = centre(a.rect)
    const alongX = a.rect.x1 - a.rect.x0 > a.rect.z1 - a.rect.z0
    if (alongX && c.x > a.rect.x0 && c.x < a.rect.x1) {
      const d = Math.abs(az - c.z)
      if (d < dist) [dist, best] = [d, az > c.z ? '+z' : '-z']
    } else if (!alongX && c.z > a.rect.z0 && c.z < a.rect.z1) {
      const d = Math.abs(ax - c.x)
      if (d < dist) [dist, best] = [d, ax > c.x ? '+x' : '-x']
    }
  }
  return best
}

/** A straight pipe between two points, radius r. */
function pipe(ctx: Ctx, p: Object3D, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r: number, mat: Material) {
  const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0)
  if (len < 0.05) return
  const o = ctx.k.cyl(p, r, r, Number(len.toFixed(2)), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 10)
  o.castShadow = false
  if (Math.abs(x1 - x0) > Math.abs(z1 - z0)) o.rotation.z = PI / 2
  else o.rotation.x = PI / 2
}

/** A 1.2 m LED batten on two drop rods, its diffuser lit; turned by yaw (0: along z). */
function batten(ctx: Ctx, p: Object3D, x: number, soffit: number, z: number, yaw: number) {
  const { k, m } = ctx
  const yy = soffit - 0.62
  const along = Math.abs(Math.sin(yaw)) > 0.5
  const [w, d] = along ? [1.22, 0.075] : [0.075, 1.22]
  k.box(p, w, 0.05, d, m.white, x, yy + 0.025, z, false)
  k.box(p, along ? 1.16 : 0.05, 0.012, along ? 0.05 : 1.16, m.led, x, yy - 0.006, z, false)
  for (const s of [-0.45, 0.45]) k.box(p, 0.008, 0.6, 0.008, m.steel, x + (along ? s : 0), yy + 0.33, z + (along ? 0 : s), false)
}

/** A jet fan for impulse ventilation: a short cased fan with silencers, hung under the slab along the aisle. */
function jetFan(ctx: Ctx, p: Object3D, x: number, soffit: number, z: number, yaw: number) {
  const { k, m } = ctx
  const g = new Group()
  g.position.set(x, soffit - 0.55, z)
  g.rotation.y = yaw
  p.add(g)
  const body = k.cyl(g, 0.24, 0.24, 1.0, m.fanGrey, 0, 0, 0, 24)
  body.rotation.x = PI / 2
  for (const s of [-1, 1]) {
    const sil = k.cyl(g, 0.27, 0.27, 0.32, m.galvanised, 0, 0, s * 0.62, 24)
    sil.rotation.x = PI / 2
    const grille = k.cyl(g, 0.25, 0.25, 0.01, m.black, 0, 0, s * 0.785, 24)
    grille.rotation.x = PI / 2
  }
  k.box(g, 0.6, 0.06, 1.4, m.steel, 0, 0.3, 0, false)
  for (const s of [-0.5, 0.5]) k.box(g, 0.05, 0.25, 0.05, m.steel, 0, 0.45, s, false)
}

/** An extinguisher on its bracket (and a hose reel cabinet with call point and sounder when `cabinet`). */
function extinguisher(ctx: Ctx, p: Object3D, x: number, y: number, z: number, face: Dir, cabinet: boolean) {
  const { k, m } = ctx
  const [ox, oz] = vec(face)
  const yaw = yawOf(face)
  const ex = x + ox * 0.12
  const ez = z + oz * 0.12
  k.cyl(p, 0.085, 0.085, 0.5, m.fireRed, ex, y + 0.85, ez, 16)
  k.sphere(p, 0.085, m.fireRed, ex, y + 1.1, ez).scale.y = 0.4
  k.cyl(p, 0.025, 0.03, 0.08, m.black, ex, y + 1.16, ez, 8)
  k.box(p, 0.04, 0.32, 0.04, m.black, ex + oz * 0.09, y + 0.92, ez + ox * 0.09, false)
  k.box(p, 0.16, 0.04, 0.12, m.steel, x + ox * 0.06, y + 0.6, z + oz * 0.06, false)
  sign(p, 0.42, 0.14, ctx.m.painted('lbl_ext', 512, 160, redLabel('FIRE EXTINGUISHER')), x, y + 1.45, z, yaw)
  if (!cabinet) return
  k.box(p, 0.09, 0.09, 0.05, m.fireRed, x - oz * 0.2, y + 1.45, z + ox * 0.2, false)
  k.cyl(p, 0.06, 0.06, 0.05, m.fireRed, x - oz * 0.2 + ox * 0.03, y + 2.25, z + ox * 0.2 + oz * 0.03, 16).rotation.x = PI / 2
}

/** The ramp's landings: level boards, the speed limit, CCTV, a convex mirror, a speed hump at the foot. */
function rampLanding(ctx: Ctx, p: Object3D, high: Object3D, r: RampSpec, level: Level, y: number, soffit: number) {
  const { k, m } = ctx
  const L = rampLength(r)
  const sign_ = signOf(r.down)
  const isFoot = r.to === level
  const s = isFoot ? L + 1.2 : -0.8
  const [cx, cz] = rampPoint(r, s, 0.5)
  // Facing the cars arriving here: down the ramp at its foot; at a top, the cars about to go down.
  const towards: Dir = isFoot ? ((axisOf(r.down) === 'x' ? (sign_ > 0 ? '-x' : '+x') : sign_ > 0 ? '-z' : '+z') as Dir) : r.down
  const facing = yawOf(towards) + PI
  const alongX = axisOf(r.down) === 'x'
  const w = r.across[1] - r.across[0]
  if (isFoot) {
    // Speed hump: rubber, yellow and black, across the lane.
    const [hx, hz] = rampPoint(r, L + 0.6, 0.5)
    if (alongX) bx(ctx, p, [hx - 0.2, hx + 0.2], [y, y + 0.06], [hz - w / 2, hz + w / 2], m.hazard, false)
    else bx(ctx, p, [hx - w / 2, hx + w / 2], [y, y + 0.06], [hz - 0.2, hz + 0.2], m.hazard, false)
  }
  // A hanging board over the lane: which level this is, where the ramp goes.
  const lines = isFoot ? [`B${-level} · ${level === -1 ? 'BASEMENT 1' : 'BASEMENT 2'}`] : [`DOWN TO B${-r.to}`]
  const arrow = isFoot ? 'none' : 'down'
  const bmat = m.painted(`board_${lines[0]}`, 1024, 224, board(lines, arrow))
  const by = soffit - 0.75
  sign(high, 2.4, 0.52, bmat, cx, by, cz, facing, bmat)
  for (const o of [-1, 1]) k.box(high, 0.01, 0.48, 0.01, m.steel, cx + (alongX ? 0 : o * 1.0), soffit - 0.24, cz + (alongX ? o * 1.0 : 0), false)
  // The posted headroom and speed, hung beside it.
  const off = w / 2 - 0.6
  const sx = cx + (alongX ? 0 : off)
  const sz = cz + (alongX ? off : 0)
  sign(high, 0.5, 0.5, m.painted(isFoot ? 'speed' : `head${r.headroom}`, 256, 256, isFoot ? roundSign('10', 'km/h') : roundSign(`${r.headroom}m`), { alphaTest: 0.5 }), sx, soffit - 1.25, sz, facing)
  // At the top of a ramp down, a striped height bar on chains across the lane.
  if (!isFoot) {
    const hy = y + r.headroom + 0.06
    if (alongX) bx(ctx, p, [cx - 0.06, cx + 0.06], [hy, hy + 0.12], [cz - w / 2 + 0.2, cz + w / 2 - 0.2], m.hazard, false)
    else bx(ctx, p, [cx - w / 2 + 0.2, cx + w / 2 - 0.2], [hy, hy + 0.12], [cz - 0.06, cz + 0.06], m.hazard, false)
    for (const o of [-1, 1]) k.box(p, 0.012, soffit - hy - 0.12, 0.012, m.steel, cx + (alongX ? 0 : o * (w / 2 - 0.4)), (soffit + hy + 0.12) / 2, cz + (alongX ? o * (w / 2 - 0.4) : 0), false)
  }
  // CCTV dome over the landing, and a convex mirror at the lane's edge.
  k.cyl(high, 0.09, 0.09, 0.03, m.white, cx, soffit - 0.02, cz, 20)
  const dome = k.sphere(high, 0.075, m.black, cx, soffit - 0.04, cz)
  dome.scale.y = 0.8
  k.box(high, 0.012, 0.012, 0.012, m.ledRed, cx + 0.06, soffit - 0.04, cz, false)
  const [mx, mz] = rampPoint(r, s, 1)
  const mirror = k.cyl(p, 0.4, 0.4, 0.04, m.mirror, mx, y + 2.15, mz, 32)
  mirror.rotation.set(PI / 2, facing + 0.6, 0, 'YXZ')
  k.cyl(p, 0.43, 0.43, 0.03, m.fireRed, mx - Math.sin(facing) * 0.02, y + 2.15, mz - Math.cos(facing) * 0.02, 32).rotation.set(PI / 2, facing + 0.6, 0, 'YXZ')
  // The painted floor word before the landing.
  const word = isFoot ? 'SLOW' : `TO B${-r.to}`
  const [wx, wz] = rampPoint(r, isFoot ? L + 3.4 : -3.2, 0.5)
  floorMark(p, planeGeo(2.4, 0.6), m.painted(`word_${word}`, 512, 128, floorWord(word), { alphaTest: 0.5, roughness: 0.7 }), wx, y + 0.005, wz, facing)
}

/** Hanging signs over an aisle: the exit sign and wayfinding boards, both faces. */
function hangingSigns(ctx: Ctx, p: Object3D, rect: Rect, ax: 'x' | 'z', soffit: number) {
  const { m, k, spec } = ctx
  const [cx, cz] = centre(rect)
  const len = ax === 'x' ? rect.x1 - rect.x0 : rect.z1 - rect.z0
  const lifts = spec.access
  for (const [t, kind] of [[0.33, 'exit'], [0.67, 'way']] as const) {
    const s = len * t
    const x = ax === 'x' ? rect.x0 + s : cx
    const z = ax === 'z' ? rect.z0 + s : cz
    const yaw = ax === 'x' ? PI / 2 : 0
    const yy = soffit - 0.75
    if (kind === 'exit') {
      const ex = m.glowing('exit', 512, 192, exitSign(), 1.1)
      sign(p, 0.9, 0.34, ex, x, yy, z, yaw, ex)
    } else {
      let dir: 'left' | 'right' | 'up' = 'up'
      if (lifts) {
        const [lx, lz] = centre(lifts.rect)
        const across = ax === 'x' ? lz - cz : lx - cx
        const ahead = ax === 'x' ? lx - x : lz - z
        dir = Math.abs(ahead) > Math.abs(across) ? 'up' : across > 0 === (ax === 'x') ? 'left' : 'right'
      }
      const lines = ['LIFTS · STAIRS']
      const front = m.painted(`way_${dir}`, 1024, 224, board(lines, dir))
      const opp = dir === 'left' ? 'right' : dir === 'right' ? 'left' : 'up'
      const back = m.painted(`way_${opp}`, 1024, 224, board(lines, opp))
      sign(p, 2.0, 0.44, front, x, yy, z, yaw, back)
    }
    for (const o of [-0.4, 0.4]) k.box(p, 0.008, 0.55, 0.008, m.steel, x + (ax === 'x' ? 0 : o), soffit - 0.27, z + (ax === 'x' ? o : 0), false)
  }
}

/** Stair and lift cores: blockwork walls, the lobby, lift doors or the stair, exit signs, the hose reel. */
function buildCore(ctx: Ctx, p: Object3D, core: BasementSpec['cores'][number], level: Level, y: number, soffit: number) {
  const { m, k } = ctx
  const r = core.rect
  const d = doorAt(r, core.door)
  const lifts = core.kind === 'lifts'
  const openW = lifts ? 2.4 : 1.2
  enclose(ctx, p, r, core.door, openW, 2.2, y, soffit, m.blockwork)
  bx(ctx, p, [r.x0 + 0.2, r.x1 - 0.2], [y, y + 0.012], [r.z0 + 0.2, r.z1 - 0.2], lifts ? m.lobbyTile : m.concrete, false)
  const across: R = d.out[0] !== 0 ? [0, 1] : [1, 0]
  if (lifts) {
    // Glazed sliding doors into the pressurised lobby, open.
    for (const s of [-1, 1]) {
      const ox = across[0] * s * (openW / 2 - 0.3)
      const oz = across[1] * s * (openW / 2 - 0.3)
      const [xs, ys, zs] = doorBox({ x: d.x + ox, z: d.z + oz, out: d.out }, 0.6, y, 2.2)
      bx(ctx, p, xs, ys, zs, m.glass, false)
    }
    // Two lifts in the back wall: stainless doors in frames, the call button and the floor display.
    const back = { x: d.x - d.out[0] * ((r.x1 - r.x0) - 0.21), z: d.z - d.out[1] * ((r.z1 - r.z0) - 0.21) }
    for (const s of [-1, 1]) {
      const lx = back.x + across[0] * s * 1.25
      const lz = back.z + across[1] * s * 1.25
      sign(p, 1.1, 2.1, m.stainless, lx, y + 1.05, lz, d.yaw)
      bx(ctx, p, ...doorBox({ x: lx + d.out[0] * 0.01, z: lz + d.out[1] * 0.01, out: d.out }, 1.3, y + 2.1, 0.1), m.stainless)
      sign(p, 0.3, 0.1, m.glowing(`liftlevel${level}`, 128, 48, levelReadout(level), 1.2), lx, y + 2.4, lz, d.yaw)
      k.box(p, 0.06, 0.12, 0.06, m.stainless, lx + across[0] * 0.8 + d.out[0] * 0.02, y + 1.1, lz + across[1] * 0.8 + d.out[1] * 0.02, false)
    }
    sign(p, 1.6, 0.3, m.painted('lbl_lobby', 512, 96, board(['LIFT LOBBY'], 'none')), d.x + d.out[0] * 0.11, y + 2.45, d.z + d.out[1] * 0.11, d.yaw)
  } else {
    // A fire door, shut, the lit exit sign over it; the flights inside rising round the landing.
    bx(ctx, p, ...doorBox(d, openW, y, 2.2), m.fireDoor)
    const ex = m.glowing('exitL', 512, 192, exitSign('none'), 1.2)
    sign(p, 0.6, 0.22, ex, d.x + d.out[0] * 0.11, y + 2.4, d.z + d.out[1] * 0.11, d.yaw)
    const inner = { x0: r.x0 + 0.2, x1: r.x1 - 0.2, z0: r.z0 + 0.2, z1: r.z1 - 0.2 }
    const alongX = d.out[1] !== 0
    const steps = 11
    const rise = (soffit + SLAB - y) / 2 / steps
    for (let i = 0; i < steps; i++) {
      const f = (i + 1) / (steps + 3)
      if (alongX) {
        const x = inner.x0 + 1.2 + (inner.x1 - inner.x0 - 2.4) * f
        bx(ctx, p, [x, x + 0.28], [y, y + rise * (i + 1)], [inner.z0, (inner.z0 + inner.z1) / 2 - 0.05], m.concrete)
      } else {
        const z = inner.z0 + 1.2 + (inner.z1 - inner.z0 - 2.4) * f
        bx(ctx, p, [inner.x0, (inner.x0 + inner.x1) / 2 - 0.05], [y, y + rise * (i + 1)], [z, z + 0.28], m.concrete)
      }
    }
    sign(p, 0.9, 0.22, m.painted(`lbl_${core.label}`, 512, 128, board([core.label], 'none', '#0d8a3e')), d.x + d.out[0] * 0.06, y + 1.75, d.z + d.out[1] * 0.06, d.yaw)
  }
  // The level's big marker on the wall beside the door, and a hose reel cabinet on the other side.
  const sideA = { x: d.x + across[0] * (openW / 2 + 1.0) + d.out[0] * 0.11, z: d.z + across[1] * (openW / 2 + 1.0) + d.out[1] * 0.11 }
  const sideB = { x: d.x - across[0] * (openW / 2 + 0.75), z: d.z - across[1] * (openW / 2 + 0.75) }
  sign(p, 1.2, 0.9, m.glowing(`mark${level}`, 512, 384, levelMark(`B${-level}`, LEVEL_COLOUR[level], level === -1 ? 'Basement 1' : 'Basement 2'), 0.35), sideA.x, y + 1.65, sideA.z, d.yaw)
  const cab = Array.from({ length: 6 }, (_, i) => (i === (d.out[0] > 0 ? 0 : d.out[0] < 0 ? 1 : d.out[1] > 0 ? 4 : 5) ? m.hoseCabinet : m.fireRed))
  bx(ctx, p, ...cabinetBox(sideB, d.out, y), cab)
  sign(p, 0.8, 0.16, m.painted('lbl_hose', 512, 128, redLabel('FIRE HOSE REEL')), sideB.x + d.out[0] * 0.02, y + 2.05, sideB.z + d.out[1] * 0.02, d.yaw)
  // Bollards either side of the door, a no-parking hatch before it.
  for (const s of [-1, 1]) {
    const bxp = d.x + across[0] * s * (openW / 2 + 0.35) + d.out[0] * 0.6
    const bzp = d.z + across[1] * s * (openW / 2 + 0.35) + d.out[1] * 0.6
    k.cyl(p, 0.08, 0.08, 0.9, m.hazard, bxp, y + 0.45, bzp, 16)
  }
  const hw = openW / 2 + 0.6
  const hx: R = d.out[0] !== 0 ? [d.x + Math.min(0, d.out[0] * 1.6), d.x + Math.max(0, d.out[0] * 1.6)] : [d.x - hw, d.x + hw]
  const hz: R = d.out[1] !== 0 ? [d.z + Math.min(0, d.out[1] * 1.6), d.z + Math.max(0, d.out[1] * 1.6)] : [d.z - hw, d.z + hw]
  for (let i = 0; i < 6; i++) {
    const f = i / 5
    if (d.out[0] !== 0) bx(ctx, p, hx, [y + 0.001, y + 0.005], [hz[0] + (hz[1] - hz[0]) * f - 0.05, hz[0] + (hz[1] - hz[0]) * f + 0.05], m.yellowLine, false)
    else bx(ctx, p, [hx[0] + (hx[1] - hx[0]) * f - 0.05, hx[0] + (hx[1] - hx[0]) * f + 0.05], [y + 0.001, y + 0.005], hz, m.yellowLine, false)
  }
  // A zebra from the lobby across the aisle in front of it, for people walking from their cars.
  for (let i = 0; i < 6; i++) {
    const o = 1.8 + i * 0.9
    const zx = d.x + d.out[0] * o
    const zz = d.z + d.out[1] * o
    if (d.out[0] !== 0) bx(ctx, p, [zx - 0.25, zx + 0.25], [y + 0.001, y + 0.005], [zz - 1.2, zz + 1.2], m.whiteLine, false)
    else bx(ctx, p, [zx - 1.2, zx + 1.2], [y + 0.001, y + 0.005], [zz - 0.25, zz + 0.25], m.whiteLine, false)
  }
  // CCTV on a wall bracket over the door.
  const cam = { x: d.x + d.out[0] * 0.35 + across[0] * (openW / 2 + 0.3), z: d.z + d.out[1] * 0.35 + across[1] * (openW / 2 + 0.3) }
  const body = k.box(p, 0.09, 0.09, 0.26, m.white, cam.x, y + 2.75, cam.z)
  body.rotation.y = d.yaw
  body.rotation.x = 0.35
}

/** A cabinet 0.8 wide × 1.1 tall standing 0.22 proud of the wall face at `at`. */
function cabinetBox(at: { x: number; z: number }, out: R, y: number): [R, R, R] {
  const span = (a: number, o: number): R => (o > 0 ? [a, a + 0.22] : [a - 0.22, a])
  if (out[0] !== 0) return [span(at.x, out[0]), [y + 0.75, y + 1.85], [at.z - 0.4, at.z + 0.4]]
  return [[at.x - 0.4, at.x + 0.4], [y + 0.75, y + 1.85], span(at.z, out[1])]
}

const levelReadout =
  (level: Level) =>
  (g: CanvasRenderingContext2D, w: number, h: number) => {
    g.fillStyle = '#050505'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ff6a2a'
    g.font = `700 ${h * 0.7}px Helvetica, Arial, sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(`B${-level}`, w / 2, h / 2 + 2)
  }

/* ---------- bays and cars ---------- */

function buildBays(ctx: Ctx, p: Object3D, level: Level, list: Bay[], y: number) {
  const { m, k, r, spec, shade, decals } = ctx
  const n = NUMBER_ATLAS.cols * NUMBER_ATLAS.rows
  const numMat = m.painted(`numbers${level}`, 2048, 1024, numberAtlas(list.slice(0, n).map((b) => b.label)), { alphaTest: 0.4, roughness: 0.7 })
  const lifts = spec.access
  // The two bays nearest the lifts are for wheelchair users; three in a row on B1 have EV chargers.
  const byLift = lifts
    ? [...list.filter((b) => !b.parallel)].sort((a, b) => Math.hypot(a.x - centre(lifts.rect)[0], a.z - centre(lifts.rect)[1]) - Math.hypot(b.x - centre(lifts.rect)[0], b.z - centre(lifts.rect)[1])).slice(0, 2)
    : []
  const perp = list.filter((b) => !b.parallel && !byLift.includes(b))
  const ev = level === -1 ? perp.slice(Math.floor(perp.length * 0.62), Math.floor(perp.length * 0.62) + 3) : []
  const cars: Parked[] = []
  const bodies: [Body, number][] = [['hatch', 0.28], ['crossover', 0.3], ['sedan', 0.2], ['suv', 0.12], ['mpv', 0.1]]
  const colours: [string, number][] = [
    ['#f2f2ef', 0.3], ['#e9e7e1', 0.06], ['#b9bcbf', 0.14], ['#6e7276', 0.12], ['#2c2e31', 0.06], ['#0d0e10', 0.1], ['#8f1d22', 0.07], ['#1f3c6e', 0.06], ['#5b4636', 0.04], ['#a8865d', 0.03], ['#3f5a4a', 0.02],
  ]
  const pick = <T,>(table: [T, number][]) => {
    let v = r() * table.reduce((s, [, w]) => s + w, 0)
    for (const [t, w] of table) if ((v -= w) <= 0) return t
    return table[0][0]
  }
  const geo = new PlaneGeometry(1.0, 0.25)
  const uvBase = geo.getAttribute('uv').array.slice()

  list.forEach((b, i) => {
    const [fx, fz] = vec(b.face)
    // Side axis, perpendicular to the nose.
    const [sx, sz] = [fz, fx]
    const along = (d: number, s = 0): R => [b.x + fx * d + sx * s, b.z + fz * d + sz * s]
    const line = (cx: number, cz: number, lenAlong: number, lenSide: number, mat: Material) => {
      const w = Math.abs(fx) * lenAlong + Math.abs(sx) * lenSide
      const d = Math.abs(fz) * lenAlong + Math.abs(sz) * lenSide
      k.box(p, w, 0.004, d, mat, cx, y + 0.003, cz, false)
    }
    const special = byLift.includes(b) ? 'accessible' : ev.includes(b) ? 'ev' : null
    if (!b.parallel) {
      for (const s of [-1.25, 1.25]) line(...along(0, s), 5.0, 0.1, m.whiteLine)
      if (special) {
        // The bay painted in its colour, edged white, the symbol stencilled at its head.
        const [cx, cz] = along(0)
        k.box(p, Math.abs(fx) * 4.9 + Math.abs(sx) * 2.38, 0.003, Math.abs(fz) * 4.9 + Math.abs(sz) * 2.38, special === 'accessible' ? m.accessible : m.evGreen, cx, y + 0.0015, cz, false)
        const word = special === 'accessible' ? 'ACCESSIBLE' : 'EV ONLY'
        const [wx, wz] = along(-0.6)
        floorMark(p, planeGeo(1.9, 0.48), m.painted(`word_${word}`, 512, 128, floorWord(word), { alphaTest: 0.5, roughness: 0.7 }), wx, y + 0.006, wz, yawOf(b.face))
        if (special === 'ev') {
          // A charging pedestal at the head of the bay, its status lit.
          const [px, pz] = along(2.25, 0)
          const ped = k.box(p, 0.32, 1.35, 0.22, m.white, px, y + 0.675, pz)
          ped.rotation.y = yawOf(b.face)
          k.box(p, 0.2, 0.05, 0.05, m.ledGreen, px - fx * 0.115, y + 1.2, pz - fz * 0.115, false)
          k.box(p, 0.06, 0.4, 0.06, m.black, px - fx * 0.13 + sx * 0.1, y + 0.9, pz - fz * 0.13 + sz * 0.1, false)
        } else {
          const [px, pz] = along(2.35, 0.9)
          k.cyl(p, 0.035, 0.035, 2.2, m.galvanised, px, y + 1.1, pz, 10)
          sign(p, 0.5, 0.36, m.painted('accessSign', 512, 368, board(['DISABLED', 'PARKING'], 'none', '#1f4fa8')), px - fx * 0.04, y + 1.9, pz - fz * 0.04, yawOf(b.face) + PI)
        }
      }
      // Rubber wheel stops at the head of the bay.
      for (const s of [-0.6, 0.6]) {
        const [wx, wz] = along(2.5 - 0.75, s)
        const o = k.box(p, Math.abs(sx) * 0.55 + Math.abs(fx) * 0.12, 0.1, Math.abs(sz) * 0.55 + Math.abs(fz) * 0.12, m.hazard, wx, y + 0.05, wz, false)
        o.castShadow = false
      }
      // The bay's number at its mouth, reading from the aisle.
      if (i < n) {
        const g = geo.clone()
        const uv = g.getAttribute('uv')
        const u0 = (i % NUMBER_ATLAS.cols) / NUMBER_ATLAS.cols
        const v0 = 1 - (Math.floor(i / NUMBER_ATLAS.cols) + 1) / NUMBER_ATLAS.rows
        for (let j = 0; j < uv.count; j++) uv.setXY(j, u0 + uvBase[j * 2] / NUMBER_ATLAS.cols, v0 + uvBase[j * 2 + 1] / NUMBER_ATLAS.rows)
        const [nx, nz] = along(-2.5 + 0.45)
        floorMark(p, g, numMat, nx, y + 0.005, nz, yawOf(b.face))
      }
    } else {
      for (const d of [-3, 3]) line(...along(d, 0), 0.1, 2.5, m.whiteLine)
    }

    // A car, or for an empty bay sometimes the drips of the one that left.
    const keep = special === 'accessible' ? 0.4 : special === 'ev' ? 0.6 : spec.occupancy
    if (r() > keep) {
      if (r() < 0.45) decals.add('stain', ...withY(along(b.parallel ? 1.2 : 0.9), y + 0.002), 1.3, 1.1, r() * PI)
      return
    }
    const body = special === 'accessible' ? (r() < 0.5 ? 'crossover' : 'mpv') : pick(bodies)
    const L = LENGTH[body]
    const reversed = !b.parallel && r() < 0.24
    const depth = b.parallel ? 6 : 5
    const shift = Math.max(0, (depth - L) / 2 - (b.parallel ? 0.5 : 0.3 + r() * 0.25))
    const lateral = (r() - 0.5) * 0.24
    const [cx, cz] = along(b.parallel ? (r() - 0.5) * 0.6 : shift, lateral)
    const yaw = yawOf(b.face) + (reversed ? PI : 0) + (r() - 0.5) * 0.06
    cars.push({ body, colour: pick(colours), x: cx, z: cz, yaw, y })
    shade.rect(cx, y + 0.006, cz, 1.85, L, yaw, 0.85)
    if (r() < 0.5) decals.add('stain', ...withY(along(shift + (reversed ? -1 : 1) * (L / 2 - 0.9)), y + 0.002), 1.0, 0.9, r() * PI)
  })
  parkFleet(k, p, cars, m.env, spec.seed + level * 101)
}

const withY = ([x, z]: R, y: number): [number, number, number] => [x, y, z]

/* ---------- ramps ---------- */

/** A strip surface along the ramp between two lines across it (t0..t1), at a height offset. */
function rampStrip(r: RampSpec, t0: number, t1: number, dy: number, mat: Material, flip = false, n = 0) {
  const L = rampLength(r)
  const steps = n || Math.ceil(L / 0.5)
  const W = (r.across[1] - r.across[0]) * (t1 - t0)
  const pos: number[] = []
  const uv: number[] = []
  for (let i = 0; i <= steps; i++) {
    const s = (L * i) / steps
    const yy = rampY(r, s) + dy
    for (const t of [t0, t1]) {
      const [x, z] = rampPoint(r, s, t)
      pos.push(x, yy, z)
      uv.push((t === t0 ? 0 : W) / 2, s / 2)
    }
  }
  const idx: number[] = []
  for (let i = 0; i < steps; i++) {
    const a = i * 2
    idx.push(a, a + 1, a + 3, a, a + 3, a + 2)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  // Face up (or down for a soffit), whichever way the ramp runs.
  const ny = g.getAttribute('normal').getY(0)
  if (ny < 0 !== flip) {
    const ix = g.getIndex()!
    for (let i = 0; i < ix.count; i += 3) {
      const a = ix.getX(i)
      ix.setX(i, ix.getX(i + 2))
      ix.setX(i + 2, a)
    }
    g.computeVertexNormals()
  }
  const m = new Mesh(g, mat)
  m.receiveShadow = true
  m.castShadow = !flip
  return m
}

/** A ramp between levels, in its own group (it shows from both of its levels). */
export function buildRamp(ctx: Ctx, r: RampSpec): Group {
  const { m, k } = ctx
  const g = new Group()
  g.name = `ramp_${r.id}`
  const L = rampLength(r)
  const bottom = LEVEL_Y[r.to]
  const storeyTop = r.from === 0 ? 0 : LEVEL_Y[r.from]
  const W = r.across[1] - r.across[0]
  const kerb = 0.3 / W
  // Surface, its slab soffit beneath, the raised kerbs along both walls.
  g.add(rampStrip(r, kerb, 1 - kerb, 0, m.ramp))
  g.add(rampStrip(r, 0, 1, -SLAB, m.soffit, true))
  for (const [t0, t1] of [[0, kerb], [1 - kerb, 1]]) g.add(rampStrip(r, t0, t1, 0.15, m.concrete))
  // Kerb faces in hazard paint, as vertical strips.
  for (const t of [kerb, 1 - kerb]) {
    const pos: number[] = []
    const uv: number[] = []
    const steps = Math.ceil(L / 0.5)
    for (let i = 0; i <= steps; i++) {
      const s = (L * i) / steps
      const [x, z] = rampPoint(r, s, t)
      const yy = rampY(r, s)
      pos.push(x, yy, z, x, yy + 0.15, z)
      uv.push(s / 0.6, 0, s / 0.6, 0.25)
    }
    const idx: number[] = []
    for (let i = 0; i < steps; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 3, i * 2, i * 2 + 3, i * 2 + 2)
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
    geo.setAttribute('uv', new Float32BufferAttribute(uv, 2))
    geo.setIndex(idx)
    geo.computeVertexNormals()
    const mat = (m.hazard as MeshStandardMaterial).clone()
    mat.side = DoubleSide
    const mesh = new Mesh(geo, mat)
    mesh.receiveShadow = true
    g.add(mesh)
  }
  // Side walls, full height of the storey the ramp falls through.
  const rr = rampRect(r)
  const alongX = axisOf(r.down) === 'x'
  for (const side of [0, 1]) {
    // Painted on both faces: the ramp's side and the car park's.
    const mats = Array.from({ length: 6 }, (_, i) => ((alongX ? i >= 4 : i <= 1) ? m.wall(r.to, L) : m.cut))
    if (alongX) bx(ctx, g, [rr.x0, rr.x1], [bottom, storeyTop], side ? [r.across[1], rr.z1] : [rr.z0, r.across[0]], mats)
    else bx(ctx, g, side ? [r.across[1], rr.x1] : [rr.x0, r.across[0]], [bottom, storeyTop], [rr.z0, rr.z1], mats)
  }
  // Closing the space under its high end, from the floor below to the ramp's soffit.
  const [ex0, ez0] = rampPoint(r, 0, 0)
  const [ex1, ez1] = rampPoint(r, 0, 1)
  const under = rampY(r, 0) - SLAB
  const endT = -signOf(r.down) * 0.2
  if (alongX) bx(ctx, g, [Math.min(ex0, ex0 + endT), Math.max(ex0, ex0 + endT)], [bottom, under], [Math.min(ez0, ez1), Math.max(ez0, ez1)], m.blockwork)
  else bx(ctx, g, [Math.min(ex0, ex1), Math.max(ex0, ex1)], [bottom, under], [Math.min(ez0, ez0 + endT), Math.max(ez0, ez0 + endT)], m.blockwork)
  // From the ground: roofed by the slab beyond the opening to the sky. A ramp that starts inside
  // the building is walled and roofed over that first stretch too, a tunnel under the ground floor.
  const open = r.open ?? 0
  if (r.roof !== undefined && open > 0) {
    const roof = r.roof
    const sA: R = [0, open]
    for (const side of [0, 1]) {
      const [p0x, p0z] = rampPoint(r, sA[0], side)
      const [p1x, p1z] = rampPoint(r, sA[1], side)
      const out = side ? 0.2 : -0.2
      const mats = Array.from({ length: 6 }, (_, i) => (i === (alongX ? (side ? 5 : 4) : side ? 1 : 0) ? m.wall(r.to, open) : m.cut))
      if (alongX) bx(ctx, g, [Math.min(p0x, p1x), Math.max(p0x, p1x)], [storeyTop, roof + 0.3], side ? [p0z, p0z + out] : [p0z + out, p0z], mats)
      else bx(ctx, g, side ? [p0x, p0x + out] : [p0x + out, p0x], [storeyTop, roof + 0.3], [Math.min(p0z, p1z), Math.max(p0z, p1z)], mats)
    }
    const [ax, az] = rampPoint(r, 0, 0)
    const [bx2, bz2] = rampPoint(r, open, 1)
    const rr2 = { x0: Math.min(ax, bx2), x1: Math.max(ax, bx2), z0: Math.min(az, bz2), z1: Math.max(az, bz2) }
    g.add(slabSurface(rr2, [], roof, m.soffit, true))
    // The header where the roof steps down to the slab's soffit.
    const [hx, hz] = rampPoint(r, open, 0.5)
    const W2 = r.across[1] - r.across[0] + 0.4
    if (alongX) bx(ctx, g, [hx - 0.15, hx + 0.15], [-SLAB, roof], [hz - W2 / 2, hz + W2 / 2], m.concrete, false)
    else bx(ctx, g, [hx - W2 / 2, hx + W2 / 2], [-SLAB, roof], [hz - 0.15, hz + 0.15], m.concrete, false)
  }
  if (r.from === 0 && open < L) {
    const [ax, az] = rampPoint(r, open, 0)
    const [bx_, bz] = rampPoint(r, L, 1)
    const roof = slabSurface({ x0: Math.min(ax, bx_), x1: Math.max(ax, bx_), z0: Math.min(az, bz), z1: Math.max(az, bz) }, [], -SLAB, m.soffit, true)
    g.add(roof)
  }
  // Markings: a double yellow centre line on a two-way ramp, arrows down the lanes.
  const arrowGeo = new PlaneGeometry(0.9, 2.0)
  const arrowMat = m.painted('arrow', 128, 256, floorArrow, { alphaTest: 0.5, roughness: 0.7 })
  const pitch = Math.atan(r.slope)
  const downYaw = yawOf(r.down)
  for (let s = 4; s < L - 3; s += 7) {
    const down = r.downSide ? 0.73 : 0.27
    const lanes: [number, number][] = r.traffic === 'two-way' ? [[down, downYaw], [1 - down, downYaw + PI]] : [[0.5, r.traffic === 'in' ? downYaw : downYaw + PI]]
    for (const [t, yaw] of lanes) {
      const [x, z] = rampPoint(r, s, t)
      const o = floorMark(g, arrowGeo, arrowMat, x, rampY(r, s) + 0.012, z, yaw)
      // Tilt with the slope: the arrow's head rises for cars climbing, falls for cars going down.
      const goingDown = Math.cos(yaw - downYaw) > 0
      o.rotation.x = -PI / 2 + (goingDown ? -pitch : pitch)
    }
  }
  if (r.traffic === 'two-way') {
    for (const off of [-0.12, 0.12]) {
      const t = 0.5 + off / W
      g.add(rampStrip(r, t - 0.05 / W, t + 0.05 / W, 0.004, m.yellowLine))
    }
  }
  // Wall-mounted LED bulkheads every 4 m both sides, and the channel drain at the foot.
  for (let s = 2; s < L; s += 4) {
    for (const t of [0, 1]) {
      const [x, z] = rampPoint(r, s, t)
      const off = t ? -0.04 : 0.04
      const yy = rampY(r, s) + 2.2
      if (alongX) {
        k.box(g, 1.2, 0.07, 0.06, m.white, x, yy, z + off, false)
        k.box(g, 1.15, 0.03, 0.012, m.led, x, yy - 0.015, z + off * 2, false)
      } else {
        k.box(g, 0.06, 0.07, 1.2, m.white, x + off, yy, z, false)
        k.box(g, 0.012, 0.03, 1.15, m.led, x + off * 2, yy - 0.015, z, false)
      }
    }
  }
  const [dx, dz] = rampPoint(r, L - 0.4, 0.5)
  const drainY = rampY(r, L - 0.4) + 0.004
  if (alongX) k.box(g, 0.3, 0.008, W - 0.6, m.steel, dx, drainY, dz, false)
  else k.box(g, W - 0.6, 0.008, 0.3, m.steel, dx, drainY, dz, false)
  return g
}
