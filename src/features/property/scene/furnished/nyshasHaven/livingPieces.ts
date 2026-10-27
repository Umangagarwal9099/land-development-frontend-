import {
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type Material,
  type MeshPhysicalMaterialParameters,
  type MeshStandardMaterialParameters,
  type Object3D,
} from 'three'
import { PI, type Kit } from '../kit'
import { rng, type Paint } from '../textures'
import { basketWeave, bookCover, crochetNet, fringeStrands, juteBraid, knitStitch, linenWeave, palmPrint, palmRibs, ropeCoil, rusticPlanks, stripeWeave, woodGrain } from './paints'

/*
 * The living room's furniture and objects, built in local space with the front toward +z and
 * proportioned from the photographs of the room (sofa wall and pool wall).
 */

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.85, ...p })
const lathe = (profile: number[][], seg = 40) => new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), seg)
const v3 = ([x, y, z]: number[]) => new Vector3(x, y, z)

/** The room's textiles, timbers and ceramics: painted once per model, with relief from the same paint. */
export function livingFinishes(k: Kit) {
  const painted = (name: string, size: number, paint: Paint, repeat: number, p: MeshPhysicalMaterialParameters, relief: number, physical = false) => {
    const map = k.tex.painted(size, size, paint)
    map.repeat.set(repeat, repeat)
    const mat = physical ? new MeshPhysicalMaterial({ roughness: 0.95, ...p, map }) : std({ ...p, map } as MeshStandardMaterialParameters)
    if (relief) {
      mat.normalMap = k.tex.normalPainted(`living-${name}`, size, size, paint, repeat, repeat)
      mat.normalScale.set(relief, relief)
    }
    return mat
  }
  const textile = (name: string, paint: Paint, repeat: number, relief = 0.6, extra: MeshPhysicalMaterialParameters = {}) =>
    painted(name, 256, paint, repeat, { roughness: 1, sheen: 0.5, sheenRoughness: 0.8, sheenColor: '#fff2dc', ...extra }, relief, true)
  const timber = (name: string, rgb: [number, number, number], seed: number, repeat: number, roughness = 0.7) => painted(name, 256, woodGrain(rgb, seed), repeat, { roughness }, 0.5)
  const alpha = (paint: Paint, size: number, repeat: number, color = '#ffffff') => {
    const map = k.tex.painted(size, size, paint)
    map.repeat.set(repeat, repeat)
    return std({ map, color, alphaTest: 0.45, side: DoubleSide, roughness: 1 })
  }
  return {
    /** Cream upholstery linen; the extruded cushions map in metres, so 10 repeats is a 10 cm weave. */
    linen: textile('linen', linenWeave, 10, 0.45),
    knit: textile('knit', knitStitch, 7, 1.0),
    throwKnit: textile('throw', knitStitch, 14, 0.8, { color: '#fffaf0' }),
    jute: textile('jute-pillow', juteBraid([180, 146, 104], 69), 5, 0.9),
    stripe: textile('stripe', stripeWeave, 2, 0.5),
    cocoaWeave: textile('cocoa', basketWeave([104, 90, 76], 70), 3, 0.8),
    taupeWeave: textile('taupe', basketWeave([128, 116, 102], 71), 3, 0.8),
    palm: std({ map: k.tex.painted(256, 256, palmPrint), roughness: 1 }),
    chairWeave: textile('chair', basketWeave([132, 118, 102], 72), 6, 0.9),
    rope: painted('rope', 128, ropeCoil, 3, { roughness: 0.95 }, 1.0),
    fringe: alpha(fringeStrands, 256, 1),
    crochet: alpha(crochetNet, 128, 1),
    planks: painted('planks', 512, rusticPlanks, 1, { roughness: 0.62 }, 0.4),
    reclaimed: timber('reclaimed', [128, 84, 52], 73, 1.5),
    darkTimber: timber('dark-timber', [56, 42, 34], 74, 2, 0.6),
    weathered: timber('weathered', [92, 80, 70], 75, 1.5, 0.9),
    teakRoot: timber('teak-root', [150, 92, 52], 76, 1.5, 0.65),
    log: timber('log', [142, 100, 64], 77, 1, 0.6),
    palmBlade: std({ map: k.tex.painted(64, 256, palmRibs), side: DoubleSide, roughness: 0.9 }),
    cream: std({ color: '#ece4d6', roughness: 0.6 }),
    ceramic: std({ color: '#ece8df', roughness: 0.35 }),
    blackGlaze: std({ color: '#141210', roughness: 0.3 }),
    charcoalClay: std({ color: '#38312c', roughness: 0.8 }),
    cocoaGlaze: std({ color: '#3a2a20', roughness: 0.4 }),
    terracotta: std({ color: '#6b4631', roughness: 0.85 }),
    linkWood: std({ color: '#a7784e', roughness: 0.55 }),
    coral: std({ color: '#dcc6a2', roughness: 0.9 }),
    shadow: std({ color: '#2a2420', roughness: 0.9 }),
    fanBlack: std({ color: '#1b1b1c', metalness: 0.4, roughness: 0.45 }),
    book: std({ map: k.tex.painted(128, 160, bookCover), roughness: 0.6 }),
    bookDark: std({ color: '#33302c', roughness: 0.6 }),
  }
}

export type LivingFinishes = ReturnType<typeof livingFinishes>

/**
 * A scatter pillow: plump cover, an optional printed face and an optional fringe all round.
 * `rx` leans it back against the sofa, `rz` tilts it sideways.
 */
function pillow(lk: Kit, parent: Object3D, w: number, h: number, mat: Material, at: [number, number, number], rx: number, rz: number, opts: { face?: Material; fringe?: Material } = {}) {
  const g = new Group()
  g.position.set(...at)
  g.rotation.set(rx, 0, rz)
  parent.add(g)
  const t = 0.17
  lk.soft(g, w, h, t, 0.075, mat, 0, 0, 0)
  if (opts.face) lk.box(g, w - 0.12, h - 0.12, 0.004, opts.face, 0, 0, t / 2 + 0.002, false)
  if (opts.fringe) {
    const f = new Mesh(new PlaneGeometry(w + 0.09, h + 0.09), opts.fringe)
    g.add(f)
  }
}

/**
 * The long, low cream sofa (4.5 m): a tailored platform between two low square arms, two long
 * seat cushions, four back cushions, eight scatter pillows and a knitted throw with tasselled ends.
 */
export function sofa(lk: Kit, f: LivingFinishes, x: number, z: number, ry: number) {
  const [L, D] = [4.5, 1.05]
  const g = lk.at(x, z, ry, 0)
  const u = f.linen
  const inner = L - 0.5
  lk.box(g, L - 0.18, 0.07, D - 0.16, f.shadow, 0, 0.035, -0.02)
  lk.soft(g, inner + 0.02, 0.26, D, 0.025, u, 0, 0.2, 0)
  for (const s of [-1, 1]) lk.soft(g, 0.25, 0.66, D, 0.035, u, s * (L / 2 - 0.125), 0.4, 0)
  lk.soft(g, inner + 0.02, 0.53, 0.2, 0.03, u, 0, 0.595, -D / 2 + 0.1)
  for (const s of [-1, 1]) lk.soft(g, inner / 2 - 0.012, 0.15, D - 0.22, 0.045, u, (s * inner) / 4, 0.405, 0.1)
  for (let i = 0; i < 4; i++) lk.soft(g, inner / 4 - 0.016, 0.4, 0.2, 0.06, u, -inner / 2 + (inner / 4) * (i + 0.5), 0.67, -D / 2 + 0.3).rotation.x = -0.08

  // Scatter pillows, left to right as photographed (local −x is the end by the curtains).
  const back = (lx: number, w: number, h: number, mat: Material, rz: number, opts?: { face?: Material; fringe?: Material }, dy = 0, dz = 0) =>
    pillow(lk, g, w, h, mat, [lx, 0.72 + dy, -0.1 + dz], -0.22, rz, opts)
  back(-1.85, 0.5, 0.5, f.linen, 0.14, { face: f.palm })
  back(-0.09, 0.52, 0.5, f.cocoaWeave, -0.05)
  back(0.58, 0.55, 0.5, f.jute, 0.06, { fringe: tinted(f.fringe, '#c9a77a') })
  back(1.08, 0.5, 0.48, f.taupeWeave, -0.03, undefined, 0.02, -0.05)
  back(1.22, 0.5, 0.45, f.stripe, -0.05, { fringe: tinted(f.fringe, '#b3936d') }, -0.03, 0.06)
  back(1.72, 0.52, 0.52, f.linen, -0.08, { face: f.palm }, 0.04, -0.02)
  pillow(lk, g, 0.46, 0.36, f.jute, [0.66, 0.62, 0.06], -0.38, 0.04, { fringe: tinted(f.fringe, '#c9a77a') })
  pillow(lk, g, 0.48, 0.4, f.taupeWeave, [1.64, 0.63, 0.04], -0.32, -0.04)

  // The knitted throw: over the back, down the cushion, across the seat and over the front, ending in tassels.
  const tx = -1.52
  const tw = 0.5
  lk.box(g, tw, 0.02, 0.22, f.throwKnit, tx, 0.865, -D / 2 + 0.1)
  lk.box(g, tw, 0.4, 0.02, f.throwKnit, tx, 0.67, -D / 2 + 0.415).rotation.x = -0.08
  lk.box(g, tw, 0.02, D - 0.22, f.throwKnit, tx, 0.49, 0.1)
  lk.box(g, tw, 0.4, 0.02, f.throwKnit, tx, 0.29, D / 2 + 0.012)
  for (let i = 0; i < 9; i++) {
    const px = tx - tw / 2 + 0.03 + (i * (tw - 0.06)) / 8
    lk.sphere(g, 0.014, f.cream, px, 0.085, D / 2 + 0.015)
    lk.cyl(g, 0.011, 0.006, 0.075, f.cream, px, 0.035, D / 2 + 0.015, 6)
  }
}

/** A clone of a shared alpha material in another tone. */
function tinted(mat: MeshStandardMaterial, color: string) {
  const m = mat.clone()
  m.color.set(color)
  return m
}

/**
 * The sculptural lounge chair: a dark carved timber base curling into a foot at the front, a
 * woven seat, a round coiled-rope back and a round log for the arm along one side.
 */
export function loungeChair(lk: Kit, f: LivingFinishes, x: number, z: number, ry: number) {
  const g = lk.at(x, z, ry, 0)
  lk.soft(g, 0.42, 0.26, 0.58, 0.08, f.darkTimber, 0, 0.13, -0.04)
  const curl = new TubeGeometry(new CatmullRomCurve3([[0, 0.07, 0.15], [0, 0.07, 0.48], [0.02, 0.17, 0.62], [0, 0.28, 0.56], [-0.02, 0.27, 0.42]].map(v3)), 32, 0.075, 12)
  lk.mesh(curl, f.darkTimber, g, 0, 0, 0)
  lk.soft(g, 0.62, 0.12, 0.66, 0.05, f.chairWeave, 0, 0.36, 0.04).rotation.x = -0.1
  const back = new Mesh(new SphereGeometry(0.3, 32, 20), f.rope)
  back.position.set(0, 0.78, -0.3)
  back.scale.set(1, 1, 0.42)
  back.rotation.x = -0.15
  back.castShadow = true
  g.add(back)
  // The log arm on the near side, on two dark posts.
  lk.cyl(g, 0.075, 0.075, 1.05, f.log, -0.34, 0.56, 0.07, 20).rotation.x = PI / 2
  for (const pz of [-0.2, 0.32]) lk.cyl(g, 0.03, 0.04, 0.32, f.darkTimber, -0.34, 0.33, pz, 10)
}

/**
 * The reclaimed-timber coffee table (1.75 × 0.85 m) on trestle legs with a low stretcher, laid as
 * photographed: three cream pillar candles, a cocoa vase behind them, a wooden chain in front and
 * two books at the end.
 */
export function coffeeTable(lk: Kit, f: LivingFinishes, x: number, z: number) {
  const g = lk.at(x, z, 0, 0)
  const top = 0.44
  const edge = f.reclaimed
  lk.box(g, 1.75, 0.08, 0.85, [edge, edge, f.planks, edge, edge, edge], 0, top - 0.04, 0)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) lk.box(g, 0.1, top - 0.08, 0.1, edge, sx * 0.48, (top - 0.08) / 2, sz * 0.3)
    lk.box(g, 0.1, 0.07, 0.78, edge, sx * 0.48, 0.035, 0)
    lk.box(g, 0.1, 0.08, 0.7, edge, sx * 0.48, top - 0.12, 0)
  }
  lk.box(g, 0.86, 0.08, 0.08, edge, 0, 0.12, 0)

  // Local +x is the curtain end (left in the photograph); +z is toward the sofa.
  for (const [cx, h] of [[0.22, 0.16], [0.13, 0.13], [0.02, 0.09]]) lk.cyl(g, 0.042, 0.042, h, f.cream, cx, top + h / 2, 0.02, 24)
  const vase = new Mesh(lathe([[0, 0], [0.07, 0], [0.12, 0.05], [0.15, 0.13], [0.13, 0.24], [0.07, 0.33], [0.05, 0.37], [0.065, 0.4], [0, 0.4]], 32), f.cocoaGlaze)
  vase.position.set(-0.08, top, 0.2)
  vase.castShadow = true
  g.add(vase)
  const link = new TorusGeometry(0.03, 0.011, 8, 20)
  for (let i = 0; i < 8; i++) {
    const m = lk.mesh(link, f.linkWood, g, 0.36 - i * 0.072, top + (i % 2 ? 0.035 : 0.011), -0.16 + Math.sin(i * 0.9) * 0.03)
    m.scale.x = 1.5
    if (i % 2 === 0) m.rotation.x = PI / 2
    m.rotation.y = Math.sin(i * 0.9) * 0.3
  }
  lk.box(g, 0.32, 0.03, 0.24, f.bookDark, -0.34, top + 0.015, -0.1)
  lk.box(g, 0.3, 0.012, 0.23, [f.cream, f.cream, f.book, f.cream, f.cream, f.cream], -0.34, top + 0.036, -0.1).rotation.y = 0.05
}

/** The round dark side table: a thick rounded top on a straight column, with a white bowl and a rope sculpture. */
export function sideTable(lk: Kit, f: LivingFinishes, x: number, z: number) {
  const g = lk.at(x, z, 0, 0)
  const profile = [[0, 0], [0.17, 0], [0.17, 0.02], [0.15, 0.05], [0.145, 0.42], [0.2, 0.44], [0.28, 0.45], [0.305, 0.5], [0.3, 0.55], [0.27, 0.565], [0, 0.565]]
  lk.mesh(lathe(profile, 48), f.darkTimber, g, 0, 0, 0)
  const bowl = lathe([[0, 0], [0.08, 0], [0.16, 0.05], [0.18, 0.09], [0.17, 0.09], [0.15, 0.058], [0.07, 0.018], [0, 0.018]], 40)
  lk.mesh(bowl, f.ceramic, g, -0.03, 0.565, 0.02)
  // The knotted jute-rope figure in the bowl: a plump body, a small head and two pricked ears.
  const body = lk.sphere(g, 0.085, f.rope, -0.03, 0.66, 0.02)
  body.scale.set(1.3, 0.85, 0.95)
  lk.sphere(g, 0.045, f.rope, 0.08, 0.72, 0.02)
  for (const s of [-1, 1]) lk.cyl(g, 0.012, 0.02, 0.07, f.rope, 0.09, 0.78, 0.02 + s * 0.025, 8).rotation.x = s * 0.3
}

/** The two crochet poufs by the sofa's west end: a dense knitted drum and a smaller open-mesh one. */
export function poufs(lk: Kit, f: LivingFinishes, big: [number, number], small: [number, number]) {
  const drum = (r: number, h: number) => lathe([[0, 0], [r - 0.04, 0], [r, 0.04], [r + 0.01, h / 2], [r, h - 0.04], [r - 0.05, h], [0, h + 0.01]], 48)
  lk.mesh(drum(0.38, 0.44), f.knit, lk.at(big[0], big[1], 0, 0), 0, 0, 0)
  const g = lk.at(small[0], small[1], 0, 0)
  lk.mesh(drum(0.28, 0.42), std({ color: '#8f8472', roughness: 1 }), g, 0, 0, 0)
  const net = f.crochet.clone()
  net.map = f.crochet.map!.clone()
  net.map.repeat.set(10, 3)
  lk.mesh(drum(0.3, 0.43), net, g, 0, 0, 0)
  lk.mesh(new CylinderGeometry(0.27, 0.27, 0.01, 40), f.knit, g, 0, 0.43, 0)
}

/**
 * The corner between the curtains and the sofa: a dark two-handled amphora on a low teak stump,
 * and a studded charcoal pot on a tall weathered-timber pedestal.
 */
export function cornerPedestals(lk: Kit, f: LivingFinishes, stump: [number, number], pedestal: [number, number]) {
  const s = lk.at(stump[0], stump[1], 0.4, 0)
  const r = rng(78)
  lk.mesh(lathe(Array.from({ length: 9 }, (_, i) => [0.2 + (r() - 0.5) * 0.03 + (i === 0 ? 0.02 : 0), (i * 0.52) / 8]).concat([[0, 0.52]]), 24), f.teakRoot, s, 0, 0, 0)
  lk.mesh(lathe([[0, 0], [0.07, 0], [0.08, 0.02], [0.15, 0.1], [0.16, 0.15], [0.13, 0.23], [0.07, 0.27], [0.06, 0.31], [0.08, 0.33], [0, 0.33]], 32), f.blackGlaze, s, 0, 0.52, 0)
  for (const side of [-1, 1]) {
    const handle = lk.mesh(new TorusGeometry(0.045, 0.012, 8, 16, PI), f.blackGlaze, s, side * 0.12, 0.52 + 0.24, 0)
    handle.rotation.z = side > 0 ? -PI / 2 : PI / 2
  }

  const p = lk.at(pedestal[0], pedestal[1], 0, 0)
  lk.cyl(p, 0.19, 0.2, 0.77, f.weathered, 0, 0.385, 0, 32)
  const potProfile = [[0, 0], [0.09, 0], [0.14, 0.06], [0.16, 0.14], [0.14, 0.23], [0.09, 0.28], [0.08, 0.3], [0, 0.3]]
  lk.mesh(lathe(potProfile, 32), f.charcoalClay, p, 0, 0.77, 0)
  for (const [y, rr] of [[0.08, 0.148], [0.14, 0.16], [0.2, 0.152]])
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 2 * PI + y * 9
      lk.sphere(p, 0.016, f.charcoalClay, Math.cos(a) * rr, 0.77 + y, Math.sin(a) * rr)
    }
}

/**
 * The far corner by the sofa's west end: a teak root side table with a round black vase of dried
 * coral stems, and behind it a brown pot holding two tall dried palm spathes.
 */
export function palmCorner(lk: Kit, f: LivingFinishes, table: [number, number], pot: [number, number]) {
  const r = rng(79)
  const t = lk.at(table[0], table[1], 0.8, 0)
  lk.mesh(lathe([[0, 0], [0.26, 0], [0.3, 0.04], [0.22, 0.14], [0.2, 0.3], [0.24, 0.42], [0.31, 0.49], [0.32, 0.53], [0, 0.53]], 28), f.teakRoot, t, 0, 0, 0)
  lk.mesh(lathe([[0, 0], [0.07, 0], [0.13, 0.06], [0.15, 0.13], [0.12, 0.21], [0.05, 0.26], [0.045, 0.3], [0.055, 0.31], [0, 0.31]], 32), f.blackGlaze, t, -0.04, 0.53, 0.02)
  // Dried coral-like stems: fine branching sprays, each tipped with a cluster of small buds.
  for (let i = 0; i < 9; i++) {
    const [a, lean, hh] = [r() * 2 * PI, 0.25 + r() * 0.45, 0.14 + r() * 0.12]
    const [dx, dz] = [Math.cos(a) * Math.sin(lean) * hh, Math.sin(a) * Math.sin(lean) * hh]
    const stem = lk.cyl(t, 0.004, 0.005, hh, f.coral, -0.04 + dx / 2, 0.83 + (Math.cos(lean) * hh) / 2, 0.02 + dz / 2, 4)
    stem.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean)
    for (let j = 0; j < 5; j++) lk.blob(t, 0.012 + r() * 0.014, f.coral, -0.04 + dx + (r() - 0.5) * 0.07, 0.83 + Math.cos(lean) * hh + (r() - 0.3) * 0.05, 0.02 + dz + (r() - 0.5) * 0.07, 0.8)
  }

  const p = lk.at(pot[0], pot[1], 0, 0)
  lk.mesh(lathe([[0, 0], [0.12, 0], [0.17, 0.12], [0.18, 0.3], [0.14, 0.48], [0.15, 0.52], [0, 0.52]], 32), f.terracotta, p, 0, 0, 0)
  // Each spathe: a long boat-shaped blade, narrow at both ends, curving forward as it rises.
  const blade = (len: number, wid: number) => {
    const geo = new PlaneGeometry(wid, len, 1, 16)
    const pos = geo.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      const v = pos.getY(i) / len + 0.5
      pos.setX(i, pos.getX(i) * Math.pow(Math.sin(PI * Math.min(1, v * 0.95 + 0.05)), 0.7))
      pos.setZ(i, 0.22 * v * v + Math.abs(pos.getX(i)) * -0.6)
    }
    geo.translate(0, len / 2, 0)
    geo.computeVertexNormals()
    return geo
  }
  for (const [lean, len, ox] of [[0.16, 1.55, 0.04], [-0.13, 1.45, -0.05]]) {
    lk.cyl(p, 0.008, 0.01, 0.2, f.palmBlade, ox, 0.62, 0, 6)
    const m = lk.mesh(blade(len, 0.2), f.palmBlade, p, ox, 0.7, 0)
    m.rotation.set(-0.08, 0, lean)
  }
}

/** A black pedestal fan, standing just inside the opening beyond the sofa wall. */
export function pedestalFan(lk: Kit, f: LivingFinishes, x: number, z: number, ry: number) {
  const g = lk.at(x, z, ry, 0)
  lk.cyl(g, 0.2, 0.22, 0.04, f.fanBlack, 0, 0.02, 0, 32)
  lk.cyl(g, 0.018, 0.018, 1.2, f.fanBlack, 0, 0.62, 0, 10)
  const head = new Group()
  head.position.set(0, 1.3, 0)
  head.rotation.x = -0.12
  g.add(head)
  lk.sphere(head, 0.08, f.fanBlack, 0, 0, -0.1).scale.set(1, 1, 1.3)
  for (const dz of [-0.02, 0.1]) lk.mesh(new TorusGeometry(0.26, 0.006, 6, 48), f.fanBlack, head, 0, 0, dz)
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * 2 * PI
    const spoke = lk.box(head, 0.004, 0.26, 0.004, f.fanBlack, Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0.1, false)
    spoke.rotation.z = a - PI / 2
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * 2 * PI
    const b = lk.sphere(head, 0.1, f.fanBlack, Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0.04)
    b.scale.set(1.2, 0.6, 0.12)
    b.rotation.z = a
  }
}
