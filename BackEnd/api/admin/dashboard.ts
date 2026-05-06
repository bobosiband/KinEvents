import type { VercelRequest, VercelResponse } from '@vercel/node'

import { authService } from '../../src/services/auth.service'
import { eventService } from '../../src/services/event.service'
import { userRepository } from '../../src/repositories/user.repository'
import { accessRequestRepository } from '../../src/repositories/accessRequest.repository'

/**
 * Returns admin dashboard metrics and summaries.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    const allUsers = userRepository.findAll()
    const allAccessRequests = accessRequestRepository.findAll()
    const allEvents = eventService.listEvents()

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
