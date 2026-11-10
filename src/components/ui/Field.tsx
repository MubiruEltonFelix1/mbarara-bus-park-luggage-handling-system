import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Label({ children, htmlFor, required }: { children: ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  )
}

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
      {children}
    </p>
  )
}

export function FieldHint({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <p className="mt-1 text-xs text-ink-400">{children}</p>
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  leftIcon?: ReactNode
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leftIcon, ...props },
  ref,
) {
  if (leftIcon) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{leftIcon}</span>
        <input
          ref={ref}
          className={cn('input-base pl-9', invalid && 'border-red-300 ring-2 ring-red-500/20', className)}
          {...props}
        />
      </div>
    )
  }
  return <input ref={ref} className={cn('input-base', invalid && 'border-red-300 ring-2 ring-red-500/20', className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...props }, ref) {
    return <textarea ref={ref} className={cn('input-base min-h-[80px] resize-y', invalid && 'border-red-300 ring-2 ring-red-500/20', className)} {...props} />
  },
)

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn('input-base appearance-none bg-no-repeat pr-9', invalid && 'border-red-300 ring-2 ring-red-500/20', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7484'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")", backgroundPosition: 'right 0.6rem center', backgroundSize: '1.25rem' }}
      {...props}
    >
      {children}
    </select>
  )
})

/** A labeled field wrapper that composes label + control + hint/error. */
export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: {
  label?: ReactNode
  htmlFor?: string
  required?: boolean
  error?: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('w-full', className)}>
      {label && <Label htmlFor={htmlFor} required={required}>{label}</Label>}
      {children}
      {error ? <FieldError>{error}</FieldError> : <FieldHint>{hint}</FieldHint>}
    </div>
  )
}
