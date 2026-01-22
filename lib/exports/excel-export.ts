import * as XLSX from 'xlsx'
import { Ticket, ExportMetrics } from '@/types/ticket'

export function exportTicketsToExcel(tickets: Ticket[], filename: string = 'tickets.xlsx') {
  const data = tickets.map(ticket => ({
    'Ticket #': ticket.ticketNumber,
    'Título': ticket.title,
    'Estado': ticket.status,
    'Prioridad': ticket.priority,
    'Categoría': ticket.category,
    'Tipo': ticket.type,
    'Creado por': ticket.createdBy?.name || 'N/A',
    'Asignado a': ticket.assignedTo?.name || 'Sin asignar',
    'Ubicación': ticket.location || 'N/A',
    'Dispositivo': ticket.device || 'N/A',
    'Fecha creación': ticket.createdAt instanceof Date 
      ? ticket.createdAt.toLocaleDateString('es-ES')
      : new Date(ticket.createdAt).toLocaleDateString('es-ES'),
    'Fecha resolución': ticket.resolvedAt 
      ? (ticket.resolvedAt instanceof Date 
          ? ticket.resolvedAt.toLocaleDateString('es-ES')
          : new Date(ticket.resolvedAt).toLocaleDateString('es-ES'))
      : 'Pendiente',
    'Descripción': ticket.description,
    'Solución': ticket.solution || 'Pendiente',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tickets')

  const colWidths = [
    { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 12 },
    { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
    { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
    { wch: 50 }, { wch: 50 },
  ]
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, filename)
}

export function exportTicketDetailsToExcel(ticket: Ticket, filename?: string) {
  const wb = XLSX.utils.book_new()

  const generalData = [
    ['Ticket #', ticket.ticketNumber],
    ['Título', ticket.title],
    ['Estado', ticket.status],
    ['Prioridad', ticket.priority],
    ['Categoría', ticket.category],
    ['Tipo', ticket.type],
    [''],
    ['Creado por', ticket.createdBy?.name || 'N/A'],
    ['Email creador', ticket.createdBy?.email || 'N/A'],
    ['Asignado a', ticket.assignedTo?.name || 'Sin asignar'],
    [''],
    ['Ubicación', ticket.location || 'N/A'],
    ['Dispositivo', ticket.device || 'N/A'],
    ['Sistema operativo', ticket.os || 'N/A'],
    [''],
    ['Fecha creación', new Date(ticket.createdAt).toLocaleDateString('es-ES')],
    ['Fecha resolución', ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString('es-ES') : 'Pendiente'],
    [''],
    ['Descripción', ticket.description],
    ['Solución', ticket.solution || 'Pendiente'],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(generalData)
  ws1['!cols'] = [{ wch: 20 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Información General')

  if (ticket.comments && ticket.comments.length > 0) {
    const commentsData = ticket.comments.map(comment => ({
      'Fecha': comment.createdAt instanceof Date 
        ? comment.createdAt.toLocaleString('es-ES')
        : new Date(comment.createdAt).toLocaleString('es-ES'),
      'Autor': comment.author?.name || 'N/A',
      'Tipo': comment.isInternal ? 'Interno' : 'Público',
      'Comentario': comment.content,
    }))

    const ws2 = XLSX.utils.json_to_sheet(commentsData)
    ws2['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 60 },
    ]
    XLSX.utils.book_append_sheet(wb, ws2, 'Comentarios')
  }

  XLSX.writeFile(wb, filename || `ticket-${ticket.ticketNumber}-detalle.xlsx`)
}

export function exportMetricsToExcel(metrics: ExportMetrics, filename: string = 'metricas-tickets.xlsx') {
  const wb = XLSX.utils.book_new()

  const summaryData = [
    ['Métrica', 'Valor'],
    ['Total de tickets', metrics.total || 0],
    ['Tickets abiertos', metrics.open || 0],
    ['Tickets en progreso', metrics.inProgress || 0],
    ['Tickets resueltos', metrics.resolved || 0],
    ['Tickets cerrados', metrics.closed || 0],
    [''],
    ['Tiempo promedio resolución (horas)', metrics.avgResolutionTime || 'N/A'],
    ['Tasa de resolución (%)', metrics.resolutionRate || 'N/A'],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  ws1['!cols'] = [{ wch: 35 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen')

  if (metrics.byCategory) {
    const categoryData = Object.entries(metrics.byCategory).map(([category, count]) => ({
      'Categoría': category,
      'Cantidad': count,
    }))

    const ws2 = XLSX.utils.json_to_sheet(categoryData)
    ws2['!cols'] = [{ wch: 20 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Por Categoría')
  }

  if (metrics.byPriority) {
    const priorityData = Object.entries(metrics.byPriority).map(([priority, count]) => ({
      'Prioridad': priority,
      'Cantidad': count,
    }))

    const ws3 = XLSX.utils.json_to_sheet(priorityData)
    ws3['!cols'] = [{ wch: 20 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Por Prioridad')
  }

  XLSX.writeFile(wb, filename)
}