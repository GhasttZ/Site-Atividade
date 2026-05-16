/**
 * Supabase admin client — usa a SECRET key (sb_secret_xxx).
 *
 * ATENÇÃO:
 * - SERVER ONLY. Importar em client component vaza a chave.
 * - BYPASSA RLS. Use apenas após validar `auth.getUser()` no client de
 *   servidor (createClient de ./server.ts) na mesma request.
 * - Use para mutations (INSERT/UPDATE/DELETE) e operações administrativas
 *   que RLS bloqueia intencionalmente.
 */

import 'server-only'
import { createClient } from '@supabase/supabase-js'

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variável de ambiente ausente: ${key}`)
  return value
}

export const supabaseAdmin = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SECRET_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
