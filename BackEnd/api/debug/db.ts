import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getData } from '../../src/config/db'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const data = getData()
  res.status(200).json({
    success: true,
    data: {
      collections: {
        users: data.users.length,
        events: data.events.length,
        accessRequests: data.accessRequests.length,
        notifications: data.notifications.length,
        content: data.content.length,
      },
      userDetails: data.users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        accessStatus: user.accessStatus,
      })),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        mongoUriConfigured: Boolean(process.env.MONGODB_URI?.trim()),
      },
      timestamp: new Date().toISOString(),
    },
    message: 'Database state retrieved successfully',
  })
}

const protectedHandler = withAuth(handler, 'admin')

export default function debugDbHandler(req: VercelRequest, res: VercelResponse) {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, message: 'Not found' })
    return
  }

  return protectedHandler(req, res)
}
