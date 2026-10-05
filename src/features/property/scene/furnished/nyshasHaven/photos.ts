import { RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture } from 'three'

/**
 * Surfaces taken from photographs of the finished farmhouse (public/models/nyshas-haven): the real
 * brick, carved door, glazing, thatch, stone and pebbles. Each photo loads once; every surface gets
 * a repeat-adjusted clone that refreshes when the image arrives.
 */
export class Photos {
  private loader = new TextureLoader()
  private base = new Map<string, { texture: Texture; clones: Texture[] }>()
  private pending: Promise<void>[] = []

  get(name: string, repeat: [number, number] = [1, 1]): Texture {
    let entry = this.base.get(name)
    if (!entry) {
      const clones: Texture[] = []
      let texture!: Texture
      this.pending.push(
        new Promise((resolve) => {
          texture = this.loader.load(
            `${import.meta.env.BASE_URL}models/nyshas-haven/${name}.jpg`,
            () => {
              for (const c of clones) c.needsUpdate = true
              resolve()
            },
            undefined,
            () => resolve(),
          )
        }),
      )
      texture.colorSpace = SRGBColorSpace
      texture.wrapS = texture.wrapT = RepeatWrapping
      texture.anisotropy = 8
      entry = { texture, clones }
      this.base.set(name, entry)
    }
    const c = entry.texture.clone()
    c.repeat.set(repeat[0], repeat[1])
    entry.clones.push(c)
    return c
  }

  /** Resolves once every photograph has loaded (or failed), so the scene can redraw. */
  ready() {
    return Promise.all(this.pending).then(() => undefined)
  }
}
