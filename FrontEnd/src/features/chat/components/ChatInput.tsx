import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

interface ChatInputProps {
  onSend: (content: string) => void | Promise<void>
  isSending: boolean
}

export function ChatInput({ onSend, isSending }: ChatInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const maxHeight = 24 * 4
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [content])

  const submitMessage = async () => {
    const trimmed = content.trim()
    if (!trimmed || isSending) return

    const maybePromise = onSend(trimmed)

    if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
      try {
        await maybePromise
        setContent('')
      } catch {
        // Keep text if sending fails.
      }
      return
    }

    setContent('')
  }

  return (
    <div className="border-t border-border bg-card/70 p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void submitMessage()
            }
          }}
          rows={1}
          aria-label="Type a message"
          placeholder="Type a message..."
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-base leading-6 text-foreground outline-none transition focus:border-primary"
        />

        <Button
          type="button"
          variant="primary"
          size="sm"
          aria-label="Send message"
          isLoading={isSending}
          disabled={!content.trim() || isSending}
          onClick={() => {
            void submitMessage()
          }}
        >
          Send
        </Button>
      </div>
    </div>
  )
}
