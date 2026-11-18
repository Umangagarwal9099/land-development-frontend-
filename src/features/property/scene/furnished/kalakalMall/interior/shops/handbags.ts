import { CanvasTexture, CatmullRomCurve3, CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, Shape, SphereGeometry, SRGBColorSpace, TorusGeometry, TubeGeometry, Vector2, Vector3, type Material, type Object3D } from 'three'
import { rng, type Paint } from '../../../textures'
import type { FloorCtx } from '../shell'
import { ribbon } from './heels'
import { mesh, PI } from './kit'

/*
 * Handbags, made as a leather goods workshop makes them. A body is cut from its side profile
 * (deep at the base, narrower at the top, its corners turned) and closed across its width, its
 * edges soft; a flap folds over the top and down the front on a hinge at the back, so it can be
 * lifted; handles are rolled leather on rings and tabs, or cane; straps are flat leather or chain;
 * the hardware is cast and polished (turn-locks, a horsebit, a piston clasp, zips with their pulls,
 * feet). Saddle stitching runs round the flap's edge. Each bag stands on local y = 0, its front to
 * +z, its width along x.
 *
 * Also the boutique's finishes, from the reference: emerald walls, brass, warm lit niches,
 * floral-print cabinet fronts, a stone floor and a green rug; its furniture: a semicircular
 * channel-tufted sofa half green and half mustard, a mustard pouf, a coral kidney bench, a
 * smoked-glass table on a floral drum, fluted green planters.
 */

/* ---------- painters ---------- */

const pebble: Paint = (g, w, h) => {
  const r = rng(8101)
  g.fillStyle = '#808080'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 2400; i++) {
    const x = r() * w
    const y = r() * h
    const s = 2 + r() * 5
    const gr = g.createRadialGradient(x, y, 0, x, y, s)
    gr.addColorStop(0, 'rgba(255,255,255,.4)')
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - s, y - s, 2 * s, 2 * s)
  }
}
/** Chevron quilting, as a matelassé leather's. */
const chevron: Paint = (g, w, h) => {
  g.fillStyle = '#9a9a9a'
  g.fillRect(0, 0, w, h)
  const n = 4
  for (let row = -1; row <= n; row++) {
    const y = (row * h) / n
    const gr = g.createLinearGradient(0, y, 0, y + h / n)
    gr.addColorStop(0, '#5a5a5a')
    gr.addColorStop(0.15, '#c8c8c8')
    gr.addColorStop(0.85, '#a8a8a8')
    gr.addColorStop(1, '#5a5a5a')
    g.fillStyle = gr
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(w / 2, y + h / n / 2)
    g.lineTo(w, y)
    g.lineTo(w, y + h / n)
    g.lineTo(w / 2, y + h / n * 1.5)
    g.lineTo(0, y + h / n)
    g.closePath()
    g.fill()
  }
}
/** A diamond-woven canvas in two tones, trimmed in leather where it is cut. */
const diamonds = (ground: string, ink: string): Paint => (g, w, h) => {
  g.fillStyle = ground
  g.fillRect(0, 0, w, h)
  g.strokeStyle = ink
  g.lineWidth = w / 64
  const n = 8
  for (let i = -n; i <= 2 * n; i++) {
    g.beginPath()
    g.moveTo((i * w) / n, 0)
    g.lineTo((i * w) / n + w, h)
    g.stroke()
    g.beginPath()
    g.moveTo((i * w) / n, h)
    g.lineTo((i * w) / n + w, 0)
    g.stroke()
  }
  g.fillStyle = ink
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      g.beginPath()
      g.arc(((i + 0.5) * w) / n, ((j + 0.5) * h) / n, w / 90, 0, 7)
      g.fill()
    }
}
/** Raffia woven in a basket weave. */
const raffia: Paint = (g, w, h) => {
  const r = rng(8102)
  g.fillStyle = '#d7bf8f'
  g.fillRect(0, 0, w, h)
  const s = w / 16
  for (let i = 0; i < 16; i++)
    for (let j = 0; j < 16; j++) {
      const across = (i + j) % 2 === 0
      for (let k = 0; k < 4; k++) {
        g.fillStyle = `rgba(${r() < 0.5 ? '160,120,70' : '240,220,180'},${0.25 + r() * 0.3})`
        if (across) g.fillRect(i * s, j * s + (k * s) / 4, s, s / 4 - 1)
        else g.fillRect(i * s + (k * s) / 4, j * s, s / 4 - 1, s)
      }
    }
}
/** The three-band web stripe of a strap: green, red, green on cream. */
const web: Paint = (g, w, h) => {
  const bands: [string, number][] = [['#e9e0cc', 0.12], ['#1f5a3a', 0.24], ['#a61d24', 0.28], ['#1f5a3a', 0.24], ['#e9e0cc', 0.12]]
  let y = 0
  for (const [c, f] of bands) {
    g.fillStyle = c
    g.fillRect(0, y, w, f * h)
    y += f * h
  }
  for (let x = 0; x < w; x += 2) {
    g.fillStyle = 'rgba(0,0,0,.08)'
    g.fillRect(x, 0, 1, h)
  }
}
/** Saddle stitches: short dashes along a thread, with gaps. */
const stitch: Paint = (g, w, h) => {
  g.clearRect(0, 0, w, h)
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, w * 0.62, h)
}
/** Garden roses on green, for the cabinet fronts. */
const flora: Paint = (g, w, h) => {
  const r = rng(8103)
  g.fillStyle = '#2e5a43'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 70; i++) {
    const x = r() * w
    const y = r() * h
    g.fillStyle = r() < 0.5 ? '#3f7a52' : '#5c8f5f'
    g.beginPath()
    g.ellipse(x, y, 9 + r() * 8, 4 + r() * 3, r() * 3, 0, 7)
    g.fill()
  }
  for (let i = 0; i < 26; i++) {
    const x = r() * w
    const y = r() * h
    const s = 14 + r() * 14
    const tone = ['#e7a3a0', '#d8787a', '#f2c2b8', '#c95e66'][Math.floor(r() * 4)]
    for (let k = 0; k < 7; k++) {
      g.fillStyle = tone
      g.globalAlpha = 0.85
      const a = (k / 7) * PI * 2
      g.beginPath()
      g.ellipse(x + Math.cos(a) * s * 0.35, y + Math.sin(a) * s * 0.35, s * 0.45, s * 0.3, a, 0, 7)
      g.fill()
    }
    g.globalAlpha = 1
    g.fillStyle = 'rgba(120,40,50,.5)'
    g.beginPath()
    g.arc(x, y, s * 0.2, 0, 7)
    g.fill()
  }
}
/** Stone tiles, 90 cm, warm grey-beige with soft cloud and joints. */
const tiles: Paint = (g, w, h) => {
  const r = rng(8104)
  const n = 2
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const tone = 196 + Math.floor(r() * 16)
      g.fillStyle = `rgb(${tone},${tone - 10},${tone - 24})`
      g.fillRect((i * w) / n, (j * h) / n, w / n, h / n)
      g.filter = 'blur(18px)'
      for (let k = 0; k < 8; k++) {
        g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(120,100,80,.1)'
        g.beginPath()
        g.ellipse((i + r()) * (w / n), (j + r()) * (h / n), 40 + r() * 80, 20 + r() * 40, r() * 3, 0, 7)
        g.fill()
      }
      g.filter = 'none'
    }
  g.fillStyle = 'rgba(110,95,80,.55)'
  for (let i = 0; i <= n; i++) {
    g.fillRect((i * w) / n - 1, 0, 2, h)
    g.fillRect(0, (i * h) / n - 1, w, 2)
  }
}
/** Bronze mesh, warm and textured, for the niches' linings. */
const bronzeMesh: Paint = (g, w, h) => {
  const r = rng(8105)
  g.fillStyle = '#8a6a48'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(220,180,120,.18)' : 'rgba(40,25,10,.2)'
    g.fillRect(r() * w, r() * h, 2, 2)
  }
  g.strokeStyle = 'rgba(40,25,10,.25)'
  for (let x = 0; x < w; x += 6) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, h)
    g.stroke()
  }
}
/** Channel tufting: rounded vertical ribs. */
const channels: Paint = (g, w, h) => {
  const n = 8
  for (let i = 0; i < n; i++) {
    const gr = g.createLinearGradient((i * w) / n, 0, ((i + 1) * w) / n, 0)
    gr.addColorStop(0, '#404040')
    gr.addColorStop(0.15, '#b0b0b0')
    gr.addColorStop(0.5, '#e0e0e0')
    gr.addColorStop(0.85, '#b0b0b0')
    gr.addColorStop(1, '#404040')
    g.fillStyle = gr
    g.fillRect((i * w) / n, 0, w / n, h)
  }
}

/* ---------- materials ---------- */

export type Leather = 'calf' | 'pebbled' | 'suede' | 'patent' | 'quilted' | 'canvas' | 'raffia' | 'satin' | 'crystal'

export function bagMaterials(e: FloorCtx) {
  const { k, m, lux } = e
  const env = m.env
  const mark = <T extends Material>(x: T) => ((x.userData.interior = true), x)
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.5) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const phys = (p: ConstructorParameters<typeof MeshPhysicalMaterial>[0], reflect = 0.5) => mark(new MeshPhysicalMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const tex = (w: number, h: number, p: Paint, mx: number, my = mx) => {
    const t = k.tex.painted(w, h, p)
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1 / mx, 1 / my)
    t.anisotropy = 8
    return t
  }
  const canvas = (w: number, h: number, p: Paint, mx = 1, my = mx) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    p(c.getContext('2d')!, w, h)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1 / mx, 1 / my)
    t.anisotropy = 8
    return t
  }
  const relief = { pebble: tex(256, 256, pebble, 0.03), chevron: tex(256, 256, chevron, 0.06), fine: tex(256, 256, pebble, 0.012) }
  const cache = new Map<string, Material>()
  /** One leather (or cloth) in one colour, shared by every bag made from it. */
  const leather = (kind: Leather, colour: string) => {
    const key = `${kind}|${colour}`
    let c = cache.get(key)
    if (c) return c
    switch (kind) {
      case 'calf':
        c = phys({ color: colour, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.35, bumpMap: relief.fine, bumpScale: 0.15 }, 0.45)
        break
      case 'pebbled':
        c = phys({ color: colour, roughness: 0.55, clearcoat: 0.15, bumpMap: relief.pebble, bumpScale: 0.8 }, 0.3)
        break
      case 'suede':
        c = phys({ color: colour, roughness: 0.95, sheen: 1, sheenRoughness: 0.55, sheenColor: '#ffffff', bumpMap: relief.fine, bumpScale: 0.6 }, 0.06)
        break
      case 'patent':
        c = phys({ color: colour, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.03 }, 1.0)
        break
      case 'quilted':
        c = phys({ color: colour, roughness: 0.45, clearcoat: 0.25, bumpMap: relief.chevron, bumpScale: 2.2 }, 0.4)
        break
      case 'canvas':
        c = phys({ map: canvas(256, 256, diamonds(colour, '#3b2a1e'), 0.08), roughness: 0.85, sheen: 0.3, sheenColor: '#ffffff' }, 0.08)
        break
      case 'raffia':
        c = phys({ map: canvas(256, 256, raffia, 0.12), color: colour, roughness: 0.92, bumpMap: tex(256, 256, raffia, 0.12), bumpScale: 1.2 }, 0.04)
        break
      case 'satin':
        c = phys({ color: colour, roughness: 0.3, sheen: 1, sheenRoughness: 0.25, sheenColor: '#ffffff', anisotropy: 0.6 }, 0.6)
        break
      case 'crystal':
        c = phys({ color: colour, metalness: 0.8, roughness: 0.2, iridescence: 0.5, bumpMap: relief.pebble, bumpScale: 1.5, emissive: '#ffffff', emissiveIntensity: 0.05 }, 1.6)
        break
    }
    cache.set(key, c!)
    return c!
  }
  const stitchTex = canvas(64, 8, stitch)
  return {
    leather,
    gold: std({ color: '#e0c07c', metalness: 1, roughness: 0.16 }, 1.3),
    palladium: std({ color: '#d7dade', metalness: 1, roughness: 0.14 }, 1.3),
    lining: phys({ color: '#3a2f28', roughness: 0.9, sheen: 0.6, sheenColor: '#8a7a6a', side: DoubleSide }, 0.05),
    cane: phys({ color: '#a8692e', roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15 }, 0.6),
    web: std({ map: canvas(64, 128, web), roughness: 0.75 }, 0.08),
    thread: std({ color: '#efe6d4', map: stitchTex, alphaTest: 0.5, roughness: 0.8 }, 0.05),
    /* the room */
    emerald: std({ color: '#1e6b4b', roughness: 0.62 }, 0.12),
    emeraldDeep: std({ color: '#185a3e', roughness: 0.6 }, 0.12),
    brass: lux.brass,
    niche: std({ map: tex(512, 512, bronzeMesh, 0.6), roughness: 0.6, metalness: 0.3 }, 0.3),
    nicheLit: std({ color: '#efe3cc', emissive: '#fff0d6', emissiveIntensity: 0.28, roughness: 0.8 }, 0.05),
    shelf: std({ color: '#7a5233', roughness: 0.45 }, 0.3),
    flora: std({ map: canvas(512, 512, flora, 0.6), roughness: 0.55 }, 0.2),
    stone: std({ map: tex(512, 512, tiles, 1.8), roughness: 0.35 }, 0.4),
    rug: phys({ color: '#2d6b4c', roughness: 0.97, sheen: 0.6, sheenColor: '#7fbf98' }, 0.02),
    rugEdge: phys({ color: '#245a3f', roughness: 0.97, sheen: 0.6, sheenColor: '#7fbf98' }, 0.02),
    plaster: std({ color: '#f1ede6', roughness: 0.9 }, 0.04),
    mirror: std({ color: '#d9e0de', metalness: 1, roughness: 0.04 }, 1.4),
    smoke: phys({ color: '#3c3a36', roughness: 0.04, transparent: true, opacity: 0.6, depthWrite: false, clearcoat: 1 }, 1.4),
    velvetGreen: phys({ color: '#1f5a3e', roughness: 0.82, sheen: 1, sheenRoughness: 0.35, sheenColor: '#86d1a6', bumpMap: tex(256, 256, channels, 0.32, 1), bumpScale: 2 }, 0.06),
    mustard: phys({ color: '#d39a26', roughness: 0.8, sheen: 1, sheenRoughness: 0.4, sheenColor: '#ffe2a0', bumpMap: tex(256, 256, channels, 0.32, 1), bumpScale: 2 }, 0.06),
    coral: phys({ color: '#d0745e', roughness: 0.82, sheen: 1, sheenRoughness: 0.4, sheenColor: '#f6b8a5', bumpMap: tex(256, 256, channels, 0.32, 1), bumpScale: 2 }, 0.05),
    glass: phys({ color: '#eef4f2', roughness: 0.02, transparent: true, opacity: 0.12, depthWrite: false, side: DoubleSide }, 1.3),
    canvas,
    std,
  }
}

export type BagMaterials = ReturnType<typeof bagMaterials>
type M = BagMaterials

/* ---------- making ---------- */

/**
 * A bag body from its side profile: `d` deep at the base, `td` at the top, `h` high, corners
 * turned `r`; closed across `w` with soft edges. Base centred at the origin.
 */
function body(w: number, h: number, d: number, td: number, r: number, soft: number) {
  const s = new Shape()
  const pts: [number, number][] = [[-d / 2, 0], [d / 2, 0], [td / 2, h], [-td / 2, h]]
  // A rounded trapezoid: round each corner by r along its two edges.
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const p = pts[i]
    const a = pts[(i + n - 1) % n]
    const b = pts[(i + 1) % n]
    const da = Math.hypot(a[0] - p[0], a[1] - p[1])
    const db = Math.hypot(b[0] - p[0], b[1] - p[1])
    const p1: [number, number] = [p[0] + ((a[0] - p[0]) / da) * Math.min(r, da / 2), p[1] + ((a[1] - p[1]) / da) * Math.min(r, da / 2)]
    const p2: [number, number] = [p[0] + ((b[0] - p[0]) / db) * Math.min(r, db / 2), p[1] + ((b[1] - p[1]) / db) * Math.min(r, db / 2)]
    if (i === 0) s.moveTo(...p1)
    else s.lineTo(...p1)
    s.quadraticCurveTo(p[0], p[1], ...p2)
  }
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: Math.max(0.001, w - 2 * soft), bevelEnabled: soft > 0, bevelThickness: soft, bevelSize: soft * 0.8, bevelSegments: 5, curveSegments: 8 })
  // Shape (z, y) extruded along x.
  g.rotateY(PI / 2)
  g.translate(-(w - 2 * soft) / 2, 0, 0)
  return g
}

/** A rolled handle: a tube along an arch from (x0, y, z) to (x1, y, z), rising `rise`. */
function handle(p: Object3D, x0: number, x1: number, y: number, z: number, rise: number, r: number, mat: Material, tilt = 0) {
  const pts: Vector3[] = []
  for (let i = 0; i <= 16; i++) {
    const t = i / 16
    const a = t * PI
    pts.push(new Vector3(x0 + (x1 - x0) * t, y + Math.sin(a) * rise, z + Math.sin(a) * rise * tilt))
  }
  return mesh(p, new TubeGeometry(new CatmullRomCurve3(pts), 40, r, 10, false), mat, 0, 0, 0, true)
}

/** A flat leather strap (or web) along a path in the bag's x–y plane, its width across the bag's depth. */
function strap(p: Object3D, pts: Vector3[], w: number, mat: Material) {
  const curve = new CatmullRomCurve3(pts)
  const path = curve.getPoints(60)
  const outs = path.map((_, i) => new Vector3().crossVectors(curve.getTangent(i / 60), new Vector3(0, 0, 1)).normalize())
  return mesh(p, ribbon(path, outs, w, 0.003), mat, 0, 0, 0, true)
}

/** A chain: oval links along a path, each turned a quarter to the last. */
function chain(p: Object3D, pts: Vector3[], mat: Material, link = 0.012) {
  const curve = new CatmullRomCurve3(pts)
  const n = Math.floor(curve.getLength() / (link * 1.55))
  const geo = new TorusGeometry(link, link * 0.22, 5, 10)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const c = curve.getPointAt(t)
    const tan = curve.getTangentAt(t)
    const l = new Mesh(geo, mat)
    l.position.copy(c)
    l.rotation.set(0, 0, Math.atan2(tan.y, tan.x))
    if (i % 2) l.rotateX(PI / 2)
    l.scale.set(1.4, 1, 1)
    p.add(l)
  }
}

/** Saddle stitching along a path: a fine thread of dashes. */
function stitches(p: Object3D, pts: Vector3[], m: M) {
  const curve = new CatmullRomCurve3(pts)
  const len = curve.getLength()
  const g = new TubeGeometry(curve, Math.max(8, Math.round(len * 80)), 0.0009, 4, false)
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (len / 0.007))
  mesh(p, g, m.thread, 0, 0, 0, false)
}

/** A flap hinged at the top-back edge: over the top (depth `td`) and down the front `drop`; returns its door. */
function flap(p: Object3D, name: string, w: number, h: number, td: number, drop: number, mat: Material, m: M, shape: 'round' | 'square' | 'v' = 'round') {
  const hinge = new Group()
  hinge.position.set(0, h, -td / 2)
  p.add(hinge)
  const door = new Group()
  door.name = `door_${name}`
  door.userData.label = 'Flap'
  door.userData.axis = 'x'
  door.userData.openAngle = -1.5
  hinge.add(door)
  // Over the top.
  mesh(door, body(w + 0.006, 0.004, td + 0.004, td + 0.004, 0.002, 0.0015), mat, 0, 0.001, td / 2)
  // Down the front: a flat shape, rounded or pointed at its foot, standing just proud of the body.
  const s = new Shape()
  const hw = w / 2 + 0.003
  s.moveTo(-hw, 0)
  s.lineTo(hw, 0)
  if (shape === 'v') {
    s.lineTo(hw, -drop * 0.55)
    s.lineTo(0, -drop)
    s.lineTo(-hw, -drop * 0.55)
  } else if (shape === 'round') {
    s.lineTo(hw, -drop + 0.03)
    s.quadraticCurveTo(hw, -drop, hw - 0.03, -drop)
    s.lineTo(-hw + 0.03, -drop)
    s.quadraticCurveTo(-hw, -drop, -hw, -drop + 0.03)
  } else {
    s.lineTo(hw, -drop)
    s.lineTo(-hw, -drop)
  }
  s.closePath()
  const front = new ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2 })
  const f = mesh(door, front, mat, 0, 0, td + 0.003)
  f.userData.front = true
  // The stitching round its edge.
  const inset = 0.006
  const edge: Vector3[] = []
  const z = td + 0.0085
  if (shape === 'v') edge.push(new Vector3(-hw + inset, -0.005, z), new Vector3(-hw + inset, -drop * 0.55, z), new Vector3(0, -drop + inset * 1.6, z), new Vector3(hw - inset, -drop * 0.55, z), new Vector3(hw - inset, -0.005, z))
  else edge.push(new Vector3(-hw + inset, -0.005, z), new Vector3(-hw + inset, -drop + inset + 0.02, z), new Vector3(-hw + 0.03, -drop + inset, z), new Vector3(hw - 0.03, -drop + inset, z), new Vector3(hw - inset, -drop + inset + 0.02, z), new Vector3(hw - inset, -0.005, z))
  stitches(door, edge, m)
  return { door, frontZ: td + 0.009 }
}

/** A horsebit: two rings joined by a bar. */
function horsebit(p: Object3D, x: number, y: number, z: number, mat: Material, s = 1) {
  for (const sx of [-1, 1]) mesh(p, new TorusGeometry(0.014 * s, 0.0032 * s, 8, 20), mat, x + sx * 0.022 * s, y, z, false)
  const bar = mesh(p, new CylinderGeometry(0.0035 * s, 0.0035 * s, 0.03 * s, 10), mat, x, y, z, false)
  bar.rotation.z = PI / 2
  for (const sx of [-1, 1]) mesh(p, new SphereGeometry(0.0045 * s, 10, 8), mat, x + sx * 0.008 * s, y, z, false)
}

/** A turn-lock: a plate and its turning bar. */
function turnlock(p: Object3D, x: number, y: number, z: number, mat: Material) {
  const plate = mesh(p, new CylinderGeometry(0.016, 0.016, 0.004, 24), mat, x, y, z, false)
  plate.rotation.x = PI / 2
  const bar = mesh(p, new CylinderGeometry(0.004, 0.004, 0.026, 10), mat, x, y, z + 0.005, false)
  bar.rotation.z = PI / 2
}

/** A zip along the top: the track and its pull. */
function zip(p: Object3D, x0: number, x1: number, y: number, z: number, mat: Material, teeth: Material) {
  const t = mesh(p, new CylinderGeometry(0.0025, 0.0025, x1 - x0, 6), teeth, (x0 + x1) / 2, y, z, false)
  t.rotation.z = PI / 2
  mesh(p, new SphereGeometry(0.005, 8, 6), mat, x1 - 0.02, y + 0.003, z, false).scale.set(1.6, 0.8, 1)
  const pull = mesh(p, new CylinderGeometry(0.004, 0.006, 0.03, 8), mat, x1 - 0.02, y - 0.012, z + 0.006, false)
  pull.rotation.x = 0.25
}

/** Brass feet under a bag's base. */
function feet(p: Object3D, w: number, d: number, mat: Material) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(p, new CylinderGeometry(0.006, 0.007, 0.005, 12), mat, sx * (w / 2 - 0.03), 0.0025, sz * (d / 2 - 0.02), false)
}

/* ---------- the bags ---------- */

export type BagStyle = 'bamboo' | 'horsebit' | 'tote' | 'camera' | 'hobo' | 'clutch' | 'mini' | 'bowling' | 'bucket' | 'quilted' | 'minaudiere' | 'raffia'

export interface BagSpec {
  style: BagStyle
  leather: Material
  /** Gold or palladium. */
  metal?: Material
  trim?: Material
  name: string
  scale?: number
  /** Shown on a shelf: the long strap or chain tucked away (it comes with the bag). */
  noStrap?: boolean
}

/**
 * Builds one bag; returns its group (the body's parts first, to be merged, and any flap as a
 * door_ group of its own) and its height.
 */
export function bag(m: M, p: Object3D, spec: BagSpec) {
  const g = new Group()
  p.add(g)
  const parts = new Group()
  g.add(parts)
  const L = spec.leather
  const metal = spec.metal ?? m.gold
  const trim = spec.trim ?? L
  const id = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  let h = 0.2
  switch (spec.style) {
    case 'bamboo': {
      // A structured top-handle: a trapezoid body, a full flap with a turn-lock, a cane handle.
      const w = 0.26
      h = 0.19
      mesh(parts, body(w, h, 0.11, 0.08, 0.025, 0.008), L)
      feet(parts, w, 0.11, metal)
      const { door, frontZ } = flap(g, `${id}_flap`, w - 0.01, h, 0.08, 0.13, L, m, 'round')
      turnlock(door, 0, -0.11, frontZ, metal)
      // The cane handle: a bent bamboo with its nodes, on leather tabs and rings.
      const pts: Vector3[] = []
      for (let i = 0; i <= 20; i++) {
        const t = i / 20
        pts.push(new Vector3(-0.08 + 0.16 * t, h + 0.02 + Math.sin(t * PI) * 0.11, 0))
      }
      const curve = new CatmullRomCurve3(pts)
      mesh(parts, new TubeGeometry(curve, 48, 0.0075, 10, false), m.cane)
      for (let i = 1; i < 6; i++) {
        const c = curve.getPointAt(i / 6)
        const t = curve.getTangentAt(i / 6)
        const n = mesh(parts, new TorusGeometry(0.0078, 0.0018, 6, 14), m.cane, c.x, c.y, c.z, false)
        n.lookAt(c.clone().add(t))
      }
      for (const sx of [-1, 1]) {
        mesh(parts, new TorusGeometry(0.008, 0.002, 6, 14), metal, sx * 0.08, h + 0.012, 0, false)
        mesh(parts, body(0.016, 0.03, 0.006, 0.006, 0.002, 0.001), trim, sx * 0.08, h - 0.02, 0.02)
      }
      h += 0.13
      break
    }
    case 'horsebit': {
      // A shoulder bag: an oblong body, a flap with the horsebit across it, a long leather strap.
      const w = 0.27
      h = 0.165
      mesh(parts, body(w, h, 0.075, 0.065, 0.03, 0.008), L)
      const { door, frontZ } = flap(g, `${id}_flap`, w - 0.01, h, 0.065, 0.12, L, m, 'square')
      horsebit(door, 0, -0.06, frontZ + 0.002, metal)
      if (!spec.noStrap) strap(parts, [new Vector3(-w / 2 + 0.005, h - 0.02, 0), new Vector3(-w / 2 + 0.03, h + 0.18, 0), new Vector3(0, h + 0.28, 0), new Vector3(w / 2 - 0.03, h + 0.18, 0), new Vector3(w / 2 - 0.005, h - 0.02, 0)], 0.018, trim)
      h += spec.noStrap ? 0 : 0.28
      break
    }
    case 'tote': {
      // A tall open tote: lined inside, a web stripe down its front, two flat handles.
      const w = 0.38
      h = 0.31
      mesh(parts, body(w, h, 0.15, 0.13, 0.02, 0.006), L)
      // The opening: a dark lining sunk in its top.
      mesh(parts, body(w - 0.02, 0.006, 0.12, 0.12, 0.01, 0.002), m.lining, 0, h - 0.04, 0)
      const band = mesh(parts, body(0.05, h - 0.02, 0.0025, 0.0025, 0.001, 0), m.web, 0, 0.01, 0.074)
      band.position.z = 0.074
      band.rotation.x = -Math.atan2(0.01, h)
      for (const sz of [-1, 1]) strap(parts, [new Vector3(-0.07, h - 0.03, sz * 0.066), new Vector3(-0.06, h + 0.12, sz * 0.066), new Vector3(0, h + 0.17, sz * 0.066), new Vector3(0.06, h + 0.12, sz * 0.066), new Vector3(0.07, h - 0.03, sz * 0.066)], 0.022, trim)
      feet(parts, w, 0.15, metal)
      h += 0.17
      break
    }
    case 'camera': {
      // A camera bag: a small rounded box, a zip round the top with a tassel pull, a web strap.
      const w = 0.22
      h = 0.15
      mesh(parts, body(w, h, 0.075, 0.06, 0.035, 0.01), L)
      zip(parts, -w / 2 + 0.02, w / 2 - 0.02, h + 0.002, 0, metal, m.lining)
      for (let i = 0; i < 6; i++) mesh(parts, new CylinderGeometry(0.0015, 0.0015, 0.04, 4), trim, w / 2 - 0.02 + (i - 2.5) * 0.002, h - 0.03, 0.034, false)
      horsebit(parts, 0, h * 0.55, 0.04, metal, 0.7)
      if (!spec.noStrap) strap(parts, [new Vector3(-w / 2, h - 0.03, 0), new Vector3(-w / 2 - 0.02, h + 0.2, 0), new Vector3(0, h + 0.3, 0), new Vector3(w / 2 + 0.02, h + 0.2, 0), new Vector3(w / 2, h - 0.03, 0)], 0.03, m.web)
      h += spec.noStrap ? 0 : 0.3
      break
    }
    case 'hobo': {
      // A crescent hobo: soft and slouched, a piston clasp on the front, a short rolled handle.
      const w = 0.32
      const s = new Shape()
      s.moveTo(-w / 2, 0.16)
      s.quadraticCurveTo(-w / 2 + 0.02, 0.0, 0, 0.0)
      s.quadraticCurveTo(w / 2 - 0.02, 0.0, w / 2, 0.16)
      s.quadraticCurveTo(0, 0.2, -w / 2, 0.16)
      const geo = new ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.012, bevelSegments: 8, curveSegments: 16 })
      geo.translate(0, 0, -0.02)
      mesh(parts, geo, L, 0, 0.012, 0)
      h = 0.2
      for (const sx of [-1, 1]) mesh(parts, new CylinderGeometry(0.006, 0.006, 0.03, 12), metal, sx * 0.012, 0.13, 0.055, false).rotation.z = PI / 2
      mesh(parts, new SphereGeometry(0.008, 12, 8), metal, 0, 0.13, 0.056, false)
      handle(parts, -w / 2 + 0.015, w / 2 - 0.015, 0.17, 0, 0.17, 0.008, trim)
      h += 0.17
      break
    }
    case 'clutch': {
      // An envelope clutch: flat, a pointed flap, a bar clasp.
      const w = 0.28
      h = 0.15
      const g2 = new Group()
      g2.rotation.x = -0.18
      g2.position.z = -0.02
      parts.add(g2)
      mesh(g2, body(w, h, 0.03, 0.026, 0.008, 0.005), L)
      const { door, frontZ } = flap(g, `${id}_flap`, w - 0.006, h, 0.026, 0.1, L, m, 'v')
      door.parent!.position.z += -0.02
      door.parent!.rotation.x = -0.18
      const bar = mesh(door, new CylinderGeometry(0.004, 0.004, 0.06, 12), metal, 0, -0.085, frontZ + 0.002, false)
      bar.rotation.z = PI / 2
      break
    }
    case 'mini': {
      // A mini top-handle with a chain: a domed body, a flap with a round clasp of two rings.
      const w = 0.19
      h = 0.14
      mesh(parts, body(w, h, 0.075, 0.06, 0.04, 0.008), L)
      const { door, frontZ } = flap(g, `${id}_flap`, w - 0.008, h, 0.06, 0.1, L, m, 'round')
      mesh(door, new TorusGeometry(0.014, 0.003, 8, 24), metal, -0.008, -0.06, frontZ, false)
      mesh(door, new TorusGeometry(0.014, 0.003, 8, 24), metal, 0.008, -0.06, frontZ, false)
      handle(parts, -0.045, 0.045, h, 0, 0.07, 0.006, trim)
      if (!spec.noStrap) chain(parts, [new Vector3(-w / 2 + 0.01, h - 0.01, 0), new Vector3(-w / 2 - 0.03, h + 0.15, 0), new Vector3(0, h + 0.24, 0), new Vector3(w / 2 + 0.03, h + 0.15, 0), new Vector3(w / 2 - 0.01, h - 0.01, 0)], metal, 0.008)
      h += spec.noStrap ? 0.07 : 0.24
      break
    }
    case 'bowling': {
      // A bowling bag: a rounded top with its zip, two rolled handles, leather trim at the ends.
      const w = 0.32
      h = 0.22
      const s = new Shape()
      s.moveTo(-0.07, 0)
      s.lineTo(0.07, 0)
      s.quadraticCurveTo(0.09, 0.0, 0.09, 0.05)
      s.quadraticCurveTo(0.09, h, 0, h)
      s.quadraticCurveTo(-0.09, h, -0.09, 0.05)
      s.quadraticCurveTo(-0.09, 0, -0.07, 0)
      const geo = new ExtrudeGeometry(s, { depth: w - 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 5, curveSegments: 16 })
      geo.rotateY(PI / 2)
      geo.translate(-(w - 0.02) / 2, 0, 0)
      mesh(parts, geo, L)
      zip(parts, -w / 2 + 0.03, w / 2 - 0.03, h + 0.004, 0, metal, m.lining)
      for (const sz of [-1, 1]) handle(parts, -0.07, 0.07, h - 0.03, sz * 0.045, 0.09, 0.007, trim, sz * 0.25)
      // Leather ends cut to the bag's own rounded profile, a little proud of it.
      for (const sx of [-1, 1]) {
        const end = new ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.004, bevelSegments: 2, curveSegments: 16 })
        end.rotateY(PI / 2)
        const e2 = mesh(parts, end, trim, sx > 0 ? w / 2 - 0.004 : -w / 2 - 0.002, 0, 0)
        e2.scale.set(1, 1.02, 1.04)
      }
      feet(parts, w, 0.15, metal)
      h += 0.09
      break
    }
    case 'bucket': {
      // A bucket bag: a cylinder drawn closed with a cord through eyelets, a leather strap.
      h = 0.25
      const lathe = new LatheGeometry([[0, 0], [0.09, 0], [0.1, 0.02], [0.105, 0.12], [0.1, 0.22], [0.095, h], [0.09, h]].map(([r, y]) => new Vector2(r, y)), 40)
      mesh(parts, lathe, L)
      mesh(parts, new CylinderGeometry(0.09, 0.09, 0.004, 32), m.lining, 0, h - 0.012, 0, false)
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * PI * 2
        const r = mesh(parts, new TorusGeometry(0.005, 0.0015, 6, 12), metal, Math.cos(a) * 0.097, h - 0.03, Math.sin(a) * 0.097, false)
        r.rotation.y = -a + PI / 2
      }
      const cord = mesh(parts, new TorusGeometry(0.1, 0.003, 6, 40), trim, 0, h - 0.032, 0, false)
      cord.rotation.x = PI / 2
      for (const sx of [-1, 1]) mesh(parts, new CylinderGeometry(0.0025, 0.0025, 0.08, 6), trim, 0.03 + sx * 0.006, h - 0.07, 0.1, false)
      if (!spec.noStrap) strap(parts, [new Vector3(-0.1, h - 0.03, 0), new Vector3(-0.09, h + 0.16, 0), new Vector3(0, h + 0.24, 0), new Vector3(0.09, h + 0.16, 0), new Vector3(0.1, h - 0.03, 0)], 0.016, trim)
      h += spec.noStrap ? 0 : 0.24
      break
    }
    case 'quilted': {
      // A quilted flap bag on a chain: chevron matelassé, a round medallion clasp.
      const w = 0.25
      h = 0.155
      mesh(parts, body(w, h, 0.07, 0.06, 0.02, 0.008), L)
      const { door, frontZ } = flap(g, `${id}_flap`, w - 0.008, h, 0.06, 0.115, L, m, 'square')
      const med = mesh(door, new CylinderGeometry(0.018, 0.018, 0.004, 32), metal, 0, -0.07, frontZ, false)
      med.rotation.x = PI / 2
      mesh(door, new TorusGeometry(0.012, 0.0025, 8, 24), metal, 0, -0.07, frontZ + 0.003, false)
      if (!spec.noStrap) chain(parts, [new Vector3(-w / 2 + 0.01, h - 0.01, 0), new Vector3(-w / 2 - 0.02, h + 0.2, 0), new Vector3(0, h + 0.3, 0), new Vector3(w / 2 + 0.02, h + 0.2, 0), new Vector3(w / 2 - 0.01, h - 0.01, 0)], metal, 0.01)
      h += spec.noStrap ? 0 : 0.3
      break
    }
    case 'minaudiere': {
      // An evening minaudière: a small hard case, a jewelled clasp, a fine chain.
      const w = 0.17
      h = 0.1
      mesh(parts, body(w, h, 0.05, 0.05, 0.02, 0.004), L)
      const frame = mesh(parts, new CylinderGeometry(0.003, 0.003, w - 0.01, 8), metal, 0, h * 0.7, 0.026, false)
      frame.rotation.z = PI / 2
      mesh(parts, new SphereGeometry(0.008, 16, 12), metal, 0, h + 0.006, 0, false)
      if (!spec.noStrap) chain(parts, [new Vector3(-w / 2 + 0.01, h, 0), new Vector3(-w / 2 - 0.01, h + 0.08, 0), new Vector3(0, h + 0.12, 0), new Vector3(w / 2 + 0.01, h + 0.08, 0), new Vector3(w / 2 - 0.01, h, 0)], metal, 0.005)
      h += 0.12
      break
    }
    case 'raffia': {
      // A woven raffia tote trimmed in leather: open top, leather handles, a horsebit on the front.
      const w = 0.34
      h = 0.27
      mesh(parts, body(w, h, 0.13, 0.12, 0.02, 0.005), L)
      mesh(parts, body(w - 0.02, 0.006, 0.1, 0.1, 0.01, 0.002), m.lining, 0, h - 0.035, 0)
      mesh(parts, body(w + 0.004, 0.025, 0.124, 0.124, 0.006, 0.002), trim, 0, h - 0.025, 0)
      horsebit(parts, 0, h * 0.62, 0.066, metal)
      for (const sz of [-1, 1]) handle(parts, -0.07, 0.07, h, sz * 0.055, 0.12, 0.007, trim)
      h += 0.12
      break
    }
  }
  // Every part but the flap merged by material: a bag of a few draws.
  g.userData.h = h
  return { g, parts, h }
}
