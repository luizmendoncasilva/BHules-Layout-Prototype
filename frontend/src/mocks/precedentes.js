import { mockRoute, paramsOf } from './registry'
import { MOCK_COMPANIES } from './companies'
import { getInvoiceById, getInvoiceItemsById } from './invoices'
import { addAuditEvent } from './audit'

// Fixture de precedentes (aprendizado do motor) e da sua revogação lógica:
//  - NF-e por chave emitente × NCM (RevokePrecedenteModal);
//  - por NOTA e em LOTE (RevokePrecedentesNotasModal, PREC-02/PQC-08);
//  - NFS-e v2 por prestador × código LC 116 (NfsePrecedentesPanel +
//    RevokeNfsePrecedenteModal);
//  - "Corrigir aprendizado" em nota já enviada (PQC-10).
// Revogar nunca apaga: marca revogado_em/motivo/autor e reenfileira o raio
// de notas não enviadas para reprocesso, sem publicar no Onvio.

function bodyOf(raw) {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return raw
}

function onlyDigits(s) {
  return String(s || '').replace(/\D/g, '')
}

const AGORA = () => new Date().toISOString()
const ANALISTA = 'analista-prototipo@bhub.ai'

function companyOf(id) {
  return MOCK_COMPANIES.find((c) => c.id === Number(id)) || MOCK_COMPANIES[0]
}

// Raio determinístico (nº de notas que usam a chave) a partir de uma string.
function raioDe(chave, min = 0, max = 40) {
  let h = 0
  for (const ch of String(chave)) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff
  return min + (h % (max - min + 1))
}

// ─────────────────────────────────────────────────────────────────────────
// NF-e: precedente integrado por empresa × emitente × NCM (um por CFOP)
// ─────────────────────────────────────────────────────────────────────────
const NFE_REVOGADOS = new Set() // `${companyId}|${emitente}|${ncm}`

mockRoute(/^\/companies\/(\d+)\/precedentes\/revoke-preview$/, 'GET', (path, match) => {
  const p = paramsOf(path)
  const emitente = onlyDigits(p.get('emitente_cnpj'))
  const ncm = onlyDigits(p.get('ncm'))
  const key = `${match[1]}|${emitente}|${ncm}`
  // NCMs começando em 9 não têm precedente no fixture (cobre o caso "não encontrado").
  const found = Boolean(emitente && ncm && !ncm.startsWith('96'))
  const linhas = found ? 1 + (raioDe(key) % 3) : 0
  const notas = found ? raioDe(key, 0, 24) : 0
  return {
    found,
    ja_revogado: NFE_REVOGADOS.has(key),
    company_id: Number(match[1]),
    emitente_cnpj: emitente,
    ncm,
    linhas_vigentes: NFE_REVOGADOS.has(key) ? 0 : linhas,
    affected_invoices: NFE_REVOGADOS.has(key) ? 0 : notas,
    affected_items: NFE_REVOGADOS.has(key) ? 0 : notas + Math.floor(notas / 3),
  }
})

mockRoute(/^\/companies\/(\d+)\/precedentes\/revoke$/, 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const emitente = onlyDigits(body.emitente_cnpj) || '11222333000181'
  const ncm = onlyDigits(body.ncm) || '33049910'
  const key = `${match[1]}|${emitente}|${ncm}`
  const linhas = 1 + (raioDe(key) % 3)
  const notas = raioDe(key, 0, 24)
  NFE_REVOGADOS.add(key)
  addAuditEvent({
    event_type: 'precedente.revogado',
    actor: ANALISTA,
    actor_type: 'analyst',
    invoice_id: null,
    payload: { company_id: Number(match[1]), emitente_cnpj: emitente, ncm, motivo: body.motivo || null, linhas_revogadas: linhas },
  })
  return {
    ok: true,
    linhas_revogadas: linhas,
    reprocessed_invoices: notas,
    reprocessed_items: notas + Math.floor(notas / 3),
    revogado_por: ANALISTA,
    revogado_em: AGORA(),
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Revogação por NOTA / em LOTE (rota global — o lote mistura empresas)
// ─────────────────────────────────────────────────────────────────────────
const FINALIDADES = ['REVENDA', 'USO_CONSUMO', 'MATERIA_PRIMA', 'ATIVO_IMOBILIZADO']
const INATIVADOS = new Set() // chaves de precedente/tratamento já revogadas no lote

function chavesDaNota(invoiceId) {
  const inv = getInvoiceById(invoiceId)
  const emitente = onlyDigits(inv.emit_cnpj)
  if (inv.cod_mod === 'NFSE') {
    return {
      nfe: [],
      nfse: [{ id: 7000 + inv.id, company_id: inv.company_id, prestador_cnpj: emitente, codigo_servico_lc116: ['17.01', '01.07', '07.02'][inv.id % 3] }],
      auditado: [],
    }
  }
  const itens = getInvoiceItemsById(inv.id)
  const nfe = []
  const auditado = []
  itens.slice(0, 3).forEach((it, i) => {
    // Precedente sem CFOP = "todas (um por CFOP)".
    nfe.push([inv.company_id, emitente, it.ncm, i === 0 ? null : it.cfop_emitente])
    if (i === 1) {
      auditado.push({
        company_id: inv.company_id,
        emitente_cnpj: emitente,
        cfop_emitente: it.cfop_emitente,
        ncm: it.ncm,
        uf_origem: inv.emit_uf,
        uf_destino: inv.dest_uf,
        finalidade: FINALIDADES[(inv.id + i) % FINALIDADES.length],
      })
    }
  })
  return { nfe, nfse: [], auditado }
}

function chaveTxt(c) {
  return Array.isArray(c) ? c.join('|') : JSON.stringify(c)
}

function uniq(list) {
  const seen = new Set()
  return list.filter((c) => {
    const k = chaveTxt(c)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function invoiceIdsDe(path) {
  const p = paramsOf(path)
  const ids = p.getAll('invoice_ids').flatMap((v) => v.split(',')).map(Number).filter(Boolean)
  return ids.length ? ids : [1]
}

function previewLote(invoiceIds) {
  const todas = invoiceIds.map(chavesDaNota)
  const nfe = uniq(todas.flatMap((c) => c.nfe)).filter((c) => !INATIVADOS.has(chaveTxt(c)))
  const nfse = uniq(todas.flatMap((c) => c.nfse)).filter((c) => !INATIVADOS.has(chaveTxt(c)))
  const auditado = uniq(todas.flatMap((c) => c.auditado)).filter((c) => !INATIVADOS.has(chaveTxt(c)))
  const raioPrecedente = nfe.reduce((a, c) => a + raioDe(chaveTxt(c), 1, 9), 0)
  const raioAuditado = auditado.reduce((a, c) => a + raioDe(chaveTxt(c), 1, 6), 0)
  const raioNfse = nfse.reduce((a, c) => a + raioDe(chaveTxt(c), 2, 12), 0)
  // Uma nota nos dois raios conta uma vez.
  const unido = Math.max(raioPrecedente, Math.round((raioPrecedente + raioAuditado) * 0.8))
  const enviadas = invoiceIds.filter((id) => getInvoiceById(id).envio_dominio_status === 'ENVIADO')
  return {
    invoice_ids: invoiceIds,
    chaves: { nfe, nfse, auditado },
    raio_precedente: raioPrecedente,
    raio_auditado: raioAuditado,
    raio_total_unido: unido,
    raio_nfse: raioNfse,
    notas_enviadas: enviadas,
    reprocesso: [
      { tipo: 'NFE', total: unido },
      { tipo: 'NFSE', total: raioNfse },
    ].filter((g) => g.total > 0),
  }
}

mockRoute(/^\/precedentes\/revoke-by-invoices\/preview$/, 'GET', (path) => previewLote(invoiceIdsDe(path)))

mockRoute(/^\/precedentes\/revoke-by-invoices$/, 'POST', (_path, _match, rawBody) => {
  const body = bodyOf(rawBody)
  const invoiceIds = (body.invoice_ids || []).map(Number).filter(Boolean)
  const ids = invoiceIds.length ? invoiceIds : [1]
  const todas = ids.map(chavesDaNota)
  const revogadas = { nfe: [], nfse: [] }
  const ignoradas = { nfe: [], nfse: [], auditado: [] }
  const tratamentos = []
  for (const tipo of ['nfe', 'nfse', 'auditado']) {
    for (const c of uniq(todas.flatMap((x) => x[tipo]))) {
      const k = chaveTxt(c)
      if (INATIVADOS.has(k)) {
        ignoradas[tipo].push({ chave: c, motivo: tipo === 'auditado' ? 'ja_inativo' : 'ja_revogado' })
        continue
      }
      INATIVADOS.add(k)
      if (tipo === 'auditado') tratamentos.push(c)
      else revogadas[tipo].push(c)
    }
  }
  const naoEnviadas = ids.filter((id) => getInvoiceById(id).envio_dominio_status !== 'ENVIADO')
  for (const id of ids) {
    addAuditEvent({
      event_type: 'precedente.revogado',
      actor: ANALISTA,
      actor_type: 'analyst',
      invoice_id: id,
      payload: { origem: 'lote', motivo: body.motivo || null },
    })
  }
  return {
    revogadas,
    tratamentos_inativados: tratamentos,
    ignoradas,
    jobs: naoEnviadas.length
      ? [{ job_id: `reproc-${Date.now()}`, invoice_ids: naoEnviadas, enviado: true }]
      : [],
    revogado_por: ANALISTA,
    revogado_em: AGORA(),
  }
})

// ─────────────────────────────────────────────────────────────────────────
// NFS-e v2: precedente por empresa × prestador × código LC 116
// ─────────────────────────────────────────────────────────────────────────
const PRESTADORES_NFSE = [
  { cnpj: '41258963000174', nome: 'Contabilidade Exata Servicos Ltda', municipio_ibge: '3550308', codigo: '17.19' },
  { cnpj: '52369874000165', nome: 'Seguranca Patrimonial Vigia Ltda', municipio_ibge: '3304557', codigo: '11.02' },
  { cnpj: '63470985000156', nome: 'Limpeza Brilho Total Ltda', municipio_ibge: '3106200', codigo: '07.10' },
  { cnpj: '74581096000147', nome: 'Advocacia Ramos e Teixeira', municipio_ibge: '4106902', codigo: '17.14' },
  { cnpj: '85692107000138', nome: 'Alfa Consultoria em TI Ltda', municipio_ibge: '3550308', codigo: '01.07' },
]

const RETENCOES_POR_CODIGO = {
  '17.19': { irrf: true, pcc: true, inss: false, iss: false },
  '11.02': { irrf: true, pcc: true, inss: true, iss: true },
  '07.10': { irrf: true, pcc: true, inss: true, iss: true },
  '17.14': { irrf: true, pcc: true, inss: false, iss: false },
  '01.07': { irrf: true, pcc: true, inss: false, iss: false },
}

const NFSE_PREC = []
let precSeq = 7100

function precedenteNfse(companyId, prest, over = {}) {
  precSeq += 1
  const conf = 0.78 + (raioDe(`${companyId}${prest.cnpj}`) % 20) / 100
  return {
    id: precSeq,
    company_id: companyId,
    prestador_cnpj: prest.cnpj,
    prestador_razao_social: prest.nome,
    codigo_servico_lc116: prest.codigo,
    municipio_ibge: prest.municipio_ibge,
    retencoes: RETENCOES_POR_CODIGO[prest.codigo] || { irrf: true, pcc: true, inss: false, iss: false },
    confidence: Number(Math.min(conf, 0.99).toFixed(2)),
    criado_por: 'motor',
    criado_em: '2026-08-21T03:12:00Z',
    vigente: true,
    revogado_em: null,
    revogado_por: null,
    motivo_revogacao: null,
    substituido_por_id: null,
    ...over,
  }
}

function seedNfse(companyId) {
  if (NFSE_PREC.some((p) => p.company_id === companyId)) return
  PRESTADORES_NFSE.forEach((prest, i) => {
    // Para alguns prestadores há histórico: um substituído e um revogado.
    if (i === 0) {
      const antigo = precedenteNfse(companyId, prest, {
        vigente: false, criado_por: 'carlos.souza@bhub.ai', criado_em: '2026-05-10T14:00:00Z', confidence: 0.71,
      })
      NFSE_PREC.push(antigo)
      const atual = precedenteNfse(companyId, prest, { criado_por: 'juliana.pereira@bhub.ai', criado_em: '2026-07-02T10:30:00Z' })
      antigo.substituido_por_id = atual.id
      NFSE_PREC.push(atual)
    } else if (i === 2) {
      NFSE_PREC.push(precedenteNfse(companyId, prest, {
        vigente: false,
        revogado_em: '2026-09-18T16:22:00Z',
        revogado_por: 'ricardo.alves@bhub.ai',
        motivo_revogacao: 'Prestador optou pelo Simples em 08/2026 — não cabe retenção de PCC',
        criado_por: 'motor',
      }))
      NFSE_PREC.push(precedenteNfse(companyId, prest, {
        retencoes: { irrf: false, pcc: false, inss: true, iss: true },
        criado_por: 'ricardo.alves@bhub.ai',
        criado_em: '2026-09-18T16:25:00Z',
      }))
    } else {
      NFSE_PREC.push(precedenteNfse(companyId, prest))
    }
  })
}

mockRoute(/^\/nfse\/precedentes$/, 'GET', (path) => {
  const p = paramsOf(path)
  const companyId = companyOf(p.get('company_id') || 1).id
  const prestador = onlyDigits(p.get('prestador_cnpj'))
  seedNfse(companyId)
  let lista = NFSE_PREC.filter((x) => x.company_id === companyId)
  if (prestador) {
    lista = lista.filter((x) => x.prestador_cnpj === prestador)
    // Prestador fora do catálogo (vindo de uma nota real do fixture): sintetiza
    // um precedente vigente para o painel não abrir vazio.
    if (lista.length === 0) {
      const novo = precedenteNfse(companyId, { cnpj: prestador, nome: 'Prestador da nota', municipio_ibge: '3550308', codigo: '17.01' })
      NFSE_PREC.push(novo)
      lista = [novo]
    }
  }
  return {
    company_id: companyId,
    prestador_cnpj: prestador || null,
    precedentes: [...lista].sort((a, b) => Number(b.vigente) - Number(a.vigente) || b.id - a.id),
  }
})

mockRoute(/^\/nfse\/precedentes\/(\d+)\/revogar-preview$/, 'GET', (_path, match) => {
  const prec = NFSE_PREC.find((x) => x.id === Number(match[1]))
  if (!prec) return { precedente_id: Number(match[1]), vigente: false, ja_revogado: false, affected_invoices: 0 }
  return {
    precedente_id: prec.id,
    prestador_cnpj: prec.prestador_cnpj,
    codigo_servico_lc116: prec.codigo_servico_lc116,
    vigente: prec.vigente,
    ja_revogado: Boolean(prec.revogado_em),
    affected_invoices: prec.vigente ? raioDe(prec.id, 0, 18) : 0,
  }
})

mockRoute(/^\/nfse\/precedentes\/(\d+)\/revogar$/, 'POST', (_path, match, rawBody) => {
  const body = bodyOf(rawBody)
  const prec = NFSE_PREC.find((x) => x.id === Number(match[1]))
  if (!prec) return { ok: false, detail: 'Precedente não encontrado' }
  const total = prec.vigente ? raioDe(prec.id, 0, 18) : 0
  Object.assign(prec, {
    vigente: false,
    revogado_em: AGORA(),
    revogado_por: body.autor || ANALISTA,
    motivo_revogacao: body.motivo || 'Revogado pelo analista',
  })
  return {
    ok: true,
    precedente_id: prec.id,
    revogado_em: prec.revogado_em,
    revogado_por: prec.revogado_por,
    raio: { total, enfileiradas: total, erro: null },
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Corrigir aprendizado (PQC-10) — nota já enviada; não reenvia
// ─────────────────────────────────────────────────────────────────────────
mockRoute(/^\/escrituracao\/(\d+)\/corrigir-aprendizado$/, 'POST', (_path, match, rawBody) => {
  const invoiceId = Number(match[1])
  const body = bodyOf(rawBody)
  const itensReq = body.itens && body.itens.length
    ? body.itens
    : getInvoiceItemsById(invoiceId).slice(0, 1).map((it) => ({ invoice_item_id: it.id, correcoes: {} }))
  const acoes = ['CRIADO', 'ATUALIZADO', 'CRIADO', 'IGNORADO_SEM_CHAVE']
  const itens = itensReq.map((it, i) => {
    const k = `${invoiceId}|${it.invoice_item_id}`
    const jaRevogado = INATIVADOS.has(k)
    INATIVADOS.add(k)
    return {
      invoice_item_id: it.invoice_item_id,
      precedente: jaRevogado ? { linhas_revogadas: 0, ja_revogado: true } : { linhas_revogadas: 1 + (i % 2), ja_revogado: false },
      tratamento: { acao: acoes[(invoiceId + i) % acoes.length] },
      correcoes: it.correcoes || {},
    }
  })
  addAuditEvent({
    event_type: 'invoice.escrituracao.aprendizado_corrigido',
    actor: ANALISTA,
    actor_type: 'analyst',
    invoice_id: invoiceId,
    payload: { itens: itens.map((i) => i.invoice_item_id), motivo: body.motivo || null },
  })
  return {
    ok: true,
    invoice_id: invoiceId,
    itens,
    raio: { notas: raioDe(invoiceId, 0, 7) },
    motivo: body.motivo || null,
    corrigido_por: ANALISTA,
    corrigido_em: AGORA(),
  }
})
