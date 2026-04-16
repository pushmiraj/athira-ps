import { useState } from 'react'
import useSidecarStore from '../../../store/sidecarStore'
import * as WS from '../../../lib/wsEvents'
import AnalogyCard from './AnalogyCard'
import HelpExplainButton from './HelpExplainButton'

export default function AnalogyPanel({ send }) {
  const { analogies, setAnalogies } = useSidecarStore()
  const [pollSent, setPollSent] = useState(false)

  function handleSendPoll() {
    if (!analogies) return
    send(WS.ANALOGY_POLL_SEND, { analogy_log_id: analogies.analogy_log_id })
    setPollSent(true)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Analogy Engine</h3>
      </div>

      <HelpExplainButton send={send} />

      {analogies && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Based on the last 2 minutes of transcript:</p>
          {['spatial', 'social', 'abstract'].map(modality => (
            <AnalogyCard
              key={modality}
              modality={modality}
              text={analogies[modality]}
              isHighlighted={analogies.highlight === modality}
            />
          ))}

          {!pollSent ? (
            <button
              onClick={handleSendPoll}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Send to Student as Poll
            </button>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-green-400">✓ Poll sent to student</p>
              {analogies.highlight && (
                <p className="text-xs text-slate-400 mt-1">
                  Student picked: <span className="font-semibold text-slate-200">{analogies.highlight}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
