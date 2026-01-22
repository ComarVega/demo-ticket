import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    let session = await getServerSession(authOptions)
    
    if (!session?.user) {
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

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    })

    return NextResponse.json({ notifications, unreadCount })
} catch (error) {
console.error('Error fetching notifications:', error)
return NextResponse.json(
{ error: 'Error al obtener notificaciones' },
{ status: 500 }
)
}
}