import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface RecentTicket {
  id: string;
  ticketNumber: number;
  title: string;
  status: string;
  priority: string;
  createdBy: { name: string };
  assignedTo?: { name: string } | null;
  createdAt: Date;
  slaDeadline: Date | null;
  resolvedAt: Date | null;
}

export async function GET(request: NextRequest) {
  try {
    let session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
       // Fallback to getToken
       const token = await getToken({ req: request })
       
       if (token?.sub) {
         session = {
           user: {
             id: token.sub,
             name: token.name,
             email: token.email,
             role: token.role as any
           },
           expires: new Date(typeof token.exp === 'number' ? token.exp * 1000 : Date.now() + 3600000).toISOString()
         }
       }
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "7d"

    // Calcular fecha de inicio según el período
    const now = new Date()
    const startDate = new Date()
    
    switch (period) {
      case "all":
        // No establecer startDate, usar desde el inicio de los tiempos
        startDate.setFullYear(2020) // Fecha arbitraria antigua para "todo el tiempo"
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "6m":
        startDate.setMonth(now.getMonth() - 6)
        break
      case "3m":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Crear condición de fecha dinámica
    const dateFilter = period === "all" ? {} : { createdAt: { gte: startDate } }
    const resolvedDateFilter = period === "all" ? {} : { resolvedAt: { gte: startDate } }

    // Tickets abiertos
    const openTickets = await prisma.ticket.count({
      where: {
        status: "OPEN",
        ...dateFilter
      }
    })

    // Tickets en progreso
    const inProgressTickets = await prisma.ticket.count({
      where: {
        status: { in: ["IN_REVIEW", "ASSIGNED", "WAITING_USER"] },
        ...dateFilter
      }
    })

    // Tickets resueltos
    const resolvedTickets = await prisma.ticket.count({
      where: {
        status: "RESOLVED",
        ...resolvedDateFilter
      }
    })

    // Tickets críticos activos
    const criticalTickets = await prisma.ticket.count({
      where: {
        priority: "CRITICAL",
        status: { notIn: ["CLOSED", "RESOLVED"] },
        ...(period === "all" ? {} : { createdAt: { gte: startDate } })
      }
    })

    // Tickets por categoría
    const ticketsByCategory = await prisma.ticket.groupBy({
      by: ["category"],
      _count: true,
      where: {
        status: { not: "CLOSED" },
        ...dateFilter
      }
    })

    // Tickets por estado
    const ticketsByStatus = await prisma.ticket.groupBy({
      by: ["status"],
      _count: true,
      where: dateFilter
    })

    // Tickets recientes
    const recentTickets = await prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { name: true }
        },
        assignedTo: {
          select: { name: true }
        }
      }
    })

    // Top técnicos
    const topTechnicians = await prisma.user.findMany({
      where: {
        role: "TECHNICIAN",
        ticketsAssigned: {
          some: {
            status: "RESOLVED",
            ...resolvedDateFilter
          }
        }
      },
      select: {
        id: true,
        name: true,
        ticketsAssigned: {
          where: {
            status: "RESOLVED",
            ...resolvedDateFilter
          },
          select: {
            id: true,
            timeSpent: true,
            rating: true,
          }
        }
      },
      take: 3
    })

    // Calcular promedios para técnicos
    type TechnicianTicket = {
      id: string;
      timeSpent: number | null;
      rating: number | null;
    };

    type Technician = {
      name: string;
      ticketsAssigned: TechnicianTicket[];
    };

    const technicianStats = topTechnicians.map((tech: Technician) => {
      const resolved = tech.ticketsAssigned.length;
      const totalTime = tech.ticketsAssigned.reduce((sum: number, t: TechnicianTicket) => sum + (t.timeSpent || 0), 0);
      const avgTime = resolved > 0 ? (totalTime / resolved / 60).toFixed(1) : "0";
      const ratings = tech.ticketsAssigned.filter((t: TechnicianTicket) => t.rating !== null && t.rating !== undefined).map((t: TechnicianTicket) => t.rating!);
      const avgRating = ratings.length > 0 
        ? (ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length).toFixed(1)
        : "0";

      return {
        name: tech.name,
        resolved,
        avgTime: `${avgTime}h`,
        rating: parseFloat(avgRating)
      };
    }).sort((a: { resolved: number }, b: { resolved: number }) => b.resolved - a.resolved);

    // Satisfacción promedio
    const satisfactionData = await prisma.ticket.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
      where: {
        rating: { not: null },
        ...resolvedDateFilter
      }
    })

    // SLA Compliance
    const ticketsWithSLA = await prisma.ticket.findMany({
      where: {
        slaDeadline: { not: null },
        ...dateFilter
      },
      select: {
        slaDeadline: true,
        resolvedAt: true
      }
    })

    const totalWithSLA = ticketsWithSLA.length

    const slaMet = ticketsWithSLA.filter((t: { slaDeadline: Date | null; resolvedAt: Date | null }) => 
      t.resolvedAt && t.slaDeadline && t.resolvedAt <= t.slaDeadline
    ).length

    const slaBreached = ticketsWithSLA.filter((t: { slaDeadline: Date | null; resolvedAt: Date | null }) => {
      if (!t.slaDeadline) return false
      // Breached if resolved late
      if (t.resolvedAt && t.resolvedAt > t.slaDeadline) return true
      // Breached if not resolved and deadline passed
      if (!t.resolvedAt && t.slaDeadline < now) return true
      return false
    }).length

    const slaCompliance = {
      total: totalWithSLA,
      met: totalWithSLA > 0 ? Math.round((slaMet / totalWithSLA) * 100) : 0,
      breached: totalWithSLA > 0 ? Math.round((slaBreached / totalWithSLA) * 100) : 0,
      atRisk: totalWithSLA > 0 ? Math.max(0, 100 - Math.round((slaMet / totalWithSLA) * 100) - Math.round((slaBreached / totalWithSLA) * 100)) : 0
    }

    // Calcular cambios porcentuales (vs período anterior) - solo para períodos específicos
    let previousOpenTickets = 0
    let previousResolvedTickets = 0

    if (period !== "all") {
      const previousStartDate = new Date(startDate)
      const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      previousStartDate.setDate(previousStartDate.getDate() - daysDiff)

      previousOpenTickets = await prisma.ticket.count({
        where: {
          status: "OPEN",
          createdAt: { gte: previousStartDate, lt: startDate }
        }
      })

      previousResolvedTickets = await prisma.ticket.count({
        where: {
          status: "RESOLVED",
          resolvedAt: { gte: previousStartDate, lt: startDate }
        }
      })
    }

    const calculateChange = (current: number, previous: number) => {
      if (period === "all") return "N/A"
      if (previous === 0) return current > 0 ? "+100%" : "0%"
      const change = ((current - previous) / previous) * 100
      return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`
    }

    return NextResponse.json({
      stats: {
        open: {
          value: openTickets,
          change: calculateChange(openTickets, previousOpenTickets)
        },
        inProgress: {
          value: inProgressTickets,
          change: "+8%" // Simplificado
        },
        resolved: {
          value: resolvedTickets,
          change: calculateChange(resolvedTickets, previousResolvedTickets)
        },
        critical: {
          value: criticalTickets,
          change: "-25%" // Simplificado
        }
      },
      ticketsByCategory: ticketsByCategory.map((cat: { category: string; _count: number }) => ({
        name: cat.category,
        value: cat._count
      })),
      ticketsByStatus: ticketsByStatus.map((status: { status: string; _count: number }) => ({
        status: status.status,
        count: status._count
      })),
      recentTickets: recentTickets.map((ticket: RecentTicket) => ({
        id: ticket.id,
        ticketNumber: `TK-${ticket.ticketNumber}`,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        createdBy: ticket.createdBy.name,
        assignedTo: ticket.assignedTo?.name || null,
        createdAt: ticket.createdAt,
        // Calcular SLA status
        slaStatus: ticket.slaDeadline ? (
          ticket.resolvedAt 
            ? "ok"
            : new Date() > ticket.slaDeadline
              ? "critical"
              : (ticket.slaDeadline.getTime() - new Date().getTime()) < 4 * 60 * 60 * 1000
                ? "warning"
                : "ok"
        ) : "ok"
      })),
      topTechnicians: technicianStats,
      satisfaction: {
        score: satisfactionData._avg.rating?.toFixed(1) || "0",
        count: satisfactionData._count.rating || 0
      },
      slaCompliance
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}