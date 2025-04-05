'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
// Make sure ethers is imported and available
import { ethers } from 'ethers';

// --- Contract Details (Replace with your actual details) ---
const CONTRACT_ADDRESS = '0x7173bB396ABe84d8C1D5368d34a19795dD7551A3'; // <-- PASTE YOUR CONTRACT ADDRESS HERE
const CONTRACT_ABI = [
  // ABI fragments for the functions we need
  'function setDelegate(address delegate, bool allowed) external',
  'function canActOnBehalf(address owner, address actor) external view returns (bool)',
  // Add any other functions or events from your contract ABI if needed elsewhere
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
  // State for provider and signer
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Other state variables
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [delegateAddress, setDelegateAddress] = useState<string>('');
  const [isValidDelegateAddress, setIsValidDelegateAddress] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<boolean | null>(null); // This state will now be set via helper
  const [isLoading, setIsLoading] = useState<boolean>(false); // General loading (e.g., for checks)
  const [isUpdating, setIsUpdating] = useState<boolean>(false); // Specific loading for update tx
  const [error, setError] = useState<string | null>(null);
  const [isOnCorrectNetwork, setIsOnCorrectNetwork] = useState<boolean>(false);

  // --- <<< START: Logging Helper for setCurrentStatus >>> ---
  const logAndSetCurrentStatus = useCallback((value: boolean | null, caller: string) => {
      console.log(`>>> logAndSetCurrentStatus called by [${caller}] with value: ${value}`);
      // Compare with current value to detect redundant calls or immediate resets
      if (value !== currentStatus) {
        // console.trace(`Stack trace for setCurrentStatus call by [${caller}]`); // Uncomment for more detail if needed
        setCurrentStatus(value);
      } else {
        console.log(`>>> logAndSetCurrentStatus - Value (${value}) is same as current, skipping state update.`);
      }
  // Include currentStatus in dependency array so the comparison inside is up-to-date
  }, [currentStatus]);
  // --- <<< END: Logging Helper >>> ---


  // Effect to initialize provider and check network/connection on load
  useEffect(() => {
    console.log("Interface2 effect running for initialization...");
    if (typeof window !== 'undefined' && window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      console.log("Provider initialized");

      // Handler for account changes
      const handleAccountsChanged = async (accounts: string[], addressOverride?: string | null) => {
        const effectiveAddress = addressOverride ?? (accounts.length > 0 ? accounts[0] : null);
        console.log('handleAccountsChanged effectiveAddress:', effectiveAddress);

        if (effectiveAddress) {
            setUserAddress(effectiveAddress);
            logAndSetCurrentStatus(null, 'handleAccountsChanged - account change'); // Reset status
            setError(null);
            try {
                console.log(`Attempting to get signer for account: ${effectiveAddress}`);
                const newSigner = await web3Provider.getSigner(effectiveAddress);
                console.log(`Successfully obtained signer object:`, newSigner);
                setSigner(newSigner || null); // Ensure signer state updates
                if (!newSigner) setError("Failed to obtain signer instance.");
            } catch (err) {
                console.error(`CRITICAL: Error during getSigner for ${effectiveAddress}:`, err);
                setSigner(null);
                setError(`Error obtaining signer: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        } else {
            console.log('Wallet disconnected');
            setUserAddress(null);
            setSigner(null);
            logAndSetCurrentStatus(null, 'handleAccountsChanged - disconnect'); // Reset status
            setError('Wallet disconnected. Please connect again.');
            setIsOnCorrectNetwork(false);
        }
      };

      // Handler for network changes
      const handleChainChanged = async (chainId: string, addressOverride?: string | null) => {
        console.log('handleChainChanged network:', chainId);
        const correctNetwork = chainId === CELO_ALFAJORES_CHAIN_ID;
        setIsOnCorrectNetwork(correctNetwork);
        logAndSetCurrentStatus(null, 'handleChainChanged - network change'); // Reset status
        setError(null);

        const effectiveAddress = addressOverride ?? userAddress;
        console.log('handleChainChanged effectiveAddress:', effectiveAddress);

        if (!correctNetwork) {
            setError("Please switch to the Celo Alfajores Testnet.");
            setSigner(null);
        } else if (effectiveAddress && web3Provider) {
            console.log(`Correct network & address (${effectiveAddress}). Getting signer...`);
            try {
                const newSigner = await web3Provider.getSigner(effectiveAddress);
                console.log("Signer (re-)established in handleChainChanged:", newSigner);
                setSigner(newSigner || null);
                if (!newSigner) setError("Failed to re-obtain signer instance on network change.");
            } catch (err) {
                console.error("Error getting signer in handleChainChanged:", err);
                setSigner(null);
                setError("Could not get signer on this network.");
            }
        } else {
            console.log(`Signer not set/reset in handleChainChanged. Conditions: correctNetwork=${correctNetwork}, effectiveAddress=${effectiveAddress}, provider=${!!web3Provider}`);
            setSigner(null);
        }
      };

      // Check initial connection and network state
      const checkInitialState = async () => {
         console.log("Checking initial state...");
         if (!window.ethereum) return;
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
            let currentAddress: string | null = null;
            if (accounts.length > 0) {
                currentAddress = accounts[0];
                await handleAccountsChanged(accounts, currentAddress); // Await this
            } else {
                 setUserAddress(null); setSigner(null);
                 logAndSetCurrentStatus(null, 'checkInitialState - no accounts');
            }
            const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
            await handleChainChanged(chainId, currentAddress); // Await this
        } catch (err: any) {
            console.warn("Warning: Initial wallet state check failed:", err);
        }
      }
      checkInitialState();

      // Setup listeners
      window.ethereum.on('accountsChanged', (accounts) => handleAccountsChanged(accounts));
      window.ethereum.on('chainChanged', (chainId) => handleChainChanged(chainId));
      console.log("Event listeners attached");

      return () => {
        console.log("Cleaning up Interface2 effect listeners");
        if (window.ethereum.removeListener) {
           window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
           window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    } else {
      setError("MetaMask not detected. Please install MetaMask.");
    }
  }, [logAndSetCurrentStatus, userAddress]); // Added logAndSetCurrentStatus, userAddress to dependencies as they are used in handlers


  // Effect to validate delegate address input (DOES NOT RESET STATUS)
  useEffect(() => {
    console.log("Validation effect running. Delegate Address:", delegateAddress);
    const isValid = ethers.isAddress(delegateAddress);
    setIsValidDelegateAddress(isValid); // Set validity based on current address

    if (delegateAddress && !isValid) {
        if (error !== "Invalid delegate address format.") {
            console.log("Validation effect: Setting invalid address error.");
            setError("Invalid delegate address format.");
        }
    } else if (error === "Invalid delegate address format.") {
        console.log("Validation effect: Clearing invalid address error.");
        setError(null);
    }
    // --- NO CALL TO logAndSetCurrentStatus HERE ---
  }, [delegateAddress, error]);


  // Function to connect wallet
  const connectWallet = async () => {
     if (!window.ethereum) { setError("MetaMask not detected."); return; }
     const currentProvider = provider || (window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null);
     if (!currentProvider) { setError("MetaMask provider could not be initialized."); return; }
     if (!provider) setProvider(currentProvider);

    setIsLoading(true); setError(null);
    try {
      const accounts = await currentProvider.send('eth_requestAccounts', []) as string[];
      if (accounts.length > 0) {
          const connectedAddress = accounts[0];
          setUserAddress(connectedAddress);
          logAndSetCurrentStatus(null, 'connectWallet - successful connect'); // Reset status on new connect
          console.log(`connectWallet: Attempting to get signer for account: ${connectedAddress}`);
          const signerInstance = await currentProvider.getSigner(connectedAddress);
           console.log("connectWallet: Successfully got signer instance:", signerInstance);
           setSigner(signerInstance || null);
           if (!signerInstance) setError("Failed to get signer instance after connection.");

          const network = await currentProvider.getNetwork();
          const connectedChainId = ethers.toQuantity(network.chainId);
          const correctNetwork = connectedChainId === CELO_ALFAJORES_CHAIN_ID;
          setIsOnCorrectNetwork(correctNetwork);
          if (!correctNetwork) {
               setError("Wallet connected, but please switch to the Celo Alfajores Testnet.");
          } else {
               setError(null); // Clear potential previous errors if connection is fully successful
          }
      } else { /* ... handle no accounts ... */ }
    } catch (err: any) {
      // ... error handling ...
      setUserAddress(null); setSigner(null); setIsOnCorrectNetwork(false);
      logAndSetCurrentStatus(null, 'connectWallet - error');
       if (err.code === 4001) setError("Connection request rejected.");
       else setError(err.message || 'Failed to connect wallet.');
    } finally { setIsLoading(false); }
  };

   // Function to switch network
   const switchNetwork = async () => {
        // ... (switchNetwork implementation - no status changes needed here) ...
         if (!window.ethereum) { setError("MetaMask not detected."); return; }
       setIsLoading(true); setError(null);
       try {
           await window.ethereum.request({
               method: 'wallet_switchEthereumChain',
               params: [{ chainId: CELO_ALFAJORES_CHAIN_ID }],
           });
       } catch (switchError: any) {
           if (switchError.code === 4902) {
               try {
                   await window.ethereum.request({
                       method: 'wallet_addEthereumChain',
                       params: [ /* Celo Alfajores params */ ],
                   });
               } catch (addError: any) { setError("Failed to add Celo Alfajores network."); }
           } else if (switchError.code === 4001) setError("Network switch rejected.");
           else setError("Failed to switch network.");
       } finally { setIsLoading(false); }
   };


  // Function to check current delegation status (uses Provider)
  const checkStatus = useCallback(async () => {
     console.log('--- Entering checkStatus ---');
     // ... (Prerequisite checks: provider, network, userAddress, delegate validity, contract address - remain same) ...
      if (!provider || !isOnCorrectNetwork || !userAddress || !isValidDelegateAddress || CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_ON_ALFAJORES') {
          console.log("checkStatus prerequisites not met.");
          // Optionally set specific errors here if needed, but avoid resetting status
          return;
      }

     setIsLoading(true);
    if (error?.includes("delegation") || error?.includes("check status") || error?.includes("Contract call failed")) {
         setError(null); // Clear specific check errors
    }

    try {
      console.log('Creating read-only contract instance with provider...');
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      console.log(`Checking status via provider for owner: ${userAddress}, actor: ${delegateAddress}`);

      const status = await readContract.canActOnBehalf.staticCall(userAddress, delegateAddress);

      // --- Use the helper function ---
      logAndSetCurrentStatus(status, 'checkStatus - success');

      console.log('Current status (fetched):', status); // Log fetched value directly
    } catch (err: any) {
      console.error('Error checking status:', err);
      // --- Use the helper function ---
      logAndSetCurrentStatus(null, 'checkStatus - error');
       if (err.code === 'CALL_EXCEPTION') setError(`Contract call failed checking status: ${err.reason || 'Unknown'}`);
       else setError(err.message || 'Failed to check delegation status.');
    } finally {
      setIsLoading(false);
      console.log('--- Exiting checkStatus try/catch/finally ---');
    }
  // Dependencies updated to include logAndSetCurrentStatus
  }, [provider, isOnCorrectNetwork, userAddress, delegateAddress, isValidDelegateAddress, error, logAndSetCurrentStatus]);


   // Automatically check status when relevant inputs are valid and ready
   useEffect(() => {
       // Log dependencies on every run
        console.log("AutoCheck Effect: Running. Deps:", {
            providerExists: !!provider,
            isOnCorrectNetwork,
            userAddress,
            isValidDelegateAddress
        });

       const canCheck = provider && isOnCorrectNetwork && userAddress && isValidDelegateAddress;

       if (canCheck) {
           console.log("AutoCheck Effect: Conditions met - Calling checkStatus.");
           checkStatus();
       } else {
           // Log skip reason but DO NOT RESET STATUS HERE unless absolutely intended
           let skipReason = "Unknown";
           if (!provider) skipReason = "Provider not ready";
           else if (!isOnCorrectNetwork) skipReason = "Wrong network";
           else if (!userAddress) skipReason = "User address missing";
           else if (!isValidDelegateAddress) skipReason = "Invalid delegate address";
           console.log(`AutoCheck Effect: Conditions NOT met (${skipReason}).`);

           // Example Reset Condition (Only if address becomes invalid):
           // if (!isValidDelegateAddress && currentStatus !== null) {
           //     logAndSetCurrentStatus(null, 'AutoCheck Effect - Delegate became invalid');
           // }
       }
   // Dependencies are the conditions that INITIATE the check.
   }, [provider, isOnCorrectNetwork, userAddress, isValidDelegateAddress, checkStatus]); // Added checkStatus back - needed if it uses useCallback


  // Function to toggle the delegation status (uses Signer)
   const toggleDelegation = async () => {
       console.log('--- Entering toggleDelegation ---');
       // ... (Prerequisite checks: signer, network, userAddress, delegate validity, currentStatus !== null, contract address - remain same) ...
        if (!signer || !isOnCorrectNetwork || !userAddress || !isValidDelegateAddress || currentStatus === null || CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_ON_ALFAJORES') {
             console.log("toggleDelegation prerequisites not met.");
             // Set appropriate errors if needed
             if (!signer) setError("Signer not available.");
             else if (!isOnCorrectNetwork) setError("Wrong network.");
             else if (currentStatus === null) setError("Status unknown.");
             // etc.
             return;
        }

     setIsUpdating(true);
    if (error?.includes("delegation") || error?.includes("Transaction failed") || error?.includes("rejected")) {
         setError(null); // Clear specific transaction errors
    }
     const newAllowedStatus = !currentStatus; // Use definite 'false' from state

     try {
       console.log('Creating writeable contract instance with signer...');
       const writeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
       console.log(`Attempting to set delegation via signer for ${delegateAddress} to ${newAllowedStatus}`);
       const tx = await writeContract.setDelegate(delegateAddress, newAllowedStatus);
       alert(`Transaction sent: ${tx.hash}. Please wait...`);
       const receipt = await tx.wait();
       console.log('Transaction confirmed:', receipt?.hash);

        if (receipt?.status === 1) {
             console.log("Transaction successful, re-checking status...");
             // We expect checkStatus to update the state via logAndSetCurrentStatus
             await checkStatus();
             alert(`Delegation status successfully updated!`);
        } else {
             setError(`Transaction failed on-chain (Status: ${receipt?.status}).`);
             // Optionally re-check status to see if state reverted
             // await checkStatus();
        }
     } catch (err: any) {
       console.error('Error setting delegation:', err);
       // ... (Error handling: ACTION_REJECTED, CALL_EXCEPTION, INSUFFICIENT_FUNDS etc. - remain same) ...
       if (err.code === 'ACTION_REJECTED' || err.code === 4001) setError('Transaction rejected.');
       else if (err.code === 'CALL_EXCEPTION') setError(`Transaction failed: ${err.reason || 'Contract logic error'}`);
       else if (err.code === 'INSUFFICIENT_FUNDS') setError('Insufficient CELO for gas.');
       else setError(err.reason || err.message || 'Failed to update delegation.');
     } finally {
       setIsUpdating(false);
       console.log('--- Exiting toggleDelegation try/catch/finally ---');
     }
   };

  // --- Render Logic ---
   // Debug logging right before return
   console.log('--- Render Cycle State ---');
   console.log('Signer:', signer ? `JsonRpcSigner (Address: ${signer.address})` : null); // Log address if available
   console.log('Provider:', !!provider);
   console.log('User Address:', userAddress);
   console.log('Is On Correct Network:', isOnCorrectNetwork);
   console.log('Current Status:', currentStatus); // <<< WATCH THIS VALUE
   console.log('Is Loading:', isLoading);
   console.log('Is Updating:', isUpdating);
   console.log('Is Valid Delegate:', isValidDelegateAddress);
   console.log('Error:', error);
   console.log('Button Disabled Check:', { // Log the components of the disabled check
       noSigner: !signer,
       invalidDelegate: !isValidDelegateAddress,
       statusNull: currentStatus === null, // <<< WATCH THIS VALUE
       isUpdating: isUpdating,
       isLoadingCheck: (isLoading && !isUpdating) ,
       finalDisabled: (!signer || !isValidDelegateAddress || currentStatus === null || isUpdating || (isLoading && !isUpdating))
   });

  return (
    <>
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Manage Delegation (View 2)
      </h2>
      <div className="space-y-4">
         {/* ... (JSX Structure remains the same as the previous version, including config check, connection area, error area, interaction area with input, status display, and button) ... */}
         {/* Configuration Needed Check */}
         {CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_ON_ALFAJORES' && ( <div className="p-4 border border-dashed border-red-400 rounded text-center">...</div> )}
         {/* Connection Status Area */}
         {!userAddress ? ( <button onClick={connectWallet} disabled={isLoading} className="...">...</button> ) : ( <div className="p-3 bg-green-100 ...">...</div> )}
         {/* Error Display Area */}
         {error && ( <div className="p-3 bg-red-100 ...">Error: {error}</div> )}
         {/* Interaction Area */}
         {userAddress && isOnCorrectNetwork && provider && CONTRACT_ADDRESS !== 'YOUR_CONTRACT_ADDRESS_ON_ALFAJORES' && (
             <div className="space-y-4 pt-4 border-t border-gray-200">
                 {/* Input */}
                 <div>...</div>
                  {/* Status Display */}
                  <div className="text-center">...</div>
                 {/* Toggle Button */}
                 <button
                     onClick={toggleDelegation}
                     disabled={!signer || !isValidDelegateAddress || currentStatus === null || isUpdating || (isLoading && !isUpdating)} // Condition remains the same
                     className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     {/* ... Button text logic ... */}
                      {isUpdating ? 'Processing Transaction...' :
                      currentStatus === null ? 'Toggle Delegation (Status Unknown)' :
                      currentStatus ? 'Set Delegation to: Not Allowed' : 'Set Delegation to: Allowed'}
                 </button>
             </div>
         )}
          {/* Optional Signer Loading */}
         {userAddress && isOnCorrectNetwork && provider && !signer && !error && CONTRACT_ADDRESS !== 'YOUR_CONTRACT_ADDRESS_ON_ALFAJORES' && ( <div className="text-center ...">Initializing signer...</div> )}
      </div>
    </>
  );
};

// --- Interface 3 (Placeholder - Unchanged) ---
const Interface3 = () => {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Third Interface (View 3)
      </h2>
      <div className="p-4 border border-dashed border-blue-400 rounded text-center">
        <p className="text-lg mb-2">Content for the Third View</p>
        <ul className="list-disc list-inside text-left inline-block">
          <li>Another distinct view</li>
          <li>Could contain settings, info, etc.</li>
        </ul>
      </div>
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
