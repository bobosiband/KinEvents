export type WishStatus = 'pending' | 'approved' | 'hidden'

export interface IWish {
  id: string
  recipientUserId: string
  eventId: string
  year: number
  authorId: string
  authorName: string
  message: string
  status: WishStatus
  createdAt: string
  updatedAt: string
  moderatedAt?: string
  deletedAt?: string | null
}
