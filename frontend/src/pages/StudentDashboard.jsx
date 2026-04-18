import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import BookingModal from '../components/dashboard/BookingModal'

export default function StudentDashboard() {
    const { user, logout } = useAuthStore()
    const [sessions, setSessions] = useState([])
    const [snapshots, setSnapshots] = useState([])
    const [showBooking, setShowBooking] = useState(false)
    const [activeView, setActiveView] = useState('hub') // 'hub' or 'history'
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/sessions').then(r => setSessions(r.data)).catch(() => { })
        // Fetch all snapshots for the student
        api.get('/snapshots/student/all').then(r => setSnapshots(r.data)).catch(() => { })
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
        <div className="min-h-screen bg-background flex w-full">
            {/* Left Thick Sidebar */}
            <aside className="w-72 bg-surface-container-low flex flex-col p-6 ghost-border-b border-r border-t-0 border-l-0 border-b-0 border-[var(--color-outline-variant)]">
                <div className="flex items-center gap-2 mb-12">
                    <div className="w-8 h-8 rounded-md bg-tertiary flex items-center justify-center font-bold text-white text-sm font-display tracking-wide">
                        EI
                    </div>
                    <span className="text-on-surface font-display font-semibold text-lg">Editorial Intel</span>
                </div>

                <nav className="flex flex-col gap-2">
                    <button
                        onClick={() => setActiveView('hub')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                            activeView === 'hub'
                                ? 'bg-white shadow-sm text-tertiary'
                                : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span className="text-lg">⊞</span> Hub
                    </button>
                    <button
                        onClick={() => setActiveView('history')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                            activeView === 'history'
                                ? 'bg-white shadow-sm text-tertiary'
                                : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span className="text-lg">📚</span> History
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-on-surface font-medium text-sm transition-all">
                        <span className="text-lg">📈</span> Progress
                    </button>
                </nav>

                <div className="mt-auto ghost-border-b border-t border-[var(--color-outline-variant)] border-l-0 border-r-0 border-b-0 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-semibold">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-on-surface font-medium text-sm">{user?.name}</p>
                                <p className="text-on-surface-variant text-xs font-mono">{user?.id?.substring(0,6)}</p>
                            </div>
                        </div>
                        <button onClick={logout} className="text-on-surface-variant hover:text-error transition-colors p-2 text-xl" title="Sign out">
                            ⎋
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col max-h-screen overflow-y-auto custom-scrollbar-light">
                {/* Header */}
                <header className="px-10 py-8 flex items-center justify-between">
                    <div>
                        <h1 className="headline-md text-on-surface">
                            {activeView === 'hub' ? `Ready to learn, ${user?.name?.split(' ')[0]}?` : 'Your Snapshot History'}
                        </h1>
                        <p className="body-lg text-on-surface-variant mt-1">
                            {activeView === 'hub' ? 'Book a session or join an upcoming atelier.' : 'Review your captured moments from past sessions.'}
                        </p>
                    </div>
                    {activeView === 'hub' && (
                        <button onClick={() => setShowBooking(true)} className="px-6 py-2.5 rounded-md font-semibold text-sm transition-all bg-tertiary text-white shadow-md hover:bg-[#004e3c]">
                            + Book New
                        </button>
                    )}
                </header>

                <div className="px-10 pb-10 flex flex-col gap-10">
                    {activeView === 'hub' ? (
                        <>
                    
                    {/* Active Sessions Row */}
                    <section>
                        <h2 className="title-md text-on-surface mb-6">Upcoming Agenda</h2>
                        
                        {upcoming.length === 0 ? (
                            <div className="bg-surface-container py-12 rounded-2xl border border-dashed border-outline-variant text-center">
                                <p className="text-on-surface-variant">No classes scheduled.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcoming.map(s => (
                                    <div key={s.id} className="bg-white rounded-2xl p-6 ambient-shadow hover:translate-y-[-2px] transition-transform">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-xl font-bold text-tertiary font-display">
                                                {new Date(s.scheduled_at).getDate()}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {s.status === 'live' ? (
                                                    <span className="text-error font-bold text-[10px] uppercase tracking-widest bg-error-container px-2 py-1 rounded animate-pulse">Live</span>
                                                ) : (
                                                    <span className="text-on-surface-variant font-medium text-xs bg-surface-container px-2 py-1 rounded">Scheduled</span>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-lg text-on-surface mb-1">{s.topic}</h3>
                                        <p className="text-xs text-on-surface-variant mb-6">{new Date(s.scheduled_at).toLocaleString()}</p>
                                        
                                        <button 
                                            onClick={() => navigate(`/session/${s.id}`)}
                                            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                                s.status === 'live' || s.status === 'preflight'
                                                    ? 'bg-tertiary text-white hover:bg-[#004e3c] shadow-sm'
                                                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                                            }`}
                                        >
                                            {s.status === 'live' || s.status === 'preflight' ? 'Join Atelier' : 'View Room Details'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Past Sessions Row */}
                    {completed.length > 0 && (
                        <section>
                            <h2 className="title-md text-on-surface mb-6 opacity-70">Past Ateliers</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {completed.map(s => (
                                    <div key={s.id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 mb-opacity-60 grayscale-[0.3]">
                                        <h3 className="font-medium text-on-surface truncate mb-1">{s.topic}</h3>
                                        <p className="text-xs text-on-surface-variant">{new Date(s.scheduled_at).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    </>
                    ) : (
                        /* Snapshot History View */
                        <section>
                            {snapshots.length === 0 ? (
                                <div className="bg-surface-container py-20 rounded-2xl border border-dashed border-outline-variant text-center">
                                    <p className="text-on-surface-variant text-lg">📸 No snapshots captured yet.</p>
                                    <p className="text-on-surface-variant text-sm mt-2">Capture important moments during your sessions!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {snapshots.map(snapshot => (
                                        <div key={snapshot.id} className="bg-white rounded-2xl overflow-hidden ambient-shadow hover:translate-y-[-2px] transition-transform">
                                            {/* Screenshot Preview */}
                                            {snapshot.full_page_png && (
                                                <div className="w-full aspect-video bg-surface-container-low overflow-hidden">
                                                    <img
                                                        src={snapshot.full_page_png}
                                                        alt="Snapshot"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}

                                            {/* Snapshot Details */}
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-on-surface-variant font-mono">
                                                        {new Date(snapshot.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs text-on-surface-variant">•</span>
                                                    <span className="text-xs text-on-surface-variant">
                                                        {new Date(snapshot.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>

                                                {snapshot.note && (
                                                    <p className="text-sm text-on-surface mb-3 line-clamp-2">
                                                        {snapshot.note}
                                                    </p>
                                                )}

                                                {snapshot.ai_context_tag && (
                                                    <div className="text-xs text-tertiary bg-tertiary-container px-2 py-1 rounded-md inline-block">
                                                        {snapshot.ai_context_tag}
                                                    </div>
                                                )}

                                                {/* Download Button */}
                                                <a
                                                    href={snapshot.full_page_png}
                                                    download={`snapshot-${snapshot.id}.png`}
                                                    className="block mt-3 w-full py-2 text-center bg-surface-container-low hover:bg-surface-container text-on-surface text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    Download
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>

            {showBooking && <BookingModal onBook={handleBook} onClose={() => setShowBooking(false)} />}
        </div>
    )
}
