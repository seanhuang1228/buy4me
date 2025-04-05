'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
// Make sure ethers is imported and available
import { ethers } from 'ethers';
import TicketPurchaseFlow from '@/components/TicketPurchaseFlow'

// --- Contract Details (Replace with your actual details) ---
const CONTRACT_ADDRESS = '0xd5CAE924a7EeE4d4A7902F7610Ff5acb4533AA9b'; // <-- PASTE YOUR CONTRACT ADDRESS HERE
const TICKET_ADDRESS = '0x35829336286e25b2CB272C1c708Fb7F1032f9702';
const CONTRACT_ABI = [
  'function toggleDelegate(address delegate)',
  'function canActOnBehalf(address owner, address actor) view returns (bool)',
];
const CELO_ALFAJORES_CHAIN_ID = '0xaef3'; // Chain ID for Celo Alfajores (44787 in hex)

// Dynamically import the QR Code component
const SelfQRWrapper = dynamic(() => import('../components/SelfQRCodeWrapper'), {
  ssr: false,
});

// --- Interface 1 (Unchanged from previous version) ---
interface Interface1Props {
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
}

const Interface1: React.FC<Interface1Props> = ({ userId, setUserId }) => {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Let's Auth!
      </h2>
      <div className="flex flex-col items-center">
        <input
            type="text"
            placeholder="Enter your Celo address"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md w-full max-w-md mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-label="User ID Input"
        />
        <SelfQRWrapper userId={userId} />
      </div>
    </>
  );
};


// --- Interface 2: Celo Contract Interaction ---
const Interface2 = () => {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [queryAddr, setQueryAddr] = useState(null);
  const [isDelegated, setIsDelegated] = useState(null);
  const [isValidQuery, setIsValidQuery] = useState(false);

  // Function to connect wallet
  const connectWallet = async () => {
     const [addr] = await window.ethereum.request({ method: 'eth_requestAccounts' })
     setUserAddress(addr);
  };

  const toggleDelegation = async () => {
      console.log("hello")
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      await contract.toggleDelegate(queryAddr)
      setQueryAddr("")
  }

  useEffect(() => {
    if (!userAddress) return

    if (ethers.isAddress(queryAddr)) {
      setIsValidQuery(true)
    } else {
      setIsValidQuery(false)
      return
    }

    const checkStatus = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      const canActOn = await contract.canActOnBehalf(userAddress, queryAddr)

      setIsDelegated(canActOn)
    }
    checkStatus()
  }, [queryAddr])

  return (
    <>
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Manage Delegation (View 2)
      </h2>
      <div className="space-y-4">
        {!userAddress ? ( <button onClick={connectWallet} className="...">connect wallet</button> ) : ( <div className="p-3 bg-green-100 ...">{userAddress}</div> )}
      </div>
      <div className="space-y-4 pt-4 border-t border-gray-200">
        {/* Input */}
        <input
          type="text"
          placeholder="Enter Celo Address You Want To Query"
          value={queryAddr}
          onChange={(e) => setQueryAddr(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md w-full mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          aria-label="User ID Input"
        />
        {/* Toggle Button */}
        <button
          onClick={toggleDelegation}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* ... Button text logic ... */}
          {!isValidQuery ? 'Not valid addr' : isDelegated ? 'Set Delegation to: Not Allowed' : 'Set Delegation to: Allowed'}
        </button>
      </div>
    </>
  );
};

// --- Interface 3 (Placeholder - Unchanged) ---
const Interface3 = () => {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Buy Tickets
      </h2>
      <TicketPurchaseFlow
        passAddress={CONTRACT_ADDRESS}
        ticketAddress={TICKET_ADDRESS}
        ticketPriceEth={10}
      />
    </>
  );
};

// --- Main SelfAuther Component (Integrates Interfaces) ---

function SelfAuther() {
  const [activeView, setActiveView] = useState<number>(1);
  const [userId, setUserId] = useState(''); // For Interface 1

  const renderActiveInterface = () => {
    switch (activeView) {
      case 1:
        return <Interface1 userId={userId} setUserId={setUserId} />;
      case 2:
        return <Interface2 />; // Render the new Interface 2
      case 3:
        return <Interface3 />;
      default:
        return <Interface1 userId={userId} setUserId={setUserId} />;
    }
  };

  const getButtonClass = (viewNumber: number) => {
    return `px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base ${ // Responsive text size
      activeView === viewNumber
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* --- Navigation Bar (Unchanged) --- */}
      <nav className="w-full bg-white border-b border-gray-200 py-3 px-6 flex items-center justify-between sticky top-0 z-10">
        {/* ... (nav content unchanged) ... */}
         <div className="flex items-center">
          <div className="mr-8">
            <img src="/self.svg" alt="Self Logo" className="h-8" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/seanhuang1228/buy4me"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900 text-white px-4 py-2 rounded-md flex items-center hover:bg-gray-800 transition-colors text-sm"
          >
            <span className="mr-2 hidden sm:inline">Star on Github</span> {/* Hide text on small screens */}
             <span className="mr-2 sm:hidden">Star</span> {/* Show shorter text */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </a>
          <a
            className="hidden sm:flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-indigo-600 hover:underline hover:underline-offset-4" // Hide on small screens
            href="https://github.com/seanhuang1228/buy4me"
            target="_blank"
            rel="noopener noreferrer"
          >
            Go to our github →
          </a>
        </div>
      </nav>

      {/* --- Main Content Area --- */}
      <div className="container mx-auto max-w-2xl px-4 py-8">

        {/* --- View Selector Buttons --- */}
        <div className="flex justify-center space-x-2 sm:space-x-4 mb-8"> {/* Reduced spacing */}
          <button
            onClick={() => setActiveView(1)}
            className={getButtonClass(1)}
          >
            Auth QR
          </button>
          <button
            onClick={() => setActiveView(2)}
            className={getButtonClass(2)}
          >
            Delegation
          </button>
          <button
            onClick={() => setActiveView(3)}
            className={getButtonClass(3)}
          >
            Interface 3
          </button>
        </div>

        {/* --- Interface Display Area --- */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 min-h-[300px]"> {/* Added min-height */}
          {renderActiveInterface()}
        </div>

      </div>
    </div>
  );
}

export default SelfAuther;
