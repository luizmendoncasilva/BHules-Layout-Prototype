import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Clock, CheckCircle2, User, Filter, RefreshCw, ChevronDown, X } from 'lucide-react'
import {
  Button, Badge, Input, Label,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { useCompany } from '../../context/CompanyContext'
import ResolveModal from './ResolveModal'
import Pagination from '../shared/Pagination'

const STATUS_LABELS = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em Análise',
  APROVAR_OVERRIDE: 'Override Aprovado',
  BLOQUEAR_CONFIRMADO: 'Bloqueio Confirmado',
  CORRIGIR: 'Corrigido',
  DEVOLVER_FORNECEDOR: 'Devolvido',
  CANCELADO: 'Cancelado',
}

// Variantes do DS Badge por status/prioridade (mesma semântica das antigas classes de cor)
const STATUS_BADGE_VARIANTS = {
  PENDENTE: 'warning',
  EM_ANALISE: 'info',
  APROVAR_OVERRIDE: 'success',
  BLOQUEAR_CONFIRMADO: 'destructive',
  CORRIGIR: 'info',
  DEVOLVER_FORNECEDOR: 'warning',
  CANCELADO: 'secondary',
}

const PRIORIDADE_BADGE_VARIANTS = {
  ALTA: 'destructive',
  MEDIA: 'warning',
  BAIXA: 'success',
}

// Sentinela usada só na UI do Select (Radix não aceita value="") — o estado
// interno de filtro continua usando '' para "todos", como antes.
const ALL_VALUE = '__all__'

const TIPO_LABELS = {
  REVISAO_FISCAL: 'Revisão Fiscal',
  ST_FALTANTE: 'ST Faltante',
  BLOQUEIO_FORNECEDOR: 'Bloqueio Fornecedor',
  DIVERGENCIA_CALCULO: 'Divergência Cálculo',
  FINALIDADE_INDETERMINADA: 'Finalidade Indeterminada',
  CONFIABILIDADE_BAIXA: 'Confiabilidade Baixa',
}

export default function ExceptionQueue() {
  const { selectedCompanyIds } = useCompany()
  const companyId = selectedCompanyIds?.length === 1 ? selectedCompanyIds[0] : null

  const [exceptions, setExceptions] = useState([])
  const [totalExceptions, setTotalExceptions] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPrioridade, setFilterPrioridade] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [resolveItem, setResolveItem] = useState(null)
  const [assigningId, setAssigningId] = useState(null)
  const [assignTargetId, setAssignTargetId] = useState(null)
  const [assignName, setAssignName] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Reset to first page whenever filters/company change
  useEffect(() => { setPage(1) }, [companyId, filterStatus, filterPrioridade, filterTipo])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [excResult, excStats] = await Promise.all([
        api.getExceptions({
          companyId,
          status: filterStatus || undefined,
          prioridade: filterPrioridade || undefined,
          tipo: filterTipo || undefined,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        api.getExceptionStats(companyId),
      ])
      setExceptions(excResult.items || [])
      setTotalExceptions(excResult.total ?? (excResult.items || []).length)
      setTotalPages(excResult.total_pages || 1)
      setStats(excStats)
    } catch (err) {
      console.error('Failed to load exceptions:', err)
    } finally {
      setLoading(false)
    }
  }, [companyId, filterStatus, filterPrioridade, filterTipo, page, pageSize])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAssign = (id) => {
    setAssignName('')
    setAssignTargetId(id)
  }

  const handleConfirmAssign = async (e) => {
    e.preventDefault()
    const analista = assignName.trim()
    if (!analista) return
    const id = assignTargetId
    setAssignTargetId(null)
    setAssigningId(id)
    try {
      await api.assignException(id, analista)
      fetchData()
    } catch (err) {
      toast.error('Erro ao atribuir', { description: err.message })
    } finally {
      setAssigningId(null)
    }
  }

  const handleResolve = async (id, data) => {
    try {
      await api.resolveException(id, data)
      setResolveItem(null)
      fetchData()
    } catch (err) {
      toast.error('Erro ao resolver', { description: err.message })
    }
  }

  const activeFilters = [filterStatus, filterPrioridade, filterTipo].filter(Boolean).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-muted">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Fila de Exceções</h1>
            <p className="text-sm text-muted-foreground mt-1">Itens pendentes de revisão humana</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-5 gap-3">
            <StatCard label="Total" value={stats.total} color="gray" />
            <StatCard label="Pendentes" value={stats.pendentes} color="warning" />
            <StatCard label="Em Análise" value={stats.em_analise} color="info" />
            <StatCard label="Resolvidas" value={stats.resolvidas} color="success" />
            <StatCard label="SLA Violado" value={stats.sla_violado} color="destructive" />
          </div>
        )}
      </div>

      {/* Filters bar */}
      <div className="px-6 py-2 border-b border-border bg-muted flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={activeFilters > 0 ? 'bg-primary/10 text-primary font-medium hover:bg-primary/10' : 'text-muted-foreground'}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros {activeFilters > 0 && `(${activeFilters})`}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterStatus(''); setFilterPrioridade(''); setFilterTipo('') }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {totalExceptions} {totalExceptions === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {showFilters && (
        <div className="px-6 py-3 border-b border-border bg-muted flex gap-4">
          <Select
            value={filterStatus || ALL_VALUE}
            onValueChange={(v) => setFilterStatus(v === ALL_VALUE ? '' : v)}
          >
            <SelectTrigger className="w-56 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Status: Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
              <SelectItem value="APROVAR_OVERRIDE">Override Aprovado</SelectItem>
              <SelectItem value="BLOQUEAR_CONFIRMADO">Bloqueio Confirmado</SelectItem>
              <SelectItem value="CORRIGIR">Corrigido</SelectItem>
              <SelectItem value="DEVOLVER_FORNECEDOR">Devolvido</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterPrioridade || ALL_VALUE}
            onValueChange={(v) => setFilterPrioridade(v === ALL_VALUE ? '' : v)}
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Prioridade: Todas</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="MEDIA">Média</SelectItem>
              <SelectItem value="BAIXA">Baixa</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterTipo || ALL_VALUE}
            onValueChange={(v) => setFilterTipo(v === ALL_VALUE ? '' : v)}
          >
            <SelectTrigger className="w-56 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tipo: Todos</SelectItem>
              <SelectItem value="REVISAO_FISCAL">Revisão Fiscal</SelectItem>
              <SelectItem value="CONFIABILIDADE_BAIXA">Confiabilidade Baixa</SelectItem>
              <SelectItem value="FINALIDADE_INDETERMINADA">Finalidade Indeterminada</SelectItem>
              <SelectItem value="DIVERGENCIA_CALCULO">Divergência Cálculo</SelectItem>
              <SelectItem value="ST_FALTANTE">ST Faltante</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {loading && exceptions.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : exceptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mb-2 text-success" />
            <p className="text-sm font-medium">Nenhuma exceção encontrada</p>
            <p className="text-xs mt-1">Todos os itens foram processados com sucesso</p>
          </div>
        ) : (
          exceptions.map((exc) => (
            <ExceptionCard
              key={exc.id}
              item={exc}
              onAssign={() => handleAssign(exc.id)}
              onResolve={() => setResolveItem(exc)}
              assigning={assigningId === exc.id}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {exceptions.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalExceptions}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        />
      )}

      {/* Resolve Modal */}
      {resolveItem && (
        <ResolveModal
          item={resolveItem}
          onClose={() => setResolveItem(null)}
          onResolve={(data) => handleResolve(resolveItem.id, data)}
        />
      )}

      {/* Assign Dialog — substitui o antigo prompt() nativo do browser */}
      <Dialog open={!!assignTargetId} onOpenChange={(open) => { if (!open) setAssignTargetId(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Atribuir exceção</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmAssign} className="space-y-3">
            <div>
              <Label htmlFor="assign-analista" className="block mb-1">Nome do analista</Label>
              <Input
                id="assign-analista"
                type="text"
                value={assignName}
                onChange={(e) => setAssignName(e.target.value)}
                placeholder="Nome do analista"
                autoFocus
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignTargetId(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!assignName.trim()}>
                Atribuir
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ label, value, color }) {
  const bgMap = {
    gray: 'bg-card border-border',
    warning: 'bg-warning-subtle border-warning-border',
    info: 'bg-info-subtle border-info-border',
    success: 'bg-success-subtle border-success-border',
    destructive: 'bg-destructive-subtle border-destructive-border',
  }
  const textMap = {
    gray: 'text-foreground',
    warning: 'text-warning-text',
    info: 'text-info-text',
    success: 'text-success-text',
    destructive: 'text-destructive-text',
  }
  return (
    <div className={`rounded-lg border px-3 py-2 shadow-sm ${bgMap[color]}`}>
      <div className={`text-lg font-semibold ${textMap[color]}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function ExceptionCard({ item, onAssign, onResolve, assigning }) {
  const isOpen = item.status === 'PENDENTE' || item.status === 'EM_ANALISE'
  const slaViolated = item.data_limite && new Date(item.data_limite) < new Date() && isOpen

  return (
    <div className={`bg-card border rounded-lg p-4 shadow-sm transition-colors ${
      slaViolated ? 'border-destructive-border bg-destructive-subtle' : 'border-border hover:border-input'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant={STATUS_BADGE_VARIANTS[item.status] || 'secondary'}>
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
            <Badge variant={PRIORIDADE_BADGE_VARIANTS[item.prioridade] || 'secondary'}>
              {item.prioridade}
            </Badge>
            {item.tipo_excecao && (
              <Badge variant="secondary">
                {TIPO_LABELS[item.tipo_excecao] || item.tipo_excecao}
              </Badge>
            )}
            {slaViolated && (
              <span className="text-xs font-medium text-destructive flex items-center gap-1">
                <Clock className="w-3 h-3" /> SLA Violado
              </span>
            )}
          </div>
          <p className="text-sm text-foreground leading-snug">{item.descricao}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>NF #{item.invoice_id}</span>
            {item.invoice_item_id && <span>Item #{item.invoice_item_id}</span>}
            {item.rule_code && <span>{item.rule_code}</span>}
            {item.impacto_financeiro && (
              <span className="text-warning-text font-medium">
                R$ {Number(item.impacto_financeiro).toFixed(2)}
              </span>
            )}
            {item.analista_responsavel && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {item.analista_responsavel}
              </span>
            )}
          </div>
          {item.justificativa && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              Justificativa: {item.justificativa}
            </p>
          )}
        </div>

        {isOpen && (
          <div className="flex items-center gap-1.5 shrink-0">
            {!item.analista_responsavel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAssign}
                disabled={assigning}
              >
                {assigning ? '...' : 'Atribuir'}
              </Button>
            )}
            <Button size="sm" onClick={onResolve}>
              Resolver
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
