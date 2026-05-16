'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  resolveHandoff,
  sendHumanMessage,
} from '@/lib/repositories/conversations'
import { requireUserContext } from '@/lib/repositories/_context'

const SendSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
})

const ResolveSchema = z.object({
  conversation_id: z.string().uuid(),
  notes: z.string().max(1000).optional(),
})

export async function sendHumanMessageAction(formData: FormData) {
  const ctx = await requireUserContext()
  const parsed = SendSchema.safeParse({
    conversation_id: formData.get('conversation_id'),
    content: formData.get('content'),
  })
  if (!parsed.success) throw new Error('Dados inválidos')

  await sendHumanMessage(parsed.data.conversation_id, ctx.tenantId, parsed.data.content)
  revalidatePath(`/conversations/${parsed.data.conversation_id}`)
  revalidatePath('/conversations')
}

export async function resolveHandoffAction(formData: FormData) {
  await requireUserContext()
  const parsed = ResolveSchema.safeParse({
    conversation_id: formData.get('conversation_id'),
    notes: formData.get('notes') ?? undefined,
  })
  if (!parsed.success) throw new Error('Dados inválidos')

  await resolveHandoff(parsed.data.conversation_id, parsed.data.notes)
  revalidatePath(`/conversations/${parsed.data.conversation_id}`)
  revalidatePath('/conversations')
  revalidatePath('/')
}
