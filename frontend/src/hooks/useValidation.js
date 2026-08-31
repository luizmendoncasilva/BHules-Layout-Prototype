import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useValidationResults(invoiceId) {
  return useQuery({
    queryKey: ['validationResults', invoiceId],
    queryFn: () => api.getValidationResults({ invoiceId }),
    enabled: !!invoiceId,
  })
}

export function useValidationAnalysis(invoiceId, analysisType = 'CONSISTENCIA_FISCAL') {
  return useQuery({
    queryKey: ['validationAnalysis', invoiceId, analysisType],
    queryFn: () => api.getValidationAnalysis(invoiceId, analysisType),
    enabled: !!invoiceId,
  })
}

export function useRunValidation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, analysisType = 'CONSISTENCIA_FISCAL' }) =>
      api.runValidation(invoiceId, analysisType),
    onSuccess: (_data, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['validationResults', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['validationAnalysis', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    },
  })
}
