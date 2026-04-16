import { Camera } from 'lucide-react'
import * as WS from '../../../lib/wsEvents'
import useSessionStore from '../../../store/sessionStore'

export default function SnapshotButton({ send, getWhiteboardPng }) {
  const { getLastSecondsTranscript, elapsedMs } = useSessionStore()

  function handleSnapshot() {
    const whiteboardPng = getWhiteboardPng ? getWhiteboardPng() : null
    const transcriptSnippet = getLastSecondsTranscript(30)
    send(WS.SNAPSHOT_TAKEN, {
      whiteboard_png: whiteboardPng,
      transcript_snippet: transcriptSnippet,
      timestamp_ms: elapsedMs,
    })
  }

  return (
    <button
      onClick={handleSnapshot}
      title="Capture this moment"
      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-xl text-sm font-medium transition-all hover:border-blue-500/60 w-full"
    >
      <Camera size={15} />
      <span>📸 Snapshot</span>
    </button>
  )
}
