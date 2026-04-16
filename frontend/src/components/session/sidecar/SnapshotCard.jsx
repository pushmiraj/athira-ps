import { msToTimestamp } from '../../../lib/utils'

export default function SnapshotCard({ snapshot, index }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      {snapshot.whiteboard_png && (
        <img
          src={snapshot.whiteboard_png}
          alt="Whiteboard snapshot"
          className="w-full max-h-32 object-cover object-top border-b border-slate-700"
        />
      )}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-blue-400">
            {snapshot.ai_context_tag || `Snapshot ${index + 1}`}
          </span>
          <span className="text-xs text-slate-500">
            {msToTimestamp(snapshot.timestamp_ms)}
          </span>
        </div>

        {snapshot.transcript_snippet && (
          <p className="text-xs text-slate-400 italic leading-relaxed mb-2 line-clamp-2">
            "{snapshot.transcript_snippet}"
          </p>
        )}

        {snapshot.tutor_intent ? (
          <div className="flex items-start gap-2 bg-green-900/20 border border-green-700/40 rounded-lg px-2.5 py-2 mt-2">
            <span className="text-sm flex-shrink-0">💬</span>
            <p className="text-xs text-green-300 leading-relaxed">{snapshot.tutor_intent}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-600 italic">No tutor note yet</p>
        )}
      </div>
    </div>
  )
}
