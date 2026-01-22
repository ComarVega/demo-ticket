interface User {
  name: string
  email: string
}

interface Ticket {
  id: string
  ticketNumber: number
  title: string
  description: string
  priority: string
  category: string
  status: string
  createdAt: Date
}

const baseStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .ticket-info {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .ticket-info p {
      margin: 8px 0;
    }
    .ticket-info strong {
      color: #495057;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-high { background-color: #fee; color: #c00; }
    .badge-medium { background-color: #fef3cd; color: #856404; }
    .badge-low { background-color: #d1ecf1; color: #0c5460; }
    .badge-critical { background-color: #f8d7da; color: #721c24; }
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
      border-top: 1px solid #dee2e6;
    }
  </style>
`

function getPriorityBadge(priority: string) {
  const badges: { [key: string]: string } = {
    CRITICAL: 'badge-critical',
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
  }
  return `<span class="badge ${badges[priority] || 'badge-medium'}">${priority}</span>`
}

export function ticketCreatedEmail(ticket: Ticket, creator: User) {
  const ticketUrl = `${process.env.APP_URL}/tickets/${ticket.ticketNumber}`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 Nuevo Ticket Creado</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${creator.name}</strong>,</p>
          <p>Tu ticket ha sido creado exitosamente y nuestro equipo de soporte lo revisará pronto.</p>
          
          <div class="ticket-info">
            <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
            <p><strong>Título:</strong> ${ticket.title}</p>
            <p><strong>Categoría:</strong> ${ticket.category}</p>
            <p><strong>Prioridad:</strong> ${getPriorityBadge(ticket.priority)}</p>
            <p><strong>Estado:</strong> ${ticket.status}</p>
            <p><strong>Descripción:</strong></p>
            <p style="color: #6c757d;">${ticket.description}</p>
          </div>

          <a href="${ticketUrl}" class="button">Ver Ticket</a>

          <p style="color: #6c757d; font-size: 14px;">
            Recibirás notificaciones sobre actualizaciones de este ticket.
          </p>
        </div>
        <div class="footer">
          <p>Sistema de Tickets IT - Tu Empresa</p>
          <p>Este es un correo automático, por favor no responder.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function ticketAssignedEmail(ticket: Ticket, assignee: User, assigner?: User) {
  const ticketUrl = `${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Ticket Asignado</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${assignee.name}</strong>,</p>
          <p>Se te ha asignado un nuevo ticket ${assigner ? `por <strong>${assigner.name}</strong>` : ''}.</p>
          
          <div class="ticket-info">
            <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
            <p><strong>Título:</strong> ${ticket.title}</p>
            <p><strong>Categoría:</strong> ${ticket.category}</p>
            <p><strong>Prioridad:</strong> ${getPriorityBadge(ticket.priority)}</p>
            <p><strong>Descripción:</strong></p>
            <p style="color: #6c757d;">${ticket.description}</p>
          </div>

          <a href="${ticketUrl}" class="button">Revisar Ticket</a>
        </div>
        <div class="footer">
          <p>Sistema de Tickets IT - Tu Empresa</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function ticketStatusChangedEmail(ticket: Ticket, user: User, oldStatus: string, newStatus: string) {
  const ticketUrl = `${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Estado de Ticket Actualizado</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${user.name}</strong>,</p>
          <p>El estado de tu ticket ha cambiado:</p>
          
          <div class="ticket-info">
            <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
            <p><strong>Título:</strong> ${ticket.title}</p>
            <p><strong>Estado anterior:</strong> <code>${oldStatus}</code></p>
            <p><strong>Nuevo estado:</strong> <code style="color: #667eea; font-weight: 600;">${newStatus}</code></p>
          </div>

          <a href="${ticketUrl}" class="button">Ver Detalles</a>
        </div>
        <div class="footer">
          <p>Sistema de Tickets IT - Tu Empresa</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function ticketCommentEmail(ticket: Ticket, user: User, comment: string, commenterName: string) {
  const ticketUrl = `${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 Nuevo Comentario</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${user.name}</strong>,</p>
          <p><strong>${commenterName}</strong> ha agregado un comentario al ticket:</p>
          
          <div class="ticket-info">
            <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
            <p><strong>Título:</strong> ${ticket.title}</p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 15px 0;">
            <p><strong>Comentario:</strong></p>
            <p style="color: #495057;">${comment}</p>
          </div>

          <a href="${ticketUrl}" class="button">Ver Conversación</a>
        </div>
        <div class="footer">
          <p>Sistema de Tickets IT - Tu Empresa</p>
        </div>
      </div>
    </body>
    </html>
  `
}


export function ticketResolvedEmail(ticket: Ticket, user: User, solution?: string) {
  const ticketUrl = `${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Ticket Resuelto</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${user.name}</strong>,</p>
          <p>Tu ticket ha sido marcado como resuelto.</p>
          
          <div class="ticket-info">
            <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
            <p><strong>Título:</strong> ${ticket.title}</p>
            ${solution ? `
              <hr style="border: none; border-top: 1px solid #dee2e6; margin: 15px 0;">
              <p><strong>Solución aplicada:</strong></p>
              <p style="color: #495057;">${solution}</p>
            ` : ''}
          </div>

          <a href="${ticketUrl}" class="button">Ver Ticket</a>

          <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">
            Si el problema no ha sido resuelto o tienes preguntas adicionales, puedes reabrir el ticket o agregar un comentario.
          </p>
        </div>
        <div class="footer">
          <p>Sistema de Tickets IT - Tu Empresa</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function ticketClosedEmail(ticket: Ticket, user: User) {
  const ticketUrl = `${process.env.APP_URL || 'http://localhost:3000'}/tickets/${ticket.id}`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Ticket Cerrado</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${user.name}</strong>,</p>
          <p>Tu ticket ha sido cerrado.</p>
          
          <div class="ticket-info">
            <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
            <p><strong>Título:</strong> ${ticket.title}</p>
            <p><strong>Fecha de creación:</strong> ${new Date(ticket.createdAt).toLocaleDateString('es-ES')}</p>
          </div>

          <a href="${ticketUrl}" class="button">Ver Historial</a>

          <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">
            Gracias por usar nuestro sistema de soporte. Si tienes un nuevo problema, puedes crear un ticket nuevo.
          </p>
        </div>
        <div class="footer">
          <p>Sistema de Tickets IT - Tu Empresa</p>
        </div>
      </div>
    </body>
    </html>
  `
}