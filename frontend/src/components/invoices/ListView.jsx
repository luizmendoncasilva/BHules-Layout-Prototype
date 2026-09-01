import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  IconButton, Tooltip, TooltipTrigger, TooltipContent, Tabs, TabsList, TabsTrigger,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, DatePicker,
  Checkbox, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Switch, Button, Badge, Textarea, ToggleGroup, ToggleGroupItem,
} from '@bhubai/bhub-design-system'
import {
  Search, Columns, Eye, ChevronRight, Calendar, Filter, MoreVertical, Download, FileSpreadsheet,
  X, Check, GripVertical, Play, ThumbsUp, ThumbsDown, Send, Zap, Loader2, Undo2, CheckCheck, Lock,
} from 'lucide-react'
import { api } from '../../api/client'
import InvoiceSheet from './InvoiceSheet'
import { useCompany } from '../../context/CompanyContext'
import { useInvoices, useInvoiceFeedback, useNfseFeedback, useUndoEscrituracao } from '../../hooks/useInvoices'
import { useCompanies } from '../../hooks/useCompanies'
import StatusBadge from '../shared/StatusBadge'
import Pagination from '../shared/Pagination'
import { formatCnpj } from '../../utils/cnpj'
import ReprocessingModal from './ReprocessingModal'
import ExportProgressModal from './ExportProgressModal'

// --- Column definitions per tab (matching original design) ---

const materiaisColumns = [
  { id: 'number', label: 'NF-e', defaultVisible: true },
  { id: 'issuerDocument', label: 'CNPJ Emitente', defaultVisible: true },
  { id: 'issuerName', label: 'Nome do Emitente', defaultVisible: true },
  { id: 'amount', label: 'Valor', defaultVisible: true },
  { id: 'issueDate', label: 'Data de Emissão', defaultVisible: true },
  { id: 'competenceDate', label: 'Vencimento', defaultVisible: false },
  { id: 'statusNfe', label: 'Status NF-e', defaultVisible: true },
  { id: 'statusAnalise', label: 'Status Análise', defaultVisible: true },
  { id: 'integracaoApi', label: 'Integração API', defaultVisible: true },
  { id: 'escrituracaoStatus', label: 'Escrituração', defaultVisible: true },
  { id: 'status', label: 'Motor BHub', defaultVisible: true },
  { id: 'manifestacao', label: 'Manifestação', defaultVisible: false },
  { id: 'prazo', label: 'Prazo para Manifestação', defaultVisible: false },
  { id: 'key', label: 'Chave da Nota Fiscal', defaultVisible: false },
  { id: 'serie', label: 'Série', defaultVisible: false },
  { id: 'subtype', label: 'Modelo', defaultVisible: false },
  { id: 'type', label: 'Tipo', defaultVisible: false },
  { id: 'takerDocument', label: 'CNPJ/CPF do Destinatário', defaultVisible: true },
  { id: 'takerName', label: 'Nome do Destinatário', defaultVisible: true },
  { id: 'feedback', label: 'Feedback', defaultVisible: true },
]

const fretesColumns = [
  { id: 'number', label: 'CT-e', defaultVisible: true },
  { id: 'statusAnalise', label: 'Status Análise', defaultVisible: true },
  { id: 'status', label: 'Motor BHub', defaultVisible: true },
  { id: 'key', label: 'Chave CT-e', defaultVisible: true },
  { id: 'amount', label: 'Valor Total do Serviço', defaultVisible: true },
  { id: 'issueDate', label: 'Data de Emissão', defaultVisible: true },
  { id: 'issuerName', label: 'Transportadora', defaultVisible: true },
  { id: 'issuerDocument', label: 'CNPJ Transportadora', defaultVisible: false },
  { id: 'serie', label: 'Série', defaultVisible: false },
  { id: 'integracaoApi', label: 'Integração API', defaultVisible: true },
  { id: 'feedback', label: 'Feedback', defaultVisible: true },
]

const nfcColumns = [
  { id: 'number', label: 'NFC-e', defaultVisible: true },
  { id: 'issuerDocument', label: 'CNPJ Emitente', defaultVisible: true },
  { id: 'issuerName', label: 'Nome do Emitente', defaultVisible: true },
  { id: 'amount', label: 'Valor', defaultVisible: true },
  { id: 'issueDate', label: 'Data de Emissão', defaultVisible: true },
  { id: 'statusAnalise', label: 'Status Análise', defaultVisible: true },
  { id: 'integracaoApi', label: 'Integração API', defaultVisible: true },
  { id: 'escrituracaoStatus', label: 'Escrituração', defaultVisible: true },
  { id: 'status', label: 'Motor BHub', defaultVisible: true },
  { id: 'key', label: 'Chave da Nota Fiscal', defaultVisible: false },
  { id: 'serie', label: 'Série', defaultVisible: false },
  { id: 'feedback', label: 'Feedback', defaultVisible: true },
]

const servicosColumns = [
  { id: 'number', label: 'NFS-e', defaultVisible: true },
  { id: 'issuerDocument', label: 'CNPJ Prestador', defaultVisible: true },
  { id: 'issuerName', label: 'Prestador', defaultVisible: true },
  { id: 'takerDocument', label: 'CNPJ Tomador', defaultVisible: true },
  { id: 'takerName', label: 'Tomador', defaultVisible: true },
  { id: 'amount', label: 'Valor Servico', defaultVisible: true },
  { id: 'issueDate', label: 'Data de Emissão', defaultVisible: true },
  { id: 'dataPagamento', label: 'Data Pagamento', defaultVisible: true },
  { id: 'statusAnalise', label: 'Status Análise', defaultVisible: true },
  { id: 'integracaoApi', label: 'Integração API', defaultVisible: true },
  { id: 'escrituracaoStatus', label: 'Escrituração', defaultVisible: true },
  { id: 'status', label: 'Motor BHules', defaultVisible: true },
  { id: 'codigoServico', label: 'Cod. Servico', defaultVisible: false },
  { id: 'regimePrestador', label: 'Regime', defaultVisible: false },
  { id: 'totalRetencoes', label: 'Retenções', defaultVisible: false },
  { id: 'municipioIncidencia', label: 'Município ISS', defaultVisible: false },
  { id: 'issRetido', label: 'ISS Retido', defaultVisible: false },
  { id: 'key', label: 'Chave NFS-e', defaultVisible: false },
  { id: 'feedback', label: 'Feedback', defaultVisible: true },
]

// Segregação de Notas Fiscais/CT-e/NFC-e por tipo de documento e dois eixos
// independentes (ver notasFiscaisTabs.js): ind_emit (Emitida/Emitido vs
// Recebida/Recebido — quem é o emitente) e ind_oper (Entrada vs Saída —
// natureza da operação). Materiais NF-e e CT-e cruzam os dois; Serviços
// NFS-e só varia por ind_emit; NFC-e não tem segregação nenhuma. A
// navegação entre sub-telas vive na sidebar; `activeTab` aqui é sempre um
// desses ids, injetado pelo App.jsx conforme o módulo (list/cte/nfc) atual.
const TAB_CONFIG = {
  materiais_emitidas_entradas:  { type: 'NFE',  indEmit: '0', indOper: '0', columns: materiaisColumns, label: 'Materiais NF-e — Emitidas — Entradas' },
  materiais_emitidas_saidas:    { type: 'NFE',  indEmit: '0', indOper: '1', columns: materiaisColumns, label: 'Materiais NF-e — Emitidas — Saídas' },
  materiais_recebidas_entradas: { type: 'NFE',  indEmit: '1', indOper: '0', columns: materiaisColumns, label: 'Materiais NF-e — Recebidas — Entradas' },
  materiais_recebidas_saidas:   { type: 'NFE',  indEmit: '1', indOper: '1', columns: materiaisColumns, label: 'Materiais NF-e — Recebidas — Saídas' },
  servicos_prestados: { type: 'NFSE', indEmit: '0', columns: servicosColumns, label: 'Serviços NFS-e — Prestados' },
  servicos_tomados:   { type: 'NFSE', indEmit: '1', columns: servicosColumns, label: 'Serviços NFS-e — Tomados' },
  cte_emitidos_entradas:  { type: 'CTE', indEmit: '0', indOper: '0', columns: fretesColumns, label: 'CT-e — Emitidos — Entradas' },
  cte_emitidos_saidas:    { type: 'CTE', indEmit: '0', indOper: '1', columns: fretesColumns, label: 'CT-e — Emitidos — Saídas' },
  cte_recebidos_entradas: { type: 'CTE', indEmit: '1', indOper: '0', columns: fretesColumns, label: 'CT-e — Recebidos — Entradas' },
  cte_recebidos_saidas:   { type: 'CTE', indEmit: '1', indOper: '1', columns: fretesColumns, label: 'CT-e — Recebidos — Saídas' },
  nfc_emitidas: { type: 'NFCE', indEmit: '0', columns: nfcColumns, label: 'NFC-e — Emitidas' },
}

const DEFAULT_TAB = 'materiais_recebidas_entradas'

const PROBLEM_TYPE_LABELS = {
  municipio_incidencia: 'Município Incidência',
  reinf_r4020: 'REINF R4020',
  valor_iss: 'Valor ISS',
  valor_ir_retido: 'IR Retido',
  valor_pcc_retido: 'PCC Retido',
  valor_inss_retido: 'INSS Retido',
  codigo_servico_lc116: 'Cod. Serviço LC116',
  irrf_aliquota: 'Alíquota IRRF',
  cnae_prestador: 'CNAE Prestador',
  aliq_icms: 'Alíquota ICMS',
  cfop: 'CFOP',
  cst_icms: 'CST ICMS',
  ncm: 'NCM',
}

// Sentinel value for the "Todos"/empty-string option in Radix Select — Radix
// disallows an empty-string SelectItem value.
const SELECT_ALL_VALUE = '__all__'

// Shared class for the icon-only "expand on hover" action-bar buttons —
// consolidated from 8 repeated `max-w-[150px]` magic values.
const EXPAND_LABEL_CLS = 'max-w-0 overflow-hidden group-hover:max-w-36 transition-all duration-200 whitespace-nowrap'

// --- Formatters ---

function formatCurrency(val) {
  if (val == null) return '-'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(val) {
  if (!val) return '-'
  // Data-only (YYYY-MM-DD) precisa ser parseada como LOCAL, não UTC:
  // new Date('2026-06-01') vira 2026-05-31T21:00 em BRT (recua um dia) e a
  // nota de 01/06 aparecia como 31/05. Datetimes (com 'T') já têm hora/fuso.
  const d = new Date(typeof val === 'string' && !val.includes('T') ? `${val}T00:00:00` : val)
  return d.toLocaleDateString('pt-BR')
}

// formatCnpj importado de utils/cnpj — suporta CNPJ alfanumérico (RFB jul/2026).

function getDefaultDateRange() {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10)
  return { startDate: start, endDate: end }
}

// --- Date-type columns (for filter row) ---
const dateColumnIds = new Set(['issueDate', 'competenceDate'])

// --- Non-filterable columns ---
const nonFilterableColumns = new Set(['feedback'])

// --- Select-filter columns (dropdown instead of text input) ---
const selectFilterColumns = new Set(['status', 'statusAnalise', 'integracaoApi', 'escrituracaoStatus'])

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'APROVADA', label: 'Aprovada' },
  { value: 'SUCESSO', label: 'Sucesso' },
  { value: 'VERIFICAR', label: 'Verificar' },
  { value: 'COM_ERROS', label: 'Contém Erros' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'REJEITADA', label: 'Rejeitada' },
  { value: 'NAO_VALIDADA', label: 'Não Validada' },
]

const STATUS_ANALISE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CONFORME', label: 'Conforme' },
  { value: 'REQUER_REVISAO', label: 'Requer revisão' },
  { value: 'BLOQUEADO', label: 'Bloqueado' },
]

const ESCRITURACAO_STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ESCRITURADA', label: 'Escriturada' },
  { value: 'ANALISADA', label: 'Analisada' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CONFIANCA_BAIXA', label: 'Confianca Baixa' },
]

const INTEGRACAO_API_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'sim', label: 'Integrada' },
]

// --- Helper: get raw text value of a cell for filtering ---
function getRawCellText(inv, colId, companyName, companies) {
  switch (colId) {
    case 'amount': return String(inv.vl_doc ?? inv.amount ?? '')
    case 'issueDate': return inv.dt_doc ?? inv.issueDate ?? ''
    case 'competenceDate': return inv.dt_doc ?? inv.competenceDate ?? ''
    case 'number': return String(inv.num_doc ?? inv.number ?? '')
    case 'issuerDocument': return inv.emit_cnpj ?? inv.issuerDocument ?? ''
    case 'takerDocument': return inv.dest_cnpj ?? inv.takerDocument ?? ''
    case 'issuerName': return inv.emit_razao_social ?? inv.issuerName ?? ''
    case 'takerName': {
      const co = (companies || []).find(c => c.id === inv.company_id)
      return co?.razao_social || co?.name || companyName || inv.dest_cnpj || ''
    }
    case 'key': return inv.chave_nfe ?? inv.key ?? ''
    case 'serie': return inv.serie ?? ''
    case 'status': {
      if (inv.analise_status) return inv.analise_status
      if (inv.escrituracao_status === 'ESCRITURADA' || inv.escrituracao_status === 'ANALISADA') return 'SUCESSO'
      return inv.validation_status ?? ''
    }
    case 'statusNfe': {
      const sit = inv.cod_sit
      const labels = { '00': 'Regular', '02': 'Cancelada', '03': 'Inutilizada', '04': 'Denegada' }
      let text = labels[sit] || sit || 'Regular'
      if (inv.carta_correcao) text += ' / CC-e'
      return text
    }
    case 'statusAnalise': return inv.status_analise ?? ''
    case 'oportunidades': return inv.oportunidades_count || 0
    case 'escrituracaoStatus': return inv.escrituracao_status || 'PENDENTE'
    case 'subtype': return inv.cod_mod ?? ''
    case 'type': return inv.ind_oper === '0' ? 'Entrada' : 'Saída'
    case 'codigoServico': return inv.codigo_servico_lc116 ?? inv.codigo_servico_municipal ?? ''
    case 'totalRetencoes': {
      const ret = (Number(inv.valor_ir_retido) || 0) + (Number(inv.valor_pis_retido) || 0)
        + (Number(inv.valor_cofins_retido) || 0) + (Number(inv.valor_csll_retido) || 0)
        + (Number(inv.valor_inss_retido) || 0) + (Number(inv.valor_iss) || 0)
      return String(ret)
    }
    case 'regimePrestador': return inv.regime_prestador ?? ''
    case 'municipioIncidencia': return inv.municipio_incidencia_ibge ?? ''
    case 'issRetido': return inv.iss_retido ? 'Sim' : 'Não'
    case 'dataPagamento': return inv.data_pagamento ?? ''
    case 'confidence': return inv.status_analise ?? ''  // confidence rendered in cell renderer
    case 'integracaoApi': return inv.integrado_api_em ? 'sim' : ''
    default: return String(inv[colId] ?? '')
  }
}

// --- Feedback Modal component ---
function FeedbackModal({ invoiceId, isNfse, onClose, onSubmit }) {
  const [selectedCategories, setSelectedCategories] = useState([])
  const [comment, setComment] = useState('')

  const nfeCategories = [
    { id: 'classificacao', label: 'Classificação fiscal incorreta' },
    { id: 'aliquota', label: 'Aliquota errada' },
    { id: 'cfop', label: 'CFOP divergente' },
    { id: 'cst', label: 'CST incorreto' },
    { id: 'credito', label: 'Crédito indevido/faltante' },
    { id: 'outro', label: 'Outro' },
  ]

  const nfseCategories = [
    { id: 'irrf', label: 'IRRF incorreto' },
    { id: 'csll', label: 'CSLL incorreta' },
    { id: 'pis', label: 'PIS incorreto' },
    { id: 'cofins', label: 'COFINS incorreta' },
    { id: 'inss', label: 'INSS incorreto' },
    { id: 'iss', label: 'ISS incorreto' },
    { id: 'outro', label: 'Outro' },
  ]

  const categories = isNfse ? nfseCategories : nfeCategories

  const toggleCategory = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    )
  }

  const handleSubmit = () => {
    const catLabels = selectedCategories.map((id) => `[${id}]`).join(' ')
    onSubmit(invoiceId, 'down', `${catLabels} ${comment}`.trim(), selectedCategories)
    onClose()
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="sm:max-w-md p-0 gap-0 flex flex-col" showCloseButton={false}>
        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between border-b border-border space-y-0 px-6 py-4">
          <div>
            <SheetTitle>Reportar problema</SheetTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{isNfse ? 'NFS-e' : 'NF'} #{invoiceId}</p>
          </div>
          <IconButton aria-label="Fechar" variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </IconButton>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Categories (multi-select) */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Tipo do problema <span className="text-muted-foreground font-normal">(selecione um ou mais)</span>
            </label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              spacing={2}
              value={selectedCategories}
              onValueChange={setSelectedCategories}
              className="grid grid-cols-2 gap-2 w-full"
            >
              {categories.map((cat) => (
                <ToggleGroupItem key={cat.id} value={cat.id} className="w-full justify-start h-auto py-2 text-left whitespace-normal">
                  {cat.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Detalhes <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Descreva o que deveria ser diferente..."
              className="resize-none h-24"
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="flex-row items-center justify-end gap-3 border-t border-border bg-muted px-6 py-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={selectedCategories.length === 0}>
            <Send className="w-4 h-4" /> Enviar feedback
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// --- FeedbackCell component ---
function FeedbackCell({ invoiceId, isNfse, feedbackMap, onVote, locked }) {
  const current = feedbackMap[invoiceId] || null
  const [showModal, setShowModal] = useState(false)

  if (locked) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Lock className="w-3 h-3" /> Integrada
      </Badge>
    )
  }

  const handleUp = (e) => {
    e.stopPropagation()
    onVote(invoiceId, 'up')
  }

  const handleDown = (e) => {
    e.stopPropagation()
    if (current === 'down') return
    setShowModal(true)
  }

  return (
    <>
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <IconButton
          aria-label="Feedback positivo"
          variant="ghost"
          size="xs"
          onClick={handleUp}
          className={current === 'up' ? 'text-success-text bg-success-subtle hover:text-success-text hover:bg-success-subtle' : 'hover:text-success-text hover:bg-success-subtle'}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton
          aria-label="Feedback negativo"
          variant="ghost"
          size="xs"
          onClick={handleDown}
          className={current === 'down' ? 'text-destructive-text bg-destructive-subtle hover:text-destructive-text hover:bg-destructive-subtle' : 'hover:text-destructive-text hover:bg-destructive-subtle'}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </IconButton>
      </div>
      {showModal && (
        <FeedbackModal
          invoiceId={invoiceId}
          isNfse={isNfse}
          onClose={() => setShowModal(false)}
          onSubmit={(id, vote, comment, categories) => {
            onVote(id, vote, comment, categories)
            setShowModal(false)
          }}
        />
      )}
    </>
  )
}

export default function ListView({ onRowClick, activeTab: activeTabProp, onTabChange, startDate: startDateProp, onStartDateChange, endDate: endDateProp, onEndDateChange, companyIds: companyIdsProp, onCompanyIdsChange }) {
  const { companyName } = useCompany()
  const { data: companies = [] } = useCompanies()
  const [activeTabLocal, setActiveTabLocal] = useState(DEFAULT_TAB)
  const activeTab = activeTabProp ?? activeTabLocal
  const setActiveTab = (tab) => { setActiveTabLocal(tab); onTabChange?.(tab) }
  const activeCfg = TAB_CONFIG[activeTab] || TAB_CONFIG[DEFAULT_TAB]
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Company multi-select filter (shared via props when available)
  const [localCompanyIds, setLocalCompanyIds] = useState([])
  const selectedCompanyIds = companyIdsProp ?? localCompanyIds
  const setSelectedCompanyIds = onCompanyIdsChange ?? setLocalCompanyIds
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false)
  const [companySearch, setCompanySearch] = useState('')

  // Row selection for batch operations
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Advanced filters
  const [cnpjEmitFilter, setCnpjEmitFilter] = useState('')
  const [cnpjDestFilter, setCnpjDestFilter] = useState('')
  const [debouncedCnpjEmit, setDebouncedCnpjEmit] = useState('')
  const [debouncedCnpjDest, setDebouncedCnpjDest] = useState('')
  // Status analysis quick filter (pills — single source of truth)
  const [statusAnaliseFilter, setStatusAnaliseFilter] = useState('')

  // Problem type filter (NFS-e)
  const [problemTypeFilter, setProblemTypeFilter] = useState('')

  // Batch escrituracao state
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchResult, setBatchResult] = useState(null)

  // Reprocess modal state
  const [showReprocessModal, setShowReprocessModal] = useState(false)
  const [reprocessProgress, setReprocessProgress] = useState(null)

  // Undo escrituracao
  const undoMutation = useUndoEscrituracao()

  // Sorted companies (alphabetically), filtered by tab type flags
  const isNfseTab = activeCfg.type === 'NFSE'
  const sortedCompanies = useMemo(
    () => [...companies]
      .filter(c => isNfseTab ? c.nfse_servicos_enabled : c.nfe_entrada_enabled)
      .sort((a, b) => (a.razao_social || '').localeCompare(b.razao_social || '', 'pt-BR')),
    [companies, isNfseTab],
  )

  // Column config drawer
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [configTab, setConfigTab] = useState('Colunas')
  const [pivotMode, setPivotMode] = useState(false)

  // Columns state per tab
  const [columns, setColumns] = useState(
    activeCfg.columns.map((c) => ({ ...c, visible: c.defaultVisible }))
  )

  // Date range (shared via props when available)
  const defaults = getDefaultDateRange()
  const [localStartDate, setLocalStartDate] = useState(defaults.startDate)
  const [localEndDate, setLocalEndDate] = useState(defaults.endDate)
  const startDate = startDateProp ?? localStartDate
  const setStartDate = onStartDateChange ?? setLocalStartDate
  const endDate = endDateProp ?? localEndDate
  const setEndDate = onEndDateChange ?? setLocalEndDate

  // Inline column filters
  const [columnFilters, setColumnFilters] = useState({})

  // Feedback state (local cache: invoiceId -> 'up'|'down')
  const [feedbackMap, setFeedbackMap] = useState({})
  const nfeFeedbackMutation = useInvoiceFeedback()
  const nfseFeedbackMutation = useNfseFeedback()

  // Invoice sheet (side panel)
  const [sheetInvoice, setSheetInvoice] = useState(null)
  const isSheetOpen = sheetInvoice != null

  // Reset columns and filters when tab changes
  useEffect(() => {
    setColumns(activeCfg.columns.map((c) => ({ ...c, visible: c.defaultVisible })))
    setColumnFilters({})
    setProblemTypeFilter('')
    setSelectedCompanyIds([])
  }, [activeTab])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Debounce CNPJ filters
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCnpjEmit(cnpjEmitFilter), 400)
    return () => clearTimeout(t)
  }, [cnpjEmitFilter])
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCnpjDest(cnpjDestFilter), 400)
    return () => clearTimeout(t)
  }, [cnpjDestFilter])

  // Reset page and selection on filter change
  useEffect(() => { setPage(1); setSelectedIds(new Set()); setBatchResult(null) }, [selectedCompanyIds, activeTab, debouncedSearch, startDate, endDate, statusAnaliseFilter, debouncedCnpjEmit, debouncedCnpjDest, problemTypeFilter])

  // Close company dropdown on outside click
  useEffect(() => {
    if (!companyDropdownOpen) return
    const handler = (e) => {
      if (!e.target.closest('.company-dropdown')) { setCompanyDropdownOpen(false); setCompanySearch('') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [companyDropdownOpen])

  const currentType = activeCfg.type
  const codModMap = { NFE: '55', CTE: '57', NFSE: 'NFSE', NFCE: '65' }
  const currentCodMod = currentType ? codModMap[currentType] : null
  const currentIndEmit = activeCfg.indEmit
  const currentIndOper = activeCfg.indOper

  // Status counts per tab (filtrado por cod_mod + ind_emit + ind_oper + empresas + datas).
  // Invalidacao acontece nas mutations relevantes (DetailView, EscrituracaoTab,
  // useUndoEscrituracao) — sem polling de 60s, que era custo inutil em abas
  // ociosas (multiplica # de tabs abertas x analistas).
  const { data: statusCounts = {} } = useQuery({
    queryKey: ['statusCounts', currentCodMod, currentIndEmit, currentIndOper, selectedCompanyIds, startDate, endDate],
    queryFn: () => api.getStatusCounts(
      selectedCompanyIds.length > 0 ? selectedCompanyIds : undefined,
      currentCodMod,
      startDate || undefined,
      endDate || undefined,
      currentIndEmit || undefined,
      currentIndOper || undefined
    ),
    staleTime: 60_000,
  })

  // Problem types for NFS-e filter
  const { data: problemTypes = [] } = useQuery({
    queryKey: ['problemTypes', currentCodMod],
    queryFn: () => api.getProblemTypes(currentCodMod),
    enabled: currentCodMod === 'NFSE',
  })

  const toggleCompany = (id) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const companyFilterLabel = useMemo(() => {
    if (selectedCompanyIds.length === 0) return 'Todos os clientes'
    if (selectedCompanyIds.length === 1) {
      const c = companies.find((x) => x.id === selectedCompanyIds[0])
      return c?.razao_social || 'Cliente'
    }
    return `${selectedCompanyIds.length} clientes`
  }, [selectedCompanyIds, companies])

  // Use DB invoices — single status filter via pills (no escrituracaoStatus)
  const { data, isLoading, refetch } = useInvoices({
    companyIds: selectedCompanyIds.length > 0 ? selectedCompanyIds : undefined,
    page,
    size: pageSize,
    search: debouncedSearch || undefined,
    codMod: currentCodMod || undefined,
    indEmit: currentIndEmit || undefined,
    indOper: currentIndOper || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    statusAnalise: statusAnaliseFilter || undefined,
    cnpjEmit: debouncedCnpjEmit || undefined,
    cnpjDest: debouncedCnpjDest || undefined,
    problemType: problemTypeFilter || undefined,
  })

  // Invoices from API (already filtered by cod_mod server-side)
  const allInvoices = data?.items || []
  const totalFromServer = data?.total || 0

  // Compute active filter count for badge
  const activeFilters = useMemo(() => {
    const filters = []
    if (selectedCompanyIds.length > 0) filters.push({ key: 'company', label: companyFilterLabel, clear: () => setSelectedCompanyIds([]) })
    if (startDate || endDate) filters.push({ key: 'date', label: `${startDate || '...'} a ${endDate || '...'}`, clear: () => { setStartDate(''); setEndDate('') } })
    if (debouncedSearch) filters.push({ key: 'search', label: `Busca: "${debouncedSearch}"`, clear: () => { setSearch(''); setDebouncedSearch('') } })
    if (debouncedCnpjEmit) filters.push({ key: 'cnpjEmit', label: `Emitente: ${debouncedCnpjEmit}`, clear: () => { setCnpjEmitFilter(''); setDebouncedCnpjEmit('') } })
    if (debouncedCnpjDest) filters.push({ key: 'cnpjDest', label: `Destinatario: ${debouncedCnpjDest}`, clear: () => { setCnpjDestFilter(''); setDebouncedCnpjDest('') } })
    if (problemTypeFilter) filters.push({ key: 'problem', label: `Problema: ${problemTypeFilter}`, clear: () => setProblemTypeFilter('') })
    if (statusAnaliseFilter) filters.push({ key: 'status', label: `Status: ${statusAnaliseFilter}`, clear: () => setStatusAnaliseFilter('') })
    return filters
  }, [selectedCompanyIds, startDate, endDate, debouncedSearch, debouncedCnpjEmit, debouncedCnpjDest, problemTypeFilter, statusAnaliseFilter, companyFilterLabel])

  // statusCounts now managed by React Query (queryKey: ['statusCounts'])

  // Reprocess engine (async SQS + polling)
  const handleReprocessConfirmed = async () => {
    if (reprocessProgress) return
    // Use only companies that actually have invoices on screen
    const idsFromInvoices = [...new Set(allInvoices.map((inv) => inv.company_id))]
    const ids = selectedCompanyIds.length > 0 ? selectedCompanyIds : idsFromInvoices
    setReprocessProgress({ current: 0, total: 0, errors: 0 })
    try {
      // Dispatch async jobs — use NFS-e endpoint when on Serviços tab
      const reprocessFn = isNfseTab ? api.reprocessNfseAsync : api.reprocessCompanyAsync
      const jobPromises = ids.map((cid) => reprocessFn(cid, startDate, endDate))
      const jobResults = await Promise.allSettled(jobPromises)
      const jobs = jobResults
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value)

      if (jobs.length === 0) {
        setReprocessProgress(null)
        return
      }

      const totalInvoices = jobs.reduce((sum, j) => sum + (j.total_invoices || 0), 0)
      setReprocessProgress({ current: 0, total: totalInvoices, errors: 0, jobs })

      // Poll progress every 2s
      const pollInterval = setInterval(async () => {
        try {
          const statuses = await Promise.all(
            jobs.map((j) => api.getReprocessStatus(j.job_id))
          )
          const totalProcessed = statuses.reduce((s, j) => s + (j.processed || 0), 0)
          const totalErrors = statuses.reduce((s, j) => s + (j.errors || 0), 0)
          const totalAll = statuses.reduce((s, j) => s + (j.total_invoices || 0), 0)

          setReprocessProgress((prev) => ({
            ...prev,
            current: Math.max(prev?.current || 0, totalProcessed),
            total: Math.max(prev?.total || 0, totalAll),
            errors: totalErrors,
            jobs: statuses,
          }))

          const allDone = statuses.every(
            (j) => ['COMPLETED', 'FAILED', 'CANCELLED'].includes(j.status)
          )
          if (allDone) {
            clearInterval(pollInterval)
            // Don't auto-dismiss — user closes from results modal
          }
        } catch {
          // ignore poll errors, retry next tick
        }
      }, 2000)
    } catch (e) {
      console.error('Reprocess error:', e)
      setReprocessProgress(null)
    }
  }

  // Batch undo handler
  const handleBatchUndo = useCallback(async () => {
    if (selectedIds.size === 0) return
    undoMutation.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        setSelectedIds(new Set())
        refetch()
      },
    })
  }, [selectedIds, undoMutation, refetch])

  // Batch escrituracao handler
  const handleBatchEscrituracao = useCallback(async () => {
    if (batchRunning || selectedIds.size === 0) return
    setBatchRunning(true)
    setBatchResult(null)
    try {
      const result = await api.runEscrituracaoBatch(Array.from(selectedIds))
      setBatchResult({ success: true, count: result?.total_processed ?? selectedIds.size })
      setSelectedIds(new Set())
      refetch()
    } catch (err) {
      setBatchResult({ success: false, error: err.message })
    } finally {
      setBatchRunning(false)
    }
  }, [batchRunning, selectedIds, refetch])

  // Batch approve handler
  const [approveRunning, setApproveRunning] = useState(false)
  const [approveResult, setApproveResult] = useState(null) // { success, count, errors } or null
  const handleBatchApprove = useCallback(async () => {
    if (selectedIds.size === 0) return
    setApproveRunning(true)
    setApproveResult(null)
    try {
      const result = await api.batchFeedback({
        invoice_ids: Array.from(selectedIds),
        action: 'approve_all',
      })
      const processed = result?.total_processed ?? 0
      const errors = result?.total_errors ?? 0
      setApproveResult({ success: true, count: processed, errors })
      setSelectedIds(new Set())
      refetch()
      // Auto-dismiss success after 5s
      setTimeout(() => setApproveResult(null), 5000)
    } catch (err) {
      setApproveResult({ success: false, error: err.message })
      setTimeout(() => setApproveResult(null), 8000)
    } finally {
      setApproveRunning(false)
    }
  }, [selectedIds, refetch])

  // PDF download state
  const [pdfProgress, setPdfProgress] = useState(null) // { current, total } or null

  // Bulk PDF download handler
  const handleBulkPdfDownload = useCallback(async () => {
    const invoicesToDownload = selectedIds.size > 0
      ? allInvoices.filter(inv => selectedIds.has(inv.id))
      : allInvoices
    if (invoicesToDownload.length === 0) return

    setPdfProgress({ current: 0, total: invoicesToDownload.length })
    try {
      const { generateBulkPdfs, downloadBlob } = await import('../../services/pdfGenerator')
      const zipBlob = await generateBulkPdfs(invoicesToDownload, (current, total) => {
        setPdfProgress({ current, total })
      })
      downloadBlob(zipBlob, `nfe_pdfs_${new Date().toISOString().slice(0, 10)}.zip`)
    } catch (err) {
      console.error('PDF generation error:', err)
    } finally {
      setPdfProgress(null)
    }
  }, [selectedIds, allInvoices])

  // Excel export — fluxo assíncrono via S3: POST cria job, GET pollla status,
  // download direto da URL assinada (mata o 29s do API Gateway e o limite de
  // 10MB de payload). Modal não-bloqueante mostra progresso.
  const [exportJob, setExportJob] = useState(null) // { job_id, status, ... } | null
  // Tipo de NF do export: '' = todos (abas por tipo), ou entrada|saida|servico|cte.
  const [exportTipo, setExportTipo] = useState('')
  // O job roda no servidor e sobrevive a recargas/expiração de token. Guardamos
  // o job_id ativo no localStorage para retomar o polling após reload — sem
  // isso, fechar/recarregar a aba "perdia" um export que já estava pronto no S3.
  const EXPORT_JOB_KEY = 'bhules_export_job_id'
  const handleExportExcel = useCallback(async () => {
    try {
      const invoiceIds = selectedIds.size > 0 ? Array.from(selectedIds) : undefined
      const { job_id } = await api.createExportXlsxJob({
        companyId: selectedCompanyIds.length === 1 ? selectedCompanyIds[0] : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        invoiceIds,
        tipoNf: exportTipo || undefined,
      })
      try { localStorage.setItem(EXPORT_JOB_KEY, job_id) } catch { /* ignore */ }
      setExportJob({ job_id, status: 'PENDING' })
    } catch (err) {
      setExportJob({ status: 'FAILED', error_message: err?.message || 'Falha ao iniciar export' })
    }
  }, [selectedIds, selectedCompanyIds, startDate, endDate, exportTipo])

  // Retoma um export em andamento após reload (job_id persistido).
  useEffect(() => {
    let saved = null
    try { saved = localStorage.getItem(EXPORT_JOB_KEY) } catch { /* ignore */ }
    if (saved) setExportJob({ job_id: saved, status: 'PROCESSING' })
  }, [])

  // Poll do job ativo a cada 2s até terminar (COMPLETED ou FAILED).
  // Tolera erros transitórios (rede, refresh de token Auth0): só desiste após
  // várias falhas seguidas — o job continua no servidor enquanto isso.
  useEffect(() => {
    if (!exportJob?.job_id) return
    if (exportJob.status !== 'PENDING' && exportJob.status !== 'PROCESSING') return

    let cancelled = false
    let consecutiveErrors = 0
    const MAX_ERRORS = 5
    const tick = async () => {
      try {
        const status = await api.getExportXlsxJob(exportJob.job_id)
        consecutiveErrors = 0
        if (cancelled) return
        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          try { localStorage.removeItem(EXPORT_JOB_KEY) } catch { /* ignore */ }
        }
        setExportJob((prev) => (prev?.job_id === status.job_id ? status : prev))
      } catch (err) {
        consecutiveErrors += 1
        if (!cancelled && consecutiveErrors >= MAX_ERRORS) {
          try { localStorage.removeItem(EXPORT_JOB_KEY) } catch { /* ignore */ }
          setExportJob((prev) => prev ? { ...prev, status: 'FAILED', error_message: err?.message || 'Falha ao consultar o export' } : prev)
        }
      }
    }
    const id = setInterval(tick, 2000)
    return () => { cancelled = true; clearInterval(id) }
  }, [exportJob?.job_id, exportJob?.status])

  // Row selection handlers
  const toggleRowSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Compute which status values actually exist in current data
  const availableStatusOptions = useMemo(() => {
    const existing = new Set(allInvoices.map((inv) => getRawCellText(inv, 'status', companyName)))
    return STATUS_OPTIONS.filter((opt) => opt.value === '' || existing.has(opt.value))
  }, [allInvoices, companyName])

  const availableStatusAnaliseOptions = STATUS_ANALISE_OPTIONS

  // Apply inline column filters (client-side)
  const invoices = useMemo(() => {
    const activeFilters = Object.entries(columnFilters).filter(([, v]) => v.trim())
    if (activeFilters.length === 0) return allInvoices
    return allInvoices.filter((inv) =>
      activeFilters.every(([colId, filterVal]) => {
        const raw = getRawCellText(inv, colId, companyName, companies)
        if (selectFilterColumns.has(colId)) return raw === filterVal
        return raw.toLowerCase().includes(filterVal.toLowerCase())
      })
    )
  }, [allInvoices, columnFilters])

  // Select all / deselect all for visible (filtered) invoices
  const allVisibleSelected = invoices.length > 0 && invoices.every((inv) => selectedIds.has(inv.id))
  const someVisibleSelected = invoices.some((inv) => selectedIds.has(inv.id))
  const allSelectedEscrituradas = selectedIds.size > 0 && [...selectedIds].every(id => {
    const inv = allInvoices.find(i => i.id === id)
    return inv?.escrituracao_status === 'ESCRITURADA'
  })
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        invoices.forEach((inv) => next.delete(inv.id))
      } else {
        invoices.forEach((inv) => next.add(inv.id))
      }
      return next
    })
  }, [invoices, allVisibleSelected])

  const total = data?.total || 0
  const totalPages = data?.total_pages || 1

  // Feedback handler — routes to correct API based on tab (Materiais/CTE/NFC vs Serviços)
  const handleFeedbackVote = useCallback((invoiceId, vote, comment, categories) => {
    setFeedbackMap((prev) => ({ ...prev, [invoiceId]: vote }))
    const mutation = isNfseTab ? nfseFeedbackMutation : nfeFeedbackMutation
    mutation.mutate({ invoiceId, vote, comment, categories })
  }, [isNfseTab, nfeFeedbackMutation, nfseFeedbackMutation])

  const toggleColumn = useCallback((id) => {
    setColumns((cols) => cols.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)))
  }, [])

  const visibleColumns = columns.filter((c) => c.visible)

  function getCellValue(inv, colId) {
    // Map IntegradorNF field names → DB Invoice model fields
    switch (colId) {
      case 'amount':
        return formatCurrency(inv.vl_doc ?? inv.amount)
      case 'issueDate':
        return formatDate(inv.dt_doc ?? inv.issueDate)
      case 'competenceDate':
        return formatDate(inv.dt_doc ?? inv.competenceDate)
      case 'number':
        return <span className="font-medium text-foreground">{inv.num_doc ?? inv.number ?? '-'}</span>
      case 'issuerDocument':
        return formatCnpj(inv.emit_cnpj ?? inv.issuerDocument)
      case 'takerDocument':
        return formatCnpj(inv.dest_cnpj ?? inv.takerDocument)
      case 'issuerName':
        return inv.emit_razao_social ?? inv.issuerName ?? '-'
      case 'takerName': {
        // Look up company name by company_id from the companies list
        const co = companies.find(c => c.id === inv.company_id)
        return co?.razao_social || co?.name || companyName || (inv.dest_cnpj ? formatCnpj(inv.dest_cnpj) : '-')
      }
      case 'key':
        return inv.chave_nfe ?? inv.key ?? '-'
      case 'serie':
        return inv.serie ?? '-'
      case 'escrituracaoStatus': {
        const es = inv.escrituracao_status
        if (es === 'ESCRITURADA') return <StatusBadge status="ESCRITURADA" />
        if (es === 'ANALISADA') return <StatusBadge status="ANALISADA" />
        if (es === 'CONFIANCA_BAIXA') return <StatusBadge status="CONFIANCA_BAIXA" />
        return <span className="text-neutral-300">-</span>
      }
      case 'status': {
        const es = inv.escrituracao_status
        const motorStatus = inv.analise_status
          || (es && es !== 'PENDENTE' ? 'SUCESSO' : null)
          || inv.validation_status
          || 'NAO_VALIDADA'
        return <StatusBadge status={motorStatus} />
      }
      case 'statusNfe': {
        const sit = inv.cod_sit
        const labels = { '00': 'Regular', '02': 'Cancelada', '03': 'Inutilizada', '04': 'Denegada' }
        const label = labels[sit] || sit || 'Regular'
        const isCancelled = sit === '02'
        const isDenied = sit === '03' || sit === '04'
        const hasCCe = inv.carta_correcao
        return (
            <span className="inline-flex items-center gap-1">
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
        isCancelled ? 'bg-destructive-subtle text-destructive-text'
        : isDenied ? 'bg-warning-subtle text-warning-text'
        : 'bg-success-subtle text-success-text'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isCancelled ? 'bg-destructive' : isDenied ? 'bg-warning' : 'bg-success'
        }`} />
        {label}
      </span>
      {hasCCe && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-info-subtle text-info-text" title="Carta de Correção">
          CC-e
        </span>
      )}
    </span>
        )
      }
      case 'statusAnalise': {
        const sa = inv.status_analise
        if (!sa) return <span className="text-muted-foreground">-</span>
        return <StatusBadge status={sa} />
      }
      case 'oportunidades': {
        const count = inv.oportunidades_count || 0
        if (count === 0) return <span className="text-neutral-300">-</span>
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-subtle text-success-text border border-success-border">
            {count} {count === 1 ? 'item' : 'itens'}
          </span>
        )
      }
      case 'subtype':
        return inv.cod_mod ?? '-'
      case 'type':
        return inv.ind_oper === '0' ? 'Entrada' : 'Saída'
      case 'codigoServico':
        return <span className="font-mono">{inv.codigo_servico_lc116 || inv.codigo_servico_municipal || '-'}</span>
      case 'totalRetencoes': {
        const ret = (Number(inv.valor_ir_retido) || 0) + (Number(inv.valor_pis_retido) || 0)
          + (Number(inv.valor_cofins_retido) || 0) + (Number(inv.valor_csll_retido) || 0)
          + (Number(inv.valor_inss_retido) || 0) + (Number(inv.valor_iss) || 0)
        return ret > 0 ? formatCurrency(ret) : <span className="text-muted-foreground">-</span>
      }
      case 'regimePrestador':
        return inv.regime_prestador || <span className="text-muted-foreground">-</span>
      case 'municipioIncidencia':
        return inv.municipio_incidencia_ibge || <span className="text-muted-foreground">-</span>
      case 'issRetido':
        return inv.iss_retido ? <span className="text-success-text font-medium">Sim</span> : <span className="text-muted-foreground">Não</span>
      case 'dataPagamento':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DatePicker
              value={inv.data_pagamento ? new Date(inv.data_pagamento + 'T00:00:00') : null}
              onValueChange={async (d) => {
                const val = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''
                try {
                  await api.updateDataPagamento(inv.id, val)
                  inv.data_pagamento = val
                  refetch()
                } catch (err) { console.error('Failed to update data_pagamento', err) }
              }}
              placeholder="-"
              className="w-28 h-7 text-xs px-1.5 py-0.5"
            />
          </div>
        )
      case 'confidence': {
        const st = inv.status_analise
        if (!st) return <span className="text-muted-foreground">-</span>
        const confMap = {
          'ANALISADA': { label: 'Alta', cls: 'bg-success-subtle text-success-text' },
          'REVISAO_HUMANA': { label: 'Média', cls: 'bg-warning-subtle text-warning-text' },
          'REQUER_REVISAO': { label: 'Média', cls: 'bg-warning-subtle text-warning-text' },
          'NAO_ANALISADA': { label: 'Baixa', cls: 'bg-destructive-subtle text-destructive-text' },
          'BLOQUEADA': { label: '-', cls: 'bg-destructive-subtle text-destructive-text' },
        }
        const conf = confMap[st]
        if (!conf) return <span className="text-muted-foreground">-</span>
        return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${conf.cls}`}>{conf.label}</span>
      }
      case 'integracaoApi': {
        if (!inv.integrado_api_em) return <span className="text-neutral-300">-</span>
        const dtInteg = new Date(inv.integrado_api_em)
        const fmtInteg = dtInteg.toLocaleDateString('pt-BR')
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            <Lock className="w-3 h-3" />
            {fmtInteg}
          </span>
        )
      }
      default:
        return inv[colId] || '-'
    }
  }

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Título — a navegação entre sub-telas (tipo/direção) agora vive na
          sidebar (ver Sidebar.jsx: Notas Fiscais / CTE / NFC). */}
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">{activeCfg.label}</h1>
      </div>

      {/* Toolbar — single row: filters left, action icons right */}
      <div className="px-6 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {/* Company multi-select filter */}
          <div className="relative company-dropdown">
            <button
              onClick={() => setCompanyDropdownOpen((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors min-w-40 ${
                selectedCompanyIds.length > 0
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-input text-muted-foreground hover:bg-muted'
              }`}
            >
              <Filter className="w-4 h-4 shrink-0" />
              <span className="truncate">{companyFilterLabel}</span>
              {selectedCompanyIds.length > 0 && (
                <X
                  className="w-3.5 h-3.5 ml-auto shrink-0 hover:text-destructive-text"
                  onClick={(e) => { e.stopPropagation(); setSelectedCompanyIds([]) }}
                />
              )}
            </button>
            {companyDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-card border border-border rounded-lg shadow-lg z-30 max-h-72 flex flex-col">
                <div className="px-3 py-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                    <input
                      type="text"
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      placeholder="Buscar empresa..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="overflow-auto py-1 flex-1">
                  {sortedCompanies
                    .filter((c) => !companySearch || c.razao_social?.toLowerCase().includes(companySearch.toLowerCase()))
                    .map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={selectedCompanyIds.includes(c.id)}
                        onCheckedChange={() => toggleCompany(c.id)}
                      />
                      <span className="truncate text-foreground/80">{c.razao_social}</span>
                    </label>
                  ))}
                  {sortedCompanies.filter((c) => !companySearch || c.razao_social?.toLowerCase().includes(companySearch.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      {sortedCompanies.length === 0 ? 'Carregando...' : 'Nenhuma empresa encontrada'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Problem type filter — NFS-e only */}
          {currentCodMod === 'NFSE' && (
            <Select
              value={problemTypeFilter || SELECT_ALL_VALUE}
              onValueChange={(v) => setProblemTypeFilter(v === SELECT_ALL_VALUE ? '' : v)}
            >
              <SelectTrigger className={`h-8 text-sm w-auto ${problemTypeFilter ? 'border-primary bg-primary/5 text-primary font-medium' : ''}`}>
                <SelectValue placeholder="Tipo de Problema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL_VALUE}>Tipo de Problema</SelectItem>
                {problemTypes.map((pt) => (
                  <SelectItem key={pt.field_name} value={pt.field_name}>
                    {PROBLEM_TYPE_LABELS[pt.field_name] || pt.field_name} ({pt.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* Date filter — always visible */}
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <DatePicker
            value={startDate ? new Date(startDate + 'T00:00:00') : null}
            onValueChange={(d) => setStartDate(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '')}
            placeholder="Data início"
            className="w-auto px-2 py-1.5 text-sm h-auto"
          />
          <span className="text-muted-foreground text-xs">a</span>
          <DatePicker
            value={endDate ? new Date(endDate + 'T00:00:00') : null}
            onValueChange={(d) => setEndDate(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '')}
            placeholder="Data fim"
            className="w-auto px-2 py-1.5 text-sm h-auto"
          />
          {(startDate || endDate) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton aria-label="Limpar datas" variant="ghost" size="sm"
                  onClick={() => { setStartDate(''); setEndDate('') }}>
                  <X className="w-3.5 h-3.5" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>Limpar datas</TooltipContent>
            </Tooltip>
          )}
          {/* Spacer */}
          <div className="flex-1" />
          {/* Status feedback messages */}
          <div className="flex items-center gap-2 shrink-0">
            {batchRunning && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {selectedIds.size}...
              </span>
            )}
            {batchResult?.success && !batchRunning && (
              <span className="text-xs text-success-text">{batchResult.count} escrituradas</span>
            )}
            {batchResult && !batchResult.success && !batchRunning && (
              <span className="text-xs text-destructive-text truncate max-w-36" title={batchResult.error}>Erro</span>
            )}
            {reprocessProgress && (
              <span className="flex items-center gap-2 text-xs text-primary font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Motor rodando...
              </span>
            )}
            {approveResult?.success && (
              <span className="text-xs text-success-text flex items-center gap-1">
                <Check className="w-3 h-3" />{approveResult.count}
              </span>
            )}
            {pdfProgress && (
              <span className="text-xs text-muted-foreground">{pdfProgress.current}/{pdfProgress.total}</span>
            )}
          </div>
          {/* Action buttons — icon-only, expand on hover */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              onClick={handleBatchEscrituracao}
              disabled={batchRunning || selectedIds.size === 0 || allSelectedEscrituradas}
              title={allSelectedEscrituradas ? 'Todas já escrituradas' : `Escriturar${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
              variant="success"
              size="sm"
              className="group gap-0 hover:gap-1.5"
            >
              <Zap className={`w-4 h-4 shrink-0 ${batchRunning ? 'animate-pulse' : ''}`} />
              <span className={EXPAND_LABEL_CLS}>
                {selectedIds.size > 0 ? `Escriturar (${selectedIds.size})` : 'Escriturar'}
              </span>
            </Button>
            {selectedIds.size > 0 && (
              <Button
                onClick={handleBatchApprove}
                disabled={approveRunning || batchRunning}
                title={`Aprovar (${selectedIds.size})`}
                variant="info"
                size="sm"
                className="group gap-0 hover:gap-1.5"
              >
                {approveRunning ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <CheckCheck className="w-4 h-4 shrink-0" />}
                <span className={EXPAND_LABEL_CLS}>
                  Aprovar ({selectedIds.size})
                </span>
              </Button>
            )}
            <Select value={exportTipo || SELECT_ALL_VALUE} onValueChange={(v) => setExportTipo(v === SELECT_ALL_VALUE ? '' : v)}>
              <SelectTrigger className="h-8 text-sm w-auto" title="Segregação da extração (Emitidas x Recebidas) — período vem dos filtros de data acima">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL_VALUE}>Todos os tipos</SelectItem>
                {/* Valor da API continua 'entrada'/'saida' — só o rótulo virou
                    Emitidas/Recebidas pra bater com a nomenclatura da segregação
                    (pedido da Eliz: extração separada por Emitidas x Recebidas). */}
                <SelectItem value="entrada">Recebidas</SelectItem>
                <SelectItem value="saida">Emitidas</SelectItem>
                <SelectItem value="servico">Serviços</SelectItem>
                <SelectItem value="cte">CT-e</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExportExcel}
              title={`Exportar Excel${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
              variant="outline"
              size="sm"
              className="group gap-0 hover:gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span className={EXPAND_LABEL_CLS}>
                Excel{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </span>
            </Button>
            <Button
              onClick={handleBulkPdfDownload}
              disabled={pdfProgress !== null}
              title={`Download PDFs${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
              variant="outline"
              size="sm"
              className="group gap-0 hover:gap-1.5"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className={EXPAND_LABEL_CLS}>
                PDFs{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </span>
            </Button>
            {statusAnaliseFilter === 'ESCRITURADA' && selectedIds.size > 0 && (
              <Button
                onClick={handleBatchUndo}
                disabled={undoMutation.isPending}
                title={`Desfazer (${selectedIds.size})`}
                variant="destructive"
                size="sm"
                className="group gap-0 hover:gap-1.5"
              >
                <Undo2 className={`w-4 h-4 shrink-0 ${undoMutation.isPending ? 'animate-spin' : ''}`} />
                <span className={EXPAND_LABEL_CLS}>
                  Desfazer ({selectedIds.size})
                </span>
              </Button>
            )}
            <Button
              onClick={() => setShowReprocessModal(true)}
              disabled={!!reprocessProgress}
              title="Reprocessar Motor"
              size="sm"
              className="group gap-0 hover:gap-1.5"
            >
              <Play className={`w-4 h-4 shrink-0 ${reprocessProgress ? 'animate-pulse' : ''}`} />
              <span className={EXPAND_LABEL_CLS}>
                Reprocessar
              </span>
            </Button>
            <Button
              onClick={() => setIsConfigOpen(true)}
              title="Configurar Colunas"
              variant="outline"
              size="sm"
              className="group gap-0 hover:gap-1.5"
            >
              <Columns className="w-4 h-4 shrink-0" />
              <span className={EXPAND_LABEL_CLS}>
                Colunas
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Active filter badges */}
      {activeFilters.length > 0 && (
        <div className="px-6 py-1.5 border-b border-warning-border bg-warning-subtle flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-warning-text shrink-0" />
          <span className="text-xs text-warning-text font-medium shrink-0">{activeFilters.length} filtro(s):</span>
          {activeFilters.map(f => (
            <span key={f.key} className="inline-flex items-center gap-1 px-2 py-0.5 bg-card border border-warning-border rounded-full text-xs text-warning-text">
              {f.label}
              <button onClick={f.clear} className="hover:text-destructive-text transition-colors"><X className="w-3 h-3" /></button>
            </span>
          ))}
          <button
            onClick={() => {
              setSelectedCompanyIds([]); setStartDate(''); setEndDate('')
              setSearch(''); setDebouncedSearch(''); setCnpjEmitFilter(''); setDebouncedCnpjEmit('')
              setCnpjDestFilter(''); setDebouncedCnpjDest(''); setProblemTypeFilter(''); setStatusAnaliseFilter('')
            }}
            className="text-xs text-warning-text hover:opacity-80 underline ml-1"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Quick status filter bar */}
      <div className="px-6 py-2.5 border-b border-border flex items-center gap-1.5">
  {[
    { key: '', label: 'Todos', color: statusAnaliseFilter === '' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80', count: Object.entries(statusCounts).filter(([k]) => k !== 'DISPENSADO').reduce((a, [, b]) => a + b, 0) },
    { key: 'PENDENTE', label: 'Pendentes', color: statusAnaliseFilter === 'PENDENTE' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80', count: statusCounts.PENDENTE || 0 },
    { key: 'REQUER_REVISAO', label: 'Requer Revisão', color: statusAnaliseFilter === 'REQUER_REVISAO' ? 'bg-warning text-warning-foreground' : 'bg-warning-subtle text-warning-text hover:bg-warning-subtle/80', count: statusCounts.REQUER_REVISAO || 0 },
    { key: 'CONFORME', label: 'Conformes', color: statusAnaliseFilter === 'CONFORME' ? 'bg-success text-success-foreground' : 'bg-success-subtle text-success-text hover:bg-success-subtle/80', count: statusCounts.CONFORME || 0 },
    { key: 'BLOQUEADO', label: 'Bloqueados', color: statusAnaliseFilter === 'BLOQUEADO' ? 'bg-destructive text-destructive-foreground' : 'bg-destructive-subtle text-destructive-text hover:bg-destructive-subtle/80', count: statusCounts.BLOQUEADO || 0 },
  ].map(({ key, label, color, count }) => (
    <button
      key={key}
      onClick={() => setStatusAnaliseFilter(prev => prev === key ? '' : key)}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${color}`}
    >
      <span className="font-semibold">{count}</span>
      {label}
    </button>
  ))}
  {statusAnaliseFilter === '' && totalFromServer > 0 && totalFromServer !== Object.entries(statusCounts).filter(([k]) => k !== 'DISPENSADO').reduce((a, [, b]) => a + b, 0) && (
    <span className="text-xs text-neutral-400 ml-2">
      ({totalFromServer} com filtros atuais)
    </span>
  )}
</div>

      {/* Table */}
      <div className="flex-1 overflow-auto relative z-0 px-6 pt-4 pb-6">
        {!currentType ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground m-4">
            Nenhum dado disponível para esta aba
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground m-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
            Carregando notas...
          </div>
        ) : allInvoices.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground m-4">
            Nenhuma nota encontrada
          </div>
        ) : (
          <Table className="min-w-full divide-y divide-border text-sm">
              <TableHeader className="bg-muted">
                {/* Main Headers */}
                <TableRow>
                  <TableHead className="px-4 py-3 h-auto text-left w-32 sticky left-0 top-0 bg-muted border-r border-border z-30 shadow-md">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allVisibleSelected ? true : (someVisibleSelected ? 'indeterminate' : false)}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="font-semibold text-foreground">Ações</span>
                    </div>
                  </TableHead>
                  {visibleColumns.map((col) => (
                    <TableHead key={col.id} className="px-4 py-3 h-auto text-left font-semibold text-foreground whitespace-nowrap min-w-36 sticky top-0 bg-muted z-20">
                      <div className="flex justify-between items-center gap-2">
                        {col.label}
                        <MoreVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
                {/* Filter Row — top-[45px] intentionally kept: pixel offset matching the
                    header row's own rendered height for sticky positioning, not a
                    spacing/typography token. */}
                <TableRow className="bg-muted border-t border-border">
                  <TableHead className="px-4 py-2 h-auto sticky left-0 top-[45px] bg-muted border-r border-border z-30 shadow-md" />
                  {visibleColumns.map((col) => (
                    <TableHead key={`filter-${col.id}`} className="px-4 py-2 h-auto border-r border-border sticky top-[45px] bg-muted z-20 min-w-36">
                      {nonFilterableColumns.has(col.id) ? null : col.id === 'statusAnalise' ? (
                        <Select
                          value={statusAnaliseFilter || SELECT_ALL_VALUE}
                          onValueChange={(v) => setStatusAnaliseFilter(v === SELECT_ALL_VALUE ? '' : v)}
                        >
                          <SelectTrigger className="w-full h-auto py-1 text-xs bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableStatusAnaliseOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value || SELECT_ALL_VALUE}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : selectFilterColumns.has(col.id) ? (
                        <Select
                          value={columnFilters[col.id] || SELECT_ALL_VALUE}
                          onValueChange={(v) => setColumnFilters((prev) => ({ ...prev, [col.id]: v === SELECT_ALL_VALUE ? '' : v }))}
                        >
                          <SelectTrigger className="w-full h-auto py-1 text-xs bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(col.id === 'escrituracaoStatus' ? ESCRITURACAO_STATUS_OPTIONS : col.id === 'integracaoApi' ? INTEGRACAO_API_OPTIONS : availableStatusOptions).map((opt) => (
                              <SelectItem key={opt.value} value={opt.value || SELECT_ALL_VALUE}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : dateColumnIds.has(col.id) ? (
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="dd/mm/aaaa"
                            value={columnFilters[col.id] || ''}
                            onChange={(e) => setColumnFilters((prev) => ({ ...prev, [col.id]: e.target.value }))}
                            className="w-full border border-input rounded pl-6 pr-8 py-1 text-xs"
                          />
                          <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={columnFilters[col.id] || ''}
                            onChange={(e) => setColumnFilters((prev) => ({ ...prev, [col.id]: e.target.value }))}
                            className="w-full border border-input rounded px-2 py-1 text-xs pr-6"
                          />
                          <Filter className="absolute right-6 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground cursor-pointer" />
                        </>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-card divide-y divide-border">
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} className="px-4 py-12 h-auto text-center text-muted-foreground text-sm">
                      Nenhuma nota encontrada com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : invoices.map((inv, idx) => (
                  <TableRow
                    key={inv.key || inv.id || idx}
                    className="hover:bg-muted cursor-pointer group"
                    onClick={() => onRowClick(inv)}
                  >
                    <TableCell className="px-4 py-2 h-auto whitespace-nowrap sticky left-0 bg-card group-hover:bg-muted border-r border-border z-10 shadow-md">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedIds.has(inv.id)}
                          onCheckedChange={() => toggleRowSelection(inv.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label="Resumo"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setSheetInvoice(inv) }}
                            >
                              <Eye className="w-4 h-4 text-info-text" />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Resumo</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label="Ver detalhes"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); onRowClick(inv) }}
                            >
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalhes</TooltipContent>
                        </Tooltip>
                        </div>
                      </div>
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={`${inv.key || idx}-${col.id}`} className="px-4 py-2 h-auto whitespace-nowrap text-foreground/80 truncate max-w-3xs">
                        {col.id === 'feedback' ? (
                          <FeedbackCell
                            invoiceId={inv.id}
                            isNfse={currentCodMod === 'NFSE'}
                            feedbackMap={feedbackMap}
                            onVote={handleFeedbackVote}
                            locked={!!inv.integrado_api_em}
                          />
                        ) : getCellValue(inv, col.id)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
      />

      {/* Invoice Sheet (side panel) */}
      <InvoiceSheet
        invoice={sheetInvoice}
        isOpen={isSheetOpen}
        onClose={() => setSheetInvoice(null)}
        onViewDetails={(inv) => { setSheetInvoice(null); onRowClick(inv) }}
      />

      {/* Reprocess Modal (confirm → processing → results) */}
      <ReprocessingModal
        isOpen={showReprocessModal || !!reprocessProgress}
        onClose={() => {
          setShowReprocessModal(false)
          setReprocessProgress(null)
          refetch()
        }}
        onConfirm={handleReprocessConfirmed}
        progress={reprocessProgress}
        companies={
          selectedCompanyIds.length > 0
            ? `${selectedCompanyIds.length} empresa(s) selecionada(s)`
            : 'Todas as empresas'
        }
        startDate={startDate}
        endDate={endDate}
      />

      {/* Export XLSX (async S3) — modal de progresso */}
      <ExportProgressModal
        job={exportJob}
        onClose={() => {
          try { localStorage.removeItem('bhules_export_job_id') } catch { /* ignore */ }
          setExportJob(null)
        }}
      />

      {/* Column Config Drawer */}
      <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <SheetContent side="right" className="sm:max-w-md p-0 gap-0 flex flex-col" showCloseButton={false}>
          {/* Header */}
          <SheetHeader className="flex-row items-center justify-between border-b border-border space-y-0 px-6 py-5">
            <SheetTitle className="text-xl">Configurar colunas</SheetTitle>
            <IconButton aria-label="Fechar" variant="ghost" size="sm" onClick={() => setIsConfigOpen(false)}>
              <X className="w-5 h-5" />
            </IconButton>
          </SheetHeader>

          {/* Pivot Toggle */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Switch checked={pivotMode} onCheckedChange={setPivotMode} />
            <span className="font-semibold text-foreground/90 text-base">Modo Pivot</span>
          </div>

          {/* Config Tabs */}
          <div className="px-6 py-4 border-b border-border">
            <Tabs value={configTab} onValueChange={setConfigTab}>
              <TabsList variant="default" className="w-full">
                {['Colunas', 'Grupos', 'Valores', 'Pivot'].map((t) => (
                  <TabsTrigger key={t} value={t} className="flex-1">{t}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Tab: Colunas */}
          {configTab === 'Colunas' && (
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {columns.map((col) => (
                <div key={col.id} className="flex items-center gap-4 px-3 py-2.5 hover:bg-muted rounded-lg group transition-colors">
                  <GripVertical className="w-5 h-5 text-neutral-300 group-hover:text-neutral-400 cursor-grab active:cursor-grabbing" />
                  <Checkbox checked={col.visible} onCheckedChange={() => toggleColumn(col.id)} />
                  <span
                    className="text-base text-foreground/80 cursor-pointer select-none font-medium"
                    onClick={() => toggleColumn(col.id)}
                  >
                    {col.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Valores */}
          {configTab === 'Valores' && (
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <h4 className="text-xs font-semibold text-muted-foreground tracking-widest mb-3 uppercase">Agregar Valores</h4>
              <div className="border border-dashed border-input rounded-lg p-5 bg-card mb-8 flex items-center justify-center min-h-20">
                <p className="text-base text-muted-foreground font-medium">Adicione colunas para agregar</p>
              </div>
              <h4 className="text-xs font-semibold text-muted-foreground tracking-widest mb-3 uppercase">Colunas Disponíveis</h4>
              <div className="flex flex-wrap gap-2.5">
                {columns.map((col) => (
                  <Button
                    key={col.id}
                    variant="outline"
                    size="sm"
                  >
                    <span className="text-muted-foreground text-lg leading-none mb-0.5">+</span> {col.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Grupos */}
          {configTab === 'Grupos' && (
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <h4 className="text-xs font-semibold text-muted-foreground tracking-widest mb-3 uppercase">Agrupar por</h4>
              <div className="border border-dashed border-input rounded-lg p-5 bg-card mb-8 flex items-center justify-center min-h-20">
                <p className="text-base text-muted-foreground font-medium">Arraste colunas aqui para agrupar</p>
              </div>
            </div>
          )}

          {/* Tab: Pivot */}
          {configTab === 'Pivot' && (
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <h4 className="text-xs font-semibold text-muted-foreground tracking-widest mb-3 uppercase">Configuração Pivot</h4>
              <div className="border border-dashed border-input rounded-lg p-5 bg-card flex items-center justify-center min-h-20">
                <p className="text-base text-muted-foreground font-medium">Ative o Modo Pivot para configurar</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
