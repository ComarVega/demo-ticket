'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UserPlus } from 'lucide-react'
import { UserWithStats } from '@/types/admin'
import { UsersTable } from '@/components/admin/users-table'
import { UserForm } from '@/components/admin/user-form'

interface UserFormData {
  email: string
  name: string
  password: string
  role: 'USER' | 'TECHNICIAN' | 'ADMIN'
  department: string
  location: string
}

const initialFormData: UserFormData = {
  email: '',
  name: '',
  password: '',
  role: 'USER',
  department: '',
  location: '',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null)
  const [formData, setFormData] = useState<UserFormData>(initialFormData)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios')
      }
      
      const data: UserWithStats[] = await response.json()
      setUsers(data)
    } catch (error) {
      alert('❌ Error: No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ Usuario creado: ${data.name}`)
        setIsCreateDialogOpen(false)
        fetchUsers()
        resetForm()
      } else {
        alert(`❌ Error: ${data.error || 'No se pudo crear el usuario'}`)
      }
    } catch (error) {
      alert('❌ Error al crear usuario')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setSubmitting(true)

    try {
      const updatePayload: {
        name: string
        role: 'USER' | 'TECHNICIAN' | 'ADMIN'
        department: string
        location: string
        password?: string
      } = {
        name: formData.name,
        role: formData.role,
        department: formData.department,
        location: formData.location,
      }

      if (formData.password) {
        updatePayload.password = formData.password
      }

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ Usuario actualizado: ${data.name}`)
        setIsEditDialogOpen(false)
        fetchUsers()
        resetForm()
      } else {
        alert(`❌ Error: ${data.error || 'No se pudo actualizar el usuario'}`)
      }
    } catch (error) {
      alert('❌ Error al actualizar usuario')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleUserStatus = async (user: UserWithStats) => {
    const action = user.active ? 'desactivar' : 'activar'
    const confirmed = confirm(`¿Estás seguro de ${action} a ${user.name}?`)
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`${user.active ? '🔴' : '🟢'} Usuario ${action}do: ${user.name}`)
        fetchUsers()
      } else {
        alert(`❌ Error: ${data.error || 'No se pudo cambiar el estado'}`)
      }
    } catch (error) {
      alert('❌ Error al cambiar estado del usuario')
    }
  }

  const openEditDialog = (user: UserWithStats) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
      department: user.department || '',
      location: user.location || '',
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setSelectedUser(null)
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa la información para crear un nuevo usuario en el sistema
              </DialogDescription>
            </DialogHeader>
            <UserForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateUser}
              onCancel={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}
              loading={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Usuarios</p>
          <p className="text-3xl font-bold mt-2">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Usuarios Activos</p>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {users.filter((u) => u.active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Técnicos</p>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            {users.filter((u) => u.role === 'TECHNICIAN').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Administradores</p>
          <p className="text-3xl font-bold mt-2 text-purple-600">
            {users.filter((u) => u.role === 'ADMIN').length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-500">Cargando usuarios...</p>
          </div>
        </div>
      ) : (
        <UsersTable
          users={users}
          onEdit={openEditDialog}
          onToggleStatus={handleToggleUserStatus}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualiza la información del usuario
            </DialogDescription>
          </DialogHeader>
          <UserForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateUser}
            onCancel={() => {
              setIsEditDialogOpen(false)
              resetForm()
            }}
            isEdit={true}
            loading={submitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}