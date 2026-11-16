import { BufferGeometry, CatmullRomCurve3, CylinderGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, LatheGeometry, Shape, SphereGeometry, TorusGeometry, TubeGeometry, Vector2, Vector3, type Material, type MeshStandardMaterial, type Object3D } from 'three'
import { rng } from '../../../textures'
import { at, mesh, PI, type Shop } from './kit'

/*
 * The merchandise, modelled as the real pieces are made:
 *
 *   bags      a structured body extruded from its true front profile (trapezoid, saddle, half moon,
 *             rectangle) with softened edges, a flap or an open top with its lining, rolled or flat
 *             handles, a chain or a strap, the clasp, zip, feet and charms in brass, the triangle plaque
 *   shoes     a sole extruded from a foot's outline and an upper extruded from the shoe's side profile,
 *             with toe cap, tongue, eyelets and laces, heel tab, a stacked heel or a stiletto, left and
 *             right as mirrored pairs
 *   garments  jackets, coats, shirts, T-shirts, dresses and folded trousers hung on wooden hangers
 *             from a rail: a body extruded from the garment's silhouette with soft edges, set sleeves,
 *             lapels, collars, plackets and buttons, each hanging a little differently
 *   folded    stacks of knits and jeans with rolled folds; wallets on risers; coiled belts with buckles
 *   figures   abstract mannequins turned from a lathe profile, dressed
 */

/* ---------- helpers ---------- */

function extruded(shape: Shape, depth: number, bevel: number, curveSegments = 8, bevelSegments = 3): BufferGeometry {
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments, curveSegments })
  g.translate(0, 0, -depth / 2)
  return g
}

/** A rounded trapezoid standing on y = 0: `wb` across the bottom, `wt` across the top, `h` high, corners r. */
function trapezoid(wb: number, wt: number, h: number, r: number) {
  const s = new Shape()
  const bl = -wb / 2
  const br = wb / 2
  const tl = -wt / 2
  const tr = wt / 2
  s.moveTo(bl + r, 0)
  s.lineTo(br - r, 0)
  s.quadraticCurveTo(br, 0, br + (tr - br) * (r / h), r)
  s.lineTo(tr - (tr - br) * (r / h), h - r)
  s.quadraticCurveTo(tr, h, tr - r, h)
  s.lineTo(tl + r, h)
  s.quadraticCurveTo(tl, h, tl + (bl - tl) * (r / h), h - r)
  s.lineTo(bl - (bl - tl) * (r / h), r)
  s.quadraticCurveTo(bl, 0, bl + r, 0)
  return s
}

/** A rounded rectangle, bottom-left at (x, y). */
function rounded(x: number, y: number, w: number, h: number, r: number) {
  const s = new Shape()
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

/** A flat strap swept along an arch of `span` across and `rise` high, in the x–y plane at z. */
function strapArch(span: number, rise: number, width: number, thick: number, mat: Material, segs = 24) {
  const pts: Vector3[] = []
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    pts.push(new Vector3(-span / 2 + span * t, Math.sin(t * PI) * rise, 0))
  }
  const curve = new CatmullRomCurve3(pts)
  const shape = new Shape()
  shape.moveTo(-thick / 2, -width / 2)
  shape.lineTo(thick / 2, -width / 2)
  shape.lineTo(thick / 2, width / 2)
  shape.lineTo(-thick / 2, width / 2)
  shape.closePath()
  const g = new ExtrudeGeometry(shape, { extrudePath: curve, steps: segs, bevelEnabled: false })
  return { geometry: g, material: mat }
}

/** A round handle: a torus arch, flattened to the handle's rise. */
function roundHandle(p: Object3D, span: number, rise: number, tube: number, mat: Material, x: number, y: number, z: number) {
  const r = span / 2
  const m = mesh(p, new TorusGeometry(r, tube, 10, 28, PI), mat, x, y, z)
  m.scale.y = rise / r
  return m
}

/* ---------- bags ---------- */

export type BagStyle = 'ladyDior' | 'tote' | 'saddle' | 'flap' | 'galleria' | 'hobo' | 'clutch' | 'bucket'

export interface BagOpts {
  metal?: Material
  /** The lining seen through an open top. */
  lining?: Material
  /** The Prada triangle on the front. */
  triangle?: { enamel: Material; metal: Material }
  /** A second leather for the flap or the strap. */
  trim?: Material
  scale?: number
}

/**
 * A bag standing on its base at local (0, 0, 0), its front towards +z, built from its true profile
 * with the hardware of its kind.
 */
export function bag(s: Shop, p: Object3D, style: BagStyle, leather: Material, x: number, y: number, z: number, yaw: number, o: BagOpts = {}) {
  const { k, lux } = s.e
  const metal = o.metal ?? lux.brass
  const g = at(p, x, y, z, yaw)
  if (o.scale) g.scale.setScalar(o.scale)
  const feet = (w: number, d: number) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.sphere(g, 0.005, metal, sx * (w / 2 - 0.03), 0.004, sz * (d / 2 - 0.02))
  }
  const clasp = (yy: number, zz: number, w = 0.04) => {
    k.soft(g, w, 0.018, 0.008, 0.003, metal, 0, yy, zz)
    k.cyl(g, 0.006, 0.006, 0.012, metal, 0, yy, zz + 0.006, 12).rotation.x = PI / 2
  }
  const triangle = (yy: number, zz: number, size = 0.034) => {
    if (!o.triangle) return
    const t = new Shape()
    t.moveTo(-size / 2, 0)
    t.lineTo(size / 2, 0)
    t.lineTo(0, size * 0.9)
    t.closePath()
    const rim = mesh(g, new ExtrudeGeometry(t, { depth: 0.003, bevelEnabled: false }), o.triangle.metal, 0, yy - size * 0.45, zz)
    rim.scale.set(1.12, 1.12, 1)
    mesh(g, new ExtrudeGeometry(t, { depth: 0.004, bevelEnabled: false }), o.triangle.enamel, 0, yy - size * 0.45, zz)
  }
  const zipTop = (w: number, h: number, d: number) => {
    k.box(g, w - 0.04, 0.006, 0.012, metal, 0, h + 0.002, 0)
    k.box(g, 0.012, 0.004, 0.03, metal, w * 0.3, h + 0.006, 0.0)
    k.box(g, 0.006, 0.018, 0.012, metal, w * 0.3, h + 0.012, -0.004)
    void d
  }
  const lining = (w: number, h: number, d: number) => {
    k.box(g, w - 0.03, 0.04, d - 0.03, o.lining ?? lux.leatherBlack, 0, h - 0.019, 0, false)
  }
  const flatHandles = (w: number, h: number, d: number, span: number, rise: number, mat: Material) => {
    for (const sz of [-1, 1]) {
      const { geometry } = strapArch(span, rise, 0.022, 0.004, mat)
      mesh(g, geometry, mat, 0, h - 0.01, sz * (d / 2 - 0.012))
      void w
    }
  }

  switch (style) {
    case 'ladyDior': {
      const [wb, wt, h, d] = [0.23, 0.28, 0.2, 0.11]
      mesh(g, extruded(trapezoid(wb, wt, h, 0.02), d, 0.012), leather)
      // The zipped top, rolled handles front and back on brass rings, the D.I.O.R. charms.
      zipTop(wt, h + 0.01, d)
      for (const sz of [-1, 1]) {
        roundHandle(g, 0.17, 0.085, 0.007, leather, 0, h + 0.005, sz * (d / 2 - 0.016))
        for (const sx of [-0.085, 0.085]) mesh(g, new TorusGeometry(0.011, 0.0025, 6, 14), metal, sx, h + 0.004, sz * (d / 2 - 0.016)).rotation.y = PI / 2
      }
      for (let i = 0; i < 4; i++) k.box(g, 0.012, 0.014, 0.003, metal, 0.11 + i * 0.001, h - 0.02 - i * 0.016, d / 2 + 0.004)
      feet(wb, d)
      break
    }
    case 'tote': {
      const [wb, wt, h, d] = [0.3, 0.36, 0.27, 0.14]
      mesh(g, extruded(trapezoid(wb, wt, h, 0.012), d, 0.008), leather)
      lining(wt, h, d)
      flatHandles(wt, h, d, 0.2, 0.11, o.trim ?? leather)
      feet(wb, d)
      break
    }
    case 'galleria': {
      const [wb, wt, h, d] = [0.26, 0.31, 0.19, 0.12]
      mesh(g, extruded(trapezoid(wb, wt, h, 0.014), d, 0.01), leather)
      zipTop(wt, h + 0.008, d)
      for (const sz of [-1, 1]) {
        roundHandle(g, 0.16, 0.08, 0.008, leather, 0, h + 0.004, sz * (d / 2 - 0.014))
        for (const sx of [-0.08, 0.08]) k.cyl(g, 0.007, 0.007, 0.01, metal, sx, h + 0.001, sz * (d / 2 - 0.014), 10)
      }
      triangle(h * 0.62, d / 2 + 0.002)
      feet(wb, d)
      break
    }
    case 'saddle': {
      const sh = new Shape()
      sh.moveTo(-0.13, 0.04)
      sh.quadraticCurveTo(-0.1, 0, 0, 0)
      sh.quadraticCurveTo(0.12, 0, 0.14, 0.06)
      sh.quadraticCurveTo(0.14, 0.16, 0.09, 0.18)
      sh.lineTo(-0.1, 0.2)
      sh.quadraticCurveTo(-0.14, 0.17, -0.13, 0.04)
      mesh(g, extruded(sh, 0.075, 0.012), leather)
      // The curved flap over the front, its magnetic clasp, and the wide shoulder strap.
      const flap = new Shape()
      flap.moveTo(-0.11, 0.08)
      flap.quadraticCurveTo(-0.02, 0.05, 0.12, 0.09)
      flap.lineTo(0.09, 0.18)
      flap.lineTo(-0.1, 0.2)
      flap.quadraticCurveTo(-0.125, 0.16, -0.11, 0.08)
      mesh(g, new ExtrudeGeometry(flap, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 }), o.trim ?? leather, 0, 0, 0.075 / 2 + 0.006)
      clasp(0.085, 0.075 / 2 + 0.014, 0.03)
      const { geometry } = strapArch(0.22, 0.17, 0.03, 0.004, o.trim ?? leather)
      mesh(g, geometry, o.trim ?? leather, 0, 0.17, 0)
      break
    }
    case 'flap': {
      const [w, h, d] = [0.24, 0.15, 0.07]
      mesh(g, extruded(rounded(-w / 2, 0, w, h, 0.012), d, 0.008), leather)
      mesh(g, new ExtrudeGeometry(rounded(-w / 2 + 0.006, h * 0.3, w - 0.012, h * 0.72, 0.012), { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 }), o.trim ?? leather, 0, 0, d / 2 + 0.004)
      clasp(h * 0.42, d / 2 + 0.013)
      triangle(h * 0.9, d / 2 + 0.011, 0.026)
      // A chain strap, hanging in a loop behind the bag.
      const pts: Vector3[] = []
      for (let i = 0; i <= 20; i++) {
        const t = i / 20
        pts.push(new Vector3(-w / 2 + 0.02 + (w - 0.04) * t, h + Math.sin(t * PI) * 0.2, -d / 2 + 0.01))
      }
      mesh(g, new TubeGeometry(new CatmullRomCurve3(pts), 24, 0.0035, 6, false), metal)
      feet(w, d)
      break
    }
    case 'hobo': {
      const sh = new Shape()
      sh.moveTo(-0.17, 0.05)
      sh.quadraticCurveTo(-0.17, 0, 0, 0)
      sh.quadraticCurveTo(0.17, 0, 0.17, 0.05)
      sh.quadraticCurveTo(0.17, 0.13, 0.12, 0.15)
      sh.lineTo(-0.12, 0.15)
      sh.quadraticCurveTo(-0.17, 0.13, -0.17, 0.05)
      mesh(g, extruded(sh, 0.09, 0.028, 10, 4), leather)
      zipTop(0.22, 0.15 + 0.026, 0.09)
      const { geometry } = strapArch(0.2, 0.14, 0.035, 0.004, leather)
      mesh(g, geometry, leather, 0, 0.165, 0)
      triangle(0.11, 0.045 + 0.028, 0.028)
      break
    }
    case 'bucket': {
      const prof = [new Vector2(0.001, 0), new Vector2(0.075, 0), new Vector2(0.085, 0.01), new Vector2(0.095, 0.12), new Vector2(0.09, 0.2), new Vector2(0.085, 0.205), new Vector2(0.075, 0.2), new Vector2(0.078, 0.1), new Vector2(0.07, 0.015), new Vector2(0.001, 0.015)]
      const body = mesh(g, new LatheGeometry(prof, 36), leather)
      body.scale.z = 0.8
      k.cyl(g, 0.06, 0.06, 0.004, o.lining ?? lux.leatherBlack, 0, 0.19, 0, 24)
      for (const a of [0, PI]) k.cyl(g, 0.004, 0.004, 0.02, metal, Math.cos(a) * 0.088, 0.17, Math.sin(a) * 0.07, 8)
      const { geometry } = strapArch(0.19, 0.16, 0.012, 0.004, o.trim ?? leather)
      mesh(g, geometry, o.trim ?? leather, 0, 0.17, 0)
      break
    }
    case 'clutch': {
      const [w, h, d] = [0.24, 0.13, 0.035]
      mesh(g, extruded(rounded(-w / 2, 0, w, h, 0.01), d, 0.006), leather)
      mesh(g, new ExtrudeGeometry(rounded(-w / 2 + 0.004, h * 0.35, w - 0.008, h * 0.67, 0.01), { depth: 0.004, bevelEnabled: false }), o.trim ?? leather, 0, 0, d / 2 + 0.002)
      clasp(h * 0.4, d / 2 + 0.008, 0.03)
      triangle(h * 0.92, d / 2 + 0.007, 0.022)
      break
    }
  }
  return g
}

/* ---------- shoes ---------- */

export type ShoeStyle = 'sneaker' | 'runner' | 'derby' | 'loafer' | 'pump' | 'boot' | 'sandal'

export interface ShoeOpts {
  sole?: Material
  cap?: Material
  lace?: Material
  metal?: Material
  right?: boolean
}

/** Half-width of a last at t along its length (0 heel … 1 toe), as a fraction of the widest point. */
function lastWidth(t: number, pointed: boolean) {
  const prof: [number, number][] = pointed
    ? [[0, 0.55], [0.08, 0.78], [0.25, 0.86], [0.45, 0.85], [0.62, 1.0], [0.75, 0.92], [0.88, 0.6], [0.96, 0.28], [1, 0.08]]
    : [[0, 0.6], [0.07, 0.84], [0.2, 0.9], [0.4, 0.88], [0.6, 1.0], [0.75, 0.98], [0.88, 0.84], [0.96, 0.55], [1, 0.2]]
  const c = Math.max(0, Math.min(1, t))
  for (let i = 1; i < prof.length; i++)
    if (c <= prof[i][0]) {
      const [t0, w0] = prof[i - 1]
      const [t1, w1] = prof[i]
      const k = (c - t0) / (t1 - t0)
      return w0 + (w1 - w0) * (k * k * (3 - 2 * k))
    }
  return prof[prof.length - 1][1]
}

/** A foot's outline in plan, heel at z = 0 and toe at z = L, half-width W at the ball. */
function footprint(L: number, W: number, pointed: boolean) {
  const n = 28
  const right: Vector2[] = []
  const left: Vector2[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const w = lastWidth(t, pointed) * W
    // The inside edge of a foot is straighter than the outside.
    right.push(new Vector2(w, t * L))
    left.push(new Vector2(-w * 0.88, t * L))
  }
  const s = new Shape()
  s.moveTo(right[0].x, right[0].y)
  for (const p of right.slice(1)) s.lineTo(p.x, p.y)
  for (const p of left.reverse()) s.lineTo(p.x, p.y)
  s.closePath()
  return s
}

/** A plan outline laid as a slab from y0 to y1, heel at z = 0, toe at +z. */
function plate(shape: Shape, y0: number, y1: number, bevel: number) {
  const g = new ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 })
  // Shape (x, y) → plan (x, z); the extrusion runs down, so lay it from y1 to y0.
  g.rotateX(PI / 2)
  g.translate(0, y1, 0)
  return g
}

/**
 * The upper of a closed shoe: its side profile (height over the length) extruded across the
 * foot, then pinched to the last's plan at every point along it, so the toe narrows and rounds,
 * the heel cups, and the top crowns. Heel at z = 0, toe at z = L.
 */
function upperGeometry(L: number, W: number, base: number, prof: [number, number][], pointed: boolean, span: [number, number] = [0, 1]) {
  const b = 0.012
  const s = new Shape()
  s.moveTo(b, base)
  const pts = prof.map(([t, h]) => new Vector2(b + t * (L - 2 * b), base + Math.max(0.004, h - b)))
  s.lineTo(pts[0].x, pts[0].y)
  s.splineThru(pts.slice(1))
  s.lineTo(L - b, base)
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: 2 * W - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 10, steps: 1 })
  // (x along the length, y up, z across) → (z along, y, x across), centred.
  g.translate(0, 0, -(W - b))
  g.rotateY(-PI / 2)
  const pos = g.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    // A part (a toe cap, a heel tab) takes the last's width where it sits along the whole shoe.
    const t = span[0] + (span[1] - span[0]) * (z / L)
    const w = lastWidth(t, pointed)
    // Narrower towards the top as well: the last's crown.
    const crown = 1 - 0.22 * Math.max(0, Math.min(1, (y - base) / 0.07))
    pos.setX(i, x * w * crown * (x < 0 ? 0.9 : 1))
  }
  g.computeVertexNormals()
  return g
}

/**
 * One shoe standing on its sole at local (0, 0, 0), toe towards +z, built on a last: the sole cut
 * to the foot's outline with its welt, the upper shaped to the last, the opening lined, and the
 * details of its kind (laces through eyelets and the tongue, a toe cap, a penny strap and bit,
 * a stacked heel, a stiletto, straps). Mirrored for the right foot.
 */
export function shoe(s: Shop, p: Object3D, style: ShoeStyle, upper: Material, x: number, y: number, z: number, yaw: number, o: ShoeOpts = {}) {
  const { k, lux } = s.e
  const outer = at(p, x, y, z, yaw)
  if (o.right) outer.scale.x = -1
  const g = at(outer, 0, 0, 0, 0)
  const pointed = style === 'pump'
  const L = pointed ? 0.25 : 0.28
  const W = pointed ? 0.036 : style === 'sneaker' || style === 'runner' ? 0.05 : 0.045
  const sporty = style === 'sneaker' || style === 'runner'
  const sole = o.sole ?? (sporty ? s.m.sole : lux.leatherBlack)
  const metal = o.metal ?? lux.steel
  const lace = o.lace ?? lux.plaster
  const lining = lux.leatherBlack
  const print = footprint(L, W, pointed)

  if (style === 'pump') {
    // Pitched on its stiletto: the toe on the shelf, the heel seat lifted, the upper cut low on a
    // pointed last with the opening lined right down to the toe box.
    const pitch = 0.3
    const lift = L * Math.sin(pitch) * 0.96
    g.rotation.x = pitch
    g.position.y = lift
    mesh(g, plate(print, -0.005, 0.0, 0.001), sole)
    const prof: [number, number][] = [[0, 0.05], [0.08, 0.048], [0.22, 0.026], [0.45, 0.02], [0.62, 0.03], [0.8, 0.028], [0.93, 0.018], [1, 0.006]]
    const ht = (t: number) => {
      for (let i = 1; i < prof.length; i++) if (t <= prof[i][0]) return prof[i - 1][1] + ((prof[i][1] - prof[i - 1][1]) * (t - prof[i - 1][0])) / (prof[i][0] - prof[i - 1][0])
      return prof[prof.length - 1][1]
    }
    mesh(g, upperGeometry(L, W, -0.004, prof, true), upper)
    const o0 = 0.05
    const o1 = 0.6
    const mid = (o0 + o1) / 2
    const opening = mesh(g, new SphereGeometry(1, 28, 10, 0, PI * 2, 0, PI / 2), lining, 0, ht(mid) - 0.012, mid * L)
    opening.scale.set(W * 0.7, 0.008, ((o1 - o0) / 2) * L)
    const collar = mesh(g, new TorusGeometry(1, 0.07, 6, 32), upper, 0, ht(mid) - 0.006, mid * L)
    collar.rotation.x = PI / 2
    collar.scale.set(W * 0.74, ((o1 - o0) / 2) * L, 0.06)
    // The stiletto, straight down from the heel seat; its top-lift.
    const heel = mesh(outer, new CylinderGeometry(0.009, 0.0045, lift, 12), lux.leatherBlack, 0, lift / 2, 0.022)
    heel.castShadow = true
    k.cyl(outer, 0.005, 0.005, 0.005, lux.blackSteel, 0, 0.0025, 0.022, 8)
    return outer
  }

  if (style === 'sandal') {
    mesh(g, plate(print, 0, 0.018, 0.003), sole)
    mesh(g, plate(footprint(L * 0.97, W * 0.92, false), 0.018, 0.022, 0), upper).position.z = L * 0.015
    // Two crossed straps over the forefoot and one round the heel.
    for (const [t, a] of [[0.7, 0.25], [0.7, -0.25]] as const) {
      const strap = mesh(g, new TorusGeometry(W * 1.02, 0.007, 6, 20, PI), upper, 0, 0.022, t * L)
      strap.scale.set(1, 0.7, 1.6)
      strap.rotation.y = a
    }
    const back = mesh(g, new TorusGeometry(W * 0.85, 0.006, 6, 20, PI), upper, 0, 0.05, L * 0.12)
    back.rotation.x = PI / 2
    k.box(g, 0.012, 0.012, 0.004, metal, W * 0.8, 0.05, L * 0.12)
    return outer
  }

  // Closed shoes: sole and welt, the upper on its last, the lined opening.
  const soleH = style === 'sneaker' ? 0.032 : style === 'runner' ? 0.036 : 0.016
  mesh(g, plate(print, 0, soleH, sporty ? 0.004 : 0.002), sole)
  if (!sporty) k.box(g, 0.002, 0.004, L * 0.8, lux.walnutPanel, W * 1.0, soleH + 0.001, L * 0.5, false)
  const profiles: Record<Exclude<ShoeStyle, 'pump' | 'sandal'>, [number, number][]> = {
    sneaker: [[0, 0.062], [0.08, 0.064], [0.2, 0.054], [0.36, 0.06], [0.55, 0.05], [0.75, 0.038], [0.9, 0.026], [1, 0.012]],
    runner: [[0, 0.064], [0.1, 0.064], [0.24, 0.054], [0.42, 0.056], [0.66, 0.042], [0.88, 0.026], [1, 0.012]],
    derby: [[0, 0.056], [0.1, 0.057], [0.24, 0.046], [0.42, 0.052], [0.6, 0.046], [0.78, 0.035], [0.92, 0.022], [1, 0.01]],
    loafer: [[0, 0.05], [0.1, 0.05], [0.26, 0.038], [0.45, 0.044], [0.62, 0.042], [0.8, 0.033], [0.93, 0.021], [1, 0.01]],
    boot: [[0, 0.15], [0.16, 0.152], [0.28, 0.12], [0.4, 0.074], [0.55, 0.054], [0.75, 0.04], [0.92, 0.024], [1, 0.01]],
  }
  const prof = profiles[style]
  const top = (t: number) => {
    for (let i = 1; i < prof.length; i++) if (t <= prof[i][0]) return prof[i - 1][1] + ((prof[i][1] - prof[i - 1][1]) * (t - prof[i - 1][0])) / (prof[i][0] - prof[i - 1][0])
    return prof[prof.length - 1][1]
  }
  const base = soleH - 0.004
  mesh(g, upperGeometry(L, W, base, prof, false), upper)
  // The opening: the lined collar, sunk into the top behind the instep.
  const open0 = style === 'boot' ? 0.02 : 0.06
  const open1 = style === 'boot' ? 0.2 : style === 'loafer' ? 0.42 : 0.36
  const opening = mesh(g, new SphereGeometry(1, 24, 10, 0, PI * 2, 0, PI / 2), lining, 0, base + top((open0 + open1) / 2) - 0.012, ((open0 + open1) / 2) * L)
  opening.scale.set(W * 0.62, 0.012, ((open1 - open0) / 2) * L)
  const collar = mesh(g, new TorusGeometry(1, 0.08, 6, 28), upper, 0, base + top((open0 + open1) / 2) - 0.004, ((open0 + open1) / 2) * L)
  collar.rotation.x = PI / 2
  collar.scale.set(W * 0.66, ((open1 - open0) / 2) * L, 0.09)
  const yAt = (t: number) => base + top(t)
  const laces = (from: number, to: number, n: number) => {
    // The tongue, then pairs of eyelets with the lace crossing between them.
    const tongue = k.soft(g, W * 0.75, 0.008, (to - from) * L + 0.03, 0.003, upper, 0, yAt((from + to) / 2) + 0.002, ((from + to) / 2) * L)
    tongue.rotation.x = -0.12
    for (let i = 0; i < n; i++) {
      const t = from + ((to - from) * i) / Math.max(1, n - 1)
      const yy = yAt(t) + 0.002
      for (const sx of [-1, 1]) k.cyl(g, 0.0032, 0.0032, 0.003, metal, sx * W * 0.42, yy, t * L, 8)
      const c = mesh(g, new CylinderGeometry(0.0018, 0.0018, W * 0.9, 6), lace, 0, yy + 0.003, t * L)
      c.rotation.z = PI / 2
      c.rotation.y = (i % 2 ? 1 : -1) * 0.3
    }
    // The bow.
    for (const sx of [-1, 1]) {
      const loop = mesh(g, new TorusGeometry(0.01, 0.0018, 5, 12), lace, sx * 0.01, yAt(from) + 0.008, from * L - 0.004)
      loop.rotation.set(-0.9, sx * 0.4, 0)
    }
  }
  switch (style) {
    case 'sneaker': {
      // The toe cap and heel counter in the second material, a side stripe, the midsole line.
      const capMesh = mesh(g, upperGeometry(L * 0.36, W * 1.03, base, [[0, 0.042], [0.5, 0.036], [1, 0.016]], false, [0.64, 1]), o.cap ?? upper)
      capMesh.position.z = L * 0.64
      const heelTab = mesh(g, upperGeometry(L * 0.2, W * 1.03, base, [[0, 0.07], [0.6, 0.06], [1, 0.03]], false, [0, 0.2]), o.cap ?? upper)
      heelTab.position.z = -0.002
      laces(0.38, 0.62, 5)
      break
    }
    case 'runner': {
      const capMesh = mesh(g, upperGeometry(L * 0.3, W * 1.03, base, [[0, 0.035], [0.5, 0.032], [1, 0.016]], false, [0.7, 1]), o.cap ?? lux.plaster)
      capMesh.position.z = L * 0.7
      laces(0.4, 0.64, 5)
      break
    }
    case 'derby': {
      laces(0.36, 0.5, 4)
      // The cap toe's seam, and a stacked leather heel.
      const seam = mesh(g, new TorusGeometry(W * 0.95, 0.0012, 4, 24, PI), lux.leatherBlack, 0, yAt(0.76) - 0.004, L * 0.76)
      seam.rotation.x = -PI / 2 + 0.25
      mesh(g, plate(footprint(L * 0.27, W * 0.85, false), -0.022, 0, 0.002), sole).position.y = soleH * 0
      break
    }
    case 'loafer': {
      // The penny strap across the vamp, the horsebit, the moc-toe seam.
      const strap = k.soft(g, W * 1.7, 0.007, 0.028, 0.003, upper, 0, yAt(0.5) + 0.001, L * 0.5)
      strap.rotation.x = 0.1
      const bit = new Group()
      bit.position.set(0, yAt(0.5) + 0.006, L * 0.5)
      g.add(bit)
      for (const sx of [-1, 1]) mesh(bit, new TorusGeometry(0.008, 0.0018, 6, 14), metal, sx * 0.011, 0, 0).rotation.x = PI / 2
      k.box(bit, 0.012, 0.003, 0.003, metal, 0, 0, 0)
      const moc = mesh(g, new TorusGeometry(W * 0.75, 0.0015, 4, 24, PI), upper, 0, yAt(0.75) - 0.002, L * 0.72)
      moc.rotation.x = -PI / 2 + 0.2
      break
    }
    case 'boot': {
      // A side zip, the pull tab at the back, a stacked heel.
      k.box(g, 0.003, 0.13, 0.006, metal, W * 0.92, base + 0.09, L * 0.16)
      k.soft(g, 0.016, 0.03, 0.006, 0.002, upper, 0, base + 0.165, -0.004)
      mesh(g, plate(footprint(L * 0.28, W * 0.85, false), -0.028, 0, 0.002), sole)
      break
    }
  }
  return outer
}

/** A pair, side by side (the right a little behind, as they are put down). */
export function shoePair(s: Shop, p: Object3D, style: ShoeStyle, upper: Material, x: number, y: number, z: number, yaw: number, o: ShoeOpts = {}, gap = 0.12) {
  const g = at(p, x, y, z, yaw)
  // Centred on the pair: the shoes stand heel at their origin, so set them back by half a length.
  shoe(s, g, style, upper, -gap / 2, 0, -0.13, 0.05, { ...o, right: false })
  shoe(s, g, style, upper, gap / 2, 0, -0.145, -0.05, { ...o, right: true })
  return g
}

/* ---------- garments ---------- */

export type GarmentStyle = 'jacket' | 'coat' | 'shirt' | 'tee' | 'dress' | 'trousers' | 'knit'

export interface GarmentOpts {
  /** Shirt under a jacket, buttons, a contrast collar. */
  inner?: Material
  buttons?: Material
  hanger?: 'wood' | 'brass' | 'black'
}

/** A hanger hooked over a rail at local (0, 0, 0): a curved wooden shoulder on a brass hook. */
function hanger(s: Shop, g: Object3D, kind: 'wood' | 'brass' | 'black') {
  const { lux } = s.e
  const metal = kind === 'black' ? lux.blackSteel : lux.brass
  mesh(g, new TorusGeometry(0.02, 0.0022, 6, 16, PI), metal, 0, 0, 0)
  mesh(g, new CylinderGeometry(0.0022, 0.0022, 0.035, 6), metal, 0.02, -0.0175, 0)
  const pts = [new Vector3(-0.2, -0.075, 0), new Vector3(-0.11, -0.046, 0), new Vector3(0, -0.035, 0), new Vector3(0.11, -0.046, 0), new Vector3(0.2, -0.075, 0)]
  const body = mesh(g, new TubeGeometry(new CatmullRomCurve3(pts), 16, kind === 'wood' ? 0.008 : 0.004, 8, false), kind === 'wood' ? lux.walnut : metal)
  body.scale.z = kind === 'wood' ? 1.8 : 1
  return body
}

interface Drape {
  /** Width at v (0 at the shoulders … 1 at the hem). */
  width: (v: number) => number
  len: number
  /** Front-to-back thickness at the middle. */
  depth: number
  /** Number of folds across, their depth, and how much less deep they are at the middle (under lapels or a placket). */
  folds: number
  amp: number
  calmCentre?: number
  /** How far the shoulders slope down from the neck. */
  slope: number
  seed: number
}

/**
 * Cloth hanging from the shoulders: a front and a back sheet, each a grid whose thickness rounds off
 * to nothing at the side seams (so the edges are soft, as a hung garment's are), drawn into folds
 * that deepen towards the hem, and joined across the shoulders and the hem. UVs in metres.
 */
function drape(d: Drape): BufferGeometry {
  const r = rng(d.seed)
  const nu = 22
  const nv = 18
  const phase = [r() * 6, r() * 6, r() * 6]
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const at2 = (u: number, v: number, side: 1 | -1): [number, number, number] => {
    const w = d.width(v)
    const c = 2 * u - 1
    const x = c * (w / 2)
    const y = -Math.pow(Math.abs(c), 1.6) * d.slope * (1 - v) - v * d.len
    const round = Math.pow(Math.max(0, 1 - c * c), 0.6)
    const calm = 1 - (d.calmCentre ?? 0) * Math.max(0, 1 - Math.abs(c) * 3)
    const hang = 0.25 + 0.75 * v
    const fold = d.amp * hang * calm * (Math.sin(u * PI * 2 * d.folds + phase[0] + v * 0.8) * 0.7 + Math.sin(u * PI * 2 * d.folds * 2.3 + phase[1]) * 0.3)
    // The back hangs a little straighter than the front.
    const z = side * (d.depth / 2) * round * (1 - 0.25 * v) + fold * (side > 0 ? 1 : 0.6) + 0.004 * Math.sin(phase[2] + v * 3) * v
    return [x, y, z]
  }
  const sheet = (side: 1 | -1) => {
    const start = pos.length / 3
    for (let j = 0; j <= nv; j++)
      for (let i = 0; i <= nu; i++) {
        const [x, y, z] = at2(i / nu, j / nv, side)
        pos.push(x, y, z)
        uv.push(x, y)
      }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = start + j * (nu + 1) + i
        const b = a + 1
        const c = a + nu + 1
        const e = c + 1
        if (side > 0) idx.push(a, c, b, b, c, e)
        else idx.push(a, b, c, b, e, c)
      }
    return start
  }
  const f = sheet(1)
  const bk = sheet(-1)
  // Shoulders (normals up) and hem (normals down).
  for (let i = 0; i < nu; i++) {
    idx.push(f + i, f + i + 1, bk + i, f + i + 1, bk + i + 1, bk + i)
    const fh = f + nv * (nu + 1) + i
    const bh = bk + nv * (nu + 1) + i
    idx.push(fh, bh, fh + 1, fh + 1, bh, bh + 1)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Where the drape's front surface lies at (u, v): for laying lapels, plackets and buttons on it. */
function frontZ(d: Drape, u: number, v: number) {
  const c = 2 * u - 1
  return (d.depth / 2) * Math.pow(Math.max(0, 1 - c * c), 0.6) * (1 - 0.25 * v)
}

/** A sleeve hanging from the shoulder at (x, y): a tube following a soft curve to the cuff, UVs in metres. */
function sleeve(p: Object3D, x: number, y: number, len: number, r: number, side: number, mat: Material, forward = 0.02, out = 0.012) {
  const pts = [
    new Vector3(x, y, 0),
    new Vector3(x + side * (out + 0.008), y - len * 0.35, forward * 0.4),
    new Vector3(x + side * out, y - len * 0.75, forward),
    new Vector3(x + side * out * 0.6, y - len, forward * 1.2),
  ]
  const curve = new CatmullRomCurve3(pts)
  const g = new TubeGeometry(curve, 16, r, 12, false)
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i) * 2 * PI * r, uv.getX(i) * len)
  const m = mesh(p, g, mat)
  // Close the cuff.
  const end = curve.getPoint(1)
  const cap2 = mesh(p, new CylinderGeometry(r * 0.98, r * 0.98, 0.012, 12), mat, end.x, end.y + 0.004, end.z)
  void cap2
  return m
}

/**
 * A garment on a hanger, the hook over a rail at local (0, 0, 0), its front towards +z. Each is
 * built as the piece is cut: the body draped from the shoulders with its folds, set sleeves that
 * hang and curve, then the collar, lapels, placket, buttons, pocket flaps or waistband of its kind.
 */
export function hung(s: Shop, p: Object3D, style: GarmentStyle, cloth: Material, x: number, y: number, z: number, yaw: number, o: GarmentOpts = {}) {
  const { k, lux } = s.e
  const g = at(p, x, y, z, yaw)
  hanger(s, g, o.hanger ?? 'wood')
  const body = at(g, 0, -0.038, 0, 0)
  const seed = Math.round((x * 31 + z * 17 + y * 7) * 100) % 997
  const btn = o.buttons ?? lux.walnutPanel
  const buttons = (d: Drape, n: number, v0: number, v1: number, u = 0.5, r = 0.008) => {
    for (let i = 0; i < n; i++) {
      const v = v0 + ((v1 - v0) * i) / Math.max(1, n - 1)
      const bt = k.cyl(body, r, r, 0.003, btn, (2 * u - 1) * (d.width(v) / 2), -v * d.len, frontZ(d, u, v) + 0.003, 12)
      bt.rotation.x = PI / 2
    }
  }
  switch (style) {
    case 'jacket':
    case 'coat': {
      const len = style === 'coat' ? 1.02 : 0.74
      const d: Drape = { width: (v) => 0.46 - 0.04 * Math.sin(v * PI * 0.9) + (style === 'coat' ? 0.03 * v : 0), len, depth: 0.12, folds: 3, amp: 0.008, calmCentre: 0.8, slope: 0.035, seed }
      mesh(body, drape(d), cloth)
      for (const sx of [-1, 1]) sleeve(body, sx * 0.205, -0.02, 0.6, 0.048, sx, cloth, 0.025)
      // The shirt in the V, the lapels folded back over it, the buttons, pocket flaps, a breast pocket.
      const fz = frontZ(d, 0.5, 0.2)
      if (o.inner) {
        const v = new Shape()
        v.moveTo(-0.075, 0)
        v.lineTo(0.075, 0)
        v.lineTo(0, -0.28)
        v.closePath()
        mesh(body, new ExtrudeGeometry(v, { depth: 0.002, bevelEnabled: false }), o.inner, 0, -0.005, fz + 0.001)
      }
      for (const sx of [-1, 1]) {
        const lapel = new Shape()
        lapel.moveTo(sx * 0.02, 0.01)
        lapel.lineTo(sx * 0.105, -0.07)
        lapel.lineTo(sx * 0.085, -0.11)
        lapel.lineTo(sx * 0.02, -0.33)
        lapel.lineTo(0, -0.31)
        lapel.lineTo(sx * 0.06, -0.08)
        lapel.closePath()
        const lp = mesh(body, new ExtrudeGeometry(lapel, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 }), cloth, 0, -0.005, fz + 0.002)
        lp.rotation.y = sx * 0.12
        const flap = k.soft(body, 0.14, 0.045, 0.01, 0.004, cloth, sx * 0.12, -0.5 * (len / 0.74) * 0.9, frontZ(d, 0.5 + sx * 0.26, 0.62) + 0.004)
        flap.rotation.y = sx * -0.25
      }
      k.soft(body, 0.09, 0.018, 0.008, 0.003, cloth, 0.1, -0.2, frontZ(d, 0.72, 0.27) + 0.003).rotation.y = -0.2
      buttons(d, style === 'coat' ? 3 : 2, 0.42, style === 'coat' ? 0.68 : 0.56, 0.53, 0.011)
      // The collar standing round the back of the neck.
      const collar = mesh(body, new TorusGeometry(0.07, 0.014, 8, 20, PI), cloth, 0, 0.004, -0.01)
      collar.rotation.set(PI / 2 - 0.25, PI, 0)
      break
    }
    case 'shirt': {
      const d: Drape = { width: (v) => 0.44 - 0.02 * Math.sin(v * PI), len: 0.78, depth: 0.07, folds: 4, amp: 0.006, calmCentre: 0.7, slope: 0.035, seed }
      mesh(body, drape(d), cloth)
      for (const sx of [-1, 1]) sleeve(body, sx * 0.2, -0.02, 0.62, 0.042, sx, cloth, 0.02)
      // The collar band and its two points, the placket, the buttons.
      const fz = frontZ(d, 0.5, 0.02)
      const band = mesh(body, new TorusGeometry(0.06, 0.012, 8, 24, PI * 1.6), cloth, 0, 0.0, -0.004)
      band.rotation.set(PI / 2 - 0.2, 0, PI / 2 + PI * 0.2)
      for (const sx of [-1, 1]) {
        const pt = new Shape()
        pt.moveTo(0, 0)
        pt.lineTo(sx * 0.055, -0.015)
        pt.lineTo(sx * 0.03, -0.07)
        pt.closePath()
        mesh(body, new ExtrudeGeometry(pt, { depth: 0.002, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 1 }), cloth, sx * 0.008, -0.004, fz + 0.012).rotation.x = -0.25
      }
      for (let i = 0; i < 6; i++) {
        const v = 0.06 + i * 0.13
        k.box(body, 0.03, d.len * 0.13, 0.003, cloth, 0, -v * d.len - 0.04, frontZ(d, 0.5, v) + 0.0015, false)
      }
      buttons(d, 6, 0.08, 0.78, 0.5, 0.0055)
      break
    }
    case 'tee': {
      const d: Drape = { width: (v) => 0.46 - 0.01 * v, len: 0.66, depth: 0.05, folds: 4, amp: 0.006, slope: 0.045, seed }
      mesh(body, drape(d), cloth)
      for (const sx of [-1, 1]) sleeve(body, sx * 0.21, -0.03, 0.18, 0.06, sx, cloth, 0.01, 0.04)
      const neck = mesh(body, new TorusGeometry(0.068, 0.007, 6, 24), cloth, 0, -0.005, 0.0)
      neck.rotation.x = PI / 2 - 0.35
      neck.scale.set(1, 1.1, 1)
      break
    }
    case 'knit': {
      const d: Drape = { width: (v) => 0.47 - 0.03 * v, len: 0.66, depth: 0.09, folds: 3, amp: 0.009, slope: 0.04, seed }
      mesh(body, drape(d), cloth)
      for (const sx of [-1, 1]) sleeve(body, sx * 0.21, -0.025, 0.58, 0.052, sx, cloth, 0.02, 0.016)
      const neck = mesh(body, new TorusGeometry(0.072, 0.012, 8, 24), cloth, 0, -0.008, 0.0)
      neck.rotation.x = PI / 2 - 0.35
      // The ribbed hem band.
      k.soft(body, d.width(1) * 0.95, 0.05, d.depth * 0.6, 0.015, cloth, 0, -d.len + 0.02, 0)
      break
    }
    case 'dress': {
      const d: Drape = { width: (v) => (v < 0.35 ? 0.4 - 0.08 * (v / 0.35) : 0.32 + 0.3 * ((v - 0.35) / 0.65)), len: 1.12, depth: 0.08, folds: 5, amp: 0.014, slope: 0.03, seed }
      mesh(body, drape(d), cloth)
      // A thin leather belt at the waist, its buckle.
      const wv = 0.35
      const belt2 = mesh(body, new TorusGeometry(1, 0.012, 6, 32), o.inner ?? lux.leatherBlack, 0, -wv * d.len, 0)
      belt2.rotation.x = PI / 2
      belt2.scale.set(d.width(wv) / 2 + 0.006, frontZ(d, 0.5, wv) + 0.006, 1)
      k.box(body, 0.03, 0.026, 0.006, lux.brass, 0, -wv * d.len, frontZ(d, 0.5, wv) + 0.012)
      break
    }
    case 'trousers': {
      // Folded over the hanger's bar: two legs' worth of cloth hanging front and back, the crease pressed in.
      const d: Drape = { width: () => 0.3, len: 0.5, depth: 0.04, folds: 2, amp: 0.004, slope: 0, seed }
      const t = mesh(body, drape(d), cloth)
      t.position.y = -0.03
      k.cyl(body, 0.012, 0.012, 0.3, cloth, 0, -0.035, 0, 12).rotation.z = PI / 2
      for (const sz of [-1, 1]) k.box(body, 0.002, 0.46, 0.003, cloth, sz * 0.075, -0.29, frontZ(d, 0.5 + sz * 0.25, 0.5) + 0.0015, false)
      break
    }
  }
  return g
}

/**
 * A run of garments along a rail (local x), hung side-on as a boutique rails them (their fronts to
 * local +x), each a little differently; `faceOut` turns the first to face the room.
 */
export function hangRun(s: Shop, p: Object3D, items: [GarmentStyle, Material, GarmentOpts?][], x0: number, y: number, z: number, pitch: number, seed = 1, faceOut = false) {
  const r = rng(seed)
  items.forEach(([style, mat, o], i) => {
    const front = faceOut && i === 0
    hung(s, p, style, mat, x0 + i * pitch + (r() - 0.5) * 0.015, y, z + (r() - 0.5) * 0.01, (front ? 0 : -PI / 2) + (r() - 0.5) * 0.1, o)
  })
}

/* ---------- folded, small leather goods, belts ---------- */

/**
 * A stack of folded pieces: each a soft slab with its folded edge rolled round to the front and a
 * little give in the cloth, offset as a stack is when it has been browsed.
 */
export function foldedStack(s: Shop, p: Object3D, mats: Material[], w: number, d: number, x: number, y: number, z: number, yaw: number, seed = 1) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  const r = rng(seed)
  let yy = 0
  for (const mat of mats) {
    const h = 0.024 + r() * 0.008
    const ww = w + (r() - 0.5) * 0.012
    const dx = (r() - 0.5) * 0.012
    const dz = (r() - 0.5) * 0.008
    const layer = at(g, dx, yy, dz, (r() - 0.5) * 0.05)
    k.soft(layer, ww, h, d - h * 0.5, 0.008, mat, 0, h / 2, -h * 0.25)
    const roll = mesh(layer, new CylinderGeometry(h / 2, h / 2, ww - 0.004, 12), mat, 0, h / 2, d / 2 - h / 2)
    roll.rotation.z = PI / 2
    // The fold's crease along the top.
    k.box(layer, ww - 0.02, 0.0015, 0.002, mat, 0, h - 0.0005, d / 2 - h * 0.6, false)
    yy += h
  }
  return g
}

/** A wallet or card case, closed, standing on a clear riser or lying flat. */
export function wallet(s: Shop, p: Object3D, mat: Material, x: number, y: number, z: number, yaw: number, standing = true, metal?: Material, long = true) {
  const { k, lux } = s.e
  const g = at(p, x, y, z, yaw)
  const w = long ? 0.19 : 0.11
  const h = long ? 0.095 : 0.085
  if (standing) {
    k.box(g, w + 0.02, 0.05, 0.03, s.m.vitrineGlass, 0, 0.025, -0.01, false)
    const b = k.soft(g, w, h, 0.02, 0.006, mat, 0, 0.05 + h / 2 - 0.01, 0.0)
    b.rotation.x = -0.18
    k.box(g, 0.022, 0.006, 0.002, metal ?? lux.brass, 0, 0.05 + h * 0.7, 0.012)
  } else {
    k.soft(g, w, 0.02, h, 0.006, mat, 0, 0.01, 0)
    k.box(g, 0.022, 0.002, 0.006, metal ?? lux.brass, 0, 0.021, h * 0.3)
  }
  return g
}

/** A coiled belt lying flat, the buckle on top. */
export function belt(s: Shop, p: Object3D, mat: Material, x: number, y: number, z: number, metal?: Material) {
  const { k, lux } = s.e
  const g = at(p, x, y, z, 0)
  const coil = mesh(g, new TorusGeometry(0.052, 0.0045, 6, 40), mat, 0, 0.012, 0)
  coil.rotation.x = PI / 2
  coil.scale.z = 2.6
  const coil2 = mesh(g, new TorusGeometry(0.04, 0.0045, 6, 36), mat, 0, 0.012, 0)
  coil2.rotation.x = PI / 2
  coil2.scale.z = 2.6
  k.box(g, 0.036, 0.004, 0.03, metal ?? lux.brass, 0.045, 0.026, 0.0)
  k.box(g, 0.026, 0.006, 0.02, lux.blackSteel, 0.045, 0.026, 0.0, false)
  return g
}

/** A cap with its peak towards +z, in cloth with a button and eyelets. */
export function cap(s: Shop, p: Object3D, mat: Material, x: number, y: number, z: number, yaw: number) {
  const { k, lux } = s.e
  const g = at(p, x, y, z, yaw)
  const crown = mesh(g, new SphereGeometry(0.09, 24, 12, 0, PI * 2, 0, PI / 2), mat, 0, 0, 0)
  crown.scale.y = 0.85
  k.cyl(g, 0.009, 0.009, 0.004, mat, 0, 0.077, 0, 10)
  const peak = mesh(g, new CylinderGeometry(0.1, 0.1, 0.005, 24, 1, false, -PI / 2 - 0.95, 1.9), mat, 0, 0.004, 0.0)
  peak.rotation.x = 0.12
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2
    mesh(g, new TorusGeometry(0.004, 0.0012, 4, 8), lux.blackSteel, Math.cos(a) * 0.06, 0.055, Math.sin(a) * 0.06).rotation.set(0.9, 0, -a)
  }
  return g
}

/** A scent bottle: a faceted glass block, the juice inside, a cap. */
export function scent(s: Shop, p: Object3D, x: number, y: number, z: number, h = 0.12, juice?: Material) {
  const { k, lux } = s.e
  const g = at(p, x, y, z, 0)
  k.soft(g, h * 0.55, h * 0.8, h * 0.3, 0.008, s.m.scent, 0, h * 0.4, 0)
  k.soft(g, h * 0.47, h * 0.62, h * 0.22, 0.006, (juice ?? s.m.scent), 0, h * 0.34, 0)
  k.cyl(g, h * 0.1, h * 0.1, h * 0.03, lux.brass, 0, h * 0.815, 0, 16)
  k.cyl(g, h * 0.12, h * 0.12, h * 0.18, lux.blackSteel, 0, h * 0.92, 0, 16)
  return g
}

/* ---------- mannequins ---------- */

export interface Outfit {
  jacket: Material
  shirt: Material
  trousers: Material
  shoes: Material
  /** A dress instead of jacket and trousers. */
  dress?: Material
}

/**
 * An abstract display mannequin, 1.8 m, turned from a lathe profile (hips, waist, chest, shoulders)
 * and dressed: jacket over a shirt with lapels, trousers, shoes; or a dress. Faces +z.
 */
export function figure(s: Shop, p: Object3D, outfit: Outfit, x: number, y: number, z: number, yaw: number) {
  const { k, lux } = s.e
  const g = at(p, x, y, z, yaw)
  const skin = s.m.mannequin
  k.cyl(g, 0.19, 0.19, 0.012, lux.blackSteel, 0, 0.006, 0, 32)
  k.cyl(g, 0.009, 0.009, 0.38, lux.steel, 0, 0.19, -0.03, 8)
  // Legs: thigh and calf, a knee between, shoes.
  for (const sx of [-1, 1]) {
    const tr = outfit.dress ? skin : outfit.trousers
    mesh(g, new CylinderGeometry(0.075, 0.062, 0.42, 14), tr, sx * 0.09, 0.73, 0).rotation.z = sx * 0.03
    k.sphere(g, 0.062, tr, sx * 0.095, 0.52, 0)
    mesh(g, new CylinderGeometry(0.06, 0.042, 0.42, 14), tr, sx * 0.1, 0.31, 0.005).rotation.z = sx * 0.02
    shoe(s, g, outfit.dress ? 'pump' : 'derby', outfit.shoes, sx * 0.1, 0.0, 0.0, 0.0, { right: sx > 0 })
  }
  // Torso turned from a profile, flattened front to back; the jacket, the shirt in its V, lapels.
  const prof = [new Vector2(0.001, 0), new Vector2(0.17, 0), new Vector2(0.18, 0.08), new Vector2(0.155, 0.2), new Vector2(0.185, 0.36), new Vector2(0.21, 0.5), new Vector2(0.2, 0.56), new Vector2(0.07, 0.6), new Vector2(0.001, 0.6)]
  const torso = mesh(g, new LatheGeometry(prof, 40), outfit.dress ?? outfit.jacket, 0, 0.9, 0)
  torso.scale.z = 0.62
  if (!outfit.dress) {
    const v = new Shape()
    v.moveTo(-0.075, 0)
    v.lineTo(0.075, 0)
    v.lineTo(0, -0.26)
    v.closePath()
    mesh(g, new ExtrudeGeometry(v, { depth: 0.004, bevelEnabled: false }), outfit.shirt, 0, 1.47, 0.122)
    for (const sx of [-1, 1]) {
      const lapel = new Shape()
      lapel.moveTo(0, 0)
      lapel.lineTo(sx * 0.1, -0.05)
      lapel.lineTo(sx * 0.03, -0.3)
      lapel.lineTo(0, -0.28)
      lapel.closePath()
      mesh(g, new ExtrudeGeometry(lapel, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.003, bevelSegments: 2 }), outfit.jacket, 0, 1.47, 0.124)
    }
    for (const yy of [1.17, 1.08]) k.cyl(g, 0.011, 0.011, 0.003, lux.walnutPanel, 0.025, yy, 0.128, 12).rotation.x = PI / 2
    // Collar at the back of the neck.
    const collar = mesh(g, new TorusGeometry(0.075, 0.012, 8, 24, PI), outfit.jacket, 0, 1.5, 0.0)
    collar.rotation.set(PI / 2, 0, PI)
    collar.scale.z = 0.7
  }
  // Arms: upper arm and forearm with a bend at the elbow, hands.
  for (const sx of [-1, 1]) {
    const am = outfit.dress ? skin : outfit.jacket
    const upper = mesh(g, new CylinderGeometry(0.05, 0.044, 0.3, 12), am, sx * 0.24, 1.3, 0.0)
    upper.rotation.z = sx * 0.1
    k.sphere(g, 0.042, am, sx * 0.255, 1.15, 0.01)
    const fore = mesh(g, new CylinderGeometry(0.042, 0.035, 0.27, 12), am, sx * 0.26, 1.01, 0.04)
    fore.rotation.set(-0.22, 0, sx * 0.02)
    mesh(g, new SphereGeometry(0.038, 12, 10), skin, sx * 0.265, 0.86, 0.07).scale.set(0.8, 1.3, 0.6)
  }
  // Neck and head.
  k.cyl(g, 0.05, 0.056, 0.1, skin, 0, 1.54, 0.0, 16)
  const head = mesh(g, new SphereGeometry(0.1, 24, 16), skin, 0, 1.69, 0.0)
  head.scale.set(0.9, 1.14, 0.95)
  return g
}

/* ---------- fixtures for the merchandise ---------- */

/** A freestanding clothes rail, `len` long along local x: round uprights on disc bases, a top rail and a low rail for shoes. */
export function clothesRail(s: Shop, p: Object3D, x: number, z: number, yaw: number, len: number, h: number, metal: Material) {
  const { k } = s.e
  const g = at(p, x, s.y, z, yaw)
  for (const sx of [-1, 1]) {
    k.cyl(g, 0.17, 0.17, 0.012, metal, sx * (len / 2 - 0.1), 0.006, 0, 32)
    k.cyl(g, 0.012, 0.012, h, metal, sx * (len / 2 - 0.1), h / 2, 0, 12)
  }
  mesh(g, new CylinderGeometry(0.012, 0.012, len, 12), metal, 0, h, 0).rotation.z = PI / 2
  mesh(g, new CylinderGeometry(0.008, 0.008, len - 0.2, 10), metal, 0, 0.3, 0).rotation.z = PI / 2
  s.e.shade.rect(x, s.y + 0.012, z, len, 0.6, yaw, 0.3)
  return g
}

/** A hanging bay built into a wall: lit back, a brass rail at `railY`, a cabinet base; local +z out of the wall. */
export function hangingBay(s: Shop, p: Object3D, x: number, z: number, yaw: number, len: number, depth: number, railY: number, top: number, frame: Material, base: Material, back: Material, led: Material, metal: Material) {
  const { k } = s.e
  const g = at(p, x, s.y, z, yaw)
  k.box(g, len, top, 0.02, back, 0, top / 2, 0.01, false)
  k.box(g, len, 0.12, depth, base, 0, 0.06, depth / 2)
  k.box(g, len, 0.06, depth, frame, 0, top - 0.03, depth / 2)
  k.box(g, len - 0.1, 0.006, 0.01, led, 0, top - 0.065, depth - 0.05, false)
  for (const sx of [-len / 2, len / 2]) k.box(g, 0.03, top - 0.12, depth, frame, sx, 0.12 + (top - 0.12) / 2, depth / 2)
  mesh(g, new CylinderGeometry(0.012, 0.012, len - 0.08, 12), metal, 0, railY, depth * 0.55).rotation.z = PI / 2
  for (const sx of [-len / 2 + 0.3, len / 2 - 0.3]) k.box(g, 0.02, 0.02, depth * 0.55, metal, sx, railY + 0.03, depth * 0.3)
  s.e.shade.rect(x, s.y + 0.012, z, len, depth * 1.2, yaw, 0.3)
  return { g, depth, railY }
}

/** A run of track spotlights along a line, their heads turned towards `aim` (a plan direction). */
export function trackSpots(s: Shop, p: Object3D, x0: number, z0: number, x1: number, z1: number, y: number, n: number, lens: Material, aimYaw: number, tilt = 0.6) {
  const { k, lux } = s.e
  const len = Math.hypot(x1 - x0, z1 - z0)
  const g = at(p, (x0 + x1) / 2, y, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0))
  k.box(g, 0.03, 0.025, len, lux.blackSteel, 0, -0.0125, 0, false)
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    const head = at(g, 0, -0.035, -len / 2 + len * t, aimYaw - Math.atan2(x1 - x0, z1 - z0))
    k.cyl(head, 0.012, 0.012, 0.03, lux.blackSteel, 0, 0.0, 0, 10)
    const can = at(head, 0, -0.04, 0.0, 0)
    can.rotation.x = -tilt
    k.cyl(can, 0.03, 0.028, 0.09, lux.blackSteel, 0, 0, 0, 16).rotation.x = PI / 2
    k.cyl(can, 0.024, 0.024, 0.004, lens, 0, 0, 0.046, 16).rotation.x = PI / 2
  }
  return g
}
