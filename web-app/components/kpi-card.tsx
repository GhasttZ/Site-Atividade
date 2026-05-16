import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  trend?: { value: number; isPositive: boolean }
  variant?: 'default' | 'primary' | 'success' | 'warning'
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  variant = 'default',
}: KpiCardProps) {
  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  }[variant]

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl lg:text-3xl font-bold tracking-tight mt-2 text-foreground">
              {value}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs">
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-medium',
                    trend.isPositive
                      ? 'text-[var(--color-success)]'
                      : 'text-destructive'
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(trend.value).toFixed(1)}%
                </span>
              )}
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </div>
          </div>
          <div className={cn('rounded-lg p-2.5 shrink-0', iconStyles)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
