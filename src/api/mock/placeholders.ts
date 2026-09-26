// Generated SVG stand-ins so the app is fully clickable before real photography/renders exist.
// Styled as dusk architectural line drawings so they sit comfortably in the dark showroom UI.

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)

export function placeholderImage(label: string, hue: number, w = 1600, h = 1000): string {
  const gx = w * 0.18
  const gy = h * 0.72
  const bw = w * 0.64
  // A two-storey modern villa elevation: plinth, cantilevered upper volume, glazing mullions.
  const mullions = Array.from({ length: 7 }, (_, i) => {
    const x = gx + bw * 0.08 + i * bw * 0.06
    return `<line x1="${x}" y1="${gy - h * 0.2}" x2="${x}" y2="${gy - h * 0.02}"/>`
  }).join('')
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 22% 16%)"/>
      <stop offset=".62" stop-color="hsl(${(hue + 20) % 360} 28% 9%)"/>
      <stop offset="1" stop-color="#07080a"/>
    </linearGradient>
    <radialGradient id="glow" cx=".62" cy=".62" r=".5">
      <stop offset="0" stop-color="#f1cf8a" stop-opacity=".28"/>
      <stop offset="1" stop-color="#f1cf8a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#sky)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <g fill="none" stroke="#d4b26a" stroke-opacity=".55" stroke-width="${Math.max(1.5, w / 700)}">
    <line x1="0" y1="${gy}" x2="${w}" y2="${gy}" stroke-opacity=".3"/>
    <rect x="${gx}" y="${gy - h * 0.22}" width="${bw * 0.62}" height="${h * 0.22}"/>
    <rect x="${gx + bw * 0.3}" y="${gy - h * 0.42}" width="${bw * 0.7}" height="${h * 0.2}"/>
    <line x1="${gx + bw * 0.26}" y1="${gy - h * 0.43}" x2="${gx + bw * 1.04}" y2="${gy - h * 0.43}"/>
    ${mullions}
  </g>
  <rect x="${gx + bw * 0.08}" y="${gy - h * 0.2}" width="${bw * 0.36}" height="${h * 0.18}" fill="#f1cf8a" fill-opacity=".12"/>
  <rect x="${gx + bw * 0.36}" y="${gy - h * 0.39}" width="${bw * 0.56}" height="${h * 0.12}" fill="#f1cf8a" fill-opacity=".08"/>
  <text x="${w * 0.06}" y="${h * 0.12}" font-family="Georgia,serif" font-size="${h * 0.055}" fill="#f4efe6" opacity=".85">${escape(label)}</text>
  <text x="${w * 0.06}" y="${h * 0.17}" font-family="system-ui,sans-serif" font-size="${h * 0.022}" letter-spacing="${h * 0.008}" fill="#d4b26a" opacity=".8">RENDER PLACEHOLDER</text>
</svg>`)
}

/** 2:1 equirectangular test panorama with compass markers so orientation is obvious. */
export function placeholderPano(label: string, hue: number): string {
  const w = 4096
  const h = 2048
  const marks = ['N', 'E', 'S', 'W']
    .map(
      (m, i) =>
        `<text x="${(i + 0.5) * (w / 4)}" y="${h * 0.52}" text-anchor="middle" font-size="160" font-family="Georgia,serif" fill="#f4efe6" opacity=".8">${m}</text>
         <rect x="${(i + 0.5) * (w / 4) - 300}" y="${h * 0.3}" width="600" height="${h * 0.3}" fill="none" stroke="#d4b26a" stroke-opacity=".4" stroke-width="6"/>`,
    )
    .join('')
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="hsl(${hue} 20% 70%)"/><stop offset=".5" stop-color="hsl(${hue} 22% 42%)"/>
    <stop offset=".5" stop-color="hsl(${(hue + 30) % 360} 18% 24%)"/><stop offset="1" stop-color="hsl(${(hue + 30) % 360} 18% 9%)"/>
  </linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>${marks}
  <text x="50%" y="${h * 0.8}" text-anchor="middle" font-size="120" font-family="Georgia,serif" fill="#f4efe6" opacity=".7">${escape(label)} — 360° placeholder</text>
</svg>`)
}
