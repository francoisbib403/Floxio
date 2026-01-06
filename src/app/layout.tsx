import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/providers/AuthProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Floxio",
  description: "Modern Next.js scaffold optimized for AI-powered development Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Floxio", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Ginov", "n8n", "React"],
  authors: [{ name: "Francois Bib" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Floxio",
    description: "",
    url: "",
    siteName: "",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "",
    description: "",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
