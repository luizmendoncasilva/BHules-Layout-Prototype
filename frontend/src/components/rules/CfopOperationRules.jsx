import { useState, useEffect, useRef } from 'react'
import {
  Settings2,
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  Loader2,
  Zap,
  Clock,
  ChevronDown,
} from 'lucide-react'
import {
  Button, IconButton, Tooltip, TooltipTrigger, TooltipContent,
  Badge, Checkbox, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Sheet, SheetContent, SheetHeader, SheetTitle,
  RadioGroup, RadioGroupItem,
} from '@bhubai/bhub-design-system'
import { useCfopRules, useCreateCfopRule, useUpdateCfopRule, useDeleteCfopRule } from '../../hooks/useCfopRules'
import { useCompanies } from '../../hooks/useCompanies'
import Pagination from '../shared/Pagination'
import { useToast } from '../shared/Toast'

// Labels for display (escopo/processamento are DB enums, categories come from seed data)
const ESCOPO_LABELS = { INTERNA: 'Interna', INTERESTADUAL: 'Interestadual', INTERNACIONAL: 'Internacional' }
const PROC_LABELS = { AUTOMATICO: 'Automatico', MANUAL: 'Manual' }

function SearchableSelect({ options, value, onChange, placeholder, allLabel }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLabel = value
    ? (options.find(o => o.value === value)?.label || value)
    : (allLabel || placeholder || 'Selecione...')

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch('') }}
        className="text-sm border border-input rounded-lg px-3 py-2 focus:ring-1 focus:ring-ring focus:border-primary flex items-center gap-1.5 min-w-36 text-left bg-card"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{selectedLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-45 bg-popover border border-border rounded-lg shadow-lg max-h-56 overflow-hidden">
          {options.length > 4 && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder={placeholder || 'Buscar...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7 h-8 text-xs"
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto max-h-44">
            {allLabel && (
              <button
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${!value ? 'text-primary font-medium bg-accent/50' : 'text-muted-foreground'}`}
                onClick={() => { onChange(''); setOpen(false) }}
              >
                {allLabel}
              </button>
            )}
            {filtered.map(o => (
              <button
                key={o.value}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${value === o.value ? 'text-primary font-medium bg-accent/50' : 'text-foreground'}`}
                onClick={() => { onChange(o.value); setOpen(false) }}
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum resultado</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ProcessamentoBadge({ value }) {
  const isAuto = value === 'AUTOMATICO'
  return (
    <Badge variant={isAuto ? 'success' : 'warning'}>
      {isAuto ? <Zap className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {isAuto ? 'Automatico' : 'Manual'}
    </Badge>
  )
}

function EscopoBadge({ value }) {
  const colors = {
    INTERNA: null, // uses variant="info"
    INTERESTADUAL: 'bg-magic-subtle text-magic-bold ring-1 ring-magic-bold/30',
    INTERNACIONAL: 'bg-mizu-flow-subtle text-mizu-flow-bold ring-1 ring-mizu-flow-bold/30',
  }
  const labels = { INTERNA: 'Interna', INTERESTADUAL: 'Interestadual', INTERNACIONAL: 'Internacional' }
  return (
    <Badge variant={value === 'INTERNA' ? 'info' : 'secondary'} className={colors[value] || undefined}>
      {labels[value] || value}
    </Badge>
  )
}

const EMPTY_FORM = {
  categoria: 'Vendas',
  cfop_saida: '',
  cfop_entrada: '',
  escopo: 'INTERNA',
  processamento: 'AUTOMATICO',
  descricao: '',
  empresa_ids: [],  // empty = global
  is_global: true,
}

function CompanyMultiSelect({ companies, selectedIds, isGlobal, onToggleGlobal, onToggle }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = companies.filter(c =>
    (c.razao_social || c.cnpj || '').toLowerCase().includes(search.toLowerCase())
  )

  const label = isGlobal
    ? 'Global (todas as empresas)'
    : selectedIds.length === 0
      ? 'Selecione empresas...'
      : `${selectedIds.length} empresa${selectedIds.length > 1 ? 's' : ''} selecionada${selectedIds.length > 1 ? 's' : ''}`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-input rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between bg-card"
      >
        <span className={isGlobal ? 'text-muted-foreground' : 'text-foreground'}>{label}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Buscar empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-8 text-xs"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-48">
            {/* Global toggle */}
            <label className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer border-b border-border" onClick={(e) => { e.preventDefault(); onToggleGlobal() }}>
              <Checkbox checked={isGlobal} onCheckedChange={() => onToggleGlobal()} />
              <span className="text-sm font-medium text-foreground">Global (todas as empresas)</span>
            </label>

            {/* Company list */}
            {filtered.map(c => {
              const checked = selectedIds.includes(c.id)
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer ${isGlobal ? 'opacity-40 pointer-events-none' : ''}`}
                  onClick={(e) => { if (!isGlobal) { e.preventDefault(); onToggle(c.id) } }}
                >
                  <Checkbox checked={checked && !isGlobal} disabled={isGlobal} onCheckedChange={() => onToggle(c.id)} />
                  <span className="text-sm text-foreground truncate">{c.razao_social || c.cnpj}</span>
                </label>
              )
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Nenhuma empresa encontrada</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CfopOperationRules() {
  // Filters
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterEscopo, setFilterEscopo] = useState('')
  const [filterProcessamento, setFilterProcessamento] = useState('')
  const [filterEmpresa, setFilterEmpresa] = useState('global') // 'global' | 'all' | company id
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const toast = useToast()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Companies
  const { data: companiesData } = useCompanies()
  const companies = companiesData || []

  // Query
  const queryParams = {
    categoria: filterCategoria || undefined,
    escopo: filterEscopo || undefined,
    processamento: filterProcessamento || undefined,
    search: debouncedSearch || undefined,
  }
  if (filterEmpresa === 'all') {
    queryParams.show_all = true
  } else if (filterEmpresa !== 'global') {
    queryParams.empresa_id = Number(filterEmpresa)
  }
  queryParams.page = page
  queryParams.pageSize = pageSize
  const { data, isLoading, isError } = useCfopRules(queryParams)

  // Also fetch all rules (unfiltered) to derive filter options
  const { data: allData } = useCfopRules({ show_all: true, page: 1, pageSize: 200 })
  const allRules = allData?.items || []

  const rules = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.total_pages || 1

  // Derive filter options dynamically from ALL rules (not filtered subset)
  const categoriaOptions = [...new Set(allRules.map(r => r.categoria).filter(Boolean))].sort().map(c => ({ value: c, label: c }))
  const escopoOptions = [...new Set(allRules.map(r => r.escopo).filter(Boolean))].sort().map(e => ({ value: e, label: ESCOPO_LABELS[e] || e }))
  const processamentoOptions = [...new Set(allRules.map(r => r.processamento).filter(Boolean))].sort().map(p => ({ value: p, label: PROC_LABELS[p] || p }))
  const empresaOptions = [
    { value: 'global', label: 'Regras Globais' },
    { value: 'all', label: 'Todas (Global + Empresa)' },
    ...companies.map(c => ({ value: String(c.id), label: c.razao_social || c.cnpj })),
  ]

  // Helper to get company name
  const getCompanyName = (empresaId) => {
    if (!empresaId) return 'Global'
    const company = companies.find(c => c.id === empresaId)
    return company ? (company.razao_social || company.cnpj) : `Empresa #${empresaId}`
  }

  // Mutations
  const createMutation = useCreateCfopRule()
  const updateMutation = useUpdateCfopRule()
  const deleteMutation = useDeleteCfopRule()

  const handleOpenCreate = () => {
    setEditingRule(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const handleOpenEdit = (rule) => {
    setEditingRule(rule)
    setForm({
      categoria: rule.categoria,
      cfop_saida: rule.cfop_saida,
      cfop_entrada: rule.cfop_entrada,
      escopo: rule.escopo,
      processamento: rule.processamento,
      descricao: rule.descricao || '',
      empresa_ids: rule.empresa_id ? [rule.empresa_id] : [],
      is_global: !rule.empresa_id,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      const { empresa_ids, is_global, ...baseData } = form

      if (editingRule) {
        // Edit: single rule update
        await updateMutation.mutateAsync({
          id: editingRule.id,
          data: { ...baseData, empresa_id: is_global ? null : (empresa_ids[0] || null) },
        })
        toast.success('Regra atualizada com sucesso')
      } else {
        // Create: if global, create one rule with empresa_id=null
        // If company-specific, create one rule per selected company
        if (is_global || empresa_ids.length === 0) {
          await createMutation.mutateAsync({ ...baseData, empresa_id: null })
          toast.success('Regra global criada com sucesso')
        } else {
          let created = 0
          for (const empId of empresa_ids) {
            await createMutation.mutateAsync({ ...baseData, empresa_id: empId })
            created++
          }
          toast.success(`${created} regra${created > 1 ? 's' : ''} criada${created > 1 ? 's' : ''} com sucesso`)
        }
      }
      setShowModal(false)
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar regra')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirm(null)
      toast.success('Regra excluída')
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir')
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-muted flex items-center justify-between -mx-6 -mt-6 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Regras de Operação CFOP</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Regras de-para CFOP saída/entrada. Regras automáticas escrituram NFs sem intervenção manual.
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-card rounded-lg border border-border mb-4">
            <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-50">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder="Buscar CFOP, categoria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              <SearchableSelect
                options={categoriaOptions}
                value={filterCategoria}
                onChange={(v) => { setFilterCategoria(v); setPage(1) }}
                placeholder="Buscar categoria..."
                allLabel="Todas categorias"
              />

              <SearchableSelect
                options={escopoOptions}
                value={filterEscopo}
                onChange={(v) => { setFilterEscopo(v); setPage(1) }}
                placeholder="Buscar escopo..."
                allLabel="Todos escopos"
              />

              <SearchableSelect
                options={processamentoOptions}
                value={filterProcessamento}
                onChange={(v) => { setFilterProcessamento(v); setPage(1) }}
                placeholder="Buscar tipo..."
                allLabel="Todos tipos"
              />

              <SearchableSelect
                options={empresaOptions}
                value={filterEmpresa}
                onChange={(v) => { setFilterEmpresa(v || 'global'); setPage(1) }}
                placeholder="Buscar empresa..."
                allLabel={null}
              />

              {/* Actions */}
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4" />
                Nova Regra
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Settings2 className="w-4 h-4" />
              <span className="font-medium text-foreground">{total}</span> regra{total !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-success-text" />
              <span className="font-medium text-foreground">{rules.filter(r => r.processamento === 'AUTOMATICO').length}</span> automáticas
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-warning-text" />
              <span className="font-medium text-foreground">{rules.filter(r => r.processamento === 'MANUAL').length}</span> manuais
            </span>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          ) : isError ? (
            <div className="bg-card rounded-lg border border-destructive-border p-12 text-center">
              <AlertCircle className="w-10 h-10 text-destructive-text/60 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Erro ao carregar regras</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Settings2 className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma regra cadastrada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em "Nova Regra" para criar regras de operação CFOP.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>CFOP Saida</TableHead>
                    <TableHead>CFOP Entrada</TableHead>
                    <TableHead>Escopo</TableHead>
                    <TableHead>Processamento</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id} className={!rule.ativo ? 'opacity-50' : ''}>
                      <TableCell className="text-foreground font-medium">{rule.categoria}</TableCell>
                      <TableCell className="text-foreground font-mono">{rule.cfop_saida}</TableCell>
                      <TableCell className="text-foreground font-mono">{rule.cfop_entrada}</TableCell>
                      <TableCell><EscopoBadge value={rule.escopo} /></TableCell>
                      <TableCell><ProcessamentoBadge value={rule.processamento} /></TableCell>
                      <TableCell>
                        <Badge variant={rule.empresa_id ? 'warning' : 'secondary'}>
                          {getCompanyName(rule.empresa_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs truncate max-w-50">
                        {rule.descricao || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <IconButton
                                aria-label="Editar"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(rule)}
                              >
                                <Pencil className="w-4 h-4" />
                              </IconButton>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <IconButton
                                aria-label="Excluir"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(rule)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </IconButton>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Drawer */}
      <Sheet open={showModal} onOpenChange={setShowModal}>
        <SheetContent className="sm:max-w-xl p-0 gap-0">
          <SheetHeader className="px-6 py-5 border-b border-border">
            <SheetTitle className="text-xl font-bold text-foreground">
              {editingRule ? 'Editar Regra' : 'Nova Regra CFOP'}
            </SheetTitle>
          </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriaOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Escopo</label>
                  <Select value={form.escopo} onValueChange={(v) => setForm({ ...form, escopo: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {escopoOptions.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">CFOP Saida</label>
                  <Input
                    type="text"
                    value={form.cfop_saida}
                    onChange={(e) => setForm({ ...form, cfop_saida: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="5101"
                    maxLength={4}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">CFOP Entrada</label>
                  <Input
                    type="text"
                    value={form.cfop_entrada}
                    onChange={(e) => setForm({ ...form, cfop_entrada: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="1101"
                    maxLength={4}
                    className="font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Processamento</label>
                <RadioGroup
                  value={form.processamento}
                  onValueChange={(v) => setForm({ ...form, processamento: v })}
                  className="flex gap-3"
                >
                  {processamentoOptions.map(p => (
                    <label key={p.value} className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value={p.value} />
                      <span className="text-sm text-foreground">{p.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descrição (opcional)</label>
                <Input
                  type="text"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição da operação..."
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Empresas (desmarque "Global" para selecionar empresas específicas)</label>
                <CompanyMultiSelect
                  companies={companies}
                  selectedIds={form.empresa_ids}
                  isGlobal={form.is_global}
                  onToggleGlobal={() => setForm({ ...form, is_global: !form.is_global, empresa_ids: [] })}
                  onToggle={(id) => setForm({
                    ...form,
                    empresa_ids: form.empresa_ids.includes(id)
                      ? form.empresa_ids.filter(x => x !== id)
                      : [...form.empresa_ids, id],
                  })}
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-border px-6 py-4 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !form.cfop_saida || !form.cfop_entrada}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingRule ? 'Salvar' : 'Criar'}
              </Button>
            </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Drawer */}
      <Sheet open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <SheetContent className="sm:max-w-md p-0 gap-0">
          <SheetHeader className="px-6 py-5 border-b border-border">
            <SheetTitle className="text-xl font-bold text-foreground">Confirmar exclusão</SheetTitle>
          </SheetHeader>

          {deleteConfirm && (
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-sm text-muted-foreground">
                Deseja excluir a regra CFOP <span className="font-mono font-medium">{deleteConfirm.cfop_saida}</span> → <span className="font-mono font-medium">{deleteConfirm.cfop_entrada}</span> ({deleteConfirm.escopo})?
              </p>
            </div>
          )}

          <div className="shrink-0 border-t border-border px-6 py-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Excluir
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
