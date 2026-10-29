import { Group, type Material } from 'three'
import type { Kit } from '../kit'

/*
 * Working cabinets for the kitchen: a hollow carcass with shelves, and either a hinged door or a
 * stack of drawers on runners. Doors are groups named `door_*` pivoting on their hinge edge,
 * drawers are groups named `drawer_*` that slide along `userData.slide`; the property viewer
 * finds them by name, toggles them on tap and animates them (see ModelRoot's OpenableAnimator).
 *
 * Every cabinet is built in its own frame: x across the front (0 … w), y up from the cabinet's
 * underside (0 … h), z out of the cabinet, with the front face at z = 0 and the back at z = −d.
 */

/** A region inside a cabinet or drawer where goods stand: floor heights and the usable box. */
export interface Bay {
  x0: number
  x1: number
  z0: number
  z1: number
  /** Heights of the surfaces things stand on: the bottom, then each shelf. */
  floors: number[]
  /** Clear height above each floor. */
  clear: number[]
}

export type Fill = (p: Group, bay: Bay) => void

export type Unit =
  | { kind: 'door'; id: string; hinge: 'left' | 'right'; shelves?: number[]; fill?: Fill }
  | { kind: 'drawers'; id: string; rows: number[]; fill?: (Fill | undefined)[] }

export interface CabinetMats {
  front: Material
  interior: Material
  drawer: Material
}

const T = 0.018
const FRONT = 0.02
const GAP = 0.004
/** Doors open a little past square, as concealed hinges allow. */
const DOOR_OPEN = 1.75

function box(k: Kit, p: Group, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Material, cast = true) {
  return k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

/**
 * Stored goods go in their own group. They cast no shadows: they sit inside closed carcasses,
 * and leaving them out keeps the kitchen's shadow pass light.
 */
function contents(parent: Group, fill: Fill | undefined, bay: Bay) {
  if (!fill) return
  const c = new Group()
  parent.add(c)
  fill(c, bay)
  c.traverse((o) => (o.castShadow = false))
}

export function cabinet(k: Kit, frame: Group, w: number, h: number, d: number, unit: Unit, mats: CabinetMats) {
  // Hollow carcass in a light interior finish.
  const I = mats.interior
  box(k, frame, 0, w, 0, h, -d, -d + T, I)
  box(k, frame, 0, T, 0, h, -d, -FRONT, I)
  box(k, frame, w - T, w, 0, h, -d, -FRONT, I)
  box(k, frame, T, w - T, 0, T, -d + T, -FRONT, I)
  box(k, frame, T, w - T, h - T, h, -d + T, -FRONT, I)

  if (unit.kind === 'door') {
    const shelves = unit.shelves ?? []
    for (const s of shelves) box(k, frame, T, w - T, s, s + T, -d + T, -0.04, I)
    const floors = [T, ...shelves.map((s) => s + T)]
    const tops = [...shelves, h - T]
    contents(frame, unit.fill, { x0: T + 0.01, x1: w - T - 0.01, z0: -d + T + 0.01, z1: -0.05, floors, clear: floors.map((f, i) => tops[i] - f) })

    const pivot = new Group()
    pivot.name = `door_${unit.id}`
    const hx = unit.hinge === 'left' ? GAP / 2 : w - GAP / 2
    pivot.position.set(hx, 0, 0)
    // Opens outwards (+z) about the hinge edge, whichever side the hinge is on.
    pivot.userData.openAngle = unit.hinge === 'left' ? -DOOR_OPEN : DOOR_OPEN
    frame.add(pivot)
    const pw = w - GAP
    const cx = unit.hinge === 'left' ? pw / 2 : -pw / 2
    box(k, pivot, cx - pw / 2, cx + pw / 2, GAP / 2, h - GAP / 2, -FRONT, 0, mats.front).userData.front = true
    return
  }

  const edges = [0, ...unit.rows, h]
  for (let i = 0; i + 1 < edges.length; i++) {
    const hh = edges[i + 1] - edges[i]
    const g = new Group()
    g.name = `drawer_${unit.id}_${i + 1}`
    g.position.set(0, edges[i], 0)
    // Full-extension runners: the box comes out to 80 % of the cabinet's depth.
    g.userData.slide = [0, 0, (d - 0.08) * 0.8]
    frame.add(g)
    box(k, g, GAP / 2, w - GAP / 2, GAP / 2, hh - GAP / 2, -FRONT, 0, mats.front).userData.front = true
    // The drawer box: sides, back, inner front and base, clear of the carcass on every side.
    const bh = Math.max(0.07, hh - 0.07)
    const [x0, x1, y0, z0, z1] = [0.032, w - 0.032, 0.03, -d + 0.05, -FRONT - 0.012]
    const D = mats.drawer
    box(k, g, x0, x0 + 0.012, y0, y0 + bh, z0, z1, D)
    box(k, g, x1 - 0.012, x1, y0, y0 + bh, z0, z1, D)
    box(k, g, x0, x1, y0, y0 + bh, z0, z0 + 0.012, D)
    box(k, g, x0, x1, y0, y0 + bh * 0.8, z1, z1 + 0.012, D)
    box(k, g, x0 + 0.012, x1 - 0.012, y0, y0 + 0.012, z0 + 0.012, z1, D)
    contents(g, unit.fill?.[i], { x0: x0 + 0.014, x1: x1 - 0.014, z0: z0 + 0.014, z1: z1 - 0.004, floors: [y0 + 0.012], clear: [bh - 0.012] })
  }
}
