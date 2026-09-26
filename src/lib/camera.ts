import type { CameraControls } from '@react-three/drei'
import { MathUtils, PerspectiveCamera, Sphere, Vector3 } from 'three'
import type { Box2 } from '../store/masterplan'
import { settle } from './async'
import type { Inset } from '../store/stage'

export function boxToSphere(b: Box2, y = 0): Sphere {
  const center = new Vector3((b.minX + b.maxX) / 2, y, (b.minZ + b.maxZ) / 2)
  return new Sphere(center, Math.hypot(b.maxX - b.minX, b.maxZ - b.minZ) / 2)
}

interface FrameOptions {
  /** Polar angle in degrees (0 = straight down). Omit to keep the current tilt. */
  polar?: number
  /** Azimuth in degrees. Omit to keep the current heading. */
  azimuth?: number
  inset?: Inset
  /** Multiplies the fitted distance: < 1 frames tighter, > 1 looser. */
  distanceScale?: number
  transition?: boolean
  /** Easing time for this move; longer reads as a cinematic flight. */
  smoothTime?: number
}

/** The rig's everyday damping; cinematic moves temporarily lengthen it. */
export const BASE_SMOOTH_TIME = 0.42

/**
 * Frames a sphere so it sits in the middle of the part of the screen not covered by UI.
 * Uses camera-controls' focal offset, which shifts the view without changing the orbit pivot,
 * so the buyer still rotates around the selected subject.
 */
export async function frameSphere(controls: CameraControls, sphere: Sphere, opts: FrameOptions = {}) {
  const { inset = { left: 0, right: 0, bottom: 0 }, transition = true, distanceScale = 1 } = opts
  const camera = controls.camera as PerspectiveCamera
  const openW = Math.max(0.35, 1 - inset.left - inset.right)
  const openH = Math.max(0.35, 1 - inset.bottom)
  // Fit into the open area, not the full viewport.
  const radius = sphere.radius / Math.min(openW, openH)
  const distance = controls.getDistanceToFitSphere(radius) * distanceScale

  const halfH = distance * Math.tan(MathUtils.degToRad(camera.fov / 2))
  const halfW = halfH * camera.aspect
  const offsetX = (inset.right - inset.left) * halfW
  const offsetY = -inset.bottom * halfH

  const moves: Promise<unknown>[] = [
    controls.moveTo(sphere.center.x, sphere.center.y, sphere.center.z, transition),
    controls.dollyTo(distance, transition),
    controls.setFocalOffset(offsetX, offsetY, 0, transition),
  ]
  if (opts.polar !== undefined || opts.azimuth !== undefined) {
    const az = opts.azimuth === undefined ? controls.azimuthAngle : nearestAngle(controls.azimuthAngle, MathUtils.degToRad(opts.azimuth))
    const polar = opts.polar === undefined ? controls.polarAngle : MathUtils.degToRad(opts.polar)
    moves.push(controls.rotateTo(az, polar, transition))
  }
  controls.smoothTime = opts.smoothTime ?? BASE_SMOOTH_TIME
  // A grab mid-flight interrupts the move; don't wait for a rest that may come much later.
  await settle(Promise.all(moves), 2500)
  controls.smoothTime = BASE_SMOOTH_TIME
}

/** Re-applies the focal offset for a new inset (panel opened/closed) without refitting. */
export function applyInset(controls: CameraControls, inset: Inset) {
  const camera = controls.camera as PerspectiveCamera
  const halfH = controls.distance * Math.tan(MathUtils.degToRad(camera.fov / 2))
  const halfW = halfH * camera.aspect
  void controls.setFocalOffset((inset.right - inset.left) * halfW, -inset.bottom * halfH, 0, true)
}

/** Picks the equivalent of `target` closest to `current`, so the camera never spins the long way round. */
function nearestAngle(current: number, target: number) {
  const full = Math.PI * 2
  return target + Math.round((current - target) / full) * full
}
