import { useEffect, useState } from 'react'
import { generateQRDataURL } from '../../lib/qr'

/** Renders a sharp, high-contrast QR code as an image — safe for printing. */
export function QRImage({ value, size = 160, className }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let active = true
    generateQRDataURL(value, size).then((url) => active && setSrc(url))
    return () => {
      active = false
    }
  }, [value, size])

  if (!src) return <div className={className} style={{ width: size, height: size }} />
  return <img src={src} alt="QR code" width={size} height={size} className={className} style={{ imageRendering: 'pixelated' }} />
}
