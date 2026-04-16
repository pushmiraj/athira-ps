import { useState } from 'react'
import useSidecarStore from '../../../store/sidecarStore'
import * as WS from '../../../lib/wsEvents'
import useSessionStore from '../../../store/sessionStore'

export default function ReflectionEditor({ send }) {
  const { reflectionNotes, addReflection } = useSidecarStore()
  const { elapsedMs } = useSessionStore()
  const [text, setText] = useState('')

  function handleSave() {
    if (!text.trim()) return
    const note = { content: text.trim(), timestamp_ms: elapsedMs }
    addReflection(note)
    send(WS.REFLECTION_SAVED, note)
    setText('')
  }

  return (
    <div className="space-y-3">
      <div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a private note, mnemonic, or reflection…"
          rows={4}
          className="w-full bg-slate-800/60 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />
        <button
          onClick={handleSave}
          disabled={!text.trim()}
          className="mt-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors"
        >
          Save Note
        </button>
      </div>

      {reflectionNotes.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {reflectionNotes.map((note, i) => (
            <div key={i} className="bg-slate-800/40 border border-slate-700 rounded-lg px-3 py-2">
              <p className="text-xs text-slate-300 leading-relaxed">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
