import type { VercelResponse } from '@vercel/node'

import { eventService } from '../../src/services/event.service'
import { readData } from '../../src/config/db'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

/**
 * Returns admin dashboard metrics and summaries.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    const db = await readData()
    const { users: allUsers, accessRequests: allAccessRequests } = db
    const allEvents = await eventService.listEvents()

    const dashboard = {
      users: {
        total: allUsers.length,
        admins: allUsers.filter((u) => u.role === 'admin').length,
        managers: allUsers.filter((u) => u.role === 'manager').length,
        members: allUsers.filter((u) => u.role === 'member').length,
        approved: allUsers.filter((u) => u.accessStatus === 'approved').length,
        pending: allUsers.filter((u) => u.accessStatus === 'pending').length,
        revoked: allUsers.filter((u) => u.accessStatus === 'revoked').length,
      },
      accessRequests: {
        total: allAccessRequests.length,
        pending: allAccessRequests.filter((r) => r.status === 'pending').length,
        approved: allAccessRequests.filter((r) => r.status === 'approved').length,
        rejected: allAccessRequests.filter((r) => r.status === 'rejected').length,
      },
      events: {
        total: allEvents.length,
        birthdays: allEvents.filter((e) => e.type === 'birthday').length,
        custom: allEvents.filter((e) => e.type === 'custom').length,
        locked: allEvents.filter((e) => e.locked).length,
      },
    }

    res.status(200).json({ success: true, data: dashboard })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')
