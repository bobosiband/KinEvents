import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import { authService } from '../../src/services/auth.service'
import { withAuth } from '../../src/middleware/withAuth'
import { getClientIp, isRateLimited, recordAuthAttempt } from '../../src/services/authThrottle.service'

const requestAccessSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().optional(),
})

/**
 * Accepts a new access request from a user
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return withAuth(async (_authReq, authRes) => {
      const accessRequests = await authService.listAccessRequests()
      authRes.status(200).json({ success: true, data: accessRequests })
    }, 'admin')(req, res)
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = requestAccessSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  const email = parseResult.data.email
  const ip = getClientIp(req)

  if (await isRateLimited({ prefix: 'request_access', email, ip })) {
    await recordAuthAttempt({ action: 'request_access.blocked', actorId: null, email, ip, reason: 'rate_limited' })
    res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' })
    return
  }

  const accessRequest = await authService.requestAccess(parseResult.data)
  await recordAuthAttempt({ action: 'request_access.success', actorId: null, email, ip })
  res.status(201).json({ success: true, data: accessRequest })
}
