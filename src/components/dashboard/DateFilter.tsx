import { Calendar } from 'lucide-react'
import { SegmentedControl } from '../ui/SegmentedControl'
import type { DateFilterKey } from '../../types'

const OPTIONS: { label: string; value: DateFilterKey }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This week', value: 'this_week' },
  { label: 'This month', value: 'this_month' },
]

export function DateFilter({
  value,
  onChange,
  onCustom,
  showCustom = true,
}: {
  value: DateFilterKey
  onChange: (v: DateFilterKey) => void
  onCustom?: (from: string, to: string) => void
  showCustom?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-400">
        <Calendar className="h-4 w-4" />
        Filter
      </div>
      <SegmentedControl<DateFilterKey> options={OPTIONS} value={value} onChange={onChange} size="sm" />
      {showCustom && (
        <button
          onClick={() => onChange('custom')}
          className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
            value === 'custom' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
          }`}
        >
          Custom range
        </button>
      )}
    </div>
  )
}
