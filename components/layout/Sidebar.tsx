"use client"

import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Settings, 
  LogOut,
  FileText,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface SidebarProps {
  currentUser: {
    name: string
    email: string
    role: string
    initials: string
  }
  activeItem: string
  onItemClick: (href: string) => void
  onLogout: () => void
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", badge: null },
  { icon: Ticket, label: "Todos los Tickets", href: "/tickets", badge: "12" },
  { icon: FileText, label: "Mis Tickets", href: "/my-tickets", badge: "3" },
  { icon: Users, label: "Usuarios", href: "/users", badge: null, adminOnly: true },
  { icon: BarChart3, label: "Reportes", href: "/reports", badge: null, adminOnly: true },
  { icon: Settings, label: "Configuración", href: "/settings", badge: null },
]

export function Sidebar({ currentUser, activeItem, onItemClick, onLogout }: SidebarProps) {
  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || currentUser.role === "ADMIN"
  )

  return (
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
          const isActive = activeItem === item.href
          
          return (
            <button
              key={item.href}
              onClick={() => onItemClick(item.href)}
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
              {currentUser.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
          </div>
        </div>
        
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start gap-3 mt-2 text-slate-700 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}