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
    <div className="space-y-4">
      <div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a private note, mnemonic, or reflection…"
          rows={4}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none shadow-sm"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm"
          >
            Save Note
          </button>
        </div>
      </div>

      {reflectionNotes.length > 0 && (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 relative">
          <div className="sticky top-0 bg-white pb-2 mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Past Notes</h4>
          </div>
          {reflectionNotes.map((note, i) => (
            <div key={i} className="bg-white border border-slate-200 shadow-sm rounded-lg px-3.5 py-3">
              <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
