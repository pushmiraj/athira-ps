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
        <div className="flex flex-col h-full relative bg-transparent">
            <div className="absolute top-2 right-4 text-[10px] text-white/40 font-mono tracking-widest uppercase pointers-none">
                Shared Space
            </div>
            <textarea
                className="flex-1 w-full bg-transparent text-white/90 outline-none p-12 resize-none custom-scrollbar font-mono text-sm leading-8"
                placeholder="Start typing — both student and tutor will see this..."
                value={editorText}
                onChange={handleChange}
                spellCheck="false"
            />
        </div>
    )
}
