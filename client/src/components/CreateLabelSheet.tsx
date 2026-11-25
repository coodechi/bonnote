import { useEffect, useState } from 'react'
import { FOLDER_ICONS, SWATCHES } from '../palette.ts'
import { Sheet } from './Sheet.tsx'

export function CreateLabelSheet({
  open,
  kind,
  initial,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean
  kind: 'folder' | 'tag'
  initial?: { name: string; color: string; icon?: string }
  busy?: boolean
  onClose: () => void
  onSubmit: (value: { name: string; color: string; icon?: string }) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? SWATCHES[0])
  const [icon, setIcon] = useState(initial?.icon ?? '📒')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setColor(initial?.color ?? SWATCHES[0])
    setIcon(initial?.icon ?? '📒')
  }, [open, initial?.name, initial?.color, initial?.icon])

  return (
    <Sheet open={open} title={kind === 'folder' ? (initial ? '编辑笔记本' : '新的笔记本') : initial ? '编辑标签' : '新的标签'} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          onSubmit({ name: name.trim(), color, icon })
        }}
      >
        <label className="field">
          <span className="field-label">名称</span>
          <input value={name} maxLength={kind === 'folder' ? 24 : 16} onChange={(event) => setName(event.target.value)} placeholder={kind === 'folder' ? '比如：生活' : '比如：待办'} />
        </label>
        {kind === 'folder' ? (
          <div>
            <p className="field-label">图标</p>
            <div className="icon-pick">
              {FOLDER_ICONS.map((item) => (
                <button key={item} type="button" className={item === icon ? 'icon-pick-btn on' : 'icon-pick-btn'} onClick={() => setIcon(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div>
          <p className="field-label">颜色</p>
          <div className="swatches">
            {SWATCHES.map((item) => (
              <button
                key={item}
                type="button"
                className={item === color ? 'color-dot on' : 'color-dot'}
                style={{ background: item }}
                aria-label={item}
                onClick={() => setColor(item)}
              />
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy || !name.trim()}>
          保存
        </button>
      </form>
    </Sheet>
  )
}
