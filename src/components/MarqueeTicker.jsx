import { useEffect, useState } from 'react';
import GlobalCryptoWidget from './GlobalCryptoWidget';

const MarqueeTicker = ({ position = 'top' }) => {
  return (
    <div
      className={`fixed ${
        position === 'top' ? 'top-0' : 'bottom-0'
      } left-0 right-0 z-50 bg-white shadow-md`}
    >
      <GlobalCryptoWidget position={position} />
    </div>
  );
};

export default MarqueeTicker; 