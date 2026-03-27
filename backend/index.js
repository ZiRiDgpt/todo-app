require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const tasksRoutes = require('./routes/tasks')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/tasks', tasksRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Внутренняя ошибка сервера' })
})

app.listen(PORT, () => {
  console.log(`Backend запущен на http://localhost:${PORT}`)
})
