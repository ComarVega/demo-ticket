"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/tickets/FileUpload"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react"

const categories = [
  { value: "HARDWARE", label: "Hardware", description: "Problemas con equipos físicos" },
  { value: "SOFTWARE", label: "Software", description: "Aplicaciones y programas" },
  { value: "NETWORK", label: "Red", description: "Conectividad e internet" },
  { value: "ACCESS", label: "Accesos", description: "Permisos y credenciales" },
  { value: "OTHER", label: "Otros", description: "Otros temas" }
]

const priorities = [
  { value: "LOW", label: "Baja", color: "slate", description: "No urgente, puede esperar" },
  { value: "MEDIUM", label: "Media", color: "blue", description: "Importante, resolver pronto" },
  { value: "HIGH", label: "Alta", color: "orange", description: "Urgente, afecta productividad" },
  { value: "CRITICAL", label: "Crítica", color: "red", description: "Emergencia, bloquea trabajo" }
]

const ticketTypes = [
  { value: "INCIDENT", label: "Incidente", description: "Algo no funciona" },
  { value: "REQUEST", label: "Solicitud", description: "Petición de servicio" },
  { value: "MAINTENANCE", label: "Mantenimiento", description: "Servicio programado" }
]

const locations = [
  "Oficina Central",
  "Sucursal Norte",
  "Sucursal Sur",
  "Home Office",
  "Remoto"
]

export default function CreateTicketPage() {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; size: number }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdTicketNumber, setCreatedTicketNumber] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    type: "",
    location: "",
    device: "",
    os: "",
    isOperational: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }


  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          type: formData.type,
          location: formData.location || undefined,
          device: formData.device || undefined,
          os: formData.os || undefined,
          isOperational: formData.isOperational === "yes" ? true : formData.isOperational === "no" ? false : undefined,
          attachments: uploadedFiles
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedTicketNumber(data.ticketNumber)
        setIsSubmitting(false)
        setShowSuccess(true)
        
        // Reset form después de 3 segundos
        setTimeout(() => {
          setShowSuccess(false)
          setFormData({
            title: "",
            description: "",
            category: "",
            priority: "",
            type: "",
            location: "",
            device: "",
            os: "",
            isOperational: ""
          })
          setUploadedFiles([])
        }, 3000)
      } else {
        const errorData = await response.json()
        setIsSubmitting(false)
        console.error('Error creating ticket (DATA):', JSON.stringify(errorData, null, 2))
        alert(`Error: ${errorData.error || errorData.message || 'No se pudo crear el ticket'}`)
      }
    } catch (error) {
      setIsSubmitting(false)
      console.error('Error submitting ticket:', error)
      alert("Error de conexión al servidor")
    }
  }

  const isFormValid = formData.title && formData.description && formData.category && 
                      formData.priority && formData.type

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">¡Ticket Creado Exitosamente!</h2>
            <p className="text-green-800 mb-4">
              Tu ticket ha sido registrado con el número <strong className="font-mono">#TK-{createdTicketNumber}</strong>
            </p>
            <p className="text-sm text-green-700">
              Recibirás una notificación por email cuando un técnico lo tome.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="gap-2 mb-4"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">Crear Nuevo Ticket</h1>
        <p className="text-slate-600 mt-1">
          Completa el formulario para reportar un problema o hacer una solicitud
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Describe el problema o solicitud</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Título del Ticket <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Ej: Laptop no enciende después de actualización"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-slate-500">
                  Sé específico y conciso
                </p>
              </div>


              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripción Detallada <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe el problema con el mayor detalle posible:&#10;- ¿Qué estabas haciendo cuando ocurrió?&#10;- ¿Qué esperabas que pasara?&#10;- ¿Qué pasó en realidad?&#10;- ¿Has intentado algo para solucionarlo?"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="min-h-37.5 resize-none"
                />
                <p className="text-xs text-slate-500">
                  {formData.description.length}/1000 caracteres
                </p>
              </div>

              {/* Categoría y Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Categoría <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger id="category" className="h-11">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div>
                            <div className="font-medium">{cat.label}</div>
                            <div className="text-xs text-slate-500">{cat.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">
                    Tipo <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger id="type" className="h-11">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-slate-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prioridad */}
              <div className="space-y-2">
                <Label>
                  Prioridad <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {priorities.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => handleInputChange("priority", priority.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        formData.priority === priority.value
                          ? `border-${priority.color}-500 bg-${priority.color}-50`
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`font-medium text-sm ${
                        formData.priority === priority.value ? `text-${priority.color}-700` : "text-slate-900"
                      }`}>
                        {priority.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{priority.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles Adicionales */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles Adicionales</CardTitle>
              <CardDescription>Información que ayudará a resolver el ticket más rápido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ubicación y Dispositivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                    <SelectTrigger id="location" className="h-11">
                      <SelectValue placeholder="¿Dónde estás?" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="device">Dispositivo Afectado</Label>
                  <Input
                    id="device"
                    placeholder="Ej: Laptop Dell Latitude 5520"
                    value={formData.device}
                    onChange={(e) => handleInputChange("device", e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* SO y Estado Operativo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="os">Sistema Operativo</Label>
                  <Input
                    id="os"
                    placeholder="Ej: Windows 11, macOS Sonoma"
                    value={formData.os}
                    onChange={(e) => handleInputChange("os", e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>¿El equipo está operativo?</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange("isOperational", "yes")}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        formData.isOperational === "yes"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      Sí, funciona
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("isOperational", "no")}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        formData.isOperational === "no"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      No, bloqueado
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Adjuntos */}
          <Card>
            <CardHeader>
              <CardTitle>Archivos Adjuntos</CardTitle>
              <CardDescription>Capturas de pantalla, logs o documentos (máx. 5 archivos, 10MB c/u)</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload 
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-slate-600">Categoría</p>
                    <p className="font-medium text-slate-900">
                      {formData.category ? categories.find(c => c.value === formData.category)?.label : "No seleccionada"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-slate-600">Tipo</p>
                    <p className="font-medium text-slate-900">
                      {formData.type ? ticketTypes.find(t => t.value === formData.type)?.label : "No seleccionado"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-slate-600">Prioridad</p>
                    <p className="font-medium text-slate-900">
                      {formData.priority ? priorities.find(p => p.value === formData.priority)?.label : "No seleccionada"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-slate-700">Adjuntos</p>
                    <p className="font-medium text-slate-900">{uploadedFiles.length} archivo(s)</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-3">
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className="w-full h-11"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando ticket...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Crear Ticket
                    </>
                  )}
                </Button>
                
                {!isFormValid && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      Completa los campos requeridos para crear el ticket
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Consejos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-900">
              <p>• Sé específico en el título</p>
              <p>• Incluye pasos para reproducir</p>
              <p>• Adjunta capturas si es posible</p>
              <p>• Indica si es bloqueante</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}