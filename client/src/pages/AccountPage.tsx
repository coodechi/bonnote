import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon.tsx'
import { VerifyCodeField } from '../components/VerifyCodeField.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'

export function AccountPage() {
  const { user, updateProfile, updateEmail } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setNickname(user?.nickname ?? '')
  }, [user?.nickname])

  useEffect(() => {
    setEmail(user?.email ?? '')
    setCode('')
  }, [user?.email])

  const trimmed = nickname.trim()
  const nextEmail = email.trim().toLowerCase()
  const nicknameChanged = trimmed !== user?.nickname
  const emailChanged = nextEmail !== (user?.email ?? '')
  const canSave = Boolean(trimmed) && (nicknameChanged || (emailChanged && /^\d{6}$/.test(code)))

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSave) return
    setBusy(true)
    try {
      if (nicknameChanged) await updateProfile(trimmed)
      if (emailChanged) await updateEmail(nextEmail, code)
      toast(nicknameChanged && emailChanged ? '账号信息已更新' : emailChanged ? '邮箱已更新' : '昵称已更新')
    } catch (error) {
      toast(error instanceof Error ? error.message : '更新失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="title-row">
          <button className="icon-btn" type="button" aria-label="返回" onClick={() => navigate('/me')}>
            <Icon name="back" />
          </button>
          <div>
            <p className="eyebrow">我的</p>
            <h1>账号信息</h1>
          </div>
        </div>
      </header>

      <form className="account-form" onSubmit={onSubmit}>
        <div className="account-avatar" aria-hidden="true">
          <span className="avatar large">{(trimmed || user?.nickname || '我').slice(0, 1)}</span>
        </div>
        <label className="field">
          <span className="field-label">昵称</span>
          <input
            value={nickname}
            maxLength={20}
            autoComplete="nickname"
            placeholder="怎么称呼你"
            onChange={(event) => setNickname(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">登录邮箱</span>
          <input
            value={email}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            onChange={(event) => {
              setEmail(event.target.value)
              setCode('')
            }}
          />
        </label>
        {emailChanged ? <VerifyCodeField email={email} purpose="change_email" value={code} onChange={setCode} /> : null}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy || !canSave}>
          {busy ? '保存中…' : '保存'}
        </button>
      </form>
    </div>
  )
}
