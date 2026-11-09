import type { DateFilterKey, Ticket } from '../types'
import { isSameDay, startOfMonth, startOfWeek } from './utils'

export interface DateRange {
  start: Date
  end: Date
}

export function dateRangeFromKey(key: DateFilterKey, custom?: { from?: string; to?: string }): DateRange {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  switch (key) {
    case 'today': {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    case 'yesterday': {
      const start = new Date(now)
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      const e = new Date(start)
      e.setHours(23, 59, 59, 999)
      return { start, end: e }
    }
    case 'this_week': {
      const start = startOfWeek(now)
      return { start, end }
    }
    case 'this_month': {
      const start = startOfMonth(now)
      return { start, end }
    }
    case 'custom': {
      const start = custom?.from ? new Date(custom.from) : new Date(now)
      const e = custom?.to ? new Date(custom.to) : new Date(now)
      e.setHours(23, 59, 59, 999)
      start.setHours(0, 0, 0, 0)
      return { start, end: e }
    }
  }
}

export function inRange(ticket: Ticket, range: DateRange): boolean {
  const t = new Date(ticket.createdAt).getTime()
  return t >= range.start.getTime() && t <= range.end.getTime()
}

export function filterByDate(tickets: Ticket[], range: DateRange): Ticket[] {
  return tickets.filter((t) => inRange(t, range))
}

export interface DashboardStats {
  totalToday: number
  inTransit: number
  delivered: number
  pendingDispatch: number
  revenueToday: number
  delayed: number
  collected: number
  cancelled: number
}

export function computeDashboardStats(tickets: Ticket[]): DashboardStats {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  return {
    totalToday: tickets.filter((t) => isSameDay(new Date(t.createdAt), new Date())).length,
    inTransit: tickets.filter((t) => t.status === 'In transit').length,
    delivered: tickets.filter((t) => t.status === 'Collected').length,
    pendingDispatch: tickets.filter((t) => t.status === 'Awaiting dispatch' || t.status === 'Received').length,
    revenueToday: tickets
      .filter((t) => isSameDay(new Date(t.createdAt), new Date()) && t.paymentStatus === 'Paid')
      .reduce((s, t) => s + t.fee, 0),
    delayed: tickets.filter((t) => t.status === 'Delayed').length,
    collected: tickets.filter((t) => t.status === 'Collected').length,
    cancelled: tickets.filter((t) => t.status === 'Cancelled').length,
  }
}

export function ticketsByDay(tickets: Ticket[], days = 7): { label: string; value: number }[] {
  const out: { label: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const count = tickets.filter((t) => isSameDay(new Date(t.createdAt), d)).length
    out.push({ label: d.toLocaleDateString('en-GB', { weekday: 'short' }), value: count })
  }
  return out
}

export function revenueByDestination(tickets: Ticket[]): { label: string; value: number }[] {
  const map = new Map<string, number>()
  tickets.forEach((t) => map.set(t.destination, (map.get(t.destination) ?? 0) + t.fee))
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
}

export function countByDestination(tickets: Ticket[]): { label: string; value: number }[] {
  const map = new Map<string, number>()
  tickets.forEach((t) => map.set(t.destination, (map.get(t.destination) ?? 0) + 1))
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

export function revenueByAttendant(tickets: Ticket[]): { label: string; value: number }[] {
  const map = new Map<string, number>()
  tickets.forEach((t) => map.set(t.attendant, (map.get(t.attendant) ?? 0) + t.fee))
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

export function paymentMethodBreakdown(tickets: Ticket[]): { label: string; value: number; color: string }[] {
  const map = new Map<string, number>()
  tickets.forEach((t) => map.set(t.paymentMethod, (map.get(t.paymentMethod) ?? 0) + 1))
  const colors: Record<string, string> = {
    Cash: '#059669',
    'Mobile Money': '#f59e0b',
    Card: '#3b82f6',
    Other: '#9aa3b3',
  }
  return [...map.entries()].map(([label, value]) => ({ label, value, color: colors[label] ?? '#9aa3b3' }))
}

export function averageDeliveryHours(tickets: Ticket[]): number {
  const delivered = tickets.filter((t) => t.status === 'Collected')
  if (delivered.length === 0) return 0
  let total = 0
  let n = 0
  delivered.forEach((t) => {
    const last = t.statusHistory[t.statusHistory.length - 1]
    if (last) {
      total += new Date(last.timestamp).getTime() - new Date(t.createdAt).getTime()
      n++
    }
  })
  return n ? total / n / 3600_000 : 0
}

export function popularRoutes(tickets: Ticket[]): { label: string; value: number }[] {
  const map = new Map<string, number>()
  tickets.forEach((t) => {
    const route = `${t.originPark.split(' ')[0]} → ${t.destination}`
    map.set(route, (map.get(route) ?? 0) + 1)
  })
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
}
