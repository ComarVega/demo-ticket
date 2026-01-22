'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportSingleTicketToCSV } from '@/lib/exports/csv-export'
import { exportTicketDetailsToExcel } from '@/lib/exports/excel-export'
import { exportSingleTicketToPDF } from '@/lib/exports/pdf-export'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ticket } from '@/types/ticket'

interface SingleTicketExportProps {
  ticket: Ticket
}

export function SingleTicketExport({ ticket }: SingleTicketExportProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportSingleTicketToCSV(ticket)}>
          Exportar a CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportTicketDetailsToExcel(ticket)}>
          Exportar a Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportSingleTicketToPDF(ticket)}>
          Exportar a PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}