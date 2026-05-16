import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  QuoteSchema,
  QuoteItemSchema,
  type Quote,
  type QuoteItem,
  type QuoteStatus,
} from '@/lib/schemas'
import { RepositoryError } from './_context'

export interface QuoteWithItemsAndContact extends Quote {
  items: QuoteItem[]
  contact_name: string | null
  contact_phone: string
}

export async function listQuotes(filters?: {
  status?: QuoteStatus
  limit?: number
}): Promise<QuoteWithItemsAndContact[]> {
  const supabase = await createClient()
  let query = supabase
    .from('quotes')
    .select(
      `
      *,
      quote_items(*),
      conversations(contact_name, contact_phone)
    `
    )
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 100)

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new RepositoryError('READ_FAILED', error.message)

  return (data ?? []).map((row) => {
    const quote = QuoteSchema.parse({
      id: row.id,
      tenant_id: row.tenant_id,
      conversation_id: row.conversation_id,
      quote_number: row.quote_number,
      status: row.status,
      subtotal: Number(row.subtotal),
      discount: Number(row.discount),
      discount_pct: Number(row.discount_pct),
      total_amount: Number(row.total_amount),
      production_days: row.production_days,
      valid_until: row.valid_until,
      notes: row.notes,
      generated_by_ai: row.generated_by_ai,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
    const items = (Array.isArray(row.quote_items) ? row.quote_items : []).map(
      (it: Record<string, unknown>) =>
        QuoteItemSchema.parse({
          ...it,
          unit_price: Number(it.unit_price),
          customization_total: Number(it.customization_total),
          subtotal: Number(it.subtotal),
        })
    )
    const conv = row.conversations ?? {}
    return {
      ...quote,
      items,
      contact_name: conv.contact_name ?? null,
      contact_phone: conv.contact_phone ?? '',
    }
  })
}

export async function getQuoteById(id: string): Promise<QuoteWithItemsAndContact | null> {
  const list = await listQuotes()
  return list.find((q) => q.id === id) ?? null
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<void> {
  const { error } = await supabaseAdmin
    .from('quotes')
    .update({ status })
    .eq('id', id)
  if (error) throw new RepositoryError('WRITE_FAILED', error.message)
}

export async function getQuoteMetrics(): Promise<{
  total: number
  byStatus: Record<QuoteStatus, number>
  totalValue: number
  acceptedValue: number
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quotes')
    .select('status, total_amount')
  if (error) throw new RepositoryError('READ_FAILED', error.message)

  const byStatus: Record<string, number> = {
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    converted_to_sale: 0,
  }
  let totalValue = 0
  let acceptedValue = 0
  for (const row of data ?? []) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1
    totalValue += Number(row.total_amount)
    if (row.status === 'accepted' || row.status === 'converted_to_sale') {
      acceptedValue += Number(row.total_amount)
    }
  }
  return {
    total: data?.length ?? 0,
    byStatus: byStatus as Record<QuoteStatus, number>,
    totalValue,
    acceptedValue,
  }
}
