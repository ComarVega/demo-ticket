"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  MapPin,
  Monitor,
  Settings,
  File,
  Send,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Eye,
  EyeOff,
  Download,
  Loader2
} from "lucide-react"

type TicketStatus =
  | "OPEN"
  | "IN_REVIEW"
  | "ASSIGNED"
  | "WAITING_USER"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED"

interface Attachment {
  id: string
  filename: string
  url: string
  size: number
  mimeType: string
  ticketId: string
  uploadedAt: string
}

interface Comment {
  id: string
  content: string
  isInternal: boolean
  ticketId: string
  authorId: string
  author: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

interface ActivityLog {
  id: string
  action: string
  details: string | null
  ticketId: string | null
  userId: string
  user: {
    name: string
  }
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  role: "USER" | "TECHNICIAN" | "ADMIN"
}

interface Ticket {
  id: string
  ticketNumber: number
  title: string
  description: string
  status: TicketStatus
  priority: string
  category: string
  type: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  createdById: string
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  location?: string
  device?: string
  os?: string
  isOperational?: boolean
  slaDeadline: string
  createdAt: string
  updatedAt: string
  attachments: Attachment[]
  comments: Comment[]
  activityLogs: ActivityLog[]
}

const statusConfig: Record<
  TicketStatus,
  { label: string; color: string }
> = {
  OPEN: { label: "Abierto", color: "bg-blue-100 text-blue-800" },
  IN_REVIEW: { label: "En revisión", color: "bg-yellow-100 text-yellow-800" },
  ASSIGNED: { label: "Asignado", color: "bg-purple-100 text-purple-800" },
  WAITING_USER: { label: "Esperando usuario", color: "bg-orange-100 text-orange-800" },
  RESOLVED: { label: "Resuelto", color: "bg-green-100 text-green-800" },
  CLOSED: { label: "Cerrado", color: "bg-slate-200 text-slate-800" },
  REOPENED: { label: "Reabierto", color: "bg-blue-100 text-blue-800" }
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Baja", color: "bg-slate-100 text-slate-800 border-slate-200" },
  MEDIUM: { label: "Media", color: "bg-blue-100 text-blue-800 border-blue-200" },
  HIGH: { label: "Alta", color: "bg-orange-100 text-orange-800 border-orange-200" },
  CRITICAL: { label: "Crítica", color: "bg-red-100 text-red-800 border-red-200" }
}

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const [newComment, setNewComment] = useState("")
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>("OPEN")
  const [selectedPriority, setSelectedPriority] = useState<string>("MEDIUM")
  const [showInternalNotes, setShowInternalNotes] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [availableTechnicians, setAvailableTechnicians] = useState<User[]>([])
  const [selectedTechId, setSelectedTechId] = useState<string>("")
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    category: "",
  })
  const [mounted, setMounted] = useState(false)

  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
    fetchTicket()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tickets/${id}`)
      if (response.ok) {
        const data = await response.json()
        setTicket(data)
        setSelectedStatus(data.status)
        setSelectedPriority(data.priority)
        setEditFormData({
          title: data.title,
          description: data.description,
          category: data.category,
        })
        if (data.assignedTo?.id) {
          setSelectedTechId(data.assignedTo.id)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error(`Failed to fetch ticket: Status ${response.status}`, errorData)
      }
    } catch (error) {
      console.error("Error fetching ticket:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    try {
      const response = await fetch(`/api/tickets/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          isInternal: isInternalNote
        })
      })
      if (response.ok) {
        setNewComment("")
        fetchTicket() // Recargar para ver el nuevo comentario
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const formatRelativeTime = (dateString: string) => {
    if (!mounted || !dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }

  const getSLAStatus = () => {
    if (!mounted || !ticket?.slaDeadline) return { label: "SLA no definido", color: "text-slate-600", bg: "bg-slate-50" }
    const deadline = new Date(ticket.slaDeadline)
    const now = new Date()
    const hoursLeft = (deadline.getTime() - now.getTime()) / 3600000

    if (hoursLeft < 0) return { label: "SLA Vencido", color: "text-red-600", bg: "bg-red-50" }
    if (hoursLeft < 4) return { label: `${Math.floor(hoursLeft)}h restantes`, color: "text-orange-600", bg: "bg-orange-50" }
    return { label: `${Math.floor(hoursLeft)}h restantes`, color: "text-green-600", bg: "bg-green-50" }
  }

  const updateTicket = async (data: {
    status?: TicketStatus
    priority?: string
    assignedToId?: string
    title?: string
    description?: string
    category?: string
  }) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        const updatedTicket = await response.json()
        setTicket(updatedTicket)
        setSelectedStatus(updatedTicket.status)
        setSelectedPriority(updatedTicket.priority)
        return true
      }
    } catch (error) {
      console.error("Error updating ticket:", error)
    } finally {
      setIsUpdating(false)
    }
    return false
  }

  const handleUpdateTicket = async () => {
    const success = await updateTicket({
      status: selectedStatus,
      priority: selectedPriority
    })
    if (success) {
      alert("Ticket actualizado con éxito")
    }
  }

  const handleResolve = () => {
    updateTicket({ status: "RESOLVED" })
  }

  const handleClose = () => {
    updateTicket({ status: "CLOSED" })
  }

  const handleRequestInfo = () => {
    updateTicket({ status: "WAITING_USER" })
  }

  const handleDeleteTicket = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este ticket? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      setIsUpdating(true)
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        router.push('/dashboard')
      } else {
        alert("Error al eliminar el ticket")
      }
    } catch (error) {
      console.error("Error deleting ticket:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditTicket = async () => {
    const success = await updateTicket(editFormData)
    if (success) {
      setShowEditDialog(false)
      alert("Ticket actualizado con éxito")
    }
  }

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const users = await response.json()
        setAvailableTechnicians(users.filter((u: User) => u.role === "TECHNICIAN" || u.role === "ADMIN"))
      }
    } catch (error) {
      console.error("Error fetching technicians:", error)
    }
  }

  const handleAssignTicket = async () => {
    if (!selectedTechId) return
    const success = await updateTicket({ 
      assignedToId: selectedTechId,
      status: "ASSIGNED" 
    })
    if (success) {
      setShowAssignDialog(false)
      alert("Ticket asignado con éxito")
    }
  }

  useEffect(() => {
    if (showAssignDialog) {
      fetchTechnicians()
    }
  }, [showAssignDialog])

  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-900">Ticket no encontrado</h2>
        <Button 
          variant="link" 
          onClick={() => router.push('/dashboard')}
          className="mt-4"
        >
          Volver al dashboard
        </Button>
      </div>
    )
  }

  const slaStatus = getSLAStatus()

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="gap-2"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">Ticket #{ticket.ticketNumber}</h1>
              <Badge className={`${statusConfig[ticket.status].color} border`}>
                {statusConfig[ticket.status].label}
              </Badge>
            </div>
            <p className="text-slate-600" suppressHydrationWarning>Creado {formatRelativeTime(ticket.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(session?.user?.role === "ADMIN" || ticket.createdBy?.id === session?.user?.id) && (
            <>
              <Button variant="outline" className="gap-2" onClick={() => setShowEditDialog(true)}>
                <Edit className="w-4 h-4" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDeleteTicket}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle>{ticket.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Descripción</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Archivos Adjuntos</h3>
                  <div className="space-y-2">
                    {ticket.attachments.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <File className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{file.filename}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-2" asChild title="Descargar archivo">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`Descargar ${file.filename}`}>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comentarios
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInternalNotes(!showInternalNotes)}
                  className="gap-2"
                >
                  {showInternalNotes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showInternalNotes ? 'Ocultar' : 'Mostrar'} notas internas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comments List */}
              <div className="space-y-4">
                {ticket.comments && ticket.comments.filter(c => showInternalNotes || !c.isInternal).map((comment) => (
                  <div key={comment.id} className={`p-4 rounded-lg border-2 ${comment.isInternal ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-start gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-blue-600 text-white text-sm">
                          {comment.author?.name?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">{comment.author?.name}</span>
                          {comment.isInternal && (
                            <Badge className="bg-amber-600 text-white">Nota Interna</Badge>
                          )}
                          <span className="text-sm text-slate-500" suppressHydrationWarning>{formatRelativeTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-slate-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!ticket.comments || ticket.comments.length === 0) && (
                  <p className="text-center py-4 text-slate-500 italic">No hay comentarios aún.</p>
                )}
              </div>

              {/* Add Comment */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <Textarea
                  placeholder="Escribe un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-25"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <label htmlFor="internal" className="text-sm text-slate-700">
                      Nota interna (solo visible para el equipo)
                    </label>
                  </div>
                  <Button onClick={handleAddComment} className="gap-2">
                    <Send className="w-4 h-4" />
                    Enviar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Historial de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.activityLogs && ticket.activityLogs.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      {index < ticket.activityLogs.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-slate-900">{activity.details}</p>
                      <p className="text-xs text-slate-500 mt-1" suppressHydrationWarning>
                        {activity.user?.name} • {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full gap-2 justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={handleResolve}
                disabled={isUpdating}
              >
                <CheckCircle2 className="w-4 h-4" />
                Marcar como Resuelto
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2 justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleClose}
                disabled={isUpdating}
              >
                <XCircle className="w-4 h-4" />
                Cerrar Ticket
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2 justify-start"
                onClick={handleRequestInfo}
                disabled={isUpdating}
              >
                <AlertCircle className="w-4 h-4" />
                Solicitar Información
              </Button>

              {(session?.user?.role === "ADMIN" || session?.user?.role === "TECHNICIAN") && (
                <Button 
                  variant="outline" 
                  className="w-full gap-2 justify-start border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                  onClick={() => setShowAssignDialog(true)}
                  disabled={isUpdating}
                >
                  <User className="w-4 h-4" />
                  Asignar a Técnico
                </Button>
              )}
            </CardContent>
          </Card>

          {/* SLA Status */}
          <Card className={slaStatus.bg}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className={`w-5 h-5 ${slaStatus.color}`} />
                <div>
                  <p className="text-sm font-medium text-slate-900">SLA</p>
                  <p className={`text-lg font-bold ${slaStatus.color}`}>{slaStatus.label}</p>
                  <p className="text-xs text-slate-600 mt-1" suppressHydrationWarning>
                    Vence: {formatDate(ticket.slaDeadline)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado y Prioridad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Estado</label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TicketStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Prioridad</label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleUpdateTicket} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-slate-600">Creado por</p>
                  <p className="font-medium text-slate-900">{ticket.createdBy?.name}</p>
                  <p className="text-xs text-slate-500">{ticket.createdBy?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-slate-600">Asignado a</p>
                  <p className="font-medium text-slate-900">{ticket.assignedTo?.name || "Sin asignar"}</p>
                  <p className="text-xs text-slate-500">{ticket.assignedTo?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-slate-600">Ubicación</p>
                  <p className="font-medium text-slate-900">{ticket.location || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Monitor className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-slate-600">Dispositivo</p>
                  <p className="font-medium text-slate-900">{ticket.device || "N/A"}</p>
                  <p className="text-xs text-slate-500">{ticket.os}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Settings className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-slate-600">Estado Operativo</p>
                  <p className={`font-medium ${ticket.isOperational ? 'text-green-600' : 'text-red-600'}`}>
                    {ticket.isOperational ? 'Operativo' : 'No Operativo'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-slate-600">Última actualización</p>
                  <p className="font-medium text-slate-900" suppressHydrationWarning>{formatDate(ticket.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Ticket Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Editar Ticket</DialogTitle>
            <DialogDescription>
              Realiza cambios en la información básica del ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="min-h-25"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleEditTicket} disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Technician Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Asignar Técnico</DialogTitle>
            <DialogDescription>
              Selecciona un técnico o administrador para atender este ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="tech-select" className="mb-2 block">Técnico Disponible</Label>
            <Select value={selectedTechId} onValueChange={setSelectedTechId}>
              <SelectTrigger id="tech-select w-full">
                <SelectValue placeholder="Seleccionar técnico..." />
              </SelectTrigger>
              <SelectContent>
                {availableTechnicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name} ({tech.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancelar</Button>
            <Button onClick={handleAssignTicket} disabled={isUpdating || !selectedTechId}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Asignar Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}