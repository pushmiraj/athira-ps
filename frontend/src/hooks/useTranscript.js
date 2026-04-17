import { useRef, useCallback, useState } from 'react'
import * as WS from '../lib/wsEvents'
import useSessionStore from '../store/sessionStore'
import useAuthStore from '../store/authStore'

export default function useTranscript(send) {
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')

  const startListening = useCallback(() => {
    console.log('[Transcript] Attempting to start SpeechRecognition...')
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('[Transcript] Speech Recognition not supported in this browser')
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
    }

    recognition.onresult = (event) => {
      let currentInterim = ''
      console.log('[Transcript] onresult fired, results length:', event.results.length)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        const is_final = result.isFinal

        if (is_final) {
          console.log('[Transcript] Final text:', text)
          send(WS.TRANSCRIPT_SEGMENT, { text, is_final: true })
          if (text.trim()) {
            const user = useAuthStore.getState().user
            useSessionStore.getState().addTranscriptSegment({
              speaker_id: user?.id || 'me',
              speaker_role: user?.role || 'student',
              text: text.trim(),
              timestamp_ms: Date.now(),
            })
          }
        } else {
          currentInterim += text
          // Still send interim segments so the other side can see them if we want to handle it
          send(WS.TRANSCRIPT_SEGMENT, { text, is_final: false })
        }
      }
      setInterimText(currentInterim)
    }

    recognition.onerror = (e) => {
      console.error("[Transcript] Speech Recognition Error:", e.error)
      if (e.error === 'aborted') {
        // Stop auto-restart loop if browser explicitly aborts (e.g. 2 tabs open)
        setIsListening(false)
        recognitionRef.current = null
      } else {
        setIsListening(false)
        setInterimText('')
      }
    }

    recognition.onend = () => {
      console.log('[Transcript] SpeechRecognition ended normally.')
      // Auto-restart if still supposed to be listening (hasn't been explicitly stopped)
      if (recognitionRef.current) {
        console.log('[Transcript] Attempting quiet auto-restart in 1s...')
        setTimeout(() => {
          if (recognitionRef.current) {
            try { recognition.start() } catch (err) {
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
      console.error("[Transcript] Failed to call start():", e)
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

  return { isListening, interimText, startListening, stopListening }
}
