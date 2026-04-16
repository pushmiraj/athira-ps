import { QUADRANT_LABELS } from '../../../lib/utils'

export default function TrafficLight({ subTopic, quadrant, trafficLight, avgConfidence }) {
  const meta = QUADRANT_LABELS[quadrant] || QUADRANT_LABELS.known_gap

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700">
      <div
        className={`w-3 h-3 rounded-full flex-shrink-0 ${quadrant === 'danger_zone' ? 'pulse-danger' : ''}`}
        style={{ backgroundColor: meta.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{subTopic}</p>
        <p className="text-xs mt-0.5" style={{ color: meta.color }}>{meta.icon} {meta.label}</p>
      </div>
      {avgConfidence && (
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-400">Confidence</p>
          <p className="text-xs font-semibold text-slate-300">{avgConfidence.toFixed(1)}/5</p>
        </div>
      )}
    </div>
  )
}
