import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '../api/client'

export function useReinfByCompany() {
  return useQuery({
    queryKey: ['reinfByCompany'],
    queryFn: () => api.getReinfByCompany(),
  })
}

export function useReinfFiles(params = {}) {
  const { _enabled, ...queryParams } = params
  return useQuery({
    queryKey: ['reinfFiles', queryParams],
    queryFn: () => api.getReinfFiles(queryParams),
    placeholderData: keepPreviousData,
    enabled: _enabled !== false,
  })
}

export function useReinfEvents(fileId) {
  return useQuery({
    queryKey: ['reinfEvents', fileId],
    queryFn: () => api.getReinfEvents(fileId),
    enabled: !!fileId,
  })
}

export function useUploadReinf() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file) => api.uploadReinf(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reinfByCompany'] })
      queryClient.invalidateQueries({ queryKey: ['reinfFiles'] })
      queryClient.invalidateQueries({ queryKey: ['onboardedCompanies'] })
    },
  })
}

export function useUploadReinfBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (files) => api.uploadReinfBatch(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reinfByCompany'] })
      queryClient.invalidateQueries({ queryKey: ['reinfFiles'] })
      queryClient.invalidateQueries({ queryKey: ['onboardedCompanies'] })
    },
  })
}

export function useDeleteReinf() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fileId) => api.deleteReinfFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reinfByCompany'] })
      queryClient.invalidateQueries({ queryKey: ['reinfFiles'] })
    },
  })
}
