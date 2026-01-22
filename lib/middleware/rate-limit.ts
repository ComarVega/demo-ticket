// Rate limiting básico en memoria (para producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number // Ventana de tiempo en ms
  maxRequests: number // Máximo de requests por ventana
  keyGenerator?: (req: Request) => string // Función para generar clave única
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyGenerator } = options

  return (req: Request): { allowed: boolean; remaining: number; resetTime: number } => {
    const key = keyGenerator ? keyGenerator(req) : getClientIP(req)
    const now = Date.now()
    const windowStart = Math.floor(now / windowMs) * windowMs
    const resetTime = windowStart + windowMs

    const current = rateLimitMap.get(key)

    if (!current || current.resetTime !== resetTime) {
      // Nueva ventana de tiempo
      rateLimitMap.set(key, { count: 1, resetTime })
      return { allowed: true, remaining: maxRequests - 1, resetTime }
    }

    if (current.count >= maxRequests) {
      // Límite excedido
      return { allowed: false, remaining: 0, resetTime: current.resetTime }
    }

    // Incrementar contador
    current.count++
    rateLimitMap.set(key, current)

    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime
    }
  }
}

// Función para obtener IP del cliente
function getClientIP(req: Request): string {
  // En producción, obtener la IP real del header apropiado
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const clientIP = req.headers.get('x-client-ip')

  // Usar la primera IP válida encontrada
  const ip = forwarded?.split(',')[0]?.trim() ||
             realIP ||
             clientIP ||
             'unknown'

  return ip
}

// Rate limiters preconfigurados
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5, // 5 intentos de login por IP cada 15 min
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100, // 100 requests por IP por minuto
})

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 10, // 10 uploads por IP por minuto
})