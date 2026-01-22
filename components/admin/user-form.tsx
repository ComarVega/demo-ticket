'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserFormData {
  email: string
  name: string
  password: string
  role: 'USER' | 'TECHNICIAN' | 'ADMIN'
  department: string
  location: string
}

interface UserFormProps {
  formData: UserFormData
  setFormData: (data: UserFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEdit?: boolean
  loading?: boolean
}

export function UserForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEdit = false,
  loading = false,
}: UserFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required={!isEdit}
          disabled={isEdit || loading}
          className={isEdit ? 'bg-gray-50' : ''}
        />
        {isEdit && (
          <p className="text-xs text-gray-500 mt-1">
            El email no puede ser modificado
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="name">Nombre completo *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="password">
          {isEdit ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required={!isEdit}
          disabled={loading}
          placeholder={isEdit ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'}
        />
      </div>

      <div>
        <Label htmlFor="role">Rol *</Label>
        <Select
          value={formData.role}
          onValueChange={(value: 'USER' | 'TECHNICIAN' | 'ADMIN') =>
            setFormData({ ...formData, role: value })
          }
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">Usuario</SelectItem>
            <SelectItem value="TECHNICIAN">Técnico</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="department">Departamento</Label>
        <Input
          id="department"
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
          placeholder="Ej: IT, Ventas, Marketing"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="location">Ubicación</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Ej: Oficina Central, Sucursal Norte"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  )
}