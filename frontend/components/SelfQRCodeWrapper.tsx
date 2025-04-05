'use client';

import React, { useState, useEffect } from 'react';
import SelfQRcodeWrapper, { SelfAppBuilder } from '@selfxyz/qrcode';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  userId: string
}
type Props = string;

function VerificationPage({ userId }: Props) {
  const [isClient, setIsClient] = useState(false);
  const [isAddr, setIsAddr] = useState(false);

  const fetchProofFromServer = async () => {
    console.log("goooooooooooood");
    const res = await fetch(`/api/zk-proof?userId=${userId}`)
    if (!res.ok) return alert('failed QQ')
    const { proof, publicSignals } = await res.json()
    console.log("proof: ", proof);
    console.log("publicSignals: ", publicSignals);
    // setProof(proof)
    // setPublicSignals(publicSignals)
    // setReadyToMint(true)
  };

  useEffect(() => {
    setIsClient(true);
  }, [])

  useEffect(() => {
    if (ethers.isAddress(userId)) {
      setIsAddr(true)
    } else {
      setIsAddr(false)
    }
  }, [userId])

  if (!isClient) return null;

  if (isAddr) {
    const selfApp = new SelfAppBuilder({
      appName: "Self Birthday",
      scope: "self-auth",
      // endpoint: "https://happy-birthday-rho-nine.vercel.app/api/verify",
      // run `ngrok http 3000` and copy the url here to test locally
      endpoint: "https://1303-140-112-16-175.ngrok-free.app/api/verify",
      endpointType: "staging_https",
      userId: userId,
      userIdType: "hex",
      disclosures: { 
        date_of_birth: true,
      },
      devMode: true,
    } as Partial<SelfApp>).build();

    return (
      <div className="max-w-md mx-auto bg-white rounded-xl p-6 text-center space-y-4">
        <h2 className="text-xl font-semibold text-indigo-700">
          Verify Your Identity
        </h2>
        <p className="text-sm text-gray-600">
          Scan this QR code with the Self app to verify your identity
        </p>
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={() => {}}
        />
      </div>
    );
  } else {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl p-6 text-center space-y-4">
        <p className="text-red-600 text-lg mt-2">
          ⚠️ Not a valid address...
        </p>
      </div>
    );
  }
}

export default VerificationPage;
