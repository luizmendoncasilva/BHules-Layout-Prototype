import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '../api/client'

export function useSpedByCompany() {
  return useQuery({
    queryKey: ['spedByCompany'],
    queryFn: () => api.getSpedByCompany(),
  })
}

export function useSpedFiles(params = {}) {
  const { _enabled, ...queryParams } = params
  return useQuery({
    queryKey: ['spedFiles', queryParams],
    queryFn: () => api.getSpedFiles(queryParams),
    placeholderData: keepPreviousData,
    enabled: _enabled !== false,
  })
}

export function useUploadSped() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file) => api.uploadSped(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spedByCompany'] })
      queryClient.invalidateQueries({ queryKey: ['spedFiles'] })
      queryClient.invalidateQueries({ queryKey: ['onboardedCompanies'] })
    },
  })
}

export function useUploadSpedBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (files) => api.uploadSpedBatch(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spedByCompany'] })
      queryClient.invalidateQueries({ queryKey: ['spedFiles'] })
      queryClient.invalidateQueries({ queryKey: ['onboardedCompanies'] })
    },
  })
}

export function useDeleteSped() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fileId) => api.deleteSpedFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spedByCompany'] })
      queryClient.invalidateQueries({ queryKey: ['spedFiles'] })
    },
  })
}
