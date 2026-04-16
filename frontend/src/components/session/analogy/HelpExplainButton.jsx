import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import * as WS from '../../../lib/wsEvents'

export default function HelpExplainButton({ send }) {
  const [loading, setLoading] = useState(false)

  function handleClick() {
    setLoading(true)
    send(WS.ANALOGY_REQUESTED, {})
    // Reset loading after 10s max (backend will respond via WS)
    setTimeout(() => setLoading(false), 10000)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 w-full px-4 py-3 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 rounded-xl text-sm font-medium transition-all hover:border-violet-500/60 disabled:opacity-50"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Lightbulb size={15} />
      )}
      <span>{loading ? 'Generating analogies…' : '💡 Help Me Explain'}</span>
    </button>
  )
}
