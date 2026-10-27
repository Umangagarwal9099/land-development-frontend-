import {
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
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
import { basketWeave, crochetNet, fringeStrands, indiaCover, juteBraid, knitStitch, linenWeave, liveEdge, palmPrint, palmRibs, rakuGlaze, ribKnit, ropeCoil, slabTop, stripeWeave, weatheredStone, woodGrain, clayPatina, burlap, carvedRelief, damaskBlind, driedGrass, logGrain, macrameKnots } from './paints'

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
    /** The lounge chair's cocoa-taupe ribbed knit, and its polished chocolate-walnut frame. */
    chairKnit: textile('chair-knit', ribKnit, 4, 1.0, { color: '#c2b2a2', sheenColor: '#cdb8a0' }),
    carved: new MeshPhysicalMaterial({ color: '#3b271b', roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    endGrain: std({ color: '#6b4a32', roughness: 0.6 }),
    rope: painted('rope', 128, ropeCoil, 3, { roughness: 0.95 }, 1.0),
    fringe: alpha(fringeStrands, 256, 1),
    crochet: alpha(crochetNet, 128, 1),
    /** The open-mesh pouf: its crochet cover, and the shadowed core seen through it. */
    crochetPouf: alpha(crochetNet, 128, 1),
    poufCore: std({ color: '#8f8472', roughness: 1 }),
    /** The coffee table: its slab top (one canvas across the whole top), weathered live edge and plank legs. */
    slabTop: (() => {
      const mat = painted('slab-top', 512, slabTop, 1, { roughness: 0.6 }, 0.35)
      for (const t of [mat.map!, mat.normalMap!]) {
        t.repeat.set(1 / 1.75, 1 / 0.85)
        t.offset.set(0.5, 0.5)
      }
      return mat
    })(),
    slabEdge: painted('slab-edge', 256, liveEdge, 4, { roughness: 0.9 }, 1.0),
    reclaimed: timber('reclaimed', [128, 84, 52], 73, 1.5),
    darkTimber: timber('dark-timber', [56, 42, 34], 74, 2, 0.6),
    weathered: timber('weathered', [92, 80, 70], 75, 1.5, 0.9),
    teakRoot: timber('teak-root', [150, 92, 52], 76, 1.5, 0.65),
    /** The corner by the curtains: oiled honey teak, smoky clay and two weathered grey stones. */
    teakTable: timber('teak-table', [170, 98, 50], 82, 1.2, 0.42),
    amphora: painted('amphora', 256, clayPatina, 2, { roughness: 0.85 }, 0.6),
    studStone: painted('stud-stone', 256, weatheredStone([92, 86, 78], 83), 2, { roughness: 0.9 }, 0.8),
    pedestalStone: painted('pedestal-stone', 256, weatheredStone([78, 70, 60], 84), 1.5, { roughness: 0.92 }, 0.9),
    /** The north wall: the rosewood log console, the macramé and its dried grass, the carvings, lamp shade, blind and black stoneware. */
    consoleLog: painted('log-grain', 256, logGrain, 1, { roughness: 0.55 }, 0.6),
    logEnd: std({ color: '#3a1e12', roughness: 0.9 }),
    macrame: alpha(macrameKnots, 512, 1, '#ffffff'),
    grass: alpha(driedGrass, 256, 1, '#ffffff'),
    fragment: painted('fragment', 256, carvedRelief([138, 118, 100], 116), 1, { roughness: 0.95 }, 1.2),
    lampStone: painted('lamp-stone', 256, carvedRelief([118, 110, 100], 117), 1, { roughness: 0.9 }, 1.2),
    shade: std({ map: k.tex.painted(256, 256, burlap), side: DoubleSide, roughness: 1, emissive: '#ffcf94', emissiveIntensity: 0.6 }),
    blind: painted('blind', 256, damaskBlind, 1, { roughness: 0.95 }, 0.5),
    blackStone: painted('black-stone', 256, weatheredStone([40, 38, 36], 118), 2, { roughness: 0.85 }, 0.6),
    greyStone: painted('grey-stone', 256, weatheredStone([96, 94, 90], 119), 2, { roughness: 0.85 }, 0.6),
    iron: std({ color: '#1b1a19', roughness: 0.6, metalness: 0.5 }),
    brass: std({ color: '#c9a45c', roughness: 0.3, metalness: 1 }),
    lightWood: std({ color: '#c8a77c', roughness: 0.6 }),
    /** The honey-teak log of the lounge chair's arm. */
    log: timber('log', [178, 114, 62], 77, 1, 0.45),
    palmBlade: std({ map: k.tex.painted(64, 256, palmRibs), side: DoubleSide, roughness: 0.9 }),
    cream: std({ color: '#ece4d6', roughness: 0.6 }),
    ceramic: std({ color: '#ece8df', roughness: 0.35 }),
    blackGlaze: std({ color: '#141210', roughness: 0.3 }),
    charcoalClay: std({ color: '#38312c', roughness: 0.8 }),
    cocoaGlaze: std({ color: '#3a2a20', roughness: 0.4 }),
    raku: new MeshPhysicalMaterial({ map: k.tex.painted(256, 256, rakuGlaze), roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
    candle: std({ color: '#ebe4d4', roughness: 0.7 }),
    wick: std({ color: '#2a2622', roughness: 0.9 }),
    terracotta: std({ color: '#6b4631', roughness: 0.85 }),
    linkWood: std({ color: '#c49a70', roughness: 0.55 }),
    coral: std({ color: '#dcc6a2', roughness: 0.9 }),
    shadow: std({ color: '#2a2420', roughness: 0.9 }),
    fanBlack: std({ color: '#1b1b1c', metalness: 0.4, roughness: 0.45 }),
    book: std({ map: k.tex.painted(256, 320, indiaCover), roughness: 0.5 }),
    bookWhite: std({ color: '#ebe6de', roughness: 0.7 }),
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
 * The sculptural lounge chair, from its photographs (front and side): a thick ribbed-knit seat
 * sloping up toward the front like a lounger; a deep, bolster-thick pill cushion for the back; a
 * straight honey-teak log for the arm along the near side, cut square at the front; a strap
 * sweeping behind the seat to a curved wing on the far side; and a sculpted walnut base of a
 * quarter-round slab under the front, a rounded block under the back and a low runner on the floor.
 */
export function loungeChair(lk: Kit, f: LivingFinishes, x: number, z: number, ry: number) {
  const g = lk.at(x, z, ry, 0)
  const wood = f.carved
  // The base: a low runner along the floor, a rounded block under the back of the seat, and the
  // quarter-round slab under the front, its curve sweeping down to the floor.
  lk.soft(g, 0.15, 0.13, 0.62, 0.05, wood, 0, 0.065, -0.2)
  lk.soft(g, 0.46, 0.3, 0.42, 0.12, wood, 0.02, 0.27, -0.14)
  const quarter = new Shape()
  quarter.moveTo(0, 0)
  quarter.lineTo(0.38, 0)
  quarter.absellipse(0, 0, 0.38, 0.34, 0, PI / 2, false, 0)
  quarter.lineTo(0, 0)
  const slab = new ExtrudeGeometry(quarter, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 24 })
  slab.rotateY(-PI / 2)
  lk.mesh(slab, wood, g, 0.05, 0.015, 0.03)
  // The seat: a thick knit pad, 0.45 m high at the back rising to 0.59 m at the front.
  lk.soft(g, 0.66, 0.12, 0.86, 0.05, f.chairKnit, 0.02, 0.46, 0.05).rotation.x = -0.165
  // The back cushion: a deep stadium of knit, rounded like a bolster, leaning back.
  const pill = new Shape()
  const [pw, ph] = [0.78, 0.38]
  pill.absarc(-pw / 2 + ph / 2, 0, ph / 2, PI / 2, (3 * PI) / 2, false)
  pill.absarc(pw / 2 - ph / 2, 0, ph / 2, -PI / 2, PI / 2, false)
  const back = new ExtrudeGeometry(pill, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 6, curveSegments: 24 })
  back.translate(0, 0, -0.05)
  lk.mesh(back, f.chairKnit, g, 0.03, 0.86, -0.38).rotation.x = -0.15
  const dimple = std({ color: '#4e3f33', roughness: 1 })
  for (const s of [-1, 1]) lk.sphere(g, 0.009, dimple, 0.03 + s * 0.16, 0.87, -0.255)
  // The log arm: straight and level along the near side, from behind the cushion to just short of the seat's front.
  lk.cyl(g, 0.058, 0.058, 0.95, f.log, -0.37, 0.61, 0.0, 24).rotation.x = PI / 2
  lk.mesh(new CircleGeometry(0.058, 24), f.endGrain, g, -0.37, 0.61, 0.476)
  // The strap: from under the log, sweeping down behind the seat to the foot of the wing.
  const tube = (pts: number[][], r: number) => lk.mesh(new TubeGeometry(new CatmullRomCurve3(pts.map(v3)), 40, r, 14), wood, g, 0, 0, 0)
  tube([[-0.36, 0.57, -0.18], [-0.12, 0.52, -0.32], [0.14, 0.5, -0.4], [0.3, 0.53, -0.44]], 0.028)
  // The wing on the far side: a broad curved walnut panel behind the cushion's end, rising just above it.
  const sail = new Shape()
  sail.moveTo(0.14, 0.48)
  sail.quadraticCurveTo(0.38, 0.42, 0.52, 0.48)
  sail.lineTo(0.52, 1.02)
  sail.quadraticCurveTo(0.47, 1.09, 0.37, 1.05)
  sail.quadraticCurveTo(0.25, 0.78, 0.14, 0.48)
  const wing = new ExtrudeGeometry(sail, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 16 })
  lk.mesh(wing, wood, g, 0, 0, -0.5).rotation.y = -0.35
}

/**
 * The dark walnut floor sculpture beside the chair: a thick wave lying on the rug, an S in plan
 * that humps up toward one end and finishes in a bulbous knob.
 */
export function sCurveSculpture(lk: Kit, f: LivingFinishes, x: number, z: number, ry: number) {
  const g = lk.at(x, z, ry, 0)
  const pts = [[-0.32, 0.07, 0.04], [-0.18, 0.16, -0.08], [-0.04, 0.12, 0.0], [0.1, 0.08, 0.1], [0.24, 0.07, 0.03], [0.34, 0.1, -0.06]]
  lk.mesh(new TubeGeometry(new CatmullRomCurve3(pts.map(v3)), 64, 0.06, 16), f.carved, g, 0, 0, 0)
  lk.sphere(g, 0.06, f.carved, -0.32, 0.07, 0.04)
  lk.sphere(g, 0.095, f.carved, 0.36, 0.1, -0.07).scale.set(1.25, 0.95, 1)
}

/**
 * The coffee table, from its close-up photograph: one thick slab of reclaimed teak (1.75 × 0.85 m,
 * 10 cm deep) with a weathered live edge, a void in its back edge and splits at both ends, on two
 * plank legs joined by a stretcher. On it, as laid: three ivory pillar candles, the raku vase
 * behind them, a chain of big wooden links curving in front, and the "Images of India" book on a
 * white one at the west end.
 */
export function coffeeTable(lk: Kit, f: LivingFinishes, x: number, z: number) {
  const g = lk.at(x, z, 0, 0)
  const [L, W, T, top] = [1.75, 0.85, 0.1, 0.44]
  const r = rng(95)
  // The slab outline: slightly irregular edges, softened corners and the notch in the back edge
  // (shape y becomes +z, toward the sofa).
  const outline: [number, number][] = []
  const edge = (x0: number, y0: number, x1: number, y1: number, n: number, jitter: number) => {
    for (let i = 0; i < n; i++) {
      const t = i / n
      outline.push([x0 + (x1 - x0) * t + (r() - 0.5) * jitter * Math.abs(y1 - y0), y0 + (y1 - y0) * t + (r() - 0.5) * jitter * Math.abs(x1 - x0)])
    }
  }
  const [hx, hz, c] = [L / 2, W / 2, 0.03]
  edge(-hx + c, -hz, hx - c, -hz, 24, 0.012)
  edge(hx, -hz + c, hx, hz - c, 10, 0.014)
  for (let i = 0; i <= 24; i++) {
    const px = hx - c - ((L - 2 * c) * i) / 24
    const notch = Math.max(0, 1 - Math.abs(px - 0.37) / 0.05) * 0.05
    outline.push([px, hz - notch + (r() - 0.5) * 0.01])
  }
  edge(-hx, hz - c, -hx, -hz + c, 10, 0.014)
  const shape = new Shape(outline.map(([a, b]) => new Vector2(a, b)))
  const slab = new ExtrudeGeometry(shape, { depth: T - 0.016, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 })
  slab.rotateX(PI / 2)
  lk.mesh(slab, [f.slabTop, f.slabEdge], g, 0, top - 0.008, 0)
  // Two plank legs set in from the ends, and the stretcher between them.
  for (const s of [-1, 1]) lk.box(g, 0.1, top - T, 0.6, f.reclaimed, s * 0.455, (top - T) / 2, 0)
  lk.box(g, 0.81, 0.1, 0.05, f.reclaimed, 0, 0.18, 0)

  // Local +x is the curtain end (left in the photographs); +z is toward the sofa.
  for (const [cx, cz, h] of [[0.18, 0.14, 0.17], [0.12, 0.04, 0.15], [0.015, 0.06, 0.1]]) {
    lk.cyl(g, 0.05, 0.05, h, f.candle, cx, top + h / 2, cz, 28)
    lk.cyl(g, 0.003, 0.003, 0.015, f.wick, cx, top + h + 0.006, cz, 4)
  }
  const vase = new Mesh(lathe([[0, 0], [0.085, 0], [0.1, 0.04], [0.125, 0.12], [0.145, 0.22], [0.14, 0.27], [0.11, 0.32], [0.06, 0.35], [0.045, 0.36], [0.05, 0.375], [0, 0.375]], 40), f.raku)
  vase.position.set(-0.085, top, 0.24)
  vase.castShadow = true
  g.add(vase)
  // The chain: eight big links curving across the front, lying flat and standing in turn.
  const link = new TorusGeometry(0.047, 0.014, 10, 24)
  const path: [number, number][] = [[0.315, 0.126], [0.259, 0.012], [0.203, -0.103], [0.147, -0.158], [0.083, -0.149], [0.019, -0.103], [-0.053, -0.011], [-0.125, 0.012]]
  path.forEach(([lx, lz], i) => {
    const [nx, nz] = path[Math.min(i + 1, path.length - 1)]
    const [px, pz] = path[Math.max(i - 1, 0)]
    const holder = new Group()
    holder.position.set(lx, top + (i % 2 ? 0.061 : 0.014), lz)
    holder.rotation.y = -Math.atan2(nz - pz, nx - px)
    g.add(holder)
    const m = lk.mesh(link, f.linkWood, holder, 0, 0, 0)
    m.scale.x = 1.4
    if (i % 2 === 0) m.rotation.x = PI / 2
  })
  // The book on a white one, at the west end.
  const books = new Group()
  books.position.set(-0.32, top, -0.01)
  books.rotation.y = PI - 0.08
  g.add(books)
  lk.box(books, 0.31, 0.035, 0.24, f.bookWhite, 0, 0.0175, 0)
  lk.box(books, 0.29, 0.025, 0.225, [f.bookWhite, f.bookWhite, f.book, f.bookWhite, f.bookWhite, f.bookWhite], 0.005, 0.048, 0).rotation.y = 0.03
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
  lk.mesh(drum(0.28, 0.42), f.poufCore, g, 0, 0, 0)
  f.crochetPouf.map!.repeat.set(10, 3)
  lk.mesh(drum(0.3, 0.43), f.crochetPouf, g, 0, 0, 0)
  lk.mesh(new CylinderGeometry(0.27, 0.27, 0.01, 40), f.knit, g, 0, 0.43, 0)
}

/**
 * The corner between the curtains and the sofa, from its close-up photograph: a ribbed two-handled
 * amphora of smoky dark clay on an oiled teak side table (a thick round top on a curved slab base
 * hollowed right through, open toward the room), and a grey studded stone pot on a tall pedestal
 * of weathered stone.
 */
export function cornerPedestals(lk: Kit, f: LivingFinishes, table: [number, number], pedestal: [number, number]) {
  const r = rng(85)
  const t = lk.at(table[0], table[1], 0, 0)
  // The top: a thick disc with a slightly irregular natural edge.
  const top = new CylinderGeometry(0.215, 0.21, 0.075, 48, 1)
  const pos = top.getAttribute('position')
  const wobble = Array.from({ length: 49 }, () => 1 + (r() - 0.5) * 0.06)
  for (let i = 0; i < pos.count; i++) {
    const [px, pz] = [pos.getX(i), pos.getZ(i)]
    const rad = Math.hypot(px, pz)
    if (rad < 0.05) continue
    const k = wobble[Math.round(((Math.atan2(pz, px) + PI) / (2 * PI)) * 48)]
    pos.setX(i, px * k)
    pos.setZ(i, pz * k)
  }
  top.computeVertexNormals()
  lk.mesh(top, f.teakTable, t, 0, 0.5125, 0)
  // The base: a thick curved slab wrapping the back and west side, leaving the hollow open toward
  // the room and the curtains (shape y becomes −z).
  const sector = new Shape()
  const [a0, a1] = [(150 * PI) / 180, (330 * PI) / 180]
  sector.absarc(0, 0, 0.2, a0, a1, false)
  sector.absarc(0, 0, 0.13, a1, a0, true)
  const base = new ExtrudeGeometry(sector, { depth: 0.475, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 32 })
  base.rotateX(-PI / 2)
  lk.mesh(base, f.teakTable, t, 0, 0, 0)
  // The hollow's inner face (inside the slab's bevel), in shadow as photographed: the renderer has no ambient occlusion.
  const hollow = new CylinderGeometry(0.114, 0.114, 0.47, 32, 1, true, (240 * PI) / 180, PI)
  lk.mesh(hollow, std({ color: '#1c100a', roughness: 1, side: DoubleSide }), t, 0, 0.235, 0, false)
  // The amphora: a ribbed belly, a short neck and two loop handles from neck to shoulder.
  const profile: number[][] = [[0, 0]]
  const radius = (y: number) => {
    const knots = [[0, 0.07], [0.04, 0.1], [0.11, 0.125], [0.19, 0.12], [0.235, 0.08], [0.255, 0.066], [0.285, 0.068], [0.3, 0.074]]
    for (let i = 1; i < knots.length; i++)
      if (y <= knots[i][0]) {
        const [[ya, ra], [yb, rb]] = [knots[i - 1], knots[i]]
        return ra + ((rb - ra) * (y - ya)) / (yb - ya)
      }
    return 0.074
  }
  for (let y = 0; y <= 0.3; y += 0.005) profile.push([radius(y) + (y > 0.04 && y < 0.21 ? 0.006 * Math.max(0, Math.sin((y / 0.034) * 2 * PI)) : 0), y])
  profile.push([0.06, 0.3], [0.058, 0.26])
  lk.mesh(lathe(profile, 48), f.amphora, t, 0, 0.55, 0)
  for (const s of [-1, 1]) {
    const curve = new CatmullRomCurve3([[0.064, 0.27, 0], [0.11, 0.27, 0], [0.128, 0.235, 0], [0.12, 0.2, 0]].map(([a, b, c]) => v3([s * a, b, c])))
    lk.mesh(new TubeGeometry(curve, 16, 0.011, 8), f.amphora, t, 0, 0.55, 0)
  }

  const p = lk.at(pedestal[0], pedestal[1], 0, 0)
  lk.cyl(p, 0.19, 0.195, 0.78, f.pedestalStone, 0, 0.39, 0, 40)
  // The studded pot: round-bellied with an open rim, three staggered rings of round studs.
  const pot = [[0, 0], [0.09, 0], [0.12, 0.03], [0.145, 0.1], [0.148, 0.15], [0.135, 0.21], [0.112, 0.25], [0.108, 0.268], [0.096, 0.268], [0.092, 0.25], [0, 0.25]]
  lk.mesh(lathe(pot, 40), f.studStone, p, 0, 0.78, 0)
  const stud = new CylinderGeometry(0.021, 0.023, 0.014, 20)
  const up = new Vector3(0, 1, 0)
  for (const [y, rr, n, phase] of [[0.075, 0.135, 9, 0], [0.135, 0.148, 10, 0.3], [0.195, 0.142, 9, 0.6]] as const)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * PI + phase
      const dir = new Vector3(Math.cos(a), y > 0.17 ? 0.35 : y < 0.1 ? -0.25 : 0, Math.sin(a)).normalize()
      const m = lk.mesh(stud, f.studStone, p, Math.cos(a) * rr, 0.78 + y, Math.sin(a) * rr)
      m.quaternion.setFromUnitVectors(up, dir)
      lk.sphere(p, 0.006, f.studStone, Math.cos(a) * (rr + 0.009), 0.78 + y + dir.y * 0.009, Math.sin(a) * (rr + 0.009))
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

/**
 * The north wall's console, from its photograph: a massive live-edge rosewood log (3.6 m, 0.45 m
 * deep) split along its face and broken open at the east end, resting on two pairs of stumps.
 */
export function logConsole(lk: Kit, f: LivingFinishes, x: number, z: number, len: number, top: number) {
  const g = lk.at(x, z, 0, 0)
  const r = rng(120)
  const [hd, hh] = [0.21, 0.225]
  // The cross-section: a rough rounded rectangle, a little irregular all round (x is depth, y is height).
  const pts: Vector2[] = []
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * 2 * PI
    const [c, s2] = [Math.cos(a), Math.sin(a)]
    const k = 1 / Math.pow(Math.pow(Math.abs(c), 5) + Math.pow(Math.abs(s2), 5), 0.2)
    pts.push(new Vector2(c * k * hd * (1 + (r() - 0.5) * 0.06), s2 * k * hh * (1 + (r() - 0.5) * 0.06)))
  }
  const body = new ExtrudeGeometry(new Shape(pts), { depth: len, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 3 })
  body.rotateY(PI / 2)
  body.translate(-len / 2, 0, 0)
  const side = f.consoleLog.clone()
  side.map = f.consoleLog.map!.clone()
  side.map.repeat.set(2.4, 1 / 1.8)
  lk.mesh(body, [f.logEnd, side], g, 0, top - hh, 0)
  // The broken east end: dark holes and splinters in the end grain.
  for (const [dy, dz, rr] of [[0.05, -0.04, 0.05], [-0.07, 0.06, 0.035], [0.11, 0.08, 0.03]]) {
    const hole = lk.sphere(g, rr, f.logEnd, len / 2 + 0.02, top - hh + dy, dz)
    hole.scale.set(0.5, 1, 1)
  }
  // Two pairs of stumps for legs, each flaring at the root.
  for (const lx of [-1.22, 1.25])
    for (const dx of [-0.11, 0.11]) {
      const prof: number[][] = [[0, 0]]
      for (let i = 0; i <= 8; i++) {
        const y = (i / 8) * (top - 2 * hh)
        prof.push([0.11 + (i === 0 ? 0.03 : i === 1 ? 0.012 : 0) + (r() - 0.5) * 0.015, y])
      }
      prof.push([0, top - 2 * hh])
      lk.mesh(lathe(prof, 20), side, g, lx + dx, 0, (r() - 0.5) * 0.04)
    }
}

/** The things on the console, west to east, as photographed: a carved fragment on an iron stand, a stone jar, a two-handled vase, the candles and the lamp. */
export function consoleDecor(lk: Kit, f: LivingFinishes, x: number, z: number, top: number) {
  const g = lk.at(x, z, 0, top)
  // The temple-carving fragment on a little wrought-iron tripod stand.
  const stand = new Group()
  stand.position.set(-1.41, 0, 0)
  g.add(stand)
  lk.mesh(new TorusGeometry(0.07, 0.006, 6, 24), f.iron, stand, 0, 0.11, 0).rotation.x = PI / 2
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * 2 * PI + 0.4
    const leg = new CatmullRomCurve3([[Math.cos(a) * 0.07, 0.11, Math.sin(a) * 0.07], [Math.cos(a) * 0.1, 0.05, Math.sin(a) * 0.1], [Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12]].map(v3))
    lk.mesh(new TubeGeometry(leg, 8, 0.005, 5), f.iron, stand, 0, 0, 0)
  }
  lk.soft(stand, 0.24, 0.17, 0.14, 0.025, f.fragment, 0, 0.2, 0).rotation.z = 0.06
  // A small grey stone jar and the dark two-handled vase.
  lk.mesh(lathe([[0, 0], [0.05, 0], [0.06, 0.04], [0.062, 0.1], [0.045, 0.13], [0.04, 0.14], [0, 0.14]], 28), f.greyStone, g, -1.01, 0, 0.02)
  lk.mesh(lathe([[0, 0], [0.045, 0], [0.07, 0.04], [0.075, 0.07], [0.05, 0.1], [0.025, 0.13], [0.022, 0.16], [0.03, 0.175], [0, 0.175]], 28), f.greyStone, g, -0.76, 0, 0.03)
  for (const s of [-1, 1]) lk.mesh(new TorusGeometry(0.02, 0.005, 6, 12, PI), f.greyStone, g, -0.76 + s * 0.065, 0.075, 0.03).rotation.z = s > 0 ? -PI / 2 : PI / 2
  // The candles: two tall ivory pillars, one on a black ribbed holder, with short brass cups in front.
  lk.cyl(g, 0.042, 0.042, 0.22, f.candle, -0.24, 0.11, 0.0, 24)
  lk.mesh(lathe(Array.from({ length: 13 }, (_, i) => [0.036 + (i % 2) * 0.004, (i / 12) * 0.11]).concat([[0, 0.11]]), 20), f.blackStone, g, -0.1, 0, 0.02)
  lk.cyl(g, 0.04, 0.04, 0.17, f.candle, -0.1, 0.11 + 0.085, 0.02, 24)
  for (const [cx, h] of [[-0.3, 0.06], [-0.22, 0.05], [-0.16, 0.07]]) {
    lk.cyl(g, 0.026, 0.024, h, f.brass, cx, h / 2, 0.1, 20)
    lk.cyl(g, 0.02, 0.02, 0.01, f.candle, cx, h + 0.004, 0.1, 16)
  }
  // The lamp: a carved stone half-disc base, a turned stem, and a glowing burlap drum.
  const lamp = new Group()
  lamp.position.set(1.39, 0, 0)
  g.add(lamp)
  const disc = lk.mesh(new CylinderGeometry(0.12, 0.12, 0.07, 32, 1, false, -PI / 2, PI), f.lampStone, lamp, 0, 0, 0)
  disc.rotation.x = -PI / 2
  lk.mesh(lathe([[0, 0], [0.03, 0], [0.025, 0.03], [0.035, 0.05], [0.02, 0.09], [0.015, 0.12], [0, 0.12]], 20), f.lampStone, lamp, 0, 0.12, 0)
  lk.mesh(new CylinderGeometry(0.14, 0.14, 0.17, 40, 1, true), f.shade, lamp, 0, 0.36, 0, false)
}

/** The macramé hanging over the console: a light dowel, the knotted cotton, and dried grass fanning behind. */
export function macrame(lk: Kit, f: LivingFinishes, x: number, z: number, topY: number) {
  const g = lk.at(x, z, 0, 0)
  lk.cyl(g, 0.012, 0.012, 0.98, f.lightWood, 0, topY, 0.04, 10).rotation.z = PI / 2
  const grass = new Mesh(new PlaneGeometry(0.96, 1.08), f.grass)
  grass.position.set(0, topY - 0.56, 0.02)
  g.add(grass)
  const knots = new Mesh(new PlaneGeometry(0.8, 1.12), f.macrame)
  knots.position.set(0, topY - 0.57, 0.035)
  g.add(knots)
}

/** By the step: a black pitcher on a black stone goblet pedestal, and a tall black bottle on the floor. */
export function blackStoneware(lk: Kit, f: LivingFinishes, pedestal: [number, number], bottle: [number, number]) {
  const p = lk.at(pedestal[0], pedestal[1], 0, 0)
  lk.mesh(lathe([[0, 0], [0.12, 0], [0.12, 0.03], [0.1, 0.05], [0.1, 0.24], [0.14, 0.27], [0.19, 0.32], [0.21, 0.38], [0.21, 0.44], [0, 0.44]], 40), f.blackStone, p, 0, 0, 0)
  lk.mesh(lathe([[0, 0], [0.09, 0], [0.12, 0.08], [0.15, 0.24], [0.14, 0.36], [0.09, 0.48], [0.075, 0.55], [0.09, 0.6], [0.085, 0.61], [0, 0.6]], 40), f.blackStone, p, 0, 0.44, 0)
  const handle = new CatmullRomCurve3([[0.08, 0.58, 0], [0.17, 0.57, 0], [0.18, 0.47, 0], [0.14, 0.38, 0]].map(v3))
  lk.mesh(new TubeGeometry(handle, 16, 0.014, 8), f.blackStone, p, 0, 0.44, 0)
  lk.mesh(lathe([[0, 0], [0.085, 0], [0.1, 0.05], [0.1, 0.38], [0.08, 0.46], [0.04, 0.53], [0.035, 0.58], [0.042, 0.6], [0, 0.6]], 32), f.blackStone, lk.at(bottle[0], bottle[1], 0, 0), 0, 0, 0)
}
