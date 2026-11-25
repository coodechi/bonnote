export interface User {
  id: string
  email: string
  nickname: string
  createdAt: string
}

export interface Folder {
  id: string
  name: string
  icon: string
  color: string
  count: number
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
  count: number
  createdAt: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
  order: number
}

export interface NoteFolder {
  id: string
  name: string
  icon: string
  color: string
}

export interface NoteTag {
  id: string
  name: string
  color: string
}

export interface Note {
  id: string
  title: string
  content: string
  color: string
  pinned: boolean
  archived: boolean
  favorite: boolean
  remindAt: string | null
  deletedAt: string | null
  folderId: string | null
  folder: NoteFolder | null
  tags: NoteTag[]
  checklist: ChecklistItem[]
  createdAt: string
  updatedAt: string
}

export interface NoteList {
  items: Note[]
  total: number
  page: number
  pageSize: number
}

export interface Stats {
  total: number
  pinned: number
  favorite: number
  archived: number
  trash: number
  today: number
  characters: number
  reminders: Note[]
}

export interface NoteInput {
  title?: string
  content?: string
  color?: string
  pinned?: boolean
  archived?: boolean
  favorite?: boolean
  remindAt?: string | null
  folderId?: string | null
  tagIds?: string[]
  checklist?: { text: string; done?: boolean }[]
}

export type NoteStatus = 'active' | 'favorite' | 'archived' | 'trash' | 'pinned'
export type NoteSort = 'updated' | 'created' | 'title'

export interface ListParams {
  q?: string
  status?: NoteStatus
  sort?: NoteSort
  folderId?: string
  tagId?: string
  color?: string
  scope?: 'today' | 'remind'
  page?: number
  pageSize?: number
}

export interface BackupFile {
  version?: number
  folders?: { name: string; icon?: string; color?: string }[]
  tags?: { name: string; color?: string }[]
  notes?: unknown[]
}

export interface ImportResult {
  folders: number
  tags: number
  notes: number
}
