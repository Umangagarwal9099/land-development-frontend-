import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Maximize, Minimize, Minus, Moon, Plus, Rotate3d, RotateCcw, Sun } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useFullscreen } from '../hooks/useFullscreen'
import { useStageStore } from '../store/stage'
import { IconButton } from './ui/Button'

const STEP_AZIMUTH = Math.PI / 6
const STEP_POLAR = Math.PI / 18

/**
 * Minimal camera controls: day / evening lighting, 360° turntable, zoom in/out, a compass that
 * doubles as Reset View, and fullscreen. Gestures do the real work; these are for people who don't know to drag.
 * Keyboard: ← → rotate, ↑ ↓ tilt, + − zoom, Space turntable, R reset, F fullscreen, D day / evening.
 *
 * The `room` variant sits on the right inside the room viewer, with an explicit Reset View
 * instead of the compass; fullscreen lives in the viewer's top bar there.
 */
export function ViewControls({ variant = 'scene' }: { variant?: 'scene' | 'room' }) {
  const room = variant === 'room'
  const controls = useStageStore((s) => s.controls)
  const autoRotate = useStageStore((s) => s.autoRotate)
  const setAutoRotate = useStageStore((s) => s.setAutoRotate)
  const home = useStageStore((s) => s.home)
  const daylight = useStageStore((s) => s.daylight)
  const setDaylight = useStageStore((s) => s.setDaylight)
  const fullscreen = useFullscreen()

  const zoom = (factor: number) => controls && void controls.dolly(controls.distance * factor, true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!controls || (e.target as HTMLElement).tagName === 'INPUT') return
      const actions: Record<string, () => unknown> = {
        ArrowLeft: () => controls.rotate(-STEP_AZIMUTH, 0, true),
        ArrowRight: () => controls.rotate(STEP_AZIMUTH, 0, true),
        ArrowUp: () => controls.rotate(0, -STEP_POLAR, true),
        ArrowDown: () => controls.rotate(0, STEP_POLAR, true),
        '+': () => controls.dolly(controls.distance * 0.3, true),
        '=': () => controls.dolly(controls.distance * 0.3, true),
        '-': () => controls.dolly(-controls.distance * 0.4, true),
        ' ': () => setAutoRotate(!useStageStore.getState().autoRotate),
        r: () => home?.(),
        f: () => fullscreen.toggle(),
        d: () => setDaylight(!useStageStore.getState().daylight),
      }
      const action = actions[e.key]
      if (action) {
        e.preventDefault()
        void action()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [controls, home, setAutoRotate, setDaylight, fullscreen])

  return (
    <motion.div
      className={clsx(
        'pointer-events-none fixed z-10 flex flex-col items-center gap-2.5',
        room ? 'bottom-32 right-6 z-30' : 'bottom-6 left-6',
      )}
      initial={{ opacity: 0, x: room ? 16 : -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <IconButton icon={daylight ? Moon : Sun} label={daylight ? 'Evening view' : 'Daylight view'} onClick={() => setDaylight(!daylight)} />
      <IconButton icon={Rotate3d} label={autoRotate ? 'Stop 360° rotation' : '360° rotation'} active={autoRotate} onClick={() => setAutoRotate(!autoRotate)} />
      <div className="glass pointer-events-auto flex flex-col overflow-hidden rounded-full">
        <button aria-label="Zoom in" title="Zoom in" onClick={() => zoom(0.3)} className="flex h-14 w-14 items-center justify-center text-ivory/80 transition hover:text-ivory active:bg-white/10">
          <Plus size={21} strokeWidth={1.5} />
        </button>
        <span className="mx-auto h-px w-6 bg-line" />
        <button aria-label="Zoom out" title="Zoom out" onClick={() => zoom(-0.4)} className="flex h-14 w-14 items-center justify-center text-ivory/80 transition hover:text-ivory active:bg-white/10">
          <Minus size={21} strokeWidth={1.5} />
        </button>
      </div>
      {room ? <IconButton icon={RotateCcw} label="Reset view" onClick={() => home?.()} /> : <Compass onReset={() => home?.()} />}
      {!room && fullscreen.supported && (
        <IconButton icon={fullscreen.active ? Minimize : Maximize} label={fullscreen.active ? 'Exit presentation mode' : 'Presentation mode'} onClick={fullscreen.toggle} />
      )}
    </motion.div>
  )
}

/** North needle follows the camera heading; tapping it resets the view. */
function Compass({ onReset }: { onReset: () => void }) {
  const controls = useStageStore((s) => s.controls)
  const needle = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!controls) return
    // Written straight to the DOM on camera updates — no React render per frame.
    const update = () => {
      if (needle.current) needle.current.style.transform = `rotate(${controls.azimuthAngle}rad)`
    }
    update()
    controls.addEventListener('update', update)
    return () => controls.removeEventListener('update', update)
  }, [controls])

  return (
    <button onClick={onReset} aria-label="Reset view" title="Reset view" className="glass pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full transition active:scale-92">
      <svg ref={needle} viewBox="0 0 40 40" className="h-9 w-9">
        <circle cx="20" cy="20" r="17" fill="none" stroke="rgb(244 239 230 / 0.18)" strokeWidth="1" />
        <path d="M20 5 L24 20 L20 18 L16 20 Z" fill="#d4b26a" />
        <path d="M20 35 L24 20 L20 22 L16 20 Z" fill="rgb(244 239 230 / 0.35)" />
        <text x="20" y="3.6" textAnchor="middle" fontSize="5" fill="#d4b26a" fontWeight="700">N</text>
      </svg>
    </button>
  )
}
