import { rng, type Paint } from '../textures'

// Canvas-painted surfaces for Nysha's Haven: the Balinese palette of brick, cream plaster, teak,
// alang-alang thatch, river stone and green Sukabumi stone, plus the court and its mural.

/** Red brick cladding in running bond: 4 bricks across and 8 courses per tile (0.92 × 0.6 m). */
export const brick: Paint = (g, w, h) => {
  const r = rng(11)
  g.fillStyle = '#cdbfae'
  g.fillRect(0, 0, w, h)
  const rows = 8
  const rh = h / rows
  const bw = w / 4
  for (let y = 0; y < rows; y++)
    for (let x = -1; x < 5; x++) {
      const off = (y % 2) * bw * 0.5
      const t = r()
      g.fillStyle = `rgb(${150 + t * 40},${70 + t * 22},${48 + t * 16})`
      g.fillRect(x * bw + off + 3, y * rh + 3, bw - 6, rh - 6)
      for (let i = 0; i < 6; i++) {
        g.fillStyle = `rgba(${r() < 0.5 ? '60,24,12' : '220,170,130'},${r() * 0.18})`
        g.fillRect(x * bw + off + 3 + r() * (bw - 10), y * rh + 4 + r() * (rh - 10), 4 + r() * 10, 2 + r() * 3)
      }
    }
}

/** Cream textured plaster: warm ground with a fine trowel texture. */
export const cream: Paint = (g, w, h) => {
  const r = rng(12)
  g.fillStyle = '#e8dcc6'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '180,160,130' : '255,248,236'},${r() * 0.14})`
    g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2)
  }
}

/** Alang-alang thatch: dense straw strands running down the roof in golden browns. */
export const thatch: Paint = (g, w, h) => {
  const r = rng(13)
  g.fillStyle = '#8c7a5c'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 2600; i++) {
    const t = r()
    g.strokeStyle = `rgba(${150 + t * 70},${132 + t * 62},${98 + t * 50},${0.35 + r() * 0.5})`
    g.lineWidth = 1 + r() * 2
    const x = r() * w
    const y = r() * h
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + r() * 6 - 3, y + 30 + r() * 50)
    g.stroke()
  }
  // Courses of thatch read as soft horizontal bands.
  for (let y = 0; y < h; y += h / 6) {
    g.fillStyle = 'rgba(40,24,10,.18)'
    g.fillRect(0, y, w, 6)
  }
}

/** River stone cladding: rounded stones in greys and browns, tightly set in dark mortar (1 m tile). */
export const riverStone: Paint = (g, w, h) => {
  const r = rng(14)
  g.fillStyle = '#3a342d'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 220; i++) {
    const t = r()
    g.fillStyle = `rgb(${110 + t * 70},${102 + t * 62},${90 + t * 52})`
    g.beginPath()
    g.ellipse(r() * w, r() * h, 14 + r() * 22, 10 + r() * 14, r() * 3, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(255,255,255,.08)'
    g.beginPath()
    g.ellipse(r() * w, r() * h, 6, 4, 0, 0, Math.PI * 2)
    g.fill()
  }
}

/** Green Bali Sukabumi stone, 100 mm tiles with soft tonal variation (1 m tile). */
export const sukabumi: Paint = (g, w, h) => {
  const r = rng(15)
  const n = 10
  const s = w / n
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const t = r()
      g.fillStyle = `rgb(${92 + t * 30},${134 + t * 30},${120 + t * 22})`
      g.fillRect(i * s, j * s, s, s)
      for (let k = 0; k < 10; k++) {
        g.fillStyle = `rgba(${r() < 0.5 ? '40,70,60' : '200,230,215'},${r() * 0.2})`
        g.fillRect(i * s + r() * s, j * s + r() * s, 3, 3)
      }
    }
  g.strokeStyle = 'rgba(60,80,70,.6)'
  g.lineWidth = 2
  for (let i = 0; i <= n; i++) {
    g.beginPath()
    g.moveTo(i * s, 0)
    g.lineTo(i * s, h)
    g.moveTo(0, i * s)
    g.lineTo(w, i * s)
    g.stroke()
  }
}

/** Flat site boulders laid as crazy paving with grass-filled joints (2 m tile). */
export const boulders: Paint = (g, w, h) => {
  const r = rng(16)
  g.fillStyle = '#5b5a3f'
  g.fillRect(0, 0, w, h)
  const cells = 7
  const s = w / cells
  for (let i = 0; i < cells; i++)
    for (let j = 0; j < cells; j++) {
      const t = r()
      g.fillStyle = `rgb(${150 + t * 45},${138 + t * 40},${118 + t * 34})`
      g.beginPath()
      const cx = i * s + s / 2 + (r() - 0.5) * s * 0.2
      const cy = j * s + s / 2 + (r() - 0.5) * s * 0.2
      const pts = 7
      for (let k = 0; k < pts; k++) {
        const a = (k / pts) * Math.PI * 2
        const rad = s * (0.36 + r() * 0.12)
        if (k === 0) g.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
        else g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
      }
      g.closePath()
      g.fill()
    }
}

/** Gabion basket: stacked stones behind a square steel mesh. */
export const gabion: Paint = (g, w, h) => {
  riverStone(g, w, h)
  g.strokeStyle = 'rgba(200,204,206,.75)'
  g.lineWidth = 3
  for (let x = 0; x <= w; x += w / 6) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, h)
    g.stroke()
  }
  for (let y = 0; y <= h; y += h / 6) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(w, y)
    g.stroke()
  }
}

/** Raw-finish Burma teak, vertical boards. */
export const teakBoards: Paint = (g, w, h) => {
  const r = rng(17)
  const n = 6
  const bw = w / n
  for (let i = 0; i < n; i++) {
    const t = r() * 20 - 10
    g.fillStyle = `rgb(${132 + t},${88 + t},${52 + t})`
    g.fillRect(i * bw, 0, bw, h)
    for (let k = 0; k < 40; k++) {
      g.strokeStyle = `rgba(${r() < 0.6 ? '60,36,18' : '200,150,100'},${0.08 + r() * 0.12})`
      g.lineWidth = 1 + r() * 2
      const x = i * bw + r() * bw
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x + r() * 6 - 3, h)
      g.stroke()
    }
    g.fillStyle = 'rgba(30,18,8,.55)'
    g.fillRect(i * bw, 0, 3, h)
  }
}

/** Front door: Balinese hand-carved teak leaves with floral medallions and a carved border. */
export const carvedDoor: Paint = (g, w, h) => {
  teakBoards(g, w, h)
  const leaf = w / 2
  g.strokeStyle = 'rgba(40,22,10,.7)'
  g.fillStyle = 'rgba(40,22,10,.35)'
  for (let l = 0; l < 2; l++) {
    const x0 = l * leaf
    g.lineWidth = 6
    g.strokeRect(x0 + 18, 18, leaf - 36, h - 36)
    for (const cy of [h * 0.22, h * 0.5, h * 0.78]) {
      const cx = x0 + leaf / 2
      for (let p = 0; p < 8; p++) {
        const a = (p / 8) * Math.PI * 2
        g.beginPath()
        g.ellipse(cx + Math.cos(a) * leaf * 0.16, cy + Math.sin(a) * leaf * 0.16, leaf * 0.11, leaf * 0.05, a, 0, Math.PI * 2)
        g.fill()
      }
      g.beginPath()
      g.arc(cx, cy, leaf * 0.07, 0, Math.PI * 2)
      g.stroke()
    }
  }
}

/**
 * Multi-sport court: a near-black tennis court (23.77 × 10.97 m doubles) on a darker surround,
 * as in the aerial photograph, with badminton and basketball lines in yellow for the converted
 * uses. Painted for a 36 × 11.4 m slab.
 */
export const court: Paint = (g, w, h) => {
  const sx = w / 36
  const sy = h / 11.4
  g.fillStyle = '#232526'
  g.fillRect(0, 0, w, h)
  const cx = w / 2
  const cy = h / 2
  g.fillStyle = '#2b2d2f'
  g.fillRect(cx - 11.885 * sx - 1 * sx, cy - 5.485 * sy - 1 * sy, (23.77 + 2) * sx, (10.97 + 2) * sy)
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    g.beginPath()
    g.moveTo(cx + x0 * sx, cy + y0 * sy)
    g.lineTo(cx + x1 * sx, cy + y1 * sy)
    g.stroke()
  }
  g.strokeStyle = '#f2f2ee'
  g.lineWidth = 3
  g.strokeRect(cx - 11.885 * sx, cy - 5.485 * sy, 23.77 * sx, 10.97 * sy)
  line(-11.885, -4.115, 11.885, -4.115)
  line(-11.885, 4.115, 11.885, 4.115)
  line(-6.4, -4.115, -6.4, 4.115)
  line(6.4, -4.115, 6.4, 4.115)
  line(-6.4, 0, 6.4, 0)
  // Converted uses: a basketball key at each end and badminton lines, in yellow.
  g.strokeStyle = 'rgba(242,194,0,.8)'
  g.lineWidth = 2
  for (const s of [-1, 1]) {
    g.strokeRect(cx + s * 11.885 * sx - (s > 0 ? 5.8 * sx : 0), cy - 2.45 * sy, 5.8 * sx, 4.9 * sy)
    g.beginPath()
    g.arc(cx + s * (11.885 - 5.8) * sx, cy, 1.8 * sx, 0, Math.PI * 2)
    g.stroke()
  }
  g.strokeRect(cx - 6.7 * sx, cy - 3.05 * sy, 13.4 * sx, 6.1 * sy)
}

/** Murals of sporting legends: bold painted silhouettes of a batter, a sprinter, a shuttler and a hoop. */
export const mural: Paint = (g, w, h) => {
  // As photographed: a white wall with a sweeping orange-and-yellow band, figures of sporting legends on it.
  g.fillStyle = '#efede6'
  g.fillRect(0, 0, w, h)
  const band = g.createLinearGradient(0, 0, 0, h)
  band.addColorStop(0, '#f2b631')
  band.addColorStop(1, '#e2702a')
  g.fillStyle = band
  g.beginPath()
  for (let x = 0; x <= w; x += 8) g.lineTo(x, h * (0.42 + 0.18 * Math.sin((x / w) * Math.PI * 5)))
  for (let x = w; x >= 0; x -= 8) g.lineTo(x, h * (0.72 + 0.14 * Math.sin((x / w) * Math.PI * 5 + 0.6)))
  g.closePath()
  g.fill()
  g.strokeStyle = '#141414'
  g.fillStyle = '#141414'
  g.lineCap = 'round'
  g.lineWidth = h * 0.06
  const figure = (x: number, pose: number) => {
    const y = h * 0.62
    g.beginPath()
    g.arc(x, y - h * 0.34, h * 0.06, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.moveTo(x, y - h * 0.27)
    g.lineTo(x + pose * h * 0.03, y)
    g.lineTo(x - h * 0.12, y + h * 0.26)
    g.moveTo(x + pose * h * 0.03, y)
    g.lineTo(x + h * 0.12, y + h * 0.24)
    g.moveTo(x, y - h * 0.2)
    g.lineTo(x - h * 0.14, y - h * 0.08 - pose * h * 0.1)
    g.moveTo(x, y - h * 0.2)
    g.lineTo(x + h * 0.16, y - h * 0.3 + pose * h * 0.05)
    g.stroke()
  }
  const n = 14
  for (let i = 0; i < n; i++) figure((w / n) * (i + 0.5), i % 2 ? 1 : -1)
}

/** Grey asphalt shingles in staggered courses, for the main roof. */
export const shingles: Paint = (g, w, h) => {
  const r = rng(21)
  g.fillStyle = '#6e6a6c'
  g.fillRect(0, 0, w, h)
  const rows = 12
  const rh = h / rows
  for (let y = 0; y < rows; y++) {
    const n = 8
    const off = (y % 2) * (w / n / 2)
    for (let x = -1; x <= n; x++) {
      const t = r() * 18 - 9
      g.fillStyle = `rgb(${130 + t},${125 + t},${122 + t})`
      g.fillRect(x * (w / n) + off + 2, y * rh + 2, w / n - 4, rh - 3)
    }
    g.fillStyle = 'rgba(40,36,38,.3)'
    g.fillRect(0, y * rh + rh - 3, w, 3)
  }
}

/** Dark split-face stone in long courses, for the pool's infinity wall. */
export const stackedStone: Paint = (g, w, h) => {
  const r = rng(22)
  g.fillStyle = '#1f2022'
  g.fillRect(0, 0, w, h)
  const rows = 6
  const rh = h / rows
  for (let y = 0; y < rows; y++) {
    let x = -r() * 60
    while (x < w) {
      const len = 50 + r() * 110
      const t = r() * 26
      g.fillStyle = `rgb(${54 + t},${56 + t},${60 + t})`
      g.fillRect(x + 2, y * rh + 2, len - 4, rh - 4)
      x += len
    }
  }
}

/** Red clay breeze-block screen: square blocks with a pierced cross pattern. */
export const breezeBlock: Paint = (g, w, h) => {
  g.fillStyle = '#9c4a32'
  g.fillRect(0, 0, w, h)
  const n = 4
  const s = w / n
  g.fillStyle = '#2b1a14'
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x = i * s
      const y = j * s
      g.fillRect(x + s * 0.14, y + s * 0.14, s * 0.3, s * 0.3)
      g.fillRect(x + s * 0.56, y + s * 0.14, s * 0.3, s * 0.3)
      g.fillRect(x + s * 0.14, y + s * 0.56, s * 0.3, s * 0.3)
      g.fillRect(x + s * 0.56, y + s * 0.56, s * 0.3, s * 0.3)
    }
}

/** Light grey split-stone tiles in staggered courses, cladding the pool's front wall. */
export const stoneTile: Paint = (g, w, h) => {
  const r = rng(31)
  g.fillStyle = '#6f706c'
  g.fillRect(0, 0, w, h)
  const rows = 8
  const rh = h / rows
  for (let y = 0; y < rows; y++) {
    let x = -r() * 80
    while (x < w) {
      const len = 60 + r() * 90
      const t = r() * 34
      g.fillStyle = `rgb(${150 + t},${151 + t},${147 + t})`
      g.fillRect(x + 1.5, y * rh + 1.5, len - 3, rh - 3)
      // A little cleft texture across each tile.
      g.fillStyle = `rgba(80,80,76,${0.12 + r() * 0.12})`
      g.fillRect(x + len * r(), y * rh + 2, 2, rh - 4)
      x += len
    }
  }
}

/** Beige crackle-finish paving: a warm sandy ground crazed with fine dark cracks. */
export const crazyPaving: Paint = (g, w, h) => {
  const r = rng(37)
  g.fillStyle = '#ccad8d'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 900; i++) {
    const t = r() * 26 - 13
    g.fillStyle = `rgba(${200 + t},${172 + t},${142 + t},0.5)`
    g.fillRect(r() * w, r() * h, 6 + r() * 24, 6 + r() * 24)
  }
  g.strokeStyle = 'rgba(96,72,52,0.55)'
  g.lineWidth = 1.4
  for (let i = 0; i < 260; i++) {
    let [x, y] = [r() * w, r() * h]
    g.beginPath()
    g.moveTo(x, y)
    for (let s = 0; s < 4; s++) {
      x += (r() - 0.5) * 70
      y += (r() - 0.5) * 70
      g.lineTo(x, y)
    }
    g.stroke()
  }
}

/** A coconut-palm frond on a transparent ground: a curved midrib with fine leaflets either side. */
export const palmFrond: Paint = (g, w, h) => {
  const r = rng(41)
  g.clearRect(0, 0, w, h)
  const cx = w / 2
  g.lineCap = 'round'
  for (let y = h * 0.04; y < h * 0.97; y += 5) {
    const t = y / h
    const len = w * (0.12 + 0.36 * Math.sin(Math.PI * Math.min(1, t * 1.1)))
    for (const s of [-1, 1]) {
      const shade = 70 + r() * 40
      g.strokeStyle = `rgb(${Math.round(shade * 0.82)},${Math.round(shade * 1.1 + 12)},${Math.round(shade * 0.5)})`
      g.lineWidth = 3 + r() * 1.5
      g.beginPath()
      g.moveTo(cx, h - y)
      g.quadraticCurveTo(cx + s * len * 0.5, h - y - 6, cx + s * len, h - y - 22 - r() * 8)
      g.stroke()
    }
  }
  g.strokeStyle = '#8a8a4a'
  g.lineWidth = 5
  g.beginPath()
  g.moveTo(cx, h)
  g.lineTo(cx, 0)
  g.stroke()
}

/** Rounded river pebbles in greys and warm beiges, each lit from above with a soft shadow. */
export const pebbleBed: Paint = (g, w, h) => {
  const r = rng(43)
  g.fillStyle = '#5c584f'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 1400; i++) {
    const [x, y] = [r() * w, r() * h]
    const [rx, ry] = [5 + r() * 9, 4 + r() * 6]
    const a = r() * Math.PI
    const t = r() * 50
    const warm = r() < 0.4
    g.fillStyle = 'rgba(40,36,30,0.35)'
    g.beginPath()
    g.ellipse(x + 1.5, y + 2, rx, ry, a, 0, Math.PI * 2)
    g.fill()
    const [cr, cg, cb] = warm ? [150 + t, 136 + t, 116 + t] : [128 + t, 127 + t, 122 + t]
    const grad = g.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 1, x, y, rx)
    grad.addColorStop(0, `rgb(${Math.min(cr + 30, 255)},${Math.min(cg + 30, 255)},${Math.min(cb + 30, 255)})`)
    grad.addColorStop(1, `rgb(${cr - 30},${cg - 30},${cb - 30})`)
    g.fillStyle = grad
    g.beginPath()
    g.ellipse(x, y, rx, ry, a, 0, Math.PI * 2)
    g.fill()
  }
}

/* ---------- Living room, from the photograph of its pool wall ---------- */

/** Raw basalt floor: 1200 × 600 mm charcoal tiles with brown-grey mottling; the canvas is 2 × 2 tiles (2.4 × 1.2 m). */
export const basaltFloor: Paint = (g, w, h) => {
  const r = rng(51)
  const [tw, th] = [w / 2, h / 2]
  for (let ty = 0; ty < 2; ty++)
    for (let tx = 0; tx < 2; tx++) {
      const t = r() * 14 - 7
      g.fillStyle = `rgb(${66 + t},${60 + t},${54 + t})`
      g.fillRect(tx * tw, ty * th, tw, th)
      for (let i = 0; i < 70; i++) {
        g.fillStyle = r() < 0.5 ? `rgba(30,25,21,${0.08 + r() * 0.14})` : `rgba(120,104,88,${0.05 + r() * 0.1})`
        g.beginPath()
        g.ellipse(tx * tw + r() * tw, ty * th + r() * th, 6 + r() * 40, 4 + r() * 22, r() * Math.PI, 0, Math.PI * 2)
        g.fill()
      }
      for (let i = 0; i < 1600; i++) {
        g.fillStyle = `rgba(${r() < 0.5 ? '20,17,15' : '140,128,114'},${r() * 0.3})`
        g.fillRect(tx * tw + r() * tw, ty * th + r() * th, 1 + r() * 1.5, 1 + r() * 1.5)
      }
    }
  g.fillStyle = '#1c1916'
  for (let i = 0; i <= 2; i++) {
    g.fillRect(i * tw - 1.5, 0, 3, h)
    g.fillRect(0, i * th - 1.5, w, 3)
  }
}

/** Fine linen sheer: warm off-white with vertical slub threads. */
export const sheerWeave: Paint = (g, w, h) => {
  const r = rng(52)
  g.fillStyle = '#f2ece2'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '196,184,166' : '255,252,246'},${0.1 + r() * 0.25})`
    g.fillRect(r() * w, 0, 0.6 + r() * 1.4, h)
  }
}

/** Glow down a sheer: the ceiling-pocket LED wash at the top, then the daylight through the fabric below. */
export const curtainWash: Paint = (g, w, h) => {
  const grad = g.createLinearGradient(0, 0, 0, h)
  for (const [t, v] of [[0, 255], [0.06, 236], [0.25, 168], [0.5, 140], [1, 132]]) grad.addColorStop(t, `rgb(${v},${v},${v})`)
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
}

/** Open rattan weave of the bell pendant: close vertical canes bound by horizontal rings, on transparent. */
export const rattanWeave: Paint = (g, w, h) => {
  const r = rng(53)
  g.clearRect(0, 0, w, h)
  const step = w / 14
  for (let x = 0; x < w; x += step) {
    const t = r() * 26
    g.fillStyle = `rgb(${92 + t},${66 + t * 0.7},${40 + t * 0.4})`
    g.fillRect(x, 0, 4 + r() * 1.5, h)
  }
  for (const y of [0.1, 0.36, 0.62, 0.88]) {
    g.fillStyle = '#5a4128'
    g.fillRect(0, y * h, w, 5)
  }
}


/** Chunky braided jute (rug, door mat): rows of plaited loops in the given tone. */
export const juteBraid = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = `rgb(${base.map((v) => v - 30).join(',')})`
  g.fillRect(0, 0, w, h)
  const rows = 16
  const rh = h / rows
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < w; x += rh * 0.8) {
      const t = r() * 26 - 13
      g.fillStyle = `rgb(${base.map((v) => Math.min(255, v + t)).join(',')})`
      g.beginPath()
      g.ellipse(x + (y % 2) * rh * 0.4, y * rh + rh / 2, rh * 0.42, rh * 0.36, (y % 2 ? 1 : -1) * 0.6, 0, Math.PI * 2)
      g.fill()
    }
}

/** Cream cushion cover printed with a single black palm frond, as on the living-room sofa. */
export const palmPrint: Paint = (g, w, h) => {
  g.fillStyle = '#ece4d4'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#1d1b19'
  g.lineCap = 'round'
  g.lineWidth = w * 0.012
  const stem = (t: number) => [w * (0.18 + 0.66 * t), h * (0.86 - 0.7 * t + 0.12 * Math.sin(t * Math.PI))] as const
  g.beginPath()
  for (let i = 0; i <= 20; i++) g.lineTo(...stem(i / 20))
  g.stroke()
  g.lineWidth = w * 0.007
  for (let i = 1; i < 26; i++) {
    const t = i / 26
    const [x, y] = stem(t)
    const len = w * 0.17 * Math.sin(Math.PI * Math.min(1, t * 1.15))
    for (const s of [-1, 1]) {
      g.beginPath()
      g.moveTo(x, y)
      g.quadraticCurveTo(x + s * len * 0.4, y - len * 0.5, x + s * len * 0.6 + len * 0.3, y - len * (s > 0 ? 0.2 : 0.95))
      g.stroke()
    }
  }
}

/** What the sheers soften: pale sky, the garden's trees, the terrace rail and paving beyond the glass. */
export const daylightView: Paint = (g, w, h) => {
  const r = rng(55)
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#f4f5f2')
  sky.addColorStop(0.55, '#e7e9e2')
  sky.addColorStop(1, '#d9d6cd')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 420; i++) {
    const y = h * (0.2 + r() * 0.5)
    const t = r() * 40
    g.fillStyle = `rgba(${110 + t},${132 + t},${92 + t * 0.6},${0.18 + r() * 0.3})`
    g.beginPath()
    g.ellipse(r() * w, y, 6 + r() * 26, 5 + r() * 18, 0, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = 'rgba(188,190,184,.9)'
  g.fillRect(0, h * 0.7, w, h * 0.025)
  g.fillStyle = '#d6d3cb'
  g.fillRect(0, h * 0.74, w, h * 0.26)
}

/* ---------- Living room, south wall ---------- */

/** Warm limewash plaster: soft clouds of lighter and darker trowelling over a sand ground. */
export const limewash: Paint = (g, w, h) => {
  const r = rng(61)
  g.fillStyle = '#e0ccab'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 90; i++) {
    const [x, y, rad] = [r() * w, r() * h, 30 + r() * 110]
    const light = r() < 0.5
    for (const [ox, oy] of [[0, 0], [-w, 0], [w, 0], [0, -h], [0, h]]) {
      const grad = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad)
      grad.addColorStop(0, light ? `rgba(248,238,218,${0.1 + r() * 0.12})` : `rgba(184,154,112,${0.04 + r() * 0.06})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = grad
      g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2)
    }
  }
  for (let i = 0; i < 700; i++) {
    g.strokeStyle = `rgba(${r() < 0.5 ? '150,124,92' : '250,240,222'},${0.04 + r() * 0.07})`
    g.lineWidth = 1 + r() * 3
    const [x, y, a, l] = [r() * w, r() * h, r() * Math.PI, 8 + r() * 30]
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.3)
    g.stroke()
  }
}

/** Upholstery linen: a fine slubbed plain weave in warm cream (64 threads across 10 cm). */
export const linenWeave: Paint = (g, w, h) => {
  const r = rng(62)
  g.fillStyle = '#ebe1cf'
  g.fillRect(0, 0, w, h)
  const s = w / 64
  for (let i = 0; i < 64; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '190,174,148' : '255,250,240'},${0.18 + r() * 0.2})`
    g.fillRect(i * s, 0, s * (0.35 + r() * 0.3), h)
    g.fillStyle = `rgba(${r() < 0.5 ? '186,170,144' : '255,252,244'},${0.15 + r() * 0.2})`
    g.fillRect(0, i * s, w, s * (0.35 + r() * 0.3))
  }
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(170,150,120,${0.15 + r() * 0.2})`
    g.fillRect(r() * w, r() * h, 2 + r() * 14, 1.2)
  }
}

/** Chunky hand knit (poufs, throw): rows of plump V stitches, shaded on the white ground. */
export const knitStitch: Paint = (g, w, h) => {
  const r = rng(63)
  g.fillStyle = '#a99b84'
  g.fillRect(0, 0, w, h)
  const [cols, rows] = [16, 16]
  const [cw, rh] = [w / cols, h / rows]
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const t = r() * 16 - 8
      for (const s of [-1, 1]) {
        const grad = g.createLinearGradient(0, y * rh, 0, (y + 1) * rh)
        grad.addColorStop(0, `rgb(${236 + t},${226 + t},${206 + t})`)
        grad.addColorStop(1, `rgb(${196 + t},${184 + t},${162 + t})`)
        g.fillStyle = grad
        g.beginPath()
        g.ellipse(x * cw + cw / 2 + (s * cw) / 4.5, y * rh + rh / 2, cw * 0.24, rh * 0.56, s * 0.55, 0, Math.PI * 2)
        g.fill()
      }
    }
}

/** Open crochet net in cream cord on transparent: rounded diamond meshes. */
export const crochetNet: Paint = (g, w, h) => {
  g.clearRect(0, 0, w, h)
  g.strokeStyle = '#e6dcc8'
  g.lineCap = 'round'
  g.lineWidth = w / 24
  const n = 4
  const s = w / n
  for (let y = -1; y <= n; y++)
    for (let x = -1; x <= n; x++) {
      const [cx, cy] = [x * s + (y % 2 ? s / 2 : 0), y * s]
      g.beginPath()
      g.ellipse(cx + s / 2, cy + s / 2, s * 0.42, s * 0.5, 0, 0, Math.PI * 2)
      g.stroke()
    }
}

/** Tight basket weave for pillow covers, in the given tone. */
export const basketWeave = (base: [number, number, number], seed: number): Paint => (g, w) => {
  const r = rng(seed)
  const n = 24
  const s = w / n
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const t = r() * 22 - 11
      const horiz = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0
      const grad = horiz ? g.createLinearGradient(0, y * s, 0, (y + 1) * s) : g.createLinearGradient(x * s, 0, (x + 1) * s, 0)
      grad.addColorStop(0, `rgb(${base.map((v) => v + 18 + t).join(',')})`)
      grad.addColorStop(1, `rgb(${base.map((v) => v - 22 + t).join(',')})`)
      g.fillStyle = grad
      g.fillRect(x * s, y * s, s, s)
    }
}

/** Woven stripes of jute, cream and cocoa, running across the cover. */
export const stripeWeave: Paint = (g, w, h) => {
  const r = rng(64)
  const bands = ['#b89a74', '#e3d6bf', '#8a6e52', '#cdb898', '#e3d6bf', '#9c7f5f']
  let x = 0
  while (x < w) {
    const bw = w / 22 + r() * (w / 14)
    g.fillStyle = bands[Math.floor(r() * bands.length)]
    g.fillRect(x, 0, bw, h)
    x += bw
  }
  for (let y = 0; y < h; y += 3) {
    g.fillStyle = `rgba(40,28,18,${0.06 + r() * 0.08})`
    g.fillRect(0, y, w, 1)
  }
}

/** Loose fringe strands radiating outward, on transparent; the middle is hidden by the pillow. */
export const fringeStrands: Paint = (g, w, h) => {
  const r = rng(65)
  g.clearRect(0, 0, w, h)
  g.lineCap = 'round'
  for (let i = 0; i < 520; i++) {
    const t = r() * 40
    g.strokeStyle = `rgb(${160 + t},${128 + t},${88 + t * 0.7})`
    g.lineWidth = 1.5 + r() * 1.5
    const side = Math.floor(r() * 4)
    const u = r()
    const [x, y, dx, dy] = [
      [u * w, 0, 0, 1],
      [u * w, h, 0, -1],
      [0, u * h, 1, 0],
      [w, u * h, -1, 0],
    ][side]
    const l = w * (0.06 + r() * 0.05)
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + dx * l + (r() - 0.5) * 6, y + dy * l + (r() - 0.5) * 6)
    g.stroke()
  }
}


/** Vertical wood grain in the given tone, with weathered checks: stumps, pedestals, the log arm. */
export const woodGrain = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = `rgb(${base.join(',')})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 220; i++) {
    const x = r() * w
    g.strokeStyle = `rgba(${r() < 0.6 ? '30,18,10' : '235,200,160'},${0.06 + r() * 0.16})`
    g.lineWidth = 0.6 + r() * 2.5
    g.beginPath()
    g.moveTo(x, 0)
    for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y * 0.02 + i) * 4 * r(), y)
    g.stroke()
  }
  for (let i = 0; i < 14; i++) {
    g.strokeStyle = 'rgba(20,12,6,.55)'
    g.lineWidth = 1 + r() * 2
    const [x, y] = [r() * w, r() * h]
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + (r() - 0.5) * 4, y + 30 + r() * 90)
    g.stroke()
  }
}

/** Coiled rope (the lounge chair's round back, the knotted sculpture): concentric cord rings. */
export const ropeCoil: Paint = (g, w, h) => {
  const r = rng(67)
  g.fillStyle = '#5c4c3c'
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 6) {
    const t = r() * 26
    g.fillStyle = `rgb(${128 + t},${108 + t},${84 + t})`
    g.fillRect(0, y + 1, w, 3.5)
    for (let x = 0; x < w; x += 7) {
      g.fillStyle = 'rgba(50,38,26,.35)'
      g.fillRect(x + ((y / 6) % 2) * 3, y + 1, 1.2, 3.5)
    }
  }
}

/** A dried palm spathe: tan blade with fine parallel ribs and a darker midrib. */
export const palmRibs: Paint = (g, w, h) => {
  const r = rng(68)
  g.fillStyle = '#a6855f'
  g.fillRect(0, 0, w, h)
  for (let x = 0; x < w; x += 2) {
    g.fillStyle = `rgba(${r() < 0.5 ? '90,64,40' : '210,180,140'},${0.15 + r() * 0.3})`
    g.fillRect(x, 0, 1, h)
  }
  g.fillStyle = '#6e5236'
  g.fillRect(w / 2 - 2, 0, 4, h)
}


/** Chunky ribbed knit of the lounge chair: close vertical ribs of plump stitches in cocoa-taupe. */
export const ribKnit: Paint = (g, w, h) => {
  const r = rng(81)
  g.fillStyle = '#3e3229'
  g.fillRect(0, 0, w, h)
  const [cols, rows] = [20, 28]
  const [cw, rh] = [w / cols, h / rows]
  for (let x = 0; x < cols; x++)
    for (let y = 0; y < rows; y++) {
      const t = r() * 12 - 6
      const grad = g.createLinearGradient(x * cw, 0, (x + 1) * cw, 0)
      grad.addColorStop(0, `rgb(${86 + t},${71 + t},${58 + t})`)
      grad.addColorStop(0.5, `rgb(${122 + t},${104 + t},${86 + t})`)
      grad.addColorStop(1, `rgb(${82 + t},${67 + t},${54 + t})`)
      g.fillStyle = grad
      g.beginPath()
      g.ellipse(x * cw + cw / 2, y * rh + rh / 2, cw * 0.44, rh * 0.62, 0, 0, Math.PI * 2)
      g.fill()
    }
}

/* ---------- Living room, the coffee table (from its close-up photograph) ---------- */

/**
 * The reclaimed-teak slab top, seen from above: honey teak with silver-grey weathering along the
 * grain, a void notched into the back edge and a split running in from each end. The canvas spans
 * the whole top: left is the table's west end, top is the back (sofa) edge.
 */
export const slabTop: Paint = (g, w, h) => {
  const r = rng(91)
  const grad = g.createLinearGradient(0, 0, w, 0)
  grad.addColorStop(0, '#8e5f40')
  grad.addColorStop(0.5, '#9c6a48')
  grad.addColorStop(1, '#a86f4a')
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  // Grain along the length, with bands of grey weathering.
  for (let i = 0; i < 340; i++) {
    const y = r() * h
    const grey = r() < 0.3
    g.strokeStyle = grey ? `rgba(168,150,132,${0.08 + r() * 0.14})` : `rgba(${r() < 0.6 ? '74,44,26' : '200,150,110'},${0.06 + r() * 0.14})`
    g.lineWidth = grey ? 2 + r() * 6 : 0.6 + r() * 2
    g.beginPath()
    g.moveTo(0, y)
    for (let x = 0; x <= w; x += 24) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 2.5 + (r() - 0.5) * 1.2)
    g.stroke()
  }
  const crack = (pts: [number, number][], width: number) => {
    g.strokeStyle = '#1e140d'
    g.lineCap = 'round'
    g.lineWidth = width
    g.beginPath()
    pts.forEach(([x, y], i) => (i ? g.lineTo(x * w, y * h) : g.moveTo(x * w, y * h)))
    g.stroke()
  }
  // The void notched into the back edge, near the vase.
  g.fillStyle = '#1a110b'
  g.beginPath()
  g.ellipse(0.71 * w, 0.03 * h, 0.035 * w, 0.06 * h, 0, 0, Math.PI * 2)
  g.fill()
  crack([[0.66, 0.05], [0.71, 0.06], [0.76, 0.05]], 3)
  // The splits running in from each end.
  crack([[1, 0.44], [0.95, 0.45], [0.91, 0.46], [0.88, 0.455]], 6)
  crack([[0, 0.53], [0.06, 0.52], [0.13, 0.515], [0.19, 0.52]], 5)
}

/** The weathered live edge of the slab: eroded grey-tan timber, pitted, with long checks along it. */
export const liveEdge: Paint = (g, w, h) => {
  const r = rng(92)
  g.fillStyle = '#8b7464'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 260; i++) {
    g.strokeStyle = `rgba(${r() < 0.5 ? '60,40,28' : '196,178,160'},${0.12 + r() * 0.25})`
    g.lineWidth = 0.8 + r() * 2.5
    const y = r() * h
    const x = r() * w
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + 20 + r() * 90, y + (r() - 0.5) * 4)
    g.stroke()
  }
  for (let i = 0; i < 160; i++) {
    g.fillStyle = `rgba(40,26,18,${0.3 + r() * 0.4})`
    g.beginPath()
    g.ellipse(r() * w, r() * h, 1 + r() * 4, 0.6 + r() * 2, 0, 0, Math.PI * 2)
    g.fill()
  }
}

/** Raku-fired glaze of the coffee-table vase: mottled bronze-gold above, smoky black below, crazed all over. */
export const rakuGlaze: Paint = (g, w, h) => {
  const r = rng(93)
  const grad = g.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#a58a5c')
  grad.addColorStop(0.45, '#8c7048')
  grad.addColorStop(0.75, '#4a3a2a')
  grad.addColorStop(1, '#2a1f17')
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 70; i++) {
    const [x, y] = [r() * w, h * (0.2 + r() * 0.8)]
    g.fillStyle = `rgba(30,24,18,${0.25 + r() * 0.45})`
    g.beginPath()
    g.ellipse(x, y, 4 + r() * 22, 3 + r() * 14, r() * Math.PI, 0, Math.PI * 2)
    g.fill()
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(196,170,120,${0.15 + r() * 0.25})`
    g.beginPath()
    g.ellipse(r() * w, r() * h * 0.6, 3 + r() * 12, 2 + r() * 8, 0, 0, Math.PI * 2)
    g.fill()
  }
  g.strokeStyle = 'rgba(25,18,12,.35)'
  g.lineWidth = 0.8
  for (let i = 0; i < 160; i++) {
    const [x, y] = [r() * w, r() * h]
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + (r() - 0.5) * 14, y + (r() - 0.5) * 14)
    g.stroke()
  }
}

/** The "Images of India" coffee-table book: a black-and-white photograph under the title. */
export const indiaCover: Paint = (g, w, h) => {
  const r = rng(94)
  g.fillStyle = '#6f6862'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 160; i++) {
    const t = Math.floor(40 + r() * 170)
    g.fillStyle = `rgba(${t},${t - 4},${t - 8},${0.25 + r() * 0.4})`
    g.fillRect(r() * w, h * 0.3 + r() * h * 0.7, 4 + r() * 30, 4 + r() * 40)
  }
  g.fillStyle = 'rgba(20,18,16,.55)'
  g.fillRect(0, 0, w, h * 0.3)
  g.fillStyle = '#efe9dd'
  g.textAlign = 'center'
  g.font = `${Math.round(h * 0.06)}px serif`
  g.fillText('IMAGES OF', w / 2, h * 0.11)
  g.font = `bold ${Math.round(h * 0.15)}px serif`
  g.fillText('INDIA', w / 2, h * 0.26)
}

/* ---------- Living room, the corner by the curtains (from its close-up photograph) ---------- */

/** Densely coiled seagrass (the lantern's shoulder and hem): twisted golden strands in tight horizontal rows. */
export const seagrassCoil: Paint = (g, w, h) => {
  const r = rng(101)
  g.fillStyle = '#5a3a1e'
  g.fillRect(0, 0, w, h)
  const rows = 22
  const rh = h / rows
  for (let y = 0; y < rows; y++)
    for (let x = -20; x < w; x += 10 + r() * 14) {
      const t = r() * 40
      g.fillStyle = `rgb(${170 + t},${124 + t * 0.8},${70 + t * 0.5})`
      g.beginPath()
      g.ellipse(x + 10, y * rh + rh / 2 + (r() - 0.5) * 2, 12 + r() * 8, rh * 0.42, (r() - 0.5) * 0.3, 0, Math.PI * 2)
      g.fill()
    }
}

/** The lantern's open body: a loose square grid of twisted seagrass strands on transparent. */
export const seagrassGrid: Paint = (g, w, h) => {
  const r = rng(102)
  g.clearRect(0, 0, w, h)
  const n = 6
  const s = w / n
  const strand = (x0: number, y0: number, x1: number, y1: number) => {
    const t = r() * 40
    g.strokeStyle = `rgb(${166 + t},${118 + t * 0.8},${66 + t * 0.5})`
    g.lineWidth = 6 + r() * 3
    g.beginPath()
    g.moveTo(x0, y0)
    g.quadraticCurveTo((x0 + x1) / 2 + (r() - 0.5) * 6, (y0 + y1) / 2 + (r() - 0.5) * 6, x1, y1)
    g.stroke()
  }
  for (let i = 0; i <= n; i++) {
    strand(i * s, 0, i * s + (r() - 0.5) * 6, h)
    strand(0, i * s, w, i * s + (r() - 0.5) * 6)
  }
  // Twists where the strands cross.
  for (let i = 0; i <= n; i++)
    for (let j = 0; j <= n; j++) {
      g.fillStyle = 'rgba(90,58,30,.8)'
      g.beginPath()
      g.ellipse(i * s, j * s, 6, 5, r() * Math.PI, 0, Math.PI * 2)
      g.fill()
    }
}

/** Old fired clay with a smoky patina (the ribbed amphora): near-black brown with ash-grey bloom. */
export const clayPatina: Paint = (g, w, h) => {
  const r = rng(103)
  g.fillStyle = '#3a2a20'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 260; i++) {
    g.fillStyle = r() < 0.6 ? `rgba(120,108,96,${0.08 + r() * 0.18})` : `rgba(20,14,10,${0.15 + r() * 0.3})`
    g.beginPath()
    g.ellipse(r() * w, r() * h, 3 + r() * 18, 2 + r() * 10, r() * Math.PI, 0, Math.PI * 2)
    g.fill()
  }
}

/** Grey stone with a weathered crust (the studded pot and the tall pedestal), in the given ground. */
export const weatheredStone = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = `rgb(${base.join(',')})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 420; i++) {
    const light = r() < 0.5
    const t = r() * 30
    g.fillStyle = light ? `rgba(${150 + t},${140 + t},${122 + t},${0.1 + r() * 0.22})` : `rgba(${44 + t},${38 + t},${32 + t},${0.06 + r() * 0.14})`
    g.beginPath()
    g.ellipse(r() * w, r() * h, 2 + r() * 26, 2 + r() * 16, r() * Math.PI, 0, Math.PI * 2)
    g.fill()
  }
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '20,16,12' : '190,180,160'},${r() * 0.35})`
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2)
  }
}

/* ---------- Living room, the north wall (from its photograph) ---------- */

/** The log console's rosewood: long grain down the canvas (the log's length), dark checks and a split. */
export const logGrain: Paint = (g, w, h) => {
  const r = rng(111)
  g.fillStyle = '#7a3f22'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 300; i++) {
    const x = r() * w
    g.strokeStyle = `rgba(${r() < 0.6 ? '40,16,8' : '190,110,70'},${0.06 + r() * 0.16})`
    g.lineWidth = 0.6 + r() * 3
    g.beginPath()
    g.moveTo(x, 0)
    for (let y = 0; y <= h; y += 24) g.lineTo(x + Math.sin(y * 0.015 + i) * 5 * r(), y)
    g.stroke()
  }
  g.strokeStyle = 'rgba(22,10,5,.85)'
  for (const [x, wd] of [[0.42, 4], [0.7, 2.5]]) {
    g.lineWidth = wd
    g.beginPath()
    g.moveTo(x * w, h * 0.15)
    for (let y = h * 0.15; y <= h; y += 16) g.lineTo(x * w + Math.sin(y * 0.03) * 4, y)
    g.stroke()
  }
}

/** Cream cotton macramé on transparent: a fan of half-hitches, an arc of wooden beads, diamond knots and a long fringe. */
export const macrameKnots: Paint = (g, w, h) => {
  const r = rng(112)
  g.clearRect(0, 0, w, h)
  const cream = '#efe6d4'
  g.strokeStyle = cream
  g.lineCap = 'round'
  // The cords falling the full length, gathered into the knotted body.
  for (let i = 0; i < 46; i++) {
    const x = w * (0.08 + (0.84 * i) / 45)
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x + (r() - 0.5) * 6, h * (0.82 + r() * 0.17))
    g.stroke()
  }
  // The fan of half-hitches under the dowel.
  for (let ring = 0; ring < 5; ring++) {
    g.lineWidth = 7
    g.beginPath()
    g.ellipse(w / 2, 0, w * (0.12 + ring * 0.07), h * (0.07 + ring * 0.035), 0, 0, Math.PI)
    g.stroke()
  }
  // The arc of wooden beads.
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI * (i / 14)
    g.fillStyle = '#c8a67a'
    g.beginPath()
    g.arc(w / 2 + Math.cos(a) * w * 0.44, Math.sin(a) * h * 0.26, w * 0.018, 0, Math.PI * 2)
    g.fill()
  }
  // Rows of square-knot diamonds.
  g.lineWidth = 6
  for (let row = 0; row < 4; row++)
    for (let i = 0; i < 4 - (row % 2); i++) {
      const cx = w * (0.22 + i * 0.19 + (row % 2) * 0.095)
      const cy = h * (0.36 + row * 0.08)
      g.beginPath()
      g.moveTo(cx, cy - h * 0.035)
      g.lineTo(cx + w * 0.07, cy)
      g.lineTo(cx, cy + h * 0.035)
      g.lineTo(cx - w * 0.07, cy)
      g.closePath()
      g.stroke()
    }
}

/** Dried grass behind the macramé: long brown strands fanning down, on transparent. */
export const driedGrass: Paint = (g, w, h) => {
  const r = rng(113)
  g.clearRect(0, 0, w, h)
  g.lineCap = 'round'
  for (let i = 0; i < 700; i++) {
    const t = r() * 50
    g.strokeStyle = `rgba(${120 + t},${88 + t * 0.8},${56 + t * 0.5},${0.6 + r() * 0.4})`
    g.lineWidth = 1 + r() * 2
    const x = w * (0.05 + r() * 0.9)
    const y0 = h * r() * 0.3
    g.beginPath()
    g.moveTo(x, y0)
    g.quadraticCurveTo(x + (r() - 0.5) * 30, y0 + h * 0.3, x + (r() - 0.5) * 50, y0 + h * (0.4 + r() * 0.35))
    g.stroke()
  }
}

/** Weathered carving (the temple fragment, the lamp base): grey-brown wood or stone with rosettes in relief. */
export const carvedRelief = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = `rgb(${base.join(',')})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 6; i++) {
    const [cx, cy, rad] = [w * (0.15 + r() * 0.7), h * (0.2 + r() * 0.6), w * (0.08 + r() * 0.1)]
    for (let p = 0; p < 10; p++) {
      const a = (p / 10) * Math.PI * 2
      g.fillStyle = 'rgba(30,22,16,.35)'
      g.beginPath()
      g.ellipse(cx + Math.cos(a) * rad * 0.6, cy + Math.sin(a) * rad * 0.6, rad * 0.32, rad * 0.14, a, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = 'rgba(210,196,176,.35)'
    g.beginPath()
    g.arc(cx, cy, rad * 0.22, 0, Math.PI * 2)
    g.fill()
  }
  for (let i = 0; i < 1500; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '25,18,12' : '220,206,186'},${r() * 0.3})`
    g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2)
  }
}

/** Natural burlap (the lamp shade): an open plain weave of beige jute. */
export const burlap: Paint = (g, w, h) => {
  const r = rng(114)
  g.fillStyle = '#b89a72'
  g.fillRect(0, 0, w, h)
  const s = w / 48
  for (let i = 0; i < 48; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '120,96,66' : '226,206,172'},${0.25 + r() * 0.3})`
    g.fillRect(i * s, 0, s * 0.55, h)
    g.fillRect(0, i * s, w, s * 0.5)
  }
}

/** The west window's Roman blind: brown damask with a tree motif, folded in horizontal pleats. */
export const damaskBlind: Paint = (g, w, h) => {
  const r = rng(115)
  g.fillStyle = '#5a4535'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 40; i++) {
    const [x, y] = [r() * w, r() * h]
    g.strokeStyle = 'rgba(150,124,96,.45)'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(x, y + 30)
    g.lineTo(x, y - 10)
    g.stroke()
    for (let b = 0; b < 5; b++) {
      g.fillStyle = 'rgba(150,124,96,.35)'
      g.beginPath()
      g.ellipse(x + (r() - 0.5) * 30, y - 10 - r() * 25, 10 + r() * 8, 7 + r() * 6, 0, 0, Math.PI * 2)
      g.fill()
    }
  }
  for (let f = 1; f < 6; f++) {
    const y = (h * f) / 6
    const grad = g.createLinearGradient(0, y - 14, 0, y + 6)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(0.7, 'rgba(20,14,10,.5)')
    grad.addColorStop(1, 'rgba(220,200,170,.25)')
    g.fillStyle = grad
    g.fillRect(0, y - 14, w, 20)
  }
}
