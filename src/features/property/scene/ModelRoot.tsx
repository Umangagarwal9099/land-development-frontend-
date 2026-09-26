import { Edges, Html, useCursor } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box3, MathUtils, Sphere, Vector3, type Object3D } from 'three'
import type { Floor, Property, Room } from '../../../api/types'
import { frameSphere } from '../../../lib/camera'
import { panelInset } from '../../../lib/layout'
import { GOLD } from '../../../lib/palette'
import { findNamedAncestor } from '../../../lib/three'
import { useStageStore } from '../../../store/stage'
import { useViewerStore } from '../../../store/viewer'
import { GltfModel } from './GltfModel'
import { PlaceholderBuilding } from './PlaceholderBuilding'

// A pointer that moved more than this many pixels between down and up was a drag, not a tap.
const TAP_TOLERANCE_PX = 8
const DOOR_OPEN_ANGLE = -Math.PI / 2

const isDoor = (name: string) => name.startsWith('door_')

function isVisibleInScene(obj: Object3D): boolean {
  for (let o: Object3D | null = obj; o; o = o.parent) if (!o.visible) return false
  return true
}

function applyFloorVisibility(root: Object3D, floors: Floor[], activeLevel: number | null) {
  for (const floor of floors) {
    const group = root.getObjectByName(floor.groupName)
    if (group) group.visible = activeLevel === null || floor.level <= activeLevel
  }
  const roof = root.getObjectByName('roof')
  if (roof) roof.visible = activeLevel === null
}

export function ModelRoot({ property, interactive, onReady }: { property: Property; interactive: boolean; onReady: () => void }) {
  const [root, setRoot] = useState<Object3D | null>(null)
  // Bumped whenever model content (placeholder or a newly streamed LOD) is mounted.
  const [modelVersion, setModelVersion] = useState(0)
  const handleReady = useCallback(() => {
    setModelVersion((v) => v + 1)
    onReady()
  }, [onReady])

  const invalidate = useThree((s) => s.invalidate)
  const controls = useStageStore((s) => s.controls)
  const ambient = useStageStore((s) => s.ambient)
  const activeLevel = useViewerStore((s) => s.activeLevel)
  const selectedRoomId = useViewerStore((s) => s.selectedRoomId)
  const selectRoom = useViewerStore((s) => s.selectRoom)

  const roomsByMesh = useMemo(() => new Map(property.rooms.map((r) => [r.meshName, r])), [property.rooms])
  const levelByFloorId = useMemo(() => new Map(property.floors.map((f) => [f.id, f.level])), [property.floors])
  const selectedRoom = property.rooms.find((r) => r.id === selectedRoomId) ?? null

  const [hovered, setHovered] = useState<{ room: Room; box: Box3 } | null>(null)
  useCursor(hovered !== null)

  useEffect(() => {
    if (!root) return
    applyFloorVisibility(root, property.floors, activeLevel)
    invalidate()
  }, [root, modelVersion, property.floors, activeLevel, invalidate])

  const selectedObject = useMemo(
    () => (root && selectedRoom ? root.getObjectByName(selectedRoom.meshName) ?? null : null),
    // modelVersion: the object is a different instance after an LOD swap.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [root, selectedRoom, modelVersion],
  )

  const selectionBox = useMemo(() => {
    if (!selectedObject) return null
    root?.updateWorldMatrix(true, true)
    return new Box3().setFromObject(selectedObject)
  }, [selectedObject, root])

  // Fly to the selected room, framed beside the detail panel, keeping the current heading.
  useEffect(() => {
    if (!controls || !selectionBox) return
    const sphere = selectionBox.getBoundingSphere(new Sphere())
    // Frame a little wider than the room itself so its surroundings give context.
    sphere.radius *= 1.5
    void frameSphere(controls, sphere, { polar: 52, inset: panelInset(), smoothTime: 0.7 })
  }, [controls, selectionBox])

  const hotspotAt = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    if (!isVisibleInScene(e.object)) return null
    return findNamedAncestor(e.object, (n) => roomsByMesh.has(n) || isDoor(n))
  }

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || e.delta > TAP_TOLERANCE_PX) return
    // Hidden (cut-away) floors are still hit by the raycaster; let the event reach what is behind them.
    const target = hotspotAt(e)
    if (!target) return
    e.stopPropagation()
    if (isDoor(target.name)) {
      target.userData.open = !target.userData.open
      invalidate()
      return
    }
    const room = roomsByMesh.get(target.name)!
    selectRoom(room.id, room.floorId ? levelByFloorId.get(room.floorId) ?? null : undefined)
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive || e.pointerType !== 'mouse') return
    const target = hotspotAt(e)
    if (!target) return
    e.stopPropagation()
    const room = roomsByMesh.get(target.name)
    if (room?.id === hovered?.room.id) return
    setHovered(room ? { room, box: new Box3().setFromObject(target) } : null)
  }

  return (
    <group
      ref={setRoot}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHovered(null)}
      onPointerMissed={(e) => interactive && e.type === 'click' && selectRoom(null)}
    >
      {property.model.kind === 'gltf' ? (
        <GltfModel url={property.model.url} lowUrl={property.model.lowUrl} onReady={handleReady} />
      ) : (
        <PlaceholderBuilding blocks={property.model.blocks} selectedMesh={selectedRoom?.meshName ?? null} onReady={handleReady} />
      )}

      {root && <DoorAnimator root={root} version={modelVersion} />}

      {/* Artist models can't be restyled per room, so they get a gold volume around the selection. */}
      {selectionBox && property.model.kind === 'gltf' && <SelectionVolume box={selectionBox} />}

      {!ambient && interactive && selectedRoom && selectionBox && (
        <RoomTag key={selectedRoom.id} name={selectedRoom.name} box={selectionBox} emphasis />
      )}
      {!ambient && interactive && hovered && hovered.room.id !== selectedRoomId && (
        <RoomTag key={hovered.room.id} name={hovered.room.name} box={hovered.box} />
      )}
    </group>
  )
}

function RoomTag({ name, box, emphasis }: { name: string; box: Box3; emphasis?: boolean }) {
  const c = box.getCenter(new Vector3())
  return (
    <Html position={[c.x, box.max.y + 0.9, c.z]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`whitespace-nowrap rounded-full px-4 py-1.5 font-display text-xl font-semibold shadow-2xl ${
          emphasis ? 'bg-gold text-ink' : 'glass text-ivory'
        }`}
      >
        {name}
      </motion.div>
    </Html>
  )
}

function SelectionVolume({ box }: { box: Box3 }) {
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  return (
    <mesh position={center} raycast={() => null}>
      <boxGeometry args={[size.x + 0.2, size.y + 0.2, size.z + 0.2]} />
      <meshBasicMaterial color={GOLD} transparent opacity={0.14} depthWrite={false} />
      <Edges color={GOLD} lineWidth={2} />
    </mesh>
  )
}

/** Eases every door_* node toward its open/closed angle; only requests frames while moving. */
function DoorAnimator({ root, version }: { root: Object3D; version: number }) {
  const doors = useMemo(() => {
    const found: Object3D[] = []
    root.traverse((o) => {
      if (isDoor(o.name)) {
        o.userData.closedY ??= o.rotation.y
        found.push(o)
      }
    })
    return found
    // version: re-scan when a new model (or LOD) mounts under the same root.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [root, version])

  useFrame((state, delta) => {
    for (const door of doors) {
      const target = door.userData.closedY + (door.userData.open ? DOOR_OPEN_ANGLE : 0)
      if (Math.abs(door.rotation.y - target) < 0.001) continue
      // oxlint-disable-next-line react/immutability -- three.js objects are mutated per frame by design
      door.rotation.y = MathUtils.damp(door.rotation.y, target, 8, delta)
      state.invalidate()
    }
  })
  return null
}
