'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ticket } from '@/types/ticket'
import { Download, FileText } from 'lucide-react'

export default function MyTicketsPage() {
  const { data: session } = useSession()
  const [createdTickets, setCreatedTickets] = useState<Ticket[]>([])
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [allowReports, setAllowReports] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [session])

  const fetchTickets = async () => {
    try {
      // Cargar configuración del sistema
      const settingsRes = await fetch('/api/admin/settings')
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setAllowReports(settings.allowReportsGeneration)
      }

      // Tickets creados
      const createdRes = await fetch('/api/tickets?createdBy=me')
      const created = await createdRes.json()
      setCreatedTickets(created)

      // Si es técnico o admin, también obtener asignados
      if (session?.user.role === 'TECHNICIAN' || session?.user.role === 'ADMIN') {
        const assignedRes = await fetch('/api/tickets?assignedTo=me')
        const assigned = await assignedRes.json()
        setAssignedTickets(assigned)
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
      alert('❌ Error al cargar tickets')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = () => {
    // Crear datos del reporte
    const reportData = {
      userName: session?.user?.name || 'Usuario',
      userEmail: session?.user?.email || '',
      generatedAt: new Date().toISOString(),
      createdTickets: createdTickets.length,
      assignedTickets: assignedTickets.length,
      totalTickets: createdTickets.length + assignedTickets.length,
      ticketsByStatus: {
        created: createdTickets.reduce((acc, ticket) => {
          acc[ticket.status] = (acc[ticket.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        assigned: assignedTickets.reduce((acc, ticket) => {
          acc[ticket.status] = (acc[ticket.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }

    // Crear y descargar archivo JSON
    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_tickets_${session?.user?.name || 'usuario'}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Cargando tickets...</p>
        </div>
      </div>
    )
  }

  const isTechnician = session?.user.role === 'TECHNICIAN' || session?.user.role === 'ADMIN'

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Tickets</h1>
          <p className="text-gray-600 mt-1">Gestiona tus tickets creados y asignados</p>
        </div>
        {allowReports && (
          <Button onClick={generateReport} className="gap-2">
            <FileText className="w-4 h-4" />
            Generar Reporte
          </Button>
        )}
      </div>

      {/* Tickets Creados */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mis Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {createdTickets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No has creado tickets</p>
          ) : (
            <div className="space-y-3">
              {createdTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => window.location.href = `/tickets/${ticket.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">#{ticket.ticketNumber}</span>
                      <Badge variant="outline">{ticket.status}</Badge>
                      <Badge
                        variant="outline"
                        className={
                          ticket.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : ticket.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : ticket.priority === 'MEDIUM'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2 truncate">{ticket.title}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>👤 {ticket.createdBy?.name || 'Usuario desconocido'}</span>
                      {ticket.location && <span>📍 {ticket.location}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tickets Asignados (solo para técnicos) */}
      {isTechnician && (
        <Card>
          <CardHeader>
            <CardTitle>Tickets asignados</CardTitle>
          </CardHeader>
          <CardContent>
            {assignedTickets.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tienes tickets asignados</p>
            ) : (
              <div className="space-y-3">
                {assignedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => window.location.href = `/tickets/${ticket.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">#{ticket.ticketNumber}</span>
                        <Badge variant="outline">{ticket.status}</Badge>
                        <Badge
                          variant="outline"
                          className={
                            ticket.priority === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : ticket.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-800'
                              : ticket.priority === 'MEDIUM'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }
                        >
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-2 truncate">{ticket.title}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>👤 {ticket.createdBy?.name || 'Usuario desconocido'}</span>
                        {ticket.location && <span>📍 {ticket.location}</span>}
                      </div>
                    </div>
                  </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )}
</div>
)
}