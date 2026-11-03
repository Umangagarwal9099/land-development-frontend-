import { BufferGeometry, Float32BufferAttribute, Mesh, Vector3, type Material, type Object3D } from 'three'
import { facadePoint, inSwoosh, LOOP, SHOPFRONT, skinBottom, skinTop } from './plan'
import type { MallMaterials } from './materials'
import { rng } from '../textures'

/*
 * The mall's faceted skin, as in the reference: a diamond lattice of shallow aluminium pyramids
 * wrapped round the whole building, each diamond a frame of extruded aluminium round four
 * facets; the two upper facets are perforated anodised panels, the two lower dark solar-control
 * glass, so each diamond reads light over dark under the sky. The lattice is laid along the
 * façade (s round the loop, h up) and clipped to the crown and soffit lines.
 */

/** Diamond width along the façade (fitted to divide the loop exactly) and height. */
const CELL_W = 1.7
const CELL_H = 1.25
/** How far a full diamond's apex stands proud of the skin, and the frame's inset. */
const APEX = 0.3
const INSET = 0.84
/** The frame's inner edge; between it and the facets, a recessed gasket line. */
const FRAME_IN = 0.89
/** Outer face of the skin's edge trims. */
export const TRIM_OUT = 0.36
/** Inner backing wall behind the skin. */
export const BACKING = -0.35

/** Triangles gathered for one mesh: positions, and UVs in metres. */
export class Tris {
  private pos: number[] = []
  private uv: number[] = []
  private col: number[] = []
  /** With colour: every triangle carries `tint` as its vertex colour (for per-panel variation). */
  private readonly colored: boolean
  tint: [number, number, number] = [1, 1, 1]

  constructor(colored = false) {
    this.colored = colored
  }

  tri(a: Vector3, b: Vector3, c: Vector3, ua: number[], ub: number[], uc: number[]) {
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
    this.uv.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1])
    if (this.colored) this.col.push(...this.tint, ...this.tint, ...this.tint)
  }

  /** Quad a → b → c → d, anticlockwise from its front. */
  quad(a: Vector3, b: Vector3, c: Vector3, d: Vector3, ua: number[], ub: number[], uc: number[], ud: number[]) {
    this.tri(a, b, c, ua, ub, uc)
    this.tri(a, c, d, ua, uc, ud)
  }

  get empty() {
    return this.pos.length === 0
  }

  mesh(mat: Material, parent: Object3D, name = '', cast = true) {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3))
    g.setAttribute('uv', new Float32BufferAttribute(this.uv, 2))
    if (this.colored) g.setAttribute('color', new Float32BufferAttribute(this.col, 3))
    g.computeVertexNormals()
    const m = new Mesh(g, mat)
    m.name = name
    m.castShadow = cast
    m.receiveShadow = true
    parent.add(m)
    return m
  }
}

/**
 * A strip following the loop from s0 to s1, between the edge points `a(s)` and `b(s)`. With `a`
 * below `b` it faces out of the building; with `a` inside `b` (both level) it faces down.
 */
export function ribbon(t: Tris, s0: number, s1: number, a: (s: number) => Vector3, b: (s: number) => Vector3, step = 0.25) {
  const n = Math.max(1, Math.ceil((s1 - s0) / step))
  let pa = a(s0)
  let pb = b(s0)
  for (let k = 1; k <= n; k++) {
    const s = s0 + ((s1 - s0) * k) / n
    const qa = a(s)
    const qb = b(s)
    const sp = s - (s1 - s0) / n
    t.quad(pa, qa, qb, pb, [sp, 0], [s, 0], [s, pb.distanceTo(pa)], [sp, pb.distanceTo(pa)])
    pa = qa
    pb = qb
  }
}

/** A point at height h on the plan loop offset by d (no lean): for shopfronts, backing and soffits. */
export const plumb = (s: number, h: number, d: number) => {
  const [x, z] = LOOP.at(s, d)
  return new Vector3(x, h, z)
}

export function buildSkin(parent: Object3D, c: MallMaterials) {
  const panel = new Tris(true)
  const glass = new Tris(true)
  const frame = new Tris()
  const gasket = new Tris()
  const rand = rng(907)
  const n = Math.round(LOOP.length / CELL_W)
  const cw = LOOP.length / n
  const half = CELL_H / 2
  const clampH = (s: number, h: number) => Math.min(skinTop(s), Math.max(skinBottom(s), h))

  for (let r = Math.floor(2 / half); r <= Math.ceil(19.5 / half); r++) {
    const hc = r * half
    const shift = r % 2 ? 0.5 : 0
    for (let i = 0; i < n; i++) {
      const sc = (i + shift) * cw
      // Corners anticlockwise from the façade's front: right, top, left, bottom.
      const corners: [number, number][] = [
        [sc + cw / 2, clampH(sc + cw / 2, hc)],
        [sc, clampH(sc, hc + half)],
        [sc - cw / 2, clampH(sc - cw / 2, hc)],
        [sc, clampH(sc, hc - half)],
      ]
      const span = corners[1][1] - corners[3][1]
      if (span < 0.03) continue
      const ch = (corners[1][1] + corners[3][1]) / 2
      const frac = Math.min(1, span / CELL_H)
      const scaled = (f: number) => corners.map(([s, h]): [number, number] => [sc + (s - sc) * f, ch + (h - ch) * f])
      const inner = scaled(INSET)
      const lip = scaled(FRAME_IN)
      const O = corners.map(([s, h]) => facadePoint(s, h, 0))
      // The frame's face stands 50 mm proud; the gasket steps back down to the facets' edge.
      const F = lip.map(([s, h]) => facadePoint(s, h, 0.05 * frac))
      const G = lip.map(([s, h]) => facadePoint(s, h, 0.015 * frac))
      const I = inner.map(([s, h]) => facadePoint(s, h, 0.02 * frac))
      const apex = facadePoint(sc, ch, APEX * frac)
      const uvO = corners.map(([s, h]) => [s, h])
      const uvF = lip.map(([s, h]) => [s, h])
      const uvI = inner.map(([s, h]) => [s, h])
      const uvA = [sc, ch]
      // No two panels are quite alike: anodising and glass batches vary by a few per cent.
      const tone = 0.93 + rand() * 0.1
      panel.tint = [tone, tone, tone * (0.99 + rand() * 0.02)]
      const gt = 0.9 + rand() * 0.16
      glass.tint = [gt, gt, gt * (1 + rand() * 0.05)]
      for (let k = 0; k < 4; k++) {
        const j = (k + 1) % 4
        frame.quad(O[k], O[j], F[j], F[k], uvO[k], uvO[j], uvF[j], uvF[k])
        gasket.quad(F[k], F[j], G[j], G[k], uvF[k], uvF[j], uvF[j], uvF[k])
        gasket.quad(G[k], G[j], I[j], I[k], uvF[k], uvF[j], uvI[j], uvI[k])
        // Facets meeting the top corner (k = 0, 1) are panels; those meeting the bottom are glass.
        ;(k < 2 ? panel : glass).tri(I[k], I[j], apex, uvI[k], uvI[j], uvA)
      }
    }
  }
  panel.mesh(c.panel, parent, 'skin_panels')
  glass.mesh(c.facetGlass, parent, 'skin_glass')
  frame.mesh(c.frame, parent, 'skin_frame')
  gasket.mesh(c.gasket, parent, 'skin_gaskets', false)

  buildSkinEdges(parent, c)
}

/** The skin's crown coping, its soffit and fascia over the shopfronts, the white band and the backing wall. */
function buildSkinEdges(parent: Object3D, c: MallMaterials) {
  const L = LOOP.length
  const top = skinTop
  const bot = skinBottom
  const coping = new Tris()
  const backing = new Tris()
  const soffit = new Tris()
  const fascia = new Tris()
  const band = new Tris()

  // Crown: a flat aluminium coping from the skin's face back over the backing wall, and its edge.
  ribbon(coping, 0, L, (s) => facadePoint(s, top(s), TRIM_OUT), (s) => plumb(s, top(s), BACKING - 0.12))
  ribbon(coping, 0, L, (s) => facadePoint(s, top(s) - 0.2, TRIM_OUT), (s) => facadePoint(s, top(s), TRIM_OUT))
  // Backing wall: closes the skin from behind, seen from the roof and between facets.
  ribbon(backing, 0, L, (s) => plumb(s, bot(s), BACKING), (s) => plumb(s, top(s), BACKING))

  // Soffit under the overhang, from the shopfront line out to the skin's face.
  ribbon(soffit, 0, L, (s) => plumb(s, bot(s) - 0.05, SHOPFRONT), (s) => facadePoint(s, bot(s) - 0.05, TRIM_OUT))

  // A slim aluminium fascia along the skin's lower edge, except where the white band takes over.
  for (const [s0, s1] of LOOP.runs((s) => !inSwoosh(s))) {
    ribbon(fascia, s0, s1, (s) => facadePoint(s, bot(s) - 0.05, TRIM_OUT), (s) => facadePoint(s, bot(s) + 0.3, TRIM_OUT))
    ribbon(fascia, s0, s1, (s) => facadePoint(s, bot(s) + 0.3, TRIM_OUT), (s) => facadePoint(s, bot(s) + 0.3, 0))
  }

  // The white band: a deeper ACP fin continuing the entrance canopy, tapering at each end.
  for (const [s0, s1] of LOOP.runs(inSwoosh)) {
    const taper = (s: number) => Math.min(1, (s - s0) / 1.5, (s1 - s) / 1.5)
    const lo = (s: number) => bot(s) - 0.35 * taper(s)
    const hi = (s: number) => bot(s) + 0.6 * taper(s)
    const out = (s: number) => TRIM_OUT + 0.18 * taper(s)
    ribbon(band, s0, s1, (s) => facadePoint(s, lo(s), out(s)), (s) => facadePoint(s, hi(s), out(s)), 0.15)
    ribbon(band, s0, s1, (s) => facadePoint(s, hi(s), out(s)), (s) => facadePoint(s, hi(s), 0), 0.15)
    ribbon(band, s0, s1, (s) => plumb(s, lo(s), SHOPFRONT + 0.6), (s) => facadePoint(s, lo(s), out(s)), 0.15)
    ribbon(band, s0, s1, (s) => plumb(s, bot(s) - 0.05, SHOPFRONT + 0.6), (s) => plumb(s, lo(s), SHOPFRONT + 0.6), 0.15)
  }

  coping.mesh(c.frame, parent, 'skin_coping')
  backing.mesh(c.backing, parent, 'skin_backing')
  soffit.mesh(c.soffit, parent, 'skin_soffit', false)
  fascia.mesh(c.frame, parent, 'skin_fascia')
  band.mesh(c.acp, parent, 'skin_band')
}
