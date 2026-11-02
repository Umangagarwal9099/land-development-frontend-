import { MathUtils, Ray, Vector3 } from 'three'
import type { Collider } from './collider'

export const RADIUS = 0.2
export const HEIGHT = 1.58
/** The capsule starts this far above the feet, so a stair tread is stepped onto, not walked into. */
const STEP = 0.3
export const WALK_SPEED = 1.25
const ACCEL = 8
const GRAVITY = 9.8
const JUMP_SPEED = 2.6
/** Ground this far below the feet is stepped down to; any further and the walker falls. */
const SNAP = 0.32
/** How quickly the body settles to the height of the tread under it. */
const SETTLE = 14
const MAX_SUBSTEP = 0.08

const a = new Vector3()
const b = new Vector3()
const out = new Vector3()
const down = new Ray(new Vector3(), new Vector3(0, -1, 0))

export interface WalkBounds {
  x0: number
  x1: number
  z0: number
  z1: number
}

/**
 * The walker's body, free of rendering: a capsule pushed out of the house's real geometry, resting
 * on whatever is underfoot. `yaw` 0 faces −z; a positive yaw turns left.
 */
export class Walker {
  readonly position: Vector3
  readonly velocity = new Vector3()
  yaw: number
  pitch = 0
  grounded = true
  private fall = 0

  private collider: Collider
  private bounds: WalkBounds

  constructor(collider: Collider, start: Vector3, yaw: number, bounds: WalkBounds) {
    this.collider = collider
    this.bounds = bounds
    this.position = start.clone()
    this.yaw = yaw
    this.position.y = this.groundAt(start.x, start.z, start.y) ?? start.y
  }

  /** The height of the surface under (x, z), looking down from a step above `from`. */
  groundAt(x: number, z: number, from: number) {
    down.origin.set(x, from + STEP + 0.2, z)
    const d = this.collider.raycast(down, 6)
    return Number.isFinite(d) ? down.origin.y - d : null
  }

  /** `right` and `forward` (−1 … 1) are relative to where the walker looks. */
  step(dt: number, right: number, forward: number, jump: boolean) {
    const len = Math.hypot(right, forward)
    const scale = len > 1 ? 1 / len : 1
    const s = Math.sin(this.yaw)
    const c = Math.cos(this.yaw)
    const wantX = (right * c - forward * s) * scale * WALK_SPEED
    const wantZ = (-right * s - forward * c) * scale * WALK_SPEED
    this.velocity.x = MathUtils.damp(this.velocity.x, wantX, ACCEL, dt)
    this.velocity.z = MathUtils.damp(this.velocity.z, wantZ, ACCEL, dt)

    const p = this.position
    const fromX = p.x
    const fromZ = p.z
    const moved = Math.hypot(this.velocity.x, this.velocity.z) * dt
    const n = Math.max(1, Math.ceil(moved / MAX_SUBSTEP))
    // Even standing still the capsule is resolved: a door may have swung into it.
    for (let i = 0; i < n; i++) {
      p.x += (this.velocity.x * dt) / n
      p.z += (this.velocity.z * dt) / n
      this.resolve()
    }
    p.x = MathUtils.clamp(p.x, this.bounds.x0 + RADIUS, this.bounds.x1 - RADIUS)
    p.z = MathUtils.clamp(p.z, this.bounds.z0 + RADIUS, this.bounds.z1 - RADIUS)
    // Sliding along a wall keeps only the speed actually made good.
    if (dt > 0 && moved > 1e-5) {
      this.velocity.x = (p.x - fromX) / dt
      this.velocity.z = (p.z - fromZ) / dt
    }

    if (jump && this.grounded) {
      this.fall = JUMP_SPEED
      this.grounded = false
    }
    const ground = this.groundAt(p.x, p.z, p.y)
    if (this.grounded && ground !== null && p.y - ground <= SNAP) p.y = MathUtils.damp(p.y, ground, SETTLE, dt)
    else {
      this.grounded = false
      this.fall -= GRAVITY * dt
      p.y += this.fall * dt
      if (ground !== null && p.y <= ground && this.fall <= 0) {
        p.y = ground
        this.fall = 0
        this.grounded = true
      }
    }
  }

  private resolve() {
    const p = this.position
    a.set(p.x, p.y + STEP + RADIUS, p.z)
    b.set(p.x, p.y + HEIGHT - RADIUS, p.z)
    this.collider.capsule(a, b, RADIUS, out)
    p.x += out.x
    p.z += out.z
    // The head meeting something ends a jump.
    if (out.y < -1e-4 && this.fall > 0) this.fall = 0
  }
}
