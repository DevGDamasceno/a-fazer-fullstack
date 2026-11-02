import { useState } from 'react'

const currentTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(currentTheme)

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('todo-theme', next)
    } catch {
      // armazenamento indisponível: o tema vale só nesta sessão
    }
    setTheme(next)
  }

  const isDark = theme === 'dark'
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}>
      {isDark ? '☀️ Claro' : '🌙 Escuro'}
    </button>
  )
}
