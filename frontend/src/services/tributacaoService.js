import { api, fetchWithAuth } from '../api/client'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/**
 * Consulta a apuração de tributação por serviço, KPIs e histórico da empresa.
 * @param {number|string} companyId - ID da empresa
 * @param {string} competencia - Formato 'AAAAMM' ou 'MM/AAAA'
 */
export async function getTributacaoServicos(companyId, competencia) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/tributacao-servicos?competencia=${encodeURIComponent(competencia)}`
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao consultar tributação (${res.status}): ${errText}`)
  }
  return res.json()
}

/**
 * Grava parametrização de anexo / Fator R por código de serviço com vigência e auditoria.
 * O idAtividade é derivado por linha pelo backend (anexo + Fator R + ISS retido).
 * @param {number|string} companyId - ID da empresa
 * @param {Object} data - { subitem_lc116, anexo, sujeito_fator_r, competencia_inicio, motivo }
 */
export async function salvarParametrizacaoServico(companyId, data) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/tributacao-servicos`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao salvar parametrização (${res.status}): ${errText}`)
  }
  return res.json()
}

/**
 * Consulta a conciliação de fontes de notas (GDocs, Jettax, Unecont) e notas represadas.
 * @param {number|string} companyId - ID da empresa
 * @param {string} competencia - Formato 'AAAAMM' ou 'AAAA-MM'
 * @param {{refresh?: boolean}} [opcoes] - refresh=true ignora o cache de 5 min da IntegradorNF
 */
export async function getTrackingOrigens(companyId, competencia, { refresh = false } = {}) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/tracking-origens?competencia=${encodeURIComponent(competencia)}${refresh ? '&refresh=true' : ''}`
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao consultar tracking de origens (${res.status}): ${errText}`)
  }
  return res.json()
}

/**
 * Drill-down de um card do tracking: notas só na origem, só no BHules e em ambos.
 * @param {number|string} companyId - ID da empresa
 * @param {'jettax'|'unecont'|'outros'|'gdocs'} canal - Canal curto do card
 * @param {string} competencia - Formato 'AAAAMM' ou 'AAAA-MM'
 * @param {{refresh?: boolean}} [opcoes] - refresh=true ignora o cache de 5 min da IntegradorNF
 */
export async function getTrackingOrigensNotas(companyId, canal, competencia, { refresh = false } = {}) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
  if (!canal) throw new Error('Canal é obrigatório')
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/tracking-origens/${encodeURIComponent(canal)}/notas?competencia=${encodeURIComponent(competencia)}${refresh ? '&refresh=true' : ''}`
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao consultar notas do tracking (${res.status}): ${errText}`)
  }
  return res.json()
}

/**
 * Consulta dados do cadastro de exportadores, histórico, tomadores conhecidos e alertas da empresa.
 * @param {number|string} companyId - ID da empresa
 */
export async function getExportacaoEmpresa(companyId) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
  const res = await fetchWithAuth(`${API_BASE}/companies/${companyId}/exportacao`)
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao consultar dados de exportação (${res.status}): ${errText}`)
  }
  return res.json()
}

/**
 * Salva novo cadastro de exportador de serviços.
 * @param {number|string} companyId - ID da empresa
 * @param {Object} payload - Dados do cadastro (subitem_lc116, competencia_inicio, forma_recebimento, etc.)
 */
export async function salvarCadastroExportador(companyId, payload) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/exportacao/cadastro`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao salvar cadastro de exportador (${res.status}): ${errText}`)
  }
  return res.json()
}

/**
 * Substitui cadastro de exportador existente (novo registro com versionamento).
 * @param {number|string} companyId - ID da empresa
 * @param {number|string} cadastroId - ID do cadastro anterior
 * @param {Object} payload - Novos dados
 */
export async function substituirCadastroExportador(companyId, cadastroId, payload) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
  if (!cadastroId) throw new Error('ID do cadastro é obrigatório')
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/exportacao/cadastro/${cadastroId}/substituir`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao substituir cadastro de exportador (${res.status}): ${errText}`)
  }
  return res.json()
}

/**
 * Revoga cadastro de exportador com competência final e motivo.
 * @param {number|string} companyId - ID da empresa
 * @param {number|string} cadastroId - ID do cadastro
 * @param {Object} data - { competencia_fim, motivo }
 */
export async function revogarCadastroExportador(companyId, cadastroId, data) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
  if (!cadastroId) throw new Error('ID do cadastro é obrigatório')
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/exportacao/cadastro/${cadastroId}/revogar`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao revogar cadastro de exportador (${res.status}): ${errText}`)
  }
  return res.json()
}

/**
 * Cadastra tomador estrangeiro conhecido.
 * @param {number|string} companyId - ID da empresa
 * @param {Object} payload - { nome, apelidos, nif, pais, evidencia }
 */
export async function criarTomadorExportacao(companyId, payload) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/exportacao/tomadores`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao cadastrar tomador (${res.status}): ${errText}`)
  }
  return res.json()
}

/**
 * Revoga tomador conhecido.
 * @param {number|string} companyId - ID da empresa
 * @param {number|string} tomadorId - ID do tomador
 * @param {Object} data - { motivo }
 */
export async function revogarTomadorExportacao(companyId, tomadorId, data) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
  if (!tomadorId) throw new Error('ID do tomador é obrigatório')
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/exportacao/tomadores/${tomadorId}/revogar`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao revogar tomador (${res.status}): ${errText}`)
  }
  return res.json()
}

/**
 * Marca alerta de vínculo societário (vincPrest 1–5) como ciente.
 * @param {number|string} companyId - ID da empresa
 * @param {number|string} alertaId - ID do alerta
 */
export async function marcarAlertaVinculoCiente(companyId, alertaId) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
  if (!alertaId) throw new Error('ID do alerta é obrigatório')
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/exportacao/alertas-vinculo/${alertaId}/ciente`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao marcar ciência no alerta (${res.status}): ${errText}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Revisões de exportação (EXP2-14). Contrato: design.md §5.4 (RevisaoItemOut)
// e §6.3, implementado em paralelo na branch feat/exportacao-decisao-revisao.
//
// TODO(feat/exportacao-decisao-revisao): quando a branch entrar em main,
// apagar `_revisoesMock*` abaixo. O mock só liga quando GET /exportacao/revisoes
// responde 404 (rota ausente); qualquer outro erro é propagado, nunca mascarado.
//
// Contrato consumido por esta tela:
//   GET  /exportacao/revisoes?status=&company_id=&competencia=
//        → RevisaoItemOut[] ordenada por prazo asc (dias_uteis_restantes vem do servidor).
//        SPEC_DEVIATION: design §6.3 previa page/size; a branch devolve lista simples.
//   POST /exportacao/revisoes/{id}/decidir
//        body {escolha: 'EXPORTACAO'|'INTERNO', justificativa, inscrever?: CadastroExportadorIn}
//        → RevisaoItemOut. 404 revisão; 409 mesma escolha repetida; 422 com o motivo
//        (trava dura, tomador brasileiro, sem moeda). Decisão tardia devolve
//        pendencia_retificacao_id preenchido.
//        SPEC_DEVIATION: design §6.3 chamava a rota de /decisao; a branch usa /decidir.
//   RevisaoItemOut: {id, invoice_id, company_id, competencia, gatilho, status
//        (PENDENTE|DECIDIDA_EXPORTACAO|DECIDIDA_INTERNO|EXPIRADA), aberta_em, corte,
//        prazo, decisao_tipo, decidida_por, decidida_em, justificativa, expirada_em,
//        cadastro_inscrito_id, pendencia_retificacao_id, valores_nota (CAMPOS_DECISAO:
//        iss_tributacao, iss_exigibilidade, dest_cnpj, dest_razao_social, dest_nif,
//        dest_pais, pais_resultado, tp_moeda, v_serv_moeda, md_prestacao, vinc_prest,
//        codigo_servico_lc116), historico[], dias_uteis_restantes}
// ---------------------------------------------------------------------------

async function _detalheErro(res, prefixo) {
  const texto = await res.text()
  let detalhe = texto
  try {
    detalhe = JSON.parse(texto).detail ?? texto
  } catch {
    // corpo não é JSON
  }
  return new Error(`${prefixo} (${res.status}): ${typeof detalhe === 'string' ? detalhe : JSON.stringify(detalhe)}`)
}

let _revisoesMockAtivo = false

function _revisaoMock(id, company_id, competencia, status, corte, prazo, dias, valores) {
  return {
    id,
    invoice_id: 5000 + id,
    company_id,
    competencia,
    gatilho: valores.iss_exigibilidade === '4' ? 'LEIAUTE_ANTIGO_DECLARA_EXPORTACAO' : 'TOMADOR_EXTERIOR_SEM_CADASTRO',
    status,
    aberta_em: `${corte}T09:00:00Z`,
    corte,
    prazo,
    decisao_tipo: null,
    decidida_por: null,
    decidida_em: null,
    justificativa: null,
    expirada_em: status === 'EXPIRADA' ? `${prazo}T23:59:59Z` : null,
    cadastro_inscrito_id: null,
    pendencia_retificacao_id: null,
    valores_nota: {
      iss_tributacao: null,
      iss_exigibilidade: null,
      dest_cnpj: null,
      dest_razao_social: null,
      dest_nif: null,
      dest_pais: null,
      pais_resultado: null,
      tp_moeda: null,
      v_serv_moeda: null,
      md_prestacao: null,
      vinc_prest: null,
      codigo_servico_lc116: null,
      ...valores,
    },
    historico: [{ status, por: 'sistema', tipo: 'SISTEMA', em: `${corte}T09:00:00Z`, justificativa: null }],
    dias_uteis_restantes: dias,
  }
}

const _revisoesMock = [
  _revisaoMock(101, 1, '202608', 'PENDENTE', '2026-09-08', '2026-09-03', 1, {
    dest_razao_social: 'ACME Global Inc.', dest_nif: 'US123456789', dest_pais: 'US',
    tp_moeda: 'USD', v_serv_moeda: '45000.00', md_prestacao: '1', codigo_servico_lc116: '01.07',
  }),
  _revisaoMock(102, 1, '202608', 'PENDENTE', '2026-09-08', '2026-09-03', 2, {
    iss_exigibilidade: '4', dest_razao_social: 'Stripe Payments UK', dest_pais: 'GB',
    codigo_servico_lc116: '01.01',
  }),
  _revisaoMock(103, 2, '202607', 'EXPIRADA', '2026-08-07', '2026-08-05', 0, {
    dest_razao_social: 'Euro Software GmbH', dest_nif: 'DE334455667', dest_pais: 'DE',
    tp_moeda: 'EUR', v_serv_moeda: '82000.00', md_prestacao: '1', codigo_servico_lc116: '01.07',
  }),
]

function _listarMock({ company_id, competencia, status }) {
  return _revisoesMock
    .filter((r) => !company_id || String(r.company_id) === String(company_id))
    .filter((r) => !competencia || r.competencia === String(competencia).replace(/[-/]/g, ''))
    .filter((r) => !status || r.status === status)
    .sort((a, b) => a.prazo.localeCompare(b.prazo) || a.id - b.id)
}

function _decidirMock(revisaoId, body) {
  const rev = _revisoesMock.find((r) => r.id === Number(revisaoId))
  if (!rev) throw new Error(`Erro ao decidir revisão (404): revisão ${revisaoId} não encontrada`)
  const novo = body.escolha === 'EXPORTACAO' ? 'DECIDIDA_EXPORTACAO' : 'DECIDIDA_INTERNO'
  if (rev.status === novo) throw new Error(`Erro ao decidir revisão (409): revisão já decidida como ${body.escolha}`)
  const tardia = rev.status === 'EXPIRADA' || rev.expirada_em != null
  Object.assign(rev, {
    status: novo,
    decisao_tipo: 'HUMANO',
    decidida_por: 'mock@bhub.ai',
    decidida_em: new Date().toISOString(),
    justificativa: body.justificativa,
    cadastro_inscrito_id: body.inscrever ? 900 + rev.id : rev.cadastro_inscrito_id,
    pendencia_retificacao_id: tardia && novo === 'DECIDIDA_EXPORTACAO' ? 700 + rev.id : rev.pendencia_retificacao_id,
    dias_uteis_restantes: 0,
  })
  rev.historico.push({ status: novo, por: rev.decidida_por, tipo: 'HUMANO', em: rev.decidida_em, justificativa: body.justificativa })
  return { ...rev }
}

/**
 * Lista revisões de exportação, ordenadas por prazo pelo servidor.
 * @param {Object} params - { company_id?, competencia? (AAAAMM), status? }
 */
export async function getRevisoesExportacao(params = {}) {
  if (_revisoesMockAtivo) return _listarMock(params)
  const query = new URLSearchParams()
  if (params.company_id) query.set('company_id', params.company_id)
  if (params.competencia) query.set('competencia', String(params.competencia).replace(/[-/]/g, ''))
  if (params.status) query.set('status', params.status)
  const res = await fetchWithAuth(`${API_BASE}/exportacao/revisoes?${query.toString()}`)
  if (res.status === 404 && import.meta.env.DEV) {
    _revisoesMockAtivo = true
    console.warn('GET /exportacao/revisoes ausente: usando mock de revisões (feat/exportacao-decisao-revisao pendente)')
    return _listarMock(params)
  }
  if (!res.ok) throw await _detalheErro(res, 'Erro ao consultar revisões de exportação')
  return res.json()
}

/**
 * Registra a decisão humana de uma revisão. O autor vem do JWT no servidor.
 * @param {number|string} revisaoId
 * @param {Object} body - { escolha: 'EXPORTACAO'|'INTERNO', justificativa, inscrever?: CadastroExportadorIn }
 */
export async function decidirRevisaoExportacao(revisaoId, body) {
  if (!revisaoId) throw new Error('ID da revisão é obrigatório')
  if (_revisoesMockAtivo) return _decidirMock(revisaoId, body)
  const res = await fetchWithAuth(`${API_BASE}/exportacao/revisoes/${revisaoId}/decidir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await _detalheErro(res, 'Erro ao decidir revisão')
  return res.json()
}

// Conferência concluída por cliente × competência (Célula 24/09, item 4.1 / FIS-1090).
// O backend resolve o cliente pela raiz do CNPJ; a rota aceita CNPJ completo sem máscara.
function conferenciaUrl(cnpj, competencia) {
  if (!cnpj) throw new Error('CNPJ da empresa é obrigatório')
  const semMascara = String(cnpj).replace(/[./\-\s]/g, '')
  return `${API_BASE}/apuracoes/${encodeURIComponent(semMascara)}/${encodeURIComponent(competencia)}/conferencia`
}

// Erros da API de apuração vêm como {detail: {erros: [{codigo, mensagem}]}}:
// mostra a mensagem ao analista em vez do JSON cru.
export function mensagemDeErro(texto) {
  try {
    const erros = JSON.parse(texto)?.detail?.erros
    const mensagens = Array.isArray(erros) ? erros.map((e) => e?.mensagem).filter(Boolean) : []
    if (mensagens.length) return mensagens.join(' ')
  } catch {
    // corpo não é JSON
  }
  return texto
}

async function lerOuFalhar(res, acao) {
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro ao ${acao} (${res.status}): ${mensagemDeErro(errText)}`)
  }
  return res.json()
}

/**
 * Estado corrente da conferência (concluída? quem? quando?) e histórico de ciclos.
 * @param {string} cnpj - CNPJ da empresa (com ou sem máscara)
 * @param {string} competencia - Formato 'AAAAMM'
 */
export async function getConferencia(cnpj, competencia) {
  const res = await fetchWithAuth(conferenciaUrl(cnpj, competencia))
  return lerOuFalhar(res, 'consultar conferência')
}

/** Marca a conferência como concluída (idempotente). */
export async function concluirConferencia(cnpj, competencia, observacao = null) {
  const res = await fetchWithAuth(conferenciaUrl(cnpj, competencia), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observacao: observacao || null }),
  })
  return lerOuFalhar(res, 'concluir conferência')
}

/** Reabre a conferência; o histórico é preservado. */
export async function reabrirConferencia(cnpj, competencia, motivo = null) {
  const res = await fetchWithAuth(`${conferenciaUrl(cnpj, competencia)}/reabrir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo: motivo || null }),
  })
  return lerOuFalhar(res, 'reabrir conferência')
}

export default {
  getTributacaoServicos,
  salvarParametrizacaoServico,
  getTrackingOrigens,
  getTrackingOrigensNotas,
  getExportacaoEmpresa,
  salvarCadastroExportador,
  substituirCadastroExportador,
  revogarCadastroExportador,
  criarTomadorExportacao,
  revogarTomadorExportacao,
  marcarAlertaVinculoCiente,
  getRevisoesExportacao,
  decidirRevisaoExportacao,
  getConferencia,
  concluirConferencia,
  reabrirConferencia,
}

