import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './LoginForm.css';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const LoginForm = () => {
  // State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Hooks
  const { login, register, isLoading, error, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // Handle redirection if already authenticated
  useEffect(() => {
    if (isAuthenticated && !hasRedirected) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      console.log('Already authenticated, redirecting to:', redirectTo);
      setHasRedirected(true);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams, hasRedirected]);
  
  // Handle successful authentication after form submission
  useEffect(() => {
    if (isSubmitting && isAuthenticated && !hasRedirected) {
      console.log('Form submission successful, redirecting...');
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      setHasRedirected(true);
      setIsSubmitting(false);
      navigate(redirectTo, { replace: true });
    }
  }, [isSubmitting, isAuthenticated, navigate, searchParams, hasRedirected]);
  
  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth state:', { 
        isAuthenticated, 
        user: user ? { id: user.id, username: user.username } : 'No user',
        isSubmitting,
        hasRedirected
      });
    }
  }, [isAuthenticated, user, isSubmitting, hasRedirected]);

  // Toggle between login and signup modes
  const toggleAuthMode = () => {
    setErrors({});
    setIsLogin(!isLogin);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Username validation (only for registration)
    if (!isLogin) {
      if (!name.trim()) {
        newErrors.name = 'Username is required';
      } else if (name.trim().length < 3) {
        newErrors.name = 'Username must be at least 3 characters';
      } else if (name.trim().length > 30) {
        newErrors.name = 'Username must be less than 30 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(name.trim())) {
        newErrors.name = 'Username can only contain letters, numbers, and underscores';
      }
    }
    
    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please provide a valid email';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[^a-zA-Z0-9]/.test(password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    // Confirm password validation (only for registration)
    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (isSubmitting) return; // Prevent multiple submissions
    
    try {
      console.log('Starting authentication...');
      setIsSubmitting(true);
      
      if (isLogin) {
        console.log('Attempting login...');
        await login(email, password);
        console.log('Login successful');
      } else {
        console.log('Attempting registration...');
        await register(name, email, password, password);
        console.log('Registration successful');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setIsSubmitting(false);
      setHasRedirected(false);
      // The error will be handled by the auth store and displayed in the UI
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      // Handle OAuth callback
      const storedState = localStorage.getItem('oauth_state');
      if (state !== storedState) {
        console.error('Invalid state parameter');
        return;
      }
      
      // Clear the state from localStorage
      localStorage.removeItem('oauth_state');
      
      // Redirect to the stored URL or home
      const redirectAfterLogin = localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectAfterLogin);
    }
  }, [navigate]);
  
  // Handle OAuth errors that might be passed back via URL (fallback)
  useEffect(() => {
    const error = searchParams.get('error');
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    
    if (error) {
      setErrors(prev => ({
        ...prev,
        form: decodeURIComponent(error)
      }));
      
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, document.title, url.toString());
    } else if (accessToken && refreshToken) {
      // Fallback for direct URL access (e.g., if popup was blocked)
      const userId = searchParams.get('userId');
      const email = searchParams.get('email');
      const username = searchParams.get('username');
      
      if (userId) {
        // Update auth store with user data and tokens
        useAuthStore.getState().set({
          user: {
            id: userId,
            email: email || '',
            username: username || '',
            role: 'user',
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          tokens: { accessToken, refreshToken },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        
        // Clean up the URL
        const url = new URL(window.location.href);
        ['accessToken', 'refreshToken', 'userId', 'email', 'username'].forEach(
          param => url.searchParams.delete(param)
        );
        window.history.replaceState({}, document.title, url.toString());
        
        // Redirect to dashboard or intended URL
        const redirectTo = localStorage.getItem('redirectAfterLogin') || '/';
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectTo);
      }
    }
  }, [searchParams, navigate]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleGitHubLogin = async () => {
    try {
      // Generate a random state token to prevent CSRF attacks
      const state = Math.random().toString(36).substring(2);
      // Store the state in localStorage to verify it later
      localStorage.setItem('oauth_state', state);
      
      // Store the current URL to redirect back after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
      
      // GitHub OAuth URL - replace CLIENT_ID with your GitHub OAuth app's client ID
      const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID';
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/github/callback`);
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=user:email`;
      
      // Redirect to GitHub for authentication
      window.location.href = githubAuthUrl;
    } catch (error) {
      console.error('GitHub login error:', error);
      setErrors(prev => ({
        ...prev,
        form: 'Failed to initiate GitHub login. Please try again.'
      }));
    }
  };

  return (
    <div className="loginFormContainer">
      <div className="loginFormCard">
        <div className="loginFormHeader">
          <h2>{isLogin ? 'Welcome back' : 'Create an account'}</h2>
          <p className="loginFormSubtitle">
            {isLogin ? 'Sign in to your account to continue' : 'Create your account to get started'}
          </p>
        </div>

        {error && (
          <div className="loginFormError">
            {error}
          </div>
        )}

        <form className="loginFormForm" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="loginFormGroup">
              <label className="loginFormLabel" htmlFor="name">
                Full Name
              </label>
              <div className="inputWrapper">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={handleNameChange}
                  className={`loginFormInput ${errors.name ? 'error' : ''}`}
                  placeholder="Enter your full name"
                  required={!isLogin}
                  disabled={isLoading}
                />
                {errors.name && <span className="fieldError">{errors.name}</span>}
              </div>
            </div>
          )}

          <div className="loginFormGroup">
            <label className="loginFormLabel" htmlFor="email">
              Email Address
            </label>
            <div className="inputWrapper">
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                className={`loginFormInput ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
              {errors.email && <span className="fieldError">{errors.email}</span>}
            </div>
          </div>

          <div className="loginFormGroup">
            <label className="loginFormLabel" htmlFor="password">
              Password
            </label>
            <div className="inputWrapper">
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                className={`loginFormInput ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              {errors.password && <span className="fieldError">{errors.password}</span>}
            </div>
          </div>

          {!isLogin && (
            <div className="loginFormGroup">
              <label className="loginFormLabel" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="inputWrapper">
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`loginFormInput ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <span className="fieldError">{errors.confirmPassword}</span>
                )}
              </div>
            </div>
          )}

          <div className="loginFormActions">
            <button
              type="submit"
              disabled={isLoading}
              className="loginFormSubmitBtn"
            >
              {isLoading ? (
                <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </div>
        </form>

        <div className="loginFormDivider">
          <span>or continue with</span>
        </div>

        <div className="loginFormSocial">
          <button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              type="button"
              className="githubLoginButton"
            >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>Continue with GitHub</span>
          </button>
        </div>

        <div className="loginFormFooter">
          <button
            onClick={toggleAuthMode}
            className="loginFormToggleBtn"
            type="button"
            disabled={isLoading}
          >
            {isLogin
              ? "Don't have an account? Create one"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="loginFormTrust">
          <div className="trustIndicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>256-bit SSL encrypted</span>
          </div>
          <div className="trustIndicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
              <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
              <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
              <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
              <path d="M21 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
              <path d="M3 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
              <path d="M21 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
              <path d="M3 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
            </svg>
            <span>GDPR compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
