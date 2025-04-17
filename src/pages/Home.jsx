import Navbar, { NavLinks } from '../components/Navbar';
import MarqueeTicker from '../components/MarqueeTicker';
import EventBanner from '../components/EventBanner';
import NewsGrid from '../components/NewsGrid';
import Footer from '../components/Footer';
import { Toaster } from 'react-hot-toast';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
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
      
      {/* Top ticker - Sticky */}
      <MarqueeTicker position="top" />
      
      {/* Navbar (logo + search + login) - Sticky, positioned below the top ticker */}
      <Navbar position="below-ticker" />
      
      {/* Content wrapper with proper spacing for fixed elements */}
      <div className="pt-28">
        {/* Navigation links - NOT sticky */}
        <div className="hidden md:block">
          <NavLinks />
        </div>
        
        {/* Main content */}
        <main className="pt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EventBanner />
          <NewsGrid />
        </main>
        
        {/* Bottom ticker */}
        <MarqueeTicker position="bottom" />
        <Footer />
      </div>
    </div>
  );
};

export default Home; 