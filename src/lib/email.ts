import emailjs from '@emailjs/browser'

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export async function sendOTP({
  toEmail,
  toName,
  otp,
  ticketId,
  senderName,
  destination,
  fee,
}: {
  toEmail: string
  toName: string
  otp: string
  ticketId: string
  senderName: string
  destination: string
  fee: number
}) {
  console.log('EmailJS debug:', { serviceId, templateId, publicKey })
  if (!serviceId || !templateId || !publicKey) {
    console.error('EmailJS env vars missing')
    return
  }

  await emailjs.send(serviceId, templateId, {
    to_email: toEmail,
    to_name: toName,
    otp_code: otp,
    ticket_id: ticketId,
    sender_name: senderName,
    destination,
    fee: fee.toString(),
  }, publicKey)
}
