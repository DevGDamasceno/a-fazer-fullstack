import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

const FILTERS = [
  { label: 'Todas', value: undefined },
  { label: 'Pendentes', value: false },
  { label: 'Concluídas', value: true },
]

const toDateInput = (iso) => (iso ? iso.slice(0, 10) : '')
const formatDate = (iso) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
const todayLocal = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
// Atrasada só depois do dia do vencimento (compara datas, não horários).
const isOverdue = (todo) => !todo.isCompleted && todo.dueDate && todo.dueDate.slice(0, 10) < todayLocal()
const isDueToday = (todo) => !todo.isCompleted && todo.dueDate && todo.dueDate.slice(0, 10) === todayLocal()

const dueClass = (todo) => (isOverdue(todo) ? 'overdue' : isDueToday(todo) ? 'today' : 'muted')
const dueLabel = (todo) => (isDueToday(todo) ? 'Vence hoje' : `Vence em ${formatDate(todo.dueDate)}`)

export default function Todos({ onLogout }) {
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [editingId, setEditingId] = useState(null)

  // Qualquer 401 (token expirado ou inválido) volta para a tela de login.
  const handleError = useCallback(
    (err) => {
      if (err.status === 401) onLogout()
      else setError(err.message)
    },
    [onLogout],
  )

  useEffect(() => {
    let cancelled = false
    api
      .listTodos(filter)
      .then((data) => {
        if (!cancelled) {
          setTodos(data)
          setError('')
        }
      })
      .catch((err) => !cancelled && handleError(err))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [filter, handleError])

  const toPayload = (todo, changes) => ({
    title: todo.title,
    description: todo.description,
    isCompleted: todo.isCompleted,
    dueDate: todo.dueDate,
    ...changes,
  })

  async function handleCreate(event) {
    event.preventDefault()
    try {
      const created = await api.createTodo({
        title: title.trim(),
        description: null,
        dueDate: dueDate ? `${dueDate}T00:00:00Z` : null,
      })
      // Se o filtro atual é "Concluídas", a nova tarefa (pendente) não aparece nesta lista.
      if (filter !== true) setTodos((current) => [...current, created])
      setTitle('')
      setDueDate('')
      setError('')
    } catch (err) {
      handleError(err)
    }
  }

  async function handleUpdate(todo, changes) {
    try {
      const updated = await api.updateTodo(todo.id, toPayload(todo, changes))
      setTodos((current) => {
        // Ao marcar/desmarcar com um filtro ativo, a tarefa sai da lista atual.
        const stillMatches = filter === undefined || updated.isCompleted === filter
        return stillMatches
          ? current.map((t) => (t.id === updated.id ? updated : t))
          : current.filter((t) => t.id !== updated.id)
      })
      setEditingId(null)
      setError('')
    } catch (err) {
      handleError(err)
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteTodo(id)
      setTodos((current) => current.filter((t) => t.id !== id))
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <main className="card">
      <header className="top">
        <h1>Minhas tarefas</h1>
        <button type="button" className="link" onClick={onLogout}>Sair</button>
      </header>

      <form className="new" onSubmit={handleCreate}>
        <input
          placeholder="Nova tarefa"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          required
          aria-label="Título da nova tarefa"
        />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Vencimento" />
        <button type="submit">Adicionar</button>
      </form>

      <nav className="filters" aria-label="Filtro">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className={f.value === filter ? 'chip active' : 'chip'}
            onClick={() => {
              setLoading(true)
              setFilter(f.value)
            }}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {error && <p className="error" role="alert">{error}</p>}

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : todos.length === 0 ? (
        <p className="muted empty">Nenhuma tarefa por aqui.</p>
      ) : (
        <ul className="list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.isCompleted ? 'done' : ''}>
              {editingId === todo.id ? (
                <EditRow todo={todo} onSave={(changes) => handleUpdate(todo, changes)} onCancel={() => setEditingId(null)} />
              ) : (
                <>
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={(e) => handleUpdate(todo, { isCompleted: e.target.checked })}
                    aria-label={`Concluir ${todo.title}`}
                  />
                  <div className="body">
                    <span className="title">{todo.title}</span>
                    {todo.dueDate && <small className={dueClass(todo)}>{dueLabel(todo)}</small>}
                  </div>
                  <button
                    type="button"
                    className={todo.isCompleted ? 'link' : 'complete'}
                    onClick={() => handleUpdate(todo, { isCompleted: !todo.isCompleted })}
                  >
                    {todo.isCompleted ? 'Reabrir' : 'Concluir'}
                  </button>
                  <button type="button" className="link" onClick={() => setEditingId(todo.id)}>Editar</button>
                  <button type="button" className="link danger" onClick={() => handleDelete(todo.id)}>Apagar</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function EditRow({ todo, onSave, onCancel }) {
  const [title, setTitle] = useState(todo.title)
  const [dueDate, setDueDate] = useState(toDateInput(todo.dueDate))

  function submit(event) {
    event.preventDefault()
    onSave({ title: title.trim(), dueDate: dueDate ? `${dueDate}T00:00:00Z` : null })
  }

  return (
    <form className="edit" onSubmit={submit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required autoFocus aria-label="Título" />
      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Vencimento" />
      <button type="submit">Salvar</button>
      <button type="button" className="link" onClick={onCancel}>Cancelar</button>
    </form>
  )
}
