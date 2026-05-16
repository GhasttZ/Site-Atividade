import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { RepositoryError } from './_context'

export interface DashboardMetrics {
  // Métricas do mês atual
  monthRevenue: number
  monthQuotesGenerated: number
  monthConversionRate: number
  monthAvgTicket: number
  // Métricas em tempo real
  activeConversations: number
  pendingHandoffs: number
  // Performance da IA
  aiResolutionRate: number
  avgResponseTimeSeconds: number
}

export interface RevenueChartPoint {
  month: string
  revenue: number
  quotes: number
}

export interface CategoryBreakdown {
  category: string
  count: number
  revenue: number
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [salesRes, quotesRes, convsRes, handoffsRes, invocsRes] = await Promise.all([
    supabase
      .from('sales')
      .select('total_amount')
      .gte('closed_at', monthStart.toISOString()),
    supabase
      .from('quotes')
      .select('status, total_amount')
      .gte('created_at', monthStart.toISOString()),
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('conversation_handoffs')
      .select('id', { count: 'exact', head: true })
      .is('resolved_at', null),
    supabase
      .from('ai_invocations')
      .select('latency_ms')
      .gte('created_at', monthStart.toISOString())
      .limit(1000),
  ])

  if (salesRes.error) throw new RepositoryError('READ_FAILED', salesRes.error.message)
  if (quotesRes.error) throw new RepositoryError('READ_FAILED', quotesRes.error.message)

  const monthRevenue = (salesRes.data ?? []).reduce(
    (sum, s) => sum + Number(s.total_amount),
    0
  )
  const monthQuotesGenerated = quotesRes.data?.length ?? 0
  const accepted = (quotesRes.data ?? []).filter(
    (q) => q.status === 'accepted' || q.status === 'converted_to_sale'
  ).length
  const conversionRate =
    monthQuotesGenerated > 0 ? (accepted / monthQuotesGenerated) * 100 : 0
  const acceptedTotal = (quotesRes.data ?? [])
    .filter((q) => q.status === 'accepted' || q.status === 'converted_to_sale')
    .reduce((sum, q) => sum + Number(q.total_amount), 0)
  const avgTicket = accepted > 0 ? acceptedTotal / accepted : 0

  const latencies = (invocsRes.data ?? []).map((i) => i.latency_ms ?? 0).filter((l) => l > 0)
  const avgLatency =
    latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0

  return {
    monthRevenue,
    monthQuotesGenerated,
    monthConversionRate: conversionRate,
    monthAvgTicket: avgTicket,
    activeConversations: convsRes.count ?? 0,
    pendingHandoffs: handoffsRes.count ?? 0,
    aiResolutionRate: 100 - (handoffsRes.count ?? 0) * 2.5, // heurística pra demo
    avgResponseTimeSeconds: Math.round(avgLatency / 1000),
  }
}

export async function getRevenueChartData(months = 12): Promise<RevenueChartPoint[]> {
  const supabase = await createClient()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('sales')
    .select('closed_at, total_amount')
    .gte('closed_at', startDate.toISOString())
    .order('closed_at', { ascending: true })
  if (error) throw new RepositoryError('READ_FAILED', error.message)

  const map = new Map<string, { revenue: number; quotes: number }>()
  for (const sale of data ?? []) {
    const d = new Date(sale.closed_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const existing = map.get(key) ?? { revenue: 0, quotes: 0 }
    existing.revenue += Number(sale.total_amount)
    existing.quotes += 1
    map.set(key, existing)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      month: new Date(`${key}-01`).toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      }),
      revenue: value.revenue,
      quotes: value.quotes,
    }))
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quote_items')
    .select('product_name_snapshot, subtotal, products(category)')
    .limit(2000)
  if (error) throw new RepositoryError('READ_FAILED', error.message)

  const map = new Map<string, { count: number; revenue: number }>()
  for (const row of data ?? []) {
    const rec = row as { subtotal: number; products: { category: string } | null }
    const cat = rec.products?.category ?? 'outro'
    const existing = map.get(cat) ?? { count: 0, revenue: 0 }
    existing.count += 1
    existing.revenue += Number(rec.subtotal)
    map.set(cat, existing)
  }

  const labels: Record<string, string> = {
    fardamento_escolar: 'Fardamento Escolar',
    fardamento_empresarial: 'Fardamento Empresarial',
    bolsas: 'Bolsas',
  }
  return Array.from(map.entries()).map(([category, value]) => ({
    category: labels[category] ?? category,
    count: value.count,
    revenue: value.revenue,
  }))
}
