'use client'

import { useState, useTransition } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'

interface HumanComposerProps {
  conversationId: string
  isHandoff: boolean
  onSend: (formData: FormData) => Promise<void>
  onResolve: (formData: FormData) => Promise<void>
}

export function HumanComposer({
  conversationId,
  isHandoff,
  onSend,
  onResolve,
}: HumanComposerProps) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSend() {
    if (!content.trim()) return
    const formData = new FormData()
    formData.set('conversation_id', conversationId)
    formData.set('content', content)
    startTransition(async () => {
      await onSend(formData)
      setContent('')
    })
  }

  function handleResolve() {
    const formData = new FormData()
    formData.set('conversation_id', conversationId)
    startTransition(() => onResolve(formData))
  }

  return (
    <div className="border-t bg-card p-4 space-y-3">
      {isHandoff && (
        <div className="px-3 py-2 rounded-md bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-sm flex items-center justify-between gap-3">
          <span className="text-foreground">
            Conversa em handoff — IA pausada, você está respondendo como humano.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResolve}
            disabled={isPending}
            className="shrink-0"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Resolver
          </Button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Digite uma mensagem como atendente humano..."
          rows={2}
          disabled={isPending}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button onClick={handleSend} disabled={isPending || !content.trim()} size="lg">
          <Send className="h-4 w-4" />
          <span className="sr-only">Enviar</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">⌘+Enter para enviar</p>
    </div>
  )
}
