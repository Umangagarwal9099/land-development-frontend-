import { MathUtils, Ray, Vector3, type Camera } from 'three'
import type { Collider } from './collider'
import { WALK_SPEED, type Walker } from './walker'

const EYE = 1.44
/** The height the third-person camera looks over the shoulder from. */
const HEAD = 1.32
const BOOM = 2.3
/** Kept clear of any surface, so the near plane never cuts into it. */
const CLEARANCE = 0.16
/** How quickly the camera catches up: quick enough never to trail by more than a stride's fraction. */
const FOLLOW = { third: 9, first: 16 }
/** Stairs change height in steps, so height settles more gently than position. */
const FOLLOW_Y = 8
const LOOK = 18
/** How fast walking sideways swings the view round to follow, rad/s at full speed. */
const SWING = { third: 1.05, first: 0.75 }
/** After the user looks around, their view is left alone this long, then following eases back in. */
const LOOK_HOLD = 0.6
const LOOK_RELEASE = 1.4

const AROUND = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]

const ray = new Ray()
const origin = new Vector3()
const offset = new Vector3()

/**
 * The walking camera. It trails the walker with a little smoothing, and walking left or right
 * swings the view round after them, so A, D or the joystick turn the walk rather than only sidestep
 * across the frame. Looking around (mouse or drag) only ever changes the view, never the walker's position.
 */
export class FollowCamera {
  readonly look = new Vector3(0, 0, -1)
  /** How long the third-person boom currently is. */
  boom = BOOM
  /** The lens's distance from the walker's head, after any wall has had its say. */
  standoff = BOOM
  private pivot: Vector3
  private yaw: number
  private pitch: number
  private idle = LOOK_RELEASE
  private collider: Collider

  constructor(collider: Collider, walker: Walker) {
    this.collider = collider
    this.pivot = walker.position.clone()
    this.yaw = walker.yaw
    this.pitch = walker.pitch
  }

  /** The user just moved the view by hand. */
  looked() {
    this.idle = 0
  }

  /** Before the walker steps: swings its heading towards the side it's walking to. */
  steer(delta: number, walker: Walker, right: number, forward: number, third: boolean) {
    this.idle += delta
    // Backing up, the view holds still: a swing there would throw the walker into a confusing arc.
    if (forward < -0.1) return
    const eased = MathUtils.smoothstep(this.idle, LOOK_HOLD, LOOK_RELEASE)
    const pace = Math.min(1, Math.hypot(walker.velocity.x, walker.velocity.z) / WALK_SPEED)
    const side = right / Math.max(1, Math.hypot(right, forward))
    walker.yaw -= side * (third ? SWING.third : SWING.first) * eased * pace * delta
  }

  /** After the walker steps: places the camera. `bob` and `sway` are the first-person head movement. */
  update(delta: number, walker: Walker, third: boolean, bob: number, sway: number, camera: Camera) {
    const p = walker.position
    const rate = third ? FOLLOW.third : FOLLOW.first
    this.pivot.x = MathUtils.damp(this.pivot.x, p.x, rate, delta)
    this.pivot.z = MathUtils.damp(this.pivot.z, p.z, rate, delta)
    this.pivot.y = MathUtils.damp(this.pivot.y, p.y, FOLLOW_Y, delta)
    this.yaw = MathUtils.damp(this.yaw, walker.yaw, LOOK, delta)
    this.pitch = MathUtils.damp(this.pitch, walker.pitch, LOOK, delta)
    const cos = Math.cos(this.pitch)
    this.look.set(-Math.sin(this.yaw) * cos, Math.sin(this.pitch), -Math.cos(this.yaw) * cos)

    if (third) {
      camera.position.set(this.pivot.x, this.pivot.y + HEAD, this.pivot.z)
      // Over the shoulder, on a boom that shortens at once for a wall and lengthens back gently.
      ray.origin.copy(camera.position)
      ray.direction.copy(this.look).negate()
      const want = Math.max(0.3, Math.min(BOOM, this.collider.raycast(ray, BOOM + 0.2) - CLEARANCE))
      this.boom = want < this.boom ? want : MathUtils.damp(this.boom, want, 4, delta)
      camera.position.addScaledVector(ray.direction, this.boom)
      // Sliding past a corner, the lens could still graze a surface to its side: ease it off.
      for (const [x, y, z] of AROUND) {
        ray.origin.copy(camera.position)
        ray.direction.set(x, y, z)
        const d = this.collider.raycast(ray, CLEARANCE)
        if (d < CLEARANCE) camera.position.addScaledVector(ray.direction, d - CLEARANCE)
      }
      // The trailing pivot can lag round a corner: nothing may stand between the walker and the lens, so this has the last word.
      origin.set(p.x, p.y + HEAD, p.z)
      offset.subVectors(camera.position, origin)
      const len = offset.length()
      ray.origin.copy(origin)
      ray.direction.copy(offset).divideScalar(len)
      const hit = this.collider.raycast(ray, len + CLEARANCE)
      this.standoff = len
      if (hit < len + CLEARANCE) {
        this.standoff = Math.max(0.05, hit - CLEARANCE)
        camera.position.copy(origin).addScaledVector(ray.direction, this.standoff)
      }
    } else {
      this.standoff = 0
      camera.position.set(this.pivot.x + Math.cos(this.yaw) * sway, this.pivot.y + EYE + bob, this.pivot.z - Math.sin(this.yaw) * sway)
    }
    camera.up.set(0, 1, 0)
    camera.lookAt(origin.copy(camera.position).add(this.look))
    camera.updateMatrixWorld()
  }
}
