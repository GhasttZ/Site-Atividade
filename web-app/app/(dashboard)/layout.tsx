import { Sidebar } from '@/components/sidebar'
import { getAppSettings } from '@/lib/repositories/knowledge-settings'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { count: pendingHandoffs } = await supabase
    .from('conversation_handoffs')
    .select('id', { count: 'exact', head: true })
    .is('resolved_at', null)

  let presentationMode = false
  try {
    const settings = await getAppSettings()
    presentationMode = settings.presentation_mode
  } catch {
    // first run pode não ter settings ainda — segue silencioso
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        pendingHandoffs={pendingHandoffs ?? 0}
        isPresentationMode={presentationMode}
      />
      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </div>
  )
}
