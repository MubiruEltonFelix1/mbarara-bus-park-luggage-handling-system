import { cn } from '../../lib/utils'

export interface DonutDatum {
  label: string
  value: number
  color: string // hex
}

/** Donut chart with center total + legend. Good for payment-method breakdown. */
export function DonutChart({ data, centerLabel, formatValue }: { data: DonutDatum[]; centerLabel?: string; formatValue?: (v: number) => string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const radius = 60
  const stroke = 18
  const c = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <div className="relative h-[150px] w-[150px] flex-shrink-0">
        <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
          <circle cx="75" cy="75" r={radius} fill="none" stroke="#eef0f4" strokeWidth={stroke} />
          {data.map((d, i) => {
            const frac = d.value / total
            const len = frac * c
            const dash = `${len} ${c - len}`
            const seg = (
              <circle
                key={i}
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += len
            return seg
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-ink-900">{formatValue ? formatValue(total) : total}</span>
          {centerLabel && <span className="text-[11px] text-ink-400">{centerLabel}</span>}
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className={cn('h-2.5 w-2.5 rounded-full')} style={{ backgroundColor: d.color }} />
              <span className="text-ink-700">{d.label}</span>
            </span>
            <span className="font-medium text-ink-500">
              {formatValue ? formatValue(d.value) : d.value}
              <span className="ml-1 text-ink-400">({Math.round((d.value / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
