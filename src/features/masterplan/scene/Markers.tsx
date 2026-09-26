import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { motion } from 'framer-motion'
import { useMemo, useRef } from 'react'
import type { LineBasicMaterial, Mesh, MeshBasicMaterial } from 'three'
import type { Amenity, Plot, Point2 } from '../../../api/types'
import { bounds, centroid } from '../../../lib/geometry'
import { amenityIcon } from '../../../lib/icons'
import { GOLD_BRIGHT, statusColor } from '../../../lib/palette'
import { statusLabel } from '../../../lib/format'
import { inset, PLOT_HEIGHT } from './plotGeometry'

const PULSE_SECONDS = 2.6

/**
 * Selection feedback on the ground: a gold outline that lifts into place and a ripple that
 * spreads outward twice, then everything settles and the GPU goes idle again.
 */
export function SelectionOutline({ polygon, y = PLOT_HEIGHT }: { polygon: Point2[]; y?: number }) {
  const line = useRef<LineBasicMaterial>(null)
  const ripple = useRef<Mesh>(null)
  const start = useRef<number | null>(null)

  const { positions, cx, cz, radius } = useMemo(() => {
    const pts = inset(polygon)
    const [cx, cz] = centroid(polygon)
    const b = bounds([polygon])
    return {
      positions: new Float32Array(pts.flatMap(([x, z]) => [x, 0, z])),
      cx,
      cz,
      radius: Math.hypot(b.maxX - b.minX, b.maxZ - b.minZ) / 2,
    }
  }, [polygon])

  useFrame((state) => {
    const now = state.clock.getElapsedTime()
    start.current ??= now
    const t = now - start.current
    if (t > PULSE_SECONDS + 0.1) return
    const lineMat = line.current
    const r = ripple.current
    if (lineMat) lineMat.opacity = Math.min(1, t / 0.4)
    if (r) {
      const phase = (t % (PULSE_SECONDS / 2)) / (PULSE_SECONDS / 2)
      const s = radius * (1 + phase * 2.2)
      r.scale.set(s, s, 1)
      ;(r.material as MeshBasicMaterial).opacity = t < PULSE_SECONDS ? 0.55 * (1 - phase) : 0
    }
    state.invalidate()
  })

  return (
    <group>
      <lineLoop position-y={y + 0.08} raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={line} color={GOLD_BRIGHT} transparent opacity={0} />
      </lineLoop>
      <mesh ref={ripple} position={[cx, y + 0.05, cz]} rotation-x={-Math.PI / 2} raycast={() => null}>
        <ringGeometry args={[0.94, 1, 64]} />
        <meshBasicMaterial color={GOLD_BRIGHT} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Floating tag above a plot: number, and the home standing on it if any. */
export function PlotTag({ plot, emphasis }: { plot: Plot; emphasis?: boolean }) {
  const [x, z] = centroid(plot.polygon)
  const height = plot.unit ? (plot.unit.kind === 'villa' ? 8.5 : 7.5) : 1.5
  return (
    <Html position={[x, height, z]} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`-translate-y-1/2 whitespace-nowrap rounded-full px-4 py-1.5 shadow-2xl ${
          emphasis ? 'bg-gold text-ink' : 'glass text-ivory'
        }`}
      >
        <span className="flex items-center gap-2.5">
          {!emphasis && <span className="h-2 w-2 rounded-full" style={{ background: statusColor[plot.status] }} />}
          <span className="font-display text-xl font-semibold leading-none">{plot.number}</span>
          <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${emphasis ? 'text-ink/70' : 'text-ivory/60'}`}>
            {plot.unit ? plot.unit.name : statusLabel[plot.status]}
          </span>
        </span>
      </motion.div>
    </Html>
  )
}

/**
 * Tappable pins over each amenity; large enough for a finger on a wall-mounted screen.
 * From far away they collapse to icons (names appear on hover) so neighbouring pins don't collide.
 */
export function AmenityPin({ amenity, active, compact, onSelect }: { amenity: Amenity; active: boolean; compact: boolean; onSelect: () => void }) {
  const [x, z] = centroid(amenity.polygon)
  const Icon = amenityIcon[amenity.kind]
  const expanded = active || !compact
  return (
    <Html position={[x, Math.max(amenity.height, 2) + 5, z]} center zIndexRange={[15, 5]}>
      <button
        // The pin lives inside the canvas's event source: keep the tap from also reaching the
        // scene, where it would read as a tap on empty ground and close the panel again.
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        aria-label={amenity.name}
        className={`group flex items-center rounded-full p-1.5 transition-all duration-500 ease-[var(--ease-lux)] active:scale-95 ${
          active ? 'bg-gold text-ink shadow-[0_0_40px_rgb(212_178_106/0.45)]' : 'glass text-ivory hover:border-gold/40'
        }`}
      >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${active ? 'bg-ink/10' : 'bg-gold/15 text-gold'}`}>
          <Icon size={20} strokeWidth={1.6} />
        </span>
        <span
          className={`overflow-hidden whitespace-nowrap text-sm font-semibold tracking-wide transition-all duration-500 ease-[var(--ease-lux)] ${
            expanded ? 'max-w-60 pl-3 pr-3.5 opacity-100' : 'max-w-0 opacity-0 group-hover:max-w-60 group-hover:pl-3 group-hover:pr-3.5 group-hover:opacity-100'
          }`}
        >
          {amenity.name}
        </span>
      </button>
    </Html>
  )
}
