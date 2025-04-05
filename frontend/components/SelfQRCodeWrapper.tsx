'use client';

import React, { useState, useEffect } from 'react';
import SelfQRcodeWrapper, { SelfAppBuilder } from '@selfxyz/qrcode';
import { v4 as uuidv4 } from 'uuid';

function VerificationPage() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Generate a user ID when the component mounts
    setUserId(uuidv4());
  }, []);

  if (!userId) return null;

  const selfApp = new SelfAppBuilder({
    appName: "Self Birthday",
    scope: "self-auth",
    // endpoint: "https://happy-birthday-rho-nine.vercel.app/api/verify",
    // run `ngrok http 3000` and copy the url here to test locally
    endpoint: "https://1303-140-112-16-175.ngrok-free.app/api/verify",
    endpointType: "staging_https",
    userId: "0xdcfb721b8DF1B001A01e1d02C486F4D1c00dbaF5",
    userIdType: "hex",
    disclosures: { 
      date_of_birth: true,
    },
    devMode: true,
  } as Partial<SelfApp>).build();

  return (
    <div className="verification-container">
      <h1>Verify Your Identity</h1>
      <p>Scan this QR code with the Self app to verify your identity</p>
      
      <SelfQRcodeWrapper
        selfApp={selfApp}
        onSuccess={() => {
          // Handle successful verification
          console.log("Verification successful!");
          // Redirect or update UI
        }}
        size={350}
      />
      
      <p className="text-sm text-gray-500">
        User ID: {userId.substring(0, 8)}...
      </p>
    </div>
  );
}

export default VerificationPage;
