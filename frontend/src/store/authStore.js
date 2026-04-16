import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (token, user) => {
    localStorage.setItem('athira_token', token)
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('athira_token')
    set({ token: null, user: null, isAuthenticated: false })
  },

  // Rehydrate from localStorage on app start
  rehydrate: () => {
    const token = localStorage.getItem('athira_token')
    if (token) {
      // We'll decode the user from the API /auth/me in App.jsx
      set({ token, isAuthenticated: true })
    }
  },

  setUser: (user) => set({ user }),
}))

export default useAuthStore
