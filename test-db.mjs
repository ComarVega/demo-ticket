import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({ take: 1 })
    console.log('Database connection successful. Users count:', users.length)
    if (users.length > 0) {
      console.log('Sample user ID:', users[0].id)
    }
  } catch (error) {
    console.error('Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
