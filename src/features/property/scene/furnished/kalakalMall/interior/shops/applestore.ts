import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, type Material, type Object3D } from 'three'
import { circuit, setCircuit, switchPlate } from '../../../kalakalD65/fixtures'
import { clipped, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { adapter, airpodsMax, airpodsPro, airtag, appleMaterials, face, homepodMini, imac, ipad, iphone, macbook, magsafe, phoneCase, productBox, slab, watch } from './apple'
import { button, info, play, tube } from './cafe'
import { at, box, flat, lamp, mesh, openShop, pane, PI, swingLeaf } from './kit'

/*
 * The Apple store, unit G-08: on the front gallery beside the main entrance, its back the
 * forecourt façade. Built from the reference, looking in from the door:
 *
 *   back      a white wall lining the façade's straight run, the large screen on it showing
 *             "iPhone 16 · Built for Apple Intelligence", the long white service counter before
 *             it with the staff's MacBooks and an iMac for check-in; the curved glass corner by
 *             the entrance left clear
 *   left      a white two-tier table: MacBook Airs on its lower surface, AirPods Max, HomePod
 *             minis and AirPods Pro on its raised back
 *   middle    two white drums: Apple Watches on their pillows with an iPad Pro and an iPhone;
 *             iPhone 16 and 16 Pro on their stands round AirPods Max and the boxes
 *   right     the accessory wall: white shelves on a pale grey back, cases, chargers, cables,
 *             AirTags and Pencils in their boxes, cupboards under
 *   above     a white ceiling with long recessed light lines, square air grilles, downlights;
 *             below, dark grey porcelain in 600 × 1200 mm tiles, a shadow-gap skirting
 *
 * Interactive: the doors, the MacBook lids, the AirPods case lids, the cupboards and the counter's
 * drawers open; iPhone and iPad screens wake and step through their screens at a tap; each
 * Watch tries its next band; the HomePod minis play; the wall screen moves to its next film; two
 * switches by the door work the store's lights and the screen. Every device, table, stand and
 * shelf of accessories explains itself when tapped.
 */

const X0 = 4.675
const X1 = 11.225
const FZ = 8.3
const BZ = 11.95
const H = 3.7
const HIT = new MeshBasicMaterial({ visible: false })

type Card = { title: string; kind: string; body: string; specs: string[] }

export function buildAppleStore(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux, m: mm } = e
  const { g, y: Y } = s
  const a = appleMaterials(e)
  const soffit = e.soffit
  const outline = clipped(e, u.rects[0])
  const screenCircuit = circuit()

  /* ---------- floor, walls, ceiling ---------- */
  flat(g, outline, Y + 0.006, a.floor, false, [], 'apple_floor')
  k.box(g, 0.02, H, BZ - FZ, a.wall, X0 + 0.01, Y + H / 2, (FZ + BZ) / 2 - 0.25, false)
  k.box(g, 0.02, H, BZ - FZ, a.wall, X1 - 0.01, Y + H / 2, (FZ + BZ) / 2, false)
  // The wall lining the façade's straight run, from the curve to the party wall.
  box(s, 5.75, X1, Y, Y + H, BZ, BZ + 0.15, a.wall)
  // Shadow-gap skirtings.
  for (const [x0, x1, z0, z1] of [[5.75, X1, BZ - 0.012, BZ], [X0, X0 + 0.022, FZ, 11.2], [X1 - 0.022, X1, FZ, BZ]] as const) box(s, x0, x1, Y, Y + 0.06, z0, z1, a.shadowGap, false)
  e.shade.foot(5.75, BZ - 0.02, X1, BZ - 0.02, Y + 0.01, 0.18, 0.2)
  flat(g, outline, Y + H, a.ceiling, true, [], 'apple_ceiling')
  // Long recessed light lines front to back, one along the back wall; square grilles; downlights; a camera dome.
  const led = lux.led as MeshStandardMaterial
  const ledOn = led.clone()
  ledOn.userData.interior = true
  s.circuit.glows.push(ledOn)
  for (const x of [5.95, 7.95, 9.95]) {
    k.box(g, 0.06, 0.02, BZ - FZ - 0.3, a.shadowGap, x, Y + H + 0.01, (FZ + BZ) / 2, false)
    k.box(g, 0.05, 0.004, BZ - FZ - 0.32, ledOn, x, Y + H - 0.002, (FZ + BZ) / 2, false)
  }
  k.box(g, X1 - 5.95, 0.004, 0.05, ledOn, (5.95 + X1) / 2, Y + H - 0.002, BZ - 0.12, false)
  for (const [x, z] of [[6.95, 9.7], [9.0, 10.75]] as const) {
    k.box(g, 0.6, 0.012, 0.6, a.whiteMatte, x, Y + H - 0.006, z, false)
    for (let i = 0; i < 8; i++) k.box(g, 0.5, 0.004, 0.022, a.shadowGap, x, Y + H - 0.013, z - 0.21 + i * 0.06, false)
  }
  for (const [x, z] of [[6.95, 8.75], [9.0, 8.75], [10.6, 11.2], [5.4, 10.6]] as const) {
    k.cyl(g, 0.045, 0.045, 0.006, a.whiteMatte, x, Y + H - 0.003, z, 24)
    k.cyl(g, 0.032, 0.032, 0.004, ledOn, x, Y + H - 0.006, z, 20)
  }
  const dome = mesh(g, new CylinderGeometry(0.05, 0.06, 0.03, 24), a.whiteMatte, 10.65, Y + H - 0.015, 8.75)
  void dome
  k.sphere(g, 0.035, a.glassBlack, 10.65, Y + H - 0.035, 8.75)

  /* ---------- the front on z = 8.3: a pale fascia with the lit logo, frameless glass, glass doors ---------- */
  box(s, 4.6, 11.3, Y + 4.2, soffit, FZ - 0.075, FZ + 0.075, mm.wallPaint)
  {
    const f0 = FZ - 0.24
    k.box(g, 11.3 - 4.6 + 0.1, 0.9, FZ - f0, a.aluminium, 7.95, Y + 3.75, (f0 + FZ) / 2)
    k.box(g, 11.3 - 4.6 + 0.12, 0.012, 0.012, a.shadowGap, 7.95, Y + 3.3, f0 - 0.004, false)
    const logo = mesh(g, face(0.36, 0.48, 0.0001), a.logo('#ffffff', 0.9), 7.95, Y + 3.75, f0 - 0.004, false)
    logo.rotation.y = PI
  }
  for (const xx of [4.62, 6.83, 9.07, 11.28]) box(s, xx - 0.02, xx + 0.02, Y, Y + 3.3, FZ - 0.025, FZ + 0.025, a.aluminium)
  box(s, 4.6, 11.3, Y + 3.27, Y + 3.32, FZ - 0.03, FZ + 0.03, a.aluminium)
  box(s, 4.6, 6.85, Y, Y + 0.04, FZ - 0.025, FZ + 0.025, a.aluminium)
  box(s, 9.05, 11.3, Y, Y + 0.04, FZ - 0.025, FZ + 0.025, a.aluminium)
  pane(s, g, 4.64, FZ, 6.81, FZ, Y + 0.04, Y + 3.27)
  pane(s, g, 9.09, FZ, 11.26, FZ, Y + 0.04, Y + 3.27)
  pane(s, g, 6.85, FZ, 9.05, FZ, Y + 2.75, Y + 3.27)
  box(s, 6.85, 9.05, Y + 2.72, Y + 2.76, FZ - 0.03, FZ + 0.03, a.aluminium)
  // The doors, hung just inside the line of the glass, stand folded right back against it while the store trades.
  swingLeaf(s, at(g, 6.85, Y, FZ + 0.06, 0), 'apple_l', 1.095, 2.7, a.aluminium, -(PI - 0.05), true)
  swingLeaf(s, at(g, 9.05, Y, FZ + 0.06, PI), 'apple_r', 1.095, 2.7, a.aluminium, PI - 0.05, true)
  box(s, 6.85, 9.05, Y, Y + 0.005, FZ - 0.1, FZ + 0.1, a.steel, false)

  /* ---------- the wall screen ---------- */
  {
    const sw = 2.7
    const sh = 1.0
    const sg = at(g, 8.45, Y + 2.25, BZ, PI)
    k.box(sg, sw + 0.03, sh + 0.03, 0.06, a.glassBlack, 0, 0, 0.03)
    const films = [a.film(0), a.film(1), a.film(2)] as MeshStandardMaterial[]
    for (const f of films) screenCircuit.glows.push(f)
    let film = 0
    const b = button(sg, 'screen', 'Store display', 'Next film', 0, 0, 0.061, () => {
      film = (film + 1) % films.length
      scr.material = films[film]
    }, 'apple')
    const scr = mesh(b, face(sw, sh, 0.004), films[0], 0, 0, 0, false)
    scr.userData.front = true
  }

  /* ---------- the service counter ---------- */
  const product = <T extends Object3D>(o: T, card: Card, pad = 0.004) => {
    info(s, o, card, pad)
    return o
  }
  {
    const cx0 = 7.1
    const cx1 = 9.8
    const cz0 = 10.75
    const cz1 = 11.4
    const ch = 1.0
    const c = new Group()
    g.add(c)
    box(s, cx0 + 0.04, cx1 - 0.04, Y, Y + 0.08, cz0 + 0.06, cz1 - 0.02, a.shadowGap)
    const body = new Mesh(slab(cx1 - cx0, ch - 0.1, cz1 - cz0, 0.004, 0.002), a.corian)
    body.position.set((cx0 + cx1) / 2, Y + 0.08 + (ch - 0.1) / 2, (cz0 + cz1) / 2)
    body.scale.z = 1
    // The slab helper makes w × h in x–y and t in z, which is what a counter is.
    c.add(body)
    k.box(c, cx1 - cx0 + 0.03, 0.02, cz1 - cz0 + 0.03, a.corian, (cx0 + cx1) / 2, Y + ch - 0.01, (cz0 + cz1) / 2)
    info(s, c, { title: 'Service Counter', kind: 'Counter', body: 'Where the team check you in for a Genius appointment, set up a new device, collect online orders and take payment. Seamless white solid surface, 2.7 m long, with the staff\'s drawers on the far side.', specs: ['White solid surface, eased edges', 'Shadow-gap plinth', 'Payment by card, UPI or Apple Pay'] }, 0)
    // The staff's drawers on the wall side.
    for (let i = 0; i < 3; i++) {
      const dr = new Group()
      dr.name = `drawer_apple_counter_${i}`
      dr.userData.label = 'Drawer'
      dr.userData.slide = [0, 0, 0.32]
      dr.position.set(cx0 + 0.55 + i * 0.8, Y + 0.78, cz1 + 0.001)
      g.add(dr)
      k.box(dr, 0.7, 0.14, 0.012, a.corian, 0, 0, 0.006).userData.front = true
      k.box(dr, 0.68, 0.11, 0.4, a.whiteMatte, 0, -0.005, -0.2)
      for (let j = 0; j < 4; j++) productBox(a, dr, -0.24 + j * 0.16, -0.06, -0.2, PI / 2, 0.08, 0.04, 0.16, a.box('iPhone 16', 'case', '#4c63d8'))
    }
    // On it: the staff's MacBooks (screens to the staff), an iMac for check-in, a payment terminal.
    const top = Y + ch
    product(macbook(s, a, g, 'staff0', 8.0, top, 11.12, 0, '#2e3138', a.mac(['#3b5ba5', '#152a5c'], 'desktop')), { title: 'MacBook Air 13-inch (staff)', kind: 'Mac · Staff device', body: 'The team\'s MacBook Air in midnight, for appointments and orders. Its lid opens and closes at a tap.', specs: ['M3 chip', '13.6-inch Liquid Retina display'] })
    product(macbook(s, a, g, 'staff1', 9.2, top, 11.12, 0, '#2e3138', a.mac(['#7a4ea3', '#2c1b4f'], 'photos')), { title: 'MacBook Air 13-inch (staff)', kind: 'Mac · Staff device', body: 'The team\'s second MacBook Air, midnight. Tap its lid to close or open it.', specs: ['M3 chip'] })
    const im = imac(a, g, 7.45, top, 10.98, PI + 0.25, '#7da6d6', '#c9dcf1', a.mac(['#6aa0e0', '#22488f'], 'desktop'))
    let imacApp = 0
    const imScreens = [a.mac(['#6aa0e0', '#22488f'], 'desktop'), a.mac(['#e3a35c', '#a04c2a'], 'photos')]
    const ib = button(im.g, 'imac', 'iMac', 'Switch app', 0, 0.14 + 0.09 + 0.012 + 0.297 / 2 + 0.014, 0.0062, () => {
      imacApp = (imacApp + 1) % imScreens.length
      im.screen.material = imScreens[imacApp]
    }, 'apple')
    ib.add(new Mesh(new BoxGeometry(0.52, 0.3, 0.004), HIT))
    product(im.g, { title: 'iMac 24-inch', kind: 'Mac · Desktop', body: 'The iMac with M4 in blue: an 11.5 mm thin all-in-one with a 24-inch 4.5K Retina display, a 12MP Center Stage camera and six speakers. Check in for your appointment on it, or tap the screen to switch apps. From ₹ 1,34,900.', specs: ['M4 chip, 16 GB unified memory', '24-inch 4.5K Retina, 500 nits', 'Seven colours'] })
    const term = at(g, 9.55, top, 10.85, PI)
    k.soft(term, 0.075, 0.018, 0.15, 0.008, a.rubber, 0, 0.03, 0).rotation.x = -0.25
    k.box(term, 0.06, 0.003, 0.07, a.glassBlack, 0, 0.042, -0.03, false).rotation.x = -0.25
  }

  /* ---------- the catalogue ---------- */
  const PHONES: { pro: boolean; colour: string; name: string; tint: [string, string] }[] = [
    { pro: false, colour: '#4c63d8', name: 'iPhone 16 · Ultramarine', tint: ['#5e7cf0', '#1e2f8f'] },
    { pro: false, colour: '#88c1c2', name: 'iPhone 16 · Teal', tint: ['#6fd0c9', '#14596a'] },
    { pro: false, colour: '#f1b9c8', name: 'iPhone 16 · Pink', tint: ['#ffb3c7', '#b04a72'] },
    { pro: false, colour: '#f1f1ee', name: 'iPhone 16 · White', tint: ['#cfd6e4', '#5a6a8a'] },
    { pro: true, colour: '#c6ad94', name: 'iPhone 16 Pro · Desert Titanium', tint: ['#e2b98f', '#6b4528'] },
    { pro: true, colour: '#b8b3aa', name: 'iPhone 16 Pro · Natural Titanium', tint: ['#c9c2b6', '#4a4640'] },
    { pro: true, colour: '#3c3b39', name: 'iPhone 16 Pro · Black Titanium', tint: ['#4c4c52', '#0e0e10'] },
  ]
  const phoneCard = (p: (typeof PHONES)[number]): Card => p.pro
    ? { title: p.name, kind: 'iPhone · 6.3-inch', body: 'iPhone 16 Pro: a grade 5 titanium design, the A18 Pro chip, a 48MP Fusion camera with a 48MP Ultra Wide and a 5x Telephoto, Camera Control, and Apple Intelligence. Tap the screen to wake it and swipe through. From ₹ 1,19,900.', specs: ['6.3-inch Super Retina XDR with ProMotion, Always-On', 'A18 Pro chip', '48MP Fusion · 48MP Ultra Wide · 12MP 5x Telephoto', '149.6 × 71.5 × 8.25 mm, 199 g'] }
    : { title: p.name, kind: 'iPhone · 6.1-inch', body: 'iPhone 16: colour-infused glass and aluminium, the A18 chip, a 48MP Fusion camera and a 12MP Ultra Wide, the Action button and Camera Control, built for Apple Intelligence. Tap the screen to wake it and swipe through. From ₹ 79,900.', specs: ['6.1-inch Super Retina XDR display', 'A18 chip', '48MP Fusion · 12MP Ultra Wide', '147.6 × 71.6 × 7.8 mm, 170 g'] }
  /** An iPhone on its display stand (a tilted white cradle, the security cable into the table); its screen steps lock → home → Apple Intelligence. */
  const phoneOnStand = (p: (typeof PHONES)[number], x: number, y: number, z: number, yaw: number, name: string) => {
    const st = at(g, x, y, z, yaw)
    k.cyl(st, 0.032, 0.035, 0.008, a.whitePlastic, 0, 0.004, 0, 32)
    const cradle = at(st, 0, 0.008, -0.01, 0)
    cradle.rotation.x = -0.42
    k.box(cradle, 0.05, 0.11, 0.006, a.whitePlastic, 0, 0.055, -0.006)
    const screens = (['lock', 'home', 'ai'] as const).map((kd) => a.ios(kd, p.tint, true, true))
    const ph = iphone(a, cradle, p.pro, p.colour, screens[0])
    ph.g.position.set(0, (p.pro ? 0.1496 : 0.1476) / 2 + 0.004, 0.0)
    tube(st, [0, 0.01, 0.012], [0, 0.0005, 0.07], 0.0012, a.cable, 6)
    let i = 0
    const b = button(ph.g, `phone_${name}`, p.name.split(' · ')[0], 'Tap the screen', 0, 0, 0.0045, () => {
      i = (i + 1) % screens.length
      ph.screen.material = screens[i]
      play({ dur: 0.25, step: (t) => ph.g.position.setZ(Math.sin(t * PI) * 0.002) }, b)
    }, 'apple')
    b.add(new Mesh(new BoxGeometry(0.068, 0.142, 0.002), HIT))
    product(st, phoneCard(p))
    return st
  }

  /* ---------- the two-tier table (the reference's left) ---------- */
  {
    const tx0 = 10.05
    const tx1 = 10.85
    const tz0 = 8.85
    const tz1 = 10.45
    const th = 0.9
    const t = new Group()
    g.add(t)
    box(s, tx0 + 0.05, tx1 - 0.05, Y, Y + 0.06, tz0 + 0.05, tz1 - 0.05, a.shadowGap)
    const bodyM = new Mesh(slab(tx1 - tx0, th - 0.06, tz1 - tz0, 0.004, 0.002), a.corian)
    bodyM.position.set((tx0 + tx1) / 2, Y + 0.06 + (th - 0.06) / 2, (tz0 + tz1) / 2)
    t.add(bodyM)
    // The raised back along the wall side.
    const riser = new Mesh(slab(0.3, 0.12, tz1 - tz0, 0.003, 0.002), a.corian)
    riser.position.set(tx1 - 0.15, Y + th + 0.06, (tz0 + tz1) / 2)
    t.add(riser)
    e.shade.rect((tx0 + tx1) / 2, Y + 0.012, (tz0 + tz1) / 2, tx1 - tx0, tz1 - tz0, 0, 0.3)
    info(s, t, { title: 'Mac and Audio Table', kind: 'Display table', body: 'A white two-tier table: MacBook Air on the lower surface to try, the audio range on the raised back (AirPods Max, HomePod mini, AirPods Pro). Every display device is live and charging through the table.', specs: ['White solid surface, 1600 × 800 mm', 'Integrated power and security'] }, 0)
    const lo = Y + th
    const hi = Y + th + 0.12
    const MACS: [string, string, [string, string]][] = [['Sky Blue', '#a9bccc', ['#7fb0e8', '#264a8f']], ['Starlight', '#e3d9c6', ['#f0c48a', '#9a5a2f']]]
    MACS.forEach(([nm, col, tint], i) =>
      product(macbook(s, a, g, `table${i}`, 10.32, lo, 9.25 + i * 0.75, -PI / 2, col, a.mac(tint, i ? 'photos' : 'desktop')), {
        title: `MacBook Air 13-inch · ${nm}`, kind: 'Mac · Laptop', body: `MacBook Air with M3 in ${nm.toLowerCase()}: 11.3 mm thin, 1.24 kg, up to 18 hours of battery, a 13.6-inch Liquid Retina display and a fanless design, silent at any load. Tap the lid to close it, again to open it. From ₹ 1,14,900.`, specs: ['M3 chip, 8-core CPU, 10-core GPU', '13.6-inch Liquid Retina, 500 nits', 'MagSafe 3, two Thunderbolt / USB 4 ports', '30.41 × 21.5 × 1.13 cm'],
      }))
    product(airpodsMax(a, g, 10.7, hi, 9.05, -PI / 2, '#a9bccc', '#c9d3dc'), { title: 'AirPods Max · Blue', kind: 'Audio · Over-ear headphones', body: 'AirPods Max: a knit-mesh canopy, stainless steel headband, anodised aluminium ear cups with memory-foam cushions, Active Noise Cancellation and Personalised Spatial Audio, charging over USB-C. ₹ 59,900.', specs: ['Up to 20 hours of listening', 'Digital Crown for volume and control', 'Five colours'] })
    for (const [i, col] of [['#f1f1ee', 0], ['#e9a9b8', 1]].map(([c2, n]) => [n as number, c2 as string] as const)) {
      const hp = homepodMini(s, a, g, `mini${i}`, 10.7, hi, 9.65 + i * 0.22, col)
      product(hp, { title: `HomePod mini · ${i ? 'Orange' : 'White'}`, kind: 'Audio · Smart speaker', body: 'HomePod mini: 360-degree sound from a sphere of acoustic mesh, Siri, and a smart home hub. Tap its top to play; tap again to stop. ₹ 10,900.', specs: ['Computational audio', 'Intercom and Handoff from iPhone', 'Five colours'] })
    }
    product(airpodsPro(s, a, g, 'table', 10.7, hi, 10.22, -PI / 2), { title: 'AirPods Pro 2', kind: 'Audio · Earbuds', body: 'AirPods Pro 2 with the H2 chip: Active Noise Cancellation, Adaptive Audio, Conversation Awareness and a hearing health feature, in a MagSafe charging case with a speaker and lanyard loop. Tap the lid to open the case. ₹ 24,900.', specs: ['Up to 6 hours of listening (30 with the case)', 'USB-C, MagSafe and Qi charging', 'IP54 dust, sweat and water resistant'] })
  }

  /* ---------- drum 1: Watches, an iPad Pro, an iPhone ---------- */
  const drum = (x: number, z: number, r: number, h: number, name: string, card: Card) => {
    const d = new Group()
    g.add(d)
    const body = mesh(d, new CylinderGeometry(r, r, h - 0.06, 64), a.corian, x, Y + 0.06 + (h - 0.06) / 2, z)
    void body
    mesh(d, new CylinderGeometry(r - 0.05, r - 0.05, 0.06, 48), a.shadowGap, x, Y + 0.03, z)
    k.cyl(d, r + 0.005, r + 0.005, 0.015, a.corian, x, Y + h - 0.0075, z, 64)
    e.shade.pool(x, Y + 0.012, z, r * 1.15, r * 1.15, 0.35)
    info(s, d, card, 0)
    void name
    return Y + h
  }
  {
    const top = drum(8.0, 9.4, 0.55, 0.92, 'watch', { title: 'Watch and iPad Table', kind: 'Display table', body: 'A white drum for Apple Watch: Series 10 in its aluminium finishes on display pillows, each with a band to try (tap a watch for the next band), an iPad Pro and an iPhone beside them.', specs: ['White solid surface drum, 1.1 m across', 'Integrated charging'] })
    const WATCHES: [string, string, string, string][] = [
      ['Jet Black', '#1b1b1d', '#2b2b2e', '#ff9f0a'], ['Rose Gold', '#e8c3b6', '#f0c7c0', '#ff6b8a'], ['Silver', '#d7d8da', '#c9d6e6', '#64d2ff'],
      ['Jet Black', '#1b1b1d', '#7a2734', '#30d158'], ['Silver', '#d7d8da', '#e9e3d6', '#ffd60a'], ['Rose Gold', '#e8c3b6', '#9fb3a6', '#bf5af2'],
    ]
    const bands = ['#2b2b2e', '#f0c7c0', '#c9d6e6', '#7a2734', '#e9e3d6', '#9fb3a6', '#e05a3a', '#3a4a8a'].map((c2) => a.sport(c2))
    WATCHES.forEach(([finish, caseC, band, acc], i) => {
      const ang = PI + (i - 2.5) * 0.36
      const x = 8.0 + Math.sin(ang) * 0.36
      const z = 9.4 + Math.cos(ang) * 0.36
      const w = watch(a, g, x, top, z, ang, caseC, band, a.watch(acc))
      let bi = i
      const b = button(w.g, `band${i}`, 'Apple Watch', 'Try the next band', 0, 0.034, 0, () => {
        bi = (bi + 1) % bands.length
        w.strap.material = bands[bi]
        play({ dur: 0.3, step: (t) => w.strap.scale.set(1, 1, 5.2 * (0.9 + 0.1 * t)) }, b)
      }, 'apple')
      b.add(new Mesh(new BoxGeometry(0.03, 0.075, 0.075), HIT))
      product(w.g, { title: `Apple Watch Series 10 · ${finish} Aluminium`, kind: 'Apple Watch · 46 mm', body: `Apple Watch Series 10: the biggest, brightest display yet in the thinnest Apple Watch, 9.7 mm. ${finish} aluminium case, Sport Band. Tap the band to try another colour. From ₹ 46,900.`, specs: ['Wide-angle OLED, up to 2000 nits', 'S10 SiP; sleep apnoea notifications, ECG, depth gauge', 'Fast charge to 80% in 30 minutes'] }, 0.002)
    })
    // The iPad Pro on a low wedge, and an iPhone laid on the table.
    const wedge = at(g, 7.82, top, 9.62, PI + 0.6)
    k.box(wedge, 0.2, 0.012, 0.18, a.whitePlastic, 0, 0.006, 0)
    const tilt = at(wedge, 0, 0.012, 0.03, 0)
    tilt.rotation.x = -PI / 2 + 0.38
    const pScreens = (['lock', 'home', 'ai'] as const).map((kd) => a.ios(kd, ['#8a7ad8', '#2a1f6b'], false, false))
    const pad = ipad(a, tilt, '#b9babd', pScreens[0])
    pad.g.position.set(0, 0.125, 0.003)
    let pi = 0
    const pb = button(pad.g, 'ipad', 'iPad Pro', 'Tap the screen', 0, 0, 0.003, () => {
      pi = (pi + 1) % pScreens.length
      pad.screen.material = pScreens[pi]
    }, 'apple')
    pb.add(new Mesh(new BoxGeometry(0.165, 0.236, 0.002), HIT))
    product(wedge, { title: 'iPad Pro 11-inch · Silver', kind: 'iPad', body: 'iPad Pro with M4: 5.3 mm thin, an Ultra Retina XDR tandem OLED display, the landscape front camera, Apple Pencil Pro and Magic Keyboard support. Tap the screen to wake it and swipe through. From ₹ 99,900.', specs: ['11-inch Ultra Retina XDR (tandem OLED)', 'M4 chip', '12MP Wide camera with LiDAR', '249.7 × 177.5 × 5.3 mm, 444 g'] })
    phoneOnStand(PHONES[0], 8.3, top, 9.72, PI - 0.5, 'd1')
  }

  /* ---------- drum 2: iPhones round AirPods Max and the boxes ---------- */
  {
    const top = drum(6.25, 10.0, 0.55, 0.92, 'iphone', { title: 'iPhone Table', kind: 'Display table', body: 'A white drum of the iPhone 16 family on their stands to pick up and try (each tethered to the table), with AirPods Max and the boxes as they come home.', specs: ['White solid surface drum, 1.1 m across', 'Integrated charging and security'] })
    const order = [1, 4, 2, 5, 3, 6]
    order.forEach((pi2, i) => {
      const ang = (i / order.length) * PI * 2 + 0.3
      phoneOnStand(PHONES[pi2], 6.25 + Math.sin(ang) * 0.4, top, 10.0 + Math.cos(ang) * 0.4, ang, `d2_${i}`)
    })
    product(airpodsMax(a, g, 6.25, top, 10.0, PI, '#1f1f22', '#3a3a3c'), { title: 'AirPods Max · Midnight', kind: 'Audio · Over-ear headphones', body: 'AirPods Max in midnight: Active Noise Cancellation, Transparency mode, Personalised Spatial Audio with dynamic head tracking, USB-C. ₹ 59,900.', specs: ['Up to 20 hours of listening', 'Five colours'] })
    product(productBox(a, g, 6.0, top, 9.83, 0.4, 0.08, 0.025, 0.165, a.box('iPhone 16 Pro', 'case', '#c6ad94')), { title: 'iPhone 16 Pro · Box', kind: 'Packaging', body: 'iPhone as it comes: a fibre-based box with the phone and a woven USB-C cable inside. No plastic.', specs: ['100% fibre-based packaging'] })
    product(airpodsPro(s, a, g, 'drum', 6.5, top, 9.85, PI - 0.3), { title: 'AirPods Pro 2', kind: 'Audio · Earbuds', body: 'AirPods Pro 2: Active Noise Cancellation, Adaptive Audio and the hearing health feature. Tap the lid to open the case. ₹ 24,900.', specs: ['H2 chip', 'USB-C MagSafe case'] })
  }

  /* ---------- the accessory wall (the reference's right) ---------- */
  {
    const z0 = 8.55
    const z1 = 11.05
    const len = z1 - z0
    const d = 0.4
    const w = at(g, X0, Y, (z0 + z1) / 2, PI / 2)
    // A pale grey back, white uprights and shelves, cupboards under.
    k.box(w, len, 2.3, 0.015, a.greyBack, 0, 1.15, 0.0075)
    const bays = 3
    for (let i = 0; i <= bays; i++) k.box(w, 0.025, 2.3, d, a.corian, -len / 2 + 0.0125 + (i * (len - 0.025)) / bays, 1.15, d / 2)
    k.box(w, len, 0.03, d, a.corian, 0, 2.285, d / 2)
    const SH = [1.0, 1.36, 1.72, 2.06]
    for (const h of SH) {
      k.box(w, len - 0.02, 0.022, d - 0.02, a.corian, 0, h - 0.011, d / 2)
      k.box(w, len - 0.1, 0.004, 0.01, led, 0, h - 0.024, d - 0.04, false)
    }
    k.box(w, len, 0.06, d - 0.04, a.shadowGap, 0, 0.03, d / 2 - 0.02)
    k.box(w, len, 0.02, d, a.corian, 0, 0.78, d / 2)
    const bw = (len - 0.025) / bays
    for (let i = 0; i < bays * 2; i++) {
      const left = i % 2 === 0
      const bay = Math.floor(i / 2)
      const hx = -len / 2 + 0.0125 + bay * bw + (left ? 0.015 : bw - 0.015)
      const dd = new Group()
      dd.name = `door_apple_cupboard_${i}`
      dd.userData.label = 'Cupboard door'
      dd.userData.openAngle = left ? -1.7 : 1.7
      dd.position.set(hx, 0.06, d)
      w.add(dd)
      const leafW = bw / 2 - 0.02
      k.box(dd, leafW, 0.71, 0.018, a.corian, (left ? 1 : -1) * leafW / 2, 0.355, 0.009).userData.front = true
      // Stock inside: boxes in rows.
      for (let q = 0; q < 3; q++) productBox(a, w, hx + (left ? 1 : -1) * (0.08 + q * 0.12), 0.07, d / 2, 0, 0.1, 0.18 - q * 0.03, 0.2, a.box('Accessory', 'cable', '#bbbbbf'))
    }
    // The shelves, dressed: one kind of thing in each bay of each shelf, each with its card.
    const row = (bay: number, shelf: number, fill: (p: Object3D, x0: number, x1: number, y: number) => void, card: Card) => {
      const grp = new Group()
      w.add(grp)
      const x0 = -len / 2 + 0.0125 + bay * bw + 0.04
      fill(grp, x0, x0 + bw - 0.08, SH[shelf])
      info(s, grp, card, 0.004)
    }
    const CASE_C = ['#3a4a8a', '#e05a3a', '#f0c7c0', '#2b2b2e', '#9fb3a6', '#e8d27a']
    row(0, 0, (p, x0, x1, y) => {
      for (let i = 0; i < 6; i++) phoneCase(a, p, x0 + 0.04 + (i * (x1 - x0 - 0.08)) / 5, y, 0.18, 0, CASE_C[i], i % 2 === 0)
    }, { title: 'Silicone Cases with MagSafe', kind: 'Accessories · iPhone', body: 'Silicone cases for iPhone 16 and 16 Pro with MagSafe, a soft microfibre lining and a Camera Control sapphire crystal. ₹ 4,900.', specs: ['Snaps on with MagSafe', 'Seasonal colours'] })
    row(1, 0, (p, x0, x1, y) => {
      for (let i = 0; i < 5; i++) productBox(a, p, x0 + 0.05 + i * ((x1 - x0 - 0.1) / 4), y, 0.2, 0, 0.09, 0.11, 0.05, a.box('20W Adapter', 'adapter', '#e9e9eb'))
    }, { title: '20W USB-C Power Adapter', kind: 'Accessories · Power', body: 'Fast-charges iPhone to 50% in about 30 minutes. ₹ 1,900.', specs: ['USB-C', '20 W'] })
    row(2, 0, (p, x0, x1, y) => {
      for (let i = 0; i < 4; i++) adapter(a, p, x0 + 0.06 + i * ((x1 - x0 - 0.12) / 3), y, 0.2)
      magsafe(a, p, x1 - 0.12, y, 0.12)
    }, { title: 'Chargers to Try', kind: 'Accessories · Power', body: 'The 20 W adapter out of its box, and the MagSafe Charger: snap it to the back of any iPhone 16 for up to 25 W wireless charging. MagSafe Charger from ₹ 4,500.', specs: ['MagSafe up to 25 W with a 30 W adapter'] })
    row(0, 1, (p, x0, x1, y) => {
      for (let i = 0; i < 4; i++) productBox(a, p, x0 + 0.06 + i * ((x1 - x0 - 0.12) / 3), y, 0.2, 0, 0.12, 0.12, 0.03, a.box('MagSafe Charger', 'magsafe', '#e3e3e6'))
    }, { title: 'MagSafe Charger', kind: 'Accessories · Power', body: 'The MagSafe Charger in its box: aligns perfectly and charges iPhone wirelessly up to 25 W. 1 m and 2 m. From ₹ 4,500.', specs: ['Braided cable'] })
    row(1, 1, (p, x0, x1, y) => {
      for (let i = 0; i < 4; i++) productBox(a, p, x0 + 0.06 + i * ((x1 - x0 - 0.12) / 3), y, 0.2, 0, 0.1, 0.13, 0.04, a.box('USB-C Cable', 'cable', '#d9d9dc'))
    }, { title: 'USB-C Woven Charge Cable', kind: 'Accessories · Cables', body: 'A woven USB-C cable for iPhone 16, iPad and Mac: 60 W charging and USB 2 data. 1 m, ₹ 1,900; 240 W, 2 m, ₹ 2,900.', specs: ['Woven design'] })
    row(2, 1, (p, x0, x1, y) => {
      for (let i = 0; i < 3; i++) productBox(a, p, x0 + 0.08 + i * ((x1 - x0 - 0.16) / 2), y, 0.2, 0, 0.13, 0.13, 0.035, a.box('AirTag 4 Pack', 'airtag', '#ececee'))
      for (let i = 0; i < 3; i++) airtag(a, p, x1 - 0.05 - i * 0.04, y, 0.33)
    }, { title: 'AirTag', kind: 'Accessories · Find My', body: 'Keep track of your keys, wallet or bag in the Find My app with Precision Finding. ₹ 3,490; four for ₹ 11,900.', specs: ['IP67', 'Replaceable battery, a year of use'] })
    row(0, 2, (p, x0, x1, y) => {
      for (let i = 0; i < 4; i++) productBox(a, p, x0 + 0.06 + i * ((x1 - x0 - 0.12) / 3), y, 0.2, 0, 0.06, 0.22, 0.04, a.box('Apple Pencil Pro', 'pencil', '#f0f0f2'))
    }, { title: 'Apple Pencil Pro', kind: 'Accessories · iPad', body: 'Apple Pencil Pro: squeeze, barrel roll, haptic feedback and Find My, for iPad Pro (M4) and iPad Air (M2). ₹ 11,900.', specs: ['Pairs and charges magnetically'] })
    row(1, 2, (p, x0, x1, y) => {
      for (let i = 0; i < 4; i++) productBox(a, p, x0 + 0.06 + i * ((x1 - x0 - 0.12) / 3), y, 0.2, 0, 0.1, 0.13, 0.04, a.box('Clear Case', 'case', '#dfe6ee'))
    }, { title: 'Clear Case with MagSafe', kind: 'Accessories · iPhone', body: 'Optically clear polycarbonate with flexible sides and MagSafe, to show off the colour. ₹ 4,900.', specs: ['Resists yellowing'] })
    row(2, 2, (p, x0, x1, y) => {
      for (let i = 0; i < 3; i++) productBox(a, p, x0 + 0.08 + i * ((x1 - x0 - 0.16) / 2), y, 0.2, 0, 0.13, 0.17, 0.06, a.box('AirPods 4', 'airtag', '#f4f4f6'))
    }, { title: 'AirPods 4', kind: 'Audio · Earbuds', body: 'AirPods 4, open-ear, with the H2 chip; with Active Noise Cancellation from ₹ 17,900. In their box.', specs: ['USB-C case'] })
    // The top shelves: boxed devices, a few at a time.
    row(1, 3, (p, x0, x1, y) => {
      for (let i = 0; i < 3; i++) productBox(a, p, x0 + 0.1 + i * ((x1 - x0 - 0.2) / 2), y, 0.2, 0, 0.09, 0.17, 0.03, a.box('iPhone 16', 'case', ['#4c63d8', '#88c1c2', '#f1b9c8'][i]))
    }, { title: 'iPhone 16 · Boxed', kind: 'Packaging', body: 'iPhone 16 in ultramarine, teal and pink, boxed. Ask the team for your colour and capacity.', specs: ['128 GB, 256 GB, 512 GB'] })
    e.shade.rect(X0 + d / 2, Y + 0.012, (z0 + z1) / 2, d, len, 0, 0.3)
  }

  /* ---------- stools at the counter ---------- */
  for (const x of [8.95, 9.5]) {
    const st = at(g, x, Y, 10.42, 0)
    k.cyl(st, 0.2, 0.21, 0.012, a.aluminium, 0, 0.006, 0, 40)
    k.cyl(st, 0.022, 0.022, 0.66, a.aluminium, 0, 0.34, 0, 20)
    k.cyl(st, 0.17, 0.17, 0.008, a.aluminium, 0, 0.3, 0, 40).scale.set(1, 1, 1)
    const ring = mesh(st, new CylinderGeometry(0.17, 0.17, 0.012, 40, 1, true), a.aluminium, 0, 0.3, 0)
    void ring
    mesh(st, slab(0.36, 0.36, 0.05, 0.18, 0.015), lux.oak as Material, 0, 0.69, 0).rotation.x = -PI / 2
    e.shade.pool(x, Y + 0.012, 10.42, 0.24, 0.24, 0.35)
    info(s, st, { title: 'Counter Stool', kind: 'Seating', body: 'A bar-height stool for a set-up or an appointment at the counter: a solid oak seat on a polished aluminium column and foot ring.', specs: ['Seat 720 mm high', 'Solid oak, aluminium'] }, 0)
  }

  /* ---------- lighting and switches ---------- */
  lamp(s, 6.2, Y + H - 0.4, 10.0, 9, 8, '#f4f6ff')
  lamp(s, 8.0, Y + H - 0.4, 9.4, 9, 8, '#f4f6ff')
  lamp(s, 10.2, Y + H - 0.4, 10.6, 8, 8, '#f4f6ff')
  {
    const sw = new Group()
    sw.position.set(X1 - 0.021, Y + 1.2, 8.62)
    sw.rotation.y = -PI / 2
    g.add(sw)
    const plate = switchPlate(k, sw, 'apple', ['switch', 'switch'], { plate: a.whitePlastic, rocker: a.whitePlastic, dark: a.shadowGap, locator: lux.ledCool as MeshStandardMaterial }, [s.circuit, screenCircuit])
    plate.traverse((o) => {
      if (o.name === 'switch_apple_0') o.userData.label = 'Store lights'
      if (o.name === 'switch_apple_1') o.userData.label = 'Wall screen'
    })
    setCircuit(s.circuit, true)
    setCircuit(screenCircuit, true)
  }
  return s
}
