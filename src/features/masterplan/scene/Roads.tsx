import { useCursor } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ExtrudeGeometry, InstancedMesh, Object3D, Shape, ShapeGeometry } from 'three'
import type { Plot, Point2, Road } from '../../../api/types'
import { GOLD } from '../../../lib/palette'
import { toShape } from './plotGeometry'

const ROAD_Y = 0.03
const TAP_TOLERANCE_PX = 8

interface Props {
  roads: Road[]
  plots: Plot[]
  selectedId: string | null
  interactive: boolean
  onSelect: (road: Road) => void
}

/** Asphalt strips with dashed centre lines; each road is tappable for its name and width. */
export function Roads({ roads, plots, selectedId, interactive, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  useCursor(hovered !== null)
  const mainAvenue = roads.find((road) => road.id === 'road_avenue')

  return (
    <group>
      {roads.map((road) => (
        <RoadMesh
          key={road.id}
          road={road}
          state={road.id === selectedId ? 'selected' : road.id === hovered ? 'hovered' : 'idle'}
          onClick={(e) => {
            if (!interactive || e.delta > TAP_TOLERANCE_PX) return
            e.stopPropagation()
            onSelect(road)
          }}
          onHover={(on) => interactive && setHovered(on ? road.id : null)}
        />
      ))}
      <LaneMarkings roads={roads} />
      {mainAvenue && <RoadDividers road={mainAvenue} plots={plots} />}
    </group>
  )
}

// Each raised divider spans two adjacent road-facing plot frontages.
const DIVIDER_WIDTH = 2.2
const DIVIDER_HEIGHT = 0.55
const DIVIDER_GAP = 3.6
const PLOT_PAIR_TOLERANCE = 0.5

function roundedRect(w: number, h: number, r: number) {
  const s = new Shape()
  s.moveTo(-w / 2 + r, -h / 2)
  s.lineTo(w / 2 - r, -h / 2)
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
  s.lineTo(w / 2, h / 2 - r)
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
  s.lineTo(-w / 2 + r, h / 2)
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
  s.lineTo(-w / 2, -h / 2 + r)
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
  return s
}

function RoadDividers({ road, plots }: { road: Road; plots: Plot[] }) {
  const segments = useMemo(() => {
    const [a, b] = centreLine(road.polygon)
    const len = dist(a, b)
    const [ux, uz] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len]
    const angle = Math.atan2(-uz, ux)
    const sideEdges = [[road.polygon[0], road.polygon[1]], [road.polygon[3], road.polygon[2]]] as const
    const lineDistance = (p: Point2, p0: Point2, p1: Point2) => {
      const vx = p1[0] - p0[0], vz = p1[1] - p0[1]
      const t = Math.max(0, Math.min(1, ((p[0] - p0[0]) * vx + (p[1] - p0[1]) * vz) / (vx * vx + vz * vz)))
      return Math.hypot(p[0] - (p0[0] + t * vx), p[1] - (p0[1] + t * vz))
    }
    const sides = sideEdges.map(([p0, p1]) => plots.flatMap((plot) => {
      const frontage = plot.polygon.filter((p) => lineDistance(p, p0, p1) < 0.025)
      if (frontage.length < 2) return []
      const ts = frontage.map((p) => (p[0] - a[0]) * ux + (p[1] - a[1]) * uz)
      return [{ start: Math.min(...ts), end: Math.max(...ts) }]
    }).sort((p, q) => p.start - q.start))
    const pairs = sides.map((side) => {
      const out: { start: number; end: number }[] = []
      let run: typeof side = []
      const flush = () => {
        for (let i = 0; i + 1 < run.length; i += 2) {
          out.push({ start: run[i].start, end: run[i + 1].end })
        }
        run = []
      }
      for (const plot of side) {
        if (run.length && plot.start - run[run.length - 1].end > 0.08) flush()
        run.push(plot)
      }
      flush()
      return out
    })
    const result: { x: number; z: number; angle: number; length: number }[] = []
    for (const oneSide of pairs[0]) {
      const otherSide = pairs[1].find((p) => Math.min(oneSide.end, p.end) - Math.max(oneSide.start, p.start) > 1)
      if (!otherSide) continue
      const start = Math.max(oneSide.start, otherSide.start)
      const end = Math.min(oneSide.end, otherSide.end)
      const t = (start + end) / 2
      result.push({ x: a[0] + ux * t, z: a[1] + uz * t, angle, length: end - start })
    }
    // Preserve named plot-pair dividers even where an amenity interrupts the frontage run.
    const plotPairs = [
      ['94', '107'], ['93', '108'], ['284', '285'],
      ['170', '177'], ['188', '189'], ['200', '201'], ['211', '210'],
      ['A-02', 'A-03'],
    ] as const
    for (const [nearLabel, farLabel] of plotPairs) {
      const findPlot = (label: string) => label.startsWith('A-')
        ? plots.find((p) => p.number === label)
        : plots.find((p) => p.number.endsWith(`-${label}`))
      const near = findPlot(nearLabel)
      const far = findPlot(farLabel)
      if (!near || !far) continue
      const interval = (plot: Plot) => {
        const ts = plot.polygon.map((p) => (p[0] - a[0]) * ux + (p[1] - a[1]) * uz)
        return { start: Math.min(...ts), end: Math.max(...ts) }
      }
      const n = interval(near), f = interval(far)
      const gap = Math.max(n.start, f.start) - Math.min(n.end, f.end)
      const start = Math.max(0, gap <= PLOT_PAIR_TOLERANCE ? Math.min(n.start, f.start) : Math.max(n.start, f.start))
      const end = Math.min(len, gap <= PLOT_PAIR_TOLERANCE ? Math.max(n.end, f.end) : Math.min(n.end, f.end))
      if (end - start <= 1) continue
      const t = (start + end) / 2
      if (!result.some((s) => Math.abs(s.x - (a[0] + ux * t)) < 0.5 && Math.abs(s.length - (end - start)) < 0.5)) {
        result.push({ x: a[0] + ux * t, z: a[1] + uz * t, angle, length: end - start })
      }
    }
    return result
  }, [road.polygon, plots])

  return <group>{segments.filter((s) => s.length > DIVIDER_GAP + DIVIDER_WIDTH + 0.5).map((s, i) => <DividerSegment key={i} {...s} />)}</group>
}

function DividerSegment({ x, z, angle, length }: { x: number; z: number; angle: number; length: number }) {
  const visibleLength = Math.max(1, length - DIVIDER_GAP)
  const surround = useMemo(() => {
    const shape = roundedRect(visibleLength, DIVIDER_WIDTH, DIVIDER_WIDTH / 2)
    shape.holes.push(roundedRect(visibleLength - 0.3, DIVIDER_WIDTH - 0.3, (DIVIDER_WIDTH - 0.3) / 2))
    const g = new ExtrudeGeometry(shape, { depth: DIVIDER_HEIGHT, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.035, bevelThickness: 0.025, curveSegments: 8 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [visibleLength])
  const inset = useMemo(() => {
    const g = new ExtrudeGeometry(roundedRect(visibleLength - 0.34, DIVIDER_WIDTH - 0.34, (DIVIDER_WIDTH - 0.34) / 2), { depth: 0.025, bevelEnabled: false, curveSegments: 8 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [visibleLength])
  useEffect(() => () => { surround.dispose(); inset.dispose() }, [surround, inset])
  return <group position={[x, ROAD_Y + 0.005, z]} rotation={[0, angle, 0]}>
    <mesh geometry={surround} castShadow receiveShadow>
      <meshStandardMaterial color="#d0d0ca" roughness={0.86} />
    </mesh>
    <mesh geometry={inset} receiveShadow position={[0, 0.035, 0]}>
      <meshStandardMaterial color="#202124" roughness={0.94} />
    </mesh>
  </group>
}

function RoadMesh({
  road,
  state,
  onClick,
  onHover,
}: {
  road: Road
  state: 'idle' | 'hovered' | 'selected'
  onClick: (e: ThreeEvent<MouseEvent>) => void
  onHover: (on: boolean) => void
}) {
  const geometry = useMemo(() => {
    const g = new ShapeGeometry(toShape(road.polygon))
    g.rotateX(-Math.PI / 2)
    g.translate(0, ROAD_Y, 0)
    return g
  }, [road.polygon])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh
      geometry={geometry}
      receiveShadow
      onClick={onClick}
      onPointerOver={(e) => e.pointerType === 'mouse' && onHover(true)}
      onPointerOut={() => onHover(false)}
    >
      <meshStandardMaterial
        color={state === 'selected' ? '#3a3528' : state === 'hovered' ? '#2a2c30' : '#1c1e21'}
        emissive={state === 'selected' ? GOLD : '#000000'}
        emissiveIntensity={state === 'selected' ? 0.12 : 0}
        roughness={0.95}
      />
    </mesh>
  )
}

const DASH = 3
const GAP = 4

/** All centre-line dashes on the site as one instanced mesh. */
function LaneMarkings({ roads }: { roads: Road[] }) {
  const ref = useRef<InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)

  const dashes = useMemo(() => {
    const out: { x: number; z: number; angle: number }[] = []
    for (const road of roads) {
      const [a, b] = centreLine(road.polygon)
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const [ux, uz] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len]
      const angle = Math.atan2(-uz, ux)
      for (let t = GAP; t + DASH < len - GAP; t += DASH + GAP) {
        const along = t + DASH / 2
        out.push({ x: a[0] + ux * along, z: a[1] + uz * along, angle })
      }
    }
    return out
  }, [roads])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new Object3D()
    o.rotation.x = -Math.PI / 2
    dashes.forEach((d, i) => {
      o.position.set(d.x, ROAD_Y + 0.01, d.z)
      o.rotation.z = d.angle
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    invalidate()
  }, [dashes, invalidate])

  if (dashes.length === 0) return null
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, dashes.length]} raycast={() => null}>
      <planeGeometry args={[DASH, 0.14]} />
      <meshBasicMaterial color="#e9e2d0" transparent opacity={0.35} />
    </instancedMesh>
  )
}

const mid = (p: Point2, q: Point2): Point2 => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
const dist = (p: Point2, q: Point2) => Math.hypot(q[0] - p[0], q[1] - p[1])

/** A four-sided road's centre line runs between the midpoints of its two short ends, whatever its angle. */
function centreLine([p0, p1, p2, p3]: Point2[]): [Point2, Point2] {
  return dist(p0, p1) < dist(p1, p2) ? [mid(p0, p1), mid(p2, p3)] : [mid(p1, p2), mid(p3, p0)]
}
