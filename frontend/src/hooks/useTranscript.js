import { useRef, useCallback, useState } from 'react'
import * as WS from '../lib/wsEvents'
import useSessionStore from '../store/sessionStore'
import useAuthStore from '../store/authStore'

// Errors that should NOT trigger auto-restart (permanent failures)
const FATAL_ERRORS = new Set(['service-not-allowed', 'not-allowed'])

export default function useTranscript(send) {
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState(null)   // null | string

  const startListening = useCallback(() => {
    console.log('[Transcript] Attempting to start SpeechRecognition...')
    if (recognitionRef.current) {
      console.log('[Transcript] Already listening or pending restart. Ignoring concurrent start.')
      return
    }
    setError(null)   // clear previous error on new attempt

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const msg = 'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
      console.warn('[Transcript]', msg)
      setError(msg)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      console.log('[Transcript] SpeechRecognition started successfully')
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event) => {
      let currentInterim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        const is_final = result.isFinal

        if (is_final) {
          send(WS.TRANSCRIPT_SEGMENT, { text, is_final: true })
          if (text.trim()) {
            const user = useAuthStore.getState().user
            useSessionStore.getState().addTranscriptSegment({
              speaker_id: user?.id || 'me',
              speaker_role: user?.role || 'student',
              text: text.trim(),
              processed_text: null,
              timestamp_ms: Date.now(),
            })
          }
        } else {
          currentInterim += text
          send(WS.TRANSCRIPT_SEGMENT, { text, is_final: false })
        }
      }
      setInterimText(currentInterim)
    }

    recognition.onerror = (e) => {
      console.error('[Transcript] Speech Recognition Error:', e.error)

      if (FATAL_ERRORS.has(e.error)) {
        // Permanent failure — stop entirely and show a clear message
        let msg = `Speech recognition error: ${e.error}.`
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          msg = '⚠️ Microphone access was denied. Please allow microphone access in browser settings and try again.'
        }
        console.error('[Transcript] FATAL error — stopping auto-restart:', msg)
        setError(msg)
        setIsListening(false)
        setInterimText('')
        recognitionRef.current = null   // prevents auto-restart in onend
      } else {
        // Non-fatal (e.g. no-speech, audio-capture, network) — allow auto-restart
        console.warn('[Transcript] Non-fatal error, will attempt restart:', e.error)
        setIsListening(false)
        setInterimText('')
      }
    }

    recognition.onend = () => {
      console.log('[Transcript] SpeechRecognition ended.')
      // Only restart if recognitionRef still set (not cleared by fatal error or stopListening)
      if (recognitionRef.current) {
        console.log('[Transcript] Attempting quiet auto-restart in 1s...')
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognition.start()
            } catch (err) {
              console.error('[Transcript] Failed to auto-restart:', err)
              setIsListening(false)
            }
          }
        }, 1000)
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (e) {
      console.error('[Transcript] Failed to call start():', e)
      setError(`Failed to start speech recognition: ${e.message}`)
    }
  }, [send])

  const stopListening = useCallback(() => {
    console.log('[Transcript] Manual stopListening called.')
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimText('')
  }, [])

  return { isListening, interimText, error, startListening, stopListening }
}
