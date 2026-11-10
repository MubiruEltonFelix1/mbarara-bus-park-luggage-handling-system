import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Ticket } from '../types'
import { generateQRDataURL } from '../lib/qr'
import { trackingUrl } from '../lib/qr'
import { ThermalTicket } from '../components/tickets/ThermalTicket'
import { DigitalTicket } from '../components/tickets/DigitalTicket'

interface PrintJob {
  mode: 'thermal' | 'digital'
  copies: { ticket: Ticket; label: string }[]
  qrUrls: Record<string, string> // ticketId -> dataURL
}

interface PrintContextValue {
  printTicket: (ticket: Ticket) => Promise<void>
  printCopies: (ticket: Ticket) => Promise<void>
  printMany: (tickets: Ticket[]) => Promise<void>
  printDigital: (ticket: Ticket) => Promise<void>
  printing: boolean
}

const PrintContext = createContext<PrintContextValue | null>(null)

export function PrintProvider({ children }: { children: ReactNode }) {
  const [job, setJob] = useState<PrintJob | null>(null)
  const [printing, setPrinting] = useState(false)
  const portalRef = useRef<HTMLDivElement | null>(null)

  // Ensure a #print-portal container exists in the DOM.
  useEffect(() => {
    let el = document.getElementById('print-portal') as HTMLDivElement | null
    if (!el) {
      el = document.createElement('div')
      el.id = 'print-portal'
      document.body.appendChild(el)
    }
    portalRef.current = el
  }, [])

  // Pre-generate QR data URLs for a set of tickets.
  const buildQrUrls = useCallback(async (tickets: Ticket[]) => {
    const urls: Record<string, string> = {}
    await Promise.all(
      tickets.map(async (t) => {
        urls[t.id] = await generateQRDataURL(trackingUrl(t.id), 240)
      }),
    )
    return urls
  }, [])

  const runPrint = useCallback(async (mode: 'thermal' | 'digital', copies: { ticket: Ticket; label: string }[]) => {
    const tickets = copies.map((c) => c.ticket)
    const qrUrls = await buildQrUrls(tickets)
    setJob({ mode, copies, qrUrls })
    // allow React to paint before printing
    await new Promise((r) => setTimeout(r, 150))
    setPrinting(true)
    document.body.classList.add('printing')
    window.print()
  }, [buildQrUrls])

  // Print two thermal copies of a single ticket: customer + parcel.
  const printCopies = useCallback(
    async (ticket: Ticket) => {
      await runPrint('thermal', [
        { ticket, label: 'CUSTOMER COPY' },
        { ticket, label: 'PARCEL COPY' },
      ])
    },
    [runPrint],
  )

  const printTicket = useCallback(
    async (ticket: Ticket) => {
      await runPrint('thermal', [{ ticket, label: ticket.printedCopies >= 2 ? 'CUSTOMER COPY' : 'TICKET COPY' }])
    },
    [runPrint],
  )

  const printMany = useCallback(
    async (tickets: Ticket[]) => {
      const copies = tickets.flatMap((t) => [
        { ticket: t, label: 'CUSTOMER COPY' },
        { ticket: t, label: 'PARCEL COPY' },
      ])
      await runPrint('thermal', copies)
    },
    [runPrint],
  )

  const printDigital = useCallback(
    async (ticket: Ticket) => {
      await runPrint('digital', [
        { ticket, label: 'CUSTOMER COPY' },
        { ticket, label: 'PARCEL COPY' },
      ])
    },
    [runPrint],
  )

  // Clean up after printing completes.
  useEffect(() => {
    const onAfterPrint = () => {
      document.body.classList.remove('printing')
      setPrinting(false)
      setJob(null)
    }
    window.addEventListener('afterprint', onAfterPrint)
    return () => window.removeEventListener('afterprint', onAfterPrint)
  }, [])

  return (
    <PrintContext.Provider value={{ printTicket, printCopies, printMany, printDigital, printing }}>
      {children}
      {portalRef.current && job &&
        createPortal(
          <div>
            {job.copies.map((c, i) =>
              job.mode === 'thermal' ? (
                <ThermalTicket key={`${c.ticket.id}-${i}`} ticket={c.ticket} qrUrl={job.qrUrls[c.ticket.id] ?? ''} copyLabel={c.label} />
              ) : (
                <div key={`${c.ticket.id}-${i}`} className="thermal-ticket mx-auto bg-white p-6" style={{ width: '210mm', minHeight: '297mm' }}>
                  <DigitalTicket ticket={c.ticket} copyLabel={c.label} qrUrl={job.qrUrls[c.ticket.id]} />
                </div>
              ),
            )}
          </div>,
          portalRef.current,
        )}
    </PrintContext.Provider>
  )
}

export function usePrint(): PrintContextValue {
  const ctx = useContext(PrintContext)
  if (!ctx) throw new Error('usePrint must be used within PrintProvider')
  return ctx
}
