import { useState, useEffect } from 'react';

// Cache for storing API responses
const cache = {
  data: null,
  timestamp: 0,
  CACHE_DURATION: 300000 // 5 minutes
};

// Rate limiting state
const rateLimitState = {
  lastRequestTime: 0,
  retryCount: 0,
  maxRetries: 3,
  baseDelay: 2000, // 2 seconds
};

// Global state to ensure both tickers load simultaneously
const globalLoadingState = {
  isLoading: false,
  data: null,
  error: null,
  fetchInProgress: false
};

// Global shared state to ensure both tickers load simultaneously
const sharedState = {
  data: null,
  loading: true,
  error: null,
  initialized: false,
  lastFetchTime: 0
};

const GlobalCryptoWidget = ({ position = 'top' }) => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cryptocurrency data with proper CoinGecko IDs and CoinMarketCap links
  const cryptoList = [
    { id: "bitcoin", symbol: "BTC", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", cmcLink: "https://coinmarketcap.com/currencies/bitcoin/" },
    { id: "ethereum", symbol: "ETH", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", cmcLink: "https://coinmarketcap.com/currencies/ethereum/" },
    { id: "tether", symbol: "USDT", name: "Tether", image: "https://assets.coingecko.com/coins/images/325/small/Tether.png", cmcLink: "https://coinmarketcap.com/currencies/tether/" },
    { id: "the-sandbox", symbol: "SAND", name: "The Sandbox", image: "https://assets.coingecko.com/coins/images/12129/small/sandbox_logo.jpg", cmcLink: "https://coinmarketcap.com/currencies/the-sandbox/" },
    { id: "decentraland", symbol: "MANA", name: "Decentraland", image: "https://assets.coingecko.com/coins/images/878/small/decentraland-mana.png", cmcLink: "https://coinmarketcap.com/currencies/decentraland/" },
    { id: "matic-network", symbol: "MATIC", name: "Polygon", image: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png", cmcLink: "https://coinmarketcap.com/currencies/polygon/" },
    { id: "upland", symbol: "UPX", name: "Upland", image: "https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png", cmcLink: "https://coinmarketcap.com/currencies/upland/" },
    { id: "axie-infinity", symbol: "AXS", name: "Axie Infinity", image: "https://assets.coingecko.com/coins/images/13029/small/axie_infinity_logo.png", cmcLink: "https://coinmarketcap.com/currencies/axie-infinity/" },
    { id: "aptos", symbol: "APT", name: "Aptos", image: "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png", cmcLink: "https://coinmarketcap.com/currencies/aptos/" },
    { id: "immutable-x", symbol: "IMX", name: "Immutable X", image: "https://assets.coingecko.com/coins/images/17233/small/immutableX-symbol.png", cmcLink: "https://coinmarketcap.com/currencies/immutable/" },
    { id: "ripple", symbol: "XRP", name: "XRP", image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", cmcLink: "https://coinmarketcap.com/currencies/xrp/" },
    { id: "litecoin", symbol: "LTC", name: "Litecoin", image: "https://assets.coingecko.com/coins/images/2/small/litecoin.png", cmcLink: "https://coinmarketcap.com/currencies/litecoin/" },
    { id: "solana", symbol: "SOL", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png", cmcLink: "https://coinmarketcap.com/currencies/solana/" },
    { id: "eos", symbol: "EOS", name: "EOS", image: "https://assets.coingecko.com/coins/images/738/small/eos-eos-logo.png", cmcLink: "https://coinmarketcap.com/currencies/eos/" },
    { id: "monero", symbol: "XMR", name: "Monero", image: "https://assets.coingecko.com/coins/images/69/small/monero_logo.png", cmcLink: "https://coinmarketcap.com/currencies/monero/" },
    { id: "internet-computer", symbol: "ICP", name: "Internet Computer", image: "https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png", cmcLink: "https://coinmarketcap.com/currencies/internet-computer/" },
    { id: "gala", symbol: "GALA", name: "Gala", image: "https://assets.coingecko.com/coins/images/12493/small/GALA-COINGECKO.png", cmcLink: "https://coinmarketcap.com/currencies/gala/" }
  ];

  // Get all crypto IDs
  const allCryptoIds = cryptoList.map(c => c.id).join(',');

  // Fallback data with the same structure for both top and bottom
  const fallbackData = [
    { id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 65123.45, change24h: 2.34, image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", cmcLink: "https://coinmarketcap.com/currencies/bitcoin/" },
    { id: "ethereum", symbol: "ETH", name: "Ethereum", price: 3401.78, change24h: -1.23, image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", cmcLink: "https://coinmarketcap.com/currencies/ethereum/" },
    { id: "tether", symbol: "USDT", name: "Tether", price: 1.00, change24h: 0.01, image: "https://assets.coingecko.com/coins/images/325/small/Tether.png", cmcLink: "https://coinmarketcap.com/currencies/tether/" },
    { id: "the-sandbox", symbol: "SAND", name: "The Sandbox", price: 0.54, change24h: 5.67, image: "https://assets.coingecko.com/coins/images/12129/small/sandbox_logo.jpg", cmcLink: "https://coinmarketcap.com/currencies/the-sandbox/" },
    { id: "decentraland", symbol: "MANA", name: "Decentraland", price: 0.43, change24h: 3.89, image: "https://assets.coingecko.com/coins/images/878/small/decentraland-mana.png", cmcLink: "https://coinmarketcap.com/currencies/decentraland/" },
    { id: "matic-network", symbol: "MATIC", name: "Polygon", price: 0.58, change24h: 2.15, image: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png", cmcLink: "https://coinmarketcap.com/currencies/polygon/" },
    { id: "upland", symbol: "UPX", name: "Upland", price: 0.0045, change24h: 1.32, image: "https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png", cmcLink: "https://coinmarketcap.com/currencies/upland/" },
    { id: "axie-infinity", symbol: "AXS", name: "Axie Infinity", price: 6.23, change24h: -2.41, image: "https://assets.coingecko.com/coins/images/13029/small/axie_infinity_logo.png", cmcLink: "https://coinmarketcap.com/currencies/axie-infinity/" },
    { id: "aptos", symbol: "APT", name: "Aptos", price: 8.12, change24h: 4.56, image: "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png", cmcLink: "https://coinmarketcap.com/currencies/aptos/" },
    { id: "immutable-x", symbol: "IMX", name: "Immutable X", price: 2.34, change24h: 7.89, image: "https://assets.coingecko.com/coins/images/17233/small/immutableX-symbol.png", cmcLink: "https://coinmarketcap.com/currencies/immutable/" },
    { id: "ripple", symbol: "XRP", name: "XRP", price: 0.58, change24h: 0.34, image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", cmcLink: "https://coinmarketcap.com/currencies/xrp/" },
    { id: "litecoin", symbol: "LTC", name: "Litecoin", price: 80.12, change24h: -0.45, image: "https://assets.coingecko.com/coins/images/2/small/litecoin.png", cmcLink: "https://coinmarketcap.com/currencies/litecoin/" },
    { id: "solana", symbol: "SOL", name: "Solana", price: 142.67, change24h: 3.76, image: "https://assets.coingecko.com/coins/images/4128/small/solana.png", cmcLink: "https://coinmarketcap.com/currencies/solana/" },
    { id: "eos", symbol: "EOS", name: "EOS", price: 0.73, change24h: -1.11, image: "https://assets.coingecko.com/coins/images/738/small/eos-eos-logo.png", cmcLink: "https://coinmarketcap.com/currencies/eos/" },
    { id: "monero", symbol: "XMR", name: "Monero", price: 168.24, change24h: 1.85, image: "https://assets.coingecko.com/coins/images/69/small/monero_logo.png", cmcLink: "https://coinmarketcap.com/currencies/monero/" },
    { id: "internet-computer", symbol: "ICP", name: "Internet Computer", price: 11.45, change24h: 5.23, image: "https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png", cmcLink: "https://coinmarketcap.com/currencies/internet-computer/" },
    { id: "gala", symbol: "GALA", name: "Gala", price: 0.021, change24h: 6.78, image: "https://assets.coingecko.com/coins/images/12493/small/GALA-COINGECKO.png", cmcLink: "https://coinmarketcap.com/currencies/gala/" }
  ];

  useEffect(() => {
    // Immediately use shared state if available
    if (sharedState.initialized) {
      console.log(`${position} widget: Using shared state data`);
      setCryptoData(sharedState.data || []);
      setLoading(sharedState.loading);
      setError(sharedState.error);
      
      // Only the top widget refreshes the data
      if (position !== 'top') return;
    }

    // Set initialization flag
    if (!sharedState.initialized) {
      sharedState.initialized = true;
    }

    const fetchCryptoData = async () => {
      // Prevent duplicate fetches
      const now = Date.now();
      if (now - sharedState.lastFetchTime < 10000) { // 10 seconds debounce
        console.log(`${position} widget: Skipping fetch, recent fetch in progress`);
        return;
      }
      
      sharedState.lastFetchTime = now;
      
      try {
        // Update both instances loading state
        setLoading(true);
        sharedState.loading = true;
        
        console.log(`${position} widget: Fetching crypto data...`);
        const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${allCryptoIds}&vs_currencies=usd&include_24hr_change=true`;
        console.log(`API URL: ${apiUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Origin': window.location.origin
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        // Handle error responses
        if (!response.ok) {
          if (response.status === 429) {
            console.error(`${position} widget: Rate limit exceeded`);
            throw new Error('Rate limit exceeded. Using cached data.');
          } else {
            throw new Error(`API error: ${response.status}`);
          }
        }

        const data = await response.json();
        console.log(`${position} widget: Data received:`, data);
        
        // Check for empty response
        if (!data || Object.keys(data).length === 0) {
          throw new Error('Empty response from API');
        }

        // Format data
        const formattedData = cryptoList.map(crypto => {
          const priceData = data[crypto.id];
          return {
            id: crypto.id,
            symbol: crypto.symbol,
            name: crypto.name,
            image: crypto.image,
            cmcLink: crypto.cmcLink,
            price: priceData && typeof priceData.usd === 'number' 
              ? priceData.usd 
              : 0,
            change24h: priceData && typeof priceData.usd_24h_change === 'number' 
              ? priceData.usd_24h_change 
              : 0
          };
        });

        // Update both local and shared state
        sharedState.data = formattedData;
        sharedState.loading = false;
        sharedState.error = null;
        
        setCryptoData(formattedData);
        setLoading(false);
        setError(null);
        
        console.log(`${position} widget: Data processed successfully`);
      } catch (err) {
        console.error(`${position} widget: Error fetching data:`, err);
        
        // Update error state
        sharedState.error = err.message;
        sharedState.loading = false;
        
        setError(err.message);
        setLoading(false);
        
        // Only use fallback if no data exists
        if (!sharedState.data || sharedState.data.length === 0) {
          console.log(`${position} widget: Using fallback data`);
          sharedState.data = fallbackData;
          setCryptoData(fallbackData);
        }
      }
    };

    // Only the top widget should fetch data
    if (position === 'top') {
      fetchCryptoData();
      
      // Refresh every 5 minutes
      const interval = setInterval(fetchCryptoData, 300000);
      return () => clearInterval(interval);
    }
  }, [position]);

  // Get the appropriate data to display
  const getDisplayData = () => {
    // If shared data exists, use it
    if (sharedState.data && sharedState.data.length > 0) {
      return sharedState.data;
    }
    
    // If component has data, use it
    if (cryptoData && cryptoData.length > 0) {
      return cryptoData;
    }
    
    // Fallback to static data
    return fallbackData;
  };

  // Render a single crypto item
  const renderCryptoItem = (crypto, key) => (
    <a 
      href={crypto.cmcLink} 
      target="_blank" 
      rel="noopener noreferrer"
      key={key} 
      className="inline-flex items-center mx-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors"
    >
      <img 
        src={crypto.image} 
        alt={crypto.symbol} 
        className="h-5 w-5 mr-1 rounded-full"
        onError={(e) => {
          e.target.onerror = null; 
          e.target.style.display = 'none';
        }}
      />
      <span className="text-xs font-medium text-gray-700">{crypto.name}</span>
      <span className="mx-1 text-xs font-semibold text-gray-900">${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
      <span className={`text-xs font-medium ${crypto.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {crypto.change24h >= 0 ? '▲' : '▼'} {Math.abs(crypto.change24h).toFixed(2)}%
      </span>
    </a>
  );

  // Get the data to display
  const displayData = getDisplayData();

  return (
    <div className="overflow-hidden whitespace-nowrap py-1 hover-pause-container">
      <div className="inline-block animate-marquee">
        {loading ? (
          <div className="flex items-center justify-center h-8">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-sm text-gray-600">Loading cryptocurrency data...</span>
          </div>
        ) : error && (!displayData || displayData.length === 0) ? (
          <div className="flex items-center justify-center h-8">
            <span className="text-sm text-red-600">{error}</span>
          </div>
        ) : (
          <>
            {displayData.map((crypto, index) => renderCryptoItem(crypto, `${position}-${crypto.id}-${index}`))}
          </>
        )}
      </div>
    </div>
  );
};

export default GlobalCryptoWidget; 