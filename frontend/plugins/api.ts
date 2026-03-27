import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const api = async (path: string, options: RequestInit & { body?: any } = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }

    const res = await fetch(`${config.public.apiBase}${path}`, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    })

    if (res.status === 401) {
      authStore.logout()
      await navigateTo('/login')
      throw new Error('Не авторизован')
    }

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const err: any = new Error(data?.message || `Ошибка ${res.status}`)
      err.data = data
      err.status = res.status
      throw err
    }

    return data
  }

  return {
    provide: { api }
  }
})
