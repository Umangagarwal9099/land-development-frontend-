import { CapsuleGeometry, CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, Shape, LatheGeometry, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SphereGeometry, TorusGeometry, Vector2, type Material, type Object3D } from 'three'
import { rng, type Paint } from '../../../textures'
import type { FloorCtx } from '../shell'
import { mesh, PI } from './kit'

/*
 * The pâtisserie's finishes and its goods. The kiosk: mirror-polished stainless (the liquid-metal
 * shell), satin champagne inside its niche, white solid surface, honed grey stone. The goods, made
 * to size: macarons (two shells on their feet, the filling between), éclairs glazed on top,
 * fluted tarts with their fruit, layered cake slices, whole cakes and entremets, croissants,
 * cupcakes, cookies, meringue kisses, glass canisters and cake stands under glass cloches.
 */

/* ---------- painters ---------- */

const crumb: Paint = (g, w, h) => {
  const r = rng(5101)
  g.fillStyle = '#808080'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)'
    const s = 1 + r() * 2.5
    g.fillRect(r() * w, r() * h, s, s)
  }
}
const flake: Paint = (g, w, h) => {
  // Laminated pastry: thin crisp layers, darker where they bake.
  const r = rng(5102)
  g.fillStyle = '#c98a3e'
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 2 + r() * 4) {
    g.fillStyle = `rgba(${r() < 0.5 ? '120,62,18' : '238,188,112'},${0.25 + r() * 0.35})`
    g.fillRect(0, y, w, 1 + r() * 1.5)
  }
}
const honed: Paint = (g, w, h) => {
  const r = rng(5103)
  g.fillStyle = '#b9b7b2'
  g.fillRect(0, 0, w, h)
  g.filter = 'blur(14px)'
  for (let i = 0; i < 40; i++) {
    g.fillStyle = ['#c4c2bd', '#aaa8a3', '#cfcdc8'][i % 3]
    g.globalAlpha = 0.3
    g.beginPath()
    g.ellipse(r() * w, r() * h, 40 + r() * 120, 20 + r() * 60, r() * 3, 0, 7)
    g.fill()
  }
  g.filter = 'none'
  g.globalAlpha = 1
  for (let i = 0; i < 12000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)'
    g.fillRect(r() * w, r() * h, 1.5, 1.5)
  }
}
const boucle: Paint = (g, w, h) => {
  const r = rng(5104)
  g.fillStyle = '#ece6dc'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 5000; i++) {
    const x = r() * w
    const y = r() * h
    g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.55)' : 'rgba(190,175,155,.22)'
    g.lineWidth = 1
    g.beginPath()
    g.arc(x, y, 1.5 + r() * 2, 0, 7)
    g.stroke()
  }
}

/* ---------- materials ---------- */

export function dessertMaterials(e: FloorCtx) {
  const { k, m, lux } = e
  const env = m.env
  const mark = <T extends Material>(x: T) => ((x.userData.interior = true), x)
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.5) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const phys = (p: ConstructorParameters<typeof MeshPhysicalMaterial>[0], reflect = 0.5) => mark(new MeshPhysicalMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const tex = (w: number, h: number, paint: Paint, metres: number) => {
    const t = k.tex.painted(w, h, paint)
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1 / metres, 1 / metres)
    return t
  }
  const crumbBump = tex(256, 256, crumb, 0.05)
  const foods = new Map<string, Material>()
  /** A food surface: sponge and shells matte with a crumb, glazes glossy, creams soft. */
  const food = (kind: 'sponge' | 'shell' | 'glaze' | 'cream' | 'fruit' | 'baked', colour: string) => {
    const key = `${kind}|${colour}`
    let f = foods.get(key)
    if (f) return f
    switch (kind) {
      case 'sponge':
        f = std({ color: colour, roughness: 0.92, bumpMap: crumbBump, bumpScale: 0.8 }, 0.05)
        break
      case 'shell':
        f = phys({ color: colour, roughness: 0.55, sheen: 0.4, sheenColor: '#ffffff', bumpMap: crumbBump, bumpScale: 0.15 }, 0.3)
        break
      case 'glaze':
        f = phys({ color: colour, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08 }, 1.0)
        break
      case 'cream':
        f = phys({ color: colour, roughness: 0.6, sheen: 0.5, sheenColor: '#ffffff' }, 0.15)
        break
      case 'fruit':
        f = phys({ color: colour, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 }, 0.6)
        break
      case 'baked':
        f = std({ color: colour, roughness: 0.6, bumpMap: crumbBump, bumpScale: 0.5 }, 0.2)
        break
    }
    foods.set(key, f!)
    return f!
  }
  return {
    /* the kiosk */
    chrome: phys({ color: '#f4f6f8', metalness: 1, roughness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.04, side: DoubleSide }, 2.4),
    niche: std({ color: '#cdb79a', metalness: 0.55, roughness: 0.34, emissive: '#ffd9a8', emissiveIntensity: 0.16, side: DoubleSide }, 0.6),
    solid: std({ color: '#f5f2ec', roughness: 0.22 }, 0.5),
    stone: std({ map: tex(1024, 1024, honed, 1.6), roughness: 0.55 }, 0.2),
    glass: phys({ color: '#f1f6f5', roughness: 0.02, transparent: true, opacity: 0.12, depthWrite: false, side: DoubleSide }, 1.4),
    jarGlass: phys({ color: '#f4f8f7', roughness: 0.03, transparent: true, opacity: 0.22, depthWrite: false, side: DoubleSide }, 1.4),
    porcelain: std({ color: '#f7f5f0', roughness: 0.18 }, 0.7),
    gold: std({ color: '#d4b47a', metalness: 1, roughness: 0.2 }, 1.1),
    wood: std({ color: '#7b5a3e', roughness: 0.55 }, 0.2),
    paper: std({ color: '#f4efe6', roughness: 0.8 }, 0.05),
    boxPink: std({ color: '#efd3d2', roughness: 0.6 }, 0.1),
    boxMint: std({ color: '#cfe3d8', roughness: 0.6 }, 0.1),
    ribbon: std({ color: '#c8a15f', metalness: 0.4, roughness: 0.35 }, 0.5),
    blackGloss: std({ color: '#121212', roughness: 0.12 }, 0.9),
    blackMatte: std({ color: '#1b1a1a', roughness: 0.6 }, 0.2),
    /* the seating */
    velvet: phys({ color: '#8d8179', roughness: 0.85, sheen: 1, sheenRoughness: 0.4, sheenColor: '#d8cbc0' }, 0.06),
    boucle: phys({ map: tex(512, 512, boucle, 0.25), color: '#fffaf2', roughness: 0.95, sheen: 0.5, sheenRoughness: 0.6, sheenColor: '#fff8ee' }, 0.08),
    marble: lux.statuario,
    steel: phys({ color: '#d9dcdf', metalness: 1, roughness: 0.12 }, 1.3),
    opal: std({ color: '#fff6e6', emissive: '#fff1da', emissiveIntensity: 1.1, roughness: 0.4 }, 0.1),
    /* the goods */
    food,
    pastry: std({ map: tex(256, 256, flake, 0.04), roughness: 0.55, bumpMap: crumbBump, bumpScale: 0.6 }, 0.25),
    std,
  }
}

export type DessertMaterials = ReturnType<typeof dessertMaterials>

/* ---------- the goods (each built at its real size, standing on local y = 0) ---------- */

type M = DessertMaterials

function lathe(p: Object3D, pts: [number, number][], mat: Material, x = 0, y = 0, z = 0, seg = 24) {
  return mesh(p, new LatheGeometry(pts.map(([r, h]) => new Vector2(r, h)), seg), mat, x, y, z, false)
}

/** A macaron, 42 mm across: two domed shells on their ruffled feet, the filling between. */
export function macaron(m: M, p: Object3D, x: number, y: number, z: number, shell: string, filling: string, flat = true) {
  const g = new Group()
  g.position.set(x, y, z)
  if (!flat) g.rotation.x = -PI / 2.6
  p.add(g)
  const s = m.food('shell', shell)
  const dome: [number, number][] = [[0, 0], [0.019, 0], [0.021, 0.002], [0.0205, 0.006], [0.016, 0.0095], [0.008, 0.0115], [0, 0.012]]
  lathe(g, dome.map(([r, h]) => [r, h + 0.0145]), s, 0, 0, 0, 20)
  lathe(g, dome.map(([r, h]) => [r, -h + 0.0105]), s, 0, 0, 0, 20)
  mesh(g, new CylinderGeometry(0.0185, 0.0185, 0.0045, 20), m.food('cream', filling), 0, 0.0125, 0, false)
  mesh(g, new TorusGeometry(0.0195, 0.0016, 4, 20), s, 0, 0.0143, 0, false).rotation.x = PI / 2
  return g
}

/** An éclair, 13 cm long: the choux body, the glaze over its top, a decoration. */
export function eclair(m: M, p: Object3D, x: number, y: number, z: number, yaw: number, glaze: string, deco?: string) {
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = yaw
  p.add(g)
  const body = mesh(g, new CapsuleGeometry(0.0125, 0.105, 6, 14), m.food('baked', '#c7883f'), 0, 0.013, 0, false)
  body.rotation.x = PI / 2
  body.scale.set(1, 1, 0.9)
  const top = mesh(g, new CapsuleGeometry(0.0128, 0.103, 6, 14), m.food('glaze', glaze), 0, 0.0155, 0, false)
  top.rotation.x = PI / 2
  top.scale.set(1.0, 1, 0.55)
  if (deco) for (let i = 0; i < 3; i++) mesh(g, new SphereGeometry(0.004, 8, 6), m.food('fruit', deco), 0, 0.026, -0.035 + i * 0.035, false)
  return g
}

/** A tart, `r` in radius: a fluted pastry case, its filling, fruit or meringue on top. */
export function tart(m: M, p: Object3D, x: number, y: number, z: number, r: number, filling: string, top: 'berries' | 'meringue' | 'glaze' | 'fruit', fruit = '#b0182f') {
  const g = new Group()
  g.position.set(x, y, z)
  p.add(g)
  const n = 28
  const pts: [number, number][] = [[0, 0]]
  for (let i = 0; i <= 6; i++) pts.push([r * (0.9 + 0.1 * (i / 6)), (i / 6) * r * 0.42])
  pts.push([r * 0.92, r * 0.42])
  const caseGeo = new LatheGeometry(pts.map(([a, b]) => new Vector2(a, b)), n * 2)
  // Flutes: push the wall in and out round the case.
  const pos = caseGeo.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i)
    const pz = pos.getZ(i)
    const a = Math.atan2(pz, px)
    const k = 1 + 0.045 * Math.cos(a * n)
    pos.setX(i, px * k)
    pos.setZ(i, pz * k)
  }
  caseGeo.computeVertexNormals()
  mesh(g, caseGeo, m.pastry, 0, 0, 0, false)
  const fill = m.food(top === 'glaze' ? 'glaze' : 'cream', filling)
  mesh(g, new CylinderGeometry(r * 0.88, r * 0.88, 0.006, 32), fill, 0, r * 0.4, 0, false)
  const rr = rng(Math.round(r * 1e4) + filling.length)
  if (top === 'berries' || top === 'fruit')
    for (let i = 0; i < Math.round((r / 0.04) * 9); i++) {
      const a = rr() * PI * 2
      const d = Math.sqrt(rr()) * r * 0.72
      const b = mesh(g, new SphereGeometry(top === 'berries' ? 0.008 : 0.011, 10, 8), m.food('fruit', top === 'fruit' && i % 3 === 0 ? '#e8b23a' : fruit), Math.cos(a) * d, r * 0.4 + 0.007, Math.sin(a) * d, false)
      if (top === 'fruit') b.scale.set(1.2, 0.6, 1.0)
    }
  if (top === 'meringue')
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * PI * 2
      const d = i === 0 ? 0 : r * 0.55
      lathe(g, [[0, 0], [r * 0.24, 0], [r * 0.2, r * 0.18], [r * 0.08, r * 0.36], [0, r * 0.48]], m.food('baked', '#f2dcb5'), i === 0 ? 0 : Math.cos(a) * d, r * 0.4, i === 0 ? 0 : Math.sin(a) * d, 12)
    }
  return g
}

/** A slice of layered cake, the wedge of a `r`-radius cake, its layers bottom to top. */
export function slice(m: M, p: Object3D, x: number, y: number, z: number, yaw: number, r: number, layers: [string, 'sponge' | 'cream' | 'glaze' | 'fruit', number][], topper?: string) {
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = yaw
  p.add(g)
  const arc = PI / 6
  // Each layer a closed wedge: its cut faces show the sponge and cream.
  const wedge = new Shape()
  wedge.moveTo(0, 0)
  for (let i = 0; i <= 12; i++) {
    const a = -arc / 2 + (arc * i) / 12
    wedge.lineTo(Math.sin(a) * r, Math.cos(a) * r)
  }
  wedge.closePath()
  let h = 0
  for (const [c, kind, t] of layers) {
    const geo = new ExtrudeGeometry(wedge, { depth: t, bevelEnabled: false, curveSegments: 6 })
    geo.rotateX(-PI / 2)
    mesh(g, geo, m.food(kind, c), 0, h, r * 0.45, false)
    h += t
  }
  if (topper) mesh(g, new SphereGeometry(0.009, 10, 8), m.food('fruit', topper), 0, h + 0.006, -r * 0.6 + r * 0.75, false)
  return g
}

/** A whole cake or entremets: tiers of sponge and cream, a glaze, rosettes and fruit round its top. */
export function cake(m: M, p: Object3D, x: number, y: number, z: number, r: number, h: number, coat: string, glaze: 'glaze' | 'cream', rosette: string, fruit: string, dome = false) {
  const g = new Group()
  g.position.set(x, y, z)
  p.add(g)
  if (dome) lathe(g, Array.from({ length: 12 }, (_, i): [number, number] => [r * Math.cos((i / 11) * (PI / 2)), h * Math.sin((i / 11) * (PI / 2))]), m.food('glaze', coat), 0, 0, 0, 40)
  else {
    mesh(g, new CylinderGeometry(r, r, h, 48), m.food(glaze, coat), 0, h / 2, 0, false)
    mesh(g, new TorusGeometry(r, 0.006, 6, 48), m.food(glaze, coat), 0, h, 0, false).rotation.x = PI / 2
  }
  const n = Math.round(r * 90)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2
    const rr = dome ? r * 0.35 : r * 0.82
    const ry = dome ? h * 0.92 : h
    lathe(g, [[0, 0], [0.011, 0], [0.012, 0.006], [0.007, 0.014], [0, 0.02]], m.food('cream', rosette), Math.cos(a) * rr, ry, Math.sin(a) * rr, 10)
    if (i % 2 === 0) mesh(g, new SphereGeometry(0.008, 10, 8), m.food('fruit', fruit), Math.cos(a + 0.2) * rr * 0.75, ry + 0.007, Math.sin(a + 0.2) * rr * 0.75, false)
  }
  return g
}

/** A croissant, 12 cm tip to tip: tapering laminated segments round a crescent. */
export function croissant(m: M, p: Object3D, x: number, y: number, z: number, yaw: number) {
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = yaw
  p.add(g)
  const segs = 7
  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1)
    const a = (t - 0.5) * 2.3
    const s = 0.024 * (1 - 0.62 * Math.abs(t - 0.5) * 2) + 0.006
    const o = mesh(g, new SphereGeometry(1, 14, 10), m.pastry, Math.sin(a) * 0.045, s * 0.75, Math.cos(a) * 0.045 - 0.03, false)
    o.scale.set(s * 1.1, s * 0.8, s * 0.95)
    o.rotation.y = a
  }
  return g
}

/** A cupcake: a fluted paper case, the sponge crown, a swirl of buttercream. */
export function cupcake(m: M, p: Object3D, x: number, y: number, z: number, frosting: string, liner: Material) {
  const g = new Group()
  g.position.set(x, y, z)
  p.add(g)
  lathe(g, [[0.022, 0], [0.028, 0.035]], liner, 0, 0, 0, 24)
  lathe(g, [[0, 0.03], [0.028, 0.034], [0.029, 0.04], [0.02, 0.046], [0, 0.048]], m.food('sponge', '#c99a5a'), 0, 0, 0, 20)
  lathe(g, [[0, 0.04], [0.026, 0.044], [0.022, 0.056], [0.016, 0.062], [0.012, 0.072], [0.005, 0.08], [0, 0.084]], m.food('cream', frosting), 0, 0, 0, 20)
  return g
}

/** A cookie, 7 cm: a flat baked round with its chips. */
export function cookie(m: M, p: Object3D, x: number, y: number, z: number, tilt = 0) {
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.x = tilt
  p.add(g)
  const c = mesh(g, new SphereGeometry(0.035, 16, 8), m.food('baked', '#b9783a'), 0, 0.005, 0, false)
  c.scale.y = 0.18
  for (let i = 0; i < 5; i++) mesh(g, new SphereGeometry(0.004, 6, 4), m.food('glaze', '#3a2014'), Math.cos(i * 1.3) * 0.018, 0.009, Math.sin(i * 1.3) * 0.018, false)
  return g
}

/** A glass canister with its lid and knob, filled with `fill` (each placed at a point inside). */
export function canister(m: M, p: Object3D, x: number, y: number, z: number, r: number, h: number, fill: (g: Group, r: number, h: number) => void, lid: Material) {
  const g = new Group()
  g.position.set(x, y, z)
  p.add(g)
  mesh(g, new CylinderGeometry(r, r, h, 32, 1, true), m.jarGlass, 0, h / 2, 0, false)
  mesh(g, new CylinderGeometry(r, r, 0.004, 32), m.jarGlass, 0, 0.002, 0, false)
  mesh(g, new CylinderGeometry(r + 0.004, r + 0.004, 0.022, 32), lid, 0, h + 0.011, 0, false)
  mesh(g, new SphereGeometry(0.014, 12, 8), lid, 0, h + 0.03, 0, false)
  fill(g, r, h)
  return g
}

/** A cake stand: a porcelain plate on its foot; returns the top to put a cake on. */
export function cakeStand(m: M, p: Object3D, x: number, y: number, z: number, r: number, h: number) {
  const g = new Group()
  g.position.set(x, y, z)
  p.add(g)
  lathe(g, [[0, 0], [r * 0.45, 0], [r * 0.42, 0.012], [0.02, h * 0.3], [0.016, h - 0.012], [r, h - 0.006], [r, h], [0, h]], m.porcelain, 0, 0, 0, 40)
  return { g, top: h }
}

/** A glass cloche over a stand, its knob on top. */
export function cloche(m: M, p: Object3D, r: number, h: number) {
  lathe(p, Array.from({ length: 14 }, (_, i): [number, number] => {
    const a = (i / 13) * (PI / 2)
    return [r * Math.cos(a) + (i === 0 ? 0 : 0), h * Math.sin(a)]
  }), m.jarGlass, 0, 0, 0, 40)
  mesh(p, new SphereGeometry(0.016, 14, 10), m.gold, 0, h + 0.012, 0, false)
}

/** A porcelain plate (r) with a gold rim. */
export function plate(m: M, p: Object3D, x: number, y: number, z: number, r: number) {
  lathe(p, [[0, 0], [r * 0.6, 0], [r * 0.7, 0.006], [r, 0.014], [r * 0.98, 0.016], [0, 0.007]], m.porcelain, x, y, z, 36)
  mesh(p, new TorusGeometry(r * 0.985, 0.0018, 4, 40), m.gold, x, y + 0.0155, z, false).rotation.x = PI / 2
}

/** A cup of coffee on its saucer. */
export function coffeeCup(m: M, p: Object3D, x: number, y: number, z: number) {
  plate(m, p, x, y, z, 0.07)
  lathe(p, [[0, 0.008], [0.025, 0.008], [0.038, 0.06], [0.04, 0.064], [0.036, 0.064], [0.022, 0.012], [0, 0.012]], m.porcelain, x, y, z, 28)
  mesh(p, new CylinderGeometry(0.035, 0.035, 0.002, 24), m.food('glaze', '#5a3218'), x, y + 0.055, z, false)
  const h = mesh(p, new TorusGeometry(0.012, 0.003, 6, 14, PI * 1.3), m.porcelain, x + 0.042, y + 0.04, z, false)
  h.rotation.z = -PI * 0.65
}
