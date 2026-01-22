import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin"
import { extractRouterConfig } from "uploadthing/server"
import { ourFileRouter } from "@/app/api/uploadthing/core"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Tickets IT",
  description: "Sistema de gestión de tickets de soporte técnico",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <NextSSRPlugin
          /**
           * The `extractRouterConfig` will extract the route config from the
           * router to prevent additional lookup-requests
           */
          routerConfig={extractRouterConfig(ourFileRouter)}
        />
        <Providers>
          <div style={{
            background: '#fffbe6',
            color: '#ad6800',
            borderBottom: '1px solid #ffe58f',
            padding: '10px 0',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1rem',
            letterSpacing: '0.5px',
            zIndex: 1000
          }}>
            ⚠ Demo environment – data resets automatically
          </div>
          {children}
        </Providers>
      </body>
    </html>
  )
}
