import { BufferGeometry, CylinderGeometry, Group, MeshStandardMaterial, PlaneGeometry, SphereGeometry, TorusGeometry, Vector3, type Material, type Object3D } from 'three'
import { rng } from '../../../textures'
import { place } from '../signs'
import { pans, type BeautyMaterials, type LabelSpec } from './beautyArt'
import { lathe, live, play, tube } from './cafe'
import { at, mesh, PI, type Shop } from './kit'

/*
 * The boutique's products, each made to its real size and as its packaging is made: glass with
 * real thickness and the liquid inside it, metal collars and caps, pumps, droppers and wands,
 * printed labels from the house's label atlas. Every product stands on its base at local
 * (0, 0, 0) facing +z.
 */

type B = BeautyMaterials

/** A label quad on a face: `w` × `h`, its centre at (x, y, z), facing yaw. */
function label(b: B, p: Object3D, spec: LabelSpec, w: number, h: number, x: number, y: number, z: number, yaw = 0) {
  return place(p, w, h, b.label({ ...spec, w: spec.w ?? Math.round(256 * Math.min(1, w / h)), h: spec.h ?? Math.round(256 * Math.min(1, h / w)) }), b.labelMat, x, y, z, yaw)
}

/* ---------- lips ---------- */

let bulletGeo: BufferGeometry | null = null
/** A lipstick bullet: a cylinder of colour with its top cut on the slant, as it comes from the mould. */
function bulletGeometry() {
  if (bulletGeo) return bulletGeo
  const r = 0.0072
  const h = 0.024
  const g = new CylinderGeometry(r, r, h, 24, 1)
  g.translate(0, h / 2, 0)
  const pos = g.attributes.position
  const v = new Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    if (v.y > h - 1e-4) pos.setY(i, h - 0.0015 - ((v.x + r) / (2 * r)) * 0.009)
  }
  g.computeVertexNormals()
  bulletGeo = g
  return g
}

/** A lipstick: the metal case, its band, the inner sleeve and the bullet; capped, or open with the cap laid beside it. */
export function lipstick(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, shade: Material, open: boolean, body: Material = b.gold) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.cyl(g, 0.0105, 0.0105, 0.046, body, 0, 0.023, 0, 24)
  k.cyl(g, 0.0108, 0.0108, 0.003, b.gold, 0, 0.0475, 0, 24)
  const turn = live(g, 'twist', 'beauty')
  k.cyl(turn, 0.0085, 0.0085, 0.012, b.gold, 0, 0.055, 0, 24)
  const bullet = mesh(turn, bulletGeometry(), shade, 0, 0.061, 0, false)
  bullet.rotation.y = PI / 2
  if (!open) {
    k.cyl(g, 0.011, 0.011, 0.042, body, 0, 0.049 + 0.021, 0, 24)
    turn.visible = false
  }
  return { g, turn }
}

/** A lip gloss: a clear tube showing its colour, a long gold cap over the wand. */
export function lipGloss(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, shade: Material) {
  const g = at(p, x, y, z, yaw)
  lathe(g, [[0.001, 0], [0.0085, 0], [0.009, 0.004], [0.009, 0.068], [0.0065, 0.074], [0.001, 0.074]], b.clearGlass, 0, 0, 0, 20, false)
  lathe(g, [[0.001, 0.003], [0.0072, 0.003], [0.0072, 0.066], [0.001, 0.066]], shade, 0, 0, 0, 16, false)
  s.e.k.cyl(g, 0.0092, 0.0092, 0.048, b.gold, 0, 0.074 + 0.024, 0, 20)
  return g
}

/* ---------- face ---------- */

/** A foundation: a heavy square glass bottle of the shade, a gold collar, a pump. */
export function foundation(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, shade: Material, spec: LabelSpec) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.soft(g, 0.038, 0.088, 0.026, 0.004, b.clearGlass, 0, 0.044, 0)
  k.soft(g, 0.03, 0.074, 0.018, 0.003, shade, 0, 0.042, 0)
  k.cyl(g, 0.009, 0.009, 0.012, b.gold, 0, 0.094, 0, 20)
  k.cyl(g, 0.006, 0.006, 0.012, b.blackGloss, 0, 0.106, 0, 16)
  k.box(g, 0.006, 0.006, 0.016, b.blackGloss, 0, 0.11, 0.006)
  label(b, g, spec, 0.028, 0.03, 0, 0.032, 0.0132)
  return g
}

/** A concealer: a slim clear tube of the shade with a rose-gold cap. */
export function concealer(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, shade: Material) {
  const g = at(p, x, y, z, yaw)
  lathe(g, [[0.001, 0], [0.0068, 0], [0.0068, 0.072], [0.001, 0.072]], b.clearGlass, 0, 0, 0, 16, false)
  lathe(g, [[0.001, 0.002], [0.0055, 0.002], [0.0055, 0.068], [0.001, 0.068]], shade, 0, 0, 0, 12, false)
  s.e.k.cyl(g, 0.007, 0.007, 0.055, b.roseGold, 0, 0.072 + 0.0275, 0, 16)
  return g
}

/**
 * A compact of pressed powder: a rose-gold case, the powder in its pan, the lid on its hinge (a
 * door_ about x) with a mirror inside it; `open` stands it open.
 */
export function compact(s: Shop, b: B, p: Object3D, name: string, x: number, y: number, z: number, yaw: number, powder: Material, open: boolean) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.cyl(g, 0.036, 0.036, 0.009, b.roseGold, 0, 0.0045, 0, 40)
  k.cyl(g, 0.03, 0.03, 0.002, powder, 0, 0.0095, 0, 32)
  const lid = new Group()
  lid.name = `door_beauty_compact_${name}`
  lid.userData.label = 'Compact lid'
  lid.userData.axis = 'x'
  lid.userData.openAngle = -1.9
  lid.position.set(0, 0.009, -0.036)
  g.add(lid)
  k.cyl(lid, 0.036, 0.036, 0.006, b.roseGold, 0, 0.003, 0.036, 40).userData.front = true
  const glass = mesh(lid, new SphereGeometry(0.031, 24, 4, 0, PI * 2, PI - 0.01, 0.01), b.mirror, 0, -0.0003, 0.036, false)
  glass.scale.y = 0.01
  k.cyl(lid, 0.031, 0.031, 0.0006, b.mirror, 0, -0.0002, 0.036, 32)
  k.cyl(lid, 0.012, 0.012, 0.0008, b.gold, 0, 0.0062, 0.036, 24)
  if (open) {
    lid.userData.closedY = 0
    lid.userData.open = true
    lid.rotation.x = lid.userData.openAngle as number
  }
  return g
}

/**
 * An eyeshadow palette: a slim case, its pans of shades under the lid (a door_ about x) with a
 * mirror inside and the house's name on its face.
 */
export function palette(s: Shop, b: B, p: Object3D, name: string, x: number, y: number, z: number, yaw: number, shades: string[], cover: Material, open: boolean) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  const W = 0.13
  const D = 0.09
  k.soft(g, W, 0.01, D, 0.003, cover, 0, 0.005, 0)
  const t = b.canvas(512, 384, pans(shades, 4, 3))
  const panMat = new MeshStandardMaterial({ map: t, roughness: 0.75 })
  panMat.userData.interior = true
  const face = mesh(g, new PlaneGeometry(W - 0.012, D - 0.012), panMat, 0, 0.0102, 0, false)
  face.rotation.x = -PI / 2
  const lid = new Group()
  lid.name = `door_beauty_palette_${name}`
  lid.userData.label = 'Palette lid'
  lid.userData.axis = 'x'
  lid.userData.openAngle = -1.85
  lid.position.set(0, 0.01, -D / 2)
  g.add(lid)
  k.soft(lid, W, 0.006, D, 0.003, cover, 0, 0.003, D / 2).userData.front = true
  const mirror = mesh(lid, new PlaneGeometry(W - 0.016, D - 0.016), b.mirror, 0, -0.0002, D / 2, false)
  mirror.rotation.x = PI / 2
  place(lid, 0.07, 0.035, b.label({ name: 'Rose Nude', line: '12 eyeshadows', ground: '#e8bcae', ink: '#7a4a3c', w: 256, h: 128 }), b.labelMat, 0, 0.0062, D / 2, 0, true)
  if (open) {
    lid.userData.closedY = 0
    lid.userData.open = true
    lid.rotation.x = lid.userData.openAngle as number
  }
  return g
}

/* ---------- eyes and nails ---------- */

/** A mascara: a black lacquered tube, a gold band, the cap; standing. */
export function mascara(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.cyl(g, 0.0078, 0.0078, 0.07, b.blackGloss, 0, 0.035, 0, 20)
  k.cyl(g, 0.008, 0.008, 0.005, b.gold, 0, 0.0725, 0, 20)
  k.cyl(g, 0.0078, 0.0072, 0.065, b.blackGloss, 0, 0.075 + 0.0325, 0, 20)
  return g
}

/** An eyeliner pen: slim, matte, a gold clip on the cap. */
export function eyeliner(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.cyl(g, 0.005, 0.005, 0.09, b.blackMatte, 0, 0.045, 0, 16)
  k.cyl(g, 0.0053, 0.0053, 0.045, b.blackMatte, 0, 0.09 + 0.0225, 0, 16)
  k.box(g, 0.002, 0.03, 0.003, b.gold, 0, 0.11, 0.006)
  return g
}

/** A nail polish: a small square bottle of the colour, a tall cap. */
export function nailPolish(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, colour: Material, cap: Material = b.blackGloss) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.soft(g, 0.03, 0.034, 0.03, 0.006, b.clearGlass, 0, 0.017, 0)
  k.soft(g, 0.024, 0.028, 0.024, 0.005, colour, 0, 0.016, 0)
  k.cyl(g, 0.006, 0.006, 0.006, b.clearGlass, 0, 0.037, 0, 12)
  k.cyl(g, 0.008, 0.0075, 0.046, cap, 0, 0.04 + 0.023, 0, 20)
  return g
}

/* ---------- fragrance ---------- */

export type FlaconStyle = 'block' | 'round' | 'tall'

/**
 * A perfume: thick clear glass with the juice inside it, a collar and a cap (a cast gold cube, a
 * ribbed cylinder or a black column), the label on its face.
 */
export function perfume(s: Shop, b: B, p: Object3D, style: FlaconStyle, x: number, y: number, z: number, yaw: number, juice: Material, spec: LabelSpec, scale = 1) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  g.scale.setScalar(scale)
  let top = 0
  if (style === 'block') {
    k.soft(g, 0.075, 0.085, 0.042, 0.006, b.clearGlass, 0, 0.0425, 0)
    k.soft(g, 0.061, 0.068, 0.028, 0.004, juice, 0, 0.04, 0)
    top = 0.085
    k.cyl(g, 0.009, 0.009, 0.008, b.gold, 0, top + 0.004, 0, 20)
    k.soft(g, 0.038, 0.034, 0.038, 0.004, b.gold, 0, top + 0.008 + 0.017, 0)
    label(b, g, spec, 0.044, 0.024, 0, 0.042, 0.0212)
  } else if (style === 'round') {
    lathe(g, [[0.001, 0], [0.026, 0], [0.04, 0.025], [0.042, 0.04], [0.038, 0.06], [0.016, 0.075], [0.01, 0.078], [0.001, 0.078]], b.clearGlass, 0, 0, 0, 32, false)
    lathe(g, [[0.001, 0.006], [0.024, 0.006], [0.034, 0.025], [0.035, 0.04], [0.031, 0.056], [0.001, 0.056]], juice, 0, 0, 0, 24, false)
    top = 0.078
    k.cyl(g, 0.009, 0.009, 0.006, b.gold, 0, top + 0.003, 0, 20)
    const cap = lathe(g, [[0.001, 0], [0.014, 0], [0.014, 0.05], [0.012, 0.054], [0.001, 0.054]], b.gold, 0, top + 0.006, 0, 24)
    void cap
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2
      k.box(g, 0.002, 0.046, 0.002, b.gold, Math.cos(a) * 0.0142, top + 0.006 + 0.026, Math.sin(a) * 0.0142, false)
    }
    label(b, g, spec, 0.038, 0.02, 0, 0.038, 0.0422)
  } else {
    lathe(g, [[0.001, 0], [0.022, 0], [0.023, 0.004], [0.023, 0.118], [0.016, 0.124], [0.001, 0.124]], b.clearGlass, 0, 0, 0, 28, false)
    lathe(g, [[0.001, 0.005], [0.019, 0.005], [0.019, 0.1], [0.001, 0.1]], juice, 0, 0, 0, 24, false)
    top = 0.124
    k.cyl(g, 0.008, 0.008, 0.006, b.gold, 0, top + 0.003, 0, 16)
    k.cyl(g, 0.0175, 0.0175, 0.045, b.blackGloss, 0, top + 0.006 + 0.0225, 0, 28)
    label(b, g, spec, 0.03, 0.04, 0, 0.06, 0.0232)
  }
  return g
}

/** A perfume's box: board in the house colour, the name on it. */
export function perfumeBox(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, w: number, h: number, d: number, board: Material, spec: LabelSpec) {
  const g = at(p, x, y, z, yaw)
  s.e.k.box(g, w, h, d, board, 0, h / 2, 0)
  label(b, g, spec, w * 0.8, h * 0.45, 0, h * 0.58, d / 2 + 0.0006)
  return g
}

/* ---------- skincare ---------- */

/** A cream jar: thick frosted glass, a gold screw lid with the label on it. */
export function creamJar(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, glass: Material, spec: LabelSpec, r = 0.032) {
  const g = at(p, x, y, z, yaw)
  lathe(g, [[0.001, 0], [r - 0.003, 0], [r, 0.004], [r, 0.036], [r - 0.004, 0.04], [0.001, 0.04]], glass, 0, 0, 0, 36)
  s.e.k.cyl(g, r + 0.001, r + 0.001, 0.018, b.gold, 0, 0.04 + 0.009, 0, 36)
  place(g, r * 1.3, r * 0.75, b.label({ ...spec, w: 192, h: 112 }), b.labelMat, 0, 0.0582, 0, 0, true)
  return g
}

/** A serum: a shouldered bottle of tinted glass, a gold collar, the dropper's bulb, the label. */
export function serum(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, glass: Material, spec: LabelSpec) {
  const g = at(p, x, y, z, yaw)
  lathe(g, [[0.001, 0], [0.016, 0], [0.017, 0.004], [0.017, 0.058], [0.012, 0.068], [0.008, 0.07], [0.008, 0.074], [0.001, 0.074]], glass, 0, 0, 0, 28)
  s.e.k.cyl(g, 0.0095, 0.0095, 0.014, b.gold, 0, 0.074 + 0.007, 0, 24)
  const bulb = s.e.k.sphere(g, 0.0085, b.rubberBulb, 0, 0.098, 0)
  bulb.scale.set(1, 1.6, 1)
  label(b, g, spec, 0.024, 0.032, 0, 0.032, 0.0172)
  return g
}

/** A toner: a tall frosted bottle, a white disc cap, the label. */
export function toner(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, spec: LabelSpec, glass: Material = b.frostedWhite) {
  const g = at(p, x, y, z, yaw)
  lathe(g, [[0.001, 0], [0.023, 0], [0.024, 0.005], [0.024, 0.118], [0.016, 0.13], [0.011, 0.132], [0.001, 0.132]], glass, 0, 0, 0, 32)
  s.e.k.cyl(g, 0.0125, 0.0125, 0.022, b.whiteGloss, 0, 0.132 + 0.011, 0, 24)
  label(b, g, spec, 0.034, 0.05, 0, 0.06, 0.0242)
  return g
}

let tubeGeo: BufferGeometry | null = null
/** A squeeze tube standing on its cap: round at the shoulder, pressed flat to the crimp at the top. */
function squeezeGeometry() {
  if (tubeGeo) return tubeGeo
  const h = 0.13
  const geo = new CylinderGeometry(0.019, 0.019, h, 28, 8, true)
  geo.translate(0, h / 2, 0)
  const pos = geo.attributes.position
  const v = new Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const t = v.y / h
    pos.setXYZ(i, v.x * (1 + t * 0.45), v.y, v.z * (1 - t * 0.92))
  }
  geo.computeVertexNormals()
  tubeGeo = geo
  return geo
}

/** A cleanser in a squeeze tube, standing on its cap. */
export function cleanser(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, body: Material, spec: LabelSpec) {
  const g = at(p, x, y, z, yaw)
  s.e.k.cyl(g, 0.016, 0.016, 0.02, b.whiteGloss, 0, 0.01, 0, 24)
  mesh(g, squeezeGeometry(), body, 0, 0.02, 0)
  s.e.k.box(g, 0.055, 0.008, 0.004, body, 0, 0.152, 0)
  label(b, g, spec, 0.028, 0.05, 0, 0.07, 0.0175)
  return g
}

/** A pump bottle of cleanser or lotion: a rounded bottle, a gold collar and a pump. */
export function pumpBottle(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, glass: Material, spec: LabelSpec) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  lathe(g, [[0.001, 0], [0.027, 0], [0.029, 0.006], [0.029, 0.14], [0.02, 0.155], [0.012, 0.158], [0.001, 0.158]], glass, 0, 0, 0, 32)
  k.cyl(g, 0.013, 0.013, 0.012, b.gold, 0, 0.164, 0, 24)
  k.cyl(g, 0.006, 0.006, 0.02, b.gold, 0, 0.18, 0, 12)
  k.box(g, 0.012, 0.01, 0.034, b.gold, 0, 0.194, 0.01)
  label(b, g, spec, 0.04, 0.06, 0, 0.075, 0.0292)
  return g
}

/* ---------- tools and gifts ---------- */

/** Makeup brushes standing in a ceramic cup: wooden or black handles, gold ferrules, soft heads of different cuts. */
export function brushCup(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, cup: Material) {
  const { k } = s.e
  const g = at(p, x, y, z, 0)
  lathe(g, [[0.001, 0], [0.034, 0], [0.036, 0.095], [0.033, 0.095], [0.031, 0.006], [0.001, 0.006]], cup, 0, 0, 0, 32)
  const r = rng(5)
  const heads = [b.shade('#e9ddd0', 0.9), b.shade('#3a2e2a', 0.9), b.shade('#e7c9b8', 0.9)]
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * PI * 2
    const lean = 0.08 + r() * 0.1
    const len = 0.15 + r() * 0.05
    const base: [number, number, number] = [Math.cos(a) * 0.012, 0.01, Math.sin(a) * 0.012]
    const dir = new Vector3(Math.cos(a) * lean, 1, Math.sin(a) * lean).normalize()
    const tip: [number, number, number] = [base[0] + dir.x * len, base[1] + dir.y * len, base[2] + dir.z * len]
    tube(g, base, tip, 0.0042, i % 2 ? b.blackMatte : s.e.lux.walnut, 10)
    const fer: [number, number, number] = [tip[0] + dir.x * 0.025, tip[1] + dir.y * 0.025, tip[2] + dir.z * 0.025]
    tube(g, tip, fer, 0.0055, b.gold, 12)
    // The head: a soft tuft flaring from the ferrule and rounding off (a powder brush full, a liner brush fine).
    const hr = [0.013, 0.008, 0.0045][i % 3]
    const hl = [0.04, 0.03, 0.018][i % 3]
    const head = lathe(g, [[0.0055, 0], [hr * 0.95, hl * 0.3], [hr, hl * 0.6], [hr * 0.7, hl * 0.88], [0.001, hl]], heads[i % 3], fer[0], fer[1], fer[2], 16)
    head.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir)
    void k
  }
  return g
}

/** A gift set: a lidded box in the house colour, a satin ribbon round it and tied in a bow. */
export function giftBox(s: Shop, b: B, p: Object3D, x: number, y: number, z: number, yaw: number, w: number, h: number, d: number, board: Material, ribbon: Material, spec: LabelSpec) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.box(g, w - 0.004, h - 0.02, d - 0.004, board, 0, (h - 0.02) / 2, 0)
  k.box(g, w + 0.004, 0.024, d + 0.004, board, 0, h - 0.012, 0)
  k.box(g, 0.014, h + 0.002, d + 0.006, ribbon, 0, h / 2, 0, false)
  k.box(g, w + 0.006, h + 0.002, 0.014, ribbon, 0, h / 2, 0, false)
  for (const sx of [-1, 1]) {
    const loop = mesh(g, new TorusGeometry(0.018, 0.004, 6, 16), ribbon, sx * 0.016, h + 0.012, 0)
    loop.rotation.set(0, 0, sx * 0.5)
    loop.scale.z = 0.4
  }
  label(b, g, spec, w * 0.42, h * 0.32, -w * 0.22, h * 0.45, d / 2 + 0.003)
  return g
}

/* ---------- testers ---------- */

/**
 * A fragrance tester: the flacon on its marble coaster; pressing its atomiser sprays a fine mist
 * (a few soft puffs drifting out and fading).
 */
export function mistOn(s: Shop, p: Object3D, x: number, y: number, z: number, dir: Vector3) {
  const g = live(p, 'mist', 'beauty')
  g.position.set(x, y, z)
  g.visible = false
  const mats: MeshStandardMaterial[] = []
  const puffs = Array.from({ length: 8 }, (_, i) => {
    const m = new MeshStandardMaterial({ color: '#fff4f0', transparent: true, opacity: 0, depthWrite: false, roughness: 1 })
    m.userData.interior = true
    mats.push(m)
    const o = mesh(g, new SphereGeometry(0.012, 10, 8), m, 0, 0, 0, false)
    o.userData.phase = i / 8
    return o
  })
  void s
  return () =>
    play({
      dur: 1.6,
      step: (t) => {
        g.visible = t < 1
        puffs.forEach((o, i) => {
          const u = Math.min(1, Math.max(0, t * 1.6 - (o.userData.phase as number) * 0.6))
          o.position.set(dir.x * u * 0.35 + Math.sin(i * 2.3) * u * 0.04, dir.y * u * 0.35 + u * 0.05, dir.z * u * 0.35 + Math.cos(i * 1.7) * u * 0.04)
          o.scale.setScalar(0.5 + u * 4)
          mats[i].opacity = 0.16 * Math.sin(u * PI)
        })
      },
    }, g)
}
