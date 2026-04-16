import { useEffect, useState } from 'react'
import api from '../../../lib/api'
import useDiagnosticStore from '../../../store/diagnosticStore'
import useSessionStore from '../../../store/sessionStore'
import * as WS from '../../../lib/wsEvents'
import QuestionCard from './QuestionCard'

export default function PreFlightScreen({ session, send }) {
  const { questions, currentIndex, isComplete, setQuestions, submitAnswer } = useDiagnosticStore()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    api.get(`/diagnostic/${session.id}/questions`)
      .then(r => {
        setQuestions(r.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [session.id])

  async function handleAnswer(question_id, selected_index, confidence) {
    submitAnswer(question_id, selected_index, confidence)

    // Send via WebSocket
    send(WS.DIAGNOSTIC_ANSWER_SUBMITTED, {
      question_id,
      selected_index,
      confidence,
      time_taken_ms: null,
    })

    // If this was the last question, mark submitted
    if (currentIndex + 1 >= questions.length) {
      setSubmitting(true)
      // Backend will handle the rest via WS
      setTimeout(() => { setSubmitting(false); setSubmitted(true) }, 1500)
    }
  }

  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-session-bg)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your diagnostic questions…</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-session-bg)' }}>
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">🎓</div>
          <h2 className="text-xl font-semibold text-white mb-2">Pre-Session Check-in</h2>
          <p className="text-slate-400 mb-4">Diagnostic questions are being generated for your session. Please wait…</p>
          <button
            onClick={() => {
              api.post(`/diagnostic/${session.id}/generate`, { topic: session.topic, sub_topics: session.sub_topics || [] })
                .then(() => window.location.reload())
                .catch(() => window.location.reload())
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 rounded-lg transition-colors border border-slate-700 mt-2"
          >
            Retry Generation
          </button>
        </div>
      </div>
    )
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-session-bg)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Analyzing your responses…</p>
        </div>
      </div>
    )
  }

  if (submitted || isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-session-bg)' }}>
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6">✅</div>
          <h2 className="text-2xl font-semibold text-white mb-3">Check-in Complete!</h2>
          <p className="text-slate-400">Your tutor is reviewing your results. The session will begin shortly.</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-session-bg)' }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400">Pre-Session Check-in</span>
            <span className="text-sm text-slate-500">{session.topic}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          onSubmit={handleAnswer}
        />
      </div>
    </div>
  )
}
