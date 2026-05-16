import { CreditCard, QrCode, AlertCircle } from 'lucide-react'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PaymentStatusBadge } from '@/components/status-badges'
import { listPayments } from '@/lib/repositories/calendar-payments'
import { formatBRL, formatRelative, formatPhoneBR } from '@/lib/utils'
import { markPaidAction } from './actions'

const METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  credit_card: 'Cartão',
  boleto: 'Boleto',
}

export default async function PaymentsPage() {
  const payments = await listPayments()

  const pending = payments.filter((p) => p.status === 'pending')
  const paid = payments.filter((p) => p.status === 'paid')

  return (
    <>
      <Header
        title="Pagamentos"
        subtitle={`${pending.length} pendente(s) · ${paid.length} confirmado(s) — modo simulado`}
      />

      <div className="px-4 md:px-8 py-6 space-y-6">
        <Card className="bg-[var(--color-info)]/10 border-[var(--color-info)]/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[var(--color-info)] shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">Pagamentos simulados</div>
              <div className="text-muted-foreground mt-1">
                QR Pix e links são placeholders pra demo. Em produção, plugue Asaas/Pagar.me/Mercado Pago
                na tool <code className="text-xs">gerar_pagamento</code> do n8n.
              </div>
            </div>
          </CardContent>
        </Card>

        {pending.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold text-foreground">Pendentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pending.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {p.quote_number}
                        </div>
                        <div className="font-semibold">{p.contact_name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPhoneBR(p.contact_phone)}
                        </div>
                      </div>
                      <PaymentStatusBadge status={p.status} />
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {METHOD_LABELS[p.method]}
                        </div>
                        <div className="text-2xl font-bold tabular-nums">
                          {formatBRL(p.amount)}
                        </div>
                      </div>
                      {p.method === 'pix' && (
                        <div className="flex items-center justify-center w-20 h-20 rounded-md border-2 border-dashed border-border bg-muted/50">
                          <QrCode className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {p.expires_at && (
                      <div className="text-xs text-muted-foreground">
                        Expira {formatRelative(p.expires_at)}
                      </div>
                    )}

                    <form action={markPaidAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit" size="sm" className="w-full">
                        ✓ Simular pagamento
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {paid.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold text-foreground">Confirmados</h2>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                      <th className="px-6 py-3 font-medium">Orçamento</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Método</th>
                      <th className="px-4 py-3 font-medium text-right">Valor</th>
                      <th className="px-6 py-3 font-medium">Pago em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paid.map((p) => (
                      <tr key={p.id}>
                        <td className="px-6 py-3 font-mono text-xs">{p.quote_number}</td>
                        <td className="px-4 py-3">{p.contact_name}</td>
                        <td className="px-4 py-3">{METHOD_LABELS[p.method]}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatBRL(p.amount)}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground text-xs">
                          {p.paid_at ? formatRelative(p.paid_at) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>
        )}

        {payments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
