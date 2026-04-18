import { useState } from 'react'
import { Camera } from 'lucide-react'
import * as WS from '../../../lib/wsEvents'
import useSessionStore from '../../../store/sessionStore'

export default function SnapshotButton({ send, getWhiteboardPng }) {
  const [isInputting, setIsInputting] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const { getLastSecondsTranscript, elapsedMs } = useSessionStore()

  async function captureFullPage() {
    try {
      setIsCapturing(true)
      console.log('Starting screenshot capture using native API...')

      // Use the modern browser Screenshot API if available
      if (window.getDisplayMedia || navigator.mediaDevices?.getDisplayMedia) {
        console.log('Using MediaDevices API for high-quality capture')

        // Request screen capture
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' }
        })

        const video = document.createElement('video')
        video.srcObject = stream
        video.autoplay = true

        // Wait for video to be ready
        await new Promise(resolve => {
          video.onloadedmetadata = resolve
        })

        // Create canvas and capture frame
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)

        // Stop the stream
        stream.getTracks().forEach(track => track.stop())

        const dataUrl = canvas.toDataURL('image/png', 0.9)
        console.log('Screenshot captured successfully, size:', dataUrl.length, 'bytes')
        return dataUrl

      } else {
        // Fallback: simple canvas drawing
        console.log('Using fallback canvas method')

        const canvas = document.createElement('canvas')
        const scale = window.devicePixelRatio || 1
        canvas.width = window.innerWidth * scale
        canvas.height = window.innerHeight * scale
        const ctx = canvas.getContext('2d')

        ctx.scale(scale, scale)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Add text overlay to show it's a snapshot
        ctx.fillStyle = '#006D5B'
        ctx.font = '24px sans-serif'
        ctx.fillText('Session Snapshot - ' + new Date().toLocaleString(), 20, 50)

        const dataUrl = canvas.toDataURL('image/png', 0.9)
        console.log('Fallback snapshot created, size:', dataUrl.length, 'bytes')
        return dataUrl
      }
    } catch (err) {
      console.error('Failed to capture screenshot:', err)

      // Ultimate fallback - create a simple placeholder
      console.log('Creating placeholder snapshot')
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')

      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(0, 0, 800, 600)
      ctx.fillStyle = '#006D5B'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Session Snapshot', 400, 250)
      ctx.font = '20px sans-serif'
      ctx.fillStyle = '#666'
      ctx.fillText(new Date().toLocaleString(), 400, 300)

      const dataUrl = canvas.toDataURL('image/png')
      console.log('Placeholder snapshot created')
      return dataUrl
    } finally {
      setIsCapturing(false)
    }
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault()

    // Capture full page screenshot
    const fullPagePng = await captureFullPage()

    if (!fullPagePng) {
      console.error('Screenshot capture returned null, aborting snapshot')
      return
    }

    const whiteboardPng = getWhiteboardPng ? getWhiteboardPng() : null
    const transcriptSnippet = getLastSecondsTranscript(30)

    console.log('Sending snapshot with image size:', fullPagePng.length)

    send(WS.SNAPSHOT_TAKEN, {
      note: noteText.trim(),
      whiteboard_png: whiteboardPng,
      full_page_png: fullPagePng,
      transcript_snippet: transcriptSnippet,
      timestamp_ms: elapsedMs,
    })

    setIsInputting(false)
    setNoteText('')
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsInputting(!isInputting)}
        disabled={isCapturing}
        title="Capture this moment"
        className="flex items-center justify-center gap-2 px-3 py-2.5 w-full btn-secondary font-medium text-[13px] disabled:opacity-50"
      >
        <Camera size={15} />
        <span>{isCapturing ? 'Capturing...' : 'Snapshot'}</span>
      </button>

      {isInputting && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-surface-container rounded-xl border border-outline-variant shadow-lg z-50">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a reflection note? (optional)"
              className="w-full text-sm p-2 bg-white rounded-md border border-[var(--color-outline-variant)] outline-none resize-none focus:border-primary text-on-surface"
              rows={3}
            />
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setIsInputting(false)} className="flex-1 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-black/5 rounded-md">Cancel</button>
              <button type="submit" className="flex-1 py-1.5 text-xs font-semibold bg-primary text-white rounded-md">Capture</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
