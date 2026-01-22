"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  User,
  Calendar,
  Download,
  RefreshCw,
  Bell,
  Star,
  Loader2,
  Plus,
  BarChart3,
  Users
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { FileUpload } from "@/components/tickets/FileUpload"

// Componente para usuarios USER - formulario de creación de ticket
const NewTicketForm = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<Array<{ name: string; url: string; size: number; type?: string }>>([])
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    category: '',
    priority: '',
    location: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.category || !formData.priority || !formData.description.trim()) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setLoading(true)

    try {
      const ticketData = {
        ...formData,
        attachments: files.map(file => ({
          name: file.name,
          url: file.url,
          size: file.size,
          type: file.type || 'unknown'
        }))
      }

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      })

      if (response.ok) {
        alert('Ticket creado exitosamente')
        // Limpiar formulario
        setFormData({
          title: '',
          type: '',
          category: '',
          priority: '',
          location: '',
          description: ''
        })
        setFiles([])
        // Redirigir a mis tickets
        router.push('/my-tickets')
      } else {
        const error = await response.json()
        alert(`Error al crear el ticket: ${error.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      alert('Error al crear el ticket. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Crear Nuevo Ticket</h1>
        <p className="text-slate-600 mt-1">Reporta un problema o solicita asistencia técnica</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nuevo Ticket de Soporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título del ticket */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Título del problema *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe brevemente el problema..."
                required
              />
            </div>

            {/* Tipo de ticket */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Tipo de ticket *
              </label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCIDENT">Incidente - Algo no funciona</SelectItem>
                  <SelectItem value="REQUEST">Solicitud - Petición de servicio</SelectItem>
                  <SelectItem value="MAINTENANCE">Mantenimiento - Servicio programado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Categoría *
              </label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HARDWARE">Hardware - Problemas con equipos físicos</SelectItem>
                  <SelectItem value="SOFTWARE">Software - Aplicaciones y programas</SelectItem>
                  <SelectItem value="NETWORK">Red - Conectividad e internet</SelectItem>
                  <SelectItem value="ACCESS">Accesos - Permisos y credenciales</SelectItem>
                  <SelectItem value="OTHER">Otros - Otros temas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioridad */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Prioridad *
              </label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja - No urgente, puede esperar</SelectItem>
                  <SelectItem value="MEDIUM">Media - Importante, resolver pronto</SelectItem>
                  <SelectItem value="HIGH">Alta - Urgente, afecta productividad</SelectItem>
                  <SelectItem value="CRITICAL">Crítica - Emergencia, bloquea trabajo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ubicación */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Ubicación
              </label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu ubicación (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oficina-central">Oficina Central</SelectItem>
                  <SelectItem value="sucursal-norte">Sucursal Norte</SelectItem>
                  <SelectItem value="sucursal-sur">Sucursal Sur</SelectItem>
                  <SelectItem value="sucursal-este">Sucursal Este</SelectItem>
                  <SelectItem value="sucursal-oeste">Sucursal Oeste</SelectItem>
                  <SelectItem value="remoto">Trabajo Remoto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Descripción detallada *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-32 resize-vertical"
                placeholder="Describe detalladamente el problema, pasos para reproducirlo, impacto, etc."
                required
              />
            </div>

            {/* Archivos adjuntos */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Archivos adjuntos
              </label>
              <FileUpload
                files={files}
                onFilesChange={setFiles}
                disabled={loading}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Ticket
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" disabled={loading} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

const priorityColors = {
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  MEDIUM: "bg-blue-100 text-blue-800 border-blue-200",
  LOW: "bg-slate-100 text-slate-800 border-slate-200"
}

const statusColors = {
  OPEN: "bg-yellow-100 text-yellow-800",
  IN_REVIEW: "bg-blue-100 text-blue-800",
  ASSIGNED: "bg-purple-100 text-purple-800",
  WAITING_USER: "bg-orange-100 text-orange-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-slate-100 text-slate-800",
  REOPENED: "bg-red-100 text-red-800"
}

const statusLabels = {
  OPEN: "Abierto",
  IN_REVIEW: "En Revisión",
  ASSIGNED: "Asignado",
  WAITING_USER: "Esperando Usuario",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
  REOPENED: "Reabierto"
}

const slaStatusColors = {
  ok: "border-l-green-500",
  warning: "border-l-yellow-500",
  critical: "border-l-red-500"
}

interface Stat {
  value: number;
  change: string;
}

interface Stats {
  open: Stat;
  inProgress: Stat;
  resolved: Stat;
  critical: Stat;
}

interface CategoryData {
  [key: string]: string | number;
  name: string;
  value: number;
}
interface StatusData {
  status: string;
  count: number;
}

interface DashboardTicket {
  id: string;
  ticketNumber: string;
  title: string;
  priority: string;
  status: string;
  createdBy: string;
  createdAt: string;
  slaStatus?: string;
}

interface Technician {
  name: string;
  rating: number;
  avgTime: string;
  resolved: number;
}

interface Satisfaction {
  score: string;
  count: number;
}

interface SLACompliance {
  met: number;
  atRisk: number;
  breached: number;
}

interface DashboardData {
  stats: Stats;
  ticketsByCategory: CategoryData[];
  ticketsByStatus: StatusData[];
  recentTickets: DashboardTicket[];
  topTechnicians: Technician[];
  satisfaction: Satisfaction;
  slaCompliance: SLACompliance;
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [period, setPeriod] = useState("7d")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/dashboard/stats?period=${period}`)
      if (!response.ok) throw new Error("Error al cargar datos")
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error("Error fetching dashboard:", error)
      alert("Error al cargar el dashboard")
    } finally {
      setIsRefreshing(false)
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchDashboardData()
  }, [period, fetchDashboardData])

  // Para usuarios USER, mostrar directamente el formulario de creación
  // No redirigir, mostrar el contenido directamente

  const handleExport = (format: string) => {
    alert(`Exportando reporte en formato ${format.toUpperCase()}`)
  }

  const formatDate = (dateString: string) => {
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

  // Para usuarios USER, mostrar directamente el formulario de creación de ticket
  if (session?.user?.role === 'USER') {
    return <NewTicketForm />
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Error al cargar datos del dashboard</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  const { stats, ticketsByCategory, ticketsByStatus, recentTickets, topTechnicians, satisfaction, slaCompliance } = dashboardData

  const statsCards = [
    {
      title: "Tickets Abiertos",
      value: stats.open.value,
      change: stats.open.change,
      trend: stats.open.change?.startsWith('+') ? "up" : "down",
      icon: Ticket,
      color: "blue"
    },
    {
      title: "En Progreso",
      value: stats.inProgress.value,
      change: stats.inProgress.change,
      trend: "up",
      icon: Clock,
      color: "orange"
    },
    {
      title: "Resueltos",
      value: stats.resolved.value,
      change: stats.resolved.change,
      trend: "up",
      icon: CheckCircle2,
      color: "green"
    },
    {
      title: "Críticos",
      value: stats.critical.value,
      change: stats.critical.change,
      trend: stats.critical.change?.startsWith('-') ? "down" : "up",
      icon: AlertCircle,
      color: "red"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Vista general del sistema de tickets</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-45">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="12m">Último año</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          <Select onValueChange={handleExport}>
            <SelectTrigger className="w-35">
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Exportar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="h-16 justify-start gap-4 px-6 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800"
          onClick={() => router.push('/tickets/new')}
        >
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-bold">Nuevo Ticket</p>
            <p className="text-xs opacity-80">Reportar un problema</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-16 justify-start gap-4 px-6 border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800"
          onClick={() => router.push('/reports')}
        >
          <div className="p-2 bg-purple-600 rounded-lg text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-bold">Ver Reportes</p>
            <p className="text-xs opacity-80">Analizar métricas</p>
          </div>
        </Button>

        {session?.user.role === 'ADMIN' && (
          <Button
            variant="outline"
            className="h-16 justify-start gap-4 px-6 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800"
            onClick={() => router.push('/users')}
          >
            <div className="p-2 bg-slate-600 rounded-lg text-white">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold">Gestionar Usuarios</p>
              <p className="text-xs opacity-80">Ver equipo</p>
            </div>
          </Button>
        )}
      </div>

      {/* SLA Alert */}
      {slaCompliance.breached > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-orange-900">Alerta de SLA</p>
                <p className="text-sm text-orange-800 mt-1">
                  Tienes <strong>{stats.critical.value} tickets críticos</strong> y tickets en riesgo de incumplir el SLA.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          const isPositive = stat.trend === "up"
          
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* SLA & Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Cumplimiento de SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Dentro de SLA</span>
                  <span className="text-sm font-bold text-green-700">{slaCompliance.met}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${slaCompliance.met}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">En riesgo</span>
                  <span className="text-sm font-bold text-yellow-700">{slaCompliance.atRisk}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${slaCompliance.atRisk}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Incumplidos</span>
                  <span className="text-sm font-bold text-red-700">{slaCompliance.breached}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${slaCompliance.breached}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Satisfacción del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-6xl font-bold text-slate-900">{satisfaction.score}</span>
                <div className="text-left">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-5 h-5 ${star <= Math.floor(parseFloat(satisfaction.score)) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">de 5.0</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">Basado en {satisfaction.count} evaluaciones</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tickets por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ticketsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ticketsByCategory.map((entry, index: number) => (
                    <Cell key={`cell-${index}`} fill={["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ticketsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="status" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Overall Rating */}
      <Card>
        <CardHeader>
          <CardTitle>Calificación General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 ${star <= Math.floor(parseFloat(satisfaction.score)) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                  />
                ))}
              </div>
              <div className="text-left">
                <p className="text-4xl font-bold text-slate-900">{satisfaction.score}</p>
                <p className="text-sm text-slate-600">de 5.0 estrellas</p>
              </div>
            </div>
            <p className="text-slate-600">
              Basado en {satisfaction.count} evaluaciones de usuarios
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tickets Recientes</CardTitle>
          <Button variant="ghost" className="gap-2" onClick={() => window.location.href = '/tickets'}>
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div 
                key={ticket.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 hover:bg-slate-50 transition-colors cursor-pointer ${ticket.slaStatus ? slaStatusColors[ticket.slaStatus as keyof typeof slaStatusColors] : ''}`}
                onClick={() => window.location.href = `/tickets/${ticket.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-medium text-blue-600">
                      {ticket.ticketNumber}
                    </span>
                    <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                      {ticket.priority}
                    </Badge>
                    <Badge variant="secondary" className={statusColors[ticket.status as keyof typeof statusColors]}>
                      {statusLabels[ticket.status as keyof typeof statusLabels]}
                    </Badge>
                    {ticket.slaStatus === "critical" && (
                      <Badge className="bg-red-600 text-white">SLA Crítico</Badge>
                    )}
                    {ticket.slaStatus === "warning" && (
                      <Badge className="bg-yellow-600 text-white">SLA en Riesgo</Badge>
                    )}
                  </div>
                  <p className="font-medium text-slate-900 truncate">{ticket.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {ticket.createdBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(ticket.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}