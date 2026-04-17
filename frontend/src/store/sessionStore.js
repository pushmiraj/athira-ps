import { create } from 'zustand'

const useSessionStore = create((set, get) => ({
  session: null,
  status: 'idle',        // idle | preflight | live | completed
  participants: {},      // { [user_id]: { name, role, connected } }
  transcriptBuffer: [],  // rolling buffer of transcript segments
  sessionContract: null,
  proficiency: [],
  elapsedMs: 0,
  editorText: '',

  setSession: (session) => set({ session, status: session?.status || 'idle' }),
  setStatus: (status) => set({ status }),
  setSessionContract: (contract) => set({ sessionContract: contract }),
  setProficiency: (proficiency) => set({ proficiency }),
  setEditorText: (text) => set({ editorText: text }),

  addParticipant: (participant) => set((state) => ({
    participants: {
      ...state.participants,
      [participant.user_id]: { ...participant, connected: true },
    },
  })),

  removeParticipant: (user_id) => set((state) => {
    const updated = { ...state.participants }
    if (updated[user_id]) updated[user_id].connected = false
    return { participants: updated }
  }),

  addTranscriptSegment: (segment) => set((state) => {
    const buffer = [...state.transcriptBuffer, segment]
    // Keep last 60 segments (~120s rolling window)
    return { transcriptBuffer: buffer.slice(-60) }
  }),

  getLastNTranscript: (n = 20) => {
    const buf = get().transcriptBuffer
    return buf.slice(-n).map(s => s.text).join(' ')
  },

  getLastSecondsTranscript: (seconds = 30) => {
    const buf = get().transcriptBuffer
    const cutoff = Date.now() - seconds * 1000
    const recent = buf.filter(s => (s.timestamp_ms || 0) >= cutoff)
    return (recent.length > 0 ? recent : buf.slice(-5)).map(s => s.text).join(' ')
  },

  tick: (deltaMs) => set((state) => ({ elapsedMs: state.elapsedMs + deltaMs })),

  reset: () => set({
    session: null, status: 'idle', participants: {}, transcriptBuffer: [],
    sessionContract: null, proficiency: [], elapsedMs: 0, editorText: ''
  }),
}))

export default useSessionStore
