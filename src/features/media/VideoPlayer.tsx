import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { assetUrl } from '../../config'

const HIDE_CONTROLS_MS = 2800

const clock = (s: number) => {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/**
 * Film player with large touch controls (native controls are tiny on a TV). Plays MP4 directly
 * and HLS (.m3u8) via hls.js, which is only downloaded when a stream is opened.
 */
export function VideoPlayer({ url, poster }: { url: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const src = assetUrl(url)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [chrome, setChrome] = useState(true)
  const hideTimer = useRef(0)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const isHls = /\.m3u8(\?|$)/.test(src)
    if (!isHls || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      return
    }
    let destroyed = false
    let hls: import('hls.js').default | null = null
    void import('hls.js').then(({ default: Hls }) => {
      if (destroyed || !Hls.isSupported()) return
      hls = new Hls({ capLevelToPlayerSize: true })
      hls.loadSource(src)
      hls.attachMedia(video)
    })
    return () => {
      destroyed = true
      hls?.destroy()
    }
  }, [src])

  const wake = () => {
    setChrome(true)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => ref.current && !ref.current.paused && setChrome(false), HIDE_CONTROLS_MS)
  }
  useEffect(() => () => window.clearTimeout(hideTimer.current), [])

  const toggle = () => {
    const v = ref.current
    if (!v) return
    if (v.paused) void v.play().catch(() => undefined)
    else v.pause()
    wake()
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center" onPointerMove={wake}>
      <video
        ref={ref}
        poster={poster ? assetUrl(poster) : undefined}
        className="max-h-full max-w-full rounded-2xl bg-black shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)]"
        autoPlay
        playsInline
        muted={muted}
        onClick={toggle}
        onPlay={() => {
          setPlaying(true)
          wake()
        }}
        onPause={() => {
          setPlaying(false)
          setChrome(true)
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      <AnimatePresence>
        {!playing && (
          <motion.button
            aria-label="Play"
            onClick={toggle}
            className="absolute flex h-24 w-24 items-center justify-center rounded-full bg-gold/90 text-ink shadow-[0_0_60px_rgb(212_178_106/0.5)]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
          >
            <Play size={34} fill="currentColor" className="ml-1" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        className="glass absolute inset-x-6 bottom-6 flex items-center gap-5 rounded-full px-3 py-2 md:inset-x-16"
        animate={{ opacity: chrome ? 1 : 0, y: chrome ? 0 : 12 }}
        transition={{ duration: 0.4 }}
      >
        <button aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/5 text-ivory">
          {playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </button>
        <span className="w-14 shrink-0 text-right font-display text-lg tabular-nums text-ivory/70">{clock(time)}</span>
        <input
          type="range"
          aria-label="Seek"
          min={0}
          max={duration || 0}
          step={0.1}
          value={time}
          onChange={(e) => {
            if (ref.current) ref.current.currentTime = Number(e.target.value)
            wake()
          }}
          className="h-10 min-w-0 flex-1 cursor-pointer accent-[#d4b26a]"
        />
        <span className="w-14 shrink-0 font-display text-lg tabular-nums text-ivory/40">{clock(duration)}</span>
        <button aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted((m) => !m)} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-ivory/80">
          {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
      </motion.div>
    </div>
  )
}
