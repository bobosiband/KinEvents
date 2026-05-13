import { randomUUID } from 'crypto'

import { messageService } from '../src/services/message.service'
import { resetDb, seedDb } from './helpers/db.helper'

describe('Message Service', () => {
  beforeEach(() => {
    resetDb()
  })

  describe('createMessage', () => {
    it('creates a message successfully', async () => {
      const from = randomUUID()
      const msg = await messageService.createMessage({ from, content: ' Hello world ' })
      expect(msg.id).toBeTruthy()
      expect(msg.from).toBe(from)
      expect(msg.content).toBe('Hello world')
      expect(msg.type).toBe('text')
    })

    it('throws on empty content', async () => {
      await expect(messageService.createMessage({ from: randomUUID(), content: '   ' })).rejects.toThrow()
    })

    it('throws on content > 2000 chars', async () => {
      const long = 'a'.repeat(2001)
      await expect(messageService.createMessage({ from: randomUUID(), content: long })).rejects.toThrow()
    })

    it('serializes concurrent creates without losing messages', async () => {
      const userA = randomUUID()
      const userB = randomUUID()

      const [msgA, msgB] = await Promise.all([
        messageService.createMessage({ from: userA, content: 'concurrent-a' }),
        messageService.createMessage({ from: userB, content: 'concurrent-b' }),
      ])

      expect(msgA.id).toBeTruthy()
      expect(msgB.id).toBeTruthy()

      const list = await messageService.listMessages({ limit: 10 })
      expect(list.messages.map((message) => message.content)).toEqual(expect.arrayContaining(['concurrent-a', 'concurrent-b']))
    })
  })

  describe('listMessages', () => {
    it('returns messages excluding deleted and respects limit', async () => {
      const from = randomUUID()
      // seed 5 messages
      const msgs = [] as any[]
      for (let i = 0; i < 5; i++) {
        msgs.push(await messageService.createMessage({ from, content: `m${i}` }))
      }

      // soft-delete one directly via seed
      const dbSeed = {
        messages: msgs.map((m, idx) => ({ ...m, deletedAt: idx === 2 ? new Date().toISOString() : undefined })),
      }
      seedDb(dbSeed)

      const res = await messageService.listMessages({ limit: 10 })
      expect(res.messages.length).toBe(4)
      // ascending order
      expect(res.messages[0].content).toBe('m0')
    })

    it('paginates with cursor before correctly', async () => {
      const from = randomUUID()
      const created: any[] = []
      for (let i = 0; i < 10; i++) {
        created.push(await messageService.createMessage({ from, content: `x${i}` }))
      }

      // fetch first page (default before) with limit 3 without cursor -> newest 3 -> then returned asc
      const first = await messageService.listMessages({ limit: 3 })
      expect(first.messages.length).toBe(3)
      // cursor = createdAt of first message in page (oldest in returned page)
      const cursor = first.messages[0].createdAt

      const older = await messageService.listMessages({ limit: 3, cursor, direction: 'before' })
      // older messages should be the next page older than cursor
      expect(older.messages.length).toBe(3)
    })
  })

  describe('markAsRead and getUnreadCount', () => {
    it('marks read and does not duplicate readBy entries', async () => {
      const from = randomUUID()
      const m1 = await messageService.createMessage({ from, content: 'a' })
      const m2 = await messageService.createMessage({ from, content: 'b' })
      const user = randomUUID()

      const updated = await messageService.markAsRead([m1.id, m2.id], user)
      expect(updated).toBe(2)

      const updatedAgain = await messageService.markAsRead([m1.id], user)
      expect(updatedAgain).toBe(0)

      const count = await messageService.getUnreadCount(user)
      expect(count).toBe(0)
    })

    it('concurrent markAsRead from two users both succeed without data loss', async () => {
      const owner = randomUUID()
      const userA = randomUUID()
      const userB = randomUUID()

      const msg = await messageService.createMessage({ from: owner, content: 'concurrent read test' })

      const [countA, countB] = await Promise.all([
        messageService.markAsRead([msg.id], userA),
        messageService.markAsRead([msg.id], userB),
      ])

      expect(countA + countB).toBeGreaterThanOrEqual(1)

      const list = await messageService.listMessages({ limit: 10 })
      const found = list.messages.find((message) => message.id === msg.id)
      expect(found).toBeDefined()
      expect(found!.readBy).toContain(userA)
      expect(found!.readBy).toContain(userB)
      expect(found!.readBy.filter((id) => id === userA)).toHaveLength(1)
      expect(found!.readBy.filter((id) => id === userB)).toHaveLength(1)
    })

    it('does not count a sender’s own messages as unread', async () => {
      const sender = randomUUID()

      await messageService.createMessage({ from: sender, content: 'sender message' })

      const count = await messageService.getUnreadCount(sender)
      expect(count).toBe(0)
    })

    it('handles concurrent read and delete mutations safely', async () => {
      const owner = randomUUID()
      const readerA = randomUUID()
      const readerB = randomUUID()

      const first = await messageService.createMessage({ from: owner, content: 'race-a' })
      const second = await messageService.createMessage({ from: owner, content: 'race-b' })

      await expect(
        Promise.all([
          messageService.markAsRead([first.id, second.id, 'temp-1', 'missing-id'], readerA),
          messageService.deleteMessage(first.id, owner, 'member'),
        ])
      ).resolves.toBeDefined()

      await expect(
        Promise.all([
          messageService.markAsRead([first.id, second.id], readerB),
          messageService.markAsRead([first.id], readerA),
        ])
      ).resolves.toBeDefined()

      const dbState = await messageService.listMessages({ limit: 10 })
      expect(dbState.messages.length).toBeGreaterThanOrEqual(1)
      expect(dbState.messages.every((message) => Array.isArray(message.readBy))).toBe(true)
      expect(dbState.messages.some((message) => message.id === second.id)).toBe(true)
    })
  })

  describe('deleteMessage', () => {
    it('owner can delete their message', async () => {
      const owner = randomUUID()
      const msg = await messageService.createMessage({ from: owner, content: 'to delete' })
      const res = await messageService.deleteMessage(msg.id, owner, 'member')
      expect(res).not.toBeNull()
      const list = await messageService.listMessages({ limit: 10 })
      expect(list.messages.find((m) => m.id === msg.id)).toBeUndefined()
    })

    it('admin can delete others message', async () => {
      const owner = randomUUID()
      const msg = await messageService.createMessage({ from: owner, content: 'admin delete' })
      const res = await messageService.deleteMessage(msg.id, randomUUID(), 'admin')
      expect(res).not.toBeNull()
    })

    it('non-owner non-admin cannot delete', async () => {
      const owner = randomUUID()
      const msg = await messageService.createMessage({ from: owner, content: 'forbidden' })
      await expect(
        messageService.deleteMessage(msg.id, randomUUID(), 'member')
      ).rejects.toThrow('Forbidden')
    })
  })
})
