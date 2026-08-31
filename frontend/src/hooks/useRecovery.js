import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useRecoveryScans(companyId) {
  return useQuery({
    queryKey: ['recovery-scans', companyId],
    queryFn: () => api.getRecoveryScans(companyId),
    enabled: !!companyId,
    staleTime: 30 * 1000,
  })
}

export function useRecoveryScan(scanId) {
  return useQuery({
    queryKey: ['recovery-scan', scanId],
    queryFn: () => api.getRecoveryScan(scanId),
    enabled: !!scanId,
    staleTime: 10 * 1000,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'COMPUTING' || status === 'PENDING' ? 3000 : false
    },
  })
}

export function useRecoveryDashboard(scanId) {
  return useQuery({
    queryKey: ['recovery-dashboard', scanId],
    queryFn: () => api.getRecoveryDashboard(scanId),
    enabled: !!scanId,
    staleTime: 60 * 1000,
  })
}

export function useRecoveryOpportunities(scanId, filters = {}) {
  return useQuery({
    queryKey: ['recovery-opportunities', scanId, filters],
    queryFn: () => api.getRecoveryOpportunities(scanId, filters),
    enabled: !!scanId,
    staleTime: 30 * 1000,
  })
}

export function useRecoveryPortfolio() {
  return useQuery({
    queryKey: ['recovery-portfolio'],
    queryFn: () => api.getRecoveryPortfolio(),
    staleTime: 60 * 1000,
  })
}

export function useTriggerRecoveryScan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, months = 60 }) =>
      api.triggerRecoveryScan(companyId, months),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['recovery-scans', companyId] })
    },
  })
}

export function useGenerateRecoveryNarrative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (scanId) => api.generateRecoveryNarrative(scanId),
    onSuccess: (_, scanId) => {
      queryClient.invalidateQueries({ queryKey: ['recovery-scan', scanId] })
    },
  })
}

export function useReviewOpportunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ oppId, reviewStatus, notes }) =>
      api.reviewRecoveryOpportunity(oppId, reviewStatus, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recovery-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['recovery-opportunities'] })
    },
  })
}
