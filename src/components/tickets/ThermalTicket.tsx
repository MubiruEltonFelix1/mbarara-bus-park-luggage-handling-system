import type { Ticket } from '../../types'
import { formatDateTime, formatUGX } from '../../lib/utils'

/**
 * Print-optimized thermal ticket. High contrast, no background fills,
 * sharp monospace QR, compact spacing. Renders at the exact printer width.
 */
export function ThermalTicket({
  ticket,
  qrUrl,
  copyLabel,
}: {
  ticket: Ticket
  qrUrl: string
  copyLabel: string
}) {
  const widthMm = ticket.printWidth
  const is80 = widthMm === 80

  return (
    <div
      className="thermal-ticket mx-auto bg-white text-black"
      style={{ width: `${widthMm}mm`, padding: `${is80 ? 4 : 3}mm ${is80 ? 3.5 : 2.5}mm`, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: is80 ? '11px' : '9px', lineHeight: 1.35 }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>
        <div style={{ fontSize: is80 ? '14px' : '11px', fontWeight: 800, letterSpacing: '0.04em' }}>ParcelFlow</div>
        <div style={{ fontSize: is80 ? '10px' : '7.5px', marginTop: '1px' }}>{ticket.parkName}</div>
        <div style={{ display: 'inline-block', marginTop: '3px', padding: '1px 6px', border: '1px solid #000', borderRadius: '2px', fontWeight: 700, fontSize: is80 ? '12px' : '10px' }}>
          {copyLabel}
        </div>
      </div>

      {/* Ticket ID + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontWeight: 800, fontSize: is80 ? '13px' : '10.5px' }}>{ticket.id}</span>
        <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{ticket.status}</span>
      </div>

      {/* QR */}
      <div style={{ textAlign: 'center', margin: '4px 0' }}>
        {qrUrl && <img src={qrUrl} alt="QR" width={is80 ? 130 : 110} height={is80 ? 130 : 110} style={{ imageRendering: 'pixelated', display: 'inline-block' }} />}
      </div>
      <div style={{ textAlign: 'center', fontSize: is80 ? '8px' : '6.5px', marginTop: '1px', marginBottom: '4px' }}>
        Scan QR to track this parcel
      </div>

      {/* Rows */}
      <Row label="Date" value={formatDateTime(ticket.createdAt)} is80={is80} />
      <Row label="Type" value={`${ticket.itemType} ×${ticket.itemCount}`} is80={is80} />
      <Row label="Weight" value={`${ticket.weightKg} kg`} is80={is80} />
      <Row label="Desc" value={ticket.description} is80={is80} />

      <div style={{ borderTop: '1px dashed #000', marginTop: '3px', paddingTop: '3px' }}>
        <Row label="From" value={ticket.senderName} is80={is80} />
        <Row label="Sender tel" value={ticket.senderPhone} is80={is80} />
        <Row label="To" value={ticket.receiverName} is80={is80} />
        <Row label="Receiver tel" value={ticket.receiverPhone} is80={is80} />
      </div>

      <div style={{ borderTop: '1px dashed #000', marginTop: '3px', paddingTop: '3px' }}>
        <Row label="Origin" value={ticket.originPark} is80={is80} />
        <Row label="Destination" value={ticket.destination} is80={is80} />
        <Row label="Vehicle" value={ticket.vehiclePlate} is80={is80} />
      </div>

      {/* Fee */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '3px', borderTop: '1px solid #000' }}>
        <span style={{ fontWeight: 700 }}>Fee</span>
        <span style={{ fontWeight: 800, fontSize: is80 ? '13px' : '11px' }}>{formatUGX(ticket.fee)}</span>
      </div>
      <Row label="Payment" value={`${ticket.paymentMethod} · ${ticket.paymentStatus}`} is80={is80} />
      <Row label="Attendant" value={ticket.attendant} is80={is80} />

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '5px', paddingTop: '3px', borderTop: '1px dashed #000', fontSize: is80 ? '8px' : '6.5px' }}>
        Scan QR code or visit ParcelFlow to track this parcel.
        <div style={{ marginTop: '2px', fontWeight: 700 }}>Thank you for using ParcelFlow</div>
      </div>
    </div>
  )
}

function Row({ label, value, is80 }: { label: string; value: string; is80: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', padding: '0.5px 0' }}>
      <span style={{ color: '#000', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}
