import { Group, type Object3D } from 'three'
import { PI } from '../../kit'
import { bake, bentTube, face, group, lathe, put, rod, tube } from '../erKit'
import type { OpdCtx, Room } from '../opd/ctx'
import { yawInto } from '../opd/ctx'
import { dropDownRail, exhaustGrille, floorDrain, grabRail, healthFaucet, mirror, pullCord, robeHook, sanMats, soapDispenser, vanityTop, wallBasin, wcPan, cisternDuct } from '../opd/equipment/sanitary'
import type { Fitter } from '../opd/rooms/types'
import { kitMats } from './kit'

/*
 * The washroom en suite to every inpatient room and suite, fitted as a hospital fits them: level
 * access (no shower tray to step over), anti-slip tiles falling to a linear drain under the
 * shower, the WC on one side wall with its grab rails and the toilet roll and health faucet beside
 * it, the basin on the other under its mirror and dispensers, the shower across the far end
 * behind a fixed 8 mm glass screen with a fold-down seat, a thermostatic mixer, the overhead and
 * hand showers; a towel rail and robe hook on the door wall, the nurse-call pull cord, the exhaust
 * fan over the shower. The washroom's door is in the plan (opening out, so a fallen patient
 * can't block it); everything is laid out from it.
 *
 * A ward washroom has a close-coupled WC with its cistern on show and a china basin; a suite's,
 * a wall-hung WC on its concealed cistern, a stone vanity with an undermount basin, a walk-in
 * shower in frameless glass.
 */

/** A close-coupled floor-standing WC, back against the wall at z = 0, facing +z: pan, seat, lid (operated), cistern and its dual-flush buttons. */
export function coupledWc(e: OpdCtx, p: Object3D) {
  const { k } = e
  const c = sanMats(e)
  const seat = 0.42
  // The pedestal and bowl, turned and stretched as a vitreous china pan is.
  const ped = put(p, lathe(e, 'ccPedestal', [[0, 0], [0.13, 0], [0.12, 0.06], [0.1, 0.2], [0.12, 0.3], [0.16, 0.36], [0.18, 0.385], [0, 0.385]], 32), c.china, 0, 0, 0.36)
  ped.scale.set(1, 1, 1.3)
  const bowl = put(p, lathe(e, 'ccBowl', [[0.18, 0], [0.175, -0.04], [0.14, -0.12], [0.08, -0.17], [0, -0.18]], 32), c.chinaIn, 0, seat - 0.02, 0.38, false)
  bowl.scale.set(0.92, 1, 1.28)
  put(p, lathe(e, 'ccWater', [[0, 0], [0.07, 0], [0, 0.001]], 20), c.water, 0, seat - 0.17, 0.4, false).scale.set(1, 1, 1.3)
  k.soft(p, 0.36, 0.3, 0.2, 0.06, c.china, 0, 0.27, 0.12)
  // The seat ring, its hinges, and the lid on its own hinge (lifts: Lift / Lower).
  put(p, lathe(e, 'ccSeat', [[0.12, 0], [0.18, 0], [0.185, 0.01], [0.18, 0.022], [0.12, 0.02]], 32), c.white, 0, seat - 0.02, 0.4, true).scale.set(1, 1, 1.25)
  for (const s of [-1, 1]) k.cyl(p, 0.012, 0.012, 0.04, c.satin, s * 0.08, seat + 0.01, 0.16, 12).rotation.z = PI / 2
  const lid = new Group()
  lid.name = `door_er_${e.ids++}`
  lid.position.set(0, seat + 0.012, 0.165)
  lid.userData = { axis: 'x', openAngle: -1.45, label: 'Toilet Lid', verbs: ['Lift', 'Lower'] }
  p.add(lid)
  const cover = put(lid, lathe(e, 'ccLid', [[0, 0], [0.19, 0], [0.195, 0.008], [0.185, 0.018], [0, 0.02]], 32), c.white, 0, 0, 0.235)
  cover.scale.set(1, 1, 1.25)
  cover.userData.front = true
  bake(lid, cover)
  // The cistern on the pan's back, its lid and the dual-flush push buttons in it.
  k.soft(p, 0.4, 0.36, 0.17, 0.03, c.china, 0, seat + 0.2, 0.09)
  k.soft(p, 0.42, 0.035, 0.19, 0.015, c.china, 0, seat + 0.395, 0.09)
  k.cyl(p, 0.028, 0.028, 0.012, c.chrome, -0.035, seat + 0.418, 0.09, 20)
  k.cyl(p, 0.028, 0.028, 0.012, c.chrome, 0.035, seat + 0.418, 0.09, 20)
  k.box(p, 0.002, 0.014, 0.05, c.satin, 0, seat + 0.424, 0.09, false)
  // Angle valve on the wall and the braided supply up into the cistern.
  put(p, lathe(e, 'ccValve', [[0, 0], [0.016, 0], [0.016, 0.04], [0, 0.04]], 14), c.chrome, -0.16, 0.25, 0, false).rotation.x = PI / 2
  put(p, tube(e, 'ccSupply', [[-0.16, 0.25, 0.04], [-0.17, 0.3, 0.06], [-0.15, 0.42, 0.07], [-0.14, seat + 0.05, 0.08]], 0.005), c.satin)
}

/** A towel rail on a wall at z = 0: a chrome bar on two posts, a folded towel over it. */
function towelRail(e: OpdCtx, p: Object3D, x: number, y: number, len = 0.6) {
  const c = sanMats(e)
  const t = kitMats(e)
  for (const s of [-1, 1]) put(p, lathe(e, 'trPost', [[0, 0], [0.018, 0], [0.018, 0.008], [0.009, 0.012], [0.009, 0.075], [0, 0.075]], 14), c.chrome, x + s * len / 2, y, 0, false).rotation.x = PI / 2
  rod(e, p, 0.009, len, c.chrome, x, y, 0.072, 'x', 12)
  e.k.soft(p, len * 0.7, 0.42, 0.03, 0.012, t.towel, x, y - 0.2, 0.085)
  e.k.soft(p, len * 0.7, 0.36, 0.028, 0.012, t.towel, x, y - 0.17, 0.058)
}

/** A domestic toilet roll holder: a chrome arm with the roll on it, its back plate at z = 0. */
function rollHolder(e: OpdCtx, p: Object3D, x: number, y: number) {
  const c = sanMats(e)
  e.k.cyl(p, 0.025, 0.025, 0.01, c.chrome, x, y, 0.005, 16).rotation.x = PI / 2
  put(p, bentTube(e, 'rollArm', [[0, 0, 0.005], [0, 0, 0.06], [0.13, 0, 0.06]], 0.006, 0.015), c.chrome, x, y, 0, false)
  e.k.cyl(p, 0.055, 0.055, 0.1, kitMats(e).towel, x + 0.07, y, 0.06, 24).rotation.z = PI / 2
}

/**
 * The shower's fittings on the far wall (its face at z = 0, centred at x): a thermostatic bar
 * mixer with its two handles at 1.05 m, the rain head on its arm at 2.15 m, the slide rail with
 * the hand shower and its hose.
 */
function showerSet(e: OpdCtx, p: Object3D, x: number, premium: boolean) {
  const { k } = e
  const c = sanMats(e)
  // The bar mixer and its handles.
  k.cyl(p, 0.03, 0.03, 0.32, c.chrome, x, 1.05, 0.06, 24).rotation.z = PI / 2
  for (const s of [-1, 1]) {
    put(p, bentTube(e, 'shSupply', [[0, 0, 0], [0, 0, 0.06]], 0.012, 0.01), c.chrome, x + s * 0.15, 1.05, 0, false)
    k.cyl(p, 0.034, 0.034, 0.05, c.chrome, x + s * 0.19, 1.05, 0.06, 24).rotation.z = PI / 2
  }
  k.box(p, 0.06, 0.004, 0.012, c.red, x - 0.19, 1.085, 0.06, false)
  // The rain head on its wall arm.
  put(p, bentTube(e, 'shArm', [[0, 0, 0], [0, 0, 0.3], [0, -0.05, 0.36]], 0.012, 0.04), c.chrome, x, 2.2, 0, false)
  if (premium) k.box(p, 0.3, 0.012, 0.3, c.chrome, x, 2.14, 0.36)
  else k.cyl(p, 0.11, 0.11, 0.02, c.chrome, x, 2.14, 0.36, 32)
  k.cyl(p, premium ? 0.13 : 0.095, premium ? 0.13 : 0.095, 0.002, c.sensor, x, 2.129, 0.36, 32)
  // The slide rail, the hand shower on it, its hose to the mixer.
  const rx = x + 0.32
  k.cyl(p, 0.011, 0.011, 0.8, c.chrome, rx, 1.55, 0.04, 12)
  for (const y of [1.15, 1.95]) k.box(p, 0.03, 0.03, 0.04, c.chrome, rx, y, 0.02)
  k.box(p, 0.04, 0.05, 0.05, c.chrome, rx, 1.7, 0.06)
  put(p, lathe(e, 'handShower', [[0, 0], [0.012, 0], [0.014, 0.16], [0.035, 0.2], [0.04, 0.215], [0, 0.22]], 20), c.chrome, rx, 1.62, 0.08, false).rotation.x = -0.25
  put(p, tube(e, 'shHose', [[rx, 1.62, 0.08], [rx - 0.02, 1.1, 0.1], [x + 0.1, 0.75, 0.12], [x + 0.06, 1.0, 0.07]], 0.007), c.satin)
}

/** A fold-down shower seat on its wall plate (folded up), at z = 0 facing +z. */
function showerSeat(e: OpdCtx, p: Object3D, x: number) {
  const { k } = e
  const c = sanMats(e)
  k.box(p, 0.42, 0.06, 0.03, c.satin, x, 0.5, 0.015)
  k.soft(p, 0.42, 0.4, 0.05, 0.02, c.white, x, 0.73, 0.055)
  for (let i = 0; i < 6; i++) k.box(p, 0.36, 0.012, 0.004, c.rubber, x, 0.6 + i * 0.05, 0.081, false)
}

/** The fixed glass shower screen: an 8 mm toughened panel `w` wide from a wall, its channel, clamps and stay bar. */
function glassScreen(e: OpdCtx, p: Object3D, x0: number, x1: number, z: number, stayTo: number) {
  const { k, o } = e
  const c = sanMats(e)
  const w = x1 - x0
  k.box(p, w, 2.0, 0.008, o.screenGlass, (x0 + x1) / 2, 1.0, z, false)
  // The wall channel, the floor seal, the free edge's polished edge line, the stay to the far wall.
  const wallX = Math.abs(x0) > Math.abs(x1) ? x0 : x1
  const free = wallX === x0 ? x1 : x0
  k.box(p, 0.02, 2.0, 0.03, c.chrome, wallX, 1.0, z)
  k.box(p, w, 0.012, 0.016, c.alu, (x0 + x1) / 2, 0.018, z, false)
  k.box(p, 0.006, 2.0, 0.012, c.mirrorEdge, free, 1.0, z, false)
  rod(e, p, 0.009, Math.abs(stayTo - z), c.chrome, free - Math.sign(free - wallX) * 0.05, 1.95, (z + stayTo) / 2, 'z', 12)
}

/**
 * Fits a washroom. Works in a frame on the door's wall: x along it (the door at `dx`), z into the
 * room to the far wall at D. The shower takes the far end across the whole width; the WC stands
 * on the side wall at −x, the basin on the side wall at +x, between the door and the shower.
 */
function fitWashroom(e: OpdCtx, room: Room, premium: boolean) {
  const { k, m } = e
  const c = sanMats(e)
  const door = room.doors[0]
  if (!door) return
  const d = door.spec.side
  const [a0, a1] = room.side(d)
  const mid = (a0 + a1) / 2
  const G = room.onWall(d, mid)
  const W = a1 - a0
  const D = d === '-x' || d === '+x' ? room.w : room.d
  const yaw = yawInto(d)
  // Where the door is along the wall, in the frame's x.
  const dx = (door.x - G.position.x) * Math.cos(yaw) - (door.z - G.position.z) * Math.sin(yaw)
  const SD = Math.min(premium ? 1.05 : 0.95, D * 0.46)
  const near = D - SD
  // The WC goes on the side away from the door; the basin by it.
  const wcSide = dx > 0.05 ? -1 : dx < -0.05 ? 1 : -1
  const wall = (side: number, z: number) => {
    const g = group(G, side * (W / 2), 0, z)
    g.rotation.y = -side * PI / 2
    return g
  }
  // Anti-slip mosaic under the shower, the linear drain at its foot, the trap before the WC.
  k.box(G, W, 0.004, SD - 0.02, c.laminate, 0, 0.0135, near + SD / 2, false)
  k.box(G, W - 0.1, 0.004, 0.08, c.satin, 0, 0.016, D - 0.12, false)
  for (let i = -8; i <= 8; i++) k.box(G, 0.006, 0.002, 0.05, c.sensor, i * ((W - 0.2) / 16), 0.0185, D - 0.12, false)
  floorDrain(e, group(G, wcSide * (W / 2 - 0.75), 0, near * 0.5))
  // The WC on its side wall, centred in the near part; grab rail along the wall, roll and faucet.
  const zWc = Math.max(0.5, near * 0.55)
  const wcWall = wall(wcSide, zWc)
  if (premium) {
    cisternDuct(e, group(wcWall, 0, 0, 0), 0.6, 1.0, 0.18)
    wcPan(e, group(wcWall, 0, 0, 0.18), 0.42, 1.06)
  } else coupledWc(e, wcWall)
  const zs = wcSide
  grabRail(e, wcWall, `wcRail${premium}`, [[zs * 0.32, 0.75, 0], [zs * 0.32, 0.75, 0.06], [zs * 0.32, 0.75, 0.06], [zs * 0.32 + zs * 0.6, 0.75, 0.06], [zs * 0.32 + zs * 0.6, 0.75, 0]])
  // A fold-down support rail on the WC's open side, for a patient rising or transferring from a wheelchair.
  dropDownRail(e, group(wcWall, -zs * 0.4, 0, 0), 0.75, 0.75)
  rollHolder(e, wcWall, -zs * 0.62, 0.7)
  healthFaucet(e, wcWall, zs * 0.27)
  // Nurse call: the pull cord within reach of the WC, its reset plate.
  pullCord(e, group(wcWall, zs * 0.7, 0, 0), room.ceiling)
  // The basin on the opposite wall with its mirror, soap and towel dispensers.
  const bWall = wall(-wcSide, Math.max(0.45, near * 0.5))
  if (premium) {
    vanityTop(e, bWall, 0.8, [0], { mirror: true, height: 0.84 })
  } else {
    wallBasin(e, bWall, 0.5, 0.82)
    mirror(e, bWall, 0.5, 0.65, 1.45, 0.06)
  }
  soapDispenser(e, bWall, 0.36, 1.12)
  // A vertical grab rail beside the basin, on the side away from the door.
  const gx = premium ? 0.55 : 0.4
  grabRail(e, bWall, `basinGrab${premium}`, [[-gx, 0.85, 0], [-gx, 0.85, 0.07], [-gx, 1.45, 0.07], [-gx, 1.45, 0]])
  // The shower: its set on the far wall, the seat on the WC's side wall, a vertical grab rail.
  const far = group(G, 0, 0, D)
  far.rotation.y = PI
  showerSet(e, far, -wcSide * 0.15, premium)
  const sWall = wall(wcSide, near + SD / 2)
  showerSeat(e, sWall, 0)
  grabRail(e, sWall, 'showerGrab', [[-zs * 0.35, 0.9, 0], [-zs * 0.35, 0.9, 0.07], [-zs * 0.35, 1.5, 0.07], [-zs * 0.35, 1.5, 0]])
  // The glass: a fixed panel from the basin's wall, leaving the way in on the WC's side.
  const gx0 = -wcSide * (W / 2)
  const gx1 = -wcSide * (W / 2 - Math.min(premium ? 0.95 : 0.8, W * 0.5))
  glassScreen(e, G, Math.min(gx0, gx1), Math.max(gx0, gx1), near, D)
  if (premium) {
    // A niche shelf in the shower wall with toiletries; a heated towel rail.
    k.box(far, 0.5, 0.02, 0.1, c.solid, wcSide * 0.45, 1.25, 0.05)
    for (let i = 0; i < 3; i++) put(far, lathe(e, 'toiletry', [[0, 0], [0.025, 0], [0.025, 0.14], [0.012, 0.16], [0, 0.17]], 16), [c.white, c.black, kitMats(e).gown][i], wcSide * 0.45 - 0.12 + i * 0.12, 1.26, 0.05, false)
  }
  // Towel rail and robe hook on the door wall, clear of the door.
  const tx = dx > 0 ? dx - 0.55 - 0.35 : dx + 0.55 + 0.35
  if (Math.abs(tx) < W / 2 - 0.3) towelRail(e, G, tx, 1.25, 0.5)
  robeHook(e, G, dx > 0 ? dx - 0.55 : dx + 0.55, 1.65, 0)
  // The exhaust fan over the shower, a white bin by the basin.
  exhaustGrille(e, group(G, 0, 0, near + SD / 2), room.ceiling, 0.25)
  const bin = group(G, -wcSide * (W / 2 - 0.15), 0, near - 0.18)
  k.cyl(bin, 0.11, 0.1, 0.32, m.whitePlastic, 0, 0.16, 0, 20)
  k.cyl(bin, 0.115, 0.115, 0.02, c.satin, 0, 0.33, 0, 20)
  // A sign for the call cord, at eye height by the WC.
  face(e, wcWall, 0.14, 0.07, e.o.sign('pullcordsign', 256, 128, (g, w, h) => {
    g.fillStyle = '#c8161d'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#fff'
    g.font = `700 ${h * 0.28}px Helvetica`
    g.textAlign = 'center'
    g.fillText('PULL FOR', w / 2, h * 0.42)
    g.fillText('NURSE', w / 2, h * 0.78)
  }), zs * 0.85, 1.45, 0.004)
  room.info(G, {
    title: premium ? 'Suite Washroom' : 'Patient Washroom',
    kind: 'En-suite · Accessible',
    body: premium
      ? 'A step-free washroom in large-format porcelain: a wall-hung WC on a concealed cistern with its dual-flush plate, a stone vanity with an undermount basin and back-lit mirror, a walk-in shower behind frameless glass with a rain head, a hand shower on its rail and a fold-down seat.'
      : 'A step-free washroom in anti-slip tiles: a close-coupled WC with its dual-flush cistern, grab rail, health faucet and toilet roll; a china basin with a wrist-lever mixer under its mirror; a shower behind a fixed glass screen with a thermostatic mixer, fold-down seat and a linear drain.',
    specs: ['Door opens outwards, with an emergency release', 'Nurse-call pull cord by the WC', 'Wall and fold-down grab rails at the WC, rails at the basin and shower', 'Anti-slip R11 floor tiles falling to a linear drain', 'Exhaust fan, 10 air changes an hour'],
  }, [G.position.x, 1.1, G.position.z])
}

export const ensuite: Fitter = (e, room) => fitWashroom(e, room, false)
export const ensuitePremium: Fitter = (e, room) => fitWashroom(e, room, true)
