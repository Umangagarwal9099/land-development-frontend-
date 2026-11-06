import type { OpdCtx, Room } from '../ctx'

/**
 * Furnishes one room: builds what stands in it into `room.group` (in floor coordinates, see
 * Room.at and Room.onWall), adds its own lamps if it needs more than the shell's, and makes its
 * major equipment explain itself (Room.info). Keep clear of `room.doors` (Room.clear).
 */
export type Fitter = (e: OpdCtx, room: Room) => void
