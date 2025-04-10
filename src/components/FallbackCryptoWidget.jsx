import { useEffect, useState } from 'react';

const FallbackCryptoWidget = ({ position = 'top' }) => {
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    // Check if the widget has loaded
    const checkWidget = setInterval(() => {
      const widget = document.getElementById(`coinmarketcap-widget-marquee-${position}`);
      if (widget && widget.innerHTML.trim() !== '') {
        setWidgetLoaded(true);
        clearInterval(checkWidget);
      }
    }, 1000);

    return () => clearInterval(checkWidget);
  }, [position]);

  if (widgetLoaded) {
    return null; // Don't render anything if the widget is loaded
  }

  return (
    <div
      className={`fixed ${
        position === 'top' ? 'top-0' : 'bottom-0'
      } left-0 right-0 z-40 bg-white shadow-md`}
    >
      <marquee behavior="scroll" direction="left" scrollamount="5" className="py-2 text-gray-800 font-medium">
        Bitcoin: $65,432 | Ethereum: $3,456 | Binance Coin: $567 | Solana: $123 | Cardano: $0.45 | 
        Polkadot: $7.89 | Dogecoin: $0.12 | XRP: $0.56 | Polygon: $0.78 | Chainlink: $15.67 | 
        Litecoin: $89.12 | Uniswap: $5.43 | Avalanche: $34.56 | Cosmos: $9.87 | Filecoin: $6.78
      </marquee>
    </div>
  );
};

export default FallbackCryptoWidget; 