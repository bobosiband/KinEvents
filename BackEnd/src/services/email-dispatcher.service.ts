import { emailService } from './email.service'
import type { IUser } from '../interfaces/user.interface'
import type { IEvent } from '../interfaces/event.interface'
import type { IAccessRequest } from '../interfaces/auth.interface'
import type { RSVPStatus } from '../interfaces/event.interface'

/**
 * Email dispatcher service - maps domain events to email templates and sends them.
 * Respects user notification preferences and never throws.
 */
class EmailDispatcherService {
  /**
   * Sends access approved email to newly approved user.
   */
  async onAccessApproved(user: IUser): Promise<void> {
    if (!this.shouldSendEmail(user, 'important')) {
      console.log(`[EMAIL] Skipping access-approved email for ${user.id} - user preferences`)
      return
    }

    try {
      const loginUrl = `${process.env.APP_URL}/login`
      await emailService.sendTemplate(
        'access-approved',
        {
          recipientName: user.name,
          loginUrl,
        },
        { name: user.name, email: user.email },
        user.id
      )
    } catch (error) {
      console.error(`[EMAIL] onAccessApproved failed for ${user.id}:`, error)
    }
  }

  /**
   * Sends welcome email to newly approved user (first approval).
   */
  async onWelcome(user: IUser): Promise<void> {
    if (!this.shouldSendEmail(user, 'all')) {
      console.log(`[EMAIL] Skipping welcome email for ${user.id} - user preferences`)
      return
    }

    try {
      const loginUrl = `${process.env.APP_URL}/login`
      await emailService.sendTemplate(
        'welcome',
        {
          recipientName: user.name,
          loginUrl,
        },
        { name: user.name, email: user.email },
        user.id
      )
    } catch (error) {
      console.error(`[EMAIL] onWelcome failed for ${user.id}:`, error)
    }
  }

  /**
   * Sends access rejected email.
   */
  async onAccessRejected(request: IAccessRequest): Promise<void> {
    // We don't have user preferences here, so send if email is properly configured
    try {
      const supportEmail = 'support@kinevents.vercel.app'
      await emailService.sendTemplate(
        'access-rejected',
        {
          recipientName: request.name,
          supportEmail,
        },
        { name: request.name, email: request.email },
        request.id
      )
    } catch (error) {
      console.error(`[EMAIL] onAccessRejected failed for ${request.id}:`, error)
    }
  }

  /**
   * Sends account updated email.
   */
  async onAccountUpdated(user: IUser, changedFields: string[]): Promise<void> {
    if (!this.shouldSendEmail(user, 'important')) {
      console.log(`[EMAIL] Skipping account-updated email for ${user.id} - user preferences`)
      return
    }

    try {
      await emailService.sendTemplate(
        'account-updated',
        {
          recipientName: user.name,
          changedFields,
        },
        { name: user.name, email: user.email },
        user.id
      )
    } catch (error) {
      console.error(`[EMAIL] onAccountUpdated failed for ${user.id}:`, error)
    }
  }

  /**
   * Sends role changed email.
   */
  async onRoleChanged(user: IUser): Promise<void> {
    if (!this.shouldSendEmail(user, 'important')) {
      console.log(`[EMAIL] Skipping role-changed email for ${user.id} - user preferences`)
      return
    }

    try {
      const capabilities = ['View and manage events', 'Create events', 'View notifications']
      if (user.role === 'admin') {
        capabilities.push('Approve access requests', 'Manage users', 'View admin dashboard')
      } else if (user.role === 'manager') {
        capabilities.push('Moderate events')
      }

      await emailService.sendTemplate(
        'role-changed',
        {
          recipientName: user.name,
          newRole: user.role,
          capabilities,
        },
        { name: user.name, email: user.email },
        user.id
      )
    } catch (error) {
      console.error(`[EMAIL] onRoleChanged failed for ${user.id}:`, error)
    }
  }

  /**
   * Sends event created email to all approved users.
   */
  async onEventCreated(event: IEvent, recipients: IUser[]): Promise<void> {
    const promises = recipients.map((user) => {
      if (!this.shouldSendEmail(user, 'all')) {
        console.log(`[EMAIL] Skipping event-created email for ${user.id} - user preferences`)
        return Promise.resolve()
      }

      return (async () => {
        try {
          const eventUrl = `${process.env.APP_URL}/events/${event.id}`
          await emailService.sendTemplate(
            'event-created',
            {
              recipientName: user.name,
              eventTitle: event.title,
              eventDate: event.date,
              eventLocation: event.location,
              eventUrl,
            },
            { name: user.name, email: user.email },
            user.id
          )
        } catch (error) {
          console.error(`[EMAIL] onEventCreated failed for user ${user.id}:`, error)
        }
      })()
    })

    await Promise.all(promises)
  }

  /**
   * Sends event updated email.
   */
  async onEventUpdated(event: IEvent, recipients: IUser[], changes: string[]): Promise<void> {
    const promises = recipients.map((user) => {
      if (!this.shouldSendEmail(user, 'all')) {
        console.log(`[EMAIL] Skipping event-updated email for ${user.id} - user preferences`)
        return Promise.resolve()
      }

      return (async () => {
        try {
          const eventUrl = `${process.env.APP_URL}/events/${event.id}`
          await emailService.sendTemplate(
            'event-updated',
            {
              recipientName: user.name,
              eventTitle: event.title,
              eventDate: event.date,
              changes,
              eventUrl,
            },
            { name: user.name, email: user.email },
            user.id
          )
        } catch (error) {
          console.error(`[EMAIL] onEventUpdated failed for user ${user.id}:`, error)
        }
      })()
    })

    await Promise.all(promises)
  }

  /**
   * Sends event cancelled email.
   */
  async onEventCancelled(event: IEvent, recipients: IUser[]): Promise<void> {
    const promises = recipients.map((user) => {
      if (!this.shouldSendEmail(user, 'important')) {
        console.log(`[EMAIL] Skipping event-cancelled email for ${user.id} - user preferences`)
        return Promise.resolve()
      }

      return (async () => {
        try {
          await emailService.sendTemplate(
            'event-cancelled',
            {
              recipientName: user.name,
              eventTitle: event.title,
              reason: 'Event has been cancelled',
            },
            { name: user.name, email: user.email },
            user.id
          )
        } catch (error) {
          console.error(`[EMAIL] onEventCancelled failed for user ${user.id}:`, error)
        }
      })()
    })

    await Promise.all(promises)
  }

  /**
   * Sends event reminder email.
   */
  async onEventReminder(event: IEvent, recipients: IUser[], daysUntil: number): Promise<void> {
    const promises = recipients.map((user) => {
      if (!this.shouldSendEmail(user, 'all')) {
        console.log(`[EMAIL] Skipping event-reminder email for ${user.id} - user preferences`)
        return Promise.resolve()
      }

      return (async () => {
        try {
          const eventUrl = `${process.env.APP_URL}/events/${event.id}`
          await emailService.sendTemplate(
            'event-reminder',
            {
              recipientName: user.name,
              eventTitle: event.title,
              eventDate: event.date,
              daysUntil,
              eventUrl,
            },
            { name: user.name, email: user.email },
            user.id
          )
        } catch (error) {
          console.error(`[EMAIL] onEventReminder failed for user ${user.id}:`, error)
        }
      })()
    })

    await Promise.all(promises)
  }

  /**
   * Sends RSVP confirmation email.
   */
  async onRsvpConfirmed(event: IEvent, user: IUser, status: RSVPStatus): Promise<void> {
    if (!this.shouldSendEmail(user, 'all')) {
      console.log(`[EMAIL] Skipping rsvp-confirmation email for ${user.id} - user preferences`)
      return
    }

    try {
      await emailService.sendTemplate(
        'rsvp-confirmation',
        {
          recipientName: user.name,
          eventTitle: event.title,
          rsvpStatus: status,
          eventDate: event.date,
        },
        { name: user.name, email: user.email },
        user.id
      )
    } catch (error) {
      console.error(`[EMAIL] onRsvpConfirmed failed for ${user.id}:`, error)
    }
  }

  /**
   * Sends birthday today greeting email.
   */
  async onBirthdayToday(user: IUser): Promise<void> {
    if (!this.shouldSendEmail(user, 'all')) {
      console.log(`[EMAIL] Skipping birthday-today email for ${user.id} - user preferences`)
      return
    }

    try {
      await emailService.sendTemplate(
        'birthday-today',
        {
          recipientName: user.name,
        },
        { name: user.name, email: user.email },
        user.id
      )
    } catch (error) {
      console.error(`[EMAIL] onBirthdayToday failed for ${user.id}:`, error)
    }
  }

  /**
   * Sends birthday reminder email.
   */
  async onBirthdayReminder(birthdayUser: IUser, notifyUser: IUser, daysUntil: number): Promise<void> {
    if (!this.shouldSendEmail(notifyUser, 'all')) {
      console.log(`[EMAIL] Skipping birthday-reminder email for ${notifyUser.id} - user preferences`)
      return
    }

    try {
      const birthdayDate = birthdayUser.birthday || 'upcoming'
      await emailService.sendTemplate(
        'birthday-reminder',
        {
          recipientName: notifyUser.name,
          birthdayPersonName: birthdayUser.name,
          daysUntil,
          birthdayDate,
        },
        { name: notifyUser.name, email: notifyUser.email },
        notifyUser.id
      )
    } catch (error) {
      console.error(`[EMAIL] onBirthdayReminder failed for ${notifyUser.id}:`, error)
    }
  }

  /**
   * Sends announcement email to multiple recipients.
   */
  async onAnnouncement(
    title: string,
    body: string,
    recipients: IUser[],
    priority: 'normal' | 'important' = 'normal'
  ): Promise<void> {
    const promises = recipients.map((user) => {
      const levelToCheck = priority === 'important' ? 'important' : 'all'
      if (!this.shouldSendEmail(user, levelToCheck)) {
        console.log(`[EMAIL] Skipping announcement email for ${user.id} - user preferences`)
        return Promise.resolve()
      }

      return (async () => {
        try {
          await emailService.sendTemplate(
            'announcement',
            {
              recipientName: user.name,
              announcementTitle: title,
              announcementBody: body,
              priority,
            },
            { name: user.name, email: user.email },
            user.id
          )
        } catch (error) {
          console.error(`[EMAIL] onAnnouncement failed for user ${user.id}:`, error)
        }
      })()
    })

    await Promise.all(promises)
  }

  /**
   * Sends access request notification to all admins.
   */
  async onAccessRequested(request: IAccessRequest): Promise<void> {
    try {
      // Get all admin users
      const { users } = await import('../config/db').then((db) => db.readData())
      const admins = (users || []).filter((user: IUser) => user.role === 'admin')

      if (admins.length === 0) {
        console.log(`[EMAIL] No admin users found to notify about access request ${request.id}`)
        return
      }

      const approvalUrl = `${process.env.APP_URL}/admin/access-requests/${request.id}/approve`
      const rejectionUrl = `${process.env.APP_URL}/admin/access-requests/${request.id}/reject`

      const promises = admins.map((admin: IUser) =>
        (async () => {
          try {
            await emailService.sendTemplate(
              'access-request',
              {
                requesterName: request.name,
                requesterEmail: request.email,
                message: request.message,
                approvalUrl,
                rejectionUrl,
              },
              { name: admin.name, email: admin.email },
              request.id
            )
          } catch (error) {
            console.error(`[EMAIL] onAccessRequested failed to send to admin ${admin.id}:`, error)
          }
        })()
      )

      await Promise.all(promises)
    } catch (error) {
      console.error(`[EMAIL] onAccessRequested failed for ${request.id}:`, error)
    }
  }

  /**
   * Checks if email should be sent based on user notification preferences.
   */
  private shouldSendEmail(user: IUser, messageLevel: 'all' | 'important'): boolean {
    const { notificationPrefs } = user

    // Must have email in channels
    if (!notificationPrefs.channels.includes('email')) {
      return false
    }

    // level: 'none' - never send
    if (notificationPrefs.level === 'none') {
      return false
    }

    // level: 'important' - only send important messages
    if (notificationPrefs.level === 'important' && messageLevel !== 'important') {
      return false
    }

    // level: 'all' - send everything
    return true
  }
}

export const emailDispatcher = new EmailDispatcherService()
