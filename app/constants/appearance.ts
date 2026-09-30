import type { Appearance, ColorSet, Mode } from '../types/appearance'

export const COLOR_SETS: readonly ColorSet[] = [
  { id: 'steel', name: 'Steel', themeColor: { light: '#e8eaec', dark: '#111315', oled: '#000000' }, accent: { light: '#44596f', dark: '#9fb3c8', oled: '#9fb3c8' } },
  { id: 'moonlight', name: 'Moonlight', themeColor: { light: '#e3e8ef', dark: '#0c1220', oled: '#000000' }, accent: { light: '#e5c25a', dark: '#f0d27c', oled: '#f0d27c' } },
  { id: 'cobalt', name: 'Cobalt Snow', themeColor: { light: '#edf1f7', dark: '#081026', oled: '#000000' }, accent: { light: '#0047ab', dark: '#5b8cff', oled: '#5b8cff' } },
  { id: 'tangerine', name: 'Tangerine + Ink', themeColor: { light: '#eef0f2', dark: '#0b0f19', oled: '#000000' }, accent: { light: '#f26b1d', dark: '#ff8a3d', oled: '#ff8a3d' } },
]

export const MODES: readonly { id: Mode, name: string }[] = [
  { id: 'system', name: 'System' },
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'oled', name: 'OLED' },
]

export const DEFAULT_APPEARANCE: Appearance = { colors: 'steel', mode: 'system' }

export const APPEARANCE_COOKIE = 'tally-appearance'

/** A little over a year; browsers cap cookie lifetime at 400 days. */
export const APPEARANCE_MAX_AGE = 60 * 60 * 24 * 400
