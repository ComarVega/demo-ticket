export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'TECHNICIAN' | 'ADMIN'
  department?: string | null
  location?: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: string
  content: string
  isInternal: boolean
  ticketId: string
  authorId: string
  author: {
    id: string
    name: string
    email: string
  }
  createdAt: Date
}

export interface Attachment {
  id: string
  filename: string
  url: string
  size: number
  mimeType: string
  ticketId: string
  uploadedAt: Date
}

export interface Ticket {
  id: string
  ticketNumber: number
  title: string
  description: string
  status: TicketStatus
  priority: Priority
  category: Category
  type: TicketType
  createdById: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  assignedToId?: string | null
  assignedTo?: {
    id: string
    name: string
    email: string
  } | null
  location?: string | null
  device?: string | null
  os?: string | null
  isOperational?: boolean | null
  attachments?: Attachment[]
  comments?: Comment[]
  solution?: string | null
  rootCause?: string | null
  timeSpent?: number | null
  requiresFollowup: boolean
  rating?: number | null
  feedback?: string | null
  slaDeadline?: Date | null
  resolvedAt?: Date | null
  closedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export type TicketStatus = 
  | 'OPEN'
  | 'IN_REVIEW'
  | 'WAITING_USER'
  | 'ASSIGNED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type Category = 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'ACCESS' | 'OTHER'

export type TicketType = 'INCIDENT' | 'REQUEST' | 'MAINTENANCE'

export interface TicketFilters {
  status?: TicketStatus
  priority?: Priority
  category?: Category
  search?: string
}

export interface ExportMetrics {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  avgResolutionTime?: number
  resolutionRate?: number
  byCategory?: Record<string, number>
  byPriority?: Record<string, number>
}