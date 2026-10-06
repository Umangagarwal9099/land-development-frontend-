import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  type Material,
  type MeshStandardMaterialParameters,
  type Object3D,
} from 'three'
import { rugPaint, TextureLibrary, type Finish } from './textures'

/** Finished floor level above the site; the house stands on a 150 mm stone plinth. */
export const FLOOR_Y = 0.15
/** Walls are cut at this height (section model), so every room can be seen from above. */
export const WALL_H = 2.6

export const PI = Math.PI
/** Rotations for furniture whose front is its local +z: facing +z, -z, +x, -x. */
export const FACE = { south: 0, north: PI, east: PI / 2, west: -PI / 2 } as const

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/** The house's shared finishes; one instance per model so they are disposed with it. */
function createMaterials(t: TextureLibrary) {
  return {
    plaster: std({ map: t.finish('plaster', 2, 1), roughness: 0.95 }),
    wallCap: std({ color: '#2a2724', roughness: 0.9 }),
    travertine: std({ map: t.finish('travertine'), roughness: 0.55 }),
    walnut: std({ map: t.finish('walnut'), roughness: 0.5 }),
    oak: std({ map: t.finish('oak'), roughness: 0.55 }),
    boucle: std({ color: '#dcd3c5', roughness: 1 }),
    linen: std({ color: '#c9bda9', roughness: 1 }),
    olive: std({ color: '#6f7358', roughness: 0.9 }),
    taupe: std({ color: '#9c8a78', roughness: 0.9 }),
    leather: std({ color: '#8a5a3a', roughness: 0.5 }),
    bedding: std({ color: '#f1ece4', roughness: 1 }),
    throw: std({ color: '#8a7a64', roughness: 1 }),
    stoneLinen: std({ color: '#b9ab95', roughness: 1 }),
    bronze: std({ map: t.finish('bronze'), metalness: 0.85, roughness: 0.35 }),
    frame: std({ color: '#6e5a42', metalness: 0.7, roughness: 0.4 }),
    steel: std({ color: '#2b2a28', metalness: 0.6, roughness: 0.5 }),
    quartzite: std({ map: t.finish('quartzite'), roughness: 0.4 }),
    lacquer: std({ color: '#6c6d5f', roughness: 0.55 }),
    black: std({ color: '#111113', roughness: 0.15, metalness: 0.2 }),
    white: std({ color: '#efebe4', roughness: 0.3 }),
    basalt: std({ color: '#3a3835', roughness: 0.8 }),
    marble: std({ map: t.finish('marble'), roughness: 0.3 }),
    teak: std({ color: '#8b6a47', roughness: 0.7 }),
    outdoor: std({ color: '#e2dccf', roughness: 1 }),
    corten: std({ color: '#7c4a2e', roughness: 0.9 }),
    leaf: std({ color: '#56643f', roughness: 0.9, flatShading: true }),
    sage: std({ color: '#6f7a52', roughness: 0.9, flatShading: true }),
    trunk: std({ color: '#5a4636', roughness: 1 }),
    pot: std({ color: '#b8ad9c', roughness: 0.85 }),
    ceramic: std({ color: '#cbbfae', roughness: 0.6 }),
    mirror: std({ color: '#c9ccce', metalness: 1, roughness: 0.04 }),
    fire: std({ color: '#ff9a4d', emissive: '#ff7a2e', emissiveIntensity: 3 }),
    glass: new MeshPhysicalMaterial({ color: '#cfe0e0', roughness: 0.04, transparent: true, opacity: 0.16, depthWrite: false }),
    water: new MeshPhysicalMaterial({ color: '#4f9aa0', roughness: 0.03, transparent: true, opacity: 0.9, emissive: '#1d6470', emissiveIntensity: 0.5, clearcoat: 1 }),
  }
}

/**
 * Materials and furniture builders for furnished design models. Every piece is built in local
 * space with its front towards +z, then placed with a position and a rotation about y.
 */
export class Kit {
  readonly root: Group
  readonly tex: TextureLibrary
  private geos: Map<string, BufferGeometry>
  readonly m: ReturnType<typeof createMaterials>
  /** Warm emissive used by lamp shades, globes and LED strips. */
  readonly glow: MeshStandardMaterial
  /** Ceiling height pendants hang from (the section cut of a house, or a taller false ceiling). */
  readonly ceiling: number

  /** Pass `shared` to build under another root with the same materials and geometry cache. */
  constructor(root: Group, shared?: Kit, ceiling = shared?.ceiling ?? WALL_H) {
    this.root = root
    this.ceiling = ceiling
    this.tex = shared?.tex ?? new TextureLibrary()
    this.geos = shared?.geos ?? new Map()
    this.m = shared?.m ?? createMaterials(this.tex)
    this.glow = shared?.glow ?? std({ color: '#fff4e2', emissive: '#ffcf94', emissiveIntensity: 1.6, roughness: 0.6 })
  }

  /* ---------- materials ---------- */

  finish(name: Finish, rx: number, ry: number, roughness = 0.5) {
    return new MeshStandardMaterial({ map: this.tex.finish(name, rx, ry), roughness })
  }

  /** Fluted panel material with flutes at true 25 mm spacing across `width` metres. */
  fluted(name: 'flutedWalnut' | 'flutedOak', width: number) {
    return new MeshStandardMaterial({ map: this.tex.finish(name, width / 0.6, 1), roughness: 0.55 })
  }

  /* ---------- primitives ---------- */

  private geo<T extends BufferGeometry>(key: string, make: () => T): T {
    let g = this.geos.get(key)
    if (!g) this.geos.set(key, (g = make()))
    return g as T
  }

  mesh(geo: BufferGeometry, mat: Material | Material[], parent: Object3D, x: number, y: number, z: number, cast = true) {
    const o = new Mesh(geo, mat)
    o.position.set(x, y, z)
    o.castShadow = cast
    o.receiveShadow = true
    parent.add(o)
    return o
  }

  box(p: Object3D, w: number, h: number, d: number, mat: Material | Material[], x: number, y: number, z: number, cast = true) {
    const g = this.geo(`b${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`, () => new BoxGeometry(w, h, d))
    return this.mesh(g, mat, p, x, y, z, cast)
  }

  /** Box with rounded edges and corners, for upholstery. */
  soft(p: Object3D, w: number, h: number, d: number, r: number, mat: Material, x: number, y: number, z: number) {
    r = Math.max(0.004, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002))
    const g = this.geo(`s${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r.toFixed(3)}`, () => {
      const sw = Math.max(0.004, w - 2 * r)
      const sd = Math.max(0.004, d - 2 * r)
      const cr = Math.min(sw, sd) * 0.2
      const x0 = -sw / 2
      const y0 = -sd / 2
      const s = new Shape()
      s.moveTo(x0 + cr, y0)
      s.lineTo(x0 + sw - cr, y0)
      s.quadraticCurveTo(x0 + sw, y0, x0 + sw, y0 + cr)
      s.lineTo(x0 + sw, y0 + sd - cr)
      s.quadraticCurveTo(x0 + sw, y0 + sd, x0 + sw - cr, y0 + sd)
      s.lineTo(x0 + cr, y0 + sd)
      s.quadraticCurveTo(x0, y0 + sd, x0, y0 + sd - cr)
      s.lineTo(x0, y0 + cr)
      s.quadraticCurveTo(x0, y0, x0 + cr, y0)
      const e = new ExtrudeGeometry(s, { depth: Math.max(0.002, h - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 4 })
      e.rotateX(-PI / 2)
      e.center()
      return e
    })
    return this.mesh(g, mat, p, x, y, z)
  }

  cyl(p: Object3D, rt: number, rb: number, h: number, mat: Material, x: number, y: number, z: number, seg = 40) {
    const g = this.geo(`c${rt}|${rb}|${h}|${seg}`, () => new CylinderGeometry(rt, rb, h, seg))
    return this.mesh(g, mat, p, x, y, z)
  }

  sphere(p: Object3D, r: number, mat: Material, x: number, y: number, z: number) {
    return this.mesh(this.geo(`o${r}`, () => new SphereGeometry(r, 24, 16)), mat, p, x, y, z)
  }

  blob(p: Object3D, r: number, mat: Material, x: number, y: number, z: number, squash = 1) {
    const o = this.mesh(this.geo(`i${r}`, () => new IcosahedronGeometry(r, 1)), mat, p, x, y, z)
    o.scale.y = squash
    return o
  }

  /** A placed piece: a group at floor level, rotated so its front faces `ry`. */
  at(x: number, z: number, ry = 0, y = FLOOR_Y) {
    const g = new Group()
    g.position.set(x, y, z)
    g.rotation.y = ry
    this.root.add(g)
    return g
  }

  /* ---------- furniture ---------- */

  sofa(x: number, z: number, ry: number, len: number, dep: number, fabric: Material) {
    const { m } = this
    const g = this.at(x, z, ry)
    this.box(g, len - 0.12, 0.08, dep - 0.14, m.black, 0, 0.04, 0)
    this.soft(g, len, 0.28, dep, 0.05, fabric, 0, 0.22, 0)
    this.soft(g, len - 0.02, 0.44, 0.24, 0.08, fabric, 0, 0.58, -dep / 2 + 0.13)
    for (const s of [-1, 1]) this.soft(g, 0.22, 0.3, dep, 0.07, fabric, s * (len / 2 - 0.11), 0.5, 0)
    const n = Math.max(2, Math.round((len - 0.44) / 0.95))
    const cw = (len - 0.44) / n
    for (let i = 0; i < n; i++) {
      const cx = -len / 2 + 0.22 + cw * (i + 0.5)
      this.soft(g, cw - 0.02, 0.14, dep - 0.32, 0.06, fabric, cx, 0.43, 0.08)
      this.soft(g, cw - 0.06, 0.36, 0.18, 0.08, fabric, cx, 0.64, -dep / 2 + 0.32)
    }
    this.soft(g, 0.46, 0.4, 0.13, 0.06, m.olive, -len / 2 + 0.52, 0.66, -dep / 2 + 0.44).rotation.z = 0.12
    this.soft(g, 0.42, 0.38, 0.13, 0.06, m.throw, len / 2 - 0.5, 0.66, -dep / 2 + 0.44).rotation.z = -0.1
    return g
  }

  loungeChair(x: number, z: number, ry: number, frame: Material = this.m.walnut, seat: Material = this.m.leather) {
    const g = this.at(x, z, ry)
    for (const s of [-1, 1]) {
      this.box(g, 0.05, 0.56, 0.82, frame, s * 0.39, 0.28, 0)
      this.box(g, 0.08, 0.04, 0.7, frame, s * 0.39, 0.58, 0.03)
    }
    this.soft(g, 0.72, 0.13, 0.7, 0.05, seat, 0, 0.32, 0.04)
    this.soft(g, 0.72, 0.52, 0.13, 0.05, seat, 0, 0.66, -0.3).rotation.x = -0.28
    return g
  }

  drumTable(x: number, z: number, r: number, h: number, body: Material, top: Material = body) {
    const g = this.at(x, z)
    this.cyl(g, r * 0.96, r * 0.96, h - 0.03, body, 0, (h - 0.03) / 2, 0, 48)
    this.cyl(g, r, r, 0.03, top, 0, h - 0.015, 0, 48)
    return g
  }

  rug(x: number, z: number, w: number, d: number, base: string, border: string, seed: number) {
    const mat = new MeshStandardMaterial({ map: this.tex.painted(512, 512, rugPaint(base, border, seed)), roughness: 1 })
    this.box(this.at(x, z), w, 0.014, d, mat, 0, 0.007, 0, false)
  }

  /** Low joinery (console, sideboard, media unit), optionally raised on a bronze plinth. */
  cabinet(x: number, z: number, ry: number, len: number, dep: number, h: number, body: Material, top?: Material, lift = 0) {
    const g = this.at(x, z, ry)
    if (lift) this.box(g, len - 0.1, lift, dep - 0.1, this.m.bronze, 0, lift / 2, 0)
    this.box(g, len, h, dep, body, 0, lift + h / 2, 0)
    if (top) this.box(g, len + 0.02, 0.03, dep + 0.02, top, 0, lift + h + 0.015, 0)
    return g
  }

  bed(x: number, z: number, ry: number, wid: number, len: number, headW: number, head: Material, frame: Material = this.m.walnut) {
    const { m } = this
    const g = this.at(x, z, ry)
    this.box(g, wid - 0.1, 0.08, len - 0.3, m.black, 0, 0.04, 0.05)
    this.box(g, wid + 0.16, 0.2, len + 0.06, frame, 0, 0.18, 0)
    this.soft(g, wid, 0.26, len - 0.08, 0.05, m.bedding, 0, 0.41, 0.02)
    this.soft(g, wid + 0.06, 0.05, 0.62, 0.02, m.throw, 0, 0.56, len / 2 - 0.5)
    const pw = wid / 2 - 0.06
    for (const s of [-1, 1]) {
      this.soft(g, pw, 0.2, 0.46, 0.08, m.bedding, s * (pw / 2 + 0.03), 0.64, -len / 2 + 0.34)
      this.soft(g, pw - 0.1, 0.2, 0.4, 0.08, m.stoneLinen, s * (pw / 2 + 0.03), 0.66, -len / 2 + 0.6)
    }
    // Channel-tufted headboard: vertical upholstered flutes in a timber surround.
    const n = Math.round(headW / 0.3)
    const cw = headW / n
    for (let i = 0; i < n; i++) this.soft(g, cw - 0.012, 1.3, 0.13, 0.05, head, -headW / 2 + cw * (i + 0.5), 0.8, -len / 2 - 0.08)
    this.box(g, headW + 0.1, 1.36, 0.06, frame, 0, 0.78, -len / 2 - 0.17)
    return g
  }

  /** Floating fluted nightstand with a hanging glass pendant. */
  nightstand(x: number, z: number, ry: number) {
    const g = this.at(x, z, ry)
    this.box(g, 0.55, 0.3, 0.42, this.fluted('flutedWalnut', 0.55), 0, 0.5, 0)
    this.box(g, 0.3, 0.012, 0.02, this.m.bronze, 0, 0.5, 0.215)
    this.cyl(g, 0.07, 0.09, 0.2, this.m.ceramic, 0.14, 0.75, -0.04)
    this.sphere(g, 0.1, this.glow, -0.12, 1.1, -0.04)
    this.cyl(g, 0.004, 0.004, this.ceiling - 1.2, this.m.bronze, -0.12, (this.ceiling + 1.2) / 2, -0.04, 6)
  }

  wardrobe(x: number, z: number, ry: number, len: number, finish: 'flutedWalnut' | 'flutedOak' = 'flutedOak', dep = 0.6) {
    const g = this.at(x, z, ry)
    this.box(g, len, 2.3, dep, this.fluted(finish, len), 0, 1.17, 0)
    this.box(g, len, 0.04, dep - 0.04, this.glow, 0, 0.02, 0, false)
  }

  diningChair(x: number, z: number, ry: number, fabric: Material = this.m.olive, frame: Material = this.m.oak) {
    const g = this.at(x, z, ry)
    for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) this.cyl(g, 0.018, 0.015, 0.44, frame, a, 0.22, b, 10)
    this.soft(g, 0.5, 0.08, 0.5, 0.03, fabric, 0, 0.47, 0)
    this.soft(g, 0.5, 0.4, 0.06, 0.03, fabric, 0, 0.76, -0.23).rotation.x = -0.12
  }

  stool(x: number, z: number) {
    const g = this.at(x, z)
    this.cyl(g, 0.2, 0.19, 0.06, this.m.leather, 0, 0.68, 0)
    this.cyl(g, 0.16, 0.16, 0.02, this.m.bronze, 0, 0.3, 0)
    for (let i = 0; i < 4; i++) {
      const a = (i * PI) / 2 + PI / 4
      this.cyl(g, 0.012, 0.012, 0.66, this.m.bronze, Math.cos(a) * 0.15, 0.33, Math.sin(a) * 0.15, 8)
    }
  }

  plant(x: number, z: number, s = 1, olive = false, y = FLOOR_Y) {
    const { m } = this
    const g = this.at(x, z, 0, y)
    this.cyl(g, 0.26 * s, 0.2 * s, 0.5 * s, m.pot, 0, 0.25 * s, 0)
    if (olive) {
      this.cyl(g, 0.03 * s, 0.05 * s, 1.1 * s, m.trunk, 0, 0.9 * s, 0, 8)
      for (const [a, b, c, r] of [[0, 1.7, 0, 0.42], [0.25, 1.5, 0.12, 0.32], [-0.22, 1.55, -0.1, 0.34], [0.05, 1.95, 0.1, 0.28]])
        this.blob(g, r * s, m.sage, a * s, b * s, c * s, 0.8)
    } else {
      for (const [a, b, c, r] of [[0, 0.9, 0, 0.36], [0.18, 0.75, 0.1, 0.26], [-0.16, 0.8, -0.1, 0.28], [0, 1.15, 0.05, 0.22]])
        this.blob(g, r * s, m.leaf, a * s, b * s, c * s)
    }
  }

  floorLamp(x: number, z: number) {
    const g = this.at(x, z)
    this.cyl(g, 0.16, 0.18, 0.03, this.m.bronze, 0, 0.015, 0)
    this.cyl(g, 0.012, 0.012, 1.45, this.m.bronze, 0, 0.74, 0, 8)
    this.cyl(g, 0.2, 0.24, 0.3, this.glow, 0, 1.5, 0)
  }

  /** Alabaster globe pendant hanging from the (cut-away) ceiling. */
  globe(x: number, y: number, z: number, r = 0.17) {
    const g = this.at(x, z)
    this.sphere(g, r, this.glow, 0, y, 0)
    this.cyl(g, 0.004, 0.004, this.ceiling - y, this.m.bronze, 0, (this.ceiling + y) / 2, 0, 6)
  }

  linearPendant(x: number, z: number, y: number, len: number) {
    const g = this.at(x, z)
    this.box(g, len, 0.05, 0.13, this.m.bronze, 0, y, 0)
    this.box(g, len - 0.1, 0.012, 0.09, this.glow, 0, y - 0.028, 0, false)
    for (const s of [-1, 1]) this.cyl(g, 0.003, 0.003, this.ceiling - y, this.m.bronze, s * (len / 2 - 0.2), (this.ceiling + y) / 2, 0, 4)
  }

  desk(x: number, z: number, ry: number, len: number, dep: number) {
    const { m } = this
    const g = this.at(x, z, ry)
    this.box(g, len, 0.04, dep, m.walnut, 0, 0.74, 0)
    this.box(g, len * 0.6, 0.012, dep * 0.6, m.leather, 0, 0.765, 0.02, false)
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this.cyl(g, 0.015, 0.015, 0.72, m.bronze, a * (len / 2 - 0.06), 0.36, b * (dep / 2 - 0.06), 8)
    this.box(g, 0.4, 0.12, dep - 0.1, m.walnut, len / 2 - 0.28, 0.66, 0)
  }

  deskChair(x: number, z: number, ry: number) {
    const g = this.at(x, z, ry)
    this.cyl(g, 0.03, 0.03, 0.42, this.m.bronze, 0, 0.21, 0, 8)
    this.soft(g, 0.5, 0.1, 0.48, 0.04, this.m.leather, 0, 0.47, 0)
    this.soft(g, 0.48, 0.36, 0.07, 0.03, this.m.leather, 0, 0.75, -0.22).rotation.x = -0.12
  }

  tub(x: number, z: number, ry: number) {
    const g = this.at(x, z, ry)
    this.soft(g, 1.7, 0.56, 0.8, 0.18, this.m.white, 0, 0.28, 0)
    this.box(g, 1.46, 0.02, 0.56, this.m.water, 0, 0.56, 0, false)
  }

  /** Floating vanity with a stone top and a backlit mirror on the wall behind. */
  vanity(x: number, z: number, ry: number, len: number, body: Material, top: Material = this.m.marble) {
    const g = this.at(x, z, ry)
    this.box(g, len, 0.32, 0.52, body, 0, 0.62, 0)
    this.box(g, len + 0.02, 0.03, 0.54, top, 0, 0.795, 0)
    const mw = Math.min(len - 0.2, 1.2)
    this.box(g, mw, 0.8, 0.02, this.m.mirror, 0, 1.55, -0.25)
    this.box(g, mw + 0.04, 0.84, 0.01, this.glow, 0, 1.55, -0.262, false)
  }

  wc(x: number, z: number, ry: number) {
    const g = this.at(x, z, ry)
    this.soft(g, 0.38, 0.4, 0.56, 0.12, this.m.white, 0, 0.2, 0.06)
    this.box(g, 0.4, 0.8, 0.12, this.m.white, 0, 0.4, -0.24)
  }

  /** Frameless shower screen between two plan points. */
  screen(x0: number, z0: number, x1: number, z1: number, h = 2.1) {
    const w = Math.abs(x1 - x0) || 0.012
    const d = Math.abs(z1 - z0) || 0.012
    this.box(this.root, w, h, d, this.m.glass, (x0 + x1) / 2, FLOOR_Y + h / 2, (z0 + z1) / 2, false)
  }

  lounger(x: number, z: number, ry: number, y: number) {
    const g = this.at(x, z, ry, y)
    this.box(g, 0.72, 0.28, 1.95, this.m.teak, 0, 0.14, 0)
    this.soft(g, 0.68, 0.08, 1.3, 0.03, this.m.outdoor, 0, 0.32, 0.3)
    this.soft(g, 0.68, 0.08, 0.66, 0.03, this.m.outdoor, 0, 0.5, -0.62).rotation.x = 0.6
  }

  tree(x: number, z: number, s = 1, crown: Material = this.m.leaf) {
    const g = this.at(x, z, 0, 0)
    this.cyl(g, 0.07 * s, 0.11 * s, 1.6 * s, this.m.trunk, 0, 0.8 * s, 0, 8)
    for (const [a, b, c, r] of [[0, 2.1, 0, 0.95], [0.55, 1.8, 0.2, 0.7], [-0.5, 1.9, -0.25, 0.72], [0.1, 2.5, 0.2, 0.6]])
      this.blob(g, r * s, crown, a * s, b * s, c * s, 0.78)
  }

  palm(x: number, z: number, h: number) {
    const g = this.at(x, z, 0, 0)
    this.cyl(g, 0.11, 0.16, h, this.m.trunk, 0, h / 2, 0, 10)
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2
      const f = this.box(g, 0.28, 0.02, 1.9, this.m.sage, Math.sin(a) * 0.8, h - 0.2, Math.cos(a) * 0.8)
      f.rotation.set(0.55, a, 0, 'YXZ')
    }
  }
}
