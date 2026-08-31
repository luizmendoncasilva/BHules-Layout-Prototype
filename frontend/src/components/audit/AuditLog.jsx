import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History, RefreshCw } from 'lucide-react'
import { api } from '../../api/client'
import Pagination from '../shared/Pagination'
import {
  LoadingButton, Input, Badge,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  DatePicker, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'

function parseIsoDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatIsoDate(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Rótulos amigáveis para os event_type conhecidos (o quê).
const EVENT_LABELS = {
  'invoice.ingested': 'Nota ingerida',
  'invoice.feedback.upvote': 'Feedback (concordou)',
  'invoice.feedback.downvote': 'Feedback (discordou)',
  'invoice.engine.status_changed': 'Status alterado pelo motor',
  'invoice.auto_review.published': 'Enviada ao Onvio',
  'invoice.escrituracao.enviada_onvio': 'Confirmada e enviada ao Onvio',
  'invoice.integration.locked': 'Integração travada',
  'invoice.integration.unlocked': 'Integração destravada',
  'invoice.deleted': 'Nota excluída',
  'invoice.escrituracao.run_manual': 'Escrituração rodada (manual)',
  'invoice.escrituracao.feedback_submitted': 'Feedback de escrituração',
  'invoice.escrituracao.undone': 'Escrituração desfeita',
  'invoice.escrituracao.problem_reported': 'Problema reportado',
  'invoice.override.submitted': 'Correção de classificação',
  'invoice.approved.as_feedback': 'Aprovada (feedback)',
  'company.hard_deleted': 'Empresa excluída (hard-delete)',
}

const ACTOR_TYPE_BADGE_VARIANT = {
  human: 'info',
  analyst: 'info',
  motor: 'secondary',
  engine: 'secondary',
  system: 'secondary',
}

// Radix Select não aceita value="" (usado como sentinela interno de deselect),
// então os filtros "todos/todas" usam este valor e são mapeados de volta para ''.
const ALL_VALUE = '__all__'

function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export default function AuditLog() {
  const [filters, setFilters] = useState({ eventType: '', actor: '', actorType: '', startDate: '', endDate: '' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Reset to first page whenever filters change
  useEffect(() => { setPage(1) }, [filters])

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['auditEvents', filters, page, pageSize],
    queryFn: () => api.getAuditEvents({ ...filters, limit: pageSize, offset: (page - 1) * pageSize }),
    keepPreviousData: true,
  })

  const events = data?.items || []
  const totalEvents = data?.total ?? events.length
  const totalPages = data?.total_pages || 1
  const update = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  return (
    <div className="flex flex-col h-full bg-muted">
      <div className="px-6 py-4 border-b border-border bg-card flex items-center gap-3">
        <History className="w-5 h-5 text-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Auditoria</h1>
        <span className="text-sm text-muted-foreground">o quê · quem · quando</span>
        <LoadingButton
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          loading={isFetching}
          className="ml-auto"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar
        </LoadingButton>
      </div>

      {/* Filtros */}
      <div className="px-6 py-3 bg-card border-b border-border flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-muted-foreground">
          Tipo de ação
          <Select
            value={filters.eventType || ALL_VALUE}
            onValueChange={(v) => update('eventType', v === ALL_VALUE ? '' : v)}
          >
            <SelectTrigger className="mt-1 min-w-52 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todas</SelectItem>
              {Object.entries(EVENT_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col text-xs text-muted-foreground">
          Quem (ator)
          <Input
            type="text" placeholder="email ou motor/system" value={filters.actor}
            onChange={(e) => update('actor', e.target.value)}
            className="mt-1 h-auto py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs text-muted-foreground">
          Tipo de ator
          <Select
            value={filters.actorType || ALL_VALUE}
            onValueChange={(v) => update('actorType', v === ALL_VALUE ? '' : v)}
          >
            <SelectTrigger className="mt-1 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos</SelectItem>
              <SelectItem value="analyst">Analista</SelectItem>
              <SelectItem value="motor">Motor</SelectItem>
              <SelectItem value="engine">Engine</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col text-xs text-muted-foreground">
          De
          <DatePicker
            value={parseIsoDate(filters.startDate)}
            onValueChange={(date) => update('startDate', formatIsoDate(date))}
            className="mt-1 h-auto py-1.5 text-sm w-auto"
          />
        </label>
        <label className="flex flex-col text-xs text-muted-foreground">
          Até
          <DatePicker
            value={parseIsoDate(filters.endDate)}
            onValueChange={(date) => update('endDate', formatIsoDate(date))}
            className="mt-1 h-auto py-1.5 text-sm w-auto"
          />
        </label>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : isError ? (
          <p className="text-sm text-destructive-text">Erro ao carregar a auditoria.</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma ação encontrada para os filtros.</p>
        ) : (
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Quem</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-foreground">{fmtDateTime(e.created_at)}</TableCell>
                  <TableCell>{EVENT_LABELS[e.event_type] || e.event_type}</TableCell>
                  <TableCell>
                    <Badge variant={ACTOR_TYPE_BADGE_VARIANT[e.actor_type] || 'secondary'}>
                      {e.actor}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.invoice_id ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs max-w-xs truncate whitespace-nowrap" title={e.payload ? JSON.stringify(e.payload) : ''}>
                    {e.payload ? JSON.stringify(e.payload) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Paginação */}
      {events.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalEvents}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        />
      )}
    </div>
  )
}
