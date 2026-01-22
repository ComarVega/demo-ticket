import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const tickets = await prisma.ticket.findMany({
      take: 10,
      include: {
        _count: {
          select: {
            attachments: true,
            comments: true,
            activityLogs: true
          }
        }
      }
    })
    console.log('Tickets in DB:', JSON.stringify(tickets, null, 2))
  } catch (error) {
    console.error('Failed to fetch tickets:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
