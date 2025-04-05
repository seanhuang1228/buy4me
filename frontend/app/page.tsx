'use client';

import dynamic from 'next/dynamic'
import React, { useState, useEffect } from 'react';
import { logo } from './content/birthdayAppLogo';
import { ethers } from 'ethers';

const SelfQRWrapper = dynamic(() => import('../components/SelfQRCodeWrapper'), {
  ssr: false
})

function SelfAuther() {
    return (
        // TODO: change graph
        <div className="min-h-screen bg-white text-black">
            <nav className="w-full bg-white border-b border-gray-200 py-3 px-6 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="mr-8">
                        <img
                            src="/self.svg" 
                            alt="Self Logo" 
                            className="h-8"
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <a 
                        href="https://github.com/seanhuang1228/buy4me" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-gray-900 text-white px-4 py-2 rounded-md flex items-center hover:bg-gray-800 transition-colors"
                    >
                        <span className="mr-2">Star on Github</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                    </a>
                    <a
                        className="flex items-center justify-center gap-2 hover:underline hover:underline-offset-4"
                        href="https://github.com/seanhuang1228/buy4me"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Go to our github →
                    </a>
                </div>
            </nav>

            <div className="container mx-auto max-w-2xl px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
                    <h2 className="text-2xl font-semibold mb-6 text-center">
                        Let&apos;s Auth!
                    </h2>
                    <SelfQRWrapper />
                </div>
            </div>
        </div>
    );
}

export default SelfAuther;
