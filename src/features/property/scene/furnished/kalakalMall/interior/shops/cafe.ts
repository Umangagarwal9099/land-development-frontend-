import {
  Box3, BoxGeometry, CylinderGeometry, Group, LatheGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, SphereGeometry, Vector2, Vector3,
  type BufferGeometry, type Material,
} from 'three'
import type { EquipmentInfo } from '../../../../../../../store/info'
import { click } from '../../../basement/sound'
import { centreOf } from '../shell'
import { screen, type CafeMaterials } from './cafeArt'
import { at, mesh, PI, type Shop } from './kit'

/*
 * The café's working equipment, each built as the trade's own kit is and facing local +z (the
 * barista's side): a super-automatic espresso machine with its bean hoppers, touch screen, brew
 * head, drip tray and steam wands; a retail bean grinder; a twin batch brewer over its shuttles;
 * high-speed blenders in their sound enclosures; a nitro cold brew tap; under-counter fridges of
 * milk; the curved pastry case and its bakes; the till with its cash drawer and customer display;
 * cups, lids, sleeves and the syrup rack.
 *
 * What a barista would press, presses: brewing runs the shots into their glasses, the steam wand
 * steams, the grinder grinds, the brewer and the cold brew tap pour, the blender blends (lift its
 * enclosure first, if you like), the till rings an order through. Every piece explains itself
 * when tapped (info_*), and its doors, drawers and lids open.
 */

/* ---------- animation ---------- */

interface Anim {
  t: number
  dur: number
  step: (k: number, dt: number) => void
  done?: () => void
}
const running = new Set<Anim>()

/** Starts (or restarts) an animation of `dur` seconds; `step` gets its progress 0 … 1. */
export function play(a: Omit<Anim, 't'>, key?: Object3D) {
  if (key) {
    const old = key.userData.anim as Anim | undefined
    if (old) running.delete(old)
  }
  const anim = { ...a, t: 0 }
  if (key) key.userData.anim = anim
  running.add(anim)
}

/** Steps the café's running machines; whether any is still running (so frames keep coming). */
export function cafeTick(dt: number) {
  for (const a of running) {
    a.t += dt
    a.step(Math.min(1, a.t / a.dur), dt)
    if (a.t >= a.dur) {
      running.delete(a)
      a.done?.()
    }
  }
  return running.size > 0
}

/* ---------- interaction ---------- */

const HOT = new MeshBasicMaterial({ visible: false })
let ids = 0

/**
 * Makes `target` (built already) explain itself when tapped: an invisible volume round it named
 * info_*, carrying the card. A walker reaches for it at its face towards the shop's middle.
 */
export function info(s: Shop, target: Object3D, card: Omit<EquipmentInfo, 'place'>, pad = 0.03) {
  const [mx, mz] = centreOf(s.u)
  s.g.updateMatrixWorld(true)
  const box = new Box3().setFromObject(target)
  if (box.isEmpty()) return null
  box.expandByScalar(pad)
  const size = box.getSize(new Vector3())
  const c = box.getCenter(new Vector3())
  const hit = new Mesh(new BoxGeometry(size.x, size.y, size.z), HOT)
  hit.position.copy(s.g.worldToLocal(c.clone()))
  hit.name = `info_${s.u.id.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${ids++}`
  hit.userData.info = { ...card, place: `${s.e.level === 0 ? 'Ground Floor' : `Floor ${s.e.level}`} · ${s.u.name} (${s.u.id})` }
  hit.castShadow = false
  hit.receiveShadow = false
  const dx = mx - c.x
  const dz = mz - c.z
  const along = Math.abs(dx) / Math.max(size.x, 0.01) > Math.abs(dz) / Math.max(size.z, 0.01)
  const marker = new Object3D()
  marker.position.set(along ? Math.sign(dx) * (size.x / 2 + 0.05) : 0, Math.min(box.max.y, s.y + 1.1) - c.y, along ? 0 : Math.sign(dz) * (size.z / 2 + 0.05))
  marker.userData.reach = true
  hit.add(marker)
  s.g.add(hit)
  return hit
}

/** A push button (button_*): pressing clicks and runs `press`. */
export function button(p: Object3D, name: string, label: string, verb: string, x: number, y: number, z: number, press: () => void, prefix = 'sbux') {
  const b = new Group()
  b.name = `button_${prefix}_${name}_${ids++}`
  b.position.set(x, y, z)
  b.userData.label = label
  b.userData.verb = verb
  b.userData.press = () => {
    click(b.getWorldPosition(new Vector3()))
    press()
  }
  p.add(b)
  return b
}

/** A group kept whole when the floor merges (live_*), for parts that move or change. */
export function live(p: Object3D, name: string, prefix = 'sbux') {
  const g = new Group()
  g.name = `live_${prefix}_${name}_${ids++}`
  p.add(g)
  return g
}

/* ---------- small makers ---------- */

export function lathe(p: Object3D, pts: [number, number][], mat: Material, x = 0, y = 0, z = 0, seg = 32, cast = true) {
  return mesh(p, new LatheGeometry(pts.map(([r, h]) => new Vector2(r, h)), seg), mat, x, y, z, cast)
}

/** A flat decal (a plane) at local (x, y, z) facing `yaw`. */
export function decal(p: Object3D, mat: Material, w: number, h: number, x: number, y: number, z: number, yaw = 0) {
  const d = mesh(p, new PlaneGeometry(w, h), mat, x, y, z, false)
  d.rotation.y = yaw
  return d
}

/** A cylinder whose base is at its origin, so it fills by scaling y. */
function filler(p: Object3D, r: number, h: number, mat: Material, x: number, y: number, z: number, seg = 16) {
  const geo: BufferGeometry = new CylinderGeometry(r, r, h, seg)
  geo.translate(0, h / 2, 0)
  return mesh(p, geo, mat, x, y, z, false)
}

/** A small round tube between two local points. */
export function tube(p: Object3D, a: [number, number, number], b: [number, number, number], r: number, mat: Material, seg = 10) {
  const va = new Vector3(...a)
  const vb = new Vector3(...b)
  const len = va.distanceTo(vb)
  const m = mesh(p, new CylinderGeometry(r, r, len, seg), mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)
  m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), vb.sub(va).normalize())
  return m
}

/** Screens painted once and shared: each a lit material. */
const screens = new Map<string, MeshStandardMaterial>()
export function screenMat(c: CafeMaterials, key: string, lines: string[], accent?: string, dark = true) {
  let m = screens.get(key)
  if (!m) {
    const t = c.canvas(384, 240, screen(lines, accent, dark))
    m = new MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.85, roughness: 0.25 })
    m.userData.interior = true
    screens.set(key, m)
  }
  return m
}

/** Steam: a few soft puffs that rise, swell and fade from a point, while `k` runs 0 … 1. */
function steamPuffs(c: CafeMaterials, p: Object3D, x: number, y: number, z: number, n = 6) {
  const g = live(p, 'steam')
  g.position.set(x, y, z)
  const puffs = Array.from({ length: n }, (_, i) => {
    const m = mesh(g, new SphereGeometry(0.03, 12, 8), c.steam(0), 0, 0, 0, false)
    m.userData.phase = i / n
    return m
  })
  g.visible = false
  return {
    g,
    step: (k: number) => {
      g.visible = k < 1
      for (const m of puffs) {
        const t = (k * 4 + (m.userData.phase as number)) % 1
        m.position.set(Math.sin(t * 9 + (m.userData.phase as number) * 6) * 0.02, t * 0.28, Math.cos(t * 7) * 0.015)
        m.scale.setScalar(0.6 + t * 2.2)
        ;(m.material as MeshStandardMaterial).opacity = 0.28 * Math.sin(t * PI) * (k < 0.9 ? 1 : (1 - k) * 10)
      }
    },
  }
}

/* ---------- the espresso machine ---------- */

/**
 * A super-automatic espresso machine as the café's bar uses them: a brushed stainless body on
 * feet, two smoked bean hoppers on top, the barista's face with a touch screen, the brew head
 * over a drip tray with two shot glasses, a steam wand either side with its knob; the customer's
 * side in the house green with the siren. Facing +z (the barista); its base at local y = 0.
 */
export function espressoMachine(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, yaw: number, siren: Material) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  const W = 0.42
  const D = 0.56
  const H = 0.52
  const b0 = 0.03
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(g, 0.02, 0.022, b0, c.rubber, sx * 0.17, b0 / 2, sz * 0.22, 12)
  k.soft(g, W, H, D, 0.03, c.brushed, 0, b0 + H / 2, 0)
  k.box(g, W - 0.01, 0.02, D - 0.01, c.blackGloss, 0, b0 + H + 0.01, 0)
  // The customer's side: a green panel framed in steel, the siren on it.
  k.box(g, W - 0.05, H - 0.1, 0.008, c.greenBody, 0, b0 + H / 2 + 0.01, -D / 2 - 0.003)
  decal(g, siren, 0.16, 0.16, 0, b0 + H / 2 + 0.03, -D / 2 - 0.0085, PI)
  // Vents down each side.
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) k.box(g, 0.004, 0.006, 0.2, c.blackMatte, sx * (W / 2 + 0.001), b0 + 0.12 + i * 0.03, -0.1, false)
  // Two bean hoppers: smoked frustums with beans in them, black lids.
  for (const sx of [-1, 1]) {
    const hop = mesh(g, new CylinderGeometry(0.09, 0.068, 0.17, 4, 1), c.smokePlastic, sx * 0.1, b0 + H + 0.02 + 0.085, -0.1, false)
    hop.rotation.y = PI / 4
    const beans = mesh(g, new CylinderGeometry(0.068, 0.062, 0.08, 4, 1), c.beans, sx * 0.1, b0 + H + 0.02 + 0.045, -0.1, false)
    beans.rotation.y = PI / 4
    const lid = mesh(g, new CylinderGeometry(0.094, 0.094, 0.014, 4, 1), c.blackGloss, sx * 0.1, b0 + H + 0.02 + 0.177, -0.1)
    lid.rotation.y = PI / 4
  }
  // The barista's face: the control fascia and screen, the brew alcove.
  const fz = D / 2 + 0.003
  k.box(g, W - 0.04, 0.15, 0.008, c.blackGloss, 0, b0 + H - 0.1, fz)
  k.box(g, 0.28, 0.26, 0.006, c.blackMatte, 0, b0 + 0.22, fz)
  // The brew head over the alcove, its twin spouts.
  k.soft(g, 0.3, 0.035, 0.11, 0.01, c.polished, 0, b0 + 0.375, fz + 0.045)
  const spouts: Mesh[] = []
  for (const sx of [-1, 1]) spouts.push(k.cyl(g, 0.007, 0.005, 0.03, c.polished, sx * 0.028, b0 + 0.345, fz + 0.075, 12))
  // Drip tray with its grille, two shot glasses on it.
  k.soft(g, 0.32, 0.03, 0.15, 0.008, c.polished, 0, b0 + 0.02, fz + 0.04)
  for (let i = 0; i < 9; i++) k.box(g, 0.006, 0.004, 0.12, c.blackMatte, -0.12 + i * 0.03, b0 + 0.037, fz + 0.045, false)
  const glassY = b0 + 0.039
  const fills: Mesh[] = []
  const streams: Mesh[] = []
  const flow = live(g, 'shots')
  for (const sx of [-1, 1]) {
    lathe(g, [[0.001, 0], [0.022, 0], [0.024, 0.065], [0.0225, 0.065], [0.0205, 0.004], [0.001, 0.004]], c.clearPlastic, sx * 0.028, glassY, fz + 0.075, 20, false)
    const f = filler(flow, 0.02, 0.048, c.espresso, sx * 0.028, glassY + 0.004, fz + 0.075)
    f.scale.y = 0.02
    fills.push(f)
    const st = mesh(flow, new CylinderGeometry(0.0022, 0.0022, 0.27, 6), c.espresso, sx * 0.028, glassY + 0.17, fz + 0.075, false)
    st.visible = false
    streams.push(st)
  }
  // The steam wands, one each side, on swivels; their knobs on the fascia.
  const steams: ReturnType<typeof steamPuffs>[] = []
  const knobs: Group[] = []
  const pitchers: Mesh[] = []
  for (const sx of [-1, 1]) {
    const base: [number, number, number] = [sx * 0.19, b0 + 0.42, fz + 0.03]
    const tip: [number, number, number] = [sx * 0.25, b0 + 0.16, fz + 0.12]
    k.cyl(g, 0.016, 0.016, 0.03, c.polished, base[0], base[1] + 0.005, base[2], 16)
    tube(g, base, tip, 0.006, c.polished)
    k.cyl(g, 0.008, 0.006, 0.025, c.polished, tip[0], tip[1] - 0.01, tip[2], 10)
    const st = steamPuffs(c, g, tip[0], tip[1] - 0.02, tip[2])
    steams.push(st)
    // The pitcher under the wand, on the counter beside the machine.
    pitchers.push(lathe(g, [[0.001, 0], [0.04, 0], [0.042, 0.06], [0.037, 0.11], [0.039, 0.115], [0.036, 0.115], [0.034, 0.11], [0.039, 0.06], [0.037, 0.004], [0.001, 0.004]], c.polished, sx * 0.29, 0, D / 2 - 0.06, 24))
    const knob = button(g, `steam${sx}`, 'Steam wand', 'Steam milk', sx * 0.17, b0 + H - 0.1, fz + 0.012, () =>
      play({
        dur: 3.2,
        step: (t) => st.step(t),
      }, knob))
    k.cyl(knob, 0.018, 0.018, 0.022, c.blackGloss, 0, 0, 0.01, 20).rotation.x = PI / 2
    k.box(knob, 0.004, 0.026, 0.004, c.polished, 0, 0, 0.022, false)
    knobs.push(knob)
  }
  void pitchers
  // The touch screen: tapped, it grinds and pulls a double shot.
  const idle = screenMat(c, 'esp_idle', ['Espresso', '[Single]', '[Double]', '[Ristretto]', '[Long shot]'])
  const brew = screenMat(c, 'esp_brew', ['Brewing · Double', 'Grinding 18 g', 'Extracting · 25 s', 'Signature Espresso'], '#b8692b')
  const ready = screenMat(c, 'esp_ready', ['Ready', 'Double shot · 60 ml', 'Signature Espresso', 'Take the shots'], '#2f7d4f')
  const panel = button(g, 'brew', 'Espresso machine', 'Brew a double shot', 0, b0 + H - 0.1, fz + 0.005, () => {
    for (const f of fills) f.scale.y = 0.02
    play({
      dur: 4.0,
      step: (t) => {
        scr.material = t < 0.95 ? brew : ready
        const pour = t > 0.18 && t < 0.88
        for (const st of streams) {
          st.visible = pour
          st.scale.x = st.scale.z = 0.8 + Math.sin(t * 90) * 0.2
        }
        const fill = Math.min(1, Math.max(0.02, (t - 0.2) / 0.65))
        for (const f of fills) f.scale.y = fill
      },
      done: () => {
        for (const st of streams) st.visible = false
      },
    }, panel)
  })
  const scr = decal(panel, idle, 0.17, 0.106, -0.07, 0, 0.0)
  scr.userData.front = true
  // Small hard keys beside the screen.
  for (let i = 0; i < 3; i++) k.cyl(panel, 0.009, 0.009, 0.006, c.polished, 0.08 + i * 0.03, -0.03, 0.003, 12).rotation.x = PI / 2
  return g
}

/* ---------- the grinder ---------- */

/** A retail bean grinder: a cast body on a square foot, a clear hopper of beans, the chute and bag hook, a dial and the start key. */
export function grinder(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, yaw: number) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.soft(g, 0.24, 0.03, 0.32, 0.01, c.blackMatte, 0, 0.015, 0)
  // The cast body: a rounded column, the motor housing over it reaching forward to the chute.
  const body = mesh(g, new CylinderGeometry(0.105, 0.11, 0.36, 40), c.brushed, 0, 0.03 + 0.18, -0.02)
  body.scale.z = 1.15
  const head = mesh(g, new CylinderGeometry(0.11, 0.11, 0.12, 40), c.brushed, 0, 0.45, -0.01)
  head.scale.z = 1.25
  k.soft(g, 0.09, 0.1, 0.12, 0.02, c.brushed, 0, 0.36, 0.08)
  // Hopper, beans in it (which turn while it grinds).
  lathe(g, [[0.03, 0], [0.11, 0.14], [0.115, 0.15], [0.105, 0.15], [0.026, 0.006]], c.clearPlastic, 0, 0.51, -0.02, 28, false)
  const turn = live(g, 'beans')
  turn.position.set(0, 0.51, -0.02)
  lathe(turn, [[0.001, 0.0], [0.032, 0.0], [0.09, 0.1], [0.001, 0.1]], c.beans, 0, 0.004, 0, 14, false)
  for (let i = 0; i < 18; i++) {
    const a = i * 2.4
    const r = 0.03 + (i % 5) * 0.012
    const b = k.sphere(turn, 0.008, c.beans, Math.cos(a) * r, 0.104, Math.sin(a) * r)
    b.scale.set(1, 0.6, 1.4)
  }
  lathe(g, [[0.11, 0], [0.118, 0], [0.118, 0.02], [0.11, 0.02]], c.blackGloss, 0, 0.66, -0.02, 28)
  // The chute, the bag hook under it, the grind dial on the side.
  k.soft(g, 0.06, 0.05, 0.08, 0.01, c.polished, 0, 0.33, 0.12)
  k.box(g, 0.08, 0.008, 0.06, c.polished, 0, 0.1, 0.14)
  const dial = k.cyl(g, 0.05, 0.05, 0.02, c.blackGloss, 0.11, 0.42, 0.0, 32)
  dial.rotation.z = PI / 2
  for (let i = 0; i < 12; i++) k.box(g, 0.004, 0.012, 0.002, c.polished, 0.122, 0.42 + Math.cos(i * 0.52) * 0.042, Math.sin(i * 0.52) * 0.042, false)
  const grounds = live(g, 'grounds')
  const fall = mesh(grounds, new CylinderGeometry(0.012, 0.018, 0.2, 10), c.beans, 0, 0.21, 0.13, false)
  grounds.visible = false
  const key = button(g, 'grind', 'Bean grinder', 'Grind beans', 0, 0.2, 0.103, () =>
    play({
      dur: 3.0,
      step: (t, dt) => {
        turn.rotation.y += dt * 9
        grounds.visible = t < 0.95
        fall.scale.x = fall.scale.z = 0.8 + Math.sin(t * 70) * 0.25
      },
      done: () => (grounds.visible = false),
    }, key))
  k.box(key, 0.05, 0.03, 0.01, c.blackGloss, 0, 0, 0.0).userData.front = true
  k.box(key, 0.01, 0.01, 0.004, c.greenBody, 0, 0, 0.006, false)
  return g
}

/* ---------- the batch brewer ---------- */

/** A twin batch brewer over its two shuttles: the head with its spray housings, two brew baskets, the controls. */
export function batchBrewer(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, yaw: number) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  const W = 0.62
  k.box(g, W, 0.03, 0.46, c.brushed, 0, 0.015, 0)
  for (const sx of [-1, 1]) k.box(g, 0.06, 0.8, 0.46, c.brushed, sx * (W / 2 - 0.03), 0.4, 0)
  k.box(g, 0.06, 0.8, 0.46, c.brushed, 0, 0.4, -0.0)
  k.soft(g, W, 0.24, 0.47, 0.015, c.brushed, 0, 0.82, 0)
  k.box(g, W - 0.04, 0.6, 0.02, c.blackMatte, 0, 0.42, -0.22)
  // Control panel: an LCD and two brew keys.
  k.box(g, W - 0.1, 0.09, 0.006, c.blackGloss, 0, 0.86, 0.238)
  const lcdIdle = screenMat(c, 'batch_idle', ['Batch brewer', 'Pike Place® Roast', 'Ready · 90.5 °C', ''], '#333', true)
  const lcdBrew = screenMat(c, 'batch_brew', ['Brewing', 'Pike Place® Roast', '1.9 L · 4:30 left', ''], '#b8692b', true)
  const lcd = decal(g, lcdIdle, 0.14, 0.07, 0, 0.86, 0.2415)
  const pours: Group[] = []
  for (const sx of [-1, 1]) {
    const bx = sx * 0.15
    // Brew basket under the head, its long handle out front.
    lathe(g, [[0.02, 0], [0.1, 0.09], [0.105, 0.1], [0.09, 0.1], [0.016, 0.006]], c.blackMatte, bx, 0.6, 0, 24)
    k.box(g, 0.03, 0.02, 0.14, c.blackMatte, bx, 0.69, 0.16)
    // The shuttle: a steel urn with a sight glass and a spigot.
    lathe(g, [[0.001, 0], [0.1, 0], [0.105, 0.02], [0.105, 0.38], [0.09, 0.4], [0.03, 0.42], [0.03, 0.44], [0.001, 0.44]], c.brushed, bx, 0.03, 0, 28)
    k.box(g, 0.012, 0.26, 0.012, c.clearPlastic, bx + 0.05, 0.22, 0.1, false)
    k.box(g, 0.008, 0.22, 0.008, c.espresso, bx + 0.05, 0.2, 0.1, false)
    k.cyl(g, 0.012, 0.012, 0.05, c.blackMatte, bx, 0.1, 0.12, 12).rotation.x = PI / 2
    const pour = live(g, 'batchpour')
    mesh(pour, new CylinderGeometry(0.004, 0.004, 0.12, 6), c.espresso, bx, 0.53, 0, false)
    pour.visible = false
    pours.push(pour)
  }
  const key = button(g, 'batch', 'Batch brewer', 'Brew a batch', 0.22, 0.86, 0.242, () =>
    play({
      dur: 4.5,
      step: (t) => {
        lcd.material = t < 0.97 ? lcdBrew : lcdIdle
        for (const p2 of pours) p2.visible = t > 0.1 && t < 0.92
      },
    }, key))
  for (const dx of [-0.02, 0.02]) k.cyl(key, 0.012, 0.012, 0.008, c.greenBody, dx, 0, 0.002, 16).rotation.x = PI / 2
  return g
}

/* ---------- the blender ---------- */

/**
 * A high-speed blender in its sound enclosure: a black base with its keys, the jar with a
 * Frappuccino® in it, a clear hood hinged at the back that lifts (door_), the blend key.
 */
export function blender(s: Shop, c: CafeMaterials, p: Object3D, name: string, x: number, y: number, z: number, yaw: number, drink: Material) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.soft(g, 0.24, 0.16, 0.26, 0.02, c.blackMatte, 0, 0.08, 0)
  k.box(g, 0.2, 0.02, 0.22, c.blackGloss, 0, 0.17, 0)
  // The jar: a squared, tapering clear jar on its pad, the drink whirling in it, the lid.
  const jar = mesh(g, new CylinderGeometry(0.075, 0.058, 0.24, 4, 1, true), c.clearPlastic, 0, 0.3, 0, false)
  jar.rotation.y = PI / 4
  const whirl = live(g, 'blend')
  whirl.position.set(0, 0.19, 0)
  const body = mesh(whirl, new CylinderGeometry(0.066, 0.054, 0.14, 4, 1), drink, 0, 0.07, 0, false)
  body.rotation.y = PI / 4
  k.cyl(g, 0.078, 0.078, 0.02, c.blackMatte, 0, 0.43, 0, 4).rotation.y = PI / 4
  k.box(g, 0.02, 0.16, 0.03, c.blackMatte, 0.085, 0.31, 0)
  // The hood: clear acrylic on a black frame, hinged at the top of the back.
  const hood = new Group()
  hood.name = `door_sbux_hood_${name}`
  hood.userData.label = 'Blender sound enclosure'
  hood.userData.axis = 'x'
  hood.userData.openAngle = -1.35
  hood.position.set(0, 0.5, -0.13)
  g.add(hood)
  const hw = 0.26
  const hh = 0.33
  const hd = 0.27
  k.box(hood, hw, 0.012, hd, c.clearPlastic, 0, 0, hd / 2, false)
  k.box(hood, hw, hh, 0.006, c.clearPlastic, 0, -hh / 2, hd, false).userData.front = true
  for (const sx of [-1, 1]) k.box(hood, 0.006, hh, hd, c.clearPlastic, sx * hw / 2, -hh / 2, hd / 2, false)
  k.box(hood, hw + 0.01, 0.02, 0.02, c.blackMatte, 0, -hh, hd)
  k.box(hood, hw + 0.01, 0.016, 0.016, c.blackMatte, 0, 0.0, 0.01)
  // Back of the enclosure, fixed.
  k.box(g, hw, hh + 0.02, 0.008, c.clearPlastic, 0, 0.5 - hh / 2, -0.13, false)
  const key = button(g, `blend_${name}`, 'Blender', 'Blend', 0, 0.09, 0.131, () =>
    play({
      dur: 2.6,
      step: (t, dt) => {
        whirl.rotation.y += dt * 30
        whirl.position.y = 0.19 + Math.sin(t * 60) * 0.003
        body.scale.set(1 + Math.sin(t * PI) * 0.06, 1 + Math.sin(t * PI) * 0.25, 1 + Math.sin(t * PI) * 0.06)
      },
    }, key))
  k.box(key, 0.12, 0.04, 0.006, c.blackGloss, 0, 0, 0).userData.front = true
  for (let i = 0; i < 3; i++) k.cyl(key, 0.007, 0.007, 0.004, i === 1 ? c.greenBody : c.polished, -0.035 + i * 0.035, 0, 0.004, 12).rotation.x = PI / 2
  return g
}

/* ---------- the nitro cold brew tap ---------- */

/** A two-tap tower for cold brew and nitro cold brew: a steel column, a crossbar, black tap handles, a drip tray. */
export function coldBrewTap(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, yaw: number) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.soft(g, 0.32, 0.025, 0.16, 0.008, c.polished, 0, 0.0125, 0.06)
  for (let i = 0; i < 7; i++) k.box(g, 0.004, 0.004, 0.12, c.blackMatte, -0.12 + i * 0.04, 0.027, 0.06, false)
  k.cyl(g, 0.035, 0.04, 0.42, c.brushed, 0, 0.21, -0.05, 24)
  const bar = k.cyl(g, 0.03, 0.03, 0.3, c.brushed, 0, 0.42, -0.05, 24)
  bar.rotation.z = PI / 2
  const streams: Mesh[] = []
  const pour = live(g, 'tap')
  for (const sx of [-1, 1]) {
    k.cyl(g, 0.012, 0.012, 0.06, c.polished, sx * 0.1, 0.42, -0.02, 12).rotation.x = PI / 2
    k.cyl(g, 0.01, 0.008, 0.05, c.polished, sx * 0.1, 0.39, 0.01, 12)
    // Only the nitro tap (the right) pours at a press: a cascade the colour of its crema.
    if (sx > 0) streams.push(mesh(pour, new CylinderGeometry(0.004, 0.004, 0.33, 6), c.crema, sx * 0.1, 0.2, 0.01, false))
    const handle = k.soft(g, 0.026, 0.13, 0.026, 0.008, c.blackGloss, sx * 0.1, 0.52, 0.0)
    void handle
  }
  pour.visible = false
  const lever = button(g, 'coldbrew', 'Cold brew tap', 'Pour a nitro cold brew', 0.1, 0.52, 0.0, () =>
    play({
      dur: 2.6,
      step: (t) => {
        pour.visible = t < 0.95
        lever.rotation.x = t < 0.95 ? 0.5 : 0
      },
      done: () => (lever.rotation.x = 0),
    }, lever))
  k.soft(lever, 0.03, 0.14, 0.03, 0.008, c.blackGloss, 0, 0.0, 0.0).userData.front = true
  return g
}

/* ---------- refrigeration ---------- */

/** An under-counter fridge `w` wide: a steel cabinet, a door (door_) that opens on its stock of milk. */
export function fridge(s: Shop, c: CafeMaterials, p: Object3D, name: string, x: number, z: number, yaw: number, w: number, h: number, hinge: 1 | -1 = -1) {
  const { k } = s.e
  const g = at(p, x, s.y, z, yaw)
  const d = 0.6
  k.box(g, w, 0.1, d - 0.05, c.blackMatte, 0, 0.05, -0.02)
  k.box(g, w, h - 0.1, 0.02, c.brushed, 0, 0.1 + (h - 0.1) / 2, -d / 2 + 0.01)
  for (const sx of [-1, 1]) k.box(g, 0.02, h - 0.1, d, c.brushed, sx * (w / 2 - 0.01), 0.1 + (h - 0.1) / 2, 0)
  k.box(g, w, 0.02, d, c.brushed, 0, h - 0.01, 0)
  // The lining and shelves, the stock.
  k.box(g, w - 0.04, 0.01, d - 0.06, c.cupPaper, 0, 0.11, 0)
  k.box(g, w - 0.04, h - 0.14, 0.005, c.cupPaper, 0, 0.1 + (h - 0.12) / 2, -d / 2 + 0.025, false)
  const shelfY = 0.1 + (h - 0.1) / 2
  for (let i = 0; i < 9; i++) k.box(g, 0.004, 0.004, d - 0.08, c.polished, -w / 2 + 0.06 + i * ((w - 0.12) / 8), shelfY, 0, false)
  for (let row = 0; row < 2; row++) {
    const yy = row ? shelfY + 0.004 : 0.115
    const n = Math.floor((w - 0.06) / 0.12)
    for (let i = 0; i < n; i++) {
      const jx = -w / 2 + 0.08 + i * 0.12
      if ((i + row) % 3 === 2) {
        // An oat milk carton.
        k.box(g, 0.09, 0.24, 0.06, c.wrap, jx, yy + 0.12, 0.04)
        k.box(g, 0.092, 0.08, 0.062, c.wheat, jx, yy + 0.08, 0.04, false)
        k.cyl(g, 0.014, 0.014, 0.014, c.lidWhite, jx + 0.02, yy + 0.247, 0.04, 10)
      } else {
        // A litre jug of milk: the white bottle, its cap (blue for whole, green for semi), a label.
        k.soft(g, 0.09, 0.2, 0.09, 0.02, c.milk, jx, yy + 0.1, 0.04)
        k.cyl(g, 0.025, 0.03, 0.03, c.milk, jx, yy + 0.215, 0.04, 14)
        k.cyl(g, 0.018, 0.018, 0.016, row ? c.greenBody : c.blueberry, jx, yy + 0.238, 0.04, 14)
        k.box(g, 0.092, 0.07, 0.092, c.cream, jx, yy + 0.09, 0.04, false)
      }
    }
  }
  // The door, hinged at one side, its full-height pull.
  const door = new Group()
  door.name = `door_sbux_fridge_${name}`
  door.userData.label = 'Fridge door'
  door.userData.openAngle = hinge * 1.6
  door.position.set(hinge * (w / 2), 0.1, d / 2)
  g.add(door)
  const leafW = w - 0.004
  const dir = -hinge
  const leaf = k.box(door, leafW, h - 0.11, 0.035, c.brushed, dir * leafW / 2, (h - 0.11) / 2, 0.0175)
  leaf.userData.front = true
  k.box(door, leafW - 0.04, 0.012, 0.004, c.rubber, dir * leafW / 2, h - 0.13, 0.036, false)
  k.box(door, 0.02, h - 0.3, 0.03, c.polished, dir * (leafW - 0.06), (h - 0.11) / 2, 0.05)
  // A little thermometer display.
  k.box(door, 0.05, 0.02, 0.003, c.blackGloss, dir * 0.08, h - 0.17, 0.036, false)
  s.e.shade.rect(x, s.y + 0.012, z, w, d, yaw, 0.35)
  return g
}

/* ---------- the pastry case ---------- */

/** A croissant: a curved roll of layered dough, its ends tapering. */
function croissant(p: Object3D, c: CafeMaterials, x: number, y: number, z: number, yaw: number) {
  const g = at(p, x, y, z, yaw)
  for (let i = -3; i <= 3; i++) {
    const t = i / 3
    const a = t * 0.9
    const r = 0.028 * (1 - Math.abs(t) * 0.55)
    const seg = mesh(g, new SphereGeometry(r, 12, 8), i % 2 ? c.pastryDark : c.pastry, Math.sin(a) * 0.06, r * 0.75, Math.cos(a) * 0.06 - 0.06, false)
    seg.scale.set(1.25, 0.8, 1.1)
  }
  return g
}

/** A muffin: a fluted paper case, the domed top, berries in it. */
function muffin(p: Object3D, c: CafeMaterials, x: number, y: number, z: number, top: Material, berries = false) {
  const g = at(p, x, y, z, 0)
  mesh(g, new CylinderGeometry(0.034, 0.028, 0.045, 18), c.muffinCase, 0, 0.0225, 0, false)
  const dome = mesh(g, new SphereGeometry(0.042, 18, 10, 0, PI * 2, 0, PI / 2), top, 0, 0.044, 0, false)
  dome.scale.y = 0.75
  if (berries) for (let i = 0; i < 5; i++) mesh(g, new SphereGeometry(0.006, 6, 5), c.blueberry, Math.cos(i * 1.3) * 0.025, 0.065, Math.sin(i * 1.3) * 0.025, false)
  return g
}

/** A slice of layered cake, wedge-shaped, frosted. */
function cakeSlice(s: Shop, p: Object3D, c: CafeMaterials, x: number, y: number, z: number, yaw: number, sponge: Material) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  const geo = new CylinderGeometry(0.11, 0.11, 0.07, 3, 1, false, -0.28, 0.56)
  for (let i = 0; i < 3; i++) {
    const layer = mesh(g, geo, i % 2 ? c.cream : sponge, 0, 0.012 + i * 0.024, -0.07, false)
    layer.scale.y = 0.3
  }
  k.box(g, 0.015, 0.012, 0.015, c.redVelvet, 0, 0.08, -0.04, false)
  return g
}

/** Small things on a tray: a price card standing on the deck. */
function priceCard(s: Shop, p: Object3D, c: CafeMaterials, x: number, y: number, z: number) {
  const card = s.e.k.box(p, 0.06, 0.035, 0.002, c.cupPaper, x, y + 0.0175, z, false)
  card.rotation.x = -0.25
}

/**
 * The pastry case, floor-standing in the counter line: a walnut-boarded base, a refrigerated
 * display with a curved glass front, two lit tiers of bakes, sliding glass doors at the back
 * (drawer_) for the staff. Its customer side faces +z; `len` long.
 */
export function pastryCase(s: Shop, c: CafeMaterials, p: Object3D, x: number, z: number, yaw: number, len: number, led: Material) {
  const { k, lux } = s.e
  const g = at(p, x, s.y, z, yaw)
  const D = 0.72
  const base = 0.9
  k.box(g, len - 0.02, 0.1, D - 0.1, c.blackMatte, 0, 0.05, -0.03)
  k.box(g, len, base - 0.1, 0.02, c.walnutBoards, 0, 0.1 + (base - 0.1) / 2, D / 2 - 0.01)
  k.box(g, len, base - 0.1, D - 0.02, c.blackMatte, 0, 0.1 + (base - 0.1) / 2, -0.01)
  k.box(g, len + 0.02, 0.04, D + 0.02, c.oak, 0, base + 0.02, 0)
  // The deck and the upper tier, lit along their fronts.
  const deck = base + 0.04
  k.box(g, len - 0.06, 0.01, D - 0.16, c.cupPaper, 0, deck + 0.005, -0.03)
  k.box(g, len - 0.06, 0.008, 0.3, s.m.shelfGlass, 0, deck + 0.2, -0.13, false)
  k.box(g, len - 0.06, 0.012, 0.012, c.brushed, 0, deck + 0.2, 0.02, false)
  for (const sx of [-1, 1]) k.box(g, 0.012, 0.2, 0.012, c.brushed, sx * (len / 2 - 0.05), deck + 0.1, 0.02, false)
  k.box(g, len - 0.1, 0.006, 0.01, led, 0, deck + 0.192, 0.01, false)
  k.box(g, len - 0.1, 0.006, 0.01, led, 0, deck + 0.44, 0.0, false)
  // The curved front glass, a quarter round from the deck's front edge to the canopy.
  const R = 0.36
  const front = mesh(g, new CylinderGeometry(R, R, len - 0.02, 32, 1, true, 0, PI / 2), c.clearPlastic, 0, deck + 0.08, D / 2 - R - 0.02, false)
  front.rotation.z = PI / 2
  front.rotation.y = 0
  front.userData.front = true
  // End glasses and a steel canopy over the top, the rear frame.
  for (const sx of [-1, 1]) k.box(g, 0.01, 0.44, D - 0.06, c.clearPlastic, sx * (len / 2 - 0.005), deck + 0.22, -0.02, false)
  k.box(g, len, 0.03, 0.42, c.brushed, 0, deck + 0.46, -0.14)
  k.box(g, len, 0.012, 0.012, c.brushed, 0, deck + 0.08, D / 2 - 0.02, false)
  // Sliding doors at the back, each a pane in a slim frame.
  const half = (len - 0.04) / 2
  for (const [i, sx] of [[0, -1], [1, 1]] as const) {
    const leaf = new Group()
    leaf.name = `drawer_sbux_case_${i}`
    leaf.userData.label = 'Pastry case door'
    leaf.userData.slide = [-sx * (half - 0.04), 0, 0]
    leaf.position.set(sx * half / 2, deck + 0.22, -D / 2 + 0.03 + i * 0.015)
    g.add(leaf)
    k.box(leaf, half, 0.42, 0.006, c.clearPlastic, 0, 0, 0, false).userData.front = true
    k.box(leaf, half, 0.02, 0.012, c.brushed, 0, -0.2, 0)
    k.box(leaf, half, 0.02, 0.012, c.brushed, 0, 0.2, 0)
    k.box(leaf, 0.012, 0.1, 0.02, c.blackMatte, sx * (half / 2 - 0.05), 0, -0.01)
  }
  // The bakes: on the deck croissants and muffins, cake slices and loaves; on the tier cookies and cake pops.
  const n = Math.floor((len - 0.16) / 0.25)
  for (let i = 0; i < n; i++) {
    const ux = -len / 2 + 0.16 + i * 0.25
    const tray = k.box(g, 0.22, 0.008, 0.3, c.blackGloss, ux, deck + 0.014, 0.04, false)
    void tray
    const ty = deck + 0.018
    switch (i % 5) {
      case 0:
        croissant(g, c, ux - 0.04, ty, 0.12, 0.3)
        croissant(g, c, ux + 0.05, ty, 0.0, -0.2)
        croissant(g, c, ux - 0.03, ty, -0.06, 0.9)
        break
      case 1:
        for (const [mx, mz] of [[-0.05, 0.1], [0.05, 0.1], [-0.05, 0.0], [0.05, 0.0], [0.0, -0.08]]) muffin(g, c, ux + mx, ty, mz, c.pastry, true)
        break
      case 2:
        for (const [cx2, cz] of [[-0.05, 0.08], [0.05, 0.08], [0.0, -0.04]]) cakeSlice(s, g, c, ux + cx2, ty, cz, 0.3, c.chocolate)
        break
      case 3:
        // Banana bread, sliced.
        for (let j = 0; j < 4; j++) k.soft(g, 0.1, 0.07, 0.018, 0.006, j % 2 ? c.pastryDark : c.bread, ux, ty + 0.035, 0.12 - j * 0.05)
        break
      default:
        for (const [mx, mz] of [[-0.05, 0.08], [0.05, 0.08], [0.0, -0.02]]) muffin(g, c, ux + mx, ty, mz, c.chocolate)
    }
    priceCard(s, g, c, ux, ty, 0.2)
    // The tier: cookies standing in a row, cake pops on sticks.
    const t2 = deck + 0.205
    if (i % 2) {
      for (let j = 0; j < 4; j++) {
        const ck = k.cyl(g, 0.038, 0.038, 0.012, j % 2 ? c.pastryDark : c.pastry, ux - 0.075 + j * 0.05, t2 + 0.04, -0.13, 18)
        ck.rotation.x = PI / 2 - 0.3
      }
    } else {
      k.box(g, 0.16, 0.03, 0.06, c.cupPaper, ux, t2 + 0.015, -0.13)
      for (let j = 0; j < 4; j++) {
        k.cyl(g, 0.0025, 0.0025, 0.08, c.cupPaper, ux - 0.06 + j * 0.04, t2 + 0.07, -0.13, 6)
        k.sphere(g, 0.02, j % 2 ? c.redVelvet : c.cream, ux - 0.06 + j * 0.04, t2 + 0.12, -0.13)
      }
    }
  }
  void lux
  s.e.shade.rect(x, s.y + 0.012, z, len, D, yaw, 0.4)
  return g
}

/* ---------- the till ---------- */

/**
 * The till on the counter: the staff's touch screen on a swivel stand (tapped, it rings the
 * order through), the customer display on its back, a receipt printer, the card terminal on the
 * customer's side. Facing +z (the barista).
 */
export function till(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, yaw: number) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  k.cyl(g, 0.09, 0.1, 0.02, c.blackMatte, 0, 0.01, 0, 28)
  k.cyl(g, 0.018, 0.018, 0.22, c.brushed, 0, 0.13, -0.02, 16)
  const head = at(g, 0, 0.3, 0.0, 0)
  head.rotation.x = -0.35
  k.soft(head, 0.36, 0.25, 0.03, 0.01, c.blackGloss, 0, 0, 0)
  const idleStaff = screenMat(c, 'till_idle', ['New order', '[Caffè Latte]', '[Cappuccino]', '[Pumpkin Spice]', '[Cold Brew]', '[Croissant]', '[Muffin]'], '#00704a', false)
  const rungStaff = screenMat(c, 'till_rung', ['Order #214 · Paid', 'Grande Pumpkin Spice Latte  ₹ 395', 'Butter Croissant  ₹ 245', 'Total ₹ 640 · Card'], '#2f7d4f', false)
  const idleCust = screenMat(c, 'cust_idle', ['Welcome to Starbucks', 'Order at the counter', 'Pick up at the hand-off', ''], '#00704a')
  const rungCust = screenMat(c, 'cust_rung', ['Total ₹ 640', 'Tap, insert or swipe', 'Thank you!', ''], '#00704a')
  // The customer display on the back of the stand, facing the customer.
  const cust = at(g, 0, 0.36, -0.07, PI)
  k.soft(cust, 0.2, 0.13, 0.02, 0.006, c.blackGloss, 0, 0, 0)
  const custScr = decal(cust, idleCust, 0.18, 0.112, 0, 0, 0.0105)
  let rung = false
  const tap = button(head, 'till', 'Till', 'Ring up an order', 0, 0, 0.016, () => {
    rung = !rung
    staffScr.material = rung ? rungStaff : idleStaff
    custScr.material = rung ? rungCust : idleCust
  })
  const staffScr = decal(tap, idleStaff, 0.33, 0.215, 0, 0, 0)
  staffScr.userData.front = true
  // Receipt printer beside it, a curl of paper.
  k.soft(g, 0.14, 0.12, 0.18, 0.015, c.blackMatte, 0.27, 0.06, -0.02)
  k.box(g, 0.08, 0.002, 0.06, c.cupPaper, 0.27, 0.125, 0.07, false).rotation.x = -0.4
  return g
}

/** A cash drawer under the counter's top on the staff side (drawer_), its notes and coins inside. Facing +z (the barista). */
export function cashDrawer(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, yaw: number) {
  const { k, lux } = s.e
  const g = at(p, x, y, z, yaw)
  k.box(g, 0.46, 0.11, 0.44, c.blackMatte, 0, 0, -0.22)
  const drawer = new Group()
  drawer.name = 'drawer_sbux_cash'
  drawer.userData.label = 'Cash drawer'
  drawer.userData.slide = [0, 0, 0.32]
  drawer.position.set(0, 0, 0.005)
  g.add(drawer)
  k.box(drawer, 0.44, 0.1, 0.015, c.blackGloss, 0, 0, 0).userData.front = true
  k.box(drawer, 0.1, 0.012, 0.012, c.polished, 0, 0.0, 0.012, false)
  const box = new Group()
  box.name = 'contents'
  drawer.add(box)
  k.box(box, 0.42, 0.06, 0.36, c.blackMatte, 0, -0.01, -0.19)
  const notes = ['#c9b07a', '#a9c3a0', '#c99aa8', '#9fb2c9']
  for (let i = 0; i < 4; i++) k.box(box, 0.085, 0.018, 0.16, c.std({ color: notes[i], roughness: 0.9 }, 0.02), -0.15 + i * 0.1, 0.03, -0.13, false)
  for (let i = 0; i < 5; i++) k.cyl(box, 0.03, 0.03, 0.01, i % 2 ? lux.steel : lux.brass, -0.16 + i * 0.08, 0.026, -0.3, 14)
  return g
}

/* ---------- cups and service ---------- */

export type CupSize = 'short' | 'tall' | 'grande' | 'venti'
const CUP: Record<CupSize, [number, number, number]> = { short: [0.036, 0.028, 0.085], tall: [0.04, 0.029, 0.105], grande: [0.045, 0.031, 0.135], venti: [0.048, 0.033, 0.16] }

/** A hot cup: white paper, a rolled rim, the siren on it; optionally a lid and a sleeve, and a barista's mark. */
export function cup(s: Shop, c: CafeMaterials, p: Object3D, size: CupSize, x: number, y: number, z: number, yaw: number, lid = true, sleeve = true, siren?: Material) {
  const [rt, rb, h] = CUP[size]
  const g = at(p, x, y, z, yaw)
  lathe(g, [[0.001, 0], [rb, 0], [rt, h], [rt + 0.002, h + 0.002], [rt - 0.002, h + 0.003], [rb - 0.002, 0.004], [0.001, 0.004]], c.cupPaper, 0, 0, 0, 20)
  if (sleeve) lathe(g, [[rb + (rt - rb) * 0.3 + 0.0015, h * 0.3], [rb + (rt - rb) * 0.7 + 0.0015, h * 0.7]], c.sleeve, 0, 0, 0, 20, false)
  if (siren && !sleeve) decal(g, siren, rt * 0.9, rt * 0.9, 0, h * 0.55, rb + (rt - rb) * 0.55 + 0.002, 0)
  else if (siren) decal(g, siren, rt * 0.8, rt * 0.8, 0, h * 0.84, rb + (rt - rb) * 0.84 + 0.002, 0)
  if (lid) {
    lathe(g, [[0.001, 0], [rt + 0.004, 0], [rt + 0.004, 0.008], [rt - 0.004, 0.014], [rt * 0.6, 0.016], [rt * 0.55, 0.02], [0.001, 0.02]], c.lidWhite, 0, h, 0, 20)
    s.e.k.box(g, 0.012, 0.004, 0.006, c.lidBlack, 0, h + 0.02, rt * 0.4, false)
  }
  return g
}

/** A cold cup: clear, the drink and ice in it, a domed lid and a green straw. */
export function coldCup(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, drink: Material, cream = false) {
  const g = at(p, x, y, z, 0)
  const h = 0.15
  lathe(g, [[0.001, 0], [0.032, 0], [0.047, h], [0.049, h], [0.034, 0.003], [0.001, 0.003]], c.clearPlastic, 0, 0, 0, 20, false)
  lathe(g, [[0.001, 0.004], [0.031, 0.004], [0.042, h * 0.8], [0.001, h * 0.8]], drink, 0, 0, 0, 20, false)
  if (cream) lathe(g, [[0.001, h * 0.8], [0.043, h * 0.8], [0.045, h * 0.88], [0.001, h * 0.88]], c.cream, 0, 0, 0, 20, false)
  for (let i = 0; i < 4; i++) s.e.k.box(g, 0.022, 0.022, 0.022, c.ice, Math.cos(i * 1.6) * 0.016, h * 0.7 + (i % 2) * 0.015, Math.sin(i * 1.6) * 0.016, false).rotation.y = i
  const dome = mesh(g, new SphereGeometry(0.049, 20, 8, 0, PI * 2, 0, PI / 2), c.clearPlastic, 0, h, 0, false)
  dome.scale.y = 0.45
  tube(g, [0.01, h * 0.3, 0], [0.018, h + 0.08, 0.004], 0.0035, c.greenBody, 6)
  return g
}

/** A stack of nested cups, upside down as they come in the sleeve. */
export function cupStack(s: Shop, c: CafeMaterials, p: Object3D, size: CupSize, x: number, y: number, z: number, n = 14) {
  const [rt, rb, h] = CUP[size]
  const g = at(p, x, y, z, 0)
  const tall = h + (n - 1) * 0.012
  lathe(g, [[0.001, tall], [rb, tall], [rt, tall - h], [rt + 0.002, 0], [0.001, 0]], c.cupPaper, 0, 0, 0, 20)
  for (let i = 0; i < n; i++) lathe(g, [[rt + 0.0005, i * 0.012], [rt + 0.002, i * 0.012 + 0.002]], c.lidWhite, 0, 0, 0, 20, false)
  void s
  return g
}

/** A syrup bottle with its pump: clear glass of the syrup's colour, a black pump head and nozzle. */
export function syrupBottle(s: Shop, c: CafeMaterials, p: Object3D, x: number, y: number, z: number, i: number) {
  const g = at(p, x, y, z, PI)
  lathe(g, [[0.001, 0], [0.035, 0], [0.037, 0.005], [0.037, 0.17], [0.03, 0.2], [0.014, 0.215], [0.014, 0.23], [0.001, 0.23]], c.syrups[i % c.syrups.length], 0, 0, 0, 20, false)
  s.e.k.box(g, 0.06, 0.06, 0.002, c.cupPaper, 0, 0.1, 0.0375, false)
  s.e.k.cyl(g, 0.018, 0.018, 0.03, c.blackMatte, 0, 0.245, 0, 14)
  s.e.k.cyl(g, 0.005, 0.005, 0.06, c.blackMatte, 0, 0.29, 0, 8)
  s.e.k.soft(g, 0.04, 0.02, 0.022, 0.006, c.blackMatte, 0.0, 0.32, 0.0)
  tube(g, [0, 0.318, 0.01], [0, 0.31, 0.06], 0.004, c.blackMatte, 6)
  return g
}
