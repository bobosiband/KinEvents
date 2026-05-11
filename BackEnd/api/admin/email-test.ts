import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { emailService } from '../../src/services/email.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'
import type { EmailTemplateName } from '../../src/interfaces/email.interface'

const emailTestSchema = z.object({
  templateName: z.string(),
  recipientEmail: z.string().email(),
})

// Mock contexts for each template
const mockContexts: Record<EmailTemplateName, Record<string, unknown>> = {
  'welcome': {
    recipientName: 'John Doe',
    loginUrl: 'https://kinevents.app/login',
  },
  'access-approved': {
    recipientName: 'Jane Smith',
    loginUrl: 'https://kinevents.app/login',
  },
  'access-rejected': {
    recipientName: 'Bob Johnson',
    supportEmail: 'support@kinevents.app',
  },
  'account-updated': {
    recipientName: 'Alice Brown',
    changedFields: ['Email address', 'Phone number'],
  },
  'role-changed': {
    recipientName: 'Charlie Wilson',
    newRole: 'manager',
    capabilities: ['Moderate events', 'View reports'],
  },
  'event-created': {
    recipientName: 'Diana Prince',
    eventTitle: 'Family Reunion 2026',
    eventDate: '2026-07-15',
    eventLocation: 'Central Park, New York',
    eventUrl: 'https://kinevents.app/events/123',
  },
  'event-updated': {
    recipientName: 'Eve Martinez',
    eventTitle: 'Summer BBQ',
    eventDate: '2026-08-20',
    changes: ['Moved to new location', 'Changed start time to 6 PM'],
    eventUrl: 'https://kinevents.app/events/456',
  },
  'event-cancelled': {
    recipientName: 'Frank Miller',
    eventTitle: 'Holiday Party',
    reason: 'Venue became unavailable',
  },
  'event-reminder': {
    recipientName: 'Grace Lee',
    eventTitle: 'Kids Birthday Party',
    eventDate: '2026-05-20',
    daysUntil: 3,
    eventUrl: 'https://kinevents.app/events/789',
  },
  'rsvp-confirmation': {
    recipientName: 'Henry Davis',
    eventTitle: 'Wedding Celebration',
    rsvpStatus: 'yes',
    eventDate: '2026-06-10',
  },
  'birthday-today': {
    recipientName: 'Iris Anderson',
  },
  'birthday-reminder': {
    recipientName: 'Jack Thompson',
    birthdayPersonName: 'Sarah Connor',
    daysUntil: 2,
    birthdayDate: '2026-05-25',
  },
  'announcement': {
    recipientName: 'Karen White',
    announcementTitle: 'New Feature Announcement',
    announcementBody: 'We are excited to announce a new event management feature!',
    priority: 'normal',
  },
}

/**
 * POST /api/admin/email-test - Send a test email (admin only).
 * Requires NODE_ENV !== 'production'.
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  // Disable in production for safety
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ success: false, message: 'Email testing disabled in production' })
    return
  }

  try {
    const parseResult = emailTestSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
      return
    }

    const { templateName, recipientEmail } = parseResult.data
    const mockContext = mockContexts[templateName as EmailTemplateName] as Record<string, unknown> & { recipientName: string }

    if (!mockContext) {
      res.status(400).json({ success: false, message: `Unknown template: ${templateName}` })
      return
    }

    const success = await emailService.sendTemplate(
      templateName as EmailTemplateName,
      mockContext,
      { name: 'Test Recipient', email: recipientEmail },
      'test-user-id'
    )

    if (!success) {
      res.status(500).json({ success: false, message: 'Failed to send test email - check email logs for details' })
      return
    }

    res.status(200).json({
      success: true,
      data: { templateName, recipientEmail },
      message: 'Test email sent successfully',
    })
  } catch (error) {
    console.error('[POST /api/admin/email-test] Error sending test email:', error)
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' })
  }
}

export default withAuth(handler, 'admin')
