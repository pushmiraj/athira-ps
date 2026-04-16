import { useState, useEffect } from 'react'
import api from '../../../lib/api'
import { msToTimestamp } from '../../../lib/utils'

export default function StudyPackModal({ sessionId, onClose }) {
  const [data, setData] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api.get(`/study-pack/${sessionId}`).then(r => setData(r.data)).catch(() => {})
  }, [sessionId])

  async function handleExport() {
    setExporting(true)
    try {
      const response = await api.get(`/study-pack/${sessionId}/export`)
      const blob = new Blob([response.data], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `study-pack-${sessionId.slice(0, 8)}.html`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">📚 Your Study Pack</h2>
          <div className="flex gap-3">
            <button onClick={handleExport} disabled={exporting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {exporting ? 'Exporting…' : '⬇️ Download HTML'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl px-2">×</button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {!data ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400">Compiling your study pack…</p>
            </div>
          ) : (
            <>
              {data.session_contract && (
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-400 mb-1 uppercase tracking-wider">Session Contract</p>
                  <p className="text-sm text-blue-200">{data.session_contract}</p>
                </div>
              )}

              {data.snapshots?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">📸 Snapshots ({data.snapshots.length})</h3>
                  <div className="space-y-3">
                    {data.snapshots.map((s, i) => (
                      <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                        {s.whiteboard_png && (
                          <img src={s.whiteboard_png} alt="" className="w-full max-h-32 object-cover object-top" />
                        )}
                        <div className="p-3">
                          <p className="text-xs font-medium text-blue-400">{s.ai_context_tag}</p>
                          {s.transcript_snippet && (
                            <p className="text-xs text-slate-400 italic mt-1">"{s.transcript_snippet}"</p>
                          )}
                          {s.tutor_intent && (
                            <p className="text-xs text-green-300 mt-1.5">💬 {s.tutor_intent}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.parked_questions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">🅿️ Parked Questions ({data.parked_questions.length})</h3>
                  <div className="space-y-2">
                    {data.parked_questions.map((pq, i) => (
                      <div key={pq.id} className="bg-slate-800 border border-amber-700/30 rounded-xl p-3">
                        <p className="text-xs text-amber-400 font-medium mb-1">Question {i + 1} — {msToTimestamp(pq.timestamp_ms)}</p>
                        <p className="text-xs text-slate-400 italic">{pq.transcript_context}</p>
                        {pq.resolution_note && (
                          <p className="text-xs text-green-300 mt-1.5">✅ {pq.resolution_note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.reflection_notes?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">📝 Your Notes ({data.reflection_notes.length})</h3>
                  <div className="space-y-2">
                    {data.reflection_notes.map((n, i) => (
                      <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                        <p className="text-xs text-slate-300">{n.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
