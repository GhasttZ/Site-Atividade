import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { RepositoryError } from './_context'
import type { SaleStatus } from '@/lib/schemas'

export interface AISaleListItem {
  id: string
  sale_number: string
  total_amount: number
  status: SaleStatus
  closed_at: Date
  delivered_at: Date | null
  quote_number: string
  contact_name: string | null
  contact_phone: string
}

export interface AISalesMetrics {
  total_count: number
  total_revenue: number
  avg_ticket: number
  share_of_total_pct: number
}

interface SaleRow {
  id: string
  sale_number: string
  total_amount: number
  status: SaleStatus
  closed_at: string
  delivered_at: string | null
  quotes: {
    quote_number: string
    generated_by_ai: boolean
    conversations: { contact_name: string | null; contact_phone: string } | null
  } | null
}

export async function listAISales(): Promise<AISaleListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sales')
    .select(`
      id,
      sale_number,
      total_amount,
      status,
      closed_at,
      delivered_at,
      quotes!inner(
        quote_number,
        generated_by_ai,
        conversations(contact_name, contact_phone)
      )
    `)
    .eq('quotes.generated_by_ai', true)
    .order('closed_at', { ascending: false })

  if (error) throw new RepositoryError('READ_FAILED', error.message)

  return ((data ?? []) as unknown as SaleRow[])
    .filter((row): row is SaleRow & { quotes: NonNullable<SaleRow['quotes']> } => row.quotes !== null)
    .map((row) => ({
      id: row.id,
      sale_number: row.sale_number,
      total_amount: Number(row.total_amount),
      status: row.status,
      closed_at: new Date(row.closed_at),
      delivered_at: row.delivered_at ? new Date(row.delivered_at) : null,
      quote_number: row.quotes.quote_number,
      contact_name: row.quotes.conversations?.contact_name ?? null,
      contact_phone: row.quotes.conversations?.contact_phone ?? '',
    }))
}

export async function getAISalesMetrics(): Promise<AISalesMetrics> {
  const supabase = await createClient()

  const { data: aiSales, error: aiErr } = await supabase
    .from('sales')
    .select('total_amount, quotes!inner(generated_by_ai)')
    .eq('quotes.generated_by_ai', true)

  if (aiErr) throw new RepositoryError('READ_FAILED', aiErr.message)

  const { count: totalCount, error: totalErr } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })

  if (totalErr) throw new RepositoryError('READ_FAILED', totalErr.message)

  const aiRevenue = (aiSales ?? []).reduce(
    (sum, s) => sum + Number(s.total_amount),
    0
  )
  const aiCount = (aiSales ?? []).length

  return {
    total_count: aiCount,
    total_revenue: aiRevenue,
    avg_ticket: aiCount > 0 ? aiRevenue / aiCount : 0,
    share_of_total_pct:
      totalCount && totalCount > 0 ? (aiCount / totalCount) * 100 : 0,
  }
}
