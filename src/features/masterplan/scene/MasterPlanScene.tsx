import { useSuspenseQuery } from '@tanstack/react-query'
import { useCursor } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Box3, MathUtils, Vector3 } from 'three'
import { masterPlanQuery } from '../../../api/queries'
import type { MasterPlan, Plot } from '../../../api/types'
import { applyInset, boxToSphere, frameSphere } from '../../../lib/camera'
import { bounds, padBox } from '../../../lib/geometry'
import { heroInset, NO_INSET, panelInset } from '../../../lib/layout'
import { useMasterPlanStore, type PlanSelection } from '../../../store/masterplan'
import { useStageStore } from '../../../store/stage'
import { Floor, Plinth, SceneLighting, Trees, useFog } from '../../../stage/environment'
import { Amenities } from './Amenities'
import { AmenityPin, PlotTag, SelectionOutline } from './Markers'
import { buildPlotMesh, paintPlots } from './plotGeometry'
import { Roads } from './Roads'
import { BuildPreview, Units } from './Units'

const TAP_TOLERANCE_PX = 8
const PLINTH_MARGIN = 22
const PLINTH_HEIGHT = 3

/**
 * The master plan as a physical scale model: plots generated from polygon data (one merged mesh,
 * one draw call for hundreds of plots), instanced homes and trees, and modelled amenities.
 */
export default function MasterPlanScene({ slug }: { slug: string }) {
  const { data: plan } = useSuspenseQuery(masterPlanQuery(slug))
  const mode = useStageStore((s) => s.mode)
  const ambient = useStageStore((s) => s.ambient)
  const setSceneReady = useStageStore((s) => s.setSceneReady)
  const interactive = mode === 'explore'

  const { selection, hoveredPlotId, visibleStatuses, buildPreview, select, hoverPlot } = useMasterPlanStore()
  const invalidate = useThree((s) => s.invalidate)

  // Geometry depends only on the plot outlines; status polls repaint colours in place.
  // Keyed on plot ids, not the plan object, which gets a new identity on every status poll.
  const plotShapeKey = plan.plots.map((p) => p.id).join()
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const plotMesh = useMemo(() => buildPlotMesh(plan.plots), [plotShapeKey])
  useEffect(() => () => plotMesh.geometry.dispose(), [plotMesh])

  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const site = useMemo(() => siteBounds(plan), [plotShapeKey])
  const radius = useMemo(() => boxToSphere(site).radius, [site])
  useFog(radius * 1.8, radius * 5.5)

  const selectedPlot = selection?.kind === 'plot' ? plan.plots.find((p) => p.id === selection.id) ?? null : null
  const hoveredPlot = hoveredPlotId ? plan.plots.find((p) => p.id === hoveredPlotId) ?? null : null
  const selectedAmenity = selection?.kind === 'amenity' ? plan.amenities.find((a) => a.id === selection.id) ?? null : null
  const selectedRoad = selection?.kind === 'road' ? plan.roads.find((r) => r.id === selection.id) ?? null : null

  useEffect(() => {
    paintPlots(plotMesh, plan.plots, selection?.kind === 'plot' ? selection.id : null, hoveredPlotId, visibleStatuses)
    invalidate()
  }, [plotMesh, plan.plots, selection, hoveredPlotId, visibleStatuses, invalidate])

  useLayoutEffect(() => {
    setSceneReady(true)
  }, [setSceneReady])

  useCameraDirector(plan, site, radius)
  useCursor(hoveredPlotId !== null)
  const compactPins = useIsFar(radius * 0.85)
  const labelsReady = useNextFrame()

  const plotAt = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const vertex = e.face?.a
    return vertex === undefined ? null : plan.plots[plotMesh.plotIndexByVertex[vertex]]
  }
  const selectPlot = useCallback((p: Plot) => select({ kind: 'plot', id: p.id }), [select])
  const hover = useCallback((p: Plot | null) => hoverPlot(p?.id ?? null), [hoverPlot])
  const previewKind = plan.plots.some((p) => p.unit?.kind === 'farmhouse') ? 'farmhouse' : 'villa'

  return (
    <group
      onPointerMissed={(e) => {
        // A plain tap on empty ground closes the detail panel.
        if (interactive && e.type === 'click') select(null)
      }}
    >
      <SceneLighting radius={radius} center={[(site.minX + site.maxX) / 2, 0, (site.minZ + site.maxZ) / 2]} />
      <Floor y={-PLINTH_HEIGHT} size={radius * 14} />
      <Plinth {...padBox(site, PLINTH_MARGIN)} height={PLINTH_HEIGHT} />

      <Roads roads={plan.roads} selectedId={selectedRoad?.id ?? null} interactive={interactive} onSelect={(r) => select({ kind: 'road', id: r.id })} />

      <mesh
        geometry={plotMesh.geometry}
        castShadow
        receiveShadow
        onClick={(e) => {
          if (!interactive || e.delta > TAP_TOLERANCE_PX) return
          const plot = plotAt(e)
          if (!plot) return
          e.stopPropagation()
          selectPlot(plot)
        }}
        onPointerMove={(e) => interactive && e.pointerType === 'mouse' && hover(plotAt(e))}
        onPointerLeave={() => hover(null)}
      >
        <meshStandardMaterial vertexColors roughness={0.82} />
      </mesh>

      <Units plots={plan.plots} interactive={interactive} onSelect={selectPlot} onHover={hover} />
      <Amenities amenities={plan.amenities} selectedId={selectedAmenity?.id ?? null} interactive={interactive} onSelect={(a) => select({ kind: 'amenity', id: a.id })} />
      <Trees points={plan.landscape?.trees ?? []} />

      {selectedPlot && <SelectionOutline key={selectedPlot.id} polygon={selectedPlot.polygon} />}
      {selectedRoad && <SelectionOutline key={selectedRoad.id} polygon={selectedRoad.polygon} y={0.05} />}
      {selectedPlot && buildPreview && !selectedPlot.unit && <BuildPreview plot={selectedPlot} kind={previewKind} />}

      {interactive && !ambient && labelsReady && (
        <>
          {selectedPlot && <PlotTag key={`sel-${selectedPlot.id}`} plot={selectedPlot} emphasis />}
          {hoveredPlot && hoveredPlot.id !== selectedPlot?.id && <PlotTag key={`hov-${hoveredPlot.id}`} plot={hoveredPlot} />}
          {plan.amenities.map((a) => (
            <AmenityPin key={a.id} amenity={a} active={a.id === selectedAmenity?.id} compact={compactPins} onSelect={() => select({ kind: 'amenity', id: a.id })} />
          ))}
        </>
      )}
    </group>
  )
}

/**
 * drei <Html> labels mounted in the same render as their scene get torn down and re-rooted while
 * React is still rendering; mounting them a frame later avoids that.
 */
function useNextFrame() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return ready
}

/** True while the camera is further than `distance` away; re-renders only when that flips. */
function useIsFar(distance: number) {
  const controls = useStageStore((s) => s.controls)
  const [far, setFar] = useState(true)
  useEffect(() => {
    if (!controls) return
    const check = () => setFar(controls.distance > distance)
    check()
    controls.addEventListener('update', check)
    return () => controls.removeEventListener('update', check)
  }, [controls, distance])
  return far
}

function siteBounds(plan: MasterPlan) {
  return bounds([...plan.plots.map((p) => p.polygon), ...plan.amenities.map((a) => a.polygon), ...plan.roads.map((r) => r.polygon)])
}

function selectionSphere(plan: MasterPlan, selection: PlanSelection) {
  if (selection.kind === 'plot') {
    const plot = plan.plots.find((p) => p.id === selection.id)
    if (!plot) return null
    // Pad so neighbouring plots and the road stay in view for context.
    return boxToSphere(padBox(bounds([plot.polygon]), plot.unit ? 14 : 18), plot.unit ? 3 : 0)
  }
  const polygon =
    selection.kind === 'amenity'
      ? plan.amenities.find((a) => a.id === selection.id)?.polygon
      : plan.roads.find((r) => r.id === selection.id)?.polygon
  return polygon ? boxToSphere(padBox(bounds([polygon]), 10), 2) : null
}

/**
 * All camera choreography for the master plan, in one place:
 *  - entry: a slow swoop from high above down to the current framing
 *  - attract (landing): wide, low orbit with the site offset beside the title
 *  - explore: overview, or the current selection framed beside the detail panel
 *  - panel open/close: slide the view so the subject stays in the open area
 */
function useCameraDirector(plan: MasterPlan, site: ReturnType<typeof siteBounds>, radius: number) {
  const controls = useStageStore((s) => s.controls)
  const mode = useStageStore((s) => s.mode)
  const setHome = useStageStore((s) => s.setHome)
  const setDive = useStageStore((s) => s.setDive)
  const selection = useMasterPlanStore((s) => s.selection)
  const aboutOpen = useMasterPlanStore((s) => s.aboutOpen)
  const focus = useMasterPlanStore((s) => s.focus)
  const camera = useThree((s) => s.camera)

  const sphere = useMemo(() => boxToSphere(site), [site])
  const selKey = selection ? `${selection.kind}:${selection.id}` : null

  // Limits: full 360° orbit, tilt from top-down to just above the horizon, zoom and pan kept on site.
  useLayoutEffect(() => {
    if (!controls) return
    camera.near = 0.5
    camera.far = radius * 14
    camera.updateProjectionMatrix()
    controls.minDistance = 16
    controls.maxDistance = radius * 2.8
    controls.minPolarAngle = 0
    controls.maxPolarAngle = MathUtils.degToRad(78)
    controls.setBoundary(new Box3(new Vector3(site.minX, -2, site.minZ), new Vector3(site.maxX, 20, site.maxZ)))
    return () => controls.setBoundary()
  }, [controls, camera, site, radius])

  const overview = useCallback(
    (transition = true) => {
      if (!controls) return
      const inset = useMasterPlanStore.getState().aboutOpen ? panelInset() : NO_INSET
      void frameSphere(controls, sphere, { polar: 50, azimuth: 14, inset, distanceScale: 0.9, transition, smoothTime: 0.9 })
    },
    [controls, sphere],
  )

  useEffect(() => {
    setHome(() => {
      useMasterPlanStore.getState().select(null)
      overview()
    })
    return () => setHome(null)
  }, [overview, setHome])

  // "Enter residence": fly down close to the home before the screen changes.
  useEffect(() => {
    if (!controls) return
    setDive(async (plotId) => {
      const plot = plan.plots.find((p) => p.id === plotId)
      if (!plot) return
      const s = boxToSphere(bounds([plot.polygon]), 3)
      await frameSphere(controls, s, { polar: 62, inset: NO_INSET, distanceScale: 0.9, smoothTime: 0.55 })
    })
    return () => setDive(null)
  }, [controls, plan.plots, setDive])

  const last = useRef<{ mode: string; selKey: string | null } | null>(null)
  useEffect(() => {
    if (!controls) return
    const prev = last.current
    last.current = { mode, selKey }

    if (!prev) {
      // First frame of this scene: start high and far, then swoop into place.
      const c = sphere.center
      void controls.setLookAt(c.x + radius * 0.7, radius * 2.2, c.z + radius * 2.4, c.x, 0, c.z, false)
      void controls.setFocalOffset(0, 0, 0, false)
    }

    if (mode === 'attract') {
      void frameSphere(controls, sphere, { polar: 60, inset: heroInset(), distanceScale: 0.78, smoothTime: 1.4 })
      return
    }
    const sel = useMasterPlanStore.getState().selection
    if (sel) {
      if (prev?.selKey === selKey && prev?.mode === mode) return
      const s = selectionSphere(plan, sel)
      if (s) void frameSphere(controls, s, { polar: 54, inset: panelInset(), smoothTime: prev ? 0.65 : 1.2 })
      return
    }
    if (!prev || prev.mode !== mode) {
      overview()
      return
    }
    // Selection cleared or about panel toggled: keep the view, just recentre for the new inset.
    applyInset(controls, aboutOpen ? panelInset() : NO_INSET)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- plan changes on every status poll; framing must not
  }, [controls, mode, selKey, aboutOpen, sphere, radius, overview])

  useEffect(() => {
    if (!controls || !focus) return
    const inset = useMasterPlanStore.getState().aboutOpen ? panelInset() : NO_INSET
    void frameSphere(controls, boxToSphere(focus.box), { polar: 48, inset, smoothTime: 0.8 })
  }, [controls, focus])
}
