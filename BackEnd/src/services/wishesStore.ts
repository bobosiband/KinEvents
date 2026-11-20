import { randomUUID } from 'crypto'
import type { IWish, WishStatus } from '../interfaces/wish.interface'

export interface IUpsertWishInput {
  readonly recipientUserId: string
  readonly eventId: string
  readonly year: number
  readonly authorId: string
  readonly authorName: string
  readonly message: string
}

/**
 * In-memory wishes store used while featureFlags.useCollections is off.
 * Replaced by a MongoWishRepository when the flag flips.
 *
 * Invariant: at most one wish per (recipientUserId, year, authorId) —
 * re-submitting edits the existing entry.
 */
class WishesStore {
  private readonly rows: IWish[] = []

  public listApprovedFor(eventId: string): readonly IWish[] {
    return this.rows.filter((w) => w.eventId === eventId && w.status === 'approved' && !w.deletedAt)
  }

  public findById(id: string): IWish | null {
    return this.rows.find((w) => w.id === id) ?? null
  }

  public upsertOwn(input: IUpsertWishInput): IWish {
    const existing = this.rows.find((w) =>
      w.recipientUserId === input.recipientUserId
      && w.year === input.year
      && w.authorId === input.authorId
      && !w.deletedAt,
    )
    const now = new Date().toISOString()
    if (existing) {
      existing.message = input.message
      existing.authorName = input.authorName
      existing.updatedAt = now
      return existing
    }
    const wish: IWish = {
      id: randomUUID(),
      recipientUserId: input.recipientUserId,
      eventId: input.eventId,
      year: input.year,
      authorId: input.authorId,
      authorName: input.authorName,
      message: input.message,
      status: 'approved',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
    this.rows.push(wish)
    return wish
  }

  public moderate(id: string, status: WishStatus): IWish | null {
    const wish = this.findById(id)
    if (!wish) return null
    wish.status = status
    wish.moderatedAt = new Date().toISOString()
    wish.updatedAt = wish.moderatedAt
    return wish
  }

  public resetForTesting(): void {
    this.rows.splice(0, this.rows.length)
  }
}

export const wishesStore: WishesStore = new WishesStore()
