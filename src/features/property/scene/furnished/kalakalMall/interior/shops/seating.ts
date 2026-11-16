import { CircleGeometry, CylinderGeometry, DoubleSide, LatheGeometry, SphereGeometry, TorusGeometry, Vector2, type Material, type MeshStandardMaterial, type Object3D } from 'three'
import { barrelChair, clubChair, sofa } from '../furniture'
import { at, mesh, PI, pleated, type Shop } from './kit'

/*
 * The boutiques' seating, built as upholstered furniture is: loose cushions with welted seams,
 * pleated cloth in real folds, bases in metal, and the proportions of the designer pieces the
 * references show (a bouclé barrel chair with a mint cushion, a pleated mint pouf, a cream club
 * chair and a low cream sofa with piped cushions).
 */

/** A pouf (or, with a stone top, a side table) in knife-pleated cloth: the pleats are geometry, the top is welted. */
export function pleatedPouf(s: Shop, p: Object3D, x: number, z: number, r: number, h: number, cloth: Material, top?: Material) {
  const { k, lux } = s.e
  const g = at(p, x, s.y, z, 0)
  k.cyl(g, r - 0.03, r - 0.03, 0.02, lux.blackSteel, 0, 0.01, 0, 32)
  const n = Math.round((2 * PI * r) / 0.035)
  const side = pleated((t) => [Math.cos(t * PI * 2) * r, Math.sin(t * PI * 2) * r], (t) => [Math.cos(t * PI * 2), Math.sin(t * PI * 2)], n, 0.02, h - 0.025, 0.012, true, cloth)
  ;(side.material as MeshStandardMaterial).side = DoubleSide
  g.add(side)
  const welt = mesh(g, new TorusGeometry(r + 0.004, 0.008, 8, 48), cloth, 0, h - 0.025, 0)
  welt.rotation.x = PI / 2
  if (top) mesh(g, new CylinderGeometry(r - 0.004, r - 0.004, 0.025, 48), top, 0, h - 0.0125, 0)
  else {
    const dome = mesh(g, new SphereGeometry(r - 0.002, 48, 10, 0, PI * 2, 0, PI / 2), cloth, 0, h - 0.028, 0)
    dome.scale.y = 0.16
    // A centre button pulling the top in.
    k.cyl(g, 0.012, 0.012, 0.004, cloth, 0, h - 0.028 + (r - 0.002) * 0.16 - 0.004, 0, 12)
  }
  s.e.shade.pool(x, s.y + 0.012, z, r * 1.3, r * 1.3, 0.4)
  return g
}

/** The Prada armchair: a bouclé barrel shell on a brass swivel, a piped seat cushion and a mint cushion against the back. */
export function pradaArmchair(s: Shop, p: Object3D, x: number, z: number, yaw: number, shell: Material, cushion: Material) {
  const { k } = s.e
  barrelChair(s.e, p, x, z, yaw, shell)
  const g = at(p, x, s.y, z, yaw)
  // The shell's two ends finished round, as an upholstered arm is (the turned shell is open there).
  const sweep = PI * 1.4
  for (const a of [PI - sweep / 2, PI + sweep / 2]) {
    const end = k.soft(g, 0.13, 0.55, 0.1, 0.045, shell, Math.sin(a) * 0.36, 0.475, Math.cos(a) * 0.36)
    end.rotation.y = a
  }
  // The loose back cushion, leaning into the shell, plumped with a seam round its face.
  const back = k.soft(g, 0.42, 0.34, 0.12, 0.05, cushion, 0, 0.66, -0.2)
  back.rotation.x = -0.2
  const seam = mesh(back, new TorusGeometry(1, 0.004, 4, 32), cushion, 0, 0, 0.058)
  seam.scale.set(0.19, 0.15, 1)
  return g
}

/** Dior's club chair: cream leather, rolled arms, a piped seat cushion, on a bronze plinth. */
export function diorClubChair(s: Shop, p: Object3D, x: number, z: number, yaw: number, hide: Material) {
  return clubChair(s.e, p, x, z, yaw, hide)
}

/** Dior's low sofa in bouclé, `len` long, with piped cushions and a pair of throw cushions in the second cloth. */
export function diorSofa(s: Shop, p: Object3D, x: number, z: number, yaw: number, len: number, cloth: Material, throwCloth: Material) {
  return sofa(s.e, p, x, z, yaw, len, cloth, throwCloth)
}

/** A round display table: a stone top on a fluted cream drum. */
export function drumTable(s: Shop, p: Object3D, x: number, z: number, r: number, h: number, drum: Material, top: Material) {
  const g = at(p, x, s.y, z, 0)
  const prof = [new Vector2(0.001, 0), new Vector2(r * 0.55, 0), new Vector2(r * 0.6, 0.02), new Vector2(r * 0.6, h - 0.05), new Vector2(r * 0.55, h - 0.04), new Vector2(0.001, h - 0.04)]
  mesh(g, new LatheGeometry(prof, 48), drum, 0, 0, 0)
  const n = 36
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2
    mesh(g, new CylinderGeometry(0.014, 0.014, h - 0.07, 8), drum, Math.cos(a) * r * 0.6, (h - 0.04) / 2, Math.sin(a) * r * 0.6, false)
  }
  mesh(g, new CylinderGeometry(r, r, 0.04, 56), top, 0, h - 0.02, 0)
  const disc = mesh(g, new CircleGeometry(r * 0.6, 32), drum, 0, 0.001, 0, false)
  disc.rotation.x = -PI / 2
  s.e.shade.pool(x, s.y + 0.012, z, r * 1.2, r * 1.2, 0.35)
  return g
}
