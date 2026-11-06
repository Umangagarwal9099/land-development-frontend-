import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Object3D } from 'three'
import type { FurnishedDesign, Room } from '../../../api/types'
import { disposeObject, prepareOnGpu } from '../../../lib/three'
import { useStageStore } from '../../../store/stage'
import { useViewerStore } from '../../../store/viewer'
import { useWalkStore } from '../../../store/walk'
import { furnishedModel, isBuilt, isCached, type FurnishedModel as Model } from './furnished'
import { stepCircuits } from './furnished/kalakalD65/fixtures'
import { WalkController } from './walk/WalkController'

interface Props {
  design: FurnishedDesign
  selectedMesh: string | null
  hoveredMesh?: string | null
  /** A room is open in the room viewer: its floor glows only faintly so the finishes read. */
  roomView?: boolean
  rooms?: Room[]
  onReady: () => void
}

/**
 * A furnished interior design model generated in code: architecture with walls cut away at
 * 2.6 m, finishes, custom furniture and warm interior lighting. Follows the same naming contract
 * as an artist GLB (floor_* groups, room_* and amenity_* hotspots), so rooms are tappable as usual.
 */
export function FurnishedModel(props: Props) {
  const model = useBuiltModel(props.design)
  return model ? <Furnished {...props} model={model} /> : null
}

/**
 * The design's model, built after the stage loader has painted: building it in code holds the
 * main thread for its whole duration, so it waits two frames for the loader to appear and say so.
 * A model kept from an earlier visit (or built ahead while the visitor looked at the plan) is
 * there at once.
 */
function useBuiltModel(design: FurnishedDesign): Model | null {
  const setLoading = useStageStore((s) => s.setLoading)
  const [built, setBuilt] = useState<{ design: FurnishedDesign; model: Model } | null>(() =>
    isBuilt(design) ? { design, model: furnishedModel(design) } : null,
  )
  const model = built?.design === design ? built.model : null
  useEffect(() => {
    if (model) return
    setLoading({ label: 'Building the model', progress: 0.02 })
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setBuilt({ design, model: furnishedModel(design) }))
    })
    return () => cancelAnimationFrame(frame)
  }, [design, model, setLoading])
  return model
}

function Furnished({ design, model, selectedMesh, hoveredMesh = null, roomView = false, rooms = [], onReady }: Props & { model: Model }) {
  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const setLoading = useStageStore((s) => s.setLoading)

  // Put the model on the GPU before revealing it: its finishes go up a few per frame, then every
  // shader it needs compiles (in parallel where the browser supports it), so the first frames
  // after entering aren't a stall. The stage loader shows each stage's real progress meanwhile.
  useEffect(() => {
    let live = true
    setLoading({ label: 'Uploading finishes', progress: 0.3 })
    void prepareOnGpu(model.root, gl, camera, scene, {
      live: () => live,
      onProgress: (f) => setLoading(f < 1 ? { label: 'Uploading finishes', progress: 0.3 + 0.55 * f } : { label: 'Compiling materials', progress: 0.88 }),
    }).then(() => live && onReady())
    return () => {
      live = false
    }
  }, [model, onReady, gl, camera, scene, setLoading])

  // Photograph textures arrive after the first frame; the stage renders on demand, so redraw then.
  useEffect(() => {
    let live = true
    void model.ready?.then(() => live && invalidate())
    return () => {
      live = false
    }
  }, [model, invalidate])

  // Light the room being viewed (or the exterior), from the model's light pool.
  const walkingNow = useWalkStore((s) => s.active)
  const zone = roomView && selectedMesh ? selectedMesh : 'exterior'
  useEffect(() => {
    // A walk lights whichever room the walker is in (see WalkController).
    if (walkingNow) return
    model.setZone?.(zone)
    invalidate()
  }, [model, zone, invalidate, walkingNow])
  useFrame((state, delta) => {
    // Light switches fade their circuits over a few frames; keep frames coming until they settle.
    if (stepCircuits(delta)) state.invalidate()
    model.syncLights?.()
    // Below ground, the services overhead come and go as the camera enters the level or rises out of it.
    if (model.basement?.frame(state.camera)) state.invalidate()
    if (model.frame?.(state.camera)) state.invalidate()
    // Lifts finish what they were doing (walking, the walk controller runs them with the walker).
    const lifts = model.lifts ?? model.basement
    if (lifts && !useWalkStore.getState().active && lifts.tick(delta, null)) state.invalidate()
  })

  // The model is told which floor is looked at, so it can show that floor's fittings and hotspots.
  const activeLevel = useViewerStore((s) => s.activeLevel)
  const viewRoom = roomView ? selectedMesh : null
  useEffect(() => {
    model.setView?.({ level: activeLevel, walking: walkingNow, room: viewRoom })
    invalidate()
  }, [model, activeLevel, walkingNow, viewRoom, invalidate])

  const daylight = useStageStore((s) => s.daylight)
  useEffect(() => {
    model.setDaylight?.(daylight)
    invalidate()
  }, [model, daylight, invalidate])

  const basementReady = useBasement(model, onReady)

  // Leaving the property releases a one-off model from GPU memory. A kept model stays for the next
  // visit, with its doors, drawers and fittings put back as they were found.
  useEffect(
    () => () => {
      if (isCached(design)) resetOpenables(model.root)
      else disposeObject(model.root)
    },
    [model, design],
  )

  // The selected room's floor glows gold and the hovered one faintly; the rest stay invisible but tappable.
  useEffect(() => {
    for (const [name, mat] of model.highlights)
      // oxlint-disable-next-line react/immutability -- three.js materials are mutated by design
      mat.opacity = name === selectedMesh ? (roomView ? 0.06 : 0.22) : name === hoveredMesh ? 0.12 : 0
    invalidate()
  }, [model, selectedMesh, hoveredMesh, roomView, invalidate])

  const stopWalking = useWalkStore((s) => s.stop)
  // Leaving the property ends a walk.
  useEffect(() => stopWalking, [stopWalking])
  const roomNames = useMemo(() => new Map(rooms.map((r) => [r.meshName, r.name])), [rooms])
  const setWalkZone = useCallback(
    (z: string) => {
      model.setZone?.(z)
      invalidate()
    },
    [model, invalidate],
  )

  return (
    <>
      <primitive object={model.root} />
      {walkingNow && model.walk && (!model.basement || basementReady) && (
        <WalkController root={model.root} area={model.walk} setZone={setWalkZone} rooms={roomNames} basement={model.basement} lifts={model.lifts ?? model.basement} />
      )}
    </>
  )
}

/**
 * Shows the level chosen on the level rail. The basements are built the first time one is
 * chosen, behind the stage loader (building, uploading, compiling, as for the model itself), so
 * the building above opens no slower for having them. Ready, the model reports in again, so
 * hotspots and the room viewer find the new levels.
 */
function useBasement(model: Model, onReady: () => void) {
  const activeLevel = useViewerStore((s) => s.activeLevel)
  // Walking, the basements stand with the building, all of a piece, and are built before the walk begins.
  const walking = useWalkStore((s) => s.active)
  const view = walking ? 'walk' : activeLevel
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const invalidate = useThree((s) => s.invalidate)
  const setLoading = useStageStore((s) => s.setLoading)
  const setSceneReady = useStageStore((s) => s.setSceneReady)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    const basement = model.basement
    if (!basement) return
    const below = walking || (activeLevel !== null && activeLevel < 0)
    if (!below || basement.ready) {
      basement.show(view)
      // The sun's shadows change with what is shown (see PropertyScene).
      // oxlint-disable-next-line react/immutability -- the renderer is configured imperatively
      gl.shadowMap.needsUpdate = true
      invalidate()
      return
    }
    let live = true
    let started = false
    setSceneReady(false)
    setLoading({ label: walking ? 'Preparing the walk' : 'Building the basement', progress: 0.05 })
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        started = true
        basement.build()
        basement.show(view)
        setLoading({ label: 'Uploading finishes', progress: 0.35 })
        void prepareOnGpu(basement.root, gl, camera, scene, {
          live: () => live,
          onProgress: (f) => setLoading(f < 1 ? { label: 'Uploading finishes', progress: 0.35 + 0.5 * f } : { label: 'Compiling materials', progress: 0.9 }),
        }).then(() => mounted.current && onReady())
      })
    })
    return () => {
      live = false
      cancelAnimationFrame(frame)
      // Left before building began: nothing to wait for.
      if (!started && mounted.current) setSceneReady(true)
    }
  }, [model, activeLevel, walking, view, gl, camera, scene, invalidate, setLoading, setSceneReady, onReady])
  // Built, the model reports in (onReady), so this renders again and reads it.
  return !!model.basement?.ready
}

/** Closes every door and drawer and stops every spinner, instantly. */
function resetOpenables(root: Object3D) {
  root.traverse((o) => {
    if (!/^(door_|drawer_|spin_)/.test(o.name)) return
    o.userData.open = false
    o.userData.on = false
    o.userData.speed = 0
    if (typeof o.userData.closedY === 'number') o.rotation[(o.userData.axis as 'x' | 'y' | undefined) ?? 'y'] = o.userData.closedY
    if (o.userData.closedPos) o.position.copy(o.userData.closedPos)
  })
}
