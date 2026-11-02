import { AnimationAction, AnimationClip, AnimationMixer, Box3, CanvasTexture, CircleGeometry, DoubleSide, Group, LoadingManager, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, Quaternion, SRGBColorSpace, TextureLoader, Vector3, type Bone, type Material, type Object3D } from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { WALK_SPEED } from './walker'

/**
 * Microsoft Rocketbox's Male_Adult_07 (MIT licence, see public/models/walker/LICENSE.txt): a
 * professionally modelled and textured person, with motion-captured clips for the same skeleton.
 */
const DIR = `${import.meta.env.BASE_URL}models/walker/`
/** Standing height of the figure, metres. */
const HEIGHT = 1.55
/** The walk clip's own ground speed in the model's units per second (from its root motion, removed from the clip). */
const CLIP_DISTANCE = 121.4 / 1.2

export interface Pose {
  /** Ground speed, m/s, signed: negative while stepping backwards. */
  speed: number
  /** Stepping on the spot while turning, 0 … 1. */
  turning: number
  /** Height of the surface under a world position; null if none. */
  ground: (x: number, z: number) => number | null
  delta: number
}

let loading: Promise<{ scene: Group; clips: AnimationClip[] }> | null = null

/** One of the model's materials: its colour, its surface detail, and how much it shines. */
function finish(tex: TextureLoader, name: string, roughness: number) {
  const map = tex.load(`${DIR}${name}_color.jpg`)
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 8
  return new MeshStandardMaterial({ map, normalMap: tex.load(`${DIR}${name}_normal.jpg`), roughness, metalness: 0 })
}

/** Loaded once and kept: a second walk starts at once. */
function loadFigure() {
  // The model names its own source textures (.tga, on its authors' disk); ours are prepared for the web.
  const manager = new LoadingManager()
  manager.setURLModifier((url) => (/\.tga$/i.test(url) ? 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' : url))
  loading ??= Promise.all([new FBXLoader(manager).loadAsync(`${DIR}avatar.fbx`), fetch(`${DIR}clips.json`).then((r) => r.json() as Promise<unknown[]>)]).then(([scene, clips]) => {
    const tex = new TextureLoader()
    const hair = tex.load(`${DIR}opacity.png`)
    hair.colorSpace = SRGBColorSpace
    const parts: Record<string, Material> = {
      m013_body: finish(tex, 'body', 0.82),
      m013_head: finish(tex, 'head', 0.58),
      // Hair and lashes: cut out by the texture's alpha.
      m013_opacity: new MeshStandardMaterial({ map: hair, roughness: 0.7, metalness: 0, transparent: true, alphaTest: 0.04, side: DoubleSide }),
    }
    scene.traverse((o) => {
      o.frustumCulled = false
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as Material[]
      const next = mats.map((m) => parts[m.name] ?? m)
      for (const m of mats) m.dispose()
      mesh.material = next
    })
    return { scene, clips: clips.map((c) => AnimationClip.parse(c as Parameters<typeof AnimationClip.parse>[0])) }
  })
  return loading
}

/** A contact shadow that fades to nothing at its edge. */
function softShadow() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const r = g.createRadialGradient(64, 64, 8, 64, 64, 64)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 128, 128)
  return new CanvasTexture(c)
}

const q = new Quaternion()
const q2 = new Quaternion()
const footWorld = new Quaternion()
const A = new Vector3()
const B = new Vector3()
const C = new Vector3()
const T = new Vector3()
const dir = new Vector3()
const pole = new Vector3()
const knee = new Vector3()
const u = new Vector3()
const w = new Vector3()
const target = new Vector3()

/** Sets a bone's local rotation so that its world rotation becomes `world`. */
function setWorldRotation(bone: Object3D, world: Quaternion) {
  bone.parent!.getWorldQuaternion(q2)
  bone.quaternion.copy(q2.invert().multiply(world))
  bone.updateMatrixWorld(true)
}

/** Two-bone IK: moves the foot to `target`, keeping the knee in the plane it already bends in. */
function solveLeg(thigh: Bone, shin: Bone, foot: Bone, goal: Vector3) {
  thigh.getWorldPosition(A)
  shin.getWorldPosition(B)
  foot.getWorldPosition(C)
  foot.getWorldQuaternion(footWorld)
  const l1 = A.distanceTo(B)
  const l2 = B.distanceTo(C)
  const d = Math.min(A.distanceTo(goal), l1 + l2 - 0.002)
  dir.subVectors(goal, A).normalize()
  T.copy(A).addScaledVector(dir, d)
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along))
  pole.subVectors(B, A).addScaledVector(dir, -u.subVectors(B, A).dot(dir))
  if (pole.lengthSq() < 1e-8) pole.set(0, 0, 1)
  pole.normalize()
  knee.copy(A).addScaledVector(dir, along).addScaledVector(pole, h)

  u.subVectors(B, A).normalize()
  w.subVectors(knee, A).normalize()
  thigh.getWorldQuaternion(q)
  setWorldRotation(thigh, q.premultiply(q2.setFromUnitVectors(u, w)).clone())
  shin.getWorldPosition(B)
  foot.getWorldPosition(C)
  u.subVectors(C, B).normalize()
  w.subVectors(T, B).normalize()
  shin.getWorldQuaternion(q)
  setWorldRotation(shin, q.premultiply(q2.setFromUnitVectors(u, w)).clone())
  // The sole keeps the angle the clip gave it, whatever the leg did.
  setWorldRotation(foot, footWorld)
}

/**
 * The person the walker sees: a rigged figure played by his walk and idle clips, timed to his stride
 * so his feet don't slide, with each leg then
 * adjusted so the foot lands on the surface actually under it (a floor, a rug, a stair tread).
 */
export class Character {
  readonly root = new Group()
  private blob: Mesh
  private blobMat = new MeshBasicMaterial({ map: softShadow(), color: '#000000', transparent: true, opacity: 0.4, depthWrite: false })
  private figure = new Group()
  private mixer: AnimationMixer | null = null
  private walk: AnimationAction | null = null
  private idle: AnimationAction | null = null
  private legs: { thigh: Bone; shin: Bone; foot: Bone }[] = []
  private model: Object3D | null = null
  private clipSpeed = 1
  private amount = 0
  private disposed = false
  /** Reports a failed download, so the caller can fall back to the first-person view. */
  onFail: (() => void) | null = null

  get gait() {
    const t = this.walk?.time ?? 0
    return { phase: (t / (this.walk?.getClip().duration ?? 1)) * Math.PI * 2, amount: this.amount }
  }

  constructor() {
    // Soft contact shadow; the model's shadow maps don't redraw for a moving figure.
    this.blob = new Mesh(new CircleGeometry(0.34, 24), this.blobMat)
    this.blob.rotation.x = -Math.PI / 2
    this.blob.position.y = 0.02
    this.root.add(this.blob, this.figure)
    loadFigure().then(
      ({ scene, clips }) => {
        if (!this.disposed) this.mount(scene, clips)
      },
      () => this.onFail?.(),
    )
  }

  private mount(scene: Group, clips: AnimationClip[]) {
    const bone = (n: string) => scene.getObjectByName(`Bip01_${n}`) as Bone
    const legs = ['L', 'R'].map((s) => ({ thigh: bone(`${s}_Thigh`), shin: bone(`${s}_Calf`), foot: bone(`${s}_Foot`) }))
    this.mixer = new AnimationMixer(scene)
    const clip = (n: string) => clips.find((c) => c.name === n)!
    this.walk = this.mixer.clipAction(clip('walk')).play()
    this.idle = this.mixer.clipAction(clip('idle')).play()
    this.walk.setEffectiveWeight(0)
    // Measure him standing, then scale him to height with his soles on the floor. His clips walk
    // towards his +z; the walker's forward is −z.
    scene.position.set(0, 0, 0)
    scene.scale.setScalar(1)
    scene.rotation.set(0, Math.PI, 0)
    this.figure.add(scene)
    this.mixer.update(0)
    this.root.updateMatrixWorld(true)
    const box = new Box3().setFromObject(scene, true)
    const s = HEIGHT / (box.max.y - box.min.y)
    scene.scale.setScalar(s)
    scene.position.y = -(box.min.y - this.root.getWorldPosition(new Vector3()).y) * s
    this.clipSpeed = CLIP_DISTANCE * s
    this.legs = legs
    this.model = scene
  }

  update({ speed, turning, ground, delta }: Pose) {
    if (!this.mixer || !this.walk || !this.idle) return
    const pace = Math.abs(speed) / WALK_SPEED
    // Starting and stopping blend between the clips rather than switching.
    this.amount = MathUtils.damp(this.amount, Math.min(1, Math.max(pace, turning * 0.4)), 8, delta)
    this.walk.setEffectiveWeight(this.amount)
    this.idle.setEffectiveWeight(1 - this.amount)
    const moving = Math.max(Math.abs(speed), turning * 0.5)
    this.walk.setEffectiveTimeScale(Math.sign(speed || 1) * Math.max(0.2, moving / this.clipSpeed))
    this.figure.position.y = 0
    this.mixer.update(delta)
    this.root.updateMatrixWorld(true)

    // How far each foot's surface is from the body's own level.
    const base = this.root.position.y
    const offset = this.legs.map(({ foot }) => {
      foot.getWorldPosition(C)
      const g = ground(C.x, C.z)
      return g === null ? 0 : MathUtils.clamp(g - base, -0.3, 0.4)
    })
    // The hips ride over the lower foot, so a raised tread bends a knee rather than lifting the body off it.
    const low = Math.min(offset[0], offset[1])
    this.figure.position.y = low
    this.blob.position.y = low + 0.02
    this.root.updateMatrixWorld(true)
    this.legs.forEach(({ thigh, shin, foot }, i) => {
      const lift = offset[i] - low
      if (lift < 0.004) return
      foot.getWorldPosition(C)
      solveLeg(thigh, shin, foot, target.set(C.x, C.y + lift, C.z))
    })
  }

  dispose() {
    this.disposed = true
    this.mixer?.stopAllAction()
    if (this.model) this.mixer?.uncacheRoot(this.model)
    this.model?.removeFromParent()
    this.root.removeFromParent()
    this.blob.geometry.dispose()
    this.blobMat.map?.dispose()
    this.blobMat.dispose()
  }
}
