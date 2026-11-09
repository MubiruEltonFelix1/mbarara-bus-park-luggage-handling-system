import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Combobox({
  value,
  options,
  onChange,
  placeholder,
  invalid,
  id,
  allowFreeText = true,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  placeholder?: string
  invalid?: boolean
  id?: string
  allowFreeText?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filtered = query ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase())) : options

  const select = (v: string) => {
    onChange(v)
    setQuery(v)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <input
        id={id}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (allowFreeText) onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={cn('input-base pr-9', invalid && 'border-red-300 ring-2 ring-red-500/20')}
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400"
        aria-label="Toggle"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-ink-200 bg-white py-1 shadow-pop animate-scale-in scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-400">
              {allowFreeText ? 'Press enter to use this value' : 'No matches'}
            </p>
          ) : (
            filtered.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => select(o)}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink-50',
                  o === value ? 'text-brand-700' : 'text-ink-700',
                )}
              >
                {o}
                {o === value && <Check className="h-4 w-4 text-brand-600" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
