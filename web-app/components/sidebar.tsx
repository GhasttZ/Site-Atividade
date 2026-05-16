'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Package,
  Calendar,
  CreditCard,
  BookOpen,
  Settings,
  Sparkles,
  Users,
  ShoppingBag,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/conversations', label: 'Conversas', icon: MessageSquare },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/quotes', label: 'Orçamentos', icon: FileText },
  { href: '/ai-sales', label: 'Vendas pela IA', icon: ShoppingBag },
  { href: '/catalog', label: 'Catálogo', icon: Package },
  { href: '/calendar', label: 'Agenda', icon: Calendar },
  { href: '/payments', label: 'Pagamentos', icon: CreditCard },
  { href: '/knowledge-base', label: 'Base de Conhecimento', icon: BookOpen },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  pendingHandoffs?: number
  isPresentationMode?: boolean
}

export function Sidebar({ pendingHandoffs = 0, isPresentationMode = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 bg-card border-r min-h-screen sticky top-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b">
        <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground font-bold text-sm">
          MB
        </div>
        <div>
          <div className="font-semibold text-sm">Malharia Bonfim</div>
          <div className="text-xs text-muted-foreground">Caruaru/PE</div>
        </div>
      </div>

      {isPresentationMode && (
        <div className="mx-4 mt-4 px-3 py-2 rounded-md bg-primary/10 border border-primary/20 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary">Modo apresentação</span>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          const Icon = item.icon
          const showBadge = item.href === '/conversations' && pendingHandoffs > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                'min-h-11',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                  {pendingHandoffs}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-4 border-t text-xs text-muted-foreground">
        <div className="font-medium text-foreground">Maria Helena</div>
        <div>Atendente IA ativa</div>
      </div>
    </aside>
  )
}
