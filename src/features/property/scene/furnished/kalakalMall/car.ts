import { BoxGeometry, Color, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Shape, TorusGeometry, Vector2, type BufferGeometry, type Material, type Object3D } from 'three'

/*
 * Parked cars drawn from real side profiles (a compact crossover and a sedan, at Indian-market
 * sizes): the body extruded from its silhouette with rounded edges and true wheel arches, a
 * glasshouse with pillars, glass set into the body line, lamps, grille, mirrors, door shut lines,
 * and wheels with tyres, alloy spokes and brake discs. Front is +z, as for every piece here.
 */

type Body = 'crossover' | 'sedan'

interface Profile {
  length: number
  width: number
  wheelbase: number
  /** Silhouette from the rear bumper's foot over the roof to the front bumper's foot, as (x along, y up). */
  top: [number, number][]
  /** Side windows: rear and front panes, split by the B-pillar. */
  windows: [number, number][][]
  /** Windscreen and backlight, as their bottom and top points on the profile. */
  screen: [[number, number], [number, number]]
  backlight: [[number, number], [number, number]]
}

const PROFILES: Record<Body, Profile> = {
  crossover: {
    length: 4.35, width: 1.8, wheelbase: 2.6,
    top: [[-2.17, 0.36], [-2.2, 0.7], [-2.16, 0.98], [-2.04, 1.14], [-1.86, 1.55], [-1.6, 1.64], [-0.6, 1.67], [0.35, 1.64], [0.62, 1.52], [1.05, 1.15], [1.75, 1.0], [2.1, 0.88], [2.18, 0.62], [2.14, 0.36]],
    windows: [[[-1.8, 1.17], [-1.66, 1.5], [-1.45, 1.57], [-0.32, 1.59], [-0.32, 1.17]], [[-0.2, 1.17], [-0.2, 1.59], [0.33, 1.58], [0.55, 1.47], [0.93, 1.17]]],
    screen: [[1.02, 1.17], [0.42, 1.61]],
    backlight: [[-2.0, 1.17], [-1.84, 1.55]],
  },
  sedan: {
    length: 4.45, width: 1.74, wheelbase: 2.62,
    top: [[-2.2, 0.36], [-2.24, 0.66], [-2.2, 0.92], [-2.0, 1.02], [-1.55, 1.07], [-1.05, 1.42], [-0.45, 1.47], [0.25, 1.45], [0.55, 1.36], [1.0, 1.06], [1.8, 0.92], [2.15, 0.82], [2.22, 0.6], [2.16, 0.36]],
    windows: [[[-1.4, 1.08], [-1.05, 1.36], [-0.45, 1.41], [-0.3, 1.41], [-0.3, 1.08]], [[-0.18, 1.08], [-0.18, 1.41], [0.24, 1.4], [0.5, 1.32], [0.9, 1.08]]],
    screen: [[0.97, 1.08], [0.32, 1.42]],
    backlight: [[-1.5, 1.08], [-1.08, 1.39]],
  },
}

const WHEEL_R = 0.33
const ARCH_R = 0.4

/** The body's side silhouette with its two wheel arches cut from the sill line. */
function silhouette(p: Profile) {
  const s = new Shape()
  const front = p.wheelbase / 2
  const rear = -p.wheelbase / 2
  // Straight panels meeting at small radiused corners, as pressed steel does (a spline would melt them).
  const pts = p.top
  s.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i]
    const [ax, ay] = pts[i - 1]
    const [bx, by] = pts[i + 1]
    const la = Math.hypot(px - ax, py - ay)
    const lb = Math.hypot(bx - px, by - py)
    const r = Math.min(0.14, la * 0.4, lb * 0.4)
    s.lineTo(px + ((ax - px) / la) * r, py + ((ay - py) / la) * r)
    s.quadraticCurveTo(px, py, px + ((bx - px) / lb) * r, py + ((by - py) / lb) * r)
  }
  s.lineTo(...pts[pts.length - 1])
  const sill = 0.36
  s.lineTo(front + ARCH_R + 0.06, sill)
  s.absarc(front, WHEEL_R, ARCH_R, 0.12, Math.PI - 0.12, false)
  s.lineTo(rear + ARCH_R, sill)
  s.absarc(rear, WHEEL_R, ARCH_R, 0.12, Math.PI - 0.12, false)
  s.lineTo(p.top[0][0], sill)
  return s
}

const extrude = (shape: Shape, depth: number, bevel: number) => {
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 18 })
  g.translate(0, 0, -depth / 2)
  // Profile x runs along the car: turn it to local +z.
  g.rotateY(-Math.PI / 2)
  return g
}

const shared = new Map<string, Material>()
const mat = (key: string, make: () => Material) => {
  let m = shared.get(key)
  if (!m) shared.set(key, (m = make()))
  return m
}

/** A parked car of `body` and paint colour, its rear axle-centre at the group origin's offset. */
export function parkedCar(parent: Object3D, body: Body, paint: string, x: number, z: number, yaw: number, y = 0) {
  const p = PROFILES[body]
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = yaw
  parent.add(g)
  const add = (geo: BufferGeometry, m: Material, px = 0, py = 0, pz = 0, cast = true) => {
    const mesh = new Mesh(geo, m)
    mesh.position.set(px, py, pz)
    mesh.castShadow = cast
    mesh.receiveShadow = true
    g.add(mesh)
    return mesh
  }
  // Solid whites and blacks are plain pigment under clearcoat; greys, silvers and colours are metallic.
  const light = new Color(paint).getHSL({ h: 0, s: 0, l: 0 }).l
  const paintMat = new MeshPhysicalMaterial({ color: paint, metalness: light > 0.85 || light < 0.15 ? 0.05 : 0.6, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.05 })
  const glass = mat('glass', () => new MeshPhysicalMaterial({ color: '#0d1116', metalness: 0.1, roughness: 0.04, clearcoat: 1, ior: 1.52 }))
  const trim = mat('trim', () => new MeshStandardMaterial({ color: '#141518', roughness: 0.75 }))
  const chrome = mat('chrome', () => new MeshStandardMaterial({ color: '#c9ccd0', metalness: 1, roughness: 0.18 }))
  const alloy = mat('alloy', () => new MeshStandardMaterial({ color: '#a4a8ad', metalness: 0.9, roughness: 0.32 }))
  const tyre = mat('tyre', () => new MeshStandardMaterial({ color: '#1a1a1b', roughness: 0.92 }))
  const disc = mat('disc', () => new MeshStandardMaterial({ color: '#5e5a55', metalness: 0.7, roughness: 0.55 }))
  const lamp = mat('lamp', () => new MeshPhysicalMaterial({ color: '#e9eef2', metalness: 0.2, roughness: 0.05, clearcoat: 1 }))
  const tail = mat('tail', () => new MeshPhysicalMaterial({ color: '#7a0d10', roughness: 0.15, clearcoat: 1, emissive: '#3a0000', emissiveIntensity: 0.4 }))
  const seam = mat('seam', () => new MeshStandardMaterial({ color: '#0b0b0c', roughness: 0.9 }))

  const w = p.width - 0.12
  add(extrude(silhouette(p), w - 0.06, 0.035), paintMat)
  // Side glass set just inside the body line, so the pillars stand proud of it.
  for (const pane of p.windows) {
    const s = new Shape(pane.map(([a, b]) => new Vector2(a, b)))
    add(extrude(s, w + 0.03, 0.008), glass, 0, 0, 0, false)
  }
  // Windscreen and backlight: panes laid along the profile's slopes.
  for (const [[ax, ay], [bx, by]] of [p.screen, p.backlight]) {
    const len = Math.hypot(bx - ax, by - ay)
    const pane = add(new BoxGeometry(w - 0.16, 0.012, len), glass, 0, (ay + by) / 2 + 0.012, (ax + bx) / 2, false)
    pane.rotation.x = Math.atan2(-(by - ay), bx - ax)
  }
  // Black lower cladding: sills and bumper inserts.
  for (const side of [-1, 1]) add(new BoxGeometry(0.03, 0.12, p.wheelbase - 2 * ARCH_R - 0.06), trim, side * (w / 2 + 0.05), 0.42, 0)
  add(new BoxGeometry(w - 0.3, 0.14, 0.06), trim, 0, 0.46, p.length / 2 - 0.03)
  add(new BoxGeometry(w - 0.3, 0.12, 0.06), trim, 0, 0.44, -p.length / 2 + 0.04)
  // Wheel-arch liners.
  for (const ax of [p.wheelbase / 2, -p.wheelbase / 2])
    for (const side of [-1, 1]) {
      const liner = add(new TorusGeometry(ARCH_R - 0.02, 0.025, 6, 20, Math.PI * 0.85), trim, side * (w / 2 + 0.03), WHEEL_R, ax, false)
      liner.rotation.set(0, Math.PI / 2, Math.PI * 0.075)
    }
  // Front: grille, lamps; rear: light bar and number plates.
  const nose = p.length / 2
  add(new BoxGeometry(w * 0.55, 0.18, 0.04), trim, 0, body === 'crossover' ? 0.72 : 0.64, nose - 0.04)
  add(new BoxGeometry(w * 0.56, 0.02, 0.045), chrome, 0, body === 'crossover' ? 0.82 : 0.73, nose - 0.04)
  for (const side of [-1, 1]) {
    const head = add(new BoxGeometry(0.4, 0.09, 0.08), lamp, side * (w / 2 - 0.25), body === 'crossover' ? 0.88 : 0.78, nose - 0.08, false)
    head.rotation.y = side * 0.25
  }
  add(new BoxGeometry(w - 0.1, 0.07, 0.04), tail, 0, body === 'crossover' ? 1.0 : 0.9, -nose + 0.02, false)
  for (const zz of [nose - 0.005, -nose + 0.005]) add(new BoxGeometry(0.5, 0.12, 0.01), mat('plate', () => new MeshStandardMaterial({ color: '#f2f0e6', roughness: 0.5 })), 0, 0.55, zz + Math.sign(zz) * 0.01, false)
  // Mirrors, door shut lines and handles.
  for (const side of [-1, 1]) {
    add(new BoxGeometry(0.2, 0.1, 0.13), paintMat, side * (w / 2 + 0.1), body === 'crossover' ? 1.2 : 1.1, 0.85)
    for (const at of [-0.26, 0.92]) add(new BoxGeometry(0.004, body === 'crossover' ? 0.7 : 0.6, 0.006), seam, side * (w / 2 + 0.012), body === 'crossover' ? 0.8 : 0.75, at, false)
    for (const at of [-0.55, 0.45]) add(new BoxGeometry(0.02, 0.025, 0.16), chrome, side * (w / 2 + 0.02), body === 'crossover' ? 1.06 : 0.97, at, false)
  }
  // Wheels: tyre with sidewall, five-spoke alloy, brake disc behind.
  const tyreGeo = new CylinderGeometry(WHEEL_R, WHEEL_R, 0.21, 32)
  tyreGeo.rotateZ(Math.PI / 2)
  const rimGeo = new CylinderGeometry(0.22, 0.22, 0.02, 28)
  rimGeo.rotateZ(Math.PI / 2)
  const discGeo = new CylinderGeometry(0.16, 0.16, 0.02, 20)
  discGeo.rotateZ(Math.PI / 2)
  for (const ax of [p.wheelbase / 2, -p.wheelbase / 2])
    for (const side of [-1, 1]) {
      const cx = side * (w / 2 - 0.06)
      add(tyreGeo, tyre, cx, WHEEL_R, ax)
      add(discGeo, disc, cx + side * 0.02, WHEEL_R, ax, false)
      add(rimGeo, alloy, cx + side * 0.1, WHEEL_R, ax, false)
      for (let i = 0; i < 5; i++) {
        const spoke = add(new BoxGeometry(0.02, 0.2, 0.05), alloy, cx + side * 0.107, WHEEL_R, ax, false)
        spoke.rotation.x = (i / 5) * Math.PI * 2
        spoke.translateY(0.09)
      }
    }
  // The dark underside between the wheels.
  add(new BoxGeometry(w - 0.1, 0.06, p.length - 0.4), seam, 0, 0.28, 0, false)
  return g
}
