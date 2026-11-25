const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

export function formatToday(date = new Date()) {
  return `${date.getMonth() + 1}月${date.getDate()}日 · ${WEEKDAYS[date.getDay()]}`
}

export function greeting(name: string, date = new Date()) {
  const hour = date.getHours()
  const prefix = hour < 5 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'
  return `${prefix}，${name}`
}

export function formatRelative(iso: string) {
  const time = new Date(iso).getTime()
  const diff = Date.now() - time
  const minute = Math.floor(diff / 60000)
  if (minute < 1) return '刚刚'
  if (minute < 60) return `${minute} 分钟前`
  const hour = Math.floor(minute / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day === 1) return '昨天'
  if (day < 7) return `${day} 天前`
  const date = new Date(iso)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function formatRemind(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = Math.round((target.getTime() - start.getTime()) / 86400000)
  const clock = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  if (date.getTime() < Date.now() && day <= 0) return day === 0 ? `今天 ${clock} 已过` : '已过期'
  if (day === 0) return `今天 ${clock}`
  if (day === 1) return `明天 ${clock}`
  if (day === -1) return '昨天已过'
  return `${date.getMonth() + 1}月${date.getDate()}日 ${clock}`
}

export function isOverdue(iso?: string | null) {
  if (!iso) return false
  return new Date(iso).getTime() < Date.now()
}

export function formatCount(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)} 万`
  return String(value)
}

export function toLocalInput(iso?: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatMemberSince(iso: string) {
  const date = new Date(iso)
  return `${date.getFullYear()}年${date.getMonth() + 1}月加入`
}

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const area = document.createElement('textarea')
  area.value = text
  document.body.appendChild(area)
  area.select()
  document.execCommand('copy')
  area.remove()
}
