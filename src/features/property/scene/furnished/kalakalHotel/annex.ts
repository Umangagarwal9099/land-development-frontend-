import { Group, type Object3D } from 'three'
import { Tris } from '../kalakalMall/skin'
import type { HotelCtx } from './ctx'
import { BACK_BLOCK, backTop, PODIUM_ROOF, superellipse } from './plan'
import { band, cap, fins, path, rail, strip } from './shell'

/*
 * The floors behind the drum: a rounded block of four storeys on the podium's roof, reaching
 * forward to the drum's back, glazed and banded like the drum itself (clear glass on silver
 * mullions at 1.5 m, a silver band at every floor, a fine transom halfway up each storey, lit
 * rooms behind), with a silver parapet round its roof.
 */
export function buildBackBlock(ctx: HotelCtx, parent: Object3D) {
  const { c, k } = ctx
  const g = new Group()
  g.name = 'back_block'
  parent.add(g)
  const { x, z, hx, hz, floors, floor } = BACK_BLOCK
  const plan = superellipse(x, z, hx, hz, 3.2, 120)
  const p = path(plan, 'closed')
  const top = backTop()
  const glass = new Tris()
  const bands = new Tris()
  const wall = new Tris()
  const ceil = new Tris()
  const floorT = new Tris()
  for (let i = 0; i < floors; i++) {
    const y0 = PODIUM_ROOF + i * floor
    const y1 = y0 + floor
    band(glass, p, 0, y0, y1 - 0.45)
    fins(k, g, p, 0.07, y0, y1 - 0.45, 1.5, 0.07, 0.16, c.fin, false)
    // The silver band over each floor's slab, and a fine transom halfway up the glass.
    rail(bands, p, -0.05, 0.12, y1 - 0.5, y1 + 0.3, false)
    rail(bands, p, 0.0, 0.06, y0 + floor / 2, y0 + floor / 2 + 0.05, false)
    // The lit room behind the glass.
    band(wall, p, -2.4, y0, y1 - 0.5, false, y0)
    strip(ceil, p, -2.4, 0, y1 - 0.52, false)
    strip(floorT, p, -2.4, 0, y0 + 0.31, true)
  }
  // The roof inside a silver parapet.
  rail(bands, p, -0.05, 0.14, top - 0.05, top + 0.75, false)
  cap(bands, plan, top - 0.05, false)
  const roof = new Tris()
  cap(roof, plan, top + 0.4, true)
  roof.mesh(c.roof, g, 'back_block_roof', false)
  glass.mesh(c.glass, g, 'back_block_glass', false)
  bands.mesh(c.silver, g, 'back_block_bands')
  wall.mesh(c.floorWall, g, 'back_block_rooms', false)
  ceil.mesh(c.slotCeiling, g, 'back_block_ceilings', false)
  floorT.mesh(c.lobbyFloor, g, 'back_block_floors', false)
}
