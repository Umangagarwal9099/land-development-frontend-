import { BufferAttribute, BufferGeometry, Color, ExtrudeGeometry, Shape, ShapeGeometry, Vector2 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { AvailabilityStatus, Plot, Point2 } from '../../../api/types'
import { bounds, centroid } from '../../../lib/geometry'
import { GOLD_BRIGHT, statusColor } from '../../../lib/palette'

export const PLOT_HEIGHT = 0.3
const PLOT_GAP_M = 0.35

const SELECTED = new Color(GOLD_BRIGHT)
// Filtered-out plots sink into the site base rather than disappearing, so the layout still reads.
const FILTERED_OUT = new Color('#1c1f21')
const HOVER_LIFT = 0.18
const WHITE = new Color('#ffffff')

/** Plan coordinates are (x, z) on the ground; three.js shapes live in XY, so y = -z before rotating flat. */
export function toShape(polygon: Point2[]): Shape {
  return new Shape(polygon.map(([x, z]) => new Vector2(x, -z)))
}

/** Shrinks a polygon toward its centre so neighbouring plots show a visible boundary line. */
export function inset(polygon: Point2[]): Point2[] {
  const [cx, cz] = centroid(polygon)
  const b = bounds([polygon])
  const s = 1 - (2 * PLOT_GAP_M) / Math.min(b.maxX - b.minX, b.maxZ - b.minZ)
  return polygon.map(([x, z]) => [cx + (x - cx) * s, cz + (z - cz) * s])
}

export interface PlotMeshData {
  geometry: BufferGeometry
  /** Plot index for every vertex — maps a raycast hit (face.a) back to its plot. */
  plotIndexByVertex: Uint32Array
  /** First vertex and vertex count of each plot, for repainting one plot's colour. */
  ranges: { start: number; count: number }[]
}

/**
 * Builds every plot into ONE merged mesh: 500 plots cost one draw call instead of 500,
 * and statuses are repainted by rewriting vertex colours — no geometry rebuild.
 */
export function buildPlotMesh(plots: Plot[]): PlotMeshData {
  const parts = plots.map((p) => {
    const g = new ExtrudeGeometry(toShape(inset(p.polygon)), { depth: PLOT_HEIGHT, bevelEnabled: false })
    g.rotateX(-Math.PI / 2)
    return g.index ? g.toNonIndexed() : g
  })

  const ranges: PlotMeshData['ranges'] = []
  let start = 0
  for (const g of parts) {
    const count = g.getAttribute('position').count
    ranges.push({ start, count })
    start += count
  }

  const geometry = mergeGeometries(parts)!
  parts.forEach((g) => g.dispose())

  const plotIndexByVertex = new Uint32Array(start)
  ranges.forEach((r, i) => plotIndexByVertex.fill(i, r.start, r.start + r.count))
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(start * 3), 3))

  return { geometry, plotIndexByVertex, ranges }
}

export function paintPlots(
  data: PlotMeshData,
  plots: Plot[],
  selectedId: string | null,
  hoveredId: string | null,
  visibleStatuses: Set<AvailabilityStatus>,
) {
  const colors = data.geometry.getAttribute('color') as BufferAttribute
  const c = new Color()
  plots.forEach((plot, i) => {
    if (plot.id === selectedId) c.copy(SELECTED)
    else if (!visibleStatuses.has(plot.status)) c.copy(FILTERED_OUT)
    else c.set(statusColor[plot.status])
    if (plot.id === hoveredId && plot.id !== selectedId) c.lerp(WHITE, HOVER_LIFT)
    const { start, count } = data.ranges[i]
    for (let v = start; v < start + count; v++) colors.setXYZ(v, c.r, c.g, c.b)
  })
  colors.needsUpdate = true
}

/** Flat merged geometry for roads/parks, lifted to `y`. */
export function buildFlatGeometry(polygons: Point2[][], y: number): BufferGeometry {
  const parts = polygons.map((poly) => {
    const g = new ShapeGeometry(toShape(poly))
    g.rotateX(-Math.PI / 2)
    g.translate(0, y, 0)
    return g
  })
  const merged = mergeGeometries(parts)!
  parts.forEach((g) => g.dispose())
  return merged
}
