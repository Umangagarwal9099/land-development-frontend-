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
