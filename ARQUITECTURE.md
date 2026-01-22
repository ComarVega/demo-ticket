# Arquitectura del Sistema de Tickets

## Páginas Principales
- `/login` - Login
- `/dashboard` - Dashboard principal
- `/tickets` - Lista de tickets
- `/tickets/new` - Crear ticket
- `/tickets/[id]` - Ver ticket
- `/my-tickets` - Mis tickets
- `/users` - Gestión usuarios (Admin)
- `/settings` - Configuración (Admin)
- `/reports` - Reportes (Admin)

## APIs
- `/api/auth/[...nextauth]` - Autenticación
- `/api/tickets` - CRUD tickets
- `/api/users` - CRUD usuarios
- `/api/dashboard/stats` - Estadísticas
- `/api/settings` - Configuración