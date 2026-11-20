export interface IEventComment {
  id: string
  eventId: string
  authorId: string
  body: string
  parentCommentId?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}
