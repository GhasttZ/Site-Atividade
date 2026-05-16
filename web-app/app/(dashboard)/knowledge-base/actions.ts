'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { updateKnowledgeChunk } from '@/lib/repositories/knowledge-settings'
import { requireUserContext } from '@/lib/repositories/_context'

const Schema = z.object({
  id: z.string().uuid(),
  active: z.enum(['true', 'false']),
})

export async function toggleChunkAction(formData: FormData) {
  await requireUserContext()
  const parsed = Schema.safeParse({
    id: formData.get('id'),
    active: formData.get('active'),
  })
  if (!parsed.success) throw new Error('Dados inválidos')

  await updateKnowledgeChunk(parsed.data.id, { active: parsed.data.active === 'true' })
  revalidatePath('/knowledge-base')
}
