import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function TutorDashboard() {
  const { user, logout } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/sessions').then(r => setSessions(r.data)).catch(() => { })
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold text-blue-600">Athira</span>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-600">Tutor Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">Hi, {user?.name}</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-semibold text-blue-900">Your Tutor Profile</h3>
            <p className="text-sm text-blue-700 mt-1">Need your ID? Here it is.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm text-sm">
            <span className="text-slate-500 mr-2">Tutor ID:</span>
            <span className="font-mono font-medium text-slate-900 select-all">{user?.id}</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Upcoming Sessions</h2>
          <p className="text-slate-500 text-sm mt-1">Students who have booked sessions with you</p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">No sessions scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">{s.topic}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {new Date(s.scheduled_at).toLocaleString()} ·
                    <span className={`ml-1 ${s.status === 'live' ? 'text-green-600 font-semibold' : 'text-slate-500'}`}>{s.status}</span>
                  </p>
                  {s.session_contract && (
                    <p className="text-xs text-blue-600 mt-1 italic">"{s.session_contract}"</p>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/session/${s.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  {s.status === 'live' ? 'Join Now' : 'Open Room'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
