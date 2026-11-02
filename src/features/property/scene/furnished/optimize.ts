import { Group, Mesh, type BufferGeometry, type Material, type Object3D } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { computeBoundsTree } from 'three-mesh-bvh'

/*
 * Real-time cost control for furnished design models. Built in code, a model is thousands of
 * small meshes (every panel, batten and handle), and each mesh is a draw call, and another per
 * shadow pass. Everything that never moves is merged into one mesh per material; anything the
 * viewer operates or picks by name (doors, drawers, switches, the fan, room hotspots) stays as
 * it is, so interactions are untouched.
 */

/** Nodes the viewer finds by name: kept whole, with everything beneath them. */
const LIVE = /^(door_|drawer_|switch_|spin_|room_|amenity_|floor_|roof$)/

const KEEP = ['position', 'normal', 'uv'] as const

function signature(g: BufferGeometry) {
  return `${g.index ? 'i' : 'n'}|${KEEP.filter((a) => g.attributes[a]).join(',')}`
}

function reverseWinding(g: BufferGeometry) {
  if (g.index) {
    const index = g.index
    for (let i = 0; i + 2 < index.count; i += 3) {
      const a = index.getX(i)
      index.setX(i, index.getX(i + 2))
      index.setX(i + 2, a)
    }
    return
  }
  for (const attr of Object.values(g.attributes)) {
    const { itemSize, array } = attr
    for (let i = 0; i + 2 < attr.count; i += 3)
      for (let c = 0; c < itemSize; c++) {
        const p = i * itemSize + c
        const q = (i + 2) * itemSize + c
        const t = array[p]
        ;(array as Float32Array)[p] = array[q]
        ;(array as Float32Array)[q] = t
      }
  }
}

/**
 * Merges the static meshes under `root` by material (and shadow flags), in `root`'s frame.
 * Transparent meshes and anything with a custom render order stay separate, so sorting and
 * overlays behave as before. Returns how many meshes went in and how many came out.
 */
export function mergeStatic(root: Group) {
  root.updateMatrixWorld(true)
  const toRoot = root.matrixWorld.clone().invert()
  const buckets = new Map<string, { material: Material; cast: boolean; receive: boolean; parts: BufferGeometry[] }>()
  const merged: Mesh[] = []

  const visit = (o: Object3D) => {
    if (LIVE.test(o.name)) return
    for (const child of o.children) visit(child)
    if (!(o instanceof Mesh) || Array.isArray(o.material) || !o.visible) return
    const material = o.material as Material
    // Transparent pieces normally stay separate so they sort; small ones that never overlap (glassware
    // standing on shelves and tables) opt in with `userData.mergeable` and merge like the rest.
    if ((material.transparent && !material.userData.mergeable) || o.renderOrder !== 0 || o.geometry.morphAttributes.position) return
    const g = o.geometry.clone()
    for (const name of Object.keys(g.attributes)) if (!(KEEP as readonly string[]).includes(name)) g.deleteAttribute(name)
    if (!g.attributes.normal) g.computeVertexNormals()
    const matrix = toRoot.clone().multiply(o.matrixWorld)
    g.applyMatrix4(matrix)
    // A mirrored parent turns the triangles inside out once baked; the renderer can't tell any more.
    if (matrix.determinant() < 0) reverseWinding(g)
    g.clearGroups()
    const key = `${material.uuid}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}|${signature(g)}`
    let b = buckets.get(key)
    if (!b) buckets.set(key, (b = { material, cast: o.castShadow, receive: o.receiveShadow, parts: [] }))
    b.parts.push(g)
    merged.push(o)
  }
  visit(root)

  const before = merged.length
  for (const m of merged) m.removeFromParent()
  const statics = new Group()
  statics.name = 'static'
  for (const { material, cast, receive, parts } of buckets.values()) {
    const geometry = parts.length === 1 ? parts[0] : mergeGeometries(parts, false)
    for (const p of parts) if (p !== geometry) p.dispose()
    if (!geometry) continue
    const mesh = new Mesh(geometry, material)
    mesh.castShadow = cast
    mesh.receiveShadow = receive
    statics.add(mesh)
  }
  root.add(statics)
  return { before, after: statics.children.length }
}

/** Builds raycast acceleration trees ahead of time, so the first hover or tap isn't a stall. */
export function prepareRaycast(root: Object3D) {
  root.traverse((o) => {
    if (!(o instanceof Mesh) || o.geometry.boundsTree) return
    o.geometry.computeBoundsTree = computeBoundsTree
    o.geometry.computeBoundsTree()
  })
}
