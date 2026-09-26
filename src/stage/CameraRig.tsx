import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { BASE_SMOOTH_TIME } from '../lib/camera'
import { useStageStore } from '../store/stage'

const { ACTION } = CameraControlsImpl

// rad/s — slow enough to read as a showroom turntable rather than a spin.
const ATTRACT_SPEED = 0.07
const TURNTABLE_SPEED = 0.16

/**
 * One camera rig shared by every scene. Gestures:
 *  - one finger / left mouse: 360° orbit (horizontal) and tilt (vertical)
 *  - two fingers: pinch to zoom + drag to pan; right mouse or three fingers: pan
 *  - wheel: zoom toward the cursor
 * Scenes set their own distance limits and boundary on mount.
 */
export function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const setControls = useStageStore((s) => s.setControls)
  const mode = useStageStore((s) => s.mode)
  const autoRotate = useStageStore((s) => s.autoRotate)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    c.mouseButtons.left = ACTION.ROTATE
    c.mouseButtons.right = ACTION.TRUCK
    c.mouseButtons.wheel = ACTION.DOLLY
    c.touches.one = ACTION.TOUCH_ROTATE
    c.touches.two = ACTION.TOUCH_DOLLY_TRUCK
    c.touches.three = ACTION.TOUCH_TRUCK
    // Grabbing the model stops the turntable; the ambient timer restarts it later.
    const stopTurntable = () => {
      c.smoothTime = BASE_SMOOTH_TIME
      const s = useStageStore.getState()
      if (s.autoRotate && s.mode === 'explore') s.setAutoRotate(false)
    }
    c.addEventListener('controlstart', stopTurntable)
    setControls(c)
    return () => {
      c.removeEventListener('controlstart', stopTurntable)
      setControls(null)
    }
  }, [setControls])

  // The landing screen is a showcase: its overlay owns swipes, so the camera ignores input.
  useEffect(() => {
    if (ref.current) ref.current.enabled = mode === 'explore'
  }, [mode])

  useEffect(() => {
    if (autoRotate) invalidate()
  }, [autoRotate, invalidate])

  useFrame((_, delta) => {
    const c = ref.current
    if (!c || !autoRotate) return
    // Clamp delta so a backgrounded tab doesn't jump a quarter turn on return.
    void c.rotate((mode === 'attract' ? ATTRACT_SPEED : TURNTABLE_SPEED) * Math.min(delta, 0.05), 0, false)
    invalidate()
  })

  return (
    <CameraControls
      ref={ref}
      makeDefault
      // Damping: settles over ~0.4 s after a flick, lightly smoothed while the finger is down.
      smoothTime={BASE_SMOOTH_TIME}
      draggingSmoothTime={0.14}
      azimuthRotateSpeed={0.85}
      polarRotateSpeed={0.7}
      dollySpeed={0.55}
      truckSpeed={1.2}
      dollyToCursor
      restThreshold={0.004}
    />
  )
}
