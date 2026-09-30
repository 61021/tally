export type ColorSetId = 'steel' | 'moonlight' | 'cobalt' | 'tangerine'

export type Mode = 'system' | 'light' | 'dark' | 'oled'

export interface Appearance {
  colors: ColorSetId
  mode: Mode
}

export interface ColorSet {
  id: ColorSetId
  name: string
  /** Page background per mode, for the browser's theme-color. */
  themeColor: Record<ResolvedMode, string>
  /** Accent per mode, for the swatch in settings. */
  accent: Record<ResolvedMode, string>
}

export type ResolvedMode = Exclude<Mode, 'system'>
