<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useTasksStore, type Task } from '~/stores/tasks'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const tasksStore = useTasksStore()
const router = useRouter()

const search = ref('')
const searchDebounce = ref('')
const sort = ref('created_at')
const order = ref('desc')
const statusFilter = ref('')
const currentPage = ref(1)

const showTaskModal = ref(false)
const editingTask = ref<Task | null>(null)

const showConfirm = ref(false)
const deletingTask = ref<Task | null>(null)
const deleteLoading = ref(false)

let debounceTimer: ReturnType<typeof setTimeout>
watch(search, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchDebounce.value = val
    currentPage.value = 1
  }, 300)
})

watch([sort, order, statusFilter, searchDebounce, currentPage], loadTasks)

onMounted(() => {
  authStore.init()
  loadTasks()
})

async function loadTasks() {
  await tasksStore.fetchTasks({
    sort: sort.value,
    order: order.value,
    search: searchDebounce.value,
    status: statusFilter.value,
    page: currentPage.value,
    limit: 8
  })
}

function canEdit(task: Task) {
  return authStore.isAdmin || task.user_id === authStore.user?.id
}

function openCreate() {
  editingTask.value = null
  showTaskModal.value = true
}

function openEdit(task: Task) {
  editingTask.value = task
  showTaskModal.value = true
}

function openDelete(task: Task) {
  deletingTask.value = task
  showConfirm.value = true
}

async function handleTaskSubmit(payload: Partial<Task>) {
  if (editingTask.value) {
    await tasksStore.updateTask(editingTask.value.id, payload)
  } else {
    await tasksStore.createTask(payload)
  }
  showTaskModal.value = false
}

async function handleDelete() {
  if (!deletingTask.value) return
  deleteLoading.value = true
  try {
    await tasksStore.deleteTask(deletingTask.value.id)
    showConfirm.value = false
    deletingTask.value = null
  } catch {} finally {
    deleteLoading.value = false
  }
}

async function toggleComplete(task: Task) {
  if (!canEdit(task)) return
  await tasksStore.updateTask(task.id, { is_completed: !task.is_completed })
}

function logout() {
  authStore.logout()
  router.push('/login')
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isOverdue(task: Task) {
  if (!task.due_date || task.is_completed) return false
  return new Date(task.due_date) < new Date()
}

const pagination = computed(() => tasksStore.pagination)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12l2 2 4-4"/>
          </svg>
          <span class="font-bold text-gray-900">ToDo App</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500 hidden sm:block">
            {{ authStore.user?.email }}
            <span v-if="authStore.isAdmin" class="ml-1 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">admin</span>
          </span>
          <button @click="logout" class="text-sm text-gray-500 hover:text-red-600 transition flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Выйти
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-6">
      <!-- Controls -->
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <!-- Search -->
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Поиск задач..."
            class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
        </div>

        <!-- Sort -->
        <select
          v-model="sort"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="created_at">По дате создания</option>
          <option value="due_date">По дедлайну</option>
          <option value="title">По заголовку</option>
          <option value="is_completed">По статусу</option>
        </select>

        <button
          @click="order = order === 'asc' ? 'desc' : 'asc'"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50 transition flex items-center gap-1"
        >
          <svg class="w-4 h-4 transition-transform" :class="order === 'asc' ? '' : 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
          </svg>
          {{ order === 'asc' ? 'По возрастанию' : 'По убыванию' }}
        </button>

        <!-- Filter by status -->
        <div class="flex gap-1">
          <button
            v-for="f in [{ value: '', label: 'Все' }, { value: 'active', label: 'Активные' }, { value: 'completed', label: 'Готовые' }]"
            :key="f.value"
            @click="statusFilter = f.value; currentPage = 1"
            class="px-3 py-2 rounded-lg text-sm font-medium transition"
            :class="statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'"
          >
            {{ f.label }}
          </button>
        </div>

        <button
          @click="openCreate"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 whitespace-nowrap"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Добавить
        </button>
      </div>

      <!-- Error -->
      <div v-if="tasksStore.error" class="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        {{ tasksStore.error }}
      </div>

      <!-- Loading skeletons -->
      <div v-if="tasksStore.loading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div class="flex items-start gap-3">
            <div class="w-5 h-5 bg-gray-200 rounded mt-0.5"/>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 rounded w-1/3"/>
              <div class="h-3 bg-gray-100 rounded w-2/3"/>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks list -->
      <div v-else-if="tasksStore.tasks.length" class="space-y-3">
        <div
          v-for="task in tasksStore.tasks"
          :key="task.id"
          class="bg-white rounded-xl border transition hover:shadow-md"
          :class="task.is_completed ? 'border-green-100 opacity-75' : isOverdue(task) ? 'border-red-200' : 'border-gray-200'"
        >
          <div class="p-4 flex items-start gap-3">
            <!-- Checkbox -->
            <button
              @click="toggleComplete(task)"
              :disabled="!canEdit(task)"
              class="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition"
              :class="task.is_completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-indigo-400 disabled:cursor-default'"
            >
              <svg v-if="task.is_completed" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </button>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <h3
                  class="font-medium text-gray-900 leading-snug"
                  :class="{ 'line-through text-gray-400': task.is_completed }"
                >
                  {{ task.title }}
                </h3>
                <div v-if="canEdit(task)" class="flex gap-1 flex-shrink-0">
                  <button
                    @click="openEdit(task)"
                    class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Редактировать"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    @click="openDelete(task)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Удалить"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>

              <p v-if="task.description" class="text-sm text-gray-500 mt-0.5 line-clamp-2">{{ task.description }}</p>

              <div class="flex items-center gap-3 mt-2 flex-wrap">
                <span
                  class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="task.is_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="task.is_completed ? 'bg-green-500' : 'bg-yellow-500'"/>
                  {{ task.is_completed ? 'Выполнена' : 'В работе' }}
                </span>

                <span
                  v-if="task.due_date"
                  class="text-xs flex items-center gap-1"
                  :class="isOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-400'"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {{ formatDate(task.due_date) }}
                  <span v-if="isOverdue(task)">(просрочена)</span>
                </span>

                <span v-if="authStore.isAdmin" class="text-xs text-gray-400">{{ task.user_email }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-16">
        <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <p class="text-gray-500 font-medium">
          {{ search ? 'Нет результатов по поиску' : 'Задач пока нет' }}
        </p>
        <p class="text-gray-400 text-sm mt-1">
          {{ search ? 'Попробуйте изменить запрос' : 'Нажмите «Добавить», чтобы создать первую задачу' }}
        </p>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.pages > 1" class="flex items-center justify-center gap-2 mt-6">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
        >
          ←
        </button>
        <button
          v-for="p in pagination.pages"
          :key="p"
          @click="currentPage = p"
          class="px-3 py-1.5 border rounded-lg text-sm transition"
          :class="currentPage === p ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'"
        >
          {{ p }}
        </button>
        <button
          @click="currentPage++"
          :disabled="currentPage === pagination.pages"
          class="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
        >
          →
        </button>
      </div>

      <!-- Summary -->
      <p v-if="pagination" class="text-center text-xs text-gray-400 mt-3">
        Показано {{ tasksStore.tasks.length }} из {{ pagination.total }} задач
      </p>
    </main>

    <!-- Modals -->
    <TaskModal
      :open="showTaskModal"
      :task="editingTask"
      :submit-handler="handleTaskSubmit"
      @close="showTaskModal = false"
    />

    <ConfirmModal
      :open="showConfirm"
      title="Удалить задачу?"
      :message="`Задача «${deletingTask?.title}» будет удалена безвозвратно.`"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @cancel="showConfirm = false; deletingTask = null"
    />
  </div>
</template>
