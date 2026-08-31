import { useState, useEffect } from 'react'
import { Receipt, AlertTriangle, CheckCircle, TrendingUp, DollarSign, FileSearch, RefreshCw, Activity, Loader2, Play, Zap, MessageSquare } from 'lucide-react'
import { Button, IconButton, Tooltip, TooltipTrigger, TooltipContent, Badge, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card, CardContent } from '@bhubai/bhub-design-system'
import { useCompany } from '../../context/CompanyContext'
import { api } from '../../api/client'

function formatCurrency(val) {
  if (val == null || val === '' || val === '0' || val === 0) return 'R$ 0,00'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function StatCard({ label, value, icon: Icon, color = 'text-foreground', bgColor = 'bg-card' }) {
  return (
    <Card padding="none" className={`${bgColor} p-4`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <span className={`text-xl font-semibold ${color}`}>{value}</span>
    </Card>
  )
}

function RetentionBar({ label, value, total, color }) {
  const pct = total > 0 ? (Number(value) / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-sm font-mono text-foreground w-28 text-right">{formatCurrency(value)}</span>
    </div>
  )
}

export default function NfseDashboard() {
  const { selectedCompany } = useCompany()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [runAllLoading, setRunAllLoading] = useState(false)
  const [runAllResult, setRunAllResult] = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const data = await api.getNfseDashboardStats(selectedCompany?.id)
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRunAll = async (force = false) => {
    setRunAllLoading(true)
    setRunAllResult(null)
    try {
      const result = await api.runAllNfseValidation(selectedCompany?.id, force)
      setRunAllResult(result)
      fetchStats() // Refresh stats after run
    } catch (e) {
      setRunAllResult({ error: e.message })
    } finally {
      setRunAllLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [selectedCompany?.id])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Carregando dashboard NFS-e...
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Nenhum dado disponivel.
      </div>
    )
  }

  const retTotal = Object.entries(stats.retencoes_totais || {})
    .filter(([k]) => k !== 'valor_total_servicos')
    .reduce((sum, [, v]) => sum + Number(v), 0)

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-muted flex items-center justify-between -mx-6 -mt-6 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard NFS-e</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedCompany ? selectedCompany.razao_social : 'Visao geral de notas de servico'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleRunAll(false)}
            disabled={runAllLoading}
          >
            {runAllLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {runAllLoading ? 'Analisando...' : 'Analisar Pendentes'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRunAll(true)}
            disabled={runAllLoading}
          >
            <Play className="w-4 h-4" /> Re-analisar Todas
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                aria-label="Atualizar"
                variant="outline"
                onClick={fetchStats}
              >
                <RefreshCw className="w-4 h-4" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Atualizar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Run All Result */}
      {runAllResult && !runAllResult.error && (
        <div className="bg-success-subtle border border-success-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <span className="text-sm font-semibold text-success-text">
                Motor BHules executado: {runAllResult.total_processed} NFS-e analisadas
              </span>
              <div className="flex gap-3 mt-1 text-xs">
                {Object.entries(runAllResult.status_counts || {}).map(([status, count]) => (
                  count > 0 && (
                    <span key={status} className={`font-medium ${
                      status === 'CONFORME' ? 'text-success-text' :
                      status === 'REQUER_REVISAO' ? 'text-warning-text' :
                      status === 'BLOQUEADO' ? 'text-destructive-text' : 'text-muted-foreground'
                    }`}>
                      {status}: {count}
                    </span>
                  )
                ))}
                {runAllResult.total_errors > 0 && (
                  <span className="text-destructive-text">Erros: {runAllResult.total_errors}</span>
                )}
              </div>
            </div>
            <Button
              size="xs"
              variant="ghost"
              className="ml-auto text-muted-foreground hover:text-foreground"
              onClick={() => setRunAllResult(null)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
      {runAllResult?.error && (
        <div className="bg-destructive-subtle border border-destructive-border rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive-text">Erro: {runAllResult.error}</span>
          <Button
            size="xs"
            variant="ghost"
            className="ml-auto text-muted-foreground hover:text-foreground"
            onClick={() => setRunAllResult(null)}
          >
            Fechar
          </Button>
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="Total NFS-e"
          value={stats.total_nfse}
          icon={Receipt}
          color="text-primary"
          bgColor="bg-primary/5"
        />
        <StatCard
          label="Taxa Divergencia"
          value={`${stats.divergence_rate}%`}
          icon={AlertTriangle}
          color={stats.divergence_rate > 20 ? 'text-destructive-text' : stats.divergence_rate > 10 ? 'text-warning-text' : 'text-success-text'}
        />
        <StatCard
          label="Conforme"
          value={stats.status_analise_counts?.CONFORME || stats.validation_status?.VALIDADA || 0}
          icon={CheckCircle}
          color="text-success-text"
        />
        <StatCard
          label="Requer revisão"
          value={stats.status_analise_counts?.REQUER_REVISAO || 0}
          icon={AlertTriangle}
          color="text-warning-text"
        />
        <StatCard
          label="Pendentes"
          value={stats.status_analise_counts?.PENDENTE || stats.validation_status?.NAO_VALIDADA || 0}
          icon={FileSearch}
          color="text-muted-foreground"
        />
      </div>

      {/* Retention Totals & Score Distribution */}
      <div className="grid grid-cols-2 gap-6">
        {/* Retention Totals */}
        <Card padding="none" className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Retencoes Totais</h2>
            <span className="text-xs text-muted-foreground ml-auto">
              Valor servicos: {formatCurrency(stats.retencoes_totais?.valor_total_servicos)}
            </span>
          </div>
          <div className="space-y-3">
            <RetentionBar label="IRRF" value={stats.retencoes_totais?.irrf} total={retTotal} color="bg-chart-1" />
            <RetentionBar label="PIS" value={stats.retencoes_totais?.pis} total={retTotal} color="bg-chart-2" />
            <RetentionBar label="COFINS" value={stats.retencoes_totais?.cofins} total={retTotal} color="bg-chart-3" />
            <RetentionBar label="CSLL" value={stats.retencoes_totais?.csll} total={retTotal} color="bg-chart-4" />
            <RetentionBar label="INSS" value={stats.retencoes_totais?.inss} total={retTotal} color="bg-chart-5" />
            <RetentionBar label="ISS" value={stats.retencoes_totais?.iss} total={retTotal} color="bg-info" />
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between text-sm">
            <span className="font-medium text-muted-foreground">Total Retencoes</span>
            <span className="font-mono font-semibold text-foreground">{formatCurrency(retTotal)}</span>
          </div>
        </Card>

        {/* Severity Distribution */}
        <Card padding="none" className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Distribuicao de Alertas</h2>
            <span className="text-xs text-muted-foreground ml-auto">
              Total: {stats.total_alerts}
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Bloqueio', key: 'BLOQUEIO', color: 'bg-destructive' },
              { label: 'Alerta Critico', key: 'ALERTA_CRITICO', color: 'bg-destructive' },
              { label: 'Alerta', key: 'ALERTA', color: 'bg-warning' },
              { label: 'Sugestao', key: 'SUGESTAO', color: 'bg-info' },
              { label: 'Informativo', key: 'INFORMATIVO', color: 'bg-muted-foreground' },
            ].map(({ label, key, color }) => {
              const count = stats.severity_distribution?.[key] || 0
              const pct = stats.total_alerts > 0 ? (count / stats.total_alerts) * 100 : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-foreground w-12 text-right">{count}</span>
                </div>
              )
            })}
          </div>

          {/* Status Analise Summary */}
          <div className="mt-4 pt-3 border-t border-border">
            <h3 className="text-xs text-muted-foreground font-medium mb-2">Status Analise</h3>
            <div className="flex gap-2">
              {Object.entries(stats.analise_status || {}).map(([status, count]) => (
                <Badge
                  key={status}
                  variant={status === 'SUCESSO' ? 'success' : status === 'VERIFICAR' ? 'warning' : 'secondary'}
                >
                  {status}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Benchmark Section */}
      <BenchmarkPanel companyId={selectedCompany?.id} />

      {/* Feedback Stats Section */}
      <FeedbackPanel />
    </div>
  )
}


function BenchmarkPanel({ companyId }) {
  const [benchData, setBenchData] = useState(null)
  const [benchLoading, setBenchLoading] = useState(false)
  const [benchLimit, setBenchLimit] = useState(500)

  const runBenchmark = async () => {
    setBenchLoading(true)
    try {
      const data = await api.runNfseBenchmark(companyId, benchLimit)
      setBenchData(data)
    } catch (e) {
      console.error('Benchmark error:', e)
    } finally {
      setBenchLoading(false)
    }
  }

  const targets = { irrf: 99, pcc: 98, inss: 98, iss: 99 }

  return (
    <Card padding="none" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Benchmark Motor NFS-e</h2>
          <span className="text-xs text-muted-foreground">vs Ground Truth</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(benchLimit)} onValueChange={(v) => setBenchLimit(Number(v))}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100 notas</SelectItem>
              <SelectItem value="500">500 notas</SelectItem>
              <SelectItem value="2000">2.000 notas</SelectItem>
              <SelectItem value="5000">Todas</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={runBenchmark}
            disabled={benchLoading}
          >
            {benchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
            {benchLoading ? 'Executando...' : 'Executar'}
          </Button>
        </div>
      </div>

      {!benchData && !benchLoading && (
        <p className="text-xs text-muted-foreground text-center py-6">
          Clique em "Executar" para rodar o benchmark do motor de retencoes contra o ground truth
        </p>
      )}

      {benchData && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground mb-2">
            {benchData.total} notas analisadas | {benchData.errors} erros
          </div>
          <div className="grid grid-cols-4 gap-3">
            {['irrf', 'pcc', 'inss', 'iss'].map((tax) => {
              const d = benchData[tax]
              if (!d) return null
              const target = targets[tax]
              const hitTarget = d.accuracy >= target
              return (
                <div key={tax} className={`border rounded-lg p-3 ${hitTarget ? 'border-success-border bg-success-subtle' : 'border-border'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground uppercase">{tax}</span>
                    <span className={`text-xs font-mono ${hitTarget ? 'text-success-text' : 'text-muted-foreground'}`}>
                      {hitTarget ? 'OK' : `alvo ${target}%`}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-foreground">{d.accuracy}%</div>
                  <div className="text-xs text-muted-foreground mt-1">accuracy</div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recall</span>
                      <span className={`font-mono ${d.recall >= 95 ? 'text-success-text' : d.recall >= 80 ? 'text-warning-text' : 'text-destructive-text'}`}>
                        {d.recall}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precision</span>
                      <span className="font-mono text-foreground">{d.precision}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">FN</span>
                      <span className={`font-mono ${d.fn > 0 ? 'text-destructive-text font-semibold' : 'text-success-text'}`}>
                        {d.fn}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {benchData.false_negatives?.length > 0 && (
            <div className="mt-3">
              <h3 className="text-xs font-semibold text-destructive-text mb-2">
                False Negatives ({benchData.false_negatives.length})
              </h3>
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-1 h-auto normal-case font-normal">Nota</TableHead>
                    <TableHead className="px-2 py-1 h-auto normal-case font-normal">Tributo</TableHead>
                    <TableHead className="px-2 py-1 h-auto normal-case font-normal">Humano</TableHead>
                    <TableHead className="px-2 py-1 h-auto normal-case font-normal">Motor</TableHead>
                    <TableHead className="px-2 py-1 h-auto normal-case font-normal">LC116</TableHead>
                    <TableHead className="px-2 py-1 h-auto normal-case font-normal">Regime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benchData.false_negatives.map((fn, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-2 py-1 font-mono">{fn.invoice_id}</TableCell>
                      <TableCell className="px-2 py-1 font-semibold text-destructive-text">{fn.tax}</TableCell>
                      <TableCell className="px-2 py-1 font-mono">R${fn.human_value}</TableCell>
                      <TableCell className="px-2 py-1 font-mono">R${fn.engine_value}</TableCell>
                      <TableCell className="px-2 py-1">{fn.service_code || '-'}</TableCell>
                      <TableCell className="px-2 py-1">{fn.regime || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}


function FeedbackPanel() {
  const [fbStats, setFbStats] = useState(null)
  const [fbLoading, setFbLoading] = useState(true)

  useEffect(() => {
    const fetchFeedback = async () => {
      setFbLoading(true)
      try {
        const data = await api.getNfseFeedbackStats()
        setFbStats(data)
      } catch {
        setFbStats(null)
      } finally {
        setFbLoading(false)
      }
    }
    fetchFeedback()
  }, [])

  if (fbLoading) {
    return (
      <Card padding="none" className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando feedback...
        </div>
      </Card>
    )
  }

  if (!fbStats || !Array.isArray(fbStats) || fbStats.length === 0) {
    return (
      <Card padding="none" className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Feedback NFS-e</h2>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">Nenhum feedback registrado ainda.</p>
      </Card>
    )
  }

  const totalFeedbacks = fbStats.reduce((sum, t) => sum + (t.total || 0), 0)

  return (
    <Card padding="none" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Feedback NFS-e</h2>
          <span className="text-xs text-muted-foreground">por tributo</span>
        </div>
        <span className="text-xs text-muted-foreground">{totalFeedbacks} feedbacks totais</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {fbStats.map((item) => {
          const accuracy = item.accuracy_pct ?? 0
          const incorrect = item.total > 0 ? item.total - (item.correct || 0) : 0
          return (
            <div key={item.tributo} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground uppercase">{item.tributo}</span>
                <span className={`text-xs font-mono font-semibold ${
                  accuracy >= 90 ? 'text-success-text' : accuracy >= 70 ? 'text-warning-text' : 'text-destructive-text'
                }`}>
                  {accuracy.toFixed(1)}%
                </span>
              </div>
              {/* Accuracy bar */}
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden mb-2">
                <div className="h-full flex">
                  <div
                    className="bg-success h-full"
                    style={{ width: item.total > 0 ? `${((item.correct || 0) / item.total) * 100}%` : '0%' }}
                  />
                  <div
                    className="bg-destructive h-full"
                    style={{ width: item.total > 0 ? `${(incorrect / item.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.total} total</span>
                <span className="text-success-text">{item.correct || 0} corretos</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
