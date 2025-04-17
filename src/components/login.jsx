import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import './login.css';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

const Login = ({ initialMode = "login" }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Update isLogin state when initialMode prop changes
  useEffect(() => {
    setIsLogin(initialMode === "login");
  }, [initialMode]);

  const showCustomToast = (message, type = 'success') => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center justify-between p-4 gap-3`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 ${type === 'success' ? 'bg-green-100' : 'bg-red-100'} rounded-full p-2`}>
            {type === 'success' ? (
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900">
            {message}
          </p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 rounded-full p-1 hover:bg-gray-100 transition-colors"
        >
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    ), {
      duration: 2500,
    });
  };

  const createUserDocument = async (user) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        isProfileComplete: false,
        createdAt: serverTimestamp()
      }, { merge: true });
      
      showCustomToast('Account created successfully!');
    } catch (error) {
      showCustomToast('Failed to create user profile', 'error');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const loadingToast = toast.loading('Please wait...', {
      style: {
        background: '#F3F4F6',
        color: '#1F2937',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
    });
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // Set initial session timestamp for 14-day timeout
        localStorage.setItem('auth_last_active_timestamp', Date.now().toString());
        toast.dismiss(loadingToast);
        showCustomToast('Welcome back!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Set initial session timestamp for 14-day timeout
        localStorage.setItem('auth_last_active_timestamp', Date.now().toString());
        toast.dismiss(loadingToast);
        await createUserDocument(user);
      }
      navigate('/dashboard');
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = error.message.replace('Firebase: ', '').replace('Error (auth/', '').replace(')', '');
      setError(errorMessage);
      showCustomToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    const loadingToast = toast.loading('Signing in with Google...', {
      style: {
        background: '#F3F4F6',
        color: '#1F2937',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
    });
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Set initial session timestamp for 14-day timeout
      localStorage.setItem('auth_last_active_timestamp', Date.now().toString());
      
      await createUserDocument(user);
      toast.dismiss(loadingToast);
      showCustomToast('Successfully signed in with Google!');
      navigate('/dashboard');
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = error.message.replace('Firebase: ', '').replace('Error (auth/', '').replace(')', '');
      setError(errorMessage);
      showCustomToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-wrapper">
      <Toaster 
        position="top-right"
        toastOptions={{
          custom: {
            duration: 2500,
          },
        }}
      />
      
      <Link to="/" className="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to home
      </Link>
      
      <div className="auth-card">
        <div className="auth-header">
          <h1>Metaverse Journal</h1>
          <p>Document your virtual adventures</p>
        </div>
        
        <div className="auth-tabs">
          <button 
            className={isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(true)}
          >
            Sign in
          </button>
          <button 
            className={!isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(false)}
          >
            Sign up
          </button>
        </div>
        
        <div className="tab-accent-line"></div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleAuth} className="auth-form">
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="button-loader"></div>
            ) : (
              isLogin ? 'Sign in' : 'Create account'
            )}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>or</span>
        </div>
        
        <button 
          type="button"
          className="google-button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
