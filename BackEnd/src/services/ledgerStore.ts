import { randomUUID } from 'crypto'
import type { ILedgerEntry, LedgerEntryType } from '../interfaces/ledger.interface'

export interface IPostEntryInput {
  readonly entryType: LedgerEntryType
  readonly amountCents: number
  readonly currency: string
  readonly memo: string
  readonly postedBy: string
  readonly sourceId?: string
  readonly giftPoolId?: string
  readonly eventId?: string
  readonly payerId?: string
  readonly payeeId?: string
  readonly reversesEntryId?: string
}

/**
 * Append-only ledger. The invariant is: once posted, an entry is never
 * updated or removed. Corrections are new entries with reversesEntryId
 * pointing at the original.
 *
 * Mongo repository backing lands with useCollections — the shape is the
 * same, the storage switches.
 */
class LedgerStore {
  private readonly entries: ILedgerEntry[] = []

  public post(input: IPostEntryInput): ILedgerEntry {
    const now = new Date().toISOString()
    const entry: ILedgerEntry = {
      id: randomUUID(),
      entryType: input.entryType,
      sourceId: input.sourceId,
      giftPoolId: input.giftPoolId,
      eventId: input.eventId,
      payerId: input.payerId,
      payeeId: input.payeeId,
      amountCents: input.amountCents,
      currency: input.currency,
      memo: input.memo,
      postedAt: now,
      postedBy: input.postedBy,
      reversesEntryId: input.reversesEntryId,
      createdAt: now,
    }
    this.entries.push(entry)
    return entry
  }

  public listForUser(userId: string): readonly ILedgerEntry[] {
    return this.entries.filter((e) => e.payerId === userId || e.payeeId === userId)
  }

  public listAll(): readonly ILedgerEntry[] {
    return [...this.entries]
  }

  public resetForTesting(): void {
    this.entries.splice(0, this.entries.length)
  }
}

export const ledgerStore: LedgerStore = new LedgerStore()
