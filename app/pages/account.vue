<script setup lang="ts">
import type { PublicUser } from '#shared/account/types'
import UButton from '@nuxt/ui/components/Button.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { computed, ref, watch } from 'vue'
import { NuxtLink } from '#components'
import { navigateTo, useFetch, useHead } from '#imports'
import { checkUsername, USERNAME_MAX } from '#shared/account/username'
import { useAccount } from '../composables/useAccount'
import { apiErrorMessage, formatDay, USERNAME_PROBLEMS } from '../utils/api-errors'

useHead({ title: 'Account · Tally' })

const { setUser, signOut } = useAccount()
const { data, status, error: loadError } = useFetch<{ user: PublicUser }>('/api/account', { lazy: true })

const account = computed(() => data.value?.user ?? null)
const name = ref('')
const busy = ref(false)
const message = ref<string | null>(null)
const confirmingDelete = ref(false)

watch(account, (user) => {
  if (user)
    name.value = user.username
}, { immediate: true })

watch(loadError, (e) => {
  if (e?.statusCode === 401)
    navigateTo('/signin?next=/account', { replace: true })
})

const nameProblem = computed(() => {
  const problem = name.value ? checkUsername(name.value) : null
  return problem ? USERNAME_PROBLEMS[problem] : null
})

const canRename = computed(() => Boolean(account.value && !account.value.renameAvailableAt && name.value !== account.value.username && !nameProblem.value))

async function rename(): Promise<void> {
  if (!canRename.value || busy.value)
    return
  busy.value = true
  message.value = null
  try {
    const result = await $fetch<{ user: PublicUser }>('/api/account', { method: 'PATCH', body: { username: name.value } })
    data.value = result
    setUser(result.user)
    message.value = 'Saved.'
  }
  catch (e) {
    message.value = apiErrorMessage(e)
  }
  finally {
    busy.value = false
  }
}

async function leave(): Promise<void> {
  await signOut()
  await navigateTo('/')
}

async function deleteAccount(): Promise<void> {
  busy.value = true
  try {
    await $fetch('/api/account', { method: 'DELETE' })
    setUser(null)
    await navigateTo('/', { replace: true })
  }
  catch (e) {
    message.value = apiErrorMessage(e)
    busy.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-md">
    <header class="mb-5 grid grid-cols-[40px_1fr_40px] items-center lg:mb-8 lg:block">
      <NuxtLink to="/" class="grid size-10 place-items-center lg:hidden" aria-label="Back to Tally">
        <UIcon name="i-ph-caret-left" class="size-5.5" />
      </NuxtLink>
      <h1 class="text-center text-xl font-medium lg:text-left lg:text-[34px] lg:font-normal lg:tracking-[-0.015em]">
        Account
      </h1>
    </header>

    <div v-if="status === 'pending' && !account" class="h-40 animate-pulse rounded-[10px] border border-default bg-surface" aria-label="Loading your account" />

    <template v-else-if="account">
      <section class="mb-6">
        <p class="font-serif text-[32px] leading-tight italic">
          {{ account.username }}
        </p>
        <p class="mt-1 text-[15px] text-muted">
          Playing since {{ formatDay(account.createdAt) }}
        </p>
      </section>

      <form class="grid gap-3" @submit.prevent="rename">
        <UFormField
          label="Username"
          size="xl"
          :error="nameProblem ?? undefined"
          :help="account.renameAvailableAt ? `You can change it again on ${formatDay(account.renameAvailableAt)}.` : 'You can change it once every 30 days.'"
        >
          <UInput v-model="name" autocomplete="username" :maxlength="USERNAME_MAX" :disabled="Boolean(account.renameAvailableAt)" class="w-full" />
        </UFormField>
        <p v-if="message" class="text-[15px]" :class="message === 'Saved.' ? 'text-muted' : 'text-error'" role="status">
          {{ message }}
        </p>
        <UButton type="submit" size="xl" block class="font-sans text-[17px]" :loading="busy" :disabled="!canRename">
          Save username
        </UButton>
      </form>

      <section class="mt-8 grid gap-3 border-t border-default pt-6">
        <UButton size="xl" block variant="outline" color="neutral" class="font-sans text-[17px]" @click="leave">
          Sign out
        </UButton>
        <UButton v-if="!confirmingDelete" size="xl" block variant="ghost" color="error" class="font-sans text-[17px]" @click="confirmingDelete = true">
          Delete account
        </UButton>
        <div v-else class="grid gap-3 rounded-[10px] border border-default bg-surface p-4">
          <p class="font-serif text-[16px]">
            This deletes your account and frees your username. Puzzles saved in this browser stay.
          </p>
          <UButton size="xl" block color="error" class="font-sans text-[17px]" :loading="busy" @click="deleteAccount">
            Delete for good
          </UButton>
          <UButton size="xl" block variant="ghost" color="neutral" class="font-sans text-[17px]" @click="confirmingDelete = false">
            Keep it
          </UButton>
        </div>
      </section>
    </template>

    <p v-else-if="loadError && loadError.statusCode !== 401" class="font-serif text-[17px]">
      Your account didn't load. Check your connection and try again.
    </p>
  </main>
</template>
