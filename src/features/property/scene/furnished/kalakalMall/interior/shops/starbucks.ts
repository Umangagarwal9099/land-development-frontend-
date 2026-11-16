import { CylinderGeometry, Group, MeshStandardMaterial, type Material, type Object3D } from 'three'
import { setCircuit, circuit, switchPlate } from '../../../kalakalD65/fixtures'
import { clipped, inside, subtract, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { batchBrewer, blender, cashDrawer, coldBrewTap, coldCup, cup, cupStack, decal, espressoMachine, fridge, grinder, info, lathe, pastryCase, syrupBottle, till, tube } from './cafe'
import { cafeMaterials, menuBoard, type MenuBoard } from './cafeArt'
import {
  beanBag, fallenLeaves, flowerPot, highTable, leafCanopy, mug, pumpkin, reusableCup, roundHighTable, shelving, sirenDisc, stool, tableDressing, tumbler, wallShelf,
} from './cafeDecor'
import { trackSpots } from './goods'
import { at, box, flat, lamp, mbox, mesh, onCircuit, openShop, pane, PI, rect, skirting, swingLeaf } from './kit'

/*
 * Starbucks, unit G-09: the café in the mall's north-east corner off the east spine, glazed to
 * the forecourt round its curved corner. Built from the reference photograph, looking in from
 * the door:
 *
 *   ahead     the counter across the back, under seven menu boards on white-painted brick, white
 *             cups on oak shelves over the back bar: the till, the curved pastry case of bakes,
 *             two espresso machines facing the baristas, the hand-off; behind, the batch brewer,
 *             grinder, cold brew tap, hand sink, milk fridges, the syrups and the blenders
 *   left      a concrete wall with oak and black-steel merchandise shelving, the autumn mural,
 *             and behind the counter the round lit siren; a long oak high table with stools
 *   right     the curved glass to the forecourt, oak high tables along it with stools, autumn
 *             flowers and pumpkins on them and at their feet
 *   above     a black open ceiling with a grid of black timber battens and track spots, a canopy
 *             of red and orange maple leaves hung over the entrance with the great green siren
 *             in it; leaves fallen on the pale polished concrete floor; setts at the door
 *
 * Interactive: the entrance doors, the counter gate, the fridge and cabinet doors, the pastry
 * case's doors, the cash drawer and the blender hoods open; the espresso machines brew and
 * steam, the grinder grinds, the brewer and the cold brew tap pour, the blenders blend, the till
 * rings up; two switches by the door work the café's lights and the menu boards and displays;
 * every machine, table, stool, menu board, product and sign explains itself when tapped.
 */

/** The plan: the front on x = 11.3, the back glass at x = 17.04 curving round to the forecourt glass at z = 12.18. */
const FX = 11.3
const Z0 = 3.575
const ARC = { x: 13.4, z: 8.6, r: 3.63 }
/** The back wall lining the north glass, and the counter's lines. */
const BACK = 16.8
const BAR0 = 16.15
const C0 = 14.4
const C1 = 15.15
const CZ0 = 4.3
const CZ1 = 9.3
const TOP = 0.99
/** The black ceiling, and the underside of its battens. */
const CEIL = 4.3
const BATTEN = 3.95

const MENU: MenuBoard[] = [
  { kind: 'image', title: 'Pumpkin Spice Latte', lines: ['Espresso, steamed milk, pumpkin spice', 'Back for autumn'], image: 'psl' },
  { kind: 'image', title: 'Caffè Latte', lines: ['Signature Espresso, velvety milk'], image: 'latte' },
  { kind: 'image', title: 'Nitro Cold Brew', lines: ['Slow-steeped 20 hours, served on tap'], image: 'coldbrew' },
  { kind: 'list', title: 'Handcrafted Espresso', lines: ['Caffè Latte|295 · 335 · 375', 'Cappuccino|295 · 335 · 375', 'Caramel Macchiato|345 · 385 · 425', 'Caffè Mocha|325 · 365 · 405', 'Flat White|315 · 355', 'Caffè Americano|245 · 285 · 325', 'Espresso|195 · 225'] },
  { kind: 'list', title: 'Autumn Favourites', lines: ['Pumpkin Spice Latte|355 · 395 · 435', 'Pumpkin Cream Cold Brew|365 · 405 · 445', 'Apple Crisp Macchiato|355 · 395 · 435', 'Salted Caramel Mocha|345 · 385 · 425', 'Chai Tea Latte|285 · 325 · 365', 'Hot Chocolate|265 · 305 · 345'] },
  { kind: 'list', title: 'Frappuccino® Blended', lines: ['Java Chip|335 · 375 · 415', 'Caramel|325 · 365 · 405', 'Mocha|325 · 365 · 405', 'Strawberry Crème|315 · 355 · 395', 'Matcha Crème|335 · 375 · 415', 'Pumpkin Spice|355 · 395 · 435'] },
  { kind: 'list', title: 'Brewed & Bakery', lines: ['Coffee of the Day|215 · 245 · 275', 'Cold Brew|275 · 315 · 355', 'Teavana™ Tea|215 · 245 · 275', 'Butter Croissant|245', 'Blueberry Muffin|265', 'Banana Bread|225', 'Chocolate Cake|325'] },
]

export function buildStarbucks(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux, m: mm } = e
  const { g, y: Y } = s
  const c = cafeMaterials(e)
  const soffit = e.soffit
  const outline = clipped(e, u.rects[0])
  const within = (x: number, z: number) => inside(outline, x, z)
  /** The inside of the glass's curve, at z (for z beyond the straight back). */
  const glassX = (z: number) => (z <= ARC.z ? 17.04 : ARC.x + Math.sqrt(Math.max(0, ARC.r ** 2 - (z - ARC.z) ** 2)))
  const toGlass = (x: number, z: number) => (z <= ARC.z ? 17.04 - x : x <= ARC.x ? 12.18 - z : ARC.r - Math.hypot(x - ARC.x, z - ARC.z))

  // Two circuits: the café's lights, and the menu boards and displays.
  const display = circuit()
  const led = onCircuit(s, lux.led as MeshStandardMaterial)
  const displayLed = lux.led.clone() as MeshStandardMaterial
  displayLed.userData.interior = true
  display.glows.push(displayLed)
  const litSiren = new MeshStandardMaterial({ map: c.sirenTex, emissiveMap: c.sirenTex, emissive: '#ffffff', emissiveIntensity: 0.75, roughness: 0.35 })
  litSiren.userData.interior = true
  display.glows.push(litSiren)
  const lit = (mat: MeshStandardMaterial) => (display.glows.push(mat), mat)

  /* ---------- floor ---------- */
  flat(g, outline, Y + 0.006, c.concrete, false, [], 'sbux_floor')
  flat(g, rect(FX, 12.15, 4.7, 7.1), Y + 0.0075, c.pavers, false, [], 'sbux_setts')
  for (const [a, b] of [[4.7, 7.1]] as const) {
    k.box(g, 0.012, 0.004, b - a, lux.steel, 12.15, Y + 0.008, (a + b) / 2, false)
  }
  // The baristas' mat behind the bar.
  k.box(g, 0.8, 0.012, 2.6, c.rubber, (C1 + BAR0) / 2, Y + 0.012, 7.4, false)

  /* ---------- the black open ceiling, its battens, track spots, the air-conditioning cassette ---------- */
  flat(g, outline, Y + CEIL, c.ceiling, true, [], 'sbux_ceiling')
  for (let z = Z0 + 0.12; z < 12.1; z += 0.3) {
    const x1 = Math.min(BACK, glassX(z)) - 0.1
    if (x1 - FX < 0.5) continue
    k.box(g, x1 - FX - 0.1, 0.11, 0.045, c.blackTimber, (FX + 0.1 + x1) / 2, Y + BATTEN + 0.055, z, false)
  }
  for (let x = 12.0; x < 16.8; x += 1.2) {
    // Cross beams over the battens, to the glass.
    let z1 = 12.1
    while (z1 > Z0 && !within(x, z1 - 0.08)) z1 -= 0.05
    k.box(g, 0.07, 0.16, z1 - Z0 - 0.05, c.blackTimber, x, Y + BATTEN + 0.19, (Z0 + z1) / 2, false)
  }
  {
    const ac = at(g, 12.95, Y + BATTEN - 0.06, 7.0, 0)
    k.box(ac, 0.62, 0.06, 0.62, c.lidWhite, 0, 0.03, 0)
    for (let i = 0; i < 4; i++) {
      const a = (i * PI) / 2
      const slot = k.box(ac, 0.44, 0.004, 0.06, c.blackMatte, Math.sin(a) * 0.24, -0.001, Math.cos(a) * 0.24, false)
      slot.rotation.y = a
    }
    k.box(ac, 0.3, 0.004, 0.3, c.brushed, 0, -0.001, 0, false)
    k.box(ac, 0.5, 0.3, 0.5, c.blackMatte, 0, 0.21, 0)
  }
  trackSpots(s, g, 12.25, Z0 + 0.6, 12.25, 11.6, Y + BATTEN, 7, led, PI / 2, 0.75)
  trackSpots(s, g, 13.85, Z0 + 0.6, 13.85, 10.8, Y + BATTEN, 6, led, PI / 2, 0.55)
  trackSpots(s, g, 15.6, Z0 + 0.4, 15.6, CZ1 - 0.2, Y + BATTEN, 6, led, PI / 2, 0.45)

  /* ---------- the shopfront on x = 11.3, z = 3.5 … 8.3, the doors at z = 4.7 … 7.1 ---------- */
  box(s, FX - 0.075, FX + 0.075, Y + 4.2, soffit, 3.5, 8.3, mm.wallPaint)
  // The fascia: dark walnut boarding over the gallery, the siren and the name lit on it.
  const F0 = FX - 0.32
  mbox(g, 0.3, 0.9, 4.9, c.walnutBoards, FX - 0.17, Y + 3.75, 5.9)
  k.box(g, 0.32, 0.03, 4.92, c.blackMatte, FX - 0.17, Y + 3.3, 5.9)
  k.box(g, 0.01, 0.006, 4.8, led, F0 + 0.02, Y + 3.28, 5.9, false)
  const fasciaSiren = litSiren.clone()
  fasciaSiren.userData.interior = true
  sirenDisc(s, c, g, F0 - 0.03, Y + 3.75, 4.45, -PI / 2, 0.34, fasciaSiren, false)
  {
    const t = c.canvas(1024, 160, (cx, w, h) => {
      cx.clearRect(0, 0, w, h)
      cx.fillStyle = '#ffffff'
      cx.textAlign = 'center'
      cx.textBaseline = 'middle'
      cx.font = `800 ${Math.round(h * 0.72)}px "Inter", "Helvetica Neue", Arial, sans-serif`
      const word = 'STARBUCKS'
      const sp = h * 0.16
      let x = w / 2 - (cx.measureText(word).width + sp * (word.length - 1)) / 2
      cx.textAlign = 'left'
      for (const ch of word) {
        cx.fillText(ch, x, h * 0.54)
        x += cx.measureText(ch).width + sp
      }
    })
    const name = new MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.7, alphaTest: 0.5, roughness: 0.4 })
    name.userData.interior = true
    decal(g, name, 2.6, 0.41, F0 - 0.004, Y + 3.75, 6.55, -PI / 2)
  }
  // Concrete pilasters at the ends; black-steel framed glazing; the transom over the doors.
  for (const [a, b] of [[3.5, 3.72], [8.08, 8.3]] as const) mbox(g, 0.15, 3.3, b - a, c.concretePanel, FX - 0.0, Y + 1.65, (a + b) / 2)
  const frame = lux.blackSteel
  for (const zz of [3.74, 4.68, 7.12, 8.06]) box(s, FX - 0.035, FX + 0.035, Y, Y + 3.27, zz - 0.025, zz + 0.025, frame)
  box(s, FX - 0.04, FX + 0.04, Y + 3.22, Y + 3.29, 3.72, 8.08, frame)
  box(s, FX - 0.04, FX + 0.04, Y + 2.68, Y + 2.74, 4.68, 7.12, frame)
  box(s, FX - 0.03, FX + 0.03, Y, Y + 0.05, 3.72, 4.68, frame)
  box(s, FX - 0.03, FX + 0.03, Y, Y + 0.05, 7.12, 8.08, frame)
  pane(s, g, FX, 3.77, FX, 4.655, Y + 0.05, Y + 3.22)
  pane(s, g, FX, 7.145, FX, 8.03, Y + 0.05, Y + 3.22)
  pane(s, g, FX, 4.705, FX, 7.095, Y + 2.74, Y + 3.22)
  // The doors: glass in black steel, folded right back against the glass outside while the café trades.
  const DX = FX - 0.075
  const right = at(g, DX, Y, 4.7, -PI / 2)
  swingLeaf(s, right, 'sbux_r', 1.17, 2.66, frame, -PI + 0.06, true)
  const left = at(g, DX, Y, 7.1, PI / 2)
  swingLeaf(s, left, 'sbux_l', 1.17, 2.66, frame, PI - 0.06, true)
  e.shade.foot(FX + 0.08, 3.5, FX + 0.08, 8.3, Y + 0.01, 0.2, 0.25)

  /* ---------- walls ---------- */
  // The side wall (z = 3.5) in board-marked concrete, the party wall (x = 11.3) the same.
  mbox(g, BACK - FX - 0.075, CEIL, 0.02, c.concretePanel, (FX + 0.075 + BACK) / 2, Y + CEIL / 2, Z0 + 0.01)
  mbox(g, 0.02, CEIL, 12.12 - 8.3, c.concretePanel, FX + 0.085, Y + CEIL / 2, (8.3 + 12.12) / 2)
  // The back wall, lining the north glass: white-painted brick from the floor to the ceiling.
  box(s, BACK, BACK + 0.12, Y, Y + CEIL, Z0, CZ1 + 0.1, c.blackMatte)
  mbox(g, 0.02, CEIL, CZ1 + 0.1 - Z0, c.brick, BACK - 0.01, Y + CEIL / 2, (Z0 + CZ1 + 0.1) / 2)
  // The staff end of the counter, closed by a wall of shelving to the glass.
  box(s, C1, glassX(CZ1 + 0.1) - 0.04, Y, Y + 2.5, CZ1, CZ1 + 0.1, c.concretePanel)
  k.box(g, glassX(CZ1 + 0.1) - 0.04 - C1, 0.03, 0.12, c.oak, (C1 + glassX(CZ1 + 0.1) - 0.04) / 2, Y + 2.515, CZ1 + 0.05)
  skirting(s, g, FX + 0.075, Z0 + 0.02, C0, Z0 + 0.02, c.blackMatte)
  skirting(s, g, FX + 0.095, 12.1, FX + 0.095, 8.3, c.blackMatte)

  /* ---------- the counter: till, pastry case, espresso bar, hand-off ---------- */
  const counter = (z0: number, z1: number, gaps: [number, number][] = []) => {
    k.box(g, C1 - C0 - 0.08, 0.1, z1 - z0, c.blackMatte, (C0 + C1) / 2 + 0.04, Y + 0.05, (z0 + z1) / 2)
    mbox(g, 0.02, 0.85, z1 - z0, c.walnutBoards, C0 + 0.01, Y + 0.1 + 0.425, (z0 + z1) / 2)
    for (const [a, b] of subtract([z0, z1], gaps)) k.box(g, C1 - C0 - 0.02, 0.85, b - a, c.blackMatte, (C0 + C1) / 2 + 0.01, Y + 0.525, (a + b) / 2)
    k.soft(g, C1 - C0 + 0.06, 0.04, z1 - z0, 0.004, c.oak, (C0 + C1) / 2, Y + TOP - 0.02, (z0 + z1) / 2)
    k.box(g, 0.006, 0.006, z1 - z0 - 0.1, led, C0 - 0.025, Y + TOP - 0.05, (z0 + z1) / 2, false)
  }
  counter(CZ0, 5.36)
  counter(6.84, CZ1, [[7.3, 7.9]])
  // Under the espresso machines, on the baristas' side, the bar's own milk fridge.
  fridge(s, c, g, 'bar', C1 - 0.3, 7.6, PI / 2, 0.59, TOP - 0.06, 1)
  // Its ends in walnut.
  for (const zz of [CZ0, CZ1]) mbox(g, C1 - C0, 0.95, 0.02, c.walnutBoards, (C0 + C1) / 2, Y + 0.475, zz + (zz === CZ0 ? -0.01 : 0.01))
  // The pastry case in the counter's line, its glass towards the customers.
  info(s, pastryCase(s, c, g, C0 + 0.36, 6.1, -PI / 2, 1.48, displayLed), {
    title: 'Pastry Case',
    kind: 'Refrigerated bakery display',
    body: 'A curved-glass refrigerated case set into the counter, holding the day\'s bakes at 4 °C on two lit tiers: butter croissants, blueberry and chocolate muffins, chocolate cake, banana bread, cookies and cake pops. The staff serve from the back through sliding doors (tap them).',
    specs: ['1.5 m long, two tiers on LED light lines', 'Curved front glass; sliding rear doors', 'Price card at every tray'],
  })

  // The till end: the till, the card terminal, cup stacks, the cash drawer under the top.
  info(s, till(s, c, g, 14.8, Y + TOP, 4.82, PI / 2), {
    title: 'Till', kind: 'Point of sale',
    body: 'The order point: the barista\'s touch screen on a swivel stand with the customer display on its back, a receipt printer, and the card terminal at the counter\'s edge. Tap the screen to ring an order through; the cash drawer under the counter on the staff side slides open.',
    specs: ['Touch screen with order tiles', 'Customer-facing display', 'Contactless, chip and UPI payments'],
  })
  {
    const term = at(g, C0 + 0.12, Y + TOP, 4.55, -PI / 2)
    const t = k.soft(term, 0.08, 0.03, 0.15, 0.01, c.blackMatte, 0, 0.04, 0)
    t.rotation.x = -0.3
    k.box(term, 0.06, 0.004, 0.06, c.blackGloss, 0, 0.058, 0.03, false).rotation.x = -0.3
    k.cyl(term, 0.04, 0.05, 0.02, c.blackMatte, 0, 0.01, 0, 20)
  }
  cashDrawer(s, c, g, C1, Y + TOP - 0.13, 4.85, PI / 2)
  for (const [i, size] of (['tall', 'grande', 'venti'] as const).entries()) cupStack(s, c, g, size, 15.02, Y + TOP, 5.08 + i * 0.1, 12)

  // The espresso bar: two machines facing the baristas, their pitchers, the knock box, the shots.
  const machines = [7.25, 8.02].map((z, i) => {
    const mach = espressoMachine(s, c, g, 14.78, Y + TOP, z, PI / 2, c.siren)
    info(s, mach, {
      title: `Espresso Machine ${i + 1}`,
      kind: 'Super-automatic espresso machine',
      body: 'A super-automatic espresso machine of the kind Starbucks bars run on: it grinds, doses, tamps and extracts each shot itself from the two hoppers of Signature Espresso beans, and steams milk at either side. The baristas work its touch screen; tap the screen to pull a double shot, or a steam knob to steam milk.',
      specs: ['Two bean hoppers; built-in conical burr grinders', 'Double shot in 25 seconds', 'Two steam wands with auto-texturing', 'Facing the baristas, the house green to the customers'],
    })
    return mach
  })
  void machines
  {
    // A knock box and a rinser between the machines' pitchers.
    k.soft(g, 0.14, 0.12, 0.14, 0.02, c.blackMatte, 15.0, Y + TOP + 0.06, 6.95)
    k.cyl(g, 0.015, 0.015, 0.14, c.rubber, 15.0, Y + TOP + 0.12, 6.95, 10).rotation.x = PI / 2
  }
  // The hand-off: drinks waiting under the lit "Pick up" sign, a pumpkin and flowers on the counter.
  {
    const ho = at(g, 14.62, Y + TOP, 8.85, 0)
    cup(s, c, ho, 'grande', 0, 0, -0.18, -PI / 2, true, true, c.siren)
    coldCup(s, c, ho, 0.04, 0, 0.0, c.espresso, true)
    cup(s, c, ho, 'venti', -0.02, 0, 0.17, -PI / 2, true, true, c.siren)
    info(s, ho, {
      title: 'Hand-off Plane', kind: 'Order collection',
      body: 'Where the baristas call each finished drink by name and set it down: a grande Pumpkin Spice Latte, an iced Caffè Latte with cold foam and a venti Caffè Americano are waiting now.',
      specs: ['Under the lit "Pick up" sign', 'Lids, sleeves and straws to hand'],
    })
    pumpkin(s, c, g, 14.6, Y + TOP, 9.15, 0.06)
    const signT = c.canvas(512, 160, (cx, w, h) => {
      cx.fillStyle = '#1e3932'
      cx.fillRect(0, 0, w, h)
      cx.fillStyle = '#ffffff'
      cx.textAlign = 'center'
      cx.textBaseline = 'middle'
      cx.font = `700 ${Math.round(h * 0.42)}px "Inter", Arial, sans-serif`
      cx.fillText('PICK UP', w / 2, h * 0.52)
    })
    const signM = lit(new MeshStandardMaterial({ map: signT, emissiveMap: signT, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.4 }))
    signM.userData.interior = true
    const sg = at(g, C0 + 0.2, Y + 2.45, 8.85, -PI / 2)
    k.box(sg, 0.8, 0.27, 0.04, c.blackMatte, 0, 0, 0)
    decal(sg, signM, 0.76, 0.24, 0, 0, 0.021)
    const back = decal(sg, signM, 0.76, 0.24, 0, 0, -0.021, PI)
    void back
    for (const dx of [-0.3, 0.3]) k.box(sg, 0.006, Y + BATTEN - (Y + 2.45) - 0.13, 0.006, c.blackMatte, dx, (BATTEN - 2.45) / 2 + 0.065, 0, false)
  }
  // Autumn flowers on the pastry case and at the till end.
  flowerPot(s, c, g, C0 + 0.12, Y + TOP, 9.12, 0.07, 'basket', 3)
  pumpkin(s, c, g, C0 + 0.13, Y + TOP, 4.42, 0.05, true)

  // The counter gate: a half door from the wall to the counter's end, swinging in to the staff side.
  {
    const gate = new Group()
    gate.name = 'door_sbux_gate'
    gate.userData.label = 'Counter gate'
    gate.userData.openAngle = PI / 2 - 0.1
    gate.position.set((C0 + C1) / 2, Y, Z0 + 0.03)
    gate.rotation.y = -PI / 2
    g.add(gate)
    const w = CZ0 - Z0 - 0.05
    mbox(gate, w, 0.95, 0.035, c.walnutBoards, w / 2, 0.1 + 0.475, 0).userData.front = true
    k.box(gate, w, 0.03, 0.05, c.oak, w / 2, 1.06, 0)
    k.box(gate, 0.03, 0.12, 0.03, c.blackMatte, w - 0.06, 0.8, 0.03)
  }

  /* ---------- the back bar ---------- */
  const barMid = (BACK + BAR0) / 2
  const barTop = 0.9
  k.box(g, BACK - BAR0 - 0.08, 0.1, CZ1 - Z0, c.blackMatte, barMid + 0.04, Y + 0.05, (Z0 + CZ1) / 2)
  k.box(g, 0.02, 0.06, CZ1 - Z0 - 0.02, c.blackMatte, BACK - 0.01, Y + barTop + 0.03, (Z0 + CZ1) / 2)
  k.soft(g, BACK - BAR0 + 0.03, 0.035, CZ1 - Z0 - 0.02, 0.004, c.ceramic, barMid - 0.015, Y + barTop - 0.0175, (Z0 + CZ1) / 2)
  // Cabinets under the top (walnut doors that open), two milk fridges under the espresso side.
  const cabinet = (z0: number, z1: number, n: number, name: string) => {
    // An open carcass: a white lining, a back, a bottom and dividers, so its stock shows when a door opens.
    const ch = barTop - 0.035 - 0.1
    k.box(g, 0.02, ch, z1 - z0, c.cupPaper, BACK - 0.03, Y + 0.1 + ch / 2, (z0 + z1) / 2)
    k.box(g, BACK - BAR0 - 0.04, 0.02, z1 - z0, c.cupPaper, barMid + 0.02, Y + 0.11, (z0 + z1) / 2)
    const w = (z1 - z0) / n
    for (let i = 0; i <= n; i++) k.box(g, BACK - BAR0 - 0.04, ch, 0.018, i === 0 || i === n ? c.blackMatte : c.cupPaper, barMid + 0.02, Y + 0.1 + ch / 2, Math.min(z1 - 0.009, Math.max(z0 + 0.009, z0 + i * w)))
    for (let i = 0; i < n; i++) {
      const za = z0 + i * w
      const hingeLeft = i % 2 === 0
      const d = new Group()
      d.name = `door_sbux_cab_${name}_${i}`
      d.userData.label = 'Cabinet door'
      d.position.set(BAR0 - 0.005, Y + 0.1, hingeLeft ? za + 0.003 : za + w - 0.003)
      d.rotation.y = -PI / 2
      d.userData.openAngle = hingeLeft ? -1.7 : 1.7
      g.add(d)
      const dir = hingeLeft ? 1 : -1
      const leaf = mbox(d, w - 0.006, barTop - 0.1 - 0.045, 0.02, c.walnutBoards, (dir * (w - 0.006)) / 2, (barTop - 0.145) / 2, -0.01)
      leaf.userData.front = true
      k.box(d, 0.012, 0.14, 0.02, c.blackMatte, dir * (w - 0.06), barTop - 0.3, 0.012)
      // Behind each, shelves of stock: sleeves of cups, boxes of lids, bags of beans.
      k.box(g, BACK - BAR0 - 0.1, 0.012, w - 0.04, c.cupPaper, barMid + 0.02, Y + 0.45, za + w / 2, false)
      for (let j = 0; j < 2; j++) k.box(g, 0.32, 0.22, 0.12, j ? c.wrap : c.sleeve, barMid + 0.05, Y + 0.12 + 0.11, za + 0.1 + j * 0.15, false)
      beanBag(s, c, g, barMid + 0.05, Y + 0.456, za + w / 2, -PI / 2, i)
    }
  }
  cabinet(Z0 + 0.02, 6.3, 4, 'a')
  for (const [i, z] of [6.3, 6.9].entries()) fridge(s, c, g, `milk${i}`, barMid + 0.025, z + 0.3, -PI / 2, 0.59, barTop - 0.04, i ? 1 : -1)
  cabinet(7.5, CZ1 - 0.02, 2, 'b')

  // On the back bar: batch brewer, grinder, cold brew tap, hand sink, syrups, blenders.
  const brewer = batchBrewer(s, c, g, barMid - 0.02, Y + barTop, 4.15, -PI / 2)
  info(s, brewer, {
    title: 'Batch Brewer', kind: 'Twin coffee brewer',
    body: 'A twin batch brewer that brews the coffee of the day into two insulated shuttles, two litres at a time, at 90 to 96 °C. Tap a brew key to start a batch.',
    specs: ['Two 1.9 L shuttles with sight gauges', 'Pre-infusion and pulse brewing', 'Pike Place® Roast and the featured roast'],
  })
  const gr = grinder(s, c, g, barMid + 0.02, Y + barTop, 4.82, -PI / 2)
  info(s, gr, {
    title: 'Bean Grinder', kind: 'Retail coffee grinder',
    body: 'Grinds whole beans to order for the batch brewer and for customers taking a bag home, from coarse for a French press to fine for espresso. Tap its key to grind.',
    specs: ['98 mm flat burrs', '1.5 kg hopper', 'Grind dial from espresso to cold brew'],
  })
  const tap = coldBrewTap(s, c, g, barMid + 0.05, Y + barTop, 5.32, -PI / 2)
  info(s, tap, {
    title: 'Cold Brew Tap', kind: 'Nitro cold brew dispenser',
    body: 'Cold brew steeped for 20 hours, served from a keg below the counter: one tap plain, one infused with nitrogen for a cascading, creamy head. Tap the right handle to pour a nitro.',
    specs: ['Two taps: cold brew and nitro', 'Kegs held at 3 °C', 'Stainless drip tray'],
  })
  {
    // The hand sink: a steel basin set in the top, a gooseneck tap, soap.
    const z = 5.95
    k.box(g, 0.34, 0.006, 0.34, c.brushed, barMid, Y + barTop + 0.001, z, false)
    k.box(g, 0.28, 0.004, 0.28, c.blackMatte, barMid, Y + barTop + 0.004, z, false)
    k.cyl(g, 0.02, 0.022, 0.08, c.polished, barMid + 0.2, Y + barTop + 0.04, z, 16)
    tube(g, [barMid + 0.2, Y + barTop + 0.08, z], [barMid + 0.2, Y + barTop + 0.3, z], 0.01, c.polished)
    const neck = mesh(g, new CylinderGeometry(0.01, 0.01, 0.16, 10), c.polished, barMid + 0.12, Y + barTop + 0.31, z, false)
    neck.rotation.z = PI / 2
    k.cyl(g, 0.008, 0.008, 0.04, c.polished, barMid + 0.04, Y + barTop + 0.29, z, 10)
    k.soft(g, 0.06, 0.15, 0.06, 0.01, c.wrap, barMid + 0.2, Y + barTop + 0.075, z + 0.15)
    k.cyl(g, 0.01, 0.01, 0.04, c.blackMatte, barMid + 0.2, Y + barTop + 0.17, z + 0.15, 8)
  }
  {
    // The syrup rack: two steps of bottles with their pumps.
    const r = at(g, barMid, Y + barTop, 7.0, -PI / 2)
    k.box(r, 1.0, 0.012, 0.3, c.brushed, 0, 0.006, 0)
    k.box(r, 1.0, 0.1, 0.14, c.brushed, 0, 0.05, -0.08)
    for (let i = 0; i < 6; i++) syrupBottle(s, c, r, -0.4 + i * 0.16, 0.012, 0.07, i)
    for (let i = 0; i < 6; i++) syrupBottle(s, c, r, -0.4 + i * 0.16, 0.1, -0.08, i + 3)
    info(s, r, {
      title: 'Syrups & Sauces', kind: 'Flavour station',
      body: 'Pump bottles of the flavours the baristas add by the pump: vanilla, caramel, hazelnut, classic, toffee nut, raspberry, brown sugar and the autumn pumpkin spice sauce. A tall gets two pumps, a grande three, a venti four.',
      specs: ['12 pump bottles in two steps', 'Measured pumps for consistent drinks'],
    })
  }
  const frappe = c.std({ color: '#7a4f33', roughness: 0.6 }, 0.1)
  const caramel = c.std({ color: '#c8975a', roughness: 0.6 }, 0.1)
  for (const [i, z] of [7.95, 8.6].entries()) {
    const b = blender(s, c, g, `b${i}`, barMid, Y + barTop, z, -PI / 2, i ? caramel : frappe)
    info(s, b, {
      title: `Blender ${i + 1}`, kind: 'High-speed blender in a sound enclosure',
      body: `Blends the Frappuccino® drinks, ${i ? 'a caramel' : 'a java chip'} in the jar now. The clear hood closes over it to quieten the motor: tap the hood to lift it, the key on the base to blend.`,
      specs: ['3 hp motor, programmed blend cycles', 'Sound enclosure hinged at the back', 'Two-litre jar'],
    })
  }
  // Mugs and the for-here ware on two oak shelves over the back bar.
  for (const [i, h] of [1.48, 1.84].entries()) {
    wallShelf(s, c, g, BACK - 0.01, Y + h, (Z0 + 0.35 + CZ1 - 0.2) / 2, -PI / 2, CZ1 - 0.2 - Z0 - 0.35, 0.26)
    const n = 22
    for (let j = 0; j < n; j++) {
      const z = Z0 + 0.5 + j * ((CZ1 - Z0 - 0.9) / (n - 1))
      if (i === 0) {
        if (j % 5 === 2) lathe(g, [[0.001, 0], [0.05, 0], [0.05, 0.16], [0.052, 0.17], [0.001, 0.17]], c.clearPlastic, BACK - 0.13, Y + h, z, 20, false)
        else mug(s, c, g, BACK - 0.13, Y + h, z, -PI / 2, c.ceramic, c.siren, j % 3 ? 1 : 1.15)
      } else {
        // Stacks of saucers and for-here cups.
        if (j % 2) for (let q = 0; q < 4; q++) k.cyl(g, 0.07, 0.065, 0.012, c.ceramic, BACK - 0.13, Y + h + 0.006 + q * 0.013, z, 24)
        else lathe(g, [[0.001, 0], [0.03, 0], [0.045, 0.08], [0.047, 0.085], [0.043, 0.085], [0.028, 0.006], [0.001, 0.006]], c.ceramic, BACK - 0.13, Y + h, z, 24)
      }
    }
  }
  // The round lit siren on the side wall behind the counter.
  sirenDisc(s, c, g, 15.55, Y + 2.62, Z0 + 0.045, 0, 0.42, litSiren, false)

  /* ---------- the menu boards ---------- */
  const bw = 0.66
  const bh = 0.86
  MENU.forEach((mb, i) => {
    const z = Z0 + 0.73 + i * 0.72
    const t = c.canvas(512, 668, menuBoard(mb))
    const mat = lit(new MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: mb.kind === 'image' ? 0.5 : 0.42, roughness: 0.5 }))
    mat.userData.interior = true
    const b = at(g, BACK - 0.02, Y + 2.6, z, -PI / 2)
    k.box(b, bw + 0.03, bh + 0.03, 0.04, c.blackMatte, 0, 0, -0.02)
    const face = decal(b, mat, bw, bh, 0, 0, 0.0012)
    void face
    info(s, b, {
      title: mb.title, kind: 'Menu board',
      body: mb.kind === 'list' ? mb.lines.map((l) => l.replace('|', ': ₹ ')).join(' · ') : `${mb.lines.join('. ')}.`,
      specs: mb.kind === 'list' ? ['Prices in ₹ for tall · grande · venti, inclusive of taxes'] : ['Backlit photographic board'],
    })
  })

  /* ---------- the side wall: merchandise shelving, the mural ---------- */
  {
    const sh = shelving(s, c, g, 12.2, Z0 + 0.02, 0, 1.5, 0.3, [0.85, 1.25, 1.65, 2.05, 2.45])
    const row = (name: string, fill: (p: Object3D) => void, card: { title: string; kind: string; body: string; specs: string[] }) => {
      const grp = at(sh.g, 0, 0, 0)
      grp.name = `sbux_${name}`
      fill(grp)
      info(s, grp, card)
    }
    const ceramics: Material[] = [c.ceramic, c.ceramicBlack, c.ceramicRust, c.ceramicSage]
    row('mugs', (p) => {
      for (let i = 0; i < 9; i++) mug(s, c, p, -0.62 + i * 0.155, sh.top(0), 0.15, (i % 2 ? 0.3 : -0.3), ceramics[i % 4], c.siren)
    }, { title: 'Siren Mugs', kind: 'Merchandise · Ceramic', body: 'Ceramic mugs with the siren, in white, black, autumn rust and sage, 355 ml. ₹ 1,150 each.', specs: ['355 ml (12 fl oz)', 'Dishwasher and microwave safe'] })
    row('tumblers', (p) => {
      const bodies = [c.brushed, c.greenBody, c.blackGloss, c.ceramicRust]
      for (let i = 0; i < 8; i++) tumbler(s, c, p, -0.6 + i * 0.17, sh.top(1), 0.15, 0, bodies[i % 4], c.siren)
    }, { title: 'Insulated Tumblers', kind: 'Merchandise · Stainless steel', body: 'Double-walled stainless tumblers with a press lid: hot for six hours, cold for twelve. Bring one back and save ₹ 20 on your drink. ₹ 2,250.', specs: ['473 ml (16 fl oz)', 'Vacuum insulated', 'Leak-resistant lid'] })
    row('beans', (p) => {
      for (let i = 0; i < 8; i++) beanBag(s, c, p, -0.63 + i * 0.18, sh.top(2), 0.14, 0, i % 4)
    }, { title: 'Whole Bean Coffee', kind: 'Merchandise · Coffee', body: 'Whole beans to brew at home: Veranda Blend® (blonde), Pike Place® Roast (medium), the seasonal Fall Blend (medium) and Espresso Roast (dark). Ground free to your brewer. ₹ 950 for 250 g.', specs: ['250 g bags', 'Ground to order at the counter', '100% arabica, ethically sourced'] })
    row('coldcups', (p) => {
      const tints = ['#f2b38a', '#9fd3b6', '#e6e6e6', '#f4c2c2'].map((col) => c.std({ color: col, transparent: true, opacity: 0.55, roughness: 0.1 }, 0.8))
      for (let i = 0; i < 7; i++) reusableCup(s, c, p, -0.6 + i * 0.2, sh.top(3), 0.15, tints[i % 4])
    }, { title: 'Reusable Cold Cups', kind: 'Merchandise · Plastic', body: 'Reusable cold cups with a domed lid and a straw, in the autumn colours, 710 ml. ₹ 1,350.', specs: ['710 ml (24 fl oz)', 'BPA-free', 'Reusable straw'] })
    // A basket of mums and two pumpkins on top.
    flowerPot(s, c, sh.g, -0.4, sh.top(4), 0.15, 0.1, 'basket', 5)
    pumpkin(s, c, sh.g, 0.3, sh.top(4), 0.15, 0.07)
  }
  {
    // The mural: framed in black over the long table.
    const x0 = 12.98
    const x1 = 14.32
    const mg = at(g, (x0 + x1) / 2, Y + 2.15, Z0 + 0.02, 0)
    k.box(mg, x1 - x0 + 0.05, 2.0 + 0.05, 0.03, c.blackMatte, 0, 0, 0.015)
    decal(mg, c.mural, x1 - x0, 2.0, 0, 0, 0.031)
    info(s, mg, {
      title: 'Autumn Mural', kind: 'Artwork',
      body: 'A painted mural for the season: a cup of coffee with its steam rising into falling maple leaves, in rust, amber and deep brown. Each Starbucks commissions its art locally; this one changes with the seasons.',
      specs: ['1.35 × 2.0 m, acrylic on board', 'Lit by the track spots'],
    })
  }
  // The great siren hung in the leaves over the entrance, both faces lit.
  {
    const sx = 11.95
    const sy = Y + 3.15
    const sz = 5.9
    const sd = sirenDisc(s, c, g, sx, sy, sz, -PI / 2, 0.48, litSiren, true)
    for (const dz of [-0.3, 0.3]) k.box(g, 0.006, Y + BATTEN - sy - 0.48, 0.006, c.blackMatte, sx, sy + 0.48 + (Y + BATTEN - sy - 0.48) / 2, sz + dz, false)
    info(s, sd, {
      title: 'The Siren', kind: 'Brand sign',
      body: 'The Starbucks siren, a twin-tailed mermaid from a 16th-century Norse woodcut, crowned with a star: the café\'s emblem since 1971, in its green circle since 2011. Hung here in the autumn canopy, lit on both faces.',
      specs: ['960 mm across, backlit acrylic', 'On the menu boards and displays switch'],
    })
  }

  /* ---------- the condiment station on the party wall ---------- */
  {
    const cs = at(g, FX + 0.4, Y, 9.3, PI / 2)
    const len = 1.1
    const d = 0.55
    k.box(cs, len, 0.1, d - 0.08, c.blackMatte, 0, 0.05, -0.04)
    k.box(cs, len, 0.8, 0.02, c.cupPaper, 0, 0.5, -d / 2 + 0.01)
    k.box(cs, len, 0.02, d - 0.04, c.cupPaper, 0, 0.11, -0.01)
    for (const sx of [-1, 1]) k.box(cs, 0.02, 0.8, d - 0.02, c.blackMatte, sx * (len / 2 - 0.01), 0.5, -0.01)
    k.soft(cs, len + 0.03, 0.04, d + 0.02, 0.004, c.oak, 0, 0.92, 0)
    for (const side of [-1, 1]) {
      const dd = new Group()
      dd.name = `door_sbux_condiment_${side > 0 ? 'r' : 'l'}`
      dd.userData.label = 'Cupboard door'
      dd.userData.openAngle = side * 1.7
      dd.position.set(side * (len / 2 - 0.004), 0.1, d / 2 - 0.01)
      cs.add(dd)
      const w = len / 2 - 0.01
      mbox(dd, w, 0.79, 0.02, c.walnutBoards, -side * w / 2, 0.4, 0).userData.front = true
      k.box(dd, 0.012, 0.14, 0.02, c.blackMatte, -side * (w - 0.05), 0.62, 0.015)
    }
    // Inside: a bin, spare napkins.
    k.box(cs, 0.36, 0.6, 0.36, c.blackGloss, -0.25, 0.4, -0.04)
    k.box(cs, 0.3, 0.2, 0.25, c.wrap, 0.25, 0.22, -0.04)
    // On top: thermos carafes of milk, sugars, napkins, stirrers, the shakers, the waste slot.
    for (const [i, lbl] of [[0, c.milk], [1, c.wheat]] as const) {
      lathe(cs, [[0.001, 0], [0.07, 0], [0.072, 0.02], [0.065, 0.22], [0.05, 0.26], [0.001, 0.26]], c.brushed, -0.42 + i * 0.17, 0.94, -0.05, 24)
      k.cyl(cs, 0.04, 0.05, 0.05, c.blackMatte, -0.42 + i * 0.17, 0.94 + 0.285, -0.05, 20)
      k.box(cs, 0.06, 0.04, 0.003, lbl, -0.42 + i * 0.17, 0.94 + 0.15, 0.021, false)
    }
    k.soft(cs, 0.2, 0.09, 0.12, 0.01, c.blackMatte, -0.05, 0.985, -0.06)
    for (let i = 0; i < 4; i++) k.box(cs, 0.04, 0.06, 0.09, [c.cupPaper, c.wheat, c.pumpkinPale, c.sleeve][i], -0.12 + i * 0.045, 1.03, -0.06, false)
    k.soft(cs, 0.14, 0.16, 0.12, 0.01, c.blackMatte, 0.17, 1.02, -0.07)
    k.box(cs, 0.11, 0.04, 0.005, c.cupPaper, 0.17, 1.06, -0.008, false)
    k.cyl(cs, 0.035, 0.03, 0.12, c.ceramic, 0.36, 1.0, -0.08, 16)
    for (let i = 0; i < 9; i++) k.box(cs, 0.004, 0.18, 0.002, c.oak, 0.34 + (i % 3) * 0.015, 1.07, -0.09 + Math.floor(i / 3) * 0.015, false)
    for (const [i, top] of [[0, c.cupPaper], [1, c.sleeve]] as const) {
      lathe(cs, [[0.001, 0], [0.025, 0], [0.025, 0.1], [0.022, 0.11], [0.001, 0.11]], c.clearPlastic, 0.12 + i * 0.07, 0.94, 0.12, 16, false)
      k.cyl(cs, 0.02, 0.02, 0.08, top, 0.12 + i * 0.07, 0.94 + 0.045, 0.12, 12)
      k.cyl(cs, 0.026, 0.026, 0.02, c.brushed, 0.12 + i * 0.07, 0.94 + 0.115, 0.12, 16)
    }
    k.box(cs, 0.18, 0.004, 0.1, c.rubber, 0.38, 0.942, 0.12, false)
    info(s, cs, {
      title: 'Condiment Bar', kind: 'Self-service station',
      body: 'Help yourself: whole and oat milk in thermos carafes, white and raw sugar, sweetener, honey, cinnamon and nutmeg to shake, wooden stirrers and napkins, with the waste slot in the top and the bin in the cupboard below (its doors open).',
      specs: ['Oak top on a walnut-faced cupboard', 'Milk kept cold in insulated carafes'],
    })
    s.e.shade.rect(FX + 0.4, Y + 0.012, 9.3, 0.55, len, PI / 2, 0.35)
  }

  /* ---------- the tables and stools ---------- */
  const stoolCard = { title: 'High Stool', kind: 'Seating', body: 'A bar-height stool: a round seat of solid white oak, dished and eased at its edge, on four splayed black-steel legs with a footring.', specs: ['Seat 750 mm high, 350 mm across', 'Solid oak, matt lacquer; powder-coated steel'] }
  const seat = (x: number, z: number) => info(s, stool(s, c, g, x, z), stoolCard)
  // The long table along the side wall, three stools on the room side.
  info(s, highTable(s, c, g, 12.5, 4.55, PI / 2, 1.6, 0.6), { title: 'Communal High Table', kind: 'Table · seats 3', body: 'A long bar-height table of solid oak, 40 mm thick, on black-steel T-frames with a foot rail, along the merchandise wall.', specs: ['1600 × 600 mm, 1050 mm high', 'Solid white oak; powder-coated steel'] })
  tableDressing(s, c, g, 12.2, Y + 1.05, 4.5, 11)
  for (const x of [12.0, 12.5, 13.0]) seat(x, 5.22)
  // The round table in the middle.
  info(s, roundHighTable(s, c, g, 12.9, 8.3, 0.34), { title: 'Round High Table', kind: 'Table · seats 3', body: 'A round bar-height table: an oak disc on a black-steel column and cross base with a footring.', specs: ['680 mm across, 1050 mm high', 'Solid white oak; powder-coated steel'] })
  tableDressing(s, c, g, 12.9, Y + 1.05, 8.3, 12)
  seat(12.38, 8.3)
  seat(13.16, 8.75)
  seat(13.16, 7.85)
  // The window table along the forecourt glass.
  info(s, highTable(s, c, g, 12.5, 11.72, PI / 2, 1.5, 0.55), { title: 'Window High Table', kind: 'Table · seats 3', body: 'An oak high table along the forecourt glass, for a coffee looking out over the drop-off and the trees.', specs: ['1500 × 550 mm, 1050 mm high', 'Solid white oak; powder-coated steel'] })
  tableDressing(s, c, g, 12.5, Y + 1.05, 11.75, 13)
  for (const x of [12.0, 12.5, 13.0]) seat(x, 10.98)
  // A table for two in the curve of the glass.
  {
    const rx = 14.6
    const rz = 10.9
    const t: [number, number] = [0.89, -0.46]
    info(s, highTable(s, c, g, rx, rz, Math.atan2(t[0], t[1]), 0.7, 0.6), { title: 'High Table for Two', kind: 'Table · seats 2', body: 'A small oak high table in the curve of the glass, the best seat for watching the forecourt.', specs: ['700 × 600 mm, 1050 mm high', 'Solid white oak; powder-coated steel'] })
    tableDressing(s, c, g, rx, Y + 1.05, rz, 14)
    seat(rx + t[0] * 0.52, rz + t[1] * 0.52)
    seat(rx - t[0] * 0.52, rz - t[1] * 0.52)
  }

  /* ---------- the shelving at the counter's end, facing the window seats ---------- */
  {
    const len = 1.45
    const sh = shelving(s, c, g, (C1 + 16.75) / 2, CZ1 + 0.1, 0, len, 0.28, [0.85, 1.3, 1.75, 2.2], 0.45)
    const fall = at(sh.g, 0, 0, 0)
    for (let i = 0; i < 7; i++) beanBag(s, c, fall, -0.56 + i * 0.185, sh.top(0), 0.13, 0, 3)
    info(s, fall, { title: 'Fall Blend', kind: 'Merchandise · Coffee', body: 'The season\'s blend: Latin American and Asia-Pacific beans with notes of baking spice and dark chocolate. Medium roast, whole bean. ₹ 1,050 for 250 g.', specs: ['250 g bag', 'Medium roast'] })
    const cups = at(sh.g, 0, 0, 0)
    for (let i = 0; i < 6; i++) tumbler(s, c, cups, -0.55 + i * 0.22, sh.top(1), 0.13, 0, i % 2 ? c.ceramicRust : c.greenBody, c.siren)
    info(s, cups, { title: 'Autumn Tumblers', kind: 'Merchandise · Stainless steel', body: 'Insulated tumblers in this season\'s colours, rust and siren green. ₹ 2,250.', specs: ['473 ml', 'Vacuum insulated'] })
    const mugs = at(sh.g, 0, 0, 0)
    for (let i = 0; i < 7; i++) mug(s, c, mugs, -0.56 + i * 0.185, sh.top(2), 0.13, 0.4, i % 2 ? c.ceramicRust : c.ceramic, c.siren)
    info(s, mugs, { title: 'Autumn Mugs', kind: 'Merchandise · Ceramic', body: 'Mugs glazed in autumn rust and cream with the siren, 355 ml. ₹ 1,150.', specs: ['355 ml', 'Dishwasher safe'] })
    pumpkin(s, c, sh.g, -0.3, sh.top(3), 0.13, 0.08)
    pumpkin(s, c, sh.g, 0.15, sh.top(3), 0.13, 0.055, true)
    flowerPot(s, c, sh.g, 0.5, sh.top(3), 0.13, 0.08, 'pot', 7)
  }

  /* ---------- the autumn dressing ---------- */
  // Baskets and pots of chrysanthemums and pumpkins on the floor, by the door and in the curve.
  flowerPot(s, c, g, 11.62, Y, 4.0, 0.17, 'basket', 21)
  pumpkin(s, c, g, 11.6, Y, 4.4, 0.11)
  flowerPot(s, c, g, 13.62, Y, 11.92, 0.15, 'pot', 22)
  pumpkin(s, c, g, 13.95, Y, 11.85, 0.1, true)
  flowerPot(s, c, g, 16.28, Y, 10.2, 0.16, 'basket', 23)
  pumpkin(s, c, g, 15.98, Y, 10.6, 0.12)
  flowerPot(s, c, g, 11.6, Y, 11.85, 0.14, 'pot', 24)
  // The canopy of leaves over the entrance and along the glass, the siren clear in it.
  leafCanopy(c, g, [FX + 0.05, 16.9, Z0 + 0.05, 12.1], Y + BATTEN + 0.02, 1500,
    (x, z) => within(x, z) && (x < 13.1 || (toGlass(x, z) < 0.75 && x < 16.4 && z > 9.6)) && !(x < 12.6 && Math.abs(z - 5.9) < 0.62),
    (x, z) => (x < 12.5 ? 1.05 : 0.7) * (toGlass(x, z) < 0.75 ? 1.0 : 0.9) * (Math.abs(z - 5.9) < 0.9 && x < 12.8 ? 0.55 : 1),
    31)
  fallenLeaves(c, g, [FX + 0.1, 16.8, Z0 + 0.1, 12.1], Y + 0.009, 70,
    (x, z) => within(x, z) && x < C0 - 0.15 && (x < 12.8 || toGlass(x, z) < 1.2 || (z > 9.4 && x < 16.5)) && !(z > 4.2 && z < 4.9 && x > 11.7),
    41)

  /* ---------- lighting and its switches ---------- */
  lamp(s, 12.5, Y + 3.5, 6.6, 9, 9)
  lamp(s, 15.5, Y + 3.4, 6.6, 8, 8)
  lamp(s, 14.0, Y + 3.4, 10.4, 8, 8)
  {
    const sw = new Group()
    sw.position.set(FX + 0.096, Y + 1.2, 8.55)
    sw.rotation.y = PI / 2
    g.add(sw)
    const plate = switchPlate(k, sw, 'sbux', ['switch', 'switch'], { plate: lux.blackSteel, rocker: lux.blackSteel, dark: c.blackMatte, locator: lux.ledCool as MeshStandardMaterial }, [s.circuit, display])
    plate.traverse((o) => {
      if (o.name === 'switch_sbux_0') o.userData.label = 'Café lights'
      if (o.name === 'switch_sbux_1') o.userData.label = 'Menu boards & displays'
    })
    setCircuit(s.circuit, true)
    setCircuit(display, true)
  }
  return s
}
