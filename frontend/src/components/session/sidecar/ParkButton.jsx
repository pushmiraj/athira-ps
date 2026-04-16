import * as WS from '../../../lib/wsEvents'
import useSessionStore from '../../../store/sessionStore'

export default function ParkButton({ send }) {
  const { getLastSecondsTranscript, elapsedMs } = useSessionStore()

  function handlePark() {
    const transcriptContext = getLastSecondsTranscript(15)
    send(WS.QUESTION_PARKED, {
      transcript_context: transcriptContext,
      timestamp_ms: elapsedMs,
    })
  }

  return (
    <button
      onClick={handlePark}
      title="Park this question for later"
      className="flex items-center gap-2 px-4 py-2.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-xl text-sm font-medium transition-all hover:border-amber-500/60 w-full"
    >
      <span>🅿️ Park This Question</span>
    </button>
  )
}
