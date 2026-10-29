import { CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Path, Quaternion, Shape, Vector2, Vector3, type BufferGeometry, type Material } from 'three'
import { rng, type Paint } from '../textures'
import type { Kit } from '../kit'

/*
 * The counter stool from the kitchen reference: an upholstered seat and a low wrap-around back in
 * warm beige fabric, piped along the seat edge, on four tapered, splayed black steel legs joined
 * by a square footrest, with floor glides. Built in its local frame: front towards +z, floor at
 * y = 0, seat 0.66 m high (for the 0.95 m bar).
 */

const SEAT_H = 0.66

/** Close-woven upholstery: fine slubbed weave in beige, with darker yarns; tiles every 100 mm. */
const weave: Paint = (g, w, h) => {
  const r = rng(211)
  g.fillStyle = '#cbbfb0'
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 2)
    for (let x = 0; x < w; x += 2) {
      const t = (r() - 0.5) * 22 + ((x + y) % 4 === 0 ? 6 : -4)
      g.fillStyle = `rgb(${203 + t},${191 + t},${176 + t})`
      g.fillRect(x, y, 2, 2)
    }
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '150,136,120' : '236,228,216'},${0.25 + r() * 0.3})`
    g.fillRect(r() * w, r() * h, 6 + r() * 18, 1.5)
  }
}

const cache = new WeakMap<Kit, { fabric: MeshPhysicalMaterial; welt: MeshPhysicalMaterial; steel: MeshStandardMaterial; glide: MeshStandardMaterial; seat: BufferGeometry; seam: BufferGeometry; back: BufferGeometry }>()

function roundedRect(w: number, d: number, r: number) {
  const s = new Shape()
  const [x0, y0] = [-w / 2, -d / 2]
  s.moveTo(x0 + r, y0)
  s.lineTo(x0 + w - r, y0)
  s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r)
  s.lineTo(x0 + w, y0 + d - r)
  s.quadraticCurveTo(x0 + w, y0 + d, x0 + w - r, y0 + d)
  s.lineTo(x0 + r, y0 + d)
  s.quadraticCurveTo(x0, y0 + d, x0, y0 + d - r)
  s.lineTo(x0, y0 + r)
  s.quadraticCurveTo(x0, y0, x0 + r, y0)
  return s
}

/** The back in plan: a curved band wrapping the rear of the seat, thickest at the centre. */
function backShape() {
  const s = new Shape()
  const a0 = 0.2
  const a1 = Math.PI - 0.2
  const outer = 0.235
  const inner = 0.2
  s.absarc(0, -0.02, outer, a0, a1, false)
  const p = new Path()
  p.absarc(0, -0.02, inner, a1, a0, true)
  s.curves.push(...p.curves)
  s.closePath()
  return s
}

function materials(k: Kit) {
  let c = cache.get(k)
  if (c) return c
  const map = k.tex.painted(256, 256, weave)
  map.repeat.set(4, 4)
  const normalMap = k.tex.normalPainted('stool_weave', 256, 256, weave, 4, 4)
  const fabric = new MeshPhysicalMaterial({
    map,
    normalMap,
    normalScale: new Vector2(0.35, 0.35),
    roughness: 0.92,
    sheen: 0.7,
    sheenRoughness: 0.55,
    sheenColor: '#f1e8dc',
  })
  const welt = fabric.clone()
  // Piping a shade darker than the cover, as a self-welt reads under light.
  welt.color.set('#a2978a')
  welt.sheen = 0
  // Seat: a soft cushion with fully rounded edges.
  const seat = new ExtrudeGeometry(roundedRect(0.4, 0.37, 0.1), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 6, curveSegments: 16 })
  seat.rotateX(-Math.PI / 2)
  const seam = new ExtrudeGeometry(roundedRect(0.462, 0.432, 0.13), { depth: 0.006, bevelEnabled: false, curveSegments: 16 })
  seam.rotateX(-Math.PI / 2)
  const back = new ExtrudeGeometry(backShape(), { depth: 0.2, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.016, bevelSegments: 6, curveSegments: 28 })
  back.rotateX(-Math.PI / 2)
  c = {
    fabric,
    welt,
    steel: new MeshStandardMaterial({ color: '#141416', roughness: 0.38, metalness: 0.75 }),
    glide: new MeshStandardMaterial({ color: '#2a2a2c', roughness: 0.8 }),
    seat,
    seam,
    back,
  }
  cache.set(k, c)
  return c
}

const UP = new Vector3(0, 1, 0)

/** A tapered round rod from `a` to `b`. */
function rod(parent: Group, a: Vector3, b: Vector3, r0: number, r1: number, mat: Material) {
  const len = a.distanceTo(b)
  const m = new Mesh(new CylinderGeometry(r1, r0, len, 14), mat)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.copy(new Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize()))
  m.castShadow = true
  m.receiveShadow = true
  parent.add(m)
}

export function counterStool(k: Kit, parent: Group, x: number, z: number, ry: number) {
  const c = materials(k)
  const s = new Group()
  s.position.set(x, 0, z)
  s.rotation.y = ry
  parent.add(s)

  // Steel frame: legs splay from under the seat to a wider footprint, joined by the footrest.
  const top = (sx: number, sz: number) => new Vector3(sx * 0.15, SEAT_H - 0.05, sz * 0.14)
  const foot = (sx: number, sz: number) => new Vector3(sx * 0.2, 0.012, sz * 0.19)
  const at = (sx: number, sz: number, y: number) => {
    const a = top(sx, sz)
    const b = foot(sx, sz)
    return b.clone().lerp(a, (y - b.y) / (a.y - b.y))
  }
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  for (const [sx, sz] of corners) {
    rod(s, foot(sx, sz), top(sx, sz), 0.0095, 0.012, c.steel)
    const g = new Mesh(new CylinderGeometry(0.012, 0.012, 0.012, 14), c.glide)
    g.position.copy(foot(sx, sz)).setY(0.006)
    g.receiveShadow = true
    s.add(g)
  }
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i]
    const [bx, bz] = corners[(i + 1) % 4]
    rod(s, at(ax, az, 0.27), at(bx, bz, 0.27), 0.0075, 0.0075, c.steel)
  }
  // Seat pan under the cushion.
  k.box(s, 0.32, 0.02, 0.3, c.steel, 0, SEAT_H - 0.045, 0)

  // Cushion, its piped edge, and the wrap-around back rising from the seat's rear.
  const seat = new Mesh(c.seat, c.fabric)
  seat.position.set(0, SEAT_H - 0.035, 0.01)
  seat.castShadow = seat.receiveShadow = true
  s.add(seat)
  const seam = new Mesh(c.seam, c.welt)
  seam.position.set(0, SEAT_H + 0.012, 0.01)
  s.add(seam)
  const backGroup = new Group()
  backGroup.position.set(0, SEAT_H + 0.02, -0.01)
  // A slight recline.
  backGroup.rotation.x = -0.1
  s.add(backGroup)
  const back = new Mesh(c.back, c.fabric)
  back.castShadow = back.receiveShadow = true
  backGroup.add(back)
}
