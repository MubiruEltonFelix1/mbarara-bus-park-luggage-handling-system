import type { ParkSettings, StatusUpdate, Ticket, TicketStatus } from '../types'
import { generateTicketId, nowIso, ticketSeqFromId } from './utils'
import { load, save } from './storage'
import { DEFAULT_SETTINGS, generateSampleTickets, sampleDemoTicket } from './sampleData'

const TICKETS_KEY = 'tickets'
const SETTINGS_KEY = 'settings'
const SEQ_KEY = 'ticketSeq'

/**
 * Mock data layer backed by localStorage.
 * Swap the bodies of these functions with real API calls (fetch) when a
 * backend is available — the rest of the app consumes the same signatures.
 */
export const ticketService = {
  /* ---------------- Tickets ---------------- */
  getAll(): Ticket[] {
    return load<Ticket[]>(TICKETS_KEY, [])
  },

  getById(id: string): Ticket | undefined {
    const all = this.getAll()
    let t = all.find((x) => x.id.toLowerCase() === id.toLowerCase())
    // Fallback to the guaranteed demo ticket so the tracking example always works.
    if (!t && id.toLowerCase() === 'mbr-2026-000184') {
      t = sampleDemoTicket()
    }
    return t
  },

  create(input: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Ticket {
    const settings = this.getSettings()
    const all = this.getAll()
    const year = new Date().getFullYear()

    // Determine next sequence number from stored counter and existing tickets.
    const fromExisting = all.reduce((max, t) => {
      const y = t.id.split('-')[1]
      if (y === String(year)) return Math.max(max, ticketSeqFromId(t.id))
      return max
    }, 0)
    let seq = load<number>(SEQ_KEY, fromExisting)
    if (seq <= fromExisting) seq = fromExisting + 1
    else seq += 1
    save(SEQ_KEY, seq)

    const id = generateTicketId(settings.ticketPrefix, year, seq, settings.ticketPad)
    const now = nowIso()
    const ticket: Ticket = {
      ...input,
      id,
      status: 'Received',
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        { status: 'Received', timestamp: now, staff: input.attendant, note: 'Parcel received at park office.' },
      ],
    }
    save(TICKETS_KEY, [ticket, ...all])
    return ticket
  },

  update(id: string, patch: Partial<Ticket>): Ticket | undefined {
    const all = this.getAll()
    const idx = all.findIndex((t) => t.id.toLowerCase() === id.toLowerCase())
    if (idx === -1) return undefined
    const updated = { ...all[idx], ...patch, updatedAt: nowIso() }
    all[idx] = updated
    save(TICKETS_KEY, all)
    return updated
  },

  addStatusUpdate(id: string, update: Omit<StatusUpdate, 'timestamp'>): Ticket | undefined {
    const all = this.getAll()
    const idx = all.findIndex((t) => t.id.toLowerCase() === id.toLowerCase())
    if (idx === -1) return undefined
    const t = all[idx]
    const entry: StatusUpdate = { ...update, timestamp: nowIso() }
    const history = [...t.statusHistory, entry]
    all[idx] = { ...t, status: update.status, statusHistory: history, updatedAt: entry.timestamp }
    save(TICKETS_KEY, all)
    return all[idx]
  },

  bulkUpdateStatus(ids: string[], status: TicketStatus, staff: string, note?: string, vehicleOrRoute?: string): Ticket[] {
    const all = this.getAll()
    const ts = nowIso()
    const updated: Ticket[] = []
    all.forEach((t, i) => {
      if (ids.includes(t.id)) {
        const entry: StatusUpdate = { status, timestamp: ts, staff, note, vehicleOrRoute }
        all[i] = { ...t, status, statusHistory: [...t.statusHistory, entry], updatedAt: ts }
        updated.push(all[i])
      }
    })
    save(TICKETS_KEY, all)
    return updated
  },

  delete(id: string): void {
    const all = this.getAll().filter((t) => t.id !== id)
    save(TICKETS_KEY, all)
  },

  /* ---------------- Settings ---------------- */
  getSettings(): ParkSettings {
    return load<ParkSettings>(SETTINGS_KEY, DEFAULT_SETTINGS)
  },

  saveSettings(patch: Partial<ParkSettings>): ParkSettings {
    const cur = this.getSettings()
    const next = { ...cur, ...patch }
    save(SETTINGS_KEY, next)
    return next
  },

  /** Seed initial sample data on first run. */
  ensureSeeded(): void {
    const existing = load<Ticket[] | null>(TICKETS_KEY, null)
    if (existing === null || existing.length === 0) {
      save(TICKETS_KEY, generateSampleTickets(28))
    }
    const settings = load<ParkSettings | null>(SETTINGS_KEY, null)
    if (!settings) save(SETTINGS_KEY, DEFAULT_SETTINGS)
  },

  /** Replace sample data (used by Settings > reset demo data). */
  reseed(): Ticket[] {
    const fresh = generateSampleTickets(28)
    save(TICKETS_KEY, fresh)
    return fresh
  },
}
