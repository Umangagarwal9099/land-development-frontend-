import { Color, CylinderGeometry, InstancedMesh, MeshStandardMaterial, Object3D, TorusGeometry, type Group, type Material } from 'three'
import { FLOOR_Y, PI, type Kit } from '../kit'
import { paintedMat } from '../shared'
import type { ClubMaterials } from './materials'

export { paintedMat }
import { carromTop, chessBoard, dartboard as dartboardPaint, gameplay, landscapePrint, laneNumber, paceClock as paceClockPaint, ttTop } from './paints'

/*
 * Clubhouse furniture and equipment. Like the house kit, each piece is built in local space with
 * its front (the side a user faces or uses) towards +z, then placed with a position and rotation.
 * Sizes are real-world: a 9 ft pool table, an ITTF table-tennis table, FINA-style starting blocks.
 */

type P = { k: Kit; c: ClubMaterials }

const legs = (p: P, g: Group, w: number, d: number, h: number, mat: Material, r = 0.025) => {
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) p.k.cyl(g, r, r, h, mat, (a * w) / 2, h / 2, (b * d) / 2, 10)
}

/* ---------------- interior basics ---------------- */

const leafMats = new WeakMap<Kit, MeshStandardMaterial[]>()

/**
 * A potted indoor plant with real leaf forms: broad leaves on stems radiating from a planter
 * (`tall` gives an upright bird-of-paradise; otherwise a lower rubber plant).
 */
export function pottedPlant(p: P, x: number, z: number, tall = true, y = FLOOR_Y) {
  const { k } = p
  let leaves = leafMats.get(k)
  if (!leaves) leafMats.set(k, (leaves = ['#3d5a34', '#4b6b3e', '#34502e'].map((color) => new MeshStandardMaterial({ color, roughness: 0.7 }))))
  const g = k.at(x, z, 0, y)
  const potH = tall ? 0.55 : 0.4
  const potR = tall ? 0.26 : 0.21
  k.cyl(g, potR, potR * 0.82, potH, k.m.pot, 0, potH / 2, 0, 32)
  k.cyl(g, potR - 0.02, potR - 0.02, 0.01, p.c.earth, 0, potH - 0.03, 0, 24)
  const n = tall ? 11 : 9
  for (let i = 0; i < n; i++) {
    const a = i * 2.4
    const lift = tall ? 0.5 + (i % 4) * 0.28 : 0.2 + (i % 3) * 0.16
    const lean = tall ? 0.18 + (i % 3) * 0.08 : 0.5 + (i % 3) * 0.12
    const stem = new Object3D()
    stem.position.set(0, potH - 0.02, 0)
    stem.rotation.set(0, a, lean)
    g.add(stem)
    k.cyl(stem, 0.008, 0.01, lift, k.m.sage, 0, lift / 2, 0, 5)
    const leaf = k.sphere(stem, 1, leaves[i % 3], 0, lift + (tall ? 0.28 : 0.16), 0)
    leaf.scale.set(tall ? 0.11 : 0.09, tall ? 0.3 : 0.17, 0.012)
    leaf.rotation.y = 0.4
  }
}

/** Linen drum pendant with a diffuser, hung from the ceiling. */
export function drumPendant(p: P, x: number, z: number, y: number, r = 0.35) {
  const { k } = p
  const g = k.at(x, z)
  k.mesh(new CylinderGeometry(r, r, 0.3, 40, 1, true), k.m.linen, g, 0, y, 0).castShadow = false
  k.cyl(g, r - 0.01, r - 0.01, 0.005, k.glow, 0, y - 0.12, 0, 40).castShadow = false
  k.cyl(g, 0.003, 0.003, k.ceiling - y - 0.15, k.m.bronze, 0, (k.ceiling + y + 0.15) / 2, 0, 4).castShadow = false
}

/** A framed landscape print with a white mount in a slim oak frame. */
export function print(p: P, x: number, y: number, z: number, ry: number, w: number, h: number, seed: number) {
  const { k } = p
  const mat = paintedMat(p, `print${seed}`, 512, Math.round((512 * h) / w), landscapePrint(seed), { roughness: 0.9 })
  const g = k.at(x, z, ry, FLOOR_Y + y)
  k.box(g, w + 0.05, h + 0.05, 0.035, k.m.oak, 0, 0, 0)
  k.box(g, w, h, 0.005, mat, 0, 0, 0.02, false)
}

/* ---------------- fitness ---------------- */

export function treadmill(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 0.86, 0.2, 2.05, c.frame, 0, 0.1, 0)
  k.box(g, 0.52, 0.02, 1.62, c.grip, 0, 0.21, -0.1)
  k.box(g, 0.86, 0.3, 0.34, c.frame, 0, 0.3, 0.88)
  for (const s of [-1, 1]) {
    const post = k.box(g, 0.06, 1.15, 0.08, c.frame, s * 0.38, 0.85, 0.78)
    post.rotation.x = -0.12
    k.box(g, 0.05, 0.05, 0.5, c.chrome, s * 0.38, 1.18, 0.55)
  }
  const con = k.box(g, 0.84, 0.32, 0.1, c.frame, 0, 1.42, 0.86)
  con.rotation.x = -0.5
  const screen = k.box(g, 0.5, 0.26, 0.012, c.display, 0, 1.43, 0.8, false)
  screen.rotation.x = -0.5
}

export function crossTrainer(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 0.62, 0.08, 1.9, c.frame, 0, 0.04, 0)
  k.box(g, 0.42, 0.52, 0.42, c.frame, 0, 0.34, -0.72)
  k.cyl(g, 0.24, 0.24, 0.08, c.steel, 0.24, 0.36, -0.72, 32).rotation.z = PI / 2
  k.cyl(g, 0.035, 0.045, 1.3, c.frame, 0, 0.75, 0.72).rotation.x = 0.15
  const con = k.box(g, 0.34, 0.24, 0.08, c.frame, 0, 1.46, 0.78)
  con.rotation.x = -0.5
  k.box(g, 0.24, 0.16, 0.012, c.display, 0, 1.47, 0.735, false).rotation.x = -0.5
  for (const s of [-1, 1]) {
    k.box(g, 0.08, 0.05, 0.9, c.steel, s * 0.14, 0.38, -0.05).rotation.x = 0.12
    k.box(g, 0.14, 0.03, 0.34, c.grip, s * 0.14, 0.44, 0.12)
    const arm = k.cyl(g, 0.02, 0.02, 1.45, c.chrome, s * 0.28, 1.05, 0.45, 10)
    arm.rotation.x = -0.35 * s
  }
}

export function bike(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 0.5, 0.06, 0.12, c.frame, 0, 0.03, -0.5)
  k.box(g, 0.5, 0.06, 0.12, c.frame, 0, 0.03, 0.55)
  k.box(g, 0.1, 0.1, 1.1, c.frame, 0, 0.1, 0)
  k.cyl(g, 0.27, 0.27, 0.06, c.steel, 0, 0.38, 0.42, 32).rotation.z = PI / 2
  k.cyl(g, 0.28, 0.28, 0.07, c.frame, 0, 0.38, 0.42, 32).rotation.z = PI / 2
  k.box(g, 0.08, 0.9, 0.08, c.frame, 0, 0.5, -0.3).rotation.x = 0.35
  k.soft(g, 0.18, 0.07, 0.28, 0.03, c.grip, 0, 0.95, -0.44)
  k.box(g, 0.08, 0.95, 0.08, c.frame, 0, 0.55, 0.28).rotation.x = -0.25
  k.box(g, 0.5, 0.04, 0.04, c.chrome, 0, 1.05, 0.44)
  k.box(g, 0.2, 0.14, 0.05, c.display, 0, 1.12, 0.38, false).rotation.x = -0.6
  for (const s of [-1, 1]) k.box(g, 0.1, 0.03, 0.18, c.grip, s * 0.16, 0.4 + s * 0.12, 0.05)
}

export function rower(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 0.14, 0.08, 2.4, c.chrome, 0, 0.32, 0)
  k.box(g, 0.5, 0.06, 0.1, c.frame, 0, 0.03, -1.1)
  k.cyl(g, 0.3, 0.3, 0.2, c.frame, 0, 0.42, 1.05, 32).rotation.z = PI / 2
  k.soft(g, 0.32, 0.07, 0.3, 0.03, c.grip, 0, 0.42, -0.3)
  for (const s of [-1, 1]) k.box(g, 0.12, 0.03, 0.26, c.grip, s * 0.14, 0.36, 0.6).rotation.x = -0.9
}

export function dumbbellRack(p: P, x: number, z: number, ry: number, len = 2.2) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  for (const s of [-1, 1]) {
    k.box(g, 0.06, 0.82, 0.06, c.frame, (s * len) / 2, 0.41, -0.18)
    k.box(g, 0.06, 0.5, 0.06, c.frame, (s * len) / 2, 0.25, 0.2)
  }
  const tiers = [
    { y: 0.52, z: 0.12, tilt: 0.3 },
    { y: 0.84, z: -0.12, tilt: 0.3 },
  ]
  const n = 9
  tiers.forEach((t, ti) => {
    const shelf = k.box(g, len, 0.03, 0.34, c.frame, 0, t.y, t.z)
    shelf.rotation.x = t.tilt
    for (let i = 0; i < n; i++) {
      const dx = -len / 2 + (len / n) * (i + 0.5)
      const kg = (ti * n + i + 1) * 2.5
      const r = 0.055 + Math.min(kg, 40) * 0.0016
      for (const e of [-1, 1]) k.cyl(g, r, r, 0.06, c.iron, dx + e * 0.07, t.y + r + 0.01, t.z, 6).rotation.z = PI / 2
      k.cyl(g, 0.016, 0.016, 0.12, c.chrome, dx, t.y + r + 0.01, t.z, 8).rotation.z = PI / 2
    }
  })
}

export function adjustableBench(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 0.5, 0.05, 0.08, c.frame, 0, 0.03, -0.6)
  k.box(g, 0.5, 0.05, 0.08, c.frame, 0, 0.03, 0.6)
  k.box(g, 0.08, 0.08, 1.2, c.frame, 0, 0.12, 0)
  k.box(g, 0.08, 0.3, 0.08, c.frame, 0, 0.3, 0.3)
  k.soft(g, 0.3, 0.07, 0.4, 0.03, c.pad, 0, 0.46, 0.35)
  const back = k.soft(g, 0.3, 0.07, 0.8, 0.03, c.pad, 0, 0.62, -0.18)
  back.rotation.x = -0.45
}

export function powerRack(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 2.4, 0.04, 2.4, k.m.oak, 0, 0.02, 0.2, false)
  k.box(g, 1.3, 0.042, 1.2, c.grip, 0, 0.025, 0.1, false)
  for (const a of [-0.62, 0.62]) for (const b of [-0.55, 0.55]) k.box(g, 0.08, 2.3, 0.08, c.frame, a, 1.15, b)
  for (const b of [-0.55, 0.55]) k.box(g, 1.32, 0.08, 0.08, c.frame, 0, 2.28, b)
  for (const a of [-0.62, 0.62]) k.box(g, 0.08, 0.08, 1.18, c.frame, a, 2.28, 0)
  k.cyl(g, 0.016, 0.016, 1.4, c.chrome, 0, 2.2, 0.55, 8).rotation.z = PI / 2
  // Loaded barbell on the J-hooks.
  k.cyl(g, 0.014, 0.014, 2.2, c.chrome, 0, 1.4, 0.58, 8).rotation.z = PI / 2
  for (const s of [-1, 1])
    for (const [off, r] of [[0.78, 0.225], [0.84, 0.225], [0.9, 0.17]] as const) k.cyl(g, r, r, 0.045, c.iron, s * off, 1.4, 0.58, 28).rotation.z = PI / 2
  // Plate storage pegs on the uprights.
  for (const s of [-1, 1]) {
    k.cyl(g, 0.025, 0.025, 0.28, c.chrome, s * 0.8, 0.5, -0.55, 8).rotation.z = PI / 2
    for (let i = 0; i < 3; i++) k.cyl(g, 0.225 - i * 0.04, 0.225 - i * 0.04, 0.04, c.iron, s * (0.72 + i * 0.05), 0.5, -0.55, 28).rotation.z = PI / 2
  }
}

/** Dual-stack functional trainer (cable crossover) with a pull-up bar. */
export function cableTrainer(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 2.2, 0.06, 0.7, c.frame, 0, 0.03, 0)
  for (const s of [-1, 1]) {
    k.box(g, 0.4, 2.25, 0.4, c.frame, s * 0.9, 1.125, 0)
    k.box(g, 0.2, 0.9, 0.12, c.iron, s * 0.9, 0.55, 0.15)
    k.box(g, 0.06, 2.0, 0.04, c.chrome, s * 0.72, 1.1, 0.2)
    k.cyl(g, 0.05, 0.05, 0.05, c.steel, s * 0.72, 1.5, 0.24, 16).rotation.x = PI / 2
    k.box(g, 0.06, 0.2, 0.03, c.grip, s * 0.72, 1.25, 0.3)
  }
  k.box(g, 2.2, 0.1, 0.12, c.frame, 0, 2.3, 0)
  k.cyl(g, 0.016, 0.016, 1.3, c.chrome, 0, 2.2, 0.28, 8).rotation.z = PI / 2
}

/** Selectorised plate-loaded press: weight stack at the back, seat and arms forward. */
export function pressMachine(p: P, x: number, z: number, ry: number, pulldown = false) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 0.9, 0.06, 1.7, c.frame, 0, 0.03, 0)
  k.box(g, 0.5, 2.1, 0.3, c.frame, 0, 1.05, -0.7)
  k.box(g, 0.26, 0.8, 0.12, c.iron, 0, 0.55, -0.52)
  k.box(g, 0.04, 1.6, 0.04, c.chrome, 0.08, 1.1, -0.5)
  k.soft(g, 0.42, 0.08, 0.42, 0.03, c.pad, 0, 0.5, 0.15)
  k.box(g, 0.06, 0.42, 0.06, c.frame, 0, 0.25, 0.15)
  if (pulldown) {
    k.box(g, 0.12, 0.1, 1.2, c.frame, 0, 2.15, -0.15)
    k.cyl(g, 0.006, 0.006, 0.8, c.steel, 0, 1.72, 0.2, 4)
    k.cyl(g, 0.016, 0.016, 1.2, c.chrome, 0, 1.3, 0.2, 8).rotation.z = PI / 2
    k.soft(g, 0.4, 0.08, 0.14, 0.03, c.pad, 0, 0.75, 0.3)
  } else {
    const back = k.soft(g, 0.42, 0.7, 0.08, 0.03, c.pad, 0, 0.95, -0.12)
    back.rotation.x = -0.12
    for (const s of [-1, 1]) {
      k.box(g, 0.06, 0.06, 0.7, c.frame, s * 0.34, 1.05, 0.2)
      k.box(g, 0.05, 0.2, 0.05, c.grip, s * 0.34, 1.02, 0.52)
    }
  }
}

export function kettlebellRack(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  legs(p, g, 1.5, 0.4, 0.9, c.frame, 0.02)
  for (const y of [0.35, 0.8]) {
    k.box(g, 1.55, 0.03, 0.42, c.frame, 0, y, 0)
    for (let i = 0; i < 5; i++) {
      const r = 0.08 + i * 0.012
      const kb = k.sphere(g, r, c.iron, -0.6 + i * 0.3, y + r + 0.01, 0)
      kb.scale.y = 0.9
      const h = k.mesh(new TorusGeometry(r * 0.6, 0.014, 6, 16, PI), c.iron, g, -0.6 + i * 0.3, y + r * 1.75, 0)
      h.rotation.y = PI / 2
    }
  }
}

export function yogaMat(p: P, x: number, z: number, ry: number, color: string) {
  const g = p.k.at(x, z, ry)
  p.k.box(g, 0.62, 0.008, 1.83, new MeshStandardMaterial({ color, roughness: 1 }), 0, 0.004, 0, false)
}

/* ---------------- games ---------------- */

const BALLS = ['#f2c200', '#1d4fb8', '#c8262b', '#5a2a86', '#ef7b1a', '#1f7a3c', '#7a1f24', '#111111', '#f2c200', '#1d4fb8', '#c8262b', '#5a2a86', '#ef7b1a', '#1f7a3c', '#7a1f24']

/** 9 ft tournament pool table in walnut and bronze, balls racked, with a three-shade pendant. */
export function poolTable(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  const [W, L] = [1.62, 2.84]
  k.box(g, W - 0.2, 0.26, L - 0.2, k.m.walnut, 0, 0.62, 0)
  k.box(g, W - 0.24, 0.02, L - 0.24, k.m.bronze, 0, 0.49, 0)
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0]]) k.box(g, 0.14, 0.5, 0.14, k.m.walnut, a * (W / 2 - 0.2), 0.25, b * (L / 2 - 0.25))
  k.box(g, W - 0.26, 0.03, L - 0.26, c.felt, 0, 0.785, 0)
  for (const s of [-1, 1]) {
    k.box(g, 0.13, 0.07, L, k.m.walnut, s * (W / 2 - 0.065), 0.8, 0)
    k.box(g, W, 0.07, 0.13, k.m.walnut, 0, 0.8, s * (L / 2 - 0.065))
    k.box(g, 0.04, 0.045, L - 0.3, c.felt, s * (W / 2 - 0.15), 0.81, 0)
    k.box(g, W - 0.3, 0.045, 0.04, c.felt, 0, 0.81, s * (L / 2 - 0.15))
  }
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]) k.cyl(g, 0.065, 0.065, 0.075, c.grip, a * (W / 2 - 0.14), 0.805, b * (L / 2 - 0.14), 16)
  // Balls racked on the foot spot, cue ball at the head.
  const r = 0.0286
  let n = 0
  for (let row = 0; row < 5; row++)
    for (let i = 0; i <= row; i++) {
      const mat = new MeshStandardMaterial({ color: BALLS[n++ % BALLS.length], roughness: 0.15 })
      k.sphere(g, r, mat, (i - row / 2) * r * 2.02, 0.8 + r, -0.64 - row * r * 1.75)
    }
  k.sphere(g, r, c.white, 0, 0.8 + r, 0.64)
  // Two cues resting on the rail.
  for (const s of [-1, 1]) k.cyl(g, 0.006, 0.012, 1.45, k.m.walnut, s * 0.3, 0.86, 0.35, 8).rotation.set(PI / 2, 0, s * 0.05)
  // Pendant: bronze bar with three dome shades, 1 m above the cloth.
  const shade = new CylinderGeometry(0.12, 0.22, 0.2, 32, 1, true)
  k.box(g, 0.05, 0.05, 2.1, k.m.bronze, 0, 1.95, 0)
  for (const dz of [-0.7, 0, 0.7]) {
    k.mesh(shade, k.m.bronze, g, 0, 1.85, dz)
    k.cyl(g, 0.2, 0.2, 0.01, k.glow, 0, 1.76, dz, 24)
  }
  for (const s of [-1, 1]) k.cyl(g, 0.003, 0.003, k.ceiling - 1.95, k.m.bronze, 0, (k.ceiling + 1.95) / 2, s * 0.9, 4)
}

/** Wall-mounted cue rack in walnut: eight cues, a chalk ledge and a bead scoring string. */
export function cueRack(p: P, x: number, z: number, ry: number) {
  const { k } = p
  const g = k.at(x, z, ry, FLOOR_Y + 0.35)
  k.box(g, 1.3, 1.45, 0.04, k.m.walnut, 0, 0.72, 0)
  k.box(g, 1.2, 0.05, 0.1, k.m.bronze, 0, 0.08, 0.05)
  k.box(g, 1.2, 0.04, 0.08, k.m.bronze, 0, 1.3, 0.05)
  for (let i = 0; i < 8; i++) k.cyl(g, 0.006, 0.013, 1.45, i % 2 ? k.m.walnut : k.m.oak, -0.5 + i * 0.143, 0.78, 0.08, 8)
  for (let i = 0; i < 4; i++) k.box(g, 0.025, 0.025, 0.025, p.c.navy, -0.4 + i * 0.1, 0.12, 0.1)
  k.cyl(g, 0.003, 0.003, 1.2, k.m.bronze, 0, 1.55, 0.04, 4).rotation.z = PI / 2
  for (let i = 0; i < 14; i++) k.sphere(g, 0.018, i < 5 ? k.m.leather : k.m.boucle, -0.55 + i * 0.05 + (i > 4 ? 0.25 : 0), 1.55, 0.04)
}

/** ITTF table: 2.74 × 1.525 m at 0.76 m, net and posts, two bats and a ball. */
export function tableTennis(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  const top = paintedMat(p, 'ttTop', 256, 460, ttTop, { roughness: 0.4 })
  k.box(g, 1.525, 0.025, 2.74, [c.navy, c.navy, top, c.navy, c.navy, c.navy], 0, 0.748, 0)
  for (const s of [-1, 1]) {
    k.box(g, 1.3, 0.05, 0.05, c.frame, 0, 0.7, s * 0.65)
    for (const a of [-1, 1]) {
      k.box(g, 0.05, 0.62, 0.05, c.frame, a * 0.6, 0.38, s * 0.65)
      k.cyl(g, 0.035, 0.035, 0.03, c.grip, a * 0.6, 0.035, s * 0.65, 12).rotation.z = PI / 2
    }
  }
  k.box(g, 1.83, 0.1525, 0.008, new MeshStandardMaterial({ color: '#1a1a1c', roughness: 1, transparent: true, opacity: 0.75 }), 0, 0.76 + 0.076, 0, false)
  k.box(g, 1.83, 0.015, 0.012, c.white, 0, 0.76 + 0.152, 0, false)
  for (const s of [-1, 1]) k.box(g, 0.03, 0.17, 0.05, c.frame, s * 0.915, 0.84, 0)
  for (const [bx, bz, col] of [[0.4, 0.9, '#c8262b'], [-0.35, -1.0, '#141414']] as const) {
    k.cyl(g, 0.075, 0.075, 0.012, new MeshStandardMaterial({ color: col, roughness: 0.9 }), bx, 0.77, bz, 24)
    k.box(g, 0.03, 0.02, 0.1, k.m.oak, bx, 0.77, bz + 0.12)
  }
  k.sphere(g, 0.02, c.white, 0.1, 0.78, 0.3)
}

/** Low court barrier panel, 2 m long. */
export function barrier(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 2.0, 0.66, 0.03, c.navy, 0, 0.35, 0)
  k.box(g, 1.9, 0.04, 0.032, c.white, 0, 0.55, 0)
  for (const s of [-1, 1]) k.box(g, 0.04, 0.03, 0.4, c.frame, s * 0.9, 0.015, 0)
}

/** Walnut chess table on a bronze pedestal with a set mid-game. */
export function chessTable(p: P, x: number, z: number) {
  const { k, c } = p
  const g = k.at(x, z)
  const board = paintedMat(p, 'chess', 256, 256, chessBoard, { roughness: 0.35 })
  k.box(g, 0.8, 0.04, 0.8, [k.m.walnut, k.m.walnut, board, k.m.walnut, k.m.walnut, k.m.walnut], 0, 0.72, 0)
  k.cyl(g, 0.05, 0.08, 0.7, k.m.bronze, 0, 0.35, 0, 16)
  k.cyl(g, 0.28, 0.3, 0.03, k.m.bronze, 0, 0.015, 0, 32)
  const s = (0.8 * 0.88) / 8
  const light = c.cream
  const dark = c.frame
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (const [side, mat] of [[1, light], [-1, dark]] as const)
    for (let i = 0; i < 16; i++) {
      // Most pieces at home, a few advanced into the centre.
      const file = i % 8
      const rank = i < 8 ? 1 : 0
      const moved = rand() < 0.3
      const px = -0.352 + s * (file + 0.5)
      const pz = side * (0.352 - s * (rank + 0.5 + (moved ? 1 + Math.floor(rand() * 2) : 0)))
      const h = rank === 1 ? 0.035 : 0.05 + (file === 3 || file === 4 ? 0.02 : 0)
      k.cyl(g, 0.012, 0.016, h, mat, px, 0.74 + h / 2, pz, 10)
      k.sphere(g, 0.011, mat, px, 0.745 + h, pz)
    }
}

/** Round games table in oak with a board game laid out. */
export function gamesTable(p: P, x: number, z: number) {
  const { k, c } = p
  k.drumTable(x, z, 0.55, 0.74, k.m.oak, k.m.walnut)
  const g = k.at(x, z)
  k.box(g, 0.5, 0.01, 0.5, c.cream, 0, 0.745, 0, false)
  const colors = ['#c8262b', '#1b62c4', '#1f8a44', '#f2c200']
  colors.forEach((col, i) => {
    const mat = new MeshStandardMaterial({ color: col, roughness: 0.5 })
    for (let j = 0; j < 3; j++) k.cyl(g, 0.012, 0.014, 0.03, mat, Math.cos(i * 1.57 + j * 0.3) * 0.18, 0.765, Math.sin(i * 1.57 + j * 0.3) * 0.18, 8)
  })
  k.box(g, 0.28, 0.06, 0.2, c.navy, 0.3, 0.77, -0.25).rotation.y = 0.3
}

/** Oak shelving stocked with board-game boxes. */
export function gameShelves(p: P, x: number, z: number, ry: number, len: number) {
  const { k } = p
  const g = k.at(x, z, ry)
  k.box(g, len, 2.2, 0.36, k.m.oak, 0, 1.1, -0.02)
  const palette = ['#7a1f24', '#12306a', '#1f7a3c', '#c8a24a', '#2a2a2c', '#8a5a3a', '#5a2a86', '#e9e2d4']
  const mats = palette.map((color) => new MeshStandardMaterial({ color, roughness: 0.7 }))
  let n = 0
  for (const y of [0.3, 0.75, 1.2, 1.65]) {
    k.box(g, len - 0.04, 0.025, 0.34, k.m.walnut, 0, y, 0.01)
    let cx = -len / 2 + 0.1
    while (cx < len / 2 - 0.35) {
      const w = 0.06 + (n % 3) * 0.02
      const h = 0.24 + (n % 4) * 0.04
      if (n % 7 === 3) k.box(g, 0.34, 0.06, 0.28, mats[n % mats.length], cx + 0.17, y + 0.04 + (n % 2) * 0.06, 0.02)
      else k.box(g, w, h, 0.28, mats[n % mats.length], cx + w / 2, y + 0.013 + h / 2, 0.02)
      cx += n % 7 === 3 ? 0.4 : w + 0.012
      n++
    }
  }
  k.box(g, len - 0.1, 0.012, 0.02, k.glow, 0, 2.05, 0.17, false)
}

export function foosball(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 0.76, 0.28, 1.4, k.m.walnut, 0, 0.8, 0)
  k.box(g, 0.68, 0.01, 1.3, new MeshStandardMaterial({ color: '#2f6b3a', roughness: 0.9 }), 0, 0.7, 0, false)
  legs(p, g, 0.64, 1.25, 0.66, k.m.walnut, 0.04)
  const teams = [new MeshStandardMaterial({ color: '#c8262b', roughness: 0.5 }), new MeshStandardMaterial({ color: '#1b62c4', roughness: 0.5 })]
  const rods = [1, 2, 5, 3, 3, 5, 2, 1]
  rods.forEach((men, i) => {
    const rz = -0.56 + i * 0.16
    k.cyl(g, 0.008, 0.008, 1.2, c.chrome, 0, 0.86, rz, 8).rotation.z = PI / 2
    k.cyl(g, 0.018, 0.018, 0.12, c.grip, (i % 2 ? 1 : -1) * 0.62, 0.86, rz, 10).rotation.z = PI / 2
    // Players spread evenly across the pitch on each rod.
    for (let m = 0; m < men; m++) k.box(g, 0.035, 0.12, 0.02, teams[i % 2], -0.3 + (0.6 / (men + 1)) * (m + 1), 0.82, rz)
  })
}

export function airHockey(p: P, x: number, z: number, ry: number, top: Material) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 1.1, 0.2, 2.1, c.frame, 0, 0.7, 0)
  k.box(g, 1.0, 0.012, 2.0, top, 0, 0.805, 0, false)
  for (const s of [-1, 1]) {
    k.box(g, 0.05, 0.06, 2.1, c.chrome, s * 0.525, 0.83, 0)
    k.box(g, 1.1, 0.06, 0.05, c.chrome, 0, 0.83, s * 1.025)
    for (const a of [-1, 1]) k.box(g, 0.1, 0.6, 0.1, c.frame, a * 0.42, 0.3, s * 0.85)
  }
  for (const [dz, col] of [[0.7, '#c8262b'], [-0.7, '#1b62c4']] as const) {
    const mat = new MeshStandardMaterial({ color: col, roughness: 0.4 })
    k.cyl(g, 0.045, 0.045, 0.03, mat, 0, 0.83, dz, 24)
    k.cyl(g, 0.02, 0.02, 0.05, mat, 0, 0.86, dz, 12)
  }
  k.cyl(g, 0.03, 0.03, 0.008, c.grip, 0.1, 0.815, 0.1, 20)
}

export function display(p: P, x: number, y: number, z: number, ry: number, w: number, screen: Material) {
  const { k } = p
  const g = k.at(x, z, ry, FLOOR_Y + y)
  k.box(g, w + 0.03, w * 0.5625 + 0.03, 0.05, p.c.frame, 0, 0, 0)
  k.box(g, w, w * 0.5625, 0.005, screen, 0, 0, 0.027, false)
}

/** Carrom board on a walnut stand, coins set for a break, with four low stools. */
export function carrom(p: P, x: number, z: number) {
  const { k, c } = p
  const g = k.at(x, z)
  const top = paintedMat(p, 'carrom', 512, 512, carromTop, { roughness: 0.35 })
  k.box(g, 0.9, 0.06, 0.9, k.m.walnut, 0, 0.66, 0)
  k.box(g, 0.74, 0.012, 0.74, top, 0, 0.695, 0, false)
  k.cyl(g, 0.05, 0.08, 0.63, k.m.walnut, 0, 0.315, 0, 12)
  k.box(g, 0.5, 0.03, 0.5, k.m.walnut, 0, 0.015, 0)
  const white = c.cream
  const black = c.frame
  const red = new MeshStandardMaterial({ color: '#b3261e', roughness: 0.4 })
  k.cyl(g, 0.016, 0.016, 0.008, red, 0, 0.705, 0, 16)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2
    k.cyl(g, 0.016, 0.016, 0.008, i % 2 ? white : black, Math.cos(a) * 0.034, 0.705, Math.sin(a) * 0.034, 16)
    k.cyl(g, 0.016, 0.016, 0.008, i % 2 ? black : white, Math.cos(a + 0.26) * 0.068, 0.705, Math.sin(a + 0.26) * 0.068, 16)
  }
  k.cyl(g, 0.02, 0.02, 0.009, c.white, 0, 0.705, 0.25, 16)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2
    const st = k.at(x + Math.sin(a) * 0.72, z + Math.cos(a) * 0.72)
    k.cyl(st, 0.19, 0.17, 0.05, k.m.leather, 0, 0.44, 0, 20)
    k.cyl(st, 0.025, 0.025, 0.42, k.m.bronze, 0, 0.21, 0, 8)
    k.cyl(st, 0.16, 0.18, 0.02, k.m.bronze, 0, 0.01, 0, 20)
  }
}

/** Dartboard in an oak cabinet with its doors open, a scoring board and the oche on the floor. */
export function dartboard(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const board = paintedMat(p, 'dartboard', 512, 512, dartboardPaint, { roughness: 0.8 })
  const g = k.at(x, z, ry, FLOOR_Y + 1.73)
  k.box(g, 0.66, 0.66, 0.1, k.m.oak, 0, 0, 0.05)
  const face = k.cyl(g, 0.225, 0.225, 0.04, board, 0, 0, 0.12, 48)
  face.rotation.x = PI / 2
  face.rotation.y = PI
  for (const s of [-1, 1]) {
    const door = k.box(g, 0.33, 0.66, 0.025, k.m.oak, s * 0.5, 0, 0.12)
    door.rotation.y = s * 0.25
    k.box(g, 0.28, 0.4, 0.005, c.frame, s * 0.5, 0, 0.14, false)
  }
  const oche = k.at(x, z, ry)
  oche.translateZ(2.37)
  k.box(oche, 0.6, 0.015, 0.04, k.m.bronze, 0, 0.008, 0, false)
}

/** A console screen showing a game in progress. */
export function gameScreen(p: P, kind: 'race' | 'football') {
  const mat = paintedMat(p, `game-${kind}`, 512, 288, gameplay(kind), { roughness: 0.15 })
  mat.emissiveMap = mat.map
  mat.emissive.set('#ffffff')
  mat.emissiveIntensity = 0.75
  return mat
}

/** Racing-style gaming chair: five-star base, bucket seat with bolsters, tall back and headrest. */
export function gamingChair(p: P, x: number, z: number, ry: number, accent: string) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  const trim = new MeshStandardMaterial({ color: accent, roughness: 0.6 })
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * PI * 2
    const leg = k.box(g, 0.05, 0.04, 0.34, c.frame, Math.sin(a) * 0.17, 0.08, Math.cos(a) * 0.17)
    leg.rotation.y = a
    k.sphere(g, 0.03, c.grip, Math.sin(a) * 0.33, 0.03, Math.cos(a) * 0.33)
  }
  k.cyl(g, 0.03, 0.03, 0.34, c.chrome, 0, 0.28, 0, 10)
  k.soft(g, 0.52, 0.1, 0.5, 0.04, c.pad, 0, 0.5, 0)
  const back = k.at(x, z, ry)
  back.position.y += 0.52
  back.translateZ(-0.24)
  back.rotation.x = -0.12
  k.soft(back, 0.52, 0.85, 0.1, 0.04, c.pad, 0, 0.45, 0)
  for (const s of [-1, 1]) {
    k.soft(back, 0.07, 0.7, 0.14, 0.03, trim, s * 0.26, 0.4, 0.02)
    k.soft(g, 0.07, 0.07, 0.46, 0.03, trim, s * 0.24, 0.57, 0.02)
    k.box(g, 0.06, 0.2, 0.05, c.frame, s * 0.3, 0.65, -0.05)
    k.box(g, 0.08, 0.03, 0.26, c.grip, s * 0.3, 0.76, 0)
  }
  k.soft(back, 0.28, 0.14, 0.08, 0.03, trim, 0, 0.78, 0.07)
}

/** Wall-mounted screen over a floating console unit, with bias lighting behind the screen. */
export function consoleStation(p: P, x: number, z: number, ry: number, w: number, kind: 'race' | 'football') {
  const { k, c } = p
  const g = k.at(x, z, ry, FLOOR_Y + 1.45)
  k.box(g, w + 0.2, w * 0.5625 + 0.2, 0.01, p.c.ledBlue, 0, 0, 0.005, false)
  k.box(g, w + 0.03, w * 0.5625 + 0.03, 0.05, c.frame, 0, 0, 0.035)
  k.box(g, w, w * 0.5625, 0.005, gameScreen(p, kind), 0, 0, 0.063, false)
  const unit = k.at(x, z, ry, FLOOR_Y + 0.3)
  k.box(unit, w + 0.4, 0.34, 0.42, k.m.oak, 0, 0.17, 0.23)
  k.box(unit, 0.39, 0.08, 0.31, c.white, -w / 2 + 0.1, 0.38, 0.25)
  k.box(unit, 0.4, 0.1, 0.3, c.frame, w / 2 - 0.1, 0.39, 0.25)
  for (const dx of [-0.15, 0.15]) {
    const pad = k.soft(unit, 0.16, 0.05, 0.1, 0.02, c.frame, dx, 0.37, 0.3)
    pad.rotation.y = dx * 2
  }
}

/** Racing simulator: bucket seat on an aluminium rig, wheel, pedals and a triple-monitor wrap. */
export function racingSim(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, 0.7, 0.06, 1.7, c.frame, 0, 0.03, 0.15)
  for (const s of [-1, 1]) k.box(g, 0.05, 0.05, 1.7, c.steel, s * 0.32, 0.08, 0.15)
  const seat = k.soft(g, 0.52, 0.5, 0.62, 0.08, c.pad, 0, 0.35, -0.3)
  seat.rotation.x = 0.1
  const back = k.soft(g, 0.52, 0.8, 0.14, 0.06, c.pad, 0, 0.78, -0.62)
  back.rotation.x = -0.35
  k.box(g, 0.42, 0.08, 0.12, c.steel, 0, 0.3, 0.72).rotation.x = -0.5
  for (const dx of [-0.12, 0, 0.12]) k.box(g, 0.07, 0.02, 0.14, c.grip, dx, 0.38, 0.7).rotation.x = -0.9
  k.box(g, 0.06, 0.6, 0.06, c.frame, 0, 0.36, 0.42)
  k.box(g, 0.3, 0.1, 0.2, c.frame, 0, 0.7, 0.42)
  const wheel = k.mesh(new TorusGeometry(0.15, 0.018, 8, 32), c.grip, g, 0, 0.8, 0.3)
  wheel.rotation.x = -0.25
  const race = gameScreen(p, 'race')
  for (const [a, dx, dz] of [[0, 0, 1.25], [0.6, -0.7, 1.02], [-0.6, 0.7, 1.02]] as const) {
    const mon = k.at(x, z, ry)
    mon.translateX(dx)
    mon.translateZ(dz)
    mon.rotation.y += PI + a
    k.box(mon, 0.72, 0.43, 0.04, c.frame, 0, 1.05, 0)
    k.box(mon, 0.68, 0.39, 0.005, race, 0, 1.05, 0.023, false)
    k.box(mon, 0.05, 0.84, 0.05, c.frame, 0, 0.42, -0.04)
  }
}

/* ---------------- changing rooms ---------------- */

/** Full-height locker bank; oak door faces to the front, bronze kick plate lit from below. */
export function lockerBank(p: P, x: number, z: number, ry: number, len: number) {
  const { k } = p
  const g = k.at(x, z, ry)
  const oak = k.m.oak
  const face = k.finish('lockers', len / 1.6, 1, 0.5)
  k.box(g, len, 2.1, 0.55, [oak, oak, oak, oak, face, oak], 0, 1.15, 0)
  k.box(g, len, 0.1, 0.5, k.m.bronze, 0, 0.05, -0.02)
  k.box(g, len - 0.04, 0.012, 0.02, k.glow, 0, 0.1, 0.27, false)
}

export function showerCubicle(p: P, x: number, z: number, ry: number, w: number, d: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, w, 0.02, d, k.m.basalt, 0, 0.01, 0, false)
  for (const s of [-1, 1]) k.box(g, 0.06, 2.2, d, k.m.travertine, (s * w) / 2, 1.1, 0)
  k.box(g, w, 2.2, 0.06, k.m.travertine, 0, 1.1, -d / 2)
  k.box(g, w * 0.55, 2.0, 0.012, k.m.glass, -w * 0.2, 1.05, d / 2, false)
  k.cyl(g, 0.12, 0.12, 0.012, c.chrome, 0, 2.15, -d / 2 + 0.3, 24)
  k.box(g, 0.02, 0.02, 0.3, c.chrome, 0, 2.18, -d / 2 + 0.15)
  k.box(g, 0.14, 0.14, 0.03, c.chrome, w / 2 - 0.2, 1.1, -d / 2 + 0.05)
  k.box(g, 0.4, 0.15, 0.1, k.m.travertine, -w / 2 + 0.3, 1.2, -d / 2 + 0.08)
}

/** Stone vanity counter with vessel basins, bronze taps and a backlit mirror above. */
export function basinCounter(p: P, x: number, z: number, ry: number, len: number, basins: number) {
  const { k, c } = p
  const g = k.at(x, z, ry)
  k.box(g, len, 0.12, 0.56, c.statuario, 0, 0.84, 0)
  k.box(g, len - 0.1, 0.36, 0.5, k.fluted('flutedWalnut', len), 0, 0.6, -0.02)
  k.box(g, len - 0.1, 0.012, 0.02, k.glow, 0, 0.41, 0.24, false)
  for (let i = 0; i < basins; i++) {
    const bx = -len / 2 + (len / basins) * (i + 0.5)
    k.cyl(g, 0.21, 0.17, 0.13, c.white, bx, 0.965, 0.04, 32)
    k.cyl(g, 0.012, 0.012, 0.28, k.m.bronze, bx, 1.04, -0.2, 8)
    k.box(g, 0.02, 0.02, 0.16, k.m.bronze, bx, 1.18, -0.13)
  }
  k.box(g, len - 0.2, 1.0, 0.02, k.m.mirror, 0, 1.75, -0.27)
  k.box(g, len - 0.16, 1.04, 0.01, k.glow, 0, 1.75, -0.282, false)
}

/** Slatted oak bench with a leather cushion. */
export function bench(p: P, x: number, z: number, ry: number, len: number, y = FLOOR_Y, cushion: Material = p.k.m.leather) {
  const { k } = p
  const g = k.at(x, z, ry, y)
  for (let i = 0; i < 5; i++) k.box(g, len, 0.035, 0.07, k.m.teak, 0, 0.44, -0.16 + i * 0.08)
  k.soft(g, len - 0.2, 0.05, 0.3, 0.02, cushion, 0, 0.48, 0)
  for (const s of [-1, 1]) k.box(g, 0.05, 0.42, 0.36, k.m.bronze, s * (len / 2 - 0.15), 0.21, 0)
}

/* ---------------- swimming ---------------- */

const laneMats = new WeakMap<Kit, MeshStandardMaterial[]>()
export function laneNumberMat(p: P, n: number) {
  let list = laneMats.get(p.k)
  if (!list) laneMats.set(p.k, (list = []))
  return (list[n] ??= new MeshStandardMaterial({ map: p.k.tex.painted(128, 128, laneNumber(n)), roughness: 0.5 }))
}

/** Competition starting block: stainless frame, sloped non-slip platform, adjustable wedge, backstroke grips. */
export function startingBlock(p: P, x: number, z: number, ry: number, lane: number, y: number) {
  const { k, c } = p
  const g = k.at(x, z, ry, y)
  for (const s of [-1, 1]) {
    k.box(g, 0.05, 0.7, 0.05, c.steel, s * 0.22, 0.35, -0.25)
    k.box(g, 0.05, 0.62, 0.05, c.steel, s * 0.22, 0.31, 0.22)
    k.box(g, 0.05, 0.04, 0.55, c.steel, s * 0.22, 0.02, 0)
  }
  const top = k.box(g, 0.52, 0.05, 0.74, c.white, 0, 0.72, 0)
  top.rotation.x = 0.17
  const grip = k.box(g, 0.48, 0.012, 0.66, c.nonSlip, 0, 0.75, 0)
  grip.rotation.x = 0.17
  const wedge = k.box(g, 0.48, 0.12, 0.08, c.white, 0, 0.83, -0.22)
  wedge.rotation.x = -0.6
  k.box(g, 0.44, 0.03, 0.05, c.grip, 0, 0.84, -0.18)
  for (const s of [-1, 1]) k.cyl(g, 0.014, 0.014, 0.3, c.steel, s * 0.18, 0.62, 0.36, 8).rotation.x = PI / 2
  k.cyl(g, 0.014, 0.014, 0.4, c.steel, 0, 0.62, 0.5, 8).rotation.z = PI / 2
  const num = laneNumberMat(p, lane)
  for (const s of [-1, 1]) k.box(g, 0.012, 0.22, 0.22, num, s * 0.262, 0.6, -0.02, false).rotation.y = s * PI / 2 + PI / 2
  k.box(g, 0.2, 0.2, 0.012, num, 0, 0.55, -0.37, false).rotation.y = PI
}

/** Stainless pool ladder: two curved grab rails and three treads down the wall. */
export function ladder(p: P, x: number, z: number, ry: number, y: number) {
  const { k, c } = p
  const g = k.at(x, z, ry, y)
  for (const s of [-1, 1]) {
    const bend = k.mesh(new TorusGeometry(0.2, 0.021, 8, 20, PI), c.chrome, g, s * 0.25, 0.75, 0.02)
    bend.rotation.y = PI / 2
    k.cyl(g, 0.021, 0.021, 0.75, c.chrome, s * 0.25, 0.375, 0.22, 10)
    k.cyl(g, 0.021, 0.021, 1.65, c.chrome, s * 0.25, -0.07, -0.18, 10)
  }
  for (let i = 0; i < 3; i++) k.box(g, 0.46, 0.03, 0.09, c.steel, 0, -0.35 - i * 0.28, -0.22)
}

/**
 * Anti-wave lane lines: discs strung along each line, red within 5 m of either wall and alternating
 * blue and white between. One instanced mesh for every float in the pool.
 */
export function laneLines(p: P, x0: number, x1: number, zs: number[], y: number) {
  const disc = new CylinderGeometry(0.075, 0.075, 0.11, 14)
  disc.rotateZ(PI / 2)
  const spacing = 0.13
  const count = Math.floor((x1 - x0) / spacing)
  const mesh = new InstancedMesh(disc, new MeshStandardMaterial({ roughness: 0.4 }), count * zs.length)
  const o = new Object3D()
  const [red, blue, white, yellow] = ['#c8262b', '#1b4fb8', '#f2f2f0', '#f2c200'].map((h) => new Color(h))
  let i = 0
  zs.forEach((z, line) => {
    for (let j = 0; j < count; j++) {
      const x = x0 + spacing * (j + 0.5)
      o.position.set(x, y, z)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
      const fromWall = Math.min(x - x0, x1 - x)
      const outer = line === 0 || line === zs.length - 1
      mesh.setColorAt(i, fromWall < 5 ? red : outer ? yellow : Math.floor(j / 4) % 2 ? white : blue)
      i++
    }
  })
  mesh.castShadow = true
  mesh.computeBoundingSphere()
  p.k.root.add(mesh)
  for (const z of zs)
    for (const x of [x0 - 0.05, x1 + 0.05]) p.k.box(p.k.root, 0.08, 0.06, 0.06, p.c.chrome, x, y, z)
}

/** Three-tier aluminium and teak stand for athletes and spectators. */
export function bleachers(p: P, x: number, z: number, ry: number, len: number, y: number) {
  const { k, c } = p
  const g = k.at(x, z, ry, y)
  for (let t = 0; t < 3; t++) {
    const h = 0.45 + t * 0.42
    const dz = -t * 0.8
    k.box(g, len, 0.06, 0.34, k.m.teak, 0, h, dz + 0.1)
    k.box(g, len, 0.04, 0.8, c.steel, 0, h - 0.33, dz - 0.05)
    for (let s = -len / 2 + 0.3; s <= len / 2 - 0.2; s += 2) k.box(g, 0.06, h, 0.06, c.steel, s, h / 2, dz + 0.1)
  }
  k.box(g, len, 0.05, 0.05, c.steel, 0, 2.2, -2.05)
  for (let s = -len / 2 + 0.3; s <= len / 2; s += 2) k.box(g, 0.05, 0.9, 0.05, c.steel, s, 1.75, -2.05)
}

export function paceClock(p: P, x: number, z: number, ry: number, y: number, r = 0.55) {
  const { k, c } = p
  const g = k.at(x, z, ry, y)
  const face = paintedMat(p, 'paceClock', 512, 512, paceClockPaint, { roughness: 0.5 })
  k.cyl(g, 0.04, 0.05, 2.0, c.frame, 0, 1.0, 0, 10)
  k.box(g, 0.5, 0.04, 0.5, c.frame, 0, 0.02, 0)
  k.cyl(g, r + 0.04, r + 0.04, 0.08, c.frame, 0, 2.0 + r, 0, 40).rotation.x = PI / 2
  const d = k.cyl(g, r, r, 0.01, face, 0, 2.0 + r, 0.045, 40)
  d.rotation.x = PI / 2
  d.rotation.y = PI
}

/** Training kit on a stainless rack: kickboards, pull buoys, fins and paddles in club colours. */
export function trainingRack(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry, 0.12)
  legs(p, g, 1.9, 0.5, 1.7, c.steel, 0.02)
  const cols = ['#1b4fb8', '#f2c200', '#c8262b', '#1f8a44'].map((color) => new MeshStandardMaterial({ color, roughness: 0.8 }))
  for (const y of [0.35, 0.85, 1.35]) k.box(g, 1.94, 0.03, 0.52, c.steel, 0, y, 0)
  for (let i = 0; i < 9; i++) {
    const kb = k.soft(g, 0.3, 0.44, 0.035, 0.01, cols[i % 4], -0.8 + i * 0.2, 1.6, 0)
    kb.rotation.x = -0.12
  }
  for (let i = 0; i < 8; i++) {
    const bx = -0.8 + i * 0.22
    k.cyl(g, 0.045, 0.045, 0.12, cols[(i + 1) % 4], bx, 0.9, -0.08, 12)
    k.cyl(g, 0.055, 0.055, 0.12, cols[(i + 1) % 4], bx, 0.9, 0.08, 12)
  }
  for (let i = 0; i < 6; i++) {
    const fin = k.box(g, 0.2, 0.04, 0.5, cols[i % 2 ? 0 : 3], -0.7 + i * 0.28, 0.4, 0)
    fin.rotation.y = 0.15
  }
  for (let i = 0; i < 6; i++) k.box(g, 0.2, 0.012, 0.26, cols[2 - (i % 2)], -0.7 + i * 0.28, 1.39, 0.05)
}

/** Lane-line storage reel on castors. */
export function laneReel(p: P, x: number, z: number, ry: number) {
  const { k, c } = p
  const g = k.at(x, z, ry, 0.12)
  for (const s of [-1, 1]) {
    const w = k.mesh(new CylinderGeometry(0.7, 0.7, 0.04, 40), c.steel, g, s * 0.75, 0.85, 0)
    w.rotation.z = PI / 2
  }
  const drum = k.cyl(g, 0.45, 0.45, 1.46, new MeshStandardMaterial({ color: '#1b4fb8', roughness: 0.6 }), 0, 0.85, 0, 32)
  drum.rotation.z = PI / 2
  const stripes = k.cyl(g, 0.46, 0.46, 0.3, new MeshStandardMaterial({ color: '#c8262b', roughness: 0.6 }), -0.55, 0.85, 0, 32)
  stripes.rotation.z = PI / 2
  k.box(g, 1.6, 0.06, 0.8, c.steel, 0, 0.12, 0)
  for (const [a, b] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) k.sphere(g, 0.06, c.grip, a, 0.06, b)
}

/** Poolside rinse shower: stainless column with a rain head. */
export function rinseShower(p: P, x: number, z: number, y: number) {
  const { k, c } = p
  const g = k.at(x, z, 0, y)
  k.cyl(g, 0.05, 0.05, 2.3, c.chrome, 0, 1.15, 0, 16)
  k.box(g, 0.05, 0.05, 0.35, c.chrome, 0, 2.28, 0.16)
  k.cyl(g, 0.12, 0.12, 0.02, c.chrome, 0, 2.25, 0.32, 20)
  k.cyl(g, 0.3, 0.3, 0.02, c.grating, 0, 0.01, 0, 24)
}

/* ---------------- outdoors ---------------- */

export function bollard(p: P, x: number, z: number, y: number) {
  const { k, c } = p
  const g = k.at(x, z, 0, y)
  k.box(g, 0.14, 0.72, 0.14, c.frame, 0, 0.36, 0)
  k.box(g, 0.145, 0.1, 0.145, c.path, 0, 0.6, 0, false)
}

/** Slim pole with an angled floodlight head, for the pool deck. */
export function lightPole(p: P, x: number, z: number, ry: number, y: number, h = 6.5) {
  const { k, c } = p
  const g = k.at(x, z, ry, y)
  k.cyl(g, 0.06, 0.09, h, c.frame, 0, h / 2, 0, 12)
  const head = k.box(g, 0.7, 0.12, 0.4, c.frame, 0, h, 0.25)
  head.rotation.x = 0.35
  const lens = k.box(g, 0.62, 0.02, 0.32, c.path, 0, h - 0.07, 0.28, false)
  lens.rotation.x = 0.35
}

/** A parked car at scale: body, glasshouse and wheels. */
export function car(p: P, x: number, z: number, ry: number, color: string, y: number) {
  const { k, c } = p
  const g = k.at(x, z, ry, y)
  const paint = new MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.6 })
  k.soft(g, 1.85, 0.62, 4.7, 0.12, paint, 0, 0.55, 0)
  k.soft(g, 1.6, 0.5, 2.5, 0.14, paint, 0, 1.08, -0.15)
  k.box(g, 1.62, 0.36, 2.3, new MeshStandardMaterial({ color: '#16191c', roughness: 0.05, metalness: 0.4 }), 0, 1.1, -0.15, false)
  const wheel = new CylinderGeometry(0.34, 0.34, 0.24, 24)
  wheel.rotateZ(PI / 2)
  for (const s of [-1, 1]) for (const w of [-1.45, 1.45]) k.mesh(wheel, c.grip, g, s * 0.84, 0.34, w)
  for (const s of [-1, 1]) k.box(g, 0.3, 0.08, 0.02, c.path, s * 0.6, 0.62, 2.36, false)
}

/** Teak pergola with slatted roof, on four columns. */
export function pergola(p: P, x: number, z: number, w: number, d: number, y: number) {
  const { k } = p
  const g = k.at(x, z, 0, y)
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.box(g, 0.16, 2.8, 0.16, k.m.teak, (a * w) / 2, 1.4, (b * d) / 2)
  for (const s of [-1, 1]) k.box(g, w + 0.3, 0.2, 0.12, k.m.teak, 0, 2.8, (s * d) / 2)
  for (let sx = -w / 2; sx <= w / 2 + 0.01; sx += 0.3) k.box(g, 0.06, 0.14, d + 0.4, k.m.teak, sx, 2.95, 0)
}
