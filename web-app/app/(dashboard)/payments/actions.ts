'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { markPaymentAsPaid } from '@/lib/repositories/calendar-payments'
import { requireUserContext } from '@/lib/repositories/_context'

const Schema = z.object({ id: z.string().uuid() })

export async function markPaidAction(formData: FormData) {
  await requireUserContext()
  const parsed = Schema.safeParse({ id: formData.get('id') })
  if (!parsed.success) throw new Error('Dados inválidos')

  await markPaymentAsPaid(parsed.data.id)
  revalidatePath('/payments')
  revalidatePath('/')
}
