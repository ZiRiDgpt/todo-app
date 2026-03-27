const express = require('express')
const { db, nextId } = require('../db')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware)

// GET /api/tasks
router.get('/', (req, res) => {
  const { sort = 'created_at', order = 'desc', search = '', status, page = 1, limit = 10 } = req.query

  let tasks = db.get('tasks').value()

  if (req.user.role !== 'admin') {
    tasks = tasks.filter(t => t.user_id === req.user.id)
  }

  if (search.trim()) {
    const q = search.toLowerCase()
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    )
  }

  if (status === 'completed') tasks = tasks.filter(t => t.is_completed)
  else if (status === 'active') tasks = tasks.filter(t => !t.is_completed)

  const allowedSorts = ['created_at', 'due_date', 'title', 'is_completed']
  const sortCol = allowedSorts.includes(sort) ? sort : 'created_at'
  tasks = [...tasks].sort((a, b) => {
    const av = a[sortCol] ?? ''
    const bv = b[sortCol] ?? ''
    if (av < bv) return order === 'asc' ? -1 : 1
    if (av > bv) return order === 'asc' ? 1 : -1
    return 0
  })

  const total = tasks.length
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
  const paged = tasks.slice((pageNum - 1) * limitNum, pageNum * limitNum)

  const users = db.get('users').value()
  const withEmail = paged.map(t => ({
    ...t,
    user_email: users.find(u => u.id === t.user_id)?.email || ''
  }))

  res.json({
    data: withEmail,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1
    }
  })
})

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = db.get('tasks').find({ id: parseInt(req.params.id) }).value()
  if (!task) return res.status(404).json({ message: 'Задача не найдена' })
  if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Нет доступа' })
  }
  const user = db.get('users').find({ id: task.user_id }).value()
  res.json({ ...task, user_email: user?.email || '' })
})

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description = '', due_date, is_completed = false } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Заголовок обязателен' })
  }
  if (due_date && isNaN(Date.parse(due_date))) {
    return res.status(400).json({ message: 'Некорректная дата дедлайна' })
  }

  const id = nextId('task')
  const now = new Date().toISOString()
  const task = {
    id,
    title: title.trim(),
    description,
    due_date: due_date || null,
    is_completed: Boolean(is_completed),
    user_id: req.user.id,
    created_at: now,
    updated_at: now
  }

  db.get('tasks').push(task).write()
  const user = db.get('users').find({ id: req.user.id }).value()
  res.status(201).json({ ...task, user_email: user?.email || '' })
})

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const task = db.get('tasks').find({ id: parseInt(req.params.id) }).value()
  if (!task) return res.status(404).json({ message: 'Задача не найдена' })
  if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Нет доступа к редактированию' })
  }

  const { title, description, due_date, is_completed } = req.body

  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ message: 'Заголовок не может быть пустым' })
  }
  if (due_date !== undefined && due_date && isNaN(Date.parse(due_date))) {
    return res.status(400).json({ message: 'Некорректная дата дедлайна' })
  }

  const updates = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title.trim()
  if (description !== undefined) updates.description = description
  if (due_date !== undefined) updates.due_date = due_date || null
  if (is_completed !== undefined) updates.is_completed = Boolean(is_completed)

  db.get('tasks').find({ id: parseInt(req.params.id) }).assign(updates).write()

  const updated = db.get('tasks').find({ id: parseInt(req.params.id) }).value()
  const user = db.get('users').find({ id: updated.user_id }).value()
  res.json({ ...updated, user_email: user?.email || '' })
})

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const task = db.get('tasks').find({ id: parseInt(req.params.id) }).value()
  if (!task) return res.status(404).json({ message: 'Задача не найдена' })
  if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Нет доступа к удалению' })
  }
  db.get('tasks').remove({ id: parseInt(req.params.id) }).write()
  res.json({ message: 'Задача удалена' })
})

module.exports = router
