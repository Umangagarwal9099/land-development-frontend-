import { useSuspenseQuery } from '@tanstack/react-query'
import { useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Box3, MathUtils, Sphere, Vector3 } from 'three'
import { propertyQuery } from '../../../api/queries'
import type { Point2, Property } from '../../../api/types'
import { settle } from '../../../lib/async'
import { applyInset, BASE_SMOOTH_TIME, frameSphere } from '../../../lib/camera'
import { heroInset, NO_INSET, panelInset } from '../../../lib/layout'
import { useStageStore } from '../../../store/stage'
import { useViewerStore } from '../../../store/viewer'
import { Floor, Plinth, SceneLighting, Trees, useFog } from '../../../stage/environment'
import { FURNISHED_DESIGNS } from './furnished'
import { ModelRoot } from './ModelRoot'

const PLINTH_HEIGHT = 0.8

interface Site {
  minX: number
  minZ: number
  maxX: number
  maxZ: number
}

/** Extent of the building and its grounds; artist models without a placeholder get a generous default. */
function siteOf(property: Property): Site {
  // Furnished design models carry their own landscaped grounds.
  if (property.model.kind === 'furnished') return FURNISHED_DESIGNS[property.model.design].site
  if (property.model.kind !== 'placeholder') return { minX: -26, minZ: -26, maxX: 26, maxZ: 26 }
  const bs = property.model.blocks
  return {
    minX: Math.min(...bs.map((b) => b.x - b.w / 2)) - 6,
    maxX: Math.max(...bs.map((b) => b.x + b.w / 2)) + 6,
    minZ: Math.min(...bs.map((b) => b.z - b.d / 2)) - 6,
    maxZ: Math.max(...bs.map((b) => b.z + b.d / 2)) + 6,
  }
}

/** A hedge of trees around the plot boundary, leaving the front (+z) open as the approach. */
function boundaryTrees(site: Site): Point2[] {
  const out: Point2[] = []
  const step = 4.5
  for (let x = site.minX + 1.5; x <= site.maxX - 1.5; x += step) {
    out.push([x, site.minZ + 1.5])
    if (Math.abs(x) > 7) out.push([x, site.maxZ - 1.5])
  }
  for (let z = site.minZ + 1.5 + step; z <= site.maxZ - 1.5 - step; z += step) out.push([site.minX + 1.5, z], [site.maxX - 1.5, z])
  return out
}

/** A single home (villa, farmhouse, commercial block) on its plot, with rooms and amenities to explore. */
export default function PropertyScene({ slug }: { slug: string }) {
  const { data: property } = useSuspenseQuery(propertyQuery(slug))
  const mode = useStageStore((s) => s.mode)
  const setSceneReady = useStageStore((s) => s.setSceneReady)

  const site = useMemo(() => siteOf(property), [property])
  const trees = useMemo(() => boundaryTrees(site), [site])
  const radius = Math.hypot(site.maxX - site.minX, site.maxZ - site.minZ) / 2
  useFog(radius * 3, radius * 9)

  const onReady = useCallback(() => setSceneReady(true), [setSceneReady])
  usePropertyCamera(property, site, radius)

  return (
    <group>
      <SceneLighting radius={radius} center={[(site.minX + site.maxX) / 2, 0, (site.minZ + site.maxZ) / 2]} />
      <Floor y={-PLINTH_HEIGHT} size={radius * 30} />
      <Plinth {...site} height={PLINTH_HEIGHT} color="#1d2320" />
      <Trees points={trees} scale={0.8} />
      <ModelRoot property={property} interactive={mode === 'explore'} onReady={onReady} />
    </group>
  )
}

function usePropertyCamera(property: Property, site: Site, radius: number) {
  const controls = useStageStore((s) => s.controls)
  const mode = useStageStore((s) => s.mode)
  const setHome = useStageStore((s) => s.setHome)
  const camera = useThree((s) => s.camera)
  const selectedRoomId = useViewerStore((s) => s.selectedRoomId)
  const aboutOpen = useViewerStore((s) => s.aboutOpen)
  const preset = useViewerStore((s) => s.preset)

  const sphere = useMemo(
    () => new Sphere(new Vector3((site.minX + site.maxX) / 2, 2, (site.minZ + site.maxZ) / 2), radius * 0.8),
    [site, radius],
  )

  useLayoutEffect(() => {
    if (!controls) return
    camera.near = 0.1
    camera.far = radius * 40
    camera.updateProjectionMatrix()
    controls.minDistance = 4
    controls.maxDistance = radius * 4
    controls.minPolarAngle = 0
    // Just above the ground: close enough for an eye-level look at the facade.
    controls.maxPolarAngle = MathUtils.degToRad(86)
    controls.setBoundary(new Box3(new Vector3(site.minX, 0, site.minZ), new Vector3(site.maxX, 14, site.maxZ)))
    return () => controls.setBoundary()
  }, [controls, camera, site, radius])

  const goToPreset = useCallback(
    async (id: string | undefined, smoothTime = 0.9) => {
      if (!controls) return
      const p = property.presets.find((x) => x.id === id) ?? property.presets[0]
      if (!p) return
      controls.smoothTime = smoothTime
      void controls.setFocalOffset(0, 0, 0, true)
      await settle(controls.setLookAt(...p.position, ...p.target, true), 2500)
      controls.smoothTime = BASE_SMOOTH_TIME
      if (useViewerStore.getState().aboutOpen) applyInset(controls, panelInset())
    },
    [controls, property.presets],
  )

  useEffect(() => {
    setHome(() => {
      useViewerStore.getState().selectRoom(null, null)
      void goToPreset(undefined)
    })
    return () => setHome(null)
  }, [goToPreset, setHome])

  const last = useRef<{ mode: string; room: string | null } | null>(null)
  useEffect(() => {
    if (!controls) return
    const prev = last.current
    last.current = { mode, room: selectedRoomId }

    if (!prev) {
      // Arrive from above: start high over the plot and descend to the first preset.
      const p = property.presets[0]
      const [x, y, z] = p?.position ?? [30, 28, 30]
      void controls.setLookAt(x * 2.4, y * 3.2 + 40, z * 2.4, 0, 0, 0, false)
      void controls.setFocalOffset(0, 0, 0, false)
    }
    if (mode === 'attract') {
      void frameSphere(controls, sphere, { polar: 62, inset: heroInset(), distanceScale: 0.95, smoothTime: 1.4 })
      return
    }
    // Room selection flights live in ModelRoot, next to the room geometry.
    if (selectedRoomId) return
    if (!prev || prev.mode !== mode) {
      void goToPreset(undefined, 1.3)
      return
    }
    applyInset(controls, aboutOpen ? panelInset() : NO_INSET)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [controls, mode, selectedRoomId, aboutOpen, sphere])

  useEffect(() => {
    if (preset) void goToPreset(preset.id)
  }, [preset, goToPreset])
}
