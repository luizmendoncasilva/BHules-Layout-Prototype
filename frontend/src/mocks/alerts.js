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
  'Comercializacao de cosmeticos importados - linha facial',
  'Revenda de bebidas alcoolicas - lote 2026',
  'Fios sinteticos para tecelagem industrial',
  'Chapas de aco carbono laminado a frio',
  'Medicamentos de tarja preta - controlados',
  'Servicos de terraplanagem e fundacao',
  'Frete rodoviario intermunicipal de carga',
  'Licenca de software sob demanda',
]

function buildDetails(type, i) {
  if (type === 'DIVERGENCIA_CRITICA') {
    return [
      { campo: 'CST ICMS', emitente: '060', sugerido: '010' },
      { campo: 'Aliquota ICMS', emitente: `${(12 + (i % 6))}%`, sugerido: `${(18 + (i % 4))}%` },
    ]
  }
  if (type === 'VALIDACAO_BLOQUEANTE') {
    return [
      'CFOP incompativel com a natureza da operacao declarada',
      'CNPJ do emitente inativo na Receita Federal no momento da emissao',
    ]
  }
  if (type === 'CONFIANCA_BAIXA') {
    return `Modelo de classificacao retornou confianca de ${(45 + (i % 15))}% para o CFOP sugerido — abaixo do limiar de escrituracao automatica (62%).`
  }
  // IMPACTO_FINANCEIRO_ALTO
  return `Divergencia estimada de R$ ${(2800 + i * 415.3).toFixed(2)} entre o ICMS destacado e o ICMS recalculado pelo motor.`
}

const ALERTS = Array.from({ length: 15 }, (_, i) => {
  const type = TYPES[i % TYPES.length]
  const day = 1 + (i % 27)
  const month = 5 + (i % 3)
  return {
    type,
    invoice_id: 20000 + i * 11,
    company: ALERT_COMPANY_NAMES[i % ALERT_COMPANY_NAMES.length],
    details: buildDetails(type, i),
    item_desc: ITEM_DESCRIPTIONS[i % ITEM_DESCRIPTIONS.length],
    timestamp: `2026-0${month}-${String(day).padStart(2, '0')}T${String(8 + (i % 12)).padStart(2, '0')}:${String(5 + i * 3).padStart(2, '0')}:00Z`,
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
