import { MeshStandardMaterial, type Material } from 'three'
import { FACE } from '../kit'
import { DECK_Y, type Ctx } from './architecture'
import { signage, terranovaMark } from './paints'
import { bench, bollard, car, paintedMat, pergola } from './pieces'

const { north, south, east, west } = FACE

/** Arrival court, parking, boundary planting, side walks and the garden terrace. */
export function buildGrounds(ctx: Ctx) {
  const { out: k, c } = ctx
  const p = { k, c }
  const { m } = k
  const r = k.root

  const pave = (x0: number, x1: number, z0: number, z1: number, mat: Material, h = DECK_Y) => k.box(r, x1 - x0, h, z1 - z0, mat, (x0 + x1) / 2, h / 2, (z0 + z1) / 2, false)
  const stone = (x0: number, x1: number, z0: number, z1: number) => pave(x0, x1, z0, z1, k.finish('travertineTile', (x1 - x0) / 1.6, (z1 - z0) / 0.8, 0.5))
  const setts = (x0: number, x1: number, z0: number, z1: number) => pave(x0, x1, z0, z1, k.finish('setts', (x1 - x0) / 2, (z1 - z0) / 1.4, 0.8), 0.1)
  const hedge = (x0: number, x1: number, z0: number, z1: number, h: number) => k.box(r, x1 - x0, h, z1 - z0, m.leaf, (x0 + x1) / 2, h / 2, (z0 + z1) / 2)

  /* ---- Arrival court ---- */
  stone(-22.3, 22.3, 18.3, 20.3)
  setts(-17, 17, 20.3, 24.8)
  setts(-17, -11.5, 24.8, 35)
  setts(11.5, 17, 24.8, 35)
  // Granite kerbs around the island.
  k.box(r, 23.2, 0.18, 0.2, m.basalt, 0, 0.09, 24.9)
  for (const s of [-1, 1]) k.box(r, 0.2, 0.18, 10.1, m.basalt, s * 11.5, 0.09, 29.95)
  // Island: low clipped hedges, date palms and the fountain on the arrival axis.
  for (const s of [-1, 1]) hedge(s * 11.2 - 0.3, s * 11.2 + 0.3, 25.3, 34.4, 0.55)
  hedge(-10.9, 10.9, 25.2, 25.7, 0.5)
  for (const s of [-1, 1]) {
    k.palm(s * 8.6, 27.4, 5.6)
    k.palm(s * 8.9, 32.4, 6.2)
    k.box(r, 0.25, 0.04, 0.12, c.facade, s * 8.6 - s * 0.6, 0.02, 27.4, false)
    k.box(r, 0.25, 0.04, 0.12, c.facade, s * 8.9 - s * 0.6, 0.02, 32.4, false)
  }
  const flowerMats = ['#e8d6c9', '#c9b7a0', '#f2efe8', '#b86f6f'].map((color) => new MeshStandardMaterial({ color, roughness: 0.9, flatShading: true }))
  // Planted beds either side of the fountain: clipped shrubs with drifts of flowers.
  for (const s of [-1, 1])
    for (let x = 4.3; x <= 7.2; x += 0.72)
      for (let z = 26.3; z <= 33.2; z += 0.72) {
        const i = Math.round(x * 10 + z * 7)
        const bloom = i % 5 === 0
        k.blob(r, bloom ? 0.26 : 0.34, bloom ? flowerMats[i % 4] : i % 3 ? m.sage : m.leaf, s * (x + ((i % 3) - 1) * 0.08), 0.22, z + ((i % 2) - 0.5) * 0.12, 0.65)
      }
  const f = k.at(0, 29.6, 0, 0)
  k.cyl(f, 3.2, 3.2, 0.5, m.travertine, 0, 0.25, 0, 64)
  k.cyl(f, 2.95, 2.95, 0.01, m.basalt, 0, 0.505, 0, 64)
  k.cyl(f, 2.95, 2.95, 0.02, c.water, 0, 0.53, 0, 64)
  // Centrepiece: a basalt monolith bearing the TERRANOVA mark on both faces, lit from the water.
  const mark = paintedMat(p, 'terranova', 1024, 384, terranovaMark, { roughness: 0.45 })
  k.box(f, 3.6, 0.5, 0.9, m.basalt, 0, 0.25, 0)
  k.box(f, 3.2, 1.2, 0.36, [m.basalt, m.basalt, m.basalt, m.basalt, mark, mark], 0, 1.1, 0)
  for (const s of [-1, 1]) k.box(f, 3.0, 0.02, 0.03, c.facade, 0, 0.51, s * 0.3, false)
  // Arrival monolith with bronze lettering, lit from below.
  const sign = paintedMat(p, 'signage', 1024, 256, signage, { roughness: 0.6 })
  const mono = k.at(0, 33.9, 0, 0)
  k.box(mono, 5.0, 1.25, 0.55, [c.stone, c.stone, c.stone, c.stone, sign, c.stone], 0, 0.72, 0)
  k.box(mono, 5.2, 0.12, 0.75, m.basalt, 0, 0.06, 0)
  k.box(mono, 4.8, 0.02, 0.03, c.facade, 0, 0.13, 0.36, false)

  /* ---- Parking either side of the court ---- */
  for (const s of [-1, 1]) {
    const [a0, a1] = s < 0 ? [-26, -17] : [17, 26]
    pave(a0, a1, 19.0, 33.8, c.asphalt, 0.08)
    for (let i = 0; i <= 5; i++) k.box(r, 5.2, 0.01, 0.1, c.lineWhite, s * 20.1, 0.085, 20.4 + i * 2.6, false)
    for (const z of [20.4, 33.4]) k.box(r, 1.0, 0.4, 1.0, m.basalt, s * 24.6, 0.2, z)
    k.tree(s * 24.6, 20.4, 0.9)
    k.tree(s * 24.6, 33.4, 0.95)
  }
  car(p, -20.2, 21.7, east, '#1c1f24', 0.08)
  car(p, -20.2, 26.9, east, '#b9b6ae', 0.08)
  car(p, 20.2, 24.3, west, '#3a2a22', 0.08)
  car(p, 20.2, 29.5, west, '#e9e7e2', 0.08)

  // Front boundary: low stone walls with hedges, gate piers with lanterns at the two driveways.
  for (const [a0, a1] of [[-26, -17.3], [-11.2, 11.2], [17.3, 26]]) {
    k.box(r, a1 - a0, 0.6, 0.5, c.stone, (a0 + a1) / 2, 0.3, 34.7)
    hedge(a0 + 0.1, a1 - 0.1, 34.5, 34.9, 1.05)
  }
  for (const x of [-17.15, -11.35, 11.35, 17.15]) {
    k.box(r, 0.6, 2.2, 0.6, c.stone, x, 1.1, 34.7)
    k.box(r, 0.4, 0.3, 0.4, c.path, x, 2.35, 34.7, false)
  }

  /* ---- Side walks ---- */
  // West: a screened service walk along the boundary hedge.
  hedge(-26, -25.1, -35, 18.3, 1.9)
  for (let z = -6; z <= 14; z += 5) k.tree(-23.6, z, 0.85)
  for (let z = -8; z <= 16; z += 6) bollard(p, -22.9, z, 0)
  // East: a garden walk facing the park, with benches.
  for (let z = -9; z <= 17.5; z += 1.1) stone(23.3, 24.7, z, z + 0.8)
  hedge(25.4, 26, -10.3, 18.3, 1.2)
  for (const z of [-6, 3, 12]) k.tree(25.0, z, 0.9)
  for (const z of [-1.5, 7.5]) bench(p, 25.0, z, west, 1.8, 0)
  for (let z = -8; z <= 16; z += 6) bollard(p, 23.0, z, 0)
  // Back: tall hedge and trees behind the pool.
  hedge(-26, 26, -35, -34.2, 2.2)
  hedge(-26, -24.9, -34.2, -10.3, 1.6)
  for (const x of [-20, -8, 4, 22]) k.tree(x, -34.4, 1.1)

  /* ---- Garden terrace ---- */
  for (let z = -32.5; z <= -12.4; z += 0.95) stone(15.6, 16.8, z, z + 0.65)
  stone(14.5, 15.6, -12.5, -11.2)
  pave(17.8, 23.4, -17.4, -12.6, k.finish('oak', 5.6 / 0.9, 4.8 / 2.4, 0.7), 0.1)
  pergola(p, 20.6, -15, 5.2, 4.2, 0.1)
  k.sofa(20.6, -16.5, south, 2.6, 0.95, m.outdoor)
  k.loungeChair(18.9, -13.9, north, m.teak, m.outdoor)
  k.loungeChair(22.3, -13.9, north, m.teak, m.outdoor)
  const ct = k.at(20.6, -15.1, 0, 0.1)
  k.box(ct, 1.2, 0.34, 0.7, m.teak, 0, 0.17, 0)
  k.cyl(ct, 0.12, 0.1, 0.18, m.ceramic, 0.3, 0.43, 0)
  for (const x of [18.5, 20.6, 22.7]) k.lounger(x, -23.6, south, 0)
  for (const x of [19.55, 21.65]) k.cyl(k.at(x, -23.2, 0, 0), 0.22, 0.22, 0.42, m.teak, 0, 0.21, 0)
  for (const [x, z] of [[24.4, -19.6], [18.2, -29.8], [23.6, -30.4], [24.6, -26]]) {
    k.tree(x, z, 1.05, m.sage)
    k.box(r, 0.22, 0.04, 0.12, c.facade, x - 0.7, 0.02, z, false)
  }
  for (let z = -31; z <= -13; z += 4.5) bollard(p, 17.2, z, 0)
  const bed = (x0: number, x1: number, z0: number, z1: number) => {
    k.box(r, x1 - x0, 0.3, z1 - z0, m.corten, (x0 + x1) / 2, 0.15, (z0 + z1) / 2)
    const n = Math.round((x1 - x0) * (z1 - z0) * 1.2)
    for (let i = 0; i < n; i++) {
      const u = ((i * 37) % 100) / 100
      const v = ((i * 61) % 100) / 100
      k.blob(r, 0.28, i % 3 ? m.sage : flowerMats[i % 4], x0 + 0.3 + u * (x1 - x0 - 0.6), 0.38, z0 + 0.3 + v * (z1 - z0 - 0.6), 0.7)
    }
  }
  bed(17.6, 25.2, -33.7, -32.4)
  bed(24.2, 25.4, -22, -17.8)
}
