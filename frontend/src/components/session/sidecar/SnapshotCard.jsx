import { msToTimestamp } from '../../../lib/utils'

export default function SnapshotCard({ snapshot, index }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {snapshot.whiteboard_png && (
        <div className="bg-slate-50 p-2 border-b border-slate-100 flex justify-center">
          <img
            src={snapshot.whiteboard_png}
            alt="Whiteboard snapshot"
            className="w-full max-h-32 object-contain object-center rounded-md border border-slate-200/60"
          />
        </div>
      )}
      <div className="p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-md">
            {snapshot.ai_context_tag || `Snapshot ${index + 1}`}
          </span>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            {msToTimestamp(snapshot.timestamp_ms)}
          </span>
        </div>

        {snapshot.transcript_snippet && (
          <p className="text-[13px] text-slate-600 italic leading-relaxed mb-2 line-clamp-2 border-l-2 border-slate-200 pl-2">
            "{snapshot.transcript_snippet}"
          </p>
        )}

        {snapshot.tutor_intent ? (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-2.5 py-2 mt-2">
            <span className="text-sm flex-shrink-0">💬</span>
            <p className="text-xs text-green-700 font-medium leading-relaxed">{snapshot.tutor_intent}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No tutor note yet</p>
        )}
      </div>
    </div>
  )
}
