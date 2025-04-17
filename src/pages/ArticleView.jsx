import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import Navbar, { NavLinks } from '../components/Navbar';
import MarqueeTicker from '../components/MarqueeTicker';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash';

const ArticleView = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authorData, setAuthorData] = useState(null);
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [activeHeading, setActiveHeading] = useState(null);
  const [headings, setHeadings] = useState([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const articleRef = useRef(null);
  const shareRef = useRef(null);
  const [tocVisible, setTocVisible] = useState(true);
  const [tocTransform, setTocTransform] = useState("translateY(0)");
  const [tocStyles, setTocStyles] = useState({
    position: "fixed",
    top: "160px",
    right: "24px",
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    opacity: 1,
    transform: "translateY(0)",
    transition: 'opacity 1s ease, transform 1s ease',
    maxHeight: 'calc(100vh - 300px)',
    overflowY: 'auto',
    width: '16rem',
    zIndex: 20
  });
  const footerRef = useRef(null);
  const lastScrollY = useRef(0);
  const tocOffsetRef = useRef(0);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        // Query firestore for article with matching slug
        const articlesRef = collection(db, "articles");
        const q = query(articlesRef, where("slug", "==", slug), limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setError("Article not found");
          setLoading(false);
          return;
        }

        const articleData = snapshot.docs[0].data();
        const articleId = snapshot.docs[0].id;
        setArticle({ id: articleId, ...articleData });
        
        // Check if current user is the author based on userId
        const user = auth.currentUser;
        if (user && articleData.userId === user.uid) {
          setIsOwner(true);
        }

        // Fetch author details from users collection
        if (articleData.userId) {
          const userDocRef = doc(db, 'users', articleData.userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setAuthorData({
              name: `${userData.firstname} ${userData.lastname || ''}`.trim(),
              bio: userData.bio || 'Contributing writer at Metaverse Street Journal',
              email: userData.email
            });
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Failed to load the article. Please try again later.");
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  // Extract headings after article loads
  useEffect(() => {
    if (article && articleRef.current) {
      // Find all headings in the article content
      setTimeout(() => {
        // Include FAQ headings and common FAQ selector patterns
        const headingElements = articleRef.current.querySelectorAll('h2, h3, h4, h5, h6, .faq-question, .faq-heading, [data-faq-question]');
        const extractedHeadings = Array.from(headingElements).map((heading, index) => {
          // Add IDs to headings if they don't have one
          if (!heading.id) {
            heading.id = `heading-${index}`;
          }
          return {
            id: heading.id,
            text: heading.textContent,
            level: heading.tagName ? parseInt(heading.tagName.charAt(1)) || 3 : 3,
            offsetTop: heading.offsetTop
          };
        });
        setHeadings(extractedHeadings);
        
        // Add specific styling for FAQ elements if they exist
        const faqElements = articleRef.current.querySelectorAll('.faq-container, .faq-section, [data-faq-container]');
        if (faqElements.length > 0) {
          faqElements.forEach(faq => {
            faq.classList.add('my-8', 'border', 'border-gray-100', 'rounded-xl', 'shadow-sm', 'overflow-hidden');
          });
          
          // Style FAQ questions
          const faqQuestions = articleRef.current.querySelectorAll('.faq-question, [data-faq-question]');
          faqQuestions.forEach(question => {
            question.classList.add('px-6', 'py-4', 'bg-gradient-to-r', 'from-gray-50', 'to-white', 'flex', 'items-center', 'justify-between', 'cursor-pointer');
          });
          
          // Style FAQ answers
          const faqAnswers = articleRef.current.querySelectorAll('.faq-answer, [data-faq-answer]');
          faqAnswers.forEach(answer => {
            answer.classList.add('px-6', 'py-4', 'bg-white');
          });
        }
      }, 1000); // Increased timeout for better rendering
    }
  }, [article, loading]);

  // Track scroll for reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      // Update active heading
      if (headings.length) {
        const scrollPosition = window.scrollY + 100;
        
        for (let i = headings.length - 1; i >= 0; i--) {
          if (scrollPosition >= headings[i].offsetTop) {
            setActiveHeading(headings[i].id);
            break;
          }
        }
      }
      
      // Calculate scroll progress
      setScrollProgress(window.scrollY / 
        (document.documentElement.scrollHeight - document.documentElement.clientHeight) || 0);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

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

  // Format time to read
  const calculateReadTime = (content) => {
    if (!content) return '3 min read';
    
    const wordsPerMinute = 200;
    const textContent = content.replace(/<[^>]*>/g, '');
    const wordCount = textContent.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    
    return `${readTime} min read`;
  };

  // Handle sharing functionality
  const handleShare = (platform) => {
    const articleUrl = window.location.href;
    const articleTitle = article?.title || 'Article from The Metaverse Street Journal';
    
    let shareUrl = '';
    
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(articleTitle)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(articleTitle + ' ' + articleUrl)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent('Check out this article: ' + articleUrl)}`;
        break;
      default:
        return;
    }
    
    // Open share URL in new window
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareOptions(false);
  };

  // Handle copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  // Scroll to heading
  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };
  
  // Close share dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareRef.current && !shareRef.current.contains(event.target)) {
        setShowShareOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Completely redesigned scroll effect for smoother animations
  useEffect(() => {
    const handleTocVisibility = throttle(() => {
      if (!footerRef.current) return;
      
      const footerTop = footerRef.current.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      const scrollDirection = window.scrollY > lastScrollY.current ? 'down' : 'up';
      lastScrollY.current = window.scrollY;
      
      // Start fade out much earlier for smoother transition
      const fadeStartDistance = 250; // Start fading 250px before reaching footer
      
      if (footerTop < windowHeight + fadeStartDistance) {
        // Calculate fade progress - from 1 to 0 as we approach footer
        const fadeDistance = fadeStartDistance;
        const distanceToFooter = footerTop - windowHeight;
        const fadeProgress = Math.max(0, distanceToFooter / fadeDistance);
        
        // Smoothly transition opacity and vertical position
        setTocStyles(prev => ({
          ...prev,
          opacity: Math.max(0.1, fadeProgress),
          transform: `translateY(${(1 - fadeProgress) * -30}px)`, // Move up as we fade out
          transition: 'opacity 0.8s ease, transform 0.8s ease',
          pointerEvents: fadeProgress < 0.5 ? 'none' : 'auto' // Disable interactions when mostly faded
        }));
        
        setTocVisible(fadeProgress > 0.1);
      } else {
        // Fully visible when far from footer
        setTocStyles(prev => ({
          ...prev,
          opacity: 1,
          transform: 'translateY(0)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          pointerEvents: 'auto'
        }));
        
        setTocVisible(true);
      }
    }, 50);
    
    window.addEventListener('scroll', handleTocVisibility);
    
    // Initial check
    handleTocVisibility();
    
    return () => {
      window.removeEventListener('scroll', handleTocVisibility);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-['Inter',sans-serif]">
        <MarqueeTicker position="top" />
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <motion.div 
            className="w-16 h-16 relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 opacity-20"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-blue-500"></div>
          </motion.div>
          <motion.p 
            className="mt-6 text-gray-500 text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Loading article...
          </motion.p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-['Inter',sans-serif]">
        <MarqueeTicker position="top" />
        <Navbar />
        <motion.div 
          className="max-w-3xl mx-auto px-4 sm:px-6 py-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <motion.img 
              src="https://illustrations.popsy.co/white/crashed-error.svg" 
              alt="Error" 
              className="w-48 h-48 mx-auto mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-3 title-font">Article Not Found</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              The article you're looking for doesn't seem to exist or has been moved.
            </p>
            <Link 
              to="/"
              className="inline-flex items-center px-5 py-2 rounded-lg text-base font-medium text-white neo-button bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Return to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif] antialiased">
      {/* Top ticker - Sticky */}
      <MarqueeTicker position="top" />
      
      {/* Navbar (logo + search + login) - Sticky, positioned below the top ticker */}
      <Navbar />
      
      {/* Content wrapper with proper spacing for fixed elements */}
      <div className="pt-28">
        {/* Navigation links - NOT sticky */}
        <div className="hidden md:block">
          <NavLinks />
        </div>
        
        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Article Hero Section */}
          <div className="max-w-4xl mx-auto mb-12">
            {/* Breadcrumbs */}
            <motion.nav 
              className="flex mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              aria-label="Breadcrumb"
            >
              <ol className="inline-flex items-center space-x-2 text-sm text-gray-500">
                <li className="inline-flex items-center">
                  <Link to="/" className="hover:text-blue-600 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <Link to="/articles" className="ml-2 hover:text-blue-600 transition-colors">
                      Articles
                    </Link>
                  </div>
                </li>
              </ol>
            </motion.nav>
            
            {/* Article Image */}
            {article?.imageUrl && (
              <motion.div 
                className="w-full rounded-2xl overflow-hidden mb-8 shadow-md relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              >
                <img 
                  src={article.imageUrl} 
                  alt={article.title} 
                  className="w-full h-[400px] object-cover transform hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/1920x1080?text=The+Metaverse+Street+Journal';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-24 pointer-events-none" />
              </motion.div>
            )}
            
            {/* Article Title and Meta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 title-font leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {article?.title}
              </motion.h1>
              
              {article?.metaDescription && (
                <motion.p 
                  className="text-xl text-gray-600 mb-6 leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {article.metaDescription}
                </motion.p>
              )}
              
              <motion.div 
                className="flex flex-wrap items-center gap-6 text-gray-500 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {/* Author info */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <motion.div 
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {authorData?.name?.charAt(0) || "A"}
                    </motion.div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-700">{authorData?.name || "Anonymous"}</p>
                  </div>
                </div>
                
                {/* Publication date */}
                <div className="flex items-center text-sm bg-gray-50 px-3 py-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(article?.date || (article?.createdAt?.toDate ? article?.createdAt.toDate() : new Date()))}</span>
                </div>
                
                {/* Reading time */}
                <div className="flex items-center text-sm bg-gray-50 px-3 py-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{calculateReadTime(article?.content || article?.description)}</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Action bar - Edit & Share */}
            <motion.div 
              className="flex justify-between items-center mb-10 py-4 border-t border-b border-gray-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              {/* Left side - Edit button */}
              <div>
                {isOwner && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link 
                      to={`/edit-article/${article.id}`}
                      className="inline-flex items-center px-3 py-1.5 neo-button rounded-full text-xs font-medium text-gray-700 hover:text-gray-900 hover:shadow-md transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Link>
                  </motion.div>
                )}
              </div>
              
              {/* Right side - Share options */}
              <div className="relative" ref={shareRef}>
                <motion.button 
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  className="share-button neo-button text-gray-700 hover:text-gray-900 hover:shadow-md transition-all duration-300 p-2 rounded-full"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </motion.button>
                
                {/* Share options dropdown */}
                <AnimatePresence>
                  {showShareOptions && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: 10 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="absolute right-0 mt-2 w-52 glass-card overflow-hidden z-50 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-100"
                    >
                      <div className="p-3 border-b border-gray-100/20">
                        <h4 className="font-medium text-gray-900 text-sm">Share this article</h4>
                      </div>
                      <div className="p-2">
                        {/* Share buttons */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { name: 'facebook', color: 'blue', path: "M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" },
                            { name: 'twitter', color: 'sky', path: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" },
                            { name: 'linkedin', color: 'blue', path: "M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" },
                            { name: 'whatsapp', color: 'green', path: "M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" }
                          ].map((platform) => (
                            <motion.button
                              key={platform.name}
                              onClick={() => handleShare(platform.name)}
                              className={`share-button bg-${platform.color}-50 text-${platform.color}-600 hover:bg-${platform.color}-100 p-2 rounded-lg shadow-sm`}
                              aria-label={`Share on ${platform.name}`}
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d={platform.path} />
                              </svg>
                            </motion.button>
                          ))}
                        </div>
                        
                        {/* Copy link button */}
                        <motion.button
                          onClick={copyToClipboard}
                          className="mt-2 w-full flex items-center justify-center px-3 py-2 neo-button rounded-lg text-xs font-medium text-gray-700 hover:text-gray-900 hover:shadow transition-all duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy Link
                          {showShareTooltip && (
                            <motion.span 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="ml-1 text-green-500 text-xs"
                            >
                              Copied!
                            </motion.span>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            
            {/* Article content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="article-content mb-12 relative overflow-hidden"
              ref={articleRef}
            >
              <motion.div 
                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-30"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
              />
              <div 
                dangerouslySetInnerHTML={{ __html: article?.content || article?.description || '<p>No content available</p>' }}
                className="prose prose-blue max-w-none"
              />
              
              {/* Render FAQs section if available */}
              {article?.faqs && article.faqs.length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                  <div className="space-y-4 faq-container">
                    {article.faqs.map((faq, index) => (
                      <details key={index} className="faq-item">
                        <summary className="faq-question">{faq.question}</summary>
                        <div className="faq-answer">{faq.answer}</div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Decorative elements */}
              <div className="absolute -right-12 top-8 w-28 h-28 rounded-full bg-gradient-to-r from-blue-400/10 to-indigo-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 bottom-20 w-32 h-32 rounded-full bg-gradient-to-r from-indigo-400/10 to-purple-500/10 blur-3xl pointer-events-none" />
            </motion.div>
            
            {/* Tags */}
            {article?.tags && article.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 pt-6 border-t border-gray-100"
              >
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <motion.span 
                      key={index}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer"
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Author bio - Enhanced minimalist design */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="mt-12 mb-6 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-indigo-50/20 rounded-xl -z-10" />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl blur-sm -z-20" />
              
              <div className="p-5 rounded-xl border border-blue-100/30 shadow-sm overflow-hidden relative backdrop-blur-[2px]">
                {/* Decorative elements */}
                <div className="absolute -right-16 -bottom-16 w-24 h-24 rounded-full bg-blue-400/10 blur-2xl" />
                <div className="absolute -left-10 -top-10 w-20 h-20 rounded-full bg-indigo-400/5 blur-2xl" />
                <div className="absolute right-20 top-0 w-16 h-16 rounded-full bg-purple-400/5 blur-xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    {/* Author label */}
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1 text-blue-500">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" />
                      </svg>
                      Author
                    </motion.div>
                      
                    <motion.h3 
                      className="text-base font-medium text-gray-800 tracking-tight"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      {authorData?.name || "Anonymous"}
                    </motion.h3>
                  </div>
                  
                  {/* Bio with horizontal line above */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="mt-3 relative"
                  >
                    <div className="absolute top-0 left-0 w-16 h-px bg-gradient-to-r from-blue-200/50 to-transparent"></div>
                    
                    <p className="text-sm text-gray-600 mt-3 ml-0">
                      {authorData?.bio || "Contributing writer at Metaverse Street Journal"}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Table of contents - On desktop, floating with improved animation */}
          {headings.length > 0 && tocVisible && (
            <div className="hidden lg:block">
              <motion.div
                style={tocStyles}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: tocStyles.opacity, 
                  x: 0,
                  transition: { 
                    duration: 0.7, 
                    ease: [0.16, 1, 0.3, 1]
                  }
                }}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden">
                  {/* Header with animated indicator */}
                  <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-100 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        <h3 className="text-sm font-medium text-gray-800">Contents</h3>
                      </div>
                    </div>
                  </div>
                  
                  {/* Links */}
                  <nav className="p-2">
                    <div className="space-y-0.5">
                      {headings.map((heading, index) => (
                        <motion.button
                          key={heading.id}
                          onClick={() => scrollToHeading(heading.id)}
                          className={`block w-full text-left px-3 py-1.5 rounded-lg transition-all duration-200 text-xs ${
                            activeHeading === heading.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          style={{ 
                            paddingLeft: `${heading.level * 0.5 + 0.5}rem`,
                            borderLeft: activeHeading === heading.id ? '2px solid #3b82f6' : '2px solid transparent',
                          }}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + (0.05 * index) }}
                          whileHover={{ x: 3 }}
                        >
                          {heading.text}
                        </motion.button>
                      ))}
                    </div>
                  </nav>
                </div>
              </motion.div>
            </div>
          )}
        </main>
        
        {/* Bottom ticker */}
        <div ref={footerRef}>
          <MarqueeTicker position="bottom" />
          <Footer />
        </div>
      </div>
      
      {/* Reading progress bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 origin-left z-50"
        style={{ scaleX: scrollProgress }}
        transition={{ ease: "easeOut" }}
      />
      
      {/* Back to top button - smaller and more minimal */}
      <motion.button
        className="fixed bottom-6 right-6 p-2.5 rounded-full bg-white text-blue-600 shadow-md hover:shadow-lg z-40 hover:bg-blue-600 hover:text-white transition-all duration-300 border border-blue-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: scrollProgress > 0.2 ? 1 : 0,
          y: scrollProgress > 0.2 ? 0 : 20 
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
        </svg>
      </motion.button>
      
      {/* Add CSS for FAQ styling in the head */}
      <style jsx global>{`
        .article-content .faq-item,
        .article-content details {
          margin-bottom: 1rem;
          border: 1px solid #f1f5f9;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .article-content .faq-question,
        .article-content summary {
          padding: 1rem 1.5rem;
          background: linear-gradient(to right, #f8fafc, #ffffff);
          font-weight: 600;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .article-content .faq-question::after,
        .article-content summary::after {
          content: '+';
          font-size: 1.25rem;
          font-weight: 300;
        }
        
        .article-content details[open] summary::after {
          content: '−';
        }
        
        .article-content .faq-answer,
        .article-content details > div {
          padding: 1rem 1.5rem;
          background: white;
        }
      `}</style>
    </div>
  );
};

export default ArticleView; 