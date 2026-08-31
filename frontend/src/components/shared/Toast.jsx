import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { IconButton } from '@bhubai/bhub-design-system'

const ToastContext = createContext(null)

const VARIANTS = {
  success: { icon: CheckCircle2, className: 'bg-success-subtle text-success-text border-success-border' },
  error: { icon: XCircle, className: 'bg-destructive-subtle text-destructive-text border-destructive-border' },
  warning: { icon: AlertTriangle, className: 'bg-warning-subtle text-warning-text border-warning-border' },
  info: { icon: Info, className: 'bg-info-subtle text-info-text border-info-border' },
}

const DEFAULT_DURATION = 4000

function ToastItem({ toast, onDismiss }) {
  const { icon: Icon, className } = VARIANTS[toast.variant] || VARIANTS.info
  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 w-80 max-w-[calc(100vw-2rem)] rounded-lg border ${className} px-4 py-3 shadow-lg animate-in`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{toast.message}</p>
        {toast.description && <p className="text-xs mt-1 opacity-90 leading-snug">{toast.description}</p>}
      </div>
      <IconButton
        aria-label="Fechar"
        variant="ghost"
        size="sm"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-70 hover:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </IconButton>
    </div>
  )
}

// Provider único para toda a aplicação — monte uma vez perto da raiz (App.jsx).
// Padroniza toda mensagem transitória de sucesso/erro/aviso/info da app,
// substituindo alert()s e banners inline ad-hoc por um único visual.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)
  const timersRef = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
  }, [])

  const push = useCallback((variant, message, opts = {}) => {
    const id = ++idRef.current
    const duration = opts.duration ?? DEFAULT_DURATION
    setToasts((prev) => [...prev, { id, variant, message, description: opts.description }])
    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const api = {
    success: (message, opts) => push('success', message, opts),
    error: (message, opts) => push('error', message, opts),
    warning: (message, opts) => push('warning', message, opts),
    info: (message, opts) => push('info', message, opts),
    dismiss,
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// useToast().success('Regra salva com sucesso'), .error(...), .warning(...), .info(...)
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast() precisa estar dentro de <ToastProvider>')
  return ctx
}
