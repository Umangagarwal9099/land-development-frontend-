import type { Vector3 } from 'three'

/*
 * The lifts' sounds, synthesised (the kiosk runs offline and carries no audio files): the
 * two-tone arrival chime, the hum and rumble of the doors, the motor and rope noise under way, the
 * click of a button and the alarm bell. Each plays from where it happens and falls off with the
 * walker's distance from it. Nothing sounds until the visitor has touched the page (browsers keep
 * audio locked until then).
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let listener: Vector3 | null = null

/** Opens the audio context on a user gesture; later calls are no-ops. */
export function unlockSound() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.55
  master.connect(ctx.destination)
}

/** Where the listener (the walker) is: sounds fall off with distance from it. */
export function setListener(at: Vector3 | null) {
  listener = at
}

/** Gain for a sound at `at`: full within 2 m, fading out by 25 m, muffled through a floor. */
function reach(at: Vector3) {
  if (!listener) return 1
  const d = listener.distanceTo(at)
  const floors = Math.abs(listener.y - at.y) > 2.2 ? 0.25 : 1
  return Math.max(0, Math.min(1, 1 - (d - 2) / 23)) * floors
}

function out(at: Vector3, level: number) {
  if (!ctx || !master) return null
  const g = ctx.createGain()
  g.gain.value = level * reach(at)
  if (g.gain.value < 0.005) return null
  g.connect(master)
  return g
}

function tone(at: Vector3, freq: number, start: number, length: number, level: number, type: OscillatorType = 'sine') {
  const g = out(at, 1)
  if (!ctx || !g) return
  const t = ctx.currentTime + start
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.value = freq
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(level, t + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0005, t + length)
  o.connect(env).connect(g)
  o.start(t)
  o.stop(t + length + 0.05)
}

function noise(seconds: number) {
  const buf = ctx!.createBuffer(1, Math.ceil(ctx!.sampleRate * seconds), ctx!.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** The arrival chime: a soft two-note ding-dong, with a bell's overtone. */
export function chime(at: Vector3, down: boolean) {
  const [a, b] = down ? [880, 698.5] : [698.5, 880]
  tone(at, a, 0, 1.4, 0.22)
  tone(at, a * 2.76, 0, 0.5, 0.03)
  tone(at, b, 0.42, 1.8, 0.22)
  tone(at, b * 2.76, 0.42, 0.6, 0.03)
}

/** A button press: a short, high click with a soft beep. */
export function click(at: Vector3) {
  tone(at, 2400, 0, 0.05, 0.08, 'square')
  tone(at, 1320, 0.02, 0.18, 0.05)
}

/** Doors running on their track: filtered noise that swells and dies with the motion, and the stop's knock. */
export function doors(at: Vector3, seconds: number) {
  const g = out(at, 0.5)
  if (!ctx || !g) return
  const t = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = noise(seconds + 0.2)
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 520
  band.Q.value = 0.9
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(0.35, t + seconds * 0.25)
  env.gain.linearRampToValueAtTime(0.25, t + seconds * 0.8)
  env.gain.linearRampToValueAtTime(0, t + seconds)
  src.connect(band).connect(env).connect(g)
  src.start(t)
  tone(at, 95, seconds - 0.02, 0.18, 0.25)
}

/** The motor and ropes while the car is under way: a low hum with a little air noise; returns a stop. */
export function motor(at: Vector3) {
  const g = out(at, 0.6)
  if (!ctx || !g) return () => {}
  const c = ctx
  const t = c.currentTime
  const env = c.createGain()
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(0.18, t + 0.8)
  env.connect(g)
  const hum = c.createOscillator()
  hum.type = 'sawtooth'
  hum.frequency.value = 62
  const low = c.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.value = 180
  hum.connect(low).connect(env)
  const air = c.createBufferSource()
  air.buffer = noise(2)
  air.loop = true
  const hiss = c.createBiquadFilter()
  hiss.type = 'lowpass'
  hiss.frequency.value = 900
  const airGain = c.createGain()
  airGain.gain.value = 0.35
  air.connect(hiss).connect(airGain).connect(env)
  hum.start(t)
  air.start(t)
  return () => {
    const now = c.currentTime
    env.gain.cancelScheduledValues(now)
    env.gain.setValueAtTime(env.gain.value, now)
    env.gain.linearRampToValueAtTime(0, now + 0.6)
    hum.stop(now + 0.7)
    air.stop(now + 0.7)
  }
}

/** The alarm bell: a fast electric ring for a second and a half. */
export function bell(at: Vector3) {
  for (let i = 0; i < 18; i++) tone(at, 1850 + (i % 2) * 60, i * 0.08, 0.09, 0.07, 'triangle')
}
