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
