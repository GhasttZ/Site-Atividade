import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { ConversationStatusBadge } from '@/components/status-badges'
import { listConversations } from '@/lib/repositories/conversations'
import { formatRelative, formatPhoneBR, initials } from '@/lib/utils'
import type { ConversationStatus } from '@/lib/schemas'

const STATUS_FILTERS: { value: ConversationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Ativas' },
  { value: 'handoff', label: 'Aguardando humano' },
  { value: 'resolved', label: 'Resolvidas' },
]

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const statusFilter =
    params.status && STATUS_FILTERS.find((f) => f.value === params.status)
      ? (params.status as ConversationStatus)
      : undefined

  const conversations = await listConversations({
    status: statusFilter,
    search: params.search,
  })

  return (
    <>
      <Header
        title="Conversas"
        subtitle={`${conversations.length} conversa(s)`}
      />

      <div className="px-4 md:px-8 py-6 space-y-4">
        <nav className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => {
            const href =
              f.value === 'all'
                ? '/conversations'
                : `/conversations?status=${f.value}`
            const isActive =
              f.value === 'all' ? !params.status : params.status === f.value
            return (
              <Link
                key={f.value}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </nav>

        <Card>
          <CardContent className="p-0">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-6">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma conversa nesse filtro.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {conversations.map((conv) => (
                  <li key={conv.id}>
                    <Link
                      href={`/conversations/${conv.id}`}
                      className="flex items-center gap-4 px-4 md:px-6 py-4 hover:bg-muted/50"
                    >
                      <div className="w-11 h-11 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                        {initials(conv.contact_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm truncate">
                            {conv.contact_name ?? 'Sem nome'}
                          </span>
                          {conv.has_open_handoff && (
                            <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatPhoneBR(conv.contact_phone)} · {conv.message_count} msg
                        </div>
                        <div className="text-sm text-foreground/80 truncate mt-1">
                          {conv.last_message_preview ?? '—'}
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1.5">
                        <ConversationStatusBadge status={conv.status} />
                        {conv.last_message_at && (
                          <div className="text-xs text-muted-foreground">
                            {formatRelative(conv.last_message_at)}
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
