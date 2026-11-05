import {
  BufferGeometry, CatmullRomCurve3, ExtrudeGeometry, Group, LatheGeometry, Mesh, Path, PlaneGeometry, Shape, SphereGeometry, TubeGeometry, Vector2, Vector3,
  type Material, type Object3D,
} from 'three'
import { PI, type Kit } from '../kit'
import type { Lighting } from '../shared'
import { mergeStatic } from '../optimize'
import { emergencyMaterials, type EmergencyMaterials } from './emergencyMaterials'
import { rng } from '../textures'

/*
 * The emergency department's workshop: its build context, the shapes its equipment is made from
 * (rounded panels with cut-outs, bent tube, turned parts, draped linen, a filled pillow), and the
 * parts a visitor operates: drawers on runners and hinged cupboard doors, as the viewer's
 * drawer_* and door_* (see scene/openables.ts). Every piece is built in its own frame, front
 * towards +z, at true size.
 */

export interface Ctx {
  k: Kit
  m: EmergencyMaterials
  lighting: Lighting
  root: Group
  r: () => number
  geos: Map<string, BufferGeometry>
  /** Ceiling fixtures placed so far (x0, x1, z0, z1), so sprinklers and detectors keep clear of them. */
  placed: [number, number, number, number][]
  /** A running count for the names of the parts a visitor operates. */
  ids: number
}

export type R = [number, number]

const shared = new WeakMap<object, EmergencyMaterials>()

/** A build context under `root`, the department's finishes made once per model and shared (the ambulance uses them too). */
export function makeCtx(k: Kit, lighting: Lighting, root: Group, seed: number): Ctx {
  let m = shared.get(k.m)
  if (!m) shared.set(k.m, (m = emergencyMaterials(k, lighting)))
  return { k, m, lighting, root, r: rng(seed), geos: new Map(), placed: [], ids: seed % 1000 * 100 }
}

/** Matches no name: merging an operated part's own pieces keeps nothing apart. */
const NONE = /(?!)/

/** A geometry made once per build under `key`. */
export function geo<T extends BufferGeometry>(e: Ctx, key: string, make: () => T): T {
  let g = e.geos.get(key)
  if (!g) e.geos.set(key, (g = make()))
  return g as T
}

/** Adds a mesh of `g` to `p`. */
export function put(p: Object3D, g: BufferGeometry, mat: Material, x = 0, y = 0, z = 0, cast = true) {
  const o = new Mesh(g, mat)
  o.position.set(x, y, z)
  o.castShadow = cast
  o.receiveShadow = true
  p.add(o)
  return o
}

/** A group in `p` at (x, y, z), turned ry. */
export function group(p: Object3D, x = 0, y = 0, z = 0, ry = 0, name = '') {
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = ry
  g.name = name
  p.add(g)
  return g
}

/* ---------- shapes ---------- */

/** A rounded rectangle, w × h centred on the origin, corner radius r; optionally as a hole path. */
export function roundRect(w: number, h: number, r: number, cx = 0, cy = 0, path: Shape | Path = new Shape()) {
  r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4)
  const x0 = cx - w / 2
  const y0 = cy - h / 2
  path.moveTo(x0 + r, y0)
  path.lineTo(x0 + w - r, y0)
  path.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r)
  path.lineTo(x0 + w, y0 + h - r)
  path.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h)
  path.lineTo(x0 + r, y0 + h)
  path.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r)
  path.lineTo(x0, y0 + r)
  path.quadraticCurveTo(x0, y0, x0 + r, y0)
  return path
}

/**
 * A moulded panel: a rounded rectangle w × h, `t` thick, with soft edges and rounded-rectangle
 * cut-outs (hand holds, windows) given as [w, h, cx, cy]. In the xy plane, centred, its depth
 * along z centred on 0.
 */
export function panel(e: Ctx, w: number, h: number, t: number, r: number, holes: number[][] = [], bevel = Math.min(0.006, t / 3)) {
  const key = `panel${w.toFixed(3)}|${h.toFixed(3)}|${t.toFixed(3)}|${r.toFixed(3)}|${holes.map((h) => h.map((v) => v.toFixed(3)).join(',')).join(';')}`
  return geo(e, key, () => {
    const s = roundRect(w - 2 * bevel, h - 2 * bevel, Math.max(0.002, r - bevel)) as Shape
    // Each hole [w, h, cx, cy, corner radius]: a hand hold by default (fully rounded ends).
    for (const [hw, hh, cx, cy, hr] of holes) s.holes.push(roundRect(hw + 2 * bevel, hh + 2 * bevel, hr ?? Math.min(hw, hh) / 2, cx, cy, new Path()) as Path)
    const g = new ExtrudeGeometry(s, { depth: Math.max(0.001, t - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 })
    g.translate(0, 0, -(t - 2 * bevel) / 2)
    return g
  })
}

/** Bent tube through `pts` (smoothed), radius r; closed for a loop. */
export function tube(e: Ctx, key: string, pts: [number, number, number][], r: number, closed = false, tension = 0.2) {
  return geo(e, `tube${key}|${r}`, () => {
    const curve = new CatmullRomCurve3(pts.map(([x, y, z]) => new Vector3(x, y, z)), closed, 'catmullrom', tension)
    return new TubeGeometry(curve, Math.max(8, pts.length * 10), r, 10, closed)
  })
}

/** A tube bent at right angles through `pts`, each corner radiused `bend`: frames, handles, pipework. */
export function bentTube(e: Ctx, key: string, pts: [number, number, number][], r: number, bend = 0.04) {
  const out: [number, number, number][] = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const p = new Vector3(...pts[i])
    const a = new Vector3(...pts[i - 1]).sub(p)
    const b = new Vector3(...pts[i + 1]).sub(p)
    const ra = Math.min(bend, a.length() / 2)
    const rb = Math.min(bend, b.length() / 2)
    a.normalize()
    b.normalize()
    const p0 = p.clone().addScaledVector(a, ra)
    const p1 = p.clone().addScaledVector(b, rb)
    // A few points round the corner, on the quadratic between its tangent points.
    for (let t = 0; t <= 1.0001; t += 0.25) {
      const q = p0.clone().multiplyScalar((1 - t) ** 2).addScaledVector(p, 2 * t * (1 - t)).addScaledVector(p1, t * t)
      out.push([q.x, q.y, q.z])
    }
  }
  out.push(pts[pts.length - 1])
  return tube(e, `bent${key}`, out, r, false, 0)
}

/** A turned part from its profile [radius, y] pairs, about y. */
export function lathe(e: Ctx, key: string, profile: [number, number][], seg = 32) {
  return geo(e, `lathe${key}`, () => new LatheGeometry(profile.map(([r, y]) => new Vector2(Math.max(0, r), y)), seg))
}

/**
 * Linen laid over a mattress w × l (x × z) and falling `hang` down its sides, in soft folds: the
 * flat top, a radiused edge, then hanging, a little uneven. Top at y = 0.
 */
export function drape(e: Ctx, key: string, w: number, l: number, hang: number, ends = 0, seed = 1) {
  return geo(e, `drape${key}`, () => {
    const R = 0.035
    const reach = R * (PI / 2) + hang
    const nx = 40
    const nz = Math.max(12, Math.round(l / 0.05))
    const g = new PlaneGeometry(w + 2 * reach, l + 2 * (ends ? reach : 0), nx, nz)
    g.rotateX(-PI / 2)
    const pos = g.getAttribute('position')
    const fold = (u: number, edge: number, wob: number): [number, number] => {
      // Distance past the edge, round the radius and down.
      const over = Math.abs(u) - edge
      if (over <= 0) return [u, 0]
      const s = Math.sign(u)
      const arc = R * (PI / 2)
      if (over < arc) {
        const a = over / R
        return [s * (edge + Math.sin(a) * R), -(1 - Math.cos(a)) * R]
      }
      const d = over - arc
      return [s * (edge + R + d * 0.04 + wob * 0.006), -R - d]
    }
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const wob = Math.sin(z * 23 + seed) * Math.sin(z * 7.1 + seed * 2)
      let [nxp, y] = fold(x, w / 2, wob)
      let nzp = z
      if (ends) {
        const [zz, yz] = fold(z, l / 2, Math.sin(x * 19 + seed))
        nzp = zz
        y = Math.min(y, yz)
        y = Math.max(y, -ends)
      }
      // A faint unevenness over the top, as linen lies.
      if (y > -0.002) y += 0.003 * Math.sin(x * 31 + seed) * Math.sin(z * 17 + seed * 3)
      pos.setXYZ(i, nxp, Math.max(y, -hang - R), nzp)
    }
    g.computeVertexNormals()
    return g
  })
}

/** A filled pillow, w × h × d: a rounded slab, fullest in the middle, its seams pinched. */
export function pillow(e: Ctx, w: number, h: number, d: number) {
  return geo(e, `pillow${w}|${h}|${d}`, () => {
    const g = new SphereGeometry(1, 32, 16)
    const pos = g.getAttribute('position')
    const sp = (v: number, p: number) => Math.sign(v) * Math.abs(v) ** p
    for (let i = 0; i < pos.count; i++) {
      const x = sp(pos.getX(i), 0.35)
      const z = sp(pos.getZ(i), 0.35)
      const y = pos.getY(i)
      // Thinner towards the corners, like a filled case.
      const t = 1 - 0.55 * Math.max(Math.abs(x), Math.abs(z)) ** 3
      pos.setXYZ(i, (x * w) / 2, (y * h * t) / 2, (z * d) / 2)
    }
    g.computeVertexNormals()
    return g
  })
}

/* ---------- operated parts ---------- */

/**
 * Bakes an operated part's pieces into one mesh per material (it then costs a draw call or two,
 * however detailed), keeping `keep` (its front, which the walker reaches for) apart.
 */
export function bake(part: Group, keep?: Object3D) {
  if (keep) keep.removeFromParent()
  mergeStatic(part, NONE)
  if (keep) part.add(keep)
}

export interface DrawerSpec {
  /** Front w × h, carcass opening depth d. */
  w: number
  h: number
  d: number
  front: Material
  /** How far it runs out, as a share of its depth. */
  travel?: number
  handle?: 'bar' | 'grip' | 'cup'
  label?: string
  /** Fills the box: its inside floor at y = 0, from x −iw/2 … iw/2, z −id … 0 (the front's back). */
  fill?: (p: Group, iw: number, id: number, ih: number) => void
}

/**
 * A drawer, its front's face centred at (x, y, z) in `p` facing +z: the front with its pull, the
 * box behind it (sides, back, bottom in white melamine), the contents; it runs out along +z.
 */
export function drawer(e: Ctx, p: Object3D, x: number, y: number, z: number, s: DrawerSpec) {
  const { k, m } = e
  const part = group(p, x, y, z, 0, `drawer_er_${e.ids++}`)
  if (s.label) part.userData.label = s.label
  part.userData.slide = [0, 0, s.d * (s.travel ?? 0.78)]
  const t = 0.018
  const bw = s.w - 0.05
  const bh = s.h - 0.05
  const bd = s.d - 0.04
  const by = -s.h / 2 + 0.02
  // The box: sides, back, bottom, inside the carcass.
  for (const sx of [-1, 1]) k.box(part, 0.012, bh, bd, m.melamine, sx * (bw / 2 - 0.006), by + bh / 2, -t - bd / 2, false)
  k.box(part, bw, bh, 0.012, m.melamine, 0, by + bh / 2, -t - bd + 0.006, false)
  k.box(part, bw, 0.008, bd, m.melamine, 0, by + 0.004, -t - bd / 2, false)
  // A lip behind the front's top edge closes the gap above it, as a drawer's rail does.
  k.box(part, s.w - 0.01, 0.03, 0.02, m.melamine, 0, s.h / 2 - 0.016, -t - 0.01, false)
  s.fill?.(group(part, 0, by + 0.008, -t), bw - 0.03, bd - 0.02, bh - 0.02)
  // The pull.
  const hy = s.h / 2 - Math.min(0.045, s.h * 0.3)
  if ((s.handle ?? 'bar') === 'bar') {
    const len = Math.min(0.16, s.w * 0.45)
    put(part, bentTube(e, `pull${len}`, [[-len / 2, 0, 0], [-len / 2, 0, 0.03], [len / 2, 0, 0.03], [len / 2, 0, 0]], 0.0055, 0.012), m.stainless, 0, hy, 0.001, false)
  } else if (s.handle === 'grip') {
    k.box(part, Math.min(0.2, s.w * 0.6), 0.012, 0.006, m.darkPlastic, 0, s.h / 2 - 0.012, 0.002, false)
  } else {
    put(part, lathe(e, 'cup', [[0, -0.004], [0.022, -0.004], [0.024, 0], [0.024, 0.012], [0.02, 0.014], [0, 0.014]], 20), m.stainless, 0, hy, 0.002, false).rotation.x = PI / 2
  }
  // The front, kept apart for the walker to reach for.
  const front = put(part, panel(e, s.w - 0.004, s.h - 0.004, t, 0.004), s.front, 0, 0, -t / 2)
  front.userData.front = true
  bake(part, front)
  return part
}

export interface DoorSpec {
  w: number
  h: number
  t?: number
  /** Which side its hinges are on, seen from the front. */
  hinge: 'left' | 'right'
  face: Material
  /** Glazed: an aluminium frame round a glass panel. */
  glass?: boolean
  angle?: number
  label?: string
}

/**
 * A hinged cupboard door, its front's face at z = 0 in `p` and its hinge edge at x (centre of
 * its height at y): the leaf, its pull (or its glass in a frame), the hinges' knuckles. Opens
 * outwards about the hinge, through `angle` (a little past square by default, clear of its
 * neighbours when they are closed).
 */
export function cupboardDoor(e: Ctx, p: Object3D, x: number, y: number, z: number, s: DoorSpec) {
  const { k, m } = e
  const sign = s.hinge === 'left' ? 1 : -1
  const t = s.t ?? 0.018
  const part = group(p, x, y, z, 0, `door_er_${e.ids++}`)
  part.userData.openAngle = -sign * (s.angle ?? 1.75)
  part.userData.label = s.label ?? 'Cupboard'
  const cx = (sign * s.w) / 2
  let front: Mesh
  if (s.glass) {
    front = put(part, panel(e, s.w - 0.004, s.h - 0.004, t, 0.003, [[s.w - 0.07, s.h - 0.07, 0, 0, 0.004]]), m.aluminium, cx, 0, -t / 2)
    k.box(part, s.w - 0.05, s.h - 0.05, 0.005, m.glass, cx, 0, -t / 2, false)
    k.box(part, 0.016, 0.12, 0.016, m.stainless, sign * (s.w - 0.04), 0, 0.012, false)
  } else {
    front = put(part, panel(e, s.w - 0.004, s.h - 0.004, t, 0.004), s.face, cx, 0, -t / 2)
    const len = Math.min(0.16, s.h * 0.4)
    const pull = put(part, bentTube(e, `vpull${len}`, [[0, -len / 2, 0], [0, -len / 2, 0.03], [0, len / 2, 0.03], [0, len / 2, 0]], 0.0055, 0.012), m.stainless, sign * (s.w - 0.045), s.h / 2 - len / 2 - 0.06, 0.001, false)
    pull.castShadow = false
  }
  front.userData.front = true
  for (const hy of [-s.h / 2 + 0.09, s.h / 2 - 0.09]) k.cyl(part, 0.006, 0.006, 0.05, m.aluminium, sign * 0.004, hy, -t - 0.004, 10)
  bake(part, front)
  return part
}

/**
 * A carcass with an open front, w × h × d, its front face at z = 0, standing on y = 0: sides, top,
 * back and bottom in the face material outside and white melamine inside, `shelves` within, on
 * a recessed plinth. Its doors and drawers are added to it.
 */
export function carcass(e: Ctx, p: Object3D, w: number, h: number, d: number, outside: Material, shelves: number[] = [], plinth = 0.1, top?: Material) {
  const { k, m } = e
  const t = 0.018
  if (plinth) k.box(p, w - 0.04, plinth, d - 0.06, m.skirting, 0, plinth / 2, -d / 2 - 0.02)
  for (const s of [-1, 1]) k.box(p, t, h - plinth, d, outside, s * (w / 2 - t / 2), plinth + (h - plinth) / 2, -d / 2)
  k.box(p, w - 2 * t, t, d, outside, 0, plinth + t / 2, -d / 2)
  k.box(p, w - 2 * t, h - plinth - t, 0.008, m.melamine, 0, plinth + (h - plinth) / 2, -d + 0.004)
  if (top) k.box(p, w + 0.02, 0.025, d + 0.02, top, 0, h + 0.0125, -d / 2)
  else k.box(p, w - 2 * t, t, d, outside, 0, h - t / 2, -d / 2)
  for (const y of shelves) {
    k.box(p, w - 2 * t - 0.004, 0.016, d - 0.03, m.melamine, 0, y, -d / 2 - 0.01)
    k.box(p, w - 2 * t - 0.004, 0.016, 0.004, m.reveal, 0, y, -0.03, false)
  }
}

/* ---------- small parts ---------- */

/** A flat face (a sign, a screen), w × h, centred at (x, y, z) in `p`, facing +z turned by ry. */
export function face(e: Ctx, p: Object3D, w: number, h: number, mat: Material, x: number, y: number, z: number, ry = 0) {
  const o = put(p, geo(e, `p${w.toFixed(3)}|${h.toFixed(3)}`, () => new PlaneGeometry(w, h)), mat, x, y, z, false)
  o.rotation.y = ry
  return o
}

/** A sign panel: a thin backing with the artwork on its face. */
export function signPanel(e: Ctx, p: Object3D, w: number, h: number, art: Material, x: number, y: number, z: number, ry = 0, d = 0.012, edge: Material = e.m.whitePlastic) {
  const g = group(p, x, y, z, ry)
  e.k.box(g, w, h, d, edge, 0, 0, 0, false)
  face(e, g, w - 0.004, h - 0.004, art, 0, 0, d / 2 + 0.001)
  return g
}

/** A cylinder lying along local x (rotation about z) or z (about x). */
export function rod(e: Ctx, p: Object3D, r: number, len: number, mat: Material, x: number, y: number, z: number, axis: 'x' | 'z', seg = 12) {
  const c = e.k.cyl(p, r, r, len, mat, x, y, z, seg)
  if (axis === 'x') c.rotation.z = PI / 2
  else c.rotation.x = PI / 2
  return c
}

/**
 * A hospital twin-wheel castor, wheel radius r, under the point (x, z): the swivel stem and its
 * bearing, the moulded fork, two grey wheels with dark treads either side, the hub caps; turned
 * as it was last pushed.
 */
export function castor(e: Ctx, p: Object3D, x: number, z: number, r = 0.05, turn = 0, brake = false) {
  const { k, m } = e
  const g = group(p, x, 0, z, turn)
  const off = r * 0.55
  const tyre = lathe(e, `castorTyre${r}`, [[r * 0.55, -r * 0.22], [r * 0.92, -r * 0.24], [r, -r * 0.15], [r, r * 0.15], [r * 0.92, r * 0.24], [r * 0.55, r * 0.22]], 24)
  const hub = lathe(e, `castorHub${r}`, [[0, r * 0.26], [r * 0.5, r * 0.26], [r * 0.56, r * 0.2], [r * 0.56, -r * 0.2], [r * 0.5, -r * 0.26], [0, -r * 0.26]], 20)
  for (const s of [-1, 1]) {
    put(g, tyre, m.rubber, s * r * 0.3, r, -off, false).rotation.z = PI / 2
    put(g, hub, m.greyPlastic, s * r * 0.3, r, -off, false).rotation.z = PI / 2
  }
  k.soft(g, r * 0.42, r * 1.15, r * 1.35, r * 0.12, m.darkPlastic, 0, r * 1.35, -off * 0.6)
  put(g, lathe(e, `castorTop${r}`, [[0, 0], [r * 0.5, 0], [r * 0.55, r * 0.15], [r * 0.3, r * 0.3], [0, r * 0.3]], 20), m.stainless, 0, r * 1.95, 0, false)
  if (brake) k.soft(g, r * 0.5, r * 0.18, r * 0.7, r * 0.06, m.red, 0, r * 1.9, r * 0.55)
}

/** A five-star base on castors, as under IV poles, monitor stands and task chairs; legs arched. */
export function starBase(e: Ctx, p: Object3D, radius: number, y: number, mat: Material, r = 0.035) {
  const leg = bentTube(e, `star${radius}|${y}|${r}`, [[0, y + 0.005, 0], [0, y, radius * 0.5], [0, y - 0.01, radius * 0.96]], 0.016, 0.1)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * PI * 2
    put(p, leg, mat).rotation.y = a
    castor(e, p, Math.sin(a) * radius * 0.96, Math.cos(a) * radius * 0.96, r, a + 0.4 * Math.sin(i * 7))
  }
  put(p, lathe(e, `starHub${y}`, [[0, y - 0.03], [0.05, y - 0.03], [0.06, y], [0.045, y + 0.035], [0, y + 0.035]], 24), mat)
}
