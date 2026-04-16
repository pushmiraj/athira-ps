import { MODALITY_META } from '../../../lib/utils'

export default function AnalogyCard({ modality, text, isHighlighted, onSendPoll, showSend }) {
  const meta = MODALITY_META[modality] || { icon: '💡', label: modality, color: '#6366F1' }

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isHighlighted
          ? 'border-2 bg-opacity-20'
          : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
      }`}
      style={isHighlighted ? { borderColor: meta.color, backgroundColor: `${meta.color}15` } : {}}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{meta.icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
          {meta.label}
        </span>
        {isHighlighted && (
          <span className="ml-auto text-xs bg-green-700/40 text-green-300 px-2 py-0.5 rounded-full">
            Student's pick ✓
          </span>
        )}
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
    </div>
  )
}
