import type { Ticket, TicketStatus } from '../types'

/* ---------------- Currency ---------------- */
export function formatUGX(amount: number): string {
  return 'UGX ' + new Intl.NumberFormat('en-UG').format(Math.round(amount || 0))
}
export function formatUGXShort(amount: number): string {
  const n = Math.round(amount || 0)
  if (n >= 1_000_000) return 'UGX ' + (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return 'UGX ' + (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return 'UGX ' + n
}
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-UG').format(n || 0)
}

/* ---------------- Ticket IDs ---------------- */
/** Generate next ticket id like MBR-2026-000184, padding the sequence. */
export function generateTicketId(prefix: string, year: number, seq: number, pad = 6): string {
  return `${prefix}-${year}-${String(seq).padStart(pad, '0')}`
}
/** Extract the numeric sequence from a ticket id. */
export function ticketSeqFromId(id: string): number {
  const parts = id.split('-')
  const last = parts[parts.length - 1]
  return parseInt(last, 10) || 0
}

/* ---------------- Phone validation (Ugandan) ---------------- */
/**
 * Accepts 0XXXXXXXXX (10 digits, starting 07), +256XXXXXXXXX, or 256XXXXXXXXX.
 * Validates the 9-digit operator portion starting with 7.
 */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, '').trim()
}
export function isValidUgandanPhone(raw: string): boolean {
  const p = normalizePhone(raw)
  // 0XXXXXXXXX -> operator is p.slice(1)
  // +256XXXXXXXXX -> operator is p.slice(4)
  // 256XXXXXXXXX -> operator is p.slice(3)
  let op = ''
  if (/^0\d{9}$/.test(p)) op = p.slice(1)
  else if (/^\+256\d{9}$/.test(p)) op = p.slice(4)
  else if (/^256\d{9}$/.test(p)) op = p.slice(3)
  else return false
  return /^7[0-9]\d{7}$/.test(op)
}
/** Return a canonical +256XXXXXXXXX form. */
export function canonicalPhone(raw: string): string {
  const p = normalizePhone(raw)
  if (/^0\d{9}$/.test(p)) return '+256' + p.slice(1)
  if (/^256\d{9}$/.test(p)) return '+' + p
  if (/^\+256\d{9}$/.test(p)) return p
  return p
}
/** Mask phone for public display: +256 7•• ••• 12 34 */
export function maskPhone(raw: string): string {
  const p = canonicalPhone(raw)
  if (!p.startsWith('+256') || p.length < 13) return p
  const op = p.slice(4) // 9 digits
  const last4 = op.slice(5)
  return `+256 7${op[1]}•• ••• ${last4.slice(0, 2)} ${last4.slice(2)}`
}
/** Mask a full name to first name only (e.g. "John Mukasa" -> "John M."). */
export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0]}.`
}

/* ---------------- Dates ---------------- */
export function nowIso(): string {
  return new Date().toISOString()
}
export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
export function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
export function formatTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.round(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  const mo = Math.round(day / 30)
  return `${mo}mo ago`
}
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
export function startOfWeek(d: Date): Date {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // Monday start
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - day)
  return x
}
export function startOfMonth(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(1)
  return x
}

/* ---------------- Status helpers ---------------- */
export type StatusColor = 'gray' | 'amber' | 'blue' | 'green' | 'red' | 'teal'
export function statusColor(status: TicketStatus): StatusColor {
  switch (status) {
    case 'Received':
      return 'teal'
    case 'Awaiting dispatch':
      return 'amber'
    case 'In transit':
      return 'blue'
    case 'Arrived at destination':
      return 'teal'
    case 'Ready for collection':
      return 'amber'
    case 'Collected':
      return 'green'
    case 'Delayed':
      return 'red'
    case 'Cancelled':
      return 'gray'
  }
}

/* ---------------- Misc ---------------- */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
export function maskId(id: string): string {
  if (!id) return ''
  if (id.length <= 4) return id
  return id.slice(0, -4) + '••••'
}
export function downloadFile(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  return new Promise((resolve) => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
    } catch {
      /* ignore */
    }
    ta.remove()
    resolve()
  })
}

/* ---------------- CSV ---------------- */
export function ticketsToCSV(tickets: Ticket[]): string {
  const headers = [
    'Ticket ID',
    'Status',
    'Type',
    'Items',
    'Description',
    'Weight (kg)',
    'Sender',
    'Sender Phone',
    'Receiver',
    'Receiver Phone',
    'Destination',
    'Origin',
    'Vehicle Plate',
    'Fee (UGX)',
    'Payment Method',
    'Payment Status',
    'Attendant',
    'Created At',
  ]
  const rows = tickets.map((t) => [
    t.id,
    t.status,
    t.itemType,
    t.itemCount,
    t.description,
    t.weightKg,
    t.senderName,
    t.senderPhone,
    t.receiverName,
    t.receiverPhone,
    t.destination,
    t.originPark,
    t.vehiclePlate,
    t.fee,
    t.paymentMethod,
    t.paymentStatus,
    t.attendant,
    t.createdAt,
  ])
  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}
