import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '../api/client'

export function useInvoices({ enabled = true, ...params } = {}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => api.getInvoices(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled,
  })
}

// Contagens por status do painel — FONTE ÚNICA para ListView e Sidebar
// (FE-02, perf 18/08). Os dois montam no load; antes cada um tinha sua própria
// query (`['statusCounts','55']` sem datas no Sidebar, com datas na ListView) →
// 2 requests para o mesmo endpoint. Com a mesma queryKey e os mesmos params, o
// React Query desduplica em 1 request.
//
// Consequência funcional aceita (decisão FE-02/D6 da spec): o badge do Sidebar
// passa a contar o RECORTE DO PAINEL (mesmas datas/empresas da lista) — antes
// contava o histórico inteiro, o que divergia do que a tela mostrava.
//
// A queryKey mantém o prefixo `['statusCounts', ...]`, então as invalidações
// existentes (useUndoEscrituracao, DetailView, EscrituracaoTab) continuam
// valendo. Polling: 60 s → 5 min e só com a aba visível.
export function useStatusCounts({ codMod, startDate, endDate, companyIds, indEmit, indOper, enabled = true } = {}) {
  const ids = companyIds && companyIds.length > 0 ? companyIds : undefined
  const companyIdsKey = ids ? [...ids].sort().join(',') : ''
  return useQuery({
    queryKey: ['statusCounts', codMod, startDate || '', endDate || '', companyIdsKey, indEmit || '', indOper || ''],
    queryFn: () => api.getStatusCounts(
      ids,
      codMod,
      startDate || undefined,
      endDate || undefined,
      indEmit,
      indOper,
    ),
    staleTime: 60_000,
    refetchInterval: 300_000,
    refetchIntervalInBackground: false,
    enabled,
  })
}

export function useIntegratedInvoices({ companyIds, companyId, page = 1, size = 50, search, codMod, indEmit, indOper, startDate, endDate } = {}) {
  return useQuery({
    queryKey: ['integratedInvoices', { companyIds, companyId, page, size, search, codMod, indEmit, indOper, startDate, endDate }],
    queryFn: () => api.getIntegratedInvoices({ companyIds, companyId, page, size, search, codMod, indEmit, indOper, startDate, endDate }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

export function useNfsePrestadosGrupos({ companyIds, startDate, endDate, tipo, sinal, orderBy, page = 1, size = 50, enabled = true } = {}) {
  return useQuery({
    queryKey: ['nfsePrestadosGrupos', { companyIds, startDate, endDate, tipo, sinal, orderBy, page, size }],
    queryFn: () => api.getNfsePrestadosGrupos({ companyIds, startDate, endDate, tipo, sinal, orderBy, page, size }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled,
  })
}

export function useCapturedInvoices({ companyId, type, startDate, endDate, page = 1, size = 50, search } = {}) {
  return useQuery({
    queryKey: ['capturedInvoices', { companyId, type, startDate, endDate, page, size, search }],
    queryFn: () => api.getCapturedInvoices({ companyId, type, startDate, endDate, page, size, search }),
    enabled: !!companyId,
  })
}

export function useSyncCapture() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, startDate, endDate }) =>
      api.syncCapture({ companyId, startDate, endDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useInvoiceDetail(id) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.getInvoice(id),
    enabled: !!id,
  })
}

export function useInvoiceAuditEvents(id) {
  return useQuery({
    queryKey: ['invoiceAuditEvents', id],
    queryFn: () => api.getInvoiceAuditEvents(id),
    enabled: !!id,
  })
}

export function useInvoiceItems(id) {
  return useQuery({
    queryKey: ['invoiceItems', id],
    queryFn: () => api.getInvoiceItems(id),
    enabled: !!id,
  })
}

export function useStatusReasons(id) {
  return useQuery({
    queryKey: ['statusReasons', id],
    queryFn: () => api.getStatusReasons(id),
    enabled: !!id,
  })
}

export function useClassificationHistory({ companyIds, startDate, endDate, granularity } = {}) {
  return useQuery({
    queryKey: ['classificationHistory', { companyIds, startDate, endDate, granularity }],
    queryFn: () => api.getClassificationHistory({ companyIds, startDate, endDate, granularity }),
  })
}

export function useClassificationDashboard({ companyIds, startDate, endDate } = {}) {
  return useQuery({
    queryKey: ['classificationDashboard', { companyIds, startDate, endDate }],
    queryFn: () => api.getClassificationDashboard({ companyIds, startDate, endDate }),
  })
}

export function useReprocessEngine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, startDate, endDate }) => api.reprocessCompany(companyId, startDate, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useInvoiceFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, vote, comment, categories }) =>
      api.postInvoiceFeedback(invoiceId, { vote, comment, categories }),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoiceFeedback', invoiceId] })
    },
  })
}



export function useUndoEscrituracao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invoiceIds) => api.undoEscrituracao(invoiceIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['statusCounts'] })
    },
  })
}

export function useNfseFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, vote, comment, categories }) => {
      // Map selected categories to per-tributo feedback
      const allTributos = ['irrf', 'csll', 'pis', 'cofins', 'inss', 'iss']
      const selected = (categories || []).filter(c => c !== 'outro')
      const feedbacks = (selected.length > 0 ? selected : allTributos)
        .filter(c => allTributos.includes(c))
        .map(cat => ({
          tributo: cat.toUpperCase(),
          motor_acertou: vote === 'up',
          correcoes: null,
          comment: comment || null,
        }))
      if (feedbacks.length === 0) {
        // Fallback: 'outro' selected, send generic feedback
        feedbacks.push({ tributo: 'IRRF', motor_acertou: vote === 'up', correcoes: null, comment: comment || null })
      }
      return api.submitNfseFeedback(invoiceId, feedbacks)
    },
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoiceFeedback', invoiceId] })
    },
  })
}

export function useInvoiceFeedbackStatus(invoiceId) {
  return useQuery({
    queryKey: ['invoiceFeedback', invoiceId],
    queryFn: () => api.getInvoiceFeedback(invoiceId),
    enabled: !!invoiceId,
  })
}
