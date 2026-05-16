import { Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { listClients } from '@/lib/repositories/clients'
import { formatBRL, formatRelative, formatPhoneBR, initials } from '@/lib/utils'

export default async function ClientsPage() {
  const clients = await listClients()

  const totalClients = clients.length
  const buyers = clients.filter((c) => c.sale_count > 0).length
  const totalRevenue = clients.reduce((sum, c) => sum + c.total_purchased, 0)

  return (
    <>
      <Header
        title="Clientes"
        subtitle={`${totalClients} contato(s) que conversaram com a IA`}
      />

      <div className="px-4 md:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">Total de clientes</div>
              <div className="text-3xl font-bold tabular-nums mt-1">{totalClients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">Compraram pelo menos 1x</div>
              <div className="text-3xl font-bold tabular-nums mt-1">{buyers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">Receita acumulada</div>
              <div className="text-3xl font-bold tabular-nums mt-1">
                {formatBRL(totalRevenue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {clients.length > 0 ? (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                    <th className="px-6 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Telefone</th>
                    <th className="px-4 py-3 font-medium text-right">Conversas</th>
                    <th className="px-4 py-3 font-medium text-right">Orçamentos</th>
                    <th className="px-4 py-3 font-medium text-right">Vendas</th>
                    <th className="px-4 py-3 font-medium text-right">Total gasto</th>
                    <th className="px-6 py-3 font-medium">Última interação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {clients.map((c) => (
                    <tr key={c.contact_phone} className="hover:bg-accent/40">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {initials(c.contact_name)}
                          </div>
                          <span className="font-medium">
                            {c.contact_name ?? 'Sem nome'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {formatPhoneBR(c.contact_phone)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {c.conversation_count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {c.quote_count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {c.sale_count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">
                        {c.total_purchased > 0 ? formatBRL(c.total_purchased) : '—'}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">
                        {c.last_interaction_at
                          ? formatRelative(c.last_interaction_at)
                          : '—'}
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
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum cliente ainda. A IA precisa conversar com alguém primeiro.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
