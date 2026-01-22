import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const latestTicket = await prisma.ticket.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            attachments: true,
            comments: true,
          }
        }
      }
    })
    console.log('Latest ticket:', JSON.stringify(latestTicket, null, 2))
    
    const activity = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    console.log('Latest activity logs:', JSON.stringify(activity, null, 2))
    
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
