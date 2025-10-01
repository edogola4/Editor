import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './LoginForm.css';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const { login, register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  
  // Handle GitHub OAuth popup
  const handleGitHubLogin = () => {
    // Store the current path to redirect back after login
    const redirectAfterLogin = window.location.pathname + window.location.search;
    localStorage.setItem('redirectAfterLogin', redirectAfterLogin);
    
    // Generate a random state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);
    
    // Open GitHub OAuth in a popup
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // Build the OAuth URL with state parameter
    const githubAuthUrl = new URL(`${import.meta.env.VITE_API_URL}/api/auth/github`);
    githubAuthUrl.searchParams.append('state', state);
    
    const popup = window.open(
      githubAuthUrl.toString(),
      'github-oauth',
      `width=${width},height=${height},top=${top},left=${left}`
    );
    
    if (!popup) {
      setErrors({
        ...errors,
        github: 'Pop-up was blocked. Please allow pop-ups for this site.'
      });
      return;
    }
    
    // Poll to check if the popup was closed
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        // Check if we have a redirect URL in localStorage (set by the callback)
        const redirectUrl = localStorage.getItem('oauth_redirect');
        if (redirectUrl) {
          localStorage.removeItem('oauth_redirect');
          // Use replace instead of push to prevent the popup from being reopened on back button
          navigate(redirectUrl, { replace: true });
        }
      }
    }, 100);
    
    // Listen for messages from the popup
    const messageHandler = (event: MessageEvent) => {
      // Verify the origin of the message
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'OAUTH_SUCCESS') {
        const { accessToken, refreshToken, user } = event.data.payload;
        
        // Update auth store with user data and tokens
        useAuthStore.getState().set({
          user,
          tokens: { accessToken, refreshToken },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        
        // Redirect to dashboard or intended URL
        const redirectTo = localStorage.getItem('redirectAfterLogin') || '/dashboard';
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectTo);
        
        // Clean up the event listener
        window.removeEventListener('message', messageHandler);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // Check if the popup was blocked
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      useAuthStore.getState().setError('Pop-up was blocked. Please allow pop-ups for this site.');
    }
  };

  // Handle OAuth errors that might be passed back via URL (fallback)
  useEffect(() => {
    const error = searchParams.get('error');
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    
    if (error) {
      setErrors(prev => ({ ...prev, form: decodeURIComponent(error) }));
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
        const redirectTo = localStorage.getItem('redirectAfterLogin') || '/dashboard';
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectTo);
      }
    }
  }, [searchParams, navigate]);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
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
    if (!isLogin) {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Generate a username from email (first part before @)
        const username = email.split('@')[0];
        // Include confirmPassword in the registration request
        await register(username, email, password, confirmPassword);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Authentication error:', error);
      // The error will be handled by the auth store and displayed in the UI
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

  return (
    <div className="loginFormContainer">
      <div className="loginFormCard">
        <div className="loginFormHeader">
          <div className="loginFormToggle">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button 
              type="button" 
              onClick={toggleAuthMode} 
              className="loginFormToggleBtn"
              disabled={isLoading}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
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
