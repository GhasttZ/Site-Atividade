import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, Calendar, FileText, User } from 'lucide-react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { QuoteStatusBadge } from '@/components/status-badges'
import { getQuoteById } from '@/lib/repositories/quotes'
import { formatBRL, formatDate, formatPhoneBR } from '@/lib/utils'
import { updateQuoteStatusAction } from './actions'

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quote = await getQuoteById(id)
  if (!quote) notFound()

  return (
    <>
      <Header title={quote.quote_number} subtitle="Detalhes do orçamento" />

      <div className="px-4 md:px-8 py-4 border-b bg-card flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/quotes">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
        <div className="flex-1" />
        <QuoteStatusBadge status={quote.status} />
      </div>

      <div className="px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Itens
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                    <th className="px-6 py-2 font-medium">Produto</th>
                    <th className="px-4 py-2 font-medium">Qtd</th>
                    <th className="px-4 py-2 font-medium text-right">Unit.</th>
                    <th className="px-4 py-2 font-medium text-right">Custom</th>
                    <th className="px-6 py-2 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quote.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-3">
                        <div className="font-medium">
                          {item.product_name_snapshot}
                        </div>
                        {(item.variant_size || item.variant_color) && (
                          <div className="text-xs text-muted-foreground">
                            {[item.variant_size, item.variant_color]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">{item.quantity}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatBRL(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {formatBRL(item.customization_total)}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold tabular-nums">
                        {formatBRL(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={4} className="px-6 py-2 text-right text-muted-foreground">
                      Subtotal
                    </td>
                    <td className="px-6 py-2 text-right tabular-nums">
                      {formatBRL(quote.subtotal)}
                    </td>
                  </tr>
                  {quote.discount > 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-2 text-right text-muted-foreground">
                        Desconto ({quote.discount_pct.toFixed(1)}%)
                      </td>
                      <td className="px-6 py-2 text-right tabular-nums text-[var(--color-success)]">
                        −{formatBRL(quote.discount)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t font-bold">
                    <td colSpan={4} className="px-6 py-3 text-right">
                      Total
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-lg">
                      {formatBRL(quote.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">{quote.notes}</CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Nome</div>
                <div className="font-medium">{quote.contact_name ?? '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Telefone</div>
                <div className="font-mono">{formatPhoneBR(quote.contact_phone)}</div>
              </div>
              <Button variant="outline" size="sm" asChild className="w-full mt-2">
                <Link href={`/conversations/${quote.conversation_id}`}>
                  Ver conversa
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prazos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Produção</div>
                <div className="font-semibold">{quote.production_days} dias úteis</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Validade</div>
                <div>{formatDate(quote.valid_until)}</div>
              </div>
            </CardContent>
          </Card>

          {quote.generated_by_ai && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-primary">Gerado pela IA</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Maria Helena gerou este orçamento durante atendimento autônomo.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {quote.status === 'sent' && (
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <form action={updateQuoteStatusAction}>
                  <input type="hidden" name="id" value={quote.id} />
                  <input type="hidden" name="status" value="accepted" />
                  <Button type="submit" className="w-full">
                    Marcar como aceito
                  </Button>
                </form>
                <form action={updateQuoteStatusAction}>
                  <input type="hidden" name="id" value={quote.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <Button type="submit" variant="outline" className="w-full">
                    Marcar como recusado
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
