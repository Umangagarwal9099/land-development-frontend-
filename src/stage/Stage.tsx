import { Bvh } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Component, Suspense, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { ACESFilmicToneMapping, type Light, type Mesh, type Scene } from 'three'
import MasterPlanScene from '../features/masterplan/scene/MasterPlanScene'
import PropertyScene from '../features/property/scene/PropertyScene'
import { useStageStore } from '../store/stage'
import { CameraRig } from './CameraRig'
import { SceneBackground, StudioEnvironment } from './environment'
import { StageLoader } from './StageLoader'

/**
 * The persistent 3D stage, mounted once behind every screen (lazy: three.js is its own chunk).
 * frameloop="demand" renders only while something moves, so the GPU idles on a kiosk that runs all day.
 */
export default function Stage() {
  const scene = useStageStore((s) => s.scene)
  const visible = useStageStore((s) => s.sceneReady && !s.dimmed && !s.compiling)
  const daylight = useStageStore((s) => s.daylight)

  return (
    <div className="fixed inset-0 z-0 touch-none select-none">
      <div className="absolute inset-0 transition-opacity duration-700 ease-[var(--ease-lux)]" style={{ opacity: visible ? 1 : 0 }}>
      <Canvas
        frameloop="demand"
        // PCF shadows; three r18x removed the PCFSoft default that `shadows` would request.
        shadows="percentage"
        // The display's full sharpness (up to 2×), always: lowering it, even only while the
        // camera moved, visibly softened the models.
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ position: [0, 400, 600], fov: 38, near: 0.5, far: 6000 }}
        // Development only: exposes the renderer state for profiling (draw calls, frame times).
        onCreated={(state) => {
          if (import.meta.env.DEV) (window as unknown as { __stage: unknown }).__stage = state
        }}
      >
        <SceneBackground />
        <CameraRig />
        <ShadowCache />
        <RenderGate />
        <StudioEnvironment />
        <Suspense fallback={null}>
          {/* Keyed per scene: <Bvh> only accelerates meshes present when it mounts. */}
          {scene && (
            <SceneErrorBoundary key={`${scene.kind}:${scene.slug}`}>
              <Bvh firstHitOnly>
                {scene.kind === 'masterplan' ? <MasterPlanScene slug={scene.slug} /> : <PropertyScene slug={scene.slug} />}
                <ShaderWarmup />
              </Bvh>
            </SceneErrorBoundary>
          )}
        </Suspense>
      </Canvas>
      </div>
      {/* Cinematic falloff toward the edges keeps the eye on the model. */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(7_8_10/0.75)_100%)] ${daylight ? 'opacity-50' : ''}`}
      />
      <StageLoader />
    </div>
  )
}

/**
 * Draws each frame the scene asks for, except while a newly mounted scene's shaders compile. Its
 * priority takes over R3F's own render call, after every other frame callback has run.
 */
function RenderGate() {
  useFrame(({ gl, scene, camera }) => {
    if (!useStageStore.getState().compiling) gl.render(scene, camera)
  }, 1)
  return null
}

/**
 * Compiles a newly mounted scene's shaders in the background (compileAsync, which uses the
 * browser's parallel shader compilation) before its first frame. Drawn straight away, the first
 * frame links every program one after another inside a single frame: that is what held the
 * landing page's first paint for seconds and froze its titles mid-animation. Mounted after the
 * scene, so its effect runs once the scene's objects (and lights) are in place.
 */
function ShaderWarmup() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const setCompiling = useStageStore((s) => s.setCompiling)
  useLayoutEffect(() => {
    let live = true
    setCompiling(true)
    const done = () => {
      if (!live) return
      setCompiling(false)
      invalidate()
    }
    gl.compileAsync(scene, camera).then(done, done)
    return () => {
      live = false
      setCompiling(false)
    }
  }, [gl, scene, camera, invalidate, setCompiling])
  return null
}

/**
 * A fingerprint of everything the shadow map depends on: where each visible shadow caster and
 * each light stands, and how many there are. Cheap (merged models are a few hundred meshes).
 */
function shadowSignature(scene: Scene) {
  let h = 0
  let n = 0
  scene.traverseVisible((o) => {
    if (!o.castShadow || !((o as Mesh).isMesh || (o as Light).isLight)) return
    const e = o.matrixWorld.elements
    h += (n % 97 + 1) * (e[0] + 2 * e[1] + 3 * e[2] + 5 * e[4] + 7 * e[5] + 11 * e[8] + 13 * e[10] + 17 * e[12] + 19 * e[13] + 23 * e[14])
    n++
  })
  return `${n}|${h}`
}

/**
 * The shadow map is redrawn only when something that casts a shadow moves, appears or goes, or a
 * light changes (a model arriving, a door opening, a floor peeled away, day turning to night);
 * three.js otherwise redraws it every frame, which doubled the cost of every frame of a camera
 * move. Guessing from the camera instead (redraw whenever it was still, and twice a second while
 * it moved) cost the hotel dearly: its fountain keeps frames coming, so every still frame redrew
 * it, and every half second of a zoom stalled on two million triangles of shadow pass.
 */
function ShadowCache() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const invalidate = useThree((s) => s.invalidate)
  const last = useRef('')
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => {
      gl.shadowMap.autoUpdate = true
    }
  }, [gl])
  useFrame(() => {
    const signature = shadowSignature(scene)
    if (signature === last.current) return
    last.current = signature
    gl.shadowMap.needsUpdate = true
    // Matrices settle in the render that follows a change; one more frame catches the last of it.
    invalidate()
  })
  return null
}

/** A scene whose data or model fails renders nothing; the screen on top shows the error state. */
class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
