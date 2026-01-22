import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Usuario demo fijo
        if (
          credentials?.email === "demo@ecotechcare.ca" &&
          credentials?.password === "demo"
        ) {
          return {
            id: "demo-user",
            email: "demo@ecotechcare.ca",
            role: "USER"
          }
        }
        return null
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hora
    updateAge: 60 * 30, // Actualizar cada 30 minutos
  },

  jwt: {
    maxAge: 60 * 60, // 1 hora
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session }) {
      session.demoKey = crypto.randomUUID()
      return session
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
}