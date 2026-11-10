export interface AreaDatum {
  label: string
  value: number
}

/** Smooth area chart for ticket-volume trend. */
export function AreaChart({ data, height = 140 }: { data: AreaDatum[]; height?: number }) {
  const width = 600
  const pad = 8
  const max = Math.max(1, ...data.map((d) => d.value))
  const min = Math.min(...data.map((d) => d.value), 0)
  const range = max - min || 1
  const stepX = (width - pad * 2) / Math.max(1, data.length - 1)

  const points = data.map((d, i) => {
    const x = pad + i * stepX
    const y = height - pad - ((d.value - min) / range) * (height - pad * 2)
    return [x, y] as const
  })

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${path} L${points[points.length - 1][0]},${height - pad} L${points[0][0]},${height - pad} Z`

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={pad} x2={width - pad} y1={height * g} y2={height * g} stroke="#eef0f4" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#areaFill)" />
        <path d={path} fill="none" stroke="#059669" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map(([x, y], i) => (
          <g key={i} className="group">
            <circle cx={x} cy={y} r="3" fill="#fff" stroke="#059669" strokeWidth="2" />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-ink-400">{d.label}</span>
        ))}
      </div>
    </div>
  )
}
