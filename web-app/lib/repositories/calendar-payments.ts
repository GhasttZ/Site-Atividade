import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  SimulatedCalendarEventSchema,
  SimulatedPaymentSchema,
  type SimulatedCalendarEvent,
  type SimulatedPayment,
  type CalendarEventStatus,
  type PaymentStatus,
} from '@/lib/schemas'
import { RepositoryError } from './_context'

// ---------------------------------------------------------------------
// CALENDAR
// ---------------------------------------------------------------------

export async function listCalendarEvents(filters?: {
  from?: Date
  to?: Date
  status?: CalendarEventStatus
}): Promise<SimulatedCalendarEvent[]> {
  const supabase = await createClient()
  let query = supabase
    .from('simulated_calendar_events')
    .select('*')
    .order('scheduled_for', { ascending: true })

  if (filters?.from) query = query.gte('scheduled_for', filters.from.toISOString())
  if (filters?.to) query = query.lte('scheduled_for', filters.to.toISOString())
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new RepositoryError('READ_FAILED', error.message)
  return (data ?? []).map((row) => SimulatedCalendarEventSchema.parse(row))
}

export async function updateCalendarEventStatus(
  id: string,
  status: CalendarEventStatus
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('simulated_calendar_events')
    .update({ status })
    .eq('id', id)
  if (error) throw new RepositoryError('WRITE_FAILED', error.message)
}

// ---------------------------------------------------------------------
// PAYMENTS (simulated)
// ---------------------------------------------------------------------

export interface PaymentWithQuote extends SimulatedPayment {
  quote_number: string
  contact_name: string | null
  contact_phone: string
}

export async function listPayments(filters?: {
  status?: PaymentStatus
  limit?: number
}): Promise<PaymentWithQuote[]> {
  const supabase = await createClient()
  let query = supabase
    .from('simulated_payments')
    .select(
      `
      *,
      quotes(quote_number, conversation_id, conversations(contact_name, contact_phone))
    `
    )
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 100)

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new RepositoryError('READ_FAILED', error.message)

  return (data ?? []).map((row) => {
    const payment = SimulatedPaymentSchema.parse({
      id: row.id,
      tenant_id: row.tenant_id,
      quote_id: row.quote_id,
      amount: Number(row.amount),
      method: row.method,
      status: row.status,
      pix_qr_code_url: row.pix_qr_code_url,
      payment_link: row.payment_link,
      expires_at: row.expires_at,
      paid_at: row.paid_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
    const quote = row.quotes ?? {}
    const conv = quote.conversations ?? {}
    return {
      ...payment,
      quote_number: quote.quote_number ?? '',
      contact_name: conv.contact_name ?? null,
      contact_phone: conv.contact_phone ?? '',
    }
  })
}

/** Simula confirmação de pagamento — modo apresentação. */
export async function markPaymentAsPaid(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('simulated_payments')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new RepositoryError('WRITE_FAILED', error.message)
}
