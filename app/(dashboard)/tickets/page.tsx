"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import { Search, Eye, User, Clock, ChevronLeft, ChevronRight, X, SlidersHorizontal, Loader2, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
 


const statusConfig = {
  OPEN: { label: "Abierto", color: "bg-yellow-100 text-yellow-800" },
  IN_REVIEW: { label: "En Revisión", color: "bg-blue-100 text-blue-800" },
  ASSIGNED: { label: "Asignado", color: "bg-purple-100 text-purple-800" },
  WAITING_USER: { label: "Esperando Usuario", color: "bg-orange-100 text-orange-800" },
  RESOLVED: { label: "Resuelto", color: "bg-green-100 text-green-800" },
  CLOSED: { label: "Cerrado", color: "bg-slate-100 text-slate-800" },
  REOPENED: { label: "Reabierto", color: "bg-red-100 text-red-800" }
}

const priorityConfig = {
  LOW: { label: "Baja", color: "bg-slate-100 text-slate-800" },
  MEDIUM: { label: "Media", color: "bg-blue-100 text-blue-800" },
  HIGH: { label: "Alta", color: "bg-orange-100 text-orange-800" },
  CRITICAL: { label: "Crítica", color: "bg-red-100 text-red-800" }
}

const categoryConfig = {
  HARDWARE: { label: "Hardware" },
  SOFTWARE: { label: "Software" },
  NETWORK: { label: "Red" },
  ACCESS: { label: "Accesos" },
  OTHER: { label: "Otros" }
}

const slaStatusConfig = {
  ok: { color: "border-l-green-500", label: "" },
  warning: { color: "border-l-yellow-500", label: "SLA en Riesgo" },
  critical: { color: "border-l-red-500", label: "SLA Crítico" }
}

type Ticket = {
  id: string;
  ticketNumber: string | number;
  status: keyof typeof statusConfig;
  priority: keyof typeof priorityConfig;
  category: keyof typeof categoryConfig;
  title: string;
  createdBy: { name: string };
  assignedTo?: { name: string };
  createdAt: string;
  slaDeadline?: string;
  resolvedAt?: string;
};

export default function TicketsListPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [users, setUsers] = useState<{id: string, name: string, role: string}[]>([])
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [assignedFilter, setAssignedFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [mounted, setMounted] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    setMounted(true)
  }, [])



  



  // import { useCallback } from "react" // Moved to top-level import

  useEffect(() => {
    setMounted(true)
    if (session?.user?.role === 'ADMIN') {
      fetch('/api/users')
        .then(res => res.ok ? res.json() : [])
        .then(data => setUsers(data))
        .catch(err => console.error("Error loading users:", err))
    }
  }, [session])

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (priorityFilter !== "all") params.append("priority", priorityFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (assignedFilter !== "all") params.append("assigned", assignedFilter)
      
      // Manejo inteligente del filtro de usuario
      if (userFilter !== "all") {
        params.append("userId", userFilter)
      } else if (session?.user.role !== 'ADMIN') {
        // Si no es admin, por defecto (o si es "Mis Tickets") debería enviarse 'me' si estamos en contexto personal
        // Pero esta pagina es LISTA GLOBAL. 
        // Si el usuario es USER, el backend ya fuerza createdById=me.
        // Si es TECHNICIAN, el backend muestra (Unassigned + AssignedToMe).
        // Si un técnico quiere ver SUS tickets creados, debería usar el filtro. 
        // No forzamos nada aquí a menos que sea explícito.
      }
      
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/tickets?${params.toString()}`)
      if (!response.ok) throw new Error("Error al cargar tickets")
      
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      console.error("Error fetching tickets:", error)
      alert("Error al cargar los tickets")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter, categoryFilter, assignedFilter, userFilter, searchQuery])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchTickets()
  }

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const handleSelectAll = () => {
    if (selectedTickets.length === paginatedTickets.length) {
      setSelectedTickets([])
    } else {
      setSelectedTickets(paginatedTickets.map(t => t.id))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedTickets.length} tickets? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch('/api/tickets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedTickets })
      })

      if (response.ok) {
        alert('Tickets eliminados exitosamente')
        setSelectedTickets([])
        fetchTickets()
      } else {
        alert('Error al eliminar tickets')
      }
    } catch (error) {
      console.error('Error deleting tickets:', error)
      alert('Error al eliminar tickets')
    } finally {
      setIsDeleting(false)
    }
  }

  const totalPages = Math.ceil(tickets.length / itemsPerPage)
  const paginatedTickets = tickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all" || 
                          categoryFilter !== "all" || assignedFilter !== "all" || userFilter !== "all"

  const clearFilters = () => {
    setStatusFilter("all")
    setPriorityFilter("all")
    setCategoryFilter("all")
    setAssignedFilter("all")
    setUserFilter("all")
    setSearchQuery("")
  }

  const formatDate = (dateString: string) => {
    if (!mounted) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }

  const getSLAStatus = (ticket: Ticket) => {
    if (!mounted || !ticket.slaDeadline) return "ok"
    const deadline = new Date(ticket.slaDeadline)
    const now = new Date()
    
    if (ticket.resolvedAt) return "ok"
    if (now > deadline) return "critical"
    
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hoursLeft < 4) return "warning"
    
    return "ok"
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Todos los Tickets</h1>
          <p className="text-slate-600 mt-1">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} encontrado{tickets.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {session?.user.role === 'ADMIN' && selectedTickets.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="gap-2 animate-in fade-in slide-in-from-right-5"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar ({selectedTickets.length})
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por título o ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 h-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                Buscar
              </Button>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
                {hasActiveFilters && (
                  <Badge className="ml-1 bg-blue-600 hover:bg-blue-600">
                    {[statusFilter, priorityFilter, categoryFilter, assignedFilter].filter(f => f !== "all").length}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Estado</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Prioridad</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(priorityConfig).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Categoría</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(categoryConfig).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>



                {session?.user.role === 'ADMIN' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Creado por</label>
                      <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Todos los usuarios" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los usuarios</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                       {/* This reuses the 'assignedFilter' state, but adds specific technician options */}
                      <label className="text-sm font-medium text-slate-700">Asignado a</label>
                      <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                        <SelectTrigger className="bg-white">
                           <SelectValue placeholder="Estado de asignación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="assigned">Cualquiera (Asignado)</SelectItem>
                          <SelectItem value="unassigned">Sin asignar</SelectItem>
                          {users.filter(u => u.role === 'TECHNICIAN' || u.role === 'ADMIN').map((tech) => (
                            <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {session?.user.role !== 'ADMIN' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Asignación</label>
                  <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="assigned">Asignados</SelectItem>
                      <SelectItem value="unassigned">Sin asignar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                )}

                {hasActiveFilters && (
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                    <Button variant="ghost" onClick={clearFilters} className="gap-2">
                      <X className="w-4 h-4" />
                      Limpiar filtros
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Select All Checkbox (Only for Admin) */}
      {session?.user.role === 'ADMIN' && tickets.length > 0 && !loading && (
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            checked={selectedTickets.length > 0 && selectedTickets.length === paginatedTickets.length}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            aria-label="Seleccionar todos los tickets mostrados"
          />
          <span className="text-sm text-slate-600">Seleccionar todos en esta página</span>
        </div>
      )}

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedTickets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-slate-500">
                No se encontraron tickets
              </CardContent>
            </Card>
          ) : (
            paginatedTickets.map((ticket) => {
              const slaStatus = getSLAStatus(ticket)
              
              return (
                <Card 
                  key={ticket.id} 
                  className={`border-l-4 ${slaStatusConfig[slaStatus].color} hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {session?.user.role === 'ADMIN' && (
                        <div className="flex items-center h-full pt-1">
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(ticket.id)}
                            onChange={() => handleSelectTicket(ticket.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            aria-label={`Seleccionar ticket ${ticket.ticketNumber}`}
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-mono text-sm font-medium text-blue-600">
                            TK-{ticket.ticketNumber}
                          </span>
                          <Badge variant="secondary" className={statusConfig[ticket.status].color}>
                            {statusConfig[ticket.status].label}
                          </Badge>
                          <Badge variant="secondary" className={priorityConfig[ticket.priority].color}>
                            {priorityConfig[ticket.priority].label}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {categoryConfig[ticket.category].label}
                          </span>
                          {slaStatus !== "ok" && (
                            <Badge className="bg-red-600 text-white">
                              {slaStatusConfig[slaStatus].label}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-slate-900 mb-3">{ticket.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            <span>{ticket.createdBy.name}</span>
                          </div>
                          {ticket.assignedTo && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4 text-green-600" />
                              <span>→ {ticket.assignedTo.name}</span>
                            </div>
                          )}
                          {!ticket.assignedTo && (
                            <span className="text-slate-400 italic">Sin asignar</span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span suppressHydrationWarning>{formatDate(ticket.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-2 shrink-0">
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, tickets.length)} de {tickets.length} tickets
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline mr-1">Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}