import QRCode from 'qrcode'

/** Generate a high-contrast QR data URL for printing / display. */
export async function generateQRDataURL(text: string, size = 256): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
      color: { dark: '#000000', light: '#ffffff' },
    })
  } catch {
    return ''
  }
}

/** Build the public tracking URL for a ticket id. */
export function trackingUrl(ticketId: string): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base.replace(/\/$/, '')}/#/track/${encodeURIComponent(ticketId)}`
}
