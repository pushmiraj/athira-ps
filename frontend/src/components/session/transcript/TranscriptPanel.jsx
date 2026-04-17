import { useEffect, useRef } from 'react'
import useSessionStore from '../../../store/sessionStore'
import useAuthStore from '../../../store/authStore'

export default function TranscriptPanel({ interimText }) {
    const transcriptBuffer = useSessionStore(s => s.transcriptBuffer)
    const bottomRef = useRef(null)
    const isStudent = useAuthStore(s => s.user?.role) === 'student'

    // Auto-scroll to bottom on new segments
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [transcriptBuffer.length, interimText])

    if (transcriptBuffer.length === 0 && !interimText) {
        return (
            <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="text-2xl mb-2">🎙️</div>
                <p className="text-sm text-slate-400">Live transcript will appear here</p>
                <p className="text-xs text-slate-600 mt-1">Click "🎙 Start Listening" above to start</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="px-3 py-2 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Live Transcript
                    </span>
                    <span className="text-xs text-slate-600 ml-auto">{transcriptBuffer.length} segments</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5" style={{ maxHeight: '250px' }}>
                {transcriptBuffer.map((seg, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                        <span
                            className={`font-medium text-xs flex-shrink-0 mt-0.5 ${seg.speaker_role === 'tutor' ? 'text-blue-400' : 'text-green-400'
                                }`}
                        >
                            {seg.speaker_role === 'tutor' ? '👨‍🏫' : '👨‍🎓'}
                        </span>
                        <p className="text-slate-300 text-xs leading-relaxed">{seg.text}</p>
                    </div>
                ))}
                {interimText && (
                    <div className="flex gap-2 text-sm opacity-60">
                        <span
                            className={`font-medium text-xs flex-shrink-0 mt-0.5 ${!isStudent ? 'text-blue-400' : 'text-green-400'
                                }`}
                        >
                            {!isStudent ? '👨‍🏫' : '👨‍🎓'}
                        </span>
                        <p className="text-slate-400 text-xs leading-relaxed italic">{interimText}...</p>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    )
}
