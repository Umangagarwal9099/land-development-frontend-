import { Edges, useCursor } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useState, type ReactNode } from 'react'
import type { Amenity } from '../../../api/types'
import { bounds, centroid } from '../../../lib/geometry'
import { GOLD, IVORY } from '../../../lib/palette'

const TAP_TOLERANCE_PX = 8

interface Props {
  amenities: Amenity[]
  selectedId: string | null
  interactive: boolean
  onSelect: (amenity: Amenity) => void
}

/** Clubhouse, pools, parks, courts, utilities and the gateway, each a small architectural model. */
export function Amenities({ amenities, selectedId, interactive, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  useCursor(hovered !== null)

  return (
    <>
      {amenities.map((a) => {
        const b = bounds([a.polygon])
        const [x, z] = centroid(a.polygon)
        const w = b.maxX - b.minX
        const d = b.maxZ - b.minZ
        return (
          <group
            key={a.id}
            position={[x, 0, z]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (!interactive || e.delta > TAP_TOLERANCE_PX) return
              e.stopPropagation()
              onSelect(a)
            }}
            onPointerOver={(e) => interactive && e.pointerType === 'mouse' && setHovered(a.id)}
            onPointerOut={() => setHovered(null)}
          >
            <AmenityModel amenity={a} w={w} d={d} />
            {(a.id === selectedId || a.id === hovered) && <Footprint w={w} d={d} strong={a.id === selectedId} />}
          </group>
        )
      })}
    </>
  )
}

function AmenityModel({ amenity, w, d }: { amenity: Amenity; w: number; d: number }) {
  switch (amenity.kind) {
    case 'clubhouse':
      return <Clubhouse w={w} d={d} h={amenity.height || 8} />
    case 'pool':
      return <Pool w={w} d={d} />
    case 'park':
    case 'garden':
      return <Lawn w={w} d={d} withLoop={amenity.kind === 'park'} />
    case 'sports':
      return <Courts w={w} d={d} />
    case 'entrance':
      return <Gateway w={w} d={d} h={amenity.height || 6} />
    case 'utility':
      return <Utility w={w} d={d} h={amenity.height || 3} />
  }
}

function Box({ size, pos, children, shadow = true }: { size: [number, number, number]; pos: [number, number, number]; children: ReactNode; shadow?: boolean }) {
  return (
    <mesh position={pos} castShadow={shadow} receiveShadow>
      <boxGeometry args={size} />
      {children}
    </mesh>
  )
}

const Wall = () => <meshStandardMaterial color={IVORY} roughness={0.7} />
const Glass = () => <meshStandardMaterial color="#1d1a15" roughness={0.15} metalness={0.4} emissive="#ffc774" emissiveIntensity={0.6} />
const Roof = () => <meshStandardMaterial color="#2b2d31" roughness={0.55} />
const Stone = () => <meshStandardMaterial color="#b5a68a" roughness={0.9} />

function Clubhouse({ w, d, h }: { w: number; d: number; h: number }) {
  const g = h * 0.5
  return (
    <group>
      <Box size={[w, 0.4, d]} pos={[0, 0.2, 0]} shadow={false}>
        <Stone />
      </Box>
      <Box size={[w * 0.92, g, d * 0.7]} pos={[0, 0.4 + g / 2, -d * 0.1]}>
        <Wall />
      </Box>
      <Box size={[w * 0.92 + 0.1, g * 0.62, d * 0.7 + 0.1]} pos={[0, 0.4 + g * 0.45, -d * 0.1]}>
        <Glass />
      </Box>
      <Box size={[w * 0.98, 0.35, d * 0.84]} pos={[0, 0.4 + g + 0.17, -d * 0.04]}>
        <Roof />
      </Box>
      <Box size={[w * 0.55, g * 0.9, d * 0.5]} pos={[-w * 0.14, 0.75 + g + (g * 0.9) / 2, -d * 0.15]}>
        <Wall />
      </Box>
      <Box size={[w * 0.55 + 0.1, g * 0.5, d * 0.5 + 0.1]} pos={[-w * 0.14, 0.75 + g + g * 0.45, -d * 0.15]}>
        <Glass />
      </Box>
      <Box size={[w * 0.62, 0.3, d * 0.58]} pos={[-w * 0.14, 0.75 + g * 1.9 + 0.15, -d * 0.15]}>
        <Roof />
      </Box>
    </group>
  )
}

function Pool({ w, d }: { w: number; d: number }) {
  return (
    <group>
      <Box size={[w, 0.3, d]} pos={[0, 0.15, 0]} shadow={false}>
        <Stone />
      </Box>
      <mesh position={[0, 0.31, 0]} receiveShadow>
        <boxGeometry args={[w - 3, 0.04, d - 3]} />
        <meshPhysicalMaterial color="#2a88a8" roughness={0.04} metalness={0.1} clearcoat={1} emissive="#0e4f63" emissiveIntensity={0.6} />
      </mesh>
      {/* Cabanas along the deck. */}
      {[-0.35, 0, 0.35].map((t) => (
        <Box key={t} size={[2.2, 2.4, 2.2]} pos={[t * w, 1.5, -d / 2 + 0.2]}>
          <Wall />
        </Box>
      ))}
    </group>
  )
}

function Lawn({ w, d, withLoop }: { w: number; d: number; withLoop: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[w, 0.12, d]} />
        <meshStandardMaterial color="#2c4630" roughness={1} />
      </mesh>
      {withLoop && (
        // Jogging loop: a flat ellipse ring.
        <mesh rotation-x={-Math.PI / 2} position-y={0.13} scale={[w * 0.42, d * 0.38, 1]} receiveShadow>
          <ringGeometry args={[0.93, 1, 64]} />
          <meshStandardMaterial color="#b9a98a" roughness={1} />
        </mesh>
      )}
      {withLoop && (
        <mesh rotation-x={-Math.PI / 2} position={[w * 0.18, 0.14, d * 0.05]} scale={[w * 0.1, d * 0.12, 1]}>
          <circleGeometry args={[1, 48]} />
          <meshPhysicalMaterial color="#2d6d83" roughness={0.05} clearcoat={1} emissive="#0c3a48" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  )
}

function Courts({ w, d }: { w: number; d: number }) {
  const n = 4
  const cw = (w - 4) / n
  return (
    <group>
      <Box size={[w, 0.1, d]} pos={[0, 0.05, 0]} shadow={false}>
        <meshStandardMaterial color="#232628" roughness={1} />
      </Box>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-w / 2 + 2 + cw * (i + 0.5), 0.12, 0]} receiveShadow>
          <boxGeometry args={[cw - 2, 0.04, d - 6]} />
          <meshStandardMaterial color={i % 2 ? '#8e4f37' : '#2f5b73'} roughness={0.9} />
          <Edges color="#f1ece2" />
        </mesh>
      ))}
      <Box size={[w * 0.18, 4, 5]} pos={[0, 2, -d / 2 + 2.5]}>
        <Wall />
      </Box>
    </group>
  )
}

/** Pillars stand either side of the road, across the footprint's long side. */
function Gateway({ w: fw, d: fd, h }: { w: number; d: number; h: number }) {
  const across = fd > fw
  const [w, d] = across ? [fd, fw] : [fw, fd]
  return (
    <group rotation-y={across ? Math.PI / 2 : 0}>
      {[-1, 1].map((side) => (
        <Box key={side} size={[1.8, h, d]} pos={[(side * w) / 2, h / 2, 0]}>
          <Stone />
        </Box>
      ))}
      <Box size={[w + 3, 0.9, d + 0.6]} pos={[0, h + 0.45, 0]}>
        <meshStandardMaterial color={GOLD} roughness={0.35} metalness={0.7} />
      </Box>
      <Box size={[4, 3, 4]} pos={[w / 2 + 5, 1.5, 0]}>
        <Wall />
      </Box>
    </group>
  )
}

/** A service compound: plant room beside a tank, which stands tall for an overhead water tank. */
function Utility({ w, d, h }: { w: number; d: number; h: number }) {
  const r = Math.min(w, d) * 0.22
  const alongX = w >= d
  return (
    <group>
      <Box size={[w, 0.2, d]} pos={[0, 0.1, 0]} shadow={false}>
        <meshStandardMaterial color="#6f6a61" roughness={0.95} />
      </Box>
      <Box size={alongX ? [w * 0.35, 2.6, d * 0.6] : [w * 0.6, 2.6, d * 0.35]} pos={alongX ? [-w * 0.22, 1.5, 0] : [0, 1.5, -d * 0.22]}>
        <Wall />
      </Box>
      <mesh position={alongX ? [w * 0.22, 0.2 + h / 2, 0] : [0, 0.2 + h / 2, d * 0.22]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, h, 24]} />
        <Stone />
      </mesh>
    </group>
  )
}

/** Gold outline around an amenity's footprint for hover/selection. */
function Footprint({ w, d, strong }: { w: number; d: number; strong: boolean }) {
  return (
    <mesh position-y={0.2} raycast={() => null}>
      <boxGeometry args={[w + 1.5, 0.3, d + 1.5]} />
      <meshBasicMaterial color={GOLD} transparent opacity={strong ? 0.12 : 0.06} depthWrite={false} />
      <Edges color={GOLD} />
    </mesh>
  )
}
