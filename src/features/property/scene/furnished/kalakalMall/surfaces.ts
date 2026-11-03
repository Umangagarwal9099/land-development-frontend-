import { rng, type Paint } from '../textures'

/*
 * The mall's ground and sky, painted at true scale. Each ground finish varies tile by tile and
 * carries the wear a finished site picks up (joint dirt, tyre polish, stains), so it reads as built
 * rather than as a repeating swatch; a separate low-frequency map breaks the repeat further.
 */

const shade = (rgb: number[], d: number) => `rgb(${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v + d)))).join(',')})`

function speckle(g: CanvasRenderingContext2D, r: () => number, x: number, y: number, w: number, h: number, n: number, tones: string[], size = 1.6) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = tones[Math.floor(r() * tones.length)]
    g.fillRect(x + r() * w, y + r() * h, 0.6 + r() * size, 0.6 + r() * size)
  }
}

/** Flamed grey granite in 600 mm squares with 3 mm joints; the canvas is 4.8 m (8 × 8 slabs). */
export const granitePaving: Paint = (g, w, h) => {
  const r = rng(601)
  const n = 8
  const s = w / n
  g.fillStyle = '#5f5d59'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const base = [121, 119, 115]
      const d = (r() - 0.5) * 18
      g.fillStyle = shade(base, d)
      g.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3)
      speckle(g, r, i * s + 2, j * s + 2, s - 4, s - 4, 900, ['rgba(40,40,42,.55)', 'rgba(235,233,228,.5)', 'rgba(120,104,98,.35)', 'rgba(90,90,92,.4)'])
      // Dirt gathers along the joints.
      const edge = g.createLinearGradient(i * s, 0, i * s + 10, 0)
      edge.addColorStop(0, 'rgba(50,46,40,.18)')
      edge.addColorStop(1, 'rgba(50,46,40,0)')
      g.fillStyle = edge
      g.fillRect(i * s, j * s, 10, s)
      if (r() < 0.12) {
        const x = i * s + r() * s
        const y = j * s + r() * s
        const gr = g.createRadialGradient(x, y, 0, x, y, 8 + r() * 20)
        gr.addColorStop(0, 'rgba(60,54,46,.16)')
        gr.addColorStop(1, 'rgba(60,54,46,0)')
        g.fillStyle = gr
        g.fillRect(i * s, j * s, s, s)
      }
    }
}

/** Broom-finished concrete with saw-cut joints at 1.5 m; the canvas is 3 m. */
export const broomConcrete: Paint = (g, w, h) => {
  const r = rng(611)
  g.fillStyle = '#97948d'
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 1.5) {
    g.fillStyle = `rgba(${r() < 0.5 ? '80,78,74' : '210,208,202'},${0.05 + r() * 0.08})`
    g.fillRect(0, y, w, 1 + r())
  }
  speckle(g, r, 0, 0, w, h, 9000, ['rgba(70,68,64,.35)', 'rgba(220,218,212,.35)'])
  for (let k = 0; k < 12; k++) {
    const x = r() * w
    const y = r() * h
    const rad = 30 + r() * 120
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(${r() < 0.6 ? '90,86,78' : '200,198,190'},.12)`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  g.fillStyle = 'rgba(60,58,54,.7)'
  g.fillRect(0, 0, w, 2)
  g.fillRect(0, h / 2, w, 2)
  g.fillRect(0, 0, 2, h)
  g.fillRect(w / 2, 0, 2, h)
}

/** Grey 200 × 100 mm concrete pavers in stretcher bond; the canvas is 2.4 m. */
export const interlock: Paint = (g, w, h) => {
  const r = rng(621)
  const u = w / 24
  g.fillStyle = '#5c5a56'
  g.fillRect(0, 0, w, h)
  for (let row = 0; row < 24; row++)
    for (let i = -1; i < 12; i++) {
      const x = i * 2 * u + (row % 2) * u
      g.fillStyle = shade([138, 136, 131], (r() - 0.5) * 24)
      g.fillRect(x + 1, row * u + 1, 2 * u - 2, u - 2)
      if (x < 0) g.fillRect(x + w + 1, row * u + 1, 2 * u - 2, u - 2)
    }
  speckle(g, r, 0, 0, w, h, 14000, ['rgba(60,58,54,.25)', 'rgba(210,208,200,.25)'])
  // Tyre polish and oil where cars stand.
  for (let k = 0; k < 8; k++) {
    const x = r() * w
    const y = r() * h
    const rad = 20 + r() * 60
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, 'rgba(30,28,26,.22)')
    gr.addColorStop(1, 'rgba(30,28,26,0)')
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
}

/** Two-year-old bituminous concrete: grey-black binder, exposed aggregate, a sealed crack or two; 8 m. */
export const agedAsphalt: Paint = (g, w, h) => {
  const r = rng(631)
  g.fillStyle = '#48484a'
  g.fillRect(0, 0, w, h)
  speckle(g, r, 0, 0, w, h, 60000, ['rgba(25,25,27,.5)', 'rgba(120,118,114,.45)', 'rgba(160,156,150,.35)', 'rgba(70,68,66,.5)'], 1.8)
  for (let k = 0; k < 40; k++) {
    const x = r() * w
    const y = r() * h
    const rad = 30 + r() * 160
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(${r() < 0.55 ? '22,22,24' : '110,108,104'},.14)`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  for (let k = 0; k < 3; k++) {
    let x = r() * w
    let y = r() * h
    g.strokeStyle = 'rgba(15,15,16,.6)'
    g.lineWidth = 2 + r() * 3
    g.beginPath()
    g.moveTo(x, y)
    for (let i = 0; i < 14; i++) {
      x += (r() - 0.5) * 40
      y += 10 + r() * 20
      g.lineTo(x, y)
    }
    g.stroke()
  }
}

/** Mown lawn seen from above, under the blades: green over patchy soil; 3 m. */
export const lawnGround: Paint = (g, w, h) => {
  const r = rng(641)
  g.fillStyle = '#4b5a2e'
  g.fillRect(0, 0, w, h)
  for (let k = 0; k < 60; k++) {
    const x = r() * w
    const y = r() * h
    const rad = 10 + r() * 60
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, r() < 0.4 ? 'rgba(110,92,62,.35)' : 'rgba(90,110,50,.3)')
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  speckle(g, r, 0, 0, w, h, 30000, ['rgba(40,52,22,.5)', 'rgba(120,140,70,.4)', 'rgba(90,76,52,.3)'], 2)
}

/** Planting beds: dark, mulched soil. */
export const mulch: Paint = (g, w, h) => {
  const r = rng(651)
  g.fillStyle = '#3e3227'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 3000; i++) {
    g.strokeStyle = `rgba(${r() < 0.5 ? '90,70,50' : '28,22,18'},${0.4 + r() * 0.4})`
    g.lineWidth = 1 + r() * 2
    const x = r() * w
    const y = r() * h
    const a = r() * 6.28
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * (4 + r() * 8), y + Math.sin(a) * (4 + r() * 8))
    g.stroke()
  }
}

/** One 900 mm precast kerb unit: cast concrete with its joint at the end; repeats along a run. */
export const kerbUnit: Paint = (g, w, h) => {
  const r = rng(661)
  g.fillStyle = '#a3a09a'
  g.fillRect(0, 0, w, h)
  speckle(g, r, 0, 0, w, h, 2500, ['rgba(70,68,64,.4)', 'rgba(220,218,212,.4)'])
  const gr = g.createLinearGradient(0, h, 0, 0)
  gr.addColorStop(0, 'rgba(60,56,50,.35)')
  gr.addColorStop(0.4, 'rgba(60,56,50,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(50,48,44,.8)'
  g.fillRect(0, 0, 3, h)
}

/** Road paint worn by traffic: mostly white, the binder showing through in flecks. */
export const wornPaint: Paint = (g, w, h) => {
  const r = rng(671)
  g.fillStyle = '#e4e1d8'
  g.fillRect(0, 0, w, h)
  speckle(g, r, 0, 0, w, h, 2200, ['rgba(70,70,72,.55)', 'rgba(150,148,142,.4)'], 2.5)
}

/** Large, soft variation in tone, laid over every ground finish at a 30 m scale to break its repeat. */
export const macro: Paint = (g, w, h) => {
  const r = rng(681)
  g.fillStyle = '#d8d8d8'
  g.fillRect(0, 0, w, h)
  for (let k = 0; k < 90; k++) {
    const x = r() * w
    const y = r() * h
    const rad = 20 + r() * 110
    for (const [ox, oy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) {
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad)
      const v = r() < 0.5 ? 150 : 255
      gr.addColorStop(0, `rgba(${v},${v},${v},.22)`)
      gr.addColorStop(1, `rgba(${v},${v},${v},0)`)
      g.fillStyle = gr
      g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2)
    }
  }
}

/**
 * An equirectangular sky for reflections: what the glass and metal of a building on the HMDA road
 * would see. Daylight: a hazy blue sky with fair-weather cumulus, a pale horizon, a skyline of
 * trees and low buildings, and the ground. Dusk: the same, after sunset, with warm horizon glow.
 */
export const sky = (dusk: boolean): Paint => (g, w, h) => {
  const r = rng(dusk ? 702 : 701)
  const horizon = h * 0.5
  const top = g.createLinearGradient(0, 0, 0, horizon)
  if (dusk) {
    top.addColorStop(0, '#141c30')
    top.addColorStop(0.6, '#34415f')
    top.addColorStop(0.92, '#7c7a88')
    top.addColorStop(1, '#a8907f')
  } else {
    top.addColorStop(0, '#4f78ab')
    top.addColorStop(0.55, '#8eb0d0')
    top.addColorStop(0.95, '#d8e1e6')
    top.addColorStop(1, '#e7ebea')
  }
  g.fillStyle = top
  g.fillRect(0, 0, w, horizon)
  // Clouds: soft clusters of puffs, flattened, thicker towards the horizon.
  for (let c = 0; c < (dusk ? 14 : 26); c++) {
    const cx = r() * w
    const cy = horizon * (0.25 + r() * 0.65)
    const size = (18 + r() * 40) * (cy / horizon)
    for (let p = 0; p < 14; p++) {
      const x = cx + (r() - 0.5) * size * 4
      const y = cy + (r() - 0.5) * size * 0.6
      const rad = size * (0.4 + r() * 0.7)
      const gr = g.createRadialGradient(x, y, 0, x, y, rad)
      gr.addColorStop(0, dusk ? 'rgba(150,120,120,.35)' : 'rgba(255,255,255,.6)')
      gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr
      g.fillRect(x - rad, y - rad * 0.5, rad * 2, rad)
    }
  }
  // Skyline: tree canopies and low buildings along the horizon.
  g.fillStyle = dusk ? '#1d1f22' : '#5f6b62'
  for (let x = 0; x < w; x += 3) g.fillRect(x, horizon - (4 + Math.abs(Math.sin(x * 0.07) * 5 + Math.sin(x * 0.013) * 6) + r() * 3), 3, 20)
  for (let k = 0; k < 30; k++) {
    const bw = 8 + r() * 30
    const bh = 6 + r() * 22
    g.fillStyle = dusk ? `rgba(30,32,36,1)` : `rgb(${150 + r() * 40},${150 + r() * 38},${148 + r() * 30})`
    g.fillRect(r() * w, horizon - bh, bw, bh + 2)
    if (dusk) {
      g.fillStyle = 'rgba(255,200,130,.6)'
      for (let i = 0; i < 6; i++) g.fillRect(r() * w, horizon - r() * 20, 1.5, 1.5)
    }
  }
  const ground = g.createLinearGradient(0, horizon, 0, h)
  ground.addColorStop(0, dusk ? '#2a2a2b' : '#7c7a73')
  ground.addColorStop(1, dusk ? '#141414' : '#55534e')
  g.fillStyle = ground
  g.fillRect(0, horizon, w, h - horizon)
}
