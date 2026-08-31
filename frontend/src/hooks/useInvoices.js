import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '../api/client'

export function useInvoices(params = {}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => api.getInvoices(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

export function useIntegratedInvoices({ companyIds, companyId, page = 1, size = 50, search, codMod, indEmit, startDate, endDate } = {}) {
  return useQuery({
    queryKey: ['integratedInvoices', { companyIds, companyId, page, size, search, codMod, indEmit, startDate, endDate }],
    queryFn: () => api.getIntegratedInvoices({ companyIds, companyId, page, size, search, codMod, indEmit, startDate, endDate }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
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

export function useClassificationOverrides(invoiceId) {
  return useQuery({
    queryKey: ['classificationOverrides', invoiceId],
    queryFn: () => api.getClassificationOverrides(invoiceId),
    enabled: !!invoiceId,
  })
}

export function useSaveClassificationOverrides() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, items, motivo }) =>
      api.saveClassificationOverrides(invoiceId, items, motivo),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['classificationOverrides', invoiceId] })
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
