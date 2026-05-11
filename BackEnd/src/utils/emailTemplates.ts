import type { NotificationType } from '../interfaces/notification.interface'

interface TemplateContext {
  userName?: string
  eventTitle?: string
  eventDate?: string
  daysUntil?: string
  birthdayName?: string
  appUrl: string
}

export function buildEmailContent(
  type: NotificationType,
  ctx: TemplateContext
): { subject: string; text: string; html: string } {
  switch (type) {
    case 'event_created':
      return {
        subject: `New event: ${ctx.eventTitle}`,
        text: `A new family event "${ctx.eventTitle}" has been created. View it at ${ctx.appUrl}/events`,
        html: `<h2>New Family Event 🎉</h2><p><strong>${ctx.eventTitle}</strong> has been added.</p><p><a href="${ctx.appUrl}/events">View Events</a></p>`,
      }
    case 'event_updated':
      return {
        subject: `Event updated: ${ctx.eventTitle}`,
        text: `The event "${ctx.eventTitle}" has been updated. Check it out at ${ctx.appUrl}/events`,
        html: `<h2>Event Updated 📝</h2><p><strong>${ctx.eventTitle}</strong> has been updated.</p><p><a href="${ctx.appUrl}/events">View Events</a></p>`,
      }
    case 'event_reminder':
      return {
        subject: `Reminder: ${ctx.eventTitle} in ${ctx.daysUntil} day(s)`,
        text: `Don't forget! "${ctx.eventTitle}" is coming up in ${ctx.daysUntil} day(s).`,
        html: `<h2>Event Reminder ⏰</h2><p><strong>${ctx.eventTitle}</strong> is in <strong>${ctx.daysUntil} day(s)</strong>.</p><p><a href="${ctx.appUrl}/events">View Events</a></p>`,
      }
    case 'birthday_reminder':
      return {
        subject: `${ctx.birthdayName}'s birthday in ${ctx.daysUntil} day(s)`,
        text: `${ctx.birthdayName}'s birthday is coming up in ${ctx.daysUntil} day(s)!`,
        html: `<h2>Birthday Coming Up 🎂</h2><p><strong>${ctx.birthdayName}</strong>'s birthday is in <strong>${ctx.daysUntil} day(s)</strong>!</p>`,
      }
    case 'birthday_today':
      return {
        subject: `🎉 It's ${ctx.birthdayName}'s birthday today!`,
        text: `Today is ${ctx.birthdayName}'s birthday! Don't forget to wish them well.`,
        html: `<h2>Happy Birthday! 🎉</h2><p>Today is <strong>${ctx.birthdayName}</strong>'s birthday!</p>`,
      }
    case 'access_approved':
      return {
        subject: 'Your KinEvents access has been approved',
        text: `Welcome to KinEvents! Your access has been approved. Sign in at ${ctx.appUrl}/login`,
        html: `<h2>Welcome to KinEvents! 🏠</h2><p>Your access has been approved.</p><p><a href="${ctx.appUrl}/login">Sign In Now</a></p>`,
      }
    case 'access_rejected':
      return {
        subject: 'KinEvents access request update',
        text: 'Unfortunately your access request was not approved at this time.',
        html: `<h2>Access Request Update</h2><p>Unfortunately your access request was not approved at this time.</p>`,
      }
    default:
      return {
        subject: 'KinEvents notification',
        text: 'You have a new notification from KinEvents.',
        html: '<p>You have a new notification from KinEvents.</p>',
      }
  }
}
