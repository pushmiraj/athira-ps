import { useState } from 'react'
import useTutorIntent from '../../../hooks/useTutorIntent'
import useSidecarStore from '../../../store/sidecarStore'
import * as WS from '../../../lib/wsEvents'

export default function TutorIntentToast({ send }) {
  const { pendingIntentSnapshot, intentCountdown, clearPendingIntent } = useTutorIntent()
  const [intentText, setIntentText] = useState('')

  if (!pendingIntentSnapshot) return null

  function handleSend() {
    if (!intentText.trim()) return
    send(WS.TUTOR_INTENT_ADDED, {
      snapshot_id: pendingIntentSnapshot.snapshot_id,
      intent_text: intentText.trim(),
    })
    setIntentText('')
    clearPendingIntent()
  }

  function handleDismiss() {
    setIntentText('')
    clearPendingIntent()
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-4 slide-in-right">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-white">📸 Student captured this moment</p>
          {pendingIntentSnapshot.context_tag && (
            <p className="text-xs text-slate-400 mt-0.5">{pendingIntentSnapshot.context_tag}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold tabular-nums ${intentCountdown <= 3 ? 'text-red-400' : 'text-slate-400'}`}>
            {intentCountdown}s
          </span>
          <button onClick={handleDismiss} className="text-slate-500 hover:text-slate-300 text-sm">×</button>
        </div>
      </div>

      {/* Countdown bar */}
      <div className="w-full h-1 bg-slate-700 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-1000"
          style={{ width: `${(intentCountdown / 10) * 100}%` }}
        />
      </div>

      <input
        type="text"
        value={intentText}
        onChange={e => setIntentText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSend()}
        placeholder="Add teaching intent… (press Enter)"
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-2"
        autoFocus
      />

      <div className="flex gap-2">
        <button onClick={handleDismiss}
          className="flex-1 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors">
          Skip
        </button>
        <button onClick={handleSend} disabled={!intentText.trim()}
          className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
          Add Tag
        </button>
      </div>
    </div>
  )
}
