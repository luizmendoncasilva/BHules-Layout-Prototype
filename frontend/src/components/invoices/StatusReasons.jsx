import { useState, useRef, useLayoutEffect } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@bhubai/bhub-design-system'

function ExpandableText({ text, className = '', clampLines = 2 }) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setOverflowing(el.scrollHeight > el.clientHeight + 1)
  }, [text, clampLines])

  const clampStyle = !expanded
    ? { display: '-webkit-box', WebkitLineClamp: clampLines, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }
    : { wordBreak: 'break-word' }

  return (
    <>
      <p ref={ref} className={className} style={clampStyle}>{text}</p>
      {(overflowing || expanded) && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs font-medium underline mt-0.5 opacity-70 hover:opacity-100"
        >
          {expanded ? 'Ver menos' : 'Ver mais'}
        </button>
      )}
    </>
  )
}

const severityConfig = {
  BLOQUEIO: { bg: 'bg-destructive-subtle', border: 'border-destructive-border', text: 'text-destructive-text', icon: XCircle, iconColor: 'text-destructive', label: 'Bloqueio', order: 0, badgeVariant: 'destructive' },
  ALERTA_CRITICO: { bg: 'bg-warning-subtle', border: 'border-warning-border', text: 'text-warning-text', icon: AlertTriangle, iconColor: 'text-warning', label: 'Critico', order: 1, badgeVariant: 'warning' },
  ALERTA: { bg: 'bg-warning-subtle', border: 'border-warning-border', text: 'text-warning-text', icon: AlertTriangle, iconColor: 'text-warning', label: 'Alerta', order: 2, badgeVariant: 'warning' },
  INFORMATIVO: { bg: 'bg-info-subtle', border: 'border-info-border', text: 'text-info-text', icon: Info, iconColor: 'text-info', label: 'Info', order: 3, badgeVariant: 'info' },
  OPORTUNIDADE: { bg: 'bg-success-subtle', border: 'border-success-border', text: 'text-success-text', icon: CheckCircle, iconColor: 'text-success', label: 'Oportunidade', order: 4, badgeVariant: 'success' },
}

function ReasonCard({ r }) {
  const cfg = severityConfig[r.severity] || severityConfig.INFORMATIVO
  const SevIcon = cfg.icon
  return (
    <div className={`rounded border ${cfg.border} ${cfg.bg} px-3 py-2`}>
      <div className="flex items-start gap-2">
        <SevIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
            <span className="text-xs text-muted-foreground font-mono">{r.rule_code}</span>
            {r.field_name && <span className="text-xs text-muted-foreground">({r.field_name})</span>}
          </div>
          <ExpandableText text={r.description} className={`text-xs mt-0.5 ${cfg.text}`} clampLines={2} />
          {r.current_value && r.expected_value && (
            <p className="text-xs text-muted-foreground mt-1">
              Atual: <span className="font-mono">{r.current_value}</span> → Esperado: <span className="font-mono">{r.expected_value}</span>
            </p>
          )}
          {r.legislation_ref && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">{r.legislation_ref}</p>
          )}
          {r.impact_value != null && r.impact_value !== 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Impacto: {Number(r.impact_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function SeverityGroup({ severity, reasons, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const cfg = severityConfig[severity] || severityConfig.INFORMATIVO
  const SevIcon = cfg.icon

  return (
    <div className="border border-border rounded">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2 ${cfg.bg} rounded-t ${!open ? 'rounded-b' : ''}`}
      >
        <div className="flex items-center gap-2">
          <SevIcon className={`h-4 w-4 ${cfg.iconColor}`} />
          <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
          <span className="text-xs text-muted-foreground">({reasons.length})</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="p-2 space-y-1.5">
          {reasons.map((r, i) => <ReasonCard key={i} r={r} />)}
        </div>
      )}
    </div>
  )
}

export default function StatusReasons({ data }) {
  if (!data) return null

  const { status_analise, summary, reasons, alertas_nota } = data
  const hasReasons = reasons && reasons.length > 0

  const statusStyle = status_analise === 'BLOQUEADO'
    ? { bg: 'bg-destructive-subtle', border: 'border-destructive-border', text: 'text-destructive-text', Icon: XCircle, iconColor: 'text-destructive' }
    : status_analise === 'REQUER_REVISAO' || status_analise === 'CRITICO'
    ? { bg: 'bg-warning-subtle', border: 'border-warning-border', text: 'text-warning-text', Icon: AlertTriangle, iconColor: 'text-warning' }
    : { bg: 'bg-success-subtle', border: 'border-success-border', text: 'text-success-text', Icon: CheckCircle, iconColor: 'text-success' }

  // Group reasons by severity
  const groups = {}
  if (hasReasons) {
    for (const r of reasons) {
      const sev = r.severity || 'INFORMATIVO'
      if (!groups[sev]) groups[sev] = []
      groups[sev].push(r)
    }
  }

  // Sort groups by severity order
  const sortedGroups = Object.entries(groups).sort(
    ([a], [b]) => (severityConfig[a]?.order ?? 9) - (severityConfig[b]?.order ?? 9)
  )

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold leading-7 text-foreground">
        Motivo do status
      </h3>

      {/* Summary box */}
      <div className={`rounded-lg border ${statusStyle.border} ${statusStyle.bg} p-4`}>
        <div className="flex items-start gap-3">
          <statusStyle.Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${statusStyle.iconColor}`} />
          <div className="min-w-0 flex-1">
            <ExpandableText text={summary} className={`text-sm font-medium ${statusStyle.text}`} clampLines={2} />
          </div>
        </div>
      </div>

      {/* Alertas nota-level */}
      {alertas_nota && alertas_nota.length > 0 && (
        <div className="space-y-1">
          {alertas_nota.map((alerta) => (
            <div key={alerta} className="text-xs text-warning-text bg-warning-subtle border border-warning-border rounded px-3 py-1.5">
              <ExpandableText text={alerta} className="text-xs text-warning-text" clampLines={2} />
            </div>
          ))}
        </div>
      )}

      {/* Grouped reasons by severity */}
      {sortedGroups.length > 0 && (
        <div className="space-y-2">
          {sortedGroups.map(([severity, items]) => (
            <SeverityGroup
              key={severity}
              severity={severity}
              reasons={items}
              defaultOpen={severity !== 'INFORMATIVO'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
