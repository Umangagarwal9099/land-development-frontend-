import { BufferGeometry, DoubleSide, Float32BufferAttribute, Mesh, MeshBasicMaterial, type Object3D, type Texture } from 'three'
import type { Point2 } from '../../../../../api/types'
import type { Kit } from '../kit'
import type { Paint } from '../textures'

/*
 * Baked contact shadows and ambient occlusion: the darkening real light leaves where things meet
 * — under a tree's crown and round its trunk, beneath a car, at the foot of every wall, kerb and
 * planter, along the shopfront and under the skin's overhang. The real-time sun casts the hard
 * shadows; this is the soft, sky-occluded part a renderer without global illumination misses.
 * Three meshes for the whole site: round pools, soft rectangles, and strips fading off an edge.
 */

const radial: Paint = (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  gr.addColorStop(0, '#fff')
  gr.addColorStop(0.35, 'rgba(255,255,255,.75)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
}

/** A rectangle with soft edges, for what stands on four corners (cars, benches, plant). */
const softRect: Paint = (g, w, h) => {
  // Nested rounded rectangles build a soft falloff (canvas blur filters aren't everywhere).
  for (let i = 0; i < 16; i++) {
    const m = (w * 0.34 * i) / 16
    g.fillStyle = 'rgba(255,255,255,.09)'
    g.beginPath()
    g.roundRect(m, m, w - 2 * m, h - 2 * m, w * 0.12)
    g.fill()
  }
}

/** Dark at v = 0 (the junction), clear at v = 1, falling off quickly. */
const strip: Paint = (g, w, h) => {
  const gr = g.createLinearGradient(0, h, 0, 0)
  gr.addColorStop(0, '#fff')
  gr.addColorStop(0.3, 'rgba(255,255,255,.45)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
}

class Quads {
  pos: number[] = []
  uv: number[] = []
  col: number[] = []

  quad(corners: number[][], uvs: number[][], alpha: number) {
    for (const i of [0, 1, 2, 0, 2, 3]) {
      this.pos.push(...corners[i])
      this.uv.push(...uvs[i])
      this.col.push(0, 0, 0, alpha)
    }
  }

  mesh(map: Texture, parent: Object3D, name: string) {
    if (!this.pos.length) return
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3))
    g.setAttribute('uv', new Float32BufferAttribute(this.uv, 2))
    g.setAttribute('color', new Float32BufferAttribute(this.col, 4))
    const mat = new MeshBasicMaterial({ alphaMap: map, vertexColors: true, transparent: true, depthWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false })
    const m = new Mesh(g, mat)
    m.name = name
    // Drawn after the ground they lie on, and never solid to a walker.
    m.renderOrder = 1
    m.raycast = () => {}
    parent.add(m)
  }
}

const UV = [[0, 0], [1, 0], [1, 1], [0, 1]]

export class Contact {
  private pools = new Quads()
  private rects = new Quads()
  private strips = new Quads()

  /** A round pool of shade on the ground at (x, y, z). */
  pool(x: number, y: number, z: number, rx: number, rz: number, alpha: number) {
    this.pools.quad([[x - rx, y, z + rz], [x + rx, y, z + rz], [x + rx, y, z - rz], [x - rx, y, z - rz]], UV, alpha)
  }

  /** A soft rectangle w (along local x) × d, turned by `yaw`. */
  rect(x: number, y: number, z: number, w: number, d: number, yaw: number, alpha: number) {
    const c = Math.cos(yaw)
    const s = Math.sin(yaw)
    const at = (u: number, v: number) => [x + u * c + v * s, y, z - u * s + v * c]
    const hw = w * 0.74
    const hd = d * 0.74
    this.rects.quad([at(-hw, hd), at(hw, hd), at(hw, -hd), at(-hw, -hd)], UV, alpha)
  }

  /**
   * Occlusion along a junction: from each segment of `line` (plan points at height y) outwards by
   * `width` on the side given by `side` (+1 left of the direction of travel, −1 right).
   */
  edge(line: Point2[], y: number, width: number, side: 1 | -1, alpha: number, closed = false) {
    const pts = line.filter((p, i) => i === 0 || Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]) > 1e-4)
    const count = pts.length
    const segNormal = (i: number): Point2 => {
      const [ax, az] = pts[(i + count) % count]
      const [bx, bz] = pts[(i + 1) % count]
      const len = Math.hypot(bx - ax, bz - az)
      return [(-(bz - az) / len) * side, ((bx - ax) / len) * side]
    }
    // Mitred offsets at each vertex, so the strip runs on unbroken round curves and corners.
    const offset = pts.map((_, i): Point2 => {
      const first = !closed && i === 0
      const last = !closed && i === count - 1
      const a = segNormal(first ? 0 : i - 1)
      const b = segNormal(last ? count - 2 : i)
      let nx = a[0] + b[0]
      let nz = a[1] + b[1]
      const l = Math.hypot(nx, nz) || 1
      nx /= l
      nz /= l
      const miter = Math.min(2, 1 / Math.max(0.5, nx * b[0] + nz * b[1]))
      return [nx * width * miter, nz * width * miter]
    })
    const n = closed ? count : count - 1
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % count
      const [ax, az] = pts[i]
      const [bx, bz] = pts[j]
      this.strips.quad([[ax, y, az], [bx, y, bz], [bx + offset[j][0], y, bz + offset[j][1]], [ax + offset[i][0], y, az + offset[i][1]]], UV, alpha)
    }
  }

  /** A vertical occlusion band up a wall face from its foot: from (a) to (b) at the base, rising h. */
  foot(ax: number, az: number, bx: number, bz: number, y: number, h: number, alpha: number) {
    this.strips.quad([[ax, y, az], [bx, y, bz], [bx, y + h, bz], [ax, y + h, az]], UV, alpha)
  }

  build(k: Kit, parent: Object3D) {
    this.pools.mesh(k.tex.painted(128, 128, radial), parent, 'contact_pools')
    this.rects.mesh(k.tex.painted(128, 128, softRect), parent, 'contact_rects')
    this.strips.mesh(k.tex.painted(8, 128, strip), parent, 'contact_strips')
  }
}
