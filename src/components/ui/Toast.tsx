import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

type Tone = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  tone: Tone
  title: string
  description?: string
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<Tone, { icon: ReactNode; ring: string; bar: string }> = {
  success: { icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, ring: 'border-l-emerald-500', bar: 'bg-emerald-500' },
  error: { icon: <XCircle className="h-5 w-5 text-red-500" />, ring: 'border-l-red-500', bar: 'bg-red-500' },
  info: { icon: <Info className="h-5 w-5 text-brand-500" />, ring: 'border-l-brand-500', bar: 'bg-brand-500' },
  warning: { icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, ring: 'border-l-amber-500', bar: 'bg-amber-500' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { ...t, id }])
      setTimeout(() => remove(id), 4500)
    },
    [remove],
  )

  const value: ToastContextValue = {
    toast,
    success: (title, description) => toast({ tone: 'success', title, description }),
    error: (title, description) => toast({ tone: 'error', title, description }),
    info: (title, description) => toast({ tone: 'info', title, description }),
    warning: (title, description) => toast({ tone: 'warning', title, description }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 no-print">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border border-ink-200 border-l-4 bg-white p-3.5 shadow-pop animate-slide-in-right',
                toneStyles[t.tone].ring,
              )}
            >
              <span className="mt-0.5 flex-shrink-0">{toneStyles[t.tone].icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs text-ink-500">{t.description}</p>}
              </div>
              <button onClick={() => remove(t.id)} className="text-ink-400 hover:text-ink-600" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
