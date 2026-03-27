const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const bcrypt = require('bcryptjs')
const path = require('path')

const adapter = new FileSync(path.join(__dirname, 'db.json'))
const db = low(adapter)

db.defaults({ users: [], tasks: [], _userId: 2, _taskId: 0 }).write()

function nextId(entity) {
  const key = entity === 'user' ? '_userId' : '_taskId'
  const id = db.get(key).value() + 1
  db.set(key, id).write()
  return id
}

function seedUsers() {
  const users = db.get('users').value()
  if (users.length === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10)
    const userHash = bcrypt.hashSync('user123', 10)
    db.get('users').push({
      id: 1,
      email: 'admin@todo.com',
      password_hash: adminHash,
      role: 'admin',
      created_at: new Date().toISOString()
    }).write()
    db.get('users').push({
      id: 2,
      email: 'user@todo.com',
      password_hash: userHash,
      role: 'user',
      created_at: new Date().toISOString()
    }).write()
    console.log('Seed users: admin@todo.com / admin123, user@todo.com / user123')
  }
}

seedUsers()

module.exports = { db, nextId }
