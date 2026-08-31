import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  Search, ChevronDown, ChevronRight, Filter, Calendar,
  Zap, CheckCheck, Loader2, X, AlertTriangle, Eye, Shield,
  RefreshCw, BookCheck,
} from 'lucide-react'
import {
  Button, IconButton, Tooltip, TooltipTrigger, TooltipContent, Badge, Checkbox,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue, DatePicker,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Tabs, TabsList, TabsTrigger, ToggleGroup, ToggleGroupItem,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { useCompanies } from '../../hooks/useCompanies'

import Pagination from '../shared/Pagination'
import { formatCnpj } from '../../utils/cnpj'
import { useToast } from '../shared/Toast'

// Sentinel value for the "Todas" (empty-string) option in Radix Select — Radix
// disallows an empty-string SelectItem value.
const ESC_ALL_VALUE = '__all__'

// --- Formatters ---
function fmt(val) {
  if (val == null) return '-'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtDate(val) {
  if (!val) return '-'
  return new Date(val + 'T00:00:00').toLocaleDateString('pt-BR')
}
// CNPJ alfanumérico (RFB jul/2026): formatCnpj de utils/cnpj preserva letras.
const fmtCnpj = (val) => formatCnpj(val)

// Confidence badge
function ConfBadge({ value }) {
  if (value == null) return <span className="text-xs text-muted-foreground">-</span>
  const pct = (value * 100).toFixed(0)
  let variant = 'destructive'
  if (value >= 0.8) variant = 'success'
  else if (value >= 0.5) variant = 'warning'
  return <Badge variant={variant}>{pct}%</Badge>
}

// Severity badge variants (DS Badge)
const SEV_VARIANT = {
  CRITICO: 'destructive',
  ALTA: 'warning',
  ALERTA: 'warning',
  OPORTUNIDADE: 'success',
  INFORMATIVO: 'info',
  MEDIA: 'warning',
  BAIXA: 'info',
}

// Campo human labels
const CAMPO_LABELS = {
  aliq_icms: 'Aliquota ICMS',
  cfop: 'CFOP',
  cfop_x_cst: 'CFOP x CST',
  cst_icms: 'CST ICMS',
  cst_pis: 'CST PIS',
  cst_cofins: 'CST COFINS',
  ncm: 'NCM',
  finalidade: 'Finalidade',
  st: 'Substituicao Tributaria',
  ipi: 'IPI',
  difal: 'DIFAL',
  vl_pis: 'Credito PIS',
  vl_cofins: 'Credito COFINS',
  vl_icms: 'Credito ICMS',
  pis_cofins_monofasico: 'Monofasico PIS/COFINS',
  credito_icms_x_pis: 'ICMS x PIS/COFINS',
  // NFS-e fields
  municipio_incidencia: 'Município Incidência',
  reinf_r4020: 'REINF R4020',
  valor_iss: 'Valor ISS',
  valor_ir_retido: 'IR Retido',
  valor_pcc_retido: 'PCC Retido',
  valor_inss_retido: 'INSS Retido',
  codigo_servico_lc116: 'Cod. Serviço LC116',
  irrf_aliquota: 'Alíquota IRRF',
  cnae_prestador: 'CNAE Prestador',
  confianca: 'Confiança',
  // Grouping labels
  emitente: 'Emitente',
  prestador: 'Prestador',
  todos: 'Todos',
  codigo_servico: 'Cod. Serviço',
}

const ESC_STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CONFORME', label: 'Conforme' },
  { value: 'REQUER_REVISAO', label: 'Requer Revisao' },
  { value: 'BLOQUEADO', label: 'Bloqueado' },
  { value: 'ESCRITURADA', label: 'Escriturada' },
]

const SECONDARY_GROUP = [
  { key: 'problema', label: 'Tipo de Problema' },
  { key: 'severidade', label: 'Severidade' },
  { key: 'ncm', label: 'NCM' },
  { key: 'cfop', label: 'CFOP' },
  { key: 'emitente', label: 'Emitente' },
  { key: 'none', label: 'Lista' },
]

// Severity ordering for grouping
const SEV_ORDER = { CRITICO: 0, ALERTA: 1, OPORTUNIDADE: 2, INFORMATIVO: 3 }
const SEV_LABELS = {
  CRITICO: 'Criticos — Corrigir antes de escriturar',
  ALERTA: 'Alertas — Revisar antes de escriturar',
  OPORTUNIDADE: 'Oportunidades — Creditos que voce pode aproveitar',
  INFORMATIVO: 'Informativos — Nenhuma acao necessaria',
}

const BATCH_TABS = [
  { key: 'materiais', label: 'Materiais', codMod: '55' },
  { key: 'servicos', label: 'Serviços', codMod: 'NFSE' },
]

function getDefaultDateRange() {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10)
  return { startDate: start, endDate: end }
}


export default function BatchAnalysis({ onViewInvoice, startDate: startDateProp, onStartDateChange, endDate: endDateProp, onEndDateChange, companyIds: companyIdsProp, onCompanyIdsChange }) {
  const defaults = getDefaultDateRange()
  const [activeTab, setActiveTab] = useState('materiais')
  const currentTab = BATCH_TABS.find(t => t.key === activeTab) || BATCH_TABS[0]
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])
  const [escFilter, setEscFilter] = useState('')
  // Date range (shared via props when available)
  const [localStartDate, setLocalStartDate] = useState(defaults.startDate)
  const [localEndDate, setLocalEndDate] = useState(defaults.endDate)
  const startDate = startDateProp ?? localStartDate
  const setStartDate = onStartDateChange ?? setLocalStartDate
  const endDate = endDateProp ?? localEndDate
  const setEndDate = onEndDateChange ?? setLocalEndDate
  // Company filter (shared via props when available)
  const [localCompanyFilter, setLocalCompanyFilter] = useState([])
  const companyFilter = companyIdsProp ?? localCompanyFilter
  const setCompanyFilter = onCompanyIdsChange ?? setLocalCompanyFilter
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [companySearch, setCompanySearch] = useState('')
  const [secondaryGroup, setSecondaryGroup] = useState('problema')

  // Expand/select
  const [expandedProblems, setExpandedProblems] = useState(new Set())
  const [selectedItems, setSelectedItems] = useState(new Set())

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)

  // Batch
  const toast = useToast()
  const [batchRunning, setBatchRunning] = useState(false)
  const [approveRunning, setApproveRunning] = useState(false)
  const [dismissRunning, setDismissRunning] = useState(false)
  const [escriturarRunning, setEscriturarRunning] = useState(false)

  const { data: companies } = useCompanies()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['batch-analysis', activeTab, companyFilter, startDate, endDate, escFilter, debouncedSearch, page, pageSize],
    queryFn: () => api.getBatchAnalysis({
      companyIds: companyFilter.length > 0 ? companyFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      statusAnalise: escFilter || undefined,
      search: debouncedSearch || undefined,
      codMod: currentTab.codMod,
      page,
      pageSize,
    }),
    placeholderData: keepPreviousData,
  })

  // Summary é caro (full scan agregado) — queryKey sem page/pageSize
  // pra não recomputar ao paginar.
  const { data: summaryData } = useQuery({
    queryKey: ['batch-analysis-summary', activeTab, companyFilter, startDate, endDate, escFilter, debouncedSearch],
    queryFn: () => api.getBatchAnalysisSummary({
      companyIds: companyFilter.length > 0 ? companyFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      statusAnalise: escFilter || undefined,
      search: debouncedSearch || undefined,
      codMod: currentTab.codMod,
    }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })

  const items = data?.items || []
  const summary = summaryData || {}

  const isNfse = activeTab === 'servicos'

  // ──────── Primary grouping based on selected mode ────────
  const problemGroups = useMemo(() => {
    if (secondaryGroup === 'problema') {
      // Group by divergence type (campo + descricao)
      const probMap = new Map()
      for (const item of items) {
        const divs = item.esc_divergencias
        if (!divs || !Array.isArray(divs) || divs.length === 0) continue
        for (const d of divs) {
          const desc = (d.descricao || '').slice(0, 80)
          const key = `${d.campo}||${desc}`
          if (!probMap.has(key)) {
            probMap.set(key, {
              key,
              campo: d.campo,
              severidade: d.severidade || 'ALERTA',
              descricao: d.descricao || '',
              valor_emitente: d.valor_emitente,
              valor_sugerido: d.valor_sugerido,
              items: [],
            })
          }
          probMap.get(key).items.push(item)
        }
      }
      return Array.from(probMap.values()).sort((a, b) => b.items.length - a.items.length)
    }

    if (secondaryGroup === 'severidade') {
      // Group by severity level — clear separation of what needs action
      const sevMap = new Map()
      for (const item of items) {
        const divs = item.esc_divergencias
        if (!divs || !Array.isArray(divs) || divs.length === 0) continue
        // Use highest severity of the item's divergences
        for (const d of divs) {
          const sev = d.severidade || 'INFORMATIVO'
          if (!sevMap.has(sev)) sevMap.set(sev, {
            key: sev,
            campo: sev.toLowerCase(),
            severidade: sev,
            descricao: SEV_LABELS[sev] || sev,
            items: [],
          })
          sevMap.get(sev).items.push(item)
        }
      }
      // Deduplicate items within each group
      for (const [, group] of sevMap) {
        const seen = new Set()
        group.items = group.items.filter(i => {
          if (seen.has(i.item_id)) return false
          seen.add(i.item_id)
          return true
        })
      }
      return Array.from(sevMap.values()).sort((a, b) => (SEV_ORDER[a.severidade] ?? 9) - (SEV_ORDER[b.severidade] ?? 9))
    }

    if (secondaryGroup === 'ncm') {
      // Group by NCM (NF-e) or Cod. Serviço (NFS-e)
      const map = new Map()
      for (const item of items) {
        let key, label
        if (isNfse) {
          key = item.codigo_servico || item.ncm || 'SEM_COD'
          label = `${key} - ${(item.descr_compl || '').slice(0, 60)}`
        } else {
          key = item.ncm || 'SEM_NCM'
          label = `${item.ncm || 'Sem NCM'} - ${(item.descr_compl || '').slice(0, 60)}`
        }
        if (!map.has(key)) map.set(key, { key, campo: isNfse ? 'codigo_servico' : 'ncm', severidade: 'ALERTA', descricao: label, items: [] })
        map.get(key).items.push(item)
      }
      return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length)
    }

    if (secondaryGroup === 'cfop') {
      // Group by CFOP — shows emitente CFOP vs suggested entrada CFOP
      const map = new Map()
      for (const item of items) {
        const cfopEmit = item.cfop_emitente || 'SEM_CFOP'
        const cfopEntrada = item.esc_cfop_entrada || ''
        const key = cfopEntrada ? `${cfopEmit} → ${cfopEntrada}` : cfopEmit
        const label = cfopEntrada && cfopEmit !== cfopEntrada
          ? `CFOP ${cfopEmit} → ${cfopEntrada} (divergente)`
          : `CFOP ${cfopEmit}${cfopEntrada ? ' → ' + cfopEntrada : ''}`
        if (!map.has(key)) map.set(key, { key, campo: 'cfop', severidade: cfopEntrada && cfopEmit !== cfopEntrada ? 'ALERTA' : 'INFORMATIVO', descricao: label, items: [] })
        map.get(key).items.push(item)
      }
      return Array.from(map.values()).sort((a, b) => {
        // Divergentes primeiro
        if (a.severidade !== b.severidade) return SEV_ORDER[a.severidade] - SEV_ORDER[b.severidade]
        return b.items.length - a.items.length
      })
    }

    if (secondaryGroup === 'emitente') {
      // Group by Emitente/Prestador
      const map = new Map()
      for (const item of items) {
        const key = item.emit_cnpj || 'SEM_CNPJ'
        const label = item.emit_razao_social || fmtCnpj(item.emit_cnpj) || (isNfse ? 'Sem prestador' : 'Sem emitente')
        if (!map.has(key)) map.set(key, { key, campo: isNfse ? 'prestador' : 'emitente', severidade: 'ALERTA', descricao: label, items: [] })
        map.get(key).items.push(item)
      }
      return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length)
    }

    // 'none' (Lista) — flat list, no grouping, show all items in one group
    if (items.length > 0) {
      return [{ key: 'all', campo: 'todos', severidade: 'ALERTA', descricao: 'Todos os itens', items }]
    }
    return []
  }, [items, secondaryGroup, isNfse])

  // ──────── Selection logic ────────
  const toggleProblemSelect = useCallback((prob) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      const ids = prob.items.map(i => i.item_id)
      if (ids.every(id => next.has(id))) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
  }, [])

  const toggleItem = useCallback((itemId) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    const allIds = items.map(i => i.item_id)
    if (allIds.every(id => selectedItems.has(id))) setSelectedItems(new Set())
    else setSelectedItems(new Set(allIds))
  }, [items, selectedItems])

  const selectedInvoiceIds = useMemo(() => {
    const ids = new Set()
    for (const item of items) {
      if (selectedItems.has(item.item_id)) ids.add(item.invoice_id)
    }
    return Array.from(ids)
  }, [items, selectedItems])

  // ──────── Batch actions ────────
  const handleBatchEscrituracao = async () => {
    if (selectedInvoiceIds.length === 0) return
    setBatchRunning(true)
    try {
      const result = await api.runEscrituracaoBatch(selectedInvoiceIds)
      const count = result.total_processed || selectedInvoiceIds.length
      toast.success(`${count} ${count === 1 ? 'nota reprocessada' : 'notas reprocessadas'}`)
      refetch()
    } catch (e) {
      toast.error('Erro ao reprocessar', { description: e.message })
    } finally { setBatchRunning(false) }
  }

  const handleBatchApprove = async () => {
    if (selectedInvoiceIds.length === 0) return
    setApproveRunning(true)
    try {
      const result = await api.batchFeedback({ invoice_ids: selectedInvoiceIds, action: 'approve_all', analista: 'batch-analyst' })
      const count = result.total_processed || selectedInvoiceIds.length
      toast.success(`${count} ${activeTab === 'servicos' ? 'aprovadas' : 'processadas'}`)
      setSelected({})
      refetch()
    } catch (e) {
      console.error('Batch approve failed:', e)
      toast.error('Erro ao aprovar', { description: e.message })
    }
    finally { setApproveRunning(false) }
  }

  const handleBatchDismiss = async () => {
    if (selectedInvoiceIds.length === 0) return
    setDismissRunning(true)
    try {
      const result = await api.batchFeedback({ invoice_ids: selectedInvoiceIds, action: 'dismiss', analista: 'batch-analyst' })
      const count = result.total_processed || selectedInvoiceIds.length
      toast.success(`${count} dispensadas`)
      setSelectedItems(new Set())
      refetch()
    } catch (e) {
      console.error('Batch dismiss failed:', e)
      toast.error('Erro ao dispensar', { description: e.message })
    }
    finally { setDismissRunning(false) }
  }

  const handleBatchEscriturar = async () => {
    if (selectedInvoiceIds.length === 0) return
    setEscriturarRunning(true)
    try {
      const result = await api.batchFeedback({ invoice_ids: selectedInvoiceIds, action: 'escriturar', analista: 'batch-analyst' })
      const count = result.total_processed || selectedInvoiceIds.length
      toast.success(`${count} escrituradas`)
      setSelectedItems(new Set())
      refetch()
    } catch (e) {
      console.error('Batch escriturar failed:', e)
      toast.error('Erro ao escriturar', { description: e.message })
    }
    finally { setEscriturarRunning(false) }
  }

  // Toggle helpers
  const toggleProblem = (key) => setExpandedProblems(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n })
  const expandAllProblems = () => setExpandedProblems(new Set(problemGroups.map(g => g.key)))
  const collapseAllProblems = () => setExpandedProblems(new Set())

  // Company filter — only show companies enabled for the current tab type
  const sortedCompanies = useMemo(() => {
    if (!companies) return []
    const list = [...companies]
      .filter(c => {
        if (isNfse) return c.nfse_servicos_enabled
        return c.nfe_entrada_enabled
      })
      .sort((a, b) => (a.razao_social || a.name || '').localeCompare(b.razao_social || b.name || ''))
    if (!companySearch) return list
    const q = companySearch.toLowerCase()
    return list.filter(c => (c.razao_social || c.name || '').toLowerCase().includes(q) || (c.cnpj || '').includes(q))
  }, [companies, companySearch, isNfse])

  const toggleCompany = (id) => { setCompanyFilter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); setPage(1) }

  // Count items by divergence severity
  const divCounts = useMemo(() => {
    let resolver = 0, oportunidades = 0, informativos = 0
    for (const item of items) {
      const divs = item.esc_divergencias
      if (!divs || !Array.isArray(divs) || divs.length === 0) continue
      const sevs = divs.map(d => d.severidade || 'INFORMATIVO')
      if (sevs.some(s => s === 'CRITICO' || s === 'ALERTA')) resolver++
      else if (sevs.some(s => s === 'OPORTUNIDADE')) oportunidades++
      else informativos++
    }
    return { resolver, oportunidades, informativos }
  }, [items])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Tabs — same visual as ListView */}
      <div className="px-6 py-4 border-b border-border bg-background">
        <Tabs
          value={activeTab}
          onValueChange={(tab) => { setActiveTab(tab); setPage(1); setSelectedItems(new Set()); setExpandedProblems(new Set()); setCompanyFilter([]) }}
        >
          <TabsList variant="default">
            {BATCH_TABS.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Header */}
      <div className="px-6 py-5 bg-muted border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Resolução em Lote</h1>
            <p className="text-sm text-muted-foreground mt-1">Divergencias criticas e alertas para resolucao — oportunidades de credito separadas</p>
          </div>
          {/* Summary */}
          <div className="flex items-center gap-3">
            {summary.unique_invoices > 0 && (
              <div className="px-3 py-1.5 bg-muted rounded-lg border border-border text-center">
                <div className="text-xs text-muted-foreground">Notas</div>
                <div className="text-sm font-semibold">{summary.unique_invoices}</div>
              </div>
            )}
            {summary.total_items > 0 && (
              <div className="px-3 py-1.5 bg-muted rounded-lg border border-border text-center">
                <div className="text-xs text-muted-foreground">Itens</div>
                <div className="text-sm font-semibold">{summary.total_items}</div>
              </div>
            )}
            {divCounts.resolver > 0 && (
              <div className="px-3 py-1.5 bg-destructive-subtle rounded-lg border border-destructive-border text-center">
                <div className="text-xs text-destructive-text">Para resolver</div>
                <div className="text-sm font-semibold text-destructive-text">{divCounts.resolver}</div>
              </div>
            )}
            {divCounts.oportunidades > 0 && (
              <div className="px-3 py-1.5 bg-success-subtle rounded-lg border border-success-border text-center">
                <div className="text-xs text-success-text">Oportunidades</div>
                <div className="text-sm font-semibold text-success-text">{divCounts.oportunidades}</div>
              </div>
            )}
            {summary.total_creditos > 0 && (
              <div className="px-3 py-1.5 bg-info-subtle rounded-lg border border-info-border text-center">
                <div className="text-xs text-info-text">Creditos</div>
                <div className="text-sm font-semibold text-info-text">{fmt(summary.total_creditos)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="NCM, produto, emitente..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-8 pr-3 py-1.5 w-56 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>

          {/* Company */}
          <div className="relative">
            <button onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md ${companyFilter.length > 0 ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-input text-muted-foreground hover:bg-muted'}`}>
              <Filter className="w-3.5 h-3.5" />
              {companyFilter.length > 0 ? `${companyFilter.length} empresa${companyFilter.length > 1 ? 's' : ''}` : 'Empresa'}
            </button>
            {showCompanyDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCompanyDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-72 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
                  <div className="p-2 border-b border-border sticky top-0 bg-popover">
                    <input type="text" placeholder="Buscar empresa..." value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring" autoFocus />
                  </div>
                  {companyFilter.length > 0 && (
                    <button onClick={() => { setCompanyFilter([]); setPage(1) }}
                      className="w-full px-3 py-1.5 text-xs text-primary hover:bg-primary/5 text-left">Limpar</button>
                  )}
                  {sortedCompanies.map(c => (
                    <label key={c.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer">
                      <Checkbox checked={companyFilter.includes(c.id)} onCheckedChange={() => toggleCompany(c.id)} />
                      <span className="text-sm truncate">{c.razao_social || c.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Escrituracao — only for Materiais (NF-e) */}
          {!isNfse && (
            <Select value={escFilter || ESC_ALL_VALUE} onValueChange={(v) => { setEscFilter(v === ESC_ALL_VALUE ? '' : v); setPage(1) }}>
              <SelectTrigger className={`h-8 text-sm w-auto ${escFilter ? 'border-primary bg-primary/5 text-primary font-medium' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESC_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value || ESC_ALL_VALUE}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* Date — always visible */}
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <DatePicker
            value={startDate ? new Date(startDate + 'T00:00:00') : null}
            onValueChange={(d) => { setStartDate(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''); setPage(1) }}
            placeholder="Data início"
            className="h-8 w-36 text-sm"
          />
          <span className="text-muted-foreground text-xs">a</span>
          <DatePicker
            value={endDate ? new Date(endDate + 'T00:00:00') : null}
            onValueChange={(d) => { setEndDate(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''); setPage(1) }}
            placeholder="Data fim"
            className="h-8 w-36 text-sm"
          />
          {(startDate || endDate) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton aria-label="Limpar datas" variant="ghost" size="sm"
                  onClick={() => { setStartDate(''); setEndDate(''); setPage(1) }}>
                  <X className="w-3.5 h-3.5" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>Limpar datas</TooltipContent>
            </Tooltip>
          )}

          <div className="flex-1" />

          {/* Secondary grouping */}
          <span className="text-xs text-muted-foreground">Agrupar por:</span>
          <ToggleGroup
            type="single"
            variant="default"
            size="sm"
            value={secondaryGroup}
            onValueChange={(key) => { if (key) { setSecondaryGroup(key); setExpandedProblems(new Set()) } }}
          >
            {SECONDARY_GROUP.map(({ key, label }) => (
              <ToggleGroupItem key={key} value={key} className="text-xs font-medium">
                {key === 'ncm' && isNfse ? 'Cod. Serviço' : key === 'emitente' && isNfse ? 'Prestador' : label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {/* Batch action bar */}
      {selectedItems.size > 0 && (
        <div className="px-6 py-2 bg-primary/5 border-b border-primary/20 flex items-center gap-3">
          <span className="text-sm font-medium text-primary">
            {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'itens'}
            <span className="text-primary/70 font-normal ml-1">({selectedInvoiceIds.length} {selectedInvoiceIds.length === 1 ? 'nota' : 'notas'})</span>
          </span>
          <div className="flex-1" />
          {(batchRunning || approveRunning || dismissRunning || escriturarRunning) && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" />Processando...</span>}

          {/* Separator: Ações do analista */}
          <span className="text-xs text-muted-foreground border-l border-border pl-3">Acao:</span>

          {activeTab === 'materiais' && (
            <Button onClick={handleBatchEscrituracao} disabled={batchRunning || selectedInvoiceIds.length === 0}
              variant="secondary" size="sm" title="Reprocessar pelo motor de regras">
              {batchRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Reprocessar
            </Button>
          )}
          <Button onClick={handleBatchApprove} disabled={approveRunning || selectedInvoiceIds.length === 0}
            variant="info" size="sm" title="Confirmar que o motor acertou">
            {approveRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            Aprovar
          </Button>
          <Button onClick={handleBatchDismiss} disabled={dismissRunning || selectedInvoiceIds.length === 0}
            variant="secondary" size="sm" title="Dispensar sem acao — reconhecer mas nao atuar">
            {dismissRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            Dispensar
          </Button>
          <Button onClick={handleBatchEscriturar} disabled={escriturarRunning || selectedInvoiceIds.length === 0}
            variant="success" size="sm" title="Marcar como pronta para o ERP">
            {escriturarRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookCheck className="w-3.5 h-3.5" />}
            Escriturar
          </Button>
          <Button onClick={() => setSelectedItems(new Set())} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Limpar</Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="px-6 py-2 bg-card border-b border-border flex items-center gap-2">
        <Button onClick={selectAll} variant="ghost" size="xs" className="text-primary hover:text-primary hover:underline">
          {items.length > 0 && items.every(i => selectedItems.has(i.item_id)) ? 'Desmarcar todos' : 'Selecionar todos'}
        </Button>
        <span className="text-muted-foreground">|</span>
        <Button onClick={expandAllProblems} variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground">Expandir</Button>
        <Button onClick={collapseAllProblems} variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground">Recolher</Button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando...</span>
          </div>
        )}

        {!isLoading && problemGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Shield className="w-12 h-12 mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum item encontrado</p>
            <p className="text-xs mt-1">Ajuste os filtros acima para ver itens para analise</p>
          </div>
        )}

        {!isLoading && problemGroups.map((prob) => {
          const isExpanded = expandedProblems.has(prob.key)
          const probItemIds = prob.items.map(i => i.item_id)
          const allSelected = probItemIds.every(id => selectedItems.has(id))
          const someSelected = !allSelected && probItemIds.some(id => selectedItems.has(id))
          const sevVariant = SEV_VARIANT[prob.severidade] || 'secondary'
          const campoLabel = CAMPO_LABELS[prob.campo] || prob.campo
          const totalValue = prob.items.reduce((s, i) => s + (i.vl_item || 0), 0)
          const uniqueInv = new Set(prob.items.map(i => i.invoice_id)).size

          return (
            <div key={prob.key} className="border-b border-border">
              {/* Problem header — the big card */}
              <div
                className={`flex flex-wrap items-start gap-3 px-6 py-3 cursor-pointer hover:bg-muted transition-colors ${
                  allSelected ? 'bg-primary/5' : 'bg-card'
                }`}
                onClick={() => toggleProblem(prob.key)}
              >
                <Checkbox checked={allSelected ? true : (someSelected ? 'indeterminate' : false)}
                  onCheckedChange={() => toggleProblemSelect(prob)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 shrink-0" />

                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />}

                {/* Group info */}
                <div className="flex-1 min-w-[12rem]">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                    <Badge variant={secondaryGroup === 'none' ? 'secondary' : sevVariant}>
                      {secondaryGroup === 'none' ? null : secondaryGroup === 'emitente'
                        ? null : <AlertTriangle className="w-3 h-3" />}
                      {campoLabel}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">{prob.items.length} {prob.items.length === 1 ? 'item' : 'itens'}</span>
                    <span className="text-xs text-muted-foreground">em {uniqueInv} {uniqueInv === 1 ? 'nota' : 'notas'}</span>
                  </div>
                  <p className="text-sm text-foreground leading-snug truncate">{prob.descricao}</p>
                </div>

                {/* Problem stats */}
                <div className="flex items-center gap-4 shrink-0 text-right ml-auto">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Valor total</div>
                    <div className="text-sm font-semibold text-foreground">{fmt(totalValue)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); toggleProblemSelect(prob); }}
                    className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                  >
                    {allSelected ? 'Desmarcar' : 'Selecionar'} todos ({prob.items.length})
                  </Button>
                </div>
              </div>

              {/* Expanded: direct item list */}
              {isExpanded && (
                <div className="bg-muted/70 border-t border-border p-3">
                  <ItemTable items={prob.items} selectedItems={selectedItems} toggleItem={toggleItem} onViewInvoice={onViewInvoice} isNfse={isNfse} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={data?.total_pages || 1} totalItems={data?.total || 0}
        pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1) }} />
    </div>
  )
}


// Divergence severity mini-badge
function DivSevBadge({ severity }) {
  return <Badge variant={SEV_VARIANT[severity] || 'secondary'} className="text-xs px-1.5 py-0">{severity}</Badge>
}

// ──────── Compact item table with inline divergences ────────
function ItemTable({ items, selectedItems, toggleItem, onViewInvoice, indent, isNfse }) {
  const [expandedRows, setExpandedRows] = useState(new Set())
  const toggleRow = (id) => setExpandedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const colCount = isNfse ? 10 : 11

  return (
    <div className={indent ? 'ml-12 mr-4 mb-2' : 'mx-6 mb-2'}>
      <Table className="text-xs bg-card">
        <TableHeader>
          <TableRow className="bg-muted text-left border-b border-border hover:bg-muted">
            <TableHead className="w-7 px-2 py-1.5 h-auto"></TableHead>
            {isNfse ? (
              <>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">NFS-e</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Prestador</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Cod. Serviço</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Descrição</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">ISS Ret.</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Aliq. ISS</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Regime</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground text-right">Valor</TableHead>
              </>
            ) : (
              <>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">NF-e</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Emitente</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">NCM</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Produto</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">CFOP Em.</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">CFOP Ent.</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">CST</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground text-right">Valor</TableHead>
                <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground text-center">Conf.</TableHead>
              </>
            )}
            <TableHead className="w-7 px-2 py-1.5 h-auto"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => {
            const divs = item.esc_divergencias
            const hasDivs = divs && Array.isArray(divs) && divs.length > 0
            const isRowExpanded = expandedRows.has(item.item_id)

            return (
              <React.Fragment key={item.item_id}>
                <TableRow
                  className={`border-t border-border hover:bg-muted cursor-pointer ${selectedItems.has(item.item_id) ? 'bg-primary/5' : ''}`}
                  onClick={() => hasDivs && toggleRow(item.item_id)}
                >
                  <TableCell className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedItems.has(item.item_id)} onCheckedChange={() => toggleItem(item.item_id)} />
                  </TableCell>
                  {isNfse ? (
                    <>
                      <TableCell className="px-2 py-1.5 font-medium text-foreground whitespace-nowrap">
                        {hasDivs && (isRowExpanded ? <ChevronDown className="w-3 h-3 inline mr-1 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 inline mr-1 text-muted-foreground" />)}
                        {item.num_doc || item.invoice_id}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-muted-foreground truncate max-w-xs" title={item.emit_razao_social}>
                        {item.emit_razao_social?.slice(0, 22) || fmtCnpj(item.emit_cnpj)}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 font-mono text-foreground">{item.codigo_servico || '-'}</TableCell>
                      <TableCell className="px-2 py-1.5 text-muted-foreground truncate max-w-xs" title={item.descr_compl}>
                        {item.descr_compl?.slice(0, 40) || '-'}
                      </TableCell>
                      <TableCell className="px-2 py-1.5">{item.iss_retido ? <span className="text-success-text font-medium">Sim</span> : <span className="text-muted-foreground">Não</span>}</TableCell>
                      <TableCell className="px-2 py-1.5 font-mono">{item.aliquota_iss != null ? `${item.aliquota_iss}%` : '-'}</TableCell>
                      <TableCell className="px-2 py-1.5 text-muted-foreground truncate max-w-xs">{item.regime_prestador || '-'}</TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-medium">{fmt(item.vl_item)}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="px-2 py-1.5 font-medium text-foreground whitespace-nowrap">
                        {hasDivs && (isRowExpanded ? <ChevronDown className="w-3 h-3 inline mr-1 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 inline mr-1 text-muted-foreground" />)}
                        {item.num_doc || item.invoice_id}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-muted-foreground truncate max-w-xs" title={item.emit_razao_social}>
                        {item.emit_razao_social?.slice(0, 18) || fmtCnpj(item.emit_cnpj)}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 font-mono text-foreground">{item.ncm || '-'}</TableCell>
                      <TableCell className="px-2 py-1.5 text-muted-foreground truncate max-w-xs" title={item.descr_compl}>
                        {item.descr_compl?.slice(0, 30) || '-'}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 font-mono">{item.cfop_emitente || '-'}</TableCell>
                      <TableCell className="px-2 py-1.5 font-mono">
                        {item.esc_cfop_entrada ? (
                          <span className={item.cfop_emitente && item.esc_cfop_entrada !== item.cfop_emitente ? 'text-warning-text font-semibold' : ''}>{item.esc_cfop_entrada}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 font-mono">{item.cst_icms || '-'}</TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-medium">{fmt(item.vl_item)}</TableCell>
                      <TableCell className="px-2 py-1.5 text-center"><ConfBadge value={item.esc_confianca} /></TableCell>
                    </>
                  )}
                  <TableCell className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                    {onViewInvoice && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <IconButton aria-label="Ver nota" variant="ghost" size="sm"
                            onClick={() => onViewInvoice(item.invoice_id)}>
                            <Eye className="w-3.5 h-3.5" />
                          </IconButton>
                        </TooltipTrigger>
                        <TooltipContent>Ver nota</TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
                {/* Expanded divergence details */}
                {isRowExpanded && hasDivs && (
                  <TableRow>
                    <TableCell colSpan={colCount} className="px-0 py-0 bg-muted/80">
                      <div className="ml-9 mr-4 my-1.5 space-y-1">
                        {divs.map((d, idx) => (
                          <div key={idx} className="flex items-start gap-2 px-3 py-1.5 bg-card rounded border border-border text-xs">
                            <DivSevBadge severity={d.severidade} />
                            <span className="font-medium text-muted-foreground shrink-0">{CAMPO_LABELS[d.campo] || d.campo}:</span>
                            <span className="text-foreground flex-1">{d.descricao}</span>
                            {d.valor_emitente && d.valor_sugerido && (
                              <span className="shrink-0 text-muted-foreground">
                                <span className="text-destructive-text line-through">{d.valor_emitente}</span>
                                {' -> '}
                                <span className="text-success-text font-medium">{d.valor_sugerido}</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
