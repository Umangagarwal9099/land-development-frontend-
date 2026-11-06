import type { Object3D } from 'three'
import { useInfoStore, type EquipmentInfo } from '../../../store/info'

export const isDoor = (name: string) => name.startsWith('door_')
export const isDrawer = (name: string) => name.startsWith('drawer_')
/** Light switches toggle their circuit; spinners (a ceiling fan) start and stop. */
export const isSwitch = (name: string) => name.startsWith('switch_')
export const isSpinner = (name: string) => name.startsWith('spin_')
/** Push buttons (a lift's call and car buttons): pressing runs their `userData.press`. */
export const isButton = (name: string) => name.startsWith('button_')
/**
 * Equipment that explains itself: an invisible hit volume round it named `info_*`, carrying its
 * `userData.info` (an EquipmentInfo). Tapped, it opens the information card.
 */
export const isInfo = (name: string) => name.startsWith('info_')
/** Signs that lead somewhere: `goto_*`, whose `userData.target` names the room hotspot they point to. */
export const isSign = (name: string) => name.startsWith('goto_')
/** Everything a tap operates: doors swing, drawers and sliders run, switches and fans toggle, buttons press, equipment explains itself. */
export const isOpenable = (name: string) => isDoor(name) || isDrawer(name) || isSwitch(name) || isSpinner(name) || isButton(name) || isInfo(name)

/** Operates a door, drawer, switch or fan: OpenableAnimator then moves it to its new state. */
export function operate(o: Object3D) {
  if (isInfo(o.name)) useInfoStore.getState().show((o.userData.info as EquipmentInfo | undefined) ?? null)
  else if (isButton(o.name)) (o.userData.press as (() => void) | undefined)?.()
  else if (isSwitch(o.name)) {
    o.userData.on = !(o.userData.on ?? true)
    ;(o.userData.toggle as ((on: boolean) => void) | undefined)?.(o.userData.on)
  } else if (isSpinner(o.name)) o.userData.on = !o.userData.on
  else {
    const open = !o.userData.open
    o.userData.open = open
    // Linked parts (a toilet seat lifts its lid; a closing lid brings the seat down too).
    for (const part of ((open ? o.userData.alsoOpen : o.userData.alsoClose) as Object3D[] | undefined) ?? []) part.userData.open = open
  }
}
