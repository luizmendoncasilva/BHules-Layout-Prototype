import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useDiagnosis(companyId) {
  return useQuery({
    queryKey: ['diagnosis', companyId],
    queryFn: () => api.getDiagnosis(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchInterval: (query) => {
      // Auto-refetch while COMPUTING
      const status = query.state.data?.status
      return status === 'COMPUTING' ? 3000 : false
    },
  })
}

export function useGenerateDiagnosis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, periodMonths }) =>
      api.generateDiagnosis(companyId, periodMonths),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['diagnosis', companyId] })
    },
  })
}

export function useGenerateNarrative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (companyId) => api.generateNarrative(companyId),
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ['diagnosis', companyId] })
    },
  })
}
