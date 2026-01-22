import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Ticket, ExportMetrics } from '@/types/ticket'

export function exportTicketsToPDF(tickets: Ticket[], filename: string = 'tickets.pdf') {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Reporte de Tickets', 14, 20)

  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 28)

  const tableData = tickets.map(ticket => [
    ticket.ticketNumber.toString(),
    ticket.title.substring(0, 30) + (ticket.title.length > 30 ? '...' : ''),
    ticket.status,
    ticket.priority,
    ticket.category,
    ticket.createdBy?.name || 'N/A',
    ticket.createdAt instanceof Date 
      ? ticket.createdAt.toLocaleDateString('es-ES')
      : new Date(ticket.createdAt).toLocaleDateString('es-ES'),
  ])

  autoTable(doc, {
    head: [['#', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Creador', 'Fecha']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [102, 126, 234] },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 50 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 30 },
      6: { cellWidth: 25 },
    },
  })

  doc.save(filename)
}

export function exportSingleTicketToPDF(ticket: Ticket, filename?: string) {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text(`Ticket #${ticket.ticketNumber}`, 14, 20)

  doc.setFontSize(12)
  doc.text(ticket.title, 14, 30)

  let yPos = 45

  doc.setFontSize(10)
  const addField = (label: string, value: string) => {
    doc.setFont(undefined, 'bold')
    doc.text(`${label}:`, 14, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(value, 60, yPos)
    yPos += 7
  }

  addField('Estado', ticket.status)
  addField('Prioridad', ticket.priority)
  addField('Categoría', ticket.category)
  addField('Tipo', ticket.type)
  yPos += 3
  addField('Creado por', ticket.createdBy?.name || 'N/A')
  addField('Asignado a', ticket.assignedTo?.name || 'Sin asignar')
  yPos += 3
  addField('Ubicación', ticket.location || 'N/A')
  addField('Dispositivo', ticket.device || 'N/A')
  yPos += 3
  addField('Fecha creación', new Date(ticket.createdAt).toLocaleString('es-ES'))
  
  if (ticket.resolvedAt) {
    addField('Fecha resolución', new Date(ticket.resolvedAt).toLocaleString('es-ES'))
  }

  yPos += 5
  doc.setFont(undefined, 'bold')
  doc.text('Descripción:', 14, yPos)
  yPos += 7
  doc.setFont(undefined, 'normal')
  
  const descLines = doc.splitTextToSize(ticket.description, 180)
  doc.text(descLines, 14, yPos)
  yPos += descLines.length * 5 + 5

  if (ticket.solution) {
    doc.setFont(undefined, 'bold')
    doc.text('Solución:', 14, yPos)
    yPos += 7
    doc.setFont(undefined, 'normal')
    
    const solLines = doc.splitTextToSize(ticket.solution, 180)
    doc.text(solLines, 14, yPos)
    yPos += solLines.length * 5 + 10
  }

  if (ticket.comments && ticket.comments.length > 0) {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFont(undefined, 'bold')
    doc.setFontSize(12)
    doc.text('Comentarios:', 14, yPos)
    yPos += 10

    const commentsData = ticket.comments.map(comment => [
      comment.createdAt instanceof Date 
        ? comment.createdAt.toLocaleString('es-ES')
        : new Date(comment.createdAt).toLocaleString('es-ES'),
      comment.author?.name || 'N/A',
      comment.isInternal ? 'Interno' : 'Público',
      comment.content,
    ])

    autoTable(doc, {
      head: [['Fecha', 'Autor', 'Tipo', 'Comentario']],
      body: commentsData,
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [102, 126, 234] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 110 },
      },
    })
  }

  doc.save(filename || `ticket-${ticket.ticketNumber}.pdf`)
}

export function exportMetricsToPDF(metrics: ExportMetrics, filename: string = 'metricas.pdf') {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Reporte de Métricas', 14, 20)

  doc.setFontSize(10)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 28)

  let yPos = 40
  doc.setFontSize(14)
  doc.text('Resumen General', 14, yPos)
  yPos += 10

  const summaryData = [
    ['Total de tickets', (metrics.total || 0).toString()],
    ['Tickets abiertos', (metrics.open || 0).toString()],
    ['Tickets en progreso', (metrics.inProgress || 0).toString()],
    ['Tickets resueltos', (metrics.resolved || 0).toString()],
    ['Tickets cerrados', (metrics.closed || 0).toString()],
  ]

  autoTable(doc, {
    body: summaryData,
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { cellWidth: 90 },
    },
  })

  if (metrics.byCategory) {
    const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    yPos = lastTable?.finalY ? lastTable.finalY + 15 : yPos + 15

    doc.setFontSize(14)
    doc.text('Por Categoría', 14, yPos)
    yPos += 10

    const categoryData = Object.entries(metrics.byCategory).map(([category, count]) => [
      category,
      count.toString(),
    ])

    autoTable(doc, {
      head: [['Categoría', 'Cantidad']],
      body: categoryData,
      startY: yPos,
      headStyles: { fillColor: [102, 126, 234] },
    })
  }

  if (metrics.byPriority) {
    const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    yPos = lastTable?.finalY ? lastTable.finalY + 15 : yPos + 15

    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.text('Por Prioridad', 14, yPos)
    yPos += 10

    const priorityData = Object.entries(metrics.byPriority).map(([priority, count]) => [
      priority,
      count.toString(),
    ])

    autoTable(doc, {
      head: [['Prioridad', 'Cantidad']],
      body: priorityData,
      startY: yPos,
      headStyles: { fillColor: [102, 126, 234] },
    })
  }

  doc.save(filename)
}