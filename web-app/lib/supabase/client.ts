/**
 * Supabase browser client — para Client Components.
 *
 * Use com moderação. Server Components devem ser o default.
 * Casos legítimos pra usar este: Realtime subscriptions, uploads
 * de arquivo direto no Storage, formulários com auth flow client-side.
 */

import { createBrowserClient } from '@supabase/ssr'

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variável de ambiente ausente: ${key}`)
  return value
}

export function createClient() {
  return createBrowserClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  )
}
