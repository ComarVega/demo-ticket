import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const userId = 'cmkgkyohi0000c7fclgfj5nts' // Using the ID from test-db.mjs
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          title: "Test Ticket from Script",
          description: "This is a test description for the ticket.",
          category: "SOFTWARE",
          priority: "HIGH",
          type: "INCIDENT",
          createdById: userId,
          slaDeadline: new Date(),
          attachments: {
            create: []
          }
        }
      })

      await tx.activityLog.create({
        data: {
          action: "created",
          details: "Ticket creado desde script de test",
          ticketId: ticket.id,
          userId: userId,
        }
      })

      return ticket
    })
    console.log('Ticket created successfully:', result.id, 'Number:', result.ticketNumber)
  } catch (error) {
    console.error('Failed to create ticket:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
