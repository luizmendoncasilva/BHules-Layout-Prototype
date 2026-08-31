import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '../api/client'

export function useSimplesNacionalFiles(params = {}) {
  const { _enabled, ...queryParams } = params
  return useQuery({
    queryKey: ['simplesNacionalFiles', queryParams],
    queryFn: () => api.getSimplesNacionalFiles(queryParams),
    placeholderData: keepPreviousData,
    enabled: _enabled !== false,
  })
}

export function useUploadSimplesNacional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file) => api.uploadSimplesNacional(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simplesNacionalFiles'] })
      queryClient.invalidateQueries({ queryKey: ['onboardedCompanies'] })
    },
  })
}

export function useUploadSimplesNacionalBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (files) => api.uploadSimplesNacionalBatch(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simplesNacionalFiles'] })
      queryClient.invalidateQueries({ queryKey: ['onboardedCompanies'] })
    },
  })
}

export function useDeleteSimplesNacional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fileId) => api.deleteSimplesNacionalFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simplesNacionalFiles'] })
    },
  })
}
