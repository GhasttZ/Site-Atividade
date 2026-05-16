/**
 * Schemas de Orçamento, Venda, Pagamento Simulado e Agenda Simulada.
 */

import { z } from 'zod'
import { CustomizationOptionSchema } from './product'

// ---------------------------------------------------------------------
// QUOTE
// ---------------------------------------------------------------------

export const QuoteStatusSchema = z.enum([
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
  'converted_to_sale',
])
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  accepted: 'Aceito',
  rejected: 'Recusado',
  expired: 'Expirado',
  converted_to_sale: 'Convertido em venda',
}

export const QuoteItemSchema = z.object({
  id: z.string().uuid(),
  quote_id: z.string().uuid(),
  product_id: z.string().uuid(),
  product_name_snapshot: z.string().min(1),
  variant_size: z.string().nullable(),
  variant_color: z.string().nullable(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  customization: z.array(CustomizationOptionSchema),
  customization_total: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  created_at: z.coerce.date(),
})
export type QuoteItem = z.infer<typeof QuoteItemSchema>

export const QuoteSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  quote_number: z.string().regex(/^ORC-\d{4}-\d{4}$/),
  status: QuoteStatusSchema,
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  discount_pct: z.number().min(0).max(100),
  total_amount: z.number().nonnegative(),
  production_days: z.number().int().positive().nullable(),
  valid_until: z.coerce.date(),
  notes: z.string().nullable(),
  generated_by_ai: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})
export type Quote = z.infer<typeof QuoteSchema>

export const QuoteWithItemsSchema = QuoteSchema.extend({
  items: z.array(QuoteItemSchema),
})
export type QuoteWithItems = z.infer<typeof QuoteWithItemsSchema>

/** Input para geração de orçamento pela IA (via tool call) */
export const GenerateQuoteInputSchema = z.object({
  conversation_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_size: z.string().optional(),
        variant_color: z.string().optional(),
        quantity: z.number().int().positive(),
        customization: z.array(CustomizationOptionSchema).default([]),
      })
    )
    .min(1),
  discount_pct: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
})
export type GenerateQuoteInput = z.infer<typeof GenerateQuoteInputSchema>

// ---------------------------------------------------------------------
// SALE
// ---------------------------------------------------------------------

export const SaleStatusSchema = z.enum([
  'paid',
  'producing',
  'shipped',
  'delivered',
  'cancelled',
])
export type SaleStatus = z.infer<typeof SaleStatusSchema>

export const SaleSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  quote_id: z.string().uuid(),
  sale_number: z.string().regex(/^VND-\d{4}-\d{4}$/),
  total_amount: z.number().positive(),
  status: SaleStatusSchema,
  closed_at: z.coerce.date(),
  delivered_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})
export type Sale = z.infer<typeof SaleSchema>

// ---------------------------------------------------------------------
// SIMULATED PAYMENT
// ---------------------------------------------------------------------

export const PaymentMethodSchema = z.enum(['pix', 'cartao_credito', 'boleto'])
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>

export const PaymentStatusSchema = z.enum(['pending', 'paid', 'expired', 'refunded'])
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>

export const SimulatedPaymentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  quote_id: z.string().uuid(),
  amount: z.number().positive(),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  pix_qr_code_url: z.string().nullable(),
  payment_link: z.string().nullable(),
  expires_at: z.coerce.date(),
  paid_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})
export type SimulatedPayment = z.infer<typeof SimulatedPaymentSchema>

// ---------------------------------------------------------------------
// SIMULATED CALENDAR EVENT
// ---------------------------------------------------------------------

export const MeetingTypeSchema = z.enum(['presencial', 'video', 'telefone'])
export type MeetingType = z.infer<typeof MeetingTypeSchema>

export const CalendarEventStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'cancelled',
  'completed',
])
export type CalendarEventStatus = z.infer<typeof CalendarEventStatusSchema>

export const SimulatedCalendarEventSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  conversation_id: z.string().uuid().nullable(),
  contact_name: z.string().min(1),
  contact_phone: z.string().nullable(),
  title: z.string().min(1),
  scheduled_for: z.coerce.date(),
  duration_minutes: z.number().int().positive(),
  meeting_type: MeetingTypeSchema,
  status: CalendarEventStatusSchema,
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})
export type SimulatedCalendarEvent = z.infer<typeof SimulatedCalendarEventSchema>

export const ScheduleMeetingInputSchema = z.object({
  conversation_id: z.string().uuid(),
  contact_name: z.string().min(1).max(200),
  contact_phone: z.string().optional(),
  title: z.string().min(1).max(200),
  scheduled_for: z.coerce.date(),
  duration_minutes: z.number().int().positive().default(30),
  meeting_type: MeetingTypeSchema,
  notes: z.string().optional(),
})
export type ScheduleMeetingInput = z.infer<typeof ScheduleMeetingInputSchema>
