import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Box3, MathUtils, PerspectiveCamera, Ray, Raycaster, Vector2, Vector3, type Object3D } from 'three'
import { useStageStore } from '../../../../store/stage'
import { useWalkStore, walkInput, type LiftStatus, type WalkPrompt } from '../../../../store/walk'
import type { Basement } from '../furnished/basement'
import { setListener, unlockSound } from '../furnished/basement/sound'
import type { LiftHost, WalkArea } from '../furnished/shared'
import { isButton, isDoor, isDrawer, isInfo, isOpenable, isSpinner, isSwitch, operate } from '../openables'
import { Character } from './character'
import { Collider } from './collider'
import { FollowCamera } from './followCamera'
import { Walker } from './walker'

const EYE = 1.44
const FOV = 68
const REACH = 1.55
/** Within an arm's length of the shoulder across the floor, and anywhere from the floor to overhead: leaning and crouching cover the height. */
const ARM = 0.8
const LOOK_SPEED = 0.0024
const PITCH = 1.35

const flatTo = (dx: number, dz: number) => Math.hypot(dx, dz)

/** What the prompt calls a door, drawer, switch or fan. */
function describe(o: Object3D): WalkPrompt {
  const n = o.name
  const open = !!o.userData.open
  const verb = open ? 'Close' : 'Open'
  if (isButton(n)) return { verb: (o.userData.verb as string | undefined) ?? 'Press', label: (o.userData.label as string | undefined) ?? 'Button' }
  if (isInfo(n)) return { verb: 'About', label: (o.userData.info as { title?: string } | undefined)?.title ?? 'Equipment' }
  // A part can name itself and its two actions (a bed's backrest: Raise / Lower).
  const verbs = o.userData.verbs as [string, string] | undefined
  if ((isDoor(n) || isDrawer(n)) && typeof o.userData.label === 'string') return { verb: verbs ? verbs[open ? 1 : 0] : verb, label: o.userData.label }
  if (isSwitch(n)) return { verb: (o.userData.on ?? true) ? 'Turn off' : 'Turn on', label: 'Light' }
  if (isSpinner(n)) return { verb: o.userData.on ? 'Stop' : 'Start', label: 'Ceiling Fan' }
  if (n === 'door_main') return { verb, label: 'Main Door' }
  if (n.startsWith('door_balcony')) return { verb, label: 'Balcony Door' }
  if (n === 'door_bedroom_entry' || n === 'door_bed2_entry' || n === 'door_bed3_entry' || n === 'door_bed4_entry') return { verb, label: 'Bedroom Door' }
  if (n === 'door_bath_entry' || n === 'door_bed3_bath' || n === 'door_bath4_entry') return { verb, label: 'Bathroom Door' }
  if (n === 'door_hall_corridor') return { verb, label: 'Kitchen Door' }
  if (n.startsWith('door_toilet_seat')) return { verb: open ? 'Lower' : 'Lift', label: 'Toilet Seat' }
  if (n.startsWith('door_toilet_lid')) return { verb: open ? 'Lower' : 'Lift', label: 'Toilet Lid' }
  if (n.startsWith('door_bed4_wardrobe')) return { verb, label: 'Wardrobe' }
  if (n.startsWith('door_wardrobe') || n.startsWith('door_bed4_loft') || n.startsWith('door_bed2_loft') || n.startsWith('door_bed3_loft')) return { verb, label: 'Wardrobe Loft' }
  if (n.startsWith('drawer_wardrobe_slider') || n.startsWith('drawer_bed2_wardrobe_') || /^drawer_bed3_wardrobe_\d$/.test(n)) return { verb, label: 'Wardrobe' }
  if (n.startsWith('drawer_bed2_side') || n.startsWith('drawer_bed2_foot')) return { verb, label: 'Bed Drawer' }
  if (isDrawer(n)) return { verb, label: n.includes('desk') ? 'Desk Drawer' : 'Drawer' }
  if (isDoor(n)) return { verb, label: 'Cupboard' }
  return { verb, label: 'Item' }
}

/**
 * A door or drawer's own position to reach for: the middle of its front panel. A large piece of
 * equipment marks where it is used from (its console, its controls) with `userData.reach`.
 */
function grip(o: Object3D) {
  let front: Object3D = o
  let reach: Object3D | null = null
  o.traverse((c) => {
    if (c.userData.front) front = c
    if (c.userData.reach) reach = c
  })
  return reach ?? front
}

const v = new Vector3()
const ray = new Ray()
const caster = new Raycaster()
const ndc = new Vector2()
const closest = new Vector3()
/** A tap or click this short and this still is a press, not a look round. */
const TAP_MS = 350
const TAP_PX = 8
/** Entrance doors open for a walker within this distance of them. */
const AUTO_DOOR = 2.6
/** Below this the walker is in the basements (and back above the higher one). */
const BELOW = -1.2
const ABOVE = -0.9

/** The centre of a door's, drawer's or button's front, in world space. */
function frontCentre(front: Object3D, out: Vector3) {
  const g = (front as { geometry?: { boundingSphere?: { center: Vector3 } | null; computeBoundingSphere: () => void } }).geometry
  if (g && !g.boundingSphere) g.computeBoundingSphere()
  const c = g?.boundingSphere?.center
  out.set(c?.x ?? 0, c?.y ?? 0, c?.z ?? 0)
  return front.localToWorld(out)
}

/**
 * Walking mode's brain, inside the 3D stage: takes over the camera, reads the keyboard and pointer,
 * moves the walker and poses the character. Doors and drawers go through the same `operate` and
 * animator as a tap in the camera view, so the two modes share their state.
 */
export function WalkController({
  root, area, setZone, rooms, basement, lifts,
}: { root: Object3D; area: WalkArea; setZone: (zone: string) => void; rooms: Map<string, string>; basement?: Basement; lifts?: LiftHost }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const invalidate = useThree((s) => s.invalidate)
  const controls = useStageStore((s) => s.controls)

  const session = useMemo(() => {
    const collider = new Collider(root)
    const walker = new Walker(collider, new Vector3(...area.start), area.yaw, area.bounds)
    const targets: { node: Object3D; front: Object3D }[] = []
    // Entrance doors that slide aside for a walker.
    // Each is measured from where it actually stands (some are drawn in a group at the origin).
    const leaves: { node: Object3D; closed: Vector3; at: Vector3; slide: Vector3; open: number }[] = []
    root.traverse((o) => {
      if (isOpenable(o.name)) targets.push({ node: o, front: grip(o) })
      if (o.name.startsWith('autoleaf_'))
        leaves.push({ node: o, closed: o.position.clone(), at: new Box3().setFromObject(o).getCenter(new Vector3()), slide: new Vector3().fromArray(o.userData.slide as number[]), open: 0 })
    })
    return { collider, walker, targets, leaves, rig: new FollowCamera(collider, walker) }
  }, [root, area])

  const character = useRef<Character | null>(null)
  const keys = useRef(new Set<string>())
  const lastYaw = useRef(area.yaw)
  const facing = useRef(area.yaw)
  const nearest = useRef<Object3D | null>(null)
  const sense = useRef(0)

  // Take the camera; give it back as it was found, then return to the property view.
  useEffect(() => {
    const fov = camera.fov
    const near = camera.near
    const figure = new Character()
    character.current = figure
    // Should the figure fail to download, walking carries on through the walker's own eyes.
    figure.onFail = () => {
      if (useWalkStore.getState().view === 'third') useWalkStore.getState().toggleView()
    }
    scene.add(figure.root)
    // oxlint-disable-next-line react/immutability -- the camera is configured imperatively
    camera.fov = FOV
    camera.near = 0.06
    camera.updateProjectionMatrix()
    if (controls) {
      // oxlint-disable-next-line react/immutability -- the controls are configured imperatively
      controls.enabled = false
      void controls.setFocalOffset(0, 0, 0, false)
      controls.colliderMeshes = []
    }
    useStageStore.getState().setAutoRotate(false)
    invalidate()
    if (import.meta.env.DEV) (window as unknown as { __walk?: unknown }).__walk = session
    return () => {
      figure.dispose()
      character.current = null
      // The entrance doors close behind the walker; sounds no longer follow them.
      for (const l of session.leaves) l.node.position.copy(l.closed)
      setListener(null)
      camera.fov = fov
      camera.near = near
      camera.updateProjectionMatrix()
      if (document.pointerLockElement) document.exitPointerLock()
      const stage = useStageStore.getState()
      if (controls) controls.enabled = stage.mode === 'explore'
      stage.home?.()
      invalidate()
    }
  }, [camera, scene, controls, invalidate, session])

  // Rooms are named as they're entered, and their lamps taken from the model's light pool.
  const currentZone = useRef<string | null>(null)
  const tapped = useRef<Object3D | null>(null)
  const below = useRef(false)
  const liftKey = useRef('')

  /** The operable thing a tap at `at` (normalised screen coordinates) lands on, if within reach. */
  const pick = useCallback(
    (at: Vector2): Object3D | null => {
    const { walker, collider, targets } = session
    caster.setFromCamera(at, camera)
    const eye = v.set(walker.position.x, walker.position.y + EYE, walker.position.z)
    let best: Object3D | null = null
    let bestT = Infinity
    for (const { node, front } of targets) {
      if (!node.visible) continue
      frontCentre(front, closest)
      if (closest.distanceTo(eye) > REACH + 0.25) continue
      const t = caster.ray.closestPointToPoint(closest, new Vector3()).distanceTo(caster.ray.origin)
      const off = caster.ray.distanceToPoint(closest)
      const size = isButton(node.name) ? 0.07 : 0.3
      if (off > size || t >= bestT) continue
      // Nothing solid in the way but the thing itself.
      ray.copy(caster.ray)
      if (collider.raycast(ray, t - 0.06, node) < t - 0.12) continue
      best = node
      bestT = t
    }
    return best
    },
    [session, camera],
  )

  useEffect(() => {
    const el = gl.domElement
    const { walker, rig } = session
    const turn = (dx: number, dy: number) => {
      rig.looked()
      walker.yaw -= dx * LOOK_SPEED
      walker.pitch = MathUtils.clamp(walker.pitch - dy * LOOK_SPEED, -PITCH, PITCH)
    }
    let dragging: number | null = null
    let lastX = 0
    let lastY = 0
    let press: { x: number; y: number; t: number; moved: number } | null = null
    const down = (e: PointerEvent) => {
      unlockSound()
      press = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }
      // A mouse takes the pointer on its first click, like a game; a finger drags to look.
      if (e.pointerType === 'mouse') {
        if (!document.pointerLockElement) void Promise.resolve(el.requestPointerLock?.()).catch(() => undefined)
      }
      dragging = e.pointerId
      lastX = e.clientX
      lastY = e.clientY
    }
    const move = (e: PointerEvent) => {
      if (press) press.moved += Math.abs(e.movementX) + Math.abs(e.movementY)
      if (document.pointerLockElement === el) turn(e.movementX, e.movementY)
      else if (dragging === e.pointerId) {
        turn((e.clientX - lastX) * 1.6, (e.clientY - lastY) * 1.6)
        lastX = e.clientX
        lastY = e.clientY
      }
    }
    const up = (e: PointerEvent) => {
      if (dragging === e.pointerId) dragging = null
      // A quick, still tap or click presses what is under it (at the centre while the pointer is
      // locked): a lift button, a door, a drawer, if the walker can reach it.
      const p = press
      press = null
      if (!p || e.target !== el || performance.now() - p.t > TAP_MS || p.moved > TAP_PX) return
      const r = el.getBoundingClientRect()
      const locked = document.pointerLockElement === el
      ndc.set(locked ? 0 : ((e.clientX - r.left) / r.width) * 2 - 1, locked ? 0 : -((e.clientY - r.top) / r.height) * 2 + 1)
      tapped.current = pick(ndc)
      if (tapped.current) walkInput.interact = true
    }
    const keyDown = (e: KeyboardEvent) => {
      unlockSound()
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const k = e.code
      if (/^(Key[WASD]|Arrow|Space)/.test(k)) e.preventDefault()
      if (e.repeat) return
      if (k === 'KeyE') walkInput.interact = true
      else if (k === 'Space') walkInput.jump = true
      else if (k === 'KeyV') useWalkStore.getState().toggleView()
      // At a lift: G (or 0) chooses the ground floor; a number, that floor, or the basement of
      // that number on a lift that goes down rather than up (see the frame loop).
      else if (k === 'KeyG' || k === 'Digit0' || k === 'Numpad0') walkInput.liftButton = 'G'
      else if (/^(Digit|Numpad)[1-9]$/.test(k)) walkInput.liftButton = `#${k.slice(-1)}`
      else if (k === 'Escape' && !document.pointerLockElement) useWalkStore.getState().stop()
      keys.current.add(k)
    }
    const keyUp = (e: KeyboardEvent) => keys.current.delete(e.code)
    const blur = () => keys.current.clear()
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', blur)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', blur)
    }
  }, [gl, session, pick])



  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const { walker, collider, targets, rig, leaves } = session
    // The lifts run first: a walker in a car rides it, and the camera with them.
    if (lifts) {
      const y0 = walker.position.y
      lifts.tick(delta, walker.position)
      const rode = walker.position.y - y0
      if (rode) rig.carry(rode)
    }
    setListener(walker.position)
    const k = keys.current
    const held = (...codes: string[]) => (codes.some((c) => k.has(c)) ? 1 : 0)
    const right = MathUtils.clamp(held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft') + walkInput.moveX, -1, 1)
    const forward = MathUtils.clamp(held('KeyW', 'ArrowUp') - held('KeyS', 'ArrowDown') + walkInput.moveY, -1, 1)
    const third = useWalkStore.getState().view === 'third'
    rig.steer(delta, walker, right, forward, third)
    walker.step(delta, right, forward, walkInput.jump)
    walkInput.jump = false

    const p = walker.position
    const speed = Math.hypot(walker.velocity.x, walker.velocity.z)

    // The body faces the way it walks; backing up, it keeps facing away from its direction of travel.
    const heading = speed > 0.15 ? Math.atan2(-walker.velocity.x, -walker.velocity.z) : walker.yaw
    const back = forward < -0.1 && Math.abs(right) < 0.5
    // Reaching for something, the body turns to face it.
    const reachAt = character.current?.reachTarget
    const aim = reachAt && speed < 0.3 ? Math.atan2(-(reachAt.x - p.x), -(reachAt.z - p.z)) : back ? walker.yaw : heading
    const turnBy = MathUtils.euclideanModulo(aim - facing.current + Math.PI, Math.PI * 2) - Math.PI
    facing.current += turnBy * (1 - Math.exp(-10 * delta))
    const turnRate = Math.abs(MathUtils.euclideanModulo(walker.yaw - lastYaw.current + Math.PI, Math.PI * 2) - Math.PI) / Math.max(delta, 1e-3)
    lastYaw.current = walker.yaw

    const figure = character.current
    if (figure) {
      figure.root.position.copy(p)
      figure.root.rotation.y = facing.current
      figure.update({
        speed: back ? -speed : speed,
        turning: speed < 0.1 ? MathUtils.clamp(turnRate / 2 + Math.abs(turnBy) * 2, 0, 1) : 0,
        delta,
        ground: (x, z) => walker.groundAt(x, z, p.y),
      })
    }

    // The camera, with only a trace of head movement.
    const gait = figure?.gait ?? { phase: 0, amount: 0 }
    const bob = Math.cos(gait.phase * 2) * 0.012 * gait.amount
    const sway = Math.sin(gait.phase) * 0.006 * gait.amount
    rig.update(delta, walker, third, bob, sway, camera)
    // Too close to see him properly, the lens would be inside his head: the view passes to his eyes.
    if (figure) figure.root.visible = third && rig.standoff > 0.55

    // What's in reach, a few times a second.
    sense.current -= delta
    if (sense.current <= 0) {
      sense.current = 0.12
      const eye = v.set(p.x, p.y + EYE, p.z)
      const look = rig.look
      let best: Object3D | null = null
      const candidates: { node: Object3D; d: number; score: number; x: number; y: number; z: number }[] = []
      for (const { node, front } of targets) {
        const m = front.matrixWorld.elements
        const g = (front as { geometry?: { boundingSphere?: { center: Vector3 } | null; computeBoundingSphere: () => void } }).geometry
        if (g && !g.boundingSphere) g.computeBoundingSphere()
        const c = g?.boundingSphere?.center
        const lx = c?.x ?? 0
        const ly = c?.y ?? 0
        const lz = c?.z ?? 0
        const x = m[0] * lx + m[4] * ly + m[8] * lz + m[12]
        const y = m[1] * lx + m[5] * ly + m[9] * lz + m[13]
        const z = m[2] * lx + m[6] * ly + m[10] * lz + m[14]
        const dx = x - eye.x
        const dy = y - eye.y
        const dz = z - eye.z
        const d = Math.hypot(dx, dy, dz)
        if (d > REACH) continue
        if (flatTo(dx, dz) > ARM) continue
        const flat = Math.hypot(dx, dz)
        const dot3 = (dx * look.x + dy * look.y + dz * look.z) / Math.max(d, 1e-3)
        const lookFlat = Math.hypot(look.x, look.z)
        const dotFlat = (dx * look.x + dz * look.z) / Math.max(flat * lookFlat, 1e-3)
        // In front of the walker, or looked straight at: an overhead fan needs looking up to.
        if (!(dot3 > 0.55 || (dotFlat > 0.6 && !isSpinner(node.name)))) continue
        candidates.push({ node, d, score: d - dot3 * 0.9, x, y, z })
      }
      candidates.sort((a, b) => a.score - b.score)
      for (const c of candidates.slice(0, 4)) {
        ray.origin.copy(eye)
        ray.direction.set(c.x - eye.x, c.y - eye.y, c.z - eye.z).normalize()
        // Only what can be reached: nothing solid between the walker and it but itself.
        if (collider.raycast(ray, c.d - 0.08, c.node) < c.d - 0.12) continue
        best = c.node
        break
      }
      nearest.current = best
      const prompt = best ? describe(best) : null
      const store = useWalkStore.getState()
      if (prompt?.verb !== store.prompt?.verb || prompt?.label !== store.prompt?.label) store.setPrompt(prompt)

      const zone = area.zoneAt(p.x, p.y, p.z)
      if (zone !== currentZone.current) {
        currentZone.current = zone
        setZone(zone)
        useWalkStore.getState().setRoom(rooms.get(zone) ?? null)
      }
    }

    // The entrance doors slide open as the walker comes near, and close behind.
    for (const l of leaves) {
      const dx = walker.position.x - l.at.x
      const dz = walker.position.z - l.at.z
      const want = Math.hypot(dx, dz) < AUTO_DOOR && Math.abs(walker.position.y - l.at.y) < 2.5 ? 1 : 0
      if (Math.abs(l.open - want) < 1e-3) continue
      // oxlint-disable-next-line react/immutability -- the doors' state is mutated per frame by design
      l.open = MathUtils.damp(l.open, want, 3.2, delta)
      l.node.position.copy(l.closed).addScaledVector(l.slide, l.open * l.open * (3 - 2 * l.open))
    }

    // Down in the basements, the building above stops shading the car park and its lights take over.
    if (basement) {
      const y = walker.position.y
      const next = below.current ? y < ABOVE : y < BELOW
      if (next !== below.current) {
        below.current = next
        if (basement.setBelow(next)) state.gl.shadowMap.needsUpdate = true
        useWalkStore.getState().setBelow(next)
      }
    }
    if (lifts) {
      // The lift the walker rides, for its panel on screen.
      const lift = lifts.liftNear(walker.position)
      const status: LiftStatus | null = lift ? { ...lift.status, floors: lift.levels.map((l) => l.name) } : null
      const key = status ? `${status.floor}|${status.dir}|${status.moving}|${status.lit.join()}` : ''
      if (key !== liftKey.current) {
        liftKey.current = key
        useWalkStore.getState().setLift(status)
      }
      // A button pressed on the screen's panel: the walker presses the real one in the car.
      if (walkInput.liftButton) {
        // A number key names a floor above ground on a lift that serves one, else the basement.
        const raw = walkInput.liftButton
        const cmd = raw.startsWith('#') ? (lift?.levels.some((l) => l.name === raw.slice(1)) ? raw.slice(1) : `B${raw.slice(1)}`) : raw
        const node = lift?.carButton(cmd) ?? null
        // oxlint-disable-next-line react/immutability -- walkInput is the controls' shared, per-frame input
        walkInput.liftButton = null
        if (node) {
          tapped.current = node
          walkInput.interact = true
        }
      }
    }

    if (walkInput.interact) {
      walkInput.interact = false
      const node = tapped.current ?? nearest.current
      tapped.current = null
      const figure = character.current
      if (node) {
        const done = () => {
          operate(node)
          sense.current = 0
        }
        // Seen in third person, the hand goes to it first, and it moves as it is touched. Through
        // the walker's own eyes there is no arm to watch, so it answers at once.
        const front = targets.find((t) => t.node === node)?.front ?? node
        if (third && figure?.ready && figure.root.visible) figure.reach(isSwitch(node.name) ? node.getObjectByName('rocker') ?? front : front, done)
        else done()
      }
    }
    state.invalidate()
  })

  return null
}
