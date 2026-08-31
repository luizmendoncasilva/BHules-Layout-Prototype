import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '../api/client'

export function useCfopRules(params = {}) {
  return useQuery({
    queryKey: ['cfopRules', params],
    queryFn: () => api.getCfopRules(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateCfopRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.createCfopRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfopRules'] })
    },
  })
}

export function useUpdateCfopRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateCfopRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfopRules'] })
    },
  })
}

export function useDeleteCfopRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.deleteCfopRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfopRules'] })
    },
  })
}

export function useSeedCfopRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reset = false) => api.seedCfopRules(reset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfopRules'] })
    },
  })
}

export function useImportCfopRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, empresaId }) => api.importCfopRules(file, empresaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfopRules'] })
    },
  })
}

export function useCfopRuleStats(params = {}) {
  return useQuery({
    queryKey: ['cfopRuleStats', params],
    queryFn: () => api.getCfopRuleStats(params),
  })
}
