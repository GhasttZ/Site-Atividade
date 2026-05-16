import Link from 'next/link'
import { FileText, Bot } from 'lucide-react'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { QuoteStatusBadge } from '@/components/status-badges'
import { listQuotes, getQuoteMetrics } from '@/lib/repositories/quotes'
import { KpiCard } from '@/components/kpi-card'
import { formatBRL, formatRelative } from '@/lib/utils'
import type { QuoteStatus } from '@/lib/schemas'

const FILTERS: { value: QuoteStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'sent', label: 'Enviados' },
  { value: 'accepted', label: 'Aceitos' },
  { value: 'rejected', label: 'Recusados' },
  { value: 'expired', label: 'Expirados' },
  { value: 'converted_to_sale', label: 'Convertidos' },
]

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const statusFilter =
    params.status && FILTERS.find((f) => f.value === params.status)
      ? (params.status as QuoteStatus)
      : undefined

  const [quotes, metrics] = await Promise.all([
    listQuotes({ status: statusFilter }),
    getQuoteMetrics(),
  ])

  return (
    <>
      <Header
        title="Orçamentos"
        subtitle={`${metrics.total} orçamento(s) totais · ${formatBRL(metrics.acceptedValue)} fechado`}
      />

      <div className="px-4 md:px-8 py-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Em aberto"
            value={String(metrics.byStatus.sent ?? 0)}
            icon={FileText}
            variant="primary"
          />
          <KpiCard
            label="Aceitos"
            value={String(
              (metrics.byStatus.accepted ?? 0) +
                (metrics.byStatus.converted_to_sale ?? 0)
            )}
            hint={formatBRL(metrics.acceptedValue)}
            icon={FileText}
            variant="success"
          />
          <KpiCard
            label="Gerados pela IA"
            value={String(quotes.filter((q) => q.generated_by_ai).length)}
            hint="do total exibido"
            icon={Bot}
          />
        </section>

        <nav className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const href =
              f.value === 'all' ? '/quotes' : `/quotes?status=${f.value}`
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
          <CardContent className="p-0 overflow-x-auto">
            {quotes.length === 0 ? (
              <div className="text-center py-12 px-6">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum orçamento.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 md:px-6 py-3 font-medium">Nº</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Itens</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 md:px-6 py-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quotes.map((q) => (
                    <tr key={q.id} className="hover:bg-muted/50">
                      <td className="px-4 md:px-6 py-3 font-mono text-xs">
                        <Link
                          href={`/quotes/${q.id}`}
                          className="text-primary hover:underline"
                        >
                          {q.quote_number}
                        </Link>
                        {q.generated_by_ai && (
                          <span title="Gerado pela IA" className="inline-block ml-1.5">
                            <Bot className="h-3 w-3 inline text-primary" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{q.contact_name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">
                          {q.contact_phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {q.items.length} item(s)
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatBRL(q.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <QuoteStatusBadge status={q.status} />
                      </td>
                      <td className="px-4 md:px-6 py-3 text-muted-foreground text-xs">
                        {formatRelative(q.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
