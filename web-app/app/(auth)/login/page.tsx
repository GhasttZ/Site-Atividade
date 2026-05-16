import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  async function handleLogin(formData: FormData) {
    'use server'
    const email = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string
    if (!email || !password) redirect('/login?error=campos_obrigatorios')

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-3">
            MB
          </div>
          <CardTitle className="text-2xl">Malharia Bonfim</CardTitle>
          <CardDescription>Entre com seu e-mail e senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@malhariabonfim.com.br"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            {params.error && (
              <p className="text-sm text-destructive">
                Não foi possível entrar. Verifique suas credenciais.
              </p>
            )}
            <Button type="submit" className="w-full" size="lg">
              Entrar
            </Button>
            <p className="text-center text-xs text-muted-foreground pt-2">
              <Link href="/" className="hover:text-foreground">
                ← Voltar ao site
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
