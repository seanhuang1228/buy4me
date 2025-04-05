import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// ⛔ 禁止伺服器端渲染，這樣就不會發生 document is not defined
const QRcode = dynamic(() => import('../components/QRcode.jsx'), {
  ssr: false
})

export default function Home() {
  const [isClient, setIsClient] = useState(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div>
      { isClient ? <QRcode /> : <p> loading </p>
      }
    </div>
  )
}
