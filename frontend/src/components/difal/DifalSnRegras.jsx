import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Filter, RefreshCw } from 'lucide-react'
import {
  Badge, Button, Card,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'

// Tela SÓ LEITURA (DV5-11): o que o Rule Pack DIFAL-SN tem por UF × instituto
// e o que o gate de ativação (validar_ativacao, RN-26) ainda acusa em cada
// regra. Nenhuma ação de escrita — promover/retirar regra continua sendo
// operação dos scripts de governança do rule_engine.

const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

const ESTADO_VARIANTS = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  RETIRED: 'secondary',
}

const DECISAO_LABELS = {
  COLLECT: 'Recolhe',
  DO_NOT_COLLECT: 'Não recolhe',
  BLOCKED: 'Bloqueada',
}

const DECISAO_COLORS = {
  COLLECT: 'text-foreground',
  DO_NOT_COLLECT: 'text-muted-foreground',
  BLOCKED: 'text-destructive-text',
}

const FINALIDADE_LABELS = {
  USO_CONSUMO: 'Uso e consumo',
  ATIVO_IMOBILIZADO: 'Ativo imobilizado',
  REVENDA: 'Revenda',
  MATERIA_PRIMA: 'Matéria-prima',
}

export default function DifalSnRegras() {
  const [regras, setRegras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterUf, setFilterUf] = useState('')
  const [filterInstituto, setFilterInstituto] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getDifalSnRegras({
        uf: filterUf || undefined,
        instituto: filterInstituto || undefined,
        estado: filterEstado || undefined,
      })
      setRegras(data.regras || [])
    } catch (err) {
      console.error('Failed to load DIFAL-SN rules:', err)
      setError(err.message)
      setRegras([])
    } finally {
      setLoading(false)
    }
  }, [filterUf, filterInstituto, filterEstado])

  useEffect(() => { fetchData() }, [fetchData])

  const activeFilters = [filterUf, filterInstituto, filterEstado].filter(Boolean).length

  const nActive = regras.filter((r) => r.estado_governanca === 'ACTIVE').length
  const nDraft = regras.filter((r) => r.estado_governanca === 'DRAFT').length
  const nSoAprovador = regras.filter(
    (r) => r.estado_governanca === 'DRAFT' && r.apta_sem_aprovador && r.violacoes.length > 0,
  ).length
  const nComPendencia = regras.filter(
    (r) => r.estado_governanca === 'DRAFT' && !r.apta_sem_aprovador,
  ).length

  // Agrupada por UF (a lista já vem ordenada por rule_code, que começa pela UF).
  const porUf = regras.reduce((acc, r) => {
    (acc[r.uf_destino] = acc[r.uf_destino] || []).push(r)
    return acc
  }, {})
  const ufs = Object.keys(porUf).sort()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-muted">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Regras DIFAL-SN</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rule Pack por UF e instituto, com o que o gate de ativação ainda acusa. Somente leitura.
            </p>
          </div>
          <Button
            onClick={fetchData}
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          <StatCard label="Regras" value={regras.length} color="gray" />
          <StatCard label="Ativas" value={nActive} color="green" />
          <StatCard label="Em rascunho" value={nDraft} color="amber" />
          <StatCard label="Só falta aprovador" value={nSoAprovador} color="blue" />
          <StatCard label="Com pendência técnica" value={nComPendencia} color="red" />
        </div>
      </div>

      {/* Filters bar */}
      <div className="px-6 py-2 border-b border-border bg-muted flex items-center gap-2">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={activeFilters > 0 ? 'info' : 'ghost'}
          size="sm"
          className={activeFilters > 0 ? '' : 'text-muted-foreground font-normal'}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtros {activeFilters > 0 && `(${activeFilters})`}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
        {activeFilters > 0 && (
          <Button
            onClick={() => { setFilterUf(''); setFilterInstituto(''); setFilterEstado('') }}
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {regras.length} {regras.length === 1 ? 'regra' : 'regras'} em {ufs.length} {ufs.length === 1 ? 'UF' : 'UFs'}
        </span>
      </div>

      {showFilters && (
        <div className="px-6 py-3 border-b border-border bg-muted flex gap-4">
          <select
            value={filterUf}
            onChange={(e) => setFilterUf(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">UF: Todas</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <select
            value={filterInstituto}
            onChange={(e) => setFilterInstituto(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Instituto: Todos</option>
            <option value="DIFAL">DIFAL</option>
            <option value="ANTECIPACAO">Antecipação</option>
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Estado: Todos</option>
            <option value="DRAFT">Rascunho (DRAFT)</option>
            <option value="ACTIVE">Ativa (ACTIVE)</option>
            <option value="RETIRED">Retirada (RETIRED)</option>
          </select>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {error ? (
          <div className="flex flex-col items-center justify-center h-40 text-destructive-text">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">Não foi possível carregar as regras</p>
            <p className="text-xs mt-1 text-muted-foreground">{error}</p>
          </div>
        ) : loading && regras.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : regras.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p className="text-sm font-medium">Nenhuma regra para os filtros</p>
          </div>
        ) : (
          ufs.map((uf) => (
            <section key={uf}>
              <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-9 h-6 rounded bg-primary text-primary-foreground text-xs font-semibold">{uf}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {porUf[uf].length} {porUf[uf].length === 1 ? 'regra' : 'regras'}
                </span>
              </h2>
              <Card padding="none" className="gap-0 overflow-hidden">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="w-8 px-0 h-auto" />
                      <TableHead className="text-left px-3 py-2 h-auto font-medium text-muted-foreground uppercase">Regra</TableHead>
                      <TableHead className="text-left px-3 py-2 h-auto font-medium text-muted-foreground uppercase">Instituto</TableHead>
                      <TableHead className="text-left px-3 py-2 h-auto font-medium text-muted-foreground uppercase">Finalidade</TableHead>
                      <TableHead className="text-left px-3 py-2 h-auto font-medium text-muted-foreground uppercase">Decisão</TableHead>
                      <TableHead className="text-left px-3 py-2 h-auto font-medium text-muted-foreground uppercase">Base / dedução</TableHead>
                      <TableHead className="text-left px-3 py-2 h-auto font-medium text-muted-foreground uppercase">FCP</TableHead>
                      <TableHead className="text-center px-3 py-2 h-auto font-medium text-muted-foreground uppercase">Exemplos</TableHead>
                      <TableHead className="text-left px-3 py-2 h-auto font-medium text-muted-foreground uppercase">Estado</TableHead>
                      <TableHead className="text-left px-3 py-2 h-auto font-medium text-muted-foreground uppercase">Gate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porUf[uf].map((r) => (
                      <RegraRow
                        key={r.id}
                        regra={r}
                        expanded={expandedId === r.id}
                        onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function RegraRow({ regra, expanded, onToggle }) {
  const nViol = regra.violacoes.length
  const apta = nViol === 0
  const soAprovador = !apta && regra.apta_sem_aprovador
  const isCollect = regra.decisao_default === 'COLLECT'

  return (
    <>
      <TableRow
        onClick={onToggle}
        className={`cursor-pointer hover:bg-muted ${expanded ? 'bg-muted' : ''}`}
      >
        <TableCell className="pl-3 pr-0 py-0 text-muted-foreground">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </TableCell>
        <TableCell className="px-3 py-2 font-mono text-xs text-foreground">
          {regra.rule_code}<span className="text-muted-foreground">@v{regra.rule_version}</span>
        </TableCell>
        <TableCell className="px-3 py-2 text-foreground">{regra.instituto === 'ANTECIPACAO' ? 'Antecipação' : regra.instituto || '—'}</TableCell>
        <TableCell className="px-3 py-2 text-foreground">{FINALIDADE_LABELS[regra.finalidade] || regra.finalidade || '—'}</TableCell>
        <TableCell className={`px-3 py-2 ${DECISAO_COLORS[regra.decisao_default] || 'text-foreground'}`}>
          {DECISAO_LABELS[regra.decisao_default] || regra.decisao_default || '—'}
        </TableCell>
        <TableCell className="px-3 py-2 text-foreground">
          {isCollect ? (
            <>
              {regra.tipo_base || <span className="text-destructive-text">a definir</span>}
              <span className="text-muted-foreground"> / </span>
              {regra.icms_origem_policy || <span className="text-destructive-text">a definir</span>}
            </>
          ) : '—'}
        </TableCell>
        <TableCell className="px-3 py-2 text-muted-foreground text-xs">{isCollect ? (regra.fcp_policy || '—') : '—'}</TableCell>
        <TableCell className="px-3 py-2 text-center text-foreground">
          {isCollect ? (
            <span title="homologados / total">
              <span className={regra.n_exemplos_homologados > 0 ? 'text-success-text font-medium' : 'text-muted-foreground'}>
                {regra.n_exemplos_homologados}
              </span>
              <span className="text-muted-foreground">/{regra.n_exemplos}</span>
            </span>
          ) : '—'}
        </TableCell>
        <TableCell className="px-3 py-2">
          <Badge variant={ESTADO_VARIANTS[regra.estado_governanca] || 'secondary'}>
            {regra.estado_governanca}
          </Badge>
        </TableCell>
        <TableCell className="px-3 py-2">
          {apta ? (
            <span className="inline-flex items-center gap-1 text-xs text-success-text">
              <CheckCircle2 className="w-3.5 h-3.5" /> apta
            </span>
          ) : soAprovador ? (
            <span className="inline-flex items-center gap-1 text-xs text-info-text">
              <AlertTriangle className="w-3.5 h-3.5" /> só falta aprovador
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-destructive-text">
              <AlertTriangle className="w-3.5 h-3.5" /> {nViol} {nViol === 1 ? 'violação' : 'violações'}
            </span>
          )}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted hover:bg-muted">
          <TableCell className="p-0" />
          <TableCell colSpan={9} className="px-3 py-3 whitespace-normal">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-semibold text-muted-foreground mb-1">Violações do gate de ativação (RN-26)</div>
                {nViol === 0 ? (
                  <p className="text-success-text">Nenhuma — a regra pode ser promovida a ACTIVE.</p>
                ) : (
                  <ul className="list-disc pl-4 space-y-1 text-foreground">
                    {regra.violacoes.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                )}
              </div>
              <div className="space-y-1 text-foreground">
                <div><span className="text-muted-foreground">Procedência:</span>{' '}
                  {regra.procedencia
                    ? `${regra.procedencia.tipo || '—'} · ${regra.procedencia.ref || '—'} · ${regra.procedencia.data || '—'}`
                    : '—'}
                </div>
                <div><span className="text-muted-foreground">Aprovador fiscal:</span> {regra.aprovador_fiscal || '—'}</div>
                <div><span className="text-muted-foreground">Prioridade:</span> {regra.prioridade ?? '—'}</div>
                <div><span className="text-muted-foreground">Id da regra:</span> {regra.id}</div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function StatCard({ label, value, color }) {
  const bgMap = {
    gray: 'bg-muted border-border',
    amber: 'bg-warning-subtle border-warning-border',
    blue: 'bg-info-subtle border-info-border',
    green: 'bg-success-subtle border-success-border',
    red: 'bg-destructive-subtle border-destructive-border',
  }
  const textMap = {
    gray: 'text-foreground',
    amber: 'text-warning-text',
    blue: 'text-info-text',
    green: 'text-success-text',
    red: 'text-destructive-text',
  }
  return (
    <div className={`rounded-lg border px-3 py-2 ${bgMap[color]}`}>
      <div className={`text-lg font-bold ${textMap[color]}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
