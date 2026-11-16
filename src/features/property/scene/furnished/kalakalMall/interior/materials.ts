import { DoubleSide, EquirectangularReflectionMapping, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, Vector2, type MeshStandardMaterialParameters, type Texture } from 'three'
import type { Kit } from '../../kit'
import type { Lighting } from '../../shared'
import { rng, type Paint } from '../../textures'

/*
 * The mall's interior finishes. Painted at true scale: surfaces laid with `sheet`/`slab` carry
 * plan metres as UVs, so a texture repeating once per N metres lays at its real size.
 *
 * Every material here is flagged `userData.interior`: the model's sky reflection (see ../index.ts)
 * leaves them alone and they reflect the mall's own lit interior instead.
 */

/* ---------- painters ---------- */

/** 2.4 m of polished ivory marble: four 1.2 m slabs, each cut from a different part of the block. */
const marble = (tone: [number, number, number], vein: string, seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const half = w / 2
  for (let ty = 0; ty < 2; ty++)
    for (let tx = 0; tx < 2; tx++) {
      const x0 = tx * half
      const y0 = ty * half
      const d = (r() - 0.5) * 6
      g.fillStyle = `rgb(${tone[0] + d},${tone[1] + d},${tone[2] + d * 0.8})`
      g.fillRect(x0, y0, half, half)
      // Cloudy fields, then fine veins wandering across the slab.
      for (let i = 0; i < 40; i++) {
        g.fillStyle = `rgba(${r() < 0.5 ? '255,252,246' : '205,196,184'},${0.04 + r() * 0.05})`
        g.beginPath()
        g.ellipse(x0 + r() * half, y0 + r() * half, 20 + r() * 90, 10 + r() * 50, r() * 3, 0, 7)
        g.fill()
      }
      g.save()
      g.beginPath()
      g.rect(x0, y0, half, half)
      g.clip()
      for (let v = 0; v < 6; v++) {
        g.strokeStyle = vein
        g.globalAlpha = 0.12 + r() * 0.25
        g.lineWidth = 0.6 + r() * 1.6
        g.beginPath()
        let px = x0 + r() * half
        let py = y0
        g.moveTo(px, py)
        const dir = (r() - 0.5) * 1.4
        while (py < y0 + half) {
          px += dir * 8 + (r() - 0.5) * 14
          py += 6 + r() * 10
          g.lineTo(px, py)
        }
        g.stroke()
      }
      g.restore()
      g.globalAlpha = 1
    }
  // Hairline joints.
  g.fillStyle = 'rgba(120,108,92,.55)'
  for (const p of [0, half]) {
    g.fillRect(p, 0, 1.5, h)
    g.fillRect(0, p, w, 1.5)
  }
}

/** 1 m of dark Nero Marquina for inlay bands. */
const nero: Paint = (g, w, h) => {
  const r = rng(77)
  g.fillStyle = '#1d1c1b'
  g.fillRect(0, 0, w, h)
  for (let v = 0; v < 26; v++) {
    g.strokeStyle = `rgba(235,232,226,${0.15 + r() * 0.45})`
    g.lineWidth = 0.4 + r() * 1.1
    g.beginPath()
    let x = r() * w
    let y = 0
    g.moveTo(x, y)
    while (y < h) {
      x += (r() - 0.5) * 22
      y += 8 + r() * 14
      g.lineTo(x, y)
    }
    g.stroke()
  }
}

/** 3 m of fresh sand-cement screed, the bare floor of a unit handed over for fit-out. */
const screed: Paint = (g, w, h) => {
  const r = rng(91)
  g.fillStyle = '#9d9a94'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,38,36'},${0.02 + r() * 0.04})`
    g.beginPath()
    g.arc(r() * w, r() * h, 1 + r() * 18, 0, 7)
    g.fill()
  }
  // Trowel arcs and a hairline crack or two.
  g.strokeStyle = 'rgba(255,255,255,.05)'
  for (let i = 0; i < 60; i++) {
    g.lineWidth = 6 + r() * 10
    g.beginPath()
    g.arc(r() * w, r() * h, 40 + r() * 80, r() * 6, r() * 6 + 1.2)
    g.stroke()
  }
  g.strokeStyle = 'rgba(40,36,32,.25)'
  g.lineWidth = 1
  for (let i = 0; i < 3; i++) {
    g.beginPath()
    let x = r() * w
    let y = r() * h
    g.moveTo(x, y)
    for (let k = 0; k < 12; k++) g.lineTo((x += (r() - 0.5) * 40), (y += (r() - 0.3) * 30))
    g.stroke()
  }
}

/** 2.4 m of the false ceiling: seamless white gypsum with a fine shadow-gap grid at 1.2 m. */
const gypsum: Paint = (g, w, h) => {
  const r = rng(53)
  g.fillStyle = '#f2f0eb'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 300; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '200,196,188'},${0.03 + r() * 0.03})`
    g.fillRect(r() * w, r() * h, 2 + r() * 30, 2 + r() * 30)
  }
  g.fillStyle = 'rgba(150,144,134,.35)'
  g.fillRect(0, 0, w, 2)
  g.fillRect(0, 0, 2, h)
}

/** 1 m of bare concrete soffit, the underside of the slab over an unfitted unit. */
const soffit: Paint = (g, w, h) => {
  const r = rng(61)
  g.fillStyle = '#7d7b78'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.02 + r() * 0.04})`
    g.beginPath()
    g.arc(r() * w, r() * h, 1 + r() * 10, 0, 7)
    g.fill()
  }
}

/**
 * The interior as glossy surfaces see it: a warm, mostly dark hall with rows of downlights, the
 * lit ceiling coves and the bright atrium skylight above. Reflected in polished stone and metal.
 */
const interiorEnv: Paint = (g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#f7f3ea')
  sky.addColorStop(0.18, '#d9cfbf')
  sky.addColorStop(0.45, '#8d8274')
  sky.addColorStop(0.55, '#5d554c')
  sky.addColorStop(1, '#3a342e')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  // Downlights in rows overhead, cove lines, shopfronts glowing round the horizon.
  const r = rng(13)
  for (let row = 0; row < 6; row++) {
    const y = h * (0.06 + row * 0.055)
    for (let i = 0; i < 40; i++) {
      g.fillStyle = 'rgba(255,248,230,.95)'
      g.beginPath()
      g.arc((i / 40) * w + (row % 2) * 12, y, 2.5 + row * 0.4, 0, 7)
      g.fill()
    }
  }
  g.fillStyle = 'rgba(255,236,200,.7)'
  g.fillRect(0, h * 0.38, w, 3)
  for (let x = 0; x < w; ) {
    const bw = 40 + r() * 90
    g.fillStyle = `rgba(255,${226 + r() * 20},${190 + r() * 40},${0.35 + r() * 0.3})`
    g.fillRect(x, h * 0.42, bw - 8, h * 0.08)
    x += bw
  }
}

/** A dark rubber handrail with faint moulding marks, so its travel can be seen. */
const handrail: Paint = (g, w, h) => {
  g.fillStyle = '#121212'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 4; i++) {
    g.fillStyle = 'rgba(255,255,255,.07)'
    g.fillRect((i / 4) * w, 0, w * 0.04, h)
  }
}

/** The tread of an escalator step: cleats running along the travel, in die-cast aluminium. */
const cleats: Paint = (g, w, h) => {
  g.fillStyle = '#7d8084'
  g.fillRect(0, 0, w, h)
  const n = 48
  for (let i = 0; i < n; i++) {
    g.fillStyle = 'rgba(20,22,24,.75)'
    g.fillRect((i / n) * w + w / n / 2, 0, w / n / 2.4, h)
  }
}

/** A chequered stainless landing plate at an escalator's comb. */
const chequer: Paint = (g, w, h) => {
  g.fillStyle = '#a8abae'
  g.fillRect(0, 0, w, h)
  const n = 16
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      g.save()
      g.translate(((i + 0.5) / n) * w, ((j + 0.5) / n) * h)
      g.rotate((i + j) % 2 ? 0.8 : -0.8)
      g.fillStyle = 'rgba(255,255,255,.35)'
      g.fillRect(-w / n / 3, -1.5, (w / n) * 0.66, 3)
      g.fillStyle = 'rgba(0,0,0,.25)'
      g.fillRect(-w / n / 3, 1.5, (w / n) * 0.66, 1.5)
      g.restore()
    }
}

/** 3 m of loop-pile carpet for the gaming hall: a deep ground with scattered neon shapes. */
const arcadeCarpet = (ground: string, inks: string[], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = ground
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 70; i++) {
    g.strokeStyle = inks[Math.floor(r() * inks.length)]
    g.globalAlpha = 0.7
    g.lineWidth = 3
    const x = r() * w
    const y = r() * h
    const s = 10 + r() * 22
    g.beginPath()
    const kind = r()
    if (kind < 0.33) g.arc(x, y, s / 2, 0, 7)
    else if (kind < 0.66) {
      g.moveTo(x, y - s / 2)
      g.lineTo(x + s / 2, y + s / 2)
      g.lineTo(x - s / 2, y + s / 2)
      g.closePath()
    } else {
      g.moveTo(x - s / 2, y)
      g.lineTo(x + s / 2, y)
    }
    g.stroke()
  }
  g.globalAlpha = 1
}

/** 2 m of maple bowling lane boards, with the approach dots and lane arrows painted where the plan puts them. */
const maple: Paint = (g, w, h) => {
  const r = rng(27)
  const boards = 26
  for (let i = 0; i < boards; i++) {
    const t = 0.9 + r() * 0.1
    g.fillStyle = `rgb(${Math.round(222 * t)},${Math.round(184 * t)},${Math.round(132 * t)})`
    g.fillRect(0, (i / boards) * h, w, h / boards)
    g.fillStyle = 'rgba(90,60,30,.25)'
    g.fillRect(0, (i / boards) * h, w, 1)
  }
}

/** Soft rubber play flooring in pastel squares. */
const playMat: Paint = (g, w, h) => {
  const cols = ['#f6c4c0', '#bfe3d3', '#fbe2a4', '#c3d6f2']
  const n = 4
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      g.fillStyle = cols[(i + j * 3) % 4]
      g.fillRect((i / n) * w, (j / n) * h, w / n, h / n)
      g.strokeStyle = 'rgba(0,0,0,.08)'
      g.strokeRect((i / n) * w, (j / n) * h, w / n, h / n)
    }
}

/** 0.6 m ceramic washroom tile. */
const wcTile = (base: string): Paint => (g, w, h) => {
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(0,0,0,.12)'
  g.fillRect(0, 0, w, 2)
  g.fillRect(0, 0, 2, h)
}

/** Fluted walnut for the lift lobby's feature wall: 30 mm flutes. */
const walnutFlutes: Paint = (g, w, h) => {
  const r = rng(41)
  g.fillStyle = '#5a3b26'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 400; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '120,80,50' : '40,24,14'},${0.1 + r() * 0.15})`
    g.fillRect(0, r() * h, w, 1 + r() * 2)
  }
  const n = 32
  for (let i = 0; i < n; i++) {
    const x = (i / n) * w
    const gr = g.createLinearGradient(x, 0, x + w / n, 0)
    gr.addColorStop(0, 'rgba(0,0,0,.35)')
    gr.addColorStop(0.5, 'rgba(255,220,180,.08)')
    gr.addColorStop(1, 'rgba(0,0,0,.35)')
    g.fillStyle = gr
    g.fillRect(x, 0, w / n, h)
  }
}

/* ---------- the set ---------- */

export function interiorMaterials(k: Kit, lighting: Lighting) {
  const tex = (w: number, h: number, paint: Paint, metres = 1) => {
    const t = k.tex.painted(w, h, paint)
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1 / metres, 1 / metres)
    return t
  }
  const env = k.tex.painted(1024, 512, interiorEnv)
  env.mapping = EquirectangularReflectionMapping
  const all: MeshStandardMaterial[] = []
  const std = (p: MeshStandardMaterialParameters, reflect = 0.6) => {
    const m = new MeshStandardMaterial({ roughness: 0.8, envMap: env, envMapIntensity: reflect, ...p })
    m.userData.interior = true
    all.push(m)
    return m
  }
  const glow = (p: MeshStandardMaterialParameters, day = 1) => lighting.glow(std(p), day)
  const physical = (p: ConstructorParameters<typeof MeshPhysicalMaterial>[0]) => {
    const m = new MeshPhysicalMaterial({ envMap: env, envMapIntensity: 0.8, ...p })
    m.userData.interior = true
    all.push(m)
    return m
  }

  const marbleMap = tex(1024, 1024, marble([236, 230, 219], '#9a8c7a', 5), 2.4)
  const marbleBump = k.tex.normalPainted('mall_int_marble', 1024, 1024, marble([236, 230, 219], '#9a8c7a', 5), 1 / 2.4, 1 / 2.4)
  const carpet = (ground: string, inks: string[], seed: number) => std({ map: tex(512, 512, arcadeCarpet(ground, inks, seed), 3), roughness: 0.95 }, 0.05)

  return {
    env,
    all,
    /* floors */
    marble: std({ map: marbleMap, normalMap: marbleBump, normalScale: new Vector2(0.05, 0.05), roughness: 0.14, metalness: 0.02 }, 0.75),
    marbleWarm: std({ map: tex(1024, 1024, marble([226, 214, 196], '#7d6a55', 9), 2.4), roughness: 0.16 }, 0.7),
    nero: std({ map: tex(512, 512, nero, 1), roughness: 0.12 }, 0.8),
    screed: std({ map: tex(512, 512, screed, 3), roughness: 0.92 }, 0.04),
    maple: std({ map: tex(512, 512, maple, 2), roughness: 0.18 }, 0.7),
    approach: std({ color: '#2c2a33', roughness: 0.6 }, 0.2),
    arcade: carpet('#14122a', ['#ff3fa4', '#36e0ff', '#ffd23f', '#7cff6b'], 3),
    vr: carpet('#101820', ['#36e0ff', '#2a6cff'], 4),
    racing: std({ color: '#1b1c1f', roughness: 0.7 }, 0.15),
    esports: carpet('#0e1430', ['#5f6bff', '#36e0ff'], 6),
    hockey: carpet('#1a1424', ['#ff6b3f', '#ffd23f'], 7),
    kids: std({ map: tex(256, 256, playMat, 2), roughness: 0.85 }, 0.05),
    counterFloor: std({ color: '#3a2f45', roughness: 0.5 }, 0.3),
    audiFloor: std({ color: '#2a1f22', roughness: 0.95 }, 0.05),
    foyer: std({ map: tex(1024, 1024, marble([60, 52, 50], '#b9a27a', 31), 2.4), roughness: 0.12 }, 0.85),
    wcFloor: std({ map: tex(256, 256, wcTile('#8f8a84'), 0.6), roughness: 0.5 }, 0.3),
    wcWall: std({ map: tex(256, 256, wcTile('#ece8e1'), 0.6), roughness: 0.35 }, 0.4),
    /* ceilings */
    // The ceiling carries the light its coves and downlights throw onto it.
    gypsum: glow({ map: tex(512, 512, gypsum, 2.4), emissive: '#fff4e4', emissiveIntensity: 0.32, roughness: 0.92 }, 0.9),
    soffit: std({ map: tex(256, 256, soffit, 1), roughness: 0.95, side: DoubleSide }, 0),
    blackCeiling: std({ color: '#151517', roughness: 0.95 }, 0),
    /* walls and cladding */
    primer: std({ color: '#e9e6e0', roughness: 0.9 }, 0.05),
    wallPaint: std({ color: '#efebe4', roughness: 0.75 }, 0.1),
    stoneClad: std({ map: tex(1024, 1024, marble([232, 225, 214], '#8d7c66', 17), 2.4), roughness: 0.2 }, 0.6),
    walnut: std({ map: tex(512, 512, walnutFlutes, 1), roughness: 0.5 }, 0.3),
    cladWhite: std({ color: '#f1eee8', roughness: 0.32, metalness: 0.1 }, 0.6),
    blockwork: std({ color: '#d9d6cf', roughness: 0.92 }, 0.05),
    acoustic: std({ color: '#2b2427', roughness: 0.95 }, 0),
    /* metals */
    champagne: std({ color: '#b9a07a', metalness: 0.85, roughness: 0.3 }, 1),
    bronze: std({ color: '#5d4b39', metalness: 0.8, roughness: 0.38 }, 0.9),
    stainless: std({ color: '#c8cbce', metalness: 0.9, roughness: 0.28 }, 1),
    darkMetal: std({ color: '#2a2b2e', metalness: 0.6, roughness: 0.45 }, 0.6),
    /* glass */
    shopGlass: physical({ color: '#dfe9e8', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.16, depthWrite: false, side: DoubleSide }),
    railGlass: physical({ color: '#cfe2dd', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.22, depthWrite: false, side: DoubleSide }),
    /* light */
    downlight: glow({ color: '#fff8ec', emissive: '#ffe9c8', emissiveIntensity: 2.2, roughness: 0.4 }, 0.8),
    cove: glow({ color: '#fff3dc', emissive: '#ffdcae', emissiveIntensity: 1.6, roughness: 0.5 }, 0.8),
    neon: (colour: string) => glow({ color: colour, emissive: colour, emissiveIntensity: 1.4, roughness: 0.5 }, 1),
    exit: glow({ color: '#1a9a52', emissive: '#22c46a', emissiveIntensity: 1.3, roughness: 0.4 }, 1),
    skylight: physical({ color: '#bcd3dc', metalness: 0, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false, side: DoubleSide }),
    /* furniture */
    leatherTaupe: std({ color: '#8a7563', roughness: 0.55 }, 0.25),
    velvetTeal: std({ color: '#21494b', roughness: 0.85 }, 0.05),
    boucle: std({ color: '#e7e1d6', roughness: 0.95 }, 0.02),
    tableTop: std({ map: tex(1024, 1024, marble([240, 236, 230], '#a49684', 23), 1.2), roughness: 0.15 }, 0.7),
    oak: std({ color: '#b48a5e', roughness: 0.55 }, 0.2),
    chairShell: std({ color: '#cdbfae', roughness: 0.6 }, 0.15),
    planter: std({ color: '#3b3836', roughness: 0.5, metalness: 0.2 }, 0.4),
    soil: std({ color: '#2a211a', roughness: 1 }, 0),
    leaf: std({ color: '#6e8a52', roughness: 0.75 }, 0.1),
    leafDark: std({ color: '#475f3a', roughness: 0.75 }, 0.1),
    porcelain: std({ color: '#f4f4f2', roughness: 0.2 }, 0.6),
    water: std({ color: '#1d2a2c', roughness: 0.02, metalness: 0.3 }, 1.4),
    mirror: std({ color: '#d7dde0', metalness: 1, roughness: 0.04 }, 1.2),
    /* escalators */
    step: std({ map: tex(256, 256, cleats, 1), vertexColors: true, metalness: 0.6, roughness: 0.42 }, 0.4),
    combPlate: std({ map: tex(256, 256, chequer, 1.2), metalness: 0.85, roughness: 0.35 }, 0.8),
    combYellow: std({ color: '#e7b41f', roughness: 0.5 }, 0.2),
    handrail: (dir: 1 | -1): MeshStandardMaterial => {
      const t = tex(256, 16, handrail, 1)
      t.repeat.set(dir, 1)
      return std({ map: t, roughness: 0.45 }, 0.3)
    },
    hazard: std({ color: '#e1b12c', roughness: 0.6 }, 0.1),
    black: std({ color: '#111214', roughness: 0.6 }, 0.2),
  }
}

export type InteriorMaterials = ReturnType<typeof interiorMaterials>

/** A texture's map offset scrolled by `d` metres along its u (for a moving handrail). */
export function scroll(t: Texture | null, d: number) {
  if (t) t.offset.x = (t.offset.x + d) % 1
}
