import { useEffect, useRef } from 'react'
import useSessionStore from '../../../store/sessionStore'
import useAuthStore from '../../../store/authStore'

export default function TranscriptPanel({ interimText, error }) {
    const transcriptBuffer = useSessionStore(s => s.transcriptBuffer)
    const bottomRef = useRef(null)
    const isStudent = useAuthStore(s => s.user?.role) === 'student'

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [transcriptBuffer.length, interimText])

    return (
        <div className="flex flex-col">
            {/* Error Banner */}
            {error && (
                <div className="mx-3 mt-2 mb-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <p className="text-xs text-red-600 leading-relaxed font-medium">{error}</p>
                </div>
            )}

            {/* Empty State */}
            {!error && transcriptBuffer.length === 0 && !interimText && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="text-2xl mb-2 grayscale opacity-60">🎙️</div>
                    <p className="text-sm text-slate-500 font-medium">Live transcript will appear here</p>
                    <p className="text-xs text-slate-500 mt-1">Click "🎙 Start Listening" above to start</p>
                </div>
            )}

            {/* Transcript Segments */}
            {transcriptBuffer.length > 0 && (
                <div className="overflow-y-auto px-3 py-2 space-y-2 mb-2" style={{ maxHeight: '220px' }}>
                    {transcriptBuffer.map((seg, i) => {
                        const isProcessed = seg.processed_text !== null && seg.processed_text !== undefined
                        const isProcessing = seg.processed_text === null  // null = waiting for Groq
                        const displayText = isProcessed ? seg.processed_text : seg.text

                        return (
                            <div key={i} className="flex gap-2.5">
                                {/* Speaker icon */}
                                <span className={`text-xs flex-shrink-0 mt-0.5 ${seg.speaker_role === 'tutor' ? 'text-indigo-500' : 'text-green-600'}`}>
                                    {seg.speaker_role === 'tutor' ? '👨‍🏫' : '👨‍🎓'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    {/* Processed text (or raw while waiting) */}
                                    <p className={`text-[13px] leading-relaxed ${isProcessed ? 'text-slate-800' : 'text-slate-500 italic'}`}>
                                        {displayText}
                                    </p>
                                    {/* Processing badge */}
                                    {isProcessing && (
                                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-blue-500 font-medium opacity-80">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                            cleaning…
                                        </span>
                                    )}
                                    {/* Cleaned badge */}
                                    {isProcessed && seg.text !== seg.processed_text && (
                                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-green-600 font-medium opacity-80">
                                            ✓ cleaned by AI
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {/* Interim (live typing) line */}
                    {interimText && (
                        <div className="flex gap-2.5 opacity-60">
                            <span className={`text-xs flex-shrink-0 mt-0.5 ${!isStudent ? 'text-indigo-500' : 'text-green-600'}`}>
                                {!isStudent ? '👨‍🏫' : '👨‍🎓'}
                            </span>
                            <p className="text-slate-500 text-[13px] leading-relaxed italic">{interimText}…</p>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            )}
        </div>
    )
}
