import { BufferGeometry, CircleGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Path, Shape, ShapeGeometry, type Material, type Object3D } from 'three'
import type { Kit } from '../kit'

/*
 * A wall-hung, rimless toilet like the reference's (concealed cistern behind the tiled box), built
 * from its real cross-sections rather than a rounded box: the bowl is squared off where it meets
 * the wall and runs out to an elongated oval front, narrowing towards a softly rounded underside
 * and rolling over into a glazed rim; inside, the bowl funnels down to the water. The slim seat
 * and soft-close lid are separate parts on chrome hinges, and open (`door_toilet_*`, about x).
 * Built facing +z from the wall plane (z = 0), y from the floor.
 */

const W2 = 0.18 // half width
const L = 0.53 // projection from the wall
const BOTTOM = 0.2 // underside, at the wall
const RIM = 0.4 // top of the ceramic rim

/** Plan outline at a given scale: squared at the wall (z = 0), elongated oval to the front. */
function plan(t: number, a: number, len: number): [number, number] {
  // t ∈ [0, 1] runs from the wall on the left, round the front, back to the wall on the right.
  const th = Math.PI * t
  const c = Math.cos(th)
  const s = Math.sin(th)
  const x = -a * Math.sign(c) * Math.pow(Math.abs(c), 0.7)
  const z = len * Math.pow(s, 0.55)
  return [x, z]
}

function grid(rows: number, cols: number, at: (i: number, j: number) => [number, number, number], flip = false) {
  const pos: number[] = []
  for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) pos.push(...at(i, j))
  const idx: number[] = []
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j
      const b = a + cols + 1
      if (flip) idx.push(a, a + 1, b, a + 1, b + 1, b)
      else idx.push(a, b, a + 1, a + 1, b, b + 1)
    }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

const ease = (t: number) => t * t * (3 - 2 * t)

/** Outer body: from the underside up to the rim, its section growing and rounding as it rises. */
function body() {
  const rows = 22
  const cols = 64
  return grid(rows, cols, (i, j) => {
    const u = i / rows
    // Narrow and short at the underside; the sides swell as they rise, rolling in just under the rim.
    const y = BOTTOM + (RIM - BOTTOM) * u
    const swell = 0.62 + 0.38 * ease(Math.min(1, u * 1.4)) - 0.03 * Math.max(0, u - 0.9) * 10
    const reach = 0.55 + 0.45 * ease(Math.min(1, u * 1.25))
    const [x, z] = plan(j / cols, W2 * swell, L * reach)
    return [x, y, z]
  }, true)
}

/** The bowl's opening: a closed, slightly egg-shaped oval (wider to the front), clear of the wall. */
const OPEN = { ax: 0.125, az: 0.2, cz: 0.27 }
function oval(th: number, ax: number, az: number, cz: number): [number, number] {
  const c = Math.cos(th)
  return [ax * Math.sin(th) * (1 - 0.08 * c), cz - az * c]
}

/** Plan outline as a flat shape (plan z → shape −y), from the wall round the front and back. */
function outline(a: number, len: number, back = 0, n = 48) {
  const s = new Shape()
  for (let i = 0; i <= n; i++) {
    const [x, z] = plan(i / n, a, len)
    // A seat's back edge sits at its hinge line, so little of it swings down behind the hinge.
    if (i === 0) s.moveTo(x, -Math.max(z, back))
    else s.lineTo(x, -Math.max(z, back))
  }
  s.closePath()
  return s
}

function ovalPath(ax: number, az: number, cz: number, n = 48) {
  const h = new Path()
  for (let i = 0; i <= n; i++) {
    const [x, z] = oval((i / n) * Math.PI * 2, ax, az, cz)
    if (i === 0) h.moveTo(x, -z)
    else h.lineTo(x, -z)
  }
  return h
}

/** The rim's top: a flat glazed band from the outer edge in to the bowl's opening. */
function rimTop() {
  const s = outline(W2, L)
  s.holes.push(ovalPath(OPEN.ax, OPEN.az, OPEN.cz))
  const g = new ShapeGeometry(s, 4)
  g.rotateX(-Math.PI / 2)
  g.translate(0, RIM, 0)
  return g
}

/** The glazed bowl, funnelling down from the opening to the trap, its lowest point towards the back. */
const BOWL_DEPTH = 0.2
const bowlAt = (u: number) => {
  const k = 1 - 0.72 * ease(u)
  return { ax: OPEN.ax * k, az: OPEN.az * k, cz: OPEN.cz - 0.05 * u, y: RIM - BOWL_DEPTH * Math.pow(u, 0.85) }
}
function bowl() {
  const rows = 14
  const cols = 64
  return grid(rows + 1, cols, (i, j) => {
    // The last row closes the bottom of the trap at its centre.
    const r = bowlAt(Math.min(i, rows) / rows)
    const [x, z] = i > rows ? [0, r.cz] : oval((j / cols) * Math.PI * 2, r.ax, r.az, r.cz)
    return [x, i > rows ? r.y - 0.01 : r.y, z]
  }, true)
}

/** Seat (a ring round the opening) or lid (solid), in plan at the rim's outline. */
function seatShape(lid: boolean, back = 0) {
  const s = outline(W2 * 0.985, L * 0.985, back)
  if (!lid) s.holes.push(ovalPath(OPEN.ax * 0.98, OPEN.az * 0.97, OPEN.cz + 0.005))
  return s
}

export function wallHungToilet(k: Kit, parent: Object3D, x: number, wallZ: number) {
  // Vitreous china: bright white with a hard glaze. Double-sided, as the lofted shells are open.
  const ceramic = new MeshPhysicalMaterial({ color: '#f6f5f1', roughness: 0.16, clearcoat: 0.7, clearcoatRoughness: 0.12, side: DoubleSide })
  const seatMat = new MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.28 })
  const chrome = new MeshStandardMaterial({ color: '#d4d7da', roughness: 0.12, metalness: 1 })
  const water = new MeshPhysicalMaterial({ color: '#b7cfd2', roughness: 0.02, transparent: true, opacity: 0.4, clearcoat: 1 })
  const g = new Group()
  g.position.set(x, 0, wallZ)
  parent.add(g)
  const add = (geo: BufferGeometry, mat: Material) => {
    const m = new Mesh(geo, mat)
    m.castShadow = m.receiveShadow = true
    g.add(m)
    return m
  }
  add(body(), ceramic)
  add(rimTop(), ceramic)
  add(bowl(), ceramic)
  // The underside, closed with a gently domed plate.
  add(grid(6, 64, (i, j) => {
    const [px, pz] = plan(j / 64, W2 * 0.62 * (1 - i / 6), L * 0.55 * (1 - i / 6))
    return [px, BOTTOM + 0.012 * (i / 6), pz * (1 - i / 6) + (L * 0.2 * i) / 6]
  }), ceramic)
  // Standing water in the trap, its edge just inside the glaze.
  const wl = bowlAt(0.74)
  const w = new Mesh(new CircleGeometry(1, 40), water)
  w.rotation.x = -Math.PI / 2
  w.scale.set(wl.ax * 0.99, wl.az * 0.99, 1)
  w.position.set(0, wl.y, wl.cz)
  g.add(w)
  // Chrome-capped wall bolts, either side at the back.
  for (const s of [-1, 1]) k.cyl(g, 0.012, 0.012, 0.012, chrome, s * 0.155, 0.27, 0.07, 16).rotation.z = Math.PI / 2

  // Hinge blocks and the two hinged parts, each pivoting about x at the back of the rim. The lid's
  // hinge line is behind the seat's and it opens a little further, so raised, the two stand one
  // behind the other against the wall instead of passing through each other.
  for (const s of [-1, 1]) k.box(g, 0.03, 0.016, 0.045, chrome, s * 0.085, RIM + 0.008, 0.045)
  const hinged = (name: string, lid: boolean, y: number, z: number, thick: number, angle: number) => {
    const pivot = new Group()
    pivot.name = name
    pivot.position.set(0, y, z)
    pivot.userData.axis = 'x'
    pivot.userData.openAngle = angle
    g.add(pivot)
    const geo = new ExtrudeGeometry(seatShape(lid, z - 0.012), { depth: thick - 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.005, bevelSegments: 3, curveSegments: 6 })
    geo.rotateX(-Math.PI / 2)
    const m = new Mesh(geo, seatMat)
    m.position.set(0, 0.004, -z)
    m.castShadow = m.receiveShadow = true
    m.userData.front = true
    pivot.add(m)
    k.cyl(pivot, 0.008, 0.008, 0.2, chrome, 0, 0.004, 0, 12).rotation.z = Math.PI / 2
    return pivot
  }
  const seat = hinged('door_toilet_seat', false, RIM + 0.004, 0.06, 0.022, -1.42)
  const lid = hinged('door_toilet_lid', true, RIM + 0.028, 0.035, 0.024, -1.56)
  // A seat can only lift with the lid up, and a lid closing brings the seat down with it.
  seat.userData.alsoOpen = [lid]
  lid.userData.alsoClose = [seat]
  return g
}
