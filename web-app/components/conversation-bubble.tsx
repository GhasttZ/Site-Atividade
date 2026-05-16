import { Bot, User, UserCog } from 'lucide-react'
import { cn, formatRelative } from '@/lib/utils'
import type { Message } from '@/lib/schemas'

interface ConversationBubbleProps {
  message: Message
}

export function ConversationBubble({ message }: ConversationBubbleProps) {
  const isInbound = message.direction === 'inbound'
  const isAi = message.sender === 'ai'
  const isHuman = message.sender === 'human_agent'

  const Icon = isInbound ? User : isAi ? Bot : UserCog
  const senderLabel = isInbound
    ? 'Cliente'
    : isAi
      ? 'Maria Helena (IA)'
      : 'Atendente humano'

  return (
    <div
      className={cn(
        'flex gap-2 max-w-[85%]',
        isInbound ? 'self-start' : 'self-end flex-row-reverse'
      )}
    >
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white',
          isInbound
            ? 'bg-muted text-muted-foreground'
            : isAi
              ? 'bg-primary'
              : 'bg-[var(--color-info)]'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words',
            isInbound
              ? 'bg-muted text-foreground rounded-tl-sm'
              : isAi
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-[var(--color-info)] text-white rounded-tr-sm'
          )}
        >
          {message.content}
        </div>
        <div
          className={cn(
            'mt-1 text-xs text-muted-foreground flex items-center gap-2',
            isInbound ? 'justify-start' : 'justify-end'
          )}
        >
          <span>{senderLabel}</span>
          <span>·</span>
          <time dateTime={message.created_at}>{formatRelative(message.created_at)}</time>
        </div>
      </div>
    </div>
  )
}
