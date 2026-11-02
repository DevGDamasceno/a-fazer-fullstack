import { ApiError } from './apiError'
import { getToken } from './token'

// API simulada para o modo demo (GitHub Pages): mesma interface da API real, mas os dados
// ficam no localStorage deste navegador. Não é segurança real, apenas uma demonstração.

const DB_KEY = 'todo-demo-db'
const EMPTY_DB = { users: [], todos: [], nextUserId: 1, nextTodoId: 1 }

function load() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) ?? structuredClone(EMPTY_DB)
  } catch {
    return structuredClone(EMPTY_DB)
  }
}

const save = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db))

// Hash só para não guardar a senha em texto puro no navegador.
async function hash(email, password) {
  const data = new TextEncoder().encode(`${email}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const tokenFor = (user) => ({
  token: `demo-${user.id}`,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
})

function currentUser(db) {
  const id = Number(getToken()?.replace('demo-', ''))
  const user = db.users.find((u) => u.id === id)
  if (!user) throw new ApiError(401, 'Não autorizado.')
  return user
}

const isoDay = (offsetDays) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00Z`
}

// Tarefas de exemplo para quem acabou de criar a conta ver os destaques de cor.
const SAMPLE_TODOS = [
  { title: 'Entregar o relatório', dueDate: isoDay(0), isCompleted: false },
  { title: 'Pagar a conta de internet', dueDate: isoDay(-2), isCompleted: false },
  { title: 'Estudar React', dueDate: isoDay(5), isCompleted: false },
  { title: 'Criar a conta no A Fazer', dueDate: null, isCompleted: true },
]

function validateCredentials(email, password) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Informe um e-mail válido.')
  if (password.length < 8) throw new ApiError(400, 'A senha deve ter pelo menos 8 caracteres.')
}

function validateTitle(title) {
  const trimmed = title?.trim() ?? ''
  if (trimmed.length < 1 || trimmed.length > 100) {
    throw new ApiError(400, 'O título é obrigatório (até 100 caracteres).')
  }
  return trimmed
}

export const demoApi = {
  async register(rawEmail, password) {
    const email = rawEmail.trim().toLowerCase()
    validateCredentials(email, password)

    const db = load()
    if (db.users.some((u) => u.email === email)) throw new ApiError(409, 'E-mail já cadastrado.')

    const user = { id: db.nextUserId++, email, passwordHash: await hash(email, password) }
    db.users.push(user)
    for (const sample of SAMPLE_TODOS) {
      db.todos.push({
        id: db.nextTodoId++,
        userId: user.id,
        description: null,
        createdAt: new Date().toISOString(),
        ...sample,
      })
    }
    save(db)
    return tokenFor(user)
  },

  async login(rawEmail, password) {
    const email = rawEmail.trim().toLowerCase()
    const db = load()
    const user = db.users.find((u) => u.email === email)
    if (!user || user.passwordHash !== (await hash(email, password))) throw new ApiError(401, 'Não autorizado.')
    return tokenFor(user)
  },

  async listTodos(completed) {
    const db = load()
    const user = currentUser(db)
    return db.todos
      .filter((t) => t.userId === user.id && (completed === undefined || t.isCompleted === completed))
      .sort((a, b) => a.id - b.id)
      .map(toResponse)
  },

  async createTodo({ title, description, dueDate }) {
    const db = load()
    const user = currentUser(db)
    const todo = {
      id: db.nextTodoId++,
      userId: user.id,
      title: validateTitle(title),
      description: description ?? null,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      dueDate: dueDate ?? null,
    }
    db.todos.push(todo)
    save(db)
    return toResponse(todo)
  },

  async updateTodo(id, { title, description, isCompleted, dueDate }) {
    const db = load()
    const user = currentUser(db)
    const todo = db.todos.find((t) => t.id === id && t.userId === user.id)
    if (!todo) throw new ApiError(404, 'Tarefa não encontrada.')

    todo.title = validateTitle(title)
    todo.description = description ?? null
    todo.isCompleted = Boolean(isCompleted)
    todo.dueDate = dueDate ?? null
    save(db)
    return toResponse(todo)
  },

  async deleteTodo(id) {
    const db = load()
    const user = currentUser(db)
    const index = db.todos.findIndex((t) => t.id === id && t.userId === user.id)
    if (index === -1) throw new ApiError(404, 'Tarefa não encontrada.')

    db.todos.splice(index, 1)
    save(db)
    return null
  },
}

// A API real não devolve o dono da tarefa; a simulada também não.
function toResponse({ userId: _userId, ...todo }) {
  return todo
}
