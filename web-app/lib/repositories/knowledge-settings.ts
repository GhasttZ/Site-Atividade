import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  KnowledgeBaseChunkSchema,
  AppSettingsSchema,
  type KnowledgeBaseChunk,
  type AppSettings,
  type KnowledgeCategory,
} from '@/lib/schemas'
import { RepositoryError, requireUserContext } from './_context'

// ---------------------------------------------------------------------
// KNOWLEDGE BASE
// ---------------------------------------------------------------------

export async function listKnowledgeChunks(filters?: {
  category?: KnowledgeCategory
}): Promise<KnowledgeBaseChunk[]> {
  const supabase = await createClient()
  let query = supabase
    .from('knowledge_base_chunks')
    .select('*')
    .order('category')
    .order('priority', { ascending: false })

  if (filters?.category) query = query.eq('category', filters.category)

  const { data, error } = await query
  if (error) throw new RepositoryError('READ_FAILED', error.message)
  return (data ?? []).map((row) => KnowledgeBaseChunkSchema.parse(row))
}

export async function updateKnowledgeChunk(
  id: string,
  patch: { title?: string; content?: string; priority?: number; active?: boolean }
): Promise<void> {
  const ctx = await requireUserContext()
  const { error } = await supabaseAdmin
    .from('knowledge_base_chunks')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
  if (error) throw new RepositoryError('WRITE_FAILED', error.message)
}

export async function createKnowledgeChunk(input: {
  category: KnowledgeCategory
  title: string
  content: string
  priority?: number
}): Promise<void> {
  const ctx = await requireUserContext()
  const { error } = await supabaseAdmin.from('knowledge_base_chunks').insert({
    tenant_id: ctx.tenantId,
    category: input.category,
    title: input.title,
    content: input.content,
    priority: input.priority ?? 5,
    active: true,
  })
  if (error) throw new RepositoryError('WRITE_FAILED', error.message)
}

// ---------------------------------------------------------------------
// APP SETTINGS
// ---------------------------------------------------------------------

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw new RepositoryError('READ_FAILED', error.message)
  if (!data) throw new RepositoryError('NOT_FOUND', 'Settings não encontradas')
  return AppSettingsSchema.parse(data)
}

export async function updateAppSettings(
  patch: Partial<{
    agent_tone: string
    autonomous_sale_max_pieces: number
    autonomous_discount_max_pct: number
    presentation_mode: boolean
    dpo_email: string | null
  }>
): Promise<AppSettings> {
  const ctx = await requireUserContext()
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .update(patch)
    .eq('tenant_id', ctx.tenantId)
    .select('*')
    .single()
  if (error) throw new RepositoryError('WRITE_FAILED', error.message)
  return AppSettingsSchema.parse(data)
}

export async function togglePresentationMode(): Promise<boolean> {
  const current = await getAppSettings()
  const updated = await updateAppSettings({ presentation_mode: !current.presentation_mode })
  return updated.presentation_mode
}
