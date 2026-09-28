// Shapes returned by the showroom API. Keep in sync with the Go models.

export type ListingType = 'villa' | 'apartment' | 'farmhouse' | 'commercial' | 'plots'

export type AvailabilityStatus = 'available' | 'reserved' | 'sold'

export type MediaKind = 'image' | 'video' | 'pano' | 'pdf' | 'floorplan'

export interface MediaItem {
  id: string
  kind: MediaKind
  title?: string
  /** Full-size asset: image, MP4/HLS (.m3u8), equirectangular panorama or PDF. */
  url: string
  thumbUrl?: string
}

export interface CatalogItem {
  id: string
  slug: string
  name: string
  type: ListingType
  location: string
  tagline: string
  thumbnailUrl: string
  /** Present only when the caller is allowed to see prices. */
  startingPrice?: number
  /** Up to three headline figures shown on the landing screen, e.g. { label: 'Plots', value: '500' }. */
  stats?: { label: string; value: string }[]
}

export interface Catalog {
  /** Bumped on every publish; the kiosk polls it to know when to refetch. */
  version: number
  items: CatalogItem[]
}

export type Vec3 = [number, number, number]

export interface CameraPreset {
  id: string
  name: string
  position: Vec3
  target: Vec3
}

export interface Floor {
  id: string
  name: string
  /** 0 = ground. Floors above the active level are hidden (cut-away view). */
  level: number
  /** Name of the group node for this floor inside the model, e.g. "floor_G". */
  groupName: string
}

export interface Dimensions {
  length: number
  width: number
  unit: 'ft' | 'm'
}

export interface Room {
  id: string
  name: string
  kind: 'room' | 'outdoor'
  /** Mesh/group name in the model that acts as this room's hotspot, e.g. "room_living". */
  meshName: string
  /** null for outdoor areas that are always visible. */
  floorId: string | null
  dimensions?: Dimensions
  areaSqft?: number
  description: string
  specs: string[]
  amenities: string[]
  media: MediaItem[]
  price?: number
}

/** Interior designs built procedurally in the front end (walls, finishes, furniture, lighting). */
export type FurnishedDesign = 'palm-grove-e02'

/** A real exported model, a generated stand-in used until the 3D artist delivers, or a furnished design model. */
export type ModelSource =
  | { kind: 'gltf'; url: string; lowUrl?: string }
  | { kind: 'placeholder'; blocks: PlaceholderBlock[] }
  | { kind: 'furnished'; design: FurnishedDesign }

export interface PlaceholderBlock {
  meshName: string
  /** Floor group name, or "outdoor". */
  group: string
  level: number
  x: number
  z: number
  w: number
  d: number
  color: string
}

export interface Property extends CatalogItem {
  description: string
  highlights: Record<string, string>
  model: ModelSource
  floors: Floor[]
  rooms: Room[]
  presets: CameraPreset[]
  media: MediaItem[]
  brochureUrl?: string
}

export type Point2 = [number, number]

/** A built (or model) home standing on a plot; opens as its own explorable property. */
export interface PlotUnit {
  kind: 'villa' | 'farmhouse'
  name: string
  /** Slug of the Property to open when the buyer steps inside. */
  propertySlug: string
}

export interface Plot {
  id: string
  number: string
  /** Outline in metres on the master-plan ground plane (x, z). */
  polygon: Point2[]
  areaSqft: number
  dimensionsLabel: string
  facing: 'North' | 'South' | 'East' | 'West'
  roadWidthFt: number
  isCorner: boolean
  status: AvailabilityStatus
  price?: number
  unit?: PlotUnit
}

export interface Amenity {
  id: string
  name: string
  kind: 'park' | 'clubhouse' | 'entrance' | 'pool' | 'sports' | 'garden'
  polygon: Point2[]
  /** Built height in metres; 0 for flat areas like parks. */
  height: number
  description: string
  highlights?: Record<string, string>
  media?: MediaItem[]
}

export interface Road {
  id: string
  polygon: Point2[]
  name?: string
  widthFt?: number
}

export interface MasterPlan extends CatalogItem {
  description: string
  plots: Plot[]
  amenities: Amenity[]
  roads: Road[]
  nearby: { name: string; distance: string }[]
  highlights?: Record<string, string>
  /** Project film, renders and brochures. */
  media?: MediaItem[]
  /** Tree positions in plan metres (x, z); rendered as one instanced mesh. */
  landscape?: { trees: Point2[] }
}
