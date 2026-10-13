import { useState, useEffect, useMemo, Fragment } from 'react'
import { Search, Filter, X, Calendar, Layers, ChevronRight, ChevronDown, AlertTriangle, Download } from 'lucide-react'
import {
  Badge, Button, Checkbox, Input, Tooltip, TooltipTrigger, TooltipContent, DatePicker,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Popover, PopoverTrigger, PopoverContent,
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@bhubai/bhub-design-system'
import { useIntegratedInvoices, useNfsePrestadosGrupos } from '../../hooks/useInvoices'
import { useCompanies } from '../../hooks/useCompanies'
import { filtrarEmpresas } from '../../utils/matchEmpresa'
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

// --- Agrupamento por código de serviço (só na aba de NFS-e prestados) ---
//
// A chave vem DERIVADA do backend: "17.06" e "1706" são o mesmo serviço e caem
// no mesmo grupo, sem que nenhuma nota tenha sido reescrita. O `valor_cru` de
// cada formato fica em `formatos_origem`, que é o que permite mostrar de onde
// vem a divergência.

const SINAL_INFO = {
  FORMATO_MISTO: {
    label: 'Formato misto',
    className: 'bg-warning-subtle text-warning-text border-warning-border',
    title: 'O mesmo serviço chega em mais de um formato conforme a origem da captura. Sem o agrupamento, apareceria como dois problemas separados.',
  },
  NAO_LC116: {
    label: 'Código municipal',
    className: 'bg-magic-subtle text-magic-bold border-magic-bold/30',
    title: 'O código gravado não é um subitem da LC 116 — provavelmente é código do município. Não é convertido para subitem, de propósito.',
  },
  SEM_REGRA_ANEXO: {
    label: 'Sem regra de anexo',
    className: 'bg-destructive-subtle text-destructive-text border-destructive-border',
    title: 'Não há regra cadastrada ligando este subitem ao Anexo do Simples. A classificação cai na regra geral por CNAE.',
  },
  SEM_CODIGO: {
    label: 'Sem código',
    className: 'bg-muted text-muted-foreground border-border',
    title: 'Notas sem código de serviço. É o maior grupo do acervo.',
  },
}

function SinalBadge({ sinal }) {
  const info = SINAL_INFO[sinal]
  if (!info) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`gap-1 cursor-default ${info.className}`}>
          <AlertTriangle className="w-3 h-3" />
          {info.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{info.title}</TooltipContent>
    </Tooltip>
  )
}

function gruposParaCsv(grupos) {
  const cab = ['codigo', 'tipo', 'descricao', 'notas', 'valor_total', 'empresas', 'formatos_origem', 'sinais']
  const linhas = grupos.map((g) => [
    g.chave,
    g.tipo,
    (g.rotulo || '').replace(/"/g, '""'),
    g.notas,
    g.valor_total ?? '',
    g.empresas,
    (g.formatos_origem || []).map((f) => `${f.valor_cru}:${f.notas}`).join(' | '),
    (g.sinais || []).join(' | '),
  ])
  return [cab, ...linhas]
    .map((l) => l.map((c) => (typeof c === 'string' && /[",;\n]/.test(c) ? `"${c}"` : c)).join(';'))
    .join('\n')
}

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
  const [companySearch, setCompanySearch] = useState('')

  // Date range
  const defaults = getDefaultDateRange()
  const [startDate, setStartDate] = useState(defaults.startDate)
  const [endDate, setEndDate] = useState(defaults.endDate)

  // Agrupamento: só faz sentido em NFS-e prestados (o código de serviço é
  // atributo de NFS-e, e a dor medida está na saída).
  const [agrupado, setAgrupado] = useState(false)
  const [grupoAberto, setGrupoAberto] = useState(null)

  const tab = TABS.find((t) => t.id === activeTab) || TABS[0]
  const podeAgrupar = tab.id === 'nfse_saida'

  const sortedCompanies = useMemo(
    () => [...companies].sort((a, b) => (a.razao_social || '').localeCompare(b.razao_social || '', 'pt-BR')),
    [companies],
  )
  // Busca do dropdown: razão social, nome fantasia ou CNPJ com/sem máscara (GL-C4).
  const visibleCompanies = useMemo(
    () => filtrarEmpresas(sortedCompanies, companySearch),
    [sortedCompanies, companySearch],
  )

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [activeTab, selectedCompanyIds, debouncedSearch, startDate, endDate])

  // Trocar de aba sai do modo agrupado: o agrupamento é só de NFS-e prestados.
  useEffect(() => { if (!podeAgrupar) { setAgrupado(false); setGrupoAberto(null) } }, [podeAgrupar])
  useEffect(() => { setGrupoAberto(null) }, [selectedCompanyIds, startDate, endDate])

  // Limpa a busca do dropdown de empresas ao fechar o popover.
  useEffect(() => { if (!companyDropdownOpen) setCompanySearch('') }, [companyDropdownOpen])

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

  const { data: dadosGrupos, isLoading: carregandoGrupos } = useNfsePrestadosGrupos({
    companyIds: selectedCompanyIds.length > 0 ? selectedCompanyIds : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: 1,
    size: 200,
    enabled: agrupado && podeAgrupar,
  })

  const grupos = dadosGrupos?.grupos || []
  const resumoGrupos = dadosGrupos?.resumo

  const invoices = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.total_pages || 1

  function baixarCsv() {
    const blob = new Blob(['\uFEFF' + gruposParaCsv(grupos)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nfse-prestados-por-codigo-servico_${startDate}_a_${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
              {/* Filtro feito por filtrarEmpresas (razão social, nome fantasia
                  ou CNPJ com/sem máscara — GL-C4), não pelo cmdk. */}
              <Command shouldFilter={false}>
                <CommandInput
                  value={companySearch}
                  onValueChange={setCompanySearch}
                  placeholder="Buscar por nome ou CNPJ..."
                />
                <CommandList className="max-h-72">
                  <CommandEmpty>
                    {sortedCompanies.length === 0 ? 'Carregando...' : 'Nenhuma empresa encontrada'}
                  </CommandEmpty>
                  <CommandGroup>
                    {visibleCompanies.map((c) => (
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

          {podeAgrupar && (
            <div className="ml-auto flex items-center gap-2">
              {agrupado && grupos.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={baixarCsv}>
                      <Download className="w-4 h-4" />
                      Exportar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Baixar o agrupamento em CSV (abre no Excel)</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-pressed={agrupado}
                    onClick={() => { setAgrupado((v) => !v); setGrupoAberto(null) }}
                    className={agrupado ? 'border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary' : ''}
                  >
                    <Layers className="w-4 h-4" />
                    Agrupar por código de serviço
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Agrupa as notas pelo código de serviço, unindo os formatos que a captura entrega diferente (17.06 e 1706 são o mesmo serviço).
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {agrupado && resumoGrupos && (
          <div className="mt-2.5 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">{resumoGrupos.grupos_lc116 + resumoGrupos.grupos_municipais}</strong> grupos
            </span>
            <span><strong className="text-foreground">{resumoGrupos.notas?.toLocaleString('pt-BR')}</strong> notas</span>
            <span><strong className="text-foreground">{formatCurrency(resumoGrupos.valor_total)}</strong></span>
            {resumoGrupos.grupos_formato_misto > 0 && (
              <span className="text-warning-text">
                <strong>{resumoGrupos.grupos_formato_misto}</strong> com formato misto — apareceriam como{' '}
                {resumoGrupos.grupos_formato_misto * 2} grupos sem o agrupamento
              </span>
            )}
          </div>
        )}
      </div>

      {/* Vista agrupada por código de serviço */}
      {agrupado && podeAgrupar ? (
        <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
          <Table className="text-sm">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead className="px-4 py-2.5 h-auto text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8"></TableHead>
                <TableHead className="px-4 py-2.5 h-auto text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left whitespace-nowrap">Código</TableHead>
                <TableHead className="px-4 py-2.5 h-auto text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left">Serviço</TableHead>
                <TableHead className="px-4 py-2.5 h-auto text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right whitespace-nowrap">Notas</TableHead>
                <TableHead className="px-4 py-2.5 h-auto text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right whitespace-nowrap">Valor</TableHead>
                <TableHead className="px-4 py-2.5 h-auto text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right whitespace-nowrap">Clientes</TableHead>
                <TableHead className="px-4 py-2.5 h-auto text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left whitespace-nowrap">Atenção</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {carregandoGrupos ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Agrupando...</TableCell>
                </TableRow>
              ) : grupos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Nenhuma nota de serviço prestado nos filtros atuais.</TableCell>
                </TableRow>
              ) : (
                grupos.map((g) => {
                  const aberto = grupoAberto === g.chave
                  return (
                    <Fragment key={g.chave}>
                      <TableRow
                        className="hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => setGrupoAberto(aberto ? null : g.chave)}
                      >
                        <TableCell className="px-4 py-2.5 text-muted-foreground">
                          {aberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 whitespace-nowrap">
                          <span className="font-medium text-foreground">
                            {g.tipo === 'MUNICIPAL' ? g.chave.replace('MUNICIPAL:', '') : g.chave === 'SEM_CODIGO' ? '—' : g.chave}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-muted-foreground whitespace-normal">
                          {g.rotulo || (g.chave === 'SEM_CODIGO'
                            ? 'Notas sem código de serviço'
                            : g.tipo === 'MUNICIPAL' ? 'Código do município (não é da LC 116)' : '—')}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-right text-foreground whitespace-nowrap">{g.notas.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="px-4 py-2.5 text-right text-foreground whitespace-nowrap">{formatCurrency(g.valor_total)}</TableCell>
                        <TableCell className="px-4 py-2.5 text-right text-muted-foreground whitespace-nowrap">{g.empresas}</TableCell>
                        <TableCell className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {(g.sinais || []).map((sn) => <SinalBadge key={sn} sinal={sn} />)}
                          </div>
                        </TableCell>
                      </TableRow>
                      {aberto && (
                        <TableRow className="bg-muted/70 hover:bg-muted/70">
                          <TableCell colSpan={7} className="px-12 py-3 whitespace-normal">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              Como este código chega na captura
                            </div>
                            <table className="text-sm">
                              <tbody className="divide-y divide-border">
                                {(g.formatos_origem || []).map((f) => (
                                  <tr key={f.valor_cru ?? 'nulo'}>
                                    <td className="py-1.5 pr-8 font-mono text-foreground">{f.valor_cru ?? '(vazio)'}</td>
                                    <td className="py-1.5 pr-8 text-muted-foreground">{f.notas.toLocaleString('pt-BR')} notas</td>
                                    <td className="py-1.5 text-muted-foreground">{(f.api_sources || []).map(formatOrigem).join(', ')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {(g.formatos_origem || []).length > 1 && (
                              <p className="mt-2 text-xs text-warning-text">
                                Estes formatos são o <strong>mesmo serviço</strong>. Sem o agrupamento apareceriam
                                como grupos separados, e tratar um deixaria o outro para trás. Nenhuma nota foi
                                alterada — o valor original de cada uma está preservado.
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
      <>
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

      </>
      )}

      {/* Paginação — só na lista plana; no agrupado a contagem está no resumo */}
      {!(agrupado && podeAgrupar) && (
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
      )}
    </div>
  )
}
