import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';

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
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  loginWithGitHub: () => void;
  handleGitHubCallback: (code: string, state: string) => Promise<void>;
  
  // User management
  updateUser: (userData: Partial<User>) => void;
  
  // State management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  initializeAuth: () => Promise<void>;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}${BASE_URL.endsWith('/api') ? '' : '/api'}`;

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Initialize authentication state from storage
        initializeAuth: async () => {
          const { tokens } = get();
          if (!tokens?.accessToken) return;

          try {
            // Verify the token is still valid
            const user = await get().fetchCurrentUser();
            set({ user, isAuthenticated: true });
          } catch (error) {
            // If token is invalid, try to refresh it
            if (tokens.refreshToken) {
              const refreshed = await get().refreshAccessToken();
              if (!refreshed) {
                await get().logout();
              }
            } else {
              await get().logout();
            }
          }
        },

        // Fetch current user data
        fetchCurrentUser: async (): Promise<User> => {
          const { tokens } = get();
          if (!tokens?.accessToken) throw new Error('Not authenticated');

          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          return response.json();
        },

        // Login with email and password
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });

          try {
            const response = await fetch(`${API_URL}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Login failed');
            }

            const { user, accessToken, refreshToken } = data;
            
            set({
              user,
              tokens: { accessToken, refreshToken },
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error: any) {
            set({
              error: error.message || 'Login failed',
              isLoading: false,
            });
            throw error;
          }
        },

        // Register a new user
        register: async (username: string, email: string, password: string) => {
          set({ isLoading: true, error: null });

          try {
            const response = await fetch(`${API_URL}/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Registration failed');
            }

            // After successful registration, log the user in
            await get().login(email, password);
          } catch (error: any) {
            set({
              error: error.message || 'Registration failed',
              isLoading: false,
            });
            throw error;
          }
        },

        // Logout the user
        logout: async () => {
          const { tokens } = get();
          
          try {
            // Call the logout endpoint to invalidate the refresh token
            if (tokens?.refreshToken) {
              await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${tokens.accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: tokens.refreshToken }),
              });
            }
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            // Clear the state and storage
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        // Refresh the access token using the refresh token
        refreshAccessToken: async (): Promise<boolean> => {
          const { tokens } = get();
          if (!tokens?.refreshToken) return false;

          try {
            const response = await fetch(`${API_URL}/auth/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: tokens.refreshToken }),
            });

            if (!response.ok) return false;

            const { accessToken, refreshToken: newRefreshToken } = await response.json();
            
            set({
              tokens: {
                accessToken,
                refreshToken: newRefreshToken || tokens.refreshToken,
              },
            });

            return true;
          } catch (error) {
            console.error('Failed to refresh token:', error);
            return false;
          }
        },

        // Initiate GitHub OAuth flow
        loginWithGitHub: () => {
          window.location.href = `${API_URL}/auth/github`;
        },

        // Handle GitHub OAuth callback
        handleGitHubCallback: async (code: string, state: string) => {
          set({ isLoading: true, error: null });

          try {
            const response = await fetch(`${API_URL}/auth/github/callback?code=${code}&state=${state}`, {
              credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'GitHub authentication failed');
            }

            const { user, accessToken, refreshToken } = data;
            
            set({
              user,
              tokens: { accessToken, refreshToken },
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error: any) {
            set({
              error: error.message || 'GitHub authentication failed',
              isLoading: false,
            });
            throw error;
          }
        },

        // Update user data
        updateUser: (userData: Partial<User>) => {
          const { user } = get();
          if (user) {
            set({
              user: { ...user, ...userData },
            });
          }
        },

        // Set loading state
        setLoading: (isLoading: boolean) =>
          set({ isLoading }),

        // Set error state
        setError: (error: string | null) =>
          set({ error }),
      })),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          tokens: state.tokens,
          user: state.user,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Export the store's hook
export default useAuthStore;
