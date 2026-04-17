import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/register', form)
      login(data.access_token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-14"
        style={{ background: 'linear-gradient(145deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
          <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #a5b4fc 0%, transparent 70%)' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">Athira</span>
        </div>

        {/* Headline + Stats */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
          <h2 className="text-4xl font-bold text-white mb-5 leading-snug">
            Join thousands of learners already learning smarter.
          </h2>
          <p className="text-indigo-200 text-lg mb-10 leading-relaxed">
            Whether you're here to learn or to teach, Athira gives you the tools to make every session count.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Sessions', value: '10k+', icon: '📚' },
              { label: 'Avg. Rating', value: '4.9★', icon: '⭐' },
              { label: 'Active Tutors', value: '500+', icon: '👩‍🏫' },
              { label: 'Topics Covered', value: '120+', icon: '🎓' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-indigo-200 text-sm mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-indigo-300 text-sm">Free to start · No credit card required</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-10 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#4f46e5' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-900">Athira</span>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900">Create account</h1>
            <p className="text-slate-500 text-lg mt-2">Get started — it's completely free</p>
          </div>

          {/* Role toggle */}
          <div className="flex gap-2 mb-7 p-1.5 rounded-2xl" style={{ background: '#f1f5f9' }}>
            {[
              { value: 'student', label: "I'm a Student", emoji: '🎓' },
              { value: 'tutor', label: "I'm a Tutor", emoji: '👩‍🏫' },
            ].map(r => (
              <button key={r.value} type="button"
                onClick={() => setForm(f => ({ ...f, role: r.value }))}
                className="flex-1 py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: form.role === r.value ? '#fff' : 'transparent',
                  color: form.role === r.value ? '#1e293b' : '#64748b',
                  boxShadow: form.role === r.value ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                }}>
                <span>{r.emoji}</span><span>{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input value={form.name} onChange={set('name')} required placeholder="Alex Chen"
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl text-base focus:outline-none focus:border-indigo-500 bg-slate-50 transition-all placeholder-slate-400"
                  style={{ fontSize: '16px' }} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">Email address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl text-base focus:outline-none focus:border-indigo-500 bg-slate-50 transition-all placeholder-slate-400"
                  style={{ fontSize: '16px' }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="Min. 8 characters"
                  className="w-full pl-12 pr-14 py-4 border-2 border-slate-200 rounded-2xl text-base focus:outline-none focus:border-indigo-500 bg-slate-50 transition-all placeholder-slate-400"
                  style={{ fontSize: '16px' }} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                  {showPassword
                    ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-2xl px-4 py-4" style={{ background: '#fef2f2', border: '1.5px solid #fca5a5' }}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#ef4444"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-red-600 text-base">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : `Join as ${form.role === 'student' ? 'Student 🎓' : 'Tutor 👩‍🏫'}`}
            </button>
          </form>

          <p className="text-center text-base text-slate-500 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color: '#4f46e5' }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
