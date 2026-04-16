import useSessionStore from '../../../store/sessionStore'
import { formatTime } from '../../../lib/utils'
import SessionContractBanner from '../preflight/SessionContractBanner'

export default function SessionHeader({ session, onEndSession }) {
  const { elapsedMs, transcriptBuffer, sessionContract } = useSessionStore()
  const lastSegment = transcriptBuffer[transcriptBuffer.length - 1]

  return (
    <div>
      <SessionContractBanner contract={sessionContract} />
      <div className="px-4 py-2.5 flex items-center gap-4 border-b border-slate-700" style={{ background: 'var(--color-session-panel)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-slate-300">{session?.topic || 'Session'}</span>
        </div>

        <div className="flex-1 overflow-hidden">
          {lastSegment && (
            <p className="text-xs text-slate-500 truncate italic">
              <span className={`font-medium ${lastSegment.speaker_role === 'tutor' ? 'text-blue-400' : 'text-green-400'}`}>
                {lastSegment.speaker_role === 'tutor' ? 'Tutor' : 'Student'}:
              </span>{' '}
              {lastSegment.text}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-mono text-sm text-slate-400 tabular-nums">{formatTime(elapsedMs)}</span>
          {onEndSession && (
            <button
              onClick={onEndSession}
              className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-400 rounded-lg text-xs font-medium transition-colors"
            >
              End Session
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
