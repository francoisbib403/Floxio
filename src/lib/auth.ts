import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { compare, hash } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          // Auto-create user if they don't exist (Sign Up flow)
          const hashedPassword = await hash(credentials.password, 12)
          const newUser = await db.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0],
              password: hashedPassword,
            },
          })
          return { id: newUser.id, email: newUser.email, name: newUser.name }
        }

        // Verify password for existing users
        if (user.password) {
          const isValid = await compare(credentials.password, user.password)
          if (!isValid) {
            throw new Error("Invalid credentials")
          }
        }

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects properly for production environment
      // If it's a relative URL, prepend the baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // If it's already an absolute URL, use it
      if (url.startsWith("http")) {
        return url
      }
      // Default to baseUrl
      return baseUrl
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || token.id || ""
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
}
