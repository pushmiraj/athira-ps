import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import BookingModal from '../components/dashboard/BookingModal'

export default function StudentDashboard() {
  const { user, logout } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [showBooking, setShowBooking] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/sessions').then(r => setSessions(r.data)).catch(() => { })
  }, [])

  async function handleBook(sessionData) {
    const { data } = await api.post('/sessions', sessionData)
    setSessions(s => [...s, data])
    api.post(`/diagnostic/${data.id}/generate`, {
      topic: data.topic,
      sub_topics: data.sub_topics || [],
    }).catch(() => { })
    setShowBooking(false)
  }

  const upcoming = sessions.filter(s => s.status === 'scheduled' || s.status === 'preflight' || s.status === 'live')
  const completed = sessions.filter(s => s.status === 'completed')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">Athira</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-700">
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name}</span>
            </div>
            <button onClick={logout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563EB 60%, #7C3AED 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-1">Student Portal</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Good to see you, {user?.name?.split(' ')[0] || 'there'} 👋
              </h1>
              <p className="text-blue-200 text-sm">Ready for your next session? Your tutor is waiting.</p>
            </div>
            <button onClick={() => setShowBooking(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20 self-start sm:self-auto whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Book a Session
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: 'Total Sessions', value: sessions.length, icon: '📚' },
              { label: 'Upcoming', value: upcoming.length, icon: '📅' },
              { label: 'Completed', value: completed.length, icon: '✅' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-blue-200 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* My Profile */}
        <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-blue-900">Your Student Profile</h3>
            <p className="text-sm text-blue-700 mt-1">Review your unique identifier.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm text-sm">
            <span className="text-slate-500 mr-2">Student ID:</span>
            <span className="font-mono font-medium text-slate-900 select-all">{user?.id}</span>
          </div>
        </div>

        {sessions.length === 0 ? (
          <EmptyState onBook={() => setShowBooking(true)} />
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <h2 className="text-base font-bold text-slate-900">Upcoming Sessions</h2>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{upcoming.length}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcoming.map(s => <SessionCard key={s.id} session={s} navigate={navigate} />)}
                </div>
              </section>
            )}
            {completed.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <h2 className="text-base font-bold text-slate-900">Past Sessions</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {completed.map(s => <SessionCard key={s.id} session={s} navigate={navigate} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {showBooking && <BookingModal onBook={handleBook} onClose={() => setShowBooking(false)} />}
    </div>
  )
}

function SessionCard({ session: s, navigate }) {
  const statusConfig = {
    scheduled: { label: 'Scheduled', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
    preflight: { label: 'Starting Soon', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    live: { label: 'Live Now', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500 animate-pulse' },
    completed: { label: 'Completed', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-300' },
  }
  const cfg = statusConfig[s.status] || statusConfig.scheduled

  const subjectColors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-violet-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
  ]
  const colorIdx = s.topic.length % subjectColors.length
  const gradient = subjectColors[colorIdx]

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-blue-200 hover:shadow-md transition-all group">
      {/* Card header */}
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{s.topic}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(s.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} flex-shrink-0`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        {s.sub_topics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {s.sub_topics.slice(0, 3).map(t => (
              <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{t}</span>
            ))}
            {s.sub_topics.length > 3 && (
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">+{s.sub_topics.length - 3}</span>
            )}
          </div>
        )}

        <button
          onClick={() => navigate(`/session/${s.id}`)}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${s.status === 'live'
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm shadow-green-200'
              : s.status === 'completed'
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'text-white hover:opacity-90'
            }`}
          style={s.status !== 'live' && s.status !== 'completed' ? { background: 'linear-gradient(135deg, #2563EB, #7C3AED)' } : {}}>
          {s.status === 'live' ? '🔴 Join Live Session' : s.status === 'completed' ? 'View Study Pack' : 'Enter Session Room'}
        </button>
      </div>
    </div>
  )
}

function EmptyState({ onBook }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 text-4xl"
        style={{ background: 'linear-gradient(135deg, #EFF6FF, #EDE9FE)' }}>
        📚
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">No sessions yet</h3>
      <p className="text-slate-500 text-sm mb-8 max-w-xs leading-relaxed">
        Book your first session with a tutor and start learning with AI-powered tools.
      </p>
      <button onClick={onBook}
        className="flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold text-sm transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Book Your First Session
      </button>
    </div>
  )
}
