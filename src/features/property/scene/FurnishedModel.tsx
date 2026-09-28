import { useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import type { FurnishedDesign } from '../../../api/types'
import { disposeObject } from '../../../lib/three'
import { FURNISHED_DESIGNS } from './furnished'

/**
 * A furnished interior design model generated in code: architecture with walls cut away at
 * 2.6 m, finishes, custom furniture and warm interior lighting. Follows the same naming contract
 * as an artist GLB (floor_* groups, room_* and amenity_* hotspots), so rooms are tappable as usual.
 */
export function FurnishedModel({ design, selectedMesh, onReady }: { design: FurnishedDesign; selectedMesh: string | null; onReady: () => void }) {
  const invalidate = useThree((s) => s.invalidate)
  const model = useMemo(() => FURNISHED_DESIGNS[design].build(), [design])

  useLayoutEffect(onReady, [model, onReady])

  // Leaving the property releases the model's geometry and painted textures from GPU memory.
  useEffect(() => () => disposeObject(model.root), [model])

  // The selected room's floor glows gold; the others stay invisible but remain tappable.
  useEffect(() => {
    // oxlint-disable-next-line react/immutability -- three.js materials are mutated by design
    for (const [name, mat] of model.highlights) mat.opacity = name === selectedMesh ? 0.22 : 0
    invalidate()
  }, [model, selectedMesh, invalidate])

  return <primitive object={model.root} />
}
