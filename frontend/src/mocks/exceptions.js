// Fixtures para a Fila de Exceções (src/components/exceptions/ExceptionQueue.jsx
// e ResolveModal.jsx). Campos seguem exatamente o que os componentes leem:
// status/prioridade em MAIÚSCULAS (PENDENTE/EM_ANALISE/...), tipo_excecao
// (não "tipo"), descricao, invoice_id, analista_responsavel, justificativa,
// data_limite (usado para calcular SLA violado no client). getExceptions()
// em api/client.js envia limit/offset — o handler de /exceptions/ devolve
// a forma paginada {items, total, page, page_size, total_pages} (via
// paginate()) para alimentar o <Pagination/> do componente.
import { mockRoute, paramsOf, paginate } from './registry'

const EXCEPTION_COMPANY_IDS = [1, 2, 3, 4, 5, 6]

const STATUSES = ['PENDENTE', 'EM_ANALISE', 'APROVAR_OVERRIDE', 'BLOQUEAR_CONFIRMADO', 'CORRIGIR', 'DEVOLVER_FORNECEDOR']
const PRIORIDADES = ['ALTA', 'MEDIA', 'BAIXA']
const TIPOS = ['REVISAO_FISCAL', 'ST_FALTANTE', 'BLOQUEIO_FORNECEDOR', 'DIVERGENCIA_CALCULO', 'FINALIDADE_INDETERMINADA', 'CONFIABILIDADE_BAIXA']
const ANALISTAS = ['Marina Souza', 'Carlos Andrade', 'Fernanda Lima', null, null]

const DESCRICOES = {
  REVISAO_FISCAL: 'Classificação fiscal da NF diverge do padrão histórico do fornecedor — necessária revisão manual antes da escrituração.',
  ST_FALTANTE: 'Nota fiscal com CFOP de venda sujeita à ST, porém sem destaque do ICMS-ST no XML.',
  BLOQUEIO_FORNECEDOR: 'Fornecedor consta na lista de bloqueio por CNPJ irregular junto à Receita Federal.',
  DIVERGENCIA_CALCULO: 'Valor do ICMS calculado pelo motor diverge em mais de 5% do valor destacado na NF.',
  FINALIDADE_INDETERMINADA: 'Não foi possível determinar a finalidade da operação (uso/consumo, revenda ou ativo imobilizado) a partir do NCM/CFOP informados.',
  CONFIABILIDADE_BAIXA: 'Confiança do modelo de classificação abaixo do limiar mínimo (62%) para escrituração automática.',
}

const EXCEPTIONS = Array.from({ length: 18 }, (_, i) => {
  const companyId = EXCEPTION_COMPANY_IDS[i % EXCEPTION_COMPANY_IDS.length]
  const status = STATUSES[i % STATUSES.length]
  const isOpen = status === 'PENDENTE' || status === 'EM_ANALISE'
  const tipo = TIPOS[i % TIPOS.length]
  const day = 1 + (i % 27)
  const month = 5 + (i % 3)
  const createdAt = `2026-0${month}-${String(day).padStart(2, '0')}T${String(8 + (i % 10)).padStart(2, '0')}:${String(10 + i).padStart(2, '0')}:00Z`
  // Prazo de SLA: itens ainda abertos com prazo já vencido (antes de hoje,
  // 2026-07-31) simulam violação — só nos primeiros abertos, para
  // stats.sla_violado bater com 3.
  const slaLimite = isOpen && i % 5 === 0
    ? '2026-07-15T23:59:59Z'
    : `2026-08-${String(5 + (i % 20)).padStart(2, '0')}T23:59:59Z`

  return {
    id: i + 1,
    status,
    tipo_excecao: tipo,
    prioridade: PRIORIDADES[i % PRIORIDADES.length],
    company_id: companyId,
    invoice_id: 10000 + i * 7,
    invoice_item_id: i % 4 === 0 ? null : 100000 + i * 3,
    rule_code: `RGR-${String(100 + (i % 12)).padStart(3, '0')}`,
    descricao: DESCRICOES[tipo],
    impacto_financeiro: i % 3 === 0 ? null : Number((350 + i * 87.4).toFixed(2)),
    analista_responsavel: isOpen ? ANALISTAS[i % ANALISTAS.length] : (ANALISTAS.find(Boolean) || 'Marina Souza'),
    justificativa: isOpen ? null : 'Valor confirmado com o setor fiscal do cliente; correção aplicada na próxima escrituração.',
    data_limite: slaLimite,
    created_at: createdAt,
    analista: isOpen ? ANALISTAS[i % ANALISTAS.length] : (ANALISTAS.find(Boolean) || 'Marina Souza'),
  }
})

function isSlaViolado(item) {
  const isOpen = item.status === 'PENDENTE' || item.status === 'EM_ANALISE'
  return Boolean(isOpen && item.data_limite && new Date(item.data_limite) < new Date('2026-07-31T12:00:00Z'))
}

mockRoute(/^\/exceptions\/$/, 'GET', (path) => {
  const params = paramsOf(path)
  const companyId = params.get('company_id')
  const status = params.get('status')
  const tipo = params.get('tipo')
  const prioridade = params.get('prioridade')
  const slaViolado = params.get('sla_violado')
  const limit = Number(params.get('limit')) || 50
  const offset = Number(params.get('offset')) || 0

  let filtered = EXCEPTIONS
  if (companyId) filtered = filtered.filter((e) => String(e.company_id) === String(companyId))
  if (status) filtered = filtered.filter((e) => e.status === status)
  if (tipo) filtered = filtered.filter((e) => e.tipo_excecao === tipo)
  if (prioridade) filtered = filtered.filter((e) => e.prioridade === prioridade)
  if (slaViolado === 'true') filtered = filtered.filter(isSlaViolado)

  // limit/offset -> page/pageSize para reaproveitar o helper paginate().
  const pageSize = limit
  const page = Math.floor(offset / limit) + 1
  return paginate(filtered, page, pageSize)
})

mockRoute(/^\/exceptions\/stats$/, 'GET', (path) => {
  const params = paramsOf(path)
  const companyId = params.get('company_id')
  let filtered = EXCEPTIONS
  if (companyId) filtered = filtered.filter((e) => String(e.company_id) === String(companyId))

  const pendentes = filtered.filter((e) => e.status === 'PENDENTE').length
  const emAnalise = filtered.filter((e) => e.status === 'EM_ANALISE').length
  const resolvidas = filtered.filter((e) => e.status !== 'PENDENTE' && e.status !== 'EM_ANALISE').length
  const slaViolado = filtered.filter(isSlaViolado).length

  return {
    total: filtered.length,
    pendentes,
    em_analise: emAnalise,
    resolvidas,
    sla_violado: slaViolado,
  }
})

mockRoute(/^\/exceptions\/(\d+)\/assign$/, 'POST', () => ({ ok: true }))

mockRoute(/^\/exceptions\/(\d+)\/resolve$/, 'POST', () => ({ ok: true }))
