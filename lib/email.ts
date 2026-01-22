import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  cc?: string[]
  bcc?: string[]
}

export async function sendEmail({ to, subject, html, cc, bcc }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      cc,
      bcc,
      subject,
      html,
    })

    console.log('✅ Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email error:', error)
    return { success: false, error }
  }
}

// Verificar configuración de email
export async function verifyEmailConfig() {
  try {
    await transporter.verify()
    console.log('✅ SMTP Server ready')
    return true
  } catch (error) {
    console.error('❌ SMTP Server error:', error)
    return false
  }
}