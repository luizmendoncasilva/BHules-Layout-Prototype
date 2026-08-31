import { useState, useEffect } from 'react'
import {
  FileText, Target, TrendingUp, DollarSign, Building2, RefreshCw,
  AlertTriangle, BarChart3, Calendar, CheckCircle2
} from 'lucide-react'
import {
  Button, Badge, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'

// Sentinel for "todas as empresas" — Radix Select disallows an empty-string item value.
const ALL_COMPANIES = '__all__'

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function pctColor(pct) {
  if (pct >= 80) return 'text-success-text'
  if (pct >= 50) return 'text-warning-text'
  return 'text-destructive-text'
}

function confLabel(c) {
  if (c >= 0.8) return { text: 'ALTO', variant: 'success' }
  if (c >= 0.5) return { text: 'MEDIO', variant: 'warning' }
  return { text: 'BAIXO', variant: 'destructive' }
}

const CAMPO_LABELS = {
  cfop_entrada: 'CFOP Entrada',
  cst_icms: 'CST ICMS',
  cst_icms_entrada: 'CST ICMS Entrada',
  aliquota_icms: 'Aliquota ICMS',
  valor_icms: 'Valor ICMS',
  base_icms: 'Base ICMS',
  valor_pis: 'Valor PIS',
  valor_cofins: 'Valor COFINS',
  valor_ipi: 'Valor IPI',
  finalidade: 'Finalidade',
  ncm: 'NCM',
  cst_pis: 'CST PIS',
  cst_cofins: 'CST COFINS',
  difal: 'DIFAL',
  st: 'ST',
  cbenef: 'cBenef',
}

// ── KPI Card ──
function KpiCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const palettes = {
    blue: 'bg-info-subtle text-info-text border-info-border',
    green: 'bg-success-subtle text-success-text border-success-border',
    amber: 'bg-warning-subtle text-warning-text border-warning-border',
    purple: 'bg-magic-subtle text-magic-bold border-magic-bold',
  }
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg ${palettes[color]} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-semibold text-foreground leading-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </div>
    </div>
  )
}

// ── Top Divergencias (horizontal bar chart) ──
function DivergenciasChart({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Divergencias mais comuns
        </h3>
        <p className="text-sm text-muted-foreground">Nenhuma divergencia encontrada.</p>
      </div>
    )
  }

  const max = Math.max(...items.map(d => d.count), 1)
  const barColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> Divergencias mais comuns
      </h3>
      <div className="space-y-2.5">
        {items.map((d, i) => (
          <div key={d.campo} className="flex items-center gap-2">
            <div className="w-36 text-xs text-muted-foreground truncate shrink-0" title={d.campo}>
              {CAMPO_LABELS[d.campo] || d.campo}
            </div>
            <div className="flex-1 bg-muted rounded h-6 relative overflow-hidden">
              <div
                className={`${barColors[i % barColors.length]} h-full rounded transition-all duration-500`}
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
            <div className="w-10 text-xs font-semibold text-muted-foreground text-right tabular-nums shrink-0">
              {d.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Credits per company (stacked bars) ──
function CreditosPorEmpresa({ items }) {
  if (!items || items.length === 0) return null
  const sorted = [...items].sort((a, b) => b.total - a.total)
  const maxTotal = Math.max(...sorted.map(c => c.total), 1)

  const segments = [
    { key: 'icms', label: 'ICMS', color: 'bg-chart-1' },
    { key: 'pis', label: 'PIS', color: 'bg-chart-2' },
    { key: 'cofins', label: 'COFINS', color: 'bg-chart-3' },
    { key: 'ipi', label: 'IPI', color: 'bg-chart-4' },
  ]

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <DollarSign className="w-4 h-4" /> Creditos por empresa
      </h3>
      <div className="space-y-3">
        {sorted.map(c => (
          <div key={c.company_id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground truncate max-w-xs">{c.razao_social}</span>
              <span className="text-xs font-semibold text-foreground tabular-nums">{fmt(c.total)}</span>
            </div>
            <div className="bg-muted rounded h-5 overflow-hidden flex">
              {segments.map(s => {
                const pct = (c[s.key] / maxTotal) * 100
                if (pct < 0.3) return null
                return (
                  <div
                    key={s.key}
                    className={`${s.color} h-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                    title={`${s.label}: ${fmt(c[s.key])}`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        {segments.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${s.color}`} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Confidence per company ──
function ConfiancaPorEmpresa({ items }) {
  if (!items || items.length === 0) return null
  const sorted = [...items].sort((a, b) => b.avg_confianca - a.avg_confianca)

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Target className="w-4 h-4" /> Confianca por empresa
      </h3>
      <div className="space-y-3">
        {sorted.map(c => {
          const pct = Math.round(c.avg_confianca * 100)
          const lbl = confLabel(c.avg_confianca)
          const barColor = c.avg_confianca >= 0.8 ? 'bg-success' : c.avg_confianca >= 0.5 ? 'bg-warning' : 'bg-destructive'
          return (
            <div key={c.company_id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground truncate max-w-xs">{c.razao_social}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={lbl.variant} className="text-xs">{lbl.text}</Badge>
                  <span className="text-xs font-semibold text-foreground tabular-nums w-10 text-right">{pct}%</span>
                </div>
              </div>
              <div className="bg-muted rounded-full h-4 overflow-hidden relative">
                <div
                  className={`${barColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.total_items} itens analisados</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Timeline (daily counts as vertical bars) ──
function Timeline({ items }) {
  if (!items || items.length === 0) return null

  // Show last 30 data points max
  const recent = items.slice(-30)
  const maxNotas = Math.max(...recent.map(t => t.notas), 1)

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4" /> Escrituracoes ao longo do tempo
      </h3>
      <div className="flex items-end gap-1 h-32">
        {recent.map((t, i) => {
          const h = Math.max((t.notas / maxNotas) * 100, 4)
          const confPct = Math.round(t.avg_confianca * 100)
          const barColor = t.avg_confianca >= 0.8 ? 'bg-success' : t.avg_confianca >= 0.5 ? 'bg-warning' : 'bg-destructive'
          return (
            <div
              key={t.dia}
              className="flex-1 flex flex-col items-center justify-end group relative"
            >
              <div
                className={`${barColor} w-full rounded-t transition-all duration-300 min-w-1.5 hover:opacity-80 cursor-default`}
                style={{ height: `${h}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-popover text-popover-foreground border border-border text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                  <div className="font-semibold">{t.dia}</div>
                  <div>{t.notas} notas / {t.items} itens</div>
                  <div>Confianca: {confPct}%</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {/* X-axis labels (show every ~5th label) */}
      <div className="flex gap-1 mt-1">
        {recent.map((t, i) => (
          <div key={t.dia} className="flex-1 min-w-1.5">
            {(i === 0 || i === recent.length - 1 || i % Math.ceil(recent.length / 5) === 0) ? (
              <div className="text-xs text-muted-foreground text-center truncate">
                {t.dia ? t.dia.slice(5) : ''}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-success" /> Alta confianca</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-warning" /> Media</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-destructive" /> Baixa</div>
      </div>
    </div>
  )
}


export default function OverviewDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState('')

  useEffect(() => {
    api.getCompanies().then(setCompanies).catch(() => {})
  }, [])

  const fetchMetrics = () => {
    setLoading(true)
    setError(null)
    api.getDashboardMetrics(selectedCompany || undefined)
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { fetchMetrics() }, [selectedCompany])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
        <span className="ml-2 text-muted-foreground">Carregando dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive-text mb-2">{error}</p>
          <Button onClick={fetchMetrics} variant="ghost" size="sm" className="text-primary hover:underline">Tentar novamente</Button>
        </div>
      </div>
    )
  }

  const kpis = data?.kpis || {}
  const hasData = kpis.total_notas > 0

  if (!hasData) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <Header
          companies={companies}
          selectedCompany={selectedCompany}
          onCompanyChange={setSelectedCompany}
          onRefresh={fetchMetrics}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum resultado de escrituracao encontrado. Execute o motor para gerar metricas.</p>
        </div>
      </div>
    )
  }

  const confPct = Math.round(kpis.avg_confianca * 100)

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
        onRefresh={fetchMetrics}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={FileText}
            label="Notas escrituradas"
            value={kpis.total_notas.toLocaleString('pt-BR')}
            sub={`${kpis.total_items.toLocaleString('pt-BR')} itens`}
            color="blue"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Taxa de acerto"
            value={`${kpis.taxa_acerto}%`}
            sub="Itens sem revisao necessaria"
            color="green"
          />
          <KpiCard
            icon={Target}
            label="Confianca media"
            value={`${confPct}%`}
            sub={confLabel(kpis.avg_confianca).text}
            color="amber"
          />
          <KpiCard
            icon={DollarSign}
            label="Total creditos aproveitados"
            value={fmt(kpis.total_creditos)}
            sub="ICMS + PIS + COFINS + IPI"
            color="purple"
          />
        </div>

        {/* Middle row: Divergencias + Confianca */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DivergenciasChart items={data.top_divergencias} />
          <ConfiancaPorEmpresa items={data.confianca_por_empresa} />
        </div>

        {/* Credits per company */}
        <CreditosPorEmpresa items={data.creditos_por_empresa} />

        {/* Timeline */}
        <Timeline items={data.timeline} />
      </div>
    </div>
  )
}

function Header({ companies, selectedCompany, onCompanyChange, onRefresh }) {
  return (
    <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard de Escrituracao</h1>
        <p className="text-xs text-muted-foreground">Visao geral: KPIs, divergencias, creditos e timeline</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <Select
            value={selectedCompany || ALL_COMPANIES}
            onValueChange={v => onCompanyChange(v === ALL_COMPANIES ? '' : v)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_COMPANIES}>Todas as empresas</SelectItem>
              {companies.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.razao_social || c.nome_fantasia || `Company ${c.id}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onRefresh} variant="secondary" size="sm">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </Button>
      </div>
    </div>
  )
}
