
import { NextResponse }        from 'next/server'
import { getServerSession }    from 'next-auth'
import { authOptions }         from '@/lib/auth'
import   prisma                from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { notificationId } = await request.json()

    if (notificationId) {
      // Marcar una notificación específica
      await prisma.notification.update({
        where: { id: notificationId, userId: session.user.id },
        data: { read: true },
      })
    } else {
      // Marcar todas como leídas
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Error al marcar notificaciones' },
      { status: 500 }
    )
  }
}