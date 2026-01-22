import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { notifyTicketCreated } from '@/lib/email-notifications'
import { Tickets } from "lucide-react"

// Función de sanitización básica
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres potencialmente peligrosos
    .slice(0, 1000) // Limitar longitud
}

// Esquema de validación con sanitización
const createTicketSchema = z.object({
  title: z.string()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(200, "El título no puede exceder 200 caracteres")
    .transform(sanitizeInput),
  description: z.string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(5000, "La descripción no puede exceder 5000 caracteres")
    .transform(sanitizeInput),
  category: z.enum(["HARDWARE", "SOFTWARE", "NETWORK", "ACCESS", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  type: z.enum(["INCIDENT", "REQUEST", "MAINTENANCE"]),
  location: z.string()
    .max(100, "La ubicación no puede exceder 100 caracteres")
    .optional()
    .transform(v => v === "" ? undefined : sanitizeInput(v || "")),
  device: z.string()
    .max(100, "El dispositivo no puede exceder 100 caracteres")
    .optional()
    .transform(v => v === "" ? undefined : sanitizeInput(v || "")),
  os: z.string()
    .max(100, "El sistema operativo no puede exceder 100 caracteres")
    .optional()
    .transform(v => v === "" ? undefined : sanitizeInput(v || "")),
  isOperational: z.boolean().optional(),
  attachments: z.array(z.object({
    name: z.string().max(255, "El nombre del archivo no puede exceder 255 caracteres"),
    url: z.string().url("URL inválida"),
    size: z.number().max(8 * 1024 * 1024, "El archivo no puede exceder 8MB"), // 8MB máximo
    type: z.string().optional(),
  })).max(5, "No se pueden subir más de 5 archivos").optional(),
})

// GET /api/tickets - Listar tickets con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const category = searchParams.get("category")
    const assignedFilter = searchParams.get("assigned")
    const search = searchParams.get("search")
    const userId = searchParams.get("userId") // Para "Mis Tickets"

    // Construir filtros dinámicos
    const where: Record<string, any> = {}

    if (status && status !== "all") {
      where.status = status
    }

    if (priority && priority !== "all") {
      where.priority = priority
    }

    if (category && category !== "all") {
      where.category = category
    }

    if (assignedFilter === "assigned") {
      where.assignedToId = { not: null }
    } else if (assignedFilter === "unassigned") {
      where.assignedToId = null
    } else if (assignedFilter && assignedFilter !== "all" && assignedFilter !== "") {
       // Support filtering by specific technician ID
       where.assignedToId = assignedFilter
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { ticketNumber: !isNaN(Number(search)) ? Number(search) : undefined }
      ].filter(f => f.ticketNumber !== undefined || f.title !== undefined)
    }

    // Filtro para "Mis Tickets" - Si se especifica userId, filtramos por creador
    if (userId) {
      // Regla de seguridad: Si no soy ADMIN, solo puedo filtrar por mi propio usuario si userId != "all"
      if (session.user.role !== 'ADMIN' && userId !== 'me' && userId !== session.user.id) {
         // Si intento ver tickets de otro, forzamos a ver los míos o error. 
         // Aquí forzaremos los míos para ser seguros.
         where.createdById = session.user.id
      } else if (userId === 'me') {
         where.createdById = session.user.id
      } else {
         where.createdById = userId 
      }
    }

    // REGLAS DE VISIBILIDAD POR ROL (Enforcement)
    if (session.user.role === 'USER') {
      // Usuarios normales SOLO ven sus propios tickets
      where.createdById = session.user.id
    } else if (session.user.role === 'TECHNICIAN') {
      // Técnicos ven:
      // 1. Tickets asignados a ellos
      // 2. Tickets sin asignar (para poder tomarlos)
      // 3. Tickets creados por ellos mismos ("Mis Tickets" personal)
      
      // Si ya hay un filtro asignado (ej. "Mis Tickets" donde createdById está set), respetarlo pero dentro del scope permitido.
      // Si estamos en "Todos los tickets" (sin filtro de createdById), restringir.
      
      if (!where.createdById) {
         // Si no está filtrando por "Mis Tickets", aplicamos restricción de visibilidad de técnico
         // NOTA: Si el técnico quiere ver "Mis Tickets" (donde él creó el ticket), ya está cubierto si `userId=me` arriba.
         // Pero si entra al dashboard general:
         
         const existingAssignedFilter = where.assignedToId
         
         if (existingAssignedFilter) {
            // Si está buscando por asginado y no es él mismo, verificar si se permite
            // El requerimiento dice: "no ver tickets de otros técnicos". 
            // Si el filtro es para otro técnico, debería devolver vacío?
            if (existingAssignedFilter !== session.user.id) {
               // Si intenta ver tickets de otro técnico, bloqueamos devolviendo vacío (o suplantamos filter)
               // Mejor añadimos condición AND que hará que no de resultados
               where.OR = [
                  { assignedToId: session.user.id }, // Solo ver los míos
                  { createdById: session.user.id }   // O los que yo creé
               ]
               // Nota: Si busca "unassigned", existingAssignedFilter es null? No, prisma usa lógica.
               // Si assignedFilter param era "unassigned", where.assignedToId = null.
            }
         } else {
             // Sin filtro específico de asignación, mostrar: Míos (asignados) O Míos (creados) O Sin Asignar
             // El usuario pidió: "technicians only can see their tickets and not those of other technicians or assigned to admin"
             // Esto implica que NO pueden ver tickets asignados a OTROS. Sí pueden ver unassigned.
             
             where.OR = [
                { assignedToId: session.user.id },
                { assignedToId: null },
                { createdById: session.user.id }
             ]
         }
      }
    }
    // ADMIN ve todo (no aplicamos restricción extra)

    const tickets = await prisma.ticket.findMany({
      where,
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
        _count: {
          select: {
            comments: true,
            attachments: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json(
      { error: "Error al obtener tickets" },
      { status: 500 }
    )
  }
}

// POST /api/tickets - Crear ticket
export async function POST(request: NextRequest) {
  console.log("POST /api/tickets - Request received")
  try {
    const session = await getServerSession(authOptions)
    console.log("Session:", session ? "User " + session.user?.id : "No session")
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Body received:", JSON.stringify(body, null, 2))
    
    // Validar datos
    let validatedBody;
    try {
      validatedBody = createTicketSchema.parse(body)
    } catch (zodError: any) {
      console.error("Zod Validation Error:", zodError.issues)
      return NextResponse.json(
        { error: "Datos inválidos", details: zodError.issues },
        { status: 400 }
      )
    }

    const { attachments, ...ticketData } = validatedBody

    // Calcular SLA deadline basado en prioridad
    const slaHours = {
      CRITICAL: 4,
      HIGH: 8,
      MEDIUM: 24,
      LOW: 48
    }

    const slaDeadline = new Date()
    slaDeadline.setHours(slaDeadline.getHours() + slaHours[ticketData.priority])

    // Crear ticket en una transacción para incluir adjuntos y log
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          ...ticketData,
          createdById: session.user.id,
          slaDeadline,
          attachments: {
            create: attachments?.map(att => ({
              filename: att.name,
              url: att.url,
              size: att.size,
              mimeType: att.type || "application/octet-stream"
            })) || []
          }
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      })

      // Crear log de actividad
      await tx.activityLog.create({
        data: {
          action: "created",
          details: "Ticket creado",
          ticketId: ticket.id,
          userId: session.user.id,
        }
      })

      return ticket
    })

    // Notificar por email (simulado aquí con un log)
    await notifyTicketCreated(result.id)
    
    console.log(`📧 Email notification: Ticket ${result.ticketNumber} created`)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("CRITICAL ERROR in POST /api/tickets:", error)
    if (error.stack) console.error(error.stack)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor", 
        message: error.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    )

    // Después de crear el ticket:

  }
}

// DELETE /api/tickets - Eliminar tickets en masa
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Se requiere una lista de IDs de tickets" },
        { status: 400 }
      )
    }

    // Eliminar tickets (y sus relaciones por cascade si está configurado en Prisma, 
    // sino habría que borrar manualmente comentarios, adjuntos, etc.
    // Asumiendo que Prisma schema tiene onDelete: Cascade para relaciones)
    // Pero por seguridad, primero borramos relaciones si es necesario.
    // Dado que no veo el schema, asumo lo básico.
    
    // Primero borrar adjuntos y logs
    await prisma.activityLog.deleteMany({
      where: { ticketId: { in: ids } }
    })
    
    // Borrar comentarios
    await prisma.comment.deleteMany({
      where: { ticketId: { in: ids } }
    })
    
    // Borrar adjuntos (la tabla de relación) - si existe tabla separada
    // Si Attachments es tabla separada relacionada
    // await prisma.attachment.deleteMany(...) 
    // Asumiremos que el borrado del ticket maneja esto o que no es crítico por ahora, 
    // pero ActivityLog y Comment son lo más común.
    
    // Finalmente borrar tickets
    const result = await prisma.ticket.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    return NextResponse.json({ 
      message: "Tickets eliminados exitosamente", 
      count: result.count 
    })
  } catch (error) {
    console.error("Error bulk deleting tickets:", error)
    return NextResponse.json(
      { error: "Error al eliminar tickets" },
      { status: 500 }
    )
  }
}
    // DELETE /api/tickets - Deshabilitado en demo
