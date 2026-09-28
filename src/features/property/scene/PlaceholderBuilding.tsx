import { Edges } from '@react-three/drei'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import type { PlaceholderBlock } from '../../../api/types'
import { disposeObject } from '../../../lib/three'
import { GOLD, IVORY } from '../../../lib/palette'
import { buildRoomInterior } from './furnished/autoFurnish'

export const STOREY_HEIGHT = 3.2

// Heights for outdoor stand-ins, keyed by mesh-name prefix.
const outdoorHeight = (meshName: string) => (meshName.includes('pool') ? 0.25 : meshName.includes('garden') ? 0.12 : 0.08)

function OutdoorMaterial({ meshName }: { meshName: string }) {
  if (meshName.includes('pool'))
    return <meshPhysicalMaterial color="#1f6a82" roughness={0.04} clearcoat={1} emissive="#0b3542" emissiveIntensity={0.35} />
  if (meshName.includes('garden')) return <meshStandardMaterial color="#2f4b33" roughness={1} />
  return <meshStandardMaterial color="#25282c" roughness={0.9} />
}

/**
 * A generated massing model that follows the same naming contract as a real artist GLB
 * (floor_* groups, room_* and amenity_* hotspots, door_*, roof), so every viewer feature
 * can be built and demoed before the 3D content exists. Styled as a presentation model:
 * stone slabs, glass-like room volumes with ivory edges, the selected room in gold.
 */
export function PlaceholderBuilding({
  blocks,
  selectedMesh,
  hoveredMesh = null,
  interiorMesh = null,
  onReady,
}: {
  blocks: PlaceholderBlock[]
  selectedMesh: string | null
  /** Room under the mouse: lifted slightly so it reads as clickable. */
  hoveredMesh?: string | null
  /** Room open in the room viewer: its volume gives way to a generated, furnished interior. */
  interiorMesh?: string | null
  onReady: () => void
}) {
  const groups = useMemo(() => {
    const byGroup = new Map<string, PlaceholderBlock[]>()
    for (const b of blocks) byGroup.set(b.group, [...(byGroup.get(b.group) ?? []), b])
    return [...byGroup.entries()]
  }, [blocks])

  const roof = useMemo(() => {
    const indoor = blocks.filter((b) => b.group !== 'outdoor')
    if (indoor.length === 0) return null
    const top = Math.max(...indoor.map((b) => b.level))
    const minX = Math.min(...indoor.map((b) => b.x - b.w / 2))
    const maxX = Math.max(...indoor.map((b) => b.x + b.w / 2))
    const minZ = Math.min(...indoor.map((b) => b.z - b.d / 2))
    const maxZ = Math.max(...indoor.map((b) => b.z + b.d / 2))
    return { y: (top + 1) * STOREY_HEIGHT, x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, w: maxX - minX + 1.2, d: maxZ - minZ + 1.2 }
  }, [blocks])

  // The entrance door sits on the front (+z) face of the first ground-floor room.
  const door = blocks.find((b) => b.group !== 'outdoor' && b.level === 0)

  useLayoutEffect(onReady, [blocks, onReady])

  return (
    <group>
      {groups.map(([group, items]) => (
        <group key={group} name={group} position-y={group === 'outdoor' ? 0 : items[0].level * STOREY_HEIGHT}>
          {items.map((b) => {
            const selected = b.meshName === selectedMesh
            const hovered = !selected && b.meshName === hoveredMesh
            const dimmed = selectedMesh !== null && !selected
            const furnished = b.meshName === interiorMesh
            return group === 'outdoor' ? (
              <group key={b.meshName}>
                <mesh name={b.meshName} position={[b.x, outdoorHeight(b.meshName) / 2, b.z]} receiveShadow visible={!furnished}>
                  <boxGeometry args={[b.w, outdoorHeight(b.meshName), b.d]} />
                  <OutdoorMaterial meshName={b.meshName} />
                  {(selected || hovered) && <Edges color={GOLD} lineWidth={selected ? 2 : 1.2} />}
                </mesh>
                {furnished && <RoomInterior meshName={b.meshName} w={b.w} d={b.d} position={[b.x, 0, b.z]} />}
              </group>
            ) : (
              <group key={b.meshName} name={b.meshName} position={[b.x, 0, b.z]}>
                {furnished && <RoomInterior meshName={b.meshName} w={b.w} d={b.d} position={[0, 0.2, 0]} />}
                <mesh position-y={0.1} receiveShadow castShadow>
                  <boxGeometry args={[b.w, 0.2, b.d]} />
                  <meshStandardMaterial color={selected ? '#e6d3a3' : '#d8d0c1'} roughness={0.85} />
                </mesh>
                <mesh position-y={STOREY_HEIGHT / 2 + 0.1} castShadow={!furnished}>
                  <boxGeometry args={[b.w - 0.1, STOREY_HEIGHT - 0.2, b.d - 0.1]} />
                  <meshStandardMaterial
                    color={selected || hovered ? GOLD : IVORY}
                    emissive={selected ? GOLD : '#000000'}
                    emissiveIntensity={selected ? 0.35 : 0}
                    transparent
                    // Once furnished, only the gold outline of the volume remains.
                    opacity={furnished ? 0 : selected ? 0.32 : hovered ? 0.22 : dimmed ? 0.06 : 0.14}
                    depthWrite={false}
                  />
                  <Edges
                    color={selected || hovered ? GOLD : IVORY}
                    lineWidth={selected ? 2.2 : hovered ? 1.6 : 1}
                    transparent
                    opacity={furnished ? 0.55 : selected || hovered ? 1 : dimmed ? 0.22 : 0.6}
                  />
                </mesh>
              </group>
            )
          })}
          {door && group !== 'outdoor' && door.group === group && (
            // Pivot group sits on the hinge so rotating it swings the door open.
            <group name="door_main" position={[door.x - 0.6, 0.2, door.z + door.d / 2]}>
              <mesh position={[0.6, 1.2, 0]} castShadow>
                <boxGeometry args={[1.2, 2.4, 0.08]} />
                <meshStandardMaterial color="#6d4a2e" roughness={0.6} />
              </mesh>
            </group>
          )}
        </group>
      ))}
      {roof && (
        <mesh name="roof" position={[roof.x, roof.y + 0.15, roof.z]} castShadow receiveShadow>
          <boxGeometry args={[roof.w, 0.3, roof.d]} />
          <meshStandardMaterial color="#2b2d31" roughness={0.6} />
        </mesh>
      )}
    </group>
  )
}

/** A generated furnished interior for one placeholder room; freed from GPU memory when closed. */
function RoomInterior({ meshName, w, d, position }: { meshName: string; w: number; d: number; position: [number, number, number] }) {
  const root = useMemo(() => buildRoomInterior(meshName, w, d), [meshName, w, d])
  useEffect(() => () => disposeObject(root), [root])
  // Decorative only: taps inside the room viewer never pick through the furniture.
  useLayoutEffect(() => {
    root.traverse((o) => {
      o.raycast = () => undefined
    })
  }, [root])
  return <primitive object={root} position={position} />
}
