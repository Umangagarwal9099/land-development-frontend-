import { Group, MeshPhysicalMaterial, MeshStandardMaterial, PointLight, Vector2, Vector3, type Object3D } from 'three'
import { rng, type Paint } from '../textures'
import { Tris } from '../kalakalMall/skin'
import { rect, slab } from '../kalakalMall/solids'
import type { ClubCtx } from './building'
import { YARD_Y } from './plan'

/*
 * The courtyard pool, in place of the sandstone path down the courtyard's middle: a long pool on
 * the lobby's axis, lined in deep sea-green glass mosaic with a darker band at the waterline, under
 * a honed sandstone coping with a rounded nose, in a sandstone deck that keeps the way from the
 * lobby to the verandah open on either side. A sun shelf and steps at the lobby end, lights in its
 * long walls, low lights let into the deck; two teak loungers on the east lawn.
 */

/** The pool, inside its walls, and the deck round it. */
export const POOL = { x0: -1.4, x1: 1.4, z0: -15.4, z1: -4.4 }
export const DECK = { x0: -2.3, x1: 2.3, z0: -17.5, z1: -1.75 }
const COPING = 0.4
/** The opening the pool and its coping need in the ground round it. */
export const POOL_HOLE = rect(POOL.x0 - COPING, POOL.x1 + COPING, POOL.z0 - COPING, POOL.z1 + COPING)
const WATER = YARD_Y - 0.06
const SHELF = { z0: -5.6, depth: 0.32 }
/** The floor: 1.15 m deep at the shelf's foot, falling to 1.5 m at the verandah end. */
const floorY = (z: number) => WATER - 1.15 - (0.35 * (SHELF.z0 - z)) / (SHELF.z0 - POOL.z0)

/** 0.5 m of glass mosaic, 20 mm tiles in blended sea greens, grouted pale. */
const mosaic: Paint = (g, w, h) => {
  const r = rng(5101)
  g.fillStyle = '#d9ddd6'
  g.fillRect(0, 0, w, h)
  const n = 25
  const t = w / n
  const tones = ['#2f6f68', '#3a7d74', '#2a645e', '#46887c', '#245a55', '#5a9a8c']
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      g.fillStyle = tones[Math.floor(r() * r() * tones.length)]
      g.fillRect(i * t + 0.8, j * t + 0.8, t - 1.6, t - 1.6)
    }
}

/** Fine wind ripples, as a height field for the water's normal map. */
const ripples: Paint = (g, w, h) => {
  const r = rng(5102)
  g.fillStyle = '#808080'
  g.fillRect(0, 0, w, h)
  for (let k = 0; k < 240; k++) {
    const x = r() * w
    const y = r() * h
    const rad = 6 + r() * 24
    const v = r() < 0.5 ? 255 : 0
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(${v},${v},${v},.2)`)
    gr.addColorStop(1, `rgba(${v},${v},${v},0)`)
    g.fillStyle = gr
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2)
  }
}

/** A teak lounger with a thick off-white cushion, its back raised, its feet towards `yaw`. */
function lounger(ctx: ClubCtx, p: Object3D, x: number, z: number, yaw: number, cushion: MeshStandardMaterial) {
  const { c, k } = ctx
  const g = k.at(x, z, yaw, YARD_Y)
  p.add(g)
  for (const s of [-1, 1]) k.box(g, 0.055, 0.09, 1.95, c.teak, s * 0.33, 0.24, 0)
  for (const [lx, lz] of [[-0.33, 0.9], [0.33, 0.9], [-0.33, -0.9], [0.33, -0.9]]) k.box(g, 0.055, 0.2, 0.055, c.teak, lx, 0.1, lz)
  for (let i = 0; i < 10; i++) k.box(g, 0.63, 0.02, 0.085, c.teak, 0, 0.29, -0.15 + i * 0.11)
  k.soft(g, 0.64, 0.085, 1.28, 0.033, cushion, 0, 0.34, 0.32)
  const back = new Group()
  back.position.set(0, 0.3, -0.22)
  back.rotation.x = -0.7
  g.add(back)
  for (let i = 0; i < 6; i++) k.box(back, 0.63, 0.02, 0.085, c.teak, 0, 0, -0.06 - i * 0.12)
  k.soft(back, 0.64, 0.085, 0.72, 0.033, cushion, 0, 0.05, -0.37)
  ctx.shade.rect(x, YARD_Y + 0.004, z, 0.8, 2.0, -yaw, 0.2)
}

export function buildPool(ctx: ClubCtx, p: Object3D) {
  const { c, k, lighting, shade } = ctx
  const g = new Group()
  g.name = 'courtyard_pool'
  p.add(g)
  const { x0, x1, z0, z1 } = POOL

  // The materials: mosaic at true scale, a darker waterline band, the water.
  const tile = k.tex.painted(512, 512, mosaic)
  tile.repeat.set(1 / 0.5, 1 / 0.5)
  const mosaicMat = new MeshStandardMaterial({ map: tile, roughness: 0.22, metalness: 0.05 })
  const bandMat = new MeshStandardMaterial({ color: '#1d3f3c', roughness: 0.15, metalness: 0.1 })
  const water = new MeshPhysicalMaterial({ color: '#2b7a73', transparent: true, opacity: 0.78, roughness: 0.03, ior: 1.33, clearcoat: 1, clearcoatRoughness: 0.04, emissive: '#0d4a46', emissiveIntensity: 0.1, depthWrite: false })
  water.normalMap = k.tex.normalPainted('club_ripples', 256, 256, ripples, 1 / 2.5, 1 / 2.5)
  water.normalScale = new Vector2(0.16, 0.16)
  const poolLight = lighting.glow(new MeshStandardMaterial({ color: '#e8fbff', emissive: '#bdf2ff', emissiveIntensity: 2.0, roughness: 0.3 }), 0)
  const stepLight = lighting.glow(new MeshStandardMaterial({ color: '#fff4e0', emissive: '#ffdcae', emissiveIntensity: 1.8, roughness: 0.4 }), 0.1)

  // The deck: honed sandstone from the lobby to the verandah, the pool let into it.
  slab(g, rect(DECK.x0, DECK.x1, DECK.z0, DECK.z1), 0, YARD_Y + 0.03, [c.flags, c.concrete], [rect(x0 - COPING, x1 + COPING, z0 - COPING, z1 + COPING)], false, 'pool_deck')
  shade.edge([[DECK.x0, DECK.z0], [DECK.x0, DECK.z1]], YARD_Y + 0.004, 0.15, -1, 0.3)
  shade.edge([[DECK.x1, DECK.z0], [DECK.x1, DECK.z1]], YARD_Y + 0.004, 0.15, 1, 0.3)
  // The coping, a rounded nose over the water.
  slab(g, rect(x0 - COPING, x1 + COPING, z0 - COPING, z1 + COPING), YARD_Y - 0.03, YARD_Y + 0.045, [c.flags, c.flags], [rect(x0, x1, z0, z1)], false, 'pool_coping')
  for (const [ax, az, bx, bz] of [[x0, z0, x1, z0], [x0, z1, x1, z1], [x0, z0, x0, z1], [x1, z0, x1, z1]]) {
    const len = Math.hypot(bx - ax, bz - az)
    const nose = k.cyl(g, 0.035, 0.035, len, c.flags, (ax + bx) / 2, YARD_Y + 0.01, (az + bz) / 2, 12)
    nose.rotation.set(ax === bx ? Math.PI / 2 : 0, 0, ax === bx ? 0 : Math.PI / 2)
  }

  // The shell: walls and floor in mosaic, the sun shelf at the lobby end and its step.
  const t = new Tris()
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z)
  const quad = (a: Vector3, b: Vector3, cc: Vector3, d: Vector3, want: Vector3) => {
    const n = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(d, a))
    const uv = (q: Vector3) => (Math.abs(want.y) > 0.5 ? [q.x, q.z] : Math.abs(want.x) > 0.5 ? [q.z, q.y] : [q.x, q.y])
    if (n.dot(want) >= 0) t.quad(a, b, cc, d, uv(a), uv(b), uv(cc), uv(d))
    else t.quad(a, d, cc, b, uv(a), uv(d), uv(cc), uv(b))
  }
  const top = YARD_Y - 0.03
  const sy = WATER - SHELF.depth
  const N = 24
  for (let i = 0; i < N; i++) {
    const za = z0 + ((SHELF.z0 - z0) * i) / N
    const zb = z0 + ((SHELF.z0 - z0) * (i + 1)) / N
    quad(v(x0, floorY(za), za), v(x1, floorY(za), za), v(x1, floorY(zb), zb), v(x0, floorY(zb), zb), v(0, 1, 0))
    for (const [x, dir] of [[x0, 1], [x1, -1]] as const) quad(v(x, floorY(za), za), v(x, floorY(zb), zb), v(x, top, zb), v(x, top, za), v(dir, 0, 0))
  }
  quad(v(x0, sy, SHELF.z0), v(x1, sy, SHELF.z0), v(x1, sy, z1), v(x0, sy, z1), v(0, 1, 0))
  for (const [x, dir] of [[x0, 1], [x1, -1]] as const) quad(v(x, sy, SHELF.z0), v(x, sy, z1), v(x, top, z1), v(x, top, SHELF.z0), v(dir, 0, 0))
  quad(v(x0, floorY(SHELF.z0), SHELF.z0), v(x1, floorY(SHELF.z0), SHELF.z0), v(x1, sy, SHELF.z0), v(x0, sy, SHELF.z0), v(0, 0, -1))
  quad(v(x0, floorY(z0), z0), v(x1, floorY(z0), z0), v(x1, top, z0), v(x0, top, z0), v(0, 0, 1))
  quad(v(x0, sy, z1), v(x1, sy, z1), v(x1, top, z1), v(x0, top, z1), v(0, 0, -1))
  t.mesh(mosaicMat, g, 'pool_shell', false)
  // The waterline band, round the walls just under the coping.
  const band = new Tris()
  const b0 = WATER - 0.12
  const bq = (a: Vector3, b: Vector3, cc: Vector3, d: Vector3) => band.quad(a, b, cc, d, [0, 0], [1, 0], [1, 1], [0, 1])
  bq(v(x0 + 0.004, b0, z1), v(x0 + 0.004, b0, z0), v(x0 + 0.004, top, z0), v(x0 + 0.004, top, z1))
  bq(v(x1 - 0.004, b0, z0), v(x1 - 0.004, b0, z1), v(x1 - 0.004, top, z1), v(x1 - 0.004, top, z0))
  bq(v(x0, b0, z0 + 0.004), v(x1, b0, z0 + 0.004), v(x1, top, z0 + 0.004), v(x0, top, z0 + 0.004))
  bq(v(x1, b0, z1 - 0.004), v(x0, b0, z1 - 0.004), v(x0, top, z1 - 0.004), v(x1, top, z1 - 0.004))
  band.mesh(bandMat, g, 'pool_waterline', false)
  // Steps from the shelf down into the pool, in the coping's stone.
  for (let i = 0; i < 3; i++) k.box(g, x1 - x0, 0.04, 0.3, c.flags, 0, sy - 0.25 * (i + 1) + 0.02, SHELF.z0 - 0.15 - i * 0.3, false)
  // The water.
  const w = k.box(g, x1 - x0, 0.02, z1 - z0, water, 0, WATER - 0.01, (z0 + z1) / 2, false)
  w.name = 'pool_water'
  // Lights in the long walls, under the water.
  for (let z = z0 + 1.8; z < SHELF.z0 - 0.5; z += 2.6)
    for (const [x, dir] of [[x0, 1], [x1, -1]] as const) k.cyl(g, 0.12, 0.12, 0.03, poolLight, x + dir * 0.016, WATER - 0.42, z, 20).rotation.z = Math.PI / 2
  // Low step lights let into the deck along both sides.
  for (let z = DECK.z0 + 1.2; z < DECK.z1 - 0.8; z += 2.0) for (const x of [DECK.x0 + 0.2, DECK.x1 - 0.2]) k.box(g, 0.08, 0.012, 0.24, stepLight, x, YARD_Y + 0.036, z, false)
  const pl = lighting.light(new PointLight('#9fe8ff', 3, 7, 2), 0)
  pl.position.set(0, WATER - 0.5, (z0 + z1) / 2)
  g.add(pl)

  // Two teak loungers on the east lawn, feet towards the water, a side table between.
  const cushion = new MeshStandardMaterial({ color: '#efe9de', roughness: 0.95 })
  for (const z of [-9.6, -11.4]) lounger(ctx, g, 4.3, z, -Math.PI / 2, cushion)
  k.cyl(g, 0.22, 0.22, 0.03, c.flags, 4.0, YARD_Y + 0.43, -10.5, 24)
  k.cyl(g, 0.035, 0.05, 0.42, c.teak, 4.0, YARD_Y + 0.21, -10.5, 10)
}
