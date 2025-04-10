import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { auth } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
// Import the logo
import logoImage from '../assets/heading-3bstHt0N.webp';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const searchRef = useRef(null);
  const authRef = useRef(null);
  const navigate = useNavigate();

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (authRef.current && !authRef.current.contains(event.target)) {
        setIsAuthOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef, authRef]);
  
  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Here you would typically redirect to search results page
      // history.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsAuthOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Sticky header with logo, search and login */}
      <div className="fixed top-8 left-0 right-0 z-40 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Search - Left */}
            <div className="w-1/4 flex justify-start" ref={searchRef}>
              <div className="relative">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="flex items-center justify-center p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon className="h-6 w-6" />
                </button>
                
                {/* Search Dropdown */}
                {isSearchOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-md py-2 px-3 z-50">
                    <form onSubmit={handleSearchSubmit}>
                      <div className="flex items-center border-b border-gray-200 pb-2">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search articles..."
                          className="ml-2 block w-full outline-none text-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="pt-2 text-xs text-gray-500">
                        Press Enter to search
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
            
            {/* Logo - Center */}
            <div className="w-2/4 flex justify-center">
              <Link to="/" className="flex-shrink-0">
                <img 
                  src={logoImage} 
                  alt="The Metaverse Journal" 
                  className="h-12 w-auto object-contain"
                />
              </Link>
            </div>
            
            {/* Auth Menu - Right */}
            <div className="w-1/4 flex justify-end" ref={authRef}>
              <div className="relative">
                {/* User avatar or login button */}
                <button
                  onClick={() => setIsAuthOpen(!isAuthOpen)}
                  className="group p-2 focus:outline-none transition-all duration-300 overflow-hidden relative"
                  aria-label={user ? "User menu" : "Login options"}
                >
                  <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></div>
                  
                  {user ? (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg relative z-10 transition-all duration-700 group-hover:rotate-[360deg]">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 relative z-10 text-gray-700 group-hover:text-blue-600 transition-all duration-700 group-hover:rotate-[360deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </button>
                
                {/* Auth Dropdown */}
                {isAuthOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-md py-1 z-50">
                    {user ? (
                      <>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsAuthOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsAuthOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/signup"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsAuthOpen(false)}
                        >
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button (shown only on mobile) */}
      <div className="md:hidden flex items-center bg-gray-50 shadow-sm border-b border-gray-200 p-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
        >
          {isOpen ? (
            <XMarkIcon className="block h-6 w-6" />
          ) : (
            <Bars3Icon className="block h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md rounded-b-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLinks mobile={true} closeMenu={() => setIsOpen(false)} />
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-5">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="ml-3 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                      className="ml-3 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="ml-3 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="ml-3 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Separate component for navigation links (NOT sticky)
export const NavLinks = ({ mobile = false, closeMenu = () => {} }) => {
  const navLinks = [
    { name: 'Metaverse', href: '/metaverse' },
    { name: 'Upland', href: '/upland' },
    { name: 'Sandbox', href: '/sandbox' },
    { name: 'Animoca Brands', href: '/animoca' },
    { name: 'Opinion', href: '/opinion' },
    { name: 'Startup', href: '/startup' },
    { name: 'Staff Directory', href: '/staff' },
  ];

  if (mobile) {
    return (
      <>
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
            onClick={closeMenu}
          >
            {link.name}
          </Link>
        ))}
      </>
    );
  }

  return (
    <div className="bg-gray-50 shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-12">
          <div className="flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar; 