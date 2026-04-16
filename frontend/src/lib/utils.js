export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function truncate(str, len = 80) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

export function msToTimestamp(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}m ${s}s`
}

export const QUADRANT_LABELS = {
  mastered:    { label: 'Mastered',    icon: '🟢', color: '#16A34A', bg: '#DCFCE7' },
  lucky_guess: { label: 'Lucky Guess', icon: '🟡', color: '#CA8A04', bg: '#FEF9C3' },
  known_gap:   { label: 'Known Gap',   icon: '🟠', color: '#DC2626', bg: '#FEE2E2' },
  danger_zone: { label: 'Danger Zone', icon: '🔴', color: '#7C3AED', bg: '#EDE9FE' },
}

export const TRAFFIC_COLORS = {
  green:  '#16A34A',
  yellow: '#CA8A04',
  red:    '#DC2626',
  danger: '#7C3AED',
}

export const MODALITY_META = {
  spatial:  { icon: '🌊', label: 'Spatial/Physical',    color: '#0EA5E9' },
  social:   { icon: '👥', label: 'Social/Narrative',    color: '#8B5CF6' },
  abstract: { icon: '📐', label: 'Mathematical/Abstract', color: '#F59E0B' },
}
