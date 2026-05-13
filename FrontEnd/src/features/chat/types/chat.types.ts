export interface Message {
  id: string
  from: string
  content: string
  createdAt: string
  updatedAt: string
  readBy: string[]
  deletedAt?: string
  type: 'text'
}

export interface MessagesPage {
  messages: Message[]
  hasMore: boolean
}

export interface SendMessagePayload {
  content: string
}
