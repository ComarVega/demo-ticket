import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Verificar conexión a base de datos
    await prisma.$queryRaw`SELECT 1`

    // Verificar servicios críticos
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        nextjs: 'ok',
        uptime: process.uptime()
      },
      version: process.env.npm_package_version || '1.0.0'
    }

    return NextResponse.json(healthCheck)
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    }, { status: 503 })
  }
}