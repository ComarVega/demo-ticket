import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
export { default } from "next-auth/middleware"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/', '/login']
  const publicApiPaths = ['/api/auth', '/api/health']

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const isPublicApiPath = publicApiPaths.some(path => pathname.startsWith(path))

  // Verificar si es una ruta protegida
  const isProtectedRoute = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/admin') ||
                          (pathname.startsWith('/api/') && !isPublicApiPath)

  if (isProtectedRoute && !isPublicPath) {
    try {
      // Verificar token JWT
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      })

      if (!token) {
        // Redirigir a login si no hay token
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Verificar si el token ha expirado
      if (token.exp && Date.now() >= Number(token.exp) * 1000) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('message', 'Sesión expirada')
        return NextResponse.redirect(loginUrl)
      }

    } catch (error) {
      console.error('Error verifying token:', error)
      // En caso de error, redirigir a login
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Headers de seguridad adicionales para respuestas
  const response = NextResponse.next()

  // Prevenir caching de páginas sensibles
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"]
}
