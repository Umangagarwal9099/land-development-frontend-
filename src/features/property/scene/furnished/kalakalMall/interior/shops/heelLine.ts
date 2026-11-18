import type { Material } from 'three'
import type { EquipmentInfo } from '../../../../../../../store/info'
import type { Finish, HeelMaterials } from './heelArt'
import { HOUSE } from './heelArt'
import type { Cut, HeelShape, HeelSpec, Toe, Trim } from './heels'

/*
 * TR/BECA's collection: twenty-two models of women's heels, each in its colourways, from the
 * day pump to the bridal sandal. Every displayed shoe is one model in one colourway; its card
 * carries what a sales associate would say, its sizes and price, and puts a pair in the bag.
 */

export interface Way {
  colour: string
  finish: Finish
  hex: string
  /** Sole colour (a nude sole under pale shoes, black under dark ones). */
  sole?: string
  /** The heel's covering, if it differs: a finish and colour, or gold or clear. */
  heel?: [Finish, string] | 'gold' | 'clear'
  strap?: [Finish, string]
  trim?: [Finish, string]
}

export interface Model {
  name: string
  line: 'Day' | 'Evening' | 'Bridal' | 'Atelier'
  style: string
  cut: Cut
  toe: Toe
  heel: HeelShape
  /** Heel height in millimetres. */
  mm: number
  platform?: number
  trim?: Trim
  story: string
  price: number
  /** Sizes out of stock in the boutique. */
  out?: number[]
  ways: Way[]
}

const DARK = '#231b17'
const NUDE = '#c9a184'
const IVORY_SOLE = '#e9dcc9'

export const LINE: Record<string, Model> = {
  aurelia: {
    name: 'Aurelia', line: 'Day', style: 'Stiletto pump', cut: 'pump', toe: 'pointed', heel: 'stiletto', mm: 100, price: 32900,
    story: 'The house pump: a sharp pointed toe, a low-cut vamp that lengthens the leg and a 100 mm stiletto set right under the heel for balance.',
    ways: [{ colour: 'Nude', finish: 'patent', hex: '#d6b29a', sole: NUDE }, { colour: 'Noir', finish: 'patent', hex: '#141414', sole: DARK }, { colour: 'Rouge', finish: 'patent', hex: '#9c1426', sole: DARK }],
  },
  celeste: {
    name: 'Céleste', line: 'Day', style: 'Kitten-heel slingback', cut: 'slingback', toe: 'pointed', heel: 'kitten', mm: 45, price: 26500, out: [41],
    story: 'A slingback for long days: a pointed toe, an open back held by a fine buckled strap, and a sculpted 45 mm kitten heel.',
    ways: [{ colour: 'Ivory', finish: 'nappa', hex: '#eee6d8', sole: IVORY_SOLE }, { colour: 'Black', finish: 'nappa', hex: '#1a1a1a', sole: DARK }, { colour: 'Blush', finish: 'nappa', hex: '#e2bcb4', sole: NUDE }],
  },
  mira: {
    name: 'Mira', line: 'Evening', style: 'Strappy stiletto sandal', cut: 'strappy', toe: 'almond', heel: 'stiletto', mm: 105, price: 38900, out: [35],
    story: 'Barely there: two fine toe straps, crossed instep straps and a buckled ankle strap on a 105 mm stiletto, in laminated leather that catches the light.',
    ways: [{ colour: 'Gold', finish: 'metallic', hex: '#d6b476', sole: NUDE }, { colour: 'Silver', finish: 'metallic', hex: '#d2d5d9', sole: DARK }],
  },
  noor: {
    name: 'Noor', line: 'Bridal', style: 'Bridal pump with crystal buckle', cut: 'pump', toe: 'pointed', heel: 'stiletto', mm: 90, trim: 'crystal', price: 48500,
    story: 'Made for the aisle: duchesse satin over a pointed last, a square buckle set with crystals on the vamp, and a 90 mm stiletto to dance in all night.',
    ways: [{ colour: 'Ivory', finish: 'satin', hex: '#f1e9d8', sole: IVORY_SOLE }, { colour: 'Blush', finish: 'satin', hex: '#ecd1c7', sole: IVORY_SOLE }],
  },
  isadora: {
    name: 'Isadora', line: 'Day', style: 'Block-heel Mary Jane', cut: 'maryjane', toe: 'round', heel: 'block', mm: 70, price: 27900,
    story: 'A Mary Jane in soft suede: a rounded toe, a buckled strap across the instep and a steady 70 mm block heel.',
    ways: [{ colour: 'Tan', finish: 'suede', hex: '#a66f48', sole: DARK }, { colour: 'Bordeaux', finish: 'suede', hex: '#62202c', sole: DARK }, { colour: 'Black', finish: 'suede', hex: '#1d1c1c', sole: DARK }],
  },
  valencia: {
    name: 'Valencia', line: 'Evening', style: 'Platform pump', cut: 'pump', toe: 'almond', heel: 'stiletto', mm: 130, platform: 30, price: 41500, out: [35, 36],
    story: 'Height without the strain: a 30 mm platform under the forefoot makes this 130 mm stiletto feel like a 100.',
    ways: [{ colour: 'Noir', finish: 'patent', hex: '#121212', sole: DARK }, { colour: 'Rose glitter', finish: 'glitter', hex: '#d8a1a6', sole: DARK }],
  },
  sienna: {
    name: 'Sienna', line: 'Day', style: 'Ankle-strap wedge', cut: 'ankle', toe: 'almond', heel: 'wedge', mm: 85, price: 24900,
    story: 'A wedge for terraces and garden parties: an almond-toe pump cut, a buckled ankle strap, and an 85 mm wedge wrapped in woven raffia.',
    ways: [{ colour: 'Cognac', finish: 'nappa', hex: '#93542b', sole: DARK, heel: ['suede', '#c8a479'] }, { colour: 'Black', finish: 'nappa', hex: '#191919', sole: DARK, heel: ['suede', '#2a2725'] }],
  },
  elodie: {
    name: 'Élodie', line: 'Atelier', style: "D'Orsay pump", cut: 'dorsay', toe: 'pointed', heel: 'stiletto', mm: 85, price: 33500,
    story: "A d'Orsay: the sides cut away at the waist to show the arch of the foot, between a closed heel and a pointed vamp, on an 85 mm stiletto.",
    ways: [{ colour: 'Blush', finish: 'suede', hex: '#d9afa8', sole: NUDE }, { colour: 'Navy', finish: 'suede', hex: '#1f2943', sole: DARK }],
  },
  rosalind: {
    name: 'Rosalind', line: 'Evening', style: 'Satin mule with bow', cut: 'mule', toe: 'pointed', heel: 'flare', mm: 75, trim: 'bow', price: 29900,
    story: 'A backless mule in satin with a hand-tied bow on the vamp, on a 75 mm flared heel that steadies every step.',
    ways: [{ colour: 'Blush', finish: 'satin', hex: '#e9c4bf', sole: NUDE }, { colour: 'Emerald', finish: 'satin', hex: '#1d5a47', sole: DARK }],
  },
  juno: {
    name: 'Juno', line: 'Atelier', style: 'Sculpted-heel pump', cut: 'pump', toe: 'pointed', heel: 'sculpted', mm: 95, price: 45900,
    story: 'A pump on a heel cast in brass and finished in gold: swept back under the seat and forward to its tip like a stroke of a pen.',
    ways: [{ colour: 'Black', finish: 'nappa', hex: '#171717', sole: DARK, heel: 'gold' }, { colour: 'Chalk', finish: 'nappa', hex: '#f0ece4', sole: IVORY_SOLE, heel: 'gold' }],
  },
  opaline: {
    name: 'Opaline', line: 'Day', style: 'Clear-heel pump', cut: 'pump', toe: 'pointed', heel: 'clear', mm: 80, price: 27500,
    story: 'A pointed pump on a clear acrylic heel, so the leg seems to rise straight from the shoe: 80 mm, and easy to wear.',
    ways: [{ colour: 'Nude', finish: 'nappa', hex: '#d8b8a0', sole: NUDE, heel: 'clear' }, { colour: 'Black', finish: 'nappa', hex: '#181818', sole: DARK, heel: 'clear' }],
  },
  lys: {
    name: 'Lys', line: 'Evening', style: 'Croc ankle-strap pump', cut: 'ankle', toe: 'almond', heel: 'stiletto', mm: 100, price: 39900,
    story: 'Croc-embossed calf with a deep gloss, an almond toe and a buckled ankle strap on a 100 mm stiletto.',
    ways: [{ colour: 'Bordeaux', finish: 'croc', hex: '#5a1a22', sole: DARK }, { colour: 'Black', finish: 'croc', hex: '#161616', sole: DARK }],
  },
  seraphine: {
    name: 'Séraphine', line: 'Bridal', style: 'Pearl bridal sandal', cut: 'sandal', toe: 'almond', heel: 'stiletto', mm: 100, trim: 'pearl', price: 46900, out: [41],
    story: 'A bridal sandal in ivory satin: a wide toe strap, a fine second strap and an ankle strap strung with freshwater pearls, on a 100 mm stiletto.',
    ways: [{ colour: 'Ivory', finish: 'satin', hex: '#f2ead9', sole: IVORY_SOLE }],
  },
  tamsin: {
    name: 'Tamsin', line: 'Day', style: 'Flared-heel slingback', cut: 'slingback', toe: 'almond', heel: 'flare', mm: 65, price: 25900,
    story: 'An almond-toe slingback on a 65 mm spool heel that flares at the foot: the office to dinner without changing.',
    ways: [{ colour: 'Olive', finish: 'nappa', hex: '#6a6844', sole: DARK }, { colour: 'Camel', finish: 'nappa', hex: '#b5864f', sole: DARK }],
  },
  calla: {
    name: 'Calla', line: 'Evening', style: 'Pencil-heel pump', cut: 'pump', toe: 'almond', heel: 'pencil', mm: 110, price: 34900,
    story: 'A tall almond pump on a pencil heel: straight, slender and 110 mm, the line unbroken from toe to tip.',
    ways: [{ colour: 'Scarlet', finish: 'suede', hex: '#951a22', sole: DARK }, { colour: 'Taupe', finish: 'suede', hex: '#8a796a', sole: DARK }],
  },
  vesper: {
    name: 'Vesper', line: 'Evening', style: 'Velvet evening sandal', cut: 'strappy', toe: 'almond', heel: 'stiletto', mm: 110, price: 42900, out: [40],
    story: 'Fine velvet straps over the toes and across the instep, a buckled ankle strap and a 110 mm stiletto: for black tie.',
    ways: [{ colour: 'Black', finish: 'velvet', hex: '#141313', sole: DARK }, { colour: 'Midnight', finish: 'velvet', hex: '#1b2340', sole: DARK }],
  },
  ottilie: {
    name: 'Ottilie', line: 'Day', style: 'Kitten-heel mule', cut: 'mule', toe: 'pointed', heel: 'kitten', mm: 40, price: 23900,
    story: 'A pointed mule in croc-embossed calf on a 40 mm kitten heel: slip it on and go.',
    ways: [{ colour: 'Ivory', finish: 'croc', hex: '#e7dfd1', sole: IVORY_SOLE }, { colour: 'Tan', finish: 'croc', hex: '#a2693a', sole: DARK }],
  },
  marguerite: {
    name: 'Marguerite', line: 'Day', style: 'Block-heel sandal', cut: 'sandal', toe: 'round', heel: 'block', mm: 80, price: 26900,
    story: 'A sandal on a covered 80 mm block heel: a broad toe strap, a fine one behind it and a buckled ankle strap.',
    ways: [{ colour: 'Black', finish: 'nappa', hex: '#181818', sole: DARK }, { colour: 'White', finish: 'nappa', hex: '#f1eee8', sole: IVORY_SOLE }, { colour: 'Sand', finish: 'nappa', hex: '#c9ab88', sole: NUDE }],
  },
  ines: {
    name: 'Inès', line: 'Day', style: 'Block-heel pump', cut: 'pump', toe: 'almond', heel: 'block', mm: 75, price: 28500,
    story: 'The formal pump: an almond toe, a clean topline and a 75 mm block heel for a full day standing.',
    ways: [{ colour: 'Black', finish: 'nappa', hex: '#161616', sole: DARK }, { colour: 'Navy', finish: 'nappa', hex: '#1f2a44', sole: DARK }, { colour: 'Taupe', finish: 'nappa', hex: '#8d7d6e', sole: DARK }],
  },
  bianca: {
    name: 'Bianca', line: 'Evening', style: 'Glitter platform sandal', cut: 'sandal', toe: 'almond', heel: 'stiletto', mm: 120, platform: 20, price: 39500,
    story: 'Party glitter on a 20 mm platform and a 120 mm stiletto, with a buckled ankle strap to keep it secure till the last dance.',
    ways: [{ colour: 'Silver', finish: 'glitter', hex: '#cfd3d8', sole: DARK }, { colour: 'Gold', finish: 'glitter', hex: '#d7b46e', sole: DARK }],
  },
  lucienne: {
    name: 'Lucienne', line: 'Atelier', style: 'Cap-toe slingback', cut: 'slingback', toe: 'pointed', heel: 'block', mm: 60, trim: 'toecap', price: 31500,
    story: 'A pointed slingback with a polished gold cap on the toe and a 60 mm block heel: tailored and quietly confident.',
    ways: [{ colour: 'Beige', finish: 'nappa', hex: '#d6c0a2', sole: DARK, heel: ['nappa', '#1a1a1a'] }, { colour: 'Black', finish: 'nappa', hex: '#171717', sole: DARK }],
  },
  delphine: {
    name: 'Delphine', line: 'Evening', style: 'Stiletto Mary Jane', cut: 'maryjane', toe: 'pointed', heel: 'stiletto', mm: 100, price: 35900,
    story: 'A Mary Jane made grown-up: patent leather, a pointed toe, a slim buckled strap and a 100 mm stiletto.',
    ways: [{ colour: 'Rouge', finish: 'patent', hex: '#991424', sole: DARK }, { colour: 'Noir', finish: 'patent', hex: '#131313', sole: DARK }],
  },
}

export type ModelKey = keyof typeof LINE

const FINISH_NAME: Record<Finish, string> = {
  nappa: 'nappa calfskin',
  patent: 'patent calfskin',
  suede: 'kid suede',
  satin: 'duchesse satin',
  metallic: 'laminated metallic calfskin',
  glitter: 'glitter fabric on leather',
  croc: 'croc-embossed calfskin',
  velvet: 'silk velvet',
  vinyl: 'clear vinyl',
}
const HEEL_NAME: Record<HeelShape, string> = {
  stiletto: 'stiletto', pencil: 'pencil heel', block: 'covered block heel', kitten: 'kitten heel', flare: 'flared spool heel', sculpted: 'sculpted gold heel', clear: 'clear acrylic heel', wedge: 'raffia-wrapped wedge',
}

export const rupees = (n: number) => `₹ ${n.toLocaleString('en-IN')}`
const SIZES = [35, 36, 37, 38, 39, 40, 41]

/** The spec a model in a colourway is built from. */
export function specOf(m: HeelMaterials, model: Model, way: Way): HeelSpec {
  const upper = m.leather(way.finish, way.hex)
  let heelMat: Material | undefined
  if (way.heel === 'gold') heelMat = m.kit.gold
  else if (way.heel === 'clear') heelMat = m.acrylic
  else if (way.heel) heelMat = m.leather(way.heel[0], way.heel[1])
  return {
    cut: model.cut, toe: model.toe, heel: model.heel, height: model.mm / 1000, platform: model.platform ? model.platform / 1000 : undefined,
    upper, heelMat, strap: way.strap ? m.leather(way.strap[0], way.strap[1]) : undefined, sole: m.sole(way.sole ?? DARK),
    trim: model.trim, trimMat: way.trim ? m.leather(way.trim[0], way.trim[1]) : undefined, metal: m.kit.gold,
  }
}

/* ---------- the bag ---------- */

interface Line {
  title: string
  size: number
  price: number
}
const bag: Line[] = []

/** What a shoe's card says, with its sizes and the button that puts a pair in the bag. */
export function shoeCard(model: Model, way: Way, inspect: () => import('three').Object3D, featured = false): Omit<EquipmentInfo, 'place'> {
  const title = `${model.name} ${model.mm} · ${way.colour}`
  const heel = way.heel === 'gold' ? 'sculpted brass heel in gold' : way.heel === 'clear' ? 'clear acrylic heel' : HEEL_NAME[model.heel]
  return {
    title,
    kind: `${model.style} · ${model.line === 'Atelier' ? 'Atelier line' : `${model.line} collection`}`,
    body: `${model.story} In ${way.colour.toLowerCase()} ${FINISH_NAME[way.finish]}, leather-lined, on a leather sole.${featured ? ' Tap it again to turn it in the light.' : ''} Drag the shoe to turn it; scroll or pinch to look closer.`,
    specs: [
      `Heel: ${heel}, ${model.mm} mm${model.platform ? ` with a ${model.platform} mm platform` : ''}`,
      `Toe: ${model.toe}`,
      `Upper: ${FINISH_NAME[way.finish]}${model.trim === 'crystal' ? ', crystal buckle' : model.trim === 'pearl' ? ', freshwater pearls' : model.trim === 'bow' ? ', satin bow' : model.trim === 'toecap' ? ', gold toe cap' : ''}`,
      `Colourways: ${model.ways.map((w) => w.colour).join(', ')}`,
      `Sizes: EU 35–41${model.out?.length ? ` (EU ${model.out.join(', ')} on order)` : ''}`,
      `${rupees(model.price)} · Made in Italy`,
    ],
    inspect,
    choices: { label: 'Size (EU)', options: SIZES.map(String), unavailable: (model.out ?? []).map(String) },
    action: {
      label: 'Add to bag',
      run: (size) => {
        if (!size) return 'Choose your size first.'
        bag.push({ title, size: Number(size), price: model.price })
        return `Added ${title}, EU ${size}. ${bag.length} ${bag.length === 1 ? 'pair' : 'pairs'} in your bag: pay at the counter.`
      },
    },
  }
}

/** The counter's card: the bag, its total, and paying. */
export function checkoutCard(): Omit<EquipmentInfo, 'place'> {
  const total = bag.reduce((a, l) => a + l.price, 0)
  return {
    title: 'The Counter',
    kind: `${HOUSE} · Checkout`,
    body: bag.length
      ? `Your bag holds ${bag.length} ${bag.length === 1 ? 'pair' : 'pairs'}. Each is brought from the stockroom in its box with dust bags, checked with you, then wrapped.`
      : 'Your bag is empty. Tap any shoe on the domes, the counter or the window, pick your size and add it to the bag; then pay here.',
    specs: bag.length ? [...bag.map((l) => `${l.title} · EU ${l.size} · ${rupees(l.price)}`), `Total ${rupees(total)} (incl. GST)`] : ['Cards, UPI and wallets', 'Complimentary gift wrapping', 'Exchanges within 14 days'],
    action: bag.length
      ? {
          label: `Pay ${rupees(total)}`,
          run: () => {
            const n = bag.length
            bag.length = 0
            return `Paid, thank you. ${n} ${n === 1 ? 'pair is' : 'pairs are'} being wrapped; your receipt is on its way by SMS.`
          },
        }
      : undefined,
  }
}
