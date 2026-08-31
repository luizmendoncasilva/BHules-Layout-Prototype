import { useState } from 'react'
import { Bot, User, FileText, Package, Trophy, TrendingUp, ThumbsUp, ThumbsDown, Calendar } from 'lucide-react'
import {
  Card, CardContent, Badge, Progress, DatePicker,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'
import { useClassificationDashboard, useClassificationHistory } from '../../hooks/useInvoices'
import { useCompany } from '../../context/CompanyContext'

// 'YYYY-MM-DD' <-> Date helpers — the surrounding state stays a plain date
// string (unchanged contract), only the JSX layer talks to DatePicker in Date.
function parseDateStr(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
function formatDateStr(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fmt(n) {
  return (n || 0).toLocaleString('pt-BR')
}

function PctBar({ label, value, total, color = 'blue' }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  // "emerald"/"amber" here carry meaning (motor/automatico vs humano/manual),
  // so they map to success/warning rather than a generic chart cycle. Colors
  // target the Progress indicator via its data-slot (Progress itself has no
  // color prop — it always renders bg-primary).
  const colors = {
    blue: '[&>[data-slot=progress-indicator]]:bg-info',
    emerald: '[&>[data-slot=progress-indicator]]:bg-success',
    amber: '[&>[data-slot=progress-indicator]]:bg-warning',
    purple: '[&>[data-slot=progress-indicator]]:bg-magic-bold',
  }
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{fmt(value)} <span className="text-muted-foreground font-normal">({pct.toFixed(1)}%)</span></span>
      </div>
      <Progress value={pct} className={`h-3 ${colors[color]}`} />
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const palettes = {
    blue: 'bg-info-subtle text-info-text',
    emerald: 'bg-success-subtle text-success-text',
    amber: 'bg-warning-subtle text-warning-text',
    purple: 'bg-magic-subtle text-magic-bold',
  }
  return (
    <Card padding="sm">
      <CardContent className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-lg ${palettes[color]} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-semibold text-foreground leading-tight">{value}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

// Status colors carry real meaning (conformidade/bloqueio), so they map to the
// success/warning/destructive/info families rather than the generic chart palette.
const STATUS_COLORS = {
  CONFORME: 'bg-success',
  REQUER_REVISAO: 'bg-warning',
  BLOQUEADO: 'bg-destructive',
  CRITICO: 'bg-destructive',
  PENDENTE: 'bg-muted-foreground/40',
  ESCRITURADA: 'bg-info',
  AUTO_APROVADA: 'bg-success',
  DISPENSADO: 'bg-muted-foreground/60',
}

const STATUS_LABELS = {
  CONFORME: 'Conforme',
  REQUER_REVISAO: 'Requer Revisão',
  BLOQUEADO: 'Bloqueado',
  CRITICO: 'Crítico',
  PENDENTE: 'Pendente',
  ESCRITURADA: 'Escriturada',
  AUTO_APROVADA: 'Auto-Aprovada',
  DISPENSADO: 'Dispensado',
}

// Maps the same status semantics above to the DS Badge's fixed variant set.
const STATUS_BADGE_VARIANT = {
  CONFORME: 'success',
  REQUER_REVISAO: 'warning',
  BLOQUEADO: 'destructive',
  CRITICO: 'destructive',
  PENDENTE: 'secondary',
  ESCRITURADA: 'info',
  AUTO_APROVADA: 'success',
  DISPENSADO: 'secondary',
}

function EvolutionChart({ companyIds, startDate, endDate }) {
  const [granularity, setGranularity] = useState('month')
  const { data } = useClassificationHistory({
    companyIds,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    granularity,
  })

  const history = data?.history || []
  if (history.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-info-text" />
          Evolução Motor vs Humano
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período.</p>
      </div>
    )
  }

  const maxTotal = Math.max(...history.map(h => h.total), 1)

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-info-text" />
          Evolução Motor vs Humano
        </h3>
        <div className="flex gap-1">
          {[
            { key: 'day', label: 'Dia' },
            { key: 'week', label: 'Semana' },
            { key: 'month', label: 'Mês' },
          ].map(g => (
            <button
              key={g.key}
              onClick={() => setGranularity(g.key)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                granularity === g.key
                  ? 'bg-info-subtle text-info-text'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-0">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-success" /> Motor</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-warning" /> Humano</span>
          <span className="flex items-center gap-1.5 text-muted-foreground">Linha = % Motor</span>
        </div>

        {/* Bar chart rows */}
        <div className="space-y-1">
          {history.map((h, i) => {
            const motorW = maxTotal > 0 ? (h.motor / maxTotal) * 100 : 0
            const humanW = maxTotal > 0 ? (h.human / maxTotal) * 100 : 0
            const periodLabel = granularity === 'month'
              ? h.period?.slice(0, 7)
              : h.period?.slice(0, 10)
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 text-right font-mono shrink-0">{periodLabel}</span>
                <div className="flex-1 flex h-6 rounded overflow-hidden bg-muted">
                  {motorW > 0 && (
                    <div
                      className="bg-success transition-all duration-300"
                      style={{ width: `${motorW}%` }}
                      title={`Motor: ${fmt(h.motor)}`}
                    />
                  )}
                  {humanW > 0 && (
                    <div
                      className="bg-warning transition-all duration-300"
                      style={{ width: `${humanW}%` }}
                      title={`Humano: ${fmt(h.human)}`}
                    />
                  )}
                </div>
                <span className="text-xs font-semibold text-success-text w-14 text-right">{h.pct_motor}%</span>
                <span className="text-xs text-muted-foreground w-12 text-right">{fmt(h.total)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function ClassificationDashboard() {
  const { selectedCompanyIds } = useCompany()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data, isLoading } = useClassificationDashboard({
    companyIds: selectedCompanyIds,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!data) return null

  const { invoices, items, status_distribution, top_analysts } = data
  const statusTotal = Object.values(status_distribution || {}).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Classificação: Motor vs Humano</h2>
          <p className="text-sm text-muted-foreground mt-1">Visão geral de quem classificou as notas e itens</p>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker
            value={parseDateStr(startDate)}
            onValueChange={(date) => setStartDate(date ? formatDateStr(date) : '')}
            placeholder="Data início"
            className="w-auto"
          />
          <DatePicker
            value={parseDateStr(endDate)}
            onValueChange={(date) => setEndDate(date ? formatDateStr(date) : '')}
            placeholder="Data fim"
            className="w-auto"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={FileText}
          label="Total de Notas"
          value={fmt(invoices.total)}
          color="blue"
        />
        <KpiCard
          icon={Bot}
          label="Notas pelo Motor"
          value={fmt(invoices.motor)}
          sub={`${invoices.pct_motor}% automático`}
          color="emerald"
        />
        <KpiCard
          icon={User}
          label="Notas por Humanos"
          value={fmt(invoices.human)}
          color="amber"
        />
        <KpiCard
          icon={Package}
          label="Total de Itens"
          value={fmt(items.total)}
          sub={`${items.pct_motor}% pelo motor`}
          color="purple"
        />
      </div>

      {/* Motor vs Human breakdown */}
      <div className="grid grid-cols-2 gap-6">
        {/* Invoices */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-info-text" />
            Notas Fiscais
          </h3>
          <div className="space-y-4">
            <PctBar label="Motor (automático)" value={invoices.motor} total={invoices.total} color="emerald" />
            <PctBar label="Humano (revisão manual)" value={invoices.human} total={invoices.total} color="amber" />
          </div>
        </div>

        {/* Items */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-magic-bold" />
            Itens
          </h3>
          <div className="space-y-4">
            <PctBar label="Motor (automático)" value={items.motor} total={items.total} color="emerald" />
            <PctBar label="Humano (revisão manual)" value={items.human} total={items.total} color="amber" />
          </div>
        </div>
      </div>

      {/* Status Distribution + Top Analysts side by side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Status distribution */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-info-text" />
            Distribuição por Status
          </h3>
          {/* Stacked bar */}
          <div className="h-8 flex rounded-full overflow-hidden mb-4">
            {Object.entries(status_distribution || {})
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div
                  key={status}
                  className={`${STATUS_COLORS[status] || 'bg-muted-foreground/30'} transition-all`}
                  style={{ width: `${statusTotal > 0 ? (count / statusTotal) * 100 : 0}%` }}
                  title={`${STATUS_LABELS[status] || status}: ${fmt(count)}`}
                />
              ))}
          </div>
          <div className="space-y-2">
            {Object.entries(status_distribution || {})
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <Badge variant={STATUS_BADGE_VARIANT[status] || 'secondary'}>
                    {STATUS_LABELS[status] || status}
                  </Badge>
                  <span className="font-medium text-foreground">
                    {fmt(count)}
                    <span className="text-muted-foreground font-normal ml-1">
                      ({statusTotal > 0 ? ((count / statusTotal) * 100).toFixed(1) : 0}%)
                    </span>
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Top analysts */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-warning-text" />
            Top Analistas (Revisão Manual)
          </h3>
          {top_analysts && top_analysts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Analista</TableHead>
                  <TableHead className="text-right">Notas</TableHead>
                  <TableHead className="text-right"><ThumbsUp className="w-3 h-3 inline" /></TableHead>
                  <TableHead className="text-right"><ThumbsDown className="w-3 h-3 inline" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top_analysts.map((a, i) => (
                  <TableRow key={a.email}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium text-foreground truncate max-w-xs" title={a.email}>
                      {a.email?.split('@')[0] || a.email}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">{fmt(a.invoices_reviewed)}</TableCell>
                    <TableCell className="text-right text-success-text">{fmt(a.upvotes)}</TableCell>
                    <TableCell className="text-right text-destructive-text">{fmt(a.downvotes)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum feedback registrado ainda.</p>
          )}
        </div>
      </div>

      {/* Historical evolution chart */}
      <EvolutionChart
        companyIds={selectedCompanyIds}
        startDate={startDate || undefined}
        endDate={endDate || undefined}
      />
    </div>
  )
}
