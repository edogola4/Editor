import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
            onClick={() => console.log('GitHub login not implemented')}
            disabled={isLoading}
            type="button"
            className="githubLoginButton"
          >
            <span className="githubIcon">G</span>
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
