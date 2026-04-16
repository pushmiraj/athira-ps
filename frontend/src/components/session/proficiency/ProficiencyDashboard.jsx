import useSessionStore from '../../../store/sessionStore'
import TrafficLight from './TrafficLight'
import ConfidenceMatrix from './ConfidenceMatrix'

export default function ProficiencyDashboard() {
  const { proficiency, sessionContract } = useSessionStore()

  if (proficiency.length === 0) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Proficiency Dashboard</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-xs text-slate-500">Waiting for student to complete check-in…</p>
          <div className="flex items-center justify-center gap-1 mt-3">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  const dangerZone = proficiency.filter(p => p.quadrant === 'danger_zone')

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Proficiency Dashboard</h3>

      {dangerZone.length > 0 && (
        <div className="rounded-xl bg-purple-900/30 border border-purple-600/50 p-3">
          <p className="text-xs font-semibold text-purple-300 mb-2">⚠️ Danger Zone — Prioritize These</p>
          {dangerZone.map(p => (
            <p key={p.sub_topic} className="text-xs text-purple-200 mb-1 pulse-danger inline-block mr-2">• {p.sub_topic}</p>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {proficiency.map(p => (
          <TrafficLight
            key={p.sub_topic}
            subTopic={p.sub_topic}
            quadrant={p.quadrant}
            trafficLight={p.traffic_light}
            avgConfidence={p.avg_confidence}
          />
        ))}
      </div>

      <ConfidenceMatrix proficiency={proficiency} />
    </div>
  )
}
