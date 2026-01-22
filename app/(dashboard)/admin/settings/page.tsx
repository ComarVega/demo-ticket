"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// ...existing code...
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Settings, FileText, Clock, Download, AlertTriangle, CheckCircle, Shield } from "lucide-react"

interface SystemSettings {
  maxFileSize: number // en MB
  slaTimes: {
    LOW: number
    MEDIUM: number
    HIGH: number
    CRITICAL: number
  }
  emailSupport: string
  allowReportsGeneration: boolean
}

interface Category {
  id?: string
  name: string
  description: string
}

const initialCategories: Category[] = [
  { name: "Soporte", description: "Soporte general" },
  { name: "Hardware", description: "Problemas físicos" },
  { name: "Software", description: "Problemas de software" },
  { name: "Red", description: "Problemas de conectividad" },
  { name: "Accesos", description: "Problemas de autenticación" },
]

const initialSettings: SystemSettings = {
  maxFileSize: 10, // 10MB por defecto
  slaTimes: {
    LOW: 72,      // 72 horas
    MEDIUM: 48,   // 48 horas
    HIGH: 24,     // 24 horas
    CRITICAL: 4,  // 4 horas
  },
  emailSupport: "soporte@tuempresa.com",
  allowReportsGeneration: true,
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [settings, setSettings] = useState<SystemSettings>(initialSettings)
  const [newCategory, setNewCategory] = useState({ name: "", description: "" })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    loadSettings()
  }, [session, status, router])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        // Si no hay configuraciones guardadas, usar valores por defecto
        setSettings(initialSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setSettings(initialSettings)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage("✅ Configuración guardada exitosamente")
        setTimeout(() => setMessage(""), 3000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setMessage(`❌ Error: ${errorData.error || 'Error al guardar'}`)
      }
    } catch (error) {
      setMessage("❌ Error de conexión al guardar la configuración")
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const addCategory = () => {
    if (!newCategory.name.trim()) return

    setCategories([...categories, { ...newCategory }])
    setNewCategory({ name: "", description: "" })
  }

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index))
  }

  const updateSLATime = (priority: keyof SystemSettings['slaTimes'], hours: number) => {
    setSettings(prev => ({
      ...prev,
      slaTimes: {
        ...prev.slaTimes,
        [priority]: hours
      }
    }))
  }

  // Mostrar loading mientras se verifica la sesión
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Redirigir si no es admin
  if (!session?.user || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configuración del Sistema</h1>
          <p className="text-slate-600 mt-1">Administra las configuraciones globales de la plataforma</p>
        </div>
      </div>

      {message && (
        <Alert className={message.includes("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Configuración de Archivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxFileSize">Tamaño máximo de archivo (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                min="1"
                max="100"
                value={settings.maxFileSize}
                onChange={(e) => setSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) || 10 }))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Máximo {settings.maxFileSize}MB por archivo adjunto
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SLA Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Tiempos de SLA (Horas)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settings.slaTimes).map(([priority, hours]) => (
              <div key={priority}>
                <Label className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-800'
                    }
                  >
                    {priority}
                  </Badge>
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="168" // 1 semana
                  value={hours}
                  onChange={(e) => updateSLATime(priority as keyof SystemSettings['slaTimes'], parseInt(e.target.value) || 24)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reports Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Configuración de Reportes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Permitir generación de reportes</Label>
                <p className="text-sm text-slate-500">Los usuarios pueden generar reportes en &quot;Mis Reportes&quot;</p>
              </div>
              <Button
                variant={settings.allowReportsGeneration ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings(prev => ({ ...prev, allowReportsGeneration: !prev.allowReportsGeneration }))}
              >
                {settings.allowReportsGeneration ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Habilitado
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Deshabilitado
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Email */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Soporte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="supportEmail">Email de soporte</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.emailSupport}
                onChange={(e) => setSettings(prev => ({ ...prev, emailSupport: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Email que se mostrará como contacto de soporte
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías de Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <div key={i} className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{cat.name}</p>
                    <p className="text-sm text-slate-600 mt-1">{cat.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeCategory(i)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium">Agregar nueva categoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryName">Nombre</Label>
                <Input
                  id="categoryName"
                  placeholder="Ej: Seguridad"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="categoryDesc">Descripción</Label>
                <Input
                  id="categoryDesc"
                  placeholder="Breve descripción"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={addCategory} disabled={!newCategory.name.trim()}>
              Agregar Categoría
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={loading} className="px-8">
          {loading ? "Guardando..." : "Guardar Todas las Configuraciones"}
        </Button>
      </div>
    </div>
  )
}