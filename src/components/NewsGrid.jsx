import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';

// Helper function to strip HTML tags
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

const NewsCard = ({ article }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Link to={`/articles/${article.slug}`} className="block h-full">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-100 h-full flex flex-col">
          <div className="relative">
            <img
              src={article.imageUrl || 'https://via.placeholder.com/800x450?text=Metaverse+Journal'}
              alt={article.title}
              className="w-full h-56 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/800x450?text=Image+Not+Available';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm">
                {article.metaTitle || 'ARTICLE'}
              </span>
            </div>
          </div>
          <div className="p-5 flex-grow flex flex-col">
            <h3 className="text-xl font-bold mb-2 text-gray-900 hover:text-blue-600 line-clamp-2">
              {article.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
              {article.metaDescription || stripHtml(article.description).substring(0, 120) + '...'}
            </p>
            <div className="flex justify-between items-center text-sm text-gray-500 mt-auto pt-3 border-t border-gray-100">
              <span className="font-medium">{article.author?.displayName || article.author?.email || ''}</span>
              <span>{formatDate(article.date || (article.createdAt?.toDate ? article.createdAt.toDate() : new Date()))}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const NewsGrid = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const articlesQuery = query(
          collection(db, "articles"),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        
        const querySnapshot = await getDocs(articlesQuery);
        const articlesData = [];
        
        querySnapshot.forEach((doc) => {
          articlesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setArticles(articlesData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError("Failed to load articles");
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="relative w-20 h-20">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-500 font-medium">Loading latest articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">No Articles Found</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Check back soon for the latest news and updates on the metaverse.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Latest Articles</h2>
          <Link 
            to="/articles" 
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            View All
            <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {/* Article Grid - No Featured Section */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </motion.div>

        {/* Mobile View More Button (only visible on mobile) */}
        <div className="mt-10 text-center md:hidden">
          <Link 
            to="/articles" 
            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            View All Articles
            <svg className="ml-2 -mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewsGrid; 