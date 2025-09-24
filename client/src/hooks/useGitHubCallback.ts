import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const useGitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGitHubCallback } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const processCallback = async () => {
      if (error) {
        console.error('GitHub OAuth error:', searchParams.get('error_description'));
        navigate('/login', { state: { error: 'GitHub authentication failed' } });
        return;
      }

      if (code && state) {
        try {
          await handleGitHubCallback(code, state);
          // Redirect to the original URL or dashboard
          const from = new URLSearchParams(window.location.search).get('state') || '/';
          navigate(decodeURIComponent(from));
        } catch (err) {
          console.error('GitHub callback error:', err);
          navigate('/login', { state: { error: 'Failed to authenticate with GitHub' } });
        }
      }
    };

    processCallback();
  }, [searchParams, navigate, handleGitHubCallback]);
};
