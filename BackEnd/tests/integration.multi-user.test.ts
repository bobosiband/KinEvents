/**
 * Multi-user synchronization test
 * Tests that data consistency works across multiple concurrent requests to different Lambda instances
 * (simulated by making concurrent HTTP requests)
 */

import { randomUUID } from 'crypto'

const INTEGRATION_BASE_URL = process.env.INTEGRATION_BASE_URL
const INTEGRATION_EMAIL = process.env.INTEGRATION_EMAIL || 'admin@kinevents.test'

// Skip tests if INTEGRATION_BASE_URL is not set
const describeIntegration = INTEGRATION_BASE_URL ? describe : describe.skip

describeIntegration('Multi-user synchronization (cross-instance data consistency)', () => {
  jest.setTimeout(60000)

  let adminToken: string
  let userToken: string
  let tempUserId: string
  let tempUserEmail: string
  let createdEventId: string

  beforeAll(async () => {
    if (!INTEGRATION_BASE_URL) {
      throw new Error('INTEGRATION_BASE_URL not set')
    }

    // 1. Log in as admin
    const loginRes = await fetch(`${INTEGRATION_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: INTEGRATION_EMAIL }),
    })
    expect(loginRes.status).toBe(200)
    const loginData = (await loginRes.json()) as { data: { token: string; user: { id: string } } }
    adminToken = loginData.data.token
  })

  it('should create a temporary user and get them approved', async () => {
    // Create a request-access for temp user
    tempUserEmail = `temp-${randomUUID()}@kinevents.test`
    const requestAccessRes = await fetch(`${INTEGRATION_BASE_URL}/api/auth/request-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Temp User',
        email: tempUserEmail,
        message: 'Integration test user',
      }),
    })
    expect(requestAccessRes.status).toBe(200)
    const requestData = (await requestAccessRes.json()) as {
      data: { id: string }
    }
    const accessRequestId = requestData.data.id

    // Approve the request
    const approveRes = await fetch(`${INTEGRATION_BASE_URL}/api/auth/approve-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ accessRequestId }),
    })
    expect(approveRes.status).toBe(200)
    const approveData = (await approveRes.json()) as {
      data: { user: { id: string } }
    }
    tempUserId = approveData.data.user.id

    // Log in as the temp user
    const userLoginRes = await fetch(`${INTEGRATION_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: tempUserEmail }),
    })
    expect(userLoginRes.status).toBe(200)
    const userLoginData = (await userLoginRes.json()) as {
      data: { token: string }
    }
    userToken = userLoginData.data.token
  })

  it('should sync data when admin and user make concurrent requests', async () => {
    // 3. Make concurrent requests: Admin creates event, user RSVPs
    const eventPayload = {
      title: 'Concurrent Test Event',
      description: 'Testing multi-user sync',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdBy: 'admin-id', // Will be overridden by handler
    }

    // Both requests happen concurrently
    const [createEventRes, rsvpRes] = await Promise.all([
      // Admin creates event
      fetch(`${INTEGRATION_BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(eventPayload),
      }),
      // Meanwhile, wait a moment then try to RSVP (but we need the event ID first)
      // So we'll structure this differently - just verify the create works first
      fetch(`${INTEGRATION_BASE_URL}/api/events`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }),
    ])

    expect(createEventRes.status).toBe(201)
    const createData = (await createEventRes.json()) as {
      data: { id: string; title: string }
    }
    createdEventId = createData.data.id
    expect(createData.data.title).toBe('Concurrent Test Event')

    // Verify user can see the event immediately (no stale cache)
    expect(rsvpRes.status).toBe(200)
    const eventListData = (await rsvpRes.json()) as {
      data: { id: string; title: string }[]
    }
    const foundEvent = eventListData.data.find((e) => e.id === createdEventId)
    expect(foundEvent).toBeDefined()
    expect(foundEvent?.title).toBe('Concurrent Test Event')
  })

  it('should have both users see the same event data after RSVP', async () => {
    // User RSVPs to the event
    const rsvpRes = await fetch(`${INTEGRATION_BASE_URL}/api/events/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        eventId: createdEventId,
        userId: tempUserId,
        status: 'yes',
      }),
    })
    expect(rsvpRes.status).toBe(200)

    // Both users independently fetch the event
    const [adminFetchRes, userFetchRes] = await Promise.all([
      fetch(`${INTEGRATION_BASE_URL}/api/events/${createdEventId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
      fetch(`${INTEGRATION_BASE_URL}/api/events/${createdEventId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      }),
    ])

    expect(adminFetchRes.status).toBe(200)
    expect(userFetchRes.status).toBe(200)

    const adminData = (await adminFetchRes.json()) as {
      data: { rsvps: Record<string, string> }
    }
    const userData = (await userFetchRes.json()) as {
      data: { rsvps: Record<string, string> }
    }

    // Both should see the same RSVP data
    expect(adminData.data.rsvps[tempUserId]).toBe('yes')
    expect(userData.data.rsvps[tempUserId]).toBe('yes')
    expect(JSON.stringify(adminData.data.rsvps)).toBe(JSON.stringify(userData.data.rsvps))
  })

  afterAll(async () => {
    // Clean up: delete the temp user and event
    if (createdEventId) {
      await fetch(`${INTEGRATION_BASE_URL}/api/events/${createdEventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {})
    }

    if (tempUserId) {
      await fetch(`${INTEGRATION_BASE_URL}/api/users/${tempUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {})
    }
  })
})
