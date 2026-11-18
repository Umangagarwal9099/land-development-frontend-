import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Box3, Material, Mesh, PMREMGenerator, Vector3, type Object3D, type Texture } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * A product held up to be looked at: its detailed model, built on demand, in a small stage of its
 * own with soft studio light. Drag to turn it, scroll or pinch to come closer; it turns slowly by
 * itself until touched.
 */
export default function ModelInspector({ make }: { make: () => Object3D }) {
  const model = useMemo(() => {
    const o = make()
    // The scene's materials reflect the mall's environment map, which lives in the main canvas's
    // context; here each gets a copy that reflects this stage's studio instead.
    const copies = new Map<Material, Material>()
    o.traverse((c) => {
      const m = c as Mesh
      if (!m.isMesh) return
      const swap = (mat: Material) => {
        let copy = copies.get(mat)
        if (!copy) {
          copy = mat.clone()
          ;(copy as Material & { envMap?: unknown }).envMap = null
          copies.set(mat, copy)
        }
        return copy
      }
      m.material = Array.isArray(m.material) ? m.material.map(swap) : swap(m.material)
      m.castShadow = false
    })
    // Stand it on the stage's floor, centred.
    const box = new Box3().setFromObject(o)
    const c = box.getCenter(new Vector3())
    o.position.sub(new Vector3(c.x, box.min.y, c.z))
    o.userData.copies = copies
    o.userData.size = box.getSize(new Vector3()).length()
    return o
  }, [make])

  // The studio's reflections: a soft room, prefiltered for this canvas when it starts.
  const env = useRef<Texture | null>(null)
  useEffect(
    () => () => {
      env.current?.dispose()
      for (const m of (model.userData.copies as Map<Material, Material>).values()) m.dispose()
      model.traverse((c) => {
        const m = c as Mesh
        if (m.isMesh) m.geometry.dispose()
      })
    },
    [model],
  )

  const size = model.userData.size as number
  return (
    <div className="relative mt-3 h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-[#f4efe7] to-[#ddd5c8]">
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 28, near: 0.005, far: 20, position: [size * 1.1, size * 0.55, size * 1.35] }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl, scene }) => {
          const pm = new PMREMGenerator(gl)
          env.current = pm.fromScene(new RoomEnvironment(), 0.04).texture
          pm.dispose()
          scene.environment = env.current
          scene.environmentIntensity = 0.7
        }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[1.5, 2.5, 2]} intensity={1.6} />
        <directionalLight position={[-2, 1, -1.5]} intensity={0.7} />
        <primitive object={model} />
        <OrbitControls makeDefault target={[0, size * 0.18, 0]} enablePan={false} minDistance={size * 0.45} maxDistance={size * 4} autoRotate autoRotateSpeed={1.2} enableDamping />
      </Canvas>
      <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] uppercase tracking-[0.16em] text-black/40">Drag to turn · scroll to zoom</p>
    </div>
  )
}
