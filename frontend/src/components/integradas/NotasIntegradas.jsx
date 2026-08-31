import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, X, Calendar } from 'lucide-react'
import {
  Checkbox, Input, Tooltip, TooltipTrigger, TooltipContent, DatePicker,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Popover, PopoverTrigger, PopoverContent,
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@bhubai/bhub-design-system'
import { useIntegratedInvoices } from '../../hooks/useInvoices'
import { useCompanies } from '../../hooks/useCompanies'
import StatusBadge from '../shared/StatusBadge'
import Pagination from '../shared/Pagination'
import { INTEGRADAS_TABS as TABS } from '../../constants/integradasTabs'

// --- Formatters (espelham ListView) ---
function formatCurrency(val) {
  if (val == null) return '-'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(val) {
  if (!val) return '-'
  // Data-only (YYYY-MM-DD) parseada como LOCAL, não UTC (vide ListView).
  const d = new Date(typeof val === 'string' && !val.includes('T') ? `${val}T00:00:00` : val)
  return d.toLocaleDateString('pt-BR')
}

function formatCnpj(val) {
  if (!val) return '-'
  const digits = val.replace(/\D/g, '')
  if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }
  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  }
  return val
}

// Competência = mês/ano de emissão (dt_doc)
function formatCompetencia(val) {
  if (!val) return '-'
  const d = new Date(typeof val === 'string' && !val.includes('T') ? `${val}T00:00:00` : val)
  return d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
}

function getDefaultDateRange() {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10)
  return { startDate: start, endDate: end }
}

// Status de envio ao Onvio/Domínio — badge a partir de envio_dominio_status,
// com integrado_api_em como fallback (presença = enviado).
function envioStatusFor(inv) {
  if (inv.envio_dominio_status === 'ENVIADO') return 'ENVIADO'
  if (inv.envio_dominio_status === 'ERRO') return 'ERRO'
  if (inv.envio_dominio_status) return inv.envio_dominio_status
  if (inv.integrado_api_em) return 'ENVIADO'
  return null
}

// Origem da captura (api_source) — rótulo legível por canal.
const ORIGEM_LABELS = {
  INTEGRADOR_NF: 'IntegradorNF',
  JETTAX: 'Jettax',
  UNECONT: 'Unecont',
  SIEG: 'Sieg',
  SPED: 'SPED',
  MANUAL: 'Manual',
}
function formatOrigem(val) {
  if (!val) return '-'
  return ORIGEM_LABELS[val] || val
}

// Data/hora de integração (integrado_api_em) — quando entrou no BHules.
function formatDateTime(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const COLUMNS = [
  { id: 'number',     label: 'NF' },
  { id: 'emit',       label: 'CNPJ Emitente' },
  { id: 'dest',       label: 'CNPJ Destinatário' },
  { id: 'amount',     label: 'Valor' },
  { id: 'issueDate',  label: 'Data Emissão' },
  { id: 'competence', label: 'Competência' },
  { id: 'origem',     label: 'Origem' },
  { id: 'envio',      label: 'Status Envio Onvio' },
]

export default function NotasIntegradas({ activeTab: activeTabProp, onTabChange }) {
  const { data: companies = [] } = useCompanies()
  const [activeTabLocal, setActiveTabLocal] = useState('nfse_saida')
  const activeTab = activeTabProp ?? activeTabLocal
  const setActiveTab = (tab) => { setActiveTabLocal(tab); onTabChange?.(tab) }
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Company multi-select filter (mesmo padrão do ListView)
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([])
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false)

  // Date range
  const defaults = getDefaultDateRange()
  const [startDate, setStartDate] = useState(defaults.startDate)
  const [endDate, setEndDate] = useState(defaults.endDate)

  const tab = TABS.find((t) => t.id === activeTab) || TABS[0]

  const sortedCompanies = useMemo(
    () => [...companies].sort((a, b) => (a.razao_social || '').localeCompare(b.razao_social || '', 'pt-BR')),
    [companies],
  )

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [activeTab, selectedCompanyIds, debouncedSearch, startDate, endDate])

  const { data, isLoading } = useIntegratedInvoices({
    companyIds: selectedCompanyIds.length > 0 ? selectedCompanyIds : undefined,
    page,
    size: pageSize,
    search: debouncedSearch || undefined,
    codMod: tab.codMod,
    indEmit: tab.indEmit || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const invoices = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.total_pages || 1

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

  function renderCell(inv, colId) {
    switch (colId) {
      case 'number':
        return <span className="font-medium text-foreground">{inv.num_doc || inv.chave_nfe || '-'}</span>
      case 'emit':
        return formatCnpj(inv.emit_cnpj)
      case 'dest':
        return formatCnpj(inv.dest_cnpj)
      case 'amount':
        return formatCurrency(inv.vl_doc)
      case 'issueDate':
        return formatDate(inv.dt_doc)
      case 'competence':
        return formatCompetencia(inv.dt_doc)
      case 'origem':
        return <span className="text-muted-foreground">{formatOrigem(inv.api_source)}</span>
      case 'envio': {
        const st = envioStatusFor(inv)
        if (!st) return <span className="text-muted-foreground">— Pendente</span>
        return (
          <span className="inline-flex items-center gap-2">
            <StatusBadge status={st} />
            {inv.integrado_api_em && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground cursor-default">
                    {formatDateTime(inv.integrado_api_em)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Integrado em</TooltipContent>
              </Tooltip>
            )}
          </span>
        )
      }
      default:
        return '-'
    }
  }

  return (
    <div className="flex flex-col h-full bg-card relative overflow-hidden">
      {/* Título — a navegação entre tipos agora vive na sidebar (Notas Integradas) */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-2">
        <tab.icon className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Notas Integradas — {tab.label}</h1>
      </div>

      {/* Toolbar — filtros (read-only, sem ações) */}
      <div className="px-6 py-3 border-b border-border bg-muted">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
            <Input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Company multi-select filter */}
          <Popover open={companyDropdownOpen} onOpenChange={setCompanyDropdownOpen}>
            <PopoverTrigger asChild>
              <button
                className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors min-w-40 ${
                  selectedCompanyIds.length > 0
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-input text-muted-foreground hover:bg-accent'
                }`}
              >
                <Filter className="w-4 h-4 shrink-0" />
                <span className="truncate">{companyFilterLabel}</span>
                {selectedCompanyIds.length > 0 && (
                  <X
                    className="w-3.5 h-3.5 ml-auto shrink-0 hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setSelectedCompanyIds([]) }}
                  />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar empresa..." />
                <CommandList className="max-h-72">
                  <CommandEmpty>
                    {sortedCompanies.length === 0 ? 'Carregando...' : 'Nenhuma empresa encontrada'}
                  </CommandEmpty>
                  <CommandGroup>
                    {sortedCompanies.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.razao_social}
                        onSelect={() => toggleCompany(c.id)}
                        className="gap-3"
                      >
                        <Checkbox checked={selectedCompanyIds.includes(c.id)} />
                        <span className="truncate text-foreground">{c.razao_social}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Date filter */}
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <DatePicker
            value={startDate ? new Date(startDate + 'T00:00:00') : null}
            onValueChange={(d) => setStartDate(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '')}
            placeholder="Data início"
            className="h-8 w-36 text-sm"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <DatePicker
            value={endDate ? new Date(endDate + 'T00:00:00') : null}
            onValueChange={(d) => setEndDate(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '')}
            placeholder="Data fim"
            className="h-8 w-36 text-sm"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
        <Table className="text-sm">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.id}
                  className="px-4 py-2.5 h-auto text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="px-4 py-12 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhuma nota encontrada para os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-accent transition-colors">
                  {COLUMNS.map((col) => (
                    <TableCell key={col.id} className="px-4 py-2.5 text-foreground whitespace-nowrap">
                      {renderCell(inv, col.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
