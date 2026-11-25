import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.ts'
import { ConfirmDialog } from '../components/Sheet.tsx'
import { CreateLabelSheet } from '../components/CreateLabelSheet.tsx'
import { EmptyState } from '../components/EmptyState.tsx'
import { Icon } from '../components/Icon.tsx'
import { useToast } from '../context/ToastContext.tsx'
import type { Folder, Tag } from '../types.ts'

export function LibraryPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [tab, setTab] = useState<'folder' | 'tag'>('folder')
  const [folders, setFolders] = useState<Folder[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState<{ kind: 'folder' | 'tag'; target?: Folder | Tag } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'folder' | 'tag'; id: string; name: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [nextFolders, nextTags] = await Promise.all([api.folders(), api.tags()])
      setFolders(nextFolders)
      setTags(nextTags)
    } catch (error) {
      toast(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function save(value: { name: string; color: string; icon?: string }) {
    if (!sheet) return
    setBusy(true)
    try {
      if (sheet.kind === 'folder') {
        const target = sheet.target as Folder | undefined
        if (target) await api.updateFolder(target.id, value)
        else await api.createFolder(value)
      } else {
        const target = sheet.target as Tag | undefined
        if (target) await api.updateTag(target.id, { name: value.name, color: value.color })
        else await api.createTag({ name: value.name, color: value.color })
      }
      setSheet(null)
      await load()
    } catch (error) {
      toast(error instanceof Error ? error.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!pendingDelete) return
    setBusy(true)
    try {
      if (pendingDelete.kind === 'folder') await api.removeFolder(pendingDelete.id)
      else await api.removeTag(pendingDelete.id)
      setPendingDelete(null)
      await load()
    } catch (error) {
      toast(error instanceof Error ? error.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">把纸页归到一处</p>
          <h1>笔记本</h1>
        </div>
        <button className="icon-btn" type="button" aria-label="新建" onClick={() => setSheet({ kind: tab })}>
          <Icon name="plus" />
        </button>
      </header>
      <div className="seg page-seg">
        <button className={tab === 'folder' ? 'on' : ''} type="button" onClick={() => setTab('folder')}>
          笔记本
        </button>
        <button className={tab === 'tag' ? 'on' : ''} type="button" onClick={() => setTab('tag')}>
          标签
        </button>
      </div>

      {tab === 'folder' ? (
        folders.length ? (
          <div className="folder-grid">
            {folders.map((folder) => (
              <article key={folder.id} className="folder-card" onClick={() => navigate(`/notes?folderId=${folder.id}`)}>
                <div className="folder-top">
                  <span className="folder-icon" style={{ background: folder.color }}>{folder.icon}</span>
                  <button
                    className="mini-btn"
                    type="button"
                    aria-label="编辑笔记本"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSheet({ kind: 'folder', target: folder })
                    }}
                  >
                    <Icon name="more" size={16} />
                  </button>
                </div>
                <h3>{folder.name}</h3>
                <p>{folder.count} 则笔记</p>
                <button
                  className="text-btn danger"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setPendingDelete({ kind: 'folder', id: folder.id, name: folder.name })
                  }}
                >
                  删除
                </button>
              </article>
            ))}
          </div>
        ) : loading ? (
          <div className="skeleton-card" />
        ) : (
          <EmptyState title="还没有笔记本" text="生活、工作、灵感，各放一处。" action={<button className="btn btn-primary" type="button" onClick={() => setSheet({ kind: 'folder' })}>建一本</button>} />
        )
      ) : tags.length ? (
        <div className="tag-list">
          {tags.map((tag) => (
            <div className="tag-row" key={tag.id}>
              <button className="tag-main" type="button" onClick={() => navigate(`/notes?tagId=${tag.id}`)}>
                <i style={{ background: tag.color }} />
                <span>{tag.name}</span>
                <small>{tag.count}</small>
              </button>
              <button className="mini-btn" type="button" aria-label="编辑标签" onClick={() => setSheet({ kind: 'tag', target: tag })}>
                <Icon name="more" size={16} />
              </button>
              <button className="mini-btn" type="button" aria-label="删除标签" onClick={() => setPendingDelete({ kind: 'tag', id: tag.id, name: tag.name })}>
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : loading ? (
        <div className="skeleton-card" />
      ) : (
        <EmptyState title="还没有标签" text="给常写的事一个轻轻的记号。" action={<button className="btn btn-primary" type="button" onClick={() => setSheet({ kind: 'tag' })}>添加标签</button>} />
      )}

      <CreateLabelSheet
        open={sheet !== null}
        kind={sheet?.kind ?? 'folder'}
        busy={busy}
        initial={
          sheet?.target
            ? { name: sheet.target.name, color: sheet.target.color, icon: 'icon' in sheet.target ? sheet.target.icon : '📒' }
            : undefined
        }
        onClose={() => setSheet(null)}
        onSubmit={(value) => void save(value)}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.kind === 'folder' ? '删除笔记本？' : '删除标签？'}
        body={pendingDelete?.kind === 'folder' ? `「${pendingDelete.name}」里的笔记会回到收集箱，不会被删掉。` : `笔记还会留着，只是不再带有「${pendingDelete?.name ?? ''}」。`}
        confirmText="删除"
        danger
        busy={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void remove()}
      />
    </div>
  )
}
