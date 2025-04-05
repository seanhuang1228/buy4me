import { NextApiRequest, NextApiResponse } from 'next';
import { 
    getUserIdentifier, 
    SelfBackendVerifier,
} from '@selfxyz/core';
import { ethers } from 'ethers';
import { abi } from '../../app/content/abi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { proof, publicSignals } = req.body;

            if (!proof || !publicSignals) {
                return res.status(400).json({ message: 'Proof and publicSignals are required' });
            }

            console.log("Proof:", proof);
            console.log("Public signals:", publicSignals);

            // Contract details
            const contractAddress = "0x0A11C254A9c242e87DDDcf329b9e16104CDb993f";
            const address = await getUserIdentifier(publicSignals, "hex");
            console.log("Extracted address from verification result:", address);

            // Connect to Celo network
            const provider = new ethers.JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
            const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
            const contract = new ethers.Contract(contractAddress, abi, signer);

            const gasPrice = ethers.parseUnits('30', 'gwei');
            let gasLimit;
            try {
                const estimatedGas = await contract.estimateGas.verifySelfProof(proof);
                gasLimit = estimatedGas * 120n / 100n;
            } catch (err) {
                console.warn("⚠️ gas estimate failed, use default value");
                gasLimit = 1_000_000n;
            }

            try {
                console.log("sucess try to send!");
                const tx = await contract.verifySelfProof(
                    {
                        a: proof.a,
                        b: [
                            [proof.b[0][1], proof.b[0][0]],
                            [proof.b[1][1], proof.b[1][0]],
                        ],
                        c: proof.c,
                        pubSignals: publicSignals
                    },
                    {
                        gasPrice,
                        gasLimit
                    }
                );
                await tx.wait();
                console.log("Successfully called verifySelfProof function");
                res.status(200).json({
                    status: 'success',
                    result: true,
                    credentialSubject: {},
                });
            } catch (error) {
                console.error("Error calling verifySelfProof function:", error);
                res.status(400).json({
                    status: 'error',
                    result: false,
                    message: 'Verification failed or date of birth not disclosed',
                    details: {},
                });
                throw error;
            }
        } catch (error) {
            console.error('Error verifying proof:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Error verifying proof',
                result: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
// app/api/verify/route.ts

// pages/api/verify.ts
// import { getUserIdentifier } from '@selfxyz/core'
// import fs from 'fs'
// import path from 'path'
//
// const DATA_DIR = path.join(process.cwd(), 'tmp', 'zk-proof')
//
// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method Not Allowed' })
//   }
//
//   try {
//     const { proof, publicSignals } = req.body
//
//     if (!proof || !publicSignals) {
//       return res.status(400).json({ error: 'Missing required fields' })
//     }
//     const userId = await getUserIdentifier(publicSignals, "hex");
//
//     const filePath = path.join(DATA_DIR, `${userId}.json`)
//     fs.mkdirSync(DATA_DIR, { recursive: true })
//     fs.writeFileSync(filePath, JSON.stringify({ proof, publicSignals }, null, 2))
//
//     console.log(`✅ 已儲存用戶 ${userId} 的 ZK proof`)
//
//     return res.status(200).json({
//         status: 'success',
//         result: true,
//         credentialSubject: {},
//     });
//   } catch (err) {
//     console.error('❌ 儲存 ZK proof 時發生錯誤:', err)
//     return res.status(500).json({ error: 'Internal Server Error' })
//   }
// }
