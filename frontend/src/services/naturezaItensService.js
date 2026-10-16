import { fetchWithAuth } from '../api/client'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/**
 * Conferência da natureza da receita por item (FIS-1227, sub-aba "Comércio · Anexo I").
 * A tela só lê o que o classificador gravou em invoice_item_natureza_sn; não calcula nada.
 * Contrato: scratchpad fis1227/contrato-api.md (rotas em backend/app/api/v1/natureza_itens.py).
 * Protótipo: com VITE_MOCK_DATA=true o fetchWithAuth resolve as rotas em src/mocks/naturezaItens.js.
 */

async function falha(res, acao) {
  let detalhe = ''
  try {
    const txt = await res.text()
    try {
      const json = JSON.parse(txt)
      detalhe = typeof json?.detail === 'string' ? json.detail : txt
    } catch {
      detalhe = txt
    }
  } catch {
    detalhe = ''
  }
  const err = new Error(`Erro ao ${acao} (${res.status})${detalhe ? `: ${detalhe}` : ''}`)
  err.status = res.status
  return err
}

function exigeEmpresa(companyId) {
  if (!companyId) throw new Error('ID da empresa é obrigatório')
}

/**
 * KPIs da competência: receita de mercadoria, por natureza (G1–G5), G2/G4 por grupo,
 * pendências, alertas, modo e calculadoEm (null = sem rodada).
 * @param {number|string} companyId
 * @param {string} competencia - 'AAAAMM'
 */
export async function getNaturezaResumo(companyId, competencia) {
  exigeEmpresa(companyId)
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/natureza-itens/resumo?competencia=${encodeURIComponent(competencia)}`
  )
  if (!res.ok) throw await falha(res, 'consultar o resumo da natureza dos itens')
  return res.json()
}

/**
 * Itens classificados, paginados (ordem: valor desc).
 * @param {number|string} companyId
 * @param {string} competencia - 'AAAAMM'
 * @param {number} page - ≥ 1
 * @param {{natureza?: string, sinal?: string, grupo?: string, cfop?: string, pageSize?: number}} [filtros]
 */
export async function getNaturezaItens(companyId, competencia, page = 1, filtros = {}) {
  exigeEmpresa(companyId)
  const params = new URLSearchParams({ competencia, page: String(page) })
  if (filtros.natureza) params.set('natureza', filtros.natureza)
  if (filtros.sinal) params.set('sinal', filtros.sinal)
  if (filtros.grupo) params.set('grupo', filtros.grupo)
  if (filtros.cfop) params.set('cfop', filtros.cfop)
  if (filtros.anexo) params.set('anexo', filtros.anexo)
  if (filtros.pageSize) params.set('page_size', String(filtros.pageSize))
  const res = await fetchWithAuth(`${API_BASE}/companies/${companyId}/natureza-itens?${params}`)
  if (!res.ok) throw await falha(res, 'consultar os itens')
  return res.json()
}

/** Extrai o filename do Content-Disposition (filename*= UTF-8 ou filename="..."). */
export function nomeDoArquivo(contentDisposition, padrao) {
  if (!contentDisposition) return padrao
  const estrela = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(contentDisposition)
  if (estrela) {
    try {
      return decodeURIComponent(estrela[1].trim().replace(/^"|"$/g, ''))
    } catch {
      /* cai no filename simples */
    }
  }
  const simples = /filename\s*=\s*"?([^";]+)"?/i.exec(contentDisposition)
  return simples ? simples[1].trim() : padrao
}

/**
 * Baixa o XLSX com os itens da competência (sem paginação), com os mesmos filtros da tela
 * (natureza, sinal, grupo, cfop); o nome do arquivo que o backend devolve diz os filtros.
 * @returns {Promise<string>} nome do arquivo baixado
 */
export async function exportNaturezaXlsx(companyId, competencia, filtros = {}) {
  exigeEmpresa(companyId)
  const params = new URLSearchParams({ competencia })
  for (const campo of ['natureza', 'sinal', 'grupo', 'cfop', 'anexo']) {
    if (filtros[campo]) params.set(campo, filtros[campo])
  }
  const res = await fetchWithAuth(`${API_BASE}/companies/${companyId}/natureza-itens/export.xlsx?${params}`)
  if (!res.ok) throw await falha(res, 'exportar o XLSX')
  let blob
  let filename
  if ((res.headers.get('Content-Type') || '').includes('application/json')) {
    // Protótipo (VITE_MOCK_DATA): o mock devolve JSON {filename, csv} em vez do
    // binário XLSX; baixa o mesmo recorte como CSV (separador ';', abre no Excel).
    const json = await res.json()
    blob = new Blob(['﻿' + (json?.csv || '')], { type: 'text/csv;charset=utf-8' })
    filename = json?.filename || `natureza-itens-${companyId}-${competencia}.csv`
  } else {
    blob = await res.blob()
    filename = nomeDoArquivo(
      res.headers.get('Content-Disposition'),
      `natureza-itens-${companyId}-${competencia}.xlsx`
    )
  }
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
  return filename
}

/** Condições de varejista (art. 17) cadastradas, vigentes e superadas (desc por ano/criação). */
export async function listarVarejistaArt17(companyId) {
  exigeEmpresa(companyId)
  const res = await fetchWithAuth(`${API_BASE}/companies/${companyId}/varejista-art17`)
  if (!res.ok) throw await falha(res, 'consultar a condição de varejista')
  return res.json()
}

/**
 * Grava a condição de varejista do ano-calendário. O autor vem do token, nunca do corpo.
 * @param {{anoCalendario: number, percentual: string, fonte?: string, evidencia?: string}} data
 */
export async function salvarVarejistaArt17(companyId, data) {
  exigeEmpresa(companyId)
  return postJson(
    `${API_BASE}/companies/${companyId}/varejista-art17`,
    data,
    'salvar a condição de varejista'
  )
}

/**
 * Liga/desliga a empresa no piloto (segunda chave). Motivo obrigatório; grava audit.
 * @returns {Promise<{companyId, ativo, uf, ufsHabilitadas: string[], efetivo: boolean}>}
 */
export async function setNaturezaPiloto(companyId, { ativo, motivo }) {
  exigeEmpresa(companyId)
  const res = await fetchWithAuth(`${API_BASE}/companies/${companyId}/natureza-piloto`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ativo, motivo }),
  })
  if (!res.ok) throw await falha(res, 'alterar o piloto')
  return res.json()
}

/**
 * Receita da competência por CFOP × natureza efetiva (FIS-1253). A soma é a receitaTotal do resumo.
 * @returns {Promise<{companyId, competencia, receitaTotal: string,
 *   linhas: {cfop: string|null, natureza: string, itens: number, valor: string, remessaVerificar: boolean}[]}>}
 */
export async function getNaturezaPorCfop(companyId, competencia) {
  exigeEmpresa(companyId)
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/natureza-itens/por-cfop?competencia=${encodeURIComponent(competencia)}`
  )
  if (!res.ok) throw await falha(res, 'consultar o resumo por CFOP')
  return res.json()
}

async function postJson(url, data, acao) {
  const res = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await falha(res, acao)
  return res.json()
}

/**
 * Ajusta a natureza e/ou o ID da atividade (1–6) de UM item na competência (só fiscal-adms).
 * Motivo obrigatório; o autor vem do token. ID incoerente com a natureza → 422.
 * idAtividadeModo: HERDAR (omitido, mantém o ID ajustado), DERIVADO (limpa) ou VALOR (com idAtividade).
 * @param {{competencia: string, natureza?: string, idAtividade?: number, idAtividadeModo?: string, motivo: string}} data
 */
export async function ajustarNaturezaItem(companyId, invoiceItemId, data) {
  exigeEmpresa(companyId)
  return postJson(
    `${API_BASE}/companies/${companyId}/natureza-itens/${invoiceItemId}/ajuste`,
    data,
    'ajustar a natureza do item'
  )
}

/**
 * Ajusta todos os itens de (CFOP, natureza efetiva) da competência (só fiscal-adms).
 * Nada a gravar (todos no destino): HTTP 200, loteId null e mensagem.
 * @param {{competencia: string, cfop: string, naturezaDe: string, naturezaPara?: string,
 *   idAtividadePara?: number, idAtividadeModo?: string, motivo: string}} data
 * @returns {Promise<{loteId: string, cfop: string, naturezaDe: string, naturezaPara: string|null,
 *   idAtividadePara: number|null, itens: number, valor: string}>}
 */
export async function ajustarNaturezaLote(companyId, data) {
  exigeEmpresa(companyId)
  return postJson(
    `${API_BASE}/companies/${companyId}/natureza-itens/ajuste-lote`,
    data,
    'ajustar a natureza em lote'
  )
}

/** Revoga o ajuste vigente do item: volta à natureza calculada. */
export async function revogarAjusteNatureza(companyId, invoiceItemId, { competencia, motivo }) {
  exigeEmpresa(companyId)
  return postJson(
    `${API_BASE}/companies/${companyId}/natureza-itens/${invoiceItemId}/ajuste/revogar`,
    { competencia, motivo },
    'revogar o ajuste'
  )
}

/** Histórico de ajustes e revogações do item na competência (mais recente primeiro). */
export async function listarAjustesItem(companyId, invoiceItemId, competencia) {
  exigeEmpresa(companyId)
  const res = await fetchWithAuth(
    `${API_BASE}/companies/${companyId}/natureza-itens/${invoiceItemId}/ajustes?competencia=${encodeURIComponent(competencia)}`
  )
  if (!res.ok) throw await falha(res, 'consultar o histórico de ajustes')
  return res.json()
}
