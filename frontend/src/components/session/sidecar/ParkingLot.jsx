import useSidecarStore from '../../../store/sidecarStore'
import { msToTimestamp } from '../../../lib/utils'

export default function ParkingLot() {
  const { parkedQuestions } = useSidecarStore()

  if (parkedQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="text-3xl mb-3">🅿️</span>
        <p className="text-sm text-slate-500">No questions parked yet.</p>
        <p className="text-xs text-slate-600 mt-1">Tap "Park This Question" when you want to come back to something.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 mb-3">{parkedQuestions.length} question{parkedQuestions.length !== 1 ? 's' : ''} parked</p>
      {parkedQuestions.map((pq, i) => (
        <div key={pq.parked_id || i} className="bg-slate-800/50 border border-amber-700/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-400">❓ Question {i + 1}</span>
            <span className="text-xs text-slate-500">{msToTimestamp(pq.timestamp_ms)}</span>
          </div>
          {pq.transcript_context && (
            <p className="text-xs text-slate-400 italic line-clamp-2">"{pq.transcript_context}"</p>
          )}
          {pq.resolution_note && (
            <div className="mt-2 bg-green-900/20 border border-green-700/30 rounded-lg p-2">
              <p className="text-xs text-green-300">✅ {pq.resolution_note}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
