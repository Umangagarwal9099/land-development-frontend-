import { CatmullRomCurve3, DoubleSide, FrontSide, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, PointLight, TubeGeometry, Vector2, Vector3, type Material, type MeshStandardMaterialParameters, type Object3D } from 'three'
import type { Paint } from '../textures'
import { PI } from '../kit'
import { tiledMat } from '../shared'
import { BATH4, FFL, type Ctx } from './house'
import { cabinet } from './cabinets'
import { circuit, switchPlate, type Circuit } from './fixtures'
import { lightOak } from './paints'
import { wallHungToilet } from './toilet'
import { bottle, foldedTowels, rolledTowel, soapDish, toiletRoll, toothbrushes } from './toiletries'

/*
 * The first floor's shared bathroom, off the hall between Bedroom 4's door and Bedroom 3's back
 * wall, from the client's render: large-format warm beige tile on every wall and the floor; a
 * walk-in shower behind a single black-edged glass panel, with a black rain head, handheld on its
 * hose and a tiled niche; a floating light-oak vanity with one drawer over an open shelf, a white
 * vessel basin, wall-mounted black taps and a backlit mirror; a half-height tiled ledge with a black
 * flush plate behind the toilet, a branch in a black vase on it; and the window on the outer wall.
 *
 * Room frame (the render's, looking at that wall): X from the shower's side wall, which carries the
 * door, to the outer wall, Z from the feature wall (Bedroom 3's back wall) towards the door's end.
 */

const { w: W, d: D, door: DOOR, window: WIN } = BATH4
const H = 2.6
const T = 0.012
const SH: [number, number] = [0, 0.72]
const GLASS_Z = 0.9
const VA: [number, number] = [0.8, 1.38]
const LEDGE = { x0: 1.46, h: 1.12, d: 0.2 }
type R = [number, number]

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/** Large-format 600 × 1200 mm porcelain in a warm beige, each slab its own shade, on a fine grout. */
const slab: Paint = (g, w, h) => {
  g.fillStyle = '#c9baa4'
  g.fillRect(0, 0, w, h)
  let r = 77
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const t = (rnd() - 0.5) * 8
      g.fillStyle = `rgb(${216 + t},${200 + t},${178 + t})`
      g.fillRect((i * w) / 2 + 1, (j * h) / 2 + 1, w / 2 - 2, h / 2 - 2)
      for (let k = 0; k < 14; k++) {
        const x = (i * w) / 2 + rnd() * (w / 2)
        const y = (j * h) / 2 + rnd() * (h / 2)
        const gr = g.createRadialGradient(x, y, 0, x, y, w * 0.12)
        gr.addColorStop(0, 'rgba(240,230,214,0.18)')
        gr.addColorStop(1, 'rgba(240,230,214,0)')
        g.fillStyle = gr
        g.fillRect((i * w) / 2 + 1, (j * h) / 2 + 1, w / 2 - 2, h / 2 - 2)
      }
    }
}

function materials(ctx: Ctx) {
  const { k, lighting, c } = ctx
  const glow = (color: string, intensity: number) => lighting.glow(std({ color: '#fff3df', emissive: color, emissiveIntensity: intensity, roughness: 0.5 }), 1)
  // The render's oak is pale and natural: the same grain, lifted at its source.
  const paleOak = k.tex.painted(512, 512, (g2, w2, h2) => {
    lightOak(g2, w2, h2)
    g2.save()
    g2.globalCompositeOperation = 'screen'
    g2.fillStyle = 'rgb(70,66,58)'
    g2.fillRect(0, 0, w2, h2)
    g2.restore()
  })
  const oak = (w: number, h: number) => {
    const map = paleOak.clone()
    map.repeat.set(w / 0.6, h / 0.6)
    map.needsUpdate = true
    return std({ map, roughness: 0.5 })
  }
  void c
  return {
    oak,
    /** Walls: 600 wide by 1200 high. */
    tile: (w: number, h: number) => tiledMat(k, 'bath4_tile', slab, [w / 1.2, h / 2.4], { roughness: 0.42 }, 256),
    /** Floor: the same slabs laid flat, 1200 by 600. */
    floor: tiledMat(k, 'bath4_tile', slab, [W / 1.2, D / 2.4], { roughness: 0.38 }, 256),
    top: std({ color: '#f2eee7', roughness: 0.35 }),
    interior: std({ color: '#ece4d6', roughness: 0.7 }),
    drawer: std({ color: '#d9cdb9', roughness: 0.55 }),
    black: std({ color: '#18181a', roughness: 0.42, metalness: 0.4 }),
    dark: std({ color: '#2a2622', roughness: 0.8 }),
    ceramic: new MeshPhysicalMaterial({ color: '#f6f4f0', roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.1 }),
    glass: new MeshPhysicalMaterial({ color: '#f1f5f2', roughness: 0.02, transparent: true, opacity: 0.14, depthWrite: false, side: DoubleSide }),
    mirror: new MeshStandardMaterial({ color: '#d9dcd8', roughness: 0.05, metalness: 0.9, emissive: '#3a3833', emissiveIntensity: 0.4 }),
    wicker: std({ color: '#5a4230', roughness: 0.95 }),
    mat: std({ color: '#c9b9a2', roughness: 1 }),
    leaf: std({ color: '#6e7f5a', roughness: 0.85, side: DoubleSide }),
    stem: std({ color: '#5d4a36', roughness: 0.9 }),
    bulb: glow('#ffd8a0', 2.6),
    halo: glow('#ffc98a', 2.8),
    locator: glow('#ff9a3a', 1.4),
    plate: std({ color: '#d9d3c9', roughness: 0.45 }),
    rocker: std({ color: '#efebe4', roughness: 0.35 }),
    ceiling: new MeshStandardMaterial({ color: '#f4f1ec', roughness: 0.95, side: FrontSide, shadowSide: DoubleSide, emissive: '#c9c0b2', emissiveIntensity: 0.4 }),
  }
}

type M = ReturnType<typeof materials>
type Circuits = { ceiling: Circuit; mirror: Circuit }
type C = { ctx: Ctx; m: M; g: Group; c: Circuits; bx: (x: R, h: R, z: R, mat: Material, cast?: boolean, p?: Object3D) => Mesh }

export function buildBathroom4(ctx: Ctx) {
  const { k } = ctx
  const g = new Group()
  g.name = 'bathroom_4'
  // Local X runs towards the outer wall (house −x), local Z away from the feature wall (house −z).
  g.position.set(BATH4.x1, FFL, BATH4.z1)
  g.rotation.y = PI
  k.root.add(g)
  const m = materials(ctx)
  const bx = ([x0, x1]: R, [h0, h1]: R, [z0, z1]: R, mat: Material, cast = true, p: Object3D = g) =>
    k.box(p, x1 - x0, h1 - h0, z1 - z0, mat, (x0 + x1) / 2, (h0 + h1) / 2, (z0 + z1) / 2, cast)
  const c: Circuits = { ceiling: circuit(), mirror: circuit() }
  c.ceiling.glows.push(m.bulb)
  c.mirror.glows.push(m.halo)
  const B: C = { ctx, m, g, c, bx }
  shell(B)
  shower(B)
  vanity(B)
  toiletZone(B)
  lights(B)
}

/** Tile on every wall, cut round the doorway and window; the door, ceiling, downlights and switch. */
function shell(B: C) {
  const { bx, m, g, ctx, c } = B
  const { k } = ctx
  bx([0, W], [0, T], [0, D], m.floor, false)
  bx([0, W], [0, H], [0, T], m.tile(W, H), false)
  bx([0, W], [0, H], [D - T, D], m.tile(W, H), false)
  // The door wall (the shower's side), tiled round the doorway.
  bx([0, T], [0, H], [T, DOOR[0]], m.tile(DOOR[0], H), false)
  bx([0, T], [2.1, H], DOOR, m.tile(0.75, 0.5), false)
  bx([0, T], [0, H], [DOOR[1], D - T], m.tile(D - DOOR[1], H), false)
  // The outer wall, round the window, with a tiled reveal.
  bx([W - T, W], [0, H], [T, WIN.z[0]], m.tile(WIN.z[0], H), false)
  bx([W - T, W], [0, WIN.h[0]], WIN.z, m.tile(1.2, WIN.h[0]), false)
  bx([W - T, W], [WIN.h[1], H], WIN.z, m.tile(1.2, H - WIN.h[1]), false)
  bx([W - T, W], [0, H], [WIN.z[1], D - T], m.tile(D - WIN.z[1], H), false)
  bx([W - 0.2, W - T], [WIN.h[0] - 0.012, WIN.h[0]], WIN.z, m.tile(0.2, 1.2))

  // A flush oak door, opening into the room.
  const dw = DOOR[1] - DOOR[0] - 0.008
  const door = new Group()
  door.name = 'door_bath4_entry'
  door.position.set(-0.04, 0, DOOR[1] - 0.004)
  door.userData.openAngle = -1.5
  g.add(door)
  bx([-0.04, 0], [0.006, 2.094], [-dw, 0], m.oak(dw, 2.1), true, door).userData.front = true
  for (const x of [-0.052, 0.012]) {
    k.cyl(door, 0.024, 0.024, 0.01, m.black, x, 1.0, -dw + 0.065, 20).rotation.z = PI / 2
    bx([x - 0.008, x + 0.008], [0.992, 1.008], [-dw + 0.06, -dw + 0.19], m.black, true, door)
  }

  const ceiling = new Mesh(new PlaneGeometry(W, D), m.ceiling)
  ceiling.rotation.x = PI / 2
  ceiling.position.set(W / 2, H, D / 2)
  g.add(ceiling)
  for (const [x, z] of [[1.1, 1.2], [1.75, 0.55], [0.36, 0.5]]) k.cyl(g, 0.04, 0.04, 0.01, m.bulb, x, H - 0.004, z, 16).castShadow = false
  // Switches just inside the door, on the end wall: ceiling lights, mirror light.
  const plate = switchPlate(k, g, 'bath4', ['switch', 'switch'], { plate: m.plate, rocker: m.rocker, dark: m.dark, locator: m.locator }, [c.ceiling, c.mirror])
  plate.position.set(0.22, 1.2, D - T - 0.0005)
  plate.rotation.y = PI
}

/** Walk-in shower: one glass panel, square floor drain, tiled niche, black rain head and handheld on its hose. */
function shower(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const x = SH[1]
  bx([x - 0.004, x + 0.004], [T, 2.2], [T, GLASS_Z], m.glass, false)
  bx([x - 0.008, x + 0.008], [T, 2.2], [GLASS_Z - 0.01, GLASS_Z], m.black)
  bx([x - 0.008, x + 0.008], [2.19, 2.2], [T, GLASS_Z], m.black)
  bx([x - 0.008, x + 0.008], [0, 2.2], [T, T + 0.02], m.black)
  bx([0.26, 0.38], [T, T + 0.003], [0.55, 0.67], m.black)
  // The niche, recessed into a tiled box built out from the wall, with a bottle and a jar.
  const N = { x: [0.08, 0.62] as R, h: [1.02, 1.3] as R, d: 0.1 }
  bx([T, N.x[0]], [0, H], [T, N.d], m.tile(0.07, H))
  bx([N.x[1], x - 0.01], [0, H], [T, N.d], m.tile(0.1, H))
  bx(N.x, [0, N.h[0]], [T, N.d], m.tile(0.54, N.h[0]))
  bx(N.x, [N.h[1], H], [T, N.d], m.tile(0.54, H - N.h[1]))
  bottle(k, g, 'shampoo', N.x[0] + 0.1, N.h[0], 0.06, PI)
  bottle(k, g, 'bodywash', N.x[0] + 0.24, N.h[0], 0.06, PI)
  k.cyl(g, 0.035, 0.04, 0.1, m.ceramic, N.x[0] + 0.4, N.h[0] + 0.05, 0.06, 20)
  soapDish(k, g, N.x[1] - 0.06, N.h[0], 0.06)
  // Black rain head on a ceiling arm, close to the wall.
  k.cyl(g, 0.011, 0.011, 0.24, m.black, 0.36, H - 0.12, 0.3, 12)
  k.cyl(g, 0.03, 0.03, 0.01, m.black, 0.36, H - 0.004, 0.3, 16)
  k.cyl(g, 0.11, 0.105, 0.012, m.black, 0.36, H - 0.245, 0.3, 40)
  // Mixer and handheld on the side wall, a black hose looping down and back.
  const mz = 0.52
  k.cyl(g, 0.05, 0.05, 0.008, m.black, T + 0.004, 1.05, mz, 28).rotation.z = PI / 2
  k.cyl(g, 0.016, 0.016, 0.06, m.black, T + 0.035, 1.05, mz, 14).rotation.z = PI / 2
  bx([T, T + 0.03], [1.34, 1.4], [mz - 0.12, mz - 0.08], m.black)
  const hand = new Group()
  hand.position.set(T + 0.04, 1.42, mz - 0.1)
  g.add(hand)
  k.cyl(hand, 0.012, 0.01, 0.15, m.black, 0, -0.04, 0, 12)
  k.cyl(hand, 0.026, 0.022, 0.035, m.black, 0, 0.05, 0, 16)
  const hose = new CatmullRomCurve3([new Vector3(T + 0.04, 1.33, mz - 0.1), new Vector3(T + 0.05, 0.85, mz - 0.08), new Vector3(T + 0.06, 0.66, mz + 0.02), new Vector3(T + 0.05, 0.8, mz + 0.08), new Vector3(T + 0.04, 1.0, mz + 0.02)])
  g.add(new Mesh(new TubeGeometry(hose, 60, 0.006, 8, false), m.black))
}

/** Floating light-oak vanity: one drawer over an open shelf, vessel basin, wall taps, backlit mirror. */
function vanity(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const X: R = VA
  const w = X[1] - X[0]
  const cx = (X[0] + X[1]) / 2
  const DP = 0.44
  // The drawer box: stocked with the everyday things a vanity holds.
  const f = new Group()
  f.position.set(X[0], 0.6, DP)
  g.add(f)
  cabinet(k, f, w, 0.2, DP - T, { kind: 'drawers', id: 'bath4_vanity', rows: [], fill: [(p, b) => {
    const cz = (b.z0 + b.z1) / 2
    bottle(k, p, 'lotion', b.x0 + 0.06, b.floors[0], cz - 0.06)
    toothbrushes(k, p, b.x0 + 0.2, b.floors[0], cz)
    foldedTowels(k, p, b.x1 - 0.13, b.floors[0], cz, 0.2, 0.18, 2)
    k.cyl(p, 0.03, 0.03, 0.05, m.interior, b.x0 + 0.33, b.floors[0] + 0.025, cz + 0.08, 18)
  }] }, { front: m.oak(w, 0.2), interior: m.interior, drawer: m.drawer })
  // Oak carcass sides and the open shelf below, with folded towels and a wicker basket.
  bx([X[0], X[0] + 0.02], [0.3, 0.8], [T, DP], m.oak(0.44, 0.5))
  bx([X[1] - 0.02, X[1]], [0.3, 0.8], [T, DP], m.oak(0.44, 0.5))
  bx(X, [0.3, 0.325], [T, DP], m.oak(w, DP))
  foldedTowels(k, g, X[0] + 0.15, 0.325, 0.24, 0.24, 0.3, 3, true)
  bx([X[1] - 0.26, X[1] - 0.04], [0.325, 0.47], [0.1, 0.38], m.wicker)
  rolledTowel(k, g, X[1] - 0.15, 0.49, 0.24, 0.18)
  bx([X[0] - 0.006, X[1] + 0.006], [0.8, 0.825], [T, DP + 0.012], m.top)
  // White vessel basin, and the black wall spout and two levers above it.
  const basin = new Mesh(basinGeometry(), m.ceramic)
  basin.position.set(cx, 0.825, 0.24)
  basin.castShadow = basin.receiveShadow = true
  g.add(basin)
  k.cyl(g, 0.012, 0.012, 0.15, m.black, cx, 1.06, T + 0.075, 12).rotation.x = PI / 2
  for (const s of [-1, 1]) {
    k.cyl(g, 0.022, 0.022, 0.01, m.black, cx + s * 0.13, 1.06, T + 0.005, 18).rotation.x = PI / 2
    k.cyl(g, 0.007, 0.007, 0.05, m.black, cx + s * 0.13, 1.06, T + 0.03, 10).rotation.x = PI / 2
  }
  // The mirror: a slim black frame on a warm halo of light.
  const MW = 0.46
  const MH = 0.72
  bx([cx - MW / 2 - 0.03, cx + MW / 2 + 0.03], [1.26, 1.32 + MH], [T, T + 0.006], m.halo, false)
  bx([cx - MW / 2, cx + MW / 2], [1.29, 1.29 + MH], [T + 0.012, T + 0.03], m.black)
  bx([cx - MW / 2 + 0.008, cx + MW / 2 - 0.008], [1.298, 1.282 + MH], [T + 0.03, T + 0.032], m.mirror, false)
  // On the top: a soap dispenser, toothbrushes in a cup, and a dish.
  bottle(k, g, 'handwash', X[0] + 0.05, 0.825, 0.12, PI)
  toothbrushes(k, g, X[1] - 0.05, 0.825, 0.12)
  soapDish(k, g, X[1] - 0.06, 0.825, 0.36)
  // A cotton mat in front.
  k.soft(g, 0.62, 0.016, 0.44, 0.008, m.mat as MeshStandardMaterial, cx, 0.02, 1.15)
}

/** A round white vessel basin, its rim rolled and its bowl hollow. */
function basinGeometry() {
  return new LatheGeometry([[0, 0], [0.08, 0], [0.12, 0.01], [0.19, 0.06], [0.205, 0.12], [0.205, 0.13], [0.195, 0.13], [0.192, 0.12], [0.176, 0.065], [0.11, 0.022], [0.025, 0.016], [0, 0.016]].map(([r, y]) => new Vector2(r, y)), 48)
}

/** The tiled ledge behind the toilet, its flush plate and plant, the toilet, paper holder and brush. */
function toiletZone(B: C) {
  const { bx, m, g, ctx } = B
  const { k } = ctx
  const X: R = [LEDGE.x0, W - T]
  bx(X, [0, LEDGE.h], [T, LEDGE.d], m.tile(X[1] - X[0], LEDGE.h))
  bx(X, [LEDGE.h, LEDGE.h + 0.02], [T, LEDGE.d + 0.01], m.top)
  const cx = (X[0] + X[1]) / 2
  bx([cx - 0.11, cx + 0.11], [0.8, 0.94], [LEDGE.d, LEDGE.d + 0.006], m.black)
  bx([cx - 0.002, cx + 0.002], [0.81, 0.93], [LEDGE.d + 0.006, LEDGE.d + 0.0075], m.dark, false)
  wallHungToilet(k, g, cx, LEDGE.d)
  // Black roll holder on the ledge's face beside the bowl, brush in its stand in the corner.
  const rx = X[1] - 0.14
  bx([rx + 0.06, rx + 0.08], [0.66, 0.7], [LEDGE.d, LEDGE.d + 0.03], m.black)
  k.cyl(g, 0.006, 0.006, 0.14, m.black, rx, 0.68, LEDGE.d + 0.02, 10).rotation.z = PI / 2
  toiletRoll(k, g, rx, 0.68, LEDGE.d + 0.02, true)
  k.cyl(g, 0.045, 0.04, 0.3, m.black, X[1] - 0.08, 0.162, LEDGE.d + 0.4, 22)
  k.cyl(g, 0.006, 0.006, 0.18, m.black, X[1] - 0.08, 0.4, LEDGE.d + 0.4, 10)
  // A branch of eucalyptus in a black vase on the ledge.
  const vx = X[0] + 0.12
  k.cyl(g, 0.045, 0.05, 0.2, m.black, vx, LEDGE.h + 0.12, 0.1, 22)
  for (let i = 0; i < 6; i++) {
    const a = i * 2.3
    const lean = 0.2 + (i % 3) * 0.12
    const len = 0.26 + (i % 3) * 0.06
    const stem = new Group()
    stem.position.set(vx, LEDGE.h + 0.2, 0.1)
    stem.rotation.set(Math.cos(a) * lean, 0, Math.sin(a) * lean)
    g.add(stem)
    k.cyl(stem, 0.003, 0.003, len, m.stem, 0, len / 2, 0, 5)
    for (let j = 0; j < 5; j++) {
      const leaf = new Mesh(new PlaneGeometry(0.035, 0.045), m.leaf)
      leaf.position.set(((j % 2) - 0.5) * 0.03, len * (0.35 + j * 0.13), 0)
      leaf.rotation.set(0.3, a + j, ((j % 2) - 0.5) * 1.2)
      stem.add(leaf)
    }
  }
}

function lights({ g, ctx, c }: C) {
  const add = (x: number, h: number, z: number, intensity: number, distance: number, on: Circuit, color = '#ffdcb0') => {
    const l = new PointLight(color, intensity, distance, 2)
    l.position.set(x, h, z)
    g.add(l)
    ctx.lighting.light(l, 1)
    on.lights.push(l)
  }
  add(1.05, 2.4, 1.0, 4.5, 4.5, c.ceiling, '#fff1de')
  add(0.4, 2.35, 0.5, 2.2, 2.8, c.ceiling, '#fff1de')
  add(1.09, 1.65, 0.2, 1.8, 2.2, c.mirror)
}
