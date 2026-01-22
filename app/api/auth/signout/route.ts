import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Este endpoint maneja el cierre de sesión forzado
    // desde el hook de inactividad cuando se cierra el navegador

    const session = await getServerSession(authOptions)

    if (session?.user) {
      // Aquí podríamos hacer alguna limpieza adicional si fuera necesario
      console.log(`Sesión cerrada automáticamente para usuario: ${session.user.email}`)
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