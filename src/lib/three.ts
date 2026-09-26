import { Material, Mesh, Texture, type Object3D, type WebGLRenderer } from 'three'
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
