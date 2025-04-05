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
  'function canActOnBehalf(address owner, address actor) view returns (bool)'
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
      // const provider = new ethers.BrowserProvider(window.ethereum)
      // const signer = await provider.getSigner()
      // const contract = new ethers.Contract(ticketAddress, ticketAbi, signer)
      //
      // const tx = await contract.buyTicket(delegateIds, {
      //   value: ethers.parseEther((ticketPriceEth * (1 + delegateIds.length)).toString()),
      //   gasLimit: 700_000n,
      // })
      //
      // setTxHash(tx.hash)
      // await tx.wait()
      alert('🎉 購票成功！NFT 已鑄造！')
    } catch (err: any) {
      console.error(err)
      setError(err.message || '購票失敗')
    } finally {
      setBuying(false)
    }
  }

  const handleAddId = async () => {
    if (!account) return
    try {
      const value = BigInt(tokenIdInput)

      // const provider = new ethers.BrowserProvider(window.ethereum)
      const provider = new ethers.JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
      const contract = new ethers.Contract(passAddress, passAbi, provider)
      const addr = await contract.ownerOf(value)
      const canAct = await contract.canActOnBehalf(addr, account)

      if (canAct) {
        setDelegateIds([...delegateIds, value])
        setTokenIdInput('')
      } else {
        alert('cannot act on the owner of id: ', value)
        setTokenIdInput('')
      }
    } catch(err: any) {
      console.error(err)
      alert('請輸入有效的 tokenId')
    }
  }

  const handleRemoveId = (index: number) => {
    setDelegateIds(delegateIds.filter((_, i) => i !== index))
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 40 }}>
      <h2>🎫 購票頁面</h2>

      {!connected ? (
        <button onClick={connect}>🔌 連接錢包</button>
      ) : !hasPass ? (
        <p>⚠️ 您尚未通過驗證（沒有資格 NFT）</p>
      ) : (
        <>
          <p>✅ 已確認你具備購票資格</p>

          <p>🧑‍🤝‍🧑 若要幫其他人購票，請輸入他們的資格 NFT ID：</p>
          <div style={{ marginBottom: 12 }}>
            <input
              value={tokenIdInput}
              onChange={e => setTokenIdInput(e.target.value)}
              placeholder="輸入資格 NFT ID"
              style={{ padding: 8, width: 240 }}
            />
            <button onClick={handleAddId} style={{ marginLeft: 8 }}>➕ 加入</button>
          </div>

          {delegateIds.length > 0 && (
            <ul style={{ fontSize: 14, marginBottom: 16 }}>
              {delegateIds.map((id, idx) => (
                <li key={idx}>
                  🎟️ Token ID: {id.toString()} &nbsp;
                  <button onClick={() => handleRemoveId(idx)}>❌ 移除</button>
                </li>
              ))}
            </ul>
          )}

          <p>🧾 總票數：{1 + delegateIds.length} 張</p>
          <p>💰 總金額：{(ticketPriceEth * (1 + delegateIds.length)).toFixed(2)} CELO</p>

          <button onClick={handleBuy} disabled={buying}>
            {buying ? '處理中...' : '立即購票'}
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
