import { useAuthStore } from '../store/authStore';
import LoginForm from '../components/auth/LoginForm';

const Login = () => {
  const { isLoading } = useAuthStore();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <LoginForm />;
};

export default Login;
