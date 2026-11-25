import { useEffect, useState } from 'react'
import { api } from '../api.ts'
import { ConfirmDialog } from '../components/Sheet.tsx'
import { EmptyState } from '../components/EmptyState.tsx'
import { NoteCard } from '../components/NoteCard.tsx'
import { useToast } from '../context/ToastContext.tsx'
import type { Note } from '../types.ts'

export function TrashPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [pending, setPending] = useState<Note | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const result = await api.listNotes({ status: 'trash', page: 1, pageSize: 50 })
      setItems(result.items)
    } catch (error) {
      toast(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function restore(note: Note) {
    try {
      await api.restoreNote(note.id)
      setItems((current) => current.filter((item) => item.id !== note.id))
      toast('已恢复')
    } catch (error) {
      toast(error instanceof Error ? error.message : '恢复失败')
    }
  }

  async function destroy() {
    if (!pending) return
    setBusy(true)
    try {
      await api.destroyNote(pending.id)
      setItems((current) => current.filter((item) => item.id !== pending.id))
      setPending(null)
    } catch (error) {
      toast(error instanceof Error ? error.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  async function empty() {
    setBusy(true)
    try {
      await api.emptyTrash()
      setItems([])
      setConfirmEmpty(false)
      toast('回收站已清空')
    } catch (error) {
      toast(error instanceof Error ? error.message : '清空失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">删掉的东西先放在这里</p>
          <h1>回收站</h1>
        </div>
        {items.length ? (
          <button className="text-btn danger" type="button" onClick={() => setConfirmEmpty(true)}>
            清空
          </button>
        ) : null}
      </header>
      {items.length ? (
        <div className="note-grid">
          {items.map((note) => (
            <NoteCard key={note.id} note={note} onRestore={restore} onDestroy={setPending} />
          ))}
        </div>
      ) : loading ? (
        <div className="skeleton-card" />
      ) : (
        <EmptyState title="回收站是空的" text="放进来的便签可以恢复，也可以彻底删除。" />
      )}
      <ConfirmDialog open={pending !== null} title="彻底删除？" body="删除后无法恢复。" confirmText="删除" danger busy={busy} onClose={() => setPending(null)} onConfirm={() => void destroy()} />
      <ConfirmDialog open={confirmEmpty} title="清空回收站？" body="里面的便签都会被永久删除。" confirmText="清空" danger busy={busy} onClose={() => setConfirmEmpty(false)} onConfirm={() => void empty()} />
    </div>
  )
}
