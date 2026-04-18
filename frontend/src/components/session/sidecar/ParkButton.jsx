import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import * as WS from '../../../lib/wsEvents'
import useSessionStore from '../../../store/sessionStore'

export default function ParkButton({ send }) {
  const [isInputting, setIsInputting] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const { getLastSecondsTranscript, elapsedMs } = useSessionStore()

  function handleSubmit(e) {
    if (e) e.preventDefault()
    if (!questionText.trim()) return
    
    const transcriptContext = getLastSecondsTranscript(15)
    send(WS.QUESTION_PARKED, {
      question: questionText.trim(),
      transcript_context: transcriptContext,
      timestamp_ms: elapsedMs,
    })
    setIsInputting(false)
    setQuestionText('')
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsInputting(!isInputting)}
        title="Park a question"
        className="flex items-center justify-center gap-2 px-3 py-2.5 w-full btn-secondary font-medium text-[13px]"
      >
        <HelpCircle size={15} />
        <span>Park Question</span>
      </button>

      {isInputting && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-surface-container rounded-xl border border-outline-variant shadow-lg z-50">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="What's your doubt?"
              className="w-full text-sm p-2 bg-white rounded-md border border-[var(--color-outline-variant)] outline-none resize-none focus:border-primary text-on-surface"
              rows={3}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsInputting(false)} className="flex-1 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-black/5 rounded-md">Cancel</button>
              <button type="submit" disabled={!questionText.trim()} className="flex-1 py-1.5 text-xs font-semibold bg-primary text-white rounded-md disabled:opacity-50">Submit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
