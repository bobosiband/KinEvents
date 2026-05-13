export interface IMessage {
  id: string
  from: string
  content: string
  createdAt: string
  updatedAt: string
  readBy: string[]
  deletedAt?: string
  type: 'text'
}
