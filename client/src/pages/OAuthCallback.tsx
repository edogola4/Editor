import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { set, handleGitHubMessage } = useAuthStore();

  useEffect(() => {
    // Check if this is a GitHub OAuth callback
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const handleGitHubAuth = async () => {
      if (code && state) {
        try {
          // Handle GitHub OAuth callback
          const redirectTo = localStorage.getItem('redirectAfterLogin') || '/dashboard';
          localStorage.removeItem('redirectAfterLogin');
          
          // Clean up the URL
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          window.history.replaceState({}, document.title, url.toString());
          
          // Redirect to the dashboard
          navigate(redirectTo);
        } catch (err) {
          console.error('GitHub OAuth error:', err);
          navigate(`/login?error=${encodeURIComponent('GitHub authentication failed')}`);
        }
      } else if (error) {
        // Handle OAuth error
        const errorDescription = searchParams.get('error_description');
        console.error('OAuth error:', { error, errorDescription });
        navigate(
          `/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}`
        );
      } else {
        // Check for message from popup
        const messageListener = (event: MessageEvent) => {
          // Only handle messages from our origin
          if (event.origin !== window.location.origin) return;
          
          if (event.data?.type === 'OAUTH_SUCCESS') {
            const { accessToken, refreshToken, user } = event.data.payload;
            
            // Update auth store
            set({
              user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role || 'user',
                isVerified: true,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt || new Date().toISOString(),
                updatedAt: user.updatedAt || new Date().toISOString(),
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
          }
        };

        window.addEventListener('message', messageListener);
        
        // Clean up
        return () => {
          window.removeEventListener('message', messageListener);
        };
      }
    };

    handleGitHubAuth();
  }, [searchParams, navigate, set, handleGitHubMessage]);

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
