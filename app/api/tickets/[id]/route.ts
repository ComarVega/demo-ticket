// app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import {
  notifyStatusChange,
  notifyTicketAssigned,
  notifyTicketResolved,
  notifyTicketClosed,
} from '@/lib/email-notifications'

const updateTicketSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(10).optional(),
  status: z.enum(["OPEN", "IN_REVIEW", "WAITING_USER", "ASSIGNED", "RESOLVED", "CLOSED", "REOPENED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  category: z.enum(["HARDWARE", "SOFTWARE", "NETWORK", "ACCESS", "OTHER"]).optional(),
  assignedToId: z.string().nullable().optional(),
  solution: z.string().optional(),
  rootCause: z.string().optional(),
  timeSpent: z.number().optional(),
  requiresFollowup: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
})

// GET /api/tickets/[id] - Obtener un ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log(`API: Intentando obtener ticket con ID: ${id}`)
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        },
        attachments: true,
        activityLogs: {
          include: {
            user: {
              select: {
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    })

    if (!ticket) {
      console.log(`API: Ticket con ID ${id} no encontrado`)
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    // Verificar permisos (usuario solo puede ver sus propios tickets, técnicos y admins todos)
    const canView = 
      session.user.role === "ADMIN" ||
      session.user.role === "TECHNICIAN" ||
      ticket.createdById === session.user.id ||
      ticket.assignedToId === session.user.id

    if (!canView) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json(ticket)
  } catch (error: unknown) {
    console.error("Error fetching ticket:", error)
    return NextResponse.json(
      {
        error: "Error al obtener ticket",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// PUT /api/tickets/[id] - Actualizar ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateTicketSchema.parse(body)

    // Verificar que el ticket existe
    const existingTicket = await prisma.ticket.findUnique({
      where: { id }
    })

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    // Verificar permisos
    const canEdit = 
      session.user.role === "ADMIN" ||
      session.user.role === "TECHNICIAN" ||
      existingTicket.createdById === session.user.id

    if (!canEdit) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Preparar datos de actualización
    const updateData: Partial<typeof existingTicket> = { ...validatedData }

    // Si se cambia a RESOLVED, guardar fecha
    if (validatedData.status === "RESOLVED" && existingTicket.status !== "RESOLVED") {
      updateData.resolvedAt = new Date()
    }

    // Si se cambia a CLOSED, guardar fecha
    if (validatedData.status === "CLOSED" && existingTicket.status !== "CLOSED") {
      updateData.closedAt = new Date()
    }

    // Actualizar ticket
    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Crear logs de actividad para cambios importantes
    const activityLogs = []

    if (validatedData.status && validatedData.status !== existingTicket.status) {
      activityLogs.push({
        action: "status_changed",
        details: `Estado cambiado de ${existingTicket.status} a ${validatedData.status}`,
        ticketId: ticket.id,
        userId: session.user.id,
      })
    }

    if (validatedData.assignedToId !== undefined && validatedData.assignedToId !== existingTicket.assignedToId) {
      const assignedUser = validatedData.assignedToId 
        ? await prisma.user.findUnique({ where: { id: validatedData.assignedToId }, select: { name: true } })
        : null

      activityLogs.push({
        action: "assigned",
        details: assignedUser 
          ? `Asignado a ${assignedUser.name}`
          : "Ticket desasignado",
        ticketId: ticket.id,
        userId: session.user.id,
      })
    }

    if (validatedData.priority && validatedData.priority !== existingTicket.priority) {
      activityLogs.push({
        action: "priority_changed",
        details: `Prioridad cambiada de ${existingTicket.priority} a ${validatedData.priority}`,
        ticketId: ticket.id,
        userId: session.user.id,
      })
    }

    if (activityLogs.length > 0) {
      await prisma.activityLog.createMany({
        data: activityLogs
      })
    }

    // Enviar notificaciones por email
    try {
      // Notificar cambio de estado
      if (validatedData.status && validatedData.status !== existingTicket.status) {
        await notifyStatusChange(ticket.id, existingTicket.status, validatedData.status)
      }

      // Notificar asignación
      if (validatedData.assignedToId !== undefined && validatedData.assignedToId !== existingTicket.assignedToId) {
        if (validatedData.assignedToId) {
          await notifyTicketAssigned(ticket.id, session.user.id)
        }
      }

      // Notificar resolución
      if (validatedData.status === "RESOLVED" && existingTicket.status !== "RESOLVED") {
        await notifyTicketResolved(ticket.id, validatedData.solution)
      }

      // Notificar cierre
      if (validatedData.status === "CLOSED" && existingTicket.status !== "CLOSED") {
        await notifyTicketClosed(ticket.id)
      }
    } catch (emailError) {
      console.error('Error sending email notifications:', emailError)
      // No fallar la actualización si falla el email
    }

    return NextResponse.json(ticket)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating ticket:", error)
    return NextResponse.json(
      { error: "Error al actualizar ticket" },
      { status: 500 }
    )
  }
}

// DELETE /api/tickets/[id] - Eliminar ticket (solo admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    await prisma.ticket.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: "Ticket eliminado" })
  } catch (error) {
    console.error("Error deleting ticket:", error)
    return NextResponse.json(
      { error: "Error al eliminar ticket" },
      { status: 500 }
    )
  }
}
