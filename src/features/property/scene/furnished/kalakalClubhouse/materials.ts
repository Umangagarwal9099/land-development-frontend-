import { MeshPhysicalMaterial, MeshStandardMaterial, type MeshStandardMaterialParameters } from 'three'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/** The clubhouse's own finishes, on top of the shared house kit. */
export function clubMaterials(k: Kit, lighting: Lighting) {
  const emissive = (color: string, glow: string, intensity: number, dayFactor: number) =>
    lighting.glow(std({ color, emissive: glow, emissiveIntensity: intensity, roughness: 0.5 }), dayFactor)
  // Neutral 3000 K for coves, downlights and diffusers, rather than the house kit's amber.
  k.glow.emissive.set('#fff0dc')
  k.glow.emissiveIntensity = 1.1
  lighting.glow(k.glow, 0.35)
  return {
    stone: k.finish('travertine', 3, 1.2, 0.65),
    statuario: k.finish('statuario', 1, 1, 0.22),
    // Clean matte emulsion for interior walls and bulkheads.
    paint: std({ color: '#ebe6de', roughness: 0.92 }),
    felt: std({ color: '#244f68', roughness: 1 }),
    chrome: std({ color: '#e2e5e8', metalness: 1, roughness: 0.16 }),
    steel: std({ color: '#b9bec2', metalness: 0.9, roughness: 0.3 }),
    frame: std({ color: '#1b1c1e', metalness: 0.4, roughness: 0.45 }),
    pad: std({ color: '#2c2c2f', roughness: 0.55 }),
    grip: std({ color: '#141516', roughness: 0.95 }),
    iron: std({ color: '#232427', metalness: 0.6, roughness: 0.5 }),
    white: std({ color: '#f4f2ee', roughness: 0.3 }),
    navy: std({ color: '#1d3f73', roughness: 0.45 }),
    velvet: std({ color: '#33415a', roughness: 1 }),
    cream: std({ color: '#e9e2d4', roughness: 0.95 }),
    laneBlue: std({ color: '#12306a', roughness: 0.6 }),
    tileWhite: k.finish('poolTile', 6, 2, 0.25),
    nonSlip: std({ color: '#3a3d40', roughness: 1 }),
    grating: k.finish('grating', 12, 1, 0.5),
    asphalt: std({ color: '#303134', roughness: 0.95 }),
    lineWhite: std({ color: '#e8e6e0', roughness: 0.8 }),
    piano: std({ color: '#0c0c0e', roughness: 0.08, metalness: 0.1 }),
    earth: std({ color: '#2a2622', roughness: 1 }),
    lockers: k.finish('lockers', 1, 1, 0.55),
    water: new MeshPhysicalMaterial({
      color: '#5cc8ec',
      transparent: true,
      opacity: 0.42,
      roughness: 0.03,
      clearcoat: 1,
      emissive: '#1480a6',
      emissiveIntensity: 0.35,
      depthWrite: false,
    }),
    // Light sources: warm interior accents, cool gym LEDs, the pool's underwater lights, facade and landscape.
    ledCool: emissive('#f4f8ff', '#dfeaff', 1.8, 0.45),
    ledBlue: emissive('#9fc6ff', '#3f7fff', 1.2, 0.5),
    poolLight: emissive('#e8fbff', '#7fe6ff', 3, 0.05),
    facade: emissive('#fff1dc', '#ffc27a', 2.4, 0),
    path: emissive('#fff4e2', '#ffd49a', 2.2, 0),
    display: emissive('#0b0e12', '#16263a', 0.8, 1),
  }
}

export type ClubMaterials = ReturnType<typeof clubMaterials>
