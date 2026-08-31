import { mockRoute, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'
import { getInvoiceById, getInvoiceItemsById } from './invoices'

// Fixtures de Escrituração (novo motor) e Validação (legado/NFS-e) —
// alimenta EscrituracaoTab, DetailView, NfseRetentionTab, NfseReinfCrossTab
// e os dashboards de métricas em src/components (financeiro, acurácia,
// vetorial, legislação, A/B reranking).

let seed = 7
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

const FUNDAMENTACOES_POOL = [
  { norma: 'RICMS/SP', dispositivo: 'Art. 61', fonte: 'LEGISLACAO_VETORIAL', texto_resumido: 'Disciplina o crédito do imposto relativo a mercadoria destinada a comercialização.' },
  { norma: 'Convênio ICMS 52/2017', dispositivo: 'Cláusula 3ª', fonte: 'TABELA_REFERENCIA', texto_resumido: 'Regras de substituição tributária nas operações interestaduais.' },
  { norma: 'Lei Kandir (LC 87/96)', dispositivo: 'Art. 20', fonte: 'LEGISLACAO_VETORIAL', texto_resumido: 'Direito ao crédito do imposto anteriormente cobrado em operações de entrada.' },
  { norma: 'RIR/2018', dispositivo: 'Art. 714', fonte: 'TABELA_REFERENCIA', texto_resumido: 'Hipóteses de retenção na fonte de IRRF sobre serviços prestados por pessoa jurídica.' },
]

// ── Constrói o resultado completo de escrituração p/ uma nota (formato
// consumido por EscrituracaoTab.jsx: perfil/validacao_formal/sugestoes/
// resumo/confianca_geral/...). ──────────────────────────────────────────
function buildEscrituracaoResult(invoiceId) {
  const invoice = getInvoiceById(invoiceId)
  const items = getInvoiceItemsById(invoiceId)
  const company = MOCK_COMPANIES.find((c) => c.id === invoice.company_id)

  const bloqueada = invoice.status_analise === 'BLOQUEADO'
  const requerRevisao = invoice.status_analise === 'REQUER_REVISAO'

  let totalDivergencias = 0
  let itensComDivergencia = 0
  let itensParaRevisao = 0
  let totalCreditoIcms = 0
  let totalCreditoPis = 0
  let totalCreditoCofins = 0
  let totalCreditoIpi = 0

  const sugestoes = items.map((it, idx) => {
    const hasDivergencia = requerRevisao && idx === 0
    const divergencias = []
    if (hasDivergencia) {
      divergencias.push({
        campo: 'cfop',
        severidade: 'ALERTA',
        valor_emitente: it.cfop_emitente,
        valor_sugerido: it.cfop_entrada,
        descricao: 'CFOP de entrada sugerido diverge do CFOP declarado pelo emitente.',
      })
      totalDivergencias += 1
      itensComDivergencia += 1
    }
    if (bloqueada && idx === 0) {
      divergencias.push({
        campo: 'cst_icms',
        severidade: 'CRITICO',
        valor_emitente: it.cst_icms,
        valor_sugerido: '00',
        descricao: 'CST ICMS incompatível com o regime tributário cadastrado do destinatário.',
      })
      totalDivergencias += 1
      itensComDivergencia += 1
    }

    const temCreditoIcms = it.aliq_icms > 0 && !bloqueada
    const creditoIcmsValor = temCreditoIcms ? Number(it.vl_icms) : 0
    const creditoPisValor = !bloqueada ? Number((it.vl_item * 0.0165).toFixed(2)) : 0
    const creditoCofinsValor = !bloqueada ? Number((it.vl_item * 0.076).toFixed(2)) : 0
    const creditoIpiValor = 0

    totalCreditoIcms += creditoIcmsValor
    totalCreditoPis += creditoPisValor
    totalCreditoCofins += creditoCofinsValor
    totalCreditoIpi += creditoIpiValor

    if (requerRevisao || bloqueada) itensParaRevisao += idx === 0 ? 1 : 0

    return {
      invoice_item_id: it.id,
      num_item: it.num_item,
      descricao: it.descr_compl,
      ncm: it.ncm,
      valor_item: it.vl_item,
      finalidade: pick(['REVENDA', 'MATERIA_PRIMA', 'USO_CONSUMO']),
      finalidade_fonte: pick(['SPED_HISTORICO', 'CADASTRO_PRODUTO', 'LLM']),
      cfop_emitente: it.cfop_emitente,
      cfop_entrada: it.cfop_entrada,
      cst_icms_emitente: it.cst_icms,
      cst_icms_entrada: it.cst_icms,
      cst_pis_emitente: it.cst_pis,
      cst_pis_entrada: it.cst_pis,
      cst_cofins_emitente: it.cst_cofins,
      cst_cofins_entrada: it.cst_cofins,
      aliq_icms_emitente: it.aliq_icms,
      credito_icms: { tem_direito: temCreditoIcms, valor: creditoIcmsValor, aliquota: it.aliq_icms, motivo_vedacao: temCreditoIcms ? null : 'Alíquota zero ou item de uso/consumo' },
      credito_pis: { tem_direito: !bloqueada, valor: creditoPisValor, aliquota: 1.65, motivo_vedacao: bloqueada ? 'Nota bloqueada' : null },
      credito_cofins: { tem_direito: !bloqueada, valor: creditoCofinsValor, aliquota: 7.6, motivo_vedacao: bloqueada ? 'Nota bloqueada' : null },
      credito_ipi: { tem_direito: false, valor: 0, aliquota: 0, motivo_vedacao: 'Não contribuinte de IPI' },
      difal_devido: invoice.emit_uf !== invoice.dest_uf && idx === 0,
      difal_valor: invoice.emit_uf !== invoice.dest_uf ? Number((it.vl_item * 0.03).toFixed(2)) : 0,
      difal_aliq_interna: 18,
      difal_aliq_interestadual: 12,
      tratamento_st: 'SEM_ST',
      st_valor_retido: 0,
      confianca_geral: hasDivergencia ? 0.62 : 0.95,
      nivel_confianca: hasDivergencia ? 'MEDIO' : 'ALTO',
      divergencias,
      fundamentacoes: [FUNDAMENTACOES_POOL[idx % FUNDAMENTACOES_POOL.length]],
    }
  })

  const confiancaGeral = bloqueada ? 0.3 : requerRevisao ? 0.65 : 0.93
  const nivelConfianca = bloqueada ? 'BAIXO' : requerRevisao ? 'MEDIO' : 'ALTO'

  return {
    invoice_id: invoice.id,
    perfil: { regime_tributario: company?.regime_tributario || 'LUCRO_PRESUMIDO' },
    validacao_formal: {
      valido: !bloqueada,
      bloqueante: bloqueada,
      problemas: bloqueada ? ['NF-e com CST ICMS incompatível com o regime tributário do destinatário.'] : [],
    },
    confianca_geral: confiancaGeral,
    nivel_confianca: nivelConfianca,
    total_divergencias: totalDivergencias,
    requer_revisao_humana: requerRevisao || bloqueada,
    etapas_executadas: ['VALIDACAO_FORMAL', 'CLASSIFICACAO_ITENS', 'CALCULO_CREDITOS', 'ANALISE_DIFAL', 'BUSCA_VETORIAL_LEGISLACAO'],
    erros: [],
    resumo: {
      valor_total_nf: invoice.vl_doc,
      total_credito_icms: Number(totalCreditoIcms.toFixed(2)),
      total_credito_pis: Number(totalCreditoPis.toFixed(2)),
      total_credito_cofins: Number(totalCreditoCofins.toFixed(2)),
      total_credito_ipi: Number(totalCreditoIpi.toFixed(2)),
      total_creditos: Number((totalCreditoIcms + totalCreditoPis + totalCreditoCofins + totalCreditoIpi).toFixed(2)),
      total_difal: sugestoes.reduce((s, x) => s + (x.difal_valor || 0), 0),
      total_st_retido: 0,
      itens_com_divergencia: itensComDivergencia,
      itens_para_revisao: itensParaRevisao,
    },
    sugestoes,
  }
}

mockRoute(/^\/escrituracao\/(\d+)$/, 'GET', (_path, match) => buildEscrituracaoResult(match[1]))

mockRoute(/^\/escrituracao\/run\/(\d+)$/, 'POST', (_path, match) => buildEscrituracaoResult(match[1]))

mockRoute('/escrituracao/run-batch', 'POST', () => ({ ok: true, total_processed: 3, total_errors: 0 }))

mockRoute(/^\/escrituracao\/(\d+)\/feedback$/, 'POST', () => ({ ok: true }))

mockRoute(/^\/escrituracao\/(\d+)\/confirmar-envio$/, 'POST', () => ({ ok: true }))

mockRoute(/^\/escrituracao\/(\d+)\/sped-export$/, 'GET', () => ({ ok: true, linhas: [] }))

mockRoute('/escrituracao/feedback/batch', 'POST', () => ({ ok: true, total_processed: 1, total_errors: 0 }))

mockRoute(/^\/validation\/reprocess\/(\d+)$/, 'POST', () => ({ ok: true, total_invoices: randInt(5, 40) }))

mockRoute(/^\/validation\/reprocess-async\/(\d+)$/, 'POST', () => ({ job_id: `job-${Date.now()}`, total_invoices: randInt(5, 40) }))

mockRoute(/^\/validation\/reprocess-nfse-async\/(\d+)$/, 'POST', () => ({ job_id: `job-nfse-${Date.now()}`, total_invoices: randInt(5, 40) }))

mockRoute(/^\/validation\/reprocess-status\/([^/]+)$/, 'GET', (_path, match) => ({
  job_id: match[1],
  status: 'COMPLETED',
  processed: 12,
  errors: 0,
  total_invoices: 12,
}))

mockRoute(/^\/validation\/reprocess-cancel\/([^/]+)$/, 'POST', () => ({ ok: true }))

mockRoute('/validation/escrituracao/undo', 'POST', () => ({ ok: true }))

mockRoute(/^\/validation\/run\/(\d+)$/, 'POST', (_path, match) => buildEscrituracaoResult(match[1]))

mockRoute(/^\/nfse\/validation\/run\/(\d+)$/, 'POST', () => ({ ok: true }))

mockRoute('/nfse/validation/run-batch', 'POST', () => ({ ok: true, total_processed: 2, total_errors: 0 }))

mockRoute('/nfse/validation/run-all', 'POST', () => ({ ok: true, total_processed: 8, total_errors: 0 }))

// ── Validation / NFS-e analysis (retenções + REINF) ─────────────────────
function buildValidationAnalysis(invoiceId) {
  const invoice = getInvoiceById(invoiceId)
  const base = invoice.vl_doc
  const irrfAplicavel = base > 666
  const inssAplicavel = rand() > 0.6
  const issRetido = rand() > 0.5

  const irrfEsperado = irrfAplicavel ? Number((base * 0.015).toFixed(2)) : 0
  const irrfNfse = irrfAplicavel ? Number((irrfEsperado * (rand() > 0.75 ? 0.7 : 1)).toFixed(2)) : 0

  const pisEsperado = Number((base * 0.0065).toFixed(2))
  const cofinsEsperado = Number((base * 0.03).toFixed(2))
  const csllEsperado = Number((base * 0.01).toFixed(2))

  const inssEsperado = inssAplicavel ? Number((base * 0.11).toFixed(2)) : 0
  const issAliquota = pick([2, 3, 4, 5])
  const issEsperado = Number((base * issAliquota / 100).toFixed(2))

  const retencoes = {
    irrf: { base, aliquota: 1.5, valor_esperado: irrfEsperado, valor_nfse: irrfNfse, aplicavel: irrfAplicavel },
    pcc: { base, aplicavel: true, pis_nfse: pisEsperado, cofins_nfse: cofinsEsperado, csll_nfse: csllEsperado, valor_esperado: Number((pisEsperado + cofinsEsperado + csllEsperado).toFixed(2)), valor_nfse: Number((pisEsperado + cofinsEsperado + csllEsperado).toFixed(2)) },
    inss: { base, aplicavel: inssAplicavel, valor_esperado: inssEsperado, valor_nfse: inssEsperado },
    iss: { base, aliquota: issAliquota, valor_esperado: issEsperado, valor_nfse: issEsperado, retido_tomador: issRetido },
  }

  const hasR4020 = rand() > 0.4
  const hasR2010 = inssAplicavel && rand() > 0.3

  const reinf = {
    r4020: hasR4020 ? {
      eventos: randInt(1, 2),
      natureza_rendimento: '10015',
      vl_rendimento_bruto: base,
      vl_ir: irrfEsperado,
      vl_pis: pisEsperado,
      vl_cofins: cofinsEsperado,
      vl_csll: csllEsperado,
      vl_pcc: Number((pisEsperado + cofinsEsperado + csllEsperado).toFixed(2)),
    } : {
      eventos: 0,
      r4020_suggestion: {
        evento: 'R-4020',
        periodo_apuracao: invoice.dt_doc.slice(0, 7),
        natureza_rendimento: '10015',
        natureza_descricao: 'Prestação de serviços com retenção de IR e CSLL/PIS/COFINS',
        cnpj_beneficiario: invoice.emit_cnpj,
        vl_rendimento_bruto: base,
        vl_ir: irrfEsperado,
        vl_pcc: Number((pisEsperado + cofinsEsperado + csllEsperado).toFixed(2)),
      },
    },
    r2010: hasR2010 ? {
      eventos: 1,
      vl_ret_inss: inssEsperado,
    } : { eventos: 0 },
  }

  const totalRetencoes = irrfNfse + retencoes.pcc.valor_nfse + inssEsperado + (issRetido ? issEsperado : 0)

  return {
    invoice_id: invoice.id,
    retencoes,
    reinf,
    classification: {
      codigo_servico: '0107',
      descricao_servico: 'Suporte técnico em informática',
      municipio_incidencia: invoice.emit_municipio,
      regime_prestador: pick(['LUCRO_PRESUMIDO', 'SIMPLES_NACIONAL', 'LUCRO_REAL']),
      is_simples: rand() > 0.6,
      is_mei: false,
      is_pf: false,
    },
    valor_liquido: {
      valor_bruto: base,
      valor_deducoes: 0,
      total_retencoes: Number(totalRetencoes.toFixed(2)),
      valor_liquido: Number((base - totalRetencoes).toFixed(2)),
    },
    darf_suggestions: irrfAplicavel ? [
      { codigo_darf: '1708', tributo: 'IRRF', valor: irrfEsperado, vencimento: invoice.dt_doc },
      { codigo_darf: '5952', tributo: 'PIS/COFINS/CSLL', valor: retencoes.pcc.valor_esperado, vencimento: invoice.dt_doc },
    ] : [],
    divergencias: irrfNfse !== irrfEsperado && irrfAplicavel ? ['Valor de IRRF retido na NFS-e diverge do valor calculado pelo motor.'] : [],
  }
}

mockRoute('/validation/results', 'GET', (path) => {
  const params = paramsOf(path)
  const invoiceId = params.get('invoice_id')
  return { items: invoiceId ? [{ id: 1, invoice_id: Number(invoiceId), rule_code: 'CONSISTENCIA_FISCAL', status: 'OK' }] : [], total: invoiceId ? 1 : 0 }
})

mockRoute(/^\/validation\/analysis\/(\d+)$/, 'GET', (_path, match) => buildValidationAnalysis(match[1]))

mockRoute(/^\/nfse\/validation\/analysis\/(\d+)$/, 'GET', (_path, match) => buildValidationAnalysis(match[1]))

mockRoute(/^\/nfse\/validation\/alerts\/(\d+)$/, 'GET', () => ({ alerts: [] }))

mockRoute('/nfse/validation/dashboard/stats', 'GET', () => ({
  total_notas_analisadas: 42,
  total_retencao_irrf: 18540.32,
  total_retencao_pis: 2140.11,
  total_retencao_cofins: 9884.67,
  total_retencao_csll: 3294.89,
  total_retencao_inss: 15230.44,
  total_retencao_iss: 22110.90,
  execucoes_ultimos_30_dias: 128,
  taxa_divergencia: 0.14,
}))

// ── Métricas / dashboards ────────────────────────────────────────────────
mockRoute('/escrituracao/metrics/dashboard', 'GET', () => ({
  total_notas_escrituradas: 41,
  total_notas_pendentes: 19,
  confianca_media: 0.87,
  taxa_automacao: 0.79,
  tempo_medio_processamento_s: 2.3,
  execucoes_ultimos_30_dias: 210,
  por_nivel_confianca: { ALTO: 32, MEDIO: 12, BAIXO: 5 },
}))

mockRoute('/escrituracao/metrics/financial', 'GET', () => ({
  total_credito_icms: 84210.55,
  total_credito_pis: 12044.30,
  total_credito_cofins: 55832.12,
  total_credito_ipi: 3120.00,
  total_creditos: 155206.97,
  total_difal: 6231.40,
  byCompany: MOCK_COMPANIES.filter((c) => c.nfe_entrada_enabled).map((c, idx) => ({
    company_id: c.id,
    razao_social: c.razao_social,
    total_credito_icms: Number((15000 + idx * 3200.5).toFixed(2)),
    total_credito_pis: Number((2000 + idx * 410.2).toFixed(2)),
    total_credito_cofins: Number((9000 + idx * 1880.7).toFixed(2)),
    total_credito_ipi: Number((idx % 2 === 0 ? 500 + idx * 90 : 0).toFixed(2)),
    total_creditos: Number((26500 + idx * 5580).toFixed(2)),
    total_items: 20 + idx * 8,
    total_invoices: 6 + idx * 2,
  })),
}))

mockRoute('/escrituracao/metrics/accuracy', 'GET', () => ({
  acuracia_geral: 0.91,
  acuracia_cfop: 0.94,
  acuracia_cst_icms: 0.89,
  acuracia_finalidade: 0.92,
  total_feedbacks: 87,
  feedbacks_positivos: 79,
  feedbacks_negativos: 8,
}))

mockRoute('/escrituracao/metrics/vetorial', 'GET', () => ({
  total_buscas: 512,
  tempo_medio_busca_ms: 145,
  taxa_acerto_top1: 0.72,
  taxa_acerto_top5: 0.94,
  fontes_mais_usadas: [
    { fonte: 'SPED_HISTORICO', pct: 0.38 },
    { fonte: 'LEGISLACAO_VETORIAL', pct: 0.29 },
    { fonte: 'CADASTRO_PRODUTO', pct: 0.18 },
    { fonte: 'LLM', pct: 0.15 },
  ],
}))

// NOTA: '/escrituracao/metrics/legislation-effectiveness', '/escrituracao/
// metrics/ab-reranking' e '/metrics/bhules' já são registrados por
// src/mocks/bhubtax.js (escrito concorrentemente) — não duplicar aqui pra
// evitar rotas mortas/comportamento dependente da ordem de import.
