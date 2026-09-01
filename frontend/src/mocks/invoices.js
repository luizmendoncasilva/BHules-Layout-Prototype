import { mockRoute, paginate, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

// Fixture de notas fiscais de entrada (NF-e/NFC-e) usado por ListView,
// DetailView, DanfeTab, ClassificationTab, AuditTab e os dashboards de
// classificação/operações. Substitui o fixture antigo (pré-registry) que
// só cobria a extinta tela "IntegradorNF".

// ─────────────────────────────────────────────────────────────────────────
// Helpers determinísticos (mesma seed a cada reload da página, pra não sair
// caçando "sumiu a nota" toda hora que o Vite recarrega o módulo).
// ─────────────────────────────────────────────────────────────────────────
let seed = 42
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}
function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)]
}
function pad(n, len) {
  return String(n).padStart(len, '0')
}

function isoDate(daysAgo) {
  const d = new Date('2026-07-31T00:00:00')
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

// Chave de acesso NF-e: 44 dígitos numéricos (cUF+AAMM+CNPJ+mod+serie+nNF+tpEmis+cNF+cDV)
function makeChave(uf, aamm, cnpjDigits, mod, serie, numero) {
  const cUF = { SP: '35', MG: '31', SC: '42', RJ: '33', PR: '41', RS: '43' }[uf] || '35'
  const cnpj14 = cnpjDigits.padStart(14, '0')
  const base = `${cUF}${aamm}${cnpj14}${mod}${pad(serie, 3)}${pad(numero, 9)}1${pad(randInt(0, 99999999), 8)}`
  // dígito verificador fake (não precisa ser válido — é mock)
  const dv = randInt(0, 9)
  return (base + dv).slice(0, 44).padEnd(44, '0')
}

function onlyDigits(s) {
  return (s || '').replace(/\D/g, '')
}

// Fornecedores fictícios que emitem as notas de entrada para as empresas
// clientes (MOCK_COMPANIES). Nomes/CNPJs plausíveis, sem relação com
// pessoas ou empresas reais.
const SUPPLIERS = [
  { nome: 'Distribuidora Aurora Cosmeticos Ltda', cnpj: '11222333000181', uf: 'SP', municipio: 'São Paulo', endereco: 'Rua Vergueiro, 1200', cep: '01504-001', fone: '1132145566', ie: '110234567890' },
  { nome: 'Embalagens Pinheiro Industria Ltda', cnpj: '22333444000192', uf: 'SP', municipio: 'Guarulhos', endereco: 'Av. Timbiras, 450', cep: '07093-000', fone: '1124589977', ie: '110987654321' },
  { nome: 'Perfumaria Cristal Distribuicao S.A.', cnpj: '33444555000103', uf: 'MG', municipio: 'Belo Horizonte', endereco: 'Rua Curitiba, 800', cep: '30170-120', fone: '3132456677', ie: '062334455667' },
  { nome: 'Fiacao e Tecidos Alvorada Ltda', cnpj: '44555666000114', uf: 'SC', municipio: 'Blumenau', endereco: 'Rua XV de Novembro, 2200', cep: '89010-000', fone: '4733215588', ie: '256789012345' },
  { nome: 'Metais e Ferragens Uniao Ltda', cnpj: '55666777000125', uf: 'SP', municipio: 'Diadema', endereco: 'Av. Piraporinha, 900', cep: '09961-000', fone: '1140987766', ie: '110778899001' },
  { nome: 'Papelaria e Suprimentos Central Ltda', cnpj: '66777888000136', uf: 'RJ', municipio: 'Rio de Janeiro', endereco: 'Rua da Alfandega, 55', cep: '20070-030', fone: '2122334455', ie: '780123456789' },
  { nome: 'Quimica Industrial Sao Bento S.A.', cnpj: '77888999000147', uf: 'PR', municipio: 'Curitiba', endereco: 'Av. das Torres, 1800', cep: '81200-100', fone: '4133456677', ie: '900234455667' },
  { nome: 'Componentes Eletronicos Delta Ltda', cnpj: '88999000000158', uf: 'SP', municipio: 'Campinas', endereco: 'Rua Sacramento, 340', cep: '13020-000', fone: '1932114455', ie: '110665544332' },
  { nome: 'Graficas Reunidas Boa Vista Ltda', cnpj: '99000111000169', uf: 'RS', municipio: 'Porto Alegre', endereco: 'Av. Ipiranga, 3000', cep: '90610-000', fone: '5133226677', ie: '123556677889' },
  { nome: 'Insumos Agricolas Terra Nova S.A.', cnpj: '10121314000170', uf: 'MG', municipio: 'Uberlândia', endereco: 'Av. Rondon Pacheco, 1500', cep: '38400-100', fone: '3432117788', ie: '062998877665' },
]

const NATUREZAS = [
  'COMPRA PARA COMERCIALIZACAO', 'COMPRA PARA INDUSTRIALIZACAO', 'COMPRA PARA USO E CONSUMO',
  'COMPRA DE ATIVO IMOBILIZADO', 'DEVOLUCAO DE VENDA', 'TRANSFERENCIA DE MERCADORIA',
]

const NCMS = ['33049910', '39231090', '61099000', '85369090', '48192900', '73181500', '39199090', '84819000', '34012000', '96190090']
const CFOPS_ENTRADA_INTRA = ['1102', '1101', '1556', '1551', '1910']
const CFOPS_ENTRADA_INTER = ['2102', '2101', '2556', '2551', '2910']
const CST_ICMS_OPTS = ['00', '10', '20', '40', '41', '51', '60', '90']
const CST_PIS_COFINS_OPTS = ['01', '02', '50', '51', '70', '98']

const STATUS_ANALISE_POOL = [
  ...Array(38).fill('CONFORME'),
  ...Array(15).fill('REQUER_REVISAO'),
  ...Array(7).fill('BLOQUEADO'),
]

const PROBLEM_TYPES = [
  'CFOP_DIVERGENTE',
  'CST_ICMS_DIVERGENTE',
  'NCM_AUSENTE',
  'VALOR_ICMS_DIVERGENTE',
  'FINALIDADE_INCORRETA',
]

const AUDIT_EVENT_TYPES_PER_INVOICE = [
  'invoice.ingested',
  'invoice.engine.status_changed',
  'invoice.feedback.upvote',
  'invoice.feedback.downvote',
  'invoice.escrituracao.run_manual',
  'invoice.escrituracao.feedback_submitted',
  'invoice.integration.locked',
]

// Empresas destinatárias válidas para NF-e de entrada (flag habilitada).
const DEST_COMPANIES = MOCK_COMPANIES.filter((c) => c.nfe_entrada_enabled)

const TOTAL_INVOICES = 60

function buildItems(invoiceId, vlDoc, seedOffset) {
  const n = 3 + ((invoiceId + seedOffset) % 4) // 3-6 itens
  const items = []
  let remaining = vlDoc
  for (let i = 0; i < n; i++) {
    const isLast = i === n - 1
    const vlItem = isLast ? Math.max(remaining, 10) : Number((vlDoc / n * (0.7 + rand() * 0.6)).toFixed(2))
    remaining -= vlItem
    const qtd = randInt(1, 50)
    const cfopEntradaPool = rand() > 0.3 ? CFOPS_ENTRADA_INTRA : CFOPS_ENTRADA_INTER
    const cfop = pick(cfopEntradaPool)
    const cst = pick(CST_ICMS_OPTS)
    const aliqIcms = pick([0, 4, 7, 12, 18])
    const vlBcIcms = aliqIcms > 0 ? Number((vlItem * 0.9).toFixed(2)) : 0
    const vlIcms = Number((vlBcIcms * aliqIcms / 100).toFixed(2))
    items.push({
      id: invoiceId * 100 + i + 1,
      invoice_id: invoiceId,
      num_item: i + 1,
      nitem: i + 1,
      cod_item: `PRD${pad(invoiceId, 4)}${i + 1}`,
      descr_compl: pick([
        'Kit higiene pessoal 250ml', 'Caixa de embalagens plasticas', 'Frasco vidro 100ml',
        'Rolo de tecido algodao', 'Parafuso sextavado M8', 'Papel offset 75g A4',
        'Reagente quimico industrial 5L', 'Placa de circuito impresso', 'Etiqueta adesiva colorida',
        'Fertilizante NPK 20kg',
      ]),
      xprod: 'Produto ' + (i + 1),
      ncm: pick(NCMS),
      orig: 0,
      cst_icms: cst,
      cst_pis: pick(CST_PIS_COFINS_OPTS),
      cst_cofins: pick(CST_PIS_COFINS_OPTS),
      cfop_emitente: pick(['5102', '5101', '6102', '6101']),
      cfop_entrada: cfop,
      unid: pick(['UN', 'CX', 'KG', 'MT', 'PC']),
      qtd,
      vl_un_com: Number((vlItem / qtd).toFixed(4)),
      vl_item: Number(vlItem.toFixed(2)),
      vl_bc_icms: vlBcIcms,
      vl_icms: vlIcms,
      vl_ipi: 0,
      aliq_icms: aliqIcms,
      aliq_ipi: 0,
      tipo_item_computed: null,
      tipo_item_sped: null,
      inf_ad_prod: rand() > 0.85 ? 'Lote ' + randInt(1000, 9999) : null,
    })
  }
  return items
}

const INVOICES = []
const ITEMS_BY_INVOICE = {}

for (let i = 1; i <= TOTAL_INVOICES; i++) {
  const daysAgo = randInt(0, 90) // últimos 3 meses (hoje: 2026-07-31)
  const dtDoc = isoDate(daysAgo)
  const supplier = pick(SUPPLIERS)
  const dest = pick(DEST_COMPANIES)
  // Maioria NF-e modelo 55 Recebida/Entrada (compra normal — ind_emit='1',
  // ind_oper='0'), mas com uma distribuição DETERMINÍSTICA (não aleatória,
  // via `i % 30`) que garante pelo menos algumas notas em cada combinação
  // dos DOIS eixos independentes da segregação (ver notasFiscaisTabs.js):
  //   - ind_emit: '0' = o próprio cliente emitiu (Emitida/o), '1' = terceiro
  //     emitiu (Recebida/o).
  //   - ind_oper: natureza da operação (CFOP) — '0' = Entrada, '1' = Saída.
  // Materiais NF-e e CT-e cruzam os dois eixos (4 combinações cada); Serviços
  // NFS-e só varia por ind_emit; NFC-e só existe Emitida (mas também gera um
  // caso ind_emit='1' pra cobrir a aba "NFCe" de Notas Integradas). Com
  // rand() puro essas combinações raras podiam sair zeradas.
  const bucket = i % 30
  let codMod, indEmit, indOper
  if ([2, 3, 4, 5].includes(bucket)) { codMod = '55'; indEmit = '0'; indOper = '1' }        // Materiais Emitidas — Saídas
  else if ([6, 7].includes(bucket)) { codMod = '55'; indEmit = '0'; indOper = '0' }         // Materiais Emitidas — Entradas
  else if (bucket === 8) { codMod = '55'; indEmit = '1'; indOper = '1' }                    // Materiais Recebidas — Saídas
  else if ([9, 10].includes(bucket)) { codMod = 'NFSE'; indEmit = '0' }                     // Serviços Prestados
  else if ([11, 12].includes(bucket)) { codMod = 'NFSE'; indEmit = '1' }                    // Serviços Tomados
  else if ([13, 20].includes(bucket)) { codMod = '57'; indEmit = '1'; indOper = '0' }       // CT-e Recebidos — Entradas
  else if (bucket === 14) { codMod = '57'; indEmit = '0'; indOper = '1' }                   // CT-e Emitidos — Saídas
  else if (bucket === 16) { codMod = '57'; indEmit = '0'; indOper = '0' }                   // CT-e Emitidos — Entradas
  else if (bucket === 21) { codMod = '57'; indEmit = '1'; indOper = '1' }                   // CT-e Recebidos — Saídas
  else if (bucket === 17) { codMod = '65'; indEmit = '1' }                                  // NFC-e Recebida (Notas Integradas)
  else if ([18, 19].includes(bucket)) { codMod = '65'; indEmit = '0' }                      // NFC-e Emitidas
  else { codMod = '55'; indEmit = '1'; indOper = '0' }                                      // Materiais Recebidas — Entradas (maioria)
  // ind_oper não se aplica a NFS-e/NFC-e na segregação — mantém um valor
  // plausível (espelhando ind_emit) só pra registro/exibição.
  if (indOper === undefined) indOper = indEmit === '0' ? '1' : '0'
  const serie = pick([1, 1, 1, 2])
  const numero = 100000 + i
  const aamm = dtDoc.slice(2, 4) + dtDoc.slice(5, 7)
  const chave = makeChave(supplier.uf, aamm, onlyDigits(supplier.cnpj), codMod, serie, numero)
  const vlDoc = Number((randInt(200, 45000) + rand()).toFixed(2))
  const statusAnalise = STATUS_ANALISE_POOL[randInt(0, STATUS_ANALISE_POOL.length - 1)]
  const escrituracaoStatus = statusAnalise === 'BLOQUEADO'
    ? 'PENDENTE'
    : pick(['ESCRITURADA', 'ESCRITURADA', 'PENDENTE', 'ANALISADA'])
  const capturedAt = `${dtDoc}T${pad(randInt(6, 20), 2)}:${pad(randInt(0, 59), 2)}:00Z`
  const integradoApiEm = rand() > 0.4 ? `${isoDate(Math.max(daysAgo - randInt(0, 3), 0))}T${pad(randInt(6, 20), 2)}:${pad(randInt(0, 59), 2)}:00Z` : null
  const envioDominioStatus = integradoApiEm ? pick(['ENVIADO', 'ENVIADO', 'ENVIADO', 'ERRO']) : 'PENDENTE'

  const invoice = {
    id: i,
    num_doc: String(numero),
    chave_nfe: chave,
    serie: String(serie),
    cod_mod: codMod,
    cod_sit: pick(['00', '00', '00', '00', '00', '00', '02', '03']),
    carta_correcao: rand() > 0.9,
    nat_op: pick(NATUREZAS),
    natureza_operacao: pick(NATUREZAS),
    ind_oper: indOper, // natureza da operação (CFOP): 0=Entrada, 1=Saída
    ind_emit: indEmit, // quem emitiu, do ponto de vista do cliente: 0=Emitida/o (própria), 1=Recebida/o (terceiro)
    n_prot: `1352600${pad(randInt(1000000, 9999999), 8)}`,

    company_id: dest.id,

    emit_razao_social: supplier.nome,
    emit_cnpj: supplier.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'),
    emit_uf: supplier.uf,
    emit_municipio: supplier.municipio,
    emit_endereco: supplier.endereco,
    emit_cep: supplier.cep,
    emit_fone: supplier.fone,
    ie_emitente: supplier.ie,
    crt: pick([1, 3, 3]),

    dest_razao_social: dest.razao_social,
    dest_cnpj: dest.cnpj,
    dest_uf: dest.uf,
    dest_municipio: 'São Paulo',
    dest_endereco: 'Av. Paulista, 1000',
    dest_bairro: 'Bela Vista',
    dest_cep: '01310-100',
    dest_fone: '1130001122',
    ie_destinatario: dest.inscricao_estadual,

    dt_doc: dtDoc,
    dt_e_s: dtDoc,
    hora_saida: `${pad(randInt(8, 18), 2)}:${pad(randInt(0, 59), 2)}`,
    vl_doc: vlDoc,
    vl_merc: vlDoc,
    vl_bc_icms: Number((vlDoc * 0.85).toFixed(2)),
    vl_icms: Number((vlDoc * 0.85 * 0.12).toFixed(2)),
    vl_bc_icms_st: 0,
    vl_icms_st: 0,
    vl_ipi: 0,
    vl_frt: rand() > 0.6 ? Number((vlDoc * 0.02).toFixed(2)) : 0,
    vl_seg: 0,
    vl_desc: rand() > 0.8 ? Number((vlDoc * 0.01).toFixed(2)) : 0,
    vl_out_da: 0,
    vl_tot_trib: Number((vlDoc * 0.18).toFixed(2)),
    vl_icms_uf_dest: 0,
    vl_icms_uf_remet: 0,
    vl_fcp: 0,
    vl_imp_import: 0,

    transp_nome: rand() > 0.3 ? 'Transportadora Rota Sul Logistica S.A.' : null,
    ind_frt: pick(['0', '1', '9']),
    transp_antt: rand() > 0.5 ? String(randInt(10000000, 99999999)) : '',
    transp_placa: rand() > 0.5 ? `ABC${randInt(1000, 9999)}` : '',
    transp_uf: supplier.uf,
    vol_qtd: randInt(1, 20),
    vol_esp: 'VOLUME',
    vol_peso_b: Number((randInt(1, 500)).toFixed(3)),
    vol_peso_l: Number((randInt(1, 480)).toFixed(3)),

    status_analise: statusAnalise,
    escrituracao_status: escrituracaoStatus,
    analise_status: statusAnalise === 'BLOQUEADO' ? 'BLOQUEADA' : (statusAnalise === 'REQUER_REVISAO' ? 'VERIFICAR' : 'APROVADA'),
    validation_status: null,
    oportunidades_count: rand() > 0.7 ? randInt(1, 4) : 0,

    captured_at: capturedAt,
    created_at: capturedAt,
    capture_method: pick(['AUTOMATICA', 'AUTOMATICA', 'AUTOMATICA', 'MANUAL']),
    api_source: 'DOMINIO',
    reviewed_at: escrituracaoStatus === 'ESCRITURADA' ? `${dtDoc}T${pad(randInt(6, 20), 2)}:${pad(randInt(0, 59), 2)}:00Z` : null,
    reviewed_by: escrituracaoStatus === 'ESCRITURADA' ? pick(['motor', 'legado', 'ana.silva@bhub.ai', 'carlos.souza@bhub.ai']) : null,

    data_pagamento: null,

    // Notas Integradas (dual-write Domínio)
    integrado_api_em: integradoApiEm,
    envio_dominio_status: envioDominioStatus,
  }

  INVOICES.push(invoice)
  ITEMS_BY_INVOICE[i] = buildItems(i, vlDoc, i)
}

export function getInvoiceItemsById(id) {
  return ITEMS_BY_INVOICE[Number(id)] || []
}

export function getInvoiceById(id) {
  return INVOICES.find((inv) => inv.id === Number(id)) || INVOICES[0]
}

function filterInvoices(list, params) {
  let out = list
  const companyIds = params.get('company_ids')
  if (companyIds) {
    const ids = companyIds.split(',').map(Number)
    out = out.filter((inv) => ids.includes(inv.company_id))
  }
  const companyId = params.get('company_id')
  if (companyId) out = out.filter((inv) => inv.company_id === Number(companyId))
  const statusAnalise = params.get('status_analise')
  if (statusAnalise) out = out.filter((inv) => inv.status_analise === statusAnalise)
  const escrituracaoStatus = params.get('escrituracao_status')
  if (escrituracaoStatus) out = out.filter((inv) => inv.escrituracao_status === escrituracaoStatus)
  const codMod = params.get('cod_mod')
  if (codMod) out = out.filter((inv) => inv.cod_mod === codMod)
  const search = params.get('search')
  if (search) {
    const s = search.toLowerCase()
    out = out.filter((inv) =>
      (inv.num_doc || '').includes(s) ||
      (inv.emit_razao_social || '').toLowerCase().includes(s) ||
      (inv.chave_nfe || '').includes(s)
    )
  }
  const cnpjEmit = params.get('cnpj_emit')
  if (cnpjEmit) out = out.filter((inv) => onlyDigits(inv.emit_cnpj).includes(onlyDigits(cnpjEmit)))
  const cnpjDest = params.get('cnpj_dest')
  if (cnpjDest) out = out.filter((inv) => onlyDigits(inv.dest_cnpj).includes(onlyDigits(cnpjDest)))
  const startDate = params.get('start_date')
  if (startDate) out = out.filter((inv) => inv.dt_doc >= startDate)
  const endDate = params.get('end_date')
  if (endDate) out = out.filter((inv) => inv.dt_doc <= endDate)
  const indEmit = params.get('ind_emit')
  if (indEmit) out = out.filter((inv) => inv.ind_emit === indEmit)
  const indOper = params.get('ind_oper')
  if (indOper) out = out.filter((inv) => inv.ind_oper === indOper)
  return out
}

mockRoute('/invoices', 'GET', (path) => {
  const params = paramsOf(path)
  const page = params.get('page') || 1
  const pageSize = params.get('page_size') || 50
  const filtered = filterInvoices(INVOICES, params)
  return paginate(filtered, page, pageSize)
})

mockRoute('/invoices/problem-types', 'GET', () => PROBLEM_TYPES)

mockRoute('/invoices/status-counts', 'GET', (path) => {
  const params = paramsOf(path)
  const filtered = filterInvoices(INVOICES, params)
  const counts = { CONFORME: 0, REQUER_REVISAO: 0, BLOQUEADO: 0 }
  for (const inv of filtered) {
    if (counts[inv.status_analise] !== undefined) counts[inv.status_analise] += 1
  }
  return counts
})

mockRoute(/^\/invoices\/(\d+)$/, 'GET', (_path, match) => getInvoiceById(match[1]))

mockRoute(/^\/invoices\/(\d+)\/items$/, 'GET', (_path, match) => getInvoiceItemsById(match[1]))

mockRoute(/^\/invoices\/(\d+)\/audit-events$/, 'GET', (_path, match) => {
  const invoiceId = Number(match[1])
  const inv = getInvoiceById(invoiceId)
  const n = 3 + (invoiceId % 3)
  const events = []
  for (let i = 0; i < n; i++) {
    const type = AUDIT_EVENT_TYPES_PER_INVOICE[(invoiceId + i) % AUDIT_EVENT_TYPES_PER_INVOICE.length]
    const daysAgo = n - i
    events.push({
      id: invoiceId * 10 + i,
      invoice_id: invoiceId,
      created_at: `${isoDate(daysAgo)}T${pad(9 + i, 2)}:${pad((invoiceId * 7 + i * 3) % 60, 2)}:00Z`,
      event_type: type,
      actor: type.includes('feedback') ? pick(['ana.silva@bhub.ai', 'carlos.souza@bhub.ai']) : (type.includes('engine') ? 'motor' : 'system'),
      actor_type: type.includes('feedback') ? 'analyst' : (type.includes('engine') ? 'motor' : 'system'),
      payload: type === 'invoice.ingested'
        ? { api_source: inv.api_source, document_type: 'NFE' }
        : type === 'invoice.engine.status_changed'
          ? { from: 'PENDENTE', to: inv.status_analise, rules_count: randInt(4, 20) }
          : type === 'invoice.escrituracao.feedback_submitted'
            ? { items_count: randInt(3, 6), corrections_count: randInt(0, 2) }
            : type === 'invoice.integration.locked'
              ? { endpoint: '/dominio/nfe/entrada' }
              : null,
    })
  }
  return events.reverse()
})

mockRoute(/^\/invoices\/(\d+)\/status-reasons$/, 'GET', (_path, match) => {
  const inv = getInvoiceById(match[1])
  if (inv.status_analise === 'CONFORME') return { motivos: [] }
  const pool = [
    { campo: 'cfop', descricao: 'CFOP do item diverge do CFOP esperado para a operação de entrada', valor_esperado: '1102', valor_encontrado: '5102' },
    { campo: 'cst_icms', descricao: 'CST ICMS informado não é compatível com o regime tributário do destinatário', valor_esperado: '00', valor_encontrado: '90' },
    { campo: 'ncm', descricao: 'NCM ausente ou inválido no item da nota', valor_esperado: '8 dígitos', valor_encontrado: '-' },
    { campo: 'valor_icms', descricao: 'Valor de ICMS destacado diverge do calculado pelo motor', valor_esperado: 'R$ 245,80', valor_encontrado: 'R$ 198,40' },
    { campo: 'finalidade', descricao: 'Finalidade do item não identificada automaticamente', valor_esperado: 'REVENDA', valor_encontrado: '-' },
  ]
  const n = inv.status_analise === 'BLOQUEADO' ? 4 + (inv.id % 2) : 3 + (inv.id % 2)
  const motivos = []
  for (let i = 0; i < Math.min(n, pool.length); i++) {
    motivos.push({ ...pool[i], severidade: inv.status_analise === 'BLOQUEADO' ? 'CRITICO' : (i === 0 ? 'ALERTA' : 'INFORMATIVO') })
  }
  return { motivos }
})

mockRoute(/^\/invoices\/(\d+)\/feedback$/, 'GET', () => ({ vote: null, comment: null }))
mockRoute(/^\/invoices\/(\d+)\/feedback$/, 'POST', () => ({ ok: true }))

mockRoute(/^\/invoices\/(\d+)\/nfse-feedback$/, 'POST', () => ({ ok: true }))

mockRoute(/^\/invoices\/(\d+)\/classification-overrides$/, 'GET', () => [])
mockRoute(/^\/invoices\/(\d+)\/classification-overrides$/, 'PUT', () => ({ ok: true }))

mockRoute(/^\/invoices\/(\d+)\/data-pagamento$/, 'PATCH', () => ({ ok: true }))
mockRoute(/^\/invoices\/(\d+)\/approve$/, 'PUT', () => ({ ok: true }))

mockRoute(/^\/invoices\/(\d+)\/nfse-analysis$/, 'GET', () => ({}))

// ── Time-series / dashboards agregados ─────────────────────────────────
function buildTimeSeries(points = 16) {
  const series = []
  for (let i = points - 1; i >= 0; i--) {
    const date = isoDate(i * 5)
    series.push({
      date,
      CONFORME: randInt(2, 8),
      REQUER_REVISAO: randInt(0, 4),
      BLOQUEADO: randInt(0, 2),
      total: 0,
    })
  }
  for (const p of series) p.total = p.CONFORME + p.REQUER_REVISAO + p.BLOQUEADO
  return series
}

mockRoute('/invoices/classification-history', 'GET', () => ({
  series: buildTimeSeries(16),
  granularity: 'day',
}))

mockRoute('/invoices/classification-dashboard', 'GET', () => {
  const counts = { CONFORME: 0, REQUER_REVISAO: 0, BLOQUEADO: 0 }
  for (const inv of INVOICES) counts[inv.status_analise] = (counts[inv.status_analise] || 0) + 1
  return {
    total_notas: INVOICES.length,
    por_status: counts,
    escrituradas: INVOICES.filter((i) => i.escrituracao_status === 'ESCRITURADA').length,
    pendentes: INVOICES.filter((i) => i.escrituracao_status === 'PENDENTE').length,
    taxa_automacao: 0.82,
    series: buildTimeSeries(12),
  }
})

mockRoute('/invoices/operations-dashboard', 'GET', () => {
  const counts = { CONFORME: 0, REQUER_REVISAO: 0, BLOQUEADO: 0 }
  for (const inv of INVOICES) counts[inv.status_analise] = (counts[inv.status_analise] || 0) + 1
  return {
    total_notas: INVOICES.length,
    total_empresas: DEST_COMPANIES.length,
    por_status: counts,
    valor_total: Number(INVOICES.reduce((s, i) => s + i.vl_doc, 0).toFixed(2)),
    notas_com_erro: INVOICES.filter((i) => i.status_analise === 'BLOQUEADO').length,
    tempo_medio_analise_min: 3.4,
    series: buildTimeSeries(20),
  }
})
