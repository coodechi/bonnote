export const PAPERS = [
  { id: 'ivory', label: '象牙', value: '#F6F0E4' },
  { id: 'butter', label: '黄油', value: '#F8E7A2' },
  { id: 'blush', label: '胭脂', value: '#F6C7BE' },
  { id: 'mint', label: '薄荷', value: '#CDE7D4' },
  { id: 'sky', label: '晴空', value: '#C9DFF5' },
  { id: 'lilac', label: '丁香', value: '#E3D4F4' },
  { id: 'peach', label: '蜜桃', value: '#F8D3B0' },
  { id: 'sage', label: '苔绿', value: '#D7DCC4' },
] as const

export const SWATCHES = ['#E07A4C', '#D4A017', '#5E8C61', '#3E7CB1', '#7A5EA7', '#C45C6A', '#8C6A4F']

export const FOLDER_ICONS = ['📒', '🌿', '💼', '✨', '☕', '🌙', '📌', '🎯', '📚', '❤️', '🧳', '🎵']

export function paperColor(id: string) {
  return PAPERS.find((item) => item.id === id)?.value ?? PAPERS[0].value
}
