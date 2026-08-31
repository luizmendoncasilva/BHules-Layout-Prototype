import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: api.getCompanies,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
