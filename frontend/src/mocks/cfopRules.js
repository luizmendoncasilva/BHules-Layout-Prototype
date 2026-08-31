import { mockRoute, paginate, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

// Enums reais lidos por src/components/rules/CfopOperationRules.jsx:
// escopo é INTERNA|INTERESTADUAL|INTERNACIONAL (não "estadual/nacional"),
// processamento é AUTOMATICO|MANUAL (maiúsculas), e a regra tem `empresa_id`
// singular (null = global) + `descricao`, não um array `empresa_ids`.
const CATEGORIAS = ['VENDA', 'COMPRA', 'DEVOLUCAO', 'TRANSFERENCIA', 'REMESSA_INDUSTRIALIZACAO']
const ESCOPOS = ['INTERNA', 'INTERESTADUAL', 'INTERNACIONAL']
const DESCRICOES = {
  VENDA: 'Venda de mercadoria adquirida/produzida pelo estabelecimento',
  COMPRA: 'Compra para comercialização ou industrialização',
  DEVOLUCAO: 'Devolução de venda ou compra anterior',
  TRANSFERENCIA: 'Transferência entre filiais/estabelecimentos do mesmo grupo',
  REMESSA_INDUSTRIALIZACAO: 'Remessa para industrialização por encomenda',
}

function buildRules() {
  const list = []
  for (let i = 0; i < 25; i++) {
    const escopo = ESCOPOS[i % ESCOPOS.length]
    const categoria = CATEGORIAS[i % CATEGORIAS.length]
    const saidaBase = 5000 + (i % 10) * 100
    const entradaBase = 1000 + (i % 10) * 100
    const isGlobal = i % 4 !== 0
    list.push({
      id: i + 1,
      categoria,
      cfop_saida: String(saidaBase + (escopo === 'INTERESTADUAL' ? 1000 : 0)),
      cfop_entrada: String(entradaBase + (escopo === 'INTERESTADUAL' ? 1000 : 0)),
      escopo,
      processamento: i % 3 === 0 ? 'MANUAL' : 'AUTOMATICO',
      ativo: i % 6 !== 5,
      descricao: DESCRICOES[categoria],
      empresa_id: isGlobal ? null : MOCK_COMPANIES[i % MOCK_COMPANIES.length].id,
    })
  }
  return list
}

const RULES = buildRules()

mockRoute('/cfop-rules', 'GET', (path) => {
  const params = paramsOf(path)
  let items = RULES
  const categoria = params.get('categoria')
  const escopo = params.get('escopo')
  const processamento = params.get('processamento')
  const ativo = params.get('ativo')
  const empresaId = params.get('empresa_id')
  const search = (params.get('search') || '').toLowerCase()
  if (categoria) items = items.filter((r) => r.categoria === categoria)
  if (escopo) items = items.filter((r) => r.escopo === escopo)
  if (processamento) items = items.filter((r) => r.processamento === processamento)
  if (ativo !== null && ativo !== '') items = items.filter((r) => String(r.ativo) === ativo)
  if (empresaId) items = items.filter((r) => r.empresa_id === null || String(r.empresa_id) === empresaId)
  if (search) {
    items = items.filter(
      (r) => r.cfop_saida.includes(search) || r.cfop_entrada.includes(search) || r.categoria.toLowerCase().includes(search),
    )
  }
  return paginate(items, params.get('page'), params.get('page_size'))
})

mockRoute(/^\/cfop-rules\/(\d+)$/, 'GET', (path, match) => {
  const id = Number(match[1])
  return RULES.find((r) => r.id === id) || RULES[0]
})

mockRoute('/cfop-rules', 'POST', () => ({ ok: true }))
mockRoute(/^\/cfop-rules\/(\d+)$/, 'PUT', () => ({ ok: true }))
mockRoute(/^\/cfop-rules\/(\d+)$/, 'DELETE', () => ({ ok: true }))
mockRoute('/cfop-rules/seed', 'POST', () => ({ ok: true }))

mockRoute('/cfop-rules/match/test', 'GET', () => ({
  matched: true,
  rule_id: 3,
  cfop_entrada: '1102',
}))

mockRoute('/cfop-rules/stats', 'GET', () => ({
  total: RULES.length,
  ativas: RULES.filter((r) => r.ativo).length,
  automaticas: RULES.filter((r) => r.processamento === 'AUTOMATICO').length,
}))

// Nota: api.getRulesCatalog() (usado por src/hooks/useRules.js) não tem
// endpoint correspondente em src/api/client.js — não há rota real (`/rules...`)
// para espelhar aqui. Deixado sem handler; ver relatório para follow-up.
