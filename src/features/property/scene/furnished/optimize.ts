import { Group, Mesh, type BufferGeometry, type Color, type Euler, type Material, type Object3D, type Texture, type Vector2 } from 'three'
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
const LIVE = /^(door_|drawer_|switch_|spin_|room_|amenity_|floor_|roof$|void_|autoleaf_)/

const KEEP = ['position', 'normal', 'uv', 'color'] as const

/**
 * What a material looks like, so that identical ones built separately (a fresh material for each
 * panel or handle is the norm in the build code) merge into one draw call. Textures count by their
 * image and placement. Glowing materials are left keyed by identity: the day/night switch drives
 * their brightness one by one, and two that match tonight may not by day.
 */
function look(m: Material): string {
  const e = (m as Material & { emissive?: Color; emissiveIntensity?: number }).emissive
  if (e && e.getHex() !== 0 && ((m as Material & { emissiveIntensity?: number }).emissiveIntensity ?? 0) > 0) return m.uuid
  const parts: string[] = [m.type]
  for (const [k, v] of Object.entries(m)) {
    if (k === 'uuid' || k === 'id' || k === 'name' || k === 'version' || k.startsWith('_')) continue
    if (v === null || v === undefined) continue
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') parts.push(`${k}=${v}`)
    else if ((v as Color).isColor) parts.push(`${k}=${(v as Color).getHexString()}`)
    else if ((v as Texture).isTexture) {
      const t = v as Texture
      parts.push(`${k}=${t.source.uuid}|${t.repeat.x},${t.repeat.y}|${t.offset.x},${t.offset.y}|${t.rotation}|${t.channel}|${t.wrapS},${t.wrapT}|${t.mapping}|${t.colorSpace}|${t.flipY}`)
    } else if ((v as Vector2).isVector2 || (v as Euler).isEuler) parts.push(`${k}=${(v as Vector2 | Euler).toArray().join()}`)
    else if (Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype) parts.push(`${k}=${JSON.stringify(v)}`)
    else return m.uuid
  }
  return parts.join(';')
}

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
 * On the master plan, pieces smaller than this radius are fine detail (interior fittings,
 * garments, tableware): most of a model's triangles, over half of a furnished villa's. They are
 * left undrawn only while they would cover less than a pixel on screen (see DesignUnit).
 */
export const DETAIL_RADIUS = 0.4

/** On the master plan nothing is operated, so only the hotspots need to stay whole. */
export const LIVE_ON_PLAN = /^(room_|amenity_)/

/**
 * Merges the static meshes under `root` by material (and shadow flags), in `root`'s frame.
 * Transparent meshes and anything with a custom render order stay separate, so sorting and
 * overlays behave as before; so do the nodes matching `live`. With `detail`, pieces smaller than
 * that radius (handles, tableware, garments, nozzles) merge into meshes of their own, flagged
 * `userData.detail`, for a viewer that is far off to leave undrawn. Returns how many meshes went
 * in and how many came out.
 */
export function mergeStatic(root: Group, live: RegExp = LIVE, detail = 0) {
  root.updateMatrixWorld(true)
  const toRoot = root.matrixWorld.clone().invert()
  const buckets = new Map<string, { material: Material; cast: boolean; receive: boolean; small: boolean; parts: BufferGeometry[] }>()
  const looks = new Map<Material, string>()
  const merged: Mesh[] = []

  const visit = (o: Object3D) => {
    if (live.test(o.name)) return
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
    let id = looks.get(material)
    if (id === undefined) looks.set(material, (id = look(material)))
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere()
    const small = detail > 0 && o.geometry.boundingSphere!.radius * o.matrixWorld.getMaxScaleOnAxis() < detail
    const key = `${id}|${small ? 's' : ''}${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}|${signature(g)}`
    let b = buckets.get(key)
    if (!b) buckets.set(key, (b = { material, cast: o.castShadow, receive: o.receiveShadow, small, parts: [] }))
    b.parts.push(g)
    merged.push(o)
  }
  visit(root)

  const before = merged.length
  for (const m of merged) m.removeFromParent()
  const statics = new Group()
  statics.name = 'static'
  for (const { material, cast, receive, small, parts } of buckets.values()) {
    const geometry = parts.length === 1 ? parts[0] : mergeGeometries(parts, false)
    for (const p of parts) if (p !== geometry) p.dispose()
    if (!geometry) continue
    const mesh = new Mesh(geometry, material)
    mesh.castShadow = cast
    mesh.receiveShadow = receive
    if (small) mesh.userData.detail = true
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
