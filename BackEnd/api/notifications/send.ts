import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import { notificationService } from '../../src/services/notification.service'

const sendNotificationSchema = z.object({
  type: z.enum(['event_created', 'event_updated', 'event_reminder', 'birthday_reminder', 'birthday_today', 'access_approved', 'access_rejected']),
  recipientId: z.string().uuid(),
  payload: z.record(z.string()),
})

/**
 * Sends a notification to one or more recipients.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = sendNotificationSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  try {
    const notification = notificationService.createNotification({
      type: parseResult.data.type,
      recipientId: parseResult.data.recipientId,
      payload: parseResult.data.payload,
      status: 'pending',
    })

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully',
    })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}
