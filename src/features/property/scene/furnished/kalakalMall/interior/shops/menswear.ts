import { BufferGeometry, CatmullRomCurve3, CylinderGeometry, ExtrudeGeometry, Float32BufferAttribute, Group, Shape, SphereGeometry, TorusGeometry, Vector3, type Material, type Object3D } from 'three'
import { shoe } from './goods'
import { mesh, PI, type Shop } from './kit'
import { neckline, shell, trousers, type Cut, type WomenswearMaterials } from './womenswear'

/*
 * Menswear, cut as a tailor and a shirtmaker cut it, on the closed cloth shell of womenswear.ts
 * (cross-sections from the shoulders to the hem, folds, a top edge round the neck):
 *
 *   jacket   structured shoulders, a waist suppressed and the skirt flared a touch, the front open
 *            in a V to the top button; notch lapels lying on the chest, the collar round the back
 *            of the neck, two buttons (or six, double-breasted), flap pockets and a breast welt;
 *            set-in sleeves falling a little forward, three buttons at each cuff; the shirt in the V
 *   coat     the same, to the knee
 *   shirt    a collar on its stand with its points, the placket and its buttons, a chest pocket,
 *            long sleeves to buttoned cuffs
 *   tee      a rib crew neck, short sleeves; the polo has a collar and a three-button placket
 *   knit     rib at the neck, the cuffs and the hem
 *
 * Trousers and jeans hang from their waistbands on clip hangers; the kurta has a band collar.
 * Every garment's shoulders are at its local y = 0, its front towards +z. With `onBody` it is cut
 * fuller, to dress the male mannequin at the end of this file.
 */

export type MenStyle = 'jacket' | 'coat' | 'shirt' | 'tee' | 'polo' | 'knit' | 'trousers' | 'jeans' | 'kurta'

export interface MenOpts {
  /** The shirt in a jacket's V. */
  inner?: Material
  buttons?: Material
  doubleBreasted?: boolean
  onBody?: boolean
}

const smooth = (v: number) => {
  const c = Math.max(0, Math.min(1, v))
  return c * c * (3 - 2 * c)
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
/** Piecewise-smooth through (v, value) knots. */
const knots = (pts: [number, number][]) => (v: number) => {
  for (let i = 1; i < pts.length; i++) if (v <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], smooth((v - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])))
  return pts[pts.length - 1][1]
}

/** A sleeve: a tapering tube from the armhole that falls and curves forward a little, its cuff closed. */
function sleeve(p: Object3D, x: number, y: number, len: number, r0: number, r1: number, side: number, mat: Material, out: number, cuff?: { mat: Material; h: number }) {
  const pts = [new Vector3(x, y, 0), new Vector3(x + side * out * 0.5, y - len * 0.35, 0.012), new Vector3(x + side * out * 0.9, y - len * 0.75, 0.035), new Vector3(x + side * out, y - len, 0.05)]
  const curve = new CatmullRomCurve3(pts)
  const n = 18
  const ring = 16
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const c = curve.getPoint(t)
    const tan = curve.getTangent(t)
    const nrm = new Vector3(0, 0, 1).cross(tan).normalize()
    const bin = new Vector3().crossVectors(tan, nrm).normalize()
    const r = lerp(r0, r1, t)
    for (let j = 0; j <= ring; j++) {
      const a = (j / ring) * PI * 2
      // A sleeve is flatter side to side than front to back where it hangs; a soft crease runs down its front.
      const crease = 1 - 0.06 * Math.max(0, Math.cos(a - PI / 2)) ** 8
      const v = c.clone().addScaledVector(nrm, Math.cos(a) * r * 0.86 * crease).addScaledVector(bin, Math.sin(a) * r * crease)
      pos.push(v.x, v.y, v.z)
      uv.push((j / ring) * 2 * PI * r, t * len)
    }
  }
  for (let i = 0; i < n; i++)
    for (let j = 0; j < ring; j++) {
      const a0 = i * (ring + 1) + j
      const b0 = a0 + ring + 1
      idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1)
    }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  mesh(p, g, mat)
  const end = curve.getPoint(1)
  const tanEnd = curve.getTangent(1)
  // The cuff (or the sleeve's closed end), its axis along the sleeve's end.
  const h = cuff ? cuff.h : 0.006
  const cap = mesh(p, new CylinderGeometry(r1 * (cuff ? 1.04 : 0.98), r1 * (cuff ? 1.04 : 0.98), h, 16), cuff ? cuff.mat : mat, end.x - (tanEnd.x * h) / 2, end.y - (tanEnd.y * h) / 2, end.z - (tanEnd.z * h) / 2, true)
  cap.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), tanEnd.clone().normalize())
  cap.scale.x = 0.86
  return { end, tan: tanEnd }
}

/** A button: a shallow disc with its four holes' dimple. */
function btn(p: Object3D, mat: Material, x: number, y: number, z: number, r = 0.009, tiltY = 0) {
  const b = mesh(p, new CylinderGeometry(r, r * 0.92, 0.003, 16), mat, x, y, z, false)
  b.rotation.x = PI / 2
  b.rotation.z = tiltY
  return b
}

/** Where a cut's front surface lies at width x and depth v (for laying details on it). */
function frontOf(c: Cut, x: number, v: number) {
  const a = c.a(v)
  const b = c.b(v)
  const k = Math.min(0.98, Math.abs(x) / a)
  return b * Math.sqrt(1 - k * k)
}

/** A flat piece (a lapel, a collar point, a pocket flap) cut from an outline and laid at z, a little thick. */
function piece(p: Object3D, pts: [number, number][], z: number, mat: Material, t = 0.004, tiltX = 0) {
  const s = new Shape()
  s.moveTo(pts[0][0], pts[0][1])
  for (const q of pts.slice(1)) s.lineTo(q[0], q[1])
  s.closePath()
  const o = mesh(p, new ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2 }), mat, 0, 0, z, false)
  o.rotation.x = tiltX
  return o
}

/** A garment of `style` in `cloth`; returns its group and its length. */
export function menGarment(_s: Shop, m: WomenswearMaterials, p: Object3D, style: MenStyle, cloth: Material, o: MenOpts = {}) {
  const g = new Group()
  p.add(g)
  const body = !!o.onBody
  const W = body ? 1.06 : 1
  const D = body ? 1.55 : 1
  const buttons = o.buttons ?? m.std({ color: '#2a2420', roughness: 0.35 }, 0.4)
  let L = 0.75
  switch (style) {
    case 'jacket':
    case 'coat': {
      const coat = style === 'coat'
      L = coat ? 1.06 : 0.76
      const vb = coat ? 0.36 : 0.44
      const cut: Cut = {
        len: L,
        a: (v) => W * knots(coat ? [[0, 0.24], [0.08, 0.225], [0.3, 0.215], [0.5, 0.215], [1, 0.25]] : [[0, 0.24], [0.08, 0.222], [0.3, 0.214], [0.55, 0.198], [1, 0.212]])(v),
        b: (v) => D * knots([[0, 0.06], [0.1, 0.085], [0.3, 0.09], [0.6, 0.082], [1, coat ? 0.1 : 0.084]])(v),
        // The front open in a V to the top button; the armholes small where the sleeves are set in.
        top: (th) => {
          const front = Math.abs(((th - PI / 2 + PI * 3) % (PI * 2)) - PI)
          const v = vb * L * Math.max(0, 1 - front / 0.34) ** 0.8
          const side = Math.min(Math.abs(((th + PI * 3) % (PI * 2)) - PI), Math.abs(((th - PI + PI * 3) % (PI * 2)) - PI))
          return Math.max(v, 0.03 * Math.max(0, 1 - side / 0.4), 0.015)
        },
        // Tailoring hangs nearly smooth: only the faintest drape towards the hem.
        folds: 5,
        amp: (v) => 0.0008 + 0.0018 * v * v,
        seed: Math.round(L * 1000),
      }
      mesh(g, shell(cut, 72, 30), cloth)
      // The shirt behind the V.
      if (o.inner) {
        const zf = frontOf(cut, 0, 0.2) - 0.012
        piece(g, [[-0.075, -0.015], [0.075, -0.015], [0.0, -vb * L - 0.01]], zf, o.inner, 0.002)
        for (const sx of [-1, 1]) piece(g, [[0, -0.015], [sx * 0.055, -0.005], [sx * 0.02, -0.075]], zf + 0.004, o.inner, 0.002)
      }
      // The lapels, rolled open on the chest, a notch where they meet the collar.
      for (const sx of [-1, 1]) {
        const vz = (v: number, x: number) => frontOf(cut, x, v) + 0.004
        const zz = vz(0.15, sx * 0.08)
        const lap = coat ? 1.18 : 1
        const pts: [number, number][] = [
          [sx * 0.055, -0.012],
          [sx * 0.085, -0.03],
          [sx * 0.1 * lap, -0.1 * lap],
          [sx * 0.076 * lap, -0.112 * lap],
          [sx * 0.112 * lap, -0.128 * lap],
          [sx * 0.03, -vb * L + 0.01],
          [sx * 0.012, -vb * L + 0.02],
          [sx * 0.045, -0.03],
        ]
        const l = piece(g, pts, zz, cloth, 0.004, -0.06)
        l.position.z += 0.004
      }
      // The collar round the back of the neck.
      const col = mesh(g, new TorusGeometry(0.068, 0.014, 8, 24, PI * 1.25), cloth, 0, -0.02, -0.005, false)
      col.rotation.set(PI / 2, 0, -PI * 0.125 + PI)
      col.scale.set(1, 0.95 * D, 1)
      // Buttons.
      const yb = -vb * L - 0.012
      if (o.doubleBreasted)
        for (let r2 = 0; r2 < 3; r2++) for (const sx of [-1, 1]) btn(g, buttons, sx * 0.055, yb - r2 * 0.075, frontOf(cut, 0.055, vb + r2 * 0.1) + 0.004)
      else for (let r2 = 0; r2 < 2; r2++) btn(g, buttons, 0.004, yb - r2 * 0.1, frontOf(cut, 0, vb + r2 * 0.13) + 0.004)
      // Flap pockets at the hips, a welt at the breast.
      const vp = coat ? 0.55 : 0.68
      for (const sx of [-1, 1]) {
        const x = sx * 0.12 * W
        const fl = piece(g, [[-0.075, 0], [0.075, 0], [0.075, -0.05], [-0.075, -0.05]], 0, cloth, 0.003)
        fl.position.set(x, -vp * L, frontOf(cut, x, vp) + 0.002)
        fl.rotation.y = sx * Math.atan2(cut.a(vp) * 0.6, cut.b(vp) * 3) * 0.45
      }
      const welt = piece(g, [[-0.05, 0], [0.05, 0], [0.05, -0.018], [-0.05, -0.018]], 0, cloth, 0.002)
      welt.position.set(0.11 * W, -0.25 * L, frontOf(cut, 0.11, 0.25) + 0.003)
      welt.rotation.y = 0.32
      // The sleeves, with three buttons at each cuff.
      for (const sx of [-1, 1]) {
        const { end } = sleeve(g, sx * cut.a(0.03) * 0.97, -0.035, coat ? 0.64 : 0.61, 0.07 * W, 0.054 * W, sx, cloth, body ? 0.03 : 0.014)
        // Three buttons on the outside of each cuff, sewn to the sleeve's surface just above its end.
        for (let i = 0; i < 3; i++) {
          const b2 = btn(g, buttons, end.x + sx * 0.054 * W * 0.86, end.y + 0.035 + i * 0.02, end.z - 0.005, 0.0055)
          b2.rotation.set(0, 0, PI / 2)
        }
      }
      break
    }
    case 'shirt': {
      L = 0.8
      const cut: Cut = {
        len: L,
        a: (v) => W * knots([[0, 0.215], [0.08, 0.205], [0.5, 0.2], [1, 0.205]])(v),
        b: (v) => D * knots([[0, 0.05], [0.1, 0.07], [0.5, 0.068], [1, 0.064]])(v),
        top: neckline('crew', 0.025),
        folds: 7,
        amp: (v) => 0.003 + 0.006 * v,
        seed: 811,
      }
      mesh(g, shell(cut, 64, 26), cloth)
      // The collar: its stand round the neck, the points falling forward.
      const stand = mesh(g, new TorusGeometry(0.068, 0.016, 6, 32), cloth, 0, -0.012, 0.0, false)
      stand.rotation.x = PI / 2
      stand.scale.set(1, D * 0.95, 1.4)
      for (const sx of [-1, 1]) piece(g, [[sx * 0.008, -0.025], [sx * 0.07, -0.02], [sx * 0.045, -0.095]], frontOf(cut, 0.03, 0.06) + 0.012, cloth, 0.003, -0.25)
      // The placket and its buttons; a chest pocket.
      const pz = (v: number) => frontOf(cut, 0, v) + 0.002
      const pl = piece(g, [[-0.016, 0], [0.016, 0], [0.016, -(L - 0.1)], [-0.016, -(L - 0.1)]], 0, cloth, 0.002)
      pl.position.set(0, -0.08, pz(0.3))
      for (let i = 0; i < 7; i++) btn(g, buttons, 0, -0.1 - i * 0.095, pz(0.12 + i * 0.12) + 0.005, 0.0055)
      const pk = piece(g, [[-0.055, 0], [0.055, 0], [0.055, -0.11], [0, -0.125], [-0.055, -0.11]], 0, cloth, 0.002)
      pk.position.set(0.1 * W, -0.19, frontOf(cut, 0.1, 0.24) + 0.002)
      pk.rotation.y = 0.3
      for (const sx of [-1, 1]) sleeve(g, sx * cut.a(0.03) * 0.97, -0.03, 0.6, 0.056 * W, 0.042 * W, sx, cloth, body ? 0.03 : 0.012, { mat: cloth, h: 0.065 })
      break
    }
    case 'tee':
    case 'polo': {
      L = 0.72
      const cut: Cut = {
        len: L,
        a: (v) => W * knots([[0, 0.23], [0.1, 0.23], [1, 0.225]])(v),
        b: (v) => D * knots([[0, 0.05], [0.12, 0.065], [1, 0.062]])(v),
        top: neckline('crew', 0.02),
        folds: 6,
        amp: (v) => 0.004 + 0.006 * v,
        seed: 812,
      }
      mesh(g, shell(cut, 56, 22), cloth)
      // Short sleeves, angled out from the shoulder.
      for (const sx of [-1, 1]) sleeve(g, sx * cut.a(0.03) * 0.98, -0.04, 0.22, 0.085 * W, 0.075 * W, sx, cloth, 0.06)
      if (style === 'polo') {
        const stand = mesh(g, new TorusGeometry(0.07, 0.012, 6, 32), cloth, 0, -0.012, 0, false)
        stand.rotation.x = PI / 2
        stand.scale.set(1, D * 0.9, 1.3)
        for (const sx of [-1, 1]) piece(g, [[sx * 0.01, -0.025], [sx * 0.075, -0.02], [sx * 0.05, -0.09]], frontOf(cut, 0.03, 0.06) + 0.012, cloth, 0.003, -0.25)
        const pl = piece(g, [[-0.016, 0], [0.016, 0], [0.016, -0.13], [-0.016, -0.13]], 0, cloth, 0.002)
        pl.position.set(0, -0.05, frontOf(cut, 0, 0.12) + 0.002)
        for (let i = 0; i < 3; i++) btn(g, buttons, 0, -0.07 - i * 0.04, frontOf(cut, 0, 0.1 + i * 0.05) + 0.006, 0.005)
      } else {
        const rib = mesh(g, new TorusGeometry(0.075, 0.01, 6, 32), cloth, 0, -0.03, 0.005, false)
        rib.rotation.x = PI / 2 - 0.2
        rib.scale.set(1, D * 0.95, 1)
      }
      break
    }
    case 'knit': {
      L = 0.66
      const cut: Cut = {
        len: L,
        a: (v) => W * knots([[0, 0.225], [0.1, 0.225], [0.88, 0.22], [1, 0.2]])(v),
        b: (v) => D * knots([[0, 0.05], [0.12, 0.068], [0.88, 0.066], [1, 0.06]])(v),
        top: neckline('crew', 0.02),
        folds: 5,
        amp: (v) => 0.003 + 0.004 * v,
        seed: 813,
      }
      mesh(g, shell(cut, 56, 22), cloth)
      const rib = mesh(g, new TorusGeometry(0.075, 0.013, 6, 32), cloth, 0, -0.03, 0.005, false)
      rib.rotation.x = PI / 2 - 0.2
      rib.scale.set(1, D * 0.95, 1)
      // The rib band at the hem.
      const hem = mesh(g, new CylinderGeometry(1, 1, 0.05, 48, 1, true), cloth, 0, -L + 0.025, 0, false)
      hem.scale.set(cut.a(1) * 0.98, 1, cut.b(1) * 0.98)
      for (const sx of [-1, 1]) sleeve(g, sx * cut.a(0.03) * 0.97, -0.035, 0.6, 0.058 * W, 0.04 * W, sx, cloth, body ? 0.03 : 0.012, { mat: cloth, h: 0.06 })
      break
    }
    case 'trousers':
    case 'jeans': {
      trousers(m, g, cloth, style === 'jeans' ? 'jeans' : 'straight', 1.04)
      // Belt loops round the waistband.
      for (const a of [-1.2, -0.45, 0.45, 1.2, PI - 0.5, PI + 0.5]) mesh(g, new CylinderGeometry(0.004, 0.004, 0.04, 4), cloth, Math.sin(a) * 0.162, -0.014, Math.cos(a) * 0.062, false).scale.set(1.8, 1, 0.6)
      L = 1.04
      break
    }
    case 'kurta': {
      // A straight kurta to the knee: a band collar, a short placket of three buttons, side slits,
      // long sleeves closed at the wrist.
      L = 1.05
      const cut: Cut = {
        len: L,
        a: (v) => W * knots([[0, 0.21], [0.1, 0.2], [0.5, 0.205], [1, 0.235]])(v),
        b: (v) => D * knots([[0, 0.05], [0.12, 0.068], [1, 0.075]])(v),
        top: neckline('crew', 0.025),
        folds: 7,
        amp: (v) => 0.003 + 0.008 * v,
        seed: 814,
      }
      mesh(g, shell(cut, 64, 28), cloth)
      const band = mesh(g, new TorusGeometry(0.068, 0.014, 6, 32), cloth, 0, -0.012, 0, false)
      band.rotation.x = PI / 2
      band.scale.set(1, D * 0.95, 1.6)
      const pl = piece(g, [[-0.015, 0], [0.015, 0], [0.015, -0.22], [-0.015, -0.22]], 0, cloth, 0.002)
      pl.position.set(0, -0.04, frontOf(cut, 0, 0.12) + 0.002)
      for (let i = 0; i < 3; i++) btn(g, buttons, 0, -0.07 - i * 0.065, frontOf(cut, 0, 0.08 + i * 0.07) + 0.006, 0.005)
      for (const sx of [-1, 1]) sleeve(g, sx * cut.a(0.03) * 0.97, -0.03, 0.6, 0.056 * W, 0.042 * W, sx, cloth, body ? 0.03 : 0.012, { mat: cloth, h: 0.04 })
      break
    }
  }
  g.userData.len = L
  return g
}

/**
 * A male display mannequin, 1.85 m, dressed: trousers on his legs, shoes, a shirt and jacket (or a
 * knit) on his torso, his arms easy at his sides in its sleeves, an egg head. Faces +z.
 */
export function maleMannequin(s: Shop, m: WomenswearMaterials, p: Object3D, outfit: { jacket?: Material; top: MenStyle; topCloth: Material; shirt?: Material; trousers: Material; shoes: Material }) {
  const g = new Group()
  p.add(g)
  const skin = m.mannequin
  mesh(g, new CylinderGeometry(0.22, 0.22, 0.012, 40), m.black, 0, 0.006, 0)
  // The legs in their trousers: each a cloth shell from the hip to the shoe, the hems breaking on it.
  for (const sx of [-1, 1]) {
    const cut: Cut = {
      len: 0.94,
      a: (v) => knots([[0, 0.088], [0.4, 0.078], [1, 0.07]])(v),
      b: (v) => knots([[0, 0.095], [0.4, 0.08], [1, 0.07]])(v),
      top: () => 0,
      folds: 4,
      amp: (v) => 0.002 + (v > 0.9 ? 0.006 : 0),
      seed: 820 + sx,
    }
    mesh(g, shell(cut, 28, 20), outfit.trousers, sx * 0.095, 1.0, 0)
    shoe(s, g, 'derby', outfit.shoes, sx * 0.1, 0.0, -0.06, -sx * 0.06, { right: sx > 0 })
  }
  // The seat of the trousers, bridging the legs at the hips.
  const seat = mesh(g, new SphereGeometry(1, 32, 16), outfit.trousers, 0, 0.98, 0)
  seat.scale.set(0.19, 0.12, 0.12)
  // The torso: the top's shell worn on the body, shoulders at 1.5 m.
  const top = new Group()
  top.position.y = 1.5
  g.add(top)
  if (outfit.top === 'jacket' || outfit.top === 'coat') menGarment(s, m, top, outfit.top, outfit.topCloth, { onBody: true, inner: outfit.shirt })
  else menGarment(s, m, top, outfit.top, outfit.topCloth, { onBody: true })
  // A belt line where the top would be tucked (under a knit, a hint of it).
  // The hands at the sleeves' ends, the neck and the head.
  for (const sx of [-1, 1]) {
    const h = mesh(g, new SphereGeometry(1, 14, 10), skin, sx * 0.275, 0.82, 0.06)
    h.scale.set(0.028, 0.075, 0.045)
  }
  mesh(g, new CylinderGeometry(0.048, 0.055, 0.12, 20), skin, 0, 1.54, 0.0)
  const head = mesh(g, new SphereGeometry(0.1, 32, 24), skin, 0, 1.71, 0.01)
  head.scale.set(0.86, 1.16, 0.96)
  return g
}

