// Temporary render harness for the mall (loaded by a puppeteer script via the dev server); not part of the app.
import * as THREE from 'three'
import { buildKalakalMall } from './features/property/scene/furnished/kalakalMall'
import { prepareRaycast } from './features/property/scene/furnished/optimize'
import { Collider } from './features/property/scene/walk/collider'
import { Walker } from './features/property/scene/walk/walker'

;(window as unknown as { __harness: unknown }).__harness = { THREE, buildKalakalMall, prepareRaycast, Collider, Walker }
