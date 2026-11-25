import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { useCreateNote } from '../hooks/useCreateNote.ts'
import { api } from '../api.ts'
import { Icon, type IconName } from './Icon.tsx'

const tabs: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: '首页', icon: 'home', end: true },
  { to: '/notes', label: '笔记', icon: 'notes', end: true },
  { to: '/folders', label: '本子', icon: 'folder', end: true },
  { to: '/me', label: '我的', icon: 'user' },
]

function sideActive(to: string, pathname: string, search: string) {
  const [path, query] = to.split('?')
  if (path === '/me') {
    if (pathname !== '/me' && !pathname.startsWith('/me/')) return false
  } else if (pathname !== path) return false
  if (!query) {
    if (path === '/notes') return search === ''
    return true
  }
  const expected = new URLSearchParams(query)
  const current = new URLSearchParams(search)
  for (const [key, value] of expected) {
    if (current.get(key) !== value) return false
  }
  return true
}

export function AppShell() {
  const { user } = useAuth()
  const { createNote } = useCreateNote()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = Boolean(target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable))
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      const editing = location.pathname.startsWith('/notes/') && location.pathname !== '/notes'
      if (editing) return
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        void createNote()
      }
      if (event.key === '/') {
        event.preventDefault()
        navigate('/notes?focus=1')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [createNote, location.pathname, navigate])

  useEffect(() => {
    if (!user || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    let stop = false
    let seen = new Set<string>()
    try {
      const saved = JSON.parse(sessionStorage.getItem('bonnote-notified') || '[]') as unknown
      if (Array.isArray(saved)) seen = new Set(saved.filter((item) => typeof item === 'string'))
    } catch {
      seen = new Set()
    }
    const tick = async () => {
      try {
        const stats = await api.stats()
        if (stop) return
        for (const note of stats.reminders) {
          if (!note.remindAt || seen.has(note.id) || new Date(note.remindAt).getTime() > Date.now()) continue
          seen.add(note.id)
          new Notification(note.title || '便签提醒', { body: note.content.slice(0, 80) || '到点了' })
        }
        sessionStorage.setItem('bonnote-notified', JSON.stringify([...seen]))
      } catch {
        /* 提醒检查失败时保持安静 */
      }
    }
    void tick()
    const timer = window.setInterval(() => void tick(), 60000)
    return () => {
      stop = true
      window.clearInterval(timer)
    }
  }, [user])

  const sideLinks: { to: string; label: string; icon: IconName }[] = [
    { to: '/', label: '首页', icon: 'home' },
    { to: '/notes', label: '全部笔记', icon: 'notes' },
    { to: '/notes?status=favorite', label: '收藏', icon: 'heart' },
    { to: '/notes?scope=remind', label: '提醒', icon: 'bell' },
    { to: '/notes?status=archived', label: '归档', icon: 'archive' },
    { to: '/folders', label: '笔记本', icon: 'folder' },
    { to: '/trash', label: '回收站', icon: 'trash' },
    { to: '/me', label: '我的', icon: 'user' },
  ]

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" />
          <div>
            <strong>Bonnote</strong>
            <small>把念头轻轻放下</small>
          </div>
        </div>
        <button className="btn btn-primary btn-block" type="button" onClick={() => void createNote()}>
          <Icon name="plus" size={18} />
          新便签
        </button>
        <nav className="side-nav">
          {sideLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={() => (sideActive(link.to, location.pathname, location.search) ? 'side-link active' : 'side-link')}
            >
              <Icon name={link.icon} size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-user">
          <span className="avatar">{user?.nickname.slice(0, 1)}</span>
          <div>
            <strong>{user?.nickname}</strong>
            <small>{user?.email}</small>
          </div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
      <nav className="tabbar">
        {tabs.slice(0, 2).map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => (isActive ? 'tab-item active' : 'tab-item')}>
            <Icon name={tab.icon} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
        <button className="tab-fab" type="button" aria-label="新建便签" onClick={() => void createNote()}>
          <Icon name="plus" size={26} />
        </button>
        {tabs.slice(2).map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => (isActive ? 'tab-item active' : 'tab-item')}>
            <Icon name={tab.icon} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
