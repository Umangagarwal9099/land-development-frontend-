import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { Box3, Vector3, type Object3D } from 'three'
import type { Room } from '../../../api/types'

interface Pin {
  room: Room
  position: [number, number, number]
}

/**
 * A soft gold beacon over every room that can be opened: the touch-screen equivalent of a hover
 * cursor. Mouse users also see the room's name on hover; a tap opens the room viewer.
 */
export function RoomPins({
  root,
  rooms,
  version,
  isVisible,
  onOpen,
}: {
  root: Object3D
  rooms: Room[]
  /** Re-measures when the model or visible floors change. */
  version: string
  isVisible: (obj: Object3D) => boolean
  onOpen: (room: Room) => void
}) {
  const pins = useMemo<Pin[]>(() => {
    root.updateWorldMatrix(true, true)
    const out: Pin[] = []
    for (const room of rooms) {
      const obj = root.getObjectByName(room.meshName)
      if (!obj || !isVisible(obj)) continue
      const box = new Box3().setFromObject(obj)
      if (box.isEmpty()) continue
      const c = box.getCenter(new Vector3())
      // Floor-slab hotspots are flat; lift their beacon to roughly head height above the floor.
      const y = Math.max(box.max.y, box.min.y + 2.2) + 0.35
      out.push({ room, position: [c.x, y, c.z] })
    }
    return out
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [root, rooms, version])

  return (
    <>
      {pins.map(({ room, position }) => (
        <Html key={room.id} position={position} center zIndexRange={[15, 5]}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpen(room)
            }}
            aria-label={`Open ${room.name} in 3D`}
            className="group relative flex h-11 w-11 items-center justify-center"
          >
            <span className="absolute h-7 w-7 animate-ping rounded-full bg-gold/25 [animation-duration:2.6s]" />
            <span className="relative h-3 w-3 rounded-full bg-gold shadow-[0_0_14px_rgb(212_178_106/0.9)] ring-2 ring-ink/60 transition group-hover:scale-125" />
            <span className="glass pointer-events-none absolute bottom-full mb-1 whitespace-nowrap rounded-full px-3 py-1 font-display text-lg text-ivory opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
              {room.name}
            </span>
          </button>
        </Html>
      ))}
    </>
  )
}
