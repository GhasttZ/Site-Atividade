import { Badge } from '@/components/ui/card'
import type {
  QuoteStatus,
  PaymentStatus,
  CalendarEventStatus,
  ConversationStatus,
} from '@/lib/schemas'

type StatusVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline'

const QUOTE_STATUS_MAP: Record<QuoteStatus, { label: string; variant: StatusVariant }> = {
  draft: { label: 'Rascunho', variant: 'outline' },
  sent: { label: 'Enviado', variant: 'info' },
  accepted: { label: 'Aceito', variant: 'success' },
  rejected: { label: 'Recusado', variant: 'destructive' },
  expired: { label: 'Expirado', variant: 'secondary' },
  converted_to_sale: { label: 'Convertido em venda', variant: 'success' },
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const { label, variant } = QUOTE_STATUS_MAP[status]
  return <Badge variant={variant}>{label}</Badge>
}

const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Aguardando', variant: 'warning' },
  paid: { label: 'Pago', variant: 'success' },
  failed: { label: 'Falhou', variant: 'destructive' },
  expired: { label: 'Expirado', variant: 'secondary' },
  refunded: { label: 'Estornado', variant: 'outline' },
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, variant } = PAYMENT_STATUS_MAP[status]
  return <Badge variant={variant}>{label}</Badge>
}

const CAL_STATUS_MAP: Record<CalendarEventStatus, { label: string; variant: StatusVariant }> = {
  scheduled: { label: 'Agendado', variant: 'info' },
  confirmed: { label: 'Confirmado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  completed: { label: 'Concluído', variant: 'outline' },
}

export function CalendarEventStatusBadge({ status }: { status: CalendarEventStatus }) {
  const { label, variant } = CAL_STATUS_MAP[status]
  return <Badge variant={variant}>{label}</Badge>
}

const CONV_STATUS_MAP: Record<ConversationStatus, { label: string; variant: StatusVariant }> = {
  active: { label: 'Ativa', variant: 'success' },
  handoff: { label: 'Aguardando humano', variant: 'warning' },
  resolved: { label: 'Resolvida', variant: 'outline' },
  spam: { label: 'Spam', variant: 'destructive' },
}

export function ConversationStatusBadge({ status }: { status: ConversationStatus }) {
  const { label, variant } = CONV_STATUS_MAP[status]
  return <Badge variant={variant}>{label}</Badge>
}
