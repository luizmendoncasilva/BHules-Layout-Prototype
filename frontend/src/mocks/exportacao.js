import { mockRoute, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'

// Fixture de Exportação de Serviços (LC 123 art. 18 §14 — ISS/PIS/COFINS
// desonerados quando há ingresso de divisas): cadastro de exportador por
// subitem, tomadores conhecidos no exterior, alertas de vínculo societário
// (vincPrest 1–5) e a fila de revisões (EXP2-14) com decisão humana.
//
// Consumido via services/tributacaoService.js (fetchWithAuth) pelos cards
// de components/exportacao/* dentro da TributacaoServicosTab e pela visão
// geral RevisoesExportacaoVisaoGeral. POSTs leem o corpo do 3º argumento do
// handler, quando houver; sem corpo, usam valores padrão plausíveis.

function bodyOf(raw) {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return raw
}

function companyOf(id) {
  return MOCK_COMPANIES.find((c) => c.id === Number(id)) || MOCK_COMPANIES[0]
}

function normComp(comp) {
  const d = String(comp || '').replace(/\D/g, '')
  return d.length >= 6 ? d.slice(0, 6) : null
}

function compAnterior(comp) {
  const y = Number(comp.slice(0, 4))
  const m = Number(comp.slice(4, 6))
  return m === 1 ? `${y - 1}12` : `${y}${String(m - 1).padStart(2, '0')}`
}

const AGORA = () => new Date().toISOString()
const ANALISTA = 'analista-prototipo@bhub.ai'

// Empresas sem NFS-e de serviços não exportam — devolvem tudo vazio.
const EXPORTADORAS = MOCK_COMPANIES.filter((c) => c.nfse_servicos_enabled).map((c) => c.id)

// ─────────────────────────────────────────────────────────────────────────
// Estado em memória por empresa
// ─────────────────────────────────────────────────────────────────────────
let nextId = 500
const ESTADO = {}

function seedEmpresa(companyId) {
  if (!EXPORTADORAS.includes(companyId)) {
    return { cadastros: [], tomadores: [], alertas: [] }
  }
  const base = companyId * 100
  const cadastros = [
    // Versão antiga, substituída pela vigente.
    {
      id: base + 1,
      company_id: companyId,
      subitem_lc116: '01.07',
      competencia_inicio: '202601',
      competencia_fim: '202605',
      tributos_desonerados: ['ISS', 'PIS', 'COFINS'],
      forma_recebimento: 'PLATAFORMA_INTERNACIONAL',
      evidencia_recebimento: 'Extratos Payoneer jan–mai/2026',
      receita_mista: false,
      objeto_conferido_por: 'carlos.souza@bhub.ai',
      objeto_conferido_em: '2026-01-22T13:10:00Z',
      art2_iii_conferido_por: 'carlos.souza@bhub.ai',
      art2_iii_conferido_em: '2026-01-22T13:12:00Z',
      justificativa: 'Suporte técnico prestado a clientes nos EUA, pagamento via plataforma',
      criado_por: 'carlos.souza@bhub.ai',
      created_at: '2026-01-22T13:15:00Z',
      substituido_por_id: base + 2,
      revogado_em: null,
      motivo_revogacao: null,
    },
    // Vigente.
    {
      id: base + 2,
      company_id: companyId,
      subitem_lc116: '01.07',
      competencia_inicio: '202606',
      competencia_fim: null,
      tributos_desonerados: ['ISS', 'PIS', 'COFINS'],
      forma_recebimento: 'CONTRATO_CAMBIO',
      evidencia_recebimento: 'Contratos de câmbio Banco do Brasil nº 2026/0614 e 2026/0788 (Swift)',
      receita_mista: true,
      objeto_conferido_por: 'juliana.pereira@bhub.ai',
      objeto_conferido_em: '2026-06-10T10:02:00Z',
      art2_iii_conferido_por: 'ricardo.alves@bhub.ai',
      art2_iii_conferido_em: '2026-06-10T10:20:00Z',
      justificativa: 'Cliente passou a receber por contrato de câmbio; parte da receita do código é doméstica (mista)',
      criado_por: 'juliana.pereira@bhub.ai',
      created_at: '2026-06-10T10:25:00Z',
      substituido_por_id: null,
      revogado_em: null,
      motivo_revogacao: null,
    },
    // Revogado (subitem que deixou de ser exportado).
    {
      id: base + 3,
      company_id: companyId,
      subitem_lc116: '17.06',
      competencia_inicio: '202603',
      competencia_fim: '202607',
      tributos_desonerados: ['ISS', 'PIS', 'COFINS'],
      forma_recebimento: 'TRANSFERENCIA_INTERNACIONAL',
      evidencia_recebimento: 'Wise Business — transferências em EUR',
      receita_mista: false,
      objeto_conferido_por: 'ana.silva@bhub.ai',
      objeto_conferido_em: '2026-03-05T16:40:00Z',
      art2_iii_conferido_por: 'ana.silva@bhub.ai',
      art2_iii_conferido_em: '2026-03-05T16:41:00Z',
      justificativa: 'Campanha para cliente em Portugal',
      criado_por: 'ana.silva@bhub.ai',
      created_at: '2026-03-05T16:45:00Z',
      substituido_por_id: null,
      revogado_em: '2026-08-04T09:30:00Z',
      motivo_revogacao: 'Resultado da campanha verificado no Brasil — não configura exportação (art. 2º, par. único)',
    },
  ]

  const tomadores = [
    { nome: 'Northwind Analytics Inc.', apelidos_normalizados: ['NORTHWIND', 'NORTHWIND ANALYTICS'], nif: '84-2917365', pais: 'US', evidencia: 'Contrato MSA 2025 + invoices em USD' },
    { nome: 'Lisboa Digital Media, Lda.', apelidos_normalizados: ['LISBOA DIGITAL'], nif: 'PT514238907', pais: 'PT', evidencia: 'Contrato de prestação 2026/03, pagamentos SEPA' },
    { nome: 'Andes Retail SpA', apelidos_normalizados: ['ANDES RETAIL'], nif: '76.512.884-3', pais: 'CL', evidencia: 'Ordem de compra OC-7781 e comprovantes de câmbio' },
    { nome: 'Rheinwerk Software GmbH', apelidos_normalizados: ['RHEINWERK', 'RHEINWERK SOFTWARE'], nif: 'DE298471530', pais: 'DE', evidencia: 'Contrato de suporte anual em EUR' },
    { nome: 'Maple Leaf Logistics Ltd.', apelidos_normalizados: ['MAPLE LEAF'], nif: '873245619RC0001', pais: 'CA', evidencia: 'Statement of Work nº 12, pagamento via Swift' },
    { nome: 'Tokyo Kaizen Consulting K.K.', apelidos_normalizados: [], nif: null, pais: 'JP', evidencia: 'E-mail de contratação + recibo PayPal' },
  ].map((t, i) => ({
    id: base + 10 + i,
    company_id: companyId,
    ...t,
    criado_por: i % 2 ? 'ricardo.alves@bhub.ai' : 'juliana.pereira@bhub.ai',
    created_at: `2026-0${3 + (i % 5)}-1${i}T11:00:00Z`,
    revogado_em: null,
    motivo_revogacao: null,
  }))

  // Alertas de vínculo societário: só algumas empresas têm.
  const alertas = companyId % 2 === 0 || companyId === 3 || companyId === 1
    ? [
        {
          id: base + 30,
          company_id: companyId,
          competencia: '202609',
          valores_vinc_prest: ['4'],
          qtd_notas: 3,
          status: 'ABERTO',
          ciente_por: null,
          ciente_em: null,
          dono_configurado: companyId !== 6,
          destinatarios: companyId !== 6 ? ['celula-fiscal@bhub.ai', 'juliana.pereira@bhub.ai'] : [],
        },
        {
          id: base + 31,
          company_id: companyId,
          competencia: '202608',
          valores_vinc_prest: ['1', '3'],
          qtd_notas: 2,
          status: 'CIENTE',
          ciente_por: 'ricardo.alves@bhub.ai',
          ciente_em: '2026-09-12T15:04:00Z',
          dono_configurado: companyId !== 6,
          destinatarios: companyId !== 6 ? ['celula-fiscal@bhub.ai', 'juliana.pereira@bhub.ai'] : [],
        },
      ]
    : []

  return { cadastros, tomadores, alertas }
}

function estadoEmpresa(companyId) {
  const id = companyOf(companyId).id
  if (!ESTADO[id]) ESTADO[id] = seedEmpresa(id)
  return ESTADO[id]
}

function vivos(cadastros) {
  return cadastros.filter((c) => !c.revogado_em && !c.substituido_por_id)
}

function payloadEmpresa(companyId) {
  const company = companyOf(companyId)
  const e = estadoEmpresa(company.id)
  return {
    empresa: {
      id: company.id,
      razao_social: company.razao_social,
      cnpj: company.cnpj,
      regime_tributario: company.regime_tributario === 'SIMPLES_NACIONAL' ? 'SIMPLES' : company.regime_tributario,
    },
    cadastro_vivo: vivos(e.cadastros),
    historico: [...e.cadastros].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    tomadores: e.tomadores.filter((t) => !t.revogado_em),
    alertas_vinculo: e.alertas,
  }
}

function novoCadastro(companyId, body) {
  return {
    id: nextId++,
    company_id: companyId,
    subitem_lc116: body.subitem_lc116 || '01.07',
    competencia_inicio: normComp(body.competencia_inicio) || '202609',
    competencia_fim: null,
    tributos_desonerados: body.tributos_desonerados || ['ISS', 'PIS', 'COFINS'],
    forma_recebimento: body.forma_recebimento || 'CONTRATO_CAMBIO',
    evidencia_recebimento: body.evidencia_recebimento || 'Contrato de câmbio anexado ao chamado',
    receita_mista: Boolean(body.receita_mista),
    objeto_conferido_por: body.objeto_conferido_por || ANALISTA,
    objeto_conferido_em: body.objeto_conferido_em || AGORA(),
    art2_iii_conferido_por: body.art2_iii_conferido_por || ANALISTA,
    art2_iii_conferido_em: body.art2_iii_conferido_em || AGORA(),
    justificativa: body.justificativa || 'Cadastro de exportador',
    criado_por: ANALISTA,
    created_at: AGORA(),
    substituido_por_id: null,
    revogado_em: null,
    motivo_revogacao: null,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Rotas por empresa
// ─────────────────────────────────────────────────────────────────────────
mockRoute(/^\/companies\/(\d+)\/exportacao$/, 'GET', (_path, match) => payloadEmpresa(match[1]))

// Cadastro novo. Aceita também /exportacao/cadastro (sem empresa) por
// compatibilidade; nesse caso usa company_id do corpo ou a empresa 8.
mockRoute(/^(?:\/companies\/(\d+))?\/exportacao\/cadastro$/, 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const companyId = companyOf(match[1] || body.company_id || 8).id
  const e = estadoEmpresa(companyId)
  // Um único vivo por subitem: o anterior do mesmo código vira substituído.
  const cad = novoCadastro(companyId, body)
  for (const c of vivos(e.cadastros)) {
    if (c.subitem_lc116 === cad.subitem_lc116) {
      c.substituido_por_id = cad.id
      c.competencia_fim = compAnterior(cad.competencia_inicio)
    }
  }
  e.cadastros.push(cad)
  return cad
})

mockRoute(/^(?:\/companies\/(\d+))?\/exportacao\/cadastro$/, 'GET', (path, match) => {
  const companyId = match[1] || paramsOf(path).get('company_id') || 8
  return payloadEmpresa(companyId).cadastro_vivo
})

mockRoute(/^(?:\/companies\/(\d+))?\/exportacao\/cadastro\/(\d+)\/substituir$/, 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const cadastroId = Number(match[2])
  const companyId = companyOf(match[1] || Math.floor(cadastroId / 100) || 8).id
  const e = estadoEmpresa(companyId)
  const anterior = e.cadastros.find((c) => c.id === cadastroId)
  const novo = novoCadastro(companyId, { ...(anterior || {}), ...body })
  if (anterior) {
    anterior.substituido_por_id = novo.id
    anterior.competencia_fim = compAnterior(novo.competencia_inicio)
  }
  e.cadastros.push(novo)
  return novo
})

mockRoute(/^(?:\/companies\/(\d+))?\/exportacao\/cadastro\/(\d+)\/revogar$/, 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const cadastroId = Number(match[2])
  const companyId = companyOf(match[1] || Math.floor(cadastroId / 100) || 8).id
  const cad = estadoEmpresa(companyId).cadastros.find((c) => c.id === cadastroId)
  if (!cad) return { ok: false, detail: `Cadastro ${cadastroId} não encontrado` }
  Object.assign(cad, {
    revogado_em: AGORA(),
    competencia_fim: normComp(body.competencia_fim) || '202609',
    motivo_revogacao: body.motivo || 'Revogado pelo analista',
  })
  return cad
})

mockRoute(/^(?:\/companies\/(\d+))?\/exportacao\/tomadores$/, 'GET', (path, match) => {
  const companyId = match[1] || paramsOf(path).get('company_id') || 8
  return payloadEmpresa(companyId).tomadores
})

mockRoute(/^(?:\/companies\/(\d+))?\/exportacao\/tomadores$/, 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const companyId = companyOf(match[1] || body.company_id || 8).id
  const tomador = {
    id: nextId++,
    company_id: companyId,
    nome: body.nome || 'Blue Harbor Consulting LLC',
    apelidos_normalizados: (body.apelidos || []).map((a) => String(a).toUpperCase()),
    nif: body.nif || null,
    pais: (body.pais || 'US').toUpperCase(),
    evidencia: body.evidencia || 'Contrato assinado e comprovante de câmbio',
    criado_por: ANALISTA,
    created_at: AGORA(),
    revogado_em: null,
    motivo_revogacao: null,
  }
  estadoEmpresa(companyId).tomadores.push(tomador)
  return tomador
})

mockRoute(/^(?:\/companies\/(\d+))?\/exportacao\/tomadores\/(\d+)\/revogar$/, 'POST', (_path, match, rawBody) => {
  const tomadorId = Number(match[2])
  const companyId = companyOf(match[1] || Math.floor(tomadorId / 100) || 8).id
  const t = estadoEmpresa(companyId).tomadores.find((x) => x.id === tomadorId)
  if (!t) return { ok: false, detail: `Tomador ${tomadorId} não encontrado` }
  Object.assign(t, { revogado_em: AGORA(), motivo_revogacao: bodyOf(rawBody).motivo || 'Revogado pelo analista' })
  return t
})

mockRoute(/^(?:\/companies\/(\d+))?\/exportacao\/alertas-vinculo\/(\d+)\/ciente$/, 'POST', (_path, match) => {
  const alertaId = Number(match[2])
  const companyId = companyOf(match[1] || Math.floor(alertaId / 100) || 8).id
  const a = estadoEmpresa(companyId).alertas.find((x) => x.id === alertaId)
  if (!a) return { ok: false, detail: `Alerta ${alertaId} não encontrado` }
  Object.assign(a, { status: 'CIENTE', ciente_por: ANALISTA, ciente_em: AGORA() })
  return a
})

// ─────────────────────────────────────────────────────────────────────────
// Revisões de exportação (EXP2-14) — RevisaoItemOut
// ─────────────────────────────────────────────────────────────────────────
// Competência 09/2026: corte em 20/10, prazo = corte − 2 dias úteis (16/10).
// Hoje no protótipo é 13/10/2026 → 3 dias úteis restantes.
const VALORES_VAZIOS = {
  iss_tributacao: null, iss_exigibilidade: null, dest_cnpj: null, dest_razao_social: null,
  dest_nif: null, dest_pais: null, pais_resultado: null, tp_moeda: null, v_serv_moeda: null,
  md_prestacao: null, vinc_prest: null, codigo_servico_lc116: null,
}

function revisao(id, companyId, invoiceId, competencia, status, valores, extra = {}) {
  const ciclo = competencia === '202609'
    ? { corte: '2026-10-20', prazo: '2026-10-16', dias: 3 }
    : { corte: '2026-09-21', prazo: '2026-09-17', dias: 0 }
  const abertaEm = competencia === '202609' ? '2026-10-02T08:00:00Z' : '2026-09-02T08:00:00Z'
  const historico = [{ status: 'PENDENTE', por: 'sistema', tipo: 'SISTEMA', em: abertaEm, justificativa: null }]
  const base = {
    id,
    invoice_id: invoiceId,
    company_id: companyId,
    competencia,
    gatilho: valores.iss_exigibilidade === '4' ? 'LEIAUTE_ANTIGO_DECLARA_EXPORTACAO' : 'TOMADOR_EXTERIOR_SEM_CADASTRO',
    status,
    aberta_em: abertaEm,
    corte: ciclo.corte,
    prazo: ciclo.prazo,
    decisao_tipo: null,
    decidida_por: null,
    decidida_em: null,
    justificativa: null,
    expirada_em: status === 'EXPIRADA' ? `${ciclo.prazo}T23:59:59Z` : null,
    cadastro_inscrito_id: null,
    pendencia_retificacao_id: null,
    valores_nota: { ...VALORES_VAZIOS, ...valores },
    historico,
    dias_uteis_restantes: status === 'PENDENTE' ? ciclo.dias : 0,
    ...extra,
  }
  if (status === 'EXPIRADA') {
    historico.push({ status: 'EXPIRADA', por: 'sistema', tipo: 'SISTEMA', em: base.expirada_em, justificativa: null })
  }
  if (status.startsWith('DECIDIDA')) {
    historico.push({ status, por: base.decidida_por, tipo: 'HUMANO', em: base.decidida_em, justificativa: base.justificativa })
  }
  return base
}

const REVISOES = [
  revisao(1, 8, 9, '202609', 'PENDENTE', {
    dest_razao_social: 'Northwind Analytics Inc.', dest_nif: '84-2917365', dest_pais: 'US', pais_resultado: 'US',
    tp_moeda: 'USD', v_serv_moeda: '12500.00', md_prestacao: '1', codigo_servico_lc116: '01.07',
  }),
  revisao(2, 8, 10, '202609', 'PENDENTE', {
    iss_exigibilidade: '4', dest_razao_social: 'Stripe Payments UK Ltd', dest_pais: 'GB',
    codigo_servico_lc116: '01.03',
  }),
  revisao(3, 8, 39, '202609', 'PENDENTE', {
    dest_razao_social: 'Rheinwerk Software GmbH', dest_nif: 'DE298471530', dest_pais: 'DE', pais_resultado: 'DE',
    tp_moeda: 'EUR', v_serv_moeda: '8200.00', md_prestacao: '1', codigo_servico_lc116: '01.06', vinc_prest: '0',
  }),
  revisao(4, 1, 40, '202609', 'PENDENTE', {
    dest_razao_social: 'Lisboa Digital Media, Lda.', dest_nif: 'PT514238907', dest_pais: 'PT', pais_resultado: 'BR',
    tp_moeda: 'EUR', v_serv_moeda: '3900.00', md_prestacao: '1', codigo_servico_lc116: '17.06',
  }),
  revisao(5, 3, 11, '202609', 'PENDENTE', {
    iss_exigibilidade: '4', dest_razao_social: 'Andes Retail SpA', dest_nif: '76.512.884-3', dest_pais: 'CL',
    tp_moeda: 'USD', v_serv_moeda: '6100.00', codigo_servico_lc116: '17.01',
  }),
  revisao(6, 6, 12, '202609', 'DECIDIDA_INTERNO', {
    dest_cnpj: '33.444.555/0001-03', dest_razao_social: 'Perfumaria Cristal Distribuicao S.A.', dest_pais: 'BR',
    codigo_servico_lc116: '07.02',
  }, {
    decisao_tipo: 'HUMANO', decidida_por: 'juliana.pereira@bhub.ai', decidida_em: '2026-10-06T14:20:00Z',
    justificativa: 'Tomador é brasileiro; a nota marcou exportação por engano no leiaute antigo',
  }),
  revisao(7, 8, 41, '202609', 'DECIDIDA_EXPORTACAO', {
    dest_razao_social: 'Maple Leaf Logistics Ltd.', dest_nif: '873245619RC0001', dest_pais: 'CA', pais_resultado: 'CA',
    tp_moeda: 'CAD', v_serv_moeda: '15800.00', md_prestacao: '1', codigo_servico_lc116: '01.07',
  }, {
    decisao_tipo: 'HUMANO', decidida_por: 'ricardo.alves@bhub.ai', decidida_em: '2026-10-08T10:05:00Z',
    justificativa: 'Contrato de câmbio nº 2026/0912 confirma ingresso de divisas', cadastro_inscrito_id: 802,
  }),
  revisao(8, 3, 42, '202608', 'EXPIRADA', {
    dest_razao_social: 'Tokyo Kaizen Consulting K.K.', dest_pais: 'JP',
    tp_moeda: 'JPY', v_serv_moeda: '1450000.00', md_prestacao: '1', codigo_servico_lc116: '17.01',
  }),
  revisao(9, 8, 9, '202608', 'DECIDIDA_EXPORTACAO', {
    dest_razao_social: 'Northwind Analytics Inc.', dest_nif: '84-2917365', dest_pais: 'US', pais_resultado: 'US',
    tp_moeda: 'USD', v_serv_moeda: '11800.00', md_prestacao: '1', codigo_servico_lc116: '01.07',
  }, {
    decisao_tipo: 'HUMANO', decidida_por: 'carlos.souza@bhub.ai', decidida_em: '2026-09-15T16:40:00Z',
    justificativa: 'Tomador já conhecido; Swift anexado',
  }),
  revisao(10, 1, 10, '202608', 'EXPIRADA', {
    iss_exigibilidade: '4', dest_razao_social: 'Euro Software GmbH', dest_nif: 'DE334455667', dest_pais: 'DE',
    tp_moeda: 'EUR', v_serv_moeda: '4200.00', codigo_servico_lc116: '01.06',
  }),
]

mockRoute(/^\/exportacao\/revisoes$/, 'GET', (path) => {
  const p = paramsOf(path)
  const companyId = p.get('company_id')
  const competencia = normComp(p.get('competencia'))
  const status = p.get('status')
  return REVISOES
    .filter((r) => !companyId || String(r.company_id) === String(companyId))
    .filter((r) => !competencia || r.competencia === competencia)
    .filter((r) => !status || r.status === status)
    .sort((a, b) => a.prazo.localeCompare(b.prazo) || a.id - b.id)
    .map((r) => ({ ...r, historico: [...r.historico] }))
})

mockRoute(/^\/exportacao\/revisoes\/(\d+)\/decidir$/, 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const rev = REVISOES.find((r) => r.id === Number(match[1]))
  if (!rev) return { ok: false, detail: `Revisão ${match[1]} não encontrada` }
  const escolha = body.escolha || 'EXPORTACAO'
  const novo = escolha === 'EXPORTACAO' ? 'DECIDIDA_EXPORTACAO' : 'DECIDIDA_INTERNO'
  // Decisão "exportação" depois do corte gera pendência de retificação.
  const tardia = rev.status === 'EXPIRADA' || rev.expirada_em != null
  let cadastroId = rev.cadastro_inscrito_id
  if (body.inscrever) {
    const cad = novoCadastro(rev.company_id, body.inscrever)
    estadoEmpresa(rev.company_id).cadastros.push(cad)
    cadastroId = cad.id
  }
  Object.assign(rev, {
    status: novo,
    decisao_tipo: 'HUMANO',
    decidida_por: ANALISTA,
    decidida_em: AGORA(),
    justificativa: body.justificativa || 'Decisão registrada no protótipo',
    cadastro_inscrito_id: cadastroId,
    pendencia_retificacao_id: tardia && novo === 'DECIDIDA_EXPORTACAO' ? 700 + rev.id : rev.pendencia_retificacao_id,
    dias_uteis_restantes: 0,
  })
  rev.historico.push({ status: novo, por: ANALISTA, tipo: 'HUMANO', em: rev.decidida_em, justificativa: rev.justificativa })
  return { ...rev, historico: [...rev.historico] }
})
