// Fixtures para o Painel de Alertas (src/components/alerts/AlertsPanel.jsx).
// TYPE_CONFIG no componente só reconhece DIVERGENCIA_CRITICA,
// CONFIANCA_BAIXA, VALIDACAO_BLOQUEANTE e IMPACTO_FINANCEIRO_ALTO — usamos
// exatamente esses valores (maiúsculas), não os nomes "genéricos" do
// contrato original. `details` muda de forma conforme o tipo: array de
// {campo,emitente,sugerido} para DIVERGENCIA_CRITICA, array de strings para
// VALIDACAO_BLOQUEANTE, string simples para os demais.
import { mockRoute, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

const ALERT_COMPANY_NAMES = MOCK_COMPANIES.filter((c) => c.ativo).map((c) => c.razao_social)

const TYPES = ['DIVERGENCIA_CRITICA', 'CONFIANCA_BAIXA', 'VALIDACAO_BLOQUEANTE', 'IMPACTO_FINANCEIRO_ALTO']

const ITEM_DESCRIPTIONS = [
  'Comercialização de cosméticos importados - linha facial',
  'Revenda de bebidas alcoólicas - lote 2026',
  'Fios sintéticos para tecelagem industrial',
  'Chapas de aço carbono laminado a frio',
  'Medicamentos de tarja preta - controlados',
  'Serviços de terraplanagem e fundação',
  'Frete rodoviário intermunicipal de carga',
  'Licença de software sob demanda',
]

function buildDetails(type, i) {
  if (type === 'DIVERGENCIA_CRITICA') {
    return [
      { campo: 'CST ICMS', emitente: '060', sugerido: '010' },
      { campo: 'Alíquota ICMS', emitente: `${(12 + (i % 6))}%`, sugerido: `${(18 + (i % 4))}%` },
    ]
  }
  if (type === 'VALIDACAO_BLOQUEANTE') {
    return [
      'CFOP incompatível com a natureza da operação declarada',
      'CNPJ do emitente inativo na Receita Federal no momento da emissão',
    ]
  }
  if (type === 'CONFIANCA_BAIXA') {
    return `O modelo de classificação retornou ${(45 + (i % 15))}% de confiança para o CFOP sugerido, abaixo do limiar de escrituração automática (62%).`
  }
  // IMPACTO_FINANCEIRO_ALTO
  const valor = (2800 + i * 415.3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return `Diferença estimada de ${valor} entre o ICMS destacado e o ICMS recalculado pelo motor.`
}

const ALERTS = Array.from({ length: 15 }, (_, i) => {
  const type = TYPES[i % TYPES.length]
  // Datas relativas a agora (de minutos a ~12 dias atrás), para o painel
  // sempre ter alertas de hoje, ontem e da semana.
  const horasAtras = [0.2, 1.5, 3, 7, 20, 26, 30, 49, 52, 75, 100, 130, 170, 230, 290][i]
  // Notas que existem no fixture de invoices (ids 1–60), para "Abrir nota" funcionar.
  const invoiceId = 1 + ((i * 7) % 60)
  return {
    type,
    invoice_id: invoiceId,
    num_doc: String(100000 + invoiceId),
    company: ALERT_COMPANY_NAMES[i % ALERT_COMPANY_NAMES.length],
    details: buildDetails(type, i),
    item_desc: ITEM_DESCRIPTIONS[i % ITEM_DESCRIPTIONS.length],
    timestamp: new Date(Date.now() - horasAtras * 3600_000).toISOString(),
  }
}).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

mockRoute(/^\/alerts\/recent$/, 'GET', (path) => {
  const params = paramsOf(path)
  const limit = Number(params.get('limit')) || 50
  return ALERTS.slice(0, limit)
})

mockRoute('/alerts/stats', 'GET', () => {
  const byType = {}
  for (const a of ALERTS) {
    byType[a.type] = (byType[a.type] || 0) + 1
  }
  return { total: ALERTS.length, by_type: byType }
})
