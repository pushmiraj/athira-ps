import { create } from 'zustand'

const useDiagnosticStore = create((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: {},      // { [question_id]: { selected_index, confidence } }
  isComplete: false,

  setQuestions: (questions) => set({ questions, currentIndex: 0, answers: {}, isComplete: false }),

  submitAnswer: (question_id, selected_index, confidence) => {
    set((state) => {
      const answers = { ...state.answers, [question_id]: { selected_index, confidence } }
      const nextIndex = state.currentIndex + 1
      const isComplete = nextIndex >= state.questions.length
      return { answers, currentIndex: nextIndex, isComplete }
    })
  },

  markComplete: () => set({ isComplete: true }),

  getAnswersList: () => {
    const { questions, answers } = get()
    return questions.map(q => ({
      question_id: q.id,
      selected_index: answers[q.id]?.selected_index ?? 0,
      confidence: answers[q.id]?.confidence ?? 3,
    })).filter(a => answers[a.question_id] !== undefined)
  },

  reset: () => set({ questions: [], currentIndex: 0, answers: {}, isComplete: false }),
}))

export default useDiagnosticStore
