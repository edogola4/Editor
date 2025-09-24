import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated && !isLoading) {
        // Store the current location to redirect back after login
        navigate('/login', { 
          state: { from: location },
          replace: true 
        });
      } else if (isAuthenticated && requireAdmin && user?.role !== 'admin') {
        // Redirect non-admin users trying to access admin routes
        navigate('/unauthorized', { replace: true });
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoading, user, requireAdmin, navigate, location]);

  // Show loading state while checking auth
  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check admin access if required
  if (requireAdmin && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
