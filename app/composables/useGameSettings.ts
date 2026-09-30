import type { Ref } from 'vue'
import type { GameSettings } from '../types/settings'
import { useCookie, useState } from '#imports'
import { APPEARANCE_MAX_AGE } from '../constants/appearance'
import { DEFAULT_SETTINGS, MISTAKE_MODES, SETTINGS_COOKIE } from '../constants/settings'

export interface UseGameSettings {
  settings: Readonly<Ref<GameSettings>>
  update: (patch: Partial<GameSettings>) => void
}

function sanitize(value: Partial<GameSettings> | null | undefined): GameSettings {
  return {
    mistakes: MISTAKE_MODES.some(m => m.id === value?.mistakes) ? value!.mistakes! : DEFAULT_SETTINGS.mistakes,
    highlightSame: typeof value?.highlightSame === 'boolean' ? value.highlightSame : DEFAULT_SETTINGS.highlightSame,
    showTimer: typeof value?.showTimer === 'boolean' ? value.showTimer : DEFAULT_SETTINGS.showTimer,
  }
}

export function useGameSettings(): UseGameSettings {
  const cookie = useCookie<Partial<GameSettings> | null>(SETTINGS_COOKIE, { maxAge: APPEARANCE_MAX_AGE, sameSite: 'lax' })
  const settings = useState<GameSettings>('game-settings', () => sanitize(cookie.value))
  return {
    settings,
    update(patch) {
      settings.value = { ...settings.value, ...patch }
      cookie.value = settings.value
    },
  }
}
