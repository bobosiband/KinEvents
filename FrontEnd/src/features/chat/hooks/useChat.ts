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

export function useNewMessages(cursor: string | undefined) {
  const queryClient = useQueryClient()
  const query = useQuery<MessagesPage>({
    queryKey: ['chat-new', cursor],
    queryFn: () => getMessages({ direction: 'after', cursor }),
    enabled: Boolean(cursor),
    refetchInterval: 5000,
  })

  useEffect(() => {
    const data = query.data
    if (!data?.messages.length) return

    queryClient.setQueryData<InfiniteData<MessagesPage, unknown>>(CHAT_MESSAGES_KEY, (old) => {
      if (!old) {
        return {
          pages: [{ messages: data.messages, hasMore: false }],
          pageParams: [undefined],
        }
      }

      const knownIds = new Set(old.pages.flatMap((page) => page.messages.map((message) => message.id)))
      const incoming = data.messages.filter((message) => !knownIds.has(message.id))
      if (!incoming.length) return old

      const firstPage = old.pages[0] ?? { messages: [], hasMore: false }

      return {
        ...old,
        pages: [{ ...firstPage, messages: [...firstPage.messages, ...incoming] }, ...old.pages.slice(1)],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_KEY })
      queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_KEY })
    },
  })
}
