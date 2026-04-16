import { useEffect, useRef } from 'react'
import useWebRTC from '../../../hooks/useWebRTC'

export default function VideoPane({ send, wsRef }) {
  const {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isCamOff,
    startCall,
    toggleMute,
    toggleCamera,
    handleSignaling,
    cleanup,
  } = useWebRTC(send, wsRef)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Expose handleSignaling so parent can forward WS events
  useEffect(() => {
    if (wsRef?.current) {
      const originalOnMessage = wsRef.current.onmessage
      const handler = (e) => {
        try {
          const envelope = JSON.parse(e.data)
          const { event, payload } = envelope
          if (event === 'WEBRTC_OFFER' || event === 'WEBRTC_ANSWER' || event === 'WEBRTC_ICE_CANDIDATE') {
            handleSignaling(event, payload)
          }
        } catch { }
        // Call original handler too
        if (originalOnMessage) originalOnMessage(e)
      }
      wsRef.current.addEventListener('message', handler)
      return () => {
        wsRef.current?.removeEventListener('message', handler)
      }
    }
  }, [wsRef, handleSignaling])

  return (
    <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 relative flex flex-col">
      {/* Remote Video (main) */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-3">🎥</div>
            <p className="text-sm text-slate-400">
              {localStream ? 'Waiting for other participant…' : 'Click "Start Video" to begin'}
            </p>
          </div>
        )}

        {/* Connection indicator */}
        {localStream && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/70 px-2 py-1 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            <span className="text-xs text-slate-300">{isConnected ? 'Connected' : 'Connecting…'}</span>
          </div>
        )}

        {/* Local Video PiP (bottom-right) */}
        {localStream && (
          <div className="absolute bottom-3 right-3 w-32 h-24 rounded-lg overflow-hidden border-2 border-slate-600 bg-slate-800 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-2 px-4 bg-slate-800/80 border-t border-slate-700">
        {!localStream ? (
          <button
            onClick={startCall}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Start Video
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>

            <button
              onClick={toggleCamera}
              className={`p-2 rounded-lg transition-colors ${isCamOff ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}
              title={isCamOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isCamOff ? (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            <button
              onClick={cleanup}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              title="End call"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
