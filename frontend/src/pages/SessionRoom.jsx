import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import useSessionStore from '../store/sessionStore'
import useSidecarStore from '../store/sidecarStore'
import useWebSocket from '../hooks/useWebSocket'
import useTranscript from '../hooks/useTranscript'
import useTimer from '../hooks/useTimer'

import PreFlightScreen from '../components/session/preflight/PreFlightScreen'
import ProficiencyDashboard from '../components/session/proficiency/ProficiencyDashboard'
import Sidecar from '../components/session/sidecar/Sidecar'
import TutorIntentToast from '../components/session/sidecar/TutorIntentToast'
import AnalogyPanel from '../components/session/analogy/AnalogyPanel'
import AnalogyPoll from '../components/session/analogy/AnalogyPoll'
import VideoPane from '../components/session/video/VideoPane'
import SharedWhiteboard from '../components/session/whiteboard/SharedWhiteboard'
import SharedTextEditor from '../components/session/editor/SharedTextEditor'
import SessionHeader from '../components/session/layout/SessionHeader'
import DualPane from '../components/session/layout/DualPane'
import StudyPackModal from '../components/session/studypack/StudyPackModal'
import TranscriptPanel from '../components/session/transcript/TranscriptPanel'

export default function SessionRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { session, setSession, status, setStatus, reset } = useSessionStore()
  const { reset: resetSidecar } = useSidecarStore()
  const [loading, setLoading] = useState(true)
  const [showStudyPack, setShowStudyPack] = useState(false)
  const [activeTab, setActiveTab] = useState('whiteboard')

  const { send, wsRef } = useWebSocket(id)
  const { isListening, interimText, startListening, stopListening } = useTranscript(send)
  const whiteboardPngRef = useRef(null)

  useTimer(status === 'live')

  useEffect(() => {
    reset()
    resetSidecar()
    api.get(`/sessions/${id}`)
      .then(r => {
        setSession(r.data)
        setLoading(false)
        // If session already has preflight/live status, reflect it
        if (r.data.status === 'preflight' || r.data.status === 'live') {
          setStatus(r.data.status)
        }
      })
      .catch(() => { navigate('/dashboard') })
  }, [id])

  // Start transcript listening when live
  useEffect(() => {
    if (status === 'live') {
      startListening()
    } else {
      stopListening()
    }
    // Only re-run when status changes to prevent startListening() infinite loops if mic is rejected
  }, [status, startListening, stopListening])

  // Show study pack when session completes
  useEffect(() => {
    if (status === 'completed') {
      stopListening()
      setShowStudyPack(true)
    }
  }, [status])

  async function handleStartPreflight() {
    await api.patch(`/sessions/${id}/status`, { status: 'preflight' })
    setStatus('preflight')
  }

  async function handleStartLive() {
    await api.patch(`/sessions/${id}/status`, { status: 'live' })
    setStatus('live')
    send('SESSION_STATUS_CHANGED', { new_status: 'live' })
  }

  async function handleEndSession() {
    await api.patch(`/sessions/${id}/status`, { status: 'completed' })
    setStatus('completed')
    send('SESSION_STATUS_CHANGED', { new_status: 'completed' })
  }

  const isStudent = user?.role === 'student'
  const isTutor = user?.role === 'tutor'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-session-bg)' }}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ─── Pre-flight: student takes diagnostic ──────────────────────────────────
  if (status === 'preflight' && isStudent) {
    return (
      <>
        <PreFlightScreen session={session} send={send} />
      </>
    )
  }

  // ─── Pre-flight: tutor waits and watches proficiency populate ─────────────
  if (status === 'preflight' && isTutor) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-session-bg)' }}>
        <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-4" style={{ background: 'var(--color-session-panel)' }}>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-sm text-slate-400">Student completing check-in… · {session?.topic}</span>
        </div>
        <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full pt-6">
          <ProficiencyDashboard />
        </div>
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleStartLive}
            className="w-full py-3 bg-green-700/40 hover:bg-green-700/60 border border-green-600/50 text-green-300 rounded-xl text-sm font-medium transition-colors">
            Start Session Now
          </button>
        </div>
      </div>
    )
  }

  // ─── Scheduled: waiting room ───────────────────────────────────────────────
  if (status === 'scheduled' || status === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-session-bg)' }}>
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6">🎓</div>
          <h2 className="text-2xl font-semibold text-white mb-2">{session?.topic}</h2>
          <p className="text-slate-400 mb-8">
            {isStudent ? 'Your tutor will start the session soon.' : 'Your student is ready for check-in.'}
          </p>
          {isStudent && (
            <button onClick={handleStartPreflight}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
              Begin Pre-Session Check-in
            </button>
          )}
          {isTutor && (
            <button onClick={handleStartLive}
              className="px-8 py-3 bg-green-700/40 hover:bg-green-700/60 border border-green-600/50 text-green-300 rounded-xl text-sm font-medium transition-colors">
              Open Session Room
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── Completed: show study pack ────────────────────────────────────────────
  if (status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-session-bg)' }}>
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6">✅</div>
          <h2 className="text-2xl font-semibold text-white mb-4">Session Complete</h2>
          {isStudent && (
            <button onClick={() => setShowStudyPack(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
              View Study Pack
            </button>
          )}
          <button onClick={() => navigate('/dashboard')}
            className="block mt-4 mx-auto text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Back to Dashboard
          </button>
        </div>
        {showStudyPack && isStudent && (
          <StudyPackModal sessionId={id} onClose={() => setShowStudyPack(false)} />
        )}
      </div>
    )
  }

  // ─── LIVE SESSION: Dual-pane workspace ────────────────────────────────────
  const leftPane = (
    <div className="flex flex-col h-full">
      <VideoPane send={send} wsRef={wsRef} />

      {/* Workspace Tabs */}
      <div className="flex bg-slate-800 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('whiteboard')}
          className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${activeTab === 'whiteboard' ? 'bg-slate-700 text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Whiteboard
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${activeTab === 'editor' ? 'bg-slate-700 text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Text Editor
        </button>
      </div>

      <div className="flex-1 min-h-[300px] bg-slate-900 border-b border-slate-700 overflow-hidden relative">
        <div style={{ display: activeTab === 'whiteboard' ? 'block' : 'none', height: '100%' }}>
          <SharedWhiteboard send={send} wsRef={wsRef} getRef={whiteboardPngRef} />
        </div>
        <div style={{ display: activeTab === 'editor' ? 'block' : 'none', height: '100%' }}>
          <SharedTextEditor send={send} wsRef={wsRef} />
        </div>
      </div>
      {/* Transcript section */}
      <div className="border-t border-slate-700" style={{ background: 'var(--color-session-panel)' }}>
        {/* Transcript toggle bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transcript</span>
          </div>
          <button
            onClick={isListening ? stopListening : startListening}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${isListening
              ? 'bg-red-900/40 hover:bg-red-900/60 text-red-400 border border-red-700/50'
              : 'bg-green-900/40 hover:bg-green-900/60 text-green-400 border border-green-700/50'
              }`}
          >
            {isListening ? '⏹ Stop' : '🎙 Start Listening'}
          </button>
        </div>
        <TranscriptPanel interimText={interimText} />
      </div>
    </div>
  )

  const rightPane = isStudent ? (
    <Sidecar
      send={send}
      getWhiteboardPng={() => whiteboardPngRef.current?.()}
    />
  ) : (
    <div className="flex flex-col h-full overflow-y-auto divide-y divide-slate-700">
      <ProficiencyDashboard />
      <AnalogyPanel send={send} />
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--color-session-bg)' }}>
      <SessionHeader session={session} onEndSession={isTutor ? handleEndSession : null} />
      <DualPane left={leftPane} right={rightPane} />

      {/* Tutor-only: 10s intent toast */}
      {isTutor && <TutorIntentToast send={send} />}

      {/* Student-only: analogy poll overlay */}
      {isStudent && <AnalogyPoll send={send} />}

      {/* Study pack modal */}
      {showStudyPack && isStudent && (
        <StudyPackModal sessionId={id} onClose={() => setShowStudyPack(false)} />
      )}
    </div>
  )
}
