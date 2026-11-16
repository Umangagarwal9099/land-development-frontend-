import type { FloorCtx } from '../shell'
import type { Unit } from '../units'
import { buildDior } from './dior'
import { buildPrada } from './prada'

/*
 * The shops fitted out so far (units.ts says which): each is built in place of the bare unit the
 * shell would otherwise mark out, inside the same walls and with its entrance in the same opening.
 */

export function fitShops(e: FloorCtx) {
  for (const u of e.plan.units) {
    if (u.fitout === 'dior') buildDior(e, u)
    else if (u.fitout === 'prada') buildPrada(e, u)
  }
}

/** The light zone of a fitted shop: its own lamps, with a couple of the gallery's borrowed at the door. */
export function shopZones(e: FloorCtx): { zone: string; rects: Unit['rects']; door: [number, number, number] }[] {
  const tag = e.level === 0 ? 'g' : String(e.level)
  return e.plan.units.filter((u) => u.fitout).map((u) => {
    const f = u.fronts[0]
    const mid = (f.from + f.to) / 2
    return {
      zone: `room_mall_${tag}_${u.id.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      rects: u.rects,
      door: f.axis === 'x' ? [f.at, e.y + 2.5, mid] : [mid, e.y + 2.5, f.at],
    }
  })
}
