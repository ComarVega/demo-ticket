import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany()
    console.log('Users in database:')
    users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Role: ${u.role}, Active: ${u.active}`)
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
