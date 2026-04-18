import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../lib/api'

export default function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuthStore()
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!formData.email || !formData.password) {
            setError('Please enter both email and password.')
            return
        }
        setLoading(true); setError('')

        try {
            const { data } = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password
            })
            login(data.access_token, data.user)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials or server error.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex w-full bg-background">
            {/* Left Column: Visual/Atmospheric */}
            <div className="hidden lg:flex flex-col w-1/2 p-16 justify-center" style={{ background: 'linear-gradient(135deg, #1e1e2d, #2e2e42)' }}>
                <div className="flex items-center gap-2 mb-16 opacity-90">
                    <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center font-bold text-white text-sm font-display tracking-wide">
                        EI
                    </div>
                    <span className="text-white font-display font-semibold text-lg">Editorial Intel</span>
                </div>
                
                <h1 className="text-white display-lg mb-8 max-w-xl">
                    Transform every tutoring session into a breakthrough.
                </h1>
                
                <div className="space-y-8 mt-12 max-w-lg">
                    <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-highest/20 flex-shrink-0 flex items-center justify-center text-white text-xl">📊</div>
                        <div>
                            <h3 className="text-white font-body font-semibold mb-1 text-[1.125rem]">Pre-Flight Diagnostics</h3>
                            <p className="text-slate-400 font-body text-sm leading-relaxed">Instantly identify knowledge gaps before the session begins, allowing you to tailor your approach for maximum impact.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-highest/20 flex-shrink-0 flex items-center justify-center text-white text-xl">🧠</div>
                        <div>
                            <h3 className="text-white font-body font-semibold mb-1 text-[1.125rem]">Analogy Engine</h3>
                            <p className="text-slate-400 font-body text-sm leading-relaxed">Generate contextually relevant, student-specific metaphors on the fly to explain complex abstract concepts.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-16 text-slate-500 font-body text-xs">
                    © 2024 Editorial Intel. The Academic Atelier.
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16">
                <div className="w-full max-w-md">
                    <h2 className="headline-md text-on-surface mb-2">Welcome Back</h2>
                    <p className="body-lg mb-10">Sign in to access your academic workspace.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-error-container text-error rounded-md text-sm font-medium">
                                {error}
                            </div>
                        )}
                        
                        <div className="group">
                            <label className="block text-on-surface-variant font-medium text-xs mb-2 uppercase">Email Address</label>
                            <input
                                autoFocus
                                type="email"
                                placeholder="tutor@university.edu"
                                className="w-full bg-surface-container-lowest text-on-surface p-4 border border-x-0 border-t-0 border-b-[var(--color-outline-variant)] outline-none focus:bg-surface-container-low transition-colors text-sm"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="group">
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-on-surface-variant font-medium text-xs uppercase">Password</label>
                                <a href="#" className="font-medium text-primary text-xs hover:underline">Forgot password?</a>
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-surface-container-lowest text-on-surface p-4 border border-x-0 border-t-0 border-b-[var(--color-outline-variant)] outline-none focus:bg-surface-container-low transition-colors text-sm"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full btn-gradient py-4 text-sm font-semibold tracking-wide disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-on-surface-variant text-sm">
                            Need an atelier? <Link to="/register" className="text-primary font-semibold hover:underline">Create an account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
