import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AccessibilityToolbar from "@/components/accessibility/accessibility-toolbar"
import SiteNavbar from "@/components/site-navbar"
import { createClient } from "@/lib/supabase/server"
export const dynamic = "force-dynamic"

const googleSansCode = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-google-sans-code",
})

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "inspiraT - Plataforma de Aprendizaje Personalizado",
  description:
    "Plataforma de aprendizaje impulsada por IA que crea rutas de estudio personalizadas basadas en tu nivel y objetivos. Aprende eficientemente con contenido adaptativo y características de accesibilidad.",
  keywords: ["learning", "education", "AI", "personalized", "courses", "accessibility"],
  generator: "v0.app",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <html lang="es" className={`${googleSansCode.variable} ${inter.variable} antialiased`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#090225" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </head>
      <body className="font-sans bg-background text-text min-h-screen">
        <div id="skip-link" className="sr-only">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded z-50"
          >
            Skip to main content
          </a>
        </div>

  <SiteNavbar user={user} />
  <main id="main-content" role="main">
          {children}
        </main>

        <AccessibilityToolbar />

        <div id="live-region" aria-live="polite" aria-atomic="true" className="sr-only"></div>
      </body>
    </html>
  )
}
