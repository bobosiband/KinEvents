import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import type { IUser } from '../src/interfaces/user.interface'
import { resetDb, seedDb } from './helpers/db.helper'

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only'

const mockMember: IUser = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  name: 'Member',
  email: 'member@example.com',
  role: 'member',
  accessStatus: 'approved',
  capabilities: [],
  notificationPrefs: { level: 'all', channels: ['email'] },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockAdmin: IUser = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'admin',
  accessStatus: 'approved',
  capabilities: ['*'],
  notificationPrefs: { level: 'all', channels: ['email'] },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const createMockRequest = (overrides: any = {}) => ({
  method: 'GET',
  headers: {},
  query: {},
  body: {},
  ...overrides,
}) as any

const createMockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }
  return res as any
}

describe('Chat Handlers', () => {
  beforeEach(() => {
    resetDb()
  })

  it('GET /api/chat/messages requires auth', async () => {
    const handler = require('../api/chat/messages/index').default
    const req = createMockRequest({ method: 'GET', headers: {} })
    const res = createMockResponse()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('GET /api/chat/messages works with token', async () => {
    const handler = require('../api/chat/messages/index').default
    const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
    seedDb({ users: [mockMember] })
    const req = createMockRequest({ method: 'GET', headers: { authorization: `Bearer ${token}` } })
    const res = createMockResponse()
    await handler(req, res)
    expect(res.status).not.toHaveBeenCalledWith(401)
    expect(res.status).toHaveBeenCalledWith(200)
    expect((res.json as any).mock.calls[0][0]).toHaveProperty('data')
  })

  it('POST /api/chat/messages creates message', async () => {
    const handler = require('../api/chat/messages/index').default
    const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
    seedDb({ users: [mockMember] })
    const req = createMockRequest({ method: 'POST', headers: { authorization: `Bearer ${token}` }, body: { content: 'Hello' } })
    const res = createMockResponse()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(201)
    expect((res.json as any).mock.calls[0][0].data.from).toBe(mockMember.id)
  })

  it('POST /api/chat/messages rejects empty content', async () => {
    const handler = require('../api/chat/messages/index').default
    const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
    seedDb({ users: [mockMember] })
    const req = createMockRequest({ method: 'POST', headers: { authorization: `Bearer ${token}` }, body: { content: '   ' } })
    const res = createMockResponse()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('DELETE /api/chat/messages/:id by owner returns 200', async () => {
    const messagesHandler = require('../api/chat/messages/index').default
    const deleteHandler = require('../api/chat/messages/[id]').default
    const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
    seedDb({ users: [mockMember] })

    // create message
    const createReq = createMockRequest({ method: 'POST', headers: { authorization: `Bearer ${token}` }, body: { content: 'delme' } })
    const createRes = createMockResponse()
    await messagesHandler(createReq, createRes)
    const msg = (createRes.json as any).mock.calls[0][0].data

    const delReq = createMockRequest({ method: 'DELETE', headers: { authorization: `Bearer ${token}` }, query: { id: msg.id } })
    const delRes = createMockResponse()
    await deleteHandler(delReq, delRes)
    expect(delRes.status).toHaveBeenCalledWith(200)
  })

  it('DELETE /api/chat/messages/:id by non-owner member returns 403', async () => {
    const messagesHandler = require('../api/chat/messages/index').default
    const deleteHandler = require('../api/chat/messages/[id]').default
    const tokenOwner = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
    const otherMember = { ...mockMember, id: randomUUID() }
    const tokenOther = jwt.sign(otherMember, JWT_SECRET, { expiresIn: '7d' })
    seedDb({ users: [mockMember, otherMember] })

    const createReq = createMockRequest({ method: 'POST', headers: { authorization: `Bearer ${tokenOwner}` }, body: { content: 'delme2' } })
    const createRes = createMockResponse()
    await messagesHandler(createReq, createRes)
    const msg = (createRes.json as any).mock.calls[0][0].data

    const delReq = createMockRequest({ method: 'DELETE', headers: { authorization: `Bearer ${tokenOther}` }, query: { id: msg.id } })
    const delRes = createMockResponse()
    await deleteHandler(delReq, delRes)
    expect(delRes.status).toHaveBeenCalledWith(403)
  })

  it('DELETE /api/chat/messages/:id by admin returns 200', async () => {
    const messagesHandler = require('../api/chat/messages/index').default
    const deleteHandler = require('../api/chat/messages/[id]').default
    const tokenOwner = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
    const tokenAdmin = jwt.sign(mockAdmin, JWT_SECRET, { expiresIn: '7d' })
    seedDb({ users: [mockMember, mockAdmin] })

    const createReq = createMockRequest({ method: 'POST', headers: { authorization: `Bearer ${tokenOwner}` }, body: { content: 'admindel' } })
    const createRes = createMockResponse()
    await messagesHandler(createReq, createRes)
    const msg = (createRes.json as any).mock.calls[0][0].data

    const delReq = createMockRequest({ method: 'DELETE', headers: { authorization: `Bearer ${tokenAdmin}` }, query: { id: msg.id } })
    const delRes = createMockResponse()
    await deleteHandler(delReq, delRes)
    expect(delRes.status).toHaveBeenCalledWith(200)
  })

  it('POST /api/chat/messages/read marks messages read and GET /api/chat/unread-count returns count', async () => {
    const messagesHandler = require('../api/chat/messages/index').default
    const readHandler = require('../api/chat/messages/read').default
    const unreadHandler = require('../api/chat/unread-count').default
    const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
    const adminToken = jwt.sign(mockAdmin, JWT_SECRET, { expiresIn: '7d' })
    seedDb({ users: [mockMember, mockAdmin] })

    const createReq = createMockRequest({ method: 'POST', headers: { authorization: `Bearer ${token}` }, body: { content: 'r1' } })
    const createRes = createMockResponse()
    await messagesHandler(createReq, createRes)
    const msg = (createRes.json as any).mock.calls[0][0].data

    const unreadReq1 = createMockRequest({ method: 'GET', headers: { authorization: `Bearer ${token}` } })
    const unreadRes1 = createMockResponse()
    await unreadHandler(unreadReq1, unreadRes1)
    expect((unreadRes1.json as any).mock.calls[0][0].data.count).toBe(0)

    const adminCreateReq = createMockRequest({ method: 'POST', headers: { authorization: `Bearer ${adminToken}` }, body: { content: 'admin note' } })
    const adminCreateRes = createMockResponse()
    await messagesHandler(adminCreateReq, adminCreateRes)
    const adminMsg = (adminCreateRes.json as any).mock.calls[0][0].data

    const unreadReqBeforeRead = createMockRequest({ method: 'GET', headers: { authorization: `Bearer ${token}` } })
    const unreadResBeforeRead = createMockResponse()
    await unreadHandler(unreadReqBeforeRead, unreadResBeforeRead)
    expect((unreadResBeforeRead.json as any).mock.calls[0][0].data.count).toBeGreaterThanOrEqual(1)

    const readReq = createMockRequest({ method: 'POST', headers: { authorization: `Bearer ${token}` }, body: { messageIds: [adminMsg.id] } })
    const readRes = createMockResponse()
    await readHandler(readReq, readRes)
    expect(readRes.status).toHaveBeenCalledWith(200)

    const unreadReq2 = createMockRequest({ method: 'GET', headers: { authorization: `Bearer ${token}` } })
    const unreadRes2 = createMockResponse()
    await unreadHandler(unreadReq2, unreadRes2)
    expect((unreadRes2.json as any).mock.calls[0][0].data.count).toBe(0)
  })
})
