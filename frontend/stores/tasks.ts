import { defineStore } from 'pinia'

export interface Task {
  id: number
  title: string
  description: string
  due_date: string | null
  is_completed: boolean
  user_id: number
  user_email: string
  created_at: string
  updated_at: string
}

export interface TasksQuery {
  sort?: string
  order?: string
  search?: string
  status?: string
  page?: number
  limit?: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [] as Task[],
    pagination: null as Pagination | null,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchTasks(query: TasksQuery = {}) {
      const { $api } = useNuxtApp() as any
      this.loading = true
      this.error = null
      try {
        const params = new URLSearchParams()
        if (query.sort) params.set('sort', query.sort)
        if (query.order) params.set('order', query.order)
        if (query.search) params.set('search', query.search)
        if (query.status) params.set('status', query.status)
        if (query.page) params.set('page', String(query.page))
        if (query.limit) params.set('limit', String(query.limit))

        const data = await $api(`/tasks?${params.toString()}`)
        this.tasks = data.data
        this.pagination = data.pagination
      } catch (e: any) {
        this.error = e.message || 'Ошибка загрузки задач'
      } finally {
        this.loading = false
      }
    },

    async createTask(payload: Partial<Task>) {
      const { $api } = useNuxtApp() as any
      this.loading = true
      this.error = null
      try {
        const task = await $api('/tasks', { method: 'POST', body: payload })
        this.tasks.unshift(task)
        if (this.pagination) this.pagination.total++
        return task
      } catch (e: any) {
        this.error = e.data?.message || e.message || 'Ошибка создания задачи'
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateTask(id: number, payload: Partial<Task>) {
      const { $api } = useNuxtApp() as any
      this.loading = true
      this.error = null
      try {
        const updated = await $api(`/tasks/${id}`, { method: 'PUT', body: payload })
        const idx = this.tasks.findIndex(t => t.id === id)
        if (idx !== -1) this.tasks[idx] = updated
        return updated
      } catch (e: any) {
        this.error = e.data?.message || e.message || 'Ошибка обновления задачи'
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteTask(id: number) {
      const { $api } = useNuxtApp() as any
      this.loading = true
      this.error = null
      try {
        await $api(`/tasks/${id}`, { method: 'DELETE' })
        this.tasks = this.tasks.filter(t => t.id !== id)
        if (this.pagination) this.pagination.total--
      } catch (e: any) {
        this.error = e.data?.message || e.message || 'Ошибка удаления задачи'
        throw e
      } finally {
        this.loading = false
      }
    }
  }
})
