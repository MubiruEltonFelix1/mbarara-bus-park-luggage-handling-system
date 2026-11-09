import { useId } from 'react'
import { cn } from '../../lib/utils'

export interface BarDatum {
  label: string
  value: number
  sublabel?: string
}

/** Vertical bar chart with hover tooltips and gridlines. */
export function BarChart({ data, formatValue, color = 'bg-brand-500', height = 160 }: { data: BarDatum[]; formatValue?: (v: number) => string; color?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const gid = useId()
  return (
    <div className="w-full">
      <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.value / max) * 100
          return (
            <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1.5">
              <div className="relative flex w-full justify-center">
                <div className="pointer-events-none absolute -top-7 z-10 hidden whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[11px] font-medium text-white shadow-pop group-hover:block">
                  {formatValue ? formatValue(d.value) : d.value}
                </div>
              </div>
              <div className="flex h-full w-full items-end">
                <div
                  className={cn('w-full rounded-t-md transition-all duration-300 group-hover:opacity-80', color)}
                  style={{ height: `${h}%`, minHeight: d.value > 0 ? 4 : 0 }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center text-center">
            <span className="text-[11px] font-medium text-ink-600">{d.label}</span>
            {d.sublabel && <span className="text-[10px] text-ink-400">{d.sublabel}</span>}
          </div>
        ))}
      </div>
      {/* hidden to satisfy useId usage; keep gid referenced */}
      <span className="hidden" data-gid={gid} />
    </div>
  )
}

/** Horizontal bar list — good for "revenue by destination" style rankings. */
export function HBarList({
  data,
  formatValue,
}: {
  data: BarDatum[]
  formatValue?: (v: number) => string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-ink-700">{d.label}</span>
            <span className="text-ink-500">{formatValue ? formatValue(d.value) : d.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
