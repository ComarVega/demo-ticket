export interface UserWithStats {
  id: string
  email: string
  name: string
  role: 'USER' | 'TECHNICIAN' | 'ADMIN'
  department: string | null
  location: string | null
  active: boolean
  createdAt: Date | string
  _count?: {
    ticketsCreated: number
    ticketsAssigned: number
    comments?: number
  }
}

export interface CreateUserInput {
  email: string
  name: string
  password: string
  role: 'USER' | 'TECHNICIAN' | 'ADMIN'
  department?: string
  location?: string
}

export interface UpdateUserInput {
  name?: string
  role?: 'USER' | 'TECHNICIAN' | 'ADMIN'
  department?: string
  location?: string
  active?: boolean
  password?: string
}

export interface SystemStats {
  users: {
    total: number
    active: number
    byRole: Array<{ role: string; _count: number }>
  }
  tickets: {
    total: number
    byStatus: Array<{ status: string; _count: number }>
    byPriority: Array<{ priority: string; _count: number }>
    byCategory: Array<{ category: string; _count: number }>
    recentResolved: number
    avgResolutionTimeHours: number
  }
  topTechnicians: Array<{
    id: string
    name: string
    _count: {
      ticketsAssigned: number
    }
  }>
}