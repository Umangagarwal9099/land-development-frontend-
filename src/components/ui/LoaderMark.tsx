/** A thin gold ring that draws itself with progress, a serif percentage inside. */
export function LoaderMark({ progress, label }: { progress?: number; label: string }) {
  const r = 46
  const c = 2 * Math.PI * r
  const determinate = progress !== undefined
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className={`h-full w-full -rotate-90 ${determinate ? '' : 'animate-spin [animation-duration:2.4s]'}`}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(244 239 230 / 0.08)" strokeWidth="1" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="url(#loader-gold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={determinate ? c * (1 - Math.max(0.04, progress / 100)) : c * 0.72}
            style={{ transition: 'stroke-dashoffset 0.6s var(--ease-lux)' }}
          />
          <defs>
            <linearGradient id="loader-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f3e3b8" />
              <stop offset="1" stopColor="#9c7a3c" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-3xl text-ivory/90 tabular-nums">
          {determinate ? `${Math.round(progress)}` : ''}
          {determinate && <span className="ml-0.5 text-base text-gold">%</span>}
        </span>
      </div>
      <p className="eyebrow text-gold/80">{label}</p>
    </div>
  )
}
