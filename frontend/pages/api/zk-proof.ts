// pages/api/zk-proof.ts
import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

const DATA_DIR = path.join(process.cwd(), 'tmp', 'zk-proof')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { userId } = req.query

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userId' })
  }

  const filePath = path.join(DATA_DIR, `${userId}.json`)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Proof not found for this userId' })
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return res.status(200).json(data)
  } catch (err) {
    console.error('❌ 讀取失敗:', err)
    return res.status(500).json({ error: 'Failed to read proof file' })
  }
}
