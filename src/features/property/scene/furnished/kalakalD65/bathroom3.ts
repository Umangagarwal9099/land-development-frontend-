import { CatmullRomCurve3, DoubleSide, ExtrudeGeometry, FrontSide, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, PointLight, Shape, TubeGeometry, Vector2, Vector3, type Material, type MeshStandardMaterialParameters, type Object3D } from 'three'
import type { Paint } from '../textures'
import { PI } from '../kit'
import { tiledMat } from '../shared'
import { BATH3, BEDROOM3, FFL, type Ctx } from './house'
import { cabinet } from './cabinets'
import { circuit, switchPlate, type Circuit } from './fixtures'
import { herbPot } from './pieces'
import { mirrorReflection } from './paints'
import { wallHungToilet } from './toilet'
import { bottle, foldedTowels, hungTowel, rolledTowel, soapDish, toiletRoll, toothbrushes, type Product } from './toiletries'

/*
 * The bathroom attached to Bedroom 3, from the client's dimensioned elevation and render: on one wall
 * a walk-in shower behind a bronze-framed glass divider, with stacked taupe tile, a lit three-bay
 * niche and brushed brass fittings; a wall-hung toilet under a tall fluted oak cabinet; and a floating
 * oak vanity with a stone top and vessel basin under a backlit pill mirror.
 *
 * The drawing's 2.53 m wall is laid out on the room's 2.36 m (shower 0.84, toilet 0.84, vanity 0.68).
 * Mirrored against the drawing, as this room's door is on the other hand: the shower falls on the
 * house's outer wall, the vanity by the door.
 *
 * Room frame (the drawing's, looking at that wall): X from the shower's side wall (0) to the door
 * wall, Z out from the wall (0) to the façade, h above the floor.
 */

const { w: W, d: D } = BATH3
const H = 2.6
const T = 0.012
const SH: [number, number] = [0, 0.84]
const WC: [number, number] = [0.84, 1.68]
const VA: [number, number] = [1.68, W]
/** The furred wall round the shower, the niche let into it; and the deeper one holding the cistern and cabinet. */
const FUR = 0.1
const BOX = 0.2
const GLASS_Z = 1.28
/** Openings in the room's own frame: the doorway, the high window, and the façade glazing behind its frosted film. */
const DOOR: [number, number] = [BEDROOM3.z1 - BEDROOM3.bathDoor[1] - BATH3.z0, BEDROOM3.z1 - BEDROOM3.bathDoor[0] - BATH3.z0]
const VENT = { z: [-3.81 - BATH3.z0, -2.95 - BATH3.z0] as [number, number], h: [5.0 - FFL, 5.6 - FFL] as [number, number] }
const GLAZED = { x: [BATH3.x1 - 2.16, BATH3.x1 - 1.22] as [number, number], h: 5.71 - FFL }

type R = [number, number]
const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/** Slim stacked tile: long uprights, each its own shade, on a fine grout. */
const stacked: Paint = (g, w, h) => {
  g.fillStyle = '#6f6556'
  g.fillRect(0, 0, w, h)
  const n = 4
  let r = 57
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < n; i++)
    for (let j = 0; j < 2; j++) {
      const t = (rnd() - 0.5) * 16
      g.fillStyle = `rgb(${148 + t},${133 + t},${114 + t})`
      g.fillRect((i * w) / n + 1.5, (j * h) / 2 + 1.5, w / n - 3, h / 2 - 3)
    }
}

/** Warm limewash: soft, uneven, never flat. */
const limewash: Paint = (g, w, h) => {
  g.fillStyle = '#e8dcc7'
  g.fillRect(0, 0, w, h)
  let r = 91
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < 60; i++) {
    const x = rnd() * w
    const y = rnd() * h
    const R0 = (0.08 + rnd() * 0.2) * w
    const gr = g.createRadialGradient(x, y, 0, x, y, R0)
    const tone = rnd() > 0.5 ? '246,238,224' : '214,200,178'
    gr.addColorStop(0, `rgba(${tone},0.16)`)
    gr.addColorStop(1, `rgba(${tone},0)`)
    g.fillStyle = gr
    g.fillRect(0, 0, w, h)
  }
}

function materials(ctx: Ctx) {
  const { k, lighting, c } = ctx
  const glow = (color: string, intensity: number) => lighting.glow(std({ color: '#fff3df', emissive: color, emissiveIntensity: intensity, roughness: 0.5 }), 1)
  const floor = c.surface('porcelain', W, D)
  floor.color.set('#e6d9c5')
  const mirrorMap = k.tex.painted(256, 512, mirrorReflection)
  const oak = (w: number, h: number) => {
    const o = c.surface('oak', w, h)
    o.color.set('#ecdcc6')
    return o
  }
  return {
    floor, oak,
    /** Stacked tile, 300 × 75 mm-ish at true scale over a face w × h. */
    tile: (w: number, h: number) => tiledMat(k, 'bath3_tile', stacked, [w / 0.3, h / 0.6], { roughness: 0.38 }, 256),
    wall: (w: number, h: number) => tiledMat(k, 'bath3_wall', limewash, [w / 1.2, h / 1.2], { roughness: 0.9 }, 256),
    fluted: (w: number, h: number) => {
      const m = c.surface('oakSlats', w * 2.6, h)
      m.color.set('#e6d3b8')
      return m
    },
    stone: (w: number, h: number) => c.surface('travertine', w, h),
    interior: std({ color: '#e8dfd0', roughness: 0.7 }),
    drawer: std({ color: '#cfc6b6', roughness: 0.55 }),
    // Metal reads black with no environment to reflect: kept part-way, so brass still looks like brass.
    brass: std({ color: '#c9a366', roughness: 0.34, metalness: 0.45 }),
    bronze: std({ color: '#4a3524', roughness: 0.42, metalness: 0.7 }),
    dark: std({ color: '#2a2622', roughness: 0.8 }),
    glass: new MeshPhysicalMaterial({ color: '#f1f5f2', roughness: 0.02, transparent: true, opacity: 0.14, depthWrite: false, side: DoubleSide }),
    frost: new MeshPhysicalMaterial({ color: '#f6f2ea', roughness: 0.8, transparent: true, opacity: 0.82, side: DoubleSide }),
    ceramic: new MeshPhysicalMaterial({ color: '#f4f2ee', roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1 }),
    mirror: new MeshStandardMaterial({ map: mirrorMap, emissiveMap: mirrorMap, emissive: '#ffffff', emissiveIntensity: 0.22, roughness: 0.06, metalness: 0.15 }),
    steel: std({ color: '#8c8f93', roughness: 0.35, metalness: 0.85 }),
    mat: std({ color: '#e7e1d6', roughness: 1 }),
    pampas: std({ color: '#d8c6a4', roughness: 1 }),
    stem: std({ color: '#a8916b', roughness: 0.9 }),
    bulb: glow('#ffd8a0', 2.6),
    cove: glow('#ffc98a', 2.4),
    halo: glow('#ffc98a', 2.8),
    wash: glow('#ffc98a', 2.4),
    nicheLed: glow('#ffc98a', 2.4),
    locator: glow('#ff9a3a', 1.4),
    plate: std({ color: '#d9d3c9', roughness: 0.45 }),
    rocker: std({ color: '#efebe4', roughness: 0.35 }),
    ceiling: new MeshStandardMaterial({ color: '#f4f1ec', roughness: 0.95, side: FrontSide, shadowSide: DoubleSide, emissive: '#c9c0b2', emissiveIntensity: 0.4 }),
  }
}

type M = ReturnType<typeof materials>
type Circuits = { ceiling: Circuit; mirror: Circuit; niche: Circuit }
type C = { ctx: Ctx; m: M; g: Group; c: Circuits; bx: (x: R, h: R, z: R, mat: Material, cast?: boolean, p?: Object3D) => Mesh }

export function buildBathroom3(ctx: Ctx) {
  const { k } = ctx
  const g = new Group()
  g.name = 'bathroom_3'
  g.position.set(BATH3.x1, FFL, BATH3.z0)
  // Mirrored: the drawing's X runs from the house's right wall in towards the door.
  g.scale.x = -1
  k.root.add(g)
  const m = materials(ctx)
  const bx = ([x0, x1]: R, [h0, h1]: R, [z0, z1]: R, mat: Material, cast = true, p: Object3D = g) =>
    k.box(p, x1 - x0, h1 - h0, z1 - z0, mat, (x0 + x1) / 2, (h0 + h1) / 2, (z0 + z1) / 2, cast)
  const c: Circuits = { ceiling: circuit(), mirror: circuit(), niche: circuit() }
  c.ceiling.glows.push(m.bulb, m.cove)
  c.mirror.glows.push(m.halo, m.wash)
  c.niche.glows.push(m.nicheLed)
  const B: C = { ctx, m, g, c, bx }
  shell(B)
  shower(B)
  toiletZone(B)
  vanity(B)
  essentials(B)
  lights(B)
}

/** A packaged product, whose label must still read through the room's mirroring. */
function product({ ctx, g }: C, kind: Product, x: number, y: number, z: number) {
  const f = new Group()
  f.position.set(x, 0, z)
  f.scale.x = -1
  g.add(f)
  bottle(ctx.k, f, kind, 0, y, 0, PI)
}

/** Floor, walls cut round every opening, the frosted film on the façade glazing, ceiling, cove and switch. */
function shell(B: C) {
  const { bx, m, g, ctx, c } = B
  const { k } = ctx
  bx([0, W], [0, T], [0, D], m.floor, false)
  // The far end of the vanity's wall, above the furred shower wall and box.
  bx([WC[1], W], [0, H], [0, T], m.wall(0.68, H), false)
  // Door wall, cut for the doorway.
  bx([W - T, W], [0, H], [0, DOOR[0]], m.wall(DOOR[0], H), false)
  bx([W - T, W], [2.1, H], DOOR, m.wall(0.75, 0.5), false)
  bx([W - T, W], [0, H], [DOOR[1], D], m.wall(D - DOOR[1], H), false)
  // Façade wall, cut for the glazing, which carries a frosted film for privacy.
  bx([0, GLAZED.x[0]], [0, H], [D - T, D], m.wall(GLAZED.x[0], H), false)
  bx(GLAZED.x, [GLAZED.h, H], [D - T, D], m.wall(0.94, H - GLAZED.h), false)
  bx(GLAZED.x, [0, GLAZED.h], [D - 0.03, D - 0.024], m.frost, false)
  // The outer wall: tile in the shower, limewash beyond it, both round the high window.
  const v = VENT
  const side = (z: R, mat: (w: number, h: number) => Material) => {
    const [a, b] = [Math.max(z[0], v.z[0]), Math.min(z[1], v.z[1])]
    if (b <= a) return bx([0, T], [0, H], z, mat(z[1] - z[0], H), false)
    if (a > z[0]) bx([0, T], [0, H], [z[0], a], mat(a - z[0], H), false)
    bx([0, T], [0, v.h[0]], [a, b], mat(b - a, v.h[0]), false)
    bx([0, T], [v.h[1], H], [a, b], mat(b - a, H - v.h[1]), false)
    if (z[1] > b) bx([0, T], [0, H], [b, z[1]], mat(z[1] - b, H), false)
    return null
  }
  side([FUR, GLASS_Z], m.tile)
  side([GLASS_Z, D], m.wall)

  const ceiling = new Mesh(new PlaneGeometry(W, D), m.ceiling)
  ceiling.rotation.x = PI / 2
  ceiling.position.set(W / 2, H, D / 2)
  g.add(ceiling)
  for (const [x, z] of [[0.42, 0.75], [1.26, 0.8], [2.0, 0.8], [1.2, 1.9]]) k.cyl(g, 0.045, 0.045, 0.01, m.bulb, x, H - 0.004, z, 16).castShadow = false
  // The drawing's LED strip: a warm line along the head of the feature wall.
  bx([0.02, W - 0.02], [H - 0.09, H], [0, 0.03], m.wall(W, 0.1), false)
  bx([0.02, W - 0.02], [H - 0.098, H - 0.09], [0.205, 0.225], m.cove, false)
  bx([0, W], [H - 0.09, H], [0, 0.22], m.wall(W, 0.3), false)

  // The switchboard just inside the door, at 1.2 m: ceiling and strip, mirror and vanity wash, niche.
  const plate = switchPlate(k, g, 'bath3', ['switch', 'switch', 'switch'], { plate: m.plate, rocker: m.rocker, dark: m.dark, locator: m.locator }, [c.ceiling, c.mirror, c.niche])
  plate.position.set(W - T - 0.0005, 1.2, DOOR[0] - 0.22)
  plate.rotation.y = -PI / 2
}

/** Shower: stacked tile, the lit niche, glass divider, rain head, mixer, handheld on its hose, channel drain. */
function shower(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  // The furred tile wall, with the niche let into it.
  const N = { x: [0.42, 0.68] as R, h: [0.98, 2.04] as R }
  bx([SH[0], N.x[0]], [0, H - 0.09], [0, FUR], m.tile(N.x[0], H))
  bx([N.x[1], SH[1]], [0, H - 0.09], [0, FUR], m.tile(SH[1] - N.x[1], H))
  bx(N.x, [0, N.h[0]], [0, FUR], m.tile(0.26, N.h[0]))
  bx(N.x, [N.h[1], H - 0.09], [0, FUR], m.tile(0.26, H - N.h[1]))
  // Three oak-lined bays, an LED under each head, with a bottle and a small plant on each shelf.
  bx(N.x, N.h, [0, 0.012], m.oak(0.26, 1.06))
  const bay = (N.h[1] - N.h[0]) / 3
  const kinds: Product[] = ['shampoo', 'conditioner', 'bodywash']
  kinds.forEach((kind, i) => {
    const h0 = N.h[0] + i * bay
    bx(N.x, [h0, h0 + 0.018], [0.012, FUR], m.oak(0.26, 0.1))
    bx([N.x[0] + 0.012, N.x[1] - 0.012], [h0 + bay - 0.006, h0 + bay], [FUR - 0.03, FUR - 0.015], m.nicheLed, false)
    product(B, kind, N.x[0] + 0.08, h0 + 0.018, 0.06)
    herbPot({ k, c: ctx.c }, g, N.x[0] + 0.19, h0 + 0.018, 0.06, 0.55, m.ceramic)
  })
  // Glass divider in a slim bronze frame, floor to just under the strip, with a brass pull.
  const x = SH[1]
  bx([x - 0.004, x + 0.004], [T, 2.38], [FUR, GLASS_Z], m.glass, false)
  bx([x - 0.012, x + 0.012], [0, 2.4], [FUR, FUR + 0.024], m.bronze)
  bx([x - 0.012, x + 0.012], [0, 2.4], [GLASS_Z - 0.012, GLASS_Z + 0.012], m.bronze)
  bx([x - 0.012, x + 0.012], [2.38, 2.4], [FUR, GLASS_Z], m.bronze)
  bx([x - 0.012, x + 0.012], [T, 0.025], [FUR, GLASS_Z], m.bronze)
  k.cyl(g, 0.011, 0.011, 0.6, m.brass, x + 0.035, 1.2, GLASS_Z - 0.09, 14)
  for (const h of [0.97, 1.43]) bx([x, x + 0.035], [h - 0.006, h + 0.006], [GLASS_Z - 0.096, GLASS_Z - 0.084], m.brass)
  // Linear channel drain along the divider.
  bx([x - 0.1, x - 0.02], [T, T + 0.003], [FUR + 0.05, GLASS_Z - 0.05], m.steel)

  // Rain head on a wall arm off the side wall, at 2.2 m.
  const hz = 0.62
  const arm = k.cyl(g, 0.011, 0.011, 0.4, m.brass, 0.2, 2.2, hz, 14)
  arm.rotation.z = PI / 2
  k.cyl(g, 0.03, 0.03, 0.01, m.brass, 0.015, 2.2, hz, 20).rotation.z = PI / 2
  k.cyl(g, 0.011, 0.011, 0.05, m.brass, 0.4, 2.175, hz, 12)
  k.cyl(g, 0.12, 0.115, 0.012, m.brass, 0.4, 2.145, hz, 48)
  // Mixer and diverter on the side wall, handheld on its holder, joined by a looping brass hose.
  const mz = 0.56
  k.cyl(g, 0.055, 0.055, 0.01, m.brass, 0.017, 1.12, mz, 32).rotation.z = PI / 2
  k.cyl(g, 0.02, 0.02, 0.07, m.brass, 0.055, 1.12, mz, 16).rotation.z = PI / 2
  k.box(g, 0.012, 0.016, 0.07, m.brass, 0.09, 1.12, mz + 0.03)
  k.box(g, 0.05, 0.05, 0.03, m.brass, 0.04, 1.26, mz - 0.02)
  const hand = new Group()
  hand.position.set(0.075, 1.3, mz - 0.02)
  hand.rotation.z = -0.22
  g.add(hand)
  k.cyl(hand, 0.013, 0.011, 0.16, m.brass, 0, 0, 0, 14)
  k.cyl(hand, 0.038, 0.032, 0.045, m.brass, 0.01, 0.095, 0, 20)
  const hose = new CatmullRomCurve3([new Vector3(0.05, 1.08, mz + 0.04), new Vector3(0.08, 0.72, mz + 0.1), new Vector3(0.11, 0.52, mz + 0.04), new Vector3(0.1, 0.72, mz - 0.06), new Vector3(0.08, 1.14, mz - 0.03), new Vector3(0.075, 1.22, mz - 0.02)])
  const tube = new Mesh(new TubeGeometry(hose, 64, 0.007, 8, false), m.brass)
  tube.castShadow = true
  g.add(tube)
}

/** The toilet: box with brass flush plate, fluted oak cabinet above, bidet spray, roll holder and brush. */
function toiletZone(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const X: R = [WC[0] + 0.012, WC[1]]
  const PANEL = 1.0
  const TOP = H - 0.09
  // The box to cabinet height, in limewash.
  bx(X, [0, PANEL], [0, BOX], m.wall(0.83, PANEL))
  bx([X[0], X[1]], [TOP - 0.02, TOP], [0, BOX], m.wall(0.83, 0.02))
  // Two tall fluted oak doors, each opening on its own hinge, over shelves of spares.
  const dw = (X[1] - X[0]) / 2
  ;(['left', 'right'] as const).forEach((hinge, i) => {
    const f = new Group()
    f.position.set(X[0] + i * dw, PANEL, BOX)
    g.add(f)
    cabinet(k, f, dw, TOP - 0.02 - PANEL, BOX - 0.01, { kind: 'door', id: `bed3bath_cabinet_${i + 1}`, hinge, shelves: [0.36, 0.72, 1.04], fill: (p, b) => {
      const cx = (b.x0 + b.x1) / 2
      const cz = (b.z0 + b.z1) / 2
      if (i === 0) {
        for (let j = 0; j < 3; j++) toiletRoll(k, p, b.x0 + 0.08 + j * 0.12, b.floors[0], cz)
        foldedTowels(k, p, cx, b.floors[1], cz, 0.3, 0.13, 4)
        foldedTowels(k, p, cx, b.floors[2], cz, 0.3, 0.13, 3, true)
      } else {
        foldedTowels(k, p, cx, b.floors[0], cz, 0.3, 0.13, 5, true)
        for (let j = 0; j < 2; j++) toiletRoll(k, p, b.x0 + 0.08 + j * 0.13, b.floors[1], cz)
        foldedTowels(k, p, cx, b.floors[2], cz, 0.3, 0.13, 3)
      }
    } }, { front: m.fluted(dw, TOP - PANEL), interior: m.interior, drawer: m.drawer })
  })
  // Brushed brass dual flush plate.
  const cx = (WC[0] + WC[1]) / 2
  bx([cx - 0.11, cx + 0.11], [0.76, 0.91], [BOX, BOX + 0.006], m.brass)
  bx([cx - 0.002, cx + 0.002], [0.77, 0.9], [BOX + 0.006, BOX + 0.0075], m.dark, false)
  wallHungToilet(k, g, cx, BOX)
  // The bidet spray on its hook and hose beside the bowl.
  const sx = X[0] + 0.1
  bx([sx - 0.012, sx + 0.012], [0.66, 0.7], [BOX, BOX + 0.03], m.brass)
  k.cyl(g, 0.012, 0.014, 0.12, m.brass, sx, 0.66, BOX + 0.04, 12)
  const hose = new CatmullRomCurve3([new Vector3(sx, 0.6, BOX + 0.04), new Vector3(sx + 0.03, 0.3, BOX + 0.05), new Vector3(sx - 0.02, 0.2, BOX + 0.03), new Vector3(sx - 0.03, 0.42, BOX + 0.015), new Vector3(sx - 0.03, 0.52, BOX + 0.006)])
  g.add(new Mesh(new TubeGeometry(hose, 40, 0.006, 8, false), m.brass))
  // Roll holder on the box, brush in its stand on the floor.
  const rx = X[1] - 0.11
  bx([rx + 0.06, rx + 0.08], [0.66, 0.7], [BOX, BOX + 0.03], m.brass)
  k.cyl(g, 0.006, 0.006, 0.14, m.brass, rx, 0.68, BOX + 0.02, 10).rotation.z = PI / 2
  toiletRoll(k, g, rx, 0.68, BOX + 0.02, true)
  k.cyl(g, 0.048, 0.044, 0.3, m.brass, X[1] - 0.09, 0.162, BOX + 0.12, 24)
  k.cyl(g, 0.006, 0.006, 0.2, m.brass, X[1] - 0.09, 0.4, BOX + 0.12, 10)
}

/** A pill (stadium), `w` wide and `h` tall, about its middle. */
function pill(w: number, h: number) {
  const r = w / 2
  const s = new Shape()
  s.moveTo(-r, -h / 2 + r)
  s.lineTo(-r, h / 2 - r)
  s.absarc(0, h / 2 - r, r, PI, 0, true)
  s.lineTo(r, -h / 2 + r)
  s.absarc(0, -h / 2 + r, r, 0, PI, true)
  return s
}

/** The floating vanity: two oak drawers under a stone top, vessel basin, wall taps, backlit mirror, the wash beneath. */
function vanity(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const X: R = [VA[0] + 0.012, VA[1] - T]
  const w = X[1] - X[0]
  const cx = (X[0] + X[1]) / 2
  const DP = 0.5
  // Two independent drawers on full-extension runners, stocked as a real vanity is.
  const f = new Group()
  f.position.set(X[0], 0.36, DP)
  g.add(f)
  cabinet(k, f, w, 0.44, DP - T, { kind: 'drawers', id: 'bed3bath_vanity', rows: [0.22], fill: [
    (p, b) => {
      foldedTowels(k, p, b.x0 + 0.16, b.floors[0], (b.z0 + b.z1) / 2, 0.26, 0.18, 2)
      rolledTowel(k, p, b.x1 - 0.1, b.floors[0] + 0.04, (b.z0 + b.z1) / 2, 0.24)
    },
    (p, b) => {
      const cz = (b.z0 + b.z1) / 2
      bottle(k, p, 'lotion', b.x0 + 0.06, b.floors[0], cz - 0.08)
      bottle(k, p, 'handwash', b.x0 + 0.06, b.floors[0], cz + 0.08)
      toothbrushes(k, p, b.x0 + 0.24, b.floors[0], cz)
      k.box(p, 0.15, 0.005, 0.024, m.dark, b.x1 - 0.12, b.floors[0] + 0.003, cz - 0.08)
      k.cyl(p, 0.035, 0.035, 0.06, m.interior, b.x1 - 0.1, b.floors[0] + 0.03, cz + 0.07, 20)
    },
  ] }, { front: m.oak(w, 0.22), interior: m.interior, drawer: m.drawer })
  // Stone top, thick as the drawing's, with the wash of light under the whole unit.
  bx([X[0] - 0.006, X[1]], [0.8, 0.89], [T, DP + 0.02], m.stone(w, DP))
  bx([X[0] + 0.02, X[1] - 0.02], [0.348, 0.356], [DP - 0.08, DP - 0.05], m.wash, false)
  // A rectangular stone vessel basin, hollowed, and its waste.
  const B0: R = [cx - 0.21, cx + 0.21]
  const Z0: R = [0.1, 0.42]
  const top = 1.0
  const stone = m.stone(0.42, 0.3)
  bx(B0, [0.89, 0.91], Z0, stone)
  bx([B0[0], B0[0] + 0.022], [0.91, top], Z0, stone)
  bx([B0[1] - 0.022, B0[1]], [0.91, top], Z0, stone)
  bx([B0[0] + 0.022, B0[1] - 0.022], [0.91, top], [Z0[0], Z0[0] + 0.022], stone)
  bx([B0[0] + 0.022, B0[1] - 0.022], [0.91, top], [Z0[1] - 0.022, Z0[1]], stone)
  k.cyl(g, 0.018, 0.018, 0.004, m.brass, cx, 0.912, (Z0[0] + Z0[1]) / 2, 16)
  // Brass wall spout and lever over it.
  for (const [x, len] of [[cx, 0.17], [cx + 0.17, 0.05]] as const) {
    k.cyl(g, 0.028, 0.028, 0.01, m.brass, x, 1.12, T + 0.005, 20).rotation.x = PI / 2
    k.cyl(g, 0.011, 0.011, len, m.brass, x, 1.12, T + 0.005 + len / 2, 14).rotation.x = PI / 2
  }
  k.box(g, 0.008, 0.06, 0.012, m.brass, cx + 0.17, 1.155, T + 0.05)
  // The drawing's pill mirror, backlit, on the wall above.
  const mirror = (scale: number, mat: Material, z: number) => {
    const geo = new ExtrudeGeometry(pill(0.56 * scale, 1.2 + 0.56 * (scale - 1)), { depth: 0.006, bevelEnabled: false, curveSegments: 32 })
    const uv = geo.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.6 + 0.5, uv.getY(i) / 1.26 + 0.5)
    const mesh = new Mesh(geo, mat)
    mesh.position.set(cx, 1.78, z)
    g.add(mesh)
  }
  mirror(1.09, m.halo, T + 0.012)
  mirror(1.01, m.dark, T + 0.022)
  mirror(1, m.mirror, T + 0.026)
  // On the top: a dispenser and tray, toothbrushes, a dish of soap, and the vase of dried grass.
  product(B, 'handwash', X[0] + 0.045, 0.89, 0.18)
  toothbrushes(k, g, X[0] + 0.05, 0.89, 0.38)
  soapDish(k, g, X[1] - 0.05, 0.89, 0.44)
  const vase = new Mesh(new LatheGeometry([[0, 0], [0.04, 0], [0.058, 0.05], [0.055, 0.11], [0.028, 0.17], [0.022, 0.2], [0, 0.2]].map(([r, y]) => new Vector2(r, y)), 28), m.ceramic)
  vase.position.set(X[1] - 0.045, 0.89, 0.17)
  vase.castShadow = true
  g.add(vase)
  for (let i = 0; i < 8; i++) {
    const a = i * 2.4
    const lean = 0.08 + (i % 3) * 0.1
    const len = 0.26 + (i % 4) * 0.05
    const stem = new Group()
    stem.position.set(X[1] - 0.045, 1.08, 0.17)
    stem.rotation.set(Math.cos(a) * lean, 0, Math.sin(a) * lean)
    g.add(stem)
    k.cyl(stem, 0.0022, 0.0022, len, m.stem, 0, len / 2, 0, 5)
    k.blob(stem, 0.017, m.pampas, 0, len + 0.04, 0, 3).castShadow = false
  }
}

/** Bath towel on a brass bar past the shower, hand towel on a ring by the vanity, bath mat and bin. */
function essentials(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const rail = new Group()
  rail.position.set(T + 0.05, 1.3, (VENT.z[1] + D) / 2 - 0.02)
  rail.rotation.y = PI / 2
  g.add(rail)
  k.cyl(rail, 0.009, 0.009, 0.46, m.brass, 0, 0, 0, 12).rotation.z = PI / 2
  for (const s of [-1, 1]) bx([s * 0.23 - 0.012, s * 0.23 + 0.012], [-0.012, 0.012], [-0.05, 0.012], m.brass, true, rail)
  hungTowel(k, rail, 0, 0, 0, 0.4, 0.6)
  // The ring on the door wall, past the vanity's end.
  const rz = DP_END + 0.16
  const ring = new Mesh(new LatheGeometry([new Vector2(0.07, -0.004), new Vector2(0.075, 0), new Vector2(0.07, 0.004)], 32), m.brass)
  ring.rotation.z = PI / 2
  ring.position.set(W - T - 0.06, 1.14, rz)
  g.add(ring)
  bx([W - T - 0.06, W - T], [1.2, 1.22], [rz - 0.01, rz + 0.01], m.brass)
  const towel = new Group()
  towel.position.set(W - T - 0.06, 1.07, rz)
  towel.rotation.y = PI / 2
  g.add(towel)
  hungTowel(k, towel, 0, 0, 0, 0.2, 0.3, true)
  k.soft(g, 0.72, 0.016, 0.46, 0.008, m.mat, 0.5, 0.02, GLASS_Z + 0.32)
  // A brass pedal bin, tucked in under the vanity's overhang.
  k.cyl(g, 0.09, 0.08, 0.26, m.brass, VA[0] + 0.14, 0.142, 0.22, 24)
}

const DP_END = 0.52

function lights({ g, ctx, c }: C) {
  const add = (x: number, h: number, z: number, intensity: number, distance: number, on: Circuit, color = '#ffdcb0') => {
    const l = new PointLight(color, intensity, distance, 2)
    l.position.set(x, h, z)
    g.add(l)
    ctx.lighting.light(l, 1)
    on.lights.push(l)
  }
  add(1.2, 2.42, 1.2, 5, 5, c.ceiling, '#fff1de')
  add(0.42, 2.4, 0.7, 2.6, 3, c.ceiling, '#fff1de')
  add(1.4, 2.42, 0.4, 2.4, 2.6, c.ceiling)
  add(2.02, 1.8, 0.22, 1.8, 2.2, c.mirror)
  add(2.02, 0.2, 0.42, 1, 1.4, c.mirror)
  add(0.55, 1.6, 0.26, 1, 1.6, c.niche)
}
