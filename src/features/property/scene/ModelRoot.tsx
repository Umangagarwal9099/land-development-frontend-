import { Edges, Html, useCursor } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box3, MathUtils, Mesh, Sphere, Vector3, type Object3D } from 'three'
import type { Floor, Property, Room } from '../../../api/types'
import { frameSphere } from '../../../lib/camera'
import { panelInset } from '../../../lib/layout'
import { GOLD } from '../../../lib/palette'
import { findNamedAncestor } from '../../../lib/three'
import { useStageStore } from '../../../store/stage'
import { useViewerStore } from '../../../store/viewer'
import { FurnishedModel } from './FurnishedModel'
import { GltfModel } from './GltfModel'
import { PlaceholderBuilding } from './PlaceholderBuilding'
import { RoomPins } from './RoomPins'
import { RoomSection } from './RoomSection'

// A pointer that moved more than this many pixels between down and up was a drag, not a tap.
const TAP_TOLERANCE_PX = 8
const DOOR_OPEN_ANGLE = -Math.PI / 2

const isDoor = (name: string) => name.startsWith('door_')
const isDrawer = (name: string) => name.startsWith('drawer_')
/** Light switches toggle their circuit; spinners (a ceiling fan) start and stop. */
const isSwitch = (name: string) => name.startsWith('switch_')
const isSpinner = (name: string) => name.startsWith('spin_')
/** Everything a tap operates: doors swing, drawers and sliders run, switches and fans toggle. */
const isOpenable = (name: string) => isDoor(name) || isDrawer(name) || isSwitch(name) || isSpinner(name)
/** A tap within this long of the last on the same object is ignored, so a double tap can't flicker it. */
const RETRIGGER_MS = 450

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

export function ModelRoot({ property, site, interactive, onReady }: { property: Property; site: Box3; interactive: boolean; onReady: () => void }) {
  const [root, setRoot] = useState<Object3D | null>(null)
  // Bumped whenever model content (placeholder or a newly streamed LOD) is mounted.
  const [modelVersion, setModelVersion] = useState(0)
  const handleReady = useCallback(() => {
    setModelVersion((v) => v + 1)
    onReady()
  }, [onReady])

  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl)
  const controls = useStageStore((s) => s.controls)
  const ambient = useStageStore((s) => s.ambient)
  const activeLevel = useViewerStore((s) => s.activeLevel)
  const selectedRoomId = useViewerStore((s) => s.selectedRoomId)
  const selectRoom = useViewerStore((s) => s.selectRoom)
  const roomViewId = useViewerStore((s) => s.roomViewId)
  const openRoomView = useViewerStore((s) => s.openRoomView)
  // Inside the room viewer the house is cut away; taps and hovers on it are ignored.
  const picking = interactive && !roomViewId

  const roomsByMesh = useMemo(() => new Map(property.rooms.map((r) => [r.meshName, r])), [property.rooms])
  const levelByFloorId = useMemo(() => new Map(property.floors.map((f) => [f.id, f.level])), [property.floors])
  const selectedRoom = property.rooms.find((r) => r.id === selectedRoomId) ?? null

  const [hovered, setHovered] = useState<{ room: Room; box: Box3 } | null>(null)
  const [hoveredOpenable, setHoveredOpenable] = useState<{ node: Object3D; box: Box3 } | null>(null)
  // A brief highlight on the object just tapped, so touch users see what they operated.
  const [tapped, setTapped] = useState<{ box: Box3; key: number } | null>(null)
  useCursor(hovered !== null || hoveredOpenable !== null)

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
    const box = new Box3().setFromObject(selectedObject)
    // A hotspot can say how tall its space is (walls, a canopy, floodlights) so the room view keeps all of it.
    const height = selectedObject.userData.height as number | undefined
    if (height) box.max.y = Math.max(box.max.y, box.min.y + height)
    return box
  }, [selectedObject, root])

  // Where to stand in the room: the largest floor area of the hotspot, so a suite whose hotspot
  // also covers its dressing room is entered from the bedroom, not from the wall between them.
  const focusBox = useMemo(() => {
    if (!selectedObject) return null
    let best: Box3 | null = null
    let bestArea = 0
    for (const child of selectedObject.children) {
      if (!(child instanceof Mesh)) continue
      const b = new Box3().setFromObject(child)
      const area = (b.max.x - b.min.x) * (b.max.z - b.min.z)
      if (area > bestArea) [best, bestArea] = [b, area]
    }
    return best ?? selectionBox
  }, [selectedObject, selectionBox])

  // Fly to the selected room, framed beside the detail panel, keeping the current heading.
  // (The room viewer frames its room itself, in RoomSection.)
  useEffect(() => {
    if (!controls || !selectionBox || roomViewId) return
    const sphere = selectionBox.getBoundingSphere(new Sphere())
    // Frame a little wider than the room itself so its surroundings give context.
    sphere.radius *= 1.5
    void frameSphere(controls, sphere, { polar: 52, inset: panelInset(), smoothTime: 0.7 })
  }, [controls, selectionBox, roomViewId])

  const openRoom = useCallback(
    (room: Room) => {
      setHovered(null)
      openRoomView(room.id, room.floorId ? levelByFloorId.get(room.floorId) ?? null : undefined)
    },
    [openRoomView, levelByFloorId],
  )

  const hotspotAt = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    if (!isVisibleInScene(e.object)) return null
    return findNamedAncestor(e.object, (n) => roomsByMesh.has(n))
  }

  /**
   * The first surface the pointer really touches: visible, and not cut away by the room viewer's
   * section box (clipped geometry is still hit by the raycaster). Only that surface may open a
   * door or drawer, so a tap on a worktop never opens the cupboard beneath it.
   */
  const firstSurface = (e: ThreeEvent<PointerEvent | MouseEvent>) =>
    e.intersections.find((i) => isVisibleInScene(i.object) && gl.clippingPlanes.every((p) => p.distanceToPoint(i.point) >= -0.001))?.object
  const openableAt = (e: ThreeEvent<PointerEvent | MouseEvent>) =>
    e.object === firstSurface(e) ? findNamedAncestor(e.object, isOpenable) : null

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || e.delta > TAP_TOLERANCE_PX) return
    const openable = openableAt(e)
    if (openable) {
      e.stopPropagation()
      const now = performance.now()
      if (now - ((openable.userData.lastTap as number | undefined) ?? -Infinity) < RETRIGGER_MS) return
      openable.userData.lastTap = now
      if (isSwitch(openable.name)) {
        openable.userData.on = !(openable.userData.on ?? true)
        ;(openable.userData.toggle as ((on: boolean) => void) | undefined)?.(openable.userData.on)
      } else if (isSpinner(openable.name)) openable.userData.on = !openable.userData.on
      else {
        const open = !openable.userData.open
        openable.userData.open = open
        // Linked parts (a toilet seat lifts its lid; a closing lid brings the seat down too).
        for (const o of ((open ? openable.userData.alsoOpen : openable.userData.alsoClose) as Object3D[] | undefined) ?? []) o.userData.open = open
      }
      setHoveredOpenable(null)
      const box = frontBox(openable)
      setTapped({ box, key: now })
      window.setTimeout(() => setTapped((t) => (t?.key === now ? null : t)), 380)
      invalidate()
      return
    }
    // Inside a room, a tap on any other solid surface ends there.
    if (roomViewId) {
      if (e.object === firstSurface(e)) e.stopPropagation()
      return
    }
    if (!picking) return
    // Hidden (cut-away) floors are still hit by the raycaster; let the event reach what is behind them.
    const target = hotspotAt(e)
    if (!target) return
    e.stopPropagation()
    // Tap a room: it highlights, the camera flies in and the room viewer opens.
    openRoom(roomsByMesh.get(target.name)!)
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive || e.pointerType !== 'mouse') return
    if (e.object === firstSurface(e)) {
      const openable = findNamedAncestor(e.object, isOpenable)
      if (openable !== hoveredOpenable?.node) setHoveredOpenable(openable ? { node: openable, box: frontBox(openable) } : null)
    }
    if (!picking) return
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
      onPointerLeave={() => {
        setHovered(null)
        setHoveredOpenable(null)
      }}
      onPointerMissed={(e) => picking && e.type === 'click' && selectRoom(null)}
    >
      {property.model.kind === 'gltf' ? (
        <GltfModel url={property.model.url} lowUrl={property.model.lowUrl} onReady={handleReady} />
      ) : property.model.kind === 'furnished' ? (
        <FurnishedModel
          design={property.model.design}
          selectedMesh={selectedRoom?.meshName ?? null}
          hoveredMesh={hovered?.room.meshName ?? null}
          roomView={roomViewId !== null}
          onReady={handleReady}
        />
      ) : (
        <PlaceholderBuilding
          blocks={property.model.blocks}
          selectedMesh={selectedRoom?.meshName ?? null}
          hoveredMesh={hovered?.room.meshName ?? null}
          interiorMesh={roomViewId ? selectedRoom?.meshName ?? null : null}
          onReady={handleReady}
        />
      )}

      {root && <OpenableAnimator root={root} version={modelVersion} />}
      {hoveredOpenable && <OpenableOutline box={hoveredOpenable.box} />}
      {tapped && <OpenableOutline key={tapped.key} box={tapped.box} strong />}

      {/* Artist models can't be restyled per room, so they get a gold volume around the selection. */}
      {selectionBox && property.model.kind === 'gltf' && !roomViewId && <SelectionVolume box={selectionBox} />}
      {hovered && property.model.kind === 'gltf' && hovered.room.id !== selectedRoomId && <SelectionVolume box={hovered.box} faint />}

      <RoomSection
        room={roomViewId ? selectionBox : null}
        focus={roomViewId ? focusBox : null}
        site={site}
        outdoor={selectedRoom?.kind === 'outdoor'}
        view={selectedObject?.userData.view as 'overview' | 'eye' | undefined}
      />

      {/* In the room viewer its title names the room instead. */}
      {!ambient && interactive && selectedRoom && selectionBox && !roomViewId && (
        <RoomTag key={selectedRoom.id} name={selectedRoom.name} box={selectionBox} emphasis />
      )}
      {!ambient && picking && hovered && hovered.room.id !== selectedRoomId && (
        <RoomTag key={hovered.room.id} name={hovered.room.name} box={hovered.box} />
      )}
      {!ambient && picking && root && (
        <RoomPins
          root={root}
          rooms={property.rooms}
          version={`${modelVersion}:${activeLevel}`}
          isVisible={isVisibleInScene}
          onOpen={openRoom}
        />
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

function SelectionVolume({ box, faint }: { box: Box3; faint?: boolean }) {
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  return (
    <mesh position={center} raycast={() => null}>
      <boxGeometry args={[size.x + 0.2, size.y + 0.2, size.z + 0.2]} />
      <meshBasicMaterial color={GOLD} transparent opacity={faint ? 0.06 : 0.14} depthWrite={false} />
      <Edges color={GOLD} lineWidth={faint ? 1 : 2} transparent opacity={faint ? 0.6 : 1} />
    </mesh>
  )
}

/** The box round a door's or drawer's front panel (marked `userData.front`), for the hover outline. */
function frontBox(node: Object3D) {
  let front: Object3D = node
  node.traverse((o) => {
    if (o.userData.front) front = o
  })
  return new Box3().setFromObject(front)
}

/** A thin gold outline round the door or drawer front under the pointer. */
function OpenableOutline({ box, strong }: { box: Box3; strong?: boolean }) {
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  return (
    <mesh position={center} raycast={() => null} renderOrder={3}>
      <boxGeometry args={[size.x + 0.012, size.y + 0.012, size.z + 0.012]} />
      <meshBasicMaterial color={GOLD} transparent opacity={strong ? 0.22 : 0.1} depthWrite={false} />
      <Edges color={GOLD} lineWidth={1.5} />
    </mesh>
  )
}

/**
 * Eases every door_* toward its open or closed angle (about its hinge: `userData.openAngle`, a
 * quarter turn by default, about y unless `userData.axis` says 'x') and every drawer_* along its runners (`userData.slide`, in its
 * parent's frame). Only requests frames while something is moving.
 */
function OpenableAnimator({ root, version }: { root: Object3D; version: number }) {
  const parts = useMemo(() => {
    const found: Object3D[] = []
    root.traverse((o) => {
      if (isDoor(o.name)) {
        o.userData.closedY ??= o.rotation[(o.userData.axis as 'x' | 'y' | undefined) ?? 'y']
        found.push(o)
      } else if (isDrawer(o.name)) {
        o.userData.closedPos ??= o.position.clone()
        found.push(o)
      } else if (isSwitch(o.name) || isSpinner(o.name)) found.push(o)
    })
    return found
    // version: re-scan when a new model (or LOD) mounts under the same root.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [root, version])

  const target = useMemo(() => new Vector3(), [])
  const step = useMemo(() => new Vector3(), [])
  const moving = useRef(false)
  useFrame((state, delta) => {
    let moved = false
    for (const part of parts) {
      const { open } = part.userData
      if (isSpinner(part.name)) {
        // Spins up and runs down gently, about its own vertical axis.
        const speed = MathUtils.damp((part.userData.speed as number | undefined) ?? 0, part.userData.on ? 4.2 : 0, 1.6, delta)
        part.userData.speed = speed < 0.002 && !part.userData.on ? 0 : speed
        if (!part.userData.speed) continue
        part.rotation.y += part.userData.speed * delta
        // A turning fan keeps the frames coming but needn't redraw the room's shadows.
        state.invalidate()
        continue
      } else if (isSwitch(part.name)) {
        // The rocker tips over: down for on, up for off.
        const rocker = part.getObjectByName('rocker')
        if (!rocker) continue
        const tip = (part.userData.on ?? true) ? -0.14 : 0.14
        if (Math.abs(rocker.rotation.x - tip) < 0.001) continue
        rocker.rotation.x = MathUtils.damp(rocker.rotation.x, tip, 18, delta)
      } else if (isDoor(part.name)) {
        const axis = (part.userData.axis as 'x' | 'y' | undefined) ?? 'y'
        const angle = part.userData.closedY + (open ? ((part.userData.openAngle as number | undefined) ?? DOOR_OPEN_ANGLE) : 0)
        if (Math.abs(part.rotation[axis] - angle) < 0.001) continue
        // oxlint-disable-next-line react/immutability -- three.js objects are mutated per frame by design
        part.rotation[axis] = MathUtils.damp(part.rotation[axis], angle, 7, delta)
      } else {
        target.copy(part.userData.closedPos as Vector3)
        if (open) target.add(step.fromArray(part.userData.slide as number[]))
        if (part.position.distanceToSquared(target) < 1e-8) continue
        part.position.set(MathUtils.damp(part.position.x, target.x, 7, delta), MathUtils.damp(part.position.y, target.y, 7, delta), MathUtils.damp(part.position.z, target.z, 7, delta))
      }
      moved = true
      state.invalidate()
    }
    // Shadows are redrawn once a door or drawer comes to rest (see PropertyScene), not every frame.
    if (moving.current && !moved) {
      state.gl.shadowMap.needsUpdate = true
      state.invalidate()
    }
    moving.current = moved
  })
  return null
}
