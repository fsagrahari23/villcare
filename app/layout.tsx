import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0066cc'
}

export const metadata: Metadata = {
  title: 'VoiceCare AI - Voice-First Medical Triage Platform',
  description: 'Multilingual, voice-enabled medical triage platform for rural and low-literacy users. Get instant AI-powered health assessments with Gemini and Sarvam AI integration.',
  generator: 'v0.app',
  keywords: 'medical triage, voice health, rural healthcare, AI diagnosis, telemedicine',
  authors: [{ name: 'VoiceCare AI Team' }],
  openGraph: {
    title: 'VoiceCare AI',
    description: 'Healthcare at your voice',
    type: 'website',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
