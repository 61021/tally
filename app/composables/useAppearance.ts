import type { Ref } from 'vue'
import type { Appearance, ColorSet, ColorSetId, Mode } from '../types/appearance'
import { useCookie, useState } from '#imports'
import { APPEARANCE_COOKIE, APPEARANCE_MAX_AGE, COLOR_SETS, DEFAULT_APPEARANCE, MODES } from '../constants/appearance'

export interface UseAppearance {
  appearance: Readonly<Ref<Appearance>>
  colorSet: () => ColorSet
  setColors: (colors: ColorSetId) => void
  setMode: (mode: Mode) => void
}

function sanitize(value: Partial<Appearance> | null | undefined): Appearance {
  return {
    colors: COLOR_SETS.some(c => c.id === value?.colors) ? value!.colors! : DEFAULT_APPEARANCE.colors,
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
    colorSet: () => COLOR_SETS.find(c => c.id === appearance.value.colors)!,
    setColors: colors => update({ ...appearance.value, colors }),
    setMode: mode => update({ ...appearance.value, mode }),
  }
}
