# 🚀 Guía de Deployment - Sistema de Tickets

## 📋 Prerrequisitos

- Node.js 18+ instalado
- PostgreSQL database
- Cuenta en Vercel/Netlify o servidor VPS
- Dominio configurado (recomendado para producción)

## 🔒 Configuración de Seguridad

### 1. Variables de Entorno

Copia el archivo `env.template` a `.env` y configura las variables:

```bash
cp env.template .env
```

Variables críticas requeridas:
```env
# Base de datos (PostgreSQL requerido)
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth (CRÍTICO)
NEXTAUTH_URL="https://tudominio.com"
NEXTAUTH_SECRET="genera-una-clave-segura-con-openssl-rand-base64-32"

# UploadThing (para archivos)
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="tu-app-id"
```

### 2. Generar Claves Seguras

```bash
# Generar NEXTAUTH_SECRET
openssl rand -base64 32

# Generar otras claves aleatorias
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Verificación de Seguridad

Antes de cada deployment, ejecuta:

```bash
npm run security-check
```

Este comando verifica:
- ✅ Variables de entorno configuradas
- ✅ Headers de seguridad en next.config.ts
- ✅ Archivos sensibles no expuestos
- ✅ Dependencias actualizadas

## 🌐 Opciones de Deployment

### Opción 1: Vercel (Recomendado)

#### 1. Instalar Vercel CLI
```bash
npm i -g vercel
```

#### 2. Login en Vercel
```bash
vercel login
```

#### 3. Configurar proyecto
```bash
vercel --prod
```

#### 4. Configurar variables de entorno en Vercel Dashboard
- Ve a tu proyecto en Vercel
- Settings → Environment Variables
- Agrega todas las variables del `.env`

#### 5. Configurar dominio personalizado
```bash
vercel domains add tudominio.com
```

### Opción 2: VPS con Docker

#### 1. Preparar servidor
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y
```

#### 2. Configurar base de datos
```bash
sudo -u postgres psql
CREATE DATABASE ticket_system;
CREATE USER ticket_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE ticket_system TO ticket_user;
\q
```

#### 3. Desplegar aplicación
```bash
# Clonar repositorio
git clone https://github.com/tuusuario/ticket-system.git
cd ticket-system

# Instalar dependencias
npm ci --production

# Generar Prisma client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Build de producción
npm run build

# Iniciar con PM2
npm install -g pm2
pm2 start npm --name "ticket-system" -- start
pm2 startup
pm2 save
```

#### 4. Configurar Nginx (Reverse Proxy)
```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. Configurar SSL con Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tudominio.com
```

### Opción 3: Railway

#### 1. Conectar repositorio
- Ve a [Railway.app](https://railway.app)
- Conecta tu repositorio de GitHub
- Railway detectará automáticamente Next.js

#### 2. Configurar variables de entorno
- En el dashboard de Railway, ve a Variables
- Agrega todas las variables del `.env`

#### 3. Configurar dominio
- En Settings → Domains
- Agrega tu dominio personalizado

## 🔍 Monitoreo y Mantenimiento

### Health Check
La aplicación incluye un endpoint de health check:
```
GET /api/health
```

### Logs
```bash
# Ver logs de PM2
pm2 logs ticket-system

# Ver logs de Vercel
vercel logs
```

### Backup de Base de Datos
```bash
# Backup PostgreSQL
pg_dump ticket_system > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
psql ticket_system < backup.sql
```

## 🚨 Checklist Pre-Deployment

- [ ] Variables de entorno configuradas correctamente
- [ ] `npm run security-check` pasa sin errores
- [ ] Base de datos PostgreSQL configurada
- [ ] UploadThing configurado (si usas archivos)
- [ ] Dominio SSL configurado
- [ ] Headers de seguridad activos
- [ ] Rate limiting configurado
- [ ] Backup de base de datos realizado

## 🔧 Troubleshooting

### Error de Build
```bash
# Limpiar cache de Next.js
rm -rf .next
npm run build
```

### Problemas de Base de Datos
```bash
# Verificar conexión
npx prisma studio

# Ejecutar migraciones
npx prisma migrate deploy
```

### Problemas de CORS
Asegúrate de que `NEXTAUTH_URL` esté configurado correctamente en producción.

## 📞 Soporte

Si encuentras problemas durante el deployment, verifica:
1. Logs de la aplicación (`npm run logs`)
2. Variables de entorno
3. Conexión a base de datos
4. Configuración de dominio

## 🔐 Actualizaciones de Seguridad

Mantén las dependencias actualizadas:
```bash
npm audit
npm update
```

Revisa regularmente:
- [Next.js Security Updates](https://nextjs.org/docs/guides/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)