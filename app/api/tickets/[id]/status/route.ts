import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from "@/lib/prisma"
import { notifyStatusChange, notifyTicketResolved, notifyTicketClosed } from '@/lib/email-notifications'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { status, solution } = await request.json()

    const { id } = await context.params;

        // Primero obtener el estado anterior
    const oldTicket = await prisma.ticket.findUnique({
      where: { id: id },
    })

    if (!oldTicket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const oldStatus = oldTicket.status

    // Actualizar el ticket
    const ticket = await prisma.ticket.update({
      where: { id: id },
      data: {
        status,
        ...(status === 'RESOLVED' && { 
          resolvedAt: new Date(),
          solution 
        }),
        ...(status === 'CLOSED' && { 
          closedAt: new Date() 
        }),
      },
    })

    // 🔔 Enviar email según el nuevo estado
    if (status === 'RESOLVED') {
      await notifyTicketResolved(ticket.id, solution)
    } else if (status === 'CLOSED') {
      await notifyTicketClosed(ticket.id)
    } else {
      await notifyStatusChange(ticket.id, oldStatus, status)
    }

    return NextResponse.json(ticket)
    
  } catch (error) {
    console.error('Error actualizando estado:', error)
    return NextResponse.json(
      { error: 'Error al actualizar estado' },
      { status: 500 }
    )
  }
}