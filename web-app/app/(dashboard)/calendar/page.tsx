import { Calendar as CalIcon, Clock, MapPin, AlertCircle } from 'lucide-react'
import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarEventStatusBadge } from '@/components/status-badges'
import { listCalendarEvents } from '@/lib/repositories/calendar-payments'
import { formatDate } from '@/lib/utils'

const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting: 'Reunião',
  delivery: 'Entrega',
  production_milestone: 'Marco de produção',
  follow_up: 'Follow-up',
}

export default async function CalendarPage() {
  const events = await listCalendarEvents()

  const grouped = events.reduce<Record<string, typeof events>>((acc, evt) => {
    const dateKey = formatDate(evt.scheduled_for)
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(evt)
    return acc
  }, {})

  return (
    <>
      <Header
        title="Agenda"
        subtitle={`${events.length} compromisso(s) — modo simulado`}
      />

      <div className="px-4 md:px-8 py-6 space-y-6">
        <Card className="bg-[var(--color-info)]/10 border-[var(--color-info)]/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[var(--color-info)] shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">Agenda simulada</div>
              <div className="text-muted-foreground mt-1">
                Demo da Malharia Bonfim. Em produção real, conecta com Google Calendar
                ou Outlook trocando o handler de <code className="text-xs">agendar_reuniao</code>.
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.keys(grouped).length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CalIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum compromisso agendado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([date, items]) => (
              <Card key={date}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{date}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-3 p-3 rounded-md border bg-muted/30"
                    >
                      <div className="rounded-md p-2 bg-primary/10 text-primary shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {evt.title}
                          </span>
                          <CalendarEventStatusBadge status={evt.status} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {EVENT_TYPE_LABELS[evt.event_type] ?? evt.event_type} ·{' '}
                          {new Date(evt.scheduled_for).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {evt.duration_minutes}min
                        </div>
                        {evt.location && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {evt.location}
                          </div>
                        )}
                        {evt.description && (
                          <p className="text-xs text-foreground/80 pt-1">
                            {evt.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
