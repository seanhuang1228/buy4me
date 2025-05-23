import { NextApiRequest, NextApiResponse } from 'next';
import { 
    getUserIdentifier, 
    SelfBackendVerifier,
} from '@selfxyz/core';
import { ethers } from 'ethers';
import { abi } from '../../app/content/abi';
import { MINTER_CONTRACT_ADDRESS } from "@/lib/address"

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
            const contractAddress = MINTER_CONTRACT_ADDRESS;
            const address = await getUserIdentifier(publicSignals, "hex");
            console.log("Extracted address from verification result:", address);

            // Connect to Celo network
            const provider = new ethers.JsonRpcProvider("https://forno.celo.org");
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
