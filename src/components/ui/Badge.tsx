import type { ReactNode } from 'react'
import type { TicketStatus } from '../../types'
import { cn, statusColor } from '../../lib/utils'

type Tone = 'gray' | 'amber' | 'blue' | 'green' | 'red' | 'teal' | 'brand'

const toneClasses: Record<Tone, string> = {
  gray: 'bg-ink-100 text-ink-600 border-ink-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  teal: 'bg-teal-50 text-teal-700 border-teal-100',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
}

const dotClasses: Record<Tone, string> = {
  gray: 'bg-ink-400',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  teal: 'bg-teal-500',
  brand: 'bg-brand-500',
}

export function Badge({ tone = 'gray', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[tone])} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status, dot = true, className }: { status: TicketStatus; dot?: boolean; className?: string }) {
  return (
    <Badge tone={statusColor(status)} dot={dot} className={className}>
      {status}
    </Badge>
  )
}
