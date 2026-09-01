const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const MOCK_ENABLED = import.meta.env.VITE_MOCK_DATA === 'true'

let _tokenProvider = null

export function setTokenProvider(fn) {
  _tokenProvider = fn
}

async function _authHeader() {
  if (!_tokenProvider) return {}
  try {
    const token = await _tokenProvider()
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

export async function fetchWithAuth(url, options = {}) {
  const auth = await _authHeader()
  return fetch(url, {
    ...options,
    headers: { ...auth, ...(options.headers || {}) },
  })
}

async function request(path, options = {}) {
  if (MOCK_ENABLED) {
    // Registro dos fixtures acontece via import (efeito colateral) em
    // src/mocks/index.js — importado uma única vez, de forma preguiçosa,
    // para não pagar esse custo quando o mock está desligado.
    const { resolveMock } = await import('../mocks/registry')
    await import('../mocks/index')
    const method = options.method || 'GET'
    const mocked = resolveMock(path, method)
    if (mocked !== undefined) {
      return mocked
    }
    console.warn(`[mock] sem handler para ${method} ${path} — devolvendo resposta vazia`)
    return {}
  }

  const url = `${API_BASE}${path}`
  const auth = await _authHeader()
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...auth, ...options.headers },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json()
}

export const api = {
  // Companies
  getCompanies: () => request('/companies/lookup'),
  getCompaniesFull: () => request('/companies'),
  getCompany: (id) => request(`/companies/${id}`),
  toggleCompanyActive: (id, ativo) =>
    request(`/companies/${id}/toggle-active`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo }),
    }),
  updateCompanyTypeFlags: (id, flags) =>
    request(`/companies/${id}/type-flags`, {
      method: 'PATCH',
      body: JSON.stringify(flags),
    }),

  // Hard-delete da empresa + cascade (preview + DELETE)
  getCompanyDeletePreview: (companyId) =>
    request(`/companies/${companyId}/delete-preview`),

  deleteCompany: (companyId, cnpjConfirm) =>
    request(`/companies/${companyId}`, {
      method: 'DELETE',
      body: JSON.stringify({ cnpj_confirm: cnpjConfirm }),
    }),

  // Invoices
  getInvoices: ({ companyIds, companyId, page = 1, size = 100, search, status, source, codMod, indEmit, startDate, endDate, escrituracaoStatus, statusAnalise, cnpjEmit, cnpjDest, problemType } = {}) => {
    const params = new URLSearchParams()
    if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','))
    else if (companyId) params.set('company_id', companyId)
    params.set('page', page)
    params.set('page_size', size)
    if (search) params.set('search', search)
    if (status) params.set('status_camu', status)
    if (source) params.set('source', source)
    if (codMod) params.set('cod_mod', codMod)
    // Direção sob a ótica do cliente — '0' = emissão própria (saída), '1' =
    // terceiro (entrada). Cada sub-tela da segregação de Notas Fiscais/CTE/NFC
    // manda a sua (ver notasFiscaisTabs.js), substituindo o antigo
    // `only_incoming=true` fixo (que só cobria NF-e 55 de entrada).
    if (indEmit) params.set('ind_emit', indEmit)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (escrituracaoStatus) params.set('escrituracao_status', escrituracaoStatus)
    if (statusAnalise) params.set('status_analise', statusAnalise)
    if (cnpjEmit) params.set('cnpj_emit', cnpjEmit)
    if (cnpjDest) params.set('cnpj_dest', cnpjDest)
    if (problemType) params.set('problem_type', problemType)
    return request(`/invoices?${params}`)
  },

  // Notas Integradas (dual-write, não-55-entrada) — NÃO força only_incoming;
  // respeita os filtros cod_mod/ind_emit da aba. ind_emit = direção sob a ótica
  // do cliente (0=saída/própria, 1=entrada/terceiro). Read-only.
  getIntegratedInvoices: ({ companyIds, companyId, page = 1, size = 50, search, codMod, indEmit, startDate, endDate } = {}) => {
    const params = new URLSearchParams()
    if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','))
    else if (companyId) params.set('company_id', companyId)
    params.set('page', page)
    params.set('page_size', size)
    if (search) params.set('search', search)
    if (codMod) params.set('cod_mod', codMod)
    if (indEmit) params.set('ind_emit', indEmit)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    return request(`/invoices?${params}`)
  },

  getProblemTypes: (codMod) => {
    const params = new URLSearchParams()
    if (codMod) params.set('cod_mod', codMod)
    return request(`/invoices/problem-types?${params}`)
  },

  getBatchAnalysis: ({ companyIds, startDate, endDate, statusAnalise, search, codMod, page = 1, pageSize = 200, includeSummary = false } = {}) => {
    const params = new URLSearchParams()
    if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','))
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (statusAnalise) params.set('status_analise', statusAnalise)
    if (search) params.set('search', search)
    if (codMod) params.set('cod_mod', codMod)
    params.set('page', page)
    params.set('page_size', pageSize)
    if (includeSummary) params.set('include_summary', 'true')
    return request(`/invoices/batch-analysis?${params}`)
  },

  getBatchAnalysisSummary: ({ companyIds, startDate, endDate, statusAnalise, search, codMod } = {}) => {
    const params = new URLSearchParams()
    if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','))
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (statusAnalise) params.set('status_analise', statusAnalise)
    if (search) params.set('search', search)
    if (codMod) params.set('cod_mod', codMod)
    return request(`/invoices/batch-analysis/summary?${params}`)
  },

  getStatusCounts: (companyIds, codMod, startDate, endDate, indEmit) => {
    const params = new URLSearchParams()
    if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','))
    if (codMod) params.set('cod_mod', codMod)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (indEmit) params.set('ind_emit', indEmit)
    return request(`/invoices/status-counts?${params}`)
  },

  getInvoice: (id) => request(`/invoices/${id}`),

  getInvoiceItems: (id) => request(`/invoices/${id}/items`),

  getInvoiceAuditEvents: (id) => request(`/invoices/${id}/audit-events`),

  // Auditoria consolidada (cross-nota/empresa) — o quê/quem/quando.
  getAuditEvents: ({ eventType, actor, actorType, startDate, endDate, limit = 100, offset = 0 } = {}) => {
    const params = new URLSearchParams()
    if (eventType) params.set('event_type', eventType)
    if (actor) params.set('actor', actor)
    if (actorType) params.set('actor_type', actorType)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    return request(`/audit/events?${params.toString()}`)
  },

  getStatusReasons: (id) => request(`/invoices/${id}/status-reasons`),

  getClassificationHistory: ({ companyIds, startDate, endDate, granularity } = {}) => {
    const params = new URLSearchParams()
    if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','))
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (granularity) params.set('granularity', granularity)
    return request(`/invoices/classification-history?${params}`)
  },

  getClassificationDashboard: ({ companyIds, startDate, endDate } = {}) => {
    const params = new URLSearchParams()
    if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','))
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    return request(`/invoices/classification-dashboard?${params}`)
  },

  getOperationsDashboard: (companyIds) => {
    const params = new URLSearchParams()
    if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','))
    return request(`/invoices/operations-dashboard?${params}`)
  },

  updateDataPagamento: (id, dataPagamento) =>
    request(`/invoices/${id}/data-pagamento?data_pagamento=${dataPagamento}`, { method: 'PATCH' }),

  approveInvoice: (id) =>
    request(`/invoices/${id}/approve`, { method: 'PUT' }),

  downloadInvoiceXml: (id) =>
    fetchWithAuth(`${API_BASE}/invoices/${id}/xml`).then(async r => {
      if (!r.ok) {
        // Surface the backend `detail` (auth/aud, nota inexistente, timeout)
        // em vez de só o status — torna o erro acionável pro usuário/time.
        let detail = `Falha ao baixar XML (HTTP ${r.status})`
        try { const j = await r.json(); if (j?.detail) detail = j.detail } catch { /* corpo não-JSON */ }
        throw new Error(detail)
      }
      return r.blob()
    }),

  // Escrituração (new engine)
  runEscrituracao: (invoiceId, force = false) => {
    const params = new URLSearchParams()
    if (force) params.set('force', 'true')
    return request(`/escrituracao/run/${invoiceId}?${params}`, { method: 'POST' })
  },

  runEscrituracaoBatch: (invoiceIds, force = false) => {
    const params = new URLSearchParams()
    if (force) params.set('force', 'true')
    return request(`/escrituracao/run-batch?${params}`, {
      method: 'POST',
      body: JSON.stringify(invoiceIds),
    })
  },

  getEscrituracao: (invoiceId) => request(`/escrituracao/${invoiceId}`),

  getSpedExport: (invoiceId) => request(`/escrituracao/${invoiceId}/sped-export`),

  submitEscrituracaoFeedback: (invoiceId, feedbacks) =>
    request(`/escrituracao/${invoiceId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbacks),
    }),

  // Ação humana explícita de "Confirmar e enviar ao Onvio" — única via que
  // publica o evento analysis_reviewed. Salvar feedback (acima) nunca envia.
  confirmarEnvioOnvio: (invoiceId, feedbacks) =>
    request(`/escrituracao/${invoiceId}/confirmar-envio`, {
      method: 'POST',
      body: JSON.stringify(feedbacks || []),
    }),

  // Validation (legacy — proxied to escrituração)
  runValidation: (invoiceId, analysisType = 'CONSISTENCIA_FISCAL') => {
    const params = new URLSearchParams()
    params.set('analysis_type', analysisType)
    return request(`/validation/run/${invoiceId}?${params}`, { method: 'POST' })
  },

  reprocessCompany: (companyId, startDate, endDate) =>
    request(`/validation/reprocess/${companyId}`, {
      method: 'POST',
      body: JSON.stringify({
        start_date: startDate || null,
        end_date: endDate || null,
      }),
    }),

  reprocessCompanyStream: async (companyId, startDate, endDate, onProgress) => {
    const url = `${API_BASE}/validation/reprocess/${companyId}?stream=true`
    const res = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startDate || null, end_date: endDate || null }),
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const match = line.match(/^data:\s*(.+)/)
        if (match) {
          try { onProgress(JSON.parse(match[1])) } catch {}
        }
      }
    }
  },

  reprocessCompanyAsync: (companyId, startDate, endDate) =>
    request(`/validation/reprocess-async/${companyId}`, {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate || null, end_date: endDate || null }),
    }),

  reprocessNfseAsync: (companyId, startDate, endDate) =>
    request(`/validation/reprocess-nfse-async/${companyId}`, {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate || null, end_date: endDate || null }),
    }),

  getReprocessStatus: (jobId) =>
    request(`/validation/reprocess-status/${jobId}`),

  cancelReprocess: (jobId) =>
    request(`/validation/reprocess-cancel/${jobId}`, { method: 'POST' }),

  undoEscrituracao: (invoiceIds) =>
    request('/validation/escrituracao/undo', {
      method: 'POST',
      body: JSON.stringify({ invoice_ids: invoiceIds }),
    }),

  getValidationResults: ({ invoiceId, ruleCode } = {}) => {
    const params = new URLSearchParams()
    if (invoiceId) params.set('invoice_id', invoiceId)
    if (ruleCode) params.set('rule_code', ruleCode)
    return request(`/validation/results?${params}`)
  },

  getValidationAnalysis: (invoiceId, analysisType = 'CONSISTENCIA_FISCAL') => {
    const params = new URLSearchParams()
    params.set('analysis_type', analysisType)
    return request(`/validation/analysis/${invoiceId}?${params}`)
  },

  // Captured Invoices (IntegradorNF)
  getCapturedInvoices: ({ companyId, type, startDate, endDate, page, size, search } = {}) => {
    const params = new URLSearchParams()
    params.set('company_id', companyId)
    if (type) params.set('type', type)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    params.set('page', page || 1)
    params.set('page_size', size || 50)
    if (search) params.set('search', search)
    return request(`/capture/invoices?${params}`)
  },

  // Capture Sync
  syncCapture: ({ companyId, startDate, endDate } = {}) =>
    request('/capture/sync', {
      method: 'POST',
      body: JSON.stringify({
        company_id: companyId,
        start_date: startDate || null,
        end_date: endDate || null,
      }),
    }),

  getSyncStatus: (companyId) => request(`/capture/sync/status/${companyId}`),

  // Incremental capture sync
  syncAllCompanies: () => request('/capture/sync-all', { method: 'POST' }),
  syncHistorical: ({ companyId, startDate, endDate }) => {
    const params = new URLSearchParams({ company_id: companyId, start_date: startDate })
    if (endDate) params.set('end_date', endDate)
    return request(`/capture/sync-historical?${params}`, { method: 'POST' })
  },
  getCaptureDashboard: ({ search, page = 1, pageSize = 50 } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', page)
    params.set('page_size', pageSize)
    return request(`/capture/sync/dashboard?${params}`)
  },

  // Legislation (Crawler Dashboard)
  getCrawlSources: (scope) => {
    const params = new URLSearchParams()
    if (scope) params.set('scope', scope)
    return request(`/legislation/sources?${params}`)
  },

  getCrawlJobs: (limit = 20) => request(`/legislation/sync/status?limit=${limit}`),

  syncSource: (sourceType) =>
    request('/legislation/sync', {
      method: 'POST',
      body: JSON.stringify(sourceType ? { source_type: sourceType } : {}),
    }),

  toggleSource: (id, enabled) =>
    request(`/legislation/sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),

  getLegislationArticles: ({ page = 1, pageSize = 50, sourceId, tipo, uf, tags, hasEmbedding, search } = {}) => {
    const params = new URLSearchParams()
    params.set('page', page)
    params.set('page_size', pageSize)
    if (sourceId) params.set('source_id', sourceId)
    if (tipo) params.set('tipo', tipo)
    if (uf) params.set('uf', uf)
    if (tags) params.set('tags', tags)
    if (hasEmbedding !== undefined && hasEmbedding !== null) params.set('has_embedding', hasEmbedding)
    if (search) params.set('q', search)
    return request(`/legislation/articles?${params}`)
  },

  // Feedback (per validation result)
  postFeedback: (data) =>
    request('/feedback', { method: 'POST', body: JSON.stringify(data) }),

  // Feedback (per invoice - bulk)
  postInvoiceFeedback: (invoiceId, { vote, comment, user_email, categories }) =>
    request(`/invoices/${invoiceId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ vote, comment, user_email, categories }),
    }),

  getInvoiceFeedback: (invoiceId) =>
    request(`/invoices/${invoiceId}/feedback`),

  // SPED
  uploadSped: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return fetchWithAuth(`${API_BASE}/sped/upload`, { method: 'POST', body: formData }).then(async r => {
      if (!r.ok) {
        const body = await r.text()
        throw new Error(body)
      }
      return r.json()
    })
  },

  uploadSpedBatch: (files) => {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    return fetchWithAuth(`${API_BASE}/sped/upload-batch`, { method: 'POST', body: formData }).then(async r => {
      if (!r.ok) {
        const body = await r.text()
        throw new Error(body)
      }
      return r.json()
    })
  },

  getSpedByCompany: () => request('/sped/by-company'),

  getSpedFiles: ({ search, companyId, periodStart, periodEnd, spedType, page = 1, pageSize = 50 } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (companyId) params.set('company_id', companyId)
    if (periodStart) params.set('period_start', periodStart)
    if (periodEnd) params.set('period_end', periodEnd)
    if (spedType) params.set('sped_type', spedType)
    params.set('page', page)
    params.set('page_size', pageSize)
    return request(`/sped/files-paginated?${params}`)
  },

  deleteSpedFile: (fileId) =>
    request(`/sped/files/${fileId}`, { method: 'DELETE' }),

  downloadSpedFile: (fileId) =>
    fetchWithAuth(`${API_BASE}/sped/files/${fileId}/download`).then(r => {
      if (!r.ok) throw new Error(`Download failed: ${r.status}`)
      return r.blob()
    }),

  // Reinf (EFD-Reinf)
  uploadReinf: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return fetchWithAuth(`${API_BASE}/reinf/upload`, { method: 'POST', body: formData }).then(async r => {
      if (!r.ok) {
        const body = await r.text()
        throw new Error(body)
      }
      return r.json()
    })
  },

  uploadReinfBatch: (files) => {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    return fetchWithAuth(`${API_BASE}/reinf/upload-batch`, { method: 'POST', body: formData }).then(async r => {
      if (!r.ok) {
        const body = await r.text()
        throw new Error(body)
      }
      return r.json()
    })
  },

  getReinfByCompany: () => request('/reinf/by-company'),

  getReinfFiles: ({ search, companyId, periodStart, periodEnd, page = 1, pageSize = 50 } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (companyId) params.set('company_id', companyId)
    if (periodStart) params.set('period_start', periodStart)
    if (periodEnd) params.set('period_end', periodEnd)
    params.set('page', page)
    params.set('page_size', pageSize)
    return request(`/reinf/files-paginated?${params}`)
  },

  getReinfEvents: (fileId) => request(`/reinf/files/${fileId}/events`),

  deleteReinfFile: (fileId) =>
    request(`/reinf/files/${fileId}`, { method: 'DELETE' }),

  downloadReinfFile: (fileId) =>
    fetchWithAuth(`${API_BASE}/reinf/files/${fileId}/download`).then(r => {
      if (!r.ok) throw new Error(`Download failed: ${r.status}`)
      return r.blob()
    }),

  // Simples Nacional (Contexto)
  getSimplesNacionalFiles: ({ search, companyId, periodStart, periodEnd, page = 1, pageSize = 50 } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (companyId) params.set('company_id', companyId)
    if (periodStart) params.set('period_start', periodStart)
    if (periodEnd) params.set('period_end', periodEnd)
    params.set('page', page)
    params.set('page_size', pageSize)
    return request(`/simples-nacional/files-paginated?${params}`)
  },

  uploadSimplesNacional: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return fetchWithAuth(`${API_BASE}/simples-nacional/upload`, { method: 'POST', body: formData }).then(async r => {
      if (!r.ok) { const body = await r.text(); throw new Error(body) }
      return r.json()
    })
  },

  uploadSimplesNacionalBatch: (files) => {
    const formData = new FormData()
    for (const file of files) formData.append('files', file)
    return fetchWithAuth(`${API_BASE}/simples-nacional/upload-batch`, { method: 'POST', body: formData }).then(async r => {
      if (!r.ok) { const body = await r.text(); throw new Error(body) }
      return r.json()
    })
  },

  deleteSimplesNacionalFile: (fileId) =>
    request(`/simples-nacional/files/${fileId}`, { method: 'DELETE' }),

  downloadSimplesNacionalFile: (fileId) =>
    fetchWithAuth(`${API_BASE}/simples-nacional/files/${fileId}/download`).then(r => {
      if (!r.ok) throw new Error(`Download failed: ${r.status}`)
      return r.blob()
    }),

  // Diagnosis (AI fiscal diagnostic per client)
  getDiagnosis: (companyId) => request(`/diagnosis/${companyId}`),
  generateDiagnosis: (companyId, periodMonths = 6) =>
    request(`/diagnosis/${companyId}/generate?period_months=${periodMonths}`, { method: 'POST' }),
  generateNarrative: (companyId) =>
    request(`/diagnosis/${companyId}/narrative`, { method: 'POST' }),

  // Reform Diagnosis (IBS/CBS)
  getReformDiagnosis: (companyId) => request(`/reform-diagnosis/${companyId}`),
  generateReformDiagnosis: (companyId, { targetYear = 2027, periodMonths = 6, folhaMensal, faturamentoMensal, dasMensal, anexoSimples } = {}) => {
    const params = new URLSearchParams()
    params.set('target_year', targetYear)
    params.set('period_months', periodMonths)
    if (folhaMensal) params.set('folha_mensal', folhaMensal)
    if (faturamentoMensal) params.set('faturamento_mensal', faturamentoMensal)
    if (dasMensal) params.set('das_mensal', dasMensal)
    if (anexoSimples) params.set('anexo_simples', anexoSimples)
    return request(`/reform-diagnosis/${companyId}/generate?${params}`, { method: 'POST' })
  },
  generateReformNarrative: (companyId) =>
    request(`/reform-diagnosis/${companyId}/narrative`, { method: 'POST' }),

  // Chat (RAG assistant)
  sendChatMessage: ({ message, history = [], top_k = 5 }) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, top_k }),
    }),

  // Batch feedback
  batchFeedback: (body) =>
    request('/escrituracao/feedback/batch', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Escrituração Excel Export — caminho assíncrono (mata o 29s do API Gateway
  // e o limite de 10MB do payload). Endpoint POST cria job, GET pollla status,
  // download via URL assinada S3.
  createExportXlsxJob: ({ companyId, startDate, endDate, invoiceIds, tipoNf } = {}) =>
    request('/escrituracao/export/xlsx/job', {
      method: 'POST',
      body: JSON.stringify({
        company_id: companyId,
        start_date: startDate,
        end_date: endDate,
        invoice_ids: invoiceIds && invoiceIds.length > 0 ? invoiceIds.join(',') : null,
        tipo_nf: tipoNf || null,
      }),
    }),

  getExportXlsxJob: (jobId) => request(`/escrituracao/export/xlsx/job/${jobId}`),

  // Legacy síncrono — mantido só pro caminho de invoice_ids curto.
  downloadExcel: ({ companyId, startDate, endDate, invoiceIds } = {}) => {
    const params = new URLSearchParams()
    if (companyId) params.set('company_id', companyId)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (invoiceIds && invoiceIds.length > 0) params.set('invoice_ids', invoiceIds.join(','))
    return fetchWithAuth(`${API_BASE}/escrituracao/export/xlsx?${params}`)
      .then(res => {
        if (!res.ok) throw new Error(`Export failed: ${res.status}`)
        return res.blob()
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `escrituracao_export_${new Date().toISOString().slice(0, 10)}.xlsx`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      })
  },

  // Escrituração CSV Export
  getEscrituracaoExport: ({ companyId, startDate, endDate } = {}) => {
    const params = new URLSearchParams()
    if (companyId) params.set('company_id', companyId)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    return fetchWithAuth(`${API_BASE}/escrituracao/export/csv?${params}`)
      .then(res => {
        if (!res.ok) throw new Error(`Export failed: ${res.status}`)
        return res.blob()
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'escrituracao_export.csv'
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      })
  },

  // Legislation Effectiveness
  getLegislationEffectiveness: (days = 30, companyId) => {
    const params = new URLSearchParams()
    params.set('days', days)
    if (companyId) params.set('company_id', companyId)
    return request(`/escrituracao/metrics/legislation-effectiveness?${params}`)
  },

  getAbReranking: (days = 30, companyId) => {
    const params = new URLSearchParams()
    params.set('days', days)
    if (companyId) params.set('company_id', companyId)
    return request(`/escrituracao/metrics/ab-reranking?${params}`)
  },

  // Financial Metrics
  getFinancialMetrics: (companyId) => {
    const params = new URLSearchParams()
    if (companyId) params.set('company_id', companyId)
    return request(`/escrituracao/metrics/financial?${params}`)
  },

  // Accuracy Metrics
  getAccuracyMetrics: (companyId) => {
    const params = new URLSearchParams()
    if (companyId) params.set('company_id', companyId)
    return request(`/escrituracao/metrics/accuracy?${params}`)
  },

  // Vetorial Metrics
  getVetorialMetrics: (companyId) => {
    const params = new URLSearchParams()
    if (companyId) params.set('company_id', companyId)
    return request(`/escrituracao/metrics/vetorial?${params}`)
  },

  // Dashboard Metrics (comprehensive)
  getDashboardMetrics: (companyId) => {
    const params = new URLSearchParams()
    if (companyId) params.set('company_id', companyId)
    return request(`/escrituracao/metrics/dashboard?${params}`)
  },

  // BHules Dashboard (consolidated metrics)
  getBhulesMetrics: ({ startDate, endDate, companyIds } = {}) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','))
    return request(`/metrics/bhules?${params}`)
  },

  // BHub Tax — sessão "Dados das Notas" (todos os tipos de documento)
  getBhubTaxDados: ({ startDate, endDate, companyIds } = {}) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','))
    return request(`/metrics/bhub-tax?${params}`)
  },

  // BHub Tax — sessão "Empresas com Alertas" (motor de anomalias)
  getAnomaliasEmpresas: ({ startDate, endDate, companyIds } = {}) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','))
    return request(`/anomalies/empresas?${params}`)
  },

  // Exception Queue
  getExceptions: ({ companyId, status, tipo, prioridade, slaViolado, limit = 50, offset = 0 } = {}) => {
    const params = new URLSearchParams()
    if (companyId) params.set('company_id', companyId)
    if (status) params.set('status', status)
    if (tipo) params.set('tipo', tipo)
    if (prioridade) params.set('prioridade', prioridade)
    if (slaViolado !== undefined && slaViolado !== null) params.set('sla_violado', slaViolado)
    params.set('limit', limit)
    params.set('offset', offset)
    return request(`/exceptions/?${params}`)
  },

  getExceptionStats: (companyId) => {
    const params = new URLSearchParams()
    if (companyId) params.set('company_id', companyId)
    return request(`/exceptions/stats?${params}`)
  },

  assignException: (id, analista) =>
    request(`/exceptions/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ analista }),
    }),

  resolveException: (id, { resolucao, justificativa, analista, override_aprovador }) =>
    request(`/exceptions/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolucao, justificativa, analista, override_aprovador }),
    }),

  // Classification Overrides
  getClassificationOverrides: (invoiceId) =>
    request(`/invoices/${invoiceId}/classification-overrides`),

  saveClassificationOverrides: (invoiceId, items, motivo) =>
    request(`/invoices/${invoiceId}/classification-overrides`, {
      method: 'PUT',
      body: JSON.stringify({ invoice_id: invoiceId, items, motivo }),
    }),

  // NFS-e Validation
  runNfseValidation: (invoiceId, force = false) => {
    const params = new URLSearchParams()
    if (force) params.set('force', 'true')
    return request(`/nfse/validation/run/${invoiceId}?${params}`, { method: 'POST' })
  },

  getNfseAnalysis: (invoiceId) =>
    request(`/nfse/validation/analysis/${invoiceId}`),

  getNfseAlerts: (invoiceId) =>
    request(`/nfse/validation/alerts/${invoiceId}`),

  runNfseBatchValidation: (invoiceIds, force = false) => {
    const params = new URLSearchParams()
    if (force) params.set('force', 'true')
    return request(`/nfse/validation/run-batch?${params}`, {
      method: 'POST',
      body: JSON.stringify(invoiceIds),
    })
  },

  // NFS-e Dashboard & Benchmark
  getNfseDashboardStats: (companyId) => {
    const params = new URLSearchParams()
    if (companyId) params.set('company_id', companyId)
    return request(`/nfse/validation/dashboard/stats?${params}`)
  },

  runNfseBenchmark: (companyId, limit = 500) => {
    const params = new URLSearchParams()
    if (companyId) params.set('company_id', companyId)
    params.set('limit', limit)
    return request(`/invoices/nfse-benchmark?${params}`, { method: 'POST' })
  },

  getNfseInvoiceAnalysis: (invoiceId) =>
    request(`/invoices/${invoiceId}/nfse-analysis`),

  runAllNfseValidation: (companyId, force = false) => {
    const params = new URLSearchParams()
    if (companyId) params.set('company_id', companyId)
    if (force) params.set('force', 'true')
    return request(`/nfse/validation/run-all?${params}`, { method: 'POST' })
  },

  // NFS-e Feedback
  submitNfseFeedback: (invoiceId, feedbacks) =>
    request(`/invoices/${invoiceId}/nfse-feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbacks),
    }),

  getNfseFeedbackStats: () => request('/invoices/nfse-feedback/stats'),

  // Alerts
  getRecentAlerts: (limit = 50) => request(`/alerts/recent?limit=${limit}`),
  getAlertStats: () => request('/alerts/stats'),

  // Onboarding
  searchCockpit: (query, limit = 20) =>
    request(`/onboarding/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  enableCompany: (data) =>
    request('/onboarding/enable', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOnboardedCompanies: ({ search, regime, ativo, page = 1, pageSize = 50 } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (regime) params.set('regime', regime)
    if (ativo !== undefined && ativo !== null) params.set('ativo', ativo)
    params.set('page', page)
    params.set('page_size', pageSize)
    return request(`/onboarding/companies?${params}`)
  },

  syncCertificates: () =>
    request('/onboarding/sync-certificates', { method: 'POST' }),

  getCompanyCertificate: (companyId) =>
    request(`/onboarding/companies/${companyId}/certificate`),

  // CFOP Operation Rules
  getCfopRules: ({ categoria, escopo, processamento, search, ativo, empresa_id, show_all, page = 1, pageSize = 50 } = {}) => {
    const params = new URLSearchParams()
    if (categoria) params.set('categoria', categoria)
    if (escopo) params.set('escopo', escopo)
    if (processamento) params.set('processamento', processamento)
    if (search) params.set('search', search)
    if (ativo !== undefined && ativo !== null) params.set('ativo', ativo)
    if (empresa_id !== undefined && empresa_id !== null) params.set('empresa_id', empresa_id)
    if (show_all) params.set('show_all', 'true')
    params.set('page', page)
    params.set('page_size', pageSize)
    return request(`/cfop-rules?${params}`)
  },

  getCfopRule: (id) => request(`/cfop-rules/${id}`),

  createCfopRule: (data) =>
    request('/cfop-rules', { method: 'POST', body: JSON.stringify(data) }),

  updateCfopRule: (id, data) =>
    request(`/cfop-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCfopRule: (id) =>
    request(`/cfop-rules/${id}`, { method: 'DELETE' }),

  seedCfopRules: (reset = false) =>
    request(`/cfop-rules/seed?reset=${reset}`, { method: 'POST' }),

  testCfopMatch: ({ cfop_saida, uf_emitente, uf_destinatario }) => {
    const params = new URLSearchParams()
    params.set('cfop_saida', cfop_saida)
    if (uf_emitente) params.set('uf_emitente', uf_emitente)
    if (uf_destinatario) params.set('uf_destinatario', uf_destinatario)
    return request(`/cfop-rules/match/test?${params}`)
  },

  importCfopRules: async (file, empresaId = null) => {
    const formData = new FormData()
    formData.append('file', file)
    const params = new URLSearchParams()
    if (empresaId) params.set('empresa_id', empresaId)
    const url = `${API_BASE}/cfop-rules/import?${params}`
    const res = await fetchWithAuth(url, { method: 'POST', body: formData })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`API ${res.status}: ${body}`)
    }
    return res.json()
  },

  exportCfopRules: async ({ empresa_id, show_all } = {}) => {
    const params = new URLSearchParams()
    if (empresa_id !== undefined && empresa_id !== null) params.set('empresa_id', empresa_id)
    if (show_all) params.set('show_all', 'true')
    const url = `${API_BASE}/cfop-rules/export?${params}`
    const res = await fetchWithAuth(url)
    if (!res.ok) throw new Error(`API ${res.status}`)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cfop_rules_export.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  },

  getCfopRuleStats: ({ empresa_id } = {}) => {
    const params = new URLSearchParams()
    if (empresa_id) params.set('empresa_id', empresa_id)
    return request(`/cfop-rules/stats?${params}`)
  },

  // Presigned URL Upload Flow
  getPresignedUrls: (files) =>
    request('/upload/presign-batch', {
      method: 'POST',
      body: JSON.stringify({ files }),
    }),

  uploadToS3: (presignedUrl, file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presignedUrl, true)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(e.loaded / e.total)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('S3 upload network error')))
      xhr.addEventListener('abort', () => reject(new Error('S3 upload aborted')))

      xhr.send(file)
    })
  },

  processS3Files: (files) =>
    request('/upload/process-batch', {
      method: 'POST',
      body: JSON.stringify({ files }),
    }),

  // Credit Recovery Scanner
  triggerRecoveryScan: (companyId, months = 60) =>
    request(`/recovery/${companyId}/scan?months=${months}`, { method: 'POST' }),

  getRecoveryScans: (companyId) =>
    request(`/recovery/${companyId}/scans`),

  getRecoveryScan: (scanId) =>
    request(`/recovery/scans/${scanId}`),

  getRecoveryOpportunities: (scanId, { tipo, urgencia, risco, tributo, page = 1, pageSize = 50 } = {}) => {
    const params = new URLSearchParams()
    if (tipo) params.set('tipo', tipo)
    if (urgencia) params.set('urgencia', urgencia)
    if (risco) params.set('risco', risco)
    if (tributo) params.set('tributo', tributo)
    params.set('page', page)
    params.set('page_size', pageSize)
    return request(`/recovery/scans/${scanId}/opportunities?${params}`)
  },

  getRecoveryOpportunity: (scanId, oppId) =>
    request(`/recovery/scans/${scanId}/opportunities/${oppId}`),

  getRecoveryDashboard: (scanId) =>
    request(`/recovery/scans/${scanId}/dashboard`),

  generateRecoveryNarrative: (scanId) =>
    request(`/recovery/scans/${scanId}/narrative`, { method: 'POST' }),

  reviewRecoveryOpportunity: (oppId, reviewStatus, notes) =>
    request(`/recovery/opportunities/${oppId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ review_status: reviewStatus, notes }),
    }),

  getRecoveryPortfolio: (limit = 50) =>
    request(`/recovery/dashboard/portfolio?limit=${limit}`),

  triggerRecoveryScanAll: (months = 60) =>
    request(`/recovery/scan-all?months=${months}`, { method: 'POST' }),

  // Tax table alerts — human-in-the-loop approval for DOU-sourced updates
  getTaxTablePendingAlerts: () => request('/reference/tax-tables/pending-alerts'),
  approveTaxTable: (table, competencia) =>
    request(`/reference/tax-tables/${table}/approve/${competencia}`, {
      method: 'POST',
    }),

}
