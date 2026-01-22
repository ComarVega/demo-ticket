import { useEffect, useRef, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface UseInactivityLogoutOptions {
  timeout?: number // en milisegundos, default 1 minuto
  promptBeforeLogout?: boolean
  promptMessage?: string
  promptTimeout?: number // tiempo para mostrar el prompt antes de cerrar sesión
}

export function useInactivityLogout(options: UseInactivityLogoutOptions = {}) {
  const { data: session } = useSession()
  const {
    timeout = 60 * 1000, // 1 minuto por defecto
    promptBeforeLogout = true,
    promptMessage = 'Tu sesión expirará en 10 segundos debido a inactividad. ¿Quieres continuar?',
    promptTimeout = 10 * 1000 // 10 segundos
  } = options

  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const promptTimeoutRef = useRef<NodeJS.Timeout>()
  const lastActivityRef = useRef<number>(Date.now())
  const promptShownRef = useRef<boolean>(false)

  // Resetear el temporizador de inactividad
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()

    // Limpiar timeouts existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (promptTimeoutRef.current) {
      clearTimeout(promptTimeoutRef.current)
    }

    // Si había un prompt mostrado, ocultarlo
    if (promptShownRef.current) {
      hidePrompt()
      promptShownRef.current = false
    }

    // Configurar nuevo temporizador
    timeoutRef.current = setTimeout(() => {
      if (promptBeforeLogout) {
        showPrompt()
        promptShownRef.current = true

        promptTimeoutRef.current = setTimeout(() => {
          performLogout()
        }, promptTimeout)
      } else {
        performLogout()
      }
    }, timeout)
  }, [timeout, promptBeforeLogout, promptTimeout])

  // Mostrar prompt de advertencia
  const showPrompt = () => {
    // Crear overlay de advertencia
    const overlay = document.createElement('div')
    overlay.id = 'inactivity-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
    `

    const prompt = document.createElement('div')
    prompt.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      text-align: center;
    `

    const message = document.createElement('p')
    message.textContent = promptMessage
    message.style.cssText = `
      margin-bottom: 1.5rem;
      color: #374151;
      font-size: 1rem;
      line-height: 1.5;
    `

    const buttonContainer = document.createElement('div')
    buttonContainer.style.cssText = `
      display: flex;
      gap: 1rem;
      justify-content: center;
    `

    const continueButton = document.createElement('button')
    continueButton.textContent = 'Continuar'
    continueButton.style.cssText = `
      padding: 0.5rem 1.5rem;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    `
    continueButton.onmouseover = () => continueButton.style.backgroundColor = '#2563eb'
    continueButton.onmouseout = () => continueButton.style.backgroundColor = '#3b82f6'
    continueButton.onclick = () => {
      hidePrompt()
      resetTimer()
    }

    const logoutButton = document.createElement('button')
    logoutButton.textContent = 'Cerrar Sesión'
    logoutButton.style.cssText = `
      padding: 0.5rem 1.5rem;
      background-color: #dc2626;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    `
    logoutButton.onmouseover = () => logoutButton.style.backgroundColor = '#b91c1c'
    logoutButton.onmouseout = () => logoutButton.style.backgroundColor = '#dc2626'
    logoutButton.onclick = () => {
      performLogout()
    }

    buttonContainer.appendChild(continueButton)
    buttonContainer.appendChild(logoutButton)
    prompt.appendChild(message)
    prompt.appendChild(buttonContainer)
    overlay.appendChild(prompt)
    document.body.appendChild(overlay)
  }

  // Ocultar prompt
  const hidePrompt = () => {
    const overlay = document.getElementById('inactivity-overlay')
    if (overlay) {
      document.body.removeChild(overlay)
    }
  }

  // Realizar logout
  const performLogout = useCallback(async () => {
    hidePrompt()
    try {
      await signOut({ callbackUrl: '/login' })
    } catch (error) {
      console.error('Error during logout:', error)
      // Fallback: redirect manual
      router.push('/login')
    }
  }, [router])

  // Configurar event listeners para actividad del usuario
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    const handleActivity = () => resetTimer()

    // Agregar event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Configurar timer inicial
    resetTimer()

    // Evento para cerrar sesión cuando se cierra el navegador
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Solo cerrar sesión si hay una sesión activa
      if (session?.user) {
        // Forzar logout inmediato sin prompt cuando se cierra el navegador
        performLogout()
      }
    }

    // Evento para cuando la página se oculta (cambio de pestaña, minimizar, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // La página se ocultó, podríamos acelerar el timeout
        // Por ahora mantenemos el comportamiento normal
      } else {
        // La página se mostró nuevamente, resetear timer
        resetTimer()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (promptTimeoutRef.current) {
        clearTimeout(promptTimeoutRef.current)
      }

      hidePrompt()
    }
  }, [resetTimer, performLogout])

  return {
    resetTimer,
    lastActivity: lastActivityRef.current
  }
}