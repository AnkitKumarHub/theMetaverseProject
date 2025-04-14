import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import ArticleModal from '../components/ArticleModal';
import ProfileModal from '../components/ProfileModal';
import toast, { Toaster } from 'react-hot-toast';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser.uid);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Check localStorage for profile modal flag
  useEffect(() => {
    const showProfileModal = localStorage.getItem('showProfileModal');
    if (showProfileModal === 'true') {
      setIsProfileModalOpen(true);
      localStorage.removeItem('showProfileModal');
    }
  }, []);

  // Check if user profile is incomplete and show toast
  useEffect(() => {
    if (userData && !userData.isProfileComplete && !isProfileModalOpen) {
      const lastReminderTime = localStorage.getItem('profileReminderShown');
      const currentTime = new Date().getTime();
      
      // Only show reminder if it hasn't been shown in the last hour
      if (!lastReminderTime || (currentTime - parseInt(lastReminderTime)) > 3600000) {
        toast.custom(
          (t) => (
            <div className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Complete your profile
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Your profile is incomplete. Complete it to unlock all features.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    toast.dismiss(t.id);
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Update
                </button>
              </div>
            </div>
          ),
          { duration: 5000 }
        );
        
        // Save the current time to localStorage
        localStorage.setItem('profileReminderShown', currentTime.toString());
      }
    }
  }, [userData, isProfileModalOpen]);

  const fetchUserData = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        // If user doesn't exist in Firestore yet, set up a blank profile
        setUserData({
          uid: userId,
          email: auth.currentUser?.email || '',
          isProfileComplete: false
        });
        
        // Auto-open profile modal for new users
        setIsProfileModalOpen(true);
      }
    } catch (error) {
      toast.error('Error fetching user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUserData(updatedProfile);
  };

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        ease: "easeOut",
        duration: 0.6
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <Toaster position="top-right" />
      
      {/* Main content */}
      <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif]">
        {/* Add more padding to the top for better spacing */}
        <div className="pt-32 pb-24 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="relative">
            {/* Subtle background text */}
            <h2 className="absolute -top-20 left-0 text-[180px] font-bold text-gray-50 select-none leading-none z-0 opacity-40">
              Home
            </h2>
            
            {/* Header with welcome and action buttons - add more margin */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-16"
            >
              <div className="mb-6 md:mb-0">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
                <p className="mt-2 text-gray-500 font-light">{userData?.firstname ? `${userData.firstname} ${userData.lastname}` : user?.email}</p>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsArticleModalOpen(true)} 
                  className={`px-6 py-3 ${userData?.isProfileComplete 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-400 cursor-not-allowed'}
                    rounded-full text-white text-sm font-medium transition-colors flex items-center shadow-lg shadow-blue-600/10 relative`}
                  disabled={!userData?.isProfileComplete}
                  title={!userData?.isProfileComplete ? "Complete your profile to enable article creation" : ""}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Article
                  
                  {/* Lock indicator when disabled */}
                  {!userData?.isProfileComplete && (
                    <div className="absolute -right-2 -top-2 bg-yellow-500 rounded-full p-1 shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}
                </button>
                
                {!userData?.isProfileComplete && (
                  <button 
                    onClick={() => setIsProfileModalOpen(true)} 
                    className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 rounded-full text-white text-sm font-medium transition-colors flex items-center shadow-lg shadow-yellow-500/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Complete Profile
                  </button>
                )}
              </div>
            </motion.div>
            
            {/* Info banner for new users */}
            {!userData?.isProfileComplete && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mb-10 p-5 bg-blue-50/70 border border-blue-100/80 rounded-2xl backdrop-blur-sm"
              >
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mt-0.5 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-blue-800 text-lg">Welcome to Metaverse Journal!</h4>
                    <p className="text-sm text-blue-700/80 mt-1 font-light">Complete your profile to unlock article creation. This helps build a trusted community of contributors.</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Improved divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-14"></div>
            
            {/* Dashboard cards - increased gap and padding */}
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-2 gap-10 relative z-10"
            >
              <motion.div 
                variants={item}
                className="bg-white p-8 rounded-3xl border border-gray-100/60 shadow-xl shadow-gray-100/40 hover:shadow-2xl hover:shadow-blue-100/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-6">
                  <h3 className="font-semibold text-xl text-gray-900">Your Profile</h3>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-500 mb-8 text-sm font-light">Manage your personal information and preferences</p>
                
                {!userData?.isProfileComplete && (
                  <div className="mb-6 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                    <p className="text-sm text-yellow-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Profile incomplete
                    </p>
                  </div>
                )}
                
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="inline-flex items-center text-blue-600 font-medium text-sm hover:text-blue-800 transition-colors group"
                >
                  {userData?.isProfileComplete ? 'Edit Profile' : 'Complete Profile'}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </motion.div>
              
              <motion.div 
                variants={item}
                className="bg-white p-8 rounded-3xl border border-gray-100/60 shadow-xl shadow-gray-100/40 hover:shadow-2xl hover:shadow-green-100/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-6">
                  <h3 className="font-semibold text-xl text-gray-900">Your Content</h3>
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5M8 12h8M8 16h4" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-500 mb-8 text-sm font-light">View and manage your articles and submissions</p>
                <Link 
                  to="/your-content" 
                  state={{ activeTab: 'published' }}
                  className="inline-flex items-center text-blue-600 font-medium text-sm hover:text-blue-800 transition-colors group"
                >
                  View Content
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
              
              <motion.div 
                variants={item}
                className="bg-white p-8 rounded-3xl border border-gray-100/60 shadow-xl shadow-gray-100/40 hover:shadow-2xl hover:shadow-purple-100/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-6">
                  <h3 className="font-semibold text-xl text-gray-900">Saved Articles</h3>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-500 mb-8 text-sm font-light">Access your bookmarked and saved content</p>
                <Link 
                  to="#" 
                  className="inline-flex items-center text-blue-600 font-medium text-sm hover:text-blue-800 transition-colors group"
                >
                  View Saved
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
              
              <motion.div 
                variants={item}
                className="bg-white p-8 rounded-3xl border border-gray-100/60 shadow-xl shadow-gray-100/40 hover:shadow-2xl hover:shadow-amber-100/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-6">
                  <h3 className="font-semibold text-xl text-gray-900">Settings</h3>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-500 mb-8 text-sm font-light">Manage account settings and notifications</p>
                <Link 
                  to="#" 
                  className="inline-flex items-center text-blue-600 font-medium text-sm hover:text-blue-800 transition-colors group"
                >
                  Edit Settings
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        <ArticleModal 
          isOpen={isArticleModalOpen} 
          onClose={() => setIsArticleModalOpen(false)} 
        />

        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          userId={user?.uid}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard; 