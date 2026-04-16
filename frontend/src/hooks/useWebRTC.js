import { useEffect, useRef, useState, useCallback } from 'react'
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
    const pendingCandidates = useRef([])
    const isNegotiating = useRef(false)

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
                // Auto-restart on failure
                cleanup()
                setTimeout(() => startCall(), 2000)
            }
        }

        pc.onnegotiationneeded = async () => {
            if (isNegotiating.current) return
            isNegotiating.current = true
            try {
                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)
                send(WS.WEBRTC_OFFER, {
                    sdp: pc.localDescription.toJSON(),
                })
            } catch (err) {
                console.error('Negotiation failed:', err)
            } finally {
                isNegotiating.current = false
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
        switch (event) {
            case WS.WEBRTC_OFFER: {
                const pc = createPeerConnection()

                // Add local stream if not already added
                if (localStreamRef.current) {
                    const senders = pc.getSenders()
                    if (senders.length === 0) {
                        localStreamRef.current.getTracks().forEach((track) => {
                            pc.addTrack(track, localStreamRef.current)
                        })
                    }
                } else {
                    // Start local media if not started
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                            audio: true,
                        })
                        localStreamRef.current = stream
                        setLocalStream(stream)
                        stream.getTracks().forEach((track) => {
                            pc.addTrack(track, stream)
                        })
                    } catch (err) {
                        console.error('Failed to get media for answer:', err)
                    }
                }

                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))

                // Flush pending ICE candidates
                for (const c of pendingCandidates.current) {
                    await pc.addIceCandidate(new RTCIceCandidate(c))
                }
                pendingCandidates.current = []

                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                send(WS.WEBRTC_ANSWER, {
                    sdp: pc.localDescription.toJSON(),
                })
                break
            }

            case WS.WEBRTC_ANSWER: {
                const pc = pcRef.current
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    // Flush pending ICE candidates
                    for (const c of pendingCandidates.current) {
                        await pc.addIceCandidate(new RTCIceCandidate(c))
                    }
                    pendingCandidates.current = []
                }
                break
            }

            case WS.WEBRTC_ICE_CANDIDATE: {
                const pc = pcRef.current
                if (pc && pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
                } else {
                    // Queue if remote description not set yet
                    pendingCandidates.current.push(payload.candidate)
                }
                break
            }
        }
    }, [createPeerConnection, send])

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
        pendingCandidates.current = []
        isNegotiating.current = false
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
