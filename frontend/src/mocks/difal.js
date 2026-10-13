import { mockRoute, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

// Fixture do DIFAL do Simples Nacional (LC 123/2006, art. 13, §1º, XIII, "h"):
// fila de validação da Célula (DifalSnFila — keyset por cursor, sem total),
// memória de cálculo por nota (GET /difal-sn/invoice/:id), vereditos
// individuais e em lote, e o catálogo do Rule Pack com o gate de ativação
// (DifalSnRegras, só leitura).
//
// O DIFAL é devido à UF do DESTINATÁRIO (a empresa do Simples que compra de
// outra UF para uso/consumo ou ativo), então uf_destino = UF da empresa.

function bodyOf(raw) {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return raw
}

function money(n) {
  return Number(Number(n).toFixed(2))
}

const AGORA = () => new Date().toISOString()

// Alíquotas internas modais (ICMS + FCP quando houver) por UF de destino.
const ALIQ_INTERNA = { SC: 17, RJ: 20, GO: 19, SP: 18, MG: 18, PR: 19.5 }
const FCP = { RJ: 2, GO: 2 }

// Empresas do Simples no fixture de companies (Têxtil Rio das Pedras/SC e
// Drogaria Vida Plena/RJ) — são as únicas que geram DIFAL-SN.
const EMPRESAS_SN = MOCK_COMPANIES.filter((c) => c.regime_tributario === 'SIMPLES_NACIONAL')

const FORNECEDORES = [
  { nome: 'Distribuidora Aurora Cosmeticos Ltda', cnpj: '11222333000181', uf: 'SP', cfop: '6102' },
  { nome: 'Perfumaria Cristal Distribuicao S.A.', cnpj: '33444555000103', uf: 'MG', cfop: '6102' },
  { nome: 'Quimica Industrial Sao Bento S.A.', cnpj: '77888999000147', uf: 'PR', cfop: '6101' },
  { nome: 'Componentes Eletronicos Delta Ltda', cnpj: '88999000000158', uf: 'SP', cfop: '6102' },
  { nome: 'Insumos Agricolas Terra Nova S.A.', cnpj: '10121314000170', uf: 'MG', cfop: '6101' },
  { nome: 'Maquinas Goiania Equipamentos Ltda', cnpj: '21436587000109', uf: 'GO', cfop: '6102' },
]

const PRODUTOS = [
  { descr: 'Cadeira ergonômica escritório', ncm: '94013000', finalidade: 'ATIVO_IMOBILIZADO' },
  { descr: 'Papel A4 75g resma 500 fls', ncm: '48025610', finalidade: 'USO_CONSUMO' },
  { descr: 'Detergente industrial 5L', ncm: '34022000', finalidade: 'USO_CONSUMO' },
  { descr: 'Máquina de costura reta industrial', ncm: '84522900', finalidade: 'ATIVO_IMOBILIZADO' },
  { descr: 'Uniforme brim com logotipo', ncm: '62034200', finalidade: 'USO_CONSUMO' },
  { descr: 'Notebook 15" i5 16GB', ncm: '84713012', finalidade: 'ATIVO_IMOBILIZADO' },
  { descr: 'Toner impressora laser', ncm: '84439933', finalidade: 'USO_CONSUMO' },
  { descr: 'Balcão refrigerado expositor', ncm: '84185010', finalidade: 'ATIVO_IMOBILIZADO' },
]

function ruleCode(uf, finalidade) {
  return `${uf}_DIFAL_SN_${finalidade === 'ATIVO_IMOBILIZADO' ? 'ATIVO' : 'USO_CONSUMO'}`
}

function chave(ufFornecedor, cnpj, comp, seq) {
  const cUF = { SP: '35', MG: '31', PR: '41', GO: '52' }[ufFornecedor] || '35'
  return `${cUF}${comp.slice(2)}${cnpj}55001${String(seq).padStart(9, '0')}1${String(seq * 7919).padStart(8, '0').slice(-8)}`
    .padEnd(44, '0').slice(0, 44)
}

// ─────────────────────────────────────────────────────────────────────────
// Itens da fila
// ─────────────────────────────────────────────────────────────────────────
const ITENS = []
const NOTAS = {}

;(function seed() {
  const competencias = ['202609', '202609', '202609', '202608']
  let seq = 0
  // 14 notas, 1–2 itens DIFAL cada.
  for (let n = 0; n < 14; n++) {
    const empresa = EMPRESAS_SN[n % EMPRESAS_SN.length]
    const forn = FORNECEDORES[n % FORNECEDORES.length]
    const comp = competencias[n % competencias.length]
    const invoiceId = 9100 + n
    const dia = String(2 + ((n * 5) % 26)).padStart(2, '0')
    const dtEmissao = `${comp.slice(0, 4)}-${comp.slice(4, 6)}-${dia}`
    const chaveAcesso = chave(forn.uf, forn.cnpj, comp, 31000 + n)
    const ufDest = empresa.uf
    const aliqInterna = ALIQ_INTERNA[ufDest]
    const aliqInter = forn.uf === 'SP' || forn.uf === 'MG' || forn.uf === 'PR' ? 12 : 7
    const runUuid = `9b1f${String(n).padStart(4, '0')}-6c2e-4d7a-a1b3-${String(870000000000 + n * 1337).slice(0, 12)}`
    const qtdItens = 1 + (n % 3 === 0 ? 1 : 0)
    const itensNota = []

    for (let k = 0; k < qtdItens; k++) {
      seq++
      const prod = PRODUTOS[(n + k * 3) % PRODUTOS.length]
      const valorProd = money(380 + ((n * 131 + k * 977) % 60) * 97.3)
      const tipoBase = ufDest === 'SC' ? 'BASE_UNICA' : 'BASE_DUPLA'
      const variante = tipoBase === 'BASE_DUPLA' ? 'DEDUZ_ICMS_ORIGEM' : null
      // Base dupla: retira o ICMS de origem e recompõe "por dentro" com a interna.
      const baseRecomposta = tipoBase === 'BASE_DUPLA'
        ? money((valorProd * (1 - aliqInter / 100)) / (1 - aliqInterna / 100))
        : valorProd
      const difal = money(baseRecomposta * aliqInterna / 100 - valorProd * aliqInter / 100)
      const fcpAliq = FCP[ufDest] || 0
      const fcp = money(baseRecomposta * fcpAliq / 100)
      const total = money(difal + fcp)

      const componentes = [{ tipo: 'DIFAL', base: baseRecomposta, aliquota: aliqInterna - aliqInter, valor: difal }]
      if (fcp > 0) componentes.push({ tipo: 'FCP', base: baseRecomposta, aliquota: fcpAliq, valor: fcp })

      const rc = ruleCode(ufDest, prod.finalidade)
      const rv = ufDest === 'RJ' ? 3 : 2
      // Distribuição de estados: maioria pendente; alguns já com veredito.
      const estado = seq % 7 === 0 ? 'VALIDADO' : seq % 11 === 0 ? 'REJEITADO' : seq % 3 === 0 ? 'PENDENTE' : 'PENDENTE_VALIDACAO'
      const ultimaReview = estado === 'VALIDADO'
        ? { estado: 'VALIDADO', autor: 'juliana.pereira@bhub.ai', created_at: '2026-10-03T14:12:00Z', motivo: null }
        : estado === 'REJEITADO'
          ? { estado: 'REJEITADO', autor: 'ricardo.alves@bhub.ai', created_at: '2026-10-05T09:48:00Z', motivo: 'Item é revenda (CFOP 2102), não uso e consumo' }
          : seq % 5 === 0
            ? { estado: 'REJEITADO', autor: 'carlos.souza@bhub.ai', created_at: '2026-09-29T11:30:00Z', motivo: 'Run anterior sem FCP — reprocessado' }
            : null

      const item = {
        item_result_id: 4400 + seq,
        invoice_id: invoiceId,
        company_id: empresa.id,
        chave_acesso: chaveAcesso,
        dt_emissao: dtEmissao,
        uf_origem: forn.uf,
        uf_destino: ufDest,
        competencia: comp,
        rule_code: rc,
        rule_version: rv,
        instituto: 'DIFAL',
        decision: 'COLLECT',
        tipo_base: tipoBase,
        variante_deducao: variante,
        amostra_zero: seq % 9 === 0,
        total_item: total,
        cfop_fornecedor: forn.cfop,
        cfop_entrada: prod.finalidade === 'ATIVO_IMOBILIZADO' ? '2551' : '2556',
        revisao_estado: estado,
        ultima_review: ultimaReview,
        componentes,
        sublimite_efeito_desde: '2026-01',
        procedencia: { tipo: 'PARECER_CELULA', ref: `Célula Fiscal — DIFAL-SN ${ufDest}`, data: '2026-08-14' },
        descricao_produto: prod.descr,
        ncm: prod.ncm,
      }
      ITENS.push(item)

      itensNota.push({
        rule_code: rc,
        rule_version: rv,
        total_item: total,
        descricao: prod.descr,
        ncm: prod.ncm,
        finalidade: prod.finalidade,
        modality: 'NAO_CONTRIBUINTE_SN',
        aliq_interna: aliqInterna,
        aliq_interestadual: aliqInter,
        base_recomposta: baseRecomposta,
        regra_estado_atual: 'ACTIVE',
        desatualizado: rv < 3 && ufDest === 'RJ',
        embasamento_legal: 'LC 123/2006, art. 13, §1º, XIII, "h"; EC 87/2015',
        memoria_calculo: {
          valor_produto: valorProd,
          icms_origem: money(valorProd * aliqInter / 100),
          base_sem_icms_origem: tipoBase === 'BASE_DUPLA' ? money(valorProd * (1 - aliqInter / 100)) : null,
          base_recomposta: baseRecomposta,
          icms_destino: money(baseRecomposta * aliqInterna / 100),
          difal,
          fcp,
          total,
        },
      })
    }

    NOTAS[invoiceId] = {
      invoice_id: invoiceId,
      company_id: empresa.id,
      chave_acesso: chaveAcesso,
      emit_razao_social: forn.nome,
      avaliacao_status: 'AVALIADA',
      motivo_principal: itensNota.length > 1 ? 'Itens de uso/consumo e ativo na mesma nota' : null,
      total_difal: money(itensNota.reduce((a, i) => a + i.total_item, 0)),
      run_uuid: runUuid,
      avaliada_em: `${dtEmissao}T21:15:00Z`,
      itens: itensNota,
    }
  }
})()

function filtrar(params) {
  const status = params.get('status')
  const uf = params.get('uf')
  const comp = params.get('competencia')
  const companyId = params.get('company_id')
  return ITENS
    .filter((it) => (status ? it.revisao_estado === status : it.revisao_estado.startsWith('PENDENTE')))
    .filter((it) => !uf || it.uf_destino === uf)
    .filter((it) => !comp || it.competencia === comp)
    .filter((it) => !companyId || String(it.company_id) === String(companyId))
}

// Keyset: cursor = item_result_id do último item entregue (opaco para a UI).
mockRoute(/^\/difal-sn\/revisao$/, 'GET', (path) => {
  const params = paramsOf(path)
  const limit = Number(params.get('limit')) || 50
  const cursor = Number(params.get('cursor')) || 0
  const lista = filtrar(params).filter((it) => it.item_result_id > cursor)
  const page = lista.slice(0, limit)
  return {
    items: page.map((it) => ({ ...it })),
    next_cursor: lista.length > limit ? String(page[page.length - 1].item_result_id) : null,
  }
})

mockRoute(/^\/difal-sn\/invoice\/(\d+)$/, 'GET', (_path, match) => {
  const nota = NOTAS[Number(match[1])]
  if (nota) return nota
  return {
    invoice_id: Number(match[1]),
    avaliacao_status: 'NAO_AVALIADA',
    motivo_principal: 'Nota fora do escopo DIFAL-SN (destinatário não optante)',
    total_difal: 0,
    run_uuid: null,
    itens: [],
  }
})

function registrarVeredito(item, { estado, valor_conferido, motivo }) {
  item.revisao_estado = estado
  item.ultima_review = {
    estado,
    autor: 'analista-prototipo@bhub.ai',
    created_at: AGORA(),
    motivo: motivo || null,
    valor_conferido: valor_conferido ?? null,
  }
}

mockRoute(/^\/difal-sn\/item\/(\d+)\/validacao$/, 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const item = ITENS.find((it) => it.item_result_id === Number(match[1]))
  if (!item) return { ok: false, status: 404, detalhe: 'Item não encontrado' }
  registrarVeredito(item, { estado: body.estado || 'VALIDADO', valor_conferido: body.valor_conferido, motivo: body.motivo })
  return { ok: true, item_result_id: item.item_result_id, revisao_estado: item.revisao_estado, ultima_review: item.ultima_review }
})

// Lote: um 409 (item já com veredito) não derruba o resto.
mockRoute(/^\/difal-sn\/revisao\/lote$/, 'POST', (_path, _match, rawBody) => {
  const body = bodyOf(rawBody)
  const resultados = (body.itens || []).map((req) => {
    const item = ITENS.find((it) => it.item_result_id === Number(req.item_result_id))
    if (!item) return { item_result_id: req.item_result_id, status: 404, detalhe: 'Item não encontrado' }
    if (!item.revisao_estado.startsWith('PENDENTE')) {
      return { item_result_id: item.item_result_id, status: 409, detalhe: `Já ${item.revisao_estado.toLowerCase()} por ${item.ultima_review?.autor || 'outro analista'}` }
    }
    registrarVeredito(item, {
      estado: req.estado || 'VALIDADO',
      valor_conferido: body.usar_valor_calculado ? item.total_item : null,
      motivo: req.motivo,
    })
    return { item_result_id: item.item_result_id, status: 200, detalhe: 'gravado' }
  })
  return { resultados }
})

// ─────────────────────────────────────────────────────────────────────────
// Rule Pack DIFAL-SN (só leitura) — gate de ativação RN-26
// ─────────────────────────────────────────────────────────────────────────
let regraId = 1
function regra(uf, finalidade, instituto, over = {}) {
  const base = {
    id: regraId++,
    uf_destino: uf,
    rule_code: instituto === 'ANTECIPACAO' ? `${uf}_ANTECIPACAO_SN_REVENDA` : ruleCode(uf, finalidade),
    rule_version: 2,
    instituto,
    finalidade,
    decisao_default: 'COLLECT',
    tipo_base: uf === 'SC' ? 'BASE_UNICA' : 'BASE_DUPLA',
    icms_origem_policy: 'DEDUZ_ICMS_ORIGEM',
    fcp_policy: FCP[uf] ? `FCP ${FCP[uf]}% sobre a base recomposta` : 'sem FCP',
    n_exemplos: 6,
    n_exemplos_homologados: 6,
    estado_governanca: 'ACTIVE',
    apta_sem_aprovador: true,
    violacoes: [],
    procedencia: { tipo: 'PARECER_CELULA', ref: `Célula Fiscal — DIFAL-SN ${uf}`, data: '2026-08-14' },
    aprovador_fiscal: 'juliana.pereira@bhub.ai',
    prioridade: instituto === 'ANTECIPACAO' ? 20 : 10,
  }
  return { ...base, ...over }
}

const REGRAS = [
  regra('GO', 'USO_CONSUMO', 'DIFAL'),
  regra('GO', 'ATIVO_IMOBILIZADO', 'DIFAL', { rule_version: 1 }),
  regra('GO', 'REVENDA', 'ANTECIPACAO', {
    estado_governanca: 'DRAFT', n_exemplos: 3, n_exemplos_homologados: 1, apta_sem_aprovador: false, aprovador_fiscal: null,
    violacoes: ['Menos de 3 exemplos homologados (1/3)', 'Política de ICMS de origem não definida para MVA ajustada'],
    icms_origem_policy: null,
  }),
  regra('MG', 'USO_CONSUMO', 'DIFAL'),
  regra('MG', 'ATIVO_IMOBILIZADO', 'DIFAL'),
  regra('PR', 'USO_CONSUMO', 'DIFAL', {
    estado_governanca: 'DRAFT', apta_sem_aprovador: true, aprovador_fiscal: null,
    violacoes: ['Sem aprovador fiscal registrado'],
  }),
  regra('PR', 'ATIVO_IMOBILIZADO', 'DIFAL', { estado_governanca: 'RETIRED', rule_version: 1, aprovador_fiscal: 'carlos.souza@bhub.ai' }),
  regra('RJ', 'USO_CONSUMO', 'DIFAL', { rule_version: 3 }),
  regra('RJ', 'ATIVO_IMOBILIZADO', 'DIFAL', { rule_version: 3 }),
  regra('RJ', 'REVENDA', 'DIFAL', { decisao_default: 'DO_NOT_COLLECT', tipo_base: null, icms_origem_policy: null, fcp_policy: null, n_exemplos: 2, n_exemplos_homologados: 2 }),
  regra('SC', 'USO_CONSUMO', 'DIFAL'),
  regra('SC', 'ATIVO_IMOBILIZADO', 'DIFAL'),
  regra('SC', 'REVENDA', 'ANTECIPACAO', {
    estado_governanca: 'DRAFT', tipo_base: null, n_exemplos: 0, n_exemplos_homologados: 0, apta_sem_aprovador: false, aprovador_fiscal: null,
    violacoes: ['Tipo de base a definir', 'Nenhum exemplo cadastrado', 'Sem aprovador fiscal registrado'],
  }),
  regra('SP', 'USO_CONSUMO', 'DIFAL'),
  regra('SP', 'ATIVO_IMOBILIZADO', 'DIFAL'),
  regra('SP', 'MATERIA_PRIMA', 'DIFAL', { decisao_default: 'BLOCKED', tipo_base: null, icms_origem_policy: null, fcp_policy: null, n_exemplos: 1, n_exemplos_homologados: 0 }),
].sort((a, b) => a.rule_code.localeCompare(b.rule_code))

mockRoute(/^\/difal-sn\/regras$/, 'GET', (path) => {
  const p = paramsOf(path)
  const uf = p.get('uf')
  const instituto = p.get('instituto')
  const estado = p.get('estado')
  return {
    regras: REGRAS
      .filter((r) => !uf || r.uf_destino === uf)
      .filter((r) => !instituto || r.instituto === instituto)
      .filter((r) => !estado || r.estado_governanca === estado),
  }
})
