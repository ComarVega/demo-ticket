import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'TECHNICIAN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Obtener tickets asignados al técnico
    const totalAssigned = await prisma.ticket.count({
      where: { assignedToId: session.user.id },
    })

    const resolved = await prisma.ticket.count({
      where: {
        assignedToId: session.user.id,
        status: 'RESOLVED',
      },
    })

    const pending = await prisma.ticket.count({
      where: {
        assignedToId: session.user.id,
        status: { in: ['OPEN', 'IN_REVIEW', 'ASSIGNED'] },
      },
    })

    // Tickets por prioridad
    const byPriority = await prisma.ticket.groupBy({
      by: ['priority'],
      where: { assignedToId: session.user.id },
      _count: true,
    })

    // Tickets por categoría
    const byCategory = await prisma.ticket.groupBy({
      by: ['category'],
      where: { assignedToId: session.user.id },
      _count: true,
    })

    // Tiempo promedio de resolución
    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        assignedToId: session.user.id,
        status: 'RESOLVED',
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    })

    let avgResolutionTimeHours = 0
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((sum, ticket) => {
        if (!ticket.resolvedAt) return sum
        const diff = ticket.resolvedAt.getTime() - ticket.createdAt.getTime()
        return sum + diff / (1000 * 60 * 60)
      }, 0)
      avgResolutionTimeHours = Math.round(totalHours / resolvedTickets.length)
    }

    // Tickets recientes
    const recentTickets = await prisma.ticket.findMany({
      where: { assignedToId: session.user.id },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      totalAssigned,
      resolved,
      pending,
      avgResolutionTimeHours,
      byPriority,
      byCategory,
      recentTickets,
    })
  } catch (error) {
    console.error('Error fetching technician stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}