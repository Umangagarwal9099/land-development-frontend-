import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconButton } from './ui/Button'

/** Top-left identity of a 3D screen: back, where you are, and one line of context. */
export function SceneHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  children,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  onBack: () => void
  backLabel?: string
  children?: ReactNode
}) {
  return (
    <header className="pointer-events-none fixed left-6 top-6 z-10 max-w-[min(40rem,60vw)]">
      {/* Soft scrim so the title reads over a bright model without a visible box. */}
      <div className="pointer-events-none absolute -left-6 -top-6 h-[22rem] w-[48rem] bg-[radial-gradient(ellipse_at_top_left,rgb(7_8_10/0.85),transparent_65%)]" />
      <div className="relative flex items-start gap-5">
        <IconButton icon={ChevronLeft} label={backLabel} onClick={onBack} />
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow pt-1">{eyebrow}</p>
          <h1 className="mt-2 font-display text-[3.4rem] font-medium leading-[0.95] tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2.5 text-[0.95rem] tracking-wide text-ivory/55">{subtitle}</p>}
          {children}
        </motion.div>
      </div>
    </header>
  )
}
