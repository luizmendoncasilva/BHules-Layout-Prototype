import { useState, useRef, useLayoutEffect } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
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

// Severidade → cor só no ícone e no rótulo; as linhas ficam em fundo neutro
// (as faixas coloridas de ponta a ponta pesavam a tela).
const severityConfig = {
  BLOQUEIO: { text: 'text-destructive-text', chip: 'bg-destructive-subtle text-destructive-text', icon: XCircle, label: 'Bloqueio', plural: 'bloqueios', order: 0 },
  ALERTA_CRITICO: { text: 'text-destructive-text', chip: 'bg-destructive-subtle text-destructive-text', icon: AlertTriangle, label: 'Crítico', plural: 'críticos', order: 1 },
  // Severidade da escrituração de NF-e (escrituracao_resultado.divergencias)
  CRITICO: { text: 'text-destructive-text', chip: 'bg-destructive-subtle text-destructive-text', icon: AlertTriangle, label: 'Crítico', plural: 'críticos', order: 1 },
  ALERTA: { text: 'text-warning-text', chip: 'bg-warning-subtle text-warning-text', icon: AlertTriangle, label: 'Alerta', plural: 'alertas', order: 2 },
  INFORMATIVO: { text: 'text-info-text', chip: 'bg-info-subtle text-info-text', icon: Info, label: 'Informativo', plural: 'informativos', order: 3 },
  OPORTUNIDADE: { text: 'text-success-text', chip: 'bg-success-subtle text-success-text', icon: CheckCircle, label: 'Oportunidade', plural: 'oportunidades', order: 4 },
}

const STATUS_STYLE = {
  BLOQUEADO: { chip: 'bg-destructive-subtle text-destructive-text', Icon: XCircle, label: 'Bloqueada', badge: 'destructive' },
  REQUER_REVISAO: { chip: 'bg-warning-subtle text-warning-text', Icon: AlertTriangle, label: 'Requer revisão', badge: 'warning' },
  CRITICO: { chip: 'bg-warning-subtle text-warning-text', Icon: AlertTriangle, label: 'Requer revisão', badge: 'warning' },
  CONFORME: { chip: 'bg-success-subtle text-success-text', Icon: CheckCircle, label: 'Conforme', badge: 'success' },
}

const ordem = (sev) => severityConfig[sev]?.order ?? 9

function ReasonRow({ r }) {
  const cfg = severityConfig[r.severity] || severityConfig.INFORMATIVO
  const SevIcon = cfg.icon
  return (
    <li className="flex gap-3 px-4 py-3">
      <div className={`size-6 rounded-md flex items-center justify-center shrink-0 ${cfg.chip}`} title={cfg.label}>
        <SevIcon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <ExpandableText text={r.description} className="text-sm text-foreground" clampLines={2} />
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className={`font-medium ${cfg.text}`}>{cfg.label}</span>
          {r.num_item != null && (
            <span className="truncate max-w-[320px]">Item {r.num_item}{r.item_descricao ? ` · ${r.item_descricao}` : ''}</span>
          )}
          {r.rule_code && <span className="font-mono">{r.rule_code}</span>}
          {r.impact_value != null && r.impact_value !== 0 && (
            <span>Impacto {Number(r.impact_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          )}
        </div>
        {r.current_value && r.expected_value && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs">
            <span className="text-muted-foreground">{r.field_name || 'Valor'}</span>
            <span className="font-mono text-muted-foreground line-through">{r.current_value}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono font-semibold text-foreground">{r.expected_value}</span>
          </div>
        )}
        {r.legislation_ref && (
          <p className="mt-1 text-xs text-muted-foreground italic">{r.legislation_ref}</p>
        )}
      </div>
    </li>
  )
}

// Selo de DIFAL pendente (FIS-1222): a nota tem item de DIFAL do Simples
// aguardando o analista na aba DIFAL.
function DifalPendenteLinha() {
  return (
    <li className="flex gap-3 px-4 py-3">
      <div className="size-6 rounded-md flex items-center justify-center shrink-0 bg-warning-subtle text-warning-text">
        <AlertTriangle className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">Há itens de DIFAL do Simples aguardando ajuste do analista.</p>
        <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium text-warning-text">DIFAL pendente</span> · veja a aba DIFAL</p>
      </div>
    </li>
  )
}

export default function StatusReasons({ data, difalPendente = false }) {
  const [mostrarInfo, setMostrarInfo] = useState(false)
  if (!data && !difalPendente) return null

  const { status_analise, summary, reasons, alertas_nota } = data || {}
  const st = STATUS_STYLE[status_analise] || (data ? STATUS_STYLE.CONFORME : STATUS_STYLE.REQUER_REVISAO)

  // Mais grave primeiro; informativos ficam recolhidos atrás de um botão.
  const ordenados = [...(reasons || [])].sort((a, b) => ordem(a.severity) - ordem(b.severity))
  const informativos = ordenados.filter((r) => (r.severity || 'INFORMATIVO') === 'INFORMATIVO')
  const acionaveis = ordenados.filter((r) => (r.severity || 'INFORMATIVO') !== 'INFORMATIVO')
  const visiveis = mostrarInfo ? ordenados : acionaveis

  // "1 alerta · 1 informativo" ao lado do título.
  const porSeveridade = ordenados.reduce((acc, r) => {
    const k = r.severity || 'INFORMATIVO'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
  const contagem = Object.entries(porSeveridade)
    .sort(([a], [b]) => ordem(a) - ordem(b))
    .map(([sev, n]) => {
      const c = severityConfig[sev] || severityConfig.INFORMATIVO
      return `${n} ${n === 1 ? c.label.toLowerCase() : c.plural}`
    })
  if (difalPendente) contagem.unshift('DIFAL pendente')

  const temLista = difalPendente || visiveis.length > 0 || (alertas_nota && alertas_nota.length > 0)

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Resumo: status da nota + contagem + frase do motor */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className={`size-8 rounded-md flex items-center justify-center shrink-0 ${st.chip}`}>
          <st.Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Motivo do status</h3>
            {data && <Badge variant={st.badge}>{st.label}</Badge>}
            {contagem.length > 0 && <span className="text-xs text-muted-foreground">{contagem.join(' · ')}</span>}
          </div>
          {summary && <ExpandableText text={summary} className="text-sm text-muted-foreground mt-0.5" clampLines={2} />}
        </div>
      </div>

      {/* Pontos a conferir, do mais grave ao menos grave */}
      {temLista && (
        <ul className="border-t border-border divide-y divide-border">
          {difalPendente && <DifalPendenteLinha />}
          {(alertas_nota || []).map((alerta) => (
            <li key={alerta} className="flex gap-3 px-4 py-3">
              <div className="size-6 rounded-md flex items-center justify-center shrink-0 bg-warning-subtle text-warning-text">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <ExpandableText text={alerta} className="text-sm text-foreground" clampLines={2} />
            </li>
          ))}
          {visiveis.map((r, i) => <ReasonRow key={`${r.rule_code}-${i}`} r={r} />)}
        </ul>
      )}

      {informativos.length > 0 && (
        <button
          type="button"
          onClick={() => setMostrarInfo((v) => !v)}
          className="w-full flex items-center justify-center gap-1 border-t border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          {mostrarInfo
            ? <>Ocultar informativos <ChevronUp className="h-3.5 w-3.5" /></>
            : <>Mostrar {informativos.length} {informativos.length === 1 ? 'informativo' : 'informativos'} <ChevronDown className="h-3.5 w-3.5" /></>}
        </button>
      )}
    </div>
  )
}
