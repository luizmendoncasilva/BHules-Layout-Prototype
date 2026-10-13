import { mockRoute, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'
import { getInvoiceById } from './invoices'

// Fixture complementar de NFS-e:
//  - Conferência (NfseConferencia, dentro do NfseDashboard): caça ao
//    falso-negativo direcional (nota declara retenção, motor não esperava) +
//    amostra aleatória de CONFORMEs para conferência humana;
//  - agrupamento de NFS-e PRESTADAS por código de serviço (Notas Integradas),
//    com a chave canônica já derivada ("17.06" e "1706" são o mesmo grupo);
//  - benchmark do motor de retenções e estatística de feedback por tributo
//    (painéis do NfseDashboard).
// O GET /nfse/validation/dashboard/stats continua em escrituracao.js.

function money(n) {
  return Number(Number(n).toFixed(2))
}

// Notas NFS-e do fixture de invoices: 9/10/39/40 prestadas, 11/12/41/42 tomadas.
const NFSE_TOMADAS = [11, 12, 41, 42]
const NFSE_TODAS = [9, 10, 11, 12, 39, 40, 41, 42]

// Pool determinístico p/ a amostra (ids que existem no fixture de invoices).
let sorteio = 7
function proximo(max) {
  sorteio = (sorteio * 1103515245 + 12345) & 0x7fffffff
  return sorteio % max
}

// ─────────────────────────────────────────────────────────────────────────
// Conferência NFS-e
// ─────────────────────────────────────────────────────────────────────────
const DIVERGENCIAS = [
  [{ tributo: 'irrf', nota_declara: 225.0, motor_esperava: 0 }, { tributo: 'pcc', nota_declara: 697.5, motor_esperava: 0 }],
  [{ tributo: 'inss', nota_declara: 1650.0, motor_esperava: null }],
  [{ tributo: 'iss', nota_declara: 412.8, motor_esperava: 0 }],
  [{ tributo: 'pcc', nota_declara: 139.5, motor_esperava: 0 }],
  [{ tributo: 'irrf', nota_declara: 72.0, motor_esperava: 0 }, { tributo: 'iss', nota_declara: 240.0, motor_esperava: 0 }],
]
const CODIGOS = ['17.19', '11.02', '07.10', '17.01', '01.07']

mockRoute(/^\/nfse\/conferencia$/, 'GET', (path) => {
  const p = paramsOf(path)
  const sampleSize = Math.min(Number(p.get('sample_size')) || 10, 20)

  // Falso-negativo direcional: só faz sentido nas TOMADAS (retenção na fonte).
  const ids = [...NFSE_TOMADAS, 30, 47]
  const fnItems = ids.map((id, i) => {
    const inv = getInvoiceById(id)
    return {
      invoice_id: inv.id,
      num_doc: inv.num_doc,
      emit_razao_social: inv.emit_razao_social,
      emit_cnpj: inv.emit_cnpj,
      codigo_servico_lc116: CODIGOS[i % CODIGOS.length],
      status_analise: i === 1 ? 'PENDENTE' : (inv.status_analise === 'CONFORME' ? 'REQUER_REVISAO' : inv.status_analise),
      divergencias: DIVERGENCIAS[i % DIVERGENCIAS.length],
    }
  })

  // Amostra: sorteio novo a cada chamada ("Novo sorteio").
  const conformes = []
  for (let id = 1; id <= 60; id++) {
    if (getInvoiceById(id).status_analise === 'CONFORME') conformes.push(id)
  }
  const pool = [...new Set([...NFSE_TODAS.filter((id) => !NFSE_TOMADAS.includes(id)), ...conformes])]
  const escolhidos = new Set()
  while (escolhidos.size < Math.min(sampleSize, pool.length)) escolhidos.add(pool[proximo(pool.length)])
  const amostra = [...escolhidos].map((id) => {
    const inv = getInvoiceById(id)
    return { invoice_id: inv.id, num_doc: inv.num_doc, emit_razao_social: inv.emit_razao_social }
  })

  return {
    company_id: Number(p.get('company_id')) || null,
    fn_risk: { total: fnItems.length, items: fnItems },
    amostra_conforme: { total_conformes: 214, sample_size: sampleSize, items: amostra },
  }
})

// ─────────────────────────────────────────────────────────────────────────
// NFS-e prestadas agrupadas por código de serviço (read-only)
// ─────────────────────────────────────────────────────────────────────────
const GRUPOS = [
  {
    chave: 'SEM_CODIGO', tipo: 'SEM_CODIGO', rotulo: null, notas: 1284, valor_total: 3821940.55, empresas: 6,
    formatos_origem: [{ valor_cru: null, notas: 1284, api_sources: ['DOMINIO', 'UNECONT'] }],
    sinais: ['SEM_CODIGO'],
  },
  {
    chave: '01.07', tipo: 'LC116', rotulo: 'Suporte técnico em informática, inclusive instalação e manutenção de programas',
    notas: 642, valor_total: 2318450.0, empresas: 4,
    formatos_origem: [
      { valor_cru: '01.07', notas: 401, api_sources: ['JETTAX'] },
      { valor_cru: '0107', notas: 241, api_sources: ['DOMINIO'] },
    ],
    sinais: ['FORMATO_MISTO'],
  },
  {
    chave: '17.06', tipo: 'LC116', rotulo: 'Propaganda e publicidade, inclusive planejamento de campanhas',
    notas: 318, valor_total: 954210.4, empresas: 3,
    formatos_origem: [
      { valor_cru: '17.06', notas: 190, api_sources: ['JETTAX'] },
      { valor_cru: '1706', notas: 128, api_sources: ['DOMINIO', 'SIEG'] },
    ],
    sinais: ['FORMATO_MISTO'],
  },
  {
    chave: '17.01', tipo: 'LC116', rotulo: 'Assessoria ou consultoria de qualquer natureza',
    notas: 276, valor_total: 1102300.0, empresas: 5,
    formatos_origem: [{ valor_cru: '17.01', notas: 276, api_sources: ['JETTAX', 'DOMINIO'] }],
    sinais: [],
  },
  {
    chave: '07.02', tipo: 'LC116', rotulo: 'Execução, por administração ou empreitada, de obras de construção civil',
    notas: 88, valor_total: 2045800.0, empresas: 1,
    formatos_origem: [{ valor_cru: '7.02', notas: 88, api_sources: ['DOMINIO'] }],
    sinais: [],
  },
  {
    chave: '01.03', tipo: 'LC116', rotulo: 'Processamento, armazenamento ou hospedagem de dados',
    notas: 154, valor_total: 388720.9, empresas: 2,
    formatos_origem: [{ valor_cru: '01.03', notas: 154, api_sources: ['JETTAX'] }],
    sinais: ['SEM_REGRA_ANEXO'],
  },
  {
    chave: '10.05', tipo: 'LC116', rotulo: 'Agenciamento, corretagem ou intermediação de bens móveis ou imóveis',
    notas: 61, valor_total: 142600.0, empresas: 1,
    formatos_origem: [{ valor_cru: '10.05', notas: 61, api_sources: ['UNECONT'] }],
    sinais: [],
  },
  {
    chave: '04.03', tipo: 'LC116', rotulo: 'Hospitais, clínicas, laboratórios, sanatórios e congêneres',
    notas: 47, valor_total: 213400.0, empresas: 1,
    formatos_origem: [{ valor_cru: '04.03', notas: 47, api_sources: ['DOMINIO'] }],
    sinais: ['SEM_REGRA_ANEXO'],
  },
  {
    chave: 'MUNICIPAL:010701', tipo: 'MUNICIPAL', rotulo: null, notas: 93, valor_total: 276500.0, empresas: 2,
    formatos_origem: [{ valor_cru: '010701', notas: 93, api_sources: ['DOMINIO'] }],
    sinais: ['NAO_LC116'],
  },
  {
    chave: 'MUNICIPAL:2690', tipo: 'MUNICIPAL', rotulo: null, notas: 34, valor_total: 58720.0, empresas: 1,
    formatos_origem: [{ valor_cru: '2690', notas: 34, api_sources: ['UNECONT'] }],
    sinais: ['NAO_LC116'],
  },
]

mockRoute(/^\/invoices\/nfse-prestados\/grupos$/, 'GET', (path) => {
  const p = paramsOf(path)
  const tipo = p.get('tipo')
  const sinal = p.get('sinal')
  const orderBy = p.get('order_by') || 'notas'
  const page = Number(p.get('page')) || 1
  const size = Number(p.get('page_size')) || 50
  const companyIds = (p.get('company_ids') || '').split(',').filter(Boolean)
  // Filtro por empresa: escala os números para a fração das empresas pedidas.
  const fator = companyIds.length ? Math.min(1, companyIds.length / MOCK_COMPANIES.length + 0.15) : 1
  let grupos = GRUPOS
    .filter((g) => !tipo || g.tipo === tipo)
    .filter((g) => !sinal || (g.sinais || []).includes(sinal))
    .map((g) => ({
      ...g,
      notas: Math.max(1, Math.round(g.notas * fator)),
      valor_total: money(g.valor_total * fator),
      empresas: companyIds.length ? Math.min(g.empresas, companyIds.length) : g.empresas,
      formatos_origem: g.formatos_origem.map((f) => ({ ...f, notas: Math.max(1, Math.round(f.notas * fator)) })),
    }))
  grupos = grupos.sort((a, b) => (orderBy === 'valor' || orderBy === 'valor_total' ? b.valor_total - a.valor_total : b.notas - a.notas))
  const start = (page - 1) * size
  return {
    grupos: grupos.slice(start, start + size),
    total: grupos.length,
    page,
    page_size: size,
    resumo: {
      grupos_lc116: grupos.filter((g) => g.tipo === 'LC116').length,
      grupos_municipais: grupos.filter((g) => g.tipo === 'MUNICIPAL').length,
      notas: grupos.reduce((a, g) => a + g.notas, 0),
      valor_total: money(grupos.reduce((a, g) => a + g.valor_total, 0)),
      grupos_formato_misto: grupos.filter((g) => (g.sinais || []).includes('FORMATO_MISTO')).length,
    },
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Benchmark do motor de retenções × ground truth (NfseDashboard)
// ─────────────────────────────────────────────────────────────────────────
mockRoute(/^\/invoices\/nfse-benchmark$/, 'POST', (path) => {
  const limit = Number(paramsOf(path).get('limit')) || 500
  const total = Math.min(limit, 487)
  return {
    total,
    errors: 3,
    irrf: { accuracy: 97.3, recall: 96.1, precision: 98.4, fn: 4 },
    pcc: { accuracy: 95.8, recall: 93.2, precision: 97.9, fn: 7 },
    inss: { accuracy: 91.4, recall: 84.6, precision: 95.0, fn: 9 },
    iss: { accuracy: 88.9, recall: 79.3, precision: 92.7, fn: 14 },
    false_negatives: [
      { invoice_id: 11, tax: 'INSS', human_value: '1650.00', engine_value: '0.00', service_code: '07.10', regime: 'LUCRO_PRESUMIDO' },
      { invoice_id: 12, tax: 'ISS', human_value: '412.80', engine_value: '0.00', service_code: '11.02', regime: 'SIMPLES_NACIONAL' },
      { invoice_id: 41, tax: 'PCC', human_value: '139.50', engine_value: '0.00', service_code: '17.01', regime: 'LUCRO_REAL' },
      { invoice_id: 42, tax: 'IRRF', human_value: '72.00', engine_value: '0.00', service_code: '17.19', regime: 'LUCRO_PRESUMIDO' },
      { invoice_id: 30, tax: 'ISS', human_value: '240.00', engine_value: '0.00', service_code: '07.02', regime: 'LUCRO_PRESUMIDO' },
      { invoice_id: 47, tax: 'INSS', human_value: '880.00', engine_value: '0.00', service_code: '11.02', regime: 'SIMPLES_NACIONAL' },
    ],
  }
})

// Acurácia do motor por tributo segundo o feedback dos analistas.
mockRoute(/^\/invoices\/nfse-feedback\/stats$/, 'GET', () => [
  { tributo: 'irrf', total: 312, correct: 301, accuracy_pct: 96.5 },
  { tributo: 'pcc', total: 298, correct: 281, accuracy_pct: 94.3 },
  { tributo: 'inss', total: 141, correct: 122, accuracy_pct: 86.5 },
  { tributo: 'iss', total: 266, correct: 229, accuracy_pct: 86.1 },
])
