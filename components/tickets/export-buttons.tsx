'use client'

import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { exportTicketsToCSV } from '@/lib/exports/csv-export'
import { exportTicketsToExcel } from '@/lib/exports/excel-export'
import { exportTicketsToPDF } from '@/lib/exports/pdf-export'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ticket, TicketFilters } from '@/types/ticket'

interface ExportButtonsProps {
  tickets?: Ticket[]
  filters?: TicketFilters
}

export function ExportButtons({ tickets, filters }: ExportButtonsProps) {
  const [loading, setLoading] = useState(false)

  const fetchAndExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setLoading(true)
    try {
      if (tickets) {
        handleExport(tickets, format)
        return
      }

      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.priority) params.append('priority', filters.priority)
      if (filters?.category) params.append('category', filters.category)

      const response = await fetch(`/api/tickets/export?${params.toString()}`)
      const data: Ticket[] = await response.json()

      handleExport(data, format)
    } catch (error) {
      console.error('Error exportando:', error)
      alert('Error al exportar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (data: Ticket[], format: 'csv' | 'excel' | 'pdf') => {
    const timestamp = new Date().toISOString().split('T')[0]
    
    switch (format) {
      case 'csv':
        exportTicketsToCSV(data, `tickets-${timestamp}.csv`)
        break
      case 'excel':
        exportTicketsToExcel(data, `tickets-${timestamp}.xlsx`)
        break
      case 'pdf':
        exportTicketsToPDF(data, `tickets-${timestamp}.pdf`)
        break
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          {loading ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => fetchAndExport('csv')}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar a CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => fetchAndExport('excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar a Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => fetchAndExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar a PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}