import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

declare module "next-auth" {
  interface Session {
    demoKey?: string;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Este endpoint maneja el cierre de sesión forzado
    // desde el hook de inactividad cuando se cierra el navegador

    const session = await getServerSession(authOptions)


    // Borrado de tickets demo al cerrar sesión
    if (session?.demoKey) {
      await prisma.ticket.deleteMany({
        where: { demoKey: session.demoKey }
      })
      console.log(`Tickets demo eliminados para demoKey: ${session.demoKey}`)
    }

    // Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      message: "Sesión cerrada correctamente"
    })

  } catch (error) {
    console.error("Error during signout:", error)
    return NextResponse.json(
      { error: "Error al cerrar sesión" },
      { status: 500 }
    )
  }
}