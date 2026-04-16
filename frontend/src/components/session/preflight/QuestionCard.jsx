import { useState } from 'react'

export default function QuestionCard({ question, questionNumber, totalQuestions, onSubmit }) {
  const [selected, setSelected] = useState(null)
  const [confidence, setConfidence] = useState(3)

  function handleSubmit() {
    if (selected === null) return
    onSubmit(question.id, selected, confidence)
  }

  const confidenceLabels = ['', 'Guessing', 'Unsure', 'Somewhat sure', 'Fairly sure', 'Very sure']

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-blue-400">
            Sub-topic: {question.sub_topic}
          </span>
          <span className="text-xs text-slate-500 ml-auto">
            {questionNumber} of {totalQuestions}
          </span>
        </div>
        <h3 className="text-lg font-medium text-white leading-relaxed">{question.question_text}</h3>
      </div>

      <div className="space-y-3 mb-8">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`w-full text-left px-5 py-4 rounded-xl border text-sm transition-all ${
              selected === i
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-400 hover:bg-slate-700'
            }`}
          >
            <span className="font-medium mr-3 text-slate-400">{String.fromCharCode(65 + i)}.</span>
            {option}
          </button>
        ))}
      </div>

      {/* Confidence Slider */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">How confident are you?</label>
          <span className="text-sm font-semibold text-blue-400">{confidenceLabels[confidence]}</span>
        </div>
        <input
          type="range" min="1" max="5" value={confidence}
          onChange={e => setConfidence(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #2563EB ${(confidence - 1) * 25}%, #334155 ${(confidence - 1) * 25}%)`
          }}
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Just guessing</span>
          <span>100% certain</span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Submit Answer
      </button>
    </div>
  )
}
