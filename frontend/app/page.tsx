'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
// Make sure ethers is imported and available
import { ethers } from 'ethers';
import TicketPurchaseFlow from '@/components/TicketPurchaseFlow'
import {TICKET_CONTRACT_ADDRESS, NFT_CONTRACT_ADDRESS} from "@/lib/address.ts"

// --- Contract Details (Replace with your actual details) ---
// const CONTRACT_ADDRESS = '0xBa76A165938EF0AfCc7EC7Fef8BF5B86c29d064C'; // <-- PASTE YOUR CONTRACT ADDRESS HERE
// const TICKET_ADDRESS = '0x6A0a26627D5493B972DC983ECA61C018ec0354d9';
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
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">
        Let's Authenticate!
      </h2>

      <div className="flex flex-col items-center space-y-6">
        <input
          type="text"
          placeholder="Enter your Celo address"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md w-full max-w-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          aria-label="User ID Input"
        />

        <div className="bg-white p-6 w-full max-w-md">
          <SelfQRWrapper userId={userId} />
        </div>
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
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, CONTRACT_ABI, signer)
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
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      const canActOn = await contract.canActOnBehalf(userAddress, queryAddr)

      setIsDelegated(canActOn)
    }
    checkStatus()
  }, [queryAddr])

  return (
    <>
      <h2 className="text-3xl font-semibold mb-8 text-center text-indigo-700">
        Manage Delegation
      </h2>

      <div className="space-y-4">
        {!userAddress ? (
          <div className="flex justify-center">
            <button
              onClick={connectWallet}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
            <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm border border-green-300 shadow-sm text-center">
              Connected as: <br />
              <span className="font-mono break-all">{userAddress}</span>
            </div>
          )}
      </div>

      <div className="space-y-4 pt-6 border-t border-gray-200 mt-6">
        {/* Input */}
        <input
          type="text"
          placeholder="Enter Celo Address You Want to Query"
          value={queryAddr}
          onChange={(e) => setQueryAddr(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          aria-label="User ID Input"
        />

        {/* Toggle Button */}
        <button
          onClick={toggleDelegation}
          disabled={!isValidQuery}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {!isValidQuery
            ? 'Invalid Address'
            : isDelegated
              ? 'Set Delegation: Not Allowed'
              : 'Set Delegation: Allowed'}
        </button>
      </div>
    </>
  );
};

// --- Interface 3 (Placeholder - Unchanged) ---
const Interface3 = () => {
  return (
    <>
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">
        Buy Tickets
      </h2>

      <TicketPurchaseFlow
        passAddress={NFT_CONTRACT_ADDRESS}
        ticketAddress={TICKET_CONTRACT_ADDRESS}
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
      {/* --- Navigation Bar --- */}
      <nav className="w-full bg-white shadow-sm border-b border-gray-200 py-3 px-6 flex items-center justify-between sticky top-0 z-10">
        {/* Left logo */}
        <div className="bg-black rounded-full px-4 py-2 inline-flex items-center justify-center space-x-3">
          <img src="/icon.png" alt="App Icon" className="h-8 w-8" />
          <span className="text-lg font-semibold text-white hidden sm:inline">Buy4Me</span>
        </div>

        {/* Right links */}
        <div className="flex items-center space-x-4">
          {/* Star on GitHub button */}
          <a
            href="https://github.com/seanhuang1228/buy4me"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700 transition text-sm shadow-sm"
          >
            <span className="mr-2 hidden sm:inline">Star on GitHub</span>
            <span className="sm:hidden mr-2">Star</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </a>

          {/* Text link */}
          <a
            href="https://github.com/seanhuang1228/buy4me"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-sm text-gray-600 hover:text-indigo-600 hover:underline hover:underline-offset-4 transition"
          >
            Go to our GitHub →
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
            Buy Ticket
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
