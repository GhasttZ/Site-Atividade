/**
 * Schemas de Knowledge Base e App Settings.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------
// KNOWLEDGE BASE
// ---------------------------------------------------------------------

export const KnowledgeCategorySchema = z.enum([
  'politica_pagamento',
  'politica_prazo',
  'politica_entrega',
  'politica_troca',
  'faq',
  'tom_de_voz',
  'sobre_empresa',
])
export type KnowledgeCategory = z.infer<typeof KnowledgeCategorySchema>

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  politica_pagamento: 'Política de Pagamento',
  politica_prazo: 'Política de Prazo',
  politica_entrega: 'Política de Entrega',
  politica_troca: 'Política de Troca',
  faq: 'FAQ',
  tom_de_voz: 'Tom de Voz',
  sobre_empresa: 'Sobre a Empresa',
}

export const KnowledgeBaseChunkSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  category: KnowledgeCategorySchema,
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  priority: z.number().int().min(1).max(10),
  active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})
export type KnowledgeBaseChunk = z.infer<typeof KnowledgeBaseChunkSchema>

// ---------------------------------------------------------------------
// APP SETTINGS
// ---------------------------------------------------------------------

const BusinessHoursSchema = z.object({
  mon: z.string(),
  tue: z.string(),
  wed: z.string(),
  thu: z.string(),
  fri: z.string(),
  sat: z.string(),
  sun: z.string(),
})
export type BusinessHours = z.infer<typeof BusinessHoursSchema>

export const AppSettingsSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  agent_tone: z.string().min(1),
  business_hours: BusinessHoursSchema,
  autonomous_sale_max_pieces: z.number().int().positive(),
  autonomous_discount_max_pct: z.number().min(0).max(100),
  presentation_mode: z.boolean(),
  dpo_email: z.string().email().nullable(),
  updated_at: z.coerce.date(),
})
export type AppSettings = z.infer<typeof AppSettingsSchema>

// ---------------------------------------------------------------------
// USER
// ---------------------------------------------------------------------

export const UserRoleSchema = z.enum(['owner', 'agent'])
export type UserRole = z.infer<typeof UserRoleSchema>

export const UserSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string().min(1).max(200),
  role: UserRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})
export type User = z.infer<typeof UserSchema>
