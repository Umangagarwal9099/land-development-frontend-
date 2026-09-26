import type { Point2 } from '../api/types'
import type { Box2 } from '../store/masterplan'

// Plain 2D plan maths, free of three.js so DOM screens can use it without the 3D chunk.

export function centroid(polygon: Point2[]): Point2 {
  const x = polygon.reduce((s, p) => s + p[0], 0) / polygon.length
  const z = polygon.reduce((s, p) => s + p[1], 0) / polygon.length
  return [x, z]
}

export function bounds(polygons: Point2[][]): Box2 {
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity
  for (const poly of polygons)
    for (const [x, z] of poly) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x)
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z)
    }
  return { minX, minZ, maxX, maxZ }
}

export const blockOf = (plotNumber: string) => plotNumber.split('-')[0]

export const padBox = (b: Box2, m: number): Box2 => ({ minX: b.minX - m, minZ: b.minZ - m, maxX: b.maxX + m, maxZ: b.maxZ + m })
