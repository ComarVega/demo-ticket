"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  User,
  Mail,
  MapPin,
  Briefcase,
  CheckCircle2,
  XCircle,
  Activity,
  Loader2
} from "lucide-react"
import { useSession } from "next-auth/react"

/* ===================== ROLES ===================== */

const roleConfig = {
  ADMIN: {
    label: "Administrador",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: ShieldCheck,
    description: "Acceso total al sistema",
  },
  TECHNICIAN: {
    label: "Técnico",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Shield,
    description: "Puede gestionar tickets",
  },
  USER: {
    label: "Usuario",
    color: "bg-slate-100 text-slate-800 border-slate-200",
    icon: User,
    description: "Puede crear tickets",
  },
} as const

type UserRole = keyof typeof roleConfig

/* ===================== TYPES ===================== */

interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string
  location?: string
  active: boolean
  createdAt: string
  _count?: {
    ticketsCreated: number
    ticketsAssigned: number
  }
}

interface FormUser {
  name: string
  email: string
  role: UserRole
  department: string
  location: string
  password?: string
}

/* ===================== COMPONENT ===================== */

export default function UsersManagementPage() {
  const { data: session } = useSession()

  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [mounted, setMounted] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all")
  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">("all")

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)

  const [formUser, setFormUser] = useState<FormUser>({
    name: "",
    email: "",
    role: "USER",
    department: "",
    location: "",
    password: "",
  })

  /* ===================== EFFECTS ===================== */

  useEffect(() => {
    setMounted(true)
    fetchUsers()
  }, [])

  /* ===================== API ===================== */

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Error fetching users")
      setUsers(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formUser),
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error ?? "Error al crear usuario")
      return
    }

    setIsCreateDialogOpen(false)
    fetchUsers()
    setFormUser({
      name: "",
      email: "",
      role: "USER",
      department: "",
      location: "",
      password: "",
    })
  }

  const handleEditUser = (user: AppUser) => {
    setSelectedUser(user)
    setFormUser({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department ?? "",
      location: user.location ?? "",
      password: "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    const updateData: Partial<FormUser> = { ...formUser }
    if (!updateData.password) delete updateData.password

    const res = await fetch(`/api/users?id=${selectedUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    })

    if (!res.ok) {
      const err = await res.json()
      alert(err.error ?? "Error al actualizar usuario")
      return
    }

    setIsEditDialogOpen(false)
    setSelectedUser(null)
    fetchUsers()
  }

  const handleToggleStatus = async (user: AppUser) => {
    await fetch(`/api/users?id=${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    })
    fetchUsers()
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Eliminar este usuario?")) return
    await fetch(`/api/users?id=${id}`, { method: "DELETE" })
    fetchUsers()
  }

  /* ===================== FILTERS ===================== */

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchRole = roleFilter === "all" || u.role === roleFilter
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.active) ||
      (statusFilter === "inactive" && !u.active)

    return matchSearch && matchRole && matchStatus
  })

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    technicians: users.filter((u) => u.role === "TECHNICIAN").length,
    users: users.filter((u) => u.role === "USER").length,
    active: users.filter((u) => u.active).length,
  }

  /* ===================== RENDER ===================== */

  if (!mounted) return null

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-slate-600 mt-1">
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Ingresa la información del nuevo usuario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={formUser.name}
                  onChange={(e) => setFormUser({...formUser, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan.perez@company.com"
                  value={formUser.email}
                  onChange={(e) => setFormUser({...formUser, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formUser.password}
                  onChange={(e) => setFormUser({...formUser, password: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol *</Label>
                <Select value={formUser.role} onValueChange={(value) => setFormUser({...formUser, role: value as UserRole})}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleConfig).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{val.label}</div>
                          <div className="text-xs text-slate-500">{val.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    placeholder="Ventas"
                    value={formUser.department}
                    onChange={(e) => setFormUser({...formUser, department: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    placeholder="Oficina Central"
                    value={formUser.location}
                    onChange={(e) => setFormUser({...formUser, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleCreateUser}>
                  Crear Usuario
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Modifica la información del usuario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre Completo *</Label>
                <Input
                  id="edit-name"
                  placeholder="Juan Pérez"
                  value={formUser.name}
                  onChange={(e) => setFormUser({...formUser, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="juan.perez@company.com"
                  value={formUser.email}
                  onChange={(e) => setFormUser({...formUser, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Dejar en blanco para no cambiar"
                  value={formUser.password}
                  onChange={(e) => setFormUser({...formUser, password: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Rol *</Label>
                <Select value={formUser.role} onValueChange={(value) => setFormUser({...formUser, role: value as UserRole})}>
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleConfig).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{val.label}</div>
                          <div className="text-xs text-slate-500">{val.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Departamento</Label>
                  <Input
                    id="edit-department"
                    placeholder="Ventas"
                    value={formUser.department}
                    onChange={(e) => setFormUser({...formUser, department: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-location">Ubicación</Label>
                  <Input
                    id="edit-location"
                    placeholder="Oficina Central"
                    value={formUser.location}
                    onChange={(e) => setFormUser({...formUser, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleUpdateUser}>
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Admins</p>
                <p className="text-2xl font-bold text-slate-900">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Técnicos</p>
                <p className="text-2xl font-bold text-slate-900">{stats.technicians}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Usuarios</p>
                <p className="text-2xl font-bold text-slate-900">{stats.users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Activos</p>
                <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "all" | UserRole)}>
              <SelectTrigger className="w-full sm:w-45">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {Object.entries(roleConfig).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}>
              <SelectTrigger className="w-full sm:w-45">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-slate-500">
              No se encontraron usuarios
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const userRole = user.role as keyof typeof roleConfig
            const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
            
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-slate-900">{user.name}</h3>
                        <Badge className={`${roleConfig[userRole].color} border`}>
                          {roleConfig[userRole].label}
                        </Badge>
                        {user.active ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 border">
                            Activo
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-800 border-slate-200 border">
                            Inactivo
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.department && (
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>{user.department}</span>
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{user.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-xs">
                            <strong>{user._count?.ticketsCreated || 0}</strong> creados
                          </span>
                          {(user._count?.ticketsAssigned || 0) > 0 && (
                            <span className="text-xs">
                              <strong>{user._count?.ticketsAssigned}</strong> asignados
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                        className={user.active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                      >
                        {user.active ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={session?.user?.id === user.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}