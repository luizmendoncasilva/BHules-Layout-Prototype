import { useState, useEffect } from 'react'
import { DollarSign, Building2, RefreshCw, TrendingUp, Shield, FileText, Landmark, Receipt, Scale, Download } from 'lucide-react'
import {
  Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { useToast } from '../shared/Toast'

// Sentinel for "todas as empresas" — Radix Select disallows an empty-string item value.
const ALL_COMPANIES = '__all__'

const CREDIT_FIELDS = [
  { key: 'total_credito_icms', label: 'ICMS', color: 'bg-chart-1' },
  { key: 'total_credito_pis', label: 'PIS', color: 'bg-chart-2' },
  { key: 'total_credito_cofins', label: 'COFINS', color: 'bg-chart-3' },
  { key: 'total_credito_ipi', label: 'IPI', color: 'bg-chart-4' },
  { key: 'total_difal', label: 'DIFAL', color: 'bg-chart-5' },
  { key: 'total_st', label: 'ST', color: 'bg-chart-1' },
]

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function SummaryCard({ icon: Icon, label, value, color = 'blue' }) {
  // "green" marks the headline total (success accent); the rest are generic,
  // non-meaningful categories (ICMS/PIS/COFINS/IPI/DIFAL/ST) matching the
  // chart-1..5 cycling used in PeriodChart below.
  const colors = {
    green: 'bg-success-subtle text-success-text',
    blue: 'bg-chart-1/10 text-chart-1',
    amber: 'bg-chart-2/10 text-chart-2',
    purple: 'bg-chart-3/10 text-chart-3',
    cyan: 'bg-chart-4/10 text-chart-4',
    rose: 'bg-chart-5/10 text-chart-5',
    indigo: 'bg-chart-1/10 text-chart-1',
  }
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold text-foreground truncate">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

function CompanyTable({ byCompany }) {
  if (!byCompany || byCompany.length === 0) return null
  const sorted = [...byCompany].sort((a, b) => b.total_creditos - a.total_creditos)
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Building2 className="w-4 h-4" /> Resumo por Empresa
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead className="text-right">ICMS</TableHead>
            <TableHead className="text-right">PIS</TableHead>
            <TableHead className="text-right">COFINS</TableHead>
            <TableHead className="text-right">IPI</TableHead>
            <TableHead className="text-right">DIFAL</TableHead>
            <TableHead className="text-right">ST</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Itens</TableHead>
            <TableHead className="text-right">NFs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(c => (
            <TableRow key={c.company_id}>
              <TableCell className="font-medium text-foreground max-w-xs truncate">{c.razao_social}</TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">{fmt(c.total_credito_icms)}</TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">{fmt(c.total_credito_pis)}</TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">{fmt(c.total_credito_cofins)}</TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">{fmt(c.total_credito_ipi)}</TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">{fmt(c.total_difal)}</TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">{fmt(c.total_st)}</TableCell>
              <TableCell className="text-right font-semibold text-foreground tabular-nums">{fmt(c.total_creditos)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{c.total_items}</TableCell>
              <TableCell className="text-right text-muted-foreground">{c.total_invoices}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PeriodChart({ byPeriod }) {
  if (!byPeriod || byPeriod.length === 0) return null
  const maxCreditos = Math.max(...byPeriod.map(p => p.total_creditos), 1)

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" /> Creditos por Periodo
      </h3>
      <div className="space-y-2">
        {byPeriod.map(p => (
          <div key={p.period} className="flex items-center gap-2">
            <div className="w-20 text-xs text-muted-foreground font-mono shrink-0">{p.period}</div>
            <div className="flex-1 bg-muted rounded h-7 relative overflow-hidden flex">
              {CREDIT_FIELDS.map(f => {
                const val = p[f.key] || 0
                const pct = (val / maxCreditos) * 100
                if (pct < 0.5) return null
                return (
                  <div
                    key={f.key}
                    className={`${f.color} h-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                    title={`${f.label}: ${fmt(val)}`}
                  />
                )
              })}
            </div>
            <div className="w-28 text-xs font-semibold text-muted-foreground text-right tabular-nums shrink-0">
              {fmt(p.total_creditos)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        {CREDIT_FIELDS.map(f => (
          <div key={f.key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${f.color}`} />
            <span className="text-xs text-muted-foreground">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FinancialDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [exporting, setExporting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    api.getCompanies().then(setCompanies).catch(() => {})
  }, [])

  const fetchMetrics = () => {
    setLoading(true)
    setError(null)
    api.getFinancialMetrics(selectedCompany || undefined)
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { fetchMetrics() }, [selectedCompany])

  const handleExportCsv = () => {
    setExporting(true)
    api.getEscrituracaoExport({ companyId: selectedCompany || undefined })
      .catch(e => toast.error('Falha ao exportar CSV', { description: e.message }))
      .finally(() => setExporting(false))
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
        <span className="ml-2 text-muted-foreground">Carregando metricas financeiras...</span>
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

  const totals = data?.totals || {}
  const hasData = totals.total_items > 0

  if (!hasData) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <Header
          companies={companies}
          selectedCompany={selectedCompany}
          onCompanyChange={setSelectedCompany}
          onRefresh={fetchMetrics}
          onExport={handleExportCsv}
          exporting={exporting}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum resultado de escrituracao encontrado. Execute o motor para gerar metricas financeiras.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
        onRefresh={fetchMetrics}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-4 xl:grid-cols-7 gap-4">
          <SummaryCard icon={DollarSign} label="Total Creditos" value={fmt(totals.total_creditos)} color="green" />
          <SummaryCard icon={Landmark} label="ICMS" value={fmt(totals.total_credito_icms)} color="blue" />
          <SummaryCard icon={Receipt} label="PIS" value={fmt(totals.total_credito_pis)} color="amber" />
          <SummaryCard icon={Receipt} label="COFINS" value={fmt(totals.total_credito_cofins)} color="purple" />
          <SummaryCard icon={FileText} label="IPI" value={fmt(totals.total_credito_ipi)} color="cyan" />
          <SummaryCard icon={Scale} label="DIFAL" value={fmt(totals.total_difal)} color="rose" />
          <SummaryCard icon={Shield} label="ST" value={fmt(totals.total_st)} color="indigo" />
        </div>

        <CompanyTable byCompany={data?.by_company} />
        <PeriodChart byPeriod={data?.by_period} />
      </div>
    </div>
  )
}

function Header({ companies, selectedCompany, onCompanyChange, onRefresh, onExport, exporting }) {
  return (
    <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard Financeiro</h1>
        <p className="text-xs text-muted-foreground">Resumo de creditos por empresa e periodo</p>
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
        <Button
          onClick={onExport}
          disabled={exporting}
          variant="secondary"
          size="sm"
          className="bg-success-subtle text-success-text hover:bg-success-subtle/70"
          title="Exportar escrituracao para CSV"
        >
          <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
        <Button onClick={onRefresh} variant="secondary" size="sm">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </Button>
      </div>
    </div>
  )
}
