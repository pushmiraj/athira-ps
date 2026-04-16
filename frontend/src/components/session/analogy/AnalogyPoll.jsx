import { useState } from 'react'
import useSidecarStore from '../../../store/sidecarStore'
import * as WS from '../../../lib/wsEvents'
import { MODALITY_META } from '../../../lib/utils'

export default function AnalogyPoll({ send }) {
  const { analogyPoll, selectedModality, selectModality, clearAnalogyPoll } = useSidecarStore()
  const [clicked, setClicked] = useState(false)

  if (!analogyPoll) return null

  function handleSelect(modality) {
    selectModality(modality)
    send(WS.ANALOGY_SELECTED, {
      analogy_log_id: analogyPoll.analogy_log_id,
      selection: modality,
    })
  }

  function handleClicked() {
    setClicked(true)
    send(WS.ANALOGY_WORKED, { analogy_log_id: analogyPoll.analogy_log_id })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-slate-800 border border-slate-600 rounded-2xl p-5 slide-in-right">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Which makes most sense to you?</h3>
          <button onClick={clearAnalogyPoll} className="text-slate-500 hover:text-slate-300">×</button>
        </div>

        <div className="space-y-2 mb-4">
          {['spatial', 'social', 'abstract'].map(modality => {
            const meta = MODALITY_META[modality]
            const isSelected = selectedModality === modality
            return (
              <button
                key={modality}
                onClick={() => handleSelect(modality)}
                className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-900/30 text-white'
                    : 'border-slate-700 bg-slate-700/40 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{meta.icon}</span>
                  <span className="text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>
                </div>
                <p className="text-xs leading-relaxed opacity-80">{analogyPoll[modality]}</p>
              </button>
            )
          })}
        </div>

        {selectedModality && !clicked && (
          <button
            onClick={handleClicked}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            ✅ This clicked!
          </button>
        )}

        {clicked && (
          <div className="text-center py-2">
            <p className="text-sm text-green-400 font-medium">Great! Your tutor knows this resonated.</p>
          </div>
        )}
      </div>
    </div>
  )
}
