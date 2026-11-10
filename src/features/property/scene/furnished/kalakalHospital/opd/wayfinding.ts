import { Group, Mesh, PlaneGeometry, type Material } from 'three'
import { signPanel } from '../erKit'
import type { OpdCtx, Room } from './ctx'
import { directoryRow, direction, floorBoard, type Way } from './paints'
import { CEILING, STAIR } from './plan'

/*
 * The OPD's wayfinding, as a hospital's signage schedule would set it out. Facing the lifts on
 * every floor: the floor's board (its number, its name, its departments) and its directory, a row
 * per department with its room numbers. Hung over the corridors at their junctions: double-sided
 * direction signs, a department per row with its arrow, the arrow worked out for each face from
 * where the department really is. Every row of a directory or a direction sign is a `goto_` sign:
 * tapped, it takes the visitor into that department. Lit exit signs over the way to each stair.
 */

/** Hanging signs per floor: where (plan x, z), which way they face (across a corridor along x or z), the rooms they show. */
const HANGING: Record<number, { x: number; z: number; along: 'x' | 'z'; rooms: string[] }[]> = {
  0: [
    { x: -6.0, z: -1.2, along: 'z', rooms: ['security', 'insurance', 'vaccination'] },
    { x: 0.35, z: -4.6, along: 'x', rooms: ['services', 'ipdInsurance', 'pharmacy'] },
    { x: 1.0, z: -19.4, along: 'x', rooms: ['pharmacy', 'records', 'adminOffice'] },
  ],
  1: [
    { x: -6.0, z: -1.2, along: 'z', rooms: ['medicine', 'cardiology', 'neurology'] },
    { x: 0.35, z: -4.6, along: 'x', rooms: ['nurses', 'r105', 'exam'] },
    { x: -2.0, z: -19.4, along: 'x', rooms: ['r101', 'r102', 'dirty'] },
    { x: 8.96, z: -12.0, along: 'z', rooms: ['r103', 'r104', 'doctors'] },
  ],
  2: [
    { x: -6.0, z: -1.2, along: 'z', rooms: ['xray', 'xrayControl'] },
    { x: 0.35, z: -4.6, along: 'x', rooms: ['icuWaiting', 'intlLounge', 'counselling'] },
    { x: 8.96, z: -8.0, along: 'z', rooms: ['icuStation', 'isolation', 'icu4'] },
    { x: 4.0, z: -19.4, along: 'x', rooms: ['vent1', 'vent2', 'icuStation'] },
  ],
  3: [
    { x: -6.0, z: -1.2, along: 'z', rooms: ['ct', 'ctControl'] },
    { x: 0.35, z: -4.6, along: 'x', rooms: ['transfer', 'preop', 'pacu'] },
    { x: 8.96, z: -12.0, along: 'z', rooms: ['pacu', 'dirtyOt', 'cssd'] },
    { x: 4.0, z: -19.4, along: 'x', rooms: ['changeM', 'changeF', 'cssd'] },
  ],
}

/** What each floor's OPD board lists under its name. */
const DEPARTMENTS: Record<number, string[]> = {
  0: ['OPD Reception · Appointments · Vaccination', 'Main Reception · Admissions · Pharmacy →', 'Billing · Insurance · Cash Counter →'],
  1: ['OPD Consultations 101 – 103', 'Inpatient Rooms 101 – 107 →', 'Nurses\' Station · Relatives\' Lounge →'],
  2: ['Digital X-ray 208 – 209', 'Intensive Care Unit →', 'International Patient Wing →'],
  3: ['CT Scan 307 – 308', 'Operation Theatres 1 – 3 →', 'Pre-op · Recovery · OT Waiting →'],
}

const short = (name: string) => name.replace(' Laboratory', ' Lab').replace('Administration & Patient Registration', 'Administration').replace('Sample Receiving & Accessioning', 'Sample Receiving')

/** A row of a sign that leads to a room: a plane named goto_* carrying its target. */
function row(p: Group, w: number, h: number, mat: Material, x: number, y: number, z: number, ry: number, target: string, label: string) {
  const m = new Mesh(new PlaneGeometry(w, h), mat)
  m.position.set(x, y, z)
  m.rotation.y = ry
  m.name = `goto_${target}_${Math.round(x * 100)}_${Math.round(z * 100)}_${Math.round(ry * 100)}`
  m.userData.target = target
  m.userData.label = label
  p.add(m)
  return m
}

export function buildWayfinding(es: OpdCtx[], rooms: Room[][]) {
  es.forEach((e, level) => {
    const { k, m, o } = e
    const y = e.y
    const list = rooms[level]
    const byId = new Map(list.map((r) => [r.spec.id, r]))
    const root = e.root

    // The floor's board and directory on the stair's wall facing the lifts (its corridor face).
    const wallX = STAIR.x1 + 0.1 + 0.006
    const plan = e.plan
    const boardMat = o.sign(`floorboard_${level}`, 1024, 352, floorBoard(plan.label, plan.title.split(' · ')[1] ?? plan.title, DEPARTMENTS[level]))
    signPanel(e, root, 1.6, 0.55, boardMat, wallX, y + 1.95, 1.5, Math.PI / 2, 0.02, o.navy)
    const listed = list.filter((r) => !r.spec.quiet && r.spec.no && r.spec.kind !== 'wet' && r.spec.kind !== 'service').sort((a, b) => (a.spec.no! < b.spec.no! ? -1 : 1))
    // Clear of the corridor's crash rail (to 1.0 m) below, level with the board's top above.
    const top = y + 2.3
    const rowH = Math.min(0.095, (top - y - 1.08) / Math.max(1, listed.length))
    const dw = 1.2
    k.box(root, 0.02, rowH * listed.length + 0.14, dw + 0.04, o.navy, wallX + 0.01, top - (rowH * listed.length) / 2 - 0.03, -0.7)
    const head = o.sign(`dirhead_${level}`, 512, 48, (g, w, h) => {
      g.fillStyle = '#16305a'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#ffffff'
      g.font = `700 ${h * 0.55}px "Helvetica Neue", Helvetica, Arial, sans-serif`
      g.textBaseline = 'middle'
      g.fillText(`FLOOR ${plan.label} · DIRECTORY`, w * 0.03, h * 0.52)
    })
    const hm = new Mesh(new PlaneGeometry(dw, 0.08), head)
    hm.position.set(wallX + 0.021, top + 0.045, -0.7)
    hm.rotation.y = Math.PI / 2
    root.add(hm)
    listed.forEach((r, i) => {
      const mat = o.sign(`dirrow_${level}_${r.spec.id}`, 512, 40, directoryRow(short(r.spec.name), r.spec.no!))
      row(root, dw, rowH - 0.004, mat, wallX + 0.021, top - rowH / 2 - i * rowH, -0.7, Math.PI / 2, r.mesh, r.spec.name)
    })

    // Direction signs hung over the corridors, each row's arrow found for each face.
    for (const s of HANGING[level] ?? []) {
      const targets = s.rooms.map((id) => byId.get(id)).filter((r): r is Room => !!r)
      if (!targets.length) continue
      const g = new Group()
      g.position.set(s.x, y + 2.42, s.z)
      root.add(g)
      const w = 1.3
      const rh = 0.17
      const h = rh * targets.length
      const ceil = y + CEILING - (y + 2.42)
      for (const sx of [-1, 1]) {
        const [rx, rz] = s.along === 'z' ? [sx * 0.5, 0] : [0, sx * 0.5]
        k.cyl(g, 0.004, 0.004, ceil - h / 2, m.stainless, rx, h / 2 + (ceil - h / 2) / 2, rz, 6)
      }
      // The sign's faces: across a corridor along z they face ±z, along x they face ±x.
      const box = s.along === 'z' ? [w, h + 0.02, 0.03] : [0.03, h + 0.02, w]
      k.box(g, box[0], box[1], box[2], o.navy, 0, 0, 0, false)
      for (const sign of [1, -1]) {
        const n: [number, number] = s.along === 'z' ? [0, sign] : [sign, 0]
        const ry = Math.atan2(n[0], n[1])
        targets.forEach((r, i) => {
          // Where the room is, seen by someone reading this face (they look along −n).
          const tx = r.cx - s.x
          const tz = r.cz - s.z
          const fx = -n[0]
          const fz = -n[1]
          const ahead = tx * fx + tz * fz
          const right = tx * -fz + tz * fx
          const way: Way = Math.abs(right) > Math.abs(ahead) * 0.6 ? (right > 0 ? 'right' : 'left') : ahead >= 0 ? 'ahead' : 'back'
          const mat = o.sign(`dir_${level}_${r.spec.id}_${way}`, 512, 72, direction([[`${short(r.spec.name)}${r.spec.no ? `  ${r.spec.no}` : ''}`, way]]))
          const off = 0.016
          row(g, w - 0.02, rh - 0.006, mat, n[0] * off, h / 2 - rh / 2 - i * rh, n[1] * off, ry, r.mesh, r.spec.name)
        })
      }
    }

    // Exit signs: over the way to the OPD stair and the fire stair, lit; on the ground, to the doors out.
    const exit = (x: number, z: number, ry: number, left: boolean) => {
      const g = new Group()
      g.position.set(x, y + CEILING - 0.3, z)
      g.rotation.y = ry
      root.add(g)
      for (const s of [-1, 1]) k.cyl(g, 0.005, 0.005, 0.2, m.stainless, s * 0.13, 0.2, 0, 6)
      k.box(g, 0.36, 0.16, 0.05, m.whitePlastic, 0, 0, 0, false)
      const a = new Mesh(new PlaneGeometry(0.33, 0.13), left ? m.exitL : m.exitR)
      a.position.z = 0.026
      g.add(a)
      const b = new Mesh(new PlaneGeometry(0.33, 0.13), left ? m.exitR : m.exitL)
      b.position.z = -0.026
      b.rotation.y = Math.PI
      g.add(b)
    }
    exit(-6.0, 3.2, Math.PI / 2, true)
    exit(-6.0, -20.4, Math.PI / 2, true)
    exit(-5.6, -9.0, 0, level !== 0)
    // The main block: to the main stair at the back, down the back corridor from the north side.
    exit(3.5, -19.4, Math.PI / 2, false)
    if (level > 0) exit(8.96, -16.5, 0, true)
  })
}
