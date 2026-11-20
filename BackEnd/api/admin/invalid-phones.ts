import type { VercelResponse } from '@vercel/node'

import { readData } from '../../src/config/db'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'
import { PhoneValidator } from '../../src/phone/PhoneValidator'

interface InvalidPhoneRow {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly phone: string
}

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admins only' })
    return
  }

  const db = await readData()
  const rows: InvalidPhoneRow[] = []
  for (const user of db.users) {
    const value = user.phone ?? user.phoneNumber
    if (value === undefined || value === null) continue
    if (PhoneValidator.isValid(value)) continue
    rows.push({ id: user.id, name: user.name, email: user.email, phone: value })
  }

  res.status(200).json({ success: true, data: rows, count: rows.length })
}

export default withAuth(handler)
