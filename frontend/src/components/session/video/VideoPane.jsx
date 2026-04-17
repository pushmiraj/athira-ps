import { useEffect, useRef } from 'react'
import useWebRTC from '../../../hooks/useWebRTC'

// Professional icon components
const MicOnIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" strokeWidth="0"/>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)

const MicOffIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)

const CamOnIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

const CamOffIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const VideoStartIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

const EndCallIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
  </svg>
)

export default function VideoPane({ send, wsRef, onCallStarted, onMuteChange }) {
  const {
    localStream, remoteStream, isConnected, isMuted, isCamOff,
    startCall, toggleMute, toggleCamera, handleSignaling, cleanup,
  } = useWebRTC(send, wsRef)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => {
    if (!wsRef?.current) return
    const handler = (e) => {
      try {
        const { event, payload } = JSON.parse(e.data)
        if (['WEBRTC_OFFER', 'WEBRTC_ANSWER', 'WEBRTC_ICE_CANDIDATE'].includes(event)) handleSignaling(event, payload)
      } catch { }
    }
    wsRef.current.addEventListener('message', handler)
    return () => wsRef.current?.removeEventListener('message', handler)
  }, [wsRef, handleSignaling])

  return (
    <div className="flex flex-col h-full" style={{ background: '#0f172a', borderRadius: 'inherit', overflow: 'hidden' }}>
      {/* Remote video area */}
      <div className="flex-1 relative flex items-center justify-center" style={{ background: '#0f172a', minHeight: 0 }}>
        {remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="text-center select-none">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎥</div>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>
              {localStream ? 'Waiting for other participant…' : 'Click "Start Video" to begin'}
            </p>
          </div>
        )}

        {/* Connection status badge */}
        {localStream && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(8px)',
            padding: '5px 10px', borderRadius: 20,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#22c55e' : '#f59e0b', animation: isConnected ? 'none' : 'pulse 1.5s infinite' }} />
            <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>{isConnected ? 'Connected' : 'Connecting…'}</span>
          </div>
        )}

        {/* Local video PiP */}
        {localStream && (
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            width: 120, height: 90, borderRadius: 12, overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <video ref={localVideoRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '10px 16px', background: 'rgba(15,23,42,0.95)', flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        {!localStream ? (
          <button onClick={() => { startCall(); onCallStarted?.() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff',
              border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
            }}>
            <VideoStartIcon /> Start Video
          </button>
        ) : (
          <>
            <button className="vc-btn"
              onClick={() => { toggleMute(); onMuteChange?.(!isMuted) }}
              title={isMuted ? 'Unmute' : 'Mute'}
              style={{ background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.12)', color: '#fff' }}>
              {isMuted ? <MicOffIcon /> : <MicOnIcon />}
            </button>
            <button className="vc-btn"
              onClick={toggleCamera}
              title={isCamOff ? 'Enable camera' : 'Disable camera'}
              style={{ background: isCamOff ? '#ef4444' : 'rgba(255,255,255,0.12)', color: '#fff' }}>
              {isCamOff ? <CamOffIcon /> : <CamOnIcon />}
            </button>
            <button className="vc-btn"
              onClick={cleanup} title="End call"
              style={{ background: '#ef4444', color: '#fff' }}>
              <EndCallIcon />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
