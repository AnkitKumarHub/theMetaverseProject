import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const UserArticles = ({ status = 'published', sortBy = 'newest', fromEdit = false }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserArticles = async () => {
      try {
        const user = auth.currentUser;
        
        if (!user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Query articles based on user ID and status (published or draft)
        const q = query(
          collection(db, "articles"),
          where("userId", "==", user.uid),
          where("status", "==", status)
        );
        
        const querySnapshot = await getDocs(q);
        const userArticles = [];
        
        querySnapshot.forEach((doc) => {
          userArticles.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setArticles(userArticles);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user articles:", err);
        setError("Failed to load your articles. Please try again later.");
        setLoading(false);
      }
    };

    fetchUserArticles();
  }, [status]);

  // Function to strip HTML tags for preview
  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Sort articles based on sortBy prop
  const sortedArticles = [...articles].sort((a, b) => {
    const dateA = new Date(a.date || (a.createdAt?.toDate ? a.createdAt.toDate() : new Date()));
    const dateB = new Date(b.date || (b.createdAt?.toDate ? b.createdAt.toDate() : new Date()));
    
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-red-700 font-medium">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  // No articles empty state
  if (articles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 w-full max-w-lg text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {status === 'published' 
              ? 'No Published Articles Yet'
              : 'No Draft Articles Yet'
            }
          </h3>
          
          <p className="text-gray-500 text-sm">
            {status === 'published'
              ? 'Your published articles will appear here. Start writing and share your thoughts with the world.'
              : 'Your draft articles will appear here. Feel free to take your time perfecting your content.'
            }
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Stats row showing count */}
      <div className="mb-8">
        <div className="text-sm font-medium text-gray-700 flex items-center">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>
              {articles.length} {articles.length === 1 ? 'Article' : 'Articles'} {status === 'published' ? 'Published' : 'in Drafts'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Articles Grid - Improved card design */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {sortedArticles.map((article) => (
          <motion.div 
            key={article.id} 
            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col"
            variants={item}
            whileHover={{ y: -4 }}
          >
            <div className="relative">
              {article.imageUrl ? (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title} 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                    }}
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              {/* Status badge */}
              <div className="absolute top-3 right-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
              
              {/* Date badge */}
              <div className="absolute bottom-3 left-3">
                <div className="flex items-center text-xs bg-black/30 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(article.date || (article.createdAt?.toDate ? article.createdAt.toDate() : new Date()))}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 flex-grow flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                <Link to={`/articles/${article.slug}`}>{article.title}</Link>
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                {article.metaDescription || stripHtml(article.content || article.description).substring(0, 160) + '...'}
              </p>
              <div className="pt-4 border-t border-gray-100 mt-auto">
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                    </svg>
                    {article.slug}
                  </span>
                  <div className="flex space-x-3">
                    <Link
                      to={`/articles/${article.slug}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors hover:underline flex items-center"
                      aria-label="View article"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      to={`/edit-article/${article.id}`}
                      className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors hover:underline flex items-center"
                      aria-label="Edit article"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default UserArticles;
