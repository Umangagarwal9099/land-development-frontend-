import type { CameraControls } from '@react-three/drei'
import { create } from 'zustand'

/**
 * The single, persistent 3D stage behind every screen. Screens don't own a canvas; they tell the
 * stage what to show, so moving between them is a camera move rather than a page reload.
 */
export type StageScene = { kind: 'masterplan' | 'property'; slug: string }

/** 'attract' = landing-screen showcase (slow orbit, no input); 'explore' = fully interactive. */
export type StageMode = 'attract' | 'explore'

/** Fractions of the viewport covered by UI, so framing keeps the subject in the open area. */
export interface Inset {
  left: number
  right: number
  bottom: number
}

interface StageState {
  scene: StageScene | null
  mode: StageMode
  controls: CameraControls | null
  /** Current scene's geometry/model is on screen. */
  sceneReady: boolean
  autoRotate: boolean
  /** Screen has been untouched for a while: chrome fades out and the model turns slowly. */
  ambient: boolean
  /** Scene-provided "overview" camera move, used by Reset View. */
  home: (() => void) | null
  /** Scene-provided close-up flight to an object (a plot, a room) before entering it. */
  dive: ((id: string) => Promise<void>) | null
  curtain: 'open' | 'closing' | 'closed'
  /** Set while a cinematic navigation waits for the next screen to declare its scene. */
  awaitingScene: boolean
  /** Fades the canvas out (e.g. between landing-screen projects); it fades back in once ready. */
  dimmed: boolean

  show: (scene: StageScene | null, mode: StageMode) => void
  setControls: (controls: CameraControls | null) => void
  setSceneReady: (ready: boolean) => void
  setAutoRotate: (on: boolean) => void
  setAmbient: (on: boolean) => void
  setHome: (home: (() => void) | null) => void
  setDive: (dive: ((id: string) => Promise<void>) | null) => void
  setCurtain: (curtain: StageState['curtain'], awaitingScene?: boolean) => void
  setDimmed: (dimmed: boolean) => void
}

const sameScene = (a: StageScene | null, b: StageScene | null) => a?.kind === b?.kind && a?.slug === b?.slug

export const useStageStore = create<StageState>((set, get) => ({
  scene: null,
  mode: 'attract',
  controls: null,
  sceneReady: false,
  autoRotate: false,
  ambient: false,
  home: null,
  dive: null,
  curtain: 'open',
  awaitingScene: false,
  dimmed: false,

  show: (scene, mode) => {
    const changed = !sameScene(get().scene, scene)
    set({
      scene,
      mode,
      awaitingScene: false,
      autoRotate: mode === 'attract',
      ...(changed ? { sceneReady: false } : null),
    })
  },
  setControls: (controls) => set({ controls }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setAmbient: (ambient) => set({ ambient }),
  setHome: (home) => set({ home }),
  setDive: (dive) => set({ dive }),
  setCurtain: (curtain, awaitingScene) => set(awaitingScene === undefined ? { curtain } : { curtain, awaitingScene }),
  setDimmed: (dimmed) => set({ dimmed }),
}))
