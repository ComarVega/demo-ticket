import { NextResponse } from 'next/server'
import   prisma         from '@/lib/prisma'
import { sendEmail }    from '@/lib/email'
import   crypto         from 'crypto'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Por seguridad, siempre devolver el mismo mensaje
    // incluso si el usuario no existe
    if (!user) {
      return NextResponse.json({
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña',
      })
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Guardar token en base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // Enviar email con link de recuperación
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #667eea;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Restablecer Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${user.name}</strong>,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </div>

            <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">
              Este enlace es válido por 1 hora.
            </p>
            
            <p style="color: #6c757d; font-size: 14px;">
              Si no solicitaste restablecer tu contraseña, ignora este correo.
            </p>
            
            <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">
              O copia y pega este enlace en tu navegador:<br>
              ${resetUrl}
            </p>
          </div>
          <div class="footer">
            <p>Sistema de Tickets IT - Tu Empresa</p>
          </div>
        </div>
      </body>
      </html>
    `

    await sendEmail({
      to: user.email,
      subject: 'Restablecer contraseña - Sistema de Tickets',
      html,
    })

    return NextResponse.json({
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña',
    })
  } catch (error) {
    console.error('Error en forgot password:', error)
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    )
  }
}