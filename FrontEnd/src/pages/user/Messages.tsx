import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { useUsers } from '@/features/users/hooks/useUsers'
import { ChatHeader } from '@/features/chat/components/ChatHeader'
import { ChatInput } from '@/features/chat/components/ChatInput'
import { ChatScrollArea } from '@/features/chat/components/ChatScrollArea'
import {
  useDeleteMessage,
  useMarkRead,
  useMessages,
  useNewMessages,
  useSendMessage,
} from '@/features/chat/hooks/useChat'
import type { Message } from '@/features/chat/types/chat.types'

export function Messages() {
  const { user } = useAuth()
  const { data: users = [] } = useUsers()

  const currentUserId = user?.id || ''
  const currentUserRole = user?.role || 'member'

  const messagesQuery = useMessages()
  const markRead = useMarkRead()
  const deleteMutation = useDeleteMessage()
  const sendMutation = useSendMessage(currentUserId)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const markReadDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastMarkedUnreadSignatureRef = useRef('')
  const markReadPendingRef = useRef(markRead.isPending)

  useEffect(() => {
    markReadPendingRef.current = markRead.isPending
  }, [markRead.isPending])

  const baseMessages = useMemo(() => {
    return (messagesQuery.data?.pages ?? []).flatMap((page) => page.messages)
  }, [messagesQuery.data])

  const newestCursor = baseMessages.length
    ? baseMessages
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        [baseMessages.length - 1]?.createdAt
    : undefined

  const newMessagesQuery = useNewMessages(newestCursor, pageVisible)

  const flatMessages = useMemo(() => {
    const merged = [...baseMessages, ...(newMessagesQuery.data ?? [])]
    const uniqueById = new Map<string, Message>()

    merged.forEach((message) => {
      uniqueById.set(message.id, message)
    })

    return Array.from(uniqueById.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }, [baseMessages, newMessagesQuery.data])

  const usersById = useMemo(() => {
    return new Map(users.map(member => [member.id, member]))
  }, [users])

  const unreadIds = useMemo(() => {
    if (!currentUserId) return []
    return Array.from(new Set(
      flatMessages
      .filter(message => !message.deletedAt && !message.readBy.includes(currentUserId))
        .filter(message => !message.id.startsWith('temp-'))
        .map(message => message.id)
    ))
  }, [flatMessages, currentUserId])

  const markUnreadAsRead = useCallback(() => {
    if (document.hidden || !pageVisible) return

    const realUnreadIds = unreadIds.filter((id) => !id.startsWith('temp-'))
    if (!realUnreadIds.length) {
      lastMarkedUnreadSignatureRef.current = ''
      return
    }

    const signature = [...realUnreadIds].sort().join('|')
    if (signature === lastMarkedUnreadSignatureRef.current) return
    if (markReadPendingRef.current) return

    if (markReadDebounceRef.current) {
      clearTimeout(markReadDebounceRef.current)
    }

    markReadDebounceRef.current = setTimeout(() => {
      if (document.hidden || !pageVisible) return

      lastMarkedUnreadSignatureRef.current = signature
      markRead.mutate(realUnreadIds, {
        onError: () => {
          lastMarkedUnreadSignatureRef.current = ''
        },
      })
    }, 500)
  }, [markRead, pageVisible, unreadIds])

  useEffect(() => {
    markUnreadAsRead()
  }, [flatMessages.length, markUnreadAsRead])

  useEffect(() => {
    if (pageVisible) {
      markUnreadAsRead()
    }
  }, [markUnreadAsRead, pageVisible])

  useEffect(() => {
    const handleFocus = () => markUnreadAsRead()
    const handleVisibility = () => setPageVisible(!document.hidden)

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [markUnreadAsRead])

  useEffect(() => {
    return () => {
      if (markReadDebounceRef.current) {
        clearTimeout(markReadDebounceRef.current)
      }
    }
  }, [])

  const handleSend = useCallback(async (content: string) => {
    await sendMutation.mutateAsync({ content })
  }, [sendMutation])

  const handleDelete = useCallback((id: string) => {
    if (!id || id.startsWith('temp-')) {
      toast.error('This message cannot be deleted yet')
      return
    }

    const confirmed = window.confirm('Delete this message?')
    if (!confirmed) return

    deleteMutation.mutate(id, {
      onError: (error) => {
        toast.error(error.message || 'Failed to delete message')
      },
    })
  }, [deleteMutation])

  if (!user) return null

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)] max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Family Chat</h1>

      <div className="bg-card rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden border border-border">
        <ChatHeader members={users} />

        <ChatScrollArea
          className="flex-1"
          messages={flatMessages}
          usersById={usersById}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isLoading={messagesQuery.isLoading}
          isError={messagesQuery.isError}
          error={messagesQuery.isError ? (messagesQuery.error as Error) : null}
          onRetry={() => {
            void messagesQuery.refetch()
          }}
          hasNextPage={Boolean(messagesQuery.hasNextPage)}
          isFetchingNextPage={messagesQuery.isFetchingNextPage}
          onLoadOlder={() => {
            void messagesQuery.fetchNextPage()
          }}
          onDeleteMessage={handleDelete}
        />

        <ChatInput
          onSend={handleSend}
          isSending={sendMutation.isPending}
        />
      </div>
    </div>
  )
}
