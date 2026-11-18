import { Group, type Material, type Object3D } from 'three'
import { place } from '../signs'
import { lathe } from './cafe'
import { at, PI, type Shop } from './kit'
import type { PerfumeMaterials, Print } from './perfumeArt'

/*
 * The parfumerie's bottles, each built as such bottles are made and at their real size: thick glass
 * (an outer skin and the juice inside it, the glass's heavy base below the juice), the dip tube
 * running down through the juice, the crimped metal collar, then either the atomiser (on testers)
 * or the cap; the label printed or a plate fixed to the glass. Every product stands on its base at
 * local (0, 0, 0) facing +z.
 */

type M = PerfumeMaterials

export type FlaconStyle = 'slab' | 'column' | 'faceted' | 'orb' | 'flask' | 'cylinder' | 'decanter' | 'travel' | 'oil' | 'mist' | 'vial'
export type CapStyle = 'block' | 'cube' | 'dome' | 'disc' | 'tube' | 'stopper' | 'ribbed' | 'none'

export interface Flacon {
  style: FlaconStyle
  /** The juice's colour. */
  juice: string
  glass?: 'clear' | 'thick' | 'smoke' | 'cobalt' | 'rosy' | 'frosted' | 'frostedPink' | 'amber'
  cap?: CapStyle
  capMat?: 'gold' | 'roseGold' | 'silver' | 'gunmetal' | 'capBlack' | 'capWhite' | 'capWood' | 'crystal'
  metal?: 'gold' | 'roseGold' | 'silver' | 'gunmetal'
  print: Print
  /** 1 for the full size (100 ml); smaller sizes scale down. */
  scale?: number
}

/** The neck: the crimped collar, and on a tester the atomiser with its nozzle. */
function neck(s: Shop, m: M, g: Object3D, top: number, metal: Material, tester: boolean) {
  const { k } = s.e
  k.cyl(g, 0.0098, 0.0102, 0.009, metal, 0, top + 0.0045, 0, 24)
  k.cyl(g, 0.0106, 0.0106, 0.0015, metal, 0, top + 0.0008, 0, 24)
  if (!tester) return top + 0.009
  k.cyl(g, 0.0021, 0.0021, 0.004, metal, 0, top + 0.011, 0, 10)
  k.cyl(g, 0.0072, 0.0072, 0.011, metal, 0, top + 0.0185, 0, 24)
  k.cyl(g, 0.0072, 0.0068, 0.0012, metal, 0, top + 0.0246, 0, 24)
  const hole = k.cyl(g, 0.0009, 0.0009, 0.0015, m.blackMatte, 0, top + 0.019, 0.0072, 8)
  hole.rotation.x = PI / 2
  return top + 0.025
}

/** The cap over the collar. Returns the height of its top. */
function cap(s: Shop, g: Object3D, style: CapStyle, at0: number, mat: Material, sc: number) {
  const { k } = s.e
  const y = at0
  if (style === 'block') {
    k.soft(g, 0.044 * sc, 0.038 * sc, 0.034 * sc, 0.003, mat, 0, y + 0.019 * sc, 0)
    return y + 0.038 * sc
  }
  if (style === 'cube') {
    k.soft(g, 0.034 * sc, 0.034 * sc, 0.034 * sc, 0.002, mat, 0, y + 0.017 * sc, 0)
    return y + 0.034 * sc
  }
  if (style === 'dome') {
    lathe(g, [[0.001, 0], [0.019 * sc, 0], [0.021 * sc, 0.008 * sc], [0.019 * sc, 0.022 * sc], [0.011 * sc, 0.03 * sc], [0.001, 0.032 * sc]], mat, 0, y, 0, 32)
    return y + 0.032 * sc
  }
  if (style === 'disc') {
    // A wide faceted disc, its edge catching the light.
    lathe(g, [[0.001, 0], [0.012, 0], [0.026 * sc, 0.006], [0.028 * sc, 0.014], [0.026 * sc, 0.02], [0.001, 0.021]], mat, 0, y, 0, 10)
    return y + 0.021
  }
  if (style === 'tube') {
    k.cyl(g, 0.0175 * sc, 0.0175 * sc, 0.042 * sc, mat, 0, y + 0.021 * sc, 0, 32)
    k.cyl(g, 0.0168 * sc, 0.0175 * sc, 0.0015, mat, 0, y + 0.042 * sc + 0.0007, 0, 32)
    return y + 0.043 * sc
  }
  if (style === 'ribbed') {
    k.cyl(g, 0.016 * sc, 0.016 * sc, 0.036 * sc, mat, 0, y + 0.018 * sc, 0, 32)
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * PI * 2
      k.box(g, 0.0016, 0.034 * sc, 0.0016, mat, Math.cos(a) * 0.0163 * sc, y + 0.018 * sc, Math.sin(a) * 0.0163 * sc, false)
    }
    return y + 0.036 * sc
  }
  if (style === 'stopper') {
    // A cut-crystal stopper: a neck, a collar, a tall faceted finial.
    lathe(g, [[0.001, 0], [0.008, 0], [0.008, 0.012], [0.014, 0.014], [0.026 * sc, 0.03 * sc], [0.022 * sc, 0.055 * sc], [0.012 * sc, 0.068 * sc], [0.001, 0.072 * sc]], mat, 0, y - 0.01, 0, 8)
    return y + 0.062 * sc
  }
  return y
}

/**
 * A bottle of perfume. `tester` leaves its cap off and shows the atomiser; the label on its front.
 * Returns the group and the height of its atomiser's nozzle (for a tester's mist).
 */
export function flacon(s: Shop, m: M, p: Object3D, f: Flacon, x: number, y: number, z: number, yaw: number, tester = false) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  const sc = f.scale ?? 1
  g.scale.setScalar(sc)
  const glass = m[f.glass ?? 'thick'] as Material
  const juice = m.juice(f.juice, f.glass === 'frosted' || f.glass === 'frostedPink' ? 0.5 : 0.78)
  const metal = m[f.metal ?? 'gold'] as Material
  const capMat = f.capMat === 'crystal' ? m.crystal : (m[f.capMat ?? f.metal ?? 'gold'] as Material)
  const tube = (top: number, base: number) => k.cyl(g, 0.0012, 0.0012, top - base, m.dipTube, 0, (top + base) / 2, 0, 6).castShadow = false
  let top = 0
  let front = 0
  let labelY = 0
  let labelW = 0.04
  let labelH = 0.026
  switch (f.style) {
    case 'slab': {
      k.soft(g, 0.072, 0.108, 0.036, 0.006, glass, 0, 0.054, 0)
      k.soft(g, 0.056, 0.078, 0.022, 0.004, juice, 0, 0.018 + 0.039, 0)
      top = 0.108
      front = 0.0182
      labelY = 0.062
      labelW = 0.046
      labelH = 0.03
      tube(top, 0.02)
      break
    }
    case 'column': {
      k.soft(g, 0.046, 0.122, 0.046, 0.004, glass, 0, 0.061, 0)
      k.soft(g, 0.034, 0.096, 0.034, 0.003, juice, 0, 0.014 + 0.048, 0)
      top = 0.122
      front = 0.0232
      labelY = 0.07
      labelW = 0.034
      labelH = 0.046
      tube(top, 0.016)
      break
    }
    case 'faceted': {
      lathe(g, [[0.001, 0], [0.036, 0], [0.044, 0.012], [0.046, 0.05], [0.04, 0.078], [0.014, 0.088], [0.0105, 0.092], [0.001, 0.092]], glass, 0, 0, 0, 8, false)
      lathe(g, [[0.001, 0.014], [0.032, 0.014], [0.038, 0.022], [0.039, 0.05], [0.033, 0.072], [0.001, 0.072]], juice, 0, 0, 0, 8, false)
      top = 0.092
      front = 0.0425
      labelY = 0.045
      labelW = 0.034
      labelH = 0.022
      tube(top, 0.016)
      break
    }
    case 'orb': {
      lathe(g, [[0.001, 0], [0.026, 0], [0.04, 0.012], [0.047, 0.04], [0.042, 0.066], [0.022, 0.084], [0.0105, 0.088], [0.001, 0.088]], glass, 0, 0, 0, 40, false)
      lathe(g, [[0.001, 0.012], [0.022, 0.012], [0.035, 0.022], [0.04, 0.04], [0.036, 0.058], [0.001, 0.06]], juice, 0, 0, 0, 32, false)
      top = 0.088
      front = 0.0465
      labelY = 0.04
      labelW = 0.03
      labelH = 0.018
      tube(top, 0.014)
      break
    }
    case 'flask': {
      k.soft(g, 0.074, 0.112, 0.03, 0.012, glass, 0, 0.056, 0)
      k.soft(g, 0.06, 0.084, 0.017, 0.008, juice, 0, 0.014 + 0.042, 0)
      k.cyl(g, 0.011, 0.014, 0.008, glass, 0, 0.116, 0, 20)
      top = 0.12
      front = 0.0152
      labelY = 0.058
      labelW = 0.05
      labelH = 0.03
      tube(top, 0.016)
      break
    }
    case 'cylinder': {
      lathe(g, [[0.001, 0], [0.023, 0], [0.0245, 0.003], [0.0245, 0.118], [0.021, 0.124], [0.0105, 0.126], [0.001, 0.126]], glass, 0, 0, 0, 36, false)
      lathe(g, [[0.001, 0.014], [0.019, 0.014], [0.019, 0.104], [0.001, 0.104]], juice, 0, 0, 0, 28, false)
      top = 0.126
      front = 0.0247
      labelY = 0.064
      labelW = 0.028
      labelH = 0.05
      tube(top, 0.016)
      break
    }
    case 'decanter': {
      lathe(g, [[0.001, 0], [0.04, 0], [0.047, 0.01], [0.047, 0.05], [0.04, 0.078], [0.02, 0.098], [0.013, 0.108], [0.013, 0.118], [0.001, 0.118]], glass, 0, 0, 0, 12, false)
      lathe(g, [[0.001, 0.016], [0.036, 0.016], [0.041, 0.024], [0.041, 0.048], [0.034, 0.072], [0.001, 0.08]], juice, 0, 0, 0, 12, false)
      // A gold band round its neck, a medallion on a cord.
      k.cyl(g, 0.0142, 0.0142, 0.006, metal, 0, 0.104, 0, 24)
      top = 0.118
      front = 0.046
      labelY = 0.036
      labelW = 0.03
      labelH = 0.02
      tube(top, 0.018)
      break
    }
    case 'travel': {
      // A 10 ml atomiser in a fluted metal case, a slot showing the glass and juice inside.
      k.cyl(g, 0.0112, 0.0112, 0.09, metal, 0, 0.045, 0, 28)
      k.box(g, 0.006, 0.05, 0.001, juice, 0, 0.042, 0.0108, false)
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * PI * 2
        if (Math.abs(Math.sin(a) - 1) < 0.2) continue
        k.box(g, 0.0012, 0.08, 0.0012, metal, Math.cos(a) * 0.0114, 0.045, Math.sin(a) * 0.0114, false)
      }
      k.cyl(g, 0.0118, 0.0118, 0.004, metal, 0, 0.092, 0, 28)
      return { g, nozzle: 0.096 * sc }
    }
    case 'oil': {
      lathe(g, [[0.001, 0], [0.0125, 0], [0.0132, 0.003], [0.0132, 0.046], [0.008, 0.054], [0.007, 0.058], [0.001, 0.058]], m.amber, 0, 0, 0, 28, false)
      lathe(g, [[0.001, 0.006], [0.011, 0.006], [0.011, 0.04], [0.001, 0.04]], juice, 0, 0, 0, 20, false)
      k.cyl(g, 0.0095, 0.0095, 0.03, metal, 0, 0.058 + 0.015, 0, 24)
      place(g, 0.02, 0.018, m.print({ ...f.print, w: 160, h: 144 }), m.printMat, 0, 0.026, 0.0134, 0)
      return { g, nozzle: 0.09 * sc }
    }
    case 'mist': {
      // 250 ml of body mist in a frosted bottle, the white pump, a clear overcap.
      lathe(g, [[0.001, 0], [0.028, 0], [0.03, 0.004], [0.03, 0.16], [0.024, 0.17], [0.012, 0.174], [0.001, 0.174]], glass, 0, 0, 0, 36, false)
      k.cyl(g, 0.013, 0.013, 0.012, m.capWhite, 0, 0.18, 0, 24)
      k.cyl(g, 0.0085, 0.0085, 0.014, m.capWhite, 0, 0.193, 0, 20)
      lathe(g, [[0.001, 0], [0.0145, 0], [0.0145, 0.03], [0.012, 0.036], [0.001, 0.036]], m.clear, 0, 0.176, 0, 28, false)
      place(g, 0.04, 0.07, m.print({ ...f.print, w: 160, h: 256 }), m.printMat, 0, 0.085, 0.0302, 0)
      return { g, nozzle: 0.2 * sc }
    }
    case 'vial': {
      lathe(g, [[0.001, 0], [0.0055, 0], [0.0058, 0.002], [0.0058, 0.048], [0.001, 0.048]], m.clear, 0, 0, 0, 16, false)
      lathe(g, [[0.001, 0.002], [0.0045, 0.002], [0.0045, 0.036], [0.001, 0.036]], juice, 0, 0, 0, 12, false)
      k.cyl(g, 0.006, 0.006, 0.012, m.capBlack, 0, 0.054, 0, 16)
      return { g, nozzle: 0.06 * sc }
    }
  }
  const label = place(g, labelW, labelH, m.print({ ...f.print, w: Math.round(256 * Math.min(1, labelW / labelH)), h: Math.round(256 * Math.min(1, labelH / labelW)) }), m.printMat, 0, labelY, front + 0.0006, 0)
  label.castShadow = false
  const collarTop = neck(s, m, g, top, metal, tester)
  if (tester) return { g, nozzle: (top + 0.019) * sc }
  cap(s, g, f.cap ?? 'cube', collarTop, capMat, 1)
  return { g, nozzle: (top + 0.02) * sc }
}

/** A fragrance's box: rigid board in its colour, the front printed, a foil line round it. */
export function carton(s: Shop, m: M, p: Object3D, x: number, y: number, z: number, yaw: number, w: number, h: number, d: number, color: string, print: Print) {
  const g = at(p, x, y, z, yaw)
  s.e.k.box(g, w, h, d, m.board(color), 0, h / 2, 0)
  place(g, w * 0.94, h * 0.94, m.print({ ...print, box: true, w: Math.round(256 * Math.min(1, w / h)), h: Math.round(256 * Math.min(1, h / w)) }), m.printMat, 0, h / 2, d / 2 + 0.0006, 0)
  return g
}

/** A gift set: a rigid box with a satin ribbon round it and a bow, its front printed. */
export function giftSet(s: Shop, m: M, p: Object3D, x: number, y: number, z: number, yaw: number, w: number, h: number, d: number, color: string, ribbon: Material, print: Print) {
  const { k } = s.e
  const g = carton(s, m, p, x, y, z, yaw, w, h, d, color, print)
  k.box(g, w + 0.002, h + 0.002, 0.012, ribbon, 0, h / 2, -d * 0.2, false)
  k.box(g, 0.012, h + 0.002, d + 0.002, ribbon, w * 0.3, h / 2, 0, false)
  for (const s2 of [-1, 1]) {
    const loop = k.soft(g, 0.03, 0.006, 0.016, 0.003, ribbon, w * 0.3 + s2 * 0.014, h + 0.004, -d * 0.2)
    loop.rotation.z = s2 * 0.35
  }
  return g
}

/**
 * The discovery set: a black box whose lid hinges up (door_), eight 2 ml vials of the collection
 * standing in a cream insert inside.
 */
export function discoveryBox(s: Shop, m: M, p: Object3D, name: string, x: number, y: number, z: number, yaw: number, juices: string[], print: Print) {
  const { k } = s.e
  const g = at(p, x, y, z, yaw)
  const w = 0.22
  const d = 0.11
  const h = 0.075
  // The tray: its floor and four walls, open at the top, a cream insert holding the vials upright.
  const board = m.board('#1d1b1b')
  const tray = new Group()
  g.add(tray)
  k.box(tray, w, 0.006, d, board, 0, 0.003, 0)
  for (const sx of [-1, 1]) k.box(tray, 0.006, h, d, board, sx * (w / 2 - 0.003), h / 2, 0)
  for (const sz of [-1, 1]) k.box(tray, w, h, 0.006, board, 0, h / 2, sz * (d / 2 - 0.003))
  k.box(tray, w - 0.012, 0.03, d - 0.012, m.board('#efe6da'), 0, 0.021, 0, false)
  juices.forEach((jc, i) => flacon(s, m, tray, { style: 'vial', juice: jc, print }, -w / 2 + 0.02 + i * ((w - 0.04) / (juices.length - 1)), 0.006, 0, 0))
  const lid = new Group()
  lid.name = `door_parfum_${name}`
  lid.userData.label = 'Lid'
  lid.userData.openAngle = -1.75
  lid.userData.axis = 'x'
  lid.position.set(0, h, -d / 2)
  g.add(lid)
  k.box(lid, w + 0.004, 0.012, d + 0.004, m.board('#1d1b1b'), 0, 0.006, d / 2)
  place(lid, w * 0.7, d * 0.7, m.print({ ...print, box: true, w: 256, h: 128 }), m.printMat, 0, 0.0125, d / 2, 0, true)
  return { g, tray }
}
