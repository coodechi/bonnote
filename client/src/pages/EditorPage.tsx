import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api.ts'
import { ConfirmDialog } from '../components/Sheet.tsx'
import { CreateLabelSheet } from '../components/CreateLabelSheet.tsx'
import { Icon } from '../components/Icon.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { copyText, toLocalInput } from '../format.ts'
import { PAPERS, paperColor } from '../palette.ts'
import type { Folder, Note, NoteInput, Tag } from '../types.ts'

interface Draft {
  title: string
  content: string
  color: string
  pinned: boolean
  archived: boolean
  favorite: boolean
  remindAt: string
  folderId: string | null
  tagIds: string[]
  checklist: { key: string; text: string; done: boolean }[]
}

function fromNote(note: Note): Draft {
  return {
    title: note.title,
    content: note.content,
    color: note.color,
    pinned: note.pinned,
    archived: note.archived,
    favorite: note.favorite,
    remindAt: toLocalInput(note.remindAt),
    folderId: note.folderId,
    tagIds: note.tags.map((tag) => tag.id),
    checklist: note.checklist.map((item) => ({ key: item.id, text: item.text, done: item.done })),
  }
}

function toPayload(draft: Draft): NoteInput {
  return {
    title: draft.title,
    content: draft.content,
    color: draft.color,
    pinned: draft.pinned,
    archived: draft.archived,
    favorite: draft.favorite,
    remindAt: draft.remindAt ? new Date(draft.remindAt).toISOString() : null,
    folderId: draft.folderId,
    tagIds: draft.tagIds,
    checklist: draft.checklist.map((item) => ({ text: item.text, done: item.done })),
  }
}

function isBlank(draft: Draft) {
  return (
    !draft.title.trim() &&
    !draft.content.trim() &&
    draft.checklist.every((item) => !item.text.trim()) &&
    !draft.remindAt &&
    draft.tagIds.length === 0 &&
    !draft.folderId &&
    !draft.pinned &&
    !draft.favorite &&
    !draft.archived &&
    draft.color === 'ivory'
  )
}

export function EditorPage() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [trashed, setTrashed] = useState(false)
  const [missing, setMissing] = useState(false)
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [folders, setFolders] = useState<Folder[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [moreOpen, setMoreOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [labelKind, setLabelKind] = useState<'folder' | 'tag' | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const draftRef = useRef<Draft | null>(null)
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const queuedRef = useRef(false)
  const freshRef = useRef(searchParams.get('fresh') === '1')
  const readyRef = useRef(false)
  const timer = useRef<number | null>(null)

  const fit = (element: HTMLTextAreaElement | null) => {
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }

  const flush = useCallback(async () => {
    const current = draftRef.current
    if (!current || !dirtyRef.current || trashed) return
    if (savingRef.current) {
      queuedRef.current = true
      return
    }
    savingRef.current = true
    const sent = JSON.stringify(current)
    setStatus('saving')
    try {
      const updated = await api.updateNote(id, toPayload(current))
      const latest = draftRef.current
      if (latest && JSON.stringify(latest) === sent) {
        const mapped = fromNote(updated)
        const extras = current.checklist.filter((item) => !item.text.trim())
        if (extras.length) mapped.checklist = [...mapped.checklist, ...extras]
        draftRef.current = mapped
        dirtyRef.current = false
        setDraft(mapped)
      }
      setStatus(dirtyRef.current ? 'saving' : 'saved')
    } catch (error) {
      dirtyRef.current = true
      setStatus('error')
      toast(error instanceof Error ? error.message : '保存失败')
      throw error
    } finally {
      savingRef.current = false
      if (queuedRef.current) {
        queuedRef.current = false
        await flush()
      }
    }
  }, [id, toast, trashed])

  const schedule = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      void flush().catch(() => undefined)
    }, 650)
  }, [flush])

  function update(patch: Partial<Draft>) {
    if (!draftRef.current || trashed) return
    const next = { ...draftRef.current, ...patch }
    draftRef.current = next
    dirtyRef.current = true
    setDraft(next)
    schedule()
  }

  useEffect(() => {
    let alive = true
    readyRef.current = false
    setMissing(false)
    api
      .getNote(id)
      .then((note) => {
        if (!alive) return
        const mapped = fromNote(note)
        draftRef.current = mapped
        dirtyRef.current = false
        setDraft(mapped)
        setTrashed(Boolean(note.deletedAt))
        readyRef.current = true
        document.title = note.title ? `${note.title} · Bonnote` : '无标题 · Bonnote'
      })
      .catch(() => {
        if (alive) setMissing(true)
      })
    void Promise.all([api.folders(), api.tags()]).then(([nextFolders, nextTags]) => {
      if (!alive) return
      setFolders(nextFolders)
      setTags(nextTags)
    })
    return () => {
      alive = false
      document.title = 'Bonnote'
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [id])

  useEffect(() => {
    fit(titleRef.current)
    fit(bodyRef.current)
  }, [draft?.title, draft?.content])

  const shouldBlock = useCallback(() => {
    const current = draftRef.current
    if (!current || !readyRef.current) return false
    return dirtyRef.current || (freshRef.current && isBlank(current))
  }, [])
  const blocker = useBlocker(shouldBlock)

  const leaving = useRef(false)
  useEffect(() => {
    if (blocker.state !== 'blocked' || leaving.current) return
    leaving.current = true
    void (async () => {
      try {
        const current = draftRef.current
        if (timer.current) window.clearTimeout(timer.current)
        if (freshRef.current && current && isBlank(current)) {
          dirtyRef.current = false
          await api.destroyNote(id)
        } else {
          await flush()
        }
        blocker.proceed()
      } catch {
        leaving.current = false
        blocker.reset()
      }
    })()
  }, [blocker, flush, id])

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [])

  async function createLabel(value: { name: string; color: string; icon?: string }) {
    try {
      if (labelKind === 'folder') {
        const folder = await api.createFolder(value)
        setFolders((current) => [folder, ...current])
        update({ folderId: folder.id })
      } else if (labelKind === 'tag') {
        const tag = await api.createTag({ name: value.name, color: value.color })
        setTags((current) => [tag, ...current])
        update({ tagIds: [...(draftRef.current?.tagIds ?? []), tag.id] })
      }
      setLabelKind(null)
    } catch (error) {
      toast(error instanceof Error ? error.message : '创建失败')
    }
  }

  async function duplicate() {
    try {
      if (dirtyRef.current) await flush()
      const copy = await api.duplicateNote(id)
      setMoreOpen(false)
      navigate(`/notes/${copy.id}`)
    } catch (error) {
      toast(error instanceof Error ? error.message : '复制失败')
    }
  }

  async function copyAll() {
    if (!draft) return
    const lines = [
      draft.title,
      draft.content,
      ...draft.checklist.map((item) => `${item.done ? '☑' : '☐'} ${item.text}`),
    ].filter(Boolean)
    try {
      await copyText(lines.join('\n\n'))
      toast('已复制全文')
      setMoreOpen(false)
    } catch {
      toast('复制失败')
    }
  }

  async function removeNote() {
    try {
      await api.removeNote(id)
      freshRef.current = false
      dirtyRef.current = false
      navigate('/trash', { replace: true })
    } catch (error) {
      toast(error instanceof Error ? error.message : '删除失败')
    }
  }

  async function restore() {
    try {
      const note = await api.restoreNote(id)
      const mapped = fromNote(note)
      draftRef.current = mapped
      setDraft(mapped)
      setTrashed(false)
      toast('已从回收站取出')
    } catch (error) {
      toast(error instanceof Error ? error.message : '恢复失败')
    }
  }

  function addItem() {
    if (!draft) return
    update({ checklist: [...draft.checklist, { key: crypto.randomUUID(), text: '', done: false }] })
    window.requestAnimationFrame(() => {
      const inputs = listRef.current?.querySelectorAll('input')
      inputs?.[inputs.length - 1]?.focus()
    })
  }

  if (missing) {
    return (
      <div className="editor" style={{ background: '#F6F0E4' }}>
        <div className="editor-inner">
          <button className="icon-btn dark" type="button" onClick={() => navigate(-1)} aria-label="返回">
            <Icon name="back" />
          </button>
          <h1 className="editor-title">这张便签不在了</h1>
        </div>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="editor" style={{ background: '#F6F0E4' }}>
        <div className="editor-inner">
          <p className="muted-ink">正在展开纸页…</p>
        </div>
      </div>
    )
  }

  const words = draft.title.length + draft.content.length
  const statusText = status === 'saving' ? '保存中' : status === 'error' ? '未保存' : '已保存'
  const paper = paperColor(draft.color)
  const paperStyle = { background: paper, '--paper': paper } as CSSProperties

  return (
    <div className="editor" style={paperStyle}>
      <div className="editor-inner">
        <header className="editor-bar">
          <button className="icon-btn dark" type="button" aria-label="返回" onClick={() => navigate(-1)}>
            <Icon name="back" />
          </button>
          <span className={status === 'error' ? 'save-state bad' : 'save-state'}>{trashed ? '回收站' : statusText}</span>
          <button className={draft.pinned ? 'icon-btn dark on' : 'icon-btn dark'} type="button" aria-label="置顶" disabled={trashed} onClick={() => update({ pinned: !draft.pinned })}>
            <Icon name="pin" size={18} />
          </button>
          <button className={draft.favorite ? 'icon-btn dark on' : 'icon-btn dark'} type="button" aria-label="收藏" disabled={trashed} onClick={() => update({ favorite: !draft.favorite })}>
            <Icon name="heart" size={18} filled={draft.favorite} />
          </button>
          <button className="icon-btn dark" type="button" aria-label="更多" onClick={() => setMoreOpen(true)}>
            <Icon name="more" />
          </button>
        </header>

        {trashed ? (
          <div className="banner">
            <span>这张便签在回收站里。</span>
            <button className="btn btn-primary" type="button" onClick={() => void restore()}>
              恢复
            </button>
          </div>
        ) : null}

        <textarea
          ref={titleRef}
          className="editor-title"
          rows={1}
          value={draft.title}
          placeholder="无标题"
          maxLength={120}
          disabled={trashed}
          onChange={(event) => update({ title: event.target.value })}
        />
        <textarea
          ref={bodyRef}
          className="editor-body"
          rows={4}
          value={draft.content}
          placeholder="开始写…"
          maxLength={20000}
          disabled={trashed}
          onChange={(event) => update({ content: event.target.value })}
        />

        <div className="checks" ref={listRef}>
          {draft.checklist.map((item, index) => (
            <div className="check-row" key={item.key}>
              <button
                type="button"
                className={item.done ? 'check on' : 'check'}
                aria-label={item.done ? '标为未完成' : '标为完成'}
                disabled={trashed}
                onClick={() => {
                  const checklist = draft.checklist.map((row, rowIndex) => (rowIndex === index ? { ...row, done: !row.done } : row))
                  update({ checklist })
                }}
              >
                {item.done ? <Icon name="check" size={13} /> : null}
              </button>
              <input
                value={item.text}
                placeholder="待办事项"
                maxLength={300}
                disabled={trashed}
                onChange={(event) => {
                  const checklist = draft.checklist.map((row, rowIndex) => (rowIndex === index ? { ...row, text: event.target.value } : row))
                  update({ checklist })
                }}
              />
              <button
                className="mini-btn"
                type="button"
                aria-label="移除事项"
                disabled={trashed}
                onClick={() => update({ checklist: draft.checklist.filter((_, rowIndex) => rowIndex !== index) })}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
          {trashed ? null : (
            <button className="add-check" type="button" onClick={addItem}>
              <Icon name="plus" size={16} />
              添加事项
            </button>
          )}
        </div>

        <section className="meta-block">
          <p className="field-label">纸色</p>
          <div className="swatches">
            {PAPERS.map((paper) => (
              <button
                key={paper.id}
                type="button"
                className={draft.color === paper.id ? 'color-dot on' : 'color-dot'}
                style={{ background: paper.value }}
                aria-label={paper.label}
                disabled={trashed}
                onClick={() => update({ color: paper.id })}
              />
            ))}
          </div>
        </section>

        <section className="meta-block">
          <p className="field-label">笔记本</p>
          <div className="chips">
            <button className={!draft.folderId ? 'chip on' : 'chip'} type="button" disabled={trashed} onClick={() => update({ folderId: null })}>
              收集箱
            </button>
            {folders.map((folder) => (
              <button key={folder.id} className={draft.folderId === folder.id ? 'chip on' : 'chip'} type="button" disabled={trashed} onClick={() => update({ folderId: folder.id })}>
                {folder.icon} {folder.name}
              </button>
            ))}
            {trashed ? null : (
              <button className="chip" type="button" onClick={() => setLabelKind('folder')}>
                新建
              </button>
            )}
          </div>
        </section>

        <section className="meta-block">
          <p className="field-label">标签</p>
          <div className="chips">
            {tags.map((tag) => {
              const on = draft.tagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  className={on ? 'chip on' : 'chip'}
                  type="button"
                  disabled={trashed}
                  onClick={() => update({ tagIds: on ? draft.tagIds.filter((item) => item !== tag.id) : [...draft.tagIds, tag.id] })}
                >
                  <i style={{ background: tag.color }} />
                  {tag.name}
                </button>
              )
            })}
            {trashed ? null : (
              <button className="chip" type="button" onClick={() => setLabelKind('tag')}>
                新建
              </button>
            )}
          </div>
        </section>

        <label className="meta-block field">
          <span className="field-label">提醒</span>
          <input type="datetime-local" value={draft.remindAt} disabled={trashed} onChange={(event) => update({ remindAt: event.target.value })} />
        </label>
        <p className="word-count">{words} 字</p>
      </div>

      <Sheet open={moreOpen} title="更多" onClose={() => setMoreOpen(false)}>
        <div className="menu-list">
          <button type="button" onClick={() => update({ archived: !draft.archived })} disabled={trashed}>
            <Icon name="archive" size={18} />
            {draft.archived ? '取消归档' : '归档'}
          </button>
          <button type="button" onClick={() => void duplicate()} disabled={trashed}>
            <Icon name="copy" size={18} />
            复制一份
          </button>
          <button type="button" onClick={() => void copyAll()}>
            <Icon name="copy" size={18} />
            复制全文
          </button>
          <button className="danger" type="button" onClick={() => { setMoreOpen(false); setConfirmDelete(true) }} disabled={trashed}>
            <Icon name="trash" size={18} />
            移到回收站
          </button>
        </div>
      </Sheet>
      <CreateLabelSheet open={labelKind !== null} kind={labelKind ?? 'tag'} onClose={() => setLabelKind(null)} onSubmit={(value) => void createLabel(value)} />
      <ConfirmDialog
        open={confirmDelete}
        title="放到回收站？"
        body="之后还可以在回收站里找回。"
        confirmText="移动"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void removeNote()}
      />
    </div>
  )
}
