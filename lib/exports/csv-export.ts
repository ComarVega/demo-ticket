import Papa from 'papaparse'
import { Ticket } from '@/types/ticket'

interface TicketExportData {
  ticketNumber: number
  title: string
  status: string
  priority: string
  category: string
  createdBy: string
  assignedTo: string
  createdAt: string
  resolvedAt: string
  description: string
}

export function exportTicketsToCSV(tickets: Ticket[], filename: string = 'tickets.csv') {
  const data: TicketExportData[] = tickets.map(ticket => ({
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    createdBy: ticket.createdBy?.name || 'N/A',
    assignedTo: ticket.assignedTo?.name || 'Sin asignar',
    createdAt: ticket.createdAt instanceof Date 
      ? ticket.createdAt.toLocaleDateString('es-ES')
      : new Date(ticket.createdAt).toLocaleDateString('es-ES'),
    resolvedAt: ticket.resolvedAt 
      ? (ticket.resolvedAt instanceof Date 
          ? ticket.resolvedAt.toLocaleDateString('es-ES')
          : new Date(ticket.resolvedAt).toLocaleDateString('es-ES'))
      : 'Pendiente',
    description: ticket.description,
  }))

  const csv = Papa.unparse(data, {
    header: true,
    columns: [
      'ticketNumber',
      'title',
      'status',
      'priority',
      'category',
      'createdBy',
      'assignedTo',
      'createdAt',
      'resolvedAt',
      'description'
    ]
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportSingleTicketToCSV(ticket: Ticket, filename?: string) {
  exportTicketsToCSV([ticket], filename || `ticket-${ticket.ticketNumber}.csv`)
}