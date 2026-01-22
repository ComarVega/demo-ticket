import { sendEmail } from './email'
import {
  ticketCreatedEmail,
  ticketAssignedEmail,
  ticketStatusChangedEmail,
  ticketCommentEmail,
  ticketResolvedEmail,
  ticketClosedEmail,
} from './email-templates'
import prisma from "@/lib/prisma"

export async function notifyTicketCreated(ticketId: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { createdBy: true },
    })

    if (!ticket) {
      console.error(`Ticket ${ticketId} not found for email notification`)
      return
    }

    const html = ticketCreatedEmail(ticket, ticket.createdBy)

    await sendEmail({
      to: ticket.createdBy.email,
      subject: `Ticket #${ticket.ticketNumber} creado - ${ticket.title}`,
      html,
    })
  } catch (error) {
    console.error('Error sending ticket created email:', error)
  }
}

export async function notifyTicketAssigned(ticketId: string, assignerId?: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    })

    if (!ticket || !ticket.assignedTo) {
      console.error(`Ticket ${ticketId} not found or not assigned for assignment notification`)
      return
    }

    let assigner
    if (assignerId) {
      assigner = await prisma.user.findUnique({ where: { id: assignerId } })
    }

    const html = ticketAssignedEmail(ticket, ticket.assignedTo, assigner ?? undefined)

    await sendEmail({
      to: ticket.assignedTo.email,
      subject: `Ticket #${ticket.ticketNumber} asignado - ${ticket.title}`,
      html,
      cc: [ticket.createdBy.email], // Notificar también al creador
    })
  } catch (error) {
    console.error('Error sending ticket assignment notification email:', error)
  }
}

export async function notifyStatusChange(
  ticketId: string,
  oldStatus: string,
  newStatus: string
) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: true,
        assignedTo: true,
      },
    })

    if (!ticket) {
      console.error(`Ticket ${ticketId} not found for status change notification`)
      return
    }

    const recipients = [ticket.createdBy.email]
    if (ticket.assignedTo && ticket.assignedTo.email !== ticket.createdBy.email) {
      recipients.push(ticket.assignedTo.email)
    }

    const html = ticketStatusChangedEmail(ticket, ticket.createdBy, oldStatus, newStatus)

    await sendEmail({
      to: recipients[0],
      cc: recipients.slice(1),
      subject: `Ticket #${ticket.ticketNumber} - Estado: ${newStatus}`,
      html,
    })
  } catch (error) {
    console.error('Error sending status change notification email:', error)
  }
}

export async function notifyNewComment(
  ticketId: string,
  commentId: string,
  isInternal: boolean = false
) {
  try {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: true,
      ticket: {
        include: {
          createdBy: true,
          assignedTo: true,
        },
      },
    },
  })

  if (!comment || !comment.ticket) return

  // Si es comentario interno, solo notificar a técnicos
  const recipients: string[] = []

  if (isInternal) {
    // Notificar solo al técnico asignado y administradores
    if (comment.ticket.assignedTo) {
      recipients.push(comment.ticket.assignedTo.email)
    }
    // Aquí podrías agregar lógica para notificar a admins
  } else {
    // Notificar a todos los involucrados
    recipients.push(comment.ticket.createdBy.email)
    if (
      comment.ticket.assignedTo &&
      comment.ticket.assignedTo.email !== comment.ticket.createdBy.email
    ) {
      recipients.push(comment.ticket.assignedTo.email)
    }
  }

    // No notificar al autor del comentario
    const filteredRecipients = recipients.filter((email) => email !== comment.author.email)

    if (filteredRecipients.length === 0) return

    const html = ticketCommentEmail(
      comment.ticket,
      comment.ticket.createdBy,
      comment.content,
      comment.author.name
    )

    await sendEmail({
      to: filteredRecipients[0],
      cc: filteredRecipients.slice(1),
      subject: `Ticket #${comment.ticket.ticketNumber} - Nuevo comentario`,
      html,
    })
  } catch (error) {
    console.error('Error sending comment notification email:', error)
  }
}

export async function notifyTicketResolved(ticketId: string, solution?: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { createdBy: true },
    })

    if (!ticket) {
      console.error(`Ticket ${ticketId} not found for resolved notification`)
      return
    }

    const html = ticketResolvedEmail(ticket, ticket.createdBy, solution)

    await sendEmail({
      to: ticket.createdBy.email,
      subject: `Ticket #${ticket.ticketNumber} resuelto - ${ticket.title}`,
      html,
    })
  } catch (error) {
    console.error('Error sending ticket resolved notification email:', error)
  }
}

export async function notifyTicketClosed(ticketId: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { createdBy: true },
    })

    if (!ticket) {
      console.error(`Ticket ${ticketId} not found for closed notification`)
      return
    }

    const html = ticketClosedEmail(ticket, ticket.createdBy)

    await sendEmail({
      to: ticket.createdBy.email,
      subject: `Ticket #${ticket.ticketNumber} cerrado - ${ticket.title}`,
      html,
    })
  } catch (error) {
    console.error('Error sending ticket closed notification email:', error)
  }
}