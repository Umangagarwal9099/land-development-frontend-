import { Group, PlaneGeometry, type Object3D } from 'three'
import type { HospitalCtx } from './building'

/*
 * A type-B ambulance: a panel van with a raised patient compartment, about 5.6 m long, 2.0 m wide
 * and 2.65 m to the roof, in white with the red waist band, AMBULANCE on its sides and the star
 * of life, a light bar over the cab and beacons at the box's corners. Front towards +z at yaw 0,
 * like the parked cars, its wheels on y = 0 of the group.
 */

const W = 2.0
/** Front and back of the body; the box runs from the back to the cab's B-pillar. */
const FRONT = 2.8
const BACK = -2.8
const PILLAR = 0.75

export function ambulance(ctx: HospitalCtx, parent: Object3D, x: number, y: number, z: number, yaw: number) {
  const { k, c, shade } = ctx
  const g = new Group()
  g.name = 'ambulance'
  g.position.set(x, y, z)
  g.rotation.y = yaw
  parent.add(g)

  // Wheels, hubs and the dark underbody between them.
  for (const wz of [1.85, -1.55])
    for (const s of [-1, 1]) {
      const t = k.cyl(g, 0.37, 0.37, 0.24, c.tyre, s * (W / 2 - 0.14), 0.37, wz, 24)
      t.rotation.z = Math.PI / 2
      const h = k.cyl(g, 0.2, 0.2, 0.02, c.silver, s * (W / 2 - 0.01), 0.37, wz, 16)
      h.rotation.z = Math.PI / 2
    }
  k.box(g, W - 0.25, 0.3, FRONT - BACK - 0.6, c.plantDark, 0, 0.42, (FRONT + BACK) / 2)

  // The patient compartment: a tall box with rounded edges, the cab ahead of it, the bonnet lower.
  const boxLen = PILLAR - BACK
  k.soft(g, W, 2.05, boxLen, 0.09, c.vanWhite, 0, 0.6 + 1.025, (PILLAR + BACK) / 2)
  k.soft(g, W - 0.04, 1.55, 1.25, 0.18, c.vanWhite, 0, 0.6 + 0.775, PILLAR + 0.6)
  k.soft(g, W - 0.08, 0.72, 0.95, 0.16, c.vanWhite, 0, 0.6 + 0.36, FRONT - 0.48)
  // The windscreen, raked, and the cab's side windows.
  const ws = k.box(g, W - 0.2, 0.82, 0.04, c.vanGlass, 0, 1.68, PILLAR + 1.16, false)
  ws.rotation.x = -0.42
  for (const s of [-1, 1]) k.box(g, 0.02, 0.55, 0.85, c.vanGlass, s * (W / 2 - 0.01), 1.72, PILLAR + 0.6, false)
  // Livery on both sides of the box, the lettering the right way round on each (so the chevrons
  // fall at the back on the right-hand side and at the front on the left).
  const side = new PlaneGeometry(boxLen - 0.2, 1.85)
  for (const s of [-1, 1]) {
    const m = k.mesh(side, c.livery, g, s * (W / 2 + 0.006), 1.62, (PILLAR + BACK) / 2, false)
    m.rotation.y = s * (Math.PI / 2)
  }
  // Red band round the cab and the back, under the rear doors' windows.
  k.box(g, W + 0.012, 0.19, 1.95, c.redPanel, 0, 1.3, PILLAR + 0.95, false)
  k.box(g, W - 0.1, 0.19, 0.012, c.redPanel, 0, 1.3, BACK - 0.006, false)
  for (const s of [-1, 1]) k.box(g, 0.7, 0.45, 0.02, c.vanGlass, s * 0.42, 2.15, BACK - 0.005, false)
  k.box(g, 0.02, 1.7, 0.02, c.plantDark, 0, 1.55, BACK - 0.008, false)
  // Bumpers, grille, lamps.
  k.box(g, W - 0.05, 0.22, 0.16, c.plantDark, 0, 0.62, FRONT + 0.02)
  k.box(g, W - 0.05, 0.2, 0.16, c.plantDark, 0, 0.62, BACK - 0.04)
  k.box(g, 0.9, 0.24, 0.03, c.plantDark, 0, 0.98, FRONT + 0.005, false)
  for (const s of [-1, 1]) {
    k.box(g, 0.32, 0.16, 0.03, c.head, s * 0.72, 1.0, FRONT + 0.004, false)
    k.box(g, 0.14, 0.38, 0.03, c.tail, s * 0.88, 1.15, BACK - 0.01, false)
    // Mirrors on their arms.
    k.box(g, 0.05, 0.28, 0.16, c.plantDark, s * (W / 2 + 0.16), 1.75, PILLAR + 1.05)
  }
  // The light bar over the cab, red and blue halves; beacons on the box's corners.
  k.box(g, 1.3, 0.12, 0.3, c.plantDark, 0, 2.17, PILLAR + 0.55)
  k.box(g, 0.6, 0.1, 0.26, c.beaconRed, -0.32, 2.28, PILLAR + 0.55, false)
  k.box(g, 0.6, 0.1, 0.26, c.beaconBlue, 0.32, 2.28, PILLAR + 0.55, false)
  for (const s of [-1, 1]) {
    k.box(g, 0.16, 0.1, 0.16, s < 0 ? c.beaconRed : c.beaconBlue, s * (W / 2 - 0.12), 2.7, BACK + 0.12, false)
    k.box(g, 0.16, 0.1, 0.16, s < 0 ? c.beaconRed : c.beaconBlue, s * (W / 2 - 0.12), 2.7, PILLAR - 0.1, false)
  }
  shade.rect(x, y + 0.015, z, W + 0.4, FRONT - BACK + 0.4, yaw, 0.7)
  return g
}
