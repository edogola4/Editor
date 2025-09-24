import { useEffect } from 'react';
import { useGitHubCallback } from '../hooks/useGitHubCallback';

const GitHubCallback = () => {
  useGitHubCallback();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing GitHub authentication...</p>
      </div>
    </div>
  );
};

export default GitHubCallback;
