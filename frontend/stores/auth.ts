import { defineStore } from 'pinia'

interface User {
  id: number
  email: string
  role: 'admin' | 'user'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as User | null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin'
  },

  actions: {
    init() {
      if (import.meta.client) {
        this.token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        if (userStr) {
          try { this.user = JSON.parse(userStr) } catch {}
        }
      }
    },

    setAuth(token: string, user: User) {
      this.token = token
      this.user = user
      if (import.meta.client) {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      }
    },

    logout() {
      this.token = null
      this.user = null
      if (import.meta.client) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }
})
