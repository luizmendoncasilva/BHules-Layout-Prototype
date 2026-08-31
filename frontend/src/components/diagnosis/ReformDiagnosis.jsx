import { useState, useEffect } from 'react'
import { Scale, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp, Loader2, Sparkles, DollarSign, Users, Calendar, AlertTriangle, Settings2, Info } from 'lucide-react'
import {
  Badge, Button, IconButton, Tooltip, TooltipTrigger, TooltipContent,
  Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { useReformDiagnosis, useGenerateReformDiagnosis, useGenerateReformNarrative } from '../../hooks/useReformDiagnosis'
import CompanySearchSelect from '../shared/CompanySearchSelect'

function fmt(n) { return (n || 0).toLocaleString('pt-BR') }
function fmtR(n) { return `R$ ${(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
function fmtPct(n) { return `${(n || 0).toFixed(1)}%` }

const REC_STYLES = {
  MANTER: { variant: 'success', label: 'Manter' },
  NEGOCIAR: { variant: 'warning', label: 'Negociar' },
  SUBSTITUIR: { variant: 'destructive', label: 'Substituir' },
}

const REGIME_LABELS = {
  SIMPLES: 'Simples Nacional',
  SIMPLES_NACIONAL: 'Simples Nacional',
  LUCRO_REAL: 'Lucro Real',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  MEI: 'MEI',
}

// ---------------------------------------------------------------------------
// FonteBadge: fonte indicator (concreto / estimativa / input)
// ---------------------------------------------------------------------------
function FonteBadge({ type }) {
  const styles = {
    concreto:   { variant: 'success',   dot: 'bg-success', label: 'Concreto' },
    estimativa: { variant: 'warning',   dot: 'bg-warning', label: 'Estimativa' },
    input:      { variant: 'info',      dot: 'bg-info',    label: 'Informado' },
  }
  const s = styles[type] || styles.estimativa
  return (
    <Badge variant={s.variant}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------
function CollapsibleSection({ title, defaultOpen = false, children, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-card rounded border border-border shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-3 flex items-center justify-between text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-4 border-t border-border">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tax row helper
// ---------------------------------------------------------------------------
function TaxRow({ label, value, fonte, bold = false, negative = false }) {
  const color = negative ? 'text-success-text' : 'text-foreground'
  return (
    <tr className={bold ? 'border-t-2 border-border' : 'border-b border-border'}>
      <td className={`py-1.5 ${bold ? 'font-semibold text-foreground' : 'font-medium text-foreground'} text-sm`}>{label}</td>
      <td className={`py-1.5 text-right tabular-nums text-sm ${bold ? 'font-semibold' : ''} ${color}`}>
        {fmtR(value)}/mes
      </td>
      <td className="py-1.5 pl-2">
        {fonte && <FonteBadge type={fonte} />}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ReformDiagnosis() {
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [targetYear, setTargetYear] = useState(2027)

  // Optional inputs
  const [showInputs, setShowInputs] = useState(false)
  const [faturamentoMensal, setFaturamentoMensal] = useState('')
  const [dasMensal, setDasMensal] = useState('')
  const [folhaMensal, setFolhaMensal] = useState('')
  const [anexoSimples, setAnexoSimples] = useState('')

  useEffect(() => { api.getCompanies().then(setCompanies).catch(() => {}) }, [])

  const { data: diag, isLoading } = useReformDiagnosis(selectedCompanyId || null)
  const generateMutation = useGenerateReformDiagnosis()
  const narrativeMutation = useGenerateReformNarrative()
  const [narrativeOpen, setNarrativeOpen] = useState(false)

  const isReady = diag?.status === 'READY'
  const isComputing = diag?.status === 'COMPUTING'
  const ctx = diag?.context_data
  const taxImpact = diag?.tax_impact
  const suppliers = diag?.supplier_analysis || []
  const regime = diag?.regime_recommendation
  const timeline = diag?.transition_timeline || []

  const handleGenerate = () => {
    generateMutation.mutate({
      companyId: selectedCompanyId,
      targetYear,
      periodMonths: 6,
      folhaMensal: folhaMensal || null,
      faturamentoMensal: faturamentoMensal || null,
      dasMensal: dasMensal || null,
      anexoSimples: anexoSimples || null,
    })
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-border bg-muted flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Diagnostico Reforma Tributaria</h1>
          <p className="text-sm text-muted-foreground mt-1">Simulacao de impacto IBS/CBS com base no historico fiscal</p>
        </div>
        <div className="flex items-center gap-2">
          <CompanySearchSelect companies={companies} selected={selectedCompanyId} onChange={setSelectedCompanyId} />
          <Select value={String(targetYear)} onValueChange={(v) => setTargetYear(Number(v))}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2027, 2028, 2029, 2030, 2031, 2032, 2033].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCompanyId && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconButton
                    aria-label="Parametros opcionais"
                    variant={showInputs ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setShowInputs(!showInputs)}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent>Parametros opcionais</TooltipContent>
              </Tooltip>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={isComputing || generateMutation.isPending}
              >
                {(isComputing || generateMutation.isPending) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {isComputing ? 'Gerando...' : 'Gerar Diagnostico'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Optional Inputs (collapsible) ──────────────────────────── */}
      {showInputs && selectedCompanyId && (
        <div className="px-6 py-3 bg-card border-b border-border flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-muted-foreground uppercase mb-1">Faturamento mensal (R$)</label>
            <Input type="number" value={faturamentoMensal} onChange={e => setFaturamentoMensal(e.target.value)}
              placeholder="0,00" className="w-36 text-right" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground uppercase mb-1">Valor DAS mensal (R$)</label>
            <Input type="number" value={dasMensal} onChange={e => setDasMensal(e.target.value)}
              placeholder="0,00" className="w-36 text-right" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground uppercase mb-1">Folha pagamento (R$)</label>
            <Input type="number" value={folhaMensal} onChange={e => setFolhaMensal(e.target.value)}
              placeholder="0,00" className="w-36 text-right" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground uppercase mb-1">Anexo Simples</label>
            <Select value={anexoSimples || 'auto'} onValueChange={(v) => setAnexoSimples(v === 'auto' ? '' : v)}>
              <SelectTrigger className="h-9 text-sm w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="I">I</SelectItem>
                <SelectItem value="II">II</SelectItem>
                <SelectItem value="III">III</SelectItem>
                <SelectItem value="IV">IV</SelectItem>
                <SelectItem value="V">V</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground w-full">Valores informados sobrescrevem as estimativas automaticas. Deixe em branco para estimar.</p>
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 pb-10 space-y-5">
        {/* Empty state */}
        {!selectedCompanyId && (
          <div className="flex items-center justify-center py-20 text-center text-muted-foreground">
            <div><Scale className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">Selecione uma empresa para simular o impacto da reforma</p></div>
          </div>
        )}

        {/* Computing */}
        {selectedCompanyId && isComputing && (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 text-info-text animate-spin" /><span className="ml-2 text-sm text-muted-foreground">Calculando impacto da reforma...</span></div>
        )}

        {/* Pending */}
        {selectedCompanyId && diag?.status === 'PENDING' && !isComputing && (
          <div className="text-center py-20 text-muted-foreground">
            <Scale className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum diagnostico gerado.</p>
            <p className="text-xs text-muted-foreground mt-2">Clique em "Gerar Diagnostico" para iniciar a simulacao.</p>
          </div>
        )}

        {/* Error */}
        {selectedCompanyId && diag?.status === 'ERROR' && (
          <div className="text-center py-20 text-destructive-text">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm text-destructive-text">Erro ao gerar diagnostico</p>
            <p className="text-xs text-destructive-text/70 mt-1">{diag.error_message || 'Tente gerar novamente'}</p>
          </div>
        )}

        {/* ── READY state ─────────────────────────────────────────── */}
        {isReady && (
          <>
            {/* ── Section 0: Context Card ─────────────────────────── */}
            {ctx && (
              <div className="bg-muted border border-border rounded px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contexto da Analise</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-muted-foreground">Periodo:</span> <span className="text-foreground font-medium">{ctx.period_start} a {ctx.period_end} ({ctx.period_months} meses)</span></div>
                  <div><span className="text-muted-foreground">NFs Entrada:</span> <span className="text-foreground font-medium">{fmt(ctx.total_nfs_entrada)}</span></div>
                  <div><span className="text-muted-foreground">Itens:</span> <span className="text-foreground font-medium">{fmt(ctx.total_itens)}</span></div>
                  <div><span className="text-muted-foreground">Volume Compras:</span> <span className="text-foreground font-medium">{fmtR(ctx.volume_compras_total)}</span></div>
                  <div><span className="text-muted-foreground">Compras/Mes:</span> <span className="text-foreground font-medium">{fmtR(ctx.volume_compras_mensal)}</span></div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Faturamento/Mes:</span>
                    <span className="text-foreground font-medium">{fmtR(ctx.faturamento_mensal)}</span>
                    <FonteBadge type={ctx.faturamento_fonte === 'informado' ? 'input' : ctx.faturamento_fonte === 'concreto' ? 'concreto' : 'estimativa'} />
                  </div>
                  <div><span className="text-muted-foreground">Regime:</span> <span className="text-foreground font-medium">{REGIME_LABELS[ctx.regime] || ctx.regime}</span></div>
                  <div><span className="text-muted-foreground">Atividade:</span> <span className="text-foreground font-medium">{ctx.atividade}</span></div>
                  <div><span className="text-muted-foreground">UF:</span> <span className="text-foreground font-medium">{ctx.uf}</span></div>
                  <div><span className="text-muted-foreground">Fornecedores:</span> <span className="text-foreground font-medium">{fmt(ctx.fornecedores_distintos)}</span></div>
                </div>
              </div>
            )}

            {/* ── AI Narrative ─────────────────────────────────────── */}
            <div className="bg-card border border-border rounded shadow-sm">
              <button onClick={() => setNarrativeOpen(!narrativeOpen)} className="w-full px-5 py-3 flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-magic-bold" />
                  <span className="text-sm font-semibold text-foreground">Resumo Executivo (AI)</span>
                </div>
                <div className="flex items-center gap-2">
                  {!diag.narrative && (
                    <button onClick={e => { e.stopPropagation(); narrativeMutation.mutate(selectedCompanyId); setNarrativeOpen(true) }}
                      disabled={narrativeMutation.isPending}
                      className="text-xs px-2 py-1 bg-magic-subtle text-magic-bold rounded hover:opacity-80 disabled:opacity-50">
                      {narrativeMutation.isPending ? 'Gerando...' : 'Gerar com AI'}
                    </button>
                  )}
                  {narrativeOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {narrativeOpen && (
                <div className="px-5 pb-4 border-t border-border">
                  {diag.narrative ? (
                    <div className="text-sm text-foreground leading-relaxed mt-3 whitespace-pre-line">{diag.narrative}</div>
                  ) : narrativeMutation.isPending ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Gerando com AI...</div>
                  ) : (
                    <p className="py-4 text-sm text-muted-foreground">Clique em "Gerar com AI" para criar o resumo</p>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 1: Tax Impact — 3 columns ───────────────── */}
            {taxImpact && (
              <CollapsibleSection title="Impacto Tributario Comparativo" defaultOpen={true}>
                <div className="mt-3">
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow className="border-b-2 border-border">
                        <TableHead className="text-left py-2 px-0 h-auto text-xs normal-case font-semibold w-1/4">Tributo</TableHead>
                        <TableHead className="text-right py-2 px-0 h-auto text-xs normal-case font-semibold w-1/4 text-info-text">Hoje ({REGIME_LABELS[taxImpact.hoje?.regime] || taxImpact.hoje?.regime})</TableHead>
                        <TableHead className="text-right py-2 px-0 h-auto text-xs normal-case font-semibold w-1/4 text-warning-text">Reforma (mesmo regime)</TableHead>
                        <TableHead className="text-right py-2 px-0 h-auto text-xs normal-case font-semibold w-1/4 text-success-text">Reforma (Lucro Real)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Hoje column items */}
                      {taxImpact.hoje?.regime?.includes('SIMPLES') ? (
                        <>
                          <TaxImpactRow label="DAS mensal" hoje={taxImpact.hoje?.das_mensal} fonteHoje={taxImpact.hoje?.fonte} />
                          <TaxImpactRow label="  ICMS (% do DAS)" hoje={taxImpact.hoje?.icms_pct_das != null ? `${taxImpact.hoje.icms_pct_das}%` : null} isText />
                          <TaxImpactRow label="  PIS (% do DAS)" hoje={taxImpact.hoje?.pis_pct_das != null ? `${taxImpact.hoje.pis_pct_das}%` : null} isText />
                          <TaxImpactRow label="  COFINS (% do DAS)" hoje={taxImpact.hoje?.cofins_pct_das != null ? `${taxImpact.hoje.cofins_pct_das}%` : null} isText />
                        </>
                      ) : (
                        <>
                          <TaxImpactRow label="ICMS" hoje={taxImpact.hoje?.icms} fonteHoje={taxImpact.hoje?.fonte} />
                          <TaxImpactRow label="PIS" hoje={taxImpact.hoje?.pis} fonteHoje={taxImpact.hoje?.fonte} />
                          <TaxImpactRow label="COFINS" hoje={taxImpact.hoje?.cofins} fonteHoje={taxImpact.hoje?.fonte} />
                        </>
                      )}
                      <TaxImpactRow label="IBS"
                        reforma={taxImpact.reforma_mesmo_regime?.ibs}
                        lucroReal={taxImpact.reforma_lucro_real?.ibs}
                        fonteReforma={taxImpact.reforma_mesmo_regime?.fonte}
                        fonteLR={taxImpact.reforma_lucro_real?.fonte}
                      />
                      <TaxImpactRow label="CBS"
                        reforma={taxImpact.reforma_mesmo_regime?.cbs}
                        lucroReal={taxImpact.reforma_lucro_real?.cbs}
                        fonteReforma={taxImpact.reforma_mesmo_regime?.fonte}
                        fonteLR={taxImpact.reforma_lucro_real?.fonte}
                      />
                      <TaxImpactRow label="ICMS residual"
                        reforma={taxImpact.reforma_mesmo_regime?.icms_residual}
                        lucroReal={taxImpact.reforma_lucro_real?.icms_estimado}
                        fonteLR={taxImpact.reforma_lucro_real?.fonte}
                      />
                      <TaxImpactRow label="PIS"
                        lucroReal={taxImpact.reforma_lucro_real?.pis}
                        fonteLR={taxImpact.reforma_lucro_real?.fonte}
                      />
                      <TaxImpactRow label="COFINS"
                        lucroReal={taxImpact.reforma_lucro_real?.cofins}
                        fonteLR={taxImpact.reforma_lucro_real?.fonte}
                      />

                      {/* Credits */}
                      <TableRow><TableCell colSpan={4} className="pt-3 pb-1 px-0 text-xs text-muted-foreground uppercase font-semibold tracking-wider">Creditos</TableCell></TableRow>
                      <TaxImpactRow label="Credito ICMS"
                        hoje={taxImpact.hoje?.credito_icms ? -taxImpact.hoje.credito_icms : 0}
                        lucroReal={taxImpact.reforma_lucro_real?.credito_icms ? -taxImpact.reforma_lucro_real.credito_icms : 0}
                        negative
                      />
                      <TaxImpactRow label="Credito PIS/COFINS"
                        hoje={taxImpact.hoje?.credito_pis_cofins ? -taxImpact.hoje.credito_pis_cofins : 0}
                        lucroReal={taxImpact.reforma_lucro_real?.credito_pis_cofins ? -taxImpact.reforma_lucro_real.credito_pis_cofins : 0}
                        negative
                      />
                      <TaxImpactRow label="Credito IBS/CBS"
                        reforma={taxImpact.reforma_mesmo_regime?.credito_ibs_cbs ? -taxImpact.reforma_mesmo_regime.credito_ibs_cbs : 0}
                        lucroReal={taxImpact.reforma_lucro_real?.credito_ibs_cbs_integral ? -taxImpact.reforma_lucro_real.credito_ibs_cbs_integral : 0}
                        negative
                      />

                      {/* Additional costs */}
                      <TableRow><TableCell colSpan={4} className="pt-3 pb-1 px-0 text-xs text-muted-foreground uppercase font-semibold tracking-wider">Custos Adicionais</TableCell></TableRow>
                      <TaxImpactRow label="INSS Patronal"
                        hoje={taxImpact.hoje?.inss_patronal}
                        lucroReal={taxImpact.reforma_lucro_real?.inss_patronal}
                      />
                      <TaxImpactRow label="Contabilidade"
                        lucroReal={taxImpact.reforma_lucro_real?.contabilidade}
                      />

                      {/* CUSTO LIQUIDO */}
                      <TableRow className="border-t-2 border-border bg-muted">
                        <TableCell className="py-2.5 px-0 font-semibold text-foreground text-sm">CUSTO LIQUIDO</TableCell>
                        <TableCell className="py-2.5 px-0 text-right tabular-nums font-semibold text-sm text-foreground">{fmtR(taxImpact.hoje?.custo_liquido)}/mes</TableCell>
                        <TableCell className="py-2.5 px-0 text-right tabular-nums font-semibold text-sm text-foreground">{fmtR(taxImpact.reforma_mesmo_regime?.custo_liquido)}/mes</TableCell>
                        <TableCell className={`py-2.5 px-0 text-right tabular-nums font-semibold text-sm ${(taxImpact.reforma_lucro_real?.custo_liquido || 0) < 0 ? 'text-success-text' : 'text-foreground'}`}>
                          {fmtR(taxImpact.reforma_lucro_real?.custo_liquido)}/mes
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {/* Delta summary */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <DeltaCard
                      label="Delta vs Hoje (mesmo regime)"
                      value={taxImpact.delta_vs_hoje_mesmo_regime}
                    />
                    <DeltaCard
                      label="Delta vs Hoje (Lucro Real)"
                      value={taxImpact.delta_vs_hoje_lucro_real}
                    />
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* ── Section 2: Supplier Analysis ────────────────────── */}
            {suppliers.length > 0 && (
              <CollapsibleSection title={`Analise por Fornecedor (${suppliers.length})`} defaultOpen={false}>
                <Table className="text-xs mt-3">
                  <TableHeader>
                    <TableRow className="text-muted-foreground uppercase text-xs">
                      <TableHead className="text-left py-1.5 px-0 h-auto normal-case font-normal">Fornecedor</TableHead>
                      <TableHead className="text-left py-1.5 px-0 h-auto normal-case font-normal">Regime</TableHead>
                      <TableHead className="text-right py-1.5 px-0 h-auto normal-case font-normal">Compras/Mes</TableHead>
                      <TableHead className="text-right py-1.5 px-0 h-auto normal-case font-normal">Credito Hoje</TableHead>
                      <TableHead className="text-right py-1.5 px-0 h-auto normal-case font-normal">Credito Reforma</TableHead>
                      <TableHead className="text-right py-1.5 px-0 h-auto normal-case font-normal">Delta</TableHead>
                      <TableHead className="text-center py-1.5 px-0 h-auto normal-case font-normal">Rec.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((s, i) => {
                      const rec = REC_STYLES[s.recommendation] || REC_STYLES.MANTER
                      return (
                        <TableRow key={i} className="hover:bg-accent/50">
                          <TableCell className="py-2 px-0 font-medium text-foreground max-w-xs">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block truncate">{s.name}</span>
                              </TooltipTrigger>
                              <TooltipContent>{s.name}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="py-2 px-0 text-muted-foreground">{REGIME_LABELS[s.regime] || s.regime || '-'}</TableCell>
                          <TableCell className="py-2 px-0 text-right tabular-nums text-foreground">{fmtR(s.purchase_monthly)}</TableCell>
                          <TableCell className="py-2 px-0 text-right tabular-nums text-foreground">
                            {s.credito_hoje_detalhe ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="border-b border-dotted border-border cursor-help">{fmtR(s.credito_hoje)}</span>
                                </TooltipTrigger>
                                <TooltipContent>{s.credito_hoje_detalhe}</TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="border-b border-dotted border-border">{fmtR(s.credito_hoje)}</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 px-0 text-right tabular-nums text-success-text font-medium">{fmtR(s.credito_reforma)}</TableCell>
                          <TableCell className={`py-2 px-0 text-right tabular-nums font-medium ${(s.credit_delta || 0) > 0 ? 'text-success-text' : (s.credit_delta || 0) < 0 ? 'text-destructive-text' : 'text-foreground'}`}>
                            {(s.credit_delta || 0) > 0 ? '+' : ''}{fmtR(s.credit_delta)}
                          </TableCell>
                          <TableCell className="py-2 px-0 text-center"><Badge variant={rec.variant}>{rec.label}</Badge></TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CollapsibleSection>
            )}

            {/* ── Section 3: Regime Recommendation — side by side ── */}
            {regime && (
              <CollapsibleSection title="Recomendacao de Regime" defaultOpen={true}>
                <div className="mt-3 space-y-4">
                  {/* Annual savings headline */}
                  {regime.annual_savings > 0 && (
                    <div className="flex items-center justify-between bg-success-subtle border border-success-border rounded p-3">
                      <span className="text-sm text-success-text font-medium">Economia anual estimada ao migrar para {REGIME_LABELS[regime.recommended_regime] || regime.recommended_regime}:</span>
                      <span className="text-lg font-semibold text-success-text">{fmtR(regime.annual_savings)}/ano</span>
                    </div>
                  )}

                  {/* INSS info */}
                  {regime.folha_mensal_estimada > 0 && (
                    <div className="text-sm text-foreground bg-warning-subtle border border-warning-border rounded p-3">
                      <strong>INSS Patronal (CPP):</strong> Folha estimada {fmtR(regime.folha_mensal_estimada)}/mes &rarr; INSS patronal {fmtR(regime.inss_patronal_mensal)}/mes.
                      {regime.current_regime?.includes('SIMPLES') && ' No Simples, a CPP esta embutida no DAS. Ao migrar, passa a pagar separadamente.'}
                    </div>
                  )}

                  {/* Side-by-side cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RegimeCard
                      regime={regime.simulation_current}
                      label={`Manter ${REGIME_LABELS[regime.current_regime] || regime.current_regime}`}
                      isRecommended={regime.recommended_regime === regime.current_regime}
                    />
                    <RegimeCard
                      regime={regime.simulation_alternative}
                      label={`Migrar para ${REGIME_LABELS[regime.simulation_alternative?.regime] || regime.simulation_alternative?.regime}`}
                      isRecommended={regime.recommended_regime === regime.simulation_alternative?.regime}
                    />
                  </div>

                  {/* Rationale */}
                  {regime.rationale && (
                    <p className="text-sm text-foreground leading-relaxed bg-muted rounded p-3 border border-border">{regime.rationale}</p>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* ── Section 4: Timeline ─────────────────────────────── */}
            {timeline.length > 0 && (
              <CollapsibleSection title="Timeline de Transicao (2026-2033)" defaultOpen={false}>
                <div className="mt-3 space-y-2">
                  {timeline.map((m, i) => {
                    const isTarget = m.year === diag.target_year
                    return (
                      <div key={i} className={`flex items-center gap-3 p-2 rounded ${isTarget ? 'bg-info-subtle border border-info-border' : ''}`}>
                        <div className={`w-12 text-center text-sm font-semibold ${isTarget ? 'text-info-text' : 'text-foreground'}`}>{m.year}</div>
                        <div className="flex-1">
                          <div className="text-sm text-foreground">{m.event}</div>
                          <div className="text-xs text-muted-foreground">CBS {m.cbs_rate}% | IBS {m.ibs_rate}% | ICMS -{m.icms_reduction_pct}%</div>
                        </div>
                        {m.company_impact && <div className="text-xs text-muted-foreground max-w-xs text-right">{m.company_impact}</div>}
                      </div>
                    )
                  })}
                </div>
              </CollapsibleSection>
            )}

            {/* Footer */}
            {diag.computed_at && (
              <p className="text-xs text-muted-foreground text-center">
                Gerado em {new Date(diag.computed_at).toLocaleString('pt-BR')} | Ano alvo: {diag.target_year}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TaxImpactRow: renders a row across the 3-column tax table
// ---------------------------------------------------------------------------
function TaxImpactRow({ label, hoje, reforma, lucroReal, fonteHoje, fonteReforma, fonteLR, negative = false, isText = false }) {
  // Skip row if all values are null/undefined/0
  const h = hoje ?? null
  const r = reforma ?? null
  const lr = lucroReal ?? null
  if (h === null && r === null && lr === null) return null

  const cellClass = `py-1.5 px-0 text-right tabular-nums text-sm ${negative ? 'text-success-text' : 'text-foreground'}`
  const formatCell = (val, fonte) => {
    if (val === null || val === undefined) return <TableCell className={cellClass}><span className="text-muted-foreground">-</span></TableCell>
    return (
      <TableCell className={cellClass}>
        <span className="inline-flex items-center gap-1 justify-end">
          {isText ? val : `${fmtR(val)}/mes`}
          {fonte && <FonteBadge type={fonte} />}
        </span>
      </TableCell>
    )
  }

  return (
    <TableRow>
      <TableCell className="py-1.5 px-0 text-sm font-medium text-foreground">{label}</TableCell>
      {formatCell(h, fonteHoje)}
      {formatCell(r, fonteReforma)}
      {formatCell(lr, fonteLR)}
    </TableRow>
  )
}

// ---------------------------------------------------------------------------
// DeltaCard: green/red card for delta values
// ---------------------------------------------------------------------------
function DeltaCard({ label, value }) {
  const v = value || 0
  const isNeg = v < 0
  return (
    <div className={`rounded p-3 text-center ${isNeg ? 'bg-success-subtle border border-success-border' : 'bg-destructive-subtle border border-destructive-border'}`}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${isNeg ? 'text-success-text' : 'text-destructive-text'}`}>
        {v > 0 ? '+' : ''}{fmtR(v)}/mes
      </div>
      <div className={`text-xs ${isNeg ? 'text-success-text' : 'text-destructive-text'}`}>
        {isNeg ? 'Economia' : 'Custo adicional'}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RegimeCard: side-by-side regime simulation card
// ---------------------------------------------------------------------------
function RegimeCard({ regime, label, isRecommended }) {
  if (!regime) return null

  const tributos = regime.tributos_sobre_venda || {}
  const creditos = regime.creditos_sobre_compra || {}
  const custos = regime.custos_adicionais || {}
  const naReforma = regime.na_reforma || {}

  return (
    <div className={`rounded border ${isRecommended ? 'border-info-border bg-info-subtle/30 ring-2 ring-info-border' : 'border-border bg-card'} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
        {isRecommended && (
          <span className="text-xs font-semibold px-2 py-0.5 bg-info-subtle text-info-text rounded-full uppercase">Recomendado</span>
        )}
      </div>

      {/* Tributos sobre venda */}
      <div className="mb-3">
        <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Tributos sobre venda</div>
        <Table className="text-xs">
          <TableBody>
            {tributos.das_mensal != null && (
              <TableRow>
                <TableCell className="py-1 px-0 text-muted-foreground">DAS</TableCell>
                <TableCell className="py-1 px-0 text-right tabular-nums text-foreground">{fmtR(tributos.das_mensal)}</TableCell>
              </TableRow>
            )}
            {tributos.icms != null && (
              <TableRow>
                <TableCell className="py-1 px-0 text-muted-foreground">ICMS</TableCell>
                <TableCell className="py-1 px-0 text-right tabular-nums text-foreground">{fmtR(tributos.icms)}</TableCell>
              </TableRow>
            )}
            {tributos.pis != null && (
              <TableRow>
                <TableCell className="py-1 px-0 text-muted-foreground">PIS</TableCell>
                <TableCell className="py-1 px-0 text-right tabular-nums text-foreground">{fmtR(tributos.pis)}</TableCell>
              </TableRow>
            )}
            {tributos.cofins != null && (
              <TableRow>
                <TableCell className="py-1 px-0 text-muted-foreground">COFINS</TableCell>
                <TableCell className="py-1 px-0 text-right tabular-nums text-foreground">{fmtR(tributos.cofins)}</TableCell>
              </TableRow>
            )}
            {tributos.fonte && (
              <TableRow><TableCell colSpan={2} className="py-0.5 px-0"><FonteBadge type={tributos.fonte} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Creditos sobre compra */}
      <div className="mb-3">
        <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Creditos sobre compra</div>
        <Table className="text-xs">
          <TableBody>
            {Object.entries(creditos).map(([k, v]) => (
              <TableRow key={k}>
                <TableCell className="py-1 px-0 text-muted-foreground uppercase">{k}</TableCell>
                <TableCell className="py-1 px-0 text-right tabular-nums text-success-text">{v > 0 ? `-${fmtR(v)}` : fmtR(v)}</TableCell>
              </TableRow>
            ))}
            {Object.keys(creditos).length === 0 && (
              <TableRow><TableCell className="py-1 px-0 text-muted-foreground text-xs" colSpan={2}>Sem creditos</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Custos adicionais */}
      {(custos.inss_patronal > 0 || custos.contabilidade > 0) && (
        <div className="mb-3">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Custos adicionais</div>
          <Table className="text-xs">
            <TableBody>
              {custos.inss_patronal > 0 && (
                <TableRow>
                  <TableCell className="py-1 px-0 text-muted-foreground">INSS Patronal</TableCell>
                  <TableCell className="py-1 px-0 text-right tabular-nums text-foreground">{fmtR(custos.inss_patronal)}</TableCell>
                </TableRow>
              )}
              {custos.contabilidade > 0 && (
                <TableRow>
                  <TableCell className="py-1 px-0 text-muted-foreground">Contabilidade</TableCell>
                  <TableCell className="py-1 px-0 text-right tabular-nums text-foreground">{fmtR(custos.contabilidade)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Custo liquido HOJE */}
      <div className="border-t-2 border-border pt-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-foreground">Custo Liquido Mensal</span>
          <span className={`text-base font-semibold tabular-nums ${(regime.custo_liquido_mensal || 0) < 0 ? 'text-success-text' : 'text-foreground'}`}>
            {fmtR(regime.custo_liquido_mensal)}
          </span>
        </div>
      </div>

      {/* NA REFORMA */}
      <div className="bg-muted rounded p-3 border border-border">
        <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">Na Reforma (com IBS/CBS)</div>
        <Table className="text-xs">
          <TableBody>
            {naReforma.ibs_cbs != null && (
              <TableRow className="border-border/50">
                <TableCell className="py-1 px-0 text-muted-foreground">IBS + CBS</TableCell>
                <TableCell className="py-1 px-0 text-right tabular-nums text-foreground">{fmtR(naReforma.ibs_cbs)}</TableCell>
              </TableRow>
            )}
            {naReforma.credito != null && (
              <TableRow className="border-border/50">
                <TableCell className="py-1 px-0 text-muted-foreground">Credito</TableCell>
                <TableCell className="py-1 px-0 text-right tabular-nums text-success-text">{naReforma.credito > 0 ? `-${fmtR(naReforma.credito)}` : fmtR(naReforma.credito)}</TableCell>
              </TableRow>
            )}
            {naReforma.credito_integral != null && (
              <TableRow className="border-border/50">
                <TableCell className="py-1 px-0 text-muted-foreground">Credito integral</TableCell>
                <TableCell className="py-1 px-0 text-right tabular-nums text-success-text">-{fmtR(naReforma.credito_integral)}</TableCell>
              </TableRow>
            )}
            {naReforma.inss > 0 && (
              <TableRow className="border-border/50">
                <TableCell className="py-1 px-0 text-muted-foreground">INSS Patronal</TableCell>
                <TableCell className="py-1 px-0 text-right tabular-nums text-foreground">{fmtR(naReforma.inss)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
          <span className="text-sm font-semibold text-foreground">Custo Liquido (Reforma)</span>
          <span className={`text-base font-semibold tabular-nums ${(naReforma.custo_liquido || 0) < 0 ? 'text-success-text' : 'text-foreground'}`}>
            {fmtR(naReforma.custo_liquido)}/mes
          </span>
        </div>
      </div>
    </div>
  )
}
