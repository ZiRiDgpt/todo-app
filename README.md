# ToDo App — Тестовое задание

Мини-приложение «Список задач» с авторизацией, ролевым доступом и полным CRUD.

## Стек

| Часть | Технология |
|-------|------------|
| Frontend | Nuxt 3, Pinia, Tailwind CSS |
| Backend | Node.js + Express |
| База данных | lowdb (JSON-файл, без компиляции нативных модулей) |
| Авторизация | JWT (jsonwebtoken + bcryptjs) |

## Быстрый старт

### 1. Бэкенд

```bash
cd backend

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env при необходимости (по умолчанию всё готово к запуску)

npm install
npm run dev        # dev-режим с nodemon
# или
npm start          # production
```

Сервер запускается на **http://localhost:3001**

> При первом запуске автоматически создаётся файл `db.json` с двумя тестовыми аккаунтами.

### 2. Фронтенд

```bash
cd frontend
npm install
npm run dev
```

Приложение доступно на **http://localhost:3000**

---

## Тестовые аккаунты

| Email | Пароль | Роль |
|-------|--------|------|
| admin@todo.com | admin123 | Администратор |
| user@todo.com | user123 | Пользователь |

> Администратор видит все задачи всех пользователей и может редактировать/удалять любые.  
> Пользователь видит только свои задачи.

---

## API эндпоинты

### Авторизация
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/login` | Вход, возвращает JWT |
| GET | `/api/auth/me` | Проверить текущий токен |

### Задачи (требуют `Authorization: Bearer <token>`)
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/tasks` | Список задач |
| POST | `/api/tasks` | Создать задачу |
| PUT | `/api/tasks/:id` | Обновить задачу |
| DELETE | `/api/tasks/:id` | Удалить задачу |

#### Query-параметры GET /api/tasks
| Параметр | Значения | По умолчанию |
|----------|----------|--------------|
| `sort` | `created_at`, `due_date`, `title`, `is_completed` | `created_at` |
| `order` | `asc`, `desc` | `desc` |
| `search` | строка поиска | — |
| `status` | `active`, `completed` | все |
| `page` | номер страницы | `1` |
| `limit` | размер страницы (макс 50) | `10` |

#### Модель задачи
```json
{
  "id": 1,
  "title": "Название задачи",
  "description": "Описание",
  "due_date": "2026-04-15",
  "is_completed": false,
  "user_id": 1,
  "user_email": "admin@todo.com",
  "created_at": "2026-03-27T10:00:00.000Z",
  "updated_at": "2026-03-27T10:00:00.000Z"
}
```

---

## Зависимости

Актуальные версии всех библиотек зафиксированы в `package.json` и `package-lock.json` для каждого пакета.

### Backend (`backend/package.json`)
| Пакет | Версия | Назначение |
|-------|--------|------------|
| express | ^4.18.3 | HTTP-сервер |
| lowdb | ^1.0.0 | JSON-файловая БД |
| jsonwebtoken | ^9.0.2 | Генерация и проверка JWT |
| bcryptjs | ^2.4.3 | Хэширование паролей |
| cors | ^2.8.5 | CORS-заголовки |
| dotenv | ^16.4.5 | Переменные окружения |
| nodemon | ^3.1.0 | Авто-перезапуск в dev-режиме |

### Frontend (`frontend/package.json`)
| Пакет | Версия | Назначение |
|-------|--------|------------|
| nuxt | ^3.11.1 | SSR/SPA фреймворк |
| pinia | ^2.1.7 | State management |
| @pinia/nuxt | ^0.5.1 | Интеграция Pinia с Nuxt |
| @nuxtjs/tailwindcss | ^6.11.4 | Утилитарный CSS |

---

## Структура проекта

```
Tronk/
├── backend/
│   ├── index.js              # Express-сервер, CORS, error handler
│   ├── db.js                 # lowdb (JSON-файл) + seed-пользователи
│   ├── middleware/
│   │   └── auth.js           # JWT middleware
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/login
│   │   └── tasks.js          # CRUD /api/tasks
│   ├── .env
│   └── package.json
└── frontend/
    ├── nuxt.config.ts
    ├── app.vue
    ├── plugins/
    │   └── api.ts            # fetch-обёртка с перехватом 401
    ├── middleware/
    │   └── auth.ts           # защита роутов
    ├── stores/
    │   ├── auth.ts           # токен, пользователь
    │   └── tasks.ts          # CRUD-операции
    ├── pages/
    │   ├── login.vue         # страница входа
    │   └── index.vue         # главная страница задач
    ├── components/
    │   ├── TaskModal.vue     # создание / редактирование
    │   └── ConfirmModal.vue  # подтверждение удаления
    └── package.json
```
