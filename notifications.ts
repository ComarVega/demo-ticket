import prisma from './lib/prisma'

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  link?: string
}

export async function createNotification({
  userId,
  title,
  message,
  type = 'INFO',
  link,
}: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    })
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

// Crear notificación cuando se crea un ticket
export async function notifyTicketCreatedInApp(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { createdBy: true },
  })

  if (!ticket) return

  await createNotification({
    userId: ticket.createdById,
    title: 'Ticket creado',
    message: `Tu ticket #${ticket.ticketNumber} ha sido creado exitosamente`,
    type: 'SUCCESS',
    link: `/tickets/${ticket.ticketNumber}`,
  })
}

// Crear notificación cuando se asigna un ticket
export async function notifyTicketAssignedInApp(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { assignedTo: true },
  })

  if (!ticket || !ticket.assignedTo) return

  await createNotification({
    userId: ticket.assignedToId!,
    title: 'Ticket asignado',
    message: `Se te ha asignado el ticket #${ticket.ticketNumber}`,
    type: 'INFO',
    link: `/tickets/${ticket.ticketNumber}`,
  })
}