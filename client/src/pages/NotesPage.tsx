import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.ts'
import { EmptyState } from '../components/EmptyState.tsx'
import { Icon } from '../components/Icon.tsx'
import { NoteCard } from '../components/NoteCard.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { PAPERS } from '../palette.ts'
import type { Folder, ListParams, Note, NoteSort, NoteStatus, Tag } from '../types.ts'

const statusOptions: { id: NoteStatus | ''; label: string }[] = [
  { id: '', label: '全部' },
  { id: 'favorite', label: '收藏' },
  { id: 'pinned', label: '置顶' },
  { id: 'archived', label: '归档' },
]

const sortOptions: { id: NoteSort; label: string }[] = [
  { id: 'updated', label: '最近更新' },
  { id: 'created', label: '最近创建' },
  { id: 'title', label: '标题' },
]

export function NotesPage() {
  const [params, setParams] = useSearchParams()
  const { toast } = useToast()
  const queryKey = params.toString()
  const [page, setPage] = useState(1)
  const [seenKey, setSeenKey] = useState(queryKey)
  const [items, setItems] = useState<Note[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [folders, setFolders] = useState<Folder[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [q, setQ] = useState(params.get('q') ?? '')
  const [view, setView] = useState<'card' | 'list'>(() => (localStorage.getItem('bonnote-view') === 'list' ? 'list' : 'card'))
  const inputRef = useRef<HTMLInputElement>(null)

  if (seenKey !== queryKey) {
    setSeenKey(queryKey)
    setPage(1)
    setItems([])
  }
  const effectivePage = seenKey === queryKey ? page : 1

  useEffect(() => {
    void Promise.all([api.folders(), api.tags()])
      .then(([nextFolders, nextTags]) => {
        setFolders(nextFolders)
        setTags(nextTags)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (params.get('focus') !== '1') return
    inputRef.current?.focus()
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('focus')
        return next
      },
      { replace: true },
    )
  }, [params, setParams])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = params.get('q') ?? ''
      if (current === q.trim()) return
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const value = q.trim()
          if (value) next.set('q', value)
          else next.delete('q')
          return next
        },
        { replace: true },
      )
    }, 280)
    return () => window.clearTimeout(timer)
  }, [q, params, setParams])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const listParams: ListParams = {
      q: params.get('q') || undefined,
      status: (params.get('status') as NoteStatus | null) || undefined,
      sort: (params.get('sort') as NoteSort | null) || undefined,
      folderId: params.get('folderId') || undefined,
      tagId: params.get('tagId') || undefined,
      color: params.get('color') || undefined,
      scope: (params.get('scope') as ListParams['scope']) || undefined,
      page: effectivePage,
      pageSize: 20,
    }
    api
      .listNotes(listParams)
      .then((result) => {
        if (cancelled) return
        setItems((current) => (effectivePage === 1 ? result.items : [...current, ...result.items.filter((note) => !current.some((item) => item.id === note.id))]))
        setTotal(result.total)
        setError('')
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [queryKey, effectivePage, params, reloadKey])

  function updateParam(key: string, value?: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  async function togglePin(note: Note) {
    try {
      const updated = await api.updateNote(note.id, { pinned: !note.pinned })
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败')
    }
  }

  async function toggleCheck(note: Note, itemId: string, done: boolean) {
    try {
      const updated = await api.toggleCheck(note.id, itemId, done)
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败')
    }
  }

  const folder = folders.find((item) => item.id === params.get('folderId'))
  const tag = tags.find((item) => item.id === params.get('tagId'))
  const status = params.get('status')
  const scope = params.get('scope')
  const title = folder?.name || tag?.name || (status === 'favorite' ? '收藏' : status === 'archived' ? '归档' : status === 'pinned' ? '置顶' : scope === 'today' ? '今天' : scope === 'remind' ? '提醒' : '全部笔记')
  const filtering = Boolean(params.get('status') || params.get('folderId') || params.get('tagId') || params.get('color') || params.get('scope') || params.get('sort'))

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{loading && items.length === 0 ? '翻找中' : `${total} 则`}</p>
          <h1>{title}</h1>
        </div>
        <button className={filtering ? 'icon-btn on' : 'icon-btn'} type="button" aria-label="筛选与排序" onClick={() => setFilterOpen(true)}>
          <Icon name="filter" />
        </button>
      </header>
      <div className="search-sticky">
        <label className="searchbar">
          <Icon name="search" size={18} />
          <input ref={inputRef} value={q} onChange={(event) => setQ(event.target.value)} placeholder="搜索标题、正文或清单" />
        </label>
      </div>
      {error ? (
        <EmptyState title="没有载入成功" text={error} action={<button className="btn btn-primary" type="button" onClick={() => setReloadKey((current) => current + 1)}>重试</button>} />
      ) : null}
      {!error && loading && items.length === 0 ? (
        <div className="note-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : null}
      {!error && !loading && items.length === 0 ? (
        <EmptyState title={q ? '没有找到相关便签' : '这里还是空的'} text={q ? '换个词，或者把范围放宽一点。' : '新写的便签会落在这里。'} />
      ) : null}
      {items.length ? (
        <div className={view === 'list' ? 'note-grid is-list' : 'note-grid'}>
          {items.map((note) => (
            <NoteCard key={note.id} note={note} layout={view} onTogglePin={togglePin} onToggleCheck={toggleCheck} />
          ))}
        </div>
      ) : null}
      {items.length < total ? (
        <button className="btn btn-ghost btn-block load-more" type="button" disabled={loading} onClick={() => setPage((current) => current + 1)}>
          {loading ? '加载中…' : '再看一些'}
        </button>
      ) : null}

      <Sheet open={filterOpen} title="整理一下" onClose={() => setFilterOpen(false)}>
        <div className="stack">
          <div>
            <p className="field-label">范围</p>
            <div className="chips">
              {statusOptions.map((item) => (
                <button key={item.label} className={(params.get('status') ?? '') === item.id ? 'chip on' : 'chip'} type="button" onClick={() => updateParam('status', item.id || undefined)}>
                  {item.label}
                </button>
              ))}
              <button className={params.get('scope') === 'today' ? 'chip on' : 'chip'} type="button" onClick={() => updateParam('scope', params.get('scope') === 'today' ? undefined : 'today')}>
                今天
              </button>
              <button className={params.get('scope') === 'remind' ? 'chip on' : 'chip'} type="button" onClick={() => updateParam('scope', params.get('scope') === 'remind' ? undefined : 'remind')}>
                有提醒
              </button>
            </div>
          </div>
          <div>
            <p className="field-label">排序</p>
            <div className="seg">
              {sortOptions.map((item) => (
                <button key={item.id} className={(params.get('sort') ?? 'updated') === item.id ? 'on' : ''} type="button" onClick={() => updateParam('sort', item.id === 'updated' ? undefined : item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="field-label">颜色</p>
            <div className="swatches">
              <button className={!params.get('color') ? 'color-dot on ink' : 'color-dot ink'} type="button" onClick={() => updateParam('color')} aria-label="全部颜色">
                全
              </button>
              {PAPERS.map((paper) => (
                <button key={paper.id} className={params.get('color') === paper.id ? 'color-dot on' : 'color-dot'} style={{ background: paper.value }} type="button" aria-label={paper.label} onClick={() => updateParam('color', paper.id)} />
              ))}
            </div>
          </div>
          {folders.length ? (
            <div>
              <p className="field-label">笔记本</p>
              <div className="chips">
                <button className={!params.get('folderId') ? 'chip on' : 'chip'} type="button" onClick={() => updateParam('folderId')}>
                  全部
                </button>
                {folders.map((item) => (
                  <button key={item.id} className={params.get('folderId') === item.id ? 'chip on' : 'chip'} type="button" onClick={() => updateParam('folderId', item.id)}>
                    {item.icon} {item.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {tags.length ? (
            <div>
              <p className="field-label">标签</p>
              <div className="chips">
                {tags.map((item) => (
                  <button key={item.id} className={params.get('tagId') === item.id ? 'chip on' : 'chip'} type="button" onClick={() => updateParam('tagId', params.get('tagId') === item.id ? undefined : item.id)}>
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <p className="field-label">视图</p>
            <div className="seg">
              <button className={view === 'card' ? 'on' : ''} type="button" onClick={() => { setView('card'); localStorage.setItem('bonnote-view', 'card') }}>
                卡片
              </button>
              <button className={view === 'list' ? 'on' : ''} type="button" onClick={() => { setView('list'); localStorage.setItem('bonnote-view', 'list') }}>
                列表
              </button>
            </div>
          </div>
          {filtering ? (
            <button
              className="btn btn-ghost btn-block"
              type="button"
              onClick={() => {
                setParams(new URLSearchParams())
                setQ('')
              }}
            >
              清除筛选
            </button>
          ) : null}
        </div>
      </Sheet>
    </div>
  )
}
