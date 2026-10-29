import { CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Path, Shape, type Material } from 'three'
import type { Kit } from '../kit'
import { rng, type Paint } from '../textures'
import { cabinet, type Bay } from './cabinets'

/*
 * The workspace under the bedroom window: a walnut desk on a light-grey three-drawer pedestal and
 * a walnut end panel, a laptop, an articulated desk lamp, and an ergonomic office chair.
 * Built in the desk's own frame: x along the wall (0 … w), z out from the wall (0 … d), y up.
 */

const std = (color: string, roughness: number, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })

export const DESK = { w: 1.05, d: 0.6, h: 0.75, top: 0.028 }

const mesh = (fabricWeave: Paint, k: Kit, tone: string) => {
  const t = k.tex.painted(256, 256, fabricWeave)
  t.repeat.set(4, 4)
  return new MeshPhysicalMaterial({ map: t, color: tone, roughness: 0.95, sheen: 0.4, sheenRoughness: 0.6, sheenColor: '#d9d6d0' })
}

/** A tight mesh weave for the chair back, and a woven seat fabric. */
const meshWeave: Paint = (g, w, h) => {
  g.fillStyle = '#3a3b3d'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#5b5d60'
  for (let y = 0; y < h; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < w; x += 4) g.fillRect(x, y, 2, 2)
}
const seatWeave: Paint = (g, w, h) => {
  const r = rng(301)
  g.fillStyle = '#5a5b5e'
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 2)
    for (let x = 0; x < w; x += 2) {
      const t = (r() - 0.5) * 22
      g.fillStyle = `rgb(${90 + t},${91 + t},${95 + t})`
      g.fillRect(x, y, 2, 2)
    }
}

interface DeskMats {
  walnut: (w: number, h: number) => Material
  greyLam: Material
  interior: Material
  drawer: Material
  brass: Material
  black: Material
  lampBulb: MeshStandardMaterial
}

function box(k: Kit, p: Group, [x0, x1]: [number, number], [y0, y1]: [number, number], [z0, z1]: [number, number], mat: Material, cast = true) {
  return k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

/** Stationery for the drawers: notebooks, a document tray, pens and pencils, sticky notes. */
function stationery(k: Kit, kind: number) {
  const paper = std('#f3f1ec', 0.9)
  const covers = [std('#2f3a44', 0.7), std('#8a6a4f', 0.7), std('#b9b0a2', 0.7), std('#5c4033', 0.7)]
  const pens = [std('#1b1b1d', 0.4, 0.3), std('#b08d57', 0.3, 0.9), std('#2a4a7a', 0.5)]
  return (p: Group, b: Bay) => {
    const y = b.floors[0]
    const cx = (b.x0 + b.x1) / 2
    const cz = (b.z0 + b.z1) / 2
    if (kind === 0) {
      // Top drawer: a pen tray with pens and pencils, sticky notes and a stapler.
      box(k, p, [b.x0 + 0.02, b.x0 + 0.2], [y, y + 0.012], [cz - 0.12, cz + 0.12], std('#cfc9bf', 0.7))
      for (let i = 0; i < 6; i++) {
        const pen = k.cyl(p, 0.0045, 0.0045, 0.14, pens[i % 3], b.x0 + 0.05 + i * 0.022, y + 0.017, cz, 10)
        pen.rotation.x = Math.PI / 2
      }
      for (let i = 0; i < 3; i++) box(k, p, [cx + 0.02 + i * 0.002, cx + 0.095 + i * 0.002], [y + i * 0.012, y + 0.012 + i * 0.012], [cz - 0.13, cz - 0.055], std(['#f2d675', '#e9a99a', '#a8d0c8'][i], 0.9))
      box(k, p, [cx + 0.02, cx + 0.06], [y, y + 0.045], [cz + 0.02, cz + 0.17], std('#202124', 0.4, 0.3))
    } else if (kind === 1) {
      // Middle drawer: notebooks, stacked a little askew.
      for (let i = 0; i < 4; i++) {
        const n = box(k, p, [cx - 0.1, cx + 0.1], [y + i * 0.016, y + 0.015 + i * 0.016], [cz - 0.14, cz + 0.14], covers[i])
        n.rotation.y = (i % 2 ? 1 : -1) * 0.05
      }
    } else {
      // Deep drawer: a box file and a stack of documents.
      box(k, p, [b.x0 + 0.03, b.x0 + 0.11], [y, y + 0.28], [cz - 0.16, cz + 0.16], covers[0])
      for (let i = 0; i < 40; i++) box(k, p, [cx - 0.03, cx + 0.15], [y + i * 0.0015, y + 0.0012 + i * 0.0015], [cz - 0.15, cz + 0.15], paper, false)
    }
  }
}

/** The desk: walnut top and end panel, the drawer pedestal, a laptop, a lamp, notebook and pen. */
export function desk(k: Kit, g: Group, m: DeskMats) {
  const { w, d, h, top } = DESK
  // Pedestal: three drawers on runners (pencil, notebook, file), in a light-grey carcass.
  const PW = 0.42
  const frame = new Group()
  // Drawers face out of the wall (+z here); cabinet frames face +z with their back at −d.
  frame.position.set(0.0, 0.0, d - 0.02)
  g.add(frame)
  cabinet(k, frame, PW, h - top, d - 0.04, { kind: 'drawers', id: 'desk', rows: [0.36, 0.56], fill: [stationery(k, 2), stationery(k, 1), stationery(k, 0)] }, {
    front: m.greyLam,
    interior: m.interior,
    drawer: m.drawer,
  })
  // Brass pulls on each drawer front move with it.
  for (const node of frame.children) if (node.name.startsWith('drawer_')) k.box(node as Group, 0.16, 0.012, 0.016, m.brass, PW / 2, node.name.endsWith('_3') ? 0.13 : node.name.endsWith('_2') ? 0.14 : 0.3, 0.008)
  // Walnut top with square corners and a lightly eased front edge, and the walnut end panel.
  box(k, g, [0, w], [h - top, h], [0, d - 0.006], m.walnut(w, d))
  const edge = k.cyl(g, 0.006, 0.006, w, m.walnut(w, 0.02), w / 2, h - top / 2, d - 0.006, 10)
  edge.rotation.z = Math.PI / 2
  edge.scale.set(top / 0.012, 1, 1)
  box(k, g, [w - 0.025, w], [0, h - top], [0.02, d - 0.02], m.walnut(d, h))
  // A modesty rail between pedestal and panel.
  box(k, g, [PW, w - 0.025], [h - top - 0.08, h - top], [0.02, 0.04], m.walnut(w, 0.08))

  // Laptop, open: aluminium base and lid, dark screen with a faint glow.
  const alu = std('#c4c6c9', 0.3, 0.85)
  const lap = new Group()
  lap.position.set(0.62, h, 0.32)
  lap.rotation.y = -0.08
  g.add(lap)
  k.soft(lap, 0.31, 0.014, 0.215, 0.004, alu, 0, 0.007, 0)
  box(k, lap, [-0.13, 0.13], [0.0141, 0.0145], [-0.09, 0.02], std('#2b2c2f', 0.6), false)
  const lid = new Group()
  lid.position.set(0, 0.014, -0.105)
  lid.rotation.x = -0.32
  lap.add(lid)
  k.soft(lid, 0.31, 0.21, 0.006, 0.003, alu, 0, 0.105, 0)
  box(k, lid, [-0.145, 0.145], [0.008, 0.2], [0.0031, 0.0034], std('#0d1117', 0.15, 0.2), false)

  // Articulated desk lamp in brass and black, its shade over the desk's working area.
  const lamp = new Group()
  lamp.position.set(0.9, h, 0.14)
  g.add(lamp)
  k.cyl(lamp, 0.07, 0.075, 0.02, m.black, 0, 0.01, 0, 28)
  const lower = new Group()
  lower.position.y = 0.02
  lower.rotation.z = 0.25
  lamp.add(lower)
  k.cyl(lower, 0.006, 0.006, 0.36, m.brass, 0, 0.18, 0, 10)
  const upper = new Group()
  upper.position.y = 0.36
  upper.rotation.z = -1.25
  lower.add(upper)
  k.sphere(upper, 0.012, m.black, 0, 0, 0)
  k.cyl(upper, 0.006, 0.006, 0.3, m.brass, 0, 0.15, 0, 10)
  const head = new Group()
  head.position.y = 0.3
  head.rotation.z = -0.9
  upper.add(head)
  const shade = new Mesh(new CylinderGeometry(0.02, 0.065, 0.12, 24, 1, true), m.black)
  shade.material = (m.black as MeshStandardMaterial).clone()
  ;(shade.material as MeshStandardMaterial).side = DoubleSide
  shade.position.y = 0.06
  shade.castShadow = true
  head.add(shade)
  k.cyl(head, 0.055, 0.055, 0.004, m.lampBulb, 0, 0.115, 0, 20).castShadow = false

  // Notebook and pen beside the laptop.
  k.soft(g, 0.16, 0.012, 0.22, 0.003, std('#2f3a44', 0.7), 0.3, h + 0.006, 0.35)
  const pen = k.cyl(g, 0.0045, 0.0045, 0.14, std('#b08d57', 0.3, 0.9), 0.33, h + 0.017, 0.35, 10)
  pen.rotation.set(Math.PI / 2, 0, 0.4)
  return { lampHead: head }
}

/** A curved band in plan, for the chair's contoured back. */
function backBand(r: number, t: number, a: number) {
  const s = new Shape()
  // Centred on +y in plan, which becomes the chair's back (−z) once stood upright.
  s.absarc(0, 0, r + t, Math.PI / 2 - a / 2, Math.PI / 2 + a / 2, false)
  const p = new Path()
  p.absarc(0, 0, r, Math.PI / 2 + a / 2, Math.PI / 2 - a / 2, true)
  s.curves.push(...p.curves)
  s.closePath()
  return s
}

/** An ergonomic office chair facing +z: five-star base on casters, gas lift, padded seat, mesh back, arms. */
export function officeChair(k: Kit, parent: Group, x: number, z: number, ry: number) {
  const g = new Group()
  g.position.set(x, 0, z)
  g.rotation.y = ry
  parent.add(g)
  const black = std('#1a1a1c', 0.45, 0.2)
  const chrome = std('#c9ccd0', 0.2, 1)
  const seatMat = mesh(seatWeave, k, '#ffffff')
  const backMat = mesh(meshWeave, k, '#ffffff')
  backMat.side = DoubleSide
  // Base: five tapered arms and twin-wheel casters.
  for (let i = 0; i < 5; i++) {
    const arm = new Group()
    arm.rotation.y = (i / 5) * Math.PI * 2
    g.add(arm)
    const a = k.box(arm, 0.04, 0.03, 0.3, black, 0, 0.085, 0.16)
    a.rotation.x = 0.08
    const caster = new Group()
    caster.position.set(0, 0.03, 0.31)
    arm.add(caster)
    k.box(caster, 0.025, 0.03, 0.03, black, 0, 0.03, 0)
    const wheel = new CylinderGeometry(0.025, 0.025, 0.012, 18)
    wheel.rotateZ(Math.PI / 2)
    for (const s of [-1, 1]) {
      const wh = new Mesh(wheel, black)
      wh.position.set(s * 0.01, 0, 0.012)
      wh.castShadow = true
      caster.add(wh)
    }
  }
  k.cyl(g, 0.045, 0.05, 0.06, black, 0, 0.1, 0, 20)
  // Gas lift in a black shroud and chrome piston, and the tilt mechanism under the seat.
  k.cyl(g, 0.028, 0.03, 0.16, black, 0, 0.21, 0, 16)
  k.cyl(g, 0.02, 0.02, 0.1, chrome, 0, 0.33, 0, 16)
  k.box(g, 0.18, 0.04, 0.2, black, 0, 0.4, 0)
  k.cyl(g, 0.006, 0.006, 0.12, black, 0.12, 0.4, 0.05, 8).rotation.z = Math.PI / 2
  // Seat: a padded cushion with a waterfall front edge, on a black shell.
  k.soft(g, 0.5, 0.02, 0.48, 0.008, black, 0, 0.43, 0)
  const seatShape = new Shape()
  seatShape.moveTo(-0.24, -0.23)
  seatShape.quadraticCurveTo(-0.25, 0.23, -0.2, 0.24)
  seatShape.lineTo(0.2, 0.24)
  seatShape.quadraticCurveTo(0.25, 0.23, 0.24, -0.23)
  seatShape.quadraticCurveTo(0, -0.26, -0.24, -0.23)
  const seat = new Mesh(new ExtrudeGeometry(seatShape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.022, bevelSegments: 6, curveSegments: 12 }), seatMat)
  seat.rotation.x = -Math.PI / 2
  seat.position.set(0, 0.465, 0)
  seat.castShadow = seat.receiveShadow = true
  g.add(seat)
  // Back: a contoured mesh panel in a black frame, on a spine from the mechanism.
  k.box(g, 0.06, 0.03, 0.12, black, 0, 0.42, -0.25)
  const spine = k.box(g, 0.05, 0.32, 0.025, black, 0, 0.58, -0.31)
  spine.rotation.x = 0.1
  const band = new ExtrudeGeometry(backBand(0.42, 0.012, 1.15), { depth: 0.5, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 24 })
  band.rotateX(-Math.PI / 2)
  const back = new Mesh(band, backMat)
  back.position.set(0, 0.56, 0.1)
  back.rotation.x = -0.12
  back.castShadow = true
  g.add(back)
  // Lumbar pad and the armrests: posts with soft pads.
  k.soft(g, 0.3, 0.07, 0.03, 0.012, black, 0, 0.66, -0.3)
  for (const s of [-1, 1]) {
    k.box(g, 0.03, 0.2, 0.05, black, s * 0.25, 0.53, -0.02)
    k.box(g, 0.05, 0.02, 0.06, black, s * 0.23, 0.44, -0.02)
    k.soft(g, 0.07, 0.03, 0.24, 0.012, black, s * 0.25, 0.645, 0.01)
  }
}
