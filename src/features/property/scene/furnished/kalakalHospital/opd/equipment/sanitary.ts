import { DoubleSide, ExtrudeGeometry, FrontSide, Group, Mesh, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial, Path, Shape, type Material, type Object3D, type Side } from 'three'
import { PI } from '../../../kit'
import { bake, bentTube, face, geo, group, lathe, panel, put, rod } from '../../erKit'
import type { OpdCtx } from '../ctx'

/*
 * The OPD's sanitaryware and washroom fittings, built from the products a hospital specifies: a
 * wall-hung vitreous china WC (a 520 mm projection, 400 mm seat height, 420 mm for the accessible
 * WC) on its concealed cistern frame behind a tiled duct, with its seat and soft-close cover and
 * dual-flush plate; a wall-hung urinal with its sensor flush; a solid-surface vanity with
 * undermount china bowls, sensor pillar taps, bottle traps and angle valves; bevelled mirrors on
 * clips; stainless dispensers, a high-speed hand dryer, jumbo roll holders; compact-laminate WC
 * cubicles on adjustable feet under an aluminium head rail, their doors on rising hinges with
 * indicator locks; Doc M grab rails; floor drains and exhaust grilles. Every piece in its own
 * frame, its back against the wall at z = 0, front towards +z, standing on y = 0.
 */

const cache = new WeakMap<object, ReturnType<typeof make>>()
function make(e: OpdCtx) {
  const std = (color: string, roughness: number, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
  // Fittings lit by the room's own lamps: Phong highlights rather than the model's sky reflection
  // map (indoors that sky would show in every tap and mirror).
  const shiny = (color: string, shininess: number, specular: string, side: Side = FrontSide) => new MeshPhongMaterial({ color, shininess, specular, side })
  const silver = e.k.tex.painted(256, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w * 0.4, h)
    grad.addColorStop(0, '#dfe5e8')
    grad.addColorStop(0.45, '#c4ccd0')
    grad.addColorStop(1, '#aeb7bc')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
    g.fillStyle = 'rgba(255,255,255,.18)'
    g.beginPath()
    g.moveTo(w * 0.15, 0)
    g.lineTo(w * 0.3, 0)
    g.lineTo(w * 0.05, h)
    g.lineTo(-w * 0.1, h)
    g.fill()
  })
  return {
    /** Glazed vitreous china: white, a clear glaze over a matt body. */
    china: shiny('#f6f6f3', 70, '#4a4a4a'),
    /** The inside of a bowl, a shade greyer where the light doesn't reach, both faces drawn. */
    chinaIn: shiny('#e6e8e7', 60, '#3a3a3a', DoubleSide),
    water: shiny('#a3b3b7', 120, '#666666'),
    /** Chrome-plated brass, satin stainless, white powder coat, black ABS. */
    chrome: shiny('#a9afb3', 140, '#ffffff'),
    satin: shiny('#b9bec1', 40, '#8a8f92'),
    white: std('#f2f2ef', 0.4),
    black: std('#1b1c1e', 0.45),
    /** 13 mm compact laminate in a pale warm grey, its black phenolic core at the edges. */
    laminate: std('#dcd8cf', 0.42),
    core: std('#232323', 0.5),
    /** Aluminium head rail and fittings, clear anodised. */
    alu: shiny('#b3b8bb', 30, '#6e7275'),
    /** Solid surface (vanity tops) and its apron. */
    solid: std('#efefec', 0.3),
    /** A mirror: silvered glass, its sheen painted (no reflection is computed indoors). */
    mirror: new MeshLambertMaterial({ map: silver }),
    mirrorEdge: std('#9fb3b7', 0.15),
    rubber: std('#2a2b2d', 0.85),
    paper: std('#f4f3ee', 0.95),
    red: std('#c4161c', 0.45),
    green: std('#1d9a4a', 0.45),
    indicator: shiny('#c9cdcf', 60, '#888888'),
    sensor: shiny('#0d0f12', 90, '#555555'),
  }
}

/** The washroom finishes, made once per model. */
export function sanMats(e: OpdCtx) {
  let c = cache.get(e.o)
  if (!c) cache.set(e.o, (c = make(e)))
  return c
}

/** An extruded shape laid flat (its depth up the y axis), the shape's y becoming the plan's z. */
function flat(e: OpdCtx, key: string, make: () => Shape, depth: number, bevel: number) {
  return geo(e, `flat${key}`, () => {
    const g = new ExtrudeGeometry(make(), { depth: Math.max(0.001, depth - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24 })
    g.rotateX(-PI / 2)
    g.translate(0, bevel, 0)
    return g
  })
}

function ellipse(rx: number, rz: number, cz?: number): Shape
function ellipse(rx: number, rz: number, cz: number, path: Path): Path
function ellipse(rx: number, rz: number, cz = 0, path: Shape | Path = new Shape()) {
  path.absellipse(0, cz, rx, rz, 0, PI * 2, false, 0)
  return path
}

/* ---------- WC ---------- */

/**
 * A wall-hung WC as fitted to a concealed cistern frame: the vitreous china pan (an elongated
 * bowl tapering into its wall-mounted back), the water in it, the seat on stainless hinges with
 * its soft-close cover down, and the dual-flush plate on the duct above it at `plate` height.
 * `seat` is the seat's height (0.40 public, 0.48 accessible). Its back is at z = 0.
 */
export function wcPan(e: OpdCtx, p: Object3D, seat = 0.4, plate = 1.0, coverUp = false) {
  const { k } = e
  const c = sanMats(e)
  const top = seat - 0.025
  // The bowl: turned outside to its rim and back down inside, then stretched to its length.
  const bowl = put(p, lathe(e, 'wcBowl', [
    [0.0, 0.0], [0.1, 0.0], [0.125, 0.03], [0.15, 0.1], [0.168, 0.17], [0.178, 0.205], [0.178, 0.215], [0.168, 0.222],
    [0.135, 0.215], [0.115, 0.17], [0.085, 0.11], [0.05, 0.085], [0.0, 0.08],
  ], 32), c.china, 0, top - 0.222, 0.29)
  bowl.scale.set(1.0, 1.0, 1.42)
  // The back, flaring into the wall plate the frame's studs pass through.
  k.soft(p, 0.34, 0.2, 0.2, 0.06, c.china, 0, top - 0.11, 0.1)
  k.soft(p, 0.36, 0.24, 0.03, 0.012, c.china, 0, top - 0.11, 0.012)
  // Water standing in the trap.
  const w = put(p, geo(e, 'wcWater', () => {
    const g = new ExtrudeGeometry(ellipse(0.07, 0.1), { depth: 0.002, bevelEnabled: false, curveSegments: 20 })
    g.rotateX(-PI / 2)
    return g
  }), c.water, 0, top - 0.14, 0.33, false)
  w.receiveShadow = true
  // The seat: an open ring, and its cover lying on it (or raised against the duct).
  put(p, flat(e, 'wcSeat', () => {
    const s = ellipse(0.182, 0.225)
    s.holes.push(ellipse(0.115, 0.15, 0.02, new Path()))
    return s
  }, 0.022, 0.007), c.white, 0, top, 0.3)
  const cover = new Group()
  cover.position.set(0, top + 0.022, 0.07)
  p.add(cover)
  put(cover, flat(e, 'wcCover', () => ellipse(0.188, 0.232), 0.018, 0.008), c.white, 0, 0, 0.23)
  if (coverUp) cover.rotation.x = -PI / 2 + 0.12
  // Stainless hinges at the back, and the buffers under the seat.
  for (const s of [-1, 1]) {
    k.cyl(p, 0.012, 0.012, 0.05, c.satin, s * 0.075, top + 0.018, 0.07, 14).rotation.z = PI / 2
    k.box(p, 0.03, 0.012, 0.045, c.satin, s * 0.075, top - 0.004, 0.065)
  }
  // The flush plate on the duct face: a satin chrome plate with a small and a large button.
  put(p, panel(e, 0.246, 0.164, 0.012, 0.008), c.satin, 0, plate, 0.006)
  put(p, panel(e, 0.088, 0.13, 0.006, 0.006), c.chrome, -0.058, plate, 0.014)
  put(p, panel(e, 0.124, 0.13, 0.006, 0.006), c.chrome, 0.045, plate, 0.014)
  return bowl
}

/**
 * The tiled duct a row of concealed cisterns stands behind: `w` long, `h` high and `d` deep, its
 * top a tiled shelf; built against the wall at z = 0 from x = −w/2 to w/2.
 */
export function cisternDuct(e: OpdCtx, p: Object3D, w: number, h = 1.12, d = 0.2) {
  e.k.box(p, w, h, d, e.o.wallTile, 0, h / 2, d / 2)
  e.k.box(p, w, 0.02, d + 0.02, sanMats(e).solid, 0, h + 0.01, d / 2 + 0.01)
}

/**
 * The health faucet beside an Indian WC: its chrome angle valve on the wall, the braided hose
 * looping down, and the spray in its wall holder, at side `s` of the pan.
 */
export function healthFaucet(e: OpdCtx, p: Object3D, x: number, y = 0.62) {
  const { k } = e
  const c = sanMats(e)
  put(p, lathe(e, 'angleValve', [[0, 0], [0.018, 0], [0.018, 0.035], [0.012, 0.04], [0.012, 0.06], [0, 0.06]], 16), c.chrome, x, y - 0.2, 0, false).rotation.x = PI / 2
  k.cyl(p, 0.012, 0.012, 0.03, c.chrome, x, y - 0.17, 0.055, 12)
  put(p, bentTube(e, `hfHose${x.toFixed(2)}`, [[x, y - 0.2, 0.06], [x + 0.02, y - 0.36, 0.08], [x + 0.06, y - 0.38, 0.07], [x + 0.03, y - 0.06, 0.05]], 0.006, 0.05), c.satin, 0, 0, 0, false)
  k.box(p, 0.04, 0.06, 0.03, c.chrome, x + 0.03, y, 0.015)
  const spray = group(p, x + 0.03, y + 0.02, 0.045)
  spray.rotation.x = 0.25
  k.cyl(spray, 0.014, 0.012, 0.12, c.chrome, 0, -0.03, 0, 14)
  k.cyl(spray, 0.022, 0.016, 0.05, c.chrome, 0, 0.05, 0.0, 16)
}

/** A jumbo roll holder: white ABS dispenser, the paper roll seen through its smoked window, on the wall. */
export function jumboRoll(e: OpdCtx, p: Object3D, x: number, y: number) {
  const c = sanMats(e)
  const g = group(p, x, y, 0)
  const body = put(g, lathe(e, 'jumbo', [[0, 0], [0.135, 0], [0.142, 0.01], [0.142, 0.11], [0.134, 0.12], [0, 0.12]], 32), c.white, 0, 0, 0)
  body.rotation.x = PI / 2
  body.position.z = 0.12
  const win = e.k.cyl(g, 0.11, 0.11, 0.004, c.sensor, 0, 0.0, 0.122, 28)
  win.rotation.x = PI / 2
  e.k.cyl(g, 0.105, 0.105, 0.002, c.paper, 0, -0.02, 0.124, 28).rotation.x = PI / 2
  e.k.box(g, 0.08, 0.012, 0.03, c.paper, 0, -0.14, 0.07, false)
  e.k.box(g, 0.03, 0.03, 0.006, c.satin, 0, 0.1, 0.123, false)
}

/** A double robe hook in satin stainless, on a wall or a door at height y. */
export function robeHook(e: OpdCtx, p: Object3D, x: number, y = 1.6, z = 0) {
  const c = sanMats(e)
  e.k.cyl(p, 0.022, 0.022, 0.01, c.satin, x, y, z + 0.005, 16).rotation.x = PI / 2
  put(p, bentTube(e, 'hook', [[0, 0, 0.01], [0, 0, 0.05], [0, 0.03, 0.065]], 0.006, 0.02), c.satin, x, y, z, false)
}

/* ---------- urinal ---------- */

/** The side of a wall-hung urinal, seen from its right: z out from the wall, y up. */
function urinalProfile() {
  const s = new Shape()
  s.moveTo(0, 0.44)
  s.lineTo(0.12, 0.44)
  s.quadraticCurveTo(0.27, 0.47, 0.32, 0.62)
  s.quadraticCurveTo(0.35, 0.74, 0.3, 0.86)
  s.lineTo(0.26, 1.02)
  s.quadraticCurveTo(0.2, 1.1, 0.1, 1.1)
  s.lineTo(0, 1.1)
  s.lineTo(0, 0.44)
  return s
}

/**
 * A wall-hung vitreous china urinal: the body's side profile extruded across its 360 mm width with
 * softened edges, the bowl's shadowed opening and its strainer, the infra-red sensor flush valve
 * on the wall above, and a compact-laminate modesty screen at side `screen` (−1, 1, or 0 none).
 */
export function urinalUnit(e: OpdCtx, p: Object3D, screen: -1 | 0 | 1 = 1) {
  const { k } = e
  const c = sanMats(e)
  const body = put(p, geo(e, 'urinalBody', () => {
    const g = new ExtrudeGeometry(urinalProfile(), { depth: 0.3, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 14 })
    // Its profile's x (out from the wall) becomes +z, its extrusion runs across x, centred.
    g.rotateY(-PI / 2)
    g.translate(0.15, 0, 0)
    return g
  }), c.china, 0, 0, 0)
  // The bowl's opening on its front: a tall rounded recess, greyer inside, its lip proud of it,
  // the strainer at the foot.
  const lip = put(p, panel(e, 0.27, 0.46, 0.02, 0.1), c.china, 0, 0.78, 0.37, false)
  lip.rotation.x = -0.08
  const hollow = put(p, panel(e, 0.22, 0.4, 0.012, 0.09), c.chinaIn, 0, 0.77, 0.381, false)
  hollow.rotation.x = -0.08
  k.cyl(p, 0.03, 0.03, 0.006, c.satin, 0, 0.58, 0.37, 18).rotation.x = PI / 2 - 0.08
  // The sensor flush valve on the wall: a chrome housing with its dark eye, the supply into the urinal's spud.
  put(p, panel(e, 0.1, 0.13, 0.05, 0.01), c.chrome, 0, 1.24, 0.025)
  put(p, panel(e, 0.05, 0.03, 0.004, 0.006), c.sensor, 0, 1.225, 0.052)
  k.cyl(p, 0.012, 0.012, 0.1, c.chrome, 0, 1.15, 0.05, 12)
  if (screen) {
    const s = group(p, screen * 0.37, 0, 0)
    s.rotation.y = PI / 2
    put(s, panel(e, 0.42, 0.85, 0.013, 0.05), c.laminate, -0.23, 1.05, 0)
    for (const y of [0.75, 1.35]) k.box(s, 0.05, 0.03, 0.03, c.satin, -0.01, y, 0, false)
  }
  return body
}

/* ---------- vanity and basins ---------- */

/**
 * A solid-surface vanity `len` long and 0.55 deep at 0.82 m: the top cut for an undermount china
 * bowl at each of `at` (local x), its upstand and apron, cantilevered on steel brackets so the
 * floor stays clear for cleaning; under each bowl its pop-up waste, chrome bottle trap and the
 * angle valves on the wall; on the top a sensor pillar tap and a soap dispenser per bowl; a
 * bevelled mirror on clips over the length of it.
 */
export function vanityTop(e: OpdCtx, p: Object3D, len: number, at: number[], opts: { mirror?: boolean; height?: number } = {}) {
  const { k } = e
  const c = sanMats(e)
  const H = opts.height ?? 0.82
  const D = 0.55
  put(p, flat(e, `vanity${len.toFixed(2)}|${at.map((a) => a.toFixed(2)).join(',')}`, () => {
    const s = new Shape()
    s.moveTo(-len / 2, -D / 2)
    s.lineTo(len / 2, -D / 2)
    s.lineTo(len / 2, D / 2)
    s.lineTo(-len / 2, D / 2)
    s.lineTo(-len / 2, -D / 2)
    for (const x of at) {
      const h = new Path()
      h.absellipse(x, 0.03, 0.2, 0.15, 0, PI * 2, true, 0)
      s.holes.push(h)
    }
    return s
  }, 0.03, 0.004), c.solid, 0, H - 0.03, D / 2)
  k.box(p, len, 0.1, 0.012, c.solid, 0, H + 0.05, 0.006)
  k.box(p, len, 0.14, 0.02, c.solid, 0, H - 0.07, D - 0.01)
  for (const x of [-len / 2 + 0.15, len / 2 - 0.15, ...(len > 1.6 ? [0] : [])]) {
    k.box(p, 0.03, 0.04, D - 0.08, c.satin, x, H - 0.05, D / 2 - 0.02)
    k.box(p, 0.03, 0.2, 0.012, c.satin, x, H - 0.15, 0.006)
  }
  for (const x of at) {
    // The bowl under the top, its inside, the waste.
    const b = put(p, lathe(e, 'ubBowl', [[0.205, 0.0], [0.2, -0.03], [0.17, -0.1], [0.11, -0.145], [0.0, -0.155]], 32), c.chinaIn, x, H - 0.03, D / 2 + 0.03 - 0.01, false)
    b.scale.set(1.0, 1, 0.78)
    const o = put(p, lathe(e, 'ubOut', [[0.0, -0.165], [0.12, -0.155], [0.18, -0.11], [0.212, -0.03], [0.214, 0.0]], 32), c.china, x, H - 0.03, D / 2 + 0.02, false)
    o.scale.set(1.0, 1, 0.78)
    k.cyl(p, 0.022, 0.022, 0.004, c.chrome, x, H - 0.183, D / 2 + 0.03, 18)
    // Under the bowl: the waste tail, the bottle trap and its arm back to the wall.
    k.cyl(p, 0.016, 0.016, 0.12, c.chrome, x, H - 0.25, D / 2 + 0.03, 12)
    put(p, lathe(e, 'bottleTrap', [[0, 0], [0.03, 0], [0.034, 0.01], [0.034, 0.12], [0.022, 0.135], [0.016, 0.14], [0, 0.14]], 18), c.chrome, x, H - 0.45, D / 2 + 0.03, false)
    rod(e, p, 0.016, D / 2 + 0.03, c.chrome, x, H - 0.37, (D / 2 + 0.03) / 2, 'z', 12)
    // The angle valves feeding the tap, and its flexible connectors.
    for (const s of [-1, 1]) {
      put(p, lathe(e, 'angleValve', [[0, 0], [0.018, 0], [0.018, 0.035], [0.012, 0.04], [0.012, 0.06], [0, 0.06]], 16), c.chrome, x + s * 0.12, H - 0.33, 0, false).rotation.x = PI / 2
      put(p, bentTube(e, `flexi${s}`, [[s * 0.12, -0.33, 0.06], [s * 0.1, -0.25, 0.1], [s * 0.03, -0.12, 0.12], [0, 0.02, 0.12]], 0.004, 0.04), c.satin, x, H, 0, false)
    }
    tapSensor(e, p, x, H, 0.12)
    soapPump(e, p, x + 0.26, H, 0.1)
  }
  if (opts.mirror ?? true) mirror(e, p, len - 0.08, 0.9, H + 0.75)
}

/** A sensor pillar tap on a top at height `top`: the turned body, the curved spout and its aerator, the sensor eye. */
export function tapSensor(e: OpdCtx, p: Object3D, x: number, top: number, z: number) {
  const c = sanMats(e)
  put(p, lathe(e, 'tapBody', [[0, 0], [0.028, 0], [0.028, 0.006], [0.02, 0.012], [0.019, 0.17], [0.017, 0.19], [0, 0.19]], 20), c.chrome, x, top, z, false)
  put(p, bentTube(e, 'tapSpout', [[0, 0.17, 0], [0, 0.2, 0.03], [0, 0.19, 0.11], [0, 0.16, 0.12]], 0.014, 0.05), c.chrome, x, top, z, false)
  e.k.cyl(p, 0.011, 0.011, 0.012, c.satin, x, top + 0.155, z + 0.12, 14)
  e.k.box(p, 0.012, 0.012, 0.004, c.sensor, x, top + 0.13, z + 0.02, false)
}

/** A lever mixer (single lever, for an accessible or clinical basin) on a top at `top`. */
export function tapLever(e: OpdCtx, p: Object3D, x: number, top: number, z: number) {
  const c = sanMats(e)
  put(p, lathe(e, 'mixBody', [[0, 0], [0.026, 0], [0.026, 0.006], [0.02, 0.012], [0.02, 0.13], [0, 0.13]], 20), c.chrome, x, top, z, false)
  put(p, bentTube(e, 'mixSpout', [[0, 0.11, 0], [0, 0.13, 0.04], [0, 0.12, 0.13], [0, 0.1, 0.14]], 0.012, 0.04), c.chrome, x, top, z, false)
  // The long hospital lever, operable by the wrist.
  const lever = put(p, bentTube(e, 'mixLever', [[0, 0, 0], [-0.03, 0.01, 0], [-0.17, 0.02, 0]], 0.007, 0.02), c.chrome, x, top + 0.14, z, false)
  lever.rotation.y = 0.3
}

/** A deck-mounted soap dispenser: the chrome pump head and its spout, the bottle under the top. */
export function soapPump(e: OpdCtx, p: Object3D, x: number, top: number, z: number) {
  const c = sanMats(e)
  put(p, lathe(e, 'soapHead', [[0, 0], [0.024, 0], [0.024, 0.008], [0.014, 0.014], [0.012, 0.07], [0.016, 0.08], [0, 0.08]], 18), c.chrome, x, top, z, false)
  put(p, bentTube(e, 'soapSpout', [[0, 0.075, 0], [0, 0.08, 0.04], [0, 0.07, 0.07]], 0.006, 0.02), c.chrome, x, top, z, false)
}

/** A mirror w × h centred at y: 6 mm glass with a polished bevel, on four satin clips, its foot a little proud of the wall. */
export function mirror(e: OpdCtx, p: Object3D, w: number, h: number, y: number, tilt = 0) {
  const c = sanMats(e)
  const g = group(p, 0, y, 0.012)
  g.rotation.x = -tilt
  put(g, panel(e, w + 0.006, h + 0.006, 0.006, 0.004, [], 0.002), c.mirrorEdge, 0, 0, 0, false)
  put(g, panel(e, w - 0.03, h - 0.03, 0.008, 0.004, [], 0.0015), c.mirror, 0, 0, 0.001, false)
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) e.k.box(g, 0.03, 0.02, 0.014, c.satin, sx * (w / 2 - 0.08), sy * (h / 2 + 0.004), 0.002, false)
}

/**
 * A wall-hung hand-wash basin (clinical or accessible), w wide: the china basin with its rounded
 * front and integral back, no overflow, the lever mixer on it, the waste and bottle trap under,
 * at rim height `rim`.
 */
export function wallBasin(e: OpdCtx, p: Object3D, w = 0.55, rim = 0.8) {
  const { k } = e
  const c = sanMats(e)
  k.soft(p, w, 0.17, 0.44, 0.05, c.china, 0, rim - 0.085, 0.22)
  const b = put(p, lathe(e, 'wbBowl', [[0.19, 0.0], [0.185, -0.03], [0.15, -0.09], [0.09, -0.12], [0.0, -0.125]], 32), c.chinaIn, 0, rim + 0.001, 0.26, false)
  b.scale.set((w - 0.12) / 0.38, 1, 0.75)
  k.box(p, w - 0.03, 0.006, 0.08, c.china, 0, rim + 0.003, 0.04, false)
  tapLever(e, p, 0, rim, 0.06)
  k.cyl(p, 0.02, 0.02, 0.004, c.chrome, 0, rim - 0.122, 0.27, 16)
  put(p, lathe(e, 'bottleTrap', [[0, 0], [0.03, 0], [0.034, 0.01], [0.034, 0.12], [0.022, 0.135], [0.016, 0.14], [0, 0.14]], 18), c.chrome, 0, rim - 0.34, 0.24, false)
  rod(e, p, 0.016, 0.24, c.chrome, 0, rim - 0.26, 0.12, 'z', 12)
}

/* ---------- dispensers ---------- */

/** A wall soap or hand-rub dispenser: satin stainless and white, its window showing the level, its push bar. */
export function soapDispenser(e: OpdCtx, p: Object3D, x: number, y: number, rub = false) {
  const { k } = e
  const c = sanMats(e)
  const g = group(p, x, y, 0)
  put(g, panel(e, 0.11, 0.24, 0.1, 0.02), rub ? c.white : c.satin, 0, 0, 0.05)
  k.box(g, 0.05, 0.08, 0.004, c.sensor, 0, 0.03, 0.101, false)
  put(g, panel(e, 0.09, 0.04, 0.03, 0.01), rub ? c.green : c.black, 0, -0.1, 0.095)
}

/** A stainless paper towel dispenser (Z-fold), its window and lock, the towel edge showing below. */
export function towelDispenser(e: OpdCtx, p: Object3D, x: number, y: number) {
  const { k } = e
  const c = sanMats(e)
  const g = group(p, x, y, 0)
  put(g, panel(e, 0.28, 0.38, 0.11, 0.015), c.satin, 0, 0, 0.055)
  k.box(g, 0.14, 0.04, 0.004, c.sensor, 0, 0.08, 0.111, false)
  k.box(g, 0.2, 0.012, 0.02, c.black, 0, -0.185, 0.07, false)
  k.box(g, 0.18, 0.05, 0.002, c.paper, 0, -0.205, 0.075, false)
  k.cyl(g, 0.008, 0.008, 0.004, c.black, 0, 0.16, 0.111, 10).rotation.x = PI / 2
}

/** A high-speed hand dryer: a rounded satin stainless housing, the air outlet under it, the sensor. */
export function handDryerUnit(e: OpdCtx, p: Object3D, x: number, y: number) {
  const { k } = e
  const c = sanMats(e)
  const g = group(p, x, y, 0)
  k.soft(g, 0.28, 0.32, 0.18, 0.07, c.satin, 0, 0, 0.09)
  k.soft(g, 0.16, 0.04, 0.08, 0.018, c.black, 0, -0.165, 0.12)
  k.box(g, 0.06, 0.012, 0.004, c.sensor, 0, -0.11, 0.18, false)
  put(g, panel(e, 0.07, 0.025, 0.004, 0.005), c.indicator, 0, 0.09, 0.181, false)
}

/** A pedal bin, `r` in radius: the white body, black lid and pedal; a sanitary bin is the small one. */
export function pedalBin(e: OpdCtx, p: Object3D, r = 0.12, h = 0.36, lid: Material = sanMats(e).black) {
  const c = sanMats(e)
  put(p, lathe(e, `pbin${r}|${h}`, [[0, 0], [r * 0.86, 0], [r * 0.9, 0.012], [r, h - 0.02], [r * 1.02, h], [0, h]], 24), c.white, 0, 0, 0)
  put(p, lathe(e, `pbinLid${r}`, [[0, 0], [r * 1.04, 0], [r * 1.04, 0.012], [r * 0.9, 0.035], [0, 0.04]], 24), lid, 0, h, 0)
  e.k.box(p, 0.07, 0.015, 0.06, lid, 0, 0.02, r + 0.02, false)
}

/* ---------- cubicles ---------- */

/**
 * A run of `n` WC cubicles along local x from 0, each `cw` wide and `depth` deep, against the
 * wall at z = 0: 13 mm compact-laminate side panels on adjustable stainless feet (150 mm clear
 * under them for cleaning), pilasters and a 600 mm door in each front, a 25 × 50 mm aluminium
 * head rail over the fronts, the doors on three rising hinges with an indicator lock and a pull
 * (each an operated door_ that swings in), a robe hook on the inside; behind them a tiled duct
 * hiding the concealed cisterns, and in each a wall-hung WC, its health faucet, a jumbo roll
 * holder and (ladies) a sanitary bin.
 */
export function cubicleRun(e: OpdCtx, p: Object3D, n: number, cw: number, depth: number, name: string, opts: { ladies?: boolean; endLeft?: boolean; endRight?: boolean; duct?: number } = {}) {
  const { k } = e
  const c = sanMats(e)
  const H = 1.85
  const lift = 0.15
  const duct = opts.duct ?? 0.2
  const len = n * cw
  cisternDuct(e, group(p, len / 2, 0, 0), len, 1.12, duct)
  const sidePanel = (x: number) => {
    const s = group(p, x, 0, 0)
    s.rotation.y = -PI / 2
    put(s, panel(e, depth - duct - 0.01, H, 0.013, 0.02), c.laminate, duct + (depth - duct) / 2, lift + H / 2, 0)
    for (const z of [duct + 0.1, depth - 0.12]) foot(e, p, x, z)
    // Wall channel and the brackets to the pilaster.
    k.box(p, 0.03, H, 0.025, c.alu, x, lift + H / 2, duct + 0.012)
  }
  for (let i = 0; i <= n; i++) {
    if ((i === 0 && !opts.endLeft) || (i === n && !opts.endRight)) continue
    sidePanel(i * cw)
  }
  // The head rail, round the top of the fronts.
  k.box(p, len + 0.02, 0.05, 0.025, c.alu, len / 2, lift + H + 0.025, depth)
  for (let i = 0; i < n; i++) {
    const x0 = i * cw
    const cx = x0 + cw / 2
    const dw = 0.6
    const d0 = cx - dw / 2 + 0.06
    // Pilasters either side of the door, on their feet.
    for (const [a, b] of [[x0, d0], [d0 + dw, x0 + cw]]) {
      if (b - a < 0.01) continue
      put(p, panel(e, b - a, H + 0.05, 0.013, 0.01), c.laminate, (a + b) / 2, lift + (H + 0.05) / 2, depth)
      foot(e, p, (a + b) / 2, depth)
    }
    // The door on its rising hinges, swinging in.
    const node = new Group()
    node.name = `door_${name}_cubicle${i}`
    node.position.set(d0, 0, depth)
    node.userData.openAngle = 1.4
    node.userData.label = 'Cubicle Door'
    p.add(node)
    const leaf = put(node, panel(e, dw - 0.006, H - 0.03, 0.013, 0.01), c.laminate, dw / 2, lift + H / 2 - 0.01, 0)
    leaf.userData.front = true
    for (const y of [0.32, 1.0, 1.75]) k.cyl(node, 0.009, 0.009, 0.08, c.alu, 0.0, y, 0.0, 12)
    // The indicator lock: the outside's red/green window and emergency release, the inside's turn.
    put(node, lathe(e, 'lockRose', [[0, 0], [0.028, 0], [0.028, 0.006], [0, 0.009]], 18), c.indicator, dw - 0.06, 1.05, 0.0065, false).rotation.x = PI / 2
    k.box(node, 0.02, 0.008, 0.004, c.red, dw - 0.06, 1.05, 0.0105, false)
    put(node, lathe(e, 'lockRose', [[0, 0], [0.028, 0], [0.028, 0.006], [0, 0.009]], 18), c.indicator, dw - 0.06, 1.05, -0.0065, false).rotation.x = -PI / 2
    k.box(node, 0.012, 0.04, 0.012, c.indicator, dw - 0.06, 1.05, -0.016, false)
    // A pull handle each side, and the robe hook inside.
    for (const s of [-1, 1]) put(node, bentTube(e, 'cubPull', [[0, -0.07, 0], [0, -0.07, 0.035], [0, 0.07, 0.035], [0, 0.07, 0]], 0.008, 0.015), c.satin, dw - 0.06, 0.9, s * 0.0065, false).rotation.y = s > 0 ? 0 : PI
    robeHook(e, group(node, dw / 2, 0, -0.0065, PI), 0, 1.62, 0)
    bake(node, leaf)
    // In the cubicle: the WC on the duct, its health faucet, roll holder, (ladies) sanitary bin.
    const w = group(p, cx, 0, duct)
    wcPan(e, w, 0.4, 0.98)
    healthFaucet(e, group(p, cx - cw / 2 + 0.03, 0, duct + 0.15, PI / 2), 0, 0.62)
    jumboRoll(e, group(p, x0 + cw - 0.0065, 0, duct + 0.45, -PI / 2), 0, 0.72)
    if (opts.ladies) {
      const b = group(p, x0 + 0.17, 0, duct + 0.55)
      pedalBin(e, b, 0.11, 0.33, c.white)
    }
  }
}

/** An adjustable stainless cubicle foot: the threaded stem in its round cover, on its floor plate. */
function foot(e: OpdCtx, p: Object3D, x: number, z: number) {
  const c = sanMats(e)
  put(p, lathe(e, 'cubFoot', [[0, 0], [0.028, 0], [0.028, 0.006], [0.012, 0.012], [0.012, 0.12], [0.018, 0.125], [0.018, 0.15], [0, 0.15]], 14), c.satin, x, 0, z, false)
}

/* ---------- accessible fittings ---------- */

/** A grab rail: 32 mm satin stainless tube through `pts` (local, off the wall), on round flanges at its ends. */
export function grabRail(e: OpdCtx, p: Object3D, key: string, pts: [number, number, number][]) {
  const c = sanMats(e)
  put(p, bentTube(e, `grab${key}`, pts, 0.016, 0.06), c.satin, 0, 0, 0)
  for (const [x, y, z] of [pts[0], pts[pts.length - 1]]) {
    if (z > 0.02) continue
    e.k.cyl(p, 0.035, 0.035, 0.012, c.satin, x, y, 0.006, 18).rotation.x = PI / 2
  }
}

/** A hinged drop-down support rail, folded down, beside a WC: its wall plate, pivot and the U of the rail along +z. */
export function dropDownRail(e: OpdCtx, p: Object3D, y = 0.75, len = 0.8) {
  const { k } = e
  const c = sanMats(e)
  put(p, panel(e, 0.1, 0.22, 0.03, 0.01), c.satin, 0, y + 0.02, 0.015)
  k.cyl(p, 0.03, 0.03, 0.08, c.satin, 0, y, 0.06, 18)
  put(p, bentTube(e, `drop${len}`, [[-0.03, y, 0.06], [-0.03, y, len], [0.03, y, len], [0.03, y - 0.08, len - 0.05]], 0.016, 0.03), c.satin, 0, 0, 0)
  put(p, bentTube(e, `drop2${len}`, [[0.03, y - 0.08, len - 0.05], [0.03, y - 0.08, 0.1]], 0.016, 0.03), c.satin, 0, 0, 0)
}

/** A fold-down baby-changing station, closed against the wall: its rounded grey shell, the strap icon, the hinge line. */
export function babyChanger(e: OpdCtx, p: Object3D, y = 0.95) {
  const { k } = e
  const c = sanMats(e)
  put(p, panel(e, 0.89, 0.57, 0.1, 0.06), e.m.greyPlastic, 0, y, 0.05)
  put(p, panel(e, 0.8, 0.48, 0.012, 0.05), c.white, 0, y, 0.105)
  k.box(p, 0.2, 0.06, 0.004, e.o.navy, 0, y + 0.1, 0.112, false)
  k.box(p, 0.85, 0.012, 0.012, c.alu, 0, y - 0.29, 0.1, false)
}

/** The emergency assistance alarm: the pull cord from its ceiling unit with its two red triangles, the reset button and the lamp over the door outside. */
export function pullCord(e: OpdCtx, p: Object3D, ceiling: number) {
  const { k } = e
  const c = sanMats(e)
  put(p, lathe(e, 'cordUnit', [[0, 0], [0.04, 0], [0.04, 0.03], [0, 0.03]], 16), c.white, 0, ceiling - 0.03, 0.15, false)
  k.cyl(p, 0.002, 0.002, ceiling - 0.13, c.red, 0, (ceiling + 0.1) / 2, 0.15, 6)
  for (const y of [0.1, 0.85]) {
    const t = put(p, geo(e, 'cordTri', () => {
      const s = new Shape()
      s.moveTo(-0.025, 0)
      s.lineTo(0.025, 0)
      s.lineTo(0, -0.045)
      return new ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false })
    }), c.red, 0, y, 0.147, false)
    t.castShadow = false
  }
  put(p, panel(e, 0.086, 0.086, 0.03, 0.008), c.white, 0.25, 1.0, 0.015)
  k.cyl(p, 0.022, 0.022, 0.012, c.red, 0.25, 1.0, 0.036, 16).rotation.x = PI / 2
}

/* ---------- floor and ceiling ---------- */

/** A 150 mm stainless floor gully: its frame and the slotted grating. */
export function floorDrain(e: OpdCtx, p: Object3D) {
  const { k } = e
  const c = sanMats(e)
  k.box(p, 0.16, 0.004, 0.16, c.satin, 0, 0.013, 0, false)
  for (let i = -3; i <= 3; i++) k.box(p, 0.01, 0.002, 0.11, c.sensor, i * 0.018, 0.0155, 0, false)
}

/** A square exhaust grille in the ceiling at height `ceiling`: the white frame and its louvres. */
export function exhaustGrille(e: OpdCtx, p: Object3D, ceiling: number, size = 0.3) {
  const { k } = e
  const c = sanMats(e)
  k.box(p, size, 0.01, size, c.white, 0, ceiling - 0.005, 0, false)
  for (let i = 0; i < 6; i++) k.box(p, size - 0.04, 0.012, 0.012, c.black, 0, ceiling - 0.012, -size / 2 + 0.04 + i * ((size - 0.08) / 5), false)
}

/** A washroom pictogram plate (ladies, gents, accessible) for a wall, its art painted once. */
export function washroomSign(e: OpdCtx, p: Object3D, kind: 'ladies' | 'gents' | 'accessible', y = 1.6) {
  const key = `washsign_${kind}`
  const mat = e.o.sign(key, 256, 256, (g, w, h) => {
    g.fillStyle = '#1c3966'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffffff'
    const cx = w / 2
    g.beginPath()
    g.arc(cx, h * 0.24, h * 0.08, 0, PI * 2)
    g.fill()
    if (kind === 'accessible') {
      g.lineWidth = h * 0.06
      g.strokeStyle = '#ffffff'
      g.beginPath()
      g.arc(cx, h * 0.66, h * 0.17, 0.2, PI * 1.6)
      g.stroke()
      g.fillRect(cx - h * 0.03, h * 0.34, h * 0.06, h * 0.24)
      g.fillRect(cx - h * 0.02, h * 0.52, h * 0.2, h * 0.05)
      return
    }
    if (kind === 'ladies') {
      g.beginPath()
      g.moveTo(cx - h * 0.04, h * 0.34)
      g.lineTo(cx + h * 0.04, h * 0.34)
      g.lineTo(cx + h * 0.15, h * 0.68)
      g.lineTo(cx - h * 0.15, h * 0.68)
      g.closePath()
      g.fill()
    } else g.fillRect(cx - h * 0.1, h * 0.34, h * 0.2, h * 0.34)
    g.fillRect(cx - h * 0.08, h * 0.66, h * 0.06, h * 0.22)
    g.fillRect(cx + h * 0.02, h * 0.66, h * 0.06, h * 0.22)
  })
  const g = group(p, 0, y, 0.006)
  e.k.box(g, 0.2, 0.2, 0.01, sanMats(e).white, 0, 0, 0, false)
  const f = new Mesh(geo(e, 'washPlane', () => panelPlane()), mat)
  f.position.z = 0.0055
  g.add(f)
}

function panelPlane() {
  const s = new Shape()
  s.moveTo(-0.095, -0.095)
  s.lineTo(0.095, -0.095)
  s.lineTo(0.095, 0.095)
  s.lineTo(-0.095, 0.095)
  const g = new ExtrudeGeometry(s, { depth: 0.0005, bevelEnabled: false })
  // UVs for a square sign on its face: map the shape's x, y in −0.095 … 0.095 to 0 … 1.
  const uv = g.getAttribute('uv')
  const pos = g.getAttribute('position')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 0.095) / 0.19, (pos.getY(i) + 0.095) / 0.19)
  return g
}

/**
 * A clinical hand-wash point on a wall: the wall-hung basin with its lever mixer at 850 mm, a soap
 * and an alcohol-rub dispenser either side above it, the paper towel dispenser beside, and the
 * hand-washing steps poster.
 */
export function handWashPoint(e: OpdCtx, p: Object3D, w = 0.5) {
  wallBasin(e, p, w, 0.85)
  soapDispenser(e, p, -0.22, 1.32)
  soapDispenser(e, p, 0.0, 1.32, true)
  towelDispenser(e, p, w / 2 + 0.3, 1.3)
  face(e, p, 0.3, 0.42, e.m.poster, -w / 2 - 0.3, 1.5, 0.002)
}
