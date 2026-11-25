import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { VerifyCodeField } from '../components/VerifyCodeField.tsx'
import { useAuth } from '../context/AuthContext.tsx'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login'
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!isLogin && !/^\d{6}$/.test(code)) {
      setError('请先获取并填写邮箱验证码')
      return
    }
    setBusy(true)
    try {
      if (isLogin) await login(email, password)
      else await register(email, password, nickname, code)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-bg" aria-hidden="true">
        <span className="float-note a" />
        <span className="float-note b" />
        <span className="float-note c" />
      </div>
      <section className="auth-copy">
        <div className="brand">
          <span className="brand-mark" />
          Bonnote
        </div>
        <h1>把念头，轻轻放下。</h1>
        <p>一张可以随身带着的纸。写下清单、摘一句、记下明天要做的小事。</p>
      </section>
      <section className="auth-card">
        <h2>{isLogin ? '欢迎回来' : '开始使用'}</h2>
        <form className="stack" onSubmit={onSubmit}>
          {isLogin ? null : (
            <label className="field">
              <span className="field-label">昵称</span>
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={20} placeholder="怎么称呼你" autoComplete="nickname" />
            </label>
          )}
          <label className="field">
            <span className="field-label">邮箱</span>
            <input
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (!isLogin) setCode('')
              }}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          {isLogin ? null : <VerifyCodeField email={email} purpose="register" value={code} onChange={setCode} />}
          <label className="field">
            <span className="field-label">密码</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="至少 6 位" />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? '请稍等…' : isLogin ? '进入' : '创建账号'}
          </button>
        </form>
        {isLogin && import.meta.env.VITE_DEMO_EMAIL && import.meta.env.VITE_DEMO_PASSWORD ? (
          <button
            className="text-btn"
            type="button"
            onClick={() => {
              setEmail(import.meta.env.VITE_DEMO_EMAIL)
              setPassword(import.meta.env.VITE_DEMO_PASSWORD)
            }}
          >
            填入演示账号
          </button>
        ) : null}
        <p className="auth-switch">
          {isLogin ? '还没有账号？' : '已经有账号了？'}
          <Link to={isLogin ? '/register' : '/login'}>{isLogin ? '注册' : '登录'}</Link>
        </p>
      </section>
    </div>
  )
}
