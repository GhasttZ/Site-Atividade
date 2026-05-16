import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  ConversationSchema,
  MessageSchema,
  type Conversation,
  type Message,
  type ConversationStatus,
} from '@/lib/schemas'
import { RepositoryError } from './_context'

export interface ConversationListItem extends Conversation {
  last_message_preview: string | null
  message_count: number
  has_open_handoff: boolean
}

export async function listConversations(filters?: {
  status?: ConversationStatus
  search?: string
  limit?: number
}): Promise<ConversationListItem[]> {
  const supabase = await createClient()
  let query = supabase
    .from('conversations')
    .select(
      `
      *,
      messages(content, created_at),
      conversation_handoffs!conversation_handoffs_conversation_id_fkey(id, resolved_at)
    `
    )
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(filters?.limit ?? 50)

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.search) {
    query = query.or(
      `contact_name.ilike.%${filters.search}%,contact_phone.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw new RepositoryError('READ_FAILED', error.message)

  return (data ?? []).map((row) => {
    const parsed = ConversationSchema.parse({
      id: row.id,
      tenant_id: row.tenant_id,
      contact_phone: row.contact_phone,
      contact_name: row.contact_name,
      status: row.status,
      ai_handoff_reason: row.ai_handoff_reason,
      last_message_at: row.last_message_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
    const msgs = Array.isArray(row.messages) ? row.messages : []
    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null
    const handoffs = Array.isArray(row.conversation_handoffs) ? row.conversation_handoffs : []
    return {
      ...parsed,
      last_message_preview: lastMsg?.content ?? null,
      message_count: msgs.length,
      has_open_handoff: handoffs.some((h: { resolved_at: string | null }) => !h.resolved_at),
    }
  })
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new RepositoryError('READ_FAILED', error.message)
  return data ? ConversationSchema.parse(data) : null
}

export async function listMessages(
  conversationId: string,
  limit = 100
): Promise<Message[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw new RepositoryError('READ_FAILED', error.message)
  return (data ?? []).map((row) => MessageSchema.parse(row))
}

export async function resolveHandoff(
  conversationId: string,
  resolutionNotes?: string
): Promise<void> {
  const { error: updateConvErr } = await supabaseAdmin
    .from('conversations')
    .update({ status: 'active', ai_handoff_reason: null })
    .eq('id', conversationId)
  if (updateConvErr) throw new RepositoryError('WRITE_FAILED', updateConvErr.message)

  const { error: updateHandoffErr } = await supabaseAdmin
    .from('conversation_handoffs')
    .update({
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes ?? null,
    })
    .eq('conversation_id', conversationId)
    .is('resolved_at', null)
  if (updateHandoffErr) throw new RepositoryError('WRITE_FAILED', updateHandoffErr.message)
}

export async function sendHumanMessage(
  conversationId: string,
  tenantId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      tenant_id: tenantId,
      direction: 'outbound',
      sender: 'human_agent',
      content,
      metadata: {},
    })
    .select('*')
    .single()
  if (error) throw new RepositoryError('WRITE_FAILED', error.message)
  return MessageSchema.parse(data)
}
