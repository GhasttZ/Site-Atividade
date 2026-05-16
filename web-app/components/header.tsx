'use client'

import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'

interface HeaderProps {
  title: string
  subtitle?: string
  notifications?: number
}

export function Header({ title, subtitle, notifications = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
      <div className="flex items-center gap-4 px-4 md:px-8 py-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        <div className="hidden lg:flex relative items-center max-w-sm flex-1">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar conversas, orçamentos, produtos..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
            )}
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
