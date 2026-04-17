import useSidecarStore from '../../../store/sidecarStore'
import { msToTimestamp } from '../../../lib/utils'

export default function ParkingLot() {
  const { parkedQuestions } = useSidecarStore()

  if (parkedQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mb-3">
          <span className="text-2xl">🅿️</span>
        </div>
        <h3 className="text-slate-700 font-medium text-sm">No parked questions.</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[180px]">Ask a question and tap park to save it here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wider">{parkedQuestions.length} question{parkedQuestions.length !== 1 ? 's' : ''} parked</p>
      {parkedQuestions.map((pq, i) => (
        <div key={pq.parked_id || i} className="bg-white border border-amber-200 shadow-sm rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 px-2 py-0.5 bg-amber-50 rounded-md">
              ❓ Question {i + 1}
            </span>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {msToTimestamp(pq.timestamp_ms)}
            </span>
          </div>
          {pq.transcript_context && (
            <p className="text-[13px] text-slate-600 italic leading-relaxed border-l-2 border-slate-200 pl-2">
              "{pq.transcript_context}"
            </p>
          )}
          {pq.resolution_note && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2.5">
              <p className="text-xs text-green-700 font-medium">✅ {pq.resolution_note}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
