import { resetDb, seedDb } from './helpers/db.helper'
import { getData } from '../src/config/db'
import { authService } from '../src/services/auth.service'
import { eventService } from '../src/services/event.service'
import { birthdayService } from '../src/services/birthday.service'
import { emailService } from '../src/services/email.service'
import { notificationService } from '../src/services/notification.service'

describe('Bugfix regressions', () => {
  beforeEach(() => resetDb())

  test('BUG-01: approveAccess uses emailDispatcher only (no duplicate raw send)', async () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'A' } as any
    getData().users.push(user)

    // spy on emailService.send and emailDispatcher methods
    const sendSpy = jest.spyOn(emailService, 'send')
    const dispatcherModule = require('../src/services/email-dispatcher.service')
    const accessApprovedSpy = jest.spyOn(dispatcherModule.emailDispatcher, 'onAccessApproved')
    const welcomeSpy = jest.spyOn(dispatcherModule.emailDispatcher, 'onWelcome')

    // Create an access request first, then approve it
    const request = await authService.requestAccess({ name: user.name, email: user.email })
    await authService.approveAccess(request.id)

    expect(accessApprovedSpy).toHaveBeenCalled()
    // emailService.send should not be called directly
    expect(sendSpy).not.toHaveBeenCalled()

    sendSpy.mockRestore()
    accessApprovedSpy.mockRestore()
    welcomeSpy.mockRestore()
  })

  test('BUG-02: generateBirthdayEvents does not email everyone (uses silent events)', async () => {
    const birthdayUser = { id: 'b1', email: 'b@b.com', name: 'B' } as any
    getData().users.push(birthdayUser)

    // spy on email dispatcher method that would be used for event-created emails
    const disp = require('../src/services/email-dispatcher.service')
    const dspSpy = jest.spyOn(disp.emailDispatcher, 'onEventCreated')

    // call with default/current year (number) to match service signature
    await birthdayService.generateBirthdayEvents()

    // no dispatch should be triggered for generated events
    expect(dspSpy).not.toHaveBeenCalled()

    dspSpy.mockRestore()
  })

  test('BUG-03: setRsvp issues rsvp_received notifications', async () => {
    const creator = { id: 'c1', email: 'c@example.com', name: 'C', accessStatus: 'approved', notificationPrefs: { level: 'all', channels: ['email'] } } as any
    const guest = { id: 'g1', email: 'g@example.com', name: 'G', accessStatus: 'approved', notificationPrefs: { level: 'all', channels: ['email'] } } as any
    getData().users.push(creator, guest)

    const event = await eventService.createEvent({
      title: 'Party', startsAt: new Date().toISOString(), createdBy: creator.id,
    } as any)

    const notifySpy = jest.spyOn(notificationService, 'createNotification')

    await eventService.setRsvp(event.id, guest.id, 'yes')

    expect(notifySpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'rsvp_received' }))

    notifySpy.mockRestore()
  })

  test('BUG-05: emailService.send logs skipped in test mode', async () => {
    process.env.NODE_ENV = 'test'
    const logBefore = getData().emailLogs.length
    const res = await emailService.send(
      { to: { email: 'x@y.com', name: 'x' } as any, subject: 's', html: '<p>a</p>' } as any,
      { templateName: 'test_template' as any, recipientId: 'test-recipient' }
    )
    expect(res).toBe(true)
    expect(getData().emailLogs.length).toBe(logBefore + 1)
    const last = getData().emailLogs[getData().emailLogs.length - 1]
    expect(last.status).toBe('skipped')
    process.env.NODE_ENV = undefined
  })

  test('BUG-06: birthday reminders daysUntil calculation is stable across time components', async () => {
    // ensure no crash and that reminders run deterministically
    const b = { id: 'bb', email: 'bb@b.com', name: 'BB', birthday: '2000-01-01', accessStatus: 'approved', notificationPrefs: { level: 'all', channels: ['email'] } } as any
    getData().users.push(b)

    // call with two dates that differ in time components but same day
    const d1 = new Date(Date.UTC(2023, 0, 1, 0, 0, 0))
    const d2 = new Date(Date.UTC(2023, 0, 1, 23, 59, 59))

    await birthdayService.generateBirthdayReminders(7, d1)
    const logs1 = getData().notifications.slice()
    // reset
    getData().notifications = []
    await birthdayService.generateBirthdayReminders(7, d2)
    const logs2 = getData().notifications.slice()

    expect(logs1.length).toBe(logs2.length)
  })

  test('BUG-07: PATCH /api/users/:id merges notificationPrefs and sets phoneVerified false when phone changed', async () => {
    // Using service directly to simulate update
    const user = { id: 'u7', email: 'u7@example.com', name: 'U7', accessStatus: 'approved', notificationPrefs: { level: 'mentions', channels: ['email'] }, phoneVerified: true } as any
    getData().users.push(user)

    const jwt = require('jsonwebtoken')
    const token = jwt.sign(user, process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only')
    const patched = await require('../api/users/[id]').default(
      { method: 'PATCH', query: { id: user.id }, body: { phone: '+441234567890', notificationPrefs: { channels: ['email'] } }, headers: { authorization: `Bearer ${token}` } } as any,
      { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any
    )
    // reload user
    const u = getData().users.find((x: any) => x.id === user.id)
    expect(u).toBeDefined()
    expect(u!.notificationPrefs.level).toBe('mentions')
    expect(u!.notificationPrefs.channels).toContain('email')
    expect(u!.phoneVerified).toBe(false)
  })
})
