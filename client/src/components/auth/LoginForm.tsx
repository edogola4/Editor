import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './LoginForm.css';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login, register, isLoading, error, loginWithGitHub } = useAuthStore();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset previous errors
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email.split('@')[0], email, password);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError('');
  };

  return (
    <div className="loginFormContainer">
      <div className="loginFormCard">
        <div className="loginFormHeader">
          <h1 className="loginFormTitle">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="loginFormSubtitle">
            {isLogin
              ? 'Sign in to your account to continue'
              : 'Create your account to get started'
            }
          </p>
        </div>

        {error && (
          <div className="loginFormError">
            <div className="errorIcon"></div>
            <span>{error}</span>
          </div>
        )}

        <form className="loginFormForm" onSubmit={handleSubmit} noValidate>
          <div className="loginFormGroup">
            <label className="loginFormLabel" htmlFor="email">
              Email Address
            </label>
            <div className="inputWrapper">
              <input
                id="email"
                type="email"
                required
                className={`loginFormInput ${emailError ? 'error' : ''}`}
                placeholder="Enter your email address"
                value={email}
                onChange={handleEmailChange}
                aria-describedby={emailError ? "email-error" : undefined}
                aria-invalid={emailError ? "true" : "false"}
              />
              <div className="inputIcon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
            </div>
            {emailError && (
              <span id="email-error" className="fieldError" role="alert">
                {emailError}
              </span>
            )}
          </div>

          <div className="loginFormGroup">
            <label className="loginFormLabel" htmlFor="password">
              Password
            </label>
            <div className="inputWrapper">
              <input
                id="password"
                type="password"
                required
                className={`loginFormInput ${passwordError ? 'error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                aria-describedby={passwordError ? "password-error" : undefined}
                aria-invalid={passwordError ? "true" : "false"}
              />
              <div className="inputIcon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>
            {passwordError && (
              <span id="password-error" className="fieldError" role="alert">
                {passwordError}
              </span>
            )}
          </div>

          <div className="loginFormActions">
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="loginFormSubmitBtn"
            >
              {isLoading ? (
                <>
                  <span className="loginFormLoading"></span>
                  <span>Signing In...</span>
                </>
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
            onClick={loginWithGitHub}
            disabled={isLoading}
            type="button"
          >
            <span className="githubIcon"></span>
            <span>Continue with GitHub</span>
          </button>
        </div>
        <div className="loginFormFooter">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="loginFormToggleBtn"
            type="button"
          >
            {isLogin
              ? "Don't have an account? Create one"
              : 'Already have an account? Sign in'
            }
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
