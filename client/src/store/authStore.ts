import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Define User type
interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  // Authentication methods
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  initializeAuth: () => Promise<void>;
  fetchCurrentUser: () => Promise<User>;
  set: (state: Partial<AuthState>) => void;
  // GitHub OAuth methods
  handleGitHubCallback: (code: string, state: string) => Promise<void>;
  handleGitHubMessage: (event: MessageEvent) => void;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}${BASE_URL.endsWith('/api') ? '' : '/api'}` as const;

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        
        // Set state helper
        set: (state: Partial<AuthState>) => set(state as AuthState),

        // Initialize authentication state from storage
        initializeAuth: async () => {
          const { tokens } = get();
          if (!tokens?.accessToken) return;
          
          try {
            get().setLoading(true);
            const user = await get().fetchCurrentUser();
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            console.error('Failed to initialize auth:', error);
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },

        // Login with email and password
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`${API_URL}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
              credentials: 'include',
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();
            set({
              user: data.user,
              tokens: {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false,
            });
            throw error;
          }
        },

        // Register new user
        register: async (username: string, email: string, password: string, confirmPassword: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`${API_URL}/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, email, password, confirmPassword }),
              credentials: 'include',
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Registration failed');
            }

            const data = await response.json();
            set({
              user: data.user,
              tokens: {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Registration failed',
              isLoading: false,
            });
            throw error;
          }
        },

        // Logout user
        logout: async () => {
          try {
            await fetch(`${API_URL}/auth/logout`, {
              method: 'POST',
              credentials: 'include',
            });
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        // Refresh access token
        refreshAccessToken: async (): Promise<boolean> => {
          const { tokens } = get();
          if (!tokens?.refreshToken) return false;

          try {
            const response = await fetch(`${API_URL}/auth/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: tokens.refreshToken }),
              credentials: 'include',
            });

            if (!response.ok) {
              throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            set({
              tokens: {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken || tokens.refreshToken,
              },
            });
            return true;
          } catch (error) {
            console.error('Failed to refresh token:', error);
            return false;
          }
        },

        // Fetch current user
        fetchCurrentUser: async (): Promise<User> => {
          const { tokens } = get();
          if (!tokens?.accessToken) {
            throw new Error('No access token');
          }

          const response = await fetch(`${API_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
            credentials: 'include',
          });

          if (!response.ok) {
            if (response.status === 401) {
              // Try to refresh token if unauthorized
              const refreshed = await get().refreshAccessToken();
              if (refreshed) {
                return get().fetchCurrentUser();
              }
            }
            throw new Error('Failed to fetch user');
          }

          return response.json();
        },

        // Update user data
        updateUser: (userData: Partial<User>) => {
          const { user } = get();
          if (user) {
            set({
              user: { ...user, ...userData }
            });
          }
        },
        
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        
        // Handle GitHub OAuth callback
        handleGitHubCallback: async (code: string, state: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`${API_URL}/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
              method: 'GET',
              credentials: 'include',
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'GitHub authentication failed');
            }

            const data = await response.json();
            
            if (data.accessToken && data.refreshToken) {
              set({
                tokens: {
                  accessToken: data.accessToken,
                  refreshToken: data.refreshToken,
                },
                user: data.user,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              const user = await get().fetchCurrentUser();
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('GitHub OAuth error:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to authenticate with GitHub',
              isLoading: false 
            });
            throw error;
          }
        },
        
        // Handle GitHub OAuth message from popup
        handleGitHubMessage: (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          const { type, payload } = event.data;
          
          if (type === 'OAUTH_SUCCESS') {
            const { accessToken, refreshToken, user } = payload;
            set({
              tokens: { accessToken, refreshToken },
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else if (type === 'OAUTH_ERROR') {
            set({ 
              error: payload.error || 'GitHub authentication failed',
              isLoading: false 
            });
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state: AuthState) => ({
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
