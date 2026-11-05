import {
  BoxGeometry, BufferAttribute, Color, Euler, Group, InstancedMesh, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Quaternion, Vector3,
  type BufferGeometry, type Material, type Object3D, type Texture,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { drawPlate, isSolidPaint, parkedCar, plateNumber, type Body } from '../car'
import type { Kit } from '../kit'
import { underground } from './materials'
import { PLATE_ATLAS } from './paints'

/*
 * A car park's worth of parked cars, drawn as instances. Each body type is modelled once (car.ts,
 * 33k triangles with its wheels, cabin and lamps) and every part becomes one instanced mesh across
 * all the cars of that type: a level of fifty cars is a few dozen draw calls and no more geometry
 * in memory than five cars. Paint comes per instance (solid whites and blacks, metallics for the
 * rest); number plates are cut from one atlas, each car its own registration.
 */

export interface Parked {
  body: Body
  colour: string
  x: number
  z: number
  yaw: number
  y: number
}

interface Part {
  geometry: BufferGeometry
  material: Material
  matrix: Matrix4
  cast: boolean
  paint?: 'body' | 'part'
  plate?: boolean
}

/** Length, width and height of each body, for its collision box. */
const SIZE: Record<Body, [number, number, number]> = {
  crossover: [4.32, 1.79, 1.5],
  sedan: [4.55, 1.75, 1.3],
  hatch: [3.85, 1.73, 1.4],
  suv: [4.75, 1.86, 1.7],
  mpv: [4.4, 1.74, 1.55],
}

const templates = new Map<Body, Part[]>()

/** The parts of one car of `body`, in the car's own frame. */
function template(body: Body): Part[] {
  let parts = templates.get(body)
  if (parts) return parts
  const holder = new Group()
  parkedCar(holder, body, '#7a7d80', 0, 0, 0)
  holder.updateMatrixWorld(true)
  parts = []
  holder.traverse((o) => {
    if (!(o instanceof Mesh)) return
    const material = o.material as Material
    parts!.push({
      geometry: o.geometry,
      material,
      matrix: o.matrixWorld.clone(),
      cast: o.castShadow,
      paint: material.userData.paint as Part['paint'],
      plate: material.userData.plate !== undefined,
    })
  })
  templates.set(body, parts)
  return parts
}

/** Five paint finishes for instanced cars: white paint tinted per instance, clearcoated. */
function paints(env: Texture) {
  const make = (solid: boolean, vertexColors: boolean) =>
    new MeshPhysicalMaterial({
      color: '#ffffff', vertexColors, metalness: solid ? 0 : 0.55, roughness: solid ? 0.32 : 0.4,
      clearcoat: 1, clearcoatRoughness: 0.035, envMap: env, envMapIntensity: 0.9,
    })
  return { body: { solid: make(true, true), metal: make(false, true) }, part: { solid: make(true, false), metal: make(false, false) } }
}

function plateAtlas(k: Kit, numbers: string[]) {
  const { cols, rows, w, h } = PLATE_ATLAS
  const map = k.tex.painted(cols * w, rows * h, (g) => {
    numbers.forEach((n, i) => {
      g.save()
      g.translate((i % cols) * w, Math.floor(i / cols) * h)
      drawPlate(g, n, w, h)
      g.restore()
    })
  })
  return new MeshStandardMaterial({ map, roughness: 0.45 })
}

/** Parks `cars` under `parent`. Returns the instanced meshes (kept out of static merging). */
export function parkFleet(k: Kit, parent: Object3D, cars: Parked[], env: Texture, seed: number) {
  const fleet = new Group()
  fleet.name = 'inst_fleet'
  parent.add(fleet)
  const cache = new Map<Material, Material>()
  const finish = paints(env)
  const numbers = Array.from({ length: PLATE_ATLAS.cols * PLATE_ATLAS.rows }, () => plateNumber())
  const plateMat = plateAtlas(k, numbers)
  const plates = new Group()
  plates.name = 'plates'
  parent.add(plates)

  const m = new Matrix4()
  const place = (c: Parked) => new Matrix4().compose(new Vector3(c.x, c.y, c.z), new Quaternion().setFromEuler(new Euler(0, c.yaw, 0)), new Vector3(1, 1, 1))
  const colour = new Color()
  const byBody = new Map<Body, Parked[]>()
  for (const c of cars) byBody.set(c.body, [...(byBody.get(c.body) ?? []), c])

  let plateIndex = seed
  for (const [body, list] of byBody) {
    const where = list.map(place)
    for (const part of template(body)) {
      if (part.plate) {
        // Plates: ordinary meshes (four triangles each) that merge into one, each with its own cell of the atlas.
        list.forEach((_, i) => {
          const cell = plateIndex++ % numbers.length
          const g = part.geometry.clone()
          const uv = g.getAttribute('uv') as BufferAttribute
          const u0 = (cell % PLATE_ATLAS.cols) / PLATE_ATLAS.cols
          const v0 = 1 - (Math.floor(cell / PLATE_ATLAS.cols) + 1) / PLATE_ATLAS.rows
          for (let j = 0; j < uv.count; j++) uv.setXY(j, u0 + uv.getX(j) / PLATE_ATLAS.cols, v0 + uv.getY(j) / PLATE_ATLAS.rows)
          const mesh = new Mesh(g, plateMat)
          mesh.applyMatrix4(m.multiplyMatrices(where[i], part.matrix))
          mesh.receiveShadow = true
          plates.add(mesh)
        })
        continue
      }
      const groups: { material: Material; cars: number[] }[] = part.paint
        ? [
            { material: finish[part.paint].solid, cars: list.flatMap((c, i) => (isSolidPaint(c.colour) ? [i] : [])) },
            { material: finish[part.paint].metal, cars: list.flatMap((c, i) => (isSolidPaint(c.colour) ? [] : [i])) },
          ]
        : [{ material: underground(cache, part.material, env), cars: list.map((_, i) => i) }]
      for (const { material, cars: idx } of groups) {
        if (!idx.length) continue
        const inst = new InstancedMesh(part.geometry, material, idx.length)
        inst.name = `inst_${body}`
        inst.castShadow = part.cast
        inst.receiveShadow = true
        idx.forEach((ci, n) => {
          inst.setMatrixAt(n, m.multiplyMatrices(where[ci], part.matrix))
          if (part.paint) inst.setColorAt(n, colour.set(list[ci].colour))
        })
        inst.instanceMatrix.needsUpdate = true
        if (inst.instanceColor) inst.instanceColor.needsUpdate = true
        inst.computeBoundingSphere()
        inst.computeBoundingBox()
        fleet.add(inst)
      }
    }
  }
  // What a walker bumps into: one unseen box per car, merged (instanced parts aren't collided).
  const boxes: BufferGeometry[] = []
  for (const c of cars) {
    const [l, w, h] = SIZE[c.body]
    const b = new BoxGeometry(w, h, l)
    b.applyMatrix4(new Matrix4().compose(new Vector3(c.x, c.y + h / 2 + 0.12, c.z), new Quaternion().setFromEuler(new Euler(0, c.yaw, 0)), new Vector3(1, 1, 1)))
    b.deleteAttribute('uv')
    boxes.push(b)
  }
  if (boxes.length) {
    const proxy = new Mesh(mergeGeometries(boxes), new MeshStandardMaterial())
    proxy.name = 'proxy_cars'
    proxy.visible = false
    parent.add(proxy)
  }
  return fleet
}
