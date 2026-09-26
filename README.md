# Property Showroom — Frontend

Interactive 3D property showroom for a large touch TV. React + TypeScript + Vite, with
three.js via React Three Fiber. Runs in any modern browser and is designed to be wrapped in
an Electron kiosk shell for the showroom PC.

## Quick start

```bash
npm install          # also copies Draco/KTX2 decoders into public/decoders
cp .env.example .env.local
npm run dev
```

It runs entirely on mock data (`VITE_USE_MOCK=true`), including a procedural villa, farmhouse,
commercial block and a 500-plot township, so every screen works before the backend or any 3D
content exists.

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Dev server                                    |
| `npm run build`     | Type-check + production build into `dist/`    |
| `npm run lint`      | oxlint                                        |
| `npm run typecheck` | TypeScript only                               |

## Experience

One persistent 3D stage sits behind every screen; screens are light overlays that tell it what to
show. Moving between them is a camera flight (or a short fade through black when the scene itself
changes), never a page reload.

- **Landing** (`/`): each project turns slowly in 3D behind a cinematic title card. Projects
  auto-advance; swipe or tap the index to choose, then **Explore in 3D** flies straight in.
- **Master plan** (`/layout/:slug`): the site as an architectural scale model: plots coloured by
  availability (tap the legend to filter), built homes, roads, trees and modelled amenities.
  Tap a plot, road or amenity pin for its details; **Enter residence** dives into the home.
  The dock holds Blocks, Amenities, About, Gallery and Film.
- **Residence** (`/property/:slug`): floor cut-away rail, tap-a-room flights, room details and
  **Step inside · 360°** panoramas. Opened from a plot with `?from=<plan>&plot=<number>`.

Everywhere: one-finger drag orbits 360° and tilts, pinch or wheel zooms, two-finger drag pans,
all damped and kept inside the site. Bottom-left: 360° turntable, zoom, a compass that resets the
view, and presentation (fullscreen) mode. Keyboard: arrows, `+`/`-`, Space, `R`, `F`.

After 45 s untouched the interface fades and the model turns on its own; the first touch brings
it back. After `VITE_IDLE_RESET_SECONDS` the kiosk returns to the landing screen and hides prices.
Staff reveal prices by **long-pressing the brand mark** and entering `VITE_STAFF_PIN`.

## Structure

```
src/
  api/            types.ts (API contract), client.ts, queries.ts, mock/ (dev data)
  stage/          the persistent Canvas: camera rig (gestures, damping, turntable), lighting,
                  plinth/trees, loader
  store/          zustand: stage (scene, mode, curtain), masterplan, viewer (residence), media, staff
  components/     AppShell (stage + route transitions + idle/ambient), SceneHeader, ViewControls,
                  BrandMark (staff PIN), GestureHint, ui/ (Button, Dock, Panel, Feedback)
  features/
    landing/      project showcase
    masterplan/   page + panels; scene/ (merged plot mesh, instanced homes, roads, amenities, markers)
    property/     page + panels; scene/ (ModelRoot hotspots/floors/doors, GltfModel, placeholder)
    media/        full-screen viewer, film player, 360° panorama
  lib/            camera framing, layout insets, geometry, palette, formatting, three helpers
```

Design tokens (colours, fonts, glass surface) live in `src/index.css`. Fonts are bundled from npm,
so the kiosk renders identically offline.

## Loading strategy

Nothing heavy loads up front:

1. The DOM shell (no three.js) paints first; the 3D stage chunk loads right behind it.
2. The landing screen prefetches the current and next project's data while one is on show.
3. Opening a residence shows the **low-res GLB** (`lowUrl`) immediately and swaps in the full
   GLB when it arrives.
3. Gallery thumbnails use `loading="lazy"`. Full images, videos (HLS via hls.js, loaded on demand)
   and 360° panoramas are fetched only when opened.
4. Leaving a property disposes its geometry/textures and clears the loader cache, so GPU memory
   stays flat on a kiosk that runs all day.

The canvas uses `frameloop="demand"`, so it renders only while something moves. The GPU idles
otherwise.

## 3D model contract (give this to the 3D artist)

Models are GLB files. Node names drive every interaction:

| Node name                    | Purpose                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| `floor_G`, `floor_1`, …      | One group per floor. Floors above the selected one are hidden.   |
| `roof`                       | Hidden whenever a specific floor is selected.                    |
| `room_<name>`                | Tappable room hotspot. Must match `Room.meshName` in the CMS.    |
| `amenity_<name>`             | Tappable outdoor area (pool, garden, parking…).                  |
| `door_<name>`                | Pivot at the hinge; rotates 90° on tap.                          |

Budgets per property: ≤ 800k triangles, ≤ 300 draw calls, 2K textures (4K only for hero
surfaces), baked lighting, full GLB ≤ 40 MB, low GLB ≤ 5 MB.

Optimise the artist's export with:

```bash
./scripts/optimize-model.sh artist-export.glb out/aranya-villa
# → out/aranya-villa.glb (meshopt + KTX2) and out/aranya-villa.low.glb
```

Upload with content-hashed filenames and `Cache-Control: public, max-age=31536000, immutable`.

## Backend contract

With `VITE_USE_MOCK=false` the app calls the Go API at `VITE_API_BASE_URL`:

| Endpoint                          | Returns       |
| --------------------------------- | ------------- |
| `GET /showroom/catalog`           | `Catalog` (projects: master plans + standalone buildings) |
| `GET /showroom/properties/:slug`  | `Property`    |
| `GET /showroom/layouts/:slug`     | `MasterPlan`  |

Shapes are in [src/api/types.ts](src/api/types.ts). New optional fields drive the redesign and
degrade gracefully when absent: `CatalogItem.stats`, `Plot.unit` (the home on a plot and the
property it opens), `Road.name`/`widthFt`, `Amenity.highlights`/`media`, and
`MasterPlan.highlights`/`media`/`landscape.trees`. Errors are `{"error": "..."}`. Asset
URLs may be absolute or keys relative to `VITE_ASSET_BASE_URL` (the public R2 bucket's custom
domain). Prices (`startingPrice`, `price`) should be **omitted by the API** unless the request
carries a sales-role token. The staff PIN only controls what the UI shows.

## Environment

See [.env.example](.env.example). For the Electron kiosk build set `VITE_ROUTER=hash`, which
also switches Vite to relative asset paths for `file://`.

## Next steps

- Electron kiosk shell (full-screen, auto-launch, auto-update, local asset cache for offline)
- Admin CMS (properties, rooms, media upload via R2 presigned URLs, plot status, hotspot mapper)
- Go endpoints above
