import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: ({ message, history }) => api.sendChatMessage({ message, history }),
  })

  const sendMessage = useCallback((text) => {
    const userMsg = { role: 'user', content: text }
    setMessages((prev) => {
      const updated = [...prev, userMsg]

      // Build history for the API (last 10 messages)
      const history = updated.slice(-10).map(({ role, content }) => ({ role, content }))

      mutation.mutate(
        { message: text, history },
        {
          onSuccess: (data) => {
            setMessages((prev2) => [
              ...prev2,
              {
                role: 'assistant',
                content: data.answer,
                sources: data.sources,
                model_used: data.model_used,
              },
            ])
          },
          onError: (err) => {
            setMessages((prev2) => [
              ...prev2,
              {
                role: 'assistant',
                content: `Erro: ${err.message}`,
                sources: [],
              },
            ])
          },
        },
      )

      return updated
    })
  }, [mutation])

  const clearChat = useCallback(() => setMessages([]), [])
  const toggleOpen = useCallback(() => setIsOpen((v) => !v), [])

  return {
    messages,
    isOpen,
    isLoading: mutation.isPending,
    sendMessage,
    clearChat,
    toggleOpen,
  }
}
