import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';

const AuthContext = createContext();

// Session timeout duration - 14 days in milliseconds
const SESSION_TIMEOUT = 14 * 24 * 60 * 60 * 1000;
const SESSION_LAST_ACTIVE_KEY = 'auth_last_active_timestamp';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set persistence to local (persists across sessions)
  useEffect(() => {
    const setupPersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error("Error setting persistence:", error);
      }
    };
    
    setupPersistence();
  }, []);

  // Check session timeout and handle auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        const lastActiveTime = localStorage.getItem(SESSION_LAST_ACTIVE_KEY);
        const currentTime = Date.now();
        
        if (lastActiveTime) {
          // Check if session has expired (14 days)
          if (currentTime - parseInt(lastActiveTime) > SESSION_TIMEOUT) {
            // Session expired, sign out user
            signOut(auth).then(() => {
              localStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
              console.log("Session expired after 14 days. User signed out.");
            });
            return;
          }
        }
        
        // Update last active timestamp
        localStorage.setItem(SESSION_LAST_ACTIVE_KEY, currentTime.toString());
      } else {
        // User is signed out
        localStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
      }
      
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);
  
  // Update session timestamp on user activity
  useEffect(() => {
    const updateActivityTimestamp = () => {
      if (currentUser) {
        localStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
      }
    };

    // Update timestamp on user interaction events
    window.addEventListener('mousedown', updateActivityTimestamp);
    window.addEventListener('keydown', updateActivityTimestamp);
    window.addEventListener('touchstart', updateActivityTimestamp);
    
    return () => {
      window.removeEventListener('mousedown', updateActivityTimestamp);
      window.removeEventListener('keydown', updateActivityTimestamp);
      window.removeEventListener('touchstart', updateActivityTimestamp);
    };
  }, [currentUser]);

  // Force check session validity on app focus/resume
  useEffect(() => {
    const checkSessionOnFocus = () => {
      if (currentUser) {
        const lastActiveTime = localStorage.getItem(SESSION_LAST_ACTIVE_KEY);
        if (lastActiveTime && Date.now() - parseInt(lastActiveTime) > SESSION_TIMEOUT) {
          signOut(auth).then(() => {
            localStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
            console.log("Session expired after returning to app. User signed out.");
          });
        }
      }
    };
    
    window.addEventListener('focus', checkSessionOnFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkSessionOnFocus();
      }
    });
    
    return () => {
      window.removeEventListener('focus', checkSessionOnFocus);
      document.removeEventListener('visibilitychange', checkSessionOnFocus);
    };
  }, [currentUser]);

  const refreshSession = () => {
    if (currentUser) {
      localStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
    }
  };

  const checkSessionValidity = () => {
    if (currentUser) {
      const lastActiveTime = localStorage.getItem(SESSION_LAST_ACTIVE_KEY);
      if (lastActiveTime) {
        return Date.now() - parseInt(lastActiveTime) <= SESSION_TIMEOUT;
      }
    }
    return false;
  };

  const value = {
    currentUser,
    loading,
    refreshSession,
    checkSessionValidity
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 