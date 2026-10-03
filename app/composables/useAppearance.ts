import type { Ref } from 'vue'
import type { Appearance, Mode, Scene, SceneId } from '../types/appearance'
import { useCookie, useState } from '#imports'
import { APPEARANCE_COOKIE, APPEARANCE_MAX_AGE, DEFAULT_APPEARANCE, MODES, SCENES } from '../constants/appearance'

export interface UseAppearance {
  appearance: Readonly<Ref<Appearance>>
  scene: () => Scene
  setScene: (scene: SceneId) => void
  setMode: (mode: Mode) => void
}

// Cookies from before the scenes carry a color set instead; they keep their mode and get the default scene.
function sanitize(value: Partial<Appearance> | null | undefined): Appearance {
  return {
    scene: SCENES.some(s => s.id === value?.scene) ? value!.scene! : DEFAULT_APPEARANCE.scene,
    mode: MODES.some(m => m.id === value?.mode) ? value!.mode! : DEFAULT_APPEARANCE.mode,
  }
}

export function useAppearance(): UseAppearance {
  // A cookie rather than localStorage, so the server renders the right theme and nothing flashes.
  const cookie = useCookie<Partial<Appearance> | null>(APPEARANCE_COOKIE, { maxAge: APPEARANCE_MAX_AGE, sameSite: 'lax' })
  const appearance = useState<Appearance>('appearance', () => sanitize(cookie.value))

  function update(next: Appearance): void {
    appearance.value = next
    cookie.value = next
  }

  return {
    appearance,
    scene: () => SCENES.find(s => s.id === appearance.value.scene)!,
    setScene: scene => update({ ...appearance.value, scene }),
    setMode: mode => update({ ...appearance.value, mode }),
  }
}
