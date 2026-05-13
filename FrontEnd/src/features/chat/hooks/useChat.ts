import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  deleteMessage,
  getMessages,
  getUnreadCount,
  markMessagesRead,
  sendMessage,
} from '../api/chat.api'
import type { Message, MessagesPage } from '../types/chat.types'

const CHAT_MESSAGES_KEY = ['chat-messages'] as const
const CHAT_UNREAD_KEY = ['chat-unread'] as const

export function useMessages(limit = 30) {
  return useInfiniteQuery<MessagesPage>({
    queryKey: CHAT_MESSAGES_KEY,
    queryFn: ({ pageParam }) =>
      getMessages({
        limit,
        cursor: pageParam as string | undefined,
        direction: 'before',
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      const allMessages = allPages
        .flatMap((page) => page.messages)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      return allMessages[0]?.createdAt
    },
    initialPageParam: undefined,
  })
}

export function useNewMessages(cursor: string | undefined, enabled = true) {
  const queryClient = useQueryClient()
  const query = useQuery<MessagesPage>({
    queryKey: ['chat-new', cursor],
    queryFn: () => getMessages({ direction: 'after', cursor }),
    enabled: Boolean(cursor) && enabled,
    refetchInterval: enabled ? 5000 : false,
  })

  useEffect(() => {
    const data = query.data
    if (!data?.messages.length) return

    queryClient.setQueryData<InfiniteData<MessagesPage, unknown>>(CHAT_MESSAGES_KEY, (old) => {
      if (!old) {
        return {
          pages: [{ messages: data.messages.filter((message) => !message.deletedAt), hasMore: false }],
          pageParams: [undefined],
        }
      }

      const messageMap = new Map<string, Message>()

      old.pages.forEach((page) => {
        page.messages.forEach((message) => {
          messageMap.set(message.id, message)
        })
      })

      data.messages.forEach((message) => {
        messageMap.set(message.id, message)
      })

      const merged = Array.from(messageMap.values()).filter((message) => !message.deletedAt)
      const firstPage = old.pages[0] ?? { messages: [], hasMore: false }

      return {
        ...old,
        pages: [{ ...firstPage, messages: merged }, ...old.pages.slice(1)],
      }
    })
  }, [query.data, queryClient])

  return {
    ...query,
    data: query.data?.messages ?? [],
  }
}

export function useUnreadCount() {
  return useQuery({
    queryKey: CHAT_UNREAD_KEY,
    queryFn: getUnreadCount,
    refetchInterval: 10000,
    select: (data) => data.count,
  })
}

export function useSendMessage(currentUserId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: CHAT_MESSAGES_KEY })

      const previous = queryClient.getQueryData<InfiniteData<MessagesPage, unknown>>(CHAT_MESSAGES_KEY)
      const nowIso = new Date().toISOString()

      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        from: currentUserId,
        content: payload.content,
        createdAt: nowIso,
        updatedAt: nowIso,
        readBy: [currentUserId],
        type: 'text',
      }

      queryClient.setQueryData<InfiniteData<MessagesPage, unknown>>(CHAT_MESSAGES_KEY, (old) => {
        if (!old) {
          return {
            pages: [{ messages: [tempMessage], hasMore: false }],
            pageParams: [undefined],
          }
        }

        const firstPage = old.pages[0] ?? { messages: [], hasMore: false }

        return {
          ...old,
          pages: [{ ...firstPage, messages: [...firstPage.messages, tempMessage] }, ...old.pages.slice(1)],
        }
      })

      return { previous }
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData<InfiniteData<MessagesPage, unknown>>(CHAT_MESSAGES_KEY, (old) => {
        if (!old) {
          return {
            pages: [{ messages: [newMessage], hasMore: false }],
            pageParams: [undefined],
          }
        }

        return {
          ...old,
          pages: old.pages.map((page, index) => {
            if (index !== 0) return page

            const withoutTemp = page.messages.filter((message) => !message.id.startsWith('temp-'))
            return { ...page, messages: [...withoutTemp, newMessage] }
          }),
        }
      })
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CHAT_MESSAGES_KEY, context.previous)
      }
      toast.error('Failed to send message')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_KEY })
      queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_KEY })
    },
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markMessagesRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_KEY }),
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMessage,
    onMutate: async (messageId: string) => {
      await queryClient.cancelQueries({ queryKey: CHAT_MESSAGES_KEY })

      const previous = queryClient.getQueryData<InfiniteData<MessagesPage, unknown>>(CHAT_MESSAGES_KEY)

      queryClient.setQueryData<InfiniteData<MessagesPage, unknown>>(CHAT_MESSAGES_KEY, (old) => {
        if (!old) return old

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.filter((message) => message.id !== messageId),
          })),
        }
      })

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CHAT_MESSAGES_KEY, context.previous)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_KEY })
      queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_KEY })
    },
  })
}
