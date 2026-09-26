// Copies the Draco and Basis (KTX2) decoders into public/ so compressed models
// load without a CDN — the showroom must keep working offline.
import { cpSync, mkdirSync } from 'node:fs'

const src = 'node_modules/three/examples/jsm/libs'
const dest = 'public/decoders'

mkdirSync(dest, { recursive: true })
cpSync(`${src}/draco/gltf`, `${dest}/draco`, { recursive: true })
cpSync(`${src}/basis`, `${dest}/basis`, { recursive: true })
console.log('decoders copied to', dest)
