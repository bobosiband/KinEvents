export type LedgerEntryType = 'contribution' | 'disbursement' | 'adjustment'

export interface ILedgerEntry {
  readonly id: string
  readonly entryType: LedgerEntryType
  readonly sourceId?: string
  readonly giftPoolId?: string
  readonly eventId?: string
  readonly payerId?: string
  readonly payeeId?: string
  readonly amountCents: number
  readonly currency: string
  readonly memo: string
  readonly postedAt: string
  readonly postedBy: string
  readonly reversesEntryId?: string
  readonly createdAt: string
}
