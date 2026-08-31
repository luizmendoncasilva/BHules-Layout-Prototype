import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function usePostFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.postFeedback(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validationResults'] })
    },
  })
}
