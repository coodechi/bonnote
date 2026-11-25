import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.ts'
import { NoteCard } from '../components/NoteCard.tsx'
import { EmptyState } from '../components/EmptyState.tsx'
import { Icon } from '../components/Icon.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { formatRemind, formatToday, greeting, isOverdue } from '../format.ts'
import { useCreateNote } from '../hooks/useCreateNote.ts'
import type { Note, Stats } from '../types.ts'

export function HomePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { createNote } = useCreateNote()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Note[]>([])
  const [pinned, setPinned] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [nextStats, nextRecent, nextPinned] = await Promise.all([
        api.stats(),
        api.listNotes({ page: 1, pageSize: 12, sort: 'updated' }),
        api.listNotes({ status: 'pinned', page: 1, pageSize: 8 }),
      ])
      setStats(nextStats)
      setPinned(nextPinned.items)
      const rest = nextRecent.items.filter((note) => !note.pinned)
      setRecent(rest.length ? rest : nextRecent.items)
    } catch (error) {
      toast(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function togglePin(note: Note) {
    try {
      const updated = await api.updateNote(note.id, { pinned: !note.pinned })
      setPinned((current) => {
        if (updated.pinned) return [updated, ...current.filter((item) => item.id !== updated.id)]
        return current.filter((item) => item.id !== updated.id)
      })
      setRecent((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (error) {
      toast(error instanceof Error ? error.message : '操作失败')
    }
  }

  async function toggleCheck(note: Note, itemId: string, done: boolean) {
    try {
      const updated = await api.toggleCheck(note.id, itemId, done)
      setRecent((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setPinned((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (error) {
      toast(error instanceof Error ? error.message : '操作失败')
    }
  }

  const due = stats?.reminders.filter((note) => isOverdue(note.remindAt)).length ?? 0
  const lede = !stats
    ? ' '
    : stats.reminders.length
      ? due
        ? `有 ${due} 条提醒已经到点。`
        : `有 ${stats.reminders.length} 条提醒在等你。`
      : stats.today
        ? `今天动过 ${stats.today} 则笔记。`
        : '桌上还空着，写下一张便签吧。'

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{formatToday()}</p>
          <h1>{greeting(user?.nickname || '朋友')}</h1>
          <p className="lede">{lede}</p>
        </div>
        <button className="icon-btn" type="button" aria-label="搜索" onClick={() => navigate('/notes?focus=1')}>
          <Icon name="search" />
        </button>
      </header>

      <button className="composer" type="button" onClick={() => void createNote()}>
        <span className="composer-mark" />
        记下此刻的想法…
      </button>

      <section className="stats">
        <button type="button" onClick={() => navigate('/notes')}>
          <strong>{stats?.total ?? '–'}</strong>
          <span>笔记</span>
        </button>
        <button type="button" onClick={() => navigate('/notes?scope=today')}>
          <strong>{stats?.today ?? '–'}</strong>
          <span>今日</span>
        </button>
        <button type="button" onClick={() => navigate('/notes?status=favorite')}>
          <strong>{stats?.favorite ?? '–'}</strong>
          <span>收藏</span>
        </button>
        <button type="button" onClick={() => navigate('/notes?scope=remind')}>
          <strong>{stats?.reminders.length ?? '–'}</strong>
          <span>提醒</span>
        </button>
      </section>

      {loading && !stats ? <div className="skeleton-card" /> : null}

      {pinned.length ? (
        <section>
          <div className="section-head">
            <h2>贴在最上面</h2>
          </div>
          <div className="h-scroll">
            {pinned.map((note) => (
              <NoteCard key={note.id} note={note} onTogglePin={togglePin} onToggleCheck={toggleCheck} />
            ))}
          </div>
        </section>
      ) : null}

      {stats?.reminders.length ? (
        <section>
          <div className="section-head">
            <h2>即将提醒</h2>
            <button className="text-btn" type="button" onClick={() => navigate('/notes?scope=remind')}>
              全部
            </button>
          </div>
          <div className="remind-list">
            {stats.reminders.map((note) => (
              <button key={note.id} className="remind-row" type="button" onClick={() => navigate(`/notes/${note.id}`)}>
                <span className={isOverdue(note.remindAt) ? 'badge badge-late' : 'badge'}>
                  {note.remindAt ? formatRemind(note.remindAt) : ''}
                </span>
                <span>{note.title || '无标题'}</span>
                <Icon name="chevron" size={16} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="section-head">
          <h2>最近</h2>
          <button className="text-btn" type="button" onClick={() => navigate('/notes')}>
            查看全部
          </button>
        </div>
        {recent.length ? (
          <div className="note-grid">
            {recent.map((note) => (
              <NoteCard key={note.id} note={note} onTogglePin={togglePin} onToggleCheck={toggleCheck} />
            ))}
          </div>
        ) : loading ? null : (
          <EmptyState title="还没有便签" text="从一句今天突然想到的话开始。" action={<button className="btn btn-primary" type="button" onClick={() => void createNote()}>写第一张</button>} />
        )}
      </section>
    </div>
  )
}
