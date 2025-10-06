import { useEffect, useState, type JSX } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useGitHub } from '../contexts/GitHubContext';
import { Loader2 } from 'lucide-react';

const GitHubCallback = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useGitHub();
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async (): Promise<void> => {
      setIsProcessing(true);
      setError(null);

      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const oauthError = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for OAuth errors first
        if (oauthError) {
          throw new Error(errorDescription || `GitHub authentication failed: ${oauthError}`);
        }

        if (!code) {
          throw new Error('Missing authorization code. Please try again.');
        }

        // The actual OAuth flow is handled by the server
        // The server will set the token in cookies and redirect back to the app
        // If this is a popup, send a message to the parent window
        if (window.opener) {
          if (code && state) {
            window.opener.postMessage({ type: 'github-oauth-complete', code, state }, window.location.origin);
            window.close();
          }
        }
        
        // If not a popup, redirect to the dashboard or the original URL
        const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
        
        // Call login to update the GitHub context
        await login();
        
        // Redirect to the original URL or home page
        navigate(from, { replace: true });
        return undefined;
      } catch (error: unknown) {
        console.error('GitHub callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during authentication';
        setError(errorMessage);
        
        // If this is a popup, send the error to the parent window
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'github-oauth-error', 
            error: errorMessage 
          }, window.location.origin);
          window.close();
        } else {
          // If not a popup, redirect to the login page with the error
          navigate('/login', { 
            state: { 
              error: errorMessage,
              from: location.state?.from || '/' 
            },
            replace: true 
          });
        }
      } finally {
        setIsProcessing(false);
      }
    };

    void processCallback();
  }, [searchParams, navigate, location.state, login]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">Connecting to GitHub</h2>
          <p className="text-gray-600">Please wait while we connect to your GitHub account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-red-200 max-w-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">GitHub Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-500"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GitHubCallback;
