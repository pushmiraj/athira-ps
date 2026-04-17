import useSessionStore from '../../../store/sessionStore'
import * as WS from '../../../lib/wsEvents'

export default function SharedTextEditor({ send }) {
    const editorText = useSessionStore(state => state.editorText)
    const setEditorText = useSessionStore(state => state.setEditorText)

    function handleChange(e) {
        const newText = e.target.value
        setEditorText(newText)

        // Broadcast locally generated payload
        send(WS.TEXT_EDITOR_DELTA, { content: newText })
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 border-b border-slate-700 relative">
            <div className="absolute top-2 right-2 text-xs text-slate-500 font-mono">Real-time Editor</div>
            <textarea
                className="flex-1 w-full bg-transparent text-slate-200 outline-none p-4 resize-none font-mono text-sm"
                placeholder="Start typing..."
                value={editorText}
                onChange={handleChange}
                spellCheck="false"
            />
        </div>
    )
}
