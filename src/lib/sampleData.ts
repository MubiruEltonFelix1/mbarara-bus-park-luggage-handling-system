import type {
  Attendant,
  ItemType,
  ParkSettings,
  PaymentMethod,
  PaymentStatus,
  StatusUpdate,
  Ticket,
  TicketStatus,
} from '../types'
import { generateTicketId, nowIso } from './utils'

const DESTINATIONS = [
  'Kampala',
  'Mbarara',
  'Masaka',
  'Kabale',
  'Bushenyi',
  'Fort Portal',
  'Kasese',
  'Ntungamo',
  'Ibanda',
  'Lyantonde',
]

const PLATES = ['UBA 123X', 'UBL 456A', 'UBP 789K', 'UAS 234B', 'UAK 678F', 'UBH 901M', 'UAG 345C', 'UBB 567L']

const FIRST = ['Joel', 'Grace', 'Brian', 'Sarah', 'Dennis', 'Patience', 'Moses', 'Esther', 'Ronald', 'Juliet', 'Emmanuel', 'Doreen', 'Yasin', 'Florence', 'Ivan', 'Ruth', 'Davis', 'Mercy', 'Geoffrey', 'Ann']
const LAST = ['Mukasa', 'Tumusiime', 'Aine', 'Kato', 'Nuwagaba', 'Atuhaire', 'Mugisha', 'Nakato', 'Byaruhanga', 'Kabugho', 'Tumwebaze', 'Akampa', 'Niwasiima', 'Owomugisha', 'Katusiime', 'Mwesigwa', 'Busingye', 'Turyasingura']

const DESCRIPTIONS = [
  'Brown carton with household items',
  'Blue suitcase with clothes',
  'White sack of maize flour',
  'Electronics box — TV',
  'Green bag with groceries',
  'Black backpack with documents',
  'Plastic container with spare parts',
  'Yellow jerrycan of honey',
  'Wooden box with shoes',
  'Envelope with phone accessories',
  'Sack of Irish potatoes',
  'Box with solar panel kit',
]

const ITEMS: ItemType[] = ['Parcel', 'Luggage', 'Sack/Bag', 'Box']

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}
function fullName(seed: number): string {
  return `${pick(FIRST, seed)} ${pick(LAST, seed + 3)}`
}
function phone(seed: number): string {
  const ops = ['70', '77', '76', '78', '79', '75', '74', '72']
  const op = pick(ops, seed)
  const rest = String((seed * 137 + 9876543) % 10_000_000).padStart(7, '0').slice(0, 7)
  return `0${op}${rest}`
}

function daysAgoIso(days: number, hour = 9): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, (days * 7) % 60, 0, 0)
  return d.toISOString()
}

const STATUS_PLAN: TicketStatus[] = [
  'Received',
  'Awaiting dispatch',
  'In transit',
  'Arrived at destination',
  'Ready for collection',
  'Collected',
  'Delayed',
  'Cancelled',
]

function buildStatusHistory(
  createdAt: string,
  finalStatus: TicketStatus,
  attendant: string,
  plate: string,
): StatusUpdate[] {
  const history: StatusUpdate[] = [
    { status: 'Received', timestamp: createdAt, staff: attendant, note: 'Parcel received at park office.' },
  ]
  const flow: TicketStatus[] = ['Awaiting dispatch', 'In transit', 'Arrived at destination', 'Ready for collection', 'Collected']
  const finalIdx = flow.indexOf(finalStatus)
  const delayed = finalStatus === 'Delayed'
  const cancelled = finalStatus === 'Cancelled'

  if (cancelled) {
    history.push({
      status: 'Cancelled',
      timestamp: new Date(new Date(createdAt).getTime() + 3600_000).toISOString(),
      staff: attendant,
      note: 'Sender requested cancellation.',
    })
    return history
  }

  let stepHours = 2
  for (let i = 0; i < flow.length; i++) {
    const reached = delayed ? i <= 1 : i <= finalIdx
    if (!reached) break
    const ts = new Date(new Date(createdAt).getTime() + stepHours * 3600_000).toISOString()
    const note =
      flow[i] === 'Awaiting dispatch'
        ? 'Ticket processed and ready for loading.'
        : flow[i] === 'In transit'
        ? `Loaded onto vehicle ${plate}.`
        : flow[i] === 'Arrived at destination'
        ? 'Arrived at destination park.'
        : flow[i] === 'Ready for collection'
        ? 'Receiver notified to collect.'
        : 'Parcel collected by receiver.'
    history.push({ status: flow[i], timestamp: ts, staff: attendant, note })
    stepHours += 4
  }
  if (delayed) {
    history.push({
      status: 'Delayed',
      timestamp: new Date(new Date(createdAt).getTime() + 14 * 3600_000).toISOString(),
      staff: attendant,
      note: 'Vehicle held up due to mechanical check on route.',
      vehicleOrRoute: plate,
    })
  }
  return history
}

export function generateSampleTickets(count = 28): Ticket[] {
  const tickets: Ticket[] = []
  for (let i = 0; i < count; i++) {
    const ageDays = Math.floor((i / count) * 7) // spread over last week, oldest first reversed
    const day = count - 1 - i < 0 ? 0 : Math.floor(((i % 7) + (i % 3)) / 1.6)
    const createdAt = daysAgoIso(day, 7 + (i % 10))
    const attendant = ['Joel Tumusiime', 'Grace Nakato', 'Dennis Mwesigwa'][i % 3]
    const plate = pick(PLATES, i)
    const dest = pick(DESTINATIONS, i + 2)
    const status = pick(STATUS_PLAN, i + 1)

    const t: Ticket = {
      id: generateTicketId('MBR', 2026, 184 + (count - i), 6),
      parkName: i % 2 === 0 ? 'Mbarara Bus Park' : 'Kampala Taxi Park',
      itemType: pick(ITEMS, i),
      itemCount: 1 + (i % 4),
      description: pick(DESCRIPTIONS, i),
      weightKg: 0.5 + ((i * 1.7) % 25),
      itemValue: i % 3 === 0 ? [20000, 50000, 150000, 300000][(i) % 4] : undefined,
      fragile: i % 4 === 0,
      handlingNotes: i % 5 === 0 ? 'Keep upright, fragile contents.' : undefined,
      senderName: fullName(i),
      senderPhone: phone(i),
      senderId: i % 4 === 0 ? `CM${String(90000000 + i * 76543).slice(0, 8)}` : undefined,
      receiverName: fullName(i + 7),
      receiverPhone: phone(i + 5),
      receiverAltPhone: i % 3 === 0 ? phone(i + 11) : undefined,
      destination: dest,
      originPark: i % 2 === 0 ? 'Mbarara Bus Park' : 'Kampala Taxi Park',
      vehiclePlate: plate,
      driverOrCompany: pick(['Kalita Coaches', 'Gateway Buses', 'YY Coaches', 'Posta Buses', 'Swift Bus Co.'], i),
      expectedDeparture: createdAt,
      expectedArrival: new Date(new Date(createdAt).getTime() + 6 * 3600_000).toISOString(),
      routeNotes: i % 6 === 0 ? 'Via Masaka, Lyantonde.' : undefined,
      fee: [5000, 10000, 15000, 25000, 30000, 40000, 20000][i % 7],
      paymentMethod: (['Cash', 'Mobile Money', 'Cash', 'Mobile Money', 'Card'] as PaymentMethod[])[i % 5],
      paymentStatus: (['Paid', 'Pending', 'Partially paid', 'Paid', 'Paid'] as PaymentStatus[])[i % 5],
      printedCopies: 2,
      attendant,
      printWidth: 48,
      status,
      createdAt,
      updatedAt: createdAt,
      statusHistory: buildStatusHistory(createdAt, status, attendant, plate),
    }
    tickets.push(t)
  }
  return tickets.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export const DEFAULT_ATTENDANTS: Attendant[] = [
  { id: 'a1', name: 'Joel Tumusiime', phone: '0772 112 233', role: 'Senior attendant', active: true },
  { id: 'a2', name: 'Grace Nakato', phone: '0701 445 566', role: 'Attendant', active: true },
  { id: 'a3', name: 'Dennis Mwesigwa', phone: '0788 778 899', role: 'Dispatcher', active: true },
]

export const DEFAULT_SETTINGS: ParkSettings = {
  parkName: 'Mbarara Bus Park',
  parkAddress: 'Plot 12, High Street, Mbarara City',
  parkPhone: '+256 772 112 233',
  defaultOrigin: 'Mbarara',
  defaultPrintWidth: 48,
  ticketPrefix: 'MBR',
  ticketPad: 6,
  currency: 'UGX',
  destinations: DESTINATIONS,
  attendants: DEFAULT_ATTENDANTS,
  notifications: {
    newTicket: true,
    statusChange: true,
    delayedParcel: true,
  },
}

/** A guaranteed demo ticket for the public tracking page example. */
export function sampleDemoTicket(): Ticket {
  const createdAt = daysAgoIso(0, 8)
  const ticket: Ticket = {
    id: 'MBR-2026-000184',
    parkName: 'Mbarara Bus Park',
    itemType: 'Box',
    itemCount: 2,
    description: 'Brown carton with household items',
    weightKg: 12,
    itemValue: 150000,
    fragile: true,
    handlingNotes: 'Keep upright, fragile contents.',
    senderName: 'Joel Tumusiime',
    senderPhone: '0772 112 233',
    senderId: 'CM90123456',
    receiverName: 'Grace Nakato',
    receiverPhone: '0701 445 566',
    receiverAltPhone: '0788 778 899',
    destination: 'Kampala',
    originPark: 'Mbarara Bus Park',
    vehiclePlate: 'UBA 123X',
    driverOrCompany: 'Kalita Coaches',
    expectedDeparture: createdAt,
    expectedArrival: new Date(new Date(createdAt).getTime() + 6 * 3600_000).toISOString(),
    routeNotes: 'Via Masaka.',
    fee: 25000,
    paymentMethod: 'Mobile Money',
    paymentStatus: 'Paid',
    printedCopies: 2,
    attendant: 'Joel Tumusiime',
    printWidth: 48,
    status: 'In transit',
    createdAt,
    updatedAt: nowIso(),
    statusHistory: [
      { status: 'Received', timestamp: createdAt, staff: 'Joel Tumusiime', note: 'Parcel received at park office.' },
      { status: 'Awaiting dispatch', timestamp: new Date(new Date(createdAt).getTime() + 3600_000).toISOString(), staff: 'Joel Tumusiime', note: 'Ticket processed and ready for loading.' },
      { status: 'In transit', timestamp: new Date(new Date(createdAt).getTime() + 5400_000).toISOString(), staff: 'Dennis Mwesigwa', note: 'Loaded onto vehicle UBA 123X.', vehicleOrRoute: 'UBA 123X' },
    ],
  }
  return ticket
}
