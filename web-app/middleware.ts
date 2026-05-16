/**
 * Middleware Next.js — refresh de sessão Supabase + redirect de auth.
 */

import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match em tudo exceto:
     * - _next/static, _next/image, favicon
     * - imagens públicas (svg, png, jpg, webp, ico)
     * - manifest.json e sw.js (PWA)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)',
  ],
}
