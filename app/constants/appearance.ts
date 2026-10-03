import type { Appearance, Mode, Scene } from '../types/appearance'

export const SCENES: readonly Scene[] = [
  {
    id: 'dusk',
    name: 'Dusk',
    painting: { title: 'Andersnatten', artist: 'Theodor Kittelsen', year: null, source: 'https://commons.wikimedia.org/wiki/File:Th._Kittelsen,_Andersnatten,_postkort.jpg' },
    focus: '62% 38%',
    themeColor: { light: '#e9e6dc', dark: '#0e1622', oled: '#000000' },
  },
  {
    id: 'soria',
    name: 'Soria Moria',
    painting: { title: 'Soria Moria', artist: 'Theodor Kittelsen', year: '1900', source: 'https://commons.wikimedia.org/wiki/File:Theodor_Kittelsen_-_Far,_far_away_Soria_Moria_Palace_shimmered_like_Gold_-_Google_Art_Project.jpg' },
    focus: '46% 55%',
    themeColor: { light: '#e1e6f0', dark: '#0e1622', oled: '#000000' },
  },
  {
    id: 'haystacks',
    name: 'Haystacks',
    painting: { title: 'Kornstaur i måneskinn', artist: 'Theodor Kittelsen', year: null, source: 'https://commons.wikimedia.org/wiki/File:Th._Kittelsen,_Kornstaur_i_m%C3%A5neskinn,_postkort.jpg' },
    focus: '40% 45%',
    themeColor: { light: '#dfe9e1', dark: '#0e1622', oled: '#000000' },
  },
  {
    id: 'marsh',
    name: 'Marsh',
    painting: { title: 'The Twelve Wild Ducks', artist: 'Theodor Kittelsen', year: '1897', source: 'https://commons.wikimedia.org/wiki/File:Theodor_Kittelsen_-_The_twelve_Wild_Ducks_-_Google_Art_Project.jpg' },
    focus: '70% 30%',
    themeColor: { light: '#d8ece2', dark: '#0c1914', oled: '#000000' },
  },
]

/** Widths each painting is encoded at in public/scenes, as AVIF. */
export const SCENE_WIDTHS: readonly number[] = [1280, 1920, 2560]

export const MODES: readonly { id: Mode, name: string }[] = [
  { id: 'system', name: 'System' },
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'oled', name: 'OLED' },
]

export const DEFAULT_APPEARANCE: Appearance = { scene: 'soria', mode: 'dark' }

export const APPEARANCE_COOKIE = 'tally-appearance'

/** A little over a year; browsers cap cookie lifetime at 400 days. */
export const APPEARANCE_MAX_AGE = 60 * 60 * 24 * 400
