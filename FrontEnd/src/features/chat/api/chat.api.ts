import { deleteData, getData, postData } from '@/services/api/apiClient'
import { ENDPOINTS } from '@/services/api/endpoints'
import type { Message, MessagesPage, SendMessagePayload } from '../types/chat.types'

export function getMessages(params?: {
  limit?: number
  cursor?: string
  direction?: 'before' | 'after'
}): Promise<MessagesPage> {
  return getData<MessagesPage>(ENDPOINTS.CHAT_MESSAGES, params as Record<string, string | number | boolean>)
}

export function sendMessage(payload: SendMessagePayload): Promise<Message> {
  return postData<Message, SendMessagePayload>(ENDPOINTS.CHAT_MESSAGES, payload)
}

export function markMessagesRead(messageIds: string[]): Promise<{ updated: number }> {
  return postData<{ updated: number }, { messageIds: string[] }>(
    ENDPOINTS.CHAT_MESSAGES_READ,
    { messageIds },
  )
}

export function getUnreadCount(): Promise<{ count: number }> {
  return getData<{ count: number }>(ENDPOINTS.CHAT_UNREAD_COUNT)
}

export function deleteMessage(id: string): Promise<Message> {
  return deleteData<Message>(ENDPOINTS.CHAT_MESSAGE_DELETE(id))
}
