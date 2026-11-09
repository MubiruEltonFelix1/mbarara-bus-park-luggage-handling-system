import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const pages: number[] = []
  const start = Math.max(1, page - 1)
  const end = Math.min(totalPages, start + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition hover:bg-ink-50 disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {start > 1 && (
        <>
          <PageButton n={1} active={page === 1} onClick={onPage} />
          {start > 2 && <span className="px-1 text-ink-400">…</span>}
        </>
      )}
      {pages.map((p) => (
        <PageButton key={p} n={p} active={page === p} onClick={onPage} />
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-ink-400">…</span>}
          <PageButton n={totalPages} active={page === totalPages} onClick={onPage} />
        </>
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition hover:bg-ink-50 disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function PageButton({ n, active, onClick }: { n: number; active: boolean; onClick: (p: number) => void }) {
  return (
    <button
      onClick={() => onClick(n)}
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition',
        active ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 text-ink-700 hover:bg-ink-50',
      )}
    >
      {n}
    </button>
  )
}
