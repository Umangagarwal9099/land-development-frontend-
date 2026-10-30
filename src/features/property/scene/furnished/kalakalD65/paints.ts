import { rng, type Paint } from '../textures'

/*
 * Surface paintings for the D-65 residence. Each canvas tiles seamlessly; the scale each one
 * represents is noted so materials can set real-world repeats.
 */

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
const rgb = (c: number[], d = 0) => `rgb(${c.map((v) => clamp(v + d)).join(',')})`

/** Split-face ledgestone cladding in light beige quartzite strips; the canvas is 0.6 × 0.6 m. */
export const ledgestone: Paint = (g, w, h) => {
  const r = rng(301)
  // Dark joints show between the strips, as on dry-stacked panels.
  g.fillStyle = '#b4aa99'
  g.fillRect(0, 0, w, h)
  const heights: number[] = []
  let sum = 0
  while (sum < 1) {
    const s = 0.045 + r() * 0.055
    heights.push(s)
    sum += s
  }
  const tones = [[236, 228, 212], [226, 216, 198], [240, 234, 222], [214, 207, 194], [232, 218, 194], [221, 214, 204]]
  let y = 0
  for (const s of heights) {
    const rowH = (s / sum) * h
    let x = -r() * w * 0.3
    while (x < w) {
      const len = w * (0.1 + r() * 0.32)
      const tone = tones[Math.floor(r() * tones.length)]
      const vary = r() * 18 - 9
      for (const off of [-w, 0, w]) {
        const x0 = x + off + 1.5
        const y0 = y + 1.2
        const sw = len - 3
        const sh = rowH - 2.4
        // Each strip catches light on its upper edge and falls into shadow below: a split face.
        const gr = g.createLinearGradient(0, y0, 0, y0 + sh)
        gr.addColorStop(0, rgb(tone, vary + 10))
        gr.addColorStop(0.35, rgb(tone, vary))
        gr.addColorStop(1, rgb(tone, vary - 18))
        g.fillStyle = gr
        g.fillRect(x0, y0, sw, sh)
      }
      // Pitted, layered surface.
      for (let i = 0; i < len * rowH * 0.02; i++) {
        const px = x + r() * len
        const py = y + 2 + r() * (rowH - 4)
        g.fillStyle = `rgba(${r() < 0.55 ? '70,60,48' : '255,250,240'},${0.08 + r() * 0.16})`
        for (const off of [-w, 0, w]) g.fillRect(px + off, py, 1 + r() * 5, 0.8 + r() * 1.6)
      }
      x += len
    }
    y += rowH
  }
}

/** Wood boards with the grain running along v, four 150 mm boards to the canvas, around a base colour. */
const boards = (tone: number[], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const pw = w / 4
  for (let p = 0; p < 4; p++) {
    const base = [tone[0] + r() * 16, tone[1] + r() * 10, tone[2] + r() * 8]
    g.fillStyle = rgb(base)
    g.fillRect(p * pw, 0, pw, h)
    for (let i = 0; i < 90; i++) {
      const x = p * pw + r() * pw
      g.strokeStyle = `rgba(${r() < 0.65 ? '74,40,18' : '236,180,120'},${0.05 + r() * 0.12})`
      g.lineWidth = 0.5 + r() * 2.2
      g.beginPath()
      g.moveTo(x, 0)
      for (let yy = 0; yy <= h; yy += 32) g.lineTo(x + Math.sin(yy * 0.012 + i) * 2.5 * r(), yy)
      g.stroke()
    }
    g.fillStyle = 'rgba(40,22,10,.6)'
    g.fillRect(p * pw, 0, 2, h)
  }
}

/** Warm teak, for the façade battens, soffits and door. */
export const teak = boards([146, 100, 64], 77)
/** Warm natural oak, for the kitchen's fluted panels, shelving and boards. */
export const lightOak = boards([176, 124, 82], 78)

/** Light grey granite-look pavers, 600 × 600 mm; the canvas is a 2.4 m square. */
export const pavers: Paint = (g, w, h) => {
  const r = rng(91)
  const n = 4
  const s = w / n
  g.fillStyle = '#8f8b84'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const t = r() * 14 - 7
      g.fillStyle = rgb([196, 193, 187], t)
      g.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3)
      for (let k = 0; k < 260; k++) {
        g.fillStyle = `rgba(${r() < 0.5 ? '90,88,84' : '250,248,244'},${r() * 0.3})`
        g.fillRect(i * s + 2 + r() * (s - 4), j * s + 2 + r() * (s - 4), 1 + r() * 1.5, 1 + r() * 1.5)
      }
    }
}

/** Road asphalt with a fine aggregate; the canvas is a 4 m square. */
export const asphalt: Paint = (g, w, h) => {
  const r = rng(12)
  g.fillStyle = '#3c3d3f'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 16000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '20,20,22' : '150,150,148'},${r() * 0.35})`
    g.fillRect(r() * w, r() * h, 1 + r(), 1 + r())
  }
  for (let i = 0; i < 30; i++) {
    const x = r() * w
    const y = r() * h
    const rad = 20 + r() * 90
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(${r() < 0.5 ? '25,25,27' : '95,95,95'},.18)`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
}

/** Smooth exterior emulsion over sand-faced plaster: off-white with faint trowel clouding; 2 m square. */
export const exteriorPaint = (ground: number[], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = rgb(ground)
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 120; i++) {
    const x = r() * w
    const y = r() * h
    const rad = 20 + r() * 90
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(${r() < 0.5 ? '150,144,134' : '255,255,255'},${0.012 + r() * 0.02})`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '120,114,104' : '255,255,255'},${r() * 0.04})`
    g.fillRect(r() * w, r() * h, 1, 1)
  }
}

/** Dense small-leaved foliage for hedges and shrubs: layered leaf flecks over deep green; 1 m square. */
export const foliage = (ground: number[], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = rgb(ground, -18)
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 5200; i++) {
    const x = r() * w
    const y = r() * h
    const t = r() * 50 - 22
    g.fillStyle = rgb(ground, t)
    g.beginPath()
    g.ellipse(x, y, 2 + r() * 4, 1 + r() * 2, r() * Math.PI, 0, 7)
    g.fill()
  }
}

/** Large-format 600 × 1200 mm porcelain in warm light beige, softly clouded; the canvas is 2.4 m square. */
export const porcelain: Paint = (g, w, h) => {
  const r = rng(53)
  g.fillStyle = '#b9b0a2'
  g.fillRect(0, 0, w, h)
  const cols = 4
  const rows = 2
  const tw = w / cols
  const th = h / rows
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const t = r() * 8 - 4
      g.fillStyle = rgb([221, 213, 200], t)
      g.fillRect(i * tw + 1, j * th + 1, tw - 2, th - 2)
      for (let k = 0; k < 14; k++) {
        const x = i * tw + r() * tw
        const y = j * th + r() * th
        const rad = 20 + r() * 70
        const gr = g.createRadialGradient(x, y, 0, x, y, rad)
        gr.addColorStop(0, `rgba(${r() < 0.5 ? '190,178,160' : '240,234,224'},.18)`)
        gr.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = gr
        g.fillRect(Math.max(i * tw + 1, x - rad), Math.max(j * th + 1, y - rad), Math.min(rad * 2, tw - 2), Math.min(rad * 2, th - 2))
      }
    }
}

/** Warm cream marble for the splashback: soft beige clouding with faint, low-contrast veins; 1.2 m square. */
export const creamMarble: Paint = (g, w, h) => {
  const r = rng(117)
  g.fillStyle = '#e8ddcc'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 90; i++) {
    const x = r() * w
    const y = r() * h
    const rad = 30 + r() * 120
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(${r() < 0.5 ? '212,198,178' : '246,240,230'},${0.05 + r() * 0.07})`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  for (let i = 0; i < 9; i++) {
    g.strokeStyle = `rgba(${r() < 0.6 ? '176,160,138' : '250,246,238'},${0.12 + r() * 0.16})`
    g.lineWidth = 0.8 + r() * 2.2
    g.beginPath()
    let x = -20
    let y = r() * h
    g.moveTo(x, y)
    while (x < w + 20) {
      x += 30 + r() * 60
      y += r() * 50 - 22
      g.lineTo(x, y)
    }
    g.stroke()
  }
}

/* ---------- Bedroom finishes ---------- */

/** Dark warm walnut boards, for the bedroom's wall panels and wardrobe. */
export const walnut = boards([112, 74, 50], 79)

/** Engineered oak floorboards, 190 mm wide in staggered lengths; the canvas is 0.76 × 2.4 m. */
export const oakFloor: Paint = (g, w, h) => {
  const r = rng(131)
  const cols = 4
  const bw = w / cols
  g.fillStyle = '#5a4430'
  g.fillRect(0, 0, w, h)
  for (let c = 0; c < cols; c++) {
    let y = -r() * h * 0.5
    while (y < h) {
      const len = h * (0.35 + r() * 0.4)
      const t = r() * 22 - 11
      const base = [168 + t, 128 + t * 0.8, 92 + t * 0.6]
      g.fillStyle = rgb(base)
      for (const off of [-h, 0, h]) {
        g.fillRect(c * bw + 1, y + off + 1, bw - 2, len - 2)
        for (let i = 0; i < 26; i++) {
          const x = c * bw + 2 + r() * (bw - 4)
          g.strokeStyle = `rgba(${r() < 0.6 ? '86,58,36' : '220,186,140'},${0.08 + r() * 0.12})`
          g.lineWidth = 0.6 + r() * 1.6
          g.beginPath()
          g.moveTo(x, y + off)
          g.bezierCurveTo(x + r() * 4 - 2, y + off + len * 0.3, x + r() * 4 - 2, y + off + len * 0.7, x + r() * 3 - 1.5, y + off + len)
          g.stroke()
        }
      }
      y += len
    }
  }
}

/** Polished white marble with soft grey veining running diagonally; the canvas is a 1.2 m square. */
export const whiteMarble: Paint = (g, w, h) => {
  const r = rng(141)
  g.fillStyle = '#f2f0ec'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 60; i++) {
    const x = r() * w
    const y = r() * h
    const rad = 40 + r() * 140
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(${r() < 0.5 ? '214,212,208' : '252,251,248'},${0.05 + r() * 0.06})`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  const vein = (x: number, y: number, len: number, width: number, alpha: number) => {
    const branches: [number, number][] = []
    g.strokeStyle = `rgba(110,106,102,${alpha})`
    g.lineWidth = width
    g.beginPath()
    g.moveTo(x, y)
    for (let i = 0; i < len; i++) {
      const cx = x + 12 + r() * 20
      const cy = y + r() * 26 - 6
      x += 26 + r() * 30
      y += 8 + r() * 26 - 6
      g.quadraticCurveTo(cx, cy, x, y)
      if (r() < 0.1) branches.push([x, y])
    }
    g.stroke()
    // Branches are drawn once the main vein is stroked, each as its own path.
    if (len > 3) for (const [bx, by] of branches) vein(bx, by, Math.floor(len / 3), width * 0.5, alpha * 0.7)
  }
  // A few bold grey veins with fine branches, and a haze of hairline ones.
  for (let i = 0; i < 4; i++) vein(-40 + r() * w * 0.5, -40 + r() * h, 22, 3 + r() * 4, 0.35 + r() * 0.2)
  for (let i = 0; i < 5; i++) vein(-40 + r() * w * 0.5, -40 + r() * h, 20, 1.2 + r() * 1.8, 0.3 + r() * 0.2)
  for (let i = 0; i < 10; i++) vein(-40 + r() * w, -40 + r() * h, 10, 0.6, 0.2 + r() * 0.15)
}

/** Ivory-and-grey trellis (quatrefoil) rug; the canvas is a 0.8 m square. */
export const trellisRug: Paint = (g, w, h) => {
  const r = rng(151)
  g.fillStyle = '#e8e4dc'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#8d8e8c'
  g.lineWidth = w * 0.018
  const n = 4
  const s = w / n
  for (let i = -1; i <= n; i++)
    for (let j = -1; j <= n; j++) {
      const cx = i * s + s / 2
      const cy = j * s + s / 2
      g.beginPath()
      g.moveTo(cx, cy - s / 2)
      g.quadraticCurveTo(cx + s * 0.18, cy - s * 0.18, cx + s / 2, cy)
      g.quadraticCurveTo(cx + s * 0.18, cy + s * 0.18, cx, cy + s / 2)
      g.quadraticCurveTo(cx - s * 0.18, cy + s * 0.18, cx - s / 2, cy)
      g.quadraticCurveTo(cx - s * 0.18, cy - s * 0.18, cx, cy - s / 2)
      g.stroke()
    }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '120,118,114' : '255,255,255'},${r() * 0.12})`
    g.fillRect(r() * w, r() * h, 1.5, 1.5)
  }
}

/** Chunky knit in warm grey-brown: cabled ribs running across; the canvas is a 0.4 m square. */
export const knit: Paint = (g, w, h) => {
  const r = rng(161)
  g.fillStyle = '#6f6458'
  g.fillRect(0, 0, w, h)
  const rows = 24
  const rh = h / rows
  for (let j = 0; j < rows; j++)
    for (let x = 0; x < w; x += rh * 0.8) {
      const t = r() * 16 - 8
      g.fillStyle = rgb([128, 116, 102], t)
      g.beginPath()
      g.ellipse(x + rh * 0.4, j * rh + rh / 2, rh * 0.42, rh * 0.36, (j % 2 ? 1 : -1) * 0.6, 0, Math.PI * 2)
      g.fill()
    }
}

/** A cushion cover in a small ivory-on-charcoal diamond weave; the canvas is one 450 mm face. */
export const diamondWeave: Paint = (g, w, h) => {
  g.fillStyle = '#4a4744'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#d9d2c6'
  g.lineWidth = 2
  const s = w / 12
  for (let i = -12; i < 24; i++) {
    g.beginPath()
    g.moveTo(i * s, 0)
    g.lineTo(i * s + h, h)
    g.stroke()
    g.beginPath()
    g.moveTo(i * s, h)
    g.lineTo(i * s + h, 0)
    g.stroke()
  }
}

/** Plain-weave upholstery in warm beige; the canvas is a 0.3 m square. */
export const upholstery = (tone: number[], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = rgb(tone)
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 2)
    for (let x = 0; x < w; x += 2) {
      const t = (r() - 0.5) * 16 + ((x + y) % 4 === 0 ? 4 : -3)
      g.fillStyle = rgb(tone, t)
      g.fillRect(x, y, 2, 2)
    }
}

/* ---------- Bathroom finishes ---------- */

/** Large-format 600 × 1200 mm matt porcelain in warm greige, set vertically; the canvas is 2.4 m square. */
export const bathWall: Paint = (g, w, h) => {
  const r = rng(181)
  g.fillStyle = '#b9ad9e'
  g.fillRect(0, 0, w, h)
  const cols = 4
  const rows = 2
  const tw = w / cols
  const th = h / rows
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const t = r() * 6 - 3
      g.fillStyle = rgb([214, 204, 190], t)
      g.fillRect(i * tw + 1, j * th + 1, tw - 2, th - 2)
      // A soft, stone-like cloud in each tile.
      for (let k = 0; k < 10; k++) {
        const x = i * tw + r() * tw
        const y = j * th + r() * th
        const rad = 20 + r() * 60
        const gr = g.createRadialGradient(x, y, 0, x, y, rad)
        gr.addColorStop(0, `rgba(${r() < 0.5 ? '196,184,168' : '232,224,212'},.16)`)
        gr.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = gr
        g.fillRect(Math.max(i * tw + 1, x - rad), Math.max(j * th + 1, y - rad), Math.min(rad * 2, tw - 2), Math.min(rad * 2, th - 2))
      }
    }
}

/**
 * Beige 75 × 300 mm tiles in a 45° herringbone, for the shower wall. Each row of the stair is a
 * flat tile and an upright one; rows repeat every (4, −4) tile widths, then the whole is turned
 * 45°, which makes the pattern repeat squarely every 4√2 tile widths: the canvas is 0.424 m.
 */
export const herringbone: Paint = (g, w, h) => {
  const r = rng(191)
  g.fillStyle = '#a99c89'
  g.fillRect(0, 0, w, h)
  const unit = w / (4 * Math.SQRT2)
  const s = unit / Math.SQRT2
  // (x, y) in tile widths → canvas, turned 45°.
  g.setTransform(s, -s, s, s, w / 2, h / 2)
  const joint = 0.06
  for (let m = -6; m <= 6; m++)
    for (let k = -14; k <= 14; k++) {
      const x = k + 4 * m
      const y = k - 4 * m
      for (const [dx, dy, ww, hh] of [[0, 0, 4, 1], [0, 1, 1, 4]] as const) {
        g.fillStyle = rgb([212, 201, 186], r() * 10 - 5)
        g.fillRect(x + dx + joint / 2, y + dy + joint / 2, ww - joint, hh - joint)
      }
    }
  g.setTransform(1, 0, 0, 1, 0, 0)
}

/** A soft, defocused reflection of a warm-lit room, for mirrors (real-time reflections cost a second render). */
export const mirrorReflection: Paint = (g, w, h) => {
  const r = rng(201)
  const gr = g.createLinearGradient(0, 0, 0, h)
  gr.addColorStop(0, '#bdb4a7')
  gr.addColorStop(0.45, '#d7cdbf')
  gr.addColorStop(1, '#a89e91')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
  // The door and wall opposite, and the glow of a ceiling light, all slightly out of focus.
  g.fillStyle = 'rgba(120,96,70,.35)'
  g.fillRect(w * 0.1, h * 0.35, w * 0.32, h * 0.65)
  const light = g.createRadialGradient(w * 0.62, h * 0.08, 0, w * 0.62, h * 0.08, w * 0.35)
  light.addColorStop(0, 'rgba(255,246,230,.9)')
  light.addColorStop(1, 'rgba(255,246,230,0)')
  g.fillStyle = light
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.03})`
    g.fillRect(r() * w, r() * h, 2, 2)
  }
}
