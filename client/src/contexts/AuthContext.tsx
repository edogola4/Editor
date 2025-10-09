import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
  refreshToken: () => Promise<string | null>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (token) {
          // Verify token and get user data
          const decoded: any = jwtDecode(token);
          
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            // Try to refresh token
            const newToken = await refreshToken();
            if (!newToken) {
              throw new Error('Session expired. Please log in again.');
            }
            // Set up axios with new token
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            // Fetch user data
            await fetchUserData();
          } else {
            // Set up axios with existing token
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Fetch user data
            await fetchUserData();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchUserData = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Update user state
      setUser(user);
      
      // Redirect to home or previous location
      navigate('/documents');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/auth/register', { name, email, password });
      // After successful registration, log the user in
      await login(email, password);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post('/api/auth/refresh-token', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      // Store new tokens
      localStorage.setItem('accessToken', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      // Update axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return accessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Clear tokens and user data on failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      return null;
    }
  };

  const logout = () => {
    // Clear tokens and user data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    
    // Redirect to login
    navigate('/login');
  };

  const getAccessToken = (): string | null => {
    return localStorage.getItem('accessToken');
  };

  // Set up axios response interceptor for token refresh
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't already tried to refresh the token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await refreshToken();
            if (newToken) {
              // Update the authorization header
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              // Retry the original request
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, log the user out
            logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        getAccessToken,
        refreshToken,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
