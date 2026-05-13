import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { Avatar } from '@/components/ui/Avatar'
import type { Message } from '../types/chat.types'

interface ChatMessageProps {
  message: Message
  currentUserId: string
  currentUserRole: 'admin' | 'manager' | 'member'
  senderName: string
  onDelete?: (id: string) => void
  showMeta?: boolean
}

export function ChatMessage({
  message,
  currentUserId,
  currentUserRole,
  senderName,
  onDelete,
  showMeta = true,
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false)
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOwn = message.from === currentUserId
  const canDelete = isOwn || currentUserRole === 'admin'
  const timestamp = format(new Date(message.createdAt), 'h:mm a')

  const clearTouchTimer = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current)
      touchTimerRef.current = null
    }
  }

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canDelete) return
    event.preventDefault()
    setShowActions(true)
  }

  const handleTouchStart = () => {
    if (!canDelete) return
    clearTouchTimer()
    touchTimerRef.current = setTimeout(() => setShowActions(true), 500)
  }

  const handleDelete = () => {
    if (!onDelete) return
    onDelete(message.id)
    setShowActions(false)
  }

  const alignmentClass = isOwn ? 'items-end' : 'items-start'
  const rowClass = isOwn ? 'justify-end' : 'justify-start'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${alignmentClass}`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearTouchTimer}
      onTouchCancel={clearTouchTimer}
    >
      <div className={`flex w-full max-w-[92%] sm:max-w-[82%] gap-2 ${rowClass}`}>
        {!isOwn ? (
          <div className="pt-5">
            {showMeta ? <Avatar name={senderName} size="sm" /> : <div className="w-8 h-8" aria-hidden />}
          </div>
        ) : null}

        <div className={`space-y-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {showMeta ? (
            <p className="text-xs text-muted-foreground px-1">
              {isOwn ? 'You' : senderName} - {timestamp}
            </p>
          ) : null}

          <div
            className={`rounded-2xl px-3 py-2 text-sm leading-relaxed break-words ${
              isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            }`}
          >
            {message.deletedAt ? (
              <span className="italic text-muted-foreground">Message deleted</span>
            ) : (
              message.content
            )}
          </div>

          {showActions && canDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground hover:bg-muted"
            >
              Delete
            </button>
          ) : null}
        </div>

        {isOwn ? (
          <div className="pt-5">
            {showMeta ? <Avatar name={senderName} size="sm" /> : <div className="w-8 h-8" aria-hidden />}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
