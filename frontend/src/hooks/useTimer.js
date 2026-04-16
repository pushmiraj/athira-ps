import { useEffect } from 'react'
import useSessionStore from '../store/sessionStore'

export default function useTimer(active) {
  const tick = useSessionStore(s => s.tick)
  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => tick(1000), 1000)
    return () => clearInterval(interval)
  }, [active, tick])
}
