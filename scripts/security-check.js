#!/usr/bin/env node

/**
 * Script de verificación de seguridad antes del deployment
 */

const fs = require('fs')
const path = require('path')

console.log('🔒 Verificando configuración de seguridad...\n')

const issues = []
const warnings = []

// Verificar archivo .env
try {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    issues.push('❌ Archivo .env no encontrado')
  } else {
    const envContent = fs.readFileSync(envPath, 'utf8')

    // Verificar variables críticas
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]

    requiredVars.forEach(varName => {
      if (!envContent.includes(`${varName}=`)) {
        issues.push(`❌ Variable de entorno faltante: ${varName}`)
      } else {
        // Verificar que no sean valores por defecto
        const lines = envContent.split('\n')
        const varLine = lines.find(line => line.startsWith(`${varName}=`))
        if (varLine && (varLine.includes('your-') || varLine.includes('change-this'))) {
          warnings.push(`⚠️  Variable con valor por defecto: ${varName}`)
        }
      }
    })

    // Verificar que no haya contraseñas en texto plano
    if (envContent.includes('password') && !envContent.includes('ENCRYPTED_')) {
      warnings.push('⚠️  Posibles contraseñas en texto plano detectadas')
    }
  }
} catch (error) {
  issues.push('❌ Error leyendo archivo .env')
}

// Verificar next.config.ts
try {
  const configPath = path.join(process.cwd(), 'next.config.ts')
  if (!fs.existsSync(configPath)) {
    warnings.push('⚠️  Archivo next.config.ts no encontrado')
  } else {
    const configContent = fs.readFileSync(configPath, 'utf8')

    const securityHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Strict-Transport-Security'
    ]

    securityHeaders.forEach(header => {
      if (!configContent.includes(header)) {
        warnings.push(`⚠️  Header de seguridad faltante: ${header}`)
      }
    })
  }
} catch (error) {
  warnings.push('⚠️  Error leyendo next.config.ts')
}

// Verificar dependencias vulnerables
try {
  const packagePath = path.join(process.cwd(), 'package.json')
  if (fs.existsSync(packagePath)) {
    const packageContent = fs.readFileSync(packagePath, 'utf8')
    const packageJson = JSON.parse(packageContent)

    // Verificar versiones críticas
    const criticalDeps = {
      'next': '16.1.2',
      'next-auth': '^4.24.13',
      'prisma': '^6.19.2'
    }

    Object.entries(criticalDeps).forEach(([dep, expected]) => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        const installed = packageJson.dependencies[dep]
        if (installed !== expected && !installed.includes(expected.replace('^', ''))) {
          warnings.push(`⚠️  Versión de dependencia potencialmente desactualizada: ${dep}`)
        }
      }
    })
  }
} catch (error) {
  warnings.push('⚠️  Error leyendo package.json')
}

// Verificar archivos sensibles
const sensitiveFiles = [
  '.env.local',
  '.env.development',
  '.env.production',
  'config/database.js',
  'config/keys.js'
]

sensitiveFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    issues.push(`❌ Archivo sensible encontrado: ${file}`)
  }
})

// Verificar permisos de archivos
try {
  const gitignorePath = path.join(process.cwd(), '.gitignore')
  if (!fs.existsSync(gitignorePath)) {
    issues.push('❌ Archivo .gitignore no encontrado')
  } else {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')

    const requiredIgnores = [
      '.env',
      '.env.local',
      '.env.*.local',
      'node_modules',
      '.next',
      'dist'
    ]

    requiredIgnores.forEach(ignore => {
      if (!gitignoreContent.includes(ignore)) {
        warnings.push(`⚠️  Archivo/patrón no ignorado en git: ${ignore}`)
      }
    })
  }
} catch (error) {
  warnings.push('⚠️  Error leyendo .gitignore')
}

// Resultados
console.log('📋 Resultados de la verificación:\n')

if (issues.length > 0) {
  console.log('🚨 PROBLEMAS CRÍTICOS:')
  issues.forEach(issue => console.log(`   ${issue}`))
  console.log('')
}

if (warnings.length > 0) {
  console.log('⚠️  ADVERTENCIAS:')
  warnings.forEach(warning => console.log(`   ${warning}`))
  console.log('')
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ ¡Todo se ve bien! La aplicación está lista para deployment.')
} else {
  console.log('🔧 Recomendaciones:')
  console.log('   1. Revisa las variables de entorno')
  console.log('   2. Configura headers de seguridad en next.config.ts')
  console.log('   3. Actualiza dependencias vulnerables')
  console.log('   4. Asegúrate de que .gitignore excluya archivos sensibles')
  console.log('')
  console.log('🛡️  Documentación de seguridad: https://nextjs.org/docs/guides/security')
}

if (issues.length > 0) {
  console.log('\n❌ DEPLOYMENT BLOQUEADO: Corrige los problemas críticos antes de continuar.')
  process.exit(1)
} else {
  console.log('\n✅ DEPLOYMENT APROBADO: Puedes continuar con el deployment.')
}