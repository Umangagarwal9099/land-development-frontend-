import { MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, Vector2, type Texture } from 'three'
import { rng, type Paint } from '../../../textures'
import type { FloorCtx } from '../shell'

/*
 * The materials the merchandise and seating are made of, painted at true scale with a relief map
 * derived from the same painting, so leather shows its grain, denim its twill, cotton its weave,
 * knits their ribs and nylon its sheen, and every hanging garment carries soft vertical folds.
 */


/** Leather: pores, a few creases, soft tonal variation. `repeat` metres per painting. */
const leatherPaint = (base: [number, number, number], seed: number, pores = 6000, crease = 36): Paint => (g, w, h) => {
  const r = rng(seed)
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  // Tonal clouds.
  g.filter = 'blur(18px)'
  for (let i = 0; i < 24; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.03)'
    g.beginPath()
    g.ellipse(r() * w, r() * h, 40 + r() * 120, 30 + r() * 90, r() * 3, 0, 7)
    g.fill()
  }
  g.filter = 'none'
  for (let i = 0; i < pores; i++) {
    g.fillStyle = r() < 0.6 ? `rgba(0,0,0,${0.06 + r() * 0.12})` : `rgba(255,255,255,${0.04 + r() * 0.08})`
    g.beginPath()
    g.ellipse(r() * w, r() * h, 0.6 + r() * 1.8, 0.4 + r() * 1.2, r() * 3, 0, 7)
    g.fill()
  }
  g.lineCap = 'round'
  for (let i = 0; i < crease; i++) {
    g.strokeStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`
    g.lineWidth = 0.6 + r() * 1.2
    g.beginPath()
    let x = r() * w
    let y = r() * h
    g.moveTo(x, y)
    for (let k = 0; k < 8; k++) {
      x += (r() - 0.5) * 60
      y += (r() - 0.5) * 60
      g.lineTo(x, y)
    }
    g.stroke()
  }
}

/** Cannage quilting over lambskin: the diamond stitching of a Lady Dior, puffed between the seams. */
const quiltedPaint = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  leatherPaint(base, seed, 3000, 8)(g, w, h)
  const n = 3
  for (let i = -n; i <= 2 * n; i++) {
    for (const dir of [1, -1]) {
      const o = (i * w) / n
      const gr = g.createLinearGradient(0, 0, w / n, 0)
      gr.addColorStop(0, 'rgba(255,255,255,.18)')
      gr.addColorStop(0.47, 'rgba(255,255,255,0)')
      gr.addColorStop(0.5, 'rgba(0,0,0,.45)')
      gr.addColorStop(0.53, 'rgba(0,0,0,0)')
      gr.addColorStop(1, 'rgba(0,0,0,.22)')
      g.strokeStyle = gr
      g.lineWidth = w / 14
      g.beginPath()
      g.moveTo(o - w, dir > 0 ? -w : 2 * w)
      g.lineTo(o + 2 * w, dir > 0 ? 2 * w : -w)
      g.stroke()
    }
  }
  // The stitch itself: a fine dotted line along each seam.
  g.setLineDash([3, 3])
  g.lineWidth = 1.2
  g.strokeStyle = 'rgba(255,255,255,.35)'
  for (let i = -n; i <= 2 * n; i++)
    for (const dir of [1, -1]) {
      const o = (i * w) / n
      g.beginPath()
      g.moveTo(o - w, dir > 0 ? -w : 2 * w)
      g.lineTo(o + 2 * w, dir > 0 ? 2 * w : -w)
      g.stroke()
    }
  g.setLineDash([])
}

/** Saffiano: the cross-hatched press of Prada's calf, a diagonal grid of fine ridges. */
const saffianoPaint = (base: [number, number, number]): Paint => (g, w, h) => {
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  const n = 40
  const s = w / n
  g.lineWidth = s * 0.3
  for (const dir of [1, -1]) {
    for (let i = -n; i <= 2 * n; i++) {
      const o = i * s
      g.strokeStyle = 'rgba(255,255,255,.14)'
      g.beginPath()
      g.moveTo(o - w, dir > 0 ? -w : 2 * w)
      g.lineTo(o + 2 * w, dir > 0 ? 2 * w : -w)
      g.stroke()
      g.strokeStyle = 'rgba(0,0,0,.22)'
      g.beginPath()
      g.moveTo(o - w + s * 0.4, dir > 0 ? -w : 2 * w)
      g.lineTo(o + 2 * w + s * 0.4, dir > 0 ? 2 * w : -w)
      g.stroke()
    }
  }
}

/** Woven cloth: a fine weave with threads both ways, and soft vertical folds of a hanging garment. */
const clothPaint = (base: [number, number, number], seed: number, threads: number, contrast: number, folds: number, fleck?: string): Paint => (g, w, h) => {
  const r = rng(seed)
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  const t = w / threads
  for (let i = 0; i < threads; i++) {
    g.fillStyle = `rgba(0,0,0,${contrast * (0.5 + r() * 0.5)})`
    g.fillRect(i * t, 0, t * 0.35, h)
    g.fillStyle = `rgba(255,255,255,${contrast * 0.6 * (0.5 + r() * 0.5)})`
    g.fillRect(0, i * t, w, t * 0.3)
  }
  if (fleck)
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = fleck
      g.globalAlpha = 0.08 + r() * 0.2
      g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2)
    }
  g.globalAlpha = 1
  // Folds: soft vertical shade and light, a few, unevenly spaced, drifting a little.
  for (let i = 0; i < folds; i++) {
    const x = ((i + 0.5) / folds) * w + (r() - 0.5) * (w / folds) * 0.6
    const wd = (w / folds) * (0.5 + r() * 0.5)
    const gr = g.createLinearGradient(x - wd / 2, 0, x + wd / 2, 0)
    gr.addColorStop(0, 'rgba(0,0,0,0)')
    gr.addColorStop(0.35, `rgba(0,0,0,${0.1 + r() * 0.1})`)
    gr.addColorStop(0.6, `rgba(255,255,255,${0.06 + r() * 0.06})`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - wd / 2, 0, wd, h)
  }
}

/** Denim: indigo twill, the diagonal ridges, the pale weft showing through, worn lighter in places. */
const denimPaint = (base: [number, number, number], seed: number, fade: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  const n = 56
  const s = w / n
  g.lineWidth = s * 0.45
  for (let i = -n; i <= 2 * n; i++) {
    const o = i * s
    g.strokeStyle = `rgba(215,222,235,${0.16 + r() * 0.1})`
    g.beginPath()
    g.moveTo(o, 0)
    g.lineTo(o + w * 0.6, h)
    g.stroke()
    g.strokeStyle = `rgba(0,0,0,${0.18 + r() * 0.1})`
    g.beginPath()
    g.moveTo(o + s * 0.5, 0)
    g.lineTo(o + s * 0.5 + w * 0.6, h)
    g.stroke()
  }
  g.filter = 'blur(22px)'
  for (let i = 0; i < 10; i++) {
    g.fillStyle = `rgba(230,236,246,${fade * (0.3 + r() * 0.5)})`
    g.beginPath()
    g.ellipse(r() * w, r() * h, 60 + r() * 160, 30 + r() * 80, r() * 3, 0, 7)
    g.fill()
  }
  g.filter = 'none'
}

/** Knitwear: rows of stitches, each a little V, with the ribbing of a jersey. */
const knitPaint = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  const cols = 36
  const rows = 48
  const cw = w / cols
  const rh = h / rows
  g.lineWidth = cw * 0.22
  g.lineCap = 'round'
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x = i * cw
      const y = j * rh
      g.strokeStyle = `rgba(255,255,255,${0.1 + r() * 0.1})`
      g.beginPath()
      g.moveTo(x + cw * 0.1, y)
      g.lineTo(x + cw * 0.5, y + rh * 0.8)
      g.lineTo(x + cw * 0.9, y)
      g.stroke()
      g.strokeStyle = `rgba(0,0,0,${0.12 + r() * 0.1})`
      g.beginPath()
      g.moveTo(x + cw * 0.5, y + rh * 0.8)
      g.lineTo(x + cw * 0.5, y + rh)
      g.stroke()
    }
}

/** Technical nylon: a tight ripstop grid with a faint sheen pattern. */
const nylonPaint = (base: [number, number, number]): Paint => (g, w, h) => {
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  const n = 24
  for (let i = 0; i <= n; i++) {
    g.fillStyle = 'rgba(255,255,255,.1)'
    g.fillRect((i * w) / n, 0, 1.5, h)
    g.fillRect(0, (i * h) / n, w, 1.5)
  }
}

/** Soft pile: bouclé loops, a cloud of little rings. */
const bouclePaint = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  g.lineWidth = 1
  for (let i = 0; i < 9000; i++) {
    g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)'
    g.beginPath()
    g.arc(r() * w, r() * h, 1 + r() * 2, 0, 7)
    g.stroke()
  }
}

export function fabricMaterials(e: FloorCtx) {
  const { k, m } = e
  const env = m.env
  const mark = <T extends MeshStandardMaterial>(x: T) => ((x.userData.interior = true), x)
  const made = new Map<string, MeshStandardMaterial>()
  const tex = (key: string, w: number, h: number, paint: Paint, metres: number): [Texture, Texture] => {
    const map = k.tex.painted(w, h, paint)
    map.wrapS = map.wrapT = RepeatWrapping
    map.repeat.set(1 / metres, 1 / metres)
    map.anisotropy = 8
    const normal = k.tex.normalPainted(`shop_${key}`, w, h, paint, 1 / metres, 1 / metres)
    normal.wrapS = normal.wrapT = RepeatWrapping
    normal.anisotropy = 8
    return [map, normal]
  }
  const once = (key: string, make: () => MeshStandardMaterial) => {
    let mat = made.get(key)
    if (!mat) made.set(key, (mat = mark(make())))
    return mat
  }
  const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]

  return {
    /** Smooth calf leather, lightly grained. */
    calf: (colour: string, seed = 1) => once(`calf|${colour}|${seed}`, () => {
      const [map, normalMap] = tex(`calf${colour}${seed}`, 512, 512, leatherPaint(hex(colour), seed), 0.22)
      return new MeshStandardMaterial({ map, normalMap, normalScale: new Vector2(0.35, 0.35), roughness: 0.46, envMap: env, envMapIntensity: 0.5 })
    }),
    /** Pebbled, grained leather. */
    grained: (colour: string, seed = 2) => once(`grain|${colour}|${seed}`, () => {
      const [map, normalMap] = tex(`grain${colour}${seed}`, 512, 512, leatherPaint(hex(colour), seed, 14000, 10), 0.16)
      return new MeshStandardMaterial({ map, normalMap, normalScale: new Vector2(0.8, 0.8), roughness: 0.55, envMap: env, envMapIntensity: 0.4 })
    }),
    /** Cannage-quilted lambskin. */
    quilted: (colour: string, seed = 12) => once(`quilt|${colour}|${seed}`, () => {
      const [map, normalMap] = tex(`quilt${colour}${seed}`, 512, 512, quiltedPaint(hex(colour), seed), 0.1)
      return new MeshStandardMaterial({ map, normalMap, normalScale: new Vector2(1.1, 1.1), roughness: 0.4, envMap: env, envMapIntensity: 0.55 })
    }),
    /** Saffiano cross-hatched calf. */
    saffiano: (colour: string) => once(`saff|${colour}`, () => {
      const [map, normalMap] = tex(`saff${colour}`, 512, 512, saffianoPaint(hex(colour)), 0.08)
      return new MeshStandardMaterial({ map, normalMap, normalScale: new Vector2(0.5, 0.5), roughness: 0.42, envMap: env, envMapIntensity: 0.55 })
    }),
    /** Patent leather: a deep gloss. */
    patent: (colour: string) => once(`patent|${colour}`, () => mark(new MeshPhysicalMaterial({ color: colour, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08, envMap: env, envMapIntensity: 1.0 }))),
    /** Suede: matte, soft. */
    suede: (colour: string, seed = 3) => once(`suede|${colour}|${seed}`, () => {
      const [map] = tex(`suede${colour}${seed}`, 256, 256, leatherPaint(hex(colour), seed, 3000, 0), 0.1)
      return mark(new MeshPhysicalMaterial({ map, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.8, sheenColor: '#ffffff', envMap: env, envMapIntensity: 0.1 }))
    }),
    /** Re-Nylon: technical weave with a satin sheen. */
    nylon: (colour: string) => once(`nylon|${colour}`, () => {
      const [map, normalMap] = tex(`nylon${colour}`, 256, 256, nylonPaint(hex(colour)), 0.05)
      return mark(new MeshPhysicalMaterial({ map, normalMap, normalScale: new Vector2(0.3, 0.3), roughness: 0.5, sheen: 0.9, sheenRoughness: 0.35, sheenColor: '#cfd4d8', envMap: env, envMapIntensity: 0.6 }))
    }),
    /** Cotton poplin or twill for shirts: a fine weave with gentle folds. */
    cotton: (colour: string, seed = 4) => once(`cotton|${colour}|${seed}`, () => {
      const [map, normalMap] = tex(`cotton${colour}${seed}`, 512, 512, clothPaint(hex(colour), seed, 110, 0.06, 5), 0.3)
      return new MeshStandardMaterial({ map, normalMap, normalScale: new Vector2(0.45, 0.45), roughness: 0.85, envMap: env, envMapIntensity: 0.1 })
    }),
    /** Suiting wool: flannel with a fleck, soft folds. */
    wool: (colour: string, seed = 5, fleck = '#b8b2a8') => once(`wool|${colour}|${seed}`, () => {
      const [map, normalMap] = tex(`wool${colour}${seed}`, 512, 512, clothPaint(hex(colour), seed, 70, 0.05, 4, fleck), 0.3)
      return mark(new MeshPhysicalMaterial({ map, normalMap, normalScale: new Vector2(0.5, 0.5), roughness: 0.92, sheen: 0.35, sheenRoughness: 0.7, sheenColor: '#ffffff', envMap: env, envMapIntensity: 0.08 }))
    }),
    /** Jersey for T-shirts. */
    jersey: (colour: string, seed = 6) => once(`jersey|${colour}|${seed}`, () => {
      const [map, normalMap] = tex(`jersey${colour}${seed}`, 512, 512, clothPaint(hex(colour), seed, 160, 0.04, 6), 0.25)
      return new MeshStandardMaterial({ map, normalMap, normalScale: new Vector2(0.4, 0.4), roughness: 0.9, envMap: env, envMapIntensity: 0.06 })
    }),
    /** Denim: raw indigo, washed, or black. */
    denim: (colour: string, fade = 0.3, seed = 7) => once(`denim|${colour}|${fade}|${seed}`, () => {
      const [map, normalMap] = tex(`denim${colour}${fade}${seed}`, 512, 512, denimPaint(hex(colour), seed, fade), 0.14)
      return new MeshStandardMaterial({ map, normalMap, normalScale: new Vector2(0.55, 0.55), roughness: 0.9, envMap: env, envMapIntensity: 0.08 })
    }),
    /** Knitwear. */
    knit: (colour: string, seed = 8) => once(`knit|${colour}|${seed}`, () => {
      const [map, normalMap] = tex(`knit${colour}${seed}`, 512, 512, knitPaint(hex(colour), seed), 0.12)
      return mark(new MeshPhysicalMaterial({ map, normalMap, normalScale: new Vector2(0.7, 0.7), roughness: 0.95, sheen: 0.5, sheenRoughness: 0.9, sheenColor: '#ffffff', envMap: env, envMapIntensity: 0.05 }))
    }),
    /** Bouclé upholstery. */
    boucle: (colour: string, seed = 9) => once(`boucle|${colour}|${seed}`, () => {
      const [map, normalMap] = tex(`boucle${colour}${seed}`, 512, 512, bouclePaint(hex(colour), seed), 0.18)
      return mark(new MeshPhysicalMaterial({ map, normalMap, normalScale: new Vector2(0.9, 0.9), roughness: 0.97, sheen: 0.7, sheenRoughness: 0.8, sheenColor: '#ffffff', envMap: env, envMapIntensity: 0.05 }))
    }),
    /** Velvet upholstery. */
    velvet: (colour: string, seed = 10) => once(`velvet|${colour}|${seed}`, () => {
      const [map] = tex(`velvet${colour}${seed}`, 256, 256, clothPaint(hex(colour), seed, 200, 0.03, 3), 0.2)
      return mark(new MeshPhysicalMaterial({ map, roughness: 0.9, sheen: 1, sheenRoughness: 0.4, sheenColor: colour, envMap: env, envMapIntensity: 0.12 }))
    }),
    /** Upholstery leather (a softer grain than a bag's). */
    hide: (colour: string, seed = 11) => once(`hide|${colour}|${seed}`, () => {
      const [map, normalMap] = tex(`hide${colour}${seed}`, 512, 512, leatherPaint(hex(colour), seed, 9000, 20), 0.3)
      return new MeshStandardMaterial({ map, normalMap, normalScale: new Vector2(0.5, 0.5), roughness: 0.5, envMap: env, envMapIntensity: 0.35 })
    }),
    /** Rubber or leather soles, laces, metal fittings and so on. */
    rubber: (colour: string) => once(`rubber|${colour}`, () => new MeshStandardMaterial({ color: colour, roughness: 0.75, envMap: env, envMapIntensity: 0.15 })),
    lace: (colour: string) => once(`lace|${colour}`, () => new MeshStandardMaterial({ color: colour, roughness: 0.95, envMap: env, envMapIntensity: 0.05 })),
    enamel: (colour: string) => once(`enamel|${colour}`, () => new MeshStandardMaterial({ color: colour, roughness: 0.15, envMap: env, envMapIntensity: 0.8 })),
  }
}

export type Fabrics = ReturnType<typeof fabricMaterials>

const perFloor = new WeakMap<FloorCtx, Fabrics>()
/** The floor's fabrics, painted once and shared by every shop on it. */
export function fabrics(e: FloorCtx): Fabrics {
  let f = perFloor.get(e)
  if (!f) perFloor.set(e, (f = fabricMaterials(e)))
  return f
}
