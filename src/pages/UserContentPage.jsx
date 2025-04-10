import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UserArticles from '../components/UserArticles';
import { motion } from 'framer-motion';

const UserContentPage = () => {
  const [activeTab, setActiveTab] = useState('published');
  
  // Animation variants
  const fadeIn = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif]">
      <Navbar />
      
      {/* Hero Section with increased top padding and cleaner design */}
      <motion.div 
        className="relative pt-36 pb-6 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb with improved spacing */}
          <nav className="mb-6 flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3 text-sm">
              <li className="inline-flex items-center">
                <Link to="/" className="text-gray-500 hover:text-gray-700">
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <Link to="/dashboard" className="ml-1 text-gray-500 hover:text-gray-700 md:ml-2">
                    Dashboard
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 font-medium text-blue-600 md:ml-2">Your Content</span>
                </div>
              </li>
            </ol>
          </nav>
          
          {/* Header with improved spacing and cleaner design */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <motion.div 
              className="mb-6 md:mb-0"
              variants={fadeIn}
              initial="initial"
              animate="animate"
            >
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Content</h1>
              <p className="mt-2 text-gray-600">Manage your publications and drafts</p>
            </motion.div>
            
            <motion.div 
              className="flex space-x-3"
              variants={fadeIn}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            >
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                onClick={() => window.location.href = '/dashboard'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Article
              </button>
            </motion.div>
          </div>
          
          {/* Simplified Tabs - Removed Analytics */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('published')}
                className={`${
                  activeTab === 'published'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                Published Articles
              </button>
              <button
                onClick={() => setActiveTab('drafts')}
                className={`${
                  activeTab === 'drafts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                Drafts
              </button>
            </nav>
          </div>
        </div>
      </motion.div>
      
      {/* Content with soft background color to separate from header */}
      <motion.div 
        className="bg-gray-50 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'published' && <UserArticles />}
          {activeTab === 'drafts' && (
            <div className="text-center py-16">
              <img 
                src="https://illustrations.popsy.co/amber/writing.svg" 
                alt="No drafts" 
                className="w-48 h-48 mx-auto mb-6 opacity-80"
              />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">Your saved drafts will appear here. Start creating your next article today!</p>
            </div>
          )}
        </div>
      </motion.div>
      
      <Footer />
    </div>
  );
};

export default UserContentPage; 