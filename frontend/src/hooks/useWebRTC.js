import { useEffect, useRef, useState, useCallback } from 'react'
import useAuthStore from '../store/authStore'
import * as WS from '../lib/wsEvents'

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
]

export default function useWebRTC(send, wsRef) {
    const pcRef = useRef(null)
    const localStreamRef = useRef(null)
    const [localStream, setLocalStream] = useState(null)
    const [remoteStream, setRemoteStream] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isCamOff, setIsCamOff] = useState(false)
    const { user } = useAuthStore()

    // Perfect negotiation state
    const makingOffer = useRef(false)
    const ignoreOffer = useRef(false)
    const isPolite = user?.role === 'student'

    // Create peer connection
    const createPeerConnection = useCallback(() => {
        if (pcRef.current) return pcRef.current

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
        pcRef.current = pc

        // Send ICE candidates to remote peer
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                send(WS.WEBRTC_ICE_CANDIDATE, {
                    candidate: e.candidate.toJSON(),
                })
            }
        }

        // Receive remote tracks
        pc.ontrack = (e) => {
            const [stream] = e.streams
            setRemoteStream(stream)
        }

        pc.onconnectionstatechange = () => {
            setIsConnected(pc.connectionState === 'connected')
            if (pc.connectionState === 'failed') {
                cleanup()
                setTimeout(() => startCall(), 2000)
            }
        }

        pc.onnegotiationneeded = async () => {
            try {
                makingOffer.current = true
                await pc.setLocalDescription()
                send(WS.WEBRTC_OFFER, {
                    sdp: pc.localDescription.toJSON(),
                })
            } catch (err) {
                console.error('Negotiation failed:', err)
            } finally {
                makingOffer.current = false
            }
        }

        return pc
    }, [send])

    // Start local media and initiate call
    const startCall = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                audio: true,
            })
            localStreamRef.current = stream
            setLocalStream(stream)

            const pc = createPeerConnection()

            // Add local tracks to peer connection
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream)
            })
        } catch (err) {
            console.error('Failed to get media:', err)
        }
    }, [createPeerConnection])

    // Handle incoming WebRTC signaling messages
    const handleSignaling = useCallback(async (event, payload) => {
        const pc = createPeerConnection()

        switch (event) {
            case WS.WEBRTC_OFFER:
            case WS.WEBRTC_ANSWER: {
                const isOffer = event === WS.WEBRTC_OFFER
                const offerCollision = isOffer && (makingOffer.current || pc.signalingState !== 'stable')
                ignoreOffer.current = !isPolite && offerCollision
                if (ignoreOffer.current) return

                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    if (isOffer) {
                        // Ensure local tracks are added before answering
                        if (!localStreamRef.current) {
                            try {
                                const stream = await navigator.mediaDevices.getUserMedia({
                                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                                    audio: true,
                                })
                                localStreamRef.current = stream
                                setLocalStream(stream)
                                stream.getTracks().forEach((track) => pc.addTrack(track, stream))
                            } catch (err) {
                                console.error('Failed to get media for answer:', err)
                            }
                        } else {
                            const senders = pc.getSenders()
                            if (senders.length === 0) {
                                localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current))
                            }
                        }

                        await pc.setLocalDescription()
                        send(WS.WEBRTC_ANSWER, { sdp: pc.localDescription.toJSON() })
                    }
                } catch (err) {
                    console.error('Failed to set remote description:', err)
                }
                break
            }

            case WS.WEBRTC_ICE_CANDIDATE: {
                try {
                    // Only drop candidates if we are ignoring an offer
                    if (ignoreOffer.current && pc.signalingState === 'stable') return
                    
                    if (pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
                    } else {
                        // In perfect negotiation with polite peer, if we don't have remote description yet
                        // the browser automatically queues candidates in some implementations,
                        // but setting polite/impolite pattern resolves most race conditions.
                        // We do a manual re-queue fallback just in case.
                        setTimeout(() => pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(console.error), 2000)
                    }
                } catch (err) {
                    console.error('Failed to add ICE candidate:', err)
                }
                break
            }
        }
    }, [createPeerConnection, send, isPolite])

    // Media controls
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setIsMuted(!audioTrack.enabled)
            }
        }
    }, [])

    const toggleCamera = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                setIsCamOff(!videoTrack.enabled)
            }
        }
    }, [])

    // Cleanup function
    const cleanup = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop())
            localStreamRef.current = null
            setLocalStream(null)
        }
        if (pcRef.current) {
            pcRef.current.close()
            pcRef.current = null
        }
        setRemoteStream(null)
        setIsConnected(false)
        makingOffer.current = false
        ignoreOffer.current = false
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanup()
    }, [cleanup])

    return {
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
    }
}
