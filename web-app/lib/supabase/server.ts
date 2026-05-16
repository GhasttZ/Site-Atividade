/**
 * Supabase server client — usado em Server Components, Route Handlers
 * e Server Actions.
 *
 * Lê cookies via next/headers e usa a publishable key (não escala
 * privilégios — RLS é a defesa).
 *
 * IMPORTANTE: chame `cookies()` dentro da função, não no module scope,
 * porque Next.js 15 trata cookies() como request-scoped.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Chamado de RSC: ignorar. Middleware atualiza sessão.
          }
        },
      },
    }
  )
}

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variável de ambiente ausente: ${key}`)
  return value
}
