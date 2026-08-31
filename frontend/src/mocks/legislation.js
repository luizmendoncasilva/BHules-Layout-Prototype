// Fixtures para Legislação (Crawler Dashboard + Tax Table Alerts). Campos
// seguem exatamente o que src/components/legislation/CrawlerDashboard.jsx e
// TaxTableAlertsPanel.jsx leem da resposta (não o nome "ideal" da API).
import { mockRoute, paginate, paramsOf } from './registry'

const SOURCES = [
  {
    id: 1,
    name: 'Diário Oficial da União - CONFAZ',
    source_type: 'FEDERAL',
    scope: 'NFE',
    data_categories: ['CFOP', 'NCM'],
    business_impact: 'CFOP,NCM',
    enabled: true,
    articles_count: 340,
    embedded_count: 310,
    last_crawled_at: '2026-07-29T08:12:00Z',
    next_run_at: '2026-08-01T06:00:00Z',
  },
  {
    id: 2,
    name: 'SEFAZ-SP Legislação ICMS',
    source_type: 'ESTADUAL',
    scope: 'NFE',
    data_categories: ['CST_ICMS'],
    business_impact: 'CST_ICMS',
    enabled: true,
    articles_count: 210,
    embedded_count: 180,
    last_crawled_at: '2026-07-30T11:40:00Z',
    next_run_at: '2026-08-02T06:00:00Z',
  },
  {
    id: 3,
    name: 'Receita Federal - IN RFB PIS/COFINS',
    source_type: 'FEDERAL',
    scope: 'NFE',
    data_categories: ['CST_PIS', 'CST_COFINS'],
    business_impact: 'CST_PIS,CST_COFINS',
    enabled: true,
    articles_count: 150,
    embedded_count: 150,
    last_crawled_at: '2026-07-25T09:05:00Z',
    next_run_at: '2026-08-04T06:00:00Z',
  },
  {
    id: 4,
    name: 'Portal COTEPE/CONFAZ - Protocolos ST',
    source_type: 'FEDERAL',
    scope: 'NFE',
    data_categories: ['NCM', 'CFOP'],
    business_impact: 'CFOP,NCM',
    enabled: false,
    articles_count: 95,
    embedded_count: 40,
    last_crawled_at: '2026-06-18T14:22:00Z',
    next_run_at: null,
  },
  {
    id: 5,
    name: 'Prefeitura de São Paulo - Legislação ISS',
    source_type: 'MUNICIPAL',
    scope: 'NFSE',
    data_categories: ['ISS', 'CPOM'],
    business_impact: 'ISS,CPOM',
    enabled: true,
    articles_count: 120,
    embedded_count: 120,
    last_crawled_at: '2026-07-28T10:00:00Z',
    next_run_at: '2026-08-01T06:00:00Z',
  },
  {
    id: 6,
    name: 'Receita Federal - IN IRRF/INSS',
    source_type: 'FEDERAL',
    scope: 'NFSE',
    data_categories: ['IRRF', 'INSS'],
    business_impact: 'IRRF,INSS',
    enabled: true,
    articles_count: 180,
    embedded_count: 160,
    last_crawled_at: '2026-07-31T07:30:00Z',
    next_run_at: '2026-08-03T06:00:00Z',
  },
  {
    id: 7,
    name: 'eSocial/Reinf - Manual de Orientação',
    source_type: 'FEDERAL',
    scope: 'NFSE',
    data_categories: ['REINF', 'DCTFWEB'],
    business_impact: 'REINF,DCTFWEB',
    enabled: true,
    articles_count: 75,
    embedded_count: 60,
    last_crawled_at: '2026-07-20T16:45:00Z',
    next_run_at: '2026-08-05T06:00:00Z',
  },
  {
    id: 8,
    name: 'Receita Federal - Retenções PIS/COFINS/CSLL',
    source_type: 'FEDERAL',
    scope: 'NFSE',
    data_categories: ['PIS_COFINS_CSLL'],
    business_impact: 'PIS_COFINS_CSLL',
    enabled: false,
    articles_count: 60,
    embedded_count: 0,
    last_crawled_at: '2026-05-30T12:00:00Z',
    next_run_at: null,
  },
]

const JOBS = [
  { id: 101, source_id: 1, source_name: 'Diário Oficial da União - CONFAZ', status: 'completed', started_at: '2026-07-29T08:00:00Z', completed_at: '2026-07-29T08:12:00Z', articles_found: 18, articles_new: 5, articles_updated: 3, embeddings_generated: 5, error_message: null },
  { id: 102, source_id: 2, source_name: 'SEFAZ-SP Legislação ICMS', status: 'completed', started_at: '2026-07-30T11:30:00Z', completed_at: '2026-07-30T11:40:00Z', articles_found: 12, articles_new: 2, articles_updated: 1, embeddings_generated: 2, error_message: null },
  { id: 103, source_id: 3, source_name: 'Receita Federal - IN RFB PIS/COFINS', status: 'completed', started_at: '2026-07-25T09:00:00Z', completed_at: '2026-07-25T09:05:00Z', articles_found: 6, articles_new: 0, articles_updated: 0, embeddings_generated: 0, error_message: null },
  { id: 104, source_id: 4, source_name: 'Portal COTEPE/CONFAZ - Protocolos ST', status: 'failed', started_at: '2026-06-18T14:15:00Z', completed_at: '2026-06-18T14:22:00Z', articles_found: 0, articles_new: 0, articles_updated: 0, embeddings_generated: 0, error_message: 'Timeout ao conectar ao portal COTEPE (HTTP 504)' },
  { id: 105, source_id: 5, source_name: 'Prefeitura de São Paulo - Legislação ISS', status: 'completed', started_at: '2026-07-28T09:50:00Z', completed_at: '2026-07-28T10:00:00Z', articles_found: 9, articles_new: 4, articles_updated: 2, embeddings_generated: 4, error_message: null },
  { id: 106, source_id: 6, source_name: 'Receita Federal - IN IRRF/INSS', status: 'running', started_at: '2026-07-31T07:28:00Z', completed_at: null, articles_found: null, articles_new: null, articles_updated: null, embeddings_generated: null, error_message: null },
  { id: 107, source_id: 7, source_name: 'eSocial/Reinf - Manual de Orientação', status: 'completed', started_at: '2026-07-20T16:40:00Z', completed_at: '2026-07-20T16:45:00Z', articles_found: 4, articles_new: 1, articles_updated: 0, embeddings_generated: 1, error_message: null },
  { id: 108, source_id: 8, source_name: 'Receita Federal - Retenções PIS/COFINS/CSLL', status: 'failed', started_at: '2026-05-30T11:55:00Z', completed_at: '2026-05-30T12:00:00Z', articles_found: 0, articles_new: 0, articles_updated: 0, embeddings_generated: 0, error_message: 'Falha de parsing do HTML da fonte' },
  { id: 109, source_id: 1, source_name: 'Diário Oficial da União - CONFAZ', status: 'completed', started_at: '2026-07-15T08:00:00Z', completed_at: '2026-07-15T08:09:00Z', articles_found: 7, articles_new: 2, articles_updated: 1, embeddings_generated: 2, error_message: null },
  { id: 110, source_id: 2, source_name: 'SEFAZ-SP Legislação ICMS', status: 'completed', started_at: '2026-07-10T11:20:00Z', completed_at: '2026-07-10T11:29:00Z', articles_found: 5, articles_new: 1, articles_updated: 0, embeddings_generated: 1, error_message: null },
]
// Jobs mais recentes primeiro (usado por "Última Sincronização")
JOBS.sort((a, b) => new Date(b.started_at) - new Date(a.started_at))

const ARTICLE_TEMPLATES = [
  { source_tipo: 'LEI', source_numero: '10.147/2000', source_orgao: 'Receita Federal', artigo: 'Art. 1º', tags: 'pis,cofins,monofasico', content: 'Fica instituída a incidência monofásica da contribuição para o PIS/PASEP e da COFINS incidentes sobre a receita bruta decorrente da venda de produtos farmacêuticos, de perfumaria, de toucador e de higiene pessoal.' },
  { source_tipo: 'DECRETO', source_numero: '7.212/2010', source_orgao: 'Presidência da República', artigo: 'Art. 35', tags: 'ipi,tipi', content: 'Regulamenta a cobrança, fiscalização, arrecadação e administração do Imposto sobre Produtos Industrializados - IPI, definindo os fatos geradores e o campo de incidência do imposto conforme a TIPI vigente.' },
  { source_tipo: 'CONVENIO', source_numero: 'ICMS 52/17', source_orgao: 'CONFAZ', artigo: 'Cláusula 3ª', tags: 'icms,st,mva', content: 'Dispõe sobre as normas gerais a serem aplicadas aos regimes de substituição tributária e de antecipação do ICMS relativas às operações subsequentes, instituídos por convênios ou protocolos.' },
  { source_tipo: 'INSTRUCAO_NORMATIVA', source_numero: 'IN RFB 1.911/2019', source_orgao: 'Receita Federal', artigo: 'Art. 26', tags: 'pis,cofins,cst', content: 'Regulamenta a apuração, cobrança, fiscalização, arrecadação e administração da Contribuição para o PIS/PASEP e da COFINS, estabelecendo os códigos de situação tributária aplicáveis.' },
  { source_tipo: 'LEI', source_numero: 'LC 87/1996', source_orgao: 'Congresso Nacional', artigo: 'Art. 20', tags: 'icms,credito', content: 'Para a compensação a que se refere o artigo anterior, é assegurado ao sujeito passivo o direito de creditar-se do imposto anteriormente cobrado em operações de que tenha resultado a entrada de mercadoria.' },
  { source_tipo: 'LEI', source_numero: 'EC 87/2015', source_orgao: 'Congresso Nacional', artigo: 'Art. 99', tags: 'icms,difal,fcp', content: 'Nas operações e prestações que destinem bens e serviços a consumidor final, contribuinte ou não do imposto, localizado em outro Estado, adotar-se-á a alíquota interestadual e caberá ao Estado de destino o imposto correspondente à diferença.' },
  { source_tipo: 'DECRETO', source_numero: 'Decreto 8.264/2014', source_orgao: 'Presidência da República', artigo: 'Art. 2º', tags: 'cbenef,beneficio-fiscal', content: 'Regulamenta a informação de código de benefício fiscal na nota fiscal eletrônica, conforme legislação estadual correspondente ao Ato COTEPE.' },
  { source_tipo: 'LEI', source_numero: 'LC 116/2003', source_orgao: 'Congresso Nacional', artigo: 'Art. 3º', tags: 'iss,municipio', content: 'O serviço considera-se prestado, e o imposto devido, no local do estabelecimento prestador ou, na falta do estabelecimento, no local do domicílio do prestador, ressalvadas as exceções previstas nos incisos.' },
  { source_tipo: 'INSTRUCAO_NORMATIVA', source_numero: 'IN RFB 1.234/2012', source_orgao: 'Receita Federal', artigo: 'Art. 9º', tags: 'irrf,retencao', content: 'Dispõe sobre a retenção de tributos nos pagamentos efetuados pelos órgãos da administração pública federal a pessoas jurídicas pelo fornecimento de bens ou prestação de serviços.' },
  { source_tipo: 'LEI', source_numero: 'Lei 8.212/1991', source_orgao: 'Congresso Nacional', artigo: 'Art. 22', tags: 'inss,folha', content: 'A contribuição a cargo da empresa, destinada à Seguridade Social, incide sobre o total das remunerações pagas, devidas ou creditadas a qualquer título aos segurados empregados e trabalhadores avulsos.' },
  { source_tipo: 'CONVENIO', source_numero: 'ICMS 236/21', source_orgao: 'CONFAZ', artigo: 'Cláusula 1ª', tags: 'icms,difal,ec87', content: 'Dispõe sobre os procedimentos a serem observados nas operações e prestações que destinem bens e serviços a consumidor final não contribuinte do ICMS localizado em outra unidade federada.' },
  { source_tipo: 'INSTRUCAO_NORMATIVA', source_numero: 'IN RFB 2.043/2021', source_orgao: 'Receita Federal', artigo: 'Art. 15', tags: 'reinf,esocial', content: 'Institui a Escrituração Fiscal Digital de Retenções e Outras Informações Fiscais - EFD-Reinf, definindo os eventos periódicos e não periódicos a serem transmitidos.' },
]

const ARTICLES = Array.from({ length: 25 }, (_, i) => {
  const t = ARTICLE_TEMPLATES[i % ARTICLE_TEMPLATES.length]
  const day = 1 + (i % 27)
  const month = 5 + (i % 3)
  return {
    id: i + 1,
    source_tipo: t.source_tipo,
    source_numero: t.source_numero,
    source_orgao: t.source_orgao,
    artigo: `${t.artigo}${i >= ARTICLE_TEMPLATES.length ? `, § ${1 + (i % 4)}º` : ''}`,
    content: t.content,
    tags: t.tags,
    has_embedding: i % 4 !== 3,
    updated_at: `2026-0${month}-${String(day).padStart(2, '0')}T09:00:00Z`,
  }
})

mockRoute('/legislation/sources', 'GET', (path) => {
  const params = paramsOf(path)
  const scope = params.get('scope')
  if (!scope) return SOURCES
  return SOURCES.filter((s) => s.scope === scope)
})

mockRoute(/^\/legislation\/sync\/status$/, 'GET', (path) => {
  const params = paramsOf(path)
  const limit = Number(params.get('limit')) || 20
  return JOBS.slice(0, limit)
})

mockRoute('/legislation/sync', 'POST', () => ({ ok: true }))

mockRoute(/^\/legislation\/sources\/(\d+)$/, 'PATCH', () => ({ ok: true }))

mockRoute(/^\/legislation\/articles$/, 'GET', (path) => {
  const params = paramsOf(path)
  const page = params.get('page') || 1
  const pageSize = params.get('page_size') || 50
  const search = (params.get('q') || '').trim().toLowerCase()
  const hasEmbedding = params.get('has_embedding')

  let filtered = ARTICLES
  if (search) {
    filtered = filtered.filter((a) =>
      a.content.toLowerCase().includes(search) ||
      a.artigo.toLowerCase().includes(search) ||
      a.source_numero.toLowerCase().includes(search)
    )
  }
  if (hasEmbedding === 'true') filtered = filtered.filter((a) => a.has_embedding)
  else if (hasEmbedding === 'false') filtered = filtered.filter((a) => !a.has_embedding)

  return paginate(filtered, page, pageSize)
})

const TAX_TABLE_ALERTS = [
  { id: 1, table: 'irrf', competencia_inicio: '2026-05', fonte: 'DOU Seção 1, Portaria MF 4.312/2026', publicado_em: '2026-05-02T09:00:00Z' },
  { id: 2, table: 'inss', competencia_inicio: '2026-06', fonte: 'DOU Seção 1, Portaria Interministerial MPS/MF 8/2026', publicado_em: '2026-06-01T08:30:00Z' },
  { id: 3, table: 'salario-minimo', competencia_inicio: '2026-06', fonte: 'DOU Seção 1, Decreto 12.045/2026', publicado_em: '2026-06-01T08:00:00Z' },
  { id: 4, table: 'salario-familia', competencia_inicio: '2026-06', fonte: 'DOU Seção 1, Portaria MPS 6/2026', publicado_em: '2026-06-01T08:15:00Z' },
  { id: 5, table: 'fgts', competencia_inicio: '2026-07', fonte: 'DOU Seção 1, Circular CAIXA 987/2026', publicado_em: '2026-07-10T10:00:00Z' },
  { id: 6, table: 'irpj-csll', competencia_inicio: '2026-07', fonte: 'DOU Seção 1, IN RFB 2.201/2026', publicado_em: '2026-07-15T11:20:00Z' },
]

mockRoute('/reference/tax-tables/pending-alerts', 'GET', () => ({ alerts: TAX_TABLE_ALERTS }))

mockRoute(/^\/reference\/tax-tables\/([^/]+)\/approve\/([^/]+)$/, 'POST', () => ({
  ok: true,
  retired: { competencia_inicio: '2026-01' },
}))
