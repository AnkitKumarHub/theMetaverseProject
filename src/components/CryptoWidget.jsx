import { useEffect } from 'react';

const CryptoWidget = ({ position = 'top' }) => {
  useEffect(() => {
    // Create a script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://files.coinmarketcap.com/static/widget/coinMarquee.js';
    script.async = true;
    
    // Append the script to the document
    document.body.appendChild(script);
    
    return () => {
      // Clean up the script when component unmounts
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      className={`fixed ${
        position === 'top' ? 'top-0' : 'bottom-0'
      } left-0 right-0 z-40 bg-white shadow-md`}
    >
      <div
        id={`coinmarketcap-widget-marquee-${position}`}
        coins={position === 'top' 
          ? "1,1027,825,6210,32341,1966,31526,7080,18069,16352,52,328,5426,1765,3890,10688" 
          : "6210,32341,1966,31526,7080,10688,6783"}
        currency="USD"
        theme="light"
        transparent="false"
        show-symbol-logo="true"
      />
    </div>
  );
};

export default CryptoWidget; 