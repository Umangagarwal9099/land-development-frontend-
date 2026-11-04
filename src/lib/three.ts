import { Material, Mesh, Texture, type Camera, type Object3D, type Scene, type WebGLRenderer } from 'three'
import { KTX2Loader } from 'three-stdlib'

// Decoders are served from public/ (see scripts/copy-decoders.mjs) so nothing depends on a CDN.
export const DRACO_PATH = `${import.meta.env.BASE_URL}decoders/draco/`
const BASIS_PATH = `${import.meta.env.BASE_URL}decoders/basis/`

let ktx2Loader: KTX2Loader | null = null

/** One shared KTX2 loader — each instance spins up its own transcoder workers. */
export function getKtx2Loader(gl: WebGLRenderer): KTX2Loader {
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader().setTranscoderPath(BASIS_PATH)
    ktx2Loader.detectSupport(gl)
  }
  return ktx2Loader
}

/**
 * Frees GPU memory for a model that is leaving the screen. Without this a kiosk that browses
 * properties all day steadily leaks VRAM until the browser crashes.
 */
export function disposeObject(root: Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return
    obj.geometry?.dispose()
    const materials: Material[] = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof Texture) value.dispose()
      }
      material.dispose()
    }
  })
}

/** Walks up from a clicked mesh to the nearest ancestor whose name satisfies `match`. */
export function findNamedAncestor(obj: Object3D | null, match: (name: string) => boolean): Object3D | null {
  for (let o = obj; o; o = o.parent) {
    if (o.name && match(o.name)) return o
  }
  return null
}

/**
 * Puts a model on the GPU without stalling a frame: its textures go up a few per frame (a big
 * upload takes milliseconds of its own), then its shaders compile, in parallel where the browser
 * supports it. Drawing a model whose shaders aren't ready blocks the main thread until they link.
 * `onProgress` gets 0..1 over the uploads; `live()` returning false abandons the work.
 */
export function prepareOnGpu(
  root: Object3D,
  gl: WebGLRenderer,
  camera: Camera,
  scene: Scene,
  { onProgress, live = () => true }: { onProgress?: (fraction: number) => void; live?: () => boolean } = {},
): Promise<void> {
  const textures = new Set<Texture>()
  root.traverse((o) => {
    const mats = (o as Mesh).material
    if (!mats) return
    for (const m of Array.isArray(mats) ? mats : [mats]) for (const v of Object.values(m)) if (v instanceof Texture) textures.add(v)
  })
  const queue = [...textures]
  const total = Math.max(1, queue.length)
  return new Promise((resolve) => {
    const upload = () => {
      if (!live()) return resolve()
      const end = performance.now() + 6
      while (queue.length && performance.now() < end) gl.initTexture(queue.pop()!)
      onProgress?.(1 - queue.length / total)
      if (queue.length) requestAnimationFrame(upload)
      else gl.compileAsync(root, camera, scene).then(() => resolve(), () => resolve())
    }
    requestAnimationFrame(upload)
  })
}
