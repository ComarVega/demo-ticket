// app/api/tickets/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { notifyNewComment } from '@/lib/email-notifications'



const createCommentSchema = z.object({
  content: z.string().min(1, "El comentario no puede estar vacío"),
  isInternal: z.boolean().default(false),
})

// GET /api/tickets/[id]/comments - Obtener comentarios
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el ticket existe
    const ticket = await prisma.ticket.findUnique({
      where: { id }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    // Verificar permisos
    const canView = 
      session.user.role === "ADMIN" ||
      session.user.role === "TECHNICIAN" ||
      ticket.createdById === session.user.id ||
      ticket.assignedToId === session.user.id

    if (!canView) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Filtrar comentarios internos si es usuario normal
    let where: { ticketId: string; isInternal?: boolean } = { ticketId: id };
    
    if (session.user.role === "USER") {
      where = { ...where, isInternal: false }
    }

    const comments = await prisma.comment.findMany({
      where,
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
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Error al obtener comentarios" },
      { status: 500 }
    )
  }
}

// POST /api/tickets/[id]/comments - Crear comentario
export async function POST(
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
    const validatedData = createCommentSchema.parse(body)

    // Verificar que el ticket existe
    const ticket = await prisma.ticket.findUnique({
      where: { id }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    // Verificar permisos
    const canComment = 
      session.user.role === "ADMIN" ||
      session.user.role === "TECHNICIAN" ||
      ticket.createdById === session.user.id ||
      ticket.assignedToId === session.user.id

    if (!canComment) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Solo técnicos y admins pueden crear notas internas
    if (validatedData.isInternal && session.user.role === "USER") {
      return NextResponse.json(
        { error: "No tienes permiso para crear notas internas" },
        { status: 403 }
      )
    }

    // Crear comentario
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        isInternal: validatedData.isInternal,
        ticketId: id,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    })

    // Crear log de actividad
    await prisma.activityLog.create({
      data: {
        action: "commented",
        details: validatedData.isInternal ? "Agregó una nota interna" : "Agregó un comentario",
        ticketId: id,
        userId: session.user.id,
      }
    })

    // Enviar notificación por email
    try {
      await notifyNewComment(id, comment.id, validatedData.isInternal)
    } catch (emailError) {
      console.error('Error sending comment notification email:', emailError)
      // No fallar la creación del comentario si falla el email
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Error al crear comentario" },
      { status: 500 }
    )
  }
}
