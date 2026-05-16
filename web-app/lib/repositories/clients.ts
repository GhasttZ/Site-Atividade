import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { RepositoryError } from './_context'

export interface ClientListItem {
  contact_phone: string
  contact_name: string | null
  conversation_count: number
  message_count: number
  quote_count: number
  sale_count: number
  total_purchased: number
  last_interaction_at: Date | null
}

interface ConversationRow {
  contact_phone: string
  contact_name: string | null
  last_message_at: string | null
  messages: { id: string }[] | null
  quotes: { id: string; sales: { id: string; total_amount: number }[] | null }[] | null
}

export async function listClients(): Promise<ClientListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      contact_phone,
      contact_name,
      last_message_at,
      messages(id),
      quotes(id, sales(id, total_amount))
    `)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) throw new RepositoryError('READ_FAILED', error.message)

  const byPhone = new Map<string, ClientListItem>()
  for (const row of (data ?? []) as ConversationRow[]) {
    const phone = row.contact_phone
    const existing = byPhone.get(phone)
    const messages = row.messages ?? []
    const quotes = row.quotes ?? []
    const sales = quotes.flatMap((q) => q.sales ?? [])
    const lastAt = row.last_message_at ? new Date(row.last_message_at) : null

    if (existing) {
      existing.conversation_count += 1
      existing.message_count += messages.length
      existing.quote_count += quotes.length
      existing.sale_count += sales.length
      existing.total_purchased += sales.reduce((s, x) => s + Number(x.total_amount), 0)
      if (!existing.contact_name && row.contact_name) {
        existing.contact_name = row.contact_name
      }
      if (lastAt && (!existing.last_interaction_at || lastAt > existing.last_interaction_at)) {
        existing.last_interaction_at = lastAt
      }
    } else {
      byPhone.set(phone, {
        contact_phone: phone,
        contact_name: row.contact_name,
        conversation_count: 1,
        message_count: messages.length,
        quote_count: quotes.length,
        sale_count: sales.length,
        total_purchased: sales.reduce((s, x) => s + Number(x.total_amount), 0),
        last_interaction_at: lastAt,
      })
    }
  }

  return Array.from(byPhone.values()).sort((a, b) => {
    const ta = a.last_interaction_at?.getTime() ?? 0
    const tb = b.last_interaction_at?.getTime() ?? 0
    return tb - ta
  })
}
