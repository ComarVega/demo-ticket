import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar base de datos
  console.log('🧹 Limpiando datos existentes...')
  await prisma.activityLog.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Base de datos limpiada')

  // Hash de contraseña para todos los usuarios
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Crear usuarios
  console.log('👥 Creando usuarios...')

  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      department: 'IT',
      location: 'Head Office',
    },
  })

  const tech1 = await prisma.user.create({
    data: {
      email: 'tech1@company.com',
      name: 'John Technician',
      password: hashedPassword,
      role: 'TECHNICIAN',
      department: 'IT Support',
      location: 'Head Office',
    },
  })

  const tech2 = await prisma.user.create({
    data: {
      email: 'tech2@company.com',
      name: 'Sarah Support',
      password: hashedPassword,
      role: 'TECHNICIAN',
      department: 'IT Support',
      location: 'Branch Office',
    },
  })

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@company.com',
      name: 'Jane Employee',
      password: hashedPassword,
      role: 'USER',
      department: 'Sales',
      location: 'Branch Office',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@company.com',
      name: 'Robert Marketing',
      password: hashedPassword,
      role: 'USER',
      department: 'Marketing',
      location: 'Head Office',
    },
  })

  console.log(`✅ ${5} usuarios creados`)

  // Crear tickets
  console.log('🎫 Creando tickets de ejemplo...')

  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Laptop no enciende',
      description: 'Mi laptop no enciende después de actualizar Windows anoche. He intentado mantener presionado el botón de encendido pero no responde.',
      status: 'OPEN',
      priority: 'HIGH',
      category: 'HARDWARE',
      type: 'INCIDENT',
      createdById: user1.id,
      location: 'Branch Office',
      device: 'Dell Latitude 5520',
      os: 'Windows 11',
      isOperational: false,
    },
  })

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Solicitud de acceso a CRM',
      description: 'Necesito acceso al sistema CRM para mi nuevo puesto en el departamento de ventas. Requiero permisos de lectura y escritura.',
      status: 'ASSIGNED',
      priority: 'MEDIUM',
      category: 'ACCESS',
      type: 'REQUEST',
      createdById: user1.id,
      assignedToId: tech1.id,
      location: 'Branch Office',
    },
  })

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Impresora no imprime en color',
      description: 'La impresora del tercer piso solo imprime en blanco y negro. Ya verifiqué que tiene tinta de colores instalada.',
      status: 'IN_REVIEW',
      priority: 'LOW',
      category: 'HARDWARE',
      type: 'INCIDENT',
      createdById: user2.id,
      assignedToId: tech2.id,
      location: 'Head Office',
      device: 'HP LaserJet Pro MFP M428fdw',
    },
  })

  const ticket4 = await prisma.ticket.create({
    data: {
      title: 'No puedo conectarme a la VPN',
      description: 'Al intentar conectarme a la VPN corporativa desde casa, recibo un error de autenticación.',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      category: 'NETWORK',
      type: 'INCIDENT',
      createdById: user1.id,
      assignedToId: tech1.id,
      location: 'Remote',
      solution: 'Se actualizaron las credenciales VPN del usuario y se reinstalo el cliente. El usuario ya puede conectarse correctamente.',
      resolvedAt: new Date(),
    },
  })

  const ticket5 = await prisma.ticket.create({
    data: {
      title: 'Instalación de software Adobe Creative Suite',
      description: 'Necesito que se instale Adobe Creative Suite en mi computadora para el nuevo proyecto de diseño.',
      status: 'WAITING_USER',
      priority: 'LOW',
      category: 'SOFTWARE',
      type: 'REQUEST',
      createdById: user2.id,
      assignedToId: tech2.id,
      location: 'Head Office',
      device: 'MacBook Pro 16"',
      os: 'macOS Sonoma',
    },
  })

  console.log(`✅ ${5} tickets creados`)

  // Crear comentarios
  console.log('💬 Creando comentarios...')

  await prisma.comment.create({
    data: {
      content: 'Revisando el caso. ¿Podrías intentar conectar el cargador y dejarlo por al menos 30 minutos?',
      isInternal: false,
      ticketId: ticket1.id,
      authorId: tech1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Sí, lo dejé conectado toda la noche pero sigue sin encender. Ni siquiera se enciende la luz del cargador.',
      isInternal: false,
      ticketId: ticket1.id,
      authorId: user1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Nota interna: Parece ser problema de hardware. Programar visita técnica.',
      isInternal: true,
      ticketId: ticket1.id,
      authorId: tech1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'He creado tu usuario en el CRM. Usuario: jemployee - Contraseña enviada a tu correo corporativo.',
      isInternal: false,
      ticketId: ticket2.id,
      authorId: tech1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Perfecto, ya pude acceder. Muchas gracias!',
      isInternal: false,
      ticketId: ticket2.id,
      authorId: user1.id,
    },
  })

  console.log(`✅ ${5} comentarios creados`)

  // Crear notificaciones
  console.log('🔔 Creando notificaciones...')

  await prisma.notification.create({
    data: {
      userId: user1.id,
      title: 'Ticket creado exitosamente',
      message: 'Tu ticket #1 ha sido creado y será revisado pronto',
      type: 'SUCCESS',
      link: '/tickets/1',
      read: true,
    },
  })

  await prisma.notification.create({
    data: {
      userId: user1.id,
      title: 'Ticket asignado',
      message: 'Tu ticket #2 ha sido asignado a John Technician',
      type: 'INFO',
      link: '/tickets/2',
      read: false,
    },
  })

  await prisma.notification.create({
    data: {
      userId: tech1.id,
      title: 'Nuevo ticket asignado',
      message: 'Se te ha asignado el ticket #2: Solicitud de acceso a CRM',
      type: 'INFO',
      link: '/tickets/2',
      read: false,
    },
  })

  await prisma.notification.create({
    data: {
      userId: user1.id,
      title: 'Ticket resuelto',
      message: 'Tu ticket #4 sobre VPN ha sido marcado como resuelto',
      type: 'SUCCESS',
      link: '/tickets/4',
      read: false,
    },
  })

  await prisma.notification.create({
    data: {
      userId: user2.id,
      title: 'Información requerida',
      message: 'El ticket #5 requiere más información de tu parte',
      type: 'WARNING',
      link: '/tickets/5',
      read: false,
    },
  })

  console.log(`✅ ${5} notificaciones creadas`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ ¡Base de datos poblada exitosamente!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n📧 Credenciales de usuarios de prueba:')
  console.log('   (Contraseña para todos: password123)\n')
  console.log('👨‍💼 ADMIN:')
  console.log('   Email: admin@company.com')
  console.log('\n🔧 TÉCNICOS:')
  console.log('   Email: tech1@company.com')
  console.log('   Email: tech2@company.com')
  console.log('\n👤 USUARIOS:')
  console.log('   Email: user1@company.com')
  console.log('   Email: user2@company.com')
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error al ejecutar el seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })