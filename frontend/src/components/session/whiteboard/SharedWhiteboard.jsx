import { useEffect, useRef, useState, useCallback } from 'react'
import * as WS from '../../../lib/wsEvents'

const COLORS = ['#1e293b', '#ef4444', '#4f46e5', '#16a34a', '#f59e0b', '#a855f7', '#0ea5e9', '#f97316', '#ec4899']
const SIZES = [2, 5, 10, 18]

// ── Tool icon SVGs ──────────────────────────────────────────────
const ToolIcons = {
  pen: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  eraser: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 20 4 20"/><path d="M9.5 14.5 4 20"/><path d="m14.5 9.5 1 1-5.5 5.5-6-6 5.5-5.5 5 5z"/></svg>,
  text: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  rect: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>,
  circle: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/></svg>,
  line: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="20" x2="20" y2="4"/></svg>,
  arrow: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg>,
}

const TOOLS = [
  { id: 'pen', label: 'Pen' },
  { id: 'eraser', label: 'Eraser' },
  { id: 'line', label: 'Line' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'rect', label: 'Rectangle' },
  { id: 'circle', label: 'Circle' },
  { id: 'text', label: 'Text' },
]

export default function SharedWhiteboard({ send, wsRef, getRef }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const isDrawing = useRef(false)
  const startPoint = useRef(null)
  const lastPoint = useRef(null)
  const snapshotRef = useRef(null) // for shape preview
  const [color, setColor] = useState('#1e293b')
  const [size, setSize] = useState(5)
  const [tool, setTool] = useState('pen')
  const [textInput, setTextInput] = useState(null)
  const strokesRef = useRef([])
  const currentStroke = useRef(null)

  const redrawAll = useCallback(() => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    for (const stroke of strokesRef.current) drawStroke(ctx, stroke)
  }, [])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.parentElement) return

    const resize = () => {
      const parent = canvas.parentElement
      if (parent.clientWidth === 0 || parent.clientHeight === 0) return
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const savedStrokes = [...strokesRef.current]
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctxRef.current = ctx
      strokesRef.current = savedStrokes
      redrawAll()
    }

    const observer = new ResizeObserver(() => {
      resize()
    })
    observer.observe(canvas.parentElement)
    
    return () => {
      if (canvas.parentElement) observer.unobserve(canvas.parentElement)
      observer.disconnect()
    }
  }, [redrawAll])

  function drawStroke(ctx, stroke) {
    ctx.save()
    ctx.strokeStyle = stroke.color
    ctx.fillStyle = stroke.color
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (stroke.tool === 'text') {
      ctx.font = `${Math.max(16, stroke.size * 4)}px Inter, sans-serif`
      ctx.fillStyle = stroke.color
      ctx.fillText(stroke.text, stroke.x, stroke.y)
      ctx.restore(); return
    }
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = stroke.size
    }
    if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
      if (!stroke.points || stroke.points.length < 2) { ctx.restore(); return }
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      ctx.stroke()
    } else if (stroke.tool === 'line') {
      ctx.beginPath(); ctx.moveTo(stroke.x1, stroke.y1); ctx.lineTo(stroke.x2, stroke.y2); ctx.stroke()
    } else if (stroke.tool === 'arrow') {
      const dx = stroke.x2 - stroke.x1, dy = stroke.y2 - stroke.y1
      const angle = Math.atan2(dy, dx)
      const headLen = Math.max(14, stroke.size * 3)
      ctx.beginPath(); ctx.moveTo(stroke.x1, stroke.y1); ctx.lineTo(stroke.x2, stroke.y2); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(stroke.x2, stroke.y2)
      ctx.lineTo(stroke.x2 - headLen * Math.cos(angle - Math.PI / 6), stroke.y2 - headLen * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(stroke.x2, stroke.y2)
      ctx.lineTo(stroke.x2 - headLen * Math.cos(angle + Math.PI / 6), stroke.y2 - headLen * Math.sin(angle + Math.PI / 6))
      ctx.stroke()
    } else if (stroke.tool === 'rect') {
      ctx.beginPath()
      ctx.roundRect(stroke.x1, stroke.y1, stroke.x2 - stroke.x1, stroke.y2 - stroke.y1, 4)
      ctx.stroke()
    } else if (stroke.tool === 'circle') {
      const rx = Math.abs(stroke.x2 - stroke.x1) / 2, ry = Math.abs(stroke.y2 - stroke.y1) / 2
      ctx.beginPath()
      ctx.ellipse(stroke.x1 + (stroke.x2 - stroke.x1) / 2, stroke.y1 + (stroke.y2 - stroke.y1) / 2, rx, ry, 0, 0, 2 * Math.PI)
      ctx.stroke()
    }
    ctx.restore()
  }

  function getCanvasPoint(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function handleStart(e) {
    if (e.target.tagName?.toLowerCase() === 'input') return
    const pt = getCanvasPoint(e)
    if (tool === 'text') { setTextInput({ x: pt.x, y: pt.y, value: '' }); return }
    isDrawing.current = true
    startPoint.current = pt
    lastPoint.current = pt
    // Take canvas snapshot for shape preview
    const canvas = canvasRef.current
    snapshotRef.current = ctxRef.current?.getImageData(0, 0, canvas.width, canvas.height)
    currentStroke.current = { color: tool === 'eraser' ? '#000' : color, size: tool === 'eraser' ? size * 4 : size, tool, points: [pt], x1: pt.x, y1: pt.y }
  }

  function handleMove(e) {
    if (!isDrawing.current) return
    e.preventDefault()
    const pt = getCanvasPoint(e)
    const ctx = ctxRef.current

    if (tool === 'pen' || tool === 'eraser') {
      currentStroke.current.points.push(pt)
      ctx.save()
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
      ctx.strokeStyle = tool === 'eraser' ? '#000' : color
      ctx.lineWidth = tool === 'eraser' ? size * 4 : size
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.beginPath(); ctx.moveTo(lastPoint.current.x, lastPoint.current.y); ctx.lineTo(pt.x, pt.y); ctx.stroke()
      ctx.restore()
    } else {
      // Shape preview: restore snapshot then draw
      if (snapshotRef.current) {
        const canvas = canvasRef.current
        const dpr = window.devicePixelRatio || 1
        ctx.putImageData(snapshotRef.current, 0, 0)
      }
      const preview = { ...currentStroke.current, x2: pt.x, y2: pt.y }
      drawStroke(ctx, preview)
    }
    lastPoint.current = pt
  }

  function handleEnd(e) {
    if (!isDrawing.current) return
    isDrawing.current = false
    const pt = lastPoint.current || startPoint.current
    const finalStroke = { ...currentStroke.current, x2: pt.x, y2: pt.y }
    if (tool === 'pen' || tool === 'eraser') {
      if (currentStroke.current.points.length > 1) {
        strokesRef.current.push(currentStroke.current)
        send(WS.WHITEBOARD_DELTA, { stroke: currentStroke.current })
      }
    } else {
      strokesRef.current.push(finalStroke)
      send(WS.WHITEBOARD_DELTA, { stroke: finalStroke })
      redrawAll()
    }
    currentStroke.current = null; startPoint.current = null; lastPoint.current = null; snapshotRef.current = null
  }

  function handleClear() { strokesRef.current = []; redrawAll(); send(WS.WHITEBOARD_DELTA, { clear: true }) }

  function handleTextSubmit() {
    if (!textInput) return
    if (textInput.value.trim()) {
      const stroke = { tool: 'text', color, size, x: textInput.x, y: textInput.y, text: textInput.value }
      strokesRef.current.push(stroke); send(WS.WHITEBOARD_DELTA, { stroke }); redrawAll()
    }
    setTextInput(null)
  }

  useEffect(() => {
    if (!wsRef?.current) return
    const handler = (e) => {
      try {
        const envelope = JSON.parse(e.data)
        if (envelope.event === WS.WHITEBOARD_UPDATE) {
          const { stroke, clear } = envelope.payload
          if (clear) { strokesRef.current = []; redrawAll() }
          else if (stroke) { strokesRef.current.push(stroke); if (ctxRef.current) drawStroke(ctxRef.current, stroke) }
        }
      } catch { }
    }
    wsRef.current.addEventListener('message', handler)
    return () => wsRef.current?.removeEventListener('message', handler)
  }, [wsRef, redrawAll])

  useEffect(() => {
    if (getRef) getRef.current = () => canvasRef.current?.toDataURL('image/png') ?? null
  }, [getRef])

  return (
    <div className="flex h-full w-full min-h-0" style={{ background: '#f8fafc' }}>
      {/* ── Vertical toolbar ── */}
      <div className="flex flex-col items-center gap-1 py-3 px-2"
        style={{ background: '#fff', borderRight: '1px solid #e2e8f0', width: 60, flexShrink: 0 }}>
        {/* Tools */}
        {TOOLS.map(t => (
          <button key={t.id} title={t.label} onClick={() => setTool(t.id)}
            className="wb-tool" style={{ color: tool === t.id ? '#fff' : '#64748b', background: tool === t.id ? '#4f46e5' : 'transparent' }}>
            {ToolIcons[t.id]}
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: 32, height: 1, background: '#e2e8f0', margin: '4px 0' }} />

        {/* Color swatches */}
        <div className="flex flex-col gap-1.5 items-center">
          {COLORS.map(c => (
            <button key={c} title={c} onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen') }}
              style={{
                width: 24, height: 24, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                outline: color === c ? '3px solid #4f46e5' : '2px solid #e2e8f0',
                outlineOffset: '1px', transition: 'outline 0.1s'
              }} />
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 32, height: 1, background: '#e2e8f0', margin: '4px 0' }} />

        {/* Stroke sizes */}
        {SIZES.map(s => (
          <button key={s} title={`Size ${s}`} onClick={() => setSize(s)}
            style={{
              width: 40, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 10, cursor: 'pointer', border: 'none',
              background: size === s ? '#eef2ff' : 'transparent',
            }}>
            <div style={{ width: Math.min(s + 4, 28), height: Math.min(s + 4, 28), borderRadius: '50%', background: color }} />
          </button>
        ))}

        {/* Clear */}
        <div style={{ flex: 1 }} />
        <button title="Clear all" onClick={handleClear}
          style={{ width: 40, height: 40, borderRadius: 12, background: '#fef2f2', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>

      {/* ── Canvas area ── */}
      <div className={`flex-1 relative ${tool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
        style={{ background: '#fff', minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
          onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
          className="absolute inset-0 w-full h-full"
        />
        {textInput && (
          <input autoFocus type="text" value={textInput.value}
            onChange={e => setTextInput({ ...textInput, value: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') handleTextSubmit() }}
            onBlur={handleTextSubmit}
            style={{
              position: 'absolute', left: `${textInput.x}px`, top: `${textInput.y - Math.max(16, size * 4)}px`,
              color, fontSize: `${Math.max(16, size * 4)}px`, fontFamily: 'Inter, sans-serif',
              background: 'rgba(255,255,255,0.85)', border: '2px dashed #4f46e5', borderRadius: 6,
              outline: 'none', minWidth: '120px', padding: '2px 6px', zIndex: 100
            }}
          />
        )}
      </div>
    </div>
  )
}
