import { BufferGeometry, CatmullRomCurve3, CircleGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Path, Shape, ShapeGeometry, SphereGeometry, TorusGeometry, TubeGeometry, Vector2, Vector3, type Material, type Object3D } from 'three'
import { circuit, setCircuit, switchPlate } from '../../../kalakalD65/fixtures'
import { rng } from '../../../textures'
import { place } from '../signs'
import { clipped, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { mistOn } from './beauty'
import { button, info, lathe, live, play } from './cafe'
import { at, box, flat, lamp, mesh, onCircuit, openShop, pane, PI, swingLeaf, type Shop } from './kit'
import { MAISON, perfumeMaterials, type PerfumeMaterials, type Print } from './perfumeArt'
import { carton, discoveryBox, flacon, giftSet, type Flacon } from './perfumes'

/*
 * Maison Sakura, unit G-06: the parfumerie off the rear gallery beside Rosé Atelier, facing the
 * foot of the escalators. Built from the reference, looking in from the door:
 *
 *   front     a burgundy fascia with the name in brass, brass-framed glass and glass doors under an
 *             arched fanlight; just inside, the deep burgundy portal, padded and rounded like an
 *             upholstered arch, framing the room
 *   above     a blush plaster barrel vault with fine brass arcs across it, a hidden line of light
 *             along each side where it springs; a cherry tree in blossom, pink with some blue,
 *             rising from a round planter by the door and spreading under the vault
 *   left      the burgundy wall: three arched niches, lit, glass shelves on brass edges over
 *             drawers: the women's, the men's and the shared fragrances
 *   right     the curved two-tier counter in burgundy lacquer, a white ledge between the tiers and a
 *             white top, a line of light at its foot: testers, blotters, blossom in a vase, the
 *             featured bottles on white risers, the discovery set, the till; behind it, two lit
 *             arched niches in the blush wall of gift sets and boxed fragrance
 *   back      the great arched niche of the prestige cabinet (glass doors over drawers) between two
 *             narrow lit niches, the house's mark in the arch above it
 *   floor     white limestone in small tiles
 *
 * Every bottle, box and set explains itself when tapped; the featured bottles on the counter lift
 * and turn to be looked at; the testers spray; the discovery set's lid lifts; the cabinet's glass
 * doors open; every drawer opens; the entrance doors open; the till takes an order through; two
 * switches by the door work the parfumerie's lights and its display lighting.
 */

const L = 4.075
const R = 7.675
const MID = (L + R) / 2
const BACK = -16.525
const FZ = -9.0
/** The vault: springing height, crown height, and its circle (centre height, radius). */
const SPRING = 3.3
const CROWN = 4.6
const VR = ((MID - L) ** 2 + (CROWN - SPRING) ** 2) / (2 * (CROWN - SPRING))
const VY = CROWN - VR
/** The portal's inner face, and the depth of the furred walls left and right and at the back. */
const PORTAL = { z0: FZ - 0.47, z1: FZ - 0.07, pier: 0.34 }
const LF = 0.3
const RF = 0.25
const BF = 0.45
/** The counter: its arcs' centre and radii, the z range it runs over. */
const CT = { cx: R + 1.1, cz: -12.7, ro: 2.9, ri: 2.28, z0: -14.2, z1: -10.5 }
/** The tree's planter. */
const TREE = { x: 4.75, z: -10.35, r: 0.33 }

/** The vault's height over x. */
const vaultY = (x: number) => VY + Math.sqrt(Math.max(0, VR * VR - (x - MID) ** 2))

type Card = { title: string; kind: string; body: string; specs: string[] }

/* ---------- the collection ---------- */

interface Scent {
  name: string
  family: 'Women' | 'Men' | 'Unisex'
  conc: 'Eau de parfum' | 'Eau de toilette' | 'Extrait de parfum'
  notes: string
  /** Top, heart, base. */
  pyramid: [string, string, string]
  price: number
  bottle: Omit<Flacon, 'print'>
  box: string
  ground: string
  ink: string
  foil: string
}

const S: Record<string, Scent> = {
  sakura: {
    name: 'Sakura Blanc', family: 'Women', conc: 'Eau de parfum', notes: 'cherry blossom over white peony and soft musk', pyramid: ['Pink pepper, pear', 'Cherry blossom, white peony', 'White musk, cashmere wood'], price: 12500,
    bottle: { style: 'faceted', juice: '#f6c6d2', glass: 'thick', cap: 'disc', capMat: 'roseGold', metal: 'roseGold' }, box: '#f3dde2', ground: '#fbf1f2', ink: '#8b3a52', foil: '#c98e86',
  },
  fleur: {
    name: 'Fleur de Nuit', family: 'Women', conc: 'Eau de parfum', notes: 'night-blooming jasmine, dark plum and vanilla', pyramid: ['Plum, bergamot', 'Jasmine sambac, tuberose', 'Bourbon vanilla, benzoin'], price: 13900,
    bottle: { style: 'orb', juice: '#5e2448', glass: 'thick', cap: 'dome', capMat: 'capBlack', metal: 'gold' }, box: '#2c1b29', ground: '#2c1b29', ink: '#e8cfa0', foil: '#d2b16f',
  },
  rose: {
    name: 'Rose Kyoto', family: 'Women', conc: 'Eau de parfum', notes: 'Damask rose, yuzu and hinoki wood', pyramid: ['Yuzu, lychee', 'Damask rose, peony', 'Hinoki, white amber'], price: 12900,
    bottle: { style: 'orb', juice: '#eaa0ae', glass: 'thick', cap: 'dome', capMat: 'roseGold', metal: 'roseGold' }, box: '#ebc8cc', ground: '#f8ecec', ink: '#7a2f3d', foil: '#c98e86',
  },
  iris: {
    name: 'Iris Poudré', family: 'Women', conc: 'Eau de parfum', notes: 'powdery iris, violet leaf and suede', pyramid: ['Violet leaf, mandarin', 'Orris butter, heliotrope', 'Suede, sandalwood'], price: 11900,
    bottle: { style: 'faceted', juice: '#d9cbe9', glass: 'thick', cap: 'disc', capMat: 'silver', metal: 'silver' }, box: '#e5deee', ground: '#f4f1f8', ink: '#4f3f6b', foil: '#a9a3b8',
  },
  bois: {
    name: 'Bois Noir', family: 'Men', conc: 'Eau de parfum', notes: 'smoked cedar, black pepper and vetiver', pyramid: ['Black pepper, cardamom', 'Smoked cedar, leather', 'Vetiver, labdanum'], price: 11500,
    bottle: { style: 'slab', juice: '#3d3431', glass: 'smoke', cap: 'block', capMat: 'capBlack', metal: 'gunmetal' }, box: '#1e1e20', ground: '#1e1e20', ink: '#d9d4cc', foil: '#8d8f93',
  },
  vetiver: {
    name: 'Vétiver Marin', family: 'Men', conc: 'Eau de toilette', notes: 'sea salt, Haitian vetiver and bergamot', pyramid: ['Bergamot, sea salt', 'Sage, geranium', 'Vetiver, driftwood'], price: 8900,
    bottle: { style: 'flask', juice: '#a3cce9', glass: 'cobalt', cap: 'tube', capMat: 'silver', metal: 'silver' }, box: '#1f3654', ground: '#1f3654', ink: '#e7eef6', foil: '#b9c3cf',
  },
  cuir: {
    name: 'Cuir Velours', family: 'Men', conc: 'Eau de parfum', notes: 'soft suede, saffron and blond tobacco', pyramid: ['Saffron, pink pepper', 'Suede, iris', 'Tobacco, tonka, oud'], price: 12200,
    bottle: { style: 'slab', juice: '#a8612f', glass: 'thick', cap: 'block', capMat: 'capWood', metal: 'gold' }, box: '#6b3f24', ground: '#6b3f24', ink: '#f2e3c8', foil: '#d2b16f',
  },
  ambre: {
    name: 'Ambre Soleil', family: 'Unisex', conc: 'Eau de parfum', notes: 'golden amber, labdanum and warm skin', pyramid: ['Orange blossom, bergamot', 'Amber, labdanum', 'Vanilla, musk, benzoin'], price: 10900,
    bottle: { style: 'column', juice: '#e1a34b', glass: 'thick', cap: 'cube', capMat: 'gold', metal: 'gold' }, box: '#e9c47d', ground: '#fbf3e1', ink: '#7a5222', foil: '#c8a25a',
  },
  neroli: {
    name: 'Néroli Riviera', family: 'Unisex', conc: 'Eau de toilette', notes: 'bright neroli, petitgrain and sea air', pyramid: ['Neroli, lemon', 'Orange blossom, petitgrain', 'White musk, ambrette'], price: 8500,
    bottle: { style: 'cylinder', juice: '#f3e3a1', glass: 'thick', cap: 'tube', capMat: 'capWhite', metal: 'silver' }, box: '#f5edd3', ground: '#fffaf0', ink: '#6e6430', foil: '#c9b56a',
  },
  matcha: {
    name: 'Thé Matcha', family: 'Unisex', conc: 'Eau de toilette', notes: 'ceremonial green tea, fig leaf and mate', pyramid: ['Green tea, yuzu', 'Fig leaf, mate', 'Cedar, musk'], price: 8500,
    bottle: { style: 'cylinder', juice: '#c4d696', glass: 'thick', cap: 'tube', capMat: 'capWood', metal: 'gold' }, box: '#cdd7b3', ground: '#f3f5ea', ink: '#4c5a2e', foil: '#a3ad7c',
  },
  oud: {
    name: 'Oud Impérial', family: 'Unisex', conc: 'Extrait de parfum', notes: 'aged oud, Taif rose and saffron', pyramid: ['Saffron, cinnamon', 'Taif rose, oud', 'Ambergris, leather, sandalwood'], price: 28500,
    bottle: { style: 'decanter', juice: '#7c3b1c', glass: 'thick', cap: 'stopper', capMat: 'crystal', metal: 'gold' }, box: '#2b1a12', ground: '#2b1a12', ink: '#e7c98a', foil: '#d2b16f',
  },
  musc: {
    name: 'Musc Céleste', family: 'Unisex', conc: 'Extrait de parfum', notes: 'clean white musk, iris and ambrette', pyramid: ['Aldehydes, pear', 'Iris, ambrette seed', 'White musk, cashmeran'], price: 24500,
    bottle: { style: 'decanter', juice: '#e9eef6', glass: 'thick', cap: 'stopper', capMat: 'crystal', metal: 'silver' }, box: '#eef1f6', ground: '#f7f8fb', ink: '#3d4a63', foil: '#a9b2c3',
  },
}

const rupees = (n: number) => `₹ ${n.toLocaleString('en-IN')}`
const abbr = (c: Scent['conc']) => (c === 'Eau de parfum' ? 'EDP' : c === 'Eau de toilette' ? 'EDT' : 'Extrait')
const printOf = (c: Scent, size: string): Print => ({ name: c.name, line: `${abbr(c.conc)} · ${size}`, ground: c.ground, ink: c.ink, foil: c.foil })

export function buildParfumerie(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux, m: mm } = e
  const { g, y: Y } = s
  const p = perfumeMaterials(e)

  // Two circuits: the parfumerie's lights, and its display lighting (niches, coves, the tree).
  const display = circuit()
  const glowOf = (mat: MeshStandardMaterial) => {
    const n = mat.clone()
    n.userData.interior = true
    display.glows.push(n)
    return n
  }
  const led = glowOf(lux.led as MeshStandardMaterial)
  const nicheGlow = glowOf(s.m.backlit('#fff0e4', 0.32))
  nicheGlow.side = DoubleSide
  const spot = onCircuit(s, lux.led as MeshStandardMaterial)

  /* ---------- products and their cards ---------- */
  const product = <T extends Object3D>(o: T, card: Card) => {
    info(s, o, card, 0.003)
    return o
  }
  const bottleCard = (c: Scent, ml: number): Card => ({
    title: `${c.name} · ${ml} ml`,
    kind: `${c.family === 'Unisex' ? 'Unisex' : c.family === 'Women' ? 'For her' : 'For him'} · ${c.conc}`,
    body: `${c.name} by ${MAISON.split(' ').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ')}: ${c.notes}. ${c.conc}, ${ml} ml, ${rupees(Math.round((c.price * (ml === 100 ? 1 : ml === 50 ? 0.68 : 0.28)) / 50) * 50)}.`,
    specs: [`Top: ${c.pyramid[0]}`, `Heart: ${c.pyramid[1]}`, `Base: ${c.pyramid[2]}`, c.conc === 'Extrait de parfum' ? 'Lasts 10–12 hours' : c.conc === 'Eau de parfum' ? 'Lasts 6–8 hours' : 'Lasts 4–6 hours'],
  })
  /** A bottle of a scent, `ml` its size (100, 50 or 30), as it stands on the shelf. */
  const bottle = (par: Object3D, c: Scent, ml: number, x: number, y: number, z: number, yaw: number) => {
    const scale = ml === 100 ? 1 : ml === 50 ? 0.84 : 0.72
    const { g: b } = flacon(s, p, par, { ...c.bottle, scale, print: printOf(c, `${ml} ml`) }, x, y, z, yaw)
    return product(b, bottleCard(c, ml))
  }
  const boxed = (par: Object3D, c: Scent, x: number, y: number, z: number, yaw: number, small = false) => {
    const [w, h, d] = small ? [0.07, 0.11, 0.045] : c.bottle.style === 'decanter' ? [0.11, 0.17, 0.1] : [0.085, 0.14, 0.055]
    const b = carton(s, p, par, x, y, z, yaw, w, h, d, c.box, printOf(c, small ? '50 ml' : '100 ml'))
    return product(b, { title: `${c.name} · Boxed`, kind: `${c.conc} · ${small ? '50' : '100'} ml in its box`, body: `${c.name} sealed in its box of rigid board, foil-blocked, the flacon held in a moulded insert: ready to give. ${rupees(small ? Math.round((c.price * 0.68) / 50) * 50 : c.price)}.`, specs: ['Recyclable board, cellophane-free', 'Complimentary gift wrapping and message card'] })
  }
  const travel = (par: Object3D, c: Scent, x: number, y: number, z: number, yaw: number, metal: 'gold' | 'silver' | 'roseGold' = 'gold') => {
    const { g: b } = flacon(s, p, par, { style: 'travel', juice: c.bottle.juice, metal, print: printOf(c, '10 ml') }, x, y, z, yaw)
    return product(b, { title: `${c.name} · Travel Spray`, kind: `${c.conc} · 10 ml`, body: `${c.name} in a refillable 10 ml travel atomiser, its fluted ${metal === 'roseGold' ? 'rose-gold' : metal} case showing the juice through a slot. ${rupees(Math.round((c.price * 0.24) / 50) * 50)}.`, specs: ['Refillable from the 100 ml bottle', 'Fits a clutch; cabin-friendly'] })
  }
  const oil = (par: Object3D, c: Scent, x: number, y: number, z: number, yaw: number) => {
    const { g: b } = flacon(s, p, par, { style: 'oil', juice: c.bottle.juice, metal: 'gold', print: { ...printOf(c, '15 ml'), line: 'Perfume oil · 15 ml' } }, x, y, z, yaw)
    return product(b, { title: `${c.name} · Perfume Oil`, kind: 'Fragrance oil · 15 ml', body: `${c.name} as an alcohol-free perfume oil in amber glass with a steel roller ball: worn close to the skin, warm and long-lasting. ${rupees(Math.round((c.price * 0.42) / 50) * 50)}.`, specs: ['Alcohol-free, in fractionated coconut oil', 'Roll on pulse points'] })
  }
  const mist = (par: Object3D, c: Scent, x: number, y: number, z: number, yaw: number) => {
    const { g: b } = flacon(s, p, par, { style: 'mist', juice: c.bottle.juice, glass: c.family === 'Women' ? 'frostedPink' : 'frosted', print: { ...printOf(c, '250 ml'), line: 'Body mist · 250 ml' } }, x, y, z, yaw)
    return product(b, { title: `${c.name} · Body Mist`, kind: 'Body mist · 250 ml', body: `A light, refreshing body mist of ${c.name}: ${c.notes}, softened with aloe. Spray all over after the shower. ${rupees(3250)}.`, specs: ['Alcohol-light formula with aloe', 'Lasts 2–3 hours'] })
  }

  /* ---------- the floor and the room's shell ---------- */
  const outline = clipped(e, u.rects[0])
  flat(g, outline, Y + 0.006, p.floor, false, [], 'parfum_floor')
  // The vault: a segment of a circle across the room, from the portal back to the back wall.
  {
    const a0 = Math.acos((L - MID) / VR)
    const a1 = Math.acos((R - MID) / VR)
    const n = 36
    const pos: number[] = []
    const uv: number[] = []
    const ring = (i: number): [number, number] => {
      const a = a0 + ((a1 - a0) * i) / n
      return [MID + Math.cos(a) * VR, VY + Math.sin(a) * VR]
    }
    for (let i = 0; i < n; i++) {
      const [xa, ya] = ring(i)
      const [xb, yb] = ring(i + 1)
      for (const [z0, z1] of [[PORTAL.z0 + 0.05, BACK]] as const) {
        const q = [[xa, ya, z0], [xb, yb, z0], [xb, yb, z1], [xa, ya, z1]]
        for (const j of [0, 1, 2, 0, 2, 3]) {
          pos.push(q[j][0], Y + q[j][1], q[j][2])
          uv.push(((j === 1 || j === 2 ? i + 1 : i) / n) * 3, j >= 2 ? (z0 - z1) / 2.4 : 0)
        }
      }
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
    geo.setAttribute('uv', new Float32BufferAttribute(uv, 2))
    geo.computeVertexNormals()
    const v = new Mesh(geo, p.vaultPlaster)
    v.receiveShadow = true
    v.name = 'parfum_vault'
    g.add(v)
    // Fine brass arcs across it, and a hidden line of light along each side at its springing.
    for (const z of [-12.1, -14.7]) {
      const arc = mesh(g, new TorusGeometry(VR - 0.006, 0.006, 6, 64, a0 - a1), p.brass, MID, Y + VY, z, false)
      arc.rotation.z = a1
    }
    // Over each furred wall, the plaster carried up to meet the vault.
    for (const x of [L + LF, R - RF]) {
      const top = vaultY(x)
      k.box(g, 0.02, top - SPRING + 0.02, PORTAL.z0 - BACK - BF + 0.02, p.blushPlaster, x + (x < MID ? -0.01 : 0.01), Y + (SPRING + top) / 2, (PORTAL.z0 + BACK + BF) / 2, false)
      for (const [x0, x1] of [[L, x], [x, R]]) if ((x0 === L && x < MID) || (x1 === R && x > MID)) k.box(g, x1 - x0, 0.02, PORTAL.z0 - BACK - BF, p.blushPlaster, (x0 + x1) / 2, Y + SPRING + 0.01, (PORTAL.z0 + BACK + BF) / 2, false)
    }
    // The cove: a concealed line of light along each side where the vault springs, washing up it.
    for (const [x, dir] of [[L + LF, 1], [R - RF, -1]] as const) k.box(g, 0.01, 0.012, PORTAL.z0 - BACK - BF - 0.2, led, x + dir * 0.006, Y + vaultY(x) - 0.03, (PORTAL.z0 + BACK + BF) / 2, false)
  }

  /** A shape's outline as the room's section: walls to the springing, the vault's arc over. */
  const section = (inset = 0) => {
    const pts: [number, number][] = [[L - MID + inset, 0], [L - MID + inset, SPRING]]
    const a0 = Math.acos((L + inset - MID) / (VR - inset))
    const a1 = Math.acos((R - inset - MID) / (VR - inset))
    for (let i = 0; i <= 40; i++) {
      const a = a0 + ((a1 - a0) * i) / 40
      pts.push([Math.cos(a) * (VR - inset), VY + Math.sin(a) * (VR - inset)])
    }
    pts.push([R - MID - inset, SPRING], [R - MID - inset, 0])
    return pts
  }
  /** An arch-headed opening from u0 to u1 across, v0 up to its springing at vs, a half round over. */
  const archHole = (u0: number, u1: number, v0: number, vs: number) => {
    const r = (u1 - u0) / 2
    const c = (u0 + u1) / 2
    const pts: [number, number][] = [[u0, v0], [u1, v0], [u1, vs]]
    for (let i = 1; i < 24; i++) {
      const a = (i / 24) * PI
      pts.push([c + Math.cos(a) * r, vs + Math.sin(a) * r])
    }
    pts.push([u0, vs])
    return pts
  }
  const shapeOf = (outer: [number, number][], holes: [number, number][][] = []) => {
    const sh = new Shape(outer.map(([x, y]) => new Vector2(x, y)))
    for (const h of holes) sh.holes.push(new Path(h.map(([x, y]) => new Vector2(x, y))))
    return sh
  }

  /* ---------- the walls: left (burgundy, three niches), right (blush, two), back (the cabinet) ---------- */
  const leftNiches: [number, number][] = [[11.0, 12.3], [12.75, 14.05], [14.5, 15.8]]
  const rightNiches: [number, number][] = [[10.9, 12.3], [12.85, 14.25]]
  const nicheFoot = 0.85
  const nicheSpring = 2.35
  {
    // Left: u = −z along the wall, v = height; extruded from the party wall into the room.
    const outer: [number, number][] = [[-PORTAL.z0, 0], [-BACK, 0], [-BACK, SPRING], [-PORTAL.z0, SPRING]]
    const holes = leftNiches.map(([a, b]) => archHole(a, b, nicheFoot, nicheSpring))
    const geo = new ExtrudeGeometry(shapeOf(outer, holes), { depth: LF, bevelEnabled: false, curveSegments: 12 })
    // Turned so the shape's u (= −z) runs along the wall and its depth into the room (+x).
    geo.rotateY(PI / 2)
    mesh(g, geo, p.burgundyWall, L, Y, 0).name = 'parfum_wall_left'
    for (const h of holes) {
      const pg = new ShapeGeometry(shapeOf(h))
      pg.rotateY(PI / 2)
      mesh(g, pg, nicheGlow, L + 0.02, Y, 0, false)
    }
  }
  {
    const outer: [number, number][] = [[-PORTAL.z0, 0], [-BACK, 0], [-BACK, SPRING], [-PORTAL.z0, SPRING]]
    const holes = rightNiches.map(([a, b]) => archHole(a, b, nicheFoot, nicheSpring + 0.25))
    const geo = new ExtrudeGeometry(shapeOf(outer, holes), { depth: RF, bevelEnabled: false, curveSegments: 12 })
    geo.rotateY(PI / 2)
    mesh(g, geo, p.blushPlaster, R - RF, Y, 0).name = 'parfum_wall_right'
    for (const h of holes) {
      const pg = new ShapeGeometry(shapeOf(h))
      pg.rotateY(PI / 2)
      mesh(g, pg, nicheGlow, R - 0.02, Y, 0, false)
    }
  }
  // The back wall: u = x − MID, the vault's section; the cabinet's great niche and two narrow ones.
  const CAB = { u0: -0.75, u1: 0.75, foot: 0.05, spring: 2.75 }
  const SIDE: [number, number][] = [[-1.4, -0.92], [0.92, 1.4]]
  {
    const holes = [archHole(CAB.u0, CAB.u1, CAB.foot, CAB.spring), ...SIDE.map(([a, b]) => archHole(a, b, nicheFoot, nicheSpring))]
    const geo = new ExtrudeGeometry(shapeOf(section(), holes), { depth: BF, bevelEnabled: false, curveSegments: 12 })
    mesh(g, geo, p.blushPlaster, MID, Y, BACK).name = 'parfum_wall_back'
    for (const h of holes) mesh(g, new ShapeGeometry(shapeOf(h)), nicheGlow, MID, Y, BACK + 0.02, false)
  }
  for (const [x0, z0, x1, z1] of [[L + LF, PORTAL.z0, L + LF, BACK + BF], [R - RF, PORTAL.z0, R - RF, BACK + BF], [L + LF, BACK + BF, R - RF, BACK + BF]] as const) e.shade.foot(x0, z0, x1, z1, Y + 0.01, 0.2, 0.22)

  /** Brass round an arched opening's edge, as the reference's gold lines. */
  const archTrim = (par: Object3D, u0: number, u1: number, vs: number, foot: number) => {
    const r = (u1 - u0) / 2
    const c = (u0 + u1) / 2
    const ring = mesh(par, new TorusGeometry(r + 0.012, 0.007, 6, 48, PI), p.brass, c, vs, 0, false)
    void ring
    for (const u of [u0 - 0.012, u1 + 0.012]) k.cyl(par, 0.007, 0.007, vs - foot, p.brass, u, (vs + foot) / 2, 0, 8).castShadow = false
  }
  {
    // Left niches' trims: on the wall's face, x = L + LF, turned to face +x.
    for (const [a, b] of leftNiches) {
      // Turned +90°, the trim's local x runs to −z: the niche's u range is its own.
      const t = at(g, L + LF + 0.004, Y, 0, PI / 2)
      archTrim(t, a, b, nicheSpring, nicheFoot)
    }
    for (const [a, b] of rightNiches) {
      const t = at(g, R - RF - 0.004, Y, 0, -PI / 2)
      archTrim(t, -b, -a, nicheSpring + 0.25, nicheFoot)
    }
    const t = at(g, MID, Y, BACK + BF + 0.004, 0)
    archTrim(t, CAB.u0, CAB.u1, CAB.spring, CAB.foot)
    for (const [a, b] of SIDE) archTrim(t, a, b, nicheSpring, nicheFoot)
  }

  /* ---------- the front on z = −9.0 ---------- */
  const soffit = e.soffit
  // Over the shopfront, up to the slab: the fascia stands under the gallery's ceiling (4.2 m).
  box(s, L - 0.075, 7.75, Y + 4.2, soffit, FZ - 0.075, FZ + 0.075, mm.wallPaint)
  const HEAD = 3.3
  {
    const f0 = FZ + 0.02
    const f1 = FZ + 0.24
    k.box(g, 7.75 - (L - 0.15), 0.9, f1 - f0, p.burgundy, (L - 0.15 + 7.75) / 2, Y + 3.75, (f0 + f1) / 2)
    for (const yy of [3.33, 4.17]) k.box(g, 7.75 - (L - 0.15), 0.012, 0.012, p.brass, (L - 0.15 + 7.75) / 2, Y + yy, f1 + 0.003, false)
    const t = p.canvas(1024, 192, (cx, w, h) => {
      cx.clearRect(0, 0, w, h)
      cx.fillStyle = '#ffffff'
      cx.textBaseline = 'middle'
      cx.font = `500 ${Math.round(h * 0.46)}px "Cormorant Garamond", "Playfair Display", Georgia, serif`
      const sp = h * 0.09
      let x = w / 2 - (cx.measureText(MAISON).width + sp * (MAISON.length - 1)) / 2
      cx.textAlign = 'left'
      for (const ch of MAISON) {
        cx.fillText(ch, x, h * 0.4)
        x += cx.measureText(ch).width + sp
      }
      cx.textAlign = 'center'
      cx.font = `600 ${Math.round(h * 0.13)}px "Inter", Arial, sans-serif`
      cx.fillText('P A R F U M E R I E   ·   P A R I S   ·   K Y O T O', w / 2, h * 0.84)
    })
    const name = new MeshStandardMaterial({ map: t, color: '#d8b46e', emissiveMap: t, emissive: '#c09a52', emissiveIntensity: 0.35, metalness: 0.7, roughness: 0.3, alphaTest: 0.5 })
    name.userData.interior = true
    const q = place(g, 3.0, 0.56, [0, 0, 1, 1], name, MID, Y + 3.76, f1 + 0.004, 0)
    void q
  }
  // Burgundy pilasters, brass frames, glass, the doors and the arched fanlight over them.
  for (const [a, c2] of [[L - 0.075, 4.2], [7.475, 7.75]] as const) k.box(g, c2 - a, HEAD, 0.2, p.burgundy, (a + c2) / 2, Y + HEAD / 2, FZ + 0.02)
  const D0 = 4.875
  const D1 = 6.875
  for (const xx of [4.2, D0, D1, 7.475]) box(s, xx - 0.022, xx + 0.022, Y, Y + HEAD, FZ - 0.03, FZ + 0.03, p.brass)
  box(s, 4.2, 7.475, Y + HEAD - 0.04, Y + HEAD + 0.02, FZ - 0.035, FZ + 0.035, p.brass)
  box(s, D0, D1, Y + 2.73, Y + 2.78, FZ - 0.035, FZ + 0.035, p.brass)
  for (const [a, b] of [[4.2, D0], [D1, 7.475]] as const) box(s, a, b, Y, Y + 0.06, FZ - 0.03, FZ + 0.03, p.brass)
  pane(s, g, 4.222, FZ, D0 - 0.022, FZ, Y + 0.06, Y + HEAD - 0.04)
  pane(s, g, D1 + 0.022, FZ, 7.453, FZ, Y + 0.06, Y + HEAD - 0.04)
  pane(s, g, D0 + 0.022, FZ, D1 - 0.022, FZ, Y + 2.78, Y + HEAD - 0.04)
  {
    // The fanlight: a shallow brass arch over the doors, its radial bars.
    const fc = (D0 + D1) / 2
    const rise = HEAD - 0.06 - 2.78
    const half = (D1 - D0) / 2
    const rad = (half * half + rise * rise) / (2 * rise)
    const cy = 2.78 + rise - rad
    const sweep = Math.asin(half / rad)
    const ring = mesh(g, new TorusGeometry(rad, 0.012, 6, 48, 2 * sweep), p.brass, fc, Y + cy, FZ, false)
    ring.rotation.z = PI / 2 - sweep
    for (let i = 1; i < 6; i++) {
      const a = PI / 2 - sweep + (2 * sweep * i) / 6
      const tx = Math.cos(a) * rad
      const ty = cy + Math.sin(a) * rad
      const len = Math.hypot(tx, ty - 2.78)
      const bar = k.box(g, 0.012, len, 0.016, p.brass, fc + tx / 2, Y + (2.78 + ty) / 2, FZ, false)
      bar.rotation.z = -Math.atan2(tx, ty - 2.78)
    }
  }
  swingLeaf(s, at(g, D0, Y, FZ, 0), 'parfum_l', 0.995, 2.68, p.brass, PI / 2, true)
  swingLeaf(s, at(g, D1, Y, FZ, PI), 'parfum_r', 0.995, 2.68, p.brass, -PI / 2, true)
  box(s, D0, D1, Y, Y + 0.006, FZ - 0.1, FZ + 0.1, p.brass, false)

  /* ---------- the portal: a deep burgundy arch, padded and rounded ---------- */
  {
    const inset = 0.06
    const sec = section(inset)
    const open: [number, number][] = [[R - MID - PORTAL.pier, 0], [R - MID - PORTAL.pier, 2.85]]
    const or = R - MID - PORTAL.pier
    for (let i = 1; i < 32; i++) {
      const a = (i / 32) * PI
      open.push([Math.cos(a) * or, 2.85 + Math.sin(a) * or])
    }
    open.push([L - MID + PORTAL.pier, 2.85], [L - MID + PORTAL.pier, 0])
    // One outline: up the left, over the vault, down the right, back up and over the opening.
    const u = [...sec.slice(0, -1), [R - MID - inset, 0] as [number, number], ...open]
    const geo = new ExtrudeGeometry(shapeOf(u), { depth: PORTAL.z1 - PORTAL.z0 - 2 * inset, bevelEnabled: true, bevelThickness: inset, bevelSize: inset - 0.005, bevelSegments: 6, curveSegments: 24 })
    mesh(g, geo, p.velvet, MID, Y, PORTAL.z0 + inset).name = 'parfum_portal'
  }

  /* ---------- the left niches: shelves and drawers ---------- */
  /** Glass shelves on brass edges in a niche, with a light under each front edge; returns their heights. */
  const shelvesIn = (x0: number, x1: number, z0: number, z1: number, heights: number[]) => {
    for (const h of heights) {
      k.box(g, x1 - x0, 0.012, z1 - z0, p.shelfGlass, (x0 + x1) / 2, Y + h - 0.006, (z0 + z1) / 2, false)
      const front = Math.abs(x1 - x0) < Math.abs(z1 - z0) ? 'x' : 'z'
      if (front === 'x') {
        const fx = x0 < MID ? x1 : x0
        k.box(g, 0.006, 0.02, z1 - z0, p.brass, fx, Y + h - 0.004, (z0 + z1) / 2)
        k.box(g, 0.006, 0.004, z1 - z0 - 0.06, led, fx + (x0 < MID ? -0.012 : 0.012), Y + h - 0.016, (z0 + z1) / 2, false)
      } else {
        k.box(g, x1 - x0, 0.02, 0.006, p.brass, (x0 + x1) / 2, Y + h - 0.004, z1)
        k.box(g, x1 - x0 - 0.06, 0.004, 0.006, led, (x0 + x1) / 2, Y + h - 0.016, z1 - 0.012, false)
      }
    }
  }
  /** Drawers in the wall below a niche: fronts flush with the wall's face, running out towards the room. */
  const drawersBelow = (name: string, face: number, z0: number, z1: number, dir: 1 | -1, mat: Material) => {
    const n = 2
    for (let j = 0; j < n; j++) {
      const dr = new Group()
      dr.name = `drawer_parfum_${name}_${j}`
      dr.userData.label = 'Drawer'
      dr.userData.slide = [0, 0, 0.26]
      dr.position.set(face, Y + 0.12 + j * 0.36 + 0.17, (z0 + z1) / 2)
      dr.rotation.y = dir > 0 ? PI / 2 : -PI / 2
      g.add(dr)
      const front = k.soft(dr, z1 - z0 - 0.02, 0.33, 0.022, 0.006, mat, 0, 0, 0.011)
      front.userData.front = true
      k.box(dr, (z1 - z0) * 0.35, 0.012, 0.014, p.brass, 0, 0.13, 0.026)
      const inner = new Group()
      inner.name = 'contents'
      dr.add(inner)
      k.box(inner, z1 - z0 - 0.06, 0.01, 0.24, p.creamLacquer, 0, -0.15, -0.12)
      for (let q = 0; q < 6; q++) k.box(inner, 0.07, 0.11, 0.05, p.board(['#f3dde2', '#1e1e20', '#e9c47d', '#f5edd3'][(q + j) % 4]), -(z1 - z0) / 2 + 0.09 + (q % 3) * 0.12, -0.09, -0.06 - Math.floor(q / 3) * 0.1, false)
    }
  }
  const SH = [1.22, 1.6, 1.98, 2.36]
  leftNiches.forEach(([a, b], i) => {
    const z0 = -b
    const z1 = -a
    shelvesIn(L + 0.025, L + LF, z0 + 0.01, z1 - 0.01, SH.slice(0, 3))
    drawersBelow(`l${i}`, L + LF, z0 + 0.02, z1 - 0.02, 1, p.burgundy)
    // A brass plaque over the niche naming the collection in it.
    const pl = at(g, L + LF + 0.006, Y + nicheSpring + (b - a) / 2 + 0.16, (z0 + z1) / 2, PI / 2)
    k.box(pl, 0.42, 0.075, 0.006, p.brass, 0, 0, 0)
    place(pl, 0.38, 0.05, p.print({ name: ['Pour Elle', 'Pour Lui', 'Pour Tous'][i], line: ['Women', 'Men', 'Unisex'][i], ground: '#c9a463', ink: '#3a2414', w: 304, h: 40 }), p.printMat, 0, 0, 0.004, 0)
    info(s, pl, {
      title: ['Pour Elle · Women\'s Fragrance', 'Pour Lui · Men\'s Fragrance', 'Pour Tous · Unisex Fragrance'][i], kind: 'Display niche',
      body: ['The women\'s collection: Sakura Blanc, Rose Kyoto, Fleur de Nuit and Iris Poudré, in 100 and 50 ml, boxed, in travel sprays and the house body mist.', 'The men\'s collection: Bois Noir, Vétiver Marin and Cuir Velours in 100 and 50 ml, boxed and in travel sprays, with the perfume oils.', 'The shared fragrances: Ambre Soleil, Néroli Riviera and Thé Matcha, and the body mists.'][i],
      specs: ['Lit glass shelves on brass edges', 'Drawers of boxed stock below', 'Every bottle can be tried at the counter'],
    }, 0)
  })

  /* ---------- the counter ---------- */
  /** The counter's plan between radii ra and rb (from its centre), clipped to the right wall's face. */
  const counterPlan = (ra: number, rb: number, z0 = CT.z0, z1 = CT.z1): [number, number][] => {
    const xmax = R - RF - 0.005
    const arc = (r: number, rev: boolean) => {
      const out: [number, number][] = []
      for (let i = 0; i <= 48; i++) {
        const t = rev ? 1 - i / 48 : i / 48
        const z = z0 + (z1 - z0) * t
        const x = CT.cx - Math.sqrt(Math.max(0, r * r - (z - CT.cz) ** 2))
        out.push([Math.min(x, xmax), z])
      }
      return out
    }
    return [...arc(rb, false), ...arc(ra, true)]
  }
  /** A level slab of the counter's plan, from y0 to y1, its edges softly rounded. */
  const counterSlab = (ra: number, rb: number, y0: number, y1: number, mat: Material, round = 0.01, name = '') => {
    const pl = counterPlan(ra, rb)
    const sh = new Shape()
    pl.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)))
    const geo = new ExtrudeGeometry(sh, { depth: Math.max(0.001, y1 - y0 - 2 * round), bevelEnabled: round > 0, bevelThickness: round, bevelSize: round, bevelSegments: 3, curveSegments: 4 })
    geo.rotateX(-PI / 2)
    const o = mesh(g, geo, mat, 0, Y + y0 + round, 0)
    o.name = name
    return o
  }
  counterSlab(CT.ri + 0.05, CT.ro - 0.06, 0.0, 0.06, p.blackMatte, 0)
  counterSlab(CT.ri, CT.ro + 0.08, 0.06, 0.44, p.burgundy, 0.015, 'parfum_counter_plinth')
  counterSlab(CT.ri - 0.02, CT.ro + 0.12, 0.44, 0.485, p.solidWhite, 0.012)
  counterSlab(CT.ri, CT.ro, 0.485, 0.965, p.burgundy, 0.015, 'parfum_counter')
  counterSlab(CT.ri - 0.05, CT.ro + 0.04, 0.965, 1.005, p.solidWhite, 0.012)
  {
    // The line of light at its foot, under the plinth's lip.
    const pl = counterPlan(CT.ro + 0.03, CT.ro + 0.035)
    for (let i = 0; i < 48; i++) {
      const [xa, za] = pl[i]
      const [xb, zb] = pl[i + 1]
      const seg = at(g, (xa + xb) / 2, Y + 0.035, (za + zb) / 2, Math.atan2(xb - xa, zb - za))
      k.box(seg, 0.012, 0.012, Math.hypot(xb - xa, zb - za) + 0.002, led, 0, 0, 0, false)
    }
    e.shade.rect(CT.cx - CT.ro - 0.05, Y + 0.012, CT.cz, 0.25, 3.4, 0, 0.12)
  }
  // Drawers on the staff side, in the inner face.
  for (const [i, zz] of [-11.35, -12.3, -13.25].entries()) {
    const x = CT.cx - Math.sqrt(CT.ri * CT.ri - (zz - CT.cz) ** 2)
    const yaw = Math.atan2(CT.cx - x, CT.cz - zz) + 0.0
    const dr = new Group()
    dr.name = `drawer_parfum_counter_${i}`
    dr.userData.label = 'Drawer'
    dr.userData.slide = [0, 0, 0.32]
    dr.position.set(x + 0.004, Y + 0.72, zz)
    dr.rotation.y = yaw
    g.add(dr)
    const front = k.soft(dr, 0.62, 0.2, 0.02, 0.005, p.burgundy, 0, 0, 0.01)
    front.userData.front = true
    k.box(dr, 0.24, 0.012, 0.014, p.brass, 0, 0.06, 0.024)
    const inner = new Group()
    inner.name = 'contents'
    dr.add(inner)
    k.box(inner, 0.58, 0.01, 0.34, p.creamLacquer, 0, -0.09, -0.17)
    for (let q = 0; q < 8; q++) k.box(inner, 0.05, 0.012, 0.11, p.paper, -0.24 + q * 0.065, -0.078, -0.12, false)
  }
  {
    // A brass plate on the counter's face, telling what it is.
    const zz = -12.7
    const x = CT.cx - CT.ro - 0.002
    const pl = at(g, x, Y + 0.78, zz, -PI / 2)
    k.box(pl, 0.3, 0.06, 0.004, p.brass, 0, 0, 0)
    place(pl, 0.27, 0.042, p.print({ name: 'Conseil & Essai', line: 'Advice · testing', ground: '#c9a463', ink: '#3a2414', w: 288, h: 44 }), p.printMat, 0, 0, 0.003, 0)
    info(s, pl, {
      title: 'The Counter', kind: 'Testing, advice and the till',
      body: 'A curved two-tier counter in burgundy lacquer with a white ledge between the tiers and a white solid-surface top, lit along its foot. Try any fragrance from the tester tray on paper blotters or the skin, ask the house\'s advisers for a recommendation, have your purchase gift-wrapped, and pay at the till at its end.',
      specs: ['Burgundy lacquer, white solid surface', 'Testers of the whole collection', 'Complimentary gift wrapping', 'Cards, UPI and wallets at the till'],
    }, 0)
  }
  const TOP = Y + 1.005
  /** A point on the counter's top between the arcs: t across (0 the customer's edge), along its length (0 front). */
  const onTop = (t: number, along: number): [number, number] => {
    const z = CT.z1 + (CT.z0 - CT.z1) * along
    const r = CT.ro - 0.1 - (CT.ro - CT.ri - 0.2) * t
    return [CT.cx - Math.sqrt(Math.max(0, r * r - (z - CT.cz) ** 2)), z]
  }
  const faceCust = (z: number) => -PI / 2 + Math.atan2(z - CT.cz, 3) * 0.6

  /* ---------- on the counter ---------- */
  {
    // The tester tray: a round brass tray of five testers; press one to spray it.
    const [tx, tz] = onTop(0.4, 0.47)
    const tr = at(g, tx, TOP, tz, faceCust(tz))
    lathe(tr, [[0.001, 0], [0.18, 0], [0.185, 0.02], [0.178, 0.02], [0.172, 0.004], [0.001, 0.004]], p.brass, 0, 0, 0, 48)
    const testers = [S.sakura, S.fleur, S.bois, S.ambre, S.oud]
    testers.forEach((c, i) => {
      const a = (i / testers.length) * PI * 2 + 0.25
      const px = Math.cos(a) * 0.11
      const pz = Math.sin(a) * 0.11
      const { g: pf, nozzle } = flacon(s, p, tr, { ...c.bottle, scale: 0.84, print: { ...printOf(c, 'Tester'), line: 'Tester' } }, px, 0.004, pz, a + PI / 2, true)
      const world = new Vector3()
      tr.updateMatrixWorld(true)
      pf.updateMatrixWorld(true)
      pf.localToWorld(world.set(0, nozzle / 0.84, 0.008))
      const local = g.worldToLocal(world.clone())
      const dirW = new Vector3(Math.cos(a), 0.2, Math.sin(a)).applyAxisAngle(new Vector3(0, 1, 0), tr.rotation.y).normalize()
      const spray = mistOn(s, g, local.x, local.y, local.z, dirW)
      const btn = button(pf, `tester${i}`, `${c.name} tester`, 'Spray', 0, nozzle / 0.84, 0, spray, 'parfum')
      btn.add(new Mesh(new SphereGeometry(0.03, 8, 6), HIT))
    })
    info(s, tr.children[0], { title: 'Tester Tray', kind: 'Testers', body: 'Testers of the house\'s fragrances on a brass tray: Sakura Blanc, Fleur de Nuit, Bois Noir, Ambre Soleil and Oud Impérial. Press an atomiser to spray it; try it on a blotter first, then on the wrist, and give it ten minutes to settle before you decide.', specs: ['Fresh blotters in the cup beside it', 'Coffee beans to rest the nose, on request'] }, 0)
  }
  {
    // The blotter cup: a ceramic cup of paper smelling strips fanned out, a stack beside it.
    const [bx, bz] = onTop(0.35, 0.68)
    const cup = at(g, bx, TOP, bz, faceCust(bz))
    lathe(cup, [[0.001, 0], [0.032, 0], [0.036, 0.09], [0.033, 0.09], [0.03, 0.006], [0.001, 0.006]], p.ceramic, 0, 0, 0, 28)
    const r = rng(77)
    for (let i = 0; i < 14; i++) {
      const strip = k.box(cup, 0.008, 0.15, 0.0006, p.paper, (r() - 0.5) * 0.03, 0.12, (r() - 0.5) * 0.03, false)
      strip.rotation.set((r() - 0.5) * 0.35, r() * PI, (r() - 0.5) * 0.35)
    }
    for (let i = 0; i < 6; i++) k.box(cup, 0.012, 0.0008, 0.13, p.paper, 0.08, 0.0005 + i * 0.0009, 0.0, false)
    product(cup, { title: 'Blotters', kind: 'Smelling strips', body: 'Paper smelling strips to try a fragrance on before the skin: spray once, wave it, smell it after a few seconds and again in a few minutes as the heart opens. Write the name on its end and take it with you.', specs: ['Unscented absorbent card', 'Take as many as you like'] })
  }
  {
    // Blossom in a white vase, as the reference shows it on the counter.
    const [vx, vz] = onTop(0.45, 0.2)
    const v = at(g, vx, TOP, vz, 0)
    lathe(v, [[0.001, 0], [0.06, 0], [0.075, 0.08], [0.05, 0.17], [0.036, 0.2], [0.04, 0.215], [0.001, 0.2]], p.ceramic, 0, 0, 0, 32)
    const r = rng(31)
    const cards: number[] = []
    const cols: number[] = []
    for (let i = 0; i < 9; i++) {
      const a = r() * PI * 2
      const lean = 0.2 + r() * 0.35
      const h = 0.28 + r() * 0.2
      const tip = new Vector3(Math.cos(a) * lean * h, 0.2 + h, Math.sin(a) * lean * h)
      const stem = new TubeGeometry(new CatmullRomCurve3([new Vector3(0, 0.15, 0), new Vector3(tip.x * 0.5, 0.2 + h * 0.6, tip.z * 0.5), tip]), 6, 0.003, 4)
      mesh(v, stem, p.bark, 0, 0, 0, false)
      for (let c = 0; c < 3; c++) {
        const cpos = new Vector3().lerpVectors(new Vector3(0, 0.2, 0), tip, 0.55 + c * 0.2)
        cards.push(...quadAt(cpos, 0.08 + r() * 0.05, r))
        const tone = 0.9 + r() * 0.15
        for (let q = 0; q < 6; q++) cols.push(tone, tone, tone)
      }
    }
    v.add(cardsMesh(cards, cols, p.blossomPink, true))
    product(v, { title: 'Cherry Blossom', kind: 'Decor', body: 'Silk cherry blossom in a white porcelain vase, as on the tree overhead: the house\'s flower, after which it is named.', specs: ['Not for sale'] })
  }
  /** Featured bottles on white risers: tap one and it lifts and turns to be looked at. */
  {
    const [rx, rz] = onTop(0.45, 0.88)
    const riser = at(g, rx, TOP, rz, faceCust(rz))
    k.soft(riser, 0.42, 0.06, 0.2, 0.01, p.solidWhite, 0, 0.03, 0)
    k.soft(riser, 0.22, 0.12, 0.16, 0.01, p.solidWhite, 0.07, 0.06, -0.01)
    const feature: [Scent, number, number, number][] = [[S.sakura, -0.12, 0.06, 0.02], [S.rose, 0.0, 0.06, 0.05], [S.bois, 0.08, 0.12, -0.02], [S.vetiver, 0.17, 0.06, 0.04]]
    feature.forEach(([c, x, y, z], i) => {
      const lg = live(riser, `feature${i}`, 'parfum')
      lg.position.set(x, y, z)
      const { g: b } = flacon(s, p, lg, { ...c.bottle, print: printOf(c, '100 ml') }, 0, 0, 0, 0)
      void b
      const hit = info(s, lg, { ...bottleCard(c, 100), body: `${bottleCard(c, 100).body} Featured: tap it again to turn it in the light.` }, 0.004)
      if (hit) {
        const base = lg.position.y
        hit.userData.onTap = () =>
          play({
            dur: 3.2,
            step: (t) => {
              const lift = Math.sin(Math.min(1, t * 1.25) * PI) * 0.08
              lg.position.y = base + lift
              lg.rotation.y = 2 * PI * (t < 0.1 ? 0 : t > 0.9 ? 1 : (t - 0.1) / 0.8) ** 1.2
            },
            done: () => {
              lg.position.y = base
              lg.rotation.y = 0
            },
          }, lg)
      }
    })
  }
  {
    // The discovery set, its lid hinged; a gift set beside it.
    const [dx, dz] = onTop(0.5, 1.0)
    const { tray: db } = discoveryBox(s, p, g, 'discovery', dx, TOP, dz + 0.05, faceCust(dz), [S.sakura, S.rose, S.fleur, S.iris, S.bois, S.vetiver, S.ambre, S.oud].map((c) => c.bottle.juice), { name: 'La Découverte', line: '8 × 2 ml', ground: '#1d1b1b', ink: '#e7c98a', foil: '#d2b16f' })
    product(db, { title: 'La Découverte · Discovery Set', kind: 'Discovery set · 8 × 2 ml', body: 'Eight of the house\'s fragrances in 2 ml sprays, to live with for a few days before choosing a full bottle: Sakura Blanc, Rose Kyoto, Fleur de Nuit, Iris Poudré, Bois Noir, Vétiver Marin, Ambre Soleil and Oud Impérial. Its price comes off a 100 ml bottle within a month. Tap the lid to open it.', specs: [`${rupees(3950)}`, 'A voucher for its price inside'] })
  }
  {
    // The till at the front end: a screen on a brass stand, the card machine beside it.
    const [tx, tz] = onTop(0.55, 0.05)
    const till = at(g, tx, TOP, tz, -PI / 2 - 0.9)
    k.cyl(till, 0.07, 0.08, 0.012, p.brass, 0, 0.006, 0, 32)
    k.cyl(till, 0.012, 0.012, 0.2, p.brass, 0, 0.11, 0, 12)
    const head = at(till, 0, 0.27, 0, 0)
    head.rotation.x = -0.25
    k.soft(head, 0.3, 0.2, 0.014, 0.006, p.blackGloss, 0, 0, 0)
    const screens = ['WELCOME', 'SAKURA BLANC · EDP 100 ML', 'GIFT WRAP · COMPLIMENTARY', 'TOTAL ₹ 12,500 · TAP OR SCAN', 'PAID · THANK YOU'].map((line, i) => {
      const t = p.canvas(384, 256, (cx, w, h) => {
        cx.fillStyle = '#fbf5f3'
        cx.fillRect(0, 0, w, h)
        cx.fillStyle = '#6f1d29'
        cx.fillRect(0, 0, w, 44)
        cx.fillStyle = '#ffffff'
        cx.font = '600 20px "Inter", Arial, sans-serif'
        cx.fillText(MAISON, 18, 29)
        cx.fillStyle = '#3a2414'
        cx.font = '500 30px "Cormorant Garamond", Georgia, serif'
        cx.textAlign = 'center'
        cx.fillText(line, w / 2, h * 0.55, w - 30)
        cx.font = '400 16px "Inter", Arial, sans-serif'
        cx.fillText(i === 4 ? 'Your receipt is on its way by SMS' : 'Tap the screen to continue', w / 2, h * 0.82)
      })
      const mt = new MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.3 })
      mt.userData.interior = true
      return mt
    })
    let at0 = 0
    const btn = button(head, 'till', 'Till', 'Ring up a sale', 0, 0, 0.008, () => {
      at0 = (at0 + 1) % screens.length
      scr.material = screens[at0]
    }, 'parfum')
    const scr = mesh(btn, new CircleGeometry(1, 4), screens[0], 0, 0, 0, false)
    scr.rotation.z = PI / 4
    scr.scale.set(0.28 / Math.SQRT2, 0.18 / Math.SQRT2, 1)
    scr.userData.front = true
    const pin = at(g, tx + 0.18, TOP, tz + 0.12, -PI / 2)
    k.soft(pin, 0.075, 0.018, 0.15, 0.008, p.blackMatte, 0, 0.009, 0)
    k.box(pin, 0.055, 0.001, 0.05, p.blackGloss, 0, 0.0185, -0.035, false)
    info(s, pin, { title: 'Card Machine', kind: 'Payments', body: 'Tap a card or phone, insert a card, or scan the UPI code on the till\'s screen.', specs: ['Contactless, chip and PIN', 'UPI, wallets'] }, 0)
  }

  /* ---------- the shelves: the left niches by collection ---------- */
  {
    const xC = L + LF / 2 + 0.02
    const yaw = PI / 2
    const rows: Record<number, ((z: number, y: number) => void)[][]> = {
      0: [
        [(z, y) => bottle(g, S.sakura, 100, xC, y, z, yaw), (z, y) => boxed(g, S.sakura, xC - 0.02, y, z, yaw), (z, y) => bottle(g, S.sakura, 50, xC, y, z, yaw), (z, y) => travel(g, S.sakura, xC + 0.03, y, z, yaw, 'roseGold'), (z, y) => mist(g, S.sakura, xC, y, z, yaw)],
        [(z, y) => bottle(g, S.rose, 100, xC, y, z, yaw), (z, y) => boxed(g, S.rose, xC - 0.02, y, z, yaw), (z, y) => bottle(g, S.rose, 50, xC, y, z, yaw), (z, y) => travel(g, S.rose, xC + 0.03, y, z, yaw, 'roseGold')],
        [(z, y) => bottle(g, S.fleur, 100, xC, y, z, yaw), (z, y) => boxed(g, S.fleur, xC - 0.02, y, z, yaw), (z, y) => bottle(g, S.fleur, 50, xC, y, z, yaw), (z, y) => bottle(g, S.iris, 100, xC, y, z, yaw), (z, y) => boxed(g, S.iris, xC - 0.02, y, z, yaw, true)],
        [(z, y) => boxed(g, S.rose, xC - 0.02, y, z, yaw, true), (z, y) => bottle(g, S.iris, 50, xC, y, z, yaw), (z, y) => travel(g, S.iris, xC + 0.03, y, z, yaw, 'silver'), (z, y) => travel(g, S.fleur, xC + 0.03, y, z, yaw), (z, y) => boxed(g, S.fleur, xC - 0.02, y, z, yaw, true)],
      ],
      1: [
        [(z, y) => bottle(g, S.bois, 100, xC, y, z, yaw), (z, y) => boxed(g, S.bois, xC - 0.02, y, z, yaw), (z, y) => bottle(g, S.bois, 50, xC, y, z, yaw), (z, y) => travel(g, S.bois, xC + 0.03, y, z, yaw, 'silver')],
        [(z, y) => bottle(g, S.vetiver, 100, xC, y, z, yaw), (z, y) => boxed(g, S.vetiver, xC - 0.02, y, z, yaw), (z, y) => bottle(g, S.vetiver, 50, xC, y, z, yaw), (z, y) => travel(g, S.vetiver, xC + 0.03, y, z, yaw, 'silver')],
        [(z, y) => bottle(g, S.cuir, 100, xC, y, z, yaw), (z, y) => boxed(g, S.cuir, xC - 0.02, y, z, yaw), (z, y) => oil(g, S.cuir, xC + 0.02, y, z, yaw), (z, y) => oil(g, S.bois, xC + 0.02, y, z, yaw), (z, y) => oil(g, S.oud, xC + 0.02, y, z, yaw)],
        [(z, y) => boxed(g, S.cuir, xC - 0.02, y, z, yaw, true), (z, y) => bottle(g, S.cuir, 50, xC, y, z, yaw), (z, y) => travel(g, S.cuir, xC + 0.03, y, z, yaw), (z, y) => bottle(g, S.vetiver, 50, xC, y, z, yaw), (z, y) => boxed(g, S.vetiver, xC - 0.02, y, z, yaw, true)],
      ],
      2: [
        [(z, y) => bottle(g, S.ambre, 100, xC, y, z, yaw), (z, y) => boxed(g, S.ambre, xC - 0.02, y, z, yaw), (z, y) => bottle(g, S.ambre, 50, xC, y, z, yaw), (z, y) => travel(g, S.ambre, xC + 0.03, y, z, yaw)],
        [(z, y) => bottle(g, S.neroli, 100, xC, y, z, yaw), (z, y) => boxed(g, S.neroli, xC - 0.02, y, z, yaw), (z, y) => bottle(g, S.matcha, 100, xC, y, z, yaw), (z, y) => boxed(g, S.matcha, xC - 0.02, y, z, yaw)],
        [(z, y) => mist(g, S.neroli, xC, y, z, yaw), (z, y) => mist(g, S.musc, xC, y, z, yaw), (z, y) => mist(g, S.rose, xC, y, z, yaw), (z, y) => oil(g, S.ambre, xC + 0.02, y, z, yaw)],
        [(z, y) => bottle(g, S.neroli, 50, xC, y, z, yaw), (z, y) => travel(g, S.neroli, xC + 0.03, y, z, yaw, 'silver'), (z, y) => bottle(g, S.matcha, 50, xC, y, z, yaw), (z, y) => travel(g, S.matcha, xC + 0.03, y, z, yaw), (z, y) => boxed(g, S.ambre, xC - 0.02, y, z, yaw, true)],
      ],
    }
    leftNiches.forEach(([a, b], i) => {
      const z0 = -b + 0.12
      const z1 = -a - 0.12
      ;[nicheFoot, SH[0], SH[1], SH[2]].forEach((h, row) => {
        const items = rows[i][row]
        items.forEach((place2, j) => place2(z1 + ((z0 - z1) * (j + 0.5)) / items.length, Y + h + 0.0))
      })
    })
  }

  /* ---------- the right niches: gift sets and boxed fragrance ---------- */
  {
    const xC = R - RF / 2 - 0.02
    const yaw = -PI / 2
    const ribbonGold = p.board('#c9a463', 0.35)
    const ribbonBlack = p.board('#1b1a1a', 0.4)
    const rows: ((z: number, y: number) => void)[][] = [
      [(z, y) => product(giftSet(s, p, g, xC, y, z, yaw, 0.26, 0.11, 0.18, '#f3dde2', ribbonGold, { name: 'Sakura Blanc Coffret', line: 'EDP 100 ml · Mist · 10 ml', ground: '#fbf1f2', ink: '#8b3a52', foil: '#c98e86' }), { title: 'Sakura Blanc · Gift Set', kind: 'Gift set', body: 'Sakura Blanc eau de parfum 100 ml, its body mist 250 ml and a 10 ml travel spray in a blush coffret tied with gold satin. Save 15% on the three. ₹ 15,950.', specs: ['Three pieces', 'Gift message card inside'] }), (z, y) => product(giftSet(s, p, g, xC, y, z, yaw, 0.24, 0.1, 0.17, '#1e1e20', ribbonGold, { name: 'Bois Noir Coffret', line: 'EDP 100 ml · Travel 10 ml', ground: '#1e1e20', ink: '#d9d4cc', foil: '#8d8f93' }), { title: 'Bois Noir · Gift Set', kind: 'Gift set', body: 'Bois Noir eau de parfum 100 ml with a 10 ml gunmetal travel spray, in a black coffret. ₹ 13,450.', specs: ['Two pieces', 'Engraving of the travel case on request'] })],
      [(z, y) => boxed(g, S.oud, xC, y, z, yaw), (z, y) => boxed(g, S.musc, xC, y, z, yaw), (z, y) => product(giftSet(s, p, g, xC, y, z, yaw, 0.2, 0.09, 0.14, '#2c1b29', ribbonBlack, { name: 'Trio de Nuit', line: '3 × 10 ml', ground: '#2c1b29', ink: '#e8cfa0', foil: '#d2b16f' }), { title: 'Trio de Nuit · Travel Set', kind: 'Travel set · 3 × 10 ml', body: 'Fleur de Nuit, Rose Kyoto and Oud Impérial in three refillable 10 ml travel sprays. ₹ 9,450.', specs: ['Three refillable cases'] })],
    ]
    const stock = [[S.sakura, S.rose, S.iris], [S.bois, S.cuir, S.vetiver], [S.ambre, S.neroli, S.matcha], [S.fleur, S.oud, S.musc]]
    rightNiches.forEach(([a, b], i) => {
      const z0 = -b
      const z1 = -a
      shelvesIn(R - RF, R - 0.025, z0 + 0.01, z1 - 0.01, [SH[0], SH[1], SH[2]])
      drawersBelow(`r${i}`, R - RF, z0 + 0.02, z1 - 0.02, -1, p.creamLacquer)
      const items0 = rows[i]
      items0.forEach((f, j) => f(z1 - 0.15 + ((z0 - z1 + 0.3) * (j + 0.5)) / items0.length, Y + nicheFoot))
      // The top shelf: travel sprays and perfume oils.
      ;(i ? [S.bois, S.vetiver, S.cuir, S.oud] : [S.sakura, S.rose, S.fleur, S.iris]).forEach((c, j) => {
        const z = z1 - 0.15 + ((z0 - z1 + 0.3) * (j + 0.5)) / 4
        if (j % 2) oil(g, c, xC, Y + SH[2], z, yaw)
        else travel(g, c, xC, Y + SH[2], z, yaw, i ? 'silver' : 'roseGold')
      })
      // Two shelves of boxed fragrance, three to a shelf, and the bottles to go with them.
      ;[SH[0], SH[1]].forEach((h, row) => {
        const set = stock[i * 2 + row]
        set.forEach((c, j) => {
          const z = z1 - 0.2 + ((z0 - z1 + 0.4) * (j + 0.5)) / set.length
          boxed(g, c, xC + 0.03, Y + h, z - 0.06, yaw)
          bottle(g, c, 50, xC - 0.04, Y + h, z + 0.08, yaw)
        })
      })
    })
  }

  /* ---------- the back: the prestige cabinet and the narrow niches ---------- */
  {
    const face = BACK + BF
    const cx = MID
    const w = CAB.u1 - CAB.u0
    // Below: drawers in cream lacquer; above, the glazed cabinet with three glass shelves.
    for (let j = 0; j < 2; j++) {
      const dr = new Group()
      dr.name = `drawer_parfum_cabinet_${j}`
      dr.userData.label = 'Drawer'
      dr.userData.slide = [0, 0, 0.34]
      dr.position.set(cx, Y + 0.25 + j * 0.42, face)
      g.add(dr)
      const front = k.soft(dr, w - 0.04, 0.4, 0.022, 0.006, p.creamLacquer, 0, 0, 0.011)
      front.userData.front = true
      k.box(dr, w * 0.3, 0.012, 0.014, p.brass, 0, 0.16, 0.026)
      const inner = new Group()
      inner.name = 'contents'
      dr.add(inner)
      k.box(inner, w - 0.1, 0.01, 0.36, p.creamLacquer, 0, -0.18, -0.18)
      for (let q = 0; q < 4; q++) k.box(inner, 0.11, 0.17, 0.1, p.board(q % 2 ? '#2b1a12' : '#eef1f6'), -0.3 + q * 0.2, -0.09, -0.15, false)
    }
    k.box(g, w, 0.02, BF - 0.03, p.solidWhite, cx, Y + 0.94, BACK + 0.02 + (BF - 0.03) / 2)
    const cabH = [1.32, 1.72, 2.12]
    shelvesIn(cx - w / 2 + 0.01, cx + w / 2 - 0.01, BACK + 0.03, face - 0.06, cabH)
    // The glass doors, hinged at the sides, shut until tapped.
    for (const side of [-1, 1] as const) {
      const hinge = at(g, cx + side * (w / 2 - 0.01), Y + 0.95, face - 0.02, side < 0 ? 0 : PI)
      const leaf = new Group()
      leaf.name = `door_parfum_cabinet_${side < 0 ? 'l' : 'r'}`
      leaf.userData.label = 'Cabinet door'
      leaf.userData.openAngle = side < 0 ? -1.9 : 1.9
      hinge.add(leaf)
      const lw = w / 2 - 0.015
      const lh = 1.6
      const glassLeaf = k.box(leaf, lw - 0.03, lh - 0.03, 0.006, p.cabinetGlass, lw / 2, lh / 2, 0, false)
      glassLeaf.userData.front = true
      for (const [bw2, bh2, x2, y2] of [[0.015, lh, 0.0075, lh / 2], [0.015, lh, lw - 0.0075, lh / 2], [lw, 0.015, lw / 2, 0.0075], [lw, 0.015, lw / 2, lh - 0.0075]]) k.box(leaf, bw2, bh2, 0.018, p.brass, x2, y2, 0)
      k.cyl(leaf, 0.008, 0.008, 0.18, p.brass, lw - 0.05, 0.8, 0.02, 10)
    }
    // Inside: the prestige extraits, the private collection.
    const yaw = 0
    const zc = BACK + 0.22
    const rows: (() => void)[] = [
      () => {
        bottle(g, S.oud, 100, cx - 0.4, Y + 0.95 + 0.01, zc, yaw)
        boxed(g, S.oud, cx - 0.15, Y + 0.96, zc - 0.03, yaw)
        bottle(g, S.musc, 100, cx + 0.15, Y + 0.96, zc, yaw)
        boxed(g, S.musc, cx + 0.4, Y + 0.96, zc - 0.03, yaw)
      },
      () => {
        bottle(g, S.oud, 50, cx - 0.42, Y + cabH[0], zc, yaw)
        bottle(g, S.musc, 50, cx - 0.2, Y + cabH[0], zc, yaw)
        product(giftSet(s, p, g, cx + 0.2, Y + cabH[0], zc - 0.02, yaw, 0.3, 0.12, 0.2, '#2b1a12', p.board('#c9a463', 0.35), { name: 'Collection Privée', line: 'Oud · Musc · 2 × 100 ml', ground: '#2b1a12', ink: '#e7c98a', foil: '#d2b16f' }), { title: 'Collection Privée', kind: 'Prestige coffret', body: 'Oud Impérial and Musc Céleste extraits de parfum, 100 ml each, in a lacquered walnut-brown coffret with a gold satin bow. Numbered; by appointment. ₹ 49,500.', specs: ['Two extraits de parfum', 'Numbered edition of 300'] })
      },
      () => {
        for (const [i, c] of [S.oud, S.musc, S.fleur, S.bois].entries()) oil(g, c, cx - 0.36 + i * 0.24, Y + cabH[1], zc, yaw)
      },
      () => {
        for (const [i, c] of [S.oud, S.sakura, S.musc].entries()) travel(g, c, cx - 0.3 + i * 0.3, Y + cabH[2], zc, yaw, i === 1 ? 'roseGold' : 'gold')
      },
    ]
    rows.forEach((r) => r())
    // The house's mark in the arch over the cabinet: a brass ring round a lit plate.
    const mark = at(g, cx, Y + CAB.spring + 0.32, face + 0.005, 0)
    mesh(mark, new TorusGeometry(0.24, 0.012, 8, 64), p.brass, 0, 0, 0)
    place(mark, 0.42, 0.42, p.print({ name: 'Maison Sakura', line: 'Parfumerie · 2026', ground: '#f6e7e4', ink: '#6f1d29', foil: '#c9a463', box: true, w: 256, h: 256 }), p.printMat, 0, 0, 0.002, 0)
    info(s, mark, { title: 'The Prestige Cabinet', kind: 'Glazed display cabinet', body: 'The house\'s extraits de parfum and its private collection behind glass: Oud Impérial and Musc Céleste in cut-crystal-stoppered decanters, their perfume oils and travel sprays. Tap a door to open it; the drawers below hold boxed stock.', specs: ['Brass-framed glass doors on pivot hinges', 'Lit glass shelves', 'Drawers below'] }, 0)
    // The narrow niches either side: tall bottles and body mists.
    SIDE.forEach(([a, b], i) => {
      const x0 = MID + a
      const x1 = MID + b
      shelvesIn(x0 + 0.01, x1 - 0.01, BACK + 0.03, face, [SH[0], SH[1], SH[2]])
      const c1 = i ? S.musc : S.sakura
      const c2 = i ? S.matcha : S.iris
      const xm = (x0 + x1) / 2
      mist(g, c1, xm, Y + nicheFoot, BACK + 0.24, 0)
      bottle(g, c1, 100, xm, Y + SH[0], BACK + 0.24, 0)
      bottle(g, c2, 50, xm - 0.1, Y + SH[1], BACK + 0.24, 0)
      travel(g, c2, xm + 0.1, Y + SH[1], BACK + 0.24, 0)
      boxed(g, c1, xm, Y + SH[2], BACK + 0.22, 0, true)
    })
  }

  /* ---------- the blossom tree ---------- */
  buildTree(s, p, g, Y, led)

  /* ---------- lighting and its switches ---------- */
  lamp(s, MID, Y + 3.3, -10.9, 8, 7)
  lamp(s, MID - 0.3, Y + 3.5, -13.2, 9, 8)
  lamp(s, MID, Y + 3.3, -15.4, 8, 7)
  // Small recessed spots high in the vault, aimed at the counter and the cabinet.
  for (const [x, z] of [[MID + 0.5, -11.4], [MID + 0.5, -13.0], [MID, -15.2], [MID - 0.6, -12.2]] as const) {
    const yy = Y + vaultY(x) - 0.01
    const d = mesh(g, new CircleGeometry(0.035, 20), spot, x, yy, z, false)
    d.rotation.x = PI / 2
    mesh(g, new TorusGeometry(0.04, 0.006, 6, 24), p.brass, x, yy, z, false).rotation.x = PI / 2
  }
  {
    const sw = new Group()
    sw.position.set(R - RF - 0.001, Y + 1.2, -9.95)
    sw.rotation.y = -PI / 2
    g.add(sw)
    const plate = switchPlate(k, sw, 'parfum', ['switch', 'switch'], { plate: lux.brass, rocker: lux.brass, dark: p.blackMatte, locator: lux.ledCool as MeshStandardMaterial }, [s.circuit, display])
    plate.traverse((o) => {
      if (o.name === 'switch_parfum_0') o.userData.label = 'Parfumerie lights'
      if (o.name === 'switch_parfum_1') o.userData.label = 'Display, cove & tree lighting'
    })
    setCircuit(s.circuit, true)
    setCircuit(display, true)
  }
  return s
}

/* ---------- blossom cards ---------- */

/** The hit volume of a small control (a tester's atomiser): unseen, but tappable. */
const HIT = new MeshBasicMaterial({ visible: false })

/** Three crossed quads about a point, `size` across, turned at random: one cluster of blossom. */
function quadAt(c: Vector3, size: number, r: () => number) {
  const out: number[] = []
  for (let q = 0; q < 2; q++) {
    const a = r() * PI
    const tilt = (r() - 0.5) * 1.2
    const ax = new Vector3(Math.cos(a), tilt * 0.4, Math.sin(a)).normalize().multiplyScalar(size / 2)
    const up = new Vector3(-Math.sin(a) * tilt, 1, Math.cos(a) * tilt).normalize().multiplyScalar(size / 2)
    const p0 = c.clone().sub(ax).sub(up)
    const p1 = c.clone().add(ax).sub(up)
    const p2 = c.clone().add(ax).add(up)
    const p3 = c.clone().sub(ax).add(up)
    out.push(...p0.toArray(), ...p1.toArray(), ...p2.toArray(), ...p0.toArray(), ...p2.toArray(), ...p3.toArray())
  }
  // And one lying nearly flat, so the head reads from below.
  const a = r() * PI
  const ax = new Vector3(Math.cos(a), 0.15, Math.sin(a)).normalize().multiplyScalar(size / 2)
  const bx = new Vector3(-Math.sin(a), -0.1, Math.cos(a)).normalize().multiplyScalar(size / 2)
  const f = [c.clone().sub(ax).sub(bx), c.clone().add(ax).sub(bx), c.clone().add(ax).add(bx), c.clone().sub(ax).add(bx)]
  out.push(...f[0].toArray(), ...f[1].toArray(), ...f[2].toArray(), ...f[0].toArray(), ...f[2].toArray(), ...f[3].toArray())
  return out
}

/** One mesh of blossom cards: positions as quadAt gives them, a tone per vertex. */
function cardsMesh(pos: number[], cols: number[], mat: Material, up = false) {
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  const n = pos.length / 3
  const uv: number[] = []
  for (let i = 0; i < n / 6; i++) uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1)
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  const c = cols.length === n * 3 ? cols : Array.from({ length: n * 3 }, () => 1)
  geo.setAttribute('color', new Float32BufferAttribute(c, 3))
  geo.computeVertexNormals()
  // Lit as if facing down and out, so both faces of every card read alike.
  const nor = geo.getAttribute('normal')
  for (let i = 0; i < nor.count; i++) if (up) nor.setXYZ(i, 0, 0.8, 0.6)
    else nor.setXYZ(i, 0, -0.6, 0.8)
  const m = new Mesh(geo, mat)
  m.castShadow = true
  // Not shaded by its own cards: real petals pass light, and the heads would go black.
  m.receiveShadow = false
  return m
}

/**
 * The cherry tree: a trunk rising from its round planter by the door, leaning in, dividing into
 * limbs that spread under the vault over the front half of the room, the blossom thick along the
 * outer branches and hanging in sprays, mostly pink, some pale, a little blue as in the reference;
 * uplights in the planter.
 */
function buildTree(s: Shop, p: PerfumeMaterials, g: Group, Y: number, led: Material) {
  const { k } = s.e
  const r = rng(4242)
  // The planter: blush plaster with a brass rim, moss over the soil.
  k.cyl(g, TREE.r, TREE.r + 0.02, 0.42, p.blushPlaster, TREE.x, Y + 0.21, TREE.z, 40)
  mesh(g, new TorusGeometry(TREE.r, 0.012, 8, 48), p.brass, TREE.x, Y + 0.42, TREE.z).rotation.x = PI / 2
  k.cyl(g, TREE.r - 0.01, TREE.r - 0.01, 0.01, p.soil, TREE.x, Y + 0.41, TREE.z, 32).castShadow = false
  for (const a of [0.6, 2.4, 4.2]) {
    const ux = TREE.x + Math.cos(a) * 0.2
    const uz = TREE.z + Math.sin(a) * 0.2
    k.cyl(g, 0.025, 0.03, 0.04, p.brass, ux, Y + 0.43, uz, 16)
    k.cyl(g, 0.02, 0.02, 0.004, led, ux, Y + 0.452, uz, 16).castShadow = false
  }
  const trunkGroup = new Group()
  trunkGroup.name = 'parfum_tree'
  g.add(trunkGroup)
  const limbs: { pts: Vector3[]; r0: number; r1: number; gnarl: number }[] = []
  const P = (x: number, y: number, z: number) => new Vector3(x, Y + y, z)
  const jit = (v: Vector3, a: number) => v.clone().add(new Vector3((r() - 0.5) * a, (r() - 0.5) * a * 0.5, (r() - 0.5) * a))
  // The trunk: leaning in from the planter with a twist, thickening at its foot.
  limbs.push({ pts: [P(TREE.x, 0.38, TREE.z), P(4.78, 0.9, -10.4), P(4.86, 1.6, -10.5), P(4.93, 2.2, -10.68), P(5.08, 2.65, -10.85), P(5.22, 2.95, -11.05)], r0: 0.085, r1: 0.05, gnarl: 0.16 })
  const fork = P(5.22, 2.95, -11.05)
  const mains: Vector3[][] = [
    [fork, P(5.12, 3.3, -11.55), P(5.1, 3.6, -12.2), P(5.22, 3.82, -12.95), P(5.45, 3.92, -13.75)],
    [fork, P(5.62, 3.2, -10.95), P(6.15, 3.45, -10.75), P(6.65, 3.6, -10.45), P(7.05, 3.5, -10.05)],
    [fork, P(5.6, 3.35, -11.45), P(6.05, 3.62, -11.95), P(6.5, 3.8, -12.45), P(6.85, 3.72, -13.05)],
    [fork, P(5.0, 3.25, -10.75), P(4.82, 3.55, -10.35), P(4.72, 3.8, -9.95), P(4.82, 3.95, -9.62)],
  ].map((m) => m.map((q, i) => (i ? jit(q, 0.12) : q)))
  for (const m of mains) limbs.push({ pts: m, r0: 0.045, r1: 0.016, gnarl: 0.1 })
  // Branches off the limbs, twigs off those, and finer twigs again.
  const tips: Vector3[] = []
  const along: Vector3[] = []
  const vaultAt = (x: number) => Y + vaultY(x) - 0.14
  const clampIn = (v: Vector3) => {
    v.y = Math.min(v.y, vaultAt(v.x))
    v.x = Math.min(Math.max(v.x, L + LF + 0.18), R - RF - 0.18)
    v.z = Math.min(Math.max(v.z, BACK + 2.6), FZ - 0.6)
    return v
  }
  const grow = (from: Vector3, dir: Vector3, len: number, rad: number, depth: number) => {
    const bend = new Vector3((r() - 0.5) * 0.35, (r() - 0.45) * 0.25, (r() - 0.5) * 0.35)
    const m1 = clampIn(from.clone().addScaledVector(dir, len * 0.35).addScaledVector(bend, len * 0.3))
    const m2 = clampIn(from.clone().addScaledVector(dir, len * 0.7).addScaledVector(bend, len * 0.45))
    const end = clampIn(from.clone().addScaledVector(dir, len).addScaledVector(bend, len * 0.35))
    limbs.push({ pts: [from, m1, m2, end], r0: rad, r1: rad * 0.4, gnarl: 0.05 })
    tips.push(end)
    along.push(m1, m2)
    if (depth > 0) {
      const n = 2 + Math.floor(r() * 2)
      for (let i = 0; i < n; i++) {
        const d = dir.clone().add(new Vector3((r() - 0.5) * 1.4, (r() - 0.55) * 0.7, (r() - 0.5) * 1.4)).normalize()
        const start = new Vector3().lerpVectors(from, end, 0.45 + r() * 0.5)
        grow(start, d, len * (0.5 + r() * 0.2), rad * 0.55, depth - 1)
      }
    }
  }
  for (const m of mains) {
    for (let i = 1; i < m.length; i++) {
      const dir = m[i].clone().sub(m[i - 1]).normalize()
      const n = i === m.length - 1 ? 3 : 1 + Math.floor(r() * 2)
      for (let b = 0; b < n; b++) {
        const d = dir.clone().add(new Vector3((r() - 0.5) * 1.5, (r() - 0.4) * 0.6, (r() - 0.5) * 1.5)).normalize()
        grow(m[i], d, 0.5 + r() * 0.35, 0.016, 2)
      }
    }
  }
  for (const l of limbs) {
    const curve = new CatmullRomCurve3(l.pts)
    const segs = Math.max(6, l.pts.length * 5)
    const radial = l.r0 > 0.03 ? 12 : l.r0 > 0.01 ? 7 : 5
    const geo = new TubeGeometry(curve, segs, 1, radial)
    // Taper from r0 to r1, swelling at the foot, and roughen the trunk's and limbs' section.
    const pos = geo.getAttribute('position')
    for (let i = 0; i <= segs; i++) {
      const t = i / segs
      const c = curve.getPointAt(t)
      const flare = l.gnarl > 0.12 ? 1 + 0.6 * Math.max(0, 1 - t * 6) : 1
      for (let j = 0; j <= radial; j++) {
        const idx = i * (radial + 1) + j
        const a = (j / radial) * PI * 2
        const bump = 1 + l.gnarl * (Math.sin(a * 3 + t * 9) * 0.6 + Math.sin(a * 5 - t * 14) * 0.4)
        const rad = (l.r0 + (l.r1 - l.r0) * Math.pow(t, 0.8)) * flare * bump
        const v = new Vector3().fromBufferAttribute(pos, idx).sub(c).multiplyScalar(rad).add(c)
        pos.setXYZ(idx, v.x, v.y, v.z)
      }
    }
    geo.computeVertexNormals()
    mesh(trunkGroup, geo, l.r0 > 0.03 ? p.bark : p.barkLight, 0, 0, 0, l.r0 > 0.01)
  }
  // The blossom: dense heads at every tip and along the twigs, sprays hanging below some.
  const sets = { pink: { pos: [] as number[], col: [] as number[] }, pale: { pos: [] as number[], col: [] as number[] }, blue: { pos: [] as number[], col: [] as number[] } }
  const cluster = (c: Vector3, size: number) => {
    const pick = r()
    const set = pick < 0.7 ? sets.pink : pick < 0.93 ? sets.pale : sets.blue
    const q = quadAt(c, size, r)
    set.pos.push(...q)
    const tone = 0.86 + r() * 0.22
    for (let i = 0; i < q.length / 3; i++) set.col.push(tone, tone * (0.96 + r() * 0.04), tone)
  }
  const head = (c0: Vector3, n: number, spread: number, s0: number, s1: number) => {
    for (let i = 0; i < n; i++) {
      const c = clampIn(c0.clone().add(new Vector3((r() - 0.5) * spread, (r() - 0.5) * spread * 0.6, (r() - 0.5) * spread)))
      if (c.y < Y + 2.4) c.y = Y + 2.4 + r() * 0.15
      cluster(c, s0 + r() * (s1 - s0))
    }
  }
  for (const t of tips) {
    head(t, 6, 0.32, 0.16, 0.26)
    if (r() < 0.4) {
      const drop = 0.25 + r() * 0.5
      for (let d = 0.08; d < drop; d += 0.09) cluster(t.clone().add(new Vector3((r() - 0.5) * 0.07, -d, (r() - 0.5) * 0.07)).setY(Math.max(Y + 2.35, t.y - d)), 0.12 + r() * 0.08)
    }
  }
  for (const m of along) head(m, 3, 0.22, 0.13, 0.2)
  for (const [mat, set] of [[p.blossomPink, sets.pink], [p.blossomPale, sets.pale], [p.blossomBlue, sets.blue]] as const)
    if (set.pos.length) {
      const m = cardsMesh(set.pos, set.col, mat)
      m.name = 'parfum_blossom'
      g.add(m)
    }
  // The trunk's card, on a tight volume round its lower part only.
  const lower = at(g, TREE.x, Y + 0.42, TREE.z, 0)
  k.box(lower, 0.3, 1.6, 0.3, HIT, 0.1, 0.8, -0.15, false)
  info(s, lower, { title: 'The Cherry Tree', kind: 'Installation', body: 'A cherry tree in full blossom, the house\'s emblem: a sculpted trunk of resin over steel rising from its planter by the door, its branches spreading under the vault, hung with hand-made silk blossom in pinks and a little blue. Its uplights are on the display lighting switch by the door.', specs: ['About 4 m tall, 3.5 m across', 'Silk blossom, flame-retardant', 'Three brass uplights'] }, 0)
}

