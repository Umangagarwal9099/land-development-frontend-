import {
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Material,
  type MeshStandardMaterialParameters,
  type Object3D,
} from 'three'
import { FACE, Kit, PI } from '../kit'
import { tiledMat } from '../shared'
import { GF, HOUSE, type Ctx } from './layout'
import { blackStoneware, coffeeTable, consoleDecor, cornerPedestals, livingFinishes, logConsole, loungeChair, macrame, palmCorner, pedestalFan, poufs, sCurveSculpture, sideTable, sofa } from './livingPieces'
import { basaltFloor, curtainWash, daylightView, juteBraid, limewash, rattanWeave, seagrassCoil, seagrassGrid, sheerWeave } from './paints'

/*
 * The living room, entered from the pool through the carved double door, modelled wall by wall
 * from photographs of the finished interior. Done so far: the pool wall (east, +x), as seen from
 * inside: a full-height curtain wall of pleated sheers in a ceiling pocket, washed by a warm LED
 * cove, stopping either side of the carved double door; the teak-gridded glazing and the narrow
 * panel glow behind the sheers. The sheers turn the north-east corner over a second window.
 * The furniture in front of it is placed as photographed.
 *
 * The sofa wall (south) is from its own photograph: warm limewash with the turbaned portrait,
 * the long cream sofa set before it, and an opening at its west end into a darker room, kept as a
 * plain recess until that room is photographed. The north wall beyond the curtain return and the
 * west wall are plain plaster placeholders until then.
 */

/** The room in plan (metres): the pool wall's inner face is x1; the openings match the facade. */
export const LIVING = { x0: -12.2, x1: HOUSE.x1 - 0.3, z0: -10.05, z1: 0.4 }
/** The opening at the west end of the sofa wall, in plan, so the room view keeps the recess beyond it. */
export const LIVING_RECESS = { x0: LIVING.x0, x1: -7.17, z0: 0.4, z1: 0.4 + 1.2 }
/** Finished floor (raw basalt) just above the ground-floor slab, and the clear ceiling height. */
const FLOOR = GF + 0.02
const H = 3.3
/** The curtain pocket rises this far into the ceiling along the curtain wall. */
const POCKET = 0.14
/** Glazing heights, read off the photograph: transoms at 0.94, 1.63 and 2.4 m, head at 2.9 m. */
const TRANSOMS = [0.94, 1.63, 2.4]
const HEAD = 2.9
/** Openings in the pool wall (z ranges, as on the facade) and the curtain-return window in the north wall. */
const NARROW: [number, number] = [-9.9, -9.0]
const DOOR: [number, number] = [-8.8, -6.1]
const GLAZING: [number, number] = [-5.9, 0.05]
const NORTH_WINDOW: [number, number] = [-4.2, -0.75]
/** Where the sofa wall ends in the opening to the room beyond (read off the photograph), and that recess's depth. */
const SOUTH_END = LIVING_RECESS.x1
/**
 * From the north-wall photograph: west of this line the floor steps up 12 cm (with a dark stone
 * nosing); the wall carries a plaster pier and, past the step, a window behind a Roman blind.
 */
const STEP_X = -9.65
const STEP_H = 0.12
const PIER: [number, number] = [-7.08, -6.28]
const WEST_BLIND: [number, number] = [-11.56, -10.8]
const RECESS = LIVING_RECESS.z1 - LIVING_RECESS.z0
/** Where the curtain return along the north wall ends, and its ceiling pocket with it. */
const RETURN_END = -4.6

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.85, ...p })

/**
 * Colour calibration against the sofa-wall photograph: linear multipliers on each surface's colour
 * (and its bounce glow), found by sampling the photograph and the rendered room in the same spots
 * and correcting until they agree. The renderer has no global illumination, so these also stand in
 * for the light the real room bounces onto its ceiling, floor and furniture.
 */
const TONE = {
  ceiling: [0.604, 0.686, 1.001],
  sofa: [0.924, 0.701, 0.385],
  rug: [2.194, 1.635, 1.333],
  floor: [8.0, 7.906, 6.712],
  tableTop: [0.761, 1.074, 1.45],
  tableEdge: [1.788, 1.989, 2.191],
  tableLegs: [1.47, 1.703, 1.995],
  vase: [1.6, 1.5, 1.3],
  chain: [1.562, 1.839, 2.408],
  lanternWeave: [1.636, 1.401, 0.658],
  lanternCap: [1.373, 1.261, 0.15],
  teakTable: [1.73, 1.164, 0.15],
  amphora: [1.259, 1.067, 1.0],
  studPot: [0.906, 0.674, 0.396],
  pedestal: [2.298, 1.788, 1.084],
  sofaWall: [2.062, 2.153, 1.936],
  northWall: [6.299, 4.36, 2.872],
  skirting: [0.85, 0.85, 0.9],
  blind: [6.406, 6.437, 6.347],
  consoleLog: [3.673, 7.167, 8],
  macrame: [1.57, 1.426, 1.471],
  grass: [1.262, 1.932, 4.234],
  lampShade: [0.801, 0.613, 0.61],
  lampStone: [1.0, 1.0, 1.0],
  fragment: [4.125, 3.83, 3.821],
  blackStone: [0.331, 0.57, 1.137],
  candle: [2.504, 3.052, 3.886],
  pouf: [3.209, 1.185, 0.343],
  crochet: [1.988, 1.192, 0.776],
  ac: [8.0, 2.497, 0.653],
} satisfies Record<string, [number, number, number]>

function tone<M extends MeshStandardMaterial>(mat: M, key: keyof typeof TONE): M {
  const c = new Color().setRGB(...(TONE[key] as [number, number, number]))
  mat.color.multiply(c)
  mat.emissive.multiply(c)
  return mat
}

/** A pleated curtain in local x/y (pleats in z), `len` wide; u runs in half-metres so the weave keeps scale. */
function pleated(len: number, ht: number, pitch: number, depth: number): BufferGeometry {
  const g = new PlaneGeometry(len, ht, Math.ceil(len / pitch) * 8, 1)
  const pos = g.getAttribute('position')
  const uv = g.getAttribute('uv')
  for (let i = 0; i < pos.count; i++) {
    const s = pos.getX(i) + len / 2
    pos.setZ(i, (depth / 2) * Math.sin((s / pitch) * 2 * PI))
    uv.setX(i, s / 0.5)
  }
  g.computeVertexNormals()
  return g
}

export function buildLivingRoom(ctx: Ctx) {
  const { k, lighting } = ctx
  const room = new Group()
  room.name = 'living_room'
  room.position.y = FLOOR
  k.root.add(room)
  const lk = new Kit(room, k, H)
  const { x0, x1, z0, z1 } = LIVING
  const [cx, cz, w, d] = [(x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0]

  /* ---------- finishes ---------- */
  const f0 = livingFinishes(k)
  const floor = tone(tiledMat(k, 'living-basalt', basaltFloor, [w / 2.4, d / 1.2], { roughness: 0.42 }), 'floor')
  floor.normalMap = k.tex.normalPainted('living-basalt', 512, 512, basaltFloor, w / 2.4, d / 1.2)
  floor.normalScale.set(0.15, 0.15)
  // The walls and the false ceiling share one limewash: the photographed wall surface itself.
  const lime = (lw: number, lh: number) => {
    const mat = ctx.h.limewash(lw, lh)
    mat.normalMap = k.tex.normalPainted('living-limewash', 512, 512, limewash, lw / 3, lh / 3)
    mat.normalScale.set(0.08, 0.08)
    // A faint self-glow stands in for the warm light bounced around the room (no global illumination here).
    mat.emissive.set('#c9a982')
    mat.emissiveMap = mat.map
    mat.emissiveIntensity = 0.2
    return mat
  }
  const ceiling = (cw: number, cd: number) => {
    const mat = lime(cw, cd)
    mat.emissiveIntensity = 2.5
    tone(mat, 'ceiling')
    return mat
  }
  const teak = std({ color: '#4a3324', roughness: 0.6 })
  const espresso = std({ color: '#241a14', roughness: 0.55 })
  // The sheers glow with the daylight they let through (as photographed), brightest under the cove.
  const sheerGlow = k.tex.painted(4, 256, curtainWash)
  // Sheers: translucent, so the daylight behind the glazing shows through and the wall behind them reads darker.
  const sheer = lighting.glow(
    std({ color: '#f6f0e6', map: k.tex.painted(256, 64, sheerWeave), emissive: '#ffe0b4', emissiveMap: sheerGlow, emissiveIntensity: 5, roughness: 1, transparent: true, opacity: 0.84, side: DoubleSide, depthWrite: false }),
    0.85,
  )
  const led = lighting.glow(std({ color: '#fff1d6', emissive: '#ffb257', emissiveIntensity: 2.4, roughness: 0.5 }), 0.85)
  const bulb = lighting.glow(std({ color: '#fff4e2', emissive: '#ffc277', emissiveIntensity: 2.6, roughness: 0.4 }), 0.8)
  // The daylit garden behind the sheers, as bright as photographed in both lighting modes.
  const view = lighting.glow(std({ color: '#000000', emissive: '#ffffff', emissiveMap: k.tex.painted(512, 160, daylightView), emissiveIntensity: 3.2, roughness: 1 }), 1)

  /* ---------- floor, ceiling and the curtain pocket ---------- */
  lk.box(room, w, 0.02, d, floor, cx, -0.01, cz, false)
  // The ceiling stops short of the pool wall and of the curtain return, leaving the pocket the curtains rise into.
  lk.box(room, x1 - 0.3 - x0, POCKET, z1 - z0 - 0.3, ceiling(w, d), (x0 + x1 - 0.3) / 2, H + POCKET / 2, (z0 + 0.3 + z1) / 2)
  lk.box(room, RETURN_END - x0, POCKET, 0.3, ceiling(5, 0.3), (x0 + RETURN_END) / 2, H + POCKET / 2, z0 + 0.15)
  const pocketTop = ceiling(1, 1)
  lk.box(room, 0.3, 0.02, d, pocketTop, x1 - 0.15, H + POCKET + 0.01, cz)
  lk.box(room, x1 - 0.3 - RETURN_END, 0.02, 0.3, pocketTop, (RETURN_END + x1 - 0.3) / 2, H + POCKET + 0.01, z0 + 0.15)
  // Concealed LED strips at the room edge of the pocket, washing down the curtains.
  lk.box(room, 0.03, 0.02, d - 0.1, led, x1 - 0.27, H + POCKET - 0.01, cz, false)
  lk.box(room, x1 - 0.3 - RETURN_END, 0.02, 0.03, led, (RETURN_END + x1 - 0.3) / 2, H + POCKET - 0.01, z0 + 0.27, false)

  // Recessed downlights as photographed: singles along the curtain wall and pairs further in (pool-wall
  // photo); square twin trims near the curtains and the west end, and a row of slots along the sofa wall.
  for (const [x, z] of [[-1.0, -7.7], [-1.0, -5.7], [-4.0, -8.75], [-4.0, -8.45], [-4.6, -5.35], [-4.6, -5.05]]) {
    lk.cyl(room, 0.055, 0.055, 0.01, espresso, x, H - 0.004, z, 20).castShadow = false
    lk.cyl(room, 0.035, 0.035, 0.01, bulb, x, H - 0.008, z, 20).castShadow = false
  }
  const trim = std({ color: '#2a2622', roughness: 0.5 })
  // Along the north wall (its photograph): slot trims in a row, one further out, and a round pair over the console's front.
  for (const [x, z] of [[-11.5, -9.6], [-10.45, -9.6], [-5.9, -9.6], [-4.56, -9.6], [-9.54, -8.8]]) {
    lk.box(room, 0.14, 0.008, 0.05, trim, x, H - 0.004, z, false)
    lk.box(room, 0.11, 0.008, 0.025, bulb, x, H - 0.006, z, false)
  }
  for (const x of [-5.75, -5.55]) {
    lk.cyl(room, 0.05, 0.05, 0.01, espresso, x, H - 0.004, -7.2, 20).castShadow = false
    lk.cyl(room, 0.03, 0.03, 0.01, bulb, x, H - 0.008, -7.2, 20).castShadow = false
  }
  for (const [x, z] of [[-0.75, -1.7], [-6.3, -1.5], [-0.8, -0.3], [-6.6, -0.4]]) {
    lk.box(room, 0.12, 0.008, 0.12, trim, x, H - 0.004, z, false)
    for (const s of [-1, 1]) lk.box(room, 0.035, 0.008, 0.08, bulb, x + s * 0.025, H - 0.006, z, false)
  }
  for (const x of [-1.86, -3.18, -4.56]) {
    lk.box(room, 0.16, 0.008, 0.05, trim, x, H - 0.004, z1 - 0.45, false)
    lk.box(room, 0.13, 0.008, 0.025, bulb, x, H - 0.006, z1 - 0.45, false)
  }
  // The ceiling cassette air conditioner over the west end of the seating.
  const ac = lk.at(-5.6, -1.9, 0, H - 0.035)
  const acWhite = tone(std({ color: '#ecebe6', roughness: 0.45, emissive: '#8a8780', emissiveIntensity: 2.2 }), 'ac')
  lk.box(ac, 0.95, 0.03, 0.95, acWhite, 0, 0.015, 0)
  lk.box(ac, 0.5, 0.012, 0.5, tone(std({ color: '#d6d4cd', roughness: 0.6, emissive: '#7a7872', emissiveIntensity: 0.8 }), 'ac'), 0, -0.002, 0, false)
  for (const [ax, az, lw, ld] of [[0, -0.36, 0.62, 0.08], [0, 0.36, 0.62, 0.08], [-0.36, 0, 0.08, 0.62], [0.36, 0, 0.08, 0.62]])
    lk.box(ac, lw, 0.01, ld, tone(std({ color: '#c9c7c0', roughness: 0.5, emissive: '#74726c', emissiveIntensity: 0.8 }), 'ac'), ax, -0.004, az, false)

  /* ---------- walls ---------- */
  const T = 0.12
  const top = H + POCKET
  const northLime = (pw: number, ph: number) => tone(lime(pw, ph), 'northWall')
  /** A run of wall along z (the pool wall) or x (north), solid between openings, with lintels over them. */
  const wall = (axis: 'x' | 'z', at: number, a: number, b: number, openings: [number, number, number][], finish = northLime) => {
    const piece = (p: number, q: number, y0: number, y1: number) => {
      if (q - p < 0.005 || y1 - y0 < 0.005) return
      const mat = finish(q - p, y1 - y0)
      if (axis === 'z') lk.box(room, T, y1 - y0, q - p, mat, at, (y0 + y1) / 2, (p + q) / 2)
      else lk.box(room, q - p, y1 - y0, T, mat, (p + q) / 2, (y0 + y1) / 2, at)
    }
    let s = a
    for (const [p, q, head] of openings) {
      piece(s, p, 0, top)
      piece(p, q, head, top)
      s = q
    }
    piece(s, b, 0, top)
  }
  wall('z', x1 + T / 2, z0 - T, z1 + T, [[...NARROW, HEAD], [...DOOR, 3.05], [...GLAZING, HEAD]])
  // The north wall (the window at its east end is hidden by the sheers).
  wall('x', z0 - T / 2, x0 - T, x1, [[...NORTH_WINDOW, HEAD]], northLime)
  // The pier: a plaster projection from floor to ceiling, left of the console's middle.
  lk.box(room, PIER[1] - PIER[0], top, 0.12, northLime(0.8, top), (PIER[0] + PIER[1]) / 2, top / 2, z0 + 0.06)
  // Dark stone skirting along the wall and round the pier, stepping up with the floor.
  const skirting = tone(std({ color: '#4a4442', roughness: 0.6 }), 'skirting')
  for (const [a, b, y] of [[STEP_X, PIER[0], 0], [PIER[1], RETURN_END + 0.2, 0], [x0, STEP_X, STEP_H]] as const)
    lk.box(room, b - a, 0.08, 0.015, skirting, (a + b) / 2, y + 0.04, z0 + 0.0075, false)
  lk.box(room, PIER[1] - PIER[0] + 0.03, 0.08, 0.015, skirting, (PIER[0] + PIER[1]) / 2, 0.04, z0 + 0.1275, false)
  for (const px of PIER) lk.box(room, 0.015, 0.08, 0.12, skirting, px + (px === PIER[0] ? -0.0075 : 0.0075), 0.04, z0 + 0.06, false)
  // The raised floor west of the step, its edge in dark stone.
  const platform = new Mesh(new BoxGeometry(STEP_X - x0, STEP_H, z1 + RECESS - z0), [skirting, skirting, floor, skirting, skirting, skirting])
  platform.position.set((x0 + STEP_X) / 2, STEP_H / 2, (z0 + z1 + RECESS) / 2)
  platform.receiveShadow = true
  room.add(platform)
  // The window past the step, closed behind a brown damask Roman blind in a grey-framed reveal.
  const [bw, by0, by1] = [WEST_BLIND[1] - WEST_BLIND[0], 1.05, 3.25]
  const bx = (WEST_BLIND[0] + WEST_BLIND[1]) / 2
  lk.box(room, bw, by1 - by0, 0.02, tone(f0.blind, 'blind'), bx, (by0 + by1) / 2, z0 + 0.015, false)
  const reveal = std({ color: '#8d8a84', roughness: 0.7 })
  lk.box(room, bw + 0.08, 0.04, 0.08, reveal, bx, by0 - 0.02, z0 + 0.04)
  for (const s of [-1, 1]) lk.box(room, 0.04, by1 - by0 + 0.04, 0.05, reveal, bx + s * (bw / 2 + 0.02), (by0 + by1) / 2, z0 + 0.025)
  // The sofa wall, in the north wall's limewash and calibrated to look the same colour under its own (brighter) lighting,
  // ending in a square return at the opening to the room beyond.
  const sw = x1 - SOUTH_END
  lk.box(room, sw, top, T, tone(lime(sw, top), 'sofaWall'), (SOUTH_END + x1) / 2, top / 2, z1 + T / 2)
  // Placeholders until their photographs arrive: the west wall (in the room's limewash), and a dim recess
  // beyond the opening (dark timber, as glimpsed past the sofa wall's end).
  const [rz1, rw] = [z1 + RECESS, SOUTH_END - x0]
  lk.box(room, T, top, rz1 - z0 + 2 * T, northLime(d, top), x0 - T / 2, top / 2, (z0 + rz1) / 2)
  const dim = std({ color: '#2b231d', roughness: 0.8 })
  lk.box(room, rw, top, T, dim, (x0 + SOUTH_END) / 2, top / 2, rz1 + T / 2)
  lk.box(room, T, top, RECESS, dim, SOUTH_END - T / 2, top / 2, z1 + T + RECESS / 2)
  lk.box(room, rw, 0.02, RECESS + T, floor, (x0 + SOUTH_END) / 2, -0.01, z1 + (RECESS + T) / 2, false)
  lk.box(room, rw, 0.1, RECESS + T, std({ color: '#3a3029', roughness: 0.9 }), (x0 + SOUTH_END) / 2, H - 0.25, z1 + (RECESS + T) / 2)
  // The dropped header over the opening, as photographed.
  lk.box(room, rw, top - (H - 0.3), T, tone(lime(rw, 0.5), 'sofaWall'), (x0 + SOUTH_END) / 2, (top + H - 0.3) / 2, z1 + T / 2)
  // The light switch on the south wall, by the end of the curtains.
  lk.box(room, 0.09, 0.12, 0.012, std({ color: '#2e2722', roughness: 0.5 }), x1 - 0.6, 1.2, z1 - 0.006, false)

  /* ---------- glazing behind the sheers ---------- */
  /** Teak-gridded glazing in an opening: heavy posts at `posts`, a light mullion between each pair, transoms and head. */
  const grid = (axis: 'x' | 'z', at: number, posts: number[], head: number) => {
    /** A bar `len` long along the wall, `ht` tall, centred at `along` and height `y`. */
    const bar = (along: number, len: number, y: number, ht: number) =>
      axis === 'z' ? lk.box(room, 0.08, ht, len, teak, at, y, along, false) : lk.box(room, len, ht, 0.08, teak, along, y, at, false)
    const [a, b] = [posts[0], posts[posts.length - 1]]
    for (let i = 0; i < posts.length; i++) {
      bar(posts[i], 0.1, head / 2, head)
      if (i) bar((posts[i - 1] + posts[i]) / 2, 0.06, head / 2, head)
    }
    for (const y of [0.03, ...TRANSOMS]) bar((a + b) / 2, b - a, y, 0.06)
    bar((a + b) / 2, b - a, head - 0.05, 0.1)
    const glass = axis === 'z' ? lk.box(room, 0.01, head, b - a, k.m.glass, at + 0.03, head / 2, (a + b) / 2, false) : lk.box(room, b - a, head, 0.01, k.m.glass, (a + b) / 2, head / 2, at - 0.03, false)
    glass.receiveShadow = false
  }
  const span = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n)
  grid('z', x1 + 0.06, span(...GLAZING, 4), HEAD)
  grid('z', x1 + 0.06, [...NARROW], HEAD)
  grid('x', z0 - 0.06, span(...NORTH_WINDOW, 3), HEAD)
  // The carved double door: two equal leaves, the room faces carved like the pool face.
  const leaf = (DOOR[1] - DOOR[0]) / 2
  for (const [z, mirror] of [[DOOR[0] + leaf / 2, true], [DOOR[1] - leaf / 2, false]] as const)
    lk.box(room, 0.06, 3.0, leaf, [teak, ctx.h.doorLeaf(mirror), teak, teak, teak, teak], x1 + 0.08, 1.5, z, false)

  // The garden beyond the glass, glowing through the sheers.
  const viewE = new Mesh(new PlaneGeometry(d, 3.1), view)
  viewE.rotation.y = -PI / 2
  viewE.position.set(x1 + 0.18, 1.55, cz)
  room.add(viewE)
  const viewN = new Mesh(new PlaneGeometry(NORTH_WINDOW[1] - NORTH_WINDOW[0] + 0.4, 3.1), view)
  viewN.position.set((NORTH_WINDOW[0] + NORTH_WINDOW[1]) / 2, 1.55, z0 - 0.18)
  room.add(viewN)

  /* ---------- curtains ---------- */
  const hang = (geo: BufferGeometry, mat: Material, axis: 'x' | 'z', at: number, a: number, b: number) => {
    const m = new Mesh(geo, mat)
    const y = (0.012 + top - 0.02) / 2
    if (axis === 'z') {
      m.rotation.y = -PI / 2
      m.position.set(at, y, (a + b) / 2)
    } else m.position.set((a + b) / 2, y, at)
    m.castShadow = false
    m.receiveShadow = true
    room.add(m)
  }
  const ch = top - 0.032
  // The pool wall's sheers stop either side of the entrance, as photographed: the door, the narrow
  // panel beside it and the first bay of glazing stand uncurtained.
  const clearTo = GLAZING[0] + (GLAZING[1] - GLAZING[0]) / 4
  hang(pleated(NARROW[0] - z0 - 0.02, ch, 0.12, 0.09), sheer, 'z', x1 - 0.14, z0 + 0.02, NARROW[0])
  hang(pleated(z1 - 0.02 - clearTo, ch, 0.12, 0.09), sheer, 'z', x1 - 0.14, clearTo, z1 - 0.02)
  hang(pleated(x1 - 0.15 - (RETURN_END + 0.2), ch, 0.12, 0.09), sheer, 'x', z0 + 0.14, RETURN_END + 0.2, x1 - 0.15)

  /* ---------- floor coverings ---------- */
  const jute = (key: string, base: [number, number, number], seed: number, rx: number, ry: number) =>
    tiledMat(k, key, juteBraid(base, seed), [rx, ry], { roughness: 1 }, 256)
  // Three natural jute rugs laid edge to edge across the seating group, as photographed.
  for (const [rx0, rx1, shade] of [[-2.66, -0.75, 0], [-4.97, -2.7, 6], [-7.1, -5.01, -5]]) {
    const [rw, rd] = [rx1 - rx0, 3.45]
    const c = 186 + shade
    lk.box(room, rw, 0.014, rd, tone(jute(`living-rug${shade}`, [c, c - 40, c - 92], 56 + shade, rw / 0.6, rd / 0.6), 'rug'), (rx0 + rx1) / 2, 0.007, -0.45 - rd / 2, false)
  }
  // The half-oval jute mat at the door, its straight edge to the curtains.
  const matGeo = new CircleGeometry(1, 48, 0, PI)
  matGeo.scale(0.85, 0.7, 1)
  matGeo.rotateX(-PI / 2)
  matGeo.rotateY(PI / 2)
  lk.mesh(matGeo, jute('living-mat', [168, 118, 64], 57, 3, 3), room, x1 - 0.34, 0.006, (DOOR[0] + DOOR[1]) / 2, false)

  /* ---------- the sofa wall (south): limewash, the portrait, the sofa set ---------- */
  // The portrait: 1.88 m square in a slim black frame, 1.1 m off the floor, left of the sofa's centre.
  const art = lk.at(-2.66, z1, PI, 1.1 + 0.94)
  lk.box(art, 1.9, 1.9, 0.04, std({ color: '#141312', roughness: 0.5 }), 0, 0, -0.02)
  lk.box(art, 1.86, 1.86, 0.004, [espresso, espresso, espresso, espresso, ctx.h.portrait, espresso], 0, 0, 0.002, false)
  // The long black switch plate right of the painting, its cable dropping toward the corner table.
  lk.box(room, 0.28, 0.09, 0.012, std({ color: '#1a1918', roughness: 0.4 }), -6.09, 1.24, z1 - 0.006, false)
  const cable = new TubeGeometry(new CatmullRomCurve3([[-6.2, 1.2, z1 - 0.015], [-6.32, 0.95, z1 - 0.03], [-6.42, 0.75, 0.2], [-6.5, 0.6, 0.12]].map(([a, b, c]) => new Vector3(a, b, c))), 16, 0.004, 5)
  lk.mesh(cable, espresso, room, 0, 0, 0, false)

  const f = f0
  tone(f.linen, 'sofa')
  tone(f.slabTop, 'tableTop')
  tone(f.slabEdge, 'tableEdge')
  tone(f.reclaimed, 'tableLegs')
  tone(f.raku, 'vase')
  tone(f.linkWood, 'chain')
  tone(f.candle, 'candle')
  tone(f.teakTable, 'teakTable')
  tone(f.amphora, 'amphora')
  tone(f.studStone, 'studPot')
  tone(f.pedestalStone, 'pedestal')
  tone(f.consoleLog, 'consoleLog')
  tone(f.logEnd, 'consoleLog')
  tone(f.macrame, 'macrame')
  tone(f.grass, 'grass')
  tone(f.shade, 'lampShade')
  tone(f.lampStone, 'lampStone')
  tone(f.fragment, 'fragment')
  tone(f.blackStone, 'blackStone')
  tone(f.knit, 'pouf')
  tone(f.crochetPouf, 'crochet')
  tone(f.poufCore, 'crochet')
  sofa(lk, f, -3.67, -0.2, FACE.north)
  loungeChair(lk, f, -1.75, -1.35, FACE.west)
  sCurveSculpture(lk, f, -2.3, -0.88, 0.5)
  coffeeTable(lk, f, -3.4, -1.85)
  sideTable(lk, f, -1.3, -2.75)
  poufs(lk, f, [-6.25, -1.05], [-5.7, -1.75])
  cornerPedestals(lk, f, [-0.7, -0.02], [-1.15, 0.12])
  palmCorner(lk, f, [-6.55, -0.02], [-6.95, 0.18])
  pedestalFan(lk, f, -7.7, z1 + 0.35, PI + 0.4)

  // The north wall, as photographed: the rosewood log console with its carvings, candles and lamp,
  // the macramé above, two wooden switch plates with the lamp's cable, and black stoneware by the step.
  const consoleZ = z0 + 0.26
  logConsole(lk, f, -6.68, consoleZ, 3.6, 0.9)
  consoleDecor(lk, f, -6.68, consoleZ, 0.9)
  macrame(lk, f, -7.71, z0, 2.66)
  const plate = std({ color: '#5a3a26', roughness: 0.55 })
  for (const [px, pw] of [[-6.03, 0.27], [-5.73, 0.18]]) {
    lk.box(room, pw, 0.075, 0.012, plate, px, 1.25, z0 + 0.006, false)
    for (let i = 0; i < Math.round(pw / 0.045); i++) lk.box(room, 0.012, 0.02, 0.006, espresso, px - pw / 2 + 0.03 + i * 0.045, 1.25, z0 + 0.014, false)
  }
  const lampCable = new TubeGeometry(new CatmullRomCurve3([[-5.95, 1.22, z0 + 0.015], [-5.85, 1.05, z0 + 0.02], [-5.5, 0.93, z0 + 0.1], [-5.3, 0.92, consoleZ]].map(([a, b, c]) => new Vector3(a, b, c))), 16, 0.004, 5)
  lk.mesh(lampCable, espresso, room, 0, 0, 0, false)
  blackStoneware(lk, f, [-8.72, z0 + 0.32], [-9.22, z0 + 0.22])

  /* ---------- pendants ---------- */
  bellPendant(lk, -3.45, -1.25, 2.15, bulb, espresso)
  lanternPendant(lk, -0.95, -0.4, 1.2, bulb, espresso)

  // The console lamp, lit as photographed: a small warm pool on the wall above it.
  const lampLight = new PointLight('#ffc27a', 1.4, 3, 2)
  lampLight.position.set(-5.29, 1.26, consoleZ)
  room.add(lampLight)
  lighting.light(lampLight, 0.8)

  // Warm light from the big pendant, the cove and the downlights over the sofa wall: interiors stay softly lit by day.
  for (const [x, y, z, intensity, distance] of [[-3.45, 2.5, -1.25, 4, 8], [-2.2, 1.6, -5.0, 3, 9], [-3.0, 2.9, -0.9, 2.5, 6]]) {
    const l = new PointLight('#ffb46c', intensity, distance, 2)
    l.position.set(x, y, z)
    room.add(l)
    lighting.light(l, 0.8)
  }
}

/** A ceiling cord and canopy from the ceiling down to `y`. */
function cord(lk: Kit, p: Object3D, y: number, dark: Material) {
  lk.cyl(p, 0.06, 0.06, 0.02, dark, 0, H - 0.01, 0, 16)
  lk.cyl(p, 0.006, 0.006, H - y, dark, 0, (H + y) / 2, 0, 6).castShadow = false
}

/** The large open-weave rattan bell, its wire crown above, an Edison bulb inside. */
function bellPendant(lk: Kit, x: number, z: number, bottom: number, bulb: Material, dark: Material) {
  const g = lk.at(x, z, 0, 0)
  const weave = lk.tex.painted(256, 256, rattanWeave)
  weave.repeat.set(7, 1)
  const mat = std({ map: weave, alphaTest: 0.45, side: DoubleSide, roughness: 0.9 })
  const profile = [[0.47, 0], [0.465, 0.08], [0.42, 0.22], [0.33, 0.4], [0.22, 0.54], [0.13, 0.62], [0.06, 0.65]]
  const shade = new Mesh(new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), 48), mat)
  shade.position.y = bottom
  g.add(shade)
  // Four rods from a small hub down to the shade's shoulder.
  const hub = bottom + 0.98
  for (let i = 0; i < 4; i++) {
    const a = (i * PI) / 2 + PI / 4
    const dir = new Vector3(-Math.cos(a) * 0.2, hub - (bottom + 0.55), -Math.sin(a) * 0.2)
    const rod = lk.cyl(g, 0.005, 0.005, dir.length(), dark, Math.cos(a) * 0.1, (hub + bottom + 0.55) / 2, Math.sin(a) * 0.1, 4)
    rod.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize())
    rod.castShadow = false
  }
  cord(lk, g, hub, dark)
  lk.sphere(g, 0.05, bulb, 0, bottom + 0.42, 0)
  lk.cyl(g, 0.004, 0.004, hub - bottom - 0.47, dark, 0, (hub + bottom + 0.47) / 2, 0, 4)
}

/**
 * The tall seagrass lantern by the curtains, from its close-up photograph: a glossy terracotta cap,
 * a densely coiled domed shoulder, an open square-grid body round a clear Edison bulb, and a
 * coiled band at the hem, tapering slightly in.
 */
function lanternPendant(lk: Kit, x: number, z: number, bottom: number, bulb: Material, dark: Material) {
  const g = lk.at(x, z, 0, 0)
  const lathe = (pts: number[][]) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), 48)
  // Lit from inside, the seagrass glows faintly around the bulb.
  const coil = lk.tex.painted(256, 256, seagrassCoil)
  coil.repeat.set(5, 1)
  const coilMat = tone(std({ map: coil, roughness: 0.95, side: DoubleSide, emissive: '#ffae5a', emissiveMap: coil, emissiveIntensity: 0.15 }), 'lanternWeave')
  const grid = lk.tex.painted(256, 256, seagrassGrid)
  grid.repeat.set(6, 2)
  const gridMat = tone(std({ map: grid, alphaTest: 0.4, side: DoubleSide, roughness: 0.95, emissive: '#ffae5a', emissiveMap: grid, emissiveIntensity: 0.3 }), 'lanternWeave')
  const [R, band, body, shoulder, cap] = [0.275, 0.17, 0.48, 0.16, 0.125]
  lk.mesh(new CylinderGeometry(R, R - 0.025, band, 48, 1, true), coilMat, g, 0, bottom + band / 2, 0, false)
  lk.mesh(new CylinderGeometry(R, R, body, 48, 1, true), gridMat, g, 0, bottom + band + body / 2, 0, false)
  const y0 = bottom + band + body
  lk.mesh(lathe([[R, 0], [R - 0.008, 0.05], [0.235, 0.1], [0.17, 0.14], [0.1, shoulder]]), coilMat, g, 0, y0, 0, false)
  const terracotta = tone(std({ color: '#c46a2c', roughness: 0.32, side: DoubleSide }), 'lanternCap')
  lk.mesh(lathe([[0.105, 0], [0.1, 0.02], [0.075, 0.055], [0.045, 0.095], [0.022, 0.12], [0.016, cap]]), terracotta, g, 0, y0 + shoulder, 0, false)
  // The clear bulb on its cord, about halfway down the open body.
  const bulbY = bottom + band + body * 0.45
  lk.cyl(g, 0.004, 0.004, y0 + shoulder - bulbY - 0.06, dark, 0, (y0 + shoulder + bulbY + 0.06) / 2, 0, 6).castShadow = false
  lk.cyl(g, 0.016, 0.016, 0.04, dark, 0, bulbY + 0.05, 0, 12).castShadow = false
  lk.sphere(g, 0.033, bulb, 0, bulbY, 0).scale.set(1, 1.3, 1)
  cord(lk, g, y0 + shoulder + cap, dark)
}
