import { BoxGeometry, ExtrudeGeometry, Mesh, Path, Shape, ShapeGeometry, Vector2, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'

/*
 * Plan-drawn solids for the mall: slabs, roofs and paving laid from (x, z) polygons. Their UVs are
 * plan coordinates in metres, so a material whose map repeats once per metre lays at true scale.
 */

const shapeOf = (poly: Point2[], flip: number, holes: Point2[][] = []) => {
  const s = new Shape(poly.map(([x, z]) => new Vector2(x, flip * z)))
  for (const h of holes) s.holes.push(new Path(h.map(([x, z]) => new Vector2(x, flip * z))))
  return s
}

const add = (parent: Object3D, mesh: Mesh, cast: boolean, name: string) => {
  mesh.castShadow = cast
  mesh.receiveShadow = true
  mesh.name = name
  parent.add(mesh)
  return mesh
}

/** A level slab from y0 to y1; `mat` may be [top and underside, edges]. */
export function slab(parent: Object3D, poly: Point2[], y0: number, y1: number, mat: Material | Material[], holes: Point2[][] = [], cast = true, name = '') {
  const g = new ExtrudeGeometry(shapeOf(poly, -1, holes), { depth: y1 - y0, bevelEnabled: false, curveSegments: 2 })
  g.rotateX(-Math.PI / 2)
  g.translate(0, y0, 0)
  return add(parent, new Mesh(g, mat), cast, name)
}

/** A flat surface at height y, facing up (or down, for ceilings). */
export function sheet(parent: Object3D, poly: Point2[], y: number, mat: Material, down = false, holes: Point2[][] = [], name = '') {
  const g = new ShapeGeometry(shapeOf(poly, down ? 1 : -1, holes), 2)
  g.rotateX(down ? Math.PI / 2 : -Math.PI / 2)
  g.translate(0, y, 0)
  return add(parent, new Mesh(g, mat), false, name)
}

/** Axis-aligned rectangle [x0, x1] × [z0, z1] as a plan polygon. */
export const rect = (x0: number, x1: number, z0: number, z1: number): Point2[] => [
  [x0, z0],
  [x1, z0],
  [x1, z1],
  [x0, z1],
]

/** The largest z of a polygon's boundary where it crosses x (its front edge there). */
export function frontAt(poly: Point2[], x: number) {
  let best = -Infinity
  for (let i = 0; i < poly.length; i++) {
    const [ax, az] = poly[i]
    const [bx, bz] = poly[(i + 1) % poly.length]
    if ((ax - x) * (bx - x) > 0 || ax === bx) continue
    best = Math.max(best, az + ((bz - az) * (x - ax)) / (bx - ax))
  }
  return best
}

/**
 * A box whose UVs are in metres on every face, so true-scale finishes (stone, paving, render) lay at
 * their real size on a step or a planter instead of stretching once across each face.
 */
export function metricBox(w: number, h: number, d: number) {
  const g = new BoxGeometry(w, h, d)
  const uv = g.getAttribute('uv')
  // Faces in BoxGeometry order: ±x, ±y, ±z, four vertices each.
  const spans = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  for (let f = 0; f < 6; f++)
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v
      uv.setXY(i, uv.getX(i) * spans[f][0], uv.getY(i) * spans[f][1])
    }
  return g
}
