import { useState, useEffect } from 'react'
import { Stethoscope, AlertTriangle, TrendingUp, ShoppingCart, Bot, RefreshCw, ChevronDown, ChevronUp, FileText, Package, DollarSign, Loader2, Sparkles } from 'lucide-react'
import { Button, Tooltip, TooltipTrigger, TooltipContent, Badge, Table, TableBody, TableRow, TableCell } from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { useDiagnosis, useGenerateDiagnosis, useGenerateNarrative } from '../../hooks/useDiagnosis'
import CompanySearchSelect from '../shared/CompanySearchSelect'

function fmt(n) { return (n || 0).toLocaleString('pt-BR') }
function fmtR(n) { return `R$ ${(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

const SEVERITY_STYLES = {
  CRITICO: { bg: 'bg-destructive-subtle', border: 'border-destructive-border', text: 'text-destructive-text', badge: 'bg-destructive-subtle text-destructive-text' },
  ALERTA: { bg: 'bg-warning-subtle', border: 'border-warning-border', text: 'text-warning-text', badge: 'bg-warning-subtle text-warning-text' },
  INFORMATIVO: { bg: 'bg-info-subtle', border: 'border-info-border', text: 'text-info-text', badge: 'bg-info-subtle text-info-text' },
}

const CATEGORY_STYLES = {
  CREDITO: { badge: 'bg-success-subtle text-success-text', label: 'Credito' },
  RECLASSIFICACAO: { badge: 'bg-magic-subtle text-magic-bold', label: 'Reclassificacao' },
  RESSARCIMENTO: { badge: 'bg-info-subtle text-info-text', label: 'Ressarcimento' },
  BENEFICIO: { badge: 'bg-mizu-flow-subtle text-mizu-flow-bold', label: 'Beneficio' },
}

// Semantic color tokens for Kpi/HBar accents — no hardcoded hex.
const COLOR_STYLES = {
  info: { bg: 'bg-info-subtle', text: 'text-info-text', bar: 'bg-info' },
  success: { bg: 'bg-success-subtle', text: 'text-success-text', bar: 'bg-success' },
  warning: { bg: 'bg-warning-subtle', text: 'text-warning-text', bar: 'bg-warning' },
  magic: { bg: 'bg-magic-subtle', text: 'text-magic-bold', bar: 'bg-magic-bold' },
  dojoSteel: { bg: 'bg-dojo-steel-subtle', text: 'text-dojo-steel-bold', bar: 'bg-dojo-steel-bold' },
}

function Kpi({ icon: Icon, label, value, sub, color = 'info' }) {
  const s = COLOR_STYLES[color] || COLOR_STYLES.info
  return (
    <div className="bg-card rounded border border-border shadow-sm px-4 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded flex items-center justify-center ${s.bg}`}>
        <Icon className={`w-4 h-4 ${s.text}`} />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold text-foreground leading-tight tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground leading-tight">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function AlertCard({ alert }) {
  const [expanded, setExpanded] = useState(false)
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.INFORMATIVO
  return (
    <div className={`${style.bg} border ${style.border} rounded p-4`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-4 h-4 ${style.text} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={style.badge}>{alert.severity}</Badge>
            <span className="text-sm font-semibold text-foreground">{alert.title}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
          {alert.impact_monthly_brl > 0 && (
            <p className="text-sm font-semibold text-foreground mt-1">Impacto estimado: {fmtR(alert.impact_monthly_brl)}/mes</p>
          )}
          {expanded && (
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              {alert.recommended_action && <p><span className="font-medium">Acao:</span> {alert.recommended_action}</p>}
              {alert.base_legal && <p><span className="font-medium">Base legal:</span> {alert.base_legal}</p>}
              {alert.affected_items > 0 && <p>Itens afetados: {fmt(alert.affected_items)} | Notas: {fmt(alert.affected_invoices)}</p>}
            </div>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton
              aria-label={expanded ? 'Recolher detalhes' : 'Expandir detalhes'}
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>{expanded ? 'Recolher detalhes' : 'Expandir detalhes'}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

function OpportunityCard({ opp }) {
  const [expanded, setExpanded] = useState(false)
  const catStyle = CATEGORY_STYLES[opp.category] || CATEGORY_STYLES.CREDITO
  return (
    <div className="bg-card border border-border rounded p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <TrendingUp className="w-4 h-4 text-success-text mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={catStyle.badge}>{catStyle.label}</Badge>
            <span className="text-sm font-semibold text-foreground">{opp.title}</span>
            <span className="ml-auto text-base font-semibold text-success-text tabular-nums whitespace-nowrap">{fmtR(opp.impact_monthly_brl)}/mes</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{opp.description}</p>
          {expanded && (
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              {opp.recommended_action && <p><span className="font-medium">Acao recomendada:</span> {opp.recommended_action}</p>}
              {opp.base_legal && <p><span className="font-medium">Base legal:</span> {opp.base_legal}</p>}
              {opp.affected_items > 0 && <p>Itens afetados: {fmt(opp.affected_items)}</p>}
              {opp.top_ncms?.length > 0 && <p>NCMs: {opp.top_ncms.join(', ')}</p>}
            </div>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton
              aria-label={expanded ? 'Recolher detalhes' : 'Expandir detalhes'}
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>{expanded ? 'Recolher detalhes' : 'Expandir detalhes'}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

function HBar({ data, labelKey, valueKey, title, color = 'info', formatValue = fmt }) {
  if (!data || data.length === 0) return null
  const maxVal = Math.max(...data.map(d => d[valueKey] || 0), 1)
  const s = COLOR_STYLES[color] || COLOR_STYLES.info
  return (
    <div className="min-w-0">
      <h4 className="text-sm font-semibold text-foreground mb-2">{title}</h4>
      <div className="space-y-1.5">
        {data.slice(0, 8).map((d, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <div className="w-28 text-xs text-muted-foreground truncate shrink-0" title={d[labelKey]}>{d[labelKey] || '-'}</div>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div className={`h-full rounded-full opacity-70 ${s.bar}`} style={{ width: `${(d[valueKey] / maxVal) * 100}%` }} />
            </div>
            <div className="w-16 text-xs tabular-nums text-foreground text-right">{formatValue(d[valueKey])}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CollapsibleSection({ title, icon: Icon, count, badge, badgeColor = 'text-muted-foreground', defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-2 group">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />} {title}
          {count !== undefined && <span className="text-xs font-normal text-muted-foreground">({count})</span>}
          {badge && <span className={`text-sm font-semibold ${badgeColor}`}>{badge}</span>}
        </h3>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  )
}

export default function CompanyDiagnosis() {
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')

  useEffect(() => { api.getCompanies().then(setCompanies).catch(() => {}) }, [])

  const { data: diag, isLoading } = useDiagnosis(selectedCompanyId || null)
  const generateMutation = useGenerateDiagnosis()
  const narrativeMutation = useGenerateNarrative()

  const [narrativeOpen, setNarrativeOpen] = useState(false)

  const isReady = diag?.status === 'READY'
  const isComputing = diag?.status === 'COMPUTING'
  const alertas = diag?.alertas || []
  const oportunidades = diag?.oportunidades || []
  const perfil = diag?.perfil_compras

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-muted flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Diagnostico Fiscal</h1>
          <p className="text-sm text-muted-foreground mt-1">Analise de oportunidades e alertas por cliente</p>
        </div>
        <div className="flex items-center gap-2">
          <CompanySearchSelect companies={companies} selected={selectedCompanyId} onChange={setSelectedCompanyId} />
          {selectedCompanyId && (
            <Button
              variant="success"
              size="sm"
              onClick={() => generateMutation.mutate({ companyId: selectedCompanyId, periodMonths: 6 })}
              disabled={isComputing || generateMutation.isPending}
            >
              {(isComputing || generateMutation.isPending) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {isComputing ? 'Gerando...' : 'Gerar Diagnostico'}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 pb-10 space-y-5">

        {!selectedCompanyId && (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center text-muted-foreground">
              <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecione uma empresa para gerar o diagnostico fiscal</p>
            </div>
          </div>
        )}

        {selectedCompanyId && isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
          </div>
        )}

        {selectedCompanyId && isComputing && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-success-text animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Gerando diagnostico... isso pode levar alguns segundos</span>
          </div>
        )}

        {selectedCompanyId && diag?.status === 'PENDING' && !isComputing && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center text-muted-foreground">
              <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum diagnostico gerado ainda</p>
              <p className="text-xs mt-1">Clique em "Gerar Diagnostico" para analisar os ultimos 6 meses</p>
            </div>
          </div>
        )}

        {selectedCompanyId && diag?.status === 'ERROR' && (
          <div className="bg-destructive-subtle border border-destructive-border rounded p-4 text-sm text-destructive-text">
            Erro ao gerar diagnostico: {diag.error_message || 'Erro desconhecido'}
          </div>
        )}

        {isReady && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <Kpi icon={DollarSign} label="Economia Potencial/Mes" value={fmtR(diag.total_saving_monthly)} color="success" />
              <Kpi icon={AlertTriangle} label="Alertas" value={alertas.length} color="warning" />
              <Kpi icon={TrendingUp} label="Oportunidades" value={oportunidades.length} color="success" />
              <Kpi icon={FileText} label="Notas Analisadas" value={fmt(diag.invoices_analyzed)} color="info" />
              <Kpi icon={Package} label="Itens Analisados" value={fmt(diag.items_analyzed)} color="magic" />
            </div>

            {/* AI Narrative */}
            <div className="bg-card border border-border rounded shadow-sm">
              <button
                onClick={() => setNarrativeOpen(!narrativeOpen)}
                className="w-full px-5 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-magic-bold" />
                  <span className="text-sm font-semibold text-foreground">Resumo Executivo (AI)</span>
                </div>
                <div className="flex items-center gap-2">
                  {!diag.resumo_narrativo && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="bg-magic-subtle text-magic-bold hover:opacity-80 hover:bg-magic-subtle"
                      onClick={(e) => { e.stopPropagation(); narrativeMutation.mutate(selectedCompanyId); setNarrativeOpen(true) }}
                      disabled={narrativeMutation.isPending}
                    >
                      {narrativeMutation.isPending ? 'Gerando...' : 'Gerar com AI'}
                    </Button>
                  )}
                  {narrativeOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {narrativeOpen && (
                <div className="px-5 pb-4 border-t border-border">
                  {diag.resumo_narrativo ? (
                    <div className="text-sm text-foreground leading-relaxed mt-3 whitespace-pre-line">
                      {diag.resumo_narrativo}
                    </div>
                  ) : narrativeMutation.isPending ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Gerando resumo com AI...
                    </div>
                  ) : (
                    <p className="py-4 text-sm text-muted-foreground">Clique em "Gerar com AI" para criar o resumo executivo</p>
                  )}
                </div>
              )}
            </div>

            {/* Alerts */}
            {alertas.length > 0 && (
              <CollapsibleSection title="Alertas" icon={AlertTriangle} count={alertas.length} defaultOpen={false}>
                {alertas.map((a, i) => <AlertCard key={i} alert={a} />)}
              </CollapsibleSection>
            )}

            {/* Opportunities */}
            {oportunidades.length > 0 && (
              <CollapsibleSection
                title="Oportunidades"
                icon={TrendingUp}
                count={oportunidades.length}
                badge={`Total: ${fmtR(diag.total_saving_monthly)}/mes`}
                badgeColor="text-success-text"
                defaultOpen={false}
              >
                {oportunidades.map((o, i) => <OpportunityCard key={i} opp={o} />)}
              </CollapsibleSection>
            )}

            {/* Purchase Profile */}
            {perfil && (
              <div className="bg-card border border-border rounded shadow-sm p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" /> Perfil de Compras
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {perfil.regime_tributario} | {perfil.atividade_principal} | {fmt(perfil.total_invoices)} notas | {fmt(perfil.total_items)} itens
                  </span>
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HBar data={perfil.top_suppliers} labelKey="name" valueKey="value" title="Top Fornecedores (R$)" color="info" formatValue={fmtR} />
                  <HBar data={perfil.top_ncms} labelKey="ncm" valueKey="items" title="Top NCMs (qtd itens)" color="magic" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <HBar data={perfil.cfop_distribution} labelKey="cfop" valueKey="count" title="Distribuicao CFOP" color="dojoSteel" />
                  {perfil.credit_summary && (
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground mb-2">Resumo de Creditos</h4>
                      <Table className="text-xs">
                        <TableBody>
                          {[
                            ['ICMS', perfil.credit_summary.icms],
                            ['PIS', perfil.credit_summary.pis],
                            ['COFINS', perfil.credit_summary.cofins],
                            ['IPI', perfil.credit_summary.ipi],
                          ].map(([label, val]) => (
                            <TableRow key={label}>
                              <TableCell className="py-1.5 px-0 font-medium text-foreground">{label}</TableCell>
                              <TableCell className="py-1.5 px-0 text-right tabular-nums text-foreground">{fmtR(val)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t border-border">
                            <TableCell className="py-2 px-0 font-semibold text-foreground">Total</TableCell>
                            <TableCell className="py-2 px-0 text-right tabular-nums font-semibold text-foreground">{fmtR(perfil.credit_summary.total)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Computed at */}
            {diag.computed_at && (
              <p className="text-xs text-muted-foreground text-center">
                Diagnostico gerado em {new Date(diag.computed_at).toLocaleString('pt-BR')} | Periodo: {diag.period_start} a {diag.period_end}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
