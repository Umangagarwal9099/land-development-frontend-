import { BoxGeometry, CanvasTexture, CylinderGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, Vector3, type Material, type Object3D } from 'three'
import type { Ctx } from './build'
import { LEVEL_COLOUR } from './materials'
import { board, exitSign, levelMark } from './paints'
import { bell, chime, click, doors as doorSound, motor } from './sound'
import { axisOf, LEVEL_Y, signOf, SLAB, type AccessSpec, type Dir, type LiftSpec, type Rect, type StairSpec } from './spec'

/*
 * The lifts and stair that join each building's lobby to its basements. Everything is built and
 * runs as it would on site: the car is a real box riding its shaft from B2 to the ground, its doors
 * and the landing doors at every level slide open only when it stands level there, the call and
 * car buttons light when pressed and go out when the car answers, and the indicators over the
 * doors and in the car count the floors as it passes them. The walker stands in the car and rides
 * it; nothing is switched or teleported. The stair is a dog-leg in its own fire-rated enclosure,
 * a floor landing at each level and a half landing between, every tread a real step.
 */

type R = [number, number]
const PI = Math.PI
const BUTTON_COLLAR = new CylinderGeometry(0.026, 0.026, 0.01, 24)
const BUTTON_FACE = new PlaneGeometry(0.044, 0.044)

/** Lift timings: door travel, how long they stand open, and the car's motion (m/s, m/s²). */
const DOOR_TIME = 1.9
const DWELL = 4.5
const V_MAX = 1.5
const ACCEL = 0.75
/** Clear opening of the doors, and their height. */
const OPENING = 1.1
const DOOR_H = 2.15
const CAR_H = 2.35

export interface Level {
  level: number
  y: number
  name: string
}

/** The access levels from the top: the ground (its lobby floor) and the basements. */
export function accessLevels(spec: AccessSpec): Level[] {
  return [
    { level: 0, y: spec.ground.y, name: 'G' },
    { level: -1, y: LEVEL_Y[-1], name: 'B1' },
    { level: -2, y: LEVEL_Y[-2], name: 'B2' },
  ]
}

/* ---------- plan frames ---------- */

/** A frame on a door: `a` across the doors, `o` out through them, from (cx, cz). */
class Frame {
  readonly ox: number
  readonly oz: number
  readonly ax: number
  readonly az: number
  readonly cx: number
  readonly cz: number
  readonly yaw: number
  constructor(cx: number, cz: number, out: Dir) {
    this.cx = cx
    this.cz = cz
    this.ox = axisOf(out) === 'x' ? signOf(out) : 0
    this.oz = axisOf(out) === 'z' ? signOf(out) : 0
    this.ax = this.oz
    this.az = this.ox
    this.yaw = { '+z': 0, '-z': PI, '+x': PI / 2, '-x': -PI / 2 }[out]
  }
  x(a: number, o: number) {
    return this.cx + this.ax * a + this.ox * o
  }
  z(a: number, o: number) {
    return this.cz + this.az * a + this.oz * o
  }
  /** World x/z ranges of a box spanning a0..a1 across and o0..o1 out. */
  box(a: R, o: R): [R, R] {
    const xs = [this.x(a[0], o[0]), this.x(a[1], o[1])].sort((p, q) => p - q) as R
    const zs = [this.z(a[0], o[0]), this.z(a[1], o[1])].sort((p, q) => p - q) as R
    return [xs, zs]
  }
}

function bx(ctx: Ctx, p: Object3D, [x0, x1]: R, [y0, y1]: R, [z0, z1]: R, mat: Material | Material[], cast = true) {
  if (x1 - x0 < 1e-3 || y1 - y0 < 1e-3 || z1 - z0 < 1e-3) return null
  return ctx.k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

/** A box in a door frame's terms. */
function fb(ctx: Ctx, p: Object3D, f: Frame, a: R, y: R, o: R, mat: Material | Material[], cast = true) {
  const [xs, zs] = f.box(a, o)
  return bx(ctx, p, xs, y, zs, mat, cast)
}

/** An upright plane facing out of a frame, w × h, centred at (a, y, o). */
function face(p: Object3D, f: Frame, w: number, h: number, mat: Material, a: number, y: number, o: number, inward = false) {
  const m = new Mesh(new PlaneGeometry(w, h), mat)
  m.position.set(f.x(a, o), y, f.z(a, o))
  m.rotation.y = f.yaw + (inward ? PI : 0)
  p.add(m)
  return m
}

/** Wall segments along one side (from p0 to p1 in plan), from y0 to y1, with door openings cut. */
function wallWith(ctx: Ctx, p: Object3D, side: Rect, along: 'x' | 'z', y0: number, y1: number, openings: { at: number; w: number; h: number }[], mat: Material) {
  const [s0, s1] = along === 'x' ? [side.x0, side.x1] : [side.z0, side.z1]
  let at = s0
  const cuts = [...openings].sort((a, b) => a.at - b.at)
  const piece = (a: number, b: number, ya: number, yb: number) =>
    along === 'x' ? bx(ctx, p, [a, b], [ya, yb], [side.z0, side.z1], mat) : bx(ctx, p, [side.x0, side.x1], [ya, yb], [a, b], mat)
  for (const c of cuts) {
    const a = c.at - c.w / 2
    const b = c.at + c.w / 2
    if (a > at) piece(at, a, y0, y1)
    piece(Math.max(a, s0), Math.min(b, s1), y0 + c.h, y1)
    at = Math.max(at, b)
  }
  if (at < s1) piece(at, s1, y0, y1)
}

/** A rectangle's side as a thin strip `t` thick outside (or inside, t < 0) the rectangle. */
function sideOf(r: Rect, d: Dir, t: number): Rect {
  const o = t > 0 ? 0 : t
  const i = t > 0 ? t : 0
  switch (d) {
    case '+x':
      return { x0: r.x1 + o, x1: r.x1 + i, z0: r.z0 - Math.abs(t), z1: r.z1 + Math.abs(t) }
    case '-x':
      return { x0: r.x0 - i, x1: r.x0 - o, z0: r.z0 - Math.abs(t), z1: r.z1 + Math.abs(t) }
    case '+z':
      return { x0: r.x0 - Math.abs(t), x1: r.x1 + Math.abs(t), z0: r.z1 + o, z1: r.z1 + i }
    case '-z':
      return { x0: r.x0 - Math.abs(t), x1: r.x1 + Math.abs(t), z0: r.z0 - i, z1: r.z0 - o }
  }
}

const SIDES: Dir[] = ['+x', '-x', '+z', '-z']
const alongOf = (d: Dir): 'x' | 'z' => (axisOf(d) === 'x' ? 'z' : 'x')

/* ---------- painted parts ---------- */

const SANS = 'Helvetica, Arial, sans-serif'

/** A button's face: a brushed ring round a white symbol on black, lit amber when pressed. */
const buttonFace =
  (symbol: string, lit: boolean, colour = '#1a1b1d') =>
  (g: CanvasRenderingContext2D, w: number, h: number) => {
    g.clearRect(0, 0, w, h)
    const r = w / 2
    const ring = g.createRadialGradient(r * 0.7, r * 0.7, 2, r, r, r)
    ring.addColorStop(0, '#e9ecee')
    ring.addColorStop(1, '#8b9195')
    g.fillStyle = ring
    g.beginPath()
    g.arc(r, r, r - 1, 0, 7)
    g.fill()
    g.fillStyle = colour
    g.beginPath()
    g.arc(r, r, r * 0.78, 0, 7)
    g.fill()
    if (lit) {
      g.strokeStyle = '#ffb23a'
      g.lineWidth = r * 0.12
      g.beginPath()
      g.arc(r, r, r * 0.72, 0, 7)
      g.stroke()
    }
    g.fillStyle = lit ? '#ffcf7a' : '#f2f2f2'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const size = symbol.length <= 1 ? 0.82 : symbol.length === 2 ? 0.62 : 1.5 / symbol.length
    g.font = `700 ${r * size}px ${SANS}`
    g.fillText(symbol, r, r + 2)
  }

/** The floor display: amber LED-style level and direction arrow on black. */
function drawDisplay(g: CanvasRenderingContext2D, w: number, h: number, name: string, dir: number) {
  g.fillStyle = '#060606'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#ff7a1a'
  g.shadowColor = '#ff7a1a'
  g.shadowBlur = 10
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `700 ${h * 0.72}px "Courier New", ${SANS}`
  g.fillText(name, w * 0.62, h / 2 + 3)
  if (dir) {
    const x = w * 0.2
    const y = h / 2
    const s = h * 0.26
    g.beginPath()
    g.moveTo(x, y - dir * s)
    g.lineTo(x + s * 0.9, y + dir * s * 0.4)
    g.lineTo(x - s * 0.9, y + dir * s * 0.4)
    g.closePath()
    g.fill()
  }
  g.shadowBlur = 0
}

/* ---------- the lift ---------- */

interface Landing {
  level: Level
  panels: Object3D[]
  calls: { up?: Button; down?: Button }
}

interface Button {
  node: Object3D
  /** The button's face, whose material shows it lit or not. */
  disc: Mesh
  lit: boolean
  on: Material
  off: Material
}

/** What the lift asks of the scene: who is near the doors, and whether the walker is aboard. */
export interface Rider {
  position: Vector3
}

/**
 * One lift: its car, landing doors at every level, buttons and displays, and the controller that
 * runs them, with collective control (it answers calls in order, stopping where asked).
 */
export class Lift {
  readonly car = new Group()
  readonly spec: LiftSpec
  readonly levels: Level[]
  readonly index: number
  private f: Frame
  private faceO: number
  private landings: Landing[] = []
  private carPanels: Object3D[] = []
  private carButtons = new Map<string, Button>()
  private display: { canvas: HTMLCanvasElement; tex: CanvasTexture } | null = null
  private shown = ''
  /** Car floor height, speed, the level it is at or bound for, the doors (0 shut … 1 open). */
  y: number
  private v = 0
  private target: number | null = null
  private door = 0
  private doorDir = 0
  private dwell = 0
  private queue: number[] = []
  private stopSound: (() => void) | null = null
  private dir = 0
  private alarmLit = 0
  private stopLit = 0

  constructor(ctx: Ctx, spec: LiftSpec, access: AccessSpec, levels: Level[], index: number, parentFor: (level: number) => Object3D) {
    this.spec = spec
    this.levels = levels
    this.index = index
    this.f = new Frame(spec.x, spec.z, spec.door)
    const r = access.rect
    const facePos = axisOf(access.face) === 'x' ? (signOf(access.face) > 0 ? r.x1 : r.x0) : signOf(access.face) > 0 ? r.z1 : r.z0
    this.faceO = Math.abs(facePos - (axisOf(access.face) === 'x' ? spec.x : spec.z))
    this.car.name = `liftcar_${index}`
    this.y = levels[0].y
    this.buildCar(ctx)
    for (const lv of levels) this.buildLanding(ctx, lv, parentFor(lv.level))
    this.place()
  }

  /** Every node a walker can press. */
  get buttons() {
    return [...this.carButtons.values(), ...this.landings.flatMap((l) => [l.calls.up, l.calls.down].filter((b): b is Button => !!b))].map((b) => b.node)
  }

  /** The car's button for a command ('G', 'B1', 'B2', 'open', 'close', 'alarm', 'stop'). */
  carButton(cmd: string) {
    return this.carButtons.get(cmd)?.node ?? null
  }

  private material(ctx: Ctx, key: string, symbol: string, lit: boolean, colour?: string) {
    const m = ctx.m.painted(`btn_${key}_${lit}`, 128, 128, buttonFace(symbol, lit, colour), { roughness: 0.35, metalness: 0.4, alphaTest: 0.5 })
    if (lit && !m.emissiveMap) {
      m.emissiveMap = m.map
      m.emissive.set('#ffffff')
      m.emissiveIntensity = 0.9
    }
    return m
  }

  /** A round push button facing out of `f` at (a, y, o) (inward: facing back into the car). */
  private button(ctx: Ctx, parent: Object3D, f: Frame, a: number, y: number, o: number, name: string, label: string, symbol: string, press: () => void, inward = false, colour?: string) {
    const node = new Group()
    node.name = `button_${name}`
    parent.add(node)
    const on = this.material(ctx, symbol + (colour ?? ''), symbol, true, colour)
    const off = this.material(ctx, symbol + (colour ?? ''), symbol, false, colour)
    // A stainless collar standing proud of the plate, the face in it.
    const collar = new Mesh(BUTTON_COLLAR, ctx.m.stainless)
    collar.rotation.x = PI / 2
    collar.position.z = 0.005
    const disc = new Mesh(BUTTON_FACE, off)
    disc.position.z = 0.0105
    disc.userData.front = true
    const holder = new Group()
    holder.position.set(f.x(a, o), y, f.z(a, o))
    holder.rotation.y = f.yaw + (inward ? PI : 0)
    holder.add(collar, disc)
    node.add(holder)
    const b: Button = { node, disc, lit: false, on, off }
    node.userData.label = label
    node.userData.verb = 'Press'
    node.userData.press = () => {
      click(this.worldAt(holder))
      press()
    }
    return b
  }

  private light(b: Button | undefined, lit: boolean) {
    if (!b || b.lit === lit) return
    b.lit = lit
    b.disc.material = lit ? b.on : b.off
  }

  private worldAt(o: Object3D) {
    return o.getWorldPosition(new Vector3())
  }

  private buildCar(ctx: Ctx) {
    const { m } = ctx
    const { w, d } = this.spec
    const f = this.f
    const g = this.car
    const W = w / 2
    const D = d / 2
    const t = 0.05
    const half = OPENING / 2
    const steel = m.stainless
    // Floor: dark granite on its platform; walls in brushed stainless on a kick plate; mirror on the back.
    const granite = new MeshStandardMaterial({ color: '#2b2a29', roughness: 0.25, metalness: 0.05, envMap: m.env, envMapIntensity: 0.6 })
    fb(ctx, g, f, [-W - t, W + t], [-0.16, 0], [-D - t, D], m.steel)
    fb(ctx, g, f, [-W, W], [-0.012, 0.004], [-D, D], granite, false)
    for (const s of [-1, 1]) fb(ctx, g, f, s < 0 ? [-W - t, -W] : [W, W + t], [0, CAR_H], [-D, D], steel)
    fb(ctx, g, f, [-W - t, W + t], [0, CAR_H], [-D - t, -D], steel)
    face(g, f, w - 0.24, 1.15, m.mirror, 0, 1.55, -D + 0.008)
    for (const s of [-1, 1]) fb(ctx, g, f, s < 0 ? [-W, -W + 0.005] : [W - 0.005, W], [0, 0.12], [-D, D], m.black, false)
    // Front returns either side of the opening, and the head over it.
    for (const s of [-1, 1]) fb(ctx, g, f, s < 0 ? [-W - t, -half] : [half, W + t], [0, CAR_H], [D - 0.06, D], steel)
    fb(ctx, g, f, [-half, half], [DOOR_H, CAR_H], [D - 0.06, D], steel)
    // Ceiling: a lit panel in a white surround, and the car's roof with its sling over it.
    fb(ctx, g, f, [-W - t, W + t], [CAR_H, CAR_H + 0.12], [-D - t, D], m.white, false)
    const panel = Math.min(w, d) - 0.3
    face(g, f, panel, panel, m.led, 0, CAR_H - 0.005, 0).rotation.set(PI / 2, 0, 0)
    fb(ctx, g, f, [-W - 0.12, -W - 0.06], [-0.3, CAR_H + 0.4], [-0.06, 0.06], m.steel)
    fb(ctx, g, f, [W + 0.06, W + 0.12], [-0.3, CAR_H + 0.4], [-0.06, 0.06], m.steel)
    fb(ctx, g, f, [-W - 0.12, W + 0.12], [CAR_H + 0.3, CAR_H + 0.42], [-0.08, 0.08], m.steel)
    // Handrails on the back and sides, on stand-off brackets.
    const rail = (a0: number, a1: number, o0: number, o1: number) => {
      const len = Math.hypot(a1 - a0, o1 - o0)
      const c = new Mesh(new CylinderGeometry(0.02, 0.02, len, 12), m.aluminium)
      c.position.set(f.x((a0 + a1) / 2, (o0 + o1) / 2), 0.92, f.z((a0 + a1) / 2, (o0 + o1) / 2))
      const alongA = Math.abs(a1 - a0) > Math.abs(o1 - o0)
      const worldX = alongA ? f.ax !== 0 : f.ox !== 0
      if (worldX) c.rotation.z = PI / 2
      else c.rotation.x = PI / 2
      g.add(c)
    }
    rail(-W + 0.12, W - 0.12, -D + 0.07, -D + 0.07)
    for (const s of [-1, 1]) rail(s * (W - 0.07), s * (W - 0.07), -D + 0.15, D - 0.3)
    // Car doors: two stainless panels opening from the middle.
    const pw = half + 0.04
    for (const s of [-1, 1]) {
      const node = new Group()
      node.name = `liftdoor_car_${this.index}_${s}`
      g.add(node)
      fb(ctx, node, f, [s < 0 ? -pw : 0, s < 0 ? 0 : pw], [0, DOOR_H], [D + 0.01, D + 0.04], steel)
      this.carPanels.push(node)
    }
    // The car operating panel on the return beside the doors: display, floors, open/close, alarm, stop.
    const pa = half + (W - half) / 2
    const po = D - 0.065
    fb(ctx, g, f, [pa - 0.1, pa + 0.1], [0.85, 1.75], [po - 0.008, po], m.steel, false)
    this.display = this.makeDisplay()
    const dmat = new MeshStandardMaterial({ map: this.display.tex, emissiveMap: this.display.tex, emissive: '#ffffff', emissiveIntensity: 1.1, roughness: 0.3 })
    ctx.lighting.glow(dmat, 1)
    face(g, f, 0.16, 0.07, dmat, pa, 1.66, po - 0.01, true)
    const rows: [string, string, string, number, number][] = [
      ['G', 'G', 'Ground Floor', 0, 1.5],
      ['B1', 'B1', 'Basement 1', 0, 1.42],
      ['B2', 'B2', 'Basement 2', 0, 1.34],
      ['open', '◀▶', 'Door Open', -0.045, 1.22],
      ['close', '▶◀', 'Door Close', 0.045, 1.22],
      ['alarm', '🔔', 'Alarm', -0.045, 1.1],
      ['stop', 'STOP', 'Emergency Stop', 0.045, 1.1],
    ]
    for (const [cmd, symbol, label, da, y] of rows) {
      const press = () => this.carCommand(cmd)
      const colour = cmd === 'alarm' ? '#b8870b' : cmd === 'stop' ? '#9b1414' : undefined
      const b = this.button(ctx, g, f, pa + da, y, po - 0.012, `lift${this.index}_car_${cmd}`, label, cmd === 'alarm' ? 'ALARM' : symbol, press, true, colour)
      this.carButtons.set(cmd, b)
    }
    // The capacity plate.
    const plate = ctx.m.painted('liftplate', 256, 128, board(['13 PERSONS', '1000 KG'], 'none', '#3a3d40'))
    face(g, f, 0.16, 0.08, plate, pa, 0.95, po - 0.01, true)
  }

  private makeDisplay() {
    const canvas = document.createElement('canvas')
    canvas.width = 192
    canvas.height = 96
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    return { canvas, tex }
  }

  private buildLanding(ctx: Ctx, lv: Level, p: Object3D) {
    const { m } = ctx
    const f = this.f
    const half = OPENING / 2
    const o = this.faceO
    // The landing doors in the wall, an architrave round them, the call buttons and the display over them.
    const panels: Object3D[] = []
    const pw = half + 0.04
    for (const s of [-1, 1]) {
      const node = new Group()
      node.name = `liftdoor_${this.index}_${lv.name}_${s}`
      p.add(node)
      fb(ctx, node, f, [s < 0 ? -pw : 0, s < 0 ? 0 : pw], [lv.y, lv.y + DOOR_H], [o - 0.14, o - 0.11], m.stainless)
      panels.push(node)
    }
    for (const s of [-1, 1]) fb(ctx, p, f, s < 0 ? [-half - 0.14, -half] : [half, half + 0.14], [lv.y, lv.y + DOOR_H + 0.14], [o, o + 0.04], m.stainless)
    fb(ctx, p, f, [-half - 0.14, half + 0.14], [lv.y + DOOR_H, lv.y + DOOR_H + 0.14], [o, o + 0.04], m.stainless)
    // The sill, in steel, across the threshold.
    fb(ctx, p, f, [-half, half], [lv.y - 0.01, lv.y + 0.004], [o - 0.2, o + 0.04], m.steel, false)
    const dmat = new MeshStandardMaterial({ map: this.display!.tex, emissiveMap: this.display!.tex, emissive: '#ffffff', emissiveIntensity: 1.1, roughness: 0.3 })
    ctx.lighting.glow(dmat, 1)
    fb(ctx, p, f, [-0.16, 0.16], [lv.y + DOOR_H + 0.2, lv.y + DOOR_H + 0.4], [o, o + 0.03], m.black, false)
    face(p, f, 0.28, 0.14, dmat, 0, lv.y + DOOR_H + 0.3, o + 0.032)
    // Call buttons on a plate beside the doors: down from the ground, up from B2, both between.
    const ca = (half + 0.32) * (this.spec.call ?? 1)
    fb(ctx, p, f, [ca - 0.06, ca + 0.06], [lv.y + 0.95, lv.y + 1.3], [o, o + 0.012], m.stainless, false)
    const i = this.levels.indexOf(lv)
    const calls: Landing['calls'] = {}
    if (i > 0) calls.up = this.button(ctx, p, f, ca, lv.y + 1.2, o + 0.014, `lift${this.index}_${lv.name}_up`, `Lift (${lv.name}) · Up`, '▲', () => this.hallCall(i, 'up'))
    if (i < this.levels.length - 1) calls.down = this.button(ctx, p, f, ca, lv.y + (i > 0 ? 1.06 : 1.13), o + 0.014, `lift${this.index}_${lv.name}_down`, `Lift (${lv.name}) · Down`, '▼', () => this.hallCall(i, 'down'))
    this.landings.push({ level: lv, panels, calls })
  }

  /* ---------- control ---------- */

  /** The level the car is at (or nearest to), as an index into `levels`. */
  private nearest() {
    let best = 0
    for (let i = 1; i < this.levels.length; i++) if (Math.abs(this.levels[i].y - this.y) < Math.abs(this.levels[best].y - this.y)) best = i
    return best
  }

  private atLevel() {
    const i = this.nearest()
    return Math.abs(this.levels[i].y - this.y) < 0.005 && this.target === null ? i : -1
  }

  private enqueue(i: number) {
    if (!this.queue.includes(i)) this.queue.push(i)
  }

  private hallCall(i: number, way: 'up' | 'down') {
    const at = this.atLevel()
    if (at === i) {
      this.open()
      return
    }
    this.light(this.landings[i].calls[way], true)
    this.enqueue(i)
  }

  private carCommand(cmd: string) {
    const i = this.levels.findIndex((l) => l.name === cmd)
    if (i >= 0) {
      if (this.atLevel() === i) {
        this.open()
        return
      }
      this.light(this.carButtons.get(cmd), true)
      this.enqueue(i)
      // Choosing a floor with the doors open closes them soon after.
      if (this.doorDir >= 0 && this.door > 0) this.dwell = Math.min(this.dwell, 1.2)
      return
    }
    if (cmd === 'open') this.open()
    else if (cmd === 'close' && this.door > 0 && this.doorDir >= 0) this.dwell = 0
    else if (cmd === 'alarm') {
      bell(this.car.getWorldPosition(new Vector3()).setY(this.y + 1.5))
      this.alarmLit = 1.6
      this.light(this.carButtons.get('alarm'), true)
    } else if (cmd === 'stop') {
      this.stopLit = 1.2
      this.light(this.carButtons.get('stop'), true)
    }
  }

  private open() {
    if (this.atLevel() < 0) return
    if (this.doorDir <= 0 && this.door < 1) {
      this.doorDir = 1
      doorSound(this.centre(), DOOR_TIME * (1 - this.door))
    }
    this.dwell = DWELL
  }

  private centre() {
    return new Vector3(this.spec.x, this.y + 1.2, this.spec.z)
  }

  /** Is the walker standing in the doorway (doors may not close on them)? */
  private inDoorway(r: Rider | null) {
    if (!r) return false
    const p = r.position
    const a = (p.x - this.f.cx) * this.f.ax + (p.z - this.f.cz) * this.f.az
    const o = (p.x - this.f.cx) * this.f.ox + (p.z - this.f.cz) * this.f.oz
    return Math.abs(p.y - this.y) < 0.8 && Math.abs(a) < OPENING / 2 + 0.15 && o > this.spec.d / 2 - 0.35 && o < this.faceO + 0.4
  }

  /** Is the walker in the car? */
  aboard(p: Vector3) {
    const a = (p.x - this.f.cx) * this.f.ax + (p.z - this.f.cz) * this.f.az
    const o = (p.x - this.f.cx) * this.f.ox + (p.z - this.f.cz) * this.f.oz
    return Math.abs(a) < this.spec.w / 2 && o > -this.spec.d / 2 && o < this.spec.d / 2 + 0.02 && Math.abs(p.y - this.y) < 0.6
  }

  /** Is the walker in the car, or in its open doorway with the panel in reach? */
  reachable(p: Vector3) {
    if (this.aboard(p)) return true
    if (this.door < 0.5 || this.target !== null) return false
    const a = (p.x - this.f.cx) * this.f.ax + (p.z - this.f.cz) * this.f.az
    const o = (p.x - this.f.cx) * this.f.ox + (p.z - this.f.cz) * this.f.oz
    return Math.abs(a) < OPENING / 2 + 0.2 && o > 0 && o < this.faceO + 0.8 && Math.abs(p.y - this.y) < 0.6
  }

  /** Where the car is and where it's going, for the walking overlay. */
  get status() {
    const i = this.nearest()
    return {
      floor: this.levels[i].name,
      dir: this.dir,
      moving: this.target !== null,
      lit: this.levels.filter((l) => this.carButtons.get(l.name)?.lit).map((l) => l.name),
    }
  }

  /**
   * Advances the lift by dt. `rider` is the walker, if one is about: they ride the car (the
   * returned rise is theirs too) and hold the doors. Returns the car's rise this step.
   */
  tick(dt: number, rider: Rider | null): number {
    const before = this.y
    // The lit alarm and stop go out after their moment.
    if (this.alarmLit > 0 && (this.alarmLit -= dt) <= 0) this.light(this.carButtons.get('alarm'), false)
    if (this.stopLit > 0 && (this.stopLit -= dt) <= 0) this.light(this.carButtons.get('stop'), false)

    if (this.target !== null) {
      // Under way: accelerate, cruise, and brake to stop level at the landing.
      const goal = this.levels[this.target].y
      const dist = goal - this.y
      const dir = Math.sign(dist)
      const stopping = (this.v * this.v) / (2 * ACCEL)
      const speed = Math.abs(this.v)
      const want = Math.abs(dist) <= stopping + 0.01 ? Math.max(0.05, speed - ACCEL * dt) : Math.min(V_MAX, speed + ACCEL * dt)
      this.v = dir * want
      const step = this.v * dt
      if (Math.abs(step) >= Math.abs(dist)) {
        this.y = goal
        this.arrive()
      } else this.y += step
    } else if (this.doorDir !== 0) {
      this.door = Math.min(1, Math.max(0, this.door + (this.doorDir * dt) / DOOR_TIME))
      if (this.doorDir < 0 && this.inDoorway(rider)) {
        // Something in the doorway: the doors reopen.
        this.doorDir = 1
        doorSound(this.centre(), DOOR_TIME * (1 - this.door))
        this.dwell = 2.5
      }
      if (this.door >= 1 && this.doorDir > 0) this.doorDir = 0
      if (this.door <= 0 && this.doorDir < 0) this.doorDir = 0
    } else if (this.door > 0) {
      // Open: hold, then close (unless someone stands in the doorway).
      if (this.inDoorway(rider)) this.dwell = Math.max(this.dwell, 1.5)
      this.dwell -= dt
      if (this.dwell <= 0) {
        this.doorDir = -1
        doorSound(this.centre(), DOOR_TIME * this.door)
      }
    } else if (this.queue.length) {
      // Shut and called: serve the next call in the direction of travel, else the oldest.
      const here = this.nearest()
      const ahead = this.queue.filter((i) => this.dir === 0 || Math.sign(this.levels[i].y - this.y) === this.dir)
      const next = (ahead.length ? ahead : this.queue).reduce((a, b) => (Math.abs(this.levels[a].y - this.y) <= Math.abs(this.levels[b].y - this.y) ? a : b))
      if (next === here && Math.abs(this.levels[here].y - this.y) < 0.005) {
        this.queue = this.queue.filter((i) => i !== here)
        this.clearCalls(here)
        this.open()
      } else {
        this.target = next
        this.dir = Math.sign(this.levels[next].y - this.y)
        this.v = 0
        this.stopSound?.()
        this.stopSound = motor(this.centre())
      }
    } else this.dir = 0

    this.place()
    this.updateDisplay()
    const rise = this.y - before
    if (rider && rise !== 0 && this.aboard(rider.position)) rider.position.y += rise
    return rise
  }

  private clearCalls(i: number) {
    const l = this.landings[i]
    this.light(l.calls.up, false)
    this.light(l.calls.down, false)
    this.light(this.carButtons.get(this.levels[i].name), false)
  }

  private arrive() {
    const i = this.target!
    this.target = null
    this.v = 0
    this.stopSound?.()
    this.stopSound = null
    this.queue = this.queue.filter((q) => q !== i)
    this.clearCalls(i)
    chime(this.centre(), this.dir < 0)
    if (!this.queue.length) this.dir = 0
    // The doors open once the car has settled level with the landing.
    this.dwell = DWELL
    this.doorDir = 1
    doorSound(this.centre(), DOOR_TIME)
  }

  /** Puts the car at its height and every door where it now stands. */
  private place() {
    this.car.position.y = this.y
    const at = this.atLevel()
    const slide = (OPENING / 2 + 0.02) * this.ease(this.door)
    const set = (node: Object3D, s: number, amount: number) => {
      node.position.x = this.f.ax * s * amount
      node.position.z = this.f.az * s * amount
    }
    this.carPanels.forEach((n, k) => set(n, k === 0 ? -1 : 1, slide))
    this.landings.forEach((l, i) => l.panels.forEach((n, k) => set(n, k === 0 ? -1 : 1, i === at ? slide : 0)))
  }

  private ease(t: number) {
    return t * t * (3 - 2 * t)
  }

  private updateDisplay() {
    if (!this.display) return
    const i = this.nearest()
    const name = this.levels[i].name
    const key = `${name}|${this.dir}`
    if (key === this.shown) return
    this.shown = key
    const { canvas, tex } = this.display
    drawDisplay(canvas.getContext('2d')!, canvas.width, canvas.height, name, this.dir)
    tex.needsUpdate = true
  }

  /** Parks the car at a level, doors shut (for the views from above). */
  park(level: number) {
    const i = this.levels.findIndex((l) => l.level === level)
    if (i < 0) return
    this.y = this.levels[i].y
    this.target = null
    this.door = 0
    this.doorDir = 0
    this.queue = []
    this.stopSound?.()
    this.stopSound = null
    for (let k = 0; k < this.levels.length; k++) this.clearCalls(k)
    this.place()
    this.updateDisplay()
  }

  get busy() {
    return this.target !== null || this.doorDir !== 0 || this.door > 0 || this.queue.length > 0 || this.alarmLit > 0 || this.stopLit > 0
  }
}

/* ---------- the stair ---------- */

/** One storey of the dog-leg stair, from level `upper` down to `lower`, into `p`. */
function stairFlights(ctx: Ctx, p: Object3D, s: StairSpec, upper: number, lower: number) {
  const { m } = ctx
  const z = s.zone
  const entryAxis = axisOf(s.entry)
  const along = entryAxis
  const [e0, e1] = along === 'x' ? [z.x0, z.x1] : [z.z0, z.z1]
  const [c0, c1] = along === 'x' ? [z.z0, z.z1] : [z.x0, z.x1]
  const D = e1 - e0
  const W = c1 - c0
  // Distance from the entry edge, mapped to the plan coordinate.
  const entryEdge = signOf(s.entry) > 0 ? e1 : e0
  const toward = -signOf(s.entry)
  const at = (u: number) => entryEdge + toward * u
  const LND = 1.2
  const HALF = 1.1
  const run = D - LND - HALF
  const mid = (upper + lower) / 2
  const n = Math.max(2, Math.round((upper - mid) / 0.17))
  const r = (upper - mid) / n
  const t = run / (n - 1)
  const gap = 0.16
  const fw = (W - gap) / 2
  const sideA: R = [c0, c0 + fw]
  const sideB: R = [c1 - fw, c1]
  const piece = (u0: number, u1: number, ys: R, cs: R, mat: Material, cast = true) => {
    const [a, b] = [at(u0), at(u1)].sort((q, w) => q - w)
    if (along === 'x') bx(ctx, p, [a, b], ys, cs, mat, cast)
    else bx(ctx, p, cs, ys, [a, b], mat, cast)
  }
  const nosing = ctx.m.yellow
  // Flight A down from the upper landing, flight B down from the half landing back to the lower one.
  for (let i = 1; i < n; i++) {
    const top = upper - i * r
    piece(LND + (i - 1) * t, LND + i * t, [top - 0.32, top], sideA, m.concrete)
    piece(LND + (i - 1) * t, LND + (i - 1) * t + 0.05, [top - 0.006, top + 0.003], sideA, nosing, false)
  }
  for (let i = 1; i < n; i++) {
    const top = mid - i * r
    piece(LND + run - i * t, LND + run - (i - 1) * t, [top - 0.32, top], sideB, m.concrete)
    piece(LND + run - (i - 1) * t - 0.05, LND + run - (i - 1) * t, [top - 0.006, top + 0.003], sideB, nosing, false)
  }
  // The sloping soffits under the flights, and the half landing.
  for (const [cs, y0, y1, u0, u1] of [[sideA, upper, mid, LND, LND + run], [sideB, mid, lower, LND + run, LND]] as const) {
    const len = Math.hypot(u1 - u0, y1 - y0)
    const geo = new BoxGeometry(along === 'x' ? len : cs[1] - cs[0], 0.18, along === 'x' ? cs[1] - cs[0] : len)
    const slab = new Mesh(geo, m.concrete)
    const um = (u0 + u1) / 2
    const ym = (y0 + y1) / 2 - 0.36
    const cm = (cs[0] + cs[1]) / 2
    if (along === 'x') slab.position.set(at(um), ym, cm)
    else slab.position.set(cm, ym, at(um))
    const angle = Math.atan2(y1 - y0, (at(u1) - at(u0)))
    if (along === 'x') slab.rotation.z = angle
    else slab.rotation.x = -angle
    slab.castShadow = true
    slab.receiveShadow = true
    p.add(slab)
  }
  piece(LND + run, D, [mid - 0.2, mid], [c0, c1], m.concrete)
  piece(LND + run, D, [mid - 0.003, mid + 0.004], [c0 + 0.02, c1 - 0.02], m.lobbyTile, false)
  // The lower floor landing.
  piece(0, LND, [lower - 0.2, lower], [c0, c1], m.concrete)
  piece(0, LND, [lower - 0.003, lower + 0.004], [c0 + 0.02, c1 - 0.02], m.lobbyTile, false)
  // A balustrade down the well between the flights: posts and a steel rail along each flight's edge.
  const rail = (cs: number, u0: number, u1: number, y0: number, y1: number) => {
    const len = Math.hypot(u1 - u0, y1 - y0)
    const c = new Mesh(new CylinderGeometry(0.022, 0.022, len, 10), m.aluminium)
    const um = (u0 + u1) / 2
    if (along === 'x') {
      c.position.set(at(um), (y0 + y1) / 2 + 0.9, cs)
      c.rotation.z = PI / 2 + Math.atan2(y1 - y0, at(u1) - at(u0))
    } else {
      c.position.set(cs, (y0 + y1) / 2 + 0.9, at(um))
      c.rotation.x = PI / 2 - Math.atan2(y1 - y0, at(u1) - at(u0))
    }
    p.add(c)
    for (let k = 0; k <= 4; k++) {
      const u = u0 + ((u1 - u0) * k) / 4
      const y = y0 + ((y1 - y0) * k) / 4
      if (along === 'x') bx(ctx, p, [at(u) - 0.015, at(u) + 0.015], [y, y + 0.9], [cs - 0.015, cs + 0.015], m.steel)
      else bx(ctx, p, [cs - 0.015, cs + 0.015], [y, y + 0.9], [at(u) - 0.015, at(u) + 0.015], m.steel)
    }
    // Infill bars between the posts, so the well can't be fallen through.
    for (let k = 1; k <= 2; k++) {
      const yy = k * 0.3
      const cc = new Mesh(new CylinderGeometry(0.008, 0.008, len, 6), m.steel)
      cc.position.copy(c.position)
      cc.position.y = (y0 + y1) / 2 + yy
      cc.rotation.copy(c.rotation)
      p.add(cc)
    }
  }
  rail(sideA[1] + 0.03, LND, LND + run, upper, mid)
  rail(sideB[0] - 0.03, LND + run, LND, mid, lower)
  // A solid upstand under the rails on the well side, closing the gap between flights.
  piece(LND, LND + run, [lower, Math.min(mid, upper) - 0.1], [sideA[1] + 0.01, sideB[0] - 0.01], m.blockwork)
  // Wall handrails on the outer side of each flight.
  rail(c0 + 0.06, LND, LND + run, upper, mid)
  rail(c1 - 0.06, LND + run, LND, mid, lower)
}

/* ---------- the core ---------- */

export interface AccessBuild {
  lifts: Lift[]
  /** The stair between each pair of levels, and the levels it shows from. */
  stairs: { group: Group; levels: number[] }[]
}

/**
 * Builds the core: per level its walls, lift landings and stair door into `parentFor(level)`; each
 * storey of stair into its own group; the cars into `cars`.
 */
export function buildAccess(ctx: Ctx, spec: AccessSpec, parentFor: (level: number) => Object3D, cars: Object3D): AccessBuild {
  const { m, k } = ctx
  const levels = accessLevels(spec)
  const out = { lifts: [] as Lift[], stairs: [] as { group: Group; levels: number[] }[] }
  const T = 0.2
  const faceAxis = alongOf(spec.face)
  const along = (x: number, z: number) => (faceAxis === 'x' ? x : z)

  // The openings in the core's face: each lift's doors, and the stair door.
  const openings = [
    ...spec.lifts.map((l) => ({ at: along(l.x, l.z), w: OPENING + 0.1, h: DOOR_H + 0.14 })),
    { at: spec.stair.at, w: 1.05, h: 2.15 },
  ]

  for (const lv of levels) {
    const p = parentFor(lv.level)
    const top = lv.level === 0 ? spec.ground.top : lv.level === -1 ? 0 : LEVEL_Y[-1]
    const ceiling = lv.level === 0 ? spec.ground.top : top - SLAB
    const base = lv.level === 0 ? lv.y : lv.y
    // In the basements the core has outer walls, its doors in the face; the shafts and the stair
    // are walled within it at every level, and at the ground stand on their own under a roof.
    if (lv.level < 0)
      for (const d of SIDES) wallWith(ctx, p, sideOf(spec.rect, d, -T), alongOf(d), base, top, d === spec.face ? openings : [], m.blockwork)
    const encl: Rect[] = [...spec.lifts.map((l) => shaftRect(l)), spec.stair.zone]
    for (const r of encl) {
      for (const d of SIDES) {
        // On the face: where the core has its own wall (the basements) or the lobby has one, none.
        if (d === spec.face && (lv.level < 0 || !spec.ground.frontWall)) continue
        const ops = d === spec.face ? openings.filter((op) => op.at > (faceAxis === 'x' ? r.x0 : r.z0) && op.at < (faceAxis === 'x' ? r.x1 : r.z1)) : []
        wallWith(ctx, p, sideOf(r, d, T), alongOf(d), lv.level === 0 ? base - 0.15 : base, top, ops, m.blockwork)
      }
      if (lv.level === 0) bx(ctx, p, [r.x0 - T, r.x1 + T], [top - 0.02, top + 0.1], [r.z0 - T, r.z1 + T], m.blockwork, false)
    }
    // Inside the stair enclosure: the level's sign facing the flight, and a bulkhead light.
    const zc = spec.stair.zone
    const sign = new Mesh(new PlaneGeometry(0.7, 0.5), m.glowing(`stairmark${lv.level}`, 512, 384, levelMark(lv.name, lv.level === 0 ? '#3b3f44' : LEVEL_COLOUR[lv.level], lv.level === 0 ? spec.ground.label : lv.level === -1 ? 'Basement 1' : 'Basement 2'), 0.25))
    // On the wall at the entry end, beside the door, facing the flights.
    const ef = new Frame((zc.x0 + zc.x1) / 2, (zc.z0 + zc.z1) / 2, spec.stair.entry)
    const back = axisOf(spec.stair.entry) === 'x' ? (zc.x1 - zc.x0) / 2 : (zc.z1 - zc.z0) / 2
    const width = axisOf(spec.stair.entry) === 'x' ? zc.z1 - zc.z0 : zc.x1 - zc.x0
    const side = width / 2 - 0.5
    sign.position.set(ef.x(side, back - 0.01), lv.y + 1.7, ef.z(side, back - 0.01))
    sign.rotation.y = ef.yaw + PI
    p.add(sign)
    const lamp = k.box(p, 0.3, 0.08, 0.06, m.led, ef.x(-side, back - 0.04), Math.min(lv.y + 2.6, ceiling - 0.15), ef.z(-side, back - 0.04), false)
    lamp.rotation.y = ef.yaw
    // The stair door: a fire door on its hinge, swinging out; the exit sign over it.
    stairDoor(ctx, p, spec, lv)
    // The floor of the core at this level, where the stair well and shafts leave none.
    if (lv.level === 0) {
      // The ground landing inside the stair enclosure.
      const zone = spec.stair.zone
      const ax = axisOf(spec.stair.entry)
      const edge = signOf(spec.stair.entry) > 0 ? (ax === 'x' ? zone.x1 : zone.z1) : ax === 'x' ? zone.x0 : zone.z0
      const lnd: R = [edge - 1.2, edge].map((v) => (signOf(spec.stair.entry) > 0 ? v : v + 1.2)) as R
      if (ax === 'x') bx(ctx, p, lnd, [lv.y - 0.2, lv.y + 0.004], [zone.z0, zone.z1], m.lobbyTile)
      else bx(ctx, p, [zone.x0, zone.x1], [lv.y - 0.2, lv.y + 0.004], lnd, m.lobbyTile)
      // The threshold between the lobby and the landing.
      const df = doorFrame(spec)
      bx(ctx, p, ...thresholdBox(df, lv.y), m.lobbyTile)
    } else {
      // The basement floor is open over the core: its lobby strip, landing and pit are the core's own.
      const df = doorFrame(spec)
      bx(ctx, p, ...thresholdBox(df, lv.y), m.lobbyTile)
    }
  }
  // The B2 landing of the stair (the bottom), and each lift's pit floor.
  for (const l of spec.lifts) {
    const r = shaftRect(l)
    bx(ctx, parentFor(-2), [r.x0, r.x1], [LEVEL_Y[-2] - 1.4, LEVEL_Y[-2] - 1.3], [r.z0, r.z1], m.concrete, false)
  }
  // The stair, a storey at a time.
  for (let i = 0; i + 1 < levels.length; i++) {
    const g = new Group()
    g.name = `stair_${levels[i].name}_${levels[i + 1].name}`
    stairFlights(ctx, g, spec.stair, levels[i].y, levels[i + 1].y)
    out.stairs.push({ group: g, levels: [levels[i].level, levels[i + 1].level] })
  }
  // The lifts.
  spec.lifts.forEach((l, i) => {
    const lift = new Lift(ctx, l, spec, levels, i, parentFor)
    cars.add(lift.car)
    out.lifts.push(lift)
  })
  return out
}

/** A lift's shaft, inside its walls. */
export function shaftRect(l: LiftSpec): Rect {
  const f = new Frame(l.x, l.z, l.door)
  const [xs, zs] = f.box([-l.w / 2 - 0.2, l.w / 2 + 0.2], [-l.d / 2 - 0.2, l.d / 2 + 0.05])
  return { x0: xs[0], x1: xs[1], z0: zs[0], z1: zs[1] }
}

/** Where the stair door is: on the core's face at `at`. */
function doorFrame(spec: AccessSpec) {
  const r = spec.rect
  const d = spec.face
  const pos = axisOf(d) === 'x' ? (signOf(d) > 0 ? r.x1 : r.x0) : signOf(d) > 0 ? r.z1 : r.z0
  const cx = axisOf(d) === 'x' ? pos : spec.stair.at
  const cz = axisOf(d) === 'z' ? pos : spec.stair.at
  return new Frame(cx, cz, d)
}

function thresholdBox(f: Frame, y: number): [R, R, R] {
  const [xs, zs] = f.box([-0.55, 0.55], [-0.25, 0.02])
  return [xs, [y - 0.15, y + 0.004], zs]
}

/** The fire door at the stair, on its hinge (a door_ node the walker opens as any other). */
function stairDoor(ctx: Ctx, p: Object3D, spec: AccessSpec, lv: Level) {
  const { m, k } = ctx
  const f = doorFrame(spec)
  const w = 1.0
  const h = 2.1
  // Frame round the opening.
  for (const s of [-1, 1]) fb(ctx, p, f, s < 0 ? [-w / 2 - 0.06, -w / 2] : [w / 2, w / 2 + 0.06], [lv.y, lv.y + h + 0.06], [-0.22, 0.02], m.steel)
  fb(ctx, p, f, [-w / 2 - 0.06, w / 2 + 0.06], [lv.y + h, lv.y + h + 0.06], [-0.22, 0.02], m.steel)
  // The leaf, hinged at its −a edge, swinging out of the enclosure.
  const hinge = new Group()
  hinge.name = `door_stair_${lv.name}`
  hinge.position.set(f.x(-w / 2, 0.0), 0, f.z(-w / 2, 0.0))
  hinge.rotation.y = 0
  hinge.userData.label = 'Stair Door'
  // A positive turn about y swings +a towards −o for these frames; out of the enclosure is +o.
  const test = new Vector3(f.ax, 0, f.az).applyAxisAngle(new Vector3(0, 1, 0), PI / 2)
  hinge.userData.openAngle = test.x * f.ox + test.z * f.oz > 0 ? PI / 2 : -PI / 2
  p.add(hinge)
  const leaf = new Mesh(new BoxGeometry(1, 1, 1), m.fireDoor)
  const [xs, zs] = f.box([-w / 2 + 0.005, w / 2 - 0.005], [-0.06, -0.02])
  leaf.scale.set(xs[1] - xs[0], h - 0.01, zs[1] - zs[0])
  leaf.position.set((xs[0] + xs[1]) / 2 - hinge.position.x, lv.y + h / 2, (zs[0] + zs[1]) / 2 - hinge.position.z)
  leaf.castShadow = true
  leaf.receiveShadow = true
  leaf.userData.front = true
  hinge.add(leaf)
  // Lever handle on both faces, near the free edge.
  for (const o of [-0.09, 0.01]) {
    const [hx, hz] = f.box([w / 2 - 0.17, w / 2 - 0.05], [o - 0.012, o + 0.012])
    k.box(hinge, hx[1] - hx[0], 0.025, hz[1] - hz[0], m.aluminium, (hx[0] + hx[1]) / 2 - hinge.position.x, lv.y + 1.05, (hz[0] + hz[1]) / 2 - hinge.position.z, false)
  }
  // The lit exit sign over it, and a label beside it naming the stair and the level.
  const ex = m.glowing('exitStair', 512, 192, exitSign('none'), 1.2)
  face(p, f, 0.6, 0.22, ex, 0, lv.y + h + 0.3, 0.03)
  face(p, f, 0.6, 0.16, m.painted(`stairlbl_${lv.name}`, 512, 128, board([`STAIRS · ${lv.name}`], 'none', '#0d8a3e')), w / 2 + 0.55, lv.y + 1.55, 0.03)
}
