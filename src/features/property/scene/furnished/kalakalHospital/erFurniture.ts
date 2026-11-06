import {
  CatmullRomCurve3, DoubleSide, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Shape, TorusGeometry, Vector2, Vector3,
  type Material, type MeshStandardMaterialParameters, type Object3D,
} from 'three'
import { PI } from '../kit'
import {
  bake, bentTube, carcass, castor, cupboardDoor, drape, drawer, face, geo, group, lathe, panel, pillow, put, rod, tube, type Ctx,
} from './erKit'
import { itemMats, ivBag, regulator } from './opd/equipment/items'

/*
 * The emergency department's furniture, modelled on the products such a department buys: an ED
 * stretcher-bed (after the 2.1 m hydraulic emergency stretchers in common use), hospital lockers,
 * overbed tables, solid-surface counters on drawer pedestals, cupboards, the red crash cart,
 * seating and wheelchairs. Everything a visitor would try to open opens (see erKit drawer and
 * cupboardDoor); everything is built in its own frame, front towards +z, on y = 0.
 */

/* ---------- the ED stretcher-bed ---------- */

export interface BedFit {
  /** The backrest's angle, radians up from flat. */
  back: number
  /** Linen: made up and waiting, in use (the blanket thrown back), or stripped to the sheet. */
  linen: 'made' | 'used' | 'sheet'
  /** Mattress top above the floor (the litter rises from 0.56 to 0.9). */
  height?: number
  /** The side rails start lowered. */
  railsDown?: boolean
  /** A portable oxygen cylinder in the base tray; the IV pole raised with a bag. */
  o2?: boolean
  iv?: boolean
}

/**
 * The bed along local z, head at −z: twin-wheel castors with the brake and steer pedals at the
 * ends, the moulded base hood with its storage tray, the lift columns in their bellows, the
 * aluminium litter with corner bumpers and push handles, a four-section mattress in blue vinyl
 * with the backrest raised on its own (operated: Raise / Lower), linen and pillow, side rails
 * that lower (operated), moulded head and foot boards, the IV pole.
 */
export function bed(e: Ctx, p: Object3D, o: BedFit) {
  const { k, m } = e
  const H = o.height ?? 0.66
  const MT = 0.1
  const deck = H - MT
  const W = 0.74
  // Castors, the brake (red) and steer (green) pedals on their bars at either end.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.3, sz * 0.8, 0.075, sx * sz * 0.25 + (e.r() - 0.5) * 0.4)
  for (const sz of [-1, 1]) {
    rod(e, p, 0.012, 0.72, m.stainless, 0, 0.16, sz * 0.9, 'x', 8)
    k.soft(p, 0.12, 0.03, 0.09, 0.012, m.red, -0.3, 0.165, sz * 0.93)
    k.soft(p, 0.12, 0.03, 0.09, 0.012, m.green, 0.3, 0.165, sz * 0.93)
  }
  // The base: chassis, its moulded hood, the tray on top for a cylinder or belongings.
  k.soft(p, 0.62, 0.06, 1.66, 0.02, m.bedFrame, 0, 0.19, 0)
  k.soft(p, 0.76, 0.13, 1.74, 0.05, m.bedBase, 0, 0.27, 0)
  k.soft(p, 0.66, 0.015, 1.2, 0.006, m.darkPlastic, 0, 0.336, 0.08)
  if (o.o2) {
    const c = group(p, 0.12, 0.42, -0.25)
    c.rotation.x = PI / 2
    cylinder(e, c, 0.11, 0.62, 'portable')
    for (const z of [-0.12, 0.18]) k.box(p, 0.24, 0.02, 0.04, m.darkPlastic, 0.12, 0.35, z - 0.25)
  }
  // Lift columns at head and foot, in their bellows.
  const bellow = lathe(e, `bellows${deck.toFixed(2)}`, Array.from({ length: 17 }, (_, i): [number, number] => [i % 2 ? 0.075 : 0.065, 0.34 + ((deck - 0.42) * i) / 16]), 28)
  for (const z of [-0.48, 0.48]) {
    put(p, bellow, m.darkPlastic, 0, 0, z)
    k.soft(p, 0.2, 0.06, 0.18, 0.02, m.greyPlastic, 0, deck - 0.05, z)
  }
  // The litter: a tube frame round the deck, bumpers on the corners, push handles at the head.
  const L = 2.0
  const frame = bentTube(e, `litter${deck.toFixed(2)}`, [[0, deck - 0.03, -L / 2], [0.4, deck - 0.03, -L / 2], [0.4, deck - 0.03, L / 2], [-0.4, deck - 0.03, L / 2], [-0.4, deck - 0.03, -L / 2], [0.001, deck - 0.03, -L / 2]], 0.018, 0.08)
  put(p, frame, m.bedFrame)
  k.soft(p, 0.76, 0.025, 1.3, 0.008, m.greyPlastic, 0, deck - 0.012, 0.33)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(p, lathe(e, 'bumper', [[0, -0.03], [0.045, -0.03], [0.05, -0.02], [0.05, 0.02], [0.045, 0.03], [0, 0.03]], 20), m.darkPlastic, sx * 0.38, deck - 0.04, sz * 0.97)
  for (const sx of [-1, 1]) put(p, bentTube(e, `push${sx}`, [[sx * 0.36, deck - 0.03, -0.95], [sx * 0.36, deck + 0.02, -1.06], [sx * 0.33, deck + 0.3, -1.08]], 0.014, 0.05), m.bedFrame)
  // The seat and leg sections, with the linen over them.
  k.soft(p, W, MT, 1.3, 0.035, m.mattress, 0, deck + MT / 2, 0.33)
  const seed = (e.r() * 100) | 0
  put(p, drape(e, `seat${seed}`, W + 0.01, 1.3, 0.085, 0, seed), m.sheet, 0, deck + MT + 0.004, 0.33)
  // The backrest, hinged at the seat: its deck, mattress, linen and pillow; operated.
  const back = new Group()
  back.name = `door_er_${e.ids++}`
  back.position.set(0, deck, -0.32)
  back.rotation.x = o.back
  const up = o.back < 0.45
  back.userData = { axis: 'x', openAngle: (up ? 1.05 : 0.08) - o.back, label: 'Backrest', verbs: up ? ['Raise', 'Lower'] : ['Lower', 'Raise'] }
  p.add(back)
  k.soft(back, 0.74, 0.02, 0.66, 0.008, m.greyPlastic, 0, -0.012, -0.33)
  const mat = k.soft(back, W, MT, 0.66, 0.035, m.mattress, 0, MT / 2, -0.33)
  put(back, drape(e, `back${seed}`, W + 0.01, 0.66, 0.085, 0, seed + 3), m.sheet, 0, MT + 0.004, -0.33)
  if (o.linen !== 'sheet') {
    const pl = put(back, pillow(e, 0.6, 0.13, 0.4), m.sheet, (e.r() - 0.5) * 0.06, MT + 0.07, -0.42)
    pl.rotation.set(-0.08, (e.r() - 0.5) * 0.12, 0)
  }
  mat.userData.front = true
  bake(back, mat)
  // Blanket: folded at the foot, or thrown back over the legs.
  if (o.linen === 'made') {
    for (let i = 0; i < 3; i++) k.soft(p, 0.56 - i * 0.01, 0.028, 0.34, 0.012, i === 2 ? m.sheet : m.blanket, 0.01 * i, deck + MT + 0.02 + i * 0.027, 0.72 + i * 0.004)
  } else if (o.linen === 'used') {
    put(p, drape(e, `blanket${seed}`, W + 0.03, 0.9, 0.16, 0, seed + 7), m.blanket, 0, deck + MT + 0.02, 0.5)
    k.soft(p, W + 0.06, 0.05, 0.16, 0.024, m.blanket, 0, deck + MT + 0.04, 0.06)
  }
  // Side rails, each a moulded panel on two arms, raised or lowered (operated).
  for (const s of [-1, 1]) {
    const rail = new Group()
    rail.name = `drawer_er_${e.ids++}`
    rail.position.set(s * 0.41, deck + 0.21 - (o.railsDown ? 0.27 : 0), -0.1)
    rail.userData = { slide: o.railsDown ? [0, 0.27, 0] : [0, -0.27, 0], label: 'Side Rail', verbs: o.railsDown ? ['Raise', 'Lower'] : ['Lower', 'Raise'] }
    p.add(rail)
    const pan = put(rail, panel(e, 1.1, 0.3, 0.032, 0.06, [[0.42, 0.16, -0.25, -0.02], [0.42, 0.16, 0.25, -0.02]]), m.bedRail)
    pan.rotation.y = PI / 2
    for (const z of [-0.36, 0.36]) k.box(rail, 0.022, 0.22, 0.04, m.bedFrame, -s * 0.01, -0.2, z)
    k.box(rail, 0.006, 0.05, 0.12, m.darkPlastic, s * 0.017, 0.08, 0.38, false)
    pan.userData.front = true
    bake(rail, pan)
  }
  // Head board, with its hand hold; foot board with the controls and a chart in its holder.
  const hb = put(p, panel(e, 0.78, 0.34, 0.035, 0.06, [[0.46, 0.06, 0, 0.09]]), m.greyPlastic, 0, deck + 0.13, -1.02)
  hb.castShadow = true
  put(p, panel(e, 0.78, 0.3, 0.04, 0.06, [[0.46, 0.06, 0, 0.08]]), m.greyPlastic, 0, deck + 0.1, 1.02)
  k.box(p, 0.26, 0.08, 0.006, m.darkPlastic, 0, deck + 0.0, 1.043, false)
  k.box(p, 0.17, 0.23, 0.01, m.darkPlastic, -0.24, deck + 0.13, 1.048)
  k.box(p, 0.15, 0.2, 0.003, m.paper, -0.24, deck + 0.122, 1.055, false)
  // The IV pole at the head corner: folded down, or up with a bag.
  if (o.iv) {
    k.cyl(p, 0.012, 0.012, 1.3, m.stainless, 0.36, deck + 0.6, -0.98, 10)
    for (const a of [0, PI]) put(p, bentTube(e, 'ivhook', [[0, 0, 0], [0.07, 0.01, 0], [0.08, 0.05, 0]], 0.004, 0.02), m.stainless, 0.36, deck + 1.25, -0.98).rotation.y = a
    infusionBag(e, p, 0.43, deck + 1.13, -0.98)
  } else k.cyl(p, 0.012, 0.012, 0.5, m.stainless, 0.36, deck - 0.2, -0.98, 10)
}

/** A 1 L bag of saline on its hook (y the bag's middle): the PVC bag, its print, the ports, the giving set's drip chamber, line and roller clamp. */
export function infusionBag(e: Ctx, p: Object3D, x: number, y: number, z: number, line = 0.9) {
  ivBag(e, p, x, y + 0.16, z, line)
}

/* ---------- lockers, tables, chairs ---------- */

/** Contents for a drawer: rows of packs and boxes, seeded, in the given colours. */
export function packs(e: Ctx, mats: Material[], size: [number, number, number]) {
  return (p: Group, iw: number, id: number, ih: number) => {
    const [pw, ph, pd] = size
    const h = Math.min(ph, ih - 0.01)
    for (let x = -iw / 2 + pw / 2 + 0.005; x < iw / 2 - pw / 2; x += pw + 0.008)
      for (let z = -pd / 2 - 0.01; z > -id + pd / 2; z -= pd + 0.008) {
        if (e.r() < 0.12) continue
        e.k.box(p, pw, h * (0.75 + e.r() * 0.25), pd, mats[(e.r() * mats.length) | 0], x, (h * 0.85) / 2, z, false)
      }
  }
}

/**
 * A hospital bedside locker, 0.48 × 0.88 × 0.45 on castors: a moulded top with a raised lip, two
 * drawers (operated) and a cupboard under them (operated), the towel rail on its side.
 */
export function locker(e: Ctx, p: Object3D) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.19, sz * 0.17, 0.035)
  const c = group(p, 0, 0.08, 0.225)
  carcass(e, c, 0.48, 0.8, 0.45, m.hpl, [0.36], 0)
  k.soft(c, 0.5, 0.03, 0.47, 0.012, m.whitePlastic, 0, 0.815, -0.225)
  for (const s of [-1, 1]) k.box(c, 0.012, 0.025, 0.45, m.whitePlastic, s * 0.24, 0.84, -0.225)
  k.box(c, 0.46, 0.012, 0.42, m.melamine, 0, 0.53, -0.22)
  const fill = packs(e, [m.blue, m.whitePlastic, m.paper], [0.1, 0.05, 0.12])
  drawer(e, c, 0, 0.71, 0, { w: 0.46, h: 0.15, d: 0.42, front: m.hpl, handle: 'grip', label: 'Locker Drawer', fill })
  drawer(e, c, 0, 0.56, 0, { w: 0.46, h: 0.15, d: 0.42, front: m.hpl, handle: 'grip', label: 'Locker Drawer', fill: packs(e, [m.sheet, m.blanket], [0.2, 0.06, 0.3]) })
  k.soft(c, 0.3, 0.12, 0.25, 0.04, m.blue, 0.02, 0.43, -0.2)
  cupboardDoor(e, c, -0.23, 0.24, 0, { w: 0.46, h: 0.46, hinge: 'left', face: m.hpl, label: 'Locker' })
  put(c, bentTube(e, 'towel', [[0, 0.7, -0.05], [0.05, 0.7, -0.05], [0.05, 0.7, -0.4], [0, 0.7, -0.4]], 0.006, 0.02), m.stainless, 0.24, 0, 0)
}

/** An overbed table: an H base on castors, the gas-lift column at one side, a laminate top with a lip, reaching `reach` over the bed. */
export function overbedTable(e: Ctx, p: Object3D, height = 0.92) {
  const { k, m } = e
  for (const z of [-0.2, 0.2]) {
    put(p, bentTube(e, 'obtBase', [[-0.32, 0.06, 0], [0.32, 0.06, 0]], 0.018), m.powder, 0, 0, z)
    for (const x of [-0.3, 0.3]) castor(e, p, x, z, 0.03, e.r())
  }
  put(p, bentTube(e, 'obtSpine', [[0, 0.06, -0.2], [0, 0.06, 0.2]], 0.02), m.powder, 0.3, 0, 0)
  k.soft(p, 0.07, height - 0.2, 0.05, 0.015, m.whitePlastic, 0.3, 0.06 + (height - 0.2) / 2, 0)
  k.soft(p, 0.055, 0.22, 0.04, 0.012, m.aluminium, 0.3, height - 0.13, 0)
  k.box(p, 0.08, 0.04, 0.32, m.whitePlastic, 0.3, height - 0.05, 0)
  put(p, panel(e, 0.84, 0.4, 0.024, 0.03), m.laminate, -0.12, height - 0.012, 0).rotation.x = -PI / 2
  put(p, panel(e, 0.86, 0.42, 0.012, 0.035, [[0.82, 0.38, 0, 0]]), m.whitePlastic, -0.12, height + 0.006, 0).rotation.x = -PI / 2
}

/* ---------- materials and shapes for seating ---------- */

const fmCache = new WeakMap<object, ReturnType<typeof makeFurnMats>>()

/** Grain for upholstery vinyl: a fine pebble with faint creasing, tinted per colour. */
const pebble = (base: string, seed: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  let s = seed
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < (w * h) / 6; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)'
    g.fillRect(r() * w, r() * h, 1 + r(), 1 + r())
  }
}

/** A woven upholstery fabric: warp and weft in two close tones, a slight heather. */
const weave = (a: string, b: string, seed: number) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = a
  g.fillRect(0, 0, w, h)
  let s = seed
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let y = 0; y < h; y += 2) {
    g.fillStyle = b
    g.globalAlpha = 0.12 + r() * 0.08
    g.fillRect(0, y, w, 1)
  }
  for (let x = 0; x < w; x += 2) {
    g.globalAlpha = 0.06 + r() * 0.06
    g.fillStyle = r() < 0.5 ? '#ffffff' : '#000000'
    g.fillRect(x, 0, 1, h)
  }
  g.globalAlpha = 1
}

/** Perforated steel: round holes on a 60° pitch, as an alpha map (white solid, black open). */
const perforation = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#000000'
  const p = w / 8
  for (let j = 0; j < 9; j++)
    for (let i = -1; i < 9; i++) {
      g.beginPath()
      g.arc(i * p + (j % 2 ? p / 2 : 0), j * p * 0.866 * (h / w) * (w / h), p * 0.28, 0, Math.PI * 2)
      g.fill()
    }
}

/** Mesh-back fabric: an open weave, as an alpha map. */
const meshWeave = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#000000'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#ffffff'
  for (let i = 0; i < w; i += 4) g.fillRect(i, 0, 2, h)
  for (let j = 0; j < h; j += 4) g.fillRect(0, j, w, 2)
}

function makeFurnMats(e: Ctx) {
  const t = (w: number, h: number, paint: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat = 1) => {
    const tex = e.k.tex.painted(w, h, paint)
    tex.repeat.set(repeat, repeat)
    return tex
  }
  const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.6, ...p })
  const perf = t(64, 64, perforation, 10)
  const mesh = t(32, 32, meshWeave, 40)
  return {
    /** Upholstery vinyls (healthcare grade, wipe-clean): navy, slate teal, charcoal, warm grey. */
    vinylNavy: std({ map: t(256, 256, pebble('#2f4258', 11), 3), roughness: 0.55 }),
    vinylTeal: std({ map: t(256, 256, pebble('#3e5f63', 12), 3), roughness: 0.55 }),
    vinylCharcoal: std({ map: t(256, 256, pebble('#34373b', 13), 3), roughness: 0.58 }),
    vinylTaupe: std({ map: t(256, 256, pebble('#7a6e63', 14), 3), roughness: 0.55 }),
    /** Woven fabrics for staff and lounge seating. */
    fabricGrey: std({ map: t(128, 128, weave('#4d5257', '#3a3e42', 15), 20), roughness: 0.95 }),
    fabricBlue: std({ map: t(128, 128, weave('#3c5574', '#2d4158', 16), 20), roughness: 0.95 }),
    /** Mesh back: an open black weave on its frame. */
    meshBack: std({ color: '#1d1e20', alphaMap: mesh, alphaTest: 0.45, side: DoubleSide, roughness: 0.8 }),
    /** Powder coats: silver grey, black, white; satin chrome; black nylon; rubber. */
    powderSilver: std({ color: '#a6aaae', metalness: 0.55, roughness: 0.42 }),
    powderBlack: std({ color: '#26272a', metalness: 0.3, roughness: 0.5 }),
    powderWhite: std({ color: '#e7e8e6', metalness: 0.15, roughness: 0.45 }),
    satinChrome: std({ color: '#c8ccd0', metalness: 0.95, roughness: 0.22 }),
    nylon: std({ color: '#202124', roughness: 0.55 }),
    rubber: std({ color: '#151516', roughness: 0.9 }),
    /** Cast aluminium arms, polished grey. */
    castAlu: std({ color: '#b6babd', metalness: 0.8, roughness: 0.32 }),
    /** Perforated steel shells, powder-coated silver. */
    perforated: std({ color: '#9fa4a8', metalness: 0.6, roughness: 0.4, alphaMap: perf, alphaTest: 0.5, side: DoubleSide }),
    /** One-piece polypropylene shells. */
    ppGrey: std({ color: '#5b6066', roughness: 0.5 }),
    ppBlue: std({ color: '#35577e', roughness: 0.48 }),
    /** PU armrest pads. */
    pu: std({ color: '#1c1d1f', roughness: 0.62 }),
    /** PVC edge banding: matched to the oak laminate, and to white boards. */
    edgeOak: std({ color: '#a8835d', roughness: 0.45 }),
    edgeWhite: std({ color: '#d9d9d5', roughness: 0.4 }),
    /** Slots and recesses in pressed steel. */
    slot: std({ color: '#3b3e42', roughness: 0.7 }),
  }
}

/** The shared seating finishes, made once per model. */
export function furnMats(e: Ctx) {
  let f = fmCache.get(e.m)
  if (!f) fmCache.set(e.m, (f = makeFurnMats(e)))
  return f
}

/**
 * A formed shell (a chair's seat-and-back in one, a sheet-steel seat), from its side profile:
 * the centre line through `pts` ([z, y] pairs, front to back), `t` thick, `w` wide across x,
 * smoothed through its bends, edges eased. Its front faces +z.
 */
export function shell(e: Ctx, key: string, pts: [number, number][], t: number, w: number, bevel = 0.003) {
  return geo(e, `shell${key}|${t}|${w}`, () => {
    const curve = new CatmullRomCurve3(pts.map(([z, y]) => new Vector3(-z, y, 0)), false, 'centripetal')
    const c = curve.getSpacedPoints(36)
    const out: Vector2[] = []
    const inn: Vector2[] = []
    for (let i = 0; i < c.length; i++) {
      const a = c[Math.max(0, i - 1)]
      const b = c[Math.min(c.length - 1, i + 1)]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const l = Math.hypot(dx, dy) || 1
      const nx = -dy / l
      const ny = dx / l
      out.push(new Vector2(c[i].x + (nx * t) / 2, c[i].y + (ny * t) / 2))
      inn.push(new Vector2(c[i].x - (nx * t) / 2, c[i].y - (ny * t) / 2))
    }
    const s = new Shape([...out, ...inn.reverse()])
    const g = new ExtrudeGeometry(s, { depth: Math.max(0.002, w - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: Math.min(bevel, t / 3), bevelSegments: 2, curveSegments: 4 })
    g.rotateY(PI / 2)
    g.translate(-(w - 2 * bevel) / 2, 0, 0)
    g.computeVertexNormals()
    return g
  })
}

/**
 * An upholstered cushion: a rounded pad w × h × d with piping welted round its top (and bottom)
 * edge, as a seat or back cushion is sewn; centred at (x, y, z) in `p`.
 */
export function cushion(e: Ctx, p: Object3D, w: number, h: number, d: number, mat: Material, x: number, y: number, z: number, opts: { welt?: 'top' | 'both' | 'none'; r?: number } = {}) {
  const r = opts.r ?? Math.min(0.03, h * 0.45)
  const pad = e.k.soft(p, w, h, d, r, mat, x, y, z)
  const welt = opts.welt ?? 'top'
  if (welt !== 'none') {
    const ring = (yy: number) => {
      const rr = Math.min(0.04, w / 4, d / 4)
      const pts: [number, number, number][] = []
      const hw = w / 2 - 0.004
      const hd = d / 2 - 0.004
      const corner = (cx: number, cz: number, a0: number) => {
        for (let i = 0; i <= 4; i++) {
          const a = a0 + (i / 4) * (PI / 2)
          pts.push([cx + Math.cos(a) * rr, 0, cz + Math.sin(a) * rr])
        }
      }
      corner(hw - rr, hd - rr, 0)
      corner(-hw + rr, hd - rr, PI / 2)
      corner(-hw + rr, -hd + rr, PI)
      corner(hw - rr, -hd + rr, PI * 1.5)
      put(p, tube(e, `welt${w.toFixed(3)}|${d.toFixed(3)}`, pts, 0.0035, true, 0), mat, x, yy, z, false)
    }
    ring(y + h / 2 - r * 0.55)
    if (welt === 'both') ring(y - h / 2 + r * 0.55)
  }
  return pad
}

/** A screw-in floor glide or leveller under a leg end at (x, z). */
function glide(e: Ctx, p: Object3D, x: number, z: number, r = 0.014) {
  e.k.cyl(p, r, r * 1.1, 0.012, furnMats(e).nylon, x, 0.006, z, 14).castShadow = false
}

/* ---------- chairs ---------- */

/**
 * A visitor's armchair on a sled base, as in a bay or a waiting corner: a bent steel tube sled
 * each side carrying the armrest, black PU arm caps, a cushioned seat on its black under-shell
 * and a cushioned back, both in healthcare vinyl with welted edges.
 */
export function visitorChair(e: Ctx, p: Object3D, upholstery?: Material) {
  const { k } = e
  const f = furnMats(e)
  const vinyl = upholstery ?? f.vinylNavy
  for (const s of [-1, 1]) {
    put(p, bentTube(e, 'sled2', [[0, 0.012, 0.25], [0, 0.012, -0.22], [0, 0.4, -0.26], [0, 0.645, -0.24], [0, 0.645, 0.15], [0, 0.4, 0.23], [0, 0.012, 0.25]], 0.0125, 0.07), f.powderSilver, s * 0.275, 0, 0)
    k.soft(p, 0.055, 0.028, 0.34, 0.012, f.pu, s * 0.275, 0.66, -0.04)
    for (const z of [-0.2, 0.22]) glide(e, p, s * 0.275, z, 0.012)
  }
  // Seat: under-shell, then the cushion; cross rails under it.
  k.soft(p, 0.5, 0.025, 0.46, 0.01, f.nylon, 0, 0.415, 0.01)
  cushion(e, p, 0.5, 0.075, 0.47, vinyl, 0, 0.465, 0.015)
  for (const z of [-0.18, 0.18]) rod(e, p, 0.009, 0.54, f.powderSilver, 0, 0.395, z, 'x', 10)
  const back = group(p, 0, 0.78, -0.235)
  back.rotation.x = -0.13
  k.soft(back, 0.48, 0.42, 0.02, 0.008, f.nylon, 0, 0, -0.035)
  cushion(e, back, 0.48, 0.42, 0.07, vinyl, 0, 0, 0, { welt: 'none', r: 0.03 })
  for (const s of [-1, 1]) put(p, bentTube(e, 'backPost', [[0, 0.43, -0.2], [0, 0.6, -0.25], [0, 0.82, -0.29]], 0.01, 0.05), f.powderSilver, s * 0.2, 0, 0)
}

/**
 * An ergonomic task chair, as at every workstation: a five-star base in black nylon on twin-wheel
 * castors, the gas lift in its telescoping cover, the synchro mechanism with its paddles, a
 * contoured fabric seat on its shell, height-adjustable T-arms with PU pads, and a framed mesh
 * back with its lumbar band on the spine.
 */
export function taskChair(e: Ctx, p: Object3D, fabric?: Material) {
  const { k } = e
  const f = furnMats(e)
  const seat = fabric ?? f.fabricGrey
  chairBase(e, p, 0.32)
  put(p, lathe(e, 'gasCover2', [[0.032, 0.11], [0.034, 0.12], [0.034, 0.26], [0.028, 0.27], [0.026, 0.38], [0, 0.38]], 20), f.nylon)
  put(p, lathe(e, 'gasRod2', [[0, 0.37], [0.014, 0.37], [0.014, 0.42], [0, 0.42]], 12), f.satinChrome)
  // Mechanism: the cast body, the height paddle and the tilt-lock lever.
  k.soft(p, 0.24, 0.055, 0.26, 0.012, f.powderBlack, 0, 0.44, 0.0)
  k.soft(p, 0.09, 0.012, 0.03, 0.006, f.nylon, 0.15, 0.435, 0.06)
  k.soft(p, 0.012, 0.012, 0.09, 0.006, f.nylon, -0.15, 0.44, -0.02)
  // Seat: a moulded under-shell and the contoured cushion, its waterfall front.
  k.soft(p, 0.47, 0.03, 0.45, 0.012, f.nylon, 0, 0.475, 0.02)
  cushion(e, p, 0.49, 0.07, 0.47, seat, 0, 0.52, 0.025, { welt: 'none', r: 0.03 })
  // The spine from the mechanism up behind the seat, the back frame and its mesh.
  put(p, bentTube(e, 'spine2', [[0, 0.45, -0.1], [0, 0.47, -0.25], [0, 0.66, -0.29], [0, 0.78, -0.3]], 0.02, 0.07), f.powderBlack)
  const back = group(p, 0, 0.98, -0.31)
  back.rotation.x = -0.12
  put(back, panel(e, 0.46, 0.56, 0.028, 0.11, [[0.4, 0.5, 0, 0, 0.09]]), f.nylon)
  const m = new Mesh(geo(e, 'meshBack2', () => new PlaneGeometry(0.41, 0.51)), f.meshBack)
  back.add(m)
  k.soft(back, 0.38, 0.07, 0.02, 0.01, f.nylon, 0, -0.14, 0.012)
  // T-arms: column from under the seat, the adjuster button, the PU pad.
  for (const s of [-1, 1]) {
    put(p, bentTube(e, 'tarm', [[0, 0.47, -0.02], [0.03, 0.5, -0.02], [0.03, 0.66, -0.02]], 0.014, 0.03), f.powderBlack, s * 0.21, 0, 0)
    k.soft(p, 0.07, 0.025, 0.24, 0.01, f.pu, s * 0.245, 0.68, 0.0)
    k.box(p, 0.012, 0.02, 0.03, f.nylon, s * 0.262, 0.6, -0.02, false)
  }
}

/** A five-star chair base in black nylon, tapered legs, twin-wheel castors, the hub; legs reach `radius`. */
export function chairBase(e: Ctx, p: Object3D, radius: number, mat?: Material) {
  const f = furnMats(e)
  const legMat = mat ?? f.nylon
  const leg = geo(e, `chairLeg${radius}`, () => {
    const s = new Shape()
    s.moveTo(0, 0.045)
    s.lineTo(radius - 0.035, 0.03)
    s.quadraticCurveTo(radius, 0.03, radius, 0.0)
    s.lineTo(radius - 0.03, -0.004)
    s.lineTo(0.05, 0.0)
    s.lineTo(0, 0.0)
    s.closePath()
    const g = new ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2 })
    g.translate(0, 0, -0.02)
    return g
  })
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * PI * 2
    const g = group(p, 0, 0.075, 0, a)
    put(g, leg, legMat).rotation.y = -PI / 2
    castor(e, p, Math.sin(a) * (radius - 0.02), Math.cos(a) * (radius - 0.02), 0.026, a + 0.6 * Math.sin(i * 3))
  }
  put(p, lathe(e, `chairHub${radius}`, [[0, 0.07], [0.055, 0.07], [0.05, 0.13], [0.034, 0.135], [0, 0.135]], 24), legMat)
}

/**
 * A consulting-room chair with arms: a four-leg frame in powder-coated steel tube, each side a
 * loop from the front leg up into the armrest and down the back leg, PP arm caps, a cushioned
 * seat and a shaped back on two posts, both upholstered and welted.
 */
export function armChair(e: Ctx, p: Object3D, upholstery?: Material, frame?: Material) {
  const { k } = e
  const f = furnMats(e)
  const vinyl = upholstery ?? f.vinylTeal
  const fr = frame ?? f.powderBlack
  for (const s of [-1, 1]) {
    put(p, bentTube(e, 'armLoop', [[0, 0.0, 0.22], [0, 0.635, 0.2], [0, 0.645, -0.17], [0, 0.0, -0.23]], 0.0125, 0.05), fr, s * 0.26, 0, 0)
    k.soft(p, 0.05, 0.026, 0.3, 0.01, f.pu, s * 0.26, 0.658, 0.02)
    glide(e, p, s * 0.26, 0.22)
    glide(e, p, s * 0.26, -0.23)
  }
  for (const z of [-0.17, 0.17]) rod(e, p, 0.009, 0.52, fr, 0, 0.4, z, 'x', 10)
  k.soft(p, 0.48, 0.022, 0.44, 0.008, f.nylon, 0, 0.42, 0.01)
  cushion(e, p, 0.49, 0.07, 0.46, vinyl, 0, 0.466, 0.015)
  const back = group(p, 0, 0.8, -0.215)
  back.rotation.x = -0.1
  put(back, shell(e, 'armChairBack', [[0.0, -0.2], [-0.02, 0.0], [0.0, 0.2]], 0.06, 0.47, 0.012), vinyl)
  for (const s of [-1, 1]) put(p, bentTube(e, 'armChairPost', [[0, 0.41, -0.19], [0, 0.6, -0.22], [0, 0.72, -0.235]], 0.01, 0.05), fr, s * 0.2, 0, 0)
}

/** A bariatric (wide) chair, 0.75 m between the arms, rated to 300 kg: heavier frame, wider cushions. */
export function bariatricChair(e: Ctx, p: Object3D, upholstery?: Material) {
  const { k } = e
  const f = furnMats(e)
  const vinyl = upholstery ?? f.vinylNavy
  for (const s of [-1, 1]) {
    put(p, bentTube(e, 'bariLoop', [[0, 0.0, 0.25], [0, 0.64, 0.23], [0, 0.65, -0.2], [0, 0.0, -0.26]], 0.016, 0.06), f.powderSilver, s * 0.4, 0, 0)
    k.soft(p, 0.07, 0.03, 0.34, 0.012, f.pu, s * 0.4, 0.665, 0.02)
    glide(e, p, s * 0.4, 0.25, 0.018)
    glide(e, p, s * 0.4, -0.26, 0.018)
  }
  for (const z of [-0.2, 0.2]) rod(e, p, 0.012, 0.8, f.powderSilver, 0, 0.39, z, 'x', 10)
  k.soft(p, 0.76, 0.025, 0.48, 0.01, f.nylon, 0, 0.415, 0.01)
  cushion(e, p, 0.76, 0.08, 0.5, vinyl, 0, 0.465, 0.02)
  const back = group(p, 0, 0.8, -0.245)
  back.rotation.x = -0.1
  cushion(e, back, 0.74, 0.44, 0.08, vinyl, 0, 0, 0, { welt: 'none' })
}

/**
 * A round medical stool on five chrome legs and castors, with the ring footrest, a gas lift under
 * its release ring, and a thick upholstered seat with a welted edge; or (`saddle`) a saddle seat.
 */
export function roundStool(e: Ctx, p: Object3D, opts: { saddle?: boolean; ring?: boolean; vinyl?: Material; height?: number } = {}) {
  const { k } = e
  const f = furnMats(e)
  const H = opts.height ?? 0.55
  chairBase(e, p, 0.27, f.satinChrome)
  put(p, lathe(e, `stoolLift${H}`, [[0.03, 0.12], [0.03, H - 0.16], [0.018, H - 0.15], [0.018, H - 0.06], [0, H - 0.06]], 18), f.satinChrome)
  if (opts.ring ?? true) {
    const ring = put(p, geo(e, 'footRing', () => new TorusGeometry(0.2, 0.011, 8, 32)), f.satinChrome, 0, Math.min(0.3, H - 0.25), 0)
    ring.rotation.x = PI / 2
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * PI * 2
      rod(e, group(p, 0, Math.min(0.3, H - 0.25), 0, a), 0.006, 0.17, f.satinChrome, 0.1, 0, 0, 'x', 6)
    }
  }
  k.soft(p, 0.16, 0.02, 0.16, 0.008, f.powderBlack, 0, H - 0.07, 0)
  const vinyl = opts.vinyl ?? f.vinylCharcoal
  if (opts.saddle) {
    put(p, shell(e, 'saddle', [[0.18, -0.01], [0.06, -0.03], [-0.06, -0.03], [-0.18, 0.01]], 0.07, 0.42, 0.02), vinyl, 0, H, 0)
  } else {
    put(p, lathe(e, 'stoolSeat', [[0, -0.035], [0.17, -0.035], [0.188, -0.025], [0.192, 0.0], [0.188, 0.025], [0.175, 0.036], [0, 0.04]], 32), vinyl, 0, H - 0.01, 0)
    put(p, geo(e, 'stoolWelt', () => new TorusGeometry(0.184, 0.0045, 6, 40)), vinyl, 0, H + 0.018, 0).rotation.x = PI / 2
  }
}

/**
 * A two- or three-seat staff-room sofa: a box frame on short square legs, a wipe-clean vinyl or
 * fabric cover, separate seat and back cushions with welted edges, rolled arms. Front +z.
 */
export function sofa(e: Ctx, p: Object3D, seats = 2, cover?: Material) {
  const { k } = e
  const f = furnMats(e)
  const mat = cover ?? f.vinylTaupe
  const cw = 0.58
  const W = seats * cw + 0.3
  for (const x of [-W / 2 + 0.06, W / 2 - 0.06]) for (const z of [-0.33, 0.33]) k.box(p, 0.04, 0.12, 0.04, f.powderBlack, x, 0.06, z)
  k.soft(p, W, 0.2, 0.8, 0.03, mat, 0, 0.22, 0)
  for (const s of [-1, 1]) cushion(e, p, 0.15, 0.4, 0.82, mat, s * (W / 2 - 0.075), 0.5, 0, { welt: 'both', r: 0.05 })
  k.soft(p, W - 0.3, 0.42, 0.18, 0.04, mat, 0, 0.6, -0.31)
  for (let i = 0; i < seats; i++) {
    const x = -W / 2 + 0.15 + cw * (i + 0.5)
    cushion(e, p, cw - 0.01, 0.13, 0.6, mat, x, 0.385, 0.08, { welt: 'both' })
    const b = group(p, x, 0.66, -0.2)
    b.rotation.x = -0.18
    cushion(e, b, cw - 0.02, 0.42, 0.14, mat, 0, 0, 0, { welt: 'both', r: 0.05 })
  }
}

/** A lab or counter-height stool: polypropylene seat on a chrome base with a footring, at `height`. */
export function labStool(e: Ctx, p: Object3D, height = 0.68) {
  const f = furnMats(e)
  roundStool(e, p, { ring: true, height, vinyl: f.ppGrey })
}

/** A manual wheelchair, facing local +z: tube frame, spoked 24″ wheels with push rims, castors, sling seat and back, footplates. */
export function wheelchair(e: Ctx, p: Object3D) {
  const { k, m } = e
  const f = furnMats(e)
  const tyre = lathe(e, 'wcTyre', [[0.27, -0.016], [0.29, -0.018], [0.3, -0.01], [0.3, 0.01], [0.29, 0.018], [0.27, 0.016]], 32)
  const rim = lathe(e, 'wcRim', [[0.255, -0.012], [0.272, -0.012], [0.272, 0.012], [0.255, 0.012]], 32)
  const push = geo(e, 'wcPush', () => new TorusGeometry(0.26, 0.009, 8, 40))
  for (const s of [-1, 1]) {
    const w = group(p, s * 0.31, 0.3, -0.12)
    w.rotation.z = PI / 2
    put(w, tyre, f.rubber)
    put(w, rim, f.satinChrome, 0, 0, 0, false)
    const pr = put(w, push, f.satinChrome, 0, s * 0.035, 0, false)
    pr.rotation.x = PI / 2
    // Push-rim stand-offs, and the spokes crossing in pairs.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2
      k.cyl(w, 0.005, 0.005, 0.035, f.satinChrome, Math.cos(a) * 0.26, s * 0.018, Math.sin(a) * 0.26, 6).castShadow = false
    }
    for (let i = 0; i < 18; i++) rod(e, group(w, 0, s * (i % 2 ? 0.008 : -0.008), 0, (i / 18) * PI), 0.0012, 0.51, f.satinChrome, 0, 0, 0, 'z', 4).castShadow = false
    put(w, lathe(e, 'wcHub', [[0, -0.035], [0.022, -0.035], [0.03, -0.02], [0.03, 0.02], [0.022, 0.035], [0, 0.035]], 16), m.aluminium)
    // Front castor in its fork under the down tube.
    castor(e, p, s * 0.22, 0.3, 0.07, 0.15 * s)
    // Side frame: down tube to the castor, seat rail, back post with its push handle and grip.
    put(p, bentTube(e, 'wcSide2', [[0, 0.17, 0.3], [0, 0.5, 0.25], [0, 0.5, -0.17], [0, 0.96, -0.25]], 0.0125, 0.05), f.satinChrome, s * 0.23, 0, 0)
    put(p, bentTube(e, 'wcLower', [[0, 0.17, 0.3], [0, 0.2, -0.12], [0, 0.32, -0.2]], 0.011, 0.05), f.satinChrome, s * 0.23, 0, 0)
    const grip = k.cyl(p, 0.017, 0.017, 0.12, f.rubber, s * 0.23, 0.95, -0.33, 14)
    grip.rotation.x = PI / 2 - 0.45
    // Armrest on its two posts, its PU pad; the brake lever by the tyre.
    put(p, bentTube(e, 'wcArm2', [[0, 0.5, -0.12], [0, 0.72, -0.12], [0, 0.72, 0.16], [0, 0.5, 0.2]], 0.01, 0.04), f.satinChrome, s * 0.265, 0, 0)
    k.soft(p, 0.055, 0.03, 0.27, 0.012, f.pu, s * 0.265, 0.735, 0.02)
    put(p, bentTube(e, 'wcBrake', [[0, 0.42, 0.06], [0, 0.5, 0.12], [0, 0.58, 0.1]], 0.006, 0.02), f.powderBlack, s * 0.27, 0, 0)
    k.soft(p, 0.02, 0.05, 0.025, 0.008, f.rubber, s * 0.27, 0.6, 0.1)
    // Swing-away footrest: hanger, the flip-up plate in its hinge, the heel strap.
    put(p, bentTube(e, 'wcFoot2', [[0, 0.5, 0.25], [0, 0.17, 0.42]], 0.011), f.satinChrome, s * 0.16, 0, 0)
    k.soft(p, 0.15, 0.014, 0.14, 0.006, f.nylon, s * 0.11, 0.155, 0.45)
    k.box(p, 0.13, 0.04, 0.006, f.nylon, s * 0.11, 0.18, 0.39, false)
  }
  // The folding cross-brace under the seat.
  for (const s of [-1, 1]) {
    const brace = rod(e, p, 0.01, 0.55, f.satinChrome, 0, 0.34, -0.02, 'x', 8)
    brace.rotation.set(0, 0, PI / 2 + s * 0.38)
  }
  // Sling seat and back in black nylon, sagging a little between the rails.
  put(p, shell(e, 'wcSeat', [[0.22, 0.5], [0.0, 0.485], [-0.18, 0.5]], 0.008, 0.46, 0.002), f.nylon)
  put(p, shell(e, 'wcBack', [[-0.18, 0.52], [-0.205, 0.72], [-0.24, 0.92]], 0.008, 0.46, 0.002), f.nylon)
  rod(e, p, 0.009, 0.46, f.satinChrome, 0, 0.21, -0.12, 'x', 8)
}


/* ---------- counters, pedestals, cupboards ---------- */

/** Contents of a nurse's or clerk's desk drawers, by depth: stationery, forms and gloves, files. */
function deskFill(e: Ctx, depth: number) {
  const { m } = e
  if (depth < 0.15) return (p: Group, iw: number, id: number) => {
    e.k.box(p, iw * 0.45, 0.02, id * 0.6, m.greyPlastic, -iw * 0.22, 0.01, -id * 0.35, false)
    for (let i = 0; i < 6; i++) rod(e, p, 0.004, 0.14, [m.blue, m.black, m.red][i % 3], -iw * 0.38 + i * 0.02, 0.026, -id * 0.35, 'z', 6)
    e.k.box(p, 0.08, 0.012, 0.08, m.vacuum, iw * 0.2, 0.006, -id * 0.3, false)
    e.k.box(p, 0.04, 0.035, 0.12, m.darkPlastic, iw * 0.3, 0.018, -id * 0.6, false)
  }
  if (depth < 0.25) return packs(e, [m.paper, m.blue, m.purple, m.whitePlastic], [0.12, 0.08, 0.24])
  return (p: Group, iw: number, id: number, ih: number) => {
    for (let z = -0.03; z > -id + 0.03; z -= 0.035 + e.r() * 0.02) e.k.box(p, iw - 0.03, ih * (0.7 + e.r() * 0.2), 0.012, [m.paper, m.blue, m.vacuum, m.green][(e.r() * 4) | 0], 0, (ih * 0.75) / 2, z, false)
  }
}

/** A drawer pedestal, 0.42 × 0.7 × 0.58: a pencil drawer, a box drawer and a file drawer (all operated). */
export function pedestal(e: Ctx, p: Object3D, label = 'Desk Drawer') {
  const { m } = e
  carcass(e, p, 0.42, 0.7, 0.58, m.hpl, [], 0.06)
  for (const [y, h] of [[0.625, 0.13], [0.47, 0.17], [0.235, 0.29]] as const) drawer(e, p, 0, y, 0, { w: 0.4, h, d: 0.55, front: m.hpl, handle: 'bar', label, fill: deskFill(e, h) })
}

/**
 * A counter as in the reference: a high white solid-surface front with a transaction ledge, the
 * 0.75 m work surface behind it, drawer pedestals under it at `pedestals` (operated), closed ends;
 * `len` along local x, the public side towards +z, staff at −z. With `low`, a length of the ledge
 * drops to 0.8 m for wheelchair users.
 */
export function counter(e: Ctx, p: Object3D, len: number, pedestals: number[], low?: [number, number]) {
  const { k, m } = e
  const ledge = (x0: number, x1: number, y: number) => {
    k.soft(p, x1 - x0, 0.04, 0.34, 0.015, m.solidSurface, (x0 + x1) / 2, y, 0.6)
    k.box(p, x1 - x0, y - 0.13, 0.05, m.solidSurface, (x0 + x1) / 2, 0.13 + (y - 0.13) / 2 - 0.02, 0.745)
  }
  if (low) {
    ledge(-len / 2, low[0], 1.1)
    k.box(p, low[1] - low[0], 0.63, 0.05, m.solidSurface, (low[0] + low[1]) / 2, 0.445, 0.745)
    k.soft(p, low[1] - low[0], 0.04, 0.4, 0.015, m.solidSurface, (low[0] + low[1]) / 2, 0.8, 0.6)
    ledge(low[1], len / 2, 1.1)
  } else ledge(-len / 2, len / 2, 1.1)
  k.box(p, len, 0.1, 0.03, m.skirting, 0, 0.05, 0.71)
  k.box(p, len, 0.006, 0.004, m.reveal, 0, 0.42, 0.771, false)
  // Under the ledge, a lit reveal along the front's top, as in the reference.
  k.box(p, len - 0.1, 0.008, 0.01, m.ledLine, 0, 1.065, 0.77, false)
  k.box(p, len - 0.04, 0.33, 0.03, m.hpl, 0, 0.93, 0.43)
  k.soft(p, len - 0.04, 0.03, 0.68, 0.01, m.solidSurface, 0, 0.75, 0.08)
  for (const s of [-1, 1]) k.soft(p, 0.06, 1.1, 0.92, 0.02, m.solidSurface, s * (len / 2 - 0.03), 0.55, 0.32)
  // Cable grommets in the work surface, a modesty panel between the pedestals.
  for (const x of pedestals) put(p, lathe(e, 'grommet', [[0.025, 0], [0.035, 0], [0.035, 0.006], [0.025, 0.006]], 16), m.darkPlastic, x + 0.4, 0.765, 0.3, false)
  k.box(p, len - 0.2, 0.5, 0.018, m.hpl, 0, 0.45, 0.38)
  for (const x of pedestals) pedestal(e, group(p, x, 0, -0.24, PI))
}

/** Ring binders and box files standing on a shelf, `w` along it, their spines facing +z. */
export function binders(e: Ctx, p: Object3D, w: number, y: number, z: number, d = 0.28) {
  const { k, m } = e
  const cols = [m.blue, m.red, m.greyPlastic, m.green, m.vacuum, m.whitePlastic]
  for (let x = -w / 2 + 0.03; x < w / 2 - 0.04; ) {
    const t = 0.05 + e.r() * 0.03
    const h = 0.29 + e.r() * 0.03
    k.box(p, t, h, d, cols[(e.r() * cols.length) | 0], x + t / 2, y + h / 2, z - d / 2)
    k.box(p, t * 0.5, 0.06, 0.003, m.paper, x + t / 2, y + h * 0.6, z + 0.0015, false)
    x += t + 0.004
  }
}

/** A run of base cupboards, `len` long and 0.72 high: pairs of doors (operated), a shelf inside with binders, a solid-surface top. */
export function credenza(e: Ctx, p: Object3D, len: number) {
  const { m } = e
  const n = Math.round(len / 1.2)
  const uw = len / n
  for (let i = 0; i < n; i++) {
    const u = group(p, -len / 2 + uw * (i + 0.5), 0, 0)
    carcass(e, u, uw, 0.78, 0.5, m.hpl, [0.42], 0.08, m.solidSurface)
    binders(e, u, uw - 0.06, 0.098, -0.04, 0.3)
    binders(e, u, uw - 0.06, 0.43, -0.04, 0.3)
    cupboardDoor(e, u, -uw / 2 + 0.002, 0.43, 0, { w: uw / 2 - 0.004, h: 0.68, hinge: 'left', face: m.hpl, label: 'Cupboard', angle: 1.6 })
    cupboardDoor(e, u, uw / 2 - 0.002, 0.43, 0, { w: uw / 2 - 0.004, h: 0.68, hinge: 'right', face: m.hpl, label: 'Cupboard', angle: 1.6 })
  }
}

/** Clinical supplies in clear-lidded bins and boxes, filling a shelf `w` wide and `d` deep at y. */
export function supplies(e: Ctx, p: Object3D, w: number, y: number, z: number, d: number, h = 0.2) {
  const { k, m } = e
  const kinds: [Material, number, number][] = [[m.blue, 0.12, 0.6], [m.whitePlastic, 0.18, 0.5], [m.binBlue, 0.22, 0.9], [m.paper, 0.1, 0.7], [m.purple, 0.12, 0.45], [m.binBlue, 0.3, 0.8]]
  for (let x = -w / 2 + 0.01; x < w / 2 - 0.1; ) {
    const [mat, bw, bh] = kinds[(e.r() * kinds.length) | 0]
    const ww = Math.min(bw, w / 2 - x - 0.01)
    if (ww < 0.06) break
    k.box(p, ww, h * bh, d * (0.7 + e.r() * 0.25), mat, x + ww / 2, y + (h * bh) / 2, z - d / 2)
    if (mat === m.binBlue) k.box(p, ww * 0.6, 0.04, 0.003, m.paper, x + ww / 2, y + h * bh * 0.55, z - 0.002 - d * 0.02, false)
    x += ww + 0.01
  }
}

/**
 * Clean-supply storage, `w` wide: drawers of dressings, syringes and cannulas under a worktop
 * (operated), and over it a glazed wall cupboard on shelves of supplies, its pair of glass doors
 * (operated).
 */
export function supplyUnit(e: Ctx, p: Object3D, w: number) {
  const { k, m } = e
  carcass(e, p, w, 0.9, 0.55, m.hpl, [], 0.1, m.solidSurface)
  const fill = packs(e, [m.whitePlastic, m.blue, m.paper, m.binBlue, m.purple], [0.09, 0.06, 0.14])
  for (let i = 0; i < 4; i++) drawer(e, p, 0, 0.8 - i * 0.2 - (i === 3 ? 0.0 : 0), 0, { w: w - 0.006, h: 0.195, d: 0.52, front: m.hpl, handle: 'bar', label: 'Supply Drawer', fill })
  // The wall cupboard over it: 0.38 deep, from 1.45 to 2.35.
  const up = group(p, 0, 1.45, -0.55 + 0.38)
  carcass(e, up, w, 0.9, 0.38, m.hpl, [0.3, 0.6], 0)
  for (const [y, h] of [[0.018, 0.27], [0.31, 0.27], [0.61, 0.26]] as const) supplies(e, up, w - 0.05, y, -0.015, 0.33, h)
  cupboardDoor(e, up, -w / 2 + 0.002, 0.45, 0, { w: w / 2 - 0.004, h: 0.88, hinge: 'left', face: m.aluminium, glass: true, label: 'Supply Cupboard', angle: 1.55 })
  cupboardDoor(e, up, w / 2 - 0.002, 0.45, 0, { w: w / 2 - 0.004, h: 0.88, hinge: 'right', face: m.aluminium, glass: true, label: 'Supply Cupboard', angle: 1.55 })
  k.box(p, w - 0.1, 0.015, 0.02, m.ledLine, 0, 1.44, -0.2, false)
}

/* ---------- the crash cart ---------- */

/** Ampoules standing in a tray, rows of them. */
function ampoules(e: Ctx) {
  const { m } = e
  return (p: Group, iw: number, id: number) => {
    e.k.box(p, iw - 0.01, 0.02, id - 0.02, m.whitePlastic, 0, 0.01, -id / 2, false)
    for (let x = -iw / 2 + 0.03; x < iw / 2 - 0.02; x += 0.03)
      for (let z = -0.04; z > -id + 0.04; z -= 0.06) e.k.cyl(p, 0.007, 0.007, 0.055, (x * 100) % 3 > 1.5 ? m.clearPlastic : m.amber, x, 0.047, z, 8)
  }
}

/** The airway drawer: a laryngoscope handle and blades, tubes in their packs, bag-valve-mask. */
function airway(e: Ctx) {
  const { k, m } = e
  return (p: Group, iw: number, id: number) => {
    k.cyl(p, 0.016, 0.016, 0.14, m.stainless, -iw / 2 + 0.06, 0.016, -0.12, 14).rotation.x = PI / 2
    for (let i = 0; i < 3; i++) k.box(p, 0.02, 0.008, 0.1 + i * 0.01, m.stainless, -iw / 2 + 0.11 + i * 0.03, 0.006, -0.12, false)
    for (let i = 0; i < 6; i++) k.box(p, 0.05, 0.012, 0.32, m.clearPlastic, -0.05 + i * 0.055, 0.008, -id / 2, false)
    put(p, pillow(e, 0.12, 0.1, 0.24), m.mask, iw / 2 - 0.09, 0.05, -id / 2)
  }
}

/**
 * A resuscitation (crash) cart, 0.76 × 1.0 × 0.52: red powder-coated body, a rimmed top, five
 * drawers with colour-coded labels and a breakaway seal (operated), the defibrillator on top, the
 * CPR board on its back, an oxygen cylinder at its side, the sharps bin, the push handle.
 */
export function crashCart(e: Ctx, p: Object3D, defibScreen: Material) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.3, sz * 0.19, 0.05, 0, sz > 0)
  const c = group(p, 0, 0.11, 0.25)
  carcass(e, c, 0.76, 0.88, 0.5, m.red, [], 0)
  const labels = [m.blue, m.red, m.vacuum, m.green, m.whitePlastic]
  const fills = [ampoules(e), airway(e), packs(e, [m.whitePlastic, m.blue, m.vacuum], [0.07, 0.03, 0.12]), packs(e, [m.clearPlastic, m.paper], [0.14, 0.05, 0.22]), packs(e, [m.whitePlastic, m.greyPlastic], [0.16, 0.08, 0.2])]
  const hs = [0.13, 0.13, 0.17, 0.2, 0.2]
  let y = 0.86
  hs.forEach((h, i) => {
    y -= h + 0.005
    const d = drawer(e, c, 0, y + h / 2, 0, { w: 0.72, h, d: 0.46, front: m.red, handle: 'grip', label: 'Crash Cart Drawer', fill: fills[i] })
    e.k.box(d, 0.18, 0.035, 0.003, labels[i], -0.22, h / 2 - 0.035, 0.002, false)
  })
  // The breakaway seal across the drawers' edge, the rimmed top, the push handle.
  k.box(c, 0.012, 0.75, 0.012, m.vacuum, 0.37, 0.48, 0.008, false)
  put(c, panel(e, 0.82, 0.54, 0.04, 0.05, [[0.74, 0.46, 0, 0]]), m.greyPlastic, 0, 0.9, -0.25).rotation.x = -PI / 2
  k.box(c, 0.76, 0.012, 0.48, m.greyPlastic, 0, 0.888, -0.25)
  put(c, bentTube(e, 'cartHandle', [[-0.3, 0.92, -0.5], [-0.3, 1.05, -0.56], [0.3, 1.05, -0.56], [0.3, 0.92, -0.5]], 0.014, 0.04), m.stainless)
  k.box(c, 0.5, 0.6, 0.015, m.vacuum, 0, 1.2, -0.53)
  defibrillator(e, c, 0, 0.91, -0.22, defibScreen)
  // Oxygen at its side in a holder, the sharps bin, the glove box.
  const side = group(c, 0.42, 0.25, -0.25)
  cylinder(e, side, 0.11, 0.6, 'portable')
  k.box(c, 0.03, 0.06, 0.24, m.stainless, 0.395, 0.4, -0.25)
  k.box(c, 0.03, 0.06, 0.24, m.stainless, 0.395, 0.75, -0.25)
  k.box(c, 0.14, 0.2, 0.14, m.sharps, -0.46, 0.75, -0.25)
  k.box(c, 0.15, 0.03, 0.15, m.red, -0.46, 0.86, -0.25)
}

/**
 * A monitor-defibrillator: grey moulded case with its carry handle, the screen, the energy dial
 * and keys, the printer, and the paddles parked in their wells at the sides with their coiled leads.
 */
export function defibrillator(e: Ctx, p: Object3D, x: number, y: number, z: number, screen: Material) {
  const { k, m } = e
  const g = group(p, x, y, z)
  k.soft(g, 0.36, 0.26, 0.3, 0.035, m.charcoal, 0, 0.13, 0)
  put(g, bentTube(e, 'defibHandle', [[-0.13, 0.25, 0.02], [-0.11, 0.33, 0.02], [0.11, 0.33, 0.02], [0.13, 0.25, 0.02]], 0.014, 0.03), m.charcoal)
  face(e, g, 0.17, 0.12, screen, -0.06, 0.16, 0.151)
  k.box(g, 0.18, 0.13, 0.004, m.black, -0.06, 0.16, 0.149, false)
  put(g, lathe(e, 'defibDial', [[0, 0], [0.032, 0], [0.034, 0.02], [0.028, 0.03], [0, 0.03]], 24), m.greyPlastic, 0.1, 0.18, 0.15).rotation.x = PI / 2
  for (let i = 0; i < 3; i++) k.box(g, 0.035, 0.02, 0.01, [m.vacuum, m.red, m.greyPlastic][i], 0.06 + i * 0.04, 0.07, 0.152, false)
  k.box(g, 0.12, 0.006, 0.02, m.black, -0.06, 0.035, 0.152, false)
  for (const s of [-1, 1]) {
    const pad = group(g, s * 0.2, 0.1, 0.02)
    k.soft(pad, 0.05, 0.12, 0.14, 0.02, m.charcoal, 0, 0, 0)
    k.box(pad, 0.04, 0.02, 0.1, m.stainless, 0, -0.07, 0, false)
    k.cyl(pad, 0.015, 0.015, 0.06, m.vacuum, 0, 0.08, 0.03, 10)
  }
}

/* ---------- oxygen cylinders ---------- */

/**
 * A medical oxygen cylinder, radius r, `h` tall overall, as filled in India: a seamless black body,
 * white shoulder, the stamped neck ring and contents collar label, the pin-index valve with its
 * handwheel and outlet. A cylinder `in use` carries its regulator (yoke, contents gauge, flowmeter
 * and humidifier); a `full` spare its tamper cap and tag; a `portable` one its valve guard.
 */
export function cylinder(e: Ctx, p: Object3D, r: number, h: number, kind: 'in use' | 'full' | 'portable') {
  const { k, m } = e
  const t = itemMats(e)
  const body = h * 0.86
  const shoulder = body - r * 0.9
  put(p, lathe(e, `cylBody${r}|${h}`, [[0, 0.004], [r * 0.6, 0], [r * 0.9, r * 0.08], [r, r * 0.3], [r, shoulder], [r * 0.97, shoulder + r * 0.25]], 32), m.cylinder)
  put(p, lathe(e, `cylShoulder${r}|${h}`, [[r * 0.97, shoulder + r * 0.25], [r * 0.85, shoulder + r * 0.55], [r * 0.6, body - r * 0.12], [r * 0.3, body - r * 0.01], [0, body]], 32), m.whitePlastic)
  // The foot ring it stands on.
  put(p, lathe(e, `cylFoot${r}`, [[r * 0.7, 0], [r * 0.95, 0], [r * 0.95, r * 0.25], [r * 0.7, r * 0.25]], 24), t.graphite)
  // The contents label collar round the shoulder: the gas, its pressure, the batch.
  const label = t.printed('o2collar', 256, 64, (c, w, hh) => {
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, w, hh)
    c.fillStyle = '#111'
    c.font = `800 ${hh * 0.42}px Helvetica`
    c.fillText('MEDICAL OXYGEN  O₂', w * 0.03, hh * 0.5)
    c.font = `500 ${hh * 0.22}px Helvetica`
    c.fillText('UN1072 · 150 bar · IP', w * 0.03, hh * 0.85)
  })
  put(p, lathe(e, `cylCollar${r}`, [[r * 1.005, shoulder - r * 0.6], [r * 1.005, shoulder - r * 0.05]], 28), label)
  put(p, lathe(e, `cylNeck${r}`, [[0, 0], [r * 0.28, 0], [r * 0.3, r * 0.06], [r * 0.3, r * 0.2], [r * 0.24, r * 0.25], [0, r * 0.25]], 20), t.satin, 0, body - 0.005)
  const vy = body + r * 0.24
  if (kind === 'full') {
    put(p, lathe(e, `cylCap${r}`, [[0, 0], [r * 0.5, 0], [r * 0.52, r * 0.6], [r * 0.45, r * 1.2], [r * 0.3, r * 1.3], [0, r * 1.32]], 24), m.whitePlastic, 0, vy - 0.01)
    face(e, p, 0.06, 0.09, m.tagFull, 0, vy + r * 0.5, r * 0.53)
    return
  }
  // The pin-index valve: a forged brass body, its outlet face with the two index holes, the spindle and handwheel.
  put(p, lathe(e, 'valveStem', [[0, 0], [0.016, 0], [0.016, 0.02], [0, 0.02]], 16), t.brass, 0, vy - 0.005)
  put(p, panel(e, 0.05, 0.06, 0.04, 0.006), t.brass, 0, vy + 0.045, 0)
  k.cyl(p, 0.003, 0.003, 0.004, t.graphite, -0.012, vy + 0.04, 0.021, 8).rotation.x = PI / 2
  k.cyl(p, 0.003, 0.003, 0.004, t.graphite, 0.012, vy + 0.04, 0.021, 8).rotation.x = PI / 2
  rod(e, p, 0.006, 0.03, t.brass, 0, vy + 0.085, 0, 'z', 10).rotation.set(0, 0, 0)
  const wheel = group(p, 0, vy + 0.1, 0)
  put(wheel, geo(e, 'handwheelRim', () => new TorusGeometry(0.03, 0.005, 8, 24)), t.graphite).rotation.x = PI / 2
  for (let i = 0; i < 3; i++) rod(e, wheel, 0.003, 0.06, t.graphite, 0, 0, 0, 'x', 6).rotation.set(0, (i / 3) * PI, PI / 2)
  put(wheel, lathe(e, 'handwheelHub', [[0, -0.008], [0.009, -0.008], [0.009, 0.008], [0, 0.008]], 12), t.graphite)
  if (kind === 'portable') {
    put(p, bentTube(e, `guard${r}`, [[-r * 0.6, vy, 0], [-r * 0.6, vy + r * 1.3, 0], [r * 0.6, vy + r * 1.3, 0], [r * 0.6, vy, 0]], 0.008, 0.02), m.stainless)
    face(e, p, 0.05, 0.075, m.tagInUse, 0, body * 0.55, r + 0.002)
    return
  }
  regulator(e, p, 0, vy + 0.045, 0.035, 0, true)
  face(e, p, 0.05, 0.075, m.tagInUse, 0, body * 0.55, r + 0.002)
}

/**
 * The department's cylinder store: a floor rack of galvanised steel holding four cylinders upright,
 * each behind its restraining chain, with its sign. Two large cylinders (one in use on a
 * regulator, one full and capped) and two portable ones.
 */
export function cylinderRack(e: Ctx, p: Object3D) {
  const { k, m } = e
  const w = 0.9
  const slots: [number, number, number, 'in use' | 'full' | 'portable'][] = [[-0.33, 0.115, 1.45, 'in use'], [-0.11, 0.115, 1.45, 'full'], [0.12, 0.065, 0.75, 'portable'], [0.3, 0.065, 0.75, 'portable']]
  put(p, bentTube(e, 'rackFrame', [[-w / 2, 0.0, 0.0], [-w / 2, 1.1, 0.0], [w / 2, 1.1, 0.0], [w / 2, 0.0, 0.0]], 0.016, 0.06), m.galvanised, 0, 0, -0.14)
  k.box(p, w, 0.03, 0.32, m.galvanised, 0, 0.015, 0)
  for (const y of [0.45, 1.0]) k.box(p, w, 0.04, 0.015, m.galvanised, 0, y, -0.14)
  for (const [x, r, h, kind] of slots) {
    const g = group(p, x, 0.03, 0)
    cylinder(e, g, r, h, kind)
    // The restraining chain, slung across the front, hooked each side.
    const y = Math.min(h * 0.65, 1.0)
    put(p, tube(e, `chain${r}|${y}`, [[-r - 0.02, y, -0.14], [-r * 0.8, y - 0.02, r * 0.9], [r * 0.8, y - 0.02, r * 0.9], [r + 0.02, y, -0.14]], 0.006), m.galvanised, x, 0.03, 0)
  }
  signPanel(e, p, 0.62, 0.2, m.oxygenSign, 0, 1.24, -0.13)
}

function signPanel(e: Ctx, p: Object3D, w: number, h: number, art: Material, x: number, y: number, z: number) {
  const g = group(p, x, y, z)
  e.k.box(g, w, h, 0.008, e.m.whitePlastic, 0, 0, 0, false)
  face(e, g, w - 0.004, h - 0.004, art, 0, 0, 0.0045)
}

/* ---------- examination couch ---------- */

/**
 * A two-section examination couch, 1.88 × 0.6 with its top at 0.65, along local x, head at −x:
 * a white powder-coated frame of rectangular steel tube on four legs with levelling feet and
 * low stretchers; a seat section and a backrest raised on its gas strut (release lever at the
 * side), each a foam pad on a ply base in healthcare vinyl with welted edges; the paper-roll
 * holder at the head, the paper drawn along the top; and the two-step footstool beside it.
 */
export function examCouch(e: Ctx, p: Object3D, upholstery?: Material) {
  const { k, m } = e
  const f = furnMats(e)
  const vinyl = upholstery ?? f.vinylNavy
  const fr = f.powderWhite
  const top = 0.65
  const hinge = -0.32
  // Frame: side rails, cross rails, legs, stretchers, feet.
  for (const z of [-0.255, 0.255]) {
    k.soft(p, 1.82, 0.06, 0.03, 0.006, fr, 0.03, top - 0.1, z)
    k.soft(p, 1.6, 0.03, 0.03, 0.006, fr, 0.0, 0.15, z)
  }
  for (const x of [-0.82, 0.86]) {
    for (const z of [-0.255, 0.255]) {
      k.soft(p, 0.04, top - 0.13, 0.04, 0.006, fr, x, (top - 0.13) / 2 + 0.01, z)
      k.cyl(p, 0.02, 0.024, 0.02, f.rubber, x, 0.01, z, 14).castShadow = false
    }
    k.soft(p, 0.03, 0.06, 0.48, 0.006, fr, x, top - 0.1, 0)
    k.soft(p, 0.03, 0.03, 0.48, 0.006, fr, x, 0.15, 0)
  }
  // The seat section's ply base and pad.
  const seatLen = 0.94 - hinge
  k.box(p, seatLen, 0.018, 0.56, f.powderBlack, (hinge + 0.94) / 2, top - 0.069, 0)
  cushion(e, p, seatLen - 0.005, 0.06, 0.6, vinyl, (hinge + 0.94) / 2 + 0.0025, top - 0.03, 0, { welt: 'both' })
  // The backrest, hinged at the seat, raised on its gas strut.
  const back = group(p, hinge, top - 0.06, 0)
  back.rotation.z = -0.24
  k.box(back, 0.6, 0.018, 0.56, f.powderBlack, -0.3, -0.009, 0)
  cushion(e, back, 0.6, 0.06, 0.6, vinyl, -0.3, 0.03, 0, { welt: 'both' })
  // The strut from the frame up to the back's underside; the release lever by the seat's edge.
  const strut = k.cyl(p, 0.011, 0.011, 0.24, f.nylon, hinge - 0.24, top - 0.14, 0.18, 10)
  strut.rotation.z = -0.95
  const rodC = k.cyl(p, 0.005, 0.005, 0.18, f.satinChrome, hinge - 0.38, top - 0.05, 0.18, 8)
  rodC.rotation.z = -0.95
  k.soft(p, 0.12, 0.012, 0.03, 0.006, f.nylon, hinge + 0.06, top - 0.09, 0.3)
  // Paper: the roll on its holder at the head, the sheet over both sections.
  const hx = hinge - 0.6 * Math.cos(0.24) - 0.05
  const hy = top - 0.06 + 0.6 * Math.sin(0.24)
  for (const s of [-1, 1]) k.soft(p, 0.05, 0.12, 0.012, 0.004, fr, hx - 0.02, hy - 0.02, s * 0.27)
  rod(e, p, 0.045, 0.52, m.paper, hx - 0.035, hy - 0.06, 0, 'z', 24)
  rod(e, p, 0.008, 0.56, f.satinChrome, hx - 0.035, hy - 0.06, 0, 'z', 8)
  put(p, drape(e, 'couchPaper2', 0.5, seatLen - 0.02, 0.008), m.paper, (hinge + 0.94) / 2, top + 0.004, 0).rotation.y = PI / 2
  const bp = group(p, hinge, top - 0.06, 0)
  bp.rotation.z = -0.24
  put(bp, drape(e, 'couchPaperB', 0.5, 0.6, 0.008), m.paper, -0.3, 0.064, 0).rotation.y = PI / 2
  // The two-step footstool: an aluminium frame, two ribbed rubber treads.
  const st = group(p, 0.4, 0, 0.5)
  for (const s of [-1, 1]) put(st, bentTube(e, 'step2', [[0, 0.0, 0.18], [0, 0.2, 0.16], [0, 0.4, -0.02], [0, 0.0, -0.16]], 0.011, 0.03), m.aluminium, s * 0.2, 0, 0)
  for (const [y, z] of [[0.2, 0.1], [0.4, -0.04]] as const) {
    k.soft(st, 0.42, 0.025, 0.16, 0.006, m.aluminium, 0, y - 0.004, z)
    k.box(st, 0.4, 0.008, 0.14, f.rubber, 0, y + 0.012, z)
    for (let i = 0; i < 6; i++) k.box(st, 0.4, 0.004, 0.006, f.nylon, 0, y + 0.018, z - 0.06 + i * 0.024, false)
  }
}
