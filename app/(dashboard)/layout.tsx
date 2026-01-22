"use client"

import { NotificationsDropdown } from '@/components/layout/notifications-dropdown'
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  ChevronDown,
  FileText,
  BarChart3,
  TicketIcon
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useSession, signOut } from "next-auth/react"
import { useInactivityLogout } from "@/lib/hooks/use-inactivity-logout"

// Simular datos del usuario (Fallback)
const defaultUser = {
  name: "Cargando...",
  email: "",
  role: "USER" as const,
}

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
  badge: string | null
  roles: Array<'USER' | 'TECHNICIAN' | 'ADMIN'>
}

// Función para obtener los elementos del menú según el rol
const getMenuItems = (userRole: string): MenuItem[] => {
  let menuItems: MenuItem[] = []

  // Para usuarios USER: solo "Nuevo Ticket" y "Mis Tickets"
  if (userRole === 'USER') {
    menuItems = [
      {
        icon: Plus,
        label: "Nuevo Ticket",
        href: "/tickets/new",
        badge: null,
        roles: ['USER']
      },
      {
        icon: FileText,
        label: "Mis Tickets",
        href: "/my-tickets",
        badge: null,
        roles: ['USER', 'TECHNICIAN', 'ADMIN']
      }
    ]
  } else if (userRole === 'TECHNICIAN') {
    // Para técnicos: Dashboard + Reportes + Mis Tickets
    menuItems = [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/dashboard",
        badge: null,
        roles: ['TECHNICIAN', 'ADMIN']
      },
      {
        icon: FileText,
        label: "Mis Tickets",
        href: "/my-tickets",
        badge: null,
        roles: ['USER', 'TECHNICIAN', 'ADMIN']
      },
      {
        icon: BarChart3,
        label: "Reportes",
        href: "/reports",
        badge: null,
        roles: ['TECHNICIAN', 'ADMIN']
      }
    ]
  } else if (userRole === 'ADMIN') {
    // Para administradores: todas las opciones
    menuItems = [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/dashboard",
        badge: null,
        roles: ['TECHNICIAN', 'ADMIN']
      },
      {
        icon: FileText,
        label: "Mis Tickets",
        href: "/my-tickets",
        badge: null,
        roles: ['USER', 'TECHNICIAN', 'ADMIN']
      },
      {
        icon: BarChart3,
        label: "Reportes",
        href: "/reports",
        badge: null,
        roles: ['TECHNICIAN', 'ADMIN']
      },
      {
        icon: TicketIcon,
        label: "Todos Los Tickets",
        href: "/tickets",
        badge: null,
        roles: ['ADMIN']
      },
      {
        icon: Users,
        label: "Gestión de Usuarios",
        href: "/admin/users",
        badge: null,
        roles: ['ADMIN']
      },
      {
        icon: BarChart3,
        label: "Estadísticas del Sistema",
        href: "/admin/stats",
        badge: null,
        roles: ['ADMIN']
      },
      {
        icon: Settings,
        label: "Configuración",
        href: "/admin/settings",
        badge: null,
        roles: ['ADMIN']
      }
    ]
  } else {
    // Rol desconocido: solo Mis Tickets como fallback
    menuItems = [
      {
        icon: FileText,
        label: "Mis Tickets",
        href: "/my-tickets",
        badge: null,
        roles: ['USER', 'TECHNICIAN', 'ADMIN']
      }
    ]
  }

  return menuItems
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // CORRECCIÓN: Usamos requestAnimationFrame para evitar el renderizado en cascada síncrono
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const user = session?.user || defaultUser
  const userInitials = user.name?.split(" ").filter(Boolean).map((n: string) => n[0]).join("").toUpperCase().substring(0, 2) || "U"

  // Hook para cerrar sesión por inactividad (5 minutos)
  useInactivityLogout({
    timeout: 5 * 60 * 1000, // 5 minutos
    promptBeforeLogout: true,
    promptMessage: 'Tu sesión pronto expirará debido a inactividad. ¿Quieres continuar?',
    promptTimeout: 30 * 1000 // 30 segundos para responder
  })

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  // Obtener menú según el rol del usuario
  const filteredMenuItems = getMenuItems(user.role)

  // Evitamos el parpadeo de hidratación retornando null hasta que el cliente esté listo
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar para desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col grow bg-white border-r border-slate-200">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Tickets IT</h1>
              <p className="text-xs text-slate-500">Sistema de soporte</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-700 hover:bg-slate-50"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-slate-200">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-3 mt-2 text-slate-700 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 lg:hidden
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Tickets IT</h1>
                <p className="text-xs text-slate-500">Sistema de soporte</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href)
                    setSidebarOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-700 hover:bg-slate-50"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-slate-200">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-3 mt-2 text-slate-700 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            {/* Left: Mobile menu + Search */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
                aria-label="Abrir menú"
              >
                <Menu className="w-6 h-6 text-slate-700" />
              </button>
              
              <div className="hidden md:flex items-center flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Buscar tickets..."
                    className="pl-9 h-9 bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button 
                className="gap-2 h-9"
                onClick={() => router.push('/tickets/new')}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Ticket</span>
              </Button>
              
              <NotificationsDropdown />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}