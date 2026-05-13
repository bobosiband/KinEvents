import { v4 as uuid } from 'uuid'

import { persistData, readData } from '../config/db'
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
    const capped = Math.min(this.MAX_LIMIT, Math.max(1, Math.floor(limit)))

    const db = await readData()
    const all = (db.messages ?? []).filter((m) => !m.deletedAt)

    // Helper to compare ISO strings
    const cmp = (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime()
    const indexMap = new Map<string, number>((db.messages ?? []).map((m, i) => [m.id, i]))
    const tieBreak = (a: IMessage, b: IMessage) => (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0)

    if (direction === 'after') {
      // Newer messages since cursor
      let items = all
      if (cursor) items = items.filter((m) => cmp(m.createdAt, cursor) > 0)
      items = items.sort((a, b) => {
        const d = cmp(a.createdAt, b.createdAt)
        return d !== 0 ? d : tieBreak(a, b)
      }) // oldest -> newest
      const slice = items.slice(0, capped)
      const hasMore = items.length > slice.length
      return { messages: slice, hasMore }
    }

    // direction === 'before' (default) - fetch older history before cursor
    let items = all
    if (cursor) items = items.filter((m) => cmp(m.createdAt, cursor) < 0)
    // sort newest -> oldest, take page, then reverse to oldest->newest for display
    items = items.sort((a, b) => {
      const d = cmp(b.createdAt, a.createdAt)
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

    const db = await readData()
    db.messages = db.messages ?? []
    db.messages.push(msg)
    await persistData()
    return msg
  }

  async markAsRead(messageIds: string[], userId: string): Promise<number> {
    if (!Array.isArray(messageIds) || messageIds.length === 0) return 0
    const db = await readData()
    let updated = 0
    db.messages = db.messages ?? []

    for (const m of db.messages) {
      if (m.deletedAt) continue
      if (!messageIds.includes(m.id)) continue
      if (!m.readBy.includes(userId)) {
        m.readBy.push(userId)
        updated += 1
      }
    }

    if (updated > 0) await persistData()
    return updated
  }

  async deleteMessage(
    messageId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<IMessage | null> {
    const db = await readData()
    db.messages = db.messages ?? []
    const msg = db.messages.find((m) => m.id === messageId)
    if (!msg) return null
    if (msg.deletedAt) return null

    const isAdmin = requestingUserRole === USER_ROLES.ADMIN
    const isOwner = requestingUserId === msg.from
    if (!isAdmin && !isOwner) {
      throw new Error('Forbidden')
    }

    msg.deletedAt = new Date().toISOString()
    await persistData()
    return msg
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
