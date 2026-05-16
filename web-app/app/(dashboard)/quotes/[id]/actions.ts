'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { updateQuoteStatus } from '@/lib/repositories/quotes'
import { requireUserContext } from '@/lib/repositories/_context'
import { QuoteStatusSchema } from '@/lib/schemas'

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: QuoteStatusSchema,
})

export async function updateQuoteStatusAction(formData: FormData) {
  await requireUserContext()
  const parsed = UpdateSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  })
  if (!parsed.success) throw new Error('Dados inválidos')

  await updateQuoteStatus(parsed.data.id, parsed.data.status)
  revalidatePath(`/quotes/${parsed.data.id}`)
  revalidatePath('/quotes')
  revalidatePath('/')
}
