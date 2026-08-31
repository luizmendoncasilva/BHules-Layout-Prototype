import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useReformDiagnosis(companyId) {
  return useQuery({
    queryKey: ['reform-diagnosis', companyId],
    queryFn: () => api.getReformDiagnosis(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'COMPUTING' ? 3000 : false
    },
  })
}

export function useGenerateReformDiagnosis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, targetYear, periodMonths, folhaMensal, faturamentoMensal, dasMensal, anexoSimples }) =>
      api.generateReformDiagnosis(companyId, { targetYear, periodMonths, folhaMensal, faturamentoMensal, dasMensal, anexoSimples }),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['reform-diagnosis', companyId] })
    },
  })
}

export function useGenerateReformNarrative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (companyId) => api.generateReformNarrative(companyId),
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ['reform-diagnosis', companyId] })
    },
  })
}
