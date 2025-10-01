import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { set } = useAuthStore();

  useEffect(() => {
    // Extract tokens and user info from URL
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const username = searchParams.get('username');
    const error = searchParams.get('error');

    const cleanupUrl = () => {
      // Remove all OAuth parameters from URL
      const url = new URL(window.location.href);
      const paramsToRemove = [
        'accessToken', 'refreshToken', 'error', 'userId', 'email', 'username'
      ];
      
      paramsToRemove.forEach(param => url.searchParams.delete(param));
      window.history.replaceState({}, document.title, url.toString());
    };

    if (accessToken && refreshToken && userId) {
      // Clean up the URL first
      cleanupUrl();
      
      // Update auth store with user data and tokens
      set({
        user: {
          id: userId,
          email: email || '',
          username: username || '',
          role: 'user', // Default role
          isVerified: true, // GitHub users are verified by default
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        tokens: { accessToken, refreshToken },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Redirect to dashboard or intended URL
      const redirectTo = localStorage.getItem('redirectAfterLogin') || '/dashboard';
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectTo);
    } else if (error) {
      cleanupUrl();
      navigate(`/login?error=${encodeURIComponent(error)}`);
    } else {
      // No tokens or error, redirect to login
      cleanupUrl();
      navigate('/login');
    }
  }, [searchParams, navigate, set]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mb-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          <h2 className="text-xl font-semibold text-gray-800">Completing sign in...</h2>
          <p className="mt-2 text-gray-600">Please wait while we sign you in.</p>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
