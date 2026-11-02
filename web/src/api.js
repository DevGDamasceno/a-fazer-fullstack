import { ApiError } from './apiError'
import { demoApi } from './demoApi'
import { getToken } from './token'

export { ApiError }
export { clearToken, getToken, setToken } from './token'

// No build do GitHub Pages (modo "demo") não existe servidor: a API é simulada no navegador.
export const isDemo = import.meta.env.VITE_DEMO === 'true'

// Transforma as respostas de erro da API (400 com "errors", 409 com "error") em uma mensagem legível.
async function errorMessage(response) {
  try {
    const body = await response.json()
    if (body.errors) return Object.values(body.errors).flat().join(' ')
    if (body.error) return body.error
  } catch {
    // resposta sem corpo JSON
  }
  if (response.status === 401) return 'Não autorizado.'
  return 'Algo deu errado. Tente novamente.'
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken()
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  })

  if (!response.ok) throw new ApiError(response.status, await errorMessage(response))
  return response.status === 204 ? null : response.json()
}

const httpApi = {
  register: (email, password) => request('/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  listTodos: (completed) =>
    request(`/todos${completed === undefined ? '' : `?completed=${completed}`}`),
  createTodo: (todo) => request('/todos', { method: 'POST', body: todo }),
  updateTodo: (id, todo) => request(`/todos/${id}`, { method: 'PUT', body: todo }),
  deleteTodo: (id) => request(`/todos/${id}`, { method: 'DELETE' }),
}

export const api = isDemo ? demoApi : httpApi
