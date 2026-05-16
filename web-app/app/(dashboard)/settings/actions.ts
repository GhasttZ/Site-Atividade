'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  togglePresentationMode,
  updateAppSettings,
} from '@/lib/repositories/knowledge-settings'
import { requireUserContext } from '@/lib/repositories/_context'

const Schema = z.object({
  agent_tone: z.string().max(2000).optional(),
  autonomous_sale_max_pieces: z.coerce.number().int().min(1).max(500).optional(),
  autonomous_discount_max_pct: z.coerce.number().min(0).max(20).optional(),
  dpo_email: z.string().email().or(z.literal('')).optional(),
})

export async function updateSettingsAction(formData: FormData) {
  await requireUserContext()
  const raw = {
    agent_tone: formData.get('agent_tone') as string | null,
    autonomous_sale_max_pieces: formData.get('autonomous_sale_max_pieces') as string | null,
    autonomous_discount_max_pct: formData.get('autonomous_discount_max_pct') as string | null,
    dpo_email: formData.get('dpo_email') as string | null,
  }
  const filtered = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== null && v !== '')
  )
  const parsed = Schema.safeParse(filtered)
  if (!parsed.success) throw new Error('Dados inválidos')

  const patch: Parameters<typeof updateAppSettings>[0] = {}
  if (parsed.data.agent_tone !== undefined) patch.agent_tone = parsed.data.agent_tone
  if (parsed.data.autonomous_sale_max_pieces !== undefined) {
    patch.autonomous_sale_max_pieces = parsed.data.autonomous_sale_max_pieces
  }
  if (parsed.data.autonomous_discount_max_pct !== undefined) {
    patch.autonomous_discount_max_pct = parsed.data.autonomous_discount_max_pct
  }
  if (parsed.data.dpo_email !== undefined) {
    patch.dpo_email = parsed.data.dpo_email || null
  }

  await updateAppSettings(patch)
  revalidatePath('/settings')
}

export async function togglePresentationModeAction() {
  await requireUserContext()
  await togglePresentationMode()
  revalidatePath('/settings')
  revalidatePath('/', 'layout')
}
