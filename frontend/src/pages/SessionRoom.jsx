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
import CodeCompiler from '../components/session/compiler/CodeCompiler'
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
        if (r.data.status === 'preflight' || r.data.status === 'live') setStatus(r.data.status)
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

  // ── LIVE SESSION — floating panel canvas ─────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9', overflow: 'hidden' }}>
      {/* ── Session Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          <span style={{ fontWeight: 700, fontSize: 17, color: '#1e293b' }}>{session?.topic || 'Session'}</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {lastSegment && (
            <p style={{ color: '#94a3b8', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
              <span style={{ color: lastSegment.speaker_role === 'tutor' ? '#4f46e5' : '#16a34a', fontWeight: 600, fontStyle: 'normal' }}>
                {lastSegment.speaker_role === 'tutor' ? 'Tutor' : 'Student'}:{' '}
              </span>
              {lastSegment.processed_text || lastSegment.text}
            </p>
          )}
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 15, color: '#64748b', fontWeight: 600 }}>{formatTime(elapsedMs)}</span>
        {isTutor && (
          <button onClick={handleEndSession}
            style={{ padding: '8px 18px', background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fca5a5', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            End Session
          </button>
        )}
      </div>

      {/* ── Free floating canvas ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* ── Video Panel ── */}
        <FloatingPanel
          id="panel-video"
          title="Video" icon="🎥"
          defaultPos={{ x: 20, y: 16 }}
          defaultSize={{ w: 380, h: 320 }}
          minWidth={280} minHeight={220}
        >
          <VideoPane send={send} wsRef={wsRef} onCallStarted={handleCallStarted} onMuteChange={handleMuteChange} />
        </FloatingPanel>

        {/* ── Workspace Panel (Whiteboard + Editor + Code Compiler) ── */}
        <FloatingPanel
          id="panel-workspace"
          title={activeTab === 'whiteboard' ? 'Whiteboard' : activeTab === 'editor' ? 'Text Editor' : 'Code Compiler'}
          icon={activeTab === 'whiteboard' ? '✏️' : activeTab === 'editor' ? '📝' : '💻'}
          defaultPos={{ x: 420, y: 16 }}
          defaultSize={{ w: 720, h: 580 }}
          minWidth={500} minHeight={400}
          headerRight={
            <div className="no-drag" style={{ display: 'flex', gap: 4 }}>
              {['whiteboard', 'editor', 'compiler'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: activeTab === tab ? '#4f46e5' : '#f1f5f9',
                    color: activeTab === tab ? '#fff' : '#64748b',
                  }}>
                  {tab === 'whiteboard' ? '✏️ Whiteboard' : tab === 'editor' ? '📝 Editor' : '💻 Compiler'}
                </button>
              ))}
            </div>
          }
        >
          <div style={{ height: '100%', position: 'relative' }}>
            <div style={{ display: activeTab === 'whiteboard' ? 'flex' : 'none', height: '100%' }}>
              <SharedWhiteboard send={send} wsRef={wsRef} getRef={whiteboardPngRef} />
            </div>
            <div style={{ display: activeTab === 'editor' ? 'block' : 'none', height: '100%' }}>
              <SharedTextEditor send={send} wsRef={wsRef} />
            </div>
            <div style={{ display: activeTab === 'compiler' ? 'block' : 'none', height: '100%' }}>
              <CodeCompiler send={send} wsRef={wsRef} isTutor={isTutor} />
            </div>
          </div>
        </FloatingPanel>

        {/* ── Right panel: Sidecar (student) or Proficiency+Analogy (tutor) ── */}
        <FloatingPanel
          id="panel-sidecar"
          title={isStudent ? 'Workspace' : 'Dashboard'}
          icon={isStudent ? '📚' : '📊'}
          defaultPos={{ x: 1080, y: 16 }}
          defaultSize={{ w: 300, h: 480 }}
          minWidth={260} minHeight={320}
        >
          <div style={{ height: '100%', overflowY: 'auto' }}>
            {isStudent ? (
              <Sidecar send={send} getWhiteboardPng={() => whiteboardPngRef.current?.()} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <ProficiencyDashboard />
                <AnalogyPanel send={send} />
              </div>
            )}
          </div>
        </FloatingPanel>

        {/* ── Transcript Panel (student only) ── */}
        {isStudent && (
          <FloatingPanel
            id="panel-transcript"
            title="Transcript"
            icon="🎙"
            defaultPos={{ x: 20, y: 352 }}
            defaultSize={{ w: 380, h: 240 }}
            minWidth={260} minHeight={160}
            headerRight={
              <button className="no-drag" onClick={isListening ? stopListening : startListening}
                style={{
                  padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: isListening ? '#fef2f2' : '#f0fdf4',
                  color: isListening ? '#ef4444' : '#16a34a',
                }}>
                {isListening ? '⏹ Stop' : '🎙 Start'}
              </button>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderBottom: '1px solid #f1f5f9' }}>
              {isListening && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />}
            </div>
            <TranscriptPanel interimText={interimText} error={transcriptError} />
          </FloatingPanel>
        )}
      </div>

      {/* Overlays */}
      {isTutor && <TutorIntentToast send={send} />}
      {isStudent && <AnalogyPoll send={send} />}
      {showStudyPack && isStudent && <StudyPackModal sessionId={id} onClose={() => setShowStudyPack(false)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
