import { useState, useEffect } from 'react'
import { BarChart3, Target, TrendingUp, TrendingDown, MessageSquare, RefreshCw, Search, ArrowUpRight, ArrowDownRight, Building2 } from 'lucide-react'
import {
  Button, IconButton, Tooltip, TooltipTrigger, TooltipContent, Badge,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'

// Sentinel for "todas empresas" — Radix Select disallows an empty-string item value.
const ALL_COMPANIES = '__all__'

const PERIOD_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 14, label: '14 dias' },
  { value: 30, label: '30 dias' },
  { value: 60, label: '60 dias' },
  { value: 90, label: '90 dias' },
]

function TrendBadge({ current, previous }) {
  if (previous == null || current == null || previous === '—' || current === '—') return null
  const cur = parseFloat(current)
  const prev = parseFloat(previous)
  if (isNaN(cur) || isNaN(prev) || prev === 0) return null
  const delta = ((cur - prev) / prev * 100).toFixed(1)
  const isUp = cur >= prev
  const Icon = isUp ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-success-text' : 'text-destructive-text'}`}>
      <Icon className="w-3 h-3" />
      {isUp ? '+' : ''}{delta}%
    </span>
  )
}

function MetricCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
  const colors = {
    blue: 'bg-info-subtle text-info-text',
    green: 'bg-success-subtle text-success-text',
    amber: 'bg-warning-subtle text-warning-text',
    purple: 'bg-magic-subtle text-magic-bold',
  }
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-foreground">{value}</span>
          {trend}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function TrendChart({ data, valueKey, label, color = 'var(--chart-1)' }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">{label}</h3>
        <div className="text-xs text-muted-foreground text-center py-6">Sem dados no periodo</div>
      </div>
    )
  }

  const maxVal = Math.max(...data.map(d => d[valueKey] || 0), 1)

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{label}</h3>
      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => {
          const val = d[valueKey] || 0
          const h = Math.max((val / maxVal) * 100, 2)
          const dateStr = d.date ? new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border border-border text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 shadow-lg">
                {dateStr}: {val.toFixed(1)}%
              </div>
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{ height: `${h}%`, backgroundColor: color, minHeight: '2px' }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground">
          {data[0]?.date ? new Date(data[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}
        </span>
        <span className="text-xs text-muted-foreground">
          {data[data.length - 1]?.date ? new Date(data[data.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}
        </span>
      </div>
    </div>
  )
}

function FonteAccuracyBars({ fonteAccuracy }) {
  const entries = Object.entries(fonteAccuracy || {})
  if (entries.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Acuracia por Fonte</h3>
        <div className="text-xs text-muted-foreground text-center py-4">Sem dados de feedback</div>
      </div>
    )
  }

  const LABEL_MAP = {
    SPED_HISTORICO: 'SPED Historico',
    LEGISLACAO_VETORIAL: 'Legislacao Vetorial',
    TABELA_REFERENCIA: 'Tabela Referencia',
    LLM: 'LLM',
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Acuracia por Fonte</h3>
      <div className="space-y-2">
        {entries.map(([fonte, data]) => {
          const pct = data.accuracy_pct || 0
          const barColor = pct >= 90 ? 'bg-success' : pct >= 70 ? 'bg-warning' : 'bg-destructive'
          return (
            <div key={fonte} className="flex items-center gap-3">
              <div className="w-32 text-xs font-medium text-foreground truncate">{LABEL_MAP[fonte] || fonte}</div>
              <div className="flex-1 bg-muted rounded-full h-5 relative overflow-hidden">
                <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                  {pct.toFixed(1)}% ({data.correct}/{data.total})
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ArticlesTable({ title, articles, icon: Icon, iconColor = 'text-success-text' }) {
  if (!articles || articles.length === 0) return null

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {title}
      </h3>
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="py-1.5 px-2">Norma</TableHead>
            <TableHead className="py-1.5 px-2 text-center">Total</TableHead>
            <TableHead className="py-1.5 px-2 text-center text-success-text">+</TableHead>
            <TableHead className="py-1.5 px-2 text-center text-destructive-text">-</TableHead>
            <TableHead className="py-1.5 px-2 text-center">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((a, i) => (
            <TableRow key={i}>
              <TableCell className="py-1.5 px-2 text-foreground truncate max-w-xs">{a.norma || `Article #${a.article_id}`}</TableCell>
              <TableCell className="py-1.5 px-2 text-center text-muted-foreground">{a.total_feedback}</TableCell>
              <TableCell className="py-1.5 px-2 text-center text-success-text">{a.positive}</TableCell>
              <TableCell className="py-1.5 px-2 text-center text-destructive-text">{a.negative}</TableCell>
              <TableCell className="py-1.5 px-2 text-center font-semibold">
                <span className={a.net_score >= 0 ? 'text-success-text' : 'text-destructive-text'}>
                  {a.net_score >= 0 ? '+' : ''}{a.net_score}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function AbRerankingSection({ abData }) {
  if (!abData || !abData.variants || Object.keys(abData.variants).length === 0) return null

  const a = abData.variants.A_with_rerank || {}
  const b = abData.variants.B_without_rerank || {}
  const lift = abData.lift_hit_rate_pct || 0

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-magic-bold" />
        A/B Reranking
        {abData.sufficient_data && (
          <Badge variant={lift > 0 ? 'success' : lift < 0 ? 'destructive' : 'secondary'} className="ml-2 text-xs">
            Lift: {lift > 0 ? '+' : ''}{lift}%
          </Badge>
        )}
        {!abData.sufficient_data && (
          <Badge variant="warning" className="ml-2 text-xs">
            Dados insuficientes ({(a.count || 0) + (b.count || 0)}/50)
          </Badge>
        )}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-info-border rounded-lg p-3 bg-info-subtle/30">
          <div className="text-xs text-info-text font-semibold mb-1">A — Com Rerank</div>
          <div className="text-lg font-semibold text-foreground">{(a.avg_hit_rate_pct || 0).toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Hit Rate ({a.count || 0} amostras)</div>
          <div className="text-sm font-semibold text-foreground mt-1">{(a.avg_extraction_rate_pct || 0).toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Extraction Rate</div>
        </div>
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <div className="text-xs text-muted-foreground font-semibold mb-1">B — Sem Rerank</div>
          <div className="text-lg font-semibold text-foreground">{(b.avg_hit_rate_pct || 0).toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Hit Rate ({b.count || 0} amostras)</div>
          <div className="text-sm font-semibold text-foreground mt-1">{(b.avg_extraction_rate_pct || 0).toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Extraction Rate</div>
        </div>
      </div>
      {abData.sufficient_data && (
        <div className="mt-2 text-xs text-muted-foreground text-right">
          p-value aprox: {abData.p_value_approx}
        </div>
      )}
    </div>
  )
}

function computeKPIs(data) {
  const hitRateTrend = data?.hit_rate_trend || []
  const extractionRateTrend = data?.extraction_rate_trend || []
  const avgHitRate = hitRateTrend.length > 0
    ? (hitRateTrend.reduce((s, d) => s + (d.avg_hit_rate_pct || 0), 0) / hitRateTrend.length).toFixed(1)
    : null
  const avgExtractionRate = extractionRateTrend.length > 0
    ? (extractionRateTrend.reduce((s, d) => s + (d.avg_extraction_rate_pct || 0), 0) / extractionRateTrend.length).toFixed(1)
    : null
  const totalFeedbacks = (data?.top_articles || []).reduce((s, a) => s + (a.total_feedback || 0), 0)
    + (data?.bottom_articles || []).reduce((s, a) => s + (a.total_feedback || 0), 0)
  const totalArticles = new Set([
    ...(data?.top_articles || []).map(a => a.article_id),
    ...(data?.bottom_articles || []).map(a => a.article_id),
  ]).size
  return { avgHitRate, avgExtractionRate, totalFeedbacks, totalArticles }
}

export default function LegislationDashboard() {
  const [data, setData] = useState(null)
  const [prevData, setPrevData] = useState(null)
  const [abData, setAbData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [days, setDays] = useState(30)
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState('')

  useEffect(() => {
    api.getCompanies().then(setCompanies).catch(() => {})
  }, [])

  const fetchData = () => {
    setLoading(true)
    setError(null)
    const companyId = selectedCompany || undefined
    Promise.all([
      api.getLegislationEffectiveness(days, companyId),
      api.getLegislationEffectiveness(days * 2, companyId).catch(() => null),
      api.getAbReranking(days, companyId).catch(() => null),
    ])
      .then(([effectiveness, prevPeriod, ab]) => {
        setData(effectiveness)
        setPrevData(prevPeriod)
        setAbData(ab)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [days, selectedCompany])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
        <span className="ml-2 text-muted-foreground">Carregando metricas de legislacao...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive-text mb-2">{error}</p>
          <Button onClick={fetchData} variant="ghost" size="sm" className="text-primary hover:underline">Tentar novamente</Button>
        </div>
      </div>
    )
  }

  const kpi = computeKPIs(data)
  const prevKpi = computeKPIs(prevData)

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Legislacao — Efetividade</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <Select
              value={selectedCompany || ALL_COMPANIES}
              onValueChange={v => setSelectedCompany(v === ALL_COMPANIES ? '' : v)}
            >
              <SelectTrigger size="sm" className="text-xs max-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_COMPANIES}>Todas empresas</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.razao_social || c.cnpj}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
            <SelectTrigger size="sm" className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(o => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton aria-label="Atualizar" variant="ghost" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Atualizar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={Target} label="Hit Rate Medio" color="blue"
          value={kpi.avgHitRate != null ? `${kpi.avgHitRate}%` : '—'}
          trend={<TrendBadge current={kpi.avgHitRate} previous={prevKpi.avgHitRate} />}
        />
        <MetricCard
          icon={Search} label="Extraction Rate Medio" color="green"
          value={kpi.avgExtractionRate != null ? `${kpi.avgExtractionRate}%` : '—'}
          trend={<TrendBadge current={kpi.avgExtractionRate} previous={prevKpi.avgExtractionRate} />}
        />
        <MetricCard
          icon={MessageSquare} label="Total Feedbacks" color="amber"
          value={kpi.totalFeedbacks}
          trend={<TrendBadge current={kpi.totalFeedbacks} previous={prevKpi.totalFeedbacks} />}
        />
        <MetricCard
          icon={BarChart3} label="Artigos Avaliados" color="purple"
          value={kpi.totalArticles}
          trend={<TrendBadge current={kpi.totalArticles} previous={prevKpi.totalArticles} />}
        />
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TrendChart data={data?.hit_rate_trend} valueKey="avg_hit_rate_pct" label="Hit Rate Trend" color="var(--chart-1)" />
        <TrendChart data={data?.extraction_rate_trend} valueKey="avg_extraction_rate_pct" label="Extraction Rate Trend" color="var(--chart-2)" />
      </div>

      {/* Fonte Accuracy + A/B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <FonteAccuracyBars fonteAccuracy={data?.fonte_accuracy} />
        <AbRerankingSection abData={abData} />
      </div>

      {/* Top & Bottom Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ArticlesTable title="Top Artigos" articles={data?.top_articles} icon={ArrowUpRight} iconColor="text-success-text" />
        <ArticlesTable title="Bottom Artigos" articles={data?.bottom_articles} icon={ArrowDownRight} iconColor="text-destructive-text" />
      </div>
    </div>
  )
}
