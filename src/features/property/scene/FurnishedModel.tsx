import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import type { Mesh, Object3D, Texture } from 'three'
import type { FurnishedDesign } from '../../../api/types'
import { disposeObject } from '../../../lib/three'
import { useStageStore } from '../../../store/stage'
import { furnishedModel, isCached } from './furnished'
import { stepCircuits } from './furnished/kalakalD65/fixtures'

/**
 * A furnished interior design model generated in code: architecture with walls cut away at
 * 2.6 m, finishes, custom furniture and warm interior lighting. Follows the same naming contract
 * as an artist GLB (floor_* groups, room_* and amenity_* hotspots), so rooms are tappable as usual.
 */
export function FurnishedModel({
  design,
  selectedMesh,
  hoveredMesh = null,
  roomView = false,
  onReady,
}: {
  design: FurnishedDesign
  selectedMesh: string | null
  hoveredMesh?: string | null
  /** A room is open in the room viewer: its floor glows only faintly so the finishes read. */
  roomView?: boolean
  onReady: () => void
}) {
  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const model = useMemo(() => furnishedModel(design), [design])

  // Compile every shader the model needs before revealing it (in parallel where the browser
  // supports it), so the first frames after entering aren't a stall; the stage loader shows meanwhile.
  // Textures go up to the GPU a few per frame first, so the loader keeps moving instead of
  // freezing while dozens of painted finishes upload at once.
  useEffect(() => {
    let live = true
    let frame = 0
    const reveal = () => live && onReady()
    const textures = new Set<Texture>()
    model.root.traverse((o) => {
      const mats = (o as Mesh).material
      if (!mats) return
      for (const m of Array.isArray(mats) ? mats : [mats])
        for (const v of Object.values(m)) if ((v as Texture | null)?.isTexture) textures.add(v as Texture)
    })
    const queue = [...textures]
    const upload = () => {
      if (!live) return
      const end = performance.now() + 8
      while (queue.length && performance.now() < end) gl.initTexture(queue.pop()!)
      if (queue.length) frame = requestAnimationFrame(upload)
      else gl.compileAsync(model.root, camera, scene).then(reveal, reveal)
    }
    frame = requestAnimationFrame(upload)
    return () => {
      live = false
      cancelAnimationFrame(frame)
    }
  }, [model, onReady, gl, camera, scene])

  // Photograph textures arrive after the first frame; the stage renders on demand, so redraw then.
  useEffect(() => {
    let live = true
    void model.ready?.then(() => live && invalidate())
    return () => {
      live = false
    }
  }, [model, invalidate])

  // Light the room being viewed (or the exterior), from the model's light pool.
  const zone = roomView && selectedMesh ? selectedMesh : 'exterior'
  useEffect(() => {
    model.setZone?.(zone)
    invalidate()
  }, [model, zone, invalidate])
  useFrame((state, delta) => {
    // Light switches fade their circuits over a few frames; keep frames coming until they settle.
    if (stepCircuits(delta)) state.invalidate()
    model.syncLights?.()
  })

  const daylight = useStageStore((s) => s.daylight)
  useEffect(() => {
    model.setDaylight?.(daylight)
    invalidate()
  }, [model, daylight, invalidate])

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

  return <primitive object={model.root} />
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
