import { useEffect, useState } from 'react'
import { api } from '../api.ts'
import { useToast } from '../context/ToastContext.tsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function VerifyCodeField({
  email,
  purpose,
  value,
  onChange,
}: {
  email: string
  purpose: 'register' | 'change_email'
  value: string
  onChange: (value: string) => void
}) {
  const { toast } = useToast()
  const [wait, setWait] = useState(0)
  const [sending, setSending] = useState(false)
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setTimeout(() => setWait((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [wait])

  useEffect(() => {
    setHint('')
  }, [email])

  async function send() {
    const target = email.trim().toLowerCase()
    if (!emailPattern.test(target)) {
      toast('请输入有效的邮箱')
      return
    }
    setSending(true)
    try {
      const result = await api.sendEmailCode(target, purpose)
      setWait(60)
      if (result.previewCode) setHint(`邮件服务还没配置，本次验证码是 ${result.previewCode}`)
      else {
        setHint('验证码已发送，10 分钟内有效')
        toast('验证码已发送')
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : '验证码发送失败')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="field">
      <span className="field-label">邮箱验证码</span>
      <div className="inline-field">
        <input
          value={value}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="6 位数字"
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        <button className="btn btn-ghost" type="button" disabled={sending || wait > 0} onClick={() => void send()}>
          {sending ? '发送中…' : wait > 0 ? `${wait}s` : '获取验证码'}
        </button>
      </div>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  )
}
