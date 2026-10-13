import React, { useState } from 'react'
import {
  FolderArchive,
  Zap,
  FileCheck2,
  Network,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
  WifiOff,
  ChevronRight,
} from 'lucide-react'
import { Badge, Card, IconButton } from '@bhubai/bhub-design-system'
import TrackingNotasPanel from './TrackingNotasPanel'

/**
 * Cards "Origem das Notas vs. BHules". Conciliação por chave; cada número abre o
 * drill-down (TrackingNotasPanel) com as notas que o compõem (spec TRK-12..17).
 */

function getChannelIcon(channelId) {
  switch (channelId) {
    case 'gdocs_triagem':
      return <FolderArchive className="w-5 h-5 text-warning-text" />
    case 'jettax_integrador':
      return <Zap className="w-5 h-5 text-info-text" />
    case 'unecont_tomados':
      return <FileCheck2 className="w-5 h-5 text-info-text" />
    case 'outros_integrador':
      return <Network className="w-5 h-5 text-success-text" />
    default:
      return <FolderArchive className="w-5 h-5 text-muted-foreground" />
  }
}

function getCardStyle(status) {
  switch (status) {
    case 'REPRESADO':
      return 'border-warning-border bg-warning-subtle'
    case 'INDISPONIVEL':
    case 'NAO_INTEGRADO':
      return 'border-border bg-muted/40'
    case 'DIVERGENTE':
      return 'border-info-border bg-info-subtle'
    case 'SINCRONIZADO':
    default:
      return 'border-border bg-muted/30 hover:border-border'
  }
}

function getDetailColor(status) {
  switch (status) {
    case 'REPRESADO':
      return 'text-warning-text font-medium'
    case 'DIVERGENTE':
      return 'text-info-text font-medium'
    case 'INDISPONIVEL':
    case 'NAO_INTEGRADO':
      return 'text-muted-foreground font-medium'
    case 'SINCRONIZADO':
    default:
      return 'text-muted-foreground'
  }
}

function statusDe(canal) {
  return canal.status || (canal.represadas > 0 ? 'REPRESADO' : 'SINCRONIZADO')
}

function origemNavegavel(canal) {
  const st = statusDe(canal)
  return canal.upstream_disponivel !== false && st !== 'INDISPONIVEL' && st !== 'NAO_INTEGRADO'
}

/** Aba que faz sentido abrir a partir do badge do card. */
function abaDoBadge(canal) {
  switch (statusDe(canal)) {
    case 'REPRESADO':
      return 'so_origem'
    case 'DIVERGENTE':
      return (canal.so_bhules ?? 0) > 0 ? 'so_bhules' : 'em_ambos'
    case 'INDISPONIVEL':
    case 'NAO_INTEGRADO':
      return 'so_bhules'
    default:
      return 'em_ambos'
  }
}

function renderCardBadge(canal) {
  switch (statusDe(canal)) {
    case 'REPRESADO':
      return (
        <Badge variant="warning" className="px-2 text-[10px] font-semibold uppercase tracking-wide">
          {canal.represadas} {canal.represadas === 1 ? 'represada' : 'represadas'}
        </Badge>
      )
    case 'INDISPONIVEL':
      return (
        <Badge variant="secondary" className="px-2 text-[10px] font-semibold uppercase tracking-wide">
          INDISPONÍVEL
        </Badge>
      )
    case 'NAO_INTEGRADO':
      return (
        <Badge variant="secondary" className="px-2 text-[10px] font-semibold uppercase tracking-wide">
          NÃO INTEGRADO
        </Badge>
      )
    case 'DIVERGENTE':
      return (
        <Badge variant="info" className="px-2 text-[10px] font-semibold uppercase tracking-wide">
          DIVERGÊNCIA
        </Badge>
      )
    case 'SINCRONIZADO':
    default:
      return (
        <Badge variant="success" className="px-2 text-[10px] font-semibold uppercase tracking-wide">
          OK
        </Badge>
      )
  }
}

function renderResumoBadge(resumo) {
  const statusGeral = resumo?.status_geral || (resumo?.total_represadas > 0 ? 'REPRESADO' : 'SINCRONIZADO')

  if (statusGeral === 'REPRESADO') {
    const total = resumo?.total_represadas ?? 0
    return (
      <Badge variant="warning" className="gap-1.5 px-2.5 py-1 text-xs font-semibold">
        <AlertTriangle className="w-3.5 h-3.5" />
        {total} {total === 1 ? 'nota represada' : 'notas represadas'}
      </Badge>
    )
  }
  if (statusGeral === 'INDISPONIVEL') {
    return (
      <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs font-semibold">
        <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
        Origens parcialmente offline
      </Badge>
    )
  }
  if (statusGeral === 'DIVERGENTE') {
    return (
      <Badge variant="info" className="gap-1.5 px-2.5 py-1 text-xs font-semibold">
        <Info className="w-3.5 h-3.5" />
        Divergência detectada
      </Badge>
    )
  }
  return (
    <Badge variant="success" className="gap-1.5 px-2.5 py-1 text-xs font-semibold">
      <CheckCircle className="w-3.5 h-3.5" />
      Nenhuma nota represada
    </Badge>
  )
}

function formatCompetencia(comp) {
  const c = String(comp || '').replace(/[-/]/g, '')
  return c.length >= 6 ? `${c.slice(4, 6)}/${c.slice(0, 4)}` : comp
}

function NumeroClicavel({ label, valor, onClick, title }) {
  const exibido = valor === null || valor === undefined ? '—' : valor
  const conteudo = (
    <>
      <span className="block text-[10px] uppercase font-semibold text-muted-foreground">{label}</span>
      <span className="text-lg font-bold text-foreground inline-flex items-center gap-1">
        {exibido}
        {onClick && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary" />}
      </span>
    </>
  )
  if (!onClick) {
    return <div title={title}>{conteudo}</div>
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="group text-left w-full rounded -m-1 p-1 hover:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary"
    >
      {conteudo}
    </button>
  )
}

export function TrackingOrigensCards({
  trackingData,
  loading = false,
  onRefresh,
  companyId,
  competencia,
  onOpenInvoice,
}) {
  // { canal: {canal, nome}, aba } do drill-down aberto
  const [drill, setDrill] = useState(null)

  if (!trackingData && !loading) return null

  if (!trackingData && loading) {
    return (
      <Card padding="none" className="p-5 gap-4 mb-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="h-5 bg-border rounded w-64"></div>
          <div className="h-6 bg-border rounded-full w-36"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-border rounded-md"></div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-border rounded w-24"></div>
                    <div className="h-2.5 bg-border rounded w-32"></div>
                  </div>
                </div>
                <div className="h-4 bg-border rounded w-12"></div>
              </div>
              <div className="h-14 bg-border/60 rounded"></div>
              <div className="h-3 bg-border rounded w-48"></div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const canais = trackingData?.canais || []
  const resumo = trackingData?.resumo
  const compExibida = formatCompetencia(trackingData?.competencia || competencia)
  const drillAtivo = Boolean(companyId)

  const abrir = (canal, aba) => {
    if (!drillAtivo) return
    setDrill({ canal: { canal: canal.canal, nome: canal.nome }, aba })
  }

  return (
    <Card padding="none" className="p-5 gap-4 mb-6">
      {/* Header da Seção de Tracking */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Origem das Notas vs. BHules (Tracking de Represamento)
          </h3>
          <Badge variant="secondary" className="px-2 text-[10px] font-semibold uppercase">
            Competência {compExibida}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {renderResumoBadge(resumo)}

          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="text-muted-foreground"
            title="Recarregar tracking de origens"
            aria-label="Recarregar tracking de origens"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </IconButton>
        </div>
      </div>

      {/* Grid com os cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {canais.map((canal) => {
          const status = statusDe(canal)
          const podeOrigem = drillAtivo && origemNavegavel(canal) && Boolean(canal.canal)
          const podeBhules = drillAtivo && Boolean(canal.canal)
          const emAmbos = canal.em_ambos ?? 0

          return (
            <div
              key={canal.id}
              className={`p-4 rounded-lg border transition-all ${getCardStyle(status)}`}
            >
              {/* Topo do Card */}
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 rounded-md bg-card border border-border shadow-sm shrink-0">
                    {getChannelIcon(canal.id)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-foreground leading-tight">
                      {canal.nome}
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {canal.descricao}
                    </p>
                  </div>
                </div>

                {podeBhules ? (
                  <button
                    type="button"
                    onClick={() => abrir(canal, abaDoBadge(canal))}
                    title="Ver as notas"
                    className="shrink-0 rounded hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {renderCardBadge(canal)}
                  </button>
                ) : (
                  <span className="shrink-0">{renderCardBadge(canal)}</span>
                )}
              </div>

              {/* Comparativo de Números */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-card rounded border border-border/60 mb-2">
                <NumeroClicavel
                  label="Na Origem"
                  valor={canal.repo_original}
                  onClick={podeOrigem ? () => abrir(canal, (canal.represadas ?? 0) > 0 ? 'so_origem' : 'em_ambos') : undefined}
                  title={podeOrigem ? 'Ver as notas da origem' : undefined}
                />
                <div className="border-l pl-2 border-border">
                  <NumeroClicavel
                    label="No BHules"
                    valor={canal.no_bhules ?? 0}
                    onClick={podeBhules ? () => abrir(canal, (canal.so_bhules ?? 0) > 0 ? 'so_bhules' : 'em_ambos') : undefined}
                    title={podeBhules ? 'Ver as notas do BHules' : undefined}
                  />
                </div>
              </div>

              {/* Em ambos / divergentes */}
              {podeBhules && emAmbos > 0 && (
                <button
                  type="button"
                  onClick={() => abrir(canal, 'em_ambos')}
                  className="text-[11px] text-muted-foreground hover:text-primary underline-offset-2 hover:underline mb-1"
                >
                  {emAmbos} em ambos
                  {(canal.divergentes ?? 0) > 0 && ` · ${canal.divergentes} com dt_doc em outra competência`}
                  {(canal.outra_origem ?? 0) > 0 && ` · ${canal.outra_origem} gravadas com outra origem`}
                </button>
              )}

              {/* Detalhe / Alerta */}
              {canal.detalhe && (
                <div className="text-[11px] flex items-start gap-1.5 mt-1">
                  <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className={getDetailColor(status)}>
                    {canal.detalhe}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <TrackingNotasPanel
        open={Boolean(drill)}
        onClose={() => setDrill(null)}
        companyId={companyId}
        competencia={trackingData?.competencia || competencia}
        canal={drill?.canal}
        abaInicial={drill?.aba || 'so_origem'}
        onOpenInvoice={onOpenInvoice}
      />
    </Card>
  )
}

export default TrackingOrigensCards
