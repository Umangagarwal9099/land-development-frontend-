import { CylinderGeometry, DoubleSide, FrontSide, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, PointLight, TorusGeometry, type Material, type MeshStandardMaterialParameters } from 'three'
import type { Paint } from '../textures'
import { PI } from '../kit'
import { GFL, KITCHEN, KITCHEN_WINDOW, type Ctx } from './house'
import { counterStool } from './stool'
import { bowls, carafe, cutleryCrock, mug, plates, tumblers, wineGlasses } from './tableware'

/*
 * The ground-floor kitchen, modelled from the client's kitchen reference (render + dimensioned
 * plan), enlarged at the client's request to 3.90 × 3.40 m, with a 2.50 m false ceiling.
 * Sage handle-less cabinetry, tall units on the left wall (oven tower, open-shelf column, black
 * French-door fridge, end tall unit), the sink on the back run under a fluted oak panel,
 * black-framed open shelves and a glass cabinet, the hob on the right-hand run under the window,
 * and a 1.50 m breakfast bar with a fluted oak front and two stools.
 *
 * Kitchen frame: X from the left (inner) wall towards the right exterior wall, Y from the back
 * wall towards the room, h above the kitchen floor. It sits in the house's back-right corner,
 * where the reference's exterior walls (back and right, with the window) fall on the house's own.
 * The hob stands under the window, as on the plan (moved there at the client's request).
 */

const { w: KW, d: KD, h: KH } = KITCHEN
/**
 * Growth over the reference's 3.10 × 2.70 m. Pieces against the right wall and the open front move
 * out with it; the sink stays centred in the back run, and the extra length opens up the runs.
 */
const DX = KW - 3.1
const DY = KD - 2.7

const TOP = 0.9
const BAR_TOP = 0.95
const UNDER = 1.51
const PANEL_TOP = 2.1
const BASE_D = 0.6
const UPPER_D = 0.35
const GAP = 0.004

type R = [number, number]

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/** A quiet botanical line print on warm paper, for the shelf frame. */
const linePrint: Paint = (g, w, h) => {
  g.fillStyle = '#efe9df'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = 'rgba(70,74,60,.75)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(w / 2, h * 0.85)
  g.quadraticCurveTo(w * 0.46, h * 0.5, w * 0.52, h * 0.18)
  g.stroke()
  for (let i = 0; i < 7; i++) {
    const y = h * (0.75 - i * 0.08)
    const x = w * (0.49 + i * 0.004)
    for (const s of [-1, 1]) {
      g.beginPath()
      g.ellipse(x + s * 22, y - 8, 22, 7, s * -0.5, 0, Math.PI * 2)
      g.stroke()
    }
  }
}

/** A radial falloff in the alpha channel, white elsewhere (the material tints it black). */
const blot: Paint = (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  gr.addColorStop(0, 'rgba(255,255,255,0.9)')
  gr.addColorStop(0.55, 'rgba(255,255,255,0.45)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
}

function kitchenMaterials(ctx: Ctx) {
  const { k, lighting } = ctx
  const glow = (color: string, intensity: number) => lighting.glow(std({ color: '#fff3df', emissive: color, emissiveIntensity: intensity, roughness: 0.5 }), 1)
  // Light oak, laid at true scale: rx × ry tiles of the 600 mm board canvas.
  const oak = (rx: number, ry: number) => ctx.c.surface('oak', rx * 0.6, ry * 0.6)
  const stone = k.finish('statuario', 2, 1, 0.28)
  stone.color.set('#f7f1e8')
  return {
    oak,
    sage: std({ color: '#8b8d79', roughness: 0.55 }),
    carcass: std({ color: '#2b2b28', roughness: 0.8 }),
    plinth: std({ color: '#3a3a36', roughness: 0.9 }),
    stone,
    splash: ctx.c.surface('splash', 2.5, 0.6),
    paint: std({ color: '#f1ede6', roughness: 0.92 }),
    black: std({ color: '#151516', roughness: 0.45, metalness: 0.4 }),
    shade: std({ color: '#151516', roughness: 0.5, metalness: 0.4, side: DoubleSide }),
    blackGlass: std({ color: '#0d0e10', roughness: 0.08, metalness: 0.3 }),
    fridge: new MeshPhysicalMaterial({ color: '#232427', roughness: 0.32, metalness: 0.75, clearcoat: 0.4 }),
    steel: std({ color: '#3a3b3e', roughness: 0.3, metalness: 0.8 }),
    blinds: std({ color: '#2e2f31', roughness: 0.7 }),
    fabric: std({ color: '#c3b8aa', roughness: 1 }),
    ceramic: std({ color: '#f2efe9', roughness: 0.35 }),
    print: std({ map: k.tex.painted(256, 320, linePrint), roughness: 0.9 }),
    stoneware: std({ color: '#8e8c88', roughness: 0.6 }),
    bread: std({ color: '#b07a45', roughness: 0.8 }),
    glass: new MeshPhysicalMaterial({ color: '#e8f0ef', roughness: 0.04, transparent: true, opacity: 0.18, depthWrite: false }),
    led: glow('#ffc98a', 2.4),
    contact: new MeshBasicMaterial({ map: k.tex.painted(128, 128, blot), color: '#000000', transparent: true, depthWrite: false }),
    bulb: glow('#ffd8a0', 2.8),
    // The false ceiling faces down only: seen from the room, invisible from above in the room viewer.
    ceiling: new MeshStandardMaterial({ color: '#f3efe8', roughness: 0.95, side: FrontSide, shadowSide: DoubleSide, emissive: '#c9c0b2', emissiveIntensity: 0.55 }),
  }
}

type KM = ReturnType<typeof kitchenMaterials>

export function buildKitchen(ctx: Ctx) {
  const { k } = ctx
  const g = new Group()
  g.name = 'kitchen'
  g.position.set(KITCHEN.x0, GFL, KITCHEN.z0)
  k.root.add(g)
  const m = kitchenMaterials(ctx)
  /** A box by kitchen-frame extents: X, h, Y. */
  const bx = ([x0, x1]: R, [h0, h1]: R, [y0, y1]: R, mat: Material, cast = true, p: Group = g) =>
    k.box(p, x1 - x0, h1 - h0, y1 - y0, mat, (x0 + x1) / 2, (h0 + h1) / 2, (y0 + y1) / 2, cast)
  const K = { k, m, bx, g, ctx }

  shell(K)
  tallUnits(K)
  backRun(K)
  rightRun(K)
  uppers(K)
  bar(K)
  lighting(K)
}

type KC = { k: Ctx['k']; m: KM; bx: (x: R, h: R, y: R, mat: Material, cast?: boolean, p?: Group) => Mesh; g: Group; ctx: Ctx }

/** Floor tiles, the inner partitions, splashback stone and the false ceiling with downlights. */
function shell({ k, m, bx, g, ctx }: KC) {
  bx([0, KW], [0, 0.012], [0, KD], ctx.c.surface('porcelain', KW, KD), false)
  // Partition behind the tall units, and the short return at the kitchen's open front.
  bx([-0.115, 0], [0, 3.11], [0, KD + 0.115], m.paint)
  // The return is clad in the cabinet sage, so the tall-unit wall reads as one piece from the room.
  bx([-0.115, 0.62], [0, 3.11], [KD, KD + 0.115], m.sage)
  // Stone splashback between worktop and wall units, on the back and right walls (cut round the window).
  bx([BASE_D, KW], [TOP, UNDER], [0, 0.015], m.splash, false)
  const win = { y0: KITCHEN_WINDOW.z0 - KITCHEN.z0, y1: KITCHEN_WINDOW.z1 - KITCHEN.z0, h0: KITCHEN_WINDOW.y0 - GFL }
  bx([KW - 0.015, KW], [TOP, UNDER], [0.015, win.y0], m.splash, false)
  bx([KW - 0.015, KW], [TOP, win.h0], [win.y0, win.y1], m.splash, false)
  bx([KW - 0.015, KW], [TOP, UNDER], [win.y1, 1.63 + DY], m.splash, false)
  // Venetian blinds in the window, three-quarters drawn, as in the reference.
  for (let h = KITCHEN_WINDOW.y1 - GFL - 0.06; h > win.h0 + 0.3; h -= 0.045) {
    const s = bx([KW - 0.07, KW - 0.04], [h - 0.004, h + 0.004], [win.y0 + 0.02, win.y1 - 0.02], m.blinds, false)
    s.rotation.z = 0.35
  }
  bx([KW - 0.075, KW - 0.035], [KITCHEN_WINDOW.y1 - GFL - 0.06, KITCHEN_WINDOW.y1 - GFL], [win.y0, win.y1], m.black)

  const ceiling = new Mesh(new PlaneGeometry(KW, KD), m.ceiling)
  ceiling.rotation.x = PI / 2
  ceiling.position.set(KW / 2, KH, KD / 2)
  ceiling.receiveShadow = true
  g.add(ceiling)
  for (const [x, y] of [[0.95, 0.75], [2.3 + DX, 0.75], [0.95, 2.0 + DY], [2.3 + DX, 2.0 + DY]]) k.cyl(g, 0.045, 0.045, 0.01, m.bulb, x, KH - 0.004, y, 16).castShadow = false
}

/** Handle-less fronts: panels with 4 mm shadow gaps over a dark carcass. */
function fronts({ bx, m }: KC, axis: 'x' | 'y', [a0, a1]: R, [h0, h1]: R, face: number, splits: number[], rows: number[] = [], mat: Material = m.sage) {
  const cuts = [a0, ...splits, a1]
  const hs = [h0, ...rows, h1]
  for (let i = 0; i + 1 < cuts.length; i++)
    for (let j = 0; j + 1 < hs.length; j++) {
      const A: R = [cuts[i] + GAP / 2, cuts[i + 1] - GAP / 2]
      const H: R = [hs[j] + GAP / 2, hs[j + 1] - GAP / 2]
      if (axis === 'x') bx(A, H, [face - 0.02, face], mat)
      else bx([face, face + 0.02], H, A, mat)
    }
}

/** Left wall, back to front: oven tower, open-shelf column, black fridge and an end tall unit. */
function tallUnits(K: KC) {
  const { bx, m, k, g } = K
  const D = BASE_D
  // Oven tower: two drawers, a built-in oven and a compact oven, a cabinet over.
  bx([0, D - 0.02], [0.1, KH], [0, 0.62], m.carcass)
  bx([0, D - 0.06], [0, 0.1], [0, 0.62], m.plinth)
  fronts(K, 'y', [0, 0.62], [0.1, 0.86], D - 0.02, [], [0.48])
  fronts(K, 'y', [0, 0.62], [1.92, KH], D - 0.02, [])
  for (const [h0, h1] of [[0.86, 1.46], [1.46, 1.92]] as R[]) {
    bx([D - 0.02, D], [h0 + 0.01, h1 - 0.01], [0.02, 0.6], m.blackGlass)
    bx([D, D + 0.03], [h1 - 0.1, h1 - 0.08], [0.08, 0.54], m.steel)
  }
  // Open-shelf column over a cabinet: oak-lined, with jars and a plant.
  const C: R = [0.62, 0.98 + DY / 2]
  bx([0, D - 0.02], [0.1, 1.2], C, m.carcass)
  bx([0, D - 0.06], [0, 0.1], C, m.plinth)
  fronts(K, 'y', C, [0.1, 1.2], D - 0.02, [], [0.48, 0.86])
  // The open column above: sage sides and top around an oak-lined back.
  bx([0, D - 0.02], [1.2, KH], [C[0], C[0] + 0.02], m.sage)
  bx([0, D - 0.02], [1.2, KH], [C[1] - 0.02, C[1]], m.sage)
  bx([0, D - 0.02], [KH - 0.02, KH], C, m.sage)
  bx([0.0, 0.02], [1.2, KH - 0.02], [C[0] + 0.02, C[1] - 0.02], m.oak(0.5, 2))
  for (const h of [1.2, 1.52, 1.84, 2.16]) {
    bx([0.02, D - 0.03], [h, h + 0.025], [C[0] + 0.02, C[1] - 0.02], m.oak(0.5, 0.5))
    bx([D - 0.1, D - 0.07], [h - 0.008, h], [C[0] + 0.03, C[1] - 0.03], m.led, false)
  }
  // Everyday tableware on the column's shelves: glasses and a carafe, plates, mugs, bowls.
  tumblers(k, g, 0.3, 1.225, C[0] + 0.12, 3, 'z')
  carafe(k, g, 0.3, 1.225, C[1] - 0.14)
  plates(k, g, 0.3, 1.545, C[0] + 0.19, 6)
  plates(k, g, 0.3, 1.545, C[1] - 0.17, 5, 'side')
  for (const [i, glaze] of (['charcoal', 'oatmeal', 'charcoal'] as const).entries()) mug(k, g, 0.3, 1.865, C[0] + 0.14 + i * 0.2, 0.25 + i * 0.1, glaze)
  bowls(k, g, 0.3, 2.185, C[0] + 0.17, 4)
  bowls(k, g, 0.3, 2.185, C[1] - 0.18, 3, 'oatmeal')
  // Black French-door fridge, standing 100 mm proud of the cabinets.
  const F: R = [C[1], 1.9 + DY / 2]
  bx([0.02, 0.6], [0, 1.85], F, m.carcass)
  bx([0.6, 0.7], [0.05, 0.9], [F[0] + 0.01, F[1] - 0.01], m.fridge)
  bx([0.6, 0.7], [0.92, 1.85], [F[0] + 0.01, (F[0] + F[1]) / 2 - 0.004], m.fridge)
  bx([0.6, 0.7], [0.92, 1.85], [(F[0] + F[1]) / 2 + 0.004, F[1] - 0.01], m.fridge)
  for (const s of [-1, 1]) bx([0.7, 0.72], [1.1, 1.6], [(F[0] + F[1]) / 2 + s * 0.04 - 0.01, (F[0] + F[1]) / 2 + s * 0.04 + 0.01], m.steel)
  bx([0.7, 0.72], [0.8, 0.82], [F[0] + 0.15, F[1] - 0.15], m.steel)
  bx([0, D - 0.02], [1.85, KH], F, m.carcass)
  fronts(K, 'y', F, [1.86, KH], D - 0.02, [(F[0] + F[1]) / 2])
  // End tall unit, floor to ceiling, two-door.
  bx([0, D - 0.02], [0.1, KH], [F[1], KD], m.carcass)
  bx([0, D - 0.06], [0, 0.1], [F[1], KD - 0.02], m.plinth)
  fronts(K, 'y', [F[1], KD], [0.1, KH], D - 0.02, [(F[1] + KD) / 2], [1.3])
  bx([0, D], [0, KH], [KD - 0.02, KD], m.sage)
}

/** Back run: sage base units, stone top with an undermount black sink and black tap, gas hob. */
function backRun(K: KC) {
  const { bx, m, k, g } = K
  const X: R = [BASE_D, KW]
  bx(X, [0.1, TOP - 0.04], [0, BASE_D - 0.02], m.carcass)
  bx(X, [0, 0.1], [0, BASE_D - 0.06], m.plinth)
  fronts(K, 'x', X, [0.1, TOP - 0.04], BASE_D, [1.2, 1.62 + DX / 2, 2.18 + DX / 2, 2.4 + DX, 2.98 + DX], [])
  // Drawer stack in the back-right corner run.
  fronts(K, 'x', [2.4 + DX, 2.98 + DX], [0.1, TOP - 0.04], BASE_D + 0.0005, [], [0.36, 0.6])
  // Worktop around the sink cut-out.
  const S = { x0: 1.62 + DX / 2, x1: 2.18 + DX / 2, y0: 0.08, y1: 0.5 }
  bx([X[0], S.x0], [TOP - 0.04, TOP], [0, 0.62], m.stone)
  bx([S.x1, X[1]], [TOP - 0.04, TOP], [0, 0.62], m.stone)
  bx([S.x0, S.x1], [TOP - 0.04, TOP], [0, S.y0], m.stone)
  bx([S.x0, S.x1], [TOP - 0.04, TOP], [S.y1, 0.62], m.stone)
  bx([S.x0, S.x1], [0.68, 0.7], [S.y0, S.y1], m.black)
  bx([S.x0, S.x0 + 0.012], [0.68, TOP - 0.04], [S.y0, S.y1], m.black)
  bx([S.x1 - 0.012, S.x1], [0.68, TOP - 0.04], [S.y0, S.y1], m.black)
  bx([S.x0, S.x1], [0.68, TOP - 0.04], [S.y0, S.y0 + 0.012], m.black)
  bx([S.x0, S.x1], [0.68, TOP - 0.04], [S.y1 - 0.012, S.y1], m.black)
  // Matte black gooseneck tap.
  const tx = 1.9 + DX / 2
  k.cyl(g, 0.022, 0.026, 0.04, m.black, tx, TOP + 0.02, 0.05, 16)
  k.cyl(g, 0.012, 0.012, 0.34, m.black, tx, TOP + 0.19, 0.05, 12)
  const arc = new Mesh(new TorusGeometry(0.09, 0.012, 8, 20, PI), m.black)
  arc.position.set(tx, TOP + 0.36, 0.14)
  arc.rotation.y = PI / 2
  g.add(arc)
  k.cyl(g, 0.012, 0.012, 0.1, m.black, tx, TOP + 0.31, 0.23, 12)
  bx([tx + 0.02, tx + 0.09], [TOP + 0.08, TOP + 0.095], [0.04, 0.06], m.black)
  // Counter dressing: oak boards leaning on the stone and a bowl.
  for (const [x, ww, hh] of [[1.05, 0.26, 0.42], [1.22, 0.2, 0.32], [3.0 + DX, 0.22, 0.38]] as const) {
    const b = bx([x - ww / 2, x + ww / 2], [TOP, TOP + hh], [0.04, 0.06], m.oak(0.4, 0.6))
    b.rotation.x = -0.12
  }
  k.cyl(g, 0.08, 0.05, 0.05, m.stoneware, 1.42, TOP + 0.025, 0.48, 20)
}

/** Right run under the window, from the back corner to the bar. */
function rightRun(K: KC) {
  const { bx, m, k, g } = K
  const Y: R = [BASE_D, 1.63 + DY]
  bx([KW - BASE_D + 0.02, KW], [0.1, TOP - 0.04], Y, m.carcass)
  bx([KW - BASE_D + 0.06, KW], [0, 0.1], Y, m.plinth)
  fronts(K, 'y', Y, [0.1, TOP - 0.04], KW - BASE_D, [(Y[0] + Y[1]) / 2], [], m.sage)
  bx([KW - 0.62, KW], [TOP - 0.04, TOP], Y, m.stone)
  k.cyl(g, 0.06, 0.06, 0.18, m.glass, KW - 0.4, TOP + 0.09, Y[1] - 0.15, 16)
  // Black glass gas hob with four burners and a pan, centred under the window.
  const wy = (KITCHEN_WINDOW.z0 + KITCHEN_WINDOW.z1) / 2 - KITCHEN.z0
  const hx = KW - 0.31
  bx([hx - 0.25, hx + 0.25], [TOP, TOP + 0.008], [wy - 0.29, wy + 0.29], m.blackGlass)
  for (const [dx, dy] of [[-0.12, -0.14], [-0.12, 0.14], [0.12, -0.14], [0.12, 0.14]]) k.cyl(g, 0.045, 0.05, 0.025, m.steel, hx + dx, TOP + 0.02, wy + dy, 16)
  k.cyl(g, 0.12, 0.11, 0.09, m.stoneware, hx - 0.12, TOP + 0.08, wy + 0.14, 24)
  bx([hx - 0.3, hx - 0.13], [TOP + 0.11, TOP + 0.125], [wy + 0.135, wy + 0.145], m.black)
  // Control knobs along the hob's front edge.
  for (const dy of [-0.2, -0.07, 0.07, 0.2]) k.cyl(g, 0.016, 0.016, 0.02, m.steel, hx - 0.21, TOP + 0.018, wy + dy, 14)
}

/** Wall units: fluted oak panel, black open shelves, sage cabinets and a black-framed glass cabinet. */
function uppers(K: KC) {
  const { bx, m, k, g } = K
  // Ledge with the under-cabinet LED line, then the fluted panel in 30 mm battens at 50 mm.
  const PX: R = [BASE_D, 2.33 + DX]
  bx(PX, [UNDER - 0.02, UNDER], [0, 0.06], m.oak(1.5, 0.1))
  bx(PX, [UNDER - 0.026, UNDER - 0.02], [0.045, 0.055], m.led, false)
  bx(PX, [UNDER, PANEL_TOP], [0, 0.012], m.carcass)
  const batten = m.oak(0.05, 1)
  for (let x = BASE_D + 0.025; x < PX[1] - 0.01; x += 0.05) bx([x - 0.015, x + 0.015], [UNDER, PANEL_TOP], [0.012, 0.032], batten)

  // Open shelves in black steel, lit from beneath each shelf.
  const OX: R = [BASE_D, 1.56 + DX / 2]
  bx(OX, [PANEL_TOP, PANEL_TOP + 0.03], [0, UPPER_D - 0.05], m.black)
  bx(OX, [2.3, 2.315], [0, UPPER_D - 0.05], m.black)
  for (const x of [OX[0] + 0.01, (OX[0] + OX[1]) / 2, OX[1] - 0.01]) bx([x - 0.012, x + 0.012], [PANEL_TOP, KH], [0, UPPER_D - 0.05], m.black)
  bx(OX, [PANEL_TOP - 0.006, PANEL_TOP], [0.2, 0.26], m.led, false)
  bx(OX, [2.294, 2.3], [0.2, 0.26], m.led, false)
  bx(OX, [PANEL_TOP + 0.03, KH], [0, 0.01], m.oak(1, 0.3))
  // Lower shelf: plates and bowls in one bay, a row of glasses in the other; mugs and bowls above.
  const mid = (OX[0] + OX[1]) / 2
  const lo = PANEL_TOP + 0.03
  plates(k, g, OX[0] + 0.19, lo, 0.16, 6)
  bowls(k, g, mid - 0.17, lo, 0.16, 3)
  tumblers(k, g, mid + 0.12, lo, 0.15, 5, 'x', 0.1)
  for (const [i, glaze] of (['oatmeal', 'charcoal', 'oatmeal'] as const).entries()) mug(k, g, OX[0] + 0.13 + i * 0.15, 2.315, 0.15, 0.3, glaze)
  bowls(k, g, mid + 0.2, 2.315, 0.16, 2, 'charcoal')
  plates(k, g, OX[1] - 0.17, 2.315, 0.16, 4, 'side')

  // Sage wall cabinet over the panel's right part.
  bx([OX[1], PX[1]], [PANEL_TOP, KH], [0, UPPER_D - 0.02], m.carcass)
  fronts(K, 'x', [OX[1], PX[1]], [PANEL_TOP, KH], UPPER_D, [(OX[1] + PX[1]) / 2])

  // Glass-front cabinet in a black frame, oak-lined and lit, over the hob.
  const GX: R = [2.33 + DX, 2.82 + DX]
  bx(GX, [UNDER, KH], [0, 0.01], m.oak(0.8, 1.6))
  for (const h of [UNDER, 1.84, 2.17]) {
    bx([GX[0] + 0.02, GX[1] - 0.02], [h, h + 0.02], [0.01, UPPER_D - 0.03], m.black)
    bx([GX[0] + 0.03, GX[1] - 0.03], [h - 0.006, h], [0.28, 0.3], m.led, false)
  }
  bx(GX, [KH - 0.02, KH], [0, UPPER_D], m.black)
  for (const x of [GX[0], GX[1] - 0.02]) bx([x, x + 0.02], [UNDER, KH], [0, UPPER_D], m.black)
  bx([GX[0], GX[1]], [UNDER, KH], [UPPER_D - 0.012, UPPER_D - 0.006], m.glass, false)
  for (const x of [GX[0], (GX[0] + GX[1]) / 2 - 0.01, GX[1] - 0.02]) bx([x, x + 0.02], [UNDER, KH], [UPPER_D - 0.02, UPPER_D], m.black)
  for (const h of [UNDER, 1.84, 2.17, KH - 0.02]) bx(GX, [h, h + 0.02], [UPPER_D - 0.02, UPPER_D], m.black)
  // Glassware on display behind the glass: tumblers, stemmed glasses, then serving bowls and plates.
  tumblers(k, g, GX[0] + 0.1, UNDER + 0.02, 0.12, 4, 'x', 0.095)
  tumblers(k, g, GX[0] + 0.15, UNDER + 0.02, 0.22, 3, 'x', 0.095)
  wineGlasses(k, g, GX[0] + 0.1, 1.86, 0.16, 3, 'x', 0.14)
  bowls(k, g, GX[0] + 0.14, 2.19, 0.17, 3)
  plates(k, g, GX[1] - 0.15, 2.19, 0.17, 5, 'side')
  // Narrow sage cabinet in the back-right corner.
  bx([GX[1], KW], [UNDER, KH], [0, UPPER_D - 0.02], m.carcass)
  fronts(K, 'x', [GX[1], KW], [UNDER, KH], UPPER_D, [])
}

/** Breakfast bar: stone top and waterfall end, fluted oak front lit from under the top, two stools, two pendants. */
function bar(K: KC) {
  const { bx, m, k, g } = K
  const X: R = [1.6 + DX, KW]
  const Y: R = [1.63 + DY, 2.3 + DY]
  bx([X[0] + 0.05, X[1]], [0, BAR_TOP - 0.05], [Y[0], Y[1] - 0.1], m.sage)
  const slat = m.oak(0.06, 1)
  for (let x = X[0] + 0.075; x < X[1] - 0.01; x += 0.05) bx([x - 0.017, x + 0.017], [0.01, BAR_TOP - 0.05], [Y[1] - 0.1, Y[1] - 0.06], slat)
  bx(X, [BAR_TOP - 0.05, BAR_TOP], Y, m.stone)
  bx([X[0], X[0] + 0.05], [0, BAR_TOP - 0.05], Y, m.stone)
  bx([X[0] + 0.07, X[1] - 0.02], [BAR_TOP - 0.058, BAR_TOP - 0.05], [Y[1] - 0.05, Y[1] - 0.03], m.led, false)
  // Oak tray with bread, and a glass jar.
  k.cyl(g, 0.16, 0.16, 0.02, m.oak(0.5, 0.5), 2.35 + DX, BAR_TOP + 0.01, 1.95 + DY, 24)
  k.blob(g, 0.07, m.bread, 2.33 + DX, BAR_TOP + 0.05, 1.94 + DY, 0.6)
  k.blob(g, 0.06, m.bread, 2.42 + DX, BAR_TOP + 0.045, 1.98 + DY, 0.6)

  // Open oak shelving standing on the bar's end, against the right wall.
  const NX: R = [KW - 0.26, KW]
  const NY: R = [1.68 + DY, 2.26 + DY]
  bx(NX, [BAR_TOP, KH], [NY[0], NY[0] + 0.04], m.paint)
  bx(NX, [BAR_TOP, KH], [NY[1] - 0.04, NY[1]], m.paint)
  bx([KW - 0.02, KW], [BAR_TOP, KH], [NY[0] + 0.04, NY[1] - 0.04], m.oak(0.6, 2))
  for (const h of [BAR_TOP, 1.5, 2.02]) bx([NX[0], KW - 0.02], [h, h + 0.03], [NY[0] + 0.04, NY[1] - 0.04], m.oak(0.5, 0.3))
  // LED strips tucked under the front edge of each shelf, washing the shelf below.
  for (const h of [1.5, 2.02, KH]) bx([NX[0] + 0.015, NX[0] + 0.035], [h - 0.006, h], [NY[0] + 0.05, NY[1] - 0.05], m.led, false)
  // A framed print leaning on the middle shelf.
  bx([KW - 0.05, KW - 0.03], [1.53, 1.8], [1.85 + DY, 2.08 + DY], m.black).rotation.z = 0.08
  bx([KW - 0.053, KW - 0.05], [1.56, 1.77], [1.88 + DY, 2.05 + DY], m.print, false).rotation.z = 0.08
  // A carafe and glasses on the top shelf; cutlery and side plates at bar height, ready for breakfast.
  carafe(k, g, KW - 0.14, 2.05, NY[0] + 0.15)
  tumblers(k, g, KW - 0.14, 2.05, NY[0] + 0.3, 2, 'z', 0.1)
  cutleryCrock(k, g, KW - 0.14, BAR_TOP + 0.03, NY[0] + 0.14)
  plates(k, g, KW - 0.14, BAR_TOP + 0.03, NY[1] - 0.17, 4, 'side')

  for (const x of [2.03, 2.65]) {
    counterStool(k, g, x + DX, 2.64 + DY, PI)
    contactShadow(K, x + DX, 2.64 + DY, 0.62, 0.6, 0.55)
  }
  // Soft occlusion where the bar and the base units meet the floor.
  contactShadow(K, (X[0] + X[1]) / 2, Y[1] - 0.05, X[1] - X[0] + 0.1, 0.32, 0.45)
  // The pendants hang over the working floor, in front of the wall units, as in the reference.
  for (const x of [1.78, 2.5]) pendant(K, x + DX / 2, 1.1 + DY / 2, 1.86)
}

/** A soft, darkening blot on the floor where furniture stands: cheap ambient occlusion. */
function contactShadow({ g, m }: KC, x: number, y: number, w: number, d: number, opacity: number) {
  const mat = m.contact.clone()
  mat.opacity = opacity
  const s = new Mesh(new PlaneGeometry(w, d), mat)
  s.rotation.x = -PI / 2
  s.position.set(x, 0.014, y)
  s.renderOrder = 1
  g.add(s)
}

/** Black cone pendant on a cord from the false ceiling, with a warm lamp at its mouth. */
function pendant({ k, m, g }: KC, x: number, y: number, bottom: number) {
  const shade = new Mesh(new CylinderGeometry(0.025, 0.11, 0.24, 28, 1, true), m.shade)
  shade.position.set(x, bottom + 0.12, y)
  g.add(shade)
  k.cyl(g, 0.004, 0.004, KH - bottom - 0.24, m.black, x, (KH + bottom + 0.24) / 2, y, 6)
  k.cyl(g, 0.09, 0.09, 0.005, m.bulb, x, bottom + 0.01, y, 20).castShadow = false
}

/** Interior lights: downlight washes, under-cabinet glow and the pendants over the bar. */
function lighting({ g, ctx }: KC) {
  const add = (x: number, h: number, y: number, intensity: number, distance: number, color = '#ffdcb0') => {
    const l = new PointLight(color, intensity, distance, 2)
    l.position.set(x, h, y)
    g.add(l)
    ctx.lighting.light(l, 1)
    return l
  }
  // One ceiling light casts real shadows (stools, bar, cabinet edges); the rest are soft fill.
  const key = add(1.6 + DX / 2, 2.38, 1.5 + DY / 2, 8, 6, '#fff1de')
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.bias = -0.002
  key.shadow.normalBias = 0.02
  key.shadow.camera.near = 0.05
  add(0.95, 2.35, 0.9, 4, 5, '#fff1de')
  add(2.3 + DX, 2.35, 0.9, 4, 5, '#fff1de')
  add(1.6 + DX / 2, 2.3, 2.1 + DY, 4, 5, '#fff1de')
  add(1.5 + DX / 2, 1.35, 0.3, 2.4, 2)
  add(2.15 + DX / 2, 1.7, 1.1 + DY / 2, 2.4, 2.4)
}
