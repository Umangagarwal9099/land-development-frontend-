import { ExtrudeGeometry, Group, LatheGeometry, Mesh, type Material, type MeshStandardMaterial, type PointLight, Shape, Vector2 } from 'three'
import type { Kit } from '../kit'

/*
 * Electrical fittings for the bedroom: modular switch plates (rocker switches, a socket, indicator
 * lights) and a ceiling fan. Plates are built facing +z with their back on z = 0, so they sit flush
 * on whatever wall they are placed against. Switches are groups named `switch_*` whose `rocker`
 * tips when tapped and whose `userData.toggle` drives a lighting circuit; the fan's rotor is a
 * `spin_*` group the viewer spins up and down.
 */

export interface Circuit {
  /** Whether it is lit; switches on a circuit act two-way, each flipping it. */
  on: boolean
  /** How lit it is now, 0 … 1: eases towards `on`, so lights fade rather than snap. */
  level: number
  lights: PointLight[]
  /** Glowing finishes on the circuit: their emissive colour fades with the circuit. */
  glows: MeshStandardMaterial[]
}

export function circuit(): Circuit {
  return { on: true, level: 1, lights: [], glows: [] }
}

/** Circuits part-way through a fade, stepped by `stepCircuits` from the viewer's frame loop. */
const fading = new Set<Circuit>()

/** Switches a circuit on or off; the change fades in over the next few frames. */
export function setCircuit(c: Circuit, on: boolean) {
  c.on = on
  for (const l of c.lights) if (l.userData.full === undefined) l.userData.full = l.intensity
  for (const m of c.glows) m.userData.full ??= m.emissive.clone()
  fading.add(c)
}

const FADE_PER_SECOND = 3.2

/**
 * Advances every fading circuit. Lights are dimmed, never hidden: hiding one changes the scene's
 * light count, which makes three.js recompile every material, a visible hitch on the tap.
 * Returns whether anything is still fading, so the caller keeps frames coming.
 */
export function stepCircuits(delta: number) {
  for (const c of fading) {
    const target = c.on ? 1 : 0
    const step = Math.min(delta, 0.05) * FADE_PER_SECOND
    c.level = c.level < target ? Math.min(target, c.level + step) : Math.max(target, c.level - step)
    // An ease-in-out curve on the level reads as a lamp warming up or dying away.
    const k = c.level * c.level * (3 - 2 * c.level)
    for (const l of c.lights) {
      l.userData.off = k === 0
      l.userData.level = k
      l.intensity = (l.userData.full as number) * k
    }
    for (const m of c.glows) m.emissive.copy(m.userData.full).multiplyScalar(k)
    if (c.level === target) fading.delete(c)
  }
  return fading.size > 0
}

export type Module = 'switch' | 'socket' | 'blank'

const MOD = 0.0225
const PLATE_H = 0.086

/**
 * A modular switch plate, `modules` wide (22.5 mm each), in a matte warm-grey glass finish with
 * a thin chamfered frame. Switch modules get a rocker and an amber locator light; a socket module
 * gets a three-pin face. `circuits` maps each switch module, in order, to the circuit it works.
 */
export function switchPlate(
  k: Kit,
  parent: Group,
  name: string,
  layout: Module[],
  mats: { plate: Material; rocker: Material; dark: Material; locator: MeshStandardMaterial },
  circuits: (Circuit | undefined)[] = [],
) {
  const w = layout.reduce((a, m) => a + (m === 'socket' ? 3 : 1), 0) * MOD + 0.02
  const g = new Group()
  parent.add(g)
  // Back box hidden in the wall; the plate stands 6 mm proud with a softened edge.
  k.soft(g, w, PLATE_H, 0.008, 0.002, mats.plate as MeshStandardMaterial, 0, 0, 0.004)
  k.box(g, w - 0.006, PLATE_H - 0.006, 0.002, mats.dark, 0, 0, 0.0085, false)
  let x = -w / 2 + 0.01
  let n = 0
  for (const m of layout) {
    const mw = (m === 'socket' ? 3 : 1) * MOD
    const cx = x + mw / 2
    if (m === 'switch') {
      const sw = new Group()
      sw.name = `switch_${name}_${n}`
      sw.position.set(cx, 0, 0.01)
      g.add(sw)
      const rocker = new Group()
      rocker.name = 'rocker'
      rocker.rotation.x = -0.14
      sw.add(rocker)
      k.box(rocker, mw - 0.003, 0.05, 0.006, mats.rocker, 0, 0, 0.003).userData.front = true
      k.box(sw, 0.004, 0.004, 0.002, mats.locator, 0, -0.03, 0.002, false)
      const c = circuits[n]
      sw.userData.on = true
      // Two-way: any switch on the circuit flips it, whatever its own rocker shows.
      if (c) sw.userData.toggle = () => setCircuit(c, !c.on)
      n++
    } else if (m === 'socket') {
      k.soft(g, mw - 0.004, 0.06, 0.006, 0.003, mats.rocker as MeshStandardMaterial, cx, 0, 0.012)
      for (const [dx, dy, r] of [[0, 0.016, 0.0035], [-0.012, -0.008, 0.0028], [0.012, -0.008, 0.0028]] as const) k.cyl(g, r, r, 0.004, mats.dark, cx + dx, dy, 0.0155, 10).rotation.x = Math.PI / 2
    }
    x += mw
  }
  return g
}

/** A five-blade ceiling fan on a short downrod: canopy, rod, motor housing and pitched blades. */
export function ceilingFan(k: Kit, parent: Group, x: number, ceiling: number, z: number, mats: { body: Material; blade: Material; iron: Material }) {
  const g = new Group()
  g.position.set(x, ceiling, z)
  parent.add(g)
  const canopy = new Mesh(new LatheGeometry([new Vector2(0, 0), new Vector2(0.075, 0), new Vector2(0.07, -0.03), new Vector2(0.03, -0.075), new Vector2(0, -0.08)], 32), mats.body)
  g.add(canopy)
  k.cyl(g, 0.012, 0.012, 0.22, mats.body, 0, -0.18, 0, 12)
  // The rotor: motor housing, blade irons and blades turn together.
  const rotor = new Group()
  rotor.name = 'spin_fan'
  rotor.position.y = -0.3
  g.add(rotor)
  const housing = new Mesh(
    new LatheGeometry([new Vector2(0, 0.03), new Vector2(0.06, 0.028), new Vector2(0.105, 0.012), new Vector2(0.115, -0.01), new Vector2(0.1, -0.03), new Vector2(0.05, -0.045), new Vector2(0, -0.048)], 40),
    mats.body,
  )
  housing.castShadow = true
  rotor.add(housing)
  const blade = new Shape()
  blade.moveTo(0, -0.045)
  blade.quadraticCurveTo(0.3, -0.07, 0.52, -0.06)
  blade.quadraticCurveTo(0.6, -0.055, 0.6, 0)
  blade.quadraticCurveTo(0.6, 0.055, 0.52, 0.06)
  blade.quadraticCurveTo(0.3, 0.07, 0, 0.045)
  blade.closePath()
  const bladeGeo = new ExtrudeGeometry(blade, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 12 })
  bladeGeo.rotateX(Math.PI / 2)
  for (let i = 0; i < 5; i++) {
    const arm = new Group()
    arm.rotation.y = (i / 5) * Math.PI * 2
    rotor.add(arm)
    k.box(arm, 0.12, 0.008, 0.03, mats.iron, 0.13, -0.012, 0)
    const b = new Mesh(bladeGeo, mats.blade)
    b.position.set(0.16, -0.012, 0)
    // A gentle pitch, as on a real fan blade.
    b.rotation.x = 0.16
    b.castShadow = true
    arm.add(b)
  }
  return g
}
