import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import api, { LoginResponse, User } from '../utils/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  immer((set, get) => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,

    login: async (username: string, password: string) => {
      set({ isLoading: true, error: null })

      try {
        const response = await api.post('/api/auth/login', { username, password })
        const { token, user } = response.data

        // Store token and user data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        })
      } catch (error: any) {
        set({
          error: error.response?.data?.message || 'Login failed',
          isLoading: false
        })
        throw error
      }
    },

    register: async (username: string, email: string, password: string) => {
      set({ isLoading: true, error: null })

      try {
        const response = await api.post('/api/auth/register', {
          username,
          email,
          password
        })

        set({ isLoading: false })
      } catch (error: any) {
        set({
          error: error.response?.data?.message || 'Registration failed',
          isLoading: false
        })
        throw error
      }
    },

    logout: () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null
      })
    },

    setUser: (user: User) =>
      set({ user }),

    setLoading: (isLoading: boolean) =>
      set({ isLoading }),

    setError: (error: string | null) =>
      set({ error }),
  }))
)

// Initialize user from localStorage on app start
const storedUser = localStorage.getItem('user')
if (storedUser) {
  try {
    const user = JSON.parse(storedUser)
    useAuthStore.getState().setUser(user)
  } catch (error) {
    console.error('Failed to parse stored user:', error)
    localStorage.removeItem('user')
  }
}
