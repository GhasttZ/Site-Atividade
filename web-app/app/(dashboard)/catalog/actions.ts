'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { toggleProductActive } from '@/lib/repositories/products'
import { requireUserContext } from '@/lib/repositories/_context'

const Schema = z.object({ id: z.string().uuid() })

export async function toggleProductActiveAction(formData: FormData) {
  await requireUserContext()
  const parsed = Schema.safeParse({ id: formData.get('id') })
  if (!parsed.success) throw new Error('Dados inválidos')

  await toggleProductActive(parsed.data.id)
  revalidatePath('/catalog')
}
