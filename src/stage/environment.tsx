import { Environment, Lightformer } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, Fog, InstancedMesh, Object3D } from 'three'
import type { Point2 } from '../api/types'

export const BACKGROUND = '#07080a'

/** Atmospheric depth scaled to the scene; far geometry melts into the background. */
export function useFog(near: number, far: number) {
  const scene = useThree((s) => s.scene)
  const invalidate = useThree((s) => s.invalidate)
  useLayoutEffect(() => {
    // oxlint-disable-next-line react/immutability -- the three.js scene is meant to be mutated
    scene.fog = new Fog(BACKGROUND, near, far)
    invalidate()
    return () => {
      scene.fog = null
    }
  }, [scene, near, far, invalidate])
}

/**
 * Studio lighting for a physical scale model at dusk: warm key light with soft shadows, cool sky
 * fill, and a locally generated environment for reflections. drei's <Environment preset> fetches
 * HDRIs from a CDN, which would break the offline kiosk; Lightformers render on the GPU instead.
 */
export function SceneLighting({ radius, center = [0, 0, 0] }: { radius: number; center?: [number, number, number] }) {
  const [cx, , cz] = center
  const r = radius * 1.15
  return (
    <>
      <hemisphereLight args={['#d9e2f2', '#1a1712', 0.75]} />
      <directionalLight
        position={[cx + radius * 0.8, radius * 1.3, cz + radius * 0.55]}
        intensity={2.4}
        color="#ffe6c2"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={radius > 100 ? 0.4 : 0.04}
        shadow-camera-left={-r}
        shadow-camera-right={r}
        shadow-camera-top={r}
        shadow-camera-bottom={-r}
        shadow-camera-near={1}
        shadow-camera-far={radius * 4}
      >
        <object3D attach="target" position={[cx, 0, cz]} />
      </directionalLight>
      <directionalLight position={[cx - radius, radius * 0.5, cz - radius]} intensity={0.45} color="#8fa6c9" />
    </>
  )
}

export function StudioEnvironment() {
  return (
    <Environment resolution={128} frames={1} environmentIntensity={0.35}>
      <color attach="background" args={['#0b0c0f']} />
      <Lightformer intensity={2.2} color="#ffe2b8" position={[0, 6, -8]} scale={[16, 3, 1]} />
      <Lightformer intensity={0.9} color="#b9c8e6" position={[-8, 3, 4]} rotation-y={Math.PI / 2} scale={[12, 2, 1]} />
      <Lightformer intensity={0.6} color="#ffffff" position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
    </Environment>
  )
}

/** Endless dark floor the model's plinth sits on; fog dissolves its edge into the background. */
export function Floor({ y, size }: { y: number; size: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={y} receiveShadow raycast={() => null}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#0b0c0e" roughness={0.95} />
    </mesh>
  )
}

/** A bevelled base the site sits on, like the table of a physical architectural model. */
export function Plinth({ minX, minZ, maxX, maxZ, height, color = '#15181a' }: { minX: number; minZ: number; maxX: number; maxZ: number; height: number; color?: string }) {
  const w = maxX - minX
  const d = maxZ - minZ
  const cx = (minX + maxX) / 2
  const cz = (minZ + maxZ) / 2
  const edge = useMemo(
    () => new Float32Array([minX, 0.01, minZ, maxX, 0.01, minZ, maxX, 0.01, maxZ, minX, 0.01, maxZ]),
    [minX, minZ, maxX, maxZ],
  )
  return (
    <group>
      <mesh position={[cx, -height / 2, cz]} receiveShadow raycast={() => null}>
        <boxGeometry args={[w, height, d]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
      {/* Gold inlay around the top edge. */}
      <lineLoop raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edge, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#d4b26a" transparent opacity={0.55} />
      </lineLoop>
    </group>
  )
}

// Deterministic per-tree variation so the landscape doesn't reshuffle on every render.
const hash = (x: number, z: number) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453
  return s - Math.floor(s)
}

const CROWN_GREENS = ['#2f4a32', '#3a5a3b', '#2a4230', '#445f3a', '#35513f'].map((c) => new Color(c))

/**
 * Every tree in the scene as two instanced meshes (trunks + crowns): hundreds of trees for two
 * draw calls. Low-poly, flat-shaded crowns read as a model-maker's foam trees.
 */
export function Trees({ points, scale = 1, y = 0 }: { points: Point2[]; scale?: number; y?: number }) {
  const trunks = useRef<InstancedMesh>(null)
  const crowns = useRef<InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)

  useLayoutEffect(() => {
    const t = trunks.current
    const c = crowns.current
    if (!t || !c) return
    const o = new Object3D()
    points.forEach(([x, z], i) => {
      const h = hash(x, z)
      const s = scale * (0.75 + h * 0.6)
      o.position.set(x, y + 1.1 * s, z)
      o.rotation.set(0, h * Math.PI * 2, 0)
      o.scale.set(s, 2.2 * s, s)
      o.updateMatrix()
      t.setMatrixAt(i, o.matrix)
      o.position.set(x, y + 3.2 * s, z)
      o.scale.set(1.9 * s, 2.3 * s, 1.9 * s)
      o.updateMatrix()
      c.setMatrixAt(i, o.matrix)
      c.setColorAt(i, CROWN_GREENS[Math.floor(h * CROWN_GREENS.length)])
    })
    t.instanceMatrix.needsUpdate = true
    c.instanceMatrix.needsUpdate = true
    if (c.instanceColor) c.instanceColor.needsUpdate = true
    t.computeBoundingSphere()
    c.computeBoundingSphere()
    invalidate()
  }, [points, scale, y, invalidate])

  if (points.length === 0) return null
  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, points.length]} castShadow raycast={() => null}>
        <cylinderGeometry args={[0.08, 0.12, 1, 5]} />
        <meshStandardMaterial color="#4a3a2a" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, points.length]} castShadow receiveShadow raycast={() => null}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  )
}
