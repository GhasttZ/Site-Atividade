/**
 * Schemas de Conversa, Mensagem e Handoff.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------
// CONVERSATION
// ---------------------------------------------------------------------

export const ConversationStatusSchema = z.enum(['active', 'closed', 'handoff'])
export type ConversationStatus = z.infer<typeof ConversationStatusSchema>

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  contact_phone: z.string().min(1),
  contact_name: z.string().nullable(),
  status: ConversationStatusSchema,
  ai_handoff_reason: z.string().nullable(),
  last_message_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})
export type Conversation = z.infer<typeof ConversationSchema>

// ---------------------------------------------------------------------
// MESSAGE
// ---------------------------------------------------------------------

export const MessageDirectionSchema = z.enum(['inbound', 'outbound'])
export type MessageDirection = z.infer<typeof MessageDirectionSchema>

export const MessageSenderSchema = z.enum(['contact', 'ai', 'human_agent'])
export type MessageSender = z.infer<typeof MessageSenderSchema>

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  direction: MessageDirectionSchema,
  sender: MessageSenderSchema,
  content: z.string().nullable(),
  media_url: z.string().url().nullable(),
  media_type: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  created_at: z.coerce.date(),
})
export type Message = z.infer<typeof MessageSchema>

export const CreateInboundMessageInputSchema = z.object({
  contact_phone: z.string().min(8).max(32),
  contact_name: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  media_url: z.string().url().optional(),
  media_type: z.string().optional(),
  /** ID único do evento na origem (pra idempotência) */
  external_event_id: z.string().min(1),
})
export type CreateInboundMessageInput = z.infer<typeof CreateInboundMessageInputSchema>

// ---------------------------------------------------------------------
// HANDOFF
// ---------------------------------------------------------------------

export const HandoffReasonSchema = z.enum([
  'cliente_pediu',
  'xingamento',
  'reclamacao_pos_venda',
  'limite_pedido',
  'ia_nao_entendeu',
  'negociacao_fora_politica',
])
export type HandoffReason = z.infer<typeof HandoffReasonSchema>

export const HANDOFF_REASON_LABELS: Record<HandoffReason, string> = {
  cliente_pediu: 'Cliente pediu falar com humano',
  xingamento: 'Cliente foi agressivo',
  reclamacao_pos_venda: 'Reclamação de pedido entregue',
  limite_pedido: 'Pedido acima do limite autônomo',
  ia_nao_entendeu: 'IA não conseguiu entender',
  negociacao_fora_politica: 'Negociação fora da política',
}

export const ConversationHandoffSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  reason: HandoffReasonSchema,
  escalated_to: z.string().uuid().nullable(),
  escalated_at: z.coerce.date(),
  resolved_at: z.coerce.date().nullable(),
  resolution_notes: z.string().nullable(),
})
export type ConversationHandoff = z.infer<typeof ConversationHandoffSchema>
