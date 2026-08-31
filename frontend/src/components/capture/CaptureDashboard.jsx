import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, FileText, AlertTriangle, Clock, RefreshCw, Cloud, CheckCircle2,
  FileCheck, Receipt, Search, History, Shield, Zap, FileInput, FileOutput
} from 'lucide-react'
import {
  Button, Tooltip, TooltipTrigger, TooltipContent, Badge, Checkbox, DatePicker, Input,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import Pagination from '../shared/Pagination'
import { useToast } from '../shared/Toast'

function KpiCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const palettes = {
    blue: 'bg-info-subtle text-info-text border-info-border',
    green: 'bg-success-subtle text-success-text border-success-border',
    amber: 'bg-warning-subtle text-warning-text border-warning-border',
    purple: 'bg-magic-subtle text-magic-bold border-magic-subtle',
    indigo: 'bg-mizu-flow-subtle text-mizu-flow-bold border-mizu-flow-subtle',
    rose: 'bg-coral-subtle text-coral-bold border-coral-subtle',
    cyan: 'bg-info-subtle text-info-text border-info-border',
  }
  return (
    <div className="bg-card rounded-lg border border-border p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-lg ${palettes[color]} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold text-foreground leading-tight truncate">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </div>
    </div>
  )
}

function SyncStatusBadge({ lastSync }) {
  if (!lastSync) {
    return <Badge variant="destructive">Nunca sincronizado</Badge>
  }
  const now = new Date()
  const syncDate = new Date(lastSync)
  const diffMs = now - syncDate
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays <= 1) {
    return <Badge variant="success"><CheckCircle2 className="w-3 h-3" /> Em dia</Badge>
  }
  if (diffDays <= 3) {
    return <Badge variant="warning"><Clock className="w-3 h-3" /> Desatualizado</Badge>
  }
  return <Badge variant="destructive"><AlertTriangle className="w-3 h-3" /> Critico</Badge>
}

function ModuleBadges({ motorRegras, recuperacao }) {
  return (
    <div className="flex items-center gap-1">
      {motorRegras && (
        <Badge variant="success" title="Motor de Regras ativo">
          <Zap className="w-3 h-3" />Motor
        </Badge>
      )}
      {recuperacao && (
        <Badge variant="warning" title="Recuperacao Tributaria ativa">
          <Shield className="w-3 h-3" />Recuperacao
        </Badge>
      )}
      {!motorRegras && !recuperacao && (
        <span className="text-xs text-muted-foreground">Nenhum modulo</span>
      )}
    </div>
  )
}

function TypeBadges({ nfeEnabled, nfseEnabled }) {
  return (
    <div className="flex items-center gap-1">
      {nfeEnabled && (
        <Badge variant="info">
          <FileCheck className="w-3 h-3" />NF-e
        </Badge>
      )}
      {nfseEnabled && (
        <Badge className="bg-magic-subtle text-magic-bold border-magic-subtle">
          <Receipt className="w-3 h-3" />NFS-e
        </Badge>
      )}
      {!nfeEnabled && !nfseEnabled && (
        <span className="text-xs text-muted-foreground">Nenhum</span>
      )}
    </div>
  )
}

function InvoiceCounts({ c }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span title="NF-e Entrada" className="inline-flex items-center gap-1">
        <FileInput className="w-3 h-3 text-info-text" />
        {(c.nfe_entrada || 0).toLocaleString('pt-BR')}
      </span>
      <span title="NF-e Saida" className="inline-flex items-center gap-1">
        <FileOutput className="w-3 h-3 text-mizu-flow-bold" />
        {(c.nfe_saida || 0).toLocaleString('pt-BR')}
      </span>
      <span className="text-muted-foreground">|</span>
      <span title="NFS-e Tomados" className="inline-flex items-center gap-1">
        <Receipt className="w-3 h-3 text-magic-bold" />
        {(c.nfse_tomados || 0).toLocaleString('pt-BR')}
      </span>
      <span title="NFS-e Prestados" className="inline-flex items-center gap-1">
        <FileText className="w-3 h-3 text-mizu-flow-bold" />
        {(c.nfse_prestados || 0).toLocaleString('pt-BR')}
      </span>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function CaptureDashboard() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [captureSearch, setCaptureSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [historicalTarget, setHistoricalTarget] = useState(null)
  const [historicalStart, setHistoricalStart] = useState('2021-01-01')
  const [selectedIds, setSelectedIds] = useState(new Set())

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(captureSearch); setPage(1) }, 400)
    return () => clearTimeout(timer)
  }, [captureSearch])

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['captureDashboard', debouncedSearch, page, pageSize],
    queryFn: () => api.getCaptureDashboard({ search: debouncedSearch || undefined, page, pageSize }),
    refetchInterval: 30000,
  })

  const syncAllMutation = useMutation({
    mutationFn: () => api.syncAllCompanies(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['captureDashboard'] })
      toast.success('Sincronização concluída para empresas com Motor de Regras ativo')
    },
    onError: (err) => {
      toast.error('Erro na sincronização', { description: err?.message })
    },
  })

  const [syncingCompanyId, setSyncingCompanyId] = useState(null)
  const syncOneMutation = useMutation({
    mutationFn: (companyId) => {
      setSyncingCompanyId(companyId)
      return api.syncCapture({ companyId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['captureDashboard'] })
    },
    onSettled: () => {
      setSyncingCompanyId(null)
    },
  })

  const batchToggleMutation = useMutation({
    mutationFn: async ({ ids, flags }) => {
      await Promise.all([...ids].map(id => api.updateCompanyTypeFlags(id, flags)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['captureDashboard'] })
      setSelectedIds(new Set())
    },
  })

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const allIds = companies.map(c => c.company_id)
    setSelectedIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds))
  }

  const historicalMutation = useMutation({
    mutationFn: ({ companyId, startDate }) => api.syncHistorical({ companyId, startDate }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['captureDashboard'] })
      setHistoricalTarget(null)
      toast.success('Backfill concluído', {
        description: `${data.summary?.imported || 0} notas importadas, ${data.summary?.already_in_db || 0} já existentes`,
      })
    },
    onError: (err) => {
      toast.error('Erro no backfill', { description: err.message })
    },
  })

  const companies = dashboard?.companies || []
  const totalCompanies = dashboard?.total || companies.length
  const totalPages = dashboard?.total_pages || 1
  const activeCount = totalCompanies

  // Use global_totals from API (all companies) for KPI cards
  const gt = dashboard?.global_totals
  const totals = gt || companies.reduce((acc, c) => ({
    nfe_entrada: acc.nfe_entrada + (c.nfe_entrada || 0),
    nfe_saida: acc.nfe_saida + (c.nfe_saida || 0),
    nfse_tomados: acc.nfse_tomados + (c.nfse_tomados || 0),
    nfse_prestados: acc.nfse_prestados + (c.nfse_prestados || 0),
    total: acc.total + (c.total_notas || 0),
  }), { nfe_entrada: 0, nfe_saida: 0, nfse_tomados: 0, nfse_prestados: 0, total: 0 })

  const outdatedCount = companies.filter(c => {
    if (!c.last_sync) return true
    const diffDays = (Date.now() - new Date(c.last_sync)) / (1000 * 60 * 60 * 24)
    return diffDays > 1
  }).length
  const lastGlobalSync = companies.reduce((latest, c) => {
    if (!c.last_sync) return latest
    return !latest || new Date(c.last_sync) > new Date(latest) ? c.last_sync : latest
  }, null)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-6 space-y-6">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-muted flex items-center justify-between -mx-6 -mt-6 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Captura de Notas</h1>
            <p className="text-sm text-muted-foreground mt-1">Sincronizacao com IntegradorNF</p>
          </div>
          <Button
            onClick={() => syncAllMutation.mutate()}
            disabled={syncAllMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} />
            Sincronizar Todas
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard icon={Building2} label="Empresas ativas" value={activeCount} color="blue" />
          <KpiCard
            icon={FileInput}
            label="NF-e"
            value={totals.nfe_entrada.toLocaleString('pt-BR')}
            sub={`${totals.nfe_entrada.toLocaleString('pt-BR')} entrada | ${totals.nfe_saida.toLocaleString('pt-BR')} saida`}
            color="green"
          />
          <KpiCard
            icon={Receipt}
            label="NFS-e"
            value={totals.nfse_tomados.toLocaleString('pt-BR')}
            sub={`${totals.nfse_tomados.toLocaleString('pt-BR')} tomados | ${totals.nfse_prestados.toLocaleString('pt-BR')} prestados`}
            color="indigo"
          />
          <KpiCard icon={Clock} label="Ultima sync" value={lastGlobalSync ? formatDate(lastGlobalSync) : '\u2014'} sub={`${outdatedCount} desatualizadas`} color="purple" />
        </div>

        {/* Historical Backfill Drawer */}
        <Sheet open={!!historicalTarget} onOpenChange={(open) => { if (!open) setHistoricalTarget(null) }}>
          <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
            <SheetHeader className="px-6 py-5 border-b border-border">
              <SheetTitle>Backfill Histórico</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Importar notas antigas de <strong>{historicalTarget?.razao_social}</strong> para recuperacao tributaria.
              </p>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Data inicio</label>
                <DatePicker
                  value={historicalStart ? (() => { const [y, m, d] = historicalStart.split('-').map(Number); return new Date(y, m - 1, d) })() : null}
                  onValueChange={(date) => {
                    if (!date) { setHistoricalStart(''); return }
                    const y = date.getFullYear()
                    const m = String(date.getMonth() + 1).padStart(2, '0')
                    const d = String(date.getDate()).padStart(2, '0')
                    setHistoricalStart(`${y}-${m}-${d}`)
                  }}
                  className="w-full"
                />
              </div>
            </div>
            <SheetFooter className="px-6 py-4 border-t border-border flex-row justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setHistoricalTarget(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="warning"
                onClick={() => historicalMutation.mutate({ companyId: historicalTarget.company_id, startDate: historicalStart })}
                disabled={historicalMutation.isPending}
              >
                {historicalMutation.isPending ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Importando...</>
                ) : (
                  <><History className="w-4 h-4" /> Iniciar Backfill</>
                )}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Batch Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-mizu-flow-subtle border border-mizu-flow-subtle rounded-lg px-5 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-mizu-flow-bold">{selectedIds.size} empresa(s) selecionada(s)</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-success-text bg-success-subtle hover:opacity-80"
                onClick={() => batchToggleMutation.mutate({ ids: selectedIds, flags: { motor_regras_enabled: true } })}
                disabled={batchToggleMutation.isPending}
              >
                <Zap className="w-3.5 h-3.5" /> Ativar Motor
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground bg-muted hover:bg-accent"
                onClick={() => batchToggleMutation.mutate({ ids: selectedIds, flags: { motor_regras_enabled: false } })}
                disabled={batchToggleMutation.isPending}
              >
                <Zap className="w-3.5 h-3.5" /> Desativar Motor
              </Button>
              <span className="text-border">|</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-warning-text bg-warning-subtle hover:opacity-80"
                onClick={() => batchToggleMutation.mutate({ ids: selectedIds, flags: { recuperacao_tributaria_enabled: true } })}
                disabled={batchToggleMutation.isPending}
              >
                <Shield className="w-3.5 h-3.5" /> Ativar Recuperacao
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground bg-muted hover:bg-accent"
                onClick={() => batchToggleMutation.mutate({ ids: selectedIds, flags: { recuperacao_tributaria_enabled: false } })}
                disabled={batchToggleMutation.isPending}
              >
                <Shield className="w-3.5 h-3.5" /> Desativar Recuperacao
              </Button>
              <span className="text-border">|</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedIds(new Set())}
              >
                Limpar selecao
              </Button>
            </div>
          </div>
        )}

        {/* Company Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{totalCompanies} empresas</span>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Buscar empresa ou CNPJ..."
                value={captureSearch}
                onChange={(e) => setCaptureSearch(e.target.value)}
                className="pl-8 h-8 text-xs w-64"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={companies.length > 0 && selectedIds.size === companies.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-center">Modulos</TableHead>
                <TableHead className="text-center">Notas Capturadas</TableHead>
                <TableHead>Ultima Sync</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c, idx) => (
                <TableRow key={`${c.company_id}-${idx}`} className={selectedIds.has(c.company_id) ? 'bg-mizu-flow-subtle/30' : ''}>
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selectedIds.has(c.company_id)}
                      onCheckedChange={() => toggleSelectOne(c.company_id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm text-foreground">{c.razao_social || c.cnpj}</div>
                    <div className="text-xs text-muted-foreground">{c.cnpj}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <ModuleBadges motorRegras={c.motor_regras_enabled} recuperacao={c.recuperacao_tributaria_enabled} />
                  </TableCell>
                  <TableCell>
                    <InvoiceCounts c={c} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(c.last_sync)}
                  </TableCell>
                  <TableCell className="text-center">
                    <SyncStatusBadge lastSync={c.last_sync} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {c.motor_regras_enabled && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary bg-accent hover:bg-accent/70"
                              onClick={() => syncOneMutation.mutate(c.company_id)}
                              disabled={syncingCompanyId === c.company_id}
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${syncingCompanyId === c.company_id ? 'animate-spin' : ''}`} />
                              Sync
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Sincronizar notas recentes</TooltipContent>
                        </Tooltip>
                      )}
                      {c.recuperacao_tributaria_enabled && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-warning-text bg-warning-subtle hover:opacity-80 border border-warning-border"
                              onClick={() => setHistoricalTarget(c)}
                            >
                              <History className="w-3.5 h-3.5" />
                              Historico
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Backfill historico para recuperacao tributaria</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma empresa configurada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalCompanies}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
          />
        </div>
      </div>
    </div>
  )
}
