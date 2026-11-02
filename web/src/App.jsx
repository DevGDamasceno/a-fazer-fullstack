import { useState } from 'react'
import { clearToken, getToken, setToken } from './api'
import Login from './Login'
import Todos from './Todos'
import ThemeToggle from './ThemeToggle'
import './App.css'

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()))

  function handleAuthenticated(token) {
    setToken(token)
    setAuthenticated(true)
  }

  function handleLogout() {
    clearToken()
    setAuthenticated(false)
  }

  return (
    <>
      <ThemeToggle />
      {authenticated ? <Todos onLogout={handleLogout} /> : <Login onAuthenticated={handleAuthenticated} />}
    </>
  )
}
