import { ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, PointLight, Shape, type Material, type Object3D } from 'three'
import { PI } from '../kit'
import { BATHROOM, BEDROOM, CORRIDOR, FFL, GFL, HALL, KITCHEN, LANDING, STAIR, STAIR_HALL, STAIR_TOP, STAIR_WELL, type Ctx } from './house'
import { DOOR_Z } from './bedroom'

/*
 * What joins the rooms: the partitions and door off the hall, the bedroom door's casing on the stair
 * hall side, and the staircase to the first floor.
 *
 * The stair is the plans': it starts beside the hall, climbs along the carport's back wall, turns on
 * winders in the corner, climbs the right wall, turns on winders again and comes back over the
 * bathroom into the first-floor hall. Reinforced concrete waists and winder blocks bearing on the walls, finished with oak treads, painted risers
 * and soffits, a closed oak string on the open side, and black steel balusters under an oak rail.
 *
 * Flight frame: s along the run from the first riser, h above the flight's foot, w across the flight
 * from the open side (0) to the wall (1 m).
 */

type R = [number, number]

const { rise: RISE, going: GOING, width: WIDTH, lower: LOWER_N, upper: UPPER_N, top: TOP_N } = STAIR
const SLOPE = RISE / GOING
const RAIL = 0.9
const WAIST = 0.15
const TREAD_T = 0.04
const NOSING = 0.025
/** The second winders rest just over the bathroom's ceiling. */
const OVER_BATH = GFL + 2.31
/** The line of the nosings, at a point on the flight; the strings and handrail follow it. */
const nosingLine = (s: number) => RISE + s * SLOPE

/** Extrudes a side profile (s, h) across the flight (w). */
function profile(p: Object3D, points: number[][], [w0, w1]: R, mat: Material) {
  const shape = new Shape()
  points.forEach(([s, h], i) => (i ? shape.lineTo(s, h) : shape.moveTo(s, h)))
  shape.closePath()
  const mesh = new Mesh(new ExtrudeGeometry(shape, { depth: w1 - w0, bevelEnabled: false }), mat)
  mesh.position.z = w0
  mesh.castShadow = mesh.receiveShadow = true
  p.add(mesh)
  return mesh
}

export function buildCirculation(ctx: Ctx) {
  const { k, c } = ctx
  const r = k.root
  const bx = ([x0, x1]: R, [y0, y1]: R, [z0, z1]: R, mat: Material, cast = true, p: Object3D = r) =>
    k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
  const top = GFL + 3.11
  const front = BEDROOM.z0

  // The bathroom's side wall on the hall's side, and the bed wall's backing past the kitchen.
  bx([BATHROOM.x0 - 0.115, BATHROOM.x0], [GFL, top], [BATHROOM.z0, STAIR_HALL.z0], c.interior)
  bx([CORRIDOR[1], BEDROOM.x0], [GFL, top], [KITCHEN.z0 + KITCHEN.d + 0.115, front], c.interior)

  // The door to the kitchen's lobby, as the plan has at the head of the hall.
  const oak = (w: number, h: number) => c.surface('oak', w, h)
  const dw = CORRIDOR[1] - CORRIDOR[0] - 0.008
  const door = new Group()
  door.name = 'door_hall_corridor'
  door.position.set(CORRIDOR[0] + 0.004, GFL, HALL.z0 - 0.06)
  door.userData.openAngle = 1.5
  r.add(door)
  bx([0, dw], [0.006, 2.094], [-0.02, 0.02], oak(dw, 2.1), true, door).userData.front = true
  for (const z of [-0.032, 0.032]) {
    k.cyl(door, 0.024, 0.024, 0.01, c.aluminium, dw - 0.07, 1.0, z, 20).rotation.x = PI / 2
    bx([dw - 0.2, dw - 0.07], [0.992, 1.008], [z - 0.008, z + 0.008], c.aluminium, true, door)
  }

  // The bedroom door's casing on the hall side.
  const casing = c.interior
  const bd: R = [BEDROOM.x0 + DOOR_Z[0], BEDROOM.x0 + DOOR_Z[1]]
  const face: R = [HALL.z0, HALL.z0 + 0.014]
  bx([bd[0] - 0.065, bd[0]], [GFL, GFL + 2.17], face, casing)
  bx([bd[1], bd[1] + 0.065], [GFL, GFL + 2.17], face, casing)
  bx(bd, [GFL + 2.1, GFL + 2.17], face, casing)
  const skirt = (x: R, z: R) => bx(x, [GFL, GFL + 0.08], z, casing, false)
  skirt([bd[1] + 0.065, BATHROOM.x0 - 0.115], face)
  skirt([STAIR_HALL.x0, STAIR_HALL.x0 + 0.012], [HALL.z0 + 3.3, STAIR_HALL.z1])

  const g = new Group()
  g.name = 'stairs_g'
  r.add(g)
  /** A flight's frame: its foot at (x, z), `risers` above the ground floor, running along local +x. */
  const frame = (x: number, z: number, risers: number, ry: number) => {
    const f = new Group()
    f.position.set(x, GFL + risers * RISE, z)
    f.rotation.y = ry
    g.add(f)
    return f
  }
  const AT_TURN = LOWER_N + 2
  const AT_TOP = AT_TURN + UPPER_N + 2
  const LOWER = frame(LANDING.x0 - LOWER_N * GOING, LANDING.z0, 0, 0)
  // The upper flight turns to run towards the back wall, its wall side the house's right wall.
  const UPPER = frame(LANDING.x0, LANDING.z0, AT_TURN, PI / 2)
  // The top flight turns again, back towards the middle of the house.
  const TOP = frame(LANDING.x0, STAIR_TOP.z, AT_TOP, PI)

  // Plaster with a little self-light, like the rooms' ceilings: the soffits face away from every lamp.
  const painted = new MeshStandardMaterial({ color: '#efe5d6', roughness: 0.92, emissive: '#c9c0b2', emissiveIntensity: 0.4 })
  const treadMat = oak(WIDTH, GOING)
  // Rails, strings and newels in oak stained to match: a board's grain would run across these long, thin pieces.
  const stained = new MeshStandardMaterial({ color: '#b0703f', roughness: 0.5 })
  const stringMat = stained
  const rail = stained
  const steel = c.aluminium

  const flight = (p: Group, upper: boolean, TREADS: number, walled = true) => {
    const RUN = TREADS * GOING
    // The stepped concrete waist.
    const foot = upper ? [[0, -WAIST]] : [[0, 0]]
    const steps: number[][] = []
    for (let i = 1; i <= TREADS; i++) steps.push([(i - 1) * GOING, i * RISE - TREAD_T], [i * GOING, i * RISE - TREAD_T])
    const head = [RUN, (TREADS + 1) * RISE - WAIST]
    // Parallel to the nosings, then a short downstand up to the landing's or the slab's underside.
    const soffit = [RUN, RUN * SLOPE - WAIST]
    profile(p, [...foot, ...steps, head, soffit, ...(upper ? [] : [[WAIST / SLOPE, 0]])], [0.03, WIDTH - 0.014], painted)

    for (let i = 1; i <= TREADS + 1; i++) {
      const s = (i - 1) * GOING
      // Riser, set back under the nosing of the tread above.
      bx([s - 0.006, s], [(i - 1) * RISE, i * RISE - TREAD_T], [0.05, WIDTH], painted, false, p)
      if (i > TREADS) break
      bx([s - NOSING, s + GOING], [i * RISE - TREAD_T, i * RISE], [0.05, WIDTH], treadMat, true, p)
    }

    // Closed oak string on the open side, and a painted one on the other.
    const from = 0
    const up = 0.07
    const board = 0.2
    const outer = [
      [from, Math.max(upper ? -Infinity : 0, nosingLine(from) - board)],
      [from, nosingLine(from) + up],
      [RUN, nosingLine(RUN) + up],
      [RUN, nosingLine(RUN) - board],
    ]
    profile(p, outer, [0, 0.03], stringMat)
    profile(p, outer, [WIDTH - 0.014, WIDTH], painted)

    // Balusters at three to the tread, rising from the string to the rail.
    const bar = 0.014
    for (let i = 0; i < TREADS * 3; i++) {
      const s = (i + 0.5) * (GOING / 3)
      if (s < from) continue
      const h0 = nosingLine(s) + up
      bx([s - bar / 2, s + bar / 2], [h0, nosingLine(s) + RAIL], [0.008, 0.022], steel, true, p)
    }
    // Oak handrail along the slope.
    const angle = Math.atan(SLOPE)
    const along = (mat: Material, h: number, d: number, y: number, z: number, s0: number) => {
      k.box(p, Math.hypot(RUN - s0, (RUN - s0) * SLOPE), h, d, mat, (s0 + RUN) / 2, nosingLine((s0 + RUN) / 2) + y, z).rotation.z = angle
    }
    along(rail, 0.045, 0.06, RAIL + 0.022, 0.015, from)
    if (!walled) return
    // The wall rail on round steel brackets.
    along(steel, 0.032, 0.032, RAIL - 0.02, WIDTH - 0.07, 0)
    for (const s of [0.25, RUN / 2, RUN - 0.25]) bx([s - 0.008, s + 0.008], [nosingLine(s) + RAIL - 0.09, nosingLine(s) + RAIL - 0.02], [WIDTH - 0.08, WIDTH - 0.06], steel, true, p)
    // Low step lights in the wall string's line, every third tread.
    for (let i = 2; i <= TREADS; i += 3) {
      const s = (i - 0.5) * GOING
      const y = i * RISE + 0.28
      bx([s - 0.05, s + 0.05], [y, y + 0.024], [WIDTH - 0.018, WIDTH - 0.014], c.led, false, p)
    }
  }
  flight(LOWER, false, LOWER_N)
  flight(UPPER, true, UPPER_N)
  flight(TOP, true, TOP_N, false)

  // A starting newel at the foot of the stair, and a full-height one at each turn's pivot.
  const newel = (x: number, y0: number, y1: number, z: number) => {
    bx([x - 0.045, x + 0.045], [y0, y1], [z - 0.045 + 0.015, z + 0.045 + 0.015], stained)
    bx([x - 0.055, x + 0.055], [y1, y1 + 0.02], [z - 0.04, z + 0.07], stained)
  }
  const level = (risers: number) => GFL + risers * RISE
  const turnY = level(LOWER_N + 1)
  newel(LANDING.x0 - LOWER_N * GOING - 0.02, GFL, GFL + nosingLine(0) + RAIL + 0.07, LANDING.z0)
  newel(LANDING.x0, turnY - 0.18, level(AT_TURN + 1) + RAIL + 0.07, LANDING.z0)
  newel(LANDING.x0, OVER_BATH, level(AT_TOP + 1) + RAIL + 0.07, STAIR_TOP.z)

  // The winders: each turn's square split on its diagonal, as both plans draw it, into two treads
  // fanning about the newel, on a block carried by the walls.
  const X = LANDING.x0
  const Z = LANDING.z0
  const firstTurn = [
    [[X, Z], [X, Z + WIDTH], [X + WIDTH, Z + WIDTH]],
    [[X, Z], [X + WIDTH, Z + WIDTH], [X + WIDTH, Z]],
  ]
  const T = STAIR_TOP.z
  const secondTurn = [
    [[X, T], [X + WIDTH, T], [X + WIDTH, T - WIDTH]],
    [[X, T], [X + WIDTH, T - WIDTH], [X, T - WIDTH]],
  ]
  /** A horizontal slab of plan outline, h0 … h1 high. */
  const slab = (outline: number[][], h0: number, h1: number, mat: Material) => {
    const shape = new Shape()
    outline.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)))
    shape.closePath()
    const geo = new ExtrudeGeometry(shape, { depth: h1 - h0, bevelEnabled: false })
    geo.rotateX(-PI / 2)
    const mesh = new Mesh(geo, mat)
    mesh.position.y = h0
    mesh.castShadow = mesh.receiveShadow = true
    g.add(mesh)
  }
  const winders = (fans: number[][][], first: number, base: number) =>
    fans.forEach((outline, i) => {
      const y = level(first + i)
      if (y - TREAD_T - base > 0.002) slab(outline, base, y - TREAD_T, painted)
      slab(outline, y - TREAD_T, y, treadMat)
    })
  winders(firstTurn, LOWER_N + 1, turnY - 0.18)
  winders(secondTurn, AT_TURN + UPPER_N + 1, OVER_BATH)

  // The first-floor guard round the well, with its foot on the slab's edge, and an oak trim to the edge.
  const guard = ([x0, x1]: R, [z0, z1]: R) => {
    const alongX = x1 - x0 > z1 - z0
    const len = alongX ? x1 - x0 : z1 - z0
    bx([x0 - 0.03, x1 + 0.03], [FFL + 0.98, FFL + 1.02], [z0 - 0.03, z1 + 0.03], rail)
    bx([x0 - 0.012, x1 + 0.012], [FFL + 0.01, FFL + 0.05], [z0 - 0.012, z1 + 0.012], rail)
    const n = Math.round(len / 0.1)
    for (let i = 1; i < n; i++) {
      const t = i / n
      const x = alongX ? x0 + (x1 - x0) * t : x0
      const z = alongX ? z0 : z0 + (z1 - z0) * t
      bx([x - 0.007, x + 0.007], [FFL + 0.05, FFL + 0.98], [z - 0.007, z + 0.007], steel)
    }
  }
  // Round the well, leaving open the top flight's end, where the stair arrives.
  const [arrival, up, low] = STAIR_WELL
  const gx = up.x[0] - 0.03
  guard([arrival.x[0], arrival.x[1]], [arrival.z[0] - 0.03, arrival.z[0] - 0.03])
  guard([arrival.x[0], gx], [arrival.z[1] + 0.03, arrival.z[1] + 0.03])
  guard([gx, gx], [up.z[0] + 0.03, up.z[1]])
  guard([low.x[0] - 0.03, gx], [up.z[1] - 0.03, up.z[1] - 0.03])
  guard([low.x[0] - 0.03, low.x[0] - 0.03], low.z)
  guard([low.x[0] - 0.03, low.x[1]], [low.z[1] + 0.03, low.z[1] + 0.03])
  newel(arrival.x[0], FFL, FFL + 1.02, arrival.z[1] + 0.015)
  newel(arrival.x[0], FFL, FFL + 1.02, arrival.z[0] - 0.045)

  // The stair's lamps, lit with the room: a wash from the ceiling and the landing.
  const add = (x: number, y: number, z: number, intensity: number, distance: number) => {
    const l = new PointLight('#ffe2bf', intensity, distance, 2)
    l.position.set(x, y, z)
    g.add(l)
    ctx.lighting.light(l, 1)
  }
  add(STAIR_HALL.x0 + 1, GFL + 2.6, STAIR_HALL.z0 + 0.7, 6, 6)
  add(LANDING.x0 + 0.45, turnY + 1.2, LANDING.z0 + 0.45, 5, 5)
  add(LANDING.x0 + 0.5, FFL + 1.7, up.z[0] - 0.4, 4, 5)
}
