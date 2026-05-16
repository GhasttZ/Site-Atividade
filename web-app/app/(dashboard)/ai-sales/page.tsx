import { Sparkles, ShoppingBag } from 'lucide-react'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { listAISales, getAISalesMetrics } from '@/lib/repositories/ai-sales'
import { formatBRL, formatDate, formatPhoneBR } from '@/lib/utils'

const SALE_STATUS_LABELS: Record<string, string> = {
  paid: 'Pago',
  producing: 'Em produção',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export default async function AISalesPage() {
  const [sales, metrics] = await Promise.all([listAISales(), getAISalesMetrics()])

  return (
    <>
      <Header
        title="Vendas pela IA"
        subtitle="Vendas fechadas a partir de orçamentos gerados pela atendente"
      />

      <div className="px-4 md:px-8 py-6 space-y-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">Como contamos</div>
              <div className="text-muted-foreground mt-1">
                Vendas cujo orçamento foi gerado pela Maria Helena (IA). Não inclui
                vendas fechadas manualmente por um atendente humano após handoff.
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">Vendas pela IA</div>
              <div className="text-3xl font-bold tabular-nums mt-1">
                {metrics.total_count}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">Receita gerada</div>
              <div className="text-3xl font-bold tabular-nums mt-1">
                {formatBRL(metrics.total_revenue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">Ticket médio</div>
              <div className="text-3xl font-bold tabular-nums mt-1">
                {formatBRL(metrics.avg_ticket)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">% do total</div>
              <div className="text-3xl font-bold tabular-nums mt-1">
                {metrics.share_of_total_pct.toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {sales.length > 0 ? (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                    <th className="px-6 py-3 font-medium">Venda</th>
                    <th className="px-4 py-3 font-medium">Orçamento</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Valor</th>
                    <th className="px-6 py-3 font-medium">Fechada em</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-accent/40">
                      <td className="px-6 py-3 font-mono text-xs font-semibold">
                        {s.sale_number}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {s.quote_number}
                      </td>
                      <td className="px-4 py-3">
                        <div>{s.contact_name ?? 'Sem nome'}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {s.contact_phone ? formatPhoneBR(s.contact_phone) : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {SALE_STATUS_LABELS[s.status] ?? s.status}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatBRL(s.total_amount)}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">
                        {formatDate(s.closed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma venda fechada pela IA ainda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
