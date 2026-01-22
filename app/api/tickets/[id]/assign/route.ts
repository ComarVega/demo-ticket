import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from "@/lib/prisma"
import { notifyTicketAssigned } from '@/lib/email-notifications'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { assignedToId } = await request.json()

    const { id } = await context.params;

    // Actualizar el ticket
    const ticket = await prisma.ticket.update({
      where: { id: id },
      data: {
        assignedToId,
        status: 'ASSIGNED',
      },
    })

    // 🔔 Enviar email de asignación
    // El segundo parámetro es quién lo asignó (opcional)
    await notifyTicketAssigned(ticket.id, session.user.id)

    return NextResponse.json(ticket)
    
  } catch (error) {
    console.error('Error asignando ticket:', error)
    return NextResponse.json(
      { error: 'Error al asignar ticket' },
      { status: 500 }
    )
  }
}