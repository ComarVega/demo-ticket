import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }
  
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }
  
  return session
}

export async function requireTechnicianOrAdmin() {
  const session = await requireAuth()
  
  if (session.user.role !== 'ADMIN' && session.user.role !== 'TECHNICIAN') {
    redirect('/dashboard')
  }
  
  return session
}