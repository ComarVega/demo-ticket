"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { Activity, Users, Ticket, Clock, TrendingUp, AlertTriangle, Download, Calendar, Building } from "lucide-react"
import { useRouter } from "next/navigation"

type PeriodType = "all" | "1y" | "6m" | "3m" | "30d" | "7d"

export default function AdminStatsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  type StatsType = {
    stats: {
      open?: { value?: number; change?: string };
      inProgress?: { value?: number; change?: string };
      resolved?: { value?: number; change?: string };
      critical?: { value?: number; change?: string };
    };
    slaCompliance?: {
      met?: number;
      atRisk?: number;
      breached?: number;
    };
    satisfaction?: {
      score?: string;
      count?: number;
    };
    ticketsByCategory?: Array<{ name: string; value: number }>;
    ticketsByStatus?: Array<{ status: string; count: number }>;
    recentTickets?: Array<{
      id: string;
      ticketNumber: string;
      title: string;
      status: string;
      priority: string;
      createdBy: string;
      assignedTo?: string | null;
      createdAt: string;
      slaStatus?: string;
    }>;
  };
  const [stats, setStats] = useState<StatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>("30d")
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    fetchStats()
  }, [session, period])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/dashboard/stats?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async (format: "pdf" | "excel" | "csv") => {
    setExporting(true)
    try {
      const fileName = `estadisticas_sistema_${period}_${new Date().toISOString().split('T')[0]}`

      if (!stats || loading) {
        alert('No hay datos disponibles para exportar. Espera a que se carguen las estadísticas.')
        return
      }

      if (format === "csv") {
        await exportToCSV(fileName)
      } else if (format === "excel") {
        await exportToExcel(fileName)
      } else if (format === "pdf") {
        await exportToPDF(fileName)
      }
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Error al exportar datos')
    } finally {
      setExporting(false)
    }
  }

  const exportToCSV = async (fileName: string) => {
    const { default: Papa } = await import('papaparse')

      // Preparar datos para CSV
    if (!stats) return;
    const currentStats = stats
    const csvData = [
      // Header
      ['Métrica', 'Valor', 'Cambio'],
      ['Período', getPeriodLabel(period), ''],
      ['', '', ''],

      // Estadísticas principales
      ['Tickets Abiertos', currentStats.stats.open?.value || 0, currentStats.stats.open?.change || 'N/A'],
      ['Tickets en Progreso', currentStats.stats.inProgress?.value || 0, currentStats.stats.inProgress?.change || 'N/A'],
      ['Tickets Resueltos', currentStats.stats.resolved?.value || 0, currentStats.stats.resolved?.change || 'N/A'],
      ['Tickets Críticos', currentStats.stats.critical?.value || 0, currentStats.stats.critical?.change || 'N/A'],
      ['', '', ''],

      // SLA
      ['Cumplimiento SLA', `${currentStats.slaCompliance?.met || 0}%`, ''],
      ['SLA Cumplidos', `${currentStats.slaCompliance?.met || 0}%`, ''],
      ['SLA en Riesgo', `${currentStats.slaCompliance?.atRisk || 0}%`, ''],
      ['SLA Incumplidos', `${currentStats.slaCompliance?.breached || 0}%`, ''],
      ['', '', ''],

      // Satisfacción
      ['Satisfacción del Cliente', currentStats.satisfaction?.score || '0', ''],
      ['Total Evaluaciones', currentStats.satisfaction?.count || 0, ''],
      ['', '', ''],

      // Tickets por categoría
      ['Categoría', 'Cantidad', ''],
      ...(currentStats.ticketsByCategory || []).map(cat => [cat.name, cat.value, '']),

      ['', '', ''],
      // Tickets por estado
      ['Estado', 'Cantidad', ''],
      ...(currentStats.ticketsByStatus || []).map(status => [status.status, status.count, '']),

      ['', '', ''],
      // Actividad reciente (últimos 10 tickets)
      ['Ticket', 'Título', 'Estado', 'Prioridad', 'Creado por', 'Fecha'],
      ...(currentStats.recentTickets || []).slice(0, 10).map(ticket => [
        `#${ticket.ticketNumber}`,
        ticket.title,
        ticket.status,
        ticket.priority,
        ticket.createdBy,
        new Date(ticket.createdAt).toLocaleDateString('es-ES')
      ])
    ]

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    alert('Archivo CSV exportado correctamente')
  }

  const exportToExcel = async (fileName: string) => {
    const { default: XLSX } = await import('xlsx')

    const workbook = XLSX.utils.book_new()

    // Hoja 1: Estadísticas Generales
    if (!stats) return;
    const currentStats = stats
    const generalData = [
      ['Estadísticas del Sistema de Tickets', '', ''],
      ['Período:', getPeriodLabel(period), ''],
      ['Fecha de exportación:', new Date().toLocaleString('es-ES'), ''],
      ['', '', ''],
      ['MÉTRICAS PRINCIPALES', '', ''],
      ['Métrica', 'Valor', 'Cambio'],
      ['Tickets Abiertos', currentStats.stats.open?.value || 0, currentStats.stats.open?.change || 'N/A'],
      ['Tickets en Progreso', currentStats.stats.inProgress?.value || 0, currentStats.stats.inProgress?.change || 'N/A'],
      ['Tickets Resueltos', currentStats.stats.resolved?.value || 0, currentStats.stats.resolved?.change || 'N/A'],
      ['Tickets Críticos', currentStats.stats.critical?.value || 0, currentStats.stats.critical?.change || 'N/A'],
      ['', '', ''],
      ['CUMPLIMIENTO SLA', '', ''],
      ['Aspecto', 'Porcentaje', ''],
      ['Cumplidos', `${currentStats.slaCompliance?.met || 0}%`, ''],
      ['En Riesgo', `${currentStats.slaCompliance?.atRisk || 0}%`, ''],
      ['Incumplidos', `${currentStats.slaCompliance?.breached || 0}%`, ''],
      ['', '', ''],
      ['SATISFACCIÓN DEL CLIENTE', '', ''],
      ['Puntuación Promedio', currentStats.satisfaction?.score || '0', ''],
      ['Total de Evaluaciones', currentStats.satisfaction?.count || 0, '']
    ]

    const generalSheet = XLSX.utils.aoa_to_sheet(generalData)
    XLSX.utils.book_append_sheet(workbook, generalSheet, 'Estadísticas Generales')

    // Hoja 2: Tickets por Categoría
    const categoryData = [
      ['Tickets por Categoría', ''],
      ['Categoría', 'Cantidad'],
      ...(currentStats.ticketsByCategory || []).map(cat => [cat.name, cat.value])
    ]

    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData)
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Por Categoría')

    // Hoja 3: Tickets por Estado
    const statusData = [
      ['Tickets por Estado', ''],
      ['Estado', 'Cantidad'],
      ...(currentStats.ticketsByStatus || []).map(status => [status.status, status.count])
    ]

    const statusSheet = XLSX.utils.aoa_to_sheet(statusData)
    XLSX.utils.book_append_sheet(workbook, statusSheet, 'Por Estado')

    // Hoja 4: Actividad Reciente
    const recentData = [
      ['Actividad Reciente (Últimos 10 tickets)', '', '', '', '', ''],
      ['Ticket', 'Título', 'Estado', 'Prioridad', 'Creado por', 'Fecha de Creación'],
      ...(currentStats.recentTickets || []).slice(0, 10).map(ticket => [
        `#${ticket.ticketNumber}`,
        ticket.title,
        ticket.status,
        ticket.priority,
        ticket.createdBy,
        new Date(ticket.createdAt).toLocaleDateString('es-ES')
      ])
    ]

    const recentSheet = XLSX.utils.aoa_to_sheet(recentData)
    XLSX.utils.book_append_sheet(workbook, recentSheet, 'Actividad Reciente')

    XLSX.writeFile(workbook, `${fileName}.xlsx`)
    alert('Archivo Excel exportado correctamente')
  }

  const exportToPDF = async (fileName: string) => {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    type JsPDFWithAutoTable = InstanceType<typeof jsPDF> & {
      lastAutoTable?: { finalY: number }
    }

    const doc: JsPDFWithAutoTable = new jsPDF() as JsPDFWithAutoTable

    // Título
    doc.setFontSize(20)
    doc.text('Estadísticas del Sistema de Tickets', 20, 20)

    // Información del período
    doc.setFontSize(12)
    doc.text(`Período: ${getPeriodLabel(period)}`, 20, 35)
    doc.text(`Fecha de exportación: ${new Date().toLocaleString('es-ES')}`, 20, 45)

    // Estadísticas principales
    doc.setFontSize(16)
    doc.text('Métricas Principales', 20, 65)

    if (!stats) return;
    const currentStats = stats
    const mainStatsData = [
      ['Métrica', 'Valor', 'Cambio'],
      ['Tickets Abiertos', (currentStats.stats.open?.value || 0).toString(), currentStats.stats.open?.change || 'N/A'],
      ['Tickets en Progreso', (currentStats.stats.inProgress?.value || 0).toString(), currentStats.stats.inProgress?.change || 'N/A'],
      ['Tickets Resueltos', (currentStats.stats.resolved?.value || 0).toString(), currentStats.stats.resolved?.change || 'N/A'],
      ['Tickets Críticos', (currentStats.stats.critical?.value || 0).toString(), currentStats.stats.critical?.change || 'N/A']
    ]

    autoTable(doc, {
      startY: 70,
      head: [mainStatsData[0]],
      body: mainStatsData.slice(1),
      theme: 'grid'
    })

    let yPosition = (doc.lastAutoTable?.finalY ?? 70) + 20

    // SLA Compliance
    doc.setFontSize(16)
    doc.text('Cumplimiento del SLA', 20, yPosition)

    const slaData = [
      ['Aspecto', 'Porcentaje'],
      ['Cumplidos', `${currentStats.slaCompliance?.met || 0}%`],
      ['En Riesgo', `${currentStats.slaCompliance?.atRisk || 0}%`],
      ['Incumplidos', `${currentStats.slaCompliance?.breached || 0}%`]
    ]

    autoTable(doc, {
      startY: yPosition + 5,
      head: [slaData[0]],
      body: slaData.slice(1),
      theme: 'grid'
    })

    yPosition = (doc.lastAutoTable?.finalY ?? yPosition) + 20

    // Satisfacción
    doc.setFontSize(16)
    doc.text('Satisfacción del Cliente', 20, yPosition)
    doc.setFontSize(12)
    doc.text(`Puntuación Promedio: ${currentStats.satisfaction?.score || '0'} / 5.0`, 20, yPosition + 10)
    doc.text(`Total de Evaluaciones: ${currentStats.satisfaction?.count || 0}`, 20, yPosition + 20)

    yPosition += 35

    // Nueva página para categorías si es necesario
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    // Tickets por Categoría
    doc.setFontSize(16)
    doc.text('Tickets por Categoría', 20, yPosition)

    const categoryData = [
      ['Categoría', 'Cantidad'],
      ...(currentStats.ticketsByCategory || []).map(cat => [cat.name, cat.value.toString()])
    ]

    autoTable(doc, {
      startY: yPosition + 5,
      head: [categoryData[0]],
      body: categoryData.slice(1),
      theme: 'grid'
    })

    yPosition = (doc.lastAutoTable?.finalY ?? yPosition) + 20

    // Nueva página si es necesario
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }

    // Tickets por Estado
    doc.setFontSize(16)
    doc.text('Tickets por Estado', 20, yPosition)

    const statusData = [
      ['Estado', 'Cantidad'],
      ...(currentStats.ticketsByStatus || []).map(status => [status.status, status.count.toString()])
    ]

    autoTable(doc, {
      startY: yPosition + 5,
      head: [statusData[0]],
      body: statusData.slice(1),
      theme: 'grid'
    })

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
    }

    doc.save(`${fileName}.pdf`)
    alert('Archivo PDF exportado correctamente')
  }

  const getPeriodLabel = (period: PeriodType) => {
    switch (period) {
      case "all": return "Todo el tiempo"
      case "1y": return "Último año"
      case "6m": return "Últimos 6 meses"
      case "3m": return "Últimos 3 meses"
      case "30d": return "Últimos 30 días"
      case "7d": return "Últimos 7 días"
      default: return "Últimos 30 días"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-500">Cargando estadísticas del sistema...</p>
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
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Estadísticas del Sistema</h1>
          <p className="text-gray-600 mt-1">Vista completa del rendimiento del sistema de tickets</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el tiempo</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => exportData(value as "pdf" | "excel" | "csv")} disabled={!stats || exporting}>
            <SelectTrigger className="w-32" disabled={!stats || exporting}>
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder={exporting ? "Exportando..." : "Exportar"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Period indicator */}
      <div className="mb-6">
        <Badge variant="outline" className="text-sm">
          Período: {getPeriodLabel(period)}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abiertos</CardTitle>
            <Ticket className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.stats?.open?.value ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.stats?.open?.change?.startsWith('+') ? '+' : ''}{stats?.stats?.open?.change ?? 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.stats?.inProgress?.value ?? 0}</div>
            <p className="text-xs text-muted-foreground">Activos actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Resueltos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.stats?.resolved?.value ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.stats?.resolved?.change?.startsWith('+') ? '+' : ''}{stats?.stats?.resolved?.change ?? 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.stats?.critical?.value ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.stats?.critical?.change?.startsWith('+') ? '+' : ''}{stats?.stats?.critical?.change ?? 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SLA and Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Cumplimiento del SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.slaCompliance?.met ?? 0}%
                </div>
                <p className="text-sm text-gray-600">SLA Cumplido</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">{stats.slaCompliance?.met ?? 0}%</div>
                  <p className="text-xs text-gray-600">Cumplidos</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-yellow-600">{stats.slaCompliance?.atRisk ?? 0}%</div>
                  <p className="text-xs text-gray-600">En Riesgo</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">{stats.slaCompliance?.breached ?? 0}%</div>
                  <p className="text-xs text-gray-600">Incumplidos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Satisfacción del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                       className={`w-6 h-6 ${star <= Math.floor(parseFloat(stats.satisfaction?.score ?? '0')) ? "text-yellow-400" : "text-gray-300"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{stats.satisfaction?.score ?? '0'}</p>
                  <p className="text-sm text-gray-600">de 5.0</p>
                </div>
              </div>
              <p className="text-gray-600">
                Basado en {stats.satisfaction?.count ?? 0} evaluaciones
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Abiertos', value: stats.stats.open?.value ?? 0, fill: '#f59e0b' },
                    { name: 'En Progreso', value: stats.stats.inProgress?.value ?? 0, fill: '#3b82f6' },
                    { name: 'Resueltos', value: stats.stats.resolved?.value ?? 0, fill: '#10b981' },
                    { name: 'Críticos', value: stats.stats.critical?.value ?? 0, fill: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                   label={({ name, percent }) => `${name}: ${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.ticketsByCategory} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Distribución por Estado Detallada</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.ticketsByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Branch/Sucursal Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Tickets por Sucursal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Información de sucursales próximamente disponible</p>
            <p className="text-sm text-gray-400 mt-2">
              Se implementará cuando se agregue soporte para múltiples sucursales
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(stats.recentTickets ?? []).slice(0, 10).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">#{ticket.ticketNumber}</span>
                    <Badge variant="outline" className={
                      ticket.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'IN_REVIEW' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-800' :
                      ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                      'bg-slate-100 text-slate-800'
                    }>
                      {ticket.status}
                    </Badge>
                    {ticket.priority === 'CRITICAL' && (
                      <Badge className="bg-red-600 text-white">CRÍTICO</Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{ticket.title}</p>
                  <p className="text-xs text-gray-600">Creado por: {ticket.createdBy}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {new Date(ticket.createdAt).toLocaleDateString('es-ES')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}