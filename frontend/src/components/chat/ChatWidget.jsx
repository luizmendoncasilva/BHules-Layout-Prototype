import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Trash2, SendHorizontal, ChevronDown, Bot } from 'lucide-react'
import { IconButton, Tooltip, TooltipTrigger, TooltipContent, Button, Textarea, Spinner } from '@bhubai/bhub-design-system'
import { useChat } from '../../hooks/useChat'

const SUGGESTIONS = [
  'O que é DIFAL?',
  'NCMs com redução de BC no RJ?',
  'Quais as alíquotas interestaduais de ICMS?',
  'Como funciona a substituição tributária?',
]

function SourcesBadge({ sources }) {
  const [open, setOpen] = useState(false)
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-info-text hover:opacity-80 font-medium"
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        {sources.length} fonte{sources.length > 1 ? 's' : ''}
      </button>
      {open && (
        <div className="mt-1 space-y-1.5">
          {sources.map((s, i) => (
            <div key={i} className="rounded bg-card border border-border p-2 text-xs">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-foreground">{s.source_label}</span>
                <span className="text-xs bg-info-subtle text-info-text px-1.5 py-0.5 rounded-full font-medium">
                  {Math.round(s.similarity * 100)}%
                </span>
              </div>
              {s.artigo && <div className="text-muted-foreground text-xs mb-0.5">{s.artigo}</div>}
              <p className="text-muted-foreground line-clamp-3">{s.excerpt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center gap-1 mb-0.5 ml-1">
            <Bot className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Assistente</span>
          </div>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md'
          }`}
        >
          {msg.content}
        </div>
        {!isUser && <SourcesBadge sources={msg.sources} />}
      </div>
    </div>
  )
}

function LoadingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center">
        <Spinner size="sm" className="text-muted-foreground" />
      </div>
    </div>
  )
}

export default function ChatWidget() {
  const { messages, isOpen, isLoading, sendMessage, clearChat, toggleOpen } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    sendMessage(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Floating bubble
  if (!isOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            aria-label="Assistente Legislativo"
            onClick={toggleOpen}
            className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover hover:shadow-xl transition-all hover:scale-105"
          >
            <MessageCircle className="w-6 h-6" />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent side="left">Assistente Legislativo</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 w-96 h-[35rem] max-h-[80vh] flex flex-col rounded-lg shadow-2xl border border-border bg-card overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold text-sm">Assistente Legislativo</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                aria-label="Limpar conversa"
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Limpar conversa</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                aria-label="Fechar"
                variant="ghost"
                size="sm"
                onClick={toggleOpen}
                className="text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
              >
                <X className="w-4 h-4" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Fechar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-info-subtle flex items-center justify-center">
              <Bot className="w-6 h-6 text-info-text" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Como posso ajudar?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Pergunte sobre legislação tributária brasileira
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="xs"
                  onClick={() => sendMessage(s)}
                  className="rounded-full text-muted-foreground hover:bg-info-subtle hover:border-info-border hover:text-info-text"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {isLoading && <LoadingDots />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-3 py-2.5 shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre legislação..."
            rows={1}
            className="flex-1 min-h-0 resize-none max-h-24 overflow-y-auto"
          />
          <IconButton
            aria-label="Enviar mensagem"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            <SendHorizontal className="w-4 h-4" />
          </IconButton>
        </div>
      </div>
    </div>
  )
}
