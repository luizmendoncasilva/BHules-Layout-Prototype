import { Fragment, useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Badge, Button, Card,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'
import { AlertCircle, ChevronDown, ChevronRight, Info, Loader2, PencilLine, UserCheck } from 'lucide-react'
import { api } from '../../api/client'
import AjusteDifalModal, { DECISOES_DIFAL } from './AjusteDifalModal'

const DECISAO = {
  COLLECT: { label: 'Cobra', variant: 'warning' },
  DO_NOT_COLLECT: { label: 'Não cobra', variant: 'secondary' },
  NOT_ELIGIBLE: { label: 'Não elegível', variant: 'outline' },
  BLOCKED: { label: 'Bloqueado', variant: 'destructive' },
  ELIGIBLE_ZERO: { label: 'Elegível · zero', variant: 'secondary' },
}
const ROTULO_DECISAO = Object.fromEntries(DECISOES_DIFAL.map(([v, l]) => [v, l]))

const ELEGIBILIDADE = {
  ELEGIVEL: 'Elegível',
  REVENDA: 'Revenda',
  FINALIDADE_INDEFINIDA: 'Finalidade indefinida',
  OPERACAO_INTERNA: 'Operação interna',
}

const ROTULO_MEMORIA = {
  finalidade: 'Finalidade',
  uf_origem: 'UF de origem',
  uf_destino: 'UF de destino',
  aliq_interna: 'Alíquota interna (%)',
  aliq_interestadual: 'Alíquota interestadual (%)',
  valor_produto: 'Valor do produto',
  icms_origem: 'ICMS de origem',
  base_recomposta: 'Base recomposta',
  difal: 'DIFAL',
}

const brl = (v) => (v === null || v === undefined || v === '' ? '—'
  : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))

const origem = (item) => item.memoria_calculo?.deducao_origem?.policy || item.variante_deducao || null

function precisaAnalista(item) {
  return (item.decision === 'COLLECT' || item.decision === 'BLOCKED') && !item.revisao
}

function Memoria({ memoria }) {
  const linhas = Object.entries(memoria || {}).filter(([k, v]) => k !== 'deducao_origem' && v !== null && v !== undefined)
  if (linhas.length === 0) return <p className="text-xs text-muted-foreground">Sem memória de cálculo.</p>
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3">
      {linhas.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{ROTULO_MEMORIA[k] || k}</dt>
          <dd className="text-sm font-medium text-foreground tabular-nums">
            {typeof v === 'number' && !k.startsWith('aliq') ? brl(v) : String(v)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default function DifalTab({ invoice }) {
  const queryClient = useQueryClient()
  const [dados, setDados] = useState(null)
  const [semAvaliacao, setSemAvaliacao] = useState(false)
  const [aberto, setAberto] = useState(null)
  const [editando, setEditando] = useState(null)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    try {
      const res = await api.getDifalSnInvoice(invoice.id)
      // Mock devolve NAO_AVALIADA sem itens no lugar do 404 da API.
      if (res?.avaliacao_status === 'NAO_AVALIADA') { setSemAvaliacao(true); return }
      setDados(res)
      setSemAvaliacao(false)
      setErro(null)
    } catch (e) {
      // request() lança Error('API <status>: <corpo>') sem campo .status:
      // 404 = nota sem avaliação; o resto vira aviso.
      if (String(e?.message || '').startsWith('API 404')) setSemAvaliacao(true)
      else setErro('Falha ao carregar o DIFAL da nota. Tente novamente.')
    }
  }, [invoice.id])

  useEffect(() => { carregar() }, [carregar])

  if (erro) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive-border bg-destructive-subtle px-4 py-3 text-sm text-destructive-text">
        <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
        <Button variant="outline" size="sm" className="ml-auto" onClick={carregar}>Tentar de novo</Button>
      </div>
    )
  }
  if (semAvaliacao) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Info className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">Nota sem avaliação de DIFAL do Simples</p>
        <p className="text-xs text-muted-foreground mt-1">Só compras interestaduais de empresas do Simples Nacional passam pelo motor DIFAL-SN.</p>
      </div>
    )
  }
  if (!dados) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando DIFAL…
      </p>
    )
  }

  const itens = dados.itens || []
  const pendentes = itens.filter(precisaAnalista).length
  const total = itens.reduce((acc, i) => {
    const decisao = i.revisao?.decisao_conferida || i.decision
    if (decisao !== 'COLLECT') return acc
    return acc + Number(i.revisao?.valor_conferido ?? i.total_item ?? 0)
  }, 0)

  return (
    <div className="space-y-4">
      {/* Resumo da avaliação */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card padding="none" className="p-4 gap-1">
          <span className="text-xs text-muted-foreground">Avaliação</span>
          <span className="text-sm font-semibold text-foreground">{dados.avaliacao_status}</span>
          {dados.motivo_principal && <span className="text-xs text-muted-foreground">{dados.motivo_principal}</span>}
        </Card>
        <Card padding="none" className="p-4 gap-1">
          <span className="text-xs text-muted-foreground">DIFAL a recolher</span>
          <span className="text-xl font-semibold text-foreground tabular-nums">{brl(total)}</span>
          <span className="text-xs text-muted-foreground">Considera os ajustes do analista</span>
        </Card>
        <Card
          padding="none"
          className={`p-4 gap-1 ${pendentes > 0 ? 'border-warning-border bg-warning-subtle' : 'border-success-border bg-success-subtle'}`}
        >
          <span className={`text-xs ${pendentes > 0 ? 'text-warning-text' : 'text-success-text'}`}>Pendência do analista</span>
          <span className={`text-xl font-semibold tabular-nums ${pendentes > 0 ? 'text-warning-text' : 'text-success-text'}`}>
            {pendentes > 0 ? `${pendentes} ${pendentes === 1 ? 'item' : 'itens'}` : 'Nenhuma'}
          </span>
          <span className={`text-xs ${pendentes > 0 ? 'text-warning-text' : 'text-success-text'}`}>
            {pendentes > 0 ? 'Itens que cobram ou estão bloqueados, sem ajuste' : 'Todos os itens conferidos'}
          </span>
        </Card>
      </div>

      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nota parada antes do cálculo por item ({dados.motivo_principal}).</p>
      ) : (
        <div className="overflow-x-auto border border-border rounded-md">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-8" />
                <TableHead>Item</TableHead>
                <TableHead>Decisão do motor</TableHead>
                <TableHead>Elegibilidade</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">DIFAL</TableHead>
                <TableHead>Regra</TableHead>
                <TableHead>Analista</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((item) => {
                const expandido = aberto === item.item_result_id
                const decisao = DECISAO[item.decision] || { label: item.decision, variant: 'outline' }
                const pol = origem(item)
                return (
                  <Fragment key={item.item_result_id}>
                    <TableRow
                      className={`cursor-pointer ${precisaAnalista(item) ? 'bg-warning-subtle/40' : ''}`}
                      onClick={() => setAberto(expandido ? null : item.item_result_id)}
                    >
                      <TableCell className="text-muted-foreground">
                        {expandido ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">#{item.invoice_item_id}</div>
                        {item.descricao && <div className="text-muted-foreground max-w-[220px] truncate" title={item.descricao}>{item.descricao}</div>}
                      </TableCell>
                      <TableCell><Badge variant={decisao.variant}>{decisao.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{ELEGIBILIDADE[item.eligibility_status] || item.eligibility_status}</TableCell>
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {brl(item.base_original)}
                        {item.base_recomposta && <div className="text-muted-foreground">→ {brl(item.base_recomposta)}</div>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground whitespace-nowrap">{brl(item.total_item)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.rule_code ? (
                          <>
                            <div className="font-mono text-foreground">{item.rule_code} <span className="text-muted-foreground">v{item.rule_version}</span></div>
                            {pol && <div className="text-muted-foreground">{pol}</div>}
                          </>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell title={item.revisao?.motivo || undefined}>
                        {item.revisao ? (
                          <div>
                            <div className="flex items-center gap-1 font-medium text-foreground">
                              <UserCheck className="w-3.5 h-3.5 text-success-text" />
                              {ROTULO_DECISAO[item.revisao.decisao_conferida] || item.revisao.decisao_conferida}
                              {item.revisao.valor_conferido && <span className="tabular-nums"> · {brl(item.revisao.valor_conferido)}</span>}
                            </div>
                            <div className="text-muted-foreground truncate max-w-[200px]">{item.revisao.autor || item.revisao.estado}</div>
                          </div>
                        ) : precisaAnalista(item) ? (
                          <Badge variant="warning">Pendente</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={precisaAnalista(item) ? 'default' : 'outline'}
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setEditando(item) }}
                        >
                          <PencilLine className="w-3.5 h-3.5" /> Ajustar
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandido && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={9} className="bg-muted/50 px-6 py-4">
                          <p className="text-xs font-semibold text-foreground mb-3">Memória de cálculo</p>
                          <Memoria memoria={item.memoria_calculo} />
                          {item.revisao?.motivo && (
                            <p className="mt-3 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Motivo do ajuste:</span> {item.revisao.motivo}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {editando && (
        <AjusteDifalModal
          item={editando}
          onClose={() => setEditando(null)}
          onSave={async (body) => {
            await api.ajustarDifalSnItem(editando.item_result_id, body)
            // A pendência mudou: a listagem (coluna/filtro) e o detalhe da nota
            // (selo do cabeçalho) relêem; a aba recarrega o próprio payload.
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] })
            await carregar()
          }}
        />
      )}
    </div>
  )
}
