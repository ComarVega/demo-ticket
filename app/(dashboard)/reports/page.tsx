'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Ticket, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { redirect } from 'next/navigation'

interface TechnicianStats {
  totalAssigned: number
  resolved: number
  pending: number
  avgResolutionTimeHours: number
  byPriority: Array<{ priority: string; _count: number }>
  byCategory: Array<{ category: string; _count: number }>
  recentTickets: Array<{
    id: string
    ticketNumber: number
    title: string
    status: string
    priority: string
    createdAt: string
  }>
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<TechnicianStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user.role !== 'TECHNICIAN' && session?.user.role !== 'ADMIN') {
      redirect('/dashboard')
    }
    fetchStats()
  }, [session])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/technician/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
      alert('❌ Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-500">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-gray-500">No se pudieron cargar las estadísticas</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mis Reportes</h1>
        <p className="text-gray-600 mt-1">Estadísticas de tus tickets asignados</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Asignados</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssigned}</div>
            <p className="text-xs text-muted-foreground">Total de tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Tickets completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Por resolver</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResolutionTimeHours}h</div>
            <p className="text-xs text-muted-foreground">De resolución</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* By Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Por Prioridad</CardTitle>
            <CardDescription>Distribución de tickets asignados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byPriority.map((item) => (
                <div key={item.priority} className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={
                      item.priority === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : item.priority === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : item.priority === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }
                  >
                    {item.priority}
                  </Badge>
                  <span className="font-semibold">{item._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle>Por Categoría</CardTitle>
            <CardDescription>Tipos de tickets que atiendes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byCategory.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.category}</span>
                  <span className="font-semibold">{item._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets Recientes</CardTitle>
          <CardDescription>Últimos tickets asignados a ti</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => window.location.href = `/tickets/${ticket.ticketNumber}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{ticket.ticketNumber}</span>
                    <Badge variant="outline" className="text-xs">
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{ticket.title}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    ticket.priority === 'CRITICAL'
                      ? 'bg-red-100 text-red-800'
                      : ticket.priority === 'HIGH'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {ticket.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}