import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useCrawlSources(scope) {
  return useQuery({
    queryKey: ['crawlSources', scope],
    queryFn: () => api.getCrawlSources(scope),
  })
}

export function useCrawlJobs(limit = 20, { pollingEnabled = false } = {}) {
  return useQuery({
    queryKey: ['crawlJobs', limit],
    queryFn: () => api.getCrawlJobs(limit),
    refetchInterval: pollingEnabled ? 3000 : false,
  })
}

export function useSyncSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sourceType) => api.syncSource(sourceType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlSources'] })
      queryClient.invalidateQueries({ queryKey: ['crawlJobs'] })
      queryClient.invalidateQueries({ queryKey: ['legislationArticleCount'] })
    },
  })
}

export function useSyncAllSources() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.syncSource(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlSources'] })
      queryClient.invalidateQueries({ queryKey: ['crawlJobs'] })
      queryClient.invalidateQueries({ queryKey: ['legislationArticleCount'] })
    },
  })
}

export function useToggleSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }) => api.toggleSource(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlSources'] })
    },
  })
}

export function useLegislationArticleCount() {
  return useQuery({
    queryKey: ['legislationArticleCount'],
    queryFn: () => api.getLegislationArticles({ page: 1, pageSize: 1 }),
  })
}

export function useLegislationArticles({ page = 1, pageSize = 50, sourceId, tipo, uf, tags, hasEmbedding, search } = {}) {
  return useQuery({
    queryKey: ['legislationArticles', page, pageSize, sourceId, tipo, uf, tags, hasEmbedding, search],
    queryFn: () => api.getLegislationArticles({ page, pageSize, sourceId, tipo, uf, tags, hasEmbedding, search }),
  })
}
