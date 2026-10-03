export type SceneId = 'dusk' | 'soria' | 'haystacks' | 'marsh'

export type Mode = 'system' | 'light' | 'dark' | 'oled'

export interface Appearance {
  scene: SceneId
  mode: Mode
}

export interface Painting {
  title: string
  artist: string
  year: string | null
  /** The public-domain file on Wikimedia Commons. */
  source: string
}

export interface Scene {
  id: SceneId
  name: string
  painting: Painting
  /** object-position for the painting: x picks the crop on a phone, y on a laptop. */
  focus: string
  /** Page background per mode, for the browser's theme-color. */
  themeColor: Record<ResolvedMode, string>
}

export type ResolvedMode = Exclude<Mode, 'system'>
