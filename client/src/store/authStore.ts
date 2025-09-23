import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// Define User type locally to avoid import issues
interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

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
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  immer((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,

    login: async (username: string, password: string) => {
      set({ isLoading: true, error: null })

      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Login failed')
        }

        const { token, user } = data

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
          error: error.message || 'Login failed',
          isLoading: false
        })
        throw error
      }
    },

    register: async (username: string, email: string, password: string) => {
      set({ isLoading: true, error: null })

      try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed')
        }

        set({ isLoading: false })
      } catch (error: any) {
        set({
          error: error.message || 'Registration failed',
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

    initializeAuth: () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (token && storedUser) {
        try {
          const user = JSON.parse(storedUser)
          set({
            user,
            token,
            isAuthenticated: true,
          })
        } catch (error) {
          console.error('Failed to parse stored user:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
    },
  }))
)
