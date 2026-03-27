<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: [] })

const config = useRuntimeConfig()
const authStore = useAuthStore()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '', general: '' })
const loading = ref(false)

onMounted(() => {
  authStore.init()
  if (authStore.isAuthenticated) router.replace('/')
})

function validate() {
  errors.email = ''
  errors.password = ''
  let valid = true
  if (!form.email.trim()) {
    errors.email = 'Email обязателен'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Некорректный email'
    valid = false
  }
  if (!form.password) {
    errors.password = 'Пароль обязателен'
    valid = false
  }
  return valid
}

async function handleLogin() {
  if (!validate()) return
  loading.value = true
  errors.general = ''
  try {
    const res = await fetch(`${config.public.apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, password: form.password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Ошибка входа')
    authStore.setAuth(data.token, data.user)
    router.push('/')
  } catch (e: any) {
    errors.general = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-2xl mb-4">
          <svg class="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">ToDo App</h1>
        <p class="text-gray-500 mt-1 text-sm">Войдите в свой аккаунт</p>
      </div>

      <div v-if="errors.general" class="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        {{ errors.general }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="admin@todo.com"
            class="w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
            :class="errors.email ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'"
          />
          <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
            :class="errors.password ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'"
          />
          <p v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>

      <div class="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
        <p class="font-medium text-gray-600">Тестовые аккаунты:</p>
        <p>admin@todo.com / admin123 (администратор)</p>
        <p>user@todo.com / user123 (пользователь)</p>
      </div>
    </div>
  </div>
</template>
