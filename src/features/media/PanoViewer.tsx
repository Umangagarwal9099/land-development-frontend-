import { OrbitControls, useTexture } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { BackSide, SRGBColorSpace, type PerspectiveCamera } from 'three'
import { assetUrl } from '../../config'

/** Equirectangular 360° viewer: drag/swipe to look around, wheel/pinch to zoom. Lazy-loaded. */
export default function PanoViewer({ url }: { url: string }) {
  return (
    <div className="relative h-full w-full touch-none">
      <Canvas frameloop="demand" camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <Suspense fallback={null}>
          <PanoSphere url={assetUrl(url)} />
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={false} enableDamping rotateSpeed={-0.35} />
        <FovZoom />
      </Canvas>
    </div>
  )
}

function PanoSphere({ url }: { url: string }) {
  const texture = useTexture(url, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  useEffect(() => () => texture.dispose(), [texture])
  return (
    // Negative x-scale flips the sphere so the image isn't mirrored when viewed from inside.
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 64, 32]} />
      <meshBasicMaterial map={texture} side={BackSide} />
    </mesh>
  )
}

/** Zoom by narrowing the field of view (moving the camera inside a sphere would distort). */
function FovZoom() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    const el = gl.domElement
    const setFov = (fov: number) => {
      camera.fov = Math.min(90, Math.max(30, fov))
      camera.updateProjectionMatrix()
      invalidate()
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setFov(camera.fov + e.deltaY * 0.03)
    }
    // Pinch: track two touch points and scale fov by the change in their distance.
    const touches = new Map<number, { x: number; y: number }>()
    let startDist = 0
    let startFov = camera.fov
    const dist = () => {
      const [a, b] = [...touches.values()]
      return Math.hypot(a.x - b.x, a.y - b.y)
    }
    const onDown = (e: PointerEvent) => {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touches.size === 2) {
        startDist = dist()
        startFov = camera.fov
      }
    }
    const onMove = (e: PointerEvent) => {
      if (!touches.has(e.pointerId)) return
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touches.size === 2 && startDist > 0) setFov(startFov * (startDist / dist()))
    }
    const onUp = (e: PointerEvent) => touches.delete(e.pointerId)

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [camera, gl, invalidate])

  return null
}
