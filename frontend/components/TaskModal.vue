<script setup lang="ts">
import type { Task } from '~/stores/tasks'

const props = defineProps<{
  open: boolean
  task?: Task | null
  submitHandler: (payload: Partial<Task>) => Promise<void>
}>()

const emit = defineEmits<{
  close: []
}>()

const form = reactive({
  title: '',
  description: '',
  due_date: '',
  is_completed: false
})

const fieldErrors = reactive({ title: '', due_date: '' })
const apiError = ref('')
const submitting = ref(false)

watch(() => props.open, (val) => {
  if (val) {
    form.title = props.task?.title ?? ''
    form.description = props.task?.description ?? ''
    form.due_date = props.task?.due_date ? props.task.due_date.slice(0, 10) : ''
    form.is_completed = props.task?.is_completed ?? false
    fieldErrors.title = ''
    fieldErrors.due_date = ''
    apiError.value = ''
  }
})

function validate() {
  fieldErrors.title = ''
  fieldErrors.due_date = ''
  let valid = true
  if (!form.title.trim()) {
    fieldErrors.title = 'Заголовок обязателен'
    valid = false
  }
  if (form.due_date && isNaN(Date.parse(form.due_date))) {
    fieldErrors.due_date = 'Некорректная дата'
    valid = false
  }
  return valid
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  apiError.value = ''
  try {
    await props.submitHandler({
      title: form.title.trim(),
      description: form.description,
      due_date: form.due_date || null,
      is_completed: form.is_completed
    })
  } catch (e: any) {
    apiError.value = e.data?.message || e.message || 'Произошла ошибка, попробуйте снова'
  } finally {
    submitting.value = false
  }
}

function handleOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="modal-overlay fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click="handleOverlayClick"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div class="flex items-center justify-between p-6 border-b">
            <h2 class="text-lg font-semibold text-gray-900">
              {{ task ? 'Редактировать задачу' : 'Новая задача' }}
            </h2>
            <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
            <div v-if="apiError" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
              {{ apiError }}
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Заголовок *</label>
              <input
                v-model="form.title"
                type="text"
                placeholder="Название задачи"
                class="w-full border rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
                :class="fieldErrors.title ? 'border-red-400' : 'border-gray-300'"
              />
              <p v-if="fieldErrors.title" class="text-red-500 text-xs mt-1">{{ fieldErrors.title }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Описание задачи (необязательно)"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Дедлайн</label>
              <input
                v-model="form.due_date"
                type="date"
                class="w-full border rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-400"
                :class="fieldErrors.due_date ? 'border-red-400' : 'border-gray-300'"
              />
              <p v-if="fieldErrors.due_date" class="text-red-500 text-xs mt-1">{{ fieldErrors.due_date }}</p>
            </div>

            <div class="flex items-center gap-2">
              <input
                id="is_completed"
                v-model="form.is_completed"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
              />
              <label for="is_completed" class="text-sm text-gray-700">Выполнена</label>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="emit('close')"
                class="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <svg v-if="submitting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ task ? 'Сохранить' : 'Создать' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
