import type { BackupFile, Folder, ImportResult, ListParams, Note, NoteInput, NoteList, Stats, Tag, User } from './types.ts'

export const TOKEN_KEY = 'bonnote-token'

const BASE = import.meta.env.VITE_API_BASE ?? ''

function queryString(params: object) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  const text = search.toString()
  return text ? `?${text}` : ''
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, { ...options, headers })
  } catch {
    throw new Error('网络异常，请确认服务已启动')
  }

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    window.dispatchEvent(new Event('bonnote-unauthorized'))
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string }
    throw new Error(body.message || '请求失败')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  sendEmailCode: (email: string, purpose: 'register' | 'change_email') =>
    request<{ previewCode?: string }>(purpose === 'register' ? '/api/auth/email-code' : '/api/auth/email-code/change', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  register: (email: string, password: string, nickname: string, code: string) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname, code }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>('/api/auth/me'),
  updateProfile: (nickname: string) =>
    request<User>('/api/auth/me', { method: 'PATCH', body: JSON.stringify({ nickname }) }),
  updateEmail: (email: string, code: string) =>
    request<User>('/api/auth/me/email', { method: 'PATCH', body: JSON.stringify({ email, code }) }),
  stats: () => request<Stats>('/api/notes/stats'),
  listNotes: (params: ListParams = {}) => request<NoteList>(`/api/notes${queryString(params)}`),
  getNote: (id: string) => request<Note>(`/api/notes/${id}`),
  createNote: (input: NoteInput) =>
    request<Note>('/api/notes', { method: 'POST', body: JSON.stringify(input) }),
  updateNote: (id: string, input: NoteInput) =>
    request<Note>(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  removeNote: (id: string) => request<Note>(`/api/notes/${id}`, { method: 'DELETE' }),
  restoreNote: (id: string) => request<Note>(`/api/notes/${id}/restore`, { method: 'POST' }),
  destroyNote: (id: string) => request<{ ok: boolean }>(`/api/notes/${id}/permanent`, { method: 'DELETE' }),
  emptyTrash: () => request<{ ok: boolean; count: number }>('/api/notes/trash', { method: 'DELETE' }),
  duplicateNote: (id: string) => request<Note>(`/api/notes/${id}/duplicate`, { method: 'POST' }),
  toggleCheck: (noteId: string, itemId: string, done: boolean) =>
    request<Note>(`/api/notes/${noteId}/checklist/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ done }),
    }),
  exportBackup: () => request<BackupFile>('/api/notes/export'),
  importBackup: (data: BackupFile) =>
    request<ImportResult>('/api/notes/import', { method: 'POST', body: JSON.stringify(data) }),
  folders: () => request<Folder[]>('/api/folders'),
  createFolder: (input: { name: string; icon?: string; color?: string }) =>
    request<Folder>('/api/folders', { method: 'POST', body: JSON.stringify(input) }),
  updateFolder: (id: string, input: { name: string; icon?: string; color?: string }) =>
    request<Folder>(`/api/folders/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  removeFolder: (id: string) => request<{ ok: boolean }>(`/api/folders/${id}`, { method: 'DELETE' }),
  tags: () => request<Tag[]>('/api/tags'),
  createTag: (input: { name: string; color?: string }) =>
    request<Tag>('/api/tags', { method: 'POST', body: JSON.stringify(input) }),
  updateTag: (id: string, input: { name: string; color?: string }) =>
    request<Tag>(`/api/tags/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  removeTag: (id: string) => request<{ ok: boolean }>(`/api/tags/${id}`, { method: 'DELETE' }),
}
