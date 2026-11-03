import { DoubleSide, EquirectangularReflectionMapping, MeshPhysicalMaterial, MeshStandardMaterial, Vector2, type MeshStandardMaterialParameters, type Texture } from 'three'
import type { Kit } from '../kit'
import { tiledMat, type Lighting } from '../shared'
import { rng, type Paint } from '../textures'
import { d65Materials } from '../kalakalD65/materials'
import { foliageMaterials } from './foliage'
import { agedAsphalt, broomConcrete, granitePaving, interlock, kerbUnit, lawnGround, macro, mulch, sky, wornPaint } from './surfaces'

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/* ---------- painted surfaces ---------- */

/** One metre of perforated, lightly brushed aluminium: 3 mm holes at 32 mm centres, staggered. */
const perforated: Paint = (g, w, h) => {
  const r = rng(301)
  g.fillStyle = '#c4c8cd'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '120,126,134'},${0.03 + r() * 0.05})`
    g.fillRect(0, r() * h, w, 1)
  }
  const pitch = w / 32
  g.fillStyle = 'rgba(46,50,56,.55)'
  for (let row = 0; row < 32; row++)
    for (let col = 0; col < 32; col++) {
      g.beginPath()
      g.arc((col + (row % 2) * 0.5) * pitch, (row + 0.5) * pitch, pitch * 0.17, 0, 7)
      g.fill()
    }
}

/** Three metres of the mall's ceiling: 600 mm tiles, with a recessed light panel in every other bay. */
const ceilingGrid = (lit: boolean): Paint => (g, w, h) => {
  g.fillStyle = lit ? '#000' : '#dcd9d2'
  g.fillRect(0, 0, w, h)
  const c = w / 5
  if (!lit) {
    g.strokeStyle = 'rgba(120,116,108,.5)'
    g.lineWidth = 2
    for (let i = 0; i <= 5; i++) {
      g.beginPath()
      g.moveTo(i * c, 0)
      g.lineTo(i * c, h)
      g.moveTo(0, i * c)
      g.lineTo(w, i * c)
      g.stroke()
    }
  }
  g.fillStyle = lit ? '#fff3df' : '#f6f3ec'
  for (const [i, j] of [[1, 1], [3, 3], [1, 3], [3, 1]]) g.fillRect(i * c + 4, j * c + 4, c - 8, c - 8)
}

/** Shop interiors seen through the glass: lit walls of shelving, racks and displays, softly out of focus. */
const shopInterior: Paint = (g, w, h) => {
  const r = rng(311)
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#f3e6d0')
  sky.addColorStop(1, '#d9c6aa')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  let x = 0
  while (x < w) {
    const bay = 140 + r() * 160
    const tone = r()
    g.fillStyle = tone < 0.33 ? '#efe9df' : tone < 0.66 ? '#e6d5bd' : '#d8dcdf'
    g.fillRect(x, 0, bay - 6, h)
    // Shelving, hanging rails or a feature display in each shop.
    const kind = r()
    for (let y = h * 0.22; y < h * 0.86; y += h * (kind < 0.5 ? 0.16 : 0.3)) {
      g.fillStyle = 'rgba(70,60,50,.35)'
      g.fillRect(x + 10, y, bay - 26, 3)
      for (let k = 0; k < (kind < 0.5 ? 14 : 8); k++) {
        const hue = Math.floor(r() * 360)
        g.fillStyle = `hsla(${hue},${25 + r() * 35}%,${35 + r() * 35}%,.75)`
        const iw = 6 + r() * 12
        g.fillRect(x + 12 + r() * (bay - 40), y - (kind < 0.5 ? 14 + r() * 16 : 36 + r() * 30), iw, kind < 0.5 ? 14 + r() * 10 : 40 + r() * 26)
      }
    }
    // A lit fascia band above each shop.
    g.fillStyle = 'rgba(255,248,232,.9)'
    g.fillRect(x + 6, 4, bay - 18, h * 0.07)
    x += bay
  }
  g.fillStyle = 'rgba(0,0,0,.05)'
  g.fillRect(0, h * 0.9, w, h * 0.1)
}

/**
 * The media screen's current loop: three generic film one-sheets (abstract key art, invented
 * titles) across a curved LED wall, in the cinema's own house style rather than any real release.
 */
const mediaScreen: Paint = (g, w, h) => {
  const r = rng(321)
  g.fillStyle = '#05070a'
  g.fillRect(0, 0, w, h)
  const panels = [
    { a: '#f0a24a', b: '#2a1206', title: 'MERIDIAN', kind: 'sun' },
    { a: '#59c8ff', b: '#06213d', title: 'TIDEWATER', kind: 'wave' },
    { a: '#ff3b30', b: '#140507', title: 'NOCTURNE', kind: 'city' },
  ]
  const pw = w / 3
  panels.forEach((p, i) => {
    const x0 = i * pw + 6
    const grad = g.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, p.b)
    grad.addColorStop(0.55, p.a)
    grad.addColorStop(1, p.b)
    g.fillStyle = grad
    g.fillRect(x0, 0, pw - 12, h)
    g.save()
    g.beginPath()
    g.rect(x0, 0, pw - 12, h)
    g.clip()
    if (p.kind === 'sun') {
      g.fillStyle = 'rgba(255,236,190,.9)'
      g.beginPath()
      g.arc(x0 + pw * 0.55, h * 0.38, h * 0.16, 0, 7)
      g.fill()
      for (let k = 0; k < 5; k++) {
        g.fillStyle = `rgba(${90 - k * 12},${40 - k * 6},10,${0.55 + k * 0.08})`
        g.beginPath()
        g.moveTo(x0, h)
        for (let t = 0; t <= 1.001; t += 0.05) g.lineTo(x0 + t * pw, h * (0.62 + k * 0.07) - Math.sin(t * 6 + k) * h * 0.05)
        g.lineTo(x0 + pw, h)
        g.fill()
      }
    } else if (p.kind === 'wave') {
      for (let k = 0; k < 9; k++) {
        g.strokeStyle = `rgba(200,240,255,${0.15 + k * 0.06})`
        g.lineWidth = 3 + k
        g.beginPath()
        for (let t = 0; t <= 1.001; t += 0.04) g.lineTo(x0 + t * pw, h * (0.45 + k * 0.05) + Math.sin(t * 9 + k * 0.8) * h * 0.04)
        g.stroke()
      }
      g.fillStyle = 'rgba(10,30,50,.85)'
      g.beginPath()
      g.ellipse(x0 + pw * 0.5, h * 0.4, pw * 0.08, h * 0.17, 0, 0, 7)
      g.fill()
    } else {
      for (let k = 0; k < 16; k++) {
        const bw = 12 + r() * 34
        const bh = h * (0.2 + r() * 0.45)
        const bx = x0 + r() * pw
        g.fillStyle = '#0b0b10'
        g.fillRect(bx, h * 0.82 - bh, bw, bh)
        g.fillStyle = 'rgba(255,200,140,.55)'
        for (let wy = h * 0.82 - bh + 6; wy < h * 0.8; wy += 9) for (let wx = bx + 3; wx < bx + bw - 3; wx += 7) if (r() < 0.35) g.fillRect(wx, wy, 3, 4)
      }
      g.fillStyle = 'rgba(10,8,12,.92)'
      g.beginPath()
      g.moveTo(x0 + pw * 0.5, h * 0.18)
      g.lineTo(x0 + pw * 0.6, h * 0.6)
      g.lineTo(x0 + pw * 0.4, h * 0.6)
      g.fill()
    }
    g.restore()
    g.fillStyle = 'rgba(255,255,255,.95)'
    g.font = `700 ${Math.round(h * 0.085)}px Manrope Variable, Helvetica, Arial, sans-serif`
    g.textAlign = 'center'
    g.fillText(p.title, x0 + pw / 2 - 6, h * 0.9)
    g.font = `600 ${Math.round(h * 0.03)}px Manrope Variable, Helvetica, Arial, sans-serif`
    g.fillText('NOW SHOWING · LEVEL 2', x0 + pw / 2 - 6, h * 0.95)
  })
}

/** The basement car park's sign: a white P on blue. */
const parkingSign: Paint = (g, w, h) => {
  g.fillStyle = '#1d4f9a'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#fff'
  g.lineWidth = w * 0.04
  g.strokeRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88)
  g.fillStyle = '#fff'
  g.font = `800 ${Math.round(h * 0.68)}px Helvetica, Arial, sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('P', w / 2, h * 0.54)
}

/** A rolling shutter's ribbed galvanised slats, 75 mm pitch over a 512 px metre. */
const shutter: Paint = (g, w, h) => {
  g.fillStyle = '#a9adb1'
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += h / 13) {
    g.fillStyle = 'rgba(60,64,70,.55)'
    g.fillRect(0, y, w, 3)
    g.fillStyle = 'rgba(255,255,255,.35)'
    g.fillRect(0, y + 4, w, 2)
  }
}

/** Alpha map of a vertical-bar railing: 20 mm bars at 125 mm centres over one metre. */
const railing: Paint = (g, w, h) => {
  g.fillStyle = '#000'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#fff'
  for (let x = 0; x < w; x += w / 8) g.fillRect(x, 0, w * 0.02, h)
  g.fillRect(0, 0, w, h * 0.05)
}

/** Alpha map of chain-link mesh, 50 mm diamonds. */
const chainLink: Paint = (g, w, h) => {
  g.fillStyle = '#000'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#fff'
  g.lineWidth = 2
  const p = w / 20
  for (let i = -20; i < 40; i++) {
    g.beginPath()
    g.moveTo(i * p, 0)
    g.lineTo(i * p + h, h)
    g.moveTo(i * p, 0)
    g.lineTo(i * p - h, h)
    g.stroke()
  }
}

/* ---------- materials ---------- */

/**
 * The mall's finishes: the D-65 palette for the shared site finishes (paving, asphalt, planting,
 * lamps, car parts), plus the skin, glazing, signage and service fittings of a commercial building.
 */
export function mallMaterials(k: Kit, lighting: Lighting) {
  const base = d65Materials(k, lighting)
  const glow = (p: MeshStandardMaterialParameters, dayFactor: number) => lighting.glow(std(p), dayFactor)
  const tex = (w: number, h: number, paint: Paint) => k.tex.painted(w, h, paint)

  const perf = tex(512, 512, perforated)
  const shops = tex(2048, 512, shopInterior)
  const ceiling = tex(512, 512, ceilingGrid(false))
  const ceilingLit = tex(512, 512, ceilingGrid(true))
  // Shape-built surfaces carry plan coordinates in metres as UVs: one 3 m ceiling bay per repeat.
  for (const t of [ceiling, ceilingLit]) t.repeat.set(1 / 3, 1 / 3)
  const rail = tex(256, 256, railing)
  const mesh = tex(256, 256, chainLink)
  const repeated = (t: Texture, u: number, v: number) => {
    const r = t.clone()
    r.repeat.set(u, v)
    return r
  }

  const screen = tex(1536, 640, mediaScreen)

  // What the glass and metal reflect: a painted sky and skyline, by day and at dusk.
  const env = { day: tex(2048, 1024, sky(false)), dusk: tex(2048, 1024, sky(true)) }
  for (const t of [env.day, env.dusk]) t.mapping = EquirectangularReflectionMapping

  // Ground finishes: painted at true scale (UVs in metres), with relief from their own painting and
  // a 30 m macro variation in the occlusion channel so no surface visibly repeats.
  const variation = tex(512, 512, macro)
  variation.channel = 0
  variation.repeat.set(1 / 30, 1 / 30)
  const ground = (key: string, paint: Paint, tile: number, roughness: number, relief: number, size = 1024) => {
    const repeat: [number, number] = [1 / tile, 1 / tile]
    const m = tiledMat(k, `mall_${key}`, paint, repeat, { roughness }, size)
    m.normalMap = k.tex.normalPainted(`mall_${key}`, size, size, paint, ...repeat)
    m.normalScale = new Vector2(relief, relief)
    m.aoMap = variation
    m.aoMapIntensity = 0.85
    return m
  }
  const kerbMaps = { map: tex(256, 64, kerbUnit), relief: k.tex.normalPainted('mall_kerb', 256, 64, kerbUnit) }

  return {
    ...base,
    env,
    plants: foliageMaterials(k),
    paving: ground('paving', granitePaving, 4.8, 0.78, 0.6),
    apron: ground('apron', broomConcrete, 3, 0.9, 0.5),
    interlock: ground('interlock', interlock, 2.4, 0.85, 0.9),
    asphalt: ground('asphalt', agedAsphalt, 8, 0.92, 0.7),
    lawnGround: ground('lawn', lawnGround, 3, 1, 0.4, 512),
    /** Unbuilt neighbouring plots: dry grass over red-brown earth. */
    fallow: (() => {
      const m = ground('fallow', lawnGround, 3, 1, 0.5, 512)
      m.color.set('#c9b48f')
      return m
    })(),
    /** The pylon's faceted face: the skin's aluminium without its per-panel tint. */
    pylonPanel: std({ map: perf, color: '#dfe2e5', metalness: 0.6, roughness: 0.42 }),
    /** Brushed stainless steel: handrails, bollards, bench brackets. */
    chromeRail: std({ color: '#c3c6c9', metalness: 0.9, roughness: 0.3 }),
    /** Hot-dip galvanised steel poles, dulled by weather. */
    galvanised: std({ color: '#8b8f91', metalness: 0.7, roughness: 0.55 }),
    /** Die-cast LED luminaire housings. */
    luminaire: std({ color: '#3a3d40', metalness: 0.5, roughness: 0.45 }),
    mulch: ground('mulch', mulch, 1.5, 1, 1.0, 512),
    /** Precast concrete kerb, its 900 mm units along a run `len` metres long. */
    kerb: (len: number) => {
      const map = kerbMaps.map.clone()
      const relief = kerbMaps.relief.clone()
      for (const t of [map, relief]) t.repeat.set(Math.max(1, Math.round(len / 0.9)), 1)
      return new MeshStandardMaterial({ map, normalMap: relief, roughness: 0.9 })
    },
    /** Road markings in worn thermoplastic. */
    lane: std({ map: tex(256, 256, wornPaint), roughness: 0.75 }),
    /** Facet panels: perforated, satin-anodised aluminium (UVs in metres). */
    panel: std({ map: perf, normalMap: k.tex.normalPainted('mall_perf', 512, 512, perforated), normalScale: new Vector2(0.25, 0.25), vertexColors: true, color: '#eceef0', metalness: 0.6, roughness: 0.42 }),
    /**
     * Facet glazing: a dark, reflective solar-control glass, showing the warm interior faintly at
     * night as in the reference's dusk view.
     */
    facetGlass: lighting.glow(
      new MeshPhysicalMaterial({ color: '#2a3640', metalness: 0, roughness: 0.035, ior: 1.52, specularIntensity: 1, vertexColors: true, emissive: '#d9cdbd', emissiveIntensity: 0.02 }),
      0,
    ),
    /** The skin's diamond grid of extruded aluminium frames. */
    frame: std({ color: '#8e9399', metalness: 0.65, roughness: 0.38 }),
    /** EPDM gaskets and shadow gaps between the frames and the facets. */
    gasket: std({ color: '#17191c', roughness: 0.7 }),
    /** Backing wall and flashings behind the skin. */
    backing: std({ color: '#3b3f44', roughness: 0.85, side: DoubleSide }),
    /** White aluminium composite: the swoosh band, canopy and fascia. */
    acp: std({ color: '#ecedeb', metalness: 0.25, roughness: 0.34 }),
    /** Linear aluminium soffit under the skin's overhang. */
    soffit: std({ color: '#d4d6d8', metalness: 0.4, roughness: 0.45 }),
    /** Anodised mullions and door frames. */
    mullion: std({ color: '#5c6168', metalness: 0.6, roughness: 0.4 }),
    /** Shopfront glass: clear, low-iron, with a cool reflection. */
    /** Shopfront glass: clear low-iron; by day the reflection outweighs the view in, at dusk the lit shops show through (see index.ts). */
    shopGlass: new MeshPhysicalMaterial({ color: '#6f8288', metalness: 0.1, roughness: 0.02, ior: 1.52, specularIntensity: 1, transparent: true, opacity: 0.3, depthWrite: false }),
    /** Tinted glass of the revolving door drum and the skylights. */
    tintGlass: new MeshPhysicalMaterial({ color: '#7f969e', metalness: 0, roughness: 0.03, ior: 1.52, transparent: true, opacity: 0.4, depthWrite: false, side: DoubleSide }),
    /** Lit shop interiors seen through the glass. */
    shops: glow({ map: shops, emissive: '#ffffff', emissiveMap: shops, emissiveIntensity: 0.55, roughness: 0.9 }, 0.12),
    /** The mall's ceilings, their light panels glowing. */
    ceiling: glow({ map: ceiling, emissive: '#fff1da', emissiveMap: ceilingLit, emissiveIntensity: 1.3, roughness: 0.9 }, 0.25),
    /** Honed granite: the podium's edge, steps and the shop floors. */
    granite: (() => {
      const m = ground('cladding', granitePaving, 4.8, 0.55, 0.3)
      m.color.set('#77756f')
      return m
    })(),
    floor: std({ color: '#e7e2d8', roughness: 0.25, metalness: 0.05 }),
    /** The media screen: bright enough by day, the brightest thing on the street at night. */
    screen: lighting.glow(std({ map: screen, emissive: '#ffffff', emissiveMap: screen, emissiveIntensity: 1.6, roughness: 0.35 }), 0.75),
    /** Channel letters: opal acrylic faces lit from within. */
    letter: glow({ color: '#ffffff', emissive: '#fff8ec', emissiveIntensity: 1.4, roughness: 0.3 }, 0.12),
    letterReturn: std({ color: '#c9ccd0', metalness: 0.7, roughness: 0.35 }),
    roof: std({ color: '#a7a6a1', roughness: 0.95 }),
    plant: std({ color: '#b9bcbf', metalness: 0.35, roughness: 0.55 }),
    plantDark: std({ color: '#3a3d41', roughness: 0.6 }),
    void: std({ color: '#050506', roughness: 1 }),
    pSign: std({ map: tex(256, 256, parkingSign), roughness: 0.5 }),
    shutter: std({ map: tex(512, 512, shutter), metalness: 0.5, roughness: 0.5 }),
    hazard: std({ color: '#e1b12c', roughness: 0.6 }),
    /** Bar railing on the compound walls, its bars at true spacing along a run `len` metres long. */
    railing: (len: number) => std({ color: '#2b2d30', metalness: 0.5, roughness: 0.45, alphaMap: repeated(rail, len, 1), alphaTest: 0.5, side: DoubleSide }),
    /** Chain-link fencing, `len` × `h` metres. */
    fence: (len: number, h: number) => std({ color: '#7c8085', metalness: 0.6, roughness: 0.5, alphaMap: repeated(mesh, len, h), alphaTest: 0.5, side: DoubleSide }),
    bench: std({ color: '#8b6a47', roughness: 0.65 }),
    concrete: std({ color: '#b5b1aa', roughness: 0.92 }),
    /** Warm downlights under the canopy and the overhang. */
    downlight: glow({ color: '#fff6e8', emissive: '#ffdcae', emissiveIntensity: 2.4, roughness: 0.5 }, 0.1),
  }
}

export type MallMaterials = ReturnType<typeof mallMaterials>
