import { useRef, useCallback, useState } from 'react'
import * as WS from '../lib/wsEvents'
import useSessionStore from '../store/sessionStore'
import useAuthStore from '../store/authStore'

export default function useTranscript(send) {
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech Recognition not supported in this browser')
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        const is_final = result.isFinal
        send(WS.TRANSCRIPT_SEGMENT, { text, is_final })

        // Add final segments to local store so the speaker sees their own words
        if (is_final && text.trim()) {
          const user = useAuthStore.getState().user
          useSessionStore.getState().addTranscriptSegment({
            speaker_id: user?.id || 'me',
            speaker_role: user?.role || 'student',
            text: text.trim(),
            timestamp_ms: Date.now(),
          })
        }
      }
    }

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') {
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current) {
        try { recognition.start() } catch { }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [send])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  return { isListening, startListening, stopListening }
}
