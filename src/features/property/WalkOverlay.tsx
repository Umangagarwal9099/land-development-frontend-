import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, BellRing, ChevronsLeftRight, ChevronsRightLeft, Eye, Footprints, Hand, User, X } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { IconButton } from '../../components/ui/Button'
import { useWalkStore, walkInput } from '../../store/walk'

const STICK = 56

/** A joystick for touch screens: drag from anywhere in its base; lets go to centre. */
function Joystick() {
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const base = useRef<HTMLDivElement>(null)
  const drag = (e: ReactPointerEvent) => {
    const b = base.current?.getBoundingClientRect()
    if (!b) return
    let x = e.clientX - (b.left + b.width / 2)
    let y = e.clientY - (b.top + b.height / 2)
    const len = Math.hypot(x, y)
    if (len > STICK) {
      x *= STICK / len
      y *= STICK / len
    }
    setKnob({ x, y })
    walkInput.moveX = x / STICK
    walkInput.moveY = -y / STICK
  }
  const release = () => {
    setKnob({ x: 0, y: 0 })
    walkInput.moveX = walkInput.moveY = 0
  }
  return (
    <div
      ref={base}
      aria-label="Walk"
      className="glass pointer-events-auto relative h-36 w-36 touch-none rounded-full"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag(e)
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && drag(e)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div className="absolute left-1/2 top-1/2 -ml-7 -mt-7 h-14 w-14 rounded-full bg-ivory/80 shadow-xl" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}

/** Every floor the lifts serve, top down, as the selector names them. */
const FLOORS = [
  { id: 'G', name: 'Ground Floor' },
  { id: 'B1', name: 'Basement 1' },
  { id: 'B2', name: 'Basement 2' },
]

/**
 * The lift's floor selector, shown as soon as the walker steps into the car (or its doorway): every
 * floor, the one the car is at marked, the one chosen lit. A tap or click here is the walker
 * pressing that button on the car's own panel, so the lift answers exactly as it would to a hand
 * on it; on a keyboard G, 1 and 2 do the same.
 */
function LiftPanel() {
  const lift = useWalkStore((s) => s.lift)
  const press = (cmd: string) => {
    // oxlint-disable-next-line react/immutability -- walkInput is the controls' shared, per-frame input
    walkInput.liftButton = cmd
  }
  return (
    <AnimatePresence>
      {lift && (
        <motion.div
          key="lift"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-x-0 bottom-24 flex justify-center px-4"
        >
          <div className="glass pointer-events-auto flex max-w-full flex-col items-center gap-3 rounded-[1.75rem] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 min-w-20 items-center justify-center gap-1.5 rounded-lg bg-black/80 px-3 font-mono text-2xl font-bold text-[#ff7a1a]" aria-live="polite">
                {lift.dir > 0 ? <ArrowUp size={18} /> : lift.dir < 0 ? <ArrowDown size={18} /> : null}
                <span>{lift.floor}</span>
              </div>
              <p className="eyebrow text-ivory/60">{lift.moving ? (lift.dir < 0 ? 'Going down' : 'Going up') : 'Select your floor'}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {FLOORS.filter((f) => lift.floors.includes(f.id)).map((f) => {
                const chosen = lift.lit.includes(f.id)
                const here = !lift.moving && lift.floor === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => press(f.id)}
                    aria-pressed={chosen}
                    className={clsx(
                      'flex min-w-28 flex-col items-center rounded-2xl border px-4 py-2 transition-colors',
                      chosen
                        ? 'border-[#ffb23a] bg-[#ffb23a]/20 text-[#ffcf7a]'
                        : here
                          ? 'border-gold/60 bg-gold/10 text-ivory'
                          : 'border-ivory/25 text-ivory hover:bg-ivory/10',
                    )}
                  >
                    <span className="font-display text-3xl leading-none">{f.id}</span>
                    <span className="mt-1 text-[0.7rem] uppercase tracking-[0.12em] text-ivory/60">{here ? 'You are here' : f.name}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => press('open')} title="Door open" aria-label="Door open" className="flex h-10 w-14 items-center justify-center rounded-full border border-ivory/25 text-ivory hover:bg-ivory/10">
                <ChevronsLeftRight size={18} />
              </button>
              <button onClick={() => press('close')} title="Door close" aria-label="Door close" className="flex h-10 w-14 items-center justify-center rounded-full border border-ivory/25 text-ivory hover:bg-ivory/10">
                <ChevronsRightLeft size={18} />
              </button>
              <button onClick={() => press('alarm')} className="flex h-10 items-center justify-center gap-2 rounded-full border border-[#d4a017]/50 px-4 text-sm text-[#f0c040] hover:bg-[#d4a017]/10">
                <BellRing size={15} /> Alarm
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Walking mode's chrome: the way out, the view toggle, what's in reach, and the touch controls. */
export function WalkOverlay({ title }: { title: string }) {
  const prompt = useWalkStore((s) => s.prompt)
  // In a lift the floor selector stands in for the single-button prompt.
  const inLift = useWalkStore((s) => s.lift !== null)
  const room = useWalkStore((s) => s.room)
  const view = useWalkStore((s) => s.view)
  const stop = useWalkStore((s) => s.stop)
  const toggleView = useWalkStore((s) => s.toggleView)
  const [coarse] = useState(() => window.matchMedia('(pointer: coarse)').matches)

  useEffect(
    () => () => {
      walkInput.moveX = walkInput.moveY = 0
      walkInput.interact = walkInput.jump = false
      walkInput.liftButton = null
    },
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none">
      <div className="absolute left-6 top-6">
        <p className="eyebrow text-gold">Walking</p>
        <p className="font-display text-3xl text-ivory drop-shadow">{room ?? title}</p>
      </div>
      <div className="pointer-events-auto absolute right-6 top-6 flex gap-2">
        <IconButton icon={view === 'third' ? Eye : User} label={view === 'third' ? 'First-person view (V)' : 'Third-person view (V)'} onClick={toggleView} />
        <IconButton icon={X} label="Stop walking (Esc)" onClick={stop} />
      </div>

      <LiftPanel />

      {view === 'first' && <div className="absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-ivory/60" />}

      {prompt && !inLift && (
        <div className="absolute inset-x-0 bottom-28 flex justify-center">
          <button
            onClick={() => (walkInput.interact = true)}
            className="glass pointer-events-auto flex items-center gap-3 rounded-full px-5 py-3 text-ivory"
          >
            {coarse ? <Hand size={18} /> : <kbd className="rounded bg-ivory/15 px-2 py-0.5 text-sm font-semibold">E</kbd>}
            <span>{prompt.verb} {prompt.label}</span>
          </button>
        </div>
      )}

      {coarse ? (
        <div className="absolute bottom-8 left-8">
          <Joystick />
        </div>
      ) : (
        <p className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-2 text-sm text-ivory/70 drop-shadow">
          <Footprints size={14} /> W A S D to walk · click, then move the mouse to look · E or click to use · Space to jump · V to change view · Esc to leave
        </p>
      )}
    </div>
  )
}
