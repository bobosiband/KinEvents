import { useEffect, useMemo, useRef } from 'react'
import { differenceInMinutes, format, isSameDay } from 'date-fns'
import { ErrorMessage } from '@/components/feedback/ErrorMessage/ErrorMessage'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import type { User } from '@/features/users/types/user.types'
import { ChatMessage } from './ChatMessage'
import type { Message } from '../types/chat.types'

interface ChatScrollAreaProps {
  messages: Message[]
  usersById: Map<string, User>
  currentUserId: string
  currentUserRole: 'admin' | 'manager' | 'member'
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadOlder: () => void
  onDeleteMessage: (id: string) => void
  className?: string
}

export function ChatScrollArea({
  messages,
  usersById,
  currentUserId,
  currentUserRole,
  isLoading,
  isError,
  error,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  onLoadOlder,
  onDeleteMessage,
  className,
}: ChatScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const wasNearBottom = useRef(true)

  const isNearBottom = () => {
    if (!scrollRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    return scrollHeight - scrollTop - clientHeight < 100
  }

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const onScroll = () => {
      wasNearBottom.current = isNearBottom()
    }

    onScroll()
    element.addEventListener('scroll', onScroll)
    return () => element.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!scrollRef.current) return

    if (wasNearBottom.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages.length])

  const messageRows = useMemo(() => {
    return messages.map((message, index) => {
      const previous = messages[index - 1]
      const sameSender = previous ? previous.from === message.from : false
      const sameDay = previous ? isSameDay(new Date(previous.createdAt), new Date(message.createdAt)) : false
      const withinTwoMinutes = previous
        ? Math.abs(differenceInMinutes(new Date(message.createdAt), new Date(previous.createdAt))) <= 2
        : false
      const showMeta = !(sameSender && sameDay && withinTwoMinutes)
      const showDateDivider = !previous || !sameDay

      return {
        message,
        showMeta,
        showDateDivider,
      }
    })
  }, [messages])

  if (isError) {
    return (
      <div className={["p-4 space-y-3", className || ''].filter(Boolean).join(' ')}>
        <ErrorMessage message={error?.message || 'Unable to load chat messages.'} />
        <Button type="button" variant="secondary" size="sm" onClick={onRetry}>Retry</Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={["p-4 space-y-3", className || ''].filter(Boolean).join(' ')}>
        <SkeletonCard showMedia={false} className="rounded-2xl" />
        <SkeletonCard showMedia={false} className="rounded-2xl" />
        <SkeletonCard showMedia={false} className="rounded-2xl" />
      </div>
    )
  }

  return (
    <div className={["min-h-0 flex flex-col", className || ''].filter(Boolean).join(' ')}>
      {hasNextPage ? (
        <div className="px-4 pt-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full min-h-[44px]"
            isLoading={isFetchingNextPage}
            onClick={onLoadOlder}
          >
            Load older messages
          </Button>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-3"
        role="log"
        aria-live="polite"
        aria-label="Family chat messages"
      >
        {!messageRows.length ? (
          <div className="h-full min-h-[220px] grid place-items-center text-center text-sm text-muted-foreground">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : null}

        {messageRows.map(({ message, showMeta, showDateDivider }) => {
          const sender = usersById.get(message.from)
          const senderName = sender?.name || 'Family Member'

          return (
            <div key={message.id} className="space-y-3">
              {showDateDivider ? (
                <Divider label={format(new Date(message.createdAt), 'EEEE, MMM d')} />
              ) : null}

              <ChatMessage
                message={message}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                senderName={senderName}
                onDelete={onDeleteMessage}
                showMeta={showMeta}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
