import { v4 as uuid } from 'uuid'

import { mutateData, readData } from '../config/db'
import { USER_ROLES } from '../constants/roles'
import type { IMessage } from '../interfaces/message.interface'

class MessageService {
  private MAX_LIMIT = 50
  private DEFAULT_LIMIT = 30
  private seq = 0

  async listMessages(options: {
    limit?: number
    cursor?: string
    direction?: 'before' | 'after'
  }): Promise<{ messages: IMessage[]; hasMore: boolean }> {
    const { limit = this.DEFAULT_LIMIT, cursor, direction = 'before' } = options || {}
    const safeLimit = Number.isFinite(limit) ? limit : this.DEFAULT_LIMIT
    const capped = Math.min(this.MAX_LIMIT, Math.max(1, Math.floor(safeLimit)))

    const db = await readData()
    const all = (db.messages ?? []).filter((m) => !m.deletedAt)

    const getTime = (value: string) => {
      const parsed = Date.parse(value)
      return Number.isFinite(parsed) ? parsed : null
    }

    const compareAscending = (left: IMessage, right: IMessage) => {
      const leftTime = getTime(left.createdAt)
      const rightTime = getTime(right.createdAt)

      if (leftTime === null && rightTime === null) return 0
      if (leftTime === null) return 1
      if (rightTime === null) return -1

      const diff = leftTime - rightTime
      return diff !== 0 ? diff : 0
    }

    const compareDescending = (left: IMessage, right: IMessage) => {
      const leftTime = getTime(left.createdAt)
      const rightTime = getTime(right.createdAt)

      if (leftTime === null && rightTime === null) return 0
      if (leftTime === null) return 1
      if (rightTime === null) return -1

      const diff = rightTime - leftTime
      return diff !== 0 ? diff : 0
    }

    const cursorTime = cursor ? getTime(cursor) : null
    const indexMap = new Map<string, number>((db.messages ?? []).map((m, i) => [m.id, i]))
    const tieBreak = (a: IMessage, b: IMessage) => (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0)

    if (direction === 'after') {
      // Newer messages since cursor
      let items = all
      if (cursorTime !== null) {
        items = items.filter((m) => {
          const messageTime = getTime(m.createdAt)
          return messageTime !== null && messageTime > cursorTime
        })
      }
      items = items.sort((a, b) => {
        const d = compareAscending(a, b)
        return d !== 0 ? d : tieBreak(a, b)
      }) // oldest -> newest
      const slice = items.slice(0, capped)
      const hasMore = items.length > slice.length
      return { messages: slice, hasMore }
    }

    // direction === 'before' (default) - fetch older history before cursor
    let items = all
    if (cursorTime !== null) {
      items = items.filter((m) => {
        const messageTime = getTime(m.createdAt)
        return messageTime !== null && messageTime < cursorTime
      })
    }
    // sort newest -> oldest, take page, then reverse to oldest->newest for display
    items = items.sort((a, b) => {
      const d = compareDescending(a, b)
      return d !== 0 ? d : tieBreak(b, a)
    })
    const page = items.slice(0, capped)
    const hasMore = items.length > page.length
    const slice = page.reverse()
    return { messages: slice, hasMore }
  }

  async createMessage(input: { from: string; content: string }): Promise<IMessage> {
    const content = (input.content ?? '').trim()
    if (!content) throw new Error('Content is required')
    if (content.length > 2000) throw new Error('Content exceeds maximum length')

    const now = new Date(Date.now() + this.seq++).toISOString()
    const msg: IMessage = {
      id: uuid(),
      from: input.from,
      content,
      createdAt: now,
      updatedAt: now,
      readBy: [input.from],
      type: 'text',
    }

    await mutateData(async (db) => {
      db.messages = db.messages ?? []
      db.messages.push(msg)
    })
    return msg
  }

  async markAsRead(messageIds: string[], userId: string): Promise<number> {
    if (!Array.isArray(messageIds) || messageIds.length === 0) return 0

    const validIds = Array.from(
      new Set(
        messageIds
          .filter((messageId): messageId is string => typeof messageId === 'string')
          .map((messageId) => messageId.trim())
          .filter((messageId) => messageId.length > 0 && !messageId.startsWith('temp-')),
      ),
    )

    if (!validIds.length) return 0

    return mutateData(async (db) => {
      let updated = 0
      db.messages = db.messages ?? []

      for (const message of db.messages) {
        if (message.deletedAt) continue
        if (!validIds.includes(message.id)) continue
        if (!message.readBy.includes(userId)) {
          message.readBy.push(userId)
          updated += 1
        }
      }

      return updated
    })
  }

  async deleteMessage(
    messageId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<IMessage | null> {
    return mutateData(async (db) => {
      db.messages = db.messages ?? []
      const msg = db.messages.find((m) => m.id === messageId)
      if (!msg || msg.deletedAt) return null

      const isAdmin = requestingUserRole === USER_ROLES.ADMIN
      const isOwner = requestingUserId === msg.from
      if (!isAdmin && !isOwner) {
        throw new Error('Forbidden')
      }

      const now = new Date().toISOString()
      msg.deletedAt = now
      msg.updatedAt = now
      return msg
    })
  }

  async getUnreadCount(userId: string): Promise<number> {
    const db = await readData()
    const all = (db.messages ?? []).filter((m) => !m.deletedAt)
    let count = 0
    for (const m of all) {
      if (!m.readBy || !m.readBy.includes(userId)) count += 1
    }
    return count
  }
}

export const messageService = new MessageService()
