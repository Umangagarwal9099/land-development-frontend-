import { AdaptiveDpr, Bvh } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Component, Suspense, type ReactNode } from 'react'
import MasterPlanScene from '../features/masterplan/scene/MasterPlanScene'
import PropertyScene from '../features/property/scene/PropertyScene'
import { useStageStore } from '../store/stage'
import { CameraRig } from './CameraRig'
import { BACKGROUND, StudioEnvironment } from './environment'
import { StageLoader } from './StageLoader'

/**
 * The persistent 3D stage, mounted once behind every screen (lazy: three.js is its own chunk).
 * frameloop="demand" renders only while something moves, so the GPU idles on a kiosk that runs all day.
 */
export default function Stage() {
  const scene = useStageStore((s) => s.scene)
  const visible = useStageStore((s) => s.sceneReady && !s.dimmed)

  return (
    <div className="fixed inset-0 z-0 touch-none select-none">
      <div className="absolute inset-0 transition-opacity duration-700 ease-[var(--ease-lux)]" style={{ opacity: visible ? 1 : 0 }}>
      <Canvas
        frameloop="demand"
        // PCF shadows; three r18x removed the PCFSoft default that `shadows` would request.
        shadows="percentage"
        dpr={[1, 1.75]}
        performance={{ min: 0.6 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 400, 600], fov: 38, near: 0.5, far: 6000 }}
      >
        <color attach="background" args={[BACKGROUND]} />
        <CameraRig />
        <StudioEnvironment />
        <Suspense fallback={null}>
          {/* Keyed per scene: <Bvh> only accelerates meshes present when it mounts. */}
          {scene && (
            <SceneErrorBoundary key={`${scene.kind}:${scene.slug}`}>
              <Bvh firstHitOnly>
                {scene.kind === 'masterplan' ? <MasterPlanScene slug={scene.slug} /> : <PropertyScene slug={scene.slug} />}
              </Bvh>
            </SceneErrorBoundary>
          )}
        </Suspense>
        {/* Drops resolution while the camera moves, restores it when still. */}
        <AdaptiveDpr />
      </Canvas>
      </div>
      {/* Cinematic falloff toward the edges keeps the eye on the model. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(7_8_10/0.75)_100%)]" />
      <StageLoader />
    </div>
  )
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
