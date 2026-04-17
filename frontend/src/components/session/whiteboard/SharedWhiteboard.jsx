import { useEffect, useRef, useState, useCallback } from 'react'
import * as WS from '../../../lib/wsEvents'

const COLORS = ['#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316']
const SIZES = [2, 4, 8, 16]

export default function SharedWhiteboard({ send, wsRef, getRef }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef(null)
  const [color, setColor] = useState('#ffffff')
  const [size, setSize] = useState(4)
  const [tool, setTool] = useState('pen') // pen | eraser | text
  const [textInput, setTextInput] = useState(null) // { x, y, value }
  const strokesRef = useRef([])         // full history for PNG export
  const currentStroke = useRef(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctxRef.current = ctx
      redrawAll()
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const redrawAll = useCallback(() => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke)
    }
  }, [])

  function drawStroke(ctx, stroke) {
    if (stroke.tool === 'text') {
      ctx.save()
      ctx.font = `${stroke.size * 4}px monospace`
      ctx.fillStyle = stroke.color
      ctx.fillText(stroke.text, stroke.x, stroke.y)
      ctx.restore()
      return
    }

    if (!stroke.points || stroke.points.length < 2) return
    ctx.save()
    ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    ctx.stroke()
    ctx.restore()
  }

  function getCanvasPoint(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  function handleStart(e) {
    if (e.target.tagName?.toLowerCase() === 'input') return
    // e.preventDefault() // removed to allow input focus

    const pt = getCanvasPoint(e)
    if (tool === 'text') {
      setTextInput({ x: pt.x, y: pt.y, value: '' })
      return
    }

    isDrawing.current = true
    lastPoint.current = pt
    currentStroke.current = {
      color: tool === 'eraser' ? '#000' : color,
      size: tool === 'eraser' ? size * 4 : size,
      tool,
      points: [pt],
    }
  }

  function handleMove(e) {
    if (!isDrawing.current) return
    e.preventDefault()
    const pt = getCanvasPoint(e)
    currentStroke.current.points.push(pt)

    // Draw incrementally
    const ctx = ctxRef.current
    ctx.save()
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = tool === 'eraser' ? '#000' : color
    ctx.lineWidth = tool === 'eraser' ? size * 4 : size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    ctx.restore()
    lastPoint.current = pt
  }

  function handleEnd() {
    if (!isDrawing.current) return
    isDrawing.current = false
    if (currentStroke.current && currentStroke.current.points.length > 1) {
      strokesRef.current.push(currentStroke.current)
      // Broadcast to peer
      send(WS.WHITEBOARD_DELTA, { stroke: currentStroke.current })
    }
    currentStroke.current = null
    lastPoint.current = null
  }

  function handleClear() {
    strokesRef.current = []
    redrawAll()
    send(WS.WHITEBOARD_DELTA, { clear: true })
  }

  function handleTextSubmit() {
    if (!textInput) return
    if (textInput.value.trim() !== '') {
      const stroke = {
        tool: 'text',
        color: color,
        size: size,
        x: textInput.x,
        y: textInput.y,
        text: textInput.value
      }
      strokesRef.current.push(stroke)
      send(WS.WHITEBOARD_DELTA, { stroke })
      redrawAll()
    }
    setTextInput(null)
  }

  // Listen for remote whiteboard events
  useEffect(() => {
    if (!wsRef?.current) return
    const handler = (e) => {
      try {
        const envelope = JSON.parse(e.data)
        if (envelope.event === WS.WHITEBOARD_UPDATE) {
          const { stroke, clear } = envelope.payload
          if (clear) {
            strokesRef.current = []
            redrawAll()
          } else if (stroke) {
            strokesRef.current.push(stroke)
            const ctx = ctxRef.current
            if (ctx) drawStroke(ctx, stroke)
          }
        }
      } catch { }
    }
    wsRef.current.addEventListener('message', handler)
    return () => wsRef.current?.removeEventListener('message', handler)
  }, [wsRef, redrawAll])

  // Expose PNG capture for Snapshot feature
  useEffect(() => {
    if (getRef) {
      getRef.current = () => {
        const canvas = canvasRef.current
        return canvas ? canvas.toDataURL('image/png') : null
      }
    }
  }, [getRef])

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: '250px' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border-t border-slate-700">
        {/* Tool selector */}
        <div className="flex gap-1">
          <button
            onClick={() => setTool('pen')}
            className={`px-2 py-1 rounded text-xs transition-colors ${tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
          >✏️ Pen</button>
          <button
            onClick={() => setTool('eraser')}
            className={`px-2 py-1 rounded text-xs transition-colors ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
          >🧹 Eraser</button>
          <button
            onClick={() => setTool('text')}
            className={`px-2 py-1 rounded text-xs transition-colors border ${tool === 'text' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 text-slate-400 border-transparent hover:text-white'
              }`}
          >T Text</button>
        </div>

        <div className="w-px h-5 bg-slate-600" />

        {/* Colors */}
        <div className="flex gap-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pen') }}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c && tool === 'pen' ? 'border-blue-400 scale-125' : 'border-slate-600'
                }`}
              style={{ background: c }}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-slate-600" />

        {/* Brush size */}
        <div className="flex gap-1 items-center">
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${size === s ? 'bg-slate-600' : 'hover:bg-slate-700'
                }`}
            >
              <div
                className="rounded-full bg-white"
                style={{ width: s + 2, height: s + 2 }}
              />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Clear */}
        <button
          onClick={handleClear}
          className="px-2 py-1 bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded text-xs transition-colors"
        >🗑 Clear</button>
      </div>

      {/* Canvas */}
      <div className={`flex-1 min-h-0 relative bg-slate-900 ${tool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute inset-0 w-full h-full"
        />
        {textInput && (
          <input
            autoFocus
            type="text"
            value={textInput.value}
            onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTextSubmit()
            }}
            onBlur={handleTextSubmit}
            style={{
              position: 'absolute',
              left: `${textInput.x}px`,
              top: `${textInput.y - (size * 4)}px`,
              color: color,
              fontSize: `${size * 4}px`,
              fontFamily: 'monospace',
              background: 'rgba(0,0,0,0.5)',
              border: '1px dashed #3b82f6',
              outline: 'none',
              minWidth: '100px',
              zIndex: 100
            }}
          />
        )}
      </div>
    </div>
  )
}
