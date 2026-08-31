import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function useRulesCatalog() {
  return useQuery({
    queryKey: ['rulesCatalog'],
    queryFn: () => api.getRulesCatalog(),
  })
}
