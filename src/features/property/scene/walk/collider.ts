import { DoubleSide, InstancedMesh, Line3, Matrix3, Matrix4, Mesh, MeshBasicMaterial, Ray, Sphere, Vector3, Box3, type Material, type Object3D } from 'three'
import type { ExtendedTriangle } from 'three-mesh-bvh'

/**
 * Nodes that aren't solid: room hotspots' floor overlays, the earth a basement is cut from in the
 * views from above, and the stand-ins over openings that are shown only until the real way down is.
 */
const GHOST = /^(room_|amenity_|earth$|void_)/

/** Things that show but don't stop a walker: overlays, contact shadows and gauzy sheers. Glass stays solid. */
function isSolid(mesh: Mesh) {
  if (Array.isArray(mesh.material)) return true
  const m = mesh.material as Material
  if (mesh.renderOrder !== 0 || m instanceof MeshBasicMaterial) return false
  return !(m.transparent && m.opacity > 0.5)
}

interface Part {
  mesh: Mesh
  center: Vector3
  radius: number
}

const inverse = new Matrix4()
const normal = new Matrix3()
const world = new Vector3()
const localRay = new Ray()
const seg = new Line3()
const box = new Box3()
const near = new Vector3()
const onSeg = new Vector3()
const push = new Vector3()
const shift = new Vector3()
const reach = new Sphere()

/**
 * The house as a walker meets it: its real geometry, doors and drawers wherever they now stand,
 * tested through the raycast trees the model already prepared. Nothing is duplicated, and only
 * the parts near the walker are ever looked at.
 */
export class Collider {
  private parts: Part[] = []

  constructor(root: Object3D) {
    root.updateMatrixWorld(true)
    const visit = (o: Object3D) => {
      if (GHOST.test(o.name)) return
      // Instanced parts (parked cars) are met through their own collision proxies instead.
      if (o instanceof Mesh && !(o instanceof InstancedMesh) && o.geometry.boundsTree && isSolid(o)) {
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere()
        const s = o.geometry.boundingSphere!
        this.parts.push({ mesh: o, center: s.center, radius: s.radius })
      }
      for (const c of o.children) visit(c)
    }
    visit(root)
  }

  private near(mesh: Part, at: Sphere) {
    world.copy(mesh.center).applyMatrix4(mesh.mesh.matrixWorld)
    const r = mesh.radius + at.radius
    return world.distanceToSquared(at.center) < r * r
  }

  /**
   * Pushes a capsule (the segment `a` … `b`, radius `r`) out of everything it overlaps. Returns
   * the world displacement in `out`; the caller decides which axes to honour.
   */
  capsule(a: Vector3, b: Vector3, r: number, out: Vector3) {
    out.set(0, 0, 0)
    reach.center.copy(a).add(b).multiplyScalar(0.5)
    reach.radius = a.distanceTo(b) / 2 + r
    for (const part of this.parts) {
      if (!this.near(part, reach)) continue
      const { mesh } = part
      inverse.copy(mesh.matrixWorld).invert()
      seg.start.copy(a).add(out).applyMatrix4(inverse)
      seg.end.copy(b).add(out).applyMatrix4(inverse)
      shift.set(0, 0, 0)
      box.makeEmpty().expandByPoint(seg.start).expandByPoint(seg.end).expandByScalar(r)
      mesh.geometry.boundsTree!.shapecast({
        intersectsBounds: (bounds) => bounds.intersectsBox(box),
        intersectsTriangle: (tri: ExtendedTriangle) => {
          tri.closestPointToSegment(seg, near, onSeg)
          const d = near.distanceTo(onSeg)
          if (d >= r || d < 1e-5) return false
          push.subVectors(onSeg, near).multiplyScalar((r - d) / d)
          seg.start.add(push)
          seg.end.add(push)
          shift.add(push)
          return false
        },
      })
      if (shift.lengthSq() > 0) out.add(shift.applyMatrix3(normal.setFromMatrix4(mesh.matrixWorld)))
    }
    return out
  }

  /** Distance to the first surface along a ray, within `far`; Infinity if there is none. */
  raycast(ray: Ray, far: number, ignore?: Object3D) {
    let best = far
    let hit = false
    reach.radius = 0
    for (const part of this.parts) {
      const { mesh } = part
      world.copy(part.center).applyMatrix4(mesh.matrixWorld)
      reach.center.copy(world)
      reach.radius = part.radius
      if (!ray.intersectsSphere(reach)) continue
      if (ignore && isWithin(mesh, ignore)) continue
      inverse.copy(mesh.matrixWorld).invert()
      localRay.copy(ray).applyMatrix4(inverse)
      const i = mesh.geometry.boundsTree!.raycastFirst(localRay, DoubleSide, 0, best)
      if (i && i.distance < best) {
        best = i.distance
        hit = true
      }
    }
    return hit ? best : Infinity
  }
}

function isWithin(o: Object3D, ancestor: Object3D) {
  for (let p: Object3D | null = o; p; p = p.parent) if (p === ancestor) return true
  return false
}
