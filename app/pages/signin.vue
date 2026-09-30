<script setup lang="ts">
import type { PublicUser } from '#shared/account/types'
import UButton from '@nuxt/ui/components/Button.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { computed, onUnmounted, ref, watch } from 'vue'
import { NuxtLink } from '#components'
import { navigateTo, useHead, useRoute, useRuntimeConfig } from '#imports'
import { checkUsername, USERNAME_MAX } from '#shared/account/username'
import TurnstileWidget from '../components/TurnstileWidget.vue'
import { useAccount } from '../composables/useAccount'
import { apiErrorMessage, USERNAME_PROBLEMS } from '../utils/api-errors'

useHead({ title: 'Sign in · Tally' })

type Step = 'email' | 'code' | 'username'

const route = useRoute()
const { setUser } = useAccount()
const needsTurnstile = Boolean(useRuntimeConfig().public.turnstileSiteKey)

const step = ref<Step>('email')
const email = ref('')
const code = ref('')
const codeId = ref('')
const username = ref('')
const token = ref<string | null>(null)
const busy = ref(false)
const error = ref<string | null>(null)
const turnstile = ref<InstanceType<typeof TurnstileWidget> | null>(null)
const resendIn = ref(0)

// Only paths on this site; anything else lands on the hub.
const next = computed(() => {
  const target = route.query.next
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/'
})

const usernameProblem = computed(() => {
  const problem = username.value ? checkUsername(username.value) : null
  return problem ? USERNAME_PROBLEMS[problem] : null
})

let timer: ReturnType<typeof setInterval> | undefined
function startCountdown(seconds: number): void {
  resendIn.value = seconds
  clearInterval(timer)
  timer = setInterval(() => {
    if (--resendIn.value <= 0)
      clearInterval(timer)
  }, 1000)
}
onUnmounted(() => clearInterval(timer))

// Text typed before hydration is in the server-rendered box; read it now, before v-model resets the box to the empty state.
if (import.meta.client) {
  const typed = document.querySelector<HTMLInputElement>('main input[type=email]')?.value
  if (typed)
    email.value = typed
}

async function run(action: () => Promise<void>): Promise<void> {
  if (busy.value)
    return
  busy.value = true
  error.value = null
  try {
    await action()
  }
  catch (e) {
    error.value = apiErrorMessage(e)
  }
  finally {
    busy.value = false
  }
}

async function sendCode(): Promise<void> {
  await run(async () => {
    try {
      const result = await $fetch<{ codeId: string, devCode?: string }>('/api/auth/code', { method: 'POST', body: { email: email.value, turnstileToken: token.value ?? undefined } })
      codeId.value = result.codeId
      code.value = import.meta.dev && result.devCode ? result.devCode : ''
      step.value = 'code'
      startCountdown(60)
    }
    finally {
      turnstile.value?.reset()
    }
  })
  // A code that arrived already filled (dev) couldn't submit while the send was still busy.
  if (step.value === 'code' && /^\d{6}$/.test(code.value))
    await verify()
}

function verify(): Promise<void> {
  return run(async () => {
    const result = await $fetch<{ status: 'signed-in', user: PublicUser } | { status: 'needs-username' }>('/api/auth/verify', { method: 'POST', body: { codeId: codeId.value, code: code.value } })
    if (result.status === 'needs-username') {
      step.value = 'username'
      return
    }
    setUser(result.user)
    await navigateTo(next.value, { replace: true })
  })
}

function register(): Promise<void> {
  if (usernameProblem.value)
    return Promise.resolve()
  return run(async () => {
    const result = await $fetch<{ user: PublicUser }>('/api/auth/register', { method: 'POST', body: { username: username.value } })
    setUser(result.user)
    await navigateTo(next.value, { replace: true })
  })
}

function restart(): void {
  step.value = 'email'
  code.value = ''
  error.value = null
}

// Six digits is the whole code; no reason to make anyone press a button after typing it.
watch(code, (value) => {
  if (step.value === 'code' && /^\d{6}$/.test(value))
    verify()
})
</script>

<template>
  <main class="mx-auto max-w-md lg:pt-6">
    <header class="mb-6 grid grid-cols-[40px_1fr_40px] items-center lg:hidden">
      <NuxtLink to="/" class="grid size-10 place-items-center" aria-label="Back to Tally">
        <UIcon name="i-ph-caret-left" class="size-5.5" />
      </NuxtLink>
    </header>

    <form v-if="step === 'email'" class="grid gap-5" @submit.prevent="sendCode">
      <div>
        <h1 class="text-[32px] leading-tight font-normal tracking-[-0.015em]">
          Sign in
        </h1>
        <p class="mt-2 text-[17px] text-muted">
          New here? The same steps make your account.
        </p>
      </div>
      <UFormField label="Email" help="We send a 6-digit code. Tally keeps no copy of your address." size="xl">
        <UInput v-model="email" type="email" autocomplete="email" inputmode="email" required autofocus class="w-full" />
      </UFormField>
      <p v-if="error" class="text-error" role="alert">
        {{ error }}
      </p>
      <UButton type="submit" size="xl" block class="font-sans text-[17px]" :loading="busy" :disabled="!email || (needsTurnstile && !token)">
        Send code
      </UButton>
    </form>

    <form v-else-if="step === 'code'" class="grid gap-5" @submit.prevent="verify">
      <div>
        <h1 class="text-[32px] leading-tight font-normal tracking-[-0.015em]">
          Check your email
        </h1>
        <p class="mt-2 text-[17px] text-muted">
          We sent a code to <span class="text-default">{{ email }}</span>.
        </p>
      </div>
      <UFormField label="Code" size="xl">
        <UInput v-model="code" autocomplete="one-time-code" inputmode="numeric" maxlength="6" pattern="\d{6}" required autofocus class="w-full font-mono tracking-[0.3em]" />
      </UFormField>
      <p v-if="error" class="text-error" role="alert">
        {{ error }}
      </p>
      <UButton type="submit" size="xl" block class="font-sans text-[17px]" :loading="busy" :disabled="code.length !== 6">
        Continue
      </UButton>
      <div class="flex justify-between text-[15px]">
        <button type="button" class="text-muted underline underline-offset-3" @click="restart">
          Use another email
        </button>
        <button type="button" class="underline underline-offset-3 disabled:text-muted disabled:no-underline" :disabled="resendIn > 0 || busy || (needsTurnstile && !token)" @click="sendCode">
          {{ resendIn > 0 ? `New code in ${resendIn}s` : 'Send a new code' }}
        </button>
      </div>
    </form>

    <form v-else class="grid gap-5" @submit.prevent="register">
      <div>
        <h1 class="text-[32px] leading-tight font-normal tracking-[-0.015em]">
          Pick a username
        </h1>
        <p class="mt-2 text-[17px] text-muted">
          Letters and numbers, 3 to 20 of them. Other players see it on the daily boards.
        </p>
      </div>
      <UFormField label="Username" size="xl" :error="usernameProblem ?? undefined">
        <UInput v-model="username" autocomplete="username" :maxlength="USERNAME_MAX" required autofocus class="w-full" />
      </UFormField>
      <p v-if="error" class="text-error" role="alert">
        {{ error }}
      </p>
      <UButton type="submit" size="xl" block class="font-sans text-[17px]" :loading="busy" :disabled="!username || Boolean(usernameProblem)">
        Create account
      </UButton>
    </form>

    <!-- One widget for both steps: resending a code needs a fresh token, and a widget rebuilt while hidden may never finish. -->
    <TurnstileWidget v-show="step !== 'username'" ref="turnstile" v-model="token" class="mt-5" />
  </main>
</template>
