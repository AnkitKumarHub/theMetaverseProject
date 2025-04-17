import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UserArticles from '../components/UserArticles';
import ArticleModal from '../components/ArticleModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

const UserContentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || 'published'
  );
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [fromEdit, setFromEdit] = useState(false);
  
  // Set active tab from location state when navigation occurs
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    
    // Check if we're coming from the edit page to prevent duplicate toasts
    if (location.state?.fromEdit) {
      setFromEdit(true);
      
      // Clear the state to prevent issues on refresh
      const newState = { ...location.state };
      delete newState.fromEdit;
      
      // Replace the current history entry with the new state
      navigate(location.pathname, { 
        replace: true,
        state: Object.keys(newState).length > 0 ? newState : undefined
      });
    }
  }, [location.state, navigate, location.pathname]);
  
  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif]">
      <Navbar position="top" />
      
      {/* Toast notification container */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#111827',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            padding: '16px',
            borderRadius: '8px',
          },
        }}
      />
      
      {/* ArticleModal component */}
      <ArticleModal 
        isOpen={isArticleModalOpen} 
        onClose={() => setIsArticleModalOpen(false)}
      />
      
      {/* Main content with clean, minimalist design */}
      <div className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb with subtle styling - Fixed positioning to avoid confusion with navbar */}
          <nav className="flex mb-10" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-3 text-sm">
              <li className="inline-flex items-center">
                <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <Link to="/dashboard" className="ml-2 text-gray-500 hover:text-gray-900 transition-colors">
                    Dashboard
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-2 font-medium text-blue-600">Your Content</span>
                </div>
              </li>
            </ol>
          </nav>
          
          {/* Page header with actions */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex-1"
              >
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Your Content</h1>
                <p className="text-gray-600">Manage your publications and drafts</p>
              </motion.div>
              
              <div className="flex gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2.5 rounded-lg text-gray-700 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all duration-200 flex items-center text-sm font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Dashboard
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  onClick={() => setIsArticleModalOpen(true)}
                  className="px-5 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all duration-200 flex items-center text-sm font-medium"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Article
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Content tabs and Sort selector */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-1">
              <div className="flex space-x-8">
                <TabButton 
                  active={activeTab === 'published'} 
                  onClick={() => setActiveTab('published')}
                  label="Published Articles"
                />
                <TabButton 
                  active={activeTab === 'drafts'} 
                  onClick={() => setActiveTab('drafts')}
                  label="Drafts" 
                />
              </div>
              
              {/* Sort selector - Fixed functionality */}
              <div className="mt-4 md:mt-0 flex items-center">
                <label htmlFor="sort" className="mr-2 text-sm text-gray-500">Sort by:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-1 pl-2 pr-8 border border-gray-200 rounded-md bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Tab content with smooth transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-transparent rounded-xl"
            >
              {/* Pass sortBy value to UserArticles component */}
              {activeTab === 'published' && <UserArticles status="published" sortBy={sortBy} fromEdit={fromEdit} />}
              {activeTab === 'drafts' && <UserArticles status="draft" sortBy={sortBy} fromEdit={fromEdit} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

// Tab button component for consistent styling
const TabButton = ({ active, onClick, label }) => (
  <motion.button
    onClick={onClick}
    className={`
      relative py-4 px-1 text-sm font-medium transition-colors duration-200
      ${active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}
    `}
    whileHover={{ scale: active ? 1 : 1.03 }}
    whileTap={{ scale: 0.98 }}
  >
    {label}
    {active && (
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
        layoutId="activeTab"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    )}
  </motion.button>
);

export default UserContentPage; 