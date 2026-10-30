import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { CameraControls } from '@react-three/drei'
import { BackSide, Box3, BoxGeometry, MathUtils, Mesh, MeshBasicMaterial, PerspectiveCamera, Plane, Sphere, Vector3 } from 'three'
import { settle } from '../../../lib/async'
import { BASE_SMOOTH_TIME } from '../../../lib/camera'
import { useStageStore } from '../../../store/stage'
import { useViewerStore } from '../../../store/viewer'

/** How long the section box takes to close in on a room (or open back out). */
const SECTION_SECONDS = 1.05
// Keep the room's own walls (centred on its outline) inside the cut.
const WALL_MARGIN = 0.22
/** Every room is tall enough to include its walls, pendants and a cut above the ceiling line. */
const MIN_ROOM_HEIGHT = 3.2
/** A wider, interior-photography lens while standing in a room. */
const ROOM_FOV = 56
/** Standing eye height and the height of the point the camera turns around. */
const EYE = 1.6
const PIVOT = 1.05

/**
 * Indoors the camera stays in the room. It never comes nearer the walls than this (its near plane,
 * 10 cm ahead with a ~9 cm half-width, then never cuts into a wall or sees past its end) …
 */
const CAMERA_RADIUS = 0.14
/** … and the point it turns about keeps this far from them, so there is always room to orbit. */
const PIVOT_CLEARANCE = 0.35

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** The volume the section box keeps for a room hotspot (floor slab, block volume or GLB node). */
function roomVolume(hotspot: Box3): Box3 {
  const b = hotspot.clone().expandByVector(new Vector3(WALL_MARGIN, 0, WALL_MARGIN))
  b.min.y -= 0.14
  b.max.y = Math.max(b.max.y + 0.4, b.min.y + MIN_ROOM_HEIGHT)
  return b
}

/** The space an indoor camera may move in: the room's interior, held off its walls, floor and ceiling. */
function cameraSpace(room: Box3): Box3 {
  const b = room.clone().expandByVector(new Vector3(-CAMERA_RADIUS, 0, -CAMERA_RADIUS))
  b.min.y += 0.25
  b.max.y -= CAMERA_RADIUS
  return b
}

/**
 * Stands the camera inside the room at eye height, turning around the room's centre: orbiting
 * then looks around the room 360°. Outdoors, zooming out rises to an overview.
 */
async function enterRoom(controls: CameraControls, volume: Box3, focus: Box3, smoothTime: number, outdoor: boolean, view?: 'overview' | 'eye') {
  const c = focus.getCenter(new Vector3())
  const floorY = volume.min.y + 0.14
  const half = Math.min(focus.max.x - focus.min.x, focus.max.z - focus.min.z) / 2
  // A large outdoor area (a pool, a court) or a solid building opens from a raised vantage over
  // it; zoom in to walk it. A hotspot can ask for either view explicitly.
  const overview = view ? view === 'overview' : outdoor && half > 5
  // Stay well inside the walls, even in narrow rooms (a small bathroom is under 2 m across).
  const distance = overview ? Math.max(half * 1.7, 9) : outdoor ? MathUtils.clamp(half * 0.8, 1.1, 4.5) : MathUtils.clamp(Math.min(half * 0.8, half - CAMERA_RADIUS - 0.1), 0.5, 4.5)
  // Eye height where there is room for it; standing close in a small room, look less steeply down.
  const rise = Math.min(EYE - PIVOT, distance * 0.45)
  const polar = overview ? MathUtils.degToRad(56) : Math.acos(MathUtils.clamp(rise / distance, 0.05, 0.9))
  controls.smoothTime = smoothTime
  await settle(
    Promise.all([
      controls.moveTo(c.x, floorY + (overview ? 0.4 : PIVOT), c.z, true),
      controls.dollyTo(distance, true),
      controls.rotatePolarTo(polar, true),
      controls.setFocalOffset(0, 0, 0, true),
    ]),
    2500,
  )
  controls.smoothTime = BASE_SMOOTH_TIME
}

/**
 * The immersive room view, inside the 3D stage. Six global clipping planes form a section box
 * that normally encloses the whole site; opening a room shrinks it onto that room while the camera
 * flies in, so the rest of the house falls away and the room stands alone like a cut model.
 * The camera then stands in the room: look around 360°, zoom in and out, pan and tilt.
 */
export function RoomSection({
  room,
  focus,
  site,
  outdoor = false,
  view,
}: {
  room: Box3 | null
  focus: Box3 | null
  site: Box3
  outdoor?: boolean
  /** Set by the hotspot: open from a raised overview, or standing at eye level. */
  view?: 'overview' | 'eye'
}) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const controls = useStageStore((s) => s.controls)
  const setRoomReady = useViewerStore((s) => s.setRoomReady)

  const planes = useMemo(() => Array.from({ length: 6 }, () => new Plane()), [])
  const outer = useMemo(() => site.clone().expandByScalar(40), [site])
  const current = useRef(outer.clone())
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const anim = useRef<{ from: Box3; to: Box3; fovFrom: number; fovTo: number; t: number; done?: () => void } | null>(null)
  // Camera lens, limits and Reset View of the whole-property view, restored when the room closes.
  const saved = useRef<{ fov: number; min: number; max: number; polar: number; home: (() => void) | null } | null>(null)

  const apply = (b: Box3) => {
    planes[0].set(new Vector3(1, 0, 0), -b.min.x)
    planes[1].set(new Vector3(-1, 0, 0), b.max.x)
    planes[2].set(new Vector3(0, 1, 0), -b.min.y)
    planes[3].set(new Vector3(0, -1, 0), b.max.y)
    planes[4].set(new Vector3(0, 0, 1), -b.min.z)
    planes[5].set(new Vector3(0, 0, -1), b.max.z)
  }

  // Planes stay installed for the whole property visit, so opening a room never recompiles shaders.
  useLayoutEffect(() => {
    apply(current.current)
    // oxlint-disable-next-line react/immutability -- the renderer is configured imperatively
    gl.clippingPlanes = planes
    invalidate()
    return () => {
      gl.clippingPlanes = []
      invalidate()
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, planes])

  const animateTo = (to: Box3, fov: number) =>
    new Promise<void>((resolve) => {
      anim.current?.done?.()
      anim.current = { from: current.current.clone(), to, fovFrom: camera.fov, fovTo: fov, t: 0, done: resolve }
      invalidate()
    })

  useFrame((_, delta) => {
    const a = anim.current
    if (!a) return
    a.t = Math.min(1, a.t + Math.min(delta, 0.1) / SECTION_SECONDS)
    const k = ease(a.t)
    current.current.min.lerpVectors(a.from.min, a.to.min, k)
    current.current.max.lerpVectors(a.from.max, a.to.max, k)
    apply(current.current)
    // oxlint-disable-next-line react/immutability -- the camera lens eases with the section box
    camera.fov = MathUtils.lerp(a.fovFrom, a.fovTo, k)
    camera.updateProjectionMatrix()
    invalidate()
    if (a.t >= 1) {
      anim.current = null
      a.done?.()
    }
  })

  const volume = useMemo(() => (room ? roomVolume(room) : null), [room])
  // Indoors, an invisible inside-out box at the camera's limits: camera-controls casts from the
  // pivot through the corners of the near plane and pulls the camera in to the first hit, so
  // orbiting, panning and zooming (wheel or pinch) all stop at the walls, at any distance.
  const collider = useMemo(() => {
    if (!room || outdoor) return null
    const space = cameraSpace(room)
    const size = space.getSize(new Vector3())
    const mesh = new Mesh(new BoxGeometry(size.x, size.y, size.z), new MeshBasicMaterial({ side: BackSide }))
    space.getCenter(mesh.position)
    mesh.updateMatrixWorld(true)
    return { mesh, space }
  }, [room, outdoor])
  useEffect(
    () => () => {
      collider?.mesh.geometry.dispose()
      ;(collider?.mesh.material as MeshBasicMaterial | undefined)?.dispose()
    },
    [collider],
  )

  useEffect(() => {
    if (!controls) return
    let cancelled = false

    if (volume) {
      const stage = useStageStore.getState()
      if (!saved.current)
        saved.current = { fov: camera.fov, min: controls.minDistance, max: controls.maxDistance, polar: controls.maxPolarAngle, home: stage.home }
      const sphere = volume.getBoundingSphere(new Sphere())
      const frame = (smoothTime: number) => enterRoom(controls, volume, focus ?? volume, smoothTime, outdoor, view)

      controls.minDistance = 0.3
      // Inside a room, zoom straight along the view rather than towards the cursor: the target
      // then stays on the room, with no drift or sideways slide while pinching or scrolling.
      controls.dollyToCursor = false
      // Low enough to stand in the room and look straight across it.
      controls.maxPolarAngle = MathUtils.degToRad(92)
      if (collider) {
        // Zoom out no further than across the room; the walls hold the camera in before that.
        const size = collider.space.getSize(new Vector3())
        controls.maxDistance = Math.max(1, Math.hypot(size.x, size.z))
        const pivot = collider.space.clone().expandByVector(new Vector3(-PIVOT_CLEARANCE, 0, -PIVOT_CLEARANCE))
        // A room narrower than twice the clearance keeps its pivot on the centre line.
        for (const a of ['x', 'z'] as const)
          if (pivot.min[a] > pivot.max[a]) pivot.min[a] = pivot.max[a] = (collider.space.min[a] + collider.space.max[a]) / 2
        controls.setBoundary(pivot)
        // Walls hold the camera from when it has flown into the room (see below), not on the way in.
        controls.colliderMeshes = []
      } else {
        controls.maxDistance = sphere.radius * 3.2
        controls.setBoundary(volume.clone().expandByScalar(0.5))
        controls.colliderMeshes = []
      }
      stage.setHome(() => {
        stage.setAutoRotate(false)
        void frame(0.7)
      })

      setRoomReady(false)
      void Promise.all([animateTo(volume, ROOM_FOV), frame(0.85)]).then(() => {
        if (cancelled) return
        if (collider) controls.colliderMeshes = [collider.mesh]
        setRoomReady(true)
      })
    } else if (saved.current) {
      const { fov, min, max, polar, home } = saved.current
      saved.current = null
      controls.minDistance = min
      controls.maxDistance = max
      controls.dollyToCursor = true
      controls.colliderMeshes = []
      controls.maxPolarAngle = polar
      controls.setBoundary(new Box3(new Vector3(site.min.x, 0, site.min.z), new Vector3(site.max.x, 14, site.max.z)))
      useStageStore.getState().setHome(home)
      void animateTo(outer, fov)
      home?.()
    }
    return () => {
      cancelled = true
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [controls, volume, collider])

  return null
}
