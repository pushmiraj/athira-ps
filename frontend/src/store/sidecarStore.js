import { create } from 'zustand'

const useSidecarStore = create((set) => ({
  snapshots: [],
  parkedQuestions: [],
  reflectionNotes: [],
  pendingIntentSnapshot: null,  // { snapshot_id, student_name, context_tag }
  intentCountdown: 0,
  analogyPoll: null,            // { analogy_log_id, spatial, social, abstract }
  selectedModality: null,
  analogies: null,              // tutor-side: { analogy_log_id, spatial, social, abstract }

  addSnapshot: (snapshot) => set((state) => ({
    snapshots: [...state.snapshots, snapshot],
  })),

  enrichSnapshot: (snapshot_id, tutor_intent) => set((state) => ({
    snapshots: state.snapshots.map(s =>
      s.snapshot_id === snapshot_id || s.id === snapshot_id
        ? { ...s, tutor_intent }
        : s
    ),
  })),

  addParkedQuestion: (pq) => set((state) => ({
    parkedQuestions: [...state.parkedQuestions, pq],
  })),

  addReflection: (note) => set((state) => ({
    reflectionNotes: [...state.reflectionNotes, note],
  })),

  setPendingIntent: (data) => set({ pendingIntentSnapshot: data, intentCountdown: 10 }),
  clearPendingIntent: () => set({ pendingIntentSnapshot: null, intentCountdown: 0 }),
  decrementCountdown: () => set((state) => ({
    intentCountdown: Math.max(0, state.intentCountdown - 1),
  })),

  setAnalogyPoll: (poll) => set({ analogyPoll: poll, selectedModality: null }),
  selectModality: (modality) => set({ selectedModality: modality }),
  clearAnalogyPoll: () => set({ analogyPoll: null }),

  setAnalogies: (data) => set({ analogies: data }),
  setAnalogyHighlight: (selection) => set((state) => ({
    analogies: state.analogies ? { ...state.analogies, highlight: selection } : null,
  })),

  reset: () => set({
    snapshots: [], parkedQuestions: [], reflectionNotes: [],
    pendingIntentSnapshot: null, intentCountdown: 0,
    analogyPoll: null, selectedModality: null, analogies: null,
  }),
}))

export default useSidecarStore
