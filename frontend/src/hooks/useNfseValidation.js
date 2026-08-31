import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useRunNfseValidation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, force = false }) => api.runNfseValidation(invoiceId, force),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['nfseAnalysis', data.invoice_id] })
      queryClient.invalidateQueries({ queryKey: ['nfseAlerts', data.invoice_id] })
      queryClient.invalidateQueries({ queryKey: ['validationResults', data.invoice_id] })
    },
  })
}

export function useNfseAnalysis(invoiceId) {
  return useQuery({
    queryKey: ['nfseAnalysis', invoiceId],
    queryFn: () => api.getNfseAnalysis(invoiceId),
    enabled: !!invoiceId,
  })
}

export function useNfseAlerts(invoiceId) {
  return useQuery({
    queryKey: ['nfseAlerts', invoiceId],
    queryFn: () => api.getNfseAlerts(invoiceId),
    enabled: !!invoiceId,
  })
}

export function useRunNfseBatchValidation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceIds, force = false }) => api.runNfseBatchValidation(invoiceIds, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
