/**
 * Helpers de repository — resolução de contexto do usuário.
 *
 * Use estes helpers em TODAS as server actions e server components que
 * leem ou mutam dados. Garantem que o tenant_id é resolvido a partir
 * do usuário autenticado, não passado por parâmetro (defesa contra
 * IDOR via path param).
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface UserContext {
  userId: string
  tenantId: string
  email: string
  displayName: string
  role: 'owner' | 'agent'
}

/**
 * Resolve o contexto do usuário logado.
 * Throws se não houver sessão válida.
 */
export async function requireUserContext(): Promise<UserContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new RepositoryError('UNAUTHORIZED', 'Sessão inválida')

  const { data, error } = await supabase
    .from('users')
    .select('id, tenant_id, email, display_name, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    throw new RepositoryError('NO_PROFILE', 'Perfil de usuário não encontrado')
  }

  return {
    userId: data.id,
    tenantId: data.tenant_id,
    email: data.email,
    displayName: data.display_name,
    role: data.role,
  }
}

/**
 * Versão soft — retorna null em vez de throw. Use em RSCs onde o
 * redirect já foi feito pelo middleware.
 */
export async function getUserContext(): Promise<UserContext | null> {
  try {
    return await requireUserContext()
  } catch {
    return null
  }
}

export class RepositoryError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}
