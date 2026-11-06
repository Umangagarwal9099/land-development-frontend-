import { MeshPhysicalMaterial, MeshStandardMaterial, type Object3D } from 'three'
import { PI } from '../../../kit'
import { rng } from '../../../textures'
import { bentTube, carcass, castor, cupboardDoor, drawer, face, group, put, rod } from '../../erKit'
import { packs } from '../../erFurniture'
import type { OpdCtx } from '../ctx'
import { bottle, reagentBottles } from '../furniture'

/*
 * The laboratory's furniture and analysers, at true size: resin-topped benches with reagent
 * shelving over them, the analysers of a hospital's haematology, biochemistry, microbiology and
 * serology sections, centrifuges, microscopes, the phlebotomy chairs of the collection room.
 * Every piece is built in its own frame, front towards +z, standing on y = 0 (a benchtop piece
 * on the bench's top: place its group at the worktop height).
 */

const cache = new WeakMap<object, ReturnType<typeof make>>()

function make() {
  const std = (color: string, roughness = 0.5, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
  return {
    /** Black epoxy-resin worktop, chemical resistant. */
    resin: std('#202326', 0.38),
    /** Analyser casings: off-white powder-coat and moulded panels, a cool grey. */
    shell: new MeshPhysicalMaterial({ color: '#eceeec', roughness: 0.38, clearcoat: 0.3, clearcoatRoughness: 0.45 }),
    shellGrey: new MeshPhysicalMaterial({ color: '#b9bfc4', roughness: 0.42, clearcoat: 0.2, clearcoatRoughness: 0.5 }),
    accent: std('#2b7bb9', 0.45),
    /** Blood tube caps, colour-coded: EDTA lavender, plain red, SST gold, citrate light blue, fluoride grey, heparin green. */
    caps: [std('#8e6bbf', 0.5), std('#c8161d', 0.5), std('#e2b21c', 0.5), std('#7fc4e8', 0.5), std('#9aa0a6', 0.5), std('#2e9b4f', 0.5)],
    blood: std('#5c0a0e', 0.25),
    urine: new MeshPhysicalMaterial({ color: '#e9c94a', roughness: 0.1, transparent: true, opacity: 0.8, depthWrite: false }),
    tubeGlass: new MeshPhysicalMaterial({ color: '#e6eef0', roughness: 0.08, transparent: true, opacity: 0.45, depthWrite: false }),
    agar: std('#b8442b', 0.35),
    cuvette: std('#d6dadc', 0.3),
  }
}

/** The lab's own finishes, made once per model. */
export function labMats(e: OpdCtx) {
  let c = cache.get(e.o)
  if (!c) cache.set(e.o, (c = make()))
  return c
}

/* ---------- benches ---------- */

export interface BenchOpts {
  d?: number
  /** A sink inset at this x, with its lab mixer and an eyewash beside it. */
  sink?: number
  /** Reagent shelving on the wall over it. */
  upper?: boolean
  /** One unit of drawers that open (at this x); the rest of the run's fronts are fixed. */
  drawers?: number
  /** Leave this span (x0, x1) open under the top, a knee space for sitting work. */
  knee?: [number, number]
}

/**
 * A laboratory bench, `len` along x: white laminate base units on a plinth, a black epoxy-resin
 * worktop at 0.9 m with an upstand against the wall, front at z = 0 and back at −d.
 */
export function bench(e: OpdCtx, p: Object3D, len: number, o: BenchOpts = {}) {
  const { k, m } = e
  const L = labMats(e)
  const d = o.d ?? 0.75
  const n = Math.max(1, Math.round(len / 0.6))
  const uw = len / n
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + uw * (i + 0.5)
    if (o.knee && x > o.knee[0] && x < o.knee[1]) continue
    if (o.drawers !== undefined && Math.abs(x - o.drawers) < uw / 2) {
      const u = group(p, x, 0, 0)
      carcass(e, u, uw, 0.87, d - 0.05, m.hpl, [], 0.1)
      for (let j = 0; j < 3; j++) drawer(e, u, 0, 0.74 - j * 0.24, 0, { w: uw - 0.006, h: 0.235, d: d - 0.1, front: m.hpl, handle: 'bar', label: 'Bench Drawer', fill: packs(e, [m.whitePlastic, m.blue, m.paper, m.binBlue], [0.08, 0.05, 0.12]) })
      continue
    }
    k.box(p, uw - 0.004, 0.1, d - 0.1, m.skirting, x, 0.05, -d / 2 - 0.02)
    k.box(p, uw - 0.004, 0.77, d - 0.05, m.hpl, x, 0.485, -d / 2 - 0.025)
    k.box(p, uw - 0.01, 0.75, 0.004, m.hpl, x, 0.485, 0.0, false)
    k.box(p, 0.004, 0.7, 0.005, m.reveal, x, 0.485, 0.002, false)
    put(p, bentTube(e, 'benchPull', [[0, -0.07, 0], [0, -0.07, 0.025], [0, 0.07, 0.025], [0, 0.07, 0]], 0.005, 0.01), m.stainless, x - 0.04, 0.72, 0.002, false)
  }
  if (o.knee) {
    // A modesty panel at the back of the knee space.
    k.box(p, o.knee[1] - o.knee[0], 0.6, 0.02, m.hpl, (o.knee[0] + o.knee[1]) / 2, 0.55, -d + 0.03)
  }
  k.box(p, len + 0.02, 0.03, d + 0.02, L.resin, 0, 0.885, -d / 2)
  k.box(p, len + 0.02, 0.1, 0.015, L.resin, 0, 0.95, -d + 0.0075)
  if (o.sink !== undefined) {
    const sx = o.sink
    k.box(p, 0.5, 0.006, 0.38, L.resin, sx, 0.902, -d / 2, false)
    k.box(p, 0.44, 0.004, 0.32, m.black, sx, 0.904, -d / 2, false)
    put(p, bentTube(e, 'labTap', [[0, 0, 0], [0, 0.34, 0], [0, 0.38, 0.12], [0, 0.3, 0.16]], 0.011, 0.06), m.chrome, sx, 0.9, -d + 0.08, false)
    rod(e, p, 0.006, 0.12, m.chrome, sx + 0.07, 0.96, -d + 0.08, 'x', 8)
    // The eyewash beside it: a swing-down head on its bowl, green.
    k.cyl(p, 0.035, 0.035, 0.12, m.green, sx + 0.4, 0.96, -d + 0.07, 16)
    k.cyl(p, 0.06, 0.05, 0.03, m.green, sx + 0.4, 1.03, -d + 0.07, 18)
  }
  if (o.upper) {
    // Reagent shelving on slotted uprights: two shelves of bottles and kits.
    const ups = Math.max(2, Math.round(len / 1.2) + 1)
    for (let i = 0; i < ups; i++) k.box(p, 0.02, 0.9, 0.02, m.aluminium, -len / 2 + 0.05 + (i * (len - 0.1)) / (ups - 1), 1.55, -d + 0.02)
    for (const y of [1.3, 1.68]) {
      k.box(p, len - 0.04, 0.02, 0.3, m.hpl, 0, y, -d + 0.17)
      reagentBottles(e, p, len - 0.1, y + 0.01, -d + 0.31, 0.26)
    }
  }
}

/* ---------- small things on a bench ---------- */

/** A rack of blood tubes, `cols` × `rows`, their caps colour-coded, some with blood. */
export function tubeRack(e: OpdCtx, p: Object3D, x: number, y: number, z: number, cols = 6, rows = 2, ry = 0, seed = 1) {
  const { k } = e
  const L = labMats(e)
  const g = group(p, x, y, z, ry)
  const pitch = 0.022
  const w = cols * pitch + 0.02
  const dd = rows * pitch + 0.02
  k.box(g, w, 0.008, dd, e.m.whitePlastic, 0, 0.004, 0, false)
  k.box(g, w, 0.008, dd, e.m.whitePlastic, 0, 0.06, 0, false)
  for (const s of [-1, 1]) k.box(g, 0.008, 0.06, dd, e.m.whitePlastic, s * (w / 2 - 0.004), 0.03, 0, false)
  const r = rng(seed)
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      if (r() < 0.2) continue
      const tx = -w / 2 + 0.01 + pitch * (i + 0.5)
      const tz = -dd / 2 + 0.01 + pitch * (j + 0.5)
      k.cyl(g, 0.0065, 0.0065, 0.09, L.tubeGlass, tx, 0.045, tz, 8)
      k.cyl(g, 0.0055, 0.0055, 0.05, L.blood, tx, 0.028, tz, 8)
      k.cyl(g, 0.0075, 0.0075, 0.018, L.caps[Math.floor(r() * L.caps.length)], tx, 0.098, tz, 8)
    }
  return g
}

/** Loose vacutainer tubes in a tray: a box of each colour. */
export function tubeTray(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const L = labMats(e)
  const g = group(p, x, y, z, ry)
  k.box(g, 0.3, 0.03, 0.2, m.whitePlastic, 0, 0.015, 0, false)
  for (let i = 0; i < 5; i++) {
    k.box(g, 0.05, 0.022, 0.18, m.paper, -0.12 + i * 0.06, 0.035, 0, false)
    for (let j = 0; j < 3; j++) k.cyl(g, 0.007, 0.007, 0.02, L.caps[i], -0.12 + i * 0.06, 0.05, -0.05 + j * 0.05, 8).rotation.x = PI / 2
  }
  return g
}

/**
 * A phlebotomist's tray: needles and holders, syringes, a tourniquet, cotton and alcohol swabs,
 * plasters and a gauze pack.
 */
export function phlebotomyTray(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.box(g, 0.34, 0.035, 0.24, m.blue, 0, 0.0175, 0, false)
  for (let i = 0; i < 4; i++) rod(e, g, 0.006, 0.12, i % 2 ? m.clearPlastic : m.whitePlastic, -0.12 + i * 0.03, 0.044, -0.05, 'z', 8)
  for (let i = 0; i < 3; i++) k.box(g, 0.02, 0.014, 0.06, m.sharps, 0.02 + i * 0.03, 0.044, -0.06, false)
  // The tourniquet: a blue elastic strap with its buckle.
  k.box(g, 0.25, 0.004, 0.025, m.blue, 0, 0.042, 0.06, false)
  k.box(g, 0.035, 0.012, 0.03, m.black, 0.09, 0.046, 0.06, false)
  k.cyl(g, 0.04, 0.04, 0.03, m.paper, -0.1, 0.05, 0.05, 16)
  k.box(g, 0.08, 0.012, 0.06, m.whitePlastic, 0.1, 0.042, 0.0, false)
  return g
}

/** A barcode label printer and a handheld scanner in its stand. */
export function labelPrinter(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.13, 0.12, 0.2, 0.02, m.charcoal, 0, 0.06, 0)
  k.box(g, 0.08, 0.002, 0.04, m.paper, 0, 0.09, 0.11, false)
  k.box(g, 0.05, 0.02, 0.06, m.darkPlastic, 0.14, 0.01, 0, false)
  const s = k.soft(g, 0.04, 0.12, 0.05, 0.015, m.darkPlastic, 0.14, 0.07, 0)
  s.rotation.x = -0.4
  k.box(g, 0.03, 0.01, 0.002, m.red, 0.14, 0.125, 0.03, false)
  return g
}

/* ---------- haematology ---------- */

/**
 * A 5-part differential haematology analyser: a tall moulded cabinet, its touch screen, the
 * closed-tube sampler drawer at the front and, with `loader`, the rack autoloader at its side.
 */
export function haemAnalyser(e: OpdCtx, p: Object3D, loader = false) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.42, 0.52, 0.5, 0.03, L.shell, 0, 0.26, -0.25)
  k.box(p, 0.42, 0.06, 0.5, L.shellGrey, 0, 0.03, -0.25)
  k.box(p, 0.02, 0.4, 0.004, L.accent, -0.19, 0.3, 0.002, false)
  const scr = group(p, 0.06, 0.4, 0.01)
  scr.rotation.x = -0.25
  k.box(scr, 0.25, 0.17, 0.02, m.black, 0, 0, 0)
  face(e, scr, 0.23, 0.15, e.o.his('haemScreen', 'CBC · 5-DIFF', 'table'), 0, 0, 0.011)
  k.box(p, 0.12, 0.05, 0.03, L.shellGrey, -0.1, 0.16, 0.012)
  k.cyl(p, 0.008, 0.008, 0.06, m.chrome, -0.1, 0.2, 0.02, 8)
  if (loader) {
    k.soft(p, 0.36, 0.2, 0.5, 0.02, L.shellGrey, 0.4, 0.1, -0.25)
    for (let i = 0; i < 3; i++) tubeRack(e, p, 0.4, 0.2, -0.1 - i * 0.12, 10, 1, 0, i + 3)
  }
}

/** A coagulation analyser: a low unit with its cuvette rotor under a lid, reagent wells, screen. */
export function coagAnalyser(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.55, 0.3, 0.45, 0.03, L.shell, 0, 0.15, -0.225)
  k.box(p, 0.3, 0.02, 0.25, m.clearPlastic, -0.08, 0.31, -0.2, false)
  for (let i = 0; i < 6; i++) k.cyl(p, 0.012, 0.012, 0.03, L.caps[i % 6], 0.12 + (i % 2) * 0.04, 0.31, -0.32 + Math.floor(i / 2) * 0.05, 10)
  const scr = group(p, 0.18, 0.26, 0.01)
  scr.rotation.x = -0.6
  face(e, scr, 0.14, 0.1, e.o.his('coagScreen', 'PT / APTT', 'graph'), 0, 0, 0)
}

/** An automated slide stainer: a box with a smoked lid over its baths. */
export function slideStainer(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.5, 0.28, 0.4, 0.02, L.shell, 0, 0.14, -0.2)
  k.box(p, 0.46, 0.12, 0.36, m.clearPlastic, 0, 0.34, -0.2, false)
  for (let i = 0; i < 5; i++) k.box(p, 0.06, 0.02, 0.1, [m.blue, m.purple, m.red, m.whitePlastic, m.blue][i], -0.16 + i * 0.08, 0.29, -0.2, false)
  k.box(p, 0.12, 0.05, 0.004, m.black, 0.14, 0.2, 0.002, false)
}

/** A Westergren ESR stand: a rack of tall pipettes on a level base. */
export function esrStand(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.24, 0.02, 0.06, m.whitePlastic, 0, 0.01, 0)
  k.box(p, 0.24, 0.015, 0.03, m.whitePlastic, 0, 0.25, 0)
  for (let i = 0; i < 8; i++) {
    const x = -0.1 + i * 0.028
    k.cyl(p, 0.003, 0.003, 0.3, labMats(e).tubeGlass, x, 0.16, 0, 6)
    k.cyl(p, 0.0025, 0.0025, 0.1 + (i % 3) * 0.02, labMats(e).blood, x, 0.07, 0, 6)
  }
}

/** A tube roller-mixer: rollers turning a row of tubes. */
export function tubeRoller(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.36, 0.06, 0.28, 0.02, L.shell, 0, 0.03, 0)
  for (let i = 0; i < 6; i++) rod(e, p, 0.009, 0.26, m.rubber, -0.14 + i * 0.056, 0.07, 0, 'z', 10)
  for (let i = 0; i < 4; i++) {
    const t = rod(e, p, 0.0065, 0.1, L.tubeGlass, -0.11 + i * 0.07, 0.09, 0.02, 'z', 8)
    t.rotation.y = 0
    k.cyl(p, 0.0075, 0.0075, 0.018, L.caps[0], -0.11 + i * 0.07, 0.09, 0.08, 8).rotation.x = PI / 2
  }
}

/** A binocular laboratory microscope: the stand, the stage and objectives, the eyepieces. */
export function microscope(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.2, 0.05, 0.26, 0.02, m.whitePlastic, 0, 0.025, 0)
  k.soft(g, 0.07, 0.32, 0.08, 0.02, m.whitePlastic, 0, 0.2, -0.09)
  const arm = k.soft(g, 0.08, 0.06, 0.2, 0.02, m.whitePlastic, 0, 0.36, -0.02)
  arm.rotation.x = 0.1
  k.box(g, 0.14, 0.012, 0.12, m.black, 0, 0.15, 0.02)
  for (let i = 0; i < 3; i++) k.cyl(g, 0.01, 0.008, 0.05, m.chrome, -0.02 + i * 0.02, 0.28, 0.04, 10)
  k.box(g, 0.08, 0.05, 0.06, m.black, 0, 0.32, 0.05)
  for (const s of [-1, 1]) {
    const ep = k.cyl(g, 0.012, 0.012, 0.08, m.black, s * 0.03, 0.42, 0.1, 12)
    ep.rotation.x = -0.7
  }
  for (const s of [-1, 1]) k.cyl(g, 0.02, 0.02, 0.02, m.darkPlastic, s * 0.05, 0.12, -0.08, 14).rotation.z = PI / 2
  return g
}

/* ---------- biochemistry ---------- */

/**
 * A floor-standing clinical chemistry analyser, 1.5 × 0.8 × 1.2 m: the long moulded body on its
 * castors, the reagent carousel and the sample turntable under smoked hinged covers, the probe
 * arms, a status lamp, and its control PC on a swing arm at the end.
 */
export function chemAnalyser(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.68, -0.4 + sz * 0.33, 0.035)
  k.box(p, 1.5, 0.06, 0.8, L.shellGrey, 0, 0.1, -0.4)
  k.soft(p, 1.5, 0.92, 0.8, 0.04, L.shell, 0, 0.59, -0.4)
  k.box(p, 1.4, 0.004, 0.004, L.accent, 0, 0.82, 0.002, false)
  // Service doors on the front, fixed, with their grilles.
  for (let i = 0; i < 3; i++) {
    k.box(p, 0.46, 0.66, 0.006, L.shell, -0.5 + i * 0.5, 0.45, 0.003, false)
    k.box(p, 0.3, 0.04, 0.004, m.greyPlastic, -0.5 + i * 0.5, 0.2, 0.007, false)
  }
  // The work deck under its covers: reagent carousel, reaction disc, sample turntable.
  k.box(p, 1.46, 0.04, 0.76, L.shellGrey, 0, 1.07, -0.4)
  k.cyl(p, 0.24, 0.24, 0.05, L.cuvette, -0.42, 1.12, -0.4, 24)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * PI * 2
    k.box(p, 0.03, 0.04, 0.05, i % 3 ? m.whitePlastic : L.accent, -0.42 + Math.cos(a) * 0.18, 1.16, -0.4 + Math.sin(a) * 0.18, false).rotation.y = -a
  }
  k.cyl(p, 0.16, 0.16, 0.03, m.black, 0.1, 1.11, -0.42, 24)
  k.cyl(p, 0.17, 0.17, 0.05, m.whitePlastic, 0.52, 1.12, -0.42, 24)
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * PI * 2
    k.cyl(p, 0.007, 0.007, 0.08, L.caps[i % 4], 0.52 + Math.cos(a) * 0.13, 1.18, -0.42 + Math.sin(a) * 0.13, 8)
  }
  for (const [x, z] of [[-0.15, -0.3], [0.32, -0.25]] as const) {
    k.cyl(p, 0.02, 0.02, 0.18, m.whitePlastic, x, 1.18, z - 0.25, 12)
    k.box(p, 0.03, 0.03, 0.26, m.whitePlastic, x, 1.27, z - 0.12, false)
  }
  // Covers: smoked acrylic over the deck.
  k.box(p, 1.44, 0.006, 0.74, m.clearPlastic, 0, 1.3, -0.4, false)
  k.box(p, 0.04, 0.12, 0.04, m.alarmBar, 0.7, 1.36, -0.75, false)
  // The control PC on its arm at the right-hand end.
  const arm = group(p, 0.95, 0, -0.1)
  k.cyl(arm, 0.025, 0.025, 1.1, m.aluminium, 0, 0.55, 0, 12)
  k.box(arm, 0.5, 0.02, 0.32, m.greyPlastic, 0, 1.0, 0.12)
  k.box(arm, 0.42, 0.012, 0.14, m.darkPlastic, 0, 1.017, 0.18, false)
  const s = group(arm, 0, 1.25, 0.0)
  k.box(s, 0.5, 0.31, 0.02, m.black, 0, 0, 0)
  face(e, s, 0.48, 0.29, e.o.his('chemPC', 'BIOCHEMISTRY · RUN STATUS', 'table'), 0, 0, 0.011)
}

/** An ion-selective electrolyte analyser (Na⁺ K⁺ Cl⁻): a compact unit with its reagent pack and printer. */
export function electrolyteAnalyser(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.3, 0.38, 0.32, 0.02, L.shell, 0, 0.19, -0.16)
  face(e, p, 0.16, 0.1, e.o.his('ise', 'Na K Cl', 'form'), -0.04, 0.29, 0.001)
  k.box(p, 0.07, 0.02, 0.04, m.paper, 0.09, 0.36, 0.0, false)
  k.box(p, 0.1, 0.16, 0.1, L.accent, 0.1, 0.1, -0.25, false)
  k.cyl(p, 0.005, 0.005, 0.06, m.chrome, -0.08, 0.16, 0.02, 8)
}

/** A semi-automatic biochemistry analyser: a photometer with its keypad, screen and flow-cell aspirator. */
export function semiAuto(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.38, 0.14, 0.34, 0.02, L.shell, 0, 0.07, -0.17)
  const top = group(p, 0, 0.14, -0.06)
  top.rotation.x = -0.35
  k.box(top, 0.34, 0.012, 0.2, L.shellGrey, 0, 0, 0)
  face(e, top, 0.16, 0.08, e.o.his('semiauto', 'ABS 340nm', 'graph'), -0.06, 0.007, 0.03).rotation.x = -PI / 2
  for (let i = 0; i < 12; i++) k.box(top, 0.018, 0.006, 0.018, m.greyPlastic, 0.06 + (i % 4) * 0.025, 0.008, -0.05 + Math.floor(i / 4) * 0.03, false)
  k.cyl(p, 0.004, 0.004, 0.08, m.chrome, 0.15, 0.1, 0.02, 8)
}

/** A reverse-osmosis water purification unit for the analysers: a cabinet with its filter housings. */
export function roUnit(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.38, 0.62, 0.42, 0.02, L.shell, 0, 0.31, -0.21)
  for (let i = 0; i < 3; i++) k.cyl(p, 0.04, 0.04, 0.32, m.clearPlastic, -0.12 + i * 0.12, 0.28, 0.06, 16)
  k.box(p, 0.12, 0.05, 0.004, e.o.screen('roLcd', 64, 32, (g, w, h) => {
    g.fillStyle = '#062012'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#5cff8a'
    g.font = `700 ${h * 0.6}px Helvetica`
    g.fillText('0.8 µS', 4, h * 0.75)
  }, 1), 0, 0.54, 0.002, false)
}

/* ---------- centrifuges ---------- */

/** A benchtop centrifuge: the round lidded drum, the control panel sloped at its front. */
export function centrifuge(e: OpdCtx, p: Object3D, size = 1) {
  const { k, m } = e
  const L = labMats(e)
  const s = size
  k.soft(p, 0.4 * s, 0.26 * s, 0.5 * s, 0.05 * s, L.shell, 0, 0.13 * s, -0.25 * s)
  k.cyl(p, 0.16 * s, 0.17 * s, 0.03, L.shellGrey, 0, 0.275 * s, -0.28 * s, 24)
  k.cyl(p, 0.1 * s, 0.1 * s, 0.006, m.clearPlastic, 0, 0.29 * s + 0.003, -0.28 * s, 20)
  const panel = group(p, 0, 0.12 * s, 0.0)
  panel.rotation.x = -0.5
  k.box(panel, 0.3 * s, 0.1 * s, 0.01, m.charcoal, 0, 0, -0.01)
  face(e, panel, 0.12 * s, 0.04 * s, e.o.screen('centLcd', 96, 32, (g, w, h) => {
    g.fillStyle = '#0a0f1a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#7fd4ff'
    g.font = `700 ${h * 0.55}px Helvetica`
    g.fillText('4000 rpm  10:00', 3, h * 0.7)
  }, 1), -0.05 * s, 0.01 * s, -0.004)
}

/** A refrigerated floor-standing centrifuge: a tall cabinet with the lid on top and its keypad. */
export function floorCentrifuge(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.28, -0.35 + sz * 0.28, 0.035)
  k.soft(p, 0.68, 0.82, 0.78, 0.04, L.shell, 0, 0.5, -0.39)
  k.box(p, 0.6, 0.004, 0.006, L.accent, 0, 0.75, 0.002, false)
  k.cyl(p, 0.27, 0.27, 0.03, L.shellGrey, 0, 0.92, -0.42, 24)
  const panel = group(p, 0, 0.88, -0.02)
  panel.rotation.x = -0.6
  k.box(panel, 0.5, 0.1, 0.02, m.charcoal, 0, 0, 0)
  face(e, panel, 0.16, 0.05, e.o.screen('fcentLcd', 128, 40, (g, w, h) => {
    g.fillStyle = '#0a0f1a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#7fd4ff'
    g.font = `700 ${h * 0.5}px Helvetica`
    g.fillText('4°C 3500g 05:00', 3, h * 0.68)
  }, 1), -0.1, 0, 0.011)
}

/** A vortex mixer: a small heavy base with its rubber cup. */
export function vortex(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k, m } = e
  const g = group(p, x, y, z)
  k.soft(g, 0.13, 0.07, 0.16, 0.03, labMats(e).shell, 0, 0.035, 0)
  k.cyl(g, 0.025, 0.03, 0.03, m.rubber, 0, 0.085, -0.02, 14)
  k.cyl(g, 0.012, 0.012, 0.006, m.blue, 0.03, 0.07, 0.07, 10).rotation.x = PI / 2
  return g
}

/* ---------- clinical pathology ---------- */

/** A urine chemistry analyser: a strip reader with its tray, printer and screen. */
export function urineAnalyser(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.36, 0.16, 0.34, 0.02, L.shell, 0, 0.08, -0.17)
  k.box(p, 0.08, 0.01, 0.2, m.whitePlastic, -0.1, 0.165, -0.1, false)
  for (let i = 0; i < 3; i++) k.box(p, 0.006, 0.002, 0.11, [m.sharps, m.green, m.purple][i], -0.12 + i * 0.02, 0.172, -0.1, false)
  const scr = group(p, 0.08, 0.17, -0.02)
  scr.rotation.x = -0.5
  face(e, scr, 0.14, 0.09, e.o.his('urine', 'URINE STRIP', 'table'), 0, 0, 0)
  k.box(p, 0.07, 0.01, 0.002, m.paper, 0.1, 0.12, 0.001, false)
}

/** A rack of urine sample containers, yellow in their clear pots, white lids. */
export function urineRack(e: OpdCtx, p: Object3D, x: number, y: number, z: number, n = 8) {
  const { k, m } = e
  const L = labMats(e)
  const g = group(p, x, y, z)
  k.box(g, n * 0.06 + 0.02, 0.02, 0.08, m.whitePlastic, 0, 0.01, 0, false)
  for (let i = 0; i < n; i++) {
    const cx = -((n - 1) * 0.06) / 2 + i * 0.06
    k.cyl(g, 0.024, 0.022, 0.07, m.clearPlastic, cx, 0.055, 0, 12)
    k.cyl(g, 0.021, 0.02, 0.04 + (i % 3) * 0.01, L.urine, cx, 0.04, 0, 12)
    k.cyl(g, 0.026, 0.026, 0.015, i % 4 ? m.whitePlastic : m.red, cx, 0.098, 0, 12)
  }
  return g
}

/* ---------- microbiology ---------- */

/**
 * A Class II A2 biological safety cabinet, 1.2 m: the steel cabinet on its stand, the sloped
 * sash of glass over the work opening, the lit work zone, the blower housing above with its
 * airflow display.
 */
export function biosafetyCabinet(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  const w = 1.3
  // Stand.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.04, 0.7, 0.04, m.powder, sx * (w / 2 - 0.05), 0.35, -0.4 + sz * 0.3)
  k.box(p, w - 0.1, 0.03, 0.66, m.powder, 0, 0.12, -0.4)
  // Cabinet body: sides, back, work tray, top.
  k.box(p, w, 0.08, 0.8, L.shell, 0, 0.74, -0.4)
  for (const sx of [-1, 1]) k.box(p, 0.06, 0.82, 0.8, L.shell, sx * (w / 2 - 0.03), 1.19, -0.4)
  k.box(p, w - 0.12, 0.82, 0.04, m.stainless, 0, 1.19, -0.78)
  k.box(p, w - 0.12, 0.02, 0.7, m.stainless, 0, 0.79, -0.42)
  k.box(p, w, 0.38, 0.8, L.shell, 0, 1.79, -0.4)
  k.box(p, w - 0.12, 0.02, 0.6, e.o.cove, 0, 1.59, -0.45, false)
  // The sash: glass sloped back over the opening, an aluminium frame.
  const sash = group(p, 0, 1.15, 0.02)
  sash.rotation.x = -0.18
  k.box(sash, w - 0.14, 0.62, 0.008, e.o.screenGlass, 0, 0.1, 0, false)
  k.box(sash, w - 0.12, 0.03, 0.025, m.aluminium, 0, -0.21, 0)
  k.box(p, w - 0.12, 0.06, 0.06, L.shellGrey, 0, 0.83, 0.0)
  face(e, p, 0.22, 0.07, e.o.screen('bscPanel', 128, 40, (g, ww, hh) => {
    g.fillStyle = '#071b0e'
    g.fillRect(0, 0, ww, hh)
    g.fillStyle = '#4bff72'
    g.font = `700 ${hh * 0.42}px Helvetica`
    g.fillText('IN 0.53 m/s', 4, hh * 0.45)
    g.fillText('DOWN 0.33', 4, hh * 0.9)
  }, 1), 0.35, 1.8, 0.001)
  // Inside: a loop sterilizer, a rack of plates, a pipette.
  k.cyl(p, 0.035, 0.04, 0.12, m.darkPlastic, -0.35, 0.86, -0.45, 14)
  for (let i = 0; i < 4; i++) k.cyl(p, 0.045, 0.045, 0.014, L.agar, 0.2, 0.81 + i * 0.015, -0.45, 20)
}

/** A bacteriological / CO₂ incubator: a steel cabinet with an outer door (operated) over the glass inner door and shelves of plates. */
export function incubator(e: OpdCtx, p: Object3D, h = 0.9, label = 'Incubator Door') {
  const { k } = e
  const L = labMats(e)
  const w = 0.65
  const d = 0.65
  carcass(e, p, w, h, d, L.shell, [h * 0.35, h * 0.6], 0.05)
  for (const y of [h * 0.35, h * 0.6]) for (let i = 0; i < 6; i++) k.cyl(p, 0.045, 0.045, 0.014 * 3, L.agar, -0.2 + (i % 3) * 0.12, y + 0.03, -0.2 - Math.floor(i / 3) * 0.15, 20)
  k.box(p, w - 0.06, h - 0.1, 0.006, e.o.screenGlass, 0, h / 2 + 0.02, -0.03, false)
  cupboardDoor(e, p, -w / 2 + 0.002, h / 2 + 0.02, 0.0, { w: w - 0.006, h: h - 0.06, hinge: 'left', face: L.shell, label, angle: 1.7 })
  face(e, p, 0.1, 0.04, e.o.screen('incLcd', 96, 40, (g, ww, hh) => {
    g.fillStyle = '#1a0606'
    g.fillRect(0, 0, ww, hh)
    g.fillStyle = '#ff6a3a'
    g.font = `700 ${hh * 0.6}px Helvetica`
    g.fillText('37.0°C', 4, hh * 0.75)
  }, 1.1), w / 2 - 0.1, h - 0.06, 0.03)
}

/** A vertical front-loading autoclave: the cylindrical chamber in its cabinet, its door wheel and gauge. */
export function autoclave(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.62, 1.05, 0.7, 0.03, L.shell, 0, 0.525, -0.35)
  k.cyl(p, 0.24, 0.24, 0.05, m.stainless, 0, 0.62, 0.02, 24).rotation.x = PI / 2
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2
    rod(e, p, 0.01, 0.2, m.chrome, Math.cos(a) * 0.08, 0.62 + Math.sin(a) * 0.08, 0.07, 'x', 8).rotation.z = a
  }
  k.cyl(p, 0.05, 0.05, 0.03, m.whitePlastic, -0.2, 0.95, 0.01, 18).rotation.x = PI / 2
  face(e, p, 0.18, 0.06, e.o.screen('acLcd', 128, 40, (g, w, h) => {
    g.fillStyle = '#05140a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#7dff9c'
    g.font = `700 ${h * 0.45}px Helvetica`
    g.fillText('121°C  15 psi', 4, h * 0.65)
  }, 1), 0.12, 0.95, 0.003)
}

/** An automated blood-culture system: a tall cabinet with its drawer doors and status lamps. */
export function bloodCulture(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.6, 0.95, 0.6, 0.03, L.shell, 0, 0.475, -0.3)
  for (let i = 0; i < 3; i++) {
    k.box(p, 0.54, 0.2, 0.01, L.shellGrey, 0, 0.2 + i * 0.24, 0.005)
    for (let j = 0; j < 8; j++) k.box(p, 0.03, 0.01, 0.003, j === 3 && i === 1 ? m.red : m.alarmBar, -0.2 + j * 0.06, 0.27 + i * 0.24, 0.011, false)
  }
  face(e, p, 0.3, 0.12, e.o.his('bcScreen', 'CULTURE · 3 POS', 'table'), 0, 0.86, 0.003)
}

/** A digital colony counter: a lit stage under a magnifier. */
export function colonyCounter(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.3, 0.1, 0.3, 0.02, L.shell, 0, 0.05, -0.15)
  k.cyl(p, 0.08, 0.08, 0.01, e.o.cove, 0, 0.105, -0.15, 20)
  k.cyl(p, 0.045, 0.045, 0.014, L.agar, 0, 0.115, -0.15, 20)
  k.cyl(p, 0.008, 0.008, 0.25, m.chrome, 0.12, 0.22, -0.26, 8)
  k.cyl(p, 0.07, 0.07, 0.015, m.clearPlastic, 0, 0.32, -0.15, 20)
}

/* ---------- serology ---------- */

/** A microplate (ELISA) reader. */
export function elisaReader(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.4, 0.2, 0.42, 0.02, L.shell, 0, 0.1, -0.21)
  k.box(p, 0.16, 0.02, 0.12, m.black, -0.08, 0.1, 0.005, false)
  face(e, p, 0.12, 0.07, e.o.his('elisa', 'OD 450nm', 'table'), 0.11, 0.14, 0.001)
}

/** A microplate washer: a manifold over the plate carrier, its wash and waste bottles beside. */
export function elisaWasher(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.36, 0.18, 0.42, 0.02, L.shell, 0, 0.09, -0.21)
  k.box(p, 0.14, 0.06, 0.1, L.shellGrey, 0, 0.21, -0.18)
  k.box(p, 0.13, 0.015, 0.09, m.whitePlastic, 0, 0.19, 0.0, false)
  bottle(e, p, 0.27, 0, -0.1, 0.28, 0.06, m.clearPlastic, m.blue)
  bottle(e, p, 0.27, 0, -0.3, 0.28, 0.06, m.clearPlastic, m.red)
}

/**
 * A benchtop chemiluminescence immunoassay analyser, 1.1 × 0.75 m: the long body, its reagent and
 * sample loading bays, the touch screen on its arm.
 */
export function cliaAnalyser(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 1.1, 0.62, 0.72, 0.04, L.shell, 0, 0.31, -0.36)
  k.box(p, 1.06, 0.004, 0.004, L.accent, 0, 0.5, 0.002, false)
  for (let i = 0; i < 2; i++) k.box(p, 0.42, 0.18, 0.012, L.shellGrey, -0.25 + i * 0.5, 0.25, 0.006)
  for (let i = 0; i < 2; i++) tubeRack(e, p, 0.3 - i * 0.12, 0.62, -0.15, 8, 1, 0, 11 + i)
  const arm = group(p, -0.45, 0.62, -0.2)
  k.cyl(arm, 0.015, 0.015, 0.2, m.aluminium, 0, 0.1, 0, 10)
  const s = group(arm, 0, 0.3, 0.05)
  s.rotation.x = -0.2
  k.box(s, 0.32, 0.22, 0.02, m.black, 0, 0, 0)
  face(e, s, 0.3, 0.2, e.o.his('clia', 'IMMUNOASSAY · TSH FT4 HBsAg', 'table'), 0, 0, 0.011)
}

/** A rotary shaker: a flat platform on its base, a few plates and tubes on it. */
export function shaker(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.32, 0.08, 0.32, 0.02, L.shell, 0, 0.04, -0.16)
  k.box(p, 0.3, 0.012, 0.3, m.rubber, 0, 0.09, -0.16, false)
  for (let i = 0; i < 2; i++) k.box(p, 0.12, 0.015, 0.085, m.clearPlastic, -0.07 + i * 0.14, 0.104, -0.16, false)
}

/* ---------- storage and preparation ---------- */

/** A −20 °C chest deep freezer, its lid (operated, hinged at the back) and its display. */
export function deepFreezer(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  const w = 1.1
  const d = 0.65
  k.box(p, w, 0.82, d, L.shell, 0, 0.45, -d / 2)
  k.box(p, w - 0.04, 0.06, d - 0.04, m.rubber, 0, 0.04, -d / 2)
  // The lid on its back hinges: a door_ turning about local x.
  const lid = group(p, 0, 0.86, -d, 0, `door_opd_freezer_${(p.id % 1000)}`)
  lid.userData.axis = 'x'
  lid.userData.openAngle = -1.2
  lid.userData.label = 'Freezer Lid'
  const top = k.box(lid, w, 0.06, d, L.shell, 0, 0.03, d / 2)
  top.userData.front = true
  k.box(lid, 0.4, 0.03, 0.03, m.greyPlastic, 0, 0.0, d + 0.015, false)
  face(e, p, 0.12, 0.05, e.o.screen('frzLcd', 96, 40, (g, ww, hh) => {
    g.fillStyle = '#04101c'
    g.fillRect(0, 0, ww, hh)
    g.fillStyle = '#6fd2ff'
    g.font = `700 ${hh * 0.6}px Helvetica`
    g.fillText('-20°C', 4, hh * 0.75)
  }, 1.1), w / 2 - 0.12, 0.74, 0.001)
}

/**
 * An analytical balance on its anti-vibration table: a granite slab on a steel frame, the
 * balance's glass draught shield, a box of weighing boats.
 */
export function balanceTable(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.05, 0.72, 0.05, m.powder, sx * 0.36, 0.36, -0.3 + sz * 0.24)
  k.box(p, 0.8, 0.06, 0.6, m.black, 0, 0.75, -0.3)
  k.soft(p, 0.22, 0.08, 0.34, 0.015, L.shell, 0, 0.82, -0.32)
  k.box(p, 0.2, 0.2, 0.22, e.o.screenGlass, 0, 0.96, -0.36, false)
  k.cyl(p, 0.04, 0.04, 0.004, m.chrome, 0, 0.87, -0.36, 16)
  face(e, p, 0.08, 0.025, e.o.screen('balLcd', 96, 32, (g, w, h) => {
    g.fillStyle = '#0a1a10'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#86ff9f'
    g.font = `700 ${h * 0.6}px Helvetica`
    g.fillText('0.0000 g', 3, h * 0.72)
  }, 1), 0, 0.83, -0.145)
  k.box(p, 0.12, 0.05, 0.08, m.whitePlastic, 0.25, 0.805, -0.2, false)
}

/** A wall-mounted water still (distillation unit): the boiler, the condenser coil housing, the reservoir under it. */
export function waterStill(e: OpdCtx, p: Object3D, y = 1.2) {
  const { k, m } = e
  k.box(p, 0.5, 0.06, 0.04, m.stainless, 0, y + 0.55, 0.02)
  k.cyl(p, 0.1, 0.1, 0.35, m.stainless, -0.12, y + 0.3, 0.14, 20)
  k.cyl(p, 0.06, 0.06, 0.45, m.stainless, 0.12, y + 0.3, 0.12, 16)
  put(p, bentTube(e, 'stillPipe', [[-0.12, y + 0.48, 0.14], [-0.12, y + 0.55, 0.14], [0.12, y + 0.55, 0.12], [0.12, y + 0.52, 0.12]], 0.012, 0.03), m.chrome, 0, 0, 0)
  k.cyl(p, 0.12, 0.12, 0.3, m.clearPlastic, 0.12, y - 0.25, 0.14, 18)
  k.cyl(p, 0.008, 0.008, 0.2, m.chrome, 0.12, y - 0.0, 0.14, 8)
}

/** A pneumatic tube station: the wall unit with its open receiving tray and a carrier in it. */
export function pneumaticStation(e: OpdCtx, p: Object3D, y = 0.9) {
  const { k, m } = e
  k.box(p, 0.34, 0.9, 0.22, m.whitePlastic, 0, y + 0.45, 0.11)
  k.cyl(p, 0.06, 0.06, 0.9, m.clearPlastic, 0, y + 1.35, 0.11, 16)
  k.box(p, 0.28, 0.18, 0.04, m.darkPlastic, 0, y + 0.18, 0.2)
  rod(e, p, 0.05, 0.3, m.blue, 0, y + 0.22, 0.12, 'x', 16)
  face(e, p, 0.14, 0.06, e.o.screen('ptsLcd', 96, 40, (g, w, h) => {
    g.fillStyle = '#071423'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffd45a'
    g.font = `700 ${h * 0.45}px Helvetica`
    g.fillText('STN 212', 4, h * 0.65)
  }, 1), 0, y + 0.62, 0.221)
}

/** A stainless pass box through a wall, its two interlocked doors, at height y. */
export function passBox(e: OpdCtx, p: Object3D, y = 0.9, w = 0.45) {
  const { k, m } = e
  k.box(p, w + 0.06, w + 0.06, 0.04, m.stainless, 0, y + w / 2, 0.02)
  k.box(p, w, w, 0.01, e.o.screenGlass, 0, y + w / 2, 0.045, false)
  k.box(p, 0.03, 0.12, 0.03, m.chrome, w / 2 - 0.05, y + w / 2, 0.06, false)
  k.box(p, 0.03, 0.03, 0.01, m.alarmBar, -w / 2 + 0.03, y + w + 0.01, 0.045, false)
}

/* ---------- the collection room ---------- */

/**
 * A phlebotomy chair: a padded reclining seat on a steel base, two arm boards that swing and
 * adjust for height (one raised, one level), a footrest.
 */
export function phlebotomyChair(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.55, 0.06, 0.6, m.powder, 0, 0.03, 0)
  k.cyl(p, 0.05, 0.05, 0.35, m.powder, 0, 0.24, -0.02, 16)
  k.soft(p, 0.56, 0.12, 0.55, 0.04, m.vinylSeat, 0, 0.5, 0.02)
  const back = group(p, 0, 0.55, -0.24)
  back.rotation.x = -0.25
  k.soft(back, 0.56, 0.7, 0.12, 0.05, m.vinylSeat, 0, 0.35, -0.03)
  k.soft(back, 0.3, 0.16, 0.1, 0.04, m.vinylSeat, 0, 0.78, 0.01)
  // Arm boards: padded, on pivoting brackets, the right one raised for a draw.
  for (const s of [-1, 1]) {
    const arm = group(p, s * 0.34, s > 0 ? 0.74 : 0.66, 0.1)
    arm.rotation.x = s > 0 ? 0.12 : 0
    k.box(arm, 0.04, 0.06, 0.04, m.chrome, 0, -0.06, -0.15)
    k.soft(arm, 0.13, 0.06, 0.52, 0.025, m.vinylSeat, 0, 0, 0.0)
  }
  k.soft(p, 0.45, 0.04, 0.3, 0.015, m.black, 0, 0.22, 0.48)
  for (const s of [-1, 1]) k.box(p, 0.03, 0.03, 0.3, m.chrome, s * 0.18, 0.35, 0.36)
}
