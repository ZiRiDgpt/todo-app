const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { db } = require('../db')

const router = express.Router()

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' })
  }

  const user = db.get('users').find({ email }).value()
  if (!user) {
    return res.status(401).json({ message: 'Неверный email или пароль' })
  }

  const isValid = bcrypt.compareSync(password, user.password_hash)
  if (!isValid) {
    return res.status(401).json({ message: 'Неверный email или пароль' })
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role }
  })
})

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Токен отсутствует' })
  }
  try {
    const payload = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
    res.json({ id: payload.id, email: payload.email, role: payload.role })
  } catch {
    res.status(401).json({ message: 'Токен недействителен' })
  }
})

module.exports = router
