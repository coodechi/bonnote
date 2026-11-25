import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.ts'
import { Icon } from '../components/Icon.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useTheme, type ThemeChoice } from '../context/ThemeContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { formatCount, formatMemberSince } from '../format.ts'
import type { Stats } from '../types.ts'

const themes: { id: ThemeChoice; label: string; icon: 'sun' | 'moon' | 'monitor' }[] = [
  { id: 'light', label: '浅色', icon: 'sun' },
  { id: 'dark', label: '深色', icon: 'moon' },
  { id: 'system', label: '跟随系统', icon: 'monitor' },
]

export function ProfilePage() {
  const { user, logout } = useAuth()
  const { choice, setChoice } = useTheme()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.stats().then(setStats).catch(() => undefined)
  }, [])

  async function exportNotes() {
    try {
      const data = await api.exportBackup()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      link.href = URL.createObjectURL(blob)
      link.download = `bonnote-${date}.json`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (error) {
      toast(error instanceof Error ? error.message : '导出失败')
    }
  }

  async function importNotes(file: File) {
    try {
      const data = JSON.parse(await file.text()) as { notes?: unknown[] }
      const result = await api.importBackup(data)
      toast(`已导入 ${result.notes} 条笔记`)
      const next = await api.stats()
      setStats(next)
    } catch (error) {
      toast(error instanceof Error ? error.message : '导入失败，请检查文件')
    }
  }

  async function enableNotify() {
    if (typeof Notification === 'undefined') {
      toast('当前浏览器不支持提醒')
      return
    }
    const permission = await Notification.requestPermission()
    toast(permission === 'granted' ? '到点时会提醒你' : '没有获得通知权限')
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{user ? formatMemberSince(user.createdAt) : ''}</p>
          <h1>我的</h1>
        </div>
      </header>
      <button className="profile-card" type="button" onClick={() => navigate('/me/account')}>
        <span className="avatar large">{user?.nickname.slice(0, 1)}</span>
        <span className="profile-id">
          <strong>{user?.nickname}</strong>
          <small>{user?.email}</small>
        </span>
        <span className="profile-chevron">
          <Icon name="chevron" size={18} />
        </span>
      </button>

      <section className="profile-stats">
        <div>
          <strong>{stats?.total ?? '–'}</strong>
          <span>笔记</span>
        </div>
        <div>
          <strong>{stats?.archived ?? '–'}</strong>
          <span>归档</span>
        </div>
        <div>
          <strong>{stats ? formatCount(stats.characters) : '–'}</strong>
          <span>字</span>
        </div>
      </section>

      <section>
        <p className="field-label">外观</p>
        <div className="seg">
          {themes.map((item) => (
            <button key={item.id} className={choice === item.id ? 'on' : ''} type="button" onClick={() => setChoice(item.id)}>
              <Icon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div className="menu-list card">
        <button type="button" onClick={() => navigate('/trash')}>
          <Icon name="trash" size={18} />
          回收站
          <small>{stats?.trash ?? 0}</small>
        </button>
        <button type="button" onClick={() => navigate('/notes?status=archived')}>
          <Icon name="archive" size={18} />
          归档
          <small>{stats?.archived ?? 0}</small>
        </button>
        <button type="button" onClick={() => void exportNotes()}>
          <Icon name="download" size={18} />
          导出备份
        </button>
        <label>
          <Icon name="upload" size={18} />
          导入备份
          <input
            className="sr-only"
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void importNotes(file)
            }}
          />
        </label>
        <button type="button" onClick={() => void enableNotify()}>
          <Icon name="bell" size={18} />
          开启到点提醒
        </button>
        <button className="danger" type="button" onClick={logout}>
          <Icon name="logout" size={18} />
          退出登录
        </button>
      </div>
      <p className="footnote">登录状态会保留 7 天。桌面端按 N 新建，按 / 搜索。</p>
    </div>
  )
}
