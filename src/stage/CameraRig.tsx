import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, type PerspectiveCamera } from 'three'
import { BASE_SMOOTH_TIME } from '../lib/camera'
import { useStageStore } from '../store/stage'

const { ACTION } = CameraControlsImpl

// rad/s — slow enough to read as a showroom turntable rather than a spin.
const ATTRACT_SPEED = 0.07
const TURNTABLE_SPEED = 0.16

/**
 * Wheel input settles this fast while it lasts (the rig's everyday damping is for flicks and
 * flights; on a stream of wheel events it reads as lag), returning to normal this long after.
 */
const WHEEL_SMOOTH_TIME = 0.09
const WHEEL_IDLE_MS = 180
/** Distance change per pixel of wheel delta: a mouse notch (~100 px) is about a fifth; a pinch tracks the fingers. */
const WHEEL_ZOOM_PER_PX = 0.0022
const PINCH_ZOOM_PER_PX = 0.011
/** Wheel events further apart than this start a new gesture, which may be of the other kind. */
const GESTURE_GAP_MS = 140

type WheelKind = 'pan' | 'zoom' | 'pinch'

/** A Mac mouse wheel's notch in Chrome and Safari: its deltas come in whole multiples of this. */
const MAC_NOTCH = 4.000244140625

/**
 * Tells a trackpad's two-finger scroll from a mouse wheel, by the deltas themselves. A mouse wheel
 * moves in notches: whole multiples of 4.000244 px on a Mac, 100 px or so elsewhere, or lines in
 * Firefox. A trackpad sends small, often fractional pixel deltas, and sideways ones. A pinch
 * arrives as a wheel event with ctrlKey set (Safari sends gesture events instead; see below).
 */
function wheelKind(e: WheelEvent): WheelKind {
  if (e.ctrlKey) return 'pinch'
  if (e.deltaMode !== 0) return 'zoom'
  if (e.deltaX !== 0) return 'pan'
  const d = Math.abs(e.deltaY)
  if (d === 0) return 'pan'
  if (d % MAC_NOTCH === 0 || (Number.isInteger(d) && d >= 50)) return 'zoom'
  return 'pan'
}

/** Safari's pinch: a WebKit gesture event, its scale relative to the gesture's start. */
type PinchEvent = Event & { scale: number; clientX: number; clientY: number }

/** camera-controls' own cursor-anchored dolly (it keeps distance limits and the boundary); not in its typings. */
type Dollying = { _dollyInternal: (delta: number, x: number, y: number) => void }

/**
 * One camera rig shared by every scene. Gestures:
 *  - one finger / left mouse: 360° orbit (horizontal) and tilt (vertical)
 *  - two fingers: pinch to zoom + drag to pan; right mouse or three fingers: pan (across the ground)
 *  - mouse wheel: zoom toward the cursor
 *  - trackpad: two fingers pan, the view following the fingers one to one; pinch zooms toward the
 *    cursor (camera-controls on its own turns two-finger scrolling into a slow zoom, a tenth of a
 *    wheel's, and pinching into a change of lens; Safari's pinch is a gesture event of its own)
 * Scenes set their own distance limits and boundary on mount.
 */
export function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const setControls = useStageStore((s) => s.setControls)
  const mode = useStageStore((s) => s.mode)
  const autoRotate = useStageStore((s) => s.autoRotate)
  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    c.mouseButtons.left = ACTION.ROTATE
    // Panning moves across the ground (not up into the sky), the same for every input.
    c.mouseButtons.right = ACTION.SCREEN_PAN
    // Wheel input is routed below, so a trackpad can pan and pinch properly.
    c.mouseButtons.wheel = ACTION.NONE
    c.touches.one = ACTION.TOUCH_ROTATE
    // Pinch with a pan across the ground; camera-controls handles it but leaves it out of its typings.
    c.touches.two = ACTION.TOUCH_DOLLY_SCREEN_PAN as typeof c.touches.two
    c.touches.three = ACTION.TOUCH_SCREEN_PAN
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

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const el = gl.domElement
    let gesture: { kind: WheelKind; at: number } | null = null
    let settle = 0
    let safariPinch: number | null = null

    // Wheel and pinch input settles fast while it lasts, and the turntable stops.
    const engage = () => {
      if (c.smoothTime !== WHEEL_SMOOTH_TIME) {
        c.smoothTime = WHEEL_SMOOTH_TIME
        const s = useStageStore.getState()
        if (s.autoRotate && s.mode === 'explore') s.setAutoRotate(false)
      }
      window.clearTimeout(settle)
      settle = window.setTimeout(() => (c.smoothTime = BASE_SMOOTH_TIME), WHEEL_IDLE_MS)
    }
    /** Scales the distance by `scale` toward the point under (clientX, clientY), within the scene's limits. */
    const zoomBy = (scale: number, clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      const delta = -Math.log(scale) / (Math.log(0.95) * c.dollySpeed)
      const x = ((clientX - rect.left) / rect.width) * 2 - 1
      const y = -((clientY - rect.top) / rect.height) * 2 + 1
      ;(c as unknown as Dollying)._dollyInternal(delta, x, y)
      c.dispatchEvent({ type: 'control' })
    }

    const onWheel = (e: WheelEvent) => {
      if (!c.enabled) return
      e.preventDefault()
      // Safari reports the pinch as gesture events too; take it from those.
      if (e.ctrlKey && safariPinch !== null) return
      const now = performance.now()
      // A gesture keeps the kind it began as, through a trackpad's momentum tail and all.
      const kind = gesture && now - gesture.at < GESTURE_GAP_MS && e.ctrlKey === (gesture.kind === 'pinch') ? gesture.kind : wheelKind(e)
      gesture = { kind, at: now }
      engage()
      const rect = el.getBoundingClientRect()
      // Lines and pages to pixels; a Mac's mouse notch (4 px where other systems send ~100) to a notch.
      const macNotch = kind === 'zoom' && e.deltaY !== 0 && Math.abs(e.deltaY) % MAC_NOTCH === 0
      const px = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? rect.height : macNotch ? 100 / MAC_NOTCH : 1
      if (kind === 'pan') {
        // The view follows the fingers one to one, as a page does: sideways along the screen,
        // up and down across the ground, stretched by the view's tilt so the ground under the
        // fingers keeps up with them (and never climbing into the sky).
        const camera = c.camera as PerspectiveCamera
        const perPx = (2 * c.distance * Math.tan(MathUtils.degToRad(camera.getEffectiveFOV()) / 2)) / rect.height
        const ground = perPx / Math.max(Math.cos(c.polarAngle), 0.3)
        void c.truck(e.deltaX * px * perPx, 0, true)
        void c.forward(-e.deltaY * px * ground, true)
        c.dispatchEvent({ type: 'control' })
      } else {
        zoomBy(Math.exp(e.deltaY * px * (kind === 'pinch' ? PINCH_ZOOM_PER_PX : WHEEL_ZOOM_PER_PX)), e.clientX, e.clientY)
      }
    }
    // Safari's pinch: prevented, or the whole page zooms instead of the model.
    const onPinchStart = (e: Event) => {
      if (!c.enabled) return
      e.preventDefault()
      safariPinch = 1
    }
    const onPinchChange = (e: Event) => {
      if (!c.enabled || safariPinch === null) return
      e.preventDefault()
      const { scale, clientX, clientY } = e as PinchEvent
      engage()
      zoomBy(safariPinch / scale, clientX, clientY)
      safariPinch = scale
    }
    const onPinchEnd = (e: Event) => {
      e.preventDefault()
      safariPinch = null
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', onPinchStart)
    el.addEventListener('gesturechange', onPinchChange)
    el.addEventListener('gestureend', onPinchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('gesturestart', onPinchStart)
      el.removeEventListener('gesturechange', onPinchChange)
      el.removeEventListener('gestureend', onPinchEnd)
      window.clearTimeout(settle)
    }
  }, [gl])

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
      // 2 makes a pan drag move the view one to one with the pointer (camera-controls moves half a
      // screen height per screen height dragged at 1).
      truckSpeed={2}
      dollyToCursor
      restThreshold={0.004}
    />
  )
}
