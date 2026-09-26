import { Edges } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BufferGeometry, ExtrudeGeometry, InstancedMesh, Matrix4, Object3D, Shape } from 'three'
import type { Plot, PlotUnit } from '../../../api/types'
import { bounds, centroid } from '../../../lib/geometry'
import { GOLD, IVORY } from '../../../lib/palette'
import { PLOT_HEIGHT } from './plotGeometry'

const TAP_TOLERANCE_PX = 8

type MaterialKey = 'wall' | 'wallShade' | 'roof' | 'glass' | 'water' | 'deck'

/** One piece of a massing model, in the plot's local frame (front of the plot faces +z). */
interface Part {
  shape: 'box' | 'gable'
  material: MaterialKey
  /** Centre position and size, in metres. */
  pos: [number, number, number]
  size: [number, number, number]
}

/**
 * Stylised massing models scaled to each plot's frontage (w) and depth (d). They are
 * architectural-model abstractions of the real homes, which open in full detail on their own screen.
 */
const MASSING: Record<PlotUnit['kind'], (w: number, d: number) => Part[]> = {
  villa: (w, d) => {
    const gw = w - 3
    const gd = d * 0.56
    return [
      { shape: 'box', material: 'wall', pos: [0, 1.7, d * 0.02], size: [gw, 3.4, gd] },
      { shape: 'box', material: 'glass', pos: [0, 1.5, d * 0.02], size: [gw + 0.06, 1.7, gd + 0.06] },
      { shape: 'box', material: 'wallShade', pos: [w * 0.08, 5.0, -d * 0.05], size: [w * 0.62, 3.2, d * 0.4] },
      { shape: 'box', material: 'glass', pos: [w * 0.08, 5.0, -d * 0.05], size: [w * 0.62 + 0.06, 1.3, d * 0.4 + 0.06] },
      { shape: 'box', material: 'roof', pos: [w * 0.06, 6.72, -d * 0.03], size: [w * 0.74, 0.24, d * 0.5] },
      { shape: 'box', material: 'deck', pos: [0, 0.08, d * 0.38], size: [w * 0.66, 0.16, d * 0.18] },
      { shape: 'box', material: 'water', pos: [-w * 0.08, 0.14, d * 0.38], size: [w * 0.42, 0.1, d * 0.12] },
    ]
  },
  farmhouse: (_w, d) => [
    { shape: 'box', material: 'wall', pos: [0, 1.8, 0], size: [17, 3.6, 10] },
    { shape: 'box', material: 'glass', pos: [0, 1.6, 0], size: [17.06, 1.8, 10.06] },
    { shape: 'gable', material: 'roof', pos: [0, 3.6, 0], size: [18.4, 2.6, 11.6] },
    { shape: 'box', material: 'deck', pos: [0, 0.12, 6.6], size: [17, 0.24, 3.2] },
    { shape: 'box', material: 'deck', pos: [0, 0.08, d * 0.24], size: [14, 0.16, 7] },
    { shape: 'box', material: 'water', pos: [0, 0.14, d * 0.24], size: [11, 0.1, 4.4] },
  ],
}

function gableGeometry(): BufferGeometry {
  // Unit triangular prism: 1 wide (x), 1 tall (y), 1 deep (z), base at y = 0.
  const tri = new Shape()
  tri.moveTo(-0.5, 0)
  tri.lineTo(0.5, 0)
  tri.lineTo(0, 1)
  tri.closePath()
  const g = new ExtrudeGeometry(tri, { depth: 1, bevelEnabled: false })
  g.translate(0, 0, -0.5)
  // Ridge runs along x: rotate so the triangle faces the ends of the house.
  g.rotateY(Math.PI / 2)
  return g
}

const FACING_ROTATION: Record<Plot['facing'], number> = { South: 0, East: Math.PI / 2, North: Math.PI, West: -Math.PI / 2 }

/** Plot centre, rotation and frontage/depth, so a massing faces the plot's road. */
export function plotFrame(plot: Plot) {
  const [cx, cz] = centroid(plot.polygon)
  const b = bounds([plot.polygon])
  const alongX = plot.facing === 'North' || plot.facing === 'South'
  const w = alongX ? b.maxX - b.minX : b.maxZ - b.minZ
  const d = alongX ? b.maxZ - b.minZ : b.maxX - b.minX
  return { cx, cz, rotation: FACING_ROTATION[plot.facing], w, d }
}

export function useMassingMaterials() {
  return useMemo(
    () => ({
      wall: { color: IVORY, roughness: 0.75 },
      wallShade: { color: '#ddd5c6', roughness: 0.75 },
      roof: { color: '#2b2d31', roughness: 0.6 },
      // Warm interior light behind glazing gives the dusk "lit model" look.
      glass: { color: '#1d1a15', roughness: 0.2, metalness: 0.3, emissive: '#ffc774', emissiveIntensity: 0.55 },
      water: { color: '#2a7896', roughness: 0.06, metalness: 0.15, emissive: '#0d3d4c', emissiveIntensity: 0.5 },
      deck: { color: '#a8977a', roughness: 0.85 },
    }),
    [],
  )
}

interface UnitsProps {
  plots: Plot[]
  interactive: boolean
  onSelect: (plot: Plot) => void
  onHover: (plot: Plot | null) => void
}

/** Every built home on the plan: one instanced mesh per massing part, whatever the number of homes. */
export function Units({ plots, interactive, onSelect, onHover }: UnitsProps) {
  const byKind = useMemo(() => {
    const groups: Record<PlotUnit['kind'], Plot[]> = { villa: [], farmhouse: [] }
    for (const p of plots) if (p.unit) groups[p.unit.kind].push(p)
    return groups
  }, [plots])

  return (
    <>
      {(Object.keys(byKind) as PlotUnit['kind'][]).map((kind) =>
        byKind[kind].length > 0 ? (
          <UnitKind key={kind} kind={kind} plots={byKind[kind]} interactive={interactive} onSelect={onSelect} onHover={onHover} />
        ) : null,
      )}
    </>
  )
}

function UnitKind({ kind, plots, interactive, onSelect, onHover }: UnitsProps & { kind: PlotUnit['kind'] }) {
  const materials = useMassingMaterials()
  // Part layout is the same for every unit of a kind; take the first plot's size as reference.
  const parts = useMemo(() => {
    const { w, d } = plotFrame(plots[0])
    return MASSING[kind](w, d)
  }, [kind, plots])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || e.delta > TAP_TOLERANCE_PX || e.instanceId === undefined) return
    e.stopPropagation()
    onSelect(plots[e.instanceId])
  }
  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive || e.pointerType !== 'mouse' || e.instanceId === undefined) return
    e.stopPropagation()
    onHover(plots[e.instanceId])
  }

  return (
    <group onClick={handleClick} onPointerMove={handleMove} onPointerLeave={() => onHover(null)}>
      {parts.map((part, i) => (
        <PartInstances key={i} part={part} plots={plots} material={materials[part.material]} />
      ))}
    </group>
  )
}

function PartInstances({ part, plots, material }: { part: Part; plots: Plot[]; material: Record<string, unknown> }) {
  const ref = useRef<InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const geometry = useMemo(() => (part.shape === 'gable' ? gableGeometry() : null), [part.shape])
  useEffect(() => () => geometry?.dispose(), [geometry])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const plotM = new Object3D()
    const partM = new Matrix4()
    const o = new Object3D()
    const [px, py, pz] = part.pos
    const [sx, sy, sz] = part.size
    o.position.set(px, py, pz)
    o.scale.set(sx, sy, sz)
    o.updateMatrix()
    partM.copy(o.matrix)
    plots.forEach((plot, i) => {
      const f = plotFrame(plot)
      plotM.position.set(f.cx, PLOT_HEIGHT, f.cz)
      plotM.rotation.set(0, f.rotation, 0)
      plotM.updateMatrix()
      mesh.setMatrixAt(i, plotM.matrix.clone().multiply(partM))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    invalidate()
  }, [plots, part, invalidate])

  const castShadow = part.material !== 'water' && part.material !== 'deck'
  return (
    <instancedMesh ref={ref} args={[geometry ?? undefined, undefined, plots.length]} castShadow={castShadow} receiveShadow>
      {part.shape === 'box' && <boxGeometry />}
      <meshStandardMaterial {...material} />
    </instancedMesh>
  )
}

/** Translucent gold massing on an empty plot: "this is what could stand here". */
export function BuildPreview({ plot, kind = 'villa' }: { plot: Plot; kind?: PlotUnit['kind'] }) {
  const f = plotFrame(plot)
  const parts = MASSING[kind](f.w, f.d).filter((p) => p.material !== 'glass')
  const gable = useMemo(() => gableGeometry(), [])
  useEffect(() => () => gable.dispose(), [gable])
  return (
    <group position={[f.cx, PLOT_HEIGHT, f.cz]} rotation-y={f.rotation}>
      {parts.map((p, i) => (
        <mesh key={i} position={p.pos} scale={p.size} geometry={p.shape === 'gable' ? gable : undefined} raycast={() => null}>
          {p.shape === 'box' && <boxGeometry />}
          <meshStandardMaterial color={GOLD} transparent opacity={0.28} depthWrite={false} emissive={GOLD} emissiveIntensity={0.25} />
          <Edges color={GOLD} threshold={20} />
        </mesh>
      ))}
    </group>
  )
}
