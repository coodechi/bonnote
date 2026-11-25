import { useNavigate } from 'react-router-dom'
import { formatRelative, formatRemind, isOverdue } from '../format.ts'
import { paperColor } from '../palette.ts'
import type { Note } from '../types.ts'
import { Icon } from './Icon.tsx'

export function NoteCard({
  note,
  layout = 'card',
  onTogglePin,
  onToggleCheck,
  onRestore,
  onDestroy,
}: {
  note: Note
  layout?: 'card' | 'list'
  onTogglePin?: (note: Note) => void
  onToggleCheck?: (note: Note, itemId: string, done: boolean) => void
  onRestore?: (note: Note) => void
  onDestroy?: (note: Note) => void
}) {
  const navigate = useNavigate()
  const preview = note.checklist.slice(0, 3)
  const rest = note.checklist.length - preview.length
  const done = note.checklist.filter((item) => item.done).length

  return (
    <article
      className={layout === 'list' ? 'note-card is-list' : 'note-card'}
      style={{ background: paperColor(note.color) }}
      onClick={() => navigate(`/notes/${note.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') navigate(`/notes/${note.id}`)
      }}
      role="link"
      tabIndex={0}
    >
      <span className="tape" aria-hidden="true" />
      <div className="note-card-top">
        <div className="note-flags">
          {note.pinned ? <span className="pin-dot" title="已置顶" /> : null}
          {note.favorite ? <Icon name="heart" size={15} filled /> : null}
          {note.remindAt ? (
            <span className={isOverdue(note.remindAt) ? 'badge badge-late' : 'badge'}>{formatRemind(note.remindAt)}</span>
          ) : null}
        </div>
        {onTogglePin ? (
          <button
            className={note.pinned ? 'mini-btn on' : 'mini-btn'}
            type="button"
            aria-label={note.pinned ? '取消置顶' : '置顶'}
            onClick={(event) => {
              event.stopPropagation()
              onTogglePin(note)
            }}
          >
            <Icon name="pin" size={16} />
          </button>
        ) : null}
      </div>
      <h3 className="note-card-title">{note.title || '无标题'}</h3>
      {note.content ? <p className="note-card-body">{note.content}</p> : null}
      {preview.length ? (
        <ul className="note-card-checks">
          {preview.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={item.done ? 'check on' : 'check'}
                aria-label={item.done ? '标为未完成' : '标为完成'}
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleCheck?.(note, item.id, !item.done)
                }}
              >
                {item.done ? <Icon name="check" size={12} /> : null}
              </button>
              <span className={item.done ? 'done' : ''}>{item.text}</span>
            </li>
          ))}
          {rest > 0 ? <li className="more">还有 {rest} 项</li> : null}
        </ul>
      ) : null}
      <footer className="note-card-foot">
        <span>{note.folder ? `${note.folder.icon} ${note.folder.name}` : '收集箱'}</span>
        <span>{note.checklist.length ? `${done}/${note.checklist.length}` : formatRelative(note.updatedAt)}</span>
      </footer>
      {onRestore || onDestroy ? (
        <div className="note-card-actions">
          {onRestore ? (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onRestore(note)
              }}
            >
              恢复
            </button>
          ) : null}
          {onDestroy ? (
            <button
              className="btn btn-danger"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onDestroy(note)
              }}
            >
              删除
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
