import { useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { Light, type Object3D } from 'three'
import type { FurnishedDesign } from '../../../api/types'
import { whenIdle } from '../../../lib/idle'
import { prepareOnGpu } from '../../../lib/three'
import { furnishedModel, type FurnishedModel } from '../../property/scene/furnished'

/**
 * A designed home's model for its plot, ready to draw: built in an idle moment of its own (never
 * several in one frame, so the landing screen's titles and the camera keep their frames), then
 * put on the GPU in the background, its finishes a few per frame and its shaders compiled in
 * parallel. Until then the plot shows without it.
 */
export function usePlotModel(design: FurnishedDesign): FurnishedModel | null {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const invalidate = useThree((s) => s.invalidate)
  const [ready, setReady] = useState<{ design: FurnishedDesign; model: FurnishedModel } | null>(null)
  useEffect(() => {
    let live = true
    const cancel = whenIdle(() => {
      if (!live) return
      const m = furnishedModel(design, true)
      // The plan has hundreds of materials; the model's own point lights would cost every one of them.
      const lights: Object3D[] = []
      m.root.traverse((o) => o instanceof Light && lights.push(o))
      for (const l of lights) l.removeFromParent()
      void prepareOnGpu(m.root, gl, camera, scene, { live: () => live }).then(() => {
        if (!live) return
        setReady({ design, model: m })
        invalidate()
      })
    })
    return () => {
      live = false
      cancel()
    }
  }, [design, gl, camera, scene, invalidate])
  return ready?.design === design ? ready.model : null
}
