import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from '../ui/Card'
import { cn } from '../../lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  delta,
  hint,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'brand' | 'amber' | 'blue' | 'green' | 'red' | 'gray'
  delta?: number
  hint?: string
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-ink-100 text-ink-500',
  }
  return (
    <Card className="p-4 transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900">{value}</p>
          {hint && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}
        </div>
        <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {typeof delta === 'number' && (
        <div className="mt-2 flex items-center gap-1 text-[11px] font-medium">
          <span className={cn('inline-flex items-center gap-0.5', delta >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-ink-400">vs yesterday</span>
        </div>
      )}
    </Card>
  )
}
