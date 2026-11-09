import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ParkSettings, StatusUpdate, Ticket, TicketStatus } from '../types'
import { ticketService } from '../lib/ticketService'

interface AppContextValue {
  tickets: Ticket[]
  settings: ParkSettings
  loading: boolean
  refresh: () => void
  createTicket: (input: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'statusHistory'>) => Ticket
  updateTicket: (id: string, patch: Partial<Ticket>) => Ticket | undefined
  addStatusUpdate: (id: string, update: Omit<StatusUpdate, 'timestamp'>) => Ticket | undefined
  bulkUpdateStatus: (ids: string[], status: TicketStatus, staff: string, note?: string, vehicleOrRoute?: string) => Ticket[]
  getTicket: (id: string) => Ticket | undefined
  saveSettings: (patch: Partial<ParkSettings>) => ParkSettings
  reseed: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [settings, setSettings] = useState<ParkSettings>(ticketService.getSettings())
  const [loading, setLoading] = useState(true)
  const seeded = useRef(false)

  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    ticketService.ensureSeeded()
    setTickets(ticketService.getAll())
    setSettings(ticketService.getSettings())
    setLoading(false)
  }, [])

  const refresh = useCallback(() => {
    setTickets(ticketService.getAll())
    setSettings(ticketService.getSettings())
  }, [])

  const createTicket = useCallback((input: Parameters<AppContextValue['createTicket']>[0]) => {
    const t = ticketService.create(input)
    setTickets(ticketService.getAll())
    return t
  }, [])

  const updateTicket = useCallback((id: string, patch: Partial<Ticket>) => {
    const t = ticketService.update(id, patch)
    setTickets(ticketService.getAll())
    return t
  }, [])

  const addStatusUpdate = useCallback((id: string, update: Omit<StatusUpdate, 'timestamp'>) => {
    const t = ticketService.addStatusUpdate(id, update)
    setTickets(ticketService.getAll())
    return t
  }, [])

  const bulkUpdateStatus = useCallback(
    (ids: string[], status: TicketStatus, staff: string, note?: string, vehicleOrRoute?: string) => {
      const updated = ticketService.bulkUpdateStatus(ids, status, staff, note, vehicleOrRoute)
      setTickets(ticketService.getAll())
      return updated
    },
    [],
  )

  const getTicket = useCallback((id: string) => ticketService.getById(id), [])

  const saveSettings = useCallback((patch: Partial<ParkSettings>) => {
    const next = ticketService.saveSettings(patch)
    setSettings(next)
    return next
  }, [])

  const reseed = useCallback(() => {
    ticketService.reseed()
    setTickets(ticketService.getAll())
    setSettings(ticketService.getSettings())
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      tickets,
      settings,
      loading,
      refresh,
      createTicket,
      updateTicket,
      addStatusUpdate,
      bulkUpdateStatus,
      getTicket,
      saveSettings,
      reseed,
    }),
    [tickets, settings, loading, refresh, createTicket, updateTicket, addStatusUpdate, bulkUpdateStatus, getTicket, saveSettings, reseed],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
