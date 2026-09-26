import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect } from 'react'
import { assetUrl } from '../../../config'
import { DRACO_PATH, disposeObject, getKtx2Loader } from '../../../lib/three'

interface Props {
  url: string
  /** Small, low-texture version shown while the full model streams in. */
  lowUrl?: string
  onReady: () => void
}

/** Progressive model: low LOD appears first, then is swapped for the full model when it arrives. */
export function GltfModel({ url, lowUrl, onReady }: Props) {
  return (
    <Suspense fallback={lowUrl ? <GltfScene url={lowUrl} onReady={onReady} /> : null}>
      <GltfScene url={url} onReady={onReady} />
    </Suspense>
  )
}

function GltfScene({ url, onReady }: { url: string; onReady: () => void }) {
  const gl = useThree((s) => s.gl)
  const src = assetUrl(url)
  // Supports Draco and Meshopt geometry plus KTX2 textures — whatever gltf-transform produced.
  const { scene } = useGLTF(src, DRACO_PATH, true, (loader) => loader.setKTX2Loader(getKtx2Loader(gl)))

  useLayoutEffect(onReady, [scene, onReady])

  // Leaving the property (or swapping LODs) releases the model from GPU memory and the loader cache.
  useEffect(
    () => () => {
      disposeObject(scene)
      useGLTF.clear(src)
    },
    [scene, src],
  )

  return <primitive object={scene} />
}
