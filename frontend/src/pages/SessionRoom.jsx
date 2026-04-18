import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import useSessionStore from '../store/sessionStore'
import useSidecarStore from '../store/sidecarStore'
import useWebSocket from '../hooks/useWebSocket'
import useTranscript from '../hooks/useTranscript'
import useTimer from '../hooks/useTimer'
import { formatTime } from '../lib/utils'

import PreFlightScreen from '../components/session/preflight/PreFlightScreen'
import ProficiencyDashboard from '../components/session/proficiency/ProficiencyDashboard'
import Sidecar from '../components/session/sidecar/Sidecar'
import TutorIntentToast from '../components/session/sidecar/TutorIntentToast'
import AnalogyPanel from '../components/session/analogy/AnalogyPanel'
import AnalogyPoll from '../components/session/analogy/AnalogyPoll'
import VideoPane from '../components/session/video/VideoPane'
import SharedWhiteboard from '../components/session/whiteboard/SharedWhiteboard'
import SharedTextEditor from '../components/session/editor/SharedTextEditor'
import StudyPackModal from '../components/session/studypack/StudyPackModal'
import TranscriptPanel from '../components/session/transcript/TranscriptPanel'

// ── Lightweight draggable + resizable panel ───────────────────────────────────
function FloatingPanel({ title, icon, children, defaultPos, defaultSize, minWidth = 280, minHeight = 180, style = {}, headerRight = null, id }) {
  const [pos, setPos] = useState(defaultPos)
  const [size, setSize] = useState(defaultSize)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const onDragStart = (e) => {
    if (e.target.closest('.no-drag')) return
    setIsDragging(true)
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }

  const onResizeStart = (e) => {
    setIsResizing(true)
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }
    e.stopPropagation(); e.preventDefault()
  }

  useEffect(() => {
    if (!isDragging && !isResizing) return
    const move = (e) => {
      if (isDragging) {
        setPos({ x: Math.max(0, e.clientX - dragOffset.current.x), y: Math.max(0, e.clientY - dragOffset.current.y) })
      }
      if (isResizing) {
        const dx = e.clientX - resizeStart.current.x
        const dy = e.clientY - resizeStart.current.y
        setSize({ w: Math.max(minWidth, resizeStart.current.w + dx), h: Math.max(minHeight, resizeStart.current.h + dy) })
      }
    }
    const up = () => { setIsDragging(false); setIsResizing(false) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [isDragging, isResizing, minWidth, minHeight])

  return (
    <div id={id} style={{
      position: 'absolute', left: pos.x, top: pos.y,
      width: size.w, height: size.h,
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: isDragging ? '0 20px 60px rgba(0,0,0,0.18)' : '0 4px 24px rgba(0,0,0,0.10)',
      border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
      transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s',
      userSelect: isDragging || isResizing ? 'none' : 'auto',
      zIndex: isDragging ? 1000 : 'auto',
      ...style
    }}>
      {/* Drag handle header */}
      <div className="drag-handle" onMouseDown={onDragStart}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: '#fff', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}>
        {/* Grip dots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, opacity: 0.35, flexShrink: 0 }}>
          {[0, 1].map(r => (
            <div key={r} style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map(c => <div key={c} style={{ width: 4, height: 4, borderRadius: '50%', background: '#64748b' }} />)}
            </div>
          ))}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {icon && <span style={{ marginRight: 4 }}>{icon}</span>}{title}
        </span>
        <div className="no-drag" style={{ marginLeft: 'auto' }}>{headerRight}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        {children}
      </div>

      {/* Resize handle */}
      <div className="resize-handle" onMouseDown={onResizeStart} />
    </div>
  )
}

// ─── Main SessionRoom component ───────────────────────────────────────────────
export default function SessionRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { session, setSession, status, setStatus, reset, elapsedMs, transcriptBuffer } = useSessionStore()
  const { reset: resetSidecar } = useSidecarStore()
  const [loading, setLoading] = useState(true)
  const [showStudyPack, setShowStudyPack] = useState(false)
  const [activeTab, setActiveTab] = useState('whiteboard')

  const { send, wsRef } = useWebSocket(id)
  const { isListening, interimText, error: transcriptError, startListening, stopListening } = useTranscript(send)
  const whiteboardPngRef = useRef(null)

  useTimer(status === 'live')

  useEffect(() => {
    reset(); resetSidecar()
    api.get(`/sessions/${id}`)
      .then(r => {
        setSession(r.data); setLoading(false)
        // Always reflect the real status from the database
        setStatus(r.data.status)
      })
      .catch(() => navigate('/dashboard'))
  }, [id])

  const handleCallStarted = useCallback(() => startListening(), [startListening])
  const handleMuteChange = useCallback((nowMuted) => {
    if (nowMuted) stopListening(); else startListening()
  }, [startListening, stopListening])

  useEffect(() => {
    if (status === 'completed') { stopListening(); setShowStudyPack(true) }
  }, [status])

  async function handleStartPreflight() { await api.patch(`/sessions/${id}/status`, { status: 'preflight' }); setStatus('preflight') }
  async function handleStartLive() { await api.patch(`/sessions/${id}/status`, { status: 'live' }); setStatus('live'); send('SESSION_STATUS_CHANGED', { new_status: 'live' }) }
  async function handleEndSession() { await api.patch(`/sessions/${id}/status`, { status: 'completed' }); setStatus('completed'); send('SESSION_STATUS_CHANGED', { new_status: 'completed' }) }

  const isStudent = user?.role === 'student'
  const isTutor = user?.role === 'tutor'
  const lastSegment = transcriptBuffer[transcriptBuffer.length - 1]

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #4f46e5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  // ── Pre-flight: student ──────────────────────────────────────────────────────
  if (status === 'preflight' && isStudent) return <PreFlightScreen session={session} send={send} />

  // ── Pre-flight: tutor waits ──────────────────────────────────────────────────
  if (status === 'preflight' && isTutor) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
      <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
        <span style={{ color: '#64748b', fontWeight: 500 }}>Student completing check-in… · {session?.topic}</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', maxWidth: 520, margin: '0 auto', width: '100%', paddingTop: 24 }}>
        <ProficiencyDashboard />
      </div>
      <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', background: '#fff' }}>
        <button onClick={handleStartLive} style={{ width: '100%', padding: '12px 0', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          Start Session Now
        </button>
      </div>
    </div>
  )

  // ── Scheduled / idle waiting room ────────────────────────────────────────────
  if (status === 'scheduled' || status === 'idle') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{session?.topic}</h2>
        <p style={{ color: '#64748b', marginBottom: 32, fontSize: 16 }}>
          {isStudent ? 'Your tutor will start the session soon.' : 'Your student is ready for check-in.'}
        </p>
        {isStudent && (
          <button onClick={handleStartPreflight} style={{ padding: '14px 32px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            Begin Pre-Session Check-in
          </button>
        )}
        {isTutor && (
          <button onClick={handleStartLive} style={{ padding: '14px 32px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            Open Session Room
          </button>
        )}
      </div>
    </div>
  )

  // ── Completed ────────────────────────────────────────────────────────────────
  if (status === 'completed') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Session Complete</h2>
        {isStudent && (
          <button onClick={() => setShowStudyPack(true)} style={{ padding: '14px 32px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'block', margin: '0 auto 12px' }}>
            View Study Pack
          </button>
        )}
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 15, cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>
      </div>
      {showStudyPack && isStudent && <StudyPackModal sessionId={id} onClose={() => setShowStudyPack(false)} />}
    </div>
  )

    // ── LIVE SESSION — 3-Column Asymmetric Canvas (Academic Atelier) ──
    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden relative">
            {/* ── Session Header ── */}
            <div className="flex items-center gap-4 px-6 py-4 bg-background z-20 shrink-0 ghost-border-b">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
                    <span className="font-display font-semibold text-lg text-on-surface tracking-tight">{session?.topic || 'Session'}</span>
                </div>
                
                <div className="flex-1 px-8 overflow-hidden flex justify-center">
                    {lastSegment && (
                        <p className="text-on-surface-variant text-sm overflow-hidden text-ellipsis whitespace-nowrap font-medium max-w-2xl bg-surface-container-highest/30 px-4 py-1.5 rounded-full">
                            <span className={lastSegment.speaker_role === 'tutor' ? 'text-primary mr-2' : 'text-tertiary mr-2'}>
                                {lastSegment.speaker_role === 'tutor' ? 'Tutor:' : 'Student:'}
                            </span>
                            {lastSegment.processed_text || lastSegment.text}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <span className="font-mono text-on-surface-variant font-medium tracking-widest">{formatTime(elapsedMs)}</span>
                    {isTutor && (
                        <button onClick={handleEndSession} className="px-5 py-2 min-h-0 btn-secondary !bg-error-container !text-error font-bold !text-xs uppercase tracking-wide">
                            End Session
                        </button>
                    )}
                </div>
            </div>

            {/* ── 3-Column Studio Layout ── */}
            <div className="flex-1 flex overflow-hidden p-2 gap-2">
                
                {/* Left Column: Intelligence / Context */}
                <div className="w-80 flex flex-col gap-2 rounded-2xl overflow-hidden shrink-0">
                    <div className="flex-1 bg-surface-container-low rounded-2xl overflow-y-auto custom-scrollbar-light relative group">
                        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-surface-container-low to-transparent z-10 pointers-none flex items-center gap-2">
                            <span className="text-xl">🧠</span>
                            <span className="font-display font-bold text-sm text-on-surface tracking-wide uppercase">Intelligence</span>
                        </div>
                        <div className="pt-16 pb-4 h-full">
                            {isStudent ? (
                                <Sidecar send={send} getWhiteboardPng={() => whiteboardPngRef.current?.()} />
                            ) : (
                                <div className="flex flex-col gap-0 h-full">
                                    <div className="shrink-0"><ProficiencyDashboard /></div>
                                    <div className="flex-1 min-h-0"><AnalogyPanel send={send} /></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center Column: The Focus Well (Dark Mode) */}
                <div className="flex-1 bg-inverse-surface rounded-2xl flex flex-col overflow-hidden relative ambient-shadow group ring-1 ring-white/5">
                    <div className="absolute top-4 left-4 z-10 flex gap-1.5 p-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                        {['editor', 'whiteboard'].map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide uppercase transition-all ${
                                    activeTab === tab 
                                        ? 'bg-primary/90 text-white shadow-sm' 
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {tab === 'whiteboard' ? 'Whiteboard' : 'Code Data'}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 relative w-full h-full pt-16 rounded-b-2xl overflow-hidden">
                        <div className={activeTab === 'whiteboard' ? 'absolute inset-0' : 'hidden'}>
                            <SharedWhiteboard send={send} wsRef={wsRef} getRef={whiteboardPngRef} />
                        </div>
                        <div className={activeTab === 'editor' ? 'absolute inset-0' : 'hidden'}>
                            <SharedTextEditor send={send} wsRef={wsRef} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Communications */}
                <div className="w-80 flex flex-col gap-2 shrink-0">
                    {/* Video Block */}
                    <div className="h-[360px] bg-[#1a1b1e] rounded-2xl overflow-hidden relative group shrink-0 ring-1 ring-white/5 shadow-inner">
                         <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-black/50 backdrop-blur border border-white/10 rounded-md">
                            <span className="text-[10px] uppercase font-bold text-white/80 tracking-widest">Presence</span>
                        </div>
                        <VideoPane send={send} wsRef={wsRef} onCallStarted={handleCallStarted} onMuteChange={handleMuteChange} />
                    </div>

                    {/* Transcript Block */}
                    {isStudent && (
                        <div className="flex-1 bg-surface-container-low rounded-2xl overflow-hidden flex flex-col relative">
                            <div className="flex items-center justify-between p-4 bg-surface-container-lowest ghost-border-b z-10 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🎙</span>
                                    <span className="font-display font-bold text-sm text-on-surface tracking-wide uppercase">Transcript</span>
                                </div>
                                <button 
                                    onClick={isListening ? stopListening : startListening}
                                    className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
                                      isListening ? 'bg-error-container text-error' : 'bg-surface-container text-on-surface hover:bg-outline-variant'
                                    }`}
                                >
                                    {isListening ? 'Stop' : 'Start'}
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar-light relative">
                                {isListening && (
                                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-error animate-pulse shadow-[0_0_8px_rgba(186,26,26,0.6)]" />
                                )}
                                <div className="p-2"><TranscriptPanel interimText={interimText} error={transcriptError} /></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Overlays */}
            {isTutor && <TutorIntentToast send={send} />}
            {isStudent && <AnalogyPoll send={send} />}
            {showStudyPack && isStudent && <StudyPackModal sessionId={id} onClose={() => setShowStudyPack(false)} />}
        </div>
    )
}
