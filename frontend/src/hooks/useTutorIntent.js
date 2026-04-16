import { useEffect, useRef } from 'react'
import useSidecarStore from '../store/sidecarStore'

export default function useTutorIntent() {
  const { pendingIntentSnapshot, intentCountdown, decrementCountdown, clearPendingIntent } = useSidecarStore()
  const timerRef = useRef(null)

  useEffect(() => {
    if (pendingIntentSnapshot && intentCountdown > 0) {
      timerRef.current = setInterval(() => {
        decrementCountdown()
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [pendingIntentSnapshot])

  useEffect(() => {
    if (intentCountdown === 0 && pendingIntentSnapshot) {
      clearPendingIntent()
    }
  }, [intentCountdown])

  return { pendingIntentSnapshot, intentCountdown, clearPendingIntent }
}
