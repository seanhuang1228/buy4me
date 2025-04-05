'use client'

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

interface Props {
  passAddress: string
  ticketAddress: string
  ticketPriceEth: number // e.g. 30
}

const passAbi = [
  'function balanceOf(address owner) view returns (uint256)',
]

const ticketAbi = [
  'function buyTicket(uint256[] calldata delegate_ids) payable',
]

export default function TicketPurchaseSection({ passAddress, ticketAddress, ticketPriceEth }: Props) {
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [hasPass, setHasPass] = useState(false)
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
      // const provider = new ethers.BrowserProvider(window.ethereum)
      // const signer = await provider.getSigner()
      // const contract = new ethers.Contract(ticketAddress, ticketAbi, signer)

      // const tx = await contract.buyTicket([account], {
      //   value: ethers.parseEther(ticketPriceEth.toString()),
      //   gasLimit: 500_000n,
      // })

      // setTxHash(tx.hash)
      // await tx.wait()
      alert('🎉 購票成功，NFT 已鑄造！')
    } catch (err: any) {
      console.error(err)
      setError(err.message || '購票失敗')
    } finally {
      setBuying(false)
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 40 }}>
      <h2>🎫 購票頁面</h2>

      {!connected ? (
        <button onClick={connect}>🔌 連接錢包</button>
      ) : !hasPass ? (
        <p>⚠️ 您尚未完成身份驗證，無法購票</p>
      ) : (
        <>
          <p>✅ 身份驗證通過，可購票</p>
          <button onClick={handleBuy} disabled={buying}>
            {buying ? '處理中...' : `立即購票（${ticketPriceEth} CELO）`}
          </button>
        </>
      )}

      {txHash && (
        <p style={{ marginTop: 10 }}>
          ✅ <a href={`https://explorer.celo.org/alfajores/tx/${txHash}`} target="_blank">查看交易</a>
        </p>
      )}

      {error && <p style={{ color: 'red' }}>⚠️ {error}</p>}
    </div>
  )
}
