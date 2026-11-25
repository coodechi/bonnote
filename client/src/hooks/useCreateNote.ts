import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.ts'
import { useToast } from '../context/ToastContext.tsx'

export function useCreateNote() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const lock = useRef(false)

  const createNote = useCallback(async () => {
    if (lock.current) return
    lock.current = true
    try {
      const note = await api.createNote({})
      navigate(`/notes/${note.id}?fresh=1`)
    } catch (error) {
      toast(error instanceof Error ? error.message : '创建失败')
    } finally {
      lock.current = false
    }
  }, [navigate, toast])

  return { createNote }
}
