import { CylinderGeometry, DoubleSide, MeshStandardMaterial, Shape, ShapeGeometry, SphereGeometry, TorusGeometry } from 'three'
import { PI } from '../kit'
import { paintedMat } from '../shared'
import { glazing, roundedThatch } from './house'
import { ARCADE, BAMBOO_BAR, COURT, LAWN, POOL_T, PRACTICE, SERVICE, THATCH_HALL, UPPER, type Ctx } from './layout'
import { court as courtPaint, mural } from './paints'

export function buildOutdoors(ctx: Ctx) {
  buildArcade(ctx)
  buildCourt(ctx)
  buildThatchHall(ctx)
  buildBambooBar(ctx)
  buildService(ctx)
  buildPoolsideFurniture(ctx)
  buildLights(ctx)
}

/**
 * The arcade building beside the house, its front in line with the house front: two storeys of
 * brick with cream balconies wrapping the front and north side, and an open pavilion on top under
 * a charcoal gable roof running front to back, as in the drone photograph.
 */
function buildArcade(ctx: Ctx) {
  const { k, h } = ctx
  const r = k.root
  const [x0, x1, z0, z1] = ARCADE
  const [cx, cz, w, d] = [(x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0]
  // The walled block sits back from the front (east) and north edges; balconies fill the margin.
  const inset = 1.4
  const [bx1, bz0, bz1] = [x1 - inset, z0 + inset, z1 - 0.2]
  const [bw, bd, bcx, bcz] = [bx1 - x0 - 0.4, bz1 - bz0, (x0 + 0.4 + bx1) / 2, (bz0 + bz1) / 2]
  k.box(r, w, 0.3, d, k.m.basalt, cx, UPPER + 0.15, cz)
  const y = UPPER + 0.3
  const storey = 3.5
  for (let lvl = 0; lvl < 3; lvl++) {
    const by = y + lvl * storey
    if (lvl < 2) {
      const ht = storey - 0.3
      k.box(r, bw, ht, bd, [h.brick(bd, ht), h.brick(bd, ht), h.cream(bw, bd), h.cream(bw, bd), h.brick(bw, ht), h.brick(bw, ht)], bcx, by + ht / 2, bcz)
      glazing(ctx, 'z', bx1, 1, bz0 + 1.2, bz1 - 1.2, by + 0.25, by + ht - 0.35, 6)
      glazing(ctx, 'x', bz0, -1, x0 + 2, bx1 - 1.5, by + 0.25, by + ht - 0.35, 5)
    }
    // Each upper floor slab runs out to the balconies, edged in cream with a turned balustrade.
    if (lvl > 0) {
      k.box(r, w, 0.3, d, [h.cream(d, 0.3), h.cream(d, 0.3), h.paving(w, d), h.cream(w, d), h.cream(w, 0.3), h.cream(w, 0.3)], cx, by - 0.15, cz)
      rail(ctx, x1 - 0.1, z0 + 0.1, x1 - 0.1, z1 - 0.3, by)
      rail(ctx, x0 + 0.3, z0 + 0.1, x1 - 0.1, z0 + 0.1, by)
    }
  }
  // The open pavilion on top: teak posts carrying the gable roof, a cream back wall, seating beneath.
  const top = y + 2 * storey
  for (const px of [x0 + 0.5, cx - w / 6, cx + w / 6, x1 - 0.5])
    for (const pz of [z0 + 0.5, cz, z1 - 0.5]) k.cyl(r, 0.13, 0.15, 3.0, k.m.teak, px, top + 1.5, pz, 10)
  k.box(r, w + 0.2, 0.3, d + 0.2, h.cream(w, 0.3), cx, top + 3.1, cz)
  k.box(r, 0.25, 1.2, d - 1, h.cream(d, 1.2), x0 + 0.4, top + 0.6, cz)
  // As photographed, a long slope faces the front with a gable at the north end: the ridge runs
  // north-south.
  const roofMat = h.shingles(w, d)
  const [rise, eave] = [2.4, top + 3.25]
  const span = w / 2 + 1.0
  const pitch = Math.atan2(rise, span)
  for (const s of [-1, 1]) {
    const plane = k.box(r, Math.hypot(span, rise), 0.14, d + 2, roofMat, cx + (s * span) / 2, eave + rise / 2, cz)
    plane.rotation.z = -s * pitch
  }
  // Gable ends in teak boarding with exposed rafters, at the north and south ends.
  for (const gz of [z0 - 0.6, z1 + 0.6]) {
    const tri = new Shape()
    tri.moveTo(-span + 0.6, 0)
    tri.lineTo(0, rise - 0.15)
    tri.lineTo(span - 0.6, 0)
    const gable = k.mesh(new ShapeGeometry(tri), h.teak(w, rise), r, cx, eave, gz)
    ;(gable.material as MeshStandardMaterial).side = DoubleSide
  }
  for (const sz of [cz - 3, cz + 3]) k.sofa(cx, sz, sz < cz ? 0 : PI, 3.2, 0.9, k.m.outdoor).position.y = top
}

/** A teak balustrade with turned balusters along one balcony edge, as photographed. */
function rail(ctx: Ctx, xa: number, za: number, xb: number, zb: number, y: number) {
  const { k } = ctx
  const len = Math.hypot(xb - xa, zb - za)
  const alongX = Math.abs(xb - xa) > Math.abs(zb - za)
  const [mx, mz] = [(xa + xb) / 2, (za + zb) / 2]
  const teak = k.m.teak
  k.box(k.root, alongX ? len : 0.2, 0.1, alongX ? 0.2 : len, teak, mx, y + 0.95, mz)
  k.box(k.root, alongX ? len : 0.22, 0.12, alongX ? 0.22 : len, teak, mx, y + 0.06, mz)
  for (let t = 0; t <= len + 0.01; t += 2.4) k.box(k.root, 0.16, 1.0, 0.16, teak, xa + ((xb - xa) * t) / len, y + 0.5, za + ((zb - za) * t) / len)
  const baluster = teak
  for (let t = 0.2; t < len; t += 0.32) {
    const f = t / len
    k.cyl(k.root, 0.04, 0.06, 0.78, baluster, xa + (xb - xa) * f, y + 0.51, za + (zb - za) * f, 8)
  }
}

/**
 * The multi-sport court along the south side: a dark surface for tennis, basketball, cricket and
 * badminton, a tall dark mesh fence, and murals of sporting legends on the south wall.
 */
function buildCourt(ctx: Ctx) {
  const { k, h } = ctx
  const r = k.root
  const [x0, x1, z0, z1] = COURT
  const surface = paintedMat({ k }, 'court', 1024, 512, courtPaint, { roughness: 0.75 })
  k.box(r, x1 - x0, 0.06, z1 - z0, [h.concrete, h.concrete, surface, h.concrete, h.concrete, h.concrete], (x0 + x1) / 2, LAWN + 0.03, (z0 + z1) / 2, false)
  const y = LAWN + 0.06
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  k.box(r, 0.02, 0.95, 11, h.net, cx, y + 0.48, cz, false)
  k.box(r, 0.04, 0.05, 11, k.m.white, cx, y + 0.97, cz)
  for (const s of [-1, 1]) k.cyl(r, 0.04, 0.04, 1.07, h.steel, cx, y + 0.53, cz + s * 5.5, 8)
  const hoop = new MeshStandardMaterial({ color: '#e2601e', roughness: 0.5 })
  for (const s of [-1, 1]) {
    const hx = s < 0 ? x0 + 0.6 : x1 - 0.6
    k.cyl(r, 0.08, 0.08, 3.2, h.steel, hx, y + 1.6, cz, 10)
    k.box(r, 0.05, 1.05, 1.8, k.m.white, hx - s * 0.6, y + 3.3, cz)
    k.box(r, 0.6, 0.06, 0.06, h.steel, hx - s * 0.3, y + 3.0, cz)
    const ring = k.mesh(new TorusGeometry(0.23, 0.015, 6, 24), hoop, r, hx - s * 0.85, y + 3.05, cz)
    ring.rotation.x = PI / 2
  }
  // The tall dark fence round the court and the practice strip behind it (a gate on the north).
  const H = 6.5
  const zs = PRACTICE[3]
  const fence = (a: number, b: number, fixed: number, alongX: boolean) => {
    const len = b - a
    if (alongX) k.box(r, len, H, 0.02, h.mesh, (a + b) / 2, y + H / 2, fixed, false)
    else k.box(r, 0.02, H, len, h.mesh, fixed, y + H / 2, (a + b) / 2, false)
    for (let t = a; t <= b + 0.01; t += 3) {
      if (alongX) k.cyl(r, 0.05, 0.05, H + 0.1, h.steel, t, y + H / 2, fixed, 8)
      else k.cyl(r, 0.05, 0.05, H + 0.1, h.steel, fixed, y + H / 2, t, 8)
    }
  }
  fence(x0, cx - 1, z0, true)
  fence(cx + 1, x1, z0, true)
  fence(z0, zs, x0, false)
  fence(z0, zs, x1, false)
  fence(x0, x1, zs, true)
  // A low terracotta jali wall along the court's north side, behind the planting.
  k.box(r, x1 - x0, 1.4, 0.2, h.breeze(x1 - x0, 1.4), cx, POOL_T + 0.7, z0 - 0.3)
  // The mural wall along the court's south side: white, with the orange band and sporting legends
  // facing the court.
  const art = paintedMat({ k }, 'mural', 2048, 256, mural, { roughness: 0.85 })
  const len = x1 - x0
  k.box(r, len, 2.4, 0.25, [h.cream(1, 2.4), h.cream(1, 2.4), h.cream(len, 0.25), h.cream(len, 0.25), h.cream(len, 2.4), art], cx, y + 1.2, z1 + 0.15)
  // Behind it, the paved practice strip with green cricket nets.
  const [px0, px1, pz0, pz1] = PRACTICE
  k.box(r, px1 - px0, 0.06, pz1 - pz0, h.concrete, (px0 + px1) / 2, LAWN + 0.03, (pz0 + pz1) / 2, false)
  const netGreen = new MeshStandardMaterial({ color: '#3f9a4a', transparent: true, opacity: 0.35, side: DoubleSide, depthWrite: false })
  for (const nx of [px0 + 4, px0 + 12]) {
    const [nw, nd, nh] = [6.5, 3.2, 3.0]
    const nz = (pz0 + pz1) / 2
    for (const s of [-1, 1]) k.box(r, nw, nh, 0.02, netGreen, nx + nw / 2, LAWN + nh / 2, nz + (s * nd) / 2, false)
    k.box(r, 0.02, nh, nd, netGreen, nx + nw, LAWN + nh / 2, nz, false)
    k.box(r, nw, 0.02, nd, netGreen, nx + nw / 2, LAWN + nh, nz, false)
    k.box(r, nw, 0.03, 1.2, k.m.white, nx + nw / 2 - 0.4, LAWN + 0.07, nz, false)
  }
  for (const px of [x0 + 0.3, x1 - 0.3])
    for (const pz of [z0 + 0.3, zs - 0.4]) {
      k.cyl(r, 0.07, 0.09, 7, h.steel, px, y + 3.5, pz, 10)
      k.box(r, 0.7, 0.12, 0.4, h.lamp, px, y + 7, pz, false)
    }
}

/** The long white building at the pool's south side under a thick thatched hip roof: changing rooms and a dining pavilion. */
function buildThatchHall(ctx: Ctx) {
  const { k, h } = ctx
  const r = k.root
  const [x0, x1, z0, z1] = THATCH_HALL
  const [w, d] = [x1 - x0, z1 - z0]
  const ht = 2.9
  k.box(r, w, ht, d, h.cream(w, ht), (x0 + x1) / 2, POOL_T + ht / 2, (z0 + z1) / 2)
  // A warm cream plinth band at the foot of the white walls, as photographed.
  k.box(r, w + 0.04, 0.9, d + 0.04, new MeshStandardMaterial({ color: '#e8dcb8', roughness: 0.9 }), (x0 + x1) / 2, POOL_T + 0.45, (z0 + z1) / 2)
  glazing(ctx, 'x', z0, -1, x0 + 1.2, x1 - 4.5, POOL_T + 0.3, POOL_T + 2.4, 6)
  for (const x of [x1 - 3.4, x1 - 1.6]) k.box(r, 0.9, 2.2, 0.06, k.m.teak, x, POOL_T + 1.1, z0 - 0.03)
  roundedThatch(k, h, (x0 + x1) / 2, (z0 + z1) / 2, POOL_T + ht, w + 1.8, d + 1.8, 2.1)
}

/** The bamboo bar: a round kiosk of bamboo posts under a domed thatch, on a round stone platform beside the pool. */
function buildBambooBar(ctx: Ctx) {
  const { k, h } = ctx
  const r = k.root
  const { x: cx, z: cz, r: rad } = BAMBOO_BAR
  k.cyl(r, rad, rad + 0.1, 0.25, h.paleStone, cx, LAWN + 0.125, cz, 40)
  const top = LAWN + 0.25
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 2 * PI
    k.cyl(r, 0.1, 0.12, 2.6, h.bamboo, cx + Math.cos(a) * (rad - 0.3), top + 1.3, cz + Math.sin(a) * (rad - 0.3), 10)
  }
  dome(ctx, cx, cz, top + 2.45, rad + 0.8, 2.2)
  // A round counter of bundled bamboo with a teak top, stools around it.
  k.mesh(new CylinderGeometry(1.3, 1.3, 1.05, 32, 1, true), h.bamboo, r, cx, top + 0.53, cz)
  k.mesh(new TorusGeometry(1.3, 0.1, 6, 32), k.m.teak, r, cx, top + 1.08, cz).rotation.x = PI / 2
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 2 * PI + 0.3
    const [sx, sz] = [cx + Math.cos(a) * 1.9, cz + Math.sin(a) * 1.9]
    k.cyl(r, 0.18, 0.18, 0.05, h.bamboo, sx, top + 0.8, sz, 14)
    k.cyl(r, 0.03, 0.03, 0.78, h.bamboo, sx, top + 0.39, sz, 6)
  }
  k.sphere(r, 0.12, h.lamp, cx, top + 2.4, cz)
}

/** A domed alang-alang thatch, rounded like a haystack, with a thick fringe at its rim. */
function dome(ctx: Ctx, x: number, z: number, y: number, rad: number, ht: number) {
  const { k, h } = ctx
  const thatch = h.thatch(2 * PI * rad, ht)
  const cap = k.mesh(new SphereGeometry(rad, 40, 14, 0, 2 * PI, 0, PI / 2), thatch, k.root, x, y, z)
  cap.scale.y = ht / rad
  k.mesh(new CylinderGeometry(rad + 0.02, rad + 0.1, 0.4, 40, 1, true), thatch, k.root, x, y - 0.12, z)
}

/** The service corner at the south-east: transformer on its poles, the green generator and a staff room. */
function buildService(ctx: Ctx) {
  const { k, h } = ctx
  const r = k.root
  const [x0, x1, z0, z1] = SERVICE
  const y = LAWN
  k.box(r, x1 - x0, 0.12, z1 - z0, h.concrete, (x0 + x1) / 2, y + 0.06, (z0 + z1) / 2, false)
  const green = new MeshStandardMaterial({ color: '#2f7a4a', roughness: 0.6 })
  k.box(r, 3.4, 1.9, 1.6, green, x0 + 2.6, y + 1.07, z0 + 2.2)
  for (let i = 0; i < 6; i++) k.box(r, 0.02, 0.04, 1.2, h.steel, x0 + 4.31, y + 0.6 + i * 0.22, z0 + 2.2, false)
  for (const dz of [-0.8, 0.8]) k.cyl(r, 0.15, 0.18, 8, h.concrete, x1 - 1.6, y + 4, z0 + 6.5 + dz, 10)
  k.box(r, 1.2, 1.3, 2.4, h.steel, x1 - 1.6, y + 4.6, z0 + 6.5)
  k.box(r, 0.3, 0.12, 2.8, h.steel, x1 - 1.6, y + 7.7, z0 + 6.5)
  k.box(r, 4.6, 2.8, 4.6, [h.cream(4.6, 2.8), h.cream(4.6, 2.8), h.cream(4.6, 4.6), h.cream(4.6, 4.6), h.brick(4.6, 2.8), h.cream(4.6, 2.8)], x0 + 2.9, y + 1.4, z1 - 3.0)
  k.box(r, 5.0, 0.2, 5.0, [k.m.teak, k.m.teak, h.cream(5, 5), h.cream(5, 5), k.m.teak, k.m.teak], x0 + 2.9, y + 2.9, z1 - 3.0)
  k.box(r, 0.9, 2.1, 0.06, k.m.teak, x0 + 2.9, y + 1.05, z1 - 5.33)
}

/** Loungers on the pool deck and the thatched palapa before the carved door, as photographed. */
function buildPoolsideFurniture(ctx: Ctx) {
  const { k } = ctx
  for (const x of [5.4, 7.4]) k.lounger(x, -9.4, 0, POOL_T)
  const palapa = k.at(5.0, -7.45, 0, POOL_T)
  k.cyl(palapa, 0.06, 0.07, 2.7, k.m.teak, 0, 1.35, 0, 8)
  dome(ctx, 5.0, -7.45, POOL_T + 1.55, 1.25, 1.5)
  for (const dz of [-0.55, 0.55]) k.lounger(5.0, -7.45 + dz, PI / 2, POOL_T)
  for (const x of [5, 7, 9]) k.lounger(x, 9.6, PI, POOL_T)
}

/** Path lighting: bollards along the north walk and around the lawn. */
function buildLights(ctx: Ctx) {
  const { k, h } = ctx
  const bollard = (x: number, z: number, y: number) => {
    k.box(k.root, 0.14, 0.7, 0.14, h.steel, x, y + 0.35, z)
    k.box(k.root, 0.145, 0.1, 0.145, h.lamp, x, y + 0.6, z, false)
  }
  for (let x = -16; x <= 0; x += 4) bollard(x, -15.8, UPPER)
  for (let x = 22; x <= 44; x += 5.5) bollard(x, -13, LAWN)
  for (let z = -6; z <= 8; z += 7) bollard(44.8, z, LAWN)
}
