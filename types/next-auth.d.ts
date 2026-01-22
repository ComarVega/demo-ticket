import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: "USER" | "TECHNICIAN" | "ADMIN"
    name?: string | null
    email?: string | null
  }

  interface Session {
    user: {
      id: string
      role: "USER" | "TECHNICIAN" | "ADMIN"
      name?: string | null
      email?: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "USER" | "TECHNICIAN" | "ADMIN"
  }
}
