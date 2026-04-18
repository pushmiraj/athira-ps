import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'

export default function RegisterPage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        first_name: '', last_name: '',
        email: '', password: '', role: 'student'
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!formData.first_name || !formData.email || !formData.password) {
            setError('Please fill in all required fields.')
            return
        }
        setLoading(true); setError('')

        try {
            await api.post('/auth/register', {
                name: `${formData.first_name} ${formData.last_name || ''}`.trim(),
                email: formData.email,
                password: formData.password,
                role: formData.role
            })
            navigate('/login')
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail.map(d => d.msg).join(', '));
            } else if (typeof detail === 'string') {
                setError(detail);
            } else {
                setError('Registration failed. Try again.');
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex w-full bg-background">
            {/* Left Column: Visual/Atmospheric */}
            <div className="hidden lg:flex flex-col w-1/2 p-16 justify-center" style={{ background: 'linear-gradient(135deg, #1e1e2d, #2e2e42)' }}>
                <div className="flex items-center gap-2 mb-16 opacity-90">
                    <div className="w-8 h-8 rounded-md bg-tertiary flex items-center justify-center font-bold text-white text-sm font-display tracking-wide">
                        EI
                    </div>
                    <span className="text-white font-display font-semibold text-lg">Editorial Intel</span>
                </div>

                <h1 className="text-white display-lg mb-6 max-w-xl">
                    Shape the next generation of academic excellence.
                </h1>

                <p className="text-slate-400 body-lg max-w-md mb-16 leading-relaxed">
                    Join an elite network of educators. Build your atelier, connect with driven students, and elevate your teaching practice.
                </p>

                <div className="flex gap-16 mt-auto">
                    <div>
                        <div className="text-tertiary-fixed font-display text-4xl font-bold mb-1">10k+</div>
                        <div className="text-slate-400 font-body text-xs font-medium tracking-wide pb-4 border-b border-[rgba(255,255,255,0.15)]">Sessions Hosted</div>
                    </div>
                    <div>
                        <div className="text-white font-display text-4xl font-bold mb-1">4.9</div>
                        <div className="text-slate-400 font-body text-xs font-medium tracking-wide pb-4 border-b border-[rgba(255,255,255,0.15)]">Avg. Rating</div>
                    </div>
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16">
                <div className="w-full max-w-md">
                    <h2 className="headline-md text-on-surface mb-2">Create your account</h2>
                    <p className="body-lg mb-8">Step into the Academic Atelier.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-error-container text-error rounded-md text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="flex bg-surface-container-low p-1 rounded-lg">
                            <button
                                type="button"
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.role === 'student' ? 'bg-white shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                                onClick={() => setFormData({ ...formData, role: 'student' })}
                            >
                                I'm a Student
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.role === 'tutor' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                                onClick={() => setFormData({ ...formData, role: 'tutor' })}
                            >
                                I'm a Tutor
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <div className="group flex-1">
                                <label className="block text-on-surface-variant font-medium text-xs mb-2 uppercase">First Name</label>
                                <input
                                    type="text" placeholder="Jane"
                                    className="w-full bg-transparent text-on-surface p-3 border border-x-0 border-t-0 border-b-[var(--color-outline-variant)] outline-none focus:bg-surface-container-low transition-colors text-sm"
                                    value={formData.first_name}
                                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>
                            <div className="group flex-1">
                                <label className="block text-on-surface-variant font-medium text-xs mb-2 uppercase">Last Name</label>
                                <input
                                    type="text" placeholder="Doe"
                                    className="w-full bg-transparent text-on-surface p-3 border border-x-0 border-t-0 border-b-[var(--color-outline-variant)] outline-none focus:bg-surface-container-low transition-colors text-sm"
                                    value={formData.last_name}
                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-on-surface-variant font-medium text-xs mb-2 uppercase">Email Address</label>
                            <input
                                type="email"
                                placeholder="jane.doe@university.edu"
                                className="w-full bg-transparent text-on-surface p-3 border border-x-0 border-t-0 border-b-[var(--color-outline-variant)] outline-none focus:bg-surface-container-low transition-colors text-sm"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="group">
                            <label className="block text-on-surface-variant font-medium text-xs mb-2 uppercase">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-transparent text-on-surface p-3 border border-x-0 border-t-0 border-b-[var(--color-outline-variant)] outline-none focus:bg-surface-container-low transition-colors text-sm"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-gradient py-4 text-sm font-semibold tracking-wide disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Creating account...' : 'Complete Registration ➔'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-on-surface-variant">Already have an atelier? </span>
                        <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
