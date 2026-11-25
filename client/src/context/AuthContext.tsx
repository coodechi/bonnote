import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, TOKEN_KEY } from '../api.ts'
import type { User } from '../types.ts'

interface AuthContextValue {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nickname: string, code: string) => Promise<void>
  logout: () => void
  updateProfile: (nickname: string) => Promise<void>
  updateEmail: (email: string, code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setReady(true)
      return
    }
    let alive = true
    api
      .me()
      .then((me) => {
        if (alive) setUser(me)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('bonnote-unauthorized', onUnauthorized)
    return () => window.removeEventListener('bonnote-unauthorized', onUnauthorized)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      async login(email, password) {
        const result = await api.login(email, password)
        localStorage.setItem(TOKEN_KEY, result.token)
        setUser(result.user)
      },
      async register(email, password, nickname, code) {
        const result = await api.register(email, password, nickname, code)
        localStorage.setItem(TOKEN_KEY, result.token)
        setUser(result.user)
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      },
      async updateProfile(nickname) {
        const next = await api.updateProfile(nickname)
        setUser(next)
      },
      async updateEmail(email, code) {
        const next = await api.updateEmail(email, code)
        setUser(next)
      },
    }),
    [ready, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth 需要放在 AuthProvider 中')
  return context
}
