import { QUADRANT_LABELS } from '../../../lib/utils'

const QUADRANTS = [
  { key: 'mastered',    label: 'Mastered',    desc: 'High confidence + Correct',  icon: '🟢', pos: 'top-right'   },
  { key: 'danger_zone', label: 'Danger Zone', desc: 'High confidence + Wrong',    icon: '⚠️', pos: 'top-left'    },
  { key: 'lucky_guess', label: 'Lucky Guess', desc: 'Low confidence + Correct',   icon: '🟡', pos: 'bottom-right' },
  { key: 'known_gap',   label: 'Known Gap',   desc: 'Low confidence + Wrong',     icon: '🟠', pos: 'bottom-left' },
]

export default function ConfidenceMatrix({ proficiency }) {
  // Group sub-topics by quadrant
  const grouped = {}
  QUADRANTS.forEach(q => { grouped[q.key] = [] })
  proficiency.forEach(p => {
    if (grouped[p.quadrant]) grouped[p.quadrant].push(p.sub_topic)
  })

  const quadrantStyles = {
    mastered:    { bg: 'bg-green-900/30',  border: 'border-green-700/50',  text: 'text-green-400',  color: '#16A34A' },
    danger_zone: { bg: 'bg-purple-900/40', border: 'border-purple-600/60', text: 'text-purple-300', color: '#7C3AED' },
    lucky_guess: { bg: 'bg-yellow-900/30', border: 'border-yellow-700/50', text: 'text-yellow-400', color: '#CA8A04' },
    known_gap:   { bg: 'bg-red-900/30',    border: 'border-red-700/50',    text: 'text-red-400',    color: '#DC2626' },
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Confidence Matrix</h4>
      </div>

      {/* Axis labels */}
      <div className="relative">
        <div className="absolute -top-4 left-0 right-0 flex justify-around text-xs text-slate-500">
          <span>↑ High Confidence</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Top-left: Danger Zone (high confidence + wrong) */}
        <QuadrantCell q={QUADRANTS[1]} items={grouped.danger_zone} style={quadrantStyles.danger_zone} />
        {/* Top-right: Mastered (high confidence + correct) */}
        <QuadrantCell q={QUADRANTS[0]} items={grouped.mastered} style={quadrantStyles.mastered} />
        {/* Bottom-left: Known Gap (low confidence + wrong) */}
        <QuadrantCell q={QUADRANTS[3]} items={grouped.known_gap} style={quadrantStyles.known_gap} />
        {/* Bottom-right: Lucky Guess (low confidence + correct) */}
        <QuadrantCell q={QUADRANTS[2]} items={grouped.lucky_guess} style={quadrantStyles.lucky_guess} />
      </div>

      {/* Axis labels */}
      <div className="flex justify-between text-xs text-slate-500 px-1">
        <span>Wrong ←</span>
        <span>→ Correct</span>
      </div>
    </div>
  )
}

function QuadrantCell({ q, items, style }) {
  return (
    <div className={`rounded-xl border p-3 min-h-[80px] ${style.bg} ${style.border}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">{q.icon}</span>
        <span className={`text-xs font-semibold ${style.text}`}>{q.label}</span>
        {q.key === 'danger_zone' && (
          <span className="ml-auto text-xs bg-purple-600/40 text-purple-200 px-1.5 py-0.5 rounded-full">Priority</span>
        )}
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map(topic => (
            <li key={topic} className={`text-xs truncate ${style.text} opacity-80`}>• {topic}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-600 italic">None</p>
      )}
    </div>
  )
}
