import { useState } from 'react'
import { Camera } from 'lucide-react'
import * as WS from '../../../lib/wsEvents'
import useSessionStore from '../../../store/sessionStore'

export default function SnapshotButton({ send, getWhiteboardPng }) {
  const [isInputting, setIsInputting] = useState(false)
  const [noteText, setNoteText] = useState('')
  const { getLastSecondsTranscript, elapsedMs } = useSessionStore()

  function handleSubmit(e) {
    if (e) e.preventDefault()
    
    const whiteboardPng = getWhiteboardPng ? getWhiteboardPng() : null
    const transcriptSnippet = getLastSecondsTranscript(30)
    
    send(WS.SNAPSHOT_TAKEN, {
      note: noteText.trim(),
      whiteboard_png: whiteboardPng,
      transcript_snippet: transcriptSnippet,
      timestamp_ms: elapsedMs,
    })
    
    setIsInputting(false)
    setNoteText('')
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsInputting(!isInputting)}
        title="Capture this moment"
        className="flex items-center justify-center gap-2 px-3 py-2.5 w-full btn-secondary font-medium text-[13px]"
      >
        <Camera size={15} />
        <span>Snapshot</span>
      </button>

      {isInputting && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-surface-container rounded-xl border border-outline-variant shadow-lg z-50">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a reflection note? (optional)"
              className="w-full text-sm p-2 bg-white rounded-md border border-[var(--color-outline-variant)] outline-none resize-none focus:border-primary text-on-surface"
              rows={3}
            />
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setIsInputting(false)} className="flex-1 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-black/5 rounded-md">Cancel</button>
              <button type="submit" className="flex-1 py-1.5 text-xs font-semibold bg-primary text-white rounded-md">Capture</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
