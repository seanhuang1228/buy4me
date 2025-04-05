'use client'

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

interface Props {
  passAddress: string
  ticketAddress: string
  ticketPriceEth: number
}

const passAbi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function canActOnBehalf(address owner, address actor) view returns (bool)',
  'function address2id(address) view returns (uint256)'
]

const ticketAbi = [
  'function buyTicket(uint256[] calldata delegate_ids) payable',
]

export default function TicketPurchaseSection({ passAddress, ticketAddress, ticketPriceEth }: Props) {
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [hasPass, setHasPass] = useState(false)
  const [tokenIdInput, setTokenIdInput] = useState('')
  const [delegateIds, setDelegateIds] = useState<bigint[]>([])
  const [buying, setBuying] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connect = async () => {
    const [addr] = await window.ethereum.request({ method: 'eth_requestAccounts' })
    setConnected(true)
    setAccount(addr)
  }

  useEffect(() => {
    const checkPass = async () => {
      if (!account) return
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(passAddress, passAbi, provider)
      const balance = await contract.balanceOf(account)
      setHasPass(balance > 0n)
    }
    checkPass()
  }, [account])

  const handleBuy = async () => {
    if (!account) return
    setBuying(true)
    setError(null)
    setTxHash(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(ticketAddress, ticketAbi, signer)

      console.log("ids", delegateIds);
      const tx = await contract.buyTicket(delegateIds, {
        value: ethers.parseUnits("10", "gwei"),
        gasLimit: 700_000n,
      })

      setTxHash(tx.hash)
      await tx.wait()
      alert("Success! You got a ticket NFT!")
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Buy ticket failed')
    } finally {
      setBuying(false)
    }
  }

  const handleAddId = async () => {
    if (!account) return
    try {
      const addr = tokenIdInput.trim()

      const provider = new ethers.JsonRpcProvider("https://forno.celo.org");
      const contract = new ethers.Contract(passAddress, passAbi, provider)
      const canAct = await contract.canActOnBehalf(addr, account)
      const id = await contract.address2id(addr)

      if (!canAct) {
        alert(`You are not authorized to act on behalf of: ${addr}`)
        setTokenIdInput('')
        return
      }

      const idStr = id.toString()
      const alreadyAdded = delegateIds.some(existingId => existingId.toString() === idStr)

      if (alreadyAdded) {
        alert(`This ID (${idStr}) has already been added.`)
      } else {
        setDelegateIds([...delegateIds, id])
      }

      setTokenIdInput('')
    } catch (err: any) {
      console.error(err)
      alert('Please input a valid address that delegated authority to you.')
      setTokenIdInput('')
    }
  }

  const handleRemoveId = (index: number) => {
    setDelegateIds(delegateIds.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col items-center space-y-6">

      {!connected ? (
        <div className="h-64 flex flex-col justify-center items-center">
          <button
            onClick={connect}
            className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
          >
            Connect Wallet
          </button>
        </div>
      ) : !hasPass ? (
          <p className="text-red-600">⚠️ You are not verified (no eligible NFT found)</p>
        ) : (
            <>
              <p className="text-green-600 font-semibold">✅ You are eligible to purchase tickets</p>

              <p className="text-sm text-gray-700">
                To help others buy tickets, enter their eligibility NFT token IDs:
              </p>

              <div className="flex justify-center gap-2">
                <input
                  value={tokenIdInput}
                  onChange={e => setTokenIdInput(e.target.value)}
                  placeholder="Enter token ID"
                  className="border border-gray-300 rounded-md px-3 py-2 w-64 text-sm"
                />
                <button
                  onClick={handleAddId}
                  className="bg-gray-200 hover:bg-gray-300 text-sm rounded-md px-3 py-2"
                >
                  ➕ Add
                </button>
              </div>

              {delegateIds.length > 0 && (
                <ul className="bg-gray-50 rounded-md p-3 text-sm text-left space-y-2 border border-gray-200">
                  {delegateIds.map((id, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      🎟️ Token ID: {id.toString()}
                      <button
                        onClick={() => handleRemoveId(idx)}
                        className="text-red-500 text-xs hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="text-sm text-gray-700 mt-4">
                🧾 Total Tickets: <b>{delegateIds.length}</b><br />
                💰 Total Price (wgei): <b>{(ticketPriceEth * delegateIds.length).toFixed(2)}</b>
              </div>

              <button
                onClick={handleBuy}
                disabled={buying}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {buying ? 'Processing...' : 'Buy Tickets'}
              </button>
            </>
          )}

      {txHash && (
        <p className="text-green-600 text-sm mt-2">
          ✅ <a href={`https://explorer.celo.org/alfajores/tx/${txHash}`} target="_blank" className="underline">
            View Transaction
          </a>
        </p>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-2">⚠️ {error}</p>
      )}
    </div>
  );
}
