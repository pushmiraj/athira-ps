import { useState, useEffect } from 'react'
import api from '../../lib/api'

export default function BookingModal({ onBook, onClose }) {
  const [tutors, setTutors] = useState([])
  const [form, setForm] = useState({
    tutor_id: '',
    topic: '',
    sub_topics_raw: '',
    scheduled_at: '',
  })
  const [loading, setLoading] = useState(false)

  // Fetch available tutors
  useEffect(() => {
    api.get('/auth/tutors').then(r => setTutors(r.data)).catch(() => {})
  }, [])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const sub_topics = form.sub_topics_raw.split(',').map(s => s.trim()).filter(Boolean)
      await onBook({
        tutor_id: form.tutor_id,
        topic: form.topic,
        sub_topics,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">Book a Session</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tutor</label>
            <select value={form.tutor_id} onChange={set('tutor_id')} required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="" disabled>Select a tutor...</option>
              {tutors.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
            <input value={form.topic} onChange={set('topic')} required placeholder="e.g. Advanced Calculus — Implicit Differentiation"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sub-topics (comma-separated)</label>
            <input value={form.sub_topics_raw} onChange={set('sub_topics_raw')} placeholder="Chain Rule, Product Rule, Implicit Differentiation"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
            <input type="datetime-local" value={form.scheduled_at} onChange={set('scheduled_at')} required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Booking…' : 'Book Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
