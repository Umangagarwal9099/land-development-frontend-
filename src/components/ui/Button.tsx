import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
  active?: boolean
  size?: 'md' | 'lg'
}

/** Round frosted control. `label` is required: it's the accessible name and the hover hint. */
export function IconButton({ icon: Icon, label, active, size = 'md', className, ...rest }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={clsx(
        'glass pointer-events-auto flex shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-[var(--ease-lux)] active:scale-92',
        size === 'lg' ? 'h-16 w-16' : 'h-14 w-14',
        active ? 'border-gold/60! text-gold shadow-[0_0_28px_-6px_rgb(212_178_106/0.6)]' : 'text-ivory/80 hover:text-ivory',
        className,
      )}
      {...rest}
    >
      <Icon size={size === 'lg' ? 24 : 21} strokeWidth={1.5} />
    </button>
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  icon?: LucideIcon
  iconPosition?: 'start' | 'end'
  children: ReactNode
}

export function Button({ variant = 'primary', icon: Icon, iconPosition = 'end', className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'group pointer-events-auto relative inline-flex h-16 items-center justify-center gap-3 overflow-hidden rounded-full px-8 text-[0.95rem] font-semibold tracking-[0.06em] transition-all duration-300 ease-[var(--ease-lux)] active:scale-[0.97] disabled:opacity-40',
        variant === 'primary'
          ? 'bg-gradient-to-b from-[#ecd59b] via-[#d4b26a] to-[#a8843f] text-ink shadow-[0_14px_40px_-12px_rgb(212_178_106/0.7)]'
          : 'glass text-ivory hover:border-gold/40',
        className,
      )}
      {...rest}
    >
      {variant === 'primary' && (
        // Slow sheen across the gold, like light catching a brass plate.
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent group-hover:animate-[shimmer_1.1s_ease]" />
      )}
      {Icon && iconPosition === 'start' && <Icon size={20} strokeWidth={1.8} />}
      <span className="relative">{children}</span>
      {Icon && iconPosition === 'end' && (
        <Icon size={20} strokeWidth={1.8} className="relative transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </button>
  )
}
