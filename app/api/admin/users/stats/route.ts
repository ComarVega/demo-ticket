import { NextResponse }       from 'next/server'
import { getServerSession }   from 'next-auth'
import { authOptions }        from '@/lib/auth'
import   prisma               from '@/lib/prisma'
import { SystemStats }        from '@/types/admin'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({ where: { active: true } })
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })

    const totalTickets = await prisma.ticket.count()
    const ticketsByStatus = await prisma.ticket.groupBy({
      by: ['status'],
      _count: true,
    })
    const ticketsByPriority = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: true,
    })
    const ticketsByCategory = await prisma.ticket.groupBy({
      by: ['category'],
      _count: true,
    })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentResolvedTickets = await prisma.ticket.count({
      where: {
        status: 'RESOLVED',
        resolvedAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    const resolvedTicketsWithTime = await prisma.ticket.findMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    })

    let avgResolutionTimeHours = 0
    if (resolvedTicketsWithTime.length > 0) {
      type ResolvedTicket = { createdAt: Date; resolvedAt: Date | null };
      const totalHours = resolvedTicketsWithTime.reduce((sum: number, ticket: ResolvedTicket) => {
        if (!ticket.resolvedAt) return sum
        const diff = ticket.resolvedAt.getTime() - ticket.createdAt.getTime()
        return sum + diff / (1000 * 60 * 60)
      }, 0)
      avgResolutionTimeHours = Math.round(totalHours / resolvedTicketsWithTime.length)
    }

    const topTechnicians = await prisma.user.findMany({
      where: {
        role: 'TECHNICIAN',
        active: true,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            ticketsAssigned: {
              where: { status: 'RESOLVED' },
            },
          },
        },
      },
      orderBy: {
        ticketsAssigned: {
          _count: 'desc',
        },
      },
      take: 5,
    })

    const stats: SystemStats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole,
      },
      tickets: {
        total: totalTickets,
        byStatus: ticketsByStatus,
        byPriority: ticketsByPriority,
        byCategory: ticketsByCategory,
        recentResolved: recentResolvedTickets,
        avgResolutionTimeHours,
      },
      topTechnicians,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}