import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from "@/lib/prisma"
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') // csv, excel, pdf
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')

    // Construir filtros
    const where: Prisma.TicketWhereInput = {}
    
    if (status) where.status = status as any
    if (priority) where.priority = priority as any
    if (category) where.category = category as any

    // Si no es admin, solo ver sus tickets
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TECHNICIAN') {
      where.createdById = session.user.id
    }

    // Obtener tickets
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
        assignedTo: {
          select: { name: true, email: true },
        },
        comments: {
          include: {
            author: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tickets)
    
  } catch (error) {
    console.error('Error exportando tickets:', error)
    return NextResponse.json(
      { error: 'Error al exportar tickets' },
      { status: 500 }
    )
  }
}