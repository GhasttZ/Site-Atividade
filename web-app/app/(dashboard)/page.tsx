import Link from 'next/link'
import {
  TrendingUp,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bot,
  Wallet,
} from 'lucide-react'
import { Header } from '@/components/header'
import { KpiCard } from '@/components/kpi-card'
import { RevenueChart, CategoryChart, QuotesBarChart } from '@/components/dashboard-charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConversationStatusBadge } from '@/components/status-badges'
import { formatBRL, formatRelative, initials } from '@/lib/utils'
import {
  getDashboardMetrics,
  getRevenueChartData,
  getCategoryBreakdown,
} from '@/lib/repositories/dashboard'
import { listConversations } from '@/lib/repositories/conversations'

export default async function DashboardPage() {
  const [metrics, revenueData, categoryData, recentConversations] = await Promise.all([
    getDashboardMetrics(),
    getRevenueChartData(12),
    getCategoryBreakdown(),
    listConversations({ limit: 8 }),
  ])

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Visão geral da operação"
        notifications={metrics.pendingHandoffs}
      />

      <div className="px-4 md:px-8 py-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Faturamento do mês"
            value={formatBRL(metrics.monthRevenue)}
            hint="vendas confirmadas"
            icon={TrendingUp}
            variant="primary"
            trend={{ value: 12.4, isPositive: true }}
          />
          <KpiCard
            label="Orçamentos gerados"
            value={String(metrics.monthQuotesGenerated)}
            hint={`taxa conversão ${metrics.monthConversionRate.toFixed(0)}%`}
            icon={FileText}
            variant="success"
          />
          <KpiCard
            label="Ticket médio"
            value={formatBRL(metrics.monthAvgTicket)}
            hint="por venda fechada"
            icon={Wallet}
          />
          <KpiCard
            label="Resolução pela IA"
            value={`${metrics.aiResolutionRate.toFixed(0)}%`}
            hint={`${metrics.pendingHandoffs} aguardando humano`}
            icon={Bot}
            variant={metrics.pendingHandoffs > 0 ? 'warning' : 'success'}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RevenueChart data={revenueData} />
            <QuotesBarChart data={revenueData} />
          </div>

          <div className="space-y-6">
            <CategoryChart data={categoryData} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Performance IA</span>
                  <Bot className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md p-2 bg-[var(--color-success)]/10 text-[var(--color-success)]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Conversas ativas</div>
                    <div className="text-2xl font-bold">{metrics.activeConversations}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md p-2 bg-[var(--color-info)]/10 text-[var(--color-info)]">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Tempo de resposta</div>
                    <div className="text-2xl font-bold">
                      {metrics.avgResponseTimeSeconds}s
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md p-2 bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Handoffs pendentes</div>
                    <div className="text-2xl font-bold">{metrics.pendingHandoffs}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversas recentes
              </CardTitle>
              <Link
                href="/conversations"
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver todas →
              </Link>
            </CardHeader>
            <CardContent>
              {recentConversations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Nenhuma conversa ainda.
                </p>
              ) : (
                <ul className="divide-y -mx-6">
                  {recentConversations.map((conv) => (
                    <li key={conv.id}>
                      <Link
                        href={`/conversations/${conv.id}`}
                        className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50"
                      >
                        <div className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                          {initials(conv.contact_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {conv.contact_name ?? conv.contact_phone}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {conv.last_message_preview ?? '—'}
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
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
        </section>
      </div>
    </>
  )
}
