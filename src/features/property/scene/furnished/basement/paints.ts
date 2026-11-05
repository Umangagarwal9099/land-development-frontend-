import { rng, type Paint } from '../textures'

/*
 * The basement's finishes and signs, painted at true scale. Concrete carries what a car park
 * collects in use: trowel marks and saw-cut joints in the floor, tyre polish and oil drips where
 * cars stand and turn, form-tie holes and shutter joints in the walls, efflorescence and damp at
 * their feet. Signs follow the conventions of Indian commercial basements: green photoluminescent
 * exits, blue parking and wayfinding boards, red fire equipment, yellow-and-black hazard bands.
 */

const SANS = 'Helvetica, Arial, sans-serif'

function speckle(g: CanvasRenderingContext2D, r: () => number, w: number, h: number, n: number, tones: string[], size = 1.5) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = tones[Math.floor(r() * tones.length)]
    g.fillRect(r() * w, r() * h, 0.5 + r() * size, 0.5 + r() * size)
  }
}

function blot(g: CanvasRenderingContext2D, x: number, y: number, rad: number, colour: string, alpha: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, rad)
  gr.addColorStop(0, `rgba(${colour},${alpha})`)
  gr.addColorStop(0.6, `rgba(${colour},${alpha * 0.45})`)
  gr.addColorStop(1, `rgba(${colour},0)`)
  g.fillStyle = gr
  g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
}

/**
 * Vacuum-dewatered concrete floor, power-trowelled, with saw-cut joints on a 4 m grid; the canvas
 * is 8 m square (4 panels). Panels differ slightly in tone, trowel swirls show in raking light,
 * and there are hairline shrinkage cracks and the odd patch repair.
 */
export const vdfFloor: Paint = (g, w, h) => {
  const r = rng(9101)
  g.fillStyle = '#8d8b86'
  g.fillRect(0, 0, w, h)
  const s = w / 2
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const d = (r() - 0.5) * 14
      g.fillStyle = `rgb(${141 + d},${139 + d},${134 + d})`
      g.fillRect(i * s, j * s, s, s)
      // Trowel swirls: overlapping faint arcs.
      for (let k = 0; k < 140; k++) {
        const x = i * s + r() * s
        const y = j * s + r() * s
        const rad = 14 + r() * 40
        g.strokeStyle = `rgba(${r() < 0.5 ? '255,255,250' : '60,58,54'},${0.025 + r() * 0.035})`
        g.lineWidth = 3 + r() * 6
        g.beginPath()
        g.arc(x, y, rad, r() * 6, r() * 6 + 1.5 + r() * 2)
        g.stroke()
      }
    }
  speckle(g, r, w, h, 26000, ['rgba(60,58,55,.35)', 'rgba(205,203,196,.3)', 'rgba(110,104,96,.3)'], 1.4)
  // Low-frequency mottling.
  for (let k = 0; k < 60; k++) blot(g, r() * w, r() * h, 30 + r() * 90, r() < 0.5 ? '70,66,60' : '190,188,182', 0.05 + r() * 0.05)
  // Saw-cut joints, a little dirt in them.
  g.fillStyle = 'rgba(40,38,36,.75)'
  for (const p of [0, s]) {
    g.fillRect(p, 0, 2, h)
    g.fillRect(0, p, w, 2)
  }
  g.fillStyle = 'rgba(40,38,36,.12)'
  for (const p of [0, s]) {
    g.fillRect(p - 3, 0, 8, h)
    g.fillRect(0, p - 3, w, 8)
  }
  // Hairline cracks.
  g.strokeStyle = 'rgba(55,52,48,.35)'
  g.lineWidth = 0.8
  for (let k = 0; k < 7; k++) {
    let x = r() * w
    let y = r() * h
    g.beginPath()
    g.moveTo(x, y)
    for (let m = 0; m < 14; m++) {
      x += (r() - 0.5) * 22
      y += (r() - 0.3) * 18
      g.lineTo(x, y)
    }
    g.stroke()
  }
  // A patch repair, slightly darker and smoother.
  g.fillStyle = 'rgba(105,103,99,.45)'
  g.fillRect(w * 0.62, h * 0.18, 46, 30)
}

/** The ramp's surface: broom-grooved concrete with a herringbone of anti-skid grooves; 2 m square. */
export const rampGrooves: Paint = (g, w, h) => {
  const r = rng(9111)
  g.fillStyle = '#86847f'
  g.fillRect(0, 0, w, h)
  speckle(g, r, w, h, 14000, ['rgba(55,53,50,.4)', 'rgba(200,198,192,.35)'], 1.4)
  const step = w / 12
  g.strokeStyle = 'rgba(48,46,43,.55)'
  g.lineWidth = 3
  for (let i = -12; i < 24; i++) {
    g.beginPath()
    g.moveTo(i * step, 0)
    g.lineTo(i * step + w / 2, h / 2)
    g.lineTo(i * step, h)
    g.stroke()
  }
  // Tyre polish down the middle of each lane.
  for (const x of [0.28, 0.72]) {
    const gr = g.createLinearGradient(w * (x - 0.12), 0, w * (x + 0.12), 0)
    gr.addColorStop(0, 'rgba(30,30,30,0)')
    gr.addColorStop(0.5, 'rgba(30,30,30,.22)')
    gr.addColorStop(1, 'rgba(30,30,30,0)')
    g.fillStyle = gr
    g.fillRect(w * (x - 0.12), 0, w * 0.24, h)
  }
}

/**
 * Retaining wall in exposed concrete, painted white to 2.4 m with the level's colour band and a
 * dark skirting; 2.4 m form panels with tie holes above. The canvas is 4.8 m wide × 3 m tall.
 */
export const wallPaint =
  (band: string): Paint =>
  (g, w, h) => {
    const r = rng(9121)
    const m = h / 3
    // Raw concrete overall.
    g.fillStyle = '#8f8c86'
    g.fillRect(0, 0, w, h)
    speckle(g, r, w, h, 16000, ['rgba(70,68,64,.3)', 'rgba(200,198,190,.3)'], 1.3)
    for (let x = 0; x <= w; x += 2.4 * m) {
      g.fillStyle = 'rgba(60,58,54,.4)'
      g.fillRect(x - 1, 0, 2, h)
    }
    for (let x = 0.3 * m; x < w; x += 0.6 * m)
      for (const y of [0.25, 0.85]) {
        g.fillStyle = 'rgba(50,48,45,.6)'
        g.beginPath()
        g.arc(x, y * m, 3, 0, 7)
        g.fill()
      }
    // Paint to 2.4 m: white emulsion, a colour band from 0.9 to 1.3 m, dark grey skirting to 150 mm.
    const paintTop = h - 2.4 * m
    g.fillStyle = '#e6e5e0'
    g.fillRect(0, paintTop, w, h - paintTop)
    speckle(g, r, w, h - paintTop, 4000, ['rgba(120,118,112,.12)', 'rgba(255,255,255,.2)'], 2)
    g.fillStyle = band
    g.fillRect(0, h - 1.3 * m, w, 0.4 * m)
    g.fillStyle = '#3a3b3d'
    g.fillRect(0, h - 0.15 * m, w, 0.15 * m)
    // Damp and grime creeping up from the floor; scuffs from bumpers at bumper height.
    const damp = g.createLinearGradient(0, h, 0, h - 0.7 * m)
    damp.addColorStop(0, 'rgba(70,64,52,.28)')
    damp.addColorStop(1, 'rgba(70,64,52,0)')
    g.fillStyle = damp
    g.fillRect(0, h - 0.7 * m, w, 0.7 * m)
    for (let k = 0; k < 9; k++) {
      g.fillStyle = `rgba(40,40,40,${0.08 + r() * 0.1})`
      g.fillRect(r() * w, h - (0.45 + r() * 0.2) * m, 20 + r() * 50, 3 + r() * 4)
    }
    for (let k = 0; k < 6; k++) blot(g, r() * w, h - 0.3 * m, 40 + r() * 50, '90,84,70', 0.08)
  }

/** The soffit: raw board-marked concrete, a little darker at the panel joints; 4.8 m square. */
export const soffit: Paint = (g, w, h) => {
  const r = rng(9131)
  g.fillStyle = '#7d7b77'
  g.fillRect(0, 0, w, h)
  speckle(g, r, w, h, 12000, ['rgba(60,58,55,.35)', 'rgba(180,178,172,.3)'], 1.5)
  const s = w / 4
  g.fillStyle = 'rgba(50,48,46,.35)'
  for (let i = 0; i <= 4; i++) {
    g.fillRect(i * s - 1, 0, 2, h)
    g.fillRect(0, i * s * 0.5 - 1, w, 2)
  }
  for (let k = 0; k < 20; k++) blot(g, r() * w, r() * h, 30 + r() * 60, '60,58,54', 0.06)
}

/** Yellow-and-black diagonal hazard stripes, 100 mm bands; square, tiling. */
export const hazard: Paint = (g, w, h) => {
  g.fillStyle = '#e8b917'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#151515'
  const b = w / 4
  for (let i = -4; i < 8; i++) {
    g.beginPath()
    g.moveTo(i * 2 * b, h)
    g.lineTo(i * 2 * b + b, h)
    g.lineTo(i * 2 * b + b + h, 0)
    g.lineTo(i * 2 * b + h, 0)
    g.fill()
  }
  const r = rng(9141)
  speckle(g, r, w, h, 600, ['rgba(80,70,50,.25)', 'rgba(255,255,255,.12)'], 2)
}

/** Worn road paint: white or yellow with the concrete showing through where tyres cross it. */
export const linePaint =
  (colour: string): Paint =>
  (g, w, h) => {
    const r = rng(9151)
    g.fillStyle = colour
    g.fillRect(0, 0, w, h)
    for (let k = 0; k < 900; k++) {
      g.fillStyle = `rgba(130,128,122,${0.2 + r() * 0.5})`
      g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2)
    }
  }

/**
 * Column faces for one level, as an atlas of 16 × 4 cells, 128 × 512 px each (one 600 mm face, 3 m
 * tall): hazard stripes to 1 m, painted white above, the level's colour band with the level and
 * the grid reference at eye height, raw concrete above 2.4 m.
 */
export const COLUMN_ATLAS = { cols: 16, rows: 4 }
export const columnAtlas =
  (labels: string[], level: string, band: string): Paint =>
  (g, w, h) => {
    const r = rng(9161)
    const cw = w / COLUMN_ATLAS.cols
    const ch = h / COLUMN_ATLAS.rows
    const m = ch / 3
    labels.forEach((label, i) => {
      const x = (i % COLUMN_ATLAS.cols) * cw
      const y = Math.floor(i / COLUMN_ATLAS.cols) * ch
      g.save()
      g.beginPath()
      g.rect(x, y, cw, ch)
      g.clip()
      g.fillStyle = '#8c8984'
      g.fillRect(x, y, cw, ch)
      g.fillStyle = '#e9e8e3'
      g.fillRect(x, y + 0.6 * m, cw, 2.4 * m)
      // Hazard stripes round the foot, scuffed.
      g.fillStyle = '#e3b318'
      g.fillRect(x, y + 2 * m, cw, m)
      g.fillStyle = '#141414'
      for (let k = -4; k < 6; k++) {
        const sx = x + k * 30
        g.beginPath()
        g.moveTo(sx, y + 3 * m)
        g.lineTo(sx + 15, y + 3 * m)
        g.lineTo(sx + 15 + m, y + 2 * m)
        g.lineTo(sx + m, y + 2 * m)
        g.fill()
      }
      for (let k = 0; k < 40; k++) {
        g.fillStyle = `rgba(110,105,95,${0.2 + r() * 0.3})`
        g.fillRect(x + r() * cw, y + 2 * m + r() * m, 2 + r() * 5, 1 + r() * 3)
      }
      // The band: level and grid reference.
      g.fillStyle = band
      g.fillRect(x, y + 0.9 * m, cw, 0.62 * m)
      g.fillStyle = '#fff'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.font = `700 22px ${SANS}`
      g.fillText(level, x + cw / 2, y + 1.0 * m)
      g.font = `700 50px ${SANS}`
      g.fillText(label, x + cw / 2, y + 1.3 * m)
      // An up arrow and EXIT tag below the band on some faces is left to the signs; just grime here.
      const grime = g.createLinearGradient(0, y + 2 * m, 0, y + 1.6 * m)
      grime.addColorStop(0, 'rgba(80,74,62,.16)')
      grime.addColorStop(1, 'rgba(80,74,62,0)')
      g.fillStyle = grime
      g.fillRect(x, y + 1.6 * m, cw, 0.4 * m)
      g.restore()
    })
  }

/** Bay numbers stencilled on the floor at the head of each bay: an atlas of 8 × 16 cells, 256 × 64 px. */
export const NUMBER_ATLAS = { cols: 8, rows: 16 }
export const numberAtlas =
  (labels: string[]): Paint =>
  (g, w, h) => {
    const r = rng(9171)
    const cw = w / NUMBER_ATLAS.cols
    const ch = h / NUMBER_ATLAS.rows
    g.clearRect(0, 0, w, h)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `700 44px "Arial Narrow", ${SANS}`
    labels.forEach((label, i) => {
      const x = (i % NUMBER_ATLAS.cols) * cw
      const y = Math.floor(i / NUMBER_ATLAS.cols) * ch
      g.fillStyle = '#f2f1ea'
      g.fillText(label, x + cw / 2, y + ch / 2 + 2)
      // Wear: tyres scrub the paint off in patches.
      g.globalCompositeOperation = 'destination-out'
      for (let k = 0; k < 40; k++) g.fillRect(x + r() * cw, y + r() * ch, 1 + r() * 4, 1 + r() * 3)
      g.globalCompositeOperation = 'source-over'
    })
  }

/** A painted direction arrow on the floor, pointing up the canvas (+v); 128 × 256 px for a 1.0 × 2.0 m arrow. */
export const floorArrow: Paint = (g, w, h) => {
  const r = rng(9181)
  g.clearRect(0, 0, w, h)
  g.fillStyle = '#f2f1ea'
  g.beginPath()
  g.moveTo(w / 2, 0)
  g.lineTo(w, h * 0.36)
  g.lineTo(w * 0.66, h * 0.36)
  g.lineTo(w * 0.66, h)
  g.lineTo(w * 0.34, h)
  g.lineTo(w * 0.34, h * 0.36)
  g.lineTo(0, h * 0.36)
  g.closePath()
  g.fill()
  g.globalCompositeOperation = 'destination-out'
  for (let k = 0; k < 300; k++) g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 3)
  g.globalCompositeOperation = 'source-over'
}

/** Floor text: one word, stencilled, reading from the bottom of the canvas; 512 × 128 px. */
export const floorWord =
  (text: string, colour = '#f2f1ea'): Paint =>
  (g, w, h) => {
    const r = rng(9191 + text.length)
    g.clearRect(0, 0, w, h)
    g.fillStyle = colour
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `700 ${h * 0.82}px "Arial Narrow", ${SANS}`
    g.fillText(text, w / 2, h / 2 + 4)
    g.globalCompositeOperation = 'destination-out'
    for (let k = 0; k < 260; k++) g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 3)
    g.globalCompositeOperation = 'source-over'
  }

/** A blue wayfinding board: white text, an arrow, the P roundel. `arrow` is up/left/right/down/none. */
export const board =
  (lines: string[], arrow: 'up' | 'left' | 'right' | 'down' | 'none' = 'none', bg = '#17489a'): Paint =>
  (g, w, h) => {
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#f4f4f4'
    g.lineWidth = 6
    g.strokeRect(8, 8, w - 16, h - 16)
    const left = arrow === 'none' ? 24 : h + 10
    if (arrow !== 'none') {
      g.save()
      g.translate(h / 2 + 10, h / 2)
      g.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[arrow])
      g.fillStyle = '#fff'
      const s = h * 0.32
      g.beginPath()
      g.moveTo(0, -s)
      g.lineTo(s * 0.9, 0)
      g.lineTo(s * 0.32, 0)
      g.lineTo(s * 0.32, s)
      g.lineTo(-s * 0.32, s)
      g.lineTo(-s * 0.32, 0)
      g.lineTo(-s * 0.9, 0)
      g.closePath()
      g.fill()
      g.restore()
    }
    g.fillStyle = '#fff'
    g.textAlign = 'left'
    g.textBaseline = 'middle'
    const size = Math.min(h * 0.5, (h * 0.78) / lines.length)
    g.font = `700 ${size}px ${SANS}`
    lines.forEach((l, i) => g.fillText(l, left, h / 2 + (i - (lines.length - 1) / 2) * size * 1.12, w - left - 20))
  }

/** The big level marker painted on walls and boards: the level in white on its colour. */
export const levelMark =
  (level: string, band: string, name: string): Paint =>
  (g, w, h) => {
    g.fillStyle = band
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#fff'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `800 ${h * 0.56}px ${SANS}`
    g.fillText(level, w / 2, h * 0.42)
    g.font = `600 ${h * 0.12}px ${SANS}`
    g.fillText(name.toUpperCase(), w / 2, h * 0.84)
  }

/** The green exit sign with the running figure, lit from within; 512 × 192 px. */
export const exitSign =
  (arrow: 'left' | 'right' | 'none' = 'none'): Paint =>
  (g, w, h) => {
    g.fillStyle = '#0d8a3e'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#f4fff6'
    // The running figure through a door.
    const x = arrow === 'left' ? w - h * 0.9 : h * 0.15
    g.fillRect(x, h * 0.15, h * 0.5, h * 0.7)
    g.fillStyle = '#0d8a3e'
    g.beginPath()
    g.arc(x + h * 0.3, h * 0.27, h * 0.06, 0, 7)
    g.fill()
    g.lineWidth = h * 0.07
    g.strokeStyle = '#0d8a3e'
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(x + h * 0.27, h * 0.36)
    g.lineTo(x + h * 0.22, h * 0.56)
    g.lineTo(x + h * 0.33, h * 0.68)
    g.lineTo(x + h * 0.3, h * 0.8)
    g.moveTo(x + h * 0.22, h * 0.56)
    g.lineTo(x + h * 0.12, h * 0.76)
    g.moveTo(x + h * 0.26, h * 0.42)
    g.lineTo(x + h * 0.38, h * 0.5)
    g.moveTo(x + h * 0.26, h * 0.42)
    g.lineTo(x + h * 0.14, h * 0.5)
    g.stroke()
    g.fillStyle = '#f4fff6'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `700 ${h * 0.46}px ${SANS}`
    const tx = arrow === 'left' ? w * 0.42 : w * 0.6
    g.fillText('EXIT', tx, h * 0.53)
    if (arrow !== 'none') {
      const ax = arrow === 'left' ? w * 0.12 : w * 0.9
      const d = arrow === 'left' ? -1 : 1
      g.beginPath()
      g.moveTo(ax + d * h * 0.18, h / 2)
      g.lineTo(ax - d * h * 0.06, h * 0.26)
      g.lineTo(ax - d * h * 0.06, h * 0.74)
      g.closePath()
      g.fill()
    }
  }

/** A round regulatory sign: red ring on white with a figure (speed limit or headroom). */
export const roundSign =
  (text: string, sub = ''): Paint =>
  (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.fillStyle = '#c4161c'
    g.beginPath()
    g.arc(w / 2, h / 2, w / 2 - 2, 0, 7)
    g.fill()
    g.fillStyle = '#fafafa'
    g.beginPath()
    g.arc(w / 2, h / 2, w * 0.38, 0, 7)
    g.fill()
    g.fillStyle = '#111'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `800 ${w * (text.length > 2 ? 0.26 : 0.36)}px ${SANS}`
    g.fillText(text, w / 2, h / 2 - (sub ? w * 0.04 : 0))
    if (sub) {
      g.font = `700 ${w * 0.1}px ${SANS}`
      g.fillText(sub, w / 2, h / 2 + w * 0.17)
    }
  }

/** A red equipment label: white text on red, for hose reels, extinguishers and pump rooms. */
export const redLabel =
  (text: string): Paint =>
  (g, w, h) => {
    g.fillStyle = '#c0161c'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#fff'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `700 ${h * 0.5}px ${SANS}`
    g.fillText(text, w / 2, h / 2 + 2, w - 16)
  }

/** The hose reel cabinet's front: a red steel frame round a glazed door, the coiled hose behind. */
export const hoseCabinet: Paint = (g, w, h) => {
  g.fillStyle = '#b5161b'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#4a1012'
  g.fillRect(w * 0.08, h * 0.16, w * 0.84, h * 0.76)
  g.strokeStyle = '#c7322f'
  g.lineWidth = w * 0.05
  for (let k = 0; k < 6; k++) {
    g.beginPath()
    g.arc(w / 2, h * 0.54, w * (0.14 + k * 0.045), 0, 7)
    g.stroke()
  }
  g.fillStyle = 'rgba(220,235,240,.18)'
  g.fillRect(w * 0.08, h * 0.16, w * 0.84, h * 0.3)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `700 ${h * 0.07}px ${SANS}`
  g.fillText('FIRE HOSE REEL', w / 2, h * 0.08)
}

/** Lift landing doors in brushed stainless, with the centre-opening joint. */
export const liftDoors: Paint = (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0)
  for (let i = 0; i <= 10; i++) gr.addColorStop(i / 10, i % 2 ? '#a9adb0' : '#c6c9cc')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
  const r = rng(9201)
  for (let k = 0; k < 1500; k++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '80,80,80'},.07)`
    g.fillRect(0, r() * h, w, 1)
  }
  g.fillStyle = '#4a4d50'
  g.fillRect(w / 2 - 1.5, 0, 3, h)
}

/** A grey steel fire door with its vision panel and push bar. */
export const fireDoor: Paint = (g, w, h) => {
  g.fillStyle = '#6f7478'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#5c6064'
  g.fillRect(4, 4, w - 8, h - 8)
  g.fillStyle = '#9fb2ba'
  g.fillRect(w * 0.3, h * 0.14, w * 0.4, h * 0.22)
  g.fillStyle = '#c8c9ca'
  g.fillRect(w * 0.12, h * 0.5, w * 0.76, h * 0.04)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.font = `700 ${w * 0.08}px ${SANS}`
  g.fillText('FIRE DOOR · KEEP SHUT', w / 2, h * 0.72)
}

/** A louvred exhaust grille in galvanised steel. */
export const louvre: Paint = (g, w, h) => {
  g.fillStyle = '#8e9396'
  g.fillRect(0, 0, w, h)
  for (let y = 6; y < h - 4; y += 12) {
    g.fillStyle = '#2b2e30'
    g.fillRect(6, y, w - 12, 6)
    g.fillStyle = '#b9bdbf'
    g.fillRect(6, y + 6, w - 12, 2)
  }
}

/** A dark oil drip and tyre-polish stain, soft-edged; drawn white for use as an alpha map. */
export const stain: Paint = (g, w, h) => {
  const r = rng(9211)
  g.clearRect(0, 0, w, h)
  for (let k = 0; k < 14; k++) {
    const x = w / 2 + (r() - 0.5) * w * 0.4
    const y = h / 2 + (r() - 0.5) * h * 0.4
    const rad = w * (0.06 + r() * 0.18)
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(255,255,255,${0.25 + r() * 0.3})`)
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, w, h)
  }
}

/** Curved tyre marks where cars turn into an aisle: two arcs of polished rubber; alpha map. */
export const tyreArc: Paint = (g, w, h) => {
  const r = rng(9221)
  g.clearRect(0, 0, w, h)
  for (let k = 0; k < 8; k++) {
    const off = (r() - 0.5) * w * 0.12
    for (const d of [0, w * 0.22]) {
      g.strokeStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`
      g.lineWidth = w * (0.03 + r() * 0.03)
      g.beginPath()
      g.arc(0, h, w * 0.55 + d + off, -Math.PI / 2, 0)
      g.stroke()
    }
  }
}

/** Soft wash of light on the floor below a run of battens; alpha map, bright in the middle. */
export const lightWash: Paint = (g, w, h) => {
  g.clearRect(0, 0, w, h)
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  gr.addColorStop(0, 'rgba(255,255,255,.9)')
  gr.addColorStop(0.5, 'rgba(255,255,255,.35)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
}

/**
 * What the basement's glossy surfaces reflect (car paint, glass, the floor's sheen): a
 * concrete box under rows of cool LED battens, as an equirectangular map. Up is the top of the
 * canvas: the soffit and its light rows above the horizon, the dim floor below.
 */
export const basementEnv: Paint = (g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#3d3e40')
  sky.addColorStop(0.46, '#5a5b5c')
  sky.addColorStop(0.5, '#4a4a49')
  sky.addColorStop(1, '#1d1d1c')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  // Light rows: lines of battens converging to the horizon.
  for (let row = 0; row < 7; row++) {
    const y = h * (0.06 + row * 0.055)
    const len = w * (0.012 + row * 0.004)
    for (let x = (row % 2) * len; x < w; x += len * 3.2) {
      g.fillStyle = '#f4f8ff'
      g.fillRect(x, y, len, Math.max(1, 5 - row * 0.6))
    }
  }
  // Columns standing round the horizon, and the dark of the cars below it.
  for (let x = 0; x < w; x += w / 24) {
    g.fillStyle = 'rgba(200,200,196,.35)'
    g.fillRect(x, h * 0.36, w / 90, h * 0.16)
  }
  g.fillStyle = 'rgba(20,20,22,.6)'
  g.fillRect(0, h * 0.5, w, h * 0.04)
}

/** A plate atlas: 8 × 8 Indian number plates, each 512 × 112 px (see car.ts drawPlate). */
export const PLATE_ATLAS = { cols: 8, rows: 8, w: 512, h: 112 }
