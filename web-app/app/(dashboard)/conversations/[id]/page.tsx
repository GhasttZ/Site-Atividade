import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, MessageCircle } from 'lucide-react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { ConversationBubble } from '@/components/conversation-bubble'
import { HumanComposer } from '@/components/human-composer'
import { ConversationStatusBadge } from '@/components/status-badges'
import { Button } from '@/components/ui/button'
import {
  getConversationById,
  listMessages,
} from '@/lib/repositories/conversations'
import { formatPhoneBR } from '@/lib/utils'
import { sendHumanMessageAction, resolveHandoffAction } from '../actions'

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const conversation = await getConversationById(id)
  if (!conversation) notFound()

  const messages = await listMessages(id, 200)
  const isHandoff = conversation.status === 'handoff'

  return (
    <>
      <Header
        title={conversation.contact_name ?? 'Sem nome'}
        subtitle={formatPhoneBR(conversation.contact_phone)}
      />

      <div className="px-4 md:px-8 py-4 border-b bg-card flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/conversations">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
        <div className="flex-1" />
        <ConversationStatusBadge status={conversation.status} />
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://wa.me/${conversation.contact_phone}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Phone className="h-4 w-4 mr-1" />
            WhatsApp
          </a>
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {messages.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Sem mensagens ainda.</p>
            </Card>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col gap-3">
              {messages.map((msg) => (
                <ConversationBubble key={msg.id} message={msg} />
              ))}
            </div>
          )}
        </div>

        <HumanComposer
          conversationId={conversation.id}
          isHandoff={isHandoff}
          onSend={sendHumanMessageAction}
          onResolve={resolveHandoffAction}
        />
      </div>
    </>
  )
}
