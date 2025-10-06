import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { handleGitHubCallback, setError, setLoading } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      setIsProcessing(true);
      setError(null);
      setLocalError(null);

      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for OAuth errors first
        if (error) {
          throw new Error(errorDescription || `GitHub authentication failed: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing required OAuth parameters. Please try again.');
        }

        // Call the GitHub OAuth callback handler
        await handleGitHubCallback(code, state);

        // Get the redirect URL from state or use the default
        const from = location.state?.from?.pathname || '/';
        
        // Show success message
        toast.success('Successfully logged in with GitHub');
        
        // Redirect to the original URL or home page
        navigate(from, { replace: true });
      } catch (err) {
        console.error('GitHub callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during authentication';
        
        // Set error states
        setLocalError(errorMessage);
        setError(errorMessage);
        
        // Show error toast
        toast.error(`GitHub authentication failed: ${errorMessage}`);
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              error: errorMessage,
              from: location.state?.from || '/',
            },
            replace: true
          });
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
    
    // Cleanup function to handle component unmount
    return () => {
      setLoading(false);
    };
  }, [searchParams, navigate, location, setError, setLoading, handleGitHubCallback]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg 
              className="mx-auto h-12 w-12" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing GitHub authentication...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default GitHubCallback;
