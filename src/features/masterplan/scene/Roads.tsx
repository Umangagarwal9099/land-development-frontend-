import { useCursor } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { InstancedMesh, Object3D, ShapeGeometry } from 'three'
import type { Point2, Road } from '../../../api/types'
import { GOLD } from '../../../lib/palette'
import { toShape } from './plotGeometry'

const ROAD_Y = 0.03
const TAP_TOLERANCE_PX = 8

interface Props {
  roads: Road[]
  selectedId: string | null
  interactive: boolean
  onSelect: (road: Road) => void
}

/** Asphalt strips with dashed centre lines; each road is tappable for its name and width. */
export function Roads({ roads, selectedId, interactive, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  useCursor(hovered !== null)

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
    </group>
  )
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
