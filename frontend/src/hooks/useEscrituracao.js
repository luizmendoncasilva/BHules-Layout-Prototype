import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useEscrituracao(invoiceId) {
  return useQuery({
    queryKey: ['escrituracao', invoiceId],
    queryFn: () => api.getEscrituracao(invoiceId),
    enabled: !!invoiceId,
    retry: false,
  })
}

export function useRunEscrituracao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, force = false }) =>
      api.runEscrituracao(invoiceId, force),
    onSuccess: (data, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['escrituracao', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
