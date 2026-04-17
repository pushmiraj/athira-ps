import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useSessionStore from '../store/sessionStore'
import useDiagnosticStore from '../store/diagnosticStore'
import useSidecarStore from '../store/sidecarStore'
import * as WS from '../lib/wsEvents'

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'

export default function useWebSocket(sessionId) {
  const wsRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef(null)
  const isUnmounting = useRef(false)

  const token = localStorage.getItem('athira_token')

  const dispatch = useCallback((envelope) => {
    const { event, payload } = envelope
    switch (event) {
      // ── Session lifecycle ──────────────────────────────────────────────
      case WS.PARTICIPANT_JOINED:
        useSessionStore.getState().addParticipant(payload)
        break
      case WS.PARTICIPANT_LEFT:
        useSessionStore.getState().removeParticipant(payload.user_id)
        break
      case WS.SESSION_PARTICIPANTS:
        payload.participants?.forEach(p => useSessionStore.getState().addParticipant(p))
        break
      case WS.SESSION_STATUS_CHANGED:
        useSessionStore.getState().setStatus(payload.new_status)
        if (payload.session_contract) {
          useSessionStore.getState().setSessionContract(payload.session_contract)
        }
        break

      // ── Feature 1: Diagnostic ──────────────────────────────────────────
      case WS.DIAGNOSTIC_COMPLETE:
        useSessionStore.getState().setProficiency(payload.proficiency || [])
        useSessionStore.getState().setSessionContract(payload.session_contract)
        break
      case WS.DIAGNOSTIC_PROGRESS:
        // Handled inline by ProficiencyDashboard via session store
        break

      // ── Feature 2: Sidecar ─────────────────────────────────────────────
      case WS.SNAPSHOT_CONFIRMED:
        useSidecarStore.getState().addSnapshot(payload)
        break
      case WS.SNAPSHOT_ENRICHED:
        useSidecarStore.getState().enrichSnapshot(payload.snapshot_id, payload.tutor_intent)
        toast.success('Tutor added a note to your snapshot!')
        break
      case WS.TUTOR_INTENT_PROMPT:
        useSidecarStore.getState().setPendingIntent(payload)
        break
      case WS.QUESTION_PARKED_CONFIRMED:
        useSidecarStore.getState().addParkedQuestion(payload)
        break

      // ── Feature 3: Analogy ─────────────────────────────────────────────
      case WS.ANALOGIES_READY:
        useSidecarStore.getState().setAnalogies(payload)
        break
      case WS.ANALOGY_ERROR:
        toast.error(payload.message || 'Analogy generation failed, try again')
        break
      case WS.ANALOGY_POLL_RECEIVED:
        useSidecarStore.getState().setAnalogyPoll(payload)
        break
      case WS.ANALOGY_SELECTION_RECEIVED:
        useSidecarStore.getState().setAnalogyHighlight(payload.selection)
        break

      // ── Transcript ─────────────────────────────────────────────────────
      case WS.TRANSCRIPT_BROADCAST:
        if (payload.is_final !== false) {
          useSessionStore.getState().addTranscriptSegment(payload)
        }
        break

      // ── Text Editor ────────────────────────────────────────────────────
      case WS.TEXT_EDITOR_UPDATE:
        useSessionStore.getState().setEditorText(payload.content)
        break

      // ── Whiteboard — handled directly in SharedWhiteboard component ────
      default:
        break
    }
  }, [])

  const send = useCallback((event, payload = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        event,
        session_id: sessionId,
        timestamp_ms: Date.now(),
        payload,
      }))
    } else {
      console.warn(`WebSocket not open (readyState: ${wsRef.current?.readyState}). Dropping event: ${event}`)
    }
  }, [sessionId])

  const connect = useCallback(() => {
    if (!token || !sessionId) return
    const url = `${WS_BASE}/ws/${sessionId}?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttempts.current = 0
    }

    ws.onmessage = (e) => {
      try {
        const envelope = JSON.parse(e.data)
        dispatch(envelope)
      } catch { }
    }

    ws.onclose = () => {
      if (isUnmounting.current) return
      // Exponential backoff reconnect
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000)
      reconnectAttempts.current += 1
      reconnectTimer.current = setTimeout(connect, delay)
    }

    ws.onerror = () => { }
  }, [token, sessionId, dispatch])

  useEffect(() => {
    isUnmounting.current = false
    connect()
    return () => {
      isUnmounting.current = true
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  // Expose ws for whiteboard to add its own onmessage listener
  return { send, wsRef }
}
