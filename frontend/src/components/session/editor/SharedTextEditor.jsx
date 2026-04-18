import { useEffect } from 'react'
import useSessionStore from '../../../store/sessionStore'
import * as WS from '../../../lib/wsEvents'

export default function SharedTextEditor({ send, wsRef }) {
    const editorText = useSessionStore(state => state.editorText)
    const setEditorText = useSessionStore(state => state.setEditorText)

    // Listen for remote changes
    useEffect(() => {
        if (!wsRef?.current) return
        const handler = (e) => {
            try {
                const { event, payload } = JSON.parse(e.data)
                if (event === WS.TEXT_EDITOR_UPDATE) {
                    setEditorText(payload.content)
                }
            } catch { }
        }
        wsRef.current.addEventListener('message', handler)
        return () => wsRef.current?.removeEventListener('message', handler)
    }, [wsRef, setEditorText])

    function handleChange(e) {
        const newText = e.target.value
        setEditorText(newText)
        send(WS.TEXT_EDITOR_DELTA, { content: newText })
    }

    return (
        <div className="flex flex-col h-full relative" style={{ background: '#fff' }}>
            <div style={{ position: 'absolute', top: 10, right: 14, fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                📝 Shared — edits sync in real-time
            </div>
            <textarea
                style={{
                    flex: 1, width: '100%', background: 'transparent',
                    color: '#1e293b', outline: 'none', padding: '40px 16px 16px',
                    resize: 'none', fontFamily: 'DM Mono, monospace', fontSize: 14,
                    lineHeight: 1.7, border: 'none',
                }}
                placeholder="Start typing — both student and tutor will see this..."
                value={editorText}
                onChange={handleChange}
                spellCheck="false"
            />
        </div>
    )
}
