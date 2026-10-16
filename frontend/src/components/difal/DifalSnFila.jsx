import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, Filter, RefreshCw } from 'lucide-react'
import {
  Badge, Button, Checkbox, IconButton, Input,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { useCompany } from '../../context/CompanyContext'
import CompanySelector from '../shared/CompanySelector'
import { useToast } from '../shared/Toast'
import ValidacaoDifalModal, { fmtBRL } from './ValidacaoDifalModal'

// Fila DIFAL-SN (RN-25, DV5-01, T9) — a Célula valida nota a nota os itens
// COLLECT pendentes. Mesma casca da ExceptionQueue (filtros + lista), mas a
// paginação é keyset (`cursor`/`next_cursor`, sem total): "Carregar mais"
// em vez de Pagination.jsx. O autor do veredito NUNCA sai daqui — o backend
// usa o JWT.

const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

const ESTADO_LABELS = {
  PENDENTE: 'Pendente',
  PENDENTE_VALIDACAO: 'Pendente de validação',
  VALIDADO: 'Validado',
  REJEITADO: 'Rejeitado',
}

const ESTADO_VARIANTS = {
  PENDENTE: 'warning',
  PENDENTE_VALIDACAO: 'warning',
  VALIDADO: 'success',
  REJEITADO: 'destructive',
}

const PAGE = 50
// Teto do "lote para os filtros aplicados" (design C2): a tela percorre a
// fila com o cursor e mostra N itens/R$ X antes de enviar em blocos de 200.
const LOTE_FILTRO_MAX = 1000
const LOTE_BLOCO = 200

const fmtPct = (v) => (v == null || v === '' ? '—' : `${Number(v).toLocaleString('pt-BR')}%`)

export default function DifalSnFila() {
  const toast = useToast()
  const { companyId, companyName } = useCompany()

  const [items, setItems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [erroLista, setErroLista] = useState(null)

  const [filterUf, setFilterUf] = useState('')
  const [filterCompetencia, setFilterCompetencia] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEmpresa, setFilterEmpresa] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [selected, setSelected] = useState(() => new Set())
  const [expandedId, setExpandedId] = useState(null)

  // Modal: itens em revisão + resultado do lote + erro da chamada.
  const [modalItens, setModalItens] = useState(null)
  const [modalResultados, setModalResultados] = useState(null)
  const [modalErro, setModalErro] = useState(null)
  const [coletandoFiltro, setColetandoFiltro] = useState(false)

  // A competência só vale como filtro quando está completa (AAAAMM).
  const competenciaAtiva = /^\d{6}$/.test(filterCompetencia) ? filterCompetencia : undefined
  const empresaAtiva = filterEmpresa && companyId ? companyId : undefined

  const params = useCallback((cursor) => ({
    status: filterStatus || undefined,
    uf: filterUf || undefined,
    competencia: competenciaAtiva,
    companyId: empresaAtiva,
    limit: PAGE,
    cursor,
  }), [filterStatus, filterUf, competenciaAtiva, empresaAtiva])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setErroLista(null)
    try {
      const data = await api.getDifalSnRevisao(params(undefined))
      setItems(data.items || [])
      setNextCursor(data.next_cursor ?? null)
      setSelected(new Set())
      setExpandedId(null)
    } catch (err) {
      console.error('Failed to load DIFAL-SN queue:', err)
      setErroLista(err.message)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchData() }, [fetchData])

  const loadMore = async () => {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const data = await api.getDifalSnRevisao(params(nextCursor))
      setItems((prev) => [...prev, ...(data.items || [])])
      setNextCursor(data.next_cursor ?? null)
    } catch (err) {
      setErroLista(err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allVisibleSelected = items.length > 0 && items.every((it) => selected.has(it.item_result_id))
  const toggleAll = () => {
    setSelected(allVisibleSelected ? new Set() : new Set(items.map((it) => it.item_result_id)))
  }

  const abrirModal = (itens) => {
    setModalItens(itens)
    setModalResultados(null)
    setModalErro(null)
  }

  const fecharModal = () => {
    setModalItens(null)
    setModalResultados(null)
    setModalErro(null)
  }

  // Itens gravados saem da fila de pendentes; em auditoria (VALIDADO/
  // REJEITADO) só recarrega, porque o item continua visível com outro estado.
  const removerGravados = (ids) => {
    if (filterStatus) {
      fetchData()
      return
    }
    const set = new Set(ids)
    setItems((prev) => prev.filter((it) => !set.has(it.item_result_id)))
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
  }

  const handleSubmit = async ({ estado, valor_conferido, motivo, usar_valor_calculado }) => {
    setModalErro(null)
    try {
      if (modalItens.length === 1) {
        const id = modalItens[0].item_result_id
        await api.validarDifalSnItem(id, { estado, valor_conferido, motivo })
        removerGravados([id])
        fecharModal()
        return
      }
      // Lote: blocos de 200, um 409 não derruba o resto.
      const resultados = []
      for (let i = 0; i < modalItens.length; i += LOTE_BLOCO) {
        const bloco = modalItens.slice(i, i + LOTE_BLOCO)
        const resp = await api.validarDifalSnLote({
          itens: bloco.map((it) => ({ item_result_id: it.item_result_id, estado, motivo })),
          usar_valor_calculado,
        })
        resultados.push(...(resp.resultados || []))
      }
      setModalResultados(resultados)
      removerGravados(resultados.filter((r) => r.status === 200).map((r) => r.item_result_id))
    } catch (err) {
      setModalErro(err.message)
    }
  }

  // "Lote para os filtros aplicados": percorre a fila com os MESMOS filtros
  // até o teto e abre o modal com N itens e a soma — a Célula confirma o
  // que vai validar; o servidor nunca valida "às cegas".
  const abrirLoteFiltro = async () => {
    setColetandoFiltro(true)
    try {
      const todos = []
      let cursor
      while (todos.length < LOTE_FILTRO_MAX) {
        const data = await api.getDifalSnRevisao({ ...params(cursor), limit: LOTE_BLOCO })
        todos.push(...(data.items || []))
        cursor = data.next_cursor
        if (!cursor) break
      }
      // Sem `status` a API só devolve pendentes — é a única vista em que o
      // botão aparece.
      const pendentes = todos.slice(0, LOTE_FILTRO_MAX)
      if (pendentes.length === 0) {
        toast.info('Nenhum item pendente para os filtros aplicados.')
        return
      }
      abrirModal(pendentes)
    } catch (err) {
      toast.error('Erro ao coletar a fila', { description: err.message })
    } finally {
      setColetandoFiltro(false)
    }
  }

  const activeFilters = [filterUf, competenciaAtiva, filterStatus, empresaAtiva].filter(Boolean).length
  const selecionados = items.filter((it) => selected.has(it.item_result_id))
  const somaVisivel = items.reduce((acc, it) => acc + Number(it.total_item || 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-muted">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Fila DIFAL-SN</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Itens do DIFAL do Simples pendentes de validação da Célula (RN-25)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selecionados.length > 0 && (
              <Button
                onClick={() => abrirModal(selecionados)}
                size="sm"
              >
                Validar seleção ({selecionados.length})
              </Button>
            )}
            {!filterStatus && items.length > 0 && (
              <Button
                onClick={abrirLoteFiltro}
                disabled={coletandoFiltro}
                variant="info"
                size="sm"
                title={`Coleta até ${LOTE_FILTRO_MAX} itens com os filtros atuais e pede confirmação`}
              >
                {coletandoFiltro ? 'Coletando...' : 'Validar todo o filtro'}
              </Button>
            )}
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
            onClick={() => { setFilterUf(''); setFilterCompetencia(''); setFilterStatus(''); setFilterEmpresa(false) }}
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'itens'} carregados · {fmtBRL(somaVisivel)}
          {nextCursor ? ' · há mais' : ''}
        </span>
      </div>

      {showFilters && (
        <div className="px-6 py-3 border-b border-border bg-muted flex gap-4 items-center flex-wrap">
          <select
            value={filterUf}
            onChange={(e) => setFilterUf(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">UF destino: Todas</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Competência AAAAMM"
            value={filterCompetencia}
            onChange={(e) => setFilterCompetencia(e.target.value.replace(/\D/g, ''))}
            className="h-9 text-sm bg-card w-44"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Estado: Pendentes</option>
            <option value="PENDENTE_VALIDACAO">Pendente de validação</option>
            <option value="PENDENTE">Pendente</option>
            <option value="VALIDADO">Validado (auditoria)</option>
            <option value="REJEITADO">Rejeitado (auditoria)</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={filterEmpresa} onCheckedChange={(v) => setFilterEmpresa(v === true)} />
            Só a empresa selecionada
          </label>
          {filterEmpresa && <CompanySelector />}
        </div>
      )}

      {erroLista && (
        <div className="mx-6 mt-3 text-sm text-destructive-text bg-destructive-subtle border border-destructive-border rounded-lg p-3">
          {erroLista}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mb-2 text-success-text" />
            <p className="text-sm font-medium">Nenhum item na fila</p>
            <p className="text-xs mt-1">Nada pendente para os filtros aplicados</p>
          </div>
        ) : (
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="px-2 py-2 h-auto">
                  <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="px-2 py-2 h-auto" />
                <TableHead className="px-2 py-2 h-auto font-medium text-muted-foreground uppercase tracking-wide text-xs">NF</TableHead>
                <TableHead className="px-2 py-2 h-auto font-medium text-muted-foreground uppercase tracking-wide text-xs">Empresa</TableHead>
                <TableHead className="px-2 py-2 h-auto font-medium text-muted-foreground uppercase tracking-wide text-xs">UF</TableHead>
                <TableHead className="px-2 py-2 h-auto font-medium text-muted-foreground uppercase tracking-wide text-xs">Compet.</TableHead>
                <TableHead className="px-2 py-2 h-auto font-medium text-muted-foreground uppercase tracking-wide text-xs">Regra</TableHead>
                <TableHead className="px-2 py-2 h-auto font-medium text-muted-foreground uppercase tracking-wide text-xs">Base / variante</TableHead>
                <TableHead className="px-2 py-2 h-auto font-medium text-muted-foreground uppercase tracking-wide text-xs text-right">Valor</TableHead>
                <TableHead className="px-2 py-2 h-auto font-medium text-muted-foreground uppercase tracking-wide text-xs">CFOP</TableHead>
                <TableHead className="px-2 py-2 h-auto font-medium text-muted-foreground uppercase tracking-wide text-xs">Estado</TableHead>
                <TableHead className="px-2 py-2 h-auto font-medium text-muted-foreground uppercase tracking-wide text-xs">Última revisão</TableHead>
                <TableHead className="px-2 py-2 h-auto" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <FilaRow
                  key={it.item_result_id}
                  item={it}
                  empresaNome={it.company_id === companyId ? companyName : null}
                  checked={selected.has(it.item_result_id)}
                  onToggle={() => toggleSelected(it.item_result_id)}
                  expanded={expandedId === it.item_result_id}
                  onExpand={() => setExpandedId(expandedId === it.item_result_id ? null : it.item_result_id)}
                  onValidar={() => abrirModal([it])}
                />
              ))}
            </TableBody>
          </Table>
        )}

        {nextCursor && (
          <div className="flex justify-center py-4">
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              variant="secondary"
            >
              {loadingMore ? 'Carregando...' : 'Carregar mais'}
            </Button>
          </div>
        )}
      </div>

      {modalItens && (
        <ValidacaoDifalModal
          itens={modalItens}
          onClose={fecharModal}
          onSubmit={handleSubmit}
          resultados={modalResultados}
          erro={modalErro}
        />
      )}
    </div>
  )
}

function FilaRow({ item, empresaNome, checked, onToggle, expanded, onExpand, onValidar }) {
  const pendente = (item.revisao_estado || '').startsWith('PENDENTE')
  const regra = item.rule_code
    ? `${item.rule_code}${item.rule_version != null ? `@v${item.rule_version}` : ''}`
    : '—'
  const chave = item.chave_acesso || ''
  const chaveCurta = chave.length > 12 ? `…${chave.slice(-12)}` : chave || `#${item.invoice_id}`

  return (
    <>
      <TableRow className={`${expanded ? 'bg-primary/5 hover:bg-primary/5' : 'hover:bg-muted'}`}>
        <TableCell className="px-2 py-2">
          <Checkbox checked={checked} onCheckedChange={onToggle} disabled={!pendente} />
        </TableCell>
        <TableCell className="px-2 py-2">
          <IconButton onClick={onExpand} aria-label="Memória de cálculo" variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground" title="Memória de cálculo">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </IconButton>
        </TableCell>
        <TableCell className="px-2 py-2 whitespace-nowrap" title={chave}>
          <div className="font-mono text-xs">{chaveCurta}</div>
          <div className="text-xs text-muted-foreground">{item.dt_emissao || ''}</div>
        </TableCell>
        <TableCell className="px-2 py-2">
          {empresaNome ? <span title={`#${item.company_id}`}>{empresaNome}</span> : `#${item.company_id}`}
        </TableCell>
        <TableCell className="px-2 py-2">{item.uf_destino || '—'}</TableCell>
        <TableCell className="px-2 py-2">{item.competencia || '—'}</TableCell>
        <TableCell className="px-2 py-2 font-mono text-xs">
          {regra}
          {item.instituto && <div className="text-muted-foreground">{item.instituto}</div>}
        </TableCell>
        <TableCell className="px-2 py-2 text-xs">
          {item.tipo_base || '—'}{item.variante_deducao ? ` / ${item.variante_deducao}` : ''}
          {item.amostra_zero && <div className="text-muted-foreground">amostra do zero</div>}
        </TableCell>
        <TableCell className="px-2 py-2 text-right font-medium whitespace-nowrap">
          {fmtBRL(item.total_item)}
        </TableCell>
        <TableCell className="px-2 py-2 font-mono text-xs whitespace-nowrap">
          {item.cfop_fornecedor || '?'}→{item.cfop_entrada || '?'}
        </TableCell>
        <TableCell className="px-2 py-2">
          <Badge variant={ESTADO_VARIANTS[item.revisao_estado] || 'secondary'} className="whitespace-nowrap">
            {ESTADO_LABELS[item.revisao_estado] || item.revisao_estado || '—'}
          </Badge>
        </TableCell>
        <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap">
          {item.ultima_review
            ? `${item.ultima_review.estado} · ${item.ultima_review.autor}${item.ultima_review.created_at ? ` · ${item.ultima_review.created_at.slice(0, 10)}` : ''}`
            : '—'}
        </TableCell>
        <TableCell className="px-2 py-2 text-right">
          {pendente && (
            <Button
              onClick={onValidar}
              size="xs"
              className="whitespace-nowrap"
            >
              Validar / Rejeitar
            </Button>
          )}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={13} className="px-4 py-3 bg-muted whitespace-normal">
            <MemoriaCalculo item={item} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// Linha expandida: os componentes do próprio item (já vêm na fila) + a
// memória completa da nota via GET /difal-sn/invoice/{id} (alíquotas, base
// recomposta, regra e versão, procedência, embasamento). O item da nota que
// corresponde à linha é o de mesma regra@versão e mesmo total.
function MemoriaCalculo({ item }) {
  const [nota, setNota] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let cancelled = false
    setNota(null)
    setErro(null)
    api.getDifalSnInvoice(item.invoice_id)
      .then((data) => { if (!cancelled) setNota(data) })
      .catch((err) => { if (!cancelled) setErro(err.message) })
    return () => { cancelled = true }
  }, [item.invoice_id])

  const regraItem = `${item.rule_code}@${item.rule_version}`
  const itemNota = nota?.itens?.find(
    (i) => `${i.rule_code}@${i.rule_version}` === regraItem && Number(i.total_item) === Number(item.total_item)
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
      <div>
        <p className="font-semibold text-foreground mb-1">Componentes do item #{item.item_result_id}</p>
        <table className="w-full">
          <thead>
            <tr className="text-muted-foreground text-left">
              <th className="py-1">Tipo</th>
              <th className="py-1 text-right">Base</th>
              <th className="py-1 text-right">Alíquota</th>
              <th className="py-1 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {(item.componentes || []).map((c, idx) => (
              <tr key={idx} className="border-t border-border">
                <td className="py-1">{c.tipo}</td>
                <td className="py-1 text-right">{c.base != null ? fmtBRL(c.base) : '—'}</td>
                <td className="py-1 text-right">{fmtPct(c.aliquota)}</td>
                <td className="py-1 text-right">{c.valor != null ? fmtBRL(c.valor) : '—'}</td>
              </tr>
            ))}
            {(item.componentes || []).length === 0 && (
              <tr><td colSpan={4} className="py-1 text-muted-foreground">Sem componentes (decisão {item.decision})</td></tr>
            )}
          </tbody>
        </table>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Decisão</dt><dd>{item.decision || '—'}</dd>
          <dt className="text-muted-foreground">Regra</dt><dd className="font-mono">{regraItem}</dd>
          <dt className="text-muted-foreground">Tipo de base</dt><dd>{item.tipo_base || '—'}</dd>
          <dt className="text-muted-foreground">Variante (ICMS origem)</dt><dd>{item.variante_deducao || '—'}</dd>
          <dt className="text-muted-foreground">Sublimite com efeito desde</dt><dd>{item.sublimite_efeito_desde || '—'}</dd>
          {item.procedencia && (
            <>
              <dt className="text-muted-foreground">Procedência</dt>
              <dd>{item.procedencia.tipo || ''} {item.procedencia.ref || ''} {item.procedencia.data || ''}</dd>
            </>
          )}
        </dl>
      </div>
      <div>
        <p className="font-semibold text-foreground mb-1">Memória da nota (etapa 9b)</p>
        {erro && <p className="text-destructive-text">{erro}</p>}
        {!nota && !erro && <p className="text-muted-foreground">Carregando...</p>}
        {nota && (
          <>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
              <dt className="text-muted-foreground">Avaliação</dt><dd>{nota.avaliacao_status} {nota.motivo_principal ? `· ${nota.motivo_principal}` : ''}</dd>
              <dt className="text-muted-foreground">Total da nota</dt><dd>{fmtBRL(nota.total_difal)}</dd>
              <dt className="text-muted-foreground">Run</dt><dd className="font-mono">{nota.run_uuid || '—'}</dd>
              {itemNota && (
                <>
                  <dt className="text-muted-foreground">Finalidade</dt><dd>{itemNota.finalidade || '—'} · {itemNota.modality || '—'}</dd>
                  <dt className="text-muted-foreground">Alíq. interna / interestadual</dt>
                  <dd>{fmtPct(itemNota.aliq_interna)} / {fmtPct(itemNota.aliq_interestadual)}</dd>
                  <dt className="text-muted-foreground">Base recomposta</dt><dd>{itemNota.base_recomposta != null ? fmtBRL(itemNota.base_recomposta) : '—'}</dd>
                  <dt className="text-muted-foreground">Regra hoje</dt>
                  <dd>{itemNota.regra_estado_atual || '—'}{itemNota.desatualizado ? ' (desatualizada)' : ''}</dd>
                  {itemNota.embasamento_legal && (
                    <>
                      <dt className="text-muted-foreground">Embasamento</dt><dd>{itemNota.embasamento_legal}</dd>
                    </>
                  )}
                </>
              )}
            </dl>
            {itemNota?.memoria_calculo && (
              <pre className="mt-2 p-2 bg-card border border-border rounded-lg overflow-auto max-h-48 text-[11px]">
                {JSON.stringify(itemNota.memoria_calculo, null, 2)}
              </pre>
            )}
            {!itemNota && (
              <p className="text-muted-foreground mt-1">
                A nota tem {nota.itens?.length || 0} item(ns) na última run; nenhum casa com esta linha (run anterior?).
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
