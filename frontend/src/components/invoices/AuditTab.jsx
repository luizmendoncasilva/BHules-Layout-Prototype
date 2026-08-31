import { Bot, Cpu, User, Server } from 'lucide-react'
import { Badge } from '@bhubai/bhub-design-system'
import { useInvoiceAuditEvents } from '../../hooks/useInvoices'
import { displayActor, displaySource, getEventDisplay } from './auditEventTypes'

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
})

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return dateFmt.format(d)
}

function CaptureMethodBadge({ method, source }) {
  if (!method) return <span className="text-muted-foreground">—</span>
  const isManual = method === 'MANUAL'
  const label = isManual ? 'Manual' : 'Automática'
  const cls = isManual
    ? 'bg-warning-subtle text-warning-text border-warning-border'
    : 'bg-info-subtle text-info-text border-info-border'
  return (
    <span className="inline-flex items-center gap-2">
      <Badge variant="outline" className={cls}>
        {label}
      </Badge>
      {source && !isManual && <span className="text-xs text-muted-foreground">({displaySource(source)})</span>}
    </span>
  )
}

function actorIcon(actorType) {
  switch (actorType) {
    case 'motor':
      return Bot
    case 'engine':
      return Cpu
    case 'system':
      return Server
    default:
      return User
  }
}

function actorBadgeClass(actorType) {
  switch (actorType) {
    case 'motor':
      return 'bg-magic-subtle text-magic-bold border-magic-subtle'
    case 'engine':
      return 'bg-mizu-flow-subtle text-mizu-flow-bold border-mizu-flow-subtle'
    case 'system':
      return 'bg-dojo-steel-subtle text-dojo-steel-bold border-dojo-steel-subtle'
    default:
      return 'bg-success-subtle text-success-text border-success-border'
  }
}

function ActorBadge({ actor, actorType }) {
  if (!actor) return <span className="text-muted-foreground">—</span>
  const Icon = actorIcon(actorType)
  return (
    <Badge variant="outline" className={actorBadgeClass(actorType)}>
      <Icon className="w-3 h-3" />
      {displayActor(actor)}
    </Badge>
  )
}

function ReviewerBadge({ reviewer }) {
  if (!reviewer) return <span className="text-muted-foreground">—</span>
  if (reviewer === 'motor') return <ActorBadge actor="Motor (auto-aprovação)" actorType="motor" />
  if (reviewer === 'legado') return <ActorBadge actor="Legado (pré-auditoria)" actorType="system" />
  return <ActorBadge actor={reviewer} actorType="analyst" />
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-4 px-4 py-3 border-b border-border last:border-b-0">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

function TimelineItem({ event }) {
  const display = getEventDisplay(event.event_type)
  const Icon = display.icon
  const detail = display.format(event.payload)
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <div className="absolute left-4 top-7 bottom-0 w-px bg-border" aria-hidden />
      <div className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full bg-muted ring-4 ring-background">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{display.label}</span>
          <ActorBadge actor={event.actor} actorType={event.actor_type} />
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(event.created_at)}</div>
        {detail && <div className="mt-1 text-sm text-foreground">{detail}</div>}
      </div>
    </li>
  )
}

function Timeline({ events, isLoading, error }) {
  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando eventos…</div>
  }
  if (error) {
    return <div className="text-sm text-destructive-text">Erro ao carregar eventos.</div>
  }
  if (!events || events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhum evento registrado para esta nota.
      </div>
    )
  }
  return (
    <ol className="relative">
      {events.map((e) => (
        <TimelineItem key={e.id} event={e} />
      ))}
    </ol>
  )
}

export default function AuditTab({ invoice }) {
  const { data: events, isLoading, error } = useInvoiceAuditEvents(invoice?.id)

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Sem dados de auditoria.
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">Resumo</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Row label="Data/hora da captura">
            {formatDateTime(invoice.captured_at ?? invoice.created_at)}
          </Row>
          <Row label="Forma de captura">
            <CaptureMethodBadge method={invoice.capture_method} source={invoice.api_source} />
          </Row>
          <Row label="Data/hora da conferência">{formatDateTime(invoice.reviewed_at)}</Row>
          <Row label="Usuário da conferência">
            <ReviewerBadge reviewer={invoice.reviewed_by} />
          </Row>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">Linha do tempo</h3>
        <Timeline events={events} isLoading={isLoading} error={error} />
      </div>
    </div>
  )
}
