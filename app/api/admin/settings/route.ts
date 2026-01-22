import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

// Esquema de validación para configuraciones del sistema
const systemSettingsSchema = z.object({
  maxFileSize: z.number().min(1).max(100),
  slaTimes: z.object({
    LOW: z.number().min(1).max(168),
    MEDIUM: z.number().min(1).max(168),
    HIGH: z.number().min(1).max(168),
    CRITICAL: z.number().min(1).max(168),
  }),
  emailSupport: z.string().email(),
  allowReportsGeneration: z.boolean(),
})

// GET /api/admin/settings - Obtener configuraciones del sistema
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Por ahora retornamos valores por defecto
    // En producción, esto vendría de una tabla de configuraciones
    const settings = {
      maxFileSize: 10,
      slaTimes: {
        LOW: 72,
        MEDIUM: 48,
        HIGH: 24,
        CRITICAL: 4,
      },
      emailSupport: "soporte@tuempresa.com",
      allowReportsGeneration: true,
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuraciones" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings - Actualizar configuraciones del sistema
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = systemSettingsSchema.parse(body)

    // Aquí guardaríamos en la base de datos
    // Por ahora solo validamos y retornamos éxito
    console.log("Settings updated:", validatedData)

    return NextResponse.json({
      success: true,
      message: "Configuraciones guardadas exitosamente",
      settings: validatedData
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Error al guardar configuraciones" },
      { status: 500 }
    )
  }
}