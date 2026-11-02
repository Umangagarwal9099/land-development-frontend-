import { Eye, Footprints, Hand, User, X } from 'lucide-react'
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

/** Walking mode's chrome: the way out, the view toggle, what's in reach, and the touch controls. */
export function WalkOverlay() {
  const prompt = useWalkStore((s) => s.prompt)
  const room = useWalkStore((s) => s.room)
  const view = useWalkStore((s) => s.view)
  const stop = useWalkStore((s) => s.stop)
  const toggleView = useWalkStore((s) => s.toggleView)
  const [coarse] = useState(() => window.matchMedia('(pointer: coarse)').matches)

  useEffect(
    () => () => {
      walkInput.moveX = walkInput.moveY = 0
      walkInput.interact = walkInput.jump = false
    },
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none">
      <div className="absolute left-6 top-6">
        <p className="eyebrow text-gold">Walking</p>
        <p className="font-display text-3xl text-ivory drop-shadow">{room ?? 'Residence D-65'}</p>
      </div>
      <div className="pointer-events-auto absolute right-6 top-6 flex gap-2">
        <IconButton icon={view === 'third' ? Eye : User} label={view === 'third' ? 'First-person view (V)' : 'Third-person view (V)'} onClick={toggleView} />
        <IconButton icon={X} label="Stop walking (Esc)" onClick={stop} />
      </div>

      {view === 'first' && <div className="absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-ivory/60" />}

      {prompt && (
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
          <Footprints size={14} /> W A S D to walk · click, then move the mouse to look · E to use · Space to jump · V to change view · Esc to leave
        </p>
      )}
    </div>
  )
}
