import type { FloorCtx } from '../shell'
import type { Unit } from '../units'
import { buildDior } from './dior'
import { buildAppleStore } from './applestore'
import { buildBagStore } from './bagStore'
import { buildCosmetics } from './cosmetics'
import { buildDecorStore } from './decorStore'
import { buildPatisserie } from './dessertBar'
import { buildParfumerie } from './parfumerie'
import { buildPrada } from './prada'
import { buildStarbucks } from './starbucks'
import { buildTribeca } from './tribeca'
import { buildWomenStore } from './womenStore'

/*
 * The shops fitted out so far (units.ts says which): each is built in place of the bare unit the
 * shell would otherwise mark out, inside the same walls and with its entrance in the same opening.
 */

export function fitShops(e: FloorCtx) {
  for (const u of e.plan.units) {
    if (u.fitout === 'dior') buildDior(e, u)
    else if (u.fitout === 'prada') buildPrada(e, u)
    else if (u.fitout === 'starbucks') buildStarbucks(e, u)
    else if (u.fitout === 'cosmetics') buildCosmetics(e, u)
    else if (u.fitout === 'apple') buildAppleStore(e, u)
    else if (u.fitout === 'perfume') buildParfumerie(e, u)
    else if (u.fitout === 'heels') buildTribeca(e, u)
    else if (u.fitout === 'dessert') buildPatisserie(e, u)
    else if (u.fitout === 'decor') buildDecorStore(e, u)
    else if (u.fitout === 'women') buildWomenStore(e, u)
    else if (u.fitout === 'bags') buildBagStore(e, u)
  }
}

/** The light zone of a fitted shop: its own lamps, with a couple of the gallery's borrowed at the door (a kiosk in a gallery is lit with it). */
export function shopZones(e: FloorCtx): { zone: string; rects: Unit['rects']; door: [number, number, number] }[] {
  const tag = e.level === 0 ? 'g' : String(e.level)
  return e.plan.units.filter((u) => u.fitout && u.kind !== 'kiosk').map((u) => {
    const f = u.fronts[0]
    const mid = (f.from + f.to) / 2
    return {
      zone: `room_mall_${tag}_${u.id.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      rects: u.rects,
      door: f.axis === 'x' ? [f.at, e.y + 2.5, mid] : [mid, e.y + 2.5, f.at],
    }
  })
}
