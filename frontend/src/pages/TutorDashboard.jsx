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
        <div className="min-h-screen bg-background flex w-full">
            {/* Left Thick Sidebar */}
            <aside className="w-72 bg-surface-container-low flex flex-col p-6 ghost-border-b border-r border-t-0 border-l-0 border-b-0 border-[var(--color-outline-variant)]">
                <div className="flex items-center gap-2 mb-12">
                    <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center font-bold text-white text-sm font-display tracking-wide">
                        EI
                    </div>
                    <span className="text-on-surface font-display font-semibold text-lg">Editorial Intel</span>
                </div>

                <nav className="flex flex-col gap-2">
                    <button className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm rounded-lg text-primary font-medium text-sm transition-all">
                        <span className="text-lg">⊞</span> Dashboard
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-on-surface font-medium text-sm transition-all">
                        <span className="text-lg">📚</span> Sessions
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-on-surface font-medium text-sm transition-all">
                        <span className="text-lg">👥</span> Students
                    </button>
                </nav>

                <div className="mt-auto ghost-border-b border-t border-[var(--color-outline-variant)] border-l-0 border-r-0 border-b-0 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-semibold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <div>
                                <p className="text-on-surface font-medium text-sm">{user?.name}</p>
                                <p className="text-on-surface-variant text-xs">Senior Tutor</p>
                            </div>
                        </div>
                        <button onClick={logout} className="text-on-surface-variant hover:text-error transition-colors p-2 text-xl" title="Sign out">
                            ⎋
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col max-h-screen overflow-y-auto custom-scrollbar-light">
                {/* Header */}
                <header className="px-10 py-8 flex items-center justify-between">
                    <div>
                        <h1 className="headline-md text-on-surface">Good morning, {user?.name?.split(' ')[0] || 'Tutor'}.</h1>
                        <p className="body-lg text-on-surface-variant mt-1">Here is your timeline for today.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">🔍</span>
                            <input 
                                type="text" 
                                placeholder="Search sessions..." 
                                className="pl-10 pr-4 py-2.5 bg-surface-container-low rounded-full text-sm outline-none focus:bg-surface-container transition-colors w-64 text-on-surface"
                            />
                        </div>
                        <button className="btn-gradient px-6 py-2.5">
                            + New Session
                        </button>
                    </div>
                </header>

                {/* Grid Layout */}
                <div className="px-10 pb-10 flex flex-col xl:flex-row gap-8 flex-1">
                    
                    {/* Left Column: Sessions List */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="title-md text-on-surface">Upcoming Sessions</h2>
                            <button className="text-primary text-sm font-semibold hover:underline">View All</button>
                        </div>

                        {sessions.length === 0 ? (
                            <div className="bg-surface-container-low rounded-2xl p-12 text-center">
                                <div className="text-4xl mb-4">📚</div>
                                <h3 className="text-on-surface font-semibold mb-2">No active sessions</h3>
                                <p className="text-on-surface-variant text-sm">Your schedule is clear for now.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map(s => (
                                    <div key={s.id} className="bg-white rounded-2xl p-6 ambient-shadow flex items-start gap-6 group hover:translate-x-1 transition-transform cursor-pointer">
                                        <div className="w-16 h-16 rounded-xl bg-surface-container-low flex flex-col items-center justify-center flex-shrink-0 text-on-surface">
                                            <span className="text-sm font-semibold">
                                                {new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                                            </span>
                                            <span className="text-xs uppercase text-on-surface-variant">
                                                {new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[1]}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-semibold text-on-surface text-lg">{s.topic}</h3>
                                                {s.status === 'live' && (
                                                    <span className="px-2.5 py-0.5 rounded-full bg-error-container text-error text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                                        Live Now
                                                    </span>
                                                )}
                                                {s.status === 'preflight' && (
                                                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface text-[10px] font-bold uppercase tracking-wider">
                                                        Soon
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-on-surface-variant flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                Student Focus: {s.sub_topics?.[0] || 'General'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end justify-between self-stretch">
                                            <div className="flex -space-x-2">
                                                <div className="w-8 h-8 rounded-full bg-tertiary text-white flex items-center justify-center text-xs font-medium border-2 border-white">S</div>
                                                <div className="w-8 h-8 rounded-full bg-surface-container border-2 border-white flex items-center justify-center text-xs font-medium">T</div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/session/${s.id}`); }}
                                                className={`mt-4 px-5 py-2 rounded-md text-xs font-bold transition-all ${
                                                    s.status === 'live' || s.status === 'preflight' 
                                                        ? 'bg-primary text-white shadow-md hover:bg-primary-container' 
                                                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                                                }`}
                                            >
                                                {s.status === 'live' || s.status === 'preflight' ? 'Enter Room' : 'View Details'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Widgets */}
                    <div className="w-full xl:w-80 flex flex-col gap-6">
                        {/* Profile Widget */}
                        <div className="bg-surface-container-low rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform" />
                            <h3 className="title-md text-on-surface mb-6">Profile Snapshot</h3>
                            
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-semibold">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-on-surface">{user?.name}</h4>
                                    <p className="text-xs text-on-surface-variant font-mono mt-0.5">ID: {user?.id?.substring(0, 8)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm">
                                    <div className="text-xs text-on-surface-variant font-medium uppercase tracking-wide mb-1">Rating</div>
                                    <div className="text-2xl font-bold text-on-surface font-display">4.9<span className="text-sm text-primary ml-1">★</span></div>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm">
                                    <div className="text-xs text-on-surface-variant font-medium uppercase tracking-wide mb-1">Sessions</div>
                                    <div className="text-2xl font-bold text-on-surface font-display">{sessions.length}</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Notes Widget */}
                        <div className="bg-white rounded-2xl p-6 ambient-shadow flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="title-md text-on-surface">Quick Notes</h3>
                                <button className="text-on-surface-variant hover:text-primary text-sm font-semibold">Edit</button>
                            </div>
                            <div className="bg-surface-container-lowest p-4 rounded-xl ghost-border h-48 overflow-y-auto">
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    • Prepare physics analogies for Alex's session at 2PM. <br/><br/>
                                    • Review the new "Analog Engine" feature guide inside the focus well. <br/><br/>
                                    • Follow up on the calculus homework assigned yesterday.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}
